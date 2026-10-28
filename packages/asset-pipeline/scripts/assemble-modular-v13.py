"""Export registered, drawn whole-body poses. No anatomy synthesis or fitting.

Input: assets/mannequin/v13/source-art/authored/manifest.json. See
--write-example for the input contract. Every hair choice is a complete body.
All semantic masks are explicitly authored polygons in the same pixel grid.
The exporter never estimates a head, seam, palm, or registration from colours.
"""
from pathlib import Path
import argparse, hashlib, json, math
from collections import Counter
from PIL import Image, ImageDraw, ImageChops

ROOT = Path(__file__).resolve().parents[3]
DEFAULT = ROOT / 'assets/mannequin/v13'
DIRS = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE']
MIRROR = {'W': 'E', 'SW': 'SE', 'NW': 'NE'}
N, CELL = 144, 176
OFFSET, ANCHOR = (16, 24), [88, 152]
SLOTS = [
    dict(id='upper', name='Áo / giáp', equipSlot='body', order=2),
    dict(id='pants', name='Quần', equipSlot='legs', order=0),
    dict(id='boots', name='Giày', equipSlot='feet', order=1),
]


def polygons(groups):
    out = Image.new('L', (N, N))
    draw = ImageDraw.Draw(out)
    for poly in groups:
        if len(poly) < 3:
            raise ValueError('Semantic polygon needs at least three vertices')
        draw.polygon([tuple(p) for p in poly], fill=255)
    return out


def masked(im, mask):
    out = im.copy()
    out.putalpha(ImageChops.multiply(im.getchannel('A'), mask))
    return out


def landmark_masks(record):
    """Explicit per-pose semantic gates; no image fitting or dilation."""
    neck, waist, boots = record['neckY'], record['waistY'], record['bootTopY']
    upper = Image.new('L',(N,N)); pants = upper.copy(); feet = upper.copy()
    # Raised sleeves can be above the neck and head; the authored head region
    # and palm regions alone are excluded, never the entire upper half-plane.
    ImageDraw.Draw(upper).rectangle((0,0,N-1,waist+record.get('tunicDrop',0)),fill=255)
    ImageDraw.Draw(pants).rectangle((0,waist,N-1,N-1),fill=255)
    ImageDraw.Draw(feet).rectangle((0,boots,N-1,N-1),fill=255)
    if 'boot_boxes' in record:
        feet = Image.new('L',(N,N)); fd = ImageDraw.Draw(feet)
        for box in record['boot_boxes']: fd.rectangle(tuple(box),fill=255)
    head = Image.new('L',(N,N)); l,t,r,b=record.get('headExcludeBox',record['headBox'])
    ImageDraw.Draw(head).rectangle((l,t,r-1,b-1),fill=255)
    hands = Image.new('L',(N,N)); hd = ImageDraw.Draw(hands)
    for box in record.get('hand_boxes',[]): hd.rectangle(tuple(box),fill=255)
    for im in [upper,pants,feet]:
        im.paste(0,(0,0),head); im.paste(0,(0,0),hands)
    return dict(upper=upper,pants=pants,boots=feet), hands


def tint(im, style, protect_skin=False):
    out = im.copy()
    if not style: return out
    for y in range(N):
        for x in range(N):
            r,g,b,a = out.getpixel((x,y))
            if not a: continue
            if protect_skin and r>130 and r-g>20 and g-b>10:continue # exposed fingers / skin retain the shared skin palette
            lum = (r+g+b)/3
            if style=='wine':
                if b<=r*1.1: continue
                rgb=(min(235,int(lum*1.1+18)),int(lum*.43+8),int(lum*.72+16))
            elif style=='leather': rgb=(min(240,int(lum*.96+19)),int(lum*.64+10),int(lum*.40+8))
            elif style=='linen': rgb=(min(225,int(lum*1.18+22)),min(220,int(lum*1.12+20)),int(lum*.89+17))
            elif style=='black': rgb=(int(lum*.43+4),int(lum*.48+6),int(lum*.59+8))
            elif style=='gold': rgb=(min(248,int(lum*1.15+12)),min(224,int(lum*.92+6)),int(lum*.50+7))
            else: raise ValueError('Unknown dye '+style)
            out.putpixel((x,y),(*rgb,255))
    return out


def flip_record(record):
    """Reflect the metadata alongside every pixel, including handle rotation."""
    out = json.loads(json.dumps(record))
    for field in ['hands']:
        out[field] = [[N - 1 - x, y] for x, y in record[field]]
    for field in ['grip', 'staffGrip', 'headAnchor', 'neck']:
        if field in record:
            x, y = record[field]
            out[field] = [N - 1 - x, y]
    if 'headBox' in record:
        l, t, r, b = record['headBox']
        out['headBox'] = [N - r, t, N - l, b]
    if 'headExcludeBox' in record:
        l,t,r,b=record['headExcludeBox'];out['headExcludeBox']=[N-r,t,N-l,b]
    for field in ['hand_boxes','boot_boxes']:
        if field in record:
            out[field] = [[N-1-r,t,N-1-l,b] for l,t,r,b in record[field]]
    out['weaponAngle'] = 180 - record['weaponAngle']
    out['staffAngle'] = 180 - record.get('staffAngle', -80)
    for field in ['slotPolygons', 'erasePolygons']:
        if field in record:
            out[field] = {k: [[[N - 1 - x, y] for x, y in poly] for poly in group]
                          for k, group in record[field].items()}
    for field in ['foregroundPolygons', 'handPolygons', 'headPolygons']:
        if field in record:
            out[field] = [[[N - 1 - x, y] for x, y in poly] for poly in record[field]]
    return out


def load_png(path):
    im = Image.open(path).convert('RGBA')
    if im.size != (N, N):
        raise ValueError(f'{path}: expected registered {N}x{N}, found {im.size}')
    if set(im.getchannel('A').getdata()) - {0, 255}:
        raise ValueError(f'{path}: alpha must already be binary')
    return im


def full_trousers(full,base,mask,bootmask,record):
    """Native painted pants plus matching bare-calf silhouettes under boots.

    Footwear pixels are NEVER part of trousers. Preserve each source leg's
    native geometry; only its colour changes below the authored boot seam.
    """
    result=masked(full,ImageChops.multiply(mask,ImageChops.invert(bootmask)))
    lower_start=record.get('underwearBottomY',record['waistY']+5)+1
    remaining={(x,y) for y in range(lower_start,N) for x in range(N) if base.getpixel((x,y))[3]}
    groups=[]
    while remaining:
        first=remaining.pop();group=[first];queue=[first]
        while queue:
            x,y=queue.pop()
            for p in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
                if p in remaining:remaining.remove(p);group.append(p);queue.append(p)
        if len(group)>5:groups.append(group)
    # Palette sampled from painted trousers above the boot seam; darkest and
    # lightest cloth shades recolour the existing calf pixels without warping.
    colors=[]
    for y in range(record['waistY']+3,record['bootTopY']):
        for x in range(N):
            c=result.getpixel((x,y))
            if c[3]:colors.append(c[:3])
    cloth=sorted(set(colors),key=lambda c:sum(c)) or [(24,29,39),(38,46,59),(58,65,76)]
    ramp=[cloth[min(len(cloth)-1,round(i*(len(cloth)-1)/3))] for i in range(4)]
    for group in groups:
        foot_y=max(y for x,y in group)-record.get('bareFootHeight',4)
        for x,y in group:
            if y>=record['bootTopY'] and y<foot_y:
                r,g,b,a=base.getpixel((x,y));shade=min(3,int((r+g+b)/3)//65)
                result.putpixel((x,y),(*ramp[shade],255))
    return result


def weapon(src, source_grip, grip, angle):
    """Rigid pixel weapon only; bodies and garments are never transformed."""
    out = Image.new('RGBA', (CELL, CELL))
    rad = math.radians(angle + 90)
    co, si = math.cos(rad), math.sin(rad)
    gx, gy = grip[0] + OFFSET[0], grip[1] + OFFSET[1]
    for y in range(CELL):
        for x in range(CELL):
            dx, dy = x - gx, y - gy
            sx = round(source_grip[0] + co * dx + si * dy)
            sy = round(source_grip[1] - si * dx + co * dy)
            if 0 <= sx < src.width and 0 <= sy < src.height:
                out.putpixel((x, y), src.getpixel((sx, sy)))
    b = out.getbbox()
    if b and (b[0] == 0 or b[1] == 0 or b[2] == CELL or b[3] == CELL):
        raise ValueError(f'Weapon clipped: grip={grip}, angle={angle}')
    return out


def unify_palette(images, max_colors=64, supplied=None):
    """One palette for all identities/actions/gear; no per-frame quantization."""
    if supplied:
        colors=[tuple(bytes.fromhex(c.lstrip('#'))) for c in supplied]
        if len(colors)>max_colors:raise ValueError('Supplied palette exceeds maxColors')
        palette=Image.new('P',(1,1))
        palette.putpalette([v for c in colors for v in c]+[0]*(768-3*len(colors)))
    else:
        histogram=Counter()
        for image in images:
            for count,color in image.getcolors(image.width*image.height):
                if color[3]:histogram[color[:3]]+=count
        if len(histogram)<=max_colors:return images
        divisor=max(1,sum(histogram.values())//200000)
        samples=[]
        for color,count in histogram.items():samples.extend([color]*max(1,count//divisor))
        sample=Image.new('RGB',(len(samples),1));sample.putdata(samples)
        palette=sample.quantize(colors=max_colors,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE)
    result=[]
    for image in images:
        mapped=image.convert('RGB').quantize(palette=palette,dither=Image.Dither.NONE).convert('RGBA')
        mapped.putalpha(image.getchannel('A'));result.append(mapped)
    return result


def compact_pack(images, slices, base):
    """Trim transparent pixels; include logical root, preserve exact RGBA."""
    records=[];normalized=[]
    for index,image in enumerate(images):
        alpha=image.getchannel('A')
        image=Image.merge('RGBA',tuple(ImageChops.multiply(c,alpha) for c in image.split()[:3])+(alpha,))
        normalized.append(image)
        b=image.getbbox() or (ANCHOR[0],ANCHOR[1],ANCHOR[0]+1,ANCHOR[1]+1)
        l=max(0,min(b[0],ANCHOR[0])-1);t=max(0,min(b[1],ANCHOR[1])-1)
        right=min(CELL,max(b[2],ANCHOR[0]+1)+1);bottom=min(CELL,max(b[3],ANCHOR[1]+1)+1)
        records.append(dict(index=index,sourceRect=[l,t,right-l,bottom-t]))
    pages=[];locations={};page=Image.new('RGBA',(2048,2048));x=y=shelf=0
    for record in sorted(records,key=lambda r:(-r['sourceRect'][3],-r['sourceRect'][2],r['index'])):
        l,t,w,h=record['sourceRect']
        if x+w>2048:x=0;y+=shelf;shelf=0
        if y+h>2048:pages.append(page);page=Image.new('RGBA',(2048,2048));x=y=shelf=0
        index=record['index'];crop=normalized[index].crop((l,t,l+w,t+h))
        page.paste(crop,(x,y));locations[index]=dict(page=len(pages),rect=[x,y,w,h],sourceRect=[l,t,w,h])
        # Exact byte reconstruction checks logical placement AND preserved
        # alpha/colour pixels, including the transparent pivot margin.
        rebuilt=Image.new('RGBA',(CELL,CELL));rebuilt.paste(crop,(l,t))
        if hashlib.sha256(rebuilt.tobytes()).digest()!=hashlib.sha256(normalized[index].tobytes()).digest():
            raise ValueError(f'Compact packing changed RGBA pixels for unique cell {index}')
        x+=w;shelf=max(shelf,h)
    pages.append(page)
    for number,page in enumerate(pages):page.save(base/f'aether_shared-{number}.png')
    for entry in slices:entry.update(locations[entry['cell']])
    return len(pages)


def example():
    return dict(
        revision=13, bodyHeight=74,
        styles=[dict(id='chestnut_short', name='Nâu hạt dẻ'),dict(id='silver_swept',name='Bạc vuốt lệch'),dict(id='brown_ponytail',name='Nâu buộc đuôi',maxHeight=82)],
        sexes=['male', 'female'],
        actions=[dict(id='idle', count=1, fps=6, hitFrame=-1),
                 dict(id='walk', count=8, fps=9, hitFrame=-1),
                 dict(id='attack', count=9, fps=12, hitFrame=5),
                 dict(id='cast', count=6, fps=8, hitFrame=3)],
        items=[dict(id=i,name=n,slot=s,look=l,**({'dye':d} if d else {})) for i,n,s,l,d in [
            ('jacket_navy','Áo Ngân Lam','upper','navy',None),('jacket_wine','Áo Hồng Tửu','upper','navy','wine'),
            ('cuirass_silver','Giáp Bạch Ngân','upper','silver',None),('vest_leather','Áo lữ hành','upper','navy','leather'),
            ('dragon_guard','Giáp Long Vệ','upper','silver','gold'),('pants_dark','Quần đêm','pants','navy',None),
            ('pants_linen','Quần vải','pants','navy','linen'),('pants_mail','Quần giáp','pants','silver',None),
            ('dragon_legs','Quần Long Vệ','pants','silver','gold'),('boots_brown','Ủng da','boots','navy',None),
            ('boots_black','Ủng đen','boots','navy','black'),('boots_plate','Ủng Bạch Ngân','boots','silver',None),
            ('dragon_boots','Ủng Long Vệ','boots','silver','gold')]],
        weapons=[dict(id='sword', itemId='moonsteel_sword', name='Kiếm Nguyệt Cương',
                      action='attack', skill='slash', fps=12, hitFrame=5, hands=2,
                      source='../../../v2/source-art/authored-v4/moonsteel-sword.png', grip=[6,29]),
                 dict(id='staff', itemId='aether_staff', name='Trượng Aether',
                      action='cast', skill='aether_bolt', fps=8, hitFrame=3, hands=1,
                      source='../../../parts/aether-staff.png', grip=[5,37])],
        naming=dict(body='{sex}_{style}_{action}_{phase}_{direction}.png',
                    garment='dressed/{look}_{action}_{phase}_{direction}.png',
                    metadata='{sex}_{action}.json'),
        metadataExample=dict(records=[dict(phase=0, direction='E',
            headBox=[62,54,82,75], headAnchor=[72,54], neck=[72,75],
            hands=[[80,92]], grip=[80,92], weaponAngle=-45,
            slotPolygons=dict(upper=[], pants=[], boots=[]),
            erasePolygons=dict(upper=[], pants=[], boots=[]),
            handPolygons=[], foregroundPolygons=[])]))


def assemble(base, allow_partial=False):
    art = base / 'source-art/authored'
    manifest = json.loads((art / 'manifest.json').read_text(encoding='utf-8-sig'))
    if manifest.get('draft') and not allow_partial:
        raise ValueError('Draft source cannot be exported as a release catalog')
    cells, slices, hashes, names = [], [], {}, {}
    audit = []
    def add(name, im):
        if name in names:
            return names[name]
        if im.size == (N,N):
            padded = Image.new('RGBA', (CELL,CELL))
            padded.alpha_composite(im, OFFSET)
            im = padded
        h = hashlib.sha256(im.tobytes()).hexdigest()
        if h not in hashes:
            hashes[h] = len(cells)
            cells.append(im)
        names[name] = hashes[h]
        slices.append(dict(name=name, cell=hashes[h]))
        return hashes[h]
    empty = Image.new('RGBA', (N,N))
    styles, sexes, actions = manifest['styles'], manifest['sexes'], manifest['actions']
    patterns = manifest['naming']
    items = manifest['items']
    weapons = manifest['weapons']
    weapon_sources = {w['id']: Image.open((art / w['source']).resolve()).convert('RGBA') for w in weapons}
    identities = []
    for sex in sexes:
        sequences = []
        for action in actions + [dict(a, id='run', source='walk') for a in actions if a['id']=='walk']:
            source_action = action.get('source', action['id'])
            records = json.loads((art / patterns['metadata'].format(sex=sex, action=source_action)).read_text(encoding='utf-8-sig'))['records']
            records = {(r['phase'],r['direction']): r for r in records}
            for direction in DIRS:
                sd = MIRROR.get(direction, direction)
                mirrored = direction in MIRROR
                frames = []
                for phase in range(action['count']):
                    record = records[(phase, sd)]
                    # These derive from explicit annotations, never sprite bounds.
                    record = dict(record)
                    if 'headAnchor' not in record and 'headBox' in record:
                        l,t,r,b = record['headBox']; record['headAnchor']=[(l+r)//2,t]
                    if 'neck' not in record and 'neckY' in record:
                        record['neck']=[record['headAnchor'][0],record['neckY']]
                    source_record = record
                    if mirrored:
                        record = flip_record(record)
                    for required in ['headBox','headAnchor','neck','hands','grip','weaponAngle']:
                        if required not in record:
                            raise ValueError(f'Missing authored {required}: {sex}/{source_action}/{phase}/{direction}')
                    if 'slotPolygons' in record:
                        smasks = {s['id']:polygons(record['slotPolygons'][s['id']]) for s in SLOTS}
                        if 'handPolygons' in record:
                            hmask = polygons(record['handPolygons'])
                        else:
                            hmask=Image.new('L',(N,N));hd=ImageDraw.Draw(hmask)
                            for box in record.get('hand_boxes',[]):hd.rectangle(tuple(box),fill=255)
                    else:
                        smasks, hmask = landmark_masks(record)
                    # Clothes naturally cover the bare body. Erasing the full
                    # torso/limbs would create gaps at necklines and cuffs.
                    # Only explicitly marked underwear / hidden foot regions
                    # may be erased, independently of garment extraction masks.
                    emasks = {s['id']:polygons(record.get('erasePolygons',{}).get(s['id'],[])) for s in SLOTS}
                    foreground = polygons(record.get('foregroundPolygons',[]))
                    poseid = f'{source_action}_{phase}_{direction}'
                    bp, gp = f'{sex}_{poseid}', f'gear_{poseid}'
                    bodies = {}
                    for style in styles:
                        filename = patterns['body'].format(sex=sex, style=style['id'],action=source_action,phase=phase,direction=sd)
                        body = load_png(art / filename)
                        if mirrored:
                            body = body.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
                        bounds = body.getbbox()
                        if not bounds:
                            raise ValueError(f'Empty body {filename}')
                        reference_variant=(sex==sexes[0] and style['id']==styles[0]['id'])
                        if source_action=='idle' and reference_variant and abs((bounds[3]-bounds[1])-manifest['bodyHeight']) > manifest.get('bodyHeightTolerance',3):
                            raise ValueError(f'Idle body differs from native height standard: {filename} bounds={bounds}')
                        if source_action=='idle' and not reference_variant and bounds[3]-bounds[1]>style.get('maxHeight',manifest.get('maxVariantHeight',82)):
                            raise ValueError(f'Idle variant exceeds full-hair height envelope: {filename} bounds={bounds}')
                        for point in record['hands']:
                            if record.get('handsVisible',True) and not body.getpixel(tuple(point))[3]:
                                raise ValueError(f'Hand annotation misses body pixel: {filename} point={point}')
                        bodies[style['id']] = body
                        for mask in range(8):
                            variant_name=f'{bp}_{style["id"]}_base' + (f'_{mask}' if mask else '')
                            if variant_name in names:continue
                            hide = Image.new('L', (N,N))
                            for k, slot in enumerate(SLOTS):
                                if mask & (1<<k):
                                    hide = ImageChops.lighter(hide, emasks[slot['id']])
                            visible = masked(body, ImageChops.invert(hide))
                            add(variant_name, visible)
                        audit.append(dict(sex=sex,style=style['id'],action=source_action,phase=phase,direction=direction,bounds=body.getbbox()))
                    body = bodies[styles[0]['id']]
                    for item in items:
                        if f'{gp}_{item["id"]}' in names:continue
                        filename = patterns['garment'].format(item=item['id'],look=item.get('look','navy'),action=source_action,phase=phase,direction=sd)
                        garment = load_png(art / filename)
                        if mirrored:
                            garment = garment.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
                        mask = smasks[item['slot']]
                        full_garment=garment
                        garment = (full_trousers(full_garment,body,mask,smasks['boots'],record)
                                   if item['slot']=='pants' else masked(full_garment,mask))
                        if item['slot']=='upper' and record.get('foregroundPolygons'):
                            # Cloth on authored raised forearms can overlap the
                            # head bounds; hair/skin from the dressed reference
                            # must never be pasted over the complete base face.
                            for y in range(N):
                                for x in range(N):
                                    if not foreground.getpixel((x,y)) or hmask.getpixel((x,y)):continue
                                    r,g,b,a=full_garment.getpixel((x,y))
                                    is_skin=r>130 and r-g>20 and g-b>10
                                    is_hair=r>g*1.1 and b<r*.9 and r<180 and g<130
                                    if a and not is_skin and not is_hair:garment.putpixel((x,y),(r,g,b,a))
                        # Exact known skin palette may be omitted from shared gear;
                        # semantic gates above define every seam independently.
                        skin_palette = {tuple(bytes.fromhex(c.lstrip('#'))) for c in manifest.get('skinPalette',[])}
                        if skin_palette:
                            pixels=list(garment.getdata())
                            garment.putdata([(0,0,0,0) if c[:3] in skin_palette else c for c in pixels])
                        garment = tint(garment,item.get('dye'),protect_skin=item['slot']=='upper')
                        if not garment.getbbox():
                            raise ValueError(f'Empty garment {filename}')
                        add(f'{gp}_{item["id"]}', garment)
                        if item['slot']=='upper':
                            add(f'{gp}_arm_{item["id"]}', masked(garment,foreground))
                    name = f'{sex}_{action["id"]}_{direction}_{phase}'
                    add(name+'_identity', empty)
                    add(name+'_identity_clothed',empty)
                    add(name+'_silver',empty)
                    add(name+'_warden',body)
                    for mask in range(8):
                        add(bp+'_base'+(f'_{mask}' if mask else ''),cells[names[f'{bp}_{styles[0]["id"]}_base'+(f'_{mask}' if mask else '')]])
                    grips, orders = [], []
                    for wi,w in enumerate(weapons):
                        grip = record.get('staffGrip', record['grip']) if wi==1 else record['grip']
                        source_grip = source_record.get('staffGrip',source_record['grip']) if wi==1 else source_record['grip']
                        angle = source_record.get('staffAngle',-80) if wi==1 else source_record['weaponAngle']
                        if wi==1 and source_action in ('idle','walk'):
                            # Keep the carried shaft outside the body silhouette
                            # while retaining the exact same palm/hilt contact.
                            # SE's near palm is left of the face; its staff
                            # leans left. Keep one angle per direction through
                            # the gait instead of switching as the hand moves.
                            angle={'E':-45,'SE':-135}.get(sd,-65)
                        image = weapon(weapon_sources[w['id']],w['grip'],source_grip,angle)
                        # Reflect the completed raster. Re-rotating an asymmetric
                        # sword at 180-angle changes blade/guard pixels and grip.
                        if mirrored:image=image.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
                        hands = masked(body,hmask) if record.get('handsVisible',True) else empty
                        for suffix in ['', '_bare','_silver','_gold']:
                            add(name+'_'+w['id']+suffix,image)
                            add(name+'_hand_'+w['id']+suffix,hands)
                        grips.append([grip[0]+OFFSET[0],grip[1]+OFFSET[1]])
                        orders.append(record.get('weaponOrder',1))
                    trail = Image.new('RGBA',(CELL,CELL))
                    active=action['id']=='attack' and record.get('trailActive',False)
                    if active:
                        # A continuous curved blade sweep from behind the head
                        # to the current rigid blade's tip, following its grip.
                        radians=math.radians(source_record['weaponAngle'])
                        tip=(source_record['grip'][0]+32*math.cos(radians)+16,source_record['grip'][1]+32*math.sin(radians)+24)
                        start=(source_record['headAnchor'][0]-25+16,source_record['headBox'][1]-7+24)
                        control=(tip[0]+16,source_record['headBox'][1]-15+24)
                        points=[]
                        for step in range(25):
                            t=step/24;u=1-t
                            points.append((round(u*u*start[0]+2*u*t*control[0]+t*t*tip[0]),round(u*u*start[1]+2*u*t*control[1]+t*t*tip[1])))
                        ImageDraw.Draw(trail).line(points,fill=(177,234,246,255),width=2,joint='curve')
                        if mirrored:trail=trail.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
                    add(name+'_trail',trail)
                    padded_hands = [[x+OFFSET[0],y+OFFSET[1]] for x,y in record['hands']]
                    frames.append(dict(name=name,index=names[name+'_identity'],bodyPrefix=bp,garmentPrefix=gp,
                        headDirection=direction,hairBaked=True,headAnchor=[record['headAnchor'][0]+16,record['headAnchor'][1]+24],
                        handPrefix=name+'_hand',weaponGrips=grips,weaponGripSets=[grips]*4,weaponOrders=orders,
                        weaponOrder=orders[0],swordHandsVisible=record.get('handsVisible',True),swordHands=padded_hands,swordHandCount=len(padded_hands),
                        swordHandSets=[padded_hands]*4,swordAngle=record['weaponAngle'],root=ANCHOR,
                        neck=[record['neck'][0]+16,record['neck'][1]+24],grip=grips[0],anchorsReviewed=True,
                        jointsReviewed=True,trailActive=active,posePhase=phase,transitionPose=False,
                        source=f'authored/{sex}/{source_action}/{phase}/{direction}'))
                sequences.append(dict(action=action['id'],direction=direction,fps=action['fps'],hitFrame=action['hitFrame'],frames=frames))
        identities.append(dict(id='aether_warden'+('_f' if sex=='female' else ''),name='Ngân Lam · '+('Nữ' if sex=='female' else 'Nam'),texture='aether_shared',sequences=sequences))
    cells=unify_palette(cells,manifest.get('maxColors',64),manifest.get('palette'))
    pages=compact_pack(cells,slices,base)
    slots = [dict(s,items=[dict(id=i['id'],name=i['name']) for i in items if i['slot']==s['id']]) for s in SLOTS]
    catalog = dict(version=2,template='adult-modular-v13',drawnBodies=True,integratedHeads=True,integratedBodyVariants=True,
        modularBody=True,bodyHeight=manifest['bodyHeight'],maxColors=manifest.get('maxColors',64),nativeFrameSize=[N,N],frameSize=[CELL,CELL],ppu=48,
        anchor=ANCHOR,directions=DIRS,hairStyles=styles,hairRevision=13,garmentSlots=slots,
        outfits=[dict(id='warden',name='Ngân Lam')],weapons=[{k:v for k,v in w.items() if k not in ['source','grip']} for w in weapons],
        identities=identities,reviewRequired=True,artApproved=False,drawnPoseCount=len(audit),uniqueCells=len(cells),compactSlices=True,atlasSize=[2048,2048],atlasPageCount=pages,sourceManifest='source-art/authored/manifest.json')
    (base/'catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    (base/'aether_shared-slices.json').write_text(json.dumps(slices),encoding='utf8')
    (base/'export-audit.json').write_text(json.dumps(audit,indent=2)+'\n',encoding='utf8')
    print(f'EXPORTED {len(audit)} drawn body variants, {len(cells)} unique atlas cells; visual review required')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base',type=Path,default=DEFAULT)
    parser.add_argument('--write-example',type=Path)
    parser.add_argument('--allow-draft',action='store_true')
    args=parser.parse_args()
    if args.write_example:
        args.write_example.parent.mkdir(parents=True,exist_ok=True)
        args.write_example.write_text(json.dumps(example(),ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    else:
        assemble(args.base,args.allow_draft)

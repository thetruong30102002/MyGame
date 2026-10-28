"""Assemble drawn assets on a shared 144px rig; never synthesize anatomy.

The shared gear cells are reused by both sexes and all loadout combinations.
Registration, layer masks, nearest-neighbour export and palette dyes only.
"""
from pathlib import Path
import json, math, hashlib, importlib.util
from PIL import Image, ImageDraw
from modular_v7_binding import hair_layers,fit_equipment,equipment_sheet,fit_complete_figure,fit_pants,bind_wrists,arm_foreground

ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'assets/mannequin/v2'
ART=OUT/'source-art/authored-v7'
RAW=OUT/'source-art/v7'
OLD=OUT/'source-art/v6'
HAIR_OUTPUT=RAW/'hair-bindings.json'
HAIR_REVISION=7
HAIR_CLEAN_SKULL=False
HAIR_PROVIDER=None
CANONICAL_ACTION_HEADS=False
COLOR_REFERENCE=False
TRANSITION_POSES=False
HAIR_WITH_IDENTITY=False
INTEGRATED_HEADS=False
spec=importlib.util.spec_from_file_location('prep',Path(__file__).with_name('prepare-authored-v6.py'))
prep=importlib.util.module_from_spec(spec);spec.loader.exec_module(prep)
N=144;CELL=176;OFFSET=(16,24);ANCHOR=[88,152]
DIRS=prep.DIRS;COUNTS=prep.COUNTS
EMPTY=Image.new('RGBA',(N,N))
SLOTS=[dict(id='upper',name='Áo / giáp',equipSlot='body',order=2,items=[dict(id=x,name=n) for x,n in [('jacket_navy','Áo Ngân Lam'),('jacket_wine','Áo Hồng Tửu'),('cuirass_silver','Giáp Bạch Ngân'),('vest_leather','Áo lữ hành'),('dragon_guard','Giáp Long Vệ')]]),dict(id='pants',name='Quần',equipSlot='legs',order=0,items=[dict(id=x,name=n) for x,n in [('pants_dark','Quần đêm'),('pants_linen','Quần vải'),('pants_mail','Quần giáp'),('dragon_legs','Quần Long Vệ')]]),dict(id='boots',name='Giày',equipSlot='feet',order=1,items=[dict(id=x,name=n) for x,n in [('boots_brown','Ủng da'),('boots_black','Ủng đen'),('boots_plate','Ủng Bạch Ngân'),('dragon_boots','Ủng Long Vệ')]])]

def skin(c):
    r,g,b,a=c
    return a and r>100 and r-g>20 and g-b>8

def pad(im):
    out=Image.new('RGBA',(CELL,CELL));out.alpha_composite(im,OFFSET);return out

def nearest(source,point,radius=7,predicate=skin):
    candidates=[]
    for y in range(max(0,point[1]-radius),min(N,point[1]+radius+1)):
        for x in range(max(0,point[0]-radius),min(N,point[0]+radius+1)):
            if predicate(source.getpixel((x,y))):candidates.append(((x-point[0])**2+(y-point[1])**2,x,y))
    if not candidates:raise ValueError(f'No authored palm near {point}')
    _,x,y=min(candidates);return [x,y]

def dye(im,style):
    result=im.copy()
    for y in range(N):
        for x in range(N):
            c=im.getpixel((x,y));r,g,b,a=c
            if not a or skin(c):continue
            lum=(r+g+b)/3
            if style=='wine' and b>r*1.1:rgb=(int(min(235,lum*1.1+18)),int(lum*.43+8),int(lum*.72+16))
            elif style=='leather':rgb=(int(min(240,lum*.96+19)),int(lum*.64+10),int(lum*.40+8))
            elif style=='linen':rgb=(int(min(225,lum*1.18+22)),int(min(220,lum*1.12+20)),int(lum*.89+17))
            elif style=='black':rgb=(int(lum*.43+4),int(lum*.48+6),int(lum*.59+8))
            elif style=='gold':rgb=(int(min(248,lum*1.15+12)),int(min(224,lum*.92+6)),int(lum*.50+7))
            else:continue
            result.putpixel((x,y),(*rgb,255))
    return result

def load_meta(sex,action):
    records=json.loads((ART/f'{sex}-{action}.json').read_text(encoding='utf8'))['records']
    return {(r['phase'],r['direction']):r for r in records}

def head_info(im,record,action,phase,direction):
    anchor=list(record['headAnchor'])
    if action=='attack' and phase in [1,2]:
        anchor=[72 if direction in ['S','N'] else 69 if direction in ['W','SW','NW'] else 74,49]
        if direction in ['N','NW','NE']:anchor[1]=51
    if action in ['idle','walk']:
        neck=record['neckY'];head=Image.new('RGBA',(N,N));body=im.copy()
        head.paste(im.crop((0,0,N,neck+1)),(0,0));body.paste((0,0,0,0),(0,0,N,neck+1))
        return anchor,head,body
    head=Image.new('RGBA',(N,N));body=im.copy();cx,top=anchor
    rx,ry,cy=(8.5,9.5,top+8) if action=='attack' else (9.5,11,top+9)
    for y in range(max(0,top-2),min(N,top+21)):
        for x in range(max(0,cx-11),min(N,cx+12)):
            if ((x-cx)/rx)**2+((y-cy)/ry)**2<=1:
                head.putpixel((x,y),im.getpixel((x,y)));body.putpixel((x,y),(0,0,0,0))
    return anchor,head,body

def boot_coverage(full,record,hand_points):
    points=[]
    for y in range(record['waist']+7,N):
        for x in range(N):
            r,g,b,a=full.getpixel((x,y))
            if a and r>=65 and r-g>=18 and g-b>=12 and r<180 and not any(abs(x-hx)<=5 and abs(y-hy)<=5 for hx,hy in hand_points):points.append((x,y))
    groups=[g for g in prep.components(points) if len(g)>=8]
    seeds=set(p for g in groups for p in g)
    if not seeds:seeds={(x,y) for y in range(113,N) for x in range(N) if full.getpixel((x,y))[3]}
    return {(x+dx,y+dy) for x,y in seeds for dx in range(-2,3) for dy in range(-2,3)}

def split_gear(full,record,head_anchor,hand_points,boot_mask):
    waist=record['waist'];cx,top=head_anchor
    # Mantle, torso, sleeves and exposed fingers travel as one upper layer.
    # Lower pieces have a common seam; no second shirt remains on the body.
    pieces=[Image.new('RGBA',(N,N)) for _ in range(3)]
    for y in range(N):
        for x in range(N):
            c=full.getpixel((x,y))
            if not c[3]:continue
            if 'neckY' in record:
                if y<=record['neckY']:continue
            elif abs(x-cx)<=11 and top-5<=y<top+19:continue
            slot=0 if y<waist else 2 if (x,y) in boot_mask else 1
            # Tunic skirts, sash, tabard and hip plates belong to the shirt.
            # Full trousers underneath remain an independent equipment slot.
            r,g,b,a=c
            blue=b>r*1.25 and b>g*1.08
            teal=g>r*1.3 and b>r*1.4
            trim=r>90 and g>65 and b<g*.85
            plate=min(r,g,b)>75 and b>=r*.9
            if waist<=y<waist+12 and (blue or teal or trim or plate):slot=0
            # Hands on hips / low follow-through belong to the upper slot.
            if any(abs(x-hx)<=5 and abs(y-hy)<=5 for hx,hy in hand_points):slot=0
            pieces[slot].putpixel((x,y),c)
    return pieces

def pants_layer(full,record,hand_points):
    """Use the separately DRAWN full trouser legs, including under the boots."""
    result=Image.new('RGBA',(N,N));skin_points=[]
    for y in range(record['waist']-9,N):
        for x in range(N):
            c=full.getpixel((x,y))
            r,g,b,a=c
            if a and r>140 and b>45 and 18<r-g<100 and 8<g-b<70:skin_points.append((x,y))
    exclude={(x+dx,y+dy) for x,y in skin_points for dx in [-1,0,1] for dy in [-1,0,1]}
    for y in range(record['waist']-8,N):
        for x in range(N):
            if (x,y) in exclude:continue
            result.putpixel((x,y),full.getpixel((x,y)))
    groups=prep.components([(x,y) for y in range(N) for x in range(N) if result.getpixel((x,y))[3]])
    keep=set(p for group in groups[:2] if len(group)>15 for p in group)
    for y in range(N):
        for x in range(N):
            if (x,y) not in keep:result.putpixel((x,y),(0,0,0,0))
    return result

def carried_palm(im,direction,action,phase,meta):
    # Apparent near hand: right on east views, left on west views.
    left=direction in ['W','SW','NW']
    if action=='cast':
        seeds={'S':[[63,79],[87,80],[89,84],[59,94]],'W':[[63,78],[81,79],[84,82],[66,93]],'N':[[60,81],[60,83],[61,84],[61,95]],'SW':[[62,79],[88,79],[90,83],[61,94]],'NW':[[64,82],[62,82],[62,84],[64,96]]}
        original=direction
        if direction in ['E','SE','NE']:original={'E':'W','SE':'SW','NE':'NW'}[direction]
        seed=list(seeds[original][phase])
        if original!=direction:seed[0]=N-1-seed[0]
    else:
        # Find the distal skin cluster beside the pelvis, not a sleeve or thigh.
        candidates=[]
        for y in range(meta['waist']-15,meta['waist']+8):
            for x in range(40,103):
                if not skin(im.getpixel((x,y))):continue
                if (left and x<meta['hip'][0]-8) or (not left and x>meta['hip'][0]+8):candidates.append((x,y))
        if candidates:
            extreme=min(x for x,y in candidates) if left else max(x for x,y in candidates)
            selected=[p for p in candidates if abs(p[0]-extreme)<4]
            seed=[round(sum(x for x,y in selected)/len(selected)),max(y for x,y in selected)-2]
        else:seed=[meta['hip'][0]+(-12 if left else 12),meta['waist']+1]
    try:return nearest(im,seed,9)
    except ValueError:return nearest(im,[meta['hip'][0],meta['waist']-2],18)

def exposed_hands(im,direction,action,phase,meta):
    near=carried_palm(im,direction,action,phase,meta);points=[]
    for y in range(meta['waist']-11,meta['waist']+9):
        for x in range(40,104):
            if not skin(im.getpixel((x,y))):continue
            opposite=x<meta['hip'][0]-8 if near[0]>=meta['hip'][0] else x>meta['hip'][0]+8
            if opposite:points.append((x,y))
    hands=[near]
    if points:
        extreme=min(x for x,y in points) if near[0]>=meta['hip'][0] else max(x for x,y in points)
        pts=[p for p in points if abs(p[0]-extreme)<3]
        far=[round(sum(x for x,y in pts)/len(pts)),max(y for x,y in pts)-2]
        hands.append(nearest(im,far,5))
    return hands

ATTACK={
 'S':[[61,56],[73,26],[73,24],[57,52],[72,100],[62,103],[70,70]],
 'W':[[57,55],[64,27],[65,25],[54,49],[65,102],[62,105],[56,56]],
 'N':[[61,51],[73,25],[73,24],[59,54],[72,86],[65,98],[73,50]],
 'SW':[[59,55],[70,26],[69,24],[56,51],[65,101],[62,104],[59,56]],
 'NW':[[61,53],[70,26],[69,24],[56,52],[68,98],[62,102],[61,54]]}

def attack_palms(im,direction,phase):
    original={'E':'W','SE':'SW','NE':'NW'}.get(direction,direction)
    seed=[round(72+(ATTACK[original][phase][0]-72)*.9),round(128+(ATTACK[original][phase][1]-128)*.9)];angle=[-90,-90,-90,-112,90 if original=='S' else 130,117 if original=='S' else 132,-90][phase]
    if original!=direction:seed[0]=N-1-seed[0];angle=180-angle
    hidden=original in ['N','NW'] and phase in [0,3,4,5,6]
    ax,ay=math.cos(math.radians(angle)),math.sin(math.radians(angle))
    if hidden:return seed,[[*seed],[round(seed[0]-ax*6),round(seed[1]-ay*6)]],angle,False
    candidates=[]
    for dy in range(-8,9):
        for dx in range(-8,9):
            p=[seed[0]+dx,seed[1]+dy]
            for span in [5,6,4]:
                q=[round(p[0]-ax*span),round(p[1]-ay*span)]
                if all(0<=x<N and 0<=y<N and skin(im.getpixel((x,y))) for x,y in [p,q]):candidates.append((dx*dx+dy*dy+(6-span)**2,p,q))
    if not candidates:raise ValueError(f'Two hands missing {direction}/{phase}/{seed}')
    _,p,q=min(candidates,key=lambda a:a[0]);return p,[p,q],angle,True

WEAPON_CACHE={}
def weapon_frame(src,source_grip,grip,angle):
    # Angle is the painted chop axis. A rigid blade; no bending to fit canvas.
    key=(src.size,tuple(source_grip),tuple(grip),angle)
    if key in WEAPON_CACHE:return WEAPON_CACHE[key]
    out=Image.new('RGBA',(CELL,CELL));a=math.radians(angle+90);co,si=math.cos(a),math.sin(a)
    gx,gy=grip[0]+16,grip[1]+24
    for y in range(CELL):
        for x in range(CELL):
            dx,dy=x-gx,y-gy
            sx=round(source_grip[0]+co*dx+si*dy);sy=round(source_grip[1]-si*dx+co*dy)
            if 0<=sx<src.width and 0<=sy<src.height:out.putpixel((x,y),src.getpixel((sx,sy)))
    b=out.getbbox()
    if b and (b[0]==0 or b[1]==0 or b[2]==CELL or b[3]==CELL):raise ValueError(f'Clipped weapon {grip}/{angle}')
    WEAPON_CACHE[key]=out
    return out

def fingers(full,palms,visible=True):
    out=Image.new('RGBA',(N,N))
    if visible:
        for px,py in palms:
            for y in range(max(0,py-3),min(N,py+4)):
                for x in range(max(0,px-3),min(N,px+4)):
                    c=full.getpixel((x,y))
                    if skin(c):out.putpixel((x,y),c)
    return out

def main():
    cells=[];slices=[];hashes={};lookup={};images={}
    def add(name,im):
        if name in lookup:raise ValueError('Duplicate '+name)
        if im.size==(N,N):im=pad(im)
        h=hashlib.sha256(im.tobytes()).hexdigest()
        if h not in hashes:hashes[h]=len(cells);cells.append(im)
        cell=hashes[h];slices.append(dict(name=name,cell=cell));lookup[name]=cell
        if name.startswith('hair_'):images[name]=cells[cell]
        return cell
    bodies={};metadata={};heads={};anchors={}
    for sex in ['male','female']:
        for action in COUNTS:
            meta=load_meta(sex,action)
            for phase in range(COUNTS[action]):
                for d in DIRS:
                    key=(sex,action,phase,d);im=Image.open(ART/f'{sex}_{action}_{phase}_{d}.png').convert('RGBA')
                    anchor,head,body=head_info(im,meta[(phase,d)],action,phase,d)
                    bodies[key]=im;metadata[key]=meta[(phase,d)];heads[key]=head;anchors[key]=anchor
    if CANONICAL_ACTION_HEADS:
        from modular_v11_continuity import canonical_actions
        from modular_v9_hair import skull
        canonical_actions(bodies,heads,anchors,metadata,skull)
    clothed_heads={}
    for key,head in heads.items():
        sex,action,phase,d=key
        if not CANONICAL_ACTION_HEADS and action=='attack' and phase in [1,2]:
            # The authored wind-up has a bare forearm crossing the scalp.
            # That forearm belongs to the sleeve foreground while dressed,
            # never to the face layer. Reuse the clean directional face on
            # this held-head pose; the naked pose retains its original arm.
            idlekey=(sex,'idle',0,d);clean=Image.new('RGBA',(N,N))
            dx=anchors[key][0]-anchors[idlekey][0];dy=anchors[key][1]-anchors[idlekey][1]
            clean.alpha_composite(heads[idlekey],(dx,dy));clothed_heads[key]=clean
        else:clothed_heads[key]=head
    gears={};dressed={};boot_masks={};arm_layers={};colour_references={};pants_references={}
    if COLOR_REFERENCE:
        from modular_v11_continuity import harmonize
    for action in COUNTS:
        for look in ['navy','silver']:
            sources=equipment_sheet(RAW/f'{look}-{action}-dressed-raw.png',action,prep)
            trousers=equipment_sheet(RAW/f'pants-{look}-{action}-raw.png',action,prep)
            for phase in range(COUNTS[action]):
                for a,b in [('W','E'),('SW','SE'),('NW','NE')]:
                    if action!='idle':
                        sources[(phase,b)]=sources[(phase,a)].transpose(Image.Transpose.FLIP_LEFT_RIGHT)
                        trousers[(phase,b)]=trousers[(phase,a)].transpose(Image.Transpose.FLIP_LEFT_RIGHT)
                for d in DIRS:
                    full=sources[(phase,d)];key=('male',action,phase,d);base=bodies[key]
                    # Registered markers fix canvas. A small whole-pose root
                    # translation fixes exporter padding without changing scale.
                    full=fit_complete_figure(full,base,metadata[key],action,prep)
                    full=fit_equipment(full,base,metadata[key],action,skin)
                    if action=='idle':colour_references[(look,d)]=full.copy()
                    elif COLOR_REFERENCE and action in ['attack','cast']:
                        full=harmonize(full,colour_references[(look,d)],96)
                    # Full artwork is already registered to the approved action extent.
                    if action=='attack':_,hands,_,seen=attack_palms(base,d,phase);hands=hands if seen else []
                    else:hands=exposed_hands(base,d,action,phase,metadata[key])
                    full=bind_wrists(full,base,hands,skin)
                    arm_layers[(look,action,phase,d)]=arm_foreground(full,anchors[key],action,phase,prep)
                    if look=='navy':boot_masks[(action,phase,d)]=boot_coverage(full,metadata[key],hands)
                    parts=split_gear(full,metadata[key],anchors[key],hands,boot_masks[(action,phase,d)])
                    pants=fit_complete_figure(trousers[(phase,d)],base,metadata[key],action,prep)
                    pants=fit_pants(pants,base,metadata[key],action,skin)
                    if action=='idle':pants_references[(look,d)]=pants.copy()
                    elif COLOR_REFERENCE and action in ['attack','cast']:
                        pants=harmonize(pants,pants_references[(look,d)],64)
                    parts[1]=pants_layer(pants,metadata[key],hands)
                    gears[(look,action,phase,d)]=parts;dressed[(look,action,phase,d)]=base
    # Actual drawn wigs, same canonical bald skull on all action frames.
    raw=Image.open(OLD/'hair-three-styles-raw.png').convert('RGBA')
    styles=[dict(id='chestnut_short',name='Nâu hạt dẻ'),dict(id='silver_swept',name='Bạc vuốt lệch'),dict(id='brown_ponytail',name='Nâu buộc đuôi'),dict(id='bald',name='Cạo gọn')]
    hair_bindings=[]
    for sex in ['male','female']:
        for row,style in enumerate(styles):
            for col,d in enumerate(DIRS):
                front=Image.new('RGBA',(N,N));back=front.copy()
                if row<3:
                    tile=raw.crop((round(col*raw.width/8),round(row*raw.height/3),round((col+1)*raw.width/8),round((row+1)*raw.height/3)))
                    tile=prep.clean(tile)
                    key=(sex,'idle',0,d)
                    front,back,binding=(HAIR_PROVIDER(style['id'],'idle',0,d,heads[key],metadata[key]['neckY'],**({'sex':sex} if HAIR_WITH_IDENTITY else {})) if HAIR_PROVIDER else hair_layers(tile,heads[key],d,metadata[key]['neckY']))
                    hair_bindings.append(dict(sex=sex,style=style['id'],direction=d,**binding))
                    # Bind to the catalogue's canonical head coordinate. This
                    # includes per-direction scalp offsets, once at export.
                    dx=72-anchors[key][0];dy=48-anchors[key][1]
                    for im in [front,back]:
                        shifted=Image.new('RGBA',(N,N));shifted.alpha_composite(im,(dx,dy));im.paste(shifted)
                add(f"hair_{sex}_{style['id']}_{d}_front",front);add(f"hair_{sex}_{style['id']}_{d}_back",back)
                if sex=='male':
                    add(f"hair_{style['id']}_{d}_front",front);add(f"hair_{style['id']}_{d}_back",back)
    HAIR_OUTPUT.parent.mkdir(exist_ok=True)
    HAIR_OUTPUT.write_text(json.dumps(hair_bindings,indent=2)+'\n')
    # Each action owns actual DRAWN hair poses. The completed sprite is baked
    # on its scalp at export; there is no runtime wig translation or bob.
    drawn_hair={}
    for style in (styles[:3] if HAIR_PROVIDER is None else []):
        for action in ['walk','attack','cast']:
            path=RAW/'hair'/f"hair-{style['id']}-{action}-raw.png"
            source=Image.open(path).convert('RGBA');count=COUNTS[action];tiles={}
            for row,d in enumerate(prep.ROWS):
                for phase in range(count):
                    tile=source.crop((round(phase*source.width/count),round(row*source.height/5),round((phase+1)*source.width/count),round((row+1)*source.height/5)))
                    tile.paste((0,0,0,0),(0,0,round(tile.width*.12),round(tile.height*.12)))
                    tile.paste((0,0,0,0),(round(tile.width*.88),round(tile.height*.88),tile.width,tile.height))
                    for y in range(tile.height):
                        for x in range(tile.width):
                            r,g,b,a=tile.getpixel((x,y))
                            if (g>180 and r<75 and b<75) or (r>180 and b>160 and g<90):tile.putpixel((x,y),(0,0,0,0))
                    tiles[(phase,d)]=prep.clean(tile)
            for phase in range(count):
                for a,b in [('W','E'),('SW','SE'),('NW','NE')]:tiles[(phase,b)]=tiles[(phase,a)].transpose(Image.Transpose.FLIP_LEFT_RIGHT)
            drawn_hair[(style['id'],action)]=tiles
    hair_bindings=[]
    for key,head in heads.items():
        sex,action,phase,d=key;record=metadata[key];anchor=anchors[key]
        for row,style in enumerate(styles):
            front=Image.new('RGBA',(N,N));back=front.copy()
            if row<3:
                if HAIR_PROVIDER is not None:tile=None
                elif action=='idle':
                    col=DIRS.index(d);tile=raw.crop((round(col*raw.width/8),round(row*raw.height/3),round((col+1)*raw.width/8),round((row+1)*raw.height/3)));tile=prep.clean(tile)
                else:tile=drawn_hair[(style['id'],action)][(phase,d)]
                binding_head=clothed_heads[key] if HAIR_CLEAN_SKULL else head
                neck=record.get('neckY',anchor[1]+18)
                if CANONICAL_ACTION_HEADS:neck=binding_head.getbbox()[3]-1
                front,back,binding=(HAIR_PROVIDER(style['id'],action,phase,d,binding_head,neck,**({'sex':sex} if HAIR_WITH_IDENTITY else {})) if HAIR_PROVIDER else hair_layers(tile,binding_head,d,neck))
                hair_bindings.append(dict(sex=sex,style=style['id'],action=action,phase=phase,direction=d,**binding))
            prefix=f"hair_{sex}_{action}_{phase}_{style['id']}_{d}"
            add(prefix+'_front',front);add(prefix+'_back',back)
    HAIR_OUTPUT.write_text(json.dumps(hair_bindings,indent=2)+'\n')
    sword=Image.open(OUT/'source-art/authored-v4/moonsteel-sword.png').convert('RGBA')
    staff=Image.open(ROOT/'assets/mannequin/parts/aether-staff.png').convert('RGBA')
    schedules=[('idle',6,-1,[0]*4),('walk',9,-1,list(range(8))),('run',9,-1,list(range(8))),('attack',18,7,[0,1,1,2,2,2,3,4,4,5,5,6,6,0]),('cast',10,4,[0,0,1,1,2,2,3,3])]
    if TRANSITION_POSES:
        schedules=[(a,fps,hit,[-1,0,1,1,2,2,3,4,4,5,5,6,6,-1] if a=='attack' else [-1,0,1,1,2,2,3,-1] if a=='cast' else p) for a,fps,hit,p in schedules]
    identities=[];review=Image.new('RGBA',(N*6,N*8));pants_masks={}
    for sex in ['male','female']:
        sequences=[]
        for action,fps,hit,phases in schedules:
            source_action='walk' if action=='run' else action
            for d in DIRS:
                frames=[]
                for f,phase in enumerate(phases):
                    transition=phase<0
                    pose_action='idle' if transition else source_action
                    phase=max(0,phase)
                    key=(sex,pose_action,phase,d);base=bodies[key];head=heads[key];anchor=anchors[key];meta=metadata[key]
                    gp=f'gear_{pose_action}_{phase}_{d}';bp=f'{sex}_{pose_action}_{phase}_{d}';name=f'{sex}_{action}_{d}_{f}'
                    nparts=gears[('navy',pose_action,phase,d)];sparts=gears[('silver',pose_action,phase,d)]
                    if gp+'_jacket_navy' not in lookup:
                        variants=[dict(jacket_navy=nparts[0],jacket_wine=dye(nparts[0],'wine'),cuirass_silver=sparts[0],vest_leather=dye(nparts[0],'leather'),dragon_guard=dye(sparts[0],'gold')),dict(pants_dark=nparts[1],pants_linen=dye(nparts[1],'linen'),pants_mail=sparts[1],dragon_legs=dye(sparts[1],'gold')),dict(boots_brown=nparts[2],boots_black=dye(nparts[2],'black'),boots_plate=sparts[2],dragon_boots=dye(sparts[2],'gold'))]
                        for group in variants:
                            for item,im in group.items():add(gp+'_'+item,im)
                        na=arm_layers[('navy',pose_action,phase,d)];sa=arm_layers[('silver',pose_action,phase,d)]
                        for item,im in dict(jacket_navy=na,jacket_wine=dye(na,'wine'),cuirass_silver=sa,vest_leather=dye(na,'leather'),dragon_guard=dye(sa,'gold')).items():add(gp+'_arm_'+item,im)
                    if bp+'_base' not in lookup:
                        if pose_action=='attack':_,bare_hands,_,seen=attack_palms(base,d,phase);bare_hands=bare_hands if seen else []
                        else:bare_hands=[carried_palm(base,d,pose_action,phase,meta)]
                        pkey=(pose_action,phase,d)
                        if pkey not in pants_masks:
                            points={(x,y) for part in [nparts[1],sparts[1]] for y in range(N) for x in range(N) if part.getpixel((x,y))[3]}
                            pants_masks[pkey]={(x+dx,y+dy) for x,y in points for dx in range(-3,4) for dy in [-1,0,1]}
                        for mask in range(8):
                            visible=base.copy()
                            for y in range(N):
                                for x in range(N):
                                    if head.getpixel((x,y))[3]:visible.putpixel((x,y),(0,0,0,0));continue
                                    hand=any(abs(x-hx)<=5 and abs(y-hy)<=5 for hx,hy in bare_hands)
                                    neckline=meta.get('neckY',anchor[1]+15)+3
                                    upper=(neckline<=y<meta['waist']) if 'neckY' in meta else (y<meta['waist'] and not (abs(x-anchor[0])<=4 and anchor[1]+16<=y<=anchor[1]+20))
                                    if mask&1 and (upper or hand):visible.putpixel((x,y),(0,0,0,0))
                                    # Opaque trousers cover skin naturally. Hide
                                    # only underwear, never erase ankle skin:
                                    # that would detach bare feet from the leg.
                                    r,g,b,a=base.getpixel((x,y))
                                    underwear=a and y>=meta['waist']-2 and b>r*1.08 and b>=g and r<110
                                    if mask&2 and not hand and underwear:visible.putpixel((x,y),(0,0,0,0))
                                    # Boots occlude the lower bare leg only if
                                    # worn. Pants remain full length underneath.
                                    if mask&4 and ((x,y) in boot_masks[(pose_action,phase,d)] or y>=118):visible.putpixel((x,y),(0,0,0,0))
                            add(bp+('_base' if mask==0 else '_base_'+str(mask)),visible)
                    add(name+'_identity',head);add(name+'_identity_clothed',clothed_heads[key]);add(name+'_silver',head);add(name+'_warden',base)
                    nfull=dressed[('navy',pose_action,phase,d)];sfull=dressed[('silver',pose_action,phase,d)]
                    palms=[];sets=[];is_attack=pose_action=='attack'
                    if is_attack:
                        for image in [nfull,base,sfull,sfull]:
                            grip,pair,angle,visible=attack_palms(image,d,phase);sets.append(pair)
                        palms=sets[0];grip=palms[0]
                    else:grip=carried_palm(nfull,d,pose_action,phase,meta);angle=-135 if d in ['W','SW','NW'] else -45;visible=True
                    look_grips=[pair[0] for pair in sets] if is_attack else [carried_palm(image,d,pose_action,phase,meta) for image in [nfull,base,sfull,sfull]]
                    baregrip=look_grips[1];staffgrips=look_grips;staffgrip=staffgrips[0]
                    sg=-100 if d in ['W','SW','NW'] else -80
                    swordimgs=[weapon_frame(sword,[6,29],p,angle) for p in look_grips]
                    staffimgs=[weapon_frame(staff,[5,37],p,sg) for p in staffgrips];staffimg=staffimgs[0]
                    add(name+'_sword',swordimgs[0]);add(name+'_staff',staffimg)
                    for i,suffix in enumerate(['','_bare','_silver','_gold']):
                        if suffix:
                            add(name+'_sword'+suffix,swordimgs[i]);add(name+'_staff'+suffix,staffimgs[i])
                        full=[nfull,base,sfull,sfull][i]
                        handpalms=sets[i] if is_attack else [look_grips[i]]
                        add(name+'_hand_sword'+suffix,fingers(full,handpalms,visible));add(name+'_hand_staff'+suffix,fingers(full,[staffgrips[i]],visible))
                    trail=Image.new('RGBA',(CELL,CELL))
                    if action=='attack' and 7<=f<=9:
                        a=math.radians(angle);x=grip[0]+16+math.cos(a)*25;y=grip[1]+24+math.sin(a)*25
                        ImageDraw.Draw(trail).line((x,y-26,x,y),fill=(177,234,246,230),width=3 if f==7 else 2)
                    if action=='attack':add(name+'_trail',trail)
                    order=-1 if is_attack and not visible else 1
                    frame=dict(name=name,index=lookup[name+'_identity'],garmentPrefix=gp,bodyPrefix=bp,headDirection=d,hairPrefix=f'hair_{sex}_{pose_action}_{phase}',hairBaked=True,headAnchor=[anchor[0]+16,anchor[1]+24],handPrefix=name+'_hand',weaponGrips=[[grip[0]+16,grip[1]+24],[staffgrip[0]+16,staffgrip[1]+24]],weaponOrders=[order,1],weaponOrder=order,swordHandsVisible=visible,swordHandSets=[[[x+16,y+24] for x,y in pair] for pair in sets],swordHands=[[x+16,y+24] for x,y in palms],swordAngle=angle,root=ANCHOR,neck=[anchor[0]+16,anchor[1]+44],grip=[grip[0]+16,grip[1]+24],anchorsReviewed=True,jointsReviewed=True,trailActive=action=='attack' and 7<=f<=9,posePhase=phase,transitionPose=transition,source=f'authored-v7/{sex}_{pose_action}_{phase}_{d}')
                    frames.append(frame)
                    frame['weaponGripSets']=[[[p[0]+16,p[1]+24],[p[0]+16,p[1]+24]] for p in look_grips]
                    if action=='idle' and f==0:
                        for look,parts in enumerate([None,nparts,sparts]):
                            assembled=base.copy() if parts is None else Image.new('RGBA',(N,N))
                            if parts:
                                for slot in [1,2,0]:assembled.alpha_composite(parts[slot])
                                assembled.alpha_composite(head)
                            wig=images['hair_chestnut_short_'+d+'_front'].crop((16,24,160,168));assembled.alpha_composite(wig)
                            review.alpha_composite(assembled,((0 if sex=='male' else 3)*N+look*N,DIRS.index(d)*N))
                sequences.append(dict(action=action,direction=d,fps=fps,hitFrame=hit,frames=frames))
        identities.append(dict(id='aether_warden'+('_f' if sex=='female' else ''),name='Ngân Lam · '+('Nữ' if sex=='female' else 'Nam'),texture='aether_shared',sequences=sequences))
    for page in range(math.ceil(len(cells)/256)):
        atlas=Image.new('RGBA',(CELL*16,CELL*16))
        for k,im in enumerate(cells[page*256:(page+1)*256]):atlas.alpha_composite(im,(k%16*CELL,k//16*CELL))
        atlas.save(OUT/f'aether_shared-{page}.png')
    (OUT/'aether_shared-slices.json').write_text(json.dumps(slices),encoding='utf8')
    catalog=dict(version=2,template='adult-modular-v7',drawnBodies=True,integratedHeads=False,modularBody=True,bodyHeight=80,nativeFrameSize=[144,144],frameSize=[CELL,CELL],ppu=48,anchor=ANCHOR,directions=DIRS,hairVariants=False,canonicalHead=[88,72],hairStyles=styles,garmentSlots=SLOTS,outfits=[dict(id='warden',name='Ngân Lam')],weapons=[dict(id='sword',itemId='moonsteel_sword',name='Kiếm Nguyệt Cương',action='attack',skill='slash',fps=18,hitFrame=7,hands=2),dict(id='staff',itemId='aether_staff',name='Trượng Aether',action='cast',skill='aether_bolt',fps=10,hitFrame=4,hands=1)],identities=identities,reviewRequired=False,drawnPoseCount=320,uniqueCells=len(cells))
    catalog['integratedHeads']=INTEGRATED_HEADS
    catalog['canonicalActionHeads']=CANONICAL_ACTION_HEADS
    catalog['transitionPoses']=TRANSITION_POSES
    catalog['hairRevision']=HAIR_REVISION
    catalog['hairBindings']=str(HAIR_OUTPUT.relative_to(OUT)).replace('\\','/')
    (OUT/'catalog.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    review.resize((review.width*2,review.height*2),Image.Resampling.NEAREST).save(OUT/'clothing/modular-v7-directions.png')
    print(f'PASS shared atlas: {len(cells)} unique cells, {len(slices)} names, {len(identities)} identities')

if __name__=='__main__':main()

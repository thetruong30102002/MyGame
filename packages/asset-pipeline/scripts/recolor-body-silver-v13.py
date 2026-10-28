"""Save complete-body silver-hair variants on exactly the same authored poses."""
from pathlib import Path
import json
from collections import deque
from PIL import Image,ImageFilter

ROOT=Path(__file__).resolve().parents[3]
ART=ROOT/'assets/mannequin/v13/source-art/authored'
RAMP=[(46,52,65),(69,77,92),(94,104,122),(124,138,155),(157,172,187),(190,204,216),(222,232,237)]

def palette(colors,count):
    if not colors:return []
    sample=Image.new('RGB',(len(colors),1));sample.putdata(colors)
    reduced=sample.quantize(colors=min(count,len(set(colors))),dither=Image.Dither.NONE).convert('RGB')
    return list(set(reduced.getdata()))

def distance(c,colors):
    return min(sum((v-w)**2 for v,w in zip(c,p)) for p in colors) if colors else 999999

def scalp_component(points):
    remaining=set(points);groups=[]
    while remaining:
        first=remaining.pop();group={first};queue=[first]
        while queue:
            x,y=queue.pop()
            for p in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
                if p in remaining:remaining.remove(p);group.add(p);queue.append(p)
        groups.append(group)
    return max(groups,key=len) if groups else set()

def enclosed_holes(points,box):
    left,top,right,bottom=box;outside=set();queue=deque()
    for x in range(left,right):queue.append((x,top));queue.append((x,bottom-1))
    for y in range(top,bottom):queue.append((left,y));queue.append((right-1,y))
    while queue:
        x,y=queue.popleft()
        if (x,y) in outside or (x,y) in points:continue
        outside.add((x,y))
        for p in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
            if left<=p[0]<right and top<=p[1]<bottom and p not in outside:queue.append(p)
    return {(x,y) for y in range(top,bottom) for x in range(left,right) if (x,y) not in outside and (x,y) not in points}

def physical_skin(image,box):
    """Protect actual bright flesh and its two-pixel painted shadow contour."""
    left,top,right,bottom=box;skin=set()
    for y in range(top,bottom):
        for x in range(left,right):
            r,g,b,a=image.getpixel((x,y))
            if a and r>=210 and g>=130 and b>=65 and r-g>20 and g-b>10:skin.add((x,y))
    mask=Image.new('L',(144,144))
    for p in skin:mask.putpixel(p,255)
    # Preserve the drawn dark contour bordering each actual skin component.
    return mask.filter(ImageFilter.MaxFilter(5))

def recolor(sex,action):
    meta=ART/f'{sex}_{action}.json'
    if not meta.exists():return 0
    records=json.loads(meta.read_text(encoding='utf8'))['records'];count=0
    for record in records:
        d,p=record['direction'],record['phase']
        path=ART/f'{sex}_chestnut_short_{action}_{p}_{d}.png'
        if not path.exists():continue
        image=Image.open(path).convert('RGBA');original=image.copy();l,t,r,b=record['headBox'];cut=t+round((b-t)*.6)
        left,top,right,bottom=max(0,l-6),max(0,t-7),min(144,r+6),min(144,b+3)
        colors=[];skin_colors=[]
        for y in range(top,cut):
            for x in range(left,right):
                red,green,blue,a=image.getpixel((x,y))
                if record.get('handsVisible',True) and any(ll<=x<=rr and tt<=y<=bb for ll,tt,rr,bb in record.get('hand_boxes',[])):continue
                if a and 40<=red<155 and green<110 and blue<85 and red>green*1.1 and blue<red*.95:
                    colors.append((red,green,blue))
        for y in range(record['neckY']+4,record['waistY']):
            for x in range(60,84):
                red,green,blue,a=image.getpixel((x,y))
                if a and red>130 and green>75 and blue>45 and red-green>20 and green-blue>10:
                    skin_colors.append((red,green,blue))
        hair_palette=palette(colors,32);skin_palette=palette(skin_colors,24)
        # Apply the canopy's brown ramp to the WHOLE head, behind ears and at
        # the nape. The old central-face rectangle left a brown helmet band on
        # rear views. Pixel colour proximity to actual torso skin protects
        # face/neck/raised forearms without masking lower/back hair wholesale.
        changed=set();protected=physical_skin(original,(left,top,right,bottom))
        for y in range(top,bottom):
            for x in range(left,right):
                red,green,blue,a=image.getpixel((x,y))
                if not a or red<40 or red>=246 or red<=green*1.1 or blue>=red*.95:continue
                if protected.getpixel((x,y)) or (red>=180 and red-green>20 and green-blue>10):continue
                lum=(red*.30+green*.59+blue*.11)
                shade=min(6,max(0,round((lum-30)/20)))
                image.putpixel((x,y),(*RAMP[shade],255))
                changed.add((x,y))
        # Keep the actual changed hair-pixel mask for the source-art audit.
        scalp=set(changed)
        # Brown highlights enclosed by the scalp are hair, not skin. Filling
        # only these bounded holes removes the rear helmet band without using
        # a rectangle over arms, fingers or face connected to the outside.
        for x,y in enclosed_holes(scalp,(left,top,right,bottom)):
            red,green,blue,a=original.getpixel((x,y))
            if a and 40<=red<180 and red>green*1.1 and blue<red*.95 and not protected.getpixel((x,y)):
                lum=red*.30+green*.59+blue*.11;shade=min(6,max(0,round((lum-30)/20)))
                image.putpixel((x,y),(*RAMP[shade],255));scalp.add((x,y))
        if d in ['N','NE']:
            # Rear-view crown highlights are unambiguously inside the scalp,
            # away from the arms circling its outer edge. Preserve all bright
            # flesh (>=210); recolour only the medium brown internal highlight
            # ramp that otherwise forms a horizontal brown helmet band.
            cx=(l+r-1)/2;cy=t+(b-t)*.38;rx=(r-l)*.34;ry=(b-t)*.27
            for y in range(top,bottom):
                for x in range(left,right):
                    red,green,blue,a=original.getpixel((x,y))
                    if a and 180<=red<210 and red-green>20 and green-blue>10 and ((x-cx)/rx)**2+((y-cy)/ry)**2<=1:
                        lum=red*.30+green*.59+blue*.11;shade=min(6,max(0,round((lum-30)/20)))
                        image.putpixel((x,y),(*RAMP[shade],255));scalp.add((x,y))
        mask=Image.new('L',(144,144))
        for point in scalp:mask.putpixel(point,255)
        masks=ART.parent/'hair-masks';masks.mkdir(exist_ok=True)
        mask.save(masks/f'{sex}_{action}_{p}_{d}.png')
        image.save(ART/f'{sex}_silver_swept_{action}_{p}_{d}.png');count+=1
    return count

if __name__=='__main__':
    count=sum(recolor(sex,action) for sex in ['male','female'] for action in ['idle','walk','attack','cast'])
    print(f'Saved {count} complete-body silver variants; anatomy and alpha unchanged')

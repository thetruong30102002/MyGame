"""Register authored run/cleave/outfit art; pose guides are never game assets.

One nearest-neighbour scale per source/action, shared 112 grid and fixed head.
No mirrored-leg substitute, cropped-foot fallback or interpolated anatomy.
"""
from pathlib import Path
from statistics import median
from collections import deque
import json, shutil
from PIL import Image

ROOT=Path(__file__).resolve().parents[3]
ART=ROOT/'assets/mannequin/v2/source-art'
RAW=ART/'v4'; OLD=ART/'authored-v3'; OUT=ART/'authored-v4'
OUT.mkdir(exist_ok=True)
DIRS=['S','SW','W','NW','N','NE','E','SE']
KINDS=['clothed','bare','silver','gold']

def component(points):
    points=set(points); largest=[]
    while points:
        start=points.pop(); group=[start]; queue=deque([start])
        while queue:
            x,y=queue.popleft()
            for q in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
                if q in points: points.remove(q);queue.append(q);group.append(q)
        if len(group)>len(largest):largest=group
    return largest

def clean(image):
    image=image.convert('RGBA'); pixels=image.load(); points=[]
    for y in range(image.height):
        for x in range(image.width):
            r,g,b,a=pixels[x,y]
            artifact=r>175 and g<60 and b<75
            if a>=235 and not artifact:points.append((x,y));pixels[x,y]=(r,g,b,255)
            else:pixels[x,y]=(0,0,0,0)
    keep=set(component(points))
    for x,y in points:
        if (x,y) not in keep:pixels[x,y]=(0,0,0,0)
    assert image.getbbox(),'Empty authored pose'
    return image

def hair(image):
    x0,y0,x1,y1=image.getbbox(); points=[]
    for y in range(y0,round(y0+(y1-y0)*.56)):
        for x in range(x0,x1):
            r,g,b,a=image.getpixel((x,y))
            if a and min(r,g,b)>80 and max(r,g,b)-min(r,g,b)<55:points.append((x,y))
    group=component(points);assert group,'No head in pose'
    return sum(x for x,y in group)/len(group),min(y for x,y in group),max(y for x,y in group)+1

def row_bands(image,rows):
    # The generator can leave unequal margins: split in the transparent gaps.
    active=[]
    for y in range(image.height):
        n=sum(1 for r,g,b,a in image.crop((0,y,image.width,y+1)).getdata() if a>=235 and not(r>175 and g<60 and b<75))
        if n>image.width*.009:active.append(y)
    gaps=[(a+b)//2 for a,b in zip(active,active[1:]) if b-a>image.height/rows*.065]
    if len(gaps)!=rows-1:
        # Choose the widest blank interval near each expected row separator.
        gaps=[]
        for n in range(1,rows):
            candidates=[(b-a,(a+b)//2) for a,b in zip(active,active[1:]) if abs((a+b)/2-n*image.height/rows)<image.height/rows*.28]
            assert candidates,('No row gap',rows,n)
            gaps.append(max(candidates)[1])
    return [0]+gaps+[image.height]

def crop_sheet(action,kind):
    image=Image.open(RAW/f'{action}-{kind}.png').convert('RGBA')
    reference=Image.open(RAW/f'{action}-clothed.png').convert('RGBA') if action in ['run','attack'] else image
    if image.size!=reference.size:image=image.resize(reference.size,Image.Resampling.NEAREST)
    rows=5 if action=='run' else 7 if action=='attack' else 4 if action!='idle' else 1
    bands=row_bands(reference,rows); result={}
    row_dirs=['S','W','N','SW','NW']
    for row in range(rows):
        for col in range(8):
            pose=clean(image.crop((round(col*image.width/8),bands[row],round((col+1)*image.width/8),bands[row+1])))
            phase,direction=(col,row_dirs[row]) if action=='run' else (row,DIRS[col])
            result[(phase,direction)]=pose
    if action=='run':
        for phase in range(8):
            for a,b in [('W','E'),('SW','SE'),('NW','NE')]:result[(phase,b)]=result[(phase,a)].transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    return result

def register(source,scale,floor,reference=None):
    reference=reference if reference is not None else source
    rx,_,_=hair(reference);ry=reference.getbbox()[3]-1
    cell=Image.new('RGBA',(112,112))
    for y in range(112):
        sy=round(ry+(y-floor)/scale)
        if not 0<=sy<source.height:continue
        for x in range(112):
            sx=round(rx+(x-56)/scale)
            if 0<=sx<source.width:cell.putpixel((x,y),source.getpixel((sx,sy)))
    return cell

old_layout=json.loads((OLD/'layout.json').read_text())
records=[]
for action in ['idle','walk','run','attack','cast']:
    count={'idle':1,'walk':4,'run':8,'attack':7,'cast':4}[action]
    native={}
    if action in ['idle','walk','cast']:
        for p in old_layout['poses']:
            if p['action']!=action:continue
            records.append(dict(p))
            for kind in KINDS[:3]:native[(p['phase'],p['direction'],kind)]=Image.open(OLD/f"{action}_{p['phase']}_{p['direction']}_{kind}.png").convert('RGBA')
    reference_sources=crop_sheet(action,'clothed') if action in ['run','attack'] else None
    for kind in KINDS if action in ['run','attack'] else ['gold']:
        sources=crop_sheet(action,kind)
        # Calibrate from hair to sole; the raised fist never shrinks a body.
        scale=72/median(im.getbbox()[3]-hair(im)[1] for im in (reference_sources or sources).values())
        for (phase,direction),source in sources.items():
            floor=[100,101,98,96,100,101,98,96][phase] if action=='run' else 100
            native[(phase,direction,kind)]=register(source,scale,floor,reference_sources[(phase,direction)] if reference_sources else None)
    if action=='attack':
        # During the north-facing downswing the torso turns NW while the fixed
        # head still looks north. Use that complete drawn body/arm pose, since
        # the straight-back source hides its gripping fist behind the skull.
        for kind in KINDS:
            for target,source in [('S','SW'),('N','NW'),('E','NE')]:native[(3,target,kind)]=native[(3,source,kind)].copy()
            native[(3,'SE',kind)]=native[(3,'SW',kind)].transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    for phase in range(count):
        for direction in DIRS:
            coat=native[(phase,direction,'clothed')];body=native[(phase,direction,'bare')]
            if action in ['run','attack']:
                _,head_top,_=hair(coat)
                head_direction={'S':'SW','N':'NW','E':'NE'}.get(direction,direction) if action=='attack' and phase==3 else direction
                idle_record=next(p for p in old_layout['poses'] if p['action']=='idle' and p['direction']==head_direction)
                idle_image=Image.open(OLD/f'idle_0_{head_direction}_clothed.png').convert('RGBA')
                neck=head_top+idle_record['neck']-idle_image.getbbox()[1]
                records.append(dict(action=action,phase=phase,direction=direction,headDirection=head_direction,neck=neck,waist=head_top+round((coat.getbbox()[3]-head_top)*.62),boot=89,sourceScale='fixed-per-action',headTop=head_top))
            for kind in KINDS:native[(phase,direction,kind)].save(OUT/f'{action}_{phase}_{direction}_{kind}.png')
    for kind in KINDS:
        sheet=Image.new('RGBA',(112*8,112*count))
        for phase in range(count):
            for d,direction in enumerate(DIRS):sheet.alpha_composite(native[(phase,direction,kind)],(d*112,phase*112))
        sheet.save(OUT/f'{action}-{kind}.png')
        sheet.resize((sheet.width*2,sheet.height*2),Image.Resampling.NEAREST).save(OUT/f'{action}-{kind}-2x.png')

sword=clean(Image.open(RAW/'moonsteel-sword-raw.png'))
sword=sword.crop(sword.getbbox()).resize((12,36),Image.Resampling.NEAREST)
sword.save(OUT/'moonsteel-sword.png')
(OUT/'layout.json').write_text(json.dumps(dict(frameSize=[112,112],anchor=[56,100],directions=DIRS,poses=records),ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(f'Prepared {len(records)} authored poses, 4 body/outfit variants each; run has8 drawn phases, cleave7.')

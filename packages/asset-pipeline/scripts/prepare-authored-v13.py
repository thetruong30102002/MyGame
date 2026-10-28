"""Extract registered drawn poses; phase zero alone defines each row's scale.

All paired full-body/clothes sheets reuse registration-v13.json. Grid cells are
first mapped to the known 144-square reference grid, then one uniform row scale
and one root translation apply to every pose. No pose/body-part fitting.
"""
from pathlib import Path
from collections import deque
import argparse,json
from PIL import Image,ImageDraw

ROOT=Path(__file__).resolve().parents[3]
ART=ROOT/'assets/mannequin/v13/source-art'
OUT=ART/'authored'
DIRS=['S','E','N','SE','NE']

def clean_actor(im):
    im=im.convert('RGBA');w,h=im.size;points=set()
    for y in range(h):
        for x in range(w):
            r,g,b,a=im.getpixel((x,y))
            guide=(r>190 and g<75 and b<90) or (g>170 and r<95 and b<100) or (r>160 and b>150 and g<100)
            if a>=235 and not guide:points.add((x,y))
    groups=[]
    while points:
        start=points.pop();q=deque([start]);group=[start]
        while q:
            x,y=q.popleft()
            for p in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
                if p in points:points.remove(p);group.append(p);q.append(p)
        groups.append(group)
    keep=max(groups,key=len)
    out=Image.new('RGBA',im.size)
    for p in keep:out.putpixel(p,(*im.getpixel(p)[:3],255))
    return out

def tiles(path,cols,rows=5):
    sheet=Image.open(path).convert('RGBA');result={}
    for row,d in enumerate(DIRS[:rows]):
        for phase in range(cols):
            box=(round(phase*sheet.width/cols),round(row*sheet.height/rows),round((phase+1)*sheet.width/cols),round((row+1)*sheet.height/rows))
            tile=clean_actor(sheet.crop(box))
            result[(d,phase)]=tile.resize((144,144),Image.Resampling.NEAREST)
    return result

def extract(action,cols,source=None,output_pattern=None,paired=False):
    OUT.mkdir(parents=True,exist_ok=True)
    registration_path=ART/'registration-v13.json'
    registration=json.loads(registration_path.read_text(encoding='utf8')) if registration_path.exists() else {}
    source=source or ART/f'male-{action}-drawn.png'
    raw=tiles(source,cols)
    contact=Image.new('RGBA',(144*cols,144*5),(30,32,35,255))
    for row,d in enumerate(DIRS):
        key=f'{action}_{d}'
        if not paired:
            box=raw[(d,0)].getbbox();scale=74/(box[3]-box[1])
            size=round(144*scale)
            reference=raw[(d,0)].resize((size,size),Image.Resampling.NEAREST)
            box=reference.getbbox()
            translation=[72-round((box[0]+box[2]-1)/2),128-(box[3]-1)]
            registration[key]=dict(scale=scale,size=size,translate=translation,root=[72,128],referencePhase=0,referenceBounds=box)
        transform=registration[key];size=transform['size'];translation=transform['translate']
        for phase in range(cols):
            tile=raw[(d,phase)].resize((size,size),Image.Resampling.NEAREST)
            out=Image.new('RGBA',(144,144));out.alpha_composite(tile,tuple(translation))
            pattern=output_pattern or f'male_chestnut_short_{action}_{{phase}}_{{direction}}.png'
            family=Path(pattern).name.split(f'_{action}_')[0]
            family_path=ART/'family-registration-v13.json'
            families=json.loads(family_path.read_text(encoding='utf8')) if family_path.exists() else {}
            if family in families:
                delta=families[family][d]['translate']
                shifted=Image.new('RGBA',(144,144));shifted.alpha_composite(out,tuple(delta));out=shifted
            target=OUT/pattern.format(phase=phase,direction=d);target.parent.mkdir(parents=True,exist_ok=True);out.save(target)
            contact.alpha_composite(out,(144*phase,144*row))
    registration_path.write_text(json.dumps(registration,indent=2)+'\n',encoding='utf8')
    prefix=Path(output_pattern).name.split(f'_{action}_')[0] if output_pattern else 'male'
    contact.save(ART/f'{prefix}-{action}-extracted-native.png')
    contact.resize((contact.width*4,contact.height*4),Image.Resampling.NEAREST).save(ART/f'{prefix}-{action}-extracted-4x.png')
    print(f'Extracted {action}: {5*cols} poses with 5 phase-zero registered row transforms')

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('action');parser.add_argument('columns',type=int)
    parser.add_argument('--source',type=Path);parser.add_argument('--output-pattern');parser.add_argument('--paired',action='store_true')
    args=parser.parse_args();extract(args.action,args.columns,args.source,args.output_pattern,args.paired)

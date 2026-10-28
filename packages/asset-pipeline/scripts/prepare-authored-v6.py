"""Register modular adult artwork on one144px rig. No anatomical deformation.

Male/female bodies, shared equipment and hair are independent source assets.
One uniform scale per sheet; whole poses are translated to their foot root.
"""
from pathlib import Path
from collections import deque
from statistics import median
import json, math, sys
from PIL import Image,ImageDraw

ROOT=Path(__file__).resolve().parents[3]
RAW=ROOT/'assets/mannequin/v2/source-art/v6'
OUT=ROOT/'assets/mannequin/v2/source-art/authored-v6'
OUT.mkdir(exist_ok=True)
DIRS=['S','SW','W','NW','N','NE','E','SE']
ROWS=['S','W','N','SW','NW']
COUNTS={'idle':1,'walk':8,'attack':7,'cast':4}
SIZE=144
ROOT_X,ROOT_Y=72,128

def components(points):
    points=set(points);groups=[]
    while points:
        queue=[points.pop()];group=[]
        while queue:
            x,y=queue.pop();group.append((x,y))
            for dx,dy in [(-1,0),(1,0),(0,-1),(0,1),(-1,-1),(1,1),(-1,1),(1,-1)]:
                q=(x+dx,y+dy)
                if q in points:points.remove(q);queue.append(q)
        groups.append(group)
    return sorted(groups,key=len,reverse=True)

def clean(image,proxy=False):
    image=image.convert('RGBA');points=[];px=image.load()
    for y in range(image.height):
        for x in range(image.width):
            r,g,b,a=px[x,y]
            artifact=(r>175 and g<60 and b<75) or (r>170 and g>170 and b<70 and abs(r-g)<40)
            guide=proxy and ((r>20 and b>20 and r>g*1.65 and b>g*1.3) or (g>25 and g>r*1.16 and g>b*1.6))
            if a>=235 and not artifact and not guide:points.append((x,y));px[x,y]=(r,g,b,255)
            else:px[x,y]=(0,0,0,0)
    groups=components(points);assert groups,'Empty pose'
    keep=set(groups[0])
    for p in points:
        if p not in keep:px[p[0],p[1]]=(0,0,0,0)
    return image

def crop_sheet(path,action):
    im=Image.open(path).convert('RGBA');cols=8 if action=='idle' else COUNTS[action];rows=1 if action=='idle' else 5
    result={}
    for row in range(rows):
        for col in range(cols):
            cell=im.crop((round(col*im.width/cols),round(row*im.height/rows),round((col+1)*im.width/cols),round((row+1)*im.height/rows)))
            phase,direction=(0,DIRS[col]) if action=='idle' else(col,ROWS[row])
            result[(phase,direction)]=clean(cell)
    return result

def registered_sheet(path,action):
    """Registration fiducials preserve the shared rig, independent of export size."""
    im=Image.open(path).convert('RGBA');cols,rows=(4,2) if action=='idle' else(COUNTS[action],5)
    result={}
    for row in range(rows):
        for col in range(cols):
            cell=im.crop((round(col*im.width/cols),round(row*im.height/rows),round((col+1)*im.width/cols),round((row+1)*im.height/rows)))
            marks=[]
            for kind in ['green','pink']:
                pts=[]
                for y in range(cell.height):
                    for x in range(cell.width):
                        r,g,b,a=cell.getpixel((x,y))
                        color=(g>210 and r<60 and b<60) if kind=='green' else(r>210 and b>210 and g<60)
                        corner=(x<cell.width*.16 and y<cell.height*.16) if kind=='green' else(x>cell.width*.8 and y>cell.height*.8)
                        if a>=200 and color and corner:pts.append((x,y))
                groups=components(pts)
                if not groups:
                    at=5.5 if kind=='green' else 137.5
                    marks.append((at*cell.width/SIZE,at*cell.height/SIZE))
                else:
                    pts=groups[0];marks.append((sum(x for x,y in pts)/len(pts),sum(y for x,y in pts)/len(pts)))
            sx=(marks[1][0]-marks[0][0])/132;sy=(marks[1][1]-marks[0][1])/132
            if abs(sx/sy-1)>=.08:
                # A misplaced decorative fiducial must not stretch anatomy.
                # The sheet itself retains a uniform, known cell grid.
                sx=cell.width/SIZE;marks[0]=(5.5*sx,marks[0][1])
            tile=Image.new('RGBA',(SIZE,SIZE))
            for y in range(12,134):
                for x in range(12,134):
                    px=cell.getpixel((min(cell.width-1,max(0,round(marks[0][0]+(x-5.5)*sx))),min(cell.height-1,max(0,round(marks[0][1]+(y-5.5)*sy)))))
                    if px[3]>=235:tile.putpixel((x,y),(*px[:3],255))
            phase,direction=(0,DIRS[row*4+col]) if action=='idle' else(col,ROWS[row])
            result[(phase,direction)]=clean(tile)
    return result

def head_width(im):
    box=im.getbbox();best=0
    for y in range(box[1],round(box[1]+(box[3]-box[1])*.18)):
        run=0
        for x in range(box[0],box[2]):
            if im.getpixel((x,y))[3]:run+=1;best=max(best,run)
            else:run=0
    return best

def foot_center(im,scale):
    box=im.getbbox();bottom=box[3]-1;points=[]
    for y in range(max(box[1],bottom-max(2,round(4/scale))),bottom+1):
        for x in range(box[0],box[2]):
            if im.getpixel((x,y))[3]:points.append(x)
    return (min(points)+max(points))/2,bottom

def register(im,scale,action):
    cx,floor=foot_center(im,scale);box=im.getbbox()
    if action!='attack':
        # PixelLab keeps the torso steady: the midpoint of a lifted/extended
        # foot is not the root. Register locomotion on the scalp centre.
        points=[x for y in range(box[1],round(box[1]+(box[3]-box[1])*.10)) for x in range(box[0],box[2]) if im.getpixel((x,y))[3]]
        cx=sum(points)/len(points)
    out=Image.new('RGBA',(SIZE,SIZE))
    for y in range(SIZE):
        sy=round(floor+(y-ROOT_Y)/scale)
        if not 0<=sy<im.height:continue
        for x in range(SIZE):
            sx=round(cx+(x-ROOT_X)/scale)
            if 0<=sx<im.width:out.putpixel((x,y),im.getpixel((sx,sy)))
    return out,dict(scale=scale,cx=cx,floor=floor)

def head_anchor(im,direction):
    threshold=9 if direction in ['W','NW','NE','E'] else 11
    for y in range(38,100):
        runs=[];start=None
        for x in range(35,110):
            if im.getpixel((x,y))[3]:
                if start is None:start=x
            elif start is not None:
                if x-start>=threshold:runs.append((start,x))
                start=None
        if runs:
            a,b=min(runs,key=lambda r:abs((r[0]+r[1])/2-ROOT_X))
            return [round((a+b-1)/2),y-2]
    raise ValueError('No bald head '+direction)

def rig_scale(im,scale):
    out=Image.new('RGBA',(SIZE,SIZE))
    for y in range(SIZE):
        sy=round(ROOT_Y+(y-ROOT_Y)/scale)
        if not 0<=sy<SIZE:continue
        for x in range(SIZE):
            sx=round(ROOT_X+(x-ROOT_X)/scale)
            if 0<=sx<SIZE:out.putpixel((x,y),im.getpixel((sx,sy)))
    return out

def pelvis(im):
    points=[]
    for y in range(76,122):
        for x in range(32,113):
            r,g,b,a=im.getpixel((x,y))
            if a and b>r*1.08 and b>=g and r<110:points.append((x,y))
    groups=[g for g in components(points) if len(g)>8]
    assert groups,'No underwear pelvis'
    group=max(groups,key=lambda g:sum(y for x,y in g)/len(g))
    return dict(waist=min(y for x,y in group),hip=[round(sum(x for x,y in group)/len(group)),round(sum(y for x,y in group)/len(group))])

def normalize(sex,action):
    path=RAW/f'{sex}-{action}-raw.png'
    marked=sex=='female' and action!='idle'
    sources=registered_sheet(path,action) if marked else crop_sheet(path,action)
    heights=[im.getbbox()[3]-im.getbbox()[1] for im in sources.values()]
    if marked and action=='attack':scale=1
    elif action=='attack':
        master=Image.open(OUT/'male_idle_0_S.png').convert('RGBA')
        scale=head_width(master)/head_width(sources[(4,'S')])
    else:scale=80/median(heights)
    result={};records=[]
    for (phase,direction),source in sources.items():
        im,transform=register(source,scale,action)
        if action=='attack':im=rig_scale(im,.9)
        result[(phase,direction)]=im
        try:hips=pelvis(im)
        except AssertionError:
            im.resize((512,512),Image.Resampling.NEAREST).save(RAW/f'debug-{sex}-{action}-{phase}-{direction}.png')
            raise ValueError(f'No underwear {sex}/{action}/{phase}/{direction}')
        records.append(dict(action=action,phase=phase,direction=direction,headAnchor=head_anchor(im,direction),**hips,**transform))
    if action!='idle':
        for phase in range(COUNTS[action]):
            for a,b in [('W','E'),('SW','SE'),('NW','NE')]:
                result[(phase,b)]=result[(phase,a)].transpose(Image.Transpose.FLIP_LEFT_RIGHT)
                origin=next(r for r in records if r['phase']==phase and r['direction']==a)
                records.append(dict(origin,direction=b,headAnchor=[SIZE-1-origin['headAnchor'][0],origin['headAnchor'][1]],hip=[SIZE-1-origin['hip'][0],origin['hip'][1]]))
    sheet=Image.new('RGBA',(SIZE*(8 if action=='idle' else COUNTS[action]),SIZE*(1 if action=='idle' else 5)))
    for (phase,direction),im in result.items():
        im.save(OUT/f'{sex}_{action}_{phase}_{direction}.png')
        if action=='idle':sheet.alpha_composite(im,(DIRS.index(direction)*SIZE,0))
        elif direction in ROWS:sheet.alpha_composite(im,(phase*SIZE,ROWS.index(direction)*SIZE))
    sheet.save(OUT/f'{sex}-{action}.png')
    sheet.resize((sheet.width*2,sheet.height*2),Image.Resampling.NEAREST).save(RAW/f'{sex}-{action}-master.png')
    cols,rows=(4,2) if action=='idle' else(COUNTS[action],5)
    template=Image.new('RGBA',(cols*SIZE,rows*SIZE))
    for row in range(rows):
        for col in range(cols):
            direction=DIRS[row*4+col] if action=='idle' else ROWS[row]
            phase=0 if action=='idle' else col
            tile=result[(phase,direction)].copy();draw=ImageDraw.Draw(tile)
            draw.rectangle((4,4,7,7),fill=(0,255,0,255));draw.rectangle((136,136,139,139),fill=(255,0,255,255))
            template.alpha_composite(tile,(col*SIZE,row*SIZE))
    template.resize((template.width*2,template.height*2),Image.Resampling.NEAREST).save(RAW/f'{sex}-{action}-template.png')
    meta=OUT/f'{sex}-{action}.json';meta.write_text(json.dumps(dict(action=action,sex=sex,records=records),ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print(sex,action,'poses',len(records),'scale',round(scale,4),'front bounds',result[(0,'S')].getbbox(),'head width',head_width(result[(0,'S')]))

if __name__=='__main__':
    normalize(sys.argv[1],sys.argv[2])

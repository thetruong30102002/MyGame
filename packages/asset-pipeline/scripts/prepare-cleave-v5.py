"""Register drawn two-handed poses and their painted sword guide.

The fluorescent proxy is registration data only. Body pixels are neither bent
nor interpolated. Matching equipment sheets share exactly the same transform.
"""
from pathlib import Path
from statistics import median
from collections import deque
import json, math, sys
from PIL import Image

ROOT=Path(__file__).resolve().parents[3]
ART=ROOT/'assets/mannequin/v2/source-art'
RAW=ART/'v5'; OUT=ART/'authored-v4'
DIRS=['S','SW','W','NW','N','NE','E','SE']
ROWS=['S','W','N','SW','NW']
KINDS=['clothed','bare','silver','gold']

def marker(c):
    r,g,b,a=c
    return a>0 and ((r>20 and b>20 and r>g*1.65 and b>g*1.3) or (g>25 and g>r*1.16 and g>b*1.6))

def pink(c):
    r,g,b,a=c
    return a>100 and r>150 and b>85 and r>g*1.65 and b>g*1.3

def green(c):
    r,g,b,a=c
    return a>100 and g>100 and g>r*1.16 and g>b*1.6

def body(im):
    result=im.copy().convert('RGBA')
    for y in range(im.height):
        for x in range(im.width):
            c=result.getpixel((x,y));r,g,b,a=c
            if a<235 or marker(c) or (r>170 and g<65 and b<90):result.putpixel((x,y),(0,0,0,0))
            else:result.putpixel((x,y),(r,g,b,255))
    return result

def isolate(im):
    points={(x,y) for y in range(im.height) for x in range(im.width) if im.getpixel((x,y))[3]>=235}
    biggest=[]
    while points:
        queue=[points.pop()];group=[]
        while queue:
            x,y=queue.pop();group.append((x,y))
            for dy in [-1,0,1]:
                for dx in [-1,0,1]:
                    q=(x+dx,y+dy)
                    if q in points:points.remove(q);queue.append(q)
        if len(group)>len(biggest):biggest=group
    out=Image.new('RGBA',im.size)
    for p in biggest:out.putpixel(p,im.getpixel(p))
    return out

def hair(im):
    box=im.getbbox();points=set()
    for y in range(box[1],round(box[1]+(box[3]-box[1])*.6)):
        for x in range(box[0],box[2]):
            r,g,b,a=im.getpixel((x,y))
            if a and min(r,g,b)>80 and max(r,g,b)-min(r,g,b)<55:points.add((x,y))
    groups=[]
    while points:
        q=[points.pop()];group=[]
        while q:
            p=q.pop();group.append(p)
            for n in [(p[0]-1,p[1]),(p[0]+1,p[1]),(p[0],p[1]-1),(p[0],p[1]+1)]:
                if n in points:points.remove(n);q.append(n)
        groups.append(group)
    assert groups,'No silver hair'
    significant=[g for g in groups if len(g)>=max(4,max(map(len,groups))*.1)]
    top=min(min(y for x,y in g) for g in significant)
    head=[p for g in significant for p in g if p[1]<top+(box[3]-top)*.22]
    return sum(x for x,y in head)/len(head),top

def register(im,ref,scale):
    # The whole pose stays intact, including the head and both gripping arms.
    cx,top=hair(ref);floor=ref.getbbox()[3]-1
    out=Image.new('RGBA',(112,112))
    for y in range(112):
        sy=round(floor+(y-100)/scale)
        if not 0<=sy<im.height:continue
        for x in range(112):
            sx=round(cx+(x-56)/scale)
            if 0<=sx<im.width:out.putpixel((x,y),im.getpixel((sx,sy)))
    return out

def guide(im):
    blade=[];handle=[]
    for y in range(im.height):
        for x in range(im.width):
            c=im.getpixel((x,y))
            if pink(c):blade.append((x,y))
            if green(c):handle.append((x,y))
    assert len(blade)>5, ('Missing painted blade guide',len(blade))
    if len(handle)<3:
        # Recovery viewed from behind: the real two-handed grip is completely
        # occluded by the torso/head. Do not paste fake fists over the hair.
        cx=round(sum(x for x,y in blade)/len(blade));end=max(y for x,y in blade)
        return dict(angle=-90,upper=[cx,end+4],lower=[cx,end+10],visible=False)
    bx=sum(x for x,y in blade)/len(blade);by=sum(y for x,y in blade)/len(blade)
    hx=sum(x for x,y in handle)/len(handle);hy=sum(y for x,y in handle)/len(handle)
    length=math.hypot(bx-hx,by-hy);ax=(bx-hx)/length;ay=(by-hy)/length
    # Guard is the lime point nearest the magenta blade, hands lie behind it.
    extent=max(x*ax+y*ay for x,y in handle)
    cross=sum(-x*ay+y*ax for x,y in blade)/len(blade)
    guard=(extent*ax-cross*ay,extent*ay+cross*ax)
    return dict(angle=math.degrees(math.atan2(ay,ax)),upper=[round(guard[0]-ax*3),round(guard[1]-ay*3)],lower=[round(guard[0]-ax*9),round(guard[1]-ay*9)],visible=True)

def assemble():
    # Full first draft contains only four rows. Its front row is accepted;
    # other directions are individually authored, not repurposed front views.
    front=Image.open(RAW/'attack-clothed-guide.png').convert('RGBA')
    cuts=json.loads((RAW/'row-layout.json').read_text(encoding='utf8'))
    source={}
    for direction in ROWS:
        im=front.crop(tuple(cuts['S'])) if direction=='S' else Image.open(RAW/f'attack-{direction}.png').convert('RGBA')
        for phase in range(7):source[(phase,direction)]=isolate(im.crop((round(phase*im.width/7),0,round((phase+1)*im.width/7),im.height)))
    sheet=Image.new('RGBA',(7*112,5*112));records=[]
    for row,direction in enumerate(ROWS):
        scale=72/median(im.getbbox()[3]-hair(im)[1] for im in [body(source[(p,direction)]) for p in range(7)])
        for phase in range(7):
            raw=source[(phase,direction)];ref=body(raw)
            native=register(raw,ref,scale)
            sheet.alpha_composite(native,(phase*112,row*112))
            try:contact=guide(native)
            except AssertionError:
                native.resize((448,448),Image.Resampling.NEAREST).save(RAW/f'debug-{direction}-{phase}.png')
                raise RuntimeError(f'Invalid guide {direction}/{phase}')
            records.append(dict(phase=phase,direction=direction,**contact))
    sheet.save(RAW/'attack-clothed-proxy-native.png')
    sheet.resize((sheet.width*3,sheet.height*3),Image.Resampling.NEAREST).save(RAW/'attack-clothed-proxy.png')
    (RAW/'contacts.json').write_text(json.dumps(records,indent=2)+'\n',encoding='utf8')
    print('Prepared 35 whole drawn poses and sword axes; equipment editing input ready')

def export():
    reference=Image.open(RAW/'attack-clothed-proxy-native.png').convert('RGBA')
    native={}
    for kind in KINDS:
        im=Image.open(RAW/f'attack-{kind}-drawn.png').convert('RGBA').resize(reference.size,Image.Resampling.NEAREST)
        for row,direction in enumerate(ROWS):
            for phase in range(7):
                pose=im.crop((phase*112,row*112,(phase+1)*112,(row+1)*112))
                pose.putalpha(pose.getchannel('A').point(lambda a:255 if a>=235 else 0))
                native[(phase,direction,kind)]=pose
        for phase in range(7):
            for a,b in [('W','E'),('SW','SE'),('NW','NE')]:native[(phase,b,kind)]=native[(phase,a,kind)].transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    contacts=json.loads((RAW/'contacts.json').read_text(encoding='utf8'))
    bykey={(p['phase'],p['direction']):p for p in contacts}
    layout=json.loads((OUT/'layout.json').read_text(encoding='utf8'))
    for record in layout['poses']:
        if record['action']!='attack':continue
        phase,direction=record['phase'],record['direction']
        source={'E':'W','SE':'SW','NE':'NW'}.get(direction,direction)
        contact=bykey[(phase,source)]
        mirrored=source!=direction
        record.update(swordAngle=180-contact['angle'] if mirrored else contact['angle'],swordHands=[[111-p[0],p[1]] if mirrored else p for p in [contact['upper'],contact['lower']]],swordHandsVisible=contact['visible'] and not(direction=='N' and phase in [0,3]),headDirection=direction,sourceScale='fixed-per-action-v5')
        _,top=hair(native[(phase,direction,'clothed')]);record.update(headTop=top,neck=top+22,waist=top+round((101-top)*.62),boot=89)
        for kind in KINDS:native[(phase,direction,kind)].save(OUT/f'attack_{phase}_{direction}_{kind}.png')
    for kind in KINDS:
        sheet=Image.new('RGBA',(8*112,7*112))
        for phase in range(7):
            for d,direction in enumerate(DIRS):sheet.alpha_composite(native[(phase,direction,kind)],(d*112,phase*112))
        sheet.save(OUT/f'attack-{kind}.png')
        sheet.resize((sheet.width*2,sheet.height*2),Image.Resampling.NEAREST).save(OUT/f'attack-{kind}-2x.png')
    (OUT/'layout.json').write_text(json.dumps(layout,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    sword=Image.open(RAW/'moonsteel-twohand-raw.png').convert('RGBA')
    # One uniform scale, preserving the new long two-handed hilt.
    alpha=sword.getchannel('A').point(lambda a:255 if a>=235 else 0);sword.putalpha(alpha)
    sword=sword.crop(sword.getbbox()).resize((12,42),Image.Resampling.NEAREST)
    sword.save(OUT/'moonsteel-sword.png')
    print('Exported 56 two-handed poses x4 skins, sword and per-pose two-palm anchors')

if __name__=='__main__':
    assemble() if len(sys.argv)>1 and sys.argv[1]=='assemble' else export()

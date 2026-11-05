"""Proof of separate head, bare body, and raised-arm mask for walk/run; rigid pixels only."""
from pathlib import Path
from collections import deque
from PIL import Image, ImageDraw, ImageFont, ImageOps
import json

root=Path('packages/asset-pipeline/sources/layered-character/starter-redesign-20261103/bare-bases-v1')
drawn=['south','south-east','east','north-east','north']
all_dirs=['south','south-east','east','north-east','north','north-west','west','south-west']
mirror={'north-west':'north-east','west':'east','south-west':'south-east'}
font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',9)

def eye_center(image):
    found=[]
    for y in range(8,33):
        for x in range(20,60):
            r,g,b,a=image.getpixel((x,y))
            if a>=128 and g>=80 and b>=100 and b>r+20 and g>r+10:found.append((x,y))
    if len(found)<2:return None
    return round(sum(x for x,y in found)/len(found)),round(sum(y for x,y in found)/len(found))

def scalp_top(image):
    for y in range(0,38):
        xs=[x for x in range(16,64) if image.getpixel((x,y))[3]>=128]
        if xs:return (round((min(xs)+max(xs))/2),y)
    raise ValueError('No scalp top')

def head_component(image,neck_y,expected_x):
    candidates=[]
    for y in range(0,neck_y):
        xs=[x for x in range(max(0,expected_x-13),min(80,expected_x+14)) if image.getpixel((x,y))[3]>=128]
        if xs:
            candidates=[(x,y) for x in xs]
            break
    if not candidates:return set()
    start=min(candidates,key=lambda p:abs(p[0]-expected_x))
    visited={start};q=deque([start])
    while q:
        x,y=q.popleft()
        for xx,yy in ((x-1,y),(x+1,y),(x,y-1),(x,y+1),(x-1,y-1),(x+1,y-1),(x-1,y+1),(x+1,y+1)):
            if 0<=xx<80 and 0<=yy<neck_y and (xx,yy) not in visited and image.getpixel((xx,yy))[3]>=128:
                visited.add((xx,yy));q.append((xx,yy))
    return visited

for sex,hid in [('male','m-human1'),('female','f-human1')]:
    src=root/f'motion-{sex}'
    head_src=root/f'head-body-rotation-{hid}'
    if not (src/'metadata.json').exists():continue
    anim=json.loads((src/'metadata.json').read_text(encoding='utf-8'))['states'][0]['frames']['animations']
    output=root/f'head-body-motion-{hid}'
    output.mkdir(exist_ok=True)
    result={'canvas':[80,80],'head':hid,'sex':sex,'frameGeometry':'integer translation only','directions':{},'issues':[]}
    for action in ['walk','run']:
        board=Image.new('RGBA',(8*80,8*80),'#202831')
        for col,d in enumerate(all_dirs):
            origin=mirror.get(d,d)
            flip=d in mirror
            base_idle=Image.open(root/f'rotation-{sex}'/'Idle/rotations'/f'{origin}.png').convert('RGBA')
            head=Image.open(head_src/f'{origin}-head.png').convert('RGBA')
            head_meta=Image.open(head_src/f'{origin}-body.png').convert('RGBA')
            # The neck row is the first nonempty body row in the idle body layer.
            neck_idle=next(y for y in range(15,42) if any(head_meta.getpixel((x,y))[3] for x in range(16,64)))
            anchor_idle=eye_center(base_idle) or scalp_top(base_idle)
            entries=[]
            for index,rel in enumerate(anim[action][origin]):
                source=Image.open(src/rel).convert('RGBA')
                anchor=eye_center(source) if eye_center(base_idle) else None
                if anchor is None:anchor=scalp_top(source)
                dx,dy=anchor[0]-anchor_idle[0],anchor[1]-anchor_idle[1]
                neck_frame=neck_idle+dy
                body=source.copy()
                front=Image.new('RGBA',(80,80))
                head_pixels=head_component(source,neck_frame,anchor[0])
                for y in range(max(0,neck_frame)):
                    for x in range(80):
                        if source.getpixel((x,y))[3] and (x,y) not in head_pixels:
                            front.putpixel((x,y),source.getpixel((x,y)))
                        body.putpixel((x,y),(0,0,0,0))
                # Use one frame translation shared by every head of this sex. Complete the short neck
                # with the head's own skin; never leave or paint pixels from the old bald head underneath.
                def candidate(extra):
                    layer=Image.new('RGBA',(80,80))
                    layer.paste(head,(dx,dy+extra))
                    image=Image.alpha_composite(Image.alpha_composite(body,layer),front)
                    empty=[y for y in range(max(0,neck_frame-2),min(80,neck_frame+3))
                           if not any(image.getpixel((x,y))[3] for x in range(max(0,anchor[0]-3),min(80,anchor[0]+4)))]
                    return layer,image,empty
                extra=0
                head_layer,joined,gap=candidate(extra)
                for proposal in range(1,7):
                    if not gap:break
                    layer,image,empty=candidate(proposal)
                    if len(empty)<len(gap):extra,head_layer,joined,gap=proposal,layer,image,empty
                if flip:
                    body,head_layer,front,joined=map(ImageOps.mirror,(body,head_layer,front,joined))
                folder=output/action/d
                folder.mkdir(parents=True,exist_ok=True)
                name=f'{index:02d}'
                for suffix,im in [('body',body),('head',head_layer),('body-front',front),('joined',joined)]:
                    im.save(folder/f'{name}-{suffix}.png')
                center=79-anchor[0] if flip else anchor[0]
                if gap:result['issues'].append({'action':action,'direction':d,'frame':index,'neckGapRows':gap})
                entries.append({'index':index,'body':f'{action}/{d}/{name}-body.png','head':f'{action}/{d}/{name}-head.png',
                                'bodyFront':f'{action}/{d}/{name}-body-front.png','joined':f'{action}/{d}/{name}-joined.png',
                                'neck':[center,neck_frame],'headTranslation':[dx,dy+extra],'gap':gap})
                if origin=='south' or index==0:
                    board.alpha_composite(joined,(col*80,index*80))
            result['directions'][f'{action}_{d}']=entries
        board.resize((1280,1280),Image.Resampling.NEAREST).save(output/f'{action}-review.png')
    (output/'manifest.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    print(hid,'clips',len(result['directions']),'frames',sum(map(len,result['directions'].values())),'neck gap issues',len(result['issues']))

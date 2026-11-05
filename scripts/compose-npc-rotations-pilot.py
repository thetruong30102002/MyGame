"""Mechanical eight-direction head/body seam proof. No resize or runtime per-head offset."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root=Path('packages/asset-pipeline/sources/layered-character/starter-redesign-20261103/bare-bases-v1')
dirs=['south','south-east','east','north-east','north','north-west','west','south-west']
font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',9)

def neck(image,lo,hi,prefer):
    options=[]
    for y in range(lo,hi+1):
        xs=[x for x in range(15,65) if image.getpixel((x,y))[3]>=128]
        options.append((len(xs),abs(y-prefer),y,xs))
    zeros=[row for row in options if row[0]==0]
    _,_,y,xs=min(zeros,key=lambda row:row[2]) if zeros else min(options,key=lambda row:row[:2])
    if not xs:
        for yy in sorted(range(max(0,y-4),min(80,y+5)),key=lambda v:(abs(v-y),v)):
            xs=[x for x in range(15,65) if image.getpixel((x,yy))[3]>=128]
            if xs:break
    return (round((min(xs)+max(xs))/2),y)

for sex,hid in [('male','m-human1'),('female','f-human1')]:
    head_folder=root/f'head-rotation-{hid}'/'Idle/rotations'
    if not head_folder.exists():continue
    base_folder=root/f'rotation-{sex}'/'Idle/rotations'
    out=root/f'head-body-rotation-{hid}'
    out.mkdir(exist_ok=True)
    board=Image.new('RGBA',(80*8,98*2),'#202831')
    draw=ImageDraw.Draw(board)
    for i,d in enumerate(dirs):
        bare=Image.open(base_folder/f'{d}.png').convert('RGBA')
        source=Image.open(head_folder/f'{d}.png').convert('RGBA')
        lo,hi,preferred=(23,32,26) if sex=='male' else (26,35,30)
        bx,by=neck(bare,lo,hi,preferred)
        hx,hy=neck(source,lo,hi+3,preferred)
        dx,dy=bx-hx,by-hy
        head=Image.new('RGBA',(80,80))
        body=bare.copy()
        for y in range(80):
            for x in range(80):
                if y<by:body.putpixel((x,y),(0,0,0,0))
                if y<=hy and source.getpixel((x,y))[3]:
                    xx,yy=x+dx,y+dy
                    if 0<=xx<80 and 0<=yy<80:head.putpixel((xx,yy),source.getpixel((x,y)))
        joined=Image.alpha_composite(body,head)
        head.save(out/f'{d}-head.png')
        body.save(out/f'{d}-body.png')
        joined.save(out/f'{d}-joined.png')
        for row,im in enumerate((bare,joined)):
            board.alpha_composite(im,(i*80,row*98))
            draw.text((i*80+40,row*98+86),f'{d} {"base" if row==0 else "joined"}',font=font,anchor='mm',fill='white')
        empty=[y for y in range(by-2,by+3) if not any(joined.getpixel((x,y))[3] for x in range(bx-3,bx+4))]
        print(hid,d,'base neck',bx,by,'head neck',hx,hy,'shift',dx,dy,'gap',empty)
    board.resize((1280,392),Image.Resampling.NEAREST).save(out/'review-8-directions.png')

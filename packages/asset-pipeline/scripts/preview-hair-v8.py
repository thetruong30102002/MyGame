"""Inspect authored hair registration at fixed native skull scale."""
from pathlib import Path
import importlib.util,sys,json
from PIL import Image,ImageDraw
P=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('assembly',P/'assemble-modular-v7.py')
A=importlib.util.module_from_spec(spec);spec.loader.exec_module(A)
DEST=A.ROOT/'.aether-stage/mannequin/modular-v8-review';DEST.mkdir(exist_ok=True)
raw=Image.open(A.OLD/'hair-three-styles-raw.png').convert('RGBA')
canvas=Image.new('RGBA',(8*56,4*64),(26,32,40,255));label=ImageDraw.Draw(canvas)
comparison=Image.new('RGBA',(44+8*40,18+6*44),(26,32,40,255));labels=ImageDraw.Draw(comparison)
for row in range(6):labels.text((2,18+row*44+15),'OLD' if row%2==0 else 'NEW',fill=(210,215,225))
for col,d in enumerate(A.DIRS):
    labels.text((44+col*40+10,2),d,fill=(210,215,225))
    record=A.load_meta('male','idle')[(0,d)]
    base=Image.open(A.ART/f'male_idle_0_{d}.png').convert('RGBA')
    anchor,head,body=A.head_info(base,record,'idle',0,d)
    canvas.alpha_composite(head.crop((44,36,100,100)),(col*56,0));label.text((col*56+2,2),d)
    for row in range(3):
        tile=A.prep.clean(raw.crop((round(col*raw.width/8),round(row*raw.height/3),round((col+1)*raw.width/8),round((row+1)*raw.height/3))))
        from modular_v8_hair import hair_layers
        front,back,meta=hair_layers(tile,head,d,record['neckY'])
        im=back.copy();im.alpha_composite(head);im.alpha_composite(front)
        canvas.alpha_composite(im.crop((44,36,100,100)),(col*56,(row+1)*64))
        from modular_v7_binding import hair_layers as old_hair
        oldfront,oldback,_=old_hair(tile,head,d,record['neckY'])
        oldim=oldback.copy();oldim.alpha_composite(head);oldim.alpha_composite(oldfront)
        comparison.alpha_composite(oldim.crop((52,38,92,82)),(44+col*40,18+row*88))
        comparison.alpha_composite(im.crop((52,38,92,82)),(44+col*40,18+row*88+44))
        if d=='S':print(row,meta)
canvas.resize((canvas.width*4,canvas.height*4),Image.Resampling.NEAREST).save(DEST/'hair-registration.png')
print(DEST/'hair-registration.png')
comparison.resize((comparison.width*3,comparison.height*3),Image.Resampling.NEAREST).save(DEST/'hair-before-after.png')
if '--idle-only' in sys.argv:sys.exit(0)
for d in ['S','SW','W','NW','N']:
    canvas=Image.new('RGBA',(20*40,3*64),(26,32,40,255))
    for row,style in enumerate(['chestnut_short','silver_swept','brown_ponytail']):
        column=0
        for action,count in A.COUNTS.items():
            source=raw if action=='idle' else Image.open(A.RAW/'hair'/f'hair-{style}-{action}-raw.png').convert('RGBA')
            for phase in range(count):
                if action=='idle':
                    col=A.DIRS.index(d)
                    tile=raw.crop((round(col*raw.width/8),round(row*raw.height/3),round((col+1)*raw.width/8),round((row+1)*raw.height/3)))
                else:
                    r=A.prep.ROWS.index(d)
                    tile=source.crop((round(phase*source.width/count),round(r*source.height/5),round((phase+1)*source.width/count),round((r+1)*source.height/5)))
                    tile.paste((0,0,0,0),(0,0,round(tile.width*.12),round(tile.height*.12)))
                    tile.paste((0,0,0,0),(round(tile.width*.88),round(tile.height*.88),tile.width,tile.height))
                    for y in range(tile.height):
                        for x in range(tile.width):
                            r,g,b,a=tile.getpixel((x,y))
                            if (g>180 and r<75 and b<75) or (r>180 and b>160 and g<90):tile.putpixel((x,y),(0,0,0,0))
                tile=A.prep.clean(tile)
                record=A.load_meta('male',action)[(phase,d)]
                base=Image.open(A.ART/f'male_{action}_{phase}_{d}.png').convert('RGBA')
                _,head,_=A.head_info(base,record,action,phase,d)
                front,back,_=hair_layers(tile,head,d,record.get('neckY',record['headAnchor'][1]+18))
                im=back.copy();im.alpha_composite(head);im.alpha_composite(front)
                canvas.alpha_composite(im.crop((52,32,92,96)),(column*40,row*64));column+=1
    canvas.resize((canvas.width*2,canvas.height*2),Image.Resampling.NEAREST).save(DEST/f'hair-actions-{d}.png')

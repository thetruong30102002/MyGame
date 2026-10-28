"""Pack approved whole-character poses as a drawing guide; no part compositing."""
from pathlib import Path
from PIL import Image
B=Path(__file__).resolve().parent;old=B.parent/'wholecast-v17';out=B/'motion-guides';out.mkdir(exist_ok=True)
for character in ['swordsman','mage']:
    for action,n in [('walk',8),('run',8),('attack' if character=='swordsman' else 'cast',12)]:
        guide=Image.new('RGBA',(144*n,144*5))
        for row,d in enumerate(['S','SE','E','NE','N']):
            for phase in range(n):
                frame=Image.open(old/'traces'/f'{character}-{action}-{d}'/f'frame-{phase:02}.png')
                guide.paste(frame,(phase*144,row*144))
        guide.resize((guide.width*2,guide.height*2),Image.Resampling.NEAREST).save(out/f'{character}-{action}-five-directions.png')
print(out)

"""Mechanical, lossless review of complete actors. No body-part painting."""
from pathlib import Path
import json
from PIL import Image,ImageDraw

b=Path(__file__).resolve().parent
dirs=['S','SE','E','NE','N']
for char in ['swordsman','mage']:
    card=Image.new('RGBA',(144*4,164*5),(29,31,34,255));d=ImageDraw.Draw(card)
    for row,direction in enumerate(dirs):
        ref=Image.open(b/'action-references'/f'{char}-{direction}-master.png').resize((112,112),Image.Resampling.NEAREST)
        master=Image.new('RGBA',(144,144));master.alpha_composite(ref,(16,28))
        images=[master]+[Image.open(b/'traces'/f'{char}-run-{direction}'/f'frame-{i:02}.png') for i in [0,3,4]]
        for col,im in enumerate(images):
            card.alpha_composite(im,(col*144,row*164));d.text((col*144+4,row*164+145),f'{direction} '+('IDLE' if col==0 else ['0','3','4'][col-1]),fill='white')
        d.line((0,row*164+128,575,row*164+128),fill=(90,120,90))
    card.resize((1152,1640),Image.Resampling.NEAREST).convert('RGB').save(b/f'{char}-run-comparison-2x.png')
for path in (b/'traces').glob('*/review-3x.png'):
    im=Image.open(path);im.resize((im.width//3*2,im.height//3*2),Image.Resampling.NEAREST).save(path.with_name('review-2x.png'))

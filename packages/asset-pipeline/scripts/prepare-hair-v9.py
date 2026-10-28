"""Use the actual in-game clothed body as an integrated hair painting template."""
from pathlib import Path
from PIL import Image,ImageDraw
import json
ROOT=Path(__file__).resolve().parents[3];OUT=ROOT/'assets/mannequin/v2';RAW=OUT/'source-art/v9';RAW.mkdir(exist_ok=True)
P=Path(__file__).with_name('review-modular-v7.py')
scope={'__file__':str(P)}
exec(compile(P.read_text(encoding='utf8').split('for i,identity')[0],str(P),'exec'),scope)
C=scope['C'];draw=scope['draw'];sheet=Image.new('RGBA',(144*4,144*2))
for i,d in enumerate(C['directions']):
    seq=next(s for s in C['identities'][0]['sequences'] if s['action']=='idle' and s['direction']==d)
    tile=draw(C['identities'][0],seq,0,0,7,3,False).crop((16,24,160,168))
    marks=ImageDraw.Draw(tile);marks.rectangle((4,4,7,7),fill=(0,255,0,255));marks.rectangle((136,136,139,139),fill=(255,0,255,255))
    sheet.alpha_composite(tile,(i%4*144,i//4*144))
sheet.resize((2304,1152),Image.Resampling.NEAREST).save(RAW/'integrated-character-template.png')
print(RAW/'integrated-character-template.png')

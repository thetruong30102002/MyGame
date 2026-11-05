"""Chỉ xếp ảnh gốc và phóng nearest để xem tại chat; không vẽ/sửa pixel nhân vật."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json

p=Path('packages/asset-pipeline/sources/layered-character/starter-redesign-20261103/roster-standing-v1')
m=json.loads((p/'manifest.json').read_text(encoding='utf-8'))
font=ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',11)
board=Image.new('RGBA',(480,224),(30,38,46,255));draw=ImageDraw.Draw(board)
qa=[]
for i,e in enumerate(m['entries']):
 im=Image.open(p/e['file']).convert('RGBA');assert im.size==(80,80)
 row=0 if e['sex']=='male' else 1;col=i//2;x,y=col*96,row*112
 board.alpha_composite(im,(x+8,y+8));sex='Nam' if row==0 else 'Nữ'
 label=e['label']+' · '+sex
 draw.text((x+48,y+92),label,font=font,anchor='mm',fill='#ece3ce')
 b=im.getbbox();expected=73 if row==0 else 71
 qa.append({'id':e['id'],'bounds':b,'height':b[3]-b[1] if b else 0,'referenceHeight':expected,'heightDelta':b[3]-b[1]-expected if b else None,'artApproved':False})
board.save(p/'ten-outfits-native.png');board.resize((1440,672),Image.Resampling.NEAREST).save(p/'ten-outfits-3x.png')
for row,sex in enumerate(['male','female']):
 im=board.crop((0,row*112,480,(row+1)*112));im.resize((1440,336),Image.Resampling.NEAREST).save(p/(sex+'-five-outfits-3x.png'))
(p/'visual-review.json').write_text(json.dumps({'entries':qa,'artApproved':False,'scope':'Standing designs only; mechanical sheet assembly, no pixel alteration or per-character fitting.'},indent=2),encoding='utf-8')
print(json.dumps(qa))

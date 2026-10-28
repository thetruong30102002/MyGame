"""Bảng kiểm hình nội bộ từ frame cuối; không dựng trang demo."""
from pathlib import Path
from PIL import Image,ImageDraw
import json
B=Path(__file__).resolve().parent;R=json.loads((B/'roster.json').read_text(encoding='utf8'));out=B/'movement-review';out.mkdir(exist_ok=True)
for c in R['characters']:
    if c.get('reference'):continue
    for action in ['walk','run']:
        dirs=['S','SE','E','NE','N'];card=Image.new('RGBA',(1296,164*5),(25,30,30,255));dr=ImageDraw.Draw(card)
        for row,d in enumerate(dirs):
            folder=B/'movement-traces'/f"{c['id']}-{action}-{d}"
            ref=Image.new('RGBA',(144,144));ref.alpha_composite(Image.open(B/'native'/c['id']/f'idle-{d}.png'),(16,28));card.alpha_composite(ref,(0,row*164));dr.text((3,row*164+147),'IDLE '+d,fill='white')
            for i in range(8):
                path=folder/f'frame-{i:02}.png'
                if path.exists():card.alpha_composite(Image.open(path),((i+1)*144,row*164))
                dr.text(((i+1)*144+3,row*164+147),str(i+1),fill='white')
        card.convert('RGB').save(out/f"{c['id']}-{action}.png")
print('Movement inspection cards written')

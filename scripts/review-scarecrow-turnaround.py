"""Ảnh kiểm cùng một scale / root cho bốn hướng, không ghi đè PNG nguồn."""
from pathlib import Path
import json
import sys
from PIL import Image, ImageDraw, ImageFont
sys.stdout.reconfigure(encoding='utf-8')
root=Path(__file__).resolve().parents[1]
source=root/'packages/asset-pipeline/sources/gpt-review/2026-11-11/turnaround-v5'
out=root/'.havenlord-stage/monster-style-2026-11-11';out.mkdir(parents=True,exist_ok=True)
meta=json.loads((source/'metadata.json').read_text(encoding='utf-8'))
font=lambda n:ImageFont.truetype('C:/Windows/Fonts/arial.ttf',n)
board=Image.new('RGB',(1200,570),(27,30,35));d=ImageDraw.Draw(board)
d.text((22,16),'BÙ NHÌN MA V5 — ĐỨNG BỐN HƯỚNG',font=font(26),fill='white')
d.text((22,54),'Một tỷ lệ thu chung 1/24; cùng canvas 64×72 và mốc chân. Hướng trái lật nguyên pixel từ hướng phải.',font=font(17),fill=(190,198,207))
report=[]
for index,(direction,label) in enumerate([('S','Trước'),('E','Phải'),('N','Sau'),('W','Trái — lật từ phải')]):
    info=meta['directions'][direction];original=Image.open(source/info['file']).convert('RGBA')
    anchor=info['sourceAnchor'];tile=Image.new('RGBA',(64,72))
    for y in range(72):
        for x in range(64):
            sx=round(anchor[0]+(x-32+.5)*24);sy=round(anchor[1]+(y-66+.5)*24)
            if 0<=sx<original.width and 0<=sy<original.height:tile.putpixel((x,y),original.getpixel((sx,sy)))
    x0=index*300
    d.rounded_rectangle((x0+9,97,x0+291,451),radius=7,fill=(45,49,55),outline=(88,95,103))
    d.text((x0+23,110),label,font=font(20),fill=(255,210,130))
    bg=Image.new('RGBA',(64,72),(74,79,84,255));bg.alpha_composite(tile)
    board.paste(bg.resize((256,288),Image.Resampling.NEAREST).convert('RGB'),(x0+22,150))
    board.paste(tile,(x0+118,540-72),tile)
    d.text((x0+114,544),'Cỡ 1×',font=font(14),fill=(200,207,216))
    b=original.getchannel('A').point(lambda a:255 if a>=128 else 0).getbbox()
    report.append({'direction':direction,'sourceCanvas':original.size,'bounds':b,'bodyHeight':b[3]-b[1]})
board.save(out/'bu-nhin-ma-v5-bon-huong-review.png')
(out/'turnaround-geometry.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'image':str(out/'bu-nhin-ma-v5-bon-huong-review.png'),'geometry':report},ensure_ascii=False))

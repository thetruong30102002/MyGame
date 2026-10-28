"""Đo asset gốc và tạo bảng so tỷ lệ kỹ thuật, không vẽ/sửa tranh nhà game."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json,hashlib
ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'packages/asset-pipeline/reports/world-style/thistlewood'
OUT.mkdir(parents=True,exist_ok=True)
read=lambda p:json.loads(p.read_text(encoding='utf-8-sig'))
props=read(ROOT/'assets/maps/human/props.json')
sheet=Image.open(ROOT/'assets/maps/human/props.png').convert('RGBA')
manifest=read(ROOT/'assets/manifest.json')['characters']
player=manifest['player_hero_adult']
atlasPath=ROOT/'assets'/player['atlas']
atlas=read(atlasPath)
key=next(k for k in atlas['frames'] if k.endswith('/idle_S_0'))
frame=atlas['frames'][key]['frame']
heroSheet=Image.open(atlasPath.with_suffix('.png')).convert('RGBA')
hero=heroSheet.crop((frame['x'],frame['y'],frame['x']+frame['w'],frame['y']+frame['h']))
hero=hero.crop(hero.getbbox())
hero.save(OUT/'player-reference.png')
items=[]
for id in ['house','house_inn','house_store','house_forge','church','house_stone','house_farm']:
    f=props['frames']['human/'+id]['frame']
    image=sheet.crop((f['x'],f['y'],f['x']+f['w'],f['y']+f['h']))
    items.append((id,image))
    image.save(OUT/(id+'-reference.png'))
baseline={'reference':{'id':'player_hero_adult','bodyHeight':75,'spriteBounds':list(hero.size),'ppu':48},
 'houses':[{'id':id,'width':im.width,'height':im.height,'heightInCharacters':round(im.height/75,2),'sha256':hashlib.sha256(im.tobytes()).hexdigest()} for id,im in items],
 'proposed':{'id':'town_inn_grand_v1','width':336,'height':440,'door':{'width':56,'height':104},'artExists':False},
 'note':'Bảng đo native; ô thông số chỉ là kích thước dự kiến, chưa phải hình nhà mới.'}
(OUT/'baseline.json').write_text(json.dumps(baseline,ensure_ascii=False,indent=2),encoding='utf-8')
canvas=Image.new('RGB',(1440,720),'#16211d')
d=ImageDraw.Draw(canvas)
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',18)
title=ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf',25)
d.text((28,20),'THISTLEWOOD · THƯỚC PIXEL GỐC',font=title,fill='#e6ce97')
d.text((28,60),'Thước danh nghĩa 75 px (idle 71–72 px) · PPU 48 · ảnh cũ đúng 1×, không phóng lớn',font=font,fill='#bbcabd')
baselineY=565
for index,(id,im) in enumerate(items[:4]):
    x=38+index*235
    canvas.paste(im,(x,baselineY-im.height),im)
    canvas.paste(hero,(x+im.width+8,baselineY-hero.height),hero)
    d.text((x,585),id,font=font,fill='#e6ce97')
    d.text((x,614),f'{im.width}×{im.height} px',font=font,fill='#b8c9bb')
# Hộp đo không có hình nhà để không nhầm bản phác hình học là art đã hoàn thiện.
x=1055
d.rectangle((x,baselineY-440,x+336,baselineY),outline='#ddbf79',width=2)
d.rectangle((x+140,baselineY-124,x+196,baselineY-20),outline='#7cc1a0',width=2)
d.text((x+20,baselineY-410),'THÔNG SỐ NHÀ MỚI',font=font,fill='#e6ce97')
d.text((x+20,baselineY-378),'336×440 px',font=font,fill='#e6ce97')
d.text((x+20,baselineY-345),'Chưa có bản vẽ',font=font,fill='#b8c9bb')
d.text((x,585),'Cửa 56×104 px',font=font,fill='#b8c9bb')
d.text((28,674),'Giữ bảy nhà cũ làm công trình phụ. Không dùng hộp thông số này làm asset game.',font=font,fill='#bbcabd')
canvas.save(OUT/'native-scale-reference.png')
print(json.dumps(baseline,ensure_ascii=False))

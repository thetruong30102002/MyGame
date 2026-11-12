"""Bảng đối chiếu từ pixel nguồn: chỉ dùng cho kiểm tra, không ghi lại asset game."""
import base64
import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
sys.stdout.reconfigure(encoding='utf-8')

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / '.havenlord-stage' / 'monster-style-2026-11-11'
OUT.mkdir(parents=True, exist_ok=True)
FONT = Path('C:/Windows/Fonts/arial.ttf')
font = lambda n: ImageFont.truetype(str(FONT), n)
names = [
    ('mob_zombie_001', 'Xác sống'),
    ('mob_skeleton_archer_001', 'Cung thủ xương'),
    ('mob_field_hyena_001', 'Linh cẩu đồng'),
    ('mob_mushroom_001', 'Nấm rừng'),
    ('mob_gargoyle_001', 'Gargoyle đá'),
]

def bounds(image):
    return image.getchannel('A').point(lambda a: 255 if a >= 128 else 0).getbbox()

def stats(image):
    pixels = list(image.get_flattened_data())
    visible = [p for p in pixels if p[3] >= 128]
    nonzero = [p for p in pixels if p[3] > 0]
    return dict(width=image.width, height=image.height, visible_pixels=len(visible),
                rgb_colors=len(set(p[:3] for p in visible)),
                quantized_colors_16=len(set(tuple(c // 16 for c in p[:3]) for p in visible)),
                semi_alpha_percent=round(sum(0 < p[3] < 255 for p in nonzero) / max(1,len(nonzero)) * 100,2))

samples=[]
for ident,label in names:
    folder=ROOT/'assets'/'characters'/ident
    data=json.loads((folder/(ident+'.json')).read_text(encoding='utf-8'))
    key=data['animations']['idle_S'][0]
    frame=data['frames'][key]['frame']
    atlas=Image.open(folder/data['meta']['image']).convert('RGBA')
    image=atlas.crop((frame['x'],frame['y'],frame['x']+frame['w'],frame['y']+frame['h']))
    image=image.crop(bounds(image))
    samples.append((ident,label,image,'PixelLab đang dùng — kích thước gốc'))

candidate=ROOT/'packages/asset-pipeline/sources/gpt-review/2026-11-11/bu-nhin-ma-standing-4-directions-v1.png'
sheet=Image.open(candidate).convert('RGBA')
first=sheet.crop((0,0,sheet.width//4,sheet.height))
first=first.crop(bounds(first))
native=first.resize((round(first.width*55/first.height),55),Image.Resampling.NEAREST)
samples.append(('gpt_scarecrow_v1','Bù nhìn ma — GPT v1',native,'Thu thử về cao 55px, chưa xử lý màu / alpha'))

board=Image.new('RGB',(1200,990),(27,30,35));draw=ImageDraw.Draw(board)
draw.text((25,17),'SO NÉT QUÁI Ở CÙNG MẬT ĐỘ PIXEL GAME',font=font(27),fill='white')
draw.text((25,56),'Quái cũ giữ cỡ gốc; mẫu GPT thu thử về 55px như Cung thủ xương. Tất cả phóng 4× bằng nearest.',font=font(17),fill=(192,199,207))
report=[]
for index,(ident,label,img,note) in enumerate(samples):
    x=(index%3)*400;y=96+(index//3)*360
    draw.rounded_rectangle((x+12,y,x+388,y+347),radius=7,fill=(42,46,52),outline=(215,158,76) if ident.startswith('gpt') else (75,82,89),width=2)
    draw.text((x+25,y+13),label,font=font(22),fill=(255,208,121) if ident.startswith('gpt') else 'white')
    draw.text((x+25,y+44),f'{img.width}×{img.height}px sau cắt mép rỗng',font=font(15),fill=(178,186,193))
    tile=Image.new('RGBA',(90,66),(71,76,80,255))
    for a in range(0,90,8):
        for b in range(0,66,8):
            if (a//8+b//8)%2:ImageDraw.Draw(tile).rectangle((a,b,a+7,b+7),fill=(78,83,87,255))
    tile.alpha_composite(img,((90-img.width)//2,62-img.height))
    board.paste(tile.resize((360,264),Image.Resampling.NEAREST).convert('RGB'),(x+20,y+72))
    record={'id':ident,'label':label,'note':note,**stats(img)};report.append(record)
    img.save(OUT/(ident+'-sample.png'))

draw.text((25,838),'Cỡ 1× (pixel gốc của các mẫu phía trên):',font=font(19),fill='white')
for index,(ident,label,img,note) in enumerate(samples):
    x=30+index*195
    board.paste(img,(x+(100-img.width)//2,925-img.height),img)
    draw.text((x,940),label[:22],font=font(14),fill=(208,214,220))
board.save(OUT/'doi-chieu-4x-va-1x.png')
(OUT/'so-lieu.json').write_text(json.dumps({'candidate_original':stats(first),'samples':report},ensure_ascii=False,indent=2),encoding='utf-8')
v2path=candidate.parent/'bu-nhin-ma-standing-front-v2.png'
if v2path.exists():
    v2=Image.open(v2path).convert('RGBA');v2=v2.crop(bounds(v2))
    v2=v2.resize((round(v2.width*55/v2.height),55),Image.Resampling.NEAREST)
    focus=[samples[1],samples[2],samples[5],('gpt_scarecrow_v2','Bù nhìn ma — GPT v2',v2,'Vẽ lại mảng gọn; thu thử về cao 55px')]
    sheet=Image.new('RGB',(1200,500),(27,30,35));d=ImageDraw.Draw(sheet)
    d.text((22,14),'SO LẠI MẪU VẼ LẠI VỚI QUÁI ĐANG CHƠI',font=font(25),fill='white')
    d.text((22,52),'Cùng mật độ pixel game; phóng 3× bằng nearest. V1 và V2 đều thu thử về cùng cao 55px.',font=font(17),fill=(192,199,207))
    data=[]
    for i,(ident,label,img,note) in enumerate(focus):
        x=i*300
        d.rounded_rectangle((x+8,90,x+292,375),radius=7,fill=(42,46,52),outline=(215,158,76) if ident.startswith('gpt') else (75,82,89),width=2)
        d.text((x+18,103),label,font=font(19),fill='white')
        record=stats(img);data.append({'id':ident,**record})
        d.text((x+18,133),f'{img.width}×{img.height}px · {record["rgb_colors"]} màu RGB',font=font(15),fill=(185,193,200))
        tile=Image.new('RGBA',(90,66),(74,79,84,255));tile.alpha_composite(img,((90-img.width)//2,62-img.height))
        sheet.paste(tile.resize((270,198),Image.Resampling.NEAREST).convert('RGB'),(x+15,165))
        sheet.paste(img,(x+130-img.width//2,450-img.height),img)
        d.text((x+100,464),'Cỡ 1×',font=font(14),fill=(200,208,216))
    sheet.save(OUT/'doi-chieu-truoc-sau-3x.png')
    (OUT/'so-lieu-truoc-sau.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'comparison':str(OUT/'doi-chieu-truoc-sau-3x.png'),'samples':data},ensure_ascii=False))
for version in ['v3','v5']:
    newerpath=candidate.parent/f'bu-nhin-ma-standing-front-{version}.png'
    if not (newerpath.exists() and v2path.exists()):continue
    newer=Image.open(newerpath).convert('RGBA');newer=newer.crop(bounds(newer))
    newer=newer.resize((round(newer.width*55/newer.height),55),Image.Resampling.NEAREST)
    focus=[samples[1],samples[2],('gpt_scarecrow_v2','Bù nhìn ma — GPT v2',v2,''),(f'gpt_scarecrow_{version}',f'Bù nhìn ma — GPT {version}',newer,'')]
    sheet=Image.new('RGB',(1200,500),(27,30,35));d=ImageDraw.Draw(sheet)
    d.text((22,14),f'SO NÉT V2 / {version.upper()} VỚI QUÁI TRONG GAME',font=font(25),fill='white')
    d.text((22,52),'Quái cũ giữ pixel gốc; hai mẫu GPT cùng cao 55px. Phóng 3× nearest, không chỉnh màu / alpha.',font=font(17),fill=(192,199,207))
    data=[]
    for i,(ident,label,img,note) in enumerate(focus):
        x=i*300;record=stats(img);data.append({'id':ident,**record})
        d.rounded_rectangle((x+8,90,x+292,375),radius=7,fill=(42,46,52),outline=(215,158,76) if ident.startswith('gpt') else (75,82,89),width=2)
        d.text((x+18,103),label,font=font(19),fill='white')
        d.text((x+18,133),f'{img.width}×{img.height}px · {record["rgb_colors"]} màu RGB',font=font(15),fill=(185,193,200))
        tile=Image.new('RGBA',(90,66),(74,79,84,255));tile.alpha_composite(img,((90-img.width)//2,62-img.height))
        sheet.paste(tile.resize((270,198),Image.Resampling.NEAREST).convert('RGB'),(x+15,165))
        sheet.paste(img,(x+130-img.width//2,450-img.height),img)
        d.text((x+100,464),'Cỡ 1×',font=font(14),fill=(200,208,216))
    sheet.save(OUT/f'doi-chieu-v2-{version}-3x.png')
    (OUT/f'so-lieu-v2-{version}.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'comparison':str(OUT/f'doi-chieu-v2-{version}-3x.png'),'samples':data},ensure_ascii=False))
print(json.dumps({'output':str(OUT/'doi-chieu-4x-va-1x.png'),'candidate_original':stats(first),'samples':report},ensure_ascii=False))

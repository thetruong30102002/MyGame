"""Whole-frame packing and lossless playback files for visual inspection."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json
B=Path(__file__).resolve().parent;ROOT=B.parents[3];DEST=ROOT/'assets/player-roster/v18/combat';OUT=B/'review'/'combat-cards';OUT.mkdir(exist_ok=True)
roster=json.loads((B/'roster.json').read_text(encoding='utf8'));font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',12)
dirs=['S','SE','E','NE','N','NW','W','SW']
for c in roster['characters']:
    path=DEST/f"{c['id']}.png"
    if not path.exists():continue
    atlas=Image.open(path).convert('RGBA');card=Image.new('RGBA',(144*13,164*5),(25,30,30,255));dr=ImageDraw.Draw(card)
    for row,d in enumerate(dirs[:5]):
        master=Image.new('RGBA',(144,144));master.alpha_composite(Image.open(B/'native'/c['id']/f'idle-{d}.png'),(16,28));card.alpha_composite(master,(0,row*164));dr.text((3,row*164+145),'IDLE '+d,font=font,fill='white')
        for i in range(12):
            frame=atlas.crop((i*144,row*144,(i+1)*144,(row+1)*144));card.alpha_composite(frame,((i+1)*144,row*164));dr.text(((i+1)*144+3,row*164+145),str(i+1),font=font,fill='white')
    card.convert('RGB').save(OUT/f"{c['id']}-native.png")
    playback=[]
    for i in range(12):
        scene=Image.new('RGBA',(576,320),(25,30,30,255));draw=ImageDraw.Draw(scene)
        for d in range(8):scene.alpha_composite(atlas.crop((i*144,d*144,(i+1)*144,(d+1)*144)),(d%4*144,d//4*160));draw.text((d%4*144+3,d//4*160+144),dirs[d],font=font,fill='white')
        playback.append(scene)
    playback[0].save(OUT/f"{c['id']}-8directions.webp",save_all=True,append_images=playback[1:],duration=63,loop=0,lossless=True,method=4)
print('Native review cards:',len(list(OUT.glob('*-native.png'))))

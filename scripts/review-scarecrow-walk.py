"""Cắt và ghép ảnh duyệt bước đi; không vẽ lại hoặc sửa pixel nguồn."""
from pathlib import Path
import argparse
import json
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description='Ghép ảnh duyệt quái từ PNG nguồn.')
parser.add_argument('--clip', choices=['walk', 'attack'], default='walk')
CLIP = parser.parse_args().clip
SOURCE = ROOT / 'packages/asset-pipeline/sources/gpt-review/2026-11-11' / ('motion-v5' if CLIP == 'walk' else 'attack-v5')
OUT = ROOT / '.havenlord-stage/monster-style-2026-11-11'
OUT.mkdir(parents=True, exist_ok=True)
FONT = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 20)
FILES = {'S': 'walk-S-v2.png', 'E': 'walk-E.png', 'N': 'walk-N.png'}
ANCHORS = {'S': (181, 509), 'E': (181, 490), 'N': (181, 497)}
if CLIP == 'attack':
    FILES = {d: f'attack-{d}.png' for d in ['S', 'E', 'N']}
    ANCHORS = {'S': (181, 490), 'E': (181, 502), 'N': (181, 501)}
frames, report = {}, {}

for direction, filename in FILES.items():
    sheet = Image.open(SOURCE / filename).convert('RGBA')
    assert sheet.size == (1448, 1086), sheet.size
    frames[direction] = []
    report[direction] = []
    for i in range(8):
        x, y = i % 4 * 362, i // 4 * 543
        tile = sheet.crop((x, y, x + 362, y + 543))
        bounds = tile.getchannel('A').point(lambda a: 255 if a >= 128 else 0).getbbox()
        head = tile.crop((0, 70, 362, 200)).getchannel('A').point(lambda a: 255 if a >= 128 else 0).getbbox()
        report[direction].append({'frame': i + 1, 'bounds': bounds, 'headCenterX': (head[0] + head[2]) / 2, 'headBandWidth': head[2] - head[0]})
        frames[direction].append(tile)

# Lật từng ô: không đảo thứ tự thời gian như khi lật cả atlas.
frames['W'] = [ImageOps.mirror(tile) for tile in frames['E']]
west = Image.new('RGBA', (1448, 1086))
for i, tile in enumerate(frames['W']):
    west.paste(tile, (i % 4 * 362, i // 4 * 543))
west.save(SOURCE / f'{CLIP}-W.png')
assert all(ImageOps.mirror(frames['W'][i]).tobytes() == frames['E'][i].tobytes() for i in range(8))
ANCHORS['W'] = (361 - ANCHORS['E'][0], ANCHORS['E'][1])

def review_tile(direction, index):
    original = frames[direction][index]
    anchor = ANCHORS[direction]
    tile = Image.new('RGBA', (64, 72))
    # Một scale 1/9 cho toàn bộ bộ đi; một neo mỗi hướng, không fit từng frame.
    for y in range(72):
        for x in range(64):
            sx = round(anchor[0] + (x - 32 + .5) * 9)
            sy = round(anchor[1] + (y - 66 + .5) * 9)
            if 0 <= sx < 362 and 0 <= sy < 543:
                tile.putpixel((x, y), original.getpixel((sx, sy)))
    return tile

board = Image.new('RGB', (1640, 1010), (28, 31, 36))
draw = ImageDraw.Draw(board)
title = 'BƯỚC ĐI' if CLIP == 'walk' else 'TẤN CÔNG'
draw.text((18, 12), f'BÙ NHÌN MA — 8 FRAME {title} / HƯỚNG', font=FONT, fill='white')
labels = [('S', 'Trước'), ('E', 'Phải'), ('N', 'Sau'), ('W', 'Trái (lật E)')]
for row, (direction, label) in enumerate(labels):
    draw.text((14, 48 + row * 236), label, font=FONT, fill=(255, 208, 128))
    for i in range(8):
        tile = review_tile(direction, i)
        bg = Image.new('RGBA', (64, 72), (62, 67, 73, 255))
        bg.alpha_composite(tile)
        board.paste(bg.resize((192, 216), Image.Resampling.NEAREST).convert('RGB'), (8 + i * 204, 74 + row * 236))
board.save(OUT / f'bu-nhin-ma-{CLIP}-8-frame-review.png')

animation = []
for i in range(8):
    canvas = Image.new('RGB', (1024, 326), (40, 44, 50))
    d = ImageDraw.Draw(canvas)
    for col, (direction, label) in enumerate(labels):
        d.text((col * 256 + 18, 8), label, font=FONT, fill=(255, 208, 128))
        tile = review_tile(direction, i).resize((256, 288), Image.Resampling.NEAREST)
        canvas.paste(tile, (col * 256, 36), tile)
    animation.append(canvas)
duration = 140 if CLIP == 'walk' else [240, 150, 180, 70, 80, 90, 130, 280]
animation[0].save(OUT / f'bu-nhin-ma-{CLIP}-preview.gif', save_all=True, append_images=animation[1:], duration=duration, loop=0, disposal=2)
(OUT / f'{CLIP}-geometry.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'frames': 32, 'westExactMirror': True, 'geometry': report}))

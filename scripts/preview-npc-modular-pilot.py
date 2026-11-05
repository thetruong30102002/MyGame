"""Mechanical matte proof for the two short-haired front drafts only. Never export as a game atlas."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path('packages/asset-pipeline/sources/layered-character/starter-redesign-20261103')
out = root / 'bare-bases-v1'
font = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 9)
board = Image.new('RGBA', (80 * 4, 98 * 2), '#202831')
labels = ['ảnh đầu gốc', 'đầu đã tách', 'thân bỏ đầu', 'ghép thử']

for row, (sex, head_id) in enumerate((('male', 'm-human1'), ('female', 'f-human1'))):
    source = Image.open(root / 'npc-heads30-v1' / head_id / 'S.png').convert('RGBA')
    raw_body = Image.open(out / sex / 'S.png').convert('RGBA')
    head = Image.new('RGBA', source.size)
    body = raw_body.copy()
    for y in range(80):
        for x in range(80):
            # The short-haired pilot is cut at the original NPC chin/neck, with a narrowing seam.
            if sex == 'male':
                head_edge = 23 if y <= 21 else 26 if y == 22 else 28 if y == 23 else 30
                head_right = 51 if y <= 21 else 48 if y == 22 else 46 if y == 23 else 44
                head_keep = y <= 21 or (y <= 25 and head_edge <= x <= head_right)
                # Keep the source body's two neck rows below the chin.
                body_clear = y <= 25
            else:
                head_edge = 22 if y <= 22 else 25 if y == 23 else 27 if y == 24 else 29
                head_right = 53 if y <= 22 else 50 if y == 23 else 48 if y == 24 else 46
                head_keep = y <= 22 or (y <= 27 and head_edge <= x <= head_right)
                body_clear = y <= 27
            if head_keep:
                head.putpixel((x, y), source.getpixel((x, y)))
            if body_clear:
                body.putpixel((x, y), (0, 0, 0, 0))
    composed = Image.alpha_composite(body, head)
    head.save(out / f'{head_id}-front-head-pilot.png')
    body.save(out / f'{sex}-front-body-pilot.png')
    composed.save(out / f'{head_id}-bare-composite-pilot.png')
    for col, im in enumerate((source, head, body, composed)):
        board.alpha_composite(im, (col * 80, row * 98))
        ImageDraw.Draw(board).text((col * 80 + 40, row * 98 + 86), labels[col], font=font, anchor='mm', fill='#ede7da')

board.resize((board.width * 4, board.height * 4), Image.Resampling.NEAREST).save(out / 'modular-front-pilot.png')

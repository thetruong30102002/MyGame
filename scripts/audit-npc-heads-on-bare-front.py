"""Read-only visual fit audit for available fronts; hair-back still requires per-style art."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json
from collections import Counter

root = Path('packages/asset-pipeline/sources/layered-character/starter-redesign-20261103')
heads = root / 'npc-heads30-v1'
bases = root / 'bare-bases-v1'
entries = json.loads((heads / 'manifest.json').read_text(encoding='utf-8-sig'))['entries']
font = ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf', 10)
male_skin = [(252, 203, 169), (236, 164, 127), (225, 149, 115), (188, 120, 91), (153, 90, 68)]
female_skin = [(254, 217, 185), (243, 189, 157), (229, 162, 133), (211, 141, 114), (166, 105, 80)]
demon_palettes = {
    'm-demon1': [(161,135,168), (132,110,143), (112,91,124), (88,69,102)],
    'm-demon2': [(179,156,187), (149,123,158), (125,97,132)],
    'm-demon3': [(155,138,172), (104,91,119)],
    'f-demon1': [(204,175,195), (181,147,167), (149,117,137), (132,101,119), (112,79,93)],
    'f-demon2': [(189,162,186), (158,130,161), (136,109,140), (116,87,124), (85,69,98)],
    'f-demon3': [(174,142,179), (153,122,160), (128,99,136), (104,79,113), (80,61,90)],
}

def eye_row(image, race):
    rows=Counter()
    for y in range(18,29):
        for x in range(27,51):
            r,g,b,a=image.getpixel((x,y))
            blue=g>=80 and b>=100 and b>r+20 and g>r+10
            amber=r>=170 and g>=65 and b<=95 and r>g+45
            if a and (amber if race=='demon' else blue):rows[y]+=1
    candidates={y:n for y,n in rows.items() if n>=2}
    return max(candidates,key=candidates.get) if candidates else None

for sex, prefix in [('male', 'm-'), ('female', 'f-')]:
    base = Image.open(bases / sex / 'S.png').convert('RGBA')
    body = base.copy()
    for y in range(80):
        for x in range(80):
            remove = y <= (25 if sex == 'male' else 27)
            if remove:
                body.putpixel((x, y), (0, 0, 0, 0))
    body.save(bases / f'{sex}-headless-S-audit.png')
    chosen = [e for e in entries if e['id'].startswith(prefix) and (heads / e['image']).exists()]
    board = Image.new('RGBA', (5 * 86, 3 * 100), '#202831')
    draw = ImageDraw.Draw(board)
    seam_failures=[]
    derived=bases/'front-normalized-audit'
    derived.mkdir(exist_ok=True)
    for i, entry in enumerate(chosen):
        source = Image.open(heads / entry['image']).convert('RGBA')
        found=eye_row(source,entry['race'])
        if found is not None:
            shift=(21 if sex=='male' else 23)-found
            aligned=Image.new('RGBA',(80,80))
            aligned.paste(source,(0,shift))
            source=aligned
        head = Image.new('RGBA', (80, 80))
        for y in range(80):
            for x in range(80):
                if sex == 'male':
                    lo = 23 if y <= 21 else 26 if y == 22 else 28 if y == 23 else 30
                    hi = 51 if y <= 21 else 48 if y == 22 else 46 if y == 23 else 44
                    keep = y <= 21 or y <= 25 and lo <= x <= hi
                else:
                    lo = 22 if y <= 22 else 25 if y == 23 else 27 if y == 24 else 29
                    hi = 53 if y <= 22 else 50 if y == 23 else 48 if y == 24 else 46
                    keep = y <= 22 or y <= 27 and lo <= x <= hi
                if keep:
                    head.putpixel((x, y), source.getpixel((x, y)))
        # The user's current contract has one skin palette shared with the body. Preserve horns, hair and eyes.
        if entry['id'] in demon_palettes:
            shades = female_skin if sex == 'female' else male_skin
            old = demon_palettes[entry['id']]
            replacement = {rgb: shades[round(j * (len(shades)-1) / max(1, len(old)-1))] for j, rgb in enumerate(old)}
            for y in range(80):
                for x in range(80):
                    r, g, b, a = head.getpixel((x, y))
                    if a and (r, g, b) in replacement:
                        head.putpixel((x, y), (*replacement[(r, g, b)], a))
        composite = Image.alpha_composite(body, head)
        head.save(derived/f"{entry['id']}-head.png")
        composite.save(derived/f"{entry['id']}-bare-composite.png")
        neck_rows=range(23,29) if sex=='male' else range(25,32)
        empty=[y for y in neck_rows if not any(composite.getpixel((x,y))[3] for x in range(33,44))]
        if empty:seam_failures.append((entry['id'],empty))
        col, row = i % 5, i // 5
        board.alpha_composite(composite, (col * 86 + 3, row * 100 + 2))
        draw.text((col * 86 + 43, row * 100 + 88), entry['id'], font=font, anchor='mm', fill='#ede7da')
    board.resize((board.width * 3, board.height * 3), Image.Resampling.NEAREST).save(bases / f'{sex}-head-fit-front-audit.png')
    print(sex, len(chosen), 'front trials; neck gaps:', seam_failures, '; preview only')

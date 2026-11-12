"""Chuẩn hoá ảnh GPT vẽ (giả pixel, nhiều màu, rìa alpha mờ) về sprite pixel native của game.

Các bước: tách nền magenta / alpha thấp → cắt sát → giảm màu (mặc định 32) trên ảnh gốc → thu về lưới đích bằng MÀU
CHIẾM NHIỀU NHẤT trong mỗi khối (không nội suy, không làm mờ) → alpha nhị phân (khối ≥ 50 % đặc mới giữ).
Lưới đích lấy theo `--height` (cao trong game, px — NÊN dùng, đề bài GPT ghi sẵn) hoặc `--block` (cỡ một ô pixel của GPT);
không có thì tự đoán cỡ ô từ độ dài các dải cùng màu (đoán hay hụt: thử 11/11 cối xay tay GPT ra 3 px, thực ~7,4 px).

Kèm tấm so sánh: sprite mới cạnh đồ vật thật trong atlas game (`--ref vùng/tên`), cỡ 1× và 3×, nền sáng và tối.

    python -I scripts/gpt-normalize.py <ảnh GPT.png> <ra.png> [--height 210] [--block 4] [--colors 32] [--ref human/house_farm ...]
"""
import argparse
import json
from collections import Counter

import numpy as np
from PIL import Image


def chroma_magenta(rgb):
    r, g, b = (rgb[..., i].astype(int) for i in range(3))
    return (r - g > 90) & (b - g > 90) & (abs(r - b) < 80)


def guess_block(idx, solid):
    """Cỡ ô pixel GPT: độ dài dải cùng màu hay gặp nhất (bỏ dải 1–2 px là nhiễu rìa)."""
    runs = Counter()
    for row in np.where(solid, idx.astype(int), -1):
        start = 0
        for x in range(1, len(row) + 1):
            if x == len(row) or row[x] != row[start]:
                if row[start] >= 0 and x - start >= 3:
                    runs[x - start] += 1
                start = x
    if not runs:
        return 4
    # Dải dài là bội của ô; lấy ước chung hay gặp: thử 3..16, điểm = số dải chia hết (gần đúng ±1).
    best, score = 4, -1
    for b in range(3, 17):
        s = sum(n for length, n in runs.items() if min(length % b, b - length % b) <= 1 and length >= b) / b ** 0.3
        if s > score:
            best, score = b, s
    return best


def normalize(path, height=None, block=None, colors=32):
    im = Image.open(path).convert('RGBA')
    a = np.array(im)
    solid = (a[..., 3] >= 128) & ~chroma_magenta(a[..., :3])
    ys, xs = np.where(solid)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    a, solid = a[y0:y1, x0:x1], solid[y0:y1, x0:x1]
    rgb = Image.fromarray(np.where(solid[..., None], a[..., :3], 0).astype(np.uint8))
    q = rgb.quantize(colors=colors + 1, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    idx = np.array(q)
    pal = np.array(q.getpalette()[: (colors + 1) * 3]).reshape(-1, 3)
    if height:
        step = (y1 - y0) / height
    else:
        step = block or guess_block(idx, solid)
    H, W = max(1, round((y1 - y0) / step)), max(1, round((x1 - x0) / step))
    out = np.zeros((H, W, 4), np.uint8)
    for j in range(H):
        for i in range(W):
            ys_, xs_ = slice(int(j * step), max(int(j * step) + 1, int((j + 1) * step))), slice(int(i * step), max(int(i * step) + 1, int((i + 1) * step)))
            s = solid[ys_, xs_]
            if s.mean() < 0.5:
                continue
            c = Counter(idx[ys_, xs_][s].tolist()).most_common(1)[0][0]
            out[j, i, :3], out[j, i, 3] = pal[c], 255
    return Image.fromarray(out), step


def ref_sprite(ref):
    region, name = ref.split('/')
    meta = json.load(open(f'assets/maps/{region}/props.json', encoding='utf8'))['frames'][f'{region}/{name}']['frame']
    sheet = Image.open(f'assets/maps/{region}/props.png').convert('RGBA')
    return sheet.crop((meta['x'], meta['y'], meta['x'] + meta['w'], meta['y'] + meta['h']))


def compare(sprite, refs, path):
    items = [sprite] + [ref_sprite(r) for r in refs]
    gap = 12
    w = sum(i.width for i in items) + gap * (len(items) + 1)
    h = max(i.height for i in items) + gap * 2
    panels = []
    for bg in ((222, 214, 190, 255), (40, 44, 52, 255)):
        p = Image.new('RGBA', (w, h), bg)
        x = gap
        for it in items:
            p.alpha_composite(it, (x, h - gap - it.height))
            x += it.width + gap
        panels.append(p)
    one = Image.new('RGBA', (w, h * 2))
    one.paste(panels[0], (0, 0))
    one.paste(panels[1], (0, h))
    one.resize((w * 3, h * 6), Image.NEAREST).save(path)


def main():
    import sys
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument('src')
    ap.add_argument('out')
    ap.add_argument('--height', type=int)
    ap.add_argument('--block', type=float)
    ap.add_argument('--colors', type=int, default=32)
    ap.add_argument('--ref', nargs='*', default=[])
    o = ap.parse_args()
    sprite, step = normalize(o.src, o.height, o.block, o.colors)
    sprite.save(o.out)
    n = len({tuple(p) for p in np.array(sprite).reshape(-1, 4).tolist() if p[3]})
    print(f'{o.out}: {sprite.width}×{sprite.height}, ô GPT ≈ {step:.2f} px, {n} màu')
    compare(sprite, o.ref, o.out.replace('.png', '.so-sanh.png'))


if __name__ == '__main__':
    main()

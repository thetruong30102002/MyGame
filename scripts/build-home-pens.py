"""Dựng lớp rào bãi quây Gia viên từ hình GPT đã chuẩn hoá (đợt 6 / 7 / 10) — cùng cách ghép bản thử đã duyệt 12/11
("Vật nuôi đang ổn rồi làm tiếp theo"): hàng sau lặp đoạn rào cắt đúng bề ngang, hai cạnh bên xếp đoạn rào dọc + cổng cạnh bên + cột thật
cắt từ rào ngang mỗi 40 px, hàng trước có cổng ở giữa, cột góc che chỗ nối. Mỗi bãi xuất các LỚP riêng để game xếp chiều sâu:
`back` (hàng sau + 2 cột góc sau), `side_l` / `side_r` (cạnh bên), `front` (hàng trước + 2 cột góc trước) + `pen.json` (vị trí từng lớp
trong khung bãi, vùng trong). Con vật PixelLab xuất ảnh đứng đã phóng theo tỉ lệ chốt 12/11 (bò ×2, cừu ×1,5, gà ×0,6).

Chạy (ở gốc repo): python -I scripts/build-home-pens.py  → packages/asset-pipeline/sources/home-pens/
"""
import json
import os
import sys

import numpy as np
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'packages', 'asset-pipeline', 'sources')
GR = os.path.join(SRC, 'gpt-review')
OUT = os.path.join(SRC, 'home-pens')


def g(d, n):
    return Image.open(os.path.join(GR, f'dot-{d}', 'chuan-hoa', f'{n}.png')).convert('RGBA')


SCALE = {'farm_cow_001': 2.0, 'farm_sheep_001': 1.5, 'farm_chicken_001': 0.6}


def animal(name, d, flip=False):
    im = Image.open(os.path.join(SRC, 'pixellab', name, 'Idle', 'animations', 'idle', d, 'frame_000.png')).convert('RGBA')
    im = im.crop(im.getbbox())
    k = SCALE.get(name, 1)
    im = im.resize((round(im.width * k), round(im.height * k)), Image.NEAREST)
    return im.transpose(Image.FLIP_LEFT_RIGHT) if flip else im


def posts(im):
    """Tâm cột hai đầu của đoạn rào ngang (đo ở hàng đỉnh cột); cột đầu bị cắt nửa thì tâm nằm ngay mép."""
    a = np.array(im)[..., 3] > 0
    r = a[4]
    runs, st = [], None
    for x in range(len(r) + 1):
        v = x < len(r) and r[x]
        if v and st is None:
            st = x
        if not v and st is not None:
            runs.append((st, x - 1))
            st = None
    mid = max(b - a_ + 1 for a_, b in runs[1:-1]) if len(runs) > 2 else max(b - a_ + 1 for a_, b in runs)
    (l0, l1), (r0, r1) = runs[0], runs[-1]
    lc = 0 if (l1 - l0 + 1) < 0.7 * mid and l0 == 0 else (l0 + l1) / 2
    rc = im.width - 1 if (r1 - r0 + 1) < 0.7 * mid and r1 == im.width - 1 else (r0 + r1) / 2
    return lc, rc, runs[len(runs) // 2] if len(runs) > 2 else runs[0]


def chain(pieces):
    """Nối các đoạn: tâm cột trái đoạn sau trùng tâm cột phải đoạn trước."""
    xs, cur = [], None
    for p in pieces:
        lc, rc, _ = posts(p)
        x = 0 if cur is None else cur - lc
        xs.append(x)
        cur = x + rc
    return xs, xs[0] + posts(pieces[0])[0], cur


def pen(name, front, front_gate, side, side_gate, corner, n_seg, n_side, gate_side='right'):
    fp = [front] * (n_seg // 2) + [front_gate] + [front] * (n_seg - n_seg // 2) if front_gate is not None else [front] * n_seg
    fx, c0, c1 = chain(fp)
    bp = [front] * (n_seg + 2)
    bx, _, _ = chain(bp)
    run = [side] * (n_side // 2) + [side_gate] + [side] * (n_side - n_side // 2)
    depth = sum(p.height for p in run) - side.height // 8
    pad = 40
    top = pad + max(p.height for p in fp)
    W = int(c1 - c0) + 2 * pad
    H = top + depth + pad
    X0 = pad - c0
    yb, yf = top, top + depth
    _, _, (m0, m1) = posts(front)
    post = front.crop((m0, 0, m1 + 1, front.height))
    post = post.crop(post.getbbox())
    layers = {}

    def canvas():
        return Image.new('RGBA', (W, H))

    back = canvas()
    for p, x in zip(bp, bx):
        back.alpha_composite(p, (int(X0 + x), yb - p.height))
    m = np.zeros((H, W), np.uint8)
    m[:, int(X0 + c0):int(X0 + c1) + 1] = 255
    a = np.array(back)
    a[..., 3] = np.minimum(a[..., 3], m)
    back = Image.fromarray(a)
    front_l = canvas()
    for p, x in zip(fp, fx):
        front_l.alpha_composite(p, (int(X0 + x), yf - p.height))
    for cx, cy, lay in ((c0, yb, back), (c1, yb, back), (c0, yf, front_l), (c1, yf, front_l)):
        if corner is not None:
            lay.alpha_composite(corner, (int(X0 + cx - corner.width / 2), cy - corner.height + 2))
    layers['back'], layers['front'] = back, front_l
    for key, xc, gate_here in (('side_l', X0 + c0, gate_side == 'left'), ('side_r', X0 + c1, gate_side == 'right')):
        col = canvas()
        y = yb - side.height // 8
        for p in (run if gate_here else [side] * len(run)):
            if y >= yf:
                break
            p = p.crop((0, 0, p.width, min(p.height, yf - y)))
            col.alpha_composite(p, (int(xc - p.width / 2), y))
            y += p.height
        yy = yb + 34
        while yy < yf - 20:
            col.alpha_composite(post, (int(xc - post.width / 2), yy - post.height))
            yy += 40
        layers[key] = col
    os.makedirs(os.path.join(OUT, name), exist_ok=True)
    info = {'width': W, 'height': H, 'backY': yb, 'frontY': yf, 'innerX0': int(X0 + c0), 'innerX1': int(X0 + c1), 'layers': {}}
    side_half = max(max(p.width for p in run), post.width) / 2
    info['inner'] = {'x0': round(X0 + c0 + side_half + 8), 'x1': round(X0 + c1 - side_half - 8), 'y0': yb + 8,
                     'y1': yf - max(p.height for p in fp) - 8}
    for key, lay in layers.items():
        box = lay.getbbox()
        lay.crop(box).save(os.path.join(OUT, name, f'{key}.png'))
        info['layers'][key] = {'x': box[0], 'y': box[1], 'w': box[2] - box[0], 'h': box[3] - box[1]}
    json.dump(info, open(os.path.join(OUT, name, 'pen.json'), 'w', encoding='utf-8'), indent=1)
    print(name, W, H, 'trong', info['inner'])


pen('bo_cuu', g(7, 'rao_go_ngang'), g(7, 'cong_rao_doi'), g(10, 'rao_go_doc'), g(10, 'cong_rao_go_doc'), g(7, 'rao_go_cot'), 2, 2)
pen('san_ga', g(7, 'rao_luoi_ga'), g(7, 'cong_rao_luoi'), g(10, 'rao_luoi_doc'), g(10, 'cong_luoi_doc'), g(10, 'cot_luoi_goc'), 3, 2)
os.makedirs(os.path.join(OUT, 'animals'), exist_ok=True)
for name, d, flip, key in (('farm_cow_001', 'east', False, 'bo_e'), ('farm_cow_001', 'south', False, 'bo_s'),
                           ('farm_sheep_001', 'south', False, 'cuu_s'), ('farm_sheep_001', 'east', True, 'cuu_w'),
                           ('farm_chicken_001', 'south', False, 'ga_s'), ('farm_chicken_001', 'east', False, 'ga_e'),
                           ('farm_chicken_001', 'east', True, 'ga_w')):
    animal(name, d, flip).save(os.path.join(OUT, 'animals', f'{key}.png'))
print('xong →', OUT)

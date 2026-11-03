"""Đo trên ẢNH ĐÃ GHÉP (chuẩn điểm đặt đầu 30/10: chính diện — tâm 4 hàng hàm, đáy đầu giữa mặt) (trang soi mau-1-l): mỗi đầu × hướng — cổ lộ ra (hàng từ đáy cằm tới mép cổ áo) và lệch ngang
(tâm mặt / mép trước mặt / tâm đầu so với đầu nam 1 gốc). Chuẩn = đầu nam 1 (đã duyệt). In bảng, đánh dấu lệch > 1px."""
import json
import sys
from collections import deque
from PIL import Image

base = 'apps/server/site/media/layered/mau-1-l/'
d = json.load(open(base + 'data.json', encoding='utf-8'))


def skin(p):
    r, g, b, a = p
    return a and r >= 140 and g >= 80 and b >= 55 and 40 <= r - g <= 80 and 15 <= g - b <= 55


def layers(f):
    n = f['neck']
    head = Image.open(base + f['head']).convert('RGBA')
    body = Image.open(base + f['body']).convert('RGBA')
    return n, head, body


def face_component(head, n):
    """Mảng da mặt lớn nhất của lớp đầu (toạ độ ô)."""
    ox, oy = n[0] - 24, n[1] - 40
    pts = {(x, y) for y in range(48) for x in range(48) if skin(head.getpixel((x, y)))}
    best = set()
    seen = set()
    for p in pts:
        if p in seen:
            continue
        comp = set()
        q = deque([p])
        seen.add(p)
        while q:
            x, y = q.popleft()
            comp.add((x, y))
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if (nx, ny) in pts and (nx, ny) not in seen:
                    seen.add((nx, ny))
                    q.append((nx, ny))
        if len(comp) > len(best):
            best = comp
    return {(x + ox, y + oy) for x, y in best}


def measure(f, dirn):
    n, head, body = layers(f)
    ox, oy = n[0] - 24, n[1] - 40
    if dirn in ('N', 'NE'):
        # sau lưng: đáy đầu (pixel lớp đầu thấp nhất quanh tâm) và tâm ngang của lớp đầu
        opaque = [(x + ox, y + oy) for y in range(48) for x in range(48) if head.getpixel((x, y))[3]]
        xs = [p[0] for p in opaque]
        cx = (min(xs) + max(xs)) / 2
        bottom = max(p[1] for p in opaque if abs(p[0] - cx) <= 6)
        ref_x = cx
    else:
        face = face_component(head, n)
        if not face:
            return None
        xs = [p[0] for p in face]
        if dirn == 'S':
            # chính diện: đường hàm (hàng thấp nhất mặt còn rộng ≥ 6px), tâm = trung bình tâm 4 hàng hàm cuối
            rows = {}
            for x, y in face:
                rows.setdefault(y, []).append(x)
            jaw = sorted(((y, v) for y, v in rows.items() if max(v) - min(v) + 1 >= 6), reverse=True)
            ref_x = sum((min(v) + max(v)) / 2 for _, v in jaw[:4]) / len(jaw[:4])
            # dọc: đáy đầu ngay giữa mặt (pixel thấp nhất lớp đầu trong ±1px quanh tâm, tính cả viền cằm) — cổ lộ ra như mắt thấy
            cxi = int(round(ref_x))
            bottom = max(y + oy for y in range(48) for x in range(48) if head.getpixel((x, y))[3] and abs(x + ox - cxi) <= 1)
        else:
            bottom = max(p[1] for p in face if abs(p[0] - max(xs)) <= 8)
            ref_x = max(xs)
    # mép cổ áo: từ dưới đáy cằm đi xuống ở cột tâm, gặp pixel thân KHÔNG phải da
    col = int(round(ref_x if dirn in ('S', 'N') else ref_x - 4))
    collar = None
    for y in range(bottom + 1, bottom + 20):
        p = body.getpixel((col, y))
        if p[3] and not skin(p):
            collar = y
            break
    return {'neck': (collar - bottom - 1) if collar else None, 'x': ref_x, 'bottom': bottom}


heads = None
report = {}
for dirn in ['S', 'SE', 'E', 'NE', 'N']:
    c = next(c for c in d['clips'] if c['id'] == f'all-{dirn}')
    rows = []
    for f in c['frames']:
        label = f['issues'][0]
        rows.append((label, measure(f, dirn)))
    std = rows[0][1]
    report[dirn] = []
    for label, m in rows:
        if not m:
            report[dirn].append((label, None, None, '?'))
            continue
        dn = (m['neck'] - std['neck']) if m['neck'] is not None and std['neck'] is not None else None
        dx = m['x'] - std['x']
        flag = '!!' if (dn is not None and abs(dn) > 1) or abs(dx) > 1 else ''
        report[dirn].append((label, dn, dx, flag))
names = [l for l, *_ in report['S']]
print(f"{'đầu':38s}" + ''.join(f'{dd:>16s}' for dd in report))
for i, name in enumerate(names):
    line = f'{name[:38]:38s}'
    for dd, rows in report.items():
        _, dn, dx, flag = rows[i]
        line += f"{(f'cổ{dn:+d} ngang{dx:+.0f}' if dn is not None else f'cổ? ngang{dx:+.0f}' if dx is not None else '?'):>14s}{flag:>2s}"
    print(line)
json.dump(report, open(sys.argv[1], 'w', encoding='utf-8'), ensure_ascii=False)

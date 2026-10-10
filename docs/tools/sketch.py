"""Phác thảo map cho trang Thế giới Aether (SVG, sinh tất định theo tên map — chạy lại ra đúng hình cũ).

Không phải hình trong game: chỉ là bản phác bố cục để chủ dự án duyệt trước khi dựng map thật bằng pipeline
(`npm run assets:map -- <vùng>`). Mỗi map: nền theo địa hình vùng, mảng cây / đá / cồn, đường đi, bầy quái (vòng đỏ), hang ổ boss khu,
sân boss chúa, nhà + NPC ở trạm, lối sang map bên cạnh (mũi tên ở mép).
"""
import hashlib
import html
import math

W, H = 320, 220

# Bảng màu theo vùng: nền, mảng địa hình, nước / dung nham, đường, chữ.
PALETTE = {
    1: ('#9cc77a', '#5f8f45', '#5aa0d0', '#c8a46a', '#1d2a14'),
    2: ('#7f9c78', '#4f6e52', '#4c8a88', '#9c8a5c', '#132019'),
    3: ('#e8c886', '#c99a52', '#6fb0c8', '#b0763c', '#3a2410'),
    4: ('#bcd690', '#8aa864', '#9ac8e8', '#c8b07a', '#1f2a12'),
    5: ('#e6eef2', '#b4c8d4', '#8cc0e0', '#a8b4bc', '#1c2a34'),
    6: ('#5e4744', '#3a2a28', '#e2662c', '#8a6a5c', '#fbe3d0'),
    7: ('#f0e2b4', '#a8c878', '#5aaad6', '#d8bc84', '#2a2414'),
    8: ('#4c3d5e', '#33284a', '#7fd0c8', '#7a6a8c', '#efe4ff'),
    9: ('#a49e92', '#7c766c', '#8aa8c8', '#c4bcae', '#1e1c18'),
    10: ('#2c2240', '#1c1530', '#a070e0', '#5a4a7a', '#efe0ff'),
}


def rng(seed_text):
    """Bộ sinh số giả ngẫu nhiên tất định theo chuỗi (cùng tên map → cùng hình)."""
    h = int(hashlib.sha1(seed_text.encode('utf8')).hexdigest(), 16)
    state = [h & 0xFFFFFFFF]

    def nxt():
        state[0] = (1103515245 * state[0] + 12345) & 0x7FFFFFFF
        return state[0] / 0x7FFFFFFF

    return nxt


def esc(s):
    return html.escape(str(s), quote=True)


def text(x, y, s, color, size=10, anchor='middle', weight=700):
    return (f'<text x="{x:.0f}" y="{y:.0f}" font-size="{size}" font-weight="{weight}" fill="{color}" text-anchor="{anchor}" '
            f'font-family="Nunito, system-ui, sans-serif" paint-order="stroke" stroke="rgba(255,255,255,.55)" stroke-width="2.5">{esc(s)}</text>')


def text_dark_bg(x, y, s, color, size=10, anchor='middle', weight=700):
    return (f'<text x="{x:.0f}" y="{y:.0f}" font-size="{size}" font-weight="{weight}" fill="{color}" text-anchor="{anchor}" '
            f'font-family="Nunito, system-ui, sans-serif" paint-order="stroke" stroke="rgba(0,0,0,.6)" stroke-width="2.5">{esc(s)}</text>')


def edge_point(side, t):
    """Điểm trên mép map (`side` N/S/E/W, `t` 0–1 dọc mép)."""
    if side == 'N':
        return 30 + t * (W - 60), 10
    if side == 'S':
        return 30 + t * (W - 60), H - 10
    if side == 'W':
        return 10, 30 + t * (H - 60)
    return W - 10, 30 + t * (H - 60)


def arrow(side, x, y, label, lab):
    d = {'N': (0, -1), 'S': (0, 1), 'E': (1, 0), 'W': (-1, 0)}[side]
    tip = (x + d[0] * 6, y + d[1] * 6)
    back = (x - d[0] * 8, y - d[1] * 8)
    px, py = -d[1] * 6, d[0] * 6
    pts = f'{tip[0]:.0f},{tip[1]:.0f} {back[0] + px:.0f},{back[1] + py:.0f} {back[0] - px:.0f},{back[1] - py:.0f}'
    lx = x - d[0] * 22
    ly = y + 20 if side in ('E', 'W') else y - d[1] * 18  # chữ dưới mũi tên ngang, khỏi đè đường
    anchor = 'end' if side == 'E' else 'start' if side == 'W' else 'middle'
    return f'<polygon points="{pts}" fill="#f5c542" stroke="#3a2413" stroke-width="1.5"/>' + lab(lx, ly, f'→ {label}', '#3a2413' if lab is text else '#ffe9a8', 11, anchor)


def map_sketch(region_no, name, role, mobs, exits):
    """SVG một map. `exits`: [(cạnh 'N'|'S'|'E'|'W', tên map / vùng bên kia)]."""
    bg, blob, water, road, ink = PALETTE[region_no]
    dark = region_no in (6, 8, 10)
    lab = text_dark_bg if dark else text
    r = rng(f'{region_no}:{name}')
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" role="img" aria-label="Phác thảo {esc(name)}">',
           f'<rect x="0" y="0" width="{W}" height="{H}" rx="10" fill="{bg}"/>']
    # Mảng địa hình (cây / đá / cồn) dọc mép, chừa giữa cho đường + khu săn.
    for _ in range(16):
        side = r()
        if side < 0.25:
            x, y = r() * W, r() * 40
        elif side < 0.5:
            x, y = r() * W, H - r() * 40
        elif side < 0.75:
            x, y = r() * 45, r() * H
        else:
            x, y = W - r() * 45, r() * H
        out.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="{10 + r() * 18:.0f}" fill="{blob}" opacity=".75"/>')
    # Nước / dung nham: một dải ngẫu nhiên ở hai vùng nhiều nước và ở map săn có số chẵn.
    if region_no in (2, 6, 7) or r() < 0.35:
        y0 = 40 + r() * (H - 80)
        out.append(f'<path d="M0 {y0:.0f} C {W * .3:.0f} {y0 - 30:.0f}, {W * .6:.0f} {y0 + 30:.0f}, {W} {y0 - 8:.0f}" stroke="{water}" stroke-width="12" fill="none" opacity=".7"/>')
    cx, cy = W / 2, H / 2
    # Đường từ mỗi lối vào giữa.
    pts = []
    for i, (side, _label) in enumerate(exits):
        x, y = edge_point(side, 0.5)
        pts.append((side, x, y))
        out.append(f'<path d="M{x:.0f} {y:.0f} Q {(x + cx) / 2 + (r() - .5) * 40:.0f} {(y + cy) / 2 + (r() - .5) * 40:.0f} {cx:.0f} {cy:.0f}" stroke="{road}" stroke-width="7" fill="none" stroke-linecap="round" opacity=".9"/>')
    if 'Trạm' in role:
        castle = 'toà thành' in role
        out.append(f'<circle cx="{cx:.0f}" cy="{cy:.0f}" r="34" fill="{road}" opacity=".85"/>')
        for k in range(8 if castle else 6):
            a = k / (8 if castle else 6) * math.tau + r() * .3
            bx, by = cx + math.cos(a) * 62, cy + math.sin(a) * 44
            out.append(f'<rect x="{bx - 11:.0f}" y="{by - 9:.0f}" width="22" height="16" rx="2" fill="#a0522d" stroke="#3a2413" stroke-width="1.5"/>')
            out.append(f'<rect x="{bx - 11:.0f}" y="{by - 13:.0f}" width="22" height="6" fill="#7a3a1a"/>')
        if castle:
            out.append(f'<rect x="{cx - 26:.0f}" y="{cy - 62:.0f}" width="52" height="30" fill="#8c8c96" stroke="#3a2413" stroke-width="2"/>')
            for k in range(5):
                out.append(f'<rect x="{cx - 26 + k * 12:.0f}" y="{cy - 68:.0f}" width="6" height="6" fill="#8c8c96" stroke="#3a2413" stroke-width="1"/>')
            out.append(lab(cx, cy - 72, 'Toà thành', ink, 12))
        for label, dx, dy, ty, col in (('Người bán', -48, -8, -8, '#e9c46a'), ('Cột dịch chuyển', 48, -8, -8, '#7fd0ff'), ('Nhiệm vụ', 0, 20, 16, '#ff9f8a')):
            out.append(f'<circle cx="{cx + dx:.0f}" cy="{cy + dy:.0f}" r="5" fill="{col}" stroke="#3a2413" stroke-width="1.5"/>')
            out.append(lab(cx + dx, cy + dy + ty, label, ink, 10))
    elif 'Thánh địa' in role:
        out.append(f'<circle cx="{cx:.0f}" cy="{cy:.0f}" r="52" fill="{blob}" opacity=".6"/>')
        out.append(f'<circle cx="{cx:.0f}" cy="{cy:.0f}" r="40" fill="none" stroke="#b02a1a" stroke-width="3" stroke-dasharray="6 4"/>')
        boss = mobs[0][0].split(' · ')[0] if mobs else 'Boss chúa'
        out.append(lab(cx, cy + 4, boss, '#b02a1a' if not dark else '#ffb4a3', 14, weight=800))
        out.append(lab(cx, cy + 20, 'sân boss chúa', ink, 11))
    else:
        boss = next((m.split(' · ')[0] for m, _ in mobs if 'boss' in m), None)
        spots = []
        for k in range(5):
            for _try in range(20):
                x, y = 60 + r() * (W - 120), 45 + r() * (H - 90)
                if math.hypot(x - cx, y - cy) > 30 and all(math.hypot(x - a, y - b) > 48 for a, b in spots):
                    break
            spots.append((x, y))
        if boss:
            bx, by = spots.pop()
            out.append(f'<circle cx="{bx:.0f}" cy="{by:.0f}" r="22" fill="#3a2413" opacity=".35"/>')
            out.append(f'<circle cx="{bx:.0f}" cy="{by:.0f}" r="22" fill="none" stroke="#b02a1a" stroke-width="2.5"/>')
            out.append(lab(bx, by + 34, f'Hang ổ {boss}', '#b02a1a' if not dark else '#ffb4a3', 11, weight=800))
        for x, y in spots:
            out.append(f'<circle cx="{x:.0f}" cy="{y:.0f}" r="16" fill="#d9422b" opacity=".22" stroke="#b02a1a" stroke-width="1.5" stroke-dasharray="3 3"/>')
            for j in range(3):
                a = j / 3 * math.tau + r()
                out.append(f'<circle cx="{x + math.cos(a) * 7:.0f}" cy="{y + math.sin(a) * 7:.0f}" r="2.6" fill="#b02a1a"/>')
    for side, x, y in pts:
        label = next(lb for s, lb in exits if s == side)
        out.append(arrow(side, x, y, label, lab))
    out.append('</svg>')
    return ''.join(out)


# Sơ đồ nối 7 map của vùng (khung cũ, vùng 2–10 chưa thiết kế lại): vị trí node theo chỉ số map (trạm 0 · săn 1–5 · thánh địa 6).
# Vùng 1 dùng khung 12 map (thiết kế 10/10/2026) — vị trí / cạnh riêng khai ở the-gioi-aether.py.
STD_POS = {0: (70, 120), 1: (210, 60), 2: (350, 60), 6: (500, 60), 3: (210, 180), 4: (350, 150), 5: (350, 210)}
STD_EDGES = [(0, 1), (1, 2), (2, 6), (0, 3), (3, 4), (3, 5)]


def region_graph(region_no, maps, edges, pos, prev_region, next_region, exit_node=6, height=260):
    """`exit_node`: map có lối sang vùng sau (khung cũ: thánh địa 6; vùng 1 bản 12 map: Hẻm Cửa Sông). `height`: cao khung vẽ."""
    gw, gh = 600, height
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {gw} {gh}" role="img" aria-label="Sơ đồ vùng {region_no}">']
    for a, b in edges:
        (x1, y1), (x2, y2) = pos[a], pos[b]
        out.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#c9a578" stroke-width="4" stroke-linecap="round"/>')
    # Lối xuyên vùng: trạm nối thánh địa vùng trước (trên trạm), map cửa vùng (`exit_node`) mở lối sang vùng sau (dưới nó).
    if prev_region:
        x, y = pos[0]
        out.append(f'<line x1="{x}" y1="{y - 20}" x2="{x}" y2="{y - 44}" stroke="#b07a12" stroke-width="3" stroke-dasharray="5 4"/>')
        out.append(f'<text x="{x - 62}" y="{y - 50}" font-size="11" font-weight="800" fill="#b07a12" text-anchor="start" font-family="Nunito, sans-serif">↑ từ {esc(prev_region)}</text>')
    if next_region:
        x, y = pos[exit_node]
        out.append(f'<line x1="{x}" y1="{y + 20}" x2="{x}" y2="{y + 44}" stroke="#b07a12" stroke-width="3" stroke-dasharray="5 4"/>')
        out.append(f'<text x="{x + 62}" y="{y + 60}" font-size="11" font-weight="800" fill="#b07a12" text-anchor="end" font-family="Nunito, sans-serif">↓ sang {esc(next_region)}</text>')
    for i, (name, role, mobs, _st) in enumerate(maps):
        x, y = pos[i]
        kind = 'hub' if 'Trạm' in role else 'boss' if 'Thánh địa' in role else 'hunt'
        fill = {'hub': '#e9c46a', 'boss': '#d9624b', 'hunt': '#fdf3dc'}[kind]
        lair = any('boss khu' in m for m, _ in mobs)
        out.append(f'<rect x="{x - 62}" y="{y - 20}" width="124" height="40" rx="8" fill="{fill}" stroke="#3a2413" stroke-width="2"/>')
        out.append(f'<text x="{x}" y="{y - 3}" font-size="11" font-weight="800" fill="#3a2413" text-anchor="middle" font-family="Nunito, sans-serif">{esc(name)}</text>')
        sub = 'trạm' if kind == 'hub' else 'boss chúa' if kind == 'boss' else ('săn · hang ổ boss' if lair else 'săn')
        out.append(f'<text x="{x}" y="{y + 12}" font-size="9" font-weight="700" fill="#6b4a2b" text-anchor="middle" font-family="Nunito, sans-serif">{esc(sub)}</text>')
    out.append('</svg>')
    return ''.join(out)


def exits_for(i, edges, pos, maps, prev_region, next_region, exit_node=6):
    """Lối của map `i`: cạnh theo hướng tới node bên kia trên sơ đồ; `exit_node` = map có lối sang vùng sau."""
    out = []
    used = set()
    for a, b in edges:
        if i not in (a, b):
            continue
        j = b if a == i else a
        dx = pos[j][0] - pos[i][0]
        dy = pos[j][1] - pos[i][1]
        side = ('E' if dx > 0 else 'W') if abs(dx) >= abs(dy) else ('S' if dy > 0 else 'N')
        while side in used:
            side = {'E': 'S', 'S': 'W', 'W': 'N', 'N': 'E'}[side]
        used.add(side)
        out.append((side, maps[j][0]))
    if i == 0 and prev_region:
        side = 'W' if 'W' not in used else 'N'
        used.add(side)
        out.append((side, prev_region))
    if i == exit_node and next_region:
        side = 'E' if 'E' not in used else 'N'
        out.append((side, next_region))
    return out

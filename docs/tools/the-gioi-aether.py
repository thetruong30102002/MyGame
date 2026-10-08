# Sinh docs/the-gioi-aether.html (danh sách vùng / map / quái / boss / trang bị / ngân sách PixelLab) — sửa dữ liệu ở đây rồi chạy: python docs/tools/the-gioi-aether.py
import html

OUT = r'D:\nttrg\pixel\docs\the-gioi-aether.html'

# trạng thái hình: 'co' = đã có trong game, 'moi' = vẽ mới, 'mau:<từ đâu>' = đổi màu (0 lượt), 'chieu' = có hình, cần chiêu mới
REGIONS = [
    dict(n=1, name='Thung lũng Thistlewood', lv='1–10', elem='Bóng tối', weak='Hoả, Aether', status='Đang chơi được (6/7 map)',
         town=('village', 'Thị trấn Thistlewood', 'Quê nhà của Lior: nhiệm vụ tuổi thơ và tuổi 16 bắt đầu ở đây.'),
         maps=[
             ('Thistlewood', 'Trạm', [], 'co'),
             ('Rừng Mossvale', 'Săn', [('Nấm rừng', 'co')], 'co'),
             ('Nghĩa địa Hoàng Hôn', 'Săn', [('Xác sống', 'co'), ('Vua Lich · boss khu (hầm mộ)', 'chieu')], 'co'),
             ('Đồi Xương Trắng', 'Săn', [('Cung thủ xương', 'co')], 'co'),
             ('Vách Gargoyle', 'Săn', [('Gargoyle đá', 'co')], 'co'),
             ('Hang Gargoyle', 'Săn (mới)', [('Dơi hang', 'moi'), ('Gargoyle Đá · boss khu', 'moi')], 'moi'),
             ('Đá Phong Ấn', 'Thánh địa', [('Quỷ vương rừng sâu · boss chúa', 'chieu')], 'co'),
         ]),
    dict(n=2, name='Đầm lầy Mù Sương', lv='10–20', elem='Thuỷ / độc', weak='Thổ, Phong', status='Chưa có map',
         town=('village', 'Làng nhà sàn Lau Xám', 'Dân đầm lầy sống trên nhà sàn, nhờ người lạ dẹp quái và tìm thuốc giải độc.'),
         maps=[
             ('Làng nhà sàn Lau Xám', 'Trạm', [], 'moi'),
             ('Bãi Lau Sậy', 'Săn', [('Ếch độc', 'moi')], 'moi'),
             ('Kênh Đỉa', 'Săn', [('Đỉa đầm', 'moi'), ('Mẹ Ếch · boss khu', 'moi')], 'moi'),
             ('Rừng Ngập Nấm', 'Săn', [('Nấm phát quang', 'mau:Nấm rừng')], 'moi'),
             ('Đầm Xác Chìm', 'Săn', [('Xác sống bùn', 'mau:Xác sống')], 'moi'),
             ('Vực Sương Xanh', 'Săn', [('Người cá bùn', 'moi'), ('Phù thuỷ đầm · boss khu', 'moi')], 'moi'),
             ('Hồ Hydra', 'Thánh địa', [('Hydra bùn · boss chúa', 'moi')], 'moi'),
         ]),
    dict(n=3, name='Sa mạc Hồng Cát', lv='20–30', elem='Thổ / Hoả', weak='Thuỷ, Băng', status='Chưa có map',
         town=('castle', 'Thành ốc đảo Sahrin', 'Vương quốc sa mạc: các tộc tranh nguồn nước, triều đình giao nhiệm vụ.'),
         maps=[
             ('Thành ốc đảo Sahrin', 'Trạm (toà thành)', [], 'moi'),
             ('Cồn Cát Đỏ', 'Săn', [('Bọ cạp', 'moi')], 'moi'),
             ('Hẻm Rắn', 'Săn', [('Rắn cát', 'moi'), ('Bọ cạp chúa · boss khu', 'moi')], 'moi'),
             ('Lăng Mộ Cát', 'Săn', [('Xác ướp', 'mau:Xác sống')], 'moi'),
             ('Vách Kền Kền', 'Săn', [('Kền kền', 'moi')], 'moi'),
             ('Phế tích Đá Đỏ', 'Săn', [('Cung thủ xương cát', 'mau:Cung thủ xương'), ('Pharaoh xác ướp · boss khu', 'moi')], 'moi'),
             ('Hố Cát Nuốt', 'Thánh địa', [('Sâu cát khổng lồ · boss chúa', 'moi')], 'moi'),
         ]),
    dict(n=4, name='Cao nguyên Gió Hú', lv='30–40', elem='Phong', weak='Thổ', status='Chưa có map', dragon='Phong Long',
         town=('village', 'Làng Cối Xay Gió', 'Làng trên cao nguyên, giữ đền thờ trên mây.'),
         maps=[
             ('Làng Cối Xay Gió', 'Trạm', [], 'moi'),
             ('Đồi Cỏ Cao', 'Săn', [('Sói gió', 'moi')], 'moi'),
             ('Vách Chim Ưng', 'Săn', [('Chim ưng', 'moi'), ('Đại bàng bão · boss khu', 'moi')], 'moi'),
             ('Thung Lũng Tiên', 'Săn', [('Tiên gió', 'moi')], 'moi'),
             ('Bãi Đá Bay', 'Săn', [('Đá bay', 'mau:Gargoyle đá')], 'moi'),
             ('Đường Lên Đền Mây', 'Săn', [('Yêu tinh gió', 'mau:Tiên gió'), ('Pháp sư gió · boss khu', 'moi')], 'moi'),
             ('Đền Trên Mây', 'Thánh địa', [('Rồng gió · boss chúa', 'moi')], 'moi'),
         ]),
    dict(n=5, name='Lãnh nguyên Băng Giá', lv='40–50', elem='Băng', weak='Hoả', status='Chưa có map', dragon='Băng Long',
         town=('village', 'Làng gỗ Tuyết Phong', 'Thợ săn và thợ mỏ băng sống qua mùa đông dài.'),
         maps=[
             ('Làng gỗ Tuyết Phong', 'Trạm', [], 'moi'),
             ('Rừng Thông Tuyết', 'Săn', [('Sói tuyết', 'mau:Sói gió')], 'moi'),
             ('Hồ Băng', 'Săn', [('Tinh linh băng', 'moi'), ('Nữ hoàng băng · boss khu', 'moi')], 'moi'),
             ('Đèo Người Tuyết', 'Săn', [('Người tuyết', 'moi'), ('Yeti · boss khu', 'moi')], 'moi'),
             ('Mỏ Băng', 'Săn', [('Gargoyle băng', 'mau:Gargoyle đá')], 'moi'),
             ('Hang Gấu', 'Săn', [('Gấu băng', 'moi')], 'moi'),
             ('Ngai Băng', 'Thánh địa', [('Băng long · boss chúa', 'moi')], 'moi'),
         ]),
    dict(n=6, name='Núi lửa Hoả Sơn', lv='50–60', elem='Hoả', weak='Thuỷ, Băng', status='Chưa có map', dragon='Hoả Long',
         town=('castle', 'Pháo đài người lùn Đe Đỏ', 'Hội đồng người lùn: rèn binh khí, đổi lấy nhiệm vụ trong lòng núi.'),
         maps=[
             ('Pháo đài Đe Đỏ', 'Trạm (toà thành)', [], 'moi'),
             ('Bãi Đá Đen', 'Săn', [('Thằn lằn lửa', 'moi')], 'moi'),
             ('Sông Dung Nham', 'Săn', [('Golem dung nham', 'moi'), ('Golem dung nham cổ · boss khu', 'moi')], 'moi'),
             ('Hang Dơi Lửa', 'Săn', [('Dơi lửa', 'moi')], 'moi'),
             ('Lò Rèn Bỏ Hoang', 'Săn', [('Tinh linh lửa', 'mau:Tinh linh băng')], 'moi'),
             ('Miệng Núi', 'Săn', [('Sói lửa', 'mau:Sói gió'), ('Salamander · boss khu', 'moi')], 'moi'),
             ('Lõi Núi Lửa', 'Thánh địa', [('Hoả thần · boss chúa', 'moi')], 'moi'),
         ]),
    dict(n=7, name='Quần đảo San Hô', lv='60–70', elem='Thuỷ', weak='Phong, Thổ', status='Chưa có map', dragon='Thuỷ Long',
         town=('village', 'Cảng chài San Hô', 'Làng chài và thương thuyền, tin đồn về tàu ma.'),
         maps=[
             ('Cảng chài San Hô', 'Trạm', [], 'moi'),
             ('Bãi Cát Trắng', 'Săn', [('Cua', 'moi')], 'moi'),
             ('Rạn San Hô', 'Săn', [('Sứa', 'moi'), ('Cua chúa · boss khu', 'moi')], 'moi'),
             ('Đảo Cướp Biển', 'Săn', [('Cướp biển', 'moi')], 'moi'),
             ('Đầm Người Cá', 'Săn', [('Người cá', 'mau:Người cá bùn')], 'moi'),
             ('Bãi Tàu Đắm', 'Săn', [('Rắn biển', 'mau:Rắn cát'), ('Thuyền trưởng ma · boss khu', 'moi')], 'moi'),
             ('Vực Kraken', 'Thánh địa', [('Kraken · boss chúa', 'moi')], 'moi'),
         ]),
    dict(n=8, name='Rừng Nấm Ngầm', lv='70–80', elem='Thổ', weak='Phong', status='Chưa có map', dragon='Địa Long',
         town=('village', 'Làng người nấm Ánh Tím', 'Tộc người nấm dưới lòng đất, chỉ tin người đã giúp họ.'),
         maps=[
             ('Làng người nấm Ánh Tím', 'Trạm', [], 'moi'),
             ('Rừng Nấm Khổng Lồ', 'Săn', [('Người nấm', 'mau:Nấm rừng')], 'moi'),
             ('Hang Nhện', 'Săn', [('Nhện hang', 'moi'), ('Nhện chúa · boss khu', 'moi')], 'moi'),
             ('Mạch Tinh Thể', 'Săn', [('Sâu tinh thể', 'moi')], 'moi'),
             ('Hang Dơi Tím', 'Săn', [('Dơi tím', 'mau:Dơi hang')], 'moi'),
             ('Điện Nấm', 'Săn', [('Golem đá', 'mau:Golem dung nham'), ('Vua người nấm · boss khu', 'moi')], 'moi'),
             ('Lòng Đất Sâu', 'Thánh địa', [('Rồng đất · boss chúa', 'moi')], 'moi'),
         ]),
    dict(n=9, name='Phế tích Aether', lv='80–90', elem='Aether / thép (kháng phép)', weak='Kiếm', status='Chưa có map', dragon='Quang Long',
         town=('castle', 'Toà thành Aether cổ', 'Tàn dư triều đình pháp sư xưa — các phe tranh nhau di sản Aether.'),
         maps=[
             ('Toà thành Aether cổ', 'Trạm (toà thành)', [], 'moi'),
             ('Phố Đổ Nát', 'Săn', [('Hiệp sĩ ma', 'moi')], 'moi'),
             ('Xưởng Máy Cổ', 'Săn', [('Vệ binh máy', 'moi'), ('Cỗ máy canh giữ · boss khu', 'moi')], 'moi'),
             ('Thư Viện Bay', 'Săn', [('Sách bay', 'moi')], 'moi'),
             ('Tháp Pháp Sư', 'Săn', [('Pháp sư mất trí', 'mau:Cướp biển')], 'moi'),
             ('Sân Tượng', 'Săn', [('Gargoyle cổ', 'mau:Gargoyle đá'), ('Hiệp sĩ đầu lâu · boss khu', 'moi')], 'moi'),
             ('Điện Aether', 'Thánh địa', [('Đại pháp sư sa đoạ · boss chúa', 'moi')], 'moi'),
         ]),
    dict(n=10, name='Vực Hư Không', lv='90–100', elem='Bóng tối / hỗn hợp', weak='Aether, Hoả', status='Chưa có map', dragon='Hắc Long',
         town=('castle', 'Thành trì Hư Không', 'Tiền đồn cuối cùng trước Ma vương — liên quân các vùng đóng ở đây.'),
         maps=[
             ('Thành trì Hư Không', 'Trạm (toà thành)', [], 'moi'),
             ('Đảo Trôi Tím', 'Săn', [('Quỷ hư không', 'moi')], 'moi'),
             ('Khe Nứt', 'Săn', [('Mắt bay', 'moi'), ('Hiệp sĩ hư không · boss khu', 'moi')], 'moi'),
             ('Rừng Bóng', 'Săn', [('Bóng người', 'mau:Hiệp sĩ ma')], 'moi'),
             ('Nghĩa Trang Hư Không', 'Săn', [('Ác linh', 'mau:Tinh linh băng')], 'moi'),
             ('Hang Ma Sói', 'Săn', [('Ma sói', 'moi'), ('Mẹ quỷ · boss khu', 'moi')], 'moi'),
             ('Ngai Ma Vương', 'Thánh địa', [('Ma vương · boss chúa (trùm cuối)', 'moi')], 'moi'),
         ]),
]

DRAGONS = [
    ('Phong Long', 'Tuyệt Vân', 4, 'đỉnh Đền Trên Mây', '~40', 'Phong — yếu Thổ', 'bay vòng trên cao, đáp xuống tạo lốc; bão gió đẩy ra mép vực'),
    ('Băng Long', 'Hàn Sương', 5, 'hang băng dưới hồ đóng băng', '~50', 'Băng — yếu Hoả', 'hơi thở băng, mưa trụ băng, mặt hồ nứt'),
    ('Hoả Long', 'Viêm Đế', 6, 'miệng núi lửa', '~60', 'Hoả — yếu Thuỷ, Băng', 'phun lửa theo nón, mưa thiên thạch, dung nham dâng'),
    ('Thuỷ Long', 'Thương Hải', 7, 'xoáy nước giữa rạn san hô', '~70', 'Thuỷ — yếu Phong, Thổ', 'lặn / trồi chỗ khác, sóng thần, làm ướt cả sân'),
    ('Địa Long', 'Thạch Cốt', 8, 'đáy hang tinh thể', '~80', 'Thổ — yếu Phong', 'trồi lên dưới chân, gai đá, giáp đá phải phá'),
    ('Quang Long', 'Thiên Huy', 9, 'tháp ma pháp đổ nát', '~90', 'Aether — kháng phép, yếu Kiếm', 'tia sáng quét, khiên phản phép, nhân bản ảnh rồng'),
    ('Hắc Long', 'Vô Tận', 10, 'khe nứt trước cổng thành Ma vương', '~95', 'Hắc ám — yếu Aether, Hoả', 'hố hư không hút người chơi, bóng rồng tách làm ba'),
]

GEAR_BODY = [
    ('Áo', 'body', 'lớp thân — vẽ theo từng khung động tác'),
    ('Quần', 'legs', 'lớp thân'),
    ('Giày', 'feet', 'lớp thân'),
    ('Găng tay', 'hands', 'lớp thân (nhỏ, bàn tay)'),
]
GEAR_ATTACH = [
    ('Vũ khí chính — kiếm', 6, 'tay phải; chém thì cầm kiếm'),
    ('Vũ khí phép — trượng / gậy', 6, 'niệm phép thì cầm trượng (mỗi lúc cầm một loại)'),
    ('Tay phụ — khiên', 3, 'tay trái'),
    ('Mũ', 6, 'đội trên đầu; mũ che tóc thì ẩn phần tóc trên'),
    ('Áo choàng', 3, 'sau lưng / trước khi nhìn sau'),
]
BODY_FAMILIES = 'Vải tân thủ · Giáp da · Giáp sắt · Áo pháp sư'

BUDGET = [
    ('Nhân vật người chơi', [
        ('Hiệu ứng ~70 skill (vẽ riêng từng skill: lúc niệm, đạn bay, lúc trúng)', 1000),
        ('Trang bị lớp thân: 4 món (áo, quần, giày, găng) × 4 kiểu hình × 2 giới tính × ~50 lượt', 1600),
        ('Trang bị gắn: 24 kiểu (kiếm, trượng, khiên, mũ, áo choàng) × ~2 lượt', 50),
        ('Kiểu tóc chọn lúc tạo nhân vật (2 kiểu mới × 2 giới tính × 2 mốc tuổi)', 400),
        ('Động tác riêng: lướt, giữ thế, phân thân, phóng kiếm', 150),
    ]),
    ('Boss', [
        ('28 boss vẽ mới (27 boss vùng 2–10 + Gargoyle Đá) × ~60 lượt', 1680),
        ('Chiêu: 10 boss chúa × 3–4 chiêu, 20 boss khu × 2 chiêu (gồm Vua Lich, Quỷ vương)', 3200),
        ('7 rồng nguyên tố × ~250 lượt (sprite lớn + 3–4 chiêu)', 1750),
    ]),
    ('Quái thường (cắt)', [
        ('27 loại vẽ mới × ~20 lượt (chế độ thường, 5 hướng + lật gương); 19 loại đổi màu = 0 lượt', 540),
    ]),
    ('Map (vốn rẻ)', [
        ('Đồ vật / nhà / cây của 9 vùng, trạm, tranh vùng, tranh lục địa, gian hàng', 600),
    ]),
]

MONTHS = [
    ('Tháng 1', 'Gói 24$ · 5.000 lượt', [
        'Toàn bộ nhân vật người chơi: hiệu ứng skill, trang bị lớp thân + đồ gắn, kiểu tóc, động tác (~3.200)',
        'Vùng 1: Gargoyle Đá + Dơi hang (Hang Gargoyle), chiêu cho Vua Lich + Quỷ vương + Gargoyle Đá (~500)',
        'Tranh lục địa cho bản đồ tổng (~40)',
        'Vùng 2 + vùng 3: boss, chiêu, quái mới, đồ vật (~1.240)',
    ], 4980),
    ('Tháng 2', 'Gói 24$ · 5.000 lượt', [
        'Vùng 4 → 10: boss, chiêu, quái mới, đồ vật (7 × ~620 ≈ 4.340)',
        'Rồng Phong Long + Băng Long (~500)',
    ], 4840),
    ('Tháng 3', 'Gói 12$ · 2.000 lượt', [
        '5 rồng còn lại (~1.250)',
        'Vẽ lại những hình chưa đạt (~750)',
    ], 2000),
]

QUESTIONS = [
    'Tên 10 vùng, nơi ở (làng / toà thành) và tên map — tên vùng 2–10 là đề xuất.',
    'Danh sách quái từng vùng, nhất là các loại dùng hình đổi màu (cột Hình). Đã thay vài loại trong kế hoạch cũ để dùng lại hình: vùng 3 "linh hồn cát" → Cung thủ xương cát, vùng 5 bỏ "chim cánh cụt chiến" → Gargoyle băng.',
    'Số kiểu hình trang bị bản đầu: 4 kiểu cho mỗi món thân (áo, quần, giày, găng), đồ gắn 24 kiểu. Đồ khác cấp / khác chỉ số dùng chung một kiểu hình, khác màu theo độ hiếm (code nhuộm, 0 lượt).',
    'Dây chuyền và nhẫn không hiện trên người (quá nhỏ) — chỉ hiện ở kho đồ. Đồng ý không?',
    'Thứ tự vẽ theo tháng (mục Ngân sách). Lượt không dùng hết thì mất, nên mỗi tháng chỉ mua đúng gói cần.',
]


def esc(s):
    return html.escape(s, quote=True)


def pill(status):
    if status == 'co':
        return '<span class="pill have">Có sẵn</span>'
    if status == 'chieu':
        return '<span class="pill skill">Có hình · cần chiêu mới</span>'
    if status == 'moi':
        return '<span class="pill new">Vẽ mới</span>'
    if status.startswith('mau:'):
        return f'<span class="pill tint">Đổi màu từ {esc(status[4:])}</span>'
    return ''


def region_html(r):
    kind = 'Toà thành' if r['town'][0] == 'castle' else 'Làng'
    rows = []
    for name, role, mobs, mapstatus in r['maps']:
        if mobs:
            mob_cells = '<ul class="mobs">' + ''.join(f'<li><span class="mob{" boss" if "boss" in m else ""}">{esc(m)}</span>{pill(st)}</li>' for m, st in mobs) + '</ul>'
        else:
            mob_cells = '<span class="muted">Không có quái · NPC dịch vụ</span>'
        map_pill = '<span class="pill have">Đã có map</span>' if mapstatus == 'co' else '<span class="pill plan">Chưa có map</span>'
        rows.append(f'<tr><td><b>{esc(name)}</b><div class="role">{esc(role)}</div></td><td>{mob_cells}</td><td>{map_pill}</td></tr>')
    dragon = f'<p class="dragon-note">Thêm: <b>{esc(r["dragon"])}</b> ở Long Huyệt (map phụ của vùng) — xem mục Rồng.</p>' if r.get('dragon') else ''
    return f'''
<section class="region" id="vung-{r["n"]}">
  <header class="region-head">
    <span class="region-no">Vùng {r["n"]}</span>
    <h3>{esc(r["name"])}</h3>
    <div class="facts">
      <span><i>Cấp</i> {esc(r["lv"])}</span>
      <span><i>Hệ vùng</i> {esc(r["elem"])}</span>
      <span><i>Quái yếu</i> {esc(r["weak"])}</span>
      <span><i>Trạng thái</i> {esc(r["status"])}</span>
    </div>
  </header>
  <div class="settle"><span class="kind {r["town"][0]}">{kind}</span><b>{esc(r["town"][1])}</b><span class="muted"> — {esc(r["town"][2])}</span></div>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Map</th><th>Quái / boss · hình</th><th>Map</th></tr></thead>
      <tbody>{"".join(rows)}</tbody>
    </table>
  </div>
  {dragon}
</section>'''


def count():
    new_mob = tint_mob = boss_new = 0
    for r in REGIONS:
        for _, _, mobs, _ in r['maps']:
            for m, st in mobs:
                is_boss = 'boss' in m
                if st == 'moi':
                    if is_boss:
                        boss_new += 1
                    else:
                        new_mob += 1
                elif st.startswith('mau:'):
                    tint_mob += 1
    return new_mob, tint_mob, boss_new


new_mob, tint_mob, boss_new = count()
total_budget = sum(v for _, items in BUDGET for _, v in items)

budget_html = ''.join(
    f'<tr class="grp"><th colspan="2">{esc(g)}</th><th class="num">{sum(v for _, v in items):,}</th></tr>'.replace(',', '.')
    + ''.join(f'<tr><td colspan="2">{esc(t)}</td><td class="num">{v:,}</td></tr>'.replace(',', '.') for t, v in items)
    for g, items in BUDGET
)
months_html = ''.join(
    f'''<div class="month"><div class="month-head"><b>{esc(m)}</b><span>{esc(pack)}</span></div><ul>{"".join(f"<li>{esc(x)}</li>" for x in items)}</ul><div class="month-total">≈ {str(f"{tot:,}").replace(",", ".")} lượt</div></div>'''
    for m, pack, items, tot in MONTHS
)
dragons_html = ''.join(
    f'<tr><td><b>{esc(a)}</b><div class="role">{esc(b)}</div></td><td>Vùng {n} · {esc(where)}</td><td class="num">{esc(lv)}</td><td>{esc(el)}</td><td>{esc(move)}</td></tr>'
    for a, b, n, where, lv, el, move in DRAGONS
)
toc = ''.join(f'<a href="#vung-{r["n"]}"><span class="num">{r["n"]}</span>{esc(r["name"])}</a>' for r in REGIONS)
regions_html = ''.join(region_html(r) for r in REGIONS)
body_rows = ''.join(f'<tr><td><b>{esc(a)}</b></td><td>{esc(c)}</td><td>{esc(BODY_FAMILIES)}</td><td class="num">4 × 2 giới tính</td></tr>' for a, _, c in GEAR_BODY)
attach_rows = ''.join(f'<tr><td><b>{esc(a)}</b></td><td>{esc(c)}</td><td class="num">{n} kiểu</td></tr>' for a, n, c in GEAR_ATTACH)
questions_html = ''.join(f'<li>{esc(q)}</li>' for q in QUESTIONS)

page = f'''<title>Thế giới Aether</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Alegreya:wght@600;700;800&family=Nunito:wght@500;600;700;800&display=swap">
<style>
/* Bố cục: một cột đọc (mục lục dính bên trái trên màn rộng), tông giấy + gỗ của bộ UI trong game. */
:root {{
  --paper: #f7e6c4; --paper-hi: #fdf3dc; --paper-sunk: #ecd3a4; --line: #c9a578;
  --ink: #3a2413; --ink-soft: #6b4a2b; --wood: #4a2e1c; --gold: #b07a12; --leaf: #2f6b34; --berry: #9a3324; --sky: #1f5f8a;
  --have-bg: #dcebd3; --new-bg: #f6d6c8; --tint-bg: #d7e6f2; --skill-bg: #f3e1b6; --plan-bg: #ecd3a4;
  --display: 'Alegreya', Georgia, serif; --body: 'Nunito', system-ui, sans-serif;
}}
@media (prefers-color-scheme: dark) {{ :root:not([data-theme="light"]) {{
  --paper: #22170f; --paper-hi: #2c1f15; --paper-sunk: #1a110a; --line: #5a3f27;
  --ink: #f0dfb8; --ink-soft: #d9c08f; --wood: #f0dfb8; --gold: #ffd166; --leaf: #8fd39a; --berry: #ffb4a3; --sky: #9fd3ff;
  --have-bg: #233a24; --new-bg: #4a2219; --tint-bg: #1d3347; --skill-bg: #4a3712; --plan-bg: #33251a; color-scheme: dark; }} }}
:root[data-theme="dark"] {{
  --paper: #22170f; --paper-hi: #2c1f15; --paper-sunk: #1a110a; --line: #5a3f27;
  --ink: #f0dfb8; --ink-soft: #d9c08f; --wood: #f0dfb8; --gold: #ffd166; --leaf: #8fd39a; --berry: #ffb4a3; --sky: #9fd3ff;
  --have-bg: #233a24; --new-bg: #4a2219; --tint-bg: #1d3347; --skill-bg: #4a3712; --plan-bg: #33251a; color-scheme: dark; }}
* {{ box-sizing: border-box; }}
body {{ background: var(--paper); color: var(--ink); font-family: var(--body); font-size: 15px; line-height: 1.6; }}
.wrap {{ max-width: 1180px; margin: 0 auto; padding-inline: 16px; padding-block: 28px 64px; display: grid; grid-template-columns: 220px minmax(0, 1fr); gap: 32px; }}
@media (max-width: 860px) {{ .wrap {{ grid-template-columns: minmax(0, 1fr); }} nav.toc {{ position: static !important; }} }}
nav.toc {{ position: sticky; top: calc(env(safe-area-inset-top, 0px) + 16px); align-self: start; display: flex; flex-direction: column; gap: 2px; font-size: 14px; }}
nav.toc .label {{ font-size: 12px; letter-spacing: .08em; text-transform: uppercase; color: var(--ink-soft); font-weight: 800; margin: 10px 0 4px; }}
nav.toc a {{ color: var(--ink); text-decoration: none; padding: 3px 8px; border-radius: 6px; display: flex; gap: 8px; }}
nav.toc a:hover, nav.toc a:focus-visible {{ background: var(--paper-sunk); outline: none; }}
nav.toc .num {{ color: var(--gold); font-weight: 800; min-width: 1.4em; font-variant-numeric: tabular-nums; }}
main {{ min-width: 0; display: flex; flex-direction: column; gap: 40px; }}
h1, h2, h3 {{ font-family: var(--display); text-wrap: balance; margin: 0; line-height: 1.2; }}
h1 {{ font-size: clamp(30px, 5vw, 44px); font-weight: 800; }}
h2 {{ font-size: 26px; font-weight: 800; border-bottom: 2px solid var(--line); padding-bottom: 6px; margin-bottom: 14px; }}
h3 {{ font-size: 22px; font-weight: 800; }}
p {{ margin: 0; max-width: 72ch; }}
.lead {{ color: var(--ink-soft); font-size: 16px; margin-top: 8px; }}
.status-line {{ display: inline-flex; gap: 8px; align-items: center; margin-top: 14px; font-size: 13px; font-weight: 800; color: var(--berry); background: var(--new-bg); padding: 4px 10px; border-radius: 999px; }}
.stats {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-top: 20px; }}
.stat {{ background: var(--paper-hi); border: 2px solid var(--line); border-radius: 10px; padding: 12px 14px; }}
.stat b {{ display: block; font-family: var(--display); font-size: 28px; font-variant-numeric: tabular-nums; }}
.stat span {{ color: var(--ink-soft); font-size: 13px; }}
.note {{ background: var(--paper-hi); border-left: 4px solid var(--gold); padding: 12px 14px; border-radius: 0 8px 8px 0; margin-top: 12px; }}
.table-wrap {{ overflow-x: auto; }}
table {{ border-collapse: collapse; width: 100%; font-size: 14px; }}
th, td {{ text-align: left; vertical-align: top; padding: 8px 10px; border-bottom: 1px solid var(--line); }}
thead th {{ font-size: 12px; letter-spacing: .06em; text-transform: uppercase; color: var(--ink-soft); }}
td.num, th.num {{ text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }}
.role {{ color: var(--ink-soft); font-size: 12px; }}
.muted {{ color: var(--ink-soft); }}
ul.mobs {{ list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 4px; }}
ul.mobs li {{ display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }}
.mob.boss {{ font-weight: 800; color: var(--berry); }}
.pill {{ display: inline-block; font-size: 11px; font-weight: 800; padding: 1px 8px; border-radius: 999px; white-space: nowrap; }}
.pill.have {{ background: var(--have-bg); color: var(--leaf); }}
.pill.new {{ background: var(--new-bg); color: var(--berry); }}
.pill.tint {{ background: var(--tint-bg); color: var(--sky); }}
.pill.skill {{ background: var(--skill-bg); color: var(--gold); }}
.pill.plan {{ background: var(--plan-bg); color: var(--ink-soft); }}
.legend {{ display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }}
.region {{ display: flex; flex-direction: column; gap: 10px; scroll-margin-top: 16px; }}
.region-head {{ display: flex; flex-direction: column; gap: 4px; }}
.region-no {{ font-size: 12px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--gold); }}
.facts {{ display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 13px; }}
.facts i {{ font-style: normal; color: var(--ink-soft); margin-right: 4px; }}
.settle {{ background: var(--paper-hi); border: 1px solid var(--line); border-radius: 8px; padding: 8px 12px; display: flex; flex-wrap: wrap; gap: 6px; align-items: baseline; }}
.kind {{ font-size: 11px; font-weight: 800; padding: 1px 8px; border-radius: 999px; background: var(--paper-sunk); }}
.kind.castle {{ background: var(--skill-bg); color: var(--gold); }}
.dragon-note {{ font-size: 13px; color: var(--ink-soft); }}
tr.grp th {{ font-family: var(--display); font-size: 17px; text-transform: none; letter-spacing: 0; color: var(--ink); background: var(--paper-sunk); }}
tr.total td {{ font-weight: 800; font-size: 16px; border-top: 2px solid var(--ink); }}
.months {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; margin-top: 14px; }}
.month {{ background: var(--paper-hi); border: 2px solid var(--line); border-radius: 10px; padding: 12px 14px; display: flex; flex-direction: column; gap: 8px; }}
.month-head {{ display: flex; justify-content: space-between; gap: 8px; flex-wrap: wrap; }}
.month-head b {{ font-family: var(--display); font-size: 18px; }}
.month-head span {{ font-size: 12px; font-weight: 800; color: var(--gold); }}
.month ul {{ margin: 0; padding-left: 18px; font-size: 14px; }}
.month-total {{ margin-top: auto; font-weight: 800; font-variant-numeric: tabular-nums; }}
ol.questions {{ display: flex; flex-direction: column; gap: 8px; padding-left: 22px; margin: 0; }}
.gear-split {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; }}
.gear-split > div {{ min-width: 0; }}
h4 {{ font-family: var(--display); font-size: 17px; margin: 0 0 6px; }}
</style>

<div class="wrap">
  <nav class="toc" aria-label="Mục lục">
    <span class="label">Trang này</span>
    <a href="#tom-tat">Tóm tắt</a>
    <a href="#trang-bi">Trang bị hiện trên người</a>
    <span class="label">10 vùng</span>
    {toc}
    <span class="label">Thêm</span>
    <a href="#rong">7 rồng nguyên tố</a>
    <a href="#ngan-sach">Ngân sách PixelLab</a>
    <a href="#can-chot">Cần chốt</a>
  </nav>
  <main>
    <section id="tom-tat">
      <h1>Thế giới Aether</h1>
      <p class="lead">Danh sách vùng, map, quái, boss, rồng và phần hình nhân vật người chơi cần vẽ — để chủ dự án chốt trước khi mua gói PixelLab 24$. Soạn 08/10/2026.</p>
      <span class="status-line">Bản đề xuất — chờ chốt</span>
      <div class="stats">
        <div class="stat"><b>10</b><span>vùng · mỗi vùng 1 trạm (làng / toà thành) + 5 map săn + 1 thánh địa</span></div>
        <div class="stat"><b>70</b><span>map (đã có 6 ở vùng 1)</span></div>
        <div class="stat"><b>{new_mob} + {tint_mob}</b><span>loại quái: vẽ mới + đổi màu (đã có 4 loại vùng 1)</span></div>
        <div class="stat"><b>30 + 7</b><span>boss vùng (vẽ mới {boss_new}) + rồng nguyên tố</span></div>
        <div class="stat"><b>~{str(f"{total_budget:,}").replace(",", ".")}</b><span>lượt PixelLab cho cả game</span></div>
      </div>
      <p class="note">Luật chung của mỗi vùng: mỗi map săn <b>chỉ một loại quái</b>, sinh theo bầy; 2 trong 5 map săn có hang ổ <b>boss khu</b> (hồi sinh theo giờ); <b>boss chúa</b> ở thánh địa, hạ xong mới mở vùng kế. Ưu tiên lượt vẽ: <b>nhân vật người chơi + boss</b> vẽ riêng, đủ chất lượng; quái thường cắt bằng hình đổi màu.</p>
      <div class="legend">{pill("co")}{pill("moi")}{pill("mau:quái khác")}{pill("chieu")}</div>
    </section>

    <section id="trang-bi">
      <h2>Trang bị hiện trên người</h2>
      <p>Mặc món nào thì nhân vật hiện đúng món đó: cầm kiếm nào, cầm trượng nào, đội mũ nào, mặc áo, quần, đi giày, đeo găng nào đều thấy trên người — cả người chơi khác cũng thấy. Mỗi lúc chỉ cầm một vũ khí: chém thì cầm kiếm, niệm phép thì cầm trượng.</p>
      <div class="gear-split" style="margin-top:14px">
        <div>
          <h4>Lớp thân (đắt — vẽ theo từng khung động tác)</h4>
          <div class="table-wrap"><table>
            <thead><tr><th>Món</th><th>Cách hiện</th><th>Kiểu hình bản đầu</th><th class="num">Số kiểu</th></tr></thead>
            <tbody>{body_rows}</tbody>
          </table></div>
        </div>
        <div>
          <h4>Đồ gắn (rẻ — 3 hướng nhìn mỗi món)</h4>
          <div class="table-wrap"><table>
            <thead><tr><th>Món</th><th>Cách hiện</th><th class="num">Bản đầu</th></tr></thead>
            <tbody>{attach_rows}</tbody>
          </table></div>
        </div>
      </div>
      <p class="note">Đồ khác cấp, khác chỉ số dùng chung một kiểu hình; độ hiếm hiện bằng màu và viền sáng (code nhuộm, không tốn lượt). Dây chuyền, nhẫn quá nhỏ để thấy trên người — chỉ hiện ở kho đồ. Hiện trong game đã gắn được mũ / vũ khí / tay phụ / áo choàng; áo đang đổi cả bộ — lớp thân riêng từng món cần thêm bước tách lớp trong pipeline (làm thử 1 món trước).</p>
    </section>

    <section>
      <h2>10 vùng</h2>
      <div style="display:flex;flex-direction:column;gap:32px">{regions_html}</div>
    </section>

    <section id="rong">
      <h2>7 rồng nguyên tố</h2>
      <p>Boss thêm, ngoài 3 boss của vùng. Mỗi rồng ở một map phụ riêng (Long Huyệt), cần cấp 40 mới vào; chỉ người đánh đòn cuối nhận Long Châu — mở tuyệt kỹ mốc 10; đủ 7 Long Châu triệu hồi Thần Long.</p>
      <div class="table-wrap" style="margin-top:12px"><table>
        <thead><tr><th>Rồng</th><th>Long Huyệt</th><th class="num">Cấp</th><th>Hệ</th><th>Chiêu chính</th></tr></thead>
        <tbody>{dragons_html}</tbody>
      </table></div>
    </section>

    <section id="ngan-sach">
      <h2>Ngân sách PixelLab</h2>
      <p>Gói hiện có: 12$ = 2.000 lượt, 24$ = 5.000 lượt, 48$ = 10.000 lượt mỗi tháng. Lượt không dùng hết thì mất, nên mua theo tháng, vẽ theo thứ tự mở vùng.</p>
      <div class="table-wrap" style="margin-top:12px"><table>
        <thead><tr><th colspan="2">Hạng mục</th><th class="num">Lượt</th></tr></thead>
        <tbody>{budget_html}<tr class="total"><td colspan="2">Cộng</td><td class="num">~{str(f"{total_budget:,}").replace(",", ".")}</td></tr></tbody>
      </table></div>
      <div class="months">{months_html}</div>
      <p class="note">Tổng ≈ 60$ trong 3 tháng (24$ + 24$ + 12$). Nếu bớt kiểu hình trang bị bản đầu (ví dụ 3 thay vì 4 kiểu mỗi món thân) thì tháng 3 gần như không cần.</p>
    </section>

    <section id="can-chot">
      <h2>Cần chốt</h2>
      <ol class="questions">{questions_html}</ol>
    </section>
  </main>
</div>
'''
open(OUT, 'w', encoding='utf8', newline='').write(page)
print('ok', new_mob, tint_mob, boss_new, total_budget)

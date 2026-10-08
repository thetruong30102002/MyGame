# Sinh docs/the-gioi-aether.html (danh sách vùng / map / quái / boss / trang bị / ngân sách PixelLab) — sửa dữ liệu ở đây rồi chạy: python docs/tools/the-gioi-aether.py
import html

import os

DOCS = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(DOCS, 'the-gioi-aether.html')
OUT_MD = os.path.join(DOCS, 'the-gioi-aether.md')

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
    ('Áo', 'body', 'lớp thân — cắt từ bộ đồ hoàn chỉnh theo vùng ngực / tay áo'),
    ('Quần', 'legs', 'lớp thân — cắt theo vùng hông / chân'),
    ('Giày', 'feet', 'lớp thân — cắt theo vùng bàn chân'),
    ('Găng tay', 'hands', 'lớp thân — cắt theo vùng bàn tay'),
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
    ('Nhân vật người chơi (ưu tiên)', [
        ('Hiệu ứng skill: mỗi hệ một bộ niệm / đạn / nổ dùng chung (7 hệ), 8 tuyệt kỹ mốc 10 vẽ riêng, 9 phản ứng nguyên tố', 450),
        ('Trang bị lớp thân: 4 kiểu hình × 2 giới tính × ~50 lượt — mỗi kiểu vẽ MỘT bộ đồ hoàn chỉnh, pipeline cắt ra 4 lớp áo / quần / giày / găng để phối tự do', 400),
        ('Trang bị gắn: 24 kiểu (6 kiếm, 6 trượng, 3 khiên, 6 mũ, 3 áo choàng) × ~2 lượt', 50),
        ('Kiểu tóc: 2 kiểu mới × 2 giới tính, bản 16 tuổi (tuổi thơ giữ tóc gốc)', 200),
        ('Động tác riêng: lướt, giữ thế, phân thân, phóng kiếm', 150),
    ]),
    ('Boss (ưu tiên)', [
        ('28 boss vẽ mới × ~40 lượt (4 hướng + lật gương; đi, đánh, niệm, gục)', 1120),
        ('Chiêu boss chúa: 10 boss × 2 chiêu riêng × ~30 lượt (gồm Quỷ vương)', 600),
        ('Chiêu boss khu: 20 boss × 1 chiêu riêng × ~10 lượt (gồm Vua Lich); chiêu thứ hai dùng hiệu ứng hệ có sẵn', 200),
        ('7 rồng nguyên tố × ~100 lượt (sprite lớn 4 hướng + 2 chiêu)', 700),
    ]),
    ('Quái thường (cắt)', [
        ('27 loại vẽ mới × ~15 lượt (chế độ thường 1 lượt đủ 8 hướng; đi / đánh 4 hướng + lật gương); 19 loại đổi màu = 0 lượt', 405),
    ]),
    ('Map + giao diện', [
        ('Đồ vật / nhà / cây 9 vùng (4 tấm 3×3 mỗi vùng), 9 trạm, tranh lục địa, gian hàng, icon (kim cương, lịch, 6 bình)', 450),
    ]),
]

MONTHS = [
    ('Đợt 1', 'nhân vật người chơi', [
        'Trang bị: làm thử 1 kiểu hình (cắt 4 lớp) trước, đạt mới vẽ tiếp 3 kiểu còn lại',
        'Hiệu ứng skill theo hệ + tuyệt kỹ + phản ứng; động tác riêng; kiểu tóc',
    ], 1250),
    ('Đợt 2', 'boss + rồng', [
        'Vùng 1 trước: Gargoyle Đá + chiêu Quỷ vương / Vua Lich',
        '27 boss vùng 2–10 + chiêu, rồi 7 rồng',
    ], 2620),
    ('Đợt 3', 'quái + map', [
        '27 loại quái mới (19 loại còn lại đổi màu bằng code)',
        'Đồ vật 9 vùng, trạm, tranh lục địa, gian hàng, icon',
    ], 855),
]

QUESTIONS = [
    'Tên 10 vùng, nơi ở (làng / toà thành) và tên map — tên vùng 2–10 là đề xuất.',
    'Danh sách quái từng vùng, nhất là các loại dùng hình đổi màu (cột Hình). Đã thay vài loại trong kế hoạch cũ để dùng lại hình: vùng 3 "linh hồn cát" → Cung thủ xương cát, vùng 5 bỏ "chim cánh cụt chiến" → Gargoyle băng.',
    'Trang bị: 4 kiểu hình bộ đồ (Vải tân thủ, Giáp da, Giáp sắt, Áo pháp sư) cắt thành 4 lớp áo / quần / giày / găng; đồ gắn 24 kiểu. Đồ khác cấp / khác chỉ số dùng chung kiểu hình, khác màu theo độ hiếm (code nhuộm, 0 lượt).',
    'Dây chuyền và nhẫn không hiện trên người (quá nhỏ) — chỉ hiện ở kho đồ.',
    'Ngân sách vừa ĐÚNG MỘT gói 24$ (5.000 lượt), còn ~275 lượt dự phòng để vẽ lại — vẽ hỏng nhiều thì cắt bớt rồng / chiêu boss khu trước, không cắt nhân vật người chơi.',
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

def dotnum(n):
    return f'{n:,}'.replace(',', '.')


budget_html = ''.join(
    f'<tr class="grp"><th colspan="2">{esc(g)}</th><th class="num">{dotnum(sum(v for _, v in items))}</th></tr>'
    + ''.join(f'<tr><td colspan="2">{esc(t)}</td><td class="num">{dotnum(v)}</td></tr>' for t, v in items)
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
      <p class="lead">Danh sách vùng, map, quái, boss, rồng và phần hình nhân vật người chơi cần vẽ — cân cho vừa một gói PixelLab 24$ (5.000 lượt). Soạn 08/10/2026. Bản Markdown cùng nội dung + phần bàn giao cho agent: <code>docs/the-gioi-aether.md</code>.</p>
      <span class="status-line">Bản đề xuất — chờ chốt</span>
      <div class="stats">
        <div class="stat"><b>10</b><span>vùng · mỗi vùng 1 trạm (làng / toà thành) + 5 map săn + 1 thánh địa</span></div>
        <div class="stat"><b>70</b><span>map (đã có 6 ở vùng 1)</span></div>
        <div class="stat"><b>{new_mob} + {tint_mob}</b><span>loại quái: vẽ mới + đổi màu (đã có 4 loại vùng 1)</span></div>
        <div class="stat"><b>30 + 7</b><span>boss vùng (vẽ mới {boss_new}) + rồng nguyên tố</span></div>
        <div class="stat"><b>~{str(f"{total_budget:,}").replace(",", ".")}</b><span>lượt PixelLab cho cả game — vừa 1 gói 24$ (5.000)</span></div>
      </div>
      <p class="note">Luật chung của mỗi vùng: mỗi map săn <b>chỉ một loại quái</b>, sinh theo bầy; 2 trong 5 map săn có hang ổ <b>boss khu</b> (hồi sinh theo giờ); <b>boss chúa</b> ở thánh địa, hạ xong mới mở vùng kế. Ưu tiên lượt vẽ: <b>nhân vật người chơi + boss</b> vẽ riêng, đủ chất lượng; quái thường cắt bằng hình đổi màu.</p>
      <div class="legend">{pill("co")}{pill("moi")}{pill("mau:quái khác")}{pill("chieu")}</div>
    </section>

    <section id="trang-bi">
      <h2>Trang bị hiện trên người</h2>
      <p>Mặc món nào thì nhân vật hiện đúng món đó: cầm kiếm nào, cầm trượng nào, đội mũ nào, mặc áo, quần, đi giày, đeo găng nào đều thấy trên người — cả người chơi khác cũng thấy. Mỗi lúc chỉ cầm một vũ khí: chém thì cầm kiếm, niệm phép thì cầm trượng.</p>
      <div class="gear-split" style="margin-top:14px">
        <div>
          <h4>Lớp thân (vẽ theo từng khung động tác)</h4>
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
      <p class="note">Đồ khác cấp, khác chỉ số dùng chung một kiểu hình; độ hiếm hiện bằng màu và viền sáng (code nhuộm, không tốn lượt). Dây chuyền, nhẫn quá nhỏ để thấy trên người — chỉ hiện ở kho đồ. Mỗi kiểu hình chỉ vẽ MỘT bộ đồ hoàn chỉnh trên người (PixelLab `transfer_outfit` / `create_character_state` trên đúng các khung động tác), pipeline so với nhân vật gốc để tách phần đồ rồi cắt theo vùng thân thành 4 lớp — phối áo kiểu này với quần kiểu kia vẫn khớp. Hiện trong game đã gắn được mũ / vũ khí / tay phụ / áo choàng; áo đang đổi cả bộ — bước tách + cắt lớp làm thử 1 kiểu trước.</p>
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
      <p>Chủ dự án chọn <b>một gói 24$ = 5.000 lượt</b> và làm đủ cả game trước. Mọi hạng mục dưới đây đã cân cho vừa gói đó, ưu tiên nhân vật người chơi + boss. Gói chạy 10 việc song song; lượt không dùng hết trong tháng thì mất.</p>
      <div class="table-wrap" style="margin-top:12px"><table>
        <thead><tr><th colspan="2">Hạng mục</th><th class="num">Lượt</th></tr></thead>
        <tbody>{budget_html}<tr class="total"><td colspan="2">Cộng</td><td class="num">~{str(f"{total_budget:,}").replace(",", ".")}</td></tr></tbody>
      </table></div>
      <div class="months">{months_html}</div>
      <p class="note">Cộng ≈ {str(f"{total_budget:,}").replace(",", ".")} / 5.000 lượt → còn ~{5000 - total_budget} lượt dự phòng để vẽ lại. Vẽ theo ba đợt dưới đây, đợt sau chỉ bắt đầu khi đợt trước đạt; nếu thiếu lượt thì cắt theo thứ tự: chiêu boss khu → rồng → quái mới thành đổi màu. Không cắt nhân vật người chơi.</p>
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


# ---------------------------------------------------------------- bản Markdown (kế hoạch + bàn giao cho agent sau)

HANDOFF = """## Bàn giao — đọc trước khi làm tiếp (agent / người sau)

**Sửa danh sách này:** sửa dữ liệu trong `docs/tools/the-gioi-aether.py` rồi chạy `python docs/tools/the-gioi-aether.py` — sinh lại CẢ
`docs/the-gioi-aether.md` (file này) lẫn trang `docs/the-gioi-aether.html` (đăng lại trang: Artifact
https://claude.ai/artifact/VTrVtPJHXUtETsssKRcx9K). Không sửa tay hai file sinh ra.

### Trạng thái (08/10/2026)

| Phần | Trạng thái | Tài liệu |
|---|---|---|
| Kim cương K1: ví ở máy chủ, điểm danh (cửa sổ lịch), Bia Danh Vọng, quầy hàng của Bram (gian hàng có kệ), bình EXP / chiến đấu | ✔ | `docs/ke-hoach-kim-cuong.md` |
| Chat: kênh Map / Thế giới (3 kim cương / tin) / Riêng, tab riêng từng người | ✔ | `docs/ke-hoach-xa-hoi.md` |
| Khung nhiều vùng T0b: 10 vùng, đi xuyên vùng, cổng vùng, cột dịch chuyển, nơi ở + người bán theo vùng | ✔ (chỉ vùng 1 có map) | `docs/ke-hoach-the-gioi.md` mục 5.1 |
| M3.3a: cấp / EXP / xu / bình do máy chủ giữ | ✔ | `docs/ke-hoach-m3-may-chu-chien-dau.md` |
| Hình PixelLab theo danh sách này | ✘ chờ chủ dự án chốt + mua gói 24$ | file này + `docs/pixellab-ke-hoach-ve.md` |

### Việc kế tiếp (thứ tự đề xuất)

1. Chủ dự án chốt danh sách (mục Cần chốt) → mua gói 24$ → thêm token trả phí vào CUỐI `PIXELLAB_TOKENS` trong `.env.local`
   (chủ dự án tự thêm). Kiểm số dư trước khi vẽ: `cd packages/asset-pipeline && npx tsx src/cli.ts pixellab balances` (miễn phí).
   Vẽ theo ba đợt ở mục Ngân sách; đợt sau chỉ bắt đầu khi đợt trước đạt. Lượt miễn phí của PixelLab đang khoá (08/10/2026).
2. **Lớp trang bị thân** (yêu cầu bắt buộc: mặc món nào hiện đúng món đó — kiếm, trượng, mũ, áo, quần, giày, găng): pipeline tách bộ đồ
   PixelLab so với nhân vật gốc → cắt 4 lớp theo vùng thân → `apps/web/src/game/gearArt.ts` / `gearLayers.ts`. Làm thử 1 kiểu trước.
3. **M3.3b**: túi đồ + trang bị ở máy chủ, rơi đồ (máy chủ quyết), nhật ký kinh tế.
4. **Hang Gargoyle** (map thứ 7 vùng 1) rồi **vùng 2**: map dựng bằng pipeline (`npm run assets:map -- <vùng>`, khai vùng ở
   `packages/asset-pipeline/src/maps/regions.ts`), bật `ready: true` ở `packages/sim/src/regions.ts`.
5. Việc nhỏ chờ làm: báo cáo tin chat + lọc từ tục, bảng xếp hạng, trang quản trị (kim cương / nhật ký / tin bị báo cáo).

### Chạy / kiểm

- Typecheck mọi gói: `npm run typecheck`. Test máy chủ: `cd apps/server && npx tsx tests/<tên>.test.ts` (economy, regions, chat, shop,
  rewards, mobs, social, gear). Test web: `cd apps/web && npx tsx tests/<tên>.test.ts`. Test pipeline: `npm test -w @aether/asset-pipeline`.
- Thử thật KHÔNG đụng máy chủ thật: máy chủ thử `cd apps/server && PORT=3201 AETHER_DB=data/test.db npx tsx src/main.ts` + web
  `node apps/web/scripts/dev-test.mjs` (cổng 3102). Tài khoản thử: `apps/server/tests/test-accounts.md`. Hook dev ở console:
  `__aether` (teleport, goMap, interact, combat, story…). Cộng kim cương thử: `npx tsx src/grant.ts "<tên>" <số>` (thêm
  `AETHER_DB=data/test.db` cho CSDL thử).
- Triển khai (Tailscale Funnel, người chơi thật đang dùng): README mục Funnel — `build:funnel` (ghi vào thư mục KHÔNG đang chạy) →
  chạy thử bản mới ở cổng phụ → tắt + chạy lại `start:funnel` và máy chủ game. **Sao lưu `apps/server/data/aether.db` trước khi đổi
  cách lưu dữ liệu.** Log: `apps/web/funnel.log`, `apps/server/data/server.log`.

### Luật của dự án (đừng phá)

- Không tự vẽ art bằng CSS / SVG / emoji; hình TẠM = biến tấu hình có sẵn (đổi màu, phóng) và ghi rõ TẠM để thay khi có PixelLab.
- Trang bị phải hiện trên người (mục Trang bị). Máy chủ là nguồn sự thật cho kim cương, cấp / EXP / xu / bình.
- Chú thích, tài liệu, thông báo trong game bằng tiếng Việt; commit message tiếng Việt, kết thúc bằng dòng Co-Authored-By.
"""


def md_cell(s):
    return str(s).replace('|', '/').replace('\n', ' ')


def md_status(st):
    if st == 'co':
        return 'có sẵn'
    if st == 'chieu':
        return 'có hình · cần chiêu mới'
    if st == 'moi':
        return '**vẽ mới**'
    if st.startswith('mau:'):
        return f'đổi màu từ {st[4:]}'
    return ''


def dot(n):
    return f'{n:,}'.replace(',', '.')


md = []
md.append('# Thế giới Aether — vùng, map, quái, boss, trang bị, ngân sách PixelLab\n')
md.append('> FILE SINH TỰ ĐỘNG từ `docs/tools/the-gioi-aether.py` — sửa dữ liệu ở đó rồi chạy lại (sinh cả bản HTML). Soạn 08/10/2026,')
md.append('> cân cho vừa MỘT gói PixelLab 24$ (5.000 lượt) — chủ dự án chọn gói này và làm đủ cả game trước. Trạng thái: **chờ chủ dự án chốt**.\n')
md.append(HANDOFF)
md.append('## Tóm tắt\n')
md.append('- **10 vùng**, mỗi vùng 7 map: 1 trạm (làng hoặc toà thành — nơi ở có NPC dịch vụ, nhiệm vụ), 5 map săn, 1 thánh địa → **70 map** (đã có 6 ở vùng 1).')
md.append(f'- Quái thường: **{new_mob} loại vẽ mới + {tint_mob} loại đổi màu** (0 lượt) + 4 loại đã có ở vùng 1. Mỗi map săn chỉ một loại quái, sinh theo bầy.')
md.append(f'- Boss: **30 boss vùng** (2 boss khu + 1 boss chúa mỗi vùng; vẽ mới {boss_new}) + **7 rồng nguyên tố** (boss thêm, map phụ Long Huyệt).')
md.append(f'- PixelLab: **~{dot(total_budget)} / 5.000 lượt** → còn ~{5000 - total_budget} lượt dự phòng. Ưu tiên nhân vật người chơi + boss.\n')

md.append('## Trang bị hiện trên người (BẮT BUỘC)\n')
md.append('Mặc món nào thì nhân vật hiện đúng món đó — cầm kiếm nào, cầm trượng nào, đội mũ nào, áo, quần, giày, găng nào đều thấy trên người,')
md.append('người chơi khác cũng thấy. Mỗi lúc cầm một vũ khí: chém thì cầm kiếm, niệm phép thì cầm trượng.\n')
md.append('| Lớp thân | Cách hiện | Kiểu hình bản đầu |\n|---|---|---|')
for a, _, c in GEAR_BODY:
    md.append(f'| {a} | {c} | {BODY_FAMILIES} (× 2 giới tính) |')
md.append('\nMỗi kiểu hình vẽ MỘT bộ đồ hoàn chỉnh trên người (PixelLab `transfer_outfit` / `create_character_state` trên đúng các khung động')
md.append('tác) → pipeline so với nhân vật gốc để tách phần đồ, rồi cắt theo vùng thân thành 4 lớp; phối áo kiểu này với quần kiểu kia vẫn khớp.\n')
md.append('| Đồ gắn | Cách hiện | Bản đầu |\n|---|---|---|')
for a, n, c in GEAR_ATTACH:
    md.append(f'| {a} | {c} | {n} kiểu |')
md.append('\nĐồ khác cấp / khác chỉ số dùng chung kiểu hình, độ hiếm hiện bằng màu + viền sáng (code nhuộm). Dây chuyền, nhẫn chỉ hiện ở kho đồ.\n')

md.append('## 10 vùng\n')
md.append('Chú thích cột Hình: **vẽ mới** = PixelLab vẽ; "đổi màu từ X" = code đổi màu hình quái X (0 lượt); "có sẵn" = đã có trong game;')
md.append('"cần chiêu mới" = có hình, thiếu hiệu ứng chiêu. Boss khu ở hang ổ trong map săn (hồi sinh theo giờ); boss chúa ở thánh địa,')
md.append('hạ xong mới mở vùng kế.\n')
for r in REGIONS:
    kind = 'toà thành' if r['town'][0] == 'castle' else 'làng'
    md.append(f"### Vùng {r['n']} · {r['name']}\n")
    md.append(f"- Cấp {r['lv']} · hệ vùng {r['elem']} · quái yếu {r['weak']} · {r['status']}")
    md.append(f"- Nơi ở ({kind}): **{r['town'][1]}** — {r['town'][2]}")
    if r.get('dragon'):
        md.append(f"- Thêm: **{r['dragon']}** ở Long Huyệt (map phụ của vùng)")
    md.append('\n| Map | Loại | Quái / boss | Hình | Map |\n|---|---|---|---|---|')
    for name, role, mobs, mapstatus in r['maps']:
        maptxt = 'đã có' if mapstatus == 'co' else 'chưa có'
        if not mobs:
            md.append(f'| {md_cell(name)} | {md_cell(role)} | — (NPC dịch vụ) | — | {maptxt} |')
        for i, (m, st) in enumerate(mobs):
            first = i == 0
            md.append(f'| {md_cell(name) if first else ""} | {md_cell(role) if first else ""} | {md_cell(m)} | {md_status(st)} | {maptxt if first else ""} |')
    md.append('')

md.append('## 7 rồng nguyên tố\n')
md.append('Boss thêm ngoài 3 boss vùng; map phụ Long Huyệt, cần cấp 40; chỉ người đánh đòn cuối nhận Long Châu (mở tuyệt kỹ mốc 10); đủ 7 Long')
md.append('Châu triệu hồi Thần Long. Chi tiết cơ chế: `docs/ke-hoach-the-gioi.md` mục 2.1.\n')
md.append('| Rồng | Tên riêng | Long Huyệt | Cấp | Hệ | Chiêu chính |\n|---|---|---|---|---|---|')
for a, b, n, where, lv, el, move in DRAGONS:
    md.append(f'| {a} | {b} | Vùng {n} · {where} | {lv} | {el} | {move} |')
md.append('')

md.append('## Ngân sách PixelLab — một gói 24$ (5.000 lượt)\n')
md.append('| Nhóm | Hạng mục | Lượt |\n|---|---|---|')
for g, items in BUDGET:
    for i, (t, v) in enumerate(items):
        md.append(f'| {g if i == 0 else ""} | {md_cell(t)} | {dot(v)} |')
md.append(f'| **Cộng** | | **~{dot(total_budget)}** (dự phòng ~{5000 - total_budget}) |\n')
md.append('Vẽ theo ba đợt (đợt sau chỉ bắt đầu khi đợt trước đạt). Thiếu lượt thì cắt theo thứ tự: chiêu boss khu → rồng → quái mới thành')
md.append('đổi màu. **Không cắt nhân vật người chơi.**\n')
for m, pack, items, tot in MONTHS:
    md.append(f'- **{m} — {pack}** (~{dot(tot)} lượt): ' + '; '.join(items) + '.')
md.append('')
md.append('## Cần chốt\n')
for i, q in enumerate(QUESTIONS, 1):
    md.append(f'{i}. {q}')
md.append('')
open(OUT_MD, 'w', encoding='utf8', newline='').write('\n'.join(md))
print('md ok')

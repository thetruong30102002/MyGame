# Sinh docs/the-gioi-aether.html (danh sách vùng / map / quái / boss / trang bị / ngân sách PixelLab) — sửa dữ liệu ở đây rồi chạy: python docs/tools/the-gioi-aether.py
import base64
import html
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sketch  # noqa: E402

DOCS = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT = os.path.join(DOCS, 'the-gioi-aether.html')
OUT_MD = os.path.join(DOCS, 'the-gioi-aether.md')
SKETCH_DIR = os.path.join(DOCS, 'phac-thao-map')  # SVG phác thảo cho bản Markdown
MINIMAPS = os.path.join(DOCS, '..', 'assets', 'maps', 'human')

# trạng thái hình: 'co' = đã có trong game, 'moi' = vẽ mới, 've' = vẽ mới ĐÃ VẼ xong (vẫn tính vào ngân sách như 'moi'),
# 'mau:<từ đâu>' = đổi màu (0 lượt), 'chieu' = có hình, cần chiêu mới.
# trạng thái map: 'co' = đã có trong game, 'dung' = đã dựng (pipeline + test), chờ lên game, 'dot2' = đang chạy bản gần trống, hình
# ĐỢT 2 đã vẽ + dựng vào bản thử, chờ lên game; còn lại = chưa có map.
REGIONS = [
    # Vùng 1 — 12 map (chủ dự án 10/10/2026, thiết kế docs/thiet-ke/vung1-12-map.md). Thứ tự = chỉ số trên sơ đồ R1_POS (6 = thánh địa).
    dict(n=1, name='Thung lũng Thistlewood', lv='1–10', elem='Bóng tối', weak='Hoả, Aether',
         status='12 map + hình ĐỢT 2 (tấm G1 / R1 / B1 + 5 món lẻ — Nghĩa địa, Đồi Xương, Vách, Mộ Vô Danh, Luỹ, Hẻm Cửa Sông hết trống) đã lên game 10/10/2026',
         town=('village', 'Thị trấn Thistlewood', 'Quê nhà của Lior: nhiệm vụ tuổi thơ và tuổi 16 bắt đầu ở đây.'),
         maps=[
             ('Thistlewood', 'Trạm', [], 'co'),
             ('Rừng Mossvale', 'Săn', [('Nấm rừng · cấp 1–3', 'co')], 'co'),
             ('Nghĩa địa Hoàng Hôn', 'Săn', [('Xác sống · cấp 3–5', 'co'), ('Vua Lich · boss khu (hầm mộ)', 'chieu')], 'co'),
             ('Đồi Xương Trắng', 'Săn', [('Cung thủ xương · cấp 4–6', 'co')], 'co'),
             ('Vách Gargoyle', 'Săn', [('Gargoyle đá · cấp 5–7', 'co')], 'co'),
             ('Hang Gargoyle', 'Săn (mới)', [('Dơi hang · cấp 8–9 · đã vẽ, chủ dự án duyệt 10/10/2026', 've'), ('Gargoyle Đá · boss khu · cấp 10', 've')], 'co'),
             ('Đá Phong Ấn', 'Thánh địa', [('Quỷ vương rừng sâu · boss chúa', 'chieu')], 'co'),
             ('Bãi Bồi Brightwater', 'Săn (mới) · tuổi thơ + 16+', [('Nấm rừng · cấp 1 (8–15 tuổi) · cấp 3–4', 'co')], 'co'),
             ('Vết Rạn Mossvale', 'Săn (mới)', [('Nấm nhiễm sợi đỏ · cấp 5–6', 'co')], 'co'),
             ('Mộ Vô Danh', 'Săn (mới)', [('Xác sống · cấp 6–7', 'co')], 'co'),
             ('Luỹ Hiệp Sĩ Cũ', 'Săn (mới)', [('Cung thủ xương · cấp 7–8', 'co')], 'co'),
             ('Hẻm Cửa Sông', 'Săn (mới) · cửa sang vùng 2', [('Gargoyle đá · cấp 9–10', 'co')], 'co'),
         ]),
    dict(n=2, name='Đầm lầy Mù Sương', lv='10–20', elem='Thuỷ / độc', weak='Thổ, Phong', status='Chưa có map',
         town=('village', 'Làng nhà sàn Lau Xám', 'Dân đầm lầy sống trên nhà sàn, nhờ người lạ dẹp quái và tìm thuốc giải độc.'),
         maps=[
             ('Làng nhà sàn Lau Xám', 'Trạm', [], 'moi'),
             ('Bãi Lau Sậy', 'Săn', [('Ếch độc', 'moi')], 'moi'),
             ('Kênh Đỉa', 'Săn', [('Đỉa đầm', 'moi'), ('Mẹ Ếch · boss khu', 'moi')], 'moi'),
             ('Rừng Ngập Nấm', 'Săn', [('Nấm phát quang', 'moi')], 'moi'),
             ('Đầm Rắn Nước', 'Săn', [('Rắn nước', 'moi')], 'moi'),
             ('Vực Sương Xanh', 'Săn', [('Người cá bùn', 'moi'), ('Phù thuỷ đầm · boss khu', 'moi')], 'moi'),
             ('Hồ Hydra', 'Thánh địa', [('Hydra bùn · boss chúa', 'moi')], 'moi'),
         ]),
    dict(n=3, name='Sa mạc Hồng Cát', lv='20–30', elem='Thổ / Hoả', weak='Thuỷ, Băng', status='Chưa có map',
         town=('castle', 'Thành ốc đảo Sahrin', 'Vương quốc sa mạc: các tộc tranh nguồn nước, triều đình giao nhiệm vụ.'),
         maps=[
             ('Thành ốc đảo Sahrin', 'Trạm (toà thành)', [], 'moi'),
             ('Cồn Cát Đỏ', 'Săn', [('Bọ cạp', 'moi')], 'moi'),
             ('Hẻm Rắn', 'Săn', [('Rắn cát', 'moi'), ('Bọ cạp chúa · boss khu', 'moi')], 'moi'),
             ('Lăng Mộ Cát', 'Săn', [('Xác ướp', 'moi')], 'moi'),
             ('Vách Kền Kền', 'Săn', [('Kền kền', 'moi')], 'moi'),
             ('Phế tích Đá Đỏ', 'Săn', [('Linh hồn cát', 'moi'), ('Pharaoh xác ướp · boss khu', 'moi')], 'moi'),
             ('Hố Cát Nuốt', 'Thánh địa', [('Sâu cát khổng lồ · boss chúa', 'moi')], 'moi'),
         ]),
    dict(n=4, name='Cao nguyên Gió Hú', lv='30–40', elem='Phong', weak='Thổ', status='Chưa có map', dragon='Phong Long',
         town=('village', 'Làng Cối Xay Gió', 'Làng trên cao nguyên, giữ đền thờ trên mây.'),
         maps=[
             ('Làng Cối Xay Gió', 'Trạm', [], 'moi'),
             ('Đồi Cỏ Cao', 'Săn', [('Sói gió', 'moi')], 'moi'),
             ('Vách Chim Ưng', 'Săn', [('Chim ưng', 'moi'), ('Đại bàng bão · boss khu', 'moi')], 'moi'),
             ('Thung Lũng Tiên', 'Săn', [('Tiên gió', 'moi')], 'moi'),
             ('Bãi Đá Bay', 'Săn', [('Đá bay', 'moi')], 'moi'),
             ('Đường Lên Đền Mây', 'Săn', [('Yêu tinh gió', 'moi'), ('Pháp sư gió · boss khu', 'moi')], 'moi'),
             ('Đền Trên Mây', 'Thánh địa', [('Rồng gió · boss chúa', 'moi')], 'moi'),
         ]),
    dict(n=5, name='Lãnh nguyên Băng Giá', lv='40–50', elem='Băng', weak='Hoả', status='Chưa có map', dragon='Băng Long',
         town=('village', 'Làng gỗ Tuyết Phong', 'Thợ săn và thợ mỏ băng sống qua mùa đông dài.'),
         maps=[
             ('Làng gỗ Tuyết Phong', 'Trạm', [], 'moi'),
             ('Rừng Thông Tuyết', 'Săn', [('Sói tuyết', 'moi')], 'moi'),
             ('Hồ Băng', 'Săn', [('Tinh linh băng', 'moi'), ('Nữ hoàng băng · boss khu', 'moi')], 'moi'),
             ('Đèo Người Tuyết', 'Săn', [('Người tuyết', 'moi'), ('Yeti · boss khu', 'moi')], 'moi'),
             ('Bờ Biển Băng', 'Săn', [('Chim cánh cụt chiến', 'moi')], 'moi'),
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
             ('Lò Rèn Bỏ Hoang', 'Săn', [('Tinh linh lửa', 'moi')], 'moi'),
             ('Miệng Núi', 'Săn', [('Quỷ lửa', 'moi'), ('Salamander · boss khu', 'moi')], 'moi'),
             ('Lõi Núi Lửa', 'Thánh địa', [('Hoả thần · boss chúa', 'moi')], 'moi'),
         ]),
    dict(n=7, name='Quần đảo San Hô', lv='60–70', elem='Thuỷ', weak='Phong, Thổ', status='Chưa có map', dragon='Thuỷ Long',
         town=('village', 'Cảng chài San Hô', 'Làng chài và thương thuyền, tin đồn về tàu ma.'),
         maps=[
             ('Cảng chài San Hô', 'Trạm', [], 'moi'),
             ('Bãi Cát Trắng', 'Săn', [('Cua', 'moi')], 'moi'),
             ('Rạn San Hô', 'Săn', [('Sứa', 'moi'), ('Cua chúa · boss khu', 'moi')], 'moi'),
             ('Đảo Cướp Biển', 'Săn', [('Cướp biển', 'moi')], 'moi'),
             ('Đầm Người Cá', 'Săn', [('Người cá', 'moi')], 'moi'),
             ('Bãi Tàu Đắm', 'Săn', [('Bạch tuộc', 'moi'), ('Thuyền trưởng ma · boss khu', 'moi')], 'moi'),
             ('Vực Kraken', 'Thánh địa', [('Kraken · boss chúa', 'moi')], 'moi'),
         ]),
    dict(n=8, name='Rừng Nấm Ngầm', lv='70–80', elem='Thổ', weak='Phong', status='Chưa có map', dragon='Địa Long',
         town=('village', 'Làng người nấm Ánh Tím', 'Tộc người nấm dưới lòng đất, chỉ tin người đã giúp họ.'),
         maps=[
             ('Làng người nấm Ánh Tím', 'Trạm', [], 'moi'),
             ('Rừng Nấm Khổng Lồ', 'Săn', [('Người nấm', 'moi')], 'moi'),
             ('Hang Nhện', 'Săn', [('Nhện hang', 'moi'), ('Nhện chúa · boss khu', 'moi')], 'moi'),
             ('Mạch Tinh Thể', 'Săn', [('Sâu tinh thể', 'moi')], 'moi'),
             ('Hang Bọ Đèn', 'Săn', [('Bọ đèn ngầm', 'moi')], 'moi'),
             ('Điện Nấm', 'Săn', [('Rùa đá rêu', 'moi'), ('Vua người nấm · boss khu', 'moi')], 'moi'),
             ('Lòng Đất Sâu', 'Thánh địa', [('Rồng đất · boss chúa', 'moi')], 'moi'),
         ]),
    dict(n=9, name='Phế tích Aether', lv='80–90', elem='Aether / thép (kháng phép)', weak='Kiếm', status='Chưa có map', dragon='Quang Long',
         town=('castle', 'Toà thành Aether cổ', 'Tàn dư triều đình pháp sư xưa — các phe tranh nhau di sản Aether.'),
         maps=[
             ('Toà thành Aether cổ', 'Trạm (toà thành)', [], 'moi'),
             ('Phố Đổ Nát', 'Săn', [('Hiệp sĩ ma', 'moi')], 'moi'),
             ('Xưởng Máy Cổ', 'Săn', [('Vệ binh máy', 'moi'), ('Cỗ máy canh giữ · boss khu', 'moi')], 'moi'),
             ('Thư Viện Bay', 'Săn', [('Sách bay', 'moi')], 'moi'),
             ('Tháp Pháp Sư', 'Săn', [('Pháp sư mất trí', 'moi')], 'moi'),
             ('Xưởng Rối', 'Săn', [('Rối gỗ ma thuật', 'moi'), ('Hiệp sĩ đầu lâu · boss khu', 'moi')], 'moi'),
             ('Điện Aether', 'Thánh địa', [('Đại pháp sư sa đoạ · boss chúa', 'moi')], 'moi'),
         ]),
    dict(n=10, name='Vực Hư Không', lv='90–100', elem='Bóng tối / hỗn hợp', weak='Aether, Hoả', status='Chưa có map', dragon='Hắc Long',
         town=('castle', 'Thành trì Hư Không', 'Tiền đồn cuối cùng trước Ma vương — liên quân các vùng đóng ở đây.'),
         maps=[
             ('Thành trì Hư Không', 'Trạm (toà thành)', [], 'moi'),
             ('Đảo Trôi Tím', 'Săn', [('Quỷ hư không', 'moi')], 'moi'),
             ('Khe Nứt', 'Săn', [('Mắt bay', 'moi'), ('Hiệp sĩ hư không · boss khu', 'moi')], 'moi'),
             ('Rừng Bóng', 'Săn', [('Bóng người', 'moi')], 'moi'),
             ('Nghĩa Trang Hư Không', 'Săn', [('Ác linh', 'moi')], 'moi'),
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

# ---------------------------------------------------------------- skill nhân vật (chủ dự án 08/10/2026: "vẽ trước đủ skill nhân vật thật chi tiết, đòn vung tay…")
# (id, tên, hệ, kiểu, nhánh, bậc, phái kiếm, 'co' = đã có hình PixelLab / 'tam' = đang mượn hình khác, cần vẽ gì) — lấy từ packages/sim (skills.ts,
# talents.ts) + ghi chú TẠM trong UnityGame/Tools~/data/tempArt.ts (trước ở apps/web/src/game/combat — bản web đã xoá).
SKILLS = [
    ('slash', 'Trảm', 'steel', 'melee', 'sword', 1, None, 'co', ''),
    ('aether_bolt', 'Tia Aether', 'aether', 'projectile', None, None, None, 'co', ''),
    ('fire_bolt', 'Hoả Cầu', 'fire', 'projectile', 'fire', 1, None, 'co', ''),
    ('water_lance', 'Thuỷ Tiễn', 'water', 'projectile', 'water', 1, None, 'co', ''),
    ('wind_blade', 'Phong Nhận', 'wind', 'projectile', 'wind', 1, None, 'co', ''),
    ('heal', 'Suối Lành', 'healing', 'heal', 'water', 3, None, 'co', ''),
    ('ice_shard', 'Băng Tiễn', 'ice', 'projectile', 'ice', 1, None, 'co', ''),
    ('flame_ring', 'Vòng Lửa', 'fire', 'aoe_self', 'fire', 3, None, 'tam', 'icon Vòng Lửa; vòng lửa dùng lại fire_ring phóng ×2 (đạt) — chưa cần VFX riêng'),
    ('fire_blast', 'Bộc Hoả', 'fire', 'aoe_target', 'fire', 5, None, 'tam', 'icon Bộc Hoả + VFX nổ lớn khổ 128 (vẽ cùng đợt meteor)'),
    ('tidal_wave', 'Sóng Dữ', 'water', 'cone', 'water', 5, None, 'tam', 'icon Sóng Dữ + VFX sóng hình nón (chưa xếp lịch)'),
    ('cyclone', 'Lốc Xoáy', 'wind', 'zone', 'wind', 3, None, 'tam', 'icon Lốc Xoáy; VFX `tornado` đang xếp lịch — phễu chồng wind_spin chỉ là tạm'),
    ('gale_dash', 'Lướt Gió', 'wind', 'dash', 'wind', 5, None, 'tam', 'icon Lướt Gió + động tác lướt (3 hướng × 2 giới tính) + vệt gió riêng'),
    ('frost_field', 'Băng Địa', 'ice', 'zone', 'ice', 3, None, 'tam', 'icon Băng Địa + VFX mặt băng phủ đất (chưa xếp lịch)'),
    ('ice_spire', 'Băng Trụ', 'ice', 'pillar', 'ice', 5, None, 'tam', 'icon Băng Trụ; VFX `ice_pillar` đang xếp lịch — cột ghép từ mũi băng chỉ là tạm'),
    ('rock_throw', 'Đá Văng', 'earth', 'projectile', 'earth', 1, None, 'tam', 'icon Đá Văng + đạn đá bay + vỡ đá (≈5 lượt, kế hoạch GĐ1)'),
    ('quake', 'Địa Chấn', 'earth', 'aoe_self', 'earth', 3, None, 'tam', 'icon Địa Chấn + sóng chấn mặt đất + động tác dậm đất'),
    ('stone_spikes', 'Gai Đá', 'earth', 'line', 'earth', 5, None, 'tam', 'icon Gai Đá; VFX `rock_spikes` chờ lượt'),
    ('heavy_strike', 'Nhất Kích', 'steel', 'melee', 'sword', 3, 'kiem_than', 'tam', 'icon Nhất Kích + động tác dồn lực (giơ kiếm qua đầu — đang đứng idle + tia sáng tụ) + vệt chém nặng khổ lớn'),
    ('pierce_rush', 'Đột Kích', 'steel', 'dash', 'sword', 5, 'kiem_than', 'tam', 'icon Đột Kích + động tác lướt tới (đang trượt sprite idle) + vệt chém xuyên riêng'),
    ('calm_stance', 'Thế Tĩnh', 'steel', 'guard', 'sword', 3, 'thuy_than', 'tam', 'icon Thế Tĩnh + động tác giữ thế (đang đứng idle + vòng nước dưới chân, sprite nhuộm xanh nhạt) + hiệu ứng gạt đòn'),
    ('flowing_counter', 'Lưu Thủy Phản', 'steel', 'guard', 'sword', 5, 'thuy_than', 'tam', 'icon Lưu Thủy Phản + động tác đỡ → phản (đang dùng attack sẵn có) + vòng báo cửa sổ đỡ riêng + đạn phản ngược'),
    ('side_slash', 'Lướt Chém', 'steel', 'dash', 'sword', 3, 'bac_than', 'tam', 'icon Lướt Chém + động tác lướt ngang (3 hướng × 2 giới tính; đang trượt sprite + nhấp nháy i-frame)'),
    ('shadow_step', 'Ảnh Bộ', 'steel', 'blink', 'sword', 5, 'bac_than', 'tam', 'icon Ảnh Bộ + động tác ảnh bộ (tan thành bóng → hiện sau lưng; đang dịch tức thời + khói bóng)'),
    ('blaze_slash', 'Liệt Hoả Trảm', 'fire', 'cone', 'sword', 5, None, 'tam', 'icon Liệt Hoả Trảm + VFX nhát chém lửa hình nón'),
    ('water_dragon_slash', 'Thuỷ Long Trảm', 'water', 'line', 'sword', 5, None, 'tam', 'icon Thuỷ Long Trảm + VFX rồng nước chạy theo nhát chém'),
    ('gale_blade_dance', 'Phong Kiếm Cuồng Vũ', 'wind', 'zone', 'sword', 5, None, 'tam', 'icon Phong Kiếm Cuồng Vũ + VFX vòng lưỡi gió xoay quanh người (đang: vòng gió + vệt chém xanh xoay mỗi nhịp) + động tác xoay kiếm'),
    ('frost_cleave', 'Hàn Băng Trảm', 'ice', 'melee', 'sword', 5, None, 'tam', 'icon Hàn Băng Trảm + VFX nhát chém băng'),
    ('earth_rend', 'Địa Liệt Trảm', 'earth', 'line', 'sword', 5, None, 'tam', 'icon Địa Liệt Trảm; gai đá dùng chung `rock_spikes` (chờ lượt) + động tác bổ kiếm xuống đất'),
    ('fire_wall', 'Tường Lửa', 'fire', 'wall', 'fire', 6, None, 'tam', 'icon Tường Lửa + VFX tường lửa (dải lửa đứng lặp, khổ ~128×64) — đang xếp ngọn `flame` ×2 mỗi 26px'),
    ('meteor', 'Thiên Thạch', 'fire', 'aoe_target', 'fire', 8, None, 'tam', 'icon Thiên Thạch; VFX `meteor` chờ lượt (khổ 160) — đang: cầu lửa ×3 rơi + vòng lửa ×3 + nổ ×3'),
    ('call_rain', 'Gọi Mưa', 'water', 'zone', 'water', 6, None, 'tam', 'icon Gọi Mưa; VFX `rain_cloud` đang xếp lịch — đang: mây steam nhuộm xám + giọt (hạt) + bắn nước'),
    ('thunder_rain', 'Lôi Vũ', 'water', 'zone', 'water', 8, None, 'tam', 'icon Lôi Vũ; VFX `lightning_strike` đang xếp lịch — đang: cột sáng nhuộm xanh; mây dùng chung Gọi Mưa'),
    ('gale_fan', 'Phong Bạo', 'wind', 'projectile', 'wind', 6, None, 'tam', 'icon Phong Bạo + lưỡi gió riêng (đang dùng lốc nhỏ wind_spin như Phong Nhận)'),
    ('tornado', 'Vòi Rồng', 'wind', 'zone', 'wind', 8, None, 'tam', 'icon Vòi Rồng; VFX `tornado` đang xếp lịch — Vòi Rồng = bản phóng ×2 của Lốc Xoáy'),
    ('ice_mirror', 'Gương Băng', 'ice', 'ward', 'ice', 6, None, 'tam', 'icon Gương Băng + VFX khiên băng (vòm băng trong suốt quanh người, lặp) + băng vỡ khi phản đạn'),
    ('ice_rain', 'Mưa Băng', 'ice', 'barrage', 'ice', 8, None, 'tam', 'icon Mưa Băng; VFX `ice_rain` chờ lượt — đang: mũi băng ×2 rơi + băng vỡ (bản PixelLab phát ở mỗi mũi thứ 3)'),
    ('stone_wall', 'Tường Đá', 'earth', 'wall', 'earth', 6, None, 'tam', 'icon Tường Đá + VFX tường đá (trồi → đứng → vỡ, khổ ~128×64) — đang: mây steam nhuộm nâu đứng thành khối đá'),
    ('rockslide', 'Lở Đá', 'earth', 'barrage', 'earth', 8, None, 'tam', 'icon Lở Đá + VFX đá tảng rơi vỡ (chưa khai ở pipeline — chưa xếp lịch)'),
    ('sunder_strike', 'Phá Giáp', 'steel', 'melee', 'sword', 6, 'kiem_than', 'tam', 'icon Phá Giáp + VFX giáp vỡ (mảnh giáp văng) + động tác bổ kiếm nặng từ trên xuống'),
    ('blade_wave', 'Lưỡi Sóng', 'steel', 'projectile', 'sword', 8, 'kiem_than', 'tam', 'icon Lưỡi Sóng + VFX luồng kiếm bay (lưỡi liềm ánh bạc kéo vệt, lặp) + động tác vung kiếm phóng khí'),
    ('backflow', 'Dòng Chảy Ngược', 'steel', 'ward', 'sword', 6, 'thuy_than', 'tam', 'icon Dòng Chảy Ngược + động tác gạt kiếm (đang dùng attack sẵn có theo hướng viên đạn) + VFX dòng nước cuốn đạn bay ngược'),
    ('whirlpool', 'Xoáy Nước', 'steel', 'spin', 'sword', 8, 'thuy_than', 'tam', 'icon Xoáy Nước + động tác xoay một vòng (3 hướng × 2 giới tính) + VFX xoáy nước quanh người'),
    ('chain_slash', 'Liên Hoàn', 'steel', 'melee', 'sword', 6, 'bac_than', 'tam', 'icon Liên Hoàn + động tác chuỗi 4 nhát (đang: attack sẵn có một lần + 4 vệt chém luân phiên)'),
    ('flying_sword', 'Phi Kiếm', 'steel', 'projectile', 'sword', 8, 'bac_than', 'tam', 'icon Phi Kiếm + đạn thanh kiếm xoay (8 góc) + động tác phóng / bắt kiếm'),
]

# Hiệu ứng nội tại / phản ứng nguyên tố (chưa có hình riêng).
OTHER_FX = [
    ('earth_hit', 'VFX vỡ đá khi trúng'),
    ('whirlpool_surge', 'VFX xoáy nước lớn (bản mạnh sau khi đỡ đòn)'),
    ('press_max', 'VFX khí thế bừng lên quanh người (vàng)'),
    ('rage_aura', 'VFX hào quang đỏ bám người khi máu thấp'),
    ('riposte', 'VFX nhát phản chí mạng + động tác phản kiếm sau cú né'),
    ('lake_heal', 'VFX mặt hồ lặng sóng quanh chân (hồi máu)'),
    ('momentum', 'VFX vệt gió bạc bám kiếm'),
    ('blur_evade', 'VFX bóng mờ tách khỏi người khi né (tàn ảnh) + icon chỉ số "Né hoàn toàn" ở bảng Nhân vật (đang mượn frame shadow_5 — `SkillIcon.ICON_FRAME.evade`)'),
    ('ember_burst', 'VFX xác quái nổ tung lửa tro'),
    ('shatter_burst', 'VFX khối băng vỡ văng mảnh'),
    ('spring_heal', 'VFX hồi máu kiểu giọt nước xanh lá'),
    ('mountain_heal', 'VFX hào quang đá (nâu vàng) quanh chân'),
    ('eye_haste', 'VFX vệt gió bám chân'),
    ('react_mud', 'VFX bùn bắn + vũng bùn'),
    ('react_lava', 'VFX dung nham'),
    ('react_sandstorm', 'VFX lốc cát'),
    ('react_shatter', 'VFX băng vỡ vụn'),
]

# 8 tuyệt kỹ mốc 10 (docs/ke-hoach-nguyen-to.md) — chưa có trong game; mở bằng Long Châu.
ULTS = [
    ('Phán Quyết', 'Kiếm Thần', 'ngàn thanh kiếm ánh sáng cắm xuống cả vùng', 30),
    ('Thiên Tĩnh', 'Thủy Thần', '5 giây bất động như mặt hồ, mọi đòn đánh vào bị phản lại', 30),
    ('Ngàn Bóng', 'Bắc Thần', '3 bóng phân thân cùng lao vào chém 6 giây (bóng = nhân vật nhuộm tối bằng code)', 30),
    ('Phượng Hoàng', 'Hoả', 'phượng lửa bay xuyên màn hình (sprite phượng bay + vệt lửa)', 30),
    ('Đại Hồng Thuỷ', 'Thuỷ', 'sóng thần quét ngang màn hình', 30),
    ('Thiên Phong', 'Phong', 'bão quanh mình 6 giây, hút và chém quái', 30),
    ('Kỷ Băng Hà', 'Băng', 'sóng băng đóng băng cả vùng', 30),
    ('Sơn Thần', 'Thổ', 'người khổng lồ đá chiến đấu cùng 10 giây (cần nhân vật triệu hồi riêng: đi, đánh, trồi lên, vỡ)', 60),
]

# Động tác nhân vật người chơi (đang có: idle, walk 8 hướng; attack, cast 4 hướng — mỗi đòn chỉ một nhát).
# Mỗi động tác: 3 hướng (xuống, lên, ngang — hướng còn lại lật gương) × 2 giới tính.
ACTION_COST = 30
ACTIONS = [
    ('combo', 'Đòn kiếm thường: vung ngang → vung ngược → đâm tới (thay nhát "attack" duy nhất hiện có)', 3),
    ('throw', 'Vung tay phóng phép (một tay đẩy ra, đạn bay thẳng)', 1),
    ('staff', 'Giơ trượng niệm (vòng phép dưới chân)', 1),
    ('push', 'Hai tay đẩy về trước (sóng, nón, tường)', 1),
    ('sky', 'Chỉ tay lên trời gọi (mưa, sét, thiên thạch, mưa băng, lở đá)', 1),
    ('ground', 'Dậm chân / áp tay xuống đất', 1),
    ('charge', 'Dồn lực: giơ kiếm qua đầu, tụ sáng', 1),
    ('smash', 'Bổ kiếm từ trên xuống đất', 1),
    ('lunge', 'Lướt tới đâm xuyên', 1),
    ('sidestep', 'Lướt ngang (né, nhấp nháy bất tử ngắn)', 1),
    ('stance', 'Giữ thế: kiếm ngang trước ngực (lặp)', 1),
    ('parry', 'Đỡ → phản: gạt kiếm rồi chém trả', 1),
    ('spin', 'Xoay một vòng chém quanh người', 1),
    ('chain4', 'Chuỗi 4 nhát nhanh', 1),
    ('wave', 'Vung kiếm phóng khí (nhát chém dài bắn ra)', 1),
    ('fling', 'Phóng kiếm + bắt kiếm quay về', 1),
    ('vanish', 'Ảnh bộ: tan thành bóng → hiện sau lưng', 1),
    ('ult', 'Tuyệt kỹ: lơ lửng, hai tay giơ cao niệm', 1),
    ('hurt', 'Trúng đòn giật lùi · gục · đứng dậy hồi sinh', 3),
    ('potion', 'Uống bình', 1),
]
SKILL_ACTION = {
    'slash': 'combo', 'frost_cleave': 'combo', 'aether_bolt': 'throw', 'fire_bolt': 'throw', 'water_lance': 'throw', 'wind_blade': 'throw',
    'ice_shard': 'throw', 'rock_throw': 'throw', 'gale_fan': 'throw', 'heal': 'staff', 'flame_ring': 'staff', 'cyclone': 'staff',
    'frost_field': 'staff', 'ice_mirror': 'staff', 'tornado': 'staff', 'fire_blast': 'push', 'tidal_wave': 'push', 'fire_wall': 'push',
    'meteor': 'sky', 'call_rain': 'sky', 'thunder_rain': 'sky', 'ice_rain': 'sky', 'rockslide': 'sky', 'ice_spire': 'sky',
    'quake': 'ground', 'stone_spikes': 'ground', 'stone_wall': 'ground', 'heavy_strike': 'charge', 'sunder_strike': 'smash',
    'earth_rend': 'smash', 'pierce_rush': 'lunge', 'side_slash': 'sidestep', 'gale_dash': 'sidestep', 'calm_stance': 'stance',
    'flowing_counter': 'parry', 'backflow': 'parry', 'whirlpool': 'spin', 'gale_blade_dance': 'spin', 'chain_slash': 'chain4',
    'blade_wave': 'wave', 'blaze_slash': 'wave', 'water_dragon_slash': 'wave', 'flying_sword': 'fling', 'shadow_step': 'vanish',
}
# Lượt VFX theo kiểu skill (gồm lượt vẽ lại): đạn = bay 8 góc + nổ khi trúng; vùng / mưa = mở → lặp → tan.
VFX_COST = dict(melee=8, projectile=12, heal=8, aoe_self=12, aoe_target=14, cone=12, zone=14, dash=8, pillar=12, line=12, guard=10,
                blink=8, wall=12, ward=12, barrage=14, spin=10)
VFX_SHARED = {'tornado': 4, 'earth_rend': 6}  # dùng chung VFX của Lốc Xoáy / Gai Đá, chỉ thêm biến thể
ICON_COST = 2
FX_COST = 6
ELEM_VI = dict(steel='Kiếm', aether='Aether', fire='Hoả', water='Thuỷ', wind='Phong', ice='Băng', earth='Thổ', healing='Hồi máu')
KIND_VI = dict(melee='cận chiến', projectile='đạn', heal='hồi máu', aoe_self='nổ quanh mình', aoe_target='nổ chỗ chọn', cone='hình nón',
               zone='vùng', dash='lướt', pillar='cột', line='đường thẳng', guard='giữ thế', blink='dịch chuyển', wall='tường', ward='khiên',
               barrage='mưa đạn', spin='xoay')
STYLE_VI = dict(kiem_than='Kiếm Thần', thuy_than='Thủy Thần', bac_than='Bắc Thần')
BRANCH_VI = dict(sword='Kiếm', fire='Hoả', water='Thuỷ', wind='Phong', ice='Băng', earth='Thổ')
FX_REACT = ('react_mud', 'react_lava', 'react_sandstorm', 'react_shatter')


def skill_cost(sk):
    sid, _, _, kind, _, _, _, st, _ = sk
    if st == 'co':
        return 0
    return ICON_COST + VFX_SHARED.get(sid, VFX_COST[kind])


# ---------------------------------------------------------------- 3 mốc vẽ (chủ dự án 08/10/2026: "chia giai đoạn thành 3 mốc, ưu tiên vẽ trước đủ skill
# nhân vật thật chi tiết… 1/3 số quái, 1/3 map, 1/3 boss")
MOC_OF = {1: 1, 2: 1, 3: 1, 4: 1, 5: 2, 6: 2, 7: 2, 8: 3, 9: 3, 10: 3}
MOC_NAME = {1: 'Skill nhân vật chi tiết + vùng 1–4', 2: 'Vùng 5–7 + 3 rồng', 3: 'Vùng 8–10 + 3 rồng + nhân vật / trang bị'}
COST = dict(props=40, hang=15, ui=60, mob=15, boss=40, chief_skill=30, zone_skill=10, dragon=220)
RESERVE = 0.1  # để dành ~10 % lượt của gói cho vẽ lại

# Sau 3 mốc VẪN CÒN THIẾU (chưa tính vào mốc nào) — chủ dự án 08/10/2026: "xem thống kê luôn mốc 3 sẽ còn thiếu những gì".
# (nhóm, hạng mục, lượt ước, cách chống đỡ trước khi có hình, ưu tiên: 'can' = cần để vùng chơi được / 'nen' = nên có / 'them' = làm thêm)
MISSING = [
    ('NPC', 'NPC trạm 9 vùng mới: người bán, người giao nhiệm vụ, người ghi sử, giữ cột dịch chuyển — 4 NPC × 9 vùng × ~14 lượt (sprite 4 hướng + chân dung hội thoại)', 500,
     'TẠM: NPC vùng 1 (Bram, Elin, Garrick, Mirelle, Aldric) đổi màu / đổi đồ gắn', 'can'),
    ('NPC', 'NPC chính trị ở 4 toà thành (vua / tộc trưởng, quan, lính gác) — 3 NPC × 4 thành × ~14 lượt', 170, 'TẠM: lính / quan từ NPC vùng 1 đổi màu', 'can'),
    ('NPC', 'Thợ rèn / thợ may / thợ cắt tóc ở vùng lớn (3 vùng × 3 NPC)', 130, 'dùng chung người bán', 'nen'),
    ('Rồng', '7 Long Huyệt (map phụ của rồng): đồ vật + nền riêng × ~20 lượt', 140, 'TẠM: dựng từ đồ vật của vùng chứa nó', 'can'),
    ('Rồng', 'Thần Long (sprite rất lớn + cảnh triệu hồi khi đủ 7 Long Châu)', 150, 'chưa làm tính năng', 'nen'),
    ('Rồng', 'Điều ước Thần Long: rồng con thú cưng (~40), thú cưỡi rồng có người ngồi (~200), skin Long Kỵ Sĩ × 2 giới tính (~190)', 430,
     'chưa làm tính năng', 'them'),
    ('Nhân vật', 'Kiểu tóc bản bé 4–8 tuổi (A1 cần cả hai mốc tuổi): 2 kiểu × 2 giới tính', 200, 'bé chỉ có kiểu gốc + đổi màu tóc (0 lượt)', 'nen'),
    ('Nhân vật', 'Thêm 4 kiểu hình trang bị (giáp hiếm, set đồ rơi từ boss / rồng) — 4 kiểu đầu dùng chung cả 100 cấp là ít', 760,
     'đồ khác cấp dùng chung kiểu hình, độ hiếm nhuộm màu', 'nen'),
    ('Nhân vật', 'Skin mỹ phẩm bán bằng kim cương (K3): mỗi skin × 2 giới tính ~95 — đề xuất 3 skin đầu', 290, 'chưa mở bán', 'them'),
    ('Giao diện', 'Icon kho đồ: mỗi kiểu trang bị 1 icon (4 kiểu × 4 lớp + 24 đồ gắn + nhẫn / dây chuyền) + icon nguyên liệu rơi từ quái mới', 90,
     'TẠM: icon E1 có sẵn đổi màu', 'can'),
    ('Giao diện', 'Sách Thư viện (9-slice), icon Bạn bè / Cài đặt, bảng xếp hạng, khung chọn nhân vật', 40, 'khung gỗ / giấy sẵn có', 'nen'),
    ('Thư viện', 'Chân dung quái / boss cho Thư viện (sách quái vật): 46 quái + 37 boss / rồng × ~2 lượt', 170, 'TẠM: phóng sprite đứng của quái', 'nen'),
    ('Cốt truyện', 'Đồ vật nhiệm vụ + cảnh cắt cảnh của cốt truyện vùng 2–10 (chưa viết) — ước ~30 / vùng', 270, 'viết cốt truyện xong mới biết', 'nen'),
]
# Ngoài PixelLab: âm thanh, nhạc nền từng vùng, chữ / lời thoại cốt truyện vùng 2–10, cân chỉ số quái / boss mới.
OUTSIDE = ['Âm thanh + nhạc nền từng vùng (PixelLab không làm)', 'Cốt truyện + lời thoại + nhiệm vụ vùng 2–10 (viết tay)',
           'Chỉ số, AI, chiêu của 46 quái + 28 boss + 7 rồng trong code (cân bằng sau khi có hình)']

# Nhân vật + trang bị (mốc 3): trang bị lớp thân phải phủ MỌI khung động tác — thêm động tác ở mốc 1 thì lớp đồ cũng nhiều khung hơn.
GEAR_LINES = [
    ('Trang bị lớp thân: 4 kiểu hình × 2 giới tính × ~95 lượt (một bộ đồ → cắt 4 lớp áo / quần / giày / găng; phủ cả các động tác mới ở Mốc 1)', 760),
    ('Trang bị gắn: 24 kiểu (kiếm, trượng, khiên, mũ, áo choàng) × ~2 lượt', 50),
    ('Kiểu tóc: 2 kiểu mới × 2 giới tính (bản 16 tuổi) + phủ động tác mới', 240),
]

QUESTIONS = [
    'Mốc 1 = skill nhân vật chi tiết (23 động tác, 37 skill vẽ lại hình riêng, 8 tuyệt kỹ, 17 hiệu ứng phụ) + vùng 1–4. Danh sách động tác ở mục Skill nhân vật — thêm / bớt động tác nào?',
    'Mốc 1 dùng ~{m1} lượt → gói 24$ còn dư. Đề xuất: còn lượt thì vẽ luôn Mốc 2 trong cùng gói (lượt không dùng hết trong tháng thì mất); Mốc 3 sang gói sau.',
    'Tên 10 vùng, nơi ở (làng / toà thành) và tên map — tên vùng 2–10 là đề xuất. Bản phác thảo từng map ở mỗi vùng chỉ là bố cục (đường, bầy quái, hang ổ boss, lối ra) để duyệt.',
    'Danh sách 46 loại quái thường (mỗi loại vẽ riêng, không dùng bản đổi màu). Đổi so với kế hoạch cũ cho khỏi trùng dáng: vùng 8 "dơi" → Bọ đèn ngầm, "golem đá" → Rùa đá rêu; vùng 9 "gargoyle cổ" → Rối gỗ ma thuật; vùng 1 thêm Dơi hang (Hang Gargoyle).',
    'Chiêu: boss chúa 2 chiêu, boss khu 1 chiêu, rồng 3 chiêu (chủ dự án chốt 08/10/2026). Tên boss + chiêu chính của rồng (mục Rồng).',
    'Trang bị hiện trên người + tóc làm ở Mốc 3, SAU khi động tác đã chốt (lớp đồ phải phủ mọi khung động tác). 4 kiểu hình bộ đồ cắt 4 lớp áo / quần / giày / găng, đồ gắn 24 kiểu; dây chuyền / nhẫn chỉ hiện ở kho đồ.',
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
    if status == 've':
        return '<span class="pill tint">Đã vẽ · chờ lên game</span>'
    if status.startswith('mau:'):
        return f'<span class="pill tint">Đổi màu từ {esc(status[4:])}</span>'
    return ''


# Vùng 1 đã có map thật: map nào đã lên game (có minimap trong assets/maps) thì dùng minimap, chưa thì phác thảo. Sơ đồ nối theo
# thiết kế 12 map (docs/thiet-ke/vung1-12-map.md mục Đồ thị lối): 12 nút, 14 cạnh, cửa sang vùng 2 ở Hẻm Cửa Sông.
R1_FILES = {'Thistlewood': 'town', 'Rừng Mossvale': 'mossvale', 'Nghĩa địa Hoàng Hôn': 'graveyard', 'Đồi Xương Trắng': 'bonehills',
            'Vách Gargoyle': 'cliffs', 'Đá Phong Ấn': 'shrine', 'Hang Gargoyle': 'gargoyle_cave', 'Bãi Bồi Brightwater': 'riverflats',
            'Vết Rạn Mossvale': 'mossrift', 'Mộ Vô Danh': 'nameless', 'Luỹ Hiệp Sĩ Cũ': 'oldfort', 'Hẻm Cửa Sông': 'rivergate'}
# Chỉ số theo thứ tự maps của vùng 1: 0 town · 1 mossvale · 2 graveyard · 3 bonehills · 4 cliffs · 5 Hang · 6 shrine · 7 Bãi Bồi ·
# 8 Vết Rạn · 9 Mộ Vô Danh · 10 Luỹ · 11 Hẻm Cửa Sông.
R1_POS = {5: (140, 28), 4: (210, 83), 9: (70, 138), 2: (210, 138), 3: (350, 138), 10: (490, 138), 0: (210, 193), 1: (350, 193),
          7: (210, 248), 8: (350, 248), 6: (490, 248), 11: (210, 303)}
R1_EDGES = [(0, 2), (0, 1), (1, 6), (2, 4), (2, 3), (0, 7), (7, 8), (1, 8), (7, 11), (2, 9), (3, 10), (4, 5), (5, 9), (1, 10)]
R1_EXIT = 11
os.makedirs(SKETCH_DIR, exist_ok=True)


def region_layout(r):
    """(vị trí nút, cạnh, map có lối sang vùng sau, cao sơ đồ)."""
    return (R1_POS, R1_EDGES, R1_EXIT, 375) if r['n'] == 1 else (sketch.STD_POS, sketch.STD_EDGES, 6, 260)


def region_neighbors(r):
    i = r['n'] - 1
    prev_r = REGIONS[i - 1]['name'] if i > 0 else None
    next_r = REGIONS[i + 1]['name'] if i + 1 < len(REGIONS) else None
    return prev_r, next_r


def region_sketches(r):
    """[(tên map, vai trò, svg-hoặc-None, file minimap-hoặc-None)] + SVG sơ đồ vùng; ghi kèm file SVG cho bản Markdown."""
    pos, edges, exit_node, height = region_layout(r)
    prev_r, next_r = region_neighbors(r)
    graph = sketch.region_graph(r['n'], r['maps'], edges, pos, prev_r, next_r, exit_node, height)
    open(os.path.join(SKETCH_DIR, f'vung-{r["n"]}.svg'), 'w', encoding='utf8', newline='').write(graph)
    out = []
    for i, (name, role, mobs, _st) in enumerate(r['maps']):
        real = R1_FILES.get(name) if r['n'] == 1 else None
        # Map đã dựng nhưng chưa lên game (chưa có minimap trong assets/maps) thì vẫn vẽ phác thảo.
        if real and os.path.exists(os.path.join(MINIMAPS, f'{real}.minimap.png')):
            out.append((name, role, None, real))
            continue
        svg = sketch.map_sketch(r['n'], name, role, mobs, sketch.exits_for(i, edges, pos, r['maps'], prev_r, next_r, exit_node))
        open(os.path.join(SKETCH_DIR, f'vung-{r["n"]}-map-{i + 1}.svg'), 'w', encoding='utf8', newline='').write(svg)
        out.append((name, role, svg, None))
    return graph, out


def minimap_uri(key):
    data = open(os.path.join(MINIMAPS, f'{key}.minimap.png'), 'rb').read()
    return 'data:image/png;base64,' + base64.b64encode(data).decode('ascii')


SKETCHES = {r['n']: region_sketches(r) for r in REGIONS}


def mobs_of(r, name):
    return next(ms for n, _, ms, _ in r['maps'] if n == name)


def sketch_html(r):
    graph, maps = SKETCHES[r['n']]
    figs = []
    for name, role, svg, real in maps:
        art = f'<img src="{minimap_uri(real)}" alt="Minimap {esc(name)}">' if real else svg
        tag = '<span class="pill have">map thật</span>' if real else '<span class="pill plan">phác thảo</span>'
        mob = next((m for m, _ in mobs_of(r, name) if 'boss' not in m), None)
        herd = f'<span class="muted">bầy {esc(mob)} · 5 khu</span>' if mob else ''
        figs.append(f'<figure class="sk"><div class="sk-art">{art}</div><figcaption><b>{esc(name)}</b> · {esc(role)} {tag} {herd}</figcaption></figure>')
    return f'''<details class="sketch" open>
    <summary>Phác thảo {len(maps)} map + sơ đồ nối</summary>
    <div class="graph">{graph}</div>
    <div class="sk-grid">{"".join(figs)}</div>
  </details>'''


def region_html(r):
    kind = 'Toà thành' if r['town'][0] == 'castle' else 'Làng'
    rows = []
    for name, role, mobs, mapstatus in r['maps']:
        if mobs:
            mob_cells = '<ul class="mobs">' + ''.join(f'<li><span class="mob{" boss" if "boss" in m else ""}">{esc(m)}</span>{pill(st)}</li>' for m, st in mobs) + '</ul>'
        else:
            mob_cells = '<span class="muted">Không có quái · NPC dịch vụ</span>'
        map_pill = {
            'co': '<span class="pill have">Đã có map</span>',
            'dung': '<span class="pill skill">Đã dựng · chờ lên game</span>',
            'dot2': '<span class="pill tint">Có map (gần trống) · hình ĐỢT 2 chờ lên game</span>',
        }.get(mapstatus, '<span class="pill plan">Chưa có map</span>')
        rows.append(f'<tr><td><b>{esc(name)}</b><div class="role">{esc(role)}</div></td><td>{mob_cells}</td><td>{map_pill}</td></tr>')
    dragon = f'<p class="dragon-note">Thêm: <b>{esc(r["dragon"])}</b> ở Long Huyệt (map phụ của vùng) — xem mục Rồng.</p>' if r.get('dragon') else ''
    return f'''
<section class="region" id="vung-{r["n"]}">
  <header class="region-head">
    <span class="region-no">Vùng {r["n"]} <span class="pill moc{MOC_OF[r["n"]]}">Mốc {MOC_OF[r["n"]]}</span></span>
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
  {sketch_html(r)}
</section>'''


def count():
    new_mob = tint_mob = boss_new = 0
    for r in REGIONS:
        for _, _, mobs, _ in r['maps']:
            for m, st in mobs:
                is_boss = 'boss' in m
                if st in ('moi', 've'):
                    if is_boss:
                        boss_new += 1
                    else:
                        new_mob += 1
                elif st.startswith('mau:'):
                    tint_mob += 1
    return new_mob, tint_mob, boss_new


new_mob, tint_mob, boss_new = count()


def region_counts(r):
    mobs = bosses = chiefs = zones = 0
    for _, role, ms, _ in r['maps']:
        for m, st in ms:
            if 'boss' in m:
                bosses += st in ('moi', 've')
                if 'boss chúa' in m:
                    chiefs += 1
                else:
                    zones += 1
            elif st in ('moi', 've'):
                mobs += 1
    return mobs, bosses, chiefs, zones


def moc_budget(k):
    rs = [r for r in REGIONS if MOC_OF[r['n']] == k]
    span = f"vùng {rs[0]['n']}–{rs[-1]['n']}"
    mobs = bosses = chiefs = zones = 0
    for r in rs:
        a, b, c, z = region_counts(r)
        mobs, bosses, chiefs, zones = mobs + a, bosses + b, chiefs + c, zones + z
    new_regions = [r for r in rs if r['n'] != 1]
    dragons = [dg for dg in DRAGONS if MOC_OF[dg[2]] == k]
    groups = []
    if k == 1:
        temp = [sk for sk in SKILLS if sk[7] == 'tam']
        n_act = sum(n for _, _, n in ACTIONS)
        groups.append(('Skill nhân vật (chi tiết)', [
            (f'{n_act} động tác nhân vật × ~{ACTION_COST} lượt (3 hướng + lật gương × 2 giới tính; gồm vẽ lại) — chuỗi đòn kiếm, vung tay phóng phép, lướt, đỡ, xoay…', n_act * ACTION_COST),
            (f'Icon skill: {len(temp)} skill đang mượn icon + {len(ULTS)} tuyệt kỹ × ~{ICON_COST} lượt', (len(temp) + len(ULTS)) * ICON_COST),
            (f'Hiệu ứng riêng của {len(temp)} skill đang tạm (đạn bay 8 góc + nổ khi trúng; vùng / mưa: mở → lặp → tan)', sum(skill_cost(sk) - ICON_COST for sk in temp)),
            (f'{len(ULTS)} tuyệt kỹ mốc 10 — hiệu ứng khổ lớn nhiều pha (Sơn Thần kèm người khổng lồ đá)', sum(v for *_, v in ULTS)),
            (f'{len(OTHER_FX)} hiệu ứng nội tại + phản ứng nguyên tố × ~{FX_COST} lượt', len(OTHER_FX) * FX_COST),
        ]))
    props = len(new_regions) * COST['props'] + (COST['hang'] + COST['ui'] if k == 1 else 0)
    extra = ' + Hang Gargoyle (vùng 1) + giao diện (gian hàng, tranh lục địa, icon kim cương / lịch / 6 bình)' if k == 1 else ''
    groups.append((f'Map — {span}', [(f'Đồ vật / nhà / cây / trạm {len(new_regions)} vùng mới × ~{COST["props"]} lượt{extra}', props)]))
    groups.append((f'Quái thường — {span}', [(f'{mobs} loại vẽ mới × ~{COST["mob"]} lượt (mỗi loại một hình riêng)', mobs * COST['mob'])]))
    groups.append((f'Boss — {span}', [
        (f'{bosses} boss vẽ mới × ~{COST["boss"]} lượt (4 hướng + lật gương; đi, đánh, niệm, gục)', bosses * COST['boss']),
        (f'Boss chúa: {chiefs} boss × 2 chiêu × ~{COST["chief_skill"]} lượt', chiefs * 2 * COST['chief_skill']),
        (f'Boss khu: {zones} boss × 1 chiêu × ~{COST["zone_skill"]} lượt', zones * COST['zone_skill']),
    ]))
    if dragons:
        groups.append(('Rồng', [(f'{", ".join(dg[0] for dg in dragons)} × ~{COST["dragon"]} lượt (sprite lớn 192–256px, động tác + 3 chiêu)', len(dragons) * COST['dragon'])]))
    if k == 3:
        groups.append(('Nhân vật + trang bị hiện trên người', GEAR_LINES))
    return groups


MOCS = {k: moc_budget(k) for k in (1, 2, 3)}
MOC_TOTAL = {k: sum(v for _, items in g for _, v in items) for k, g in MOCS.items()}
total_budget = MOC_TOTAL[1]
pack1 = MOC_TOTAL[1] + MOC_TOTAL[2]
QUESTIONS = [q.replace('{m1}', f'{MOC_TOTAL[1]:,}'.replace(',', '.')) for q in QUESTIONS]

def dotnum(n):
    return f'{n:,}'.replace(',', '.')


SKILL_NAME = {sk[0]: sk[1] for sk in SKILLS}
ACTION_EXTRA = {'sidestep': ['né của Bắc Thần'], 'parry': ['phản đòn nội tại'], 'vanish': ['Ngàn Bóng'], 'ult': ['8 tuyệt kỹ mốc 10'],
                'hurt': ['mọi lúc bị đánh / chết / hồi sinh'], 'potion': ['bình máu, EXP, chiến đấu']}


def action_users(key):
    return [SKILL_NAME[sid] for sid, a in SKILL_ACTION.items() if a == key] + ACTION_EXTRA.get(key, [])


ACTION_NAME = {k: name for k, name, _ in ACTIONS}
N_ACTIONS = sum(n for _, _, n in ACTIONS)
SKILL_GROUPS = [
    ('Cơ bản', lambda sk: sk[4] is None),
    ('Kiếm — đòn gốc + hợp phủ nguyên tố', lambda sk: sk[4] == 'sword' and sk[6] is None),
    ('Kiếm — Kiếm Thần (tấn công)', lambda sk: sk[6] == 'kiem_than'),
    ('Kiếm — Thủy Thần (giữ thế, phản đòn)', lambda sk: sk[6] == 'thuy_than'),
    ('Kiếm — Bắc Thần (nhanh, lướt)', lambda sk: sk[6] == 'bac_than'),
] + [(f'Phép {BRANCH_VI[b]}', (lambda b: lambda sk: sk[4] == b and sk[6] is None)(b)) for b in ('fire', 'water', 'wind', 'ice', 'earth')]


def skill_todo(sk):
    sid, _, _, _, _, _, _, st, todo = sk
    if st == 'co':
        return 'Đã có hình PixelLab — chỉ cần động tác mới'
    return todo


skill_rows_html = ''
for title, test in SKILL_GROUPS:
    items = sorted((sk for sk in SKILLS if test(sk)), key=lambda sk: sk[5] or 0)
    skill_rows_html += f'<tr class="grp"><th colspan="5">{esc(title)}</th></tr>'
    for sk in items:
        sid, name, el, kind, _br, tier, _sty, st, _ = sk
        art = '<span class="pill have">Có hình</span>' if st == 'co' else '<span class="pill new">Đang tạm</span>'
        tier_txt = f' · bậc {tier}' if tier else ''
        act = ACTION_NAME.get(SKILL_ACTION.get(sid, ''), '—')
        skill_rows_html += (f'<tr><td><b>{esc(name)}</b><div class="role">{esc(ELEM_VI[el])} · {esc(KIND_VI[kind])}{tier_txt}</div>{art}</td>'
                            f'<td>{esc(act)}</td><td>{esc(skill_todo(sk))}</td><td class="num">{skill_cost(sk) or "—"}</td></tr>')
skill_rows_html = skill_rows_html.replace('colspan="5"', 'colspan="4"')
action_rows_html = ''.join(
    f'<tr><td><b>{esc(name)}</b></td><td>{esc(", ".join(action_users(k)))}</td><td class="num">{n}</td><td class="num">{n * ACTION_COST}</td></tr>'
    for k, name, n in ACTIONS)
ult_rows_html = ''.join(f'<tr><td><b>{esc(n)}</b><div class="role">{esc(b)}</div></td><td>{esc(t)}</td><td class="num">{v}</td></tr>' for n, b, t, v in ULTS)
fx_rows_html = ''.join(
    f'<tr><td>{esc(t)}</td><td>{"phản ứng nguyên tố" if i in FX_REACT else "nội tại"}</td><td class="num">{FX_COST}</td></tr>' for i, t in OTHER_FX)
skill_total = sum(v for _, v in MOCS[1][0][1])
n_temp = sum(1 for sk in SKILLS if sk[7] == 'tam')

moc_cards_html = ''.join(
    f'''<div class="month"><div class="month-head"><b>Mốc {k}</b><span>{esc(MOC_NAME[k])}</span></div>'''
    f'''<ul>{"".join(f"<li>{esc(g)} — {dotnum(sum(v for _, v in items))}</li>" for g, items in MOCS[k])}</ul>'''
    f'''<div class="month-total">≈ {dotnum(MOC_TOTAL[k])} lượt · {"gói 24$ thứ nhất" if k < 3 else "gói 24$ thứ hai"}</div></div>'''
    for k in (1, 2, 3))
moc_table_html = ''.join(
    f'<tr class="moc"><th colspan="2">Mốc {k} — {esc(MOC_NAME[k])}</th><th class="num">{dotnum(MOC_TOTAL[k])}</th></tr>'
    + ''.join(
        f'<tr class="grp"><th colspan="2">{esc(g)}</th><th class="num">{dotnum(sum(v for _, v in items))}</th></tr>'
        + ''.join(f'<tr><td colspan="2">{esc(t)}</td><td class="num">{dotnum(v)}</td></tr>' for t, v in items)
        for g, items in MOCS[k])
    for k in (1, 2, 3))
PRIO_VI = {'can': 'cần để vùng chơi được', 'nen': 'nên có', 'them': 'làm thêm'}
PRIO_PILL = {'can': 'new', 'nen': 'skill', 'them': 'plan'}
missing_total = sum(m[2] for m in MISSING)
missing_need = sum(m[2] for m in MISSING if m[4] == 'can')
missing_rows_html = ''.join(
    f'<tr><td><div class="role"><b>{esc(g)}</b></div>{esc(t)} <span class="pill {PRIO_PILL[pr]}">{PRIO_VI[pr]}</span>'
    f'<div class="role">Trước khi có hình: {esc(tmp)}</div></td><td class="num">{dotnum(v)}</td></tr>'
    for g, t, v, tmp, pr in MISSING)
outside_html = ''.join(f'<li>{esc(x)}</li>' for x in OUTSIDE)
spare1 = 5000 - MOC_TOTAL[1]
spare_pack1 = 5000 - pack1
spare_pack2 = 5000 - MOC_TOTAL[3]
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
.pill.moc1 {{ background: var(--new-bg); color: var(--berry); }}
.pill.moc2 {{ background: var(--tint-bg); color: var(--sky); }}
.pill.moc3 {{ background: var(--plan-bg); color: var(--ink-soft); }}
.region-no .pill {{ letter-spacing: 0; text-transform: none; margin-left: 4px; }}
tr.moc th {{ font-family: var(--display); font-size: 19px; color: var(--paper-hi); background: var(--wood); text-transform: none; letter-spacing: 0; }}
:root[data-theme="dark"] tr.moc th {{ color: var(--paper); }}
@media (prefers-color-scheme: dark) {{ :root:not([data-theme="light"]) tr.moc th {{ color: var(--paper); }} }}
table.skills td:nth-child(3) {{ min-width: 260px; }}
details.sketch {{ background: var(--paper-hi); border: 1px solid var(--line); border-radius: 10px; padding: 10px 12px; }}
details.sketch summary {{ cursor: pointer; font-weight: 800; color: var(--ink-soft); }}
.graph {{ margin-top: 10px; overflow-x: auto; }}
.graph svg {{ width: 100%; min-width: 520px; height: auto; display: block; }}
.sk-grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; margin-top: 12px; }}
figure.sk {{ margin: 0; display: flex; flex-direction: column; gap: 4px; min-width: 0; }}
.sk-art {{ aspect-ratio: 320 / 220; border-radius: 10px; overflow: hidden; border: 2px solid var(--line); background: var(--paper-sunk); display: grid; place-items: center; }}
.sk-art svg {{ width: 100%; height: 100%; display: block; }}
.sk-art img {{ width: 100%; height: 100%; object-fit: contain; image-rendering: pixelated; }}
figure.sk figcaption {{ font-size: 13px; display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }}
</style>

<div class="wrap">
  <nav class="toc" aria-label="Mục lục">
    <span class="label">Trang này</span>
    <a href="#tom-tat">Tóm tắt</a>
    <a href="#skill">Skill nhân vật (Mốc 1)</a>
    <a href="#ngan-sach">3 mốc vẽ · còn dư?</a>
    <a href="#thieu">Sau Mốc 3 còn thiếu gì</a>
    <a href="#trang-bi">Trang bị hiện trên người</a>
    <span class="label">10 vùng</span>
    {toc}
    <span class="label">Thêm</span>
    <a href="#rong">7 rồng nguyên tố</a>
    <a href="#can-chot">Cần chốt</a>
  </nav>
  <main>
    <section id="tom-tat">
      <h1>Thế giới Aether</h1>
      <p class="lead">Danh sách vùng, map (kèm phác thảo), quái, boss, rồng, skill nhân vật và trang bị cần vẽ — chia <b>3 mốc</b>: Mốc 1 vẽ trước đủ skill nhân vật thật chi tiết + 1/3 thế giới (vùng 1–4). Soạn 08/10/2026. Bản Markdown cùng nội dung + phần bàn giao cho agent: <code>docs/the-gioi-aether.md</code>.</p>
      <span class="status-line">Đã chốt 08/10/2026 — chờ mua gói PixelLab 24$</span>
      <div class="stats">
        <div class="stat"><b>10</b><span>vùng · mỗi vùng 1 trạm (làng / toà thành) + 5 map săn + 1 thánh địa</span></div>
        <div class="stat"><b>70</b><span>map (đã có 6 ở vùng 1)</span></div>
        <div class="stat"><b>{new_mob}</b><span>loại quái thường vẽ mới, mỗi loại một hình riêng (+4 loại có sẵn ở vùng 1)</span></div>
        <div class="stat"><b>30 + 7</b><span>boss vùng (vẽ mới {boss_new}) + rồng nguyên tố</span></div>
        <div class="stat"><b>{N_ACTIONS} + {n_temp + len(ULTS)}</b><span>động tác nhân vật mới + skill / tuyệt kỹ vẽ hình riêng (Mốc 1)</span></div>
        <div class="stat"><b>~{dotnum(MOC_TOTAL[1])}</b><span>lượt Mốc 1 / 5.000 của gói 24$ → dư ~{dotnum(spare1)}</span></div>
      </div>
      <p class="note"><b>3 mốc vẽ:</b> Mốc 1 = skill nhân vật chi tiết + vùng 1–4 · Mốc 2 = vùng 5–7 + 3 rồng · Mốc 3 = vùng 8–10 + 3 rồng + nhân vật / trang bị. Mỗi vùng có phác thảo map + sơ đồ nối (vùng 1: 12 map theo thiết kế 10/10/2026; bố cục để duyệt, không phải hình trong game).</p>
      <p class="note">Luật chung của mỗi vùng: mỗi map săn <b>chỉ một loại quái</b>, sinh theo bầy; 2 trong 5 map săn có hang ổ <b>boss khu</b> (1 chiêu riêng, hồi sinh theo giờ); <b>boss chúa</b> ở thánh địa (2 chiêu riêng), hạ xong mới mở vùng kế. Quái thường mỗi loại một hình riêng — không dùng bản đổi màu. Rồng 3 chiêu.</p>
      <div class="legend">{pill("co")}{pill("moi")}{pill("chieu")}</div>
    </section>

    <section id="skill">
      <h2>Skill nhân vật <span class="pill moc1" style="vertical-align:middle">Mốc 1 — vẽ trước</span></h2>
      <p>Hiện có {len(SKILLS)} skill: {len(SKILLS) - n_temp} skill đã có hình PixelLab, <b>{n_temp} skill đang mượn hình khác</b> (TẠM). Nhân vật mới có 4 động tác — đứng, đi (8 hướng), <b>một</b> nhát chém và <b>một</b> kiểu niệm (4 hướng) — nên skill nào cũng vung cùng một kiểu. Mốc 1 vẽ đủ: {N_ACTIONS} động tác mới, icon + hiệu ứng riêng cho từng skill, 8 tuyệt kỹ và các hiệu ứng nội tại ≈ <b>{dotnum(skill_total)} lượt</b>.</p>
      <h4 style="margin-top:16px">{N_ACTIONS} động tác nhân vật (3 hướng + lật gương × 2 giới tính)</h4>
      <div class="table-wrap"><table>
        <thead><tr><th>Động tác</th><th>Dùng cho</th><th class="num">Số động tác</th><th class="num">Lượt</th></tr></thead>
        <tbody>{action_rows_html}</tbody>
      </table></div>
      <p class="note">Động tác vẽ trên nhân vật gốc (chưa mặc đồ); vũ khí, mũ, áo choàng gắn bằng code theo điểm bàn tay / đầu của từng khung — pipeline cần ghi điểm gắn cho mọi khung động tác mới. Lớp trang bị thân làm ở Mốc 3, sau khi động tác đã chốt.</p>
      <h4 style="margin-top:16px">{len(SKILLS)} skill — từng skill cần vẽ gì</h4>
      <div class="table-wrap"><table class="skills">
        <thead><tr><th>Skill</th><th>Động tác</th><th>Cần vẽ (icon + hiệu ứng)</th><th class="num">Lượt</th></tr></thead>
        <tbody>{skill_rows_html}</tbody>
      </table></div>
      <div class="gear-split" style="margin-top:16px">
        <div>
          <h4>8 tuyệt kỹ mốc 10 (chưa có trong game)</h4>
          <div class="table-wrap"><table>
            <thead><tr><th>Tuyệt kỹ</th><th>Hình</th><th class="num">Lượt</th></tr></thead>
            <tbody>{ult_rows_html}</tbody>
          </table></div>
        </div>
        <div>
          <h4>{len(OTHER_FX)} hiệu ứng nội tại / phản ứng nguyên tố</h4>
          <div class="table-wrap"><table>
            <thead><tr><th>Hiệu ứng</th><th>Loại</th><th class="num">Lượt</th></tr></thead>
            <tbody>{fx_rows_html}</tbody>
          </table></div>
        </div>
      </div>
    </section>

    <section id="ngan-sach">
      <h2>3 mốc vẽ — còn dư không?</h2>
      <p>Chủ dự án chia 3 mốc (08/10/2026): <b>Mốc 1</b> vẽ trước đủ skill nhân vật thật chi tiết (đòn vung tay, chuỗi chém, lướt, đỡ…) + 1/3 số map, quái, boss (vùng 1–4, kèm Phong Long). Mốc sau chỉ bắt đầu khi mốc trước đạt. Gói 24$ = 5.000 lượt / tháng, chạy 10 việc song song; lượt không dùng hết trong tháng thì mất.</p>
      <div class="months">{moc_cards_html}</div>
      <p class="note"><b>Còn dư:</b> Mốc 1 ≈ {dotnum(MOC_TOTAL[1])} / 5.000 → dư ~{dotnum(spare1)} lượt. Đề xuất: Mốc 1 đạt thì vẽ luôn <b>Mốc 2</b> (~{dotnum(MOC_TOTAL[2])}) trong cùng gói → ~{dotnum(pack1)}, còn ~{dotnum(spare_pack1)} lượt để vẽ lại. <b>Mốc 3</b> (~{dotnum(MOC_TOTAL[3])}) sang gói 24$ thứ hai, còn ~{dotnum(spare_pack2)} lượt để thêm kiểu hình trang bị hoặc vẽ lại. Cả game ≈ 2 gói 24$.</p>
      <div class="table-wrap" style="margin-top:12px"><table>
        <thead><tr><th colspan="2">Hạng mục</th><th class="num">Lượt</th></tr></thead>
        <tbody>{moc_table_html}<tr class="total"><td colspan="2">Cộng 3 mốc</td><td class="num">~{dotnum(sum(MOC_TOTAL.values()))}</td></tr></tbody>
      </table></div>
    </section>

    <section id="thieu">
      <h2>Sau Mốc 3 còn thiếu gì?</h2>
      <p>Ba mốc phủ đủ map, quái, boss, rồng, skill nhân vật và trang bị bản đầu. Những phần dưới <b>chưa nằm trong mốc nào</b> (~{dotnum(missing_total)} lượt). Phần "cần để vùng chơi được" (~{dotnum(missing_need)}) vẫn chơi được bằng hình TẠM như ghi bên dưới, nhưng nên vẽ sớm.</p>
      <div class="table-wrap" style="margin-top:12px"><table>
        <thead><tr><th>Hạng mục · ưu tiên</th><th class="num">Lượt ước</th></tr></thead>
        <tbody>{missing_rows_html}<tr class="total"><td>Cộng</td><td class="num">~{dotnum(missing_total)}</td></tr></tbody>
      </table></div>
      <p class="note"><b>Nhét vào đâu:</b> gói 24$ thứ hai sau Mốc 3 còn ~{dotnum(spare_pack2)} lượt — đủ cho phần "cần" (~{dotnum(missing_need)}) và phần lớn "nên có"; phần "làm thêm" (điều ước Thần Long, skin) để khi làm tính năng đó. Muốn vùng 2–4 có NPC riêng ngay ở Mốc 1 thì lấy ~{dotnum(4 * 3 * 14 + 3 * 14)} lượt từ phần dư gói thứ nhất (~{dotnum(spare_pack1)}).</p>
      <h4 style="margin-top:14px">Ngoài PixelLab (cũng còn thiếu)</h4>
      <ul>{outside_html}</ul>
    </section>

    <section id="trang-bi">
      <h2>Trang bị hiện trên người <span class="pill moc3" style="vertical-align:middle">ĐÃ BỎ 14/10</span></h2>
      <p><b>Chủ dự án 14/10/2026 ĐỔI: "đồ sẽ chỉ thấy trong kho" — trang bị chỉ có icon + chỉ số trong túi, KHÔNG hiện trên người; nhân vật giữ thế cầm kiếm / trượng đang vẽ liền thân (theo LOẠI vũ khí, không theo món). Ngoại hình nhân vật chỉ đổi bằng SKIN CẢI TRANG bán kim cương: mỗi skin là một nhân vật PixelLab vẽ trọn (tóc, mặt, trang phục, bản cầm kiếm + trượng + tay không, ~475 lượt / skin / giới tính, mỗi skin một giới tính). Đã thử và LOẠI nhân vật ghép mảnh có xương (chê "quá xấu, khác hẳn bản vẽ của pixelab"); không đổi màu đồ.</b></s></p>
      <p style="opacity:.6"><s>Mặc món nào thì nhân vật hiện đúng món đó: cầm kiếm nào, cầm trượng nào, đội mũ nào, mặc áo, quần, đi giày, đeo găng nào đều thấy trên người — cả người chơi khác cũng thấy. Mỗi lúc chỉ cầm một vũ khí: chém thì cầm kiếm, niệm phép thì cầm trượng.</s></p>
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


    <section id="can-chot">
      <h2>Cần chốt</h2>
      <ol class="questions">{questions_html}</ol>
    </section>
  </main>
</div>
'''
open(OUT, 'w', encoding='utf8', newline='').write(page)
print('ok', new_mob, boss_new, MOC_TOTAL, pack1)


# ---------------------------------------------------------------- bản Markdown (kế hoạch + bàn giao cho agent sau)

HANDOFF = """## Bàn giao — đọc trước khi làm tiếp (agent / người sau)

**Sửa danh sách này:** sửa dữ liệu trong `docs/tools/the-gioi-aether.py` rồi chạy `python docs/tools/the-gioi-aether.py` — sinh lại CẢ
`docs/the-gioi-aether.md` (file này) lẫn trang `docs/the-gioi-aether.html` (đăng lại trang: Artifact
https://claude.ai/artifact/VTrVtPJHXUtETsssKRcx9K). Không sửa tay hai file sinh ra.

### Trạng thái (09–11/10/2026)

| Phần | Trạng thái | Tài liệu |
|---|---|---|
| **CLIENT LÀ UNITY, BẢN WEB ĐÃ XOÁ** (chủ dự án 11/10/2026: "làm nốt đi rồi xoá"): `apps/web` (Next.js + PixiJS) xoá hẳn; client duy nhất là `UnityGame/` (PC + APK) nói chuyện với cùng máy chủ qua Funnel `/game`. Đã chép đủ: bị động + phủ phép, Thủy Thần, chat / bạn bè, dịch vụ kim cương, cốt truyện + tự đi, Thư viện, bản đồ thế giới, cây Tiềm năng, cửa sổ Quản trị. Đầu ra pipeline dời ra `assets/` ở gốc repo (máy chủ đọc map ở đây). Trang Thử chiêu web → phòng Thử chiêu của Unity | ✔ 11/10/2026, máy chủ thật đã khởi động lại với luật mới | `UnityGame/MIGRATION_PLAN.md`, `UnityGame/README_UNITY.md` |
| Kim cương K1: ví ở máy chủ, điểm danh (cửa sổ lịch), Bia Danh Vọng, quầy hàng của Bram (gian hàng có kệ), bình EXP / chiến đấu | ✔ | `docs/ke-hoach-kim-cuong.md` |
| Chat: kênh Map / Thế giới (3 kim cương / tin) / Riêng, tab riêng từng người | ✔ | `docs/ke-hoach-xa-hoi.md` |
| Khung nhiều vùng T0b: 10 vùng, đi xuyên vùng, cổng vùng, cột dịch chuyển, nơi ở + người bán theo vùng | ✔ (chỉ vùng 1 có map) | `docs/ke-hoach-the-gioi.md` mục 5.1 |
| M3.3a: cấp / EXP / xu / bình do máy chủ giữ | ✔ | `docs/ke-hoach-m3-may-chu-chien-dau.md` |
| Trang quản trị `/admin` (chủ dự án 10/10/2026: "cộng tiền, điểm cho nhân vật"): xu, kim cương, bình, EXP / đặt cấp, điểm tiềm năng THƯỞNG (máy chủ giữ `progress.bonusPoints`, client cộng vào điểm theo cấp); quyền theo tài khoản (bảng `admins`, lệnh `apps/server/src/admin.ts`, mặc định không ai), nhật ký `admin_log` | ◐ xong + thử trên máy chủ thử 10/10/2026, CHƯA lên bản thật — triển khai: sao lưu `aether.db` (thêm 2 bảng), khởi động lại máy chủ game + `build:funnel`, rồi cấp quyền bằng lệnh | README mục Quản trị, `docs/ke-hoach-kim-cuong.md` mục K1e |
| Hình PixelLab Mốc 1 — gói trả phí (token #1, Tier 2: 5.000 lượt, 10 job song song) | ◐ phần lớn đã vẽ 09/10/2026 (~2.300 lượt) — xem mục "Mốc 1 đã vẽ" ngay dưới | file này + `docs/asset-pipeline.md` mục Gói trả phí |
| Nhân vật người chơi mới (tóc nâu, đồ tân thủ) + 25 động tác / 9 động tác bản bé + hiệu ứng skill + chiêu Quỷ vương / Vua Lich + quái vùng 1 có đánh / gục | ✔ ĐÃ LÊN GAME THẬT 09/10/2026 (bản cũ tóc bạc → NPC lữ hành Sein / Sera ở quảng trường) | `apps/web/src/game/combat/tempArt.ts`, `CombatSystem.ts` |
| Vùng 1 — 12 map (chủ dự án 10/10/2026): cấp quái theo khu, khu tuổi thơ Bãi Bồi, Hang Gargoyle (Dơi hang + boss Gargoyle Đá), Hẻm Cửa Sông (lối sang vùng 2) | ✔ ĐÃ LÊN GAME THẬT 10/10/2026 — 12 map lúc 05:58, hình ĐỢT 2 (tấm G1 / R1 / B1 + 5 món lẻ, 48 lượt: Nghĩa địa, Đồi Xương, Vách, Mộ Vô Danh, Luỹ, Hẻm Cửa Sông hết trống) lúc 07:12 | `docs/thiet-ke/vung1-12-map.md`, `docs/ke-hoach-the-gioi.md` mục 5.2 |
| Icon chiêu v2 (90 icon 32×32), kho đồ / thẻ Chỉ số bỏ icon chỉ số (chỉ giữ vàng + kim cương), chiêu nguyên tố mốc 1 học bằng 1 điểm (bài tập phép tuổi thơ nhận Tia Aether, bản lưu `talentsV` 3 + máy chủ chặn tab cũ ghi đè) | ✔ ĐÃ LÊN GAME THẬT 10/10/2026 | `docs/asset-pipeline.md` mục Icon chiêu v2, `docs/ke-hoach-nguyen-to.md` mục 7, `apps/server/src/db.ts` `keepNewerTalents` |
| Vũ khí VẼ LIỀN THÂN (chủ dự án 10/10/2026: "cầm kiếm tự gắn vào xấu"): 4 sprite người chơi đứng / đi cầm kiếm + cầm trượng (`idlesword` / `walksword` / `idlestaff` / `walkstaff`, chọn theo thế cầm + đồ mặc), bỏ icon dán vào tay, bỏ hướng chém tay không | ✔ ĐÃ LÊN GAME THẬT 10/10/2026: đứng / đi (~175 lượt) + trúng đòn / lướt / gục (16 tuổi) và trúng đòn / gục / uống bình (bé) bản cầm (129 lượt, `hitsword`…). CÒN THIẾU uống bình bản cầm của 16 tuổi: atlas 16 tuổi đã sát 4096 → cần atlas nhiều trang hoặc cắt sát khung | `docs/asset-pipeline.md` mục "Vũ khí vẽ liền thân", `apps/web/src/game/gearArt.ts` |
| Bản đồ lớn phím M — 3 tầng (chủ dự án 10/10/2026: "cải tiến màn xem map để xem được map tổng"): **Khu vực** (map đang đứng, như cũ) · **Vùng** (sơ đồ 12 map: đường nối theo lối, khoảng cấp, boss, map đang đứng, map chưa tới mờ đi, cổng sang vùng 2) · **Thế giới** (tranh lục địa PixelLab 1× / 2×, 10 vùng: nhãn, "Bạn ở đây", vùng chưa mở làm tối, thẻ vùng: cấp / nguyên tố / trạng thái cổng) — phòng thử `/lab/map` | ◐ ĐÃ DỰNG + thử ở bản thử 10/10/2026, CHƯA lên bản thật. Triển khai: chép `.aether-stage/assets/ui/world-continent.png` → `apps/web/public/assets/ui/` (hoặc `npm run assets:world`), build web, khởi động lại máy chủ game (tin `hubs` kèm `maps` = map đã tới; máy chủ cũ thì tầng Vùng không làm mờ, không lỗi) | `docs/ke-hoach-the-gioi.md` mục 3, 3.1 · `apps/web/src/game/world/worldAtlas.ts` · `apps/web/tests/worldmap.test.ts` |
| Trang **Thử chiêu** `/thu-chieu` (chủ dự án 10/10/2026: "ở màn ngoài đăng nhập, vào game 1 trang thử nghiệm skill để người dùng thử skill của các nguyên tố, kiếm phái"): nút ở màn đăng nhập, KHÔNG cần tài khoản, không máy chủ, không lưu gì. Sân tập ở quảng trường Thistlewood (3 hình nộm, gọi quái / boss vùng 1 cùng cấp 30, dọn sân), bảng bên chọn lưu phái Kiếm + một hay nhiều nguyên tố (nhánh chọn = mốc cao nhất đã hiện thực), con đường, phủ phép; danh sách chiêu đã học bấm-rồi-chọn-phím để gán thanh 10 ô; bị động đang có; Vô hạn MP / Bất tử. Chiến đấu dùng chính `CombatSystem` | ✔ ĐÃ LÊN GAME THẬT 10/10/2026 (chỉ web — build `.next-funnel-b`) | `apps/web/src/game/SkillLab.ts`, `skillLabBuild.ts` (luật, test `apps/web/tests/skilllab.test.ts`), `apps/web/src/components/skilllab/SkillLabScreen.tsx` |
| **Chọn mục tiêu** (chủ dự án 10/10/2026: "focus rồi dùng chiêu thay vì bấm đâu dùng ấy, focus quái có mũi tên trên đầu"; "skill k theo hướng chuột nữa, chuột chỉ là để focus"; "đổi mục tiêu sẽ là tab"; "mobile một nút hình vòng tròn 3 mũi tên"): nhấp / chạm quái (hình nộm) = chọn, KHÔNG ra đòn; Tab / nút cảm ứng vòng tròn 3 mũi tên = đổi mục tiêu gần → xa; Esc bỏ chọn; J, K, 1–8 nhắm vào mục tiêu (chưa chọn thì tự chọn con gần nhất trong 460px, không ai thì đánh thẳng hướng mặt); mũi tên đỏ nhấp nhô trên đầu + vòng dưới chân; mục tiêu chết / ra xa 900px thì bỏ | ✔ ĐÃ LÊN GAME THẬT 10/10/2026 (chỉ web). Đã thử ở phòng tập; trong game thật chưa thử được đòn bằng tài khoản thử (tester1 / tester2 đều đang là nhân vật nhỏ tuổi) — chơi thử lại bằng nhân vật 16 tuổi. Nút đổi mục tiêu đang là hình SVG tạm | `apps/web/src/game/combat/focus.ts` (test `tests/focus.test.ts`), `Game.aimFor` / `focusTarget`, `TouchControls` |
| **Tuyệt kỹ mốc 10 — chỉ ở phòng tập** (chủ dự án 10/10/2026: "mở skill 10 ở phòng tập thôi"): 8 chiêu, game thật vẫn dừng mốc 9 | ✔ ĐÃ LÊN (trang `/thu-chieu`, atlas riêng `vfx-ult` chỉ phòng tập tải). Sơn Thần đang mượn hình Gargoyle Đá | `docs/ke-hoach-nguyen-to.md` mục GĐ4 |
| Bản thật TỰ BẬT khi đăng nhập Windows: tác vụ "Aether - ban that" (Task Scheduler, lúc đăng nhập tài khoản đang dùng, trễ 20 giây) chạy `scripts/khoi-dong-ban-that.ps1` — bật máy chủ game :3200 + web :3101 nếu cổng chưa có ai nghe, tạo tiến trình qua WMI, log `scripts/khoi-dong-ban-that.log` | ✔ cài 10/10/2026 (máy chưa tự đăng nhập Windows: phải đăng nhập thì bản thật mới lên) | README mục Funnel |

### Mốc 1 đã vẽ (09/10/2026, token #1)

- **Nhân vật người chơi** thay hẳn: 16 tuổi nam / nữ (ô 112×112) — 13 động tác kiếm vẽ trên phiên bản cầm kiếm, 7 động tác phép trên
  phiên bản cầm trượng, lướt / trúng đòn / gục / uống bình (+ đứng dậy = gục phát ngược); bé trai / bé gái (ô 96×96) — 3 nhát kiếm gỗ,
  niệm / vung tay bằng trượng tập, trúng đòn, gục, uống bình. ĐÃ lên game. Nguồn: `sources/pixellab/player_*` (gói nhóm có mọi
  phiên bản), vẽ thêm thì animate trên id `player_hero_v2_*` / `player_child_v2_*` (registry).
- **Hiệu ứng**: 7 hiệu ứng skill lớn (lốc, cột băng, mưa băng, mây mưa, sét, thiên thạch, gai đá) + 35 hiệu ứng riêng skill / nội tại /
  phản ứng + 5 vệt chém kiếm phủ phép từng hệ (`slash_<hệ>`) — ĐÃ lên game (`TEMP_ART.final / finalShot / finalCharge / finalExtra`).
  Chiêu boss: Quỷ vương `boss_hellfire`, Vua Lich `boss_curse_blast` (lên game) + 14 chiêu boss vùng 2–4, 3 chiêu Phong Long, 7 tuyệt kỹ
  mốc 10 — vẽ xong, khai `later: true` (ngoài atlas) tới khi nối vào game.
- **Quái / boss**: 16 quái vùng 1–4 + 10 boss + xác sống / gargoyle / Vua Lich vùng 1 (trước nay CHƯA có atlas) — đủ đi / đứng / đánh /
  gục 3 hướng; nấm, xương xạ thủ, Quỷ vương thêm đánh + gục (animimg). Lên game: 6 con vùng 1. Còn lại có spec, chờ map.
- **Rồng phương TÂY** (chủ dự án đổi tối 09/10/2026 — thay bản phương Đông; mọi rồng HẦM HỐ: cánh dang to, dáng dữ): Phong Long,
  Rồng gió (rồng non), Băng Long, Hoả Long, Thuỷ Long — dựng 8 hướng từ ảnh thiết kế đã duyệt (`new-mobs/dragons_west.json`), đủ
  đi (bay vỗ cánh) / đứng / đánh / gục. Bản phương Đông + bản có cánh cũ đổi tên `*_east` / `*_winged` (chờ xoá trên PixelLab). Sơn Thần (triệu hồi tuyệt kỹ Thổ): có hình, đi / đứng bằng template bị lệch dáng → vẽ lại bằng v3 khi làm GĐ4.
- **Map vùng 2–4**: 12 công trình / cây + 9 tấm đồ vật 3×3 (`sources/pixellab/objects/`, `sheets/SW*`, `DS*`, `HL*`) + 2 tấm đồ hang
  (`CV1`, `CV2`) cho Hang Gargoyle. Tranh lục địa 688×384: `sources/pixellab/world/continent.png` — ĐÃ nối
  vào tầng Thế giới của bản đồ lớn (10/10/2026, bản thử). Icon I2 / I3 (kim cương, lịch,
  6 bình kim cương, Bạn bè, Cài đặt…) — CHƯA nối (component đang gắn cứng cỡ ảnh tạm).
- **Icon chiêu v2** (10/10/2026 — chủ dự án chê bộ v1 "xấu, kiểu AI"): 90 icon vẽ lại ĐÚNG cỡ hiện 32×32, MỘT ảnh mỗi khoá (pixflux
  nền trong suốt, viền đen, ép bảng màu nhánh), hiện 1× ở thanh kỹ năng / cây chiêu, ½ ở ô nhỏ. Nguồn
  `sources/pixellab/skill-icons-v2/` (bộ tấm v1 giữ lưu trữ), dựng `npm run assets:skill-icons` — cách vẽ ở `docs/asset-pipeline.md`
  mục Icon chiêu v2 (143 lượt).
- **Nợ hình map vùng 1 — ĐỢT 2** (10/10/2026, 48 lượt): 3 tấm 3×3 `sheets/G1_graveyard`, `R1_ruins`, `B1_bonehills` (bia, rào sắt,
  quan tài, đèn ma · tường đổ, tượng, chậu lửa, bia rune · xương thú, cờ trận, rào chông…) + 5 món `objects/tree_dead`,
  `tree_pine_dry`, `crypt`, `cliff_rock`, `ruin_arch`. ĐÃ lên game 10/10/2026.

### Việc kế tiếp (thứ tự đề xuất)

1. **Nối phần đã vẽ còn lại**: icon I2 / I3 vào UI (sửa cỡ ảnh ở `Hud`, `ShopPanel`, `BagGrid`, `CalendarPanel`, `ServiceWindow`);
   ~~tranh lục địa → bản đồ tổng phím M~~ (đã làm 10/10/2026 — chờ lên bản thật, xem Trạng thái); chiêu thứ hai cho boss
   chúa. Còn ~2.700 lượt gói tháng này (hết hạn cuối tháng, không cộng dồn): **Mốc 2** (vùng 5–7 + Băng / Hoả / Thuỷ Long phương
   Tây) đã vẽ 09–10/10/2026 — xem mục Mốc 2.
2. **Vùng 1 — 12 map** (`docs/ke-hoach-the-gioi.md` mục 5.2): 12 map đã lên game 10/10/2026 (chủ dự án duyệt Dơi hang + hướng ra
   vùng 2 qua Hẻm Cửa Sông + Đường hầm của Đoàn), hình ĐỢT 2 cũng đã lên game; theo dõi nhịp hồi sinh Gargoyle Đá (đường hầm vào thẳng gian boss).
   Sau đó **vùng 2 → 10** (12 map / vùng, thiết kế như vùng 1)
   theo hình vừa vẽ và phác thảo map (`docs/phac-thao-map/`, sinh từ `docs/tools/sketch.py` — chỉ là bố cục): map dựng bằng pipeline
   (`npm run assets:map -- <vùng>`, khai vùng ở `packages/asset-pipeline/src/maps/regions.ts`), bật `ready: true` ở
   `packages/sim/src/regions.ts`; boss + chiêu + rồng (Long Huyệt, boss thế giới dùng chung — `docs/ke-hoach-the-gioi.md` mục 2.1, 2.2).
3. **M3.3b**: túi đồ + trang bị ở máy chủ, rơi đồ (máy chủ quyết), nhật ký kinh tế.
4. Mốc 3 — **skin cải trang** (chủ dự án 14/10/2026: "đồ sẽ chỉ thấy trong kho" — trang bị KHÔNG hiện trên người): mỗi skin là
   một nhân vật PixelLab vẽ trọn (~475 lượt / skin / giới tính), bán kim cương, mặc vào thì thay ngoại hình; client chọn atlas theo
   skin. Làm 1 skin thử trước (token trả phí). Đã loại: ghép mảnh có xương, đổi màu đồ, đồ hiện theo món.
5. **Làm đẹp map** (chủ dự án 11/10/2026: "đồ vật lặp lại, cần thêm quái, xếp có trật tự") — `docs/ke-hoach-the-gioi.md` mục 5.4:
   xếp có trật tự + trộn đồ + tô màu lại trước (0 lượt), thêm quái (20–28 con, 2 loại / map săn), vẽ mới chỉ sau phiếu duyệt.
   Kèm: **cột dịch chuyển ở trạm vẽ đẹp hơn** (đã thống nhất một hình `rune_stone` cho mọi vùng 11/10/2026 — còn thiếu vòng phép,
   ánh sáng, hiệu ứng dịch chuyển).
   Kèm: **cây mỗi vùng một kiểu riêng, mỗi map một loại cây chủ đạo** (chủ dự án 11/10/2026: "cây các vùng giống nhau quá") — mục 5.6:
   9 loài đang dùng chung giữa các vùng, loài chủ đạo mỗi map trung vị 42%; đo bằng `docs/tools/dem-cay.py`.
   Kèm: **chiêu boss làm lại hết** (chủ dự án 11/10/2026) — 40 hình chiêu boss / rồng mới 8–11 khung → lên 12 khung, thêm mỗi boss
   một chiêu hoành tráng chuyển pha theo máu; phần Unity 0 lượt trước, vẽ ~1.330 lượt chưa có trong ngân sách —
   `docs/pixellab-ke-hoach-ve.md` mục "Chiêu BOSS" (chiêu người chơi: mục "Hiệu ứng chiêu NGƯỜI CHƠI", ghi từ 10/10).
6. Việc nhỏ chờ làm: báo cáo tin chat + lọc từ tục, bảng xếp hạng, cửa sổ Quản trị phần tin bị báo cáo (cửa sổ Quản trị cộng tiền /
   điểm + nhật ký đã có trong client Unity 11/10/2026).

### Chạy / kiểm

- Typecheck mọi gói: `npm run typecheck`. Test: `npm test` (luật sim `packages/sim/tests` + pipeline); máy chủ `cd apps/server && npx tsx
  tests/<tên>.test.ts` (economy, regions, chat, shop, rewards, mobs, social, gear, admin, pvp, worldmaps). Client Unity: `dotnet build
  UnityGame/Tests~/EditorCompile` (biên dịch), `dotnet test UnityGame/Tests~/Aether.Core.Tests` (luật C# khớp TS từng số) — lệnh build
  PC / APK và cờ AutoTest ở `UnityGame/README_UNITY.md`.
- Thử thật KHÔNG đụng máy chủ thật: máy chủ thử `cd apps/server && PORT=3201 AETHER_DB=data/test.db npx tsx src/main.ts`, rồi bản
  Unity với `-aetherOnline http://127.0.0.1:3201` (AutoTest tự đăng ký tài khoản thử; `-aetherUser`/`-aetherPass` để dùng tài khoản có
  sẵn). Tài khoản thử: `apps/server/tests/test-accounts.md`. Quyền quản trị trên CSDL thử:
  `AETHER_DB=data/test.db npx tsx src/admin.ts add <tài khoản>`; lệnh cũ cộng kim cương `npx tsx src/grant.ts "<tên>" <số>` vẫn dùng được.
- Triển khai (Tailscale Funnel `/game` → :3200, người chơi thật đang dùng): **sao lưu `apps/server/data/aether.db` trước** (mẫu:
  `VACUUM INTO 'data/backup-<ngày-giờ>/aether.db'` bằng `node:sqlite`, chạy được khi máy chủ đang mở CSDL), tắt máy chủ
  (`taskkill /PID <pid nghe :3200> /T /F` — tắt cứng không mất gì, dữ liệu ghi thẳng vào CSDL), bật lại bằng
  `powershell -NoProfile -ExecutionPolicy Bypass -File scripts\khoi-dong-ban-that.ps1` (tạo tiến trình qua WMI, tách khỏi phiên
  Claude; tác vụ Windows "Aether - ban that" tự gọi lúc đăng nhập). Log `apps/server/data/server.log`. Bản PC / APK mới phát cho
  người chơi bằng file build trong `UnityGame/Build/`.
- Hình mới: dựng thử `AETHER_ASSETS=<thư mục nháp> npm run assets:…`, duyệt xong mới dựng vào `assets/` (máy chủ thật đọc map ở đó
  ngay lúc chạy) → Unity `Aether/Nhập dữ liệu từ pipeline` → build lại → khởi động lại máy chủ nếu map đổi.

### Luật của dự án (đừng phá)

- Không tự vẽ art bằng CSS / SVG / emoji; hình TẠM = biến tấu hình có sẵn (đổi màu, phóng) và ghi rõ TẠM để thay khi có PixelLab.
- Trang bị phải hiện trên người (mục Trang bị). Máy chủ là nguồn sự thật cho kim cương, cấp / EXP / xu / bình, điểm tiềm năng
  thưởng (`progress.bonusPoints` — client cộng vào điểm theo cấp ở MỌI chỗ tính điểm: `talentPoints` / `unspent(…, bonus)`).
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
    if st == 've':
        return 'đã vẽ · chờ lên game'
    if st.startswith('mau:'):
        return f'đổi màu từ {st[4:]}'
    return ''


def dot(n):
    return f'{n:,}'.replace(',', '.')


md = []
md.append('# Thế giới Aether — vùng, map, quái, boss, trang bị, ngân sách PixelLab\n')
md.append('> FILE SINH TỰ ĐỘNG từ `docs/tools/the-gioi-aether.py` — sửa dữ liệu ở đó rồi chạy lại (sinh cả bản HTML). Soạn 08/10/2026,')
md.append('> chia **3 mốc** (chủ dự án 08/10/2026): Mốc 1 = skill nhân vật thật chi tiết + vùng 1–4; Mốc 2 = vùng 5–7 + 3 rồng; Mốc 3 = vùng 8–10')
md.append('> + 3 rồng + nhân vật / trang bị. Trạng thái: **Mốc 1 phần lớn đã vẽ + lên game 09/10/2026 (gói trả phí token #1)**.\n')
md.append(HANDOFF)
md.append('## Tóm tắt\n')
md.append('- **10 vùng**, mỗi vùng **12 map** (chủ dự án 10/10/2026, trước là 7): 1 trạm (làng hoặc toà thành — nơi ở có NPC dịch vụ, nhiệm vụ), 10 map săn,')
md.append('  1 thánh địa → **~120 map**. Vùng 1 đã thiết kế đủ 12 map (`docs/thiet-ke/vung1-12-map.md`; cả 12 map cùng hình')
md.append('  ĐỢT 2 đã lên game 10/10/2026); vùng 2–10 trong bảng dưới vẫn là danh sách 7 map của khung cũ — thiết kế lại lên 12 khi làm tới.')
md.append(f'- Quái thường: **{new_mob} loại vẽ mới**, mỗi loại một hình riêng (không dùng bản đổi màu) + 4 loại đã có ở vùng 1. Mỗi map săn một loại quái, sinh theo bầy.')
md.append(f'- Boss: **30 boss vùng** (2 boss khu + 1 boss chúa mỗi vùng; vẽ mới {boss_new}) + **7 rồng nguyên tố** (boss thêm, map phụ Long Huyệt).')
md.append(f'- Skill nhân vật: **{N_ACTIONS} động tác mới**, {n_temp} skill vẽ lại hình riêng (đang mượn hình), {len(ULTS)} tuyệt kỹ, {len(OTHER_FX)} hiệu ứng phụ (~{dot(skill_total)} lượt).')
md.append(f'- PixelLab: Mốc 1 **~{dot(MOC_TOTAL[1])} / 5.000** → dư ~{dot(spare1)}; đề xuất vẽ luôn Mốc 2 (~{dot(MOC_TOTAL[2])}) cùng gói → ~{dot(pack1)}')
md.append(f'  (còn ~{dot(spare_pack1)} để vẽ lại). Mốc 3 (~{dot(MOC_TOTAL[3])}) sang gói 24$ thứ hai. Cả game ≈ 2 gói 24$.\n')

md.append('## Skill nhân vật (Mốc 1 — vẽ trước)\n')
md.append(f'Hiện có {len(SKILLS)} skill: {len(SKILLS) - n_temp} có hình PixelLab, **{n_temp} đang mượn hình khác (TẠM)**. Nhân vật mới có idle, walk (8 hướng),')
md.append('MỘT nhát attack, MỘT kiểu cast (4 hướng) → mọi skill vung cùng một kiểu. Mốc 1 vẽ đủ các mục dưới.\n')
md.append(f'### {N_ACTIONS} động tác nhân vật (3 hướng + lật gương × 2 giới tính, ~{ACTION_COST} lượt / động tác)\n')
md.append('| Động tác | Dùng cho | Số | Lượt |\n|---|---|---|---|')
for k, name, n in ACTIONS:
    md.append(f'| {md_cell(name)} | {md_cell(", ".join(action_users(k)))} | {n} | {n * ACTION_COST} |')
md.append('\nĐộng tác vẽ trên nhân vật gốc (chưa mặc đồ); vũ khí / mũ / áo choàng gắn bằng code theo điểm bàn tay / đầu từng khung — pipeline')
md.append('phải ghi điểm gắn cho mọi khung mới. Lớp trang bị thân làm ở Mốc 3, sau khi động tác đã chốt.\n')
md.append(f'### {len(SKILLS)} skill — từng skill cần vẽ gì\n')
md.append('| Nhóm | Skill | Hệ · kiểu · bậc | Hình | Động tác | Cần vẽ | Lượt |\n|---|---|---|---|---|---|---|')
for title, test in SKILL_GROUPS:
    for sk in sorted((sk for sk in SKILLS if test(sk)), key=lambda sk: sk[5] or 0):
        sid, name, el, kind, _br, tier, _sty, st, _ = sk
        tier_txt = f' · bậc {tier}' if tier else ''
        md.append(f'| {title} | {name} | {ELEM_VI[el]} · {KIND_VI[kind]}{tier_txt} | {"có" if st == "co" else "**tạm**"} | '
                  f'{md_cell(ACTION_NAME.get(SKILL_ACTION.get(sid, ""), "—"))} | {md_cell(skill_todo(sk))} | {skill_cost(sk) or "—"} |')
md.append('\n### 8 tuyệt kỹ mốc 10 (chưa có trong game)\n')
md.append('| Tuyệt kỹ | Nhánh | Hình | Lượt |\n|---|---|---|---|')
for n, b, t, v in ULTS:
    md.append(f'| {n} | {b} | {md_cell(t)} | {v} |')
md.append(f'\n### {len(OTHER_FX)} hiệu ứng nội tại / phản ứng nguyên tố (~{FX_COST} lượt mỗi cái)\n')
for i, t in OTHER_FX:
    md.append(f'- `{i}` — {t}')
md.append('')

md.append('## 3 mốc vẽ — ngân sách PixelLab\n')
md.append('Mốc sau chỉ bắt đầu khi mốc trước đạt. Gói 24$ = 5.000 lượt / tháng, lượt không dùng hết trong tháng thì mất.\n')
md.append('| Mốc | Nhóm | Hạng mục | Lượt |\n|---|---|---|---|')
for k in (1, 2, 3):
    first = True
    for g, items in MOCS[k]:
        for t, v in items:
            md.append(f'| {f"**Mốc {k}** — {MOC_NAME[k]} (~{dot(MOC_TOTAL[k])})" if first else ""} | {g} | {md_cell(t)} | {dot(v)} |')
            first = False
md.append(f'| **Cộng 3 mốc** | | | **~{dot(sum(MOC_TOTAL.values()))}** |\n')
md.append(f'**Còn dư:** Mốc 1 ≈ {dot(MOC_TOTAL[1])} → dư ~{dot(spare1)}. Đề xuất: gói 24$ thứ nhất = Mốc 1 + Mốc 2 (~{dot(pack1)}, còn ~{dot(spare_pack1)}')
md.append(f'để vẽ lại); gói thứ hai = Mốc 3 (~{dot(MOC_TOTAL[3])}, còn ~{dot(spare_pack2)} để thêm kiểu hình trang bị / vẽ lại).\n')

md.append('## Sau Mốc 3 còn thiếu gì\n')
md.append(f'Chưa nằm trong mốc nào (~{dot(missing_total)} lượt); phần "cần để vùng chơi được" ~{dot(missing_need)} — chơi được bằng hình TẠM ghi')
md.append(f'trong bảng. Gói 24$ thứ hai sau Mốc 3 còn ~{dot(spare_pack2)} → đủ phần "cần" + phần lớn "nên có".\n')
md.append('| Nhóm | Hạng mục | Ưu tiên | Lượt ước | Trước khi có hình |\n|---|---|---|---|---|')
for g, t, v, tmp, pr in MISSING:
    md.append(f'| {g} | {md_cell(t)} | {PRIO_VI[pr]} | {dot(v)} | {md_cell(tmp)} |')
md.append(f'| **Cộng** | | | **~{dot(missing_total)}** | |\n')
md.append('Ngoài PixelLab: ' + '; '.join(OUTSIDE) + '.\n')

md.append('## Trang bị hiện trên người — ĐÃ BỎ 14/10/2026\n')
md.append('**Chủ dự án 14/10/2026 ĐỔI: "đồ sẽ chỉ thấy trong kho" — trang bị chỉ có icon + chỉ số trong túi, KHÔNG hiện trên người; nhân vật giữ thế cầm kiếm / trượng đang vẽ liền thân (theo LOẠI vũ khí, không theo món). Ngoại hình nhân vật chỉ đổi bằng SKIN CẢI TRANG bán kim cương: mỗi skin là một nhân vật PixelLab vẽ trọn (tóc, mặt, trang phục, bản cầm kiếm + trượng + tay không, ~475 lượt / skin / giới tính, mỗi skin một giới tính). Đã thử và LOẠI nhân vật ghép mảnh có xương (chê "quá xấu, khác hẳn bản vẽ của pixelab"); không đổi màu đồ.**\n')
md.append('Kế hoạch cũ (giữ để tra cứu):\n')
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
md.append('Chú thích cột Hình: **vẽ mới** = PixelLab vẽ (mỗi loại quái một hình riêng, không dùng bản đổi màu); "có sẵn" = đã có trong game;')
md.append('"cần chiêu mới" = có hình, thiếu hiệu ứng chiêu. Boss khu ở hang ổ trong map săn (hồi sinh theo giờ); boss chúa ở thánh địa,')
md.append('hạ xong mới mở vùng kế.\n')
for r in REGIONS:
    kind = 'toà thành' if r['town'][0] == 'castle' else 'làng'
    md.append(f"### Vùng {r['n']} · {r['name']} — Mốc {MOC_OF[r['n']]}\n")
    md.append(f"- Cấp {r['lv']} · hệ vùng {r['elem']} · quái yếu {r['weak']} · {r['status']}")
    md.append(f"- Nơi ở ({kind}): **{r['town'][1]}** — {r['town'][2]}")
    if r.get('dragon'):
        md.append(f"- Thêm: **{r['dragon']}** ở Long Huyệt (map phụ của vùng)")
    md.append('\n| Map | Loại | Quái / boss | Hình | Map |\n|---|---|---|---|---|')
    for name, role, mobs, mapstatus in r['maps']:
        maptxt = {'co': 'đã có', 'dung': 'đã dựng, chờ lên game', 'dot2': 'đã có (gần trống), hình ĐỢT 2 đã dựng, chờ lên game'}.get(mapstatus, 'chưa có')
        if not mobs:
            md.append(f'| {md_cell(name)} | {md_cell(role)} | — (NPC dịch vụ) | — | {maptxt} |')
        for i, (m, st) in enumerate(mobs):
            first = i == 0
            md.append(f'| {md_cell(name) if first else ""} | {md_cell(role) if first else ""} | {md_cell(m)} | {md_status(st)} | {maptxt if first else ""} |')
    md.append(f'\nSơ đồ nối {len(r["maps"])} map + phác thảo (bố cục để duyệt, không phải hình trong game):\n')
    md.append(f'![Sơ đồ vùng {r["n"]}](phac-thao-map/vung-{r["n"]}.svg)\n')
    imgs = []
    for i, (name, _role, _svg, real) in enumerate(SKETCHES[r['n']][1]):
        src = f'../assets/maps/human/{real}.minimap.png' if real else f'phac-thao-map/vung-{r["n"]}-map-{i + 1}.svg'
        imgs.append(f'<img src="{src}" alt="{name}" width="240">')
    md.append(' '.join(imgs))
    md.append('')

md.append('## 7 rồng nguyên tố\n')
md.append('Boss thêm ngoài 3 boss vùng; map phụ Long Huyệt, cần cấp 40; chỉ người đánh đòn cuối nhận Long Châu (mở tuyệt kỹ mốc 10); đủ 7 Long')
md.append('Châu triệu hồi Thần Long. Chi tiết cơ chế: `docs/ke-hoach-the-gioi.md` mục 2.1.\n')
md.append('| Rồng | Tên riêng | Long Huyệt | Cấp | Hệ | Chiêu chính |\n|---|---|---|---|---|---|')
for a, b, n, where, lv, el, move in DRAGONS:
    md.append(f'| {a} | {b} | Vùng {n} · {where} | {lv} | {el} | {move} |')
md.append('')

md.append('## Cần chốt\n')
for i, q in enumerate(QUESTIONS, 1):
    md.append(f'{i}. {q}')
md.append('')
open(OUT_MD, 'w', encoding='utf8', newline='').write('\n'.join(md))
print('md ok')

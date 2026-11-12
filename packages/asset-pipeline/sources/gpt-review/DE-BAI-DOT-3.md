# Đề bài GPT vẽ — đợt 3: nội thất nhà ở Gia viên + bếp nấu ăn (11/11/2026)

Đợt 2 đã được chủ dự án duyệt ("Ok ổn rồi"). Đợt này vẽ **đồ trong nhà ở riêng Gia viên**: bếp (phục vụ tính năng nấu ăn —
chế biến rau củ, thịt, cá thành món), phòng ngủ, phòng khách, 2 mảng tường nhà ở, và bảng nhiệm vụ cho quán rượu.
Sàn, thảm chùi chân và lối ra do Claude làm bằng code — GPT KHÔNG vẽ sàn, KHÔNG vẽ cửa ra.

Luật, nơi lưu, cách ghi `prompts.json` y như đợt 1 (`DE-BAI-DOT-1.md` mục "Luật bắt buộc"), chỉ đổi thư mục ra:
`packages/asset-pipeline/sources/gpt-review/dot-3/`. KHÔNG vẽ nhân vật / người / thú / hoạt ảnh. Không sửa file khác, không build,
không commit.

## Rút kinh nghiệm đợt 2 (bắt buộc)

- **Lề ≥ 5 % cả bốn phía** — đợt 2 có 11 / 22 món sát mép. Nếu ảnh ra sát mép thì vẽ lại, đừng giữ.
- **Gửi kèm 2 loại ảnh mẫu mỗi lần vẽ:** (1) ảnh ở cột "Ảnh mẫu" trong `mau-tham-chieu/`; (2) **một ảnh đợt 2 đã duyệt** ở cột
  "Mẫu đợt 2" (ảnh gốc trong `dot-2/`) để giữ đúng nét, độ dày viền, độ to ô pixel và bảng màu ấm của đợt 2.
- Đồ dựa tường vẽ **thẳng chính diện**, đáy là một đường thẳng (chân đồ chạm sàn), không vẽ sàn / bóng loang ra ngoài.
- Đồ có đồ ăn: đồ ăn chỉ là hình (rau, bánh mì, thịt, cá nằm trên thớt), không có chữ / nhãn / số.

## Đuôi prompt chung (gắn sau mô tả của MỌI món)

```
Chunky chibi pixel art game sprite of indoor furniture in EXACTLY the same style as the attached references: front view with a
slight top-down angle, thick dark near-black outline around every shape, soft cel shading with 2–3 tones per material, warm
saturated colors, limited palette (at most 32 colors), crisp uniform square pixel blocks (every art pixel the same size, about
4×4 image pixels), no anti-aliasing, no gradients, no blur, no texture noise. One single object centered with at least 8% empty
space on every side, on a perfectly flat solid magenta #FF00FF background. No floor, no room, no cast shadow, no text, no letters,
no numbers, no labels, no people, no animals, no characters.
```

Mảng tường (món 1–2): vẽ **thẳng chính diện**, hai mép trái / phải là cột gỗ dọc thẳng đứng cắt phẳng (để ghép nhiều mảng liền nhau),
đỉnh là dầm trần thẳng, đáy là chân tường thẳng — cùng khổ và cùng kiểu cột / dầm với `dot-2/tuong_thach_cao.png`.

## Danh sách

Nhân vật trong game cao ~80 px; ô sàn 32 px. Cột "Cao trong game" để Claude thu nhỏ.

| # | id | Món | Ảnh mẫu | Mẫu đợt 2 | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 1 | tuong_thach_cao_cua_so | Tường vôi khung gỗ có cửa sổ | home_wardrobe_x4 | tuong_thach_cao | ~128 | A straight front-facing interior wall panel of cream plaster with dark timber framing (half-timbered), a wooden four-pane window with a flower box of red flowers and short checkered curtains in the middle, thick wooden posts on the left and right edges, a ceiling beam along the top. |
| 2 | tuong_bep_gach | Tường bếp ốp gạch | home_stove_x4 | tuong_thach_cao | ~128 | A straight front-facing kitchen wall panel: cream plaster upper half with dark timber framing, lower half covered with small glazed blue-and-white square ceramic tiles, a row of hanging copper pans and ladles on hooks, thick wooden posts on the left and right edges, a ceiling beam along the top. |
| 3 | bep_lo_cui | Bếp lò củi | home_stove_x4 | lo_suoi_lon | ~96 | A cast-iron wood-burning kitchen stove with a glowing fire door, two pots on top (one steaming soup pot, one frying pan), a short black stovepipe going up, a small stack of firewood beside it. |
| 4 | quay_so_che | Quầy sơ chế (thớt) | home_dining_table_x4 | quay_bar | ~60 | A wooden kitchen counter with drawers, on top a thick cutting board with a kitchen knife, chopped carrots and cabbage, a raw fish and a piece of raw meat on a plate. |
| 5 | bon_rua | Bồn rửa đá có bơm tay | home_stove_x4 | thung_ruou_lon | ~70 | A stone kitchen sink basin on a wooden cabinet with a cast-iron hand water pump, water dripping, a few clean plates drying on a small rack beside it. |
| 6 | chan_bat | Chạn bát | home_bookshelf_x4 | ke_ruou | ~110 | A tall wooden kitchen dresser cupboard: upper open shelves with stacked plates, bowls and cups, lower closed cabinet doors with small knobs. |
| 7 | ke_gia_vi | Kệ gia vị + giá treo | home_bookshelf_x4 | tuong_go_ke | ~56 | A small wall-mounted wooden spice rack with rows of little colorful jars and a hanging bundle of garlic and dried chili peppers below it. |
| 8 | lo_nuong_banh | Lò nướng bánh gạch | home_fireplace_x4 | lo_suoi_lon | ~100 | A dome-shaped red brick bread oven with an arched opening showing glowing embers and a loaf of bread, a wooden bread peel leaning against it. |
| 9 | tu_lanh_da | Tủ đá ướp lạnh | home_wardrobe_x4 | ket_sat | ~84 | An old-fashioned wooden ice box cabinet with brass hinges and latches, frosty blue ice visible through a small top hatch, a few icicles on the edges. |
| 10 | ban_an_dai | Bàn ăn dài + ghế | home_dining_table_x4, home_chair_x4 | ban_tron_ghe | ~64 | A long rectangular wooden dining table with a white table runner, a roast dish, a bread basket, a fruit bowl and two candles, two wooden chairs on each long side seen from the front. |
| 11 | thung_tao_rau | Thùng rau củ | home_chest_x4 | thung_ruou_lon | ~44 | A wooden crate full of fresh vegetables: carrots, potatoes, cabbages and tomatoes, with a few leaves sticking out. |
| 12 | giuong_doi | Giường đôi lớn | home_bed_x4 | tuong_thach_cao | ~84 | A large double bed with a carved wooden headboard, two white pillows, a thick patchwork quilt in warm red, green and cream, seen from the front with a slight top-down angle. |
| 13 | tu_dau_giuong | Tủ đầu giường + đèn | home_chest_x4 | ket_sat | ~52 | A small wooden bedside table with one drawer, a lit oil lamp and a small book on top. |
| 14 | ban_trang_diem | Bàn trang điểm gương | home_wardrobe_x4 | ban_lam_viec | ~96 | A wooden vanity dresser with a tall oval mirror on top, small drawers, a vase of flowers and a hairbrush on the surface. |
| 15 | tu_ngan_keo | Tủ ngăn kéo | home_wardrobe_x4 | ke_ruou | ~72 | A wooden chest of drawers with four drawers and brass handles, a small potted plant and a folded cloth on top. |
| 16 | tham_lon | Thảm lớn chữ nhật | home_rug_x4 | — | ~60 | A large rectangular woven rug seen from above with a slight angle, warm red and gold diamond pattern with a cream border and short tassels on the two short ends. |
| 17 | ghe_dai | Ghế dài bọc nệm (sofa) | home_armchair_x4 | ban_tron_ghe | ~60 | A cozy wooden-framed three-seat sofa with thick dark green cushions and two small patterned throw pillows, seen from the front. |
| 18 | ban_tra | Bàn trà thấp | home_dining_table_x4 | ban_lam_viec | ~36 | A low round wooden coffee table with a teapot, two teacups and a small plate of cookies. |
| 19 | dong_ho_dung | Đồng hồ quả lắc đứng | home_wall_clock_x4 | ke_ruou | ~120 | A tall wooden grandfather clock with a plain round clock face with no numbers, a brass pendulum visible behind a glass door. |
| 20 | chau_cay_lon | Chậu cây lớn | home_potted_plant_x4 | — | ~84 | A big indoor potted fiddle-leaf fig tree in a glazed terracotta pot. |
| 21 | ke_trung_bay | Tủ kính trưng bày | home_bookshelf_x4 | ke_ruou | ~110 | A wooden glass-front display cabinet with three shelves showing a small golden trophy, a seashell, a crystal and a little ship in a bottle. |
| 22 | bang_nhiem_vu | Bảng nhiệm vụ quán rượu | home_bookshelf_x4 | tuong_go_ke | ~84 | A wooden notice board on two short legs with a little roof, covered with pinned parchment papers that show only simple drawings (a monster silhouette, a map, a coin) and no writing, a few red pins. |

## Khi xong

Báo chủ dự án số món đã vẽ và món nào chưa đạt (ghi rõ trong `prompts.json`: lề, sai tạo hình). Claude chuẩn hoá
(`scripts/gpt-normalize.py --height <cao>`), ghép thử phòng bếp + phòng ngủ + phòng khách nhà ở Gia viên có sàn, tường, đồ và nhân
vật đứng trong để chủ dự án duyệt.

# Đề bài GPT vẽ — đợt 5: nhà trọ, đền Haven, phòng tắm nhà ở (12/11/2026)

Đợt 2–4 đã ghép thử quán rượu, ngân hàng, nhà ở 3 map (bếp, khách, ngủ tầng 2), lò rèn, tiệm tạp hoá, tiệm thuốc. Đợt này vẽ đồ cho
3 nơi tiếp theo: **nhà trọ** (quầy lễ tân + phòng ngủ thuê), **đền Haven** (nơi hồi sinh / cầu phúc), **phòng tắm** nhà ở Gia viên.

**KHÔNG vẽ người / NPC / thú** — chủ dự án 12/11: NPC GPT vẽ khác style PixelLab quá, nhân vật quay về PixelLab. Đợt này CHỈ đồ vật.
Tượng thờ cũng KHÔNG có hình người: dùng khối pha lê / biểu tượng.

Luật, nơi lưu, cách ghi `prompts.json` y như đợt 1 (`DE-BAI-DOT-1.md` mục "Luật bắt buộc") và rút kinh nghiệm đợt 3–4
(lề ≥ 5 %, gửi kèm ảnh mẫu + một ảnh đợt trước đã duyệt). Thư mục ra: `packages/asset-pipeline/sources/gpt-review/dot-5/`.
Không sửa file khác, không build, không commit. Không đồ đội đầu (mũ, mũ giáp, vương miện…) ở bất cứ món nào.

## Đuôi prompt chung (gắn sau mô tả của MỌI món)

```
Chunky chibi pixel art game sprite of indoor furniture in EXACTLY the same style as the attached references: front view with a
slight top-down angle, thick dark near-black outline around every shape, soft cel shading with 2–3 tones per material, warm
saturated colors, limited palette (at most 32 colors), crisp uniform square pixel blocks (every art pixel the same size, about
4×4 image pixels), no anti-aliasing, no gradients, no blur, no texture noise. One single object centered with at least 8% empty
space on every side, on a perfectly flat solid magenta #FF00FF background. No floor, no room, no cast shadow, no text, no letters,
no numbers, no labels, no people, no human figures, no statues of people, no animals, no characters.
```

Mảng tường (món 1, 9, 17): thẳng chính diện, hai mép trái / phải là cột / trụ dọc cắt phẳng, đỉnh là dầm / gờ trần thẳng, đáy chân tường
thẳng — cùng khổ và kiểu ghép với `dot-2/tuong_go_ke.png`.

## Danh sách

Nhân vật trong game cao ~80 px; ô sàn 32 px. "Mẫu đợt trước" = ảnh gốc trong `dot-2/`, `dot-3/` hoặc `dot-4/`.

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 1 | tuong_nha_tro | Tường nhà trọ | home_wardrobe_x4 | dot-3/tuong_thach_cao_cua_so | ~128 | A straight front-facing interior wall panel of warm honey-colored wooden planks with a green-and-cream striped wallpaper upper half, a small framed landscape painting and a brass wall sconce with a lit candle, thick wooden posts on the left and right edges, a ceiling beam along the top. |
| 2 | quay_le_tan | Quầy lễ tân nhà trọ | home_dining_table_x4 | dot-4/quay_hang | ~64 | A wooden inn reception counter with a brass service bell, an open guest ledger book with only lines (no writing), a quill in an inkpot and a small vase of flowers on top, panelled front. |
| 3 | bang_treo_chia_khoa | Bảng treo chìa khoá | home_bookshelf_x4 | dot-3/ke_gia_vi | ~56 | A wall-mounted wooden key board with six brass hooks, each holding an old brass room key with a small round wooden tag (tags blank, no numbers). |
| 4 | giuong_don | Giường đơn phòng trọ | home_bed_x4 | dot-3/giuong_doi | ~76 | A simple single wooden bed with one white pillow and a plain blue wool blanket, short wooden headboard, seen from the front with a slight top-down angle. |
| 5 | binh_phong | Bình phong gấp | home_wardrobe_x4 | dot-3/tu_ngan_keo | ~84 | A three-panel folding wooden room divider screen with cream fabric panels painted with simple pink flowers and branches. |
| 6 | chau_rua_mat | Giá chậu rửa mặt | home_chair_x4 | dot-3/bon_rua | ~68 | A wooden washstand with a white ceramic basin and a water pitcher on top, a small towel hanging on a side rail, a small mirror above. |
| 7 | ruong_hanh_ly | Rương hành lý | home_chest_x4 | dot-4/thung_go_nho | ~40 | A travel trunk of brown leather with brass corners, two leather straps and a buckle, a little travel sticker shape with no writing. |
| 8 | ghe_tua_cua_so | Ghế tựa đọc sách | home_armchair_x4 | dot-3/ghe_dai | ~60 | A small cozy wooden reading armchair with a red cushion and a folded knitted blanket over one arm, facing the viewer. |
| 9 | tuong_den_kinh_mau | Tường đền kính màu | home_fireplace_x4 | dot-2/tuong_da_vom | ~140 | A straight front-facing interior wall panel of pale cream stone blocks with a tall pointed-arch stained-glass window in blue, teal and gold showing an abstract glowing crystal and star pattern (no figures), square stone pilasters on the left and right edges, a carved stone cornice along the top. |
| 10 | ban_tho_pha_le | Bàn thờ pha lê Haven | home_fireplace_x4 | dot-2/cot_cam_thach | ~110 | A white marble altar with gold trim and three steps in front, on top a large floating glowing cyan Haven crystal surrounded by small light sparkles, two gold candle holders with lit candles on the sides. |
| 11 | ghe_bang_dai | Ghế băng dài trong đền | home_chair_x4 | dot-3/ghe_dai | ~48 | A long wooden church pew bench with a tall straight backrest, carved end panels, seen from the BACK at a slight top-down angle (we see the backrest, the seat is facing away from the viewer). |
| 12 | chan_nen_dung | Chân nến đứng | home_wall_clock_x4 | dot-2/den_chum_vang | ~84 | A tall standing gold candelabra with three lit white candles and small dripping wax. |
| 13 | binh_hoa_lon | Bình hoa lớn | home_potted_plant_x4 | dot-3/chau_cay_lon | ~64 | A tall blue-and-white porcelain vase with a big bouquet of white lilies and pale blue flowers. |
| 14 | ke_nen_cau_nguyen | Kệ nến cầu nguyện | home_bookshelf_x4 | dot-4/ke_rau_qua | ~56 | A tiered iron prayer candle stand with many small lit tea-light candles in rows, a small offering box in front. |
| 15 | buc_giang | Bục giảng | home_chair_x4 | dot-2/ban_lam_viec | ~64 | A carved wooden lectern with an open thick book with only simple decorative lines (no writing), a gold crystal emblem on the front. |
| 16 | tham_do_dai | Thảm đỏ dài | home_rug_x4 | dot-3/tham_lon | ~40 | A long narrow red carpet runner with gold borders and small gold tassels at both ends, seen from above at a slight angle, lying flat (wide shape, much wider than tall). |
| 17 | tuong_phong_tam | Tường phòng tắm ốp gạch | home_stove_x4 | dot-3/tuong_bep_gach | ~128 | A straight front-facing bathroom wall panel: cream plaster upper half with dark timber framing, lower half covered with small glazed mint-green square ceramic tiles, a small round window, a wooden towel rail with a white towel, thick wooden posts on the left and right edges, a ceiling beam along the top. |
| 18 | bon_tam_go | Bồn tắm gỗ | home_water_barrel_x4 | dot-2/thung_ruou_lon | ~60 | A large round wooden bathtub with iron hoops filled with steaming warm water and soap bubbles, a small wooden step stool beside it, a rubber duck floating (toy, not a real animal). |
| 19 | tu_guong_rua | Tủ gương rửa mặt | home_wardrobe_x4 | dot-3/ban_trang_diem | ~96 | A wooden bathroom vanity cabinet with a white ceramic sink, a brass tap, a rectangular mirror on top, a soap bar and a toothbrush cup. |
| 20 | ke_khan | Kệ khăn tắm | home_bookshelf_x4 | dot-3/tu_ngan_keo | ~84 | A narrow wooden shelf with neatly folded towels in white, blue and pink, a basket of soaps and a small potted fern on top. |
| 21 | gio_do_giat | Giỏ đồ giặt | home_chest_x4 | dot-3/thung_tao_rau | ~40 | A woven wicker laundry basket with a lid slightly open and a few colorful clothes peeking out. |
| 22 | chau_cay_duong_xi | Chậu dương xỉ treo | home_potted_plant_x4 | dot-3/ke_gia_vi | ~56 | A hanging ceramic flower pot on three short ropes with a lush green fern spilling over the edges. |

Món 18 dùng ảnh mẫu `mau-tham-chieu/home_water_barrel_x4.png` (đã có).

## Khi xong

Báo chủ dự án số món đã vẽ và món nào chưa đạt (ghi rõ trong `prompts.json`: lề, sai tạo hình). Claude chuẩn hoá
(`scripts/gpt-normalize.py --height <cao>`), ghép thử sảnh nhà trọ + phòng trọ, đền Haven và phòng tắm nhà ở (nối từ phòng ngủ tầng 2)
để chủ dự án duyệt.

# Đề bài GPT vẽ — đợt 13: tiệm vũ khí, tiệm trang bị, xưởng nâng cấp — bộ Thistlewood (12/11/2026)

Chủ dự án 12/11: "Shop trang bị, vũ khí, nâng cấp cũng cần một map riêng phải vào trong phòng" và "Các phần như ngân hàng, quán
rượu mỗi vùng phải khác nhau nhé". Mỗi tiệm là một phòng vào được (map riêng, sàn dựng bằng code). Đợt này làm **bộ của vùng 1
Thistlewood** — cùng chất với lò rèn / tạp hoá đợt 4 (gỗ ấm, đá xám, sắt rèn, mộc mạc trung cổ). Các vùng khác làm bộ riêng sau.

**KHÔNG vẽ người / NPC / thú / tượng / ma-nơ-canh / hình nộm.** Giá giáp là khung gỗ chữ T đơn giản, không đầu, không mặt.
**NGHIÊM CẤM đồ đội đầu (CHỐT 06/11):** không mũ, mũ giáp, mũ trùm, vương miện, mặt nạ ở bất cứ món nào, kể cả bày trên giá / kệ /
tường; áo choàng không mũ trùm. Vũ khí theo 5 class của game: kiếm, trượng phép, cung, thương, khiên.

Luật, nơi lưu, cách ghi `prompts.json` y như đợt 1 (`DE-BAI-DOT-1.md` mục "Luật bắt buộc") và rút kinh nghiệm đợt 3–12
(lề ≥ 5 %, gửi kèm ảnh mẫu + một ảnh đợt trước đã duyệt). Thư mục ra: `packages/asset-pipeline/sources/gpt-review/dot-13/`.
Không sửa file khác, không build, không commit.

## Đuôi prompt chung (gắn sau mô tả của MỌI món)

```
Chunky chibi pixel art game sprite of indoor shop furniture in EXACTLY the same style as the attached references: front view with
a slight top-down angle, thick dark near-black outline around every shape, soft cel shading with 2–3 tones per material, warm
saturated colors, limited palette (at most 32 colors), crisp uniform square pixel blocks (every art pixel the same size, about
4×4 image pixels), no anti-aliasing, no gradients, no blur, no texture noise. One single object centered with at least 8% empty
space on every side, on a perfectly flat solid magenta #FF00FF background. No floor, no room, no cast shadow, no text, no letters,
no numbers, no labels, no price tags, no people, no human figures, no mannequins, no statues, no animals, no characters, no hats,
no helmets, no hoods, no crowns, no masks.
```

Mảng tường (`*_tuong`, `*_tuong_cua_so`): thẳng chính diện, hai mép trái / phải là cột / trụ dọc cắt phẳng, đỉnh là dầm / gờ trần
thẳng, đáy chân tường thẳng — cùng khổ và kiểu ghép với `dot-4/tuong_da_lo_ren.png`; hai mảng của cùng một tiệm phải ghép liền nhau
(cùng cột, cùng gờ, cùng chân tường). Vòng phép trên sàn (`nc_vong_phap`): nằm phẳng nhìn từ trên hơi nghiêng, rộng hơn cao.

## Danh sách

Nhân vật trong game cao ~80 px; ô sàn 32 px. Cột "Mẫu đợt trước" = ảnh gốc trong `dot-2/` … `dot-12/`.

### Tiệm vũ khí — mã `vk_`

Chất phòng: gỗ sồi sẫm, đá xám, sắt đen, đinh tán đồng; vũ khí bày trên giá.

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 1 | vk_tuong | Tường | home_wardrobe_x4 | dot-4/tuong_da_lo_ren | ~128 | A straight front-facing weapon shop interior wall: grey stone lower half, dark oak plank upper half with iron pegs holding two crossed swords and a spear, a small round wooden shield emblem with a plain cross pattern, thick dark oak posts on the left and right edges, a heavy oak ceiling beam with iron brackets along the top. |
| 2 | vk_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4 | dot-4/tuong_da_lo_ren | ~128 | The same grey stone and dark oak weapon shop wall with a sturdy window with iron bars and small panes showing daylight, two daggers hanging on pegs beside it, thick dark oak posts on the left and right edges, a heavy oak ceiling beam with iron brackets along the top. |
| 3 | vk_quay | Quầy bán vũ khí | home_dining_table_x4 | dot-4/quay_hang | ~64 | A long heavy oak shop counter with a glass-topped display case showing daggers and short swords on red velvet, an iron cash box and a small whetstone on top, wide shape. |
| 4 | vk_gia_kiem | Giá kiếm | home_bookshelf_x4 | dot-4/gia_vu_khi | ~88 | A standing wooden weapon rack holding five swords upright in a row: a short sword, a long sword, a broad sword, a curved sabre and a two-handed greatsword, iron fittings. |
| 5 | vk_gia_thuong | Giá thương | home_bookshelf_x4 | dot-4/gia_vu_khi | ~104 | A tall wooden rack holding four long spears and polearms upright: a plain spear, a winged spear, a halberd and a glaive, iron bands on the rack. |
| 6 | vk_gia_cung | Giá cung tên | home_bookshelf_x4 | dot-4/gia_vu_khi | ~84 | A wooden wall-standing rack with three hunting bows and a longbow hanging on pegs, two leather quivers full of arrows leaning below. |
| 7 | vk_thung_truong | Chum trượng phép | home_water_barrel_x4 | dot-2/thung_ruou_lon | ~80 | A wooden barrel with iron hoops holding several magic staffs and wands standing up: a gnarled wooden staff with a green gem, a blue crystal staff, a short wand with a gold star tip. |
| 8 | vk_gia_khien | Giá khiên | home_chest_x4 | dot-4/gia_giap | ~72 | A low wooden display stand with three shields leaning on it: a round wooden shield with iron rim, a steel kite shield with a blue and gold pattern, a small buckler. |

### Tiệm trang bị — mã `tb_`

Chất phòng: gỗ thông sáng, vải dạ đỏ thẫm, da thuộc, đồng thau; giáp / áo / giày bày gọn gàng.

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 9 | tb_tuong | Tường | home_wardrobe_x4 | dot-4/tuong_go_cua_hang | ~128 | A straight front-facing armor and outfit shop interior wall of warm light pine planks with a deep red felt panel in the middle, brass hooks holding a pair of leather gloves and a belt, thick pine posts on the left and right edges, a pine ceiling beam with brass trim along the top. |
| 10 | tb_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4 | dot-4/tuong_go_cua_hang | ~128 | The same light pine and red felt outfit shop wall with a tall window with small panes and short red curtains tied with brass rings, thick pine posts on the left and right edges, a pine ceiling beam with brass trim along the top. |
| 11 | tb_quay | Quầy trang bị | home_dining_table_x4 | dot-4/quay_hang | ~64 | A pine shop counter with a brass trim, folded leather tunics and a pair of boots on top, a measuring tape and a small brass bell, wide shape. |
| 12 | tb_gia_giap_sat | Giá giáp sắt | home_wardrobe_x4 | dot-4/gia_giap | ~96 | A simple wooden T-shaped armor stand (a plain post with a crossbar, no head) wearing a polished steel breastplate with shoulder plates, steel gauntlets hanging from the crossbar and greaves at the foot. |
| 13 | tb_gia_giap_da | Giá giáp da | home_wardrobe_x4 | dot-4/gia_giap | ~96 | A simple wooden T-shaped armor stand (a plain post with a crossbar, no head) wearing a brown studded leather vest with a belt and pouches, leather bracers on the crossbar and boots at the foot. |
| 14 | tb_gia_ao_choang | Giá áo choàng | home_wardrobe_x4 | dot-4/gia_vai | ~96 | A standing wooden clothes rack with three hanging garments: a long blue mage robe with gold trim, a green ranger cloak and a red traveling coat, all without hoods. |
| 15 | tb_ke_giay_gang | Kệ giày găng | home_bookshelf_x4 | dot-4/ke_hang | ~80 | A pine shelf unit with three shelves showing pairs of leather boots, steel sabatons, leather gloves and gauntlets, neatly arranged. |
| 16 | tb_tu_trang_suc | Tủ kính trang sức | home_chest_x4 | dot-3/ke_trung_bay | ~72 | A small glass display cabinet on a pine base showing rings, amulets with colored gems and a silver bracelet on red velvet. |

### Xưởng nâng cấp — mã `nc_`

Chất phòng: đá xám, gỗ sẫm, đồng, ánh rune lam và pha lê; nơi cường hoá vũ khí / trang bị (khác lò rèn bán / sửa).

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 17 | nc_tuong | Tường | home_wardrobe_x4 | dot-4/tuong_da_lo_ren | ~128 | A straight front-facing upgrade workshop interior wall of dark grey stone blocks with a large carved circle of softly glowing blue runes in the middle (geometric symbols, no letters), copper pipes running along it, thick dark wooden posts on the left and right edges, a heavy beam with copper fittings along the top. |
| 18 | nc_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4 | dot-4/tuong_da_lo_ren | ~128 | The same dark grey stone workshop wall with a round window of blue-tinted glass in a copper frame, a shelf of small glowing crystal vials beside it, thick dark wooden posts on the left and right edges, a heavy beam with copper fittings along the top. |
| 19 | nc_ban_khac_rune | Bàn khắc rune | home_dining_table_x4 | dot-4/ban_gia_kim | ~64 | A sturdy dark wooden workbench with a long sword lying on it, glowing blue rune lines being engraved along the blade, engraving tools, a magnifying lens on a brass arm and a jar of glowing ink. |
| 20 | nc_de_phep | Đe phép | home_chest_x4 | dot-4/de_bua | ~56 | A black iron anvil on a stone block with glowing blue runes on its side, a silver hammer resting on it and small blue sparks. |
| 21 | nc_lo_tinh_luyen | Lò tinh luyện pha lê | home_fireplace_x4 | dot-4/lo_ren | ~104 | A round stone furnace with copper bands and a chimney pipe, a small window showing bright blue magical flames inside, a crucible of glowing liquid crystal on top. |
| 22 | nc_ke_da_cuong_hoa | Kệ đá cường hoá | home_bookshelf_x4 | dot-4/ke_thuoc | ~88 | A dark wooden shelf with three shelves of upgrade stones: rough grey ore chunks, polished blue and green gems in small dishes, glowing purple and gold crystals in glass jars. |
| 23 | nc_vong_phap | Vòng phép cường hoá | home_rug_x4 | dot-3/tham_lon | ~48 | A flat round stone platform set into the floor with a glowing blue magic circle of geometric runes (no letters) and four small crystal posts at its edge, seen from slightly above, wide shape. |
| 24 | nc_bon_toi_phep | Bồn tôi phép | home_water_barrel_x4 | dot-4/thung_toi | ~52 | A stone basin with copper rim filled with glowing cyan liquid, wisps of light rising, a pair of iron tongs resting on the edge. |

## Khi xong

Báo chủ dự án số món đã vẽ và món nào chưa đạt (ghi rõ trong `prompts.json`: lề, sai tạo hình, hai mảng tường có ghép liền không,
có lọt mũ / mũ giáp / mũ trùm không). Claude chuẩn hoá (`scripts/gpt-normalize.py --height <cao>`), dựng sàn bằng code, ghép thử
3 phòng có chủ tiệm NPC đứng sau quầy để chủ dự án duyệt.

# Đề bài GPT vẽ — đợt 24: nhà dịch vụ + nội thất 7 phòng — Thánh Địa Bình Minh (12/11/2026)

Chủ dự án 12/11: "Giờ tiện cho promt các nhà ở vùng trung tâm các vùng, đồ vật trong phòng các vùng đi để nhờ gpt", "mỗi vùng
sẽ có style phòng rèn, ngân hàng, quán rượu style theo vùng", "Các phòng mỗi vùng sẽ theo style của vùng". Mỗi khu dân cư có 7 nhà
dịch vụ (quán rượu, ngân hàng, tiệm vũ khí, tiệm trang bị, lò rèn, xưởng nâng cấp, tiệm hồi phục), nhà nào cũng **vào được bên
trong** (map riêng, sàn dựng bằng code). Đợt này: Thánh Địa Bình Minh. Bộ Thistlewood bên trong đã có (đợt 2–5, 13) — dùng làm **mẫu khổ /
góc nhìn / độ to ô pixel**, KHÔNG chép vật liệu: mỗi vùng phải nhìn ra ngay là vùng nào.

**KHÔNG vẽ người / NPC / thú / chim / côn trùng / tượng / ma-nơ-canh / hình nộm.** Giá giáp là khung chữ T trơn, không đầu, không
mặt. **NGHIÊM CẤM đồ đội đầu (CHỐT 06/11):** không mũ, mũ giáp, mũ trùm, vương miện, mặt nạ ở bất cứ món nào, kể cả bày trên giá /
kệ / tường; áo choàng không mũ trùm. Biển hiệu chỉ là hình (cốc, đồng xu, kiếm chéo…), không chữ / số. **GIỮ STYLE MAP CŨ (CHỐT
05/11)** cho nhà bên ngoài: chép nét / viền / đổ bóng của ảnh mẫu `mau-tham-chieu/*_x4.png`.

Luật, nơi lưu, cách ghi `prompts.json` y như đợt 1 (`DE-BAI-DOT-1.md` mục "Luật bắt buộc"), rút kinh nghiệm đợt 3–13 (lề ≥ 5 %,
gửi kèm ảnh mẫu + ảnh đợt trước đã duyệt). Thư mục ra: `packages/asset-pipeline/sources/gpt-review/dot-24/`. Không sửa file
khác, không build, không commit.

## Đuôi prompt — đồ trong phòng (gắn sau mô tả của mọi món trong phòng)

```
Chunky chibi pixel art game sprite of indoor furniture in EXACTLY the same style as the attached references: front view with
a slight top-down angle, thick dark near-black outline around every shape, soft cel shading with 2–3 tones per material,
saturated colors, limited palette (at most 32 colors), crisp uniform square pixel blocks (every art pixel the same size, about
4×4 image pixels), no anti-aliasing, no gradients, no blur, no texture noise. One single object centered with at least 8% empty
space on every side, on a perfectly flat solid magenta #FF00FF background. No floor, no room, no cast shadow, no text, no letters,
no numbers, no labels, no price tags, no people, no human figures, no mannequins, no statues, no animals, no characters, no hats,
no helmets, no hoods, no crowns, no masks.
```

## Đuôi prompt — nhà bên ngoài (gắn sau mô tả của mọi món `*_nha_*`)

Ảnh khổ ngang 1536 × 1024. Gửi kèm ảnh ở cột "Ảnh mẫu" + công trình biểu tượng của vùng ở cột "Mẫu đợt trước" (bắt đúng chất vùng,
không chép bố cục). 7 nhà của một vùng phải cùng một bộ vật liệu / mái / cửa sổ để đứng cạnh nhau thành một khu phố; quán rượu
và ngân hàng to nhất.

```
Chunky chibi pixel art game sprite of one town building in EXACTLY the same style as the attached references: front view
with a slight top-down angle, thick dark near-black outline around every shape, soft cel shading with 2–3 tones per material,
saturated colors, limited palette (at most 32 colors), crisp uniform square pixel blocks (every art pixel the same size, about
3×3 image pixels), no anti-aliasing, no gradients, no blur, no texture noise. One single building centered with at least 6% empty
space on every side, on a perfectly flat solid magenta #FF00FF background. The front door is in the middle of the front face and
clearly visible. The base is a narrow flat strip of its own yard with a straight bottom edge. No cast shadow, no scenery, no sky,
no other buildings, no text, no letters, no numbers, no signs with writing, no people, no animals, no characters, no hats.
```

**Mảng tường** (`*_tuong`, `*_tuong_cua_so`): thẳng chính diện, hai mép trái / phải là cột dọc cắt phẳng, đỉnh là dầm / gờ trần
thẳng, đáy chân tường thẳng — cùng khổ và kiểu ghép với `dot-4/tuong_da_lo_ren.png`; hai mảng của cùng một phòng phải ghép liền nhau
(cùng cột, cùng gờ, cùng chân tường, cùng kích thước ảnh). **Vòng phép** (`*_nc_vong_phap`) nằm phẳng, rộng hơn cao.

## Danh sách

Nhân vật trong game cao ~80 px; ô sàn 32 px. Cột "Mẫu đợt trước" = ảnh gốc trong `dot-1/` … `dot-13/`. Ảnh mẫu ghi `*_x4` nằm
trong `mau-tham-chieu/`.

## Thánh Địa Bình Minh — Thánh Địa Bình Minh (cấp 30–40) — mã `bm_`

Chất vùng: đá trắng và vàng, hoa văn mặt trời, kính màu ấm, lụa trắng, hoa sen, nến.

### Nhà bên ngoài

| # | id | Nhà | Ảnh mẫu | Mẫu đợt trước | Cỡ trong game (rộng × cao) | Mô tả (dán trước đuôi nhà) |
|---|---|---|---|---|---|---|
| 1 | bm_nha_quan_ruou | Quán rượu | human_church_x4, light_crystal_tree_x4 | dot-12/as_den_binh_minh | ~340 × 300 | The town tavern and inn, the largest of the service buildings, two floors, warm light through many windows, a hanging emblem board shaped like a foaming mug (no letters), barrels and a bench by the door, built as a radiant white stone and gold building with a small golden dome, sunburst ornaments, warm stained-glass windows, white silk drapes and lotus planters. Front yard base: a white marble paving strip with lotus planters right at the foot. |
| 2 | bm_nha_ngan_hang | Ngân hàng | human_church_x4, light_crystal_tree_x4 | dot-12/as_den_binh_minh | ~300 × 280 | The town bank, a solid dignified building with a heavy reinforced front door, small barred windows, a hanging emblem board shaped like a gold coin (no letters), built as a radiant white stone and gold building with a small golden dome, sunburst ornaments, warm stained-glass windows, white silk drapes and lotus planters. Front yard base: a white marble paving strip with lotus planters right at the foot. |
| 3 | bm_nha_vu_khi | Tiệm vũ khí | human_church_x4, light_crystal_tree_x4 | dot-12/as_den_binh_minh | ~280 × 250 | The weapon shop, a hanging emblem board shaped like crossed swords (no letters), a rack of spears and bows under the porch roof, built as a radiant white stone and gold building with a small golden dome, sunburst ornaments, warm stained-glass windows, white silk drapes and lotus planters. Front yard base: a white marble paving strip with lotus planters right at the foot. |
| 4 | bm_nha_trang_bi | Tiệm trang bị | human_church_x4, light_crystal_tree_x4 | dot-12/as_den_binh_minh | ~280 × 250 | The armor and outfit shop, a hanging emblem board shaped like a chest armor plate (no letters), a display window with folded cloaks and boots, built as a radiant white stone and gold building with a small golden dome, sunburst ornaments, warm stained-glass windows, white silk drapes and lotus planters. Front yard base: a white marble paving strip with lotus planters right at the foot. |
| 5 | bm_nha_lo_ren | Lò rèn | human_church_x4, light_crystal_tree_x4 | dot-12/as_den_binh_minh | ~300 × 250 | The smithy, an open front corner under a lean-to roof with a glowing furnace and an anvil, a tall smoking chimney, built as a radiant white stone and gold building with a small golden dome, sunburst ornaments, warm stained-glass windows, white silk drapes and lotus planters. Front yard base: a white marble paving strip with lotus planters right at the foot. |
| 6 | bm_nha_nang_cap | Xưởng nâng cấp | human_church_x4, light_crystal_tree_x4 | dot-12/as_den_binh_minh | ~260 × 260 | The upgrade workshop, a round tower-like workshop with softly glowing rune circles on its walls (geometric symbols, no letters) and crystals on the roof, built as a radiant white stone and gold building with a small golden dome, sunburst ornaments, warm stained-glass windows, white silk drapes and lotus planters. Front yard base: a white marble paving strip with lotus planters right at the foot. |
| 7 | bm_nha_hoi_phuc | Tiệm hồi phục | human_church_x4, light_crystal_tree_x4 | dot-12/as_den_binh_minh | ~260 × 240 | The healer and potion shop, a calm building with a small herb garden box, hanging dried herbs, a hanging emblem board shaped like a leaf and a potion flask (no letters), built as a radiant white stone and gold building with a small golden dome, sunburst ornaments, warm stained-glass windows, white silk drapes and lotus planters. Front yard base: a white marble paving strip with lotus planters right at the foot. |

### Quán rượu — bên trong (`bm_qr_`)

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 8 | bm_qr_tuong | Tường | home_wardrobe_x4, light_golden_tree_x4 | dot-2/tuong_go_ke | ~128 | A straight front-facing tavern interior wall in the holy sanctuary of the dawn style: white stone with gold sunburst ornaments and a band of warm stained-glass colors, a shelf of mugs and white silk drapes, candles and lotus garlands, white stone pillars with gold sun capitals on the left and right edges, a white stone cornice with a gold sunray pattern along the top. |
| 9 | bm_qr_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4, light_golden_tree_x4 | dot-2/tuong_go_cua_so | ~128 | The same tavern wall of the holy sanctuary of the dawn style with an arched stained-glass window in gold, orange and pale yellow showing a sun pattern, white silk drapes, candles and lotus garlands beside it, the same edge posts and top beam. |
| 10 | bm_qr_quay_bar | Quầy bar | home_dining_table_x4, light_golden_tree_x4 | dot-2/quay_bar | ~64 | A long bar counter of white-lacquered wood with gold edges with gold trim, a row of mugs and bottles of honeyed sun-wine and pale golden nectar in white porcelain jugs on top, wide shape. |
| 11 | bm_qr_ke_ruou | Kệ rượu | home_bookshelf_x4, light_golden_tree_x4 | dot-2/ke_ruou | ~104 | A tall shelf of white-lacquered wood with gold edges full of honeyed sun-wine and pale golden nectar in white porcelain jugs, small casks on the bottom shelf, gold fittings. |
| 12 | bm_qr_dac_trung | Món chủ đạo quán | home_fireplace_x4, light_golden_tree_x4 | dot-2/lo_suoi_lon | ~96 | A white marble table with a golden sun ornament in the middle, candles and porcelain jugs. |
| 13 | bm_qr_ban_ghe | Bàn ghế quán | home_dining_table_x4, light_golden_tree_x4 | dot-2/ban_tron_ghe | ~56 | A round table of white-lacquered wood with gold edges with two matching stools on the left and right, two mugs and a plate of food on top. |

### Ngân hàng — bên trong (`bm_nh_`)

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 14 | bm_nh_tuong | Tường | home_wardrobe_x4, light_golden_tree_x4 | dot-2/tuong_thach_cao | ~128 | A straight front-facing bank interior wall in the holy sanctuary of the dawn style: white stone with gold sunburst ornaments and a band of warm stained-glass colors, a framed emblem of a gold coin (no letters) and gold trim, white stone pillars with gold sun capitals on the left and right edges, a white stone cornice with a gold sunray pattern along the top. |
| 15 | bm_nh_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4, light_golden_tree_x4 | dot-2/tuong_thach_cao | ~128 | The same bank wall of the holy sanctuary of the dawn style with an arched stained-glass window in gold, orange and pale yellow showing a sun pattern, iron bars across the window and gold trim, the same edge posts and top beam. |
| 16 | bm_nh_quay | Quầy giao dịch | home_dining_table_x4, light_golden_tree_x4 | dot-2/quay_giao_dich | ~64 | A sturdy bank counter of white-lacquered wood with gold edges with gold trim and a low grille, stacks of coins, a closed ledger book and small scales on top, wide shape. |
| 17 | bm_nh_cua_ket | Cửa két lớn | home_wardrobe_x4, light_golden_tree_x4 | dot-2/cua_ket_lon | ~120 | A round white and gold vault door shaped like a rising sun with gold ray bolts. |
| 18 | bm_nh_ruong_vang | Rương vàng | home_chest_x4, light_golden_tree_x4 | dot-2/chong_vang | ~60 | A white marble offering box with gold coins and glowing golden orbs. |
| 19 | bm_nh_ket_sat | Két sắt | home_chest_x4, light_golden_tree_x4 | dot-2/ket_sat | ~64 | A small heavy strongbox safe of gold on white-lacquered wood with gold edges feet, a dial lock and a keyhole, closed. |

### Tiệm vũ khí — bên trong (`bm_vk_`)

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 20 | bm_vk_tuong | Tường | home_wardrobe_x4, light_golden_tree_x4 | dot-13/vk_tuong | ~128 | A straight front-facing weapon shop interior wall in the holy sanctuary of the dawn style: white stone with gold sunburst ornaments and a band of warm stained-glass colors, two crossed swords and a spear on pegs, holy silver blades with gold sunburst guards, golden staffs with sun orbs, white bows, white stone pillars with gold sun capitals on the left and right edges, a white stone cornice with a gold sunray pattern along the top. |
| 21 | bm_vk_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4, light_golden_tree_x4 | dot-13/vk_tuong_cua_so | ~128 | The same weapon shop wall of the holy sanctuary of the dawn style with an arched stained-glass window in gold, orange and pale yellow showing a sun pattern, two daggers hanging on pegs beside it, the same edge posts and top beam. |
| 22 | bm_vk_quay | Quầy vũ khí | home_dining_table_x4, light_golden_tree_x4 | dot-13/vk_quay | ~64 | A long shop counter of white-lacquered wood with gold edges with a glass display case of daggers and short swords in the style of holy silver blades with gold sunburst guards, golden staffs with sun orbs, white bows, gold trim, wide shape. |
| 23 | bm_vk_gia_kiem_thuong | Giá kiếm + thương | home_bookshelf_x4, light_golden_tree_x4 | dot-13/vk_gia_thuong | ~104 | A tall weapon rack of white-lacquered wood with gold edges holding three swords and two long spears upright: holy silver blades with gold sunburst guards, golden staffs with sun orbs, white bows, gold fittings. |
| 24 | bm_vk_gia_cung_truong | Giá cung + trượng | home_bookshelf_x4, light_golden_tree_x4 | dot-13/vk_gia_cung | ~88 | A rack of white-lacquered wood with gold edges with two bows hanging on pegs and three magic staffs standing in a holder, a quiver of arrows, matching holy silver blades with gold sunburst guards, golden staffs with sun orbs, white bows. |
| 25 | bm_vk_gia_khien | Giá khiên | home_chest_x4, light_golden_tree_x4 | dot-13/vk_gia_khien | ~72 | A low display stand of white-lacquered wood with gold edges with three shields leaning on it in the style of holy silver blades with gold sunburst guards, golden staffs with sun orbs, white bows, gold rims. |

### Tiệm trang bị — bên trong (`bm_tb_`)

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 26 | bm_tb_tuong | Tường | home_wardrobe_x4, light_golden_tree_x4 | dot-13/tb_tuong | ~128 | A straight front-facing armor and outfit shop interior wall in the holy sanctuary of the dawn style: white stone with gold sunburst ornaments and a band of warm stained-glass colors, a pair of gloves and a belt on hooks, white stone pillars with gold sun capitals on the left and right edges, a white stone cornice with a gold sunray pattern along the top. |
| 27 | bm_tb_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4, light_golden_tree_x4 | dot-13/tb_tuong_cua_so | ~128 | The same armor and outfit shop wall of the holy sanctuary of the dawn style with an arched stained-glass window in gold, orange and pale yellow showing a sun pattern, short curtains tied at the sides, the same edge posts and top beam. |
| 28 | bm_tb_quay | Quầy trang bị | home_dining_table_x4, light_golden_tree_x4 | dot-13/tb_quay | ~64 | A shop counter of white-lacquered wood with gold edges with gold trim, folded tunics and a pair of boots on top made of white and gold plate, white silk robes with gold trim, wide shape. |
| 29 | bm_tb_gia_giap | Giá giáp | home_wardrobe_x4, light_golden_tree_x4 | dot-13/tb_gia_giap_sat | ~96 | A simple T-shaped armor stand of white-lacquered wood with gold edges (a plain post with a crossbar, no head, no face) wearing a chest armor of white and gold plate, white silk robes with gold trim, gauntlets on the crossbar and boots at the foot. |
| 30 | bm_tb_gia_ao | Giá áo choàng | home_wardrobe_x4, light_golden_tree_x4 | dot-13/tb_gia_ao_choang | ~96 | A standing clothes rack of white-lacquered wood with gold edges with three hanging robes and cloaks of white and gold plate, white silk robes with gold trim, all without hoods. |
| 31 | bm_tb_ke_giay_gang | Kệ giày găng | home_bookshelf_x4, light_golden_tree_x4 | dot-13/tb_ke_giay_gang | ~80 | A shelf unit of white-lacquered wood with gold edges with three shelves of boots, gloves and gauntlets made of white and gold plate, white silk robes with gold trim, neatly arranged. |

### Lò rèn — bên trong (`bm_lr_`)

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 32 | bm_lr_tuong | Tường | home_wardrobe_x4, light_golden_tree_x4 | dot-4/tuong_da_lo_ren | ~128 | A straight front-facing smithy interior wall in the holy sanctuary of the dawn style: white stone with gold sunburst ornaments and a band of warm stained-glass colors, tongs, hammers and horseshoes on hooks, a little soot, white stone pillars with gold sun capitals on the left and right edges, a white stone cornice with a gold sunray pattern along the top. |
| 33 | bm_lr_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4, light_golden_tree_x4 | dot-4/tuong_da_lo_ren | ~128 | The same smithy wall of the holy sanctuary of the dawn style with an arched stained-glass window in gold, orange and pale yellow showing a sun pattern, a rack of iron bars beside it, the same edge posts and top beam. |
| 34 | bm_lr_lo_ren | Lò rèn | home_fireplace_x4, light_golden_tree_x4 | dot-4/lo_ren | ~110 | A white stone forge with golden holy flames, a gold bellows and a sun-shaped chimney cap. |
| 35 | bm_lr_de_bua | Đe + búa | home_chest_x4, light_golden_tree_x4 | dot-4/de_bua | ~56 | A black iron anvil on a block of white-lacquered wood with gold edges with a hammer resting on it and a half-forged blade, a few sparks. |
| 36 | bm_lr_thung_toi | Thùng tôi | home_water_barrel_x4, light_golden_tree_x4 | dot-4/thung_toi | ~52 | A quenching tub of white-lacquered wood with gold edges with gold bands full of dark water with a little steam, iron tongs on the rim. |
| 37 | bm_lr_gia_dung_cu | Giá dụng cụ + quặng | home_bookshelf_x4, light_golden_tree_x4 | dot-4/gia_vu_khi | ~84 | A rack of white-lacquered wood with gold edges with smith tools on hooks and crates of raw ore and metal ingots below, gold fittings. |

### Xưởng nâng cấp — bên trong (`bm_nc_`)

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 38 | bm_nc_tuong | Tường | home_wardrobe_x4, light_golden_tree_x4 | dot-13/nc_tuong | ~128 | A straight front-facing upgrade workshop interior wall in the holy sanctuary of the dawn style: white stone with gold sunburst ornaments and a band of warm stained-glass colors, a large carved circle of softly glowing warm golden runes in the middle (geometric symbols, no letters), white stone pillars with gold sun capitals on the left and right edges, a white stone cornice with a gold sunray pattern along the top. |
| 39 | bm_nc_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4, light_golden_tree_x4 | dot-13/nc_tuong_cua_so | ~128 | The same upgrade workshop wall of the holy sanctuary of the dawn style with an arched stained-glass window in gold, orange and pale yellow showing a sun pattern, a shelf of small glowing warm golden crystal vials beside it, the same edge posts and top beam. |
| 40 | bm_nc_ban_khac_rune | Bàn khắc rune | home_dining_table_x4, light_golden_tree_x4 | dot-13/nc_ban_khac_rune | ~64 | A sturdy workbench of white-lacquered wood with gold edges with a sword lying on it, warm golden rune lines being engraved along the blade, engraving tools and a jar of glowing ink. |
| 41 | bm_nc_lo_tinh_luyen | Lò tinh luyện | home_fireplace_x4, light_golden_tree_x4 | dot-13/nc_lo_tinh_luyen | ~104 | A round refining furnace in the holy sanctuary of the dawn style with gold bands, a small window of bright warm golden magical flames, a crucible of glowing liquid crystal on top. |
| 42 | bm_nc_vong_phap | Vòng phép cường hoá | home_rug_x4, light_golden_tree_x4 | dot-13/nc_vong_phap | ~48 | A flat round platform set into the floor with a glowing warm golden magic circle of geometric runes (no letters) and four small crystal posts at its edge, seen from slightly above, wide flat shape. |
| 43 | bm_nc_ke_da | Kệ đá cường hoá | home_bookshelf_x4, light_golden_tree_x4 | dot-13/nc_ke_da_cuong_hoa | ~88 | A shelf of white-lacquered wood with gold edges with three shelves of upgrade stones: rough ore chunks, polished gems in small dishes, glowing warm golden crystals in glass jars. |

### Tiệm hồi phục — bên trong (`bm_hp_`)

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 44 | bm_hp_tuong | Tường | home_wardrobe_x4, light_golden_tree_x4 | dot-4/tuong_go_tiem_thuoc | ~128 | A straight front-facing healer and potion shop interior wall in the holy sanctuary of the dawn style: white stone with gold sunburst ornaments and a band of warm stained-glass colors, bundles of dried herbs and a row of small potion bottles on a shelf, white stone pillars with gold sun capitals on the left and right edges, a white stone cornice with a gold sunray pattern along the top. |
| 45 | bm_hp_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4, light_golden_tree_x4 | dot-4/tuong_go_tiem_thuoc | ~128 | The same healer and potion shop wall of the holy sanctuary of the dawn style with an arched stained-glass window in gold, orange and pale yellow showing a sun pattern, a pot of herbs on the sill, the same edge posts and top beam. |
| 46 | bm_hp_quay | Quầy thuốc | home_dining_table_x4, light_golden_tree_x4 | dot-4/quay_hang | ~64 | A shop counter of white-lacquered wood with gold edges with a mortar and pestle, red and blue potion bottles, rolled bandages and a small scale, wide shape. |
| 47 | bm_hp_ke_thuoc | Kệ thuốc | home_bookshelf_x4, light_golden_tree_x4 | dot-4/ke_thuoc | ~96 | A tall shelf of white-lacquered wood with gold edges full of red health potions, blue energy potions, jars of herbs and small boxes, gold fittings. |
| 48 | bm_hp_noi_thuoc | Nồi điều chế | home_stove_x4, light_golden_tree_x4 | dot-4/noi_luyen_thuoc | ~64 | A brewing cauldron in the holy sanctuary of the dawn style bubbling with a red healing potion over a small fire, a ladle and herbs beside it. |
| 49 | bm_hp_dac_trung | Món chủ đạo tiệm | home_potted_plant_x4, light_golden_tree_x4 | dot-4/gia_phoi_thao_duoc | ~80 | A golden lotus fountain with glowing healing water and white candles around it. |

## Khi xong

Báo chủ dự án: đợt nào, số món đã vẽ, món nào chưa đạt (ghi rõ trong `prompts.json`: lề, sai tạo hình, hai mảng tường có ghép liền
không, có lọt mũ / mũ giáp / mũ trùm / chữ không, có giống bộ Thistlewood quá không). Claude chuẩn hoá (`scripts/gpt-normalize.py
--height <cao>`), xếp 7 nhà thành khu phố trên nền đất vùng, dựng sàn bằng code và ghép thử 7 phòng để chủ dự án duyệt.

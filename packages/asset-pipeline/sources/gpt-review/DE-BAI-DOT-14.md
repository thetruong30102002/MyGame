# Đề bài GPT vẽ — đợt 14: nhà dịch vụ + nội thất 7 phòng — Thị trấn Thistlewood, Làng nhà sàn Lau Xám (12/11/2026)

Chủ dự án 12/11: "Giờ tiện cho promt các nhà ở vùng trung tâm các vùng, đồ vật trong phòng các vùng đi để nhờ gpt", "mỗi vùng
sẽ có style phòng rèn, ngân hàng, quán rượu style theo vùng", "Các phòng mỗi vùng sẽ theo style của vùng". Mỗi khu dân cư có 7 nhà
dịch vụ (quán rượu, ngân hàng, tiệm vũ khí, tiệm trang bị, lò rèn, xưởng nâng cấp, tiệm hồi phục), nhà nào cũng **vào được bên
trong** (map riêng, sàn dựng bằng code). Đợt này: Thị trấn Thistlewood (chỉ 7 nhà bên ngoài) + Làng nhà sàn Lau Xám. Bộ Thistlewood bên trong đã có (đợt 2–5, 13) — dùng làm **mẫu khổ /
góc nhìn / độ to ô pixel**, KHÔNG chép vật liệu: mỗi vùng phải nhìn ra ngay là vùng nào.

**KHÔNG vẽ người / NPC / thú / chim / côn trùng / tượng / ma-nơ-canh / hình nộm.** Giá giáp là khung chữ T trơn, không đầu, không
mặt. **NGHIÊM CẤM đồ đội đầu (CHỐT 06/11):** không mũ, mũ giáp, mũ trùm, vương miện, mặt nạ ở bất cứ món nào, kể cả bày trên giá /
kệ / tường; áo choàng không mũ trùm. Biển hiệu chỉ là hình (cốc, đồng xu, kiếm chéo…), không chữ / số. **GIỮ STYLE MAP CŨ (CHỐT
05/11)** cho nhà bên ngoài: chép nét / viền / đổ bóng của ảnh mẫu `mau-tham-chieu/*_x4.png`.

Luật, nơi lưu, cách ghi `prompts.json` y như đợt 1 (`DE-BAI-DOT-1.md` mục "Luật bắt buộc"), rút kinh nghiệm đợt 3–13 (lề ≥ 5 %,
gửi kèm ảnh mẫu + ảnh đợt trước đã duyệt). Thư mục ra: `packages/asset-pipeline/sources/gpt-review/dot-14/`. Không sửa file
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

## Thị trấn Thistlewood — Thung lũng Thistlewood (cấp 1–10) — mã `tl_`

Chất vùng: gỗ sồi khung, đá kem, mái ngói xanh rêu, mộc mạc trung cổ ấm áp.

### Nhà bên ngoài

| # | id | Nhà | Ảnh mẫu | Mẫu đợt trước | Cỡ trong game (rộng × cao) | Mô tả (dán trước đuôi nhà) |
|---|---|---|---|---|---|---|
| 1 | tl_nha_quan_ruou | Quán rượu | human_house_store_x4, human_house_inn_x4 | dot-1/tl_toa_thi_chinh | ~340 × 300 | The town tavern and inn, the largest of the service buildings, two floors, warm light through many windows, a hanging emblem board shaped like a foaming mug (no letters), barrels and a bench by the door, built as a cozy medieval timber-framed building of oak beams and cream stone, moss-green tiled roof, small paned windows with flower boxes. Front yard base: a short cobblestone yard with a few flowers right at the foot. |
| 2 | tl_nha_ngan_hang | Ngân hàng | human_house_store_x4, human_house_inn_x4 | dot-1/tl_toa_thi_chinh | ~300 × 280 | The town bank, a solid dignified building with a heavy reinforced front door, small barred windows, a hanging emblem board shaped like a gold coin (no letters), built as a cozy medieval timber-framed building of oak beams and cream stone, moss-green tiled roof, small paned windows with flower boxes. Front yard base: a short cobblestone yard with a few flowers right at the foot. |
| 3 | tl_nha_vu_khi | Tiệm vũ khí | human_house_store_x4, human_house_inn_x4 | dot-1/tl_toa_thi_chinh | ~280 × 250 | The weapon shop, a hanging emblem board shaped like crossed swords (no letters), a rack of spears and bows under the porch roof, built as a cozy medieval timber-framed building of oak beams and cream stone, moss-green tiled roof, small paned windows with flower boxes. Front yard base: a short cobblestone yard with a few flowers right at the foot. |
| 4 | tl_nha_trang_bi | Tiệm trang bị | human_house_store_x4, human_house_inn_x4 | dot-1/tl_toa_thi_chinh | ~280 × 250 | The armor and outfit shop, a hanging emblem board shaped like a chest armor plate (no letters), a display window with folded cloaks and boots, built as a cozy medieval timber-framed building of oak beams and cream stone, moss-green tiled roof, small paned windows with flower boxes. Front yard base: a short cobblestone yard with a few flowers right at the foot. |
| 5 | tl_nha_lo_ren | Lò rèn | human_house_store_x4, human_house_inn_x4 | dot-1/tl_toa_thi_chinh | ~300 × 250 | The smithy, an open front corner under a lean-to roof with a glowing furnace and an anvil, a tall smoking chimney, built as a cozy medieval timber-framed building of oak beams and cream stone, moss-green tiled roof, small paned windows with flower boxes. Front yard base: a short cobblestone yard with a few flowers right at the foot. |
| 6 | tl_nha_nang_cap | Xưởng nâng cấp | human_house_store_x4, human_house_inn_x4 | dot-1/tl_toa_thi_chinh | ~260 × 260 | The upgrade workshop, a round tower-like workshop with softly glowing rune circles on its walls (geometric symbols, no letters) and crystals on the roof, built as a cozy medieval timber-framed building of oak beams and cream stone, moss-green tiled roof, small paned windows with flower boxes. Front yard base: a short cobblestone yard with a few flowers right at the foot. |
| 7 | tl_nha_hoi_phuc | Tiệm hồi phục | human_house_store_x4, human_house_inn_x4 | dot-1/tl_toa_thi_chinh | ~260 × 240 | The healer and potion shop, a calm building with a small herb garden box, hanging dried herbs, a hanging emblem board shaped like a leaf and a potion flask (no letters), built as a cozy medieval timber-framed building of oak beams and cream stone, moss-green tiled roof, small paned windows with flower boxes. Front yard base: a short cobblestone yard with a few flowers right at the foot. |

## Làng nhà sàn Lau Xám — Đầm lầy Mù Sương (cấp 10–20) — mã `lx_`

Chất vùng: nhà sàn gỗ chống ẩm xám lục, mái sậy, dây thừng buộc, chiếu lau đan, đèn dầu ánh lục, thảo dược và cá khô treo.

### Nhà bên ngoài

| # | id | Nhà | Ảnh mẫu | Mẫu đợt trước | Cỡ trong game (rộng × cao) | Mô tả (dán trước đuôi nhà) |
|---|---|---|---|---|---|---|
| 8 | lx_nha_quan_ruou | Quán rượu | swamp_longhouse_x4, swamp_willow_x4 | dot-1/dl_dai_sanh_nha_san | ~340 × 300 | The town tavern and inn, the largest of the service buildings, two floors, warm light through many windows, a hanging emblem board shaped like a foaming mug (no letters), barrels and a bench by the door, built as a stilt house standing on thick dark wooden piles above a little boardwalk, weathered grey-green planks lashed with rope, a steep reed-thatch roof, round reed-mat shutters, green-glass oil lanterns. Front yard base: a narrow wooden boardwalk platform with reeds and lily pads at its edges. |
| 9 | lx_nha_ngan_hang | Ngân hàng | swamp_longhouse_x4, swamp_willow_x4 | dot-1/dl_dai_sanh_nha_san | ~300 × 280 | The town bank, a solid dignified building with a heavy reinforced front door, small barred windows, a hanging emblem board shaped like a gold coin (no letters), built as a stilt house standing on thick dark wooden piles above a little boardwalk, weathered grey-green planks lashed with rope, a steep reed-thatch roof, round reed-mat shutters, green-glass oil lanterns. Front yard base: a narrow wooden boardwalk platform with reeds and lily pads at its edges. |
| 10 | lx_nha_vu_khi | Tiệm vũ khí | swamp_longhouse_x4, swamp_willow_x4 | dot-1/dl_dai_sanh_nha_san | ~280 × 250 | The weapon shop, a hanging emblem board shaped like crossed swords (no letters), a rack of spears and bows under the porch roof, built as a stilt house standing on thick dark wooden piles above a little boardwalk, weathered grey-green planks lashed with rope, a steep reed-thatch roof, round reed-mat shutters, green-glass oil lanterns. Front yard base: a narrow wooden boardwalk platform with reeds and lily pads at its edges. |
| 11 | lx_nha_trang_bi | Tiệm trang bị | swamp_longhouse_x4, swamp_willow_x4 | dot-1/dl_dai_sanh_nha_san | ~280 × 250 | The armor and outfit shop, a hanging emblem board shaped like a chest armor plate (no letters), a display window with folded cloaks and boots, built as a stilt house standing on thick dark wooden piles above a little boardwalk, weathered grey-green planks lashed with rope, a steep reed-thatch roof, round reed-mat shutters, green-glass oil lanterns. Front yard base: a narrow wooden boardwalk platform with reeds and lily pads at its edges. |
| 12 | lx_nha_lo_ren | Lò rèn | swamp_longhouse_x4, swamp_willow_x4 | dot-1/dl_dai_sanh_nha_san | ~300 × 250 | The smithy, an open front corner under a lean-to roof with a glowing furnace and an anvil, a tall smoking chimney, built as a stilt house standing on thick dark wooden piles above a little boardwalk, weathered grey-green planks lashed with rope, a steep reed-thatch roof, round reed-mat shutters, green-glass oil lanterns. Front yard base: a narrow wooden boardwalk platform with reeds and lily pads at its edges. |
| 13 | lx_nha_nang_cap | Xưởng nâng cấp | swamp_longhouse_x4, swamp_willow_x4 | dot-1/dl_dai_sanh_nha_san | ~260 × 260 | The upgrade workshop, a round tower-like workshop with softly glowing rune circles on its walls (geometric symbols, no letters) and crystals on the roof, built as a stilt house standing on thick dark wooden piles above a little boardwalk, weathered grey-green planks lashed with rope, a steep reed-thatch roof, round reed-mat shutters, green-glass oil lanterns. Front yard base: a narrow wooden boardwalk platform with reeds and lily pads at its edges. |
| 14 | lx_nha_hoi_phuc | Tiệm hồi phục | swamp_longhouse_x4, swamp_willow_x4 | dot-1/dl_dai_sanh_nha_san | ~260 × 240 | The healer and potion shop, a calm building with a small herb garden box, hanging dried herbs, a hanging emblem board shaped like a leaf and a potion flask (no letters), built as a stilt house standing on thick dark wooden piles above a little boardwalk, weathered grey-green planks lashed with rope, a steep reed-thatch roof, round reed-mat shutters, green-glass oil lanterns. Front yard base: a narrow wooden boardwalk platform with reeds and lily pads at its edges. |

### Quán rượu — bên trong (`lx_qr_`)

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 15 | lx_qr_tuong | Tường | home_wardrobe_x4, swamp_longhouse_x4 | dot-2/tuong_go_ke | ~128 | A straight front-facing tavern interior wall in the misty swamp stilt village style: weathered grey-green wooden planks lashed with rope over a lower half of woven reed mats, a shelf of mugs and bundles of dried reeds, herbs and small dried fish, thick dark round wooden stilt posts wrapped with rope on the left and right edges, a rough round log beam with rope lashings along the top. |
| 16 | lx_qr_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4, swamp_longhouse_x4 | dot-2/tuong_go_cua_so | ~128 | The same tavern wall of the misty swamp stilt village style with a round window with a woven reed shutter propped open, misty green light outside, bundles of dried reeds, herbs and small dried fish beside it, the same edge posts and top beam. |
| 17 | lx_qr_quay_bar | Quầy bar | home_dining_table_x4, swamp_longhouse_x4 | dot-2/quay_bar | ~64 | A long bar counter of weathered grey-green driftwood with dark iron and rope trim, a row of mugs and bottles of murky green swamp brew and herbal liquor in clay jugs on top, wide shape. |
| 18 | lx_qr_ke_ruou | Kệ rượu | home_bookshelf_x4, swamp_longhouse_x4 | dot-2/ke_ruou | ~104 | A tall shelf of weathered grey-green driftwood full of murky green swamp brew and herbal liquor in clay jugs, small casks on the bottom shelf, dark iron and rope fittings. |
| 19 | lx_qr_dac_trung | Món chủ đạo quán | home_fireplace_x4, swamp_longhouse_x4 | dot-2/lo_suoi_lon | ~96 | A big round clay stove on a stone slab with a bubbling pot of fish stew, hanging dried fish and a green oil lamp above. |
| 20 | lx_qr_ban_ghe | Bàn ghế quán | home_dining_table_x4, swamp_longhouse_x4 | dot-2/ban_tron_ghe | ~56 | A round table of weathered grey-green driftwood with two matching stools on the left and right, two mugs and a plate of food on top. |

### Ngân hàng — bên trong (`lx_nh_`)

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 21 | lx_nh_tuong | Tường | home_wardrobe_x4, swamp_longhouse_x4 | dot-2/tuong_thach_cao | ~128 | A straight front-facing bank interior wall in the misty swamp stilt village style: weathered grey-green wooden planks lashed with rope over a lower half of woven reed mats, a framed emblem of a gold coin (no letters) and dark iron and rope trim, thick dark round wooden stilt posts wrapped with rope on the left and right edges, a rough round log beam with rope lashings along the top. |
| 22 | lx_nh_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4, swamp_longhouse_x4 | dot-2/tuong_thach_cao | ~128 | The same bank wall of the misty swamp stilt village style with a round window with a woven reed shutter propped open, misty green light outside, iron bars across the window and dark iron and rope trim, the same edge posts and top beam. |
| 23 | lx_nh_quay | Quầy giao dịch | home_dining_table_x4, swamp_longhouse_x4 | dot-2/quay_giao_dich | ~64 | A sturdy bank counter of weathered grey-green driftwood with dark iron and rope trim and a low grille, stacks of coins, a closed ledger book and small scales on top, wide shape. |
| 24 | lx_nh_cua_ket | Cửa két lớn | home_wardrobe_x4, swamp_longhouse_x4 | dot-2/cua_ket_lon | ~120 | A round vault door made of thick dark wood planks bound with iron bands and rope, a big wooden wheel lock, set in a mossy stone frame. |
| 25 | lx_nh_ruong_vang | Rương vàng | home_chest_x4, swamp_longhouse_x4 | dot-2/chong_vang | ~60 | A stack of waterproof clay coin jars sealed with wax and rope, on a low wooden pallet. |
| 26 | lx_nh_ket_sat | Két sắt | home_chest_x4, swamp_longhouse_x4 | dot-2/ket_sat | ~64 | A small heavy strongbox safe of dark iron and rope on weathered grey-green driftwood feet, a dial lock and a keyhole, closed. |

### Tiệm vũ khí — bên trong (`lx_vk_`)

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 27 | lx_vk_tuong | Tường | home_wardrobe_x4, swamp_longhouse_x4 | dot-13/vk_tuong | ~128 | A straight front-facing weapon shop interior wall in the misty swamp stilt village style: weathered grey-green wooden planks lashed with rope over a lower half of woven reed mats, two crossed swords and a spear on pegs, bone-white wooden hilts wrapped in reed cord, leaf-shaped blades, thick dark round wooden stilt posts wrapped with rope on the left and right edges, a rough round log beam with rope lashings along the top. |
| 28 | lx_vk_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4, swamp_longhouse_x4 | dot-13/vk_tuong_cua_so | ~128 | The same weapon shop wall of the misty swamp stilt village style with a round window with a woven reed shutter propped open, misty green light outside, two daggers hanging on pegs beside it, the same edge posts and top beam. |
| 29 | lx_vk_quay | Quầy vũ khí | home_dining_table_x4, swamp_longhouse_x4 | dot-13/vk_quay | ~64 | A long shop counter of weathered grey-green driftwood with a glass display case of daggers and short swords in the style of bone-white wooden hilts wrapped in reed cord, leaf-shaped blades, dark iron and rope trim, wide shape. |
| 30 | lx_vk_gia_kiem_thuong | Giá kiếm + thương | home_bookshelf_x4, swamp_longhouse_x4 | dot-13/vk_gia_thuong | ~104 | A tall weapon rack of weathered grey-green driftwood holding three swords and two long spears upright: bone-white wooden hilts wrapped in reed cord, leaf-shaped blades, dark iron and rope fittings. |
| 31 | lx_vk_gia_cung_truong | Giá cung + trượng | home_bookshelf_x4, swamp_longhouse_x4 | dot-13/vk_gia_cung | ~88 | A rack of weathered grey-green driftwood with two bows hanging on pegs and three magic staffs standing in a holder, a quiver of arrows, matching bone-white wooden hilts wrapped in reed cord, leaf-shaped blades. |
| 32 | lx_vk_gia_khien | Giá khiên | home_chest_x4, swamp_longhouse_x4 | dot-13/vk_gia_khien | ~72 | A low display stand of weathered grey-green driftwood with three shields leaning on it in the style of bone-white wooden hilts wrapped in reed cord, leaf-shaped blades, dark iron and rope rims. |

### Tiệm trang bị — bên trong (`lx_tb_`)

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 33 | lx_tb_tuong | Tường | home_wardrobe_x4, swamp_longhouse_x4 | dot-13/tb_tuong | ~128 | A straight front-facing armor and outfit shop interior wall in the misty swamp stilt village style: weathered grey-green wooden planks lashed with rope over a lower half of woven reed mats, a pair of gloves and a belt on hooks, thick dark round wooden stilt posts wrapped with rope on the left and right edges, a rough round log beam with rope lashings along the top. |
| 34 | lx_tb_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4, swamp_longhouse_x4 | dot-13/tb_tuong_cua_so | ~128 | The same armor and outfit shop wall of the misty swamp stilt village style with a round window with a woven reed shutter propped open, misty green light outside, short curtains tied at the sides, the same edge posts and top beam. |
| 35 | lx_tb_quay | Quầy trang bị | home_dining_table_x4, swamp_longhouse_x4 | dot-13/tb_quay | ~64 | A shop counter of weathered grey-green driftwood with dark iron and rope trim, folded tunics and a pair of boots on top made of green-dyed leather and reed-woven padding, wide shape. |
| 36 | lx_tb_gia_giap | Giá giáp | home_wardrobe_x4, swamp_longhouse_x4 | dot-13/tb_gia_giap_sat | ~96 | A simple T-shaped armor stand of weathered grey-green driftwood (a plain post with a crossbar, no head, no face) wearing a chest armor of green-dyed leather and reed-woven padding, gauntlets on the crossbar and boots at the foot. |
| 37 | lx_tb_gia_ao | Giá áo choàng | home_wardrobe_x4, swamp_longhouse_x4 | dot-13/tb_gia_ao_choang | ~96 | A standing clothes rack of weathered grey-green driftwood with three hanging robes and cloaks of green-dyed leather and reed-woven padding, all without hoods. |
| 38 | lx_tb_ke_giay_gang | Kệ giày găng | home_bookshelf_x4, swamp_longhouse_x4 | dot-13/tb_ke_giay_gang | ~80 | A shelf unit of weathered grey-green driftwood with three shelves of boots, gloves and gauntlets made of green-dyed leather and reed-woven padding, neatly arranged. |

### Lò rèn — bên trong (`lx_lr_`)

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 39 | lx_lr_tuong | Tường | home_wardrobe_x4, swamp_longhouse_x4 | dot-4/tuong_da_lo_ren | ~128 | A straight front-facing smithy interior wall in the misty swamp stilt village style: weathered grey-green wooden planks lashed with rope over a lower half of woven reed mats, tongs, hammers and horseshoes on hooks, a little soot, thick dark round wooden stilt posts wrapped with rope on the left and right edges, a rough round log beam with rope lashings along the top. |
| 40 | lx_lr_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4, swamp_longhouse_x4 | dot-4/tuong_da_lo_ren | ~128 | The same smithy wall of the misty swamp stilt village style with a round window with a woven reed shutter propped open, misty green light outside, a rack of iron bars beside it, the same edge posts and top beam. |
| 41 | lx_lr_lo_ren | Lò rèn | home_fireplace_x4, swamp_longhouse_x4 | dot-4/lo_ren | ~110 | A low clay-and-stone forge on wooden stilts legs with a reed bellows, glowing orange coals and a crooked clay chimney. |
| 42 | lx_lr_de_bua | Đe + búa | home_chest_x4, swamp_longhouse_x4 | dot-4/de_bua | ~56 | A black iron anvil on a block of weathered grey-green driftwood with a hammer resting on it and a half-forged blade, a few sparks. |
| 43 | lx_lr_thung_toi | Thùng tôi | home_water_barrel_x4, swamp_longhouse_x4 | dot-4/thung_toi | ~52 | A quenching tub of weathered grey-green driftwood with dark iron and rope bands full of dark water with a little steam, iron tongs on the rim. |
| 44 | lx_lr_gia_dung_cu | Giá dụng cụ + quặng | home_bookshelf_x4, swamp_longhouse_x4 | dot-4/gia_vu_khi | ~84 | A rack of weathered grey-green driftwood with smith tools on hooks and crates of raw ore and metal ingots below, dark iron and rope fittings. |

### Xưởng nâng cấp — bên trong (`lx_nc_`)

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 45 | lx_nc_tuong | Tường | home_wardrobe_x4, swamp_longhouse_x4 | dot-13/nc_tuong | ~128 | A straight front-facing upgrade workshop interior wall in the misty swamp stilt village style: weathered grey-green wooden planks lashed with rope over a lower half of woven reed mats, a large carved circle of softly glowing soft green runes in the middle (geometric symbols, no letters), thick dark round wooden stilt posts wrapped with rope on the left and right edges, a rough round log beam with rope lashings along the top. |
| 46 | lx_nc_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4, swamp_longhouse_x4 | dot-13/nc_tuong_cua_so | ~128 | The same upgrade workshop wall of the misty swamp stilt village style with a round window with a woven reed shutter propped open, misty green light outside, a shelf of small glowing soft green crystal vials beside it, the same edge posts and top beam. |
| 47 | lx_nc_ban_khac_rune | Bàn khắc rune | home_dining_table_x4, swamp_longhouse_x4 | dot-13/nc_ban_khac_rune | ~64 | A sturdy workbench of weathered grey-green driftwood with a sword lying on it, soft green rune lines being engraved along the blade, engraving tools and a jar of glowing ink. |
| 48 | lx_nc_lo_tinh_luyen | Lò tinh luyện | home_fireplace_x4, swamp_longhouse_x4 | dot-13/nc_lo_tinh_luyen | ~104 | A round refining furnace in the misty swamp stilt village style with dark iron and rope bands, a small window of bright soft green magical flames, a crucible of glowing liquid crystal on top. |
| 49 | lx_nc_vong_phap | Vòng phép cường hoá | home_rug_x4, swamp_longhouse_x4 | dot-13/nc_vong_phap | ~48 | A flat round platform set into the floor with a glowing soft green magic circle of geometric runes (no letters) and four small crystal posts at its edge, seen from slightly above, wide flat shape. |
| 50 | lx_nc_ke_da | Kệ đá cường hoá | home_bookshelf_x4, swamp_longhouse_x4 | dot-13/nc_ke_da_cuong_hoa | ~88 | A shelf of weathered grey-green driftwood with three shelves of upgrade stones: rough ore chunks, polished gems in small dishes, glowing soft green crystals in glass jars. |

### Tiệm hồi phục — bên trong (`lx_hp_`)

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 51 | lx_hp_tuong | Tường | home_wardrobe_x4, swamp_longhouse_x4 | dot-4/tuong_go_tiem_thuoc | ~128 | A straight front-facing healer and potion shop interior wall in the misty swamp stilt village style: weathered grey-green wooden planks lashed with rope over a lower half of woven reed mats, bundles of dried herbs and a row of small potion bottles on a shelf, thick dark round wooden stilt posts wrapped with rope on the left and right edges, a rough round log beam with rope lashings along the top. |
| 52 | lx_hp_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4, swamp_longhouse_x4 | dot-4/tuong_go_tiem_thuoc | ~128 | The same healer and potion shop wall of the misty swamp stilt village style with a round window with a woven reed shutter propped open, misty green light outside, a pot of herbs on the sill, the same edge posts and top beam. |
| 53 | lx_hp_quay | Quầy thuốc | home_dining_table_x4, swamp_longhouse_x4 | dot-4/quay_hang | ~64 | A shop counter of weathered grey-green driftwood with a mortar and pestle, red and blue potion bottles, rolled bandages and a small scale, wide shape. |
| 54 | lx_hp_ke_thuoc | Kệ thuốc | home_bookshelf_x4, swamp_longhouse_x4 | dot-4/ke_thuoc | ~96 | A tall shelf of weathered grey-green driftwood full of red health potions, blue energy potions, jars of herbs and small boxes, dark iron and rope fittings. |
| 55 | lx_hp_noi_thuoc | Nồi điều chế | home_stove_x4, swamp_longhouse_x4 | dot-4/noi_luyen_thuoc | ~64 | A brewing cauldron in the misty swamp stilt village style bubbling with a red healing potion over a small fire, a ladle and herbs beside it. |
| 56 | lx_hp_dac_trung | Món chủ đạo tiệm | home_potted_plant_x4, swamp_longhouse_x4 | dot-4/gia_phoi_thao_duoc | ~80 | A wooden drying rack hung with antidote herbs, swamp roots and bottles of green antidote. |

## Khi xong

Báo chủ dự án: đợt nào, số món đã vẽ, món nào chưa đạt (ghi rõ trong `prompts.json`: lề, sai tạo hình, hai mảng tường có ghép liền
không, có lọt mũ / mũ giáp / mũ trùm / chữ không, có giống bộ Thistlewood quá không). Claude chuẩn hoá (`scripts/gpt-normalize.py
--height <cao>`), xếp 7 nhà thành khu phố trên nền đất vùng, dựng sàn bằng code và ghép thử 7 phòng để chủ dự án duyệt.

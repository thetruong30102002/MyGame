# Đề bài GPT vẽ — đợt 15: nhà dịch vụ + nội thất 7 phòng — Thành ốc đảo Sahrin (12/11/2026)

Chủ dự án 12/11: "Giờ tiện cho promt các nhà ở vùng trung tâm các vùng, đồ vật trong phòng các vùng đi để nhờ gpt", "mỗi vùng
sẽ có style phòng rèn, ngân hàng, quán rượu style theo vùng", "Các phòng mỗi vùng sẽ theo style của vùng". Mỗi khu dân cư có 7 nhà
dịch vụ (quán rượu, ngân hàng, tiệm vũ khí, tiệm trang bị, lò rèn, xưởng nâng cấp, tiệm hồi phục), nhà nào cũng **vào được bên
trong** (map riêng, sàn dựng bằng code). Đợt này: Thành ốc đảo Sahrin. Bộ Thistlewood bên trong đã có (đợt 2–5, 13) — dùng làm **mẫu khổ /
góc nhìn / độ to ô pixel**, KHÔNG chép vật liệu: mỗi vùng phải nhìn ra ngay là vùng nào.

**KHÔNG vẽ người / NPC / thú / chim / côn trùng / tượng / ma-nơ-canh / hình nộm.** Giá giáp là khung chữ T trơn, không đầu, không
mặt. **NGHIÊM CẤM đồ đội đầu (CHỐT 06/11):** không mũ, mũ giáp, mũ trùm, vương miện, mặt nạ ở bất cứ món nào, kể cả bày trên giá /
kệ / tường; áo choàng không mũ trùm. Biển hiệu chỉ là hình (cốc, đồng xu, kiếm chéo…), không chữ / số. **GIỮ STYLE MAP CŨ (CHỐT
05/11)** cho nhà bên ngoài: chép nét / viền / đổ bóng của ảnh mẫu `mau-tham-chieu/*_x4.png`.

Luật, nơi lưu, cách ghi `prompts.json` y như đợt 1 (`DE-BAI-DOT-1.md` mục "Luật bắt buộc"), rút kinh nghiệm đợt 3–13 (lề ≥ 5 %,
gửi kèm ảnh mẫu + ảnh đợt trước đã duyệt). Thư mục ra: `packages/asset-pipeline/sources/gpt-review/dot-15/`. Không sửa file
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

## Thành ốc đảo Sahrin — Sa mạc Hồng Cát (cấp 20–30) — mã `sa_`

Chất vùng: sa thạch đỏ, vòm mái, gạch men lam, đèn đồng chạm sao, thảm dệt, vải lanh.

### Nhà bên ngoài

| # | id | Nhà | Ảnh mẫu | Mẫu đợt trước | Cỡ trong game (rộng × cao) | Mô tả (dán trước đuôi nhà) |
|---|---|---|---|---|---|---|
| 1 | sa_nha_quan_ruou | Quán rượu | desert_dome_house_x4, desert_palm_x4 | dot-1/sm_cung_dien_oc_dao | ~340 × 300 | The town tavern and inn, the largest of the service buildings, two floors, warm light through many windows, a hanging emblem board shaped like a foaming mug (no letters), barrels and a bench by the door, built as a red sandstone building with a white-plastered onion dome, pointed arch doorway, blue glazed tile bands, carved wooden lattice windows, cloth awnings. Front yard base: a flat sandstone paving strip with a few potted palms right at the foot. |
| 2 | sa_nha_ngan_hang | Ngân hàng | desert_dome_house_x4, desert_palm_x4 | dot-1/sm_cung_dien_oc_dao | ~300 × 280 | The town bank, a solid dignified building with a heavy reinforced front door, small barred windows, a hanging emblem board shaped like a gold coin (no letters), built as a red sandstone building with a white-plastered onion dome, pointed arch doorway, blue glazed tile bands, carved wooden lattice windows, cloth awnings. Front yard base: a flat sandstone paving strip with a few potted palms right at the foot. |
| 3 | sa_nha_vu_khi | Tiệm vũ khí | desert_dome_house_x4, desert_palm_x4 | dot-1/sm_cung_dien_oc_dao | ~280 × 250 | The weapon shop, a hanging emblem board shaped like crossed swords (no letters), a rack of spears and bows under the porch roof, built as a red sandstone building with a white-plastered onion dome, pointed arch doorway, blue glazed tile bands, carved wooden lattice windows, cloth awnings. Front yard base: a flat sandstone paving strip with a few potted palms right at the foot. |
| 4 | sa_nha_trang_bi | Tiệm trang bị | desert_dome_house_x4, desert_palm_x4 | dot-1/sm_cung_dien_oc_dao | ~280 × 250 | The armor and outfit shop, a hanging emblem board shaped like a chest armor plate (no letters), a display window with folded cloaks and boots, built as a red sandstone building with a white-plastered onion dome, pointed arch doorway, blue glazed tile bands, carved wooden lattice windows, cloth awnings. Front yard base: a flat sandstone paving strip with a few potted palms right at the foot. |
| 5 | sa_nha_lo_ren | Lò rèn | desert_dome_house_x4, desert_palm_x4 | dot-1/sm_cung_dien_oc_dao | ~300 × 250 | The smithy, an open front corner under a lean-to roof with a glowing furnace and an anvil, a tall smoking chimney, built as a red sandstone building with a white-plastered onion dome, pointed arch doorway, blue glazed tile bands, carved wooden lattice windows, cloth awnings. Front yard base: a flat sandstone paving strip with a few potted palms right at the foot. |
| 6 | sa_nha_nang_cap | Xưởng nâng cấp | desert_dome_house_x4, desert_palm_x4 | dot-1/sm_cung_dien_oc_dao | ~260 × 260 | The upgrade workshop, a round tower-like workshop with softly glowing rune circles on its walls (geometric symbols, no letters) and crystals on the roof, built as a red sandstone building with a white-plastered onion dome, pointed arch doorway, blue glazed tile bands, carved wooden lattice windows, cloth awnings. Front yard base: a flat sandstone paving strip with a few potted palms right at the foot. |
| 7 | sa_nha_hoi_phuc | Tiệm hồi phục | desert_dome_house_x4, desert_palm_x4 | dot-1/sm_cung_dien_oc_dao | ~260 × 240 | The healer and potion shop, a calm building with a small herb garden box, hanging dried herbs, a hanging emblem board shaped like a leaf and a potion flask (no letters), built as a red sandstone building with a white-plastered onion dome, pointed arch doorway, blue glazed tile bands, carved wooden lattice windows, cloth awnings. Front yard base: a flat sandstone paving strip with a few potted palms right at the foot. |

### Quán rượu — bên trong (`sa_qr_`)

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 8 | sa_qr_tuong | Tường | home_wardrobe_x4, desert_dome_house_x4 | dot-2/tuong_go_ke | ~128 | A straight front-facing tavern interior wall in the desert oasis city style: smooth red sandstone blocks with a band of blue and white glazed geometric tiles, a shelf of mugs and brass lanterns with star-shaped cutouts and woven carpets, carved sandstone pilasters with blue tile caps on the left and right edges, a carved cedar beam with a blue tile frieze along the top. |
| 9 | sa_qr_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4, desert_dome_house_x4 | dot-2/tuong_go_cua_so | ~128 | The same tavern wall of the desert oasis city style with a pointed-arch window with a carved wooden lattice screen and warm sunlight, brass lanterns with star-shaped cutouts and woven carpets beside it, the same edge posts and top beam. |
| 10 | sa_qr_quay_bar | Quầy bar | home_dining_table_x4, desert_dome_house_x4 | dot-2/quay_bar | ~64 | A long bar counter of dark carved cedar with polished brass trim, a row of mugs and bottles of date wine and spiced tea in brass pots and painted glass bottles on top, wide shape. |
| 11 | sa_qr_ke_ruou | Kệ rượu | home_bookshelf_x4, desert_dome_house_x4 | dot-2/ke_ruou | ~104 | A tall shelf of dark carved cedar full of date wine and spiced tea in brass pots and painted glass bottles, small casks on the bottom shelf, polished brass fittings. |
| 12 | sa_qr_dac_trung | Món chủ đạo quán | home_fireplace_x4, desert_dome_house_x4 | dot-2/lo_suoi_lon | ~96 | A low brass tea table with a tall brass teapot, cushions around it and a hookah-free incense burner, under a hanging star lantern. |
| 13 | sa_qr_ban_ghe | Bàn ghế quán | home_dining_table_x4, desert_dome_house_x4 | dot-2/ban_tron_ghe | ~56 | A round table of dark carved cedar with two matching stools on the left and right, two mugs and a plate of food on top. |

### Ngân hàng — bên trong (`sa_nh_`)

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 14 | sa_nh_tuong | Tường | home_wardrobe_x4, desert_dome_house_x4 | dot-2/tuong_thach_cao | ~128 | A straight front-facing bank interior wall in the desert oasis city style: smooth red sandstone blocks with a band of blue and white glazed geometric tiles, a framed emblem of a gold coin (no letters) and polished brass trim, carved sandstone pilasters with blue tile caps on the left and right edges, a carved cedar beam with a blue tile frieze along the top. |
| 15 | sa_nh_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4, desert_dome_house_x4 | dot-2/tuong_thach_cao | ~128 | The same bank wall of the desert oasis city style with a pointed-arch window with a carved wooden lattice screen and warm sunlight, iron bars across the window and polished brass trim, the same edge posts and top beam. |
| 16 | sa_nh_quay | Quầy giao dịch | home_dining_table_x4, desert_dome_house_x4 | dot-2/quay_giao_dich | ~64 | A sturdy bank counter of dark carved cedar with polished brass trim and a low grille, stacks of coins, a closed ledger book and small scales on top, wide shape. |
| 17 | sa_nh_cua_ket | Cửa két lớn | home_wardrobe_x4, desert_dome_house_x4 | dot-2/cua_ket_lon | ~120 | A huge round brass vault door with sun-ray engravings and blue enamel inlay, in a sandstone arch. |
| 18 | sa_nh_ruong_vang | Rương vàng | home_chest_x4, desert_dome_house_x4 | dot-2/chong_vang | ~60 | A carved cedar money-changer table with brass scales, stacks of gold coins and small velvet bags. |
| 19 | sa_nh_ket_sat | Két sắt | home_chest_x4, desert_dome_house_x4 | dot-2/ket_sat | ~64 | A small heavy strongbox safe of polished brass on dark carved cedar feet, a dial lock and a keyhole, closed. |

### Tiệm vũ khí — bên trong (`sa_vk_`)

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 20 | sa_vk_tuong | Tường | home_wardrobe_x4, desert_dome_house_x4 | dot-13/vk_tuong | ~128 | A straight front-facing weapon shop interior wall in the desert oasis city style: smooth red sandstone blocks with a band of blue and white glazed geometric tiles, two crossed swords and a spear on pegs, curved scimitars, brass-capped spears and recurve bows, carved sandstone pilasters with blue tile caps on the left and right edges, a carved cedar beam with a blue tile frieze along the top. |
| 21 | sa_vk_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4, desert_dome_house_x4 | dot-13/vk_tuong_cua_so | ~128 | The same weapon shop wall of the desert oasis city style with a pointed-arch window with a carved wooden lattice screen and warm sunlight, two daggers hanging on pegs beside it, the same edge posts and top beam. |
| 22 | sa_vk_quay | Quầy vũ khí | home_dining_table_x4, desert_dome_house_x4 | dot-13/vk_quay | ~64 | A long shop counter of dark carved cedar with a glass display case of daggers and short swords in the style of curved scimitars, brass-capped spears and recurve bows, polished brass trim, wide shape. |
| 23 | sa_vk_gia_kiem_thuong | Giá kiếm + thương | home_bookshelf_x4, desert_dome_house_x4 | dot-13/vk_gia_thuong | ~104 | A tall weapon rack of dark carved cedar holding three swords and two long spears upright: curved scimitars, brass-capped spears and recurve bows, polished brass fittings. |
| 24 | sa_vk_gia_cung_truong | Giá cung + trượng | home_bookshelf_x4, desert_dome_house_x4 | dot-13/vk_gia_cung | ~88 | A rack of dark carved cedar with two bows hanging on pegs and three magic staffs standing in a holder, a quiver of arrows, matching curved scimitars, brass-capped spears and recurve bows. |
| 25 | sa_vk_gia_khien | Giá khiên | home_chest_x4, desert_dome_house_x4 | dot-13/vk_gia_khien | ~72 | A low display stand of dark carved cedar with three shields leaning on it in the style of curved scimitars, brass-capped spears and recurve bows, polished brass rims. |

### Tiệm trang bị — bên trong (`sa_tb_`)

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 26 | sa_tb_tuong | Tường | home_wardrobe_x4, desert_dome_house_x4 | dot-13/tb_tuong | ~128 | A straight front-facing armor and outfit shop interior wall in the desert oasis city style: smooth red sandstone blocks with a band of blue and white glazed geometric tiles, a pair of gloves and a belt on hooks, carved sandstone pilasters with blue tile caps on the left and right edges, a carved cedar beam with a blue tile frieze along the top. |
| 27 | sa_tb_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4, desert_dome_house_x4 | dot-13/tb_tuong_cua_so | ~128 | The same armor and outfit shop wall of the desert oasis city style with a pointed-arch window with a carved wooden lattice screen and warm sunlight, short curtains tied at the sides, the same edge posts and top beam. |
| 28 | sa_tb_quay | Quầy trang bị | home_dining_table_x4, desert_dome_house_x4 | dot-13/tb_quay | ~64 | A shop counter of dark carved cedar with polished brass trim, folded tunics and a pair of boots on top made of light linen robes, bronze scale vests and sashes, wide shape. |
| 29 | sa_tb_gia_giap | Giá giáp | home_wardrobe_x4, desert_dome_house_x4 | dot-13/tb_gia_giap_sat | ~96 | A simple T-shaped armor stand of dark carved cedar (a plain post with a crossbar, no head, no face) wearing a chest armor of light linen robes, bronze scale vests and sashes, gauntlets on the crossbar and boots at the foot. |
| 30 | sa_tb_gia_ao | Giá áo choàng | home_wardrobe_x4, desert_dome_house_x4 | dot-13/tb_gia_ao_choang | ~96 | A standing clothes rack of dark carved cedar with three hanging robes and cloaks of light linen robes, bronze scale vests and sashes, all without hoods. |
| 31 | sa_tb_ke_giay_gang | Kệ giày găng | home_bookshelf_x4, desert_dome_house_x4 | dot-13/tb_ke_giay_gang | ~80 | A shelf unit of dark carved cedar with three shelves of boots, gloves and gauntlets made of light linen robes, bronze scale vests and sashes, neatly arranged. |

### Lò rèn — bên trong (`sa_lr_`)

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 32 | sa_lr_tuong | Tường | home_wardrobe_x4, desert_dome_house_x4 | dot-4/tuong_da_lo_ren | ~128 | A straight front-facing smithy interior wall in the desert oasis city style: smooth red sandstone blocks with a band of blue and white glazed geometric tiles, tongs, hammers and horseshoes on hooks, a little soot, carved sandstone pilasters with blue tile caps on the left and right edges, a carved cedar beam with a blue tile frieze along the top. |
| 33 | sa_lr_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4, desert_dome_house_x4 | dot-4/tuong_da_lo_ren | ~128 | The same smithy wall of the desert oasis city style with a pointed-arch window with a carved wooden lattice screen and warm sunlight, a rack of iron bars beside it, the same edge posts and top beam. |
| 34 | sa_lr_lo_ren | Lò rèn | home_fireplace_x4, desert_dome_house_x4 | dot-4/lo_ren | ~110 | A domed sandstone forge with blue tile trim, a glowing furnace mouth, brass bellows and a short chimney. |
| 35 | sa_lr_de_bua | Đe + búa | home_chest_x4, desert_dome_house_x4 | dot-4/de_bua | ~56 | A black iron anvil on a block of dark carved cedar with a hammer resting on it and a half-forged blade, a few sparks. |
| 36 | sa_lr_thung_toi | Thùng tôi | home_water_barrel_x4, desert_dome_house_x4 | dot-4/thung_toi | ~52 | A quenching tub of dark carved cedar with polished brass bands full of dark water with a little steam, iron tongs on the rim. |
| 37 | sa_lr_gia_dung_cu | Giá dụng cụ + quặng | home_bookshelf_x4, desert_dome_house_x4 | dot-4/gia_vu_khi | ~84 | A rack of dark carved cedar with smith tools on hooks and crates of raw ore and metal ingots below, polished brass fittings. |

### Xưởng nâng cấp — bên trong (`sa_nc_`)

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 38 | sa_nc_tuong | Tường | home_wardrobe_x4, desert_dome_house_x4 | dot-13/nc_tuong | ~128 | A straight front-facing upgrade workshop interior wall in the desert oasis city style: smooth red sandstone blocks with a band of blue and white glazed geometric tiles, a large carved circle of softly glowing warm amber runes in the middle (geometric symbols, no letters), carved sandstone pilasters with blue tile caps on the left and right edges, a carved cedar beam with a blue tile frieze along the top. |
| 39 | sa_nc_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4, desert_dome_house_x4 | dot-13/nc_tuong_cua_so | ~128 | The same upgrade workshop wall of the desert oasis city style with a pointed-arch window with a carved wooden lattice screen and warm sunlight, a shelf of small glowing warm amber crystal vials beside it, the same edge posts and top beam. |
| 40 | sa_nc_ban_khac_rune | Bàn khắc rune | home_dining_table_x4, desert_dome_house_x4 | dot-13/nc_ban_khac_rune | ~64 | A sturdy workbench of dark carved cedar with a sword lying on it, warm amber rune lines being engraved along the blade, engraving tools and a jar of glowing ink. |
| 41 | sa_nc_lo_tinh_luyen | Lò tinh luyện | home_fireplace_x4, desert_dome_house_x4 | dot-13/nc_lo_tinh_luyen | ~104 | A round refining furnace in the desert oasis city style with polished brass bands, a small window of bright warm amber magical flames, a crucible of glowing liquid crystal on top. |
| 42 | sa_nc_vong_phap | Vòng phép cường hoá | home_rug_x4, desert_dome_house_x4 | dot-13/nc_vong_phap | ~48 | A flat round platform set into the floor with a glowing warm amber magic circle of geometric runes (no letters) and four small crystal posts at its edge, seen from slightly above, wide flat shape. |
| 43 | sa_nc_ke_da | Kệ đá cường hoá | home_bookshelf_x4, desert_dome_house_x4 | dot-13/nc_ke_da_cuong_hoa | ~88 | A shelf of dark carved cedar with three shelves of upgrade stones: rough ore chunks, polished gems in small dishes, glowing warm amber crystals in glass jars. |

### Tiệm hồi phục — bên trong (`sa_hp_`)

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 44 | sa_hp_tuong | Tường | home_wardrobe_x4, desert_dome_house_x4 | dot-4/tuong_go_tiem_thuoc | ~128 | A straight front-facing healer and potion shop interior wall in the desert oasis city style: smooth red sandstone blocks with a band of blue and white glazed geometric tiles, bundles of dried herbs and a row of small potion bottles on a shelf, carved sandstone pilasters with blue tile caps on the left and right edges, a carved cedar beam with a blue tile frieze along the top. |
| 45 | sa_hp_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4, desert_dome_house_x4 | dot-4/tuong_go_tiem_thuoc | ~128 | The same healer and potion shop wall of the desert oasis city style with a pointed-arch window with a carved wooden lattice screen and warm sunlight, a pot of herbs on the sill, the same edge posts and top beam. |
| 46 | sa_hp_quay | Quầy thuốc | home_dining_table_x4, desert_dome_house_x4 | dot-4/quay_hang | ~64 | A shop counter of dark carved cedar with a mortar and pestle, red and blue potion bottles, rolled bandages and a small scale, wide shape. |
| 47 | sa_hp_ke_thuoc | Kệ thuốc | home_bookshelf_x4, desert_dome_house_x4 | dot-4/ke_thuoc | ~96 | A tall shelf of dark carved cedar full of red health potions, blue energy potions, jars of herbs and small boxes, polished brass fittings. |
| 48 | sa_hp_noi_thuoc | Nồi điều chế | home_stove_x4, desert_dome_house_x4 | dot-4/noi_luyen_thuoc | ~64 | A brewing cauldron in the desert oasis city style bubbling with a red healing potion over a small fire, a ladle and herbs beside it. |
| 49 | sa_hp_dac_trung | Món chủ đạo tiệm | home_potted_plant_x4, desert_dome_house_x4 | dot-4/gia_phoi_thao_duoc | ~80 | A small blue-tiled fountain basin with clear healing water and brass cups. |

## Khi xong

Báo chủ dự án: đợt nào, số món đã vẽ, món nào chưa đạt (ghi rõ trong `prompts.json`: lề, sai tạo hình, hai mảng tường có ghép liền
không, có lọt mũ / mũ giáp / mũ trùm / chữ không, có giống bộ Thistlewood quá không). Claude chuẩn hoá (`scripts/gpt-normalize.py
--height <cao>`), xếp 7 nhà thành khu phố trên nền đất vùng, dựng sàn bằng code và ghép thử 7 phòng để chủ dự án duyệt.

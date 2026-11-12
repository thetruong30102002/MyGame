# Đề bài GPT vẽ — đợt 18: nhà dịch vụ + nội thất 7 phòng — Pháo đài người lùn Đe Đỏ (12/11/2026)

Chủ dự án 12/11: "Giờ tiện cho promt các nhà ở vùng trung tâm các vùng, đồ vật trong phòng các vùng đi để nhờ gpt", "mỗi vùng
sẽ có style phòng rèn, ngân hàng, quán rượu style theo vùng", "Các phòng mỗi vùng sẽ theo style của vùng". Mỗi khu dân cư có 7 nhà
dịch vụ (quán rượu, ngân hàng, tiệm vũ khí, tiệm trang bị, lò rèn, xưởng nâng cấp, tiệm hồi phục), nhà nào cũng **vào được bên
trong** (map riêng, sàn dựng bằng code). Đợt này: Pháo đài người lùn Đe Đỏ. Bộ Thistlewood bên trong đã có (đợt 2–5, 13) — dùng làm **mẫu khổ /
góc nhìn / độ to ô pixel**, KHÔNG chép vật liệu: mỗi vùng phải nhìn ra ngay là vùng nào.

**KHÔNG vẽ người / NPC / thú / chim / côn trùng / tượng / ma-nơ-canh / hình nộm.** Giá giáp là khung chữ T trơn, không đầu, không
mặt. **NGHIÊM CẤM đồ đội đầu (CHỐT 06/11):** không mũ, mũ giáp, mũ trùm, vương miện, mặt nạ ở bất cứ món nào, kể cả bày trên giá /
kệ / tường; áo choàng không mũ trùm. Biển hiệu chỉ là hình (cốc, đồng xu, kiếm chéo…), không chữ / số. **GIỮ STYLE MAP CŨ (CHỐT
05/11)** cho nhà bên ngoài: chép nét / viền / đổ bóng của ảnh mẫu `mau-tham-chieu/*_x4.png`.

Luật, nơi lưu, cách ghi `prompts.json` y như đợt 1 (`DE-BAI-DOT-1.md` mục "Luật bắt buộc"), rút kinh nghiệm đợt 3–13 (lề ≥ 5 %,
gửi kèm ảnh mẫu + ảnh đợt trước đã duyệt). Thư mục ra: `packages/asset-pipeline/sources/gpt-review/dot-18/`. Không sửa file
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

## Pháo đài người lùn Đe Đỏ — Núi lửa Hoả Sơn (cấp 50–60) — mã `dd_`

Chất vùng: đá bazan đen, đồng thau, sắt đinh tán, rãnh dung nham phát sáng, hoa văn hình học người lùn, ánh cam.

### Nhà bên ngoài

| # | id | Nhà | Ảnh mẫu | Mẫu đợt trước | Cỡ trong game (rộng × cao) | Mô tả (dán trước đuôi nhà) |
|---|---|---|---|---|---|---|
| 1 | dd_nha_quan_ruou | Quán rượu | volcano_dwarf_house_x4, volcano_great_forge_x4 | dot-1/nl_dai_lo_ren | ~340 × 300 | The town tavern and inn, the largest of the service buildings, two floors, warm light through many windows, a hanging emblem board shaped like a foaming mug (no letters), barrels and a bench by the door, built as a massive squat dwarven building carved from dark basalt with huge square pillars, brass-riveted doors, glowing orange forge windows, brass pipes and smoking chimneys. Front yard base: a dark basalt paving strip with a thin glowing lava crack right at the foot. |
| 2 | dd_nha_ngan_hang | Ngân hàng | volcano_dwarf_house_x4, volcano_great_forge_x4 | dot-1/nl_dai_lo_ren | ~300 × 280 | The town bank, a solid dignified building with a heavy reinforced front door, small barred windows, a hanging emblem board shaped like a gold coin (no letters), built as a massive squat dwarven building carved from dark basalt with huge square pillars, brass-riveted doors, glowing orange forge windows, brass pipes and smoking chimneys. Front yard base: a dark basalt paving strip with a thin glowing lava crack right at the foot. |
| 3 | dd_nha_vu_khi | Tiệm vũ khí | volcano_dwarf_house_x4, volcano_great_forge_x4 | dot-1/nl_dai_lo_ren | ~280 × 250 | The weapon shop, a hanging emblem board shaped like crossed swords (no letters), a rack of spears and bows under the porch roof, built as a massive squat dwarven building carved from dark basalt with huge square pillars, brass-riveted doors, glowing orange forge windows, brass pipes and smoking chimneys. Front yard base: a dark basalt paving strip with a thin glowing lava crack right at the foot. |
| 4 | dd_nha_trang_bi | Tiệm trang bị | volcano_dwarf_house_x4, volcano_great_forge_x4 | dot-1/nl_dai_lo_ren | ~280 × 250 | The armor and outfit shop, a hanging emblem board shaped like a chest armor plate (no letters), a display window with folded cloaks and boots, built as a massive squat dwarven building carved from dark basalt with huge square pillars, brass-riveted doors, glowing orange forge windows, brass pipes and smoking chimneys. Front yard base: a dark basalt paving strip with a thin glowing lava crack right at the foot. |
| 5 | dd_nha_lo_ren | Lò rèn | volcano_dwarf_house_x4, volcano_great_forge_x4 | dot-1/nl_dai_lo_ren | ~300 × 250 | The smithy, an open front corner under a lean-to roof with a glowing furnace and an anvil, a tall smoking chimney, built as a massive squat dwarven building carved from dark basalt with huge square pillars, brass-riveted doors, glowing orange forge windows, brass pipes and smoking chimneys. Front yard base: a dark basalt paving strip with a thin glowing lava crack right at the foot. |
| 6 | dd_nha_nang_cap | Xưởng nâng cấp | volcano_dwarf_house_x4, volcano_great_forge_x4 | dot-1/nl_dai_lo_ren | ~260 × 260 | The upgrade workshop, a round tower-like workshop with softly glowing rune circles on its walls (geometric symbols, no letters) and crystals on the roof, built as a massive squat dwarven building carved from dark basalt with huge square pillars, brass-riveted doors, glowing orange forge windows, brass pipes and smoking chimneys. Front yard base: a dark basalt paving strip with a thin glowing lava crack right at the foot. |
| 7 | dd_nha_hoi_phuc | Tiệm hồi phục | volcano_dwarf_house_x4, volcano_great_forge_x4 | dot-1/nl_dai_lo_ren | ~260 × 240 | The healer and potion shop, a calm building with a small herb garden box, hanging dried herbs, a hanging emblem board shaped like a leaf and a potion flask (no letters), built as a massive squat dwarven building carved from dark basalt with huge square pillars, brass-riveted doors, glowing orange forge windows, brass pipes and smoking chimneys. Front yard base: a dark basalt paving strip with a thin glowing lava crack right at the foot. |

### Quán rượu — bên trong (`dd_qr_`)

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 8 | dd_qr_tuong | Tường | home_wardrobe_x4, volcano_dwarf_house_x4 | dot-2/tuong_go_ke | ~128 | A straight front-facing tavern interior wall in the dwarven volcanic fortress style: huge dark basalt blocks with brass bands and geometric dwarven carvings, a thin glowing orange lava groove along the bottom, a shelf of mugs and brass pipes, chains and hammers, square basalt pillars with brass caps and rivets on the left and right edges, a heavy riveted iron girder beam with brass bolts along the top. |
| 9 | dd_qr_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4, volcano_dwarf_house_x4 | dot-2/tuong_go_cua_so | ~128 | The same tavern wall of the dwarven volcanic fortress style with a small round brass porthole window with thick glass glowing orange, brass pipes, chains and hammers beside it, the same edge posts and top beam. |
| 10 | dd_qr_quay_bar | Quầy bar | home_dining_table_x4, volcano_dwarf_house_x4 | dot-2/quay_bar | ~64 | A long bar counter of blackened oak with iron straps with riveted brass and iron trim, a row of mugs and bottles of dark stout ale in huge iron-banded kegs and stone tankards on top, wide shape. |
| 11 | dd_qr_ke_ruou | Kệ rượu | home_bookshelf_x4, volcano_dwarf_house_x4 | dot-2/ke_ruou | ~104 | A tall shelf of blackened oak with iron straps full of dark stout ale in huge iron-banded kegs and stone tankards, small casks on the bottom shelf, riveted brass and iron fittings. |
| 12 | dd_qr_dac_trung | Món chủ đạo quán | home_fireplace_x4, volcano_dwarf_house_x4 | dot-2/lo_suoi_lon | ~96 | A giant iron-banded ale keg on a stone cradle with a brass tap and stone tankards lined up below it. |
| 13 | dd_qr_ban_ghe | Bàn ghế quán | home_dining_table_x4, volcano_dwarf_house_x4 | dot-2/ban_tron_ghe | ~56 | A round table of blackened oak with iron straps with two matching stools on the left and right, two mugs and a plate of food on top. |

### Ngân hàng — bên trong (`dd_nh_`)

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 14 | dd_nh_tuong | Tường | home_wardrobe_x4, volcano_dwarf_house_x4 | dot-2/tuong_thach_cao | ~128 | A straight front-facing bank interior wall in the dwarven volcanic fortress style: huge dark basalt blocks with brass bands and geometric dwarven carvings, a thin glowing orange lava groove along the bottom, a framed emblem of a gold coin (no letters) and riveted brass and iron trim, square basalt pillars with brass caps and rivets on the left and right edges, a heavy riveted iron girder beam with brass bolts along the top. |
| 15 | dd_nh_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4, volcano_dwarf_house_x4 | dot-2/tuong_thach_cao | ~128 | The same bank wall of the dwarven volcanic fortress style with a small round brass porthole window with thick glass glowing orange, iron bars across the window and riveted brass and iron trim, the same edge posts and top beam. |
| 16 | dd_nh_quay | Quầy giao dịch | home_dining_table_x4, volcano_dwarf_house_x4 | dot-2/quay_giao_dich | ~64 | A sturdy bank counter of blackened oak with iron straps with riveted brass and iron trim and a low grille, stacks of coins, a closed ledger book and small scales on top, wide shape. |
| 17 | dd_nh_cua_ket | Cửa két lớn | home_wardrobe_x4, volcano_dwarf_house_x4 | dot-2/cua_ket_lon | ~120 | A colossal round brass vault door with gear-wheel bolts and rivets, set into a basalt wall, glowing orange seams. |
| 18 | dd_nh_ruong_vang | Rương vàng | home_chest_x4, volcano_dwarf_house_x4 | dot-2/chong_vang | ~60 | A basalt pedestal with stacked gold ingots and gems under a brass cage. |
| 19 | dd_nh_ket_sat | Két sắt | home_chest_x4, volcano_dwarf_house_x4 | dot-2/ket_sat | ~64 | A small heavy strongbox safe of riveted brass and iron on blackened oak with iron straps feet, a dial lock and a keyhole, closed. |

### Tiệm vũ khí — bên trong (`dd_vk_`)

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 20 | dd_vk_tuong | Tường | home_wardrobe_x4, volcano_dwarf_house_x4 | dot-13/vk_tuong | ~128 | A straight front-facing weapon shop interior wall in the dwarven volcanic fortress style: huge dark basalt blocks with brass bands and geometric dwarven carvings, a thin glowing orange lava groove along the bottom, two crossed swords and a spear on pegs, heavy rune-etched dwarven blades, brass-banded spears and iron tower shields, square basalt pillars with brass caps and rivets on the left and right edges, a heavy riveted iron girder beam with brass bolts along the top. |
| 21 | dd_vk_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4, volcano_dwarf_house_x4 | dot-13/vk_tuong_cua_so | ~128 | The same weapon shop wall of the dwarven volcanic fortress style with a small round brass porthole window with thick glass glowing orange, two daggers hanging on pegs beside it, the same edge posts and top beam. |
| 22 | dd_vk_quay | Quầy vũ khí | home_dining_table_x4, volcano_dwarf_house_x4 | dot-13/vk_quay | ~64 | A long shop counter of blackened oak with iron straps with a glass display case of daggers and short swords in the style of heavy rune-etched dwarven blades, brass-banded spears and iron tower shields, riveted brass and iron trim, wide shape. |
| 23 | dd_vk_gia_kiem_thuong | Giá kiếm + thương | home_bookshelf_x4, volcano_dwarf_house_x4 | dot-13/vk_gia_thuong | ~104 | A tall weapon rack of blackened oak with iron straps holding three swords and two long spears upright: heavy rune-etched dwarven blades, brass-banded spears and iron tower shields, riveted brass and iron fittings. |
| 24 | dd_vk_gia_cung_truong | Giá cung + trượng | home_bookshelf_x4, volcano_dwarf_house_x4 | dot-13/vk_gia_cung | ~88 | A rack of blackened oak with iron straps with two bows hanging on pegs and three magic staffs standing in a holder, a quiver of arrows, matching heavy rune-etched dwarven blades, brass-banded spears and iron tower shields. |
| 25 | dd_vk_gia_khien | Giá khiên | home_chest_x4, volcano_dwarf_house_x4 | dot-13/vk_gia_khien | ~72 | A low display stand of blackened oak with iron straps with three shields leaning on it in the style of heavy rune-etched dwarven blades, brass-banded spears and iron tower shields, riveted brass and iron rims. |

### Tiệm trang bị — bên trong (`dd_tb_`)

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 26 | dd_tb_tuong | Tường | home_wardrobe_x4, volcano_dwarf_house_x4 | dot-13/tb_tuong | ~128 | A straight front-facing armor and outfit shop interior wall in the dwarven volcanic fortress style: huge dark basalt blocks with brass bands and geometric dwarven carvings, a thin glowing orange lava groove along the bottom, a pair of gloves and a belt on hooks, square basalt pillars with brass caps and rivets on the left and right edges, a heavy riveted iron girder beam with brass bolts along the top. |
| 27 | dd_tb_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4, volcano_dwarf_house_x4 | dot-13/tb_tuong_cua_so | ~128 | The same armor and outfit shop wall of the dwarven volcanic fortress style with a small round brass porthole window with thick glass glowing orange, short curtains tied at the sides, the same edge posts and top beam. |
| 28 | dd_tb_quay | Quầy trang bị | home_dining_table_x4, volcano_dwarf_house_x4 | dot-13/tb_quay | ~64 | A shop counter of blackened oak with iron straps with riveted brass and iron trim, folded tunics and a pair of boots on top made of heavy riveted plate, chainmail and thick leather aprons, wide shape. |
| 29 | dd_tb_gia_giap | Giá giáp | home_wardrobe_x4, volcano_dwarf_house_x4 | dot-13/tb_gia_giap_sat | ~96 | A simple T-shaped armor stand of blackened oak with iron straps (a plain post with a crossbar, no head, no face) wearing a chest armor of heavy riveted plate, chainmail and thick leather aprons, gauntlets on the crossbar and boots at the foot. |
| 30 | dd_tb_gia_ao | Giá áo choàng | home_wardrobe_x4, volcano_dwarf_house_x4 | dot-13/tb_gia_ao_choang | ~96 | A standing clothes rack of blackened oak with iron straps with three hanging robes and cloaks of heavy riveted plate, chainmail and thick leather aprons, all without hoods. |
| 31 | dd_tb_ke_giay_gang | Kệ giày găng | home_bookshelf_x4, volcano_dwarf_house_x4 | dot-13/tb_ke_giay_gang | ~80 | A shelf unit of blackened oak with iron straps with three shelves of boots, gloves and gauntlets made of heavy riveted plate, chainmail and thick leather aprons, neatly arranged. |

### Lò rèn — bên trong (`dd_lr_`)

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 32 | dd_lr_tuong | Tường | home_wardrobe_x4, volcano_dwarf_house_x4 | dot-4/tuong_da_lo_ren | ~128 | A straight front-facing smithy interior wall in the dwarven volcanic fortress style: huge dark basalt blocks with brass bands and geometric dwarven carvings, a thin glowing orange lava groove along the bottom, tongs, hammers and horseshoes on hooks, a little soot, square basalt pillars with brass caps and rivets on the left and right edges, a heavy riveted iron girder beam with brass bolts along the top. |
| 33 | dd_lr_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4, volcano_dwarf_house_x4 | dot-4/tuong_da_lo_ren | ~128 | The same smithy wall of the dwarven volcanic fortress style with a small round brass porthole window with thick glass glowing orange, a rack of iron bars beside it, the same edge posts and top beam. |
| 34 | dd_lr_lo_ren | Lò rèn | home_fireplace_x4, volcano_dwarf_house_x4 | dot-4/lo_ren | ~110 | A huge dwarven basalt forge with a mouth of molten orange lava, brass bellows pipes and a riveted chimney hood. |
| 35 | dd_lr_de_bua | Đe + búa | home_chest_x4, volcano_dwarf_house_x4 | dot-4/de_bua | ~56 | A black iron anvil on a block of blackened oak with iron straps with a hammer resting on it and a half-forged blade, a few sparks. |
| 36 | dd_lr_thung_toi | Thùng tôi | home_water_barrel_x4, volcano_dwarf_house_x4 | dot-4/thung_toi | ~52 | A quenching tub of blackened oak with iron straps with riveted brass and iron bands full of dark water with a little steam, iron tongs on the rim. |
| 37 | dd_lr_gia_dung_cu | Giá dụng cụ + quặng | home_bookshelf_x4, volcano_dwarf_house_x4 | dot-4/gia_vu_khi | ~84 | A rack of blackened oak with iron straps with smith tools on hooks and crates of raw ore and metal ingots below, riveted brass and iron fittings. |

### Xưởng nâng cấp — bên trong (`dd_nc_`)

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 38 | dd_nc_tuong | Tường | home_wardrobe_x4, volcano_dwarf_house_x4 | dot-13/nc_tuong | ~128 | A straight front-facing upgrade workshop interior wall in the dwarven volcanic fortress style: huge dark basalt blocks with brass bands and geometric dwarven carvings, a thin glowing orange lava groove along the bottom, a large carved circle of softly glowing orange lava runes in the middle (geometric symbols, no letters), square basalt pillars with brass caps and rivets on the left and right edges, a heavy riveted iron girder beam with brass bolts along the top. |
| 39 | dd_nc_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4, volcano_dwarf_house_x4 | dot-13/nc_tuong_cua_so | ~128 | The same upgrade workshop wall of the dwarven volcanic fortress style with a small round brass porthole window with thick glass glowing orange, a shelf of small glowing orange lava crystal vials beside it, the same edge posts and top beam. |
| 40 | dd_nc_ban_khac_rune | Bàn khắc rune | home_dining_table_x4, volcano_dwarf_house_x4 | dot-13/nc_ban_khac_rune | ~64 | A sturdy workbench of blackened oak with iron straps with a sword lying on it, orange lava rune lines being engraved along the blade, engraving tools and a jar of glowing ink. |
| 41 | dd_nc_lo_tinh_luyen | Lò tinh luyện | home_fireplace_x4, volcano_dwarf_house_x4 | dot-13/nc_lo_tinh_luyen | ~104 | A round refining furnace in the dwarven volcanic fortress style with riveted brass and iron bands, a small window of bright orange lava magical flames, a crucible of glowing liquid crystal on top. |
| 42 | dd_nc_vong_phap | Vòng phép cường hoá | home_rug_x4, volcano_dwarf_house_x4 | dot-13/nc_vong_phap | ~48 | A flat round platform set into the floor with a glowing orange lava magic circle of geometric runes (no letters) and four small crystal posts at its edge, seen from slightly above, wide flat shape. |
| 43 | dd_nc_ke_da | Kệ đá cường hoá | home_bookshelf_x4, volcano_dwarf_house_x4 | dot-13/nc_ke_da_cuong_hoa | ~88 | A shelf of blackened oak with iron straps with three shelves of upgrade stones: rough ore chunks, polished gems in small dishes, glowing orange lava crystals in glass jars. |

### Tiệm hồi phục — bên trong (`dd_hp_`)

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 44 | dd_hp_tuong | Tường | home_wardrobe_x4, volcano_dwarf_house_x4 | dot-4/tuong_go_tiem_thuoc | ~128 | A straight front-facing healer and potion shop interior wall in the dwarven volcanic fortress style: huge dark basalt blocks with brass bands and geometric dwarven carvings, a thin glowing orange lava groove along the bottom, bundles of dried herbs and a row of small potion bottles on a shelf, square basalt pillars with brass caps and rivets on the left and right edges, a heavy riveted iron girder beam with brass bolts along the top. |
| 45 | dd_hp_tuong_cua_so | Tường có cửa sổ | home_wardrobe_x4, volcano_dwarf_house_x4 | dot-4/tuong_go_tiem_thuoc | ~128 | The same healer and potion shop wall of the dwarven volcanic fortress style with a small round brass porthole window with thick glass glowing orange, a pot of herbs on the sill, the same edge posts and top beam. |
| 46 | dd_hp_quay | Quầy thuốc | home_dining_table_x4, volcano_dwarf_house_x4 | dot-4/quay_hang | ~64 | A shop counter of blackened oak with iron straps with a mortar and pestle, red and blue potion bottles, rolled bandages and a small scale, wide shape. |
| 47 | dd_hp_ke_thuoc | Kệ thuốc | home_bookshelf_x4, volcano_dwarf_house_x4 | dot-4/ke_thuoc | ~96 | A tall shelf of blackened oak with iron straps full of red health potions, blue energy potions, jars of herbs and small boxes, riveted brass and iron fittings. |
| 48 | dd_hp_noi_thuoc | Nồi điều chế | home_stove_x4, volcano_dwarf_house_x4 | dot-4/noi_luyen_thuoc | ~64 | A brewing cauldron in the dwarven volcanic fortress style bubbling with a red healing potion over a small fire, a ladle and herbs beside it. |
| 49 | dd_hp_dac_trung | Món chủ đạo tiệm | home_potted_plant_x4, volcano_dwarf_house_x4 | dot-4/gia_phoi_thao_duoc | ~80 | A basalt shelf of fire-resistant salves, red healing draughts in thick brass-capped flasks and soot-proof bandages. |

## Khi xong

Báo chủ dự án: đợt nào, số món đã vẽ, món nào chưa đạt (ghi rõ trong `prompts.json`: lề, sai tạo hình, hai mảng tường có ghép liền
không, có lọt mũ / mũ giáp / mũ trùm / chữ không, có giống bộ Thistlewood quá không). Claude chuẩn hoá (`scripts/gpt-normalize.py
--height <cao>`), xếp 7 nhà thành khu phố trên nền đất vùng, dựng sàn bằng code và ghép thử 7 phòng để chủ dự án duyệt.

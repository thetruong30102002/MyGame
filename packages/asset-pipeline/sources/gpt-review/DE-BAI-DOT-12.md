# Đề bài GPT vẽ — đợt 12: đồ vật tĩnh map các vùng chưa có đồ riêng (12/11/2026)

Chủ dự án 12/11: "Để nhờ gpt sang vẽ vật tĩnh map các vùng". Rà bộ đồ map hiện có (`assets/maps/<vùng>/props`): 6 vùng đang
**mượn nguyên bộ đồ của vùng khác** — Rừng Nấm Ngầm dùng đồ Đầm lầy; Phế tích Haven và Thánh Địa Bình Minh dùng đồ Cao nguyên;
Vực Hư Không và Vực Ám Ma dùng đồ Núi lửa; Rừng Cổ Thụ dùng đồ Đầm lầy. Ba vùng sau đã có cây riêng nhưng chưa có đồ vật khác.
Đợt này vẽ cho mỗi vùng **1 công trình biểu tượng** (như đợt 1 món 7–13) + **8 đồ vật** đúng chất vùng.

**GIỮ STYLE MAP CŨ (CHỐT 05/11):** chép đúng nét / viền / đổ bóng / độ to ô pixel của ảnh mẫu đồ map cũ (`mau-tham-chieu/*_x4.png`);
KHÔNG vẽ theo style bộ ô Wang / bờ cao thấp đã bị loại. **KHÔNG vẽ người / NPC / thú / chim / côn trùng / tượng người hay tượng
thú / ma-nơ-canh.** Bia, đá khắc chỉ có hoa văn hình học / ký hiệu phát sáng, không chữ. Không đồ đội đầu ở bất cứ món nào.

Luật, nơi lưu, cách ghi `prompts.json` y như đợt 1 (`DE-BAI-DOT-1.md` mục "Luật bắt buộc") và rút kinh nghiệm đợt 3–11
(lề ≥ 5 %, gửi kèm ảnh mẫu + một ảnh đợt trước đã duyệt). Thư mục ra: `packages/asset-pipeline/sources/gpt-review/dot-12/`.
Không sửa file khác, không build, không commit.

## Đuôi prompt chung — đồ vật (gắn sau mô tả của MỌI món trừ công trình biểu tượng)

```
Chunky chibi pixel art game sprite of an outdoor map object in EXACTLY the same style as the attached references: front view with
a slight top-down angle, thick dark near-black outline around every shape, soft cel shading with 2–3 tones per material,
saturated colors, limited palette (at most 32 colors), crisp uniform square pixel blocks (every art pixel the same size, about
4×4 image pixels), no anti-aliasing, no gradients, no blur, no texture noise. One single object centered with at least 8% empty
space on every side, on a perfectly flat solid magenta #FF00FF background. The base is a flat bottom line (a little ground right
at the foot only). No cast shadow, no scenery, no sky, no text, no letters, no numbers, no people, no statues, no animals, no
birds, no insects, no characters, no hats.
```

**Công trình biểu tượng** (món đầu mỗi vùng, cao ~280 px): dùng đuôi prompt công trình của đợt 1 (`DE-BAI-DOT-1.md`, món 7–13),
cùng khổ ảnh và độ to ô pixel như các công trình đợt 1 (`dot-1/tl_toa_thi_chinh.png` là chuẩn); có nền đất nhỏ đúng chất vùng ở
chân, đáy thẳng; không trời / cảnh xa.

Mỗi lần vẽ gửi kèm: ảnh ở cột "Ảnh mẫu" (`mau-tham-chieu/`) + ảnh ở cột "Mẫu đợt trước". Ba ảnh mẫu mới thêm 12/11 (cây riêng của
vùng, cắt từ atlas map, phóng 4×): `wood_hollow_oak_x4`, `wood_firefly_tree_x4`, `dark_lantern_tree_x4`, `dark_chained_tree_x4`,
`light_crystal_tree_x4`, `light_golden_tree_x4` — dùng để bắt đúng bảng màu vùng.

## Danh sách

Nhân vật trong game cao ~80 px; ô đất 32 px. Cột "Mẫu đợt trước" = ảnh gốc trong `dot-1/` … `dot-11/`.

### Rừng Nấm Ngầm (cấp 70–80) — mã `nm_`

Chất vùng: rừng nấm khổng lồ dưới lòng đất, tối, ánh lam / tím / lục phát quang từ nấm và bào tử. Ảnh mẫu chính của vùng: `swamp_willow_x4` (gửi kèm mọi món của vùng).

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 1 | nm_dai_sanh_nam | Đại sảnh nấm (công trình) | swamp_willow_x4, volcano_dwarf_house_x4 | dot-1/dl_dai_sanh_nha_san | ~280 | A grand underground hall grown from a cluster of giant glowing mushrooms: a huge central teal-capped mushroom with a wide gill underside glowing soft blue, a carved round door in its thick stem, smaller violet and green mushroom towers around it joined by curved root walkways, hanging spore lanterns. Ground base: dark mossy cave soil with tiny glowing mushrooms. |
| 2 | nm_cum_nam_lam | Cụm nấm lam phát sáng | swamp_willow_x4 | dot-10/nha_nam_khong_lo | ~96 | A tall cluster of three giant mushrooms with glowing translucent teal-blue caps and pale stems, tiny light spots on the caps. |
| 3 | nm_mang_nam_tim | Mảng nấm tím lùn | swamp_willow_x4, home_potted_plant_x4 | dot-6/dun_rom | ~40 | A low wide patch of many small violet and magenta glowing mushrooms on a mossy mound, wide shape. |
| 4 | nm_mang_da_nhu | Măng đá có nấm tai | swamp_willow_x4, volcano_great_forge_x4 | dot-1/cay_lieu_khong_lo | ~88 | A tall dark cave stalagmite with shelf fungi growing in steps up its side, pale green glowing edges, drips of water. |
| 5 | nm_den_bao_tu | Cột đèn bào tử | swamp_willow_x4, home_wall_clock_x4 | dot-11/nk_den | ~72 | A crooked wooden post with a glass bulb hanging from it full of floating glowing green spores, roots wrapped around the base. |
| 6 | nm_vung_bao_tu | Vũng bào tử phát sáng | swamp_willow_x4, home_rug_x4 | dot-7/cho_tam_cat | ~28 | A shallow round pool of glowing cyan liquid on the cave floor with tiny floating spore dots above it and small mushrooms on the rim, flat wide shape seen from slightly above. |
| 7 | nm_than_nam_do | Thân nấm khổng lồ đổ | swamp_willow_x4 | dot-7/cuon_rom_tron | ~44 | A fallen giant mushroom lying on its side: thick pale stem and a broken blue cap, small new mushrooms sprouting along the stem, wide shape. |
| 8 | nm_tinh_the_soi_nam | Tinh thể quấn sợi nấm | swamp_willow_x4, home_potted_plant_x4 | dot-9/hv_dac_trung | ~64 | A cluster of pale lilac crystals wrapped in fine white glowing mycelium threads, small mushrooms at the base. |
| 9 | nm_gian_trong_nam | Giàn trồng nấm bỏ hoang | swamp_willow_x4, home_bookshelf_x4 | dot-6/ke_kho_lon | ~76 | An old abandoned wooden rack of three shelves holding logs with small brown and blue mushrooms growing on them, cobwebby corners. |

### Phế tích Haven (cấp 80–90) — mã `ph_`

Chất vùng: thành cổ Haven đổ nát: đá trắng ngà, viền vàng xỉn, ký hiệu và pha lê lam phát sáng, dây leo. Ảnh mẫu chính của vùng: `highland_stone_cottage_x4` (gửi kèm mọi món của vùng).

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 10 | ph_thap_haven_do | Tháp Haven đổ nát (công trình) | highland_stone_cottage_x4, human_church_x4 | dot-1/tl_toa_thi_chinh | ~280 | A tall ruined ancient Haven spire of cream-white stone with faded gold trim, the top half broken off with a large glowing cyan Haven crystal floating above the broken top, cracked arched windows, ivy climbing the walls, fallen blocks at the base. Ground base: cracked white stone tiles with grass between them. |
| 11 | ph_cong_vom_vo | Cổng vòm đổ | highland_stone_cottage_x4 | dot-1/tl_toa_thi_chinh | ~96 | A broken ancient stone archway of cream-white blocks with faded gold trim, one side collapsed, a faint glowing cyan rune on the keystone, ivy hanging down. |
| 12 | ph_cot_rune_do | Cột khắc ký hiệu đổ | highland_stone_cottage_x4 | dot-9/ld_tuong | ~40 | A fallen white marble column broken into two pieces lying on the ground, glowing cyan geometric runes along its side, moss in the cracks, wide shape. |
| 13 | ph_be_pha_le_nut | Bệ pha lê nứt | highland_stone_cottage_x4, home_wall_clock_x4 | dot-9/hv_dac_trung | ~80 | A cracked ancient stone pedestal with gold bands holding a chipped floating cyan Haven crystal that flickers with light. |
| 14 | ph_bia_co | Bia đá cổ | highland_stone_cottage_x4 | dot-1/tl_toa_thi_chinh | ~72 | A tall ancient stone tablet with a rounded top, carved with glowing cyan geometric symbols (no letters), cracked edge, ivy at the base. |
| 15 | ph_bac_da_noi | Bậc đá lơ lửng | highland_stone_cottage_x4 | dot-1/cn_dai_coi_xay | ~72 | Three broken stone stair blocks floating one above another in a short diagonal, each with faint cyan glow underneath, small pebbles floating around. |
| 16 | ph_tuong_vo_day_leo | Mảng tường đổ dây leo | highland_stone_cottage_x4 | dot-2/tuong_da_vom | ~84 | A broken section of ancient white stone wall with an empty arched window, faded gold trim, thick green ivy and small white flowers covering one side, wide shape. |
| 17 | ph_dai_phun_can | Đài phun nước cạn | highland_stone_cottage_x4, home_water_barrel_x4 | dot-10/lau_kinh_vuon_hoa | ~64 | A dry ancient round stone fountain with a cracked basin, a tall broken center spout, dead leaves and moss inside, faded gold rim. |
| 18 | ph_dong_gach_vang | Đống gạch đổ ánh vàng | highland_stone_cottage_x4, home_chest_x4 | dot-6/chong_bao_tai | ~36 | A low pile of broken white stone blocks and gold-glazed roof tiles with a small glowing cyan crystal shard sticking out, wide shape. |

### Vực Hư Không (cấp 90–100) — mã `hk_`

Chất vùng: mảnh đất vỡ trôi giữa hư không: đá đen tím, tinh thể tím / đen, ánh tím và lam đậm, mảnh vỡ lơ lửng. Ảnh mẫu chính của vùng: `volcano_great_forge_x4` (gửi kèm mọi món của vùng).

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 19 | hk_cong_hu_khong | Cổng Hư Không (công trình) | volcano_great_forge_x4 | dot-1/nl_dai_lo_ren | ~280 | A colossal ring gate of black obsidian stone blocks floating slightly above a broken platform, the inside of the ring filled with a swirling deep violet and indigo void vortex with tiny star specks, shattered stone pieces orbiting around it, glowing violet cracks in the platform. Ground base: a broken dark floating island edge with jagged rock underneath. |
| 20 | hk_da_troi | Tảng đá lơ lửng | volcano_great_forge_x4 | dot-1/nl_dai_lo_ren | ~72 | A chunk of dark purple-black rock floating in the air with a jagged bottom, glowing violet cracks, small pebbles floating below it. |
| 21 | hk_tinh_the_hu | Cụm tinh thể hư không | volcano_great_forge_x4, home_potted_plant_x4 | dot-9/hv_dac_trung | ~72 | A cluster of sharp black and deep violet crystals with glowing purple cores and a faint dark aura of tiny sparkles. |
| 22 | hk_cot_vo_troi | Cột vỡ trôi lơ lửng | volcano_great_forge_x4, highland_stone_cottage_x4 | dot-9/ld_tuong | ~96 | A dark stone pillar shattered into four pieces that float apart vertically in a line, violet light glowing between the pieces. |
| 23 | hk_khe_nut | Khe nứt hư không | volcano_great_forge_x4, home_rug_x4 | dot-7/cho_tam_cat | ~28 | A jagged crack in dark rocky ground glowing deep violet from inside with tiny star specks, flat wide shape seen from slightly above. |
| 24 | hk_cay_hoa_da | Cây hoá đá trắng | volcano_great_forge_x4 | dot-1/cay_lieu_khong_lo | ~96 | A dead petrified tree of pale grey-white stone with twisted bare branches, faint violet cracks running through the trunk. |
| 25 | hk_xich_neo_troi | Neo xích lơ lửng | volcano_great_forge_x4 | dot-1/nl_dai_lo_ren | ~72 | A heavy dark iron anchor block floating in the air with thick broken chains hanging down, violet runes glowing on the block. |
| 26 | hk_lo_lua_tim | Lò lửa linh hồn tím | volcano_great_forge_x4, home_fireplace_x4 | dot-11/lb_lo_suoi | ~64 | A black stone brazier on three clawed legs burning with a tall pale violet ghostly flame. |
| 27 | hk_mieng_dao_vo | Mảnh đảo vỡ nhỏ | volcano_great_forge_x4 | dot-1/nl_dai_lo_ren | ~56 | A small floating island fragment with a flat top of dark rocky ground and a few pale grey grass tufts, jagged rock hanging underneath, a faint violet glow below. |

### Vực Ám Ma (cấp 40–50) — mã `am_`

Chất vùng: vùng đất bị nguyền: đá đen, sương tím, ánh đỏ máu / tím, nến, gai đen (đã có cây riêng — chỉ vẽ đồ vật). Ảnh mẫu chính của vùng: `dark_lantern_tree_x4` (gửi kèm mọi món của vùng).

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 28 | am_thanh_duong_am | Thánh đường ám (công trình) | dark_lantern_tree_x4, human_church_x4 | dot-1/tl_toa_thi_chinh | ~280 | A large ruined gothic cathedral of black stone with tall pointed spires, broken stained-glass windows glowing violet and blood red, thorny black vines climbing the walls, a heavy iron-bound door, candles on the steps. Ground base: dark cracked flagstones with purple mist at the edges. |
| 29 | am_mo_da | Mộ đá cổ | dark_lantern_tree_x4, dark_chained_tree_x4 | dot-1/tl_toa_thi_chinh | ~48 | An old dark stone gravestone with a pointed top, carved with a simple geometric pattern (no letters), cracked, a red candle melting at its base. |
| 30 | am_quan_tai_xich | Quan tài bị xích | dark_lantern_tree_x4, dark_chained_tree_x4 | dot-6/thung_go_chong | ~52 | A closed black wooden coffin standing upright, wrapped in heavy iron chains with a big padlock, faint violet light leaking from the seams. |
| 31 | am_vac_ma | Vạc thuốc ám | dark_lantern_tree_x4, home_stove_x4 | dot-4/noi_luyen_thuoc | ~52 | A big black iron cauldron on three legs over a small fire, bubbling with dark violet liquid, wisps of purple smoke. |
| 32 | am_den_ma | Cột đèn ma | dark_lantern_tree_x4 | dot-11/nk_den | ~80 | A tall crooked black iron lamp post with a cracked glass lantern glowing pale green-white, thorny vines winding up the post. |
| 33 | am_dong_xuong_nen | Đống xương và nến | dark_lantern_tree_x4, dark_chained_tree_x4 | dot-6/chong_bao_tai | ~36 | A low pile of old bones with several melting red and black candles burning on top, wide shape. |
| 34 | am_dan_te | Đàn tế ám | dark_lantern_tree_x4, volcano_great_forge_x4 | dot-5/ban_tho_pha_le | ~60 | A black stone altar slab on thick legs with a glowing blood-red crystal on top, candles at the corners and dark red runes on the front. |
| 35 | am_tru_rune_nut | Trụ đá nứt ký hiệu | dark_lantern_tree_x4, dark_chained_tree_x4 | dot-1/tl_toa_thi_chinh | ~88 | A tall cracked black obelisk with glowing violet geometric runes (no letters) and a thin purple mist around its base. |
| 36 | am_bui_gai_den | Bụi gai đen quả đỏ | dark_lantern_tree_x4 | dot-3/chau_cay_lon | ~44 | A dense bush of black thorny branches with a few shiny blood-red berries. |

### Thánh Địa Bình Minh (cấp 30–40) — mã `as_`

Chất vùng: thánh địa trên mây: cẩm thạch trắng, vàng, ánh bình minh hồng–cam, hoa trắng, pha lê vàng (đã có cây riêng — chỉ vẽ đồ vật). Ảnh mẫu chính của vùng: `light_golden_tree_x4` (gửi kèm mọi món của vùng).

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 37 | as_den_binh_minh | Đền Bình Minh (công trình) | light_golden_tree_x4, human_church_x4 | dot-1/tl_toa_thi_chinh | ~280 | A radiant temple of white marble with a large golden sun dome, tall slender columns with gold capitals, sunrise pink and orange glass windows, a wide staircase with white flower urns, a glowing golden sun disc above the entrance. Ground base: white marble plaza tiles with small golden flowers. |
| 38 | as_cot_trang_vang | Cột cẩm thạch viền vàng | light_golden_tree_x4, light_crystal_tree_x4 | dot-9/hv_tuong | ~96 | A tall white marble column with gold capital and base, a gold sun emblem in the middle, white flowers at its foot. |
| 39 | as_dai_phun_thanh | Đài phun nước thánh | light_golden_tree_x4, home_water_barrel_x4 | dot-10/lau_kinh_vuon_hoa | ~72 | A white marble two-tier fountain with gold trim and sparkling golden-white glowing water, white lotus flowers in the basin. |
| 40 | as_khung_chuong_vang | Khung chuông vàng | light_golden_tree_x4 | dot-1/cn_dai_coi_xay | ~88 | A white marble frame with a small gold roof holding a large shining golden bell. |
| 41 | as_be_sen | Bể sen trắng | light_golden_tree_x4, home_rug_x4 | dot-7/mang_nuoc_da | ~32 | A low round white marble basin with clear water, white and pink lotus flowers and green pads, wide shape. |
| 42 | as_den_mat_troi | Cột đèn mặt trời | light_golden_tree_x4, light_crystal_tree_x4 | dot-11/nk_den | ~80 | A slender white and gold lamp post topped with a glowing golden sun-shaped crystal lamp. |
| 43 | as_cong_hoa | Cổng vòm hoa trắng | light_golden_tree_x4 | dot-6/gian_day_leo | ~96 | A graceful white marble arch covered with climbing white roses and small golden flowers. |
| 44 | as_bia_anh_sang | Bia pha lê ánh sáng | light_golden_tree_x4, light_crystal_tree_x4 | dot-9/hv_dac_trung | ~72 | A tall golden crystal stele standing on a white marble base, glowing warm light, gold sun pattern carved on the base (no letters). |
| 45 | as_ghe_da_trang | Ghế đá trắng | light_golden_tree_x4, home_armchair_x4 | dot-3/ghe_dai | ~36 | A white marble garden bench with gold-trimmed curled armrests, wide shape. |

### Rừng Cổ Thụ (cấp 20–30) — mã `ct_`

Chất vùng: rừng cổ thụ ngàn năm: gỗ già, rêu xanh dày, đá cổ, đom đóm vàng, suối nhỏ (đã có cây riêng — chỉ vẽ đồ vật). Ảnh mẫu chính của vùng: `wood_hollow_oak_x4` (gửi kèm mọi món của vùng).

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 46 | ct_vong_da_co | Vòng đá cổ (công trình) | wood_hollow_oak_x4 | dot-10/nha_cay_tien | ~280 | An ancient stone circle of tall mossy standing stones around a gigantic old hollow oak with an arched doorway glowing warm gold inside, roots spreading over the stones, hanging moss and floating golden firefly lights. Ground base: mossy forest floor with ferns and small white flowers. |
| 47 | ct_goc_cay_rong | Gốc cây rỗng | wood_hollow_oak_x4 | dot-1/cay_dai_thu_soi | ~56 | A huge old hollow tree stump with a dark opening, thick moss on top, small mushrooms and ferns around the roots. |
| 48 | ct_nam_tai_go | Khúc gỗ nấm tai | wood_hollow_oak_x4, wood_firefly_tree_x4 | dot-7/cuon_rom_tron | ~36 | A mossy fallen log with orange shelf fungi growing along its side, wide shape. |
| 49 | ct_den_dom_dom | Cột đèn đom đóm | wood_hollow_oak_x4, wood_firefly_tree_x4 | dot-11/nk_den | ~76 | A rustic wooden post with a woven twig lantern glowing warm gold with tiny firefly-like light dots inside, ivy on the post. |
| 50 | ct_da_reu_xep | Đá rêu xếp chồng | wood_hollow_oak_x4 | dot-1/cay_dai_thu_soi | ~56 | A stack of three flat mossy stones balanced on each other with small ferns at the base. |
| 51 | ct_suoi_da | Vũng suối đá | wood_hollow_oak_x4, home_water_barrel_x4 | dot-7/mang_nuoc_da | ~32 | A small clear spring pool ringed with round mossy stones, ferns and tiny white flowers on the edge, wide shape seen from slightly above. |
| 52 | ct_dong_cui | Đống củi rìu | wood_hollow_oak_x4, home_chest_x4 | dot-6/thung_go_chong | ~44 | A neat pile of split firewood logs with a wood axe stuck in a chopping stump beside it. |
| 53 | ct_coc_go_khac | Cọc gỗ khắc lá | wood_hollow_oak_x4 | dot-1/cay_dai_thu_soi | ~84 | A tall weathered wooden pole carved with leaf and spiral patterns (no faces), moss and small hanging vines on it. |
| 54 | ct_bui_qua_rung | Bụi quả rừng | wood_hollow_oak_x4, wood_firefly_tree_x4 | dot-3/chau_cay_lon | ~40 | A round leafy green forest bush with clusters of red and dark blue wild berries. |

## Khi xong

Báo chủ dự án số món đã vẽ và món nào chưa đạt (ghi rõ trong `prompts.json`: lề, sai tạo hình). Claude chuẩn hoá
(`scripts/gpt-normalize.py --height <cao>`), đặt thử từng vùng cạnh cây riêng của vùng đó trên nền map thật để chủ dự án duyệt
trước khi thay đồ mượn trong atlas vùng.

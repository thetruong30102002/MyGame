# Đề bài GPT vẽ — đợt 7: chăn nuôi ngoài trời + nhà Gia viên cỡ lớn mua được (12/11/2026)

Chủ dự án 12/11: "Chăn nuôi thì phải có cả chuồng ngoài trời bên ngoài nhà nữa chứ". Hiện ngoài trời mới có nhà kho đỏ
(`dot-1/gv_nha_kho`, ~180 px), chuồng gà nhỏ (`dot-1/gv_chuong_ga`, ~110 px) và bộ chuồng PixelLab cỡ nhỏ (~70 px). Bò, cừu, gà
PixelLab đã có hoạt ảnh đi / ăn. Đợt này vẽ **bãi quây và đồ chăn nuôi ngoài trời**: bãi bò / cừu có rào, sân gà rào lưới, góc tổ ong,
chuồng cấp 2 to hơn. Claude ghép bãi quây bằng code từ các đoạn rào (rào dọc dựng từ cột + thanh ngang bằng code).

**KHÔNG vẽ người / NPC / thú / chim / ong** — con vật đã có bản PixelLab, đàn ong là hiệu ứng code. Đợt này CHỈ đồ vật / công trình.
Trứng, sữa, len, rơm, mật ong là đồ vật nên được vẽ.

Luật, nơi lưu, cách ghi `prompts.json` y như đợt 1 (`DE-BAI-DOT-1.md` mục "Luật bắt buộc") và rút kinh nghiệm đợt 3–6
(lề ≥ 5 %, gửi kèm ảnh mẫu + một ảnh đợt trước đã duyệt). Thư mục ra: `packages/asset-pipeline/sources/gpt-review/dot-7/`.
Không sửa file khác, không build, không commit. Không đồ đội đầu ở bất cứ món nào (kể cả mũ rơm treo trên rào / bù nhìn).

## Đuôi prompt chung (gắn sau mô tả của MỌI món)

```
Chunky chibi pixel art game sprite of an outdoor farm object in EXACTLY the same style as the attached references: front view with
a slight top-down angle, thick dark near-black outline around every shape, soft cel shading with 2–3 tones per material, warm
saturated colors, limited palette (at most 32 colors), crisp uniform square pixel blocks (every art pixel the same size, about
4×4 image pixels), no anti-aliasing, no gradients, no blur, no texture noise. One single object centered with at least 8% empty
space on every side, on a perfectly flat solid magenta #FF00FF background. The base is a flat bottom line (short grass or dirt
right at the foot only). No cast shadow, no scenery, no field, no sky, no text, no letters, no numbers, no signs with writing,
no people, no animals, no birds, no bees, no insects, no characters, no hats.
```

**Đoạn rào ghép liền (món 1, 10):** nhìn thẳng chính diện; hai đầu trái / phải cắt phẳng XUYÊN GIỮA một cột rào, thanh ngang thẳng
tuyệt đối và cùng độ cao ở hai đầu — để đặt nhiều đoạn nối nhau không hở. Không lượn, không nghiêng phối cảnh.

## Danh sách

Nhân vật trong game cao ~80 px; ô đất 32 px; nhà chính ~210 px. "Mẫu đợt trước" = ảnh gốc trong `dot-1/` … `dot-6/`.

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 1 | rao_go_ngang | Đoạn rào gỗ bãi quây | highland_barn_x4 | dot-6/ngan_chuong | ~48 | A straight horizontal rustic wooden paddock fence segment: three square wooden posts evenly spaced, two thick horizontal split-log rails, both ends cut flat through the middle of the end posts so segments can join, seen straight from the front, wide shape (about three times wider than tall). |
| 2 | rao_go_cot | Cột rào góc | highland_barn_x4 | dot-6/ngan_chuong | ~52 | A single square wooden fence corner post with a small pointed top and short stubs of rails on both sides, iron nails, seen from the front. |
| 3 | cong_rao_doi | Cổng rào đôi | highland_barn_x4 | dot-6/ngan_chuong | ~60 | A double wooden farm gate between two thick posts, each gate leaf with an X brace, iron hinges and a latch with a small chain, closed, seen from the front. |
| 4 | mang_nuoc_da | Máng nước bằng đá | home_water_barrel_x4 | dot-6/mang_an | ~32 | A long rectangular grey stone water trough filled with clear blue water, moss at the corners, wide shape (much wider than tall). |
| 5 | gia_co_kho | Giá cỏ khô có mái | highland_barn_x4 | dot-6/dun_rom | ~84 | An outdoor wooden hay feeder rack on four legs with slatted sides filled with golden hay and a small slanted wooden shingle roof on top. |
| 6 | lan_che_nang | Lán che nắng cho gia súc | highland_barn_x4 | dot-1/gv_nha_kho | ~150 | An open-sided wooden livestock shelter: a sloped brown wooden shingle roof on four thick log posts, a straw-covered floor, a hay rack on the back wall, no walls on the front and sides. |
| 7 | cuon_rom_tron | Cuộn rơm tròn | home_chest_x4 | dot-6/dun_rom | ~44 | A big round rolled golden hay bale lying on its side, spiral visible on the front face, a few loose straws. |
| 8 | cot_gai_bo | Cột gãi + tảng đá muối | home_chair_x4 | dot-6/xo_sua_ghe | ~56 | A sturdy wooden post with a big round bristle brush mounted on its side for cattle to scratch, and a pinkish salt lick block on a small wooden stand at its foot. |
| 9 | chuong_cuu | Chuồng cừu | highland_barn_x4 | dot-1/gv_nha_kho | ~130 | A small cozy wooden sheep shed with a cream plaster front, dark timber frame, a thatched straw roof, a split stable half-door with the top open, a bundle of white wool hanging on a peg beside the door, stone foundation. |
| 10 | rao_luoi_ga | Đoạn rào lưới sân gà | home_chest_x4 | dot-6/ngan_chuong | ~36 | A straight low chicken-run fence segment: thin wooden posts with a light wooden top rail and a silver hexagonal chicken-wire mesh between them, both ends cut flat through the middle of the end posts so segments can join, seen straight from the front, wide shape. |
| 11 | cong_rao_luoi | Cổng sân gà | home_chest_x4 | dot-6/ngan_chuong | ~40 | A small single wooden gate with silver chicken-wire mesh and a Z brace, hinged on a post, closed, seen from the front. |
| 12 | mang_thoc_ga | Máng thóc cho gà | home_water_barrel_x4 | dot-6/mang_an | ~32 | A round tin chicken feeder on the ground full of golden grain and corn, with a small clay water dish beside it. |
| 13 | cho_tam_cat | Ổ tắm cát cho gà | home_chest_x4 | dot-6/luong_cay_cao | ~24 | A low square wooden frame box filled with light sand and a few small pebbles, seen slightly from above, wide shape. |
| 14 | chuong_ga_lon | Chuồng gà cấp 2 | highland_barn_x4 | dot-1/gv_chuong_ga | ~140 | A larger two-level wooden chicken house on short stilts: red wooden walls with white trim, a dark shingle roof with a little weather-vane arrow (no bird shape), a ramp with crossbars to a round door, two nesting boxes with lift-up lids on the side, a small window. |
| 15 | to_ong_go | Tổ ong gỗ | home_chest_x4 | dot-6/o_de_ga | ~64 | Two stacked white-and-honey-yellow painted wooden beehive boxes with a sloped lid, a small entrance slit at the bottom, standing on a wooden stand, a little honey drip on the side. |
| 16 | to_ong_rom | Tổ ong rơm | home_potted_plant_x4 | dot-6/gio_long_cuu | ~56 | A traditional dome-shaped coiled straw beehive skep on a small round wooden stand, a tiny dark entrance hole near the bottom. |
| 17 | bon_hoa_ong | Bồn hoa cho ong | home_potted_plant_x4 | dot-6/luong_cay_cao | ~36 | A low wooden-edged flower bed full of purple lavender, yellow sunflowers and white clover blossoms, wide shape (much wider than tall). |
| 18 | chuong_bo_lon | Chuồng bò cấp 2 | highland_barn_x4 | dot-1/gv_nha_kho | ~200 | A big red cattle barn with white trim, a tall gambrel roof, a wide open double door showing hay inside, a hay loft door with a pulley beam, a round grey stone silo with a dome roof attached on one side, stone foundation. |
| 19 | xe_thung_sua | Xe đẩy thùng sữa | home_water_barrel_x4 | dot-6/xo_sua_ghe | ~48 | A small wooden two-wheeled hand cart carrying three tall silver milk churns with lids. |
| 20 | xe_cut_kit_rom | Xe cút kít chở rơm | home_chest_x4 | dot-6/dun_rom | ~40 | A wooden wheelbarrow with one front wheel loaded with golden straw, a pitchfork leaning on it. |

## Phần B — nhà Gia viên cỡ lớn mua được (món 21–28)

Chủ dự án 12/11: "có nên vẽ nhiều nhà (mua được) nhà to hơn bình thường ngoại cỡ", "Mỗi nhà sẽ có 1 nền, style khác nhau",
"Tiện vẽ các ngoại hình nhà to gấp 3 lần nhà cũ", "Dài hơn cao hơn". Nhà chính cũ `dot-1/gv_nha_chinh` cỡ 186 × 210 px trong game;
nhà mới **dài ~3 lần (520–560 px), cao ~2 lần (380–420 px)** — nhiều gian, nhiều tầng, không chỉ phóng to một căn nhỏ.

- **Mỗi nhà vẽ liền MỘT NỀN riêng** đúng style của nhà (sân trước / bậc thềm / lối đi / bồn hoa) — nền là dải sân hẹp, phẳng, nằm
  sát chân nhà, rộng bằng nhà, đáy là một đường thẳng; không vẽ cảnh xa, trời, cây lớn ngoài nền.
- Ảnh khổ NGANG 1536 × 1024. Vì nhà rất lớn, mỗi ô pixel nghệ thuật ~2 × 2 điểm ảnh (KHÔNG phải 4 × 4 như món nhỏ) để đủ chi tiết;
  vẫn ô vuông đều, viền đậm, không khử răng cưa. Thay câu "about 4×4 image pixels" trong đuôi chung bằng "about 2×2 image pixels,
  very large detailed building". Đổi "outdoor farm object" thành "large house with its own front yard".
- Gửi kèm ảnh mẫu ở cột "Ảnh mẫu" + `dot-1/gv_nha_chinh.png` (chuẩn style nhà Gia viên đã duyệt).
- Cửa chính ở giữa mặt trước, nhìn rõ, để làm cổng vào nhà. Không người, không thú, không chữ trên biển.

| # | id | Nhà | Ảnh mẫu | Mẫu đợt trước | Cỡ trong game (rộng × cao) | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 21 | nha_go_dong_que | Trang trại gỗ đồng quê | human_house_farm_x4 | dot-1/gv_nha_chinh | ~540 × 380 | A long two-storey country farmhouse in warm wood and cream plaster with a dark timber frame, a red clay tile roof with three dormer windows and two stone chimneys, a long wooden front porch along the whole front with posts, benches and hanging flower baskets, a side wing with a big barn-style door. Front yard base: packed dirt with a cobblestone path to the door, flower beds and a low picket fence along the bottom edge. |
| 22 | nha_da_vung_cao | Nhà đá vùng cao | highland_stone_cottage_x4 | dot-1/gv_nha_chinh | ~540 × 400 | A large highland manor of grey fieldstone with a steep dark slate roof, a round stone tower with a conical slate roof on one end, wooden shutters, ivy on the walls, a heavy arched oak door with iron studs. Front yard base: grey flagstone terrace with short green grass edges and a low dry-stone wall along the bottom edge. |
| 23 | nha_gach_do_pho | Nhà gạch đỏ ba tầng | human_house_inn_x4 | dot-1/gv_nha_chinh | ~520 × 420 | A grand three-storey red brick townhouse with white stone window frames, a balcony with iron railings on the second floor, a green copper roof with chimneys, bay windows, a white columned entrance porch. Front yard base: red brick paved courtyard with two iron street lamps and clipped round bushes in planters. |
| 24 | nha_san_dam_lay | Nhà sàn đầm lầy | swamp_longhouse_x4 | dot-1/dl_dai_sanh_nha_san | ~560 × 380 | A long wooden stilt house over a swamp: dark wood walls, a big curved thatched roof with moss, a wraparound wooden veranda with rope railings, lanterns, wooden stairs down to the water. Front yard base: wooden plank deck over still green water with reeds and lily pads (flat, no animals). |
| 25 | nha_vom_sa_mac | Nhà mái vòm sa mạc | desert_dome_house_x4 | dot-1/sm_cung_dien_oc_dao | ~540 × 400 | A large sandstone desert villa with three white domes (one big in the middle, two small), pointed arch windows with blue tile trim, colorful hanging fabric awnings, a shaded arched entrance. Front yard base: smooth sand with sandstone paving, a small turquoise tiled pool and two potted palm trees. |
| 26 | nha_go_tuyet_tung | Nhà gỗ tuyết tùng | tundra_log_cabin_x4 | dot-1/gv_nha_chinh | ~540 × 400 | A big two-storey log lodge of round cedar logs with a steep roof covered in thick snow, icicles on the eaves, warm glowing windows, a stone chimney with smoke, a covered front porch with a stack of firewood. Front yard base: snow-covered ground with a shovelled stone path, small snowy pine shrubs and wooden lanterns. |
| 27 | biet_thu_haven | Biệt thự Haven | human_church_x4 | dot-5/tuong_den_kinh_mau | ~560 × 420 | A magical white marble villa with gold trim and a deep blue roof, tall arched windows with soft cyan glow, a central tower topped with a floating glowing cyan Haven crystal, balconies with flower vines. Front yard base: white marble courtyard with a round fountain of glowing cyan water and two crystal lamp posts. |
| 28 | dinh_thu_lau_dai | Dinh thự lâu đài nhỏ | volcano_great_forge_x4 | dot-1/tl_toa_thi_chinh | ~560 × 420 | A small castle-style manor of pale stone with two round corner towers with blue conical roofs and blank pennant flags, crenellated walls, a big central hall with tall windows, a wooden double gate in a stone arch. Front yard base: stone-paved forecourt with an iron gate fence along the bottom edge, flower hedges and two stone lanterns. |

## Khi xong

Báo chủ dự án số món đã vẽ và món nào chưa đạt (ghi rõ trong `prompts.json`: lề, sai tạo hình, đoạn rào có nối liền được không).
Claude chuẩn hoá (`scripts/gpt-normalize.py --height <cao>`), xếp 8 nhà cạnh nhà chính cũ + nhân vật để so cỡ, ghép thử khu chăn nuôi ngoài trời cạnh nhà chính: bãi quây bò / cừu
(rào + cổng + máng + lán), sân gà rào lưới, góc tổ ong — có bò / cừu / gà PixelLab đứng thử — để chủ dự án duyệt.

# Đề bài GPT vẽ — đợt 1 (11/11/2026)

Chủ dự án nhờ GPT (Codex, công cụ vẽ ảnh tích hợp) vẽ **hình tĩnh cỡ lớn** cho Haven Lord: nhà Gia viên, công trình biểu tượng
các vùng, cây lớn, 1 tranh màn tải. Claude chuẩn hoá (dò lưới pixel, thu nhỏ, giảm màu, tách nền) và đặt cạnh đồ thật trong game
để chủ dự án duyệt. GPT **chỉ vẽ và lưu ảnh**.

## Luật bắt buộc

- CHỈ vẽ các món trong bảng dưới. KHÔNG vẽ nhân vật, quái, thú, người, hoạt ảnh (chốt 02/11 — cấm GPT vẽ nhân vật / hoạt ảnh).
- Không sửa / xoá / di chuyển file nào khác trong repo. Không chạy pipeline, không build, không commit.
- Mỗi món vẽ 1–2 lần, tối đa 3; giữ bản đẹp nhất là `<id>.png`, bản khác là `<id>-v2.png`, `<id>-v3.png`.
- Lưu vào `packages/asset-pipeline/sources/gpt-review/dot-1/`. Ghi `dot-1/prompts.json`: mỗi món `{ id, file, prompt, refs, tries, note }`.
- Mỗi lần vẽ gửi kèm ảnh mẫu ở cột "Ảnh mẫu" (thư mục `sources/gpt-review/mau-tham-chieu/`, đã phóng 4× nguyên pixel).
  Ảnh mẫu là CHUẨN phong cách: chép đúng nét, độ dày viền, cách đổ bóng, mật độ chi tiết, góc nhìn — KHÔNG chép đồ vật / bố cục.
- Đồ vật nằm trọn trong khung, cách mép ≥ 5 %, đứng giữa; chân công trình là một đường đáy phẳng (nền đá / bậc / cỏ ngắn sát chân),
  không vẽ sân / đường / bóng đổ lan ra ngoài.

## Đuôi prompt chung (gắn sau mô tả của MỌI món, trừ món 18)

```
Chunky chibi pixel art game sprite in EXACTLY the same style as the attached reference: front view with a slight top-down angle,
thick dark near-black outline around every shape, soft cel shading with 2–3 tones per material, warm saturated colors,
limited palette (at most 32 colors), crisp uniform square pixel blocks (every art pixel is the same size, about 4×4 image pixels),
no anti-aliasing, no gradients, no blur, no texture noise. One single object centered with empty space around it,
on a perfectly flat solid magenta #FF00FF background. No cast shadow on the ground, no scenery, no text, no letters,
no numbers, no signs with writing, no people, no animals, no characters.
```

## Danh sách

Cột "Cao trong game" để Claude thu nhỏ (nhà hiện có cao 150–195 px, cây 125–165 px; món mới to hơn có chủ đích).

| # | id | Món | Ảnh mẫu | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|
| 1 | gv_nha_chinh | Nhà chính Gia viên | human_house_farm_x4, human_house_inn_x4 | ~210 | A cozy two-storey farmhouse: red clay tile roof, cream plaster walls with dark timber frame, wooden front porch with two posts and a bench, stone chimney, flower boxes under the windows, a round attic window, big wooden front door with a lantern. |
| 2 | gv_nha_kho | Nhà kho / chuồng bò | highland_barn_x4 | ~180 | A large red wooden barn with white trim, big double sliding doors with X braces, a hay loft door at the top with hay sticking out, grey stone foundation. |
| 3 | gv_nha_kinh | Nhà kính | human_house_store_x4 | ~150 | A small greenhouse with a white-painted wooden frame and pale blue-green glass panes, gable roof of glass, potted green plants and flowers visible inside, small wooden door. |
| 4 | gv_coi_xay_gio | Cối xay gió | highland_windmill_x4 | ~230 | A tall wooden farm windmill tower with four large lattice sails, small balcony around the top, stone base with a wooden door, a small window. |
| 5 | gv_chuong_ga | Chuồng gà | highland_barn_x4 | ~110 | A small wooden chicken coop on short legs with a thatched straw roof, a little ramp with crossbars leading to a round door, a nesting box on the side. |
| 6 | gv_gieng | Giếng | human_house_farm_x4 | ~95 | A round stone well with a small wooden roof of red tiles, a crank with rope and a wooden bucket. |
| 7 | tl_toa_thi_chinh | Tòa thị chính Thistlewood | human_church_x4, human_house_inn_x4 | ~290 | A grand medieval town hall: wide stone ground floor with arched entrance and steps, timber-framed upper floor, red tile roof, a tall central clock tower with a plain round clock face with no numbers, banners in blue and gold. |
| 8 | dl_dai_sanh_nha_san | Đại sảnh nhà sàn Đầm lầy | swamp_longhouse_x4 | ~260 | A big swamp longhouse on tall wooden stilts over dark water, steep layered thatched reed roof, rope bridges, hanging green lanterns, fishing nets drying on the side, mossy wooden ladders. |
| 9 | sm_cung_dien_oc_dao | Cung điện ốc đảo Sa mạc | desert_dome_house_x4 | ~290 | An oasis palace of sand-colored adobe with a large white-and-gold onion dome, two slender towers with small domes, arched windows with turquoise tiles, colorful striped awnings, a wide arched gate. |
| 10 | cn_dai_coi_xay | Đại cối xay Cao nguyên | highland_windmill_x4, highland_stone_cottage_x4 | ~300 | A huge three-storey stone windmill on a hill base, slate roof cap, four giant cloth sails on wooden frames, small balconies and windows on each floor, wind banners on the cap. |
| 11 | bg_dai_sanh_go | Đại sảnh gỗ Băng giá | tundra_log_cabin_x4 | ~260 | A great Nordic-style log hall: thick pine log walls, steep roof heavy with snow and hanging icicles, carved wooden dragon-head beam ends on the gables, big double door with iron bands, glowing warm windows, stacked firewood. |
| 12 | nl_dai_lo_ren | Đại lò rèn Núi lửa | volcano_great_forge_x4, volcano_dwarf_house_x4 | ~280 | A massive dwarven forge hall carved from dark basalt, huge anvil-shaped gate, glowing orange furnace mouths, a channel of molten lava flowing at the base, brass pipes and chimneys puffing smoke, iron reinforcements. |
| 13 | sh_hai_dang | Hải đăng San Hô | isles_fisher_cottage_x4, isles_fishing_pier_x4 | ~300 | A tall red-and-white striped lighthouse on a rocky outcrop with barnacles and seaweed, glass lantern room with a warm glowing light, small balcony railing, a tiny keeper's cottage attached at the base. |
| 14 | cay_dai_thu_soi | Đại thụ sồi Thistlewood | human_tree_x4 | ~250 | A giant ancient oak tree with a thick gnarled trunk, wide exposed roots, a huge round lush green canopy in clustered leaf clumps. |
| 15 | cay_lieu_khong_lo | Liễu khổng lồ Đầm lầy | swamp_willow_x4 | ~250 | A giant weeping willow with a twisted mossy trunk, long hanging drooping branches like curtains, a few glowing green fireflies in the leaves. |
| 16 | cay_tuyet_tung | Tùng tuyết khổng lồ Băng giá | tundra_frost_cedar_x4 | ~270 | A giant snow-covered pine tree, tiered dark green branches heavy with thick snow, frosty blue highlights, a few icicles. |
| 17 | cay_baobab | Baobab Sa mạc | desert_palm_x4 | ~230 | A huge desert baobab tree with a very thick bottle-shaped trunk, short twisting branches at the top with small green leaf clusters. |
| 18 | man_tai_thistlewood | Tranh màn tải (khổ ngang 1536×1024) | human_house_inn_x4, human_tree_x4 | — | Xem prompt riêng dưới. |

### Prompt riêng món 18 (không dùng đuôi chung)

```
A wide landscape pixel art illustration for a game loading screen, in the same chunky pixel art style as the attached
reference (thick dark outlines, soft cel shading, warm saturated colors, uniform square pixel blocks, no anti-aliasing):
a peaceful green valley village at golden sunset, timber-framed houses with red tile roofs, a stone church tower, rolling
hills, a winding river with a small stone bridge, large oak trees, distant blue mountains, soft clouds. Leave the lower
third calm and simple (space for a loading bar). No people, no animals, no characters, no text, no letters, no logo.
```

## Khi xong

Báo chủ dự án số món đã vẽ và món nào chưa đạt. Claude sẽ làm: chuẩn hoá về cỡ game, đặt cạnh nhà / cây hiện có ở cỡ 1× và 3×,
gửi chủ dự án duyệt. Món nào không đạt thì vẽ lại theo nhận xét, không tự đưa vào game.

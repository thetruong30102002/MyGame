# Đề bài GPT vẽ — đợt 10: rào chuồng đủ các hướng + 8 nhà lớn mới (12/11/2026)

Chủ dự án 12/11: "chuồng trong nhà hay ngoài trời cần phải có đủ các hướng chứ bao quanh chứ không phải mỗi một cái rào hướng chính
diện, cần vẽ thêm các nhà lớn nữa". Đợt 7 mới có đoạn rào nhìn chính diện (chạy ngang màn hình). Đợt này vẽ thêm **đoạn rào chạy
dọc màn hình** (cạnh trái / phải của bãi quây, nhìn từ trên xuống) + cổng cạnh bên, cho cả rào gỗ, rào lưới sân gà và vách ngăn
chuồng trong nhà — để Claude ghép bãi quây kín 4 phía. Cạnh sau của bãi dùng lại đoạn rào chính diện. Phần B: 8 nhà lớn mới.

**KHÔNG vẽ người / NPC / thú / chim / ong.** Luật, nơi lưu, cách ghi `prompts.json` y như đợt 1 (`DE-BAI-DOT-1.md` mục "Luật bắt buộc")
và đợt 7. Thư mục ra: `packages/asset-pipeline/sources/gpt-review/dot-10/`. Không sửa file khác, không build, không commit.
Không đồ đội đầu ở bất cứ món nào.

## Phần A — rào chạy dọc + cổng cạnh bên (món 1–8)

Đuôi prompt: dùng **đuôi chung của đợt 7** (`DE-BAI-DOT-7.md`), ô pixel ~4 × 4.

Góc nhìn game: nhìn từ trên xuống hơi nghiêng về phía trước. Đoạn rào CHẠY DỌC màn hình (từ xa lại gần người xem) vì vậy trông như
**một cột hẹp và cao**: các cột rào xếp chồng từ trên xuống dưới, thấy đỉnh cột và mặt bên của thanh ngang thành hai vệt dọc song song
nối các cột. Mỗi cột rào cao bằng cột ở đoạn chính diện. Hai đầu trên / dưới cắt phẳng XUYÊN GIỮA một cột để nhiều đoạn nối dọc liền
nhau, và để nối khớp vào cột góc của đoạn chính diện. Gửi kèm ảnh mẫu đợt 7 cùng loại (cột "Mẫu đợt trước") — CÙNG gỗ, màu, độ dày
cột / thanh.

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cỡ trong game (rộng × cao) | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 1 | rao_go_doc | Đoạn rào gỗ chạy dọc | highland_barn_x4 | dot-7/rao_go_ngang | ~28 × 120 | A straight rustic wooden paddock fence line running directly away from the viewer, seen from above at a steep top-down angle: four square wooden posts stacked one above another down the image, evenly spaced, two thick split-log rails seen from the side as two parallel vertical bars connecting the posts, both the top and bottom ends cut flat through the middle of a post, narrow tall shape (about four times taller than wide). |
| 2 | cong_rao_go_doc | Cổng rào gỗ cạnh bên | highland_barn_x4 | dot-7/cong_rao_doi | ~36 × 96 | The same rustic wooden fence line running directly away from the viewer, seen from above, with a closed wooden gate section in the middle (gate seen edge-on from the side, X brace visible from above, iron hinges and latch), a thick post at the top and bottom ends cut flat through the middle, narrow tall shape. |
| 3 | rao_luoi_doc | Đoạn rào lưới sân gà chạy dọc | home_chest_x4 | dot-7/rao_luoi_ga | ~24 × 96 | A straight low chicken-run fence line running directly away from the viewer, seen from above at a steep top-down angle: thin wooden posts stacked one above another down the image with a light wooden top rail and silver hexagonal chicken-wire mesh between them seen from the side, both the top and bottom ends cut flat through the middle of a post, narrow tall shape. |
| 4 | cong_luoi_doc | Cổng sân gà cạnh bên | home_chest_x4 | dot-7/cong_rao_luoi | ~28 × 72 | The same low chicken-wire fence line running directly away from the viewer, seen from above, with a small closed wooden gate with chicken-wire mesh in the middle seen edge-on from the side, posts at the top and bottom ends cut flat through the middle, narrow tall shape. |
| 5 | cot_luoi_goc | Cột góc rào lưới | home_chest_x4 | dot-7/rao_luoi_ga | ~16 × 44 | A single thin wooden chicken-run corner post with a small flat top and short stubs of the top rail and chicken-wire mesh on two sides, seen from the front. |
| 6 | ngan_chuong_doc | Vách ngăn ô chuồng chạy dọc (trong nhà) | home_chair_x4 | dot-6/ngan_chuong | ~32 × 120 | A straight low wooden livestock stall partition wall running directly away from the viewer, seen from above at a steep top-down angle: thick planks with a top rail seen from the side, square posts at intervals stacked down the image, iron brackets, both the top and bottom ends cut flat through the middle of a post, narrow tall shape (about four times taller than wide). |
| 7 | cot_chuong_goc | Cột góc vách chuồng | home_chair_x4 | dot-6/ngan_chuong | ~24 × 60 | A single thick square wooden stall corner post with iron bands and short stubs of plank partition on two sides, seen from the front. |
| 8 | cong_chuong_doc | Cửa ô chuồng cạnh bên (trong nhà) | home_chair_x4 | dot-6/ngan_chuong | ~36 × 96 | The same low wooden stall partition running directly away from the viewer, seen from above, with a half-height swinging wooden stall gate in the middle seen edge-on from the side, iron hinges, posts at both ends cut flat through the middle, narrow tall shape. |

## Phần B — 8 nhà lớn mới (món 9–16)

Luật y như **phần B đợt 7** (`DE-BAI-DOT-7.md`): ảnh khổ NGANG 1536 × 1024, ô pixel ~2 × 2, mỗi nhà vẽ liền MỘT NỀN sân riêng
đúng style (dải hẹp, phẳng, đáy thẳng), cửa chính ở giữa mặt trước, không trời / cảnh xa / người / thú / chữ. Gửi kèm ảnh ở cột
"Ảnh mẫu" + `dot-7/nha_go_dong_que.png` (chuẩn style nhà lớn đã làm). Cỡ ngang hàng nhà đợt 7: dài 520–600 px, cao 380–420 px.

| # | id | Nhà | Ảnh mẫu | Cỡ trong game (rộng × cao) | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|
| 9 | nha_cay_tien | Nhà cây tộc Elf | swamp_willow_x4 | ~540 × 420 | A grand elven treehouse built around a huge ancient tree with a wide green leafy canopy: curved wooden rooms with round windows and leaf-shaped shingle roofs wrapped around the trunk on two levels, spiral wooden stairs with vine railings, glowing pale-green lanterns, a carved arched door at the base of the trunk. Front yard base: mossy grass with flat stepping stones, ferns and small white flowers. |
| 10 | nha_nam_khong_lo | Nhà nấm khổng lồ | home_potted_plant_x4 | ~540 × 400 | A whimsical house made of three giant mushrooms joined together: a tall central red-capped mushroom with white spots and two smaller orange and purple capped mushrooms, round windows and doors in the stems, small balconies, softly glowing blue mushroom lamps. Front yard base: soft moss ground with a winding pebble path and tiny glowing mushrooms. |
| 11 | nha_phuong_dong | Dinh gỗ phương Đông | human_church_x4 | ~580 × 400 | A large East Asian style wooden manor with sweeping curved dark-blue tiled roofs on two levels, red lacquered pillars, carved wooden lattice windows, round red paper lanterns hanging from the eaves, a wide wooden veranda and a central gate-like entrance. Front yard base: raked white gravel with flat stepping stones, a small stone lantern and two pruned pine bonsai shrubs. |
| 12 | nha_bien_hai_cang | Nhà thuyền trưởng ven biển | isles_fisher_cottage_x4 | ~560 × 420 | A big seaside captain's house painted white and sea-blue with weathered wooden shingle roofs, a tall round lighthouse-style tower with a glowing lamp room on one side, porthole windows, a ship's wheel and coiled ropes on the porch, nets and buoys on the walls. Front yard base: wooden boardwalk over pale sand with seashells, a small rowboat and a mooring post. |
| 13 | nha_lun_nui_lua | Sảnh rèn người lùn | volcano_dwarf_house_x4 | ~600 × 400 | A massive dwarven stone hall carved into dark volcanic rock: huge square stone pillars, a heavy round brass vault-like door with rivets, glowing orange forge windows, brass pipes and chimneys puffing smoke, a small channel of glowing lava running beside the front steps with a stone bridge. Front yard base: dark basalt flagstones with brass rails along the lava channel. |
| 14 | lau_dai_bang | Lâu đài băng | tundra_frost_cedar_x4 | ~560 × 420 | An elegant ice palace of translucent pale-blue ice and white snow stone with tall slender crystal spires, frosted arched windows glowing soft blue, icicle trims, a grand staircase of ice leading to tall ice doors. Front yard base: smooth snow-white courtyard with ice crystal lamp posts and frosted shrubs. |
| 15 | nha_coi_xay_hoa | Trang trại cối xay hoa | highland_windmill_x4 | ~560 × 420 | A large cheerful farmhouse attached to a tall brick windmill with four big white-sailed blades, a blue-trimmed white house with a steep orange roof, flower boxes, a wooden balcony, a red barn door. Front yard base: neat rows of red, yellow and pink tulips along a cobblestone path with a little wooden bridge over a narrow canal. |
| 16 | lau_kinh_vuon_hoa | Lâu kính vườn hoa | home_potted_plant_x4 | ~580 × 420 | A grand Victorian glass conservatory mansion: a white wrought-iron frame with a big central glass dome and two glass wings, full of lush green plants and colorful flowers visible inside, a white stone entrance with columns, hanging flower baskets. Front yard base: white gravel garden paths with round flower beds, a small fountain and trimmed hedges. |

## Khi xong

Báo chủ dự án số món đã vẽ và món nào chưa đạt (ghi rõ trong `prompts.json`: lề, sai tạo hình, đoạn rào dọc có nối liền được không).
Claude chuẩn hoá, ghép thử bãi quây bò / cừu và sân gà kín 4 phía, ô chuồng trong nhà có vách hai bên, và xếp 8 nhà mới cạnh nhà
đợt 7 để chủ dự án duyệt.

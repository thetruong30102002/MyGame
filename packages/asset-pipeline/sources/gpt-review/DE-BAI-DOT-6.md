# Đề bài GPT vẽ — đợt 6: bên trong công trình Gia viên — nhà kho, nhà kính, chuồng, xưởng khung cửi (12/11/2026)

Đợt 2–5 đã đủ đồ cho mọi nhà vào được ở thị trấn (quán rượu, ngân hàng, lò rèn, tạp hoá, tiệm thuốc, nhà trọ, đền Haven) và nhà ở
Gia viên (khách, bếp, ngủ tầng 2, phòng tắm). Đợt này vẽ đồ cho **bên trong các công trình phụ của Gia viên**
(`docs/ke-hoach-nha-rieng.md` mục 1 và 9.8 — kho, nhà kính, chuồng, xưởng khung cửi mở theo cấp nhà):
**nhà kho**, **nhà kính**, **chuồng trại** (KHÔNG vẽ con vật — gà / bò / cừu đã có bản PixelLab đi lại), **xưởng dệt khung cửi**.

**KHÔNG vẽ người / NPC / thú / tượng người / ma-nơ-canh** — chủ dự án 12/11: nhân vật và con vật chỉ vẽ bằng PixelLab. Đợt này CHỈ đồ vật.
Trứng, sữa, len, rơm là đồ vật nên được vẽ.

Luật, nơi lưu, cách ghi `prompts.json` y như đợt 1 (`DE-BAI-DOT-1.md` mục "Luật bắt buộc") và rút kinh nghiệm đợt 3–5
(lề ≥ 5 %, gửi kèm ảnh mẫu + một ảnh đợt trước đã duyệt). Thư mục ra: `packages/asset-pipeline/sources/gpt-review/dot-6/`.
Không sửa file khác, không build, không commit. Không đồ đội đầu (mũ, mũ rơm, mũ giáp, vương miện…) ở bất cứ món nào,
kể cả treo trên giá.

## Đuôi prompt chung (gắn sau mô tả của MỌI món)

```
Chunky chibi pixel art game sprite of indoor furniture in EXACTLY the same style as the attached references: front view with a
slight top-down angle, thick dark near-black outline around every shape, soft cel shading with 2–3 tones per material, warm
saturated colors, limited palette (at most 32 colors), crisp uniform square pixel blocks (every art pixel the same size, about
4×4 image pixels), no anti-aliasing, no gradients, no blur, no texture noise. One single object centered with at least 8% empty
space on every side, on a perfectly flat solid magenta #FF00FF background. No floor, no room, no cast shadow, no text, no letters,
no numbers, no labels, no people, no human figures, no mannequins, no animals, no birds, no characters, no hats.
```

Mảng tường (món 1, 7, 13, 19): thẳng chính diện, hai mép trái / phải là cột / trụ dọc cắt phẳng, đỉnh là dầm / gờ trần thẳng, đáy chân
tường thẳng — cùng khổ và kiểu ghép với `dot-2/tuong_go_ke.png`.

## Danh sách

Nhân vật trong game cao ~80 px; ô sàn 32 px. "Mẫu đợt trước" = ảnh gốc trong `dot-2/` … `dot-5/`.

| # | id | Món | Ảnh mẫu | Mẫu đợt trước | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|---|
| 1 | tuong_nha_kho | Tường nhà kho | home_wardrobe_x4 | dot-4/tuong_go_cua_hang | ~128 | A straight front-facing interior storehouse wall of rough dark-brown vertical wooden planks with two horizontal crossbeams, a small square wooden hatch window with daylight, a coil of rope and an oil lantern hanging on iron hooks, thick wooden posts on the left and right edges, a ceiling beam along the top. |
| 2 | ke_kho_lon | Kệ kho lớn | home_bookshelf_x4 | dot-4/ke_hang | ~96 | A tall sturdy wooden storage rack with three shelves holding wooden crates, clay jars with cloth lids, glass jars of pickles and small burlap sacks. |
| 3 | chong_bao_tai | Chồng bao tải | home_chest_x4 | dot-4/bao_thung_hang | ~48 | A neat stack of five plump burlap grain sacks tied with string, one sack open at the top showing golden wheat grains, no writing on the sacks. |
| 4 | gia_nong_cu | Giá treo nông cụ | home_bookshelf_x4 | dot-3/ke_gia_vi | ~72 | A wall-mounted wooden tool rack holding a hoe, a rake, a sickle, a small shovel and a green metal watering can hanging on pegs. |
| 5 | thung_go_chong | Thùng gỗ chồng | home_chest_x4 | dot-3/thung_tao_rau | ~56 | Three stacked open wooden crates, the top one full of red apples, the middle one full of potatoes, the bottom one full of orange carrots. |
| 6 | can_dia_lon | Cân bàn lớn | home_wall_clock_x4 | dot-4/quay_hang | ~60 | A large old-fashioned wooden platform scale with a brass beam arm, a sliding brass weight and a few round iron weights stacked beside it. |
| 7 | tuong_nha_kinh | Tường nhà kính | home_wardrobe_x4 | dot-2/tuong_go_cua_so | ~128 | A straight front-facing greenhouse wall made of a white-painted wooden frame holding many square glass panes tinted pale sky-blue with light reflections, green ivy climbing up one side, a low wooden plank skirting at the bottom, thick white wooden posts on the left and right edges, a white beam along the top. |
| 8 | luong_cay_cao | Luống cây nâng cao | home_chest_x4 | dot-4/ke_rau_qua | ~40 | A long raised wooden planter box on short legs filled with dark soil and a row of young green vegetable sprouts and lettuce, wide shape (much wider than tall). |
| 9 | ban_uom_cay | Bàn ươm cây con | home_dining_table_x4 | dot-3/quay_so_che | ~64 | A wooden potting bench with small terracotta pots of seedlings on top, a hand trowel, an open sack of soil, and a lower shelf with stacked empty pots. |
| 10 | gian_day_leo | Giàn dây leo | home_potted_plant_x4 | dot-3/chau_cay_lon | ~96 | A wooden trellis arch frame covered with a climbing green vine with red cherry tomatoes and small yellow flowers, growing from a long wooden planter at its base. |
| 11 | gia_chau_bac | Giá chậu bậc thang | home_potted_plant_x4 | dot-5/ke_khan | ~72 | A three-tier stepped wooden plant stand with small potted herbs and flowers on each step: basil, mint, lavender and a pink geranium. |
| 12 | thung_nuoc_mua | Thùng hứng nước mưa | home_water_barrel_x4 | dot-2/thung_ruou_lon | ~56 | A wooden rain barrel with iron hoops and a brass tap near the bottom, filled with clear water, a small green watering can standing beside it. |
| 13 | tuong_chuong | Tường chuồng trại | highland_barn_x4 | dot-2/tuong_go_ke | ~128 | A straight front-facing interior barn wall of warm red-brown vertical wooden boards with white X-braced crossbeams, a small square hay-loft hatch near the top with straw sticking out, an iron lantern hook, thick wooden posts on the left and right edges, a ceiling beam along the top. |
| 14 | ngan_chuong | Vách ngăn ô chuồng | home_chair_x4 | dot-2/coc_day_chan | ~52 | A low wooden livestock stall partition with a half-height swinging gate in the middle, iron hinges and a latch, seen from the front, wide shape. |
| 15 | mang_an | Máng ăn | home_chest_x4 | dot-4/thung_toi | ~32 | A long wooden feeding trough on short legs filled with fresh green hay and golden grain, wide shape (much wider than tall). |
| 16 | dun_rom | Đụn rơm | home_potted_plant_x4 | dot-4/bao_thung_hang | ~56 | A big round pile of loose golden hay with a wooden pitchfork stuck into it at an angle. |
| 17 | o_de_ga | Ổ đẻ gà | home_bookshelf_x4 | dot-3/tu_ngan_keo | ~56 | A wooden nesting box cabinet with two rows of three open cubbies, each lined with straw, some cubbies holding white and brown eggs, no birds. |
| 18 | xo_sua_ghe | Xô sữa và ghế vắt sữa | home_chair_x4 | dot-4/ghe_dau | ~36 | A small three-legged wooden milking stool with a tin milk pail full of white milk beside it. |
| 19 | tuong_xuong_det | Tường xưởng dệt | home_wardrobe_x4 | dot-3/tuong_thach_cao_cua_so | ~128 | A straight front-facing workshop wall: cream plaster with dark timber framing, a window with small panes, a wooden shelf of colorful thread spools and skeins of yarn, thick wooden posts on the left and right edges, a ceiling beam along the top. |
| 20 | khung_cui | Khung cửi | home_wardrobe_x4 | dot-4/gia_vai | ~84 | A wooden floor loom with a half-woven cloth in a blue and red diamond pattern, colorful threads stretched across the frame, a wooden shuttle resting on it, a small bench in front. |
| 21 | guong_quay_soi | Guồng quay sợi | home_chair_x4 | dot-4/ban_mai | ~68 | A classic wooden spinning wheel with a big spoked wheel, a foot pedal and a fluffy tuft of white wool on the spindle. |
| 22 | ke_cuon_len | Kệ cuộn len | home_bookshelf_x4 | dot-4/ke_hang | ~72 | A wooden cubby shelf filled with balls of yarn in many colors (red, blue, yellow, green, pink, white) and a few folded fabric bolts. |
| 23 | ban_cat_vai | Bàn cắt may | home_dining_table_x4 | dot-2/ban_lam_viec | ~56 | A wooden sewing table with a roll of patterned fabric, big iron scissors, a measuring tape, a red pincushion with pins and a small wooden box of buttons. |
| 24 | gio_long_cuu | Giỏ lông cừu | home_chest_x4 | dot-5/gio_do_giat | ~40 | A big round woven wicker basket overflowing with fluffy raw white sheep wool fleece (only wool, no sheep). |

## Khi xong

Báo chủ dự án số món đã vẽ và món nào chưa đạt (ghi rõ trong `prompts.json`: lề, sai tạo hình). Claude chuẩn hoá
(`scripts/gpt-normalize.py --height <cao>`), ghép thử 4 phòng nhà kho, nhà kính, chuồng (có gà / bò / cừu PixelLab đứng thử),
xưởng dệt để chủ dự án duyệt.

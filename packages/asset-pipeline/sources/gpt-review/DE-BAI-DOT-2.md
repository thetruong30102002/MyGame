# Đề bài GPT vẽ — đợt 2: nội thất nhà vào được (11/11/2026)

Chủ dự án: "Tôi mong muốn có những nhà như quán rượu sẽ vào được bên trong"; "Vào những nhà như quán rượu, ngân hàng, nhà ở riêng
ở Gia viên thì bên trong là map nền gỗ, cột nhà…". Đợt này vẽ **kết cấu trong nhà** (mảng tường, cột, cầu thang, cửa) và
**đồ nội thất** quán rượu + ngân hàng. Sàn nhà là ô lát lặp lại — Claude làm riêng, GPT KHÔNG vẽ sàn.

Luật, nơi lưu, cách ghi `prompts.json` và cách gửi ảnh mẫu y như đợt 1 (`DE-BAI-DOT-1.md` mục "Luật bắt buộc"), chỉ đổi thư mục ra:
`packages/asset-pipeline/sources/gpt-review/dot-2/`. KHÔNG vẽ nhân vật / người / thú / hoạt ảnh. Không sửa file khác, không build, không commit.

## Đuôi prompt chung (gắn sau mô tả của MỌI món)

```
Chunky chibi pixel art game sprite of indoor furniture in EXACTLY the same style as the attached reference: front view with a
slight top-down angle, thick dark near-black outline around every shape, soft cel shading with 2–3 tones per material, warm
saturated colors, limited palette (at most 32 colors), crisp uniform square pixel blocks (every art pixel the same size, about
4×4 image pixels), no anti-aliasing, no gradients, no blur, no texture noise. One single object centered with empty space
around it, on a perfectly flat solid magenta #FF00FF background. No floor, no room, no cast shadow, no text, no letters,
no numbers, no people, no animals, no characters.
```

Mảng tường: vẽ **thẳng chính diện**, hai mép trái / phải là cột / trụ dọc thẳng đứng cắt phẳng (để ghép nhiều mảng liền nhau,
chỗ nối bị cột che), đáy là chân tường thẳng.

## Danh sách

Nhân vật trong game cao ~80 px; ô sàn 32 px. Cột "Cao trong game" để Claude thu nhỏ.

| # | id | Món | Ảnh mẫu | Cao trong game | Mô tả (dán trước đuôi chung) |
|---|---|---|---|---|---|
| 1 | tuong_go_cua_so | Mảng tường gỗ có cửa sổ | home_wardrobe_x4, home_bookshelf_x4 | ~128 | A straight front-facing interior wall panel of warm horizontal wooden planks with a darker wooden wainscot at the bottom, a four-pane window with short curtains in the middle, a thick vertical wooden post on the left and right edges, a wooden ceiling beam along the top. |
| 2 | tuong_go_ke | Mảng tường gỗ có kệ treo | home_bookshelf_x4 | ~128 | A straight front-facing interior wall panel of warm wooden planks with a dark wainscot, a long wall shelf holding jars and plates, a few hanging herbs, thick wooden posts on the left and right edges, a ceiling beam along the top. |
| 3 | tuong_thach_cao | Mảng tường vôi khung gỗ (nhà ở) | home_fireplace_x4 | ~128 | A straight front-facing interior wall panel of cream plaster with dark timber framing (half-timbered), a small framed picture, thick wooden posts on the left and right edges, a ceiling beam along the top. |
| 4 | tuong_da_vom | Mảng tường đá có cửa sổ vòm (ngân hàng) | home_fireplace_x4 | ~140 | A straight front-facing interior wall panel of pale cut stone blocks with a tall arched window with iron lattice, a dark red wall banner with a plain gold coin emblem, square stone pilasters on the left and right edges, a carved stone cornice along the top. |
| 5 | cot_go | Cột gỗ | home_wardrobe_x4 | ~140 | A single thick square wooden support pillar with a stone base and diagonal wooden braces at the top holding a short beam piece. |
| 6 | cot_cam_thach | Cột cẩm thạch | home_fireplace_x4 | ~150 | A single round white marble column with gold rings, a square base and a decorated capital. |
| 7 | cau_thang_go | Cầu thang gỗ | home_bookshelf_x4 | ~130 | A wooden indoor staircase going up to the right, with wooden railing and banister posts. |
| 8 | cua_ra_go | Cửa ra (trong nhà) | home_wardrobe_x4 | ~100 | A front-facing wooden double door with iron hinges and a small doormat in front, set in a wooden door frame. |
| 9 | quay_bar | Quầy bar quán rượu | home_dining_table_x4 | ~64 | A long wooden tavern bar counter seen from the front, polished top with a few foam beer mugs and a cloth, panelled front. |
| 10 | ke_ruou | Kệ rượu sau quầy | home_bookshelf_x4 | ~120 | A tall wooden back-bar shelf full of colorful bottles, stacked mugs and small kegs, with a mirror strip in the middle. |
| 11 | thung_ruou_lon | Thùng rượu lớn có vòi | home_wardrobe_x4 | ~70 | A big wooden ale barrel lying on a wooden rack, iron hoops, a brass tap with a mug under it. |
| 12 | ban_tron_ghe | Bàn tròn + ghế đẩu | home_dining_table_x4, home_chair_x4 | ~56 | A round wooden tavern table with two foam beer mugs and a plate of bread, two wooden stools on the left and right. |
| 13 | lo_suoi_lon | Lò sưởi đá lớn | home_fireplace_x4 | ~120 | A big stone hearth fireplace with a roaring fire, a cooking pot hanging on a hook, firewood stacked at the side, a wooden mantel with candles. |
| 14 | den_chum_go | Đèn chùm bánh xe | home_chair_x4 | ~50 | A wagon-wheel wooden chandelier hanging from short chains, with lit candles around the rim. |
| 15 | san_khau_nho | Sân khấu nhỏ | home_dining_table_x4 | ~48 | A small raised wooden stage platform with two steps and a single wooden stool on it. |
| 16 | quay_giao_dich | Quầy giao dịch ngân hàng | home_dining_table_x4 | ~84 | A long front-facing bank teller counter of polished dark wood with a marble top, three teller windows with brass bars, a small bell and stacks of coins on the counter. |
| 17 | cua_ket_lon | Cửa két lớn | home_wardrobe_x4 | ~120 | A giant round steel bank vault door set in a stone wall frame, big spoke handle wheel, heavy bolts and rivets. |
| 18 | ket_sat | Két sắt nhỏ | home_wardrobe_x4 | ~48 | A small heavy iron safe with a dial lock and a brass handle. |
| 19 | ban_lam_viec | Bàn làm việc ngân hàng | home_dining_table_x4 | ~56 | A wooden desk with an open ledger book, a quill in an inkpot, a small brass coin scale and a stack of gold coins. |
| 20 | coc_day_chan | Cột dây chắn | home_chair_x4 | ~44 | Two brass stanchion posts joined by a red velvet rope. |
| 21 | chong_vang | Chồng vàng | home_dining_table_x4 | ~40 | A pile of shiny gold coins with a few stacked gold bars and a small open treasure sack. |
| 22 | den_chum_vang | Đèn chùm vàng | home_chair_x4 | ~56 | An elegant golden chandelier with crystal drops and lit candles, hanging from a short chain. |

## Khi xong

Báo chủ dự án số món đã vẽ và món nào chưa đạt. Claude chuẩn hoá (`scripts/gpt-normalize.py --height <cao>`), ghép thử một
phòng quán rượu / ngân hàng / nhà ở có sàn, tường, cột, đồ và nhân vật đứng trong để chủ dự án duyệt.

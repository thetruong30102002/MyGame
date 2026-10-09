# Asset pipeline nhân vật

```
spec (packages/asset-pipeline/src/specs/<id>.json)
  → Provider (FreePixel | Pixler | SpriteLab)      tải/sinh frame theo 8 hướng
  → PixelStyleNormalizer                           đúng lưới pixel, alpha cứng, canvas 128×160, chân ở y=150
  → Dọn vật lạ (tự động) + xoá theo vùng đã duyệt   gỡ vũ khí/vật thể lúc có lúc không
  → Recolor theo luật                              biến thể màu áp lên MỌI frame → nhất quán tuyệt đối
  → Quality Gate (tự động + kết quả duyệt bằng mắt)
  → atlas PNG + JSON Pixi + quality.json → apps/web/public/assets/characters/<id>/
  → manifest.json                                   web chỉ tải atlas của thực thể có mặt (lazy)
```

Chạy: `npm run assets:character -- <id> [<id>...]`. Báo cáo và contact sheet của từng nhân vật nằm ở
`packages/asset-pipeline/reports/<id>/` (không commit).

## Khoá API

`.env.local` ở gốc repo (đã gitignore; mẫu ở `.env.example`). Chỉ pipeline (Node, chạy offline) đọc
file này. App web **không import** package pipeline nên khoá không thể lọt vào bundle client. Log chỉ in
"đã cấu hình / chưa cấu hình", không bao giờ in giá trị.

## Cổng chất lượng

Mọi mục phải **pass** thì mới được xuất vào game. Nhân vật trượt cổng sẽ bị **gỡ khỏi `public/` và
manifest** nếu trước đó đã được xuất.

| Mục | Cách kiểm |
| --- | --- |
| Đủ 8 hướng, đúng số frame | đếm theo spec (idle 4–6, walk 6–8) |
| Không có frame rỗng | sheet FreePixel hay có ô trống |
| Kích thước 128×160, nền trong suốt | viền canvas phải rỗng |
| Mép cứng, không AA | 0 pixel bán trong suốt |
| Không nhoè | ≤ 128 màu/frame và tỉ lệ "bậc màu li ti" giữa pixel kề nhau < 12% |
| Silhouette đọc được, liền khối | cao 45–95% canvas; mảnh chính ≥ 97% |
| Tỉ lệ ổn định | chiều cao hộp bao trong cùng một hướng lệch ≤ 8% |
| Không có vật/màu lạ | cụm ≥ 12px mang **họ màu** chỉ xuất hiện ở ≤ 10% số frame; bỏ qua cụm giáp da (mắt/miệng nhìn nghiêng) |
| **Duyệt bằng mắt** | trường `review` trong spec (`approved` / `rejected` + lý do). Thiếu trường này thì **không xuất** |

Máy không bắt được vật lạ **cùng họ màu với thân** (rìu xám-nâu, cuốc chim). Vì vậy bước duyệt bằng mắt
là bắt buộc, không phải làm cho có: 3 nhân vật qua cổng tự động vẫn bị loại ở bước này (bảng dưới).

## Đội hình vertical slice: Human Kingdom (01/10/2026)

> **07/10/2026: đã XOÁ khỏi game** toàn bộ nhân vật FreePixel/vẽ tay trong bảng dưới (trừ những ID đã vẽ lại bằng
> PixelLab: `mob_mushroom_001`, `mob_skeleton_archer_001`, `boss_demon_001`) — asset, mục manifest, report và 39 spec
> FreePixel/Pixler chưa từng xuất. `mob_zombie_001` / `mob_gargoyle_001` chỉ còn spec PixelLab chờ vẽ lại cho vùng quái
> sau. Bảng giữ làm lịch sử.

| Vai trò | ID | Nguồn FreePixel | Kết quả |
| --- | --- | --- | --- |
| Player | `player_mage_001` | `blue-wizard` | ✔ đã dọn trượng lạc (idle/N, walk/NW#4-5), recolor áo xanh đậm + tóc bạc |
| Player | `player_swordsman_001` | `phoenix-knight` | ✔ |
| Player nữ | `player_lior_child_f` · `player_mage_001_f` | Tự vẽ pixel art | ✔ bản đầu: 8 hướng, idle + walk, trẻ thơ + trưởng thành; có thể nâng cấp bằng PixelLab sau |
| NPC | `npc_merchant_001` | `merchant` | ✔ (ngoại lệ đã duyệt: sọc quần đỏ chỉ lộ khi nhìn ngang) |
| NPC | `npc_squire_001` | `squire` | ✔ |
| NPC | `npc_medic_001` | `medic` | ✔ (trang phục hơi hiện đại) |
| Monster | `mob_mushroom_001` · `mob_gargoyle_001` · `mob_zombie_001` · `mob_skeleton_archer_001` · `mob_beast_001` | cùng tên | ✔ |
| Boss | `boss_demon_001` | `demon` | ✔ |

**Bị loại** (lý do lưu trong spec / report):

- Cổng tự động chặn:
  - frame rỗng: `blacksmith`, `prince`, `cleric`, `goblin-warrior`, `fisherman`, `jester`, `guard`, `ghost`
  - đổi màu quần giữa chu kỳ đi: `healer`
  - khối màu lạ: `lizardman`, `vampire`, `rock-golem`, `wraith`, `lich`
  - thiếu file trên CDN: `imp`, `princess`, `bard`, `king`, `baker`, `happy-farmer`, `owl-sage`
- Loại khi duyệt bằng mắt:
  - `lumberjack`: rìu lúc có lúc không
  - `miner`: cuốc mất giữa chu kỳ đi
  - `alchemist`: lọ thuốc hiện ở vài frame và đổi màu

## Gói PixelLab trả phí (09/10/2026) — cách vẽ đã chạy thật

Token #1 = Tier 2 (5.000 lượt / tháng, **10 job song song**). Số liệu và bẫy đã đo:

- **Động tác cầm vũ khí vẽ trên PHIÊN BẢN cầm sẵn vũ khí** (`create_character_state`: "holding a steel longsword / wooden staff",
  10–25 lượt / bản), không vẽ trên thân tay không: vũ khí liền tay suốt chuỗi khung. Gói tải về của nhóm chứa MỌI phiên bản;
  `PixelLabSource.animationFiles` tìm tên động tác ở mọi phiên bản (đứng / đi vẫn của phiên bản đầu). Game ẩn lớp vũ khí gắn ngoài
  ở các động tác này (`gearArt.BAKED_HELD` sinh từ `MoveDef.wield`).
- **v3 hơn pixminimax** cho động tác người (so cùng prompt vung kiếm: v3 thân chuyển động, kiếm quét liền; pixminimax kiếm "nhảy
  cóc", thân đứng). v3 trả **khung nới** (×1,375 làm tròn bội 4: 64→88, 80→108) với nhân vật ở giữa → `padToLargest` đệm mọi khung
  về khổ lớn nhất trước `alignToIdle`; spec khai ô đủ chứa (người 112×112 chân y=100, bé 96×96 chân y=84).
- `pixellab animate … --together`: gửi mọi hướng trong MỘT lệnh. Gặp giới hạn 10 job giữa chừng thì máy chủ **nhận thiếu hướng
  mà không báo lỗi** (dòng `cost: N generations (2/dir x 2)`) → luôn chạy lượt bù (chạy lại đúng lệnh: hướng đã có trong gói tải về
  tự bỏ qua). Hết ô thì gói trả phí báo "Maximum 10 concurrent background jobs" (khác "job slots" của gói Free) — `callWhenFree`
  nhận cả hai.
- Hiệu ứng: vẽ khung đầu (`--first-only`) → **đo** hướng rồi mới animate. Vệt chém / sóng / đạn quy ước bụng lồi hoặc đầu mũi quay
  sang **phải (+x)**; ĐO bằng tâm ngang hàng giữa so với hai đầu mút, đừng ngắm — đã nhìn nhầm một lần (`fire_slash`).
- Hiệu ứng đã vẽ nhưng game chưa dùng khai `later: true` ở `VFX` → để ngoài atlas (atlas giữ ≤ 4096, mọi người chơi đều tải).
- Spec mới: `pixellab.reverse` (động tác = động tác khác phát ngược, vd `revive` ← `death`), `pixellab.drop` (loại khung theo số),
  `quality.driftAnims` (ngưỡng lệch cao riêng cho động tác cố ý đổi dáng), `quality.minSilhouette` (ô nới cho khung v3 thì quái nhỏ
  cần sàn thấp hơn 0,45). Động tác nằm (`death`, `revive`) chỉ kiểm trần chiều cao.
- Atlas nhân vật xếp **kệ** (không còn lưới 8 hàng / animation): 25 động tác × khung 112 với lưới cũ cao ~24.000px.
- Funnel phục vụ thẳng `apps/web/public` → dựng thử: `AETHER_WEB_ASSETS=<thư mục nháp> npx tsx src/cli.ts character <id>` (chép
  `manifest.json` vào thư mục nháp trước).

## Còn nợ / bước tiếp

- ~~Sprite nữ vẽ bằng mã nguồn (`src/manual/renderPlayerFemale.ts`, `assets:player-female`)~~ — đã GỠ 07/10/2026:
  nhân vật nữ giờ là bản PixelLab (`player_lior_child_f`, `player_hero_adult_f`), công cụ vẽ tay không còn dùng.

- **Trượng gỗ của Mage chưa có**. Nguồn vẽ trượng không nhất quán nên đã gỡ khỏi thân. Trượng sẽ là
  **lớp trang bị riêng** (weapon layer gắn theo điểm neo tay), đúng với hệ build Sword/Staff/Bow… của game.
- FreePixel **không có** attack/cast/hit/death/dodge/block. Hai hướng xử lý: mua credit PixelLab để
  `animate_image` trên chính sprite đã chuẩn hoá, hoặc lấy bộ 2DHD CC0 của hormelz (xem `asset-sources.md`).
- Boss hiện cùng cỡ với quái thường. Phóng 2× sẽ lệch mật độ pixel nên không làm; thay vào đó cần
  nguồn boss to sẵn hoặc trình diễn bằng camera và VFX.
- WebP: hiện xuất PNG (atlas mỗi nhân vật khoảng 300 kB). Nén WebP lossless sẽ làm ở Phase 12.

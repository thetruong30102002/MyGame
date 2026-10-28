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
  `PixelLabSource.animationFiles` tìm tên động tác ở mọi phiên bản (`idle` / `walk` tay không của phiên bản đầu; đứng / đi cầm vũ
  khí đặt tên riêng — mục ngay dưới). Game ẩn lớp vũ khí gắn ngoài ở các động tác này (`gearArt.BAKED_HELD` sinh từ `MoveDef.wield`).
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
- Funnel phục vụ thẳng `apps/web/public` → dựng thử: `HAVENLORD_WEB_ASSETS=<thư mục nháp> npx tsx src/cli.ts character <id>` (chép
  `manifest.json` vào thư mục nháp trước). Thư mục nháp CHUNG: `.havenlord-stage/assets` (gitignore) — web thử :3102 đọc `/assets`
  từ đây trước, thiếu file mới lấy public (`apps/web/scripts/stage-assets.mjs` :3105, `next.config.ts` `HAVENLORD_STAGE_URL`); máy
  chủ thử :3201 chạy với `HAVENLORD_MAPS=.havenlord-stage/assets/maps`. Triển khai = chép nháp sang public (README mục Funnel).
- **Đồ vật map** (10/10/2026 — ĐỢT 2 vùng 1, 48 lượt, không vẽ lại món nào): TẤM 3×3 `pixellab image 1 sheets/<tấm>.png
  @pending/<tấm>.json` (192×192, 6 lượt): ảnh mẫu `sheets/N1_nature.png` + `color_palette: false` + "each small and centered in
  its own cell" + nền magenta → G1 / R1 / B1 đều ra đúng thứ tự ô ngay lần đầu (công thức của CV1 / CV2). MÓN LẺ `pixellab object 1
  <tên> @<json>` (create_object_pro_flash 1 hướng, 6 lượt ở 160×192 / 192×192): lệnh gửi JSON nguyên văn nên `style_image` phải là
  base64 — đề bài dễ đọc ở `objects/<tên>/args.json` (`style_image_path`). Ảnh mẫu phải lọt khung vẽ (không co giãn): cây →
  `style/tree_ref.png`, công trình / đá → `objects/house_stone/house_stone.png`. Duyệt: cắt thử bằng `loadSheetCell`, xếp cạnh nhân
  vật + cây sồi trên nền màu biome rồi mới dựng map.
  TẤM Ô RỘNG (C1_chapter1, 10/10/2026, 6 lượt): vẫn 192×192 nhưng lưới **2 cột × 3 hàng** (ô 96×64) cho món rộng (lều, thuyền) —
  đề bài tả theo hàng ("top row left: …; top row right: …; middle row left: …") → đúng ô ngay lần đầu dù ảnh mẫu N1 là 3×3. Món
  vẽ lấn đường lưới vài điểm (đỉnh mặt đồng hồ, ngọn lau) → đuôi `+<px>` nới ô khi cắt (`sheet:C1_chapter1#2@2x3+3`, `props/sheet.ts`);
  đo trước bằng hộp bao từng cụm sau `keyMagenta`. Thêm đồ vật vào map cũ mà không xáo map: ép đặt (`force`, không gọi `rand`) ở
  chỗ chưa có đồ vật, món rải ngẫu nhiên mới thì đặt SAU `sprinkleDecals` — so diff JSON: chỉ thêm, không mất món nào.
- **Vẽ lại hướng hỏng của quái** (10/10/2026, 3 lượt): đánh N dơi hang (`attack2` — bản đầu quay mặt ra trước + vệt sáng xanh, ô
  đỏ lạ): v3 8 khung `"seen from behind, facing away from the viewer the whole time, the face is never visible; …; nothing glows, no
  flashes, no light, no particles, no effects"`; đi N Gargoyle Đá (`walk2` — mẫu `walking-8-frames` thường vẽ cánh ĐEN dù ảnh xoay
  cánh đá xám): v3 8 khung `"walking in place seen from behind, … the folded wings stay pale grey granite like the rest of the body,
  same colors as the reference in every frame"` (2 lượt ở canvas 128). Spec khai `attack: ["attack2", "attack"]` / `walk: ["walk2",
  "walk"]`; tấm duyệt `reports/<id>/redo-review-*.png` (vạch chân đỏ, so bản cũ).

### Vũ khí vẽ liền thân — đứng / đi cầm kiếm, cầm trượng (10/10/2026)

Chủ dự án: "cầm kiếm tự gắn vào xấu" → nhân vật CẦM VŨ KHÍ SUỐT (đứng, đi, chém, niệm), không dán icon kiếm / trượng vào tay ở bất
kỳ động tác nào; bỏ hướng "chém tay không" (`<động tác>-hand*` vẽ tối 09/10 giữ trong nguồn làm lưu trữ, spec không dùng). Bản 16
tuổi cầm kiếm thép + trượng gỗ đầu pha lê xanh, bản bé cầm kiếm gỗ + trượng tập (đúng như phiên bản Sword / Staff đã vẽ).

- **Tên**: PixelLab `idle-sword` / `walk-sword` / `idle-staff` / `walk-staff` vẽ trên phiên bản `player_*_v2_*_sword|staff` (KHÁC
  `idle` / `walk` của phiên bản tay không — `PixelLabSource` tìm tên ở mọi phiên bản, trùng tên thì lấy nhầm bản tay không); vẽ lại
  hướng hỏng thì `<tên>2` (spec khai `["idle-sword2", "idle-sword"]`, ưu tiên theo từng hướng). Atlas / game: `idlesword`, `walksword`,
  `idlestaff`, `walkstaff` (khung atlas chỉ đọc được a–z) — animation BẮT BUỘC (cổng tầng 1, đủ 8 hướng: 5 vẽ + 3 lật gương), khai
  trong `quality.weaponAnims`.
- **Đo trên ảnh thật**: mẫu thường `walking-8-frames` làm RƠI vũ khí ở hướng nhìn ngang (mất cả kiếm thép 16 tuổi; trượng tập của bé
  rơi ở mọi hướng), `breathing-idle` mất nửa trên trượng bé / mất kiếm bản nữ ở hướng ngang. Đi → `--template walking-8-frames
  --mode skeleton-v3` (uốn chính ảnh nhân vật theo chuỗi tư thế của mẫu: kiếm giữ nguyên suốt chu kỳ, chân bước đúng nhịp mẫu; ~3
  lượt / hướng, khung nới 64 → 80, máy chủ không trả dòng cost). Trượng MẢNH đôi khi bị uốn gãy / giấu sau lưng (5/20 hướng trượng:
  bé trai S, E; bé gái N; 16 tuổi nam, nữ E) → vẽ lại hướng đó bằng v3 8 khung với mô tả CHẶT: `"walking in place toward the viewer,
  steady looping walk cycle, holding the wooden training staff upright at the side in one hand, the staff stays upright in every
  frame"` (1 lượt bé, 2 lượt 16 tuổi) — đạt cả 5. Mô tả lỏng ("holding the staff…") thì v3 quay trượng ngang lung tung. Đứng → mẫu
  `breathing-idle` (kiếm 16 tuổi) hoặc v3 4 khung (1 lượt / hướng — trượng, kiếm gỗ bé); v3 hay vung vũ khí 45° / nhắm mắt / QUAY ĐẦU
  ra sau giữa chừng → mô tả chặt: `"standing still (in side profile facing right the whole time, the head does not turn), idle
  breathing only, eyes open, holding …, the <vũ khí> stays still at the same angle in every frame, no swinging, no magic effects"`.
  CLI: `pixellab animate <id> <tên> --template <mẫu> --mode skeleton-v3 …`. Tấm duyệt: `reports/<id>/held-review-{idle,walk}.png`.
  Vẽ lại sau (10/10/2026, 1 lượt / hướng, đạt ngay): đứng trượng S 16 tuổi nam (`idle-staff2` — bản đầu NHẮM MẮT cả 4 khung) thêm
  `"eyes open the whole time and never closed"` + giữ trượng `"on the left side of the picture"` như bản cũ; đứng kiếm E bé trai
  (`idle-sword2` — bản đầu cúi đầu, tóc che mặt) thêm `"the head stays upright looking straight ahead and never looks down"`. Tấm
  `reports/<id>/redo-review-{idlestaff,idlesword}.png`; atlas 16 tuổi vẫn 1238 ô (thay khung, không thêm).
- Atlas 16 tuổi thêm 192 khung → 1112 khung 112px: xếp kệ thường cao 4106px > 4096 → `packAtlas` bẻ chuỗi qua hàng khi hết cột
  (3992×3650); atlas vốn vừa thì xếp y như cũ. Thêm khung cũng làm đổi tỉ lệ "màu hiếm" của kiểm vật lạ (bé gái: bóng chân đi S#4
  bị gắn cờ → `quality.allowForeign`).
- Vẽ xong trên phiên bản thì tải gói NHÓM về thư mục spec đọc: `pixellab download player_hero_adult <uuid phiên bản đầu>` (registry
  `player_hero_adult` / `_f`, `player_lior_child` / `_f`). Gói chứa mọi phiên bản; soát `git status` để chắc khung động tác cũ không đổi.
- Game (`apps/web/src/game/gearArt.ts`, `gearLayers.heldArt`, `CharacterView.setHeld`): đứng / đi chọn bản theo vũ khí đang cầm —
  thế kiếm + mặc kiếm → `*sword`, thế phép + mặc trượng → `*staff`, thiếu món đúng thế thì cầm món đang có, không mặc vũ khí → tay
  không; atlas chưa có bản cầm → tay không, không lỗi. Mạng vẫn gửi `idle` / `walk` (máy người xem tự chọn bản theo đồ người kia).
  Trúng đòn / lướt / gục / uống bình có bản cầm riêng từ lượt 2 — mục ngay dưới.

#### Động tác thân cầm vũ khí — trúng đòn, lướt né, gục, uống bình (10/10/2026, lượt 2)

Trước đây 4 động tác này chỉ có bản tay không nên lúc diễn kiếm / trượng biến mất chốc lát. Nay vẽ trên CHÍNH phiên bản Sword /
Staff: cùng số khung (trúng đòn / lướt 6, gục / uống 8) và cùng mô tả chuyển động với bản tay không (`sources/pixellab/new-hero/
moves*.tsv`) để fps / thời lượng spec giữ nguyên, thêm câu giữ vũ khí. Tổng 129 lượt token #1 (lượt đầu 98 + vẽ lại 31 lượt / 19 hướng).

- **Tên**: PixelLab `hit-sword` / `hit-staff`, `dodge-*` (chỉ 16 tuổi — bé không có lướt), `death-*`, `drink-*` (chỉ bé); vẽ lại
  hướng hỏng `<tên>2` (lần 3: `<tên>3`, spec khai `["death-staff3", "death-staff2", "death-staff"]`); bản vẽ lại tệ hơn thì
  `pixellab.reject` (bản nữ `"death-staff2": ["N"]`). Atlas /
  game: `hitsword`, `hitstaff`, `dodgesword`, `dodgestaff`, `deathsword`, `deathstaff`, `drinksword`, `drinkstaff` + `revivesword` /
  `revivestaff` = gục bản đó phát ngược (`pixellab.reverse`). Spec khai như bản tay không + `weaponAnims` (vũ khí là chủ ý, vũ khí
  rơi lúc gục tách khỏi thân) + `driftAnims`; cổng chất lượng coi `death*` / `revive*` là dáng nằm (`LOW_POSE`).
- **Mô tả v3** = mô tả bản tay không + `"…, keeps holding the steel sword in his right hand in every frame, the sword never leaves
  his hand"`; gục: `"…; the steel sword slips out of his hand as he falls and lies on the ground beside him, there is only one sword
  and it never comes back into his hand"` (khung cuối không mọc thêm kiếm); bé: `"… in the same hand on the same side of his body
  in every frame …"`; uống bình (bé): `"keeps holding the small wooden sword lowered in the same hand on the same side of his body
  the whole time, lifts a small red potion bottle to the mouth with the free hand …"`. Lượt thật (dòng `cost`): 16 tuổi 1–2 lượt /
  hướng, bé 1.
- **Đo trên ảnh thật** — lượt đầu 16 tuổi hỏng 10/24 hướng trúng đòn + lướt: nhìn TRƯỚC (S) kiếm thép CHUYỂN sang tay kia / vung
  ngang ở cả 4 lần — "right hand" bị hiểu là bên phải ẢNH; nhìn SAU (N) có lần quay mặt ra người xem hoặc trượng nhảy sang bên kia;
  nhìn ngang (E) trượng ngả ngang / mất đầu pha lê vài khung. Vẽ lại bằng mô tả theo PHÍA ẢNH + hướng nhìn → đạt cả 10 ngay lần vẽ
  lại: S `"facing the viewer the whole time, …, keeps holding the steel sword lowered at his side on the left side of the picture in
  every frame, blade pointing down to the lower left, the sword stays on the same side and never crosses his body, no swinging"`;
  N `"seen from behind, facing away from the viewer the whole time, the face is never visible, …"`; E `"in side profile facing right
  the whole time, the head does not turn, …, holds the wooden staff with the blue crystal on top vertically upright in front of him
  in every frame, the crystal is always visible, the staff never tilts"`. Bản bé (mô tả trung tính, không nói tay phải) đạt ngay
  trúng đòn / uống bình; gục bé gái E lần đầu NGỒI giơ kiếm → vẽ lại. Phiên bản trượng của NỮ 16 tuổi hay tự thêm hiệu ứng phép
  (vòng lục giác sáng, lửa xanh, bắn nước, pha lê bật khỏi trượng) dù mô tả "no magic effects"; gục N bản 2 còn tệ hơn, bản 3 đạt
  nhờ đổi hẳn cách tả: `"she simply faints: knees buckle and she slumps forward …; the wooden walking staff slips from her hand …;
  the staff is plain wood, nothing glows, nothing splashes, no blue light, no fire, no particles, no effects at all"`.
- **Game** (`CharacterView.actionArt`; `gearArt.HELD_BODY_ACTIONS` = mọi động tác `MoveDef.wield` null): đang cầm vũ khí vẽ liền
  thân (`heldArt`, cùng luật đứng / đi) → diễn bản cầm món đó nếu atlas có hướng đó (hoặc hướng kề); thiếu (chưa vẽ, atlas cũ) →
  bản tay không như trước, không lỗi. Nhịp theo spec bản cầm (manifest thiếu thì bản tay không). Áp cho người chơi mình lẫn người
  chơi khác — tin `action` vẫn mang tên gốc (`hit`, `drink`), máy người xem chọn bản theo đồ người kia. Lưu ý: cú lăn né thường chưa
  phát động tác nào; `dodge` chỉ diễn ở máy người xem khi máy người gửi bản cũ báo chiêu lướt.
- **Atlas ≤ 4096**: 16 tuổi ~1240 khung 112px > 35×35 ô → `packAtlas` cho khung TRÙNG từng điểm ảnh dùng chung một ô (`revive*` =
  `death*` ngược: −32 ô mỗi bộ) và hết chỗ thì thu lề giữa ô 2 → 1px (36×36 = 1296 ô; atlas 16 tuổi 4069×3956, 1238 / 1240 ô; bé
  2648×2942, 808 khung — còn rộng). **Uống bình 16 tuổi
  CHƯA vẽ**: thêm 64 khung là vượt 1296 ô — cần atlas 2 trang (`related_multi_packs`) hoặc cắt sát khung trước.
- Tấm duyệt: `reports/<id>/held-review-body-<động tác>.png` (tay không ↔ cầm kiếm ↔ cầm trượng × E/S/N/W, vạch chân đỏ, tâm xanh).
- Lỗi nhẹ còn lại (động tác hiếm hiện, chưa vẽ lại — ghi cả trong `review` của spec): vũ khí khuất dưới / sau người vài khung (lướt
  kiếm N nam khung 2–3; gục kiếm N nam khung 6–7; gục kiếm E, N bé trai, gục kiếm S + trượng E bé gái ở khung cuối); gục kiếm S nữ
  khung cuối vài sao chóng mặt trắng; trúng đòn kiếm E nữ vẫn hơi co gối; trượng nữ có vài điểm lấp lánh cạnh pha lê (như ảnh đứng).

## Icon chiêu v2 (10/10/2026) — 90 icon 32×32

Chủ dự án chê bộ v1 (10 tấm 3×3 `create_image_pro_flash`, icon ~64px) "xấu, kiểu AI": nhiều chi tiết, hào quang, hạt lấp lánh,
bóng chuyển sắc, mà hiện ở ô 16–32px phải thu ⅓ nên nát. Bộ v2 vẽ ĐÚNG cỡ hiện: MỘT ảnh 32×32 mỗi khoá (giữ nguyên 90 khoá).

- **Cách vẽ** (đã thử 3 cách × 6 icon, `sources/pixellab/skill-icons-v2/_thu/`): `create_image_pixflux` 32×32, `no_background`,
  outline `single color black outline`, shading `basic shading`, detail `low detail`, seed 4242, **ÉP bảng màu nhánh**
  (`color_image` — Kiếm thép + vàng / đỏ, Hoả đỏ-cam-vàng, Thuỷ xanh dương, Phong ngọc, Băng lam nhạt, Thổ nâu-đất son, Aether
  tím; + màu nhấn từng icon, `palettes/`). Đề bài = MỘT vật chính + đuôi ", simple chunky game icon". Kết quả 4–10 màu / icon,
  hình ~22–28px giữa ô. Loại: pixflux flat không ép màu (11–28 màu, nhiễu đuôi lửa), pixen (đậm nhưng 29–63 màu, nhiều điểm lẻ, tự
  thêm mặt cho quả cầu lửa / khiên).
- **Bẫy**: đề bài "kiếm + hiệu ứng" (vệt chém, mũi tên dội, sóng nước…) → pixflux chỉ vẽ thanh kiếm. Sửa bằng img2img:
  `init_image` = icon v1 thu nhỏ còn 28px (`init/`), `init_image_strength` 100–220 (thường 140) — giữ BỐ CỤC v1, vẽ lại theo
  style + bảng màu v2. Bảng khoá ghi `init` / `init_strength` / `seed` của bản được chọn; ứng viên loại ở `_ung-vien/`.
- **Lệnh**: vẽ một ảnh `npx tsx src/cli.ts pixellab pixflux|pixen <token#> <ảnh ra.png> @args.json` (1 lượt; args nhận thêm
  `color_image_path` / `init_image_path`; job đã trả lượt ghi `<ảnh>.pending.json` → chạy lại đúng lệnh chỉ tải tiếp). Dựng atlas
  `npm run assets:skill-icons` (mặc định v2; `-- --v1` = bộ tấm cũ) → CHỈ ghi `public/assets/ui/skill-icons.{png,json}` + ảnh duyệt
  `reports/skill-icons-preview.png`. Pipeline dọn nhẹ (alpha cứng, bỏ cụm rời ≤ 2 điểm, dời hộp bao vào giữa ô — không vẽ thêm),
  xếp lưới bước 36, hộp = cả ô 32×32.
- **Web** (`apps/web/src/components/iconFit.ts` · `skillIconFit`): chọn tỉ lệ theo phần hình (ô − lề 2px): ô 28–55 → 1× (thanh
  kỹ năng, cây chiêu, loadout 30), 56+ → 2× (nút cảm ứng to 64), 14–27 → ½; luôn nguyên lần / 1/n, toạ độ nguyên.
- Ngân sách: 143 lượt token #1 (thử 18 + vẽ đủ 86 + vẽ lại 39). Còn chưa ưng (vẽ lại nếu dư lượt): `tidal_wave` (hình nón
  nước giống tam giác), `spare:aether:3` (hai quả cầu + tia lửa, rối — chưa dùng), `future:earth:10` (đống đá, nắm đấm khó nhận),
  `calm_stance` ≈ `future:sword:10:thuy_than` (cùng vòm ngọc), thanh mảnh ở ½ (`pierce_rush`, `ice_spire`, `earth_rend`).
- **Vẽ lại lượt 2** (10/10/2026, 10 lượt): 7 icon, mỗi icon so cũ / mới ở 1× + ½ cạnh cả cột cây chiêu (`_duyet/ve-lai-2-so-sanh.png`,
  `_duyet/ve-lai-2-cot.png`), bản cũ chuyển `_ung-vien/`, bảng khoá ghi `redrawn`. `tidal_wave` → bọt nước toé (khác 3 icon sóng
  cuộn của cột Thuỷ); `future:earth:10` → đầu người đá mắt vàng (dễ đọc hơn nắm đấm ở 32px); `calm_stance` → khiên diều ngọc + kiếm
  (vòm ngọc giờ chỉ còn ở Thiên Tĩnh); `whirlpool` → vòng nước ngọc dày + kiếm (vẫn bố cục "kiếm trong vòng" như `gale_blade_dance`
  nhưng khác màu / độ đặc); `pierce_rush` → mũi lao thép đặc (img2img 200 từ vệt VFX `pierce_slash` kéo dày + kiếm t2 xoay 45° —
  `init/pierce_rush.v3.init.png`); `ice_spire` → cụm pha lê băng (đúng VFX cột băng); `earth_rend` → kiếm cắm tảng đá nứt. Bẫy mới:
  đề bài chữ "kiếm + vệt" ra thanh kiếm chéo y như `slash`; img2img từ ảnh KHÔNG viền (khung VFX) ra icon mất viền đen, lốm đốm
  (whirlpool i140 — loại). Còn chưa ưng: `earth_rend` thân kiếm vẫn mảnh (tảng đá đỡ khối), `whirlpool` như trên, `spare:aether:3`.

## Tranh lục địa — bản đồ tổng phím M (10/10/2026)

- Nguồn `sources/pixellab/world/continent.png` (688×384, `create_image_pro` token #1, đề bài `continent.png.json`). Lệnh
  `npm run assets:world` kiểm khổ 688×384 (khổ mà toạ độ 10 vùng ở `apps/web/src/game/world/worldAtlas.ts` đo trên đó) + ảnh kín,
  rồi chép NGUYÊN file sang `assets/ui/world-continent.png` — không nén lại, web hiện 1× / 2× nét pixel.
- Dựng thử: `HAVENLORD_WEB_ASSETS=D:/nttrg/pixel/.havenlord-stage/assets npm run assets:world` — đường dẫn TUYỆT ĐỐI: lệnh chạy trong
  thư mục gói pipeline nên đường dẫn tương đối ghi lạc sang `packages/asset-pipeline/.havenlord-stage`.
- Vẽ lại tranh: giữ khổ + bố cục hướng (docs/ke-hoach-the-gioi.md mục 3.1), đo lại `CONTINENT_PLACES` trên ảnh lưới; test
  `apps/web/tests/worldmap.test.ts` bắt lệch hướng / chồng vùng / ảnh web khác ảnh nguồn.

## Còn nợ / bước tiếp

- ~~Sprite nữ vẽ bằng mã nguồn (`src/manual/renderPlayerFemale.ts`, `assets:player-female`)~~ — đã GỠ 07/10/2026:
  nhân vật nữ giờ là bản PixelLab (`player_lior_child_f`, `player_hero_adult_f`), công cụ vẽ tay không còn dùng.

- ~~**Trượng gỗ của Mage chưa có** — sẽ là lớp trang bị riêng gắn theo điểm neo tay~~ — 10/10/2026: kiếm và trượng VẼ LIỀN
  THÂN trên phiên bản Sword / Staff (mục "Vũ khí vẽ liền thân"); lớp dán theo neo chỉ còn cho mũ / áo choàng / tay phụ về sau.
  Vũ khí mới (kiếm sắt, cung…) = phiên bản cầm món đó + đứng / đi / động tác vẽ lại, hoặc tạm khai `views` (lớp dán).
- **Atlas 16 tuổi đã đầy** (1238–1240 / 1296 ô 112px, 10/10/2026): uống bình cầm vũ khí bản 16 tuổi, vũ khí mới, bộ trang phục…
  đều cần atlas NHIỀU TRANG (Pixi `meta.related_multi_packs` + `AssetManifest.loadCharacter` gộp `linkedSheets`; kho đồ đọc khung
  đứng của trang đầu) hoặc cắt sát khung (frame `trimmed`) trước khi vẽ thêm.
- FreePixel **không có** attack/cast/hit/death/dodge/block. Hai hướng xử lý: mua credit PixelLab để
  `animate_image` trên chính sprite đã chuẩn hoá, hoặc lấy bộ 2DHD CC0 của hormelz (xem `asset-sources.md`).
- Boss hiện cùng cỡ với quái thường. Phóng 2× sẽ lệch mật độ pixel nên không làm; thay vào đó cần
  nguồn boss to sẵn hoặc trình diễn bằng camera và VFX.
- WebP: hiện xuất PNG (atlas mỗi nhân vật khoảng 300 kB). Nén WebP lossless sẽ làm ở Phase 12.

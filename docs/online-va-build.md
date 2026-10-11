# Hướng online: chọn nhân vật nam/nữ, cày cuốc, build không chia nghề

Quyết định của chủ dự án (02/10/2026):

- Người chơi **tự tạo nhân vật** (tên + nam/nữ). Nhân vật đó **thay Lior** làm vai chính của cốt truyện
  chuyển sinh: thoại gọi theo tên, cách gọi đổi theo giới tính. Xong chương mở đầu thì vào thế giới chung.
- Bản online đầu tiên: **thấy nhau + chat + lưu nhân vật trên máy chủ**. Chiến đấu vẫn tính ở máy
  người chơi; chuyển lên máy chủ ở mức 2.
- **Không chia nghề.** Dùng được nhiều loại vũ khí; tuyệt chiêu phải **đi học**; nhưng cơ chế phải có
  **đánh đổi**, không ai biết hết mọi thứ cùng lúc.

## Kiến trúc

```
apps/server/        Node 24 + ws + node:sqlite (không cần cài CSDL) — cổng 3200
  src/db.ts         tài khoản · phiên đăng nhập · nhân vật (tiến độ lưu dạng JSON)
  src/http.ts       REST: /api/register · login · logout · characters (GET/POST/DELETE) · characters/:id/progress (PUT)
  src/world.ts      WebSocket /ws: vị trí 10 lần/giây, chat, lưu tiến độ, chặn dịch chuyển quá tốc độ
  src/actions.ts    kiểm phần chiêu của tin action (mã chiêu thật, kẹp điểm nhắm) — người khác thấy chiêu, chỉ hình
packages/protocol/  kiểu dữ liệu + luật kiểm tên dùng chung cho máy chủ và web
apps/web/src/net/   api.ts (REST) · OnlineSession.ts (WebSocket tự nối lại, lưu mềm/lưu chắc)
```

- Mật khẩu băm **scrypt** + muối; phiên là token ngẫu nhiên 32 byte, hạn 30 ngày, gửi qua header
  `Authorization` (không cookie → không lỗ CSRF). Đăng nhập/đăng ký giới hạn 10 lần/phút/IP.
- Token WebSocket gửi trong **tin đầu tiên** (`hello`), không đặt trên URL để khỏi lọt vào log.
- Một nhân vật chỉ online ở một nơi: đăng nhập nơi khác thì bản cũ bị đẩy ra.
- Tiến độ truyện lưu theo **từng nhân vật** trên máy chủ (`StoryDirector.storage`); chơi đơn / bài thử
  vẫn dùng localStorage như cũ.
- Thử: `npx tsx apps/server/tests/smoke.test.ts` (30 kiểm tra, chạy vào máy chủ THỬ :3201) · bot thử bằng mắt: `tests/bot.ts`.

## Các mốc

| Mốc | Nội dung | Trạng thái |
| --- | --- | --- |
| M1 | Tài khoản, tạo nhân vật nam/nữ, thấy nhau, chat, lưu trên máy chủ, thoại theo tên/giới tính | ✔ 02/10/2026 |
| M1.5 | Bộ nhân vật chính PixelLab (bé trai/gái, 16 tuổi nam/nữ) cùng phong cách | ◐ 05/10/2026: đủ 4 nhân vật × 8 hướng; Lior có walk hướng S, E. Còn thiếu walk/idle các hướng khác → mỗi ngày làm tiếp |
| M2 | Hệ vũ khí + tuyệt chiêu + đánh đổi (bên dưới), NPC sư phụ dạy chiêu | thiết kế xong |
| M3 | Máy chủ nắm chiến đấu: quái dùng chung, rơi đồ, tổ đội, chống gian lận | chưa |
| M4 | Đưa lên mạng: web qua Funnel 8443, máy chủ game qua Funnel 10000 (WSS) | chưa |

## Cha kiếm sĩ, mẹ pháp sư: học song song rồi tự chọn đường (06/10/2026)

Chủ dự án chốt: **cha là kiếm sĩ, mẹ là pháp sư — cả hai năng lực tầm trung** (cha "lính gác cũ", mẹ "pháp sư
làng": phép chỉ đủ nhóm bếp, gọi mưa nhỏ, không làm nổi tuyết).

- **6 tuổi học SONG SONG**: mẹ tặng *Trượng gỗ* (mở Tia Aether, phím **K**) khi giao "Sợi tơ đầu tiên"; cha
  tặng *Kiếm gỗ* (mở Trảm, phím **J**) ở nhiệm vụ mới "Thanh kiếm gỗ". Quà trao NGAY lúc giao việc
  (`onGive.unlock`) để tập luôn. Bộ kỹ năng chung `HERO_SKILLS` (J, K, 1–3 phép, 4 Hồi Phục); chuột trái /
  chạm màn hình: mục tiêu gần thì chém, xa thì bắn; chuột phải luôn là K.
- **16 tuổi, thẻ "Ngã rẽ"** (bắt buộc chọn): *Kiếm sĩ* (kiếm +35%, phép −35%, máu/giáp dày, ít MP) hoặc
  *Pháp sư* (phép +35%, kiếm −35%, nhiều MP, máu mỏng). Không khoá kỹ năng nào — **mạnh kiếm thì yếu phép,
  mạnh phép thì yếu kiếm**. Hệ số + chỉ số ở `PATHS` (`combat/skills.ts`), lưu ở `SaveData.path`.
- Đồ tân thủ: `game/items.ts` (`GIFT_ITEMS`), ảnh `public/assets/items/starter_sword.png` +
  `starter_staff.png`; **chưa có file thì HUD hiện biểu tượng tạm** 🗡️ 🪄 — thả file PNG vào là xong, không sửa code.
- Bản lưu cũ: `StoryDirector.migrate()` tìm lại nhiệm vụ theo id, coi nhiệm vụ chèn phía trước là đã xong và
  bù quà (người đã qua 6 tuổi có luôn kiếm + trượng). Đã có test trong `tests/story.test.ts`.

### Chờ lượt PixelLab (lượt hồi +5/token/đêm)

| Việc | Công cụ | Ghi chú |
| --- | --- | --- |
| Kiếm gỗ tân thủ | `create_object_pro_flash`, 1 hướng, ~64×64 (≥5 lượt) | thanh kiếm gỗ sồi trẻ con, chuôi quấn da cũ, nét viền đen như nhân vật; nền trong suốt → `assets/items/starter_sword.png` |
| Trượng tập tân thủ | như trên | trượng gỗ ngắn, đầu quấn sợi đồng xỉn → `assets/items/starter_staff.png` |
| Nhà KHÁC NHAU (không đổi màu mái) | `create_object_pro_flash`, ~192×192 (6–7 lượt/căn), ảnh mẫu = nhà đã duyệt (cắt sát) | lò rèn, tiệm tạp hoá của Bram, quán trọ 2 tầng, nhà đá mái lợp đá, nhà trại mái rạ, cổng thành; gỡ hết `house_blue`/`house_green` |
| Hiệu ứng kỹ năng | PixelLab `create_image_pixen` (1 lượt) + `animate_image` (KHÔNG tự vẽ bằng code) | Trảm, Tia Aether, Hoả Cầu, Thuỷ Tiễn, Phong Nhận, Hồi Phục, nổ trúng đích — lệnh `pixellab vfx`, xem mục ngay dưới |

#### Hiệu ứng kỹ năng do PixelLab vẽ (logic xong 07/10/2026, chưa tiêu lượt)

Code chỉ nạp và phát, **không sinh khung**. Mỗi hiệu ứng gồm 2 bước PixelLab. Bước 1 vẽ khung đầu nền trong suốt,
mặc định bằng `create_image_pixen` (1 lượt). Có thể đổi sang `--model pixflux` (1 lượt, khổ từ 32×32) hoặc
`--model pro_flash` (≈ 5–6 lượt). Bước 2 dùng `animate_image` làm chuyển động khung đó. Kết quả nằm ở
`packages/asset-pipeline/sources/pixellab/vfx/<id>/`: `first.png`, `frame_000.png`… (ảnh 0 là chính khung đầu)
và `meta.json`. File meta ghi sau cùng, nên chưa có meta tức là lệnh tải dở.

```bash
npm run assets:pixellab -- vfx <token#> <vfxId> --dry          # kế hoạch + lượt + số dư token (tra cứu miễn phí)
npm run assets:pixellab -- vfx <token#> <vfxId>                # vẽ bằng mô tả mặc định (PIXELLAB_VFX_PRESETS)
npm run assets:pixellab -- vfx <token#> <vfxId> --first "..." --action "..." [--size N] [--first-size N] [--frames N]
npm run assets:pixellab -- vfx <token#> <vfxId> --model pro_flash   # khung đầu bằng Pro Flash (đắt, ≈ 5–6 lượt)
npm run assets:pixellab -- vfx <token#> <vfxId> --first-only   # chỉ bước 1; bước 2 chạy lại đúng lệnh bằng token khác
npm run assets:pixellab -- vfx <token#> <vfxId> --first-image <png>   # khung đầu lấy từ file, bỏ bước 1
npm run assets:pixellab -- vfx <token#> <vfxId> --redraw-first # vẽ lại khung đầu dù thư mục đã có first.png
npm run assets:pixellab -- vfx <token#> <vfxId> --force        # vẽ đè bản đã có meta
npm run assets:vfx                                             # dựng lại atlas: có thư mục PixelLab đủ khung thì dùng
```

- Khổ mặc định là cỡ trong game làm tròn lên bội 4 (16–256). Giới hạn `w × h × frames ≤ 524288`, frames chẵn 4–16.
  `pixen` dưới 32px thì khung phải vuông, `pixflux` cần diện tích ≥ 32×32 (đạn 24px phải dùng `pixen`).
- **Kiểm lượt trước khi tiêu.** Lệnh đọc `get_balance` (miễn phí) rồi so `generations_remaining + generations_today`
  với lượt ước tính. Thiếu cho bước 1 thì dừng. Đủ bước 1 nhưng không đủ cả hai bước thì cũng dừng, và gợi ý
  `--first-only`. Không đọc được số dư cũng dừng.
- **Không trả lượt hai lần.**
  - Bước 1 xong thì `first.png` ở lại. Chạy lại đúng lệnh (kể cả bằng token khác) sẽ **dùng lại** khung đầu, không vẽ lại.
  - Job đã gửi được ghi ngay vào `pending.json` (job id, token, thông số). Lệnh chết lúc chờ (mạng, 5xx, phiên MCP
    hết hạn, quá giờ) thì chạy lại đúng lệnh: lệnh chỉ chờ và tải job cũ bằng đúng tài khoản đã gửi, không gửi mới.
    Kèm cờ đổi nội dung bước đó (`--first`, `--action`, `--model`…) là báo lỗi. Muốn bỏ job thì xoá `pending.json`.
  - Lúc chờ, lỗi mạng, HTTP 5xx/429 và phiên hết hạn được thử lại (tối đa 30 lần, mỗi lần cách 15 giây). Phiên
    hỏng thì tự khởi tạo lại.
- `--force` làm trong `<id>.new/`. Đủ meta mới đổi chỗ, bản cũ chuyển sang `<id>.bak/`. Vẽ đè hỏng giữa chừng thì
  bản cũ (đã trả lượt) vẫn nguyên.
- `--dry` thắng ở mọi vị trí. Cờ cần giá trị mà gặp ngay `--…` thì báo lỗi, nên `--first --dry` (quên mô tả, hoặc
  biến shell rỗng) không thể thành lệnh thật với mô tả `"--dry"`.
- Vụ nổ (`firstScale: 0.5` trong preset) vẽ khung đầu ở **nửa khổ**, rồi code đặt vào giữa canvas đủ khổ trước khi
  animate. Vì `animate_image` giữ nguyên khổ khung đầu, vẽ kín canvas thì "bùng ra" sẽ bị xén phẳng ở mép. Ảnh
  PixelLab trả về được giữ ở `first_drawn.png`.
- `assets:vfx` in danh sách hiệu ứng **đã dùng bản PixelLab** và danh sách **còn bản cũ**. Thư mục dở dang thì
  bỏ qua kèm lý do, atlas không vỡ. Chưa có thư mục nào thì atlas giữ nguyên từng byte (đã so sha1 ngày 07/10/2026).
- Cách đưa khung PixelLab vào atlas (`vfx/pixellabVfx.ts`):
  - Ép alpha cứng (≥128) rồi cắt theo khung bao CHUNG của mọi khung, nên neo giữa không trôi.
  - Khung lớn hơn cỡ trong game thì thu bằng `resampleMode`. Khung nhỏ hơn thì chỉ phóng nguyên lần, để giữ lưới pixel.
  - Hiệu ứng mặt đất vẫn bị ép dẹt theo `squashY`.
  - Khung trống ở cuối bị bỏ. Số frame lấy theo bản PixelLab. Tên frame vẫn là `<id>_<i>`, nên `Vfx.ts` không phải sửa.
    Icon kỹ năng không thấy frame chỉ định thì lấy frame 0.
- Ảnh 0 (khung đầu): **loop bỏ ảnh này**, vì chuyển động lặp quay về gần đúng nó, giữ lại thì khựng ở mối nối.
  **Burst giữ ảnh này**, vì đó là khoảnh khắc mở màn. Duyệt thấy không hợp thì sửa tay `meta.json`:
  `"useInput": true/false`. PixelLab đã vẽ sẵn góc nghiêng mặt đất thì thêm `"squashY": 1`.
- Sửa tay khác khi duyệt (`meta.json`, không tốn lượt):
  - `"drop": ["frame_006.png", …]`: bỏ khung PixelLab vẽ lạc (Hoả Cầu biến thành cục tròn, vụ nổ sáng bừng lại
    ở khung cuối, khung rỗng). Lọc SAU bước chọn ảnh 0 nên `useInput` vẫn tính đúng.
  - `"keyDark": 112`: PixelLab **nướng nền tối** vào ảnh dù mô tả ghi nền trong suốt (cột sáng 132px đục ~60% khung,
    đo 07/10/2026). Điểm ảnh có kênh sáng nhất < ngưỡng thành trong suốt. Chỉ dùng cho hiệu ứng tự phát sáng (vẽ blend
    `add`), đừng dùng cho hiệu ứng có viền tối. Kiểm nhanh: đếm điểm đục trên tổng điểm của khung; > 30% là đáng ngờ.
  - Hiệu ứng mượn khung của hiệu ứng khác: `PIXELLAB_VFX_ALIAS` (`dark_ring_warn` = khung đầu của `dark_ring`).
- Bài học mô tả: chữ "sword hit" làm PixelLab vẽ luôn **thanh kiếm** vào tia trúng đòn; "wind blade" ra chong chóng.
  Ghi rõ `no weapon, no sword, no blade`. Hiệu ứng blend `add` dùng đuôi `GLOW` (lineless, cấm nền/mặt đất).
- Giá: `pixen`/`pixflux` = **1 lượt** (theo mô tả công cụ). Pro Flash đo bằng `--dry` ngày 07/10/2026 ≈ **5 lượt**
  (132×132 ≈ 6). Chuyển động ≈ 1 lượt (light_pillar 132×132×8 ≈ 3). Với `pixen`, mỗi hiệu ứng ≈ 2 lượt (light_pillar
  ≈ 4), 12 hiệu ứng dưới đây ≈ 26 lượt. Một token 5 lượt làm trọn được 2 hiệu ứng, cả 7 token làm xong trong một đêm.
- **Màu và chiều phải khớp cách game phát:**
  - Pixi `tint` NHÂN màu. Hiệu ứng nào game tô tint (`slash`, `magic_circle`, `arcane_orb` lúc niệm, `sparkle`,
    `light_pillar`) thì phải vẽ gam **trắng/rất nhạt**: vàng × tint nước ra ô liu, tím × tint lửa ra tím mận.
  - `slash` bị xoay theo hướng đánh (`rotation = atan2(ny, nx)`). Vì vậy sprite gốc phải là **vệt DỌC, bụng quay
    sang phải**, quét trên → dưới. Chiều vung ngược do game **lật Y** (`flipY` của `Vfx.play`).
  - Lật X từng là lỗi: Pixi lật trước rồi mới xoay, nên xoay π + lật X ra gương DỌC, bụng vệt quay ngược về người
    đánh. Đã đổi sang lật Y (`tests/action.test.ts` kiểm phép này).

Mô tả mặc định cho khung đầu đều có thêm đuôi chung: *pixel art game effect, crisp dark outline, limited palette,
transparent background, chibi RPG style, no character, no text*.

| Thứ tự | id | Dùng cho | Loại · khổ · khung | Khung đầu (tóm tắt) | Chuyển động |
| --- | --- | --- | --- | --- | --- |
| 1 | `slash` | Trảm, đòn kiếm, quái chém | burst · 92 · 6 | vệt chém lưỡi liềm DỌC, bụng quay phải, trắng-bạc nhạt (bị tint) | quét nhanh trên → dưới rồi mảnh dần và tan |
| 2 | `fire_orb` | Hoả Cầu (đạn) | loop · 24 · 4 | quả cầu lửa nhỏ, lõi vàng, lửa cam-đỏ | cháy phập phồng, lửa lay quanh lõi, lặp liền |
| 3 | `fire_burst` | nổ lửa trúng đích | burst · 64 · 8 (khung đầu 32) | vụ nổ lửa vừa bắt đầu, lõi vàng trắng | bùng ra thành lửa lớn rồi vỡ thành tàn lửa, khói và tan |
| 4 | `arcane_orb` | Tia Aether (đạn), quả cầu lúc niệm | loop · 24 · 4 | quả cầu lõi trắng, quầng tím rất nhạt (bị tint lúc niệm) | phập phồng phát sáng, năng lượng xoáy bên trong |
| 5 | `arcane_burst` | nổ Aether trúng đích | burst · 52 · 8 (khung đầu 28) | vụ nổ phép tím vừa bắt đầu | bùng thành vòng tia lửa + ký tự phép rồi tan thành hạt |
| 6 | `water_wave` | Thuỷ Tiễn (đạn) | loop · 36 · 4 | mũi tên nước xanh, bọt trắng, hướng sang phải | nước gợn cuộn khi bay, vệt bọt rung, lặp liền |
| 7 | `water_splash` | nổ nước trúng đích | burst · 52 · 8 (khung đầu 28) | bọt nước vừa bắt đầu bắn | bắn tung thành giọt rồi rơi và biến mất |
| 8 | `wind_spin` | Phong Nhận (đạn) | loop · 40 · 4 | lưỡi gió lưỡi liềm xanh nhạt-trắng | xoay nhanh, các vệt gió quay tròn, lặp liền |
| 9 | `wind_burst` | Lốc xoáy, trúng gió | burst · 64 · 8 (khung đầu 32) | luồng lốc vừa hình thành | xoáy và nở rộng rồi các vệt văng ra và tan |
| 10 | `sparkle` | Hồi Phục, nhặt đồ | burst · 80 · 8 | lấp lánh dấu cộng + sao nhỏ, trắng ánh bạc hà rất nhạt (bị tint) | hiện ra, bay lên, nhấp nháy rồi tan nhẹ |
| 11 | `magic_circle` | vòng phép dưới chân khi niệm | burst · 84 · 8 (ép dẹt 0.5) | vòng phép nhìn từ trên xuống, ký tự trắng-bạc 2 vòng (bị tint) | sáng lên, ký tự rực và xoay chậm rồi mờ dần |
| (12) | `light_pillar` | cột sáng Hồi Phục/lên cấp | burst · 132 · 8 | cột sáng trắng từ mặt đất (bị tint) | phóng lên, rực rồi thu hẹp và tan (≈ 4 lượt với pixen) |
| 13 | `fire_flash` | phản ứng Bùng Lửa, chém lửa | burst · 56 · 8 (khung đầu nửa khổ) | chớp lửa tròn trắng-vàng, lưỡi lửa cam (đuôi GLOW) | bùng nhanh rồi vỡ thành tàn lửa |
| 14 | `fire_ring` | vòng lửa mặt đất (boss) | burst · 132 · 8 (ép dẹt 0.62) | vòng lửa nhìn từ trên xuống, tâm trống (đuôi GLOW) | bốc cao rồi tàn thành than, tan |
| 15 | `flame` | cháy âm ỉ trên mục tiêu | loop · 30 · 4 | ngọn lửa nhỏ lõi vàng | lay động tại chỗ, lặp liền |
| 16 | `water_ring` | gợn nước dưới chân khi trúng nước | burst · 72 · 8 (ép dẹt 0.55) | vòng gợn nước nhìn từ trên xuống, tâm trống | nở ra, mảnh dần rồi tan |
| 17 | `dark_ring` (+`dark_ring_warn`) | vòng bóng tối boss + vòng cảnh báo | burst · 176 · 8 (ép dẹt 0.55) | vòng phép tím nhìn từ trên xuống, lửa tối ở mép | bùng lửa tím rồi tan thành khói |
| 18 | `shadow` | bóng tối trúng đích (boss) | burst · 76 · 8 (khung đầu nửa khổ) | khói tím đen, tua cuộn | tua vung ra, cuộn rồi tan |
| 19 | `dark_orb` | đạn bóng tối (boss) | loop · 26 · 4 | cầu tối lõi tím đen, viền tím | phập phồng, năng lượng xoáy, lặp liền |
| 20 | `dust` | bụi lăn né, tên trúng | burst · 42 · 6 (khung đầu nửa khổ) | đám bụi nâu nhạt | phụt ra, lắng rồi tan |

Mô tả đầy đủ bằng tiếng Anh nằm ở `PIXELLAB_VFX_PRESETS` (`packages/asset-pipeline/src/vfx/pixellabVfx.ts`).
Hiệu ứng ngoài bảng (`frost`, `steam`, `crit_flash`, `blood_hit`) thì truyền `--first`/`--action` khi chạy — mô tả đã dùng ghi trong `meta.json` của từng thư mục.
Kiểm phần đè khung và phần điều phối (cờ, số dư, khổ, lỗi tạm, preset):
`cd packages/asset-pipeline && npx tsx tests/vfx-pixellab.test.ts`. Test này dùng ảnh giả trong thư mục tạm và
không đụng atlas thật.

## Hệ build không chia nghề (M2)

Mục tiêu: ai cũng **học được mọi thứ**, nhưng ở một thời điểm chỉ **mang theo** được một phần — build là
lựa chọn, không phải danh sách để cày cho đủ. (Từ 06/10/2026 thêm con đường Kiếm sĩ/Pháp sư ở trên làm lớp
đánh đổi đầu tiên.)

### 1. Vũ khí và độ thông thạo

| Vũ khí | Đòn thường | Thiên về |
| --- | --- | --- |
| Kiếm | chém cận chiến | cân bằng công/thủ |
| Song đoản | 2 nhát nhanh | chí mạng, né |
| Thương | đâm xa tầm trung | giữ khoảng cách, xuyên |
| Cung | bắn xa vật lý | sát thương từ xa, cần ngắm |
| Trượng phép | tia Aether | khuếch đại phép nguyên tố (cơ chế phản ứng hiện có) |

- Mỗi vũ khí có **độ thông thạo 1–10**, tăng khi dùng chính vũ khí đó. Mỗi bậc mở thêm chiêu của vũ khí.
- **Tổng thông thạo có trần** (đề xuất 30). Muốn nâng vũ khí mới khi đã chạm trần thì phải **quên bớt**
  vũ khí khác (mất điểm, không hoàn lại ngay). Kết quả: giỏi 3 vũ khí, hoặc rất giỏi 2, không giỏi cả 5.

### 2. Tuyệt chiêu phải đi học

- Tuyệt chiêu không tự có khi lên cấp. Phải tìm **sư phụ** (NPC) rồi qua **thử thách** của họ (nhiệm vụ,
  trận đấu, vật phẩm hiếm). Phép tuổi thơ (Hoả Cầu, Thuỷ Tiễn, Phong Nhận học từ mẹ, cha, Mirelle)
  chính là mẫu của cơ chế này.
- Tuyệt chiêu thuộc một **trường phái**: Hoả · Thuỷ · Phong · Thổ · Quang · Ám · Kiếm đạo · Xạ thuật.

### 3. Các lớp đánh đổi

1. **Tâm lực (sức chứa).** Học được bao nhiêu chiêu cũng được, nhưng **mang theo** thì mỗi chiêu tốn tâm
   lực (chiêu thường 1–2, tuyệt chiêu 4–6). Tâm lực tăng chậm theo cấp (đề xuất `6 + cấp/5`, trần 20).
2. **Ô chiêu cố định**: 4 ô chiêu + 1 ô tuyệt chiêu. Chỉ đổi bộ chiêu ở **đền / thị trấn**, không đổi
   giữa trận.
3. **Khắc hệ (đạo tâm).** Trường phái đối nghịch (Hoả ↔ Thuỷ, Quang ↔ Ám) không cùng mang tuyệt chiêu
   bậc cao. Mang tuyệt chiêu Hoả thì chiêu Thuỷ bậc 2+ bị khoá. Đổi "đạo" phải làm nhiệm vụ và chờ
   một ngày thật.
4. **Trang bị nặng nhẹ.** Giáp nặng giảm tốc niệm phép và hồi MP; áo vải tăng hồi MP nhưng chịu đòn kém.
5. **Điểm tiềm năng** mỗi cấp chia vào Sức · Nhanh · Trí · Thể. Tẩy điểm tốn xu, tăng dần theo số lần tẩy.

Kết quả mong muốn: hai người chơi cùng cấp có thể đánh khác hẳn nhau (kiếm + Hoả, cung + Phong, trượng
+ Thuỷ hồi máu…), và tổ đội cần nhau vì không ai tự gánh mọi vai.

### 4. Sprite cho nhiều vũ khí và trang bị

Nguyên tắc vẽ (chủ dự án nhắc 06/10/2026: "sau sẽ có chức năng trang bị, vũ khí đa dạng, cứ phát triển từ từ"):

- **Thân nhân vật LUÔN tay không.** Vật cầm tay mà PixelLab tự vẽ kèm (que của hai bé) bị pipeline gỡ
  (`cleanup.removeThin`) — vừa vì vũ khí là lớp riêng, vừa vì mẫu động tác của PixelLab làm vật cầm
  tay lúc có lúc không (que mất ở 7/8 frame đi).
- Que gỗ của tuổi thơ sẽ quay lại dưới dạng **món vũ khí đầu tiên** trong ô trang bị.
- Hướng hiện vũ khí đề xuất: **đeo sau lưng khi đi/đứng** (điểm neo lưng ổn định theo hướng, chỉ nhún
  theo nhịp bước — không cần biết vị trí tay từng frame), rút ra khi đánh bằng hiệu ứng vung.
  Mỗi vũ khí chỉ cần 1 hình đeo lưng + 1 icon túi đồ, thay vì 8 hướng × mọi động tác.
- **Mỗi lúc chỉ cầm MỘT vũ khí** (chủ dự án 08/10/2026): chém thì cầm kiếm, niệm phép thì cầm gậy, không cầm song song. Động
  tác chém / niệm đã vẽ liền vũ khí; lúc đứng / đi lớp đồ gắn giữ "thế cầm" của đòn gần nhất (`gearLayers.stanceAfter`,
  `wieldedPieces`; mặc định theo con đường — Pháp sư cầm gậy). Món không phải vũ khí (khiên, mũ, áo choàng) luôn hiện.
- Giáp/áo đổi hình: để sau. Nếu làm, cân nhắc công cụ `transfer_outfit` của PixelLab (mặc đồ mới cho
  nhân vật có sẵn) thay vì vẽ lại cả bộ.

Ghi chú cũ:

Vẽ **thân nhân vật không cầm vũ khí** (trẻ con nam/nữ, người lớn nam/nữ), còn vũ khí là **lớp riêng**
gắn theo điểm neo tay. 2 giới × 2 tuổi + 5 vũ khí = 9 bộ hình, thay vì 20 bộ nếu vẽ liền. Ghi chú này
khớp với nợ cũ trong `asset-pipeline.md` ("trượng sẽ là lớp trang bị riêng").

## Bộ nhân vật chính (PixelLab, 05/10/2026)

Vẽ bằng PixelLab Pro Flash, **ảnh mẫu phong cách = Lior bé** (chính Lior được vẽ theo 3 ảnh mẫu chibi của
chủ dự án) → cả bộ cùng nét. Gói tải về nằm ở `packages/asset-pipeline/sources/pixellab/<id>/`; nhân vật nào
thuộc tài khoản nào ghi ở `sources/pixellab/registry.json` (**nhân vật chỉ animate được bằng tài khoản đã
tạo ra nó**).

| ID trong game | Vai | Token | Khung | Trạng thái |
| --- | --- | --- | --- | --- |
| `player_lior_child` | nhân vật chính bé trai | #0 | 64×64 | ✔ trong game, walk đủ 8 hướng (06/10) |
| `player_lior_child_f` | nhân vật chính bé gái | #0 | 64×64 | ✔ trong game, walk S/E/W; hướng chéo + N tạm ảnh tĩnh |
| `player_hero_adult` | nhân vật chính 16 tuổi nam | #4 | 80×88 | ✔ đã xuất (06/10), walk 5 hướng thật + 3 lật gương; CHƯA nối vào mốc 16 tuổi (chờ bản nữ) |
| `player_hero_adult_f` | nhân vật chính 16 tuổi nữ | #4 | 80×88 | ✘ walk S có frame QUAY LƯNG, N mất đuôi tóc → phải xoá 2 hướng đó rồi vẽ lại (xem dưới) |
| `npc_elin_001` | mẹ Elin | #1 | 80×88 | ✔ trong game |
| `npc_garrick_001` | cha Garrick | #1 | 80×88 | ✔ trong game (06/10), walk S/E/N |
| `npc_aldric_child_001` | Aldric bé | #2 | 72×72 | ✔ trong game |
| `npc_mirelle_001` | Mirelle (thay `npc_medic_001`) | #2 | 80×88 | ✔ trong game + cốt truyện (06/10) |
| `npc_bram_001` | Bram (thay `npc_merchant_001`) | #3 | 80×88 | ✔ trong game + cốt truyện (06/10); walk N bị loại (mất ba lô) |
| `npc_aldric_001` | Aldric 16 tuổi (thay `npc_squire_001`) | #4 | 80×88 | ✔ trong game (07/10, NPC đứng gác — idle bằng ảnh xoay) |
| `mob_skeleton_archer_001` | xương xạ thủ | #5 | 80×88 | ✔ trong game (06/10) |
| `mob_mushroom_001` | quái nấm | #3 | 72×72 | ✔ trong game (06/10), walk S/E/N |
| `boss_demon_001` | Quỷ vương | #5 | 96×104 | ✔ trong game (06/10), walk S/E |
| `mob_zombie_001`, `mob_gargoyle_001` | quái | #4 | 80×88 | chưa tạo (game vẫn dùng bản cũ) |

**Nhiều token.** `.env.local` khai `PIXELLAB_TOKENS=<#0>,<#1>,<#2>` (token đầu là tài khoản chính). Mỗi tài
khoản Free: 5 lượt/ngày tích tối đa 20, chạy **1 lệnh một lúc** → 3 tài khoản chạy song song được.

```bash
npm run assets:pixellab -- balances                       # lượt còn lại từng token (chỉ in 4 ký tự đầu)
npm run assets:pixellab -- call <token#> <tool> @args.json # gọi công cụ MCP bằng token chọn
npm run assets:pixellab -- walk <id> [hướng…]             # walk từng hướng bằng đúng token sở hữu, chờ, tải gói
npm run assets:pixellab -- animate <id> <anim> --template <mẫu> [--action "..."] [--freedom N] [--name <tên>] [--dry] [hướng…]
npm run assets:pixellab -- animate <id> <anim> --mode v3 --action "..." [--frames N] [--name <tên>] [--dry] [hướng…]
npm run assets:pixellab -- download <id> <uuid>           # tải gói (link công khai)
npm run assets:character -- <id>                          # dựng vào game qua cổng chất lượng
```

Pipeline cho ảnh PixelLab (khai trong spec):
- `cleanup.removeThin` — gỡ vật cầm tay mảnh (que) để thân tay không; chạy TRƯỚC chuẩn hoá vì que thò
  xuống dưới bàn chân làm sai đường chân.
- `cleanup.alignToIdle` — frame động tác của PixelLab lệch 1–5px so với ảnh xoay; căn theo phần đầu–thân
  của ảnh đứng (độ dời trung vị cả chu kỳ, giữ nhịp nhún). Không căn → đứng/đi nhảy lên xuống.
- `pixellab.mirrorWest` — nhân vật KHÔNG đối xứng (tóc buộc lệch, kiếm đeo một bên): 3 hướng phía tây lật
  gương TOÀN BỘ từ phía đông, kể cả ảnh đứng; không thì đi về phía tây là đuôi tóc nhảy sang bên kia.
- `quality.maxHeightDrift: 0.15` — áo choàng tung khi bước làm chiều cao hộp bao lệch tới ~7px là hợp lệ.
- `pixellab.reject: { "walk": ["N"] }` — hướng có frame động tác bị LOẠI khi duyệt bằng mắt → coi như chưa
  có, dùng ảnh xoay nhún nhẹ. Vd Bram: mẫu `walking-8-frames` hướng N làm MẤT cái ba lô khổng lồ.
- Vẽ lại vài hướng hỏng mà không đè bản gốc: `pixellab walk <id> --name walk-b south north` (animation
  riêng tên `walk-b`), rồi spec khai `"walk": ["walk-b", "walk"]` — danh sách là thứ tự ưu tiên theo TỪNG
  hướng. Vd bản nữ 16 tuổi: walk S có frame QUAY LƯNG, walk N có frame mất đuôi tóc.
- **Cẩn thận:** nhân vật đã có trong game mà dựng lại bị TRƯỢT cổng thì pipeline GỠ LUÔN bản cũ khỏi game.
  Riêng trường hợp chỉ còn chờ duyệt bằng mắt (spec chưa có `review`) thì bản cũ được GIỮ (từ 06/10/2026) —
  trước đó dựng thử quái mới là quái cũ biến mất khỏi game suốt lúc chờ duyệt.
- Hàng đợi chạy nền: `wait` chờ 15 giây rồi mới hỏi và đối chiếu `list_jobs` (lệnh vừa gửi chưa kịp vào hàng
  đợi thì `wait_for_jobs` báo "No active jobs" ngay); tải gói bị 423 (đang vẽ dở) thì tự thử lại tới ~30 phút;
  `animate_character` bị từ chối vì "job slots" thì chờ ô trống rồi gửi lại.

- **PixelLab KHÔNG vẽ lại** một hướng đã có của cùng mẫu động tác: gửi `walking-8-frames` cho hướng đã có (kể
  cả đổi `animation_name`) trả "already complete" và không tốn lượt. Muốn vẽ lại thì `delete_animation` riêng
  hướng đó (`direction: "south"`) rồi gửi lại vào đúng nhóm cũ.
- Animation còn xếp hàng KHÔNG hiện trong `list_jobs`/`wait_for_jobs` mà chỉ hiện trong `get_character` dạng
  `walk(south): 8% ~440s` → lệnh `walk` chờ theo dòng đó.

Đã biết: mẫu `walking-8-frames` **làm rơi cây que** của hai bé (chỉ còn ở 1/8 frame) → cho hai bé tay không
như bản 16 tuổi (xoá que ở ảnh xoay) trước khi đưa vào game.

### Động tác ra đòn: vung kiếm (attack), vung tay niệm phép (cast) — 06/10/2026

Chủ dự án chê cú "giật" khi đánh (sprite dịch 7px/3px về phía mục tiêu). Đã bỏ hẳn cú giật của người chơi
(quái giữ nguyên); động tác thật do **PixelLab vẽ** (không tự vẽ bằng code), game chỉ lo logic:

- **Ba pha, một đồng hồ (dt của game):** bấm → *vào thế* (khoá hướng; đứng yên, hoặc bước
  chậm 40% nếu đang giữ phím đi) → *khung chạm* `hitFrame` (đạn bay ra / vệt chém + trúng / hồi máu) → *thu thế*
  (đi, né hoặc đòn kế cắt ngang được từ `cancelAt` = hết frame tung đòn).
  MP + hồi chiêu trừ lúc bấm; bị ngắt trước khung chạm (thoại mở, gục, đổi tuổi, né) thì **hoàn lại**.
  Giữ J/K đánh liên tục theo nhịp hồi chiêu (`HOLD_REPEAT` trong `Game.ts`). Bấm đòn khác lúc đang vung →
  xếp hàng 0,3s. Code: `entities/actionClock.ts`, `CharacterView.playAction`, `CombatSystem.updateAction`;
  test `apps/web/tests/action.test.ts`.
- **Chưa vẽ hướng nào thì đòn nổ ngay như trước** (không giật). Hướng dùng hướng kề ≤45° (E ↔ SE/NE), KHÔNG
  dùng hướng xa (E không lấy S) — vung sai hướng còn xấu hơn không vung.
- **Online:** tin `t:'action'` (máy chủ kiểm `anim`/`dir`, tối đa 8 tin/giây; từ 10/10 kèm phần CHIÊU `fx` để máy khác vẽ cả
  hình của chiêu — mục *Thấy chiêu của nhau* ngay dưới) → máy khác phát hình, cùng
  hồi chiêu của kỹ năng nên cùng mốc. Đòn bị cắt trước khi diễn hết (né, đi, bị ngắt) gửi thêm `t:'actionEnd'`
  (tin riêng — máy chủ bản cũ bỏ qua im lặng, không bao giờ phát lại thành một cú vung) → máy kia dừng hình;
  thiếu tin đó thì máy người xem tự dừng khi người kia đang đi mà động tác đã qua mốc huỷ, hoặc lệch vị trí
  > 24px (lăn né). Máy chủ 3200/3201 đang chạy bản cũ — **phải khởi động lại máy chủ** mới có cả hai tin.
- **Cảm giác tay (06/10, sau soát):** đi/né chỉ cắt đòn từ `cancelAt` (khung chạm hiện trọn 1 frame; né bấm đúng
  khung chạm thì hẹn lăn ngay khi qua mốc); đang giữ phím đi thì pha vào thế chỉ bước chậm còn 40% chứ không khoá
  chân; giữ J/K đứng yên thì đứng ở frame cuối chờ nhát kế (không nháy về dáng nền); lệnh lặp do giữ phím không
  đè lệnh bấm 1–4 đang chờ; bước chân người chơi đang đi không ăn hit-stop; vệt chém lật theo HƯỚNG (W/SW/NW lật
  gương), không theo dấu dx.
- **Spec:** `animations.attack/cast` có `"optional": true` (+ `durationMs`, `hitFrame` tuỳ chọn) và
  `pixellab.animations.attack = ["attack-sword", "attack-swing"]` (bản kiếm v3 ưu tiên, bản tay không làm
  đối chứng; tên đầu bị loại/khác cỡ ở hướng nào thì hướng đó rơi về tên kế, `pixellab.reject` nhận cả tên
  PixelLab như `"attack-sword": ["E"]`). Động tác tuỳ chọn: KHÔNG dựng frame tạm từ ảnh tĩnh; gỡ que vẫn áp cho
  `cast` (tay không — ảnh xoay của hai bé còn que), chỉ chừa `attack` (kiếm là chủ ý; khai khác bằng
  `cleanup.keepThinIn`); **cổng hai tầng** — tầng 1 (idle/walk) quyết định xuất như cũ, tầng 2 kiểm TỪNG hướng của động tác, trượt chỉ bỏ hướng
  đó. Frame v3 khác cỡ ảnh xoay thì bỏ hướng đó kèm cảnh báo (chưa có bước căn đầu–thân). Manifest ghi
  `{ fps, frames, hitFrame, loop: false, directions }`; nhân vật chưa có động tác thì manifest/atlas **không
  đổi byte nào** (đã đối chiếu 4 nhân vật).
- Sau khi tải gói có động tác: `assets:character <id>`, xem `reports/<id>/contact-1-final.png` + Character
  Lab (nút attack/cast hiện khi atlas có), điền `hitFrame` (frame tay/kiếm duỗi hết) vào spec nếu mặc định
  (kiếm `round(n/3)`, phép `round(3n/8)`) chưa khớp; hướng xấu thì `pixellab.reject`.

**Kế hoạch vẽ (từ 07/10, chạy `balances` trước):** tối thiểu E + S + N cho mỗi (nhân vật × động tác) — phía
tây lật gương, hướng chéo lấy hướng kề.

| Động tác | Lệnh | Lượt/hướng |
| --- | --- | --- |
| cast | `animate <id> cast --template fireball --freedom 50 --action "thrusting both open palms forward to release a spell, empty hands, no fire, no projectile, no glow"` | 1 |
| attack (B, ưu tiên) | `animate <id> attack --name attack-sword --mode v3 --frames 6 --action "slashing a short wooden training sword horizontally from back to front at chest height, sword stays in right hand every frame"` | bé ≈1, 16 tuổi ≈2 |
| attack (A, đối chứng) | `animate <id> attack --name attack-swing --template throw-object` | 1 |

**Thông lượng thật ~10 lượt/ngày, không phải ~30:** chỉ token SỞ HỮU mới animate được nhân vật, mà bốn nhân vật
người chơi chỉ nằm trên token #0 (hai bé) và #4 (hai bản 16 tuổi, chung với `npc_aldric_001`) → 5 + 5 lượt/ngày.
Bộ đủ E+S+N cho cả cast lẫn attack: #0 ≈ 12–15 lượt (~3 ngày, kể cả attack-swing đối chứng); #4 ≈ 2×(3 + 3×2)
= 18 lượt + ≈4 lượt walk còn thiếu của `npc_aldric_001` ≈ 22 lượt (~4–5 ngày). Muốn nhanh hơn phải tạo nhân vật
trên token khác — tức nhân vật MỚI, phải duyệt lại.

Thứ tự khi thiếu lượt: `player_lior_child` → cast E trước attack E (một cast phủ 5 kỹ năng K/1/2/3/4) → S → N
→ bản nữ → bản 16 tuổi. Ngày 1 (mỗi token ĐÚNG 5 lượt): #0 = lior_child cast E, attack-sword E, attack-swing E
(so A/B), cast S, lior_child_f cast E; #4 = hero_adult cast E (1), attack-sword E (≈2, đo cỡ canvas v3 thật),
hero_adult_f cast E (1), còn 1 lượt — **chỉ** chạy hero_adult cast S nếu `--dry` của attack-sword báo đúng ≈2;
không thì dời sang ngày 2. Vẽ lại một hướng xấu: `pixellab call <token> delete_animation ...` rồi
`animate <id> <anim> ... --force <hướng>` (không có `--force` thì lệnh thấy hướng đó còn trong gói đã tải và bỏ
qua). Cẩn thận: `fireball` có thể vẽ kèm cầu lửa
(trượt `no-foreign-objects`/`silhouette-solid` → tầng 2 loại hướng đó, mất 1 lượt); khung 64×64 của hai bé
chật, vung tay dễ chạm mép (`transparent-bg`).

**Đường vòng đang dùng (07/10/2026): `pixellab animimg` — token NÀO cũng vẽ được.** Token chủ (#0, #4) bị PixelLab
báo "temporarily unavailable" cả ngày, nên động tác được vẽ bằng `animate_image` từ chính ẢNH XOAY của nhân vật
(64×64 hoặc 80×80 × 8 khung = 1 lượt/hướng), rồi người duyệt chọn khung:

```bash
npm run assets:pixellab -- animimg <token#> sources/pixellab/<id>/Idle/rotations/east.png sources/pixellab/<id>/extra-raw/attack-img/east --action "..."
npx tsx src/pixellab/pickExtra.ts <id> attack-img east 1,2,3,4 "lý do chọn khung"   # → extra/attack-img/east/
npm run assets:character -- <id>
```

- `extra/<tên>/<hướng>/` nằm NGOÀI gói tải về (tải lại gói không đè), `PixelLabSource` đọc như một animation thường;
  spec khai `"attack": ["attack-sword", "attack-swing", "attack-img"]`, `"cast": ["cast", "cast-img"]`.
- `animate_image` chỉ giữ nhân vật đúng ~4 khung đầu rồi hay xoay mặt ra người xem, mất vũ khí hoặc TỰ VẼ tia phép dù
  đã cấm → luôn chọn khung bằng mắt (`pickExtra`), ghi lý do vào `pick.json`. Khung chạm: chém lấy 4 khung với
  `hitFrame: 2`; niệm 5–8 khung, mặc định 3/8 rơi đúng khung duỗi tay.
- Người lớn không cầm vũ khí trong ảnh xoay: mẫu câu "raises **a long steel sword** gripped in his right hand and
  thrusts it forward … in a strong sword strike, then holds it pointed forward" cho nhát vung rõ hơn hẳn "swings …
  like a sword" (ra kiếm nhỏ như dao găm). Kiếm thép mang màu lạ + tách khỏi tay nên spec khai
  `quality.weaponAnims` (kèm lý do) để cổng tầng 2 miễn hai phép kiểm "vật lạ"/"liền khối" cho riêng attack/cast.
- Hiện có: Lior bé (E/S/N chém, E/S vung trượng), bản 16 tuổi nam + nữ (đủ E/S/N cả hai động tác); hướng tây lật
  gương, hướng chéo game lấy hướng kề.

### Thấy chiêu của nhau: phần chiêu trong tin `action` (10/10/2026)

Chủ dự án (09/10/2026): "người này phải thấy skill của người kia chơi pvp mà". Trước đó máy người xem chỉ phát ĐỘNG TÁC thân,
mà động tác ra đòn vẽ tay không (vũ khí ẩn lúc vung, cú đánh thể hiện bằng hiệu ứng) → người kia vung tay suông.

- **Giao thức** (`packages/protocol` — `ActionFx`, `cleanActionFx`, tương thích ngược hai chiều): tin `action` thêm trường TUỲ
  CHỌN `fx` = hướng ngắm `ax`/`ay` (vector đơn vị — mịn hơn 8 hướng), điểm nhắm `tx`/`ty` (chỉ đòn đặt vùng), hệ phủ phép `el`,
  hồi chiêu thật `cd` + hệ số nhanh `sp` (Đà Lướt — để khung chạm trùng), `boost` (Gió Sắc), cờ hình phụ `fl` (lưỡi gió phủ Phong
  mốc 7, Xoáy Nước bùng). KHÔNG có con số sát thương nào. Mã chiêu vẫn ở `skill`. Tên / giá trị cũ giữ nguyên.
- **Người tung** (`CombatSystem.cast` → `remoteCast.castFx`): mọi chiêu đều báo — kể cả chiêu không vung thân (lướt, giữ thế:
  `anim` = động tác riêng của chiêu cho máy bản cũ, máy mới biết chiêu đó không vung nên chỉ vẽ hình); chiêu dồn lực (Nhất Kích)
  báo lúc BẮT ĐẦU dồn, né / bị ngắt lúc đang dồn thì gửi `actionEnd`.
- **Máy chủ** (`apps/server/src/actions.ts` `cleanCast`, gọi từ `World.action`): mã chiêu phải có trong `HERO_SKILLS` (lạ →
  `skill: ''`, bỏ `fx`); `fx` sai dạng (hướng không hữu hạn / bằng 0, điểm nhắm không hữu hạn / ngoài thế giới / thiếu một toạ
  độ) → bỏ `fx` IM LẶNG, động tác thân vẫn đi như luật cũ; điểm nhắm chỉ giữ cho đòn đặt vùng, kẹp trong tầm chiêu + `AIM_SLACK`
  (96px) quanh vị trí máy chủ đang giữ; hệ phủ phép lạ / `cd` dài hơn hồi chiêu gốc thì bỏ riêng trường đó. Giữ trần 8 tin/giây,
  chỉ người CÙNG map nhận, không dội về người gửi.
- **Người xem** (`remoteCast.planRemoteCast` → `CombatSystem.echoCast`): chuẩn hoá lại (không tin dữ liệu mạng) rồi vẽ ĐÚNG các
  hình `release` vẽ cho đòn của mình, neo vào nhân vật người kia, đúng khung chạm (cùng `hitFrame`, cùng hồi chiêu): đạn bay theo
  hướng ngắm (chạm quái DÙNG CHUNG thì tan + hình trúng, quái riêng của máy mình thì bay xuyên; Phi Kiếm bay về tay người đó),
  vệt chém theo hướng + màu hệ phủ phép, vòng phép dưới chân, quả cầu ở tay, vùng / cột / tường / mưa / sét ở điểm nhắm, lưỡi gió
  xoay quanh người, vệt lướt, thế đỡ nhuộm nhân vật, pha dồn lực. CHỈ HÌNH: không sát thương, không khống chế, không đụng quái,
  không trừ máu / MP ai, không combo / Thế Áp Đảo, không rung / khựng / loé màn hình người xem. Tin dừng tới trước khung chạm →
  không vẽ đòn đó; đòn mới tới khi đòn cũ chưa nổ → đòn cũ nổ ngay (máy người tung chỉ cho cắt sau khung chạm). Tin dừng
  kèm `hit: true` (máy người tung cắt SAU khung chạm — đi / đòn kế trong pha thu thế, việc rất hay gặp) → đòn chưa nổ ở máy
  này được vẽ nốt ngay chứ không bỏ: khe giữa khung chạm và mốc cắt chỉ một frame động tác (~40–60ms), trễ mạng / hai tin tới
  dồn là mất trắng hình của chiêu. Máy chủ chỉ chuyển `hit` khi đúng `true`; máy chủ bản cũ bỏ trường đó (người xem bỏ đòn như
  trước). Vệt lướt chờ thêm
  `ECHO_LAG` 0,15s cho nhân vật (trượt theo ảnh chụp vị trí) tới chỗ dừng. Đang ẩn người chơi khác (Cài đặt) hoặc người đó cách
  xa hơn 1400px thì không vẽ hình (động tác thân vẫn chạy).
- **Giữ hai bên khớp nhau:** sửa hình của một kiểu đòn ở `release` thì sửa cả `echoRelease` — `apps/web/tests/remoteCast.test.ts`
  cho máy A tung TỪNG chiêu (43 chiêu, trừ Ảnh Bộ vì cần mục tiêu), chuyển tin qua JSON sang máy B, so bộ hình + đúng frame.
- **Chưa đồng bộ** (người xem chỉ thấy thân hoặc không thấy gì): nhát phản của thế đỡ / né đúng lúc (gửi động tác không kèm
  chiêu), lăn né, hình lúc trúng đòn của đòn cận chiến / vùng (máu quái dùng chung vẫn về qua `mobHp`, có số + nháy), các hình theo
  trạng thái trúng của người tung (nổ phủ Hoả mốc 7, Áp Đảo, Bất Khuất). Ảnh Bộ: nhân vật người kia TRƯỢT (không nhảy) tới sau
  lưng mục tiêu theo ảnh chụp vị trí.
- Test: `apps/server/tests/action.test.ts` (không cần máy chủ chạy), `smoke.test.ts` (B thấy Thiên Thạch của A kèm điểm nhắm đã
  kẹp; chiêu lạ / toạ độ vô lý bị bỏ phần chiêu), `apps/web/tests/remoteCast.test.ts`.
- Lên bản thật: khởi động lại máy chủ 3200 + build lại web. Máy chủ bản cũ không chuyển `fx` (người xem chỉ thấy thân như
  trước); máy khách bản cũ bỏ qua `fx`, và với chiêu không vung (lướt, giữ thế) thì phát động tác riêng của chiêu nếu atlas có.

#### PvP gây sát thương — ĐÃ LÀM (10/10/2026, bản Unity), luật mặc định chờ chủ dự án chỉnh

Chủ dự án 10/10/2026: "xây dựng là game pvp đó nha". Chọn: **máy chủ tính trúng** (câu 1) — `packages/sim/src/pvp.ts` (luật thuần:
`pvpStrikes` hình học chiêu chép từ `release`, `pvpDamage`, `pvpBuild` kẹp mốc tiềm năng theo điểm có) + `apps/server/src/pvp.ts`
(hẹn lần xét trúng từ `World.action`, xét trên vị trí máy chủ giữ lúc đó, phát `pvpHit` cả map; `pvpDown` → `pvpKill`). Máy bị đánh
còn xét lăn né / thế đỡ. Gói vị trí kèm `hp`/`hpMax` để người khác vẽ thanh máu. Test `apps/server/tests/pvp.test.ts` (11 ca); thử
thật hai bản Unity trên máy chủ thử: A chém, B mất 60/115 máu, A thấy máu B tụt. Mặc định cho các câu còn lại (đổi ở `pvp.ts`):
2 — mọi map trừ map trạm của vùng (`PVP_SAFE_MAPS`); 3 — ×0,4 sát thương PvE − giáp, chí mạng như PvE, KHÔNG phản ứng / khống chế,
miễn PvP 5 giây sau khi vào map; 4 — gục không mất gì, hồi sinh quảng trường, cả map thấy "A hạ gục B"; 5 — bình kim cương không áp
(bản Unity chưa có bình); 6 — bạn bè vẫn đánh trúng nhau. Chi tiết client: `UnityGame/Assets/Aether/Client/Combat/Combat.md`.

Ghi chép cũ (trước khi làm):

Chỗ móc: `World.action` ở máy chủ (đã có chiêu + hướng + điểm nhắm ĐÃ KIỂM, biết vị trí mọi người trong map) và
`CombatSystem.echoRelease` ở máy người xem (hiện chỉ vẽ). Không tính trúng người ở máy khách. Cần quyết:

1. **Ai tính trúng**: máy chủ (đúng hướng M3, chống gian lận — phải đưa hình học đòn `skillRules` + vị trí / thế đỡ / miễn thương
   của người chơi lên máy chủ, bù trễ mạng) hay máy người BỊ đánh tự xét như đòn quái dùng chung M3.2b (nhanh làm, nhưng máy bị
   đánh có thể "không nhận").
2. **Đánh nhau ở đâu**: map / vùng PvP riêng, cờ bật–tắt PvP từng người, đấu tay đôi (mời – chấp nhận), hay mọi nơi trừ thị trấn
   / trạm.
3. **Số liệu PvP**: hệ số sát thương người-đánh-người (thường giảm mạnh so với PvE), khống chế giảm dần (chống choáng / đóng băng
   liên hoàn), miễn thương sau hồi sinh, có tính phản ứng nguyên tố không.
4. **Hậu quả khi gục**: mất gì (không mất / EXP / xu), hồi sinh ở đâu; chống đồ sát người cấp thấp (chênh cấp tối đa, vùng an toàn).
5. **Bình kim cương** (`dmg` / `guard`) có áp trong PvP không — tránh "trả tiền là thắng".
6. **Bạn bè / tổ đội** (M3.4) có đánh trúng nhau không.

## Thế giới nhiều map theo vùng (07/10/2026)

Chủ dự án chốt: **mỗi khu vực CHỈ một loại quái, sống theo bầy**; thế giới chia nhiều map, giữa các vùng thường thì đi
tới mép là nạp map mới, **có mũi tên chỉ hướng**; map phải **đồng nhất một style**. (Map khác hẳn như băng, sa mạc…
tính cách chuyển sau.)

| Map (`assets/maps/human/<id>.json`) | Kích thước | Quái | Lối sang |
| --- | --- | --- | --- |
| `town` — Thistlewood + sông Brightwater | 50×52 ô | không (vùng an toàn) | đông → `mossvale` |
| `mossvale` — Rừng Mossvale | 48×44 ô | CHỈ nấm rừng, 5 bầy (bìa rừng 3 con theo nhiệm vụ; 4 bầy 4–5 con từ 16 tuổi) | tây → `town`, bắc → `shrine` |
| `shrine` — Đá Phong Ấn | 30×26 ô | không — chỉ Quỷ vương (dậy theo nhiệm vụ) | nam → `mossvale` |

- **Pipeline** (`packages/asset-pipeline/src/maps/human/`): `common.ts` (bàn dựng `Layout`, lối `exitStrip`),
  một file mỗi map, `index.ts` gom + **kiểm luật** (mỗi map ≤ 1 loại quái; id địa điểm/vùng quái/hình nộm DUY NHẤT
  trên cả vùng; lối nào cũng tới map có thật, điểm đến có thật, không nằm trong dải lối của map đích, có lối quay
  về) rồi ghi `world.json` — chỉ mục map nào có địa điểm/vùng quái/hình nộm/boss nào và lối sang đâu.
- **Lối sang map** = dải 1 ô sát mép. Bước vào dải VÀ đang đi về phía mép đó thì chuyển (`world/exits.ts`). Chuyển:
  màn tối dần → gỡ map cũ cùng quái/NPC/vật phẩm/hình nộm/đạn → nạp map mới, đứng ở điểm đến → dựng lại NPC có chỗ
  đứng trên map này, bầy quái theo tuổi, phần thế giới của nhiệm vụ đang làm (`StoryDirector.reapplyWorld`) → báo
  máy chủ `t:'map'` → sáng lại (`Game.changeMap`). Mũi tên vàng nhấp nhô + tên map đích ở mỗi lối; bản đồ/minimap
  hiện lối như địa danh "→ Tên map".
- **Dẫn đường xuyên map:** mục tiêu nhiệm vụ ở map khác (`WorldIndex.mapOfTarget`) → đích tự đi là lối kế tiếp trên
  đường ít lần chuyển map nhất (`nextExit`); sang map mới thì tự đi tiếp tới tận nơi.
- **Bầy:** cả bầy chung một `home` nên một con thấy người chơi hoặc trúng đòn là cả bầy lao vào
  (`CombatSystem.engage`). Boss không thuộc bầy.
- **Online:** máy chủ đã chia người chơi theo map từ trước; tin mới `{t:'map', map:'human/mossvale'}` → người ở map
  cũ nhận `leave`, mình nhận `welcome` của map mới, gói vị trí đầu ở map mới đặt tự do. Tiến độ lưu `map` nên vào
  lại game đứng đúng map cũ. Smoke test máy chủ có 4 phép kiểm chuyển map.
- Lớn thêm tuổi mà đang ở rừng thì tự về thị trấn (cảnh bắt đầu ở nhà). Aldric 16 tuổi đổi sang `npc_aldric_001`
  (PixelLab), bỏ hiệp sĩ FreePixel lệch style.
- Test: `apps/web/tests/nav.test.ts` (mọi map: va chạm, lưới, tự đi tới mọi đích kể cả lối), `story.test.ts`
  (mọi tham chiếu cốt truyện có trên vùng, mục tiêu đi tới được XUYÊN map từ nhà).

### Đồ vật vẽ theo TẤM (rẻ gấp 3–4 lần)

Pro Flash tính 5–6 lượt/ảnh tới khổ 192 bất kể vẽ gì → một ảnh 192×192 vẽ cả lưới 2×2 / 3×3 đồ vật, cùng ảnh mẫu
style là nhà/cây đã duyệt, rồi `props/sheet.ts` cắt theo lưới:

```bash
npm run assets:pixellab -- image <token#> sources/pixellab/sheets/<tấm>.png @args.json   # args: description, width, height, style_image_path, style_usage…
npm run assets:map
```

- Khai đồ vật bằng `path: 'sheet:<tấm>#<ô>@<cột>x<hàng>'`. Ảnh cắt từng tấm để soi: `reports/sheets/<tấm>.png`.
- "Background removal erased the whole image" (không tính lượt) → vẽ lại trên **nền magenta**; bộ cắt tách nền
  theo SẮC và khử viền tím ở mép (`keyMagenta`). Ô bị lấn từ ô bên cạnh: bỏ cụm nhỏ chạm mép ô.
- Bốn tấm: T1 quầy chợ ×2 + giếng + biển chỉ đường; T2 thùng, hòm, rơm, hình nộm rơm ("Ông Rơm"), hàng rào, ghế,
  chậu hoa, đèn, xe cút kít; N1 bụi ×2, đá ×2, gốc cây, nấm phát sáng + cỏ Sương Bạc (cũng là hình vật phẩm nhặt),
  dương xỉ, hoa dại; S1 đá phong ấn, cột đổ, đá khắc, đèn đá. Decal mặt đất từ tấm D1 (cỏ/hoa/sỏi); chưa có thì map
  không có decal — **không** quay về decal FreePixel.

## Bản đồ đầu: nhà + cây PixelLab nhìn chính diện (06/10/2026)

Chủ dự án chê nhà FreePixel lệch góc nhìn (nhà góc nghiêng 3/4 lẫn với nền nhìn thẳng) và cây quá nhiều loại
không hợp nhau → **chốt kiểu: nhà mặt tiền nhìn THẲNG chính diện, cùng viền đen + bóng cel với nhân vật; chỉ
một loại cây.** Vẽ bằng `create_object_pro_flash` (1 hướng), ảnh mẫu nét = Lior bé, công trình sau lấy chính
căn nhà đã duyệt (cắt sát) làm mẫu để cả làng đồng bộ:

```bash
npm run assets:pixellab -- object <token#> <tên> @args.json   # tạo + chờ + tải về sources/pixellab/objects/<tên>/
npm run assets:map                                             # dựng atlas đồ vật + town.json
```

- Khai đồ vật PixelLab trong `props/humanKingdom.ts` bằng `path: 'pixellab:<tên>'`. Biến thể KHÔNG tốn lượt:
  `flip: true`, `recolor` (mái đỏ → xanh/rêu bằng `hueTo`, lá xanh → lá thu). Nhà Ashvale giữ mái đỏ gốc.
- Giá: khổ 192×192 ≈ 6–7 lượt, 192×224 = 9 lượt (vượt số dư thì báo lỗi, không trừ); 64×64 ≈ 1 lượt.
- Ảnh mẫu nét phải LỌT khung vẽ ("Style image must fit the native canvas") → cắt sát trước khi gửi.
- Đã thay: nhà dân ×7 (mỗi nhà một bản vẽ riêng), nhà thờ, cây (1 loại + lật gương + lá thu). 07/10/2026: gỡ
  HẾT đồ vật FreePixel còn lại, thay bằng đồ vật cắt từ tấm PixelLab (mục "Đồ vật vẽ theo TẤM" ở trên).

## Còn tạm thời (M1)

- 07/10/2026: đã xoá mọi nhân vật FreePixel/vẽ tay không dùng (`player_mage_001(_f)`, `player_swordsman_001`,
  `npc_merchant/medic/squire_001`, `mob_beast/zombie/gargoyle_001` bản cũ) — game chỉ còn 13 nhân vật PixelLab.
- Máy chủ tin vị trí/cấp do client gửi (chỉ chặn dịch chuyển quá tốc độ). Chống gian lận thật ở M3.

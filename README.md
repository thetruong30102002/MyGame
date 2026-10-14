# Aether Chronicle

Game nhập vai online phong cách **HD anime pixel art fantasy**. Client là **Unity 2D** (PC + Android); bản web Next.js + PixiJS đã
xoá 11/10/2026 sau khi chép đủ sang Unity (`UnityGame/MIGRATION_PLAN.md`).

```
UnityGame/                client Unity 6.3 (C#): luật chép từ packages/sim, UI, mạng — đọc UnityGame/README_UNITY.md
apps/server/              máy chủ online: Node 24 + ws + node:sqlite (tài khoản, nhân vật, thấy nhau, chat, kinh tế, PvP, quản trị)
packages/protocol/        kiểu dữ liệu dùng chung client ↔ máy chủ
packages/sim/             luật + dữ liệu game dùng chung (chiêu, tiềm năng, quái, cốt truyện, vùng…) — Unity xuất JSON từ đây
packages/asset-pipeline/  Node CLI: PixelLab → chuẩn hoá → cổng chất lượng → atlas / map / UI / hiệu ứng
assets/                   ĐẦU RA của pipeline (atlas, manifest.json, maps/*.json, ui, vfx) — máy chủ đọc map, Unity nhập hình
docs/                     kế hoạch, cốt truyện, bàn giao (docs/the-gioi-aether.md)
```

## Chạy

```bash
npm install
npm run server                                  # máy chủ game online: http://localhost:3200 (tài khoản, nhân vật, ws)
npm test                                        # test luật sim + pipeline (máy chủ: cd apps/server && npx tsx tests/<tên>.test.ts)
npm run assets:character -- player_mage_001     # dựng lại 1 nhân vật từ spec → assets/
npm run assets:map                              # dựng gói vùng Human Kingdom (đồ vật + map) → assets/maps
cd apps/server && npx tsx src/admin.ts add <tài khoản>   # quản trị: cấp quyền mở cửa sổ Quản trị trong game (xem mục Quản trị)
cd apps/server && npx tsx src/grant.ts "<tên>" 10   # lệnh cũ: cộng kim cương (số âm = trừ, bỏ số = xem ví)
```

Client Unity (nhập hình từ `assets/`, dựng scene, build PC / APK, AutoTest): **`UnityGame/README_UNITY.md`**. Build xong phát bằng
`npx tsx UnityGame/Tools~/publish-client.mts` → người chơi đang có game **tự cập nhật** lúc mở game; người mới tải bộ cài ở
**https://admin.tail024813.ts.net/game/api/client/latest/windows** (Android: `…/latest/android`).

**Trang chủ game** (tin tức, nút tải PC / zip / APK, đăng nhập bằng tài khoản game, góp ý, bảng tin cộng đồng — viết bài + bình luận):
**https://admin.tail024813.ts.net/game/** — trang tĩnh `apps/server/site/` do máy chủ game phát (`apps/server/src/site.ts`).
**Trang quản trị web**: **…/game/admin** (14/10/2026) — cộng / trừ tài nguyên cho nhân vật, đọc góp ý, đăng / sửa / xoá tin tức, ẩn bài
viết / bình luận xấu, nhật ký; quyền như cửa sổ Quản trị trong game (`src/admin.ts add`). Tin tức lưu CSDL (bảng `news`, lần đầu chạy nạp
từ `site/news.json` — file đó chỉ còn để dự phòng khi API lỗi); bài viết ở bảng `posts` / `post_comments`, xoá = ẩn. API + luật ở
`apps/server/src/board.ts`, test `apps/server/tests/board.test.ts`.
Giao diện dùng **Tailwind + daisyUI** (theme `aether` ở `apps/server/site-src/tailwind.config.cjs`): sửa class trong `site/*.html` xong chạy
`npm run build:site -w @aether/server` để build lại `site/app.css` (commit cả file đó). Sửa HTML / CSS không cần khởi động lại; sửa
`site.ts` / `http.ts` / `board.ts` thì phải khởi động lại máy chủ.

| Phím | Tác dụng |
| --- | --- |
| WASD / mũi tên | Di chuyển (Shift: chạy, tốn thể lực) |
| Chuột trái | Chém (giữ = chém liên tục); nhấp trúng quái thì chọn nó làm mục tiêu — không còn phím J (điện thoại: giữ nút chạm) |
| Chuột phải | Phép thường — không còn phím K |
| 1–8 | Chiêu trên thanh 10 ô (gán ở Tiềm năng → Gán ô · Phủ phép); nhắm vào mục tiêu đang chọn |
| Tab | Đổi mục tiêu gần → xa; Esc bỏ chọn |
| Space | Né |
| E | Nói chuyện / nhặt đồ / qua thoại |
| R | Bình hồi phục |
| C · B · T · M · F · L · O | Nhân vật · Túi đồ · Tiềm năng · Bản đồ · Bạn bè · Thư viện · Cài đặt |
| Enter | Chat (`/w <tên>` nhắn riêng, `/r` trả lời) |
| H | Bảng phím |

Bấm ô nhiệm vụ (phải trên) = tự đi tới chỗ làm nhiệm vụ. Màn cảm ứng tự hiện cần điều khiển + cụm nút.
Mỗi vùng có thời tiết riêng (tuyết rơi, cát bay + cỏ khô lăn, tro núi lửa, đom đóm + sương đầm lầy…) — tắt ở Cài đặt → "Hiệu ứng thời tiết".

### Quản trị: cửa sổ Quản trị trong game (cộng tiền, điểm cho nhân vật)

Tài khoản có quyền thấy nút **Quản trị** ở tab Cài đặt (O); trên web có thêm trang **…/game/admin** (cùng API, xem mục Trang chủ). Tìm nhân vật theo tên nhân vật / tên tài
khoản → số hiện tại (xu, kim cương, bình hồi phục, cấp + EXP, điểm tiềm năng thưởng, đang online?) → cộng / trừ từng loại, đặt cấp,
lý do BẮT BUỘC → dòng xem trước "trước → sau" (tính bằng đúng luật máy chủ) → bấm Áp dụng hai lần → kết quả + nhật ký.

- **Cấp quyền** theo TÀI KHOẢN — mặc định không ai có quyền; có hiệu lực ngay, không cần khởi động lại máy chủ:

  ```bash
  cd apps/server
  npx tsx src/admin.ts add <tài khoản>       # cấp quyền (tên đăng nhập, không phải tên nhân vật)
  npx tsx src/admin.ts remove <tài khoản>    # thu quyền
  npx tsx src/admin.ts list                  # ai đang có quyền
  # CSDL thử: thêm AETHER_DB=data/test.db (mặc định là CSDL THẬT data/aether.db)
  ```

- **Biên độ mỗi lần**: xu ±1.000.000 · kim cương ±100.000 · bình ±999 · EXP ±10.000.000 · điểm tiềm năng ±200 · đặt cấp 1–100
  (EXP về 0, đặt trước rồi mới cộng EXP). Không bao giờ âm: trừ quá số đang có thì về 0. Chặn dồn dập: 120 lời gọi / phút mỗi địa
  chỉ, 30 lần cộng / phút mỗi tài khoản quản trị.
- **Người đang online nhận ngay** (số vào bộ nhớ kinh tế của máy chủ + tin `eco` / `wallet`; game báo "Quản trị: <lý do>"); offline
  thì thấy ở lần vào game sau. Trừ EXP lùi theo tổng EXP (có thể xuống cấp).
- **Điểm tiềm năng thưởng** do máy chủ giữ (`progress.bonusPoints`) — cộng vào điểm theo cấp ở bảng Tiềm năng, không theo trần cấp
  40; bản lưu của client không ghi đè được. Trừ điểm thưởng đã tiêu thì game tự hạ mốc cho vừa.
- **Nhật ký**: mỗi trường đổi một dòng ở bảng `admin_log` (quản trị, nhân vật, trường, trước → sau, lý do, lúc) — xem ở cột phải cửa sổ
  Quản trị; kèm dòng ở `eco_ledger` / `diamond_ledger` với lý do `admin:<tài khoản quản trị>:<lý do>`.
- API (cùng kiểu xác thực `Authorization: Bearer <token>`, nhận cả `/game/api/...`): `GET /api/admin/me`, `GET /api/admin/characters?q=`,
  `POST /api/admin/grant`, `GET /api/admin/log?limit=` — chưa đăng nhập 401, không có quyền 403.

### Chia sẻ ra internet qua Tailscale Funnel

Cổng Funnel trên máy `admin` — **chỉ còn Aether**. Client Unity (PC / APK) gọi máy chủ game qua `/game`:

| Địa chỉ | Trỏ vào | Ghi chú |
| --- | --- | --- |
| **`https://admin.tail024813.ts.net/game`** (443) | `127.0.0.1:3200` — máy chủ game (REST + WebSocket `/game/ws`), CSDL `apps/server/data/aether.db` | **Địa chỉ máy chủ điền ở màn đăng nhập** |
| `https://admin.tail024813.ts.net:8443/game` | như trên | Link cũ. Cổng 8443 bị nhiều mạng ở Việt Nam chặn (mạng công ty, 4G, wifi công cộng) |
| `…/` (443, 8443) | `127.0.0.1:3101` — bản web cũ, **đã xoá**, cổng không còn ai nghe | Route còn sót: Tailscale 1.102.2 không gỡ riêng được route `/` (`--set-path=/ off` báo "handler does not exist"); gỡ hẳn phải `tailscale funnel reset` rồi thêm lại hai route `/game` bên dưới (đường vào game đứt vài giây) |

```bash
npm run start -w @aether/server                                  # máy chủ game (CSDL thật), cổng 3200
tailscale funnel --bg --https=443 --set-path=/game http://127.0.0.1:3200
tailscale funnel --bg --https=8443 --set-path=/game http://127.0.0.1:3200     # link cũ, tuỳ chọn
tailscale funnel --https=8443 off                                # gỡ link cũ 8443
```

- **Chạy lệnh `--set-path=/game` bằng PowerShell/cmd, KHÔNG bằng Git Bash**: Git Bash tự đổi `/game` thành
  `C:/Program Files/Git/game` (đã dẫm 02/10/2026). Nếu buộc dùng Git Bash thì thêm `MSYS_NO_PATHCONV=1`.
- Máy chủ game nhận cả `/api/...` lẫn `/game/api/...` (tương tự `/ws` và `/game/ws`), nên Funnel cắt hay không cắt tiền tố thì vẫn chạy.
- Log máy chủ game: `apps/server/data/server.log`.
- Funnel chỉ mở được cổng **443, 8443, 10000**; Aether dùng 443 (chính) + 8443 (link cũ), còn trống **10000**.
- Muốn tên riêng (`aether.tail024813.ts.net`) thì phải có node Tailscale thứ hai (máy khác hoặc container). Tailscale
  Services không dùng được ở đây: host của Services phải là thiết bị **gắn tag**, còn `admin` là máy đăng nhập bằng
  tài khoản. Lệnh `funnel` (1.102.2) cũng không có `--service`.
- Funnel chỉ chuyển tiếp: tắt máy chủ game (tắt máy, đóng phiên) thì link trả 502 cho tới khi chạy lại.
- **Chạy bản thật TÁCH khỏi phiên Claude / cửa sổ terminal** (đã dẫm 10/10/2026: máy chủ chạy làm việc nền của một phiên Claude,
  đóng phiên là tắt theo, link 502 suốt ~4 giờ). Tiến trình con của Node trên Windows nằm trong job "tắt theo cha", kể cả
  `Start-Process`; tạo qua WMI thì cha là dịch vụ WMI nên sống độc lập (PowerShell):
  `Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = 'cmd.exe /c "npx tsx src\main.ts >> data\server.log 2>&1"'; CurrentDirectory = 'D:\nttrg\pixel\apps\server' }`.
  Tắt: `taskkill /PID <pid đang nghe cổng> /T /F` (tắt cứng không mất gì — máy chủ ghi thẳng vào CSDL khi có thay đổi).
- **Tự bật khi mở máy** (10/10/2026): `scripts/khoi-dong-ban-that.ps1` bật máy chủ game :3200 (cổng đã có tiến trình nghe thì bỏ qua,
  tạo tiến trình qua WMI như trên, log `scripts/khoi-dong-ban-that.log`). Tác vụ Windows **"Aether - ban that"** gọi file đó mỗi lần
  đăng nhập Windows (trễ 20 giây, không cần quyền quản trị). Máy chưa bật tự đăng nhập Windows nên sau khi khởi động lại phải đăng nhập thì
  bản thật mới lên. Tailscale chạy dạng dịch vụ tự khởi động và giữ cấu hình Funnel (`--bg`).

  ```powershell
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\khoi-dong-ban-that.ps1          # bật ngay (vd sau khi tắt để cập nhật)
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\cai-tu-khoi-dong.ps1            # cài / cài lại tác vụ
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\cai-tu-khoi-dong.ps1 -Remove    # gỡ tác vụ
  ```
- **Cập nhật máy chủ thật**: sao lưu CSDL trước (`VACUUM INTO` bằng `node:sqlite` chạy được khi máy chủ đang mở CSDL — mẫu ở
  `docs/the-gioi-aether.md` mục Chạy / kiểm), `taskkill` tiến trình nghe :3200, chạy lại `scripts\khoi-dong-ban-that.ps1`.
- Triển khai hình mới: dựng thử `AETHER_ASSETS=<thư mục nháp> npm run assets:…`, duyệt xong mới dựng vào `assets/` — **máy chủ thật
  đọc map trong `assets/maps` ngay lúc chạy** và giữ đệm theo file, nên đổi map thì khởi động lại máy chủ; hình mới vào game qua
  Unity `Aether/Nhập dữ liệu từ pipeline` rồi build lại PC / APK.

Phản ứng nguyên tố: **Thuỷ** vào mục tiêu đang cháy → *Hơi Nước*; **Phong** vào mục tiêu đang cháy → *Bùng Lửa* (nổ lan);
**Phong** vào mục tiêu đang ướt → *Băng Giá* (làm chậm).

## Trạng thái so với kế hoạch

| Phase | Trạng thái |
| --- | --- |
| 1 Project setup | ✔ monorepo máy chủ + luật dùng chung + pipeline; client Unity (`UnityGame/`). Bản web Next.js đã xoá 11/10/2026 |
| 2 Renderer | ✔ Unity 2D pixel-perfect (`PixelCamera`: zoom nguyên, bám mượt, giới hạn map), mặt đất vẽ khớp từng byte bản TS (`GroundShader`) |
| 3 Asset pipeline | ✔ FreePixel + Pixler (REST, quy trình nhiều ngày) + SpriteLab (chỗ cắm); cổng chất lượng + duyệt bằng mắt; khoá bảng màu |
| 4 Di chuyển | ✔ 8 hướng, walk/run, va chạm có trượt theo trục |
| 5 Map | ✔ Thistlewood + sông Brightwater + rừng Mossvale (72×52 ô 48px, 220 đồ vật FreePixel, mặt đất sinh bằng code) |
| 6 Combat | ✔ đạn phép, cận chiến, né, MP/stamina/cooldown, chí mạng, 3 phản ứng nguyên tố |
| 7 Monsters | ✔ 5 loại quái + boss (AI phát hiện/đuổi/đánh/bỏ đuổi, đánh xa, vòng báo trước, nổi giận) |
| 8 NPC | ✔ 3 NPC có thoại theo giai đoạn truyện (chưa có lịch sinh hoạt theo giờ) |
| 9 Inventory | ◐ mới có xu + bình hồi phục; túi đồ/trang bị chưa làm |
| 10 Quest | ✔ Chương 0: 4 nhiệm vụ + lời tựa + kết chương, lưu/tải `localStorage` |
| 11 Online | ◐ M1 xong: đăng nhập, tạo nhân vật nam/nữ (thay Lior trong truyện), thấy nhau, chat, lưu trên máy chủ. Kế hoạch: [`docs/online-va-build.md`](docs/online-va-build.md) |
| Kim cương | ◐ K1: ví ở máy chủ + nhật ký, điểm danh mỗi ngày, Bia Danh Vọng (thành tựu), quầy kim cương của Bram bán bình EXP / chiến đấu, icon lịch mở cửa sổ điểm danh, cửa sổ Quản trị trong game (cộng tiền / điểm + nhật ký). Chưa nạp tiền thật — [`docs/ke-hoach-kim-cuong.md`](docs/ke-hoach-kim-cuong.md) |
| 12–13 | chưa làm (tối ưu asset, mobile) |

**Bắt đầu đọc / làm tiếp (người hay agent): [`docs/the-gioi-aether.md`](docs/the-gioi-aether.md)** — mục Bàn giao (trạng thái, việc
kế tiếp, lệnh chạy / kiểm / triển khai, luật dự án) + danh sách vùng / map / quái / boss / trang bị + ngân sách PixelLab.

Cốt truyện: [`docs/story.md`](docs/story.md). Đội hình nhân vật và lý do loại: [`docs/asset-pipeline.md`](docs/asset-pipeline.md).
Lịch sinh nhân vật Pixler theo quota: [`docs/pixler-plan.md`](docs/pixler-plan.md).

Kiểm thử: `npm test` (luật sim + pipeline), test máy chủ trong `apps/server/tests`, client Unity `dotnet test UnityGame/Tests~/Aether.Core.Tests` + AutoTest (`-aetherShot <thư mục>` kèm `-aetherStory` / `-aetherLab` / `-aetherSocial` / `-aetherAdmin` — `UnityGame/README_UNITY.md`).

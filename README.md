# Aether Chronicle

Browser online RPG phong cách **HD anime pixel art fantasy**. Repo đang ở **vertical slice, bước 1: nhân vật**.

```
apps/web/                 Next.js 16 + PixiJS 8 + Tailwind 4 + Zustand — client render
apps/server/              máy chủ online: Node 24 + ws + node:sqlite (tài khoản, nhân vật, thấy nhau, chat)
packages/protocol/        kiểu dữ liệu dùng chung web ↔ máy chủ
  src/game/               engine (framework-free): pixel app, camera, asset manifest, actor
  src/app/lab/            Character Lab — duyệt 8 hướng × 1×/2×/3× bằng đúng đường render của game
  public/assets/          atlas đã qua cổng chất lượng + manifest.json
packages/asset-pipeline/  Node CLI: provider → chuẩn hoá → dọn → recolor → cổng chất lượng → atlas
docs/                     asset-pipeline.md, asset-sources.md
```

## Chạy

```bash
npm install
npm run server                                  # máy chủ game online: http://localhost:3200 (tài khoản, nhân vật, ws)
npm run dev                                     # http://localhost:3100  (/lab = Character Lab)
npm run assets:character -- player_mage_001     # dựng lại 1 nhân vật từ spec
npm run assets:map                              # dựng gói vùng Human Kingdom (đồ vật + map)
npm run assets:pixler -- quota                  # quy trình sinh nhân vật Pixler nhiều ngày
cd apps/server && npx tsx src/grant.ts "<tên>" 10   # quản trị: cộng kim cương (số âm = trừ, bỏ số = xem ví)
```

| Phím | Tác dụng |
| --- | --- |
| WASD / mũi tên | Di chuyển (Shift: chạy, tốn stamina) |
| Chuột trái / J | Đòn cơ bản, ngắm theo con trỏ |
| 1 · 2 · 3 · 4 | Kỹ năng (Pháp sư: Hoả Cầu · Thuỷ Tiễn · Phong Nhận · Hồi Phục) |
| Space | Né (bất tử ngắn, 25 stamina) |
| E | Nói chuyện / nhặt đồ / qua thoại (Bram: quầy kim cương · Bia Danh Vọng: thành tựu) |
| R | Bình hồi phục |

### Chơi trên điện thoại

Điện thoại và máy chạy `npm run dev` phải cùng mạng Wi-Fi. Mở `http://<IP-LAN-của-máy>:3100` trên điện thoại
(lấy IP bằng `ipconfig`, dòng *IPv4 Address*). Nếu Windows Firewall hỏi thì cho Node.js qua mạng *Private*.

- Next 16 ở chế độ dev **chặn** tài nguyên `/_next/*` khi trang mở bằng host khác `localhost`: điện thoại chỉ thấy
  màn chờ. `apps/web/next.config.ts` đã khai `allowedDevOrigins` cho mọi IPv4 của chính máy này. Đổi mạng
  (IP đổi) thì khởi động lại `npm run dev`.
- Màn cảm ứng tự hiện điều khiển riêng: **joystick** bên trái (đẩy hết cỡ = chạy), cụm nút phép / né / bình
  bên phải, nút **Nói / Nhặt** khi đứng cạnh NPC hay vật phẩm. **Chạm vào bản đồ** = bắn đòn cơ bản về chỗ chạm.
  Không có chuột thì đòn bắn tự ngắm mục tiêu gần nhất. Khung thoại: chạm để qua.
- Bảng Dev ẩn trên điện thoại cho đỡ chật; thêm `?dev` vào URL để hiện lại.

### Chia sẻ ra internet qua Tailscale Funnel

Cổng Funnel trên máy `admin` — **chỉ còn Aether** (08/10/2026: chủ dự án bỏ hẳn Phỏm, Aether chiếm cổng 443). Web **và**
máy chủ game online chung một cổng:

| Địa chỉ | Trỏ vào | Ghi chú |
| --- | --- | --- |
| **`https://admin.tail024813.ts.net/`** (443) | `127.0.0.1:3101` — web, bản production (`next start`) | **Link chính gửi bạn bè** |
| `https://admin.tail024813.ts.net/game` | `127.0.0.1:3200` — máy chủ game (REST + WebSocket `/game/ws`), CSDL `apps/server/data/aether.db` | |
| `https://admin.tail024813.ts.net:8443/` (+ `/game`) | như trên | Chạy song song cho link cũ. Cổng 8443 bị nhiều mạng ở Việt Nam chặn (mạng công ty, 4G, wifi công cộng) — bạn bè báo "không vào được" là vì vậy |

```bash
npm run start -w @aether/server                                  # máy chủ game (CSDL thật), cổng 3200
npm run build:funnel -w @aether/web                              # build web trỏ máy chủ game về /game, ra apps/web/.next-funnel
npm run start:funnel -w @aether/web                              # next start -p 3101 đọc .next-funnel; tắt bản cũ trước
tailscale funnel --bg --https=443 http://127.0.0.1:3101
tailscale funnel --bg --https=443 --set-path=/game http://127.0.0.1:3200
tailscale funnel --bg --https=8443 http://127.0.0.1:3101                  # link cũ, tuỳ chọn
tailscale funnel --bg --https=8443 --set-path=/game http://127.0.0.1:3200
tailscale funnel --https=8443 off                                # gỡ link cũ 8443
```

- **Chạy lệnh `--set-path=/game` bằng PowerShell/cmd, KHÔNG bằng Git Bash**: Git Bash tự đổi `/game` thành
  `C:/Program Files/Git/game` (đã dẫm 02/10/2026). Nếu buộc dùng Git Bash thì thêm `MSYS_NO_PATHCONV=1`.
- Máy chủ game nhận cả `/api/...` lẫn `/game/api/...` (tương tự `/ws` và `/game/ws`), nên Funnel cắt hay
  không cắt tiền tố thì vẫn chạy.
- Build web bằng `build:funnel` (đặt `NEXT_PUBLIC_SERVER_URL=/game` bên trong Node): thiếu biến thì client gọi
  `https://<host>:3200`, cổng không mở qua Funnel → kẹt ở "Đang kết nối…". **Đừng gõ
  `NEXT_PUBLIC_SERVER_URL=/game npm run build` trong Git Bash**: nó đổi giá trị thành
  `C:/Program Files/Git/game`, build vẫn qua nhưng mọi lời gọi API báo "Không kết nối được máy chủ game"
  (đã dẫm 06/10/2026). `next.config.ts` nay chặn giá trị dạng đường dẫn Windows ngay lúc build.
- Bản triển khai build XEN KẼ hai thư mục `apps/web/.next-funnel` ↔ `.next-funnel-b` (`scripts/funnelDir.mjs`): `build:funnel` luôn
  ghi vào thư mục KHÔNG đang chạy rồi mới ghi tên nó vào `apps/web/.funnel-current`; `start:funnel` đọc file đó. Nhờ vậy build
  lúc đang có người chơi không làm sập bản đang phục vụ (đã dẫm 07/10/2026 khi build đè thư mục đang chạy), build lỗi thì bản cũ
  chạy tiếp. Cập nhật = `build:funnel` xong → tắt `start:funnel` cũ → chạy lại (gián đoạn ~1 giây). Đừng chạy `next start` trần.
- Log khi chạy nền (08/10/2026): web `apps/web/funnel.log`, máy chủ game `apps/server/data/server.log`.
- Funnel chỉ mở được cổng **443, 8443, 10000**; Aether dùng 443 (chính) + 8443 (link cũ), còn trống **10000**. Chia sẻ thì
  luôn gửi link 443 — cổng lạ dễ bị mạng chặn.
- Muốn tên riêng (`aether.tail024813.ts.net`) thì phải có node Tailscale thứ hai (máy khác hoặc container). Tailscale
  Services không dùng được ở đây: host của Services phải là thiết bị **gắn tag**, còn `admin` là máy đăng nhập bằng
  tài khoản (gắn tag cho nó là đổi cách máy đăng nhập). Lệnh `funnel` (1.102.2) cũng không có `--service`.
- Funnel chỉ chuyển tiếp: tắt `next start` hoặc máy chủ game (tắt máy, đóng phiên) thì link trả 502 cho tới khi chạy lại.
- Chia sẻ bản **production**, đừng chia sẻ `next dev`: dev chậm, kèm overlay lỗi và HMR.

Phản ứng nguyên tố: **Thuỷ** vào mục tiêu đang cháy → *Hơi Nước*; **Phong** vào mục tiêu đang cháy → *Bùng Lửa* (nổ lan);
**Phong** vào mục tiêu đang ướt → *Băng Giá* (làm chậm).

## Nguyên tắc render pixel-perfect

- Texture `nearest`, `antialias: false`, `roundPixels`; canvas vẽ theo **pixel thiết bị**, zoom là **số nguyên**.
- Camera bám mượt bằng số thực, vị trí cuối làm tròn về pixel nguyên; đã đo 100% texel sprite đồng màu ở 2×.
- Mặt đất sinh theo chunk 384px trong **Web Worker**, chỉ khi chunk vào vùng nhìn; đồ vật/decal bật `cullable`.

## Trạng thái so với kế hoạch

| Phase | Trạng thái |
| --- | --- |
| 1 Project setup | ✔ monorepo web + pipeline. **Backend NestJS/PostgreSQL/Redis chưa dựng** |
| 2 PixiJS renderer | ✔ pixel-perfect, camera follow/zoom/shake/giới hạn map, lazy-load theo manifest, culling |
| 3 Asset pipeline | ✔ FreePixel + Pixler (REST, quy trình nhiều ngày) + SpriteLab (chỗ cắm); cổng chất lượng + duyệt bằng mắt; khoá bảng màu |
| 4 Di chuyển | ✔ 8 hướng, walk/run, va chạm có trượt theo trục |
| 5 Map | ✔ Thistlewood + sông Brightwater + rừng Mossvale (72×52 ô 48px, 220 đồ vật FreePixel, mặt đất sinh bằng code) |
| 6 Combat | ✔ đạn phép, cận chiến, né, MP/stamina/cooldown, chí mạng, 3 phản ứng nguyên tố |
| 7 Monsters | ✔ 5 loại quái + boss (AI phát hiện/đuổi/đánh/bỏ đuổi, đánh xa, vòng báo trước, nổi giận) |
| 8 NPC | ✔ 3 NPC có thoại theo giai đoạn truyện (chưa có lịch sinh hoạt theo giờ) |
| 9 Inventory | ◐ mới có xu + bình hồi phục; túi đồ/trang bị chưa làm |
| 10 Quest | ✔ Chương 0: 4 nhiệm vụ + lời tựa + kết chương, lưu/tải `localStorage` |
| 11 Online | ◐ M1 xong: đăng nhập, tạo nhân vật nam/nữ (thay Lior trong truyện), thấy nhau, chat, lưu trên máy chủ. Kế hoạch: [`docs/online-va-build.md`](docs/online-va-build.md) |
| Kim cương | ◐ K1: ví ở máy chủ + nhật ký, điểm danh mỗi ngày, Bia Danh Vọng (thành tựu), quầy kim cương của Bram bán bình EXP / chiến đấu, icon lịch mở cửa sổ điểm danh. Chưa nạp tiền thật — [`docs/ke-hoach-kim-cuong.md`](docs/ke-hoach-kim-cuong.md) |
| 12–13 | chưa làm (tối ưu asset, mobile) |

**Bắt đầu đọc / làm tiếp (người hay agent): [`docs/the-gioi-aether.md`](docs/the-gioi-aether.md)** — mục Bàn giao (trạng thái, việc
kế tiếp, lệnh chạy / kiểm / triển khai, luật dự án) + danh sách vùng / map / quái / boss / trang bị + ngân sách PixelLab.

Cốt truyện: [`docs/story.md`](docs/story.md). Đội hình nhân vật và lý do loại: [`docs/asset-pipeline.md`](docs/asset-pipeline.md).
Lịch sinh nhân vật Pixler theo quota: [`docs/pixler-plan.md`](docs/pixler-plan.md).

Kiểm thử: `npx tsx apps/web/tests/chapter0.test.ts` (đi hết Chương 0 bằng StoryDirector).
Ở dev, console có `__aether` (`teleport`, `step`, `cast`, `combat`, `story`) để QA không cần chơi tay.
Từ khi có động tác ra đòn: `cast` trả `CastResult` (`started`/`buffered`/`cooldown`/…) và chỉ BẮT ĐẦU đòn khi atlas
có `attack`/`cast` cho hướng đó — đọc `__aether.action()` rồi `step(Math.ceil(releaseAt * 60) + 1)` trước khi đọc `combat()`.
Hướng chưa vẽ động tác (`action()` trả `null`) thì đòn nổ ngay như cũ.

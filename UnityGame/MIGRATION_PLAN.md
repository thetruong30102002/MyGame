# Kế hoạch chuyển Aether sang Unity 2D

Chủ dự án 10/10/2026: "đơn giản muốn chuyển game sang Unity", "bạn làm hết", không cần giữ bản web cho người chơi. Hướng: viết lại
CLIENT bằng C# trong Unity; giữ máy chủ Node (`apps/server`), giao thức (`packages/protocol`), pipeline hình PixelLab
(`packages/asset-pipeline`) — Unity đọc chính các file pipeline xuất ra.

## Kiến trúc

| Lớp | Nơi | Ghi chú |
|---|---|---|
| Core (luật) | `Assets/Aether/Core` | C# thuần, không UnityEngine; chép `packages/sim`, đối chiếu bằng test vector với TS (`dotnet test`) |
| Data | `Assets/Aether/Data` | JSON xuất từ sim + atlas / map / manifest nhập từ `apps/web/public/assets` |
| Editor | `Assets/Aether/Editor` | Importer: atlas nhân vật / hiệu ứng / UI (cắt sprite theo JSON, tâm neo, điểm neo đồ gắn), map JSON → Tilemap + prefab đồ vật |
| Client | `Assets/Aether/Client` | MonoBehaviour: thế giới, nhân vật 8 hướng (tây = lật gương đông), chiến đấu, hiệu ứng, camera pixel-perfect |
| Net | `Assets/Aether/Net` | HTTP (đăng nhập, nhân vật, tiến độ) + WebSocket (cùng tin nhắn `packages/protocol`) |
| UI | `Assets/Aether/UI` | Màn đăng nhập, chọn nhân vật, HUD, thanh kỹ năng, 6 bảng nhân vật, chat, bản đồ, cửa hàng, hội thoại, điều khiển cảm ứng |

## Giai đoạn

| # | Việc | Trạng thái |
|---|---|---|
| 0 | Cài Unity 6.3 LTS (Android, iOS, Windows IL2CPP), khung thư mục, xuất dữ liệu sim → JSON | ✓ Unity 6000.3.26f1 + Android + iOS + Windows IL2CPP (cài ở ổ D) |
| 1 | Chép luật `packages/sim` sang C# + test đối chiếu (tiến trình, tiềm năng, kỹ năng, trang bị, kinh tế, chiến đấu, vùng, tìm đường, cốt truyện) | ✓ đủ 9 nhóm, 84 test đối chiếu qua (`dotnet test`) |
| 2 | Importer atlas + map → đi lại, va chạm, chuyển map, camera trên 12 map vùng 1 | ✓ nhập 22 nhân vật / 12 map / 84 hiệu ứng (0 cảnh báo); bản Windows chạy: đi 78px/s, chạy 150px/s, va chạm Core, lối sang map, làm mờ nhà/cây |
| 3 | Nhân vật 8 hướng + hoạt ảnh + đồ gắn theo điểm neo | ◐ 8 hướng + đứng/đi/chạy + nhịp động tác ActionClock; **cầm vũ khí theo đồ đang mặc** (đứng / đi / trúng đòn / gục / uống bình bản `*sword` / `*staff`, theo thế đòn vừa ra; người khác thấy qua tin `gear`). Còn: đồ gắn theo điểm neo (mũ, áo choàng), bộ trang phục |
| 4 | Chiến đấu (CombatSystem), hiệu ứng, quái AI, boss | ◐ 17 kiểu chiêu, phản ứng nguyên tố, quái AI khớp khung chạm, boss nổ vùng, né, bình, lên cấp; **PvP máy chủ tính trúng**. Còn: bị động cây tiềm năng, phủ phép kiếm, tường chặn, triệu hồi AI, tuyệt kỹ (`Client/Combat/Combat.md`) |
| 5 | Mạng: đăng nhập, WebSocket, người chơi khác, quái dùng chung, chat, bạn bè | ◐ `Aether.Net` xong (HTTP + WebSocket + 58 loại tin, 3 test tích hợp với máy chủ thử 3201); đã có OnlineSession (chuyển về luồng chính), đăng nhập / tạo nhân vật, người chơi khác trượt mượt, gửi vị trí 10 lần/giây, lưu vị trí; còn quái dùng chung, chat, bạn bè |
| 6 | UI đầy đủ + điều khiển cảm ứng | ◐ HUD mới (thẻ nhân vật, mục tiêu, bản đồ nhỏ, thanh chiêu, EXP, thông báo, thoại NPC, nút cảm ứng) — `Client/UI/UI.md`. Cửa sổ nhân vật kiểu game (khung gỗ PixelLab, tab dọc): Nhân vật (nhân vật sống trên vòng phép, 10 ô trang bị, Lực chiến), Túi đồ (mặc / tháo / uống, 24 ô, thẻ chi tiết), Tiềm năng (làn nhánh, cộng điểm thật), Cài đặt (độ phân giải / chế độ màn hình, độ nét điện thoại, khung hình). Còn: chat, bạn bè, cửa hàng, nhiệm vụ |
| 7 | Cốt truyện, nhiệm vụ, NPC, cắt cảnh | ◐ NPC theo điểm hẹn + tuổi, nói câu rảnh. Còn: nhiệm vụ, thoại cốt truyện, cắt cảnh |
| 8 | Build Windows / Android (iOS: xuất Xcode, cần Mac), hiệu năng, kiểm khớp với bản web | |

## Làm nốt rồi xoá bản web (chủ dự án 11/10/2026: "làm nốt đi rồi xoá")

Kiểm kê 11/10/2026: những gì bản web có mà Unity chưa có. Đánh dấu ✓ khi xong. Xoá `apps/web` CHỈ sau khi xong hết A–G. **ĐÃ XOÁ 11/10/2026.**

| # | Việc | Nguồn web | Trạng thái |
|---|---|---|---|
| A1 | Bị động cây tiềm năng (`PassiveEffects`): hồi chiêu, tốc chạy, hút máu, chí mạng, cháy / ướt / lạnh, Tro Tàn, Vỡ Vụn, Mạch Nguồn… | `game/combat/CombatSystem.ts` | ✓ 11/10/2026 (`CombatSystem.Passives.cs`) |
| A2 | Phủ phép kiếm (enchant) + nổ phủ Hoả, lưỡi gió phủ Phong, đóng băng phủ Băng; vệt chém theo hệ | như trên | ✓ luật + lưu `story.enchant`; nút chọn ở bảng Tiềm năng (F1) |
| A3 | Bị động lưu phái: Thế Áp Đảo, Bất Khuất, Phản Đòn (né đúng lúc), Mặt Hồ Phẳng, Đà Lướt, Bóng Mờ, Mắt Bão | như trên | ✓ 11/10/2026 |
| A4 | Thế đỡ / khiên phản đòn, phản đạn | như trên | ✓ 11/10/2026 |
| A5 | Lôi Vũ chọn mục tiêu (ưu tiên quái ướt), khống chế đồng bộ qua mạng (`mobCc`) | như trên | ✓ 11/10/2026 |
| B1 | Chat (kênh thế giới / map / riêng) | `components/ChatBox.tsx` | ✓ 11/10/2026 (`UI/ChatBox.cs`, `GameController.Social.cs`) |
| B2 | Bạn bè (thêm / huỷ / chặn, trực tuyến) | `components/CharacterPanelFriends.tsx` | ✓ 11/10/2026 (tab Bạn bè, phím F) |
| C1 | Cửa hàng (quầy Bram, mua / bán) | `components/ShopPanel.tsx` | ✓ 11/10/2026 (bình kim cương áp vào chiến đấu) |
| C2 | Dịch vụ NPC: thợ rèn, thợ may, thợ cắt tóc | `components/ServiceWindow.tsx`, `game/story/services.ts` | — bản web CHƯA có (chỉ ghi tên dịch vụ của trạm) — không có gì để chép |
| C3 | Cột dịch chuyển giữa các vùng | `components/WaystonePanel.tsx` | ✓ 11/10/2026 |
| C4 | Bia Danh Vọng (mục tiêu + quà kim cương), điểm danh (lịch tháng) | `GloryPanel.tsx`, `CalendarPanel.tsx` | ✓ 11/10/2026 (tab Điểm danh) |
| D1 | Cốt truyện + nhiệm vụ: StoryDirector (tuổi thơ 4 → 16, 12 nhiệm vụ, hội thoại, mốc tuổi) | `game/story/*` (812 dòng) | ✓ 11/10/2026 (`StoryDirector.cs`, `GameController.Story.cs`; AutoTest `-aetherStory` chơi hết chương) |
| D2 | Giao diện truyện: khung thoại, theo dõi nhiệm vụ, chỉ đường tới mục tiêu | `components/StoryUI.tsx`, `game/AutoWalk.ts` | ✓ thoại nhiều câu, thẻ cảnh (`Cinematic`), ô nhiệm vụ; bấm ô = TỰ ĐI (`AutoWalker.cs` + `GameController.AutoWalk.cs`, A* qua `NavGrid`, sang map khác tự đi tiếp; AutoTest `-aetherStory` thử 7 lần đều tới đích) |
| D3 | Băng rôn tên khu khi vào map, bản đồ thế giới (lục địa / vùng / map) | `AreaBanner.tsx`, `WorldMap*.tsx` | ✓ 11/10/2026 (băng rôn có sẵn ở `Hud.Banner`; tab Bản đồ phím M, `Panels.WorldMap.cs`, dữ liệu `@aether/sim/worldAtlas`) |
| E1 | Thư viện (danh mục quái / boss / NPC) | `components/CodexTab.tsx`, `game/codex.ts` | ✓ 11/10/2026 (tab Thư viện phím L, `Panels.Codex.cs`, dữ liệu `@aether/sim/codex`) |
| F1 | Bảng Tiềm năng dạng CÂY (chủ dự án: "sửa cái tiềm năng thành dạng cây tree") | — | ✓ 11/10/2026 (`Panels.Talents.cs`: gốc ở đáy, 6 nhánh, chạc lưu phái Kiếm, khung chi tiết + phủ phép + tẩy điểm; đường nối vẽ bằng uGUI — không thư viện ngoài nào hợp: Unity UI Extensions chỉ có UILineRenderer, không có cây kỹ năng) |
| G1 | Trang quản trị `/admin` (đang là trang Next.js) → cửa sổ Quản trị trong client Unity | `app/admin`, `components/admin` | ✓ 11/10/2026 (`GameController.Admin.cs` + `Panels.Admin.cs`: nút ở tab Cài đặt chỉ hiện khi `/api/admin/me` trả có quyền; tìm nhân vật, cộng / trừ xu · kim cương · bình · EXP · điểm tiềm năng, đặt cấp, lý do bắt buộc, xem trước bằng `ApplyAdminEco`, bấm hai lần mới gửi, nhật ký. AutoTest `-aetherAdmin -aetherUser … -aetherPass …` cộng 100 xu thật trên DB thử) |
| H1 | Dời dữ liệu dùng chung ra khỏi `apps/web`: `public/assets` (pipeline xuất, Unity nhập, máy chủ đọc map), `tempArt.ts`, `story/*`, `codex.ts`, `groundShade.ts`, `worldAtlas.ts`; sửa đường dẫn ở máy chủ, pipeline, `Tools~`, Editor importer | — | ✓ phần DỮ LIỆU 11/10/2026: `story.ts` + `services.ts` → `packages/sim/src/story/`; `groundShade.ts` + `noise.ts` → `packages/asset-pipeline/src/maps/`; `tempArt.ts` + id hiệu ứng (`vfxIds.ts`) → `UnityGame/Tools~/data/`; `codex` / `worldAtlas` → `packages/sim` (từ trước). Web giữ file chuyển tiếp. `public/assets` → `assets/` ở gốc repo cùng H3 (620 file, 90MB; mọi đường dẫn ở máy chủ, pipeline, Unity importer, `Tools~`, test C# đã đổi) |
| H2 | Test web kiểm luật sim → chuyển sang `packages/sim` (giữ lưới an toàn), bỏ test chỉ của client web | `apps/web/tests` | ✓ 11/10/2026: phần LUẬT THUẦN của 7 file (talents, enchant, level, elements, swordstyles, swordtiers69, tiers69) → `packages/sim/tests`, `npm test -w @aether/sim`. 24 file còn lại kiểm client web (CombatSystem + pixi, store React, AutoWalk / StoryDirector web…) — client Unity có bản C# + vector riêng, bỏ cùng bản web |
| H3 | Xoá `apps/web`, sửa `package.json` (dev/build), README, CLAUDE.md, tài liệu bàn giao; hạ link Funnel web (cổng 443 → không còn bản web) | — | ✓ 11/10/2026 (chủ dự án duyệt: xoá + khởi động lại máy chủ thật + commit trước + gỡ route Funnel "/"): commit chốt `8b018231` → sao lưu `aether.db` (`data/backup-20261011-085402`, kiểm toàn vẹn ok) → dời assets → xoá `apps/web` → khởi động lại máy chủ thật :3200 qua `scripts/khoi-dong-ban-that.ps1` (đã bỏ phần bật web :3101) → `package.json` / lockfile / README / CLAUDE.md / tài liệu bàn giao. Route Funnel `/` KHÔNG gỡ được riêng (Tailscale 1.102.2 báo "handler does not exist"; chỉ còn cách `funnel reset` + thêm lại `/game`) — để nguyên, trỏ cổng chết, vô hại |

### H3 — chỗ đã đổi khi dời `apps/web/public/assets` → `assets/` (gốc repo) — XONG 11/10/2026

- `packages/asset-pipeline/src/cli.ts` (`WEB_ASSETS`, biến `AETHER_WEB_ASSETS`), `src/debugMapPreview.ts` (`WEB`), `tests/gear-anchors.test.ts`.
- `apps/server/src/world.ts` (`MAPS_DIR`, biến `AETHER_MAPS`), `apps/server/tests/regions.test.ts`, `tests/worldmaps.test.ts`.
- `UnityGame/Assets/Aether/Editor/PipelineImportMenu.cs` (`SourceDir` mặc định), `UnityGame/Tools~/vectors-world.mts` (`MAPS`).
- `packages/sim/tests/elements.test.ts` (đọc `vfx/vfx.json`).
- `package.json` gốc: bỏ `dev` / `build` (web), giữ `server` + `assets:*`; `.claude/launch.json` (mục `apps/web/scripts/dev-test.mjs`).
- Chú thích nhắc `apps/web/...` trong code C# / pipeline: chỉ là lịch sử nguồn chép, sửa khi chạm file.
- Máy chủ thật (3200) đọc map lúc khởi động → dời xong phải khởi động lại (hỏi chủ dự án + sao lưu DB trước).

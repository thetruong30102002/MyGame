# Hộ vệ Ngân Lam — prototype Unity, 21/10/2026

> **Cập nhật mới nhất:** đã bổ sung ba slot Áo / Quần / Giày độc lập, thêm giáp/đồ với 36 phối, sửa tay che chuôi và la bàn tám hướng trong Thử chiêu. Xem [mannequin-armor.md](mannequin-armor.md). Các mô tả bên dưới lưu trạng thái trước lượt tách đồ; atlas mới là 1.792 cells / bảy trang.

## Phần đã triển khai

Nhân vật mới `aether_warden`, tóc bạc/teal, áo navy và mantle ngà, khác bộ tân thủ đang chơi. Một sheet mới 64 pose, không dùng pixel body của `player_hero_adult`. Giữ hai weapon prototype đã vẽ ở lượt trước: Nguyệt Cương và trượng Aether. Kiếm native v2 10×34, trượng 10×48, PNG riêng; không có body nhân đôi theo vũ khí.

Nguồn sinh bằng công cụ imagegen tích hợp, prompt lưu ở `assets/mannequin/v2/source-art/prompt.txt`. Công cụ trả 1254×1254 dù yêu cầu 2048×2048; layout lưu đúng rect thực, không giả sử chia đều. Cột S, SW, W, NW, N, NE, E, SE. Tỷ lệ 0.48, alpha threshold 220, nearest-neighbor, root chân tường minh từng ô để sửa baseline nguồn. Xem chuẩn trước sản xuất ở [mannequin-v2-standard.md](mannequin-v2-standard.md).

Có 32 sequence / 192 playback frame / 960 cells trên bốn atlas 1792×1792. Idle giữ một pose; walk ba pose trong bốn frame; attack và cast mỗi loại hai pose chính, giữ khung và về idle để đủ tám frame. **Không trình bày các frame giữ lặp là tám pose vẽ khác nhau.** Run dùng walk tăng nhịp theo controller hiện hành. Chưa có hit/death riêng.

Body/outfit và identity được tách bằng mask cố định theo từng pose và tái ghép đúng byte; các mảng luôn dùng cùng đồng hồ, không quay chi rời. Đây là hybrid pose vẽ theo mannequin, chưa phải bộ skeletal rig hoặc bộ hair/torso thay tùy ý. Joint/neck/grip là metadata gợi ý, chưa duyệt thủ công. `anchors.json` cho phép correction theo khóa `row/direction`; pipeline không tự nâng cờ reviewed. F11 hiện neo cyan và joint gợi ý yellow trong Scene view.

## Nối vào Unity

Giữ scene `Assets/Aether/Scenes/Game.unity` và phòng **Thử chiêu** offline. Không dựng scene trùng. Importer v2 tạo `CharacterDef` riêng trong Resources, đủ tám hướng của cả bốn state. Controller tải definition đó khi F6, không cần đăng ký nhân vật thử vào catalog online. Combat vẫn gọi `CombatSystem.Cast` → `ActionClock` → `Release`: sword dùng slash/attack, staff dùng aether_bolt/cast, hitFrame 3, lần lượt 22 và 20 fps. Đổi vũ khí bị chặn trong action; thay vũ khí cập nhật ô đánh chính (chuột trái) và giữ body/outfit.

SortingGroup: body 0, weapon ±1 theo pose, identity 2; khôi phục sorting order khi tháo prototype. PNG nhập nguyên pixel, Point/48 PPU/no mipmap/uncompressed, kể cả Android. Importer kiểm kích thước, root, hướng, duplicate, lớp thiếu trước khi nhập, ghi catalog cuối cùng và giữ GUID khi nhập lại.

Nhân vật online, server/protocol, input, camera và quy tắc damage không bị thay. Các chiêu ngoài bốn state chưa có pose sẽ không có animation riêng trên v2; không đổi về hình người cũ. Không coi đây là nghiệm thu toàn bộ skill của game.

## Chạy

```powershell
npm run test:warden -w @aether/asset-pipeline
./scripts/kiem-mannequin.ps1
```

Unity menu **Aether → Thử mannequin → Nhập nhân vật mới v2**. Vào scene Game, Play, chọn **Thử chiêu**. Bảng **THỬ NHÂN VẬT** luôn hiện dưới minimap: chọn **Ngân Lam mới**, rồi **Kiếm · chém** hoặc **Trượng · niệm**. WASD đi, Shift chạy, chuột trái hoặc nút **Thử đòn đang cầm** để tấn công. Tab chọn mục tiêu. **Nhân vật gốc** khôi phục CharacterDef / ô đánh chính cũ. Chọn lại Ngân Lam khi đang dùng không reset weapon. Nút chọn bị chặn khi đang tấn công.

Bảng dùng uGUI/TMP và raycast cùng HUD, hiện được trong screenshot offscreen, không còn bảng OnGUI bị che bởi chat. F6/F9 vẫn là phím tắt phụ; không bắt buộc biết phím để xem demo. F11 chỉ hiện gizmo trong Scene view.

## Mức tách trang bị hiện có

| Lớp | Đã làm | Giới hạn |
|---|---|---|
| Nhân vật / outfit | Body và đầu+tóc là hai lớp pose riêng, chung root/đồng hồ | Đầu và tóc chưa tách riêng thành hai item; thân/áo/quần/tay/giày đang chung một lớp outfit. |
| Bộ ngoại hình | Catalog + `SelectMannequinOutfit` độc lập với weapon | Mới có một bộ Ngân Lam hoàn chỉnh trong runtime v2; chưa demo thay hai outfit có animation. |
| Vũ khí | Kiếm/trượng PNG và layer riêng, profile slash/cast riêng; nút đổi trực tiếp | Hai loại đang có, chưa có bow/spear hoặc inventory persistence. |
| Thay từng món đồ | Chưa triển khai art/runtime đầy đủ | Cần pose/mask của từng áo/quần/giày ở tám hướng và toàn bộ động tác, cùng quy tắc che khuất. Không coi việc thêm slot dữ liệu là đã làm xong art đa trang bị. |

Build kiểm riêng, không phát hành, không thay exe đang dùng:

```powershell
& 'D:/Unity/Editor/6000.3.26f1/Editor/Unity.exe' -batchmode -nographics -quit -projectPath "$PWD/UnityGame" -executeMethod Aether.Importer.MannequinVerification.BuildBatch -logFile "$PWD/.aether-stage/mannequin/warden-build.log"
& './.aether-stage/mannequin/build/Aether.exe' -noUpdate -aetherShot "$PWD/.aether-stage/mannequin/warden-runtime" -aetherLab -aetherMannequin
```

AutoTest kiểm đi/đứng đủ tám hướng, chạy, ma trận tám hướng × hai weapon × tám frame, chọn bộ không đổi weapon, đổi weapon không đổi bộ, chặn đổi lúc đánh, khôi phục renderer cũ. Combat test riêng gọi Cast thật vào dummy đứng yên, kiểm không hit trước release, sword chạm và staff có projectile rồi chạm; giữ callback gốc và tháo listener/dummy cuối test. Đây là kiểm đòn cơ bản offline, không phải regression mạng/Android/toàn bộ skill.

## File thêm/sửa trong lượt này

- Thêm `packages/asset-pipeline/src/mannequin/warden.ts`, `tests/warden.test.ts`; thêm lệnh và test mặc định trong package.json. Thêm tham số góc authored tùy chọn trong `src/mannequin/art.ts`, không đổi mặc định cũ.
- Thêm `assets/mannequin/v2/`: source sheet/prompt/layout/annotation, catalog/slices/anchor candidates/review, hai PNG weapon, bốn atlas, hai contact sheet.
- Sửa các file đã có sẵn trong working tree: `Client/MannequinView.cs`, `GameController.Mannequin.cs`, `GameController.Lab.cs`, `AutoTest.Mannequin.cs`, `Editor/MannequinImporter.cs`. Thêm `Client/UI/LabCharacterPanel.cs` và `Editor/MannequinVerification.cs` + meta; thêm count read-only internal để kiểm projectile trong `Combat/CombatSystem.cs`.
- Thêm tài liệu này và `docs/mannequin-v2-standard.md`; ghi liên kết trạng thái mới ở tài liệu prototype cũ.
- Importer sinh `Assets/Aether/Imported/Resources/Mannequin` (gitignored, có thể dựng lại). Build/ảnh/log kiểm riêng dưới `.aether-stage/mannequin` (gitignored).

Các thay đổi mannequin, trang web review, art cũ và file gameplay khác đã tồn tại khi bắt đầu lượt này; không xóa hoặc nhận là viết mới trong lượt này.

## Giới hạn mỹ thuật

Tám hướng có nguồn riêng, nhưng góc SW/W và NE/E còn gần nhau. Idle tĩnh; slash/cast cần thêm in-between và follow-through. Grip chỉ được kiểm chạm alpha, chưa chứng nhận đúng bàn tay; joint là hướng dẫn tỉ lệ, chưa phải anatomical annotation từng pose đã duyệt. Cần duyệt contact sheet và screenshot runtime ở native scale trước production. Không có outfit/hair variant, persistence hoặc vũ khí thứ ba.

## Kết quả kiểm

| Kiểm thực tế | Kết quả |
|---|---|
| `npm run test:warden -w @aether/asset-pipeline` | PASS: 192 playback frames, 384 tổ hợp weapon, 960 cells; source hash/pixel đúng, alpha cứng, tám hướng có pose nguồn riêng, không cắt weapon, chân **y=100 cho mọi pose**. |
| `npm test` | PASS sim + pipeline, gồm kiểm Warden mới trong suite mặc định. Fixture map vẫn có cảnh báo props cũ thiếu, không thất bại. |
| `npm run typecheck` | PASS tất cả workspace. |
| `scripts/kiem-mannequin.ps1` | PASS Client + Editor C# qua Roslyn. |
| Unity `MannequinImporter.ImportV2Batch` | PASS, exit 0; bốn PNG Imported giống byte với pipeline; CharacterDef mới có đủ 32 direction sequence. Lần kiểm license đầu trả 198; lần import sau license đã cho phép chạy, không còn blocker này. |
| Unity `MannequinVerification.BuildBatch` | PASS ba lần; build cuối `warden-build-final.log`: **Succeeded, errors=0**, exit 0. Build IL2CPP Windows vào thư mục riêng. Có warning asset weapon cũ sword/staff bị thiếu script; bản thử mới không dùng hai asset đó. |
| Bản Windows `-aetherLab -aetherMannequin` | PASS, exit 0. Đi/đứng tám hướng, chạy, hai weapon × tám hướng × tám frame, chọn bộ/weapon độc lập, chặn đổi giữa action, khôi phục CharacterDef gốc. |
| Combat thật trong AutoTest | PASS sword/attack releaseAt **3/22 ≈ 0.136 s**, một dummy hit. PASS staff/cast releaseAt **3/20 = 0.150 s**, thấy projectile sống rồi một dummy hit. Không hit trước cờ Release; callback damage/projectile của game gốc. Không kiểm số damage hoặc mạng/Android. |
| Xem hình | Đã xem sheet native và ảnh runtime S walk, S sword strike, S staff release, NW sword strike, E staff release. Không thấy blur/split body trên ảnh đã xem. Ảnh đầu bị HUD che vì spawn sát mép trái: sửa điểm test sang ngã tư rồi build/chạy lại. Neo từng pose, toàn bộ che khuất và độ mượt chưa duyệt. |

Build cuối: `.aether-stage/mannequin/build/Aether.exe`. Log: `.aether-stage/mannequin/warden-build-final.log`, `warden-player-final.log`. **148 PNG** + `autotest.log` ở `.aether-stage/mannequin/warden-runtime-final/`; gồm 128 khung action, 16 ảnh idle/walk, 1 run, 2 combat và 1 login. Tất cả file kiểm cục bộ đều gitignored; không publish game hoặc sửa máy chủ thật.

**Kết luận nghiệm thu:** prototype gameplay cơ bản đã build và chạy thật, nhưng **chưa đạt production-ready mỹ thuật**. Cần thêm in-between, duyệt grip/occlusion từng pose, joint annotation thật và hit/death trước mở rộng hoặc phát cho người chơi.

### Cập nhật bảng chọn ngay trong Thử chiêu

Lượt bổ sung UI: `lab-options-build.log` báo **Succeeded, errors=0**, process exit 0; bản Windows mới chạy AutoTest exit 0. AutoTest gọi handler thật của nút Ngân Lam, Kiếm, Trượng, Thử đòn và Nhân vật gốc; kiểm chọn lại nhân vật giữ nguyên weapon và khôi phục hình gốc. Nút Thử đòn đi qua `TapSlot(0)`/focus/input flow gốc, sword và staff đều chạm dummy, staff có projectile. Không giả lập chuột vật lý hoặc chứng nhận raycast trên mọi thiết bị.

Đã xem ảnh `lab-options-runtime/lab-character-staff.png`: bảng hiển thị dưới minimap, nút nhân vật/vũ khí đang chọn sáng, hero nhìn rõ ở giữa map. Có **151 PNG** tại `.aether-stage/mannequin/lab-options-runtime`, log `autotest.log` và `.aether-stage/mannequin/lab-options-player.log`. Exe cập nhật vẫn ở `.aether-stage/mannequin/build/Aether.exe`; không phát hành ra máy chủ thật.

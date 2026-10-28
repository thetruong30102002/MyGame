# Hộ vệ Ngân Lam — prototype Unity, 21/10/2026

> **Bản đang sửa hiện hành:** [mannequin-v3-delivery.md](mannequin-v3-delivery.md). Các ghi chú v2 bên dưới là lịch sử; v3 thay cơ thể tô/biến dạng và giáp dán bằng các pose vẽ cùng mask che thân, thêm bộ chạy riêng và nhịp chém theo nhân vật gốc.

> **Bản hiện hành 22/10/2026:** Model nam nền được vẽ lại bằng imagegen với ngực trần và quần đùi; ảnh nguồn và bản chuẩn hóa 8×112 px nằm trong `assets/mannequin/v2/source-art/`. Pipeline tạo lớp nền riêng cho từng pose, rồi ghép đúng một áo/giáp, một quần, một đôi giày theo ô trang bị. Tất cả lớp dùng khung 112×112, pivot (56,100), 48 PPU; mặt/tóc có sorting order 6, trên áo/giáp. Chém 16 khung ở 16 fps, hit frame 9. Những mục bên dưới ghi lịch sử prototype cũ, không mô tả trạng thái hiện hành.

> **Cập nhật 22/10/2026:** Ngân Lam có bốn pose đi bộ, bốn pose chém và bốn pose niệm riêng ở mỗi hướng. Timeline đi bộ 8 khung tại 12 fps; chém và niệm 8 khung tại 16 fps, release frame 4. Kiếm dài 40 px, chuôi bám neo tay từng pose và góc kiếm đổi qua từng pha. Atlas hiện có 2.472 cells / 10 trang; những số liệu cũ bên dưới là lịch sử của bản trước.

Kiểm mới: `npm run test:warden -w @aether/asset-pipeline` và `npm run typecheck -w @aether/asset-pipeline` đều qua. Unity batch build `motion-build-carried-sword.log` báo Succeeded, errors=0. Bản Windows `.aether-stage/mannequin/build/Aether.exe` chạy AutoTest thành công với 371 ảnh ở `.aether-stage/mannequin/carried-sword-runtime`: có bốn ảnh liên tiếp khi cầm kiếm đi ở từng hướng; kiếm chạm dummy một lần và trượng tạo projectile rồi chạm. Ảnh nguồn và mô tả prompt ở `assets/mannequin/v2/source-art/`.

Lượt chỉnh tay cầm: sửa ba neo ở hướng SW/NW từng bám nhầm vào vải áo; cả kiếm và trượng dùng cùng vị trí bàn tay ở từng pose đi bộ. Trượng nghiêng theo bốn pha bước chân. Kiểm mới nhất `motion-build-both-grips.log` Succeeded/errors=0; AutoTest `both-grips-runtime` exit 0, 419 ảnh gồm bốn ảnh bước chân cho mỗi vũ khí và mỗi hướng, sword/staff combat đều PASS.

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

### 22/10/2026 — kho đồ, lớp đồ lót và nhịp chuyển động

- Áo (4), quần (3), giày (3), kiếm và trượng (2) là 12 item thật trong luật trang bị, có icon 48×48. Bộ thử được cấp một lần khi chọn Ngân Lam; mặc/tháo trong tab Nhân vật (phím B) lưu cùng `story.gear`. Bảng Thử chiêu chọn chính các món trong túi. Kiếm/trượng của Ngân Lam luôn dùng ô tay chính.
- Hình trên bản đồ và hình xem trong tab Nhân vật lấy từ ô đang mặc. Tháo áo sẽ ẩn lớp áo ngoài và hiện thân nền có áo lót, quần lót cùng tay/chân; giáp là hình riêng của slot áo, không chứa lại áo xanh/đỏ. Bảng Thử chiêu tự ẩn khi mở cửa sổ kho.
- Bộ pose đi/chém/chưởng được chuẩn lại về tỷ lệ idle với chân neo quanh y=100. Chém và chưởng có 16 khung ở 12 fps (4 pose động tác nguồn, 10 khung chuyển tiếp được nội suy từ các pose và 2 khung đầu/cuối); đòn phát ở khung 9, 0,75 giây. Bộ thử không ép nhanh animation theo hồi chiêu ngắn.
- `npm run test:warden -w @aether/asset-pipeline` kiểm 352 frame, 704 kết hợp vũ khí, 12.672 kết hợp đồ, icon, tỷ lệ, alpha, neo tay, lớp đồ lót và giáp không mang lại pixel áo xanh. `npm test -w @aether/sim` và typecheck pipeline đã qua. Khung chuyển tiếp là nội suy pixel, vẫn cần duyệt từng khung để quyết định chất lượng mỹ thuật cuối.
- Unity build cục bộ và AutoTest ở `.aether-stage/mannequin/`: lần kiểm runtime trước phần ẩn bảng đã qua với kiếm/trượng trúng dummy ở 0,75 giây, mặc/tháo đồ và hình từ kho đồng bộ. Không phát hành bản đang chạy qua Tailscale trong lượt này.

### 22/10/2026 — tay nắm vũ khí và cung chém

- Neo kiếm/trượng được đưa vào lòng bàn tay của mỗi pose; lớp ngón tay vẽ đè lên cán. Chuôi kiếm rộng và sáng hơn để nối rõ từ chắn kiếm vào nắm tay khi đi, đứng và chiến đấu. Trượng và kiếm dùng cùng điểm nắm trong các pose chuyển động.
- Kiếm chém theo một cung liên tục 8 hướng: lấy đà phía sau đầu, quét cong qua trên đầu và hạ ra trước ở khung trúng đòn. Vệt xanh theo đường đầu kiếm ở khung 4–10, biến mất ngay khi thu đòn; vệt được giữ trong ranh giới atlas. Nhịp giữ 16 khung, 12 fps và hit ở khung 9.
- `npm run test:warden -w @aether/asset-pipeline` PASS: 352 khung, 704 tổ hợp cầm vũ khí, 8 hướng có cung chém liên tục và vệt đúng nhịp, chuôi/tay chồng pixel tại neo. Typecheck PASS. Unity `grip-sweep-verified-build.log` báo `Succeeded; errors=0`.
- Windows AutoTest tại `.aether-stage/mannequin/grip-sweep-runtime/` exit 0: 36 tổ hợp trang bị, 9.216 khung đi/chém/chưởng kiểm lớp tay và vệt chém; kiếm/trượng đều đánh trúng dummy, trượng tạo đạn ở 0,75 giây. Ảnh thực tế: `mannequin-0-0-0-S-9.png`. Đây vẫn là bản thử cục bộ, cần duyệt mỹ thuật từng hướng trước phát hành.

### 22/10/2026 — model nam nền và chuẩn ghép đồ

- Imagegen tạo nguồn nam 8 hướng chỉ mặc quần đùi: `source-art/warden-male-base-ai-raw.png`. Script `packages/asset-pipeline/scripts/normalize-male-base.py` đưa về đúng 8 ô 112×112, đầu ở trên, chân tại y=100; bản dùng trong pipeline là `warden-male-base-ai-112.png`. Pipeline giữ đầu/tóc cũ để mặt nhất quán và dùng cơ thể mới làm lớp nền riêng cho từng pose. Với các pose đi/chiến đấu, tay/chân được chỉnh theo neo bàn tay và silhouette của pose đó, không giữ nguyên ảnh đứng yên.
- Một nhân vật đang mặc chỉ có một lớp áo hoặc giáp, một lớp quần, một lớp giày. Áo/giáp bạc và da không sao chép lại màu áo xanh/đỏ. Lớp nền cắt trong silhouette nguồn để da không nhô ra cạnh áo/ủng. Khi tháo áo, ngực trần và quần đùi hiện ra. Quy chuẩn cho model nữ khi được thêm sau này: lớp nền mặc áo và quần; chưa có sprite nữ trong catalog hiện hành.
- Mọi sprite nền và trang bị dùng khung 112×112, pivot Unity (56,12) tương ứng mốc chân ảnh (56,100), 48 PPU. Đầu/tóc vẽ ở sorting order 6, trên lớp áo/giáp (order 3), tránh cổ áo che mất mặt. Importer xóa trang atlas cũ vượt số trang hiện tại, tránh nạp trùng sprite khi thay nguồn art.
- `npm run test:warden -w @aether/asset-pipeline` và typecheck PASS. Unity batch `male-base-build-2.log`: Succeeded/errors=0. Windows AutoTest `male-base-runtime` exit 0, 550 ảnh: 36 tổ hợp đồ, 9.216 khung kiểm các SpriteRenderer riêng và kích thước/pivot/PPU của từng món; kiếm release ở 0,563 giây, trượng 0,750 giây, cả hai trúng dummy. Xem `mannequin-underwear.png` cho model nền và `clothing-1-0-S-strike.png` cho đồ khi chém. Đây là build thử cục bộ.

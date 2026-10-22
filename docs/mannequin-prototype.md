# Mannequin trong phòng Thử chiêu — 20/10/2026

> **Lượt tiếp 21/10/2026:** bộ nhân vật mới Hộ vệ Ngân Lam và pipeline v2 ở [mannequin-v2-delivery.md](mannequin-v2-delivery.md). Nội dung bên dưới là ghi nhận lịch sử bản cũ, không thay cho trạng thái v2.

**Trạng thái: bản thử CHƯA đạt milestone nghiệm thu.** Lượt ghép bộ Dạ Ngân bằng hình học bị loại sau khi xem ảnh native. Catalog hiện chỉ cho chọn bộ starter; F8 bị vô hiệu cho đến khi bộ mới có đủ pose. Unity Editor không có license hợp lệ nên chưa nhập, build hoặc chạy bản mới. Neo tay tự động, ranh đầu và mỹ thuật các hướng chưa duyệt. Không bật trong game online, không phát bản cho người chơi.

Lượt mỹ thuật mới: `assets/mannequin/source-art` có hai thiết kế nhân vật toàn thân, hai sheet bốn hướng đứng, hai kiểu tóc bạc, kiếm Nguyệt Cương và trượng Aether. `assets/mannequin/rework` có tám sprite đứng 112×112 alpha cứng của Dạ Ngân và ảnh xem native phóng 4 lần. `assets/mannequin/parts` có bốn PNG item tách riêng. Các sprite Dạ Ngân mới là **mẫu đứng để duyệt**, chưa phải Outfit trong game: còn thiếu hướng chéo, chuyển động và pose kiếm/trượng phù hợp. Không dùng hình học vẽ đè của lượt trước.

**Sửa quy trình modular sau khi xem lỗi cắt hình nguyên khối:** `assets/mannequin/modular/source-art` chứa các tranh vẽ **riêng từ đầu**: mặt nền không tóc, tóc nâu/tóc bạc, áo trên và quần/ủng/tà áo của Dạ Ngân và Ranger cho mỗi nhân vật. `modular-demo.ts` đặt từng mảng trên cùng canvas 112×112, root (56,100), rồi ghép theo thứ tự lower → upper → face → hair; Outfit ID chỉ trỏ tới cặp upper/lower và vũ khí ở nhóm riêng. `assets/mannequin/modular/native/assembly-preview-4x.png` cho thấy Nam/Nữ × hai Outfit × hai tóc. Bốn ảnh vũ khí đứng riêng ở `weapon-preview-4x.png`. Đây vẫn chỉ là **mẫu tĩnh hướng S để duyệt art**, chưa nối vào renderer Unity hoặc khẳng định đã hòa trộn khi chạy animation.

**Bản demo web 224×224:** `modular-demo-hires.ts` lấy lại chi tiết từ các tranh mảng nguồn, dùng bốn tranh tóc v2 tách rời và cắt phần tóc che vùng mắt theo alpha của lớp mặt chuẩn. Đầu ra ở `assets/mannequin/modular/native-224/`; trang `sites/mannequin-lab/dist/` ghép mảng PNG tại chỗ, cho đổi Nam/Nữ, hai bộ đồ, hai tóc, kiếm/trượng, xem/tắt từng lớp và xuất PNG nền trong. Bản riêng tư: https://aether-mannequin-lab.happyhill7.chatgpt.site . Đây vẫn chỉ là art review pose đứng hướng S, chưa đưa sprite 224 px vào Unity.

## A. Kiểm tra repository thực tế

Checkout `MyGame` có remote `https://github.com/thetruong30102002/MyGame.git`, trạng thái ban đầu sạch. Đọc `CLAUDE.md`, phần Bàn giao trong `docs/the-gioi-aether.md`, `README.md`, `UnityGame/README_UNITY.md`. Yêu cầu mới thay chủ trương vũ khí vẽ liền thân / bỏ ghép mảnh ghi trong bàn giao cũ; không sửa các tài liệu sinh tự động đó.

| Phần đã xác minh | Vị trí / quy ước |
|---|---|
| Unity | `UnityGame/ProjectSettings/ProjectVersion.txt`: **6000.3.26f1**. Renderer dùng SpriteRenderer; GraphicsSettings không gán SRP. |
| Scene | `UnityGame/Assets/Aether/Scenes/Game.unity`; phòng Thử chiêu là **chế độ offline trong GameController**, không phải một scene CombatTest riêng. |
| Nhân vật | `Client/Actor.cs`, `Client/CharacterView.cs`, `Data/Runtime/CharacterDef.cs`. Một đồng hồ phase cho nền; action nhận SeekAction từ combat. |
| Hình người lớn | `assets/manifest.json`: `player_hero_adult` nam / `_f` nữ, ô **112×112**, anchor **(0.5,100/112)**, pivot Unity **(0.5,12/112)**, PPU **48**; bodyHeight 75 / 72. Không scale cơ thể. |
| Hướng | `Dir8.cs`: S, SW, W, NW, N, NE, E, SE. Đi/đứng đủ tám hướng; đòn hiện tại có S/W/N/E, hướng chéo chọn hướng kề ≤45°. Giữ quy tắc này. |
| Nhịp | Idle 6 fps; walk 10 fps; attack 8 khung, 22 fps, hit 3; cast 8 khung, 20 fps, hit mặc định 3. `ActionClock` co nhịp theo cooldown. |
| Atlas / nhập | `Editor/CharacterImporter.cs`, `SpriteSheetImport.cs`: atlas JSON mô tả rect riêng, không dò connected components; Point, không mipmap, pivot chân. Importer cũ nén ASTC atlas lớn trên Android. |
| Neo sẵn có | `GearAnchors`, `DirFrames.gear`: top/head/back/handL/handR trong tọa độ khung gốc trái-trên. Có công cụ `src/atlas/gearAnchors.ts` / test gear-anchors, nhưng đây là ước lượng, không phải bộ pose đã duyệt cho archive unarmed. |
| Vũ khí hiện hành | `HeldWeapons.cs`, `GameController.Gear.cs`: kiếm/trượng đang **vẽ liền thân** ở nhiều action. Không dùng những ảnh này làm body cho lát cắt mới. |
| Combat | `Combat/CombatSystem.Player.cs`: Cast → MoveOf → ActionTimingFor → PlayAction external; UpdateAction gọi SeekAction và Release tại mốc hit. Release sở hữu damage / projectile. Mạng vẫn dùng code cũ; prototype không sửa protocol hoặc server. |
| Phòng thử | `GameController.Lab.cs`: miễn tài khoản, không lưu, cấp 60, mọi nhánh, MP/HP đầy, xoá cooldown. AutoTest đã có `-aetherLab`, `-aetherRig`. |
| Rig cũ | `RigThu.cs`, `src/rig-thu/rig.ts`: cắt một idle S, quay mảnh, kiếm rời, ba bộ màu, tự diễn đứng/đi/chém. Đã tắt mặc định vì chất lượng; không thay thế nó bằng một controller thứ hai. |
| Art tái sử dụng | `sources/pixellab/player_hero_v2_{m,f}/Idle/animations`: attack-hand[2], cast-hand không cầm vũ khí. Nam canvas nguồn 108; nữ 104. Hình thật đã xem trước khi tạo asset. |

Khoảng trống: không có Outfit item / renderer dùng chung cho đồ đầy đủ, không có bộ joint unarmed được duyệt, archive có lỗi hướng và VFX trắng dính ở một số khung nữ. Không có runtime đạt nghiệm thu mới.

## B–D. Phương án và phần đã viết

Chọn **mannequin theo từng khung vẽ**, không deform/rotate tay chân. Template `adult-112-authored-v1` quy định root chân (56,100), frame/action/direction, neck và grip theo pose. Root lấy từ manifest thật. Neck tái dùng phép quét alpha của `computeGearAnchors`; grip gợi ý từ pixel màu da, thiếu thì dùng phép quét alpha sẵn có. Neck/grip hiện là **ứng viên**; `anchorsReviewed=false` cho mọi pose. Không trình bày các ứng viên này như tọa độ khớp đã đo và duyệt. File `src/mannequin/anchors.json` dành cho annotation thủ công theo khóa `player_hero_adult/attack_S_0`, gồm `neck`, `grip` (mảng [x,y]), `weaponOrder` và `reviewed`; hiện trống. Không đánh dấu reviewed trước kiểm hình.

Một `CharacterView` vẫn điều khiển cả pose; `MannequinView` chỉ ghép lớp khi Apply cùng frame, không có đồng hồ Update riêng cho action. `SortingGroup` giữ lớp nhân vật đi cùng nhau; vũ khí trước/sau theo metadata, đầu trước thân. Không có phép quay/scale SpriteRenderer. Mỗi layer giữ canvas 112, chung pivot chân, vị trí pixel nguyên.

Mỗi pose trong atlas thử hiện có năm lớp: identity gốc, đầu tóc bạc thử, thân bộ starter, kiếm Nguyệt Cương, trượng Aether. Identity/body của starter tái ghép **khớp byte** với nguồn; tay/thân/chân vẫn là một khối pose vẽ tay để tránh khe hở. Đây chưa phải một rig đầy đủ vai/khuỷu/gối. Tóc đuôi dài nữ được chuyển từ body sang identity bằng mask màu/vị trí, nhưng mask tự động vẫn cần sửa tay ở các hướng khó.

Catalog tạm còn **một Outfit ID** `starter` và hai Weapon ID `sword`, `staff`; không có Outfit×Weapon item. Bộ Dạ Ngân mới có silhouette/chi tiết riêng ở bốn hướng đứng cho nam và nữ, nhưng chưa được đưa vào catalog cho tới khi có các pose còn thiếu. Hai identity trong runtime vẫn kế thừa nguồn cũ, chưa có identity mới đầy đủ animation.

Weapon profile trong catalog: sword → `attack` / skill `slash`, 22 fps, hit 3; staff → `cast` / skill `aether_bolt`, 20 fps, hit 3. Hai action có body frames khác nhau lấy từ archive unarmed. Tranh kiếm/trượng và tóc bạc nam/nữ được vẽ mới thành PNG độc lập, rồi lấy mẫu nearest-neighbor sang lưới native alpha cứng; file item native ở `assets/mannequin/parts`. Vũ khí có sprite riêng cho mỗi pose, xoay bitmap quanh điểm nắm ứng viên trong pipeline; không dùng icon kho đồ co lại hoặc SpriteRenderer tự quay lúc chạy. Đầu tóc bạc có hình cắt mới, không chỉ đổi màu tóc cũ.

Đứng/đi lấy pixel từ atlas hiện hành, đủ tám hướng. Đòn lấy ba hướng nguồn S/E/N, W lật E; fallback chéo theo quy tắc gốc. Canvas nhỏ được đệm, dùng **một offset cố định cho cả chuỗi**, không căn hộp bao từng khung. Có provenance nguồn và SHA-256 ảnh gốc từng pose.

F9 thay vũ khí và gán đòn cơ bản đó vào ô J; không thay Outfit. F8 hiện bị vô hiệu khi catalog chỉ có một bộ. F7 đổi nhân vật, giữ hai lựa chọn. Đổi trong lúc action bị chặn để giữ nhịp. Combat vẫn gọi Release gốc; renderer không gây sát thương. Các skill/action chưa có pose modular quay lại renderer gốc và hiện trạng thái rõ. Vì vậy **chưa bảo đảm weapon rời ở mọi skill**. Không có bow/spear/greatsword/shield profile, headgear hay inventory persistence mới.

## E–F. Kiểm tra đã chạy

| Lệnh / việc | Kết quả thực tế |
|---|---|
| `npx tsx packages/asset-pipeline/src/mannequin/build.ts` | PASS: 2 identity, 24 sequence/identity, 160 pose/identity, 8 atlas PNG 1792×1792, 1.920 sprite cells. |
| `npx tsx packages/asset-pipeline/tests/mannequin.test.ts` | PASS dữ liệu: 320 pose starter tái ghép khớp hash gốc; 640 tổ hợp lớp pose×Outfit×Weapon hiện hoạt; tóc mới có silhouette/alpha cứng; source tồn tại, metadata pixel nguyên, action nhiều pose. **Không kiểm nghiệm contact tay hoặc damage.** |
| `npm run test:modular -w @aether/asset-pipeline` | PASS art data tĩnh: tám tổ hợp Nam/Nữ × hai Outfit × hai tóc được ghép lại từ đúng các mảng độc lập, alpha cứng và mỗi tổ hợp là một vùng pixel liền; bốn ảnh có kiếm/trượng cũng liền alpha. **Không chứng nhận neo tay bằng mắt hoặc animation.** |
| `npm run test:modular:hires -w @aether/asset-pipeline` | PASS tám tổ hợp 224×224 tái ghép chính xác, alpha cứng, một vùng pixel liền. Đã xem trực quan tóc bạc nam/nữ và trang web triển khai. |
| `npm run typecheck` | PASS toàn bộ workspace server / pipeline / protocol / sim. |
| `npm test` | PASS sim + pipeline hiện có; tests map in cảnh báo thiếu props trong fixture, không thất bại. Test mannequin mới chạy riêng qua lệnh trên. |
| `scripts/kiem-mannequin.ps1` | PASS Client + Editor C# 9 bằng Roslyn của Unity, tham chiếu DLL Unity và Library hiện có; đầu ra trong `.aether-stage`, không thay DLL của game. Đây không phải Unity import/build. |
| `dotnet build UnityGame/Tests~/EditorCompile --no-restore` | BLOCKED: máy không cài .NET SDK. Đã dùng Roslyn trên để kiểm compile. Không chạy được dotnet edit/core tests. |
| Unity batch `Aether.Importer.MannequinImporter.ImportBatch` | BLOCKED **trước khi import/compile**: `No valid Unity Editor license found`, log ghi return code 198. PowerShell launcher trả về trước tiến trình Unity nên exit code launcher không được tính là PASS. |
| Xem ảnh `matrix.png`, `directions-preview.png` | Đã xem. **FAIL visual acceptance**: mặt đổi hướng giữa action ngang của archive (thấy cả nam/nữ), pose tay chưa đúng nhiều grip, VFX trắng còn ở nguồn nữ, che khuất chưa duyệt, ranh đầu/tóc chưa chuẩn. Không có màn hình runtime mới. |

Preview / log cục bộ (tạo lại bằng test dữ liệu): `.aether-stage/mannequin/matrix.png`, `directions-preview.png`, `hair-preview.png`, `validation.json`, `import.log`. Ma trận runtime hiện chỉ starter+sword/staff. Ảnh Dạ Ngân mới ở `assets/mannequin/rework/turnaround-native-4x.png`; chưa nối vào runtime.

**Chưa chạy**: Unity import thực, Play Mode, build Windows/Android, `-aetherMannequin`, damage/hit-stop/projectile checks, camera/input regression, kiểm pixel native trong Unity. Site review đã được triển khai riêng; không phải build game.

## Chạy lại khi Unity có license

Từ gốc repository:

```powershell
npm run mannequin -w @aether/asset-pipeline
npm run test:mannequin -w @aether/asset-pipeline
./scripts/kiem-mannequin.ps1
```

Mở Unity, menu **Aether → Thử mannequin → Nhập pose từ pipeline**. Importer chép từ `assets/mannequin` sang `Assets/Aether/Imported/Resources/Mannequin`, cắt theo rect đã khai, Point/48 PPU/no mipmaps/uncompressed kể cả Android cho lát cắt này. Dùng helper đóng dấu hiện hành; bit màu xanh lam có thể lệch ±1 như asset khác. Giữ GUID khi nhập lại; không sửa source character atlas hay scene hiện hành.

Vào **Thử chiêu** từ login, F6 bật prototype; F7 nam/nữ, F8 đang khóa chờ Outfit mới, F9 sword/staff, F10 đổi sang **kiểu tóc bạc thử**, F11 bật gizmo root/neck/grip trong Scene view. WASD/Shift và camera vẫn qua controller cũ; J/chuột trái dùng đòn của weapon. F6 trả lại CharacterDef gốc / ô J gốc / renderer gốc. Bảng thử chỉ hiện khi đã bật; chuột trên bảng không truyền thành đòn đánh.

Sau khi import và tự build bản mới theo `README_UNITY.md`, dùng:

```powershell
# Chạy trên bản vừa build; bản exe hiện có chưa chứa code này.
./UnityGame/Build/Windows/Aether.exe -noUpdate -aetherShot .aether-stage/mannequin/runtime -aetherLab -aetherMannequin
```

AutoTest thêm sẽ chụp 2 identity × 1 Outfit × 2 weapon × 8 hướng × 8 khung = **256 ảnh** khi Unity chạy được; kiểm selector giữ ID và khôi phục renderer, ghi rõ neo chưa duyệt. Nó tua action để kiểm hiển thị, **không kiểm damage**. Cần kiểm thêm qua combat thật: J đánh Ông Rơm, slash hit tại frame 3, aether_bolt sinh đạn tại frame 3; xác nhận HP/MP/input/camera/hit-stop và từng combo theo yêu cầu.

## Việc bắt buộc còn lại trước nghiệm thu / mở rộng

1. Bật license Editor hợp lệ để nhập và kiểm runtime; không tìm cách lách license.
2. Vẽ/sửa pose slash đúng hướng thay archive quay về camera. Giữ bốn hướng attack và fallback hiện có; không bỏ hướng lỗi để coi là đạt.
3. Duyệt thủ công neck, grip và depth **mỗi frame/direction/identity** bằng overlay; thêm mask tay che chuôi và correction frames. Không nâng cờ `anchorsReviewed` trước khi đối chiếu hình.
4. Vẽ các frame đi, hướng chéo, slash/cast cho bộ Dạ Ngân từ turnaround mới; tách/lắp đầu, tóc, outfit mà không để lộ khe. Khi đủ mới mở lại F8. Đồng thời tách VFX trắng khỏi source nữ và sửa mask tóc.
5. Đưa asset đã duyệt qua kiểm nhập / 256 ảnh hiện tại, rồi ma trận hai Outfit khi Dạ Ngân hoàn chỉnh; test damage và projectile thật.

## Danh sách file thay đổi

Sửa: `UnityGame/Assets/Aether/Client/AutoTest.cs`, `CharacterView.cs`, `GameController.cs`, `GameController.Gear.cs`, `GameController.Lab.cs`, `Combat/CombatSystem.Player.cs`; `packages/asset-pipeline/package.json`.

Thêm C# (mỗi file kèm `.meta`):

- `UnityGame/Assets/Aether/Client/AutoTest.Mannequin.cs`
- `UnityGame/Assets/Aether/Client/GameController.Mannequin.cs`
- `UnityGame/Assets/Aether/Client/MannequinView.cs`
- `UnityGame/Assets/Aether/Editor/MannequinImporter.cs`

Thêm nguồn / kiểm / hướng dẫn: `packages/asset-pipeline/src/mannequin/build.ts`, `art.ts`, `turnaround.ts`, `modular-demo.ts`, `modular-demo-hires.ts`, `anchors.json`, `packages/asset-pipeline/tests/mannequin.test.ts`, `modular-demo.test.ts`, `modular-demo-hires.test.ts`, `scripts/kiem-mannequin.ps1`, `docs/mannequin-prototype.md`.

Thêm đầu ra pipeline:

- `assets/mannequin/catalog.json`, `review.txt`
- `assets/mannequin/player_hero_adult-slices.json`, `player_hero_adult_f-slices.json`
- `assets/mannequin/player_hero_adult-0.png`, `player_hero_adult-1.png`, `player_hero_adult-2.png`, `player_hero_adult-3.png`
- `assets/mannequin/player_hero_adult_f-0.png`, `player_hero_adult_f-1.png`, `player_hero_adult_f-2.png`, `player_hero_adult_f-3.png`
- `assets/mannequin/source-art/`: tám tranh nguồn, gồm hai sheet nhân vật bốn hướng
- `assets/mannequin/parts/`: bốn sprite item native tách rời
- `assets/mannequin/rework/`: tám sprite đứng 112×112 và ảnh xem phóng 4 lần
- `assets/mannequin/modular/source-art/`: tranh từng phần vẽ độc lập cho hai nhân vật
- `assets/mannequin/modular/native/`: các mảng 112×112, manifest, tám tổ hợp và ảnh xem
- `assets/mannequin/modular/native-224/`: các mảng 224×224 cho bản web, manifest, tám tổ hợp và ảnh xem
- `sites/mannequin-lab/`: mã trang demo ghép lớp và Site manifest

Không tạo file Imported/Mannequin vì Unity chưa nhập được. Preview, response file, DLL kiểm compile và log dưới `.aether-stage/mannequin` là output cục bộ đã bị gitignore.

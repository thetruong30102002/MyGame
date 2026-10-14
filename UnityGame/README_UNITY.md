# Aether — bản Unity 2D

Client DUY NHẤT của game (bản web cũ apps/web — Next.js + PixiJS — đã chép đủ sang đây rồi xoá 11/10/2026). Máy chủ Node (apps/server), giao thức (packages/protocol) và
pipeline hình PixelLab (packages/asset-pipeline) GIỮ NGUYÊN — Unity là client mới nói chuyện với cùng máy chủ.

## Phiên bản

- Unity **6000.3.26f1** (Unity 6.3 LTS), cài ở **`D:\Unity\Editor`** (ổ C gần đầy — lần cài vào C hỏng giữa chừng) — module
  Android (SDK/NDK/JDK), iOS, Windows IL2CPP. Unity Hub đã đặt nơi cài mặc định = `D:\Unity\Editor`.
- iOS: Unity trên Windows chỉ XUẤT project Xcode (menu Aether → Build iOS, hoặc `-executeMethod Aether.Importer.GameSetup.BuildIosBatch`
  → `Build/iOS`); biên dịch + ký + cài lên iPhone cần máy Mac có Xcode. Đám mây: GitHub Actions `.github/workflows/build-ios.yml`
  (chạy tay hoặc đẩy tag `ios-*`): Ubuntu nhập `assets/` + xuất Xcode (`BuildIosCiBatch`) → macOS Archive ra `.ipa` gắn vào Release.
  Cần secrets `UNITY_LICENSE` / `UNITY_EMAIL` / `UNITY_PASSWORD`; có thêm `IOS_CERT_P12_BASE64`, `IOS_CERT_PASSWORD`,
  `IOS_PROVISION_PROFILE_BASE64`, `IOS_TEAM_ID` (+ tuỳ chọn `IOS_EXPORT_METHOD`) thì ký, không thì ra `Aether-unsigned.ipa` (cài bằng sideload).

## Cấu trúc

| Thư mục | Nội dung |
|---|---|
| `Assets/Aether/Core/` | Luật game C# THUẦN (không phụ thuộc UnityEngine — asmdef `noEngineReferences`), chép từ `packages/sim` |
| `Assets/Aether/Data/Sim/` | Dữ liệu tĩnh xuất từ `packages/sim` (JSON) — KHÔNG sửa tay |
| `Assets/Aether/Net/` | Lớp mạng C# thuần (asmdef `Aether.Net`): giao thức chép từ `packages/protocol`, `ApiClient` (REST), `GameSocket` (WebSocket, tự nối lại) — sự kiện chạy luồng nền, Unity tự đẩy về main thread |
| `Assets/Aether/Data/Runtime/` | Kiểu dữ liệu Unity (CharacterDef, MapDef, VfxDef, GameDatabase…) + `GroundShader` (vẽ mặt đất khớp từng byte bản TS) |
| `Assets/Aether/Editor/` | Importer (`PipelineImportMenu`) + dựng scene / build (`GameSetup`) |
| `Assets/Aether/Client/` | Phần chơi: `GameController` (vòng lặp, đi lại, đổi map), `CharacterView`, `PixelCamera`, `GameInput` (phím + cần cảm ứng), `OnlineSession` + `RemotePlayers` (mạng), `LoginScreen`, `AutoTest` |
| `Assets/Aether/Imported/` | SINH RA bởi Importer (xoá đi rồi nhập lại là dựng lại từ đầu) |
| `Build/` | Bản build (`Windows/Aether.exe`, `Android/Aether.apk`) — không đưa lên git |
| `Tools~/` | Script Node xuất dữ liệu + test vector (Unity bỏ qua thư mục có `~`) |
| `Tests~/` | Biên dịch `Assets/Aether/Core` ngoài Unity bằng dotnet + test đối chiếu với bản TypeScript |

## Lệnh

```bash
npx tsx UnityGame/Tools~/export-sim-data.mts        # sim → Assets/Aether/Data/Sim/*.json
npx tsx UnityGame/Tools~/export-test-vectors.mts    # bộ số mẫu từ hàm TS → Tests~/vectors
npx tsx UnityGame/Tools~/vectors-protocol.mts       # vector giao thức (kiểm tên, clean*, mẫu mọi loại tin) → Tests~/vectors/protocol.json
dotnet test UnityGame/Tests~/Aether.Core.Tests      # luật C# phải ra số y hệt TS (+ test tích hợp nếu máy chủ thử cổng 3201 đang chạy)
dotnet test UnityGame/Tests~/Aether.Core.Tests --filter TestCategory=Integration   # chỉ test mạng thật (máy chủ thử, data/test.db)
```

## Unity: nhập dữ liệu, dựng scene, build

Trong Editor: menu **Aether → Nhập dữ liệu từ pipeline** (đọc `assets/` ở gốc repo — đầu ra pipeline), **Aether → Dựng GameDatabase + scene chơi**,
**Aether → Build Windows / Build Android (APK)**. Dòng lệnh (không mở giao diện):

```bash
U="/d/Unity/Editor/6000.3.26f1/Editor/Unity.exe"
"$U" -batchmode -nographics -quit -projectPath "D:\nttrg\pixel\UnityGame" -executeMethod Aether.Importer.PipelineImportMenu.ImportAllBatch -logFile import.log
"$U" -batchmode -nographics -quit -projectPath "D:\nttrg\pixel\UnityGame" -executeMethod Aether.Importer.GameSetup.BuildWindowsBatch -logFile win.log
"$U" -batchmode -nographics -quit -projectPath "D:\nttrg\pixel\UnityGame" -buildTarget Android -executeMethod Aether.Importer.GameSetup.BuildAndroidBatch -logFile android.log
dotnet build UnityGame/Tests~/EditorCompile          # kiểm biên dịch mọi asmdef với DLL Unity thật, không cần mở Unity
npx tsx UnityGame/Tools~/vectors-ground.mts          # vector mặt đất → Tests~/vectors/ground.json (test: Tests~/Aether.Data.Tests)
```

**Phát bản + tự cập nhật** (11/10/2026 — chủ dự án: "client tự động cập nhật mà không cần tải tay", "tải file exe sau sẽ cài, chọn
đường dẫn như Ngọc Rồng"):

- Mỗi lần build, `GameSetup` đánh **số bản** (phút kể từ 01/01/2026 UTC → `Application.version` = `1.0.<số>`, Android `versionCode`) và ghi
  `Build/<windows|android>.build.json`. Bản Windows nén LZ4HC (dữ liệu thô 2,3GB → ~245MB; build thử: `AETHER_FAST_BUILD=1` bỏ nén).
- Phát: `npx tsx UnityGame/Tools~/publish-client.mts [--notes "…"] [--min]` — gói Windows thành **bộ cài** WinRAR SFX (hộp cài chọn thư
  mục, mặc định `%LOCALAPPDATA%\Aether Chronicle`, lối tắt màn hình + menu Start, cài xong mở game), chép APK, ghi `version.json` +
  file vào `apps/server/data/client` (máy chủ THẬT đọc lại mỗi lần gọi — **không cần khởi động lại**). `--min` = bản tối thiểu: client cũ
  hơn bị chặn tới khi cập nhật. Thử: `--dir apps/server/data/client-test --fast` với máy chủ thử `AETHER_CLIENT_DIR=data/client-test`.
- Người chơi mới tải một lần: **https://admin.tail024813.ts.net/game/api/client/latest/windows** (Android: `…/latest/android`).
  Từ đó mở game là `AutoUpdate` hỏi `/api/client/version`; có bản mới thì tự tải (thanh tiến trình), kiểm cỡ + SHA-256, chạy chính bộ
  cài với `-s2 -d<thư mục đang cài>` sau khi game thoát → bung đè IM LẶNG đúng chỗ người chơi đã chọn rồi tự mở lại. Thư mục cần quyền
  quản trị (Program Files) thì Windows hỏi UAC. Android: mở link tải APK (hệ điều hành bắt người dùng bấm Cài). Bỏ qua trong Editor,
  AutoTest (`-aetherShot`), `-noUpdate`; `-updateServer <url>` hỏi máy chủ khác (thử trọn vòng trên máy chủ thử).
- **Gỡ cài đặt**: Settings → Apps → "Aether Chronicle" (game tự ghi mục này lúc chạy bản đã cài — HKCU, không cần quyền quản trị) hoặc
  menu Start → "Gỡ cài đặt Aether Chronicle" (`Tools~/installer/Uninstall.cmd` + `uninstall.ps1`). CHỈ xoá đúng các mục game đã cài
  (`uninstall-files.txt` ghi lúc đóng gói — người chơi có thể cài thẳng vào thư mục chung), lối tắt trỏ vào game, mục Apps, cài đặt
  trong game + log; tài khoản / nhân vật ở máy chủ nên không mất.
- File chưa ký số nên Windows SmartScreen hỏi lần đầu ("More info → Run anyway").

Kiểm bản build tự động: `Build/Windows/Aether.exe -aetherShot <thư mục>` → vào chơi offline, đi các hướng, chụp màn hình từng bước
+ `autotest.log` (vị trí, map, hoạt ảnh) rồi tự thoát.
Thêm `-aetherWeather`: chụp trạm (cạnh cột dịch chuyển) + một map săn của từng vùng để soát thời tiết theo vùng (`Client/Weather.cs`).

Thiết lập dự án do `GameSetup.ConfigureProject` đặt — sửa ở đó, đừng sửa tay trong Project Settings: Windows dùng **IL2CPP** từ 11/10/2026
(cần MSVC — Visual Studio Build Tools workload C++ cài ở `D:\VS\BuildTools`, Windows SDK ở ổ C; `docs/ban-quyen.md`), Android **IL2CPP + ARM64**, API tối thiểu 25; Input Manager CŨ (`UnityEngine.Input`); sort 2D theo trục y.
Ảnh lớn (≥1024px) trên Android nén **ASTC 4×4**, PC không nén.

## Luật chuyển

- Số học phải khớp JS từng bit: dùng `Js.Round` (làm tròn nửa lên) thay `Math.Round` (làm tròn ngân hàng).
- Dữ liệu lấy từ JSON xuất ra, không chép tay bảng số vào C#.
- Mỗi hàm luật chép sang C# phải có test vector sinh từ hàm TS gốc.

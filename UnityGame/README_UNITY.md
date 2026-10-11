# Aether — bản Unity 2D

Chuyển client game web (apps/web, Next.js + PixiJS) sang Unity 2D bằng C#. Máy chủ Node (apps/server), giao thức (packages/protocol) và
pipeline hình PixelLab (packages/asset-pipeline) GIỮ NGUYÊN — Unity là client mới nói chuyện với cùng máy chủ.

## Phiên bản

- Unity **6000.3.26f1** (Unity 6.3 LTS), cài ở **`D:\Unity\Editor`** (ổ C gần đầy — lần cài vào C hỏng giữa chừng) — module
  Android (SDK/NDK/JDK), iOS, Windows IL2CPP. Unity Hub đã đặt nơi cài mặc định = `D:\Unity\Editor`.
- iOS: Unity trên Windows chỉ XUẤT project Xcode; biên dịch + ký + cài lên iPhone cần máy Mac có Xcode (hoặc dịch vụ build đám mây).

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

Trong Editor: menu **Aether → Nhập dữ liệu từ pipeline** (đọc `apps/web/public/assets`), **Aether → Dựng GameDatabase + scene chơi**,
**Aether → Build Windows / Build Android (APK)**. Dòng lệnh (không mở giao diện):

```bash
U="/d/Unity/Editor/6000.3.26f1/Editor/Unity.exe"
"$U" -batchmode -nographics -quit -projectPath "D:\nttrg\pixel\UnityGame" -executeMethod Aether.Importer.PipelineImportMenu.ImportAllBatch -logFile import.log
"$U" -batchmode -nographics -quit -projectPath "D:\nttrg\pixel\UnityGame" -executeMethod Aether.Importer.GameSetup.BuildWindowsBatch -logFile win.log
"$U" -batchmode -nographics -quit -projectPath "D:\nttrg\pixel\UnityGame" -buildTarget Android -executeMethod Aether.Importer.GameSetup.BuildAndroidBatch -logFile android.log
dotnet build UnityGame/Tests~/EditorCompile          # kiểm biên dịch mọi asmdef với DLL Unity thật, không cần mở Unity
npx tsx UnityGame/Tools~/vectors-ground.mts          # vector mặt đất → Tests~/vectors/ground.json (test: Tests~/Aether.Data.Tests)
```

Kiểm bản build tự động: `Build/Windows/Aether.exe -aetherShot <thư mục>` → vào chơi offline, đi các hướng, chụp màn hình từng bước
+ `autotest.log` (vị trí, map, hoạt ảnh) rồi tự thoát.

Thiết lập dự án do `GameSetup.ConfigureProject` đặt — sửa ở đó, đừng sửa tay trong Project Settings: Windows dùng **Mono** (IL2CPP
cần Visual Studio C++), Android **IL2CPP + ARM64**, API tối thiểu 25; Input Manager CŨ (`UnityEngine.Input`); sort 2D theo trục y.
Ảnh lớn (≥1024px) trên Android nén **ASTC 4×4**, PC không nén.

## Luật chuyển

- Số học phải khớp JS từng bit: dùng `Js.Round` (làm tròn nửa lên) thay `Math.Round` (làm tròn ngân hàng).
- Dữ liệu lấy từ JSON xuất ra, không chép tay bảng số vào C#.
- Mỗi hàm luật chép sang C# phải có test vector sinh từ hàm TS gốc.

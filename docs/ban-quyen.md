# Bảo vệ hình nhân vật: dấu ẩn + sổ đăng ký (11/10/2026)

Chủ dự án hỏi: "file tải về cài đặt có khiến người dùng ăn trộm asset nhân vật của tôi không".

**Trả lời: có.** Mọi hình nằm trong bộ cài đều trích ra được bằng công cụ miễn phí (AssetRipper, AssetStudio). Không game nào chặn được tuyệt đối. Ta làm hai việc rẻ:

1. **Dấu ẩn** — để chứng minh hình bị lấy là của mình.
2. **IL2CPP** — để code không bị đọc ngược dễ.

Hàng bán bằng kim cương (thần kỹ, skin) sau này nên tải theo quyền sở hữu, không nhét sẵn vào bộ cài.

## 1. Dấu ẩn (đã làm)

**Cách đóng dấu**
- Unity đóng dấu lúc NHẬP hình nhân vật + chân dung vào dự án:
  - `Editor/Watermark.cs`, gọi từ `ImportUtil.CopyAssetMarked`.
  - Áp cho `CharacterImporter` (atlas) và `UiImporter.ImportPortrait`.
- `assets/` gốc KHÔNG đổi, nên công cụ tô màu lại và pipeline không bị ảnh hưởng.

**Nguyên lý**
- Đổi bit thấp nhất kênh xanh lam của mọi điểm ảnh đặc (alpha 255) theo mẫu 16×16.
- Mẫu sinh từ khoá bí mật: `HMAC-SHA256(khoá, "AETHER-MARK-v1:x,y")`, toạ độ PNG gốc trái-trên.
- Màu lệch tối đa 1/255, mắt không thấy.
- Mẫu lặp khắp ảnh, nên ai cắt lẻ từng khung ra khỏi atlas thì vẫn dò được (thử đủ 256 độ lệch).

**Khoá**
- Nằm ở `%USERPROFILE%\.aether\mark.key` (64 ký tự hex), hoặc biến môi trường `AETHER_MARK_KEY`.
- Unity tạo ngẫu nhiên lần nhập đầu tiên.
- **Khoá KHÔNG nằm trong repo.** Repo công khai thì người khác biết thuật toán nhưng không biết khoá, nên không xoá dấu có chủ đích được.
- **Sao lưu file khoá** (USB / kho mật khẩu). Mất khoá là mất khả năng chứng minh. Đổi khoá thì phải nhập lại + build lại.

**Kiểm một hình nghi bị lấy** (ở `packages/asset-pipeline`):

```bash
npm run watermark -- check duong/dan/hinh-nghi-ngo.png
```

- Có dấu: khớp ~100% (z hàng chục tới hàng nghìn).
- Hình thường: ~50% (z quanh 0, có thể âm với pixel art nhiều mảng phẳng).
- Kết luận "CÓ DẤU" khi z ≥ 8 và khớp ≥ 90% (đã tính việc chọn độ lệch tốt nhất trong 256).

Đo 11/10/2026:

| Hình | Kết quả |
| --- | --- |
| Atlas nhân vật trong dự án Unity | khớp 100%, z 616–1302 |
| Chân dung | khớp 100%, z 118–129 |
| Cùng hình ở `assets/` (chưa đóng dấu) | khớp 49%, không nhận |

**Giới hạn**
- **Bản Android**: atlas lớn (≥ 1024) nén ASTC 4×4, mất bit thấp, nên dấu KHÔNG còn trong APK. Hình nhỏ (RGBA32) vẫn giữ.
- **Bản PC** giữ ảnh không nén nên dấu nguyên vẹn.
- Kẻ trộm nén lại / đổi màu / phóng to rồi thu nhỏ thì dấu yếu đi hoặc mất. Khi đó dựa vào **sổ đăng ký**.

Test: `packages/asset-pipeline/tests/watermark.test.ts`:
- đóng dấu chỉ đổi đúng bit đó;
- khung cắt lẻ vẫn dò ra đúng độ lệch;
- ảnh thường và sai khoá thì không nhận.

## 2. Sổ đăng ký hình (đã làm)

`npm run watermark -- registry` ghi SHA-256 + cỡ của MỌI hình trong `assets/` vào `docs/ban-quyen/so-dang-ky-hinh.json` (lần đầu: 271 hình).

- Commit file này lên GitHub là một mốc thời gian công khai, chứng minh mình có hình đó từ ngày đó.
- **Chạy lại sau mỗi đợt vẽ mới rồi commit.**
- Kèm theo, giữ nhật ký job PixelLab (job id, ngày) làm bằng chứng mình là người tạo.

## 3. IL2CPP cho bản Windows (đã làm 11/10/2026)

- Android build IL2CPP từ trước.
- Windows trước đây là Mono: `Aether_Data/Managed/*.dll` mở bằng dnSpy / ILSpy là đọc gần nguyên mã C#. Nay IL2CPP, đặt ở `GameSetup.Setup`, stripping Minimal.
- Cần MSVC trên máy build: **Visual Studio Build Tools 18**, workload `Microsoft.VisualStudio.Workload.VCTools`, cài ở `D:\VS\BuildTools` (bộ đệm `D:\VS\Cache`).
  - Ổ C hết chỗ nên không cài vào bản Community có sẵn ở C.
  - Windows SDK 10.0.26100 vẫn nằm ở ổ C (trình cài VS không cho đổi).
  - Unity tự tìm Build Tools qua vswhere.
- IL2CPP chỉ bảo vệ CODE (luật, giao thức), không bảo vệ hình.

## 4. Pháp lý (chủ dự án tự làm)

- Ghi điều khoản sử dụng ở màn đăng nhập: cấm trích xuất / tái sử dụng tài nguyên.
- Đọc điều khoản của PixelLab về quyền với hình tạo ra.
- Bị đem bán ở chợ / store khác: gửi yêu cầu gỡ (DMCA). Bằng chứng gồm:
  - kết quả `watermark check`;
  - sổ đăng ký trong lịch sử git;
  - nhật ký PixelLab.

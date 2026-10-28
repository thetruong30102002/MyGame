# Lữ khách V15 — đồng nhất khung chuyển động

## Phạm vi

- Nhân vật người chơi dùng một bộ hình hoàn chỉnh cầm kiếm hoặc trượng; tóc, áo, tay và vũ khí đã nằm liền trong từng frame.
- Bảo toàn chính xác 96 frame đứng yên của bản V14 đã được chấp nhận. Không vẽ lại hoặc đổi bảng màu của các frame đó.
- Thay 30 sheet nguồn cho năm hướng S/E/N/SE/NE: đi và chạy với kiếm/trượng, bổ kiếm, niệm phép. Ba hướng còn lại lật nguyên hình.
- Mỗi sheet dùng một tỉ lệ đều cho toàn bộ cơ thể và các mốc căn hàng/cột cố định. Không căn kích thước theo bounding box riêng từng tư thế, không kéo đầu/tay/chân riêng.
- Kiếm có 12 phase bổ từ trên xuống, trượng có 12 phase niệm phép. Hướng Bắc có hai lần giữ nguyên tư thế trọn hình để bỏ động tác dư; lineage ghi rõ `phaseOrder`.
- Các clip tay không và phản ứng cũ giữ làm dữ liệu tương thích. Nhân vật người chơi hiển thị bộ kiếm/trượng; không hiện thân thử nghiệm tay không khi thiếu item.

## Bằng chứng ảnh nguồn

- Nguồn: `assets/player-integrated/source-art/fullhero-v15/selection-reviewed-30.json`.
- Duyệt cuối: `fullhero-v15/final-art-review.json` và 10 bảng đối chiếu `review-final-palette/`.
- Kiểm ảnh: `.aether-stage/wholehero/v15/native-idle-review/report.json` và `pipeline-audit-final.json`.
- 96/96 idle RGBA trùng từng pixel, canvas/anchor trùng; 30 trace và nguồn khớp SHA.
- Atlas: 2048×2048, 960 frame logic / 958 frame vật lý, canvas144, root72/128, PPU48, alpha0/255.
- SHA atlas: `b970287f663cf29d207ec447c891619bf28ae46bdcfd166d57a1de38174bf750`.
- SHA provenance được duyệt: `c01f9cc5087e36126619bd64c90c4d480f84643cf6f7b537113bb16c593af6cd`.
- Nguồn sửa là ImageGen theo ảnh nhân vật sẵn có. Không ghi nhận đây là ảnh mới do PixelLab tạo.

## Build và chạy thử

Đã chạy `.aether-stage/wholehero/v15/build-and-verify.ps1` với SHA provenance trên: Windows427405 và Android427415 đều exit0. Native IL2CPP, runtime672 frame, combat kiếm/trượng, UI và APK signer/alignment đều đạt. Bốn chuỗi 104 capture đã được root và agent độc lập xem; receipt `runtime-visual-review.json` khóa đúng build và SHA của `frames.json`.

Frame đi, ra đòn và hồi về đứng không thấy tăng kích thước cơ thể hoặc làm mờ sprite trong các capture. Gait Sword-E vẫn có chuyển trọng lượng nhẹ và pose0/4 tương tự; không gọi đây là chu kỳ chân hoàn hảo. 104 ảnh là lấy mẫu theo thời gian, không phải phim60fps hoặc bằng chứng chạy RUN trên mọi hướng.

Các gate bắt buộc: Windows IL2CPP build; khởi chạy tiến trình con/registry Unicode bằng Win32 trong chính player IL2CPP; 672 frame cốt lõi; chiến đấu kiếm/trượng thực; 104 ảnh chuyển trạng thái ở zoom1/Point; UI; Android package/version/signature cùng signer bản trước/ZIP alignment. Không có thiết bị Android thì không ghi đã thử trên máy Android.

## Client cũ

Unity6000.3 IL2CPP trong các binary cũ không thực hiện `System.Diagnostics.Process.Start`; tải và giải nén được nhưng không chạy tiến trình chép/cài. Source V15 thay bằng `CreateProcessW` và registry native. Không thể sửa API đã biên dịch bên trong binary cũ từ máy chủ.

`UnityGame/Tools~/repair-client.ps1` và `.cmd` hỗ trợ sửa một lần bằng PowerShell bên ngoài game: tải ZIP, kiểm size/SHA, sao lưu đúng file sẽ thay, rollback khi chép lỗi, không xóa file lưu không thuộc gói. Đã đạt13 kiểm chứng cô lập; gói repair thực tải ZIP427405 và thay21/21 file khớp SHA vào clientV13 cô lập, giữ save/registry và backup file cũ. Không sửa cài đặt thật trong phép thử.

Máy chủ cũ `nttrg-2.tail024813.ts.net` hiện trả502 qua cả hai ingress Funnel công khai. Kế hoạch đổi riêng tuyến `/game/api/client` đã chuẩn bị nhưng chưa thực thi vì chưa có phiên quản lý máy đó. Không tuyên bố mọi binary cũ tự nhận V15; gói sửa một lần dùng hostname admin đang hoạt động.

## Trạng thái phát hành

Đã phát V15 vào25/10/2026, Windows427405 / Android427415. File cũ được giữ, minBuild408477 giữ nguyên. Manifest SHA `9deb9534c594ab5885e0ab15a88c9e5fd2165eaeaecb16d28257e56f9df01071`.

- Trang tải: https://admin.tail024813.ts.net/game/tai-game
- Tin cập nhật: https://admin.tail024813.ts.net/game/tin-tuc#tin-11
- Gói sửa: https://admin.tail024813.ts.net/game/api/client/file/Aether-Repair-Windows.zip
- `release-verification.json`: DoH công khai và HTTPS đúng SNI/TLS qua cả hai ingress, manifest và GET headers EXE/ZIP/APK/repair khớp; SHA đầy đủ kiểm trên file local đã promote. Không ghi đã tải toàn bộ remote byte.
- `public-news-verification.json`: API và static fallback khớp ba tin DB `[11,10,9]`, đúng marker build427405/427415.
- Drive chưa cập nhật. Cả hai upload bị403 rateLimitExceeded của shared OAuth project202264815644 trước khi truyền; tab Drive còn anonymous, đã yêu cầu người dùng đăng nhập để cập nhật đúng fileID/link cũ.
- Không có runtime test trên thiết bị Android.

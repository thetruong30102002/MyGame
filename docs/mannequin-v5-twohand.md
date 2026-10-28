# Ngân Lam v5 — bổ kiếm hai tay

Bản hiện hành: [v6 — thân nam/nữ, trang bị và tóc độc lập](mannequin-v6-modular.md). Tài liệu này giữ lại quy trình v5; lệnh `mannequin:warden` hiện dựng v6, `mannequin:warden:v5` dựng nguồn v5 cũ.

## Đòn mới

Vẽ lại 7 pose bổ kiếm cho thân nền, áo xanh, giáp bạc và Long Vệ: hai tay giữ cùng một chuôi, nâng qua đầu, bắt đầu hạ kiếm, bổ xuống với thân gập và gối chùng, ghìm đà ở thấp rồi hồi thế. Năm hướng được vẽ, ba hướng đối xứng lật cả pose. Bỏ chuỗi chém một tay cũ.

Phát 14 frame ở18fps, điểm chạm ở frame7 (0,389giây). Các frame giữ tạo thời gian lấy đà và ghìm lực; không tạo thêm pose giả bằng kéo giãn tay. Vệt chém chỉ là dải ngắn đi xuống sát lưỡi ở frame7–9, không còn vòng tròn quanh vai.

Kiếm Nguyệt Cương giữ thiết kế bạc/lam/vàng, vẽ lại chuôi dài đủ hai tay. Vị trí kiếm và hai lớp ngón tay được căn riêng cho mỗi bản thân trên; áo đỏ và áo da dùng cùng hình học với áo xanh. Khi nhìn từ sau và nắm tay bị thân che hoàn toàn, kiếm nằm sau thân, không dán nắm tay lên tóc.

## Ghép và tỉ lệ

Giữ tranh native112 và PPU48. Chỉ thêm khoảng trong suốt: canvas144, offset[16,24], mốc chân[72,124], pivotUnity[72,20]. Không thu nhỏ người khi giơ kiếm lên cao. Atlas2304×2304 được nhập với giới hạn4096 để Unity không tự thu ảnh.

Giữ nguyên đầu/cổ/thân của từng pose vẽ. Mask cơ thể bỏ phần nền bị áo/quần/giày che. Bộ đồ ghép lại khớp ảnh nguồn; không ghép đầu idle lên tay đang nâng. Chạy8pose, đi bộ và chưởng được giữ từ bản trước.

## Nguồn và tái tạo

Vẽ bằng **ImageGen tích hợp**, không dùng CLI/API fallback. Ảnh nguồn: `assets/mannequin/v2/source-art/v5/`; prompt đầy đủ: `final-prompts.json`. Ảnh sau đăng ký cập nhật các file attack và kiếm trong `source-art/authored-v4/`. Bản vẽ có kiếm hồng/chuôi xanh là mốc căn trong nguồn; không đưa màu mốc vào game.

Tham khảo loại đòn Overhead Slash trong [hướng dẫn Great Sword chính thức của CAPCOM](https://game.capcom.com/manual/MH4U/en/page-101.html). Nhân vật và hình trang bị được vẽ riêng cho dự án.

```powershell
python packages/asset-pipeline/scripts/prepare-authored-v4.py
python packages/asset-pipeline/scripts/prepare-cleave-v5.py
npm run test:warden -w @aether/asset-pipeline
python packages/asset-pipeline/scripts/review-authored-v4.py
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/kiem-mannequin.ps1
```

192pose, 336frame phát, 8848sprite, 35trang atlas. Kiểm nguồn ảnh, ghép đồ, đầu/cổ, hai nắm tay nối với thân và cùng nằm trên chuôi thẳng, hướng lưỡi ở điểm chạm, vệt bổ dọc, clipping và PPU. Ảnh/GIF kiểm: `.aether-stage/mannequin/twohand-v5-review/`.

## Build và chạy

Bản chạy: `.aether-stage/mannequin/build/Aether.exe`; mở bằng `Chay-Ngan-Lam.cmd`, vào **Thử chiêu → Ngân Lam**. Launcher dùng `-noUpdate` để chạy bản cục bộ vừa build.

Log build: `.aether-stage/mannequin/twohand-v5-build.log`: **Succeeded, errors=0**. Log player: `twohand-v5-player.log`. Ảnh và log kiểm runtime: `twohand-v5-runtime/`.

Runtime hoàn tất với exit0 và965 ảnh chụp: 80 cách phối, 14.080frame trang bị, 176frame tấn công/niệm không đồ; đi/chạy đủ8hướng. Combat kiếm trúng1lần tại0,389giây/frame7; trượng vẫn phóng đạn tại0,400giây/frame4. Đã xem ảnh chạm đòn trong game và kho Long Vệ; GIF so sánh áo xanh/Long Vệ giữ đúng thời lượng780ms gần với14/18giây.

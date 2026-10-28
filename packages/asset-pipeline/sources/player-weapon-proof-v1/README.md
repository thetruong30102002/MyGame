# Mẫu tách riêng vũ khí — 26/10/2026

**Chỉ tách vũ khí. Tóc, đầu, thân và trang phục vẽ liền trong từng frame.** Thêm lớp che của bàn tay để chuôi nằm trong nắm tay, không có asset/lớp tóc riêng.

Đã render bằng imagegen: thân sạch phía trước, thân sạch tám hướng, hai kiếm cơ bản độc lập, nguồn đi E tám frame, nguồn bổ S và bản sửa/thêm frame giữa. Bản gốc ở `raw/`, giữ cả lần sinh trước; prompt tại `prompts.json`, hash nguồn tại `generation-status.json`. Không dùng PixelLab cho đợt sinh này.

Mẫu ghép hiện chọn **29 frame thân**: tám hướng đứng, tám frame đi E và 13 frame bổ S. Mỗi frame ghép thử hai kiếm, tạo 58 bản ghép; thay kiếm không đổi pixel thân/tóc của frame đó. Hai kiếm dùng cùng pivot chuôi, bảng điểm nắm/góc và mặt nạ tay. `poses.json` lưu theo từng frame, tất cả `reviewed=false`.

## Dựng và kiểm

Chạy từ gốc repo:

```powershell
npx tsx packages/asset-pipeline/src/weaponProof/build.ts
npx tsx packages/asset-pipeline/tests/weapon-proof.test.ts
npx tsx packages/asset-pipeline/src/weaponProof/animation.ts
```

Đầu ra chỉ ở `.aether-stage/weapon-proof-v1/`: PNG từng lớp, bản ghép, bảng so 2×, APNG quay/đi/bổ và manifest. Pipeline dùng cùng phép lấy mẫu nearest cho các ô, alpha cứng; không tự scale từng frame để ép cao bằng nhau. Canvas 144×144, neo quy ước (72,128), PPU dự kiến 48. Ảnh sinh có lưới 4×2 với cạnh ô nửa pixel ở file gốc; bộ lấy mẫu dùng tọa độ phân số đồng nhất, không làm méo các ô xen kẽ.

Kiểm hình học đã qua: 58 bản ghép giữ nguyên phần thân/tóc ngoài vũ khí, chuôi nằm dưới lớp bàn tay, alpha cứng và không cắt ở mép canvas. Đã căn lại ba neo phát hiện sai ở NW đứng, cuối bước E và một frame bổ nguồn đầu. Các kiểm này **không chứng nhận tay cầm đã tự nhiên hoặc chuyển động đã đạt**.

## Việc còn lại

- Rà tỷ lệ đầu/thân, độ nét so mẫu gốc ở 1×/2×; không duyệt chỉ vì ảnh nguồn lớn trông chi tiết.
- Rà nhịp đổi chân/tiếp xúc đất và vòng lặp đi E; rà hai tay, góc kiếm và đoạn nối lấy đà–bổ–hồi của chuỗi 13 frame. Kiếm vẫn lấy mẫu quay nearest: nếu góc chéo vỡ nét, phải vẽ hướng đó, không coi xoay ảnh là bản cuối.
- Vẽ đủ những hướng còn thiếu của đi/chạy/tấn công; đứng hiện chỉ một frame mỗi hướng, chưa phải idle thở hoàn chỉnh.
- Kiểm lớp che ở hướng ngang/sau, chuôi không che ngón, mỗi lần chỉ một vũ khí. Chỉ mở rộng các class có kiểu cầm tương thích sau khi mẫu đạt.
- Nhập và thử thật trong Unity, PC/Android, rồi mới tích hợp/phát hành.

**Chưa bật production, chưa đổi roster/client, chưa build một bản game mới, không thay DB.**

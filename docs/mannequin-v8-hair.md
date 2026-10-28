# Tóc v8 — giữ lọn mái khi ghép

Bản thay thế sau phản hồi mỹ thuật: [v9 — vẽ nhân vật liền khối rồi tách và so](mannequin-v9-integrated-hair.md).

## Tham khảo

- [Pixel Star — Hairstyle](https://digital-yume.net/pixelstar/hair.html): đối chiếu mái có lọn, tóc mai ôm thái dương, độ phồng sau gáy và khoảng mở mặt theo góc nhìn.
- [Universal LPC Character Generator](https://github.com/LiberatedPixelCup/Universal-LPC-Spritesheet-Character-Generator): tham khảo cách phân lớp tóc và chọn frame theo hoạt động của thân.

Chỉ dùng làm tham khảo. Tài nguyên trong game vẫn là các sheet tóc riêng của dự án: đứng tám hướng ở `source-art/v6/hair-three-styles-raw.png`, chín sheet đi/bổ/niệm ở `source-art/v7/hair/`.

## Lỗi và sửa

V7 cắt toàn bộ tóc trước từ đỉnh đầu +6px trên cả bề ngang mặt. Đường cắt xóa mái và tóc mai, làm ba kiểu tóc trông như mũ tóc ngắn. V8 giữ nguyên khoảng mở mặt và đường mái đã vẽ trong nguồn, tăng khoảng phủ ngoài sọ từ 3px lên 4px và căn đỉnh tóc 5px trên đỉnh sọ. Không có đường cắt ngang trán.

Đuôi tóc ở hướng trước đi sau vai; hướng sau được thấy trên lưng. Phần đuôi quét qua mặt dưới được chuyển sau đầu bằng vùng bảo vệ thuôn theo hàm, không cắt mái. Tóc ở tư thế giơ kiếm căn theo sọ sạch, tránh nhầm cẳng tay giơ cao là đỉnh đầu. Mỗi frame vẫn dùng tóc đúng hành động/phase đã vẽ. Không thay dáng người, quần áo, hoạt ảnh thân hay UI.

`adult-modular-v7` là phiên bản thân giữ nguyên; `hairRevision: 8` và `hairBindings` trong catalog nhận diện bản sửa tóc.

## Xuất và kiểm tra

```powershell
python packages/asset-pipeline/scripts/assemble-modular-v8.py
python packages/asset-pipeline/tests/modular-v6.test.py
python packages/asset-pipeline/tests/modular-v7-continuity.test.py
python packages/asset-pipeline/scripts/review-modular-v7.py
```

Ảnh kiểm tra ở `.aether-stage/mannequin/modular-v8-review/`. Gate bảo vệ dáng đứng/đi, frame tóc theo hành động, giữ lọn mái thay vì bắt buộc trán bị cạo ngang, và khoảng hở giữa cằm/cổ ở chính diện. Vẫn kiểm tra đồ độc lập và điểm nắm vũ khí.

## Build

- Unity: `.aether-stage/mannequin/modular-v8-build.log`, `Succeeded; errors=0`.
- Bản mới: `.aether-stage/mannequin/build-v8/Aether.exe`; `Chay-Ngan-Lam.cmd` đã trỏ vào đây.
- Atlas:7511 ô ảnh khác nhau,21856 tên,30 trang. Thân/đồ vẫn dùng bộ v7 đã chốt.
- Python:320 tư thế thân,336 cặp frame đồ dùng chung,1360 điểm nắm hai tay;128 đầu đi trùng đầu đứng,256 frame đi/chạy giữ cùng mốc;960 tổ hợp tóc theo tư thế qua kiểm tra mái và cằm.
- Game thực thoát0: `.aether-stage/mannequin/modular-v8-runtime/autotest.log`. Qua80 tổ hợp đồ/14080 frame,176 frame đánh/niệm thân nền,128 kiểm tra đầu/tóc cho mỗi giới tính. Kiếm chạm0,389s, trượng0,400s, có đạn phép.
- Đã xem ảnh thực `mannequin-inventory.png`, `barber-0-0.png`, `barber-1-2.png`, `mannequin-walk-sword-W-2.png`: mặt/tóc mai rõ, mái không còn bị cắt ngang. Ảnh nằm trong thư mục runtime trên.
- So sánh cùng mặt/tám hướng: `modular-v8-review/hair-before-after.png`. Chuyển động tóc và thân: `modular-v8-review/hair-actions.gif`, `idle-walk-*.gif`.

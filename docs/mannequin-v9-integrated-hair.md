# Tóc v9 — vẽ nhân vật liền khối trước, rồi tách lớp và so

## Mẫu liền khối

Theo yêu cầu mới, vẽ một nhân vật hoàn chỉnh có tóc ở đủ tám hướng trên dáng người và trang phục đã chốt. Từ mẫu nâu này vẽ thêm biến thể tóc bạc và tóc buộc đuôi, cùng khuôn đầu và thiết kế nhân vật. Đây là tranh mới bằng **ImageGen tích hợp**, không dùng CLI/API fallback.

Ba mẫu đầy đủ và chín sheet tóc theo hoạt động được lưu tại `assets/mannequin/v2/source-art/v9/`. `prompts.json` lưu đủ12 prompt. Ảnh tạo ở thư mục mặc định được sao chép vào dự án trên ổD.

## Ghép đúng tỉ lệ

Không lấy hộp bao riêng của mỗi bộ tóc để tính lại cỡ và tâm. Tóc được tách từ nhân vật liền khối ở vị trí thật trên canvas144. Tỉ lệ và vị trí khi ghép theo sọ của thân nền; khuôn mặt, thân và các lớp áo/quần/giày vẫn là bộ v7 đã được chấp nhận.

Các pixel bên trong khối tóc và dải tiếp xúc với mặt giữ từ mẫu liền khối. Frame vẽ mới chỉ thay đổi vùng ngọn; phần buộc và liên kết tóc mai được giữ nối liền. Nhờ đó chân tóc không trườn xuống trán và hình tóc không bị thiết kế lại sau mỗi bước. Loại các dấu đăng ký, viền màu lỗi và mảnh tóc rời; tách phần cổ áo khỏi tóc ở ảnh mẫu. Bảo vệ vùng hàm/cằm, đưa đuôi tóc hướng trước ra sau vai và cho thấy nó trên lưng ở hướng sau.

Đi có8 phase, bổ7 phase, niệm4 phase cho5 hướng vẽ; các hướng đối xứng lấy phần ngọn đối xứng, giữ chân tóc từ mẫu tám hướng tương ứng. Có456 tổ hợp hoạt động/hướng/kiểu tóc, cộng24 mẫu đứng, được đăng ký lên960 tư thế tóc–thân cho hai giới tính. Không dựng lại hình dáng cơ thể bằng code.

## So sánh và kiểm tra

- `modular-v9-review/*-integrated-comparison.png`: ba hàng V8 / PAINTED / IN GAME, cùng gốc chân và cỡ pixel. Hàng cuối là các lớp tài nguyên game đã ghép; script xác nhận chúng khớp từng pixel với cách đăng ký mẫu liền khối.
- `modular-v9-review/hair-actions.gif` và `idle-walk-*.gif`: xem chuyển động ở cùng vị trí/cỡ.
- `modular-v9-hair.test.py`:456 tư thế giữ các pixel chân tóc và khoảng mở mặt; mỗi kiểu/hướng/hoạt động có các hình ngọn khác nhau.
- Các gate cũ vẫn qua:320 tư thế thân,336 cặp frame đồ dùng chung,1360 điểm nắm hai tay;128 đầu đi trùng đầu đứng,256 frame đi/chạy cùng mốc,960 bộ tóc/thân giữ mái và khoảng cằm.
- Atlas:7426 ô ảnh,21856 tên,30 trang. Thân giữ `adult-modular-v7`; tóc nhận diện bằng `hairRevision: 9`.

```powershell
npm --workspace packages/asset-pipeline run test:warden
python packages/asset-pipeline/scripts/register-hair-v9.py
python packages/asset-pipeline/scripts/review-modular-v7.py
```

## Build

Build-v9 đã thành công và bài kiểm tra game thực qua1149 ảnh. Người dùng phản hồi tóc bạc/tóc dài và vùng trán chưa đạt; launcher không chuyển sang bản này. Tiếp tục sửa ởv10.

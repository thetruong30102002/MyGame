# Tóc v10 — mái, thái dương và gáy

## Phản hồi được xử lý

Bản thử ép mọi kiểu tóc vào khung sọ+4px/top-4px bị xẹp nên đã bỏ. Bản giữ phồng tiếp theo còn lộ trán và lệch đường mái; vẽ lại cả ba kiểu trên đúng khuôn mặt tám hướng để phần mái chạm gần lông mày, hai bên nối vào thái dương.

## Nguồn vẽ và quy chuẩn

- `assets/mannequin/v2/source-art/v10/natural-fringe-hair-raw.png`: sheet tóc mới ba kiểu x tám hướng, tạo bằng ImageGen tích hợp, có alpha thật.
- `hairline-face-guide.png`: khuôn mặt thật trong game, dùng làm mốc cho tranh mới.
- `hairline-prompts.json`: prompt cuối. `fixed-scalp-hair-raw.png` và `prompts.json` là thử nghiệm trước đã bỏ.
- Cùng lưới48px cho tóc, thân144px, xuất ô176px, gốc chân[88,152], PPU48. Giữ độ phồng tự nhiên của nguồn vẽ; không ép riêng chiều ngang/dọc, không cắt đỉnh tóc theo khung chữ nhật.
- Một phép đăng ký cho cả ba kiểu trên mỗi hướng, theo mặt và tóc nâu liền khối làm mốc. Tóc buộc được phép có búi/đuôi ngoài phần sọ.
- Giữ nguyên alpha tóc bạc thay vì lọc màu da khỏi vùng sáng; không gây lỗ tại highlight.
- Cố định đầy đủ vùng chân tóc/trán/thái dương (kể cả khoảng trong suốt của mặt), phần lõi và vùng mái. Ghép ngọn từ các frame vẽ của hoạt động; không dịch cả bộ tóc theo chân bước.
- Giữ nguyên thân/thang tỉ lệ và các lớp áo/quần/giày v7. Hai giới tính vẫn dùng chung trang bị.

## Kiểm tra

`python packages/asset-pipeline/tests/modular-v10-hair.test.py`:480 tổ hợp kiểu/hướng/hoạt động, độ phồng so mẫu, sọ được che, chân tóc cố định, ngọn thay đổi theo hoạt động.

Atlas7533 ô; build-v10 thành công và kiểm tra game thực hoàn tất. Người dùng vẫn thấy tóc lớn/thò và bộ chém không cùng nhân vật, nên tiếp tục xử lý ởv11. Launcher không chuyển sangv10.

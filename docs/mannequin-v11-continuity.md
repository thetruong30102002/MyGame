# V11 — cùng nhân vật khi đứng, đi, chém và niệm

## Nguồn chuẩn

Thân đứng/đi v7 và tỉ lệ đã chốt được giữ nguyên. Tóc/đầu mới có hai sheet nam/nữ, mỗi sheet ba kiểu x tám hướng, vẽ hoàn chỉnh mặt và tóc bằng ImageGen tích hợp. Hai file `male-integrated-heads-raw.png`, `female-integrated-heads-raw.png` và prompt cuối `integrated-head-prompts.json` nằm trong `assets/mannequin/v2/source-art/v11/` trên ổD.

Các file `*-attack-draft.png` và `hair-fitted-raw.png` là thử nghiệm không sử dụng vì dáng/chỗ gắn không đạt. Không thay thân bằng những bản thử này.

## Ghép và chuyển trạng thái

- Đầu/tóc liền khối đăng ký theo cằm/cổ và khuôn mặt. Cùng một tỉ lệ đồng đều cho tám hướng, lấy khối tóc khoảng22px làm mốc. Đuôi tóc được phép dài ra sau, không dùng đuôi để tính cỡ cả đầu.
- `integratedHeads: true`: chỉ vẽ đầu/tóc liền khối khi chọn kiểu tóc; loại lớp mặt cũ ở cả thế giới và túi đồ/tiệm tóc. Kiểu cạo đầu vẫn dùng mặt chuẩn ban đầu. UI preview truyền đúng kiểu đang xem, kể cả khi khác kiểu đang mặc.
- Khi chém/niệm, cụm đầu chỉ đổi vị trí theo tư thế, không phóng/thu theo từng frame. Khuôn đầu cạo cũng dùng đúng pixel từ mẫu đứng tương ứng. Vùng trán, tai và lõi tóc cố định; ngọn từ sheet hoạt động v9 được giới hạn độ văng để không mọc tufts rộng.
- Màu da và bảng màu đồ trong chém/niệm được căn theo mẫu đứng. Alpha nhị phân, xuất nearest-neighbour, Unity Point/no mipmaps; không thêm hiệu ứng làm nhòe nhân vật.
- Đầu/cuối đòn chém và niệm dùng đúng frame đứng, bao gồm áo/quần/giày/đầu/tóc và tư thế cầm vũ khí. Giữ khung chạm7/18 giây của kiếm và4/10 giây của trượng. Phần bổ vẫn là động tác hai tay từ trên xuống; frame cầm chuyển tiếp dùng tư thế cầm đứng.

## Kiểm tra

- 960 tư thế đầu giữ nguyên mặt/da đầu, alpha0/255, ngọn có chuyển động.
- 64 điểm vào/ra đứng–chém/niệm khớp từng pixel và cùng sprite gear/hair/body.
- 320 tư thế thân,336 cặp trang bị dùng chung,1152 kiểm tra hai bàn tay nằm trên chuôi ở phần chém hai tay; các frame cầm chuyển tiếp kiểm tra cầm một tay như đứng.
- 128 đầu đi giữ nguyên mẫu đứng,256 mốc đi/chạy,960 bộ ghép tóc.

Atlas cuối:7173 ô/21856 tên/29 trang. Unity build-v11 thành công,0 lỗi biên dịch. Chạy game thực hoàn tất với1149 ảnh:176 frame chiến đấu không đồ,80 tổ hợp trang bị/14080 frame,128 kiểm tra đứng–đi/chạy cho mỗi giới tính. Kiếm chạm0,389s, trượng thả0,400s và có projectile. Đã xem ảnh túi đồ, tiệm tóc nam/nữ, chém và đi trong game.

Bài kiểm tra game đã bổ sung kiểm tra riêng cho khung chuyển cầm một tay: phải dùng cùng body/gear/hair prefix với tư thế đứng; các khung bổ còn lại vẫn yêu cầu cặp tay theo đồ. Các kiểm tra chuôi/tay, lớp che và vệt chém giữ nguyên.

`Chay-Ngan-Lam.cmd` hiện mở `.aether-stage/mannequin/build-v11/Aether.exe -noUpdate`. Các bản v8–v10 vẫn ở thư mục riêng để đối chiếu. Xem chuyển động trong `.aether-stage/mannequin/modular-v11-review/hair-actions.gif`, và ảnh tám hướng trong `hair-eight-directions.png`.

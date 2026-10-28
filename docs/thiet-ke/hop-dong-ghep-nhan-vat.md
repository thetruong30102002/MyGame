# Hợp đồng ghép nhân vật — ba nhóm tài nguyên

<!-- no-head-overpaint -->

**NGHIÊM CẤM VẼ/GHÉP ĐÈ ĐẦU NÀY LÊN ĐẦU KHÁC — chỉ thị trực tiếp27/10: thân/bộ đồ và mọi lớp tay/găng/cổ áo phải tách sạch toàn bộ đầu, mặt, tóc, tai, sừng, cổ da cũ TRƯỚC KHI ghép avatar mới. Tắt avatar phải thấy bộ đồ không có đầu, không còn tóc bạc ở hai bên/gáy/khe tay hoặc pixel mặt người. Không chữa bằng phóng avatar/che cổ. Nguồn có đầu chỉ để đối chiếu, không dùng nguyên frame làm lớp thân runtime. Phải rà từng frame/hướng không avatar rồi thử đầu ngắn/nhỏ/Ma tộc trên nền sáng tối. Còn phần đầu cũ thì LOẠI, không đưa game/phát hành/tăng nghiệm thu. Quy tắc đầy đủ: docs/thiet-ke/cam-ghep-de-hai-dau.md.**


<!-- rig-v2-scope -->

Chốt mới27/10: giữ thiết kế30 đầu đã được chủ dự án đồng ý (5 tộc, mỗi tộc3 nam+3 nữ,8 hướng), nhưng ĐỘ NÉT CHƯA ĐẠT. Vẽ lại chi tiết tóc/mắt/mặt/viền tại nguồn, so hai NPC PixelLab tóc trắng cùng cỡ game; không sharpen hoặc phóng đầu. Tách thân/bộ NAM và NỮ riêng, cùng chiều cao/khối đầu/PPU/root/neo cổ, khác vai/eo/hông vừa phải. Hai thân thay thế quy tắc thân unisex trước đây. Sửa đầu bị thụt bằng neo cổ/cằm nguyên pixel, không co/phóng ảnh. Cần vẽ đủ bước chân và15 pose bổ kiếm thật cho từng thân, rồi ráp đầu–thân–kiếm với lớp che tay/cổ áo theo frame; chưa nghiệm thu chỉ từ4 key pose. Bộ class kín da, đầu không dính áo, Thú nhân không đuôi.5 class có5 thiết kế đồ cơ bản, mỗi thiết kế có hai dáng nam/nữ và vũ khí tương ứng.


Mục tiêu: thay đầu, bộ đồ hoặc vũ khí bằng catalog và metadata, dùng lại các phần không đổi. Đây là thiết kế hợp đồng triển khai; mẫu V7 hiện mới thử đứng hướng S, chưa có renderer đầy đủ cho cả bộ mới trong Unity.

| Nhóm | Nội dung | Phần cần vẽ theo hoạt động |
| --- | --- | --- |
| Nguyên đầu | Mặt, tóc, tai/sừng, cổ da | Hướng nhìn, nghiêng/cúi/ngẩng và chuyển động tóc phù hợp; không dính áo |
| Bộ đồ/thân | Cơ thể mặc nguyên bộ, tay/chân, cổ áo, đuôi nếu có | Đứng, di chuyển và đánh của class hỗ trợ; giữ cùng chiều dài chi/tỷ lệ |
| Vũ khí | Lưỡi/thân vũ khí, hộ thủ, chuôi | Hướng/trục/điểm nắm theo frame, lớp trước/sau và chỗ ngón tay che |

**Ba nhóm tài nguyên không có nghĩa luôn dán ba ảnh theo một thứ tự cố định.** Tay có thể che đầu khi nâng kiếm, vũ khí có thể đi sau thân rồi ra trước; tóc dài có thể đi sau cổ áo. Nguồn từng nhóm được chia thêm mask/lớp che nội bộ khi cần, vẫn quản lý như một đầu, một bộ đồ và một vũ khí. Không biến chúng thành tóc/mặt/phụ kiện bán riêng.

## Dữ liệu dùng chung

- Phiên bản rig và lưới pixel, canvas, root/PPU, hướng, class, action/pose và thời lượng frame.
- Đầu: hình học mặt/khối đầu, pose đầu tương thích, neo cổ; không tự scale theo kiểu tóc hoặc bộ đồ. Ảnh đầu nghiêng phải vẽ đúng góc, không xoay/nội suy ảnh đứng để giả chuyển động.
- Thân đồ: `classId`, dáng, tộc hoặc họ cơ thể tương thích, bảng da hở, bộ pose. Mỗi frame khai báo neo cổ và lớp cổ áo/tay che.
- Vũ khí: loại tương thích class, kích thước vật lý, điểm nắm, trục chuôi/lưỡi và thứ tự lớp. Thay thanh kiếm giữ thân/tay/timing; không thay kiếm thành trượng mà giữ nguyên nhát chém.
- `poseId` gắn theo hành động từng class; không mặc định frame7 của mọi class là cùng một tư thế hoặc cùng thời điểm chạm.

## Quy trình ghép

1. Chọn đầu và bộ đồ hợp tộc/dáng/da, bộ đồ hợp class và vũ khí. Thiếu asset hoặc pose thì không mở tổ hợp cho người chơi.
2. Lấy pose thân đồ của hành động đang chạy; tra pose đầu và vị trí cổ tương ứng, không dùng một đầu đứng tĩnh cho tất cả frame.
3. Lấy frame vũ khí tương ứng điểm nắm; xếp các lớp theo metadata, cổ áo/tay che đúng các phần cần che.
4. Xuất/hiển thị cùng tỷ lệ, lọc point, không blur/glow/sharpen để giấu vết ghép. Dịch vị trí theo pixel nguyên; không fit từng frame vào khung.
5. Kiểm chuyển đứng↔đi↔đánh, soi0,5× và chạy1×. Với kiếm,15 pose thật và thời lượng không đều: lấy lực chậm, bổ nhanh, hồi gọn; mốc chạm đúng pose.

## Kiểm trước nhân rộng

Mẫu đứng phải giữ mắt/má/cằm/cổ cùng thước, avatar không có cổ áo. Mẫu chuyển động phải giữ cỡ đầu, thân và độ nét; tay không mọc thêm, kiếm không rời nắm. Rà từng lớp lẫn ảnh cuối trên nền map, so trực tiếp NPC chuẩn. Đúng mask/khớp pixel nguồn chỉ là kiểm kỹ thuật, không tự coi nét và động tác đã đẹp.

Phạm vi số lượng và luồng tạo nhân vật tại [tộc, đầu, bộ đồ theo class](nhan-vat-ghep-da-vu-khi.md). Bản hợp đồng này không tự mở đổi class, cửa hàng hoặc quyền sở hữu đồ; các luật đó chốt riêng.

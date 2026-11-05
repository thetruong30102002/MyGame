> **Cập nhật 03/11/2026 theo yêu cầu mới nhất:** Khôi phục thân nền khi tháo đồ. Đầu và thân là hai asset độc lập; 30 đầu (5 tộc × 3 nam + 3 nữ) dùng chung chuẩn kích thước sọ, mắt, cằm và neo cổ, không chứa áo hay pixel của đầu khác. **Tất cả đầu dùng chung màu da với thân**, kể cả Ma tộc; đặc trưng tộc nằm ở tai, sừng, tóc và mắt. Có một thân nền nam mặc quần lót và một thân nền nữ mặc bikini kín đáo, cùng tỷ lệ NPC và đủ frame/hướng tương ứng với hành động. Bộ đồ theo class thay thế thân nền ở đúng frame, không chồng lên bộ đang mặc; khi tháo đồ hiện thân nền. Vũ khí vẫn là asset riêng. Chỉ xuất/ghép sau khi kiểm từng hướng, cổ, tóc sau vai, tay che đầu và tỷ lệ đứng/đi/chạy/đánh. **Trạng thái:** hai thân nền NPC 80×80 đã vẽ đủ 8 hướng đứng, đi/chạy 8 frame cho 5 hướng nguồn; hai đầu Nhân tộc mẫu đã xoay và ghép thử đi/chạy đủ 8 hướng với phép kiểm hở cổ. 28 ảnh đầu chính diện cũ là bản nháp, 2 mẫu Nhân tộc nữ sai tộc đã loại. Các đầu khác, tóc dài, tấn công, đồ class và xuất game chưa hoàn tất; chưa build.

> **Lịch sử 27/10:** kiếm sĩ 3 bộ/3 kiếm: tặng ban đầu, lv5, lv10. Thay phom/cấu trúc từng cấp, không chỉ đổi màu; mỗi bộ có nam/nữ, nữ nhỏ nhắn, đi/chạy/chém 8 hướng, kiếm tách riêng. Cấu hình: `player-rig-v4/tiers.json`. Quyết định bỏ đồ lót phía dưới đã được yêu cầu ngày 03/11 thay thế.

<!-- starter-class-no-undress -->

**Lịch sử 27/10 (đã thay đổi một phần ngày 03/11):** bắt chọn class ngay lúc tạo nhân vật, cấp 1 đồ và 1 vũ khí cơ bản đúng class. Đồ chỉ đi/chạy/đánh theo class của nó; đầu và vũ khí vẫn tách riêng. Nữ nhỏ nhắn thanh hơn nhưng giữ chuẩn đầu/neo cổ chung. Phần bỏ cởi đồ/thân nền đồ lót không còn áp dụng; không tự reset DB.

# Thân nền, đồ kiếm sĩ và vũ khí thay được — 27/10/2026

Chốt mới trực tiếp của chủ dự án: thân không mặc trang bị vẫn cầm vũ khí và tấn công được. Không buộc người chơi mặc đồ class mới cho phép phát animation/đánh. Đồ class quyết định bộ động tác riêng của đồ; tháo đồ không mất bộ động tác vũ khí của thân nền.

## Phạm vi lần thử

- Thân nền NAM: quần lót đơn giản; NỮ: áo và quần lót kín. Đứng, đi thường, chạy nhanh đủ8 hướng. Cùng chiều cao/neo cổ/global HEAD_STANDARD đã chốt.
- Thân nền có bộ tấn công15 frame cho5 nhóm: kiếm, cung, trượng, thương, khiên. Mỗi nhóm đủ8 hướng, cầm vũ khí ở vị trí hợp lý. Đây là animation đánh cơ bản; không phải toàn bộ140 skill.
- Đồ kiếm sĩ mới có hai dáng NAM/NỮ: áo xanh đậm viền kim loại nhẹ, thân kín da. Chỉ đứng/đi/chạy/chém kiếm đủ8 hướng, không cần vẽ động tác của4 nhóm khác lên bộ kiếm sĩ.
- Kiếm là asset riêng; tối thiểu2 kiếm để đổi trên cùng thân nền/bộ đồ và cùng pose. Không giữ lưỡi/hộ thủ/chuôi kiếm cũ trong lớp thân/áo. Phải vẽ đủ phần áo/quần/cơ thể ở sau kiếm, tránh lỗ khi đổi thanh mỏng hơn.
- Nguồn hướng S/SW/W/NW/N; đối hướng SE/E/NE được lật đúng cả thân và vũ khí theo yêu cầu trước của chủ dự án. Khóa đầu tương ứng đúng hướng. Ghi rõ nguồn/lật, không gọi ảnh lật là một lượt vẽ hướng mới.

## Hợp đồng ghép

Đầu nguyên cụm dùng chuẩn `player-rig-v3/head-standard.json`, không sửa size/offset từng đầu. Thân nền và thân mặc đồ là các lựa chọn thay thế theo slot: chỉ một thân đang được vẽ; không chồng đồ lên người còn mặc bộ cũ. Vũ khí độc lập, có item ID, điểm nắm, trục và góc nhìn theo từng frame. Lớp ngón tay/đầu/arms/weapon tuân theo hướng, không để kiếm nổi trên ngón hoặc tay xuyên đầu.

Khi tháo đồ: vẫn chọn animation theo vũ khí đang cầm, giữ class/skill và các giới hạn nghề hiện có; không dùng việc thiếu áo giáp làm điều kiện chặn đánh. Khi mặc bộ kiếm sĩ, chỉ hợp với kiếm; các bộ class khác làm sau. Đổi nghề/tẩy điểm vẫn theo kế hoạch nghề, không tự miễn phí đổi nghề.

Chu kỳ đi8 frame, chạy8 frame riêng; chém15 frame với nhịp lấy lực chậm, xuống kiếm nhanh, hồi thế gọn. Không dùng cùng hình đi rồi chỉ tăng FPS để gọi là chạy. Một thước thân, root/PPU/cổ xuyên suốt; tấm có pose đứng cuối dùng kiểm mật độ toàn tấm, không fit riêng từng pose.

## Điều kiện kiểm

Ẩn đầu phải trống hoàn toàn (cấm đè đầu). Ẩn vũ khí phải không còn kiếm/chuôi/lỗ hình kiếm. Đổi2 kiếm không đổi một pixel thân/đầu hoặc thời gian animation. Kiểm đủ8 hướng cho đứng/đi/chạy/tấn công, nam/nữ và thân nền5 vũ khí; đặt cạnh NPC tóc trắng ở sảnh cùng cỡ. Chưa rà đủ thì chưa tăng nghiệm thu mỹ thuật.

Đợt đầu ghép trong phòng Thử chiêu Unity, giữ nhân vật và DB thật hiện có. Chỉ phát hành sau kiểm asset và kiểm trong game; không tuyên bố xong8 hướng khi chỉ có S.

Nguồn ảnh/prompt thử mới: `packages/asset-pipeline/sources/player-rig-v4/`; công cụ vẽ built-in ImageGen. Các hình có kiếm liền chỉ là đối chiếu điểm nắm, không được làm lớp thân runtime.

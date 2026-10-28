# Tay cầm thống nhất và vũ khí thay thế

Cập nhật theo yêu cầu chủ dự án **26/10/2026**. Đây là ghi chú công việc cần làm, chưa thay hình hoặc cơ chế cầm vũ khí trong bản game đang phát hành. Tiến độ nằm trong đầu việc `weapon-hand-and-layer-proof` của [kế hoạch tổng](../ke-hoach-nang-cap-the-gioi.md).

**Ưu tiên chốt lại 26/10:** vẫn thử tách vũ khí trong đợt làm nhân vật và tóc. Mẫu đầu dùng hai vũ khí cơ bản cùng loại trên một nhân vật, mỗi lần chỉ cầm một; vũ khí theo cấp để sau. Điểm nghiệm thu quan trọng nhất là bàn tay nắm chuôi tự nhiên và liền mạch, không giả trân.

## Yêu cầu hình ảnh

- Toàn bộ nhân vật dùng **cùng một tay cầm vũ khí chính**, xuyên suốt đứng, đi, chạy và chiến đấu. Bên tay cụ thể chưa chốt; đề xuất tay phải theo cơ thể nhân vật, không phải bên phải màn hình.
- Khi quay sang trái/phải hoặc các hướng chéo, không tự đổi tay cầm chính. Không lật ảnh nếu việc đó làm đảo tay hoặc sai thứ tự vũ khí trước/sau cơ thể.
- Nếu đòn có tay phụ hỗ trợ, giữ nguyên tay cầm chính. Với cung, quy định rõ tay giữ thân cung và tay kéo dây, thống nhất trong toàn bộ frame.
- Dáng người, tóc, quần áo, độ nét và sự liền mạch của bộ đang vẽ là mẫu đối chiếu. Không làm nhân vật phình to, mờ đi, trượt tóc, mất cằm, thừa tay hoặc vũ khí bay khỏi bàn tay khi đổi hành động.

## Khảo sát tách vũ khí để thay được

**Có thể thử tách vũ khí thành lớp riêng**, nhưng phải dựng theo chuyển động của nhân vật. Không quay lại cách dán một ảnh kiếm/trượng cố định lên mọi tư thế.

1. Chốt canvas, tỷ lệ thân, vị trí chân, pivot và mật độ pixel theo bộ hình đã duyệt. Tóc, cơ thể và trang phục tiếp tục vẽ liền; chỉ khảo sát lớp vũ khí.
2. Vẽ thân nhân vật có bàn tay nắm đúng tư thế nhưng không chứa vũ khí cũ. Vì hình hiện tại đã vẽ liền, những vùng bị vũ khí che cần được vẽ bù; chỉ cắt/xóa PNG sẽ để lại lỗ hoặc dấu vũ khí cũ.
3. Đặt điểm nắm và hướng cán cho **từng hướng, từng hành động, từng frame**. Lưu cả offset do cắt atlas; không neo theo góc của ảnh đã trim và không bù bằng scale toàn người.
4. Mỗi vũ khí thay thế có hình/hướng tương ứng với chuyển động đó, cùng chuẩn cán và điểm nắm. Nếu nội suy hoặc xoay ảnh làm vỡ nét pixel, dùng frame vẽ riêng cho góc đó.
5. Có lớp vũ khí phía sau, thân nhân vật và phần bàn tay che chuôi ở phía trước. Khi cần, tách thêm mặt nạ ngón tay/cánh tay theo frame; bàn tay phải nhìn như đang nắm cán, không đặt cả thanh kiếm đè lên tay hoặc chìm hoàn toàn dưới thân.
6. Hệ thống chọn lớp và thứ tự vẽ theo frame/hướng. Hướng ngang phải thấy được vũ khí mà chuôi vẫn nằm dưới phần bàn tay đang nắm. Vệt chém và hiệu ứng theo đúng thời điểm, không dùng để che lỗi ghép.

Các loại vũ khí có cách nắm khác nhau cần mẫu chuyển động tương thích theo class. Không mặc định một bộ neo kiếm dùng được ngay cho cung, trượng, thương và khiên.

## Tái sử dụng cho vũ khí mới

Mục tiêu tái sử dụng sau khi tách đạt: giữ nguyên thân, tóc, trang phục và bộ chuyển động; vũ khí mới cùng kiểu cầm/class chỉ cần asset vũ khí khớp chuẩn chuôi/pivot, điểm nắm và các hướng/góc cần dùng để thay vào. Dùng lại bảng neo và lớp tay che theo frame, không vẽ lại toàn bộ nhân vật cho mỗi vũ khí. Độ dài/lưỡi/đầu vũ khí có thể khác nhưng không kéo đổi kích thước cơ thể; các kiểu cầm khác class phải có chuẩn riêng.

Bộ dùng lại gồm: chuyển động cơ thể, điểm nắm/hướng cán từng frame, offset cắt atlas và mặt nạ tay trước/sau. Mỗi asset vũ khí mới khai pivot ở chuôi, chuẩn cán, kiểu cầm tương thích và hình/góc tương ứng. Kiểm nhanh cả chuỗi sau khi thay để tránh trượt tay hoặc vỡ nét; không dùng việc đổi vũ khí làm lý do vẽ lại thân/tóc.

## Thứ tự thực hiện và điều kiện nghiệm thu

1. Chốt tay cầm và bảng thứ tự trước/sau cho tám hướng; ghi rõ trường hợp tay phụ hỗ trợ.
2. Làm **một nhân vật mẫu**, thử **hai vũ khí cơ bản cùng loại** trên đứng, đi/chạy và tấn công đủ tám hướng. Giữ bản vẽ liền hiện tại để so trực tiếp ở cùng kích thước.
3. Xem từng frame ở pixel gốc và video chuyển động: điểm nắm khớp, không giật khi nối vòng, không đổi kích thước/độ nét giữa đứng và đánh; không sót vũ khí cũ hoặc lộ chỗ xóa.
4. Thử thay qua lại trong Unity, kiểm chuôi/ngón tay, che khuất theo hướng, cắt atlas, camera, ánh sáng và hiệu năng trên PC/Android.
5. Chỉ mở rộng ra 30 nhân vật và năm class khi mẫu thay vũ khí đạt độ liền mạch tương đương bản vẽ liền đã duyệt. Nếu chưa đạt, tiếp tục sửa mẫu, chưa thay đại trà bộ hình hiện có.

**Trạng thái 26/10 — V2:** V1 chưa đạt theo góp ý. V2 dùng đúng frame vẽ liền, giữ bàn tay và trục chuôi gốc, chuôi sau ngón/lưỡi ra trước đúng tư thế; bỏ mặt nạ tay lấy từ dải quay theo góc kiếm. 28/28 frame kiếm gốc tái ghép trùng RGBA, mẫu sắt dùng chung chuôi/hộ thủ và đổi lưỡi. Tóc/mặt/thân ngoài mask vũ khí không đổi. [Xem trực tiếp V2](https://admin.tail024813.ts.net/game/site/media/weapon-proof-v2/index.html) · [Nguồn, prompt và giới hạn](../../packages/asset-pipeline/sources/player-weapon-proof-v2/README.md). Chưa đủ mọi hướng chuyển động, chưa kiểm Unity hoặc phát hành. Các kiểm pixel không chứng nhận toàn bộ tư thế đã tự nhiên.


## Rà lại mỹ thuật chuyển động — 26/10

Chủ dự án chưa chấp nhận chuỗi chém gốc, bản vá R3 và bộ R4. R4 giữ cùng nguồn/tỷ lệ và tách kiếm kỹ thuật được, nhưng hình quá đơn giản so với roster trên trang chủ. Ưu tiên tiếp là vẽ HD pixel chi tiết hơn với một chuẩn đầu/thân/chân, một mật độ pixel cho đứng/đi/chém. Tóc vẫn liền thân; kiếm riêng, chuôi dưới ngón tay, điểm nắm/góc/lớp che lưu từng frame. Không coi tái ghép bằng ảnh nguồn là bằng chứng tỷ lệ và mỹ thuật đã đạt. Chưa đưa bản sửa này vào Unity.

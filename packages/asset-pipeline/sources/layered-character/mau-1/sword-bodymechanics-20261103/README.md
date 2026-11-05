# Thử chém chéo toàn thân — 03/11/2026

Chủ dự án loại bộ xương tấn công trước vì tay méo, kiếm cầm không thật và thân/chân đứng cứng. Đứng yên/đi/chạy đang dùng không sửa. Chỉ thử một đòn kiếm một tay nhìn N, không mở rộng class, không build game.

## Cách thử

- PixelLab `animate_image`, 16 frame mới + ảnh nguồn. Không truyền skeleton, không gọi lại `buildSlash`, không retime bộ chém cũ thành động tác mới.
- Tham chiếu là frame đứng của cùng nhân vật, có kiếm. Kiếm vẽ cùng người để xét grip thực; **chưa phải bộ vũ khí đã tách**, không dùng nguyên ảnh này thay atlas ghép lớp của game.
- `request.json` lưu prompt thực sự gửi (giới hạn API 1.000 ký tự); `receipt.json` giữ job ID để tránh gửi trùng; `complete.json` giữ canvas và số ảnh thực.
- Không kéo, fit, sharpen hoặc rescale từng frame. Trang xem phát nguyên ảnh nguồn, chưa thay đầu, chưa chỉnh màu hoặc vẽ bù.

## Mốc phải xét bằng mắt

1. Lấy đà: chân so le, trọng tâm phía sau, gối mềm, vai/hông xoay vừa phải; khuỷu dưới nắm tay, không xuyên đầu.
2. Ra đòn: bước ngắn, chân trước chịu lực, gót chân sau có thể xoay; thân và cánh tay cùng dẫn nhát chéo từ cao phía vai cầm kiếm xuống thấp phía hông/chân đối diện, đi qua không gian phía trước người.
3. Nắm: bàn tay khép quanh chuôi sát dưới hộ thủ, đốc phía sau lòng bàn tay, cổ tay không gãy; không có frame kiếm rời tay hoặc tự xoay độc lập.
4. Kết thúc: hãm đà có kiểm soát, không bật về đứng ngay; cổ nối liên tục, tay/chân không đổi độ dày và chiều dài giải phẫu. Phân biệt thu ngắn do phối cảnh với phình cơ thể.
5. Chưa đạt một mốc thì ghi rõ, không tự tăng tiến độ hay đưa vào game. Chỉ sau khi tư thế được duyệt mới tách kiếm và rà lớp tay/kiếm/thân từng frame.

Nguồn tham khảo nguyên tắc: [OpenGameArt — chuyển động cả cơ thể](https://opengameart.org/forumtopic/could-anyone-show-me-how-to-make-a-better-attack-animation), [Spine — chốt pose và đường vũ khí trước](https://uk.esotericsoftware.com/forum/d/29574-help-with-directional-attacks/1), [Game Developer — cơ học và tham chiếu thực](https://www.gamedeveloper.com/art/art-of-war-animating-realistic-sword-combat). Đây là lựa chọn thiết kế animation cho game, không khẳng định mô phỏng một thế kiếm lịch sử cụ thể.

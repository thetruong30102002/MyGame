# Nhân vật hoàn chỉnh V17

Hai mẫu mới do ImageGen tạo theo style/tỉ lệ ảnh PixelLab gốc trong dự án:

- `swordsman-8views.png`: nam tóc xanh đêm, choàng xanh rêu, một kiếm thép.
- `mage-8views.png`: nữ tóc vàng tro bện, áo indigo, một trượng pha lê xanh.

Mỗi mẫu có tám hướng S/SE/E/NE/N/NW/W/SW, toàn bộ tóc, thân, trang phục, tay và vũ khí nằm trong cùng ảnh từng hướng. Không có lớp trang bị rời.

`*-native-8views.png` là bản căn nguyên nhân vật lên canvas112×112, root56/100, dùng một scale đều cho cả sheet và nearest sampling. `*-native-preview-3x.png` chỉ phóng nguyên pixel ba lần để xem, không nội suy mềm. Nguồn, hash, transform và prompt nằm trong `drawing-manifest.json` và các file prompt đi kèm.

## Chuyển động cơ bản

Đã vẽ và xuất hai bộ chuyển động liền nhân vật:

- Kiếm sĩ: `idle` (1 khung mẫu), `walk` (8), `run` (8), `attack` bổ kiếm hai tay (12).
- Pháp sư: `idle` (1 khung mẫu), `walk` (8), `run` (8), `cast` niệm phép bằng trượng (12).
- Mỗi bộ có tám hướng: năm hướng được vẽ riêng, ba hướng còn lại lật nguyên frame. Tổng cộng 232 khung mỗi nhân vật, 464 khung cho hai bộ. Không tách tóc, đồ hoặc vũ khí.
- Khung xuất 144×144, root72/128, 48 PPU. Thân mẫu 112×112 được chèn nguyên vào vị trí16/28 để chừa chỗ cho kiếm giơ cao. Mỗi sheet chuyển động chỉ dùng một tỉ lệ đều cho nguyên nhân vật; không phóng to từng tư thế co gối.

Mở [bản xem tương tác](review/index.html): chọn nhân vật/hướng, dừng, tua từng frame, đổi tốc độ hoặc xem chuỗi đứng→đi→chạy→đánh→đứng. Các file `review/*8directions.webp` là ảnh động lossless. Atlas dùng đúng RGBA của các frame, đã kiểm tra khôi phục lại toàn bộ464 frame.

Đầu ra cho pipeline nhân vật chuẩn:

- `assets/characters/player_verdant_sword/`
- `assets/characters/player_ivory_staff/`

`manifest-entry.json` trong mỗi thư mục mô tả clip, FPS và khung chạm. Chưa trộn các entry này vào manifest phát hành, chưa import Unity, chưa build/phát hành bộ V17. Trạng thái mỹ thuật vẫn là bản ứng viên để xem chuyển động; kiểm tra giữ pixel không chứng nhận các nét vẽ giữa mọi tư thế là hoàn toàn giống nhau. Bộ này chưa có khung trúng đòn/né/gục. Cung, thương và khiên mới nằm trong kế hoạch role.

Prompt vẽ bằng công cụ ImageGen tích hợp nằm trong `used-generation-prompts.json`; cách căn nguyên frame và các bản nguồn bị thay nằm trong `registration-notes.md`, `registration-options.json` và `traces/*/trace.json`. Các bản thử V16 không được dùng làm chuẩn chuyển động cho hai mẫu này.

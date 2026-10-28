# Thư viện tạo hình chọn nhân vật

30 mẫu = 5 class × (3 nam + 3 nữ), 240 khung đứng theo8 hướng và30 bộ ra đòn12 frame ×8 hướng (2.880 frame). Trang phục/tóc/một vũ khí vẽ liền trong từng pose. 28 mẫu mới còn thiếu đi/chạy, chưa phải30 nhân vật có đầy đủ chuyển động để chơi.

- `catalog.json`: ID ổn định, tên hiển thị, class, giới tính, biến thể và frame từng hướng. `coreMotionReady` chỉ đúng cho hai mẫu V17; tất cả `importedIntoGame` hiện là false.
- `selection-roster.png` / `selection-roster.json`: atlas RGBA8888, cắt gọn giữ sourceSize144×144, anchor72/128, tham chiếu48PPU.
- `export-proof.json`: kiểm tra cân bằng3/3, không cắt nguồn, khôi phục240 frame từ atlas đúng nguyên RGBA; hash và nguồn từng frame.
- `combat/*.png` / `combat/*.json`: mỗi actor một atlas1728×1152, frame144×144, root72/128,48PPU,16fps. Nguồn5 hướng và phản chiếu toàn frame cho3 hướng đối diện. Endpoint đầu/cuối là nguyên master đứng.
- `combat/export-proof.json`:30 bộ /2.880 frame giữ nguyên RGBA; trạng thái rà hình riêng với việc người dùng duyệt. `catalog.json` có `combatSheetReady`, `combatVisualReview`, `combatIssues` và `combatAtlas`.

Nguồn/prompt/bản xem: `assets/player-integrated/source-art/wholecast-v18/`. Không có lớp tóc, áo hoặc vũ khí rời. Chưa trộn atlas vào manifest phát hành hoặc sửa bản lưu người chơi.

# Đội hình 30 nhân vật V18

Yêu cầu: 5 class kiếm/cung/trượng/thương/khiên, mỗi class 3 nam và 3 nữ. Hai nhân vật V17 đã được người dùng duyệt được tính trong tổng 30. Vẽ mới 28 nhân vật, mỗi người khác tóc, trang phục và đúng một vũ khí vẽ liền. Không ghép các lớp trang bị.

`roster.json` là danh mục đủ 30 vị trí. `generation-jobs.json` lưu từng prompt ImageGen tích hợp. Trạng thái tạo hình/chuyển động được theo dõi riêng, không coi một ô trong danh mục là nhân vật đã hoàn thành hoặc có thể chọn trong game.

Chuẩn: thân tham chiếu112×112, cao khoảng75 pixel; khung runtime144×144, root72/128, 48PPU. Tạo hình 8 hướng; chuyển động dùng nguyên nhân vật theo từng hướng, không thay tỉ lệ từng bộ phận.

Nam pháp sư, cung, thương và khiên được vẽ trước. Các bản vẽ mới và bản xem được lưu trên ổ D trong thư mục này. Màn tạo nhân vật và định danh model/class đã được triển khai trong mã nguồn; bản game đang phát hành chưa đổi.

## Kết quả tạo hình

Đã vẽ đủ30 mẫu, mỗi mẫu8 hướng: 28 mẫu mới + 2 mẫu V17 đã duyệt. Tóc, mặt, thân, quần áo, tay và đúng một vũ khí nằm liền trong từng frame. Tất cả240 khung được xem theo nhóm class và xuất lại vào atlas chọn nhân vật với RGBA giữ nguyên. Mẫu thương `player_spear_m02` dùng bản `-r2` để đầu lưỡi không bị cắt; nguồn cũ được giữ làm lịch sử.

- Bản chọn/xoay nhân vật: `review/index.html` (cũng phục vụ tại `http://127.0.0.1:8768/`).
- Ảnh tổng hợp30 mẫu: `review/roster-30-front-2x.png`.
- Đủ8 hướng theo class: `review/class-*-8directions.png`.
- Thư viện cho màn lựa chọn: `assets/player-roster/v18/catalog.json`, `selection-roster.png`, `selection-roster.json`, `export-proof.json`.
- Prompt ImageGen tích hợp: `generation-jobs.json` và `revision-prompts.json`. Nguồn PNG nằm trong `masters/`; frame chuẩn trong `native/`.

## Trạng thái chuyển động và tích hợp

Hai mẫu V17 đã có bộ đi/chạy/ra đòn được người dùng duyệt. Đã bổ sung ra đòn cho28 mẫu mới; tổng30 bộ, mỗi bộ12 frame ×8 hướng (2.880 frame). Vẽ nguồn theo5 hướng S/SE/E/NE/N; ba hướng đối diện lật nguyên nhân vật quanh root72/128. Kiếm bổ hai tay qua đầu; cung kéo–bắn–thu; trượng niệm/phóng phép; thương đâm hai tay; khiên lấy đà–đẩy–thu, không thêm vũ khí thứ hai.

Đi/chạy: đã vẽ156/280 sheet mới (8 frame mỗi sheet); còn124 sheet. 156 sheet đã tách thành1.248 frame144×144 với phép căn nguyên actor, nearest và alpha0/255; chưa rà hình đủ toàn bộ. Xem trạng thái thực tế tại `movement-status.json` và danh sách `missing-movement.json`. ImageGen báo HTTP429 `usage_limit_reached`, thời điểm được trả về là26/10/2026 lúc18:01:26 giờ Việt Nam. Không dùng pose đứng giả làm chuyển động cho các phần còn thiếu. Pilot gom40 khung đi của nam pháp sư bị sai hướng và đã bị loại (`motion-pilot/review-status.json`).

`trace-movement.py` phiên bản2 căn tỉ lệ một lần cho mỗi sheet; `movement-registration-options.json` lưu sửa bằng lật nguyên frame. `movement-review-cards.py` tạo bảng rà nội bộ; không dựng demo mới theo yêu cầu người dùng. `export-core.py --activate` có chặn khi chưa đủ30 bộ và biên bản rà hình khớp hash.

## Nguồn và kiểm tra ra đòn

- `combat-prompts/`: prompt ImageGen tích hợp, ảnh tham chiếu, đầu ra và hash từng sheet; các bản sửa dùng hậu tố `-r2`.
- `motion/`:140 sheet mới, mỗi sheet12 frame một hướng, cùng các bản sửa. `combat-registration-options.json` chọn nguồn cuối cùng.
- `trace-combat.py`: tách nguyên actor, căn một tỷ lệ cho cả sheet bằng nearest-neighbor; không co giãn theo từng phase, không ghép bộ phận. Một số sheet dùng mốc tóc được kiểm tra để bỏ chiều cao mũi thương khỏi phép đo thân người.
- `combat-traces/`: frame144×144, root72/128 và biên bản hash/biên ảnh. Không có nguồn cuối bị cắt hoặc tràn canvas.
- `export-combat.py`: xuất atlas12×8, thay nguyên pose đầu/cuối bằng master đứng cùng hướng. Kiểm tra2.880 frame giữ nguyên RGBA qua xuất PNG; cả480 endpoint khớp đứng. Alpha chỉ0/255.
- `review/combat-cards/`:30 bảng so ảnh đứng với từng frame và WebP động8 hướng. `combat-art-review.json` ghi việc Codex đã rà hình ở kích thước gốc;28 mẫu mới vẫn chờ người dùng đánh giá, không tự coi là đã duyệt.
- `combat-status.json`: trạng thái ra đòn và đi/chạy tách riêng. Atlas cuối nằm ở `assets/player-roster/v18/combat/`.

Mã nguồn tạo/lưu mới có5 class ×6 lựa chọn, giữ model/class ngoài progress để không bị bản lưu ghi đè; server truyền đúng model cho người chơi khác. Kiểm tra HTTP/SQLite/WebSocket đã qua30 lựa chọn và90 trường hợp sai giới tính/class; C# EditorCompile qua. Chưa import/build/phát hành Unity V18 vì thiếu ảnh. DB thật chưa reset; bản sao lưu nhất quán và kiểm tra integrity=ok nằm trong `.aether-stage/v18-release/backups/` tại gốc repo. Người dùng đã cho phép reset toàn bộ tài khoản/nhân vật, thực hiện sau khi bản mới sẵn sàng và có bản sao lưu cuối.

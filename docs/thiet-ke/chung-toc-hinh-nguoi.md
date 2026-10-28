# Chủng tộc giữ dáng người: Nhân tộc, Elf, Người thú và Ma tộc

Chốt30 đầu/8 hướng27/10: Nhân tộc, Elf, Ma tộc, Thú nhân, Long tộc; mỗi tộc3 nam+3 nữ khác tóc, tổng30 nguyên đầu và240 hình hướng. Long tộc hình người, sừng nhỏ/vảy thái dương là hướng vẽ thử; Thú nhân không đuôi. Đầu dùng chung mọi bộ class, cùng khối đầu/mốc mặt/cổ, không áo dính cổ. Đủ8 hướng đầu trung tính chưa đồng nghĩa đủ pose đầu theo toàn bộ đòn đánh/chuyển động. 


## Quy tắc hiện hành — dùng chung đầu và thân kín da

Chốt hiện hành27/10: tạo nhân vật chọn tộc và nguyên đầu; mỗi tộc3 đầu nam+3 đầu nữ, tổng30 bộ đầu cho5 tộc. Tân thủ mặc đồ lót tối giản (nam quần, nữ áo+quần), đi/chạy tới NPC chọn nghề rồi nhận1 trong5 bộ class và5 vũ khí cơ bản tương ứng. Một thân thon chung nam/nữ, đầu mọi tộc dùng chung các bộ; Thú nhân KHÔNG đuôi. Bộ class kín toàn bộ cổ/tay/chân, cổ áo thuộc thân che cổ da nhưng không che cằm. Tháo trang phục về thân nền đồ lót, không chồng hai bộ; thân nền khớp bảng da theo tộc. Bộ đồ chỉ vẽ thao tác class đó. Đổi nghề có phí phải tẩy/hoàn điểm skill, thay bộ skill/passive/thanh chiêu và cặp đồ–vũ khí đồng bộ; loại tiền/phí chưa chốt.


Yêu cầu chủ dự án **26/10/2026**: bổ sung lựa chọn Elf, Người thú có tai/đuôi và Ma tộc có da khác màu; **tất cả vẫn giống người**, theo tỷ lệ và chất pixel của bộ đang vẽ. Đây là hướng cần thiết kế/thử mẫu, chưa thêm race hoặc asset vào game đang chạy.

## Hướng ngoại hình

| Chủng tộc | Đặc điểm chính | Giữ thống nhất |
|---|---|---|
| Nhân tộc | Tạo hình người hiện tại, làm mẫu đối chiếu | Đầu, thân, tay/chân, pivot và độ nét đã duyệt |
| Elf | Tai nhọn thanh, mặt vẫn như người; tóc ôm đầu và chân tai | Không kéo dài đầu/cổ hoặc đổi chiều cao giữa các hoạt ảnh |
| Người thú | Mặt và cơ thể người, thêm tai thú và đuôi; mẫu đầu đề xuất tai/đuôi mèo | Da người, bàn tay/chân người, không thêm mõm hoặc thân phủ lông. Xử lý tai cũ và tai mới để tránh cảm giác chồng phụ kiện |
| Ma tộc | Mặt và thân người; da tím khói là hướng ưu tiên, có thể thử tím lam hoặc đỏ tro | Giữ mắt/mũi/miệng đọc rõ, cùng tỷ lệ. Sừng nhỏ chỉ là đề xuất cần chốt, không tự thêm vào mọi mẫu |

Loài tai cụ thể của Thú nhân và kiểu sừng Ma tộc cần duyệt. Không làm đuôi.

## Tham khảo trên mạng và đề xuất riêng

- [Miqo'te — trang chính thức FFXIV](https://eu.finalfantasyxiv.com/a_realm_reborn/sp/world/races/miqo-te/) mô tả tai nổi bật và đuôi họ mèo. Dùng làm tham khảo cách nhận diện người có đặc điểm thú; không lấy lịch sử, tên riêng hay bộ đồ của game đó làm nội dung Aether.
- [Hướng dẫn FFXIV của PlayStation](https://www.playstation.com/en-il/editorial/final-fantasy-xiv-an-absolute-beginners-guide/) mô tả Elezen với tai nhọn và dáng thanh. Aether ưu tiên giữ tỷ lệ người đã duyệt, không tự chuyển sang thân dài hơn theo mẫu tham khảo.
- [Tiefling — D&D Beyond, bản Legacy](https://www.dndbeyond.com/species/7-tiefling) mô tả dáng gần người, sừng/đuôi và các sắc da gồm màu da người, sắc đỏ. Đây là tham khảo về dấu hiệu ma tộc hình người, không phải luật màu da hay cơ chế cho Aether.
- **Tím khói/tím lam cho da Ma tộc là đề xuất theo yêu cầu chủ dự án**, không coi mô tả tóc tím trong tài liệu Tiefling là bằng chứng da tím. Có thể thử bảng màu riêng: tím khói `#8F7CA8`, tím lam `#6E7FA3`, đỏ tro `#A57479`. Các màu này chưa được duyệt mỹ thuật; cần đủ màu sáng/tối và thử trên nền map thật.

## Liền mạch theo frame và kiểu tóc

1. Dùng chung khung cơ thể người, canvas, pivot chân, mật độ pixel, nhịp đi/đánh và điểm nắm. Tộc là hướng ngoại hình; không tự đổi hitbox hoặc scale toàn người theo tai/đuôi/sừng.
2. Tai Elf/tai thú/sừng bám đúng đầu và hướng nhìn **từng frame**, phối hợp đường chân tóc và lớp che khuất. Tránh tóc chồng tai, hở da đầu hoặc lệch trán/cằm.
3. Thú nhân chỉ có đặc điểm ở đầu/tai; không vẽ đuôi hoặc hoạt ảnh đuôi.
4. Đổi màu da bằng vùng/mask da riêng: đầu, cổ, tai, bàn tay và các vùng da hở phải đồng nhất; không đổi màu giáp, tóc hoặc vũ khí cùng lúc. Giữ sáng/tối có chủ đích, tránh nhuộm phẳng cả sprite hoặc dùng filter gây nhòe.
5. Tóc, mặt, tai/sừng và cổ da là nguyên đầu; thân mặc nguyên bộ đồ, vũ khí riêng. Đủ hướng/pose/neo cổ và lớp cổ áo theo frame, không gắn tóc hay đầu đứng tĩnh cho mọi hoạt động.
6. Nghiệm thu đủ tám hướng và các trạng thái đang dùng, so đứng với di chuyển/tấn công ở cùng kích thước và độ nét. Kiểm cả đối chiếu nền sáng/tối, hiệu ứng đánh, camera và người chơi khác.

## Luồng tạo nhân vật và phạm vi dữ liệu

**Luồng chốt: tạo tộc→đầu, mặc đồ lót; vào game nói chuyện NPC để chọn nghề/nhận bộ.**

Dự kiến thêm `raceId` vào catalog/lựa chọn ngoại hình theo nhân vật, kết hợp `modelId` và `hairStyleId`; server kiểm tổ hợp hợp lệ và asset đủ, dữ liệu cũ mặc định Nhân tộc. Tên trường và cách chuyển dữ liệu còn ở mức thiết kế; chưa đổi protocol, DB hoặc client. Race không tự có chỉ số/nội tại riêng khi chưa được thiết kế cân bằng.

**Tám nguyên tố vẫn ngẫu nhiên đều ở cấp 10**. Không buộc Elf vào Mộc, Người thú vào Phong hay Ma tộc vào Bóng tối; không tăng tổng 140 chiêu chỉ vì thêm chủng tộc.

Chốt hiện hành27/10: tạo nhân vật chọn tộc và nguyên đầu; mỗi tộc3 đầu nam+3 đầu nữ, tổng30 bộ đầu cho5 tộc. Tân thủ mặc đồ lót tối giản (nam quần, nữ áo+quần), đi/chạy tới NPC chọn nghề rồi nhận1 trong5 bộ class và5 vũ khí cơ bản tương ứng. Một thân thon chung nam/nữ, đầu mọi tộc dùng chung các bộ; Thú nhân KHÔNG đuôi. Bộ class kín toàn bộ cổ/tay/chân, cổ áo thuộc thân che cổ da nhưng không che cằm. Tháo trang phục về thân nền đồ lót, không chồng hai bộ; thân nền khớp bảng da theo tộc. Bộ đồ chỉ vẽ thao tác class đó. Đổi nghề có phí phải tẩy/hoàn điểm skill, thay bộ skill/passive/thanh chiêu và cặp đồ–vũ khí đồng bộ; loại tiền/phí chưa chốt.

## Thử mẫu và trạng thái

- Trước tiên giữ một mẫu Nhân tộc đã đạt; làm mẫu Elf, Người thú và Ma tộc trên cùng chuẩn để so kiểu mặt, tỷ lệ và độ rõ.
- Sau khi mẫu được chốt, thử đủ hướng/hoạt động; tiếp tục kiểm cả nam/nữ, tóc dài và tư thế của các class trước khi mở rộng.
- Chỉ tích hợp lựa chọn tộc vào bước tạo nhân vật và công bố khi đã có đủ asset, tương thích dữ liệu cũ và QA PC/Android trên DB thử.

Đã tra nguồn và ghi yêu cầu; **chưa vẽ, mở lựa chọn hoặc phát hành chủng tộc mới**. Phần trăm duy nhất nằm trong đầu việc `humanoid-races` của kế hoạch tổng.



# Chọn tộc và nguyên đầu khi tạo nhân vật

<!-- rig-v2-scope -->

Chốt mới27/10: giữ thiết kế30 đầu đã được chủ dự án đồng ý (5 tộc, mỗi tộc3 nam+3 nữ,8 hướng), nhưng ĐỘ NÉT CHƯA ĐẠT. Vẽ lại chi tiết tóc/mắt/mặt/viền tại nguồn, so hai NPC PixelLab tóc trắng cùng cỡ game; không sharpen hoặc phóng đầu. Tách thân/bộ NAM và NỮ riêng, cùng chiều cao/khối đầu/PPU/root/neo cổ, khác vai/eo/hông vừa phải. Hai thân thay thế quy tắc thân unisex trước đây. Sửa đầu bị thụt bằng neo cổ/cằm nguyên pixel, không co/phóng ảnh. Cần vẽ đủ bước chân và15 pose bổ kiếm thật cho từng thân, rồi ráp đầu–thân–kiếm với lớp che tay/cổ áo theo frame; chưa nghiệm thu chỉ từ4 key pose. Bộ class kín da, đầu không dính áo, Thú nhân không đuôi.5 class có5 thiết kế đồ cơ bản, mỗi thiết kế có hai dáng nam/nữ và vũ khí tương ứng.


Chốt30 đầu/8 hướng27/10: Nhân tộc, Elf, Ma tộc, Thú nhân, Long tộc; mỗi tộc3 nam+3 nữ khác tóc, tổng30 nguyên đầu và240 hình hướng. Long tộc hình người, sừng nhỏ/vảy thái dương là hướng vẽ thử; Thú nhân không đuôi. Đầu dùng chung mọi bộ class, cùng khối đầu/mốc mặt/cổ, không áo dính cổ. Đủ8 hướng đầu trung tính chưa đồng nghĩa đủ pose đầu theo toàn bộ đòn đánh/chuyển động. 


Chốt hiện hành27/10: tạo nhân vật chọn tộc và nguyên đầu; mỗi tộc3 đầu nam+3 đầu nữ, tổng30 bộ đầu cho5 tộc. Tân thủ mặc đồ lót tối giản (nam quần, nữ áo+quần), đi/chạy tới NPC chọn nghề rồi nhận1 trong5 bộ class và5 vũ khí cơ bản tương ứng. Hai thân thon nam/nữ riêng, cùng chuẩn ghép đầu, đầu mọi tộc dùng chung các bộ; Thú nhân KHÔNG đuôi. Bộ class kín toàn bộ cổ/tay/chân, cổ áo thuộc thân che cổ da nhưng không che cằm. Tháo trang phục về thân nền đồ lót, không chồng hai bộ; thân nền khớp bảng da theo tộc. Bộ đồ chỉ vẽ thao tác class đó. Đổi nghề có phí phải tẩy/hoàn điểm skill, thay bộ skill/passive/thanh chiêu và cặp đồ–vũ khí đồng bộ; loại tiền/phí chưa chốt.

Đầu là nguyên cụm mặt+tóc+tai/sừng+cổ da, không tách tóc đơn lẻ. Luồng tạo chỉ tộc→đầu; không còn chọn3 bộ đồ khi tạo. Tới NPC trong game mới chọn nghề và nhận bộ đồ–vũ khí.

## Chuẩn tài nguyên

Khóa khối đầu/mắt/má/cằm/cổ theo master, không lấy hộp tóc để scale. Một rig thân thon chung nam/nữ; đầu các tộc ghép được mọi bộ class trên cùng chuẩn cổ. Avatar không có áo/cổ áo; cổ áo kín thuộc thân đồ che phía trước, giữ nguyên cằm. Đủ hướng/pose đầu và lớp che theo frame, không gắn một đầu đứng tĩnh cho mọi hoạt động. Thú nhân không đuôi.

## Mẫu đã có

Hai đầu nam xanh đen/tóc nâu hướng S và thân kiếm sĩ thon kín da. Đã kiểm mốc mặt/cổ, ghép lớp và cùng root/PPU; chưa đủ đi/chém15 frame/tám hướng hoặc nghiệm thu nét toàn bộ. [Xem mẫu](https://admin.tail024813.ts.net/game/site/media/weapon-proof-v2/player-standard-v7/unisex/index.html). Nguồn/prompt trong packages/asset-pipeline/sources/player-standard-v7/.

## Dữ liệu và tích hợp

Catalog chỉ mở đầu/pose đã đủ và tương thích rig. Lưu ID tộc/đầu, thân nền và bộ nghề; máy chủ whitelist các cặp class/đồ/vũ khí. Avatar độc lập với nghề. Khi đổi nghề giữ đầu, tẩy điểm/thay bộ skill và trang bị đồng bộ. Cần kiểm client/nhân vật cũ, người chơi khác, lưu lại và PC/Android trước phát hành. Không reset DB chỉ vì đổi ghi chú.

[Phạm vi hiện hành](nhan-vat-ghep-da-vu-khi.md) · [Hợp đồng ghép](hop-dong-ghep-nhan-vat.md). Tiến độ hair-creation-baked-variants trong kế hoạch tổng, chưa triển khai UI/lưu mới.

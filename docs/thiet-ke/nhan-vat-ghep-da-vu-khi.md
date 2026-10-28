<!-- starter-class-no-undress -->

**CHỐT MỚI NHẤT27/10: bắt chọn class ngay lúc tạo nhân vật, cấp1 đồ và1 vũ khí cơ bản đúng class. BỎ cởi đồ/thân nền đồ lót, ngừng vẽ thân đồ lót/tấn công5 vũ khí trên thân không đồ. Hình luôn tối thiểu bộ cơ bản của class; thay/bỏ trang bị quay về bộ cơ bản. Đồ chỉ đi/chạy/đánh theo class của nó; đầu và vũ khí vẫn tách riêng. Nữ nhỏ nhắn thanh hơn nhưng giữ chuẩn đầu/neo cổ chung. Chỉ thị này thay các đoạn đồ lót/NPC chọn nghề bên dưới, không reset DB.**

# Nhân vật ghép — đầu theo tộc, thân thon chung và bộ nghề

<!-- no-head-overpaint -->

**NGHIÊM CẤM VẼ/GHÉP ĐÈ ĐẦU NÀY LÊN ĐẦU KHÁC — chỉ thị trực tiếp27/10: thân/bộ đồ và mọi lớp tay/găng/cổ áo phải tách sạch toàn bộ đầu, mặt, tóc, tai, sừng, cổ da cũ TRƯỚC KHI ghép avatar mới. Tắt avatar phải thấy bộ đồ không có đầu, không còn tóc bạc ở hai bên/gáy/khe tay hoặc pixel mặt người. Không chữa bằng phóng avatar/che cổ. Nguồn có đầu chỉ để đối chiếu, không dùng nguyên frame làm lớp thân runtime. Phải rà từng frame/hướng không avatar rồi thử đầu ngắn/nhỏ/Ma tộc trên nền sáng tối. Còn phần đầu cũ thì LOẠI, không đưa game/phát hành/tăng nghiệm thu. Quy tắc đầy đủ: docs/thiet-ke/cam-ghep-de-hai-dau.md.**


<!-- rig-v2-scope -->

Chốt mới27/10: giữ thiết kế30 đầu đã được chủ dự án đồng ý (5 tộc, mỗi tộc3 nam+3 nữ,8 hướng), nhưng ĐỘ NÉT CHƯA ĐẠT. Vẽ lại chi tiết tóc/mắt/mặt/viền tại nguồn, so hai NPC PixelLab tóc trắng cùng cỡ game; không sharpen hoặc phóng đầu. Tách thân/bộ NAM và NỮ riêng, cùng chiều cao/khối đầu/PPU/root/neo cổ, khác vai/eo/hông vừa phải. Hai thân thay thế quy tắc thân unisex trước đây. Sửa đầu bị thụt bằng neo cổ/cằm nguyên pixel, không co/phóng ảnh. Cần vẽ đủ bước chân và15 pose bổ kiếm thật cho từng thân, rồi ráp đầu–thân–kiếm với lớp che tay/cổ áo theo frame; chưa nghiệm thu chỉ từ4 key pose. Bộ class kín da, đầu không dính áo, Thú nhân không đuôi.5 class có5 thiết kế đồ cơ bản, mỗi thiết kế có hai dáng nam/nữ và vũ khí tương ứng.


Chốt30 đầu/8 hướng27/10: Nhân tộc, Elf, Ma tộc, Thú nhân, Long tộc; mỗi tộc3 nam+3 nữ khác tóc, tổng30 nguyên đầu và240 hình hướng. Long tộc hình người, sừng nhỏ/vảy thái dương là hướng vẽ thử; Thú nhân không đuôi. Đầu dùng chung mọi bộ class, cùng khối đầu/mốc mặt/cổ, không áo dính cổ. Đủ8 hướng đầu trung tính chưa đồng nghĩa đủ pose đầu theo toàn bộ đòn đánh/chuyển động. 


Chốt hiện hành **27/10/2026**, thay các hạn mức 2/3 bộ mỗi tộc hoặc mỗi class,48/72/360 tổ hợp trước đó.

## Tân thủ và chọn nghề

**Tạo nhân vật: chọn tộc → chọn nguyên đầu.** Người mới mặc đồ lót tối giản: nam quần, nữ áo+quần; có thể đi/chạy, nói chuyện NPC rồi chọn nghề. Khi chọn nghề được cấp **bộ đồ và vũ khí cơ bản đúng class**.

| Phần | Phạm vi đợt đầu |
| --- | --- |
| Tộc | Nhân tộc, Elf, Ma tộc, Thú nhân, Long tộc |
| Nguyên đầu | Mỗi tộc3 nam+3 nữ khác tóc; tổng30 bộ đầu |
| Thân nền | Một chuẩn thân thon chung nam/nữ, đồ lót phù hợp |
| Đồ nghề | **5 bộ cơ bản** cho kiếm/cung/trượng/thương/khiên |
| Vũ khí nghề | **5 vũ khí cơ bản**, một loại tương ứng mỗi class |

Tháo trang phục trở về thân nền đồ lót, giữ nguyên đầu/tộc. Thân mặc bộ đồ **thay nguyên frame thân nền**, không đè áo giáp lên đồ cũ gây mặc hai bộ. Thân nền cần pose hợp hành động được hỗ trợ khi chưa có/tháo đồ; chưa tự suy ra quy tắc cho phép đánh khi thiếu cặp trang bị.

## Ba nhóm tài nguyên và chuẩn ghép

1. **Nguyên đầu:** mặt+tóc+tai/sừng+cổ da, không dính áo/cổ áo/trang sức. Đầu mọi tộc ghép được với các bộ nghề; không khóa đầu theo class. Thú nhân chỉ phát triển phần đầu, **không có đuôi**.
2. **Thân mặc bộ đồ:** một dáng **thon dùng chung nam/nữ**, vai/eo/chi gọn, cùng chiều cao và cổ. Bộ đồ chỉ vẽ đứng/đi/chạy/đánh của class đó; không vẽ mỗi bộ cho đủ cả năm class.
3. **Vũ khí:** riêng theo điểm nắm/trục/lớp ngón tay của từng frame. Bộ đồ và vũ khí đang dùng phải cùng class và họ animation; trong cùng họ có thể thay vũ khí mới tương thích.

Khóa tỷ lệ khối đầu/mắt/má/cằm/cổ theo master, không theo hộp tóc; không scale từng bộ/frame/hành động. Bộ class không có da hở; da thân nền đồ lót khớp màu da đầu. Cùng rig, canvas/root/PPU, hướng/pose, neo cổ và thứ tự lớp che; đủ pose đầu tương ứng, không dùng một đầu đứng tĩnh cho mọi hoạt động. Tóc dài có phần trước/sau khi cần.

Ba nhóm không đồng nghĩa luôn dán ba ảnh theo một thứ tự cố định: tay/cổ áo/vũ khí phải có mask/lớp trước–sau theo pose. Chi tiết tại [hợp đồng ghép](hop-dong-ghep-nhan-vat.md) và [quy chuẩn nét vẽ](quy-chuan-net-ve-nhan-vat.md).

## Bộ class kín da

Cổ cao ôm sát che toàn bộ cổ da, không che cằm/mặt. Tay áo dài nối kín găng đủ ngón; quần và giày không hở da. Vì đầu các tộc dùng chung thân đồ, không để da người lộ ở cổ/tay/chân khi ghép đầu ma tộc màu khác. Avatar vẫn chỉ có đầu/cổ da, không dính áo; lớp cổ áo thuộc thân đồ và che phía trước theo frame. Thân nền đồ lót khi tháo đồ mới cần đồng bộ bảng da với tộc.

## Bộ kiếm sĩ và thứ tự vẽ

Bộ xanh/giáp sắt V7 hiện có được chọn làm **thiết kế cơ bản kiếm sĩ**; hai đầu nam xanh đen/tóc nâu tiếp tục dùng. Vẽ lại thân thon hơn để ghép đầu nam/nữ tự nhiên. Không đổi đầu theo chiều ngang thân hoặc tự phóng người.

Hoàn thiện kiếm trước, gồm đứng/đi/chạy và chém15 pose thật đủ8 hướng: lấy lực chậm → tăng tốc bổ nhanh/dứt khoát → hồi gọn. Nét tối thiểu ngang hai NPC PixelLab tóc trắng tại cùng cỡ trong game. Duyệt mẫu Elf/Ma tộc/Thú nhân trước nhân rộng; sau đó hoàn thiện thân đồ và động tác riêng từng class còn lại.

## Đổi nghề có phí và bộ skill

Đổi nghề phải cập nhật đồng bộ **class + cặp đồ–vũ khí/animation + bộ skill/passive + điểm skill + thanh chiêu**. Tẩy phân bổ skill nghề cũ, hoàn số điểm đã phân để học nghề mới; máy chủ kiểm điểm thực và loại bỏ chiêu nghề cũ khỏi cấu hình đang dùng.

Phí và các thay đổi trên xử lý cùng giao dịch, tránh trừ tiền mà nghề/skill/đồ chưa đổi. Loại tiền, mức phí, giới hạn đổi, xử lý đồ nghề cũ và việc tẩy điểm chỉ số cơ thể chưa chốt. Không tự thêm giá/cửa hàng/thanh toán. Nguyên tố vẫn thiên phú ngẫu nhiên đều ở cấp10, không tự reroll khi đổi nghề; giữ ngân sách140 chiêu.

## Hiện trạng và tích hợp

[Mẫu thử nguyên đầu V7](https://admin.tail024813.ts.net/game/site/media/weapon-proof-v2/player-standard-v7/index.html) đã có hai đầu nam đứng S, kiểm đường cổ không dính áo và giữ mốc mặt. [Thân kiếm sĩ thon mới](https://admin.tail024813.ts.net/game/site/media/weapon-proof-v2/player-standard-v7/unisex/index.html) đang rà, dùng nguyên hai đầu này. Nguồn và prompt tại `packages/asset-pipeline/sources/player-standard-v7/`.

Mới có mẫu đứng, chưa đủ15 chém/tám hướng hoặc UI/NPC chọn nghề/respec. Chưa thay roster Unity hay reset dữ liệu thật. Khi tài nguyên đạt mới tích hợp xem trước/lưu ID đầu–tộc–bộ, kiểm whitelist/cấp phát/tương thích client cũ và QA PC/Android.

Tiến độ: `characters-modular-multiweapon`, `hair-creation-baked-variants`, `humanoid-races`, `class-selection-career-change` trong [kế hoạch tổng](../ke-hoach-nang-cap-the-gioi.md).

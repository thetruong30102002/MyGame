> **Chuẩn đầu hiện hành27/10:** [quy-chuan-dau-global.md](quy-chuan-dau-global.md). Khối má20±1px; canvas96, cằm(48,65), neo cổ(48,66); runtime dùng global, không offset/scale từng avatar. Thay thước80px/fit cổ cũ.

# Quy chuẩn nét vẽ và chuyển động nhân vật

<!-- no-head-overpaint -->

**NGHIÊM CẤM VẼ/GHÉP ĐÈ ĐẦU NÀY LÊN ĐẦU KHÁC — chỉ thị trực tiếp27/10: thân/bộ đồ và mọi lớp tay/găng/cổ áo phải tách sạch toàn bộ đầu, mặt, tóc, tai, sừng, cổ da cũ TRƯỚC KHI ghép avatar mới. Tắt avatar phải thấy bộ đồ không có đầu, không còn tóc bạc ở hai bên/gáy/khe tay hoặc pixel mặt người. Không chữa bằng phóng avatar/che cổ. Nguồn có đầu chỉ để đối chiếu, không dùng nguyên frame làm lớp thân runtime. Phải rà từng frame/hướng không avatar rồi thử đầu ngắn/nhỏ/Ma tộc trên nền sáng tối. Còn phần đầu cũ thì LOẠI, không đưa game/phát hành/tăng nghiệm thu. Quy tắc đầy đủ: docs/thiet-ke/cam-ghep-de-hai-dau.md.**


<!-- rig-v2-scope -->

Chốt mới27/10: giữ thiết kế30 đầu đã được chủ dự án đồng ý (5 tộc, mỗi tộc3 nam+3 nữ,8 hướng), nhưng ĐỘ NÉT CHƯA ĐẠT. Vẽ lại chi tiết tóc/mắt/mặt/viền tại nguồn, so hai NPC PixelLab tóc trắng cùng cỡ game; không sharpen hoặc phóng đầu. Tách thân/bộ NAM và NỮ riêng, cùng chiều cao/khối đầu/PPU/root/neo cổ, khác vai/eo/hông vừa phải. Hai thân thay thế quy tắc thân unisex trước đây. Sửa đầu bị thụt bằng neo cổ/cằm nguyên pixel, không co/phóng ảnh. Cần vẽ đủ bước chân và15 pose bổ kiếm thật cho từng thân, rồi ráp đầu–thân–kiếm với lớp che tay/cổ áo theo frame; chưa nghiệm thu chỉ từ4 key pose. Bộ class kín da, đầu không dính áo, Thú nhân không đuôi.5 class có5 thiết kế đồ cơ bản, mỗi thiết kế có hai dáng nam/nữ và vũ khí tương ứng.


Chốt30 đầu/8 hướng27/10: Nhân tộc, Elf, Ma tộc, Thú nhân, Long tộc; mỗi tộc3 nam+3 nữ khác tóc, tổng30 nguyên đầu và240 hình hướng. Long tộc hình người, sừng nhỏ/vảy thái dương là hướng vẽ thử; Thú nhân không đuôi. Đầu dùng chung mọi bộ class, cùng khối đầu/mốc mặt/cổ, không áo dính cổ. Đủ8 hướng đầu trung tính chưa đồng nghĩa đủ pose đầu theo toàn bộ đòn đánh/chuyển động. 


## Quy tắc hiện hành — dùng chung đầu và thân kín da

Chốt hiện hành27/10: tạo nhân vật chọn tộc và nguyên đầu; mỗi tộc3 đầu nam+3 đầu nữ, tổng30 bộ đầu cho5 tộc. Tân thủ mặc đồ lót tối giản (nam quần, nữ áo+quần), đi/chạy tới NPC chọn nghề rồi nhận1 trong5 bộ class và5 vũ khí cơ bản tương ứng. Hai thân thon nam/nữ riêng, cùng chuẩn ghép đầu, đầu mọi tộc dùng chung các bộ; Thú nhân KHÔNG đuôi. Bộ class kín toàn bộ cổ/tay/chân, cổ áo thuộc thân che cổ da nhưng không che cằm. Tháo trang phục về thân nền đồ lót, không chồng hai bộ; thân nền khớp bảng da theo tộc. Bộ đồ chỉ vẽ thao tác class đó. Đổi nghề có phí phải tẩy/hoàn điểm skill, thay bộ skill/passive/thanh chiêu và cặp đồ–vũ khí đồng bộ; loại tiền/phí chưa chốt.




Cập nhật **27/10/2026** theo góp ý của chủ dự án. Nhân vật và vũ khí mới cần nét hơn bản thử hiện tại; **hai NPC PixelLab tóc trắng nam/nữ ở sảnh là mốc đối chiếu độ nét bắt buộc**. Giữ đúng cùng một cơ thể ở đứng/đi/chạy/chém. Sửa hướng kiếm hoặc ghép khớp kỹ thuật không đồng nghĩa mỹ thuật đã đạt.

Nguồn máy đọc và trang xem được sinh từ [standard.json](../../packages/asset-pipeline/sources/player-weapon-proof-v2/style-standard-v1/standard.json). [Xem quy chuẩn kèm ảnh gốc trên web](https://admin.tail024813.ts.net/game/site/media/weapon-proof-v2/style-standard.html).

## Mẫu gốc và thước tỷ lệ

Lục Phong trên trang chủ giữ vai trò đối chiếu thiết kế/tỷ lệ; Lam Kiếm và Tử Yên bổ sung vật liệu/vũ khí. **Độ nét đối chiếu trực tiếp `npc_silver_youth` và `npc_silver_youth_f`, hai mẫu PixelLab tóc trắng đang đứng ở sảnh.** Lấy frame từ atlas gốc, giữ pixel gốc và PPU48, chỉ thêm khoảng trống để đặt cùng root; lưu nguồn/frame/hash. Bản thử mới còn kém nét theo góp ý 27/10, không tự coi là mốc mỹ thuật đã đạt. Trang xem dùng bản sao đúng nguồn, không lấy R4 bị chê làm master.

## Độ nét nhân vật và vũ khí — bắt buộc 27/10

- Tối thiểu đạt độ rõ của hai NPC tóc trắng ở sảnh tại **cùng camera, PPU và kích thước trong game**; tiếp tục thêm chi tiết sạch nếu cần. Không so ảnh phóng lớn của mẫu mới với ảnh nhỏ của NPC rồi kết luận nét hơn.
- So tóc/mái/da đầu, mắt–mặt–cằm, cổ áo, nếp vải, viền giáp, đai/khóa/giày, cạnh và khắc kim loại. Vũ khí cần đọc rõ lưỡi, hộ thủ, chuôi, vật liệu và chỗ ngón tay nắm; không thành một vệt sáng/mảng bệt.
- Độ nét phải giữ qua mọi frame đứng, đi/chạy và chém ở tám hướng, cùng lưới pixel và tỷ lệ cơ thể. Tránh nhiễu hạt, màu loang, đường viền mềm hoặc đổi kiểu nét giữa hành động.
- Tăng chất lượng tại ảnh nguồn; ảnh phóng nearest chỉ để soi. Sharpen/blur/glow, tăng tương phản hoặc phóng người không được dùng thay việc vẽ đúng chi tiết.
- Đặt cạnh hai NPC trên nền map thật, kiểm native/1×, phóng nguyên lần để soi và phát chuyển động trước khi duyệt. Mẫu chưa đạt vẫn là bản thử, không tăng % mỹ thuật hoặc nhân rộng72 tổ hợp.

## Nhịp chém kiếm — lấy lực chậm, ra đòn nhanh

**Bộ chém vẽ lại: 15 frame**, tăng ba pose chuyển tiếp thật so với bản12 đang thử. Giữ đủ các bước nối tư thế, không thêm bằng cách lặp ảnh hoặc kéo dài thời gian đều cả chuỗi.

- Chia rõ lấy lực → tăng tốc → chạm/đi hết nhát chém → hồi thế. Nâng kiếm và chuyển trọng tâm chậm, có chủ đích; khi bổ xuống thì tăng tốc rõ rệt, nhanh nhất gần lúc chạm, nhát chém dứt khoát liền mạch.
- Tay, vai, thân và lưỡi kiếm đi cùng một động tác; không khua cổ tay lỏng, quay tay đều tốc độ hoặc để kiếm xoay riêng khỏi nắm tay. Tư thế hai tay nâng cao vẫn dựng đúng trục kiếm.
- Điều khiển bằng thời lượng từng frame/đường thời gian, không áp một FPS đều cho toàn nhát. Đủ frame trung gian để nối động tác; nhanh ở pha đánh không có nghĩa giật bỏ pose hoặc làm nhòe người.
- Kết thúc nhát chém rõ, hồi thế gọn và có kiểm soát; không rê tay/lưỡi lơ lửng quá lâu. Đứng và chém giữ cùng đầu/thân/chân, root/PPU và chất nét.
- Khi tích hợp đòn thật, mốc chạm, sát thương, hiệu ứng và âm thanh phải khớp pha đánh nhanh. Rà ở 0,5× để soi pose/điểm nắm và 1× để duyệt cảm giác dứt khoát; thời lượng cụ thể cần thử/duyệt, không tự coi ghi chú này là bản animation đã sửa.

| Thuộc tính | Mẫu gốc | Thước HD cho lượt vẽ tiếp |
| --- | --- | --- |
| Canvas | 144 × 144 | 288 × 288 |
| Root | (72, 128) | (144, 256) |
| Cao cơ thể đứng | 75 px | 150 px |
| PPU | 48 | 96 |
| Thước bề ngang đầu S | 24 px | 48 px |

Đường bao đầu thực lấy từ master từng hướng. Không đo kích thước đầu bằng phần tóc lộ ra khi tay/kiếm đang che. Hệ số mật độ 2× áp dụng chung cả bộ; PPU 96 giữ nguyên chiều cao nhân vật trong thế giới. **Ảnh phóng nearest 2× chỉ là thước, chưa phải hình HD vẽ mới.** Bản HD phải thêm chi tiết thật trên lưới pixel mới.

## Nét vẽ bắt buộc

### Một hợp đồng ghép đầu–thân đồ dùng lại

Chốt bổ sung27/10: **avatar chỉ gồm nguyên đầu và cổ DA; không có áo, cổ áo, áo choàng hoặc trang sức dính vào cổ**. Cổ áo thuộc thân đồ, có lớp che riêng theo tư thế. Không kéo áo cũ theo avatar khi đổi bộ.

Khóa khối đầu, khoảng mắt, bề ngang má, cằm và độ rộng cổ theo master; không đo tỷ lệ bằng hộp bao tóc. Tóc có thể đổi kiểu/độ dài quanh cùng khối đầu nhưng không làm mặt to/nhỏ đi. Không phóng/co đầu theo từng bộ đồ hoặc hành động. Mẫu S V7 lưu thước tại `packages/asset-pipeline/sources/player-standard-v7/head-standard.json`; hai đầu thử đã kiểm cùng mốc mắt/má/cằm/cổ trong sai số tối đa1px native. Đây chưa là chứng nhận đủ chuyển động hoặc đạt mỹ thuật.

Đầu, thân đồ và vũ khí dùng cùng hợp đồng phiên bản/frame/hướng/pose, mốc chân/PPU và neo cổ. Từng hành động lưu đúng vị trí, góc và lớp che bởi cổ áo/tay/vũ khí; chỉ tái dùng những pose đầu thực sự tương thích, không dùng một đầu đứng tĩnh cho cả bộ. Các tổ hợp tộc/dáng/màu da phải khớp; tóc dài có lớp trước/sau nếu cần. Một bộ mới muốn dùng chung phải qua QA ghép đủ hành động, không tự coi đúng kích thước canvas là liền mạch.

Chốt hiện hành27/10: tạo nhân vật chọn tộc và nguyên đầu; mỗi tộc3 đầu nam+3 đầu nữ, tổng30 bộ đầu cho5 tộc. Tân thủ mặc đồ lót tối giản (nam quần, nữ áo+quần), đi/chạy tới NPC chọn nghề rồi nhận1 trong5 bộ class và5 vũ khí cơ bản tương ứng. Hai thân thon nam/nữ riêng, cùng chuẩn ghép đầu, đầu mọi tộc dùng chung các bộ; Thú nhân KHÔNG đuôi. Bộ class kín toàn bộ cổ/tay/chân, cổ áo thuộc thân che cổ da nhưng không che cằm. Tháo trang phục về thân nền đồ lót, không chồng hai bộ; thân nền khớp bảng da theo tộc. Bộ đồ chỉ vẽ thao tác class đó. Đổi nghề có phí phải tẩy/hoàn điểm skill, thay bộ skill/passive/thanh chiêu và cặp đồ–vũ khí đồng bộ; loại tiền/phí chưa chốt.

**Khảo sát nguyên đầu để bán avatar riêng (yêu cầu mới27/10):** cho phép thử cụm mặt+tóc+tai/sừng liền nhau, thân mặc nguyên bộ đồ và vũ khí thành nhóm độc lập. Không quay lại dán tóc tĩnh lên một đầu khác. Bản avatar giữ đủ hình/hướng/pose cần thiết, neo cổ và lớp cổ áo che theo từng frame; tóc dài có lớp trước/sau nếu cần. Khớp tỷ lệ và màu da đầu–cổ–tay, đặc điểm tộc và dáng nam/nữ. Chỉ mở rộng sau khi một mẫu ghép đẹp như bản vẽ liền; mục tiêu bán avatar và bộ đồ riêng chưa phải chức năng cửa hàng đã có.

**Đồ nền cơ bản, thời trang đẹp dành cho giai đoạn bán sau (chốt 27/10):** lấy mẫu kiếm đang làm làm mức trang bị tân thủ: áo choàng ngắn đơn sắc, giáp nhẹ vừa đủ, đai da, quần/giày thông dụng và kiếm cơ bản. Nét tóc/mặt, viền, đường may, nếp vải và cạnh kim loại phải rõ; độ nét cao không đồng nghĩa thêm hoa văn, vàng ngọc hay giáp hoành tráng. Không đưa cánh, aura, vương miện, đồ hiếm hoặc mức trang trí của NPC vào bộ nền. Hai NPC tóc trắng dùng để so chất lượng pixel. Thời trang bán sau có khoảng khác biệt về thiết kế/độ nổi bật; giá, độ hiếm và chỉ số chưa được chốt.

- Tóc xanh đen được chia thành lọn nhỏ, góc gãy và cụm sáng/tối có chủ đích như ảnh trang chủ; tóc ôm sọ, mái che trán tự nhiên, không thành mũ tròn/phồng, mảng nhựa trơn hoặc gai ngẫu nhiên.
- Mặt giữ mắt, sống mũi gợi nhẹ, cằm và đường tóc của cùng nhân vật. Giữ cùng cỡ đầu qua mọi hành động; nét mắt/mái tóc không đổi thành kiểu chibi khác khi đi hoặc chém.
- Viền dùng màu tối của từng vật liệu, mảnh và có chọn lọc. Giữ các cụm pixel sắc ở kích thước gốc; tránh viền đen dày, mảng màu phẳng và bóng nhựa như các bản R4 bị góp ý.
- Giáp có cạnh, mảng kim loại sáng/tối và chi tiết khắc nhỏ đọc được; đai da có khóa, mép và đường may; quần có nếp và đường ghép; giày có cổ, dây/đai và đế. Chi tiết đi theo cấu trúc đồ, không rải hạt nhiễu lên bề mặt.
- Áo choàng xanh rừng có nếp vải, lớp trong và viền ngà mảnh. Giữ thiết kế cổ áo, đai và trang phục gốc; không tự thay bằng cúc vàng lớn hoặc bộ đồ đơn giản khác.
- Độ giàu chi tiết ít nhất bằng roster trang chủ. Có thể vẽ ở mật độ pixel cao hơn, nhưng ảnh gốc phải thật sự có nét mới; tăng zoom, sharpen, tương phản hoặc đổi viền không được tính là vẽ chi tiết hơn.
- Cùng hướng sáng, bảng màu vật liệu, độ dày viền và cỡ cụm pixel cho cả đứng, đi/chạy và chém. Tránh ép bảng màu quá ít khiến đồ bị bệt hoặc dùng nền ảnh khác làm đổi chất liệu.

## Tỷ lệ và nét khi chuyển động

- Lấy cùng một master hoàn chỉnh liền tóc/mặt/thân làm nguồn chuẩn. Đối chiếu đúng hướng S/E/N...; đầu quay ngang được so với master ngang, không ép theo bề ngang đầu chính diện.
- Khóa độ dài thân, bề ngang vai/eo, chiều dài và độ dày tay/chân, cỡ đầu và giày. Một canvas, root, tỷ lệ xuất và PPU cho toàn bộ bộ chuyển động; không fit người theo bounds có cả kiếm/tay/áo choàng.
- Đứng, đi và chém giữ cùng tỷ lệ pixel. Đầu nhấp nhô do bước chân hoặc thân hạ do gập gối là thay đổi tư thế; đầu, mặt, giáp, bàn chân vẫn giữ kích thước và mật độ nét.
- Ảnh sinh sai giải phẫu hoặc đổi camera phải bị loại/sửa ở nguồn. Không chữa bằng kéo riêng đầu, co từng frame hoặc phóng mỗi hành động để vừa khung.
- Giữ đủ khoảng trống trên đầu và hai bên cho vũ khí. Không để kiếm chạm nhân vật ở ô bên cạnh; ảnh nguồn chồng ô phải bị loại trước khi tách.
- Kiểm lần lượt từng frame ở 1× và 2×, rồi phát nhịp chậm/bình thường. So cùng camera, cùng mức phóng, cùng nền và đường chân; rà cả nét, đầu/eo/chân và đoạn nối về đứng.

## Kiếm riêng, nhân vật vẫn liền

- Tóc, mặt, thân và quần áo vẫn xuất thành một frame nhân vật hoàn chỉnh. Chỉ tách vũ khí và phần ngón tay che chuôi cần thiết cho thay kiếm.
- Mỗi frame lưu điểm nắm nguyên pixel, trục chuôi, góc kiếm và thứ tự che. Cùng tay cầm chính; chuôi đi dưới các ngón, hộ thủ ở trước nắm tay, đuôi chuôi về sau/dưới tay.
- Hai tư thế giữ kiếm cao trước nhát bổ S: hai tay nắm cùng chuôi phía trên đầu; trục chuôi/lưỡi dựng thẳng lên, không nghiêng sang phải. Lưỡi cong Tử Yên giữ hình cong riêng nhưng trục cầm vẫn dựng đúng.
- Đoạn chém thay đổi góc theo động tác vai–khuỷu–cổ tay một cách liên tục; kiếm là vật cứng, không xoay độc lập khỏi nắm tay. Giữ đúng bàn tay che chuôi sau khi thay vũ khí.
- Vũ khí mới dùng cùng chuẩn native/PPU của bộ nhân vật. Nếu nâng mật độ 2×, nâng chuẩn vũ khí cùng một hệ số cố định cho cả bộ; không đổi kích thước kiếm theo từng frame.
- Phải tái ghép kiếm gốc từ các lớp độc lập để so với bản vẽ liền, rồi thử kiếm thay thế. Kiểm trùng pixel chỉ chứng minh ghép lớp đúng, không chứng nhận tư thế, nét vẽ hoặc tỷ lệ đã đẹp.

## Trước mỗi lượt sinh ảnh

- Đọc chuẩn này; gắn ảnh master gốc, hướng tương ứng và thước tư thế vào prompt. Ghi rõ vai trò từng ảnh: chuẩn style/nhân dạng, chuẩn tỷ lệ, mẫu động tác.
- Chốt một mẫu đứng HD có nét/tỷ lệ đạt trước khi nhân rộng. Mỗi lượt thử ban đầu tối đa 4 pose để soi mắt, tóc, giáp, tay nắm và cỡ pixel; tránh sinh cả 24 frame hoặc 30 nhân vật khi style còn sai.
- Prompt phải nhắc cụ thể nét tóc, mặt, viền, kim loại, da thuộc, vải, giày và mật độ chi tiết. Không chỉ dùng các từ chung như đẹp hơn, pixel art hay giống PixelLab.
- Rà cả hình gốc và hình xuất native. Nếu không đạt style hoặc tỷ lệ, ghi lý do loại; không đưa vào bộ mẫu đã chốt và không tăng % mỹ thuật.
- Lưu prompt, ảnh tham chiếu/hash, phiên bản nguồn, chuẩn canvas/root/PPU và kết quả rà cùng asset. Giữ nguyên mẫu cũ đã chốt để đối chiếu/lùi lại.

## Tình trạng nghiệm thu

- `attack-r3`: Vá riêng chuỗi bổ vẫn khác tỷ lệ/nét với đứng; không dùng làm chuẩn.
- `family-r4`: Cùng nguồn và ghép kiếm kỹ thuật được, nhưng nét quá đơn giản, thiếu chi tiết so với trang chủ; bị chủ dự án chê xấu.
- `family-hd-r5`: Các ảnh HD nháp chưa đạt nét; tư thế giơ kiếm chỉ là sửa hướng động tác, không phải nghiệm thu style.

Kế hoạch tổng giữ tiến độ theo phần đã chốt. Chưa nghiệm thu bộ mỹ thuật mới, chưa đủ tám hướng/chuyển động và chưa phát hành thay thế trong Unity.




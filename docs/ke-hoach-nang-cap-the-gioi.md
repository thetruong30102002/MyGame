# Kế hoạch tổng — tái thiết thế giới và phát triển Aether

## Chốt hiện hành — thân nền đồ lót và chọn nghề qua NPC

CHỐT HIỆN HÀNH27/10: tạo nhân vật chọn TỘC → ĐẦU, mặc đồ lót tối giản (nam quần, nữ áo+quần), chạy/đi nói chuyện NPC để chọn nghề rồi nhận bộ đồ+vũ khí. Đợt đầu5 class có5 bộ đồ cơ bản+5 vũ khí cơ bản; không còn bộ vải tân thủ riêng. Tháo bộ đồ trở về thân đồ lót, giữ đầu/tộc. Mỗi tộc3 đầu nam+3 đầu nữ khác tóc,4 tộc=24 bộ đầu. Bỏ hạn mức3 bộ/tộc hoặc3 bộ/class và phép nhân72/360 trước đó. Ba nhóm tài nguyên: nguyên đầu (mặt+tóc+tai/sừng+cổ DA), thân mặc bộ đồ, vũ khí. Cổ áo/áo choàng thuộc thân, không dính avatar. Một dáng thân THON CHUNG NAM/NỮ: vai/eo/chi gọn, giữ chiều cao/khối đầu/neo cổ, không vẽ riêng một thân đô khi ghép đầu nữ. Khóa khối đầu/mắt/má/cằm/cổ; chung rig/hướng/pose/PPU/root/neo cổ/lớp che; không scale theo tóc/bộ/frame hoặc dùng một đầu đứng tĩnh cho mọi hoạt động. Đầu mọi tộc ghép chung mọi bộ class; da hở thân/tay khớp da đầu. Thú nhân chỉ phần đầu, KHÔNG ĐUÔI/animation đuôi. Bộ đồ chỉ vẽ đứng/đi/chạy/đánh của class hỗ trợ, không nhân qua5 class. Vũ khí+bộ đồ cùng class/animationFamilyId. Thân trang phục thay nguyên thân đồ lót, không chồng hai bộ. Thân nền đồ lót dùng chung khi chưa có/tháo đồ, cần pose tương thích hành động đang hỗ trợ. Bộ xanh V7 được chọn làm thiết kế cơ bản kiếm sĩ, vẽ lại thon; hai đầu nam hiện có tiếp tục dùng. Đổi nghề có phí phải đổi đồng bộ class, tẩy phân bổ điểm skill nghề cũ/hoàn điểm để học nghề mới, thay bộ skill/passive, cập nhật thanh chiêu và cặp đồ–vũ khí/animation. Máy chủ kiểm điểm thực/chiêu hợp lệ và giao dịch phí/nghề/skill/đồ đồng bộ, tránh mất phí hoặc còn skill nghề cũ. Loại tiền, mức phí, giới hạn đổi, xử lý đồ cũ và việc tẩy điểm chỉ số cơ thể chưa chốt; không tự đặt phí/loại tiền. Nguyên tố vẫn theo thiên phú cấp10, không tự reroll khi đổi nghề. Xem [đặc tả hiện hành](thiet-ke/nhan-vat-ghep-da-vu-khi.md). Các hạn mức2/3 bộ và48/72/360 phía dưới là lịch sử đã thay.

## Ghi chú mới 28/10 — tách thân, đầu, vũ khí vẽ bằng PixelLab

Chủ dự án đồng ý hướng 5 tộc × 5 class bằng lớp rời (đầu việc `pixellab-layered-character-pilot`, 0%). Vẽ liền mọi tổ hợp cần khoảng 52.800 frame; tách lớp chỉ cần khoảng 3.500 frame thân (10 thân) + 240 hình đầu + khoảng 80 hình vũ khí. PixelLab không xuất lớp nên tách bằng pipeline: thân gốc nam/nữ mặc đồ class bằng transfer_outfit, chuyển động bằng skeleton, đầu mẫu cắt sạch theo đường cổ; đầu 30 × 8 hướng theo head-standard.json chỉ dịch theo neo cổ; vũ khí vẽ sẵn khoảng 16 góc đặt vào điểm nắm, có lớp ngón tay che chuôi. Làm mẫu thử Kiếm sĩ (nam + nữ, 2 đầu Nhân tộc/Ma tộc, đi + chém 15 frame) trong Unity, so hai NPC tóc trắng, đạt mới mở rộng. Các bản thử mannequin/rig/weapon-proof cũ đã dọn ngày 28/10 để làm mới hoàn toàn. Bộ 30 đầu cũ bị loại (`heads30-eight-directions` về 0%): vẽ lại 30 đầu × 8 hướng bằng PixelLab cùng style hai NPC tóc trắng và thân PixelLab.

## Hướng mới ngày 26/10/2026

Nguồn nội dung hiện hành: [Định hướng Aether](dinh-huong-aether.md). Truyện cũ đã lưu trữ; nhân vật đời cũ sau này thành NPC. Phạm vi mới48 tạo hình gốc: bốn tộc, mỗi tộc6 nam +6 nữ; mỗi tạo hình hỗ trợ năm bộ vũ khí. 8 nguyên tố phát hiện cấp 10 với tỷ lệ đều; khuôn viên, chợ, hồ câu và mê cung là hướng phát triển đã chốt. Chỉ các nội dung đã hoàn thiện mới được công bố là đã phát hành.

## Ưu tiên thực hiện — nhân vật trước (chốt 26/10/2026)

1. Hoàn thiện nhân vật trước các công trình/map mới: dáng, mặt, tóc ôm đầu và độ nét; cùng tỷ lệ khi đứng, đi/chạy và tấn công đủ tám hướng. Hoàn thiện bộ kiếm trước rồi áp dụng cho48 tạo hình (4 tộc ×6 nam/6 nữ), mỗi tạo hình hỗ trợ5 loại vũ khí.
2. Trước mắt dùng **vũ khí cơ bản đúng class**, mỗi nhân vật một vũ khí. **Vẫn thử tách vũ khí ngay trong đợt ưu tiên nhân vật**: một nhân vật/hai vũ khí cơ bản cùng loại để thử thay, mỗi lần chỉ cầm một. Bàn tay phải nhìn như nắm chuôi thật, đúng điểm nắm và lớp tay che theo từng frame/tám hướng. Hoàn thiện tóc theo từng frame, không dán tóc tĩnh.
3. **Vũ khí theo cấp để giai đoạn sau**, sau khi nhân vật và chuyển động đạt. Lúc đó mới chốt dải cấp, tạo hình/hiệu ứng từng cấp dựa trên kết quả mẫu tách vũ khí cơ bản; chưa tự đặt mốc cấp hoặc chỉ số.

Nhà trọ Thistlewood và các map mới giữ lại kế hoạch, không còn là việc vẽ trước nhân vật. Imagegen đã hoạt động lại; đã sinh nguồn mẫu tách vũ khí cho nhân vật, nhà/map vẫn làm sau. Việc ghi lại ưu tiên không tính là hoàn thành phần vẽ.

## Cấu trúc nền mới nhất27/10

Mỗi tộc có hai bộ đồ tân thủ cơ bản: bộ1 gồm3 nam+3 nữ, bộ2 gồm3 nam+3 nữ, khác tóc. Cả hai bộ đều có bản vừa dáng nam và nữ; không hiểu thành một bộ chỉ nam và một bộ chỉ nữ. Tổng12 tạo hình/tộc ×4 tộc=48 lựa chọn tạo hình nền, mỗi mẫu hỗ trợ5 bộ vũ khí thành240 tổ hợp. Theo đề xuất mới được phép thử tách nguyên cụm đầu (mặt+tóc+tai/sừng) làm avatar, thân mặc nguyên bộ đồ và vũ khí riêng. Chỉ mở rộng khi ghép liền mạch như bản vẽ liền: neo cổ/lớp cổ áo theo frame, khớp race/dáng/màu da đầu–cổ–tay, tóc dài có lớp trước/sau khi cần. Không tách tóc đơn lẻ hoặc gắn đầu tĩnh vào mọi hoạt động. Mục tiêu bán avatar và bộ đồ riêng; giá/chỉ số/cửa hàng chưa chốt hoặc triển khai. Hoàn thiện kiếm trước; chuẩn nét hai NPC tóc trắng; nhịp chém15 frame lấy lực chậm, ra đòn nhanh.

## Chốt mới 27/10 — 48 tạo hình và quy chuẩn vẽ lại

Chốt 27/10: 48 tạo hình gốc = Nhân tộc/Elf/Ma tộc/Thú nhân, mỗi tộc 6 nam + 6 nữ. Mỗi tạo hình hỗ trợ kiếm/cung/trượng/thương/khiên: 240 tổ hợp tạo hình–vũ khí, không phải240 danh tính. Hoàn thiện bộ kiếm trước; một mẫu Elf, một Ma tộc, một Thú nhân để duyệt style trước khi nhân rộng. Nguồn30 cũ chỉ đối chiếu/tái sử dụng. Luật đổi class/chiêu theo vũ khí chốt riêng; giữ ngân sách140 chiêu và8 nguyên tố. Quy chuẩn làm việc bắt buộc mới 27/10: nhân vật và vũ khí phải nét hơn bản thử hiện tại, tối thiểu không kém hai NPC PixelLab tóc trắng nam/nữ ở sảnh (npc_silver_youth/npc_silver_youth_f), so cùng camera/PPU/kích thước trên nền map thật. Kiểm tóc/mắt/mặt/cằm, vải/giáp/giày, lưỡi/hộ thủ/chuôi và tay nắm ở native lẫn chuyển động. Không giả nét bằng phóng người, sharpen/blur/glow hoặc tăng nhiễu. Mẫu hiện tại chưa được coi đạt mốc nét này. Bộ kiếm vẽ lại15 frame: thêm3 pose nối thật; lấy lực chậm → tăng tốc khi bổ → ra đòn nhanh/dứt khoát, nhanh nhất gần lúc chạm → hồi thế gọn. Thời lượng từng frame và mốc va chạm phải khớp, không quay tay đều/khua cổ tay/giật bỏ pose hoặc đổi tỷ lệ người. Đồ nền giữ mức tân thủ cơ bản như mẫu kiếm hiện tại, nét rõ nhưng thiết kế giản dị; trang phục đẹp nổi bật/cầu kỳ dành cho thời trang bán sau, chưa tự đặt giá/chỉ số. Đây là yêu cầu lượt vẽ lại theo chuẩn, không phải bộ15 frame đã phát hành. Chuẩn: CLAUDE.md, docs/thiet-ke/quy-chuan-net-ve-nhan-vat.md và style-standard-v1/standard.json. Xem [phạm vi48](thiet-ke/48-tao-hinh-da-vu-khi.md). Các mốc mới vẫn0% tới khi có sản phẩm nghiệm thu.

## Ghi chú mới — tay cầm và vũ khí thay thế (26/10/2026)

Toàn bộ nhân vật dùng cùng một tay cầm chính, giữ xuyên suốt tám hướng và mọi chuyển động. Có thể khảo sát tách riêng vũ khí để thay, nhưng bắt buộc liền mạch như hình vẽ hiện tại: thân sạch, điểm nắm và phần bàn tay che chuôi theo từng frame. Chỉ thử một nhân vật/hai vũ khí trước; bên tay cụ thể chưa chốt, đề xuất tay phải. [Đặc tả và checklist](thiet-ke/tay-cam-va-vu-khi-thay-the.md). Chưa vẽ hoặc triển khai mẫu.

Mục tiêu tái sử dụng sau khi tách đạt: giữ nguyên thân, tóc, trang phục và bộ chuyển động; vũ khí mới cùng kiểu cầm/class chỉ cần asset vũ khí khớp chuẩn chuôi/pivot, điểm nắm và các hướng/góc cần dùng để thay vào. Dùng lại bảng neo và lớp tay che theo frame, không vẽ lại toàn bộ nhân vật cho mỗi vũ khí. Độ dài/lưỡi/đầu vũ khí có thể khác nhưng không kéo đổi kích thước cơ thể; các kiểu cầm khác class phải có chuẩn riêng.

## Mẫu tách vũ khí — V2 đối chiếu bản vẽ liền (26/10/2026)

**Chủ dự án đã chốt cách ghép V2:** giữ làm chuẩn. Đang thử chuyển kiếm cong/hộ thủ bạc tím của Tử Yên vào cùng rig, không vẽ lại người. Trang V2 có mục chọn vũ khí; kiếm Tử Yên mới chỉ là mẫu thử, chưa được duyệt riêng.


V1 chưa đạt theo góp ý chủ dự án. V2 giữ nguyên 28 frame pixel gốc của Lục Phong: 8 hướng đứng, 8 frame đi E, 12 frame bổ S. Chỉ tách vũ khí; tóc/đầu/thân/trang phục vẫn liền. Điểm nắm, hướng lưỡi và hình tay lấy từ bản liền; chuôi nằm sau ngón tay, lưỡi ra phía trước theo từng tư thế. Khi ghép lại kiếm gốc, 28/28 frame trùng toàn bộ RGBA bản liền. Kiếm sắt thử thay phần lưỡi trên cùng chuẩn chuôi/hộ thủ; không làm đổi người. [Xem so sánh V2 trực tiếp](https://admin.tail024813.ts.net/game/site/media/weapon-proof-v2/index.html) · [Nguồn/prompt/giới hạn kiểm](../packages/asset-pipeline/sources/player-weapon-proof-v2/README.md). Vẫn cần rà mỹ thuật, thêm các hướng chuyển động và thử Unity; chưa phát hành hoặc đổi DB.

## Ghi chú mới — chọn tóc khi tạo nhân vật (26/10/2026)

Cho người chơi chọn kiểu tóc ở bước tạo nhân vật. Phương án ưu tiên là biến thể nguyên nhân vật đã xuất sẵn đủ tám hướng/hoạt động, giữ khuôn mặt, thân và trang phục; không ghép một ảnh tóc tĩnh trong runtime. Chỉ cho chọn biến thể đã qua nghiệm thu. Số kiểu chưa chốt, thử một nhân vật/hai kiểu trước. [Đặc tả](thiet-ke/chon-toc-khi-tao-nhan-vat.md). Chưa vẽ, sửa UI hoặc phát hành tính năng.

## Ghi chú mới — chủng tộc và thiết kế lại web (26/10/2026)

Bổ sung hướng Elf, Người thú và Ma tộc nhưng tất cả vẫn có dáng người, cùng chuẩn chuyển động/tóc/tay cầm. Xem [đặc tả chủng tộc](thiet-ke/chung-toc-hinh-nguoi.md). Đồng thời làm lại toàn bộ UI web và admin theo yêu cầu mới, giữ React SPA và các chức năng. Mỗi lần sửa/thêm kế hoạch đều phải build web rồi kiểm đúng đầu việc trên API admin ở link Tailscale thật.

## Ghi chú mới — tăng độ nét nhân vật (26/10/2026)

Nếu có thể, vẽ nhân vật nét và rõ hơn một chút theo chất pixel của mẫu đã duyệt. Ưu tiên khuôn mặt, tóc, viền trang phục và vũ khí; chi tiết bằng cụm pixel sạch, không tăng nhiễu hoặc dùng filter sharpen/blur. Giữ cùng tỷ lệ cơ thể, canvas, chân neo và mật độ pixel ở đứng yên, di chuyển, tấn công và đủ tám hướng. Thử một nhân vật trước, so ảnh 1×/2× và chuyển động trong Unity rồi mới áp dụng cho bộ48 tạo hình. Đây là yêu cầu bổ sung chưa thực hiện, tiến độ 0%; không tự tăng kích thước nhân vật hoặc đưa ảnh thử vào bản đang chơi.

## Yêu cầu đã chốt

- Vẽ lại trung tâm của **tất cả 13 vùng** thành nơi đông đúc nhất vùng: nhà cao, đẹp, nhiều đồ và sinh hoạt, đúng văn hóa địa phương. **Giữ nhà nhỏ cũ làm nhà phụ**, không xóa hoặc phóng ảnh cũ thành nhà chính.
- Rà mọi map. Nấm, Phế tích, Hư Không phải có bộ cảnh riêng; hoàn thiện Mộc, Ánh sáng, Bóng tối, không chỉ đổi màu cây hoặc ghép nhà/quái của vùng khác.
- Thêm quái và boss từng vùng. Kiểm lại boss cũ ít frame; boss lớn phải có tầm vóc lớn hơn và đọc rõ đòn.
- Vẽ lại bản đồ tổng cho địa lý mới. Thêm **lâu đài trên không có một vị thần**, nơi hé lộ tri thức toàn thế giới và lịch sử khởi nguyên.
- Thành chính, nhà vua và phe phái phải hợp vùng và cốt truyện. Tên mới, số nhà, loài quái, boss và quan hệ chính trị dưới đây là **đề xuất thiết kế**, chưa phải chi tiết được chủ dự án duyệt.
- Khử nhiễu, nét pixel nhất quán; phân biệt bản đang chơi, đang làm và dự kiến trên web; công bố nội dung theo từng phần hoàn thành.

## Hiện trạng và giới hạn kiểm tra

Đã kiểm kê **174 map / 13 vùng / 25 boss** trong asset sản xuất. Đã xem 174 ảnh minimap render có prop và bảng tổng quan 13 trung tâm; đây là **rà bố cục ở ảnh thu nhỏ**, chưa thay cho chạy Unity và đánh giá ở tỷ lệ chơi. Dữ liệu NPC runtime còn ở lớp game nên số `npcs` rỗng trong map JSON không được diễn giải là game không có NPC.

Rừng Nấm dùng lại nền/cây/nhà sàn đầm lầy. Phế tích dùng lại cây màu và cối xay cao nguyên. Hư Không dùng nhiều cảnh núi lửa. Mộc/Sáng/Tối có cây riêng nhưng nhà và quái/boss còn mượn. Trung tâm nhiều vùng cùng bố cục chữ thập, khoảng rỗng lớn, ít công trình tạo đường chân trời. Interior chủ yếu còn hình phòng/hành lang đơn giản. Cổng Nguyên Tố cũng cần điểm nhấn và đồ cảnh thật.

25 boss đều có ít nhất một chuỗi dưới ngưỡng mới (idle <4, đi/đánh/gục <6 ảnh khác nhau). **Phần lớn đòn đánh hướng chính đã có 8 ảnh thật**, thiếu nhiều ở hướng chéo tạm và chuỗi đi; không được gọi tất cả boss là chỉ có một frame. Ưu tiên Quỷ vương 96×104 và Golem dung nham có chuỗi hướng chính dưới 4 ảnh; rồi Hoả thần, Kraken, nhóm rồng. Đếm bằng hash RGBA của ảnh cắt từ atlas, không tính số key trỏ cùng một ô là frame mới.

Bằng chứng và cách chạy lại: `npx tsx scripts/audit-world-plan.mts`, `python docs/tools/audit-world.py`; ảnh và JSON ở `.aether-stage/world-renewal/`. Không sửa atlas game khi audit.

## Chuẩn mỹ thuật và nghiệm thu

1. Chọn nhân vật PixelLab gốc làm thước. Chốt một bảng tỷ lệ native trước khi vẽ: cửa cao khoảng 1,3–1,5 lần thân người; một tầng nhà khoảng 1,8–2,2 lần chiều cao người. Nhà chính 2–4 tầng theo vùng; công trình biểu tượng cao hơn nhưng không che đường chiến đấu. Đây là mục tiêu thử, phải duyệt cảnh mẫu trong Unity.
2. Giữ hướng sáng, góc nhìn, viền và mật độ pixel. Vẽ đủ kích thước gốc; lọc Point, không blur/upscale ảnh nhỏ. Nền giảm tương phản, điểm nhấn gom cụm, tránh dither và điểm sáng vụn; không khử nhiễu bằng làm nhòe toàn ảnh.
3. Tách mái/tường/đồ trước-sau nếu cần che người đúng; footprint chỉ ở chân nhà, có fade mái khi đi khuất. Cửa, thang, hiên và đường vào phải đi được. Nhà nhỏ giữ ID và tái bố trí vào kho, chuồng, nhà vườn, phố phụ.
4. Mỗi trung tâm có các cụm chợ, nghề thủ công, dân cư và một landmark. NPC có vòng đi/nghỉ/giao tiếp nhẹ; không nhồi đồ vào trục cổng, điểm hồi sinh và lối chiến đấu. Dùng pool/culling/atlas, đo hiệu năng theo thiết bị mục tiêu.
5. Đề xuất quái thường: idle 6, di chuyển 8, tấn công 10–12, trúng đòn 4, gục 8 frame/hướng. Boss: idle 8, đi 10–12, đánh 12–16 với lấy đà/ra đòn/hồi, gục 10–12. Hướng chéo không được đứng hình bằng lặp slot. Cho phép mirror có kiểm tra tay/vũ khí; không tự đảo bất đối xứng sai thiết kế.
6. Boss lớn vẽ lại để thân hiện rõ khoảng 2,5–4 lần người theo loài, rồng/Kraken có thể lớn hơn; thử camera trước. Tách sprite bounds, chân neo, hurtbox và vùng đánh; đòn báo trước nhìn được khi boss che cảnh. Không tăng hitbox bằng scale ảnh mù quáng.
7. Nghiệm thu bằng ảnh 1× và 2×, video đứng/đi/đánh, so kích thước cùng nhân vật, kiểm góc cắt atlas, viền alpha, sorting, va chạm, cổng, minimap và PC/APK. Dữ liệu và minimap phải dựng lại từ pipeline, không sửa tay một bản rồi bỏ bản còn lại.

## Địa lý, chính trị và Thiên Thành

Giữ tuyến khởi đầu Thistlewood → các vùng theo cấp; sắp lại vị trí địa lý và các đường giao thương hợp lý thay vì đổi tọa độ cổng tùy tiện. Mộc là nhánh rừng cổ, Sáng là thánh địa tách khỏi sa mạc, Tối là vùng trú ẩn đêm tách khỏi Hư Không. Chừa lớp địa lý cho hồ câu và các cửa mê cung; mê cung là điểm phụ, không thay hết vùng ngoài trời.

Thành ốc đảo dự kiến có quân chủ, danh tính chưa chốt; Đe Đỏ là pháo đài hội đồng người lùn; Phế tích là toà thành triều đại đã sụp; Hư Không là thành trì liên quân. Đề xuất thánh thành ở vùng Sáng và thành trú ẩn vùng Tối, không biến tất cả làng thành cung vua. Mỗi phe có vùng ảnh hưởng, mục tiêu, đồng minh/đối thủ và quan hệ buôn bán; chưa thêm cơ chế PvP phe hoặc thuế trước khi thiết kế.

**Thiên Thành Khởi Nguyên** là tên tạm. Vẽ quần đảo mây với một lâu đài lớn ở tầng trên của tranh tổng, đường lên riêng có điều kiện; bên trong có đại thư viện và điện khởi nguyên. Vị thần ở đó lưu giữ tri thức của mọi vùng và ký ức khởi nguyên. Chia tiết lộ thành chương: nguồn thế giới → nguyên tố → triều đại Aether → rạn nứt hiện tại. Điều kiện mở, danh tính thần, quan hệ với thần cũ và phần bí mật cuối chưa chốt. Public web chỉ teaser; admin giữ bản kế hoạch đầy đủ.

Tranh bản đồ tổng phải có tầng đất/biển/mây, 13 vùng đọc được, ranh giới địa hình, tuyến giao thông, thành chính và biểu tượng Thiên Thành. Chữ và ghim ở lớp UI, không để AI vẽ chữ trong ảnh. Thay tranh cũ đồng thời ở Unity và web sau khi ghim khớp.

## Trình tự làm và công bố

- GĐ0: kiểm kê và brief (đã có bằng chứng).
- GĐ1: mẫu chuẩn, chính trị, bố trí bản đồ và giao diện web.
- GĐ2: Thistlewood mẫu; ưu tiên Nấm/Phế tích/Mộc/Sáng/Tối và nhân vật đang dở.
- GĐ3: các trung tâm/cảnh quan vùng còn lại.
- GĐ4: quái và boss mới; sửa 25 boss cũ theo audit.
- GĐ5: Thiên Thành, tranh tổng và cổng/chương truyện.
- GĐ6: chạy hết map, tối ưu và build PC/APK.
- GĐ7: các hệ thống gameplay đã chốt; có thể làm song song sau khi đủ nền dữ liệu.

Thông tin công khai lên theo mốc: giới thiệu hướng phát triển → ảnh trước/sau đã duyệt → clip gameplay → ghi chú phiên bản và link tải sau build thật. Chưa công bố ngày hẹn tự suy ra, chưa gọi kế hoạch là bản cập nhật đã chơi được. Giữ tải/cập nhật client cũ hoạt động. Không reset DB khi chỉ đổi web; reset chỉ thuộc đợt phát hành nhân vật đã được yêu cầu trước đó, sau build/QA và backup.

## Các tính năng đã chốt cần theo dõi cùng

Mục tiêu mới27/10:48 tạo hình gốc (4 tộc ×6 nam/6 nữ), mỗi tạo hình đủ5 bộ vũ khí, hoàn thiện kiếm trước. Nguồn30 tạo hình cũ giữ đối chiếu, chưa đồng nghĩa đã có bộ48 mới. 140 chiêu gồm kiếm 3 phái ×10, khiên/thương/cung ×10, pháp sư 8×10; mỗi bộ 7 chủ động, 3 bị động, chiêu cuối chuyên dồn sát thương boss. Thiên phú phát hiện ở cấp 10, một trong 8 nguyên tố/user với xác suất đều 12,5%.

Khuôn viên riêng/user: trồng/thu hoạch thực phẩm và nhiên liệu, chế tạo/nấu ăn, sửa và trang trí nhà, bạn bè tham quan. Hồ câu chung cùng bạn bè. Chợ giao thương lúa mì/cây giống/cá/lưu niệm/đồ nhà. Nhiều mê cung cung cấp châu báu/vàng/đồ nhà. Chi tiết nguồn: `ke-hoach-nha-rieng.md`, `ke-hoach-xa-hoi.md`, `ke-hoach-nguyen-to.md`, `phac-thao-ba-phai-kiem.md`; không tự coi gameplay đã triển khai vì đã có tài liệu.

## Việc không cần sinh ảnh — đợt 1 ngày 26/10

Đã hoàn thành **phần thiết kế và dữ liệu** cho chính trị/phe phái, Thiên Thành/thần tri thức và bố trí địa lý mới: 13 vùng, 20 phe, 13 quan hệ, bốn chương thư khố. Xem [bản đầy đủ](thiet-ke/chinh-tri-dia-ly-thien-thanh.md) và mục **Chính trị, địa lý và Thiên Thành** trên admin. Đây chưa phải bản vẽ hoặc gameplay mới đã phát hành.

Đã rà toàn bộ 174 map/424 lối: 12 cặp vùng, 24 lối qua vùng, không có đích/toSpot lỗi hoặc map bị tách khi bỏ qua điều kiện cấp/boss. Bản đồ tổng cũ và cổng đang chơi được giữ nguyên. Hồ câu/mê cung và tuyến lên Thiên Thành là chỗ dành trong thiết kế.

Ba việc thiết kế giữ khối lượng và trọng số mốc cũ (10/45/25/20), đổi tên mốc cho đúng công việc không có bước vẽ. Không tăng % nhà, quái, boss hoặc tranh tổng vì đã viết xong thiết kế. Bộ lọc **Chỉ hiện việc không phụ thuộc bản vẽ mới** giúp theo dõi đợt ưu tiên này.

## Tiến độ — nguồn dùng chung với web admin

Mốc mỗi đầu việc có trọng số tổng 100; chỉ tích `done` kèm `evidence` khi có sản phẩm/check thực tế. `% đầu việc = tổng trọng số mốc xong`; `% tổng = Σ(% việc × khối lượng)/Σ(khối lượng)`. Khối lượng là ước lượng tương đối, không phải giờ hay lịch hẹn. Web tự tính từ khối dữ liệu dưới đây mỗi lần tải; **không có bản % chép riêng**. Khi đổi phạm vi/trọng số phải ghi ngày và lý do, vì mẫu số tổng có thể đổi.

Phần dưới gồm brief từng vùng, số liệu audit boss và checklist công việc. `architecture/life/politics/newMobs/newBoss` là đề xuất; `finding`, kích thước và số frame là hiện trạng kiểm kê. Art mới để 0% tới khi thực hiện. Web chỉ có quyền đọc; sửa file này và bấm tải lại để cập nhật.

## Phạm vi ghép mới nhất: tộc, đầu, bộ

Chốt mới nhất27/10: tạo nhân vật chọn TỘC → ĐẦU → BỘ. Mỗi tộc3 đầu nam+3 đầu nữ khác tóc,3 bộ đồ nền để chọn độc lập. Mỗi bộ có thân vừa dáng nam/nữ. Tổng24 bộ đầu,12 thiết kế đồ/24 bộ thân,18 tổ hợp đầu–đồ mỗi tộc và72 tổ hợp cho4 tộc; không phải72 nhân vật vẽ liền độc lập. Hỗ trợ5 vũ khí thành360 tổ hợp ngoại hình–vũ khí. Avatar nguyên đầu gồm mặt+tóc+tai/sừng và CỔ DA, tuyệt đối không dính áo/cổ áo/áo choàng/trang sức. Cổ áo thuộc thân đồ và che theo frame. Khóa khối đầu/mắt/má/cằm/cổ theo master, không scale theo bounds tóc, bộ đồ hoặc từng hành động. Hợp đồng chung phiên bản rig/hướng/pose/PPU/root/neo cổ/lớp che, tương thích tộc/dáng/màu da đầu–cổ–tay; không gắn một đầu đứng tĩnh cho mọi hoạt động. Xem [đặc tả hiện hành](thiet-ke/nhan-vat-ghep-da-vu-khi.md). Các hạn mức40/48 dưới đây là lịch sử.

<!-- aether-plan:start -->
```json
{
  "version": 1,
  "updated": "2026-10-28",
  "title": "Tái thiết thế giới Aether",
  "scope": "Tiến độ của kế hoạch nâng cấp này; không phải % hoàn thành toàn bộ game.",
  "method": "Mỗi việc = tổng trọng số các mốc đã hoàn thành / tổng trọng số mốc. Tổng = trung bình có trọng số khối lượng việc. Chỉ tích mốc khi có bằng chứng; không tự tăng theo thời gian.",
  "groups": [
    "Chuẩn bị",
    "Trung tâm vùng",
    "Cảnh quan",
    "Quái và boss",
    "Boss cũ",
    "Cốt truyện",
    "Bản đồ tổng",
    "Nghiệm thu",
    "Tính năng đã chốt",
    "Nhân vật",
    "Web và công bố"
  ],
  "totals": {
    "regions": 13,
    "maps": 174,
    "bosses": 25,
    "lowFrameBosses": 25,
    "renderedMinimaps": 174
  },
  "regions": [
    {
      "id": "human",
      "name": "Thung lũng Thistlewood",
      "hubName": "Thị trấn Thistlewood",
      "hubKey": "human/town",
      "mapCount": 14,
      "hub": {
        "key": "human/town",
        "name": "Thistlewood",
        "biome": null,
        "props": 118,
        "propTypes": 28,
        "npcs": 0,
        "mobTypes": [],
        "boss": null,
        "exits": 4
      },
      "mobTypes": [
        "mob_cave_bat_001",
        "mob_gargoyle_001",
        "mob_mushroom_001",
        "mob_skeleton_archer_001",
        "mob_zombie_001"
      ],
      "bossIds": [
        "boss_demon_001",
        "boss_lich_001",
        "boss_stone_gargoyle_001"
      ],
      "topProps": [
        [
          "rock_gray",
          297
        ],
        [
          "cave_boulder",
          277
        ],
        [
          "tree_flip",
          266
        ],
        [
          "rock_mossy",
          250
        ],
        [
          "tree",
          242
        ],
        [
          "tree_autumn",
          187
        ],
        [
          "stalagmite",
          170
        ],
        [
          "rock_pillar",
          168
        ],
        [
          "boulder",
          157
        ],
        [
          "rock_outcrop",
          153
        ],
        [
          "rock_spire",
          109
        ],
        [
          "fern",
          80
        ]
      ],
      "chief": "Quân chủ tại thủ phủ; tên và nhân vật vua chưa chốt",
      "architecture": "Nhà gỗ đá 2–3 tầng, mái dốc, chợ nông sản và công xưởng.",
      "life": "Giao lúa mì cho chợ đầu mối. Khôi phục một nhà phụ thành xưởng nghề.",
      "politics": "Vương quốc đồng bằng và hội đồng làng; Quân chủ tại thủ phủ; tên và nhân vật vua chưa chốt. Thiết kế mới: Đồng bằng khởi hành; mở về hồ câu và các khuôn viên cá nhân. Nhân vật đời cũ chỉ phân vai NPC sau khi biên soạn lại.",
      "newMobs": "Linh cẩu đồng, bù nhìn ma, kỵ sĩ rừng tha hóa.",
      "newBoss": "Cổ Thụ Nguyền Rủa",
      "finding": "Quảng trường trống; cây và nhà nhỏ rải thưa, thiếu tuyến sinh hoạt."
    },
    {
      "id": "swamp",
      "name": "Đầm lầy Mù Sương",
      "hubName": "Làng nhà sàn Lau Xám",
      "hubKey": "swamp/hub",
      "mapCount": 13,
      "hub": {
        "key": "swamp/hub",
        "name": "Làng nhà sàn Lau Xám",
        "biome": "swamp",
        "props": 209,
        "propTypes": 43,
        "npcs": 0,
        "mobTypes": [],
        "boss": null,
        "exits": 4
      },
      "mobTypes": [
        "mob_glow_mushroom_001",
        "mob_mud_merfolk_001",
        "mob_poison_frog_001",
        "mob_swamp_leech_001",
        "mob_water_snake_001"
      ],
      "bossIds": [
        "boss_mother_frog_001",
        "boss_mud_hydra_001",
        "boss_swamp_witch_001"
      ],
      "topProps": [
        [
          "cypress_deep",
          554
        ],
        [
          "willow",
          369
        ],
        [
          "dead_mossy_flip",
          251
        ],
        [
          "bamboo",
          226
        ],
        [
          "mangrove",
          168
        ],
        [
          "dead_mossy",
          168
        ],
        [
          "cypress",
          162
        ],
        [
          "moss_bush",
          152
        ],
        [
          "cypress_flip",
          132
        ],
        [
          "rotten_stump",
          99
        ],
        [
          "stump",
          94
        ],
        [
          "cypress_rust",
          90
        ]
      ],
      "chief": "Hội đồng các bến nước",
      "architecture": "Nhà sàn cao, cầu gỗ, thuyền hàng và vườn dược liệu nổi.",
      "life": "Dọn đường thủy để mở tuyến chợ cá. Tìm hạt giống chịu ngập trong mê cung kênh chìm.",
      "politics": "Liên hội làng sông; Hội đồng các bến nước. Thiết kế mới: Đầm nước nhiều tầng cao độ, đường nổi và bến liên kết. Nhân vật đời cũ chỉ phân vai NPC sau khi biên soạn lại.",
      "newMobs": "Đỉa giáp bùn, cá sấu lau, phù thủy sương.",
      "newBoss": "Cá Sấu Cổ Đầm",
      "finding": "Đã có bản sắc nhà sàn; trung tâm vẫn thiếu mật độ và cao độ."
    },
    {
      "id": "desert",
      "name": "Sa mạc Hồng Cát",
      "hubName": "Thành ốc đảo Sahrin",
      "hubKey": "desert/hub",
      "mapCount": 13,
      "hub": {
        "key": "desert/hub",
        "name": "Thành ốc đảo Sahrin",
        "biome": "desert",
        "props": 197,
        "propTypes": 42,
        "npcs": 0,
        "mobTypes": [],
        "boss": null,
        "exits": 4
      },
      "mobTypes": [
        "mob_mummy_001",
        "mob_sand_snake_001",
        "mob_sand_spirit_001",
        "mob_scorpion_001",
        "mob_vulture_001"
      ],
      "bossIds": [
        "boss_pharaoh_001",
        "boss_sandworm_001",
        "boss_scorpion_queen_001"
      ],
      "topProps": [
        [
          "red_rock",
          192
        ],
        [
          "candelabra_flip",
          173
        ],
        [
          "candelabra",
          167
        ],
        [
          "acacia_flip",
          166
        ],
        [
          "acacia",
          158
        ],
        [
          "dry_tree_flip",
          140
        ],
        [
          "dune_mound",
          133
        ],
        [
          "dry_tree",
          126
        ],
        [
          "dead_bleached",
          126
        ],
        [
          "dead_bleached_flip",
          112
        ],
        [
          "boulder",
          109
        ],
        [
          "red_spire",
          99
        ]
      ],
      "chief": "Vua hoặc nữ hoàng ốc đảo; danh tính chưa chốt",
      "architecture": "Cung thành sa thạch cao, vòm che nắng, chợ thảm và giếng nước.",
      "life": "Hộ tống cây giống về giếng mới. Tìm kính cổ và đồ lưu niệm trong mê cung cát.",
      "politics": "Vương quốc ốc đảo; Vua hoặc nữ hoàng ốc đảo; danh tính chưa chốt. Thiết kế mới: Cồn cát, khe đá và các trạm caravan cách xa nhau. Nhân vật đời cũ chỉ phân vai NPC sau khi biên soạn lại.",
      "newMobs": "Bọ kính sa mạc, kỵ binh cát, linh thể ốc đảo.",
      "newBoss": "Hộ Vệ Giếng Mặt Trời",
      "finding": "Nhà vòm nhận diện tốt nhưng chưa đủ tầm thành đô; cần tường thành và cung điện."
    },
    {
      "id": "highland",
      "name": "Cao nguyên Gió Hú",
      "hubName": "Làng Cối Xay Gió",
      "hubKey": "highland/hub",
      "mapCount": 14,
      "hub": {
        "key": "highland/hub",
        "name": "Làng Cối Xay Gió",
        "biome": "highland",
        "props": 233,
        "propTypes": 48,
        "npcs": 0,
        "mobTypes": [],
        "boss": null,
        "exits": 4
      },
      "mobTypes": [
        "mob_flying_rock_001",
        "mob_hawk_001",
        "mob_wind_fairy_001",
        "mob_wind_goblin_001",
        "mob_wind_wolf_001"
      ],
      "bossIds": [
        "boss_storm_eagle_001",
        "boss_wind_drake_001",
        "boss_wind_mage_001",
        "dragon_wind_001"
      ],
      "topProps": [
        [
          "cliff_pine",
          185
        ],
        [
          "birch",
          167
        ],
        [
          "wind_pine_dark",
          156
        ],
        [
          "tall_grass",
          147
        ],
        [
          "wind_pine",
          145
        ],
        [
          "wind_pine_flip",
          143
        ],
        [
          "red_oak",
          140
        ],
        [
          "wildflowers",
          137
        ],
        [
          "tumbleweed",
          136
        ],
        [
          "rhododendron",
          136
        ],
        [
          "pampas",
          126
        ],
        [
          "wind_pine_gold",
          124
        ]
      ],
      "chief": "Hội đồng các trạm gió",
      "architecture": "Nhà đá cao mái đồng, cầu treo, cối xay và bến mây.",
      "life": "Khôi phục trạm gió phục vụ đoàn hàng. Khảo sát bến mây trước khi mở đường lên trời.",
      "politics": "Liên minh thành trạm núi; Hội đồng các trạm gió. Thiết kế mới: Cao nguyên nhiều gió; dành tuyến riêng lên Thiên Thành. Nhân vật đời cũ chỉ phân vai NPC sau khi biên soạn lại.",
      "newMobs": "Dê đá cuồng phong, cung thủ diều, linh hạc.",
      "newBoss": "Kỵ Sĩ Bão",
      "finding": "Nhiều cây màu sặc sỡ; cần khoảng nghỉ và địa hình cao nguyên dễ đọc hơn."
    },
    {
      "id": "tundra",
      "name": "Lãnh nguyên Băng Giá",
      "hubName": "Làng gỗ Tuyết Phong",
      "hubKey": "tundra/hub",
      "mapCount": 14,
      "hub": {
        "key": "tundra/hub",
        "name": "Làng gỗ Tuyết Phong",
        "biome": "snow",
        "props": 218,
        "propTypes": 44,
        "npcs": 0,
        "mobTypes": [],
        "boss": null,
        "exits": 4
      },
      "mobTypes": [
        "mob_ice_bear_001",
        "mob_ice_wisp_001",
        "mob_snow_wolf_001",
        "mob_snowman_001",
        "mob_war_penguin_001"
      ],
      "bossIds": [
        "boss_ice_guardian_001",
        "boss_ice_queen_001",
        "boss_yeti_001",
        "dragon_ice_001"
      ],
      "topProps": [
        [
          "bare_tree",
          313
        ],
        [
          "crystal_tree",
          255
        ],
        [
          "snow_pine",
          220
        ],
        [
          "snow_pine_flip",
          183
        ],
        [
          "snowdrift",
          178
        ],
        [
          "winter_birch",
          175
        ],
        [
          "frozen_pine",
          166
        ],
        [
          "frozen_pine_flip",
          161
        ],
        [
          "dwarf_pine",
          157
        ],
        [
          "frost_cedar",
          128
        ],
        [
          "frozen_patch",
          121
        ],
        [
          "ice_crystals",
          119
        ]
      ],
      "chief": "Hội đồng Tuyết Lĩnh",
      "architecture": "Nhà gỗ dày 2 tầng, mái tuyết dốc và đại sảnh lò sưởi.",
      "life": "Dự trữ thực phẩm cho trạm xa. Câu cá băng và thu thập vật liệu cách nhiệt.",
      "politics": "Liên minh thị tộc; Hội đồng Tuyết Lĩnh. Thiết kế mới: Miền băng tuyết, hồ đóng băng và các điểm trú bão. Nhân vật đời cũ chỉ phân vai NPC sau khi biên soạn lại.",
      "newMobs": "Linh miêu băng, thợ săn vong, cua hồ đóng băng.",
      "newBoss": "Mẫu Lang Băng",
      "finding": "Tuyết đã rõ style nhưng trung tâm còn cùng bố cục chữ thập và nhà nhỏ."
    },
    {
      "id": "volcano",
      "name": "Núi lửa Hoả Sơn",
      "hubName": "Pháo đài người lùn Đe Đỏ",
      "hubKey": "volcano/hub",
      "mapCount": 14,
      "hub": {
        "key": "volcano/hub",
        "name": "Pháo đài Đe Đỏ",
        "biome": "volcanic",
        "props": 191,
        "propTypes": 49,
        "npcs": 0,
        "mobTypes": [],
        "boss": null,
        "exits": 4
      },
      "mobTypes": [
        "mob_fire_bat_001",
        "mob_fire_demon_001",
        "mob_fire_spirit_001",
        "mob_lava_golem_001",
        "mob_lava_lizard_001"
      ],
      "bossIds": [
        "boss_ancient_lava_golem_001",
        "boss_fire_god_001",
        "boss_salamander_001",
        "dragon_fire_001"
      ],
      "topProps": [
        [
          "ash_tree_cold",
          259
        ],
        [
          "ash_pile",
          175
        ],
        [
          "ash_tree",
          165
        ],
        [
          "fire_mushrooms",
          154
        ],
        [
          "charred_tree",
          154
        ],
        [
          "petrified_tree",
          151
        ],
        [
          "basalt",
          142
        ],
        [
          "thorn_black",
          139
        ],
        [
          "ruby_tree",
          130
        ],
        [
          "ash_tree_flip",
          130
        ],
        [
          "bone_pile",
          101
        ],
        [
          "skull_pile",
          94
        ]
      ],
      "chief": "Hội đồng Lò Rèn",
      "architecture": "Pháo đài bazan cao, cầu thép, lò rèn và đường vận quặng.",
      "life": "Sửa lò công cộng để mở công thức chế tạo. Tìm nhiên liệu hiếm trong mỏ nguy hiểm.",
      "politics": "Thành bang công nghiệp; Hội đồng Lò Rèn. Thiết kế mới: Thềm dung nham và hệ mỏ; nhà ở tách khỏi luồng lò nóng. Nhân vật đời cũ chỉ phân vai NPC sau khi biên soạn lại.",
      "newMobs": "Bọ than, hộ vệ xỉ thép, thằn lằn lò nung.",
      "newBoss": "Cự Tượng Đe Đỏ",
      "finding": "Tối và nhiều đốm tương phản; gom ánh lửa theo cụm, làm rõ đường đi."
    },
    {
      "id": "isles",
      "name": "Quần đảo San Hô",
      "hubName": "Cảng chài San Hô",
      "hubKey": "isles/hub",
      "mapCount": 14,
      "hub": {
        "key": "isles/hub",
        "name": "Cảng chài San Hô",
        "biome": "beach",
        "props": 206,
        "propTypes": 45,
        "npcs": 0,
        "mobTypes": [],
        "boss": null,
        "exits": 4
      },
      "mobTypes": [
        "mob_beach_crab_001",
        "mob_coral_merfolk_001",
        "mob_pirate_001",
        "mob_reef_jellyfish_001",
        "mob_wreck_octopus_001"
      ],
      "bossIds": [
        "boss_crab_king_001",
        "boss_ghost_captain_001",
        "boss_kraken_001",
        "dragon_water_001"
      ],
      "topProps": [
        [
          "leaning_palm",
          258
        ],
        [
          "sea_almond",
          245
        ],
        [
          "palm_lush",
          238
        ],
        [
          "coast_mangrove",
          142
        ],
        [
          "beach_rock",
          129
        ],
        [
          "brain_coral",
          127
        ],
        [
          "palm_tropic",
          111
        ],
        [
          "morning_glory",
          110
        ],
        [
          "palm_tropic_flip",
          109
        ],
        [
          "urchin",
          90
        ],
        [
          "agave",
          83
        ],
        [
          "oyster_rock",
          82
        ]
      ],
      "chief": "Đại diện cảng và cộng đồng rạn",
      "architecture": "Nhà cảng nhiều tầng, đài hải đăng và chợ cá dọc cầu tàu.",
      "life": "Tổ chức chuyến câu cùng bạn bè. Trục vớt châu báu và đồ trang trí có nguồn gốc.",
      "politics": "Liên bang cảng đảo; Đại diện cảng và cộng đồng rạn. Thiết kế mới: Quần đảo nhiệt đới, rạn san hô và lối xuống hang biển. Nhân vật đời cũ chỉ phân vai NPC sau khi biên soạn lại.",
      "newMobs": "Cá kiếm chân cạn, thủy thủ nguyền, sứa giáp.",
      "newBoss": "Hải Xà San Hô",
      "finding": "Phong cách biển có sẵn; thiếu tuyến cảng làm điểm nhấn đô thị đông đúc."
    },
    {
      "id": "fungal",
      "name": "Rừng Nấm Ngầm",
      "hubName": "Làng người nấm Ánh Tím",
      "hubKey": "fungal/hub",
      "mapCount": 13,
      "hub": {
        "key": "fungal/hub",
        "name": "Làng người nấm Ánh Tím",
        "biome": "swamp",
        "props": 202,
        "propTypes": 43,
        "npcs": 0,
        "mobTypes": [],
        "boss": null,
        "exits": 4
      },
      "mobTypes": [
        "mob_glow_mushroom_001",
        "mob_mud_merfolk_001",
        "mob_poison_frog_001",
        "mob_swamp_leech_001",
        "mob_water_snake_001"
      ],
      "bossIds": [
        "boss_mother_frog_001",
        "boss_mud_hydra_001",
        "boss_swamp_witch_001"
      ],
      "topProps": [
        [
          "cypress_deep",
          595
        ],
        [
          "willow",
          349
        ],
        [
          "dead_mossy_flip",
          236
        ],
        [
          "bamboo",
          216
        ],
        [
          "mangrove",
          178
        ],
        [
          "moss_bush",
          177
        ],
        [
          "cypress",
          172
        ],
        [
          "cypress_rust",
          147
        ],
        [
          "dead_mossy",
          145
        ],
        [
          "cypress_flip",
          144
        ],
        [
          "rock_mossy",
          107
        ],
        [
          "reeds",
          107
        ]
      ],
      "chief": "Đại hội các cụm nấm",
      "architecture": "Nhà thân nấm nhiều tầng, cầu sợi nấm, đèn bào tử; bộ cảnh riêng.",
      "life": "Nuôi nấm thực phẩm tại vườn hang. Tìm vật phẩm phát quang trong mê cung rễ nấm.",
      "politics": "Thành phố cộng sinh dưới đất; Đại hội các cụm nấm. Thiết kế mới: Đô thị nấm ngầm, không dùng cây đầm lầy làm cây chủ đạo. Nhân vật đời cũ chỉ phân vai NPC sau khi biên soạn lại.",
      "newMobs": "Nấm khiên, sâu bào tử, dơi tinh thể.",
      "newBoss": "Mẫu Thể Bào Tử",
      "finding": "Đang dùng biome swamp, cây liễu/đước/nhà sàn và boss Hydra; phải thay bộ cảnh cốt lõi."
    },
    {
      "id": "ruins",
      "name": "Phế tích Aether",
      "hubName": "Toà thành Aether cổ",
      "hubKey": "ruins/hub",
      "mapCount": 13,
      "hub": {
        "key": "ruins/hub",
        "name": "Toà thành Aether cổ",
        "biome": "rocky",
        "props": 233,
        "propTypes": 44,
        "npcs": 0,
        "mobTypes": [],
        "boss": null,
        "exits": 4
      },
      "mobTypes": [
        "mob_flying_rock_001",
        "mob_hawk_001",
        "mob_wind_fairy_001",
        "mob_wind_goblin_001",
        "mob_wind_wolf_001"
      ],
      "bossIds": [
        "boss_storm_eagle_001",
        "boss_wind_drake_001",
        "boss_wind_mage_001"
      ],
      "topProps": [
        [
          "rhododendron",
          161
        ],
        [
          "tall_grass",
          157
        ],
        [
          "birch",
          152
        ],
        [
          "wind_pine_dark",
          151
        ],
        [
          "cliff_pine",
          149
        ],
        [
          "wind_pine_flip",
          144
        ],
        [
          "wind_pine",
          135
        ],
        [
          "wind_pine_gold",
          130
        ],
        [
          "highland_flowers",
          118
        ],
        [
          "wildflower_patch",
          118
        ],
        [
          "fern",
          108
        ],
        [
          "red_oak",
          105
        ]
      ],
      "chief": "Viện Khảo Cổ và hội bảo tồn",
      "architecture": "Tháp đá vỡ cao, cơ cấu cổ, đường khảm và thư khố; bỏ cây/cối xay mượn.",
      "life": "Ghi nguồn một kho châu báu trước khi khai quật. Tìm bản ghi dẫn tới tri thức khởi nguyên.",
      "politics": "Khu khảo cổ liên vùng; Viện Khảo Cổ và hội bảo tồn. Thiết kế mới: Vành đai phế tích nhiều niên đại, giữ khoảng trống gợi quy mô cổ thành. Nhân vật đời cũ chỉ phân vai NPC sau khi biên soạn lại.",
      "newMobs": "Lính cơ giới, thư linh, tượng rune tuần tra.",
      "newBoss": "Nhiếp Chính Cơ Giới",
      "finding": "Đang dùng cây màu và cối xay highland; cảnh chưa đọc ra thành cổ."
    },
    {
      "id": "void",
      "name": "Vực Hư Không",
      "hubName": "Thành trì Hư Không",
      "hubKey": "void/hub",
      "mapCount": 13,
      "hub": {
        "key": "void/hub",
        "name": "Thành trì Hư Không",
        "biome": "deadland",
        "props": 213,
        "propTypes": 45,
        "npcs": 0,
        "mobTypes": [],
        "boss": null,
        "exits": 4
      },
      "mobTypes": [
        "mob_fire_bat_001",
        "mob_fire_demon_001",
        "mob_fire_spirit_001",
        "mob_lava_golem_001",
        "mob_lava_lizard_001"
      ],
      "bossIds": [
        "boss_ancient_lava_golem_001",
        "boss_fire_god_001",
        "boss_salamander_001"
      ],
      "topProps": [
        [
          "ash_tree_cold",
          247
        ],
        [
          "ash_pile",
          185
        ],
        [
          "ash_tree",
          160
        ],
        [
          "basalt",
          149
        ],
        [
          "petrified_tree",
          137
        ],
        [
          "ash_tree_flip",
          137
        ],
        [
          "charred_tree",
          135
        ],
        [
          "ruby_tree",
          125
        ],
        [
          "thorn_black",
          123
        ],
        [
          "skull_pile",
          111
        ],
        [
          "bone_pile",
          100
        ],
        [
          "fire_mushrooms",
          99
        ]
      ],
      "chief": "Bộ chỉ huy Liên quân Biên Giới",
      "architecture": "Thành trì trên đá nổi, neo ma pháp, trạm quân y và cổng khe nứt.",
      "life": "Bảo vệ đoàn tiếp tế. Thu thập mẫu rạn để Viện Khảo Cổ nghiên cứu.",
      "politics": "Tiền tuyến liên vùng; Bộ chỉ huy Liên quân Biên Giới. Thiết kế mới: Vùng rạn không gian riêng, không đồng nhất miền Bóng tối. Nhân vật đời cũ chỉ phân vai NPC sau khi biên soạn lại.",
      "newMobs": "Ký sinh khe nứt, chiến binh rỗng, mắt hư vô.",
      "newBoss": "Kẻ Nuốt Chân Trời",
      "finding": "Hiện gần biến thể núi lửa; thiếu khoảng không, đảo nổi và kết cấu siêu thực."
    },
    {
      "id": "wood",
      "name": "Rừng Cổ Thụ",
      "hubName": "Rừng Cổ Thụ",
      "hubKey": "wood/hub",
      "mapCount": 13,
      "hub": {
        "key": "wood/hub",
        "name": "Làng Rễ Ngàn Năm",
        "biome": "wood",
        "props": 234,
        "propTypes": 33,
        "npcs": 0,
        "mobTypes": [],
        "boss": null,
        "exits": 4
      },
      "mobTypes": [
        "mob_glow_mushroom_001",
        "mob_mud_merfolk_001",
        "mob_poison_frog_001",
        "mob_swamp_leech_001",
        "mob_water_snake_001"
      ],
      "bossIds": [
        "boss_mother_frog_001",
        "boss_mud_hydra_001",
        "boss_swamp_witch_001"
      ],
      "topProps": [
        [
          "wood_fallen_log",
          131
        ],
        [
          "wood_spirit_tree_flip",
          116
        ],
        [
          "reeds",
          112
        ],
        [
          "moss_bush",
          112
        ],
        [
          "wood_hollow_oak_flip",
          112
        ],
        [
          "wood_fallen_log_flip",
          106
        ],
        [
          "wood_firefly_tree_flip",
          104
        ],
        [
          "wood_wild_rose_flip",
          102
        ],
        [
          "wood_fern_giant_flip",
          100
        ],
        [
          "wood_hollow_oak",
          98
        ],
        [
          "wood_vine_tree",
          97
        ],
        [
          "wood_firefly_tree",
          96
        ]
      ],
      "chief": "Hội Thủ Lâm và đại diện vườn",
      "architecture": "Nhà ôm thân cây cao, cầu rễ, vườn treo và xưởng cây giống.",
      "life": "Ươm cây giống cho khuôn viên người chơi. Khôi phục vườn thuốc và tìm đồ gỗ cổ.",
      "politics": "Cộng đồng thành rừng; Hội Thủ Lâm và đại diện vườn. Thiết kế mới: Rừng cổ đa tầng với bộ cây, rễ và đồ cảnh Mộc riêng. Nhân vật đời cũ chỉ phân vai NPC sau khi biên soạn lại.",
      "newMobs": "Hươu mầm, hộ vệ vỏ cây, nhện dây leo.",
      "newBoss": "Thủ Hộ Rễ Ngàn Năm",
      "finding": "Có cây riêng nhưng nhà và boss vẫn thuộc đầm lầy; cây phủ kín nhiều đường."
    },
    {
      "id": "light",
      "name": "Thánh Địa Bình Minh",
      "hubName": "Thánh Địa Bình Minh",
      "hubKey": "light/hub",
      "mapCount": 13,
      "hub": {
        "key": "light/hub",
        "name": "Trạm Bình Minh",
        "biome": "light",
        "props": 251,
        "propTypes": 36,
        "npcs": 0,
        "mobTypes": [],
        "boss": null,
        "exits": 4
      },
      "mobTypes": [
        "mob_flying_rock_001",
        "mob_hawk_001",
        "mob_wind_fairy_001",
        "mob_wind_goblin_001",
        "mob_wind_wolf_001"
      ],
      "bossIds": [
        "boss_storm_eagle_001",
        "boss_wind_drake_001",
        "boss_wind_mage_001"
      ],
      "topProps": [
        [
          "tall_grass",
          200
        ],
        [
          "wildflower_patch",
          107
        ],
        [
          "bird_nest",
          102
        ],
        [
          "wildflowers",
          102
        ],
        [
          "light_white_cypress",
          97
        ],
        [
          "light_white_cypress_flip",
          97
        ],
        [
          "highland_flowers",
          94
        ],
        [
          "light_feather_tree",
          94
        ],
        [
          "tumbleweed",
          93
        ],
        [
          "light_golden_apple",
          92
        ],
        [
          "highland_mushrooms",
          89
        ],
        [
          "light_golden_apple_flip",
          88
        ]
      ],
      "chief": "Học viện Bình Minh",
      "architecture": "Tháp đá sáng, mái kính, sân học viện và vườn pha lê.",
      "life": "Phục chế đèn pha lê cho nhà riêng. Sưu tầm bản chép về thiên phú nguyên tố.",
      "politics": "Thánh thành học thuật; Học viện Bình Minh. Thiết kế mới: Bậc thềm sáng, kiến trúc cao và khoảng sân rõ ràng. Nhân vật đời cũ chỉ phân vai NPC sau khi biên soạn lại.",
      "newMobs": "Hộ vệ kính, sư tử nhật quang, linh tượng lạc ánh.",
      "newBoss": "Chấp Chính Nhật Luân",
      "finding": "Có cây vàng riêng nhưng nhà và boss gió còn mượn; nền sáng chưa có kiến trúc tương xứng."
    },
    {
      "id": "dark",
      "name": "Vực Ám Ma",
      "hubName": "Vực Ám Ma",
      "hubKey": "dark/hub",
      "mapCount": 13,
      "hub": {
        "key": "dark/hub",
        "name": "Trại Đèn Tím",
        "biome": "dark",
        "props": 258,
        "propTypes": 40,
        "npcs": 0,
        "mobTypes": [],
        "boss": null,
        "exits": 4
      },
      "mobTypes": [
        "mob_fire_bat_001",
        "mob_fire_demon_001",
        "mob_fire_spirit_001",
        "mob_lava_golem_001",
        "mob_lava_lizard_001"
      ],
      "bossIds": [
        "boss_ancient_lava_golem_001",
        "boss_fire_god_001",
        "boss_salamander_001"
      ],
      "topProps": [
        [
          "ash_pile",
          170
        ],
        [
          "basalt",
          111
        ],
        [
          "skull_pile",
          109
        ],
        [
          "fire_flower",
          106
        ],
        [
          "bone_pile",
          101
        ],
        [
          "dark_thorn_giant_flip",
          95
        ],
        [
          "dark_eye_tree",
          94
        ],
        [
          "dark_blood_bush_flip",
          93
        ],
        [
          "dark_bone_tree_flip",
          93
        ],
        [
          "ash_crater",
          92
        ],
        [
          "dark_ghost_tree_flip",
          89
        ],
        [
          "dark_obsidian_tree_flip",
          84
        ]
      ],
      "chief": "Hội Đèn Đêm",
      "architecture": "Nhà đá tím cao, mái đen, đèn dẫn đường và chợ đêm; bộ cảnh riêng.",
      "life": "Mở tuyến chợ đêm an toàn. Tìm chất nhuộm và đồ lưu niệm trong mê cung đêm.",
      "politics": "Liên hội đô thị đêm; Hội Đèn Đêm. Thiết kế mới: Rừng đêm và đô thị trú ẩn; màu tối không mặc định phản diện. Nhân vật đời cũ chỉ phân vai NPC sau khi biên soạn lại.",
      "newMobs": "Miêu bóng, chiến binh dạ giáp, bướm đêm linh.",
      "newBoss": "Nữ Vương Dạ Kính",
      "finding": "Có cây riêng nhưng còn nhà núi lửa, boss lửa; nhiều điểm tím vụn gây nhiễu."
    }
  ],
  "bosses": [
    {
      "id": "boss_demon_001",
      "name": "Quỷ vương rừng sâu",
      "frameSize": {
        "width": 96,
        "height": 104
      },
      "bodyHeight": 84,
      "frames": {
        "idle": {
          "S": {
            "slots": 4,
            "unique": 1
          },
          "SW": {
            "slots": 4,
            "unique": 1
          },
          "W": {
            "slots": 4,
            "unique": 1
          },
          "NW": {
            "slots": 4,
            "unique": 1
          },
          "N": {
            "slots": 4,
            "unique": 1
          },
          "NE": {
            "slots": 4,
            "unique": 1
          },
          "E": {
            "slots": 4,
            "unique": 1
          },
          "SE": {
            "slots": 4,
            "unique": 1
          }
        },
        "walk": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "SW": {
            "slots": 6,
            "unique": 2
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "NW": {
            "slots": 6,
            "unique": 2
          },
          "N": {
            "slots": 6,
            "unique": 2
          },
          "NE": {
            "slots": 6,
            "unique": 2
          },
          "E": {
            "slots": 8,
            "unique": 8
          },
          "SE": {
            "slots": 6,
            "unique": 2
          }
        },
        "attack": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        },
        "death": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        }
      },
      "lowFrames": [
        "idle/S: 1/4",
        "idle/SW: 1/4",
        "idle/W: 1/4",
        "idle/NW: 1/4",
        "idle/N: 1/4",
        "idle/NE: 1/4",
        "idle/E: 1/4",
        "idle/SE: 1/4",
        "walk/SW: 2/6",
        "walk/NW: 2/6",
        "walk/N: 2/6",
        "walk/NE: 2/6",
        "walk/SE: 2/6"
      ],
      "minCardinalUnique": 1,
      "provisional": [
        "S",
        "SW",
        "W",
        "NW",
        "N",
        "NE",
        "E",
        "SE"
      ]
    },
    {
      "id": "boss_lich_001",
      "name": "Vua Lich (boss khu)",
      "frameSize": {
        "width": 160,
        "height": 160
      },
      "bodyHeight": 93,
      "frames": {
        "idle": {
          "S": {
            "slots": 4,
            "unique": 4
          },
          "SW": {
            "slots": 4,
            "unique": 1
          },
          "W": {
            "slots": 4,
            "unique": 4
          },
          "NW": {
            "slots": 4,
            "unique": 1
          },
          "N": {
            "slots": 4,
            "unique": 4
          },
          "NE": {
            "slots": 4,
            "unique": 1
          },
          "E": {
            "slots": 4,
            "unique": 4
          },
          "SE": {
            "slots": 4,
            "unique": 1
          }
        },
        "walk": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "SW": {
            "slots": 6,
            "unique": 2
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "NW": {
            "slots": 6,
            "unique": 2
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "NE": {
            "slots": 6,
            "unique": 2
          },
          "E": {
            "slots": 8,
            "unique": 8
          },
          "SE": {
            "slots": 6,
            "unique": 2
          }
        },
        "attack": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        },
        "death": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        }
      },
      "lowFrames": [
        "idle/SW: 1/4",
        "idle/NW: 1/4",
        "idle/NE: 1/4",
        "idle/SE: 1/4",
        "walk/SW: 2/6",
        "walk/NW: 2/6",
        "walk/NE: 2/6",
        "walk/SE: 2/6"
      ],
      "minCardinalUnique": 4,
      "provisional": [
        "SE",
        "NE",
        "SW",
        "NW"
      ]
    },
    {
      "id": "boss_stone_gargoyle_001",
      "name": "Gargoyle Đá (boss khu)",
      "frameSize": {
        "width": 184,
        "height": 184
      },
      "bodyHeight": 92,
      "frames": {
        "idle": {
          "S": {
            "slots": 4,
            "unique": 4
          },
          "SW": {
            "slots": 4,
            "unique": 1
          },
          "W": {
            "slots": 4,
            "unique": 4
          },
          "NW": {
            "slots": 4,
            "unique": 1
          },
          "N": {
            "slots": 4,
            "unique": 4
          },
          "NE": {
            "slots": 4,
            "unique": 1
          },
          "E": {
            "slots": 4,
            "unique": 4
          },
          "SE": {
            "slots": 4,
            "unique": 1
          }
        },
        "walk": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "SW": {
            "slots": 6,
            "unique": 2
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "NW": {
            "slots": 6,
            "unique": 2
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "NE": {
            "slots": 6,
            "unique": 2
          },
          "E": {
            "slots": 8,
            "unique": 8
          },
          "SE": {
            "slots": 6,
            "unique": 2
          }
        },
        "attack": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        },
        "death": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        }
      },
      "lowFrames": [
        "idle/SW: 1/4",
        "idle/NW: 1/4",
        "idle/NE: 1/4",
        "idle/SE: 1/4",
        "walk/SW: 2/6",
        "walk/NW: 2/6",
        "walk/NE: 2/6",
        "walk/SE: 2/6"
      ],
      "minCardinalUnique": 4,
      "provisional": [
        "SE",
        "NE",
        "SW",
        "NW"
      ]
    },
    {
      "id": "boss_ancient_lava_golem_001",
      "name": "Golem dung nham cổ (boss khu)",
      "frameSize": {
        "width": 184,
        "height": 184
      },
      "bodyHeight": 109,
      "frames": {
        "idle": {
          "S": {
            "slots": 4,
            "unique": 4
          },
          "SW": {
            "slots": 4,
            "unique": 1
          },
          "W": {
            "slots": 3,
            "unique": 3
          },
          "NW": {
            "slots": 4,
            "unique": 1
          },
          "N": {
            "slots": 4,
            "unique": 4
          },
          "NE": {
            "slots": 4,
            "unique": 1
          },
          "E": {
            "slots": 3,
            "unique": 3
          },
          "SE": {
            "slots": 4,
            "unique": 1
          }
        },
        "walk": {
          "S": {
            "slots": 6,
            "unique": 6
          },
          "SW": {
            "slots": 6,
            "unique": 2
          },
          "W": {
            "slots": 6,
            "unique": 6
          },
          "NW": {
            "slots": 6,
            "unique": 2
          },
          "N": {
            "slots": 6,
            "unique": 6
          },
          "NE": {
            "slots": 6,
            "unique": 2
          },
          "E": {
            "slots": 6,
            "unique": 6
          },
          "SE": {
            "slots": 6,
            "unique": 2
          }
        },
        "attack": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        },
        "death": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        }
      },
      "lowFrames": [
        "idle/SW: 1/4",
        "idle/W: 3/3",
        "idle/NW: 1/4",
        "idle/NE: 1/4",
        "idle/E: 3/3",
        "idle/SE: 1/4",
        "walk/SW: 2/6",
        "walk/NW: 2/6",
        "walk/NE: 2/6",
        "walk/SE: 2/6"
      ],
      "minCardinalUnique": 3,
      "provisional": [
        "SE",
        "NE",
        "SW",
        "NW"
      ]
    },
    {
      "id": "boss_crab_king_001",
      "name": "Cua chúa (boss khu)",
      "frameSize": {
        "width": 184,
        "height": 184
      },
      "bodyHeight": 107,
      "frames": {
        "idle": {
          "S": {
            "slots": 4,
            "unique": 4
          },
          "SW": {
            "slots": 4,
            "unique": 1
          },
          "W": {
            "slots": 4,
            "unique": 4
          },
          "NW": {
            "slots": 4,
            "unique": 1
          },
          "N": {
            "slots": 4,
            "unique": 4
          },
          "NE": {
            "slots": 4,
            "unique": 1
          },
          "E": {
            "slots": 4,
            "unique": 4
          },
          "SE": {
            "slots": 4,
            "unique": 1
          }
        },
        "walk": {
          "S": {
            "slots": 6,
            "unique": 6
          },
          "SW": {
            "slots": 6,
            "unique": 2
          },
          "W": {
            "slots": 6,
            "unique": 6
          },
          "NW": {
            "slots": 6,
            "unique": 2
          },
          "N": {
            "slots": 6,
            "unique": 6
          },
          "NE": {
            "slots": 6,
            "unique": 2
          },
          "E": {
            "slots": 6,
            "unique": 6
          },
          "SE": {
            "slots": 6,
            "unique": 2
          }
        },
        "attack": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        },
        "death": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        }
      },
      "lowFrames": [
        "idle/SW: 1/4",
        "idle/NW: 1/4",
        "idle/NE: 1/4",
        "idle/SE: 1/4",
        "walk/SW: 2/6",
        "walk/NW: 2/6",
        "walk/NE: 2/6",
        "walk/SE: 2/6"
      ],
      "minCardinalUnique": 4,
      "provisional": [
        "SE",
        "NE",
        "SW",
        "NW"
      ]
    },
    {
      "id": "boss_fire_god_001",
      "name": "Hoả thần (boss chúa)",
      "frameSize": {
        "width": 224,
        "height": 224
      },
      "bodyHeight": 155,
      "frames": {
        "idle": {
          "S": {
            "slots": 4,
            "unique": 4
          },
          "SW": {
            "slots": 4,
            "unique": 1
          },
          "W": {
            "slots": 4,
            "unique": 4
          },
          "NW": {
            "slots": 4,
            "unique": 1
          },
          "N": {
            "slots": 4,
            "unique": 4
          },
          "NE": {
            "slots": 4,
            "unique": 1
          },
          "E": {
            "slots": 4,
            "unique": 4
          },
          "SE": {
            "slots": 4,
            "unique": 1
          }
        },
        "walk": {
          "S": {
            "slots": 4,
            "unique": 4
          },
          "SW": {
            "slots": 6,
            "unique": 2
          },
          "W": {
            "slots": 6,
            "unique": 6
          },
          "NW": {
            "slots": 6,
            "unique": 2
          },
          "N": {
            "slots": 6,
            "unique": 6
          },
          "NE": {
            "slots": 6,
            "unique": 2
          },
          "E": {
            "slots": 6,
            "unique": 6
          },
          "SE": {
            "slots": 6,
            "unique": 2
          }
        },
        "attack": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        },
        "death": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        }
      },
      "lowFrames": [
        "idle/SW: 1/4",
        "idle/NW: 1/4",
        "idle/NE: 1/4",
        "idle/SE: 1/4",
        "walk/S: 4/4",
        "walk/SW: 2/6",
        "walk/NW: 2/6",
        "walk/NE: 2/6",
        "walk/SE: 2/6"
      ],
      "minCardinalUnique": 4,
      "provisional": [
        "SE",
        "NE",
        "SW",
        "NW"
      ]
    },
    {
      "id": "boss_ghost_captain_001",
      "name": "Thuyền trưởng ma Corvin (boss khu)",
      "frameSize": {
        "width": 160,
        "height": 160
      },
      "bodyHeight": 94,
      "frames": {
        "idle": {
          "S": {
            "slots": 4,
            "unique": 4
          },
          "SW": {
            "slots": 4,
            "unique": 1
          },
          "W": {
            "slots": 4,
            "unique": 4
          },
          "NW": {
            "slots": 4,
            "unique": 1
          },
          "N": {
            "slots": 4,
            "unique": 4
          },
          "NE": {
            "slots": 4,
            "unique": 1
          },
          "E": {
            "slots": 4,
            "unique": 4
          },
          "SE": {
            "slots": 4,
            "unique": 1
          }
        },
        "walk": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "SW": {
            "slots": 6,
            "unique": 2
          },
          "W": {
            "slots": 6,
            "unique": 6
          },
          "NW": {
            "slots": 6,
            "unique": 2
          },
          "N": {
            "slots": 6,
            "unique": 6
          },
          "NE": {
            "slots": 6,
            "unique": 2
          },
          "E": {
            "slots": 6,
            "unique": 6
          },
          "SE": {
            "slots": 6,
            "unique": 2
          }
        },
        "attack": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        },
        "death": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 7,
            "unique": 7
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 7,
            "unique": 7
          }
        }
      },
      "lowFrames": [
        "idle/SW: 1/4",
        "idle/NW: 1/4",
        "idle/NE: 1/4",
        "idle/SE: 1/4",
        "walk/SW: 2/6",
        "walk/NW: 2/6",
        "walk/NE: 2/6",
        "walk/SE: 2/6"
      ],
      "minCardinalUnique": 4,
      "provisional": [
        "SE",
        "NE",
        "SW",
        "NW"
      ]
    },
    {
      "id": "boss_ice_guardian_001",
      "name": "Nghê Băng (boss chúa)",
      "frameSize": {
        "width": 224,
        "height": 224
      },
      "bodyHeight": 127,
      "frames": {
        "idle": {
          "S": {
            "slots": 4,
            "unique": 4
          },
          "SW": {
            "slots": 4,
            "unique": 1
          },
          "W": {
            "slots": 4,
            "unique": 4
          },
          "NW": {
            "slots": 4,
            "unique": 1
          },
          "N": {
            "slots": 4,
            "unique": 4
          },
          "NE": {
            "slots": 4,
            "unique": 1
          },
          "E": {
            "slots": 4,
            "unique": 4
          },
          "SE": {
            "slots": 4,
            "unique": 1
          }
        },
        "walk": {
          "S": {
            "slots": 6,
            "unique": 6
          },
          "SW": {
            "slots": 6,
            "unique": 2
          },
          "W": {
            "slots": 6,
            "unique": 6
          },
          "NW": {
            "slots": 6,
            "unique": 2
          },
          "N": {
            "slots": 6,
            "unique": 6
          },
          "NE": {
            "slots": 6,
            "unique": 2
          },
          "E": {
            "slots": 6,
            "unique": 6
          },
          "SE": {
            "slots": 6,
            "unique": 2
          }
        },
        "attack": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        },
        "death": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        }
      },
      "lowFrames": [
        "idle/SW: 1/4",
        "idle/NW: 1/4",
        "idle/NE: 1/4",
        "idle/SE: 1/4",
        "walk/SW: 2/6",
        "walk/NW: 2/6",
        "walk/NE: 2/6",
        "walk/SE: 2/6"
      ],
      "minCardinalUnique": 4,
      "provisional": [
        "SE",
        "NE",
        "SW",
        "NW"
      ]
    },
    {
      "id": "boss_ice_queen_001",
      "name": "Nữ hoàng băng (boss khu)",
      "frameSize": {
        "width": 160,
        "height": 160
      },
      "bodyHeight": 91,
      "frames": {
        "idle": {
          "S": {
            "slots": 4,
            "unique": 4
          },
          "SW": {
            "slots": 4,
            "unique": 1
          },
          "W": {
            "slots": 4,
            "unique": 4
          },
          "NW": {
            "slots": 4,
            "unique": 1
          },
          "N": {
            "slots": 4,
            "unique": 4
          },
          "NE": {
            "slots": 4,
            "unique": 1
          },
          "E": {
            "slots": 4,
            "unique": 4
          },
          "SE": {
            "slots": 4,
            "unique": 1
          }
        },
        "walk": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "SW": {
            "slots": 6,
            "unique": 2
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "NW": {
            "slots": 6,
            "unique": 2
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "NE": {
            "slots": 6,
            "unique": 2
          },
          "E": {
            "slots": 8,
            "unique": 8
          },
          "SE": {
            "slots": 6,
            "unique": 2
          }
        },
        "attack": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        },
        "death": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        }
      },
      "lowFrames": [
        "idle/SW: 1/4",
        "idle/NW: 1/4",
        "idle/NE: 1/4",
        "idle/SE: 1/4",
        "walk/SW: 2/6",
        "walk/NW: 2/6",
        "walk/NE: 2/6",
        "walk/SE: 2/6"
      ],
      "minCardinalUnique": 4,
      "provisional": [
        "SE",
        "NE",
        "SW",
        "NW"
      ]
    },
    {
      "id": "boss_kraken_001",
      "name": "Kraken (boss chúa)",
      "frameSize": {
        "width": 224,
        "height": 224
      },
      "bodyHeight": 159,
      "frames": {
        "idle": {
          "S": {
            "slots": 4,
            "unique": 4
          },
          "SW": {
            "slots": 4,
            "unique": 1
          },
          "W": {
            "slots": 4,
            "unique": 4
          },
          "NW": {
            "slots": 4,
            "unique": 1
          },
          "N": {
            "slots": 4,
            "unique": 4
          },
          "NE": {
            "slots": 4,
            "unique": 1
          },
          "E": {
            "slots": 4,
            "unique": 4
          },
          "SE": {
            "slots": 4,
            "unique": 1
          }
        },
        "walk": {
          "S": {
            "slots": 6,
            "unique": 6
          },
          "SW": {
            "slots": 6,
            "unique": 2
          },
          "W": {
            "slots": 6,
            "unique": 6
          },
          "NW": {
            "slots": 6,
            "unique": 2
          },
          "N": {
            "slots": 4,
            "unique": 4
          },
          "NE": {
            "slots": 6,
            "unique": 2
          },
          "E": {
            "slots": 6,
            "unique": 6
          },
          "SE": {
            "slots": 6,
            "unique": 2
          }
        },
        "attack": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        },
        "death": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        }
      },
      "lowFrames": [
        "idle/SW: 1/4",
        "idle/NW: 1/4",
        "idle/NE: 1/4",
        "idle/SE: 1/4",
        "walk/SW: 2/6",
        "walk/NW: 2/6",
        "walk/N: 4/4",
        "walk/NE: 2/6",
        "walk/SE: 2/6"
      ],
      "minCardinalUnique": 4,
      "provisional": [
        "SE",
        "NE",
        "SW",
        "NW"
      ]
    },
    {
      "id": "boss_mother_frog_001",
      "name": "Mẹ Ếch (boss khu)",
      "frameSize": {
        "width": 184,
        "height": 184
      },
      "bodyHeight": 69,
      "frames": {
        "idle": {
          "S": {
            "slots": 4,
            "unique": 4
          },
          "SW": {
            "slots": 4,
            "unique": 1
          },
          "W": {
            "slots": 4,
            "unique": 4
          },
          "NW": {
            "slots": 4,
            "unique": 1
          },
          "N": {
            "slots": 4,
            "unique": 4
          },
          "NE": {
            "slots": 4,
            "unique": 1
          },
          "E": {
            "slots": 4,
            "unique": 4
          },
          "SE": {
            "slots": 4,
            "unique": 1
          }
        },
        "walk": {
          "S": {
            "slots": 6,
            "unique": 6
          },
          "SW": {
            "slots": 6,
            "unique": 2
          },
          "W": {
            "slots": 6,
            "unique": 6
          },
          "NW": {
            "slots": 6,
            "unique": 2
          },
          "N": {
            "slots": 6,
            "unique": 6
          },
          "NE": {
            "slots": 6,
            "unique": 2
          },
          "E": {
            "slots": 6,
            "unique": 6
          },
          "SE": {
            "slots": 6,
            "unique": 2
          }
        },
        "attack": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        },
        "death": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        }
      },
      "lowFrames": [
        "idle/SW: 1/4",
        "idle/NW: 1/4",
        "idle/NE: 1/4",
        "idle/SE: 1/4",
        "walk/SW: 2/6",
        "walk/NW: 2/6",
        "walk/NE: 2/6",
        "walk/SE: 2/6"
      ],
      "minCardinalUnique": 4,
      "provisional": [
        "SE",
        "NE",
        "SW",
        "NW"
      ]
    },
    {
      "id": "boss_mud_hydra_001",
      "name": "Hydra bùn (boss chúa)",
      "frameSize": {
        "width": 224,
        "height": 224
      },
      "bodyHeight": 130,
      "frames": {
        "idle": {
          "S": {
            "slots": 4,
            "unique": 4
          },
          "SW": {
            "slots": 4,
            "unique": 1
          },
          "W": {
            "slots": 4,
            "unique": 4
          },
          "NW": {
            "slots": 4,
            "unique": 1
          },
          "N": {
            "slots": 4,
            "unique": 4
          },
          "NE": {
            "slots": 4,
            "unique": 1
          },
          "E": {
            "slots": 4,
            "unique": 4
          },
          "SE": {
            "slots": 4,
            "unique": 1
          }
        },
        "walk": {
          "S": {
            "slots": 6,
            "unique": 6
          },
          "SW": {
            "slots": 6,
            "unique": 2
          },
          "W": {
            "slots": 6,
            "unique": 6
          },
          "NW": {
            "slots": 6,
            "unique": 2
          },
          "N": {
            "slots": 6,
            "unique": 6
          },
          "NE": {
            "slots": 6,
            "unique": 2
          },
          "E": {
            "slots": 6,
            "unique": 6
          },
          "SE": {
            "slots": 6,
            "unique": 2
          }
        },
        "attack": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        },
        "death": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        }
      },
      "lowFrames": [
        "idle/SW: 1/4",
        "idle/NW: 1/4",
        "idle/NE: 1/4",
        "idle/SE: 1/4",
        "walk/SW: 2/6",
        "walk/NW: 2/6",
        "walk/NE: 2/6",
        "walk/SE: 2/6"
      ],
      "minCardinalUnique": 4,
      "provisional": [
        "SE",
        "NE",
        "SW",
        "NW"
      ]
    },
    {
      "id": "boss_pharaoh_001",
      "name": "Pharaoh xác ướp (boss khu)",
      "frameSize": {
        "width": 160,
        "height": 160
      },
      "bodyHeight": 75,
      "frames": {
        "idle": {
          "S": {
            "slots": 4,
            "unique": 4
          },
          "SW": {
            "slots": 4,
            "unique": 1
          },
          "W": {
            "slots": 4,
            "unique": 4
          },
          "NW": {
            "slots": 4,
            "unique": 1
          },
          "N": {
            "slots": 4,
            "unique": 4
          },
          "NE": {
            "slots": 4,
            "unique": 1
          },
          "E": {
            "slots": 4,
            "unique": 4
          },
          "SE": {
            "slots": 4,
            "unique": 1
          }
        },
        "walk": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "SW": {
            "slots": 6,
            "unique": 2
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "NW": {
            "slots": 6,
            "unique": 2
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "NE": {
            "slots": 6,
            "unique": 2
          },
          "E": {
            "slots": 8,
            "unique": 8
          },
          "SE": {
            "slots": 6,
            "unique": 2
          }
        },
        "attack": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        },
        "death": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        }
      },
      "lowFrames": [
        "idle/SW: 1/4",
        "idle/NW: 1/4",
        "idle/NE: 1/4",
        "idle/SE: 1/4",
        "walk/SW: 2/6",
        "walk/NW: 2/6",
        "walk/NE: 2/6",
        "walk/SE: 2/6"
      ],
      "minCardinalUnique": 4,
      "provisional": [
        "SE",
        "NE",
        "SW",
        "NW"
      ]
    },
    {
      "id": "boss_salamander_001",
      "name": "Salamander (boss khu)",
      "frameSize": {
        "width": 184,
        "height": 184
      },
      "bodyHeight": 112,
      "frames": {
        "idle": {
          "S": {
            "slots": 4,
            "unique": 4
          },
          "SW": {
            "slots": 4,
            "unique": 1
          },
          "W": {
            "slots": 4,
            "unique": 4
          },
          "NW": {
            "slots": 4,
            "unique": 1
          },
          "N": {
            "slots": 4,
            "unique": 4
          },
          "NE": {
            "slots": 4,
            "unique": 1
          },
          "E": {
            "slots": 4,
            "unique": 4
          },
          "SE": {
            "slots": 4,
            "unique": 1
          }
        },
        "walk": {
          "S": {
            "slots": 6,
            "unique": 6
          },
          "SW": {
            "slots": 6,
            "unique": 2
          },
          "W": {
            "slots": 6,
            "unique": 6
          },
          "NW": {
            "slots": 6,
            "unique": 2
          },
          "N": {
            "slots": 6,
            "unique": 6
          },
          "NE": {
            "slots": 6,
            "unique": 2
          },
          "E": {
            "slots": 6,
            "unique": 6
          },
          "SE": {
            "slots": 6,
            "unique": 2
          }
        },
        "attack": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        },
        "death": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        }
      },
      "lowFrames": [
        "idle/SW: 1/4",
        "idle/NW: 1/4",
        "idle/NE: 1/4",
        "idle/SE: 1/4",
        "walk/SW: 2/6",
        "walk/NW: 2/6",
        "walk/NE: 2/6",
        "walk/SE: 2/6"
      ],
      "minCardinalUnique": 4,
      "provisional": [
        "SE",
        "NE",
        "SW",
        "NW"
      ]
    },
    {
      "id": "boss_sandworm_001",
      "name": "Sâu cát khổng lồ (boss chúa)",
      "frameSize": {
        "width": 224,
        "height": 224
      },
      "bodyHeight": 113,
      "frames": {
        "idle": {
          "S": {
            "slots": 4,
            "unique": 4
          },
          "SW": {
            "slots": 4,
            "unique": 1
          },
          "W": {
            "slots": 4,
            "unique": 4
          },
          "NW": {
            "slots": 4,
            "unique": 1
          },
          "N": {
            "slots": 4,
            "unique": 4
          },
          "NE": {
            "slots": 4,
            "unique": 1
          },
          "E": {
            "slots": 4,
            "unique": 4
          },
          "SE": {
            "slots": 4,
            "unique": 1
          }
        },
        "walk": {
          "S": {
            "slots": 6,
            "unique": 6
          },
          "SW": {
            "slots": 6,
            "unique": 2
          },
          "W": {
            "slots": 6,
            "unique": 6
          },
          "NW": {
            "slots": 6,
            "unique": 2
          },
          "N": {
            "slots": 6,
            "unique": 6
          },
          "NE": {
            "slots": 6,
            "unique": 2
          },
          "E": {
            "slots": 6,
            "unique": 6
          },
          "SE": {
            "slots": 6,
            "unique": 2
          }
        },
        "attack": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        },
        "death": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        }
      },
      "lowFrames": [
        "idle/SW: 1/4",
        "idle/NW: 1/4",
        "idle/NE: 1/4",
        "idle/SE: 1/4",
        "walk/SW: 2/6",
        "walk/NW: 2/6",
        "walk/NE: 2/6",
        "walk/SE: 2/6"
      ],
      "minCardinalUnique": 4,
      "provisional": [
        "SE",
        "NE",
        "SW",
        "NW"
      ]
    },
    {
      "id": "boss_scorpion_queen_001",
      "name": "Bọ cạp chúa (boss khu)",
      "frameSize": {
        "width": 184,
        "height": 184
      },
      "bodyHeight": 121,
      "frames": {
        "idle": {
          "S": {
            "slots": 4,
            "unique": 4
          },
          "SW": {
            "slots": 4,
            "unique": 1
          },
          "W": {
            "slots": 4,
            "unique": 4
          },
          "NW": {
            "slots": 4,
            "unique": 1
          },
          "N": {
            "slots": 4,
            "unique": 4
          },
          "NE": {
            "slots": 4,
            "unique": 1
          },
          "E": {
            "slots": 4,
            "unique": 4
          },
          "SE": {
            "slots": 4,
            "unique": 1
          }
        },
        "walk": {
          "S": {
            "slots": 6,
            "unique": 6
          },
          "SW": {
            "slots": 6,
            "unique": 2
          },
          "W": {
            "slots": 6,
            "unique": 6
          },
          "NW": {
            "slots": 6,
            "unique": 2
          },
          "N": {
            "slots": 6,
            "unique": 6
          },
          "NE": {
            "slots": 6,
            "unique": 2
          },
          "E": {
            "slots": 6,
            "unique": 6
          },
          "SE": {
            "slots": 6,
            "unique": 2
          }
        },
        "attack": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        },
        "death": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        }
      },
      "lowFrames": [
        "idle/SW: 1/4",
        "idle/NW: 1/4",
        "idle/NE: 1/4",
        "idle/SE: 1/4",
        "walk/SW: 2/6",
        "walk/NW: 2/6",
        "walk/NE: 2/6",
        "walk/SE: 2/6"
      ],
      "minCardinalUnique": 4,
      "provisional": [
        "SE",
        "NE",
        "SW",
        "NW"
      ]
    },
    {
      "id": "boss_storm_eagle_001",
      "name": "Đại bàng bão (boss khu)",
      "frameSize": {
        "width": 184,
        "height": 184
      },
      "bodyHeight": 109,
      "frames": {
        "idle": {
          "S": {
            "slots": 4,
            "unique": 4
          },
          "SW": {
            "slots": 4,
            "unique": 1
          },
          "W": {
            "slots": 4,
            "unique": 4
          },
          "NW": {
            "slots": 4,
            "unique": 1
          },
          "N": {
            "slots": 4,
            "unique": 4
          },
          "NE": {
            "slots": 4,
            "unique": 1
          },
          "E": {
            "slots": 4,
            "unique": 4
          },
          "SE": {
            "slots": 4,
            "unique": 1
          }
        },
        "walk": {
          "S": {
            "slots": 6,
            "unique": 6
          },
          "SW": {
            "slots": 6,
            "unique": 2
          },
          "W": {
            "slots": 6,
            "unique": 6
          },
          "NW": {
            "slots": 6,
            "unique": 2
          },
          "N": {
            "slots": 6,
            "unique": 6
          },
          "NE": {
            "slots": 6,
            "unique": 2
          },
          "E": {
            "slots": 6,
            "unique": 6
          },
          "SE": {
            "slots": 6,
            "unique": 2
          }
        },
        "attack": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        },
        "death": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        }
      },
      "lowFrames": [
        "idle/SW: 1/4",
        "idle/NW: 1/4",
        "idle/NE: 1/4",
        "idle/SE: 1/4",
        "walk/SW: 2/6",
        "walk/NW: 2/6",
        "walk/NE: 2/6",
        "walk/SE: 2/6"
      ],
      "minCardinalUnique": 4,
      "provisional": [
        "SE",
        "NE",
        "SW",
        "NW"
      ]
    },
    {
      "id": "boss_swamp_witch_001",
      "name": "Phù thuỷ đầm (boss khu)",
      "frameSize": {
        "width": 160,
        "height": 160
      },
      "bodyHeight": 94,
      "frames": {
        "idle": {
          "S": {
            "slots": 4,
            "unique": 4
          },
          "SW": {
            "slots": 4,
            "unique": 1
          },
          "W": {
            "slots": 4,
            "unique": 4
          },
          "NW": {
            "slots": 4,
            "unique": 1
          },
          "N": {
            "slots": 4,
            "unique": 4
          },
          "NE": {
            "slots": 4,
            "unique": 1
          },
          "E": {
            "slots": 4,
            "unique": 4
          },
          "SE": {
            "slots": 4,
            "unique": 1
          }
        },
        "walk": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "SW": {
            "slots": 6,
            "unique": 2
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "NW": {
            "slots": 6,
            "unique": 2
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "NE": {
            "slots": 6,
            "unique": 2
          },
          "E": {
            "slots": 8,
            "unique": 8
          },
          "SE": {
            "slots": 6,
            "unique": 2
          }
        },
        "attack": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        },
        "death": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        }
      },
      "lowFrames": [
        "idle/SW: 1/4",
        "idle/NW: 1/4",
        "idle/NE: 1/4",
        "idle/SE: 1/4",
        "walk/SW: 2/6",
        "walk/NW: 2/6",
        "walk/NE: 2/6",
        "walk/SE: 2/6"
      ],
      "minCardinalUnique": 4,
      "provisional": [
        "SE",
        "NE",
        "SW",
        "NW"
      ]
    },
    {
      "id": "boss_wind_drake_001",
      "name": "Rồng gió (con của Tuyệt Vân) (boss khu)",
      "frameSize": {
        "width": 224,
        "height": 224
      },
      "bodyHeight": 154,
      "frames": {
        "idle": {
          "S": {
            "slots": 4,
            "unique": 4
          },
          "SW": {
            "slots": 4,
            "unique": 1
          },
          "W": {
            "slots": 4,
            "unique": 4
          },
          "NW": {
            "slots": 4,
            "unique": 1
          },
          "N": {
            "slots": 4,
            "unique": 4
          },
          "NE": {
            "slots": 4,
            "unique": 1
          },
          "E": {
            "slots": 4,
            "unique": 4
          },
          "SE": {
            "slots": 4,
            "unique": 1
          }
        },
        "walk": {
          "S": {
            "slots": 6,
            "unique": 6
          },
          "SW": {
            "slots": 6,
            "unique": 2
          },
          "W": {
            "slots": 6,
            "unique": 6
          },
          "NW": {
            "slots": 6,
            "unique": 2
          },
          "N": {
            "slots": 6,
            "unique": 6
          },
          "NE": {
            "slots": 6,
            "unique": 2
          },
          "E": {
            "slots": 6,
            "unique": 6
          },
          "SE": {
            "slots": 6,
            "unique": 2
          }
        },
        "attack": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        },
        "death": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        }
      },
      "lowFrames": [
        "idle/SW: 1/4",
        "idle/NW: 1/4",
        "idle/NE: 1/4",
        "idle/SE: 1/4",
        "walk/SW: 2/6",
        "walk/NW: 2/6",
        "walk/NE: 2/6",
        "walk/SE: 2/6"
      ],
      "minCardinalUnique": 4,
      "provisional": [
        "SE",
        "NE",
        "SW",
        "NW"
      ]
    },
    {
      "id": "boss_wind_mage_001",
      "name": "Pháp sư gió (boss khu)",
      "frameSize": {
        "width": 160,
        "height": 160
      },
      "bodyHeight": 87,
      "frames": {
        "idle": {
          "S": {
            "slots": 4,
            "unique": 4
          },
          "SW": {
            "slots": 4,
            "unique": 1
          },
          "W": {
            "slots": 4,
            "unique": 4
          },
          "NW": {
            "slots": 4,
            "unique": 1
          },
          "N": {
            "slots": 4,
            "unique": 4
          },
          "NE": {
            "slots": 4,
            "unique": 1
          },
          "E": {
            "slots": 4,
            "unique": 4
          },
          "SE": {
            "slots": 4,
            "unique": 1
          }
        },
        "walk": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "SW": {
            "slots": 6,
            "unique": 2
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "NW": {
            "slots": 6,
            "unique": 2
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "NE": {
            "slots": 6,
            "unique": 2
          },
          "E": {
            "slots": 8,
            "unique": 8
          },
          "SE": {
            "slots": 6,
            "unique": 2
          }
        },
        "attack": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        },
        "death": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        }
      },
      "lowFrames": [
        "idle/SW: 1/4",
        "idle/NW: 1/4",
        "idle/NE: 1/4",
        "idle/SE: 1/4",
        "walk/SW: 2/6",
        "walk/NW: 2/6",
        "walk/NE: 2/6",
        "walk/SE: 2/6"
      ],
      "minCardinalUnique": 4,
      "provisional": [
        "SE",
        "NE",
        "SW",
        "NW"
      ]
    },
    {
      "id": "boss_yeti_001",
      "name": "Yeti (boss khu)",
      "frameSize": {
        "width": 184,
        "height": 184
      },
      "bodyHeight": 93,
      "frames": {
        "idle": {
          "S": {
            "slots": 4,
            "unique": 4
          },
          "SW": {
            "slots": 4,
            "unique": 1
          },
          "W": {
            "slots": 4,
            "unique": 4
          },
          "NW": {
            "slots": 4,
            "unique": 1
          },
          "N": {
            "slots": 4,
            "unique": 4
          },
          "NE": {
            "slots": 4,
            "unique": 1
          },
          "E": {
            "slots": 4,
            "unique": 4
          },
          "SE": {
            "slots": 4,
            "unique": 1
          }
        },
        "walk": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "SW": {
            "slots": 6,
            "unique": 2
          },
          "W": {
            "slots": 6,
            "unique": 6
          },
          "NW": {
            "slots": 6,
            "unique": 2
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "NE": {
            "slots": 6,
            "unique": 2
          },
          "E": {
            "slots": 6,
            "unique": 6
          },
          "SE": {
            "slots": 6,
            "unique": 2
          }
        },
        "attack": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        },
        "death": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        }
      },
      "lowFrames": [
        "idle/SW: 1/4",
        "idle/NW: 1/4",
        "idle/NE: 1/4",
        "idle/SE: 1/4",
        "walk/SW: 2/6",
        "walk/NW: 2/6",
        "walk/NE: 2/6",
        "walk/SE: 2/6"
      ],
      "minCardinalUnique": 4,
      "provisional": [
        "SE",
        "NE",
        "SW",
        "NW"
      ]
    },
    {
      "id": "dragon_fire_001",
      "name": "Hoả Long \"Viêm Đế\" (rồng nguyên tố)",
      "frameSize": {
        "width": 272,
        "height": 272
      },
      "bodyHeight": 148,
      "frames": {
        "idle": {
          "S": {
            "slots": 4,
            "unique": 4
          },
          "SW": {
            "slots": 4,
            "unique": 1
          },
          "W": {
            "slots": 4,
            "unique": 4
          },
          "NW": {
            "slots": 4,
            "unique": 1
          },
          "N": {
            "slots": 4,
            "unique": 4
          },
          "NE": {
            "slots": 4,
            "unique": 1
          },
          "E": {
            "slots": 4,
            "unique": 4
          },
          "SE": {
            "slots": 4,
            "unique": 1
          }
        },
        "walk": {
          "S": {
            "slots": 6,
            "unique": 6
          },
          "SW": {
            "slots": 6,
            "unique": 2
          },
          "W": {
            "slots": 6,
            "unique": 6
          },
          "NW": {
            "slots": 6,
            "unique": 2
          },
          "N": {
            "slots": 6,
            "unique": 6
          },
          "NE": {
            "slots": 6,
            "unique": 2
          },
          "E": {
            "slots": 6,
            "unique": 6
          },
          "SE": {
            "slots": 6,
            "unique": 2
          }
        },
        "attack": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        },
        "death": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        }
      },
      "lowFrames": [
        "idle/SW: 1/4",
        "idle/NW: 1/4",
        "idle/NE: 1/4",
        "idle/SE: 1/4",
        "walk/SW: 2/6",
        "walk/NW: 2/6",
        "walk/NE: 2/6",
        "walk/SE: 2/6"
      ],
      "minCardinalUnique": 4,
      "provisional": [
        "SE",
        "NE",
        "SW",
        "NW"
      ]
    },
    {
      "id": "dragon_ice_001",
      "name": "Băng Long \"Hàn Sương\" (rồng nguyên tố)",
      "frameSize": {
        "width": 272,
        "height": 272
      },
      "bodyHeight": 184,
      "frames": {
        "idle": {
          "S": {
            "slots": 4,
            "unique": 4
          },
          "SW": {
            "slots": 4,
            "unique": 1
          },
          "W": {
            "slots": 4,
            "unique": 4
          },
          "NW": {
            "slots": 4,
            "unique": 1
          },
          "N": {
            "slots": 4,
            "unique": 4
          },
          "NE": {
            "slots": 4,
            "unique": 1
          },
          "E": {
            "slots": 4,
            "unique": 4
          },
          "SE": {
            "slots": 4,
            "unique": 1
          }
        },
        "walk": {
          "S": {
            "slots": 6,
            "unique": 6
          },
          "SW": {
            "slots": 6,
            "unique": 2
          },
          "W": {
            "slots": 6,
            "unique": 6
          },
          "NW": {
            "slots": 6,
            "unique": 2
          },
          "N": {
            "slots": 6,
            "unique": 6
          },
          "NE": {
            "slots": 6,
            "unique": 2
          },
          "E": {
            "slots": 6,
            "unique": 6
          },
          "SE": {
            "slots": 6,
            "unique": 2
          }
        },
        "attack": {
          "W": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        },
        "death": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        }
      },
      "lowFrames": [
        "idle/SW: 1/4",
        "idle/NW: 1/4",
        "idle/NE: 1/4",
        "idle/SE: 1/4",
        "walk/SW: 2/6",
        "walk/NW: 2/6",
        "walk/NE: 2/6",
        "walk/SE: 2/6"
      ],
      "minCardinalUnique": 4,
      "provisional": [
        "SE",
        "NE",
        "SW",
        "NW"
      ]
    },
    {
      "id": "dragon_water_001",
      "name": "Thuỷ Long \"Thương Hải\" (rồng nguyên tố)",
      "frameSize": {
        "width": 272,
        "height": 272
      },
      "bodyHeight": 197,
      "frames": {
        "idle": {
          "S": {
            "slots": 4,
            "unique": 4
          },
          "SW": {
            "slots": 4,
            "unique": 1
          },
          "W": {
            "slots": 4,
            "unique": 4
          },
          "NW": {
            "slots": 4,
            "unique": 1
          },
          "N": {
            "slots": 4,
            "unique": 4
          },
          "NE": {
            "slots": 4,
            "unique": 1
          },
          "E": {
            "slots": 4,
            "unique": 4
          },
          "SE": {
            "slots": 4,
            "unique": 1
          }
        },
        "walk": {
          "S": {
            "slots": 6,
            "unique": 6
          },
          "SW": {
            "slots": 6,
            "unique": 2
          },
          "W": {
            "slots": 6,
            "unique": 6
          },
          "NW": {
            "slots": 6,
            "unique": 2
          },
          "N": {
            "slots": 6,
            "unique": 6
          },
          "NE": {
            "slots": 6,
            "unique": 2
          },
          "E": {
            "slots": 6,
            "unique": 6
          },
          "SE": {
            "slots": 6,
            "unique": 2
          }
        },
        "attack": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        },
        "death": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        }
      },
      "lowFrames": [
        "idle/SW: 1/4",
        "idle/NW: 1/4",
        "idle/NE: 1/4",
        "idle/SE: 1/4",
        "walk/SW: 2/6",
        "walk/NW: 2/6",
        "walk/NE: 2/6",
        "walk/SE: 2/6"
      ],
      "minCardinalUnique": 4,
      "provisional": [
        "SE",
        "NE",
        "SW",
        "NW"
      ]
    },
    {
      "id": "dragon_wind_001",
      "name": "Phong Long \"Tuyệt Vân\" (rồng nguyên tố)",
      "frameSize": {
        "width": 272,
        "height": 272
      },
      "bodyHeight": 177,
      "frames": {
        "idle": {
          "S": {
            "slots": 4,
            "unique": 4
          },
          "SW": {
            "slots": 4,
            "unique": 1
          },
          "W": {
            "slots": 4,
            "unique": 4
          },
          "NW": {
            "slots": 4,
            "unique": 1
          },
          "N": {
            "slots": 4,
            "unique": 4
          },
          "NE": {
            "slots": 4,
            "unique": 1
          },
          "E": {
            "slots": 4,
            "unique": 4
          },
          "SE": {
            "slots": 4,
            "unique": 1
          }
        },
        "walk": {
          "S": {
            "slots": 6,
            "unique": 6
          },
          "SW": {
            "slots": 6,
            "unique": 2
          },
          "W": {
            "slots": 6,
            "unique": 6
          },
          "NW": {
            "slots": 6,
            "unique": 2
          },
          "N": {
            "slots": 6,
            "unique": 6
          },
          "NE": {
            "slots": 6,
            "unique": 2
          },
          "E": {
            "slots": 6,
            "unique": 6
          },
          "SE": {
            "slots": 6,
            "unique": 2
          }
        },
        "attack": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        },
        "death": {
          "S": {
            "slots": 8,
            "unique": 8
          },
          "W": {
            "slots": 8,
            "unique": 8
          },
          "N": {
            "slots": 8,
            "unique": 8
          },
          "E": {
            "slots": 8,
            "unique": 8
          }
        }
      },
      "lowFrames": [
        "idle/SW: 1/4",
        "idle/NW: 1/4",
        "idle/NE: 1/4",
        "idle/SE: 1/4",
        "walk/SW: 2/6",
        "walk/NW: 2/6",
        "walk/NE: 2/6",
        "walk/SE: 2/6"
      ],
      "minCardinalUnique": 4,
      "provisional": [
        "SE",
        "NE",
        "SW",
        "NW"
      ]
    }
  ],
  "tasks": [
    {
      "id": "audit",
      "group": "Chuẩn bị",
      "name": "Kiểm kê 174 map và 25 boss",
      "detail": "Đã xem ảnh minimap của 174 map và 13 trung tâm; kiểm đếm ảnh frame bằng hash RGBA, không chỉ số slot. Chưa phải nghiệm thu trong Unity.",
      "weight": 2,
      "phase": 0,
      "region": null,
      "depends": [],
      "steps": [
        {
          "label": "Dữ liệu và ảnh tổng quan",
          "weight": 100,
          "done": true,
          "evidence": "Kiểm kê 26/10/2026: .aether-stage/world-renewal/"
        }
      ],
      "requiresNewArt": false
    },
    {
      "id": "style",
      "group": "Chuẩn bị",
      "name": "Chốt quy chuẩn mỹ thuật và tỷ lệ",
      "detail": "Cảnh chuẩn Thistlewood dùng người PixelLab gốc, thước danh nghĩa 75px / PPU 48 (idle đo 71–72px). Đã đo bảy nhà cũ và đặc tả nhà trọ chính 336×440, cửa 56×104; giữ các nhà cũ làm công trình phụ. Pipeline kiểm tỷ lệ/hash/alpha/palette đã có, vẫn chờ vẽ ảnh thật và kiểm trong Unity. Tài liệu: docs/thiet-ke/thistlewood-chuan-my-thuat.md. Ưu tiên mới 26/10: giữ phần chuẩn đã làm, vẽ nhà trọ/map sau khi hoàn thiện nhân vật, tóc và vũ khí cơ bản.",
      "weight": 3,
      "phase": 1,
      "region": null,
      "depends": [
        "audit"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": true,
          "evidence": "26/10: docs/thiet-ke/thistlewood-chuan-my-thuat.md; reports/world-style/thistlewood/baseline.json và native-scale-reference.png; bảy nhà cũ đã đo, chuẩn cửa/tầng/neo/footprint đã đặc tả."
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": "Cổng kiểm source ở props/worldArt.ts đã chuẩn bị, 6 test qua; ảnh nhà chưa vẽ. Imagegen đã hoạt động lại, đang ưu tiên nhân vật/vũ khí theo chỉ đạo mới."
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": "Nhánh đặt nhà mới đã viết, giữ đủ bảy nhà cũ; kiểm đường đi tới cửa và ba cổng qua. Build thử 14 map / 46 file cùng nội dung sản xuất khi thiếu ảnh. Chưa nhập sprite mới vào Unity."
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": "14 test map + 16 test công trình + typecheck pipeline qua. Còn nghiệm thu hình mới, sorting, mái che người, camera, PC/APK trong Unity."
        }
      ],
      "requiresNewArt": true,
      "priority": 3
    },
    {
      "id": "politics",
      "group": "Cốt truyện",
      "name": "Bản đồ chính trị, vua và phe phái",
      "detail": "Bản thiết kế mới cho 13 vùng, 20 tổ chức đề xuất và 13 quan hệ; bỏ các nhân vật/quyền kế vị từ truyện cũ. Đã đối chiếu vị trí map thật; chưa đặt NPC hoặc mở nhiệm vụ.",
      "weight": 4,
      "phase": 1,
      "region": null,
      "depends": [
        "audit"
      ],
      "steps": [
        {
          "label": "Đối chiếu hướng mới và vị trí chính quyền",
          "weight": 10,
          "done": true,
          "evidence": "26/10/2026: docs/dinh-huong-aether.md và packages/sim/src/worldDesign.ts; các chính quyền và tên tổ chức mới là đề xuất, danh tính vua chưa chốt."
        },
        {
          "label": "Thiết kế và dữ liệu vùng / phe / quan hệ",
          "weight": 45,
          "done": true,
          "evidence": "26/10/2026: packages/sim/src/worldDesign.ts: 13 hồ sơ chính trị, 20 phe, 13 quan hệ; mọi phe mới ghi proposal."
        },
        {
          "label": "Xuất dữ liệu và bản xem admin",
          "weight": 25,
          "done": true,
          "evidence": "26/10/2026: scripts/export-world-design.mts; Unity Data/Sim/worldDesign.json; Admin có sơ đồ và bản chữ riêng quyền quản trị."
        },
        {
          "label": "Kiểm ghế, quan hệ và tính liên tục",
          "weight": 20,
          "done": true,
          "evidence": "26/10/2026: world-design.test.ts qua: ghế map tồn tại, ID phe không trùng/thiếu, quan hệ không tự lặp; bộ sim test và typecheck qua."
        }
      ],
      "requiresNewArt": false
    },
    {
      "id": "sky-lore",
      "group": "Cốt truyện",
      "name": "Thiên Thành và vị thần tri thức",
      "detail": "Bản thiết kế Thiên Thành trong hướng mới: một thần tri thức, bốn không gian, bốn chương và mười nguồn nghiên cứu. Cấp 60 và tên là đề xuất; chưa mở map/NPC/quest.",
      "weight": 5,
      "phase": 1,
      "region": null,
      "depends": [
        "politics"
      ],
      "steps": [
        {
          "label": "Đề cương thần, không gian và vai trò",
          "weight": 10,
          "done": true,
          "evidence": "26/10/2026: worldDesign.ts SKY_CASTLE_DESIGN, đúng một thần và bốn không gian; đề cương mới không kế thừa tuyến truyện cũ."
        },
        {
          "label": "Bốn chương và luật điều kiện thư khố",
          "weight": 45,
          "done": true,
          "evidence": "26/10/2026: ARCHIVE_EVIDENCE / ARCHIVE_CHAPTERS; archiveAccess, archiveChapterGate và visibleArchive đã viết, chưa nối save gameplay."
        },
        {
          "label": "Bản chữ, dữ liệu Unity và xem admin",
          "weight": 25,
          "done": true,
          "evidence": "26/10/2026: docs/thiet-ke/chinh-tri-dia-ly-thien-thanh.md; module JSON riêng; admin đọc đầy đủ bốn chương qua API có quyền."
        },
        {
          "label": "Kiểm chứng cứ, khóa chương và đầu vào",
          "weight": 20,
          "done": true,
          "evidence": "26/10/2026: world-design.test.ts: chứng cứ trỏ map thật, không mở bằng NaN/cờ đọc giả, không lộ nội dung bị khóa; không tự trao kết cục/skill."
        }
      ],
      "requiresNewArt": false
    },
    {
      "id": "hub-human",
      "group": "Trung tâm vùng",
      "name": "Thị trấn Thistlewood — xây lại trung tâm",
      "detail": "Gỗ sồi, đá kem, mái ngói xanh rêu; nhà phố 2–3 tầng, nhà hội và tháp chuông. Xe hàng, giếng, bảng hội, lò bánh, vườn rau, quán trọ có khách. Giữ nhà nhỏ cũ làm nhà phụ. Đề xuất 8–12 nhà chính, 2 điểm nhấn cao, 3 cụm sinh hoạt; điều chỉnh theo map, không rải prop kín đường.",
      "weight": 6,
      "phase": 2,
      "region": "human",
      "depends": [
        "style",
        "politics"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "env-human",
      "group": "Cảnh quan",
      "name": "Thung lũng Thistlewood — toàn bộ map",
      "detail": "Quảng trường trống; cây và nhà nhỏ rải thưa, thiếu tuyến sinh hoạt. Rà từng map, vẽ cây/đá/đồ vùng riêng, thêm sinh hoạt và khoảng nghỉ; kiểm lại 14 map ở zoom chơi thật.",
      "weight": 5,
      "phase": 2,
      "region": "human",
      "depends": [
        "style"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "mob-human",
      "group": "Quái và boss",
      "name": "Thung lũng Thistlewood — thêm quái",
      "detail": "Đề xuất ít nhất 3 loài mới: Linh cẩu đồng, bù nhìn ma, kỵ sĩ rừng tha hóa. Vẽ đủ đứng/đi/đánh/trúng đòn/gục, ghép spawn và cân bằng; giữ giới hạn tổng quái và hiệu năng.",
      "weight": 4,
      "phase": 4,
      "region": "human",
      "depends": [
        "env-human"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "newboss-human",
      "group": "Quái và boss",
      "name": "Thung lũng Thistlewood — boss mới",
      "detail": "Ý tưởng: Cổ Thụ Nguyền Rủa. Thiết kế đấu trường, đòn báo trước và phần thưởng riêng; tên/chỉ số cần duyệt, chưa được vẽ hoặc gắn vào game.",
      "weight": 5,
      "phase": 4,
      "region": "human",
      "depends": [
        "mob-human"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "hub-swamp",
      "group": "Trung tâm vùng",
      "name": "Làng nhà sàn Lau Xám — xây lại trung tâm",
      "detail": "Gỗ chống ẩm, mái sậy, nhà sàn 2 tầng; đại sảnh trên cọc và cầu gỗ phân nhánh. Bến đò, chợ cá, giỏ thuốc, lưới phơi, đèn dầu và bè chở hàng. Giữ nhà nhỏ cũ làm nhà phụ. Đề xuất 8–12 nhà chính, 2 điểm nhấn cao, 3 cụm sinh hoạt; điều chỉnh theo map, không rải prop kín đường.",
      "weight": 6,
      "phase": 3,
      "region": "swamp",
      "depends": [
        "style",
        "politics"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "env-swamp",
      "group": "Cảnh quan",
      "name": "Đầm lầy Mù Sương — toàn bộ map",
      "detail": "Đã có bản sắc nhà sàn; trung tâm vẫn thiếu mật độ và cao độ. Rà từng map, vẽ cây/đá/đồ vùng riêng, thêm sinh hoạt và khoảng nghỉ; kiểm lại 13 map ở zoom chơi thật.",
      "weight": 5,
      "phase": 3,
      "region": "swamp",
      "depends": [
        "style"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "mob-swamp",
      "group": "Quái và boss",
      "name": "Đầm lầy Mù Sương — thêm quái",
      "detail": "Đề xuất ít nhất 3 loài mới: Đỉa giáp bùn, cá sấu lau, phù thủy sương. Vẽ đủ đứng/đi/đánh/trúng đòn/gục, ghép spawn và cân bằng; giữ giới hạn tổng quái và hiệu năng.",
      "weight": 4,
      "phase": 4,
      "region": "swamp",
      "depends": [
        "env-swamp"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "newboss-swamp",
      "group": "Quái và boss",
      "name": "Đầm lầy Mù Sương — boss mới",
      "detail": "Ý tưởng: Cá Sấu Cổ Đầm. Thiết kế đấu trường, đòn báo trước và phần thưởng riêng; tên/chỉ số cần duyệt, chưa được vẽ hoặc gắn vào game.",
      "weight": 5,
      "phase": 4,
      "region": "swamp",
      "depends": [
        "mob-swamp"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "hub-desert",
      "group": "Trung tâm vùng",
      "name": "Thành ốc đảo Sahrin — xây lại trung tâm",
      "detail": "Sa thạch đỏ, vòm mái, gạch men lam; thành Sahrin có cổng cao, cung điện và phố bậc thang. Chợ vải, guồng nước, bể chứa, đoàn lạc đà, quầy gia vị, vườn trong sân. Giữ nhà nhỏ cũ làm nhà phụ. Đề xuất 8–12 nhà chính, 2 điểm nhấn cao, 3 cụm sinh hoạt; điều chỉnh theo map, không rải prop kín đường.",
      "weight": 6,
      "phase": 3,
      "region": "desert",
      "depends": [
        "style",
        "politics"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "env-desert",
      "group": "Cảnh quan",
      "name": "Sa mạc Hồng Cát — toàn bộ map",
      "detail": "Nhà vòm nhận diện tốt nhưng chưa đủ tầm thành đô; cần tường thành và cung điện. Rà từng map, vẽ cây/đá/đồ vùng riêng, thêm sinh hoạt và khoảng nghỉ; kiểm lại 13 map ở zoom chơi thật.",
      "weight": 5,
      "phase": 3,
      "region": "desert",
      "depends": [
        "style"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "mob-desert",
      "group": "Quái và boss",
      "name": "Sa mạc Hồng Cát — thêm quái",
      "detail": "Đề xuất ít nhất 3 loài mới: Bọ kính sa mạc, kỵ binh cát, linh thể ốc đảo. Vẽ đủ đứng/đi/đánh/trúng đòn/gục, ghép spawn và cân bằng; giữ giới hạn tổng quái và hiệu năng.",
      "weight": 4,
      "phase": 4,
      "region": "desert",
      "depends": [
        "env-desert"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "newboss-desert",
      "group": "Quái và boss",
      "name": "Sa mạc Hồng Cát — boss mới",
      "detail": "Ý tưởng: Hộ Vệ Giếng Mặt Trời. Thiết kế đấu trường, đòn báo trước và phần thưởng riêng; tên/chỉ số cần duyệt, chưa được vẽ hoặc gắn vào game.",
      "weight": 5,
      "phase": 4,
      "region": "desert",
      "depends": [
        "mob-desert"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "hub-highland",
      "group": "Trung tâm vùng",
      "name": "Làng Cối Xay Gió — xây lại trung tâm",
      "detail": "Đá sáng và gỗ đón gió, mái dốc; nhà cao sát sườn đồi, tháp cối xay nhiều tầng. Cầu treo, cờ hướng gió, sân tập, dây phơi, chuồng chim, hàng vải. Giữ nhà nhỏ cũ làm nhà phụ. Đề xuất 8–12 nhà chính, 2 điểm nhấn cao, 3 cụm sinh hoạt; điều chỉnh theo map, không rải prop kín đường.",
      "weight": 6,
      "phase": 3,
      "region": "highland",
      "depends": [
        "style",
        "politics"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "env-highland",
      "group": "Cảnh quan",
      "name": "Cao nguyên Gió Hú — toàn bộ map",
      "detail": "Nhiều cây màu sặc sỡ; cần khoảng nghỉ và địa hình cao nguyên dễ đọc hơn. Rà từng map, vẽ cây/đá/đồ vùng riêng, thêm sinh hoạt và khoảng nghỉ; kiểm lại 14 map ở zoom chơi thật.",
      "weight": 5,
      "phase": 3,
      "region": "highland",
      "depends": [
        "style"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "mob-highland",
      "group": "Quái và boss",
      "name": "Cao nguyên Gió Hú — thêm quái",
      "detail": "Đề xuất ít nhất 3 loài mới: Dê đá cuồng phong, cung thủ diều, linh hạc. Vẽ đủ đứng/đi/đánh/trúng đòn/gục, ghép spawn và cân bằng; giữ giới hạn tổng quái và hiệu năng.",
      "weight": 4,
      "phase": 4,
      "region": "highland",
      "depends": [
        "env-highland"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "newboss-highland",
      "group": "Quái và boss",
      "name": "Cao nguyên Gió Hú — boss mới",
      "detail": "Ý tưởng: Kỵ Sĩ Bão. Thiết kế đấu trường, đòn báo trước và phần thưởng riêng; tên/chỉ số cần duyệt, chưa được vẽ hoặc gắn vào game.",
      "weight": 5,
      "phase": 4,
      "region": "highland",
      "depends": [
        "mob-highland"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "hub-tundra",
      "group": "Trung tâm vùng",
      "name": "Làng gỗ Tuyết Phong — xây lại trung tâm",
      "detail": "Gỗ thông dày, đá xám, mái tuyết; đại sảnh thợ săn 2–3 tầng với ống khói lớn. Kho củi, xe trượt, da thú, lò sưởi, cá đông, đèn ấm và lối tuyết nén. Giữ nhà nhỏ cũ làm nhà phụ. Đề xuất 8–12 nhà chính, 2 điểm nhấn cao, 3 cụm sinh hoạt; điều chỉnh theo map, không rải prop kín đường.",
      "weight": 6,
      "phase": 3,
      "region": "tundra",
      "depends": [
        "style",
        "politics"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "env-tundra",
      "group": "Cảnh quan",
      "name": "Lãnh nguyên Băng Giá — toàn bộ map",
      "detail": "Tuyết đã rõ style nhưng trung tâm còn cùng bố cục chữ thập và nhà nhỏ. Rà từng map, vẽ cây/đá/đồ vùng riêng, thêm sinh hoạt và khoảng nghỉ; kiểm lại 14 map ở zoom chơi thật.",
      "weight": 5,
      "phase": 3,
      "region": "tundra",
      "depends": [
        "style"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "mob-tundra",
      "group": "Quái và boss",
      "name": "Lãnh nguyên Băng Giá — thêm quái",
      "detail": "Đề xuất ít nhất 3 loài mới: Linh miêu băng, thợ săn vong, cua hồ đóng băng. Vẽ đủ đứng/đi/đánh/trúng đòn/gục, ghép spawn và cân bằng; giữ giới hạn tổng quái và hiệu năng.",
      "weight": 4,
      "phase": 4,
      "region": "tundra",
      "depends": [
        "env-tundra"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "newboss-tundra",
      "group": "Quái và boss",
      "name": "Lãnh nguyên Băng Giá — boss mới",
      "detail": "Ý tưởng: Mẫu Lang Băng. Thiết kế đấu trường, đòn báo trước và phần thưởng riêng; tên/chỉ số cần duyệt, chưa được vẽ hoặc gắn vào game.",
      "weight": 5,
      "phase": 4,
      "region": "tundra",
      "depends": [
        "mob-tundra"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "hub-volcano",
      "group": "Trung tâm vùng",
      "name": "Pháo đài người lùn Đe Đỏ — xây lại trung tâm",
      "detail": "Bazan đen, đồng đỏ, thép; pháo đài Đe Đỏ nhiều tầng, lò rèn đại và đường vận quặng. Xe mỏ, băng chuyền, bể tôi, ống khói, tời nâng, khu chợ thợ rèn. Giữ nhà nhỏ cũ làm nhà phụ. Đề xuất 8–12 nhà chính, 2 điểm nhấn cao, 3 cụm sinh hoạt; điều chỉnh theo map, không rải prop kín đường.",
      "weight": 6,
      "phase": 3,
      "region": "volcano",
      "depends": [
        "style",
        "politics"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "env-volcano",
      "group": "Cảnh quan",
      "name": "Núi lửa Hoả Sơn — toàn bộ map",
      "detail": "Tối và nhiều đốm tương phản; gom ánh lửa theo cụm, làm rõ đường đi. Rà từng map, vẽ cây/đá/đồ vùng riêng, thêm sinh hoạt và khoảng nghỉ; kiểm lại 14 map ở zoom chơi thật.",
      "weight": 5,
      "phase": 3,
      "region": "volcano",
      "depends": [
        "style"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "mob-volcano",
      "group": "Quái và boss",
      "name": "Núi lửa Hoả Sơn — thêm quái",
      "detail": "Đề xuất ít nhất 3 loài mới: Bọ than, hộ vệ xỉ thép, thằn lằn lò nung. Vẽ đủ đứng/đi/đánh/trúng đòn/gục, ghép spawn và cân bằng; giữ giới hạn tổng quái và hiệu năng.",
      "weight": 4,
      "phase": 4,
      "region": "volcano",
      "depends": [
        "env-volcano"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "newboss-volcano",
      "group": "Quái và boss",
      "name": "Núi lửa Hoả Sơn — boss mới",
      "detail": "Ý tưởng: Cự Tượng Đe Đỏ. Thiết kế đấu trường, đòn báo trước và phần thưởng riêng; tên/chỉ số cần duyệt, chưa được vẽ hoặc gắn vào game.",
      "weight": 5,
      "phase": 4,
      "region": "volcano",
      "depends": [
        "mob-volcano"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "hub-isles",
      "group": "Trung tâm vùng",
      "name": "Cảng chài San Hô — xây lại trung tâm",
      "detail": "Gỗ tàu, đá san hô, vải trắng lam; cảng nhiều tầng, hải đăng và nhà hội hàng hải. Cầu tàu, cần cẩu, kho muối, thuyền neo, chợ hải sản, quán cảng. Giữ nhà nhỏ cũ làm nhà phụ. Đề xuất 8–12 nhà chính, 2 điểm nhấn cao, 3 cụm sinh hoạt; điều chỉnh theo map, không rải prop kín đường.",
      "weight": 6,
      "phase": 3,
      "region": "isles",
      "depends": [
        "style",
        "politics"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "env-isles",
      "group": "Cảnh quan",
      "name": "Quần đảo San Hô — toàn bộ map",
      "detail": "Phong cách biển có sẵn; thiếu tuyến cảng làm điểm nhấn đô thị đông đúc. Rà từng map, vẽ cây/đá/đồ vùng riêng, thêm sinh hoạt và khoảng nghỉ; kiểm lại 14 map ở zoom chơi thật.",
      "weight": 5,
      "phase": 3,
      "region": "isles",
      "depends": [
        "style"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "mob-isles",
      "group": "Quái và boss",
      "name": "Quần đảo San Hô — thêm quái",
      "detail": "Đề xuất ít nhất 3 loài mới: Cá kiếm chân cạn, thủy thủ nguyền, sứa giáp. Vẽ đủ đứng/đi/đánh/trúng đòn/gục, ghép spawn và cân bằng; giữ giới hạn tổng quái và hiệu năng.",
      "weight": 4,
      "phase": 4,
      "region": "isles",
      "depends": [
        "env-isles"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "newboss-isles",
      "group": "Quái và boss",
      "name": "Quần đảo San Hô — boss mới",
      "detail": "Ý tưởng: Hải Xà San Hô. Thiết kế đấu trường, đòn báo trước và phần thưởng riêng; tên/chỉ số cần duyệt, chưa được vẽ hoặc gắn vào game.",
      "weight": 5,
      "phase": 4,
      "region": "isles",
      "depends": [
        "mob-isles"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "hub-fungal",
      "group": "Trung tâm vùng",
      "name": "Làng người nấm Ánh Tím — xây lại trung tâm",
      "detail": "Hang nhiều tầng, nấm khổng lồ tím lam; nhà mọc từ thân nấm, cầu tơ bào tử, đại sảnh vòm nấm. Vườn bào tử, đèn sinh học, xe quặng tinh thể, bàn chế thuốc, giỏ thu hoạch. Giữ nhà nhỏ cũ làm nhà phụ. Đề xuất 8–12 nhà chính, 2 điểm nhấn cao, 3 cụm sinh hoạt; điều chỉnh theo map, không rải prop kín đường.",
      "weight": 6,
      "phase": 2,
      "region": "fungal",
      "depends": [
        "style",
        "politics"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "env-fungal",
      "group": "Cảnh quan",
      "name": "Rừng Nấm Ngầm — toàn bộ map",
      "detail": "Đang dùng biome swamp, cây liễu/đước/nhà sàn và boss Hydra; phải thay bộ cảnh cốt lõi. Rà từng map, vẽ cây/đá/đồ vùng riêng, thêm sinh hoạt và khoảng nghỉ; kiểm lại 13 map ở zoom chơi thật.",
      "weight": 5,
      "phase": 2,
      "region": "fungal",
      "depends": [
        "style"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "mob-fungal",
      "group": "Quái và boss",
      "name": "Rừng Nấm Ngầm — thêm quái",
      "detail": "Đề xuất ít nhất 3 loài mới: Nấm khiên, sâu bào tử, dơi tinh thể. Vẽ đủ đứng/đi/đánh/trúng đòn/gục, ghép spawn và cân bằng; giữ giới hạn tổng quái và hiệu năng.",
      "weight": 4,
      "phase": 4,
      "region": "fungal",
      "depends": [
        "env-fungal"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "newboss-fungal",
      "group": "Quái và boss",
      "name": "Rừng Nấm Ngầm — boss mới",
      "detail": "Ý tưởng: Mẫu Thể Bào Tử. Thiết kế đấu trường, đòn báo trước và phần thưởng riêng; tên/chỉ số cần duyệt, chưa được vẽ hoặc gắn vào game.",
      "weight": 5,
      "phase": 4,
      "region": "fungal",
      "depends": [
        "mob-fungal"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "hub-ruins",
      "group": "Trung tâm vùng",
      "name": "Toà thành Aether cổ — xây lại trung tâm",
      "detail": "Đá cẩm thạch rạn, đồng cổ, rune lam; tòa thành Aether đổ nát nhưng hùng vĩ, khu phục dựng của học giả. Cột gãy, tượng triều đại, đồng hồ thiên văn, máy cổ, bàn khai quật và kho di vật. Giữ nhà nhỏ cũ làm nhà phụ. Đề xuất 8–12 nhà chính, 2 điểm nhấn cao, 3 cụm sinh hoạt; điều chỉnh theo map, không rải prop kín đường.",
      "weight": 6,
      "phase": 2,
      "region": "ruins",
      "depends": [
        "style",
        "politics"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "env-ruins",
      "group": "Cảnh quan",
      "name": "Phế tích Aether — toàn bộ map",
      "detail": "Đang dùng cây màu và cối xay highland; cảnh chưa đọc ra thành cổ. Rà từng map, vẽ cây/đá/đồ vùng riêng, thêm sinh hoạt và khoảng nghỉ; kiểm lại 13 map ở zoom chơi thật.",
      "weight": 5,
      "phase": 2,
      "region": "ruins",
      "depends": [
        "style"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "mob-ruins",
      "group": "Quái và boss",
      "name": "Phế tích Aether — thêm quái",
      "detail": "Đề xuất ít nhất 3 loài mới: Lính cơ giới, thư linh, tượng rune tuần tra. Vẽ đủ đứng/đi/đánh/trúng đòn/gục, ghép spawn và cân bằng; giữ giới hạn tổng quái và hiệu năng.",
      "weight": 4,
      "phase": 4,
      "region": "ruins",
      "depends": [
        "env-ruins"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "newboss-ruins",
      "group": "Quái và boss",
      "name": "Phế tích Aether — boss mới",
      "detail": "Ý tưởng: Nhiếp Chính Cơ Giới. Thiết kế đấu trường, đòn báo trước và phần thưởng riêng; tên/chỉ số cần duyệt, chưa được vẽ hoặc gắn vào game.",
      "weight": 5,
      "phase": 4,
      "region": "ruins",
      "depends": [
        "mob-ruins"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "hub-void",
      "group": "Trung tâm vùng",
      "name": "Thành trì Hư Không — xây lại trung tâm",
      "detail": "Đảo đá lơ lửng, kiến trúc gãy, cầu năng lượng có giới hạn; thành trì liên quân trong không gian rách. Neo không gian, kho tiếp tế, tháp canh, lều quân y, mảnh kiến trúc treo. Giữ nhà nhỏ cũ làm nhà phụ. Đề xuất 8–12 nhà chính, 2 điểm nhấn cao, 3 cụm sinh hoạt; điều chỉnh theo map, không rải prop kín đường.",
      "weight": 6,
      "phase": 3,
      "region": "void",
      "depends": [
        "style",
        "politics"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "env-void",
      "group": "Cảnh quan",
      "name": "Vực Hư Không — toàn bộ map",
      "detail": "Hiện gần biến thể núi lửa; thiếu khoảng không, đảo nổi và kết cấu siêu thực. Rà từng map, vẽ cây/đá/đồ vùng riêng, thêm sinh hoạt và khoảng nghỉ; kiểm lại 13 map ở zoom chơi thật.",
      "weight": 5,
      "phase": 3,
      "region": "void",
      "depends": [
        "style"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "mob-void",
      "group": "Quái và boss",
      "name": "Vực Hư Không — thêm quái",
      "detail": "Đề xuất ít nhất 3 loài mới: Ký sinh khe nứt, chiến binh rỗng, mắt hư vô. Vẽ đủ đứng/đi/đánh/trúng đòn/gục, ghép spawn và cân bằng; giữ giới hạn tổng quái và hiệu năng.",
      "weight": 4,
      "phase": 4,
      "region": "void",
      "depends": [
        "env-void"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "newboss-void",
      "group": "Quái và boss",
      "name": "Vực Hư Không — boss mới",
      "detail": "Ý tưởng: Kẻ Nuốt Chân Trời. Thiết kế đấu trường, đòn báo trước và phần thưởng riêng; tên/chỉ số cần duyệt, chưa được vẽ hoặc gắn vào game.",
      "weight": 5,
      "phase": 4,
      "region": "void",
      "depends": [
        "mob-void"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "hub-wood",
      "group": "Trung tâm vùng",
      "name": "Rừng Cổ Thụ — xây lại trung tâm",
      "detail": "Rễ cây đại thụ, gỗ sống, đá phủ rêu; nhà ôm thân cây và đại sảnh nhiều tầng bằng cành đan. Vườn dược, cầu rễ, giọt nhựa, hoa lớn, tổ chim, bàn chạm gỗ. Giữ nhà nhỏ cũ làm nhà phụ. Đề xuất 8–12 nhà chính, 2 điểm nhấn cao, 3 cụm sinh hoạt; điều chỉnh theo map, không rải prop kín đường.",
      "weight": 6,
      "phase": 2,
      "region": "wood",
      "depends": [
        "style",
        "politics"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "env-wood",
      "group": "Cảnh quan",
      "name": "Rừng Cổ Thụ — toàn bộ map",
      "detail": "Có cây riêng nhưng nhà và boss vẫn thuộc đầm lầy; cây phủ kín nhiều đường. Rà từng map, vẽ cây/đá/đồ vùng riêng, thêm sinh hoạt và khoảng nghỉ; kiểm lại 13 map ở zoom chơi thật.",
      "weight": 5,
      "phase": 2,
      "region": "wood",
      "depends": [
        "style"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "mob-wood",
      "group": "Quái và boss",
      "name": "Rừng Cổ Thụ — thêm quái",
      "detail": "Đề xuất ít nhất 3 loài mới: Hươu mầm, hộ vệ vỏ cây, nhện dây leo. Vẽ đủ đứng/đi/đánh/trúng đòn/gục, ghép spawn và cân bằng; giữ giới hạn tổng quái và hiệu năng.",
      "weight": 4,
      "phase": 4,
      "region": "wood",
      "depends": [
        "env-wood"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "newboss-wood",
      "group": "Quái và boss",
      "name": "Rừng Cổ Thụ — boss mới",
      "detail": "Ý tưởng: Thủ Hộ Rễ Ngàn Năm. Thiết kế đấu trường, đòn báo trước và phần thưởng riêng; tên/chỉ số cần duyệt, chưa được vẽ hoặc gắn vào game.",
      "weight": 5,
      "phase": 4,
      "region": "wood",
      "depends": [
        "mob-wood"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "hub-light",
      "group": "Trung tâm vùng",
      "name": "Thánh Địa Bình Minh — xây lại trung tâm",
      "detail": "Đá trắng ngà, vàng nhạt, kính màu; thành thánh có tháp cao, bậc thềm, thư viện và thánh đường. Đài nước, vườn huệ, chợ kinh sách, cờ lễ, sảnh cứu trợ và đèn pha lê. Giữ nhà nhỏ cũ làm nhà phụ. Đề xuất 8–12 nhà chính, 2 điểm nhấn cao, 3 cụm sinh hoạt; điều chỉnh theo map, không rải prop kín đường.",
      "weight": 6,
      "phase": 2,
      "region": "light",
      "depends": [
        "style",
        "politics"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "env-light",
      "group": "Cảnh quan",
      "name": "Thánh Địa Bình Minh — toàn bộ map",
      "detail": "Có cây vàng riêng nhưng nhà và boss gió còn mượn; nền sáng chưa có kiến trúc tương xứng. Rà từng map, vẽ cây/đá/đồ vùng riêng, thêm sinh hoạt và khoảng nghỉ; kiểm lại 13 map ở zoom chơi thật.",
      "weight": 5,
      "phase": 2,
      "region": "light",
      "depends": [
        "style"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "mob-light",
      "group": "Quái và boss",
      "name": "Thánh Địa Bình Minh — thêm quái",
      "detail": "Đề xuất ít nhất 3 loài mới: Hộ vệ kính, sư tử nhật quang, linh tượng lạc ánh. Vẽ đủ đứng/đi/đánh/trúng đòn/gục, ghép spawn và cân bằng; giữ giới hạn tổng quái và hiệu năng.",
      "weight": 4,
      "phase": 4,
      "region": "light",
      "depends": [
        "env-light"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "newboss-light",
      "group": "Quái và boss",
      "name": "Thánh Địa Bình Minh — boss mới",
      "detail": "Ý tưởng: Chấp Chính Nhật Luân. Thiết kế đấu trường, đòn báo trước và phần thưởng riêng; tên/chỉ số cần duyệt, chưa được vẽ hoặc gắn vào game.",
      "weight": 5,
      "phase": 4,
      "region": "light",
      "depends": [
        "mob-light"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "hub-dark",
      "group": "Trung tâm vùng",
      "name": "Vực Ám Ma — xây lại trung tâm",
      "detail": "Đá obsidian, sắt đen, tím than; thành trú ẩn nhiều tầng, tháp đêm và phố đèn tím. Kính thiên văn, vườn dược đêm, đèn lồng, chợ đêm, tượng hộ mệnh. Giữ nhà nhỏ cũ làm nhà phụ. Đề xuất 8–12 nhà chính, 2 điểm nhấn cao, 3 cụm sinh hoạt; điều chỉnh theo map, không rải prop kín đường.",
      "weight": 6,
      "phase": 2,
      "region": "dark",
      "depends": [
        "style",
        "politics"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "env-dark",
      "group": "Cảnh quan",
      "name": "Vực Ám Ma — toàn bộ map",
      "detail": "Có cây riêng nhưng còn nhà núi lửa, boss lửa; nhiều điểm tím vụn gây nhiễu. Rà từng map, vẽ cây/đá/đồ vùng riêng, thêm sinh hoạt và khoảng nghỉ; kiểm lại 13 map ở zoom chơi thật.",
      "weight": 5,
      "phase": 2,
      "region": "dark",
      "depends": [
        "style"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "mob-dark",
      "group": "Quái và boss",
      "name": "Vực Ám Ma — thêm quái",
      "detail": "Đề xuất ít nhất 3 loài mới: Miêu bóng, chiến binh dạ giáp, bướm đêm linh. Vẽ đủ đứng/đi/đánh/trúng đòn/gục, ghép spawn và cân bằng; giữ giới hạn tổng quái và hiệu năng.",
      "weight": 4,
      "phase": 4,
      "region": "dark",
      "depends": [
        "env-dark"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "newboss-dark",
      "group": "Quái và boss",
      "name": "Vực Ám Ma — boss mới",
      "detail": "Ý tưởng: Nữ Vương Dạ Kính. Thiết kế đấu trường, đòn báo trước và phần thưởng riêng; tên/chỉ số cần duyệt, chưa được vẽ hoặc gắn vào game.",
      "weight": 5,
      "phase": 4,
      "region": "dark",
      "depends": [
        "mob-dark"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "boss-boss_demon_001",
      "group": "Boss cũ",
      "name": "Quỷ vương rừng sâu — frame / kích thước",
      "detail": "Khung hiện tại 96×104; 13 chuỗi dưới ngưỡng kiểm tra. Xem từng hướng, sửa hướng đứng hình, vẽ boss lớn ở native size và chỉnh hitbox/telegraph/camera.",
      "weight": 3,
      "phase": 4,
      "region": null,
      "depends": [
        "style"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "boss-boss_lich_001",
      "group": "Boss cũ",
      "name": "Vua Lich (boss khu) — frame / kích thước",
      "detail": "Khung hiện tại 160×160; 8 chuỗi dưới ngưỡng kiểm tra. Xem từng hướng, sửa hướng đứng hình, vẽ boss lớn ở native size và chỉnh hitbox/telegraph/camera.",
      "weight": 3,
      "phase": 4,
      "region": null,
      "depends": [
        "style"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "boss-boss_stone_gargoyle_001",
      "group": "Boss cũ",
      "name": "Gargoyle Đá (boss khu) — frame / kích thước",
      "detail": "Khung hiện tại 184×184; 8 chuỗi dưới ngưỡng kiểm tra. Xem từng hướng, sửa hướng đứng hình, vẽ boss lớn ở native size và chỉnh hitbox/telegraph/camera.",
      "weight": 3,
      "phase": 4,
      "region": null,
      "depends": [
        "style"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "boss-boss_ancient_lava_golem_001",
      "group": "Boss cũ",
      "name": "Golem dung nham cổ (boss khu) — frame / kích thước",
      "detail": "Khung hiện tại 184×184; 10 chuỗi dưới ngưỡng kiểm tra. Xem từng hướng, sửa hướng đứng hình, vẽ boss lớn ở native size và chỉnh hitbox/telegraph/camera.",
      "weight": 3,
      "phase": 4,
      "region": null,
      "depends": [
        "style"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "boss-boss_crab_king_001",
      "group": "Boss cũ",
      "name": "Cua chúa (boss khu) — frame / kích thước",
      "detail": "Khung hiện tại 184×184; 8 chuỗi dưới ngưỡng kiểm tra. Xem từng hướng, sửa hướng đứng hình, vẽ boss lớn ở native size và chỉnh hitbox/telegraph/camera.",
      "weight": 3,
      "phase": 4,
      "region": null,
      "depends": [
        "style"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "boss-boss_fire_god_001",
      "group": "Boss cũ",
      "name": "Hoả thần (boss chúa) — frame / kích thước",
      "detail": "Khung hiện tại 224×224; 9 chuỗi dưới ngưỡng kiểm tra. Xem từng hướng, sửa hướng đứng hình, vẽ boss lớn ở native size và chỉnh hitbox/telegraph/camera.",
      "weight": 3,
      "phase": 4,
      "region": null,
      "depends": [
        "style"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "boss-boss_ghost_captain_001",
      "group": "Boss cũ",
      "name": "Thuyền trưởng ma Corvin (boss khu) — frame / kích thước",
      "detail": "Khung hiện tại 160×160; 8 chuỗi dưới ngưỡng kiểm tra. Xem từng hướng, sửa hướng đứng hình, vẽ boss lớn ở native size và chỉnh hitbox/telegraph/camera.",
      "weight": 3,
      "phase": 4,
      "region": null,
      "depends": [
        "style"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "boss-boss_ice_guardian_001",
      "group": "Boss cũ",
      "name": "Nghê Băng (boss chúa) — frame / kích thước",
      "detail": "Khung hiện tại 224×224; 8 chuỗi dưới ngưỡng kiểm tra. Xem từng hướng, sửa hướng đứng hình, vẽ boss lớn ở native size và chỉnh hitbox/telegraph/camera.",
      "weight": 3,
      "phase": 4,
      "region": null,
      "depends": [
        "style"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "boss-boss_ice_queen_001",
      "group": "Boss cũ",
      "name": "Nữ hoàng băng (boss khu) — frame / kích thước",
      "detail": "Khung hiện tại 160×160; 8 chuỗi dưới ngưỡng kiểm tra. Xem từng hướng, sửa hướng đứng hình, vẽ boss lớn ở native size và chỉnh hitbox/telegraph/camera.",
      "weight": 3,
      "phase": 4,
      "region": null,
      "depends": [
        "style"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "boss-boss_kraken_001",
      "group": "Boss cũ",
      "name": "Kraken (boss chúa) — frame / kích thước",
      "detail": "Khung hiện tại 224×224; 9 chuỗi dưới ngưỡng kiểm tra. Xem từng hướng, sửa hướng đứng hình, vẽ boss lớn ở native size và chỉnh hitbox/telegraph/camera.",
      "weight": 3,
      "phase": 4,
      "region": null,
      "depends": [
        "style"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "boss-boss_mother_frog_001",
      "group": "Boss cũ",
      "name": "Mẹ Ếch (boss khu) — frame / kích thước",
      "detail": "Khung hiện tại 184×184; 8 chuỗi dưới ngưỡng kiểm tra. Xem từng hướng, sửa hướng đứng hình, vẽ boss lớn ở native size và chỉnh hitbox/telegraph/camera.",
      "weight": 3,
      "phase": 4,
      "region": null,
      "depends": [
        "style"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "boss-boss_mud_hydra_001",
      "group": "Boss cũ",
      "name": "Hydra bùn (boss chúa) — frame / kích thước",
      "detail": "Khung hiện tại 224×224; 8 chuỗi dưới ngưỡng kiểm tra. Xem từng hướng, sửa hướng đứng hình, vẽ boss lớn ở native size và chỉnh hitbox/telegraph/camera.",
      "weight": 3,
      "phase": 4,
      "region": null,
      "depends": [
        "style"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "boss-boss_pharaoh_001",
      "group": "Boss cũ",
      "name": "Pharaoh xác ướp (boss khu) — frame / kích thước",
      "detail": "Khung hiện tại 160×160; 8 chuỗi dưới ngưỡng kiểm tra. Xem từng hướng, sửa hướng đứng hình, vẽ boss lớn ở native size và chỉnh hitbox/telegraph/camera.",
      "weight": 3,
      "phase": 4,
      "region": null,
      "depends": [
        "style"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "boss-boss_salamander_001",
      "group": "Boss cũ",
      "name": "Salamander (boss khu) — frame / kích thước",
      "detail": "Khung hiện tại 184×184; 8 chuỗi dưới ngưỡng kiểm tra. Xem từng hướng, sửa hướng đứng hình, vẽ boss lớn ở native size và chỉnh hitbox/telegraph/camera.",
      "weight": 3,
      "phase": 4,
      "region": null,
      "depends": [
        "style"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "boss-boss_sandworm_001",
      "group": "Boss cũ",
      "name": "Sâu cát khổng lồ (boss chúa) — frame / kích thước",
      "detail": "Khung hiện tại 224×224; 8 chuỗi dưới ngưỡng kiểm tra. Xem từng hướng, sửa hướng đứng hình, vẽ boss lớn ở native size và chỉnh hitbox/telegraph/camera.",
      "weight": 3,
      "phase": 4,
      "region": null,
      "depends": [
        "style"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "boss-boss_scorpion_queen_001",
      "group": "Boss cũ",
      "name": "Bọ cạp chúa (boss khu) — frame / kích thước",
      "detail": "Khung hiện tại 184×184; 8 chuỗi dưới ngưỡng kiểm tra. Xem từng hướng, sửa hướng đứng hình, vẽ boss lớn ở native size và chỉnh hitbox/telegraph/camera.",
      "weight": 3,
      "phase": 4,
      "region": null,
      "depends": [
        "style"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "boss-boss_storm_eagle_001",
      "group": "Boss cũ",
      "name": "Đại bàng bão (boss khu) — frame / kích thước",
      "detail": "Khung hiện tại 184×184; 8 chuỗi dưới ngưỡng kiểm tra. Xem từng hướng, sửa hướng đứng hình, vẽ boss lớn ở native size và chỉnh hitbox/telegraph/camera.",
      "weight": 3,
      "phase": 4,
      "region": null,
      "depends": [
        "style"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "boss-boss_swamp_witch_001",
      "group": "Boss cũ",
      "name": "Phù thuỷ đầm (boss khu) — frame / kích thước",
      "detail": "Khung hiện tại 160×160; 8 chuỗi dưới ngưỡng kiểm tra. Xem từng hướng, sửa hướng đứng hình, vẽ boss lớn ở native size và chỉnh hitbox/telegraph/camera.",
      "weight": 3,
      "phase": 4,
      "region": null,
      "depends": [
        "style"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "boss-boss_wind_drake_001",
      "group": "Boss cũ",
      "name": "Rồng gió (con của Tuyệt Vân) (boss khu) — frame / kích thước",
      "detail": "Khung hiện tại 224×224; 8 chuỗi dưới ngưỡng kiểm tra. Xem từng hướng, sửa hướng đứng hình, vẽ boss lớn ở native size và chỉnh hitbox/telegraph/camera.",
      "weight": 3,
      "phase": 4,
      "region": null,
      "depends": [
        "style"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "boss-boss_wind_mage_001",
      "group": "Boss cũ",
      "name": "Pháp sư gió (boss khu) — frame / kích thước",
      "detail": "Khung hiện tại 160×160; 8 chuỗi dưới ngưỡng kiểm tra. Xem từng hướng, sửa hướng đứng hình, vẽ boss lớn ở native size và chỉnh hitbox/telegraph/camera.",
      "weight": 3,
      "phase": 4,
      "region": null,
      "depends": [
        "style"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "boss-boss_yeti_001",
      "group": "Boss cũ",
      "name": "Yeti (boss khu) — frame / kích thước",
      "detail": "Khung hiện tại 184×184; 8 chuỗi dưới ngưỡng kiểm tra. Xem từng hướng, sửa hướng đứng hình, vẽ boss lớn ở native size và chỉnh hitbox/telegraph/camera.",
      "weight": 3,
      "phase": 4,
      "region": null,
      "depends": [
        "style"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "boss-dragon_fire_001",
      "group": "Boss cũ",
      "name": "Hoả Long \"Viêm Đế\" (rồng nguyên tố) — frame / kích thước",
      "detail": "Khung hiện tại 272×272; 8 chuỗi dưới ngưỡng kiểm tra. Xem từng hướng, sửa hướng đứng hình, vẽ boss lớn ở native size và chỉnh hitbox/telegraph/camera.",
      "weight": 3,
      "phase": 4,
      "region": null,
      "depends": [
        "style"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "boss-dragon_ice_001",
      "group": "Boss cũ",
      "name": "Băng Long \"Hàn Sương\" (rồng nguyên tố) — frame / kích thước",
      "detail": "Khung hiện tại 272×272; 8 chuỗi dưới ngưỡng kiểm tra. Xem từng hướng, sửa hướng đứng hình, vẽ boss lớn ở native size và chỉnh hitbox/telegraph/camera.",
      "weight": 3,
      "phase": 4,
      "region": null,
      "depends": [
        "style"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "boss-dragon_water_001",
      "group": "Boss cũ",
      "name": "Thuỷ Long \"Thương Hải\" (rồng nguyên tố) — frame / kích thước",
      "detail": "Khung hiện tại 272×272; 8 chuỗi dưới ngưỡng kiểm tra. Xem từng hướng, sửa hướng đứng hình, vẽ boss lớn ở native size và chỉnh hitbox/telegraph/camera.",
      "weight": 3,
      "phase": 4,
      "region": null,
      "depends": [
        "style"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "boss-dragon_wind_001",
      "group": "Boss cũ",
      "name": "Phong Long \"Tuyệt Vân\" (rồng nguyên tố) — frame / kích thước",
      "detail": "Khung hiện tại 272×272; 8 chuỗi dưới ngưỡng kiểm tra. Xem từng hướng, sửa hướng đứng hình, vẽ boss lớn ở native size và chỉnh hitbox/telegraph/camera.",
      "weight": 3,
      "phase": 4,
      "region": null,
      "depends": [
        "style"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "sky-map",
      "group": "Cảnh quan",
      "name": "Lâu đài trên không — map mới",
      "detail": "Sân trời, cổng, đại thư viện, điện khởi nguyên; một vị thần có đối thoại/chương tri thức. Chừa không gian cho cảnh lộ lịch sử.",
      "weight": 7,
      "phase": 5,
      "region": null,
      "depends": [
        "sky-lore",
        "style"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "continent-layout",
      "group": "Bản đồ tổng",
      "name": "Bố trí địa lý và tuyến vùng mới",
      "detail": "Hoàn thành bố trí thiết kế 13 vùng + Thiên Thành trên ba tầng, giữ 12 cặp kết nối vùng thật và chừa vị trí hồ câu/mê cung. Có sơ đồ tương tác trên admin. Đây là sơ đồ thiết kế, không thay tranh lục địa cũ hoặc mở các tuyến dự kiến.",
      "weight": 3,
      "phase": 1,
      "region": null,
      "depends": [
        "politics",
        "sky-lore"
      ],
      "steps": [
        {
          "label": "Đối chiếu cổng và tuyến vùng hiện có",
          "weight": 10,
          "done": true,
          "evidence": "26/10/2026: packages/sim/src/worldConnections.ts + .aether-stage/world-renewal/world-topology.json: 174 map và 424 lối."
        },
        {
          "label": "Bố trí địa lý, tầng trời và chỗ dành tính năng",
          "weight": 45,
          "done": true,
          "evidence": "26/10/2026: WORLD_LAYOUT: 13 vùng hiện có và 1 điểm Thiên Thành dự kiến; RESERVED_DESTINATIONS là chỗ dành, không phải map chơi mới."
        },
        {
          "label": "Sơ đồ tương tác trên admin",
          "weight": 25,
          "done": true,
          "evidence": "26/10/2026: site/world-design.js: chọn vùng bằng ghim/SVG hoặc danh sách; tuyến thật, ma pháp và tuyến chưa mở có chú giải khác nhau."
        },
        {
          "label": "Kiểm cấu trúc và giao diện",
          "weight": 20,
          "done": true,
          "evidence": "26/10/2026: Không có cổng sai/map không tới được; 24 lối qua vùng / 12 cặp; test và browser kiểm hồ sơ Sahrin/Thiên Thành, không có lỗi JS."
        }
      ],
      "requiresNewArt": false
    },
    {
      "id": "continent-art",
      "group": "Bản đồ tổng",
      "name": "Vẽ lại tranh lục địa",
      "detail": "Vẽ native pixel nét, lớp biển/đất/độ cao riêng, không chữ giả trong ảnh; UI đặt nhãn/ghim đa ngôn ngữ. Cập nhật cả Unity lẫn web.",
      "weight": 6,
      "phase": 5,
      "region": null,
      "depends": [
        "continent-layout"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "world-qa",
      "group": "Nghiệm thu",
      "name": "Đi qua toàn bộ map trong Unity",
      "detail": "Cổng, đường đi, va chạm, nhà che người, boss vừa camera, ánh sáng, độ nét, fps trên PC/APK; ảnh trước/sau và video. Không đánh dấu hoàn thành từ minimap.",
      "weight": 5,
      "phase": 6,
      "region": null,
      "depends": [
        "continent-art",
        "sky-map",
        "env-human",
        "env-swamp",
        "env-desert",
        "env-highland",
        "env-tundra",
        "env-volcano",
        "env-isles",
        "env-fungal",
        "env-ruins",
        "env-void",
        "env-wood",
        "env-light",
        "env-dark"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "skills",
      "group": "Tính năng đã chốt",
      "name": "140 kỹ năng và thiên phú cấp 10",
      "detail": "Kiếm 3 phái ×10 + khiên/thương/cung ×10 + pháp sư 8 hệ ×10 =140; mỗi bộ 7 chủ động/3 bị động, chiêu cuối dồn sát thương boss. Một nguyên tố/user, 8 hệ đồng đều 12,5%.",
      "weight": 10,
      "phase": 7,
      "region": null,
      "depends": [],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "home",
      "group": "Tính năng đã chốt",
      "name": "Khuôn viên, nhà và thăm bạn bè",
      "detail": "Mỗi user một khuôn viên; xây/sửa/trang trí; khách tham quan không tự lấy đồ hoặc thu hoạch.",
      "weight": 7,
      "phase": 7,
      "region": null,
      "depends": [],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "production",
      "group": "Tính năng đã chốt",
      "name": "Trồng trọt, chế tạo và nấu ăn",
      "detail": "Thu hoạch thực phẩm/nhiên liệu/nguyên liệu; máy chủ xác minh thời gian và công thức.",
      "weight": 6,
      "phase": 7,
      "region": null,
      "depends": [
        "home"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": false
    },
    {
      "id": "fishing",
      "group": "Tính năng đã chốt",
      "name": "Hồ câu cá cùng bạn bè",
      "detail": "Map chung, cùng vào câu; máy chủ xác minh lượt/cá, cơ chế tổ đội và vật phẩm sẽ thiết kế thêm.",
      "weight": 5,
      "phase": 7,
      "region": null,
      "depends": [],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "market",
      "group": "Tính năng đã chốt",
      "name": "Chợ giao thương",
      "detail": "Lúa mì, cây giống, cá, lưu niệm, đồ nhà; giao dịch an toàn, giá/phí/đơn offline chưa chốt.",
      "weight": 7,
      "phase": 7,
      "region": null,
      "depends": [
        "production",
        "fishing"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": false
    },
    {
      "id": "mazes",
      "group": "Tính năng đã chốt",
      "name": "Mê cung châu báu",
      "detail": "Nhiều mê cung có vàng, châu báu và đồ trang trí nhà; thiết kế số lượng, theme, tổ đội và bảng rơi riêng.",
      "weight": 7,
      "phase": 7,
      "region": null,
      "depends": [
        "home"
      ],
      "steps": [
        {
          "label": "Thiết kế và thông số",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ / triển khai",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ghép vào game / web",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm thử và nghiệm thu",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true
    },
    {
      "id": "cast30",
      "group": "Nhân vật",
      "name": "Lịch sử nguồn 30 tạo hình — đối chiếu và tái sử dụng",
      "detail": "Phạm vi lịch sử26/10, giữ bằng chứng nguồn đã có; mục tiêu hiện hành thay bằng characters-modular-multiweapon. Không mở rộng thành30 mỗi tộc. 5 class ×6 (3 nam/3 nữ). Có đủ 30 tạo hình nguồn và ảnh tấn công; đi/chạy mới có 156/280 tấm, còn 124. Mới xuất thử 7/30; chưa kích hoạt cả roster, QA trong game, build hoặc phát hành. Chỉ reset DB trong đợt phát hành nhân vật đã được yêu cầu, sau build/QA/backup. Cập nhật 26/10: cần thống nhất tay cầm chính; phương án vũ khí thay thế khảo sát ở đầu việc weapon-hand-and-layer-proof, chưa thay bộ hình hiện tại. Chọn tóc khi tạo nhân vật được khảo sát ở đầu việc hair-creation-baked-variants; không đổi trang phục khi chỉ đổi tóc. ƯU TIÊN 1 (chốt mới 26/10): nhân vật, tóc và chuyển động trước nhà/map. Trước mắt dùng vũ khí cơ bản đúng class; vẫn thử tách/thay hai vũ khí cơ bản trên một nhân vật mẫu ngay trong đợt này; chỉ vũ khí theo cấp để sau. Tạo hình hiện có giữ làm nguồn đối chiếu, không tính vũ khí cầu kỳ là điều kiện để chốt thân/tóc/chuyển động. CHỐT THAY THẾ27/10 (mới nhất): BỎ toàn bộ nhánh cởi đồ/thân nền đồ lót và yêu cầu tấn công5 vũ khí trên thân không trang bị. Khi tạo nhân vật BẮT BUỘC chọn1 trong5 class kiếm/cung/trượng/thương/khiên; cấp1 bộ đồ cơ bản và1 vũ khí cơ bản đúng class. Hình nhân vật luôn có tối thiểu bộ cơ bản của class, không có trạng thái cởi trần/đồ lót. Khi thay/bỏ trang bị thì quay về hình bộ cơ bản, không về thân khỏa/đồ lót. Đồ chỉ vẽ động tác class tương ứng, đi8/chạy8/đánh15 frame đủ8 hướng. Kiếm/vũ khí vẫn asset riêng có điểm nắm/lớp ngón tay, thay được độc lập. Hai dáng nam/nữ, nữ nhỏ nhắn thanh hơn, cùng HEAD_STANDARD và neo cổ. Ưu tiên hoàn tất mẫu kiếm sĩ nam/nữ mới trong game; các nguồn đồ lót đã thử bị loại khỏi runtime và ngừng vẽ. Các đoạn kế hoạch thân nền đồ lót trước đó là LỊCH SỬ ĐÃ HỦY, không được thực thi. Không reset DB hiện có.",
      "weight": 10,
      "phase": 2,
      "region": null,
      "depends": [],
      "steps": [
        {
          "label": "30 ID, role và giới tính",
          "weight": 10,
          "done": true,
          "evidence": "packages/protocol/src/roster.ts; roster.test: 30 identities / 90 mismatch bị từ chối."
        },
        {
          "label": "Ảnh đứng yên nguồn cho 30 tạo hình",
          "weight": 10,
          "done": true,
          "evidence": "assets/player-integrated/source-art/wholecast-v18/roster.json; nguồn tạo hình có sẵn, chưa đồng nghĩa phát hành."
        },
        {
          "label": "Ảnh tấn công nguồn",
          "weight": 15,
          "done": true,
          "evidence": "wholecast-v18/motion-jobs.json và motion/; 140 job chiến đấu đã có nguồn theo bàn giao V18, còn QA ghép cuối."
        },
        {
          "label": "Đủ ảnh đi/chạy",
          "weight": 20,
          "done": false,
          "evidence": "wholecast-v18/movement-status.json: 156/280 tấm, còn 124; kiểm 26/10."
        },
        {
          "label": "Xuất đủ atlas tám hướng",
          "weight": 15,
          "done": false,
          "evidence": "wholecast-v18/core-export-status.json: 7/30, không kích hoạt bản thiếu."
        },
        {
          "label": "QA tỷ lệ, độ nét và chuyển động trong Unity",
          "weight": 15,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Build Windows / Android",
          "weight": 5,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Phát hành roster mới và chuyển dữ liệu có backup",
          "weight": 10,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true,
      "priority": 3
    },
    {
      "id": "characters-modular-multiweapon",
      "group": "Nhân vật",
      "name": "Nhân vật ghép —hai thân nam/nữ,30 đầu và5 bộ class",
      "detail": "Chốt30 đầu/8 hướng27/10: Nhân tộc, Elf, Ma tộc, Thú nhân, Long tộc; mỗi tộc3 nam+3 nữ khác tóc, tổng30 nguyên đầu và240 hình hướng. Long tộc hình người, sừng nhỏ/vảy thái dương là hướng vẽ thử; Thú nhân không đuôi. Đầu dùng chung mọi bộ class, cùng khối đầu/mốc mặt/cổ, không áo dính cổ. Đủ8 hướng đầu trung tính chưa đồng nghĩa đủ pose đầu theo toàn bộ đòn đánh/chuyển động. YÊU CẦU KÍN DA mới nhất27/10: bộ class có cổ cao che toàn bộ cổ avatar nhưng không che cằm, tay áo dài/găng kín ngón nối kín, quần/giày kín da; đầu ma tộc/Elf/Thú nhân dùng chung không lộ da người. Cổ áo thuộc thân đồ, đầu chỉ có cổ da; thân nền đồ lót khi tháo đồ mới khớp bảng da theo tộc. Đã vẽ nguồn thân kiếm sĩ thon kín da, ghép hai đầu cũ tại site/media/weapon-proof-v2/player-standard-v7/unisex/index.html; mới đứng S, chưa đủ đi/chém/tám hướng hoặc phát hành. CHỐT HIỆN HÀNH27/10: tạo nhân vật chọn TỘC → ĐẦU, mặc đồ lót tối giản (nam quần, nữ áo+quần), chạy/đi nói chuyện NPC để chọn nghề rồi nhận bộ đồ+vũ khí. Đợt đầu5 class có5 bộ đồ cơ bản+5 vũ khí cơ bản; không còn bộ vải tân thủ riêng. Tháo bộ đồ trở về thân đồ lót, giữ đầu/tộc. Mỗi tộc3 đầu nam+3 đầu nữ khác tóc,4 tộc=30 bộ đầu. Bỏ hạn mức3 bộ/tộc hoặc3 bộ/class và phép nhân72/360 trước đó. Ba nhóm tài nguyên: nguyên đầu (mặt+tóc+tai/sừng+cổ DA), thân mặc bộ đồ, vũ khí. Cổ áo/áo choàng thuộc thân, không dính avatar. Một dáng thân THON CHUNG NAM/NỮ: vai/eo/chi gọn, giữ chiều cao/khối đầu/neo cổ, không vẽ riêng một thân đô khi ghép đầu nữ. Khóa khối đầu/mắt/má/cằm/cổ; chung rig/hướng/pose/PPU/root/neo cổ/lớp che; không scale theo tóc/bộ/frame hoặc dùng một đầu đứng tĩnh cho mọi hoạt động. Đầu mọi tộc ghép chung mọi bộ class; da hở thân/tay khớp da đầu. Thú nhân chỉ phần đầu, KHÔNG ĐUÔI/animation đuôi. Bộ đồ chỉ vẽ đứng/đi/chạy/đánh của class hỗ trợ, không nhân qua5 class. Vũ khí+bộ đồ cùng class/animationFamilyId. Thân trang phục thay nguyên thân đồ lót, không chồng hai bộ. Thân nền đồ lót dùng chung khi chưa có/tháo đồ, cần pose tương thích hành động đang hỗ trợ. Bộ xanh V7 được chọn làm thiết kế cơ bản kiếm sĩ, vẽ lại thon; hai đầu nam hiện có tiếp tục dùng. Hoàn thiện kiếm trước: đồ nền tân thủ giản dị, nét tối thiểu ngang hai NPC PixelLab tóc trắng sảnh ở cùng cỡ. Chém15 pose thật, lấy lực chậm→bổ nhanh dứt khoát→hồi gọn, đủ8 hướng và giữ cùng tỷ lệ/nét ở đứng/đi/chạy/đánh. Duyệt một mẫu Elf/Ma tộc/Thú nhân trước nhân rộng. Giữ140 chiêu và8 nguyên tố ngẫu nhiên đều ở cấp10. V7 mới có đứng S hai nguyên đầu trên cùng thân; đã sửa cổ không dính áo, khớp mốc mắt/má/cằm/cổ trong1px native, ghép gốc trùng pixel. Chưa đủ chuyển động/tám hướng/15 chém, chưa nghiệm thu nét hoặc mở roster/UI mới. Trang site/media/weapon-proof-v2/player-standard-v7/index.html, nguồn packages/asset-pipeline/sources/player-standard-v7. Đổi nghề có phí phải đổi đồng bộ class, tẩy phân bổ điểm skill nghề cũ/hoàn điểm để học nghề mới, thay bộ skill/passive, cập nhật thanh chiêu và cặp đồ–vũ khí/animation. Máy chủ kiểm điểm thực/chiêu hợp lệ và giao dịch phí/nghề/skill/đồ đồng bộ, tránh mất phí hoặc còn skill nghề cũ. Loại tiền, mức phí, giới hạn đổi, xử lý đồ cũ và việc tẩy điểm chỉ số cơ thể chưa chốt; không tự đặt phí/loại tiền. Nguyên tố vẫn theo thiên phú cấp10, không tự reroll khi đổi nghề. Đặc tả docs/thiet-ke/nhan-vat-ghep-da-vu-khi.md. Không đổi DB hoặc tăng% khi ghi kế hoạch. Chốt mới27/10: giữ thiết kế30 đầu đã được chủ dự án đồng ý (5 tộc, mỗi tộc3 nam+3 nữ,8 hướng), nhưng ĐỘ NÉT CHƯA ĐẠT. Vẽ lại chi tiết tóc/mắt/mặt/viền tại nguồn, so hai NPC PixelLab tóc trắng cùng cỡ game; không sharpen hoặc phóng đầu. Tách thân/bộ NAM và NỮ riêng, cùng chiều cao/khối đầu/PPU/root/neo cổ, khác vai/eo/hông vừa phải. Hai thân thay thế quy tắc thân unisex trước đây. Sửa đầu bị thụt bằng neo cổ/cằm nguyên pixel, không co/phóng ảnh. Cần vẽ đủ bước chân và15 pose bổ kiếm thật cho từng thân, rồi ráp đầu–thân–kiếm với lớp che tay/cổ áo theo frame; chưa nghiệm thu chỉ từ4 key pose. Bộ class kín da, đầu không dính áo, Thú nhân không đuôi.5 class có5 thiết kế đồ cơ bản, mỗi thiết kế có hai dáng nam/nữ và vũ khí tương ứng. NGHIÊM CẤM VẼ/GHÉP ĐÈ ĐẦU NÀY LÊN ĐẦU KHÁC — chỉ thị trực tiếp27/10: thân/bộ đồ và mọi lớp tay/găng/cổ áo phải tách sạch toàn bộ đầu, mặt, tóc, tai, sừng, cổ da cũ TRƯỚC KHI ghép avatar mới. Tắt avatar phải thấy bộ đồ không có đầu, không còn tóc bạc ở hai bên/gáy/khe tay hoặc pixel mặt người. Không chữa bằng phóng avatar/che cổ. Nguồn có đầu chỉ để đối chiếu, không dùng nguyên frame làm lớp thân runtime. Phải rà từng frame/hướng không avatar rồi thử đầu ngắn/nhỏ/Ma tộc trên nền sáng tối. Còn phần đầu cũ thì LOẠI, không đưa game/phát hành/tăng nghiệm thu. Quy tắc đầy đủ: docs/thiet-ke/cam-ghep-de-hai-dau.md. Chốt thân nền/vũ khí27/10: nam mặc quần lót, nữ áo+quần lót; đứng/đi/chạy8 hướng, tấn công15 frame đủ5 nhóm kiếm/cung/trượng/thương/khiên. Tháo trang bị vẫn cầm vũ khí và đánh được, không chặn animation vì thiếu áo. Hai dáng đồ kiếm sĩ nam/nữ mới chỉ cần đứng/đi/chạy/chém kiếm8 hướng. Kiếm bắt buộc là lớp asset riêng, thử đổi ít nhất2 kiếm trên cùng thân/pose; thân/áo phải vẽ hoàn chỉnh sau kiếm, không còn kiếm cũ/lỗ hình kiếm. Giữ HEAD_STANDARD global, cấm chồng hai đầu/hai bộ đồ, đi/chạy là hai chu kỳ thực. Hướng đối diện có thể lật đồng bộ theo chốt trước; ghi nguồn/lật trung thực. Phạm vi là animation đánh cơ bản5 vũ khí, không phải đã vẽ140 skill. Tài liệu: docs/thiet-ke/than-nen-va-do-kiem-si-8-huong.md. Đang vẽ nguồn tại player-rig-v4 và chuẩn bị thử trong Unity; chưa đủ nguồn/QA, không tăng phần trăm nghiệm thu. CHỐT THAY THẾ27/10 (mới nhất): BỎ toàn bộ nhánh cởi đồ/thân nền đồ lót và yêu cầu tấn công5 vũ khí trên thân không trang bị. Khi tạo nhân vật BẮT BUỘC chọn1 trong5 class kiếm/cung/trượng/thương/khiên; cấp1 bộ đồ cơ bản và1 vũ khí cơ bản đúng class. Hình nhân vật luôn có tối thiểu bộ cơ bản của class, không có trạng thái cởi trần/đồ lót. Khi thay/bỏ trang bị thì quay về hình bộ cơ bản, không về thân khỏa/đồ lót. Đồ chỉ vẽ động tác class tương ứng, đi8/chạy8/đánh15 frame đủ8 hướng. Kiếm/vũ khí vẫn asset riêng có điểm nắm/lớp ngón tay, thay được độc lập. Hai dáng nam/nữ, nữ nhỏ nhắn thanh hơn, cùng HEAD_STANDARD và neo cổ. Ưu tiên hoàn tất mẫu kiếm sĩ nam/nữ mới trong game; các nguồn đồ lót đã thử bị loại khỏi runtime và ngừng vẽ. Các đoạn kế hoạch thân nền đồ lót trước đó là LỊCH SỬ ĐÃ HỦY, không được thực thi. Không reset DB hiện có. ƯU TIÊN KIẾM SĨ27/10:3 bộ và3 thanh kiếm theo mốc tân thủ/lv5/lv10. Bộ1+kiếm1 tặng lúc chọn class. Bộ2/kiếm2 mặc/cầm từlv5; bộ3/kiếm3 từlv10; nguồn nhận và giá hai cấp sau chưa chốt. Cả3 có dáng nam/nữ, nữ nhỏ nhắn thanh vai/tay/chân hơn, giữ chuẩn đầu/neo cổ. Đủ đứng,đi8,chạy8,chém15 frame ở8 hướng. Vũ khí tách riêng, thay độc lập với đồ. Thiết kế phải khác CẤU TRÚC/SILHOUETTE, cấm chỉ đổi màu: tân thủ áo vải/giáp nhẹ giản dị;lv5 áo da vạt quấn chéo,dây đeo chéo ngực,một giáp vai bất đối xứng,ủng gia cố;lv10 giáp ngực ghép mảnh,giáp tay/chân,áo choàng lưng ngắn/tabard.3 kiếm khác lưỡi/hộ thủ/đốc: kiếm sắt thẳng cơ bản,kiếm cong nhẹ/hộ thủ bảo vệ lv5,kiếm lưỡi lá/hộ thủ cánh gọn lv10; cùng chuẩn chuôi/điểm nắm. Nguồn đổi màu v1 lv5/lv10 đã loại, đang vẽ lại phom riêng. Chi tiết máy đọc: player-rig-v4/tiers.json. BỎ cởi đồ/đồ lót theo chốt mới nhất, không vẽ tiếp nhánh đã hủy. Đang phát triển, chưa nghiệm thu mỹ thuật/đủ động tác nên không tăng%.",
      "weight": 10,
      "phase": 2,
      "region": null,
      "depends": [
        "humanoid-races",
        "weapon-hand-and-layer-proof"
      ],
      "requiresNewArt": true,
      "priority": 1,
      "steps": [
        {
          "label": "Catalog30 đầu, thân nền đồ lót,5 cặp đồ–vũ khí và rig",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Duyệt mẫu tộc và nét theo hai NPC tóc trắng; đồ nền cơ bản",
          "weight": 15,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Đủ30 bộ đầu, thân nền và5 bộ class theo dáng thon chung",
          "weight": 15,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Hoàn thiện kiếm trước: đứng/đi/chạy và chém15 frame tám hướng, thay kiếm",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Đồ và thao tác riêng cung/trượng/thương/khiên",
          "weight": 20,
          "done": false,
          "evidence": ""
        },
        {
          "label": "QA độ nét/tỷ lệ/điểm nắm/chuyển trạng thái, PC và Android",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Phát từng đợt đạt và tương thích dữ liệu cũ",
          "weight": 5,
          "done": false,
          "evidence": ""
        }
      ]
    },
    {
      "id": "pixellab-layered-character-pilot",
      "group": "Nhân vật",
      "name": "Tách thân–đầu–vũ khí vẽ bằng PixelLab — mẫu thử Kiếm sĩ",
      "detail": "Ghi 28/10 theo đồng ý của chủ dự án: 5 tộc × 5 class làm bằng lớp rời thân–đầu–vũ khí, không vẽ liền từng tổ hợp. Vẽ liền 30 đầu × 5 class ≈ 52.800 frame; tách lớp ≈ 10 thân (5 class × nam/nữ, 8 hướng, ~44 frame: đứng/đi/chạy/chém 15/trúng đòn/gục) ≈ 3.500 frame + 30 đầu × 8 hướng (240) + 5 vũ khí × ~16 góc (~80). PixelLab chỉ vẽ nhân vật liền khối, không xuất lớp: tách bằng pipeline sau khi vẽ. Thân: một thân gốc nam + một thân gốc nữ, mặc đồ từng class lên đúng thân gốc (transfer_outfit) để giữ chiều cao/vai/neo cổ; đầu mẫu trọc trên thân phải cắt sạch theo đường cổ cố định (cấm vẽ/ghép đè hai đầu); chuyển động bằng skeleton (animate_with_skeleton_v3) để mọi frame chung khung xương, neo cổ không trôi. Đầu: vẽ mới bằng PixelLab cùng style hai NPC tóc trắng và thân (đầu việc heads30-eight-directions, bộ đầu cũ đã loại); 30 đầu × 8 hướng cùng cỡ khối mặt theo head-standard.json, ghép vào neo cổ từng frame thân; đầu chỉ dịch theo cổ, không nghiêng/cúi theo đòn. Vũ khí: thân vẽ tay nắm trống; vũ khí vẽ sẵn ~16 góc, mỗi frame chọn góc gần nhất đặt vào điểm nắm, thêm lớp ngón tay che chuôi; không xoay ảnh pixel bằng code. Rủi ro chính: PixelLab lệch vai/cổ áo/tay giữa các frame; cổ áo phải che cổ khớp từng frame, nếu không đầu hở hoặc thụt. Thử nhỏ trước: Kiếm sĩ, thân nam + nữ, 2 đầu (Nhân tộc + Ma tộc có sừng), đi + chém 15 frame; ráp vào Unity, xem cỡ thật trên nền map, so độ nét hai NPC tóc trắng; đạt mới mở 4 class và 28 đầu còn lại. Bản thử mannequin/rig v2–v4/weapon-proof cũ đã dọn 28/10 (commit 07f6ec87) để làm mới hoàn toàn.",
      "weight": 6,
      "phase": 2,
      "region": null,
      "depends": [],
      "steps": [
        {
          "label": "Chốt hợp đồng lớp: neo cổ, điểm nắm, thứ tự lớp, canvas/PPU/root theo head-standard",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Mẫu PixelLab: thân gốc nam/nữ Kiếm sĩ, đi + chém 15 frame, cắt sạch đầu mẫu",
          "weight": 20,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Mẫu 2 đầu (Nhân tộc, Ma tộc có sừng) × 8 hướng; kiếm ~16 góc + lớp ngón tay",
          "weight": 15,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Ráp trong Unity, kiểm 0,5×/1× trên nền map, so 2 NPC tóc trắng; chủ dự án duyệt",
          "weight": 15,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Mở rộng 5 class × nam/nữ, 30 đầu, 5 vũ khí cơ bản",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "QA đủ hướng/frame, build PC/Android và phát hành",
          "weight": 15,
          "done": false,
          "evidence": ""
        }
      ],
      "requiresNewArt": true,
      "priority": 1
    },
    {
      "id": "web",
      "group": "Web và công bố",
      "name": "Làm lại portal game và bảng tiến độ",
      "detail": "Giao diện fantasy trên PC/điện thoại; kế hoạch riêng admin, nội dung công khai chia hiện có/đang làm. Chỉ hoàn thành sau kiểm thử và lên link thật.",
      "weight": 3,
      "phase": 1,
      "region": null,
      "depends": [],
      "steps": [
        {
          "label": "Thiết kế",
          "weight": 10,
          "done": true,
          "evidence": "26/10: portal fantasy rừng đêm/vàng cổ; site/index.html, site-src/portal.css và theme dùng chung."
        },
        {
          "label": "Triển khai",
          "weight": 45,
          "done": true,
          "evidence": "26/10: admin#plan, API phân quyền, 93 công việc; đọc trực tiếp file kế hoạch."
        },
        {
          "label": "Kiểm thử",
          "weight": 20,
          "done": true,
          "evidence": "26/10: build:site + typecheck qua; developmentPlan.test, 11 board test, 14 admin test, roster test; UI 320/390/1024/1440 và thư viện ảnh/vùng nhánh không lỗi."
        },
        {
          "label": "Phát hành",
          "weight": 25,
          "done": true,
          "evidence": "26/10: https://admin.tail024813.ts.net/game/ trả 200; admin plan 200 bằng phiên sẵn có, 401 không phiên; tin #12; .aether-stage/world-renewal/live-check.json và web-release-backup.json. DB giữ 14 tài khoản/14 nhân vật."
        }
      ],
      "requiresNewArt": false
    },
    {
      "id": "admin-react",
      "name": "Chuyển toàn bộ admin sang React",
      "detail": "Đăng nhập, kế hoạch, xem 30 nhân vật, tài nguyên, góp ý, tin tức/lưu trữ, diễn đàn và nhật ký. Giữ trạng thái khi chuyển tab; kiểm API có quyền và thao tác trên SQLite thử.",
      "group": "Web và công bố",
      "weight": 2,
      "phase": 1,
      "region": null,
      "depends": [],
      "requiresNewArt": false,
      "steps": [
        {
          "label": "Nguồn và triển khai",
          "weight": 60,
          "done": true,
          "evidence": "React TSX trong apps/server/site-src/admin; bundle nội bộ có hash. Dữ liệu hướng mới docs/dinh-huong-aether.md và 240 ảnh native có hash đối chiếu."
        },
        {
          "label": "Kiểm thử và cập nhật link thật",
          "weight": 40,
          "done": true,
          "evidence": "26/10/2026: build + typecheck React/server qua; HTTP quyền 401/403/200, lưu trữ/khôi phục và board/admin test qua; thử UI giữ draft, cấp xu, góp ý, bình luận, nhật ký trên DB 3201. Link Tailscale thật trả bundle + đủ 240 PNG khớp hash; kiểm tablet/điện thoại, không tràn và không cắt vũ khí. Bằng chứng .aether-stage/admin-react/live-assets-check.json, admin-desktop.jpg; DB backup integrity ok, giữ 14 tài khoản/14 nhân vật."
        }
      ]
    },
    {
      "id": "content-reboot",
      "name": "Thay nội dung web theo hướng nhân vật và thế giới mới",
      "detail": "Bỏ tuyến nhân vật chính cũ, bản đồ tổng cũ và giới thiệu class/nguyên tố cũ khỏi web. Đưa 30 tạo hình native/8 hướng và 5 class lên; lưu bản truyện và tin cũ để tra cứu. Nhân vật cũ dành cho NPC sau này.",
      "group": "Web và công bố",
      "weight": 2,
      "phase": 1,
      "region": null,
      "depends": [],
      "requiresNewArt": false,
      "steps": [
        {
          "label": "Nguồn và triển khai",
          "weight": 60,
          "done": true,
          "evidence": "React TSX trong apps/server/site-src/admin; bundle nội bộ có hash. Dữ liệu hướng mới docs/dinh-huong-aether.md và 240 ảnh native có hash đối chiếu."
        },
        {
          "label": "Kiểm thử và cập nhật link thật",
          "weight": 40,
          "done": true,
          "evidence": "26/10/2026: build + typecheck React/server qua; HTTP quyền 401/403/200, lưu trữ/khôi phục và board/admin test qua; thử UI giữ draft, cấp xu, góp ý, bình luận, nhật ký trên DB 3201. Link Tailscale thật trả bundle + đủ 240 PNG khớp hash; kiểm tablet/điện thoại, không tràn và không cắt vũ khí. Bằng chứng .aether-stage/admin-react/live-assets-check.json, admin-desktop.jpg; DB backup integrity ok, giữ 14 tài khoản/14 nhân vật."
        }
      ]
    },
    {
      "id": "story-reboot-game",
      "group": "Cốt truyện",
      "name": "Biên soạn nhiệm vụ mới và phân vai NPC đời cũ",
      "detail": "Thay tuyến nhân vật chính cố định trong client bằng hành trình chọn class. Viết vai trò NPC cho nhân vật cũ, chuyển trạng thái nhiệm vụ/save có kiểm thử. Đợt web hiện tại chưa sửa quest sản xuất. CHỐT THAY THẾ27/10 (mới nhất): BỎ toàn bộ nhánh cởi đồ/thân nền đồ lót và yêu cầu tấn công5 vũ khí trên thân không trang bị. Khi tạo nhân vật BẮT BUỘC chọn1 trong5 class kiếm/cung/trượng/thương/khiên; cấp1 bộ đồ cơ bản và1 vũ khí cơ bản đúng class. Hình nhân vật luôn có tối thiểu bộ cơ bản của class, không có trạng thái cởi trần/đồ lót. Khi thay/bỏ trang bị thì quay về hình bộ cơ bản, không về thân khỏa/đồ lót. Đồ chỉ vẽ động tác class tương ứng, đi8/chạy8/đánh15 frame đủ8 hướng. Kiếm/vũ khí vẫn asset riêng có điểm nắm/lớp ngón tay, thay được độc lập. Hai dáng nam/nữ, nữ nhỏ nhắn thanh hơn, cùng HEAD_STANDARD và neo cổ. Ưu tiên hoàn tất mẫu kiếm sĩ nam/nữ mới trong game; các nguồn đồ lót đã thử bị loại khỏi runtime và ngừng vẽ. Các đoạn kế hoạch thân nền đồ lót trước đó là LỊCH SỬ ĐÃ HỦY, không được thực thi. Không reset DB hiện có.",
      "weight": 6,
      "phase": 2,
      "region": null,
      "depends": [
        "content-reboot"
      ],
      "requiresNewArt": false,
      "steps": [
        {
          "label": "Biên soạn tuyến mới và vai trò NPC",
          "weight": 30,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Dữ liệu nhiệm vụ và quy tắc chuyển save",
          "weight": 30,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Tích hợp Unity/máy chủ",
          "weight": 20,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm người mới và tài khoản cũ",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ]
    },
    {
      "id": "web-spa",
      "group": "Web và công bố",
      "name": "Toàn bộ cổng web dùng chung khung React, chuyển mục không reload",
      "detail": "Một root React cho public và admin, header/menu/footer cố định qua các mục. Cache dữ liệu theo phiên, prefetch, giữ bản nháp; gzip, ETag và cache bundle có hash. Không dựng lại web client chơi game.",
      "weight": 2,
      "phase": 1,
      "region": null,
      "depends": [
        "admin-react"
      ],
      "requiresNewArt": false,
      "steps": [
        {
          "label": "Khung React và điều hướng một trang",
          "weight": 40,
          "done": true,
          "evidence": "site-src/public: Router, SessionProvider, Shell và các trang. Browser test 5 mục + admin/cổng game giữ nguyên data-app-instance."
        },
        {
          "label": "Cache, prefetch và dữ liệu nhẹ",
          "weight": 30,
          "done": true,
          "evidence": "queryCache.ts: gộp request, dùng dữ liệu đã tải, làm mới nền, xóa cache khi đổi phiên. Dashboard trước 464638 byte, nay gzip 25804 byte trong lần đo thử; bỏ Markdown khỏi payload mở trang. Có gzip, immutable và ETag/304 cho asset."
        },
        {
          "label": "Kiểm chức năng, điện thoại và link thật",
          "weight": 30,
          "done": true,
          "evidence": "26/10/2026: typecheck server + site, query-cache/site-performance/board/admin/developmentPlan/news-archive tests qua. UI DB 3201: giữ bản nháp, đăng bài/bình luận/góp ý, đăng nhập/đăng xuất, back, admin/cổng game cùng root. Link Tailscale thật: 5 mục giữ cùng data-app-instance, không hiện chờ ở dữ liệu đã có; 319/390/1024px không tràn. Bằng chứng .aether-stage/admin-react/spa-live-navigation.json, spa-live.jpg, live-assets-check.json; vẫn 14 tài khoản/14 nhân vật."
        }
      ]
    },
    {
      "id": "weapon-hand-and-layer-proof",
      "group": "Nhân vật",
      "name": "Thống nhất tay cầm và thử vũ khí thay thế liền mạch",
      "detail": "Chốt30 đầu/8 hướng27/10: Nhân tộc, Elf, Ma tộc, Thú nhân, Long tộc; mỗi tộc3 nam+3 nữ khác tóc, tổng30 nguyên đầu và240 hình hướng. Long tộc hình người, sừng nhỏ/vảy thái dương là hướng vẽ thử; Thú nhân không đuôi. Đầu dùng chung mọi bộ class, cùng khối đầu/mốc mặt/cổ, không áo dính cổ. Đủ8 hướng đầu trung tính chưa đồng nghĩa đủ pose đầu theo toàn bộ đòn đánh/chuyển động. YÊU CẦU KÍN DA mới nhất27/10: bộ class có cổ cao che toàn bộ cổ avatar nhưng không che cằm, tay áo dài/găng kín ngón nối kín, quần/giày kín da; đầu ma tộc/Elf/Thú nhân dùng chung không lộ da người. Cổ áo thuộc thân đồ, đầu chỉ có cổ da; thân nền đồ lót khi tháo đồ mới khớp bảng da theo tộc. Đã vẽ nguồn thân kiếm sĩ thon kín da, ghép hai đầu cũ tại site/media/weapon-proof-v2/player-standard-v7/unisex/index.html; mới đứng S, chưa đủ đi/chém/tám hướng hoặc phát hành. Ba nhóm tài nguyên: nguyên đầu (mặt+tóc+tai/sừng+cổ DA), thân mặc bộ đồ, vũ khí. Cổ áo/áo choàng thuộc thân, không dính avatar. Một dáng thân THON CHUNG NAM/NỮ: vai/eo/chi gọn, giữ chiều cao/khối đầu/neo cổ, không vẽ riêng một thân đô khi ghép đầu nữ. Khóa khối đầu/mắt/má/cằm/cổ; chung rig/hướng/pose/PPU/root/neo cổ/lớp che; không scale theo tóc/bộ/frame hoặc dùng một đầu đứng tĩnh cho mọi hoạt động. Đầu mọi tộc ghép chung mọi bộ class; da hở thân/tay khớp da đầu. Thú nhân chỉ phần đầu, KHÔNG ĐUÔI/animation đuôi. Bộ đồ chỉ vẽ đứng/đi/chạy/đánh của class hỗ trợ, không nhân qua5 class. Vũ khí+bộ đồ cùng class/animationFamilyId. Thân trang phục thay nguyên thân đồ lót, không chồng hai bộ. Thân nền đồ lót dùng chung khi chưa có/tháo đồ, cần pose tương thích hành động đang hỗ trợ. Bộ xanh V7 được chọn làm thiết kế cơ bản kiếm sĩ, vẽ lại thon; hai đầu nam hiện có tiếp tục dùng. Hoàn thiện kiếm trước: đồ nền tân thủ giản dị, nét tối thiểu ngang hai NPC PixelLab tóc trắng sảnh ở cùng cỡ. Chém15 pose thật, lấy lực chậm→bổ nhanh dứt khoát→hồi gọn, đủ8 hướng và giữ cùng tỷ lệ/nét ở đứng/đi/chạy/đánh. Duyệt một mẫu Elf/Ma tộc/Thú nhân trước nhân rộng. Giữ140 chiêu và8 nguyên tố ngẫu nhiên đều ở cấp10. V7 mới có đứng S hai nguyên đầu trên cùng thân; đã sửa cổ không dính áo, khớp mốc mắt/má/cằm/cổ trong1px native, ghép gốc trùng pixel. Chưa đủ chuyển động/tám hướng/15 chém, chưa nghiệm thu nét hoặc mở roster/UI mới. Trang site/media/weapon-proof-v2/player-standard-v7/index.html, nguồn packages/asset-pipeline/sources/player-standard-v7. LỊCH SỬ/BẰNG CHỨNG CÁC LƯỢT TRƯỚC: Ưu tiên 1: chỉ tách vũ khí; tóc/đầu/thân/trang phục liền theo frame. Cách ghép V2 đã được chủ dự án chốt, giữ lịch sử hash 16 frame đứng/đi và chuẩn chuôi sau ngón tay, lưỡi ra trước. Kiếm Tử Yên dùng asset lưỡi cong/hộ thủ bạc tím riêng, đã sửa hướng cong lên. Góp ý tiếp: chuỗi chém gốc đã sai tỷ lệ/độ nét trước khi tách kiếm; các bản vá bổ R3 và bộ R4 chưa đạt mỹ thuật. R4 có 24 frame cùng một nguồn (4 đứng, 8 đi S, 12 chém S), một tỷ lệ xuất, cùng palette, tách kiếm/ghép lại trùng 24/24; chủ dự án nhận xét quá đơn giản, thiếu chi tiết. Hướng mới: vẽ HD pixel chi tiết theo nhân vật trên trang chủ, tăng số pixel thực, giữ cùng tỷ lệ đầu/thân/chân và mật độ chi tiết ở đứng/đi/chém; một nguồn/bộ chuẩn cho mọi hành động, tuyệt đối không phóng thân theo từng frame. Thiết kế từ đầu để tách kiếm, có điểm nắm/góc/lớp ngón tay từng frame; kiếm mới thay vào không vẽ lại tóc/thân. Chưa nghiệm thu bộ mỹ thuật mới, chưa đủ các hướng chuyển động, chưa phát hành Unity. Trang rà: https://admin.tail024813.ts.net/game/site/media/weapon-proof-v2/index.html . Nguồn/prompt trong packages/asset-pipeline/sources/player-weapon-proof-v2/. Quy chuẩn bắt buộc trước khi vẽ tiếp: docs/thiet-ke/quy-chuan-net-ve-nhan-vat.md và style-standard-v1/standard.json; ảnh roster gốc kèm hash, ghi cụ thể nét tóc/mặt/viền/giáp/da/vải/giày, thước mật độ 2× cho cả bộ (288×288, root144/256, thân150, PPU96). Mẫu phóng 2× chỉ là thước, không phải vẽ HD. Lượt thử đầu tối đa 4 pose; chưa đạt style thì không nhân rộng. Khung giữ kiếm cao trước nhát bổ S phải dựng trục kiếm thẳng theo hai tay, không vẹo phải. Xem quy chuẩn kèm ảnh: https://admin.tail024813.ts.net/game/site/media/weapon-proof-v2/style-standard.html Đã gỡ R4 khỏi trang xem chính sau khi chủ dự án xác nhận sai chuẩn. Trang chính chỉ giữ tám ảnh đứng gốc để đối chiếu cách ghép; đi/chém mới bị tắt và ghi rõ chưa có bản đạt. Lệnh xuất preview phải qua publication.ts: chỉ đọc snapshot master đã khóa, kiểm hash 56 lớp/ảnh; chặn bản nháp hoặc ảnh bị đổi tự lên trang. Nguồn R4/HD nháp chỉ lưu lịch sử lý do loại, không được xem là bản chém hiện hành hoặc bộ đã duyệt. Không đổi game Unity/DB. Yêu cầu tiếp theo: vẽ bộ tấn công mới đủ tám hướng S/SW/W/NW/N/NE/E/SE, dự kiến 12 frame/hướng (96 frame). Dùng mẫu gốc trang chủ và thước HD chung, thử từng nhóm tối đa 4 pose; không lấy R4 làm master. Tóc/thân liền, kiếm chuẩn bị tách với điểm nắm/góc/lớp ngón tay; hai frame giữ kiếm trên đầu dựng thẳng. Nguồn mới attack-eight-v6; đang vẽ/rà, chưa nghiệm thu mỹ thuật và chưa xuất vào trang chính/Unity. Không tính ảnh nháp mới thành % hoàn thành. Cập nhật 27/10: V6 đã có 96 khung thời gian (12 × 8 hướng), thân liền tóc và tách kiếm cơ bản. Frame 4 giữ nguyên pose 3; frame 10/11 dùng lại pose đứng 0. Cùng canvas288/root144,256/PPU96, chỉ dịch nguyên pixel theo chân, không scale riêng frame. Đã sửa hướng N và đoạn theo đà NW8. Kiểm weapon-eight.test.ts: 96/96 ghép lại trùng RGBA nguồn, ngón tay che chuôi và pixel thân ngoài mask giữ nguyên; 16 khung giữ kiếm cao có trục thẳng. Typecheck và cổng chặn bản nháp lên trang chính đều qua. Trang rà riêng có tám hướng, từng frame, chạy một lần, đối chiếu mẫu trang chủ/đứng mới, vẽ liền/ghép kiếm/giấu kiếm: https://admin.tail024813.ts.net/game/site/media/weapon-proof-v2/attack-eight-v6/index.html . Nguồn và prompt: sources/player-weapon-proof-v2/attack-eight-v6/README.md; kiểm kỹ thuật không đồng nghĩa mỹ thuật đạt. Chưa nghiệm thu mỹ thuật, chưa có bộ đi/chạy mới tám hướng và chưa phát hành Unity; giữ nguyên % đã nghiệm thu. Bản thử Unity Windows 27/10 2026.10.27-0649 (build 430548): đã đưa V6 vào phòng Thử chiêu bằng nút Thử mẫu kiếm HD, mặc định tắt; thử đứng/bổ tám hướng tại chỗ và ẩn/hiện lớp kiếm. Chưa gây sát thương, chưa dùng bộ đi/chạy cũ cho V6. QA bản IL2CPP: 96 frame, bốn lớp, PPU96/point/no mip, đổi hướng, chặn đi/lướt cả nút cảm ứng, giấu/hiện kiếm, chạy đòn/hồi đứng và tắt về nhân vật cũ đều qua. Atlas trim tái dựng đúng 384 lớp nguồn. Giữ player_integrated đang dùng khi chưa có danh mục roster được nhập; tạo nam/nữ theo API cũ, không tự mở 30 mẫu còn thiếu chuyển động. Windows đã phát qua cơ chế tự cập nhật; Android giữ bản hiện tại. Bằng chứng: .aether-stage/attack-eight-v6/unity-qa-r4/autotest.log; hướng dẫn docs/thiet-ke/thu-mau-kiem-hd-trong-unity.md. Đây là bản thử trong phòng lab theo yêu cầu chủ dự án, chưa nghiệm thu mỹ thuật hoặc đưa V6 thành nhân vật chơi ngoài thế giới; giữ nguyên %. Thêm hai kiếm thay thế 27/10: Lam Ngọc (bạc xanh, lưỡi thanh) và Hắc Diệm (thép đen/đồng/khảm đỏ, lưỡi rộng), ảnh nguồn riêng bằng built-in image_gen, không chỉ đổi màu kiếm cũ. Tổng ba nút Thép/Lam Ngọc/Hắc Diệm trong phòng Thử chiêu HD. 192 bộ lớp vũ khí mới theo96 pose, dùng chung body/hands; atlas744 sprite/2048x1388 tái dựng đúng1152 lượt lớp nguồn. Đã sửa điểm nắm E7/8/9, SE8/9 bị dò vào viền áo và kiếm sau đầu SW2/W2, loại lưỡi cũ khỏi thân. QA IL2CPP288 lượt frame/ba kiếm/tám hướng, body/hands và offset giữ nguyên khi đổi, đổi giữa đòn không reset frame/hướng, giấu/hiện và tắt về model/vị trí cũ đều qua. Windows 2026.10.27-0712 (build 430571) đã phát tự cập nhật. Nguồn/prompt/chuẩn: packages/asset-pipeline/sources/player-weapon-proof-v2/attack-eight-v6/sword-variants/README.md. Bằng chứng .aether-stage/attack-eight-v6/variants-unity-qa/autotest.log và variants-check.json. Trang xem có lựa chọn ba kiếm: https://admin.tail024813.ts.net/game/site/media/weapon-proof-v2/attack-eight-v6/index.html . Vẫn chỉ thử động tác tại chỗ, chưa thêm chỉ số/nguyên tố/trang bị vào save, chưa đổi nhân vật chơi chính hoặc nghiệm thu mỹ thuật; % giữ nguyên. Chuẩn ghép nguyên đầu mới27/10: khóa tỷ lệ khối đầu/mắt/má/cằm/cổ theo master, không lấy bounds tóc để scale. Avatar chỉ gồm đầu và cổ DA, tuyệt đối không dính áo/cổ áo/áo choàng/trang sức; cổ áo thuộc thân đồ và che đúng lớp. Mẫu S V7 đã sửa đường cắt, hai đầu khớp mốc mắt/má/cằm/cổ trong sai số tối đa1px native; nguồn head-standard.json. Đây chỉ là kiểm hình học mẫu đứng, chưa đủ hoạt động/tám hướng hoặc duyệt nét. Mục tiêu một hợp đồng ghép dùng lại cho các bộ đồ, từng frame có neo cổ/hướng/pose/lớp che và tổ hợp tộc–dáng–da tương thích; không scale theo bộ hoặc gắn một đầu tĩnh cho mọi hành động.  Tạo nhân vật mới theo tộc→đầu→bộ; mỗi tộc3 đầu nam/3 đầu nữ,3 bộ. Cụm đầu chỉ có cổ da, cổ áo ở thân; khóa tỷ lệ đầu bằng mốc giải phẫu. Chốt mới27/10: giữ thiết kế30 đầu đã được chủ dự án đồng ý (5 tộc, mỗi tộc3 nam+3 nữ,8 hướng), nhưng ĐỘ NÉT CHƯA ĐẠT. Vẽ lại chi tiết tóc/mắt/mặt/viền tại nguồn, so hai NPC PixelLab tóc trắng cùng cỡ game; không sharpen hoặc phóng đầu. Tách thân/bộ NAM và NỮ riêng, cùng chiều cao/khối đầu/PPU/root/neo cổ, khác vai/eo/hông vừa phải. Hai thân thay thế quy tắc thân unisex trước đây. Sửa đầu bị thụt bằng neo cổ/cằm nguyên pixel, không co/phóng ảnh. Cần vẽ đủ bước chân và15 pose bổ kiếm thật cho từng thân, rồi ráp đầu–thân–kiếm với lớp che tay/cổ áo theo frame; chưa nghiệm thu chỉ từ4 key pose. Bộ class kín da, đầu không dính áo, Thú nhân không đuôi.5 class có5 thiết kế đồ cơ bản, mỗi thiết kế có hai dáng nam/nữ và vũ khí tương ứng. NGHIÊM CẤM VẼ/GHÉP ĐÈ ĐẦU NÀY LÊN ĐẦU KHÁC — chỉ thị trực tiếp27/10: thân/bộ đồ và mọi lớp tay/găng/cổ áo phải tách sạch toàn bộ đầu, mặt, tóc, tai, sừng, cổ da cũ TRƯỚC KHI ghép avatar mới. Tắt avatar phải thấy bộ đồ không có đầu, không còn tóc bạc ở hai bên/gáy/khe tay hoặc pixel mặt người. Không chữa bằng phóng avatar/che cổ. Nguồn có đầu chỉ để đối chiếu, không dùng nguyên frame làm lớp thân runtime. Phải rà từng frame/hướng không avatar rồi thử đầu ngắn/nhỏ/Ma tộc trên nền sáng tối. Còn phần đầu cũ thì LOẠI, không đưa game/phát hành/tăng nghiệm thu. Quy tắc đầy đủ: docs/thiet-ke/cam-ghep-de-hai-dau.md. Chốt thân nền/vũ khí27/10: nam mặc quần lót, nữ áo+quần lót; đứng/đi/chạy8 hướng, tấn công15 frame đủ5 nhóm kiếm/cung/trượng/thương/khiên. Tháo trang bị vẫn cầm vũ khí và đánh được, không chặn animation vì thiếu áo. Hai dáng đồ kiếm sĩ nam/nữ mới chỉ cần đứng/đi/chạy/chém kiếm8 hướng. Kiếm bắt buộc là lớp asset riêng, thử đổi ít nhất2 kiếm trên cùng thân/pose; thân/áo phải vẽ hoàn chỉnh sau kiếm, không còn kiếm cũ/lỗ hình kiếm. Giữ HEAD_STANDARD global, cấm chồng hai đầu/hai bộ đồ, đi/chạy là hai chu kỳ thực. Hướng đối diện có thể lật đồng bộ theo chốt trước; ghi nguồn/lật trung thực. Phạm vi là animation đánh cơ bản5 vũ khí, không phải đã vẽ140 skill. Tài liệu: docs/thiet-ke/than-nen-va-do-kiem-si-8-huong.md. Đang vẽ nguồn tại player-rig-v4 và chuẩn bị thử trong Unity; chưa đủ nguồn/QA, không tăng phần trăm nghiệm thu. CHỐT THAY THẾ27/10 (mới nhất): BỎ toàn bộ nhánh cởi đồ/thân nền đồ lót và yêu cầu tấn công5 vũ khí trên thân không trang bị. Khi tạo nhân vật BẮT BUỘC chọn1 trong5 class kiếm/cung/trượng/thương/khiên; cấp1 bộ đồ cơ bản và1 vũ khí cơ bản đúng class. Hình nhân vật luôn có tối thiểu bộ cơ bản của class, không có trạng thái cởi trần/đồ lót. Khi thay/bỏ trang bị thì quay về hình bộ cơ bản, không về thân khỏa/đồ lót. Đồ chỉ vẽ động tác class tương ứng, đi8/chạy8/đánh15 frame đủ8 hướng. Kiếm/vũ khí vẫn asset riêng có điểm nắm/lớp ngón tay, thay được độc lập. Hai dáng nam/nữ, nữ nhỏ nhắn thanh hơn, cùng HEAD_STANDARD và neo cổ. Ưu tiên hoàn tất mẫu kiếm sĩ nam/nữ mới trong game; các nguồn đồ lót đã thử bị loại khỏi runtime và ngừng vẽ. Các đoạn kế hoạch thân nền đồ lót trước đó là LỊCH SỬ ĐÃ HỦY, không được thực thi. Không reset DB hiện có. ƯU TIÊN KIẾM SĨ27/10:3 bộ và3 thanh kiếm theo mốc tân thủ/lv5/lv10. Bộ1+kiếm1 tặng lúc chọn class. Bộ2/kiếm2 mặc/cầm từlv5; bộ3/kiếm3 từlv10; nguồn nhận và giá hai cấp sau chưa chốt. Cả3 có dáng nam/nữ, nữ nhỏ nhắn thanh vai/tay/chân hơn, giữ chuẩn đầu/neo cổ. Đủ đứng,đi8,chạy8,chém15 frame ở8 hướng. Vũ khí tách riêng, thay độc lập với đồ. Thiết kế phải khác CẤU TRÚC/SILHOUETTE, cấm chỉ đổi màu: tân thủ áo vải/giáp nhẹ giản dị;lv5 áo da vạt quấn chéo,dây đeo chéo ngực,một giáp vai bất đối xứng,ủng gia cố;lv10 giáp ngực ghép mảnh,giáp tay/chân,áo choàng lưng ngắn/tabard.3 kiếm khác lưỡi/hộ thủ/đốc: kiếm sắt thẳng cơ bản,kiếm cong nhẹ/hộ thủ bảo vệ lv5,kiếm lưỡi lá/hộ thủ cánh gọn lv10; cùng chuẩn chuôi/điểm nắm. Nguồn đổi màu v1 lv5/lv10 đã loại, đang vẽ lại phom riêng. Chi tiết máy đọc: player-rig-v4/tiers.json. BỎ cởi đồ/đồ lót theo chốt mới nhất, không vẽ tiếp nhánh đã hủy. Đang phát triển, chưa nghiệm thu mỹ thuật/đủ động tác nên không tăng%.",
      "weight": 3,
      "phase": 2,
      "region": null,
      "depends": [],
      "requiresNewArt": true,
      "steps": [
        {
          "label": "Chốt tay cầm và quy tắc tám hướng",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Chuẩn canvas, điểm nắm và lớp che chuôi theo frame",
          "weight": 15,
          "done": true,
          "evidence": "26/10: cách cầm và lớp che V2 được chủ dự án chốt. 144×144/root(72,128) là chuẩn mẫu cũ; bản HD cần chuẩn canvas/PPU chung riêng cho cả bộ, không scale riêng hành động. Giữ tay nắm, chuôi và góc/lớp che theo frame."
        },
        {
          "label": "Sinh nguồn thử: thân liền tóc, hai vũ khí cơ bản độc lập",
          "weight": 10,
          "done": true,
          "evidence": "26/10: đã sinh nguồn bằng imagegen, V1 lưu lịch sử. V2 dùng frame vẽ liền gốc và nguồn tô bù giới hạn trong mask vũ khí; prompt/inpaint trong sources/player-weapon-proof-v2/. matched-check.json: 28/28 kiếm gốc tái ghép trùng RGBA, 27 frame đổi lưỡi sắt thật, một frame lưỡi bị che; 398 lượt pixel chuôi dưới lớp tay. Typecheck và weapon-matched.test.ts qua. Chưa nghiệm thu mỹ thuật/Unity."
        },
        {
          "label": "Cách ghép và mẫu đứng/đi V2 đã chốt",
          "weight": 10,
          "done": true,
          "evidence": "26/10: giữ nghiệm thu cách ghép của V2 và lịch sử 16 frame đứng/đi. approval.json ghi rõ phạm vi, không mở rộng nghiệm thu sang bản chém hoặc bộ R4 mới."
        },
        {
          "label": "Rà tỷ lệ và độ nét của bộ đứng/đi/chém chi tiết mới",
          "weight": 10,
          "done": false,
          "evidence": "Chủ dự án chưa chấp nhận R3/R4: thân phình, khác nét hoặc quá đơn giản. Đang vẽ lại chi tiết theo style roster trang chủ; kiểm pixel chỉ là cổng kỹ thuật, không tự đánh dấu mỹ thuật đạt."
        },
        {
          "label": "Đủ tám hướng đứng, đi/chạy và chiến đấu của mẫu",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "So với bản liền, thử thay trong Unity và nghiệm thu PC/Android",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ],
      "priority": 1
    },
    {
      "id": "hair-creation-baked-variants",
      "group": "Nhân vật",
      "name": "Tạo nhân vật chọn tộc/đầu, thân nền đồ lót dùng chung",
      "detail": "Chốt30 đầu/8 hướng27/10: Nhân tộc, Elf, Ma tộc, Thú nhân, Long tộc; mỗi tộc3 nam+3 nữ khác tóc, tổng30 nguyên đầu và240 hình hướng. Long tộc hình người, sừng nhỏ/vảy thái dương là hướng vẽ thử; Thú nhân không đuôi. Đầu dùng chung mọi bộ class, cùng khối đầu/mốc mặt/cổ, không áo dính cổ. Đủ8 hướng đầu trung tính chưa đồng nghĩa đủ pose đầu theo toàn bộ đòn đánh/chuyển động. YÊU CẦU KÍN DA mới nhất27/10: bộ class có cổ cao che toàn bộ cổ avatar nhưng không che cằm, tay áo dài/găng kín ngón nối kín, quần/giày kín da; đầu ma tộc/Elf/Thú nhân dùng chung không lộ da người. Cổ áo thuộc thân đồ, đầu chỉ có cổ da; thân nền đồ lót khi tháo đồ mới khớp bảng da theo tộc. Đã vẽ nguồn thân kiếm sĩ thon kín da, ghép hai đầu cũ tại site/media/weapon-proof-v2/player-standard-v7/unisex/index.html; mới đứng S, chưa đủ đi/chém/tám hướng hoặc phát hành. CHỐT HIỆN HÀNH27/10: tạo nhân vật chọn TỘC → ĐẦU, mặc đồ lót tối giản (nam quần, nữ áo+quần), chạy/đi nói chuyện NPC để chọn nghề rồi nhận bộ đồ+vũ khí. Đợt đầu5 class có5 bộ đồ cơ bản+5 vũ khí cơ bản; không còn bộ vải tân thủ riêng. Tháo bộ đồ trở về thân đồ lót, giữ đầu/tộc. Mỗi tộc3 đầu nam+3 đầu nữ khác tóc,4 tộc=30 bộ đầu. Bỏ hạn mức3 bộ/tộc hoặc3 bộ/class và phép nhân72/360 trước đó. Ba nhóm tài nguyên: nguyên đầu (mặt+tóc+tai/sừng+cổ DA), thân mặc bộ đồ, vũ khí. Cổ áo/áo choàng thuộc thân, không dính avatar. Một dáng thân THON CHUNG NAM/NỮ: vai/eo/chi gọn, giữ chiều cao/khối đầu/neo cổ, không vẽ riêng một thân đô khi ghép đầu nữ. Khóa khối đầu/mắt/má/cằm/cổ; chung rig/hướng/pose/PPU/root/neo cổ/lớp che; không scale theo tóc/bộ/frame hoặc dùng một đầu đứng tĩnh cho mọi hoạt động. Đầu mọi tộc ghép chung mọi bộ class; da hở thân/tay khớp da đầu. Thú nhân chỉ phần đầu, KHÔNG ĐUÔI/animation đuôi. Bộ đồ chỉ vẽ đứng/đi/chạy/đánh của class hỗ trợ, không nhân qua5 class. Vũ khí+bộ đồ cùng class/animationFamilyId. Thân trang phục thay nguyên thân đồ lót, không chồng hai bộ. Thân nền đồ lót dùng chung khi chưa có/tháo đồ, cần pose tương thích hành động đang hỗ trợ. Bộ xanh V7 được chọn làm thiết kế cơ bản kiếm sĩ, vẽ lại thon; hai đầu nam hiện có tiếp tục dùng. V7 mới có đứng S hai nguyên đầu trên cùng thân; đã sửa cổ không dính áo, khớp mốc mắt/má/cằm/cổ trong1px native, ghép gốc trùng pixel. Chưa đủ chuyển động/tám hướng/15 chém, chưa nghiệm thu nét hoặc mở roster/UI mới. Trang site/media/weapon-proof-v2/player-standard-v7/index.html, nguồn packages/asset-pipeline/sources/player-standard-v7. UI xem trước/lưu ID đầu–tộc, tương thích tài khoản/client cũ và PC/Android chưa triển khai. Chọn class/nhận bộ qua NPC trong game ở class-selection-career-change. CHỐT THAY THẾ27/10 (mới nhất): BỎ toàn bộ nhánh cởi đồ/thân nền đồ lót và yêu cầu tấn công5 vũ khí trên thân không trang bị. Khi tạo nhân vật BẮT BUỘC chọn1 trong5 class kiếm/cung/trượng/thương/khiên; cấp1 bộ đồ cơ bản và1 vũ khí cơ bản đúng class. Hình nhân vật luôn có tối thiểu bộ cơ bản của class, không có trạng thái cởi trần/đồ lót. Khi thay/bỏ trang bị thì quay về hình bộ cơ bản, không về thân khỏa/đồ lót. Đồ chỉ vẽ động tác class tương ứng, đi8/chạy8/đánh15 frame đủ8 hướng. Kiếm/vũ khí vẫn asset riêng có điểm nắm/lớp ngón tay, thay được độc lập. Hai dáng nam/nữ, nữ nhỏ nhắn thanh hơn, cùng HEAD_STANDARD và neo cổ. Ưu tiên hoàn tất mẫu kiếm sĩ nam/nữ mới trong game; các nguồn đồ lót đã thử bị loại khỏi runtime và ngừng vẽ. Các đoạn kế hoạch thân nền đồ lót trước đó là LỊCH SỬ ĐÃ HỦY, không được thực thi. Không reset DB hiện có.",
      "weight": 3,
      "phase": 2,
      "region": null,
      "depends": [],
      "requiresNewArt": true,
      "steps": [
        {
          "label": "Luồng tộc→đầu, thân nền đồ lót và catalog tương thích",
          "weight": 15,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Thử hai avatar nguyên đầu trên cùng thân, duyệt nét và đường cổ",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Đủ hướng/pose đầu và lớp cổ áo theo hành động, không dùng đầu tĩnh",
          "weight": 30,
          "done": false,
          "evidence": ""
        },
        {
          "label": "UI tộc/đầu, lưu ID và tương thích nhân vật/client cũ",
          "weight": 15,
          "done": false,
          "evidence": ""
        },
        {
          "label": "So bản liền, kiểm nam/nữ, các class và PC/Android",
          "weight": 15,
          "done": false,
          "evidence": ""
        }
      ],
      "priority": 1
    },
    {
      "id": "humanoid-races",
      "group": "Nhân vật",
      "name": "Năm tộc —mỗi tộc3 đầu nam và3 đầu nữ",
      "detail": "Chốt30 đầu/8 hướng27/10: Nhân tộc, Elf, Ma tộc, Thú nhân, Long tộc; mỗi tộc3 nam+3 nữ khác tóc, tổng30 nguyên đầu và240 hình hướng. Long tộc hình người, sừng nhỏ/vảy thái dương là hướng vẽ thử; Thú nhân không đuôi. Đầu dùng chung mọi bộ class, cùng khối đầu/mốc mặt/cổ, không áo dính cổ. Đủ8 hướng đầu trung tính chưa đồng nghĩa đủ pose đầu theo toàn bộ đòn đánh/chuyển động. YÊU CẦU KÍN DA mới nhất27/10: bộ class có cổ cao che toàn bộ cổ avatar nhưng không che cằm, tay áo dài/găng kín ngón nối kín, quần/giày kín da; đầu ma tộc/Elf/Thú nhân dùng chung không lộ da người. Cổ áo thuộc thân đồ, đầu chỉ có cổ da; thân nền đồ lót khi tháo đồ mới khớp bảng da theo tộc. Đã vẽ nguồn thân kiếm sĩ thon kín da, ghép hai đầu cũ tại site/media/weapon-proof-v2/player-standard-v7/unisex/index.html; mới đứng S, chưa đủ đi/chém/tám hướng hoặc phát hành. CHỐT HIỆN HÀNH27/10: tạo nhân vật chọn TỘC → ĐẦU, mặc đồ lót tối giản (nam quần, nữ áo+quần), chạy/đi nói chuyện NPC để chọn nghề rồi nhận bộ đồ+vũ khí. Đợt đầu5 class có5 bộ đồ cơ bản+5 vũ khí cơ bản; không còn bộ vải tân thủ riêng. Tháo bộ đồ trở về thân đồ lót, giữ đầu/tộc. Mỗi tộc3 đầu nam+3 đầu nữ khác tóc,4 tộc=30 bộ đầu. Bỏ hạn mức3 bộ/tộc hoặc3 bộ/class và phép nhân72/360 trước đó. Ba nhóm tài nguyên: nguyên đầu (mặt+tóc+tai/sừng+cổ DA), thân mặc bộ đồ, vũ khí. Cổ áo/áo choàng thuộc thân, không dính avatar. Một dáng thân THON CHUNG NAM/NỮ: vai/eo/chi gọn, giữ chiều cao/khối đầu/neo cổ, không vẽ riêng một thân đô khi ghép đầu nữ. Khóa khối đầu/mắt/má/cằm/cổ; chung rig/hướng/pose/PPU/root/neo cổ/lớp che; không scale theo tóc/bộ/frame hoặc dùng một đầu đứng tĩnh cho mọi hoạt động. Đầu mọi tộc ghép chung mọi bộ class; da hở thân/tay khớp da đầu. Thú nhân chỉ phần đầu, KHÔNG ĐUÔI/animation đuôi. Bộ đồ chỉ vẽ đứng/đi/chạy/đánh của class hỗ trợ, không nhân qua5 class. Vũ khí+bộ đồ cùng class/animationFamilyId. Thân trang phục thay nguyên thân đồ lót, không chồng hai bộ. Thân nền đồ lót dùng chung khi chưa có/tháo đồ, cần pose tương thích hành động đang hỗ trợ. Bộ xanh V7 được chọn làm thiết kế cơ bản kiếm sĩ, vẽ lại thon; hai đầu nam hiện có tiếp tục dùng. Giữ hình người: Elf tai nhọn; Thú nhân chỉ đặc điểm đầu/tai, không đuôi; Ma tộc tím khói đề xuất, màu/sừng cần duyệt. Hoàn thiện kiếm trước: đồ nền tân thủ giản dị, nét tối thiểu ngang hai NPC PixelLab tóc trắng sảnh ở cùng cỡ. Chém15 pose thật, lấy lực chậm→bổ nhanh dứt khoát→hồi gọn, đủ8 hướng và giữ cùng tỷ lệ/nét ở đứng/đi/chạy/đánh. Duyệt một mẫu Elf/Ma tộc/Thú nhân trước nhân rộng. Giữ140 chiêu và8 nguyên tố ngẫu nhiên đều ở cấp10. V7 mới có đứng S hai nguyên đầu trên cùng thân; đã sửa cổ không dính áo, khớp mốc mắt/má/cằm/cổ trong1px native, ghép gốc trùng pixel. Chưa đủ chuyển động/tám hướng/15 chém, chưa nghiệm thu nét hoặc mở roster/UI mới. Trang site/media/weapon-proof-v2/player-standard-v7/index.html, nguồn packages/asset-pipeline/sources/player-standard-v7.  CHỐT THAY THẾ27/10 (mới nhất): BỎ toàn bộ nhánh cởi đồ/thân nền đồ lót và yêu cầu tấn công5 vũ khí trên thân không trang bị. Khi tạo nhân vật BẮT BUỘC chọn1 trong5 class kiếm/cung/trượng/thương/khiên; cấp1 bộ đồ cơ bản và1 vũ khí cơ bản đúng class. Hình nhân vật luôn có tối thiểu bộ cơ bản của class, không có trạng thái cởi trần/đồ lót. Khi thay/bỏ trang bị thì quay về hình bộ cơ bản, không về thân khỏa/đồ lót. Đồ chỉ vẽ động tác class tương ứng, đi8/chạy8/đánh15 frame đủ8 hướng. Kiếm/vũ khí vẫn asset riêng có điểm nắm/lớp ngón tay, thay được độc lập. Hai dáng nam/nữ, nữ nhỏ nhắn thanh hơn, cùng HEAD_STANDARD và neo cổ. Ưu tiên hoàn tất mẫu kiếm sĩ nam/nữ mới trong game; các nguồn đồ lót đã thử bị loại khỏi runtime và ngừng vẽ. Các đoạn kế hoạch thân nền đồ lót trước đó là LỊCH SỬ ĐÃ HỦY, không được thực thi. Không reset DB hiện có.",
      "weight": 4,
      "phase": 2,
      "region": null,
      "depends": [],
      "requiresNewArt": true,
      "steps": [
        {
          "label": "Chốt đặc điểm, bảng màu và catalog tương thích",
          "weight": 15,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ và duyệt một mẫu Elf, Ma tộc, Thú nhân theo chuẩn Nhân tộc",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Đủ hướng/hoạt động, phối tóc/tai/sừng/đuôi và da",
          "weight": 30,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Lựa chọn tộc, lưu dữ liệu và tương thích client cũ",
          "weight": 15,
          "done": false,
          "evidence": ""
        },
        {
          "label": "QA nam/nữ/class, PC/Android và nghiệm thu mỹ thuật",
          "weight": 15,
          "done": false,
          "evidence": ""
        }
      ],
      "priority": 1
    },
    {
      "id": "web-art-direction",
      "group": "Web và công bố",
      "name": "Thiết kế lại toàn bộ web và admin với nhận diện riêng",
      "detail": "Yêu cầu 26/10: giao diện hiện tại nhìn quá khuôn mẫu, cần làm lại toàn bộ cả web công khai lẫn admin. Hướng đã đổi theo yêu cầu mới: tham khảo cổng game Knight Age (http://knightageonline.com/?c=anow&p=0), khung gọn giữa nền xám, đầu trang nâu/vàng, nền giấy, banner cảnh pixel và tin tức kiểu cổng MMORPG cổ điển. Dùng ảnh Aether, không lấy logo/ảnh của trang mẫu; có thể dùng thư viện UI. Giữ React SPA, đăng nhập, bản nháp, quyền admin và các API đang hoạt động. Thử responsive và kiểm link Tailscale trước khi chốt.",
      "weight": 3,
      "phase": 1,
      "region": null,
      "depends": [
        "web-spa"
      ],
      "requiresNewArt": false,
      "steps": [
        {
          "label": "Chốt hướng mỹ thuật và cấu trúc nội dung mới",
          "weight": 15,
          "done": true,
          "evidence": "26/10: đổi theo cổng Knight Age chủ dự án chọn: nền xám, viền nâu/vàng, giấy sáng, banner pixel Aether; không dùng logo/ảnh trang mẫu."
        },
        {
          "label": "Dựng shell, trang chủ, thư viện nhân vật và các trang công khai",
          "weight": 35,
          "done": true,
          "evidence": "Shell React dùng chung, trang chủ, 30 tạo hình, tin tức, diễn đàn, góp ý, tải Windows/Android đã đổi cùng theme. Radix menu/tabs và Lucide; không reload trang khi chuyển mục."
        },
        {
          "label": "Làm lại bố cục admin và toàn bộ màn vận hành",
          "weight": 30,
          "done": true,
          "evidence": "Admin 8 tab dùng khung nâu/vàng đồng bộ; kế hoạch mới lên đầu, tìm/lọc/xuất kế hoạch, form và bản nháp giữ hoạt động. Kiểm responsive, sửa tràn bảng tài nguyên ở điện thoại."
        },
        {
          "label": "Kiểm tương tác, responsive, build và link Tailscale",
          "weight": 20,
          "done": true,
          "evidence": "26/10: typecheck server/site và 19 bài kiểm đều qua. QA web công khai và 8 tab admin ở máy tính/điện thoại; giữ bản nháp, root React không đổi, không tràn ngang sau sửa bảng tài nguyên. Đã build thật, kiểm Tailscale và hash đủ 240 ảnh/30 tạo hình, API admin 401/200; 14 tài khoản/14 nhân vật giữ nguyên. Báo cáo .aether-stage/admin-react/live-assets-check.json và .aether-stage/world-renewal/live-check.json."
        }
      ]
    },
    {
      "id": "character-pixel-clarity",
      "group": "Nhân vật",
      "name": "Tăng độ nét nhân vật, giữ tỷ lệ và chuyển động liền mạch",
      "detail": "Chốt30 đầu/8 hướng27/10: Nhân tộc, Elf, Ma tộc, Thú nhân, Long tộc; mỗi tộc3 nam+3 nữ khác tóc, tổng30 nguyên đầu và240 hình hướng. Long tộc hình người, sừng nhỏ/vảy thái dương là hướng vẽ thử; Thú nhân không đuôi. Đầu dùng chung mọi bộ class, cùng khối đầu/mốc mặt/cổ, không áo dính cổ. Đủ8 hướng đầu trung tính chưa đồng nghĩa đủ pose đầu theo toàn bộ đòn đánh/chuyển động. YÊU CẦU KÍN DA mới nhất27/10: bộ class có cổ cao che toàn bộ cổ avatar nhưng không che cằm, tay áo dài/găng kín ngón nối kín, quần/giày kín da; đầu ma tộc/Elf/Thú nhân dùng chung không lộ da người. Cổ áo thuộc thân đồ, đầu chỉ có cổ da; thân nền đồ lót khi tháo đồ mới khớp bảng da theo tộc. Đã vẽ nguồn thân kiếm sĩ thon kín da, ghép hai đầu cũ tại site/media/weapon-proof-v2/player-standard-v7/unisex/index.html; mới đứng S, chưa đủ đi/chém/tám hướng hoặc phát hành. Ba nhóm tài nguyên: nguyên đầu (mặt+tóc+tai/sừng+cổ DA), thân mặc bộ đồ, vũ khí. Cổ áo/áo choàng thuộc thân, không dính avatar. Một dáng thân THON CHUNG NAM/NỮ: vai/eo/chi gọn, giữ chiều cao/khối đầu/neo cổ, không vẽ riêng một thân đô khi ghép đầu nữ. Khóa khối đầu/mắt/má/cằm/cổ; chung rig/hướng/pose/PPU/root/neo cổ/lớp che; không scale theo tóc/bộ/frame hoặc dùng một đầu đứng tĩnh cho mọi hoạt động. Đầu mọi tộc ghép chung mọi bộ class; da hở thân/tay khớp da đầu. Thú nhân chỉ phần đầu, KHÔNG ĐUÔI/animation đuôi. Bộ đồ chỉ vẽ đứng/đi/chạy/đánh của class hỗ trợ, không nhân qua5 class. Vũ khí+bộ đồ cùng class/animationFamilyId. Thân trang phục thay nguyên thân đồ lót, không chồng hai bộ. Thân nền đồ lót dùng chung khi chưa có/tháo đồ, cần pose tương thích hành động đang hỗ trợ. Bộ xanh V7 được chọn làm thiết kế cơ bản kiếm sĩ, vẽ lại thon; hai đầu nam hiện có tiếp tục dùng. Hoàn thiện kiếm trước: đồ nền tân thủ giản dị, nét tối thiểu ngang hai NPC PixelLab tóc trắng sảnh ở cùng cỡ. Chém15 pose thật, lấy lực chậm→bổ nhanh dứt khoát→hồi gọn, đủ8 hướng và giữ cùng tỷ lệ/nét ở đứng/đi/chạy/đánh. Duyệt một mẫu Elf/Ma tộc/Thú nhân trước nhân rộng. Giữ140 chiêu và8 nguyên tố ngẫu nhiên đều ở cấp10. V7 mới có đứng S hai nguyên đầu trên cùng thân; đã sửa cổ không dính áo, khớp mốc mắt/má/cằm/cổ trong1px native, ghép gốc trùng pixel. Chưa đủ chuyển động/tám hướng/15 chém, chưa nghiệm thu nét hoặc mở roster/UI mới. Trang site/media/weapon-proof-v2/player-standard-v7/index.html, nguồn packages/asset-pipeline/sources/player-standard-v7. Đây là mốc nét/chuyển động chưa nghiệm thu, không dùng phóng/sharpen/blur/glow thay việc vẽ sạch tại nguồn. Chốt mới27/10: giữ thiết kế30 đầu đã được chủ dự án đồng ý (5 tộc, mỗi tộc3 nam+3 nữ,8 hướng), nhưng ĐỘ NÉT CHƯA ĐẠT. Vẽ lại chi tiết tóc/mắt/mặt/viền tại nguồn, so hai NPC PixelLab tóc trắng cùng cỡ game; không sharpen hoặc phóng đầu. Tách thân/bộ NAM và NỮ riêng, cùng chiều cao/khối đầu/PPU/root/neo cổ, khác vai/eo/hông vừa phải. Hai thân thay thế quy tắc thân unisex trước đây. Sửa đầu bị thụt bằng neo cổ/cằm nguyên pixel, không co/phóng ảnh. Cần vẽ đủ bước chân và15 pose bổ kiếm thật cho từng thân, rồi ráp đầu–thân–kiếm với lớp che tay/cổ áo theo frame; chưa nghiệm thu chỉ từ4 key pose. Bộ class kín da, đầu không dính áo, Thú nhân không đuôi.5 class có5 thiết kế đồ cơ bản, mỗi thiết kế có hai dáng nam/nữ và vũ khí tương ứng. Chuẩn đầu GLOBAL27/10: head-standard.json là nguồn duy nhất cho pipeline/Unity/trang kiểm. Canvas96px; khối má20±1px, cằm(48,65), neo cổ(48,66), PPU96/scale1. Tóc/tai/sừng không làm thước mặt. Chuẩn hóa30 đầu/240 hướng từ ảnh nguồn lớn, một scale đều hai trục dùng chung8 hướng/mẫu; bỏ dx/dy/scale từng đầu trong runtime. Sửa trường hợp bộ đo cũ lẫn tóc bạc và đo sai trục Long tộc nữ2. Đo pixel mặt thực tế đủ30 đầu PASS19–21px/trục lệch tối đa1px; kiểm atlas/thân sạch/48 frame PASS; đã rà30 đầu đứng/bước/giơ kiếm. Unity chặn build sai chuẩn, test pivot/kích thước/neo cho240 tổ hợp đầu/pose. Xem quy chuẩn: docs/thiet-ke/quy-chuan-dau-global.md; trang kiểm /site/media/weapon-proof-v2/rig-v3/index.html. Chỉ hướng S đã rà ghép thân; hướng khác mới chuẩn mật độ, neo8 hướng thân chưa nghiệm thu. Không coi chuẩn hóa là vẽ lại độ nét hoặc nghiệm thu mỹ thuật. CHỐT THAY THẾ27/10 (mới nhất): BỎ toàn bộ nhánh cởi đồ/thân nền đồ lót và yêu cầu tấn công5 vũ khí trên thân không trang bị. Khi tạo nhân vật BẮT BUỘC chọn1 trong5 class kiếm/cung/trượng/thương/khiên; cấp1 bộ đồ cơ bản và1 vũ khí cơ bản đúng class. Hình nhân vật luôn có tối thiểu bộ cơ bản của class, không có trạng thái cởi trần/đồ lót. Khi thay/bỏ trang bị thì quay về hình bộ cơ bản, không về thân khỏa/đồ lót. Đồ chỉ vẽ động tác class tương ứng, đi8/chạy8/đánh15 frame đủ8 hướng. Kiếm/vũ khí vẫn asset riêng có điểm nắm/lớp ngón tay, thay được độc lập. Hai dáng nam/nữ, nữ nhỏ nhắn thanh hơn, cùng HEAD_STANDARD và neo cổ. Ưu tiên hoàn tất mẫu kiếm sĩ nam/nữ mới trong game; các nguồn đồ lót đã thử bị loại khỏi runtime và ngừng vẽ. Các đoạn kế hoạch thân nền đồ lót trước đó là LỊCH SỬ ĐÃ HỦY, không được thực thi. Không reset DB hiện có.",
      "weight": 2,
      "phase": 2,
      "region": null,
      "depends": [],
      "requiresNewArt": true,
      "steps": [
        {
          "label": "Chọn mẫu đối chiếu và xác định phần cần nét hơn ở kích thước gốc",
          "weight": 15,
          "done": false,
          "evidence": "Đã ghi quy chuẩn và bản sao ảnh gốc kèm hash ngày 26/10; đây là tài liệu chuẩn bị, chưa nghiệm thu mẫu mỹ thuật HD nên bước vẫn chưa hoàn tất."
        },
        {
          "label": "Vẽ thử một nhân vật nét hơn, đủ tám hướng và các hành động đang dùng",
          "weight": 35,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm 1×/2× và Unity: độ nét, tỷ lệ, chuyển động, tóc và vũ khí liền mạch",
          "weight": 25,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Áp dụng cho bộ 30 nhân vật sau khi mẫu đạt, kiểm và build bản game",
          "weight": 25,
          "done": false,
          "evidence": ""
        }
      ],
      "priority": 1
    },
    {
      "id": "basic-role-weapons",
      "group": "Nhân vật",
      "name": "Ưu tiên nhân vật với vũ khí cơ bản đúng class",
      "detail": "Chốt 26/10: hoàn thiện nhân vật và tóc trước. Giai đoạn này dùng một vũ khí cơ bản đúng class: kiếm, trượng, cung, thương hoặc khiên. Giữ tay nắm và chuôi khớp từng frame, cùng tay cầm chính ở tám hướng; tỷ lệ/độ nét giống thân và tóc, không bay/rời tay hoặc đổi kích thước khi đi/đánh. Dùng hình liền đã duyệt làm chuẩn; vẫn thử tách vũ khí ở weapon-hand-and-layer-proof ngay trong đợt này. Một nhân vật/hai vũ khí cơ bản cùng loại để thử thay; chỉ mở rộng runtime sau khi mẫu nắm chuôi và chuyển động liền mạch đạt. Chưa vẽ bộ vũ khí theo cấp, không tự đặt cấp hay chỉ số.",
      "priority": 1,
      "weight": 2,
      "phase": 2,
      "region": null,
      "depends": [],
      "requiresNewArt": true,
      "steps": [
        {
          "label": "Chốt mẫu vũ khí cơ bản và chuẩn tay nắm cho năm class",
          "weight": 20,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ và khớp vũ khí cơ bản trong tám hướng đứng, đi/chạy, tấn công",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm trong Unity: cùng tỷ lệ, nét, đúng lớp tay/chuôi, mỗi nhân vật một vũ khí",
          "weight": 35,
          "done": false,
          "evidence": ""
        }
      ]
    },
    {
      "id": "weapon-tier-art",
      "group": "Nhân vật",
      "name": "Vẽ vũ khí theo cấp sau khi nhân vật cơ bản đạt",
      "detail": "Để giai đoạn sau theo yêu cầu 26/10: chỉ bắt đầu sau khi nhân vật, tóc, chuyển động và vũ khí cơ bản đã đạt. Chưa chốt dải cấp/số mẫu/chỉ số. Thiết kế các bậc vũ khí của năm class trên cùng chuẩn kích thước, điểm nắm, lớp tay và tám hướng/hành động; vũ khí cấp cao vẫn cần rõ hình và liền mạch với nhân vật. Nếu tách để thay, dùng kết quả thử weapon-hand-and-layer-proof; không mặc định đã tách thành công. Mục tiêu tái sử dụng sau khi tách đạt: giữ nguyên thân, tóc, trang phục và bộ chuyển động; vũ khí mới cùng kiểu cầm/class chỉ cần asset vũ khí khớp chuẩn chuôi/pivot, điểm nắm và các hướng/góc cần dùng để thay vào. Dùng lại bảng neo và lớp tay che theo frame, không vẽ lại toàn bộ nhân vật cho mỗi vũ khí. Độ dài/lưỡi/đầu vũ khí có thể khác nhưng không kéo đổi kích thước cơ thể; các kiểu cầm khác class phải có chuẩn riêng.",
      "priority": 3,
      "weight": 3,
      "phase": 3,
      "region": null,
      "depends": [
        "characters-modular-multiweapon",
        "basic-role-weapons"
      ],
      "requiresNewArt": true,
      "steps": [
        {
          "label": "Chốt dải cấp, số mẫu và hướng hình từng bậc sau khi nhân vật đạt",
          "weight": 20,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ các bậc vũ khí trên chuẩn tay nắm/kích thước, đủ frame cần dùng",
          "weight": 45,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Tích hợp thay vũ khí theo phương án đã nghiệm thu, kiểm và build",
          "weight": 35,
          "done": false,
          "evidence": ""
        }
      ]
    },
    {
      "id": "class-selection-career-change",
      "group": "Nhân vật",
      "name": "Chọn nghề, cấp bộ và đổi nghề/tẩy điểm có phí",
      "detail": "CHỐT HIỆN HÀNH27/10: tạo nhân vật chọn TỘC → ĐẦU, mặc đồ lót tối giản (nam quần, nữ áo+quần), chạy/đi nói chuyện NPC để chọn nghề rồi nhận bộ đồ+vũ khí. Đợt đầu5 class có5 bộ đồ cơ bản+5 vũ khí cơ bản; không còn bộ vải tân thủ riêng. Tháo bộ đồ trở về thân đồ lót, giữ đầu/tộc. Mỗi tộc3 đầu nam+3 đầu nữ khác tóc,4 tộc=24 bộ đầu. Bỏ hạn mức3 bộ/tộc hoặc3 bộ/class và phép nhân72/360 trước đó. Đổi nghề có phí phải đổi đồng bộ class, tẩy phân bổ điểm skill nghề cũ/hoàn điểm để học nghề mới, thay bộ skill/passive, cập nhật thanh chiêu và cặp đồ–vũ khí/animation. Máy chủ kiểm điểm thực/chiêu hợp lệ và giao dịch phí/nghề/skill/đồ đồng bộ, tránh mất phí hoặc còn skill nghề cũ. Loại tiền, mức phí, giới hạn đổi, xử lý đồ cũ và việc tẩy điểm chỉ số cơ thể chưa chốt; không tự đặt phí/loại tiền. Nguyên tố vẫn theo thiên phú cấp10, không tự reroll khi đổi nghề. Đợt đầu5 bộ class+5 vũ khí cơ bản, thân nền đồ lót dùng chung trước chọn nghề/khi tháo đồ. Tới NPC chọn nghề nhận bộ đúng class. Đầu mọi tộc ghép chung, không có đuôi thú nhân. Chưa triển khai UI/cấp phát/respec/phí/lưu dữ liệu, không đổi tài khoản thật. CHỐT THAY THẾ27/10 (mới nhất): BỎ toàn bộ nhánh cởi đồ/thân nền đồ lót và yêu cầu tấn công5 vũ khí trên thân không trang bị. Khi tạo nhân vật BẮT BUỘC chọn1 trong5 class kiếm/cung/trượng/thương/khiên; cấp1 bộ đồ cơ bản và1 vũ khí cơ bản đúng class. Hình nhân vật luôn có tối thiểu bộ cơ bản của class, không có trạng thái cởi trần/đồ lót. Khi thay/bỏ trang bị thì quay về hình bộ cơ bản, không về thân khỏa/đồ lót. Đồ chỉ vẽ động tác class tương ứng, đi8/chạy8/đánh15 frame đủ8 hướng. Kiếm/vũ khí vẫn asset riêng có điểm nắm/lớp ngón tay, thay được độc lập. Hai dáng nam/nữ, nữ nhỏ nhắn thanh hơn, cùng HEAD_STANDARD và neo cổ. Ưu tiên hoàn tất mẫu kiếm sĩ nam/nữ mới trong game; các nguồn đồ lót đã thử bị loại khỏi runtime và ngừng vẽ. Các đoạn kế hoạch thân nền đồ lót trước đó là LỊCH SỬ ĐÃ HỦY, không được thực thi. Không reset DB hiện có.",
      "weight": 4,
      "phase": 2,
      "region": null,
      "depends": [
        "characters-modular-multiweapon"
      ],
      "requiresNewArt": false,
      "priority": 1,
      "steps": [
        {
          "label": "Catalog5 cặp đồ–vũ khí class và thân nền đồ lót",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Chọn class trong game và cấp bộ an toàn, chống nhận lặp",
          "weight": 15,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Kiểm đồ/vũ khí/nghề/animation cùng họ, đầu dùng chung",
          "weight": 15,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Đổi nghề tẩy/hoàn điểm skill, thay bộ chiêu/passive/thanh chiêu",
          "weight": 20,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Chốt loại tiền/phí và giao dịch nghề/skill/đồ đồng bộ",
          "weight": 20,
          "done": false,
          "evidence": ""
        },
        {
          "label": "UI nghề, bộ, phí; lưu dữ liệu và tương thích cũ",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "QA cấp phát/respec/đổi nghề/lưu lại trên PC và Android",
          "weight": 10,
          "done": false,
          "evidence": ""
        }
      ]
    },
    {
      "id": "heads30-eight-directions",
      "group": "Nhân vật",
      "name": "30 nguyên đầu vẽ lại bằng PixelLab —5 tộc, đủ8 hướng",
      "detail": "Chốt 28/10 của chủ dự án: bộ 30 đầu cũ (player-heads-v1, trước ghi 80%) bị LOẠI và đã xoá khỏi repo ở commit 07f6ec87; thay bằng 30 đầu mới vẽ bằng PixelLab cùng style với hai NPC tóc trắng npc_silver_youth/npc_silver_youth_f (cũng vẽ bằng PixelLab) và thân PixelLab của pixellab-layered-character-pilot, để đầu–thân chung nét vẽ, bảng màu và độ nét. Giữ phạm vi: Nhân tộc, Elf, Ma tộc, Thú nhân, Long tộc; mỗi tộc 3 nam + 3 nữ khác tóc, tổng 30 nguyên đầu (mặt + tóc + tai/sừng + cổ da) và 240 hình hướng. Long tộc hình người, sừng nhỏ/vảy thái dương; Thú nhân không đuôi. Chuẩn đầu GLOBAL head-standard.json là nguồn duy nhất: canvas 96px, khối má 20±1px, cằm (48,65), neo cổ (48,66), PPU96/scale1; chuẩn hóa từ ảnh nguồn lớn bằng một scale đều chung 8 hướng mỗi mẫu, bake neo trong PNG, cấm offset/scale từng đầu trong runtime. Không sharpen/phóng đầu để giả nét. NGHIÊM CẤM ghép đè đầu lên đầu khác (docs/thiet-ke/cam-ghep-de-hai-dau.md). Đủ 8 hướng đầu trung tính chưa đồng nghĩa đủ pose đầu theo đòn đánh/chuyển động. Thử 2 đầu (Nhân tộc + Ma tộc có sừng) chung với mẫu Kiếm sĩ của pixellab-layered-character-pilot, chủ dự án duyệt style rồi mới vẽ đủ 30.",
      "weight": 6,
      "phase": 2,
      "region": null,
      "depends": [],
      "requiresNewArt": true,
      "priority": 1,
      "steps": [
        {
          "label": "Catalog 30 đầu (tộc/giới tính/kiểu tóc) và prompt PixelLab cùng style hai NPC tóc trắng",
          "weight": 10,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Thử 2 đầu PixelLab (Nhân tộc, Ma tộc có sừng) × 8 hướng; chủ dự án duyệt style/độ nét",
          "weight": 15,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Vẽ đủ 30 đầu × 8 hướng bằng PixelLab",
          "weight": 35,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Chuẩn hóa theo head-standard.json, bake neo cổ, xuất 240 hình",
          "weight": 20,
          "done": false,
          "evidence": ""
        },
        {
          "label": "Rà nét/tỷ lệ/tai/sừng, ghép thân PixelLab và cổ áo ở đủ 8 hướng",
          "weight": 20,
          "done": false,
          "evidence": ""
        }
      ]
    },
    {
      "id": "character-gender-motion-rig-v2",
      "phase": 2,
      "priority": 1,
      "detail": "Chốt mới27/10: giữ thiết kế30 đầu đã được chủ dự án đồng ý (5 tộc, mỗi tộc3 nam+3 nữ,8 hướng), nhưng ĐỘ NÉT CHƯA ĐẠT. Vẽ lại chi tiết tóc/mắt/mặt/viền tại nguồn, so hai NPC PixelLab tóc trắng cùng cỡ game; không sharpen hoặc phóng đầu. Tách thân/bộ NAM và NỮ riêng, cùng chiều cao/khối đầu/PPU/root/neo cổ, khác vai/eo/hông vừa phải. Hai thân thay thế quy tắc thân unisex trước đây. Sửa đầu bị thụt bằng neo cổ/cằm nguyên pixel, không co/phóng ảnh. Cần vẽ đủ bước chân và15 pose bổ kiếm thật cho từng thân, rồi ráp đầu–thân–kiếm với lớp che tay/cổ áo theo frame; chưa nghiệm thu chỉ từ4 key pose. Bộ class kín da, đầu không dính áo, Thú nhân không đuôi.5 class có5 thiết kế đồ cơ bản, mỗi thiết kế có hai dáng nam/nữ và vũ khí tương ứng. Nguồn thử: packages/asset-pipeline/sources/player-rig-v2. Bản thân không đầu R1 bị loại pose nâng kiếm thấp/kiếm chồng ô; R2 vẽ có đầu làm chuẩn khoảng tay, mới4 tư thế mỗi giới, chưa là bộ animation hoàn chỉnh. Hai mẫu đầu nét mới chưa nhân rộng30×8. Rà27/10: đã lưu12 nguồn chuyển động mới (8 đi+15 chém mỗi giới), chưa duyệt vì vài nguồn đổi chiều dài thân/chi tiết và mask tay/đầu lỗi. Trang rig-v2 chỉ hiện4 tư thế riêng từng giới, neo S30 đầu và2 đầu nét mới×8 hướng; không phát chuỗi lỗi, không import Unity hoặc build client. Test rig-v2/heads30 và typecheck đạt phần kỹ thuật; không thay nghiệm thu mỹ thuật. Nguồn/prompt/hash/lý do loại tại player-rig-v2/README.md và review.json. NGHIÊM CẤM VẼ/GHÉP ĐÈ ĐẦU NÀY LÊN ĐẦU KHÁC — chỉ thị trực tiếp27/10: thân/bộ đồ và mọi lớp tay/găng/cổ áo phải tách sạch toàn bộ đầu, mặt, tóc, tai, sừng, cổ da cũ TRƯỚC KHI ghép avatar mới. Tắt avatar phải thấy bộ đồ không có đầu, không còn tóc bạc ở hai bên/gáy/khe tay hoặc pixel mặt người. Không chữa bằng phóng avatar/che cổ. Nguồn có đầu chỉ để đối chiếu, không dùng nguyên frame làm lớp thân runtime. Phải rà từng frame/hướng không avatar rồi thử đầu ngắn/nhỏ/Ma tộc trên nền sáng tối. Còn phần đầu cũ thì LOẠI, không đưa game/phát hành/tăng nghiệm thu. Quy tắc đầy đủ: docs/thiet-ke/cam-ghep-de-hai-dau.md. Cập nhật thân sạch27/10: đã sinh nguồn headless thật cho2 thân (nam/nữ), không dùng mặt nạ cắt đầu cũ trong runtime. Chỉ một avatar trước lớp toàn thân sạch/tay/kiếm. Mẫu Unity trong phòng Thử chiêu có30 đầu,1 đứng+8 bước+15 chém mỗi thân hướng S, nút tắt avatar và di chuyển trong map; thân mẫu chuyển khỏi NPC để tránh che nhau. Kiểm runtime240 tổ hợp đầu/pose, PPU96/point/không mipmap, thứ tự lớp, tắt avatar, chuyển về người gốc PASS. Nguồn và prompt: player-rig-v3/README.md. Trang kiểm dùng đúng atlas Unity: /site/media/weapon-proof-v2/rig-v3/index.html. Chưa đủ8 hướng thân, chưa thay roster tạo nhân vật, kiếm cơ bản còn liền thân ở đợt thử; chưa coi là nghiệm thu mỹ thuật. Hai tấm hồi thế có ô đứng đối chiếu bị generator phóng toàn tấm: đổi mật độ toàn tấm theo ô chuẩn, không fit từng pose hoặc thay transform runtime. Chuẩn đầu GLOBAL27/10: head-standard.json là nguồn duy nhất cho pipeline/Unity/trang kiểm. Canvas96px; khối má20±1px, cằm(48,65), neo cổ(48,66), PPU96/scale1. Tóc/tai/sừng không làm thước mặt. Chuẩn hóa30 đầu/240 hướng từ ảnh nguồn lớn, một scale đều hai trục dùng chung8 hướng/mẫu; bỏ dx/dy/scale từng đầu trong runtime. Sửa trường hợp bộ đo cũ lẫn tóc bạc và đo sai trục Long tộc nữ2. Đo pixel mặt thực tế đủ30 đầu PASS19–21px/trục lệch tối đa1px; kiểm atlas/thân sạch/48 frame PASS; đã rà30 đầu đứng/bước/giơ kiếm. Unity chặn build sai chuẩn, test pivot/kích thước/neo cho240 tổ hợp đầu/pose. Xem quy chuẩn: docs/thiet-ke/quy-chuan-dau-global.md; trang kiểm /site/media/weapon-proof-v2/rig-v3/index.html. Chỉ hướng S đã rà ghép thân; hướng khác mới chuẩn mật độ, neo8 hướng thân chưa nghiệm thu. Không coi chuẩn hóa là vẽ lại độ nét hoặc nghiệm thu mỹ thuật. Chốt thân nền/vũ khí27/10: nam mặc quần lót, nữ áo+quần lót; đứng/đi/chạy8 hướng, tấn công15 frame đủ5 nhóm kiếm/cung/trượng/thương/khiên. Tháo trang bị vẫn cầm vũ khí và đánh được, không chặn animation vì thiếu áo. Hai dáng đồ kiếm sĩ nam/nữ mới chỉ cần đứng/đi/chạy/chém kiếm8 hướng. Kiếm bắt buộc là lớp asset riêng, thử đổi ít nhất2 kiếm trên cùng thân/pose; thân/áo phải vẽ hoàn chỉnh sau kiếm, không còn kiếm cũ/lỗ hình kiếm. Giữ HEAD_STANDARD global, cấm chồng hai đầu/hai bộ đồ, đi/chạy là hai chu kỳ thực. Hướng đối diện có thể lật đồng bộ theo chốt trước; ghi nguồn/lật trung thực. Phạm vi là animation đánh cơ bản5 vũ khí, không phải đã vẽ140 skill. Tài liệu: docs/thiet-ke/than-nen-va-do-kiem-si-8-huong.md. Đang vẽ nguồn tại player-rig-v4 và chuẩn bị thử trong Unity; chưa đủ nguồn/QA, không tăng phần trăm nghiệm thu. CHỐT THAY THẾ27/10 (mới nhất): BỎ toàn bộ nhánh cởi đồ/thân nền đồ lót và yêu cầu tấn công5 vũ khí trên thân không trang bị. Khi tạo nhân vật BẮT BUỘC chọn1 trong5 class kiếm/cung/trượng/thương/khiên; cấp1 bộ đồ cơ bản và1 vũ khí cơ bản đúng class. Hình nhân vật luôn có tối thiểu bộ cơ bản của class, không có trạng thái cởi trần/đồ lót. Khi thay/bỏ trang bị thì quay về hình bộ cơ bản, không về thân khỏa/đồ lót. Đồ chỉ vẽ động tác class tương ứng, đi8/chạy8/đánh15 frame đủ8 hướng. Kiếm/vũ khí vẫn asset riêng có điểm nắm/lớp ngón tay, thay được độc lập. Hai dáng nam/nữ, nữ nhỏ nhắn thanh hơn, cùng HEAD_STANDARD và neo cổ. Ưu tiên hoàn tất mẫu kiếm sĩ nam/nữ mới trong game; các nguồn đồ lót đã thử bị loại khỏi runtime và ngừng vẽ. Các đoạn kế hoạch thân nền đồ lót trước đó là LỊCH SỬ ĐÃ HỦY, không được thực thi. Không reset DB hiện có. ƯU TIÊN KIẾM SĨ27/10:3 bộ và3 thanh kiếm theo mốc tân thủ/lv5/lv10. Bộ1+kiếm1 tặng lúc chọn class. Bộ2/kiếm2 mặc/cầm từlv5; bộ3/kiếm3 từlv10; nguồn nhận và giá hai cấp sau chưa chốt. Cả3 có dáng nam/nữ, nữ nhỏ nhắn thanh vai/tay/chân hơn, giữ chuẩn đầu/neo cổ. Đủ đứng,đi8,chạy8,chém15 frame ở8 hướng. Vũ khí tách riêng, thay độc lập với đồ. Thiết kế phải khác CẤU TRÚC/SILHOUETTE, cấm chỉ đổi màu: tân thủ áo vải/giáp nhẹ giản dị;lv5 áo da vạt quấn chéo,dây đeo chéo ngực,một giáp vai bất đối xứng,ủng gia cố;lv10 giáp ngực ghép mảnh,giáp tay/chân,áo choàng lưng ngắn/tabard.3 kiếm khác lưỡi/hộ thủ/đốc: kiếm sắt thẳng cơ bản,kiếm cong nhẹ/hộ thủ bảo vệ lv5,kiếm lưỡi lá/hộ thủ cánh gọn lv10; cùng chuẩn chuôi/điểm nắm. Nguồn đổi màu v1 lv5/lv10 đã loại, đang vẽ lại phom riêng. Chi tiết máy đọc: player-rig-v4/tiers.json. BỎ cởi đồ/đồ lót theo chốt mới nhất, không vẽ tiếp nhánh đã hủy. Đang phát triển, chưa nghiệm thu mỹ thuật/đủ động tác nên không tăng%.",
      "steps": [
        {
          "id": "anchors",
          "label": "Rà và sửa neo cằm30 đầu trên hai thân",
          "weight": 15,
          "done": false
        },
        {
          "id": "clarity",
          "label": "Vẽ lại nét đầu; so NPC tại cỡ game, đủ30×8",
          "weight": 25,
          "done": false
        },
        {
          "id": "body",
          "label": "Hai thân nam/nữ đứng/đi/chạy8 hướng",
          "weight": 25,
          "done": false
        },
        {
          "id": "attack",
          "label": "Mỗi thân15 pose chém thật ×8 hướng, giữ nét/tỷ lệ",
          "weight": 25,
          "done": false
        },
        {
          "id": "runtime",
          "label": "Ghép thử trong Unity, thay đầu/kiếm, kiểm tay/cổ và phát hành",
          "weight": 10,
          "done": false
        }
      ],
      "name": "Hai thân kiếm sĩ nam/nữ, đầu nét và ghép chuyển động",
      "group": "Nhân vật",
      "weight": 6,
      "region": null,
      "depends": [
        "heads30-eight-directions"
      ],
      "requiresNewArt": true
    },
    {
      "id": "swordsman-three-tiers-v4",
      "phase": 2,
      "priority": 1,
      "name": "Kiếm sĩ3 bậc ·3 bộ/3 kiếm rời · thử trong Unity",
      "group": "Nhân vật",
      "weight": 6,
      "region": null,
      "depends": [
        "heads30-eight-directions"
      ],
      "requiresNewArt": true,
      "steps": [
        {
          "id": "draft",
          "label": "Bản nháp3 thiết kế khác phom, đủ dáng nam/nữ",
          "weight": 10,
          "done": true,
          "evidence": "packages/asset-pipeline/sources/player-rig-v4/tiers.json; turnaround.png và turnaround-v2.png của 3 bộ nam/nữ; bản đổi màu cũ bị loại."
        },
        {
          "id": "sources",
          "label": "Đủ90 nguồn/1536 pose và3 kiếm riêng theo8 hướng",
          "weight": 25,
          "done": true,
          "evidence": "packages/asset-pipeline/sources/player-rig-v4/prompts/motion-jobs.json và receipts; PlayerModularV4/catalog.json:48 records ×32 pose; weapons/catalog.json có3 kiếm riêng."
        },
        {
          "id": "runtime",
          "label": "Ghép/đổi trong kho/túi đồ/QA Unity và phát bản thử Windows",
          "weight": 30,
          "done": true,
          "evidence": "Windows 431482; .aether-stage/player-rig-v4/game-qa-final/autotest.log và qa-build.json; release-check.json xác minh bản tự cập nhật/EXE/ZIP,1536 poses/4608 swaps và ảnh túi đồ."
        },
        {
          "id": "art-review",
          "label": "Chủ dự án duyệt nét/phom/động tác cạnh NPC tại cỡ game",
          "weight": 25,
          "done": false
        },
        {
          "id": "creation",
          "label": "Áp dụng tạo nhân vật, quà khởi đầu và roster chính",
          "weight": 10,
          "done": false
        }
      ],
      "detail": "Bản Windows431482 (2026.10.27-2223) trong phòng Thử chiêu.3 bộ/3 kiếm mốc1/5/10; tân thủ vải/giáp nhẹ,lv5 áo da vạt quấn/dây ngực/giáp vai lệch,lv10 giáp ngực ghép mảnh/áo choàng lưng/giáp tay-chân.6 dáng nam/nữ, nữ thanh nhỏ hơn;90 nguồn motion,1536 pose:1 đứng+8 đi+8 chạy+15 bổ ×8 hướng×6 thân.5 hướng nguồn,3 đối hướng lật quanh root, ghi rõ metadata. Kiếm là lớp riêng,3 dáng lưỡi/hộ thủ/đốc khác,4608 tổ hợp lớp kiếm; ngón tay che chuôi. Thân thật không đầu/không vũ khí; nguồn đồ lót bị hủy, không vào runtime. HEAD_STANDARD giữ nguyên,30 đầu/240 hướng. Sửa cắt mất cổ ở biên ô bằng tách alpha trọn thân, neo cổ theo silhouette/viền cổ theo pose, không scale/offset avatar runtime. Test asset1536/4608 và Unity đầy đủ PASS; kiểm mốc cấp, đổi đồ/kiếm trong kho, túi đồ dùng cùng4 lớp mới không còn nhân vật cũ, ẩn đầu/kiếm và khôi phục người gốc. Tài liệu/prompt: packages/asset-pipeline/sources/player-rig-v4/README.md. Đã có6 item/levelReq, chưa tự đặt chỉ số/giá/nguồn nhận hai bậc sau. Phạm vi PHÒNG THỬ CHIÊU, chưa thay roster/luồng tạo nhân vật chính; quà chọn class mới là dữ liệu/helper, chưa phát cho tài khoản thật. Chưa nghiệm thu mỹ thuật thay chủ dự án, còn rà nét so NPC/duyệt chuyển động trước production. DB14 accounts/14chars không reset. Link review: /site/media/weapon-proof-v2/rig-v4/."
    }
  ],
  "worldDesign": {
    "revision": "2026-10-26-roster-reboot",
    "status": "design-draft",
    "factions": [
      {
        "id": "rowanmere_crown",
        "name": "Triều đình Đồng Bằng",
        "status": "proposal",
        "regions": [
          "human"
        ],
        "goal": "Bảo vệ các tuyến đường và cân bằng lợi ích giữa thủ phủ với làng nhỏ.",
        "leverage": "Quân trấn, kho lương, luật giao thương.",
        "cost": "Thiếu tiếng nói từ vùng ngoài thành."
      },
      {
        "id": "thistlewood_commons",
        "name": "Hội đồng Làng Khởi Hành",
        "status": "proposal",
        "regions": [
          "human"
        ],
        "goal": "Phát triển vườn hộ, nghề thủ công và đào tạo người mới.",
        "leverage": "Đất canh tác, xưởng gỗ, thương quán.",
        "cost": "Mùa vụ và nhu cầu mở rộng làng cạnh tranh diện tích."
      },
      {
        "id": "seal_order",
        "name": "Nghiệp đoàn Công Trình",
        "status": "proposal",
        "regions": [
          "human",
          "swamp",
          "desert",
          "highland",
          "volcano",
          "fungal",
          "ruins",
          "void"
        ],
        "goal": "Xây cầu, đập và trạm tiếp tế giữa các vùng.",
        "leverage": "Kỹ sư và đội vận chuyển.",
        "cost": "Cần đồng thuận cư dân trước khi khai thác tài nguyên."
      },
      {
        "id": "grey_reed",
        "name": "Liên hội Bến Nước",
        "status": "proposal",
        "regions": [
          "swamp"
        ],
        "goal": "Giữ đường thủy, mùa cá và các vườn dược liệu.",
        "leverage": "Thuyền, bến nổi và người dẫn đường.",
        "cost": "Lũ và nguồn nước ô nhiễm."
      },
      {
        "id": "sahrin_court",
        "name": "Vương triều Ốc Đảo",
        "status": "proposal",
        "regions": [
          "desert"
        ],
        "goal": "Bảo vệ giếng nước và tuyến thương caravan.",
        "leverage": "Cung thành, đội hộ tống, kho nước.",
        "cost": "Phân phối nước giữa phố lớn và trạm xa."
      },
      {
        "id": "zahra_network",
        "name": "Hội Thương Nhân Cát",
        "status": "proposal",
        "regions": [
          "desert",
          "isles"
        ],
        "goal": "Kết nối hàng hóa sa mạc với cảng biển.",
        "leverage": "Đoàn xe và bản đồ giếng.",
        "cost": "Chi phí đường dài và an toàn đoàn buôn."
      },
      {
        "id": "wind_league",
        "name": "Liên hội Trạm Gió",
        "status": "proposal",
        "regions": [
          "highland"
        ],
        "goal": "Giữ đường đèo và mạng cối xay.",
        "leverage": "Hoa tiêu núi, thợ máy và len.",
        "cost": "Bão và các trạm cô lập."
      },
      {
        "id": "snow_clans",
        "name": "Hội đồng Tuyết Lĩnh",
        "status": "proposal",
        "regions": [
          "tundra"
        ],
        "goal": "Giữ nơi trú, kho củi và mùa đánh cá băng.",
        "leverage": "Thợ săn và kho dự trữ.",
        "cost": "Mùa đông dài hơn mùa thu hoạch."
      },
      {
        "id": "red_anvil",
        "name": "Hội đồng Lò Rèn",
        "status": "proposal",
        "regions": [
          "volcano"
        ],
        "goal": "Rèn công cụ và khai khoáng bền vững.",
        "leverage": "Thợ rèn, mỏ và hợp kim.",
        "cost": "An toàn lò và lao động trong vùng nóng."
      },
      {
        "id": "coral_ports",
        "name": "Liên hội Cảng Biển",
        "status": "proposal",
        "regions": [
          "isles"
        ],
        "goal": "Giữ vận tải, chợ cá và cứu nạn.",
        "leverage": "Đội tàu, kho muối và hoa tiêu.",
        "cost": "Áp lực khai thác rạn biển."
      },
      {
        "id": "maris_people",
        "name": "Hội Bảo Vệ Rạn",
        "status": "proposal",
        "regions": [
          "isles"
        ],
        "goal": "Bảo vệ sinh cảnh và nguồn thực phẩm biển.",
        "leverage": "Tri thức dòng biển và thợ lặn.",
        "cost": "Cần nguồn thu thay cho khai thác quá mức."
      },
      {
        "id": "spore_commons",
        "name": "Cộng đồng Bào Tử",
        "status": "proposal",
        "regions": [
          "fungal"
        ],
        "goal": "Gìn giữ thành phố nấm và các vườn phát quang.",
        "leverage": "Dược nấm và tinh thể hang.",
        "cost": "Bào tử lạ lan qua đường hầm."
      },
      {
        "id": "lumerian_archive",
        "name": "Viện Khảo Cổ",
        "status": "proposal",
        "regions": [
          "ruins"
        ],
        "goal": "Khôi phục công nghệ và lịch sử khởi nguyên.",
        "leverage": "Học giả, thư khố và công cụ đo.",
        "cost": "Phân biệt dữ kiện với giả thuyết."
      },
      {
        "id": "relic_claimants",
        "name": "Hội Sưu Tầm Cổ Vật",
        "status": "proposal",
        "regions": [
          "ruins"
        ],
        "goal": "Định nguồn và bảo tồn châu báu tìm được.",
        "leverage": "Thợ phục chế và thị trường đồ cổ.",
        "cost": "Nạn trộm di vật, hàng giả."
      },
      {
        "id": "frontier_alliance",
        "name": "Liên quân Biên Giới",
        "status": "proposal",
        "regions": [
          "void"
        ],
        "goal": "Giữ tiền đồn trước các khe nứt.",
        "leverage": "Quân y và tiếp tế liên vùng.",
        "cost": "Bảo vệ người dân khi nguồn tiếp tế bị chia cắt."
      },
      {
        "id": "root_wardens",
        "name": "Hội Thủ Lâm",
        "status": "proposal",
        "regions": [
          "wood"
        ],
        "goal": "Giữ rừng cổ, cây giống và vườn thuốc.",
        "leverage": "Thảo dược và đường rễ.",
        "cost": "Cân bằng nhu cầu gỗ với phục hồi rừng."
      },
      {
        "id": "dawn_custodians",
        "name": "Học viện Bình Minh",
        "status": "proposal",
        "regions": [
          "light"
        ],
        "goal": "Chia sẻ tri thức ánh sáng, chữa lành và công nghệ pha lê.",
        "leverage": "Thư viện và trường học.",
        "cost": "Tránh độc quyền tri thức."
      },
      {
        "id": "night_lanterns",
        "name": "Hội Đèn Đêm",
        "status": "proposal",
        "regions": [
          "dark"
        ],
        "goal": "Bảo vệ thành phố đêm và lối qua rừng tối.",
        "leverage": "Đèn dẫn đường và nghề vải.",
        "cost": "Giữ an toàn mà không cô lập vùng."
      },
      {
        "id": "rift_cult",
        "name": "Đoàn Khai Thác Khe Nứt",
        "status": "proposal",
        "regions": [
          "dark",
          "void"
        ],
        "goal": "Chiếm nguồn lực từ các vết rạn.",
        "leverage": "Máy dò và mạng buôn di vật.",
        "cost": "Khai thác quá mức đe dọa cả cư dân bóng tối."
      },
      {
        "id": "caravan_compact",
        "name": "Hiệp hội Giao Thương",
        "status": "proposal",
        "regions": [
          "human",
          "swamp",
          "desert",
          "highland",
          "tundra",
          "volcano",
          "isles",
          "fungal",
          "ruins",
          "wood",
          "light",
          "dark",
          "void"
        ],
        "goal": "Kết nối nông sản, cá, cây giống và đồ trang trí.",
        "leverage": "Chợ, kho trung chuyển, người bảo lãnh.",
        "cost": "Cần kiểm nguồn hàng, chống lạm phát và giao dịch gian lận."
      }
    ],
    "regions": [
      {
        "region": "human",
        "government": "Vương quốc đồng bằng và hội đồng làng",
        "authority": "Quân chủ tại thủ phủ; tên và nhân vật vua chưa chốt",
        "seatMap": "human/rowanmere",
        "factions": [
          "rowanmere_crown",
          "thistlewood_commons"
        ],
        "exports": [
          "lúa mì",
          "mật ong",
          "vải thô"
        ],
        "imports": [
          "thép",
          "muối",
          "thuốc"
        ],
        "tension": "Nhà gỗ đá 2–3 tầng, mái dốc, chợ nông sản và công xưởng.",
        "questHooks": [
          "Giao lúa mì cho chợ đầu mối.",
          "Khôi phục một nhà phụ thành xưởng nghề."
        ],
        "continuity": "Thiết kế mới: Đồng bằng khởi hành; mở về hồ câu và các khuôn viên cá nhân. Nhân vật đời cũ chỉ phân vai NPC sau khi biên soạn lại."
      },
      {
        "region": "swamp",
        "government": "Liên hội làng sông",
        "authority": "Hội đồng các bến nước",
        "seatMap": "swamp/hub",
        "factions": [
          "grey_reed"
        ],
        "exports": [
          "dược liệu đầm",
          "cá",
          "sậy"
        ],
        "imports": [
          "lương khô",
          "sắt",
          "gỗ tốt"
        ],
        "tension": "Nhà sàn cao, cầu gỗ, thuyền hàng và vườn dược liệu nổi.",
        "questHooks": [
          "Dọn đường thủy để mở tuyến chợ cá.",
          "Tìm hạt giống chịu ngập trong mê cung kênh chìm."
        ],
        "continuity": "Thiết kế mới: Đầm nước nhiều tầng cao độ, đường nổi và bến liên kết. Nhân vật đời cũ chỉ phân vai NPC sau khi biên soạn lại."
      },
      {
        "region": "desert",
        "government": "Vương quốc ốc đảo",
        "authority": "Vua hoặc nữ hoàng ốc đảo; danh tính chưa chốt",
        "seatMap": "desert/hub",
        "factions": [
          "sahrin_court",
          "zahra_network"
        ],
        "exports": [
          "kính",
          "gia vị",
          "vải nhuộm"
        ],
        "imports": [
          "gỗ",
          "thực phẩm",
          "quặng"
        ],
        "tension": "Cung thành sa thạch cao, vòm che nắng, chợ thảm và giếng nước.",
        "questHooks": [
          "Hộ tống cây giống về giếng mới.",
          "Tìm kính cổ và đồ lưu niệm trong mê cung cát."
        ],
        "continuity": "Thiết kế mới: Cồn cát, khe đá và các trạm caravan cách xa nhau. Nhân vật đời cũ chỉ phân vai NPC sau khi biên soạn lại."
      },
      {
        "region": "highland",
        "government": "Liên minh thành trạm núi",
        "authority": "Hội đồng các trạm gió",
        "seatMap": "highland/hub",
        "factions": [
          "wind_league"
        ],
        "exports": [
          "bột mì",
          "len",
          "thiết bị cối xay"
        ],
        "imports": [
          "muối",
          "kim loại",
          "thuốc"
        ],
        "tension": "Nhà đá cao mái đồng, cầu treo, cối xay và bến mây.",
        "questHooks": [
          "Khôi phục trạm gió phục vụ đoàn hàng.",
          "Khảo sát bến mây trước khi mở đường lên trời."
        ],
        "continuity": "Thiết kế mới: Cao nguyên nhiều gió; dành tuyến riêng lên Thiên Thành. Nhân vật đời cũ chỉ phân vai NPC sau khi biên soạn lại."
      },
      {
        "region": "tundra",
        "government": "Liên minh thị tộc",
        "authority": "Hội đồng Tuyết Lĩnh",
        "seatMap": "tundra/hub",
        "factions": [
          "snow_clans"
        ],
        "exports": [
          "da thuộc",
          "khoáng băng",
          "cá khô"
        ],
        "imports": [
          "ngũ cốc",
          "than",
          "thuốc"
        ],
        "tension": "Nhà gỗ dày 2 tầng, mái tuyết dốc và đại sảnh lò sưởi.",
        "questHooks": [
          "Dự trữ thực phẩm cho trạm xa.",
          "Câu cá băng và thu thập vật liệu cách nhiệt."
        ],
        "continuity": "Thiết kế mới: Miền băng tuyết, hồ đóng băng và các điểm trú bão. Nhân vật đời cũ chỉ phân vai NPC sau khi biên soạn lại."
      },
      {
        "region": "volcano",
        "government": "Thành bang công nghiệp",
        "authority": "Hội đồng Lò Rèn",
        "seatMap": "volcano/red_anvil",
        "factions": [
          "red_anvil"
        ],
        "exports": [
          "thép",
          "than luyện",
          "công cụ"
        ],
        "imports": [
          "lương thực",
          "dược liệu",
          "gỗ chống lò"
        ],
        "tension": "Pháo đài bazan cao, cầu thép, lò rèn và đường vận quặng.",
        "questHooks": [
          "Sửa lò công cộng để mở công thức chế tạo.",
          "Tìm nhiên liệu hiếm trong mỏ nguy hiểm."
        ],
        "continuity": "Thiết kế mới: Thềm dung nham và hệ mỏ; nhà ở tách khỏi luồng lò nóng. Nhân vật đời cũ chỉ phân vai NPC sau khi biên soạn lại."
      },
      {
        "region": "isles",
        "government": "Liên bang cảng đảo",
        "authority": "Đại diện cảng và cộng đồng rạn",
        "seatMap": "isles/hub",
        "factions": [
          "coral_ports",
          "maris_people"
        ],
        "exports": [
          "cá",
          "muối",
          "vật liệu san hô hợp lệ"
        ],
        "imports": [
          "lương thực",
          "gỗ tàu",
          "thép"
        ],
        "tension": "Nhà cảng nhiều tầng, đài hải đăng và chợ cá dọc cầu tàu.",
        "questHooks": [
          "Tổ chức chuyến câu cùng bạn bè.",
          "Trục vớt châu báu và đồ trang trí có nguồn gốc."
        ],
        "continuity": "Thiết kế mới: Quần đảo nhiệt đới, rạn san hô và lối xuống hang biển. Nhân vật đời cũ chỉ phân vai NPC sau khi biên soạn lại."
      },
      {
        "region": "fungal",
        "government": "Thành phố cộng sinh dưới đất",
        "authority": "Đại hội các cụm nấm",
        "seatMap": "fungal/undercity",
        "factions": [
          "spore_commons"
        ],
        "exports": [
          "nấm thực phẩm",
          "dược liệu",
          "tinh thể"
        ],
        "imports": [
          "vải",
          "muối",
          "công cụ"
        ],
        "tension": "Nhà thân nấm nhiều tầng, cầu sợi nấm, đèn bào tử; bộ cảnh riêng.",
        "questHooks": [
          "Nuôi nấm thực phẩm tại vườn hang.",
          "Tìm vật phẩm phát quang trong mê cung rễ nấm."
        ],
        "continuity": "Thiết kế mới: Đô thị nấm ngầm, không dùng cây đầm lầy làm cây chủ đạo. Nhân vật đời cũ chỉ phân vai NPC sau khi biên soạn lại."
      },
      {
        "region": "ruins",
        "government": "Khu khảo cổ liên vùng",
        "authority": "Viện Khảo Cổ và hội bảo tồn",
        "seatMap": "ruins/aether_archive",
        "factions": [
          "lumerian_archive",
          "relic_claimants"
        ],
        "exports": [
          "bản sao tư liệu",
          "hiện vật có giấy nguồn"
        ],
        "imports": [
          "thực phẩm",
          "công cụ",
          "vật liệu bảo tồn"
        ],
        "tension": "Tháp đá vỡ cao, cơ cấu cổ, đường khảm và thư khố; bỏ cây/cối xay mượn.",
        "questHooks": [
          "Ghi nguồn một kho châu báu trước khi khai quật.",
          "Tìm bản ghi dẫn tới tri thức khởi nguyên."
        ],
        "continuity": "Thiết kế mới: Vành đai phế tích nhiều niên đại, giữ khoảng trống gợi quy mô cổ thành. Nhân vật đời cũ chỉ phân vai NPC sau khi biên soạn lại."
      },
      {
        "region": "void",
        "government": "Tiền tuyến liên vùng",
        "authority": "Bộ chỉ huy Liên quân Biên Giới",
        "seatMap": "void/void_fortress",
        "factions": [
          "frontier_alliance"
        ],
        "exports": [
          "bản đo khe nứt",
          "di vật được kiểm dịch"
        ],
        "imports": [
          "lương khô",
          "thuốc",
          "kim loại"
        ],
        "tension": "Thành trì trên đá nổi, neo ma pháp, trạm quân y và cổng khe nứt.",
        "questHooks": [
          "Bảo vệ đoàn tiếp tế.",
          "Thu thập mẫu rạn để Viện Khảo Cổ nghiên cứu."
        ],
        "continuity": "Thiết kế mới: Vùng rạn không gian riêng, không đồng nhất miền Bóng tối. Nhân vật đời cũ chỉ phân vai NPC sau khi biên soạn lại."
      },
      {
        "region": "wood",
        "government": "Cộng đồng thành rừng",
        "authority": "Hội Thủ Lâm và đại diện vườn",
        "seatMap": "wood/worldtree",
        "factions": [
          "root_wardens"
        ],
        "exports": [
          "cây giống",
          "thảo dược",
          "gỗ khai thác có hạn"
        ],
        "imports": [
          "muối",
          "vải",
          "công cụ"
        ],
        "tension": "Nhà ôm thân cây cao, cầu rễ, vườn treo và xưởng cây giống.",
        "questHooks": [
          "Ươm cây giống cho khuôn viên người chơi.",
          "Khôi phục vườn thuốc và tìm đồ gỗ cổ."
        ],
        "continuity": "Thiết kế mới: Rừng cổ đa tầng với bộ cây, rễ và đồ cảnh Mộc riêng. Nhân vật đời cũ chỉ phân vai NPC sau khi biên soạn lại."
      },
      {
        "region": "light",
        "government": "Thánh thành học thuật",
        "authority": "Học viện Bình Minh",
        "seatMap": "light/cathedral",
        "factions": [
          "dawn_custodians"
        ],
        "exports": [
          "kính quang học",
          "bản chép sách",
          "đèn pha lê"
        ],
        "imports": [
          "giấy",
          "lương thực",
          "dược liệu"
        ],
        "tension": "Tháp đá sáng, mái kính, sân học viện và vườn pha lê.",
        "questHooks": [
          "Phục chế đèn pha lê cho nhà riêng.",
          "Sưu tầm bản chép về thiên phú nguyên tố."
        ],
        "continuity": "Thiết kế mới: Bậc thềm sáng, kiến trúc cao và khoảng sân rõ ràng. Nhân vật đời cũ chỉ phân vai NPC sau khi biên soạn lại."
      },
      {
        "region": "dark",
        "government": "Liên hội đô thị đêm",
        "authority": "Hội Đèn Đêm",
        "seatMap": "dark/hub",
        "factions": [
          "night_lanterns"
        ],
        "exports": [
          "dược liệu đêm",
          "vải sẫm",
          "kỷ vật chế tác"
        ],
        "imports": [
          "ngũ cốc",
          "muối",
          "kim loại"
        ],
        "tension": "Nhà đá tím cao, mái đen, đèn dẫn đường và chợ đêm; bộ cảnh riêng.",
        "questHooks": [
          "Mở tuyến chợ đêm an toàn.",
          "Tìm chất nhuộm và đồ lưu niệm trong mê cung đêm."
        ],
        "continuity": "Thiết kế mới: Rừng đêm và đô thị trú ẩn; màu tối không mặc định phản diện. Nhân vật đời cũ chỉ phân vai NPC sau khi biên soạn lại."
      }
    ],
    "relations": [
      {
        "a": "rowanmere_crown",
        "b": "thistlewood_commons",
        "kind": "dispute",
        "reason": "Khác biệt về quyền khai thác và sử dụng tài nguyên.",
        "pressure": "Giải quyết bằng nhiệm vụ mới theo vùng; chưa triển khai phe trong gameplay."
      },
      {
        "a": "seal_order",
        "b": "grey_reed",
        "kind": "dispute",
        "reason": "Khác biệt về quyền khai thác và sử dụng tài nguyên.",
        "pressure": "Giải quyết bằng nhiệm vụ mới theo vùng; chưa triển khai phe trong gameplay."
      },
      {
        "a": "sahrin_court",
        "b": "zahra_network",
        "kind": "dispute",
        "reason": "Khác biệt về quyền khai thác và sử dụng tài nguyên.",
        "pressure": "Giải quyết bằng nhiệm vụ mới theo vùng; chưa triển khai phe trong gameplay."
      },
      {
        "a": "sahrin_court",
        "b": "seal_order",
        "kind": "trade",
        "reason": "Trao đổi nguồn hàng đặc trưng và mở đường vận chuyển.",
        "pressure": "Giải quyết bằng nhiệm vụ mới theo vùng; chưa triển khai phe trong gameplay."
      },
      {
        "a": "wind_league",
        "b": "snow_clans",
        "kind": "trade",
        "reason": "Trao đổi nguồn hàng đặc trưng và mở đường vận chuyển.",
        "pressure": "Giải quyết bằng nhiệm vụ mới theo vùng; chưa triển khai phe trong gameplay."
      },
      {
        "a": "red_anvil",
        "b": "coral_ports",
        "kind": "trade",
        "reason": "Trao đổi nguồn hàng đặc trưng và mở đường vận chuyển.",
        "pressure": "Giải quyết bằng nhiệm vụ mới theo vùng; chưa triển khai phe trong gameplay."
      },
      {
        "a": "coral_ports",
        "b": "maris_people",
        "kind": "dispute",
        "reason": "Khác biệt về quyền khai thác và sử dụng tài nguyên.",
        "pressure": "Giải quyết bằng nhiệm vụ mới theo vùng; chưa triển khai phe trong gameplay."
      },
      {
        "a": "root_wardens",
        "b": "spore_commons",
        "kind": "alliance",
        "reason": "Hợp tác bảo vệ sinh cảnh và an toàn dân cư.",
        "pressure": "Giải quyết bằng nhiệm vụ mới theo vùng; chưa triển khai phe trong gameplay."
      },
      {
        "a": "dawn_custodians",
        "b": "night_lanterns",
        "kind": "dispute",
        "reason": "Khác biệt về quyền khai thác và sử dụng tài nguyên.",
        "pressure": "Giải quyết bằng nhiệm vụ mới theo vùng; chưa triển khai phe trong gameplay."
      },
      {
        "a": "lumerian_archive",
        "b": "relic_claimants",
        "kind": "dispute",
        "reason": "Khác biệt về quyền khai thác và sử dụng tài nguyên.",
        "pressure": "Giải quyết bằng nhiệm vụ mới theo vùng; chưa triển khai phe trong gameplay."
      },
      {
        "a": "night_lanterns",
        "b": "rift_cult",
        "kind": "dispute",
        "reason": "Khác biệt về quyền khai thác và sử dụng tài nguyên.",
        "pressure": "Giải quyết bằng nhiệm vụ mới theo vùng; chưa triển khai phe trong gameplay."
      },
      {
        "a": "frontier_alliance",
        "b": "red_anvil",
        "kind": "alliance",
        "reason": "Hợp tác bảo vệ sinh cảnh và an toàn dân cư.",
        "pressure": "Giải quyết bằng nhiệm vụ mới theo vùng; chưa triển khai phe trong gameplay."
      },
      {
        "a": "caravan_compact",
        "b": "grey_reed",
        "kind": "trade",
        "reason": "Trao đổi nguồn hàng đặc trưng và mở đường vận chuyển.",
        "pressure": "Giải quyết bằng nhiệm vụ mới theo vùng; chưa triển khai phe trong gameplay."
      }
    ],
    "layout": [
      {
        "id": "human",
        "name": "Thung lũng Thistlewood",
        "shortName": "Thistlewood",
        "layer": "surface",
        "x": 50,
        "y": 53,
        "color": "#a9bf76",
        "status": "existing-region",
        "geography": "Đồng bằng khởi hành; mở về hồ câu và các khuôn viên cá nhân."
      },
      {
        "id": "swamp",
        "name": "Đầm lầy Mù Sương",
        "shortName": "Lau Xám",
        "layer": "surface",
        "x": 33,
        "y": 70,
        "color": "#92a371",
        "status": "existing-region",
        "geography": "Đầm nước nhiều tầng cao độ, đường nổi và bến liên kết."
      },
      {
        "id": "desert",
        "name": "Sa mạc Hồng Cát",
        "shortName": "Sahrin",
        "layer": "surface",
        "x": 52,
        "y": 84,
        "color": "#d6a769",
        "status": "existing-region",
        "geography": "Cồn cát, khe đá và các trạm caravan cách xa nhau."
      },
      {
        "id": "highland",
        "name": "Cao nguyên Gió Hú",
        "shortName": "Gió Hú",
        "layer": "surface",
        "x": 69,
        "y": 57,
        "color": "#a8c9a5",
        "status": "existing-region",
        "geography": "Cao nguyên nhiều gió; dành tuyến riêng lên Thiên Thành."
      },
      {
        "id": "tundra",
        "name": "Lãnh nguyên Băng Giá",
        "shortName": "Tuyết Phong",
        "layer": "surface",
        "x": 69,
        "y": 30,
        "color": "#b4d7df",
        "status": "existing-region",
        "geography": "Miền băng tuyết, hồ đóng băng và các điểm trú bão."
      },
      {
        "id": "volcano",
        "name": "Núi lửa Hoả Sơn",
        "shortName": "Đe Đỏ",
        "layer": "surface",
        "x": 86,
        "y": 55,
        "color": "#cf916f",
        "status": "existing-region",
        "geography": "Thềm dung nham và hệ mỏ; nhà ở tách khỏi luồng lò nóng."
      },
      {
        "id": "isles",
        "name": "Quần đảo San Hô",
        "shortName": "San Hô",
        "layer": "surface",
        "x": 83,
        "y": 83,
        "color": "#88c7c4",
        "status": "existing-region",
        "geography": "Quần đảo nhiệt đới, rạn san hô và lối xuống hang biển."
      },
      {
        "id": "fungal",
        "name": "Rừng Nấm Ngầm",
        "shortName": "Nấm Ngầm",
        "layer": "underground",
        "x": 20,
        "y": 54,
        "color": "#c09acb",
        "status": "existing-region",
        "geography": "Đô thị nấm ngầm, không dùng cây đầm lầy làm cây chủ đạo."
      },
      {
        "id": "ruins",
        "name": "Phế tích Aether",
        "shortName": "Phế tích",
        "layer": "surface",
        "x": 20,
        "y": 25,
        "color": "#b8b3a8",
        "status": "existing-region",
        "geography": "Vành đai phế tích nhiều niên đại, giữ khoảng trống gợi quy mô cổ thành."
      },
      {
        "id": "void",
        "name": "Vực Hư Không",
        "shortName": "Hư Không",
        "layer": "sky",
        "x": 87,
        "y": 22,
        "color": "#b29bc7",
        "status": "existing-region",
        "geography": "Vùng rạn không gian riêng, không đồng nhất miền Bóng tối."
      },
      {
        "id": "wood",
        "name": "Rừng Cổ Thụ",
        "shortName": "Cổ Thụ",
        "layer": "surface",
        "x": 33,
        "y": 37,
        "color": "#88b98c",
        "status": "existing-region",
        "geography": "Rừng cổ đa tầng với bộ cây, rễ và đồ cảnh Mộc riêng."
      },
      {
        "id": "light",
        "name": "Thánh Địa Bình Minh",
        "shortName": "Bình Minh",
        "layer": "surface",
        "x": 50,
        "y": 28,
        "color": "#e2cb91",
        "status": "existing-region",
        "geography": "Bậc thềm sáng, kiến trúc cao và khoảng sân rõ ràng."
      },
      {
        "id": "dark",
        "name": "Vực Ám Ma",
        "shortName": "Ám Ma",
        "layer": "surface",
        "x": 19,
        "y": 82,
        "color": "#ac9bc8",
        "status": "existing-region",
        "geography": "Rừng đêm và đô thị trú ẩn; màu tối không mặc định phản diện."
      },
      {
        "id": "sky_castle",
        "name": "Thiên Thành Khởi Nguyên",
        "shortName": "Thiên Thành",
        "layer": "sky",
        "x": 53,
        "y": 9,
        "color": "#ead6ab",
        "status": "planned",
        "geography": "Lâu đài trên không với một vị thần giữ tri thức và lịch sử khởi nguyên. Chưa mở map chơi."
      }
    ],
    "reserved": [
      {
        "id": "fishing_lake",
        "name": "Hồ câu bạn bè",
        "nearRegion": "human",
        "kind": "social",
        "status": "planned",
        "note": "Dành chỗ thiết kế cho hồ câu bạn bè; nguồn thực phẩm, châu báu hoặc trang trí. Chưa mở map."
      },
      {
        "id": "maze_reeds",
        "name": "Mê cung kênh chìm",
        "nearRegion": "swamp",
        "kind": "labyrinth",
        "status": "planned",
        "note": "Dành chỗ thiết kế cho mê cung kênh chìm; nguồn thực phẩm, châu báu hoặc trang trí. Chưa mở map."
      },
      {
        "id": "maze_glass",
        "name": "Mê cung kính cát",
        "nearRegion": "desert",
        "kind": "labyrinth",
        "status": "planned",
        "note": "Dành chỗ thiết kế cho mê cung kính cát; nguồn thực phẩm, châu báu hoặc trang trí. Chưa mở map."
      },
      {
        "id": "maze_roots",
        "name": "Mê cung rễ cổ",
        "nearRegion": "wood",
        "kind": "labyrinth",
        "status": "planned",
        "note": "Dành chỗ thiết kế cho mê cung rễ cổ; nguồn thực phẩm, châu báu hoặc trang trí. Chưa mở map."
      },
      {
        "id": "maze_archive",
        "name": "Mê cung thư khố",
        "nearRegion": "ruins",
        "kind": "labyrinth",
        "status": "planned",
        "note": "Dành chỗ thiết kế cho mê cung thư khố; nguồn thực phẩm, châu báu hoặc trang trí. Chưa mở map."
      }
    ],
    "evidence": [
      {
        "id": "old_coin",
        "name": "Bản ghi Đồng Bằng",
        "region": "human",
        "map": "human/town",
        "note": "Nguồn nghiên cứu đề xuất trong hướng mới; chưa đặt nhiệm vụ hay vật phẩm vào game."
      },
      {
        "id": "root_record",
        "name": "Niên luân Cổ Thụ",
        "region": "wood",
        "map": "wood/worldtree",
        "note": "Nguồn nghiên cứu đề xuất trong hướng mới; chưa đặt nhiệm vụ hay vật phẩm vào game."
      },
      {
        "id": "dawn_copy",
        "name": "Bản chép Bình Minh",
        "region": "light",
        "map": "light/cathedral",
        "note": "Nguồn nghiên cứu đề xuất trong hướng mới; chưa đặt nhiệm vụ hay vật phẩm vào game."
      },
      {
        "id": "night_copy",
        "name": "Bản khắc Đèn Đêm",
        "region": "dark",
        "map": "dark/dungeon",
        "note": "Nguồn nghiên cứu đề xuất trong hướng mới; chưa đặt nhiệm vụ hay vật phẩm vào game."
      },
      {
        "id": "reed_ledger",
        "name": "Sổ luồng Bến Nước",
        "region": "swamp",
        "map": "swamp/stone_dam",
        "note": "Nguồn nghiên cứu đề xuất trong hướng mới; chưa đặt nhiệm vụ hay vật phẩm vào game."
      },
      {
        "id": "sahrin_seat",
        "name": "Lịch giếng Ốc Đảo",
        "region": "desert",
        "map": "desert/pyramid",
        "note": "Nguồn nghiên cứu đề xuất trong hướng mới; chưa đặt nhiệm vụ hay vật phẩm vào game."
      },
      {
        "id": "wind_measure",
        "name": "Bản đo Trạm Gió",
        "region": "highland",
        "map": "highland/wind_temple",
        "note": "Nguồn nghiên cứu đề xuất trong hướng mới; chưa đặt nhiệm vụ hay vật phẩm vào game."
      },
      {
        "id": "forge_contract",
        "name": "Hợp kim Lò Rèn",
        "region": "volcano",
        "map": "volcano/red_anvil",
        "note": "Nguồn nghiên cứu đề xuất trong hướng mới; chưa đặt nhiệm vụ hay vật phẩm vào game."
      },
      {
        "id": "archive_machine",
        "name": "Bản ghi Cổ Thành",
        "region": "ruins",
        "map": "ruins/aether_archive",
        "note": "Nguồn nghiên cứu đề xuất trong hướng mới; chưa đặt nhiệm vụ hay vật phẩm vào game."
      },
      {
        "id": "fracture_memory",
        "name": "Mẫu rạn Không Gian",
        "region": "void",
        "map": "void/void_fortress",
        "note": "Nguồn nghiên cứu đề xuất trong hướng mới; chưa đặt nhiệm vụ hay vật phẩm vào game."
      }
    ],
    "chapters": [
      {
        "id": "origin",
        "order": 1,
        "title": "Khởi nguyên Aether",
        "requires": [
          "old_coin",
          "root_record",
          "dawn_copy",
          "night_copy"
        ],
        "revelation": "Nơi hội tụ đầu tiên của vật chất và dòng Aether hình thành thế giới. Thần Tri Thức lưu giữ dấu vết khởi nguyên; chi tiết nguồn gốc cuối cùng còn là bản thảo.",
        "keeper": [
          "Mỗi miền đất giữ một phần của lịch sử.",
          "Hãy đối chiếu những gì tìm thấy với bản ghi tại thư khố."
        ],
        "question": "Người chơi sẽ mang tri thức này về giúp cộng đồng như thế nào?",
        "journal": "Đã đọc bản ghi nghiên cứu của chương 1. Nội dung đang ở giai đoạn thiết kế.",
        "spoiler": false
      },
      {
        "id": "pact",
        "order": 2,
        "title": "Tám dòng thiên phú",
        "previous": "origin",
        "requires": [
          "reed_ledger",
          "sahrin_seat"
        ],
        "revelation": "Bóng tối, Ánh sáng, Mộc, Thủy, Hỏa, Thổ, Phong và Băng là tám thiên phú. Cấp 10 phát hiện đúng một nguyên tố, xác suất đều 12,5%; class và giới tính không quyết định nguyên tố.",
        "keeper": [
          "Mỗi miền đất giữ một phần của lịch sử.",
          "Hãy đối chiếu những gì tìm thấy với bản ghi tại thư khố."
        ],
        "question": "Người chơi sẽ mang tri thức này về giúp cộng đồng như thế nào?",
        "journal": "Đã đọc bản ghi nghiên cứu của chương 2. Nội dung đang ở giai đoạn thiết kế.",
        "spoiler": true
      },
      {
        "id": "burden",
        "order": 3,
        "title": "Những thành phố và đường giao thương",
        "previous": "pact",
        "requires": [
          "wind_measure",
          "forge_contract",
          "archive_machine"
        ],
        "revelation": "Các cộng đồng xây thành, phát triển nghề và trao đổi tài nguyên theo môi trường. Khuôn viên, chợ và các mê cung kết nối đời sống người chơi với lịch sử từng vùng.",
        "keeper": [
          "Mỗi miền đất giữ một phần của lịch sử.",
          "Hãy đối chiếu những gì tìm thấy với bản ghi tại thư khố."
        ],
        "question": "Người chơi sẽ mang tri thức này về giúp cộng đồng như thế nào?",
        "journal": "Đã đọc bản ghi nghiên cứu của chương 3. Nội dung đang ở giai đoạn thiết kế.",
        "spoiler": true
      },
      {
        "id": "memory",
        "order": 4,
        "title": "Tri thức trên tầng mây",
        "previous": "burden",
        "requires": [
          "fracture_memory"
        ],
        "revelation": "Những bản ghi từ mọi vùng hội tụ ở Thiên Thành. Người chơi khám phá nguyên nhân các vết rạn và tự lựa chọn vai trò của mình; diễn biến và kết thúc sẽ được viết theo hướng mới.",
        "keeper": [
          "Mỗi miền đất giữ một phần của lịch sử.",
          "Hãy đối chiếu những gì tìm thấy với bản ghi tại thư khố."
        ],
        "question": "Người chơi sẽ mang tri thức này về giúp cộng đồng như thế nào?",
        "journal": "Đã đọc bản ghi nghiên cứu của chương 4. Nội dung đang ở giai đoạn thiết kế.",
        "spoiler": true
      }
    ],
    "sky": {
      "id": "sky_castle",
      "name": "Thiên Thành Khởi Nguyên",
      "nameStatus": "proposal",
      "playable": false,
      "deity": {
        "id": "archive_keeper",
        "name": "Thần Tri Thức — Người Giữ Thư Khố",
        "nameStatus": "proposal",
        "count": 1,
        "role": "Hé lộ tri thức toàn thế giới và lịch sử khởi nguyên qua thư khố; hiện diện trong lâu đài, không xuất hiện như giọng điều khiển trong đầu."
      },
      "access": {
        "status": "proposal",
        "minLevel": 60,
        "evidence": [
          "old_coin",
          "root_record",
          "dawn_copy",
          "night_copy"
        ],
        "fromMap": "highland/cloudtemple",
        "returnMap": "highland/hub",
        "note": "Đề xuất để có thể trở lại nhiều lần trước chương cuối; chưa thêm cổng hoặc khóa đường chơi hiện tại."
      },
      "spaces": [
        {
          "id": "arrival",
          "name": "Bến mây",
          "purpose": "Điểm đến và đường về rõ ràng, không sinh boss tại điểm hồi."
        },
        {
          "id": "hall",
          "name": "Đại sảnh đối chiếu",
          "purpose": "Đặt các bản ghi cạnh nhau, xem nguồn và trạng thái mở."
        },
        {
          "id": "archive",
          "name": "Đại thư viện",
          "purpose": "Tri thức các vùng, tìm theo chủ đề, xem lại chương đã mở."
        },
        {
          "id": "origin",
          "name": "Điện khởi nguyên",
          "purpose": "Một vị thần tại đây kể và mở lịch sử theo bốn chương."
        }
      ],
      "constraints": [
        "Đúng một vị thần tại lâu đài trên không.",
        "Giữ tổng 140 kỹ năng trong thiết kế mới.",
        "Nguyên tố không quy định đạo đức, quốc tịch hoặc giới tính.",
        "Điều kiện cấp 60 hiện là đề xuất, chưa khóa đường chơi.",
        "Chỉ mở map khi đã có asset, nhiệm vụ và QA."
      ]
    },
    "notes": [
      "Hướng nhân vật mới: người chơi chọn một trong 30 tạo hình, 5 class, mỗi class 3 nam + 3 nữ; mỗi người dùng một vũ khí. Bộ hình vẽ liền hiện tại là mẫu đối chiếu; yêu cầu mới thống nhất tay cầm chính và khảo sát vũ khí thay thế theo từng frame, chưa triển khai đại trà.",
      "Nhân vật đời cũ sẽ được biên soạn thành NPC. Không tiếp tục tuyến nhân vật chính và cốt truyện cũ trên web hiện hành.",
      "Tám nguyên tố phát hiện ở cấp 10, xác suất bằng nhau 12,5%; mỗi nhân vật chỉ có một nguyên tố.",
      "140 kỹ năng là phạm vi thiết kế; kiếm có 3 phái, pháp sư có 8 bộ nguyên tố. Chiêu cuối từng bộ chuyên dồn sát thương.",
      "Khuôn viên riêng, trồng trọt, chế tạo, nấu ăn, nhà có bạn bè tham quan; hồ câu chung, chợ và mê cung là hướng phát triển đã chốt.",
      "13 ID vùng và các cổng hiện có được dùng để đối chiếu kỹ thuật. Văn hóa, thành chính, chính trị và tên tổ chức mới dưới đây là đề xuất, không kế thừa cốt truyện cũ.",
      "Thiên Thành có một vị thần hé lộ tri thức toàn thế giới và lịch sử khởi nguyên. Bản đồ tổng sẽ vẽ lại sau khi bố trí được duyệt."
    ],
    "topology": {
      "mapCount": 174,
      "directedLinks": 424,
      "crossRegionLinks": 24,
      "connections": [
        {
          "id": "human:swamp",
          "fromRegion": "human",
          "toRegion": "swamp",
          "fromMap": "human/rivergate",
          "toMap": "swamp/hub",
          "kind": "path",
          "status": "existing"
        },
        {
          "id": "human:wood",
          "fromRegion": "human",
          "toRegion": "wood",
          "fromMap": "human/element_gate",
          "toMap": "wood/hub",
          "kind": "portal",
          "status": "existing"
        },
        {
          "id": "human:light",
          "fromRegion": "human",
          "toRegion": "light",
          "fromMap": "human/element_gate",
          "toMap": "light/hub",
          "kind": "portal",
          "status": "existing"
        },
        {
          "id": "dark:human",
          "fromRegion": "human",
          "toRegion": "dark",
          "fromMap": "human/element_gate",
          "toMap": "dark/hub",
          "kind": "portal",
          "status": "existing"
        },
        {
          "id": "desert:swamp",
          "fromRegion": "swamp",
          "toRegion": "desert",
          "fromMap": "swamp/mistchasm",
          "toMap": "desert/hub",
          "kind": "path",
          "status": "existing"
        },
        {
          "id": "desert:highland",
          "fromRegion": "desert",
          "toRegion": "highland",
          "fromMap": "desert/sunkentemple",
          "toMap": "highland/hub",
          "kind": "path",
          "status": "existing"
        },
        {
          "id": "highland:tundra",
          "fromRegion": "highland",
          "toRegion": "tundra",
          "fromMap": "highland/cloudgate",
          "toMap": "tundra/hub",
          "kind": "path",
          "status": "existing"
        },
        {
          "id": "tundra:volcano",
          "fromRegion": "tundra",
          "toRegion": "volcano",
          "fromMap": "tundra/frozenhollow",
          "toMap": "volcano/hub",
          "kind": "path",
          "status": "existing"
        },
        {
          "id": "isles:volcano",
          "fromRegion": "volcano",
          "toRegion": "isles",
          "fromMap": "volcano/craterrim",
          "toMap": "isles/hub",
          "kind": "path",
          "status": "existing"
        },
        {
          "id": "fungal:isles",
          "fromRegion": "isles",
          "toRegion": "fungal",
          "fromMap": "isles/wreckyard",
          "toMap": "fungal/hub",
          "kind": "sea-cave",
          "status": "existing"
        },
        {
          "id": "fungal:ruins",
          "fromRegion": "fungal",
          "toRegion": "ruins",
          "fromMap": "fungal/h10",
          "toMap": "ruins/hub",
          "kind": "path",
          "status": "existing"
        },
        {
          "id": "ruins:void",
          "fromRegion": "ruins",
          "toRegion": "void",
          "fromMap": "ruins/h10",
          "toMap": "void/hub",
          "kind": "portal",
          "status": "existing"
        }
      ],
      "unreachable": [],
      "errors": []
    }
  }
}
```
<!-- aether-plan:end -->

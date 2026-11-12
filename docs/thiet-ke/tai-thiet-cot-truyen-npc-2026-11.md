# Tái thiết cốt truyện, nhịp lên cấp, NPC và nhà dịch vụ

Chốt của chủ dự án ngày 08/11/2026. Đây là **yêu cầu phát triển**, chưa phải nội dung đã triển khai hoặc nghiệm thu. “Viết lại 100% cốt truyện” là phạm vi phải làm lại toàn bộ, **không phải tiến độ đạt 100%**. Các đầu việc bổ sung bắt đầu ở 0%.

## 1. Viết lại toàn bộ cốt truyện và nhiệm vụ

**Bổ sung 08/11/2026:** bộ skill đang chạy trong game vẫn là bản cũ, không dùng các điều kiện học / mở nhiều nguyên tố của bản cũ để viết nhiệm vụ mới. Thiết kế theo `docs/dinh-huong-haven.md`, mục 10 của `docs/ke-hoach-nguyen-to.md` và `docs/phac-thao-ba-phai-kiem.md`: tổng 140 chiêu, mỗi bộ 10 gồm 3 bị động, Kiếm có 3 phái, Pháp sư 8 bộ nguyên tố, các class còn lại nhận hiệu ứng nguyên tố, tuyệt kỹ dồn sát thương. Tên / thông số chưa duyệt không tự biến thành điều kiện quest bắt buộc. Ưu tiên thực hiện trước: Gia viên và NPC vùng 1.

**NPC ở map quái:** bổ sung NPC theo tuyến nhiệm vụ tại các map săn, không chỉ đứng trong thị trấn. Mỗi người có động cơ, quan hệ và vai trò nối với NPC / sự kiện ở các map trước–sau; dấu vết, lời khai, bí mật và hậu quả phải tiếp nối nhất quán. Drama có gieo nền, xung đột và cái giá thật, không chỉ xếp nhiệm vụ giết quái rời rạc hoặc tạo bi kịch gây sốc. Bố trí chỗ đứng an toàn / hợp lý và thiết kế tình huống cứu giúp, điều tra, lựa chọn; tên, số lượng và tuyến chi tiết chờ duyệt bản chữ. Đây là kế hoạch, chưa tự rải NPC hoặc thay toàn bộ truyện đang chạy.

- Biên soạn lại trọn hành trình từ map đầu tới kết cục: lịch sử thế giới, động cơ nhân vật, xung đột giữa các tộc / phe, bí mật, tuyến chính, tuyến phụ, hội thoại và hậu quả sau nhiệm vụ. Không chỉ thay tên / câu thoại trên chuỗi nhiệm vụ cũ.
- Giữ các trụ cột đã chốt: 5 tộc, 5 class, thiên phú phát hiện 1 trong 8 nguyên tố khi cấp 10 với xác suất đồng đều; tuyến chính theo cấp và Ma thần; Thiên Thành / vị thần tri thức hé lộ lịch sử khởi nguyên. Chi tiết mới phải nhất quán với các trụ cột này, mọi thay đổi lớn cần chủ dự án duyệt.
- Có chiều sâu và cảm xúc: nhân vật có mong muốn, nỗi sợ, quan hệ, lựa chọn và cái giá phải trả; xây quan hệ trước biến cố để cảm xúc có căn nguyên. NPC dịch vụ cũng có đời sống và liên hệ với dân cư / vùng, không chỉ là nút mở shop.
- Cú lật phải được gieo dấu hiệu trước, có nguyên nhân và làm thay đổi cách hiểu sự kiện / lựa chọn. Rà lại các chương sau khi chốt cú lật, tránh lỗ hổng logic hoặc hy sinh nhân vật chỉ để gây sốc.
- Nhiệm vụ mới phải đa dạng về mục tiêu và cách kể: tìm hiểu đời sống, điều tra, giúp đỡ, lựa chọn, khám phá, chiến đấu và hậu quả. Đan nhiệm vụ phụ vào tuyến chính theo cấp / Ma thần; nhiệm vụ phụ có đầu–cuối, nhân vật và phần thưởng hợp lý, có thể hé lộ câu chuyện lớn.
- Phần mở đầu giới thiệu cư dân và các chức năng qua một chuỗi sự kiện có lý do trong truyện; không biến thành danh sách bấm mở từng bảng dịch vụ. Phải có cả hướng dẫn rõ ràng và hội thoại ngắn gọn khi chơi.
- Đầu ra cần có: bản cốt truyện đầy đủ để chủ dự án đọc duyệt, sơ đồ chương / nhân vật / bí mật, danh mục nhiệm vụ chính–phụ, hội thoại, điều kiện mở / hoàn thành và phần thưởng. Bản nháp cũ tại `docs/cot-truyen-moi-haven.md` là tài liệu đối chiếu, chưa tự coi là bản cuối cho phạm vi mới.
- Sau khi duyệt bản chữ mới mới chuyển thành dữ liệu sim / máy chủ / Unity. Chuyển save có phiên bản, không reset DB hoặc xoá tiến độ / tài sản người chơi.

## 2. Nhịp lên cấp chậm hơn

- Rà tổng thể EXP từ quái, boss, nhiệm vụ chính, nhiệm vụ phụ và hoạt động lặp, cùng đường cong EXP từng cấp. Người mới cần có thời gian làm quen thế giới và NPC trước khi vượt nhanh sang vùng / hệ tiếp theo.
- Thiết kế mục tiêu thời gian cho từng chặng, đặc biệt cấp 1–5, 5–10 và mốc chuyển vùng; lập bảng đo theo các lối chơi làm nhiệm vụ / săn quái / kết hợp trước khi chốt hệ số. Chưa tự đặt mức giảm EXP hoặc thời gian chơi cụ thể.
- Giảm tốc độ tăng cấp nhưng giữ cảm giác được thưởng và tiến triển. Không chỉ kéo dài bằng yêu cầu giết lặp một loại quái, và không tự tăng máu quái để bù thời lượng.
- Điều kiện cấp của truyện, trang bị, nguyên tố cấp 10 và Gia viên phải khớp nhịp mới. Gia viên mở theo tuyến làm quen NPC ở mục 3, không chỉ bằng việc đạt một cấp.
- Khi đổi đường cong EXP phải có phương án chuyển tài khoản cũ, giữ cấp / tài sản đã có và tránh cấp nhảy hoặc tụt bất ngờ; thiết kế và kiểm thử trước khi triển khai.

## 3. Chỉ mở Gia viên sau khi làm quen NPC map đầu

- Người mới hoàn thành tuyến làm quen **toàn bộ NPC cố định ở map đầu Thistlewood**, bao gồm NPC truyện và các NPC dịch vụ, rồi mới nhận quyền dùng Gia viên.
- Danh sách bắt buộc phải khai bằng dữ liệu, bao phủ các NPC cố định thực tế; không chỉ ghi cứng 5 người bán. Khi thêm NPC map đầu phải rà lại danh sách và thiết kế chuyển tiếp.
- NPC sự kiện luôn có hội thoại giới thiệu thường trực để làm quen, kể cả lúc không chạy sự kiện; việc mở Gia viên không được phụ thuộc vào một sự kiện giới hạn thời gian đang mở.
- Mỗi cuộc gặp có mục đích trong tuyến truyện và hướng dẫn chức năng liên quan. Mục tiêu là hiểu nơi mình đang sống; không bắt người mới mua hàng mất phí hoặc tiêu vật phẩm hiếm chỉ để qua bước giới thiệu.
- Sau bước cuối, có nhiệm vụ / hội thoại bàn giao quyền sử dụng khuôn viên và hướng dẫn về nhà. Tên nhiệm vụ, người bàn giao và nội dung chi tiết chờ duyệt bản cốt truyện mới.
- Máy chủ lưu xác nhận từng bước và cờ mở Gia viên theo tài khoản (mỗi tài khoản một khuôn viên); đăng nhập lại / đổi nhân vật không phát khuôn viên mới. Chặn cả cổng, nút HUD và lệnh gọi thẳng khi chưa đạt điều kiện.
- Thiết kế chuyển tài khoản cũ riêng: bảo toàn nhà / cây / vật phẩm nếu đã có, không khoá mất tài sản hoặc reset DB. Cách công nhận tuyến giới thiệu cũ cần chủ dự án duyệt.
- Có thể phát triển / kiểm riêng code Gia viên trên máy chủ thử, nhưng bản phát cho người chơi phải có điều kiện mở này.

## 4. NPC dịch vụ ở mọi vùng

Mỗi trung tâm vùng phải đủ sáu vai trò dưới đây. Năm NPC dịch vụ thường có nhân dạng riêng của từng vùng; **chỉ NPC sự kiện dùng chung danh tính / tạo hình giữa các vùng**.

| Vai trò | Chức năng cần thiết kế | Khác biệt giữa các vùng |
| --- | --- | --- |
| Người bán trang bị | Bán bộ đồ / giáp và trang bị phù hợp nghề, cấp và tiến trình vùng | Tên, ngoại hình, quầy hàng, danh mục và chuyện riêng theo vùng |
| Thợ rèn | Rèn vũ khí và trang bị; thiết kế công thức, nguyên liệu và chi phí | Thợ, xưởng, vật liệu và kỹ nghệ theo vùng; cơ chế chi tiết chưa chốt |
| Người bán vũ khí | Bán vũ khí phù hợp nghề, cấp và tiến trình vùng | Tên, ngoại hình, quầy / cửa hàng và danh mục theo vùng |
| Người bán đồ ăn | Bán món ăn tạo buff | Tên, ngoại hình, món ăn và văn hoá ẩm thực theo vùng; số buff / thời lượng chờ cân bằng |
| Người bán vật phẩm hồi phục | Bán vật phẩm hồi máu / năng lượng và tiêu hao hồi phục | Tên, ngoại hình, cửa hàng / quầy và nguồn hàng theo vùng |
| NPC sự kiện | Điểm giới thiệu và tham gia sự kiện | Cùng NPC / tạo hình / vai trò ở các vùng; không phải mỗi vùng một mẫu riêng |

- Áp dụng cho toàn bộ 13 vùng trong kế hoạch. Các vùng đang đóng chỉ chuẩn bị thiết kế, không vì có kế hoạch NPC mà tự mở vùng.
- Ở quy mô 13 vùng: tối thiểu **65 vị trí NPC dịch vụ thường và 13 vị trí NPC sự kiện**. Nếu mỗi NPC thường là một mẫu riêng thì có 65 mẫu vùng + 1 mẫu sự kiện chung; cần kiểm kê NPC đã có trước khi xác định số mẫu phải vẽ thêm. Đây chưa phải dự toán lượt / chi phí sinh ảnh.
- Bổ sung thêm cư dân / NPC nhiệm vụ để map đầu và trung tâm vùng có đời sống. Chưa chốt số lượng, tên hoặc nghề ngoài sáu vai trò trên.
- Rà NPC hiện có để phân vai phù hợp và giữ nhân vật đã có giá trị với truyện. Không ghép một ngoại hình bán hàng cho mọi vùng (ngoại lệ duy nhất là NPC sự kiện).

## 5. Nhà cao, lớn và chi tiết hơn

- Làm lại thiết kế nhà chính / cửa hàng / xưởng theo phong cách từng vùng: cao và lớn hơn nhà cũ, có kết cấu mái–tầng–cửa–cửa sổ rõ, vật liệu và đồ nghề nhận ra được chức năng.
- Đồng nhất style với nhà, nhân vật và hai NPC tóc trắng đang có trong game: nét pixel, viền, đổ bóng, màu, hướng nhìn và mật độ chi tiết phải hợp cảnh. Nhà của từng vùng vẫn có bản sắc kiến trúc riêng.
- Chốt tỷ lệ bằng cách đặt người chơi / NPC hiện hành cạnh cửa nhà ở cùng camera và PPU; lối vào, quầy và đồ nghề đủ chỗ dùng, không che đường đi. Không phóng ảnh nhà cũ để giả thành bản chi tiết mới.
- Ưu tiên bố trí nhà / quầy cho 5 dịch vụ thường: cửa hàng trang bị, xưởng rèn, cửa hàng vũ khí, quán ăn và tiệm hồi phục. Cách ghép chung công trình hay tách riêng cần duyệt theo bố cục từng vùng; NPC sự kiện có vị trí dễ tìm.
- Giữ các nhà nhỏ cũ làm nhà phụ nếu hợp vùng, theo kế hoạch đã chốt. Không tự thay style nền / cây / đường của map.

## 6. Kế hoạch hình GPT và tiêu chí duyệt

- **CHỐT 12/11/2026 — NPC VẼ BẰNG PIXELLAB** (chủ dự án: "Mỗi vùng cần các npc khác nhau mà cần vẽ đấy pixelab"): mẫu NPC GPT bị loại 12/11 vì lệch style PixelLab; GPT chỉ vẽ nhà / nội thất / đồ vật. NPC mỗi vùng khác nhau theo dân / chất vùng, cùng nét hai NPC tóc trắng, khung 80×88, không đội mũ. Danh sách và dự toán: `docs/ke-hoach-nha-rieng.md` mục 9.12. Các dòng "GPT vẽ NPC" bên dưới là lịch sử.

- Chủ dự án yêu cầu **lên kế hoạch dùng GPT vẽ nhà và NPC mới**. Đây là phạm vi vẽ dự kiến cho phần NPC / công trình; không phải cho phép thay lại nhân vật người chơi / animation đã chốt.
- Lượt ghi kế hoạch này **không sinh ảnh**. Việc sinh hình là một giai đoạn riêng; dùng ảnh mẫu game hiện hành làm tham chiếu trực tiếp và duyệt mẫu trước khi nhân rộng.
- NPC dịch vụ có thể **đứng yên**, không bắt buộc vẽ đi / chạy / đánh / gục. Ưu tiên một pose đứng nhìn rõ mặt, trang phục và nghề; chỉ thêm góc / idle nếu bố cục game thật sự cần và đã được duyệt.
- NPC phải có tỷ lệ, độ nét, mặt, tóc, vật liệu quần áo và ánh sáng hợp nhân vật đang dùng trong game. Không lấy ảnh chibi / anime ngẫu nhiên khác nét làm chuẩn.
- Thử một cụm ở Thistlewood trước: một NPC dịch vụ và nhà / quầy của họ đặt cạnh nhân vật thật. Chủ dự án duyệt tỷ lệ và nét rồi mới mở rộng các vai trò / vùng khác.
- Nghiệm thu hình tách riêng với nghiệm thu chức năng: sprite đẹp không đồng nghĩa shop / rèn / nhiệm vụ đã hoạt động; tài liệu đã viết không đồng nghĩa gameplay đã xong.

## 7. Thứ tự và tiến độ

1. Duyệt yêu cầu / đề cương cốt truyện mới, danh sách NPC và tuyến làm quen Thistlewood.
2. Viết toàn bộ bản chữ và nhiệm vụ; đề xuất đường cong EXP, phần thưởng và cách chuyển tài khoản cũ.
3. Duyệt mẫu GPT NPC + nhà theo style game; chuẩn bị hình / bố cục các vùng theo thứ tự ưu tiên.
4. Code nhiệm vụ, dịch vụ, điều kiện mở Gia viên và cân bằng cấp trên máy chủ thử 3201; kiểm save cũ và người mới.
5. Chủ dự án nghiệm thu rồi mới build / phát theo quy trình hiện hành. Không reset DB, không tự khởi động lại máy chủ thật.

Theo dõi trên admin: `story-reboot-game`, `progression-slower`, `starter-npc-onboarding`, `regional-service-npcs`, `regional-service-buildings`, `home` và các mục `hub-*`. Các yêu cầu mới ở 0%; không tự đánh dấu hoàn thành do vừa ghi kế hoạch.

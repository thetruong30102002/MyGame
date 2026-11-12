# Mẫu quái và đồ vật GPT — 11/11/2026

Chủ dự án yêu cầu GPT vẽ quái / đồ đạc đúng style game để Claude code phần tích hợp, giảm sử dụng lượt PixelLab. Hai ảnh này sinh bằng công cụ image_gen tích hợp, tham chiếu trực tiếp hình game hiện hành; chưa dùng PixelLab và chưa thay asset đang chơi.

## Tệp bàn giao

- `bu-nhin-ma-standing-4-directions-v1.png`: 2172 × 724, một hàng bốn mẫu đứng theo thứ tự đề bài S / E / N / W. Mỗi ô dự kiến 543 × 724. Bù nhìn ma thuộc đề xuất `mob-human`. Chưa có đi / đánh / trúng đòn / gục; không được ghi là quái đủ animation.
- `do-vat-ke-chuyen-vung-1-v1.png`: 1312 × 1199, lưới 2 × 2. Hàng 1: cuộn dây thừng, cọc / thanh buộc ngựa. Hàng 2: cối xay tay, xe kéo đổ. Đây là bốn món còn thiếu trong nhóm đồ vật kể chuyện vùng 1 (`story-props-r1`), không thay các tấm PixelLab có sẵn.
- `prompts.json`: nguyên prompt, công cụ, đường dẫn ảnh tham chiếu và trạng thái chờ duyệt.

## Kiểm tra trước khi Claude nhập vào game

Đây là PNG nguồn để duyệt tạo hình, không phải atlas runtime đã nghiệm thu. Các ảnh có kênh alpha, nhưng phần lớn pixel hình có alpha khoảng 250–253 cùng một số pixel rìa alpha rất thấp: **chưa đạt cổng alpha nhị phân của pipeline**. Ảnh có độ phân giải lớn và lưới nét chưa được chuẩn hoá về native của game. Không nhận diện là sprite native chỉ vì nhìn có nét pixel.

Claude cần kiểm tại cỡ game với NPC / quái thật: chọn một hệ số thu nhỏ chung cho toàn bộ bốn hướng, cùng canvas / root / baseline / PPU; không fit theo bounds riêng từng hướng. Thử hệ số khoảng 1/8 chỉ là gợi ý tỷ lệ cần duyệt, không phải thông số đã khoá. Bỏ alpha rìa rất thấp và nhị phân hoá alpha bằng pipeline sau khi đối chiếu nền sáng / tối; giữ bản nguồn nguyên trạng. Không sharpen / blur để giả độ nét.

Rà lại góc E / W và tính nhất quán trang phục: ảnh GPT chưa bảo đảm hai hướng là bản lật toán học hoặc khớp pixel. Chốt thiết kế rồi mới lập bộ đi / đánh / trúng / gục với chuẩn chuyển động và lớp vũ khí nếu cần. Không đánh dấu `mob-human` hoặc `story-props-r1` hoàn tất chỉ vì có hai tấm này.

Chưa tự nhập vào `assets/`, chưa thêm manifest / spec runtime, chưa build hoặc commit. Phạm vi này chỉ là quái / đồ vật mới theo yêu cầu 11/11, không phục hồi các thử nghiệm animation nhân vật GPT đã bị loại.

## So nét với quái hiện hành — bổ sung sau yêu cầu đối chiếu

Đã đọc chính frame `idle_S` trong atlas runtime của Xác sống, Cung thủ xương, Linh cẩu đồng, Nấm rừng và Gargoyle đá. Giữ kích thước pixel gốc của quái cũ; thu thử toàn mẫu Bù nhìn về cao 55px bằng nearest để so với nhóm quái cao 53px; không blur, sharpen hay chỉnh màu mẫu trong ảnh đối chiếu. Script tái lập: `python scripts/compare-monster-style.py`.

- Bảng 5 quái cũ + v1, cỡ 1× / phóng 4×: `.havenlord-stage/monster-style-2026-11-11/doi-chieu-4x-va-1x.png`.
- Bảng Cung thủ xương / Linh cẩu / v1 / v2, cỡ 1× / phóng 3×: `.havenlord-stage/monster-style-2026-11-11/doi-chieu-truoc-sau-3x.png`.
- Mẫu mới `bu-nhin-ma-standing-front-v2.png` dùng image_gen vẽ lại mảng theo hai quái gốc; prompt ở `prompts-v2.json`. Chỉ một dáng đứng để khoá nét, chưa phải bốn hướng hoặc animation hoàn chỉnh.

**Kết luận: chưa nghiệm thu ngang style / độ chi tiết quái gốc.** V1 bị mềm, thân / chân mảnh và chi tiết vụn khi thu về cỡ game. V2 gọn mảng / rõ viền hơn nhưng vẫn còn chuyển màu và chi tiết vụn; chưa phải ảnh pixel native có palette và alpha được chuẩn hoá. Cung thủ xương có 51 màu RGB ở frame native, Linh cẩu 66; v1 thu thử có 988, v2 có 714. Đếm màu chỉ là chứng cứ về lượng biến thiên màu, không phải thước đo duy nhất của độ chi tiết; quyết định phải dựa cả hình 1×, viền, bóng, khối và khả năng đọc mặt / chất liệu.

Không đưa v1 / v2 vào runtime hoặc tăng % kế hoạch. Chuẩn vẫn là quái gốc trong game, không lấy v2 làm chuẩn mới chỉ vì đẹp hơn v1.

## Lượt sửa tiếp — v3 đến v5

- V3 bị loại: tăng nét vụn và tự thêm mũ, lúc thu về 55px bị nhiễu hơn v2. Không dùng làm chuẩn.
- V4 thử tham chiếu quái gốc phóng 8× nguyên pixel: mảng gọn hơn nhưng công cụ tự sao chép cung / ống tên. Bản trung gian nằm trong `rejected/`, không nhập game.
- `bu-nhin-ma-standing-front-v5.png`: sửa v4 bằng image_gen để bỏ toàn bộ cung / ống tên / dây đeo ngực, giữ hai tay không và thân áo. Mảng mặt / vai / áo / bàn chân rõ hơn v2 trong bảng đối chiếu. Đây là **ứng viên mẫu đứng**, chưa nghiệm thu là ngang chuẩn PixelLab và chưa có bộ chuyển động.
- Prompt và ảnh nguồn từng lượt: `prompts-v3-v5.json`.
- So sánh tái lập bằng `python scripts/compare-monster-style.py`: `.havenlord-stage/monster-style-2026-11-11/doi-chieu-v2-v5-3x.png` và `so-lieu-v2-v5.json`. Các quái gốc giữ native; mẫu GPT cùng cao 55px, chỉ thu nearest trong bản chẩn đoán, không chỉnh màu / alpha để che lỗi.
- V5 còn 753 màu RGB trong bản thu thử, alpha chưa nhị phân. Khi tích hợp vẫn cần bước chuẩn hoá palette / alpha / lưới; không coi PNG nguồn này là asset runtime đã đạt. Không nhân thêm hướng / hoạt ảnh trước khi mẫu đứng được chủ dự án duyệt.

## Đứng bốn hướng theo v5

Thư mục `turnaround-v5/` có `S.png`, `E.png`, `N.png`, `W.png` và `metadata.json` chứa prompt / nguồn / neo. E và N được image_gen xoay trực tiếp từ cùng mẫu S v5, W lật nguyên pixel từ E bằng pipeline theo quy tắc đối hướng.

Đã kiểm hình học: cả bốn ảnh cùng canvas 1103 × 1426 và cùng chiều cao bóng đục 1313px (ngưỡng alpha 128). Mốc chân nguồn chênh tối đa 2px ở độ phân giải lớn, tương đương dưới 0,1px ở bản duyệt. Ảnh duyệt dùng **một tỷ lệ chung 1/24** và cùng root trên canvas 64 × 72, không fit chiều cao riêng mỗi hướng. Mốc nguồn W được phản chiếu theo cùng phép lật, không đặt lại vị trí bằng mắt.

Chạy `python scripts/review-scarecrow-turnaround.py` để tái tạo ảnh `.havenlord-stage/monster-style-2026-11-11/bu-nhin-ma-v5-bon-huong-review.png`. Đây vẫn là bộ đứng để duyệt mỹ thuật; chưa có đi / đánh / trúng / gục và chưa chuẩn hoá alpha / palette cho runtime. Không build web để xem ảnh, không tăng tiến độ hoặc nhập game ở lượt này.

## Bộ bước đi v5 — ảnh duyệt

`motion-v5/` chứa 8 frame mỗi hướng S / E / N / W (32 ô). Bản S dùng `walk-S-v2.png`; `walk-S.png` bị loại vì tâm đầu trôi theo cột. W lật nguyên pixel từng ô E, giữ nguyên thứ tự thời gian; script kiểm chứng đối xứng từng byte RGBA.

Prompt của công cụ image_gen tích hợp, đường dẫn nguồn, lưới, neo và trạng thái nằm trong `motion-v5/metadata.json`. Bản chính diện sửa có tâm đầu chênh tối đa 0,5px nguồn giữa các frame; E chênh 0,5px, N chênh 4,5px. Đây là phép đo tại dải đầu y=70–199, không thay thế duyệt chuyển động bằng mắt. Ở tỷ lệ duyệt 1/9, các độ lệch tương ứng dưới 0,1 / 0,1 / 0,5px.

Chạy `python scripts/review-scarecrow-walk.py` để tái lập bảng 32 ô `bu-nhin-ma-walk-8-frame-review.png`, ảnh động `bu-nhin-ma-walk-preview.gif` (140ms/frame) và `walk-geometry.json` trong `.havenlord-stage/monster-style-2026-11-11/`. Dùng chung scale 1/9, canvas 64 × 72, một neo cố định cho từng hướng; không fit / kéo giãn từng frame. Bản đứng dùng ảnh nguồn ở tỷ lệ khác do độ phân giải nguồn khác, cần kiểm chuyển tiếp đứng–đi riêng trước khi nhập game.

Đã có ảnh nguồn bước đi để chủ dự án duyệt, **chưa nghiệm thu animation hoàn chỉnh**. Chưa có đánh / trúng đòn / gục; palette và alpha vẫn chưa chuẩn hoá runtime. Không nhập game, build web, commit hoặc tăng % kế hoạch trong lượt này.

## Bộ tấn công v5 — chờ duyệt

`attack-v5/` có 8 frame tấn công tay không mỗi hướng S / E / N / W. Đây là đòn quào của quái Bù nhìn ma, không phải animation nhân vật người đã bị loại. E / N / S được công cụ image_gen tích hợp vẽ từ chính mẫu đứng v5; W lật từng ô E, giữ thứ tự. Nguyên prompt, nguồn, neo và nhịp nằm trong `attack-v5/metadata.json`.

Nhịp thử: lấy đà chậm, phóng tay nhanh hơn ở frame 4–6, chạm ở frame 5, rồi thu tay. Thời lượng từng frame: 240 / 150 / 180 / 70 / 80 / 90 / 130 / 280 ms. Đây là thông số xem thử, chưa đổi combat game.

Tái lập bằng `python scripts/review-scarecrow-walk.py --clip attack`: bảng `bu-nhin-ma-attack-8-frame-review.png`, GIF `bu-nhin-ma-attack-preview.gif` và `attack-geometry.json` trong `.havenlord-stage/monster-style-2026-11-11/`. Một scale 1/9 chung cho tất cả frame, không fit từng ô. Cả 8 ô W được kiểm bằng byte RGBA đối chiếu E. Dải đo `headBandWidth` / `headCenterX` trong báo cáo có thể lẫn tay giơ gần đầu, nên **không coi là phép đo kích thước hộp sọ**.

Chưa nghiệm thu bộ đánh: góc E còn biến thiên nhỏ về hình đầu giữa các tư thế; chuyển tiếp đứng–đi–đánh cần duyệt riêng. Chiều cao bóng đục frame trung tính đi → đánh ở cùng scale: S 480 → 466px nguồn, E 468 → 467px, N 466 → 468px; không phải ba bộ đã khớp tuyệt đối. Không chữa bằng kéo giãn từng frame. Palette / alpha vẫn là nguồn AI chưa chuẩn hoá; còn thiếu trúng đòn / gục. Chưa nhập runtime, build hoặc commit.

## Code Gia viên chờ tiếp tục

Gia viên và NPC vùng 1 đã có code mới ở sim / server / Unity, test `apps/server/tests/farm.test.ts`, typecheck và `dotnet build UnityGame/Tests~/EditorCompile` đã qua. Chưa chạy xong kiểm tích hợp live cổng 3201 / AutoTest `-havenFarm`, chưa có bản phát hành Gia viên đã nghiệm thu. Hai NPC rèn / bán vũ khí hiện mới có giới thiệu và vai trò, chưa có đầy đủ công thức / danh mục mới; nấu ăn còn để sau. Không gọi toàn bộ giai đoạn 3 hoàn tất.

Giữ nguyên luật thử ở 3201 / `data/test.db`, không reset DB, không tự restart 3200; trước restart thật phải sao lưu và hỏi chủ dự án. Các file đang sửa dở trong workspace phải được giữ lại, không discard hàng loạt.

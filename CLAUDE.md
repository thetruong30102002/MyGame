<!-- underwear-base-body-28-10 -->

**CHỐT MỚI NHẤT28/10 (thay phần "BỎ cởi đồ/thân nền đồ lót" của chốt27/10 ngay dưới): tháo đồ về thân nền — nam mặc quần cởi trần, nữ mặc áo+quần, body đẹp vừa phải. MỌI TỘC CÙNG MỘT MÀU DA (thân và cổ đầu), nên chỉ vẽ1 thân nền nam +1 nữ, có đủ đứng/đi/chạy8 hướng và5 đòn tấn công của5 vũ khí (cởi đồ vẫn đánh được). Vẫn tách đầu–thân–vũ khí, vẽ bằng PixelLab. Mỗi class12 bộ:5 bộ shop +7 bộ rớt cấp max;7 chủ đề rớt chung cho5 class; mỗi bộ chỉ có thao tác của class nó. Làm theo5 phiên, phiên nào cũng đủ5 class (`character-gear-phase-1`…`5` trong kế hoạch).**

<!-- starter-class-no-undress -->

**CHỐT MỚI NHẤT27/10: bắt chọn class ngay lúc tạo nhân vật, cấp1 đồ và1 vũ khí cơ bản đúng class. BỎ cởi đồ/thân nền đồ lót, ngừng vẽ thân đồ lót/tấn công5 vũ khí trên thân không đồ. Hình luôn tối thiểu bộ cơ bản của class; thay/bỏ trang bị quay về bộ cơ bản. Đồ chỉ đi/chạy/đánh theo class của nó; đầu và vũ khí vẫn tách riêng. Nữ nhỏ nhắn thanh hơn nhưng giữ chuẩn đầu/neo cổ chung. Chỉ thị này thay các đoạn đồ lót/NPC chọn nghề bên dưới, không reset DB.**

# Aether Chronicle — hướng dẫn cho agent

<!-- pixellab-heads-redraw -->

**Chốt28/10: bộ30 đầu cũ (player-heads-v1) và các bản thử mannequin/rig v2–v4/weapon-proof đã LOẠI và xoá khỏi repo (commit 07f6ec87). Vẽ lại30 đầu ×8 hướng bằng PixelLab cùng style hai NPC tóc trắng (`npc_silver_youth`, `npc_silver_youth_f`) và thân PixelLab; giữ5 tộc ×3 nam+3 nữ, chuẩn `head-standard.json`, cấm ghép đè hai đầu. Hướng làm: tách thân–đầu–vũ khí bằng pipeline sau khi PixelLab vẽ, thử trước mẫu Kiếm sĩ nam/nữ +2 đầu (đầu việc `pixellab-layered-character-pilot`, `heads30-eight-directions`). Các đoạn bên dưới nói "giữ thiết kế30 đầu đã đồng ý" hoặc trỏ tới rig-v3/weapon-proof index chỉ còn là lịch sử.**


<!-- global-head-standard -->

**Chốt27/10: chuẩn kích thước đầu GLOBAL, nguồn duy nhất `packages/asset-pipeline/sources/player-rig-v3/head-standard.json` (`HEAD_STANDARD`). Canvas96px, má20±1px, cằm(48,65), neo cổ(48,66), PPU96/scale1. Khối mặt phải cùng cỡ, không chỉ ô ảnh bằng nhau; tóc/tai/sừng không làm thước. Chuẩn hóa từ nguồn lớn bằng scale đều cố định mỗi mẫu/chung8 hướng, bake neo trong PNG; CẤM offset/scale từng đầu trong runtime. Không dùng fit cổ V2 cũ. Nguồn: `docs/thiet-ke/quy-chuan-dau-global.md`. Quy tắc mới thay đoạn cũ giữ nguyên ảnh80px/offset từng đầu, giữ nguyên cấm đè hai đầu.**


<!-- no-head-overpaint -->

**NGHIÊM CẤM VẼ/GHÉP ĐÈ ĐẦU NÀY LÊN ĐẦU KHÁC — chỉ thị trực tiếp27/10: thân/bộ đồ và mọi lớp tay/găng/cổ áo phải tách sạch toàn bộ đầu, mặt, tóc, tai, sừng, cổ da cũ TRƯỚC KHI ghép avatar mới. Tắt avatar phải thấy bộ đồ không có đầu, không còn tóc bạc ở hai bên/gáy/khe tay hoặc pixel mặt người. Không chữa bằng phóng avatar/che cổ. Nguồn có đầu chỉ để đối chiếu, không dùng nguyên frame làm lớp thân runtime. Phải rà từng frame/hướng không avatar rồi thử đầu ngắn/nhỏ/Ma tộc trên nền sáng tối. Còn phần đầu cũ thì LOẠI, không đưa game/phát hành/tăng nghiệm thu. Quy tắc đầy đủ: docs/thiet-ke/cam-ghep-de-hai-dau.md.**


<!-- rig-v2-scope -->

Chốt mới27/10: giữ thiết kế30 đầu đã được chủ dự án đồng ý (5 tộc, mỗi tộc3 nam+3 nữ,8 hướng), nhưng ĐỘ NÉT CHƯA ĐẠT. Vẽ lại chi tiết tóc/mắt/mặt/viền tại nguồn, so hai NPC PixelLab tóc trắng cùng cỡ game; không sharpen hoặc phóng đầu. Tách thân/bộ NAM và NỮ riêng, cùng chiều cao/khối đầu/PPU/root/neo cổ, khác vai/eo/hông vừa phải. Hai thân thay thế quy tắc thân unisex trước đây. Sửa đầu bị thụt bằng neo cổ/cằm nguyên pixel, không co/phóng ảnh. Cần vẽ đủ bước chân và15 pose bổ kiếm thật cho từng thân, rồi ráp đầu–thân–kiếm với lớp che tay/cổ áo theo frame; chưa nghiệm thu chỉ từ4 key pose. Bộ class kín da, đầu không dính áo, Thú nhân không đuôi.5 class có5 thiết kế đồ cơ bản, mỗi thiết kế có hai dáng nam/nữ và vũ khí tương ứng.


Chốt30 đầu/8 hướng27/10: Nhân tộc, Elf, Ma tộc, Thú nhân, Long tộc; mỗi tộc3 nam+3 nữ khác tóc, tổng30 nguyên đầu và240 hình hướng. Long tộc hình người, sừng nhỏ/vảy thái dương là hướng vẽ thử; Thú nhân không đuôi. Đầu dùng chung mọi bộ class, cùng khối đầu/mốc mặt/cổ, không áo dính cổ. Đủ8 hướng đầu trung tính chưa đồng nghĩa đủ pose đầu theo toàn bộ đòn đánh/chuyển động. 


## Quy tắc hiện hành — dùng chung đầu và thân kín da

Chốt hiện hành27/10: tạo nhân vật chọn tộc và nguyên đầu; mỗi tộc3 đầu nam+3 đầu nữ, tổng30 bộ đầu cho5 tộc. Tân thủ mặc đồ lót tối giản (nam quần, nữ áo+quần), đi/chạy tới NPC chọn nghề rồi nhận1 trong5 bộ class và5 vũ khí cơ bản tương ứng. Hai thân thon nam/nữ riêng, cùng chuẩn ghép đầu, đầu mọi tộc dùng chung các bộ; Thú nhân KHÔNG đuôi. Bộ class kín toàn bộ cổ/tay/chân, cổ áo thuộc thân che cổ da nhưng không che cằm. Tháo trang phục về thân nền đồ lót, không chồng hai bộ; thân nền khớp bảng da theo tộc. Bộ đồ chỉ vẽ thao tác class đó. Đổi nghề có phí phải tẩy/hoàn điểm skill, thay bộ skill/passive/thanh chiêu và cặp đồ–vũ khí đồng bộ; loại tiền/phí chưa chốt.




Đọc trước khi làm: **`docs/the-gioi-aether.md`** mục *Bàn giao* (trạng thái, việc kế tiếp, lệnh chạy / kiểm / triển khai, luật dự án),
rồi `README.md`. Kế hoạch từng mảng ở `docs/ke-hoach-*.md` (mỗi file có mục Tiến độ ghi việc đã làm).

- Monorepo: `UnityGame/` (client Unity PC + APK, đọc `UnityGame/README_UNITY.md`), `apps/server` (Node + ws + SQLite),
  `packages/protocol`, `packages/sim` (luật + dữ liệu dùng chung client / máy chủ), `packages/asset-pipeline` (xuất ra `assets/`).
  Bản web `apps/web` đã xoá 11/10/2026 — đừng dựng lại.
- Có người chơi thật trên link Tailscale Funnel: thử tính năng ở máy chủ THỬ (:3201, `data/test.db`), không ở máy chủ thật (:3200);
  triển khai theo README mục Funnel, sao lưu `apps/server/data/aether.db` trước khi đổi cách lưu dữ liệu.
- Tiếng Việt cho chú thích, tài liệu, chữ trong game, commit message.
- Mỗi khi thêm hoặc sửa kế hoạch theo yêu cầu chủ dự án: cập nhật nguồn `docs/ke-hoach-nang-cap-the-gioi.md`, chạy `npm run build:site -w @aether/server`, rồi kiểm API admin trên link Tailscale thật có đúng ID/nội dung kế hoạch mới. Không chỉ lưu ghi chú trên máy. Giữ % theo việc đã nghiệm thu; ghi chú mới chưa làm phải ở 0%. Không cần restart máy chủ chỉ vì sửa file kế hoạch.

## Vẽ nhân vật — đọc trước mỗi lượt sinh ảnh

- Chuẩn bắt buộc: `docs/thiet-ke/quy-chuan-net-ve-nhan-vat.md` và `packages/asset-pipeline/sources/player-weapon-proof-v2/style-standard-v1/standard.json`. Dùng ảnh nhân vật roster trang chủ làm tham chiếu style/nhân dạng; không dùng R3/R4/HD nháp làm chuẩn đã chốt.
- Ghi cụ thể nét tóc/mặt/viền/giáp/da thuộc/vải/giày và mật độ chi tiết trong prompt. Một chuẩn cơ thể/canvas/root/PPU cho đứng/đi/chém; không co/phóng từng frame để chữa sai người. Mẫu HD trước khi nhân rộng; lượt thử đầu tối đa 4 pose. Rà ảnh nguồn lẫn native ở 1×/2×; chưa đạt thì sửa prompt/thước và ghi lý do loại, không tăng %.
- Avatar nguyên đầu (mặt+tóc+tai/sừng+cổ da), thân mặc nguyên bộ đồ và vũ khí riêng theo mẫu thử mới. Vũ khí có điểm nắm/trục/góc/lớp ngón tay theo frame; hai tay giơ cao phải dựng trục kiếm thẳng.
- Sau sửa chuẩn: `npx tsx packages/asset-pipeline/src/weaponProof/styleStandard.ts`, rồi build/kiểm kế hoạch admin theo lệnh publish:plan. Chỉ xuất thước 2× không được gọi là bản HD vẽ chi tiết mới.
- Không mở lại R3/R4/HD nháp bị chủ dự án loại như bản chém hiện hành. Trang `weapon-proof-v2/index.html` mặc định chỉ xuất ảnh master đứng đã khóa qua `publication.ts`; đi/chém mới chưa đạt phải ghi đúng tình trạng. Bản mới cần rà riêng theo chuẩn, không lấy việc ghép trùng pixel làm lý do duyệt mỹ thuật.
- Chốt hiện hành27/10: tạo nhân vật chọn tộc và nguyên đầu; mỗi tộc3 đầu nam+3 đầu nữ, tổng30 bộ đầu cho5 tộc. Tân thủ mặc đồ lót tối giản (nam quần, nữ áo+quần), đi/chạy tới NPC chọn nghề rồi nhận1 trong5 bộ class và5 vũ khí cơ bản tương ứng. Hai thân thon nam/nữ riêng, cùng chuẩn ghép đầu, đầu mọi tộc dùng chung các bộ; Thú nhân KHÔNG đuôi. Bộ class kín toàn bộ cổ/tay/chân, cổ áo thuộc thân che cổ da nhưng không che cằm. Tháo trang phục về thân nền đồ lót, không chồng hai bộ; thân nền khớp bảng da theo tộc. Bộ đồ chỉ vẽ thao tác class đó. Đổi nghề có phí phải tẩy/hoàn điểm skill, thay bộ skill/passive/thanh chiêu và cặp đồ–vũ khí đồng bộ; loại tiền/phí chưa chốt. Nguồn docs/thiet-ke/nhan-vat-ghep-da-vu-khi.md.
- Chuẩn độ nét bắt buộc mới 27/10: đối chiếu trực tiếp hai NPC PixelLab tóc trắng nam/nữ ở sảnh (`npc_silver_youth`, `npc_silver_youth_f`), cùng camera/PPU/kích thước hiển thị. Nhân vật và vũ khí mới phải tăng độ nét thật, tối thiểu không kém hai NPC này; mẫu HD hiện tại chưa được coi là đạt mốc đó. Không dùng zoom/sharpen/blur/glow hoặc phóng người để giả độ nét; kiểm tóc/mắt/mặt/viền đồ/kim loại/chuôi và lưỡi kiếm ở native, nền map thật, cả đứng/đi/chém.
- Nhịp kiếm bắt buộc: lấy lực/nâng kiếm chậm, rõ trọng tâm → tăng tốc khi bổ → nhát ra đòn nhanh và dứt khoát, nhanh nhất gần lúc chạm → hồi thế gọn. Dùng thời lượng từng frame/đường thời gian phù hợp, giữ đủ pose nối, trục kiếm/điểm nắm và cùng một cơ thể; không giật bỏ frame, khua cổ tay hoặc quay tay đều cả chuỗi. Mốc chạm/sát thương/hiệu ứng phải khớp pose đánh khi tích hợp đòn thật; kiểm chậm 0,5× và thường 1× trước khi duyệt.
- Chốt tiếp 27/10: bộ chém kiếm vẽ lại có **15 frame**, thêm 3 pose chuyển tiếp thật so với mẫu12; không chỉ lặp ảnh hoặc kéo dài đòn. Làm một mẫu chuẩn thật kỹ trước khi mở rộng.
- Tạo hình nền mặc **đồ tân thủ cơ bản như mẫu kiếm đang thử**. Nâng độ nét/cắt may/vật liệu nhưng giữ thiết kế giản dị, không tự biến giáp nền thành bộ hiếm/hoàng gia hoặc thêm aura/cánh/trang sức cầu kỳ. Hai NPC tóc trắng là chuẩn độ nét, không là mức xa hoa cho đồ nền. Các bộ đẹp nổi bật và vũ khí theo cấp dành cho giai đoạn thời trang bán sau; chưa tự đặt giá/chỉ số.
- Cho phép **thử tách nguyên đầu** theo yêu cầu mới: mặt+tóc+đặc điểm tộc là một cụm avatar, không tách tóc đơn lẻ. Thân mặc nguyên bộ đồ và vũ khí riêng; avatar/bộ đồ có thể bán riêng sau nếu thử liền mạch đạt. Phải có neo cổ và lớp cổ áo che từng frame, khớp tỷ lệ/race/giới tính/màu da đầu–cổ–tay; tóc dài có lớp trước/sau nếu cần. Chỉ thử một mẫu trước, không mặc định đã tách thành công hoặc thay cả roster. Nếu chưa đạt thì giữ bản vẽ liền làm đối chiếu và sửa nguồn.



# Ngân Lam v7 — trang phục và tóc theo từng hành động

Bản sửa tóc mới nhất: [v8 — giữ lọn mái và tóc mai khi ghép](mannequin-v8-hair.md). Quy tắc cắt trán của v7 dưới đây đã được thay thế.

## Chuẩn giữ nguyên

Dáng đứng nam/nữ đã được chấp nhận được giữ nguyên từng pixel trong `source-art/authored-v6`. Bản v7 giữ tám frame bước vẽ thật, đăng ký lại cổ, eo và bề ngang vai theo dáng đứng. Đầu đứng và đầu đi/chạy dùng cùng hình, cùng vị trí, tránh đổi cỡ mặt khi bắt đầu bước. Canvas nguồn144, chân72/128; canvas game176, chân88/152, PPU48.

## Tranh mới và lớp đồ

Vẽ lại hai bộ gốc cho cả đứng, đi, bổ và niệm: Ngân Lam có áo xanh đậm, áo choàng vai màu ngà, viền vàng, khóa ngực, đai da và dải vải lam; Bạch Ngân có giáp thép xanh bạc, viền vàng, khớp giáp và đai da. Quần có đủ tranh riêng đến mắt cá, không lấy phần quần bị ủng che từ ảnh mặc cả bộ. Các màu đồ khác dùng lại các lớp đã đăng ký. Áo, quần và giày vẫn là các món độc lập, cùng mã đồ và cùng sprite hành động cho nam/nữ.

Trình nhập giữ toàn bộ hình trong ô trước khi căn theo đầu–bàn chân; không coi vị trí dấu góc là bằng chứng hình đã đúng tỉ lệ. Cổ áo, đai eo và vai tiếp tục được căn trên cơ thể đã chốt. Vạt áo, dải vải và miếng giáp hông thuộc lớp áo. Phần mặt và nắm tay lấy từ thân nền để tránh thay mặt hoặc dư tay. Chuôi kiếm/trượng nằm dưới các ngón tay; nhịp bổ14frame18fps/chạm7 và niệm8frame10fps/chạm4 được giữ nguyên.

Trong hai tư thế giơ kiếm, dải cẳng tay trước đây bị lẫn vào hình đầu được tách khỏi mặt khi mặc áo. Khuôn mặt ở tư thế giữ đầu này dùng hình mặt sạch đúng hướng; lớp tay áo đi trước tóc, rồi tới vũ khí và các ngón tay. Tư thế thân trần giữ hình tay gốc. Cùng thứ tự lớp được dùng ngoài thế giới, trong kho đồ và ở dịch vụ tóc.

## Tóc có animation

Ba kiểu tóc có hình tám hướng khi đứng và tranh riêng theo từng phase đi, bổ, niệm. Ba hướng đối xứng được xuất từ tư thế đối xứng tương ứng. Có960 tổ hợp kiểu tóc/tư thế cơ thể cho hai giới tính. Tóc trước và sau được xuất sẵn ở vị trí đầu của chính frame đó; runtime chọn theo cùng action/phase với thân và đồ. Không có bộ phận dịch chuyển cả tóc bằng một nhịp bob riêng. Chân tóc bám đầu, phần ngọn và đuôi dùng các frame vẽ chuyển động thứ cấp. Mặt nạ tóc trước bảo vệ trán, mắt và mặt ở cả hướng nghiêng; tóc phía sau nằm sau đầu.

## Nguồn và lệnh

Ảnh dùng **ImageGen tích hợp**, không dùng CLI/API fallback. Các ảnh được sao chép về ổD trong `assets/mannequin/v2/source-art/v7/`; hình tóc hoạt động nằm trong thư mục `hair/`. Prompt được lưu cạnh tranh trong `prompts.json`. Tranh và nguồn v6 được giữ lại.

```powershell
npm --workspace packages/asset-pipeline run test:warden
python packages/asset-pipeline/scripts/review-modular-v7.py
```

Kiểm tra gồm: dáng đứng không thay đổi;128 đầu di chuyển trùng dáng đứng; đồng nhất cổ–eo; frame tóc theo hành động, vùng mặt không bị tóc trước che; đầy đủ đồ độc lập; hai nắm tay chung chuôi và điểm nắm kiếm/trượng cho các bộ đồ. Ảnh xem lại đứng→đi tám hướng, đồ từng phần và các frame chiến đấu nằm ở `.aether-stage/mannequin/modular-v7-review/`.

Bản game v7 được build riêng vào `.aether-stage/mannequin/build-v7/Aether.exe` để không ghi đè file thực thi đang mở. `Chay-Ngan-Lam.cmd` đã trỏ vào bản đã kiểm tra. Mở lại bằng file này để nhận tài nguyên mới. UI, dịch vụ tóc Mira và lưu ngoại hình tiếp tục dùng phần triển khai v6.

## Bằng chứng kiểm tra

- Atlas cuối:7534ô ảnh khác nhau,21856tên dùng chung,30trang cho cả nam/nữ và mọi tổ hợp.
- Python:320tư thế thân,336cặp frame dùng chung đồ,1360điểm nắm hai tay;128đầu đi trùng đầu đứng,256frame đi/chạy giữ đúng mốc,960tổ hợp tóc/tư thế bảo vệ mặt. Tóc ở mỗi kiểu/hành động có các hình khác nhau.
- C# Client và Editor biên dịch qua. Unity `modular-v7-final-build.log`:Succeeded,0errors.
- Ảnh chuyển động: `modular-v7-review/idle-walk-*.gif` và `modular-v7-review/hair-actions.gif`. Vùng cắt và độ phóng đại cố định, không chỉnh cỡ riêng từng frame.
- Bản game thực: `modular-v7-runtime/autotest.log`, tiến trình thoát0. Qua80tổ hợp áo/quần/giày,14080frame kiểm lớp đồ/điểm nắm, hai vũ khí/tám hướng;176frame đánh/niệm thân nền. Nam và nữ đều qua128frame xác nhận đầu đứng–đi/chạy giữ cùng sprite và tóc theo pose. Kiếm chạm0,389s, trượng0,400s và có đạn phép. Ảnh kho/thợ tóc/bước đi thực800×600 được xem lại.

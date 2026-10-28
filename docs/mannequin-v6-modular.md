# Ngân Lam v6 — thân nam/nữ, trang bị và tóc độc lập

Bản sửa dáng đứng/di chuyển, trang phục chi tiết và tóc theo từng hành động nằm trong [Ngân Lam v7](mannequin-v7-appearance.md). Phần bên dưới ghi lại bản v6 trước phản hồi về chất lượng ghép.

## Chuẩn hình

Mẫu tỉ lệ và nhịp đi là nhân vật tóc nâu PixelLab đang dùng (`player_hero_adult`), không phải mẫu Ngân Lam thấp, to ngang trước đây. Thân nền người lớn được vẽ riêng: nam mặc quần lót, nữ mặc áo lót và quần lót. Đầu của mỗi tư thế lấy từ chính tranh tư thế ấy; tóc là lớp riêng, bám theo mốc đầu.

Canvas nguồn144×144, mốc chân72/128, thân khoảng80px; thêm viền trong suốt thành176×176, mốc88/152, PPU48. Các giới tính và mọi món đồ dùng cùng chuẩn. Có320 tư thế thân: đứng1, đi8, bổ7, niệm4 ×8hướng ×2giới. Chạy dùng lại đủ8 tư thế bước với nhịp9fps cơ sở, không nhảy cao kiểu chạy cũ. Ba hướng đối xứng được lật cả tư thế và các mốc tương ứng.

## Trang bị

Áo, quần và giày dùng chung sprite cho nam/nữ, theo đúng action/phase/direction. Không có cả bộ áo quần cũ in trên thân nền. Quần có tranh riêng đủ ống xuống mắt cá, kể cả phần bị ủng che trong bộ mặc đầy đủ. Giày nằm trên quần, không cắt mất ống quần khi tháo giày. Mặt nạ cơ thể xử lý riêng các trường hợp chỉ mặc một món.

Hai bản trang bị vẽ riêng là Ngân Lam và Bạch Ngân; các màu Hồng Tửu, da và Long Vệ được nhuộm từ hình đã đăng ký. Cùng13 mã món trong kho, không tạo mã giới tính. Atlas `aether_shared` chia sẻ hai nhân vật và gộp các ô trùng pixel; tên sprite có thể cùng trỏ tới một ô. Không tạo cả nhân vật mới cho từng tổ hợp trang bị/vũ khí.

Kiếm khi cầm nằm trước các lớp thân/áo/tóc, dưới các ngón tay. Bổ kiếm giữ14frame18fps, chạm ở7/18giây; hai nắm tay cùng một chuôi cứng, không bẻ kiếm để vừa khung. Các tư thế có tay khuất ở phía xa được che đúng lớp. Trượng giữ8frame10fps, chạm ở0,4giây.

Điểm nắm của cả kiếm và trượng được đăng ký theo từng frame và bản tay trần/áo/giáp; không dùng lại điểm nắm của áo cho thân trần. Atlas hiện có6736ô ảnh riêng,17696tên dùng chung,27trang cho cả hai giới tính.

## Tóc và Mira

Ba kiểu tóc vẽ8hướng: nâu hạt dẻ, bạc vuốt lệch, nâu buộc đuôi; thêm lựa chọn cạo gọn. Tóc trước/sau đi theo đầu của từng frame. Nam/nữ dùng chung các kiểu tóc và trang bị.

Mira ở quảng trường Thistlewood (`human/town`, điểmplaza+76/96), hiện từ16tuổi. Bấm tương tác mở xem trước8hướng, chọn rồi áp dụng. Khi đang dùng nhân vật gốc, xem trước dùng một mẫu riêng ngoài màn hình; chỉ áp dụng mới đổi ngoại hình. Lựa chọn lưu trong `story.appearance` của cơ chế lưu hiện có. Không phát trang bị thử miễn phí qua dịch vụ tóc; bộ thử15món vẫn chỉ được cấp trong phòng Thử chiêu.

Phòng Thử chiêu có nút Nam/Nữ, đổi tóc, chọn kiếm/trượng, thay từng món và xem8hướng. F7 đổi giới tính, F10 đổi tóc, F11 xem mốc. `Chay-Ngan-Lam.cmd` mở bản build kiểm tra mới.

## Giao diện

Khung cửa sổ và menu, thẻ nội dung, nút, ô đồ, thanh kỹ năng, HUD máu/phép/thể lực, mục cài đặt và các cửa sổ dịch vụ dùng nền than/xanh đậm, viền mảnh và điểm nhấn đồng. Bỏ khung gỗ/băng tiêu đề lớn. Menu trái có vạch chọn rõ, tiêu đề căn trái, chữ và khoảng cách thống nhất. Nhân vật ghép trong kho hiển thị×3 với đúng lớp tóc/đồ/chuôi kiếm. Các trang sách vẫn có nền giấy bên trong khung mới.

## Nguồn và tái tạo

Ảnh được vẽ bằng **ImageGen tích hợp**, không dùng CLI/API fallback. Nguồn cuối được lưu trong `assets/mannequin/v2/source-art/v6/`; prompt trong `final-prompts.json` và `pants-prompts.json`. `authored-v6/` chứa từng tư thế đã đăng ký cùng metadata. Ảnh gốc sinh ra tại Codex được giữ nguyên, bản dùng cho dự án đã sao chép về ổD.

```powershell
python packages/asset-pipeline/scripts/assemble-modular-v6.py
python packages/asset-pipeline/tests/modular-v6.test.py
python packages/asset-pipeline/scripts/review-modular-v6.py
npx tsx UnityGame/Tools~/export-sim-data.mts
npx tsx UnityGame/Tools~/export-client-data.mts
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/kiem-mannequin.ps1
```

Unity cần cả hai bản export: `WorldPopulation` đọc NPC từ `Data/Client/npcs.json`. Kiểm tra tự động bao gồm320tư thế, chia sẻ trang bị, điểm nắm của cả hai tay,8bước thực, ống quần dưới ủng và bàn chân khi chỉ mặc quần. Kiểm tra runtime có ma trận80tổ hợp đồ×2vũkhí×8hướng, thân không đồ, hai giới, mọi kiểu tóc, combat và NPC Mira.

Build: `Aether.Importer.MannequinVerification.BuildBatch`. Bản ghi và ảnh kiểm tra nằm trong `.aether-stage/mannequin/`; xem log build có `Succeeded; errors=0`, log runtime kết thúc thành công và ảnh sau khi cửa sổ hiện hoàn toàn. Bài chụp màn hình tắt đặt canvas tạm trên lớp thời tiết để ảnh kiểm tra khớp thứ tự overlay thực tế.

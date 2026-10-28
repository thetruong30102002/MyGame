# Ngân Lam — pose vẽ và ghép trang bị v3, 22/10/2026

## Cấu trúc hiện hành

`packages/asset-pipeline/src/mannequin/warden.ts` dùng 160 cặp pose có/không đồ trên lưới 112×112: đứng 1, đi 4, chạy 4, chém 7, niệm 4 pose cho mỗi hướng S/SW/W/NW/N/NE/E/SE. Bộ bạc được vẽ thành nhân vật hoàn chỉnh ở chính những pose đó, rồi mới tách áo/giáp, quần và giày. Hai bộ xanh/đỏ giữ thân vẽ liền mạch; áo da nâu, quần sáng và giày đen là các biến thể màu của lớp tương ứng.

Các ảnh cơ thể không đồ được ImageGen vẽ lại trong `assets/mannequin/v2/source-art/warden-bare-*-v3.png`, nam chỉ mặc quần đùi. Không đổi màu áo thành da hoặc kéo tay/chân để tạo giải phẫu. Ảnh nguồn giáp bạc là `warden-silver-*-v3.png`; không co một icon giáp lên thân. Script `prepare-authored-v3.py` làm sạch alpha/viền màu nguồn, lấy mẫu nearest-neighbor và chuẩn hóa về cùng lưới. Pha chân đối diện S/N dùng ảnh chân đã vẽ được lật qua trục hông; một pha chạy nguồn bị cắt chân được thay bằng pose passing nguyên vẹn với nhịp bay lên 1 px. Không ghép đoạn chân bị mất hoặc thu nhỏ người để giấu lỗi.

Catalog hiện tại chỉ có mẫu nam. Quy chuẩn cho mẫu nữ khi thêm sau này: lớp nền mặc áo và quần.

Đầu có tám hướng lấy từ mẫu đứng gốc và chỉ tịnh tiến đến cổ từng pose, giữ nguyên kích thước đầu/mặt khi đi, chạy, chém hoặc thay đồ. Đường cắt ở đúng chỗ cổ hẹp dưới cằm; lớp đầu không chứa dải vai/ngực trần. Các lớp thân và trang bị giữ đúng pixel pose đã vẽ. Tất cả sprite dùng 112×112, mốc chân (56,100), pivot Unity (56,12), 48 PPU, Point, alpha 0/255.

Mỗi pose có tám mask cơ thể cho các tổ hợp hiện/ẩn áo, quần, giày. Khi một món đang mặc, vùng cơ thể tương ứng bị che để tránh thêm tay hoặc chân trần cạnh đồ. Bàn tay che cán có bản không đồ, găng vải và găng bạc riêng. Kho đồ dùng cùng sprite/mask với nhân vật trong bản đồ.

## Động tác

Chém tham khảo trực tiếp `attack_S/W/N/E` của nhân vật gốc trong `assets/characters/player_hero_adult/`: kiếm thấp, xoay thân, tay cắt ngang trước ngực/eo, theo đà rồi thu về. Chém có 8 khung phát ở 12 fps, 7 pose nguồn, hit frame 4 (0,333 s); không gọi khung giữ là pose vẽ mới. Vệt chém gọn ở khung 3–5, phía trước lưỡi kiếm. Niệm có 8 khung/4 pose ở 10 fps, hit frame 4 (0,4 s). Đi/chạy có sequence riêng, 8 khung/4 pose giữ hai nhịp, controller điều chỉnh nhịp theo vận tốc.

## Tái tạo và kiểm

```powershell
python packages/asset-pipeline/scripts/prepare-authored-v3.py
npm run test:warden -w @aether/asset-pipeline
npm run typecheck -w @aether/asset-pipeline
python packages/asset-pipeline/scripts/review-authored-v3.py
```

Test pipeline kiểm nguồn SHA, giải phẫu thân so với đúng pose nguồn, kích thước đầu bất biến, cằm/đầu không chứa vai, mask che thân, giáp bạc tái ghép đúng ảnh vẽ, chuôi cùng nằm trong lòng bàn tay của cả ba loại găng, alpha/biên/PPU/icon. Kết quả: 40 sequence, 288 khung phát, 160 cặp pose, 576 điểm tiếp xúc vũ khí, 6.112 cell atlas.

GIF/contact sheet so sánh không đồ, xanh, bạc và đỏ phối giáp ở `.aether-stage/mannequin/drawn-v3-review/`. Unity build và runtime chỉ được ghi PASS khi có log thực; ảnh tĩnh và kiểm dữ liệu không thay cho xem chuyển động trong game. Bộ này vẫn là nhánh thử trong phòng Thử chiêu.

## Kiểm thực tế bản cuối

- Pipeline test và typecheck PASS; Unity `drawn-v3-build-inventory.log`: **Succeeded, errors=0**.
- Windows AutoTest `drawn-v3-runtime-final` exit 0, 616 ảnh: đi/chạy không đồ ở 8 hướng, 128 khung chém/niệm không đồ; 36 tổ hợp đồ × 2 vũ khí × 8 hướng × 8 khung = 4.608 khung kiểm đúng sprite và mask cơ thể.
- Kiếm trúng dummy ở release 0,333 giây; trượng có projectile và trúng ở 0,4 giây. Không đánh trước mốc release.
- Đã xem ảnh kho thật `bare-inventory.png`, `mannequin-inventory-silver.png`, ảnh không đồ chém S và ảnh giáp đang chém. Ảnh đối chiếu hai ô xem nhân vật: `drawn-v3-review/inventory-comparison.png`; chuyển động: `attack-S.gif`, `run-S.gif` trong cùng thư mục.
- Bản Windows hiện hành: `.aether-stage/mannequin/build/Aether.exe`. Bản này cần mở lại để nạp atlas mới; không phát hành qua Tailscale trong lượt sửa mỹ thuật này.

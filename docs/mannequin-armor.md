# Ngân Lam — tám hướng, tay cầm và giáp rời

Cập nhật 21/10/2026 cho demo **Thử chiêu**. Đây là trạng thái mới nhất, thay các số lượng trong `mannequin-clothing.md` và `mannequin-v2-delivery.md`.

## Cách xem

Chạy `.aether-stage/mannequin/build/Aether.exe -noUpdate`, chọn **Thử chiêu → Ngân Lam mới**. Tab **Phối đồ** cho đổi từng món; tab **Xem 8 hướng** có la bàn Nam, Tây Nam, Tây, Tây Bắc, Bắc, Đông Bắc, Đông, Đông Nam. Nút giữa giữ thế đứng hướng hiện tại. WASD đi tám hướng, Shift chạy, chọn Kiếm/Trượng rồi **Thử đòn đang cầm** hoặc chuột trái. Các nút đổi hướng/đồ/vũ khí chặn khi đang thực hiện action.

| Slot | Item |
|---|---|
| Áo | Áo xanh, áo đỏ rượu, **giáp bạc**, **áo da đinh tán** |
| Quần | Quần tối, quần sáng, **giáp chân lưới** |
| Giày | Ủng nâu, ủng đen, **ủng thép** |

Có 4 × 3 × 3 = **36 cách phối**. Giáp bạc có ngực/cầu vai mới; áo da có mảng đinh tán; giáp chân và ủng thay mảng chân riêng. Hai màu vải cũ vẫn giữ phom gốc. Các món dùng được với cả kiếm/trượng, không nhân đôi cả nhân vật theo từng tổ hợp.

## Art và pipeline

Nguồn giáp mới sinh bằng **imagegen tích hợp**, dùng sheet Ngân Lam làm tham chiếu phong cách. Lưu PNG gốc `assets/mannequin/v2/source-art/equipment-kit.png`, prompt nguyên văn và chế độ công cụ ở `equipment-prompt.txt`. Ảnh thực 1774×887; `equipment-layout.json` ghi ranh ô thực, không giả định ảnh đúng cỡ yêu cầu. Tám cột tương ứng tám hướng; bốn hàng là giáp ngực, áo da, ủng/giáp ống chân và mảng chân lưới.

`equipment.ts` cắt 32 món nguồn, chuẩn hóa alpha, đưa giáp ngực vào cổ/thân từng pose và mảng chân theo mask từng chân. Giữ tay áo, áo choàng/tà áo từ lớp gốc. Đây là lớp phủ theo pose mannequin, chưa có rig biến dạng giáp hoặc tay áo mới hoàn toàn.

- `clothing/kit/`: 32 mảnh nguồn đã cắt.
- `clothing/parts/`: 64 pose × (nền + 10 item) = **704 PNG** riêng.
- `weapons/hands/`: **128 PNG** tay che điểm nắm, hai vũ khí × 64 pose.
- `clothing/equipment-directions-2x.png`: bốn phối mẫu × tám hướng.
- `clothing/equipment-actions-2x.png`: bốn phối mẫu × tám pose nguồn hướng Nam.
- `equipment-2x.png`: các state và hai vũ khí; ảnh phóng nearest-neighbor để duyệt pixel.

Atlas tổng **1.792 cells / bảy trang 1792×1792**: 960 cell tương thích, 704 lớp đồ, 128 tay che chuôi. Giữ ô112, PPU48, root (56,100), Point, alpha cứng, không mipmap hoặc nén. Catalog lưu SHA256 cả nguồn nhân vật và nguồn giáp.

## Sửa tay cầm

Mỗi frame có hai `weaponGrips`, `weaponOrders`, và `handPrefix`. Kiếm neo ở chuôi nguồn (5,29), trượng ở phần quấn tay (5,37). Bỏ ô xóa alpha tại grip; vũ khí giữ chuôi liền mạch, lớp ngón tay phủ lên thay vì đục lỗ. Neo trượng khi charge/release dùng cùng phía tay, tránh nhảy qua thân lúc phóng phép. Góc kiếm thay theo anticipation/strike, trượng nghiêng nhẹ theo nhịp niệm. Các lớp dùng đồng hồ CharacterView hiện có.

Runtime thêm SpriteRenderer `weapon-hand` trước weapon, cùng lớp tay/da và dưới đầu. Ba renderer áo/quần/ủng độc lập. Thứ tự từ sau: weapon sau -1, ủng0, quần1, áo2, weapon trước3, tay/da và tay che4, đầu5. Hiệu ứng màu trúng đòn đồng bộ mọi lớp. Khi tắt nhân vật mới, tháo lớp phụ và khôi phục nhân vật gốc.

## Kiểm

```powershell
npm run test:warden -w @aether/asset-pipeline
npm test
npm run typecheck
./scripts/kiem-mannequin.ps1
```

Kiểm dữ liệu 192 playback frame, 384 tổ hợp weapon, **6.912 phối đồ**, đủ tám hướng; bộ gốc tái ghép đúng byte, không mất alpha khi thay đồ, giáp bạc/ủng thép mở rộng silhouette. Mọi điểm cầm chạm body, chuôi và tay che đều có alpha, charge/release trượng không chuyển qua tay khác. Không coi kiểm alpha là duyệt giải phẫu bàn tay.

AutoTest Windows gọi handler nút tám hướng và nút từng món khi đang đi; kiểm **36 × 2 × 8 × 8 = 4.608 khung action** dùng đúng sprite từng slot và tay che chuôi. Combat cơ bản dùng nút thật đi qua callback release/damage/projectile gốc, chặn đổi đồ/hướng/vũ khí trong action, rồi khôi phục nhân vật gốc. Không mô phỏng chuột vật lý.

Kết quả thực tế lượt này:

- `test:warden`, `npm test`, `npm run typecheck`, Roslyn Client/Editor: **PASS**. Suite fixture map vẫn có cảnh báo props cũ thiếu; không thất bại.
- Unity Windows IL2CPP: **Succeeded; errors=0**, exit0, `.aether-stage/mannequin/armor-build.log`.
- Windows AutoTest: exit0, đủ **4.608 khung action** kiểm layer; sword hit1 tại releaseAt3/22 ≈0.136s, staff có projectile rồi hit1 tại3/20 =0.150s. Không có Exception/FAIL trong player log.
- **339 PNG** và `autotest.log` ở `.aether-stage/mannequin/armor-runtime/`; player log `.aether-stage/mannequin/armor-player.log`.
- Đã xem contact sheet tám hướng/phối mẫu và ảnh runtime `lab-direction-NE`, `clothing-34-0-S-strike` (giáp bạc + chân lưới + ủng thép), `clothing-35-1-E-strike` (áo da + chân lưới + ủng thép). UI hướng và item đọc được, các lớp hiện trong game. Chưa duyệt mọi khung bằng mắt hoặc kiểm Android.

Exe demo cập nhật tại `.aether-stage/mannequin/build/Aether.exe`. Chỉ build cục bộ; chưa publish.

## Giới hạn còn lại

Attack/cast vẫn có hai pose thân chính và các khung giữ, thêm biến thiên góc weapon; chưa phải tám pose thân vẽ mới mỗi đòn. Chưa duyệt toàn bộ neo/che khuất bằng tay, `reviewed` vẫn false. Chưa có hit/death riêng, cởi trống, slot tóc/găng/áo choàng riêng, inventory/chỉ số hoặc lưu server. Các món này đang phục vụ demo offline. Không phát hành bản game lên máy chủ thật.

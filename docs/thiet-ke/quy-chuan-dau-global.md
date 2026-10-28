# Chuẩn đầu dùng chung — 27/10/2026

Chỉ thị chủ dự án: mọi đầu phải cùng chuẩn kích thước, đưa thành biến global. Chuẩn này thay cách dùng ảnh80px cộng offset riêng từng đầu. Một ô ảnh bằng nhau chưa đủ: khối mặt bên trong cũng phải bằng nhau.

Nguồn duy nhất: `packages/asset-pipeline/sources/player-rig-v3/head-standard.json`. Pipeline đọc thành `HEAD_STANDARD`; xuất nguyên cấu hình vào `PlayerRigV3/catalog.json`. Unity và trang kiểm đọc catalog này, không đặt kích thước/neo riêng theo tộc, giới tính, tóc hoặc trang phục.

| Mốc | Giá trị pixel native |
|---|---:|
| Canvas avatar |96×96|
| Rộng má giải phẫu dưới mắt |20; sai số raster tối đa1px|
| Trục cằm |x48|
| Điểm cằm |(48,65)|
| Neo cổ / pivot của sprite |(48,66)|
| Hàng cuối được chứa cổ da |67; tối đa2px dưới cằm|
| Điểm nối trên thân |(144,154)|
| Root thân / canvas thân |(144,256) /288×288|
| PPU / scale đầu trong game |96 /1|

Canvas96 có thêm vùng trong suốt để chứa tóc/tai/sừng, không đồng nghĩa phóng đầu. Kích thước được đo trên **mặt và xương hàm**, tuyệt đối không lấy bounds tóc/tai/sừng làm thước. Tóc và đặc điểm tộc được khác hình dáng/độ dài, khối đầu phải cùng cỡ. Đầu không dính áo, cổ áo thuộc thân. Giữ lệnh **cấm ghép đè hai đầu** trong `cam-ghep-de-hai-dau.md`.

## Chuẩn hóa nguồn hiện có

Các mốc mặt/cằm nguồn của30 đầu được ghi rõ tại `head-landmarks.json`. Chỉ thay đổi mật độ nguồn bằng **một scale đều hai trục cho toàn bộ8 hướng của cùng mẫu**, lấy trực tiếp ảnh nguồn lớn; không phóng lại ảnh80px, không kéo méo mặt, không dùng blur/sharpen. Neo được bake trong PNG. Các mốc nguồn là dữ liệu nhập ảnh, không phải offset hoặc scale runtime. Không suy ra mặt từ khoảng trắng mắt một cách tự động nữa: bộ dò cũ đã lẫn tóc bạc và đo lệch Long tộc nữ2.

Sau xuất, toàn bộ đầu dùng cùng pivot. Runtime không có `head.dx`, `head.dy` hay `head.scale`. Khi bước/chém, chỉ điểm nối của **thân theo pose** di chuyển; đổi avatar trên cùng pose không làm thay đổi vị trí/kích thước. Tay/kiếm/cổ áo của thân sạch che avatar theo alpha nguồn, không khôi phục pixel đầu cũ.

## Chặn lỗi trước build

- Test đo lại **pixel khối má thực tế**, yêu cầu19–21px và lệch trục không quá1px cho đủ30 đầu chính diện.
- Xuất đủ240 hình dùng cùng scale theo mỗi mẫu; không cắt tóc vào mép trên/hai bên. Hướng khác S mới chuyển mật độ theo thước; neo cổ hướng cũ chưa được nghiệm thu trên thân đủ8 hướng.
- Build từ chối catalog thiếu chuẩn global hoặc có kích thước/offset/scale đầu riêng.
- Kiểm trong Unity30 đầu ×8 pose chém: cùng kích thước sprite, pivot, PPU và vị trí đầu của cùng thân/pose; scale luôn1. Rà thêm ảnh đứng/bước/giơ kiếm đủ30 đầu và thân khi tắt avatar.

Đợt này sửa đồng bộ kích thước/neo bằng nguồn đã có, **chưa phải lượt vẽ lại nâng chi tiết**. Mẫu thân thử vẫn chỉ hướng S trong phòng Thử chiêu; không tự coi240 hình chuẩn hóa là đủ chuyển động8 hướng hoặc nghiệm thu mỹ thuật.

Lệnh:

```powershell
npx tsx packages/asset-pipeline/src/weaponProof/rigV3HeadlessExport.ts
npx tsx packages/asset-pipeline/tests/head-standard.test.ts
npx tsx packages/asset-pipeline/tests/rig-v3-headless.test.ts
npx tsx packages/asset-pipeline/src/weaponProof/rigV3AllHeadsReview.ts
npx tsx packages/asset-pipeline/src/weaponProof/rigV3CleanAudit.ts
npx tsx packages/asset-pipeline/src/weaponProof/rigV3CleanPublish.ts
```

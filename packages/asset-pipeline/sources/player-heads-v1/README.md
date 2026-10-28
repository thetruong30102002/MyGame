# 30 nguyên đầu —5 tộc,3 nam+3 nữ/tộc, đủ8 hướng

Nhân tộc, Elf, Ma tộc, Thú nhân và **Long tộc**. Thú nhân chỉ hai tai thú, không đuôi; nguồn nam1 có lượt sửa giấu tai người, bản lỗi giữ ở `source-extra-ears-r1.png` để đối chiếu. Long tộc hình người với sừng nhỏ/vảy thái dương.

Mỗi đầu là một asset mặt+tóc+tai/sừng+cổ da, không áo/cổ áo; có S/SW/W/NW/N/NE/E/SE thật. Dùng chung thân thon nam/nữ và bộ class kín da. Hai đầu nam Nhân tộc chính diện đã chốt được giữ nguyên pixel, chỉ thêm khoảng trống.

## Nguồn và prompt

- `heads/<id>/source.png`:30 ảnh nguồn, mỗi ảnh một đầu ở8 hướng, tạo bằng **built-in ImageGen**, không dùng CLI/API.
- `heads/<id>/generation.json`: prompt thực, ảnh tham chiếu, hash nguồn và kích thước. File `prompt.json` là brief ban đầu; `generation.json` ghi đúng prompt/reference của lượt đã dùng, gồm lượt sửa tai.
- `catalog.json`:30 ID, giới tính/kiểu tóc/tộc và hợp đồng xuất; `eye-overrides.json` lưu các mốc mắt rà tay khi tóc bạc làm bộ dò nhận nhầm.

## Gói ảnh xuất

`D:/truong/MyGame/assets/characters/player-heads-v1/`:240 PNG hướng,30 sheet8 hướng, registration từng đầu, atlas PNG+JSON, catalog và ảnh tổng đủ30.

Ảnh đầu **80×80** có thêm khoảng trống cho tai/sừng/búi tóc. Thước64px ban đầu nằm nguyên ở offset(8,8), neo cổ mới(40,62), gốc ghép vào thân(104,92), PPU96. Đây là thêm padding, không phóng người/đầu. Mốc ghép cổ trong thân vẫn(144,154), root chân(144,256).

Một scale đăng ký từ bề ngang má tại S dùng chung cả8 hướng; chỉ tra vị trí cổ theo từng hướng, không fit/phóng từng ảnh. Đầu S cũ giữ nguyên. Alpha cứng, lọc point, atlas có2px padding và pivot cổ(.5,.225). Atlas đứng riêng, không sửa manifest game đang chạy.

## Chạy lại và kiểm

```powershell
npx tsx packages/asset-pipeline/src/weaponProof/heads30Export.ts
npx tsx packages/asset-pipeline/src/weaponProof/heads30Preview.ts
npx tsx packages/asset-pipeline/tests/heads30.test.ts
npx tsx packages/asset-pipeline/src/weaponProof/heads30Pack.ts
```

[Trang chọn đầu/xoay8 hướng](https://admin.tail024813.ts.net/game/site/media/weapon-proof-v2/heads30-v1/index.html). Bản ghép thân trên trang chỉ là chính diện S; thân mới chưa đủ8 hướng. Có thể xem toàn bộ8 hướng đầu độc lập.

Đã kiểm đủ30×8,3 nam/3 nữ từng tộc, nguồn/prompt, alpha/neo cổ, scale chung8 hướng, không hướng trùng ảnh, hai mẫu S gốc không đổi pixel và atlas khớp240 hình. Kiểm kỹ thuật không tự chứng nhận mọi chi tiết mỹ thuật đã được chủ dự án duyệt.

**Phạm vi:**8 hướng đầu trung tính, chưa phải toàn bộ pose đầu theo nhát chém/cúi/ngẩng/chuyển động tóc. Chưa thay roster hoặc phát hành client mới; không reset dữ liệu người chơi. Việc thân, tay cầm và15 frame chém tiếp tục ở bộ kiếm sĩ.

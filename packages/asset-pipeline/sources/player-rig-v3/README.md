# Hai thân nam/nữ · nguồn không đầu thật

**Cấm ghép đè hai đầu.** Quy tắc bắt buộc: [cam-ghep-de-hai-dau.md](../../../../docs/thiet-ke/cam-ghep-de-hai-dau.md).

## Nguồn hiện hành

- Chỉ `body-{male,female}/headless-*-source.png` được vào runtime.12 nguồn: mỗi giới master,4 pose bước nguồn,15 pose chém và ô đứng đối chiếu.
- Sinh bằng **built-in ImageGen**, prompt tại `headless-prompts.json`; lượt hồi thế nữ sửa lại tại `body-female/recovery-fix-prompt.json`. Nguồn có đầu chỉ là hình đối chiếu cho công cụ trích xuất/vẽ thân sạch; không vào lớp thân runtime.
- Bản nữ hồi thế chép nhầm pose nâng kiếm bị loại, lưu `headless-attack-3-wrong-poses-rejected.png`. Bản mới toàn bộ kiếm thấp và hồi thế.
- Các nguồn có đầu `keyposes-source.png`, bộ mask cũ và `rigV3Motion-rejected.txt` đã bị loại khỏi luồng xuất runtime. Không sửa lại kiểu đặt avatar mới lên frame còn đầu cũ.

## Ghép và thước

Runtime vẽ **một avatar → thân không đầu thật ở phía trước**. Thân sạch giữ trọn tay, ngón, kiếm, cổ áo; không cần cắt tay bằng màu da. Có chế độ tắt avatar, phải nhìn thấy vùng đầu trống hoàn toàn.

Chuẩn đầu GLOBAL: `head-standard.json` → `HEAD_STANDARD` → catalog Unity/trang kiểm. Avatar96×96, khối má20±1px, cằm(48,65), neo cổ(48,66), PPU96/scale1; thân288×288, root(144,256). Đầu từ nguồn lớn được chuẩn hóa một lần theo mốc má/cằm trong `head-landmarks.json`, cùng scale cho8 hướng/mẫu. Runtime bỏ hoàn toàn offset/scale từng đầu. Tóc/tai/sừng được khác kiểu nhưng không làm thước kích thước mặt. Chi tiết tại [quy-chuan-dau-global.md](../../../../docs/thiet-ke/quy-chuan-dau-global.md).

Mỗi nguồn dùng một hệ số mật độ cố định, không fit riêng pose, đầu, kiếm hoặc bounds vũ khí. Hai tấm hồi thế bị generator phóng cả tấm: dùng **ô4 đứng cùng tư thế** để đổi mật độ toàn tấm về đoạn cổ–đế102px; hệ số áp cho mọi ô cùng tấm, lưu `sourceDensityCalibration` trong catalog. Đây là hiệu chuẩn ảnh nguồn; transform và PPU runtime luôn cố định. Không dùng cách này chữa một frame sai giải phẫu.

Chu kỳ bước:4 pose vẽ nguồn +4 pose lật **riêng chân**, giữ tay/kiếm đúng bên. Chuỗi chém15 pose có nhịp lấy lực chậm, pha bổ nhanh, hồi thế; đảo thứ tự hai pose nâng kiếm theo chiều cao tay để không giơ–hạ–giơ. **Mới hướng S**, chưa đủ8 hướng thân. Kiếm cơ bản vẫn liền thân trong đợt thử, chưa là vũ khí thay thế.

## Lệnh xuất / kiểm / web

```powershell
npx tsx packages/asset-pipeline/src/weaponProof/rigV3HeadlessExport.ts
npx tsx packages/asset-pipeline/src/weaponProof/rigV3CleanAudit.ts
npx tsx packages/asset-pipeline/tests/rig-v3-headless.test.ts
npx tsx packages/asset-pipeline/src/weaponProof/rigV3CleanPublish.ts
```

`rigV3Motion.ts` giờ chỉ trỏ vào exporter thân sạch. Thiếu nguồn thân sạch thì dừng, không fallback sang nguồn có đầu. Unity `PlayerRigV3.Load` và `PlayerRigV3Import.ValidateForBuild` từ chối catalog mask cũ.

Trang xem dùng đúng catalog/atlas Unity: https://admin.tail024813.ts.net/game/site/media/weapon-proof-v2/rig-v3/index.html . Có bảng thân tắt avatar bên cạnh bản ghép.

Trong Unity: màn đăng nhập → **Thử chiêu** → bảng **Nhân vật ghép · Nam/Nữ** → bật mẫu cổ ngắn. Chọn thân/đầu, bước/chém và nút tắt avatar để kiểm thân sạch. Mẫu S trong phòng thử, không thay roster tạo nhân vật hoặc dữ liệu người chơi.

Kiểm build tự động: `Aether.exe -aetherShot <thư mục> -aetherPlayerRigV3`. Kiểm30 đầu, hai thân,15 chém/8 bước, thứ tự lớp, PPU/point/mipmap, tắt avatar, di chuyển trong map và khôi phục người gốc. Kiểm kỹ thuật không thay nghiệm thu mỹ thuật.

# Kiếm sĩ3 cấp — đầu/thân/kiếm riêng, không cởi đồ

Chốt mới nhất27/10: ưu tiên kiếm sĩ.3 bộ/3 kiếm: tặng khi chọn class, yêu cầu lv5, yêu cầu lv10. Có hai dáng nam/nữ; nữ nhỏ nhắn hơn nhưng cùng chuẩn đầu/neo cổ. Mỗi bộ32 pose ×8 hướng =256;6 thân =1536 pose. Đứng1, đi8, chạy8 riêng, bổ kiếm15. Nguồn5 hướng S/SW/W/NW/N, đối hướng được lật quanh root chung và ghi `mirroredFrom`.

**Bỏ hoàn toàn nhánh cởi đồ/đồ lót** theo chỉ thị mới. Thư mục `underwear/` là thử nghiệm ĐÃ HỦY, có REJECTED.json, tuyệt đối không vào catalog/runtime. Nguồn có kiếm liền chỉ làm đối chiếu, không dùng làm thân. Tất cả nguồn `*-body.png` không đầu, không vũ khí thật; tay nắm một chuôi tưởng tượng, toàn thân sau kiếm phải đầy đủ. Cấm đè đầu mới lên phần đầu cũ theo quy chuẩn dự án.

## Thiết kế

- Tân thủ: áo vải xanh, giáp nhẹ/đai da giản dị.
- Lv5: áo da quấn chéo bất đối xứng, dây đeo chéo ngực, một giáp vai, vạt áo lệch và ủng gia cố.
- Lv10: giáp ngực bạc ghép mảnh, giáp tay/chân, tabard lam và áo choàng lưng xám ngắn.
- Kiếm1 thẳng giản dị; kiếm2 cong nhẹ/hộ thủ bảo vệ tay; kiếm3 lưỡi lá/rãnh lam/hộ thủ cánh nhỏ.3 kiểu cấu trúc khác nhau, không chỉ đổi màu. Chuôi có cùng điểm nắm.

Mẫu đổi màu lv5/lv10 `turnaround.png` v1 bị LOẠI, exporter chỉ nhận `turnaround-v2.png` ở hai cấp này. `sword-starter/turnaround.png` giữ mẫu cơ bản. Hai cấp nâng dựa trên đúng motion sheet tân thủ cộng tham chiếu thiết kế mới, giữ pose/anatomy thay đồ.

## Nguồn, công cụ và prompt

Dùng **built-in ImageGen**, không CLI/API fallback. Prompt chính xác trong `prompts/jobs.json`, `three-tier-turnarounds.json`, `three-tiers-structural-redesign.json`, `motion-jobs.json`; mỗi nguồn chuyển động sinh sau có receipt ở `prompts/receipts/` (prompt, tham chiếu, file gốc, thời điểm). Giữ PNG nguồn trong dự án. `tiers.json` lưu3 cấp và thiết kế, hai bậc sau CHƯA tự đặt nguồn nhận/giá.

## Xuất và ghép

`HEAD_STANDARD` dùng trực tiếp từ `player-rig-v3/head-standard.json`, không có offset/scale avatar riêng. Thân chỉ dùng một scale mật độ cho toàn tấm theo pose đứng chuẩn; từng pose được **dịch** để neo chân, không fit/co/phóng người. Điểm cổ và nắm tay theo pose, không theo đầu. Source hash được lưu.

Kiếm được xuất thành3 ảnh riêng tại `weapons/`, cùng pivot chuôi. Mỗi pose render kiếm thành lớp riêng theo điểm nắm/trục/phối cảnh; ngón tay lấy từ nguồn thân không vũ khí che lên chuôi. Đổi kiếm không thay thân/đầu/clock. Hướng nhìn quyết định lớp đầu/tay/kiếm trước/sau. Alpha cứng, point, no mipmap/compression, PPU96.

Tối ưu vòng duyệt theo bounds chỉ giảm lượng pixel tính; không được dùng bounds để fit kích thước nhân vật.

```powershell
npx tsx packages/asset-pipeline/src/weaponProof/rigV4Prepare.ts
npx tsx packages/asset-pipeline/src/weaponProof/rigV4Export.ts --masters-only
npx tsx packages/asset-pipeline/src/weaponProof/rigV4Export.ts --review-only
npx tsx packages/asset-pipeline/src/weaponProof/rigV4Export.ts
npx tsx packages/asset-pipeline/tests/rig-v4.test.ts
npx tsx packages/sim/tests/starter-sword.test.ts
dotnet build UnityGame/Tests~/EditorCompile -v:q
```

Xuất runtime dừng nếu thiếu3×2×8×32 pose; ảnh rà riêng có thể xuất trước, không công bố là đủ animation. Resources mới `PlayerModularV4/`; V3 đã duyệt giữ nguyên. Chưa nghiệm thu chỉ vì test kỹ thuật pass. Rà native/nền map thật, nguồn thân khi ẩn đầu/kiếm, điểm nắm, hai chiều, đi/chạy/chém.

Trong game thử: **Thử chiêu →3 bộ ·8 hướng**. Chọn nam/nữ, đầu, bộ/kiếm độc lập; WASD đi, Shift chạy, nút bổ và đổi hướng. Không có nút cởi đồ. Mốc cấp1/5/10 được kiểm, phòng Thử chiêu cấp60 xem được đủ3 bậc.

Runtime QA: `Aether.exe -aetherShot <folder> -aetherSwordWardrobeV4`. Kiểm1536 pose,4608 lần đổi kiếm giữ thân/đầu,30 đầu8 hướng, mốc cấp và lớp renderer, tắt riêng đầu/kiếm, hồi thế và phục hồi người gốc.

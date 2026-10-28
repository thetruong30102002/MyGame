# Hai kiếm thay thế cho bộ thử HD V6

27/10/2026: thêm **Lam Ngọc** (bạc, rãnh xanh, lưỡi thanh) và **Hắc Diệm** (thép đen, khảm đỏ/đồng, lưỡi rộng). Tổng ba lựa chọn kể cả kiếm thép gốc. Đây là mẫu thử hình, không thêm nguyên tố/chỉ số/đồ vào bản lưu.

Ảnh nguồn sinh bằng **built-in image_gen**: `lam-ngoc-source.png`, `hac-diem-source.png`; prompt đầy đủ trong `prompts.json`. `registration.json` lưu hash nguồn, chuẩn native và cách chiếu theo từng frame. Ảnh canonical `*-native.png`: 64×128, điểm nắm(32,92), gốc lưỡi(32,82), tip(32,10), PPU96, nearest/alpha>=235. Hai ảnh nguồn dùng cùng mật độ lưỡi72px; không phóng cơ thể để vừa kiếm.

`eightVariants.ts` sinh 192 bộ lớp mới (hai kiếm ×96 pose). Chỉ chiếu vũ khí theo điểm nắm/trục và lớp che: toàn cán sau tay, lưỡi trước, ngón tay trên cùng; các đoạn sau lưng/đầu dùng silhouette thân để che. Thân/tóc/tay là cùng ảnh của từng pose cho mọi kiếm. Cạnh cứng, không blend ảnh hoặc làm nhòe. Phép chiếu có foreshortening theo pose; giới hạn chiều dài vật lý của hai kiếm mới đồng nhất.

Khi thử thay đã phát hiện lỗi dò điểm nắm cũ ở E7/8/9, SE8/9 và đoạn kiếm khuất sau đầu SW2/W2. `../grip-overrides.json` lưu vùng dò/điểm nắm/lý do, `eightAnalyze.ts` và `eightSplit.ts` đọc để sửa lớp tách từ nguồn. Không dùng màu giáp/viền áo làm điểm cầm. Frame gốc vẫn giữ nguyên; ghép lại kiếm thép trùng nguồn96/96, không giữ thêm lưỡi cũ trong lớp thân.

Thứ tự dựng từ gốc repo:

```powershell
npx tsx packages/asset-pipeline/src/weaponProof/eightAnalyze.ts
npx tsx packages/asset-pipeline/src/weaponProof/eightSplit.ts
npx tsx packages/asset-pipeline/src/weaponProof/eightVariants.ts
npx tsx packages/asset-pipeline/src/weaponProof/eightUnity.ts
npx tsx --test packages/asset-pipeline/tests/weapon-eight.test.ts packages/asset-pipeline/tests/weapon-eight-unity.test.ts packages/asset-pipeline/tests/weapon-eight-variants.test.ts
npx tsx packages/asset-pipeline/src/weaponProof/eightPreview.ts
```

Trong Unity: phòng Thử chiêu → **Thử mẫu kiếm HD** → chọn **Thép / Lam Ngọc / Hắc Diệm**. Có thể đổi giữa đòn mà không đổi thân/tay, hướng hoặc reset frame. Kiếm đang giấu vẫn giấu sau khi chọn mẫu khác. Body/hands dùng chung cùng sprite và offset trong atlas; chỉ lớp vũ khí đổi theo mẫu. Vẫn là chế độ thử tại chỗ, chưa dùng trong phần chơi chính hoặc mở 30 model.

QA: `weapon-eight-variants.test.ts`, `weapon-eight-unity.test.ts` và AutoTest `-aetherSwordTrial`; ảnh thực tế trong `.aether-stage/attack-eight-v6/variants-unity-qa/`. Xem web: https://admin.tail024813.ts.net/game/site/media/weapon-proof-v2/attack-eight-v6/index.html . Mỹ thuật mới chưa được tự đánh dấu chủ dự án đã duyệt.

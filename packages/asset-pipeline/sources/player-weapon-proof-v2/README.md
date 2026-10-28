# V2 — ghép vũ khí bám sát bản vẽ liền

> **Gỡ R4 khỏi trang chính:** chủ dự án xác nhận bản này sai chuẩn; không xuất lại như một mẫu có thể dùng. `preview.ts --matched` giờ chỉ xuất tám ảnh đứng gốc trong `approved-v2-reference.json`, kiểm hash cả 56 lớp/ảnh trước khi chép lên web. Phần đi/chém mới bị tắt trên trang vì chưa có bản đạt. `publication.ts` chặn lẫn bản nháp hoặc file ảnh đã đổi. Bộ R4 còn ở nguồn/lưu lịch sử để biết lý do loại; không tự đưa lại lên trang chính chỉ vì kiểm ghép pixel qua. Trang đối chiếu này không đồng nghĩa bộ nhân vật mới được duyệt hoặc đã vào Unity.

> **Trạng thái mới 26/10:** cách ghép V2 được giữ làm chuẩn kỹ thuật, nhưng bản chém R3, bộ R4 và HD nháp chưa đạt nét vẽ theo chủ dự án. Trước mỗi lượt vẽ phải đọc [quy chuẩn nét vẽ](../../../../docs/thiet-ke/quy-chuan-net-ve-nhan-vat.md), `style-standard-v1/standard.json` và dùng đúng ảnh roster gốc có hash. [Xem chuẩn kèm ảnh trên web](https://admin.tail024813.ts.net/game/site/media/weapon-proof-v2/style-standard.html). R4 chỉ là mẫu thử 24 frame hướng S, không phải bộ đã nghiệm thu; những số 28 frame dưới đây là lịch sử mẫu V2 ban đầu.

Mẫu HD tiếp theo dùng thước mật độ 2× (288×288, root144/256, thân150px, PPU96), cần chi tiết vẽ thật; bản phóng nearest chỉ là thước. Thử tối đa 4 pose trước khi nhân rộng, giữ một tỷ lệ cho đứng/đi/chém. Hai tay giơ cao phải giữ trục kiếm dựng thẳng lên. Tóc và cơ thể vẫn liền; kiếm riêng với điểm nắm/góc/lớp ngón tay từng frame. Xem `family-hd-r5/prompts.json` để biết các ảnh nháp đã sinh nhưng chưa được chấp nhận.

Xuất trang quy chuẩn: `npx tsx packages/asset-pipeline/src/weaponProof/styleStandard.ts` (cũng chạy khi dựng preview). Script kiểm hash ảnh master để tránh đổi chuẩn âm thầm.

## Lịch sử mẫu V2 ban đầu

Sửa theo góp ý 26/10/2026: V1 chưa đạt độ tự nhiên, chuôi phải ở phía sau phần tay nắm, lưỡi đi ra phía trước theo hướng của bản liền. **Chỉ tách vũ khí, tóc/đầu/thân/trang phục vẫn là một frame hoàn chỉnh.**

## Nguồn và thay đổi

- Dùng **nguyên pixel native** từ atlas `assets/characters/player_verdant_sword/`: đứng tám hướng, đi E tám frame, bổ S 12 frame, tổng 28 frame. Không dùng lại cơ thể được sinh mới của mẫu V1; không scale, mirror hoặc nội suy thêm thân/tóc.
- Lấy trục lưỡi/chuôi và hình bàn tay theo từng frame vẽ liền. Bộ dò màu/PCA chỉ là gợi ý, không là chứng nhận giải phẫu; trường hợp kiếm bị che sau đầu có khai riêng, không bịa một lưỡi dựng lên phía trước.
- Bỏ cách lấy mặt nạ tay từ một dải xoay theo góc kiếm. Lớp ngón/palm lấy từ pixel gốc, chuôi đầy đủ đi dưới nắm tay. Khi đi E, lưỡi giữ đúng hướng ra trước và nhịp cổ tay của frame gốc.
- `inpaint/*.png` do imagegen tô bù nguồn. **Chỉ nhận pixel bù trong mask của vũ khí cũ**, gần cơ thể; giữ byte gốc ngoài mask, không thay tóc hoặc mặt bằng cả bản sinh mới. Prompt ở `prompts.json`, ảnh đầu vào ở `reference-sheets/`.
- Mẫu thép: tách kiếm gốc rồi ghép lại, làm đối chứng độ liền mạch. Mẫu sắt: thay phần lưỡi từ asset đã render của V1, **dùng chung chuẩn chuôi/hộ thủ** ở mẫu đầu. Cả vũ khí, kể cả chuôi nằm dưới ngón, đều thuộc lớp riêng; không gắn chuôi vào thân nhân vật.

## Dựng và xem

```powershell
npx tsx packages/asset-pipeline/src/weaponProof/reference.ts
npx tsx packages/asset-pipeline/src/weaponProof/analyze.ts
npx tsx packages/asset-pipeline/src/weaponProof/matched.ts
npx tsx packages/asset-pipeline/tests/weapon-matched.test.ts
npx tsx packages/asset-pipeline/src/weaponProof/preview.ts --matched
```

[Trang đối chiếu V2](https://admin.tail024813.ts.net/game/site/media/weapon-proof-v2/index.html): bên trái là bản vẽ liền không chỉnh sửa, bên phải là lưỡi kiếm sắt ghép vào thân/chuôi chuẩn. Có thể xem thêm bản kiếm gốc tách/ghép, bật/tắt thân/vũ khí/lớp tay, soi điểm nắm, dừng và bước từng frame. Trang này chỉ rà sprite, không là một client game mới.

## Bằng chứng và giới hạn

- 28/28 frame kiếm gốc tách–ghép trùng **toàn bộ RGBA** bản liền; kiểm lại từ ba lớp PNG độc lập.
- 27 frame đổi lưỡi sắt có pixel thay đổi thật; một frame lưỡi bị che nên hai mẫu giống nhau ở phần nhìn thấy.
- Thân/tóc/mặt ngoài mask vũ khí giữ nguyên; lớp tay là pixel gốc. 398 lượt pixel chuôi trong hai mẫu được lớp tay che.
- Báo cáo `.aether-stage/weapon-proof-v2/matched-check.json`, ảnh so nguồn–ghép ở `*-matched-2x.png`, metadata frame và lớp ở `manifest.json`.

Các số trên là kiểm tái ghép/giữ pixel, **không thay thế rà mỹ thuật hoặc kiểm Unity**. Đi/chạy/tấn công các hướng còn lại, hình vũ khí có chuôi khác, tốc độ chuyển động thực tế và tầm che khuất vẫn cần tiếp tục kiểm. `reviewed=false`, `productionEnabled=false`; chưa đổi roster, build client hoặc DB.

Tham khảo cách nắm: [Academy of Historical Fencing](https://swordfight.uk/gripping-the-sword/) và [bản chép Döbringer trên Wiktenauer](https://ftp.wiktenauer.com/wiki/Pseudo-Hans_D%C3%B6bringer). Dùng để rà vị trí tay giữa hộ thủ và đuôi chuôi; góc chiếu/mật độ pixel và tư thế cụ thể lấy theo bản vẽ liền Aether.

## Chốt mẫu V2 và thử kiếm Tử Yên

Chủ dự án xác nhận cách ghép V2 ổn ngày 26/10; `approval.json` ghi phạm vi và hash thân/tay để giữ nguyên bộ đã chốt. Chưa phải nghiệm thu Unity hoặc tất cả hướng.

Theo yêu cầu tiếp, `tu-yen/native-sword.png` lấy pixel kiếm cong/hộ thủ bạc tím từ ảnh S của Tử Yên, loại da/ngón tay người cho. `tu-yen/asset.json` có hash nguồn và trục chuôi. Chiếu lên cùng rig ở tỷ lệ native cố định 1×; lớp cán sau thân, hộ thủ/lưỡi phía trước, rồi ngón tay gốc che cuối. Một frame kiếm sau đầu dùng lớp sau đúng pose. Không vẽ lại thân/tóc.

Chạy thêm sau `matched.ts`:

```powershell
npx tsx packages/asset-pipeline/src/weaponProof/tuYen.ts
npx tsx packages/asset-pipeline/tests/weapon-tu-yen.test.ts
npx tsx packages/asset-pipeline/src/weaponProof/preview.ts --matched
```

Trang V2 mặc định chọn “Kiếm Tử Yên”, có thể đổi về kiếm sắt. 28 bản ghép giữ nguyên hash thân và pixel tay, không cắt mép; chưa duyệt riêng chất lượng mẫu Tử Yên và chưa đưa vào game.

Sửa tiếp theo góp ý: khi chiếu lưỡi sang phải, lật riêng tiết diện lưỡi sau gốc để độ cong hướng lên; không lật hộ thủ, chuôi hoặc bàn tay. Bộ kiểm so dấu độ cong ở đầu lưỡi chặn cong xuống trong các frame chiếu ngang. Khung xem đi E lùi mép phải để không cắt mũi kiếm mới; không đổi canvas/pivot/body của asset.

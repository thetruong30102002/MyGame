# Đầu nét và hai thân nam/nữ — bản thử27/10

Yêu cầu hiện hành: giữ30 thiết kế đầu đã được chủ dự án đồng ý; tăng nét nguồn; sửa đầu bị thụt; hai thân riêng nam/nữ, cùng chuẩn đầu/cổ/root/PPU.5 tộc, mỗi tộc3 nam+3 nữ, đủ8 hướng đầu.

## Nguồn vẽ thật

Tất cả nguồn mới dùng **built-in ImageGen**, không dùng CLI hoặc bộ lọc sharpen. Prompt và nguồn giữ cạnh nhau:

- `heads-clarity/{male,female}-source.png`: lượt đầu nét chính diện, chỉ là ứng viên; mắt/nhân dạng còn lệch nên không thay30 đầu.
- `heads-clarity/{male,female}-eight-source.png`: lượt sau giữ mắt/kiểu tóc nguồn cũ,16 hướng cho hai mẫu; prompt tại `sharp8-generation.json`. Xuất giữ nguyên scale vật lý bản cũ cho cả8 hướng.
- `body-{male,female}/pilot-source-r1.png`: thân không đầu. **Loại pose giơ tay thấp, thiếu khoảng đầu và kiếm chồng hàng**. Chỉ dùng phần đứng làm thước tạm.
- `body-{male,female}/pilot-source-r2.png`:4 tư thế nguồn có đầu để đảm bảo tay nâng trên tóc. Prompt tại `body-tall-prompts.json`; bốn tư thế không được tính là chu kỳ animation hoàn chỉnh.
- `body-{male,female}/{walk,attack}-*-source.png`:12 nguồn/48 ô; mỗi giới có8 tư thế đi và15 tấn công thật, ô cuối là đứng đối chiếu. Mỗi nguồn có `*-generation.json`. **Chưa duyệt:** vài nguồn đổi chiều dài thân/chi tiết đồ, bộ che tay tự động còn lỗi ở attack03/04/07. Không dùng chuỗi xuất thử này làm bộ hiện hành trong game hoặc tăng tiến độ nghiệm thu.

## Neo đầu

`head-fit.json` lưu dịch nguyên pixel S cho30 đầu, hash ảnh nguồn và vị trí cằm. Giữ nguyên mọi pixel/scale đầu đã chốt. Đa số sửa0–3px; Dragonkin nữ2 nâng6px. Đây chỉ là neo S; cần rà trên thân và từng hành động ở7 hướng còn lại.

## Xuất bản thử

```powershell
npx tsx packages/asset-pipeline/src/weaponProof/rigV2Neck.ts
npx tsx packages/asset-pipeline/src/weaponProof/rigV2BodyMasters.ts
npx tsx packages/asset-pipeline/src/weaponProof/rigV2Keyposes.ts
npx tsx packages/asset-pipeline/src/weaponProof/rigV2Sharp8Export.ts
npx tsx packages/asset-pipeline/src/weaponProof/rigV2Publish.ts
npx tsx packages/asset-pipeline/src/weaponProof/rigV2Benchmark.ts
```

Nếu dựng lại `heads30Preview.ts`, chạy `rigV2Publish.ts` SAU nó để thư viện30 đầu giữ hai thân nam/nữ và bản sửa neo.

`rigV2Motion.ts` và `rigV2Detail.ts` chỉ xuất QA cục bộ cho chuỗi chưa đạt, không publish hay import Unity. Các chỉ số hash/alpha/tọa độ không thay thế duyệt mỹ thuật.

[Trang so nét và ghép hai thân](https://admin.tail024813.ts.net/game/site/media/weapon-proof-v2/rig-v2/index.html). Chưa thay player roster, chưa phát hành client, không thay DB.

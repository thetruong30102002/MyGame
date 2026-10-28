# Bộ chém tám hướng V6 — bản rà, chưa nghiệm thu

Ngày 27/10/2026. Sinh ảnh bằng công cụ **built-in image_gen**. Nguồn mỹ thuật là roster trang chủ trong `references.json`, không dùng R3/R4/HD nháp làm master. Tóc, mặt, thân và đồ vẫn vẽ liền; chỉ tách vũ khí.

## Đầu ra

- 8 hướng S/SW/W/NW/N/NE/E/SE, mỗi hướng 12 khung thời gian; 96 PNG native trong `native/`.
- Khung 288×288, root (144,256), PPU96. Cùng một tỷ lệ lấy mẫu; chỉ dịch nguyên pixel theo chân, không co/phóng riêng frame.
- Frame 4 giữ nguyên frame 3 ở đỉnh kiếm. Frame 10/11 dùng lại đúng frame 0 để hồi đứng, không được gọi là 12 tư thế độc lập.
- Kiếm cơ bản thẳng, hai tay nâng thẳng trên đầu rồi bổ xuống. Nguồn riêng của hướng N và khung NW8 đã sửa theo `sheet-selection.json` và `frame-overrides.json`.
- `.aether-stage/attack-eight-v6/`: body, hands, weapon/steel, weapon-back/steel, composite/steel và báo cáo. 96 khung ghép lại trùng toàn bộ kênh RGBA của nguồn; pixel thân ngoài mask kiếm giữ nguyên.
- `pose-candidates.json` là đề xuất điểm nắm/trục; điểm tay bị khuất chỉ ước lượng, chưa được coi là rig đã nghiệm thu. Chưa có biến thể kiếm Tử Yên cho V6.

## Prompt và truy xuất nguồn

`prompts.json`: master mới; `attack-prompts.json`: 24 lượt nguồn bốn pose; `direction-addenda.json`: ràng buộc hướng; `inpaint-prompts.json`: xóa kiếm để bù phần bị che. Nguồn PNG lưu trong `raw/`, body-only trong `inpaint/`. Phần thân từ ảnh inpaint chỉ được đọc trong mask vũ khí, không thay toàn bộ người.

## Dựng lại và kiểm

Từ gốc repo:

```powershell
npx tsx packages/asset-pipeline/src/weaponProof/eight.ts
npx tsx packages/asset-pipeline/src/weaponProof/eightAnalyze.ts
npx tsx packages/asset-pipeline/src/weaponProof/eightSplit.ts
npx tsx --test packages/asset-pipeline/tests/weapon-eight.test.ts packages/asset-pipeline/tests/weapon-publication.test.ts
npm run typecheck -w @aether/asset-pipeline
npx tsx packages/asset-pipeline/src/weaponProof/eightPreview.ts
```

Trang rà riêng: https://admin.tail024813.ts.net/game/site/media/weapon-proof-v2/attack-eight-v6/index.html . Đối chiếu mặc định là ảnh gốc trang chủ phóng nearest 2×; có thể đổi sang đứng mới cùng bộ, vẽ liền, ghép lớp hoặc giấu kiếm. Kết quả kỹ thuật không chứng nhận mỹ thuật. Chưa đưa thành nhân vật chơi chính, chưa tăng % nghiệm thu. Trang chính vẫn giữ tám ảnh đứng gốc đã khóa.

27/10: đã đưa vào phòng Thử chiêu của Unity Windows theo yêu cầu thử dần. Bật nút **Thử mẫu kiếm HD** để đứng/chém tám hướng tại khoảng sân trống; tắt để về nhân vật/vị trí cũ. Mẫu chỉ thử động tác tại chỗ, chưa gây sát thương. Xem `docs/thiet-ke/thu-mau-kiem-hd-trong-unity.md`; exporter `eightUnity.ts`, kiểm atlas `weapon-eight-unity.test.ts`, QA IL2CPP `.aether-stage/attack-eight-v6/unity-qa-r4/autotest.log`. Mẫu mặc định tắt, tóc/thân liền, bốn lớp ghép theo frame; chưa mở roster 30 mẫu còn thiếu chuyển động. Build thử dùng LZ4 nhanh, vẫn giữ nguyên RGBA và lọc point.

Lượt bổ sung cùng ngày: thêm Lam Ngọc và Hắc Diệm, tổng ba kiếm chọn trực tiếp trong phòng thử, kể cả giữa đòn. Nguồn/prompt/chuẩn xem `sword-variants/README.md`. Chạy `eightVariants.ts` sau `eightSplit.ts`, trước `eightUnity.ts`; atlas nay744 sprite/2048×1388, QA288 lượt frame ở `variants-unity-qa/`. Thân/tay vẫn dùng chung; sửa các lỗi dò nhầm điểm nắm theo `grip-overrides.json` để không để lưỡi cũ trong thân khi thay.

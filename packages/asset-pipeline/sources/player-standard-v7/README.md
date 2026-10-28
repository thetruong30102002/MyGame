# V7 — mẫu nguyên đầu để rà, chưa nghiệm thu

## Quy tắc hiện hành — dùng chung đầu và thân kín da

Chốt hiện hành27/10: tạo nhân vật chọn tộc và nguyên đầu; mỗi tộc3 đầu nam+3 đầu nữ, tổng24 bộ đầu cho4 tộc. Tân thủ mặc đồ lót tối giản (nam quần, nữ áo+quần), đi/chạy tới NPC chọn nghề rồi nhận1 trong5 bộ class và5 vũ khí cơ bản tương ứng. Một thân thon chung nam/nữ, đầu mọi tộc dùng chung các bộ; Thú nhân KHÔNG đuôi. Bộ class kín toàn bộ cổ/tay/chân, cổ áo thuộc thân che cổ da nhưng không che cằm. Tháo trang phục về thân nền đồ lót, không chồng hai bộ; thân nền khớp bảng da theo tộc. Bộ đồ chỉ vẽ thao tác class đó. Đổi nghề có phí phải tẩy/hoàn điểm skill, thay bộ skill/passive/thanh chiêu và cặp đồ–vũ khí đồng bộ; loại tiền/phí chưa chốt.


Built-in ImageGen; không dùng API/CLI trả phí. Prompt và ảnh nguồn giữ tại thư mục này, không ghi đè V6.

- `master-source.png`: lượt đầu, không chọn vì mặt/chi tiết nhỏ chưa rõ khi so NPC.
- `master-source-r2.png`: master đồ nền đang rà; `master-refine-prompt.json` lưu prompt.
- `master-selection.json` / `master-registration.json`: phép đăng ký duy nhất cho master288px/PPU96, cao người150px. Không fit từng frame.
- `head-prototype/`: đầu xanh đen gốc, đầu tóc nâu mới, thân giữ nguyên và lớp cổ áo. Prompt sinh đầu mới ở `avatar-chestnut-prompt.json`; phép đăng ký ở `swap-registration.json`.
- Đầu tóc nâu lượt1 không chọn vì mặt rộng hơn chuẩn. Bản đang rà dùng `avatar-chestnut-source-r2.png` / `avatar-chestnut-prompt-r2.json`, đăng ký theo mốc mắt và cắt sạch áo bằng chuẩn cổ. Hai avatar xuất chỉ có đầu/cổ da, cùng mốc mắt/má/cằm/cổ (sai số≤1px); cổ áo giữ trong thân đồ.
- `four-pose-source.png`: nguồn thử bốn pose; **bị loại vì kiếm cao vượt qua ranh giới ô**, khiến idle có pixel kiếm dưới chân. Không xuất nguồn này vào runtime hay coi là bộ chém đạt. `pilot-registration.json` lưu nhận xét.

Chạy lại mẫu đầu:

```powershell
npx tsx packages/asset-pipeline/src/weaponProof/v7Master.ts
npx tsx packages/asset-pipeline/src/weaponProof/v7Head.ts
npx tsx packages/asset-pipeline/src/weaponProof/v7HeadSwap.ts
npx tsx packages/asset-pipeline/tests/weapon-v7-head.test.ts
npx tsx packages/asset-pipeline/src/weaponProof/v7Preview.ts
```

Trang rà riêng: https://admin.tail024813.ts.net/game/site/media/weapon-proof-v2/player-standard-v7/index.html

Đã kiểm ghép lại gốc trùng pixel; đầu mới không thay pixel thân/cổ áo; hai đầu cùng thước/neo cổ. Đây mới là đứng hướng S. Tóc/mặt vẽ liền thành nguyên đầu; chưa có đủ đầu theo hoạt động/tám hướng. Kiếm ở ảnh thân S này chưa tách, dù bộ V6 đã thay kiếm được.

Mới có mẫu đứng, chưa đủ15 chém/tám hướng hoặc phát hành. Chốt hiện hành27/10: tạo nhân vật chọn tộc và nguyên đầu; mỗi tộc3 đầu nam+3 đầu nữ, tổng24 bộ đầu cho4 tộc. Tân thủ mặc đồ lót tối giản (nam quần, nữ áo+quần), đi/chạy tới NPC chọn nghề rồi nhận1 trong5 bộ class và5 vũ khí cơ bản tương ứng. Một thân thon chung nam/nữ, đầu mọi tộc dùng chung các bộ; Thú nhân KHÔNG đuôi. Bộ class kín toàn bộ cổ/tay/chân, cổ áo thuộc thân che cổ da nhưng không che cằm. Tháo trang phục về thân nền đồ lót, không chồng hai bộ; thân nền khớp bảng da theo tộc. Bộ đồ chỉ vẽ thao tác class đó. Đổi nghề có phí phải tẩy/hoàn điểm skill, thay bộ skill/passive/thanh chiêu và cặp đồ–vũ khí đồng bộ; loại tiền/phí chưa chốt.

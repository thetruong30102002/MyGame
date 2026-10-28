# Kiếm sĩ cơ bản — thân thon kín da dùng chung nam/nữ

Chủ dự án chọn thiết kế xanh/giáp sắt hiện có làm bộ kiếm sĩ cơ bản, yêu cầu vẽ thon để ghép cả đầu nam/nữ; bổ sung27/10 phải kín cổ/tay/chân để mọi tộc dùng chung.

- `body-source.png` / `prompt.json`: lượt thon đầu tiên, còn hở cổ; giữ đối chiếu.
- **`body-source-covered-r2.png` / `prompt-covered-r2.json`**: bản kín da mới, tạo bằng built-in ImageGen.
- `body-selection.json`: chọn nguồn mới và đăng ký một lần theo cổ áo/chân. Không fit từng frame hoặc theo đầu.
- `body-S.png`, `collar-front-S.png`: thân đồ và cổ áo trước. Cổ áo che cổ avatar từ y150, không che cằm y149.
- `assembled-navy-S.png`, `assembled-chestnut-S.png`: nguyên hai đầu đã có trên cùng thân đồ mới; đầu không vẽ lại/co giãn.
- `registration.json`: root(144,256), PPU96, pose S đứng. Chưa đủ chuyển động/tám hướng/chém15 frame; kiếm nguồn trong thân S này chưa tách riêng, chưa phát hành Unity.

Mẫu xem: https://admin.tail024813.ts.net/game/site/media/weapon-proof-v2/player-standard-v7/unisex/index.html

Kiểm: `npx tsx packages/asset-pipeline/tests/weapon-v7-unisex.test.ts` (cổ áo kín/không che cằm, đầu nguyên bản, cùng thước/root/PPU, alpha cứng và thân thon hơn). Kiểm kỹ thuật không tự nghiệm thu nét/animation.

Thân nền đồ lót là nhóm thân riêng khi chưa có/tháo bộ đồ, cần màu da theo tộc. Không để thân đồ lót hoặc áo cũ chồng bên dưới bộ class; đầu vẫn chỉ có đầu/cổ da, không dính cổ áo.

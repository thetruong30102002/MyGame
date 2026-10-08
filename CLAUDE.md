# Aether Chronicle — hướng dẫn cho agent

Đọc trước khi làm: **`docs/the-gioi-aether.md`** mục *Bàn giao* (trạng thái, việc kế tiếp, lệnh chạy / kiểm / triển khai, luật dự án),
rồi `README.md`. Kế hoạch từng mảng ở `docs/ke-hoach-*.md` (mỗi file có mục Tiến độ ghi việc đã làm).

- Monorepo: `apps/web` (Next.js + PixiJS, đọc `apps/web/AGENTS.md`), `apps/server` (Node + ws + SQLite), `packages/protocol`,
  `packages/sim` (luật + dữ liệu dùng chung web / máy chủ), `packages/asset-pipeline`.
- Có người chơi thật trên link Tailscale Funnel: thử tính năng ở máy chủ THỬ (:3201, `data/test.db`), không ở máy chủ thật (:3200);
  triển khai theo README mục Funnel, sao lưu `apps/server/data/aether.db` trước khi đổi cách lưu dữ liệu.
- Tiếng Việt cho chú thích, tài liệu, chữ trong game, commit message.

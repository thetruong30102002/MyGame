// Build bản triển khai qua Tailscale Funnel: máy chủ game nằm ở đường dẫn /game cùng origin với trang.
// Biến đặt TRONG Node, không qua shell: Git Bash tự đổi "/game" thành "C:/Program Files/Git/game" (đã dẫm
// 06/10/2026 — trang lên được nhưng mọi lời gọi API báo "không kết nối được máy chủ game").
// Ra thư mục `.next-funnel` (không phải `.next`): build để kiểm tra không còn đè lên bản đang chạy — xem next.config.ts.
import { execSync } from 'node:child_process';

execSync('npx next build', { stdio: 'inherit', env: { ...process.env, NEXT_PUBLIC_SERVER_URL: '/game', AETHER_DIST_DIR: '.next-funnel' } });

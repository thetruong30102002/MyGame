// Build bản triển khai qua Tailscale Funnel: máy chủ game nằm ở đường dẫn /game cùng origin với trang.
// Biến đặt TRONG Node, không qua shell: Git Bash tự đổi "/game" thành "C:/Program Files/Git/game" (đã dẫm
// 06/10/2026 — trang lên được nhưng mọi lời gọi API báo "không kết nối được máy chủ game").
// Ra thư mục build KHÔNG đang chạy (`funnelDir.mjs`): build xong mới đánh dấu là bản mới nhất; bản đang phục vụ chạy tiếp tới khi
// khởi động lại `start:funnel`. Build lỗi thì giữ nguyên bản cũ.
import { execSync } from 'node:child_process';
import { nextDir, setCurrent } from './funnelDir.mjs';

const dir = nextDir();
console.log(`build:funnel → ${dir}`);
execSync('npx next build', { stdio: 'inherit', env: { ...process.env, NEXT_PUBLIC_SERVER_URL: '/game', AETHER_DIST_DIR: dir } });
setCurrent(dir);
console.log(`Xong: bản mới ở ${dir} — khởi động lại start:funnel để phục vụ bản này.`);

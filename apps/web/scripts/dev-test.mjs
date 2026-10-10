// Web dev (cổng 3102) trỏ vào máy chủ THỬ :3201 — thử tính năng online bằng tài khoản rác, không đụng máy chủ thật 3200.
// Kèm máy chủ TÀI NGUYÊN THỬ :3105 (`stage-assets.mjs`): `/assets/...` ưu tiên thư mục nháp `.aether-stage/assets` (atlas, map,
// icon dựng thử) rồi mới tới `public` — bản thật không thấy gì cho tới khi triển khai.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cwd = fileURLToPath(new URL('..', import.meta.url));
const stage = spawn('node scripts/stage-assets.mjs', { cwd, stdio: 'inherit', shell: true });
const child = spawn('npx next dev --port 3102', {
	cwd,
	stdio: 'inherit',
	shell: true,
	env: { ...process.env, NEXT_PUBLIC_SERVER_URL: 'http://localhost:3201', AETHER_DIST_DIR: '.next-devtest', AETHER_STAGE_URL: 'http://127.0.0.1:3105' },
});
child.on('exit', (code) => {
	stage.kill();
	process.exit(code ?? 0);
});

// Web dev (cổng 3102) trỏ vào máy chủ THỬ :3201 — thử tính năng online bằng tài khoản rác, không đụng máy chủ thật 3200.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const child = spawn('npx next dev --port 3102', { cwd: fileURLToPath(new URL('..', import.meta.url)), stdio: 'inherit', shell: true, env: { ...process.env, NEXT_PUBLIC_SERVER_URL: 'http://localhost:3201', AETHER_DIST_DIR: '.next-devtest' } });
child.on('exit', (code) => process.exit(code ?? 0));

// Chạy bản triển khai (đã `build:funnel`) ở cổng 3101 mà Funnel trỏ vào — đọc thư mục của bản build mới nhất (`funnelDir.mjs`).
import { spawn } from 'node:child_process';
import { currentDir } from './funnelDir.mjs';

const dir = currentDir();
console.log(`start:funnel ← ${dir}`);
const child = spawn('npx next start -p 3101', { stdio: 'inherit', shell: true, env: { ...process.env, AETHER_DIST_DIR: dir } });
child.on('exit', (code) => process.exit(code ?? 0));

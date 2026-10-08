// Chạy bản triển khai (đã `build:funnel`) ở cổng 3101 mà Funnel 8443 trỏ vào. Phải cùng `AETHER_DIST_DIR` với lúc build.
import { spawn } from 'node:child_process';

const child = spawn('npx next start -p 3101', { stdio: 'inherit', shell: true, env: { ...process.env, AETHER_DIST_DIR: '.next-funnel' } });
child.on('exit', (code) => process.exit(code ?? 0));

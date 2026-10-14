// Build trang web: CSS (Tailwind + daisyUI + SweetAlert2) → site/app.css, chép thư viện JS → site/vendor/.
// Chạy: npm run build:site -w @aether/server   (tuỳ chọn: node site-src/build.mjs <thư mục site khác> — dùng khi xem thử)
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const site = resolve(process.argv[2] ?? join(here, '../site'));
const require = createRequire(import.meta.url);
const tw = require.resolve('tailwindcss/lib/cli.js');
const env = { ...process.env, AETHER_SITE_DIR: site };
execFileSync(process.execPath, [tw, '-c', join(here, 'tailwind.config.cjs'), '-i', join(here, 'app.css'), '-o', join(site, 'app.css'), '--minify'], { stdio: 'inherit', env });
mkdirSync(join(site, 'vendor'), { recursive: true });
copyFileSync(require.resolve('sweetalert2/dist/sweetalert2.min.js'), join(site, 'vendor/sweetalert2.min.js'));
console.log('✔ build trang web:', site);

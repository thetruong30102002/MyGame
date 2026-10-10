// Máy chủ tĩnh cho TÀI NGUYÊN THỬ (cổng 3105): `/assets/...` đọc thư mục nháp `.aether-stage/assets` trước, thiếu file thì
// lấy `apps/web/public/assets`. Funnel phục vụ thẳng `apps/web/public` cho người chơi thật, nên atlas / map / icon dựng thử
// (`AETHER_WEB_ASSETS=.aether-stage/assets` ở pipeline) ở đây, web thử :3102 trỏ `/assets` vào (xem `next.config.ts`
// AETHER_STAGE_URL) — xem được bản mới mà không đụng bản thật. Triển khai = dựng lại vào public (hoặc chép từ nháp sang).
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));
const STAGE = resolve(process.env.AETHER_STAGE_DIR ?? join(ROOT, '.aether-stage/assets'));
const PUBLIC = resolve(join(ROOT, 'apps/web/public/assets'));
const PORT = Number(process.env.AETHER_STAGE_PORT ?? 3105);

const TYPES = {
	'.png': 'image/png',
	'.webp': 'image/webp',
	'.json': 'application/json; charset=utf-8',
	'.mp3': 'audio/mpeg',
	'.ogg': 'audio/ogg',
	'.wav': 'audio/wav',
	'.css': 'text/css; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.svg': 'image/svg+xml',
	'.txt': 'text/plain; charset=utf-8',
};

/** Đường dẫn file trong `base` cho phần sau `/assets/`, null nếu thoát ra ngoài `base` hoặc không có file. */
function pick(base, rel) {
	const p = normalize(join(base, rel));
	if (p !== base && !p.startsWith(base + sep)) return null;
	return existsSync(p) && statSync(p).isFile() ? p : null;
}

createServer((req, res) => {
	const url = new URL(req.url ?? '/', 'http://x');
	const m = /^\/assets\/(.+)$/.exec(decodeURIComponent(url.pathname));
	const file = m ? (pick(STAGE, m[1]) ?? pick(PUBLIC, m[1])) : null;
	if (!file) {
		res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
		res.end('không có');
		return;
	}
	// Không cache: dựng lại atlas nháp là tải lại trang thấy ngay.
	res.writeHead(200, { 'Content-Type': TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
	createReadStream(file).pipe(res);
}).listen(PORT, '127.0.0.1', () => console.log(`tài nguyên thử: http://127.0.0.1:${PORT}/assets/ ← ${STAGE} (thiếu thì ${PUBLIC})`));

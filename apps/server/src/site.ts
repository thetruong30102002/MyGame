// Trang chủ game (chủ dự án 13/10/2026: "thêm 1 landing page trang chủ game, tin tức cập nhật, tải các bản game — tham khảo trang Ngọc
// Rồng Online"): trang TĨNH ở `apps/server/site/` do chính máy chủ game phát — qua Funnel là https://<máy>/game/.
//   GET /  (hoặc /index.html)   → site/index.html
//   GET /site/<đường dẫn>       → file trong site/ (ảnh, news.json…)
// Tin tức sửa ở `site/news.json` (mới nhất trước), không cần khởi động lại máy chủ. Nút tải dùng /api/client/latest/… (clientUpdate.ts).
import { createReadStream, existsSync, statSync } from 'node:fs';
import type { ServerResponse } from 'node:http';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const SITE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'site');

const TYPES: Record<string, string> = {
	'.html': 'text/html; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.png': 'image/png',
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.webp': 'image/webp',
	'.svg': 'image/svg+xml',
	'.ico': 'image/x-icon',
};

/** Đường dẫn (đã bỏ tiền tố /game) là trang chủ / file của trang chủ → gửi file, trả true; không thì false. */
export function sendSite(path: string, res: ServerResponse, dir: string = SITE_DIR): boolean {
	let rel: string;
	if (path === '/' || path === '/index.html') rel = 'index.html';
	else if (path.startsWith('/site/')) rel = decodeURIComponent(path.slice('/site/'.length));
	else return false;
	const p = resolve(dir, rel);
	// Chặn đi ngược ra ngoài thư mục (../) và file không có trong danh sách loại.
	if (!p.startsWith(dir + sep) || !existsSync(p) || !statSync(p).isFile()) return false;
	const type = TYPES[extname(p).toLowerCase()];
	if (!type) return false;
	const html = type.startsWith('text/html') || type.startsWith('application/json');
	res.writeHead(200, {
		'Content-Type': type,
		'Content-Length': String(statSync(p).size),
		'Cache-Control': html ? 'no-cache' : 'public, max-age=3600',
	});
	createReadStream(p).pipe(res);
	return true;
}

/** `/game` (không gạch chéo cuối) → chuyển sang `/game/` để đường dẫn tương đối trong trang (site/…, api/…) đúng. */
export function siteRedirect(rawPath: string, res: ServerResponse): boolean {
	if (rawPath !== '/game') return false;
	res.writeHead(301, { Location: '/game/' }).end();
	return true;
}


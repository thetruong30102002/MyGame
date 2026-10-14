// Trang chủ game (chủ dự án 13/10/2026: "thêm 1 landing page trang chủ game, tin tức cập nhật, tải các bản game — tham khảo trang Ngọc
// Rồng Online"): trang TĨNH ở `apps/server/site/` do chính máy chủ game phát — qua Funnel là https://<máy>/game/.
//   GET /  (hoặc /index.html)   → site/index.html
//   GET /admin                  → site/admin.html (trang quản trị: tài nguyên, góp ý, tin tức, bài viết — quyền kiểm ở API)
//   GET /tin-tuc, /dien-dan, /bai-viet, /gop-y, /tai-game, /the-gioi → site/<tên>.html (14/10/2026: chia trang, tối ưu điện thoại)
//   GET /site/<đường dẫn>       → file trong site/ (ảnh, news.json…)
// Tin tức (14/10/2026) lưu CSDL, quản trị đăng ở /admin; `site/news.json` chỉ còn để nạp lần đầu + dự phòng khi API lỗi. Nút tải dùng /api/client/latest/… (clientUpdate.ts).
import { createReadStream, existsSync, statSync } from 'node:fs';
import type { ServerResponse } from 'node:http';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Trang con: /<tên> → site/<tên>.html. */
const PAGES = new Set(['admin', 'tin-tuc', 'dien-dan', 'bai-viet', 'gop-y', 'tai-game', 'the-gioi']);

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
	'.woff2': 'font/woff2',
};

/** Đường dẫn (đã bỏ tiền tố /game) là trang chủ / file của trang chủ → gửi file, trả true; không thì false. */
export function sendSite(path: string, res: ServerResponse, dir: string = SITE_DIR): boolean {
	let rel: string;
	if (path === '/' || path === '/index.html') rel = 'index.html';
	else if (PAGES.has(path.replace(/^\/|\/$/g, ''))) rel = path.replace(/^\/|\/$/g, '') + '.html';
	else if (path.startsWith('/site/')) rel = decodeURIComponent(path.slice('/site/'.length));
	else return false;
	const p = resolve(dir, rel);
	// Chặn đi ngược ra ngoài thư mục (../) và file không có trong danh sách loại.
	if (!p.startsWith(dir + sep) || !existsSync(p) || !statSync(p).isFile()) return false;
	const type = TYPES[extname(p).toLowerCase()];
	if (!type) return false;
	// Trang, dữ liệu, mã, CSS luôn hỏi lại (đổi là thấy ngay, không lệch phiên bản giữa các file); chỉ ảnh + font được giữ đệm.
	const html = !type.startsWith('image/') && !type.startsWith('font/');
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


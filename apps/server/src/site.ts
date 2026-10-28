// Trang chủ game (chủ dự án 13/10/2026: "thêm 1 landing page trang chủ game, tin tức cập nhật, tải các bản game — tham khảo trang Ngọc
// Rồng Online"): trang TĨNH ở `apps/server/site/` do chính máy chủ game phát — qua Funnel là https://<máy>/game/.
//   GET /  (hoặc /index.html)   → site/index.html
//   GET /admin                  → site/admin.html (trang quản trị: tài nguyên, góp ý, tin tức, bài viết — quyền kiểm ở API)
//   GET /tin-tuc, /dien-dan, /bai-viet, /gop-y, /tai-game, /the-gioi → site/<tên>.html (14/10/2026: chia trang, tối ưu điện thoại)
//   GET /site/<đường dẫn>       → file trong site/ (ảnh, news.json…)
// Tin tức (14/10/2026) lưu CSDL, quản trị đăng ở /admin; `site/news.json` chỉ còn để nạp lần đầu + dự phòng khi API lỗi. Nút tải dùng /api/client/latest/… (clientUpdate.ts).
import { createReadStream, existsSync, statSync,readFileSync } from 'node:fs';
import type { ServerResponse,IncomingMessage } from 'node:http';
import {gzipSync} from 'node:zlib';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Trang con: /<tên> → site/<tên>.html. */
const PAGES = new Set(['admin', 'tin-tuc', 'dien-dan', 'bai-viet', 'gop-y', 'tai-game', 'the-gioi']);

export const SITE_DIR = process.env.AETHER_SITE_DIR ? resolve(process.env.AETHER_SITE_DIR) : resolve(dirname(fileURLToPath(import.meta.url)), '..', 'site');
const compressedFiles=new Map<string,{etag:string;data:Buffer}>();

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
export function sendSite(path: string, res: ServerResponse, dir: string = SITE_DIR, req?:IncomingMessage): boolean {
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
	const stat=statSync(p),etag='W/"'+stat.size.toString(16)+'-'+stat.mtimeMs.toString(16)+'"';
	const immutable=/^react\/.+-[A-Z0-9]{8}\.(js|css)$/.test(rel.replaceAll('\\','/'));
	const headers={'Content-Type':type,'Cache-Control':immutable?'public, max-age=31536000, immutable':html?'no-cache':'public, max-age=3600','ETag':etag,'Vary':'Accept-Encoding'};
	if(req?.headers['if-none-match']===etag){res.writeHead(304,headers).end();return true;}
	if(html&&stat.size>1024&&/\bgzip\b/.test(req?.headers['accept-encoding']||'')){
		let cached=compressedFiles.get(p);if(cached?.etag!==etag){cached={etag,data:gzipSync(readFileSync(p))};if(compressedFiles.size>=64)compressedFiles.clear();compressedFiles.set(p,cached);}
		res.writeHead(200,{...headers,'Content-Encoding':'gzip','Content-Length':cached.data.length}).end(cached.data);return true;
	}
	res.writeHead(200, {
		...headers,'Content-Length':String(stat.size),
	});
	createReadStream(p).pipe(res);
	return true;
}

/** `/game` (không gạch chéo cuối) → chuyển sang `/game/` để đường dẫn tương đối trong trang (site/…, api/…) đúng. */
export function siteRedirect(rawPath: string, res: ServerResponse): boolean {
	const url=new URL(rawPath,'http://aether'),path=url.pathname;
	if(path==='/game'){res.writeHead(301,{Location:'/game/'+url.search}).end();return true;}
	const name=path.replace(/^\/game(?=\/)/,'').replace(/^\/|\/$/g,'');
	if(!path.endsWith('/')||!PAGES.has(name))return false;
	res.writeHead(301, { Location: path.slice(0,-1)+url.search }).end();
	return true;
}


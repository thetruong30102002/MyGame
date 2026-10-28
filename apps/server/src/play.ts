// Bản chơi trên trình duyệt (Unity WebGL — chủ dự án 28/10/2026): qua Funnel là https://<máy>/game/play/.
//   GET /play            → chuyển sang /play/ (đường dẫn tương đối Build/…, TemplateData/… mới đúng)
//   GET /play/           → index.html của bản build
//   GET /play/<file>     → file trong thư mục bản WebGL (mặc định data/webgl, đổi bằng HAVENLORD_PLAY_DIR)
//   GET /play/m/         → bản điện thoại (ảnh ASTC nhẹ) ở data/webgl/m — trang PC tự chuyển sang khi là điện thoại
// Unity nén sẵn gzip (`*.gz`): gửi kèm Content-Encoding để trình duyệt tự giải nén, Content-Type theo đuôi gốc, và X-Decoded-Length = cỡ sau
// giải nén (trình duyệt đếm byte đã giải nén) để màn tải hiện đúng "đã tải / tổng MB".
import { closeSync, createReadStream, existsSync, openSync, readSync, statSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PLAY_DIR = process.env.HAVENLORD_PLAY_DIR ? resolve(process.env.HAVENLORD_PLAY_DIR) : resolve(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'webgl');

const TYPES: Record<string, string> = {
	'.html': 'text/html; charset=utf-8',
	'.css': 'text/css; charset=utf-8',
	'.js': 'text/javascript; charset=utf-8',
	'.json': 'application/json; charset=utf-8',
	'.wasm': 'application/wasm',
	'.data': 'application/octet-stream',
	'.png': 'image/png',
	'.ico': 'image/x-icon',
};

/** Cỡ gốc của file gzip: 4 byte cuối (ISIZE, little-endian) — đủ cho file dưới 4GB. */
function gzipSize(p: string, size: number): number {
	const fd = openSync(p, 'r');
	try {
		const b = Buffer.alloc(4);
		readSync(fd, b, 0, 4, size - 4);
		return b.readUInt32LE(0);
	} finally {
		closeSync(fd);
	}
}

/** `rawPath` còn nguyên tiền tố /game (nếu đi qua Funnel), `path` đã bỏ. Đã trả lời thì true. */
export function sendPlay(rawPath: string, path: string, res: ServerResponse, req: IncomingMessage): boolean {
	if (path === '/play') {
		res.writeHead(301, { Location: rawPath + '/' }).end();
		return true;
	}
	if (!path.startsWith('/play/')) return false;
	let rel = decodeURIComponent(path.slice('/play/'.length));
	// Thư mục (bản điện thoại m/): thiếu gạch chéo cuối thì chuyển, có thì gửi index.html bên trong.
	const dir = resolve(PLAY_DIR, rel);
	if (rel && !rel.endsWith('/') && dir.startsWith(PLAY_DIR + sep) && existsSync(dir) && statSync(dir).isDirectory()) {
		res.writeHead(301, { Location: rawPath + '/' }).end();
		return true;
	}
	if (rel === '' || rel.endsWith('/')) rel += 'index.html';
	const p = resolve(PLAY_DIR, rel);
	if (!p.startsWith(PLAY_DIR + sep) || !existsSync(p) || !statSync(p).isFile()) {
		const index = rel.endsWith('index.html');
		if (index) res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Bản chơi trên web chưa được phát.');
		return index;
	}
	const gz = p.endsWith('.gz');
	const type = TYPES[extname(gz ? p.slice(0, -3) : p).toLowerCase()];
	if (!type) return false;
	const stat = statSync(p);
	const etag = 'W/"' + stat.size.toString(16) + '-' + stat.mtimeMs.toString(16) + '"';
	const headers: Record<string, string> = {
		'Content-Type': type,
		// Trang và loader luôn hỏi lại; gói build đổi tên theo bản nên giữ đệm được.
		'Cache-Control': type.startsWith('text/html') ? 'no-cache' : 'public, max-age=3600',
		ETag: etag,
	};
	if (gz) {
		headers['Content-Encoding'] = 'gzip';
		headers['X-Decoded-Length'] = String(gzipSize(p, stat.size));
	}
	if (req.headers['if-none-match'] === etag) {
		res.writeHead(304, headers).end();
		return true;
	}
	res.writeHead(200, { ...headers, 'Content-Length': String(stat.size) });
	createReadStream(p).pipe(res);
	return true;
}

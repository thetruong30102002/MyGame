// Tự cập nhật client Unity (chủ dự án 11/10/2026: "client tự động cập nhật mà không cần tải tay xuống"). Bản phát nằm ở thư mục
// `data/client` (đổi bằng HAVENLORD_CLIENT_DIR): `version.json` + các file gói do `UnityGame/Tools~/publish-client.mts` chép vào. Mọi lời gọi
// đọc lại đĩa nên phát bản mới KHÔNG cần khởi động lại máy chủ. Không cần đăng nhập (màn đăng nhập hỏi trước khi có phiên).
//   GET /api/client/version            → nội dung version.json (404 nếu chưa phát bản nào)
//   GET /api/client/file/<tên file>    → tải một file gói (chỉ tên trong thư mục, không đường dẫn con)
//   GET /api/client/latest/<windows|windows-zip|android> → tải bản mới nhất của nền tảng đó (link cố định gửi người chơi mới)
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import type { ServerResponse } from 'node:http';
import { join, resolve } from 'node:path';

export interface ClientBuild {
	/** Số bản (phút kể từ 01/01/2026 UTC lúc build) — client so số này với bản của chính nó. */
	build: number;
	file: string;
	size: number;
	sha256: string;
	/** Gói zip cùng bản (Windows): client mới tải zip rồi tự giải nén — bộ cài exe chưa ký số bị Windows Defender chặn. */
	zip?: { file: string; size: number; sha256: string };
}

export interface ClientVersion {
	/** Tên bản để hiện (vd 2026.10.11-1330). */
	version: string;
	/** Bản thấp hơn số này thì client buộc cập nhật mới cho vào game (đổi luật không tương thích). */
	minBuild?: number;
	notes?: string;
	windows?: ClientBuild;
	android?: ClientBuild;
}

const FILE_NAME = /^[A-Za-z0-9._-]{1,120}$/;

export function readClientVersion(dir: string): ClientVersion | null {
	const p = join(dir, 'version.json');
	if (!existsSync(p)) return null;
	try {
		return JSON.parse(readFileSync(p, 'utf8')) as ClientVersion;
	} catch {
		return null;
	}
}

/** Gửi file gói `name` trong `dir`; false nếu tên không hợp lệ / không có file (người gọi trả 404). */
export function sendClientFile(dir: string, name: string, res: ServerResponse): boolean {
	if (!FILE_NAME.test(name) || name === 'version.json') return false;
	const root = resolve(dir);
	const p = resolve(root, name);
	if (!p.startsWith(root) || !existsSync(p)) return false;
	const st = statSync(p);
	if (!st.isFile()) return false;
	res.writeHead(200, {
		'Content-Type': name.endsWith('.apk') ? 'application/vnd.android.package-archive' : name.endsWith('.zip') ? 'application/zip' : 'application/octet-stream',
		'Content-Length': String(st.size),
		'Content-Disposition': `attachment; filename="${name}"`,
		'Cache-Control': 'no-cache',
	});
	createReadStream(p).pipe(res);
	return true;
}

/** Tên file bản mới nhất của nền tảng (windows / android) theo version.json; null nếu chưa có. */
export function latestFile(dir: string, platform: string): string | null {
	const v = readClientVersion(dir);
	if (platform === 'windows-zip') return v?.windows?.zip?.file ?? null;
	const b = platform === 'windows' ? v?.windows : platform === 'android' ? v?.android : undefined;
	return b?.file ?? null;
}

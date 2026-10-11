import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	MAX_CHARACTERS,
	validateName,
	validatePassword,
	validateUsername,
	FEEDBACK_MAX,
	type AuthRequest,
	type CharacterProgress,
	type CreateCharacterRequest,
	type FeedbackRequest,
	type Gender,
} from '@aether/protocol';
import { AdminError, AdminOps } from './adminOps.ts';
import { latestFile, readClientVersion, sendClientFile } from './clientUpdate.ts';
import { hashPassword, newToken, RateLimiter, verifyPassword } from './auth.ts';
import type { Store } from './db.ts';
import { cleanProgress } from './world.ts';

const SESSION_TTL = 30 * 24 * 3600 * 1000;
/** Bản phát client Unity cho tự cập nhật (`clientUpdate.ts`); máy chủ thử đặt AETHER_CLIENT_DIR riêng. */
const CLIENT_DIR = process.env.AETHER_CLIENT_DIR ?? join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'client');
const BODY_LIMIT = 80 * 1024;

export function newProgress(): CharacterProgress {
	return { level: 1, exp: 0, coins: 0, potions: 0, map: 'human/town', x: -1, y: -1, story: null, introSeen: false };
}

class HttpError extends Error {
	constructor(
		readonly status: number,
		message: string,
	) {
		super(message);
	}
}

/**
 * REST tối giản (không framework): đăng ký, đăng nhập, danh sách / tạo / xoá nhân vật. Xác thực bằng
 * header `Authorization: Bearer <token>` chứ không dùng cookie → không có lỗ CSRF, nên mở CORS được.
 * Trang quản trị (`/api/admin/*`): cùng phiên đăng nhập + tài khoản phải có trong bảng `admins` (`AdminOps` — truyền bản có `World`
 * để nhân vật đang online nhận số mới ngay; vắng = chỉ ghi CSDL).
 */
export function createApi(store: Store, admin: AdminOps = new AdminOps(store), clientDir: string = CLIENT_DIR) {
	const authLimit = new RateLimiter(10, 60_000);
	/** Mọi lời gọi trang quản trị theo địa chỉ gửi (kể cả lời bị từ chối) — chặn dò / gọi dồn dập. */
	const adminLimit = new RateLimiter(120, 60_000);
	/** Lần cộng / trừ của mỗi tài khoản quản trị. */
	const grantLimit = new RateLimiter(30, 60_000);
	/** Góp ý của mỗi tài khoản: 5 lần / 10 phút. */
	const feedbackLimit = new RateLimiter(5, 600_000);

	const routes: { method: string; path: RegExp; run: (req: IncomingMessage, m: RegExpMatchArray) => Promise<unknown> }[] = [
		{ method: 'GET', path: /^\/api\/health$/, run: async () => ({ ok: true }) },
		{
			// Tự cập nhật client: không cần đăng nhập — màn đăng nhập hỏi trước.
			method: 'GET',
			path: /^\/api\/client\/version$/,
			run: async () => {
				const v = readClientVersion(clientDir);
				if (!v) throw new HttpError(404, 'Chưa phát bản client nào');
				return v;
			},
		},
		{
			method: 'POST',
			path: /^\/api\/register$/,
			run: async (req) => {
				limit(authLimit, req);
				const { username, password } = await body<AuthRequest>(req);
				const u = String(username ?? '').trim().toLowerCase();
				const err = validateUsername(u) ?? validatePassword(String(password ?? ''));
				if (err) throw new HttpError(400, err);
				const id = store.createAccount(u, await hashPassword(String(password)));
				if (id === null) throw new HttpError(409, 'Tên đăng nhập đã có người dùng');
				return session(id, u);
			},
		},
		{
			method: 'POST',
			path: /^\/api\/login$/,
			run: async (req) => {
				limit(authLimit, req);
				const { username, password } = await body<AuthRequest>(req);
				const u = String(username ?? '').trim().toLowerCase();
				const acc = store.account(u);
				// Cùng một câu báo lỗi cho "sai tên" và "sai mật khẩu": không cho dò tên tài khoản nào tồn tại.
				if (!acc || !(await verifyPassword(String(password ?? ''), acc.passHash))) throw new HttpError(401, 'Sai tên đăng nhập hoặc mật khẩu');
				return session(acc.id, u);
			},
		},
		{
			method: 'POST',
			path: /^\/api\/logout$/,
			run: async (req) => {
				const token = bearer(req);
				if (token) store.deleteSession(token);
				return { ok: true };
			},
		},
		{ method: 'GET', path: /^\/api\/characters$/, run: async (req) => store.characters(auth(req).accountId) },
		{
			method: 'POST',
			path: /^\/api\/characters$/,
			run: async (req) => {
				const { accountId } = auth(req);
				const { name, gender } = await body<CreateCharacterRequest>(req);
				const n = String(name ?? '').trim().replace(/\s+/g, ' ').normalize('NFC');
				const err = validateName(n);
				if (err) throw new HttpError(400, err);
				if (gender !== 'male' && gender !== 'female') throw new HttpError(400, 'Chọn nam hoặc nữ');
				if (store.characters(accountId).length >= MAX_CHARACTERS) throw new HttpError(400, `Mỗi tài khoản tối đa ${MAX_CHARACTERS} nhân vật`);
				const created = store.createCharacter(randomUUID(), accountId, n, gender as Gender, newProgress());
				if (!created) throw new HttpError(409, 'Tên nhân vật đã có người dùng');
				return created;
			},
		},
		{
			// Lưu chắc chắn qua HTTP (xoá tiến độ, đóng trang): tin WebSocket gửi ngay trước khi tải lại trang có thể rơi mất.
			method: 'PUT',
			path: /^\/api\/characters\/([0-9a-f-]{36})\/progress$/,
			run: async (req, m) => {
				const { accountId } = auth(req);
				if (!store.character(m[1]!, accountId)) throw new HttpError(404, 'Không tìm thấy nhân vật');
				const clean = cleanProgress((await body<{ progress: CharacterProgress }>(req)).progress);
				if (!clean) throw new HttpError(400, 'Tiến độ không hợp lệ');
				store.saveProgress(m[1]!, clean);
				return { ok: true };
			},
		},
		{
			method: 'DELETE',
			path: /^\/api\/characters\/([0-9a-f-]{36})$/,
			run: async (req, m) => {
				if (!store.deleteCharacter(m[1]!, auth(req).accountId)) throw new HttpError(404, 'Không tìm thấy nhân vật');
				return { ok: true };
			},
		},
		{
			// Góp ý bản beta (Cài đặt → Góp ý): cần đăng nhập; chữ 3…FEEDBACK_MAX ký tự; tên nhân vật chỉ lấy khi thuộc đúng tài khoản.
			method: 'POST',
			path: /^\/api\/feedback$/,
			run: async (req) => {
				const s = auth(req);
				if (!feedbackLimit.allow(String(s.accountId))) throw new HttpError(429, 'Bạn góp ý nhanh quá, đợi ít phút nhé');
				const b = await body<FeedbackRequest>(req);
				const text = String(b.text ?? '').replace(/\r\n?/g, '\n').trim();
				if (text.length < 3) throw new HttpError(400, 'Góp ý ngắn quá');
				if (text.length > FEEDBACK_MAX) throw new HttpError(400, `Góp ý tối đa ${FEEDBACK_MAX} ký tự`);
				const ch = typeof b.characterId === 'string' ? store.character(b.characterId, s.accountId) : null;
				const build = Number.isFinite(Number(b.build)) && Number(b.build) > 0 ? Math.floor(Number(b.build)) : null;
				const platform = typeof b.platform === 'string' ? b.platform.slice(0, 24) : null;
				store.addFeedback(s.accountId, s.username, ch?.name ?? null, text, build, platform);
				return { ok: true };
			},
		},
		// ———— Trang quản trị (/admin): cộng tiền, điểm cho nhân vật ————
		{
			// Chưa đăng nhập → 401 (trang hiện ô đăng nhập); đã đăng nhập thì chỉ cho biết CHÍNH tài khoản này có quyền hay không.
			method: 'GET',
			path: /^\/api\/admin\/me$/,
			run: async (req) => {
				limit(adminLimit, req);
				const s = auth(req);
				return { admin: admin.isAdmin(s.accountId), username: s.username };
			},
		},
		{
			method: 'GET',
			path: /^\/api\/admin\/characters$/,
			run: async (req) => {
				adminAuth(req);
				return admin.search(query(req).get('q') ?? '');
			},
		},
		{
			method: 'POST',
			path: /^\/api\/admin\/grant$/,
			run: async (req) => {
				const s = adminAuth(req);
				if (!grantLimit.allow(String(s.accountId))) throw new HttpError(429, 'Cộng nhanh quá, đợi một phút');
				return admin.grant({ id: s.accountId, username: s.username }, await body(req));
			},
		},
		{
			method: 'GET',
			path: /^\/api\/admin\/feedback$/,
			run: async (req) => {
				adminAuth(req);
				const n = Math.floor(Number(query(req).get('limit') ?? 100));
				return store.feedbackList(Number.isFinite(n) ? Math.max(1, Math.min(500, n)) : 100);
			},
		},
		{
			method: 'GET',
			path: /^\/api\/admin\/log$/,
			run: async (req) => {
				adminAuth(req);
				const q = query(req);
				return admin.log(q.get('limit'), q.get('characterId'));
			},
		},
	];

	/** Phiên hợp lệ + tài khoản có trong bảng `admins` — sai thì 401 / 403, không nói gì thêm. */
	function adminAuth(req: IncomingMessage) {
		limit(adminLimit, req);
		const s = auth(req);
		if (!admin.isAdmin(s.accountId)) throw new HttpError(403, 'Tài khoản này không có quyền quản trị');
		return s;
	}

	function session(accountId: number, username: string) {
		const token = newToken();
		store.createSession(token, accountId, SESSION_TTL);
		return { token, username };
	}

	function auth(req: IncomingMessage) {
		const s = store.sessionAccount(bearer(req) ?? '');
		if (!s) throw new HttpError(401, 'Phiên đăng nhập đã hết hạn, đăng nhập lại');
		return s;
	}

	return async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
		res.setHeader('Access-Control-Allow-Origin', '*');
		res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
		res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
		if (req.method === 'OPTIONS') return void res.writeHead(204).end();
		const path = stripMount(new URL(req.url ?? '/', 'http://x').pathname);
		// File gói client (luồng nhị phân, không qua JSON): /api/client/file/<tên> hoặc /api/client/latest/<windows|android>.
		const file = req.method === 'GET' ? path.match(/^\/api\/client\/file\/([^/]+)$/) : null;
		const latest = req.method === 'GET' ? path.match(/^\/api\/client\/latest\/(windows|android)$/) : null;
		if (file || latest) {
			const name = file ? decodeURIComponent(file[1]!) : latestFile(clientDir, latest![1]!);
			if (!name || !sendClientFile(clientDir, name, res)) json(res, 404, { error: 'Không có file này' });
			return;
		}
		for (const r of routes) {
			const m = path.match(r.path);
			if (!m || r.method !== req.method) continue;
			try {
				json(res, 200, await r.run(req, m));
			} catch (e) {
				if (e instanceof HttpError || e instanceof AdminError) json(res, e.status, { error: e.message });
				else {
					console.error(e);
					json(res, 500, { error: 'Lỗi máy chủ' });
				}
			}
			return;
		}
		json(res, 404, { error: 'Không có đường dẫn này' });
	};
}

/**
 * Đi qua Tailscale Funnel thì máy chủ game nằm dưới `/game` cùng cổng với web (xem docs/online-va-build.md).
 * Tuỳ cấu hình mà Funnel có hoặc không cắt tiền tố → nhận cả hai dạng.
 */
export function stripMount(path: string): string {
	return path.replace(/^\/game(?=\/|$)/, '') || '/';
}

function limit(rl: RateLimiter, req: IncomingMessage): void {
	if (!rl.allow(req.socket.remoteAddress ?? '?')) throw new HttpError(429, 'Thử quá nhiều lần, đợi một phút');
}

/** Tham số trên URL (`?q=…&limit=…`). */
function query(req: IncomingMessage): URLSearchParams {
	return new URL(req.url ?? '/', 'http://x').searchParams;
}

export function bearer(req: IncomingMessage): string | null {
	const h = req.headers.authorization ?? '';
	return h.startsWith('Bearer ') ? h.slice(7) : null;
}

function json(res: ServerResponse, status: number, data: unknown): void {
	res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }).end(JSON.stringify(data));
}

async function body<T>(req: IncomingMessage): Promise<Partial<T>> {
	let size = 0;
	const chunks: Buffer[] = [];
	for await (const c of req) {
		size += (c as Buffer).length;
		if (size > BODY_LIMIT) throw new HttpError(413, 'Dữ liệu gửi lên quá lớn');
		chunks.push(c as Buffer);
	}
	try {
		const v = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
		return v && typeof v === 'object' ? (v as Partial<T>) : {};
	} catch {
		throw new HttpError(400, 'Dữ liệu không phải JSON');
	}
}

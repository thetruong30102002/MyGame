import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import {
	MAX_CHARACTERS,
	validateName,
	validatePassword,
	validateUsername,
	type AuthRequest,
	type CharacterProgress,
	type CreateCharacterRequest,
	type Gender,
} from '@aether/protocol';
import { hashPassword, newToken, RateLimiter, verifyPassword } from './auth.ts';
import type { Store } from './db.ts';
import { cleanProgress } from './world.ts';

const SESSION_TTL = 30 * 24 * 3600 * 1000;
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
 */
export function createApi(store: Store) {
	const authLimit = new RateLimiter(10, 60_000);

	const routes: { method: string; path: RegExp; run: (req: IncomingMessage, m: RegExpMatchArray) => Promise<unknown> }[] = [
		{ method: 'GET', path: /^\/api\/health$/, run: async () => ({ ok: true }) },
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
	];

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
		for (const r of routes) {
			const m = path.match(r.path);
			if (!m || r.method !== req.method) continue;
			try {
				json(res, 200, await r.run(req, m));
			} catch (e) {
				if (e instanceof HttpError) json(res, e.status, { error: e.message });
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

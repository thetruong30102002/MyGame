import {
	SERVER_PORT,
	type AdminCharacter,
	type AdminGrantRequest,
	type AdminGrantResult,
	type AdminLogEntry,
	type AuthResponse,
	type CharacterInfo,
	type CharacterProgress,
	type Gender,
} from '@aether/protocol';

/**
 * Địa chỉ máy chủ game. Mặc định cùng host với trang web, cổng 3200 — mở bằng IP LAN trên điện thoại
 * vẫn trỏ đúng máy. Bản triển khai đặt `NEXT_PUBLIC_SERVER_URL` lúc build: địa chỉ đầy đủ, hoặc một
 * đường dẫn (`/game`) = cùng origin với trang web (Funnel chia đường dẫn về máy chủ game).
 */
export function serverUrl(): string {
	const env = process.env.NEXT_PUBLIC_SERVER_URL;
	if (env) return (env.startsWith('/') ? location.origin + env : env).replace(/\/$/, '');
	return `${location.protocol}//${location.hostname}:${SERVER_PORT}`;
}

export class ApiError extends Error {
	constructor(
		readonly status: number,
		message: string,
	) {
		super(message);
	}
}

async function call<T>(path: string, method: string, token: string | null, body?: unknown, keepalive = false): Promise<T> {
	let res: Response;
	try {
		res = await fetch(serverUrl() + path, {
			method,
			keepalive,
			headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
			body: body === undefined ? undefined : JSON.stringify(body),
		});
	} catch {
		throw new ApiError(0, 'Không kết nối được máy chủ game — máy chủ đã bật chưa?');
	}
	const data = (await res.json().catch(() => ({}))) as T & { error?: string };
	if (!res.ok) throw new ApiError(res.status, data.error ?? `Lỗi ${res.status}`);
	return data;
}

export const api = {
	register: (username: string, password: string) => call<AuthResponse>('/api/register', 'POST', null, { username, password }),
	login: (username: string, password: string) => call<AuthResponse>('/api/login', 'POST', null, { username, password }),
	logout: (token: string) => call<{ ok: true }>('/api/logout', 'POST', token),
	characters: (token: string) => call<CharacterInfo[]>('/api/characters', 'GET', token),
	createCharacter: (token: string, name: string, gender: Gender) => call<CharacterInfo>('/api/characters', 'POST', token, { name, gender }),
	deleteCharacter: (token: string, id: string) => call<{ ok: true }>(`/api/characters/${id}`, 'DELETE', token),
	/** `keepalive`: vẫn gửi trọn khi trang đang đóng / tải lại. */
	saveProgress: (token: string, id: string, progress: CharacterProgress) => call<{ ok: true }>(`/api/characters/${id}/progress`, 'PUT', token, { progress }, true),
};

/**
 * Trang quản trị (/admin): cùng phiên đăng nhập của game. Máy chủ kiểm phiên + quyền ở MỌI lời gọi — 401 chưa đăng nhập / phiên hết
 * hạn, 403 tài khoản không có quyền (`me` thì trả `admin: false`).
 */
export const adminApi = {
	me: (token: string) => call<{ admin: boolean; username: string }>('/api/admin/me', 'GET', token),
	characters: (token: string, q: string) => call<AdminCharacter[]>(`/api/admin/characters?q=${encodeURIComponent(q)}`, 'GET', token),
	grant: (token: string, req: AdminGrantRequest) => call<AdminGrantResult>('/api/admin/grant', 'POST', token, req),
	log: (token: string, limit = 50) => call<AdminLogEntry[]>(`/api/admin/log?limit=${limit}`, 'GET', token),
};

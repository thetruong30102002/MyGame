import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

/** Mật khẩu băm scrypt + muối ngẫu nhiên, lưu dạng `scrypt$<muối>$<băm>` (base64url). */
export async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(16);
	const hash = await scryptAsync(password, salt, 32);
	return `scrypt$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
	const [kind, salt, hash] = stored.split('$');
	if (kind !== 'scrypt' || !salt || !hash) return false;
	const expected = Buffer.from(hash, 'base64url');
	const actual = await scryptAsync(password, Buffer.from(salt, 'base64url'), expected.length);
	return timingSafeEqual(actual, expected);
}

export function newToken(): string {
	return randomBytes(32).toString('base64url');
}

/** Giới hạn số lần thử đăng nhập theo IP: chặn dò mật khẩu mà không cần thư viện ngoài. */
export class RateLimiter {
	private readonly hits = new Map<string, number[]>();

	constructor(
		private readonly max: number,
		private readonly windowMs: number,
		private readonly clock: () => number = Date.now,
	) {}

	allow(key: string): boolean {
		const now = this.clock();
		const list = (this.hits.get(key) ?? []).filter((t) => now - t < this.windowMs);
		if (list.length >= this.max) {
			this.hits.set(key, list);
			return false;
		}
		list.push(now);
		this.hits.set(key, list);
		return true;
	}
}

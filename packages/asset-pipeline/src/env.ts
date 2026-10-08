import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Đọc `.env.local` ở gốc repo. Không dùng `dotenv` để khỏi thêm phụ thuộc; giá trị KHÔNG bao giờ
 * được in ra log — chỉ in "có/không".
 */
export function loadEnv(repoRoot: string): Record<string, string> {
	const out: Record<string, string> = {};
	const file = resolve(repoRoot, '.env.local');
	if (existsSync(file)) {
		for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
			const trimmed = line.trim();
			if (!trimmed || trimmed.startsWith('#')) continue;
			const eq = trimmed.indexOf('=');
			if (eq <= 0) continue;
			out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
		}
	}
	for (const [k, v] of Object.entries(process.env)) if (v !== undefined && !(k in out)) out[k] = v;
	return out;
}

export function describeSecret(value: string | undefined): string {
	return value ? 'đã cấu hình' : 'chưa cấu hình';
}

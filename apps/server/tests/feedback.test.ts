// Góp ý bản beta (Cài đặt → Góp ý, 11/10/2026): POST /api/feedback cần đăng nhập, kẹp độ dài, chặn dồn dập; QTV đọc ở
// GET /api/admin/feedback, người thường bị 403. Chạy: npx tsx --test tests/feedback.test.ts (trong apps/server).
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { FEEDBACK_MAX, type FeedbackEntry } from '@aether/protocol';
import { Store } from '../src/db.ts';
import { createApi, newProgress } from '../src/http.ts';

const dir = mkdtempSync(join(tmpdir(), 'aether-feedback-'));
const store = new Store(join(dir, 'f.db'));
const api = createApi(store);
const server: Server = createServer((req, res) => void api(req, res));
await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${(server.address() as { port: number }).port}`;

async function call<T>(path: string, token: string | null, body?: unknown): Promise<{ status: number; data: T }> {
	const r = await fetch(BASE + path, {
		method: body === undefined ? 'GET' : 'POST',
		headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
		body: body === undefined ? undefined : JSON.stringify(body),
	});
	return { status: r.status, data: (await r.json()) as T };
}

const player = store.createAccount('nguoi_choi', 'x')!;
store.createSession('tokPlayer', player, 3600_000);
const other = store.createAccount('nguoi_khac', 'x')!;
store.createSession('tokOther', other, 3600_000);
store.createSession('tokAdmin', store.createAccount('quan_tri', 'x')!, 3600_000);
store.setAdmin('quan_tri', true);
const hero = store.createCharacter('00000000-0000-0000-0000-0000000000b1', player, 'Ánh Dương', 'female', newProgress())!.id;
const stranger = store.createCharacter('00000000-0000-0000-0000-0000000000b2', other, 'Minh Khôi', 'male', newProgress())!.id;

try {
	test('chưa đăng nhập → 401; chữ ngắn / dài quá → 400', async () => {
		assert.equal((await call('/api/feedback', null, { text: 'đồ hoạ đẹp' })).status, 401);
		assert.equal((await call('/api/feedback', 'tokPlayer', { text: '  a ' })).status, 400);
		assert.equal((await call('/api/feedback', 'tokPlayer', { text: 'x'.repeat(FEEDBACK_MAX + 1) })).status, 400);
	});

	test('gửi được; tên nhân vật chỉ lấy khi thuộc đúng tài khoản; QTV đọc được, người thường 403', async () => {
		assert.equal((await call('/api/feedback', 'tokPlayer', { text: 'Bản đồ\r\nđẹp lắm', characterId: hero, build: 408442, platform: 'windows' })).status, 200);
		assert.equal((await call('/api/feedback', 'tokPlayer', { text: 'Nhân vật nhỏ quá', characterId: stranger, build: 'abc' })).status, 200);
		const list = await call<FeedbackEntry[]>('/api/admin/feedback', 'tokAdmin');
		assert.equal(list.status, 200);
		assert.equal(list.data.length, 2);
		const [newest, first] = list.data;
		assert.deepEqual([first!.username, first!.characterName, first!.text, first!.build, first!.platform], ['nguoi_choi', 'Ánh Dương', 'Bản đồ\nđẹp lắm', 408442, 'windows']);
		assert.deepEqual([newest!.characterName, newest!.build], [null, null], 'nhân vật của tài khoản khác không được ghi tên; build lạ bỏ');
		assert.equal((await call('/api/admin/feedback', 'tokPlayer')).status, 403);
	});

	test('chặn dồn dập: 5 lần / 10 phút mỗi tài khoản (tính cả lần gửi hỏng — đã dùng 4: 2 hỏng + 2 được)', async () => {
		assert.equal((await call('/api/feedback', 'tokPlayer', { text: 'lần thứ năm' })).status, 200);
		assert.equal((await call('/api/feedback', 'tokPlayer', { text: 'lần thứ sáu' })).status, 429);
		assert.equal((await call('/api/feedback', 'tokOther', { text: 'tài khoản khác vẫn gửi được' })).status, 200);
	});
} finally {
	test('dọn', () => {
		server.close();
		store.close();
		rmSync(dir, { recursive: true, force: true });
	});
}

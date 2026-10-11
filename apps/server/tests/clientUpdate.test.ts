// Chạy: npx tsx tests/clientUpdate.test.ts — tự cập nhật client Unity (11/10/2026): qua HTTP THẬT (cổng ngẫu nhiên + createApi với thư
// mục bản phát tạm). Chưa phát bản → 404; có version.json → trả nguyên (không cần đăng nhập, cả dạng /game/...); tải file gói đúng byte +
// Content-Length; link cố định /latest/<nền tảng>; tên lạ / có đường dẫn / version.json bị chặn; phát bản mới không cần khởi động lại.
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AdminOps } from '../src/adminOps.ts';
import type { ClientVersion } from '../src/clientUpdate.ts';
import { Store } from '../src/db.ts';
import { createApi } from '../src/http.ts';

let passed = 0;
const test = async (name: string, fn: () => void | Promise<void>): Promise<void> => {
	await fn();
	passed += 1;
	console.log(`  ✔ ${name}`);
};
console.log('clientUpdate (tự cập nhật client)');

const dir = mkdtempSync(join(tmpdir(), 'aether-client-'));
const clientDir = join(dir, 'client');
const store = new Store(join(dir, 'a.db'));
const api = createApi(store, new AdminOps(store), clientDir);
const server: Server = createServer((req, res) => void api(req, res));
await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${(server.address() as { port: number }).port}`;

try {
	await test('chưa phát bản nào → 404 (client coi như không có bản mới)', async () => {
		assert.equal((await fetch(`${BASE}/api/client/version`)).status, 404);
		assert.equal((await fetch(`${BASE}/api/client/latest/windows`)).status, 404);
	});

	const { mkdirSync } = await import('node:fs');
	mkdirSync(clientDir, { recursive: true });
	const bytes = Buffer.from('MZ-ban-thu-'.repeat(1000));
	writeFileSync(join(clientDir, 'Aether-Chronicle-100.exe'), bytes);
	const v: ClientVersion = { version: '2026.10.11-1330', minBuild: 90, windows: { build: 100, file: 'Aether-Chronicle-100.exe', size: bytes.length, sha256: 'x' } };
	writeFileSync(join(clientDir, 'version.json'), JSON.stringify(v));

	await test('phát bản (chép file + version.json) → đọc được ngay, không đăng nhập, cả dạng /game/api', async () => {
		for (const p of ['/api/client/version', '/game/api/client/version']) {
			const r = await fetch(BASE + p);
			assert.equal(r.status, 200);
			assert.deepEqual(await r.json(), v);
		}
	});

	await test('tải file gói đúng byte + Content-Length; link cố định /latest/windows trả cùng file', async () => {
		for (const p of ['/api/client/file/Aether-Chronicle-100.exe', '/game/api/client/latest/windows']) {
			const r = await fetch(BASE + p);
			assert.equal(r.status, 200);
			assert.equal(r.headers.get('content-length'), String(bytes.length));
			assert.deepEqual(Buffer.from(await r.arrayBuffer()), bytes);
		}
		assert.equal((await fetch(`${BASE}/api/client/latest/android`)).status, 404, 'chưa phát bản Android');
	});

	await test('tên lạ / có đường dẫn / chính version.json / file không có → 404', async () => {
		for (const name of ['version.json', '..%2Fa.db', '..%5Ca.db', 'khong-co.exe', 'a%20b.exe']) {
			assert.equal((await fetch(`${BASE}/api/client/file/${name}`)).status, 404, name);
		}
		assert.equal((await fetch(`${BASE}/api/client/file/../a.db`)).status, 404);
	});

	await test('phát bản mới đè version.json → lần gọi sau thấy ngay (không khởi động lại)', async () => {
		writeFileSync(join(clientDir, 'version.json'), JSON.stringify({ ...v, windows: { ...v.windows!, build: 101 } }));
		const r = (await (await fetch(`${BASE}/api/client/version`)).json()) as ClientVersion;
		assert.equal(r.windows?.build, 101);
	});
} finally {
	server.close();
	store.close();
	rmSync(dir, { recursive: true, force: true });
}
console.log(`${passed} test qua`);

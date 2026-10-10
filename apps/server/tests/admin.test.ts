// Chạy: npx tsx tests/admin.test.ts — trang quản trị (/admin, 10/10/2026): cộng tiền, điểm cho nhân vật. Qua HTTP THẬT (máy chủ http
// cổng ngẫu nhiên + createApi + AdminOps + World với socket giả, CSDL SQLite thật trong thư mục tạm): chưa đăng nhập / không phải quản
// trị bị chặn; cộng từng loại đúng + nhật ký đủ; người đang online nhận `eco` / ví / điểm thưởng ngay và bộ nhớ kinh tế không ghi đè số
// quản trị; gói save của client không ghi đè điểm thưởng; biên độ + không bao giờ âm; lệnh `src/admin.ts` add / remove / list.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ADMIN_LIMITS, MAX_LEVEL, type AdminCharacter, type AdminGrantResult, type AdminLogEntry, type ServerMessage } from '@aether/protocol';
import { addExp, applyAdminEco, fromTotalExp, shiftExp, totalExp } from '@aether/sim/economy';
import { expForLevel } from '@aether/sim/skills';
import { questDef } from '@aether/sim/story/quests';
import { TALENT_BONUS_CAP } from '@aether/sim/talents';
import { AdminOps } from '../src/adminOps.ts';
import { Store } from '../src/db.ts';
import { createApi, newProgress } from '../src/http.ts';
import { World } from '../src/world.ts';

let passed = 0;
const test = async (name: string, fn: () => void | Promise<void>): Promise<void> => {
	await fn();
	passed += 1;
	console.log(`  ✔ ${name}`);
};
console.log('admin (trang quản trị)');

await test('luật dùng chung: EXP có dấu theo tổng EXP (xuống cấp được, không dưới cấp 1), đặt cấp → EXP 0, xu / bình không âm, không quá trần', () => {
	assert.equal(totalExp(1, 0), 0);
	assert.equal(totalExp(3, 5), expForLevel(1) + expForLevel(2) + 5);
	assert.deepEqual(fromTotalExp(totalExp(7, 123)), { level: 7, exp: 123 });
	assert.deepEqual(shiftExp(5, 10, 1e6), { level: addExp(5, 10, 1e6).level, exp: addExp(5, 10, 1e6).exp }, 'cộng = addExp');
	assert.deepEqual(shiftExp(...(Object.values(shiftExp(5, 10, 54_321)) as [number, number]), -54_321), { level: 5, exp: 10 }, 'cộng rồi trừ cùng số: về chỗ cũ');
	assert.deepEqual(shiftExp(3, 20, -1e9), { level: 1, exp: 0 }, 'trừ quá: cấp 1 EXP 0');
	assert.deepEqual(shiftExp(MAX_LEVEL, 0, 999), { level: MAX_LEVEL, exp: 0 }, 'cấp tối đa không nhận thêm');
	const cur = { level: 10, exp: 400, coins: 50, potions: 2 };
	assert.deepEqual(applyAdminEco(cur, { setLevel: 20 }), { level: 20, exp: 0, coins: 50, potions: 2 }, 'đặt cấp: EXP về 0');
	assert.deepEqual(applyAdminEco(cur, { setLevel: 20, exp: 10 }), { level: 20, exp: 10, coins: 50, potions: 2 }, 'đặt cấp TRƯỚC rồi mới cộng EXP');
	assert.deepEqual(applyAdminEco(cur, { coins: -500, potions: -9 }), { level: 10, exp: 400, coins: 0, potions: 0 }, 'trừ quá: về 0');
	assert.deepEqual(applyAdminEco(cur, { potions: 5000 }).potions, 999, 'bình kẹp trần 999');
});

class FakeWs {
	readonly OPEN = 1;
	readyState = 1;
	inbox: ServerMessage[] = [];
	private onMessage: ((raw: unknown) => void) | null = null;
	private onClose: (() => void) | null = null;
	on(ev: string, cb: (raw: unknown) => void): void {
		if (ev === 'message') this.onMessage = cb;
		if (ev === 'close') this.onClose = cb as () => void;
	}
	send(raw: string): void {
		this.inbox.push(JSON.parse(raw) as ServerMessage);
	}
	close(): void {
		this.readyState = 3;
		this.onClose?.();
	}
	push(msg: unknown): void {
		this.onMessage?.(JSON.stringify(msg));
	}
	last<T extends ServerMessage['t']>(t: T): Extract<ServerMessage, { t: T }> | undefined {
		return this.inbox.filter((m): m is Extract<ServerMessage, { t: T }> => m.t === t).at(-1);
	}
}

const dir = mkdtempSync(join(tmpdir(), 'aether-admin-'));
const dbPath = join(dir, 'a.db');
const store = new Store(dbPath);
const world = new World(store, () => []);
// Một bản API cho cả bài (bộ chặn dồn dập nằm trong createApi) — y như main.ts.
const api = createApi(store, new AdminOps(store, world));
const server: Server = createServer((req, res) => void api(req, res));
await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
const port = (server.address() as { port: number }).port;
const BASE = `http://127.0.0.1:${port}`;

async function call<T>(path: string, token: string | null, init: { method?: string; body?: unknown } = {}): Promise<{ status: number; data: T }> {
	const r = await fetch(BASE + path, {
		method: init.method ?? 'GET',
		headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
		body: init.body === undefined ? undefined : JSON.stringify(init.body),
	});
	return { status: r.status, data: (await r.json()) as T };
}
const grant = (token: string | null, body: Record<string, unknown>) => call<AdminGrantResult & { error?: string }>('/api/admin/grant', token, { method: 'POST', body });

// Tài khoản: quản trị (chưa cấp quyền lúc đầu) + quản trị thứ hai chuyên gửi yêu cầu hỏng (trần 30 lần cộng / phút tính theo tài
// khoản), người chơi thường; nhân vật của người chơi vào game (online), một nhân vật offline.
const adminAcc = store.createAccount('quan_tri', 'x')!;
store.createSession('tokAdmin', adminAcc, 3600_000);
store.createSession('tokTester', store.createAccount('kiem_thu', 'x')!, 3600_000);
const playerAcc = store.createAccount('nguoi_choi', 'x')!;
store.createSession('tokPlayer', playerAcc, 3600_000);
const otherAcc = store.createAccount('ban_cu', 'x')!;
store.createSession('tokOther', otherAcc, 3600_000);
const hero = store.createCharacter('00000000-0000-0000-0000-0000000000a1', playerAcc, 'Ánh Dương', 'female', { ...newProgress(), level: 3, exp: 10, coins: 50, potions: 2, map: 'human/town' })!.id;
const away = store.createCharacter('00000000-0000-0000-0000-0000000000a2', otherAcc, 'Minh Khôi', 'male', { ...newProgress(), level: 8, exp: 0, coins: 900, potions: 1, map: 'human/town' })!.id;
const ws = new FakeWs();
world.accept(ws as never);
ws.push({ t: 'hello', token: 'tokPlayer', character: hero });
const eco = (id: string) => store.ecoOf(id)!;
const REASON = 'Bù quà sự kiện';

try {
	await test('chưa đăng nhập / phiên sai → 401 ở mọi đường quản trị (kể cả /game/api/…)', async () => {
		for (const [path, method] of [
			['/api/admin/me', 'GET'],
			['/api/admin/characters?q=a', 'GET'],
			['/api/admin/grant', 'POST'],
			['/api/admin/log', 'GET'],
			['/game/api/admin/me', 'GET'],
		] as const) {
			assert.equal((await call(path, null, { method, body: method === 'POST' ? { characterId: hero, coins: 1, reason: 'x' } : undefined })).status, 401, `${method} ${path} không token`);
			assert.equal((await call(path, 'sai-token', { method, body: method === 'POST' ? { characterId: hero, coins: 1, reason: 'x' } : undefined })).status, 401, `${method} ${path} token sai`);
		}
		assert.equal(eco(hero).coins, 50, 'không ai cộng được gì');
	});

	await test('mặc định KHÔNG ai là quản trị: /me trả admin=false, các đường khác 403 và không lộ dữ liệu', async () => {
		for (const tok of ['tokPlayer', 'tokAdmin']) {
			const me = await call<{ admin: boolean; username: string }>('/api/admin/me', tok);
			assert.equal(me.status, 200);
			assert.equal(me.data.admin, false);
		}
		const list = await call<{ error: string }>('/api/admin/characters?q=', 'tokPlayer');
		assert.equal(list.status, 403);
		assert.deepEqual(Object.keys(list.data), ['error'], 'chỉ có câu báo lỗi');
		assert.equal((await grant('tokPlayer', { characterId: hero, coins: 999, reason: REASON })).status, 403);
		assert.equal((await call('/api/admin/log', 'tokAdmin')).status, 403, 'chưa cấp quyền thì tài khoản "quan_tri" cũng như người thường');
		assert.equal(eco(hero).coins, 50);
	});

	store.setAdmin('quan_tri', true);
	store.setAdmin('kiem_thu', true);

	await test('cấp quyền xong (không khởi động lại): /me admin=true; tìm theo tên nhân vật (không phân biệt hoa thường, có dấu) / tên tài khoản; trạng thái online', async () => {
		assert.deepEqual((await call<{ admin: boolean; username: string }>('/game/api/admin/me', 'tokAdmin')).data, { admin: true, username: 'quan_tri' });
		const byName = await call<AdminCharacter[]>(`/api/admin/characters?q=${encodeURIComponent('ánh')}`, 'tokAdmin');
		assert.equal(byName.status, 200);
		assert.deepEqual(byName.data, [{ id: hero, name: 'Ánh Dương', account: 'nguoi_choi', level: 3, exp: 10, coins: 50, potions: 2, diamonds: 0, bonusPoints: 0, online: true }]);
		const byAcc = await call<AdminCharacter[]>('/api/admin/characters?q=BAN_C', 'tokAdmin');
		assert.deepEqual(
			byAcc.data.map((c) => [c.name, c.online]),
			[['Minh Khôi', false]],
		);
		const all = await call<AdminCharacter[]>('/api/admin/characters?q=', 'tokAdmin');
		assert.equal(all.data.length, 2, 'ô tìm rỗng: nhân vật lưu gần nhất');
		assert.deepEqual((await call<AdminCharacter[]>('/api/admin/characters?q=%25', 'tokAdmin')).data, [], '% là ký tự thường, không phải "tất cả"');
	});

	await test('cộng xu cho người ĐANG ONLINE: CSDL + bộ nhớ kinh tế đổi, nhận `eco` ngay (lý do kèm theo); nhật ký kinh tế + nhật ký quản trị đủ', async () => {
		const r = await grant('tokAdmin', { characterId: hero, coins: 500, reason: `  ${REASON}  ` });
		assert.equal(r.status, 200);
		assert.deepEqual(r.data.changes, [{ field: 'coins', from: 50, to: 550 }]);
		assert.equal(r.data.character.coins, 550);
		assert.equal(eco(hero).coins, 550, 'CSDL');
		assert.equal(world.economy.get(hero)?.coins, 550, 'bộ nhớ kinh tế');
		const m = ws.last('eco')!;
		assert.deepEqual([m.coins, m.gain?.reason, m.gain?.what, m.gain?.coins, m.bonusPoints], [550, 'admin', REASON, 500, 0]);
		assert.deepEqual({ ...store.ecoLedger(hero, 1)[0] }, { coins: 500, potions: 0, exp: 0, reason: `admin:quan_tri:${REASON}`, ref: null });
		const log = (await call<AdminLogEntry[]>('/api/admin/log?limit=5', 'tokAdmin')).data;
		assert.equal(log.length, 1);
		assert.deepEqual({ ...log[0], id: 0, at: 0 }, { id: 0, at: 0, admin: 'quan_tri', characterId: hero, characterName: 'Ánh Dương', field: 'coins', from: 50, to: 550, reason: REASON });
	});

	await test('bộ nhớ kinh tế đã nhận số quản trị: lần đổi kế (trả nhiệm vụ) cộng TIẾP từ đó, không ghi đè về số cũ', async () => {
		const q = questDef('y1_mushrooms')!;
		ws.push({ t: 'quest', id: 'y1_mushrooms' });
		assert.equal(eco(hero).coins, 550 + (q.reward.coins ?? 0));
		assert.equal(ws.last('eco')!.coins, 550 + (q.reward.coins ?? 0));
	});

	await test('kim cương: ví + nhật ký kim cương, người online nhận `wallet` ngay; bình + EXP (lên cấp) + điểm thưởng trong CÙNG một lần', async () => {
		const before = eco(hero);
		const gain = expForLevel(before.level) - before.exp + 5;
		const r = await grant('tokAdmin', { characterId: hero, diamonds: 7, potions: 3, exp: gain, talentPoints: 4, reason: 'Thử cộng nhiều loại' });
		assert.equal(r.status, 200);
		assert.deepEqual(
			r.data.changes.map((c) => c.field),
			['level', 'exp', 'potions', 'diamonds', 'bonusPoints'],
		);
		assert.deepEqual([eco(hero).level, eco(hero).exp, eco(hero).potions], [before.level + 1, 5, before.potions + 3]);
		assert.equal(store.diamonds(hero), 7);
		assert.equal(store.diamondLedger(hero, 1)[0]!.reason, 'admin:quan_tri:Thử cộng nhiều loại');
		assert.equal(store.bonusPoints(hero), 4);
		assert.equal(ws.last('wallet')!.diamonds, 7);
		const m = ws.last('eco')!;
		assert.deepEqual([m.level, m.exp, m.potions, m.bonusPoints, m.gain?.exp], [before.level + 1, 5, before.potions + 3, 4, gain]);
		assert.equal(store.ecoLedger(hero, 1)[0]!.exp, gain, 'nhật ký kinh tế ghi tổng EXP thay đổi');
		const log = (await call<AdminLogEntry[]>(`/api/admin/log?characterId=${hero}`, 'tokAdmin')).data;
		assert.equal(log.length, 1 + 5, 'mỗi trường đổi một dòng');
		assert.ok(log.slice(0, 5).every((e) => e.reason === 'Thử cộng nhiều loại' && e.at === log[0]!.at), 'các dòng cùng một lần chung lúc + lý do');
	});

	await test('đặt cấp: EXP về 0, client nhận ngay; trừ EXP lùi theo tổng EXP (xuống cấp được)', async () => {
		const r = await grant('tokAdmin', { characterId: hero, setLevel: 20, reason: 'Đặt cấp thử' });
		assert.equal(r.status, 200);
		assert.deepEqual([eco(hero).level, eco(hero).exp], [20, 0]);
		assert.deepEqual([ws.last('eco')!.level, ws.last('eco')!.exp], [20, 0]);
		await grant('tokAdmin', { characterId: hero, exp: -1, reason: 'Trừ 1 EXP' });
		assert.deepEqual([eco(hero).level, eco(hero).exp], [19, expForLevel(19) - 1], 'trừ 1 EXP ở đầu cấp 20 → cuối cấp 19');
		assert.equal(world.economy.get(hero)?.level, 19);
	});

	await test('gói save (WebSocket) và PUT tiến độ của client KHÔNG ghi đè điểm thưởng (kể cả gửi số to hơn); bản lưu cũ chưa có thì 0', async () => {
		const p = store.character(hero, playerAcc)!.progress;
		assert.equal(p.bonusPoints, 4, 'tiến độ gửi client (danh sách nhân vật) có điểm thưởng');
		ws.push({ t: 'save', progress: { ...p, bonusPoints: 999, level: 99, coins: 1e9 } });
		assert.equal(store.bonusPoints(hero), 4);
		store.saveProgress(hero, { ...p, bonusPoints: 0 });
		assert.equal(store.bonusPoints(hero), 4);
		const put = await call(`/api/characters/${hero}/progress`, 'tokPlayer', { method: 'PUT', body: { progress: { ...p, bonusPoints: 300 } } });
		assert.equal(put.status, 200);
		assert.equal(store.bonusPoints(hero), 4);
		// Nhân vật chưa từng được cộng: client gửi số bịa cũng không được nhận.
		store.saveProgress(away, { ...store.character(away, otherAcc)!.progress, bonusPoints: 50 });
		assert.equal(store.bonusPoints(away), 0);
	});

	await test('biên độ mỗi lần + dữ liệu sai → 400 (không đổi gì); nhân vật không có → 404', async () => {
		const snap = JSON.stringify([eco(hero), store.diamonds(hero), store.bonusPoints(hero)]);
		const bad: [Record<string, unknown>, RegExp][] = [
			[{ coins: ADMIN_LIMITS.coins + 1 }, /Xu/],
			[{ coins: -(ADMIN_LIMITS.coins + 1) }, /Xu/],
			[{ diamonds: ADMIN_LIMITS.diamonds + 1 }, /Kim cương/],
			[{ potions: 1000 }, /Bình/],
			[{ exp: ADMIN_LIMITS.exp + 1 }, /EXP/],
			[{ talentPoints: 201 }, /tiềm năng/],
			[{ coins: 1.5 }, /số nguyên/],
			[{ coins: '12abc' }, /số nguyên/],
			[{ coins: true }, /số nguyên/],
			[{ setLevel: 0 }, /Đặt cấp/],
			[{ setLevel: MAX_LEVEL + 1 }, /Đặt cấp/],
			[{ setLevel: 5.5 }, /Đặt cấp/],
			[{}, /Chưa nhập/],
			[{ coins: 0, exp: 0 }, /Chưa nhập/],
		];
		for (const [extra, msg] of bad) {
			const r = await grant('tokTester', { characterId: hero, reason: REASON, ...extra });
			assert.equal(r.status, 400, JSON.stringify(extra));
			assert.match(r.data.error ?? '', msg);
		}
		assert.match((await grant('tokTester', { characterId: hero, coins: 1 })).data.error ?? '', /lý do/, 'thiếu lý do');
		assert.match((await grant('tokTester', { characterId: hero, coins: 1, reason: '   \n ' })).data.error ?? '', /lý do/, 'lý do toàn khoảng trắng');
		assert.equal((await grant('tokTester', { characterId: hero, coins: 1, reason: 'x'.repeat(121) })).status, 400, 'lý do quá dài');
		assert.equal((await grant('tokTester', { characterId: 'khong-phai-id', coins: 1, reason: REASON })).status, 400);
		assert.equal((await grant('tokTester', { characterId: '00000000-0000-0000-0000-00000000ffff', coins: 1, reason: REASON })).status, 404);
		assert.equal(JSON.stringify([eco(hero), store.diamonds(hero), store.bonusPoints(hero)]), snap, 'không đổi gì');
	});

	await test('không bao giờ âm: trừ quá số đang có thì về 0 (nhật ký ghi đúng số thật trừ được); trừ khi đã 0 thì không có gì đổi', async () => {
		const r = await grant('tokAdmin', { characterId: hero, coins: -ADMIN_LIMITS.coins, diamonds: -ADMIN_LIMITS.diamonds, potions: -999, talentPoints: -200, reason: 'Thu hồi' });
		assert.equal(r.status, 200);
		assert.deepEqual([eco(hero).coins, eco(hero).potions, store.diamonds(hero), store.bonusPoints(hero)], [0, 0, 0, 0]);
		assert.ok(r.data.changes.every((c) => c.to === 0 && c.from > 0));
		assert.deepEqual([ws.last('wallet')!.diamonds, ws.last('eco')!.coins, ws.last('eco')!.bonusPoints], [0, 0, 0]);
		const again = await grant('tokAdmin', { characterId: hero, coins: -5, reason: 'Thu hồi lần hai' });
		assert.deepEqual([again.status, again.data.changes], [200, []], 'không có gì đổi');
		assert.equal((await call<AdminLogEntry[]>('/api/admin/log?limit=200', 'tokAdmin')).data.filter((e) => e.reason === 'Thu hồi lần hai').length, 0, 'không ghi dòng rỗng');
		// Điểm thưởng kẹp trần.
		for (let i = 0; i < 5; i += 1) await grant('tokAdmin', { characterId: hero, talentPoints: 200, reason: 'Trần điểm' });
		assert.equal(store.bonusPoints(hero), TALENT_BONUS_CAP);
		assert.equal((await grant('tokAdmin', { characterId: hero, talentPoints: -(TALENT_BONUS_CAP - 6), reason: 'Về 6' })).status, 400, 'một lần trừ tối đa 200');
		for (let i = 0; i < 5; i += 1) await grant('tokAdmin', { characterId: hero, talentPoints: -200, reason: 'Về 0' });
		await grant('tokAdmin', { characterId: hero, talentPoints: 6, reason: 'Về 6' });
		assert.equal(store.bonusPoints(hero), 6);
	});

	await test('nhân vật OFFLINE: ghi CSDL (không gửi tin cho ai); vào game sau nhận đúng số mới + điểm thưởng', async () => {
		const r = await grant('tokAdmin', { characterId: away, coins: 100, talentPoints: 3, setLevel: 12, reason: 'Quà người cũ' });
		assert.equal(r.status, 200);
		assert.equal(r.data.character.online, false);
		assert.deepEqual([eco(away).coins, eco(away).level, eco(away).exp, store.bonusPoints(away)], [1000, 12, 0, 3]);
		const ws2 = new FakeWs();
		world.accept(ws2 as never);
		ws2.push({ t: 'hello', token: 'tokOther', character: away });
		const m = ws2.last('eco')!;
		assert.deepEqual([m.coins, m.level, m.exp, m.bonusPoints], [1000, 12, 0, 3]);
		assert.equal((await call<AdminCharacter[]>('/api/admin/characters?q=minh', 'tokAdmin')).data[0]!.online, true);
		ws2.close();
	});

	await test('thu quyền có hiệu lực ngay; chặn dồn dập: quá 30 lần cộng / phút → 429', async () => {
		store.setAdmin('quan_tri', false);
		assert.equal((await grant('tokAdmin', { characterId: hero, coins: 1, reason: REASON })).status, 403);
		assert.equal((await call<{ admin: boolean }>('/api/admin/me', 'tokAdmin')).data.admin, false);
		store.setAdmin('quan_tri', true);
		const statuses: number[] = [];
		for (let i = 0; i < 32; i += 1) statuses.push((await grant('tokAdmin', { characterId: away, coins: 1, reason: 'Dồn dập' })).status);
		assert.ok(statuses.includes(429), 'có lúc bị chặn');
		assert.ok(statuses.filter((s) => s === 200).length <= 30, 'không quá 30 lần / phút');
	});
} finally {
	world.stop();
	await new Promise<void>((r) => server.close(() => r()));
	store.close();
}

// Lệnh CLI thật (tiến trình riêng, cùng CSDL thử): add / remove / list theo tên tài khoản.
{
	const root = join(dirname(fileURLToPath(import.meta.url)), '..');
	const cli = (...args: string[]) => {
		const r = spawnSync(process.execPath, ['--import', 'tsx', 'src/admin.ts', ...args], { cwd: root, env: { ...process.env, AETHER_DB: dbPath }, encoding: 'utf8' });
		return { code: r.status, out: `${r.stdout}${r.stderr}` };
	};
	const check = new Store(dbPath);
	try {
		await test('lệnh src/admin.ts: list / add / remove (gõ hoa vẫn nhận), tài khoản không có → mã lỗi, thiếu tham số → hướng dẫn', () => {
			assert.match(cli('list').out, /quan_tri/);
			let r = cli('add', 'NGUOI_CHOI');
			assert.equal(r.code, 0);
			assert.match(r.out, /Đã cấp quyền quản trị cho nguoi_choi/);
			assert.equal(check.isAdmin(playerAcc), true);
			assert.match(cli('add', 'nguoi_choi').out, /đã là quản trị từ trước/);
			const list = cli('list').out;
			assert.ok(list.indexOf('quan_tri') >= 0 && list.indexOf('nguoi_choi') > list.indexOf('quan_tri'), 'cấp trước đứng trước');
			r = cli('remove', 'nguoi_choi');
			assert.match(r.out, /Đã thu quyền/);
			assert.equal(check.isAdmin(playerAcc), false);
			r = cli('add', 'khong_co_ai');
			assert.equal(r.code, 1);
			assert.match(r.out, /Không có tài khoản "khong_co_ai"/);
			r = cli('add');
			assert.equal(r.code, 1);
			assert.match(r.out, /Cách dùng/);
		});
	} finally {
		check.close();
		rmSync(dir, { recursive: true, force: true });
	}
}

console.log(`${passed} test qua`);

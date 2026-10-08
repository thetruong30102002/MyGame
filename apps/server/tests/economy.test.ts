// Chạy: npx tsx tests/economy.test.ts — kinh tế ở máy chủ (M3.3a): cấp / EXP / xu / bình do máy chủ giữ. Gói `save` / HTTP không ghi đè
// được; quái dùng chung máy chủ tự trao (× bình EXP); quái riêng client báo chỉ nhận loại có trên map; nhiệm vụ + boss cốt truyện một lần;
// tiêu xu / uống bình có kiểm. CSDL SQLite THẬT trong thư mục tạm + World với socket giả, map thật của client.
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ServerMessage } from '@aether/protocol';
import { addExp, cleanEco } from '@aether/sim/economy';
import { mobId, type MonsterZoneDef } from '@aether/sim/mobs';
import { ENEMY_STATS, expForLevel } from '@aether/sim/skills';
import { questDef } from '@aether/sim/story/quests';
import { Store } from '../src/db.ts';
import { newProgress } from '../src/http.ts';
import { World } from '../src/world.ts';

let passed = 0;
const test = (name: string, fn: () => void): void => {
	fn();
	passed += 1;
	console.log(`  ✔ ${name}`);
};
console.log('economy (máy chủ)');

test('luật EXP dùng chung: lên cấp theo expForLevel, nhiều cấp một lần; bản lưu lạ bị kẹp', () => {
	assert.deepEqual(addExp(1, 0, expForLevel(1)), { level: 2, exp: 0, levelsGained: 1 });
	assert.deepEqual(addExp(1, 0, expForLevel(1) + expForLevel(2) + 5), { level: 3, exp: 5, levelsGained: 2 });
	assert.deepEqual(addExp(100, 0, 999), { level: 100, exp: 0, levelsGained: 0 }, 'cấp tối đa: không nhận thêm');
	assert.deepEqual(cleanEco({ level: 999, exp: -3, coins: 1e15, potions: -1 }), { level: 100, exp: 0, coins: 1e9, potions: 0 });
	assert.equal(cleanEco({ level: 3, exp: 1e9 }).exp, expForLevel(3) - 1, 'EXP thừa giữ sát mốc lên cấp');
});

class FakeWs {
	readonly OPEN = 1;
	readyState = 1;
	inbox: ServerMessage[] = [];
	private onMessage: ((raw: unknown) => void) | null = null;
	on(ev: string, cb: (raw: unknown) => void): void {
		if (ev === 'message') this.onMessage = cb;
	}
	send(raw: string): void {
		this.inbox.push(JSON.parse(raw) as ServerMessage);
	}
	close(): void {
		this.readyState = 3;
	}
	push(msg: unknown): void {
		this.onMessage?.(JSON.stringify(msg));
	}
	get eco(): Extract<ServerMessage, { t: 'eco' }> {
		return this.inbox.filter((m): m is Extract<ServerMessage, { t: 'eco' }> => m.t === 'eco').at(-1)!;
	}
}

const ZONES: MonsterZoneDef[] = [{ id: 'gy_a', x: 400, y: 400, radius: 120, monsters: ['mob_zombie_001'], count: 3, fromAge: 16 }];
const dir = mkdtempSync(join(tmpdir(), 'aether-eco-'));
const store = new Store(join(dir, 'e.db'));
let clock = 1_000_000;
const world = new World(store, (map) => (map === 'human/graveyard' ? ZONES : []), undefined, () => clock);
const acc = store.createAccount('e0', 'x')!;
store.createSession('tok', acc, 3600_000);
// Bản lưu cũ client tự ghi: cấp 3, 50 xu, 2 bình — máy chủ nhận làm số khởi đầu (một lần).
const me = store.createCharacter('00000000-0000-0000-0000-0000000000f0', acc, 'Kế Toán', 'male', { ...newProgress(), level: 3, exp: 10, coins: 50, potions: 2, map: 'human/town' })!.id;
const ws = new FakeWs();
world.accept(ws as never);
ws.push({ t: 'hello', token: 'tok', character: me });
const eco = () => store.ecoOf(me)!;

try {
	test('vào game: gửi số thật của CSDL', () => {
		assert.deepEqual([ws.eco.level, ws.eco.exp, ws.eco.coins, ws.eco.potions], [3, 10, 50, 2]);
	});

	test('gói save (WebSocket) và PUT tiến độ KHÔNG ghi đè cấp / EXP / xu / bình — vị trí, truyện vẫn lưu', () => {
		ws.push({ t: 'save', progress: { level: 99, exp: 0, coins: 999_999, potions: 999, map: 'human/town', x: 321, y: 123, story: { hack: true }, introSeen: true } });
		assert.deepEqual(eco(), { level: 3, exp: 10, coins: 50, potions: 2 });
		const p = store.character(me, acc)!.progress;
		assert.deepEqual([p.x, p.y, p.introSeen, (p.story as { hack: boolean }).hack], [321, 123, true, true]);
		store.saveProgress(me, { ...p, coins: 5e8, level: 50 });
		assert.deepEqual(eco(), { level: 3, exp: 10, coins: 50, potions: 2 });
	});

	test('quái riêng: chỉ nhận loại có trong khu riêng của map đang đứng; quái dùng chung / loại lạ / sai map bỏ', () => {
		ws.push({ t: 'kill', type: 'mob_zombie_001' });
		ws.push({ t: 'kill', type: 'boss_demon_001' });
		ws.push({ t: 'kill', type: 'khong_co' });
		assert.deepEqual(eco().coins, 50, 'Thistlewood không có quái riêng nào');
		ws.push({ t: 'map', map: 'human/mossvale' });
		ws.push({ t: 'kill', type: 'mob_mushroom_001' });
		const s = ENEMY_STATS.mob_mushroom_001!;
		assert.equal(eco().coins, 50 + s.coins, 'nấm tuổi thơ ở rừng Mossvale là quái riêng');
		assert.deepEqual([ws.eco.gain?.reason, ws.eco.gain?.exp, ws.eco.gain?.coins], ['kill', s.exp, s.coins]);
		assert.equal(store.ecoLedger(me).length, 0, 'hạ quái thường không ghi nhật ký');
	});

	test('quái riêng: trong một nhịp hồi sinh (14 giây) chỉ tính tối đa SỐ CON có thật của loại đó trên map — không cày khống', () => {
		const one = ENEMY_STATS.mob_mushroom_001!.coins;
		const before = eco().coins;
		for (let i = 0; i < 200; i += 1) ws.push({ t: 'kill', type: 'mob_mushroom_001' });
		const got = (eco().coins - before) / one;
		assert.ok(got >= 1 && got < 40, `${got} con được tính (trên map có ít con nấm riêng hơn nhiều so với 200)`);
		clock += 15_000;
		ws.push({ t: 'kill', type: 'mob_mushroom_001' });
		assert.equal(eco().coins - before, (got + 1) * one, 'qua nhịp hồi sinh thì tính tiếp');
	});

	test('boss cốt truyện: chỉ ở map của nó, trao MỘT lần; lên cấp báo kèm', () => {
		ws.push({ t: 'map', map: 'human/shrine' });
		const before = eco();
		ws.push({ t: 'kill', type: 'boss_demon_001' });
		ws.push({ t: 'kill', type: 'boss_demon_001' });
		const s = ENEMY_STATS.boss_demon_001!;
		assert.equal(eco().coins, before.coins + s.coins, 'lần hai không cộng');
		assert.ok(eco().level > before.level, 'đủ EXP để lên cấp');
		assert.ok((ws.eco.gain?.levels ?? 0) >= 1 || ws.inbox.some((m) => m.t === 'eco' && (m.gain?.levels ?? 0) >= 1));
		assert.equal(store.ecoLedger(me)[0]!.ref, 'boss:boss_demon_001');
	});

	test('nhiệm vụ: thưởng theo dữ liệu truyện của máy chủ, mỗi nhiệm vụ một lần; id lạ bỏ', () => {
		const q = questDef('y1_mushrooms')!;
		const before = eco();
		ws.push({ t: 'quest', id: 'y1_mushrooms' });
		ws.push({ t: 'quest', id: 'y1_mushrooms' });
		ws.push({ t: 'quest', id: 'khong_co' });
		assert.equal(eco().coins, before.coins + (q.reward.coins ?? 0));
		assert.equal(eco().potions, before.potions + (q.reward.potions ?? 0));
		assert.equal(store.ecoLedger(me).filter((r) => r.ref === 'quest:y1_mushrooms').length, 1);
	});

	test('tiêu xu: đủ thì trừ + nhật ký; thiếu / số bậy thì không trừ, gửi lại số thật', () => {
		const c = eco().coins;
		ws.push({ t: 'spend', reason: 'talent_reset', amount: 20 });
		assert.equal(eco().coins, c - 20);
		assert.equal(store.ecoLedger(me, 1)[0]!.reason, 'spend:talent_reset');
		ws.push({ t: 'spend', reason: 'waystone', amount: 1e9 });
		ws.push({ t: 'spend', reason: 'x', amount: -50 });
		assert.equal(eco().coins, c - 20);
		assert.equal(ws.eco.coins, c - 20, 'client nhận số thật');
	});

	test('uống bình: trừ 1; hết bình thì không âm', () => {
		const p = eco().potions;
		for (let i = 0; i < p + 2; i += 1) ws.push({ t: 'potion' });
		assert.equal(eco().potions, 0);
	});

	test('quái DÙNG CHUNG: máy chủ tự trao khi tính công, nhân bình EXP đang dùng; client báo `kill` quái dùng chung thì bỏ', () => {
		ws.push({ t: 'map', map: 'human/graveyard' });
		ws.push({ t: 'move', x: 400, y: 400, dir: 'S', anim: 'idle', sprite: 'player_hero_adult' });
		ws.push({ t: 'mobSub', on: true });
		store.addDiamonds(me, 10, 'admin:thử');
		ws.push({ t: 'move', x: 1080 - 110, y: 1272 - 10, dir: 'S', anim: 'idle', sprite: 'player_hero_adult' });
		const before = eco();
		const z = ENEMY_STATS.mob_zombie_001!;
		ws.push({ t: 'kill', type: 'mob_zombie_001' });
		assert.deepEqual(eco(), before, 'báo hạ quái dùng chung: bỏ');
		// Bình EXP ×2 (ghi thẳng bảng — mua ở quầy cần đứng cạnh Bram, đã test riêng ở shop.test).
		store.buyBuff(me, { id: 'exp2_30', price: 0, kind: 'exp', mult: 2, ms: 60_000 }, () => 1, 1e9);
		const id = mobId('human/graveyard', 'gy_a', 0);
		const m = world.mobs.mob('human/graveyard', id)!;
		ws.push({ t: 'move', x: m.x, y: m.y, dir: 'S', anim: 'idle', sprite: 'player_hero_adult' });
		ws.push({ t: 'mobHit', id, dmg: 1e6 });
		assert.equal(eco().coins, before.coins + z.coins);
		assert.equal(ws.eco.gain?.exp, z.exp * 2, 'EXP × bình ×2');
	});

	test('quà điểm danh: máy chủ cộng xu + bình (client không tự cộng nữa)', () => {
		const before = eco();
		ws.push({ t: 'checkin' });
		const g = ws.inbox.filter((m): m is Extract<ServerMessage, { t: 'gift' }> => m.t === 'gift').at(-1)!.gift;
		assert.deepEqual([eco().coins, eco().potions], [before.coins + g.coins, before.potions + g.potions]);
	});
} finally {
	world.stop();
	store.close();
	rmSync(dir, { recursive: true, force: true });
}

console.log(`${passed} test qua`);

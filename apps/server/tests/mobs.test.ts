// Chạy: npx tsx tests/mobs.test.ts — quái dùng chung (M3.2): sổ quái theo map ở máy chủ (khu dùng chung, chủ quái, vị trí,
// đòn trúng có kiểm, gục + chia công, hồi sinh) + nối vào World / CSDL thật (đếm số lần hạ). Không cần máy chủ đang chạy.
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ServerMessage } from '@havenlord/protocol';
import { isSharedZone, mobId, zoneSpawnPoints, type MonsterZoneDef } from '@havenlord/sim/mobs';
import { ENEMY_STATS } from '@havenlord/sim/skills';
import { MonsterZoneFixture } from './mobFixture.ts';
import { MobRegistry } from '../src/mobs.ts';

let passed = 0;
const test = (name: string, fn: () => void): void => {
	fn();
	passed += 1;
	console.log(`  ✔ ${name}`);
};
console.log('mobs (máy chủ)');

const ZONES: MonsterZoneDef[] = MonsterZoneFixture;
let clock = 1_000_000;
const pos: Record<string, { x: number; y: number }> = {};
const inbox: Record<string, ServerMessage[]> = {};
const kills: string[] = [];
const reg = new MobRegistry(
	{
		position: (p) => pos[p] ?? null,
		send: (p, m) => void (inbox[p] ??= []).push(m),
		credited: (p, type) => void kills.push(`${p}:${type}`),
	},
	(map) => (map === 'human/graveyard' ? ZONES : []),
	() => clock,
);
const last = <T extends ServerMessage['t']>(p: string, t: T) => (inbox[p] ?? []).filter((m): m is Extract<ServerMessage, { t: T }> => m.t === t).at(-1);

test('khu dùng chung = thế giới người lớn, không gắn nhiệm vụ; chỗ sinh tất định', () => {
	assert.equal(isSharedZone({ fromAge: 16 }), true);
	assert.equal(isSharedZone({ fromAge: 16, onDemand: true }), false);
	assert.equal(isSharedZone({}), false, 'khu tuổi thơ');
	const pts = zoneSpawnPoints(ZONES[0]!);
	assert.equal(pts.length, 3);
	assert.deepEqual(pts, zoneSpawnPoints(ZONES[0]!), 'gọi lại ra đúng toạ độ');
});

const z0 = (i: number) => mobId('human/graveyard', 'gy_a', i);
test('người đầu vào map nhận danh sách + làm chủ mọi quái; khu không dùng chung không có trong sổ', () => {
	pos.A = { x: 100, y: 100 };
	reg.subscribe('A', 'human/graveyard');
	const list = last('A', 'mobs')!.list;
	assert.equal(list.length, 3 + 1, '3 xác sống + 1 boss vùng; khu nhiệm vụ bị bỏ');
	assert.ok(list.every((m) => m.owner === 'A'));
	assert.equal(list.find((m) => m.boss)?.type, 'boss_lich_001');
	reg.subscribe('Z', 'human/town');
	assert.equal(last('Z', 'mobs'), undefined, 'map không có khu dùng chung: không gửi gì');
});

test('chủ báo vị trí → người khác nhận, chủ không bị dội lại; không phải chủ / chạy quá nhanh thì bỏ', () => {
	pos.B = { x: 900, y: 900 };
	reg.subscribe('B', 'human/graveyard');
	const m = reg.mob('human/graveyard', z0(0))!;
	clock += 500;
	reg.positions('A', [[z0(0), m.x + 10, m.y, 'E', 'walk']]);
	reg.positions('B', [[z0(1), 0, 0, 'E', 'walk']]);
	reg.positions('A', [[z0(2), 5000, 5000, 'E', 'walk']]);
	reg.tick();
	assert.deepEqual(last('B', 'mobMove')!.list, [[z0(0), m.x + 10, m.y, 'E', 'walk']]);
	assert.equal(last('A', 'mobMove'), undefined);
});

test('xin làm chủ: đổi khi mình gần quái hơn chủ cũ một khoảng', () => {
	const m = reg.mob('human/graveyard', z0(1))!;
	pos.B = { x: m.x + 5, y: m.y };
	reg.aggro('B', z0(1));
	assert.equal(reg.mob('human/graveyard', z0(1))!.owner, 'B');
	assert.deepEqual(last('A', 'mobOwner'), { t: 'mobOwner', id: z0(1), owner: 'B' });
});

test('đòn trúng: trừ máu + phát cả map; đứng quá xa / số bậy thì bỏ; gục → chia công cho người đánh trong 30 giây', () => {
	const id = z0(0);
	const m = reg.mob('human/graveyard', id)!;
	const hp = ENEMY_STATS.mob_zombie_001!.hp;
	pos.A = { x: m.x + 50, y: m.y };
	pos.B = { x: m.x - 50, y: m.y };
	reg.hit('A', id, 50);
	assert.deepEqual(last('B', 'mobHp'), { t: 'mobHp', id, hp: hp - 50, by: 'A', dmg: 50 });
	reg.hit('A', id, -5);
	reg.hit('A', id, 'nhiều');
	pos.C = { x: m.x + 5000, y: m.y };
	reg.subscribe('C', 'human/graveyard');
	reg.hit('C', id, 999);
	assert.equal(reg.mob('human/graveyard', id)!.hp, hp - 50, 'số bậy / đứng quá xa: không trừ');
	clock += 1000;
	reg.hit('B', id, 999_999);
	const die = last('A', 'mobDie')!;
	assert.deepEqual([die.id, die.by, [...die.credit].sort()], [id, 'B', ['A', 'B']], 'đánh chung cùng có phần');
	assert.deepEqual(last('B', 'mobHp')!.dmg, hp - 50, 'trừ tối đa phần máu còn lại');
	assert.deepEqual([...kills].sort(), ['A:mob_zombie_001', 'B:mob_zombie_001']);
	reg.hit('A', id, 10);
	assert.equal(last('A', 'mobHp')!.by, 'B', 'đánh xác quái: không làm gì');
});

test('hồi sinh sau 14 giây quanh chỗ canh, máu đầy, chủ = người gần nhất; boss vùng 3 phút', () => {
	const id = z0(0);
	clock += 13_000;
	reg.tick();
	assert.equal(reg.mob('human/graveyard', id)!.dead, true);
	clock += 2000;
	reg.tick();
	const back = last('A', 'mobSpawn')!.mob;
	assert.deepEqual([back.id, back.dead, back.hp], [id, false, ENEMY_STATS.mob_zombie_001!.hp]);
	assert.ok(Math.hypot(back.x - back.home.x, back.y - back.home.y) <= back.home.r);
	const boss = mobId('human/graveyard', 'gy_crypt', 0);
	const b = reg.mob('human/graveyard', boss)!;
	pos.A = { x: b.x, y: b.y };
	reg.hit('A', boss, 1e9);
	clock += 60_000;
	reg.tick();
	assert.equal(reg.mob('human/graveyard', boss)!.dead, true, 'boss vùng chưa dậy sau 1 phút');
	clock += 121_000;
	reg.tick();
	assert.equal(reg.mob('human/graveyard', boss)!.dead, false);
});

test('chủ rời map: quái chuyển cho người gần nhất còn lại; không còn ai thì để trống, người vào sau nhận', () => {
	reg.unsubscribe('B');
	assert.equal(reg.mob('human/graveyard', z0(1))!.owner === 'B', false);
	reg.unsubscribe('A');
	reg.unsubscribe('C');
	assert.equal(reg.mob('human/graveyard', z0(1))!.owner, null);
	reg.subscribe('A', 'human/graveyard');
	assert.equal(reg.mob('human/graveyard', z0(1))!.owner, 'A');
});

test('động tác đánh (M3.2b): chỉ chủ phát được, người khác nhận, chủ không bị dội lại; nổ xa quái / tin hỏng thì bỏ', () => {
	const id = z0(1);
	const m = reg.mob('human/graveyard', id)!;
	assert.equal(m.owner, 'A');
	pos.A = { x: m.x + 20, y: m.y };
	pos.B = { x: m.x + 40, y: m.y };
	reg.subscribe('B', 'human/graveyard');
	inbox.A = [];
	inbox.B = [];
	reg.act('A', id, { k: 'wind', dir: 'E', s: 0.3 });
	reg.act('A', id, { k: 'melee', x: m.x + 5, y: m.y, nx: 3, ny: 4 });
	reg.act('B', id, { k: 'melee', x: m.x, y: m.y, nx: 1, ny: 0 });
	reg.act('A', id, { k: 'melee', x: m.x + 500, y: m.y, nx: 1, ny: 0 });
	reg.act('A', id, { k: 'wind', dir: 'UP', s: 0.3 });
	reg.act('A', id, { k: 'shot', x: m.x, y: m.y, nx: 0, ny: 0 });
	reg.act('A', id, { k: 'heal', x: m.x, y: m.y });
	reg.act('A', id, { k: 'aoe', x: m.x + 300, y: m.y });
	const acts = (inbox.B ?? []).flatMap((x) => (x.t === 'mobAct' ? [x.act] : []));
	assert.deepEqual(acts, [
		{ k: 'wind', dir: 'E', s: 0.3 },
		{ k: 'melee', x: m.x + 5, y: m.y, nx: 0.6, ny: 0.8 },
		{ k: 'aoe', x: m.x + 300, y: m.y },
	], 'người không làm chủ / nổ xa quái / hướng bậy / loại lạ: bỏ; hướng được chuẩn hoá');
	assert.equal(last('A', 'mobAct'), undefined, 'chủ không bị dội lại');
});

test('khống chế (M3.2b): người đứng gần gửi được, kẹp trần, khoá lạ bỏ; phát cho mọi người khác (cả chủ)', () => {
	const id = z0(1);
	const m = reg.mob('human/graveyard', id)!;
	inbox.A = [];
	inbox.B = [];
	reg.cc('B', id, { freeze: 99, stun: 0.5, burn: 3, slow: 2, slowMult: 0.01, push: [99999, 0, 5] });
	assert.deepEqual(last('A', 'mobCc'), { t: 'mobCc', id, cc: { freeze: 5, stun: 0.5, slow: 2, slowMult: 0.1, push: [2000, 0, 0.3] } });
	assert.equal(last('B', 'mobCc'), undefined, 'không dội lại người gửi');
	reg.cc('A', id, { burn: 2, wet: 3 });
	assert.equal(last('B', 'mobCc'), undefined, 'chỉ có khoá không đồng bộ: không gửi gì');
	pos.B = { x: m.x + 5000, y: m.y };
	reg.cc('B', id, { stun: 1 });
	assert.equal((inbox.A ?? []).filter((x) => x.t === 'mobCc').length, 1, 'đứng quá xa: bỏ');
	reg.unsubscribe('B');
});

// Nối vào World + CSDL thật: tin `mobSub` / `mobHit` đi qua WebSocket giả, số lần hạ ghi vào bảng `kill_counts`.
{
	const { Store } = await import('../src/db.ts');
	const { World } = await import('../src/world.ts');
	const { newProgress } = await import('../src/http.ts');
	const dir = mkdtempSync(join(tmpdir(), 'havenlord-mobs-'));
	const store = new Store(join(dir, 'm.db'));
	const world = new World(store, (map) => (map === 'human/graveyard' ? ZONES : []));
	try {
		test('qua World: bật nhận quái của map đang đứng, đánh gục → máy chủ đếm vào CSDL', () => {
			const acc = store.createAccount('u', 'x')!;
			store.createSession('tok', acc, 3600_000);
			const ch = store.createCharacter('00000000-0000-0000-0000-0000000000aa', acc, 'Thử Quái', 'male', { ...newProgress(), map: 'human/graveyard', x: 100, y: 100 })!;
			const got: ServerMessage[] = [];
			let onMsg: ((raw: unknown) => void) | null = null;
			const ws = { OPEN: 1, readyState: 1, send: (raw: string) => void got.push(JSON.parse(raw) as ServerMessage), close: () => undefined, on: (ev: string, cb: (raw: unknown) => void) => void (ev === 'message' && (onMsg = cb)) };
			world.accept(ws as never);
			const push = (m: unknown) => onMsg!(JSON.stringify(m));
			push({ t: 'hello', token: 'tok', character: ch.id });
			push({ t: 'move', x: 100, y: 100, dir: 'S', anim: 'idle', sprite: 'player_hero_adult' });
			push({ t: 'mobSub', on: true });
			const mobs = got.find((m): m is Extract<ServerMessage, { t: 'mobs' }> => m.t === 'mobs');
			assert.ok(mobs && mobs.list.length === 4);
			const target = mobs.list[0]!;
			push({ t: 'move', x: target.x, y: target.y, dir: 'S', anim: 'idle', sprite: 'player_hero_adult' });
			push({ t: 'mobHit', id: target.id, dmg: 1e6 });
			assert.ok(got.some((m) => m.t === 'mobDie' && m.id === target.id));
			assert.deepEqual(store.killCounts(ch.id), { mob_zombie_001: 1 });
		});
	} finally {
		world.stop();
		store.close();
		rmSync(dir, { recursive: true, force: true });
	}
}

console.log(`${passed} test qua`);

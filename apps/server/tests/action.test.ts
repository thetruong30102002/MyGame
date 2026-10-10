// Chạy: npx tsx tests/action.test.ts — tin `action` mang phần CHIÊU (người chơi thấy chiêu của nhau, chủ dự án 09/10/2026),
// KHÔNG cần máy chủ đang chạy: dựng `World` với kho dữ liệu giả và socket giả. Kiểm: mã chiêu phải có thật, phần chiêu chuẩn hoá
// + kẹp điểm nhắm quanh người gửi, tin sai thì bỏ phần chiêu im lặng (động tác thân vẫn đi), chỉ người CÙNG map nhận, không dội
// về người gửi, giới hạn nhịp giữ nguyên; client cũ (không gửi `fx`) vẫn như trước.
import assert from 'node:assert/strict';
import type { CharacterInfo, ServerMessage } from '@aether/protocol';
import { HERO_SKILLS } from '@aether/sim/skills';
import { AIM_SLACK, cleanCast, FX_COOLDOWN_RATIO, fxAllowed } from '../src/actions.ts';
import type { Store } from '../src/db.ts';
import { World } from '../src/world.ts';

let passed = 0;
const test = (name: string, fn: () => void): void => {
	fn();
	passed += 1;
	console.log(`  ✔ ${name}`);
};
console.log('action (máy chủ — thấy chiêu của nhau)');

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
	of<T extends ServerMessage['t']>(t: T): Extract<ServerMessage, { t: T }>[] {
		return this.inbox.filter((m): m is Extract<ServerMessage, { t: T }> => m.t === t);
	}
}

const chars: Record<string, CharacterInfo> = {};
for (const [id, name] of [['c1', 'An'], ['c2', 'Binh'], ['c3', 'Cuong']] as const) {
	chars[id] = { id, name, gender: 'male', createdAt: 0, progress: { level: 20, exp: 0, coins: 0, potions: 0, map: 'human/town', x: 100, y: 100, story: null, introSeen: true } };
}
const store = {
	sessionAccount: (token: string) => ({ accountId: Number(token.slice(1)), username: token }),
	character: (id: string) => chars[id] ?? null,
	saveProgress: () => {},
	brief: (id: string) => (chars[id] ? { id, name: chars[id].name, level: chars[id].progress.level } : null),
	friendIds: () => [],
	requests: () => [],
	blockedIds: () => [],
	takeWhispers: () => [],
	diamonds: () => 0,
	checkinState: () => ({ lastDay: null, streak: 0, total: 0 }),
	checkinDays: () => [],
	ecoOf: () => ({ level: 20, exp: 0, coins: 0, potions: 0 }),
	saveEco: () => true,
	visit: () => {},
	buffs: () => [],
	spendBuffs: () => 0,
} as unknown as Store;

const meteor = HERO_SKILLS.find((s) => s.id === 'meteor')!;
const slash = HERO_SKILLS.find((s) => s.id === 'slash')!;

test('fxAllowed: cùng một chiêu phát hình lại sớm hơn tỉ lệ × hồi chiêu gốc thì bị bỏ; chiêu khác tính riêng; mã lạ luôn bỏ', () => {
	const heavy = HERO_SKILLS.reduce((a, b) => (b.cooldown > a.cooldown ? b : a));
	const other = HERO_SKILLS.find((s) => s.id !== heavy.id)!;
	const gap = heavy.cooldown * 1000 * FX_COOLDOWN_RATIO;
	const last = new Map<string, number>();
	assert.equal(fxAllowed(last, heavy.id, 10_000), true);
	assert.equal(fxAllowed(last, heavy.id, 10_000 + gap - 1), false, 'spam chiêu nặng trong hồi chiêu');
	assert.equal(fxAllowed(last, other.id, 10_001), true, 'chiêu khác không dính hồi chiêu của chiêu kia');
	assert.equal(fxAllowed(last, heavy.id, 10_000 + gap), true);
	assert.equal(fxAllowed(last, 'khong_co_chieu_nay', 99_999), false);
});

test('cleanCast: mã chiêu lạ → skill rỗng, không phần chiêu; mã thật mà không có / hỏng phần chiêu → chỉ mã', () => {
	assert.deepEqual(cleanCast('dance', { ax: 1, ay: 0 }, { x: 0, y: 0 }), { skill: '' });
	assert.deepEqual(cleanCast(42, { ax: 1, ay: 0 }, { x: 0, y: 0 }), { skill: '' });
	assert.deepEqual(cleanCast(undefined, undefined, { x: 0, y: 0 }), { skill: '' });
	assert.deepEqual(cleanCast('slash', undefined, { x: 0, y: 0 }), { skill: 'slash' }, 'client cũ: không có phần chiêu');
	assert.deepEqual(cleanCast('slash', { ax: Number.NaN, ay: 0 }, { x: 0, y: 0 }), { skill: 'slash' });
	assert.deepEqual(cleanCast('meteor', { ax: 1, ay: 0, tx: 1e12, ty: 5 }, { x: 0, y: 0 }), { skill: 'meteor' }, 'toạ độ vô lý → bỏ cả phần chiêu');
});

test('cleanCast: kẹp điểm nhắm trong tầm chiêu + chừa trễ quanh vị trí máy chủ giữ; chiêu không đặt vùng thì bỏ điểm nhắm', () => {
	const far = cleanCast('meteor', { ax: 1, ay: 0, tx: 5000, ty: 1000 }, { x: 1000, y: 1000 }).fx!;
	assert.deepEqual([far.tx, far.ty], [1000 + meteor.range! + AIM_SLACK, 1000]);
	const near = cleanCast('meteor', { ax: 1, ay: 0, tx: 1100, ty: 1050 }, { x: 1000, y: 1000 }).fx!;
	assert.deepEqual([near.tx, near.ty], [1100, 1050], 'trong tầm thì giữ nguyên');
	const bolt = cleanCast('fire_bolt', { ax: 0.6, ay: 0.8, tx: 1100, ty: 1050 }, { x: 1000, y: 1000 }).fx!;
	assert.deepEqual(bolt, { ax: 0.6, ay: 0.8 });
});

test('cleanCast: hệ phủ phép lạ bỏ riêng trường đó; hồi chiêu dài hơn gốc (số bịa) bỏ', () => {
	assert.deepEqual(cleanCast('slash', { ax: 1, ay: 0, el: 'shadow', cd: 0.3 }, { x: 0, y: 0 }).fx, { ax: 1, ay: 0, cd: 0.3 });
	assert.deepEqual(cleanCast('slash', { ax: 1, ay: 0, el: 'ice', cd: slash.cooldown + 5 }, { x: 0, y: 0 }).fx, { ax: 1, ay: 0, el: 'ice' });
});

const world = new World(store);
const join = (id: string): FakeWs => {
	const ws = new FakeWs();
	world.accept(ws as never);
	ws.push({ t: 'hello', token: `t${id.slice(1)}`, character: id });
	return ws;
};
const move = (ws: FakeWs, x: number, y = 100) => ws.push({ t: 'move', x, y, dir: 'S', anim: 'idle', sprite: 'player_hero_adult' });

try {
	const a = join('c1');
	const b = join('c2');
	const c = join('c3');
	move(a, 100);
	move(b, 140);
	c.push({ t: 'map', map: 'human/mossvale' });
	move(c, 300);
	const last = () => b.of('action').at(-1);

	test('B thấy chiêu của A: tin có mã chiêu thật + phần chiêu hợp lệ được chuyển (đã chuẩn hoá), không dội về A, khác map không nhận', () => {
		a.push({ t: 'action', anim: 'cast', dir: 'E', skill: 'fire_bolt', fx: { ax: 3, ay: 4, junk: 'x' } });
		assert.deepEqual(last(), { t: 'action', id: 'c1', anim: 'cast', dir: 'E', skill: 'fire_bolt', fx: { ax: 0.6, ay: 0.8 } });
		assert.equal(a.of('action').length, 0, 'không dội về người gửi');
		assert.equal(c.of('action').length, 0, 'người ở map khác không nhận');
	});

	test('chiêu đặt vùng: điểm nhắm xa quá tầm bị kẹp lại quanh vị trí A trên máy chủ', () => {
		a.push({ t: 'action', anim: 'skycall', dir: 'E', skill: 'meteor', fx: { ax: 1, ay: 0, tx: 9000, ty: 100, el: 'fire' } });
		const m = last()!;
		assert.deepEqual([m.skill, m.fx?.tx, m.fx?.ty], ['meteor', 100 + meteor.range! + AIM_SLACK, 100]);
		assert.equal(m.fx?.el, 'fire', 'hệ thật thì giữ (máy nhận tự xét chiêu đó có mang phủ phép không)');
	});

	test('skill lạ / toạ độ vô lý: bỏ phần chiêu im lặng — động tác thân vẫn tới B như luật cũ', () => {
		a.push({ t: 'action', anim: 'attack', dir: 'E', skill: 'hack_all', fx: { ax: 1, ay: 0 } });
		assert.deepEqual(last(), { t: 'action', id: 'c1', anim: 'attack', dir: 'E', skill: '' });
		a.push({ t: 'action', anim: 'skycall', dir: 'E', skill: 'meteor', fx: { ax: 1, ay: 0, tx: Number.MAX_VALUE, ty: -1 } });
		assert.deepEqual(last(), { t: 'action', id: 'c1', anim: 'skycall', dir: 'E', skill: 'meteor' });
		a.push({ t: 'action', anim: 'attack', dir: 'E', skill: 'slash', fx: 'boom' });
		assert.deepEqual(last(), { t: 'action', id: 'c1', anim: 'attack', dir: 'E', skill: 'slash' });
		const n = b.of('action').length;
		a.push({ t: 'action', anim: 'dance', dir: 'E', skill: 'slash', fx: { ax: 1, ay: 0 } });
		assert.equal(b.of('action').length, n, 'động tác lạ: bỏ cả tin như cũ');
	});

	test('tin dừng: `hit` (đòn đã qua khung chạm) chỉ chuyển khi đúng true; không dội về người gửi, khác map không nhận', () => {
		const ends = () => b.of('actionEnd');
		a.push({ t: 'actionEnd', hit: true });
		assert.deepEqual(ends().at(-1), { t: 'actionEnd', id: 'c1', hit: true });
		for (const hit of ['yes', 1, false, undefined]) {
			a.push({ t: 'actionEnd', hit });
			assert.deepEqual(ends().at(-1), { t: 'actionEnd', id: 'c1' }, `hit = ${String(hit)}`);
		}
		assert.equal(a.of('actionEnd').length, 0, 'không dội về người gửi');
		assert.equal(c.of('actionEnd').length, 0, 'người ở map khác không nhận');
	});

	test('client CŨ (không gửi fx): tin như trước, không có trường fx', () => {
		a.push({ t: 'action', anim: 'attack', dir: 'W', skill: 'slash' });
		assert.deepEqual(last(), { t: 'action', id: 'c1', anim: 'attack', dir: 'W', skill: 'slash' });
	});

	test('giới hạn nhịp giữ nguyên: dồn 20 tin có chiêu trong một giây, B nhận ≤ 8', () => {
		const a2 = join('c1');
		move(a2, 100);
		const before = b.of('action').length;
		for (let i = 0; i < 20; i += 1) a2.push({ t: 'action', anim: 'attack', dir: 'E', skill: 'slash', fx: { ax: 1, ay: 0 } });
		const got = b.of('action').length - before;
		assert.ok(got >= 1 && got <= 8, `B nhận ${got}`);
	});
} finally {
	world.stop();
}
console.log(`${passed} test qua`);

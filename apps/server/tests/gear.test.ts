// Chạy: npx tsx tests/gear.test.ts — đồ gắn qua mạng (tin `gear`), KHÔNG cần máy chủ đang chạy: dựng `World` với kho dữ
// liệu giả và socket giả. Kiểm tương thích ngược hai chiều: client cũ (không gửi `gear`) với máy chủ mới, và gói `gear`
// sai dạng bị bỏ.
import assert from 'node:assert/strict';
import { cleanGearView, GEAR_VIEW_SLOTS, type CharacterInfo, type ServerMessage } from '@havenlord/protocol';
import type { Store } from '../src/db.ts';
import { World } from '../src/world.ts';

let passed = 0;
const test = (name: string, fn: () => void): void => {
	fn();
	passed += 1;
	console.log(`  ✔ ${name}`);
};
console.log('gear (máy chủ)');

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
	// Xã hội (World gọi lúc vào game / đổi map / rời đi): không bạn, không lời mời, không tin chờ.
	brief: (id: string) => (chars[id] ? { id, name: chars[id].name, level: chars[id].progress.level } : null),
	friendIds: () => [],
	requests: () => [],
	blockedIds: () => [],
	takeWhispers: () => [],
	// Ví + điểm danh (K1): ví rỗng, chưa điểm danh, thám hiểm không ghi.
	diamonds: () => 0,
	checkinState: () => ({ lastDay: null, streak: 0, total: 0 }),
	checkinDays: () => [],
	ecoOf: () => ({ level: 20, exp: 0, coins: 0, potions: 0 }),
	bonusPoints: () => 0,
	saveEco: () => true,
	visit: () => {},
	buffs: () => [],
	spendBuffs: () => 0,
} as unknown as Store;

const world = new World(store);
const join = (id: string): FakeWs => {
	const ws = new FakeWs();
	world.accept(ws as never);
	ws.push({ t: 'hello', token: `t${id.slice(1)}`, character: id });
	return ws;
};
const move = (ws: FakeWs, x: number) => ws.push({ t: 'move', x, y: 100, dir: 'S', anim: 'idle', sprite: 'player_hero_adult' });

try {
	test('cleanGearView: đúng số ô, ô sai dạng thành trống, quá số ô / không phải mảng → null', () => {
		assert.deepEqual(cleanGearView(['', 'sword', 'staff:2']), ['', 'sword', 'staff:2', '']);
		assert.deepEqual(cleanGearView(['Sword', 'a b', 'x:9', 'y'.repeat(25)]), ['', '', '', '']);
		assert.equal(cleanGearView(new Array(GEAR_VIEW_SLOTS.length + 1).fill('')), null);
		assert.equal(cleanGearView('sword'), null);
		assert.equal(cleanGearView(undefined), null);
		assert.deepEqual(cleanGearView([1, null, { id: 'x' }]), ['', '', '', '']);
	});

	const a = join('c1');
	const b = join('c2');
	test('client CŨ (không gửi gear): vẫn vào map, `join` không có trường gear — không lỗi', () => {
		move(b, 120);
		move(a, 100);
		const j = b.of('join').find((m) => m.player.id === 'c1');
		assert.ok(j, 'B thấy A vào map');
		assert.equal(j.player.gear, undefined);
	});

	test('client MỚI gửi gear: người cùng map nhận tin gear đã chuẩn hoá, người gửi không bị dội lại', () => {
		a.push({ t: 'gear', gear: ['', 'sword', 'staff:3'] });
		const g = b.of('gear').at(-1);
		assert.deepEqual(g, { t: 'gear', id: 'c1', gear: ['', 'sword', 'staff:3', ''] });
		assert.equal(a.of('gear').length, 0);
	});

	test('gửi lại y hệt không phát lại; gói sai dạng / thừa ô bị bỏ, đồ cũ giữ nguyên', () => {
		const before = b.of('gear').length;
		a.push({ t: 'gear', gear: ['', 'sword', 'staff:3', ''] });
		a.push({ t: 'gear', gear: 'sword' });
		a.push({ t: 'gear', gear: ['', '', '', '', 'x'] });
		a.push({ t: 'gear' });
		assert.equal(b.of('gear').length, before);
	});

	test('người vào sau nhận đồ của người đang ở map qua welcome; đồ gửi TRƯỚC gói vị trí đầu đi kèm tin join', () => {
		const c = join('c3');
		const w = c.of('welcome').at(-1)!;
		assert.deepEqual(w.players.find((p) => p.id === 'c1')?.gear, ['', 'sword', 'staff:3', '']);
		c.push({ t: 'gear', gear: ['hat_straw', '', '', ''] });
		assert.equal(b.of('gear').filter((m) => m.id === 'c3').length, 0, 'chưa vào map thì chưa phát');
		move(c, 140);
		assert.deepEqual(b.of('join').find((m) => m.player.id === 'c3')?.player.gear, ['hat_straw', '', '', '']);
	});

	test('đổi map giữ đồ: sang map mới người ở đó thấy đồ trong tin join', () => {
		a.push({ t: 'map', map: 'human/mossvale' });
		move(a, 300);
		const c2 = join('c2');
		c2.push({ t: 'map', map: 'human/mossvale' });
		const w = c2.of('welcome').at(-1)!;
		assert.deepEqual(w.players.find((p) => p.id === 'c1')?.gear, ['', 'sword', 'staff:3', '']);
	});
} finally {
	world.stop();
}
console.log(`${passed} test qua`);

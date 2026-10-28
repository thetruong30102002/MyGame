// Chạy: npx tsx tests/rewards.test.ts — ví kim cương, điểm danh, thành tựu ở Bia Danh Vọng (K1 — docs/ke-hoach-kim-cuong.md).
// Luật thuần (`@havenlord/sim/rewards`) + CSDL SQLite THẬT trong thư mục tạm + World với socket giả và đồng hồ giả (sang ngày theo
// giờ Việt Nam). Map đọc từ thư mục map thật của client. Không cần máy chủ đang chạy.
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ServerMessage } from '@havenlord/protocol';
import { checkinGift, checkinSlot, CHRONICLER, dayBefore, GOALS, killStats, nextStreak, vnDay } from '@havenlord/sim/rewards';
import { Store } from '../src/db.ts';
import { newProgress } from '../src/http.ts';
import { World } from '../src/world.ts';

let passed = 0;
const test = (name: string, fn: () => void): void => {
	fn();
	passed += 1;
	console.log(`  ✔ ${name}`);
};
console.log('rewards (máy chủ)');

test('ngày theo giờ Việt Nam: 17:00 UTC là sang ngày mới; ngày liền trước qua tháng / năm', () => {
	assert.equal(vnDay(Date.UTC(2026, 9, 8, 16, 59, 59)), '2026-10-08');
	assert.equal(vnDay(Date.UTC(2026, 9, 8, 17, 0, 0)), '2026-10-09');
	assert.equal(dayBefore('2026-03-01'), '2026-02-28');
	assert.equal(dayBefore('2027-01-01'), '2026-12-31');
});

test('quà điểm danh: luôn 1 kim cương, xu tăng theo ngày trong vòng 7, ngày 7 thêm bình; ngày 8 quay về ngày 1', () => {
	assert.deepEqual(checkinGift(1), { diamonds: 1, coins: 30, potions: 1 });
	assert.deepEqual(checkinGift(7), { diamonds: 1, coins: 90, potions: 3 });
	assert.deepEqual([checkinSlot(8), checkinSlot(14), checkinSlot(15)], [1, 7, 1]);
	assert.deepEqual(checkinGift(8), checkinGift(1));
	assert.equal(nextStreak('2026-10-07', 4, '2026-10-08'), 5, 'hôm qua có điểm danh: nối chuỗi');
	assert.equal(nextStreak('2026-10-06', 4, '2026-10-08'), 1, 'bỏ một ngày: về 1');
	assert.equal(nextStreak(null, 0, '2026-10-08'), 1);
});

test('đếm quái / boss từ bảng số lần hạ; mọi mục tiêu có id riêng, mốc dương', () => {
	assert.deepEqual(killStats({ mob_zombie_001: 7, mob_mushroom_001: 3, boss_lich_001: 2 }), { kills: 10, bosses: 2 });
	assert.equal(new Set(GOALS.map((g) => g.id)).size, GOALS.length);
	assert.ok(GOALS.every((g) => g.target > 0 && g.diamonds > 0));
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
	last<T extends ServerMessage['t']>(t: T): Extract<ServerMessage, { t: T }> | undefined {
		return this.inbox.filter((m): m is Extract<ServerMessage, { t: T }> => m.t === t).at(-1);
	}
	count(t: ServerMessage['t']): number {
		return this.inbox.filter((m) => m.t === t).length;
	}
}

const dir = mkdtempSync(join(tmpdir(), 'aether-rewards-'));
const store = new Store(join(dir, 'r.db'));
// 10:00 sáng 08/10/2026 giờ Việt Nam.
let clock = Date.UTC(2026, 9, 8, 3, 0, 0);
const DAY = 86_400_000;
const world = new World(store, () => [], undefined, () => clock);
const ids: string[] = [];
for (const [i, name] of ['An', 'Bình'].entries()) {
	const acc = store.createAccount(`r${i}`, 'x')!;
	store.createSession(`tok${i}`, acc, 3600_000);
	ids.push(store.createCharacter(`00000000-0000-0000-0000-0000000000b${i}`, acc, name, 'male', newProgress())!.id);
}
const [an, binh] = ids as [string, string];
const join_ = (i: number): FakeWs => {
	const ws = new FakeWs();
	world.accept(ws as never);
	ws.push({ t: 'hello', token: `tok${i}`, character: ids[i] });
	return ws;
};

try {
	test('ví: cộng / trừ có nhật ký; trừ quá số dư bị từ chối; cùng `ref` không cộng hai lần', () => {
		assert.equal(store.diamonds(an), 0);
		assert.equal(store.addDiamonds(an, 5, 'admin:thử', 'nap:001'), 5);
		assert.equal(store.addDiamonds(an, 5, 'admin:thử', 'nap:001'), null, 'webhook gửi lặp');
		assert.equal(store.addDiamonds(an, -9, 'mua'), null);
		assert.equal(store.addDiamonds(an, -5, 'admin:trả lại'), 0);
		assert.deepEqual(store.diamondLedger(an).map((r) => [r.delta, r.balance]), [[-5, 0], [5, 5]]);
	});

	const a = join_(0);
	test('vào game: nhận số dư ví + điểm danh hôm nay (chưa điểm danh, quà ngày 1)', () => {
		assert.deepEqual(a.last('wallet'), { t: 'wallet', diamonds: 0 });
		assert.deepEqual(a.last('daily')!.daily, { day: '2026-10-08', done: false, streak: 0, next: checkinGift(1), month: [] });
	});

	test('điểm danh: quà + ví + trạng thái mới; lần hai trong ngày bị chặn, không cộng thêm', () => {
		a.push({ t: 'checkin' });
		assert.deepEqual(a.last('gift'), { t: 'gift', reason: 'checkin', title: 'Điểm danh ngày 1', gift: checkinGift(1) });
		assert.deepEqual(a.last('wallet'), { t: 'wallet', diamonds: 1 });
		assert.deepEqual(a.last('daily')!.daily, { day: '2026-10-08', done: true, streak: 1, next: checkinGift(2), month: ['2026-10-08'] });
		a.push({ t: 'checkin' });
		assert.equal(a.count('gift'), 1);
		assert.match(a.last('system')!.text, /đã điểm danh rồi/);
		assert.equal(store.diamonds(an), 1);
	});

	test('sang ngày lúc 0 giờ giờ Việt Nam: nối chuỗi; bỏ một ngày thì chuỗi đứt, lần sau lại từ ngày 1', () => {
		clock = Date.UTC(2026, 9, 8, 17, 5, 0); // 00:05 ngày 09/10 giờ VN
		a.push({ t: 'checkin' });
		assert.equal(a.last('gift')!.title, 'Điểm danh ngày 2');
		assert.deepEqual(a.last('gift')!.gift, checkinGift(2));
		clock += 2 * DAY; // bỏ ngày 10/10
		const again = join_(0);
		assert.deepEqual([again.last('daily')!.daily.streak, again.last('daily')!.daily.done], [0, false], 'chuỗi đã đứt hiện 0');
		again.push({ t: 'checkin' });
		assert.equal(again.last('gift')!.title, 'Điểm danh ngày 1');
		assert.equal(store.diamonds(an), 3, 'mỗi ngày đúng 1 kim cương');
		assert.deepEqual(store.checkinState(an), { lastDay: '2026-10-11', streak: 1, total: 3 });
		assert.deepEqual(again.last('daily')!.daily.month, ['2026-10-08', '2026-10-09', '2026-10-11'], 'khung lịch: các ngày đã điểm danh trong tháng');
	});

	const b = join_(1);
	test('thám hiểm: đếm map có thật mỗi map một lần; map tổng / map không có file không tính', () => {
		for (const m of ['human/mossvale', 'human/graveyard', 'human/world', 'human/nowhere', 'human/mossvale', 'human/bonehills']) b.push({ t: 'map', map: m });
		assert.equal(store.visitedCount(binh), 4, 'town (lúc vào game) + mossvale + graveyard + bonehills');
		b.push({ t: 'goals' });
		const maps5 = b.last('goals')!.list.find((g) => g.id === 'maps_5')!;
		assert.deepEqual(maps5, { id: 'maps_5', progress: 4, claimed: false });
	});

	test('nhận quà thành tựu: phải đứng cạnh Bia Danh Vọng ở Thistlewood và đã đạt mốc; nhận rồi không nhận lại', () => {
		for (let i = 0; i < 100; i += 1) store.addKill(binh, 'mob_zombie_001');
		b.push({ t: 'goalClaim', id: 'kills_100' });
		assert.match(b.last('system')!.text, /Bia Danh Vọng/, 'đang ở Đồi Xương');
		b.push({ t: 'map', map: 'human/town' });
		b.push({ t: 'move', x: 300, y: 300, dir: 'S', anim: 'idle', sprite: 'player_hero_adult' });
		b.push({ t: 'goalClaim', id: 'kills_100' });
		assert.match(b.last('system')!.text, /Bia Danh Vọng/, 'cùng map nhưng đứng xa bia');
		assert.equal(b.count('gift'), 0);
		b.push({ t: 'map', map: 'human/shrine' });
		b.push({ t: 'map', map: 'human/town' });
		// Gói vị trí đầu ở map mới đặt tự do: đứng ngay cạnh bia (toạ độ = địa điểm `plaza` + lệch của bia).
		b.push({ t: 'move', x: 1080 + CHRONICLER.dx, y: 1272 + CHRONICLER.dy + 30, dir: 'N', anim: 'idle', sprite: 'player_hero_adult' });
		b.push({ t: 'goalClaim', id: 'kills_1k' });
		assert.match(b.last('system')!.text, /Chưa đạt mục tiêu "Hạ 1.000 quái"/);
		b.push({ t: 'goalClaim', id: 'kills_100' });
		assert.deepEqual(b.last('gift'), { t: 'gift', reason: 'goal', title: 'Hạ 100 quái', gift: { diamonds: 1, coins: 0, potions: 0 } });
		b.push({ t: 'goalClaim', id: 'maps_5' });
		assert.equal(b.last('gift')!.title, 'Đặt chân tới 5 map', 'town · mossvale · graveyard · bonehills · shrine');
		b.push({ t: 'goalClaim', id: 'kills_100' });
		b.push({ t: 'goalClaim', id: 'khong_co' });
		assert.equal(b.count('gift'), 2, 'nhận lại / mục tiêu lạ: không gì');
		assert.equal(store.diamonds(binh), 2);
		const list = b.last('goals')!.list;
		assert.deepEqual(list.filter((g) => g.claimed).map((g) => g.id).sort(), ['kills_100', 'maps_5']);
		assert.equal(list.find((g) => g.id === 'kills_100')!.progress, 100);
	});

	test('bạn bè: tiến độ = số bạn hiện có', () => {
		store.addFriendship(an, binh);
		b.push({ t: 'goals' });
		assert.equal(b.last('goals')!.list.find((g) => g.id === 'friends_1')!.progress, 1);
		b.push({ t: 'goalClaim', id: 'friends_1' });
		assert.equal(b.last('gift')!.title, 'Kết người bạn đầu tiên');
		assert.equal(b.last('wallet')!.diamonds, 3);
	});
} finally {
	world.stop();
	store.close();
	rmSync(dir, { recursive: true, force: true });
}

console.log(`${passed} test qua`);

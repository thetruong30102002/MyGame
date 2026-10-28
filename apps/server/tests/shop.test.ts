// Chạy: npx tsx tests/shop.test.ts — Cửa hàng kim cương + bình thời hạn (K1 — docs/ke-hoach-kim-cuong.md). CSDL SQLite THẬT trong
// thư mục tạm + World với socket giả và đồng hồ giả; nhịp trừ giờ gọi tay (`world.shop.tick()`). Không cần máy chủ đang chạy.
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ServerMessage } from '@havenlord/protocol';
import { BUFF_MAX_MS, buffLabel, buffMults, fmtRemaining, MERCHANT, SHOP } from '@havenlord/sim/shop';
import { Store } from '../src/db.ts';
const price = (id: string): number => SHOP.find((x) => x.id === id)!.price;
import { newProgress } from '../src/http.ts';
import { World } from '../src/world.ts';

let passed = 0;
const test = (name: string, fn: () => void): void => {
	fn();
	passed += 1;
	console.log(`  ✔ ${name}`);
};
console.log('shop (máy chủ)');

test('danh mục: id riêng, giá dương; nhãn HUD + đồng hồ', () => {
	assert.equal(new Set(SHOP.map((x) => x.id)).size, SHOP.length);
	assert.ok(SHOP.every((x) => x.price > 0 && x.buff.minutes > 0));
	assert.deepEqual([buffLabel('exp', 3), buffLabel('dmg', 1.2), buffLabel('guard', 0.9)], ['EXP ×3', 'Công +20%', 'Thủ −10%']);
	assert.deepEqual(buffMults([{ kind: 'exp', mult: 2 }]), { exp: 2, dmg: 1, guard: 1 });
	assert.deepEqual([fmtRemaining(1781), fmtRemaining(3900), fmtRemaining(-3)], ['29:41', '1:05:00', '0:00']);
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

const dir = mkdtempSync(join(tmpdir(), 'havenlord-shop-'));
const store = new Store(join(dir, 's.db'));
let clock = 1_000_000;
const MIN = 60_000;
const world = new World(store, () => [], undefined, () => clock);
const acc = store.createAccount('s0', 'x')!;
store.createSession('tok', acc, 3600_000);
const me = store.createCharacter('00000000-0000-0000-0000-0000000000c0', acc, 'Mua Sắm', 'female', newProgress())!.id;
// Vào game ở Thistlewood; gói vị trí đầu đặt tự do — mặc định đứng ngay trước quầy Bram (địa điểm `plaza` + lệch của Bram).
const AT_BRAM = { x: 1080 + MERCHANT.dx, y: 1272 + MERCHANT.dy + 30 };
const join_ = (at = AT_BRAM): FakeWs => {
	const ws = new FakeWs();
	world.accept(ws as never);
	ws.push({ t: 'hello', token: 'tok', character: me });
	ws.push({ t: 'move', ...at, dir: 'N', anim: 'idle', sprite: 'player_hero_adult' });
	return ws;
};

try {
	test('chỉ bán khi đứng cạnh quầy Bram ở quảng trường', () => {
		store.addDiamonds(me, 40, 'admin:thử');
		const far = join_({ x: 300, y: 300 });
		far.push({ t: 'shopBuy', item: 'exp2_30' });
		assert.match(far.last('system')!.text, /quầy của người bán hàng/);
		assert.equal(far.last('bought'), undefined);
		assert.equal(store.diamonds(me), 40);
		store.addDiamonds(me, -40, 'admin:thử');
		far.close();
	});

	let a = join_();
	test('vào game: nhận danh sách bình (rỗng); thiếu kim cương thì không mua được, không trừ gì', () => {
		assert.deepEqual(a.last('buffs')!.list, []);
		a.push({ t: 'shopBuy', item: 'exp2_30' });
		assert.match(a.last('system')!.text, /Không đủ kim cương/);
		assert.equal(a.last('bought'), undefined);
	});

	test('mua: trừ đúng giá MÁY CHỦ, có nhật ký, nhận bình; món lạ bỏ qua', () => {
		store.addDiamonds(me, 40, 'admin:thử');
		a.push({ t: 'shopBuy', item: 'exp2_30', price: 0 });
		a.push({ t: 'shopBuy', item: 'khong_co' });
		assert.deepEqual(a.last('bought'), { t: 'bought', item: 'exp2_30' });
		assert.deepEqual(a.last('wallet'), { t: 'wallet', diamonds: 40 - price('exp2_30') });
		assert.deepEqual(a.last('buffs')!.list, [{ kind: 'exp', mult: 2, remaining: 30 * 60 }]);
		assert.equal(store.diamondLedger(me, 1)[0]!.reason, 'shop:exp2_30');
	});

	test('giờ chỉ trôi lúc online: chơi 10 phút trừ 10 phút; offline 1 giờ không trừ', () => {
		clock += 10 * MIN;
		world.shop.tick();
		assert.equal(store.buffs(me)[0]!.remaining, 20 * 60);
		a.close();
		clock += 60 * MIN;
		a = join_();
		assert.equal(a.last('buffs')!.list[0]!.remaining, 20 * 60);
	});

	test('cùng mức: cộng giờ; mạnh hơn: thay hẳn; yếu hơn: từ chối, không trừ kim cương', () => {
		a.push({ t: 'shopBuy', item: 'exp2_60' });
		assert.equal(store.buffs(me)[0]!.remaining, 80 * 60, '20 phút còn lại + 60 phút');
		a.push({ t: 'shopBuy', item: 'exp3_30' });
		assert.deepEqual(store.buffs(me), [{ kind: 'exp', mult: 3, remaining: 30 * 60 }]);
		const before = store.diamonds(me);
		a.push({ t: 'shopBuy', item: 'exp2_30' });
		assert.match(a.last('system')!.text, /bình mạnh hơn/);
		assert.equal(store.diamonds(me), before);
		assert.equal(before, 40 - price('exp2_30') - price('exp2_60') - price('exp3_30'));
	});

	test('mỗi loại một bình, các loại chạy song song; hết giờ thì xoá + báo client', () => {
		a.push({ t: 'shopBuy', item: 'guard10' });
		assert.deepEqual(store.buffs(me).map((b) => b.kind), ['exp', 'guard']);
		clock += 31 * MIN;
		world.shop.tick();
		assert.deepEqual(a.last('buffs')!.list, [], 'cả hai bình 30 phút đều hết');
	});

	test('cộng giờ có trần 5 giờ', () => {
		store.addDiamonds(me, 100, 'admin:thử');
		for (let i = 0; i < 11; i += 1) a.push({ t: 'shopBuy', item: 'dmg10' });
		assert.equal(store.buffs(me)[0]!.remaining, BUFF_MAX_MS / 1000);
	});
} finally {
	world.stop();
	store.close();
	rmSync(dir, { recursive: true, force: true });
}

console.log(`${passed} test qua`);

// Chạy: npx tsx tests/pvp.test.ts — người đánh người (chủ dự án 10/10/2026: "xây dựng là game pvp đó nha"). KHÔNG cần máy chủ:
// dựng `Pvp` với người chơi giả + lịch hẹn chạy tay. Kiểm: máy chủ tính trúng theo hình học chiêu trên vị trí LÚC xét (đứng ra
// khỏi vùng kịp là né được), thị trấn an toàn, miễn PvP sau khi vào map, đạn không xuyên chỉ trúng người gần nhất, sát thương
// theo cấp / con đường / mốc tiềm năng (kẹp theo điểm có — bản lưu sửa tay không tăng sức đánh), báo gục chỉ nhận từ người vừa đánh.
import assert from 'node:assert/strict';
import type { ServerMessage } from '@aether/protocol';
import { PVP_KILL_WINDOW_MS, PVP_SCALE, PVP_SPAWN_SHIELD_MS, pvpAllowedOn, pvpBuild, pvpDamage, pvpStrikes } from '@aether/sim/pvp';
import { HERO_SKILLS, PATHS } from '@aether/sim/skills';
import { newPvpState, Pvp, type PvpPlayer } from '../src/pvp.ts';

let passed = 0;
const test = (name: string, fn: () => void): void => {
	fn();
	passed += 1;
	console.log(`  ✔ ${name}`);
};
console.log('pvp (máy chủ tính trúng người đánh người)');

const skill = (id: string) => HERO_SKILLS.find((s) => s.id === id)!;
const MAP = 'human/mossvale';

function rig() {
	let now = 100_000;
	const queue: { at: number; run: () => void }[] = [];
	const inbox = new Map<string, ServerMessage[]>();
	const players: PvpPlayer[] = [];
	const pvp = new Pvp(
		() => players,
		(id, msg) => inbox.get(id)!.push(msg),
		() => now,
		(ms, run) => queue.push({ at: now + ms, run }),
		() => 0.5,
	);
	const add = (id: string, x: number, y: number, map = MAP): PvpPlayer => {
		const p: PvpPlayer = { view: { id, name: id.toUpperCase(), level: 10, x, y, sprite: 'player_hero_adult', hp: 200, hpMax: 200 }, map, pvp: newPvpState(null, 0, now - PVP_SPAWN_SHIELD_MS) };
		players.push(p);
		inbox.set(id, []);
		return p;
	};
	const flush = (): void => {
		queue.sort((a, b) => a.at - b.at);
		while (queue.length) {
			const q = queue.shift()!;
			now = Math.max(now, q.at);
			q.run();
		}
	};
	const hits = (id: string) => inbox.get(id)!.filter((m): m is Extract<ServerMessage, { t: 'pvpHit' }> => m.t === 'pvpHit');
	return { pvp, add, flush, hits, inbox, setNow: (t: number) => (now = t), getNow: () => now, players };
}

test('thị trấn (map trạm) an toàn, map ngoài thì PvP', () => {
	assert.equal(pvpAllowedOn('human/town'), false);
	assert.equal(pvpAllowedOn(MAP), true);
});

test('Trảm trúng người đứng TRƯỚC mặt trong tầm; người đứng sau lưng không trúng', () => {
	const r = rig();
	const a = r.add('a', 500, 500);
	r.add('b', 560, 500);
	r.add('c', 440, 500);
	r.pvp.cast(a, 'slash', { ax: 1, ay: 0 });
	r.flush();
	const got = r.hits('a').map((m) => m.to);
	assert.deepEqual(got, ['b']);
	assert.equal(r.hits('c').length, 1, 'người thứ ba trong map cũng thấy số trúng của b');
});

test('đứng ra khỏi vùng trước khung chạm là né được', () => {
	const r = rig();
	const a = r.add('a', 500, 500);
	const b = r.add('b', 560, 500);
	r.pvp.cast(a, 'slash', { ax: 1, ay: 0 });
	b.view.x = 700;
	r.flush();
	assert.equal(r.hits('b').length, 0);
});

test('thị trấn: không ai trúng', () => {
	const r = rig();
	const a = r.add('a', 500, 500, 'human/town');
	r.add('b', 560, 500, 'human/town');
	r.pvp.cast(a, 'slash', { ax: 1, ay: 0 });
	r.flush();
	assert.equal(r.hits('b').length, 0);
});

test('vừa vào map: miễn PvP một lúc', () => {
	const r = rig();
	const a = r.add('a', 500, 500);
	const b = r.add('b', 560, 500);
	r.pvp.shield(b);
	r.pvp.cast(a, 'slash', { ax: 1, ay: 0 });
	r.flush();
	assert.equal(r.hits('b').length, 0);
});

test('đạn không xuyên chỉ trúng người GẦN nhất trên đường bay', () => {
	const r = rig();
	const a = r.add('a', 500, 500);
	r.add('near', 620, 500);
	r.add('far', 760, 500);
	r.pvp.cast(a, 'aether_bolt', { ax: 1, ay: 0 });
	r.flush();
	assert.deepEqual(r.hits('a').map((m) => m.to), ['near']);
});

test('người đã gục không đánh / không bị đánh', () => {
	const r = rig();
	const a = r.add('a', 500, 500);
	const b = r.add('b', 560, 500);
	b.view.hp = 0;
	r.pvp.cast(a, 'slash', { ax: 1, ay: 0 });
	r.flush();
	assert.equal(r.hits('b').length, 0);
});

test('sát thương PvP = PVP_SCALE × PvE − giáp, theo con đường', () => {
	const s = skill('slash');
	const lv = 10;
	const att = pvpBuild(lv, { path: 'sword', unlocked: ['sword'] });
	const def = pvpBuild(lv, null);
	const d = pvpDamage(s, att, def, () => 0.5);
	const atk = PATHS.sword.atk[0] + (lv - 1) * PATHS.sword.atk[1];
	const armor = PATHS.none.def[0] + (lv - 1) * PATHS.none.def[1];
	// rand 0.5 → hệ số 1, không chí mạng (0.5 ≥ 0.1); mốc Kiếm 1 → thưởng chiều sâu 1.
	assert.equal(d.crit, false);
	assert.equal(d.dmg, Math.max(1, Math.round(atk * s.power * PATHS.sword.sword * PVP_SCALE - armor * 0.5)));
});

test('mốc tiềm năng sửa tay trong bản lưu bị kẹp theo điểm có của cấp', () => {
	const b = pvpBuild(2, { unlocked: ['sword', 'fire'], talents: { sword: 9, fire: 9 } });
	assert.ok((b.tiers.sword ?? 0) + (b.tiers.fire ?? 0) <= 4, `mốc ${JSON.stringify(b.tiers)}`);
});

test('chiêu không gây sát thương (hồi máu) không có lần xét trúng; chiêu lạ cũng vậy', () => {
	assert.equal(pvpStrikes('heal', 0, 0, 1, 0).length, 0);
	assert.equal(pvpStrikes('khong_co', 0, 0, 1, 0).length, 0);
});

test('báo gục chỉ nhận từ người vừa đánh trúng mình, trong thời hạn', () => {
	const r = rig();
	const a = r.add('a', 500, 500);
	const b = r.add('b', 560, 500);
	r.pvp.down(b, 'a');
	assert.equal(r.inbox.get('a')!.filter((m) => m.t === 'pvpKill').length, 0, 'chưa bị a đánh thì không nhận');
	r.pvp.cast(a, 'slash', { ax: 1, ay: 0 });
	r.flush();
	r.setNow(r.getNow() + PVP_KILL_WINDOW_MS + 1);
	r.pvp.down(b, 'a');
	assert.equal(r.inbox.get('a')!.filter((m) => m.t === 'pvpKill').length, 0, 'quá hạn thì không nhận');
	r.pvp.cast(a, 'slash', { ax: 1, ay: 0 });
	r.flush();
	r.pvp.down(b, 'a');
	const k = r.inbox.get('a')!.filter((m) => m.t === 'pvpKill');
	assert.equal(k.length, 1);
	assert.deepEqual(k[0], { t: 'pvpKill', by: 'a', byName: 'A', to: 'b', toName: 'B' });
});

console.log(`${passed} ca đạt`);

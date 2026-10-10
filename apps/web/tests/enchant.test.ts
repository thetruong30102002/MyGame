// Chạy: npx tsx tests/enchant.test.ts — phủ phép Kiếm theo mốc nguyên tố (kế hoạch 2.3): phần THÊM ngoài việc đòn kiếm
// mang hệ — Hoả 7 nổ nhát 3, Thuỷ hút 3% / 6%, Phong tầm +25% + đẩy + lưỡi gió (7), Băng cộng dồn 3 / 2 nhát → đóng băng,
// Thổ 7 choáng lâu hơn. Phủ Thổ mốc 5 (phá giáp + nhát 3 choáng) ở tests/elements.test.ts.
import assert from 'node:assert/strict';
import { EARTH_ENCHANT, ENCHANT_FX, frostStack } from '../src/game/combat/skillRules';
import { ENCHANT_UP_TIER, enchantDesc } from '../src/game/combat/talents';

const near = (a: number, b: number, what: string, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${what}: ${a} ≠ ${b}`);

// 1) Luật thuần: cộng dồn băng + mô tả theo mốc.
{
	assert.equal(ENCHANT_UP_TIER, 7);
	let st = { n: 0, at: -99 };
	const step = (now: number, need: number) => {
		const r = frostStack(st, now, need);
		st = { n: r.n, at: now };
		return r.freeze;
	};
	assert.deepEqual([step(0, 3), step(1, 3), step(2, 3)], [false, false, true], 'mốc 5: nhát thứ 3 đóng băng');
	assert.equal(st.n, 0, 'đóng băng xong đếm lại');
	assert.deepEqual([step(10, 3), step(14, 3), step(15, 3), step(16, 3)], [false, false, false, true], 'cách quá 3s: đếm lại từ 1');
	assert.deepEqual([step(30, 2), step(31, 2)], [false, true], 'mốc 7: 2 nhát');
	assert.match(enchantDesc('fire', 5), /^Gây cháy\.$/);
	assert.match(enchantDesc('fire', 7), /Nhát thứ 3 liên tiếp nổ/);
	assert.match(enchantDesc('water', 5), /hút 3%/);
	assert.match(enchantDesc('water', 7), /hút 6%/);
	assert.match(enchantDesc('wind', 5), /\+25%/);
	assert.doesNotMatch(enchantDesc('wind', 5), /lưỡi gió/);
	assert.match(enchantDesc('wind', 7), /lưỡi gió/);
	assert.match(enchantDesc('ice', 5), /trúng 3 nhát/);
	assert.match(enchantDesc('ice', 7), /trúng 2 nhát/);
	assert.match(enchantDesc('earth', 5), /choáng 0,5 giây/);
	assert.match(enchantDesc('earth', 7), /choáng 0,9 giây/);
}

// 2) Trong trận (cùng khung giả như elements.test).
const fakeCtx = new Proxy({}, { get: () => () => undefined, set: () => true });
class FakeCanvas {
	width = 1;
	height = 1;
	style = {};
	getContext() {
		return fakeCtx;
	}
}
Object.assign(globalThis, { HTMLCanvasElement: FakeCanvas, document: { createElement: () => new FakeCanvas() }, window: globalThis });

const { Container, Texture } = await import('pixi.js');
const { Actor } = await import('../src/game/entities/Actor');
const { CombatSystem } = await import('../src/game/combat/CombatSystem');
type Textures = import('../src/game/assets/AssetManifest').CharacterTextures;
type Dir = import('../src/game/assets/AssetManifest').Direction;
type Fighter = import('../src/game/combat/CombatSystem').Fighter;
type Tiers = import('../src/game/combat/talents').Tiers;

const DIRS: Dir[] = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'];
const strip = (n: number) => Array.from({ length: n }, () => new Texture());
function fakeTextures(): Textures {
	const anims = { idle: Object.fromEntries(DIRS.map((d) => [d, strip(4)])), walk: Object.fromEntries(DIRS.map((d) => [d, strip(6)])) } as Record<string, Partial<Record<Dir, InstanceType<typeof Texture>[]>>>;
	return {
		id: 'test',
		entry: { displayName: 'Thử', role: 'player', atlas: '', frameSize: { width: 64, height: 64 }, anchor: { x: 0.5, y: 0.9 }, animations: { idle: { fps: 6 }, walk: { fps: 10 } }, source: { provider: 'test', ref: null }, bodyHeight: 60 },
		frames: (anim, dir) => anims[anim]?.[dir] ?? anims.idle!.S!,
		has: (anim) => !!anims[anim],
		hasDir: () => false,
		actionFrames: () => null,
	};
}

interface Internals {
	projectiles: { damage: number; element: string; pierce: boolean; vx: number; vy: number }[];
}

/** Người chơi ở (40, 100), đã phủ `enchant`; quái đứng yên (không đánh). `slash()` = một nhát Trảm nhắm sang phải. */
function setup(tiers: Tiers, enchant: 'fire' | 'water' | 'wind' | 'ice' | 'earth') {
	const plays: string[] = [];
	const floats: string[] = [];
	const vfx = { ground: new Container(), top: new Container(), play: (id: string) => void plays.push(id), frames: () => [], update: () => undefined, clear: () => undefined };
	const combat = new CombatSystem(
		{
			mover: (pos, dx, dy) => {
				pos.x += dx;
				pos.y += dy;
			},
			shake: () => undefined,
			toast: () => undefined,
			enemyKilled: () => undefined,
			bossNear: () => false,
			playerRespawn: () => ({ x: 0, y: 0 }),
			isUnlocked: () => true,
			practiceHit: () => undefined,
		},
		{ level: 1, exp: 0, coins: 0, potions: 0 },
		vfx as never,
	);
	const p = new Actor('hero', fakeTextures(), 40, 100, 'S', null);
	combat.setPlayer(p);
	combat.setTalents(tiers);
	assert.equal(combat.setEnchant(enchant), 'ok', `phủ ${enchant}`);
	const c = combat as unknown as { float: (wx: number, wy: number, text: string, color: number, size: number) => void };
	const realFloat = c.float.bind(combat);
	c.float = (wx, wy, text, color, size) => {
		floats.push(text);
		realFloat(wx, wy, text, color, size);
	};
	const tick = (n = 1, dt = 1 / 60) => {
		for (let i = 0; i < n; i += 1) {
			p.update(dt);
			combat.update(dt, (x, y) => ({ x, y }), 2);
		}
	};
	const enemy = (x: number, y = 100, id = 'mob_zombie_001'): Fighter => {
		const home = { x, y, radius: 60 };
		const f = combat.addEnemy(new Actor(id, fakeTextures(), x, y, 'W', home), id, home, id)!;
		f.attackTimer = 99;
		f.hpMax = f.hp = 1e6;
		return f;
	};
	const slash = () => {
		combat.pc.cooldowns.clear();
		assert.equal(combat.cast(0, { x: 200, y: 100 - p.chest }), 'started');
	};
	return { combat, p, plays, floats, tick, enemy, slash, inner: combat as unknown as Internals };
}

const rnd = Math.random;
Math.random = () => 0.5;
try {
	// 2a) Thuỷ: hút 3% (mốc 5) / 6% (mốc 7) sát thương thật — Huyết Thuỷ (Thuỷ 4) cộng thêm 5% trên cùng nhát.
	{
		const healed = (tiers: Tiers) => {
			const s = setup(tiers, 'water');
			const f = s.enemy(75);
			// Sát thương cấp 1 (~19) quá nhỏ: làm tròn che mất khác biệt 3% / 6% — cộng ATK cho số đủ lớn.
			s.combat.setGear({ atk: 400 });
			s.combat.pc.hp = 1;
			s.combat.pc.hpMax = 1e6;
			s.slash();
			return { heal: s.combat.pc.hp - 1, dealt: f.hpMax - f.hp };
		};
		const a = healed({ sword: 2, water: 5 });
		const b = healed({ sword: 2, water: 7 });
		assert.ok(a.dealt > 0 && b.dealt > 0, 'nhát trúng');
		// lifestealHeal làm tròn — so tỉ lệ (Thuỷ 5 / 7 đều có Huyết Thuỷ 5%).
		near(a.heal / a.dealt, 0.03 + 0.05, 'mốc 5: 3% + Huyết Thuỷ', 0.005);
		near(b.heal / b.dealt, 0.06 + 0.05, 'mốc 7: 6% + Huyết Thuỷ', 0.005);
		assert.ok(b.heal > a.heal, 'mốc 7 hút nhiều hơn');
	}

	// 2b) Phong: tầm chém +25% (Trảm 74 → 92,5 + 18); mốc 5 không có lưỡi gió, mốc 7 mỗi nhát một lưỡi (cả khi chém hụt).
	{
		const s5 = setup({ sword: 2, wind: 5 }, 'wind');
		const far = s5.enemy(40 + 105);
		s5.slash();
		assert.ok(far.hp < far.hpMax, 'quái cách 105px: ngoài tầm Trảm thường (92) nhưng trong tầm phủ Phong');
		assert.ok(far.push, 'đẩy lùi nhẹ');
		assert.equal(s5.inner.projectiles.length, 0, 'mốc 5: chưa có lưỡi gió');
		const s7 = setup({ sword: 2, wind: 7 }, 'wind');
		s7.slash();
		assert.equal(s7.inner.projectiles.length, 1, 'mốc 7: một lưỡi gió theo nhát chém');
		const blade = s7.inner.projectiles[0]!;
		assert.ok(blade.element === 'wind' && !blade.pierce && blade.vx > 0 && Math.abs(blade.vy) < 1e-9, 'lưỡi gió hệ Phong, không xuyên, bay theo hướng chém');
		const target = s7.enemy(40 + 200);
		s7.tick(40);
		assert.ok(target.hp < target.hpMax, 'lưỡi gió trúng quái ngoài tầm chém');
		// Đối chứng: không phủ thì quái 105px không trúng.
		const s0 = setup({ sword: 2, wind: 5 }, 'wind');
		s0.combat.setEnchant(null);
		const f0 = s0.enemy(40 + 105);
		s0.slash();
		assert.equal(f0.hp, f0.hpMax, 'kiếm thép: 105px ngoài tầm');
	}

	// 2c) Băng: trúng 3 nhát liên tiếp (mốc 5) / 2 nhát (mốc 7) → đóng băng ngắn.
	{
		for (const [tier, need] of [[5, ENCHANT_FX.ice.stacks], [7, ENCHANT_FX.ice.stacksUp]] as const) {
			const s = setup({ sword: 2, ice: tier }, 'ice');
			const f = s.enemy(75);
			for (let k = 1; k < need; k += 1) {
				s.slash();
				assert.equal(f.freeze, 0, `mốc ${tier}: nhát ${k} chưa băng`);
				assert.ok(f.chill > 0, 'nhưng bị lạnh (hệ Băng)');
			}
			s.slash();
			// Nhân Hàn Tâm (bị động Băng) như mọi đòn đóng băng.
			const k = (s.combat as unknown as { fx: { freeze: number } }).fx.freeze;
			near(f.freeze, ENCHANT_FX.ice.freeze * k, `mốc ${tier}: nhát ${need} đóng băng`);
			assert.ok(s.floats.includes('Đóng Băng!'));
		}
		// Cách quá 3s thì đếm lại.
		const s = setup({ sword: 2, ice: 7 }, 'ice');
		const f = s.enemy(75);
		s.slash();
		s.tick(60 * 3.2);
		s.slash();
		assert.equal(f.freeze, 0, 'ngưng quá 3s: nhát sau là nhát 1');
	}

	// 2d) Hoả: mốc 5 chỉ cháy; mốc 7 nhát thứ 3 liên tiếp nổ nhỏ quanh mục tiêu đầu tiên — trúng cả quái đứng cạnh ngoài tầm chém.
	{
		const run = (tier: number) => {
			const s = setup({ sword: 2, fire: tier }, 'fire');
			let blasts = 0;
			const c = s.combat as unknown as { enchantBlast: (x: number, y: number, base: number) => void };
			const real = c.enchantBlast.bind(s.combat);
			c.enchantBlast = (x, y, base) => {
				blasts += 1;
				real(x, y, base);
			};
			const f = s.enemy(75);
			const side = s.enemy(75, 100 + 40);
			const hpSide = () => side.hpMax - side.hp;
			s.slash();
			s.slash();
			const before = hpSide();
			s.slash();
			return { f, gain: hpSide() - before, blasts };
		};
		const r5 = run(5);
		assert.ok(r5.f.burn > 0, 'mốc 5: gây cháy');
		assert.equal(r5.blasts, 0, 'mốc 5: không nổ');
		const r7 = run(7);
		assert.equal(r7.blasts, 1, 'mốc 7: đúng một vụ nổ ở nhát 3 (dù nhát đó trúng 2 quái)');
		assert.ok(r7.gain > r5.gain, 'quái cạnh ăn thêm sát thương vụ nổ');
	}

	// 2e) Thổ mốc 7: nhát thứ 3 choáng lâu hơn (0,5 → 0,9s).
	{
		for (const [tier, stun] of [[5, EARTH_ENCHANT.stun], [7, EARTH_ENCHANT.stunUp]] as const) {
			const s = setup({ sword: 2, earth: tier }, 'earth');
			const f = s.enemy(75);
			s.slash();
			s.slash();
			s.slash();
			near(f.stun, stun, `mốc ${tier}: choáng nhát 3`);
		}
	}
} finally {
	Math.random = rnd;
}

console.log('✔ enchant.test: cộng dồn băng (thuần), mô tả theo mốc, Thuỷ hút 3%/6%, Phong tầm +25% + đẩy + lưỡi gió (7), Băng 3/2 nhát → đóng băng, Hoả 7 nổ nhát 3 (một lần), Thổ 7 choáng 0,9s');

// Chạy: npx tsx tests/swordstyles.test.ts — GĐ2 lượt B: Kiếm 3 lưu phái trong trận (Nhất Kích dồn lực, Đột Kích, Thế Tĩnh
// chặn + phản, Lưu Thủy Phản cửa sổ đỡ, Tâm Tĩnh, Lướt Chém i-frame, Nhẹ Như Gió, Ảnh Bộ ra sau lưng + chí mạng), 5 kiếm
// pháp nguyên tố, luật thuần thế đỡ / Ảnh Bộ, và hình tạm Băng Trụ / Lốc Xoáy làm lại.
import assert from 'node:assert/strict';
import { armorDamage, behindPoint, GUARD, guardOutcome, lifestealHeal, pickAhead } from '../src/game/combat/skillRules';
import { HERO_SKILLS, isGroundTarget, isSwordSkill, skillFacts } from '../src/game/combat/skills';
import { depthBonus, PASSIVE, type SwordStyle, type Tiers } from '../src/game/combat/talents';
import { TEMP_ART } from '../src/game/combat/tempArt';

const near = (a: number, b: number, what: string, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${what}: ${a} ≠ ${b}`);
const idx = (id: string) => {
	const i = HERO_SKILLS.findIndex((s) => s.id === id);
	assert.ok(i >= 0, `có kỹ năng ${id}`);
	return i;
};
const def = (id: string) => HERO_SKILLS[idx(id)]!;

// 1) Luật thuần.
{
	// Thế Tĩnh: chặn + phản cận chiến, đạn / đòn vùng còn 40%, không tan. Lưu Thủy Phản: hoá giải đòn đầu (cả đạn) rồi tan.
	assert.deepEqual(guardOutcome('stance', 'melee'), { counter: true, mult: 0, ends: false });
	assert.deepEqual(guardOutcome('stance', 'shot'), { counter: false, mult: GUARD.shot, ends: false });
	assert.deepEqual(guardOutcome('parry', 'melee'), { counter: true, mult: 0, ends: true });
	assert.deepEqual(guardOutcome('parry', 'shot'), { counter: true, mult: 0, ends: true });
	for (const g of ['stance', 'parry'] as const) assert.deepEqual(guardOutcome(g, 'area'), { counter: false, mult: GUARD.shot, ends: false }, `${g}: đòn vùng chỉ giảm`);
	// Sau lưng = đi tiếp qua mục tiêu theo hướng tiếp cận.
	assert.deepEqual(behindPoint(0, 0, 100, 0, 34), { x: 134, y: 0 });
	assert.deepEqual(behindPoint(100, 100, 100, 0, 30), { x: 100, y: -30 });
	// Chọn mục tiêu: trong tầm + trong nón; gần hướng nhắm hơn thì thắng dù xa hơn một chút.
	const t = [
		{ x: 120, y: 60 },
		{ x: 180, y: 0 },
		{ x: -50, y: 0 },
		{ x: 400, y: 0 },
	];
	assert.equal(pickAhead(0, 0, 1, 0, 260, 60, t), 1, 'gần hướng nhắm');
	assert.equal(pickAhead(0, 0, -1, 0, 260, 60, t), 2, 'nhắm ngược lại: mục tiêu phía sau');
	assert.equal(pickAhead(0, 0, 0, -1, 260, 60, t), -1, 'không có gì trong nón');
	assert.equal(pickAhead(0, 0, 1, 0, 100, 60, t), -1, 'ngoài tầm');
}

// 2) Dữ liệu: nối CUỐI (chỉ số 0–16 giữ nguyên), đòn thép ăn phủ phép, kiếm pháp mang hệ + tính là đòn kiếm, không nhắm đất.
{
	assert.deepEqual(
		HERO_SKILLS.slice(0, 17).map((s) => s.id),
		['slash', 'aether_bolt', 'fire_bolt', 'water_lance', 'wind_blade', 'heal', 'ice_shard', 'flame_ring', 'fire_blast', 'tidal_wave', 'cyclone', 'gale_dash', 'frost_field', 'ice_spire', 'rock_throw', 'quake', 'stone_spikes'],
		'chỉ số cũ không lệch (thanh kỹ năng / máy người khác tra theo chỉ số)',
	);
	for (const id of ['heavy_strike', 'pierce_rush', 'calm_stance', 'flowing_counter', 'side_slash', 'shadow_step']) {
		assert.ok(isSwordSkill(def(id)) && def(id).element === 'steel', `${id}: đòn Kiếm thép`);
		assert.ok(!def(id).key, `${id}: không có ô nhà — vào ô trống đầu tiên`);
	}
	for (const id of ['blaze_slash', 'water_dragon_slash', 'gale_blade_dance', 'frost_cleave', 'earth_rend']) {
		assert.ok(isSwordSkill(def(id)) && def(id).blade && def(id).element !== 'steel', `${id}: đòn kiếm mang hệ`);
		assert.ok(!isGroundTarget(def(id)), `${id}: không nhắm điểm trên đất`);
		assert.ok(def(id).power >= 2.4 && def(id).mpCost >= 18 || def(id).kind === 'zone', `${id}: mạnh cỡ kỹ năng mốc 5`);
	}
	assert.equal(def('flowing_counter').power, 2 * def('calm_stance').power, 'Lưu Thủy Phản phản gấp đôi Thế Tĩnh');
	assert.equal(def('shadow_step').crit, 1, 'Ảnh Bộ chắc chắn chí mạng');
	assert.ok((def('side_slash').iframes ?? 0) >= (def('side_slash').range ?? 0) / (def('side_slash').speed ?? 1), 'Lướt Chém: i-frame phủ hết quãng lướt');
	assert.match(skillFacts(def('calm_stance'))[0]!, /Giữ thế 1,5s.*40%/);
	assert.match(skillFacts(def('flowing_counter'))[0]!, /Cửa sổ đỡ 0,6s/);
	assert.ok(skillFacts(def('shadow_step')).includes('chắc chắn chí mạng'));
	assert.match(skillFacts(def('heavy_strike'))[0]!, /dồn lực 0,3s/);
	assert.ok(skillFacts(def('water_dragon_slash')).includes('hút máu 15%'));
	assert.match(skillFacts(def('gale_blade_dance'))[0]!, /^Quanh mình 2,4s/);
	for (const id of ['heavy_strike', 'pierce_rush', 'calm_stance', 'flowing_counter', 'side_slash', 'shadow_step', 'blaze_slash', 'water_dragon_slash', 'gale_blade_dance', 'frost_cleave', 'earth_rend']) {
		assert.ok(TEMP_ART[id]?.icon && TEMP_ART[id]!.todo, `${id}: hình tạm + icon tạm + ghi chú cần vẽ`);
	}
	assert.equal(TEMP_ART.earth_rend!.final, 'rock_spikes', 'Địa Liệt Trảm tự dùng gai đá PixelLab khi có');
}

// 3) Trong trận.
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

const DIRS: Dir[] = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'];
const strip = (n: number) => Array.from({ length: n }, () => new Texture());
/** Nhân vật giả không có động tác ra đòn: đòn nổ ngay lúc bấm (dồn lực vẫn chờ đủ thời gian). */
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
	zones: { x: number; y: number }[];
	projectiles: { team: string; damage: number }[];
	strike(f: Fighter, dist: number): void;
	enemyShot(f: Fighter, nx: number, ny: number): void;
	hurtPlayer(amount: number): void;
	incoming(kind: 'melee' | 'shot' | 'area', amount: number): void;
}
type Play = { id: string; x: number; y: number; scale?: number; scaleX?: number; scaleY?: number; duration?: number; layer?: string; fps?: number; follow?: unknown };

function setup(o: { tiers?: Tiers; style?: SwordStyle | null; dummy?: boolean } = {}) {
	const plays: Play[] = [];
	const floats: string[] = [];
	const toasts: string[] = [];
	const hits: string[] = [];
	const vfx = {
		ground: new Container(),
		top: new Container(),
		play: (id: string, x: number, y: number, opt: Omit<Play, 'id' | 'x' | 'y'> = {}) => void plays.push({ id, x, y, ...opt }),
		frames: () => [],
		update: () => undefined, clear: () => undefined,
	};
	const combat = new CombatSystem(
		{
			mover: (pos, dx, dy) => {
				pos.x += dx;
				pos.y += dy;
			},
			shake: () => undefined,
			toast: (text) => void toasts.push(text),
			enemyKilled: () => undefined,
			bossNear: () => false,
			playerRespawn: () => ({ x: 0, y: 0 }),
			isUnlocked: () => true,
			practiceHit: (el, r) => void hits.push(`${el}:${r}`),
		},
		{ level: 1, exp: 0, coins: 0, potions: 0 },
		vfx as never,
	);
	const p = new Actor('hero', fakeTextures(), 40, 100, 'S', null);
	combat.setPlayer(p);
	if (o.tiers) combat.setTalents(o.tiers, o.style ?? null);
	if (o.dummy) combat.addDummy(200, 100);
	const inner = combat as unknown as Internals;
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
	const cast = (id: string, aim: { x: number; y: number }, opts?: { repeat?: boolean }) => {
		combat.pc.mp = combat.pc.mpMax;
		combat.pc.cooldowns.delete(id);
		return combat.cast(idx(id), aim, opts);
	};
	/** Quái đứng yên (`hold` = choáng dài, không lại gần / không tự đánh) để đo trúng. */
	const enemy = (id: string, x: number, y = 100, hold = true): Fighter => {
		const home = { x, y, radius: 60 };
		const f = combat.addEnemy(new Actor(id, fakeTextures(), x, y, 'W', home), id, home, id)!;
		f.attackTimer = 99;
		if (hold) f.stun = 99;
		return f;
	};
	const east = (s: { p: { chest: number } }) => ({ x: 400, y: 100 - s.p.chest });
	return { combat, p, plays, floats, toasts, hits, tick, inner, cast, enemy, east: () => east({ p }) };
}
const full = (f: Fighter) => f.hp === f.hpMax;
/** Khoá ngẫu nhiên (biên độ sát thương, chí mạng) trong `run`. 0,5 → biên độ ×1, không chí mạng thường (10%). */
function withRandom<T>(v: number, run: () => T): T {
	const rnd = Math.random;
	Math.random = () => v;
	try {
		return run();
	} finally {
		Math.random = rnd;
	}
}
const ATK = 16;

// 3a) Thế Tĩnh: giữ thế 1,5s — đứng im (rooted), cận chiến bị CHẶN + PHẢN (mỗi đòn), đạn / đòn vùng còn 40%, hết giờ thì thôi.
withRandom(0.5, () => {
	const s = setup({ tiers: { sword: 3 }, style: 'thuy_than' });
	const f = s.enemy('mob_zombie_001', 70);
	assert.equal(s.cast('calm_stance', s.east()), 'started');
	assert.ok(s.combat.pc.guard?.kind === 'stance' && s.combat.rooted, 'đang giữ thế: đứng im');
	assert.ok(s.plays.some((x) => x.id === 'water_ring' && x.duration === 1.5 && x.follow), 'vòng nước dưới chân suốt thế');
	const hp = s.combat.pc.hp;
	s.inner.strike(f, 30);
	assert.equal(s.combat.pc.hp, hp, 'cận chiến bị chặn');
	const counter = armorDamage(ATK * def('calm_stance').power * depthBonus(3), f.stats.def, false);
	assert.equal(f.hpMax - f.hp, counter, `phản đúng ×1,4 (${counter})`);
	assert.ok(s.floats.includes('Chặn!'));
	s.inner.strike(f, 30);
	assert.equal(s.combat.pc.hp, hp, 'Thế Tĩnh chặn MỌI đòn cận chiến trong thế');
	assert.equal(f.hpMax - f.hp, 2 * counter, 'mỗi đòn chặn một lần phản');
	s.inner.incoming('shot', 40);
	assert.equal(hp - s.combat.pc.hp, Math.round(40 * GUARD.shot - s.combat.pc.def * 0.5), 'đạn: chỉ còn 40%');
	assert.ok(s.floats.includes('Gạt') && s.combat.pc.guard, 'gạt đạn vẫn giữ thế');
	s.tick(95);
	assert.equal(s.combat.pc.guard, null, 'hết 1,5s thì thôi giữ thế');
	assert.equal(s.combat.rooted, false);
	assert.equal(s.p.view.sprite.tint, 0xffffff, 'trả màu nhân vật');
	s.combat.pc.iframes = 0;
	const hp2 = s.combat.pc.hp;
	s.inner.strike(f, 30);
	assert.ok(s.combat.pc.hp < hp2, 'hết thế: trúng đòn như thường');

	// Đạn THẬT (cung xương bắn) trúng người đang giữ thế: chỉ mất 40%.
	const q = setup({ tiers: { sword: 3 }, style: 'thuy_than' });
	const archer = q.enemy('mob_skeleton_archer_001', 220);
	q.cast('calm_stance', q.east());
	const before = q.combat.pc.hp;
	q.inner.enemyShot(archer, -1, 0);
	for (let i = 0; q.combat.pc.hp === before; i += 1) {
		assert.ok(i < 90, 'đạn phải tới');
		q.tick();
	}
	assert.equal(before - q.combat.pc.hp, Math.round(archer.stats.atk * GUARD.shot - q.combat.pc.def * 0.5), 'đạn thật: còn 40%');

	// Né / bấm đòn khác thì thôi giữ thế; GIỮ phím (lệnh lặp) không phá thế.
	const r = setup({ tiers: { sword: 3 }, style: 'thuy_than' });
	r.cast('calm_stance', r.east());
	assert.equal(r.combat.cast(0, r.east(), { repeat: true }), 'busy', 'giữ J: không phá thế');
	assert.ok(r.combat.pc.guard);
	assert.equal(r.cast('slash', r.east()), 'started', 'bấm J: ra đòn');
	assert.equal(r.combat.pc.guard, null, 'bấm đòn khác: thôi giữ thế');
	r.combat.pc.cooldowns.clear();
	r.tick(30);
	r.cast('calm_stance', r.east());
	r.combat.dodge({ x: 0, y: 1 });
	assert.ok(r.combat.pc.guard === null && r.combat.pc.dash, 'né: thôi giữ thế và lăn đi');
});

// 3b) Lưu Thủy Phản: cửa sổ 0,6s có vòng báo; đỡ MỘT đòn (cận chiến hoặc đạn) → phản ×2,8 (gấp đôi Thế Tĩnh) rồi tan;
//     hết cửa sổ mà không ai đánh thì thôi; đòn vùng chỉ giảm.
withRandom(0.5, () => {
	const s = setup({ tiers: { sword: 5 }, style: 'thuy_than' });
	const f = s.enemy('mob_zombie_001', 70);
	s.cast('flowing_counter', s.east());
	const g = s.combat.pc.guard!;
	assert.deepEqual([g.kind, g.total], ['parry', 0.6]);
	assert.ok(s.plays.some((x) => x.id === 'magic_circle' && x.layer === 'ground' && x.follow), 'vòng báo cửa sổ đỡ dưới chân');
	assert.ok(s.floats.includes('Thế đỡ!'), 'báo hiệu bằng chữ');
	const hp = s.combat.pc.hp;
	s.inner.strike(f, 30);
	assert.equal(s.combat.pc.hp, hp, 'đỡ trúng: không mất máu');
	const counter = armorDamage(ATK * def('flowing_counter').power * depthBonus(5), f.stats.def, false);
	assert.equal(f.hpMax - f.hp, counter, `phản gấp đôi (${counter})`);
	assert.ok(s.floats.includes('Phản đòn!'));
	assert.equal(s.combat.pc.guard, null, 'đỡ một đòn rồi tan');
	assert.ok(s.combat.pc.iframes >= GUARD.parryIframes - 1e-9, 'miễn thương ngắn sau khi phản');
	s.inner.strike(f, 30);
	assert.equal(s.combat.pc.hp, hp, 'đòn thứ hai của bầy không nện ngay vào nhát phản');

	// Gấp đôi Thế Tĩnh ở CÙNG mốc (trước giáp).
	near(def('flowing_counter').power / def('calm_stance').power, 2, 'tỉ lệ phản');

	// Hết cửa sổ: không đỡ gì, trúng đòn như thường.
	const q = setup({ tiers: { sword: 5 }, style: 'thuy_than' });
	const e = q.enemy('mob_zombie_001', 70);
	q.cast('flowing_counter', q.east());
	q.tick(40);
	assert.equal(q.combat.pc.guard, null, 'quá 0,6s: cửa sổ đóng');
	const hq = q.combat.pc.hp;
	q.inner.strike(e, 30);
	assert.ok(q.combat.pc.hp < hq && full(e), 'đánh trượt cửa sổ: mất máu, không phản');

	// Đỡ đạn: đạn bị hoá giải và hất ngược thành đạn của người chơi, bay về trúng kẻ bắn.
	const r = setup({ tiers: { sword: 5 }, style: 'thuy_than' });
	const archer = r.enemy('mob_skeleton_archer_001', 220);
	const hr = r.combat.pc.hp;
	r.cast('flowing_counter', r.east());
	r.inner.enemyShot(archer, -1, 0);
	for (let i = 0; full(archer); i += 1) {
		assert.ok(i < 120, 'đạn phản phải bay về trúng kẻ bắn');
		r.tick();
	}
	assert.equal(r.combat.pc.hp, hr, 'đỡ đạn: không mất máu');
	assert.equal(archer.hpMax - archer.hp, armorDamage(ATK * def('flowing_counter').power * depthBonus(5), archer.stats.def, false), 'đạn phản mang sát thương nhát phản');

	// Đòn vùng (boss dậm đất) không đỡ được: chỉ giảm, cửa sổ vẫn mở.
	const z = setup({ tiers: { sword: 5 }, style: 'thuy_than' });
	z.cast('flowing_counter', z.east());
	const hz = z.combat.pc.hp;
	z.inner.incoming('area', 50);
	// Kiếm mốc 5 Thủy Thần đã có Tâm Tĩnh (mốc 4): đang giữ thế nên còn ×0,85 nữa.
	assert.equal(hz - z.combat.pc.hp, Math.round(50 * GUARD.shot * PASSIVE.calm - z.combat.pc.def * 0.5), 'đòn vùng: còn 40% (× Tâm Tĩnh)');
	assert.ok(z.combat.pc.guard, 'đòn vùng không làm tan thế đỡ');

	// Phủ Thuỷ: nhát phản mang hệ Thuỷ → hút máu (lối "bất tử").
	const w = setup({ tiers: { sword: 5, water: 5 }, style: 'thuy_than' });
	assert.equal(w.combat.setEnchant('water'), 'ok');
	const fw = w.enemy('mob_zombie_001', 70);
	w.combat.pc.hp = 50;
	w.cast('flowing_counter', w.east());
	w.inner.strike(fw, 30);
	assert.ok(fw.wet > 0, 'nhát phản mang hệ Thuỷ (làm ướt)');
	assert.equal(w.combat.pc.hp, 50 + lifestealHeal(fw.hpMax - fw.hp, PASSIVE.lifesteal), 'Huyết Thuỷ hút máu từ nhát phản');
});

// 3c) Tâm Tĩnh (Thủy Thần 4): đứng yên ≥ 0,3s hoặc đang giữ thế → nhận −15%; đang đi thì không.
withRandom(0.5, () => {
	const hurt = (style: SwordStyle | null, move: boolean) => {
		const s = setup({ tiers: { sword: 4 }, style });
		s.combat.pc.def = 0;
		for (let i = 0; i < 30; i += 1) {
			if (move) s.p.x += 2;
			s.tick();
		}
		s.combat.pc.iframes = 0;
		const hp = (s.combat.pc.hp = s.combat.pc.hpMax);
		s.inner.hurtPlayer(40);
		return hp - s.combat.pc.hp;
	};
	assert.equal(hurt('thuy_than', false), Math.round(40 * PASSIVE.calm), 'đứng yên: −15%');
	assert.equal(hurt('thuy_than', true), 40, 'đang đi: đủ sát thương');
	assert.equal(hurt('kiem_than', false), 40, 'lưu phái khác: không có Tâm Tĩnh');
	const g = setup({ tiers: { sword: 4 }, style: 'thuy_than' });
	g.combat.pc.def = 0;
	g.cast('calm_stance', g.east());
	const hp = g.combat.pc.hp;
	g.inner.incoming('shot', 40);
	assert.equal(hp - g.combat.pc.hp, Math.round(40 * GUARD.shot * PASSIVE.calm), 'giữ thế: gạt đạn còn 40% × Tâm Tĩnh');
});

// 3d) Bắc Thần: Lướt Chém không trúng đòn suốt lúc lướt + chém quái đi qua; Nhẹ Như Gió (tốc chạy, né rẻ).
{
	const s = setup({ tiers: { sword: 3 }, style: 'bac_than' });
	const onPath = s.enemy('mob_zombie_001', 110);
	const off = s.enemy('mob_zombie_001', 110, 200);
	const x0 = s.p.x;
	assert.equal(s.cast('side_slash', s.east()), 'started');
	s.tick(3);
	const hp = s.combat.pc.hp;
	s.inner.hurtPlayer(50);
	assert.equal(s.combat.pc.hp, hp, 'đang lướt: không trúng đòn');
	s.tick(12);
	assert.equal(s.combat.pc.dash, null);
	near(s.p.x - x0, 140, 'lướt đúng 140px', 1);
	assert.ok(!full(onPath) && full(off), 'chém quái đi qua, không chạm quái xa đường');
	s.tick(30);
	s.inner.hurtPlayer(50);
	assert.ok(s.combat.pc.hp < hp, 'hết i-frame: trúng đòn lại');

	const plain = setup({ tiers: { sword: 3 }, style: 'bac_than' });
	assert.equal(plain.combat.moveScale, 1, 'mốc 3 chưa có Nhẹ Như Gió');
	assert.equal(plain.combat.dodgeStamina, 25);
	const swift = setup({ tiers: { sword: 4 }, style: 'bac_than' });
	near(swift.combat.moveScale, PASSIVE.swiftMove, 'tốc chạy +10%');
	near(swift.combat.dodgeStamina, 25 * PASSIVE.swiftDodge, 'né tốn 70% thể lực');
	for (const [q, ok] of [
		[plain, false],
		[swift, true],
	] as const) {
		q.combat.pc.stamina = 20;
		q.combat.dodge({ x: 1, y: 0 });
		assert.equal(!!q.combat.pc.dash, ok, ok ? 'Nhẹ Như Gió: 20 thể lực vẫn né được' : '20 thể lực < 25: không né được');
	}
	near(swift.combat.pc.stamina, 20 - 25 * PASSIVE.swiftDodge, 'trừ đúng 17,5');
}

// 3e) Ảnh Bộ: ra SAU LƯNG mục tiêu gần hướng nhắm nhất rồi chém — chắc chắn chí mạng; không có mục tiêu thì không tung.
withRandom(0.99, () => {
	const s = setup({ tiers: { sword: 5 }, style: 'bac_than' });
	const decoy = s.enemy('mob_zombie_001', 160, 170);
	const f = s.enemy('mob_zombie_001', 220);
	assert.equal(s.cast('shadow_step', { x: 400, y: 100 - s.p.chest }), 'started');
	near(s.p.x, 220 + 34, 'đứng sau lưng mục tiêu (34px)', 1e-6);
	near(s.p.y, 100, 'cùng hàng', 1e-6);
	assert.equal(s.p.view.direction, 'W', 'quay lại chém mục tiêu');
	const base = ATK * def('shadow_step').power * depthBonus(5) * (0.9 + 0.99 * 0.2) * 1.75;
	assert.equal(f.hpMax - f.hp, armorDamage(base, f.stats.def, false), 'chí mạng ×1,75 dù xúc xắc 0,99');
	assert.ok(s.floats.some((t) => t.endsWith('!') && /^\d+!$/.test(t)), 'số chí mạng');
	assert.ok(full(decoy), 'chỉ mục tiêu gần hướng nhắm');
	assert.ok(s.combat.pc.iframes > 0.3, 'miễn thương ngắn khi ra sau lưng');
	assert.ok(s.plays.some((x) => x.id === 'shadow' && Math.abs(x.x - 40) < 1), 'để lại bóng ở chỗ cũ');

	const none = setup({ tiers: { sword: 5 }, style: 'bac_than' });
	none.enemy('mob_zombie_001', -120);
	none.combat.pc.mp = none.combat.pc.mpMax;
	const mp = none.combat.pc.mp;
	assert.equal(none.combat.cast(idx('shadow_step'), { x: 400, y: 100 - none.p.chest }), 'none', 'mục tiêu sau lưng người chơi, nhắm phía trước: không có');
	assert.ok(none.toasts.includes('Không có mục tiêu trong tầm'));
	assert.deepEqual([none.combat.pc.mp, none.combat.pc.cooldowns.has('shadow_step'), none.p.x], [mp, false, 40], 'không mất MP / hồi chiêu, không dịch');

	const boss = setup({ tiers: { sword: 5 }, style: 'bac_than' });
	boss.enemy('boss_demon_001', 200);
	boss.cast('shadow_step', { x: 300, y: 100 - boss.p.chest });
	near(boss.p.x, 200 + 44, 'boss to hơn: đứng xa hơn 10px', 1e-6);
	assert.equal(boss.cast('heavy_strike', boss.east()), 'locked', 'Bắc Thần mốc 5: kỹ năng của lưu phái khác (Nhất Kích) không dùng được');
	assert.equal(boss.cast('calm_stance', boss.east()), 'locked');
});

// 3f) Kiếm Thần: Nhất Kích DỒN LỰC 0,3s (đứng im, né được — hoàn MP + hồi chiêu) rồi bổ nặng; Đột Kích lướt rồi chém xuyên hàng.
withRandom(0.5, () => {
	const s = setup({ tiers: { sword: 3 }, style: 'kiem_than' });
	const f = s.enemy('mob_zombie_001', 120);
	assert.equal(s.cast('heavy_strike', s.east()), 'started');
	assert.ok(s.combat.pc.charging && s.combat.rooted, 'đang dồn lực: đứng im');
	assert.ok(s.plays.some((x) => x.id === 'sparkle' && x.follow), 'tia sáng tụ quanh người lúc dồn lực');
	s.tick(12);
	assert.ok(full(f), 'chưa đủ 0,3s: chưa chém');
	assert.equal(s.cast('slash', s.east()), 'buffered', 'bấm đòn khác lúc dồn lực: xếp hàng, không cắt ngang');
	s.combat.pc.buffered = null;
	s.tick(8);
	assert.equal(s.combat.pc.charging, null);
	assert.equal(f.hpMax - f.hp, armorDamage(ATK * def('heavy_strike').power * depthBonus(3), f.stats.def, false), 'nhát nặng ×2,8');
	assert.ok(f.push && f.push.vx > 0, 'đẩy lùi');
	assert.ok(s.plays.some((x) => x.id === 'slash' && x.scale === 2), 'vệt chém phóng ×2');

	const q = setup({ tiers: { sword: 3 }, style: 'kiem_than' });
	const e = q.enemy('mob_zombie_001', 120);
	q.combat.pc.mp = q.combat.pc.mpMax;
	const mp = q.combat.pc.mp;
	q.combat.cast(idx('heavy_strike'), q.east());
	q.tick(5);
	q.combat.dodge({ x: 0, y: 1 });
	assert.deepEqual([q.combat.pc.charging, q.combat.pc.mp > mp - 1, q.combat.pc.cooldowns.get('heavy_strike')], [null, true, 0], 'né lúc dồn lực: huỷ, hoàn MP + hồi chiêu');
	q.tick(30);
	assert.ok(full(e), 'đã huỷ thì không chém nữa');

	// Kiếm Thần + phủ Hoả: nhát nặng mang lửa (đòn thép ăn phủ phép).
	const fire = setup({ tiers: { sword: 3, fire: 5 }, style: 'kiem_than' });
	fire.combat.setEnchant('fire');
	const fe = fire.enemy('mob_zombie_001', 120);
	fire.cast('heavy_strike', fire.east());
	fire.tick(20);
	assert.ok(fe.burn > 0, 'phủ Hoả: Nhất Kích gây cháy');

	const r = setup({ tiers: { sword: 5 }, style: 'kiem_than' });
	const a = r.enemy('mob_zombie_001', 120);
	const b = r.enemy('mob_zombie_001', 230, 104);
	const off = r.enemy('mob_zombie_001', 160, 200);
	const x0 = r.p.x;
	r.cast('pierce_rush', r.east());
	r.tick(6);
	assert.ok(full(a) && full(b), 'đang lướt: chưa chém');
	r.tick(30);
	near(r.p.x - x0, 220, 'lướt đúng 220px', 1);
	assert.ok(!full(a) && !full(b), 'vệt chém xuyên mọi quái dọc đường');
	assert.ok(full(off), 'xa đường lướt: không trúng');
	assert.ok(r.plays.filter((x) => x.id === 'slash').length >= 4, 'vệt chém nối dọc đường (hình tạm)');
});

// 3g) Kiếm pháp nguyên tố trong trận: mỗi cái một hiệu ứng riêng; không ăn phủ phép (giữ hệ của nó).
withRandom(0.5, () => {
	// Liệt Hoả Trảm: nón lửa → cháy cả nhóm phía trước, sau lưng không.
	const s = setup({ tiers: { sword: 5, fire: 5 } });
	const front = s.enemy('mob_zombie_001', 140);
	const front2 = s.enemy('mob_zombie_001', 150, 150);
	const back = s.enemy('mob_zombie_001', -40);
	assert.equal(s.cast('blaze_slash', s.east()), 'started');
	assert.ok(!full(front) && front.burn > 0 && !full(front2) && front2.burn > 0, 'cháy cả nhóm trong nón');
	assert.ok(full(back), 'sau lưng không trúng');
	assert.ok(s.plays.some((x) => x.id === 'slash'), 'vẫn là một nhát vung kiếm');
	assert.equal(s.cast('frost_cleave', s.east()), 'locked', 'chưa Băng mốc 5: chưa học Hàn Băng Trảm');

	// Thuỷ Long Trảm: sóng theo đường thẳng — ướt + đẩy + hút 15% (cộng Huyết Thuỷ 5% vì Thuỷ ≥ 4).
	const w = setup({ tiers: { sword: 5, water: 5 } });
	const fw = w.enemy('mob_zombie_001', 160);
	w.combat.pc.hp = 50;
	w.combat.pc.lastHurt = Infinity; // tắt hồi máu tự nhiên (2/giây sau 5s không trúng đòn) để đo đúng phần hút máu
	w.cast('water_dragon_slash', w.east());
	w.tick(12);
	assert.ok(fw.wet > 0 && fw.push, 'ướt + đẩy lùi');
	assert.equal(w.combat.pc.hp, 50 + lifestealHeal(fw.hpMax - fw.hp, 0.15 + PASSIVE.lifesteal), 'hút máu 15% + Huyết Thuỷ 5%');

	// Phong Kiếm Cuồng Vũ: vùng BÁM người chơi, xoay chém theo nhịp.
	const g = setup({ tiers: { sword: 5, wind: 5 } });
	const near1 = g.enemy('mob_zombie_001', 100);
	g.cast('gale_blade_dance', g.east());
	g.tick(2);
	assert.ok(!full(near1), 'nhịp đầu chém quái áp sát');
	const hp1 = near1.hp;
	g.p.x = 600;
	const far = g.enemy('mob_zombie_001', 660);
	g.tick(40);
	assert.ok(Math.abs(g.inner.zones[0]!.x - 600) < 1, 'vùng đi theo người chơi');
	assert.ok(!full(far), 'quái quanh chỗ mới bị chém');
	assert.equal(near1.hp, hp1, 'quái ở chỗ cũ thôi bị chém');
	assert.ok(g.plays.filter((x) => x.id === 'slash').length >= 6, 'lưỡi gió xoay quanh mỗi nhịp');
	g.tick(120);
	assert.equal(g.inner.zones.length, 0, 'hết 2,4s');

	// Hàn Băng Trảm: mục tiêu đang LẠNH bị đóng băng; ướt cũng đóng băng (phản ứng); khô + ấm chỉ bị lạnh. Phủ Hoả không đè.
	const i = setup({ tiers: { sword: 5, ice: 5, fire: 5 } });
	assert.equal(i.combat.setEnchant('fire'), 'ok');
	const chilled = i.enemy('mob_zombie_001', 100, 100, false);
	const wet = i.enemy('mob_zombie_001', 110, 120, false);
	const dry = i.enemy('mob_zombie_001', 105, 80, false);
	chilled.chill = 2;
	wet.wet = 3;
	i.cast('frost_cleave', i.east());
	assert.ok(chilled.freeze >= 1.5, `đang lạnh → đóng băng (${chilled.freeze})`);
	assert.ok(wet.freeze > 0, 'ướt → Đóng Băng');
	assert.ok(dry.freeze === 0 && dry.chill > 0, 'khô: chỉ bị lạnh');
	assert.ok([chilled, wet, dry].every((x) => x.burn === 0), 'kiếm pháp giữ hệ Băng — phủ Hoả không đè');

	// Địa Liệt Trảm: gai đá theo đường thẳng → choáng (× Đá Nặng vì Thổ ≥ 2), bám bụi.
	const e = setup({ tiers: { sword: 5, earth: 5 } });
	const fe = e.enemy('mob_zombie_001', 160, 100, false);
	const offLine = e.enemy('mob_zombie_001', 160, 190, false);
	e.cast('earth_rend', e.east());
	for (let n = 0; full(fe); n += 1) {
		assert.ok(n < 60, 'gai đá phải trồi tới');
		e.tick();
	}
	near(fe.stun, 0.8 * PASSIVE.earthCC, 'choáng 0,8s × Đá Nặng (đo ngay frame trúng)', 0.02);
	e.tick(20);
	assert.ok(fe.dust > 0 && full(offLine), 'bám bụi; lệch đường thì không');

	// Nhịp Chém + hệ số con đường KIẾM áp cho kiếm pháp (đòn kiếm), không phải hệ số phép.
	const k = setup({ tiers: { sword: 5, fire: 5 } });
	k.combat.setPath('sword');
	near(k.combat.cooldownOf(def('blaze_slash')), def('blaze_slash').cooldown / 1.1, 'Nhịp Chém rút hồi chiêu kiếm pháp');
	const kf = k.enemy('mob_zombie_001', 140);
	k.cast('blaze_slash', k.east());
	assert.equal(kf.hpMax - kf.hp, armorDamage(k.combat.pc.atk * 1.35 * def('blaze_slash').power * depthBonus(5), kf.stats.def, false), 'Kiếm sĩ ×1,35 (không phải ×0,65 của phép)');
});

// 3h) Hình tạm làm lại: Băng Trụ (cột băng phát SAU CÙNG, sương/băng vỡ ở lớp đất), Lốc Xoáy (phễu chồng 4 tầng gió).
{
	const s = setup({ tiers: { ice: 5 } });
	s.cast('ice_spire', { x: 200, y: 100 });
	s.tick(32);
	const order = s.plays.filter((x) => ['frost', 'ice_burst', 'ice_shard'].includes(x.id) && Math.abs(x.x - 200) < 30);
	const firstShard = order.findIndex((x) => x.id === 'ice_shard');
	assert.ok(firstShard > 0 && order.slice(firstShard).every((x) => x.id === 'ice_shard'), 'mũi băng vẽ SAU sương / băng vỡ — không bị che');
	assert.ok(order.filter((x) => x.id !== 'ice_shard').every((x) => x.layer === 'ground'), 'sương / băng vỡ nằm lớp đất');
	const shards = order.filter((x) => x.id === 'ice_shard');
	assert.deepEqual(shards.map((x) => x.scaleX ?? 1).sort(), [3, 3, 5], 'cột ghép 3 mũi: giữa kéo dài ×5, hai bên ×3');
	assert.ok(shards.every((x) => (x.scaleX ?? 1) > (x.scaleY ?? 1)), 'kéo dài theo trục mũi → cột đứng, không thành cục pha lê');
	assert.ok(shards.every((x) => x.duration === 0.8), 'giữ hình 0,8s cho kịp đọc');
	assert.deepEqual(shards.map((x) => Math.round(x.x - 200)).sort((a, b) => a - b), [-22, 0, 22], 'hai mũi phụ lệch hai bên');

	const c = setup({ tiers: { wind: 3 } });
	c.cast('cyclone', { x: 200, y: 100 });
	const spins = c.plays.filter((x) => x.id === 'wind_spin');
	assert.equal(spins.length, 4, 'phễu 4 tầng');
	assert.ok(spins.every((x) => x.duration === 2.5), 'lặp suốt 2,5s');
	for (let k = 1; k < spins.length; k += 1) {
		assert.ok(spins[k]!.y < spins[k - 1]!.y, 'tầng sau cao hơn');
		assert.ok((spins[k]!.scaleX ?? 1) >= (spins[k - 1]!.scaleX ?? 1), 'càng lên càng rộng (phễu)');
	}
	assert.ok(new Set(spins.map((x) => x.fps)).size === 4, 'mỗi tầng một nhịp quay — không quay đồng bộ như chong chóng');
	assert.ok(c.plays.some((x) => x.id === 'dust' && x.layer === 'ground' && x.duration === 2.5), 'bụi cuốn ở chân');
}

console.log(
	'✔ swordstyles.test: Thế Tĩnh (chặn + phản mọi đòn cận chiến, đạn/đòn vùng 40%, đứng im, né/bấm đòn thì thôi), Lưu Thủy Phản (cửa sổ 0,6s có báo hiệu, đỡ một đòn — cả đạn — phản gấp đôi, phủ Thuỷ hút máu), Tâm Tĩnh, Lướt Chém i-frame, Nhẹ Như Gió, Ảnh Bộ sau lưng + chí mạng, Nhất Kích dồn lực (né được, hoàn lại), Đột Kích xuyên hàng, 5 kiếm pháp nguyên tố, Băng Trụ / Lốc Xoáy làm lại',
);

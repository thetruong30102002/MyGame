// Chạy: npx tsx tests/swordtiers69.test.ts — GĐ3 lượt B: mốc 6–9 của 3 lưu phái Kiếm (bảng 3.1). Luật thuần (đúng lúc, cộng
// dồn, ngưỡng máu), dữ liệu + mô tả sinh từ số liệu, trần mốc 9 mọi nhánh, và chạy thật trong CombatSystem: Phá Giáp (phá
// giáp + vỡ giáp chồng lên), Thế Áp Đảo (cộng dồn / về 0), Lưỡi Sóng (xuyên, rộng, mang phủ phép), Bất Khuất, Dòng Chảy Ngược
// (gạt đạn), Phản Đòn (cửa sổ né đúng lúc + đỡ đúng lúc), Xoáy Nước (mạnh hơn sau khi đỡ), Mặt Hồ Phẳng, Liên Hoàn, Đà Lướt,
// Phi Kiếm (đi–về không trúng lặp), Bóng Mờ (tỉ lệ bằng chuỗi ngẫu nhiên có hạt giống).
import assert from 'node:assert/strict';
import { armorDamage, COUNTER, lifestealHeal, lowHp, perfectTiming, pressBonus, SUNDER_TAKEN } from '../src/game/combat/skillRules';
import { estimateText, HERO_SKILLS, isSwordSkill, powerText, skillFacts, type SkillDef } from '../src/game/combat/skills';
import {
	BRANCHES,
	depthBonus,
	knowsSkill,
	nextTierCost,
	PASSIVE,
	passiveEffects,
	SKILL_NODE,
	STYLE_TREE,
	SWORD_STYLES,
	tierCap,
	TREE,
	type SwordStyle,
	type Tiers,
} from '../src/game/combat/talents';
import { TEMP_ART } from '../src/game/combat/tempArt';

const near = (a: number, b: number, what: string, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${what}: ${a} ≠ ${b}`);
const idx = (id: string) => {
	const i = HERO_SKILLS.findIndex((s) => s.id === id);
	assert.ok(i >= 0, `có kỹ năng ${id}`);
	return i;
};
const def = (id: string): SkillDef => HERO_SKILLS[idx(id)]!;
const all = () => true;

/** 6 kỹ năng GĐ3 lượt B: lưu phái, mốc. */
const NEW: Record<string, [SwordStyle, number]> = {
	sunder_strike: ['kiem_than', 6],
	blade_wave: ['kiem_than', 8],
	backflow: ['thuy_than', 6],
	whirlpool: ['thuy_than', 8],
	chain_slash: ['bac_than', 6],
	flying_sword: ['bac_than', 8],
};

// 1) Luật thuần.
{
	assert.deepEqual([COUNTER.perfect, COUNTER.after], [0.12, 2.5]);
	// 0,12s chứ không 0,3s: đà đánh quái 0,3s ≈ i-frame cú lăn 0,32s → cửa sổ 0,3s thì cú né nào gặp đòn cũng "đúng lúc".
	assert.deepEqual([0, 0.06, 0.12, 0.13, 0.3, -0.01].map((t) => perfectTiming('dodge', t)), [true, true, true, false, false, false], 'né đúng lúc: đòn chạm trong 0,12s sau khi bấm né');
	assert.deepEqual([0.05, 0.12, 0.3].map((t) => perfectTiming('stance', t)), [true, true, false], 'Thế Tĩnh: 0,12s đầu của thế');
	assert.deepEqual([0, 0.55].map((t) => perfectTiming('parry', t)), [true, true], 'Lưu Thủy Phản: cả cửa sổ đỡ (vốn ngắn) là đúng lúc');
	near(pressBonus(0, 0.05, 5), 1, 'chưa trúng');
	near(pressBonus(3, 0.05, 5), 1.15, '3 nhát');
	near(pressBonus(9, 0.05, 5), 1.25, 'kẹp 5 lần');
	assert.deepEqual([lowHp(29, 100, 0.3), lowHp(30, 100, 0.3), lowHp(0, 100, 0.3)], [true, false, false], 'Bất Khuất: dưới 30% (gục rồi thì thôi)');
	assert.equal(SUNDER_TAKEN, 1.15);
}

// 2) Dữ liệu: nối CUỐI (chỉ số 38+), đúng lưu phái / mốc, đòn thép, mô tả + tooltip sinh từ số liệu, trần mốc 9 mọi nhánh.
{
	assert.deepEqual(
		HERO_SKILLS.slice(38).map((s) => s.id),
		Object.keys(NEW),
		'nối cuối, không lệch chỉ số cũ',
	);
	for (const [id, [style, tier]] of Object.entries(NEW)) {
		const s = def(id);
		assert.deepEqual(SKILL_NODE[id], { branch: 'sword', tier, style }, `${id}: Kiếm mốc ${tier} của ${style}`);
		assert.ok(s.element === 'steel' && isSwordSkill(s) && s.anim === 'attack' && !s.key, `${id}: đòn Kiếm thép (ăn phủ phép), động tác vung kiếm sẵn có, vào ô trống`);
		const node = STYLE_TREE[style][tier - 3]!;
		assert.deepEqual([node.skillId, node.kind, node.ready], [id, 'active', true], `${id}: cây lưu phái trỏ đúng`);
		assert.equal(knowsSkill(s, { sword: tier }, all, style), true, `${id}: đủ mốc là học`);
		assert.equal(knowsSkill(s, { sword: tier - 1 }, all, style), false, `${id}: chưa đủ mốc`);
		for (const other of SWORD_STYLES.filter((x) => x !== style)) assert.equal(knowsSkill(s, { sword: 9 }, all, other), false, `${id}: lưu phái khác không học được`);
		assert.ok(TEMP_ART[id]?.icon && TEMP_ART[id]!.look.length && TEMP_ART[id]!.todo, `${id}: hình tạm + icon tạm + ghi chú cần vẽ`);
	}
	const passives: Record<SwordStyle, [string, string]> = { kiem_than: ['Thế Áp Đảo', 'Bất Khuất'], thuy_than: ['Phản Đòn', 'Mặt Hồ Phẳng'], bac_than: ['Đà Lướt', 'Bóng Mờ'] };
	for (const st of SWORD_STYLES) {
		const t = STYLE_TREE[st];
		assert.deepEqual([t[4]!.name, t[4]!.kind, t[4]!.ready, t[6]!.name, t[6]!.kind, t[6]!.ready], [passives[st][0], 'passive', true, passives[st][1], 'passive', true], `${st}: bị động mốc 7 / 9`);
		assert.equal(t[7]!.ready, false, `${st}: mốc 10 (tuyệt kỹ) vẫn "Sắp có" — GĐ4`);
		assert.ok(['passive', 'active'].includes(t[7]!.kind));
	}
	// Trần mốc 9 mọi nhánh; mốc 10 vẫn "Sắp có".
	for (const b of BRANCHES) {
		assert.equal(tierCap(b), 9, `${b}: trần mốc 9`);
		assert.equal(TREE[b][9]!.ready, false, `${b}: mốc 10 sắp có`);
		assert.equal(nextTierCost({ [b]: 9 } as Tiers, b, all), null, `${b}: mốc 9 thì hết cộng`);
		assert.equal(nextTierCost({ [b]: 8 } as Tiers, b, all), 5, `${b}: mốc 9 giá 5`);
	}
	assert.match(TREE.sword[5]!.name, /Phá Giáp · Dòng Chảy Ngược · Liên Hoàn/, 'chưa chọn lưu phái: nấc gộp tên ba lưu phái');
	assert.equal(TREE.sword[5]!.ready && TREE.sword[8]!.ready, true);

	// Mô tả nấc / tooltip sinh từ số liệu.
	const kt = STYLE_TREE.kiem_than;
	const tt = STYLE_TREE.thuy_than;
	const bt = STYLE_TREE.bac_than;
	assert.match(kt[3]!.desc, /phá giáp 6s · quái đang bị phá giáp: vỡ giáp 6s \(nhận thêm 15%\).*uy lực ×2,4 · 10 MP · hồi 6s/);
	assert.match(kt[4]!.desc, /\+5% sát thương đòn Kiếm \(tối đa 5 lần = \+25%\).*3 giây/);
	assert.match(kt[5]!.desc, /Luồng kiếm bay xa 440, xuyên mục tiêu · uy lực ×3 · 18 MP · hồi 8s/);
	assert.match(kt[6]!.desc, /Dưới 30% máu: công \+20%, hút máu 5%/);
	assert.match(tt[3]!.desc, /Gạt đạn 2,5s: đạn quái bay tới gần bị chém bay ngược về kẻ bắn · đạn phản ×2 · 10 MP · hồi 8s/);
	assert.match(tt[4]!.desc, /trong 0,12 giây sau khi bấm né.*chắc chắn chí mạng.*×1,6/);
	assert.match(tt[6]!.desc, /tối đa một lần mỗi 1 giây/, 'Mặt Hồ Phẳng: ghi hồi nội');
	assert.match(tt[5]!.desc, /Xoay chém quanh mình, bán kính 110 · vừa đỡ \/ gạt \/ phản đòn \(trong 2,5s\): mạnh thêm ×1,8 · đẩy lùi 60 · uy lực ×1,9/);
	assert.match(tt[6]!.desc, /hồi 5% máu tối đa/);
	assert.match(bt[3]!.desc, /Chuỗi 4 nhát chém, tầm 80, góc 130° · uy lực ×0,8 mỗi nhát · 10 MP · hồi 5s/);
	assert.match(bt[4]!.desc, /Né xong, 3 đòn Kiếm kế \(trong 3 giây\) nhanh hơn 25%/);
	assert.match(bt[5]!.desc, /Phóng kiếm bay xa 320, xuyên mục tiêu rồi bay về tay.*uy lực ×1,8 mỗi lượt \(đi \+ về\)/);
	assert.match(bt[6]!.desc, /15% né hoàn toàn một đòn/);
	assert.equal(powerText(def('chain_slash')), 'uy lực ×0,8 mỗi nhát');
	assert.equal(powerText(def('slash')), 'uy lực ×1,25', 'Trảm giữ chữ cũ');
	assert.deepEqual(skillFacts(def('slash')), [], 'Trảm giữ tooltip cũ');
	assert.equal(estimateText(def('chain_slash'), 10), '≈ 10 mỗi nhát × 4');
	assert.equal(estimateText(def('flying_sword'), 23), '≈ 23 mỗi lượt × 2 (đi + về)');
	assert.equal(estimateText(def('whirlpool'), 30), '≈ 30 sát thương (vừa đỡ đòn: ≈ 54)');
	assert.equal(estimateText(def('blade_wave'), 48), '≈ 48 sát thương');
	assert.equal(estimateText(def('backflow'), 32), 'đạn phản ≈ 32');
	assert.match(skillFacts(def('ice_mirror'))[0]!, /^Khiên 4s/, 'Gương Băng (phép) giữ chữ cũ');

	// Tự cân: mốc 8 của lưu phái mạnh hơn mốc 5 trên MỘT mục tiêu (Ảnh Bộ tính chí mạng chắc chắn; Xoáy Nước tính lúc vừa đỡ;
	// Phi Kiếm trúng cả đi lẫn về), tốn MP hơn, hồi chiêu dài hơn; mốc 6 nhẹ hơn mốc 8.
	const perTarget = (s: SkillDef) => s.power * (s.crit && s.crit >= 1 ? 1.75 : 1) * (s.afterGuard ?? 1) * (s.returns ? 2 : 1) * (s.count && s.kind === 'melee' ? s.count : 1);
	const five: Record<SwordStyle, string> = { kiem_than: 'pierce_rush', thuy_than: 'flowing_counter', bac_than: 'shadow_step' };
	for (const st of SWORD_STYLES) {
		const s5 = def(five[st]);
		const s6 = HERO_SKILLS.find((s) => SKILL_NODE[s.id]?.style === st && SKILL_NODE[s.id]?.tier === 6)!;
		const s8 = HERO_SKILLS.find((s) => SKILL_NODE[s.id]?.style === st && SKILL_NODE[s.id]?.tier === 8)!;
		assert.ok(perTarget(s8) >= perTarget(s5), `${st}: ${s8.name} (×${perTarget(s8).toFixed(2)}) ≥ ${s5.name} (×${perTarget(s5).toFixed(2)})`);
		assert.ok(s8.mpCost > s5.mpCost && s8.cooldown > s5.cooldown, `${st}: mốc 8 tốn MP + hồi lâu hơn mốc 5`);
		assert.ok(s6.mpCost < s8.mpCost && s6.cooldown <= s8.cooldown, `${st}: mốc 6 nhẹ hơn mốc 8`);
	}

	// Bị động theo lưu phái + mốc.
	const fx = (tier: number, style: SwordStyle | null) => passiveEffects({ sword: tier }, style);
	const flags = (e: ReturnType<typeof fx>) => [e.press, e.rage, e.riposte, e.lake, e.momentum, e.evade];
	assert.deepEqual(flags(fx(6, 'kiem_than')), [false, false, false, false, false, 0], 'mốc 6: chưa có bị động 7/9');
	assert.deepEqual(flags(fx(7, 'kiem_than')), [true, false, false, false, false, 0], 'Kiếm Thần 7: Thế Áp Đảo');
	assert.deepEqual(flags(fx(9, 'kiem_than')), [true, true, false, false, false, 0], 'Kiếm Thần 9: + Bất Khuất');
	assert.deepEqual(flags(fx(9, 'thuy_than')), [false, false, true, true, false, 0], 'Thủy Thần 9: Phản Đòn + Mặt Hồ Phẳng');
	assert.deepEqual(flags(fx(8, 'bac_than')), [false, false, false, false, true, 0], 'Bắc Thần 8: Đà Lướt');
	assert.deepEqual(flags(fx(9, 'bac_than')), [false, false, false, false, true, PASSIVE.evade], 'Bắc Thần 9: + Bóng Mờ');
	assert.deepEqual(flags(fx(9, null)), [false, false, false, false, false, 0], 'chưa có lưu phái: không có gì');
	assert.deepEqual([PASSIVE.pressStep, PASSIVE.pressMax, PASSIVE.rageHp, PASSIVE.rageAtk, PASSIVE.rageDrain, PASSIVE.lakeHeal, PASSIVE.momentumHits, PASSIVE.momentumSpeed, PASSIVE.evade], [0.05, 5, 0.3, 1.2, 0.05, 0.05, 3, 1.25, 0.15], 'đúng bảng 3.1');
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
/** Nhân vật giả không có động tác ra đòn: đòn nổ ngay lúc bấm. */
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
	projectiles: { team: string; ghost?: boolean; element: string; x: number; y: number }[];
	pending: unknown[];
	strike(f: Fighter, dist: number): void;
	enemyShot(f: Fighter, nx: number, ny: number): void;
	incoming(kind: 'melee' | 'shot' | 'area', amount: number): void;
}
type Play = { id: string; x: number; y: number; tint?: number };

function setup(o: { tiers?: Tiers; style?: SwordStyle | null } = {}) {
	const plays: Play[] = [];
	const floats: string[] = [];
	const vfx = {
		ground: new Container(),
		top: new Container(),
		play: (id: string, x: number, y: number, opt?: { tint?: number }) => void plays.push({ id, x, y, tint: opt?.tint }),
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
			toast: () => undefined,
			enemyKilled: () => undefined,
			bossNear: () => false,
			playerRespawn: () => ({ x: 0, y: 0 }),
			isUnlocked: () => true,
		},
		{ level: 1, exp: 0, coins: 0, potions: 0 },
		vfx as never,
	);
	const p = new Actor('hero', fakeTextures(), 40, 100, 'S', null);
	combat.setPlayer(p);
	if (o.tiers) combat.setTalents(o.tiers, o.style ?? null);
	// Tắt hồi máu ngoài trận (2 máu/giây sau 5 giây không trúng đòn) để đo đúng phần hồi của bị động.
	combat.pc.lastHurt = 1e9;
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
	const cast = (id: string, aim: { x: number; y: number }) => {
		combat.pc.mp = combat.pc.mpMax;
		combat.pc.cooldowns.delete(id);
		return combat.cast(idx(id), aim);
	};
	/** Quái đứng yên (`hold` = choáng dài, không tự đánh) để đo trúng. */
	const enemy = (id: string, x: number, y = 100, hold = true): Fighter => {
		const home = { x, y, radius: 60 };
		const f = combat.addEnemy(new Actor(id, fakeTextures(), x, y, 'W', home), id, home, id)!;
		f.attackTimer = 99;
		if (hold) f.stun = 99;
		return f;
	};
	const east = () => ({ x: p.x + 400, y: p.y - p.chest });
	const west = () => ({ x: p.x - 400, y: p.y - p.chest });
	const dist = (f: Fighter) => Math.hypot(f.actor.x - p.x, f.actor.y - p.y);
	return { combat, p, plays, floats, tick, inner, cast, enemy, east, west, dist };
}
const full = (f: Fighter) => f.hp === f.hpMax;
const lost = (f: Fighter) => f.hpMax - f.hp;
/** Khoá ngẫu nhiên (biên độ sát thương, chí mạng, Bóng Mờ). 0,5 → biên độ ×1, không chí mạng thường. */
function withRandom<T>(v: number | (() => number), run: () => T): T {
	const rnd = Math.random;
	Math.random = typeof v === 'number' ? () => v : v;
	try {
		return run();
	} finally {
		Math.random = rnd;
	}
}
/** Chuỗi ngẫu nhiên có hạt giống (mulberry32) — đo tỉ lệ mà lần chạy nào cũng ra một số. */
function seeded(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
const ATK = 16;
const ZDEF = 4; // giáp xác sống

// 3a) Cả 6 kỹ năng chạy thật: chưa đủ mốc thì khoá; đủ mốc tung được, trúng quái, lịch hẹn + đạn tan hết.
withRandom(0.5, () => {
	for (const [id, [style, tier]] of Object.entries(NEW)) {
		const s = setup({ tiers: { sword: tier - 1 }, style });
		assert.equal(s.cast(id, s.east()), 'locked', `${id}: mốc ${tier - 1} chưa học`);
		s.combat.setTalents({ sword: tier }, style);
		const f = s.enemy(id === 'backflow' ? 'mob_skeleton_archer_001' : 'mob_zombie_001', id === 'blade_wave' || id === 'flying_sword' ? 220 : 90);
		assert.equal(s.cast(id, s.east()), 'started', `${id}: mốc ${tier} tung được`);
		if (id === 'backflow') s.inner.enemyShot(f, -1, 0);
		s.tick(120);
		assert.ok(!full(f), `${id}: trúng quái`);
		assert.equal(s.inner.pending.length, 0, `${id}: hết lịch hẹn`);
		assert.equal(s.inner.projectiles.length, 0, `${id}: đạn tan / bắt lại hết`);
	}
});

// 3b) Phá Giáp: nhát nặng ×2,4 + phá giáp 6s; đánh quái ĐANG bị phá giáp thì vỡ giáp thêm (nhận ×1,15 nữa) — kể cả phá giáp
//     của kiếm phủ Thổ ("phá giáp chồng phá giáp").
withRandom(0.5, () => {
	const s = setup({ tiers: { sword: 6 }, style: 'kiem_than' });
	const f = s.enemy('mob_zombie_001', 100);
	const k6 = depthBonus(6);
	s.cast('sunder_strike', s.east());
	assert.equal(lost(f), armorDamage(ATK * 2.4 * k6, ZDEF, false), 'nhát nặng ×2,4 (phá giáp áp SAU nhát này)');
	assert.deepEqual([f.armor, f.sunder], [6, 0], 'phá giáp 6s; chưa bị phá giáp từ trước → chưa vỡ giáp');
	assert.ok(s.floats.includes('Phá giáp') && !s.floats.includes('Vỡ giáp!'));
	assert.ok(f.push, 'đẩy lùi nhẹ');
	const slash = () => {
		f.actor.x = 100;
		const hp = (f.hp = f.hpMax);
		s.cast('slash', s.east());
		return hp - f.hp;
	};
	assert.equal(slash(), armorDamage(ATK * 1.25 * k6, ZDEF, true), 'đang phá giáp: Trảm ăn giáp −50% + nhận +15%');
	f.actor.x = 100;
	s.cast('sunder_strike', s.east());
	assert.equal(f.sunder, 6, 'Phá Giáp vào quái đang bị phá giáp: vỡ giáp 6s');
	assert.ok(s.floats.includes('Vỡ giáp!'));
	assert.equal(slash(), armorDamage(ATK * 1.25 * k6 * SUNDER_TAKEN, ZDEF, true), 'vỡ giáp: nhận thêm ×1,15 chồng lên phá giáp');
	s.tick(60 * 6 + 2);
	assert.deepEqual([f.armor, f.sunder], [0, 0], 'hết 6s');
	assert.equal(slash(), armorDamage(ATK * 1.25 * k6, ZDEF, false), 'hết phá giáp: như thường');

	// Kiếm Thần + phủ Thổ: nhát Trảm phủ Thổ phá giáp trước → Phá Giáp liền sau đó vỡ giáp luôn.
	const e = setup({ tiers: { sword: 6, earth: 5 }, style: 'kiem_than' });
	assert.equal(e.combat.setEnchant('earth'), 'ok');
	const g = e.enemy('mob_zombie_001', 100);
	e.cast('sunder_strike', e.east());
	assert.equal(g.sunder, 0, 'nhát đầu: chưa bị phá giáp từ trước');
	assert.equal(g.armor, 6, 'phủ Thổ (phá giáp 4s) không làm NGẮN phá giáp 6s của Phá Giáp — gộp khống chế lấy mức dài hơn');
	g.armor = 0;
	g.actor.x = 100;
	e.cast('slash', e.east());
	assert.ok(g.armor > 0, 'Trảm phủ Thổ phá giáp');
	g.actor.x = 100;
	e.cast('sunder_strike', e.east());
	assert.equal(g.sunder, 6, 'phá giáp chồng phá giáp');

	// Tung lại ĐÚNG lúc hết hồi chiêu (không xoá hồi chiêu như helper `cast`): hồi 6 ÷ 1,1 = 5,45s < phá giáp 6s → lần trước vẫn
	// còn → tự vỡ giáp được (hồi 7s = 6,36s thì phá giáp đã hết 0,36s trước — Phá Giáp không bao giờ tự vỡ giáp).
	const r = setup({ tiers: { sword: 6 }, style: 'kiem_than' });
	const rf = r.enemy('mob_zombie_001', 100);
	const sunder = def('sunder_strike');
	const cd = r.combat.cooldownOf(sunder);
	assert.ok(cd < 6, `hồi chiêu thật ${cd.toFixed(2)}s ngắn hơn phá giáp 6s`);
	r.combat.pc.mp = r.combat.pc.mpMax;
	assert.equal(r.combat.cast(idx('sunder_strike'), r.east()), 'started');
	r.tick(Math.ceil(cd * 60));
	rf.actor.x = 100;
	assert.equal(r.combat.cast(idx('sunder_strike'), r.east()), 'started', 'hết hồi chiêu thì tung lại được');
	assert.ok(rf.sunder > 0, 'tung lại ngay khi hết hồi chiêu: vỡ giáp');
});

// 3c) Thế Áp Đảo (Kiếm Thần 7): mỗi nhát Kiếm trúng liên tiếp +5% (tối đa 5 lần); chém hụt hoặc 3 giây không trúng → về 0.
withRandom(0.5, () => {
	const s = setup({ tiers: { sword: 7 }, style: 'kiem_than' });
	const f = s.enemy('mob_zombie_001', 100);
	const base = ATK * 1.25 * depthBonus(7);
	const slash = () => {
		f.actor.x = 100;
		const hp = (f.hp = f.hpMax);
		s.cast('slash', s.east());
		return hp - f.hp;
	};
	const got = Array.from({ length: 7 }, slash);
	assert.deepEqual(
		got,
		[0, 1, 2, 3, 4, 5, 5].map((k) => armorDamage(base * (1 + 0.05 * k), ZDEF, false)),
		'cộng dồn +5% mỗi nhát trúng, kẹp ở 5 lần (+25%)',
	);
	assert.equal(s.combat.pressStacks, 5);
	assert.equal(s.floats.filter((t) => t === 'Áp Đảo!').length, 1, 'báo một lần khi đủ 5');
	s.cast('slash', s.west());
	assert.equal(s.combat.pressStacks, 0, 'chém hụt hẳn: về 0');
	assert.equal(slash(), armorDamage(base, ZDEF, false), 'sau khi hụt: sát thương gốc');
	slash();
	assert.equal(s.combat.pressStacks, 2);
	s.tick(60 * 3 + 6);
	assert.equal(s.combat.pressStacks, 0, '3 giây không trúng: về 0');
	assert.equal(slash(), armorDamage(base, ZDEF, false));

	// Đạn kiếm cũng tính nhát (lần trúng đầu) và ăn hệ số; phép không ăn.
	const q = setup({ tiers: { sword: 8, fire: 1 }, style: 'kiem_than' });
	const a = q.enemy('mob_zombie_001', 100);
	for (let i = 0; i < 3; i += 1) {
		a.actor.x = 100;
		q.cast('slash', q.east());
	}
	const b = q.enemy('mob_zombie_001', 300);
	q.cast('blade_wave', q.east());
	q.tick(40);
	assert.equal(lost(b), armorDamage(ATK * 3 * depthBonus(8) * 1.15, ZDEF, false), 'Lưỡi Sóng sau 3 nhát trúng: ×1,15');
	assert.equal(q.combat.pressStacks, 4, 'luồng kiếm trúng = một nhát');
	const c = q.enemy('mob_zombie_001', 160, 300);
	q.cast('fire_bolt', { x: 160, y: 300 - c.actor.chest });
	for (let i = 0; full(c); i += 1) {
		assert.ok(i < 60, 'Hoả Cầu phải trúng');
		q.tick();
	}
	assert.equal(lost(c), armorDamage(ATK * 1.4, c.stats.def, false), 'phép (Hoả Cầu) không ăn Thế Áp Đảo (đo ngay frame trúng, trước nhịp cháy)');

	// Kiếm Thần 6: chưa có.
	const r = setup({ tiers: { sword: 6 }, style: 'kiem_than' });
	const d = r.enemy('mob_zombie_001', 100);
	const dmg = [0, 1, 2].map(() => {
		d.actor.x = 100;
		d.hp = d.hpMax;
		r.cast('slash', r.east());
		return lost(d);
	});
	assert.equal(new Set(dmg).size, 1, 'Kiếm Thần 6: không cộng dồn');
});

// 3d) Lưỡi Sóng (Kiếm Thần 8): luồng kiếm bay 440, xuyên cả hàng, rộng hơn mũi tên; phủ phép thì mang hệ.
withRandom(0.5, () => {
	const s = setup({ tiers: { sword: 8 }, style: 'kiem_than' });
	const row = [130, 260, 390].map((x) => s.enemy('mob_zombie_001', x));
	const far = s.enemy('mob_zombie_001', 560);
	// Lệch dọc vừa ngoài tầm trúng của đạn thường (nửa bề ngang 20) nhưng trong tầm luồng kiếm (30).
	const shotY = s.p.y - s.p.chest;
	const low = s.enemy('mob_zombie_001', 200, Math.floor(shotY + Math.round(s.p.height * 0.96) + 5));
	s.cast('blade_wave', s.east());
	const wave = s.inner.projectiles.find((x) => x.team === 'player')!;
	assert.equal(wave.element, 'steel');
	s.tick(60);
	const per = armorDamage(ATK * 3 * depthBonus(8), ZDEF, false);
	assert.deepEqual(row.map(lost), [per, per, per], 'xuyên cả hàng, mỗi con một lần');
	assert.ok(full(far), 'ngoài tầm 440: không trúng');
	assert.ok(!full(low), 'luồng kiếm rộng: trúng cả quái lệch dọc mà mũi tên trượt');
	assert.ok(s.plays.some((x) => x.id === 'slash'), 'vung kiếm (vệt chém) lúc phóng');

	const fire = setup({ tiers: { sword: 8, fire: 5 }, style: 'kiem_than' });
	assert.equal(fire.combat.setEnchant('fire'), 'ok');
	const fe = fire.enemy('mob_zombie_001', 250);
	fire.cast('blade_wave', fire.east());
	assert.equal(fire.inner.projectiles.find((x) => x.team === 'player')!.element, 'fire', 'phủ Hoả: luồng kiếm lửa');
	fire.tick(40);
	assert.ok(fe.burn > 0, 'gây cháy');
});

// 3e) Bất Khuất (Kiếm Thần 9): dưới 30% máu → công +20% + hút máu 5%; bảng Nhân vật hiện công đã cộng.
withRandom(0.5, () => {
	const first = (tiers: Tiers, hpPct: number) => {
		const s = setup({ tiers, style: 'kiem_than' });
		const f = s.enemy('mob_zombie_001', 100);
		const pc = s.combat.pc;
		pc.hp = Math.floor(pc.hpMax * hpPct);
		s.tick();
		const hp = pc.hp;
		// Đọc bảng chỉ số TRƯỚC nhát chém: hút máu của chính nhát đó có thể kéo máu qua ngưỡng 30%.
		const sheet = s.combat.sheet;
		s.cast('slash', s.east());
		return { dmg: lost(f), healed: pc.hp - hp, sheet, floats: s.floats };
	};
	const k9 = depthBonus(9);
	const hi = first({ sword: 9 }, 1);
	assert.equal(hi.dmg, armorDamage(ATK * 1.25 * k9, ZDEF, false), 'đầy máu: như thường');
	assert.deepEqual([hi.sheet.attack, hi.sheet.rage, hi.healed], [ATK, false, 0]);
	const lo = first({ sword: 9 }, 0.29);
	const dmg = armorDamage(ATK * 1.25 * k9 * PASSIVE.rageAtk, ZDEF, false);
	assert.equal(lo.dmg, dmg, 'dưới 30%: công +20%');
	assert.equal(lo.healed, lifestealHeal(dmg, PASSIVE.rageDrain), 'hút máu 5%');
	assert.deepEqual([lo.sheet.attack, lo.sheet.magic, lo.sheet.rage], [Math.round(ATK * 1.2), Math.round(ATK * 1.2), true], 'bảng Nhân vật: công đã gồm +20%');
	assert.ok(lo.floats.includes('Bất Khuất!'), 'báo khi vừa tụt dưới ngưỡng');
	assert.equal(first({ sword: 9 }, 0.31).dmg, hi.dmg, 'từ 30% trở lên: chưa bật');
	assert.equal(first({ sword: 8 }, 0.2).dmg, armorDamage(ATK * 1.25 * depthBonus(8), ZDEF, false), 'Kiếm Thần 8: chưa có');
});

// 3f) Dòng Chảy Ngược (Thủy Thần 6): gạt đạn 2,5s — đạn quái bị chém bay ngược về kẻ bắn ×2; hết giờ thì đạn trúng như thường.
withRandom(0.5, () => {
	const s = setup({ tiers: { sword: 6 }, style: 'thuy_than' });
	const archer = s.enemy('mob_skeleton_archer_001', 260);
	assert.equal(s.cast('backflow', s.east()), 'started');
	assert.ok(s.combat.pc.ward?.sword && s.combat.pc.ward.element === 'steel' && !s.combat.rooted, 'gạt đạn: không đứng im như Thế Tĩnh');
	const hp = s.combat.pc.hp;
	s.inner.enemyShot(archer, -1, 0);
	for (let i = 0; full(archer); i += 1) {
		assert.ok(i < 120, 'đạn gạt ngược phải bay về trúng kẻ bắn');
		s.tick();
	}
	assert.equal(s.combat.pc.hp, hp, 'không mất máu');
	assert.equal(lost(archer), armorDamage(ATK * 2 * depthBonus(6), archer.stats.def, false), 'đạn gạt ngược ×2 sức kiếm');
	assert.ok(s.floats.includes('Gạt!') && s.plays.some((x) => x.id === 'slash'), 'vung kiếm gạt');
	s.tick(60 * 2.5);
	assert.equal(s.combat.pc.ward, null, 'hết 2,5s');
	s.combat.pc.iframes = 0;
	s.inner.enemyShot(archer, -1, 0);
	s.tick(60);
	assert.ok(s.combat.pc.hp < hp, 'hết gạt: đạn trúng');

	// Phủ Thuỷ: đạn gạt ngược mang hệ Thuỷ — làm ướt, Huyết Thuỷ hút máu (lối "bất tử").
	const w = setup({ tiers: { sword: 6, water: 5 }, style: 'thuy_than' });
	w.combat.setEnchant('water');
	const wa = w.enemy('mob_skeleton_archer_001', 260);
	w.combat.pc.hp = 40;
	w.cast('backflow', w.east());
	w.inner.enemyShot(wa, -1, 0);
	for (let i = 0; full(wa); i += 1) {
		assert.ok(i < 120);
		w.tick();
	}
	assert.ok(wa.wet > 0, 'phủ Thuỷ: kẻ bắn bị ướt');
	assert.equal(w.combat.pc.hp, 40 + lifestealHeal(lost(wa), PASSIVE.lifesteal), 'Huyết Thuỷ hút máu từ đạn gạt');
});

// 3g) Phản Đòn (Thủy Thần 7): NÉ đúng lúc (đòn chạm ≤ 0,12s sau khi bấm né) → tự chém trả chắc chắn chí mạng; quá cửa sổ thì
//     chỉ là né thường; ĐỠ đúng lúc (Lưu Thủy Phản; Thế Tĩnh 0,12s đầu) → nhát phản chí mạng.
withRandom(0.99, () => {
	const crit = (power: number, tier: number) => armorDamage(ATK * power * depthBonus(tier) * (0.9 + 0.99 * 0.2) * 1.75, ZDEF, false);
	const plain = (power: number, tier: number) => armorDamage(ATK * power * depthBonus(tier) * (0.9 + 0.99 * 0.2), ZDEF, false);

	const s = setup({ tiers: { sword: 7 }, style: 'thuy_than' });
	const f = s.enemy('mob_zombie_001', 70);
	s.combat.dodge({ x: 0, y: 1 });
	s.tick(6);
	const hp = s.combat.pc.hp;
	s.inner.strike(f, s.dist(f));
	assert.equal(s.combat.pc.hp, hp, 'né đúng lúc: không mất máu');
	assert.equal(lost(f), crit(PASSIVE.ripostePower, 7), 'tự chém trả ×1,6 — chắc chắn chí mạng dù xúc xắc 0,99');
	assert.ok(['Né đúng lúc!', 'Phản đòn!', 'Đúng lúc!'].every((t) => s.floats.includes(t)));
	const after = f.hp;
	s.inner.strike(f, s.dist(f));
	assert.equal(f.hp, after, 'một cú né chỉ phản một lần');

	// Bấm né sớm 0,15s (trước đây vẫn tính "đúng lúc"): vẫn trong i-frame nên không mất máu, nhưng KHÔNG phản.
	const early = setup({ tiers: { sword: 7 }, style: 'thuy_than' });
	const ef = early.enemy('mob_zombie_001', 70);
	early.combat.dodge({ x: 0, y: 1 });
	early.tick(9);
	const eh = early.combat.pc.hp;
	early.inner.strike(ef, early.dist(ef));
	assert.ok(full(ef) && early.combat.pc.hp === eh, 'né sớm 0,15s: né thường (cửa sổ 0,12s)');

	// Quá cửa sổ (0,317s — vẫn trong i-frame 0,32s): không mất máu nhưng KHÔNG phản.
	const late = setup({ tiers: { sword: 7 }, style: 'thuy_than' });
	const lf = late.enemy('mob_zombie_001', 70);
	late.combat.dodge({ x: 0, y: 1 });
	late.tick(19);
	const lh = late.combat.pc.hp;
	late.inner.strike(lf, late.dist(lf));
	assert.ok(full(lf) && late.combat.pc.hp === lh, 'ngoài cửa sổ 0,12s: né thường');

	// Lăn ra khỏi tầm nhưng đúng lúc: đòn vẫn tính nhắm vào chỗ vừa đứng → phản.
	const out = setup({ tiers: { sword: 7 }, style: 'thuy_than' });
	const of = out.enemy('mob_zombie_001', 70);
	out.combat.dodge({ x: -1, y: 0 });
	out.tick(7);
	assert.ok(out.dist(of) > of.stats.reach + 16, 'đã lăn ra khỏi tầm');
	out.inner.strike(of, out.dist(of));
	assert.ok(!full(of), 'vẫn phản');

	// Chưa có bị động (Thủy Thần 6): né thường.
	const six = setup({ tiers: { sword: 6 }, style: 'thuy_than' });
	const sf = six.enemy('mob_zombie_001', 70);
	six.combat.dodge({ x: 0, y: 1 });
	six.tick(6);
	six.inner.strike(sf, six.dist(sf));
	assert.ok(full(sf), 'Thủy Thần 6: không phản');

	// Né đúng lúc trước một viên ĐẠN: hất ngược về kẻ bắn, chí mạng.
	const sh = setup({ tiers: { sword: 7 }, style: 'thuy_than' });
	const archer = sh.enemy('mob_skeleton_archer_001', 140);
	const hs = sh.combat.pc.hp;
	sh.inner.enemyShot(archer, -1, 0);
	// Đạn bay ~0,28s mới tới: bấm né khi đạn còn cách một nhịp ngắn (trong cửa sổ 0,12s).
	sh.tick(12);
	sh.combat.dodge({ x: 1, y: 0 });
	for (let i = 0; full(archer); i += 1) {
		assert.ok(i < 120, 'đạn hất ngược phải trúng kẻ bắn');
		sh.tick();
	}
	assert.equal(sh.combat.pc.hp, hs);
	assert.equal(lost(archer), armorDamage(ATK * PASSIVE.ripostePower * depthBonus(7) * (0.9 + 0.99 * 0.2) * 1.75, archer.stats.def, false), 'đạn hất ngược chí mạng');

	// ĐỠ đúng lúc: Lưu Thủy Phản (cả cửa sổ) → chí mạng; Thủy Thần 6 cùng đòn thì không.
	const pa = setup({ tiers: { sword: 7 }, style: 'thuy_than' });
	const pf = pa.enemy('mob_zombie_001', 70);
	pa.cast('flowing_counter', pa.east());
	pa.tick(24);
	pa.inner.strike(pf, 30);
	assert.equal(lost(pf), crit(2.8, 7), 'Lưu Thủy Phản (0,4s vào cửa sổ): chí mạng');
	const p6 = setup({ tiers: { sword: 6 }, style: 'thuy_than' });
	const p6f = p6.enemy('mob_zombie_001', 70);
	p6.cast('flowing_counter', p6.east());
	p6.inner.strike(p6f, 30);
	assert.equal(lost(p6f), plain(2.8, 6), 'Thủy Thần 6: nhát phản thường');
	// Thế Tĩnh: đòn chạm trong 0,12s đầu → chí mạng; sau đó → thường.
	const st = setup({ tiers: { sword: 7 }, style: 'thuy_than' });
	const sa = st.enemy('mob_zombie_001', 70);
	st.cast('calm_stance', st.east());
	st.tick(6);
	st.inner.strike(sa, 30);
	assert.equal(lost(sa), crit(1.4, 7), 'Thế Tĩnh 0,1s: đỡ đúng lúc');
	st.tick(30);
	const before = sa.hp;
	st.inner.strike(sa, 30);
	assert.equal(before - sa.hp, plain(1.4, 7), 'Thế Tĩnh 0,6s: nhát phản thường');
});

// 3h) Xoáy Nước (Thủy Thần 8): xoay chém quanh mình ×1,9 + đẩy; ngay sau một lần đỡ / gạt / phản (≤ 2,5s) thì ×1,8 và đẩy xa
//     hơn — dùng hết cửa sổ; quá 2,5s thì thường.
withRandom(0.5, () => {
	const ring = (s: ReturnType<typeof setup>) => [s.enemy('mob_zombie_001', 120, 100), s.enemy('mob_zombie_001', -30, 110), s.enemy('mob_zombie_001', 40, 150)];
	const k8 = depthBonus(8);
	const normal = armorDamage(ATK * 1.9 * k8, ZDEF, false);
	const surge = armorDamage(ATK * 1.9 * k8 * 1.8, ZDEF, false);
	const s = setup({ tiers: { sword: 8 }, style: 'thuy_than' });
	const rs = ring(s);
	const far = s.enemy('mob_zombie_001', 240, 100);
	s.cast('whirlpool', s.east());
	assert.deepEqual(rs.map(lost), [normal, normal, normal], 'chém cả vòng quanh mình');
	assert.ok(rs.every((f) => f.push), 'đẩy lùi');
	assert.ok(full(far), 'ngoài bán kính 110: không');
	const kn = Math.hypot(rs[0]!.push!.vx, rs[0]!.push!.vy);

	// Sau khi đỡ (Lưu Thủy Phản phản một đòn) → mạnh hơn, rồi dùng hết.
	const q = setup({ tiers: { sword: 8 }, style: 'thuy_than' });
	const attacker = q.enemy('mob_zombie_001', 70, 60);
	q.cast('flowing_counter', q.east());
	q.inner.strike(attacker, 30);
	q.tick(30);
	const rq = ring(q);
	q.cast('whirlpool', q.east());
	assert.deepEqual(rq.map(lost), [surge, surge, surge], 'vừa đỡ đòn: ×1,8');
	assert.ok(q.floats.includes('Xoáy Nước!'));
	assert.ok(Math.hypot(rq[0]!.push!.vx, rq[0]!.push!.vy) > kn * 1.4, 'đẩy xa hơn');
	for (const f of rq) Object.assign(f, { hp: f.hpMax, push: null });
	q.cast('whirlpool', q.east());
	assert.deepEqual(rq.map(lost), [normal, normal, normal], 'đã dùng hết cửa sổ');

	// Gạt đạn bằng thế đỡ (không phản) cũng tính là "đỡ"; quá 2,5s thì thôi.
	const g = setup({ tiers: { sword: 8 }, style: 'thuy_than' });
	g.cast('calm_stance', g.east());
	g.inner.incoming('shot', 20);
	g.tick(60 * 2.6);
	const rg = ring(g);
	g.cast('whirlpool', g.east());
	assert.deepEqual(rg.map(lost), [normal, normal, normal], 'quá 2,5s sau khi gạt: thường');
	const g2 = setup({ tiers: { sword: 8 }, style: 'thuy_than' });
	g2.cast('calm_stance', g2.east());
	g2.inner.incoming('shot', 20);
	g2.tick(60);
	const rg2 = ring(g2);
	g2.cast('whirlpool', g2.east());
	assert.deepEqual(rg2.map(lost), [surge, surge, surge], 'gạt đạn 1s trước: ×1,8');
});

// 3i) Mặt Hồ Phẳng (Thủy Thần 9): mỗi lần phản đòn thành công hồi 5% máu tối đa (chặn-phản, gạt đạn, né đúng lúc).
withRandom(0.5, () => {
	const s = setup({ tiers: { sword: 9 }, style: 'thuy_than' });
	const pc = s.combat.pc;
	const per = Math.round(pc.hpMax * PASSIVE.lakeHeal);
	const f = s.enemy('mob_zombie_001', 70);
	pc.hp = 50;
	s.cast('calm_stance', s.east());
	s.inner.strike(f, 30);
	s.inner.strike(f, 30);
	assert.equal(pc.hp, 50 + per, 'Thế Tĩnh chặn-phản 2 đòn liền: hồi MỘT lần (hồi nội 1s)');
	assert.ok(s.plays.some((x) => x.id === 'water_ring'), 'hình tạm hồi máu');
	s.tick(Math.ceil(PASSIVE.lakeCooldown * 60) + 1);
	s.cast('calm_stance', s.east());
	s.inner.strike(f, 30);
	assert.equal(pc.hp, 50 + 2 * per, 'qua 1s: phản đòn kế lại hồi');
	s.tick(100);
	const archer = s.enemy('mob_skeleton_archer_001', 260);
	pc.hp = 50;
	s.cast('backflow', s.east());
	s.inner.enemyShot(archer, -1, 0);
	s.tick(40);
	assert.equal(pc.hp, 50 + per, 'gạt đạn: +5%');
	// Loạt 3 viên của boss gạt cùng lúc: 3 lần "Gạt!" nhưng chỉ hồi một lần.
	s.tick(100);
	const boss = s.enemy('boss_demon_001', 120);
	pc.hp = 50;
	const gats = s.floats.filter((t) => t === 'Gạt!').length;
	s.cast('backflow', s.east());
	s.inner.enemyShot(boss, -1, 0);
	s.tick(30);
	assert.equal(s.floats.filter((t) => t === 'Gạt!').length - gats, 3, 'gạt cả 3 viên');
	assert.equal(pc.hp, 50 + per, 'loạt 3 viên: hồi một lần');
	const q = setup({ tiers: { sword: 8 }, style: 'thuy_than' });
	const qf = q.enemy('mob_zombie_001', 70);
	q.combat.pc.hp = 50;
	q.cast('calm_stance', q.east());
	q.inner.strike(qf, 30);
	assert.equal(q.combat.pc.hp, 50, 'Thủy Thần 8: chưa có');
});

// 3j) Liên Hoàn (Bắc Thần 6): chuỗi 4 nhát ×0,8 nối đuôi; mỗi nhát tính riêng — phủ Thổ: nhát thứ 3 choáng.
withRandom(0.5, () => {
	const s = setup({ tiers: { sword: 6 }, style: 'bac_than' });
	const f = s.enemy('mob_zombie_001', 90);
	const per = armorDamage(ATK * 0.8 * depthBonus(6), ZDEF, false);
	const hits: number[] = [];
	let last = f.hp;
	s.cast('chain_slash', s.east());
	for (let i = 0; i < 40; i += 1) {
		if (f.hp < last) hits.push(Math.round((i / 60) * 100) / 100);
		last = f.hp;
		s.tick();
	}
	if (f.hp < last) hits.push(40 / 60);
	assert.equal(lost(f), 4 * per, `4 nhát × ${per}`);
	assert.equal(hits.length, 4, 'trúng 4 lần');
	assert.ok(hits[3]! <= 0.35, `chuỗi nhanh: nhát cuối trong 0,35s (${hits})`);
	assert.ok(s.plays.filter((x) => x.id === 'slash').length >= 4, '4 vệt chém');

	const e = setup({ tiers: { sword: 6, earth: 5 }, style: 'bac_than' });
	e.combat.setEnchant('earth');
	const g = e.enemy('mob_zombie_001', 90, 100, false);
	e.cast('chain_slash', e.east());
	const stun: number[] = [];
	for (let i = 0; i < 25; i += 1) {
		e.tick();
		stun.push(g.stun);
	}
	assert.ok(stun.slice(0, 9).every((x) => x === 0), 'nhát 1–2: chưa choáng');
	assert.ok(Math.max(...stun) > 0.4, 'phủ Thổ: nhát thứ 3 liên tiếp choáng');
});

// 3k) Đà Lướt (Bắc Thần 7): né xong, 3 đòn Kiếm kế (trong 3 giây) nhanh hơn 25%; phép không đổi; hết lượt / hết hạn thì thường.
{
	const s = setup({ tiers: { sword: 7 }, style: 'bac_than' });
	const slash = def('slash');
	const base = 0.38 / 1.1;
	near(s.combat.cooldownOf(slash), base, 'chưa né');
	s.combat.dodge({ x: 0, y: 1 });
	near(s.combat.cooldownOf(slash), base / 1.25, 'vừa né: HUD thấy hồi chiêu ngắn lại');
	near(s.combat.cooldownOf(def('fire_bolt')), 1, 'phép không ăn Đà Lướt');
	s.tick(12);
	const cds = [0, 1, 2, 3].map(() => {
		s.cast('slash', s.east());
		const cd = s.combat.pc.cooldowns.get('slash')! - s.combat.time;
		s.tick(30);
		return Math.round(cd * 1e4) / 1e4;
	});
	assert.deepEqual(cds, [base / 1.25, base / 1.25, base / 1.25, base].map((x) => Math.round(x * 1e4) / 1e4), '3 nhát nhanh rồi về thường');
	assert.ok(s.plays.some((x) => x.id === 'wind_burst'), 'hình tạm Đà Lướt');
	s.combat.dodge({ x: 0, y: 1 });
	s.tick(60 * 3.3);
	near(s.combat.cooldownOf(slash), base, 'quá 3 giây: hết');
	const six = setup({ tiers: { sword: 6 }, style: 'bac_than' });
	six.combat.dodge({ x: 0, y: 1 });
	near(six.combat.cooldownOf(slash), base, 'Bắc Thần 6: chưa có');
}

// 3l) Phi Kiếm (Bắc Thần 8): bay 320 xuyên hàng quái rồi bay VỀ TAY — mỗi chiều trúng mỗi quái đúng một lần; về tới tay là bắt lại.
withRandom(0.5, () => {
	const s = setup({ tiers: { sword: 8 }, style: 'bac_than' });
	const a = s.enemy('mob_zombie_001', 150);
	const b = s.enemy('mob_zombie_001', 280);
	const far = s.enemy('mob_zombie_001', 470);
	const per = armorDamage(ATK * 1.8 * depthBonus(8), ZDEF, false);
	const count = new Map<Fighter, number>([
		[a, 0],
		[b, 0],
	]);
	const last = new Map<Fighter, number>([
		[a, a.hp],
		[b, b.hp],
	]);
	s.cast('flying_sword', s.east());
	let frames = 0;
	let outward: number[] = [];
	while (s.inner.projectiles.some((x) => x.team === 'player') && frames < 200) {
		s.tick();
		frames += 1;
		for (const f of [a, b]) {
			if (f.hp < last.get(f)!) count.set(f, count.get(f)! + 1);
			last.set(f, f.hp);
		}
		if (frames === 29) outward = [lost(a), lost(b)];
	}
	assert.ok(frames < 90, `kiếm về tay và được bắt lại (${frames} frame)`);
	assert.deepEqual(outward, [per, per], 'lượt đi: mỗi quái một lần');
	assert.deepEqual([count.get(a), count.get(b)], [2, 2], 'cả hành trình: đúng 2 lần mỗi quái (đi + về), không trúng lặp');
	assert.deepEqual([lost(a), lost(b)], [2 * per, 2 * per]);
	assert.ok(full(far), 'ngoài tầm 320: không trúng');

	// Người chơi chạy đi lúc kiếm đang về: kiếm đuổi theo tay.
	const q = setup({ tiers: { sword: 8 }, style: 'bac_than' });
	q.cast('flying_sword', q.east());
	q.tick(35);
	q.p.y += 120;
	let n = 0;
	while (q.inner.projectiles.some((x) => x.team === 'player') && n < 200) {
		q.tick();
		n += 1;
	}
	assert.ok(n < 120, 'đổi chỗ vẫn bắt được kiếm');
});

// 3m) Bóng Mờ (Bắc Thần 9): 15% né hoàn toàn một đòn — xúc xắc dưới 0,15 né, trên thì trúng; đo tỉ lệ bằng chuỗi có hạt giống.
{
	const s = setup({ tiers: { sword: 9 }, style: 'bac_than' });
	const f = s.enemy('mob_zombie_001', 70);
	const pc = s.combat.pc;
	withRandom(0.14, () => {
		const hp = pc.hp;
		s.inner.strike(f, 30);
		assert.equal(pc.hp, hp, '0,14 < 15%: né hoàn toàn');
		assert.ok(s.floats.includes('Bóng Mờ') && s.plays.some((x) => x.id === 'shadow'));
		s.inner.incoming('area', 40);
		s.inner.incoming('shot', 40);
		assert.equal(pc.hp, hp, 'né được cả đạn lẫn đòn vùng');
	});
	withRandom(0.16, () => {
		const hp = pc.hp;
		s.inner.strike(f, 30);
		assert.ok(pc.hp < hp, '0,16: trúng');
	});
	const rate = (tier: number) => {
		const q = setup({ tiers: { sword: tier }, style: 'bac_than' });
		const e = q.enemy('mob_zombie_001', 70);
		let evaded = 0;
		withRandom(seeded(20261007), () => {
			for (let i = 0; i < 4000; i += 1) {
				q.combat.pc.iframes = 0;
				q.combat.pc.hp = q.combat.pc.hpMax;
				q.inner.strike(e, 30);
				if (q.combat.pc.hp === q.combat.pc.hpMax) evaded += 1;
			}
		});
		return evaded / 4000;
	};
	const r9 = rate(9);
	assert.ok(Math.abs(r9 - PASSIVE.evade) < 0.015, `tỉ lệ né đo được ${r9} ≈ 15%`);
	assert.equal(rate(8), 0, 'Bắc Thần 8: chưa có');
	assert.equal(s.combat.sheet.evade, PASSIVE.evade, 'bảng Nhân vật: né hoàn toàn 15%');
}

console.log(
	'✔ swordtiers69.test: 6 kỹ năng mốc 6/8 của 3 lưu phái chạy thật (Phá Giáp + vỡ giáp chồng phá giáp, Lưỡi Sóng xuyên + rộng + phủ phép, Dòng Chảy Ngược gạt đạn, Xoáy Nước mạnh hơn sau đỡ, Liên Hoàn 4 nhát + phủ Thổ, Phi Kiếm đi–về không trúng lặp), bị động 7/9 (Thế Áp Đảo cộng dồn / về 0, Bất Khuất, Phản Đòn cửa sổ né / đỡ đúng lúc 0,12s, Mặt Hồ Phẳng hồi nội 1s, Đà Lướt, Bóng Mờ tỉ lệ 15%), Phá Giáp tự vỡ giáp khi tung lại đúng hồi chiêu + phủ Thổ không làm ngắn phá giáp, trần mốc 9 mọi nhánh, mô tả / tooltip sinh từ số liệu',
);

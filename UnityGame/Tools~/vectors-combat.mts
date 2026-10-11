// Test vector nhóm "combat" (skillRules.ts, bossRules.ts, moves.ts) sinh từ CHÍNH hàm TS → Tests~/vectors/combat.json.
// Test C# (Tests~/Aether.Core.Tests/CombatTests.cs) gọi bản C# cùng đầu vào và đòi ra y hệt. Chạy ở gốc repo:
//   npx tsx UnityGame/Tools~/vectors-combat.mts
// Đầu vào ngẫu nhiên dùng PRNG có seed (mulberry32) để file vector ổn định giữa các lần chạy.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as S from '../../packages/sim/src/skillRules.ts';
import * as B from '../../packages/sim/src/bossRules.ts';
import * as M from '../../packages/sim/src/moves.ts';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'Tests~', 'vectors');
mkdirSync(OUT, { recursive: true });

function mulberry32(seed: number) {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
const rnd = mulberry32(0xae7e12);
/** Số ngẫu nhiên trong [a, b): nửa số làm tròn về bước 0,5 (dễ ra hoà / thẳng hàng / đúng mép), nửa giữ nguyên số lẻ. */
const R = (a: number, b: number) => {
	const v = a + (b - a) * rnd();
	return rnd() < 0.5 ? Math.round(v * 2) / 2 : v;
};
const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)]!;
const times = <T,>(n: number, f: (i: number) => T): T[] => Array.from({ length: n }, (_, i) => f(i));

// ———————————————— hình học ————————————————
const hypot = [
	[0, 0], [3, 4], [-3, 4], [1e-300, 1e-300], [1e300, 1e300], [Infinity, NaN], [NaN, 1], [-Infinity, 2], [0, -0], [5e-324, 0], [1, 1e-17],
	...times(400, () => [R(-500, 500), R(-500, 500)]),
	...times(100, () => [rnd() * 1e-6, rnd() * 3]),
].map(([a, b]) => ({ a, b, out: Math.hypot(a!, b!) }));

const inCircle = times(400, () => {
	const cx = R(-200, 200);
	const cy = R(-200, 200);
	const r = R(0, 120);
	const x = cx + R(-150, 150);
	const y = cy + R(-100, 100);
	const pad = pick([0, 0, 6, 12.5, R(0, 20)]);
	return { x, y, cx, cy, r, pad, out: S.inCircle(x, y, cx, cy, r, pad) };
});
// Biên: đúng mép (x lệch đúng r, y lệch đúng r × squash).
inCircle.push({ x: 50, y: 0, cx: 0, cy: 0, r: 50, pad: 0, out: S.inCircle(50, 0, 0, 0, 50, 0) });
inCircle.push({ x: 0, y: 31, cx: 0, cy: 0, r: 50, pad: 0, out: S.inCircle(0, 31, 0, 0, 50, 0) });

const inCone = times(500, () => {
	const ox = R(-100, 100);
	const oy = R(-100, 100);
	const dx = pick([0, 1, -1, R(-5, 5)]);
	const dy = pick([0, 1, -1, R(-5, 5)]);
	const x = ox + R(-160, 160);
	const y = oy + R(-160, 160);
	const range = R(10, 150);
	const half = pick([15, 30, 45, 60, 90, 180, R(1, 120)]);
	const pad = pick([0, 0, 8, R(0, 30)]);
	return { x, y, ox, oy, dx, dy, range, half, pad, out: S.inCone(x, y, ox, oy, dx, dy, range, half, pad) };
});
inCone.push({ x: 0, y: 0, ox: 0, oy: 0, dx: 1, dy: 0, range: 10, half: 30, pad: 0, out: S.inCone(0, 0, 0, 0, 1, 0, 10, 30, 0) });
inCone.push({ x: 5, y: 0, ox: 0, oy: 0, dx: 0, dy: 0, range: 10, half: 30, pad: 0, out: S.inCone(5, 0, 0, 0, 0, 0, 10, 30, 0) });

const segmentDistance = times(300, () => {
	const ax = R(-100, 100);
	const ay = R(-100, 100);
	const deg = rnd() < 0.1;
	const bx = deg ? ax : R(-100, 100);
	const by = deg ? ay : R(-100, 100);
	const x = R(-150, 150);
	const y = R(-150, 150);
	return { x, y, ax, ay, bx, by, out: S.segmentDistance(x, y, ax, ay, bx, by) };
});
const inLine = times(300, () => {
	const ax = R(-100, 100);
	const ay = R(-100, 100);
	const bx = R(-100, 100);
	const by = R(-100, 100);
	const x = R(-150, 150);
	const y = R(-150, 150);
	const half = R(0, 40);
	const pad = pick([0, 10, R(0, 15)]);
	return { x, y, ax, ay, bx, by, half, pad, out: S.inLine(x, y, ax, ay, bx, by, half, pad) };
});

const randArea = (): S.Area => {
	const k = pick(['circle', 'cone', 'line'] as const);
	if (k === 'circle') return { kind: 'circle', x: R(-50, 50), y: R(-50, 50), r: R(0, 80) };
	if (k === 'cone') return { kind: 'cone', x: R(-50, 50), y: R(-50, 50), dx: R(-3, 3), dy: R(-3, 3), range: R(10, 120), half: R(5, 90) };
	return { kind: 'line', ax: R(-50, 50), ay: R(-50, 50), bx: pick([R(-50, 50), 0]), by: pick([R(-50, 50), 0]), half: R(2, 30) };
};
const inArea = times(400, () => {
	const a = randArea();
	const x = R(-120, 120);
	const y = R(-120, 120);
	const pad = pick([0, 8, R(0, 20)]);
	return { a, x, y, pad, out: S.inArea(a, x, y, pad) };
});
const knockDir = times(300, () => {
	const a = randArea();
	const near = rnd() < 0.2;
	const x = near && a.kind !== 'line' ? a.x + R(-0.8, 0.8) : R(-120, 120);
	const y = near && a.kind !== 'line' ? a.y + R(-0.8, 0.8) : R(-120, 120);
	return { a, x, y, out: S.knockDir(a, x, y) };
});
knockDir.push({ a: { kind: 'line', ax: 3, ay: 3, bx: 3, by: 3, half: 5 }, x: 0, y: 0, out: S.knockDir({ kind: 'line', ax: 3, ay: 3, bx: 3, by: 3, half: 5 }, 0, 0) });
knockDir.push({ a: { kind: 'circle', x: 3, y: 3, r: 5 }, x: 3, y: 3, out: S.knockDir({ kind: 'circle', x: 3, y: 3, r: 5 }, 3, 3) });
knockDir.push({ a: { kind: 'cone', x: 0, y: 0, dx: 0, dy: 0, range: 5, half: 30 }, x: 0.5, y: 0, out: S.knockDir({ kind: 'cone', x: 0, y: 0, dx: 0, dy: 0, range: 5, half: 30 }, 0.5, 0) });

const clampTarget = times(300, () => {
	const ox = R(-100, 100);
	const oy = R(-100, 100);
	const tx = rnd() < 0.05 ? ox : R(-300, 300);
	const ty = rnd() < 0.05 ? oy : R(-300, 300);
	const range = R(0, 250);
	return { ox, oy, tx, ty, range, out: S.clampTarget(ox, oy, tx, ty, range) };
});
const aheadPoint = times(200, () => {
	const x = R(-100, 100);
	const y = R(-100, 100);
	const fx = pick([0, R(-3, 3)]);
	const fy = pick([0, R(-3, 3)]);
	const dist = R(0, 120);
	return { x, y, fx, fy, dist, out: S.aheadPoint(x, y, fx, fy, dist) };
});
const lineSegments = times(80, () => {
	const ox = R(-100, 100);
	const oy = R(-100, 100);
	const dx = pick([0, R(-3, 3)]);
	const dy = pick([0, R(-3, 3)]);
	const length = pick([0, R(1, 400), 100, 120]);
	const step = pick([20, 40, R(5, 60)]);
	return { ox, oy, dx, dy, length, step, out: S.lineSegments(ox, oy, dx, dy, length, step) };
});
const dashPlan = times(200, () => {
	const dx = pick([0, R(-3, 3)]);
	const dy = pick([0, R(-3, 3)]);
	const range = R(0, 200);
	const speed = pick([R(50, 900), 600, 0]);
	return { dx, dy, range, speed, out: S.dashPlan(dx, dy, range, speed) };
});
const pullStep = times(200, () => {
	const x = R(-100, 100);
	const y = R(-100, 100);
	const cx = rnd() < 0.05 ? x : R(-100, 100);
	const cy = rnd() < 0.05 ? y : R(-100, 100);
	const speed = R(0, 300);
	const dt = pick([1 / 60, 0.016, 0.1, R(0, 1)]);
	return { x, y, cx, cy, speed, dt, out: S.pullStep(x, y, cx, cy, speed, dt) };
});

// ———————————————— trạng thái ————————————————
const ccSeconds = [0, 0.8, 1.5, 3].flatMap((s) => [true, false, undefined].map((boss) => ({ seconds: s, boss: boss ?? null, out: S.ccSeconds(s, boss) })));
const canFreeze = [true, false, undefined].flatMap((boss) =>
	[-0.1, 0, 0.5].flatMap((freeze) => [undefined, -1, 0, 2].map((fi) => ({ boss: boss ?? null, freeze, freezeImmune: fi ?? null, out: S.canFreeze({ boss, freeze, freezeImmune: fi }) }))),
);
const launchHeight = [-1, 0, 0.1, 0.25, 0.3, 0.5, 0.6, 0.75, 1, 1.2].flatMap((left) =>
	[0, 1, 0.6, 1.25].flatMap((total) => [undefined, 26, 10, 37.5].map((peak) => ({ left, total, peak: peak ?? null, out: S.launchHeight(left, total, peak) }))),
);
const armorDamage = [
	...[0, 1, 2, 2.5, 3.5, 7, 10, 25, 99.5, 120, 1000].flatMap((raw) => [0, 1, 3, 5, 8].flatMap((def) => [true, false].map((broken) => ({ raw, def, broken })))),
	...times(150, () => ({ raw: R(0, 300), def: R(0, 10), broken: rnd() < 0.5 })),
].map((v) => ({ ...v, out: S.armorDamage(v.raw, v.def, v.broken) }));
const frostStack = [
	...[0, 1, 2].flatMap((n) => [0, 1, 2.9, 3, 3.0000001, 5].flatMap((dt) => [2, 3].flatMap((need) => [undefined, 1, 3].map((window) => ({ n, at: 10, now: 10 + dt, need, window: window ?? null }))))),
].map((v) => ({ ...v, out: S.frostStack({ n: v.n, at: v.at }, v.now, v.need, v.window ?? undefined) }));
const moveFactor = times(200, () => {
	const s: S.SlowState = { chill: pick([0, 1, -1]), wet: pick([0, 2]) };
	if (rnd() < 0.6) s.frost = pick([0, 1]);
	if (rnd() < 0.6) s.slow = pick([0, 2, -1]);
	if (rnd() < 0.6) s.slowMult = pick([0.3, 0.8, 1]);
	const frostSlow = pick([0.3, 0.4]);
	const wetSlow = pick([1, 0.85, 0.7]);
	return { s, frostSlow, wetSlow, out: S.moveFactor(s, frostSlow, wetSlow) };
});
const attackMisses = [0, 1, -1].flatMap((miss) => [0, 0.4, 1].flatMap((chance) => [0, 0.39, 0.4, 0.99].map((roll) => ({ miss, chance, roll, out: S.attackMisses(miss, chance, roll) }))));
const lifestealHeal = [
	...[0, 1, 5, 16.5, 50, 83, 100, 250, 1000].flatMap((damage) => [0, -0.1, 0.03, 0.05, 0.06, 0.1, 0.3].map((pct) => ({ damage, pct }))),
	...times(100, () => ({ damage: Math.floor(R(0, 600)), pct: pick([0.03, 0.06, 0.09, R(0, 0.5)]) })),
].map((v) => ({ ...v, out: S.lifestealHeal(v.damage, v.pct) }));

// ———————————————— thế đỡ, Ảnh Bộ ————————————————
const guardOutcome = (['stance', 'parry', 'still'] as const).flatMap((guard) => (['melee', 'shot', 'area'] as const).map((attack) => ({ guard, attack, out: S.guardOutcome(guard, attack) })));
const behindPoint = times(200, () => {
	const px = R(-100, 100);
	const py = R(-100, 100);
	const tx = rnd() < 0.05 ? px : R(-100, 100);
	const ty = rnd() < 0.05 ? py : R(-100, 100);
	const dist = R(0, 60);
	return { px, py, tx, ty, dist, out: S.behindPoint(px, py, tx, ty, dist) };
});
const pickAhead = times(250, () => {
	const px = R(-50, 50);
	const py = R(-50, 50);
	const dx = pick([0, 1, -1, R(-3, 3)]);
	const dy = pick([0, 1, -1, R(-3, 3)]);
	const range = R(30, 250);
	const half = pick([30, 45, 60, R(5, 90)]);
	const targets = times(Math.floor(rnd() * 8), () => (rnd() < 0.05 ? { x: px, y: py } : { x: R(-250, 250), y: R(-250, 250) }));
	return { px, py, dx, dy, range, half, targets, out: S.pickAhead(px, py, dx, dy, range, half, targets) };
});

// ———————————————— tường ————————————————
const randWall = (): S.WallSeg => {
	const ax = R(-60, 60);
	const ay = R(-60, 60);
	const deg = rnd() < 0.05;
	return { ax, ay, bx: deg ? ax : R(-60, 60), by: deg ? ay : R(-60, 60), half: pick([4, 6, 8, R(1, 12)]) };
};
const wallEnds = times(200, () => {
	const cx = R(-100, 100);
	const cy = R(-100, 100);
	const dx = pick([0, 1, -1, R(-3, 3)]);
	const dy = pick([0, 1, -1, R(-3, 3)]);
	const halfLen = R(10, 80);
	return { cx, cy, dx, dy, halfLen, out: S.wallEnds(cx, cy, dx, dy, halfLen) };
});
const segmentsCross = [
	// Thẳng hàng chồng / không chồng, chạm đầu mút, chữ T.
	[0, 0, 10, 0, 5, 0, 15, 0], [0, 0, 4, 0, 5, 0, 15, 0], [0, 0, 5, 0, 5, 0, 15, 0], [5, -5, 5, 0, 0, 0, 10, 0], [0, 0, 10, 10, 0, 10, 10, 0],
	[0, 0, 0, 0, 0, 0, 0, 0], [1, 1, 1, 1, 0, 0, 2, 2], [3, 3, 3, 3, 0, 0, 2, 2],
	...times(400, () => times(8, () => Math.round(R(-20, 20)))),
	...times(200, () => times(8, () => R(-50, 50))),
].map(([px, py, qx, qy, ax, ay, bx, by]) => ({ p: [px, py, qx, qy, ax, ay, bx, by], out: S.segmentsCross(px!, py!, qx!, qy!, ax!, ay!, bx!, by!) }));
const wallBetween = times(200, () => {
	const walls = times(Math.floor(rnd() * 4), randWall);
	const p = [R(-80, 80), R(-80, 80), R(-80, 80), R(-80, 80)];
	return { p, walls, out: S.wallBetween(p[0]!, p[1]!, p[2]!, p[3]!, walls) };
});
const wallClip = times(500, () => {
	const walls = times(1 + Math.floor(rnd() * 3), randWall);
	const w = walls[0]!;
	// Đứng gần tường đầu tiên để hay chạm dải.
	const near = rnd() < 0.7;
	const x = near ? (w.ax + w.bx) / 2 + R(-15, 15) : R(-80, 80);
	const y = near ? (w.ay + w.by) / 2 + R(-15, 15) : R(-80, 80);
	const dx = R(-12, 12);
	const dy = R(-12, 12);
	const pad = pick([0, 6, 10]);
	return { x, y, dx, dy, walls, pad, out: S.wallClip(x, y, dx, dy, walls, pad) };
});
const wallBlocks = times(500, () => {
	const w = randWall();
	const near = rnd() < 0.5;
	const x = near ? (w.ax + w.bx) / 2 + R(-12, 12) : R(-90, 90);
	const y = near ? (w.ay + w.by) / 2 + R(-12, 12) : R(-90, 90);
	const tx = R(-90, 90);
	const ty = R(-90, 90);
	const pad = pick([0, 6, 10]);
	return { x, y, tx, ty, w, pad, out: S.wallBlocks(x, y, tx, ty, w, pad) };
});
const detourSide = times(300, () => {
	const w = randWall();
	const x = R(-90, 90);
	const y = R(-90, 90);
	const tx = R(-90, 90);
	const ty = R(-90, 90);
	const pad = pick([0, 6, 10]);
	return { x, y, tx, ty, w, pad, out: S.detourSide(x, y, tx, ty, w, pad) };
});
const detourWaypoint = times(300, () => {
	const w = randWall();
	const x = R(-90, 90);
	const y = R(-90, 90);
	const tx = R(-90, 90);
	const ty = R(-90, 90);
	const pad = pick([0, 6, 10]);
	const dir = pick([1, -1] as const);
	return { x, y, tx, ty, w, pad, dir, out: S.detourWaypoint(x, y, tx, ty, w, pad, dir) };
});

// ———————————————— sấm, mưa, chậm, trượt ————————————————
const thunderBolts = [true, false].map((inRain) => ({ inRain, out: S.thunderBolts(inRain) }));
const pickBolts = times(200, () => {
	const cx = R(-50, 50);
	const cy = R(-50, 50);
	const targets = times(Math.floor(rnd() * 9), () => {
		const t: { x: number; y: number; wet: boolean; struck?: number } = { x: R(-120, 120), y: R(-120, 120), wet: rnd() < 0.4 };
		if (rnd() < 0.6) t.struck = Math.floor(rnd() * 3);
		return t;
	});
	// Thêm vài cặp trùng hệt (thứ tự ổn định khi hoà).
	if (targets.length && rnd() < 0.3) targets.push({ ...targets[0]! });
	const n = pick([0, 1, 2, 4, 20, -1]);
	return { targets, cx, cy, n, out: S.pickBolts(targets, cx, cy, n) };
});
const scatterPoints = [0, 1, 2, 3, 5, 6, 7, 8, 10, 12, 14, 15, 21, 30, 35, 77].flatMap((n) => [40, 96.5].map((r) => ({ n, r, out: S.scatterPoints(n, r) })));
const addSlow = times(200, () => {
	const s: { slow?: number; slowMult?: number } = {};
	if (rnd() < 0.7) s.slow = pick([0, 1, 3, -1]);
	if (rnd() < 0.7) s.slowMult = pick([0.3, 0.8, 1]);
	const before = { ...s };
	const seconds = pick([0.5, 2, 3, 5]);
	const mult = pick([0.3, 0.8, 1]);
	S.addSlow(s, seconds, mult);
	return { s: before, seconds, mult, out: s };
});
const missChance = [undefined, 0, 1, -1].flatMap((miss) =>
	[undefined, 0, 2].flatMap((daze) => [[0.4, 0.25], [0.2, 0.5]].map(([sand, gust]) => ({ miss: miss ?? null, daze: daze ?? null, sand, gust, out: S.missChance({ miss, daze }, sand!, gust!) }))),
);
const perfectTiming = (['stance', 'parry', 'still', 'dodge'] as const).flatMap((kind) =>
	[-0.01, 0, 0.05, 0.12, 0.12 + 5e-10, 0.12 + 2e-9, 0.2, 3].map((since) => ({ kind, since, out: S.perfectTiming(kind, since) })),
);
const pressBonus = [-1, 0, 1, 2.7, 3, 5, 10].flatMap((stacks) => [0.05, 0.08].flatMap((step) => [3, 5].map((max) => ({ stacks, step, max, out: S.pressBonus(stacks, step, max) }))));
const lowHp = [
	[0, 100, 0.3], [-5, 100, 0.3], [29, 100, 0.3], [30, 100, 0.3], [31, 100, 0.3], [10, 0, 0.3], [1, 3, 0.35], [50, 100, 0.5],
].map(([hp, hpMax, threshold]) => ({ hp, hpMax, threshold, out: S.lowHp(hp!, hpMax!, threshold!) }));
const aimVelocity = times(200, () => {
	const x = R(-100, 100);
	const y = R(-100, 100);
	const tx = rnd() < 0.05 ? x : R(-100, 100);
	const ty = rnd() < 0.05 ? y : R(-100, 100);
	const speed = R(0, 600);
	return { x, y, tx, ty, speed, out: S.aimVelocity(x, y, tx, ty, speed) };
});

// ———————————————— boss ————————————————
const flags = [
	{ boss: false, regionBoss: false },
	{ boss: true, regionBoss: false },
	{ boss: false, regionBoss: true },
	{ boss: true, regionBoss: true },
];
const respawnDelay = flags.map((f) => ({ f, out: B.respawnDelay(f) }));
const killOutcome = flags.map((f) => ({ f, out: B.killOutcome(f) }));
type Bl = { id: number; dead: boolean; engaged: boolean; actor: { x: number; y: number } };
const mkBoss = (id: number): Bl => ({ id, dead: rnd() < 0.25, engaged: rnd() < 0.7, actor: { x: R(-200, 200), y: R(-200, 200) } });
const pickHudBoss = times(200, () => {
	const story = rnd() < 0.5 ? mkBoss(-1) : null;
	const region = times(Math.floor(rnd() * 5), (i) => mkBoss(i));
	if (region.length && rnd() < 0.2) region.push({ ...region[0]!, id: region.length });
	const px = R(-200, 200);
	const py = R(-200, 200);
	const out = B.pickHudBoss(story, region, px, py);
	return { story, region, px, py, out: out ? out.id : null };
});
const bossIntro = (() => {
	// Một phiên: chuỗi lời gọi chung một `seen`.
	const seen = new Set<string>();
	const ids = [...Object.keys(B.BOSS_INTRO), 'boss_unknown_001', ''];
	return times(40, () => {
		const id = pick(ids);
		const regionBoss = rnd() < 0.6;
		const out = B.bossIntro(id, regionBoss, seen);
		return { id, regionBoss, out: out ? [...out] : null, seen: [...seen].sort() };
	});
})();
const regionBossDownText = [
	['Vua Lich', 'Hầm Mộ'],
	['Thạch Quỷ', 'GIAN ĐÁ CỔ'],
	['Ác Long', 'Đỉnh Núi Ẩn Ộ Ỡ'],
	['', ''],
].map(([name, place]) => ({ name, place, out: B.regionBossDownText(name!, place!) }));
const regionBossDormancy = [undefined, 0, 50, 180.5].flatMap((wakeAt) => [0, 49.5, 100, 200].map((now) => ({ wakeAt: wakeAt ?? null, now, out: B.regionBossDormancy(wakeAt, now) })));
const regionBossMayWake = flags.flatMap((f) => [null, 0, 99.9, 100, 250].map((playerDist) => ({ f, playerDist, guard: 100, out: B.regionBossMayWake(f, playerDist, 100) })));

// ———————————————— động tác ————————————————
const moveIds = [...M.MOVES.map((m) => m.id as string), 'unknown', '', 'Attack'];
const moveDef = moveIds.map((id) => ({ id, out: M.moveDef(id) ?? null }));
const wieldOf = [...moveIds, null].map((anim) => {
	const w = M.wieldOf(anim ?? undefined);
	return { anim, defined: w !== undefined, out: w ?? null };
});
const movesData = { SLASH_COMBO: M.SLASH_COMBO, COMBO_WINDOW: M.COMBO_WINDOW, SKILL_MOVE: M.SKILL_MOVE, MOVES: M.MOVES };

const all = {
	hypot, inCircle, inCone, segmentDistance, inLine, inArea, knockDir, clampTarget, aheadPoint, lineSegments, dashPlan, pullStep,
	ccSeconds, canFreeze, launchHeight, armorDamage, frostStack, moveFactor, attackMisses, lifestealHeal,
	guardOutcome, behindPoint, pickAhead,
	wallEnds, segmentsCross, wallBetween, wallClip, wallBlocks, detourSide, detourWaypoint,
	thunderBolts, pickBolts, scatterPoints, addSlow, missChance, perfectTiming, pressBonus, lowHp, aimVelocity,
	respawnDelay, killOutcome, pickHudBoss, bossIntro, regionBossDownText, regionBossDormancy, regionBossMayWake,
	moveDef, wieldOf,
};
// JSON không có NaN/∞ → chuỗi "NaN"/"Infinity" (TestData.Num đọc lại).
const json = JSON.stringify({ ...all, movesData }, (_k, v) => (typeof v === 'number' && !Number.isFinite(v) ? String(v) : v), '\t');
writeFileSync(join(OUT, 'combat.json'), `${json}\n`);
const count = Object.values(all).reduce((s, a) => s + a.length, 0);
console.log(`✔ vector combat → ${OUT}/combat.json: ${count} mẫu / ${Object.keys(all).length} hàm`);

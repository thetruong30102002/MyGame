// Test vector nhóm THẾ GIỚI (va chạm, tìm đường, quái dùng chung, vùng, điểm danh, cốt truyện) sinh từ CHÍNH hàm TS của packages/sim →
// Tests~/vectors/world.json. Test C# (Tests~/HavenLord.Core.Tests/WorldTests.cs) gọi hàm C# cùng đầu vào và đòi ra y hệt. Chạy ở gốc repo:
//   npx tsx UnityGame/Tools~/vectors-world.mts
// Map thật (assets/maps/human/*.json) được NHÚNG phần va chạm (terrain + props + meta) vào vector để test C# không phụ
// thuộc file map đang bị sửa ở bản web.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSolids, GRID, isBlocked, slideMove, type CollisionMap, type PropFootprint } from '../../packages/sim/src/collision.ts';
import { NAV_CELL, NavGrid } from '../../packages/sim/src/NavGrid.ts';
import { cleanMobAct, cleanMobCc, isChildZone, isSharedZone, mobId, zoneLiveAt, zoneSpawnPoints, type MonsterZoneDef } from '../../packages/sim/src/mobs.ts';
import { hubKeys, REGIONS, regionDef, regionGate, regionNeeds, splitMapKey } from '../../packages/sim/src/regions.ts';
import { checkinGift, checkinSlot, dayBefore, killStats, nextStreak, vnDay } from '../../packages/sim/src/rewards.ts';
import { CHILDHOOD_AGE_CARDS, CHILDHOOD_NPCS, CHILDHOOD_QUESTS, CHILDHOOD_TITLE, PARENT_NPCS_16, PROLOGUE, TIME_SKIP } from '../../packages/sim/src/story/childhood.ts';
import { QUESTS, questDef } from '../../packages/sim/src/story/quests.ts';
import { YOUTH_ENDING, YOUTH_NPCS, YOUTH_QUESTS } from '../../packages/sim/src/story/youth.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const OUT = join(HERE, '..', 'Tests~', 'vectors');
const MAPS = join(ROOT, 'assets/maps/human');
mkdirSync(OUT, { recursive: true });

// PRNG cố định (mulberry32) — vector tái lập được.
let seed = 0x5eed1234;
const rnd = (): number => {
	seed = (seed + 0x6d2b79f5) | 0;
	let t = seed;
	t = Math.imul(t ^ (t >>> 15), t | 1);
	t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
	return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = <T,>(a: readonly T[]): T => a[Math.floor(rnd() * a.length)]!;
const range = (a: number, b: number): number => a + rnd() * (b - a);
/** Số không hữu hạn → chuỗi (JSON không có NaN / ∞). */
const enc = (v: number): number | string => (Number.isNaN(v) ? 'NaN' : v === Infinity ? 'Infinity' : v === -Infinity ? '-Infinity' : v);
const err = <T,>(f: () => T): T | { error: string } => {
	try {
		return f();
	} catch (e) {
		return { error: (e as Error).name };
	}
};

// ———— Math.hypot (V8) ————
const hypotIn: [number, number][] = [[0, 0], [3, 4], [-3, 4], [1e300, 1e300], [1e-300, 1e-300], [5e-324, 0], [0.1, 0.2], [Infinity, NaN], [NaN, 1], [-Infinity, 2], [-0, -0]];
for (let i = 0; i < 3000; i += 1) {
	const s = pick([1, 10, 1000, 3000, 1e-3, 1e8]);
	const a = (rnd() - 0.5) * 2 * s;
	const b = rnd() < 0.15 ? Math.round(a * rnd()) : (rnd() - 0.5) * 2 * pick([1, 10, 1000, 3000, 1e-3]);
	hypotIn.push([a, b]);
}
// Kiểu hay gặp trong NavGrid: hiệu toạ độ tâm ô (bội của 24 ± lẻ).
for (let i = 0; i < 1000; i += 1) hypotIn.push([Math.floor(rnd() * 90 - 45) * 24 + (rnd() < 0.5 ? 0 : rnd() * 24), Math.floor(rnd() * 90 - 45) * 24 + (rnd() < 0.5 ? 0 : rnd() * 24)]);
const hypot = hypotIn.map(([a, b]) => [enc(a), enc(b), enc(Math.hypot(a, b))]);

// ———— Map: thật + tự dựng ————
interface VecMap {
	name: string;
	map: CollisionMap;
	spawn?: { x: number; y: number };
	spots?: { id: string; x: number; y: number; r: number }[];
	zones?: MonsterZoneDef[];
}
const realMeta = JSON.parse(readFileSync(join(MAPS, 'props.meta.json'), 'utf8')) as Record<string, PropFootprint>;
const realMaps: VecMap[] = readdirSync(MAPS)
	.filter((f) => f.endsWith('.json') && !f.includes('.minimap') && !f.startsWith('props') && f !== 'world.json')
	.sort()
	.map((f) => {
		const m = JSON.parse(readFileSync(join(MAPS, f), 'utf8'));
		return {
			name: `human/${f.replace(/\.json$/, '')}`,
			map: { tileSize: m.tileSize, width: m.width, height: m.height, terrain: m.terrain, props: m.props.map((p: { id: string; x: number; y: number }) => ({ id: p.id, x: p.x, y: p.y })) },
			spawn: m.spawn,
			spots: (m.spots ?? []).map((s: { id: string; x: number; y: number; r: number }) => ({ id: s.id, x: s.x, y: s.y, r: s.r })),
			zones: m.monsterZones ?? [],
		};
	});

// Map tự dựng: nước ngẫu nhiên + đồ vật có / không chặn, kích thước KHÔNG chia hết 24, một túi kín bằng nước.
const synthMeta: Record<string, PropFootprint> = {
	rock: { blocks: true, footprint: { x: -20, y: -14, w: 40, h: 14 } },
	tree: { blocks: true, footprint: { x: -9, y: -8, w: 18, h: 8 } },
	wide: { blocks: true, footprint: { x: -95, y: -30, w: 190, h: 30 } },
	flower: { blocks: false, footprint: { x: -5, y: -5, w: 10, h: 5 } },
	ghost: { blocks: true, footprint: { x: 0, y: 0, w: 0, h: 0 } },
};
function synthMap(name: string, tile: number, w: number, h: number, water: number, props: number, pocket: boolean): VecMap {
	const rows: string[] = [];
	for (let y = 0; y < h; y += 1) {
		let row = '';
		for (let x = 0; x < w; x += 1) row += rnd() < water ? 'w' : pick(['g', 'g', 'd', 'c']);
		rows.push(row);
	}
	if (pocket) {
		// Vòng nước kín quanh ô (5..9, 5..9) — túi đất bên trong không nối với phần còn lại.
		for (let y = 4; y <= 10; y += 1) {
			for (let x = 4; x <= 10; x += 1) {
				const ring = x === 4 || x === 10 || y === 4 || y === 10;
				rows[y] = rows[y]!.slice(0, x) + (ring ? 'w' : 'g') + rows[y]!.slice(x + 1);
			}
		}
	}
	const ps: { id: string; x: number; y: number }[] = [];
	for (let i = 0; i < props; i += 1) ps.push({ id: pick(['rock', 'tree', 'wide', 'flower', 'ghost', 'unknown']), x: Math.round(range(-40, w * tile + 40)), y: Math.round(range(-20, h * tile + 40)) });
	return { name, map: { tileSize: tile, width: w, height: h, terrain: rows, props: ps }, spawn: { x: (w * tile) / 2, y: (h * tile) / 2 } };
}
const synthMaps: VecMap[] = [synthMap('synth/open', 32, 30, 20, 0.04, 25, false), synthMap('synth/odd', 20, 37, 23, 0.12, 30, true), synthMap('synth/dense', 40, 18, 18, 0.3, 40, false), synthMap('synth/tiny', 16, 3, 2, 0, 0, false)];

function mapVectors(v: VecMap, meta: Record<string, PropFootprint>, full: boolean) {
	const { map } = v;
	const solids = buildSolids(map, meta);
	const blocked = (x: number, y: number, rx: number, ry: number): boolean => isBlocked(map, solids, x, y, rx, ry);
	const W = map.width * map.tileSize;
	const H = map.height * map.tileSize;
	const solidsOut = Object.fromEntries([...solids].map(([k, rs]) => [k, rs.map((r) => [r.x0, r.y0, r.x1, r.y1])]));
	const nBlock = full ? 700 : 400;
	const blockedOut: (number | string)[][] = [];
	for (let i = 0; i < nBlock; i += 1) {
		const x = rnd() < 0.3 ? Math.round(range(-30, W + 30)) : range(-30, W + 30);
		const y = rnd() < 0.3 ? Math.round(range(-30, H + 30)) : range(-30, H + 30);
		const rx = pick([0, 5, 11, 12, 30]);
		const ry = pick([0, 5, 6, 20]);
		blockedOut.push([x, y, rx, ry, blocked(x, y, rx, ry) ? 1 : 0]);
	}
	blockedOut.push([NaN, 10, 11, 5, blocked(NaN, 10, 11, 5) ? 1 : 0].map(enc));
	const slide: number[][] = [];
	const pos = { ...(v.spawn ?? { x: W / 2, y: H / 2 }) };
	const startPos = { ...pos };
	for (let i = 0; i < 250; i += 1) {
		const dx = rnd() < 0.2 ? 0 : range(-9, 9);
		const dy = rnd() < 0.2 ? 0 : range(-9, 9);
		const rx = i % 5 === 0 ? 20 : 11;
		const ry = i % 5 === 0 ? 9 : 5;
		slideMove(blocked, pos, dx, dy, rx, ry);
		slide.push([dx, dy, rx, ry, pos.x, pos.y]);
	}

	const nav = new NavGrid(W, H, blocked);
	const n = nav.cols * nav.rows;
	let walk = '';
	let links = '';
	for (let i = 0; i < n; i += 1) {
		walk += nav.walkable[i] ? '1' : '0';
		let m = 0;
		for (let d = 0; d < 8; d += 1) if (nav.neighbor(i, d) >= 0) m |= 1 << d;
		links += m.toString(16).padStart(2, '0');
	}
	const nearest: number[][] = [];
	for (let i = 0; i < (full ? 150 : 120); i += 1) {
		const x = range(-60, W + 60);
		const y = range(-60, H + 60);
		const ring = pick([4, 4, 1, 2, 8]);
		nearest.push([x, y, ring, nav.nearestWalkable(x, y, ring)]);
	}
	const cellAt: number[][] = [];
	for (let i = 0; i < 40; i += 1) {
		const x = range(-100, W + 100);
		const y = range(-100, H + 100);
		cellAt.push([x, y, nav.cellAt(x, y)]);
	}
	const visible: number[][] = [];
	for (let i = 0; i < (full ? 150 : 120); i += 1) {
		const a = { x: range(0, W), y: range(0, H) };
		const b = rnd() < 0.5 ? { x: a.x + range(-200, 200), y: a.y + range(-200, 200) } : { x: range(0, W), y: range(0, H) };
		const pad = pick([0, 1, 3]);
		visible.push([a.x, a.y, b.x, b.y, pad, nav.visible(a, b, pad) ? 1 : 0]);
	}
	const paths: unknown[] = [];
	const addPath = (from: { x: number; y: number }, goal: { x: number; y: number; stop: number }): void => {
		const p = nav.findPath(from, goal);
		paths.push({ from: [from.x, from.y], goal: [goal.x, goal.y, goal.stop], out: p && { partial: p.partial, points: p.points.map((q) => [q.x, q.y]) } });
	};
	const spawn = v.spawn ?? { x: W / 2, y: H / 2 };
	for (const s of v.spots ?? []) addPath(spawn, { x: s.x, y: s.y, stop: s.r });
	for (let i = 0; i < (full ? 30 : 40); i += 1) {
		const from = rnd() < 0.3 ? spawn : { x: range(0, W), y: range(0, H) };
		addPath(from, { x: range(-20, W + 20), y: range(-20, H + 20), stop: pick([8, 20, 40, 60, 120, 0]) });
	}
	// Tìm lại trên CÙNG lưới ngay sau — trạng thái dùng lại (state/g/parent) không được rò sang lần sau.
	if (paths.length) addPath(spawn, { x: W - 30, y: H - 30, stop: 40 });

	return {
		name: v.name,
		map: full ? undefined : map,
		solids: solidsOut,
		blocked: blockedOut,
		slide: { start: [startPos.x, startPos.y], steps: slide },
		nav: { cols: nav.cols, rows: nav.rows, walkable: walk, links, nearest, cellAt, visible, paths },
	};
}

const collisionMaps = [...realMaps.map((m) => ({ ...mapVectors(m, realMeta, true), map: m.map })), ...synthMaps.map((m) => mapVectors(m, synthMeta, false))];
// Map tự dựng mang meta riêng.
const maps = collisionMaps.map((m) => ({ ...m, meta: m.name.startsWith('synth/') ? 'synth' : 'real' }));

// ———— Quái dùng chung ————
const zoneVariants: Partial<MonsterZoneDef>[] = [{}, { fromAge: 16 }, { fromAge: 16, onDemand: true }, { fromAge: 8 }, { fromAge: 4, untilAge: 8 }, { fromAge: 20, untilAge: 30 }, { onDemand: true }, { fromAge: 15.5 }, { fromAge: 16, untilAge: 16 }];
const zonePreds = zoneVariants.map((z) => {
	const zz = { id: 'z', x: 0, y: 0, radius: 10, monsters: ['a'], count: 1, ...z } as MonsterZoneDef;
	return { zone: z, shared: isSharedZone(zz), child: isChildZone(zz), live: [0, 4, 8, 12, 15.9, 16, 17, 30, 31, 99].map((age) => [age, zoneLiveAt(zz, age)]) };
});
const zones: MonsterZoneDef[] = [
	...realMaps.flatMap((m) => m.zones ?? []),
	{ id: 'empty', x: 10, y: 10, radius: 50, monsters: [], count: 5 },
	{ id: 'zero', x: 10, y: 10, radius: 50, monsters: ['a'], count: 0 },
	{ id: 'frac', x: 100.5, y: -3, radius: 77.7, monsters: ['a', 'b'], count: 2.5 },
	{ id: 'many', x: 1234, y: 987, radius: 333, monsters: ['a', 'b', 'c'], count: 37 },
];
const spawnPoints = zones.map((z) => ({ zone: z, out: zoneSpawnPoints(z) }));
const mobIds = [['human/cliffs', 'cl_west', 0], ['human/town', 'z', 12]].map(([m, z, i]) => ({ map: m, zone: z, index: i, out: mobId(m as string, z as string, i as number) }));

const ccKeys = ['freeze', 'stun', 'air', 'slow', 'chill', 'frost', 'armor', 'sunder', 'miss', 'daze', 'wet', 'burn', 'bogus'];
const ccIn: unknown[] = [null, 0, 'x', [], [1, 2, 3], {}, { freeze: 0 }, { freeze: -1 }, { freeze: '2' }, { freeze: 2.12345 }, { freeze: 99 }, { slow: 2 }, { slow: 2, slowMult: 0.01 }, { slow: 2, slowMult: 5 }, { slow: 2, slowMult: 'x' }, { slowMult: 0.5 }, { push: [100, 0, 0.2] }, { push: [3000, 4000, 1] }, { push: [3000, 4000, 0] }, { push: [1, 2] }, { push: ['1', 2, 3] }, { push: [-0.4, 0.5, 0.1] }, { push: [-2.5, 2.5, 0.0004] }, { stun: true }, { air: 1.4999 }, { armor: 1e-9 }];
for (let i = 0; i < 300; i += 1) {
	const o: Record<string, unknown> = {};
	const nk = Math.floor(rnd() * 5);
	for (let j = 0; j < nk; j += 1) o[pick(ccKeys)] = pick([() => range(-2, 12), () => Math.round(range(-3, 15)), () => 0, () => 'abc', () => null, () => range(0, 0.002)])();
	if (rnd() < 0.4) o.slowMult = pick([() => range(-1, 2), () => 'x', () => null])();
	if (rnd() < 0.4) o.push = pick([() => [range(-3000, 3000), range(-3000, 3000), range(-0.1, 0.6)], () => [range(-50, 50), range(-50, 50), range(0, 0.3)], () => [1, 2], () => 'no'])();
	ccIn.push(o);
}
const cc = ccIn.map((raw) => ({ raw, out: cleanMobCc(raw) }));

const actIn: unknown[] = [null, 5, [], {}, { k: 'wind', dir: 'N', s: 0.3 }, { k: 'wind', dir: 'X', s: 0.3 }, { k: 'wind', dir: 'SE', s: 9 }, { k: 'wind', dir: 'SE', s: 0 }, { k: 'wind', dir: 3, s: 1 }, { k: 'wind', s: 1 }, { k: 'aoe', x: 10.5, y: -10.5 }, { k: 'aoe', x: '1', y: 2 }, { k: 'melee', x: 1, y: 2, nx: 0, ny: 0 }, { k: 'melee', x: 1, y: 2, nx: 3, ny: 4 }, { k: 'shot', x: 1.49, y: 2.5, nx: -1e-7, ny: 1e-7 }, { k: 'shot', x: 1, y: 2, nx: 1e-7, ny: 0 }, { k: 'shot', x: 1, y: 2 }, { k: 'zap', x: 1, y: 2, nx: 1, ny: 0 }, { x: 1, y: 2 }, { k: 5, x: 1, y: 2 }];
for (let i = 0; i < 300; i += 1) {
	const k = pick(['wind', 'aoe', 'melee', 'shot', 'zap']);
	const o: Record<string, unknown> = { k };
	if (k === 'wind') {
		o.dir = pick(['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'n', 'Q']);
		o.s = pick([() => range(-0.2, 2), () => 'x', () => null])();
	} else {
		o.x = rnd() < 0.05 ? 'x' : range(-3000, 3000);
		o.y = range(-3000, 3000);
		if (rnd() < 0.9) {
			o.nx = range(-2, 2);
			o.ny = rnd() < 0.1 ? 0 : range(-2, 2);
		}
	}
	actIn.push(o);
}
const act = actIn.map((raw) => ({ raw, out: cleanMobAct(raw) }));

// ———— Vùng ————
const regionIds = [...REGIONS.map((r) => r.id), 'nope'];
const gateCtxs = [1, 9, 10, 10.5, 19.99, 20, 35, 100].flatMap((level) => [{}, { boss_demon_001: 1 }, { boss_demon_001: 0 }, { boss_hydra_001: 2, boss_demon_001: 3 }].map((bossKills) => ({ level, bossKills })));
const regions = {
	regionDef: regionIds.map((id) => ({ id, out: regionDef(id) ?? null })),
	splitMapKey: [['human/town', 'x'], ['town', 'human'], ['a/b/c', 'z'], ['/x', 'h'], ['x/', 'h'], ['', 'h']].map(([k, h]) => ({ key: k, here: h, out: splitMapKey(k!, h!) })),
	regionNeeds: regionIds.map((id) => ({ id, out: regionNeeds(id) })),
	regionGate: regionIds.flatMap((id) => gateCtxs.map((ctx) => ({ id, ctx, out: regionGate(id, ctx) }))),
	hubKeys: hubKeys(),
};

// ———— Giờ VN / điểm danh / thành tựu ————
const msIn = [0, 1, -1, 1.9, -1.9, 1760054400000, 1760054399999, 1760029199999, 1760029200000, 1760029200000.7, 1e12, -1e12, -62198755200000, 8.64e15 - 25200000, -8.64e15, 8.64e15, NaN];
for (let i = 0; i < 60; i += 1) msIn.push(Math.floor(range(0, 4e12)));
const rewards = {
	vnDay: msIn.map((ms) => ({ ms: enc(ms), out: err(() => vnDay(ms)) })),
	dayBefore: ['2026-10-10', '2026-01-01', '2024-03-01', '2025-03-01', '2000-03-01', '1900-03-01', '2026-02-30', '2026-04-31', '2026-13-01', '2026-00-10', '2026-01-00', '2026-01-32', '2026-1-5', 'abc', '', '0000-01-01', '0001-01-01', '+002026-01-01', '-000001-06-15', '-000000-01-01', '+275760-09-13', '-271821-04-21', ' 2026-01-01'].map((day) => ({ day, out: err(() => dayBefore(day)) })),
	checkinSlot: [NaN, Infinity, -Infinity, -5, 0, 0.5, 1, 2, 6, 7, 7.9, 8, 13, 14, 15, 100, 1e17].map((s) => ({ streak: enc(s), out: enc(checkinSlot(s)) })),
	checkinGift: [1, 2, 3, 4, 5, 6, 7, 8, 14, 0, -3, 9.5].map((s) => ({ streak: s, out: checkinGift(s) })),
	nextStreak: [[null, 3, '2026-10-10'], ['2026-10-09', 3, '2026-10-10'], ['2026-10-08', 3, '2026-10-10'], ['2026-02-28', 9, '2026-03-01'], ['2024-02-29', 1, '2024-03-01'], ['2025-12-31', 0, '2026-01-01'], ['2026-10-10', 5, '2026-10-10']].map(([last, s, today]) => ({ last, streak: s, today, out: nextStreak(last as string | null, s as number, today as string) })),
	killStats: [{}, { mob_a: 3, boss_x: 2, boss_: 1, xboss_y: 4 }, { boss_demon_001: 10 }, { a: 1.5, b: 2.25 }].map((counts) => ({ counts, out: killStats(counts) })),
};

// ———— Cốt truyện ————
const story = {
	childhoodTitle: CHILDHOOD_TITLE,
	prologue: PROLOGUE,
	childhoodAgeCards: CHILDHOOD_AGE_CARDS,
	timeSkip: TIME_SKIP,
	childhoodNpcs: CHILDHOOD_NPCS,
	parentNpcs16: PARENT_NPCS_16,
	childhoodQuests: CHILDHOOD_QUESTS,
	youthNpcs: YOUTH_NPCS,
	youthQuests: YOUTH_QUESTS,
	youthEnding: YOUTH_ENDING,
	questIds: QUESTS.map((q) => q.id),
	questDef: [...QUESTS.map((q) => q.id), 'nope'].map((id) => ({ id, out: questDef(id) ?? null })),
};

// String(number) — chữ cấp trong câu cổng vùng.
const numStrIn = [0, -0, 1, -1, 10, 10.5, 19.99, 0.1 + 0.2, 1 / 3, 100, 1e20, 1e21, 123456789012345680000, 1.5e300, 1e-6, 1e-7, 1.25e-7, 0.000001234, 5e-324, 1.7976931348623157e308, -2.5e-10, 4.35, 0.3, 2 ** 53, 2 ** 53 + 2, 9007199254740993, NaN, Infinity, -Infinity];
for (let i = 0; i < 200; i += 1) numStrIn.push(pick([() => range(-1e6, 1e6), () => rnd() * 10 ** Math.floor(range(-30, 30)), () => Math.round(range(0, 1e4)) / 100])());
const numStr = numStrIn.map((n) => [enc(n), String(n)]);

const out = { consts: { GRID, NAV_CELL }, hypot, numStr, meta: { real: realMeta, synth: synthMeta }, maps, mobs: { zonePreds, spawnPoints, mobIds, cc, act }, regions, rewards, story };
writeFileSync(join(OUT, 'world.json'), `${JSON.stringify(out)}\n`);
const nPaths = maps.reduce((s, m) => s + m.nav.paths.length, 0);
console.log(`✔ vector thế giới → ${join(OUT, 'world.json')}: ${hypot.length} hypot · ${maps.length} map · ${nPaths} đường đi · ${cc.length} cc · ${act.length} act · ${regions.regionGate.length} cổng vùng`);

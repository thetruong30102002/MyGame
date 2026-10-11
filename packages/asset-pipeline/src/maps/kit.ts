import type { PropMeta } from '../props/buildProps.js';
import { decalsOf, Layout, px, TILE, type Biome, type Edge, type MapData, type MapExit, type MonsterZone } from './human/common.js';
import { MIN_WATER_GAP, validateRegion, worldIndex, type WorldIndex } from './human/index.js';

/**
 * Bộ dựng map dùng chung cho vùng 2–7 (10/10/2026 — chủ dự án: "làm hết các vùng luôn đi"). Vùng 1 viết tay từng map; các vùng
 * sau theo KHUNG 12 map (docs/ke-hoach-the-gioi.md mục 1: 1 trạm + 10 map săn + 1 thánh địa, +1 Long Huyệt nếu vùng có rồng) nên
 * mỗi map khai bằng một đặc tả gọn (`KitMapSpec`) rồi sinh bằng cùng một quy trình, hạt giống cố định → chạy lại ra đúng map cũ:
 * 1. Đường (rộng 2 ô) từ mỗi lối sang map vào ngã ba giữa map, có khúc gãy; biển chỉ đường + điểm đến cạnh mỗi lối.
 * 2. Bờ biển (dải nước dọc một mép KHÔNG có lối) nếu chủ đề có.
 * 3. Bãi trống cho từng bầy + hang ổ boss: chọn điểm xa đường, xa lối, xa ngã ba, xa nhau, cách nước ≥ 7 ô (luật vùng 1: tâm bầy cách
 *    nước ≥ 6 ô); nối bãi về đường gần nhất bằng lối mòn.
 * 4. Ao / hồ (nước — núi lửa thì là dung nham, tuyết thì là hồ băng: bảng màu theo `biome`) né đường, bãi, lối.
 * 5. Cây (nền rừng `f` thì dày, tán chồng nhau; nền trống `g` thì thưa) + viền cây / đá dày dọc mép map, đá, cảnh nền, đồ điểm
 *    xuyết quanh bãi, decal. Trạm: quảng trường + nhà quanh quảng trường + cột dịch chuyển; thánh địa / Long Huyệt: sân đá + vòng cột.
 * Luật kiểm sau khi dựng: `validateRegion` của vùng 1 (một loại quái / map, cấp trong khoảng vùng, nước, lối hai chiều đúng mép).
 */

export interface KitTheme {
	biome: Biome;
	/** Nền chính: `g` đất trống (cỏ / cát / tuyết / tro theo biome) hoặc `f` rừng rậm (khoét bãi trống cho bầy). */
	fill: 'g' | 'f';
	road: 'd' | 'c';
	/** Cây (tán chồng nhau được). Rỗng = không cây. */
	trees: readonly string[];
	/** Số lần thử đặt cây / 100 ô (rừng ~50, nền trống ~6–12). */
	treeDensity: number;
	rocks: readonly string[];
	rockDensity: number;
	/** Cảnh nền đi xuyên (cỏ hoa, sỏi, xương…). */
	flats: readonly string[];
	flatDensity: number;
	/** Đồ điểm xuyết quanh bãi bầy (tượng, cột đổ…). */
	landmarks: readonly string[];
	water: 'none' | 'ponds' | 'lakes' | 'coast';
	sign: string;
	/** Tag tấm decal (`d1` đồng cỏ, `d2` đất chết); vắng = không decal. */
	decal?: string;
}

export interface KitZone {
	name: string;
	monster: string;
	level: number;
	count: number;
}

export interface KitBoss {
	name: string;
	monster: string;
	level: number;
	/** Đồ vật dựng vòng quanh sân boss. */
	ring: readonly string[];
	/** Đồ vật giữa phía bắc sân (bệ thờ, cổng…). */
	center?: string;
}

export interface KitMapSpec {
	id: string;
	name: string;
	seed: number;
	w: number;
	h: number;
	role: 'hub' | 'hunt' | 'sanctum' | 'lair';
	theme: KitTheme;
	zones?: readonly KitZone[];
	boss?: KitBoss;
	hub?: { buildings: readonly string[]; decor: readonly string[]; waystone: string; plaza: 'c' | 'd' };
}

/** Lối sang map khác của một map (do `buildKitRegion` dựng từ đồ thị lối của vùng). */
export interface KitExit {
	edge: Edge;
	to: string;
	toSpot: string;
	label: string;
	/** Id + tên điểm đến CỦA MAP NÀY cạnh lối (map bên kia dẫn về đây). */
	spot: string;
	spotName: string;
}

const OPP: Record<Edge, Edge> = { N: 'S', S: 'N', E: 'W', W: 'E' };

/** Điểm đến cạnh lối ở mép `edge` của map `map` — tên chuẩn để map bên kia khai `toSpot`. */
export const entrySpot = (map: string, edge: Edge): string => `${map}_${edge.toLowerCase()}`;

type Pt = { x: number; y: number };

/** Khoảng cách (ô, kiểu bàn cờ vua) từ mọi ô tới ô gần nhất thoả `hit` — BFS nhiều nguồn. */
function distanceField(L: Layout, hit: (c: string) => boolean): Float32Array {
	const d = new Float32Array(L.w * L.h).fill(Infinity);
	const q: number[] = [];
	for (let y = 0; y < L.h; y += 1)
		for (let x = 0; x < L.w; x += 1)
			if (hit(L.at(x, y))) {
				d[y * L.w + x] = 0;
				q.push(y * L.w + x);
			}
	for (let i = 0; i < q.length; i += 1) {
		const c = q[i]!;
		const cx = c % L.w;
		const cy = (c - cx) / L.w;
		for (let dy = -1; dy <= 1; dy += 1)
			for (let dx = -1; dx <= 1; dx += 1) {
				const nx = cx + dx;
				const ny = cy + dy;
				if (nx < 0 || ny < 0 || nx >= L.w || ny >= L.h) continue;
				const n = ny * L.w + nx;
				if (d[n]! > d[c]! + 1) {
					d[n] = d[c]! + 1;
					q.push(n);
				}
			}
	}
	return d;
}

const isRoad = (c: string): boolean => c === 'd' || c === 'c' || c === 'b';

export function buildKitMap(spec: KitMapSpec, exits: readonly KitExit[], meta: Record<string, PropMeta>, decalIds: string[]): MapData {
	// Món chủ đề chưa có ảnh (đợt vẽ thêm chưa xong) thì lọc bỏ trước — không để lượt đặt rơi vào món thiếu làm map thưa đi.
	const has = (ids: readonly string[]): string[] => ids.filter((id) => meta[id]);
	const t: KitTheme = { ...spec.theme, trees: has(spec.theme.trees), rocks: has(spec.theme.rocks), flats: has(spec.theme.flats), landmarks: has(spec.theme.landmarks) };
	const L = new Layout(spec.w, spec.h, spec.seed, meta, t.fill);
	const R = (a: number, b: number): number => a + L.rand() * (b - a);
	const Ri = (a: number, b: number): number => Math.floor(R(a, b + 1));
	const J: Pt = { x: Math.round(spec.w / 2 + R(-3, 3)), y: Math.round(spec.h / 2 + R(-2, 2)) };
	const hub = spec.role === 'hub';
	const arena = spec.role === 'sanctum' || spec.role === 'lair';

	// 1. Lối + đường vào ngã ba.
	const exitInfo = exits.map((e) => {
		const len = e.edge === 'N' || e.edge === 'S' ? spec.w : spec.h;
		// Trạm: đường THẲNG toả từ quảng trường (lối thẳng hàng ngã ba) để vòng nhà quanh quảng trường không bị đường cắt.
		const c = hub ? (e.edge === 'N' || e.edge === 'S' ? J.x : J.y) : Math.max(6, Math.min(len - 8, Math.round(len / 2 + R(-6, 6))));
		const inner: Pt = e.edge === 'N' ? { x: c, y: 2 } : e.edge === 'S' ? { x: c, y: spec.h - 3 } : e.edge === 'W' ? { x: 2, y: c } : { x: spec.w - 3, y: c };
		return { e, c, inner };
	});
	if (t.water === 'coast' && !hub && !arena) {
		const free = (['N', 'S', 'E', 'W'] as Edge[]).filter((ed) => !exits.some((x) => x.edge === ed));
		if (free.length) coast(L, free[Math.floor(L.rand() * free.length)]!, R);
	}
	for (const { e, c, inner } of exitInfo) {
		const start: [number, number] = e.edge === 'N' ? [c, 0] : e.edge === 'S' ? [c, spec.h - 2] : e.edge === 'W' ? [0, c] : [spec.w - 2, c];
		// Đoạn thẳng từ mép vào (lối rõ ràng) rồi uốn lượn tới ngã ba; trạm đi thẳng một mạch.
		L.path([start, [inner.x, inner.y]], 2, t.road);
		if (hub) L.path([[inner.x, inner.y], [J.x, J.y]], 2, t.road);
		else wiggle(L, inner, J, 2, t.road, R);
		L.reserve(inner.x + 0.5, inner.y + 0.5, 3.2);
	}

	// Trạm: quảng trường. Thánh địa / Long Huyệt: sân đá lớn giữa map.
	if (hub) L.disc(J.x, J.y, 5.5, spec.hub?.plaza ?? 'c');
	const arenaR = spec.role === 'lair' ? 9.5 : 7.5;
	if (arena) L.disc(J.x, J.y, arenaR, t.road);

	// 3. Bãi trống cho bầy + hang ổ.
	const zoneSpecs = hub || arena ? [] : [...(spec.zones ?? [])];
	const needLair = !!spec.boss && !arena;
	const clearings: { p: Pt; r: number; lair: boolean }[] = [];
	const roadD = distanceField(L, isRoad);
	const waterD0 = distanceField(L, (c) => c === 'w');
	const exitPts = exitInfo.map((x) => x.inner);
	const slots = zoneSpecs.length + (needLair ? 1 : 0);
	for (let k = 0; k < slots; k += 1) {
		const lair = needLair && k === 0;
		const r0 = lair ? 6 : R(4.2, 5.4);
		let best: Pt | null = null;
		let r = r0;
		// Không đủ chỗ thì nới dần: bãi nhỏ lại, được sát đường / lối / ngã ba hơn (luật nước giữ nguyên).
		for (let relax = 0; relax < 4 && !best; relax += 1) {
			r = Math.max(3.4, r0 - relax * 0.5);
			let bestScore = -Infinity;
			for (let tries = 0; tries < 900; tries += 1) {
				const p = { x: Ri(Math.ceil(r) + 3, spec.w - Math.ceil(r) - 4), y: Ri(Math.ceil(r) + 3, spec.h - Math.ceil(r) - 4) };
				const i = p.y * spec.w + p.x;
				if (roadD[i]! < r - 1.5 - relax * 0.6 || waterD0[i]! < r + 2.5 || waterD0[i]! < MIN_WATER_GAP + 1) continue;
				if (Math.hypot(p.x - J.x, p.y - J.y) < r + 5 - relax) continue;
				if (exitPts.some((e) => Math.hypot(p.x - e.x, p.y - e.y) < r + 6 - relax)) continue;
				const near = clearings.reduce((m, c) => Math.min(m, Math.hypot(p.x - c.p.x, p.y - c.p.y) - c.r - r), Infinity);
				if (near < 3 - relax * 0.5) continue;
				// Xa các bãi khác (rải đều map).
				const score = Math.min(near, 14) + L.rand() * 3;
				if (score > bestScore) {
					bestScore = score;
					best = p;
				}
			}
		}
		if (!best) throw new Error(`${spec.id}: không đủ chỗ cho bãi thứ ${k + 1}`);
		clearings.push({ p: best, r, lair });
	}
	for (const c of clearings) {
		if (t.fill === 'f') L.disc(c.p.x, c.p.y, c.r, 'g', 'f');
		L.reserve(c.p.x, c.p.y, c.r + 0.8);
		// Lối mòn hẹp (đất) về đường gần nhất — bãi đã sát đường thì thôi.
		if (roadD[c.p.y * spec.w + c.p.x]! > c.r + 2) connect(L, c.p, R);
	}

	// 4. Ao / hồ né đường, bãi, lối, ngã ba.
	if (t.water === 'ponds' || t.water === 'lakes' || (t.water === 'coast' && (hub || arena))) {
		const big = t.water === 'lakes';
		const n = hub ? 1 : arena ? 0 : big ? Ri(1, 2) : Ri(3, 6);
		const rd = distanceField(L, isRoad);
		for (let k = 0, made = 0; k < 400 && made < n; k += 1) {
			const r = big ? R(4.5, 6.5) : hub ? R(2.5, 3.2) : R(2, 3.6);
			const p = { x: Ri(Math.ceil(r) + 2, spec.w - Math.ceil(r) - 3), y: Ri(Math.ceil(r) + 2, spec.h - Math.ceil(r) - 3) };
			if (rd[p.y * spec.w + p.x]! < r + 2) continue;
			if (Math.hypot(p.x - J.x, p.y - J.y) < r + (hub ? 9 : 5)) continue;
			if (exitPts.some((e) => Math.hypot(p.x - e.x, p.y - e.y) < r + 5)) continue;
			// Ao méo (`blob`) loang tới ~1,4 lần bán kính: tâm bầy phải cách mép nước ≥ MIN_WATER_GAP ô.
			if (clearings.some((c) => Math.hypot(p.x - c.p.x, p.y - c.p.y) < r * 1.45 + MIN_WATER_GAP + 1.5)) continue;
			blob(L, p, r, R);
			made += 1;
		}
	}

	// Thánh địa / Long Huyệt: vòng nước quanh sân (hồ Hydra, dung nham, hồ băng, biển) chừa hướng các lối vào.
	if (arena && t.water !== 'none') {
		const gaps = exitInfo.map(({ inner }) => Math.atan2(inner.y - J.y, inner.x - J.x));
		for (let a = 0; a < Math.PI * 2; a += 0.32) {
			if (gaps.some((g) => Math.abs(Math.atan2(Math.sin(a - g), Math.cos(a - g))) < 0.75)) continue;
			const rr = arenaR + R(3, 4.5);
			L.disc(J.x + Math.cos(a) * rr, J.y + Math.sin(a) * rr * 0.9, R(1.8, 2.8), 'w', 'gf');
		}
	}

	// Biển chỉ đường + điểm đến cạnh lối.
	const spots: MapData['spots'] = [];
	for (const { e, c, inner } of exitInfo) {
		const sx = e.edge === 'W' ? px(inner.x) : e.edge === 'E' ? px(inner.x) : px(c) + TILE / 2;
		const sy = e.edge === 'N' ? px(inner.y) : e.edge === 'S' ? px(inner.y) : px(c) + TILE / 2;
		spots.push({ id: e.spot, name: e.spotName, x: sx, y: sy, r: 60 });
		const side = e.edge === 'N' || e.edge === 'S' ? { x: px(c) - TILE * 1.2, y: sy + (e.edge === 'N' ? TILE * 1.6 : -TILE * 0.4) } : { x: sx + (e.edge === 'W' ? TILE * 1.6 : -TILE * 1.6), y: px(c) - TILE * 0.6 };
		L.place(t.sign, side.x, side.y, { force: true });
	}

	// Trạm: nhà quanh quảng trường + cột dịch chuyển + đồ lặt vặt.
	if (hub && spec.hub) {
		const ws = { x: px(J.x + 2), y: px(J.y - 2) };
		L.place(spec.hub.waystone, ws.x, ws.y, { force: true });
		spots.push({ id: 'waystone', name: 'Cột dịch chuyển', x: ws.x, y: ws.y + 34, r: 80 });
		spots.push({ id: 'plaza', name: spec.name, x: px(J.x), y: px(J.y), r: 200 });
		const roadDir = exitInfo.map(({ e }) => ({ N: -Math.PI / 2, S: Math.PI / 2, E: 0, W: Math.PI }[e.edge]));
		const bs = has(spec.hub.buildings);
		const hubDecor = has(spec.hub.decor);
		for (let i = 0; i < bs.length; i += 1) {
			let a = ((i + 0.5) / bs.length) * Math.PI * 2 + R(-0.15, 0.15);
			// Tránh hướng các con đường chính ra lối.
			for (let k = 0; k < 8 && roadDir.some((d) => Math.abs(Math.atan2(Math.sin(a - d), Math.cos(a - d))) < 0.42); k += 1) a += 0.22;
			for (let k = 0; k < 14; k += 1) {
				const rr = 10.5 + k * 0.35;
				if (L.place(bs[i]!, px(J.x + Math.cos(a) * rr), px(J.y + Math.sin(a) * rr * 0.85) + 20)) break;
			}
		}
		if (hubDecor.length) L.scatter(260, (x, y) => (Math.hypot(x / TILE - J.x, y / TILE - J.y) < 13 ? L.place(L.pick(hubDecor), x, y) : false));
	}

	// Sân boss: vòng cột + bệ giữa.
	const bossAt = (c: Pt, r: number, b: KitBoss): void => {
		const n = Math.max(6, Math.round(r * 1.3));
		for (let i = 0; i < n; i += 1) {
			const a = (i / n) * Math.PI * 2 + 0.3;
			if (Math.abs(Math.sin(a)) > 0.92 && i % 2) continue;
			L.place(b.ring[i % b.ring.length]!, px(c.x + Math.cos(a) * (r + 0.6)), px(c.y + Math.sin(a) * (r + 0.6) * 0.9) + 16, { force: true });
		}
		if (b.center) L.place(b.center, px(c.x), px(c.y - r + 1.6), { force: true });
	};
	const zones: MonsterZone[] = [];
	const lair = clearings.find((c) => c.lair);
	const herd = clearings.filter((c) => !c.lair);
	herd.forEach((c, i) => {
		const z = zoneSpecs[i]!;
		zones.push({
			id: `${spec.id}_z${i + 1}`,
			name: z.name,
			x: px(c.p.x),
			y: px(c.p.y),
			radius: Math.round((c.r - 1) * TILE),
			monsters: [z.monster],
			count: z.count,
			fromAge: 16,
			level: z.level,
		});
	});
	const bossCenter = arena ? J : lair?.p;
	if (spec.boss && bossCenter) {
		bossAt(bossCenter, arena ? arenaR : lair!.r, spec.boss);
		zones.push({
			id: `${spec.id}_boss`,
			name: spec.boss.name,
			x: px(bossCenter.x),
			y: px(bossCenter.y + 1),
			radius: 2 * TILE,
			monsters: [spec.boss.monster],
			count: 1,
			fromAge: 16,
			level: spec.boss.level,
			boss: true,
		});
		spots.push({ id: `${spec.id}_lair`, name: spec.boss.name, x: px(bossCenter.x), y: px(bossCenter.y + 2), r: 160 });
	}
	for (const z of zones) L.keepSpawnsClear(z);

	// 5. Cây, viền mép, đá, cảnh nền, đồ điểm xuyết.
	const area = spec.w * spec.h;
	const ground = (x: number, y: number): string => L.at(Math.floor(x / TILE), Math.floor(y / TILE));
	if (t.trees.length) {
		L.scatter(Math.round((area * t.treeDensity) / 100), (x, y) => L.place(L.pick(t.trees), x, y, { canopy: true }));
		// Viền: cây dày trong 3 ô sát mép (trừ quanh lối — đã giữ trống) để map có bờ tự nhiên.
		L.scatter(Math.round((spec.w + spec.h) * 9), (x, y) => {
			const tx = x / TILE;
			const ty = y / TILE;
			const edge = Math.min(tx, ty, spec.w - tx, spec.h - ty);
			return edge < 3 ? L.place(L.pick(t.trees), x, y, { canopy: true }) : false;
		});
	}
	if (t.rocks.length) {
		L.scatter(Math.round((area * t.rockDensity) / 100), (x, y) => L.place(L.pick(t.rocks), x, y));
		// Map ít cây: thêm viền đá sát mép cho có bờ.
		if (t.treeDensity < 10)
			L.scatter(Math.round((spec.w + spec.h) * (t.trees.length ? 3 : 6)), (x, y) => {
				const edge = Math.min(x / TILE, y / TILE, spec.w - x / TILE, spec.h - y / TILE);
				return edge < 2.5 ? L.place(L.pick(t.rocks), x, y) : false;
			});
	}
	if (t.flats.length) L.scatter(Math.round((area * t.flatDensity) / 100), (x, y) => (ground(x, y) === 'g' || ground(x, y) === 'f' ? L.place(L.pick(t.flats), x, y) : false));
	if (t.landmarks.length)
		for (const c of herd)
			for (let k = 0, made = 0; k < 40 && made < 3; k += 1) {
				const a = L.rand() * Math.PI * 2;
				const rr = c.r + 1.4 + L.rand() * 1.5;
				if (L.place(L.pick(t.landmarks), px(c.p.x + Math.cos(a) * rr), px(c.p.y + Math.sin(a) * rr))) made += 1;
			}
	if (t.decal) L.sprinkleDecals(decalsOf(decalIds, t.decal), Math.round(area * 0.6));

	const mapExits: MapExit[] = exitInfo.map(({ e, c }, i) => ({
		id: `${spec.id}_x${i + 1}`,
		to: e.to,
		toSpot: e.toSpot,
		edge: e.edge,
		...L.exitStrip(e.edge, c - 2, c + 3),
		label: e.label,
	}));
	const entry = spots[0] ?? { x: px(J.x), y: px(J.y) };
	return L.finish({
		id: spec.id,
		name: spec.name,
		biome: t.biome,
		spawn: { x: entry.x, y: entry.y },
		npcs: [],
		monsterZones: zones,
		boss: null,
		spots,
		dummies: [],
		areas: [
			...zones.map((z) => ({ name: z.name, x0: z.x - z.radius - TILE * 2, y0: z.y - z.radius - TILE * 2, x1: z.x + z.radius + TILE * 2, y1: z.y + z.radius + TILE * 2 })),
			{ name: spec.name, x0: 0, y0: 0, x1: spec.w * TILE, y1: spec.h * TILE },
		],
		exits: mapExits,
	});
}

/**
 * Đường uốn lượn từ `a` tới `b` (ô): lệch ngang theo hai sóng sin có biên độ tắt dần ở hai đầu (đầu đường khớp đúng lối / ngã ba).
 * Vẽ bằng các ô vuông rộng `width` dọc đường — bộ tô nền làm mềm mép sau.
 */
function wiggle(L: Layout, a: Pt, b: Pt, width: number, c: string, R: (x: number, y: number) => number): void {
	const dx = b.x - a.x;
	const dy = b.y - a.y;
	const dist = Math.hypot(dx, dy);
	if (dist < 1) return;
	const nx = -dy / dist;
	const ny = dx / dist;
	const amp = Math.min(4.5, dist / 5) * (R(0, 1) < 0.5 ? -1 : 1);
	const f1 = R(0.8, 1.6);
	const ph = R(0, Math.PI * 2);
	const steps = Math.ceil(dist * 3);
	for (let i = 0; i <= steps; i += 1) {
		const t = i / steps;
		const env = Math.sin(t * Math.PI);
		const off = env * (amp * Math.sin(t * Math.PI * f1) + 1.1 * Math.sin(t * Math.PI * 4 + ph));
		const x = Math.round(a.x + dx * t + nx * off);
		const y = Math.round(a.y + dy * t + ny * off);
		L.rect(x, y, x + width - 1, y + width - 1, c);
	}
}

/** Lối mòn hẹp (đất) từ tâm bãi về ô đường gần nhất, uốn nhẹ. */
function connect(L: Layout, p: Pt, R: (x: number, y: number) => number): void {
	let best: Pt | null = null;
	let bd = Infinity;
	for (let y = 0; y < L.h; y += 1)
		for (let x = 0; x < L.w; x += 1) {
			if (!isRoad(L.at(x, y))) continue;
			const d = Math.abs(x - p.x) + Math.abs(y - p.y);
			if (d < bd) {
				bd = d;
				best = { x, y };
			}
		}
	if (!best) return;
	wiggle(L, p, best, 1, 'd', R);
}

/** Ao / hồ méo tự nhiên: vài đĩa chồng nhau, chỉ đè lên nền (không lấn đường). */
function blob(L: Layout, p: Pt, r: number, R: (a: number, b: number) => number): void {
	L.disc(p.x, p.y, r, 'w', 'gf');
	for (let k = 0; k < 3; k += 1) L.disc(p.x + R(-r * 0.6, r * 0.6), p.y + R(-r * 0.5, r * 0.5), r * R(0.5, 0.8), 'w', 'gf');
}

/** Bờ biển: dải nước dọc mép `edge`, mép bờ uốn lượn (sâu 5–8 ô). */
function coast(L: Layout, edge: Edge, R: (a: number, b: number) => number): void {
	const along = edge === 'N' || edge === 'S' ? L.w : L.h;
	const ph = R(0, Math.PI * 2);
	const base = R(5, 7);
	for (let i = 0; i < along; i += 1) {
		const depth = Math.round(base + 1.6 * Math.sin(i / 6 + ph) + 0.8 * Math.sin(i / 2.3 + ph * 2));
		for (let d = 0; d < depth; d += 1) {
			if (edge === 'N') L.set(i, d, 'w');
			else if (edge === 'S') L.set(i, L.h - 1 - d, 'w');
			else if (edge === 'W') L.set(d, i, 'w');
			else L.set(L.w - 1 - d, i, 'w');
		}
	}
}

// ———————————————————————————— cả vùng ————————————————————————————

export interface KitRegionDef {
	region: string;
	levels: readonly [number, number];
	start: string;
	maps: readonly KitMapSpec[];
	/** Lối trong vùng: [map, mép của map đó, map bên kia] — tự sinh lối về ở mép đối diện. */
	links: readonly (readonly [string, Edge, string])[];
	/** Lối sang VÙNG KHÁC: map + mép + đích `vùng/map` + điểm đến ở map đích. */
	cross: readonly { map: string; edge: Edge; to: string; toSpot: string; label: string; spot: string; spotName: string }[];
	/** Nhãn hiện trên lối dẫn TỚI map (tên + khoảng cấp…). */
	labels: Readonly<Record<string, string>>;
}

export function buildKitRegion(def: KitRegionDef, meta: Record<string, PropMeta>, decalIds: string[]): { maps: MapData[]; index: WorldIndex } {
	const byId = new Map(def.maps.map((m) => [m.id, m]));
	const exits = new Map<string, KitExit[]>(def.maps.map((m) => [m.id, []]));
	for (const [a, edge, b] of def.links) {
		const ma = byId.get(a);
		const mb = byId.get(b);
		if (!ma || !mb) throw new Error(`${def.region}: lối ${a}→${b} tới map không có`);
		exits.get(a)!.push({ edge, to: b, toSpot: entrySpot(b, OPP[edge]), label: def.labels[b] ?? mb.name, spot: entrySpot(a, edge), spotName: `Đường tới ${mb.name}` });
		exits.get(b)!.push({ edge: OPP[edge], to: a, toSpot: entrySpot(a, edge), label: def.labels[a] ?? ma.name, spot: entrySpot(b, OPP[edge]), spotName: `Đường tới ${ma.name}` });
	}
	for (const c of def.cross) exits.get(c.map)!.push({ edge: c.edge, to: c.to, toSpot: c.toSpot, label: c.label, spot: c.spot, spotName: c.spotName });
	for (const [id, list] of exits) {
		const edges = list.map((e) => e.edge);
		if (new Set(edges).size !== edges.length) throw new Error(`${def.region}/${id}: hai lối cùng một mép (${edges.join(', ')})`);
	}
	const maps = def.maps.map((m) => buildKitMap(m, exits.get(m.id)!, meta, decalIds));
	const problems = validateRegion(maps, def.levels);
	if (problems.length) throw new Error(`Map vùng ${def.region} sai:\n  - ${problems.join('\n  - ')}`);
	return { maps, index: worldIndex(def.region, def.start, maps) };
}

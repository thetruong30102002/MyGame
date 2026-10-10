import { enemyLevel } from '@aether/sim/skills';
import { REGIONS, regionDef, regionGate, regionNeeds, splitMapKey, type GateCtx } from '@aether/sim/regions';
import { EDGE_DIR, type Edge } from './exits';
import type { WorldIndexData } from './WorldIndex';

/**
 * Dữ liệu bản đồ tổng (phím M — docs/ke-hoach-the-gioi.md mục 3 / 3.1). THUẦN, test bằng node (`tests/worldmap.test.ts`).
 *
 * - Tầng "Thế giới": tranh lục địa PixelLab 688×384 (`sources/pixellab/world/continent.png`, dựng vào web bằng
 *   `npm run assets:world` → `assets/ui/world-continent.png`). Mỗi vùng khai TÂM (nhãn tên + dấu "Bạn ở đây") và ĐƯỜNG BAO
 *   (đa giác) theo tỉ lệ 0–1 của ảnh — tranh vẽ lại khác bố cục thì sửa toạ độ ở đây (soi ảnh lưới, test kiểm hướng + chồng lấn).
 * - Tầng "Vùng": sơ đồ các map của một vùng — ô (cột, hàng) của từng map khai tay ở `REGION_LAYOUTS` (bắc ở trên), đường nối +
 *   cổng sang vùng khác lấy từ lối thật trong `world.json`. Test bắt hướng trên sơ đồ khớp mép của lối (lối mép bắc → map kia
 *   nằm phía trên…).
 */

/** Tranh lục địa (cỡ gốc). Hiện NGUYÊN lần (1× / 2×, nét pixel) — không co lẻ. */
export const CONTINENT = { url: '/assets/ui/world-continent.png', width: 688, height: 384 } as const;

export type Pt = readonly [number, number];

export interface ContinentPlace {
	/** Tâm vùng (0–1 theo ảnh): nhãn tên vùng + dấu "Bạn ở đây". */
	center: Pt;
	/**
	 * Đường bao vùng (0–1 theo ảnh, đa giác theo chiều kim đồng hồ): bắt rê / chạm, viền tô sáng, làm tối vùng chưa mở. Hai vùng
	 * kề nhau dùng CHUNG đỉnh ở đường ranh để không hở khe sáng giữa hai vùng tối.
	 */
	outline: readonly Pt[];
}

/**
 * 10 vùng trên tranh (bố cục cố định theo hướng — bảng mục 3.1): giữa Thistlewood, Tây Nam đầm lầy, Nam sa mạc, Đông Bắc cao
 * nguyên, Bắc lãnh nguyên, Đông núi lửa, Đông Nam quần đảo, Tây rừng nấm, Tây Bắc phế tích, góc Đông Bắc ngoài khơi Vực Hư Không.
 * Đo trên ảnh lưới 0,025 (10/10/2026): ranh là dãy núi / sông vẽ sẵn trong tranh.
 */
export const CONTINENT_PLACES: Readonly<Record<string, ContinentPlace>> = {
	human: {
		center: [0.485, 0.46],
		outline: [
			[0.335, 0.335],
			[0.4, 0.315],
			[0.5, 0.315],
			[0.56, 0.345],
			[0.6, 0.33],
			[0.615, 0.38],
			[0.625, 0.4],
			[0.625, 0.42],
			[0.62, 0.5],
			[0.625, 0.58],
			[0.61, 0.635],
			[0.6, 0.635],
			[0.55, 0.65],
			[0.5, 0.65],
			[0.44, 0.64],
			[0.39, 0.645],
			[0.355, 0.62],
			[0.34, 0.55],
			[0.335, 0.45],
			[0.33, 0.38],
		],
	},
	swamp: {
		center: [0.21, 0.765],
		outline: [
			[0.1, 0.595],
			[0.16, 0.6],
			[0.24, 0.6],
			[0.3, 0.585],
			[0.34, 0.55],
			[0.355, 0.62],
			[0.39, 0.645],
			[0.375, 0.7],
			[0.36, 0.75],
			[0.35, 0.8],
			[0.345, 0.86],
			[0.33, 0.92],
			[0.25, 0.945],
			[0.17, 0.94],
			[0.1, 0.905],
			[0.075, 0.85],
			[0.055, 0.76],
			[0.07, 0.68],
		],
	},
	desert: {
		center: [0.485, 0.8],
		outline: [
			[0.39, 0.645],
			[0.44, 0.64],
			[0.5, 0.65],
			[0.55, 0.65],
			[0.6, 0.635],
			[0.61, 0.635],
			[0.625, 0.7],
			[0.632, 0.78],
			[0.635, 0.85],
			[0.61, 0.91],
			[0.55, 0.97],
			[0.46, 0.98],
			[0.39, 0.95],
			[0.345, 0.9],
			[0.345, 0.86],
			[0.35, 0.8],
			[0.36, 0.75],
			[0.375, 0.7],
		],
	},
	highland: {
		center: [0.725, 0.215],
		outline: [
			[0.605, 0.18],
			[0.62, 0.1],
			[0.66, 0.06],
			[0.74, 0.045],
			[0.8, 0.06],
			[0.835, 0.12],
			[0.845, 0.25],
			[0.83, 0.35],
			[0.78, 0.38],
			[0.7, 0.395],
			[0.625, 0.4],
			[0.615, 0.38],
			[0.6, 0.33],
			[0.605, 0.26],
		],
	},
	tundra: {
		center: [0.445, 0.17],
		outline: [
			[0.285, 0.1],
			[0.31, 0.05],
			[0.4, 0.035],
			[0.5, 0.04],
			[0.56, 0.05],
			[0.59, 0.1],
			[0.605, 0.18],
			[0.605, 0.26],
			[0.6, 0.33],
			[0.56, 0.345],
			[0.5, 0.315],
			[0.4, 0.315],
			[0.335, 0.335],
			[0.3, 0.31],
			[0.285, 0.22],
		],
	},
	volcano: {
		center: [0.78, 0.52],
		outline: [
			[0.625, 0.4],
			[0.7, 0.395],
			[0.78, 0.38],
			[0.83, 0.35],
			[0.88, 0.345],
			[0.915, 0.39],
			[0.935, 0.45],
			[0.945, 0.55],
			[0.92, 0.63],
			[0.86, 0.66],
			[0.8, 0.685],
			[0.74, 0.69],
			[0.68, 0.67],
			[0.64, 0.645],
			[0.61, 0.635],
			[0.625, 0.58],
			[0.62, 0.5],
			[0.625, 0.42],
		],
	},
	isles: {
		center: [0.8, 0.82],
		outline: [
			[0.61, 0.635],
			[0.64, 0.645],
			[0.68, 0.67],
			[0.74, 0.69],
			[0.8, 0.685],
			[0.86, 0.66],
			[0.92, 0.65],
			[0.97, 0.72],
			[0.975, 0.88],
			[0.93, 0.96],
			[0.8, 0.975],
			[0.7, 0.955],
			[0.64, 0.91],
			[0.61, 0.91],
			[0.635, 0.85],
			[0.632, 0.78],
			[0.625, 0.7],
		],
	},
	fungal: {
		center: [0.175, 0.46],
		outline: [
			[0.075, 0.33],
			[0.17, 0.335],
			[0.25, 0.335],
			[0.3, 0.31],
			[0.335, 0.335],
			[0.33, 0.38],
			[0.335, 0.45],
			[0.34, 0.55],
			[0.3, 0.585],
			[0.24, 0.6],
			[0.16, 0.6],
			[0.1, 0.595],
			[0.06, 0.55],
			[0.045, 0.47],
			[0.055, 0.38],
		],
	},
	ruins: {
		center: [0.175, 0.21],
		outline: [
			[0.1, 0.12],
			[0.14, 0.08],
			[0.2, 0.07],
			[0.26, 0.08],
			[0.285, 0.1],
			[0.285, 0.22],
			[0.3, 0.31],
			[0.25, 0.335],
			[0.17, 0.335],
			[0.075, 0.33],
			[0.07, 0.2],
		],
	},
	void: {
		center: [0.915, 0.18],
		outline: [
			[0.845, 0.05],
			[0.9, 0.03],
			[0.965, 0.04],
			[0.99, 0.15],
			[0.97, 0.28],
			[0.91, 0.32],
			[0.855, 0.28],
			[0.845, 0.18],
		],
	},
};

/** Hộp bao (0–1) của đường bao vùng: [x0, y0, x1, y1]. */
export function placeBox(outline: readonly Pt[]): [number, number, number, number] {
	const xs = outline.map((p) => p[0]);
	const ys = outline.map((p) => p[1]);
	return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}

/** Điểm (x, y) nằm trong đa giác (tia ngang, chẵn–lẻ). */
export function inPolygon(x: number, y: number, poly: readonly Pt[]): boolean {
	let inside = false;
	for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
		const [xi, yi] = poly[i]!;
		const [xj, yj] = poly[j]!;
		if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
	}
	return inside;
}

/** Vùng chứa điểm (0–1 theo ảnh); null = biển / ngoài mọi vùng. Ranh chung của hai vùng: vùng khai trước thắng. */
export function placeAt(x: number, y: number): string | null {
	for (const [id, p] of Object.entries(CONTINENT_PLACES)) if (inPolygon(x, y, p.outline)) return id;
	return null;
}

/**
 * Đường SVG / CSS `clip-path: path()` của nhiều vùng gộp làm MỘT đường (mỗi vùng một nét con) ở cỡ `w`×`h` px: ranh chung của
 * hai vùng đi ngược chiều nhau nên triệt tiêu khi tô — không lộ đường khe mảnh như khi xếp chồng từng vùng một.
 */
export function outlinePath(ids: readonly string[], w: number, h: number): string {
	return ids
		.map((id) => CONTINENT_PLACES[id]?.outline)
		.filter((o): o is readonly Pt[] => !!o)
		.map((o) => `M${o.map(([x, y]) => `${+(x * w).toFixed(1)} ${+(y * h).toFixed(1)}`).join('L')}Z`)
		.join('');
}

// ---- Trạng thái vùng (thẻ nhỏ trên tầng Thế giới) ----------------------------------------------------------------

export type RegionStatus =
	| { kind: 'here' }
	| { kind: 'open' }
	/** Đủ map nhưng cổng đóng: cấp cần (+ đã đủ chưa), boss chúa vùng trước (+ đã hạ chưa). */
	| { kind: 'locked'; level: number; levelOk: boolean; chief: string | null; chiefOk: boolean }
	| { kind: 'building' };

/** Đang ở / đã mở / cần cấp + boss / đang xây dựng — cùng luật với cổng vùng (`regionGate`). */
export function regionStatus(id: string, here: string, ctx: GateCtx): RegionStatus {
	if (id === here) return { kind: 'here' };
	const r = regionDef(id);
	if (!r?.ready) return { kind: 'building' };
	if (!regionGate(id, ctx)) return { kind: 'open' };
	const need = regionNeeds(id);
	return {
		kind: 'locked',
		level: need?.level ?? r.levels[0],
		levelOk: ctx.level >= (need?.level ?? r.levels[0]),
		chief: need?.chief?.name ?? null,
		chiefOk: !need?.chief || (ctx.bossKills[need.chief.id] ?? 0) > 0,
	};
}

/** Một dòng trạng thái cho thẻ vùng. */
export function statusText(s: RegionStatus): string {
	switch (s.kind) {
		case 'here':
			return 'Bạn đang ở đây';
		case 'open':
			return 'Đã mở';
		case 'building':
			return 'Đang xây dựng';
		case 'locked':
			return `Cần cấp ${s.level}${s.chief ? ` + hạ ${s.chief}` : ''}`;
	}
}

// ---- Tầng Vùng: sơ đồ các map ------------------------------------------------------------------------------------

export interface RegionLayout {
	/** Ô (cột, hàng) của từng map trên sơ đồ — bắc ở trên, đông bên phải; được dùng nửa ô (0.5) để tránh đường nối cắt nhau. */
	nodes: Readonly<Record<string, Pt>>;
}

/**
 * Sơ đồ vùng 1 (12 map — docs/thiet-ke/vung1-12-map.md mục Đồ thị lối). Lối thật không "phẳng" (Đá Phong Ấn và Luỹ cùng ở mép bắc
 * Mossvale, Đồi Xương lại ở đông Nghĩa địa) nên sơ đồ xếp lệch: Đồi Xương lên hàng trên, Luỹ sang cột 3 — mọi lối vẫn đúng hướng
 * (test). Map mới của vùng thêm vào đây; vùng chưa khai sơ đồ thì tầng Vùng xếp map theo hàng.
 */
export const REGION_LAYOUTS: Readonly<Record<string, RegionLayout>> = {
	human: {
		nodes: {
			gargoyle_cave: [0.5, 0],
			cliffs: [1, 1],
			bonehills: [2, 1],
			nameless: [0, 2],
			graveyard: [1, 2],
			shrine: [2, 2],
			oldfort: [3, 2],
			town: [1, 3],
			mossvale: [2, 3],
			riverflats: [1, 4],
			mossrift: [2, 4],
			rivergate: [1, 5],
		},
	},
};

type MapData = WorldIndexData['maps'][string];

/** Mép map của một lối (lối là dải 1 ô sát mép — `world.json` chỉ ghi tâm dải). */
export function exitEdge(m: Pick<MapData, 'width' | 'height'>, e: { x: number; y: number }): Edge {
	const d = [
		['W', e.x],
		['E', m.width - e.x],
		['N', e.y],
		['S', m.height - e.y],
	] as const;
	return d.reduce((a, b) => (b[1] < a[1] ? b : a))[0];
}

/** Khoảng cấp quái thường của map: `levels` của pipeline, map cũ chưa khai cấp khu thì lấy cấp gốc của loại quái; null = map an toàn. */
export function mapLevels(m: Pick<MapData, 'levels' | 'zones'>): [number, number] | null {
	if (m.levels) return [m.levels[0], m.levels[1]];
	const lv = m.zones.flatMap((z) => z.monsters.filter((t) => !t.startsWith('boss_')).map((t) => enemyLevel(t, z.level))).filter((n): n is number => n !== null);
	return lv.length ? [Math.min(...lv), Math.max(...lv)] : null;
}

/** Boss của map: boss khu (hang ổ trong khu quái) + boss chúa của thánh địa (`boss`). */
export function mapBosses(m: Pick<MapData, 'zones' | 'boss'>): string[] {
	const out = m.zones.flatMap((z) => z.monsters.filter((t) => t.startsWith('boss_')));
	if (m.boss && !out.includes(m.boss)) out.push(m.boss);
	return out;
}

export interface GraphNode {
	id: string;
	name: string;
	col: number;
	row: number;
	levels: [number, number] | null;
	bosses: string[];
	/** Map trạm của vùng (cột dịch chuyển, không quái). */
	hub: boolean;
}

export interface GraphGate {
	/** Map trong vùng có lối sang vùng khác. */
	from: string;
	/** Vùng đích + id đầy đủ của map đích (`swamp/hub`). */
	region: string;
	to: string;
	edge: Edge;
	/** Ô của nút cổng: lệch một ô khỏi map theo mép của lối. */
	col: number;
	row: number;
}

export interface RegionGraph {
	nodes: GraphNode[];
	/** Cặp map nối nhau (không trùng chiều). */
	links: [string, string][];
	gates: GraphGate[];
	cols: number;
	rows: number;
	/** Cột / hàng nhỏ nhất (cổng có thể lệch ra ngoài lưới map). */
	col0: number;
	row0: number;
}

/**
 * Sơ đồ một vùng từ `world.json` + ô khai tay. Map chưa có ô (vùng chưa khai sơ đồ / map mới quên khai) xếp nối đuôi thành hàng
 * dưới cùng để vẫn hiện đủ.
 */
export function regionGraph(data: WorldIndexData, layout: RegionLayout | undefined = REGION_LAYOUTS[data.region]): RegionGraph {
	const ids = Object.keys(data.maps);
	const placed = layout?.nodes ?? {};
	const known = ids.filter((id) => placed[id]);
	const lastRow = known.length ? Math.max(...known.map((id) => placed[id]![1])) + 1 : 0;
	const perRow = 4;
	let spill = 0;
	const hub = regionDef(data.region)?.hub;
	const nodes: GraphNode[] = ids.map((id) => {
		const m = data.maps[id]!;
		let at = placed[id];
		if (!at) {
			at = [spill % perRow, lastRow + Math.floor(spill / perRow)];
			spill += 1;
		}
		return { id, name: m.name, col: at[0], row: at[1], levels: mapLevels(m), bosses: mapBosses(m), hub: id === hub };
	});
	const byId = new Map(nodes.map((n) => [n.id, n]));
	const seen = new Set<string>();
	const links: [string, string][] = [];
	const gates: GraphGate[] = [];
	for (const id of ids) {
		const m = data.maps[id]!;
		for (const e of m.exits) {
			const { region, map } = splitMapKey(e.to, data.region);
			if (region !== data.region) {
				const from = byId.get(id)!;
				const edge = exitEdge(m, e);
				const d = EDGE_DIR[edge];
				gates.push({ from: id, region, to: `${region}/${map}`, edge, col: from.col + d.x, row: from.row + d.y });
				continue;
			}
			if (!byId.has(map)) continue;
			const key = [id, map].sort().join('|');
			if (seen.has(key)) continue;
			seen.add(key);
			links.push([id, map]);
		}
	}
	const cols = [...nodes.map((n) => n.col), ...gates.map((g) => g.col)];
	const rows = [...nodes.map((n) => n.row), ...gates.map((g) => g.row)];
	const col0 = Math.min(...cols);
	const row0 = Math.min(...rows);
	return { nodes, links, gates, col0, row0, cols: Math.max(...cols) - col0 + 1, rows: Math.max(...rows) - row0 + 1 };
}

/** Tên vùng theo id (cổng sang vùng khác trên sơ đồ). */
export function regionName(id: string): string {
	return REGIONS.find((r) => r.id === id)?.name ?? id;
}

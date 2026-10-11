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
export const CONTINENT = { url: '/assets/ui/world-continent.png', width: CONTINENT_SIZE.width, height: CONTINENT_SIZE.height } as const;

import { CONTINENT_PLACES, CONTINENT_SIZE, REGION_LAYOUTS, type ContinentPlace, type Pt, type RegionLayout } from '@aether/sim/worldAtlas';

export { CONTINENT_PLACES, REGION_LAYOUTS, type ContinentPlace, type Pt, type RegionLayout };

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

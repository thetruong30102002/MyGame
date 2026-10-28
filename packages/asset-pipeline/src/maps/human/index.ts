import type { PropMeta } from '../../props/buildProps.js';
import { TILE, WAYSTONE_SPOT, type Edge, type MapData } from './common.js';
import { buildBonehills } from './bonehills.js';
import { buildCliffs } from './cliffs.js';
import { buildGargoyleCave } from './gargoyle_cave.js';
import { buildGraveyard } from './graveyard.js';
import { buildMossrift } from './mossrift.js';
import { buildMossvale } from './mossvale.js';
import { buildNameless } from './nameless.js';
import { buildOldfort } from './oldfort.js';
import { buildRiverflats } from './riverflats.js';
import { buildRivergate } from './rivergate.js';
import { buildShrine } from './shrine.js';
import { buildTown } from './town.js';

export type { MapData, MapExit, MonsterZone } from './common.js';

/** Khoảng cấp của vùng human — khớp `levels` của vùng `human` ở `@havenlord/sim/regions` (pipeline không phụ thuộc gói sim). */
export const HUMAN_LEVELS: readonly [number, number] = [1, 10];
/** Tuổi bắt đầu có quái dùng chung — khớp `SHARED_MIN_AGE` của `@havenlord/sim/mobs`: khu bắt đầu sớm hơn là khu tuổi thơ. */
const ADULT_AGE = 16;
/** Tâm bầy quái thường phải cách ô nước gần nhất ít nhất chừng này ô (quái đuổi thẳng, đứng sau nước là kẹt bên bờ). */
export const MIN_WATER_GAP = 6;
const OPPOSITE: Record<Edge, Edge> = { N: 'S', S: 'N', E: 'W', W: 'E' };

/**
 * Chỉ mục thế giới của một vùng (`assets/maps/<vùng>/world.json`): map nào có địa điểm / vùng quái / hình nộm / boss
 * nào và lối sang đâu. Game dùng để dẫn đường nhiệm vụ xuyên map (mục tiêu ở map khác → đi tới lối sang map đó).
 */
export interface WorldIndex {
	region: string;
	/** Map vào game lần đầu. */
	start: string;
	maps: Record<
		string,
		{
			name: string;
			width: number;
			height: number;
			exits: { id: string; to: string; x: number; y: number; label: string }[];
			spots: string[];
			/** `level`: cấp quái của khu (vắng = chỉ số gốc của loại). */
			zones: { id: string; monsters: string[]; level?: number }[];
			dummies: string[];
			boss: string | null;
			/** Khoảng cấp quái [thấp, cao] tính từ các khu có khai `level`; map an toàn / map chỉ dùng chỉ số gốc thì vắng. */
			levels?: [number, number];
		}
	>;
}

/**
 * Vùng 1 Thistlewood — 12 map (thiết kế chốt 10/10/2026: `docs/thiet-ke/vung1-12-map.md`): 1 trạm, 10 map săn, 1 thánh địa.
 * Sáu map đầu giữ nguyên thứ tự + hạt giống cũ; sáu map mới hạt giống 20261201–20261206. Lối MỚI của map cũ khai ở CUỐI mảng
 * `exits` (dẫn đường nhiệm vụ đi lối khai trước — town ↔ mossvale vẫn một bước).
 */
export function buildHumanRegion(meta: Record<string, PropMeta>, decalIds: string[]): { maps: MapData[]; index: WorldIndex } {
	const maps = [
		buildTown(meta, decalIds),
		buildMossvale(meta, decalIds),
		buildShrine(meta, decalIds),
		buildGraveyard(meta, decalIds),
		buildBonehills(meta, decalIds),
		buildCliffs(meta, decalIds),
		buildRiverflats(meta, decalIds, 20261201),
		buildMossrift(meta, decalIds, 20261202),
		buildNameless(meta, decalIds, 20261203),
		buildOldfort(meta, decalIds, 20261204),
		buildGargoyleCave(meta, decalIds, 20261205),
		buildRivergate(meta, decalIds, 20261206),
	];
	const problems = validateRegion(maps);
	if (problems.length) throw new Error(`Map vùng human sai:\n  - ${problems.join('\n  - ')}`);
	return { maps, index: worldIndex('human', 'town', maps) };
}

/** Chỉ mục `world.json` của một vùng từ các map đã dựng (dùng chung vùng 1 và bộ dựng `maps/kit`). */
export function worldIndex(region: string, start: string, maps: MapData[]): WorldIndex {
	return {
		region,
		start,
		maps: Object.fromEntries(
			maps.map((m) => {
				const levels = m.monsterZones.flatMap((z) => (z.level === undefined ? [] : [z.level]));
				return [
					m.id,
					{
						name: m.name,
						width: m.width * m.tileSize,
						height: m.height * m.tileSize,
						exits: m.exits.map((e) => ({ id: e.id, to: e.to, x: Math.round((e.x0 + e.x1) / 2), y: Math.round((e.y0 + e.y1) / 2), label: e.label })),
						spots: m.spots.map((s) => s.id),
						zones: m.monsterZones.map((z) => ({ id: z.id, monsters: z.monsters, ...(z.level === undefined ? {} : { level: z.level }) })),
						dummies: m.dummies.map((d) => d.id),
						boss: m.boss?.characterId ?? null,
						...(levels.length ? { levels: [Math.min(...levels), Math.max(...levels)] as [number, number] } : {}),
					},
				];
			}),
		),
	};
}

/** Các lối sang vùng khác của một vùng (`from` = id đầy đủ map nguồn) — để kiểm chéo khi dựng vùng đích. */
export function crossRegionExits(region: string, maps: MapData[]): { from: string; to: string; toSpot: string }[] {
	return maps.flatMap((m) => m.exits.filter((e) => e.to.includes('/')).map((e) => ({ from: `${region}/${m.id}`, to: e.to, toSpot: e.toSpot })));
}

/**
 * Luật của vùng: trả danh sách lỗi (rỗng = đạt). Tách riêng để test gọi trực tiếp. `levels`: khoảng cấp của vùng — `level` của
 * mọi khu quái phải nằm trong đó.
 */
export function validateRegion(maps: MapData[], levels: readonly [number, number] = HUMAN_LEVELS): string[] {
	const out: string[] = [];
	const byId = new Map(maps.map((m) => [m.id, m]));
	const seen = new Map<string, string>();
	const unique = (kind: string, id: string, map: string): void => {
		const key = `${kind}:${id}`;
		const prev = seen.get(key);
		if (prev) out.push(`${kind} "${id}" trùng ở ${prev} và ${map} (game tìm theo id trên MỌI map)`);
		else seen.set(key, map);
	};
	const walkable = (m: MapData, x: number, y: number): boolean => {
		const t = m.terrain[Math.floor(y / m.tileSize)]?.[Math.floor(x / m.tileSize)];
		return !!t && t !== 'w' && t !== '#';
	};
	for (const m of maps) {
		const types = new Set(m.monsterZones.filter((z) => !z.boss).flatMap((z) => z.monsters));
		if (types.size > 1) out.push(`${m.id}: ${types.size} loại quái (${[...types].join(', ')}) — mỗi map chỉ một loại`);
		// Cột dịch chuyển: mọi map có địa điểm `waystone` (NPC cột của vùng đứng ở map nào có) — id này được trùng.
		for (const s of m.spots) if (s.id !== WAYSTONE_SPOT) unique('địa điểm', s.id, m.id);
		if (!m.spots.some((s) => s.id === WAYSTONE_SPOT)) out.push(`${m.id}: thiếu địa điểm ${WAYSTONE_SPOT} (cột dịch chuyển)`);
		for (const z of m.monsterZones) unique('vùng quái', z.id, m.id);
		for (const d of m.dummies) unique('hình nộm', d.id, m.id);
		for (const s of m.spots) if (!walkable(m, s.x, s.y)) out.push(`${m.id}: địa điểm ${s.id} nằm trên nước/ngoài map`);
		// Thiết kế 12 map vùng 1 (10/10/2026): cấp của khu trong khoảng cấp vùng; tâm bầy cách nước ≥ MIN_WATER_GAP ô; khu tuổi
		// thơ (bắt đầu trước 16 tuổi, tự sinh) phải hết trước tuổi 16 — người lớn không thấy bầy cấp thấp, EXP không bị chặn nhầm.
		const water: [number, number][] = [];
		m.terrain.forEach((row, ty) => [...row].forEach((c, tx) => c === 'w' && water.push([tx, ty])));
		for (const z of m.monsterZones) {
			if (z.level !== undefined && !(Number.isInteger(z.level) && z.level >= levels[0] && z.level <= levels[1]))
				out.push(`${m.id}: khu ${z.id} cấp ${z.level} ngoài khoảng cấp vùng ${levels[0]}–${levels[1]}`);
			if (!z.boss && water.length) {
				const tx = (z.x - TILE / 2) / TILE;
				const ty = (z.y - TILE / 2) / TILE;
				const gap = water.reduce((best, [x, y]) => Math.min(best, Math.hypot(x - tx, y - ty)), Infinity);
				if (gap < MIN_WATER_GAP) out.push(`${m.id}: tâm bầy ${z.id} cách nước ${gap.toFixed(1)} ô (< ${MIN_WATER_GAP}) — quái kẹt bên bờ`);
			}
			if (!z.onDemand && (z.fromAge ?? 0) < ADULT_AGE && !(z.untilAge !== undefined && z.untilAge < ADULT_AGE))
				out.push(`${m.id}: khu tuổi thơ ${z.id} (từ ${z.fromAge ?? 0} tuổi) thiếu untilAge ≤ ${ADULT_AGE - 1}`);
			if (z.untilAge !== undefined && z.untilAge < (z.fromAge ?? 0)) out.push(`${m.id}: khu ${z.id} untilAge ${z.untilAge} < fromAge ${z.fromAge ?? 0} — không bao giờ sinh`);
		}
		for (const e of m.exits) {
			const W = m.width * m.tileSize;
			const H = m.height * m.tileSize;
			if (e.x0 < 0 || e.y0 < 0 || e.x1 > W || e.y1 > H) out.push(`${m.id}: lối ${e.id} ra ngoài map`);
			// Lối sang VÙNG KHÁC (`to` = `vùng/map`, khung nhiều vùng): map đích + điểm đến + lối quay về thuộc vùng kia — kiểm
			// khi dựng vùng đó (`crossRegionExits`), ở đây chỉ kiểm dạng id.
			if (e.to.includes('/')) {
				if (!/^[a-z0-9_]+\/[a-z0-9_]+$/.test(e.to)) out.push(`${m.id}: lối ${e.id} tới "${e.to}" sai dạng vùng/map`);
				continue;
			}
			const t = byId.get(e.to);
			if (!t) {
				out.push(`${m.id}: lối ${e.id} dẫn tới map "${e.to}" không có`);
				continue;
			}
			const s = t.spots.find((p) => p.id === e.toSpot);
			if (!s) out.push(`${m.id}: lối ${e.id} tới ${e.to}#${e.toSpot} — map đích không có địa điểm đó`);
			else {
				if (!walkable(t, s.x, s.y)) out.push(`${e.to}: điểm đến ${e.toSpot} nằm trên nước`);
				// Đứng ngay trong dải lối của map đích thì vừa tới đã bị đẩy về — nhảy qua lại mãi.
				for (const back of t.exits) if (s.x >= back.x0 && s.x < back.x1 && s.y >= back.y0 && s.y < back.y1) out.push(`${e.to}: điểm đến ${e.toSpot} nằm trong lối ${back.id}`);
			}
			const backs = t.exits.filter((b) => b.to === m.id || b.to.endsWith(`/${m.id}`));
			if (!backs.length) out.push(`${e.to}: không có lối quay về ${m.id}`);
			// Đi qua mép nào thì sang map kia ở mép ĐỐI DIỆN (ra mép bắc → vào từ mép nam), lối về cũng vậy.
			else if (!backs.some((b) => b.edge === OPPOSITE[e.edge])) out.push(`${m.id}: lối ${e.id} ở mép ${e.edge} nhưng lối về từ ${e.to} không ở mép ${OPPOSITE[e.edge]}`);
		}
	}
	return out;
}

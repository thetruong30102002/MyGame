import type { PropMeta } from '../../props/buildProps.js';
import type { MapData } from './common.js';
import { buildBonehills } from './bonehills.js';
import { buildCliffs } from './cliffs.js';
import { buildGraveyard } from './graveyard.js';
import { buildMossvale } from './mossvale.js';
import { buildShrine } from './shrine.js';
import { buildTown } from './town.js';

export type { MapData, MapExit, MonsterZone } from './common.js';

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
			zones: { id: string; monsters: string[] }[];
			dummies: string[];
			boss: string | null;
		}
	>;
}

export function buildHumanRegion(meta: Record<string, PropMeta>, decalIds: string[]): { maps: MapData[]; index: WorldIndex } {
	const maps = [
		buildTown(meta, decalIds),
		buildMossvale(meta, decalIds),
		buildShrine(meta, decalIds),
		buildGraveyard(meta, decalIds),
		buildBonehills(meta, decalIds),
		buildCliffs(meta, decalIds),
	];
	const problems = validateRegion(maps);
	if (problems.length) throw new Error(`Map vùng human sai:\n  - ${problems.join('\n  - ')}`);
	const index: WorldIndex = {
		region: 'human',
		start: 'town',
		maps: Object.fromEntries(
			maps.map((m) => [
				m.id,
				{
					name: m.name,
					width: m.width * m.tileSize,
					height: m.height * m.tileSize,
					exits: m.exits.map((e) => ({ id: e.id, to: e.to, x: Math.round((e.x0 + e.x1) / 2), y: Math.round((e.y0 + e.y1) / 2), label: e.label })),
					spots: m.spots.map((s) => s.id),
					zones: m.monsterZones.map((z) => ({ id: z.id, monsters: z.monsters })),
					dummies: m.dummies.map((d) => d.id),
					boss: m.boss?.characterId ?? null,
				},
			]),
		),
	};
	return { maps, index };
}

/** Luật của vùng: trả danh sách lỗi (rỗng = đạt). Tách riêng để test gọi trực tiếp. */
export function validateRegion(maps: MapData[]): string[] {
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
		return !!t && t !== 'w';
	};
	for (const m of maps) {
		const types = new Set(m.monsterZones.filter((z) => !z.boss).flatMap((z) => z.monsters));
		if (types.size > 1) out.push(`${m.id}: ${types.size} loại quái (${[...types].join(', ')}) — mỗi map chỉ một loại`);
		for (const s of m.spots) unique('địa điểm', s.id, m.id);
		for (const z of m.monsterZones) unique('vùng quái', z.id, m.id);
		for (const d of m.dummies) unique('hình nộm', d.id, m.id);
		for (const s of m.spots) if (!walkable(m, s.x, s.y)) out.push(`${m.id}: địa điểm ${s.id} nằm trên nước/ngoài map`);
		for (const e of m.exits) {
			const W = m.width * m.tileSize;
			const H = m.height * m.tileSize;
			if (e.x0 < 0 || e.y0 < 0 || e.x1 > W || e.y1 > H) out.push(`${m.id}: lối ${e.id} ra ngoài map`);
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
			if (!t.exits.some((b) => b.to === m.id)) out.push(`${e.to}: không có lối quay về ${m.id}`);
		}
	}
	return out;
}

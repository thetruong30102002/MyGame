// Nạp cả vùng `human` cho test node: chỉ mục thế giới + từng map + va chạm + lưới tìm đường — đúng dữ liệu game đọc.
import { readFileSync } from 'node:fs';
import { buildSolids, isBlocked, type CollisionMap, type PropFootprint } from '../src/game/world/collision';
import type { MapExit } from '../src/game/world/exits';
import { NavGrid, type Point } from '../src/game/world/NavGrid';
import { WorldIndex, type WorldIndexData } from '../src/game/world/WorldIndex';

export const read = <T>(file: string): T => JSON.parse(readFileSync(new URL(`../public/assets/maps/human/${file}`, import.meta.url), 'utf8')) as T;

export type RegionMap = CollisionMap & {
	id: string;
	name: string;
	spawn: Point;
	spots: { id: string; name: string; x: number; y: number; r: number }[];
	dummies: { id: string; x: number; y: number }[];
	monsterZones: { id: string; name: string; x: number; y: number; radius: number; monsters: string[]; count: number; onDemand?: boolean; fromAge?: number; boss?: boolean }[];
	boss: { characterId: string; x: number; y: number; radius: number } | null;
	exits: MapExit[];
};

export interface LoadedMap {
	map: RegionMap;
	W: number;
	H: number;
	blocked: (x: number, y: number, rx: number, ry: number) => boolean;
	nav: () => NavGrid;
	spot: (id: string) => RegionMap['spots'][number] | undefined;
}

export const meta = read<Record<string, PropFootprint>>('props.meta.json');
export const atlas = read<{ frames: Record<string, unknown> }>('props.json');
export const index = new WorldIndex(read<WorldIndexData>('world.json'));

export const maps: Record<string, LoadedMap> = Object.fromEntries(
	Object.keys(index.data.maps).map((id) => {
		const map = read<RegionMap>(`${id}.json`);
		const solids = buildSolids(map, meta);
		const blocked = (x: number, y: number, rx: number, ry: number): boolean => isBlocked(map, solids, x, y, rx, ry);
		let nav: NavGrid | null = null;
		const W = map.width * map.tileSize;
		const H = map.height * map.tileSize;
		return [id, { map, W, H, blocked, nav: () => (nav ??= new NavGrid(W, H, blocked)), spot: (s: string) => map.spots.find((m) => m.id === s) }];
	}),
);

/** Map chứa địa điểm `id` (id địa điểm duy nhất trên cả vùng — pipeline kiểm). */
export function spotAnywhere(id: string): { mapId: string; spot: RegionMap['spots'][number] } | undefined {
	for (const [mapId, m] of Object.entries(maps)) {
		const spot = m.spot(id);
		if (spot) return { mapId, spot };
	}
	return undefined;
}

/** Chỗ người chơi đứng khi vừa vào map `to` từ map `from` (điểm đến của lối nối hai map). */
export function arrivalFrom(from: string, to: string): Point {
	const exit = maps[from]!.map.exits.find((e) => e.to === to);
	return (exit && maps[to]!.spot(exit.toSpot)) || maps[to]!.map.spawn;
}

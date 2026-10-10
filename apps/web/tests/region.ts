// Nạp cả vùng `human` cho test node: chỉ mục thế giới + từng map + va chạm + lưới tìm đường — đúng dữ liệu game đọc.
// Mặc định đọc `public/assets` (bản người chơi đang chạy). Đặt AETHER_WEB_ASSETS = thư mục nháp của lệnh dựng map (cùng biến
// asset-pipeline dùng) để kiểm map MỚI dựng trước khi chép vào public — Funnel phục vụ thẳng public.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildSolids, isBlocked, type CollisionMap, type PropFootprint } from '../src/game/world/collision';
import type { MapExit } from '../src/game/world/exits';
import { NavGrid, type Point } from '../src/game/world/NavGrid';
import { WorldIndex, type WorldIndexData } from '../src/game/world/WorldIndex';

/** Thư mục assets (có `/` cuối) — public hoặc thư mục nháp `AETHER_WEB_ASSETS`. */
export const ASSETS = process.env.AETHER_WEB_ASSETS ? pathToFileURL(`${resolve(process.env.AETHER_WEB_ASSETS)}/`) : new URL('../public/assets/', import.meta.url);

export const read = <T>(file: string): T => JSON.parse(readFileSync(new URL(`maps/human/${file}`, ASSETS), 'utf8')) as T;

export type RegionMap = CollisionMap & {
	id: string;
	name: string;
	spawn: Point;
	spots: { id: string; name: string; x: number; y: number; r: number }[];
	dummies: { id: string; x: number; y: number }[];
	monsterZones: { id: string; name: string; x: number; y: number; radius: number; monsters: string[]; count: number; onDemand?: boolean; fromAge?: number; untilAge?: number; level?: number; boss?: boolean }[];
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
	/**
	 * Điểm (px) người chơi đứng tới được bằng BƯỚC CHÂN THẬT từ điểm hồi sinh (lấp loang lưới 4px, đi trượt từng trục, hộp chân
	 * 11×5). Vùng kín chỉ để làm cảnh (lõi đá vách hang, bờ bên kia sông của Hẻm Cửa Sông) là false — thiết kế 12 map vùng 1.
	 */
	walkIn: () => (x: number, y: number) => boolean;
}

/** Bước lưới lấp loang của `walkIn` (px). */
const WALK_STEP = 4;

function walkInOf(map: RegionMap, W: number, H: number, blocked: LoadedMap['blocked']): (x: number, y: number) => boolean {
	const gw = Math.floor(W / WALK_STEP);
	const gh = Math.floor(H / WALK_STEP);
	const reach = new Uint8Array(gw * gh);
	const free = (gx: number, gy: number): boolean => !blocked(gx * WALK_STEP + WALK_STEP / 2, gy * WALK_STEP + WALK_STEP / 2, 11, 5);
	const sx = Math.floor(map.spawn.x / WALK_STEP);
	const sy = Math.floor(map.spawn.y / WALK_STEP);
	const stack: number[] = [];
	if (free(sx, sy)) {
		reach[sy * gw + sx] = 1;
		stack.push(sy * gw + sx);
	}
	while (stack.length) {
		const i = stack.pop()!;
		const x = i % gw;
		const y = (i - x) / gw;
		for (const [nx, ny] of [
			[x + 1, y],
			[x - 1, y],
			[x, y + 1],
			[x, y - 1],
		] as const) {
			if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue;
			const j = ny * gw + nx;
			if (reach[j] || !free(nx, ny)) continue;
			reach[j] = 1;
			stack.push(j);
		}
	}
	return (x, y) => {
		const gx = Math.floor(x / WALK_STEP);
		const gy = Math.floor(y / WALK_STEP);
		return gx >= 0 && gy >= 0 && gx < gw && gy < gh && reach[gy * gw + gx] === 1;
	};
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
		let walk: ((x: number, y: number) => boolean) | null = null;
		const W = map.width * map.tileSize;
		const H = map.height * map.tileSize;
		return [
			id,
			{
				map,
				W,
				H,
				blocked,
				nav: () => (nav ??= new NavGrid(W, H, blocked)),
				spot: (s: string) => map.spots.find((m) => m.id === s),
				walkIn: () => (walk ??= walkInOf(map, W, H, blocked)),
			},
		];
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

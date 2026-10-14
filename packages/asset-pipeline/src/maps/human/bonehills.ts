import type { PropMeta } from '../../props/buildProps.js';
import { decalsOf, Layout, TILE, px, type MapData, type MonsterZone } from './common.js';

/**
 * Đồi Xương Trắng — phía đông Nghĩa địa. CHỈ một loại quái: cung thủ xương (bắn xa), mỗi bãi xương một bầy nhỏ — bầy
 * 3 con vì cả bầy cùng bắn là rất rát. Nền đất chết, xương thú khổng lồ và cờ trận rách của một trận chiến xưa. Lối tây
 * về Nghĩa địa, lối đông sang Luỹ Hiệp Sĩ Cũ.
 */
export const BONEHILLS_W = 44;
export const BONEHILLS_H = 40;
const ARCHER = 'mob_skeleton_archer_001';

export function buildBonehills(meta: Record<string, PropMeta>, decalIds: string[], seed = 20261102): MapData {
	const L = new Layout(BONEHILLS_W, BONEHILLS_H, seed, meta, 'g');

	L.path([
		[0, 19],
		[12, 19],
		[12, 27],
		[26, 27],
		[26, 13],
		[38, 13],
	]);
	// Nối tiếp ra mép đông (thiết kế 12 map vùng 1, 10/10/2026): dấu chân đội hiệp sĩ dẫn về Luỹ Hiệp Sĩ Cũ của họ.
	L.path([
		[38, 13],
		[43, 13],
	]);
	// Đồi: vệt đất tối loang lổ.
	for (const [x, y, r] of [
		[8, 7, 4],
		[22, 6, 3.5],
		[36, 26, 4],
		[18, 34, 3.5],
		[39, 5, 3],
	] as const)
		L.disc(x, y, r, 'f', 'g');

	const camps = [
		{ id: 'bh_north_west', name: 'Bãi xương tây bắc', x: 8, y: 8, r: 3.5 },
		{ id: 'bh_north', name: 'Gò cờ rách', x: 22, y: 7, r: 3.5 },
		{ id: 'bh_east', name: 'Bãi xương phía đông', x: 37, y: 26, r: 3.5 },
		{ id: 'bh_south', name: 'Thung xương phía nam', x: 19, y: 34, r: 3.5 },
		{ id: 'bh_far_east', name: 'Mỏm xương đông bắc', x: 39, y: 6, r: 3 },
	];
	for (const c of camps) {
		// Mỗi bãi: một bộ xương sườn khổng lồ / sọ thú làm "trại", cờ trận cắm quanh.
		L.place(L.rand() < 0.5 ? 'ribcage' : 'beast_skull', px(c.x), px(c.y - 1), { force: true });
		L.place('war_banner', px(c.x + 2), px(c.y + 1), { force: true });
		L.place('skull_totem', px(c.x - 2), px(c.y + 1), { force: true });
		L.reserve(c.x, c.y + 1, c.r);
	}
	L.reserve(1, 19.5, 3);
	L.reserve(42.5, 13.5, 3);

	L.place('signpost', px(3), px(17) + 10, { force: true });
	L.place('signpost', px(41), px(11) + 10, { force: true });
	for (const [x, y] of [
		[14, 17],
		[24, 25],
		[30, 11],
	] as const)
		L.place('spike_barricade', px(x), px(y), { force: true });

	L.clumps(70, ['tree_dead', 'tree_dead_flip', 'dead_stump'], 5, 2.2, (id, x, y) => L.place(id, x, y, { canopy: true }));
	L.clumps(150, ['pale_rocks', 'bone_pile', 'bone_pile', 'broken_sword', 'dead_bush', 'boulder', 'beast_skull', 'rock_outcrop'], 3, 1.4, (id, x, y) => L.place(id, x, y));
	L.sprinkleDecals(decalsOf(decalIds, 'd2'), 1400);

	const zone = (c: (typeof camps)[number]): MonsterZone => ({
		id: c.id,
		name: c.name,
		x: px(c.x),
		y: px(c.y + 1),
		radius: Math.round(c.r * TILE),
		monsters: [ARCHER],
		count: 3,
		fromAge: 16,
	});

	return L.finish({
		id: 'bonehills',
		name: 'Đồi Xương Trắng',
		biome: 'deadland',
		spawn: { x: px(2), y: px(19) + 24 },
		npcs: [],
		monsterZones: camps.map(zone),
		boss: null,
		spots: [
			{ id: 'west_entry_bh', name: 'Đường về Nghĩa địa', x: px(2), y: px(19) + 24, r: 60 },
			{ id: 'east_gate_bh', name: 'Đường sang Luỹ Hiệp Sĩ', x: px(41), y: px(13) + 24, r: 60 },
		],
		dummies: [],
		areas: [{ name: 'Đồi Xương Trắng', x0: 0, y0: 0, x1: BONEHILLS_W * TILE, y1: BONEHILLS_H * TILE }],
		exits: [
			{ id: 'to_graveyard_bh', to: 'graveyard', toSpot: 'east_gate_gy', edge: 'W', ...L.exitStrip('W', 17, 22), label: 'Nghĩa địa Hoàng Hôn' },
			// Lối mới khai CUỐI mảng (thiết kế 12 map vùng 1).
			{ id: 'to_oldfort_bh', to: 'oldfort', toSpot: 'west_entry_of', edge: 'E', ...L.exitStrip('E', 11, 16), label: 'Luỹ Hiệp Sĩ Cũ · cấp 7+' },
		],
	});
}

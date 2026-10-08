import type { PropMeta } from '../../props/buildProps.js';
import { decalsOf, Layout, TILE, px, type MapData, type MonsterZone } from './common.js';

/**
 * Nghĩa địa Hoàng Hôn — phía bắc thị trấn, qua cổng bắc. CHỈ một loại quái: xác sống (zombie), mỗi khu mộ một bầy.
 * Hầm mộ giữa phía bắc là hang của boss Vua Lich. Lối nam về thị trấn, lối bắc lên Vách Gargoyle, lối đông sang Đồi
 * Xương Trắng. Nền đất chết (cỏ úa).
 */
export const GRAVEYARD_W = 46;
export const GRAVEYARD_H = 42;
const ZOMBIE = 'mob_zombie_001';
const DEAD_TREES = ['tree_dead', 'tree_dead_flip', 'tree_dead', 'tree_dead_flip', 'tree_pine_dry'] as const;
const TOMBS = ['tomb_round', 'tomb_cross', 'tomb_round', 'tomb_broken', 'grave_mound', 'tomb_cross'] as const;

export function buildGraveyard(meta: Record<string, PropMeta>, decalIds: string[], seed = 20261101): MapData {
	const L = new Layout(GRAVEYARD_W, GRAVEYARD_H, seed, meta, 'g');

	// Đường đất: cổng nam lên sân hầm mộ, nhánh đông sang Đồi Xương, nhánh bắc vòng trái hầm mộ lên Vách Gargoyle.
	L.path([
		[22, 41],
		[22, 14],
	]);
	L.path([
		[23, 20],
		[45, 20],
	]);
	L.path([
		[20, 9],
		[16, 9],
		[16, 0],
	]);
	// Sân đá trước hầm mộ.
	const crypt = { x: 23, y: 10, r: 3.6 };
	L.disc(crypt.x, crypt.y, crypt.r, 'c');
	// Vài vệt đất tối cho nền đỡ phẳng.
	for (const [x, y, r] of [
		[6, 20, 3],
		[38, 36, 3.5],
		[40, 4, 2.5],
		[30, 38, 2],
	] as const)
		L.disc(x, y, r, 'f', 'g');

	L.place('crypt', px(crypt.x), px(crypt.y - 1) + 10, { force: true });
	for (const [x, y] of [
		[20, 13],
		[26, 13],
	] as const)
		L.place('ghost_lantern', px(x), px(y), { force: true });

	// Bốn khu mộ: bia xếp hàng cách 2 ô (lệch nhẹ cho đỡ đều), hàng rào sắt chắn mép trên.
	const plots = [
		{ id: 'gy_plot_sw', name: 'Khu mộ tây nam', x0: 4, y0: 24, x1: 14, y1: 35 },
		{ id: 'gy_plot_se', name: 'Khu mộ đông nam', x0: 29, y0: 24, x1: 40, y1: 35 },
		{ id: 'gy_plot_nw', name: 'Khu mộ tây bắc', x0: 3, y0: 4, x1: 12, y1: 15 },
		{ id: 'gy_plot_ne', name: 'Khu mộ đông bắc', x0: 31, y0: 4, x1: 42, y1: 15 },
	];
	for (const p of plots) {
		for (let y = p.y0 + 1; y <= p.y1; y += 2)
			for (let x = p.x0; x <= p.x1; x += 2) {
				if (L.rand() < 0.22) continue;
				L.place(L.pick(TOMBS), px(x) + Math.round((L.rand() - 0.5) * 12), px(y));
			}
		for (let x = p.x0; x <= p.x1; x += 1.5) L.place('iron_fence', px(x), px(p.y0) - 8, { force: true });
	}

	// Giữ trống: sân hầm mộ, lối sang map khác.
	L.reserve(crypt.x, crypt.y + 1, crypt.r + 1.5);
	L.reserve(22.5, 40.5, 3);
	L.reserve(44.5, 20.5, 3);
	L.reserve(16.5, 1, 3);

	L.place('signpost', px(25), px(39), { force: true });
	L.place('signpost', px(43), px(18), { force: true });
	L.place('signpost', px(19), px(2), { force: true });
	for (const y of [16, 24, 30, 36]) L.place('ghost_lantern', px(20), px(y), { force: true });

	L.scatter(170, (x, y) => L.place(L.pick(DEAD_TREES), x, y, { canopy: true }));
	L.scatter(70, (x, y) => L.place(L.pick(['dead_bush', 'dead_bush', 'skull_pile', 'coffin', 'pale_rocks', 'skull_pile']), x, y));
	L.sprinkleDecals(decalsOf(decalIds, 'd2'), 1300);

	const zone = (p: (typeof plots)[number], count: number): MonsterZone => ({
		id: p.id,
		name: p.name,
		x: px((p.x0 + p.x1) / 2),
		y: px((p.y0 + p.y1) / 2),
		radius: Math.round(((Math.min(p.x1 - p.x0, p.y1 - p.y0) - 1) / 2) * TILE),
		monsters: [ZOMBIE],
		count,
		fromAge: 16,
	});

	return L.finish({
		id: 'graveyard',
		name: 'Nghĩa địa Hoàng Hôn',
		biome: 'deadland',
		spawn: { x: px(22) + 24, y: px(39) },
		npcs: [],
		monsterZones: [
			zone(plots[0]!, 5),
			zone(plots[1]!, 5),
			zone(plots[2]!, 4),
			zone(plots[3]!, 4),
			// Boss của vùng: Vua Lich canh hầm mộ.
			{ id: 'gy_crypt', name: 'Hầm mộ', x: px(crypt.x), y: px(crypt.y + 2), radius: 2 * TILE, monsters: ['boss_lich_001'], count: 1, fromAge: 16, boss: true },
		],
		boss: null,
		spots: [
			{ id: 'south_gate_gy', name: 'Đường về Thistlewood', x: px(22) + 24, y: px(39), r: 60 },
			{ id: 'north_gate_gy', name: 'Đường lên Vách Gargoyle', x: px(16) + 24, y: px(2), r: 60 },
			{ id: 'east_gate_gy', name: 'Đường sang Đồi Xương', x: px(43), y: px(20) + 24, r: 60 },
			{ id: 'crypt', name: 'Hầm mộ', x: px(crypt.x), y: px(crypt.y + 2), r: 120 },
		],
		dummies: [],
		areas: [
			{ name: 'Hầm mộ', x0: 18 * TILE, y0: 5 * TILE, x1: 29 * TILE, y1: 15 * TILE },
			{ name: 'Nghĩa địa Hoàng Hôn', x0: 0, y0: 0, x1: GRAVEYARD_W * TILE, y1: GRAVEYARD_H * TILE },
		],
		exits: [
			{ id: 'to_town_gy', to: 'town', toSpot: 'north_road', edge: 'S', ...L.exitStrip('S', 21, 24), label: 'Thistlewood' },
			{ id: 'to_cliffs', to: 'cliffs', toSpot: 'south_entry_cl', edge: 'N', ...L.exitStrip('N', 15, 18), label: 'Vách Gargoyle' },
			{ id: 'to_bonehills', to: 'bonehills', toSpot: 'west_entry_bh', edge: 'E', ...L.exitStrip('E', 19, 22), label: 'Đồi Xương Trắng' },
		],
	});
}

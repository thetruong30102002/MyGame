import type { PropMeta } from '../../props/buildProps.js';
import { decalsOf, Layout, TILE, px, type MapData, type MonsterZone } from './common.js';

/**
 * Vách Gargoyle — phía bắc Nghĩa địa. CHỈ một loại quái: gargoyle, mỗi gờ đá một bầy. Phế tích cổ nằm giữa một hẻm núi
 * (vách đá xếp dọc mép map), đường lát đá cũ dẫn lên quảng trường đổ nát. Nền đá.
 */
export const CLIFFS_W = 44;
export const CLIFFS_H = 40;
const GARGOYLE = 'mob_gargoyle_001';

export function buildCliffs(meta: Record<string, PropMeta>, decalIds: string[], seed = 20261103): MapData {
	const L = new Layout(CLIFFS_W, CLIFFS_H, seed, meta, 'g');

	// Đường lát đá cổ: từ lối nam lên quảng trường phế tích, rồi rẽ hai gờ đông/tây.
	L.path([
		[22, 39],
		[22, 17],
	], 2, 'c');
	const plaza = { x: 23, y: 12, r: 5 };
	L.disc(plaza.x, plaza.y, plaza.r, 'c');
	L.path([
		[18, 12],
		[8, 12],
		[8, 26],
	], 2, 'c');
	L.path([
		[28, 12],
		[36, 12],
		[36, 27],
	], 2, 'c');
	for (const [x, y, r] of [
		[10, 30, 4],
		[35, 30, 4],
		[6, 6, 3],
		[38, 5, 3],
	] as const)
		L.disc(x, y, r, 'f', 'g');

	// Hẻm núi: vách đá dọc mép trên + hai bên (ép đặt, chừa lối nam).
	for (let x = 2; x < CLIFFS_W - 1; x += 4) L.place(x % 8 === 2 ? 'cliff_rock' : 'cliff_rock_flip', px(x), px(1) + 30, { force: true });
	for (let y = 6; y < CLIFFS_H - 4; y += 5) {
		L.place('cliff_rock', px(1), px(y), { force: true });
		L.place('cliff_rock_flip', px(CLIFFS_W - 2), px(y), { force: true });
	}

	// Quảng trường phế tích: tượng gargoyle, cột đổ, chậu lửa, tấm bia khắc.
	for (const [id, x, y] of [
		['gargoyle_statue', 19, 9],
		['gargoyle_statue', 27, 9],
		['rune_tablet', 23, 7],
		['brazier', 19, 15],
		['brazier', 27, 15],
		['column_fallen', 17, 13],
		['ruin_wall', 29, 13],
	] as const)
		L.place(id, px(x), px(y), { force: true });
	L.place('ruin_arch', px(22) + 24, px(35), { force: true });
	L.place('signpost', px(25), px(37) + 10, { force: true });

	const ledges = [
		{ id: 'cl_west', name: 'Gờ đá phía tây', x: 8, y: 22, r: 3.5 },
		{ id: 'cl_east', name: 'Gờ đá phía đông', x: 36, y: 22, r: 3.5 },
		{ id: 'cl_sw', name: 'Hốc đá tây nam', x: 10, y: 31, r: 3.5 },
		{ id: 'cl_se', name: 'Hốc đá đông nam', x: 35, y: 31, r: 3.5 },
		{ id: 'cl_plaza', name: 'Quảng trường phế tích', x: plaza.x, y: plaza.y + 1, r: 3.5 },
	];
	for (const l of ledges) L.reserve(l.x, l.y, l.r - 0.5);
	L.reserve(plaza.x, plaza.y, plaza.r + 1);
	L.reserve(22.5, CLIFFS_H - 1, 3);

	L.scatter(60, (x, y) => L.place(L.pick(['tree_pine_dry', 'tree_pine_dry_flip', 'tree_dead']), x, y, { canopy: true }));
	L.scatter(150, (x, y) => L.place(L.pick(['rock_outcrop', 'rock_spire', 'boulder', 'rock_gray', 'ruin_wall', 'column_fallen', 'dead_bush', 'pale_rocks']), x, y));
	L.sprinkleDecals(decalsOf(decalIds, 'd2'), 900);

	const zone = (l: (typeof ledges)[number]): MonsterZone => ({
		id: l.id,
		name: l.name,
		x: px(l.x),
		y: px(l.y),
		radius: Math.round(l.r * TILE),
		monsters: [GARGOYLE],
		count: 4,
		fromAge: 16,
	});

	return L.finish({
		id: 'cliffs',
		name: 'Vách Gargoyle',
		biome: 'rocky',
		spawn: { x: px(22) + 24, y: px(37) },
		npcs: [],
		monsterZones: ledges.map(zone),
		boss: null,
		spots: [
			{ id: 'south_entry_cl', name: 'Đường về Nghĩa địa', x: px(22) + 24, y: px(37), r: 60 },
			{ id: 'ruin_plaza', name: 'Quảng trường phế tích', x: px(plaza.x), y: px(plaza.y + 1), r: 150 },
		],
		dummies: [],
		areas: [
			{ name: 'Quảng trường phế tích', x0: 17 * TILE, y0: 6 * TILE, x1: 30 * TILE, y1: 18 * TILE },
			{ name: 'Vách Gargoyle', x0: 0, y0: 0, x1: CLIFFS_W * TILE, y1: CLIFFS_H * TILE },
		],
		exits: [{ id: 'to_graveyard_cl', to: 'graveyard', toSpot: 'north_gate_gy', edge: 'S', ...L.exitStrip('S', 20, 25), label: 'Nghĩa địa Hoàng Hôn' }],
	});
}

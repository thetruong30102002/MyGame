import type { PropMeta } from '../../props/buildProps.js';
import { decalsOf, GROUND_PLANTS, Layout, TILE, TREES, px, type MapData } from './common.js';

/**
 * Rừng Mossvale: CHỈ một loại quái — nấm rừng — sống theo BẦY ở các khoảng trống (một con thấy người chơi là cả bầy
 * lao vào). Lối tây về thị trấn Thistlewood, lối bắc lên Đá Phong Ấn (Quỷ vương).
 */
export const MOSSVALE_W = 48;
export const MOSSVALE_H = 44;
const MUSHROOM = 'mob_mushroom_001';

export function buildMossvale(meta: Record<string, PropMeta>, decalIds: string[], seed = 20261007): MapData {
	const L = new Layout(MOSSVALE_W, MOSSVALE_H, seed, meta, 'f');

	// Đường mòn: từ mép tây vào ngã ba giữa rừng, nhánh bắc ra lối lên Đá Phong Ấn, các nhánh tới khoảng trống.
	L.path([
		[0, 21],
		[24, 21],
	]);
	L.path([
		[23, 0],
		[23, 22],
	]);
	L.path([
		[24, 22],
		[24, 27],
		[29, 27],
	]);
	L.path([
		[25, 21],
		[33, 21],
		[33, 15],
		[37, 15],
	]);
	L.path([
		[14, 22],
		[14, 34],
	]);
	L.path([
		[5, 21],
		[5, 13],
		[8, 13],
	]);
	L.path([
		[6, 22],
		[6, 25],
	]);

	// Khoảng trống cỏ: bìa rừng (nhiệm vụ 8 tuổi), Khoảng trống Mossvale (16 tuổi) và ba bãi bầy nấm.
	const clearings = {
		edge: { x: 6, y: 27, r: 3 },
		main: { x: 30, y: 31, r: 5.5 },
		east: { x: 40, y: 13, r: 4.5 },
		south: { x: 13, y: 37, r: 4.5 },
		north: { x: 9, y: 9, r: 4 },
	};
	for (const c of Object.values(clearings)) {
		L.disc(c.x, c.y, c.r, 'g', 'f');
		L.reserve(c.x, c.y, c.r + 0.8);
	}

	// Lối sang map khác + điểm nhặt nấm luôn trống cây.
	L.reserve(1, 21.5, 3);
	L.reserve(23.5, 1, 3);
	const pickupSpots: [number, number][] = [
		[17, 19],
		[20, 24],
		[27, 18],
		[36, 24],
		[17, 30],
		[26, 9],
	];
	for (const [x, y] of pickupSpots) L.reserve(x, y, 1.3);

	L.place('signpost', px(3), px(19) + 10, { force: true });
	L.place('signpost', px(26), px(2) + 10, { force: true });

	// Rừng dày: một loại cây (tán được chồng nhau, gốc cách nhau ≥ 70px), rồi đá, gốc cây, dương xỉ, bụi.
	L.scatter(1100, (x, y) => L.place(L.pick(TREES), x, y, { canopy: true }));
	L.scatter(170, (x, y) => L.place(L.pick(['rock_mossy', 'rock_gray', 'stump', 'fern', 'fern', 'bush']), x, y));
	L.scatter(60, (x, y) => (L.at(Math.floor(x / TILE), Math.floor(y / TILE)) === 'g' ? L.place(L.pick(GROUND_PLANTS), x, y) : false));

	L.sprinkleDecals(decalsOf(decalIds, 'd1'), 1500);

	const zone = (id: string, name: string, c: { x: number; y: number; r: number }, count: number, extra: { fromAge?: number; onDemand?: boolean }) => ({
		id,
		name,
		x: px(c.x),
		y: px(c.y),
		radius: Math.round((c.r - 1) * TILE),
		monsters: [MUSHROOM],
		count,
		...extra,
	});

	return L.finish({
		id: 'mossvale',
		name: 'Rừng Mossvale',
		spawn: { x: px(3), y: px(21) + 24 },
		npcs: [],
		monsterZones: [
			// Nhiệm vụ 8 tuổi: bầy nấm nhỏ vây Aldric ở bìa rừng — chỉ sinh khi nhiệm vụ gọi.
			zone('mossvale_edge', 'Bìa rừng Mossvale', clearings.edge, 3, { onDemand: true }),
			zone('mossvale_clearing', 'Khoảng trống Mossvale', clearings.main, 5, { fromAge: 16 }),
			zone('mossvale_east', 'Bãi nấm phía đông', clearings.east, 4, { fromAge: 16 }),
			zone('mossvale_south', 'Bãi nấm phía nam', clearings.south, 4, { fromAge: 16 }),
			zone('mossvale_north', 'Bãi nấm phía bắc', clearings.north, 4, { fromAge: 16 }),
		],
		boss: null,
		spots: [
			{ id: 'west_entry', name: 'Đường về Thistlewood', x: px(3), y: px(21) + 24, r: 60 },
			{ id: 'north_entry', name: 'Đường lên Đá Phong Ấn', x: px(23) + 24, y: px(3), r: 60 },
			{ id: 'forest_edge', name: 'Bìa rừng Mossvale', x: px(6), y: px(26), r: 120 },
			{ id: 'mob_clearing', name: 'Khoảng trống Mossvale', x: px(clearings.main.x), y: px(clearings.main.y), r: 170 },
			...pickupSpots.map(([tx, ty], i) => ({ id: `forest_spot_${i + 1}`, name: 'Rừng Mossvale', x: px(tx), y: px(ty), r: 40 })),
		],
		dummies: [],
		areas: [
			{ name: 'Khoảng trống Mossvale', x0: 24 * TILE, y0: 25 * TILE, x1: 37 * TILE, y1: 38 * TILE },
			{ name: 'Bìa rừng Mossvale', x0: 0, y0: 14 * TILE, x1: 12 * TILE, y1: 32 * TILE },
			{ name: 'Rừng Mossvale', x0: 0, y0: 0, x1: MOSSVALE_W * TILE, y1: MOSSVALE_H * TILE },
		],
		exits: [
			{ id: 'to_town', to: 'town', toSpot: 'east_gate', edge: 'W', ...L.exitStrip('W', 18, 24), label: 'Thistlewood' },
			{ id: 'to_shrine', to: 'shrine', toSpot: 'south_entry', edge: 'N', ...L.exitStrip('N', 20, 26), label: 'Đá Phong Ấn' },
		],
	});
}

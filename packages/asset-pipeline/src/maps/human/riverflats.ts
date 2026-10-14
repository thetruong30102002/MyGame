import type { PropMeta } from '../../props/buildProps.js';
import { decalsOf, GROUND_PLANTS, Layout, TILE, TREES, px, type MapData, type MonsterZone } from './common.js';

/**
 * Bãi Bồi Brightwater — bãi bồi hạ lưu ngay phía nam Thistlewood (thiết kế 12 map vùng 1: docs/thiet-ke/vung1-12-map.md).
 * Map TUỔI THƠ dùng chung với người lớn. CHỈ một loại quái: nấm — bào tử từ Mossvale theo sông trôi xuống mọc ở đây.
 * Hai bầy cấp 1 là khu RIÊNG của trẻ 8–15 tuổi, hai bầy cấp 3–4 dùng chung cho người 16+. Sông vào mép bắc đúng cột
 * sông của town, ra mép nam đúng cột sông của Hẻm Cửa Sông; bờ đông chỉ qua được bằng cầu gỗ hàng 14–15.
 */
export const RIVERFLATS_W = 50;
export const RIVERFLATS_H = 42;
const MUSHROOM = 'mob_mushroom_001';

export function buildRiverflats(meta: Record<string, PropMeta>, decalIds: string[], seed = 20261201): MapData {
	const L = new Layout(RIVERFLATS_W, RIVERFLATS_H, seed, meta, 'g');

	// Lòng sông cũ: dấu sông từng đổi dòng. Vẽ TRƯỚC sông để đầu nam lòng cũ không khoét vào dòng nước bây giờ.
	L.path(
		[
			[33, 3],
			[27, 10],
			[26, 18],
			[29, 26],
			[31, 31],
		],
		2,
		'd',
	);

	// Sông Brightwater rộng 3 ô: y 0 ở cột 45–47 (khớp sông của town), y 41 ở cột 30–32 (khớp Hẻm Cửa Sông).
	const riverX = (y: number): number => 45 - Math.round(0.4 * y) + Math.round(Math.sin(y / 5) * 1.2);
	for (let y = 0; y < RIVERFLATS_H; y += 1) for (let k = 0; k < 3; k += 1) L.set(riverX(y) + k, y, 'w');

	// Đường đất Bắc–Nam (cột 21–23) nối đường của town xuống Hẻm; đường ngang hàng 14–15 ra mép đông, qua sông bằng cầu gỗ.
	L.rect(21, 0, 23, RIVERFLATS_H - 1, 'd');
	for (let x = 24; x < RIVERFLATS_W; x += 1) for (let y = 14; y <= 15; y += 1) L.set(x, y, L.at(x, y) === 'w' ? 'b' : 'd');

	// Bến cũ mắc cạn trên bùn khô (sông đã dời đi), bến mới chìa ra dòng nước.
	const oldLanding = { x: 27.5, y: 18 };
	const newLanding = { x: 33, y: 24.5 };
	L.rect(27, 17, 28, 19, 'b');
	L.rect(32, 24, 34, 25, 'b');

	// BÍ MẬT Đảo Liễu: hồ kín sau hàng cây, đảo nhỏ giữa hồ, ba ô đá kê nối bờ đông ra đảo — không có đường mòn dẫn tới.
	const isle = { x: 7, y: 21 };
	L.disc(isle.x, isle.y, 4, 'w');
	L.disc(isle.x, isle.y, 1.6, 'g');
	for (let x = 9; x <= 11; x += 1) L.set(x, isle.y, 'c');

	// Khoảng cách tới ô nước gần nhất (ô) — để rải cây xa nước, đá/cỏ sát bờ.
	const waterTiles: [number, number][] = [];
	for (let y = 0; y < RIVERFLATS_H; y += 1) for (let x = 0; x < RIVERFLATS_W; x += 1) if (L.at(x, y) === 'w') waterTiles.push([x, y]);
	const waterDist = (tx: number, ty: number): number => Math.min(...waterTiles.map(([x, y]) => Math.hypot(x - tx, y - ty)));
	const bank: [number, number][] = [];
	for (let y = 0; y < RIVERFLATS_H; y += 1) for (let x = 0; x < RIVERFLATS_W; x += 1) if (L.at(x, y) === 'g' && waterDist(x, y) <= 1.5) bank.push([x, y]);

	// Vườn táo lụt (tây bắc): lưới cây còn sống, hàng dưới chỉ còn gốc (nước lũ), hàng rào cũ đã gãy giữa vườn và hồ.
	for (let y = 3, j = 0; y <= 11; y += 3, j += 1)
		for (let x = 4, i = 0; x <= 14; x += 3, i += 1) L.place((i + j) % 2 ? 'tree_autumn' : i % 2 ? 'tree_flip' : 'tree', px(x), px(y), { force: true });
	for (let x = 4; x <= 13; x += 3) L.place('stump', px(x), px(13) + 6, { force: true });
	for (const x of [4.6, 5.75, 6.9, 8.05, 9.2]) L.place('fence', Math.round(x * TILE + TILE / 2), px(16) - 4, { force: true });
	L.place('haybale', px(16), px(7), { force: true });
	L.place('haybale', px(16) + 20, px(8) + 14, { force: true });

	// Hàng cây bao quanh hồ (bắc là hàng rào vườn táo), chừa đúng MỘT khe phía đông, ngay đầu ba ô đá kê.
	for (let a = 30; a <= 330; a += 20) {
		const rad = (a * Math.PI) / 180;
		if (a > 45 && a < 135) continue;
		const r = a > 200 && a < 340 ? 5.3 : 5;
		L.place(a % 40 === 10 ? 'tree_flip' : 'tree', px(isle.x + Math.cos(rad) * r), px(isle.y - Math.sin(rad) * r) + 8, { force: true });
	}
	// Trên đảo: một cây liễu lá thu, đá rêu, dương xỉ, hoa dại.
	L.place('tree_autumn', px(isle.x), px(isle.y - 1) + 10, { force: true });
	L.place('rock_mossy', px(isle.x - 1) + 8, px(isle.y + 1) + 4, { force: true });
	L.place('fern', px(isle.x + 1) - 6, px(isle.y + 1) + 2, { force: true });
	L.place('wildflowers', px(isle.x) + 4, px(isle.y + 1) + 16, { force: true });

	// Bến sông: hàng hoá chờ thuyền, đèn hai bên đầu bến; giếng phía thấp bên kia đường.
	for (const [id, x, y] of [
		['crate', px(30), px(23) + 4],
		['crate', px(30) + 34, px(23) + 10],
		['crate', px(30) + 14, px(22) + 18],
		['barrel', px(30) - 2, px(26) + 8],
		['barrel', px(31), px(26) + 16],
		['wheelbarrow', px(29), px(25)],
		['bench', px(33), px(23) + 6],
		['lamp', px(31) + 20, px(24) + 2],
		['lamp', px(31) + 20, px(26) + 4],
	] as const)
		L.place(id, x, y, { force: true, allowRoad: true });
	// Thuyền gỗ neo cạnh đầu bến (mặt nước cột 35–36 — bến chiếm cột 34), buộc vào cọc ở góc bến (tấm C1).
	L.place('mooring_post', px(34) - 4, px(25) + 20, { force: true });
	L.place('rowboat', px(35) + 26, px(25) + 12, { force: true });
	L.place('well', px(17), px(26), { force: true });

	// Biển chỉ đường ở ba lối.
	L.place('signpost', px(25), px(2) + 10, { force: true });
	L.place('signpost', px(47), px(13) + 6, { force: true });
	L.place('signpost', px(25), px(39) + 10, { force: true });

	const herds = [
		{ id: 'rf_orchard', name: 'Vườn táo bỏ hoang', x: 9, y: 8, r: 3, count: 3, level: 1, child: true },
		{ id: 'rf_levee', name: 'Bãi cỏ ven đê', x: 12, y: 36, r: 3, count: 3, level: 1, child: true },
		{ id: 'rf_oldbed', name: 'Lòng sông cũ', x: 26, y: 22, r: 3.5, count: 4, level: 3, child: false },
		{ id: 'rf_east_bank', name: 'Bờ đông', x: 44, y: 30, r: 3, count: 4, level: 4, child: false },
	];
	// Điểm nhặt cỏ Sương Bạc (nhiệm vụ sau).
	const herbSpots: [number, number][] = [
		[5, 30],
		[16, 40],
		[18, 18],
		[46, 38],
	];

	// Giữ trống: quanh ba lối, hai bến, bốn bầy, giếng, điểm nhặt, đảo, khe vào hồ. `reserve` tính theo px / TILE nên
	// tâm ô t là t + 0,5 (cùng chỗ với `px(t)` của khu quái / địa điểm).
	const c = (t: number): number => t + 0.5;
	L.reserve(22.5, 1, 3);
	L.reserve(48.5, 15, 3);
	L.reserve(22.5, 41, 3);
	L.reserve(c(oldLanding.x), c(oldLanding.y), 2.5);
	L.reserve(c(newLanding.x), c(newLanding.y), 3);
	for (const h of herds) L.reserve(c(h.x), c(h.y), h.r + 0.3);
	L.reserve(c(17), c(26) + 0.5, 2);
	for (const [x, y] of herbSpots) L.reserve(c(x), c(y), 1.3);
	L.reserve(c(isle.x), c(isle.y), 2);
	L.reserve(13.2, c(isle.y), 1.8);
	// Lưới vườn táo + hàng gốc cây giữ thẳng hàng: không mọc thêm cây rừng trong khung vườn.
	const inOrchard = (tx: number, ty: number): boolean => tx >= 2 && tx <= 16 && ty >= 1 && ty <= 16;

	// Rải: cây (tán chồng được) chỉ ở hai rìa — x < 18 hoặc x > 42 — và cách nước ≥ 2 ô, giữa bãi để trống; bụi cỏ hoa;
	// đá / dương xỉ / bụi sát bờ.
	L.clumps(150, TREES, 6, 2.4, (id, x, y) => {
		const tx = Math.floor(x / TILE);
		const ty = Math.floor(y / TILE);
		return (tx < 18 || tx > 42) && !inOrchard(tx, ty) && waterDist(tx, ty) >= 2 ? L.place(id, x, y, { canopy: true }) : false;
	});
	L.clumps(90, GROUND_PLANTS, 4, 1.6, (id, x, y) => L.place(id, x, y));
	for (let i = 0; i < 40; i += 1) {
		const [tx, ty] = L.pick(bank);
		L.place(L.pick(['rock_mossy', 'rock_gray', 'fern', 'bush']), Math.round((tx + L.rand()) * TILE), Math.round((ty + L.rand()) * TILE));
	}

	L.sprinkleDecals(decalsOf(decalIds, 'd1'), 1300);
	// Lau sậy (tấm C1, đi xuyên) sát mép nước — rải SAU decal nên dãy ngẫu nhiên của cây / đá / decal đã có không đổi.
	for (let i = 0; i < 26; i += 1) {
		const [tx, ty] = L.pick(bank);
		L.place('reed_clump', Math.round((tx + L.rand()) * TILE), Math.round((ty + L.rand()) * TILE));
	}

	const zone = (h: (typeof herds)[number]): MonsterZone => ({
		id: h.id,
		name: h.name,
		x: px(h.x),
		y: px(h.y),
		radius: Math.round(h.r * TILE),
		monsters: [MUSHROOM],
		count: h.count,
		level: h.level,
		// Khu tuổi thơ: RIÊNG từng người (máy chủ trao EXP qua privateKill), người 16+ không thấy.
		...(h.child ? { fromAge: 8, untilAge: 15 } : { fromAge: 16 }),
	});

	return L.finish({
		id: 'riverflats',
		name: 'Bãi Bồi Brightwater',
		spawn: { x: px(22) + 24, y: px(2) },
		npcs: [],
		monsterZones: herds.map(zone),
		boss: null,
		spots: [
			{ id: 'north_entry_rf', name: 'Đường về Thistlewood', x: px(22) + 24, y: px(2), r: 60 },
			{ id: 'south_entry_rf', name: 'Đường xuống Hẻm Cửa Sông', x: px(22), y: px(39), r: 60 },
			{ id: 'east_entry_rf', name: 'Cầu sang Vết Rạn', x: px(47), y: px(14) + 24, r: 60 },
			{ id: 'old_landing', name: 'Bến sông cũ', x: px(28), y: px(18), r: 80 },
			// Chỗ bảng lựa chọn Bến sông của Chương 1.
			{ id: 'new_landing', name: 'Bến sông', x: px(32), y: px(24) + 24, r: 100 },
			{ id: 'low_well', name: 'Giếng phía thấp', x: px(17), y: px(26) + 40, r: 60 },
			...herbSpots.map(([tx, ty], i) => ({ id: `rf_herb_${i + 1}`, name: 'Bãi Sương Bạc', x: px(tx), y: px(ty), r: 40 })),
			// BÍ MẬT: không đường mòn, không mũi tên — chỉ khe giữa hàng cây quanh hồ.
			{ id: 'willow_isle', name: 'Đảo Liễu', x: px(isle.x), y: px(isle.y), r: 50 },
		],
		dummies: [],
		areas: [
			{ name: 'Vườn táo bỏ hoang', x0: 2 * TILE, y0: 1 * TILE, x1: 17 * TILE, y1: 14 * TILE },
			{ name: 'Bến sông', x0: 25 * TILE, y0: 16 * TILE, x1: 37 * TILE, y1: 28 * TILE },
			{ name: 'Bờ đông', x0: 38 * TILE, y0: 22 * TILE, x1: RIVERFLATS_W * TILE, y1: RIVERFLATS_H * TILE },
			{ name: 'Bãi Bồi Brightwater', x0: 0, y0: 0, x1: RIVERFLATS_W * TILE, y1: RIVERFLATS_H * TILE },
		],
		exits: [
			{ id: 'to_town_rf', to: 'town', toSpot: 'south_road', edge: 'N', ...L.exitStrip('N', 20, 24), label: 'Thistlewood' },
			{ id: 'to_mossrift_rf', to: 'mossrift', toSpot: 'west_entry_rv', edge: 'E', ...L.exitStrip('E', 12, 17), label: 'Vết Rạn Mossvale · cấp 5+' },
			{ id: 'to_rivergate_rf', to: 'rivergate', toSpot: 'north_entry_vg', edge: 'S', ...L.exitStrip('S', 20, 24), label: 'Hẻm Cửa Sông · cấp 9+ · đường sang vùng 2' },
		],
	});
}

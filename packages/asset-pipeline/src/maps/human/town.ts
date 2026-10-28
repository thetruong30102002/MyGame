import type { PropMeta } from '../../props/buildProps.js';
import { THISTLEWOOD_INN } from '../../props/worldArt.js';
import { decalsOf, GROUND_PLANTS, Layout, TILE, TREES, px, type MapData } from './common.js';

/**
 * Thị trấn Thistlewood + sông Brightwater: vùng AN TOÀN, không có quái. Bờ đông sông là lối sang rừng Mossvale, cổng bắc lên
 * Nghĩa địa, cổng nam xuống Bãi Bồi Brightwater (sông ra mép dưới ở cột 45–47, Bãi Bồi nhận sông đúng cột đó).
 * Toạ độ nhà/quảng trường/sông giữ như map gộp cũ (các địa điểm cốt truyện, vị trí đã lưu của người chơi không lệch).
 */
export const TOWN_W = 50;
export const TOWN_H = 52;

export function buildTown(meta: Record<string, PropMeta>, decalIds: string[], seed = 20261001): MapData {
	const L = new Layout(TOWN_W, TOWN_H, seed, meta, 'g');
	const at = (x: number, y: number): string => L.at(x, y);

	// Sông uốn lượn chảy dọc x≈43–45.
	const riverX = (y: number): number => 43 + Math.round(Math.sin(y / 6.5) * 1.6);
	for (let y = 0; y < TOWN_H; y += 1) for (let k = 0; k < 3; k += 1) L.set(riverX(y) + k, y, 'w');

	// Đường chính Đông–Tây (y 25–27) chạy tới tận mép đông (lối sang rừng), Bắc–Nam (x 21–23).
	for (let x = 1; x < TOWN_W; x += 1) for (let y = 25; y <= 27; y += 1) L.set(x, y, at(x, y) === 'w' ? 'b' : 'd');
	// Bắc–Nam chạy tới tận mép trên (lối lên Nghĩa địa Hoàng Hôn) và mép dưới (lối xuống Bãi Bồi Brightwater — thiết kế 12 map
	// vùng 1, 10/10/2026; trước dừng ở hàng TOWN_H − 3).
	for (let y = 0; y < TOWN_H; y += 1) for (let x = 21; x <= 23; x += 1) L.set(x, y, 'd');

	// Quảng trường đá cuội hình tròn quanh giao lộ.
	const plaza = { x: 22, y: 26, r: 5.5 };
	L.disc(plaza.x, plaza.y, plaza.r, 'c');

	// Công trình: mỗi nhà một bản PixelLab riêng, nhìn chính diện.
	L.place('church', px(13), px(13), { force: true });
	L.place('house_forge', px(31), px(19), { force: true });
	L.place('house', px(9), px(22), { force: true });
	L.place('house_stone', px(9), px(33), { force: true });
	L.place('house_store', px(32), px(34), { force: true });
	L.place('house_farm', px(15), px(40), { force: true });
	if (meta[THISTLEWOOD_INN.id]) {
		L.place(THISTLEWOOD_INN.id, THISTLEWOOD_INN.placement.x, THISTLEWOOD_INN.placement.y, { force: true });
		// Nhà cũ thành khu phụ cạnh lò rèn; giữ nguyên ảnh và ID, không đè dưới nhà mới.
		L.place('house_inn', THISTLEWOOD_INN.auxiliaryInn.x, THISTLEWOOD_INN.auxiliaryInn.y, { force: true });
	} else L.place('house_inn', px(35), px(10), { force: true });
	// Hình nộm rơm ("Ông Rơm") cho nhiệm vụ tập kiếm/phép: sân sau nhà Ashvale và bờ sông.
	L.place('training_dummy', px(6), px(24) + 10, { force: true });
	L.place('training_dummy', px(38), px(30) + 10, { force: true });

	// Chợ quanh quảng trường: hai kiểu quầy xen kẽ, giếng nước giữa quảng trường phía bắc giao lộ.
	L.place('well', px(22), px(23) + 6, { force: true, allowRoad: true });
	L.place('stall_fruit', px(17), px(23), { force: true, allowRoad: true });
	L.place('stall_cloth', px(27), px(23), { force: true, allowRoad: true });
	L.place('stall_cloth', px(17), px(31), { force: true, allowRoad: true });
	L.place('stall_fruit', px(27), px(31), { force: true, allowRoad: true });
	L.place('bench', px(19), px(29) + 12, { force: true, allowRoad: true });
	L.place('bench', px(25), px(29) + 12, { force: true, allowRoad: true });
	L.place('barrel', px(14), px(24), { force: true });
	L.place('barrel', px(15), px(24) + 14, { force: true });
	L.place('crate', px(30), px(23), { force: true });
	L.place('crate', px(29), px(32) + 10, { force: true });
	L.place('planter', px(11), px(23) + 8, { force: true });
	L.place('planter', px(33), px(35) + 8, { force: true });
	L.place('planter', px(36), px(11) + 8, { force: true });

	// Đèn đường dọc hai trục chính (lệch khỏi lòng đường một ô). KHÔNG ép đặt: trùng hình nộm, thùng, chậu hoa thì bỏ
	// chỗ đó (đèn x=6 từng đè lên Ông Rơm ở sân sau).
	for (const x of [4, 12, 31, 38]) L.place('lamp', px(x), px(24) + 20);
	for (const y of [8, 16, 36, 44]) L.place('lamp', px(20), px(y) + 20);

	// Trang trại tây nam: rơm, xe cút kít, hàng rào.
	L.place('haybale', px(11), px(42), { force: true });
	L.place('haybale', px(12), px(43) + 10, { force: true });
	L.place('wheelbarrow', px(18), px(42), { force: true });
	for (let x = 3; x <= 11; x += 2) L.place('fence', px(x), px(46), { force: true });

	// Bờ đông: biển chỉ đường sang rừng ngay đầu cầu; cổng bắc: biển lên nghĩa địa; cổng nam: biển xuống Bãi Bồi.
	L.place('signpost', px(47), px(24) + 4, { force: true });
	L.place('signpost', px(25), px(2) + 10, { force: true });
	L.place('signpost', px(25), px(49) + 10, { force: true });
	// Ba thùng ong nhà Ashvale (tấm C1 — cảnh "kiểm ba thùng ong" của Chương 1) ở bãi trống phía tây nhà, trên sân sau. Ép đặt
	// SAU mọi món cũ: không dời địa điểm / NPC / lối nào, chỗ này trước nay không có đồ vật nên dãy rải ngẫu nhiên không đổi.
	for (const [x, y] of [
		[px(4) + 2, px(20) + 24],
		[px(5) + 12, px(21) + 2],
		[px(6) + 30, px(20) + 24],
	] as const)
		L.place('beehive', x, y, { force: true });

	// Giữ trống: quanh quảng trường, quanh lối sang rừng / nghĩa địa / bãi bồi, quanh chỗ đứng của NPC/nhiệm vụ.
	L.reserve(plaza.x, plaza.y, plaza.r + 3);
	L.reserve(48, 26, 3);
	L.reserve(22, 1, 3);
	L.reserve(22, 50.5, 3);

	// Hàng cây hai bên đường Bắc–Nam ngoài khu chợ (cách tim đường 4 ô, 4 ô một cây, lệch nhịp với đèn) — lối vào thị trấn có hàng
	// cây rõ (chủ dự án 13/10/2026: "xếp lại cho gọn gàng và có quy tắc"). Trùng nhà / đồ cũ thì bỏ chỗ đó.
	for (const y of [4, 8, 12, 16, 37, 41, 45]) for (const x of [18, 26]) L.place(y % 8 ? 'tree' : 'tree_flip', px(x), px(y) + 20);
	// Cây quanh thị trấn thành lùm cùng loài ở các góc (một loại cây PixelLab + lật gương, lá thu).
	L.clumps(260, TREES, 5, 2.2, (id, x, y) => (x < 41 * TILE || x > 47 * TILE ? L.place(id, x, y) : false));
	// Bụi/cỏ hoa và đá bên bờ sông — tất cả cùng tấm thiên nhiên PixelLab.
	L.clumps(70, GROUND_PLANTS, 4, 1.6, (id, x, y) => (x < 41 * TILE ? L.place(id, x, y) : false));
	L.clumps(30, ['rock_gray', 'rock_mossy', 'fern', 'bush'], 3, 1.4, (id, x, y) => (x > 38 * TILE ? L.place(id, x, y) : false));

	L.sprinkleDecals(decalsOf(decalIds, 'd1'), 1400);

	return L.finish({
		id: 'town',
		name: 'Thistlewood',
		spawn: { x: px(22), y: px(28) },
		npcs: [],
		monsterZones: [],
		boss: null,
		spots: [
			{ id: 'home', name: 'Nhà Ashvale', x: px(9), y: px(22) + 30, r: 64 },
			{ id: 'backyard', name: 'Sân sau nhà Ashvale', x: px(6), y: px(24) + 40, r: 80 },
			{ id: 'plaza', name: 'Quảng trường Thistlewood', x: px(22), y: px(26), r: 150 },
			// Cột dịch chuyển góc tây nam quảng trường (đúng chỗ cũ: trước đứng ở `plaza` lệch −150, +110).
			{ id: 'waystone', name: 'Cột dịch chuyển', x: px(22) - 150, y: px(26) + 110, r: 80 },
			{ id: 'church', name: 'Nhà thờ Thistlewood', x: px(13), y: px(13) + 40, r: 90 },
			{ id: 'north_gate', name: 'Cổng bắc', x: px(22), y: px(5), r: 100 },
			{ id: 'north_road', name: 'Đường lên Nghĩa địa', x: px(22), y: px(2), r: 60 },
			{ id: 'river_bank', name: 'Bờ sông Brightwater', x: px(41), y: px(27), r: 110 },
			{ id: 'bridge', name: 'Cầu Brightwater', x: px(44), y: px(26), r: 70 },
			{ id: 'east_gate', name: 'Đường sang rừng Mossvale', x: px(46), y: px(26), r: 60 },
			{ id: 'south_road', name: 'Đường xuống Bãi Bồi', x: px(22), y: px(49), r: 60 },
			...[
				[4, 30],
				[11, 37],
				[3, 18],
				[17, 35],
			].map(([tx, ty], i) => ({ id: `herb_spot_${i + 1}`, name: 'Vườn thảo dược', x: px(tx!), y: px(ty!), r: 40 })),
		],
		dummies: [
			{ id: 'dummy_backyard', x: px(6), y: px(24) + 10 },
			{ id: 'dummy_riverside', x: px(38), y: px(30) + 10 },
		],
		areas: [
			{ name: 'Thị trấn Thistlewood', x0: 0, y0: 0, x1: 41 * TILE, y1: TOWN_H * TILE },
			{ name: 'Sông Brightwater', x0: 41 * TILE, y0: 0, x1: TOWN_W * TILE, y1: TOWN_H * TILE },
		],
		exits: [
			{ id: 'to_mossvale', to: 'mossvale', toSpot: 'west_entry', edge: 'E', ...L.exitStrip('E', 23, 29), label: 'Rừng Mossvale' },
			{ id: 'to_graveyard', to: 'graveyard', toSpot: 'south_gate_gy', edge: 'N', ...L.exitStrip('N', 20, 24), label: 'Nghĩa địa Hoàng Hôn' },
			// Lối mới khai CUỐI mảng: dẫn đường nhiệm vụ đi lối khai trước (town ↔ mossvale vẫn một bước).
			{ id: 'to_riverflats', to: 'riverflats', toSpot: 'north_entry_rf', edge: 'S', ...L.exitStrip('S', 20, 24), label: 'Bãi Bồi Brightwater' },
		],
	});
}

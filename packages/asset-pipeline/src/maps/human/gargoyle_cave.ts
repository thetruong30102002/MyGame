import type { PropMeta } from '../../props/buildProps.js';
import { decalsOf, Layout, TILE, px, type MapData, type MonsterZone } from './common.js';

/**
 * Hang Gargoyle — khe sau quảng trường phế tích của Vách Gargoyle (thiết kế 12 map vùng 1, 10/10/2026). Hang hình chữ
 * U: vào ở góc đông nam, lên chân đông (tổ dơi), vòng qua phía bắc (hồ ngầm, vòm pha lê), xuống chân tây (hành lang
 * tượng) tới Gian Đá Ghi Tên ở tây nam — nơi Gargoyle Đá, tượng canh Đoàn Ấn Ký đặt từ ba trăm năm trước, giữ danh
 * sách "những người hiến sức". "Đường hầm của Đoàn" mở ngay dưới gian, thông sang Mộ Vô Danh.
 * CHỈ một loại quái thường: dơi hang cấp 8–9, sảnh cửa không có quái. Nền 'f' là khối đá, sảnh/đường khoét ra; suối
 * ngầm chặn thật, tách hai chân chữ U nên không đi tắt giữa hai chân.
 */
export const GARGOYLE_CAVE_W = 44;
export const GARGOYLE_CAVE_H = 40;
const BAT = 'mob_cave_bat_001';
const STONE_GARGOYLE = 'boss_stone_gargoyle_001';
/** Vách hang; boulder / rock_outcrop / rock_spire (tấm R1) tự góp mặt khi có hình. */
const CAVE_ROCKS = ['stalagmite', 'cave_boulder', 'rock_pillar', 'rock_gray', 'rock_mossy', 'boulder', 'rock_outcrop', 'rock_spire'] as const;
/**
 * Lớp vách CHẶN (xem `rockMass`): chỉ đá ĐÃ có hình (CV1 + N1) để vách không thủng khi tấm R1 còn thiếu. Đá đáy phải
 * có chân rộng ≥ 32px (khe giữa hai ô < 22px = bề ngang hộp chân người chơi); đá giữa chân cao ≥ 16px.
 */
const WALL_BASE = ['cave_boulder', 'rock_mossy', 'rock_gray', 'cave_boulder'] as const;
const WALL_MID = ['stalagmite', 'rock_pillar', 'cave_boulder', 'rock_gray', 'rock_mossy', 'stalagmite'] as const;

/** Vị trí (ô) trên vòng tròn tâm (cx, cy) bán kính r, góc độ tính từ hướng đông, chiều kim đồng hồ (y hướng xuống). */
const onRing = (cx: number, cy: number, r: number, deg: number): [number, number] => [cx + Math.cos((deg * Math.PI) / 180) * r, cy + Math.sin((deg * Math.PI) / 180) * r];

/**
 * Khối đá hang. Nền 'f' vẫn đi được (va chạm chỉ có nước + chân đồ vật), chỉ rải đá ngẫu nhiên thì hở khe nên người
 * chơi lách vào giữa khối đá (đo: 895/1121 ô đá tới được) và lõi đá trông như sàn trống. Theo khoảng cách Chebyshev tới
 * ô đi được (g/d/c):
 * - cách 1 (chân vách): để trống cho đuốc / tượng / đá rải sau — mép vách lởm chởm, vẫn đi được.
 * - cách 2 (vách CHẶN): HAI tảng chồng dọc (neo giữa ô + mép dưới ô): khe dọc ≤ 8px < 10px chiều cao hộp chân, khe
 *   ngang ≤ 16px < 22px bề ngang. Đi từ chỗ khoét vào lõi đá kiểu gì cũng qua một ô cách 2, nên vòng này kín.
 * - cách ≥ 3 (lõi): mỗi ô một tảng xê dịch, cho khối đá đặc như vách chứ không lộ nền.
 * Đã đo sau khi dựng: chỉ còn 225/1121 ô đá tới được (đúng các ô chân vách).
 */
function rockMass(L: Layout): void {
	const open = (t: string): boolean => t === 'g' || t === 'd' || t === 'c';
	const dist: number[][] = L.T.map((row) => row.map((t) => (open(t) ? 0 : Infinity)));
	let frontier: [number, number][] = [];
	L.T.forEach((row, y) => row.forEach((t, x) => open(t) && frontier.push([x, y])));
	for (let d = 1; d <= 3; d += 1) {
		const next: [number, number][] = [];
		for (const [x, y] of frontier)
			for (let dy = -1; dy <= 1; dy += 1)
				for (let dx = -1; dx <= 1; dx += 1) {
					const row = dist[y + dy];
					if (!row || row[x + dx] === undefined || row[x + dx]! <= d) continue;
					row[x + dx] = d;
					next.push([x + dx, y + dy]);
				}
		frontier = next;
	}
	dist.forEach((row, y) =>
		row.forEach((d, x) => {
			if (d < 2 || L.at(x, y) !== 'f') return;
			if (d === 2) {
				const jitter = Math.round((L.rand() - 0.5) * 6);
				L.place(L.pick(WALL_MID), px(x) + jitter, px(y), { force: true });
				L.place(L.pick(WALL_BASE), px(x), px(y) + TILE / 2, { force: true });
				return;
			}
			const jx = Math.round((L.rand() - 0.5) * 20);
			const jy = Math.round((L.rand() - 0.5) * 16);
			// Món R1 chưa có hình thì thay bằng đá CV1/N1 để lõi không thủng lỗ.
			if (!L.place(L.pick(CAVE_ROCKS), px(x) + jx, px(y) + 12 + jy, { force: true })) L.place(L.pick(WALL_MID), px(x) + jx, px(y) + 12 + jy, { force: true });
		}),
	);
}

export function buildGargoyleCave(meta: Record<string, PropMeta>, decalIds: string[], seed = 20261205): MapData {
	const L = new Layout(GARGOYLE_CAVE_W, GARGOYLE_CAVE_H, seed, meta, 'f');

	// Bí mật Hốc nấm sáng khoét TRƯỚC hành lang bắc để khe rộng 1 ô không khoét mẻ mép đường.
	const grotto = { x: 18, y: 15, r: 2.5 };
	L.path(
		[
			[17, 6],
			[17, 13],
		],
		1,
		'g',
	);
	L.disc(grotto.x, grotto.y, grotto.r, 'g');

	// 1. Sảnh cửa + đường vào từ mép nam.
	L.disc(31, 35, 4.5, 'g');
	L.path(
		[
			[30, 39],
			[30, 31],
		],
		3,
	);
	// 2. Lên tổ dơi đông.
	L.path([
		[31, 31],
		[31, 28],
		[34, 28],
	]);
	const roost = { x: 34, y: 24 };
	L.disc(roost.x, roost.y, 4.5, 'g');
	// 3. Lên bắc tới sảnh Hồ ngầm; hồ nằm ở mép tây sảnh, khoét lẹm vào vách.
	L.path([
		[34, 20],
		[34, 13],
	]);
	const poolHall = { x: 30, y: 8 };
	L.disc(poolHall.x, poolHall.y, 6, 'g');
	L.disc(23, 9, 2.5, 'w');
	// 4. Hành lang bắc (đi phía bắc hồ) tới Vòm pha lê.
	L.path(
		[
			[26, 4],
			[12, 4],
		],
		3,
	);
	const dome = { x: 10, y: 6 };
	L.disc(dome.x, dome.y, 4.5, 'g');
	// 5–6. Chân tây: Hành lang tượng lát đá rồi vào gian.
	L.path(
		[
			[9, 10],
			[9, 24],
		],
		3,
		'c',
	);
	L.path(
		[
			[9, 24],
			[11, 26],
		],
		3,
		'c',
	);
	// 7. Gian Đá Ghi Tên: vành đất + sàn đá lát.
	const hall = { x: 14, y: 29 };
	L.disc(hall.x, hall.y, 5.5, 'g');
	L.disc(hall.x, hall.y, 4, 'c');
	// 8. Đường hầm của Đoàn: từ góc tây nam gian xuống mép nam.
	L.path([
		[11, 33],
		[5, 35],
		[5, 39],
	]);
	// Suối ngầm từ hồ chảy ra mép nam, chặn cứng giữa hai chân chữ U.
	L.path(
		[
			[23, 11],
			[22, 20],
			[23, 30],
			[22, 39],
		],
		2,
		'w',
	);

	// Khối đá đặt TRƯỚC đồ vật cảnh (đồ vật ép đặt sau được chồng lên, đá rải sau thì né khối đá).
	rockMass(L);

	// Vòm pha lê: pha lê xanh/tím quanh vành, chừa phía đông (hành lang bắc) và phía nam (hành lang tượng).
	[130, 154, 178, 202, 226, 250, 274, 298, 322].forEach((deg, i) => {
		const [x, y] = onRing(dome.x, dome.y, 3.7, deg);
		L.place(i % 3 === 2 ? 'crystal_purple' : 'crystal_blue', px(x), px(y), { force: true });
	});

	// Hồ ngầm: vũng nước đọng quanh bờ hồ, rêu treo trên vành bắc sảnh.
	for (const [id, x, y] of [
		['cave_puddle', 26.4, 11.2],
		['cave_puddle', 29.2, 12.6],
		['cave_puddle', 27.2, 7.8],
		['hanging_moss', 28.6, 2.9],
		['hanging_moss', 31.6, 2.6],
		['hanging_moss', 34.4, 3.9],
		['hanging_moss', 35.8, 7.4],
	] as const)
		L.place(id, px(x), px(y), { force: true });

	// Tổ dơi đông: xương dơi rải sàn, rêu treo quanh vành.
	for (const [id, x, y] of [
		['bat_bones', 32.4, 22.6],
		['bat_bones', 35.8, 23.2],
		['bat_bones', 33.2, 25.8],
		['bat_bones', 36.2, 26.4],
		['bat_bones', 31.6, 24.8],
		['bat_bones', 34.6, 21.4],
		['hanging_moss', 31.2, 20.8],
		['hanging_moss', 37.4, 21],
		['hanging_moss', 38.2, 24.4],
	] as const)
		L.place(id, px(x), px(y), { force: true });

	// Hành lang tượng: hàng tượng gargoyle hai bên lối lát đá (dơi đậu lẫn trên tượng).
	for (let y = 11; y <= 23; y += 2) {
		L.place('gargoyle_idol', px(8), px(y) + 12, { force: true });
		L.place('gargoyle_idol', px(12), px(y) + 12, { force: true });
	}

	// Gian Đá Ghi Tên: tế đàn, nửa vòng bia ghi tên phía sau (né lối vào tây bắc), sáu tượng canh quanh vành chừa hai
	// lối (hành lang tượng ở tây bắc, đường hầm ở tây nam), đuốc trên vách, nến sọ hai bên tế đàn.
	L.place('stone_altar', px(14), px(27), { force: true });
	for (const deg of [262, 281, 300, 319, 338]) {
		const [x, y] = onRing(hall.x, hall.y, 4.5, deg);
		L.place('rune_stone', px(x), px(y), { force: true });
	}
	for (const deg of [5, 35, 65, 95, 160, 190]) {
		const [x, y] = onRing(hall.x, hall.y, 5, deg);
		L.place('gargoyle_idol', px(x), px(y), { force: true });
	}
	for (const deg of [285, 345, 45, 165]) {
		const [x, y] = onRing(hall.x, hall.y, 6.3, deg);
		L.place('wall_torch', px(x), px(y), { force: true });
	}
	L.place('skull_candles', px(12.5), px(27) + 8, { force: true });
	L.place('skull_candles', px(15.5), px(27) + 8, { force: true });

	// Đường hầm: thanh chống gãy, xe goòng bỏ lại, xích sắt, hai đuốc — dấu Đoàn vừa đi qua.
	for (const [id, x, y] of [
		['broken_beam', 4.1, 36],
		['broken_beam', 4.1, 39.1],
		['broken_beam', 7.6, 39.3],
		['mine_cart', 8.7, 37.5],
		['iron_chain', 5.7, 36.6],
		['wall_torch', 4.2, 37.6],
		['wall_torch', 7.3, 38.2],
	] as const)
		L.place(id, px(x), px(y), { force: true });

	// Bí mật Hốc nấm sáng: rêu treo (đi xuyên) che miệng khe; bên trong nấm hang + pha lê tím. KHÔNG dùng mushroom_glow
	// (hình vật phẩm nhặt).
	L.place('hanging_moss', px(17), px(7) + 16, { force: true });
	for (const [id, x, y] of [
		['cave_mushrooms', 16.8, 14.6],
		['cave_mushrooms', 19.2, 14.2],
		['cave_mushrooms', 17.6, 16.6],
		['cave_mushrooms', 19.6, 16.4],
		['crystal_purple', 16.4, 16.2],
		['crystal_purple', 20, 15.2],
	] as const)
		L.place(id, px(x), px(y), { force: true });

	const herds = [
		{ id: 'gc_roost_e', name: 'Tổ dơi đông', x: roost.x, y: roost.y, r: 3.5, level: 8 },
		{ id: 'gc_pool', name: 'Hồ ngầm', x: 33, y: 7, r: 3, level: 8 },
		{ id: 'gc_crystal', name: 'Vòm pha lê', x: dome.x, y: dome.y, r: 3, level: 9 },
		{ id: 'gc_statues', name: 'Hành lang tượng', x: 10, y: 17, r: 3, level: 9 },
	];
	// Giữ trống: khe + hốc bí mật, hai lối ra, quanh điểm đến.
	for (let y = 6; y <= 13; y += 1) L.reserve(17.5, y + 0.5, 0.95);
	L.reserve(grotto.x, grotto.y, grotto.r + 0.3);
	L.reserve(31, 38.5, 3);
	L.reserve(6, 38.5, 2.5);

	L.place('signpost', px(33) + 10, px(37) + 10, { force: true });
	L.place('signpost', px(7) + 10, px(36) + 22, { force: true });

	// Đuốc trên vách dọc các lối (mỗi khoảng 6 ô): ô đá sát đường đất/đá lát, xét theo thứ tự ngẫu nhiên cố định.
	const torches: [number, number][] = [];
	const edge: [number, number][] = [];
	for (let y = 1; y < GARGOYLE_CAVE_H - 1; y += 1)
		for (let x = 1; x < GARGOYLE_CAVE_W - 1; x += 1)
			if (L.at(x, y) === 'f' && [L.at(x + 1, y), L.at(x - 1, y), L.at(x, y + 1), L.at(x, y - 1)].some((t) => t === 'd' || t === 'c')) edge.push([x, y]);
	for (let i = edge.length - 1; i > 0; i -= 1) {
		const j = Math.floor(L.rand() * (i + 1));
		[edge[i], edge[j]] = [edge[j]!, edge[i]!];
	}
	for (const [x, y] of edge) {
		if (torches.some(([tx, ty]) => Math.hypot(tx - x, ty - y) < 6)) continue;
		// Ép đặt: ô chân vách nằm ngay trước vách chặn nên hộp hình luôn chạm đá của vách.
		if (L.place('wall_torch', px(x), px(y) + 12, { force: true })) torches.push([x, y]);
	}

	// Vách hang: đá rải dày, CHỈ trên ô 'f'.
	L.scatter(1600, (x, y) => L.at(Math.floor(x / TILE), Math.floor(y / TILE)) === 'f' && L.place(L.pick(CAVE_ROCKS), x, y));
	// Decal: chỉ sỏi trên đường đất.
	L.sprinkleDecals(
		decalsOf(decalIds, 'd2').filter((d) => d.includes('pebble')),
		700,
	);

	const zone = (h: (typeof herds)[number]): MonsterZone => ({
		id: h.id,
		name: h.name,
		x: px(h.x),
		y: px(h.y),
		radius: Math.round(h.r * TILE),
		monsters: [BAT],
		count: 5,
		fromAge: 16,
		level: h.level,
	});

	return L.finish({
		id: 'gargoyle_cave',
		name: 'Hang Gargoyle',
		biome: 'rocky',
		spawn: { x: px(30) + 24, y: px(37) },
		npcs: [],
		monsterZones: [
			...herds.map(zone),
			// Boss khu: Gargoyle Đá canh Gian Đá Ghi Tên, hồi sinh theo giờ như Vua Lich (khu boss + fromAge 16).
			{ id: 'gc_hall', name: 'Gian Đá Ghi Tên', x: px(hall.x), y: px(hall.y + 1), radius: 2 * TILE, monsters: [STONE_GARGOYLE], count: 1, fromAge: 16, boss: true },
		],
		boss: null,
		spots: [
			{ id: 'south_entry_gc', name: 'Cửa hang', x: px(30) + 24, y: px(37), r: 60 },
			{ id: 'tunnel_gc', name: 'Đường hầm của Đoàn', x: px(5) + 24, y: px(37), r: 60 },
			// Chương 1 mục 6: danh sách có tên bà ngoại của mẹ.
			{ id: 'name_hall', name: 'Gian Đá Ghi Tên', x: px(hall.x), y: px(hall.y), r: 150 },
			{ id: 'brass_meter_spot', name: 'Cỗ máy đo bằng đồng', x: px(17), y: px(27) + 20, r: 50 },
			{ id: 'cave_pool', name: 'Hồ ngầm', x: px(28), y: px(9), r: 90 },
			// Bí mật: khe hẹp sau rêu treo, không có đường mòn.
			{ id: 'glow_grotto', name: 'Hốc nấm sáng', x: px(grotto.x), y: px(grotto.y), r: 50 },
		],
		dummies: [],
		areas: [
			{ name: 'Gian Đá Ghi Tên', x0: 8 * TILE, y0: 23 * TILE, x1: 20 * TILE, y1: 35 * TILE },
			{ name: 'Đường hầm của Đoàn', x0: 3 * TILE, y0: 33 * TILE, x1: 10 * TILE, y1: GARGOYLE_CAVE_H * TILE },
			{ name: 'Hồ ngầm', x0: 20 * TILE, y0: 2 * TILE, x1: 37 * TILE, y1: 14 * TILE },
			{ name: 'Hang Gargoyle', x0: 0, y0: 0, x1: GARGOYLE_CAVE_W * TILE, y1: GARGOYLE_CAVE_H * TILE },
		],
		exits: [
			{ id: 'to_cliffs_gc', to: 'cliffs', toSpot: 'north_entry_cl', edge: 'S', ...L.exitStrip('S', 28, 33), label: 'Vách Gargoyle' },
			{ id: 'to_nameless_gc', to: 'nameless', toSpot: 'north_entry_nl', edge: 'S', ...L.exitStrip('S', 3, 7), label: 'Đường hầm của Đoàn · Mộ Vô Danh' },
		],
	});
}

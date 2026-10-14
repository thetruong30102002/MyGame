import type { PropMeta } from '../../props/buildProps.js';
import { decalsOf, Layout, TILE, TREES, px, type MapData, type MonsterZone } from './common.js';

/**
 * Vết Rạn Mossvale — rừng bị rút cạn phía nam Mossvale (thiết kế 12 map vùng 1, 10/10/2026). Đây là vết rạn Quỷ vương
 * từng canh, nơi máy đo của Kiến Trúc Sư hút cạn: rừng úa dần từ ngoài vào trong (cây xanh → lá thu → trơ đất), tâm
 * là bãi đá vụn giữa vòng cột trấn cùng bộ với Đá Phong Ấn. CHỈ một loại quái: nấm "nhiễm sợi đỏ" cấp 5–6, bầy đông
 * hơn Mossvale vì nấm giòn, hạ nhanh. Bốn vết nứt toả từ tâm ra bốn vòng nấm, cũng là lối đi xuyên rừng.
 */
export const MOSSRIFT_W = 46;
export const MOSSRIFT_H = 42;
const MUSHROOM = 'mob_mushroom_001';

export function buildMossrift(meta: Record<string, PropMeta>, decalIds: string[], seed = 20261202): MapData {
	const L = new Layout(MOSSRIFT_W, MOSSRIFT_H, seed, meta, 'f');
	const heart = { x: 23, y: 21 };
	/** Khoảng cách (ô) từ điểm px tới tâm vết rạn — thước đo độ "úa" của rừng. */
	const fromHeart = (x: number, y: number): number => Math.hypot(x / TILE - (heart.x + 0.5), y / TILE - (heart.y + 0.5));

	// Đường mòn rộng 2: từ mép bắc (về Mossvale) xuống tâm, từ mép tây (về Bãi Bồi) tới vòng nấm tây nam.
	L.path([
		[22, 0],
		[22, 9],
		[23, 15],
	]);
	L.path([
		[0, 28],
		[8, 28],
		[12, 31],
	]);

	const rings = [
		{ id: 'rv_ring_nw', name: 'Vòng nấm tây bắc', x: 11, y: 9, r: 3.5, level: 5 },
		{ id: 'rv_ring_ne', name: 'Vòng nấm đông bắc', x: 35, y: 10, r: 3.5, level: 5 },
		{ id: 'rv_ring_sw', name: 'Vòng nấm tây nam', x: 11, y: 32, r: 3.5, level: 5 },
		{ id: 'rv_ring_se', name: 'Vòng nấm đông nam', x: 36, y: 32, r: 3.5, level: 6 },
	];
	const hollow = { x: 42, y: 4 };

	// Tâm vết rạn: khoảng đất trơ r7, bốn vết nứt rộng 1 toả ra bốn vòng nấm, đá vụn phủ lên chỗ các vết nứt gặp nhau.
	// Vết nứt vẽ TRƯỚC đá vụn và khoảng trống vòng nấm để nó mọc ra từ mép đống đá, tắt ở bìa vòng nấm.
	L.disc(heart.x, heart.y, 7, 'g');
	const crack = (points: [number, number][]): void => {
		// Nối ô chéo bằng một ô góc (bậc thang): vết nứt rộng 1 vẫn đi liền được, không phải lách qua góc giữa hai ô.
		for (let i = 1; i < points.length; i += 1) {
			const [ax, ay] = points[i - 1]!;
			const [bx, by] = points[i]!;
			const steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
			let prev: [number, number] | null = null;
			for (let s = 0; s <= steps; s += 1) {
				const x = Math.round(ax + ((bx - ax) * s) / steps);
				const y = Math.round(ay + ((by - ay) * s) / steps);
				L.set(x, y, 'd');
				if (prev && prev[0] !== x && prev[1] !== y) L.set(x, prev[1], 'd');
				prev = [x, y];
			}
		}
	};
	crack([
		[23, 21],
		[17, 15],
		[11, 9],
	]);
	crack([
		[23, 21],
		[29, 15],
		[35, 10],
	]);
	crack([
		[23, 21],
		[30, 27],
		[36, 32],
	]);
	crack([
		[23, 21],
		[16, 27],
		[11, 32],
	]);
	L.disc(heart.x, heart.y, 2.5, 'c');
	for (const r of rings) L.disc(r.x, r.y, 4.5, 'g');
	// Bí mật "Hốc rừng còn xanh": khoảng cỏ nhỏ kín trong rừng, không đường mòn nào dẫn tới.
	L.disc(hollow.x, hollow.y, 2, 'g');

	// Lối sang map khác, vòng nấm, lõi bầy ở tâm, hốc bí mật: không cho cây / đá rải đè lên.
	L.reserve(23, 1, 3);
	L.reserve(24, 3.5, 2.6);
	L.reserve(1, 29, 3);
	for (const r of rings) L.reserve(r.x + 0.5, r.y + 0.5, 4.8);
	L.reserve(heart.x + 0.5, heart.y + 2.5, 3.6);
	// Cửa bắc vòng cột (đường mòn vào tâm) và đoạn đường tây ngay sau lối: giữ trống cho dễ thấy đường.
	L.reserve(heart.x + 1, heart.y - 3.5, 2.2);
	L.reserve(2.5, 30.5, 3);
	L.reserve(6.5, 30.5, 2.6);
	L.reserve(hollow.x + 0.5, hollow.y + 0.5, 2.2);

	L.place('signpost', px(25), px(2) + 10, { force: true });
	L.place('signpost', px(3), px(27) + 10, { force: true });

	// Vòng cột trấn (bộ S1 của Đá Phong Ấn) quanh tâm, bán kính 5 ô, sáu cột cách nhau 60°. Tâm vòng lấy x 23,5 — trục
	// đường mòn bắc — để hai cột đầu đứng hai bên lối vào như cột cổng, không cột nào chắn đường.
	for (let k = 0; k < 6; k += 1) {
		const a = (k * Math.PI) / 3;
		L.place('pillar_broken', Math.round((heart.x + 1 + 5 * Math.cos(a)) * TILE), Math.round((heart.y + 0.5 + 5 * Math.sin(a)) * TILE) + 20, { force: true });
	}
	L.place('rune_stone', px(20), px(16), { force: true });
	L.place('rune_stone', px(27), px(16), { force: true });
	// Đèn đá lùi ra 1 ô so với bản thiết kế (21 / 26): đặt đúng cột x của hai cột đổ phía nam thì đèn chồng ngay dưới chân cột.
	L.place('stone_lantern', px(20), px(27), { force: true });
	L.place('stone_lantern', px(27), px(27), { force: true });

	// Mỗi vòng nấm: tám cụm nấm hang (không chặn) xếp tròn bán kính 3,5 ô — "vòng sợi đỏ" của Chương 1.
	for (const r of rings)
		for (let k = 0; k < 8; k += 1) {
			const a = (k * Math.PI) / 4 + Math.PI / 8;
			L.place('cave_mushrooms', Math.round((r.x + 0.5 + 3.5 * Math.cos(a)) * TILE), Math.round((r.y + 0.5 + 3.5 * Math.sin(a)) * TILE) + 16, { force: true });
		}

	// Hốc rừng còn xanh: rào kín bằng bụi / đá rêu / gốc cây, cây xanh đứng ngoài che tán, chừa đúng một khe phía tây nam.
	// Bước giữa hai món ~26px để chân chúng sát nhau theo CẢ hai trục (hộp chân người chơi 22×10 không lọt).
	const hx = hollow.x + 0.5;
	const hy = hollow.y + 0.5;
	const gapAt = (150 * Math.PI) / 180;
	const hedgeR = 2.9 * TILE;
	const hedgeN = Math.round((2 * Math.PI * hedgeR) / 26);
	for (let k = 0; k < hedgeN; k += 1) {
		const a = (k * 2 * Math.PI) / hedgeN;
		const off = Math.abs(Math.atan2(Math.sin(a - gapAt), Math.cos(a - gapAt)));
		if (off * hedgeR < 30) continue;
		L.place(['bush', 'rock_mossy', 'bush', 'stump'][k % 4]!, Math.round(hx * TILE + hedgeR * Math.cos(a)), Math.round(hy * TILE + hedgeR * Math.sin(a)) + 8, { force: true });
	}
	for (const a of [gapAt - 0.55, gapAt + 0.55, gapAt + 1.9, gapAt - 1.9, gapAt + Math.PI])
		L.place(L.pick(TREES), Math.round(hx * TILE + 3.7 * TILE * Math.cos(a)), Math.round(hy * TILE + 3.7 * TILE * Math.sin(a)) + 10, { force: true, canopy: true });
	for (const [id, dx, dy] of [
		['bush_flower', -1, -0.6],
		['bush_flower', 1.1, 0.2],
		['wildflowers', 0, 1],
		['wildflowers', -0.8, 0.9],
		['wildflowers', 0.6, -1],
	] as const)
		L.place(id, Math.round((hx + dx) * TILE), Math.round((hy + dy) * TILE) + 12, { force: true });

	// Rừng úa từ ngoài vào trong theo khoảng cách tới tâm: xa > 17 ô cây xanh, 11–17 ô lá thu, ≤ 11 ô không cây.
	L.scatter(1000, (x, y) => {
		const d = fromHeart(x, y);
		if (d <= 11) return false;
		return L.place(d > 17 ? L.pick(TREES) : 'tree_autumn', x, y, { canopy: true });
	});
	// Gần tâm: gốc cây chết, đá vụn — lấy điểm ngẫu nhiên TRONG đĩa 13 ô quanh tâm cho đủ 50 lượt ở đó.
	for (let i = 0; i < 50; i += 1) {
		const a = L.rand() * Math.PI * 2;
		const rr = Math.sqrt(L.rand()) * 13;
		const id = L.pick(['stump', 'rock_gray', 'rock_mossy']);
		L.place(id, Math.round((heart.x + 0.5 + rr * Math.cos(a)) * TILE), Math.round((heart.y + 0.5 + rr * Math.sin(a)) * TILE));
	}
	// Rìa rừng: dương xỉ, bụi, đá rêu.
	L.clumps(80, ['fern', 'bush', 'rock_mossy'], 3, 1.4, (id, x, y) => (fromHeart(x, y) > 13 ? L.place(id, x, y) : false));
	L.sprinkleDecals(decalsOf(decalIds, 'd2'), 1300);

	const zone = (c: { id: string; name: string; x: number; y: number; r: number; level: number }, count: number): MonsterZone => ({
		id: c.id,
		name: c.name,
		x: px(c.x),
		y: px(c.y),
		radius: Math.round(c.r * TILE),
		monsters: [MUSHROOM],
		count,
		fromAge: 16,
		level: c.level,
	});

	return L.finish({
		id: 'mossrift',
		name: 'Vết Rạn Mossvale',
		biome: 'deadland',
		spawn: { x: px(22) + 24, y: px(2) },
		npcs: [],
		monsterZones: [
			...rings.map((r) => zone(r, 5)),
			zone({ id: 'rv_heart', name: 'Tâm vết rạn', x: heart.x, y: heart.y + 2, r: 4, level: 6 }, 6),
		],
		boss: null,
		spots: [
			{ id: 'north_entry_rv', name: 'Đường về rừng Mossvale', x: px(22) + 24, y: px(2), r: 60 },
			{ id: 'west_entry_rv', name: 'Đường xuống Bãi Bồi', x: px(2), y: px(28) + 24, r: 60 },
			{ id: 'rift_heart', name: 'Tâm vết rạn', x: px(heart.x), y: px(heart.y), r: 150 },
			{ id: 'ward_ring', name: 'Vòng cột trấn', x: px(23), y: px(16), r: 90 },
			// Chương 1 mục 2: "hạ nấm trong 3 vòng sợi đỏ".
			...[rings[0]!, rings[1]!, rings[3]!].map((r, i) => ({ id: `red_thread_${i + 1}`, name: 'Vòng sợi đỏ', x: px(r.x), y: px(r.y), r: 90 })),
			// BÍ MẬT: không đường mòn nào dẫn tới.
			{ id: 'green_hollow', name: 'Hốc rừng còn xanh', x: px(hollow.x), y: px(hollow.y), r: 50 },
		],
		dummies: [],
		areas: [
			{ name: 'Tâm vết rạn', x0: 16 * TILE, y0: 14 * TILE, x1: 31 * TILE, y1: 29 * TILE },
			{ name: 'Hốc rừng còn xanh', x0: 39 * TILE, y0: 1 * TILE, x1: 46 * TILE, y1: 8 * TILE },
			{ name: 'Vết Rạn Mossvale', x0: 0, y0: 0, x1: MOSSRIFT_W * TILE, y1: MOSSRIFT_H * TILE },
		],
		exits: [
			{ id: 'to_mossvale_rv', to: 'mossvale', toSpot: 'south_entry_mv', edge: 'N', ...L.exitStrip('N', 20, 25), label: 'Rừng Mossvale' },
			{ id: 'to_riverflats_rv', to: 'riverflats', toSpot: 'east_entry_rf', edge: 'W', ...L.exitStrip('W', 26, 31), label: 'Bãi Bồi Brightwater' },
		],
	});
}

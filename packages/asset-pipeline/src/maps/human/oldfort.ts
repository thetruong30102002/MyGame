import type { PropMeta } from '../../props/buildProps.js';
import { decalsOf, Layout, TILE, px, type MapData, type MonsterZone } from './common.js';

/**
 * Luỹ Hiệp Sĩ Cũ — luỹ đá của đội hiệp sĩ Đoàn Ấn Ký trên sống núi phía đông Đồi Xương (thiết kế 12 map vùng 1,
 * 10/10/2026). Rào chông và tháp đều quay về phía ĐÔNG, tức phía vết rạn: họ chết khi rút về giữ thung lũng (Chương 1
 * mục 4). CHỈ một loại quái: cung thủ xương cấp 7–8, bầy nhỏ vì cả bầy cùng bắn đã rất rát. Cổng tây đón đường từ Đồi
 * Xương, đường tuần tra ngoài luỹ xuống mép nam là lối tắt qua rừng Mossvale về Thistlewood.
 */
export const OLDFORT_W = 48;
export const OLDFORT_H = 40;
const ARCHER = 'mob_skeleton_archer_001';

export function buildOldfort(meta: Record<string, PropMeta>, decalIds: string[], seed = 20261204): MapData {
	const L = new Layout(OLDFORT_W, OLDFORT_H, seed, meta, 'g');
	/** Chữ nhật tường luỹ (ô): góc là bốn tháp. */
	const fort = { x0: 17, y0: 6, x1: 39, y1: 32 };
	const outside = (x: number, y: number): boolean => {
		const tx = x / TILE;
		const ty = y / TILE;
		return tx < fort.x0 - 1 || tx > fort.x1 + 2 || ty < fort.y0 - 1 || ty > fort.y1 + 2;
	};

	// Đường tới cổng tây + đường tuần tra ngoài luỹ xuống mép nam.
	L.path([
		[0, 13],
		[17, 13],
	]);
	L.path([
		[8, 15],
		[8, 39],
	]);
	// Sân trong lát đá, lở từng mảng (đĩa cỏ ngẫu nhiên); bậc cửa ngách đông lát nối ra ngoài.
	L.rect(19, 8, 37, 30, 'c');
	for (let i = 0; i < 10; i += 1) L.disc(20 + L.rand() * 17, 9 + L.rand() * 21, 1 + L.rand(), 'g', 'c');
	L.rect(38, 18, 39, 20, 'c');
	// Đất đá tối loang lổ bên ngoài luỹ.
	for (const [x, y, r] of [
		[5, 5, 3.5],
		[12, 30, 3],
		[31, 36, 3],
		[44, 35, 3],
	] as const)
		L.disc(x, y, r, 'f', 'g');

	const packs = [
		{ id: 'of_gate', name: 'Cổng luỹ', x: 14, y: 16, r: 3, count: 3, level: 7 },
		{ id: 'of_rampart_n', name: 'Tường bắc', x: 28, y: 9, r: 3, count: 4, level: 7 },
		{ id: 'of_keep', name: 'Sân chính', x: 28, y: 19, r: 4, count: 4, level: 8 },
		{ id: 'of_rampart_s', name: 'Tường nam', x: 28, y: 29, r: 3, count: 4, level: 8 },
		{ id: 'of_tower_e', name: 'Tháp canh đông', x: 43, y: 19, r: 3, count: 3, level: 8 },
	];
	const seal = { x: 45, y: 3 };

	L.reserve(1, 14, 3);
	L.reserve(9, OLDFORT_H - 1, 3);
	for (const p of packs) L.reserve(p.x + 0.5, p.y + 0.5, p.r - 0.5);
	L.reserve(seal.x + 0.5, seal.y + 0.5, 3);
	L.reserve(43, 7.4, 1.6);

	L.place('signpost', px(3), px(12) + 10, { force: true });
	L.place('signpost', px(11), px(38) + 10, { force: true });

	// Tường luỹ: đoạn tường ép đặt mỗi 1,6 ô quanh chữ nhật, chừa cổng tây (hàng 12–15), cửa ngách đông (hàng 18–20),
	// bỏ ~15% cho ra khe vỡ. Góc để trống cho tháp.
	const wall = (x: number, y: number): void => {
		if (L.rand() < 0.15) return;
		L.place('ruin_wall', px(x), px(y), { force: true });
	};
	for (let x = fort.x0 + 2.2; x <= fort.x1 - 2.2 + 0.01; x += 1.6) {
		wall(x, fort.y0);
		wall(x, fort.y1);
	}
	// Chân đoạn tường ở mép dưới ô y + 0,5: rơi vào hàng cổng / cửa ngách thì bỏ.
	const inRows = (y: number, a: number, b: number): boolean => y + 0.5 >= a && y + 0.5 < b + 1;
	for (let y = fort.y0 + 2.2; y <= fort.y1 - 2.2 + 0.01; y += 1.6) {
		if (!inRows(y, 12, 15)) wall(fort.x0, y);
		if (!inRows(y, 18, 20)) wall(fort.x1, y);
	}
	L.place('ruin_arch', px(fort.x0), px(15), { force: true });

	// Bốn tháp góc: mỏm đá + cầu thang đá (phía trong) + chậu lửa.
	for (const [x, y] of [
		[fort.x0, fort.y0],
		[fort.x1, fort.y0],
		[fort.x0, fort.y1],
		[fort.x1, fort.y1],
	] as const) {
		const dx = x === fort.x0 ? 1 : -1;
		const dy = y === fort.y0 ? 1 : -1;
		L.place('rock_outcrop', px(x), px(y), { force: true });
		L.place('stone_stairs', px(x + dx), px(y), { force: true });
		L.place('brazier', px(x), px(y + dy), { force: true });
	}

	// Sân chính: tấm bia khắc huy hiệu bảy vòng giữa hai cờ trận; cờ đứng hai bên cổng tây phía trong; cột đổ.
	L.place('rune_tablet', px(28), px(16), { force: true });
	for (const [x, y] of [
		[26, 16],
		[30, 16],
		[20, 11],
		[20, 17],
	] as const)
		L.place('war_banner', px(x), px(y), { force: true });
	for (const [x, y] of [
		[23, 24],
		[34, 12],
		[33, 26],
	] as const)
		L.place('column_fallen', px(x), px(y), { force: true });

	// Ngoài tường ĐÔNG: hàng rào chông quay về phía vết rạn (chừa khe hàng 18–20 trước cửa ngách), kiếm gãy và xương
	// của trận rút lui rải trên dải x 41–47.
	for (let y = 8; y <= 30; y += 2) if (y < 18 || y > 20) L.place('spike_barricade', px(43), px(y), { force: true });
	for (let i = 0; i < 25; i += 1) L.place('broken_sword', px(41 + L.rand() * 6.5), px(1 + L.rand() * 37));
	for (let i = 0; i < 15; i += 1) L.place('bone_pile', px(41 + L.rand() * 6.5), px(1 + L.rand() * 37));

	// Bí mật "Mỏm nhìn Đá Phong Ấn": vòng đá kín ở góc đông bắc, góc map khép nốt phía bắc và phía đông, chừa đúng một
	// khe 1 ô ở (43,6). Bước ~20px để chân đá sát nhau theo CẢ hai trục (hộp chân người chơi 22×10 không lọt).
	const cx = (seal.x + 0.5) * TILE;
	const cy = (seal.y + 0.5) * TILE;
	const ringR = 3.6 * TILE;
	const gapAt = Math.atan2((6.5 - (seal.y + 0.5)) * TILE, (43.5 - (seal.x + 0.5)) * TILE);
	const ringN = Math.round((2 * Math.PI * ringR) / 20);
	for (let k = 0; k < ringN; k += 1) {
		const a = (k * 2 * Math.PI) / ringN;
		const x = Math.round(cx + ringR * Math.cos(a));
		const y = Math.round(cy + ringR * Math.sin(a)) + 8;
		const off = Math.abs(Math.atan2(Math.sin(a - gapAt), Math.cos(a - gapAt)));
		if (off * ringR < 44 || x > OLDFORT_W * TILE + 10 || y < 0.15 * TILE) continue;
		L.place(k % 3 === 1 ? 'pale_rocks' : 'rock_outcrop', x, y, { force: true });
	}
	L.place('rune_stone', Math.round(44.4 * TILE), Math.round(2.9 * TILE), { force: true });
	L.place('stone_lantern', Math.round(46.6 * TILE), Math.round(2.9 * TILE), { force: true });

	L.scatter(40, (x, y) => (outside(x, y) ? L.place(L.pick(['tree_pine_dry', 'tree_pine_dry_flip']), x, y, { canopy: true }) : false));
	L.scatter(80, (x, y) => (outside(x, y) ? L.place(L.pick(['boulder', 'rock_outcrop', 'pale_rocks', 'rock_spire', 'rock_gray']), x, y) : false));
	L.sprinkleDecals(decalsOf(decalIds, 'd2'), 900);

	const zone = (p: (typeof packs)[number]): MonsterZone => ({
		id: p.id,
		name: p.name,
		x: px(p.x),
		y: px(p.y),
		radius: Math.round(p.r * TILE),
		monsters: [ARCHER],
		count: p.count,
		fromAge: 16,
		level: p.level,
	});

	return L.finish({
		id: 'oldfort',
		name: 'Luỹ Hiệp Sĩ Cũ',
		biome: 'rocky',
		spawn: { x: px(2), y: px(13) + 24 },
		npcs: [],
		monsterZones: packs.map(zone),
		boss: null,
		spots: [
			{ id: 'west_entry_of', name: 'Đường về Đồi Xương', x: px(2), y: px(13) + 24, r: 60 },
			{ id: 'south_entry_of', name: 'Đường xuống rừng Mossvale', x: px(8) + 24, y: px(37), r: 60 },
			// Chỗ cho một trong "3 thẻ tên".
			{ id: 'fort_keep', name: 'Sân chính luỹ', x: px(28), y: px(19), r: 150 },
			{ id: 'east_watch', name: 'Tháp canh đông', x: px(43), y: px(19), r: 90 },
			// BÍ MẬT: không đường mòn nào dẫn tới.
			{ id: 'seal_view', name: 'Mỏm nhìn Đá Phong Ấn', x: px(seal.x), y: px(seal.y), r: 50 },
		],
		dummies: [],
		areas: [
			{ name: 'Mỏm nhìn Đá Phong Ấn', x0: 44 * TILE, y0: 1 * TILE, x1: OLDFORT_W * TILE, y1: 6 * TILE },
			{ name: 'Sân chính luỹ', x0: fort.x0 * TILE, y0: fort.y0 * TILE, x1: (fort.x1 + 1) * TILE, y1: (fort.y1 + 1) * TILE },
			{ name: 'Tháp canh đông', x0: 40 * TILE, y0: 15 * TILE, x1: OLDFORT_W * TILE, y1: 24 * TILE },
			{ name: 'Luỹ Hiệp Sĩ Cũ', x0: 0, y0: 0, x1: OLDFORT_W * TILE, y1: OLDFORT_H * TILE },
		],
		exits: [
			{ id: 'to_bonehills_of', to: 'bonehills', toSpot: 'east_gate_bh', edge: 'W', ...L.exitStrip('W', 11, 16), label: 'Đồi Xương Trắng' },
			{ id: 'to_mossvale_of', to: 'mossvale', toSpot: 'northeast_entry_mv', edge: 'S', ...L.exitStrip('S', 6, 11), label: 'Rừng Mossvale · lối tắt về Thistlewood' },
		],
	});
}

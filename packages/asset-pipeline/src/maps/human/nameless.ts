import type { PropMeta } from '../../props/buildProps.js';
import { decalsOf, Layout, TILE, px, type MapData, type MonsterZone } from './common.js';

/**
 * Mộ Vô Danh — bãi chôn NGOÀI hàng rào phía tây Nghĩa địa (thiết kế 12 map vùng 1, 10/10/2026). Người thua Chiến tranh
 * Ấn Ký nằm đây, không bia, không tên, nên sợi đất lỏng nhất và người chết ở đây trỗi dậy trước — đối lập với Gian Đá
 * Ghi Tên trong Hang Gargoyle. CHỈ một loại quái: xác sống cấp 6–7, mỗi hào mộ một bầy + bầy đông ở hố chôn chung.
 * Lối đông về Nghĩa địa, lối bắc là "Đường hầm của Đoàn" thông thẳng tới gian boss của Hang Gargoyle.
 * Không có nước nên luật "tâm bầy cách nước ≥ 6 ô" đạt sẵn.
 */
export const NAMELESS_W = 44;
export const NAMELESS_H = 40;
const ZOMBIE = 'mob_zombie_001';
const DEAD_TREES = ['tree_dead', 'tree_dead_flip'] as const;
const LITTER = ['dead_bush', 'pale_rocks', 'skull_pile', 'rock_gray', 'stump'] as const;

export function buildNameless(meta: Record<string, PropMeta>, decalIds: string[], seed = 20261203): MapData {
	const L = new Layout(NAMELESS_W, NAMELESS_H, seed, meta, 'g');

	// Bốn hào đất xới (nền tối), mỗi hào một bầy; tâm bầy lệch theo thiết kế chứ không đúng giữa hào.
	const trenches = [
		{ id: 'nl_trench_1', name: 'Hào mộ bắc', x0: 5, y0: 6, x1: 22, y1: 8, cx: 13, cy: 7, level: 6 },
		{ id: 'nl_trench_2', name: 'Hào mộ giữa bắc', x0: 16, y0: 12, x1: 33, y1: 14, cx: 24, cy: 13, level: 6 },
		{ id: 'nl_trench_3', name: 'Hào mộ giữa nam', x0: 16, y0: 26, x1: 33, y1: 28, cx: 24, cy: 27, level: 7 },
		{ id: 'nl_trench_4', name: 'Hào mộ nam', x0: 5, y0: 32, x1: 22, y1: 34, cx: 12, cy: 33, level: 7 },
	];
	// Đầu hào so le từng hàng (xới tay, không thẳng như kẻ chỉ).
	for (const t of trenches)
		for (let y = t.y0; y <= t.y1; y += 1) L.rect(t.x0 + Math.floor(L.rand() * 2), y, t.x1 - Math.floor(L.rand() * 2), y, 'f');

	// Đường đất vẽ SAU các hào: trục chính từ cổng đông tới hố, nhánh bắc lên miệng hầm (cắt qua đầu đông hào giữa
	// bắc), nhánh nhỏ xuống vườn bà goá.
	L.path([
		[43, 19],
		[12, 19],
		[9, 20],
	]);
	L.path([
		[32, 19],
		[32, 0],
	]);
	L.path(
		[
			[38, 20],
			[38, 30],
		],
		1,
	);
	const pit = { x: 8, y: 20, r: 3 };
	L.disc(pit.x, pit.y, pit.r, 'd');

	const herds = [
		...trenches.map((t) => ({ id: t.id, name: t.name, x: t.cx, y: t.cy, r: 3, count: 5, level: t.level })),
		{ id: 'nl_pit', name: 'Hố chôn chung', x: pit.x, y: pit.y, r: 3, count: 6, level: 7 },
	];
	// Chỗ sinh từng con xác sống trong hào giữ trống TRƯỚC khi đắp gò (tấm G1 vẽ xong thì gò mộ không đè lên chỗ quái đứng lúc sinh).
	for (const h of herds) L.keepSpawnsClear({ x: px(h.x), y: px(h.y), radius: Math.round(h.r * TILE), count: h.count });

	// Hào: gò đất KHÔNG bia, mỗi 2 ô dọc giữa hào (bỏ 20%); không đè đường (nhánh bắc cắt qua hào giữa bắc).
	for (const t of trenches) {
		const y = (t.y0 + t.y1) / 2;
		for (let x = t.x0; x <= t.x1; x += 2) {
			if (L.rand() < 0.2) continue;
			L.place('grave_mound', px(x) + Math.round((L.rand() - 0.5) * 14), px(y) + 10);
		}
	}

	// Rào sắt Nghĩa địa nhìn từ phía ngoài (x = 40): chừa cổng hàng 17–22 và khúc vườn bà goá (vườn sát rào, có
	// hàng rào gỗ riêng); bỏ ngẫu nhiên ~25% cho ra rào gãy.
	for (let y = 1; y <= 38; y += 1.5) {
		const gap = L.rand() < 0.25;
		if ((y >= 16.5 && y <= 22.5) || (y >= 28.5 && y <= 36.5) || gap) continue;
		L.place('iron_fence', px(40), px(y), { force: true });
	}

	// Miệng hố chôn chung: quan tài bật nắp + đống sọ quanh vành, chừa phía đông cho đường vào.
	for (const [id, deg] of [
		['coffin', 115],
		['coffin', 165],
		['coffin', 215],
		['coffin', 265],
		['skull_pile', 140],
		['skull_pile', 240],
		['skull_pile', 310],
	] as const) {
		const a = (deg * Math.PI) / 180;
		L.place(id, px(pit.x + Math.cos(a) * (pit.r + 0.6)), px(pit.y + Math.sin(a) * (pit.r + 0.6)), { force: true });
	}

	// Ngọn đèn lén thắp: ba bia vỡ khắc tay quanh một đèn đá.
	for (const [x, y] of [
		[34, 34.4],
		[35.7, 35.4],
		[34.3, 36.6],
	] as const)
		L.place('tomb_broken', px(x), px(y), { force: true });
	L.place('stone_lantern', px(37), px(36), { force: true });

	// Vườn nhà bà goá (x 37–42, y 30–35): rào gỗ trước/sau (chừa cổng ở đầu nhánh đường), chậu cây, ghế, đèn, xe cút kít.
	for (const [x, y] of [
		[39.4, 30.4],
		[40.6, 30.4],
		[41.8, 30.4],
		[38.8, 35.8],
		[40, 35.8],
		[41.2, 35.8],
	] as const)
		L.place('fence', px(x), px(y), { force: true });
	for (const [id, x, y] of [
		['planter', 39.6, 31.8],
		['planter', 41.4, 31.8],
		['bench', 40.4, 34.2],
		['lamp', 37.2, 30.4],
		['lamp', 39, 33],
		['wheelbarrow', 42, 34.6],
	] as const)
		L.place(id, px(x), px(y), { force: true });

	// Miệng Đường hầm của Đoàn (mép bắc): hai tảng đá hang + hai đuốc hai bên đường.
	L.place('cave_boulder', px(30) + 10, px(1) + 6, { force: true });
	L.place('cave_boulder', px(35) - 6, px(1) + 6, { force: true });
	L.place('wall_torch', px(31) + 4, px(2) + 6, { force: true });
	L.place('wall_torch', px(34) + 4, px(2) + 6, { force: true });

	// Bí mật — mộ người lính không tên ở góc tây bắc: vòng đá kín (đá dày để chân đồ vật nối liền: khe dọc < 10px chiều
	// cao hộp chân), chỉ chừa một khe phía đông nam; bán kính xê dịch cho ra đống đá đổ chứ không phải vòng compa. Không
	// có đường mòn dẫn tới. Bụi chết lót ngoài vòng (tự hiện khi tấm G1 vẽ xong).
	const grave = { x: 3, y: 3, r: 2.2 };
	for (let deg = 0; deg < 360; deg += 15) {
		if (deg === 45 || deg === 60) continue;
		const a = (deg * Math.PI) / 180;
		const r = grave.r + Math.sin(deg * 0.07) * 0.15 + (L.rand() - 0.5) * 0.16;
		const x = grave.x + Math.cos(a) * r;
		const y = grave.y + Math.sin(a) * r;
		if (x < 0.4 || y < 0.5) continue;
		L.place('rock_gray', px(x), px(y), { force: true });
	}
	for (const deg of [-10, 20, 75, 105, 160]) {
		const a = (deg * Math.PI) / 180;
		L.place('dead_bush', px(grave.x + Math.cos(a) * (grave.r + 0.8)), px(grave.y + Math.sin(a) * (grave.r + 0.8)), { force: true });
	}
	L.place('tomb_cross', px(3), px(2) + 20, { force: true });
	L.place('war_banner', px(2) + 6, px(2) + 30, { force: true });
	L.place('broken_sword', px(4) - 4, px(3) + 14, { force: true });

	// Giữ trống: bãi quái, lối sang map, vườn, đèn, mộ bí mật, miệng hầm.
	for (const h of herds) L.reserve(h.x, h.y, h.r - 0.5);
	L.reserve(pit.x, pit.y, pit.r + 1);
	L.reserve(42.5, 19.5, 3);
	L.reserve(32.5, 1.5, 3);
	L.reserve(39.8, 33.5, 4);
	L.reserve(35.5, 35.5, 2.5);
	// Mộ bí mật: chỉ giữ trống lòng vòng đá + miệng khe, bên ngoài vòng để cây/đá rải lẫn vào cho khỏi lộ.
	L.reserve(grave.x, grave.y, grave.r - 0.4);
	L.reserve(grave.x + 2.3, grave.y + 2.3, 1.2);

	L.place('signpost', px(42), px(17) + 10, { force: true });
	L.place('signpost', px(34) + 14, px(4) + 10, { force: true });

	L.scatter(60, (x, y) => L.place(L.pick(DEAD_TREES), x, y, { canopy: true }));
	L.scatter(90, (x, y) => L.place(L.pick(LITTER), x, y));
	L.sprinkleDecals(decalsOf(decalIds, 'd2'), 1200);

	const zone = (h: (typeof herds)[number]): MonsterZone => ({
		id: h.id,
		name: h.name,
		x: px(h.x),
		y: px(h.y),
		radius: Math.round(h.r * TILE),
		monsters: [ZOMBIE],
		count: h.count,
		fromAge: 16,
		level: h.level,
	});

	return L.finish({
		id: 'nameless',
		name: 'Mộ Vô Danh',
		biome: 'deadland',
		spawn: { x: px(41), y: px(19) + 24 },
		npcs: [],
		monsterZones: herds.map(zone),
		boss: null,
		spots: [
			{ id: 'east_entry_nl', name: 'Đường về Nghĩa địa', x: px(41), y: px(19) + 24, r: 60 },
			{ id: 'north_entry_nl', name: 'Miệng đường hầm', x: px(32) + 24, y: px(2), r: 60 },
			{ id: 'mass_pit', name: 'Hố chôn chung', x: px(pit.x), y: px(pit.y), r: 130 },
			{ id: 'lit_lantern', name: 'Ngọn đèn lén thắp', x: px(35), y: px(35), r: 70 },
			// Nhiệm vụ phụ "Hàng của người đi xa" của Bram: "bà goá ở rìa nghĩa địa" đứng ở đây.
			{ id: 'widow_garden', name: 'Vườn nhà bà goá', x: px(39), y: px(33), r: 90 },
			// Bí mật: không có đường mòn dẫn tới.
			{ id: 'soldier_grave', name: 'Mộ người lính không tên', x: px(3), y: px(3), r: 50 },
		],
		dummies: [],
		areas: [
			{ name: 'Hố chôn chung', x0: 4 * TILE, y0: 16 * TILE, x1: 13 * TILE, y1: 25 * TILE },
			{ name: 'Vườn nhà bà goá', x0: 37 * TILE, y0: 29 * TILE, x1: 43 * TILE, y1: 37 * TILE },
			{ name: 'Mộ Vô Danh', x0: 0, y0: 0, x1: NAMELESS_W * TILE, y1: NAMELESS_H * TILE },
		],
		exits: [
			{ id: 'to_graveyard_nl', to: 'graveyard', toSpot: 'west_gate_gy', edge: 'E', ...L.exitStrip('E', 17, 22), label: 'Nghĩa địa Hoàng Hôn' },
			{ id: 'to_cave_nl', to: 'gargoyle_cave', toSpot: 'tunnel_gc', edge: 'N', ...L.exitStrip('N', 30, 34), label: 'Đường hầm của Đoàn · Hang Gargoyle · cấp 9+' },
		],
	});
}

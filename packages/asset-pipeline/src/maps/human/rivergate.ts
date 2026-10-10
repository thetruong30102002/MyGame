import type { PropMeta } from '../../props/buildProps.js';
import { decalsOf, Layout, TILE, px, type MapData, type MonsterZone } from './common.js';

/**
 * Hẻm Cửa Sông — hẻm đá nơi sông Brightwater rời thung lũng (thiết kế 12 map vùng 1: docs/thiet-ke/vung1-12-map.md).
 * Đoàn Ấn Ký xây Cổng Đá chắn ngang hẻm, tượng canh quay mặt VÀO thung lũng: họ không canh kẻ đi vào mà canh người mang
 * nút đi ra. CHỈ một loại quái: gargoyle cấp 9–10, mọi bầy ở bờ tây — bờ bên kia sông là vách, không đi tới được, nên
 * không có quái kẹt bên kia nước. Lối tây ra khỏi thung lũng sang Đầm lầy Mù Sương (vùng 2, `regionGate` chặn).
 */
export const RIVERGATE_W = 40;
export const RIVERGATE_H = 44;
const GARGOYLE = 'mob_gargoyle_001';
/** Đá vách hẻm. `boulder` / `rock_outcrop` / `rock_spire` (tấm R1) tự hiện khi tấm được vẽ. */
const CLIFF_ROCKS = ['cave_boulder', 'rock_pillar', 'rock_gray', 'rock_mossy', 'stump', 'boulder', 'rock_outcrop', 'rock_spire'] as const;

export function buildRivergate(meta: Record<string, PropMeta>, decalIds: string[], seed = 20261206): MapData {
	const L = new Layout(RIVERGATE_W, RIVERGATE_H, seed, meta, 'g');

	// Sông rộng 3 ô vào mép bắc ở cột 30–32 (khớp Bãi Bồi), tới hàng 36 bẻ TÂY NAM, ra mép tây ở hàng 37–39.
	const riverX = (y: number): number => 30 + Math.round(Math.sin(y / 6) * 1.5);
	for (let y = 0; y <= 36; y += 1) for (let k = 0; k < 3; k += 1) L.set(riverX(y) + k, y, 'w');
	L.disc(31, 37, 2.5, 'w');
	L.rect(0, 37, 32, 39, 'w');
	// Bờ đông và dải phía nam khúc bẻ: nền đá, chỉ làm cảnh (nước ngăn, không đi tới được).
	for (let y = 0; y < RIVERGATE_H; y += 1)
		for (let x = 0; x < RIVERGATE_W; x += 1) if (L.at(x, y) !== 'w' && (y >= 40 || (y < 37 ? x > riverX(y) + 2 : x >= 33))) L.set(x, y, 'f');
	// Vách tây (chừa cửa ra ở hàng 31–35), gờ đá đầu hẻm và bệ đá phía tây lấn ra từ vách.
	L.rect(0, 0, 3, 30, 'f');
	L.rect(0, 36, 3, 36, 'f');
	for (const [x, y, r] of [
		[4.5, 5.5, 2.6],
		[3.5, 12.5, 1.6],
		[4, 17.5, 1.8],
		[4.5, 27.5, 1.6],
	] as const)
		L.disc(x, y, r, 'f', 'g');
	// Mỏm đá trồi giữa lòng hẻm cho nền đỡ phẳng (tâm ở giữa 4 ô cho mỏm tròn, bán kính nhỏ tâm giữa ô thành hình chữ thập).
	for (const [x, y, r] of [
		[13.5, 3.5, 2.1],
		[8.5, 15.5, 1.6],
		[26.5, 7.5, 1.6],
		[14.5, 25.5, 1.6],
		[26.5, 30.5, 1.6],
	] as const)
		L.disc(x, y, r, 'f', 'g');

	// Đường lát đá cổ dọc bờ tây xuống Cổng Đá, rồi theo bờ bắc khúc bẻ ra lối tây.
	L.path(
		[
			[21, 0],
			[21, 33],
			[0, 33],
		],
		2,
		'c',
	);

	// BÍ MẬT Mỏm đá nhìn về đầm: hốc trong vách tây, khe 1 ô phía đông, trong có đèn đá + bia khắc.
	const nook = { x: 2, y: 26 };
	L.rect(1, 25, 3, 27, 'c');
	for (const [id, x, y] of [
		['cave_boulder', 0.6, 24.2],
		['rock_pillar', 1.5, 24.1],
		['cave_boulder', 2.5, 24.2],
		['rock_pillar', 3.5, 24.1],
		['cave_boulder', 4.4, 24.4],
		['rock_pillar', 4.6, 25.3],
		['rock_pillar', 4.6, 27.3],
		['cave_boulder', 4.4, 28.3],
		['rock_pillar', 3.5, 28.4],
		['cave_boulder', 2.5, 28.3],
		['rock_pillar', 1.5, 28.4],
		['cave_boulder', 0.6, 28.3],
	] as const)
		L.place(id, Math.round(x * TILE + TILE / 2), Math.round(y * TILE + TILE), { force: true });
	L.place('stone_lantern', px(1), px(25) + 18, { force: true });
	L.place('rune_stone', px(2) + 10, px(27) + 10, { force: true });

	// CỔNG ĐÁ ẤN KÝ (hàng 20): vòm đi xuyên được trên đường, tường đổ hai bên (khe vỡ ở x ≈ 7–8, ngay trên bầy Bệ đá
	// phía tây), tượng canh + cột gãy kẹp hai bên vòm, đèn đá hai bên đường phía thung lũng, bia khắc huy hiệu bảy vòng tròn.
	// Mỗi đoạn tường cách 1,5 ô; tượng / cột / tảng đá đã vẽ bịt các khe hở ở hai đầu ngay cả khi tấm R1 chưa có.
	const gateY = px(20) + 20;
	L.place('ruin_arch', px(21) + 24, px(21), { force: true });
	for (const x of [4, 5.5, 9, 10.5, 12, 13.5, 15, 16.5, 18, 25, 26.5, 28]) L.place('ruin_wall', Math.round(x * TILE + TILE / 2), gateY, { force: true });
	L.place('gargoyle_idol', px(19) + 12, gateY + 4, { force: true });
	L.place('gargoyle_idol', px(24) - 12, gateY + 4, { force: true });
	L.place('pillar_broken', px(20) + 8, gateY + 2, { force: true });
	L.place('pillar_broken', px(23) - 8, gateY + 2, { force: true });
	// Hai đầu tường: bám vào vách tây, chạm mép nước — không chừa khe men theo vách / bờ sông.
	L.place('cave_boulder', px(29) - 4, gateY, { force: true });
	for (const [i, x] of [11, 40, 70, 99, 129, 158].entries()) L.place(i % 2 ? 'cave_boulder' : 'rock_pillar', x, gateY + (i % 3) * 3 - 2, { force: true });
	L.place('stone_lantern', px(20) - 6, px(18), { force: true });
	L.place('stone_lantern', px(23) + 6, px(18), { force: true });
	L.place('rune_stone', px(17), px(19) + 10, { force: true });

	// Bệ tượng canh phía bắc cổng: tượng trên bệ giữa hai cột đá, ở mép bắc bầy vg_altar (hàng 11 — hàng 12 thì chân tượng đè
	// lên điểm sinh quái phía bắc của bầy, quái sinh ra kẹt trong chân tượng).
	L.place('gargoyle_idol', px(18), px(11) + 6, { force: true });
	L.place('rock_pillar', px(16) + 20, px(11) + 12, { force: true });
	L.place('rock_pillar', px(20) - 20, px(11) + 12, { force: true });

	// Vách hẻm: đá vách lớn dọc vách tây (trừ cửa ra hàng 31–35 và hốc bí mật) và dọc bờ đông.
	for (const y of [1, 6, 11, 16, 21, 36, 41]) L.place(y % 2 ? 'cliff_rock' : 'cliff_rock_flip', px(1), px(y) + (y === 36 ? 30 : 20), { force: true });
	for (let y = 2; y < RIVERGATE_H; y += 5) L.place(y % 2 ? 'cliff_rock' : 'cliff_rock_flip', px(37), px(y) + 20, { force: true });

	// Lối tây: cột đổ hai bên đường, biển chỉ đường sang đầm. Lối bắc: biển về Bãi Bồi.
	L.place('column_fallen', px(6), px(32) + 10, { force: true });
	L.place('column_fallen', px(8), px(36), { force: true });
	L.place('signpost', px(4), px(32) + 10, { force: true });
	L.place('signpost', px(24), px(2) + 10, { force: true });

	const herds = [
		{ id: 'vg_ledge_n', name: 'Gờ đá đầu hẻm', x: 9, y: 8, r: 3.5, count: 4, level: 9 },
		{ id: 'vg_altar', name: 'Bệ tượng canh', x: 18, y: 13, r: 3, count: 4, level: 9 },
		{ id: 'vg_shelf_w', name: 'Bệ đá phía tây', x: 8, y: 22, r: 3, count: 4, level: 9 },
		// Đứng ngay sau vòm, chặn đường ra.
		{ id: 'vg_gate', name: 'Cổng Đá', x: 21, y: 24, r: 3.5, count: 5, level: 10 },
		{ id: 'vg_mouth', name: 'Cửa hẻm', x: 14, y: 30, r: 3, count: 5, level: 10 },
	];

	// Giữ trống (toạ độ px / TILE: tâm ô t là t + 0,5): hai lối, vòm cổng, các bầy, hốc bí mật.
	const c = (t: number): number => t + 0.5;
	L.reserve(22, 1, 3);
	L.reserve(1, 33.5, 3);
	L.reserve(22, 21, 2);
	for (const h of herds) L.reserve(c(h.x), c(h.y), h.r + 0.3);
	L.reserve(c(nook.x), c(nook.y), 2.2);
	L.reserve(5.2, c(nook.y), 1);

	// Bờ tây sát nước (trên cổng và dưới cổng) để rải dương xỉ / bụi.
	const bank: [number, number][] = [];
	for (let y = 0; y < 37; y += 1)
		for (let x = 4; x < riverX(y); x += 1) if (L.at(x, y) === 'g' && (L.at(x + 1, y) === 'w' || L.at(x + 2, y) === 'w' || L.at(x, y + 1) === 'w')) bank.push([x, y]);
	for (let i = 0; i < 30; i += 1) {
		const [tx, ty] = L.pick(bank);
		L.place(L.pick(['fern', 'bush', 'fern', 'rock_mossy']), Math.round((tx + L.rand()) * TILE), Math.round((ty + L.rand()) * TILE));
	}
	// Vách: đá chỉ trên ô 'f' (vách tây, gờ, bờ đông, dải nam).
	L.scatter(900, (x, y) => (L.at(Math.floor(x / TILE), Math.floor(y / TILE)) === 'f' ? L.place(L.pick(CLIFF_ROCKS), x, y) : false));
	// Lòng hẻm: vài tảng đá lăn rải rác.
	L.scatter(170, (x, y) => (L.at(Math.floor(x / TILE), Math.floor(y / TILE)) === 'g' ? L.place(L.pick(['rock_gray', 'cave_boulder', 'rock_mossy', 'boulder', 'rock_gray', 'rock_pillar']), x, y) : false));

	L.sprinkleDecals(decalsOf(decalIds, 'd2'), 700);
	// Lau sậy (tấm C1, đi xuyên) dọc mép nước bờ tây — rải SAU decal nên dãy ngẫu nhiên của đá / bụi / decal đã có không đổi.
	for (let i = 0; i < 16; i += 1) {
		const [tx, ty] = L.pick(bank);
		L.place('reed_clump', Math.round((tx + L.rand()) * TILE), Math.round((ty + L.rand()) * TILE));
	}

	const zone = (h: (typeof herds)[number]): MonsterZone => ({
		id: h.id,
		name: h.name,
		x: px(h.x),
		y: px(h.y),
		radius: Math.round(h.r * TILE),
		monsters: [GARGOYLE],
		count: h.count,
		level: h.level,
		fromAge: 16,
	});

	return L.finish({
		id: 'rivergate',
		name: 'Hẻm Cửa Sông',
		biome: 'rocky',
		spawn: { x: px(21) + 24, y: px(2) },
		npcs: [],
		monsterZones: herds.map(zone),
		boss: null,
		spots: [
			{ id: 'north_entry_vg', name: 'Đường về Bãi Bồi', x: px(21) + 24, y: px(2), r: 60 },
			{ id: 'stone_gate', name: 'Cổng Đá Ấn Ký', x: px(21) + 24, y: px(21), r: 110 },
			// Điểm đến khi từ vùng 2 quay về.
			{ id: 'swamp_gate_vg', name: 'Lối ra khỏi thung lũng', x: px(2), y: px(33) + 24, r: 60 },
			// BÍ MẬT: không đường mòn — chỉ khe 1 ô trong vách tây.
			{ id: 'gorge_lookout', name: 'Mỏm đá nhìn về đầm', x: px(3), y: px(26), r: 50 },
		],
		dummies: [],
		areas: [
			{ name: 'Cổng Đá Ấn Ký', x0: 3 * TILE, y0: 17 * TILE, x1: 30 * TILE, y1: 26 * TILE },
			{ name: 'Cửa hẻm', x0: 0, y0: 27 * TILE, x1: 24 * TILE, y1: 37 * TILE },
			{ name: 'Hẻm Cửa Sông', x0: 0, y0: 0, x1: RIVERGATE_W * TILE, y1: RIVERGATE_H * TILE },
		],
		exits: [
			{ id: 'to_riverflats_vg', to: 'riverflats', toSpot: 'south_entry_rf', edge: 'N', ...L.exitStrip('N', 19, 24), label: 'Bãi Bồi Brightwater' },
			// Lối sang VÙNG 2: `regionGate` chặn tới khi đủ cấp 10 + đã hạ Quỷ vương; vùng 2 chưa có map thì báo đang xây dựng.
			{ id: 'to_swamp_vg', to: 'swamp/hub', toSpot: 'east_gate', edge: 'W', ...L.exitStrip('W', 31, 35), label: 'Đầm lầy Mù Sương · vùng 2 · cần cấp 10 + đã hạ Quỷ vương' },
		],
	});
}

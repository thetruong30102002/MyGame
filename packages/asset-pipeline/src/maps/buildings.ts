import type { PropMeta } from '../props/buildProps.js';
import { Layout, px, TILE, type Edge, type MapData } from './human/common.js';

/** Công trình dùng hình trang trí đã có; tường xây theo ô, va chạm chung với client. */
export interface BuildingSpec {
	id: string;
	name: string;
	from: string;
	rooms: readonly [string, string, string];
	decor: readonly string[];
	monster?: string;
	level: number;
}

export const BUILDINGS: Record<string, BuildingSpec> = {
	wood: {"id":"worldtree","name":"Lòng Cây Thế Giới","from":"h7","rooms":["Phòng rễ cổ","Kho hạt giống","Điện mầm sống"],"decor":["vine_column","mossy_pillar"],"monster":"mob_glow_mushroom_001","level":28},
	light: {"id":"cathedral","name":"Thánh Đường Trắng","from":"h7","rooms":["Sảnh hành hương","Thư phòng bình minh","Điện ánh sáng"],"decor":["sky_column","wind_altar"],"monster":"mob_wind_goblin_001","level":38},
	dark: {"id":"dungeon","name":"Ngục Vĩnh Dạ","from":"h7","rooms":["Phòng giam bóng","Kho phong ấn","Điện đèn tím"],"decor":["rune_pillar","weapon_rack"],"monster":"mob_fire_demon_001","level":48},
	human: { id: 'rowanmere', name: 'Lâu đài Rowanmere', from: 'oldfort', rooms: ['Kho quân nhu', 'Phòng lưu trữ Đoàn Ấn Ký', 'Đại sảnh Rowanmere'], decor: ['war_banner', 'crate', 'wall_torch', 'stone_altar'], level: 8 },
	swamp: { id: 'stone_dam', name: 'Thân đập đá của Đoàn', from: 'leechcanal', rooms: ['Cống ngầm Lau Xám', 'Phòng điều tiết cửa xả', 'Buồng máy con đập'], decor: ['mossy_pillar', 'sunken_altar', 'sunken_boat'], monster: 'mob_swamp_leech_001', level: 18 },
	desert: { id: 'pyramid', name: 'Kim tự tháp Sa Thạch', from: 'deeptombs', rooms: ['Kho lễ vật', 'Phòng tranh khắc', 'Đại điện an táng'], decor: ['hiero_pillar', 'sarcophagus', 'torch_stand', 'stone_tablet'], monster: 'mob_mummy_001', level: 28 },
	highland: { id: 'wind_temple', name: 'Nội điện Đền Gió', from: 'cloudpath', rooms: ['Hành lang chuông gió', 'Phòng người giữ đền', 'Điện thờ trên mây'], decor: ['cloud_pillar', 'wind_altar', 'long_banner'], monster: 'mob_wind_goblin_001', level: 38 },
	tundra: { id: 'ice_palace', name: 'Cung Ngai Băng', from: 'snowmanpass', rooms: ['Kho lương băng giá', 'Hành lang thánh vệ', 'Đại sảnh ngai băng'], decor: ['ice_pillar', 'oil_lamp', 'ice_throne_gate'], monster: 'mob_snowman_001', level: 48 },
	volcano: { id: 'red_anvil', name: 'Pháo đài Đe Đỏ', from: 'oldforge', rooms: ['Kho vũ khí', 'Xưởng rèn trong núi', 'Đại sảnh Đe Đỏ'], decor: ['weapon_rack', 'anvil_banner', 'forge_altar', 'coal_barrel'], monster: 'mob_fire_demon_001', level: 58 },
	fungal: { id: 'undercity', name: 'Thành phố nấm ngầm', from: 'h7', rooms: ['Kho bào tử', 'Phòng ghi chép Ánh Tím', 'Sảnh mạch tinh thể'], decor: ['mossy_pillar', 'sunken_altar', 'vine_column'], monster: 'mob_glow_mushroom_001', level: 78 },
	ruins: { id: 'haven_archive', name: 'Thư viện thành Haven', from: 'h7', rooms: ['Kho bản khắc', 'Xưởng máy cổ', 'Đại sảnh pháp sư'], decor: ['sky_column', 'wind_altar', 'bird_statue'], monster: 'mob_wind_goblin_001', level: 88 },
	void: { id: 'void_fortress', name: 'Nội thành Hư Không', from: 'h7', rooms: ['Kho tiếp tế liên quân', 'Phòng chỉ huy tiền tuyến', 'Đại sảnh thành trì'], decor: ['weapon_rack', 'rune_pillar', 'forge_altar'], monster: 'mob_fire_demon_001', level: 98 },
	isles: { id: 'ghost_ship', name: 'Khoang tàu ma', from: 'piratecove', rooms: ['Khoang hàng đắm', 'Kho báu hải tặc', 'Phòng thuyền trưởng'], decor: ['barrel', 'rune_chest', 'fish_crates', 'red_machine'], monster: 'mob_pirate_001', level: 68 },
};

const opposite: Record<Edge, Edge> = { N: 'S', S: 'N', E: 'W', W: 'E' };

/** Thêm một lối ở mép còn trống; không chuyển chỗ các điểm đến và bầy quái cũ. */
export function attachBuilding(maps: MapData[], spec: BuildingSpec, meta: Record<string, PropMeta>): MapData {
	const source = maps.find((m) => m.id === spec.from);
	if (!source) throw new Error(`Không thấy map vào ${spec.from} của ${spec.name}`);
	const edge = (['N', 'E', 'S', 'W'] as Edge[]).find((e) => !source.exits.some((x) => x.edge === e));
	if (!edge) throw new Error(`${source.id}: không còn mép trống để vào ${spec.name}`);
	const W = source.width, H = source.height;
	const entry = edge === 'N' ? [W >> 1, 2] : edge === 'S' ? [W >> 1, H - 3] : edge === 'W' ? [2, H >> 1] : [W - 3, H >> 1];
	const end = edge === 'N' ? [entry[0]!, 0] : edge === 'S' ? [entry[0]!, H - 1] : edge === 'W' ? [0, entry[1]!] : [W - 1, entry[1]!];
	const rows = source.terrain.map((r) => r.split(''));
	const carved = new Set<string>();
	const carve = (x: number, y: number): void => {
		for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
			const tx = x + dx, ty = y + dy;
			if (tx < 0 || ty < 0 || tx >= W || ty >= H) continue;
			rows[ty]![tx] = rows[ty]![tx] === 'w' ? 'b' : rows[ty]![tx] === 'b' ? 'b' : 'c';
			carved.add(`${tx},${ty}`);
		}
	};
	let x = Math.floor(source.spawn.x / TILE), y = Math.floor(source.spawn.y / TILE);
	carve(x, y);
	for (const [tx, ty] of [entry, end]) {
		while (x !== tx) { x += Math.sign(tx! - x); carve(x, y); }
		while (y !== ty) { y += Math.sign(ty! - y); carve(x, y); }
	}
	source.terrain = rows.map((r) => r.join(''));
	// Dọn mọi chân đồ vật chạm hành lang, kể cả chân rộng hơn một ô.
	source.props = source.props.filter((p) => {
		const f = meta[p.id]?.footprint;
		if (!f || !meta[p.id]!.blocks) return true;
		for (let ty = Math.floor((p.y + f.y - 8) / TILE); ty <= Math.floor((p.y + 8) / TILE); ty++)
			for (let tx = Math.floor((p.x + f.x - 12) / TILE); tx <= Math.floor((p.x + f.x + f.w + 12) / TILE); tx++)
				if (carved.has(`${tx},${ty}`)) return false;
		return true;
	});
	const entryId = `${spec.id}_outside`, doorId = `${spec.id}_entry`;
	source.spots.push({ id: entryId, name: `Lối vào ${spec.name}`, x: px(entry[0]!), y: px(entry[1]!), r: 60 });
	const rect = (w: number, h: number, e: Edge) => e === 'N' ? { x0: px(w >> 1) - TILE, x1: px(w >> 1) + TILE, y0: 0, y1: TILE } : e === 'S' ? { x0: px(w >> 1) - TILE, x1: px(w >> 1) + TILE, y0: (h - 1) * TILE, y1: h * TILE } : e === 'W' ? { x0: 0, x1: TILE, y0: px(h >> 1) - TILE, y1: px(h >> 1) + TILE } : { x0: (w - 1) * TILE, x1: w * TILE, y0: px(h >> 1) - TILE, y1: px(h >> 1) + TILE };
	source.exits.push({ id: `to_${spec.id}`, to: spec.id, toSpot: doorId, edge, label: spec.name, ...rect(W, H, edge) });
	// Mỗi công trình có đại sảnh, hai phòng bên, hành lang rộng 4 ô và cổng theo đúng mép đối diện.
	const L = new Layout(40, 36, source.seed + 10000, meta, '#');
	const floor = spec.id === 'ghost_ship' ? 'b' : 'c';
	const roomRows: Record<string, readonly [number, number]> = {
		rowanmere: [17, 17], stone_dam: [12, 24], pyramid: [24, 15], wind_temple: [13, 25],
		ice_palace: [24, 24], red_anvil: [13, 23], ghost_ship: [12, 24],
		undercity: [22, 12], haven_archive: [15, 24], void_fortress: [25, 13],
	};
	const [leftY, rightY] = roomRows[spec.id] ?? [15, 15];
	const centers = [[8, leftY], [31, rightY], [20, 5]] as const;
	L.rect(18, 2, 21, 33, floor);
	for (const [cx, cy] of centers) {
		L.rect(cx - 5, cy - 4, cx + 5, cy + 4, floor);
		L.path([[Math.min(19, cx), cy - 1], [Math.max(19, cx), cy - 1]], 4, floor);
	}
	// Đại sảnh rộng hơn phòng bên, đủ sân chiến đấu và điểm xem cốt truyện.
	L.rect(12, 2, 28, 9, floor);
	const backEdge = opposite[edge];
	const arrival = backEdge === 'N' ? [20, 2] : backEdge === 'S' ? [20, 33] : backEdge === 'W' ? [2, 18] : [37, 18];
	if (backEdge === 'N') L.rect(18, 0, 21, 3, 'c');
	if (backEdge === 'S') L.rect(18, 32, 21, 35, 'c');
	if (backEdge === 'W') L.rect(0, 13, 19, 19, 'c');
	if (backEdge === 'E') L.rect(20, 13, 39, 19, 'c');
	const zones: MapData['monsterZones'] = spec.monster ? centers.map(([cx, cy], i) => ({ id: `${spec.id}_z${i + 1}`, name: spec.rooms[i]!, x: px(cx), y: px(cy), radius: TILE * 2, monsters: [spec.monster!], count: 6, fromAge: 16, level: spec.level })) : [];
	const decor = spec.decor.filter((d) => meta[d]);
	for (let i = 0; i < centers.length; i++) {
		const [cx, cy] = centers[i]!;
		for (const side of [-1, 1]) if (decor.length) L.place(decor[(i + (side > 0 ? 1 : 0)) % decor.length]!, px(cx + side * 3), px(cy - 3), { force: true });
	}
	return L.finish({
		id: spec.id,
		name: spec.name,
		biome: source.biome,
		spawn: { x: px(arrival[0]!), y: px(arrival[1]!) },
		npcs: [],
		monsterZones: zones,
		boss: null,
		dummies: [],
		areas: centers.map(([cx, cy], i) => ({
			name: spec.rooms[i]!, x0: px(cx - 3), y0: px(cy - 2), x1: px(cx + 3), y1: px(cy + 2),
		})),
		spots: [
			{ id: doorId, name: `Lối về ${source.name}`, x: px(arrival[0]!), y: px(arrival[1]!), r: 60 },
			{ id: 'waystone', name: 'Cột dịch chuyển', x: px(20), y: px(27), r: 80 },
			...centers.map(([cx, cy], i) => ({ id: `${spec.id}_room${i + 1}`, name: spec.rooms[i]!, x: px(cx), y: px(cy), r: 80 })),
		],
		exits: [{ id: `to_${source.id}`, to: source.id, toSpot: entryId, edge: backEdge, label: source.name, ...rect(40, 36, backEdge) }],
	});
}

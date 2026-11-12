import { TILE, px, type Biome, type GroupPiece, type Layout, type MapBase, type MapData } from './human/common.js';

/**
 * Cụm cảnh kể chuyện (chủ dự án 05/11/2026 gửi video tham khảo map: "học hỏi đi"): ghép các đồ vật SẴN CÓ thành cảnh nhỏ có ý nghĩa
 * thay vì rải lẻ — trại lữ khách bỏ hoang, xe hàng đổ bên đường, bãi chiến trận cũ, miếu đá nhỏ, mộ lữ khách, vườn ong hoang, bến
 * thuyền bờ suối. Giữ style map cũ, không vẽ thêm: mỗi món là danh sách id thay thế theo vùng (đồ vùng nào có thì dùng đồ vùng đó),
 * vùng không có món chính thì bỏ loại cảnh đó. Đặt cuối cùng (sau cây / đá) vào chỗ trống, tránh bầy quái, địa điểm, lối sang map.
 */
type Kind = 'camp' | 'cart' | 'battle' | 'shrine' | 'grave' | 'apiary' | 'dock';

const CRATES = ['crate', 'fruit_crates', 'fish_crates', 'barrel_stack'];
const BARRELS = ['barrel', 'coal_barrel', 'amphorae', 'clay_pot', 'oil_jars', 'fish_barrel'];
const LANTERNS = ['stone_lantern', 'lantern_pole', 'pole_lantern', 'brass_lantern', 'frost_lantern', 'oil_lamp', 'lamp'];
const FLOWERS = ['wildflowers', 'highland_flowers', 'desert_flower', 'glow_flower', 'frost_flower', 'fire_flower', 'heather'];
const FENCES = ['fence', 'bamboo_fence', 'sheep_fence'];

const KINDS: Record<Exclude<Kind, 'dock'>, { roadside: boolean; pieces: GroupPiece[] }> = {
	camp: {
		roadside: true,
		pieces: [
			{ ids: ['campfire', 'cook_fire', 'fire_pit', 'fire_brazier', 'brazier'], dx: 0, dy: 0 },
			{ ids: ['canvas_tent', 'hide_tent', 'market_tent', 'small_hut', 'field_cot', 'fisher_hut'], dx: -70, dy: -40 },
			{ ids: CRATES, dx: 64, dy: -14 },
			{ ids: BARRELS, dx: 82, dy: 18 },
			{ ids: ['firewood_pile', 'firewood', 'mossy_log', 'stump', 'frost_stump', 'rotten_stump', 'broken_stump'], dx: -46, dy: 32 },
			{ ids: ['bench', 'cloud_bench'], dx: 36, dy: 48 },
		],
	},
	cart: {
		roadside: true,
		pieces: [
			{ ids: ['wheelbarrow', 'hand_cart', 'hay_cart', 'ore_cart', 'ice_cart', 'mine_cart', 'dog_sled'], dx: 0, dy: 0 },
			{ ids: CRATES, dx: 54, dy: 6 },
			{ ids: ['crate', 'barrel_stack', 'fruit_crates', 'fish_crates'], dx: 42, dy: 50 },
			{ ids: BARRELS, dx: -52, dy: 10 },
			{ ids: ['grain_sacks', 'haybale', 'haystack', 'ore_pile', 'net_heap', 'firewood'], dx: -30, dy: 50 },
		],
	},
	battle: {
		roadside: false,
		pieces: [
			{ ids: ['war_banner', 'banner_pole', 'long_banner', 'anvil_banner'], dx: 0, dy: 0 },
			{ ids: ['broken_sword'], dx: 34, dy: 20 },
			{ ids: ['spike_barricade', 'skull_stake'], dx: -54, dy: 12 },
			{ ids: ['skull_pile', 'bone_pile', 'old_bones', 'frozen_bones'], dx: 12, dy: 54 },
			{ ids: ['beast_skull', 'bull_skull', 'bone_pile'], dx: -36, dy: 52 },
			{ ids: ['weapon_rack', 'armor_stand'], dx: 64, dy: -6 },
		],
	},
	shrine: {
		roadside: true,
		pieces: [
			{ ids: ['rune_stone', 'obelisk', 'cairn', 'hiero_pillar', 'mossy_pillar', 'ice_waystone', 'feather_totem'], dx: 0, dy: 0 },
			{ ids: LANTERNS, dx: -54, dy: 14 },
			{ ids: LANTERNS, dx: 54, dy: 14 },
			{ ids: FLOWERS, dx: -24, dy: 48 },
			{ ids: FLOWERS, dx: 26, dy: 52 },
		],
	},
	grave: {
		roadside: false,
		pieces: [
			{ ids: ['grave_mound', 'buried_urn'], dx: 0, dy: 0 },
			{ ids: ['tomb_cross', 'skull_stake', 'name_post'], dx: -40, dy: 2 },
			{ ids: ['dead_bush', 'dry_shrub', 'icicle_bush'], dx: 42, dy: 8 },
			{ ids: ['broken_sword'], dx: 14, dy: 36 },
			{ ids: ['treasure_chest'], dx: 4, dy: -40 },
		],
	},
	apiary: {
		roadside: false,
		pieces: [
			{ ids: ['beehive', 'chicken_coop'], dx: 0, dy: 0 },
			{ ids: ['beehive'], dx: 56, dy: 8 },
			{ ids: ['planter', 'herb_basket'], dx: -58, dy: 2 },
			{ ids: FENCES, dx: -30, dy: 54 },
			{ ids: FENCES, dx: 26, dy: 54 },
			{ ids: FLOWERS, dx: 82, dy: 44 },
		],
	},
};

/** Bến: cột neo trên bờ, thuyền dưới nước phía mặt nước, thùng / lưới phía sau cột. */
function dockPieces(wx: number, wy: number): GroupPiece[] {
	const back = (k: number, side: number): [number, number] => [Math.round(-wx * k + wy * side), Math.round(-wy * k - wx * side)];
	const [cx, cy] = back(44, 26);
	const [bx, by] = back(40, -30);
	const [nx, ny] = back(10, 56);
	return [
		{ ids: ['mooring_post'], dx: 0, dy: 0 },
		{ ids: ['rowboat', 'canoe', 'dugout_canoe'], dx: wx * (wx ? 92 : 64), dy: wy * 64, onWater: true },
		{ ids: CRATES, dx: cx, dy: cy },
		{ ids: BARRELS, dx: bx, dy: by },
		{ ids: ['net_rack', 'fish_rack', 'net_pile', 'reed_bundle', 'reed_clump'], dx: nx, dy: ny },
	];
}

const BARREN: readonly Biome[] = ['deadland', 'rocky', 'dark', 'desert', 'snow', 'volcanic'];

/** Đặt tới `n` cụm cảnh (mỗi loại tối đa một lần / map). Trả về `loại@ô` đã đặt (ghi log khi dựng map). */
export function placeStoryBits(L: Layout, base: Pick<MapData, 'monsterZones' | 'spots' | 'exits' | 'npcs' | 'spawn' | 'biome'>, n: number): string[] {
	const avoid: { x: number; y: number; r: number }[] = [
		...base.monsterZones.map((z) => ({ x: z.x / TILE, y: z.y / TILE, r: z.radius / TILE + 3 })),
		...base.spots.map((s) => ({ x: s.x / TILE, y: s.y / TILE, r: s.r / TILE + 2 })),
		...base.exits.map((e) => ({ x: (e.x0 + e.x1) / 2 / TILE, y: (e.y0 + e.y1) / 2 / TILE, r: 5 })),
		...base.npcs.map((q) => ({ x: q.x / TILE, y: q.y / TILE, r: 3 })),
		{ x: base.spawn.x / TILE, y: base.spawn.y / TILE, r: 4 },
	];
	const open = (c: string): boolean => c === 'g' || c === 'f';
	const road = (c: string): boolean => c === 'd' || c === 'c';
	const near = (tx: number, ty: number, r: number, hit: (c: string) => boolean): boolean => {
		for (let y = ty - r; y <= ty + r; y += 1) for (let x = tx - r; x <= tx + r; x += 1) if (hit(L.at(x, y))) return true;
		return false;
	};
	const kinds: Kind[] = ['camp', 'cart', 'battle', 'shrine', 'grave', 'apiary'];
	for (let i = kinds.length - 1; i > 0; i -= 1) {
		const j = Math.floor(L.rand() * (i + 1));
		[kinds[i], kinds[j]] = [kinds[j]!, kinds[i]!];
	}
	// Map có suối / hồ: bến thuyền đứng đầu (cảnh nước là điểm nhấn).
	if (L.T.some((row) => row.includes('w')) && L.resolve(['mooring_post'])) kinds.unshift('dock');
	const made: string[] = [];
	for (const kind of kinds) {
		if (made.length >= n) break;
		if (kind !== 'dock' && !L.resolve(KINDS[kind].pieces[0]!.ids)) continue;
		// Vườn ong chỉ hợp vùng xanh, không đặt ở đất chết / đá / sa mạc / tuyết / núi lửa / Vực Ám.
		if (kind === 'apiary' && base.biome && BARREN.includes(base.biome)) continue;
		for (let k = 0; k < 400; k += 1) {
			const tx = 3 + Math.floor(L.rand() * (L.w - 6));
			const ty = 3 + Math.floor(L.rand() * (L.h - 6));
			if (!open(L.at(tx, ty)) || avoid.some((a) => Math.hypot(tx + 0.5 - a.x, ty + 0.5 - a.y) < a.r)) continue;
			let pieces: GroupPiece[];
			if (kind === 'dock') {
				// Bờ: kề nước theo một hướng thẳng, nước sâu ≥ 3 ô (đủ chỗ thuyền).
				const dir = ([[1, 0], [-1, 0], [0, 1], [0, -1]] as const).find(([dx, dy]) => [1, 2, 3].every((s) => L.at(tx + dx * s, ty + dy * s) === 'w'));
				if (!dir || near(tx, ty, 1, road)) continue;
				pieces = dockPieces(dir[0], dir[1]);
			} else {
				const spec = KINDS[kind];
				if (near(tx, ty, 1, (c) => !open(c))) continue;
				if (spec.roadside !== near(tx, ty, 4, road)) continue;
				if (near(tx, ty, 2, (c) => c === 'w')) continue;
				pieces = spec.pieces;
			}
			// Lệch nhẹ từng món (±5px) cho khỏi thẳng hàng như kẻ ô.
			pieces = pieces.map((p, i) => (i === 0 || p.onWater ? p : { ...p, dx: p.dx + Math.round((L.rand() - 0.5) * 10), dy: p.dy + Math.round((L.rand() - 0.5) * 8) }));
			if (L.group(pieces, px(tx), px(ty) + TILE / 2 - 6)) {
				// Trại: nền đất giẫm dưới bếp lửa.
				if (kind === 'camp') L.disc(tx, ty, 1.3, 'd', 'gf');
				made.push(`${kind}@${tx},${ty}`);
				avoid.push({ x: tx + 0.5, y: ty + 0.5, r: 7 });
				break;
			}
		}
	}
	return made;
}

/** `L.finish` có thêm `n` cụm cảnh kể chuyện (đặt sau cùng, sau khi đã có chỗ cột dịch chuyển để tránh). */
export function finishWithStory(L: Layout, n: number, base: MapBase): MapData {
	const spots = L.waystoneSpots(base);
	const made = placeStoryBits(L, { ...base, spots }, n);
	if (made.length) console.log(`  · ${base.id}: cụm cảnh ${made.join(', ')}`);
	return L.finish({ ...base, spots });
}

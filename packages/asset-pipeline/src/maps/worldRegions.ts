import type { KitBoss, KitMapSpec, KitRegionDef, KitTheme, KitZone } from './kit.js';

/**
 * Vùng 2–7 theo KHUNG 12 map (docs/ke-hoach-the-gioi.md mục 1; tên map săn đầu tiên của mỗi loại quái + boss theo bảng vùng ở
 * docs/the-gioi-aether.md, map lặp lại thứ hai đặt tên mới). Đồ thị lối CHUẨN (mọi vùng như nhau — toạ độ ô lưới, x sang đông, y
 * xuống nam):
 *
 *   h10(-2,-3) ── thánh địa(-1,-3)            h10: lối TÂY sang trạm vùng kế
 *     │
 *   h9 (-2,-2) ── Long Huyệt(-1,-2)           (chỉ vùng có rồng)
 *     │
 *   h8 (-2,-1) ── h6 (-1,-1) ── h7 (0,-1)
 *     │             │             │
 *   h4 (-2, 0) ── h5 (-1, 0) ── TRẠM (0,0) ── lối ĐÔNG về vùng trước
 *     │                           │
 *   h3 (-2, 1) ── h2 (-1, 1) ── h1 (0, 1)
 *
 * Đường cấp: trạm → h1 → … → h10 → thánh địa (mỗi map săn lên ~1 cấp; h5 và h7 vòng về trạm). 5 loại quái t1…t5, loại i ở map
 * h(i) và h(i+5) (cách nhau 5 cấp). Boss khu thứ nhất ở h7 (loại t2), thứ hai ở h10 (loại t5) — trừ khi vùng khai khác.
 * Lối vùng trước → trạm vào ở mép ĐÔNG (Hẻm Cửa Sông vùng 1 ra mép tây), nên lối sang vùng kế cũng ra mép TÂY của h10.
 */

type Edge = 'N' | 'S' | 'E' | 'W';

interface Mob {
	id: string;
	/** Tên bầy (vùng quái hiện khi bước vào). */
	herd: string;
}

interface Hunt {
	id: string;
	name: string;
	theme: KitTheme;
}

interface StdRegion {
	region: string;
	L0: number;
	seed: number;
	hub: { name: string; theme: KitTheme; hub: NonNullable<KitMapSpec['hub']> };
	mobs: readonly [Mob, Mob, Mob, Mob, Mob];
	/** h1…h10 theo đường cấp. */
	hunts: readonly Hunt[];
	/** Hang ổ boss khu: `at` = số thứ tự map săn (1…10). */
	bosses: readonly (KitBoss & { at: number })[];
	sanctum: { id: string; name: string; theme: KitTheme; chief: KitBoss };
	dragon?: { id: string; name: string; theme: KitTheme; boss: KitBoss };
	prev: { to: string; toSpot: string; label: string };
	next: { to: string; toSpot: string; label: string };
}

const SIZES: readonly [number, number][] = [
	[48, 40],
	[46, 42],
	[50, 38],
	[46, 44],
	[52, 40],
	[48, 42],
	[50, 44],
	[46, 40],
	[52, 42],
	[48, 44],
];

function standardRegion(r: StdRegion): KitRegionDef {
	const H = r.hunts.map((h) => h.id);
	const maps: KitMapSpec[] = [];
	const labels: Record<string, string> = { hub: r.hub.name };
	maps.push({ id: 'hub', name: r.hub.name, seed: r.seed, w: 44, h: 36, role: 'hub', theme: r.hub.theme, hub: r.hub.hub });
	r.hunts.forEach((h, i) => {
		const k = i + 1;
		const mob = r.mobs[i % 5]!;
		const boss = r.bosses.find((b) => b.at === k);
		const lo = r.L0 + k - 1;
		const hi = r.L0 + k;
		const n = boss ? 3 : 4;
		const zones: KitZone[] = Array.from({ length: n }, (_, z) => ({
			name: `${mob.herd} ${z + 1}`,
			monster: mob.id,
			level: z < n / 2 ? lo : hi,
			// Map săn đông hơn (chủ dự án 11/10/2026: "cần thêm quái" — ke-hoach-the-gioi 5.4): 24–28 con / map thường, 21–24 + boss ở
			// map có hang ổ. Chỉ tăng số con mỗi bầy, KHÔNG thêm bãi — bố cục (đường, bãi, lối, địa điểm) giữ nguyên với bản cũ.
			count: (k > 5 ? 7 : 6) + (boss ? 1 : 0),
		}));
		const [w, hh] = SIZES[i]!;
		maps.push({ id: h.id, name: h.name, seed: r.seed + k, w, h: hh, role: 'hunt', theme: h.theme, zones, treeMain: i, ...(boss ? { boss } : {}) });
		labels[h.id] = `${h.name} · cấp ${lo}–${boss ? Math.max(hi, boss.level) : hi}`;
	});
	maps.push({ id: r.sanctum.id, name: r.sanctum.name, seed: r.seed + 20, w: 32, h: 28, role: 'sanctum', theme: r.sanctum.theme, boss: r.sanctum.chief });
	labels[r.sanctum.id] = `${r.sanctum.name} · boss chúa · cấp ${r.sanctum.chief.level}`;
	if (r.dragon) {
		maps.push({ id: r.dragon.id, name: r.dragon.name, seed: r.seed + 30, w: 38, h: 32, role: 'lair', theme: r.dragon.theme, boss: r.dragon.boss });
		labels[r.dragon.id] = `${r.dragon.name} · rồng · cấp ${r.dragon.boss.level}`;
	}
	const links: [string, Edge, string][] = [
		['hub', 'S', H[0]!],
		[H[0]!, 'W', H[1]!],
		[H[1]!, 'W', H[2]!],
		[H[2]!, 'N', H[3]!],
		[H[3]!, 'E', H[4]!],
		[H[4]!, 'E', 'hub'],
		[H[4]!, 'N', H[5]!],
		[H[5]!, 'E', H[6]!],
		[H[6]!, 'S', 'hub'],
		[H[5]!, 'W', H[7]!],
		[H[7]!, 'S', H[3]!],
		[H[7]!, 'N', H[8]!],
		[H[8]!, 'N', H[9]!],
		[H[9]!, 'E', r.sanctum.id],
	];
	if (r.dragon) links.push([H[8]!, 'E', r.dragon.id]);
	return {
		region: r.region,
		levels: [r.L0, r.L0 + 10],
		start: 'hub',
		maps,
		links,
		labels,
		cross: [
			{ map: 'hub', edge: 'E', to: r.prev.to, toSpot: r.prev.toSpot, label: r.prev.label, spot: 'east_gate', spotName: 'Cổng vào vùng' },
			{ map: H[9]!, edge: 'W', to: r.next.to, toSpot: r.next.toSpot, label: r.next.label, spot: `${H[9]}_gate`, spotName: 'Lối ra khỏi vùng' },
		],
	};
}

/** Chủ đề gốc + đè vài trường. */
const theme = (base: KitTheme, o: Partial<KitTheme> = {}): KitTheme => ({ ...base, ...o });

// ———————————————————————————— Vùng 2 · Đầm lầy Mù Sương (cấp 10–20) ————————————————————————————

const MARSH: KitTheme = {
	biome: 'swamp',
	fill: 'g',
	road: 'd',
	trees: ['cypress', 'cypress_flip', 'cypress_deep', 'cypress_rust', 'dead_mossy', 'cypress', 'willow', 'mangrove', 'ghost_tree', 'willow'],
	treeDensity: 9,
	rocks: ['mossy_log', 'rotten_stump', 'moss_bush', 'dead_swamp_tree', 'rock_mossy', 'stump', 'moss_bush', 'exposed_roots', 'thorn_bush_swamp', 'pitcher_plant'],
	rockDensity: 5,
	flats: ['reeds', 'cattails', 'mud_puddle', 'reeds', 'pale_mushrooms', 'lily_pads', 'fern', 'reed_clump', 'water_lily', 'swamp_fern', 'frog_eggs', 'glow_moss'],
	flatDensity: 7,
	landmarks: ['mossy_pillar', 'serpent_head', 'vine_column', 'skull_stake', 'old_bones', 'glow_flower', 'rainbow_mushroom', 'hanging_vines'],
	water: 'ponds',
	sign: 'swamp_sign',
	decal: 'd1',
};
const SWAMPWOOD = theme(MARSH, {
	fill: 'f',
	trees: ['cypress', 'cypress_flip', 'cypress_deep', 'cypress_deep', 'dead_mossy_flip', 'cypress_rust', 'mangrove', 'ghost_tree', 'bamboo', 'willow'],
	treeDensity: 46,
	rockDensity: 6,
	flats: ['pale_mushrooms', 'glow_flower', 'mud_puddle', 'reeds', 'fern', 'hanging_vines', 'glow_moss', 'swamp_fern', 'rainbow_mushroom'],
	water: 'ponds',
});

export const SWAMP_REGION = standardRegion({
	region: 'swamp',
	L0: 10,
	seed: 20262000,
	hub: {
		name: 'Làng nhà sàn Lau Xám',
		theme: theme(MARSH, { treeDensity: 5, rockDensity: 2 }),
		hub: {
			buildings: ['stilt_house', 'healer_hut', 'stilt_house', 'watchtower', 'stilt_house', 'fisher_hut', 'longhouse'],
			homes: ['stilt_house', 'stilt_house_flip', 'fisher_hut', 'longhouse'],
			decor: ['fish_rack', 'clay_pot', 'pole_lantern', 'herb_basket', 'reed_bundle', 'canoe', 'mooring_post', 'bamboo_fence', 'net_rack', 'water_jar', 'cook_fire', 'dugout_canoe', 'chicken_coop', 'shell_chime', 'name_post'],
			plaza: 'd',
		},
	},
	mobs: [
		{ id: 'mob_poison_frog_001', herd: 'Bầy ếch độc' },
		{ id: 'mob_swamp_leech_001', herd: 'Ổ đỉa đầm' },
		{ id: 'mob_glow_mushroom_001', herd: 'Cụm nấm phát quang' },
		{ id: 'mob_water_snake_001', herd: 'Ổ rắn nước' },
		{ id: 'mob_mud_merfolk_001', herd: 'Trại người cá bùn' },
	],
	hunts: [
		{ id: 'reedbank', name: 'Bãi Lau Sậy', theme: MARSH },
		{ id: 'leechditch', name: 'Mương Đỉa', theme: SWAMPWOOD },
		{ id: 'mushroomwood', name: 'Rừng Ngập Nấm', theme: SWAMPWOOD },
		{ id: 'snakefen', name: 'Đầm Rắn Nước', theme: MARSH },
		{ id: 'mistshore', name: 'Bờ Sương', theme: theme(MARSH, { water: 'lakes' }) },
		{ id: 'reedmarsh', name: 'Lau Sậy Ngập', theme: MARSH },
		{ id: 'leechcanal', name: 'Kênh Đỉa', theme: SWAMPWOOD },
		{ id: 'glowhollow', name: 'Hõm Nấm Sáng', theme: SWAMPWOOD },
		{ id: 'serpentpool', name: 'Vũng Rắn Già', theme: theme(MARSH, { water: 'lakes' }) },
		{ id: 'mistchasm', name: 'Vực Sương Xanh', theme: SWAMPWOOD },
	],
	bosses: [
		{ at: 7, name: 'Ổ Mẹ Ếch', monster: 'boss_mother_frog_001', level: 17, ring: ['mossy_pillar', 'serpent_head', 'vine_column'], center: 'sunken_altar' },
		{ at: 10, name: 'Lều Phù Thuỷ Đầm', monster: 'boss_swamp_witch_001', level: 20, ring: ['skull_stake', 'mossy_pillar', 'dead_swamp_tree'], center: 'healer_hut' },
	],
	sanctum: {
		id: 'hydralake',
		name: 'Hồ Hydra',
		theme: theme(MARSH, { treeDensity: 14 }),
		chief: { name: 'Hồ Hydra', monster: 'boss_mud_hydra_001', level: 20, ring: ['mossy_pillar', 'serpent_head', 'vine_column', 'skull_stake'], center: 'sunken_altar' },
	},
	prev: { to: 'human/rivergate', toSpot: 'swamp_gate_vg', label: 'Hẻm Cửa Sông · Thung lũng Thistlewood' },
	next: { to: 'desert/hub', toSpot: 'east_gate', label: 'Sa mạc Hồng Cát · vùng 3 · cần cấp 20 + đã hạ Hydra bùn' },
});

// ———————————————————————————— Vùng 3 · Sa mạc Hồng Cát (cấp 20–30) ————————————————————————————

const DUNES: KitTheme = {
	biome: 'desert',
	fill: 'g',
	road: 'd',
	// Không cọ / dừa (chủ dự án 13/10/2026: "sao sa mạc lại có cây dừa — nhầm lẫn rồi"): cây cọ là loài của Quần đảo; sa mạc chỉ cây khô cằn.
	trees: ['acacia', 'acacia_flip', 'candelabra', 'candelabra_flip', 'dry_tree', 'dry_tree_flip', 'dead_bleached', 'dead_bleached_flip'],
	treeDensity: 2.5,
	rocks: ['red_rock', 'red_spire', 'saguaro', 'prickly_pear', 'agave', 'boulder', 'rock_outcrop', 'rock_spire', 'pale_rocks', 'red_outcrop', 'layered_rock', 'scorpion_burrow'],
	rockDensity: 5,
	flats: ['dry_shrub', 'bull_skull', 'dune_mound', 'cracked_earth', 'dune_mound', 'beast_skull', 'tumbleweed_d', 'desert_flower', 'snake_skeleton', 'sand_ripple'],
	flatDensity: 6,
	landmarks: ['obelisk', 'statue_head', 'stone_tablet', 'buried_urn', 'scarab_block', 'ribcage', 'column_fallen', 'ruin_wall', 'rock_arch', 'dry_well', 'carved_column'],
	water: 'none',
	sign: 'signpost',
};
const TOMBS = theme(DUNES, { road: 'c', rocks: ['red_rock', 'hiero_pillar', 'obelisk', 'statue_head', 'scarab_block', 'column_fallen', 'ruin_wall', 'boulder'], rockDensity: 6, landmarks: ['sarcophagus', 'hiero_pillar', 'torch_stand', 'stone_tablet', 'buried_urn', 'sphinx'] });

export const DESERT_REGION = standardRegion({
	region: 'desert',
	L0: 20,
	seed: 20263000,
	hub: {
		name: 'Thành ốc đảo Sahrin',
		theme: theme(DUNES, { water: 'ponds', treeDensity: 6 }),
		hub: {
			buildings: ['city_gate', 'dome_house', 'market_tent', 'dome_house', 'carpet_stall', 'dome_house', 'market_tent', 'palace_tower', 'adobe_house', 'pottery_stall', 'small_tent'],
			homes: ['dome_house', 'dome_house_flip', 'adobe_house', 'small_tent'],
			decor: ['amphorae', 'oasis_well', 'banner_pole', 'fruit_crates', 'brass_lantern', 'spice_basket', 'potted_palm', 'camel_saddle', 'carpet_rack', 'oasis_basin', 'lantern_pole', 'oil_jars', 'market_sign', 'hand_cart'],
			plaza: 'c',
		},
	},
	mobs: [
		{ id: 'mob_scorpion_001', herd: 'Hang bọ cạp' },
		{ id: 'mob_sand_snake_001', herd: 'Ổ rắn cát' },
		{ id: 'mob_mummy_001', herd: 'Hầm xác ướp' },
		{ id: 'mob_vulture_001', herd: 'Bầy kền kền' },
		{ id: 'mob_sand_spirit_001', herd: 'Lốc linh hồn cát' },
	],
	hunts: [
		{ id: 'reddunes', name: 'Cồn Cát Đỏ', theme: DUNES },
		{ id: 'snakegully', name: 'Khe Rắn', theme: theme(DUNES, { rockDensity: 9 }) },
		{ id: 'sandtombs', name: 'Lăng Mộ Cát', theme: TOMBS },
		{ id: 'vulturecliff', name: 'Vách Kền Kền', theme: theme(DUNES, { rockDensity: 10, rocks: ['red_rock', 'red_spire', 'red_rock'] }) },
		{ id: 'redruins', name: 'Phế tích Đá Đỏ', theme: TOMBS },
		{ id: 'scorchdunes', name: 'Cồn Cát Bỏng', theme: DUNES },
		{ id: 'snakepass', name: 'Hẻm Rắn', theme: theme(DUNES, { rockDensity: 10 }) },
		{ id: 'deeptombs', name: 'Mộ Đạo Sâu', theme: TOMBS },
		{ id: 'bonemesa', name: 'Cao Nguyên Xương', theme: theme(DUNES, { flats: ['bull_skull', 'skull_pile', 'cracked_earth', 'dry_shrub'] }) },
		{ id: 'sunkentemple', name: 'Đền Vùi Cát', theme: TOMBS },
	],
	bosses: [
		{ at: 7, name: 'Ổ Bọ Cạp Chúa', monster: 'boss_scorpion_queen_001', level: 27, ring: ['red_spire', 'red_rock', 'bull_skull'], center: 'statue_head' },
		{ at: 10, name: 'Điện Pharaoh', monster: 'boss_pharaoh_001', level: 30, ring: ['obelisk', 'hiero_pillar', 'torch_stand'], center: 'sphinx' },
	],
	sanctum: {
		id: 'devourpit',
		name: 'Hố Cát Nuốt',
		theme: theme(DUNES, { rockDensity: 8 }),
		chief: { name: 'Hố Cát Nuốt', monster: 'boss_sandworm_001', level: 30, ring: ['red_spire', 'red_rock', 'obelisk'], center: 'statue_head' },
	},
	prev: { to: 'swamp/mistchasm', toSpot: 'mistchasm_gate', label: 'Vực Sương Xanh · Đầm lầy Mù Sương' },
	next: { to: 'highland/hub', toSpot: 'east_gate', label: 'Cao nguyên Gió Hú · vùng 4 · cần cấp 30 + đã hạ Sâu cát khổng lồ' },
});

// ———————————————————————————— Vùng 4 · Cao nguyên Gió Hú (cấp 30–40) ————————————————————————————

const UPLAND: KitTheme = {
	biome: 'highland',
	fill: 'g',
	road: 'd',
	trees: ['wind_pine', 'wind_pine_flip', 'wind_pine_gold', 'wind_pine_dark', 'hl_oak', 'hl_oak_flip', 'hl_maple', 'hl_maple_flip', 'wind_pine', 'birch', 'red_oak', 'rhododendron', 'cliff_pine', 'birch'],
	treeDensity: 7,
	rocks: ['mossy_boulder', 'lichen_rock', 'cairn', 'heather', 'wind_shrub', 'rock_mossy', 'rock_gray', 'boulder', 'heather', 'wind_shrub', 'stump', 'flat_stones', 'small_mossy_rock', 'broken_stump', 'blueberry_bush'],
	rockDensity: 5,
	flats: ['tall_grass', 'highland_flowers', 'small_fern', 'tumbleweed', 'tall_grass', 'fern', 'wildflowers', 'wildflower_patch', 'pampas', 'highland_mushrooms', 'bird_nest'],
	flatDensity: 9,
	landmarks: ['cairn', 'prayer_flags', 'feather_totem', 'bird_statue', 'wind_spiral', 'stone_wall', 'flat_stones'],
	water: 'ponds',
	sign: 'windmill_sign',
	decal: 'd1',
};
const SKYRUINS = theme(UPLAND, {
	road: 'c',
	rocks: ['floating_rock', 'cloud_pillar', 'sky_column', 'wind_rune', 'mossy_boulder', 'cloud_pillar_float', 'wind_altar', 'rune_float'],
	landmarks: ['bird_statue', 'wind_spiral', 'cloud_bench', 'feather_totem', 'chime_arch', 'sky_column', 'ruin_wall', 'pillar_broken', 'bronze_bell', 'wind_spirit_statue', 'long_banner', 'incense_burner', 'chime_gate', 'floating_steps'],
	water: 'none',
});

export const HIGHLAND_REGION = standardRegion({
	region: 'highland',
	L0: 30,
	seed: 20264000,
	hub: {
		name: 'Làng Cối Xay Gió',
		theme: theme(UPLAND, { treeDensity: 4 }),
		hub: {
			buildings: ['stone_cottage', 'windmill', 'stone_cottage', 'stone_cottage', 'windmill', 'barn', 'chapel'],
			homes: ['stone_cottage', 'stone_cottage_flip', 'barn'],
			decor: ['hay_cart', 'prayer_flags', 'sheep_fence', 'skep', 'water_barrel', 'millstone', 'haystack', 'wool_basket', 'stone_wall'],
			plaza: 'c',
		},
	},
	mobs: [
		{ id: 'mob_wind_wolf_001', herd: 'Bầy sói gió' },
		{ id: 'mob_hawk_001', herd: 'Tổ chim ưng' },
		{ id: 'mob_wind_fairy_001', herd: 'Vòng tiên gió' },
		{ id: 'mob_flying_rock_001', herd: 'Cụm đá bay' },
		{ id: 'mob_wind_goblin_001', herd: 'Trại yêu tinh gió' },
	],
	hunts: [
		{ id: 'tallgrass', name: 'Đồi Cỏ Cao', theme: UPLAND },
		{ id: 'hawkslope', name: 'Dốc Chim Ưng', theme: theme(UPLAND, { rockDensity: 9 }) },
		{ id: 'fairyvale', name: 'Thung Lũng Tiên', theme: theme(UPLAND, { treeDensity: 14, flatDensity: 14, water: 'lakes' }) },
		{ id: 'floatstones', name: 'Bãi Đá Bay', theme: SKYRUINS },
		{ id: 'cloudpath', name: 'Đường Lên Đền Mây', theme: SKYRUINS },
		{ id: 'howlridge', name: 'Sống Đồi Gió Hú', theme: UPLAND },
		{ id: 'hawkcliff', name: 'Vách Chim Ưng', theme: theme(UPLAND, { rockDensity: 10, water: 'none' }) },
		{ id: 'fairyglade', name: 'Trảng Tiên Gió', theme: theme(UPLAND, { treeDensity: 16, flatDensity: 14 }) },
		{ id: 'skyshards', name: 'Mảnh Trời Vỡ', theme: SKYRUINS },
		{ id: 'cloudgate', name: 'Cổng Mây', theme: SKYRUINS },
	],
	bosses: [
		{ at: 7, name: 'Tổ Đại Bàng Bão', monster: 'boss_storm_eagle_001', level: 37, ring: ['cairn', 'feather_totem', 'lichen_rock'], center: 'bird_statue' },
		{ at: 10, name: 'Đàn Tế Gió', monster: 'boss_wind_mage_001', level: 40, ring: ['sky_column', 'wind_rune', 'cloud_pillar'], center: 'chime_arch' },
	],
	sanctum: {
		id: 'cloudtemple',
		name: 'Đền Trên Mây',
		theme: SKYRUINS,
		chief: { name: 'Đền Trên Mây', monster: 'boss_wind_drake_001', level: 40, ring: ['cloud_pillar', 'sky_column', 'wind_rune'], center: 'sky_shrine' },
	},
	dragon: {
		id: 'dragonpeak',
		name: 'Long Huyệt Tuyệt Vân',
		theme: SKYRUINS,
		boss: { name: 'Long Huyệt Tuyệt Vân', monster: 'dragon_wind_001', level: 40, ring: ['sky_column', 'cloud_pillar', 'wind_spiral'], center: 'chime_arch' },
	},
	prev: { to: 'desert/sunkentemple', toSpot: 'sunkentemple_gate', label: 'Đền Vùi Cát · Sa mạc Hồng Cát' },
	next: { to: 'tundra/hub', toSpot: 'east_gate', label: 'Lãnh nguyên Băng Giá · vùng 5 · cần cấp 40 + đã hạ Rồng gió' },
});

// ———————————————————————————— Vùng 5 · Lãnh nguyên Băng Giá (cấp 40–50) ————————————————————————————

const SNOWFIELD: KitTheme = {
	biome: 'snow',
	fill: 'g',
	road: 'd',
	trees: ['snow_pine', 'snow_pine_flip', 'frozen_pine', 'frozen_pine_flip', 'bare_tree', 'snow_pine', 'frost_cedar', 'winter_birch', 'crystal_tree', 'dwarf_pine'],
	treeDensity: 7,
	rocks: ['snow_boulder', 'ice_crystals', 'frost_stump', 'snow_log', 'icicle_bush', 'berry_bush', 'pine_sapling', 'boulder', 'rock_gray', 'pale_rocks', 'ice_spire', 'big_snow_boulder', 'purple_ice', 'icicles'],
	rockDensity: 5,
	flats: ['snowdrift', 'frozen_patch', 'snowdrift', 'snow_mound', 'ice_crevasse', 'frost_flower', 'frozen_bones'],
	flatDensity: 5,
	landmarks: ['ice_pillar', 'ice_stalagmites', 'frost_lantern', 'snow_grave', 'aether_vein', 'purple_ice', 'ice_spire'],
	water: 'none',
	sign: 'signpost',
};
const PINEWOOD = theme(SNOWFIELD, { fill: 'f', treeDensity: 44 });

export const TUNDRA_REGION = standardRegion({
	region: 'tundra',
	L0: 40,
	seed: 20265000,
	hub: {
		name: 'Làng gỗ Tuyết Phong',
		theme: theme(SNOWFIELD, { treeDensity: 5 }),
		hub: {
			buildings: ['log_cabin', 'log_cabin', 'log_cabin', 'log_cabin', 'log_cabin', 'hunting_lodge', 'smokehouse', 'hide_tent'],
			homes: ['log_cabin', 'log_cabin_flip', 'hide_tent', 'smokehouse'],
			decor: ['firewood', 'dog_sled', 'pelt_rack', 'ice_fishing', 'ski_rack', 'notice_board', 'ice_cart', 'campfire', 'snowy_firewood', 'totem', 'supply_sled', 'snowy_fence', 'fire_pit', 'fish_rack_snow', 'deco_snowman', 'oil_lamp'],
			plaza: 'c',
		},
	},
	mobs: [
		{ id: 'mob_snow_wolf_001', herd: 'Bầy sói tuyết' },
		{ id: 'mob_ice_wisp_001', herd: 'Đám tinh linh băng' },
		{ id: 'mob_snowman_001', herd: 'Nhóm người tuyết' },
		{ id: 'mob_war_penguin_001', herd: 'Đội cánh cụt chiến' },
		{ id: 'mob_ice_bear_001', herd: 'Hang gấu băng' },
	],
	hunts: [
		{ id: 'snowpines', name: 'Rừng Thông Tuyết', theme: PINEWOOD },
		{ id: 'frostmere', name: 'Hồ Sương Giá', theme: theme(SNOWFIELD, { water: 'lakes' }) },
		{ id: 'snowfield', name: 'Cánh Đồng Tuyết', theme: SNOWFIELD },
		{ id: 'icecoast', name: 'Bờ Biển Băng', theme: theme(SNOWFIELD, { water: 'coast', landmarks: ['icebound_ship', 'ice_crystals', 'snow_log'] }) },
		{ id: 'bearcave', name: 'Hang Gấu', theme: theme(SNOWFIELD, { rockDensity: 10, rocks: ['snow_boulder', 'ice_stalagmites', 'ice_crystals', 'stalagmite', 'crystal_blue', 'rock_pillar'], landmarks: ['bear_den', 'ice_stalagmites', 'aether_vein'] }) },
		{ id: 'wolfwood', name: 'Rừng Sói Tru', theme: PINEWOOD },
		{ id: 'icelake', name: 'Hồ Băng', theme: theme(SNOWFIELD, { water: 'lakes' }) },
		{ id: 'snowmanpass', name: 'Đèo Người Tuyết', theme: theme(SNOWFIELD, { rockDensity: 9 }) },
		{ id: 'penguinrocks', name: 'Ghềnh Cánh Cụt', theme: theme(SNOWFIELD, { water: 'coast', rockDensity: 8 }) },
		{ id: 'frozenhollow', name: 'Thung Băng Lặng', theme: theme(SNOWFIELD, { rocks: ['ice_pillar', 'ice_stalagmites', 'snow_boulder', 'frozen_falls'] }) },
	],
	bosses: [
		{ at: 7, name: 'Cung Băng Nữ Hoàng', monster: 'boss_ice_queen_001', level: 47, ring: ['ice_pillar', 'ice_crystals', 'frost_lantern'], center: 'frozen_falls' },
		{ at: 8, name: 'Hang Yeti', monster: 'boss_yeti_001', level: 48, ring: ['snow_boulder', 'ice_stalagmites', 'snow_log'], center: 'bear_den' },
	],
	sanctum: {
		id: 'icethrone',
		name: 'Ngai Băng',
		theme: theme(SNOWFIELD, { rocks: ['ice_pillar', 'ice_crystals'], water: 'lakes', road: 'c' }),
		chief: { name: 'Ngai Băng', monster: 'boss_ice_guardian_001', level: 50, ring: ['ice_pillar', 'frost_lantern', 'dragon_relief'], center: 'ice_throne_gate' },
	},
	dragon: {
		id: 'frostlair',
		name: 'Long Huyệt Hàn Sương',
		theme: theme(SNOWFIELD, { rocks: ['ice_stalagmites', 'ice_pillar', 'aether_vein'] }),
		boss: { name: 'Long Huyệt Hàn Sương', monster: 'dragon_ice_001', level: 50, ring: ['ice_pillar', 'ice_stalagmites', 'dragon_relief'], center: 'frozen_falls' },
	},
	prev: { to: 'highland/cloudgate', toSpot: 'cloudgate_gate', label: 'Cổng Mây · Cao nguyên Gió Hú' },
	next: { to: 'volcano/hub', toSpot: 'east_gate', label: 'Núi lửa Hoả Sơn · vùng 6 · cần cấp 50 + đã hạ Vệ thần Ngai Băng' },
});

// ———————————————————————————— Vùng 6 · Núi lửa Hoả Sơn (cấp 50–60) ————————————————————————————

const ASHLAND: KitTheme = {
	biome: 'volcanic',
	fill: 'g',
	road: 'c',
	trees: ['ash_tree', 'ash_tree_flip', 'ash_tree_cold', 'charred_tree', 'ash_tree_ember', 'ash_tree_ember_flip', 'ash_tree', 'ruby_tree', 'petrified_tree', 'fire_mushrooms', 'thorn_black'],
	treeDensity: 5,
	rocks: ['basalt', 'obsidian', 'lava_rock', 'sulfur', 'fumarole', 'basalt', 'cliff_rock', 'cliff_rock_flip', 'rock_spire', 'rock_outcrop', 'boulder', 'basalt_column', 'steam_vent', 'pumice', 'fire_vein', 'rock_slab', 'obsidian_boulder', 'fire_thorn'],
	rockDensity: 6,
	flats: ['fire_moss', 'ash_pile', 'fire_flower', 'ash_pile', 'skull_pile', 'bone_pile', 'ash_crater'],
	flatDensity: 6,
	landmarks: ['lava_pool', 'fumarole', 'dwarf_statue', 'hammer_head', 'sulfur_pool', 'basalt_column'],
	water: 'ponds',
	sign: 'signpost',
};
const FORGEWORKS = theme(ASHLAND, { water: 'none', landmarks: ['anvil', 'rune_anvil', 'rune_pillar', 'old_bellows', 'hammer_head', 'dwarf_statue', 'siphon_machine', 'coal_barrel', 'ore_cart', 'rail_track', 'iron_gate', 'ore_pile', 'smith_statue', 'workbench', 'hot_trough', 'kiln', 'armor_stand'] });

export const VOLCANO_REGION = standardRegion({
	region: 'volcano',
	L0: 50,
	seed: 20266000,
	hub: {
		name: 'Pháo đài Đe Đỏ',
		theme: theme(ASHLAND, { water: 'none', treeDensity: 2 }),
		hub: {
			buildings: ['fortress_gate', 'dwarf_house', 'great_forge', 'dwarf_house', 'refugee_tent', 'dwarf_house', 'refugee_tent', 'forge_shop', 'bastion'],
			homes: ['dwarf_house', 'dwarf_house_flip', 'refugee_tent'],
			decor: ['anvil', 'coal_barrel', 'weapon_rack', 'hot_ingots', 'quench_trough', 'field_cot', 'anvil_banner', 'fire_brazier', 'ore_cart', 'ore_pile', 'workbench', 'kiln', 'armor_stand', 'hot_trough'],
			plaza: 'c',
		},
	},
	mobs: [
		{ id: 'mob_lava_lizard_001', herd: 'Ổ thằn lằn lửa' },
		{ id: 'mob_lava_golem_001', herd: 'Cụm golem dung nham' },
		{ id: 'mob_fire_bat_001', herd: 'Đàn dơi lửa' },
		{ id: 'mob_fire_spirit_001', herd: 'Lửa tinh linh' },
		{ id: 'mob_fire_demon_001', herd: 'Bọn quỷ lửa' },
	],
	hunts: [
		{ id: 'blackrock', name: 'Bãi Đá Đen', theme: ASHLAND },
		{ id: 'lavaford', name: 'Bến Dung Nham', theme: theme(ASHLAND, { water: 'lakes' }) },
		{ id: 'batcave', name: 'Hang Dơi Lửa', theme: theme(ASHLAND, { rockDensity: 11, water: 'none', rocks: ['basalt', 'obsidian', 'stalagmite', 'crystal_purple', 'rock_pillar', 'lava_rock'] }) },
		{ id: 'oldforge', name: 'Lò Rèn Bỏ Hoang', theme: theme(FORGEWORKS, { landmarks: ['thunder_sword', 'rune_anvil', 'old_bellows', 'forge_altar', 'hammer_head'] }) },
		{ id: 'crater', name: 'Miệng Núi', theme: theme(ASHLAND, { water: 'lakes' }) },
		{ id: 'cinderflats', name: 'Bãi Tro Than', theme: ASHLAND },
		{ id: 'lavariver', name: 'Sông Dung Nham', theme: theme(ASHLAND, { water: 'lakes' }) },
		{ id: 'emberhollow', name: 'Hốc Than Hồng', theme: theme(ASHLAND, { rockDensity: 11, water: 'none', rocks: ['basalt', 'stalagmite', 'crystal_purple', 'rock_pillar', 'sulfur'] }) },
		{ id: 'runeforge', name: 'Xưởng Rune Cổ', theme: FORGEWORKS },
		{ id: 'craterrim', name: 'Vành Miệng Núi', theme: theme(ASHLAND, { water: 'lakes' }) },
	],
	bosses: [
		{ at: 7, name: 'Lò Golem Cổ', monster: 'boss_ancient_lava_golem_001', level: 57, ring: ['basalt', 'lava_rock', 'obsidian'], center: 'forge_altar' },
		{ at: 10, name: 'Hồ Salamander', monster: 'boss_salamander_001', level: 60, ring: ['fumarole', 'basalt', 'lava_pool'], center: 'dragon_head' },
	],
	sanctum: {
		id: 'volcanocore',
		name: 'Lõi Núi Lửa',
		theme: ASHLAND,
		chief: { name: 'Lõi Núi Lửa', monster: 'boss_fire_god_001', level: 60, ring: ['rune_pillar', 'basalt', 'siphon_machine'], center: 'forge_altar' },
	},
	dragon: {
		id: 'flamelair',
		name: 'Long Huyệt Viêm Đế',
		theme: ASHLAND,
		boss: { name: 'Long Huyệt Viêm Đế', monster: 'dragon_fire_001', level: 60, ring: ['basalt', 'obsidian', 'rune_pillar'], center: 'dragon_head' },
	},
	prev: { to: 'tundra/frozenhollow', toSpot: 'frozenhollow_gate', label: 'Thung Băng Lặng · Lãnh nguyên Băng Giá' },
	next: { to: 'isles/hub', toSpot: 'east_gate', label: 'Quần đảo San Hô · vùng 7 · cần cấp 60 + đã hạ Hoả thần' },
});

// ———————————————————————————— Vùng 7 · Quần đảo San Hô (cấp 60–70) ————————————————————————————

const BEACH: KitTheme = {
	biome: 'beach',
	fill: 'g',
	road: 'd',
	trees: ['palm_tropic', 'palm_tropic_flip', 'palm_lush', 'palm_lush', 'leaning_palm', 'sea_almond', 'morning_glory', 'coast_mangrove'],
	treeDensity: 5,
	rocks: ['beach_rock', 'brain_coral', 'pink_coral', 'sea_fan', 'giant_clam', 'coconut_palm', 'rock_gray', 'beach_bush', 'agave', 'spiral_shell', 'oyster_rock', 'whale_ribs'],
	rockDensity: 5,
	flats: ['starfish', 'urchin', 'kelp', 'net_pile', 'ship_planks', 'seaweed_pile', 'gull_nest', 'life_ring', 'net_heap', 'turtle_shell'],
	flatDensity: 6,
	landmarks: ['anchor', 'buoy', 'lobster_trap', 'fish_barrel', 'cannon', 'crate', 'barrel', 'rowboat', 'mooring_post', 'flagpole', 'barrel_stack', 'hook_rack', 'small_rowboat', 'rusty_anchor'],
	water: 'coast',
	sign: 'signpost',
};
const WRECKS = theme(BEACH, { landmarks: ['ship_wheel', 'cannon', 'rune_chest', 'gull_figurehead', 'ghost_lantern_brass', 'ship_planks', 'rusty_anchor', 'whale_ribs'], rocks: ['beach_rock', 'abyss_spire', 'brain_coral'] });

export const ISLES_REGION = standardRegion({
	region: 'isles',
	L0: 60,
	seed: 20267000,
	hub: {
		name: 'Cảng chài San Hô',
		theme: theme(BEACH, { treeDensity: 6 }),
		hub: {
			buildings: ['fisher_cottage', 'boat_workshop', 'fisher_cottage', 'fisher_cottage', 'fishing_pier', 'lighthouse', 'tavern', 'harbor_shed', 'lookout_hut'],
			homes: ['fisher_cottage', 'fisher_cottage_flip', 'harbor_shed'],
			decor: ['lobster_trap', 'anchor', 'fish_barrel', 'buoy', 'fish_crates', 'fish_rack', 'salt_crate', 'barrel_stack', 'hook_rack', 'beacon_post', 'small_rowboat', 'rusty_anchor', 'mooring_piles'],
			plaza: 'd',
		},
	},
	mobs: [
		{ id: 'mob_beach_crab_001', herd: 'Bãi cua' },
		{ id: 'mob_reef_jellyfish_001', herd: 'Đàn sứa' },
		{ id: 'mob_pirate_001', herd: 'Toán cướp biển' },
		{ id: 'mob_coral_merfolk_001', herd: 'Trại người cá' },
		{ id: 'mob_wreck_octopus_001', herd: 'Ổ bạch tuộc' },
	],
	hunts: [
		{ id: 'whitesands', name: 'Bãi Cát Trắng', theme: BEACH },
		{ id: 'shallowreef', name: 'Rạn Nông', theme: theme(BEACH, { water: 'ponds', rockDensity: 8 }) },
		{ id: 'piratecove', name: 'Vịnh Cướp Biển', theme: theme(BEACH, { landmarks: ['cannon', 'rune_chest', 'fish_crates', 'salt_crate', 'anchor'] }) },
		{ id: 'merlagoon', name: 'Phá Người Cá', theme: theme(BEACH, { water: 'lakes' }) },
		{ id: 'wreckshore', name: 'Bờ Ván Vỡ', theme: WRECKS },
		{ id: 'crabbeach', name: 'Bãi Cua', theme: BEACH },
		{ id: 'coralreef', name: 'Rạn San Hô', theme: theme(BEACH, { water: 'ponds', rockDensity: 9 }) },
		{ id: 'pirateisle', name: 'Đảo Cướp Biển', theme: theme(BEACH, { treeDensity: 14, landmarks: ['cannon', 'rune_chest', 'anchor', 'ship_wheel'] }) },
		{ id: 'merfolkmarsh', name: 'Đầm Người Cá', theme: theme(BEACH, { water: 'lakes', treeDensity: 8 }) },
		{ id: 'wreckyard', name: 'Bãi Tàu Đắm', theme: WRECKS },
	],
	bosses: [
		{ at: 7, name: 'Hang Cua Chúa', monster: 'boss_crab_king_001', level: 67, ring: ['brain_coral', 'pink_coral', 'beach_rock'], center: 'giant_clam' },
		{ at: 10, name: 'Xác Tàu Ma', monster: 'boss_ghost_captain_001', level: 70, ring: ['ghost_lantern_brass', 'ship_wheel', 'cannon'], center: 'gull_wreck' },
	],
	sanctum: {
		id: 'krakenabyss',
		name: 'Vực Kraken',
		theme: WRECKS,
		chief: { name: 'Vực Kraken', monster: 'boss_kraken_001', level: 70, ring: ['abyss_spire', 'gull_figurehead', 'red_machine'], center: 'gull_wreck' },
	},
	dragon: {
		id: 'tidelair',
		name: 'Long Huyệt Thương Hải',
		theme: BEACH,
		boss: { name: 'Long Huyệt Thương Hải', monster: 'dragon_water_001', level: 70, ring: ['brain_coral', 'abyss_spire', 'pink_coral'], center: 'giant_clam' },
	},
	prev: { to: 'volcano/craterrim', toSpot: 'craterrim_gate', label: 'Vành Miệng Núi · Núi lửa Hoả Sơn' },
	next: { to: 'fungal/hub', toSpot: 'east_gate', label: 'Rừng Nấm Ngầm · vùng 8 · đang xây dựng' },
});

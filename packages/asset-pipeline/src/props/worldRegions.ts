import type { RecolorRule } from '../normalize/recolor.js';
import { HUMAN_KINGDOM_PROPS, PIXELLAB_PREFIX, type PropDef } from './humanKingdom.js';

/**
 * Đồ vật vùng 2–7 (dựng map 10/10/2026): mỗi vùng một bộ — 4 công trình / cây PixelLab nhìn thẳng (`objects/<vùng>_*`) + 3 tấm 3×3
 * (`sheets/<mã>*`, đề bài liệt kê 9 món theo thứ tự ô trong `<tấm>.png.json` — đã soi từng ô khớp thứ tự khai dưới). Tấm có bản
 * `_r2` (vẽ lại) thì dùng bản `_r2`. Mỗi vùng mượn thêm vài món chung của vùng 1 (biển chỉ đường, đá rune làm cột dịch chuyển…)
 * — atlas đồ vật dựng riêng từng vùng nên món mượn được cắt lại vào atlas vùng đó.
 * `footprint` / `blocks`: như `humanKingdom.ts` (vùng chân chặn đường tính từ mép dưới; `flower` = cảnh nền đi xuyên).
 */
const PL = PIXELLAB_PREFIX;
const cell = (sheet: string, index: number): string => `sheet:${sheet}#${index}@3x3`;

const shared = (...ids: string[]): PropDef[] =>
	ids.map((id) => {
		const def = HUMAN_KINGDOM_PROPS.find((p) => p.id === id);
		if (!def) throw new Error(`Không có đồ vật chung "${id}" ở vùng 1`);
		return def;
	});

/** Cây (gốc chặn, tán chồng nhau được) + bản lật gương. */
const tree = (id: string, obj: string): PropDef[] => [
	{ id, path: `${PL}${obj}`, kind: 'tree', footprint: { w: 0.16, h: 14 }, blocks: true },
	{ id: `${id}_flip`, path: `${PL}${obj}`, kind: 'tree', footprint: { w: 0.16, h: 14 }, blocks: true, flip: true },
];

/**
 * Biến thể cây ĐỔI MÀU từ cùng một ảnh (chủ dự án 10/10/2026: "hơi ít loại cây cối" — chưa có lượt vẽ thì đổi màu ảnh có sẵn
 * như cây lá thu vùng 1, không tốn lượt PixelLab). `flip` để cùng một rừng không lặp hình.
 */
const recolored = (id: string, obj: string, recolor: RecolorRule[], flip = false): PropDef => ({
	id,
	path: obj.startsWith('sheet:') || obj.startsWith(PL) ? obj : `${PL}${obj}`,
	kind: 'tree',
	footprint: { w: 0.16, h: 14 },
	blocks: true,
	recolor,
	...(flip ? { flip } : {}),
});

/** Lá cây xanh (vàng lục → lam lục) đổi sang tông `hueTo` theo độ sáng. */
const leaves = (name: string, from: [number, number], hueTo: [number, number], saturation = 1.2, lightness = 1): RecolorRule => ({
	kind: 'hsl',
	name,
	hue: from,
	minSat: 0.12,
	hueTo,
	saturation,
	lightness,
});
/** Công trình: ảnh rời PixelLab (`obj` = tên thư mục) hoặc ô lớn của tấm (`sheet:…`). */
const building = (id: string, obj: string, w = 0.86, h = 58): PropDef => ({ id, path: obj.startsWith('sheet:') ? obj : `${PL}${obj}`, kind: 'building', footprint: { w, h }, blocks: true });
/** Nhà ở dùng làm nhà dân (vòng nhà ngoài của trạm): bản gốc + bản lật gương `<id>_flip` cho làng khỏi lặp (0 lượt vẽ). */
const home = (id: string, obj: string, w = 0.86, h = 58): PropDef[] => {
	const b = building(id, obj, w, h);
	return [b, { ...b, id: `${id}_flip`, flip: true }];
};
const rock = (id: string, path: string, w = 0.7, h = 16): PropDef => ({ id, path, kind: 'rock', footprint: { w, h }, blocks: true });
const decor = (id: string, path: string, w = 0.8, h = 14): PropDef => ({ id, path, kind: 'decor', footprint: { w, h }, blocks: true });
const bush = (id: string, path: string): PropDef => ({ id, path, kind: 'bush', footprint: { w: 0.6, h: 12 }, blocks: true });
const flat = (id: string, path: string): PropDef => ({ id, path, kind: 'flower', footprint: { w: 0, h: 0 }, blocks: false });

const SW1 = (i: number) => cell('SW1_swamp_nature', i);
const SW2 = (i: number) => cell('SW2_swamp_village', i);
const SW3 = (i: number) => cell('SW3_swamp_ruins', i);
export const SWAMP_PROPS: PropDef[] = [
	...tree('cypress', 'swamp_cypress_tree'),
	recolored('cypress_deep', 'swamp_cypress_tree', [leaves('rêu lục sẫm', [40, 120], [95, 150], 1.1, 0.85)], true),
	recolored('cypress_rust', 'swamp_cypress_tree', [leaves('rêu úa', [40, 120], [18, 44], 1.4, 1.02)]),
	// Cây riêng của vùng (11/10/2026 — chủ dự án: "cây các vùng giống nhau quá, mỗi vùng 1 style riêng"): bản tô màu lại thay loài đang
	// dùng chung với vùng khác (0 lượt vẽ; ke-hoach-the-gioi 5.6).
	recolored('dead_mossy', `${PL}tree_dead`, [leaves('gỗ mục rêu', [0, 360], [78, 104], 0.55, 0.82)]),
	recolored('dead_mossy_flip', `${PL}tree_dead`, [leaves('gỗ mục rêu', [0, 360], [78, 104], 0.55, 0.82)], true),
	...home('stilt_house', 'swamp_stilt_house', 0.8, 40),
	building('healer_hut', 'swamp_healer_hut', 0.8, 44),
	building('watchtower', 'swamp_watchtower', 0.6, 30),
	flat('reeds', SW1(0)),
	flat('cattails', SW1(1)),
	flat('lily_pads', SW1(2)),
	rock('mossy_log', SW1(3), 0.85, 14),
	flat('mud_puddle', SW1(4)),
	flat('pale_mushrooms', SW1(5)),
	rock('rotten_stump', SW1(6), 0.6, 14),
	bush('moss_bush', SW1(7)),
	decor('sunken_boat', SW1(8), 0.85, 14),
	flat('plank_walk', SW2(0)),
	decor('mooring_post', SW2(1), 0.4, 10),
	decor('fish_rack', SW2(2), 0.8, 12),
	decor('clay_pot', SW2(3), 0.7, 12),
	decor('pole_lantern', SW2(4), 0.3, 8),
	decor('swamp_sign', SW2(5), 0.3, 10),
	decor('canoe', SW2(6), 0.6, 12),
	decor('herb_basket', SW2(7), 0.75, 12),
	decor('reed_bundle', SW2(8), 0.6, 12),
	rock('mossy_pillar', SW3(0), 0.6, 16),
	building('sunken_altar', SW3(1), 0.9, 22),
	flat('old_bones', SW3(2)),
	flat('glow_flower', SW3(3)),
	rock('serpent_head', SW3(4), 0.7, 16),
	rock('vine_column', SW3(5), 0.9, 12),
	flat('poison_puddle', SW3(6)),
	decor('skull_stake', SW3(7), 0.3, 8),
	rock('dead_swamp_tree', SW3(8), 0.3, 12),
	...shared('rune_stone', 'stone_lantern', 'signpost', 'tree_dead', 'tree_dead_flip', 'bush', 'fern', 'rock_mossy', 'stump', 'dead_bush', 'reed_clump', 'rowboat'),
	// Đợt vẽ thêm 10/10/2026 (chủ dự án: "hơi ít loại cây cối và đồ vật") — món chưa vẽ xong thì bộ dựng tự bỏ qua.
	...tree('mangrove', 'swamp_mangrove'),
	...tree('willow', 'swamp_willow'),
	...tree('ghost_tree', 'swamp_ghost_tree'),
	...tree('bamboo', 'swamp_bamboo'),
	building('fisher_hut', 'swamp_fisher_hut', 0.8, 40),
	building('longhouse', 'swamp_longhouse', 0.86, 44),
	flat('water_lily', cell('SW4_swamp_flora', 0)),
	bush('pitcher_plant', cell('SW4_swamp_flora', 1)),
	flat('swamp_fern', cell('SW4_swamp_flora', 2)),
	flat('hanging_vines', cell('SW4_swamp_flora', 3)),
	rock('exposed_roots', cell('SW4_swamp_flora', 4), 0.7, 12),
	bush('thorn_bush_swamp', cell('SW4_swamp_flora', 5)),
	flat('frog_eggs', cell('SW4_swamp_flora', 6)),
	flat('glow_moss', cell('SW4_swamp_flora', 7)),
	decor('rainbow_mushroom', cell('SW4_swamp_flora', 8), 0.5, 10),
	flat('boardwalk', cell('SW5_swamp_hamlet', 0)),
	decor('bamboo_fence', cell('SW5_swamp_hamlet', 1), 1, 10),
	decor('net_rack', cell('SW5_swamp_hamlet', 2), 0.85, 12),
	decor('water_jar', cell('SW5_swamp_hamlet', 3), 0.7, 12),
	decor('cook_fire', cell('SW5_swamp_hamlet', 4), 0.7, 10),
	decor('dugout_canoe', cell('SW5_swamp_hamlet', 5), 0.8, 12),
	decor('chicken_coop', cell('SW5_swamp_hamlet', 6), 0.8, 14),
	decor('shell_chime', cell('SW5_swamp_hamlet', 7), 0.3, 8),
	decor('name_post', cell('SW5_swamp_hamlet', 8), 0.3, 10),
];

const DS1 = (i: number) => cell('DS1_desert_nature', i);
const DS2 = (i: number) => cell('DS2_desert_city', i);
const DS3 = (i: number) => cell('DS3_desert_tomb', i);
export const DESERT_PROPS: PropDef[] = [
	...tree('palm', 'desert_palm_tree'),
	recolored('palm_dry', 'desert_palm_tree', [leaves('lá cọ khô', [60, 180], [30, 52], 1.3, 1.05)], true),
	// Cây riêng của vùng (11/10/2026 — chủ dự án: "cây các vùng giống nhau quá, mỗi vùng 1 style riêng"): bản tô màu lại thay loài đang
	// dùng chung với vùng khác (0 lượt vẽ; ke-hoach-the-gioi 5.6).
	recolored('dead_bleached', `${PL}tree_dead`, [leaves('gỗ bạc nắng', [0, 360], [30, 42], 0.25, 1.38)]),
	recolored('dead_bleached_flip', `${PL}tree_dead`, [leaves('gỗ bạc nắng', [0, 360], [30, 42], 0.25, 1.38)], true),
	building('city_gate', 'desert_city_gate', 0.9, 40),
	...home('dome_house', 'desert_dome_house', 0.86, 56),
	building('market_tent', 'desert_market_tent', 0.86, 40),
	bush('saguaro', DS1(0)),
	bush('prickly_pear', DS1(1)),
	flat('dry_shrub', DS1(2)),
	rock('red_rock', DS1(3), 0.8, 18),
	flat('bull_skull', DS1(4)),
	flat('dune_mound', DS1(5)),
	bush('agave', DS1(6)),
	flat('cracked_earth', DS1(7)),
	rock('red_spire', DS1(8), 0.5, 14),
	decor('amphorae', DS2(0), 0.8, 14),
	building('carpet_stall', DS2(1), 0.86, 26),
	decor('oasis_well', DS2(2), 0.8, 22),
	decor('banner_pole', DS2(3), 0.3, 8),
	decor('fruit_crates', DS2(4), 0.85, 14),
	decor('brass_lantern', DS2(5), 0.4, 10),
	decor('spice_basket', DS2(6), 0.8, 12),
	decor('potted_palm', DS2(7), 0.6, 12),
	decor('camel_saddle', DS2(8), 0.8, 14),
	rock('sarcophagus', DS3(0), 0.7, 14),
	rock('obelisk', DS3(1), 0.6, 14),
	building('sphinx', DS3(2), 0.9, 22),
	rock('hiero_pillar', DS3(3), 0.6, 14),
	decor('buried_urn', DS3(4), 0.7, 12),
	rock('stone_tablet', DS3(5), 0.7, 12),
	rock('statue_head', DS3(6), 0.8, 16),
	rock('scarab_block', DS3(7), 0.8, 16),
	decor('torch_stand', DS3(8), 0.4, 10),
	...shared('rune_stone', 'signpost', 'skull_pile', 'tree_dead', 'boulder', 'rock_outcrop', 'rock_spire', 'pale_rocks', 'beast_skull', 'ribcage', 'dead_stump', 'column_fallen', 'ruin_wall'),
	// Đợt vẽ thêm 10/10/2026 — món chưa vẽ xong thì bộ dựng tự bỏ qua.
	...tree('acacia', 'desert_acacia'),
	...tree('candelabra', 'desert_candelabra'),
	...tree('date_trio', 'desert_date_trio'),
	...tree('dry_tree', 'desert_dry_tree'),
	building('palace_tower', 'desert_palace_tower', 0.8, 50),
	building('adobe_house', 'desert_adobe_house', 0.86, 52),
	{ id: 'rock_arch', path: cell('DS4_desert_wilds', 0), kind: 'building', footprint: { w: 0, h: 0 }, blocks: false },
	rock('red_outcrop', cell('DS4_desert_wilds', 1), 0.85, 20),
	flat('tumbleweed_d', cell('DS4_desert_wilds', 2)),
	flat('desert_flower', cell('DS4_desert_wilds', 3)),
	flat('snake_skeleton', cell('DS4_desert_wilds', 4)),
	rock('scorpion_burrow', cell('DS4_desert_wilds', 5), 0.7, 12),
	flat('sand_ripple', cell('DS4_desert_wilds', 6)),
	decor('dry_well', cell('DS4_desert_wilds', 7), 0.8, 16),
	rock('layered_rock', cell('DS4_desert_wilds', 8), 0.85, 18),
	building('pottery_stall', cell('DS5_desert_bazaar', 0), 0.86, 24),
	decor('carpet_rack', cell('DS5_desert_bazaar', 1), 0.85, 12),
	building('small_tent', cell('DS5_desert_bazaar', 2), 0.86, 24),
	rock('carved_column', cell('DS5_desert_bazaar', 3), 0.5, 12),
	decor('oasis_basin', cell('DS5_desert_bazaar', 4), 0.85, 16),
	decor('lantern_pole', cell('DS5_desert_bazaar', 5), 0.3, 8),
	decor('oil_jars', cell('DS5_desert_bazaar', 6), 0.8, 14),
	decor('market_sign', cell('DS5_desert_bazaar', 7), 0.3, 10),
	decor('hand_cart', cell('DS5_desert_bazaar', 8), 0.85, 14),
];

const HL1 = (i: number) => cell('HL1_highland_nature', i);
const HL2 = (i: number) => cell('HL2_highland_village', i);
const HL3 = (i: number) => cell('HL3_sky_ruins', i);
export const HIGHLAND_PROPS: PropDef[] = [
	...tree('wind_pine', 'highland_wind_pine'),
	recolored('wind_pine_gold', 'highland_wind_pine', [leaves('thông vàng thu', [60, 170], [28, 50], 1.3, 1.05)], true),
	recolored('wind_pine_dark', 'highland_wind_pine', [leaves('thông sẫm', [60, 170], [120, 165], 1, 0.85)]),
	// Cây riêng của vùng (11/10/2026 — chủ dự án: "cây các vùng giống nhau quá, mỗi vùng 1 style riêng"): bản tô màu lại thay loài đang
	// dùng chung với vùng khác (0 lượt vẽ; ke-hoach-the-gioi 5.6).
	recolored('hl_oak', 'tree_oak_front', [leaves('sồi lục lam', [50, 160], [150, 172], 1.1, 0.92)]),
	recolored('hl_oak_flip', 'tree_oak_front', [leaves('sồi lục lam', [50, 160], [150, 172], 1.1, 0.92)], true),
	recolored('hl_maple', 'tree_oak_front', [leaves('phong đỏ', [50, 160], [0, 14], 1.7, 0.98)]),
	recolored('hl_maple_flip', 'tree_oak_front', [leaves('phong đỏ', [50, 160], [0, 14], 1.7, 0.98)], true),
	...home('stone_cottage', 'highland_cottage', 0.86, 56),
	building('windmill', 'highland_windmill', 0.7, 50),
	building('sky_shrine', 'highland_sky_shrine', 0.9, 30),
	flat('tall_grass', HL1(0)),
	bush('wind_shrub', HL1(1)),
	rock('mossy_boulder', HL1(2), 0.8, 20),
	flat('highland_flowers', HL1(3)),
	flat('small_fern', HL1(4)),
	rock('cairn', HL1(5), 0.6, 14),
	bush('heather', HL1(6)),
	flat('tumbleweed', HL1(7)),
	rock('lichen_rock', HL1(8), 0.8, 18),
	decor('hay_cart', HL2(0), 0.85, 16),
	decor('prayer_flags', HL2(1), 0.9, 8),
	decor('sheep_fence', HL2(2), 1, 10),
	decor('skep', HL2(3), 0.7, 12),
	decor('water_barrel', HL2(4), 0.75, 14),
	decor('millstone', HL2(5), 0.8, 12),
	decor('haystack', HL2(6), 0.85, 18),
	decor('wool_basket', HL2(7), 0.75, 12),
	decor('windmill_sign', HL2(8), 0.3, 10),
	rock('floating_rock', HL3(0), 0.6, 10),
	rock('cloud_pillar', HL3(1), 0.6, 16),
	building('chime_arch', HL3(2), 0.9, 14),
	rock('bird_statue', HL3(3), 0.6, 14),
	rock('wind_spiral', HL3(4), 0.6, 14),
	decor('cloud_bench', HL3(5), 0.85, 12),
	decor('feather_totem', HL3(6), 0.3, 10),
	rock('sky_column', HL3(7), 0.6, 14),
	rock('wind_rune', HL3(8), 0.6, 14),
	...shared('rune_stone', 'signpost', 'tree', 'tree_flip', 'tree_autumn', 'tree_pine_dry', 'tree_pine_dry_flip', 'rock_mossy', 'rock_gray', 'bush', 'bush_flower', 'fern', 'wildflowers', 'boulder', 'ruin_wall', 'pillar_broken', 'stump'),
	// Đợt vẽ thêm 10/10/2026 — món chưa vẽ xong thì bộ dựng tự bỏ qua.
	...tree('birch', 'highland_birch'),
	...tree('red_oak', 'highland_red_oak'),
	...tree('rhododendron', 'highland_rhododendron'),
	...tree('cliff_pine', 'highland_cliff_pine'),
	building('barn', 'highland_barn', 0.86, 56),
	building('chapel', 'highland_chapel', 0.8, 56),
	flat('wildflower_patch', cell('HL4_highland_meadow', 0)),
	rock('flat_stones', cell('HL4_highland_meadow', 1), 0.6, 12),
	bush('blueberry_bush', cell('HL4_highland_meadow', 2)),
	flat('pampas', cell('HL4_highland_meadow', 3)),
	rock('small_mossy_rock', cell('HL4_highland_meadow', 4), 0.7, 12),
	flat('highland_mushrooms', cell('HL4_highland_meadow', 5)),
	flat('bird_nest', cell('HL4_highland_meadow', 6)),
	rock('broken_stump', cell('HL4_highland_meadow', 7), 0.6, 12),
	decor('stone_wall', cell('HL4_highland_meadow', 8), 1, 10),
	rock('cloud_pillar_float', cell('HL5_cloud_shrine', 0), 0.5, 10),
	decor('floating_steps', cell('HL5_cloud_shrine', 1), 0.7, 10),
	decor('bronze_bell', cell('HL5_cloud_shrine', 2), 0.8, 12),
	rock('wind_altar', cell('HL5_cloud_shrine', 3), 0.7, 14),
	rock('wind_spirit_statue', cell('HL5_cloud_shrine', 4), 0.6, 14),
	decor('long_banner', cell('HL5_cloud_shrine', 5), 0.3, 8),
	decor('incense_burner', cell('HL5_cloud_shrine', 6), 0.6, 10),
	{ id: 'chime_gate', path: cell('HL5_cloud_shrine', 7), kind: 'building', footprint: { w: 0, h: 0 }, blocks: false },
	rock('rune_float', cell('HL5_cloud_shrine', 8), 0.5, 10),
];

const IC1 = (i: number) => cell('IC1_ice_nature', i);
const IC2 = (i: number) => cell('IC2_snow_village_r2', i);
const IC3 = (i: number) => cell('IC3_ice_sanctum', i);
export const TUNDRA_PROPS: PropDef[] = [
	...tree('snow_pine', 'snow_pine_tree'),
	// Thông khô vùng 1 nhuộm xám lam = thông đóng băng; cây chết vùng 1 = cây trơ cành mùa đông.
	recolored('frozen_pine', `${PL}tree_pine_dry`, [leaves('thông đóng băng', [0, 360], [192, 214], 0.45, 1.18)]),
	recolored('frozen_pine_flip', `${PL}tree_pine_dry`, [leaves('thông đóng băng', [0, 360], [192, 214], 0.45, 1.18)], true),
	recolored('bare_tree', `${PL}tree_dead`, [leaves('cành băng', [0, 360], [200, 220], 0.35, 1.2)]),
	...home('log_cabin', 'snow_log_cabin', 0.86, 56),
	building('ice_throne_gate', 'snow_ice_throne_gate', 0.9, 40),
	building('icebound_ship', 'snow_icebound_ship', 0.75, 40),
	bush('pine_sapling', IC1(0)),
	bush('icicle_bush', IC1(1)),
	rock('snow_boulder', IC1(2), 0.8, 18),
	rock('ice_crystals', IC1(3), 0.7, 14),
	flat('snowdrift', IC1(4)),
	rock('frost_stump', IC1(5), 0.6, 14),
	flat('frozen_patch', IC1(6)),
	bush('berry_bush', IC1(7)),
	rock('snow_log', IC1(8), 0.85, 12),
	decor('firewood', IC2(0), 0.85, 14),
	decor('dog_sled', IC2(1), 0.85, 12),
	decor('pelt_rack', IC2(2), 0.85, 12),
	decor('ice_fishing', IC2(3), 0.7, 10),
	decor('ski_rack', IC2(4), 0.85, 12),
	decor('notice_board', IC2(5), 0.8, 12),
	decor('ice_cart', IC2(6), 0.85, 14),
	decor('ice_waystone', IC2(7), 0.6, 14),
	decor('campfire', IC2(8), 0.8, 12),
	rock('ice_pillar', IC3(0), 0.6, 16),
	rock('ice_stalagmites', IC3(1), 0.7, 14),
	rock('haven_vein', IC3(2), 0.8, 18),
	rock('dragon_relief', IC3(3), 0.85, 14),
	decor('frost_lantern', IC3(4), 0.5, 10),
	building('frozen_falls', IC3(5), 0.85, 20),
	flat('bear_den', IC3(6)),
	decor('snow_grave', IC3(7), 0.7, 10),
	decor('red_stake', IC3(8), 0.3, 8),
	...shared('rune_stone', 'signpost', 'boulder', 'rock_gray', 'pale_rocks', 'stalagmite', 'crystal_blue', 'rock_pillar'),
	// Đợt vẽ thêm 10/10/2026 — món chưa vẽ xong thì bộ dựng tự bỏ qua.
	...tree('frost_cedar', 'tundra_frost_cedar'),
	...tree('winter_birch', 'tundra_winter_birch'),
	...tree('crystal_tree', 'tundra_crystal_tree'),
	...tree('dwarf_pine', 'tundra_dwarf_pine'),
	building('hunting_lodge', 'tundra_hunting_lodge', 0.86, 56),
	building('smokehouse', 'tundra_smokehouse', 0.8, 44),
	rock('ice_floe', cell('IC4_frozen_wilds', 0), 0.8, 12),
	rock('ice_spire', cell('IC4_frozen_wilds', 1), 0.5, 14),
	rock('big_snow_boulder', cell('IC4_frozen_wilds', 2), 0.85, 20),
	rock('purple_ice', cell('IC4_frozen_wilds', 3), 0.7, 14),
	flat('snow_mound', cell('IC4_frozen_wilds', 4)),
	flat('ice_crevasse', cell('IC4_frozen_wilds', 5)),
	flat('frost_flower', cell('IC4_frozen_wilds', 6)),
	rock('icicles', cell('IC4_frozen_wilds', 7), 0.6, 12),
	flat('frozen_bones', cell('IC4_frozen_wilds', 8)),
	building('hide_tent', cell('IC5_snow_camp', 0), 0.86, 24),
	decor('snowy_firewood', cell('IC5_snow_camp', 1), 0.85, 14),
	decor('totem', cell('IC5_snow_camp', 2), 0.3, 10),
	decor('supply_sled', cell('IC5_snow_camp', 3), 0.85, 12),
	decor('snowy_fence', cell('IC5_snow_camp', 4), 1, 10),
	decor('fire_pit', cell('IC5_snow_camp', 5), 0.8, 12),
	decor('fish_rack_snow', cell('IC5_snow_camp', 6), 0.85, 12),
	decor('deco_snowman', cell('IC5_snow_camp', 7), 0.6, 12),
	decor('oil_lamp', cell('IC5_snow_camp', 8), 0.3, 8),
];

const VL1 = (i: number) => cell('VL1_volcano_nature', i);
const VL2 = (i: number) => cell('VL2_dwarf_fortress_r2', i);
const VL3 = (i: number) => cell('VL3_volcano_core', i);
export const VOLCANO_PROPS: PropDef[] = [
	...tree('ash_tree', 'volcano_ash_tree'),
	recolored('ash_tree_cold', 'volcano_ash_tree', [leaves('than nguội', [280, 40], [10, 20], 0.15, 0.7)], true),
	recolored('charred_tree', `${PL}tree_dead`, [leaves('cháy đen', [0, 360], [12, 22], 0.35, 0.45)]),
	// Cây riêng của vùng (11/10/2026 — chủ dự án: "cây các vùng giống nhau quá, mỗi vùng 1 style riêng"): bản tô màu lại thay loài đang
	// dùng chung với vùng khác (0 lượt vẽ; ke-hoach-the-gioi 5.6).
	recolored('ash_tree_ember', 'volcano_ash_tree', [leaves('tán than hồng', [280, 40], [18, 34], 1.5, 1.12)]),
	recolored('ash_tree_ember_flip', 'volcano_ash_tree', [leaves('tán than hồng', [280, 40], [18, 34], 1.5, 1.12)], true),
	...home('dwarf_house', 'volcano_dwarf_house', 0.86, 56),
	building('fortress_gate', 'volcano_fortress_gate', 0.92, 40),
	building('great_forge', 'volcano_great_forge', 0.86, 56),
	rock('basalt', VL1(0), 0.8, 18),
	rock('obsidian', VL1(1), 0.7, 14),
	decor('lava_pool', VL1(2), 0.8, 12),
	rock('sulfur', VL1(3), 0.7, 12),
	rock('fumarole', VL1(4), 0.7, 16),
	flat('fire_moss', VL1(5)),
	rock('lava_rock', VL1(6), 0.8, 16),
	flat('ash_pile', VL1(7)),
	flat('fire_flower', VL1(8)),
	decor('anvil', VL2(0), 0.75, 14),
	decor('coal_barrel', VL2(1), 0.75, 14),
	decor('weapon_rack', VL2(2), 0.85, 12),
	decor('hot_ingots', VL2(3), 0.85, 12),
	decor('quench_trough', VL2(4), 0.85, 12),
	building('refugee_tent', VL2(5), 0.85, 22),
	decor('field_cot', VL2(6), 0.85, 10),
	decor('anvil_banner', VL2(7), 0.3, 8),
	decor('fire_brazier', VL2(8), 0.5, 10),
	building('forge_altar', VL3(0), 0.85, 22),
	rock('rune_anvil', VL3(1), 0.85, 16),
	rock('rune_pillar', VL3(2), 0.5, 14),
	decor('thunder_sword', VL3(3), 0.5, 12),
	decor('old_bellows', VL3(4), 0.85, 12),
	rock('hammer_head', VL3(5), 0.85, 14),
	decor('siphon_machine', VL3(6), 0.7, 14),
	rock('dwarf_statue', VL3(7), 0.7, 16),
	rock('dragon_head', VL3(8), 0.8, 16),
	...shared('rune_stone', 'signpost', 'cliff_rock', 'cliff_rock_flip', 'rock_spire', 'rock_outcrop', 'boulder', 'stalagmite', 'crystal_purple', 'rock_pillar', 'skull_pile', 'bone_pile'),
	// Đợt vẽ thêm 10/10/2026 — món chưa vẽ xong thì bộ dựng tự bỏ qua.
	...tree('ruby_tree', 'volcano_ruby_tree'),
	...tree('petrified_tree', 'volcano_petrified_tree'),
	...tree('fire_mushrooms', 'volcano_fire_mushrooms'),
	...tree('thorn_black', 'volcano_thorn_bush'),
	building('forge_shop', 'volcano_forge_shop', 0.86, 54),
	building('bastion', 'volcano_bastion', 0.8, 50),
	rock('basalt_column', cell('VL4_volcano_wilds', 0), 0.6, 16),
	rock('steam_vent', cell('VL4_volcano_wilds', 1), 0.6, 12),
	decor('sulfur_pool', cell('VL4_volcano_wilds', 2), 0.8, 12),
	rock('pumice', cell('VL4_volcano_wilds', 3), 0.7, 12),
	rock('fire_vein', cell('VL4_volcano_wilds', 4), 0.8, 16),
	flat('ash_crater', cell('VL4_volcano_wilds', 5)),
	rock('rock_slab', cell('VL4_volcano_wilds', 6), 0.7, 14),
	rock('obsidian_boulder', cell('VL4_volcano_wilds', 7), 0.85, 20),
	bush('fire_thorn', cell('VL4_volcano_wilds', 8)),
	decor('ore_cart', cell('VL5_dwarf_mine', 0), 0.85, 14),
	flat('rail_track', cell('VL5_dwarf_mine', 1)),
	decor('iron_gate', cell('VL5_dwarf_mine', 2), 0.9, 10),
	decor('ore_pile', cell('VL5_dwarf_mine', 3), 0.8, 12),
	rock('smith_statue', cell('VL5_dwarf_mine', 4), 0.6, 14),
	decor('workbench', cell('VL5_dwarf_mine', 5), 0.85, 12),
	decor('hot_trough', cell('VL5_dwarf_mine', 6), 0.85, 12),
	decor('kiln', cell('VL5_dwarf_mine', 7), 0.8, 16),
	decor('armor_stand', cell('VL5_dwarf_mine', 8), 0.5, 10),
];

const CR1 = (i: number) => cell('CR1_coral_nature', i);
const CR2 = (i: number) => cell('CR2_fishing_port', i);
const CR3 = (i: number) => cell('CR3_kraken_abyss', i);
export const ISLES_PROPS: PropDef[] = [
	...tree('palm', 'desert_palm_tree'),
	recolored('palm_lush', 'desert_palm_tree', [leaves('cọ xanh đậm', [60, 180], [130, 160], 1.2, 0.95)], true),
	// Cây riêng của vùng (11/10/2026 — chủ dự án: "cây các vùng giống nhau quá, mỗi vùng 1 style riêng"): bản tô màu lại thay loài đang
	// dùng chung với vùng khác (0 lượt vẽ; ke-hoach-the-gioi 5.6).
	recolored('palm_tropic', 'desert_palm_tree', [leaves('cọ ngọc', [60, 180], [158, 178], 1.25, 1.02)]),
	recolored('palm_tropic_flip', 'desert_palm_tree', [leaves('cọ ngọc', [60, 180], [158, 178], 1.25, 1.02)], true),
	{ ...shared('bush')[0]!, id: 'beach_bush', recolor: [leaves('bụi biển', [40, 160], [62, 84], 1.3, 1.1)] },
	recolored('palm_dry', 'desert_palm_tree', [leaves('lá cọ khô', [60, 180], [30, 52], 1.3, 1.05)]),
	...home('fisher_cottage', 'coral_fisher_cottage', 0.86, 56),
	building('boat_workshop', 'coral_boat_workshop', 0.88, 50),
	building('fishing_pier', 'coral_fishing_pier', 0.6, 20),
	building('gull_wreck', 'coral_silver_gull_wreck', 0.75, 40),
	rock('pink_coral', CR1(0), 0.6, 12),
	rock('sea_fan', CR1(1), 0.6, 12),
	rock('brain_coral', CR1(2), 0.75, 14),
	rock('giant_clam', CR1(3), 0.8, 12),
	flat('starfish', CR1(4)),
	flat('urchin', CR1(5)),
	flat('kelp', CR1(6)),
	bush('coconut_palm', CR1(7)),
	rock('beach_rock', CR1(8), 0.8, 18),
	decor('lobster_trap', CR2(0), 0.8, 12),
	decor('anchor', CR2(1), 0.6, 12),
	decor('fish_barrel', CR2(2), 0.75, 14),
	decor('buoy', CR2(3), 0.4, 10),
	decor('fish_crates', CR2(4), 0.85, 14),
	flat('net_pile', CR2(5)),
	decor('fish_rack', CR2(6), 0.8, 12),
	decor('salt_crate', CR2(7), 0.8, 14),
	flat('flower_wreath', CR2(8)),
	decor('ship_wheel', CR3(0), 0.6, 12),
	decor('rune_chest', CR3(1), 0.8, 12),
	flat('tentacle', CR3(2)),
	decor('cannon', CR3(3), 0.85, 14),
	rock('gull_figurehead', CR3(4), 0.7, 12),
	decor('ghost_lantern_brass', CR3(5), 0.4, 10),
	decor('red_machine', CR3(6), 0.7, 12),
	rock('abyss_spire', CR3(7), 0.6, 16),
	flat('ship_planks', CR3(8)),
	...shared('rune_stone', 'signpost', 'rock_gray', 'bush', 'crate', 'barrel', 'rowboat', 'mooring_post', 'reed_clump'),
	{ ...SWAMP_PROPS.find((p) => p.id === 'lily_pads')! },
	{ ...DESERT_PROPS.find((p) => p.id === 'agave')! },
	// Đợt vẽ thêm 10/10/2026 — món chưa vẽ xong thì bộ dựng tự bỏ qua.
	...tree('leaning_palm', 'isles_leaning_palm'),
	...tree('sea_almond', 'isles_sea_almond'),
	...tree('morning_glory', 'isles_morning_glory'),
	...tree('coast_mangrove', 'isles_coast_mangrove'),
	building('lighthouse', 'isles_lighthouse', 0.6, 40),
	building('tavern', 'isles_tavern', 0.86, 56),
	rock('spiral_shell', cell('CR4_beach_shore', 0), 0.7, 12),
	rock('oyster_rock', cell('CR4_beach_shore', 1), 0.8, 16),
	flat('seaweed_pile', cell('CR4_beach_shore', 2)),
	flat('gull_nest', cell('CR4_beach_shore', 3)),
	rock('whale_ribs', cell('CR4_beach_shore', 4), 0.85, 14),
	decor('flagpole', cell('CR4_beach_shore', 5), 0.3, 8),
	flat('life_ring', cell('CR4_beach_shore', 6)),
	flat('net_heap', cell('CR4_beach_shore', 7)),
	flat('turtle_shell', cell('CR4_beach_shore', 8)),
	flat('pier_segment', cell('CR5_harbor', 0)),
	decor('mooring_piles', cell('CR5_harbor', 1), 0.85, 10),
	building('harbor_shed', cell('CR5_harbor', 2), 0.86, 24),
	decor('barrel_stack', cell('CR5_harbor', 3), 0.85, 14),
	decor('hook_rack', cell('CR5_harbor', 4), 0.8, 12),
	decor('beacon_post', cell('CR5_harbor', 5), 0.3, 8),
	decor('small_rowboat', cell('CR5_harbor', 6), 0.8, 12),
	decor('rusty_anchor', cell('CR5_harbor', 7), 0.6, 12),
	building('lookout_hut', cell('CR5_harbor', 8), 0.7, 20),
];

import { PIXELLAB_PREFIX, type PropDef } from './humanKingdom.js';
import { SWAMP_PROPS, HIGHLAND_PROPS, VOLCANO_PROPS } from './worldRegions.js';

/** 36 loài đã vẽ: dùng ảnh nguồn, không tô lại cây vùng cũ. */
export const ELEMENT_TREES = {
	"wood": [
		"wood_ancient_giant",
		"wood_fern_giant",
		"wood_banyan",
		"wood_white_blossom",
		"wood_hollow_oak",
		"wood_firefly_tree",
		"wood_wild_rose",
		"wood_redwood",
		"wood_vine_tree",
		"wood_fallen_log",
		"wood_spirit_tree",
		"wood_world_sapling"
	],
	"light": [
		"light_golden_tree",
		"light_ginkgo",
		"light_olive_silver",
		"light_silver_willow",
		"light_golden_apple",
		"light_magnolia",
		"light_white_cypress",
		"light_lily_bush",
		"light_laurel_planter",
		"light_feather_tree",
		"light_crystal_tree",
		"light_holy_sapling"
	],
	"dark": [
		"dark_lantern_tree",
		"dark_twisted_tree",
		"dark_chained_tree",
		"dark_cracked_stump",
		"dark_blood_bush",
		"dark_eye_tree",
		"dark_bone_tree",
		"dark_weeping_shadow",
		"dark_ghost_tree",
		"dark_thorn_giant",
		"dark_obsidian_tree",
		"dark_violet_glow"
	]
} as const;
const base = { wood: SWAMP_PROPS, light: HIGHLAND_PROPS, dark: VOLCANO_PROPS };
export const ELEMENT_PROPS = Object.fromEntries(Object.entries(ELEMENT_TREES).map(([region, ids]) => [region, [
 ...base[region as keyof typeof base].filter(p => p.kind !== 'tree'),
 ...ids.flatMap(id => [false, true].map(flip => ({ id: id + (flip ? '_flip' : ''), path: PIXELLAB_PREFIX + id, kind: 'tree' as const, footprint: { w: 0.16, h: 14 }, blocks: true, flip }))),
]])) as Record<keyof typeof ELEMENT_TREES, PropDef[]>;

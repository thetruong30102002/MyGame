import type { RecolorRule } from '../normalize/recolor.js';
import { THISTLEWOOD_INN, WORLD_ART_PREFIX } from './worldArt.js';

/**
 * Đồ vật của vùng Human Kingdom — TOÀN BỘ do PixelLab vẽ cùng một nét (chủ dự án chốt 07/10/2026: map phải đồng
 * nhất một style, bỏ hết đồ vật FreePixel). Nhà + cây: mỗi món một bản Pro Flash nhìn THẲNG CHÍNH DIỆN (06/10/2026 —
 * mỗi nhà một bản vẽ riêng, KHÔNG đổi màu mái cho ra nhà mới; cây chỉ MỘT loại). Đồ vật nhỏ: cắt từ các TẤM Pro Flash
 * vẽ nhiều món một lần, cùng ảnh mẫu style là nhà/cây đã duyệt (`props/sheet.ts`).
 * `footprint` = vùng chân chặn đường đi, tính từ mép DƯỚI hình đã cắt sát: `w` là tỉ lệ bề ngang hình, `h` là số
 * px. `blocks: false` = đi xuyên qua.
 */
export type PropKind = 'building' | 'tree' | 'bush' | 'rock' | 'decor' | 'flower';

export interface PropDef {
	id: string;
	path: string;
	kind: PropKind;
	footprint: { w: number; h: number };
	blocks: boolean;
	/** Chia NGUYÊN kích thước (2 = còn ½). */
	downscale?: number;
	/** Biến thể dựng bằng code từ cùng một ảnh gốc — thêm kiểu cây mà không tốn lượt vẽ PixelLab. */
	flip?: boolean;
	recolor?: RecolorRule[];
}

/** `path` dạng `pixellab:<tên>` = đồ vật PixelLab đã tải về `sources/pixellab/objects/<tên>/<tên>.png`. */
export const PIXELLAB_PREFIX = 'pixellab:';
const PL = PIXELLAB_PREFIX;

/** Lá cây: xanh vàng (70°) → xanh lam (190°). */
const LEAVES = { kind: 'hsl', hue: [60, 200] as [number, number], minSat: 0.15 } as const;

/** Ô của tấm PixelLab (`sources/pixellab/sheets/<tấm>.png`, lưới `cột×hàng`, ô đánh số theo hàng). */
const cell = (sheet: string, index: number, grid: string): string => `sheet:${sheet}#${index}@${grid}`;
const TOWN_A = (i: number) => cell('T1_stalls', i, '2x2');
const TOWN_B = (i: number) => cell('T2_small', i, '3x3');
const NATURE = (i: number) => cell('N1_nature', i, '3x3');
const SHRINE = (i: number) => cell('S1_shrine', i, '2x2');
const GRAVE = (i: number) => cell('G1_graveyard', i, '3x3');
const RUINS = (i: number) => cell('R1_ruins', i, '3x3');
const BONES = (i: number) => cell('B1_bonehills', i, '3x3');
const CAVE = (i: number) => cell('CV1_cave_nature', i, '3x3');
const CAVE_PROPS = (i: number) => cell('CV2_cave_props', i, '3x3');
/** Tấm chương 1: lưới 2 cột × 3 hàng (ô rộng 96×64 cho lều / thuyền); `grow` = nới ô khi món vẽ lấn qua đường lưới (`props/sheet.ts`). */
const CHAPTER1 = (i: number, grow = 0) => `${cell('C1_chapter1', i, '2x3')}${grow ? `+${grow}` : ''}`;

export const HUMAN_KINGDOM_PROPS: PropDef[] = [
	// Chỉ xuất hiện khi ảnh mới đã vẽ và qua cổng tỷ lệ; nhà trọ cũ vẫn giữ trong atlas.
	{ id: THISTLEWOOD_INN.id, path: WORLD_ART_PREFIX + THISTLEWOOD_INN.sourceId, kind: 'building', footprint: { w: 312 / 336, h: 80 }, blocks: true },
	{ id: 'house', path: `${PL}house_cottage_front`, kind: 'building', footprint: { w: 0.9, h: 60 }, blocks: true },
	{ id: 'church', path: `${PL}church_front`, kind: 'building', footprint: { w: 0.9, h: 64 }, blocks: true },
	{ id: 'house_forge', path: `${PL}house_forge`, kind: 'building', footprint: { w: 0.82, h: 60 }, blocks: true },
	{ id: 'house_store', path: `${PL}house_store`, kind: 'building', footprint: { w: 0.85, h: 60 }, blocks: true },
	{ id: 'house_inn', path: `${PL}house_inn`, kind: 'building', footprint: { w: 0.85, h: 64 }, blocks: true },
	{ id: 'house_stone', path: `${PL}house_stone`, kind: 'building', footprint: { w: 0.88, h: 58 }, blocks: true },
	{ id: 'house_farm', path: `${PL}house_farm`, kind: 'building', footprint: { w: 0.88, h: 58 }, blocks: true },
	{ id: 'tree', path: `${PL}tree_oak_front`, kind: 'tree', footprint: { w: 0.16, h: 14 }, blocks: true },
	{ id: 'tree_flip', path: `${PL}tree_oak_front`, kind: 'tree', footprint: { w: 0.16, h: 14 }, blocks: true, flip: true },
	{ id: 'tree_autumn', path: `${PL}tree_oak_front`, kind: 'tree', footprint: { w: 0.16, h: 14 }, blocks: true, recolor: [{ ...LEAVES, name: 'lá thu', hueTo: [10, 48], saturation: 2.4, lightness: 1.08 }] },

	// Tấm thị trấn A: quầy chợ ×2, giếng, biển chỉ đường (đặt ở lối sang map).
	{ id: 'stall_fruit', path: TOWN_A(0), kind: 'building', footprint: { w: 0.85, h: 30 }, blocks: true },
	{ id: 'stall_cloth', path: TOWN_A(1), kind: 'building', footprint: { w: 0.85, h: 30 }, blocks: true },
	{ id: 'well', path: TOWN_A(2), kind: 'decor', footprint: { w: 0.8, h: 26 }, blocks: true },
	{ id: 'signpost', path: TOWN_A(3), kind: 'decor', footprint: { w: 0.25, h: 10 }, blocks: true },
	// Tấm thị trấn B: đồ lặt vặt; hình nộm rơm là "Ông Rơm" của nhiệm vụ tập kiếm/phép.
	{ id: 'barrel', path: TOWN_B(0), kind: 'decor', footprint: { w: 0.8, h: 18 }, blocks: true },
	{ id: 'crate', path: TOWN_B(1), kind: 'decor', footprint: { w: 0.85, h: 18 }, blocks: true },
	{ id: 'haybale', path: TOWN_B(2), kind: 'decor', footprint: { w: 0.85, h: 20 }, blocks: true },
	{ id: 'training_dummy', path: TOWN_B(3), kind: 'decor', footprint: { w: 0.4, h: 12 }, blocks: true },
	{ id: 'fence', path: TOWN_B(4), kind: 'decor', footprint: { w: 1, h: 10 }, blocks: true },
	{ id: 'bench', path: TOWN_B(5), kind: 'decor', footprint: { w: 0.85, h: 14 }, blocks: true },
	{ id: 'planter', path: TOWN_B(6), kind: 'decor', footprint: { w: 0.9, h: 14 }, blocks: true },
	{ id: 'lamp', path: TOWN_B(7), kind: 'decor', footprint: { w: 0.3, h: 8 }, blocks: true },
	{ id: 'wheelbarrow', path: TOWN_B(8), kind: 'decor', footprint: { w: 0.8, h: 16 }, blocks: true },
	// Tấm thiên nhiên: nấm phát sáng + cỏ Sương Bạc còn là hình vật phẩm NHẶT của nhiệm vụ (không chặn đường).
	{ id: 'bush', path: NATURE(0), kind: 'bush', footprint: { w: 0.6, h: 14 }, blocks: true },
	{ id: 'bush_flower', path: NATURE(1), kind: 'bush', footprint: { w: 0.6, h: 14 }, blocks: true },
	{ id: 'rock_mossy', path: NATURE(2), kind: 'rock', footprint: { w: 0.75, h: 22 }, blocks: true },
	{ id: 'rock_gray', path: NATURE(3), kind: 'rock', footprint: { w: 0.75, h: 20 }, blocks: true },
	{ id: 'stump', path: NATURE(4), kind: 'rock', footprint: { w: 0.6, h: 16 }, blocks: true },
	{ id: 'mushroom_glow', path: NATURE(5), kind: 'flower', footprint: { w: 0, h: 0 }, blocks: false },
	{ id: 'herb_silver', path: NATURE(6), kind: 'flower', footprint: { w: 0, h: 0 }, blocks: false },
	{ id: 'fern', path: NATURE(7), kind: 'flower', footprint: { w: 0, h: 0 }, blocks: false },
	{ id: 'wildflowers', path: NATURE(8), kind: 'flower', footprint: { w: 0, h: 0 }, blocks: false },
	// Tấm Đá Phong Ấn.
	{ id: 'seal_stone', path: SHRINE(0), kind: 'building', footprint: { w: 0.8, h: 30 }, blocks: true },
	{ id: 'pillar_broken', path: SHRINE(1), kind: 'rock', footprint: { w: 0.7, h: 22 }, blocks: true },
	{ id: 'rune_stone', path: SHRINE(2), kind: 'rock', footprint: { w: 0.7, h: 18 }, blocks: true },
	{ id: 'stone_lantern', path: SHRINE(3), kind: 'decor', footprint: { w: 0.6, h: 18 }, blocks: true },

	// Vùng quái phía bắc (07/10/2026). Nghĩa địa Hoàng Hôn: tấm G1 + hầm mộ + cây chết.
	// Tấm G1 / R1 / B1 + 5 món lẻ (cây chết, thông khô, hầm mộ, vách đá, vòm đá) vẽ 10/10/2026 — ĐỢT 2 thiết kế 12 map vùng 1; đã soi
	// từng ô khớp thứ tự khai dưới đây. Đề bài: `sheets/<tấm>.png.json`, `objects/<món>/args.json`.
	{ id: 'tree_dead', path: `${PL}tree_dead`, kind: 'tree', footprint: { w: 0.16, h: 14 }, blocks: true },
	{ id: 'tree_dead_flip', path: `${PL}tree_dead`, kind: 'tree', footprint: { w: 0.16, h: 14 }, blocks: true, flip: true },
	{ id: 'crypt', path: `${PL}crypt`, kind: 'building', footprint: { w: 0.85, h: 52 }, blocks: true },
	{ id: 'tomb_round', path: GRAVE(0), kind: 'rock', footprint: { w: 0.7, h: 12 }, blocks: true },
	{ id: 'tomb_cross', path: GRAVE(1), kind: 'rock', footprint: { w: 0.4, h: 10 }, blocks: true },
	{ id: 'tomb_broken', path: GRAVE(2), kind: 'rock', footprint: { w: 0.7, h: 12 }, blocks: true },
	{ id: 'grave_mound', path: GRAVE(3), kind: 'decor', footprint: { w: 0.7, h: 12 }, blocks: true },
	{ id: 'iron_fence', path: GRAVE(4), kind: 'decor', footprint: { w: 1, h: 10 }, blocks: true },
	{ id: 'skull_pile', path: GRAVE(5), kind: 'flower', footprint: { w: 0, h: 0 }, blocks: false },
	{ id: 'coffin', path: GRAVE(6), kind: 'decor', footprint: { w: 0.8, h: 12 }, blocks: true },
	{ id: 'ghost_lantern', path: GRAVE(7), kind: 'decor', footprint: { w: 0.3, h: 8 }, blocks: true },
	{ id: 'dead_bush', path: GRAVE(8), kind: 'bush', footprint: { w: 0.6, h: 12 }, blocks: true },
	// Vách Gargoyle: tấm R1 + vách đá + cổng đá đổ + thông khô.
	{ id: 'tree_pine_dry', path: `${PL}tree_pine_dry`, kind: 'tree', footprint: { w: 0.16, h: 14 }, blocks: true },
	{ id: 'tree_pine_dry_flip', path: `${PL}tree_pine_dry`, kind: 'tree', footprint: { w: 0.16, h: 14 }, blocks: true, flip: true },
	{ id: 'cliff_rock', path: `${PL}cliff_rock`, kind: 'building', footprint: { w: 0.9, h: 40 }, blocks: true },
	{ id: 'cliff_rock_flip', path: `${PL}cliff_rock`, kind: 'building', footprint: { w: 0.9, h: 40 }, blocks: true, flip: true },
	// Cổng đá đi XUYÊN qua được (khung vòm), chỉ là cảnh.
	{ id: 'ruin_arch', path: `${PL}ruin_arch`, kind: 'building', footprint: { w: 0, h: 0 }, blocks: false },
	{ id: 'ruin_wall', path: RUINS(0), kind: 'rock', footprint: { w: 0.95, h: 16 }, blocks: true },
	{ id: 'gargoyle_statue', path: RUINS(1), kind: 'rock', footprint: { w: 0.6, h: 14 }, blocks: true },
	{ id: 'boulder', path: RUINS(2), kind: 'rock', footprint: { w: 0.75, h: 20 }, blocks: true },
	{ id: 'stone_stairs', path: RUINS(3), kind: 'decor', footprint: { w: 0.8, h: 10 }, blocks: true },
	{ id: 'column_fallen', path: RUINS(4), kind: 'rock', footprint: { w: 0.9, h: 12 }, blocks: true },
	{ id: 'brazier', path: RUINS(5), kind: 'decor', footprint: { w: 0.5, h: 10 }, blocks: true },
	{ id: 'rock_outcrop', path: RUINS(6), kind: 'rock', footprint: { w: 0.8, h: 18 }, blocks: true },
	{ id: 'rock_spire', path: RUINS(7), kind: 'rock', footprint: { w: 0.5, h: 12 }, blocks: true },
	{ id: 'rune_tablet', path: RUINS(8), kind: 'rock', footprint: { w: 0.6, h: 10 }, blocks: true },
	// Đồi Xương Trắng: tấm B1.
	{ id: 'ribcage', path: BONES(0), kind: 'rock', footprint: { w: 0.8, h: 14 }, blocks: true },
	{ id: 'beast_skull', path: BONES(1), kind: 'rock', footprint: { w: 0.7, h: 14 }, blocks: true },
	{ id: 'bone_pile', path: BONES(2), kind: 'flower', footprint: { w: 0, h: 0 }, blocks: false },
	{ id: 'dead_stump', path: BONES(3), kind: 'rock', footprint: { w: 0.6, h: 12 }, blocks: true },
	{ id: 'pale_rocks', path: BONES(4), kind: 'rock', footprint: { w: 0.7, h: 14 }, blocks: true },
	{ id: 'war_banner', path: BONES(5), kind: 'decor', footprint: { w: 0.2, h: 8 }, blocks: true },
	{ id: 'broken_sword', path: BONES(6), kind: 'flower', footprint: { w: 0, h: 0 }, blocks: false },
	{ id: 'spike_barricade', path: BONES(7), kind: 'decor', footprint: { w: 0.9, h: 12 }, blocks: true },
	{ id: 'skull_totem', path: BONES(8), kind: 'decor', footprint: { w: 0.3, h: 8 }, blocks: true },
	// Hang Gargoyle (thiết kế 12 map vùng 1, 10/10/2026): tấm CV1 thiên nhiên hang + CV2 đồ trong hang, cùng ảnh mẫu N1.
	// Nấm hang / vũng nước / rêu treo / xương dơi là cảnh nền, đi xuyên được (rêu treo che miệng khe bí mật).
	{ id: 'stalagmite', path: CAVE(0), kind: 'rock', footprint: { w: 0.6, h: 16 }, blocks: true },
	{ id: 'crystal_blue', path: CAVE(1), kind: 'rock', footprint: { w: 0.7, h: 16 }, blocks: true },
	{ id: 'cave_boulder', path: CAVE(2), kind: 'rock', footprint: { w: 0.8, h: 20 }, blocks: true },
	{ id: 'cave_mushrooms', path: CAVE(3), kind: 'flower', footprint: { w: 0, h: 0 }, blocks: false },
	{ id: 'cave_puddle', path: CAVE(4), kind: 'flower', footprint: { w: 0, h: 0 }, blocks: false },
	{ id: 'hanging_moss', path: CAVE(5), kind: 'flower', footprint: { w: 0, h: 0 }, blocks: false },
	{ id: 'rock_pillar', path: CAVE(6), kind: 'rock', footprint: { w: 0.7, h: 18 }, blocks: true },
	{ id: 'bat_bones', path: CAVE(7), kind: 'flower', footprint: { w: 0, h: 0 }, blocks: false },
	{ id: 'crystal_purple', path: CAVE(8), kind: 'rock', footprint: { w: 0.6, h: 14 }, blocks: true },
	// CV2: bỏ ô #5 (thùng gỗ — trùng `crate`) và #6 (biển hang — trùng `signpost`).
	{ id: 'wall_torch', path: CAVE_PROPS(0), kind: 'decor', footprint: { w: 0.3, h: 8 }, blocks: true },
	{ id: 'mine_cart', path: CAVE_PROPS(1), kind: 'decor', footprint: { w: 0.85, h: 16 }, blocks: true },
	{ id: 'broken_beam', path: CAVE_PROPS(2), kind: 'rock', footprint: { w: 0.3, h: 10 }, blocks: true },
	{ id: 'gargoyle_idol', path: CAVE_PROPS(3), kind: 'rock', footprint: { w: 0.7, h: 16 }, blocks: true },
	{ id: 'iron_chain', path: CAVE_PROPS(4), kind: 'flower', footprint: { w: 0, h: 0 }, blocks: false },
	{ id: 'stone_altar', path: CAVE_PROPS(7), kind: 'building', footprint: { w: 0.9, h: 24 }, blocks: true },
	{ id: 'skull_candles', path: CAVE_PROPS(8), kind: 'flower', footprint: { w: 0, h: 0 }, blocks: false },
	// Đồ vật chương 1 (tấm C1, ảnh mẫu N1, vẽ 10/10/2026 — đề bài `sheets/C1_chapter1.png.json`): lều gỗ bà goá (Mộ Vô Danh),
	// thuyền gỗ + cọc buộc thuyền (Bến sông, Bãi Bồi), cỗ máy đo Haven bằng đồng (Gian Đá Ghi Tên, Hang Gargoyle), thùng ong nhà
	// Ashvale, lau sậy bờ sông. Thuyền đặt trên mặt nước nên không chặn; lau sậy đi xuyên. Cỗ máy đo (đỉnh mặt đồng hồ) và lau sậy
	// (ngọn bông) vẽ lấn đường lưới 1–2px → cắt ô nới.
	{ id: 'small_hut', path: CHAPTER1(0), kind: 'building', footprint: { w: 0.9, h: 24 }, blocks: true },
	{ id: 'rowboat', path: CHAPTER1(1), kind: 'decor', footprint: { w: 0, h: 0 }, blocks: false },
	{ id: 'brass_meter', path: CHAPTER1(2, 3), kind: 'decor', footprint: { w: 0.5, h: 10 }, blocks: true },
	{ id: 'beehive', path: CHAPTER1(3), kind: 'decor', footprint: { w: 0.8, h: 14 }, blocks: true },
	{ id: 'reed_clump', path: CHAPTER1(4, 2), kind: 'flower', footprint: { w: 0, h: 0 }, blocks: false },
	{ id: 'mooring_post', path: CHAPTER1(5), kind: 'decor', footprint: { w: 0.4, h: 10 }, blocks: true },
];

/**
 * Tấm decal mặt đất PixelLab: tách từng cụm rời làm decal, id `<tag>_<pebble|tuft>_<i>`. Cụm xám ít sắc là sỏi
 * (chỉ rải trên đường đất), còn lại là cỏ hoa. Mỗi map chọn tấm theo `tag` (đồng cỏ d1, đất chết d2). Chưa có tấm thì
 * map đó không có decal — KHÔNG quay về decal FreePixel cũ.
 */
export const HUMAN_KINGDOM_DECAL_SHEETS = [
	{ tag: 'd1', sheet: 'D1_decals' },
	{ tag: 'd2', sheet: 'D2_deadland' },
];

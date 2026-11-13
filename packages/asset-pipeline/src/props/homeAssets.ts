import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '../image/rgba.js';
import { packShelf, propMeta } from './buildProps.js';
import type { PropDef } from './humanKingdom.js';
import { loadSheetCell, parseSheetPath } from './sheet.js';

/** Gói Gia viên 07/11: chỉ cắt các tấm đã vẽ, giữ nguyên nét và kích thước nguồn. */
export const HOME_CROPS = ['wheat', 'carrot', 'potato', 'strawberry', 'haven_pumpkin', 'silver_grass'] as const;
export const HOME_CROP_NAMES = ['Lúa mì', 'Cà rốt', 'Khoai', 'Dâu', 'Bí ngô Haven', 'Cỏ bạc'] as const;
/** 12 cây mở rộng (11/11, kế hoạch 9.8): F6 / F7 / F8 lưới 4×4 (hàng = cây, cột = giai đoạn 1–4), icon nông sản F9 ô 0–11, túi hạt F10 ô 0–11. */
export const HOME_CROPS_2 = ['rice', 'corn', 'tomato', 'watermelon', 'grape', 'chili', 'tea', 'sunflower', 'glowcap', 'moonflower', 'starfruit', 'golden_wheat'] as const;
export const HOME_CROP_NAMES_2 = ['Lúa nước', 'Ngô', 'Cà chua', 'Dưa hấu', 'Nho', 'Ớt', 'Chè', 'Hướng dương', 'Nấm sáng', 'Hoa trăng', 'Quả sao', 'Lúa vàng'] as const;
const cell = (sheet: string, index: number, grid: string) => `sheet:${sheet}#${index}@${grid}`;
const prop = (id: string, path: string, blocks = true, width = 0.8, height = 12): PropDef => ({
	id, path, kind: 'decor', blocks, footprint: { w: blocks ? width : 0, h: blocks ? height : 0 },
});

export const HOME_PROPS: PropDef[] = [
	...HOME_CROPS.flatMap((id, row) => Array.from({ length: 4 }, (_, stage) => ({
		...prop(`farm_crop_${id}_${stage}`, row < 2 ? cell('F1_crops', row * 4 + stage, '4x2') : cell('F2_crops', (row - 2) * 4 + stage, '4x4'), false),
		kind: 'flower' as const,
	}))),
	...HOME_CROPS_2.flatMap((id, n) => Array.from({ length: 4 }, (_, stage) => ({
		...prop(`farm_crop_${id}_${stage}`, cell(['F6_crops', 'F7_crops', 'F8_crops'][Math.floor(n / 4)]!, (n % 4) * 4 + stage, '4x4'), false),
		kind: 'flower' as const,
	}))),
	...(['apple', 'orange', 'peach'] as const).flatMap((id, row) => [0, 1, 2].map((stage) => prop(`fruit_${id}_${stage}`, cell('T1_fruit_trees', row * 3 + stage, '3x3'), true, 0.3, 10))),
	...(['oven', 'pickle_jar', 'fruit_press', 'wine_barrel', 'flour_mill', 'drying_rack'] as const).map((id, i) => prop(`machine_${id}`, cell('M1_machines', i, '4x3'), true, 0.85, 14)),
	// F4 ô 0/1 là mẫu màu đất; không đưa hình ô đất vào atlas (ruộng dựng theo lưới 32 px).
	prop('home_fence', cell('F4_farm_props', 2, '4x2'), true, 1, 8),
	prop('home_gate', cell('F4_farm_props', 3, '4x2'), false),
	prop('home_shipping_box', cell('F4_farm_props', 4, '4x2'), true, 0.85, 16),
	prop('home_scarecrow', cell('F4_farm_props', 5, '4x2'), true, 0.3, 10),
	prop('home_water_barrel', cell('F4_farm_props', 6, '4x2'), true, 0.8, 16),
	prop('home_tool_rack', cell('F4_farm_props', 7, '4x2'), true, 0.8, 12),
	prop('home_bed', cell('I1_interior', 0, '4x3'), true, 0.85, 30),
	prop('home_dining_table', cell('I1_interior', 1, '4x3'), true, 0.9, 20),
	prop('home_chair', cell('I1_interior', 2, '4x3'), true, 0.7, 12),
	prop('home_stove', cell('I1_interior', 3, '4x3'), true, 0.85, 18),
	prop('home_chest', cell('I1_interior', 4, '4x3'), true, 0.85, 14),
	prop('home_wardrobe', cell('I1_interior', 5, '4x3'), true, 0.9, 18),
	prop('home_bookshelf', cell('I1_interior', 6, '4x3'), true, 0.9, 16),
	prop('home_fireplace', cell('I1_interior', 7, '4x3'), true, 0.9, 16),
	prop('home_rug', cell('I1_interior', 8, '4x3'), false),
	prop('home_table_lamp', cell('I1_interior', 9, '4x3'), false),
	prop('home_wall_clock', cell('I1_interior', 10, '4x3'), false),
	prop('home_painting', cell('I1_interior', 11, '4x3'), false),
	prop('home_window', cell('I2_interior', 0, '3x2'), false),
	prop('home_potted_plant', cell('I2_interior', 1, '3x2'), true, 0.6, 10),
	prop('home_drying_rack', cell('I2_interior', 2, '3x2'), true, 0.85, 14),
	prop('home_rice_bin', cell('I2_interior', 3, '3x2'), true, 0.8, 14),
	prop('home_vase', cell('I2_interior', 4, '3x2'), false),
	prop('home_armchair', cell('I2_interior', 5, '3x2'), true, 0.85, 18),
];

export const HOME_ICONS = [
	...HOME_CROPS.map((id, index) => ({ id: `farm_${id}`, name: HOME_CROP_NAMES[index]!, path: cell('F3_crop_icons', index, '4x3') })),
	...HOME_CROPS.map((id, index) => ({ id: `seed_${id}`, name: `Hạt ${HOME_CROP_NAMES[index]!.toLowerCase()}`, path: cell('F3_crop_icons', index + 6, '4x3') })),
	...HOME_CROPS_2.map((id, index) => ({ id: `farm_${id}`, name: HOME_CROP_NAMES_2[index]!, path: cell('F9_produce_icons', index, '4x4') })),
	...(['apple', 'orange', 'peach', 'honey'] as const).map((id, i) => ({ id: `farm_${id}`, name: ['Táo', 'Cam', 'Đào Haven', 'Hũ mật ong'][i]!, path: cell('F9_produce_icons', 12 + i, '4x4') })),
	...(['apple', 'orange', 'peach'] as const).map((id, i) => ({ id: `sapling_${id}`, name: ['Cây giống táo', 'Cây giống cam', 'Cây giống đào Haven'][i]!, path: cell('F10_seed_icons', 12 + i, '4x4') })),
	...(['bread', 'pickles', 'juice', 'wine', 'flour', 'dried_fruit'] as const).map((id, i) => ({ id: `prod_${id}`, name: ['Bánh mì', 'Dưa muối', 'Nước quả', 'Rượu vang', 'Bột mì', 'Quả sấy'][i]!, path: cell('M1_machines', [6, 7, 8, 9, 10, 11][i]!, '4x3') })),
	...(['meat_chicken', 'meat_beef', 'meat_lamb', 'fish_fillet', 'dish_roast_chicken', 'dish_beef_stew', 'dish_lamb_skewer', 'dish_grilled_fish', 'dish_fish_soup', 'dish_fried_rice', 'dish_pumpkin_soup', 'dish_strawberry_cake'] as const).map((id, i) => ({
		id, name: ['Thịt gà', 'Thịt bò', 'Thịt cừu', 'Phi lê cá', 'Gà quay', 'Bò hầm', 'Xiên cừu nướng', 'Cá nướng', 'Súp cá', 'Cơm chiên dứa', 'Súp bí', 'Bánh kem dâu'][i]!, path: cell('K1_meat_dishes', i, '4x3'),
	})),
	// Vũ khí tiệm vũ khí (13/11/2026, PixelLab): hàng = bậc cấp 5 / 10 / 20 / 30. Khiên lấy cột 4 tấm W1 (chủ dự án: "Khiên đạt"); kiếm,
	// trượng, thương, cung vẽ lại dáng dài mảnh ("phải thanh thoát… vẫn phải là thương, kiếm có thể là katana") ở tấm W2 4 × 4 — tấm W2 đã
	// xếp lại mỗi món vào giữa ô 80 × 64 theo từng cụm điểm (bản vẽ gốc có món chạm mép ô).
	...[5, 10, 20, 30].map((lv, r) => ({ id: `shop_shield_${lv}`, name: `shield ${lv}`, path: cell('W1_class_weapons', r * 5 + 3, '5x4') })),
	...(['sword', 'staff', 'spear', 'bow'] as const).flatMap((cls, c) => [5, 10, 20, 30].map((lv, r) => ({ id: `shop_${cls}_${lv}`, name: `${cls} ${lv}`, path: cell('W2_class_weapons_slim', r * 4 + c, '4x4') }))),
	// Heo (13/11/2026, PixelLab tấm 4 × 1): thịt heo, nấm truffle heo ủi được, sườn nướng, thịt kho trứng.
	...(['meat_pork', 'farm_truffle', 'dish_pork_ribs', 'dish_braised_pork'] as const).map((id, i) => ({ id, name: ['Thịt heo', 'Nấm truffle', 'Sườn nướng', 'Thịt kho trứng'][i]!, path: cell('P1_pork', i, '4x1') })),
	// Thỏi vàng ngân hàng (13/11/2026, PixelLab 1 ảnh — `packages/sim/src/bank.ts`).
	{ id: 'gold_bar', name: 'Thỏi vàng', path: cell('G1_gold_bar', 0, '1x1') },
	// 16 cá hiếm (11/11, tấm F14 / F15) — câu được ở hồ sau Gia viên, tỉ lệ cực thấp (chốt 12/11).
	{ id: 'fish_lantern', name: 'Cá đèn lồng đầm lầy', path: cell('F14_rare_fish', 0, '4x2') },
	{ id: 'fish_swamp_pike', name: 'Cá chó độc tím', path: cell('F14_rare_fish', 1, '4x2') },
	{ id: 'fish_oasis_carp', name: 'Chép vàng ốc đảo', path: cell('F14_rare_fish', 2, '4x2') },
	{ id: 'fish_oasis_jewel', name: 'Cá ngọc lam ốc đảo', path: cell('F14_rare_fish', 3, '4x2') },
	{ id: 'fish_feather_trout', name: 'Cá hồi cánh lông', path: cell('F14_rare_fish', 4, '4x2') },
	{ id: 'fish_cloud_koi', name: 'Cá koi mây', path: cell('F14_rare_fish', 5, '4x2') },
	{ id: 'fish_crystal_salmon', name: 'Cá hồi pha lê', path: cell('F14_rare_fish', 6, '4x2') },
	{ id: 'fish_frost_pike', name: 'Cá chó băng', path: cell('F14_rare_fish', 7, '4x2') },
	{ id: 'fish_magma', name: 'Cá dung nham', path: cell('F15_rare_fish', 0, '4x2') },
	{ id: 'fish_ember_betta', name: 'Cá betta lửa', path: cell('F15_rare_fish', 1, '4x2') },
	{ id: 'fish_rainbow_parrot', name: 'Cá vẹt cầu vồng', path: cell('F15_rare_fish', 2, '4x2') },
	{ id: 'fish_pearl_seahorse', name: 'Cá ngựa ngọc trai', path: cell('F15_rare_fish', 3, '4x2') },
	{ id: 'fish_moon_carp', name: 'Cá chép trăng bạc', path: cell('F15_rare_fish', 4, '4x2') },
	{ id: 'fish_cave_glow', name: 'Cá hang đốm sáng', path: cell('F15_rare_fish', 5, '4x2') },
	{ id: 'fish_dragon_koi', name: 'Cá koi rồng Haven', path: cell('F15_rare_fish', 6, '4x2') },
	{ id: 'fish_rune_arowana', name: 'Cá rồng cổ khắc rune', path: cell('F15_rare_fish', 7, '4x2') },
	{ id: 'farm_egg', name: 'Trứng gà', path: cell('B2_animal_buildings', 4, '3x2') },
	{ id: 'farm_milk', name: 'Sữa bò', path: cell('B2_animal_buildings', 5, '3x2') },
	{ id: 'farm_wool', name: 'Len cừu', path: cell('HL2_highland_village', 7, '3x3') },
	...HOME_CROPS_2.map((id, index) => ({ id: `seed_${id}`, name: `Hạt ${HOME_CROP_NAMES_2[index]!.toLowerCase()}`, path: cell('F10_seed_icons', index, '4x4') })),
	...['crucian', 'carp', 'perch', 'eel', 'prawn', 'golden_carp', 'night_catfish', 'haven'].map((id, index) => ({
		id: `fish_${id}`, name: ['Cá diếc', 'Cá chép', 'Cá rô', 'Lươn đồng', 'Tôm càng', 'Cá chép vàng', 'Cá trê đêm', 'Cá Haven'][index]!, path: cell('F5_fish_icons', index, '4x2'),
	})),
];

/** Xuất atlas riêng, không dựng lại / thay đổi map thật, không gọi dịch vụ sinh hình. */
export function buildHomeAssets(sheetsDir: string, assetsDir: string): void {
	const load = (path: string) => {
		const parsed = parseSheetPath(path);
		if (!parsed) throw new Error(`Đường dẫn tấm Gia viên không hợp lệ: ${path}`);
		return loadSheetCell(sheetsDir, parsed);
	};
	// Đọc hết trước khi ghi: thiếu tấm / ô hỏng phải báo lỗi, không xuất một gói thiếu món.
	const props = HOME_PROPS.map((def) => ({ id: def.id, img: load(def.path), def }));
	const icons = HOME_ICONS.map((def) => ({ ...def, img: load(def.path) }));
	const out = join(assetsDir, 'home');
	mkdirSync(out, { recursive: true });
	mkdirSync(join(assetsDir, 'items'), { recursive: true });
	const { image, frames } = packShelf(props, 1024);
	writePng(join(out, 'props.png'), image);
	writeFileSync(join(out, 'props.json'), JSON.stringify({
		frames: Object.fromEntries(Object.entries(frames).map(([id, frame]) => [`home/${id}`, {
			frame, rotated: false, trimmed: false, spriteSourceSize: { x: 0, y: 0, w: frame.w, h: frame.h }, sourceSize: { w: frame.w, h: frame.h }, anchor: { x: 0.5, y: 1 },
		}])),
		meta: { image: 'props.png', size: { w: image.width, h: image.height } },
	}));
	writeFileSync(join(out, 'props.meta.json'), JSON.stringify(Object.fromEntries(props.map(({ id, img, def }) => [id, propMeta(def, img)])), null, 2));
	for (const { id, img } of icons) writePng(join(assetsDir, 'items', `${id}.png`), img);
	writeFileSync(join(out, 'catalog.json'), JSON.stringify({
		version: 1,
		props: props.map(({ id, def, img }) => ({ id, source: def.path, w: img.width, h: img.height })),
		icons: icons.map(({ id, name, path, img }) => ({ id, name, source: path, file: `items/${id}.png`, w: img.width, h: img.height })),
	}, null, 2));
	console.log(`Gia viên: ${props.length} hình cây / đồ vật + ${icons.length} icon từ 7 tấm có sẵn → ${out}`);
}

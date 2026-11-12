import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { writePng } from '../image/rgba.js';
import { packShelf, propMeta } from './buildProps.js';
import type { PropDef } from './humanKingdom.js';
import { loadSheetCell, parseSheetPath } from './sheet.js';

/** Gói Gia viên 07/11: chỉ cắt các tấm đã vẽ, giữ nguyên nét và kích thước nguồn. */
export const HOME_CROPS = ['wheat', 'carrot', 'potato', 'strawberry', 'haven_pumpkin', 'silver_grass'] as const;
export const HOME_CROP_NAMES = ['Lúa mì', 'Cà rốt', 'Khoai', 'Dâu', 'Bí ngô Haven', 'Cỏ bạc'] as const;
const cell = (sheet: string, index: number, grid: string) => `sheet:${sheet}#${index}@${grid}`;
const prop = (id: string, path: string, blocks = true, width = 0.8, height = 12): PropDef => ({
	id, path, kind: 'decor', blocks, footprint: { w: blocks ? width : 0, h: blocks ? height : 0 },
});

export const HOME_PROPS: PropDef[] = [
	...HOME_CROPS.flatMap((id, row) => Array.from({ length: 4 }, (_, stage) => ({
		...prop(`farm_crop_${id}_${stage}`, row < 2 ? cell('F1_crops', row * 4 + stage, '4x2') : cell('F2_crops', (row - 2) * 4 + stage, '4x4'), false),
		kind: 'flower' as const,
	}))),
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

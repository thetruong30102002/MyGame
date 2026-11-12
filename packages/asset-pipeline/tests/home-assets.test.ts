// Gói Gia viên phải đủ món, trong suốt và không ghi ngược vào các tấm nguồn.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { readPng } from '../src/image/rgba.js';
import { buildHomeAssets, HOME_ICONS, HOME_PROPS } from '../src/props/homeAssets.js';
import { isChromaMagenta } from '../src/props/sheet.js';

const sheets = resolve('sources/pixellab/sheets');
const names = ['F1_crops', 'F2_crops', 'F3_crop_icons', 'F4_farm_props', 'I1_interior', 'I2_interior', 'F5_fish_icons', 'F6_crops', 'F7_crops', 'F8_crops', 'F9_produce_icons', 'F10_seed_icons', 'T1_fruit_trees', 'M1_machines', 'K1_meat_dishes', 'B2_animal_buildings', 'HL2_highland_village', 'F14_rare_fish', 'F15_rare_fish'];
const hash = (name: string) => createHash('sha256').update(readFileSync(join(sheets, `${name}.png`))).digest('hex');
const before = names.map(hash);
const out = mkdtempSync(join(tmpdir(), 'havenlord-home-art-'));
try {
	buildHomeAssets(sheets, out);
	const catalog = JSON.parse(readFileSync(join(out, 'home/catalog.json'), 'utf8'));
	assert.equal(catalog.props.length, 111);
	assert.equal(catalog.icons.length, 88);
	assert.equal(new Set([...HOME_PROPS, ...HOME_ICONS].map((x) => x.id)).size, 199);
	assert(!HOME_PROPS.some((x) => /F4_farm_props#[01]@/.test(x.path)), 'không nhập hai ô đất mẫu thành ruộng');
	const atlas = JSON.parse(readFileSync(join(out, 'home/props.json'), 'utf8'));
	const image = readPng(join(out, 'home/props.png'));
	assert(image.width <= 1024 && image.height <= 1024, 'atlas nhỏ phù hợp di động');
	for (const item of catalog.props) {
		const frame = atlas.frames[`home/${item.id}`]?.frame;
		assert(frame && frame.w > 0 && frame.h > 0, `${item.id}: thiếu khung`);
		assert(frame.x + frame.w <= image.width && frame.y + frame.h <= image.height, `${item.id}: vượt atlas`);
	}
	for (const icon of catalog.icons) {
		const img = readPng(join(out, icon.file));
		assert.equal(img.width, icon.w);
		assert.equal(img.height, icon.h);
		assert(img.data.some((v, i) => i % 4 === 3 && v === 255), `${icon.id}: ảnh rỗng`);
	}
	for (const img of [image, ...catalog.icons.map((x: { file: string }) => readPng(join(out, x.file)))])
		for (let i = 0; i < img.data.length; i += 4)
			assert(!img.data[i + 3] || !isChromaMagenta(img.data[i]!, img.data[i + 1]!, img.data[i + 2]!), 'còn nền magenta');
	assert.deepEqual(names.map(hash), before, 'các tấm nguồn phải giữ nguyên');
	console.log('✔ Gia viên: đủ 111 sprite / 88 icon (16 cá hiếm, 18 cây, 3 cây ăn quả, 6 máy, 8 món, trứng / sữa / len), không nền magenta, atlas ≤1024, nguồn giữ nguyên');
} finally {
	rmSync(out, { recursive: true, force: true });
}

// Tách tranh nhân vật đã vẽ theo bốn hướng thành các ô 112px để duyệt mỹ thuật.
// Đây là sprite đứng tham chiếu, chưa phải animation đi/đánh.
import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createImage, getPixel, readPng, setPixel, writePng, type RGBAImage } from '../image/rgba.js';

const root = resolve(import.meta.dirname, '../../../..');
const source = join(root, 'assets/mannequin/source-art');
const dest = join(root, 'assets/mannequin/rework');
const scale = 4;
const directions = ['S', 'W', 'N', 'E'];
mkdirSync(dest, { recursive: true });
const preview = createImage(4 * 112 * scale, 2 * 112 * scale);

for (const [row, sex] of ['male', 'female'].entries()) {
	const sheet = readPng(join(source, `midnight-${sex}-turnaround.png`));
	for (let column = 0; column < 4; column++) {
		const start = Math.floor(column * sheet.width / 4);
		const end = Math.floor((column + 1) * sheet.width / 4);
		let x0 = end, y0 = sheet.height, x1 = start, y1 = 0;
		for (let y = 0; y < sheet.height; y++) for (let x = start; x < end; x++) {
			if (getPixel(sheet, x, y)[3] < 220) continue;
			x0 = Math.min(x0, x); y0 = Math.min(y0, y);
			x1 = Math.max(x1, x); y1 = Math.max(y1, y);
		}
		if (x1 <= x0 || y1 <= y0) throw new Error(`${sex}/${directions[column]}: hình rỗng`);
		const height = 74;
		const width = Math.round(height * (x1 - x0 + 1) / (y1 - y0 + 1));
		const native: RGBAImage = createImage(112, 112);
		const left = 56 - Math.floor(width / 2), top = 100 - height;
		for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
			const sx = x0 + Math.floor((x + .5) * (x1 - x0 + 1) / width);
			const sy = y0 + Math.floor((y + .5) * (y1 - y0 + 1) / height);
			const color = getPixel(sheet, sx, sy);
			if (color[3] >= 220) setPixel(native, left + x, top + y, [color[0], color[1], color[2], 255]);
		}
		writePng(join(dest, `midnight-${sex}-${directions[column]}.png`), native);
		for (let y = 0; y < 112 * scale; y++) for (let x = 0; x < 112 * scale; x++) {
			const c = getPixel(native, Math.floor(x / scale), Math.floor(y / scale));
			if (c[3]) setPixel(preview, column * 112 * scale + x, row * 112 * scale + y, c);
		}
		console.log(`${sex}/${directions[column]}: ${width}×${height}, root (56,100), alpha cứng`);
	}
}
writePng(join(dest, 'turnaround-native-4x.png'), preview);

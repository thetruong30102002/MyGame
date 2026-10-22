// Chuẩn hoá tranh gốc đã vẽ thành pixel alpha cứng ở đúng lưới game.
import { join } from 'node:path';
import { createImage, getPixel, readPng, setPixel, type RGBAImage } from '../image/rgba.js';

export type Point = [number, number];

export function nativeCutout(file: string, width: number, height: number, sourceDir: string): RGBAImage {
	const source = readPng(join(sourceDir, file));
	let x0 = source.width, y0 = source.height, x1 = 0, y1 = 0;
	for (let y = 0; y < source.height; y++) for (let x = 0; x < source.width; x++) {
		if (getPixel(source, x, y)[3] < 220) continue;
		x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
	}
	if (x1 <= x0 || y1 <= y0) throw new Error(`Tranh nguồn rỗng: ${file}`);
	const out = createImage(width, height);
	for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
		const sx = x0 + Math.floor((x + 0.5) * (x1 - x0 + 1) / width);
		const sy = y0 + Math.floor((y + 0.5) * (y1 - y0 + 1) / height);
		const c = getPixel(source, sx, sy);
		if (c[3] >= 220) setPixel(out, x, y, [c[0], c[1], c[2], 255]);
	}
	return out;
}

export function silverHead(original: RGBAImage, hair: RGBAImage, head: Point, top: Point, neckY: number, female: boolean, dir: string): RGBAImage {
	const out = createImage(original.width, original.height);
	const cx = head[0];
	const shiftX = dir === 'W' || dir === 'NW' || dir === 'SW' ? -2 : 0;
	const dx = cx - Math.floor(hair.width / 2) + shiftX;
	const dy = top[1] - 2;
	for (let y = 0; y < hair.height; y++) for (let x = 0; x < hair.width; x++) {
		const c = getPixel(hair, x, y);
		if (c[3]) setPixel(out, dx + x, dy + y, c);
	}
	// Mặt gốc được đưa lên trước lọn tóc; giữ mắt và đường nét biểu cảm.
	for (let y = Math.max(0, head[1] - 1); y <= neckY; y++) for (let x = cx - 8; x <= cx + 8; x++) {
		const c = getPixel(original, x, y);
		if (!c[3]) continue;
		const center = Math.abs(x - cx) <= (female ? 7 : 6);
		const skin = c[0] > 135 && c[0] > c[2] + 24 && c[1] > c[2] + 12;
		const eye = y <= head[1] + 5 && Math.abs(x - cx) <= 5 && c[0] < 105;
		if (center && (skin || eye)) setPixel(out, x, y, c);
	}
	return out;
}

// Gắn cutout vũ khí theo điểm nắm trên từng pose. Chỉ đổi góc weapon; pose người vẫn là tranh gốc.
export function weaponFrame(source: RGBAImage, grip: Point, action: string, frame: number, dir: string, staff: boolean, authoredAngle?: number, sourceGrip?: Point, preserveHandle = false): RGBAImage {
	const out = createImage(112, 112);
	const sweep = [-105, -125, -150, -55, 5, 40, 65, -80];
	let angle = staff ? -83 : action === 'attack' ? sweep[frame % sweep.length]! : -83;
	if (dir === 'W' || dir === 'NW' || dir === 'SW') angle = 180 - angle;
	if (authoredAngle !== undefined) angle = authoredAngle;
	const theta = (angle + 90) * Math.PI / 180;
	const cosine = Math.cos(theta), sine = Math.sin(theta);
	const sx0 = sourceGrip?.[0] ?? (source.width - 1) / 2, sy0 = sourceGrip?.[1] ?? (staff ? Math.round(source.height * .62) : Math.round(source.height * .83));
	for (let y = Math.max(0, grip[1] - 55); y < Math.min(112, grip[1] + 55); y++)
		for (let x = Math.max(0, grip[0] - 55); x < Math.min(112, grip[0] + 55); x++) {
			const dx = x - grip[0], dy = y - grip[1];
			const sx = Math.round(cosine * dx + sine * dy + sx0);
			const sy = Math.round(-sine * dx + cosine * dy + sy0);
			const c = getPixel(source, sx, sy);
			if (c[3]) setPixel(out, x, y, c);
		}
	if (!preserveHandle) for (let y = -1; y <= 1; y++) for (let x = -1; x <= 1; x++) setPixel(out, grip[0] + x, grip[1] + y, [0, 0, 0, 0]);
	return out;
}

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { PNG } from 'pngjs';

/** Ảnh RGBA 8-bit, không nội suy — mọi phép biến đổi ở đây đều giữ nguyên lưới pixel. */
export interface RGBAImage {
	width: number;
	height: number;
	data: Uint8Array;
}

export type RGBA = readonly [number, number, number, number];

export function createImage(width: number, height: number): RGBAImage {
	return { width, height, data: new Uint8Array(width * height * 4) };
}

export function readPng(path: string): RGBAImage {
	const png = PNG.sync.read(readFileSync(path));
	return { width: png.width, height: png.height, data: new Uint8Array(png.data) };
}

export function decodePng(buffer: Buffer): RGBAImage {
	const png = PNG.sync.read(buffer);
	return { width: png.width, height: png.height, data: new Uint8Array(png.data) };
}

export function writePng(path: string, img: RGBAImage): void {
	mkdirSync(dirname(path), { recursive: true });
	const png = new PNG({ width: img.width, height: img.height });
	png.data = Buffer.from(img.data);
	const bytes = PNG.sync.write(png, { colorType: 6 });
	for (let attempt = 0; ; attempt++) {
		try { writeFileSync(path, bytes); break; }
		catch (error) {
			if (attempt >= 4 || !['UNKNOWN', 'EBUSY', 'EPERM'].includes((error as NodeJS.ErrnoException).code ?? '')) throw error;
			Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100 * (attempt + 1));
		}
	}
}

export function getPixel(img: RGBAImage, x: number, y: number): RGBA {
	if (x < 0 || y < 0 || x >= img.width || y >= img.height) return [0, 0, 0, 0];
	const i = (y * img.width + x) * 4;
	return [img.data[i]!, img.data[i + 1]!, img.data[i + 2]!, img.data[i + 3]!];
}

export function setPixel(img: RGBAImage, x: number, y: number, c: RGBA): void {
	if (x < 0 || y < 0 || x >= img.width || y >= img.height) return;
	const i = (y * img.width + x) * 4;
	img.data[i] = c[0];
	img.data[i + 1] = c[1];
	img.data[i + 2] = c[2];
	img.data[i + 3] = c[3];
}

export function alphaAt(img: RGBAImage, x: number, y: number): number {
	if (x < 0 || y < 0 || x >= img.width || y >= img.height) return 0;
	return img.data[(y * img.width + x) * 4 + 3]!;
}

export function cloneImage(img: RGBAImage): RGBAImage {
	return { width: img.width, height: img.height, data: new Uint8Array(img.data) };
}

export function crop(img: RGBAImage, x0: number, y0: number, w: number, h: number): RGBAImage {
	const out = createImage(w, h);
	for (let y = 0; y < h; y += 1) {
		for (let x = 0; x < w; x += 1) setPixel(out, x, y, getPixel(img, x0 + x, y0 + y));
	}
	return out;
}

/** Dán đè (alpha cứng: pixel nguồn có alpha > 0 thì thay hẳn). */
export function blit(dst: RGBAImage, src: RGBAImage, dx: number, dy: number): void {
	for (let y = 0; y < src.height; y += 1) {
		for (let x = 0; x < src.width; x += 1) {
			const c = getPixel(src, x, y);
			if (c[3] > 0) setPixel(dst, dx + x, dy + y, c);
		}
	}
}

export function fill(img: RGBAImage, c: RGBA): void {
	for (let i = 0; i < img.width * img.height; i += 1) img.data.set(c, i * 4);
}

/** Phóng to nguyên lần bằng nearest-neighbor — chỉ dùng cho ảnh xem/kiểm, không dùng cho asset game. */
export function scaleNearest(img: RGBAImage, factor: number): RGBAImage {
	const out = createImage(img.width * factor, img.height * factor);
	for (let y = 0; y < out.height; y += 1) {
		for (let x = 0; x < out.width; x += 1) {
			setPixel(out, x, y, getPixel(img, Math.floor(x / factor), Math.floor(y / factor)));
		}
	}
	return out;
}

export interface Box {
	x0: number;
	y0: number;
	x1: number;
	y1: number;
}

/** Hộp bao vùng có alpha > 0; x1/y1 là biên NGOÀI (exclusive). `null` nếu ảnh rỗng. */
export function opaqueBounds(img: RGBAImage): Box | null {
	let x0 = img.width;
	let y0 = img.height;
	let x1 = -1;
	let y1 = -1;
	for (let y = 0; y < img.height; y += 1) {
		for (let x = 0; x < img.width; x += 1) {
			if (alphaAt(img, x, y) === 0) continue;
			if (x < x0) x0 = x;
			if (y < y0) y0 = y;
			if (x > x1) x1 = x;
			if (y > y1) y1 = y;
		}
	}
	return x1 < 0 ? null : { x0, y0, x1: x1 + 1, y1: y1 + 1 };
}

export function colorKey(c: RGBA): number {
	return (c[0] << 16) | (c[1] << 8) | c[2];
}

export function keyToHex(key: number): string {
	return `#${key.toString(16).padStart(6, '0')}`;
}

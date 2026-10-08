import { alphaAt, blit, createImage, getPixel, opaqueBounds, setPixel, type RGBAImage } from '../image/rgba.js';
import type { AnimationName, Direction } from '../providers/types.js';

export type AnimationFrames = Partial<Record<AnimationName, Partial<Record<Direction, RGBAImage[]>>>>;

export interface NormalizeOptions {
	canvas: { width: number; height: number };
	/** Toạ độ y (trong canvas đích) của mép dưới bàn chân — điểm neo chung của MỌI nguồn asset. */
	baselineY: number;
	/** Alpha dưới ngưỡng này thành trong suốt, từ ngưỡng trở lên thành đặc — xoá viền mờ. */
	alphaThreshold?: number;
}

export interface NormalizeReport {
	detectedScale: number;
	sourceBaseline: number;
	offset: { x: number; y: number };
	semiAlphaFixed: number;
}

/**
 * Đưa asset khác nguồn về cùng một chuẩn: đúng lưới pixel gốc (gỡ ảnh đã bị phóng to), alpha cứng,
 * canvas cố định, chân đứng trên cùng một baseline.
 *
 * Offset được tính MỘT LẦN cho cả nhân vật (không căn từng frame theo hộp bao) — căn từng frame sẽ
 * xoá mất nhịp nhún của chu kỳ đi và làm nhân vật rung khi đổi hướng.
 */
export function normalizeCharacter(input: AnimationFrames, opts: NormalizeOptions): { frames: AnimationFrames; report: NormalizeReport } {
	const all = flatten(input);
	if (all.length === 0) throw new Error('Không có frame nào để chuẩn hoá');

	const scale = Math.min(...all.map(detectPixelScale));
	let semiAlphaFixed = 0;
	const prepared = mapFrames(input, (img) => {
		const down = scale > 1 ? downscale(img, scale) : img;
		const { image, fixed } = hardenAlpha(down, opts.alphaThreshold ?? 128);
		semiAlphaFixed += fixed;
		return image;
	});

	const reference = prepared.idle ?? Object.values(prepared)[0]!;
	let sourceBaseline = 0;
	for (const frames of Object.values(reference)) {
		for (const f of frames ?? []) sourceBaseline = Math.max(sourceBaseline, opaqueBounds(f)?.y1 ?? 0);
	}
	const sample = flatten(prepared)[0]!;
	const offset = { x: Math.floor((opts.canvas.width - sample.width) / 2), y: opts.baselineY - sourceBaseline };

	const frames = mapFrames(prepared, (img) => {
		const out = createImage(opts.canvas.width, opts.canvas.height);
		blit(out, img, offset.x, offset.y);
		return out;
	});
	return { frames, report: { detectedScale: scale, sourceBaseline, offset, semiAlphaFixed } };
}

/** Bội số phóng to của ảnh pixel art = ƯCLN mọi độ dài dải màu liền nhau theo cả 2 trục. */
export function detectPixelScale(img: RGBAImage): number {
	let g = 0;
	const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
	const same = (x0: number, y0: number, x1: number, y1: number): boolean => {
		const a = getPixel(img, x0, y0);
		const b = getPixel(img, x1, y1);
		return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
	};
	for (let y = 0; y < img.height && g !== 1; y += 1) {
		let run = 1;
		for (let x = 1; x <= img.width; x += 1) {
			if (x < img.width && same(x, y, x - 1, y)) run += 1;
			else {
				if (x < img.width || run < img.width) g = gcd(g, run);
				run = 1;
			}
		}
	}
	for (let x = 0; x < img.width && g !== 1; x += 1) {
		let run = 1;
		for (let y = 1; y <= img.height; y += 1) {
			if (y < img.height && same(x, y, x, y - 1)) run += 1;
			else {
				if (y < img.height || run < img.height) g = gcd(g, run);
				run = 1;
			}
		}
	}
	return Math.max(1, g);
}

function downscale(img: RGBAImage, factor: number): RGBAImage {
	const out = createImage(Math.floor(img.width / factor), Math.floor(img.height / factor));
	for (let y = 0; y < out.height; y += 1) {
		for (let x = 0; x < out.width; x += 1) setPixel(out, x, y, getPixel(img, x * factor, y * factor));
	}
	return out;
}

function hardenAlpha(img: RGBAImage, threshold: number): { image: RGBAImage; fixed: number } {
	const out = createImage(img.width, img.height);
	let fixed = 0;
	for (let y = 0; y < img.height; y += 1) {
		for (let x = 0; x < img.width; x += 1) {
			const a = alphaAt(img, x, y);
			if (a > 0 && a < 255) fixed += 1;
			if (a >= threshold) {
				const c = getPixel(img, x, y);
				setPixel(out, x, y, [c[0], c[1], c[2], 255]);
			}
		}
	}
	return { image: out, fixed };
}

export function flatten(frames: AnimationFrames): RGBAImage[] {
	return Object.values(frames).flatMap((dirs) => Object.values(dirs ?? {}).flatMap((list) => list ?? []));
}

export function mapFrames(frames: AnimationFrames, fn: (img: RGBAImage, anim: AnimationName, dir: Direction, index: number) => RGBAImage): AnimationFrames {
	const out: AnimationFrames = {};
	for (const [anim, dirs] of Object.entries(frames) as [AnimationName, Partial<Record<Direction, RGBAImage[]>>][]) {
		const next: Partial<Record<Direction, RGBAImage[]>> = {};
		for (const [dir, list] of Object.entries(dirs) as [Direction, RGBAImage[]][]) {
			next[dir] = list.map((img, i) => fn(img, anim, dir, i));
		}
		out[anim] = next;
	}
	return out;
}

import { cloneImage, type RGBAImage } from '../image/rgba.js';

export type Palette = [number, number, number][];

/**
 * Bảng màu của nhân vật lấy từ ảnh tham chiếu (k-means trên pixel đặc, khởi tạo theo tần suất).
 * Ảnh sinh bằng AI hay dùng 240–256 màu với vô số bậc gần giống nhau; ép MỌI frame về cùng một
 * bảng vừa đúng kỷ luật pixel art vừa bảo đảm màu không trôi giữa các frame/hướng.
 */
export function buildPalette(images: RGBAImage[], size: number, iterations = 12): Palette {
	const counts = new Map<number, number>();
	for (const img of images) {
		for (let i = 0; i < img.width * img.height; i += 1) {
			if (img.data[i * 4 + 3] === 0) continue;
			const k = (img.data[i * 4]! << 16) | (img.data[i * 4 + 1]! << 8) | img.data[i * 4 + 2]!;
			counts.set(k, (counts.get(k) ?? 0) + 1);
		}
	}
	const colors = [...counts].map(([k, n]) => ({ c: [(k >> 16) & 255, (k >> 8) & 255, k & 255] as [number, number, number], n }));
	if (colors.length <= size) return colors.map((x) => x.c);

	// Khởi tạo farthest-point có trọng số để màu nhỏ nhưng khác biệt (mắt xanh, viền đỏ) không bị nuốt.
	colors.sort((a, b) => b.n - a.n);
	const centers: [number, number, number][] = [colors[0]!.c];
	while (centers.length < size) {
		let best = colors[0]!;
		let bestScore = -1;
		for (const col of colors) {
			const d = Math.min(...centers.map((c) => dist2(c, col.c)));
			const score = d * Math.sqrt(col.n);
			if (score > bestScore) {
				bestScore = score;
				best = col;
			}
		}
		centers.push([...best.c]);
	}
	for (let it = 0; it < iterations; it += 1) {
		const sum = centers.map(() => [0, 0, 0, 0]);
		for (const col of colors) {
			const j = nearestIndex(centers, col.c);
			const s = sum[j]!;
			s[0]! += col.c[0] * col.n;
			s[1]! += col.c[1] * col.n;
			s[2]! += col.c[2] * col.n;
			s[3]! += col.n;
		}
		sum.forEach((s, j) => {
			if (s[3]! > 0) centers[j] = [Math.round(s[0]! / s[3]!), Math.round(s[1]! / s[3]!), Math.round(s[2]! / s[3]!)];
		});
	}
	return centers;
}

export function applyPalette(img: RGBAImage, palette: Palette): RGBAImage {
	const out = cloneImage(img);
	const cache = new Map<number, [number, number, number]>();
	for (let i = 0; i < img.width * img.height; i += 1) {
		if (img.data[i * 4 + 3] === 0) continue;
		const k = (img.data[i * 4]! << 16) | (img.data[i * 4 + 1]! << 8) | img.data[i * 4 + 2]!;
		let c = cache.get(k);
		if (!c) {
			c = palette[nearestIndex(palette, [(k >> 16) & 255, (k >> 8) & 255, k & 255])]!;
			cache.set(k, c);
		}
		out.data[i * 4] = c[0];
		out.data[i * 4 + 1] = c[1];
		out.data[i * 4 + 2] = c[2];
	}
	return out;
}

function nearestIndex(palette: Palette, c: [number, number, number]): number {
	let best = 0;
	let bestD = Infinity;
	palette.forEach((p, i) => {
		const d = dist2(p, c);
		if (d < bestD) {
			bestD = d;
			best = i;
		}
	});
	return best;
}

/** Khoảng cách có trọng số cảm nhận (mắt nhạy với xanh lá hơn đỏ/lam). */
function dist2(a: [number, number, number], b: [number, number, number]): number {
	const dr = a[0] - b[0];
	const dg = a[1] - b[1];
	const db = a[2] - b[2];
	return 2 * dr * dr + 4 * dg * dg + 3 * db * db;
}

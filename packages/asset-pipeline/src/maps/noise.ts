/** Nhiễu giá trị 2D có hạt giống — rẻ, xác định, đủ cho mặt đất pixel art (không cần Perlin thật). */
export function hash2(x: number, y: number, seed: number): number {
	let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
	h = Math.imul(h ^ (h >>> 13), 1274126177);
	h ^= h >>> 16;
	return (h >>> 0) / 4294967296;
}

export function valueNoise(x: number, y: number, seed: number): number {
	const xi = Math.floor(x);
	const yi = Math.floor(y);
	const xf = x - xi;
	const yf = y - yi;
	const u = xf * xf * (3 - 2 * xf);
	const v = yf * yf * (3 - 2 * yf);
	const a = hash2(xi, yi, seed);
	const b = hash2(xi + 1, yi, seed);
	const c = hash2(xi, yi + 1, seed);
	const d = hash2(xi + 1, yi + 1, seed);
	return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export function fbm(x: number, y: number, seed: number, octaves = 3): number {
	let sum = 0;
	let amp = 0.5;
	let freq = 1;
	let norm = 0;
	for (let i = 0; i < octaves; i += 1) {
		sum += valueNoise(x * freq, y * freq, seed + i * 101) * amp;
		norm += amp;
		amp *= 0.5;
		freq *= 2;
	}
	return sum / norm;
}

/** Ma trận Bayer 4×4 chuẩn hoá về [-0.5, 0.5) — dither có trật tự cho cảm giác pixel art. */
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export function bayer(x: number, y: number): number {
	return BAYER4[(y & 3) * 4 + (x & 3)]! / 16 - 0.5;
}

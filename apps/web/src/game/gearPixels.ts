import type { Rarity } from './equipment';

/**
 * Xử lý điểm ảnh THUẦN cho ảnh đồ gắn (không DOM — test được): thu nhỏ nguyên lần + nhuộm/viền theo độ hiếm. Trình duyệt
 * gọi qua `gearTexture.ts` (canvas → texture Pixi / ảnh trong kho đồ) — cùng một kết quả cho game và kho đồ.
 */

export interface Pixels {
	width: number;
	height: number;
	data: Uint8ClampedArray;
}

/**
 * Hiệu ứng độ hiếm bằng CODE (không tốn art): nhuộm nhẹ về màu bậc (giữ sáng tối của nét vẽ) + viền 1px màu bậc. Thường
 * thì để nguyên. Màu viền chọn sáng để nổi trên cả cỏ lẫn đá tối.
 */
export const RARITY_FX: Record<Rarity, { color: [number, number, number]; tint: number } | null> = {
	common: null,
	fine: { color: [120, 230, 110], tint: 0.1 },
	rare: { color: [90, 165, 255], tint: 0.16 },
	epic: { color: [200, 125, 255], tint: 0.2 },
	legendary: { color: [255, 175, 60], tint: 0.24 },
};

/** Lề trong suốt quanh ảnh đã xử lý (chỗ cho viền) — điểm nắm dịch theo đúng số này. */
export const GEAR_PAD = 1;

/**
 * Thu ½ cho pixel art: mỗi ô 2×2 lấy điểm có hình ĐẦU TIÊN (trên-trái → dưới-phải) thay vì trung bình — nét viền 1px không
 * bị nhoè/mất, màu giữ đúng bảng màu gốc.
 */
export function halve(src: Pixels): Pixels {
	const width = Math.ceil(src.width / 2);
	const height = Math.ceil(src.height / 2);
	const data = new Uint8ClampedArray(width * height * 4);
	for (let y = 0; y < height; y += 1) {
		for (let x = 0; x < width; x += 1) {
			for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]] as const) {
				const sx = x * 2 + dx;
				const sy = y * 2 + dy;
				if (sx >= src.width || sy >= src.height) continue;
				const i = (sy * src.width + sx) * 4;
				if (src.data[i + 3]! === 0) continue;
				data.set(src.data.subarray(i, i + 4), (y * width + x) * 4);
				break;
			}
		}
	}
	return { width, height, data };
}

/**
 * Ảnh đồ gắn sẵn sàng vẽ: thu theo `scale`, chừa lề `GEAR_PAD`, nhuộm + viền theo `rarity`. Điểm nắm trong ảnh kết quả =
 * `round(grip × scale) + GEAR_PAD` (`gripIn`).
 */
export function prepareGearPixels(src: Pixels, scale: number, rarity: Rarity): Pixels {
	const img = scale === 0.5 ? halve(src) : src;
	const W = img.width + GEAR_PAD * 2;
	const H = img.height + GEAR_PAD * 2;
	const data = new Uint8ClampedArray(W * H * 4);
	for (let y = 0; y < img.height; y += 1) data.set(img.data.subarray(y * img.width * 4, (y + 1) * img.width * 4), ((y + GEAR_PAD) * W + GEAR_PAD) * 4);
	const fx = RARITY_FX[rarity];
	if (!fx) return { width: W, height: H, data };
	const [cr, cg, cb] = fx.color;
	const solid = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H && data[(y * W + x) * 4 + 3]! > 0;
	const ring: number[] = [];
	for (let y = 0; y < H; y += 1) {
		for (let x = 0; x < W; x += 1) {
			const i = (y * W + x) * 4;
			if (data[i + 3]! > 0) {
				const lum = (data[i]! * 0.3 + data[i + 1]! * 0.59 + data[i + 2]! * 0.11) / 255;
				const k = fx.tint;
				data[i] = Math.round(data[i]! * (1 - k) + cr * lum * k * 1.4);
				data[i + 1] = Math.round(data[i + 1]! * (1 - k) + cg * lum * k * 1.4);
				data[i + 2] = Math.round(data[i + 2]! * (1 - k) + cb * lum * k * 1.4);
			} else if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) ring.push(i);
		}
	}
	for (const i of ring) data.set([cr, cg, cb, 235], i);
	return { width: W, height: H, data };
}

/** Điểm nắm trong ảnh đã xử lý. */
export function gripIn(grip: readonly [number, number], scale: number): [number, number] {
	return [Math.round(grip[0] * scale) + GEAR_PAD, Math.round(grip[1] * scale) + GEAR_PAD];
}

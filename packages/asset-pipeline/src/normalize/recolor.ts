import { hexToRgb, hslToRgb, hueInRange, luminance, rgbToHsl } from '../image/color.js';
import { alphaAt, cloneImage, getPixel, opaqueBounds, setPixel, type RGBA, type RGBAImage } from '../image/rgba.js';
import { isOutline, isSkin } from './cleanup.js';

/**
 * Biến thể màu theo quy tắc — áp y hệt lên MỌI frame nên nhất quán giữa các hướng/animation
 * là điều đã bảo đảm sẵn, không phụ thuộc AI.
 */
export type RecolorRule =
	| {
			kind: 'hsl';
			name: string;
			hue: [number, number];
			minSat?: number;
			maxLum?: number;
			lightness?: number;
			saturation?: number;
			hueShift?: number;
			/**
			 * Đặt hẳn hue theo độ sáng (tối → [0], sáng → [1]) thay vì dịch: dải màu rộng (lá xanh vàng → xanh lam)
			 * dịch đều sẽ không ra một tông thu. Nội suy tuyến tính — đừng cho dải vắt qua 360° ([354, 34] ra màu lam).
			 */
			hueTo?: [number, number];
	  }
	| {
			/** Tóc lộ ra dưới mũ trùm: pixel tối giáp da ở phần đầu, không phải viền ngoài, không phải mắt. */
			kind: 'hood-hair';
			name: string;
			headRatio: number;
			light: string;
			shadow: string;
	  };

export function applyRecolor(img: RGBAImage, rules: readonly RecolorRule[]): RGBAImage {
	let out = img;
	for (const rule of rules) out = rule.kind === 'hsl' ? applyHsl(out, rule) : applyHoodHair(out, rule);
	return out;
}

function applyHsl(img: RGBAImage, rule: Extract<RecolorRule, { kind: 'hsl' }>): RGBAImage {
	const out = cloneImage(img);
	for (let y = 0; y < img.height; y += 1) {
		for (let x = 0; x < img.width; x += 1) {
			const c = getPixel(img, x, y);
			if (c[3] === 0 || isOutline(c)) continue;
			const hsl = rgbToHsl(c[0], c[1], c[2]);
			if (!hueInRange(hsl.h, rule.hue) || hsl.s < (rule.minSat ?? 0) || hsl.l > (rule.maxLum ?? 1)) continue;
			const [r, g, b] = hslToRgb({
				h: rule.hueTo ? rule.hueTo[0] + (rule.hueTo[1] - rule.hueTo[0]) * hsl.l : hsl.h + (rule.hueShift ?? 0),
				s: Math.min(1, hsl.s * (rule.saturation ?? 1)),
				l: Math.min(1, hsl.l * (rule.lightness ?? 1)),
			});
			setPixel(out, x, y, [r, g, b, 255]);
		}
	}
	return out;
}

function applyHoodHair(img: RGBAImage, rule: Extract<RecolorRule, { kind: 'hood-hair' }>): RGBAImage {
	const box = opaqueBounds(img);
	if (!box) return img;
	const out = cloneImage(img);
	const light = [...hexToRgb(rule.light), 255] as RGBA;
	const shadow = [...hexToRgb(rule.shadow), 255] as RGBA;
	const yMax = box.y0 + Math.round((box.y1 - box.y0) * rule.headRatio);
	const n8 = (x: number, y: number): RGBA[] => {
		const list: RGBA[] = [];
		for (let dy = -1; dy <= 1; dy += 1) for (let dx = -1; dx <= 1; dx += 1) if (dx || dy) list.push(getPixel(img, x + dx, y + dy));
		return list;
	};
	const isEyeWhite = (c: RGBA): boolean => c[3] > 0 && luminance(c[0], c[1], c[2]) > 0.8 && rgbToHsl(c[0], c[1], c[2]).s < 0.25;
	const isEyeIris = (c: RGBA): boolean => {
		if (c[3] === 0) return false;
		const { h, s, l } = rgbToHsl(c[0], c[1], c[2]);
		return h >= 185 && h <= 235 && s > 0.3 && l > 0.45;
	};
	for (let y = box.y0; y < yMax; y += 1) {
		for (let x = box.x0; x < box.x1; x += 1) {
			const c = getPixel(img, x, y);
			if (!isOutline(c)) continue;
			const near = n8(x, y);
			if (!near.some(isSkin)) continue;
			if (near.some((n) => isEyeWhite(n) || isEyeIris(n))) continue;
			// Chừa lông mày (1–3 hàng ngay trên mắt): lông mày bạc làm mắt nhìn thẳng mất nét.
			let browOfEye = false;
			for (let dy = 1; dy <= 3 && !browOfEye; dy += 1) {
				for (let dx = -1; dx <= 1; dx += 1) {
					const below = getPixel(img, x + dx, y + dy);
					if (isEyeWhite(below) || isEyeIris(below)) browOfEye = true;
				}
			}
			if (browOfEye) continue;
			const onSilhouette = [alphaAt(img, x + 1, y), alphaAt(img, x - 1, y), alphaAt(img, x, y + 1), alphaAt(img, x, y - 1)].includes(0);
			if (onSilhouette) continue;
			setPixel(out, x, y, near.filter(isSkin).length >= 3 ? light : shadow);
		}
	}
	return out;
}

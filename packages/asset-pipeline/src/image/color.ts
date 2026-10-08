export interface HSL {
	h: number; // 0..360
	s: number; // 0..1
	l: number; // 0..1
}

export function rgbToHsl(r: number, g: number, b: number): HSL {
	const rn = r / 255;
	const gn = g / 255;
	const bn = b / 255;
	const max = Math.max(rn, gn, bn);
	const min = Math.min(rn, gn, bn);
	const l = (max + min) / 2;
	if (max === min) return { h: 0, s: 0, l };
	const d = max - min;
	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
	let h: number;
	if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
	else if (max === gn) h = (bn - rn) / d + 2;
	else h = (rn - gn) / d + 4;
	return { h: h * 60, s, l };
}

export function hslToRgb({ h, s, l }: HSL): [number, number, number] {
	const hue2rgb = (p: number, q: number, t: number): number => {
		let tt = t;
		if (tt < 0) tt += 1;
		if (tt > 1) tt -= 1;
		if (tt < 1 / 6) return p + (q - p) * 6 * tt;
		if (tt < 1 / 2) return q;
		if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
		return p;
	};
	if (s === 0) {
		const v = Math.round(l * 255);
		return [v, v, v];
	}
	const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
	const p = 2 * l - q;
	const hn = (((h % 360) + 360) % 360) / 360;
	return [
		Math.round(hue2rgb(p, q, hn + 1 / 3) * 255),
		Math.round(hue2rgb(p, q, hn) * 255),
		Math.round(hue2rgb(p, q, hn - 1 / 3) * 255),
	];
}

/** Độ sáng cảm nhận 0..1 (Rec. 709). */
export function luminance(r: number, g: number, b: number): number {
	return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

export function hexToRgb(hex: string): [number, number, number] {
	const v = parseInt(hex.replace('#', ''), 16);
	return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

export function hueInRange(h: number, [from, to]: readonly [number, number]): boolean {
	return from <= to ? h >= from && h <= to : h >= from || h <= to;
}

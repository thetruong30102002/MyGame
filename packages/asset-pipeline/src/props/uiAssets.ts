import { alphaAt, type RGBAImage } from '../image/rgba.js';

/**
 * Ảnh giao diện (07/10/2026: chủ dự án muốn MỌI khung trong game cùng style cổ như phần còn lại) — cắt từ tấm PixelLab:
 * U1 khung cửa sổ / ô vật phẩm / nút / dải tiêu đề, I1 biểu tượng vật phẩm + chỉ số. Ra `assets/ui/<id>.png`
 * + `ui.json` (cỡ ảnh, độ dày viền 9 mảnh). Web dùng khung bằng CSS `border-image` (co giãn không vỡ góc).
 */
export interface UiAssetDef {
	id: string;
	/** Ô của tấm: `sheet:<tấm>#<ô>@<cột>x<hàng>` (props/sheet.ts). */
	path: string;
	/** Khung co giãn 9 mảnh: `hollow` = khung rỗng ruột (đo viền từ mép tới ruột trong suốt); `filled` = khối đặc (nút, dải tiêu đề) → cắt theo tỉ lệ. */
	nine?: 'hollow' | 'filled';
	/** Chỉ cho `filled`: tỉ lệ mép trái/phải và trên/dưới giữ nguyên khi co giãn. */
	capX?: number;
	capY?: number;
}

const U = (i: number) => `sheet:U1_frames#${i}@2x2`;
const I = (i: number) => `sheet:I1_icons#${i}@3x3`;

export const UI_ASSETS: UiAssetDef[] = [
	{ id: 'frame', path: U(0), nine: 'hollow' },
	{ id: 'slot', path: U(1), nine: 'hollow' },
	{ id: 'button', path: U(2), nine: 'filled', capX: 0.22, capY: 0.4 },
	{ id: 'banner', path: U(3), nine: 'filled', capX: 0.24, capY: 0.42 },
	{ id: 'icon_potion', path: I(0) },
	{ id: 'icon_coins', path: I(1) },
	{ id: 'icon_backpack', path: I(2) },
	{ id: 'icon_hp', path: I(3) },
	{ id: 'icon_mp', path: I(4) },
	{ id: 'icon_attack', path: I(5) },
	{ id: 'icon_magic', path: I(6) },
	{ id: 'icon_defense', path: I(7) },
	{ id: 'icon_star', path: I(8) },
];

export interface NineSlice {
	top: number;
	right: number;
	bottom: number;
	left: number;
}

/**
 * Độ dày viền của khung rỗng ruột: đi từ mép vào theo hàng/cột GIỮA ảnh tới điểm trong suốt đầu tiên (ruột). Lấy
 * thêm 2px cho chắc phủ hết hoa văn góc; khung không rỗng (đo ra hết chiều) thì trả null.
 */
export function measureHollow(img: RGBAImage): NineSlice | null {
	const { width: w, height: h } = img;
	const midX = Math.floor(w / 2);
	const midY = Math.floor(h / 2);
	const run = (from: number, to: number, step: number, at: (i: number) => number): number => {
		let n = 0;
		let seenSolid = false;
		for (let i = from; i !== to; i += step) {
			const a = at(i);
			if (a) seenSolid = true;
			else if (seenSolid) return n;
			n += 1;
		}
		return -1;
	};
	const left = run(0, w, 1, (x) => alphaAt(img, x, midY));
	const right = run(w - 1, -1, -1, (x) => alphaAt(img, x, midY));
	const top = run(0, h, 1, (y) => alphaAt(img, midX, y));
	const bottom = run(h - 1, -1, -1, (y) => alphaAt(img, midX, y));
	if ([left, right, top, bottom].some((v) => v < 0)) return null;
	// Góc chạm khắc thường dày hơn cạnh: lấy viền lớn nhất cho cả bốn phía + 2px, không vượt nửa cạnh ảnh.
	const t = Math.min(Math.floor(Math.min(w, h) / 2) - 1, Math.max(left, right, top, bottom) + 2);
	return { top: t, right: t, bottom: t, left: t };
}

export function filledSlice(img: RGBAImage, capX: number, capY: number): NineSlice {
	const x = Math.max(2, Math.round(img.width * capX));
	const y = Math.max(2, Math.round(img.height * capY));
	return { top: y, right: x, bottom: y, left: x };
}

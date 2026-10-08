import { join } from 'node:path';
import { createImage, crop, opaqueBounds, readPng, type RGBAImage } from '../image/rgba.js';

/**
 * Đồ vật cắt từ TẤM PixelLab: một ảnh Pro Flash vẽ nhiều đồ vật xếp lưới (5–6 lượt cho cả tấm thay vì mỗi món 5–6
 * lượt), cùng một ảnh mẫu style nên nét đồng nhất. `path` của PropDef: `sheet:<tên tấm>#<ô>@<cột>x<hàng>`, ô đánh
 * số từ 0 theo hàng (trái → phải, trên → dưới). Tấm nằm ở `sources/pixellab/sheets/<tên>.png` (lệnh `pixellab image`).
 */
export const SHEET_PREFIX = 'sheet:';

export interface SheetCell {
	sheet: string;
	index: number;
	cols: number;
	rows: number;
}

export function parseSheetPath(path: string): SheetCell | null {
	const m = /^sheet:([A-Za-z0-9_-]+)#(\d+)@(\d+)x(\d+)$/.exec(path);
	if (!m) return null;
	const cell = { sheet: m[1]!, index: Number(m[2]), cols: Number(m[3]), rows: Number(m[4]) };
	if (cell.index >= cell.cols * cell.rows) throw new Error(`${path}: ô ${cell.index} ngoài lưới ${cell.cols}×${cell.rows}`);
	return cell;
}

/**
 * Nền magenta (#FF00FF) của tấm vẽ CÓ nền: Pro Flash tách nền tự động đôi khi xoá sạch cả ảnh ("Background removal
 * erased the whole image"), nên tấm nhiều món được yêu cầu vẽ trên magenta rồi tách ở đây. Nhận theo SẮC (đỏ và lam
 * cùng vượt lục xa) chứ không theo một mã màu, để bắt cả viền nhạt/đậm của nền.
 */
export function isChromaMagenta(r: number, g: number, b: number): boolean {
	return r - g > 90 && b - g > 90 && Math.abs(r - b) < 80;
}

export function keyMagenta(img: RGBAImage): number {
	let n = 0;
	const d = img.data;
	for (let i = 0; i < d.length; i += 4) {
		if (d[i + 3] && isChromaMagenta(d[i]!, d[i + 1]!, d[i + 2]!)) {
			d[i + 3] = 0;
			n += 1;
		}
	}
	// Viền trộn nền: điểm ánh tím sát vùng trong suốt — sáng thì bỏ, tối thì về màu viền đen như phần còn lại.
	if (n) for (let pass = 0; pass < 2; pass += 1) defringe(img);
	return n;
}

const OUTLINE: [number, number, number] = [8, 6, 10];

function defringe(img: RGBAImage): void {
	const { width: w, height: h, data: d } = img;
	const clear = (x: number, y: number) => x < 0 || y < 0 || x >= w || y >= h || !d[(y * w + x) * 4 + 3];
	const hits: number[] = [];
	for (let y = 0; y < h; y += 1)
		for (let x = 0; x < w; x += 1) {
			const i = (y * w + x) * 4;
			const [r, g, b] = [d[i]!, d[i + 1]!, d[i + 2]!];
			if (!d[i + 3] || !(r > g + 40 && b > g + 40 && Math.abs(r - b) < 90)) continue;
			if (clear(x - 1, y) || clear(x + 1, y) || clear(x, y - 1) || clear(x, y + 1)) hits.push(i);
		}
	for (const i of hits) {
		if (Math.max(d[i]!, d[i + 2]!) > 120) d[i + 3] = 0;
		else d.set(OUTLINE, i);
	}
}

/**
 * Cắt một ô của tấm, tách nền, bỏ mẩu lấn sang từ ô bên cạnh (cụm nhỏ chạm mép ô), cắt sát. Ô rỗng thì ném lỗi —
 * pipeline báo và bỏ qua đồ vật đó, map vẫn dựng được.
 */
export function loadSheetCell(dir: string, cell: SheetCell): RGBAImage {
	const sheet = readPng(join(dir, `${cell.sheet}.png`));
	keyMagenta(sheet);
	const cw = Math.floor(sheet.width / cell.cols);
	const ch = Math.floor(sheet.height / cell.rows);
	const img = crop(sheet, (cell.index % cell.cols) * cw, Math.floor(cell.index / cell.cols) * ch, cw, ch);
	dropBorderSpill(img);
	// Kiểm nền trên ô CHƯA cắt sát: món có chân vuông lấp kín góc khung sau khi cắt là bình thường.
	const corner = (x: number, y: number) => img.data[(y * img.width + x) * 4 + 3]!;
	if (corner(0, 0) || corner(img.width - 1, 0) || corner(0, img.height - 1) || corner(img.width - 1, img.height - 1)) throw new Error(`ô ${cell.index} của tấm ${cell.sheet} còn nền (góc ô không trong suốt)`);
	const b = opaqueBounds(img);
	if (!b) throw new Error(`ô ${cell.index} của tấm ${cell.sheet} rỗng`);
	return crop(img, b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0);
}

/**
 * Cụm sát mép ô (trong 3px), không phải cụm lớn nhất và nhỏ (< 25% số điểm đục của ô) là phần lấn từ món bên cạnh
 * → xoá. (Mẩu bánh xe cút kít lấn sang ô đèn đường chiếm 12,2% — ngưỡng 12% cũ để lọt.)
 */
function dropBorderSpill(img: RGBAImage): void {
	const { width: w, height: h, data } = img;
	const label = new Int32Array(w * h).fill(-1);
	const comps: { pixels: number[]; touches: boolean }[] = [];
	let total = 0;
	for (let i = 0; i < w * h; i += 1) {
		if (!data[i * 4 + 3] || label[i] !== -1) continue;
		const pixels: number[] = [];
		let touches = false;
		const stack = [i];
		label[i] = comps.length;
		while (stack.length) {
			const p = stack.pop()!;
			pixels.push(p);
			const x = p % w;
			const y = (p - x) / w;
			// "Sát mép" trong 3px chứ không chỉ chạm mép: mẩu lấn sang thường hở mép ô 1–2px (viền/khử răng cưa).
			if (x < 3 || y < 3 || x >= w - 3 || y >= h - 3) touches = true;
			for (const [dx, dy] of [
				[1, 0],
				[-1, 0],
				[0, 1],
				[0, -1],
			] as const) {
				const nx = x + dx;
				const ny = y + dy;
				if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
				const q = ny * w + nx;
				if (label[q] !== -1 || !data[q * 4 + 3]) continue;
				label[q] = comps.length;
				stack.push(q);
			}
		}
		total += pixels.length;
		comps.push({ pixels, touches });
	}
	const largest = Math.max(...comps.map((c) => c.pixels.length));
	for (const c of comps) if (c.touches && c.pixels.length < largest && c.pixels.length < total * 0.25) for (const p of c.pixels) data[p * 4 + 3] = 0;
}

/** Ghép các ô đã cắt thành một ảnh duyệt (nền tối), để soi tấm sau khi tách nền. */
export function sheetPreview(cells: RGBAImage[], cols: number): RGBAImage {
	const cw = Math.max(...cells.map((c) => c.width)) + 8;
	const ch = Math.max(...cells.map((c) => c.height)) + 8;
	const out = createImage(cw * cols, ch * Math.ceil(cells.length / cols));
	for (let i = 0; i < out.data.length; i += 4) out.data.set([30, 32, 44, 255], i);
	cells.forEach((c, k) => {
		const ox = (k % cols) * cw + 4;
		const oy = Math.floor(k / cols) * ch + 4;
		for (let y = 0; y < c.height; y += 1)
			for (let x = 0; x < c.width; x += 1) {
				const s = (y * c.width + x) * 4;
				if (c.data[s + 3]) out.data.set(c.data.subarray(s, s + 4), ((oy + y) * out.width + ox + x) * 4);
			}
	});
	return out;
}

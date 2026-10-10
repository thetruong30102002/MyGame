import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { blit, createImage, opaqueBounds, readPng, scaleNearest, writePng, type RGBAImage } from '../image/rgba.js';
import { keyMagenta, sheetPreview } from './sheet.js';

/**
 * Atlas ICON CHIÊU — icon kỹ năng / bị động / tuyệt kỹ "sắp có" / biểu tượng dự phòng, thay icon TẠM cắt từ khung hiệu ứng.
 * Khoá: id kỹ năng của HERO_SKILLS, `passive:<nhánh>:<mốc>[:<lưu phái>]`, `future:<nhánh>:<mốc>[:<lưu phái>]` hoặc
 * `spare:<nhánh>:<n>` (xem `name_vi`). Xuất MỘT ảnh `ui/skill-icons.png` + `ui/skill-icons.json` = `{ <khoá>: { x, y, w, h } }`.
 *
 * - **v2 (đang dùng, 10/10/2026)** — `sources/pixellab/skill-icons-v2/`: MỘT ảnh PixelLab 32×32 mỗi khoá (pixflux, nền trong
 *   suốt, ép bảng màu nhánh), bảng khoá `skill_icons_v2.json`. Atlas lưới đều ô 32 (`buildSkillIconsV2`).
 * - v1 (lưu trữ) — 10 tấm 3×3 (192×192, nền magenta — `sources/pixellab/skill-icons/SK*.png`), bảng khoá `skill_icons.json`:
 *   `sheets[].icons[]` đúng thứ tự ô (trái → phải, trên → dưới); icon ~64px cắt hộp sát (`buildSkillIcons`). Chủ dự án chê
 *   "xấu, kiểu AI": nhiều chi tiết, hào quang, hạt lấp lánh, và hiện ở ô 16–32px phải thu ⅓ nên nát.
 */
export const SKILL_ICON_GRID = 3;
/** Số cột của atlas — 10 cột × 9 hàng cho 90 icon, ảnh gần vuông. */
export const SKILL_ICON_COLS = 10;
/**
 * Bước lưới làm tròn LÊN bội 12 và icon đặt ở GÓC TRÊN TRÁI ô: web thu icon đúng 1/2, 1/3, 1/4, 1/6 (`fitScale`), toạ độ
 * gốc chia hết thì `background-position` / `background-size` ra số nguyên → mỗi điểm ảnh đích lấy đúng điểm giữa khối n×n,
 * không lệch pha giữa các icon. Khe ≥ 4px để phép lấy mẫu thu nhỏ không với sang icon bên cạnh.
 */
const PITCH_STEP = 12;
const ICON_GAP = 4;

export interface SkillIconTable {
	sheets: { sheet: string; icons: { key: string; name_vi?: string }[] }[];
}

export interface IconRect {
	x: number;
	y: number;
	w: number;
	h: number;
}

export interface CutIcon {
	key: string;
	sheet: string;
	index: number;
	img: RGBAImage;
}

export interface SkillIconIssue {
	key: string;
	sheet: string;
	index: number;
	reason: string;
	/** true = đã bỏ khỏi atlas; false = vẫn xuất nhưng nên soi lại ảnh duyệt. */
	dropped: boolean;
}

/**
 * Cắt mọi ô theo bảng khoá. Không ném lỗi: tấm thiếu, ô rỗng / còn nền, khoá trùng, thừa ô → ghi vào `issues` và bỏ đúng
 * icon đó. Ô có mẩu dính liền icon bên cạnh (phải xén theo mép ô) vẫn xuất nhưng báo để soi ảnh duyệt.
 */
export function cutSkillIcons(dir: string, table: SkillIconTable): { icons: CutIcon[]; issues: SkillIconIssue[] } {
	const icons: CutIcon[] = [];
	const issues: SkillIconIssue[] = [];
	const seen = new Set<string>();
	const cells = SKILL_ICON_GRID * SKILL_ICON_GRID;
	for (const s of table.sheets) {
		let cut: SheetCut[] | null = null;
		if (existsSync(join(dir, `${s.sheet}.png`))) {
			const sheet = readPng(join(dir, `${s.sheet}.png`));
			keyMagenta(sheet);
			cut = cutIconSheet(sheet, SKILL_ICON_GRID);
		}
		s.icons.forEach((ic, index) => {
			const drop = (reason: string) => issues.push({ key: ic.key, sheet: s.sheet, index, reason, dropped: true });
			if (!ic.key) return drop('thiếu khoá');
			if (seen.has(ic.key)) return drop('khoá trùng với ô trước');
			if (index >= cells) return drop(`ngoài lưới ${SKILL_ICON_GRID}×${SKILL_ICON_GRID}`);
			if (!cut) return drop(`chưa có tấm ${s.sheet}.png`);
			const c = cut[index]!;
			if ('error' in c) return drop(c.error);
			if (c.clipped) issues.push({ key: ic.key, sheet: s.sheet, index, reason: 'dính liền icon ô bên cạnh — đã xén theo mép ô', dropped: false });
			seen.add(ic.key);
			icons.push({ key: ic.key, sheet: s.sheet, index, img: c.img });
		});
	}
	return { icons, issues };
}

export type SheetCut = { img: RGBAImage; clipped: boolean } | { error: string };

/**
 * Cắt cả tấm 3×3 (đã tách nền) xét THÀNH PHẦN LIÊN THÔNG của cả tấm thay vì luật "cụm nhỏ sát mép 3px = mẩu lấn sang" của
 * `loadSheetCell` — luật đó xoá nhầm chi tiết thật của icon chiêu (tia lửa trên cùng của Tro Tàn, viên đá quỹ đạo của Trọng
 * Lực, giọt đỏ của Mạch Nguồn, vệt gió của Thuận Gió, mảnh đá của Sơn Thần). Ở đây:
 * - Thành phần nằm trọn trong dải 2px sát mép NGOÀI tấm (vạch 1px PixelLab hay để ở đáy tấm, điểm lẻ ở góc) → bỏ.
 * - Vụn < 24 điểm vắt ngang mép hai ô → bỏ (không rõ của ai, mà giữ thì hộp icon phình hẳn về một phía).
 * - Thành phần ≥ 80% số điểm ở một ô → thuộc ô đó (dù sát mép); phần thò sang ô bên bị bỏ ở CẢ hai ô. Vẫn xén theo mép ô
 *   để icon không quá cỡ ô (64px): Đột Kích giữ cả đuôi vệt thì rộng 66px, ô kỹ năng 30–32px phải thu 1/3 thay vì 1/2.
 * - Còn lại (hai icon dính liền nhau, nền chưa tách) → mỗi ô lấy phần trong mép ô của mình, đánh dấu `clipped`.
 * Ô rỗng / góc ô còn nền → lỗi riêng ô đó (giống `loadSheetCell`).
 */
export function cutIconSheet(sheet: RGBAImage, grid: number): SheetCut[] {
	const { width: w, height: h, data } = sheet;
	const cw = Math.floor(w / grid);
	const ch = Math.floor(h / grid);
	const cellOf = (x: number, y: number): number => Math.min(grid - 1, Math.floor(y / ch)) * grid + Math.min(grid - 1, Math.floor(x / cw));
	const owned: number[][] = Array.from({ length: grid * grid }, () => []);
	const clipped = new Array<boolean>(grid * grid).fill(false);
	const label = new Uint8Array(w * h);
	const EDGE = 2;
	for (let i = 0; i < w * h; i += 1) {
		if (!data[i * 4 + 3] || label[i]) continue;
		const pixels: number[] = [];
		const stack = [i];
		label[i] = 1;
		while (stack.length) {
			const p = stack.pop()!;
			pixels.push(p);
			const x = p % w;
			const y = (p - x) / w;
			for (const q of [x + 1 < w ? p + 1 : -1, x > 0 ? p - 1 : -1, y + 1 < h ? p + w : -1, y > 0 ? p - w : -1]) {
				if (q < 0 || label[q] || !data[q * 4 + 3]) continue;
				label[q] = 1;
				stack.push(q);
			}
		}
		const count = new Array<number>(grid * grid).fill(0);
		let rim = true;
		for (const p of pixels) {
			const x = p % w;
			const y = (p - x) / w;
			count[cellOf(x, y)]! += 1;
			if (x >= EDGE && y >= EDGE && x < w - EDGE && y < h - EDGE) rim = false;
		}
		if (rim) continue;
		const top = count.indexOf(Math.max(...count));
		if (pixels.length < 24 && count[top]! < pixels.length) continue;
		const sole = count[top]! >= pixels.length * 0.8;
		for (const p of pixels) {
			const c = cellOf(p % w, Math.floor(p / w));
			if (sole && c !== top) continue;
			owned[c]!.push(p);
			if (!sole) clipped[c] = true;
		}
	}
	return owned.map((pixels, c) => {
		if (!pixels.length) return { error: `ô ${c} rỗng` };
		const set = new Set(pixels);
		const cx = (c % grid) * cw;
		const cy = Math.floor(c / grid) * ch;
		// Kiểm nền trên ô chưa cắt sát (như `loadSheetCell`): góc ô thuộc icon của chính ô = nền chưa tách.
		if ([cy * w + cx, cy * w + cx + cw - 1, (cy + ch - 1) * w + cx, (cy + ch - 1) * w + cx + cw - 1].some((p) => set.has(p)))
			return { error: `ô ${c} còn nền (góc ô không trong suốt)` };
		let x0 = w;
		let y0 = h;
		let x1 = 0;
		let y1 = 0;
		for (const p of pixels) {
			const x = p % w;
			const y = (p - x) / w;
			x0 = Math.min(x0, x);
			y0 = Math.min(y0, y);
			x1 = Math.max(x1, x);
			y1 = Math.max(y1, y);
		}
		const img = createImage(x1 - x0 + 1, y1 - y0 + 1);
		for (const p of pixels) {
			const x = p % w;
			const y = (p - x) / w;
			img.data.set(data.subarray(p * 4, p * 4 + 4), ((y - y0) * img.width + x - x0) * 4);
		}
		return { img, clipped: clipped[c]! };
	});
}

/** Xếp icon vào lưới đều (bước = icon lớn nhất + khe, làm tròn lên bội 12), theo đúng thứ tự vào. */
export function packSkillIcons(icons: { key: string; img: RGBAImage }[], cols = SKILL_ICON_COLS): { image: RGBAImage; rects: Record<string, IconRect>; pitch: number } {
	if (!icons.length) return { image: createImage(1, 1), rects: {}, pitch: 0 };
	const big = Math.max(...icons.map((i) => Math.max(i.img.width, i.img.height)));
	const pitch = Math.ceil((big + ICON_GAP) / PITCH_STEP) * PITCH_STEP;
	const c = Math.min(cols, icons.length);
	const image = createImage(c * pitch, Math.ceil(icons.length / c) * pitch);
	const rects: Record<string, IconRect> = {};
	icons.forEach((ic, k) => {
		const x = (k % c) * pitch;
		const y = Math.floor(k / c) * pitch;
		blit(image, ic.img, x, y);
		rects[ic.key] = { x, y, w: ic.img.width, h: ic.img.height };
	});
	return { image, rects, pitch };
}

/**
 * Ảnh duyệt: mỗi hàng một tấm (9 ô theo thứ tự bảng khoá), icon bị bỏ để trống đúng chỗ của nó → so thẳng với tấm gốc.
 * Phóng ×2 trên nền tối.
 */
export function skillIconPreview(table: SkillIconTable, icons: CutIcon[]): RGBAImage {
	const byKey = new Map(icons.map((i) => [`${i.sheet}#${i.index}`, i.img]));
	const blank = createImage(1, 1);
	const cells = table.sheets.flatMap((s) => Array.from({ length: SKILL_ICON_GRID * SKILL_ICON_GRID }, (_, i) => byKey.get(`${s.sheet}#${i}`) ?? blank));
	return scaleNearest(sheetPreview(cells.length ? cells : [blank], SKILL_ICON_GRID * SKILL_ICON_GRID), 2);
}

/** Dựng trọn bộ v1 (tấm 3×3): đọc bảng khoá → cắt → xếp atlas → ghi `<outDir>/skill-icons.{png,json}` + ảnh duyệt. */
export function buildSkillIcons(o: { sourceDir: string; outDir: string; previewPath: string }): { count: number; total: number; issues: SkillIconIssue[]; pitch: number; size: { w: number; h: number } } {
	const table = JSON.parse(readFileSync(join(o.sourceDir, 'skill_icons.json'), 'utf8')) as SkillIconTable;
	const { icons, issues } = cutSkillIcons(o.sourceDir, table);
	const total = table.sheets.reduce((n, s) => n + s.icons.length, 0);
	if (!icons.length) return { count: 0, total, issues, pitch: 0, size: { w: 0, h: 0 } };
	const { image, rects, pitch } = packSkillIcons(icons);
	writePng(join(o.outDir, 'skill-icons.png'), image);
	writeFileSync(join(o.outDir, 'skill-icons.json'), `${JSON.stringify(rects, null, '\t')}\n`);
	writePng(o.previewPath, skillIconPreview(table, icons));
	return { count: icons.length, total, issues, pitch, size: { w: image.width, h: image.height } };
}

// ———————————————————————————— v2: một ảnh 32×32 mỗi khoá ————————————————————————————

/** Cạnh ô icon v2 — vẽ ĐÚNG cỡ hiện: 1× ở ô thanh kỹ năng 32, 2× ở ô ≥ 64, ½ ở ô 16–31. */
export const SKILL_ICON_SIZE = 32;
/**
 * Bước lưới atlas v2 = ô 32 + khe 4 = 36: bội 12 như v1 (web thu ½ / ⅓ thì toạ độ gốc chia hết, `background-position` ra số
 * nguyên, mọi icon lấy mẫu cùng pha) và phép lấy mẫu thu nhỏ không với sang icon bên cạnh.
 */
export const SKILL_ICON_PITCH_V2 = 36;
/** Cụm điểm ảnh rời (8 láng giềng) nhỏ cỡ này trở xuống = nhiễu / hạt lấp lánh lạc — bỏ. Chi tiết thật có viền nên ≥ 4 điểm. */
const SPECK_MAX = 2;

/** Bảng khoá v2 (`sources/pixellab/skill-icons-v2/skill_icons_v2.json`) — phần pipeline cần đọc. */
export interface SkillIconTableV2 {
	version: 2;
	style: { width: number; height: number };
	icons: { key: string; name_vi?: string; file: string }[];
}

export interface SkillIconV2Issue {
	key: string;
	file: string;
	reason: string;
	/** true = đã bỏ khỏi atlas (web rơi về icon tạm cũ); false = vẫn xuất, nên soi lại ảnh duyệt. */
	dropped: boolean;
}

/**
 * Dọn nhẹ một icon, KHÔNG vẽ thêm gì: alpha cứng (≥ 128 → đặc, còn lại trong suốt), bỏ cụm rời ≤ `SPECK_MAX` điểm, rồi DỜI
 * cả hình (nguyên điểm ảnh, không co giãn) cho hộp bao vào giữa ô `size` — PixelLab hay lệch tâm 1–3px, mà icon hiện cạnh
 * nhau trên thanh kỹ năng thì lệch là thấy ngay. `box` = cỡ hộp bao sau khi dọn (null = rỗng).
 */
export function tidySkillIcon(src: RGBAImage, size = SKILL_ICON_SIZE): { img: RGBAImage; specks: number; box: { w: number; h: number } | null } {
	const { width: w, height: h } = src;
	const data = new Uint8Array(src.data);
	for (let i = 0; i < w * h; i += 1) data[i * 4 + 3] = data[i * 4 + 3]! >= 128 ? 255 : 0;
	const seen = new Uint8Array(w * h);
	let specks = 0;
	for (let i = 0; i < w * h; i += 1) {
		if (!data[i * 4 + 3] || seen[i]) continue;
		const comp = [i];
		seen[i] = 1;
		for (let k = 0; k < comp.length; k += 1) {
			const x = comp[k]! % w;
			const y = (comp[k]! - x) / w;
			for (let dy = -1; dy <= 1; dy += 1)
				for (let dx = -1; dx <= 1; dx += 1) {
					const xx = x + dx;
					const yy = y + dy;
					if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
					const q = yy * w + xx;
					if (seen[q] || !data[q * 4 + 3]) continue;
					seen[q] = 1;
					comp.push(q);
				}
		}
		if (comp.length > SPECK_MAX) continue;
		specks += comp.length;
		for (const p of comp) data[p * 4 + 3] = 0;
	}
	const img = createImage(size, size);
	const b = opaqueBounds({ width: w, height: h, data });
	if (!b) return { img, specks, box: null };
	const bw = b.x1 - b.x0;
	const bh = b.y1 - b.y0;
	// Hộp bao to hơn ô (ảnh nguồn sai cỡ) thì giữ góc trên trái — `loadSkillIconsV2` đã loại ảnh sai cỡ trước đó.
	const ox = Math.max(0, Math.floor((size - bw) / 2));
	const oy = Math.max(0, Math.floor((size - bh) / 2));
	for (let y = b.y0; y < b.y1; y += 1)
		for (let x = b.x0; x < b.x1; x += 1) {
			const s = (y * w + x) * 4;
			const tx = ox + x - b.x0;
			const ty = oy + y - b.y0;
			if (!data[s + 3] || tx >= size || ty >= size) continue;
			img.data.set(data.subarray(s, s + 4), (ty * size + tx) * 4);
		}
	return { img, specks, box: { w: bw, h: bh } };
}

/**
 * Đọc mọi icon theo bảng khoá v2. Không ném lỗi: thiếu file, sai cỡ, rỗng, khoá trùng → bỏ đúng icon đó + ghi `issues`;
 * hình chạm mép ô (không còn lề) hay vừa bỏ nhiều đốm rời → vẫn xuất nhưng báo để soi ảnh duyệt.
 */
export function loadSkillIconsV2(dir: string, table: SkillIconTableV2): { icons: { key: string; img: RGBAImage }[]; issues: SkillIconV2Issue[] } {
	const size = table.style?.width ?? SKILL_ICON_SIZE;
	const icons: { key: string; img: RGBAImage }[] = [];
	const issues: SkillIconV2Issue[] = [];
	const seen = new Set<string>();
	for (const ic of table.icons) {
		const note = (reason: string, dropped: boolean) => issues.push({ key: ic.key, file: ic.file, reason, dropped });
		if (!ic.key) {
			note('thiếu khoá', true);
			continue;
		}
		if (seen.has(ic.key)) {
			note('khoá trùng với mục trước', true);
			continue;
		}
		const path = join(dir, ic.file);
		if (!existsSync(path)) {
			note('chưa có ảnh', true);
			continue;
		}
		const src = readPng(path);
		if (src.width !== size || src.height !== size) {
			note(`ảnh ${src.width}×${src.height}, cần ${size}×${size}`, true);
			continue;
		}
		const t = tidySkillIcon(src, size);
		if (!t.box) {
			note('ảnh rỗng', true);
			continue;
		}
		if (t.box.w >= size || t.box.h >= size) note(`hình ${t.box.w}×${t.box.h} chạm mép ô — không còn lề`, false);
		if (t.specks > 6) note(`bỏ ${t.specks} điểm ảnh rời`, false);
		seen.add(ic.key);
		icons.push({ key: ic.key, img: t.img });
	}
	return { icons, issues };
}

/** Xếp icon v2 (cùng cỡ ô) vào lưới đều bước `SKILL_ICON_PITCH_V2`, theo đúng thứ tự bảng khoá; hộp = cả ô 32×32. */
export function packSkillIconCells(icons: { key: string; img: RGBAImage }[], cols = SKILL_ICON_COLS): { image: RGBAImage; rects: Record<string, IconRect>; pitch: number } {
	const pitch = SKILL_ICON_PITCH_V2;
	if (!icons.length) return { image: createImage(1, 1), rects: {}, pitch };
	const c = Math.min(cols, icons.length);
	const image = createImage(c * pitch, Math.ceil(icons.length / c) * pitch);
	const rects: Record<string, IconRect> = {};
	icons.forEach((ic, k) => {
		const x = (k % c) * pitch;
		const y = Math.floor(k / c) * pitch;
		blit(image, ic.img, x, y);
		rects[ic.key] = { x, y, w: ic.img.width, h: ic.img.height };
	});
	return { image, rects, pitch };
}

/** Dựng trọn bộ v2: bảng khoá → đọc + dọn từng icon → atlas `<outDir>/skill-icons.{png,json}` + ảnh duyệt (×3, nền ô HUD). */
export function buildSkillIconsV2(o: { sourceDir: string; outDir: string; previewPath: string }): { count: number; total: number; issues: SkillIconV2Issue[]; pitch: number; size: { w: number; h: number } } {
	const table = JSON.parse(readFileSync(join(o.sourceDir, 'skill_icons_v2.json'), 'utf8')) as SkillIconTableV2;
	const { icons, issues } = loadSkillIconsV2(o.sourceDir, table);
	const total = table.icons.length;
	if (!icons.length) return { count: 0, total, issues, pitch: 0, size: { w: 0, h: 0 } };
	const { image, rects, pitch } = packSkillIconCells(icons);
	writePng(join(o.outDir, 'skill-icons.png'), image);
	writeFileSync(join(o.outDir, 'skill-icons.json'), `${JSON.stringify(rects, null, '\t')}\n`);
	// Ảnh duyệt: đúng thứ tự bảng khoá, icon thiếu để ô trống; nền ô kỹ năng (#36333d) để thấy viền tối trên nền thật.
	const byKey = new Map(icons.map((i) => [i.key, i.img]));
	const blank = createImage(SKILL_ICON_SIZE, SKILL_ICON_SIZE);
	const cells = table.icons.map((i) => byKey.get(i.key) ?? blank);
	const sheet = sheetPreview(cells, SKILL_ICON_COLS);
	for (let i = 0; i < sheet.data.length; i += 4) if (sheet.data[i] === 30 && sheet.data[i + 1] === 32 && sheet.data[i + 2] === 44) sheet.data.set([54, 51, 61, 255], i);
	writePng(o.previewPath, scaleNearest(sheet, 3));
	return { count: icons.length, total, issues, pitch, size: { w: image.width, h: image.height } };
}

/**
 * Vũ khí vẽ sẵn theo góc (chuẩn D5: 16 góc, không xoay ảnh pixel bằng code). Mỗi góc là một hình vẽ nét từ bản thiết kế (đo theo
 * trục lưỡi u / bề ngang v quanh điểm nắm), tô vùng theo pixel rồi đi viền tối 1px — không lấy ảnh góc này xoay ra góc kia. Điểm nắm
 * nằm đúng tâm canvas để đặt trùng cổ tay khung thân.
 */
import { createImage, setPixel, type RGBA, type RGBAImage } from '../image/rgba.js';
import type { Point } from './standard.js';

/** Một đoạn dọc trục lưỡi: từ u0 tới u1 (px, tính từ điểm nắm, dương = về phía mũi), nửa bề ngang w0 → w1, bảng màu. */
interface Part {
	u0: number;
	u1: number;
	w0: number;
	w1: number;
	/** [sáng, giữa, tối] — mặt hướng lên trời sáng, giữa, mặt dưới tối. */
	tone: [RGBA, RGBA, RGBA];
}

export interface WeaponDesign {
	id: string;
	canvas: number;
	outline: RGBA;
	parts: Part[];
	/** Khiên tròn (class Khiên): vẽ đĩa thay vũ khí dài — xem `drawShield`. */
	shield?: { radius: number; rim: number; boss: number; plank: number };
	/** Tay nằm SAU vũ khí (nắm quai sau khiên): không tách lớp ngón tay đè lên vũ khí. */
	handsBehind?: boolean;
	/** Tâm vũ khí lệch khỏi điểm nắm theo hướng vũ khí (px): khiên nằm TRƯỚC nắm tay, quai ở mặt sau. */
	offset?: number;
	/** Cung (class Cung): nửa chiều dài thân cung, độ cong ở đầu nhánh, dài mũi tên thép (px) — xem `drawBow`. */
	bow?: { half: number; bend: number; arrowHead: number };
}

/** Thông số riêng từng khung của vũ khí có dây (cung): hướng thân cung, điểm móc dây so với điểm nắm, mũi tên còn lắp. */
export interface WeaponExtra {
	staveDeg?: number;
	nock?: Point;
	arrow?: boolean;
}

const STEEL: [RGBA, RGBA, RGBA] = [[222, 228, 236, 255], [160, 170, 186, 255], [100, 108, 128, 255]];
const IRON: [RGBA, RGBA, RGBA] = [[150, 140, 128, 255], [112, 102, 94, 255], [76, 68, 64, 255]];
const LEATHER: [RGBA, RGBA, RGBA] = [[132, 82, 52, 255], [103, 58, 39, 255], [73, 40, 28, 255]];

/** Kiếm cơ bản tân thủ: lưỡi sắt thẳng ~26px (chủ dự án 29/10: dài hơn bản 20px), chắn tay sắt ngắn, chuôi bọc da nâu (cùng màu găng / áo gi-lê bộ Kiếm sĩ). */
export const BASIC_SWORD: WeaponDesign = {
	id: 'sword-basic',
	canvas: 64,
	outline: [9, 13, 28, 255],
	parts: [
		{ u0: -6.5, u1: -4.5, w0: 1.3, w1: 1.3, tone: IRON },
		{ u0: -4.5, u1: 2.2, w0: 0.85, w1: 0.85, tone: LEATHER },
		{ u0: 2.2, u1: 3.8, w0: 3.6, w1: 3.6, tone: IRON },
		{ u0: 3.8, u1: 26.5, w0: 1.5, w1: 1.3, tone: STEEL },
		{ u0: 26.5, u1: 30, w0: 1.3, w1: 0.05, tone: STEEL },
	],
};

const WOOD: [RGBA, RGBA, RGBA] = [[176, 122, 74, 255], [138, 90, 54, 255], [96, 60, 38, 255]];
const CRYSTAL: [RGBA, RGBA, RGBA] = [[214, 244, 255, 255], [128, 196, 240, 255], [62, 112, 190, 255]];

/**
 * Trượng tân thủ (class Trượng / pháp sư tập sự, chủ dự án 30/10): cán gỗ thẳng ~38px, chuôi đế bịt sắt, đai sắt ôm viên tinh thể xanh
 * nhọn ở đầu. Điểm nắm (tay phải) ở khoảng 1/3 cán tính từ đế — tay trái nắm dọc cán phía trên.
 */
export const BASIC_STAFF: WeaponDesign = {
	id: 'staff-basic',
	canvas: 96,
	outline: [9, 13, 28, 255],
	parts: [
		{ u0: -14, u1: -12.5, w0: 1.2, w1: 1.2, tone: IRON },
		{ u0: -12.5, u1: 24, w0: 0.9, w1: 0.9, tone: WOOD },
		{ u0: 24, u1: 25.6, w0: 1.7, w1: 1.7, tone: IRON },
		{ u0: 25.6, u1: 28.5, w0: 1.5, w1: 2.3, tone: CRYSTAL },
		{ u0: 28.5, u1: 33, w0: 2.3, w1: 0.05, tone: CRYSTAL },
	],
};

/**
 * Khiên tân thủ (class Khiên / hộ vệ tập sự, chủ dự án 30/10 — chiêu cuối "dồn lực sau khiên rồi lao vào đập"): khiên tròn gỗ ghép ván
 * đường kính ~23px (ngực tới hông), viền sắt, núm sắt giữa mặt trước, mặt sau có quai da. Hai tay nắm quai sau khiên.
 */
export const BASIC_SHIELD: WeaponDesign = {
	id: 'shield-basic',
	canvas: 64,
	outline: [9, 13, 28, 255],
	parts: [],
	shield: { radius: 11.5, rim: 2.1, boss: 2.6, plank: 4.2 },
	handsBehind: true,
	offset: 3,
};

/**
 * Cung tân thủ (class Cung / cung thủ tập sự, chủ dự án 30/10): cung gỗ ~50px (chủ dự án: "cung dài xíu nha, trông ngắn nhựa lắm" — bản
 * 31px trơn một màu bị loại; 31/10 "cung dài thêm xíu ngắn quá" — bản 42px còn ngắn), nhánh thon dần, đầu nhánh uốn ngược (recurve) bịt sừng sẫm, vân gỗ, chuôi quấn da có vạch quấn, viền nâu
 * sẫm như gỗ; dây sợi dịu màu; mũi tên gỗ mũi thép, lông đuôi đỏ. Điểm nắm = tay trái nắm chuôi; dây kéo tới nắm tay phải từng khung.
 */
export const BASIC_BOW: WeaponDesign = {
	id: 'bow-basic',
	canvas: 96,
	outline: [34, 22, 18, 255],
	parts: [],
	bow: { half: 25, bend: 5.5, arrowHead: 3 },
};

/**
 * Giáo tân thủ (class Thương / thương thủ tập sự, chủ dự án 30/10): cán gỗ dài ~62px (chủ dự án 31/10: "cung dài thêm xíu ngắn quá, thương
 * cũng thế" — bản ~61px cả mũi bị chê ngắn), đế bịt sắt, khâu sắt và mũi giáo lá thép ~12px. Điểm nắm (tay phải) ở giữa cán — tay trái
 * nắm phía trước dọc cán. Mũi cách điểm nắm 38px: khung đâm E xa nhất điểm nắm cách mép phải ô 160px chỉ 39px (bản mũi 46px bị cắt
 * mép ô ở khung 8–11), nên phần dài thêm dồn ra sau tay.
 */
export const BASIC_SPEAR: WeaponDesign = {
	id: 'spear-basic',
	canvas: 112,
	outline: [9, 13, 28, 255],
	parts: [
		{ u0: -40, u1: -38.5, w0: 1.1, w1: 1.1, tone: IRON },
		{ u0: -38.5, u1: 24, w0: 0.85, w1: 0.85, tone: WOOD },
		{ u0: 24, u1: 26, w0: 1.3, w1: 1.3, tone: IRON },
		{ u0: 26, u1: 30.5, w0: 1.3, w1: 2.6, tone: STEEL },
		{ u0: 30.5, u1: 38, w0: 2.6, w1: 0.05, tone: STEEL },
	],
};

export interface WeaponSprite {
	angleDeg: number;
	image: RGBAImage;
	/** Điểm nắm trong canvas (tâm ô). */
	grip: Point;
}

/**
 * Vẽ một góc: 0° = mũi chĩa sang phải (đông), 90° = lên trời; y ảnh hướng xuống. `length` < 1 = lưỡi chĩa xiên về người xem (hướng S
 * chém chéo, chủ dự án 29/10 "bổ kiếm cứ vòng vòng"): hình chiếu dọc trục ngắn lại — vẽ lại từ bản thiết kế với trục u co theo chiều
 * sâu, bề ngang giữ nguyên; không co ảnh pixel.
 */
export function drawWeapon(design: WeaponDesign, angleDeg: number, length = 1, back = false, extra: WeaponExtra = {}): WeaponSprite {
	if (design.shield) return drawShield(design, angleDeg, length, back);
	if (design.bow) return drawBow(design, angleDeg, length, extra);
	const n = design.canvas;
	const c = n / 2;
	const img = createImage(n, n);
	const a = (angleDeg * Math.PI) / 180;
	const du = [Math.cos(a), -Math.sin(a)];
	// Pháp tuyến v chọn chiều hướng lên trời (y âm) — nguồn sáng chính giữa phía trên theo chuẩn lật.
	let dv = [Math.sin(a), Math.cos(a)];
	if (dv[1]! > 0 || (dv[1] === 0 && dv[0]! < 0)) dv = [-dv[0]!, -dv[1]!];
	const shape = new Uint8Array(n * n);
	for (let y = 0; y < n; y += 1)
		for (let x = 0; x < n; x += 1) {
			const px = x + 0.5 - c;
			const py = y + 0.5 - c;
			const u = (px * du[0]! + py * du[1]!) / length;
			const v = px * dv[0]! + py * dv[1]!;
			const part = design.parts.find((p) => u >= p.u0 && u < p.u1);
			if (!part) continue;
			const w = part.w0 + ((u - part.u0) / (part.u1 - part.u0)) * (part.w1 - part.w0);
			if (Math.abs(v) > w + 0.15) continue;
			const tone = v > w * 0.35 ? part.tone[0] : v < -w * 0.35 ? part.tone[2] : part.tone[1];
			setPixel(img, x, y, tone);
			shape[y * n + x] = 1;
		}
	// Viền tối 1px quanh hình (4 hướng) như viền nhân vật.
	for (let y = 0; y < n; y += 1)
		for (let x = 0; x < n; x += 1) {
			if (shape[y * n + x]) continue;
			const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
				const xx = x + dx!;
				const yy = y + dy!;
				return xx >= 0 && yy >= 0 && xx < n && yy < n && shape[yy * n + xx] === 1;
			});
			if (near) setPixel(img, x, y, design.outline);
		}
	return { angleDeg, image: img, grip: [c, c] };
}

/**
 * Khiên tròn: `angleDeg` = hướng MẶT TRƯỚC khiên chĩa tới (0° = đông / đánh sang phải, 90° = bắc / ra xa người xem); `length` = phần mặt
 * khiên nhìn thấy (1 = nhìn thẳng mặt, nhỏ = gần thấy cạnh) — đĩa co dọc theo hướng mặt; `back` = thấy mặt SAU (ván + quai da, không núm;
 * nhìn sau lưng đánh ra xa). Vẽ từ thiết kế theo từng pixel (vành sắt, ván gỗ có khe, núm sắt nhô về phía mặt), sáng phía trên, viền tối
 * 1px — không co / xoay ảnh pixel. Tâm canvas là điểm nắm; tâm đĩa lệch `offset` px theo hướng mặt (khiên trước nắm tay).
 */
function drawShield(design: WeaponDesign, angleDeg: number, length: number, back: boolean): WeaponSprite {
	const sh = design.shield!;
	const n = design.canvas;
	const c = n / 2;
	const img = createImage(n, n);
	const a = (angleDeg * Math.PI) / 180;
	const du = [Math.cos(a), -Math.sin(a)];
	const dv = [-du[1]!, du[0]!];
	const len = Math.max(0.2, Math.min(1, length));
	const [cx, cy] = [c + du[0]! * (design.offset ?? 0), c + du[1]! * (design.offset ?? 0)];
	const R = sh.radius;
	// Ván chạy dọc trục đứng của khiên: nhìn nghiêng (mặt chĩa ngang) ván là các dải dọc co theo u; nhìn sau (mặt chĩa dọc) dải dọc theo v.
	const sideways = Math.abs(du[0]!) >= Math.abs(du[1]!);
	const shape = new Uint8Array(n * n);
	for (let y = 0; y < n; y += 1)
		for (let x = 0; x < n; x += 1) {
			const px = x + 0.5 - cx;
			const py = y + 0.5 - cy;
			const u = (px * du[0]! + py * du[1]!) / len;
			const v = px * dv[0]! + py * dv[1]!;
			const rr = Math.hypot(u, v);
			// Núm sắt (mặt trước): vòm nhô về phía mặt, thấy cả khi gần nhìn cạnh.
			const bx = px - du[0]! * R * len * 0.55;
			const by = py - du[1]! * R * len * 0.55;
			const boss = !back && Math.hypot(bx, by) <= sh.boss;
			if (rr > R + 0.15 && !boss) continue;
			const light = py < -R * 0.3 ? 0 : py > R * 0.3 ? 2 : 1;
			let tone: RGBA;
			if (boss) tone = Math.hypot(bx + 0.9, by + 0.9) < sh.boss * 0.55 ? STEEL[0] : STEEL[light === 2 ? 2 : 1];
			else if (rr > R - sh.rim) tone = IRON[light];
			else if (back && Math.abs(py) < 1.7) tone = LEATHER[Math.abs(px) < 1 ? 0 : 1];
			else {
				const along = sideways ? u : v;
				const seam = ((along + R) % sh.plank + sh.plank) % sh.plank < 0.8;
				tone = seam ? WOOD[2] : WOOD[light === 0 ? 0 : 1];
				if (!seam && light === 2) tone = WOOD[1];
			}
			setPixel(img, x, y, tone);
			shape[y * n + x] = 1;
		}
	for (let y = 0; y < n; y += 1)
		for (let x = 0; x < n; x += 1) {
			if (shape[y * n + x]) continue;
			const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
				const xx = x + dx!;
				const yy = y + dy!;
				return xx >= 0 && yy >= 0 && xx < n && yy < n && shape[yy * n + xx] === 1;
			});
			if (near) setPixel(img, x, y, design.outline);
		}
	return { angleDeg, image: img, grip: [c, c] };
}

const STRING: RGBA = [188, 180, 158, 255];
const BOW_WOOD: [RGBA, RGBA, RGBA] = [[156, 104, 60, 255], [122, 78, 44, 255], [88, 54, 32, 255]];
const HORN: RGBA = [62, 46, 38, 255];
const FLETCH: RGBA = [178, 52, 46, 255];

/** Vạch 1px thẳng (Bresenham) — dây cung, thân tên; `skip` bỏ qua pixel (dây không vẽ đè thân cung). */
function line(img: RGBAImage, [x0, y0]: Point, [x1, y1]: Point, color: RGBA, skip?: (x: number, y: number) => boolean): void {
	let [x, y] = [Math.round(x0), Math.round(y0)];
	const [xe, ye] = [Math.round(x1), Math.round(y1)];
	const [dx, dy] = [Math.abs(xe - x), -Math.abs(ye - y)];
	const [sx, sy] = [x < xe ? 1 : -1, y < ye ? 1 : -1];
	let err = dx + dy;
	for (;;) {
		if (x >= 0 && y >= 0 && x < img.width && y < img.height && !skip?.(x, y)) setPixel(img, x, y, color);
		if (x === xe && y === ye) break;
		const e2 = 2 * err;
		if (e2 >= dy) (err += dy), (x += sx);
		if (e2 <= dx) (err += dx), (y += sy);
	}
}

/**
 * Cung: `angleDeg` = hướng bắn trên ảnh (0° = đông, 90° = bắc / ra xa người xem); `length` = độ thấy cong của thân cung (1 = nhìn
 * nghiêng thấy đủ cong, nhỏ = nhìn sau lưng cung gần như thẳng đứng); `extra.staveDeg` hướng nhánh trên (mặc định vuông góc hướng
 * bắn), `extra.nock` điểm móc dây (tay kéo) so với điểm nắm, `extra.arrow` mũi tên lắp. Thân cung vẽ theo đường cong từng pixel
 * (gỗ, chuôi quấn da, viền tối 1px); dây 1px từ hai đầu nhánh tới điểm móc (không có thì thẳng); tên từ điểm móc qua chuôi cung,
 * mũi thép, lông đuôi đỏ. Tâm canvas là điểm nắm (tay trái).
 */
function drawBow(design: WeaponDesign, angleDeg: number, length: number, extra: WeaponExtra): WeaponSprite {
	const bw = design.bow!;
	const n = design.canvas;
	const c = n / 2;
	const img = createImage(n, n);
	const a = (angleDeg * Math.PI) / 180;
	const du = [Math.cos(a), -Math.sin(a)];
	const sa = ((extra.staveDeg ?? angleDeg + 90) * Math.PI) / 180;
	const sv = [Math.cos(sa), -Math.sin(sa)];
	const len = Math.max(0.15, Math.min(1, length));
	// Đường giữa thân cung: nhánh cong về phía người bắn (ngược hướng bắn), 18% cuối uốn ngược ra trước (recurve).
	const curve = (u: number): number => (u <= 0.82 ? u * u : 0.6724 + 1.64 * (u - 0.82) - 9 * (u - 0.82) ** 2);
	const at = (t: number): Point => {
		const k = bw.bend * len * curve(Math.abs(t));
		return [c + sv[0]! * bw.half * t - du[0]! * k, c + sv[1]! * bw.half * t - du[1]! * k];
	};
	const pts = Array.from({ length: 81 }, (_, i) => at(-1 + i / 40));
	const shape = new Uint8Array(n * n);
	for (let y = 0; y < n; y += 1)
		for (let x = 0; x < n; x += 1) {
			const [px, py] = [x + 0.5, y + 0.5];
			let best = Infinity;
			let bt = 0;
			for (let i = 0; i < pts.length; i += 1) {
				const d = Math.hypot(px - pts[i]![0], py - pts[i]![1]);
				if (d < best) (best = d), (bt = -1 + i / 40);
			}
			const u = Math.abs(bt);
			// Nhánh thon dần: chuôi dày, đầu nhánh mảnh.
			const w = u < 0.12 ? 1.5 : 1.3 - 0.6 * u;
			if (best > w) continue;
			const [cx, cy] = at(bt);
			const front = (px - cx) * du[0]! + (py - cy) * du[1]! > 0;
			const along = Math.round(u * bw.half);
			let tone: RGBA;
			if (u < 0.12) tone = along % 2 ? LEATHER[0] : LEATHER[2];
			else if (u > 0.9) tone = HORN;
			else if (along % 4 === 0) tone = BOW_WOOD[2];
			else tone = front ? BOW_WOOD[0] : BOW_WOOD[1];
			setPixel(img, x, y, tone);
			shape[y * n + x] = 1;
		}
	for (let y = 0; y < n; y += 1)
		for (let x = 0; x < n; x += 1) {
			if (shape[y * n + x]) continue;
			const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
				const xx = x + dx!;
				const yy = y + dy!;
				return xx >= 0 && yy >= 0 && xx < n && yy < n && shape[yy * n + xx] === 1;
			});
			if (near) setPixel(img, x, y, design.outline);
		}
	const top = at(-1);
	const bottom = at(1);
	const onBow = (x: number, y: number): boolean => shape[y * n + x] === 1;
	const nock: Point | null = extra.nock ? [c + extra.nock[0], c + extra.nock[1]] : null;
	if (nock) {
		line(img, top, nock, STRING, onBow);
		line(img, bottom, nock, STRING, onBow);
	} else line(img, top, bottom, STRING, onBow);
	if (nock && extra.arrow) {
		const d0 = Math.hypot(c - nock[0], c - nock[1]);
		const dir = d0 > 1 ? [(c - nock[0]) / d0, (c - nock[1]) / d0] : du;
		const tip: Point = [c + dir[0]! * 6, c + dir[1]! * 6];
		line(img, [nock[0] + dir[0]! * 2, nock[1] + dir[1]! * 2], tip, WOOD[0]);
		line(img, nock, [nock[0] + dir[0]! * 2, nock[1] + dir[1]! * 2], FLETCH);
		const back: Point = [tip[0] - dir[0]! * bw.arrowHead, tip[1] - dir[1]! * bw.arrowHead];
		line(img, back, tip, STEEL[1]);
		setPixel(img, Math.round(tip[0]), Math.round(tip[1]), STEEL[0]);
		for (const s of [1, -1]) setPixel(img, Math.round(back[0] - dir[1]! * s), Math.round(back[1] + dir[0]! * s), STEEL[2]);
	}
	return { angleDeg, image: img, grip: [c, c] };
}

/** 16 góc chuẩn (bước 22,5°), góc âm viết dạng −22,5 … −157,5. */
export const WEAPON_ANGLES = Array.from({ length: 16 }, (_, i) => (i <= 8 ? i * 22.5 : (i - 16) * 22.5));

/** Góc vẽ sẵn gần góc lưỡi của khung nhất (chuẩn weapon.pickRule). */
export function nearestAngle(deg: number): number {
	const norm = (d: number): number => ((((d + 180) % 360) + 360) % 360) - 180;
	return WEAPON_ANGLES.reduce((best, a) => (Math.abs(norm(a - deg)) < Math.abs(norm(best - deg)) ? a : best), WEAPON_ANGLES[0]!);
}

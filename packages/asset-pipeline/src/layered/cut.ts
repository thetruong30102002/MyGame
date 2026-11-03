/**
 * Cắt / tách / ghép lớp nhân vật (chuẩn: docs/thiet-ke/chuan-nhan-vat-ghep-lop.md). Mọi phép đều NHỊ PHÂN theo pixel: giữ nguyên hoặc
 * bỏ hẳn, chỉ dịch nguyên pixel — không scale, không pha màu, nên không thể nhoè. Toạ độ ảnh: gốc trái-trên, y xuống.
 */
import { cloneImage, createImage, type RGBAImage } from '../image/rgba.js';
import type { LayeredStandard, Point } from './standard.js';

const opaque = (img: RGBAImage, x: number, y: number): boolean =>
	x >= 0 && y >= 0 && x < img.width && y < img.height && img.data[(y * img.width + x) * 4 + 3]! > 0;

/** Làm tròn alpha về 0 / 255 (PixelLab đôi khi xuất viền bán trong suốt). Trả số pixel đã đổi. */
export function binarizeAlpha(img: RGBAImage, threshold = 128): number {
	let changed = 0;
	for (let i = 3; i < img.data.length; i += 4) {
		const a = img.data[i]!;
		if (a === 0 || a === 255) continue;
		img.data[i] = a >= threshold ? 255 : 0;
		if (img.data[i] === 0) img.data.fill(0, i - 3, i);
		changed += 1;
	}
	return changed;
}

/** Kênh sáng nhất dưới ngưỡng này = viền đen (chuẩn generation.outline "single color black outline") hoặc tóc tối sát viền. */
export const OUTLINE_MAX_CHANNEL = 70;

/** Pixel "ruột" (đặc, không phải viền đen): da, bóng da, vải, tóc sáng… — cổ là ruột kẹp giữa hai viền. */
const interior = (img: RGBAImage, x: number, y: number): boolean => {
	if (!opaque(img, x, y)) return false;
	const i = (y * img.width + x) * 4;
	return Math.max(img.data[i]!, img.data[i + 1]!, img.data[i + 2]!) >= OUTLINE_MAX_CHANNEL;
};

function runWhere(img: RGBAImage, y: number, cx: number, reach: number, ok: (x: number, y: number) => boolean): [number, number] | null {
	let x = -1;
	for (let d = 0; d <= reach && x < 0; d += 1) {
		if (ok(cx - d, y)) x = cx - d;
		else if (ok(cx + d, y)) x = cx + d;
	}
	if (x < 0) return null;
	let x0 = x;
	let x1 = x;
	while (ok(x0 - 1, y)) x0 -= 1;
	while (ok(x1 + 1, y)) x1 += 1;
	return [x0, x1];
}

/** Đoạn pixel đặc liền nhau trên hàng y chứa cột cx (cx trong suốt thì lấy pixel đặc gần nhất trong ±reach). */
export const runAt = (img: RGBAImage, y: number, cx: number, reach = 2): [number, number] | null => runWhere(img, y, cx, reach, (x, yy) => opaque(img, x, yy));

/** Đoạn ruột (bỏ viền đen) liền nhau trên hàng y chứa cột cx. */
export const interiorRunAt = (img: RGBAImage, y: number, cx: number, reach = 3): [number, number] | null => runWhere(img, y, cx, reach, (x, yy) => interior(img, x, yy));

export interface NeckMeasure {
	/** Neo cổ: hàng cổ đầu tiên dưới cằm, cột giữa cổ. */
	neck: Point;
	chinY: number;
	/** Hàng đầu tiên thân rộng ra (vai). */
	shoulderY: number;
	/** Số hàng từ dưới cằm tới vai (chuẩn body.neckLengthPx). */
	neckLength: number;
	/** Bề ngang cổ: thân trọc tính cả viền; đo trên ảnh có tóc (spans) chỉ tính ruột giữa hai viền. */
	neckWidth: number;
	headTopY: number;
	headWidth: number;
	/** Rộng nhất của mặt 2–4 hàng trên cằm (đầu trọc nên không lẫn tóc) — xấp xỉ khối má để so chuẩn head.cheekWidthPx. */
	cheekWidth: number;
	/** Cột dò đường giữa. */
	cx: number;
	/**
	 * Chỉ có khi đo trên ảnh có tóc (hint.nearY): dải cổ [x0, x1] (ruột ±1 viền) từng hàng từ neo tới trước vai. Pixel ngoài dải, nối với
	 * đầu, không phải ruột da cổ = tóc rủ sát cổ → lớp hairBack (chuẩn head.longHair), không để lại trên thân.
	 */
	spans?: Array<[number, number]>;
}

/**
 * Đo cổ. Mặc định cho thân đầu trọc, tay không che cổ: đi từ đỉnh đầu xuống theo cột giữa; qua chỗ đầu rộng nhất, bề ngang hẹp dần tới
 * dải hẹp nhất (cổ) rồi rộng ra ≥ +3px (vai). Ảnh có tóc thì truyền `nearY` (hàng cổ của thân trọc cùng hướng, toạ độ ô) → measureNeckNear.
 * Không tìm được dạng đó thì ném lỗi — KHÔNG đoán.
 */
export function measureNeck(img: RGBAImage, hint?: { cx?: number; maxHeadRows?: number; nearY?: number }): NeckMeasure {
	if (hint?.nearY !== undefined) return measureNeckNear(img, hint.nearY, hint.cx);
	let top = -1;
	let cx = hint?.cx ?? -1;
	if (cx >= 0) {
		// Biết cột giữa (từ khung xương): đỉnh đầu dò theo đúng cột đó — tay / kiếm giơ cao hơn đầu không bị nhận nhầm là đỉnh đầu.
		for (let y = 0; y < img.height && top < 0; y += 1) if (runAt(img, y, cx, 1)) top = y;
		if (top < 0) throw new Error(`Cột ${cx} không có pixel nào`);
	} else for (let y = 0; y < img.height && top < 0; y += 1) for (let x = 0; x < img.width; x += 1) if (opaque(img, x, y)) { top = y; break; }
	if (top < 0) throw new Error('Ảnh rỗng');
	if (cx < 0) {
		const xs: number[] = [];
		for (let y = top; y < top + 3; y += 1) for (let x = 0; x < img.width; x += 1) if (opaque(img, x, y)) xs.push(x);
		cx = Math.round(xs.reduce((n, v) => n + v, 0) / xs.length);
	}
	const limit = Math.min(img.height, top + (hint?.maxHeadRows ?? 48));
	const width = (y: number): number => {
		const r = runAt(img, y, cx);
		return r ? r[1] - r[0] + 1 : 0;
	};
	let maxW = 0;
	let narrowing = false;
	let minW = Infinity;
	let neckY = -1;
	let shoulderY = -1;
	for (let y = top; y < limit; y += 1) {
		const w = width(y);
		if (w === 0) throw new Error(`Đường giữa đứt ở hàng ${y} (cột ${cx}) — đầu và thân không liền`);
		if (!narrowing) {
			if (w >= maxW) maxW = w;
			else if (w <= maxW - 2) narrowing = true;
			if (!narrowing) continue;
		}
		if (w < minW) {
			minW = w;
			neckY = y;
		} else if (w >= minW + 3) {
			shoulderY = y;
			break;
		}
	}
	if (neckY < 0 || shoulderY < 0) throw new Error('Không thấy dạng đầu → cổ → vai trên đường giữa (tay che cổ hoặc không phải đầu trọc?)');
	const run = runAt(img, neckY, cx)!;
	let cheek = 0;
	for (let y = Math.max(top, neckY - 5); y <= neckY - 3; y += 1) cheek = Math.max(cheek, width(y));
	return {
		neck: [Math.floor((run[0] + run[1]) / 2), neckY],
		chinY: neckY - 1,
		shoulderY,
		neckLength: shoulderY - neckY,
		neckWidth: run[1] - run[0] + 1,
		headTopY: top,
		headWidth: maxW,
		cheekWidth: cheek,
		cx,
	};
}

/**
 * Đo cổ trên ảnh CÓ TÓC (nguồn tách đầu: thân gốc + tóc, khung xoay / khung động tác). Tóc bồng rộng hơn mặt, lọn tách rời trên đỉnh hay
 * tóc gáy rủ sát hai bên cổ đều làm sai phép đo từ đỉnh xuống, nên đi TỪ VAI LÊN: bắt đầu ở hàng rộng nhất trong 1–6 hàng dưới `nearY` (vai; `nearY` = hàng cổ của thân
 * trọc cùng hướng — mọi nhân vật chung một thân), chỉ đếm RUỘT giữa hai viền đen (viền cổ ngăn cổ với tóc, tóc màu gì cũng vậy; màu bóng da
 * mới của khung động tác vẫn là ruột). Đi lên khi ruột còn hẹp dần / giữ bề ngang (vai thon vào cổ); dừng khi rộng ra > +1px (cằm), hoặc
 * ruột hẹp dưới NECK_MIN_INTERIOR (khe sáng trong tóc gáy, không phải cổ). Neo = hàng cuối còn đi được (ngay dưới cằm / chân tóc);
 * vai = hàng đầu tiên dưới neo rộng ra ≥ +2px.
 */
/** Ruột cổ hẹp hơn mức này (px) là khe sáng trong tóc / viền, không phải cổ. */
export const NECK_MIN_INTERIOR = 3;

function measureNeckNear(img: RGBAImage, nearY: number, cxHint?: number): NeckMeasure {
	const y0 = Math.max(0, nearY - 6);
	const y1 = Math.min(img.height - 1, nearY + 6);
	let cx = cxHint ?? -1;
	if (cx < 0) {
		const xs: number[] = [];
		for (let y = y0; y <= y1; y += 1) for (let x = 0; x < img.width; x += 1) if (interior(img, x, y)) xs.push(x);
		if (!xs.length) throw new Error(`Không có pixel nào quanh hàng cổ ${nearY}`);
		cx = Math.round(xs.reduce((n, v) => n + v, 0) / xs.length);
	}
	const width = (y: number): number => {
		const r = interiorRunAt(img, y, cx);
		return r ? r[1] - r[0] + 1 : 0;
	};
	// Bắt đầu ở hàng RỘNG NHẤT 1–6 hàng dưới gợi ý (đường vai): hàng cố định có thể trúng cánh tay vung ngang ngực khi chạy (dẫm 28/10).
	let start = y1;
	for (let y = y1; y > nearY; y -= 1) if (width(y) > width(start)) start = y;
	let minW = width(start);
	if (minW < NECK_MIN_INTERIOR) throw new Error(`Cột ${cx} quanh hàng ${nearY} không có ruột — tay / tóc che kín cổ?`);
	let top = start;
	for (let y = start - 1; y >= Math.max(0, nearY - 12); y -= 1) {
		const w = width(y);
		if (w < NECK_MIN_INTERIOR || w > minW + 1) break;
		minW = Math.min(minW, w);
		top = y;
	}
	let shoulderY = top + 1;
	while (shoulderY <= start && width(shoulderY) < minW + 2) shoulderY += 1;
	if (shoulderY > start) throw new Error(`Dưới neo (hàng ${top}) không thấy vai rộng ra — không phải cổ`);
	return finishNeck(img, cx, top, shoulderY, minW);
}

/** Đỉnh đầu dò từ cằm (hàng trên neo) đi lên theo cột nx tới khi hết pixel — khe giữa lọn tóc phía trên không sao, vùng đầu loang từ đây. */
export function headTopAt(img: RGBAImage, nx: number, neckY: number): number {
	let y = neckY - 1;
	if (!runAt(img, y, nx)) throw new Error(`Không có cằm trên neo cổ (${nx},${neckY})`);
	while (y > 0 && runAt(img, y - 1, nx)) y -= 1;
	return y;
}

/** Phần chung sau khi có dải cổ [top, shoulderY): dải từng hàng, neo giữa cổ, đỉnh đầu, bề ngang đầu / má. */
function finishNeck(img: RGBAImage, cx: number, top: number, shoulderY: number, minW: number): NeckMeasure {
	const spans: Array<[number, number]> = [];
	for (let y = top; y < shoulderY; y += 1) {
		const r = interiorRunAt(img, y, cx)!;
		spans.push([r[0] - 1, r[1] + 1]);
	}
	const nx = Math.floor((spans[0]![0] + spans[0]![1]) / 2);
	const headTopY = headTopAt(img, nx, top);
	let headWidth = 0;
	for (let y = headTopY; y < top; y += 1) {
		const r = runAt(img, y, nx);
		if (r) headWidth = Math.max(headWidth, r[1] - r[0] + 1);
	}
	let cheek = 0;
	for (let y = Math.max(headTopY, top - 5); y <= top - 3; y += 1) {
		const r = interiorRunAt(img, y, nx);
		if (r) cheek = Math.max(cheek, r[1] - r[0] + 1);
	}
	return { neck: [nx, top], chinY: top - 1, shoulderY, neckLength: shoulderY - top, neckWidth: minW, headTopY, headWidth, cheekWidth: cheek, cx: nx, spans };
}

/** Hai màu gần nhau (tổng lệch 3 kênh ≤ tol) — bản vẽ lại của cùng một đầu lệch màu nhẹ. */
const near = (d: Uint8Array | Uint8ClampedArray, i: number, e: Uint8Array | Uint8ClampedArray, j: number, tol: number): boolean =>
	Math.abs(d[i]! - e[j]!) + Math.abs(d[i + 1]! - e[j + 1]!) + Math.abs(d[i + 2]! - e[j + 2]!) <= tol;

export interface HeadAlign {
	dx: number;
	dy: number;
	/** Tỉ lệ pixel lớp đầu trùng màu (gần) với ảnh tại độ dịch tốt nhất. */
	match: number;
}

/**
 * Khớp đầu cho ảnh MẶC ĐỒ (chuẩn body.necklineRule: cắt theo đường cổ của thân gốc cùng khung, không đo lại trên ảnh có áo). Nhân vật mặc đồ
 * vẽ lại cùng đầu gần y hệt nhưng là bản vẽ khác nên lệch vài px; cổ áo có viền / nẹp tối nên đo bề ngang cổ trên ảnh có áo sai (thử thật
 * 28/10: hướng E / NE / N). Ở đây dò độ dịch (dx, dy) trong ±search để lớp đầu thân trần (canvas chuẩn, neo ở `neck`, bỏ cổ da dưới neo)
 * trùng ảnh nhiều pixel nhất; neo cổ bản mặc đồ = neo thân trần + độ dịch. Hoà điểm thì lấy độ dịch nhỏ nhất.
 */
export function alignHead(img: RGBAImage, head: RGBAImage, neck: Point, std: Pick<LayeredStandard, 'head'>, search = 4, tol = 48): HeadAlign {
	const [ax, ay] = std.head.neckAnchor;
	const ox = neck[0] - ax;
	const oy = neck[1] - ay;
	const px: Array<[number, number]> = [];
	for (let y = 0; y < ay; y += 1) for (let x = 0; x < head.width; x += 1) if (head.data[(y * head.width + x) * 4 + 3]) px.push([x, y]);
	if (!px.length) throw new Error('Lớp đầu rỗng');
	let best: HeadAlign = { dx: 0, dy: 0, match: -1 };
	for (let dy = -search; dy <= search; dy += 1)
		for (let dx = -search; dx <= search; dx += 1) {
			let hit = 0;
			for (const [x, y] of px) {
				const tx = x + ox + dx;
				const ty = y + oy + dy;
				if (!opaque(img, tx, ty)) continue;
				if (near(head.data, (y * head.width + x) * 4, img.data, (ty * img.width + tx) * 4, tol)) hit += 1;
			}
			const match = hit / px.length;
			const better = match > best.match || (match === best.match && Math.abs(dx) + Math.abs(dy) < Math.abs(best.dx) + Math.abs(best.dy));
			if (better) best = { dx, dy, match };
		}
	return best;
}

/** Số pixel đặc của `img` không gần màu nào của các lớp `allowed` (tổng lệch 3 kênh > tol) — vd cổ áo bị cắt theo đầu (Q8). */
export function unlikePixels(img: RGBAImage, allowed: Array<RGBAImage | null>, tol = 48): number {
	const colors: number[] = [];
	const seen = new Set<number>();
	for (const layer of allowed)
		if (layer)
			for (let i = 0; i < layer.data.length; i += 4) {
				if (!layer.data[i + 3]) continue;
				const c = (layer.data[i]! << 16) | (layer.data[i + 1]! << 8) | layer.data[i + 2]!;
				if (!seen.has(c)) seen.add(c), colors.push(c);
			}
	let n = 0;
	for (let i = 0; i < img.data.length; i += 4) {
		if (!img.data[i + 3]) continue;
		const [r, g, b] = [img.data[i]!, img.data[i + 1]!, img.data[i + 2]!];
		if (!colors.some((c) => Math.abs(((c >> 16) & 255) - r) + Math.abs(((c >> 8) & 255) - g) + Math.abs((c & 255) - b) <= tol)) n += 1;
	}
	return n;
}

/**
 * Vùng bảo vệ dựng từ khớp đầu (thay khung xương khi chưa có). Pixel TRÊN neo cổ được bảo vệ (giữ ở thân) khi:
 * - nằm ngoài bóng đầu mẫu (lớp đầu canvas chuẩn đặt ở `neck`, nới `grow` px cho tóc nảy), hoặc
 * - (nếu truyền `img`) nằm trong bóng nhưng thuộc mảng LẤN TỪ NGOÀI VÀO: loang từ pixel ngoài bóng sát mép bóng, qua các pixel không giống màu
 *   đầu mẫu trong ±grow — tay da lấn vào chỗ đầu mẫu là tóc đen. Chấm lệch màu lẻ của đầu vẽ lại không nối với tay nên vẫn là đầu (xét
 *   từng pixel thì để sót đầu trên thân — dẫm 28/10).
 * Khi có `img`, chỉ giữ phần nối liền với thân dưới đường cổ. Giới hạn: tay da sát má da (cùng màu) không tách được — cần khung xương.
 */
export function headMaskProtect(head: RGBAImage, neck: Point, std: Pick<LayeredStandard, 'head'>, grow = 2, img?: RGBAImage, tol = 48, strict = false): (x: number, y: number) => boolean {
	const [ax, ay] = std.head.neckAnchor;
	const ox = neck[0] - ax;
	const oy = neck[1] - ay;
	const solid = (hx: number, hy: number): boolean => hx >= 0 && hy >= 0 && hx < head.width && hy < ay && head.data[(hy * head.width + hx) * 4 + 3]! > 0;
	const inMask = (x: number, y: number): boolean => {
		for (let dy = -grow; dy <= grow; dy += 1) for (let dx = -grow; dx <= grow; dx += 1) if (solid(x - ox + dx, y - oy + dy)) return true;
		return false;
	};
	const outside = (x: number, y: number): boolean => y < neck[1] && !inMask(x, y);
	if (!img) return outside;
	const like = (x: number, y: number): boolean => {
		for (let dy = -grow; dy <= grow; dy += 1)
			for (let dx = -grow; dx <= grow; dx += 1) {
				const hx = x - ox + dx;
				const hy = y - oy + dy;
				if (solid(hx, hy) && near(head.data, (hy * head.width + hx) * 4, img.data, (y * img.width + x) * 4, tol)) return true;
			}
		return false;
	};
	// Chặt (bộ đồ, khuôn là đầu ảnh xoay của CHÍNH bộ đồ — cùng bảng màu). Đầu chỉ để ghép, không mang phần thừa (chủ dự án 29/10):
	// pixel ngoài bóng đầu hoặc khác màu đầu ở chỗ đó là ứng viên thân; cụm ứng viên KHÁC MÀU từ STRICT_CHUNK_MIN pixel (mảnh tay áo sau gáy
	// bị tóc che đứt khỏi thân) và mọi ứng viên dưới đường cổ khuôn là mầm; loang qua ứng viên nối với mầm (viền tay ngoài bóng) → thân.
	// Chấm lệch màu lẻ trong đầu (bóng tóc / mặt vẽ lại) không nối mầm → vẫn là đầu, không sót trên thân. Không chặn theo hàng neo khuôn:
	// hàng cắt (neo thân trần) có thể thấp hơn 1–2 hàng.
	if (strict) {
		// Dải cổ da (bareNeckMaxPx hàng dưới neo) giống màu cổ khuôn thuộc đầu — không làm mầm / đường loang cho thân.
		const stripEnd = neck[1] + std.head.bareNeckMaxPx;
		const likeNeck = (x: number, y: number): boolean => {
			for (let dy = -grow; dy <= grow; dy += 1)
				for (let dx = -grow; dx <= grow; dx += 1) {
					const hx = x - ox + dx;
					const hy = y - oy + dy;
					if (hx >= 0 && hy >= 0 && hx < head.width && hy < head.height && head.data[(hy * head.width + hx) * 4 + 3]! > 0 && near(head.data, (hy * head.width + hx) * 4, img.data, (y * img.width + x) * 4, tol)) return true;
				}
			return false;
		};
		const unlike = (x: number, y: number): boolean => inMask(x, y) && !like(x, y);
		const cand = (x: number, y: number): boolean => {
			if (x < 0 || y < 0 || x >= img.width || y >= img.height || !opaque(img, x, y)) return false;
			if (y >= stripEnd) return true;
			if (y >= neck[1]) return !likeNeck(x, y);
			return !inMask(x, y) || !like(x, y);
		};
		const yEnd = Math.min(img.height, stripEnd + 2);
		const body = new Set<number>();
		const flood = (seeds: Point[], ok: (x: number, y: number) => boolean, into: Set<number>): void => {
			while (seeds.length) {
				const [x, y] = seeds.pop()!;
				const k = y * img.width + x;
				if (y >= yEnd || into.has(k) || !ok(x, y)) continue;
				into.add(k);
				seeds.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
			}
		};
		const seen = new Set<number>();
		const seeds: Point[] = [];
		for (let y = 0; y < yEnd; y += 1)
			for (let x = 0; x < img.width; x += 1) {
				if (!cand(x, y)) continue;
				if (y >= neck[1]) seeds.push([x, y]);
				else if (unlike(x, y) && !seen.has(y * img.width + x)) {
					const chunk = new Set<number>();
					flood([[x, y]], (px, py) => cand(px, py) && unlike(px, py), chunk);
					for (const k of chunk) seen.add(k);
					if (chunk.size >= STRICT_CHUNK_MIN) for (const k of chunk) seeds.push([k % img.width, Math.floor(k / img.width)]);
				}
			}
		flood(seeds, cand, body);
		return (x, y) => body.has(y * img.width + x);
	}
	const arm = new Set<number>();
	const stack: Point[] = [];
	const x0 = Math.max(0, ox - grow - 1);
	const x1 = Math.min(img.width - 1, ox + head.width + grow);
	const y0 = Math.max(0, oy - grow - 1);
	for (let y = y0; y < neck[1]; y += 1)
		for (let x = x0; x <= x1; x += 1)
			if (opaque(img, x, y) && outside(x, y)) for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]] as const) stack.push([nx, ny]);
	while (stack.length) {
		const [x, y] = stack.pop()!;
		const k = y * img.width + x;
		if (y >= neck[1] || arm.has(k) || !opaque(img, x, y) || outside(x, y) || like(x, y)) continue;
		arm.add(k);
		stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
	}
	// Chỉ bảo vệ phần NỐI VỚI THÂN dưới đường cổ (tay mọc từ vai, vũ khí trong tay); lọn tóc nảy ra ngoài bóng chỉ nối với đầu → vẫn là đầu.
	const cand = (x: number, y: number): boolean => y < neck[1] && opaque(img, x, y) && (outside(x, y) || arm.has(y * img.width + x));
	const kept = new Set<number>();
	const seeds: Point[] = [];
	for (let x = 0; x < img.width; x += 1) if (cand(x, neck[1] - 1) && opaque(img, x, neck[1])) seeds.push([x, neck[1] - 1]);
	while (seeds.length) {
		const [x, y] = seeds.pop()!;
		const k = y * img.width + x;
		if (x < 0 || y < 0 || x >= img.width || kept.has(k) || !cand(x, y)) continue;
		kept.add(k);
		seeds.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
	}
	return (x, y) => y < neck[1] && kept.has(y * img.width + x);
}

/** Cụm khác màu đầu từ chừng này pixel là áo / tay (thân), nhỏ hơn là chấm bóng của đầu vẽ lại. */
export const STRICT_CHUNK_MIN = 4;

/** Số đo cắt đầu dời theo độ dịch khớp đầu (neo, cột dò, đỉnh đầu, dải cổ). */
export const shiftCut = (m: HeadCut, dx: number, dy: number): HeadCut => ({
	neck: [m.neck[0] + dx, m.neck[1] + dy],
	headTopY: m.headTopY + dy,
	cx: m.cx + dx,
	spans: m.spans?.map(([a, b]) => [a + dx, b + dx] as [number, number]),
});

/** Số đo cần để cắt / tách đầu (spans có khi đo trên ảnh có tóc). */
export type HeadCut = Pick<NeckMeasure, 'neck' | 'headTopY' | 'cx'> & Partial<Pick<NeckMeasure, 'spans'>>;

const HEAD = 1;
const HAIR_BACK = 2;

/**
 * Vùng đầu (HEAD) và tóc sau (HAIR_BACK). Đầu: các pixel đặc nối (4 hướng) với đỉnh đầu, nằm TRÊN hàng cổ, trừ vùng bảo vệ (tay / vũ khí
 * theo khung xương). Đo trên ảnh có tóc (m.spans) thì thêm: lọn tóc tách rời trên đường cổ, trong bề ngang đầu ±2 (cả cụm không chạm hàng
 * cổ) → đầu; pixel từ neo tới trước vai nằm ngoài dải cổ, nối với đầu → tóc sau.
 */
function headRegion(img: RGBAImage, m: HeadCut, protect?: (x: number, y: number) => boolean): Uint8Array {
	const { width: w, height: h } = img;
	const neckY = m.neck[1];
	const mark = new Uint8Array(w * h);
	const fill = (seeds: Point[], ok: (x: number, y: number) => boolean, value: number): void => {
		const stack = [...seeds];
		while (stack.length) {
			const [x, y] = stack.pop()!;
			const i = y * w + x;
			if (!opaque(img, x, y) || mark[i] || protect?.(x, y) || !ok(x, y)) continue;
			mark[i] = value;
			stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
		}
	};
	// Loang từ cả hàng đỉnh đầu và hàng cằm: một pixel lẻ bị vùng bảo vệ loại (màu tóc vẽ lại lệch) không được làm rỗng cả đầu.
	const seeds0: Point[] = [];
	for (const [y, x] of [[m.headTopY, m.cx], [neckY - 1, m.neck[0]]] as const) {
		const r = runAt(img, y, x);
		if (r) for (let k = r[0]; k <= r[1]; k += 1) seeds0.push([k, y]);
	}
	if (!seeds0.length) throw new Error('Không có pixel đỉnh đầu / cằm để bắt đầu tách');
	fill(seeds0, (_, y) => y < neckY, HEAD);
	const spans = m.spans;
	if (!spans) return mark;

	let x0 = w;
	let x1 = -1;
	for (let i = 0; i < mark.length; i += 1) if (mark[i]) [x0, x1] = [Math.min(x0, i % w), Math.max(x1, i % w)];
	const seen = new Uint8Array(w * h);
	for (let y = 0; y < neckY; y += 1)
		for (let x = Math.max(0, x0 - 2); x <= Math.min(w - 1, x1 + 2); x += 1) {
			if (seen[y * w + x] || mark[y * w + x] || !opaque(img, x, y) || protect?.(x, y)) continue;
			const comp: Point[] = [];
			const stack: Point[] = [[x, y]];
			while (stack.length) {
				const [px, py] = stack.pop()!;
				const i = py * w + px;
				if (seen[i] || mark[i] || !opaque(img, px, py) || protect?.(px, py)) continue;
				seen[i] = 1;
				comp.push([px, py]);
				stack.push([px + 1, py], [px - 1, py], [px, py + 1], [px, py - 1]);
			}
			if (comp.every(([, py]) => py < neckY)) for (const [px, py] of comp) mark[py * w + px] = HEAD;
		}

	const seeds: Point[] = [];
	for (let x = 0; x < w; x += 1) if (mark[(neckY - 1) * w + x] === HEAD) seeds.push([x, neckY]);
	fill(seeds, (x, y) => {
		const span = spans[y - neckY];
		return !!span && (x < span[0] || x > span[1]);
	}, HAIR_BACK);
	return mark;
}

export interface CutResult {
	/** Thân đã bỏ đầu (cùng cỡ ảnh vào). */
	body: RGBAImage;
	/** Phần đã bỏ (để soi). */
	removed: RGBAImage;
	removedCount: number;
	/** Số pixel tóc rủ dưới đường cổ đã bỏ (sang lớp hairBack). */
	hairBackCount: number;
	/** Pixel đặc còn sót TRÊN hàng cổ trong khung đầu mà không nối với đầu — Q2 phải 0 (trừ vùng bảo vệ). */
	remnants: Point[];
}

/** Cắt đầu khỏi khung thân (luật cấm ghép đè: thân runtime không còn pixel đầu nào, kể cả tóc rủ sát cổ). */
export function cutHead(img: RGBAImage, m: HeadCut, protect?: (x: number, y: number) => boolean): CutResult {
	const mark = headRegion(img, m, protect);
	const body = cloneImage(img);
	const removed = createImage(img.width, img.height);
	let removedCount = 0;
	let hairBackCount = 0;
	let x0 = img.width;
	let x1 = -1;
	for (let i = 0; i < mark.length; i += 1) {
		if (!mark[i]) continue;
		removed.data.set(img.data.subarray(i * 4, i * 4 + 4), i * 4);
		body.data.fill(0, i * 4, i * 4 + 4);
		removedCount += 1;
		if (mark[i] === HAIR_BACK) hairBackCount += 1;
		x0 = Math.min(x0, i % img.width);
		x1 = Math.max(x1, i % img.width);
	}
	const remnants: Point[] = [];
	for (let y = Math.max(0, m.headTopY - 2); y < m.neck[1]; y += 1)
		for (let x = Math.max(0, x0 - 2); x <= Math.min(img.width - 1, x1 + 2); x += 1) if (opaque(body, x, y) && !protect?.(x, y)) remnants.push([x, y]);
	return { body, removed, removedCount, hairBackCount, remnants };
}

export interface HeadExtract {
	/** Canvas đầu chuẩn (head.canvas), neo cổ ở head.neckAnchor. */
	head: RGBAImage;
	/** Tóc rủ dưới đường cổ — cùng canvas / neo với đầu, vẽ DƯỚI thân (chuẩn layers: hairBack < body). null nếu không có. */
	hairBack: RGBAImage | null;
	pixels: number;
}

/**
 * Tách đầu (mặt, tóc, tai, sừng) từ khung nhân vật "thân gốc + tóc" vào canvas đầu chuẩn, kèm cổ da `bareNeckMaxPx` hàng dưới neo — chỉ
 * trong bề ngang cổ (không lấy vai). Pixel rơi ra ngoài canvas → lỗi (đầu to quá canvas, phải xem lại chuẩn, không cắt im lặng).
 */
export function extractHead(img: RGBAImage, m: HeadCut, std: Pick<LayeredStandard, 'head'>, protect?: (x: number, y: number) => boolean): HeadExtract {
	const mark = headRegion(img, m, protect);
	const run = m.spans?.[0] ?? runAt(img, m.neck[1], m.neck[0]);
	if (!run) throw new Error('Không có cổ ở hàng neo');
	for (let y = m.neck[1]; y < m.neck[1] + std.head.bareNeckMaxPx; y += 1) {
		const [a, b] = m.spans?.[y - m.neck[1]] ?? run;
		for (let x = a; x <= b; x += 1) if (opaque(img, x, y) && !mark[y * img.width + x]) mark[y * img.width + x] = HEAD;
	}
	const [cw, ch] = std.head.canvas;
	const [ax, ay] = std.head.neckAnchor;
	const dx = ax - m.neck[0];
	const dy = ay - m.neck[1];
	const head = createImage(cw, ch);
	const hairBack = createImage(cw, ch);
	let pixels = 0;
	let backPixels = 0;
	for (let i = 0; i < mark.length; i += 1) {
		if (!mark[i]) continue;
		const x = (i % img.width) + dx;
		const y = Math.floor(i / img.width) + dy;
		if (x < 0 || y < 0 || x >= cw || y >= ch) throw new Error(`Đầu tràn ra ngoài canvas ${cw}×${ch} ở (${x},${y}) — xem lại head.canvas`);
		(mark[i] === HAIR_BACK ? hairBack : head).data.set(img.data.subarray(i * 4, i * 4 + 4), (y * cw + x) * 4);
		if (mark[i] === HAIR_BACK) backPixels += 1;
		else pixels += 1;
	}
	return { head, hairBack: backPixels ? hairBack : null, pixels };
}

/** Ghép đầu (canvas chuẩn) lên thân tại neo cổ — dịch nguyên pixel: tóc sau (nếu có) dưới thân, đầu trên thân. */
export function composeHead(body: RGBAImage, head: RGBAImage, neck: Point, std: Pick<LayeredStandard, 'head'>, hairBack?: RGBAImage | null): RGBAImage {
	const out = cloneImage(body);
	const ox = neck[0] - std.head.neckAnchor[0];
	const oy = neck[1] - std.head.neckAnchor[1];
	const stamp = (layer: RGBAImage, under: boolean): void => {
		for (let y = 0; y < layer.height; y += 1)
			for (let x = 0; x < layer.width; x += 1) {
				const i = (y * layer.width + x) * 4;
				if (layer.data[i + 3] === 0) continue;
				const tx = x + ox;
				const ty = y + oy;
				if (tx < 0 || ty < 0 || tx >= out.width || ty >= out.height) throw new Error(`Đầu ra ngoài ô ở (${tx},${ty})`);
				const o = (ty * out.width + tx) * 4;
				if (under && out.data[o + 3] !== 0) continue;
				out.data.set(layer.data.subarray(i, i + 4), o);
			}
	};
	if (hairBack) stamp(hairBack, true);
	stamp(head, false);
	return out;
}

/**
 * Q5: lỗ trong suốt quanh chỗ nối cổ (2 hàng trên neo tới 3 hàng dưới) trong bề ngang cổ ±1: pixel trống kẹp giữa pixel đặc theo chiều
 * ngang (khe dọc giữa cổ) hoặc chiều dọc (đầu bị nhấc lên, hở cả một hàng ngang). Ảnh có tóc truyền `span` (dải cổ từ số đo, NeckMeasure.spans[0])
 * để khe giữa lọn tóc và cổ — có sẵn trong ảnh vẽ — không bị tính là hở cổ.
 */
export function neckSeamHoles(img: RGBAImage, neck: Point, span?: [number, number]): Point[] {
	const holes: Point[] = [];
	const run = span ?? runAt(img, neck[1], neck[0]);
	const [x0, x1] = run ? [run[0] - 1, run[1] + 1] : [neck[0] - 3, neck[0] + 3];
	const any = (xs: number[], y: number): boolean => xs.some((x) => opaque(img, x, y));
	for (let y = neck[1] - 2; y <= neck[1] + 3; y += 1)
		for (let x = x0; x <= x1; x += 1) {
			if (opaque(img, x, y)) continue;
			let left = false;
			let right = false;
			for (let k = x0; k < x; k += 1) left ||= opaque(img, k, y);
			for (let k = x + 1; k <= x1; k += 1) right ||= opaque(img, k, y);
			const above = [1, 2, 3].some((d) => any([x], y - d));
			const below = [1, 2, 3].some((d) => any([x], y + d));
			if ((left && right) || (above && below && x > x0 && x < x1)) holes.push([x, y]);
		}
	return holes;
}

/** Điểm chân chạm đất: hàng đặc thấp nhất, cột trung bình các pixel đặc ở 2 hàng đáy. */
export function footRoot(img: RGBAImage): Point {
	for (let y = img.height - 1; y >= 0; y -= 1) {
		const xs: number[] = [];
		for (let yy = y; yy >= Math.max(0, y - 1); yy -= 1) for (let x = 0; x < img.width; x += 1) if (opaque(img, x, yy)) xs.push(x);
		if (xs.length && xs.some((x) => opaque(img, x, y))) return [Math.round(xs.reduce((n, v) => n + v, 0) / xs.length), y];
	}
	throw new Error('Ảnh rỗng');
}

/** Đặt khung vào ô chuẩn bằng một offset nguyên pixel (tính một lần cho cả clip × hướng). Pixel tràn ô → lỗi. */
export function placeInCell(img: RGBAImage, offset: Point, std: Pick<LayeredStandard, 'cell'>): RGBAImage {
	const out = createImage(std.cell.width, std.cell.height);
	for (let y = 0; y < img.height; y += 1)
		for (let x = 0; x < img.width; x += 1) {
			const i = (y * img.width + x) * 4;
			if (img.data[i + 3] === 0) continue;
			const tx = x + offset[0];
			const ty = y + offset[1];
			if (tx < 0 || ty < 0 || tx >= out.width || ty >= out.height) throw new Error(`Khung tràn ô ${out.width}×${out.height} ở (${tx},${ty})`);
			out.data.set(img.data.subarray(i, i + 4), (ty * out.width + tx) * 4);
		}
	return out;
}

/** Offset đặt khung 0 của clip vào ô: chân → root. */
export const cellOffset = (frame0: RGBAImage, std: Pick<LayeredStandard, 'cell'>): Point => {
	const [fx, fy] = footRoot(frame0);
	return [std.cell.root[0] - fx, std.cell.root[1] - fy];
};

/** Bộ màu (RGB) của các pixel đặc — dùng cho Q1 (chỉ pixel nguồn) và Q8 (đầu không dính màu áo). */
export function colorSet(img: RGBAImage): Set<number> {
	const set = new Set<number>();
	for (let i = 0; i < img.data.length; i += 4) if (img.data[i + 3]! > 0) set.add((img.data[i]! << 16) | (img.data[i + 1]! << 8) | img.data[i + 2]!);
	return set;
}

/** Pixel đặc có màu ngoài `allowed`. */
export function foreignPixels(img: RGBAImage, allowed: Set<number>): Point[] {
	const out: Point[] = [];
	for (let y = 0; y < img.height; y += 1)
		for (let x = 0; x < img.width; x += 1) {
			const i = (y * img.width + x) * 4;
			if (img.data[i + 3] === 0) continue;
			if (!allowed.has((img.data[i]! << 16) | (img.data[i + 1]! << 8) | img.data[i + 2]!)) out.push([x, y]);
		}
	return out;
}

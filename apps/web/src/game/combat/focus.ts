import { Container, Graphics } from 'pixi.js';

/**
 * Chọn mục tiêu (focus) — chủ dự án 10/10/2026: "focus rồi dùng chiêu thay vì bấm đâu dùng ấy, focus quái có mũi tên trên đầu".
 * Nhấp / chạm vào quái (hoặc hình nộm) = chọn; Tab = đổi sang mục tiêu gần kế; Esc = bỏ chọn. Mọi chiêu nhắm vào mục tiêu đang
 * chọn — chưa chọn thì bấm chiêu tự chọn con gần nhất trong tầm, không có ai thì đánh thẳng hướng mặt. Mục tiêu chết / mờ đi / ra
 * quá xa thì tự bỏ. Phần luật thuần (có test `tests/focus.test.ts`) + lớp vẽ mũi tên `FocusMarker`.
 */

/** Một thứ chọn được: quái (`Fighter`) hoặc hình nộm — `key` là chính đối tượng đó. */
export interface FocusCandidate {
	key: object;
	x: number;
	/** Chân (gốc toạ độ của actor). */
	y: number;
	/** Cao thân (px thế giới) — vùng bấm trúng + chỗ đặt mũi tên. */
	h: number;
}

/** Bấm chiêu mà chưa chọn ai: tự chọn con gần nhất trong tầm này (px thế giới). */
export const FOCUS_AUTO_RANGE = 460;
/** Tab đổi mục tiêu trong tầm này. */
export const FOCUS_CYCLE_RANGE = 620;
/** Mục tiêu ra xa hơn thế thì tự bỏ chọn. */
export const FOCUS_DROP_RANGE = 900;
/** Vùng bấm trúng: nửa bề ngang tối thiểu + phần nới dưới chân / trên đầu. */
const HIT_HALF_W = 22;
const HIT_BELOW = 10;
const HIT_ABOVE = 14;

const dist = (c: FocusCandidate, x: number, y: number): number => Math.hypot(c.x - x, c.y - y);

/** Thứ nằm dưới điểm bấm (toạ độ thế giới); chồng nhau thì lấy con đứng trước (y lớn hơn). */
export function focusAt(cands: readonly FocusCandidate[], wx: number, wy: number): object | null {
	let best: FocusCandidate | null = null;
	for (const c of cands) {
		const half = Math.max(HIT_HALF_W, c.h * 0.28);
		if (Math.abs(wx - c.x) > half || wy > c.y + HIT_BELOW || wy < c.y - c.h - HIT_ABOVE) continue;
		if (!best || c.y > best.y) best = c;
	}
	return best?.key ?? null;
}

/** Gần nhất trong `range` quanh (px, py). */
export function focusNearest(cands: readonly FocusCandidate[], px: number, py: number, range = FOCUS_AUTO_RANGE): object | null {
	let best: FocusCandidate | null = null;
	let bestD = range;
	for (const c of cands) {
		const d = dist(c, px, py);
		if (d <= bestD) [best, bestD] = [c, d];
	}
	return best?.key ?? null;
}

/** Tab: các thứ trong tầm xếp gần → xa; trả cái đứng SAU mục tiêu hiện tại (hết vòng thì về cái gần nhất). */
export function focusCycle(cands: readonly FocusCandidate[], current: object | null, px: number, py: number, range = FOCUS_CYCLE_RANGE): object | null {
	const list = cands.filter((c) => dist(c, px, py) <= range).sort((a, b) => dist(a, px, py) - dist(b, px, py));
	if (!list.length) return null;
	const i = list.findIndex((c) => c.key === current);
	return list[(i + 1) % list.length]!.key;
}

/** Mục tiêu còn giữ được không: còn trong danh sách (sống, đang hiện) và chưa ra quá xa. */
export function focusKept(cands: readonly FocusCandidate[], current: object | null, px: number, py: number): FocusCandidate | null {
	if (!current) return null;
	const c = cands.find((x) => x.key === current);
	return c && dist(c, px, py) <= FOCUS_DROP_RANGE ? c : null;
}

/** Điểm nhắm vào mục tiêu: đòn nhắm đất → chân; đòn bắn / chém → giữa thân (như tự ngắm cũ: chân − 46, thân thấp thì nửa thân). */
export function focusAim(c: FocusCandidate, ground: boolean): { x: number; y: number } {
	return ground ? { x: c.x, y: c.y } : { x: c.x, y: c.y - Math.min(46, c.h / 2) };
}

/**
 * Tam giác vàng cam chỉ xuống, nhấp nhô trên đầu mục tiêu đang chọn (chủ dự án 10/10/2026: "tam giác màu vàng cam, bỏ cái vòng ở
 * dưới"). Đặt trong lớp thế giới (theo camera, cỡ pixel như sprite) — `update` mỗi khung.
 */
export class FocusMarker {
	readonly layer = new Container();
	private readonly arrow = new Graphics();
	private t = 0;

	constructor() {
		// Tam giác ~20×14: viền nâu đen, ruột vàng cam, mép trên sáng — đủ to để thấy giữa đám quái.
		this.arrow
			.poly([-10, -7, 10, -7, 0, 7])
			.fill(0x2a1605)
			.poly([-7, -5, 7, -5, 0, 4])
			.fill(0xffa21f)
			.poly([-5, -5, 5, -5, 0, -1])
			.fill(0xffd76a);
		this.layer.addChild(this.arrow);
		this.layer.visible = false;
	}

	update(dt: number, target: FocusCandidate | null): void {
		this.layer.visible = !!target;
		if (!target) return;
		this.t += dt;
		const bob = Math.round(Math.sin(this.t * 5) * 3);
		// Trên NHÃN TÊN (nhãn quái / NPC / người chơi đứng ở đầu + 12–18px, vẽ ở lớp chữ đè lên thế giới — đặt thấp hơn là bị che).
		this.arrow.position.set(Math.round(target.x), Math.round(target.y - target.h - 34 + bob));
	}
}

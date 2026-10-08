import type { ResolvedTarget } from './story/resolveTarget';
import type { NavGrid, Point } from './world/NavGrid';

/** Còn xa hơn chừng này (px) thì chạy — stamina hồi 32/s nhanh hơn mức chạy tốn 22/s nên không cạn giữa đường. */
const RUN_BEYOND = 200;
/** Tới gần waypoint giữa đường chừng này thì bỏ, đi tiếp điểm sau; điểm cuối thì phải sát hơn. */
const WAYPOINT_DONE = 6;
const LAST_DONE = 3;
/** Mỗi 0,5s kiểm kẹt / hỏi lại mục tiêu động. Kẹt = quãng còn lại theo đường không ngắn đi được chừng này. */
const CHECK_EVERY = 0.5;
const STUCK_MOVE = 3;
const MAX_REPLANS = 2;
/** Nhảy quá chừng này trong 1 frame = bị dịch chuyển (hồi sinh, debug) → tìm đường lại. */
const TELEPORT_JUMP = 40;
/** Mục tiêu động dời quá chừng này thì tìm đường lại. */
const RETARGET_MOVE = 24;

/**
 * `maxDist`: bước frame này không được dài hơn (px) — tới đúng waypoint thì thôi. Khung hình thấp (dt 0,1s, chạy
 * 15px/frame) mà không chặn thì nhân vật vượt qua waypoint rồi quay lại, lắc qua lắc lại mãi.
 */
export type AutoWalkStep = { kind: 'move'; x: number; y: number; run: boolean; maxDist: number } | { kind: 'done' } | { kind: 'fail' };

/**
 * Bộ tự đi theo đường A*: mỗi frame nhận vị trí người chơi HIỆN TẠI (không giữ tham chiếu Actor — đổi sprite là
 * thay hẳn object người chơi) và trả hướng đi như phím/cần gạt, để game xử lý y như người chơi tự đi.
 */
export class AutoWalk {
	path: Point[];
	target: ResolvedTarget;
	partial: boolean;
	private timer = 0;
	/** Quãng còn lại (theo đường) ở lần kiểm kẹt trước — đo TIẾN ĐỘ chứ không đo độ dời (lắc tại chỗ vẫn dời). */
	private checkRemain: number;
	private last: Point;
	private replans = 0;

	constructor(
		private readonly nav: NavGrid,
		private readonly resolve: () => ResolvedTarget | null,
		target: ResolvedTarget,
		from: Point,
	) {
		this.target = target;
		const path = nav.findPath(from, target);
		this.path = path?.points ?? [];
		this.partial = !path || path.partial;
		this.last = { x: from.x, y: from.y };
		this.checkRemain = this.remaining(from);
	}

	/** Có đường đi không (null = bị vây kín, không có điểm nào để đi). */
	get ok(): boolean {
		return this.path.length > 0 || this.arrived(this.last);
	}

	private arrived(p: Point): boolean {
		return Math.hypot(p.x - this.target.x, p.y - this.target.y) <= this.target.stop;
	}

	/**
	 * `stuck`: đang kẹt mép (khe vừa lọt hộp chân, lệch 1px khỏi đoạn kéo thẳng là trượt trục mãi không qua) — về tâm
	 * ô đang đứng trước rồi mới đi tiếp: đường nối các tâm ô đã được kiểm đi lọt khi dựng lưới.
	 */
	private replan(p: Point, stuck = false): void {
		const cell = stuck ? this.nav.nearestWalkable(p.x, p.y) : -1;
		const c = cell >= 0 ? this.nav.center(cell) : null;
		const from = c && Math.hypot(c.x - p.x, c.y - p.y) > 1 ? c : p;
		const path = this.nav.findPath(from, this.target);
		this.path = path?.points ?? [];
		if (from !== p && this.path.length) this.path.unshift(from);
		this.partial = !path || path.partial;
		this.checkRemain = this.remaining(p);
	}

	step(p: Point, dt: number): AutoWalkStep {
		if (Math.hypot(p.x - this.last.x, p.y - this.last.y) > TELEPORT_JUMP) {
			this.replan(p);
			this.timer = 0;
		}
		this.last = { x: p.x, y: p.y };
		this.timer += dt;
		if (this.timer >= CHECK_EVERY) {
			this.timer = 0;
			let replanned = false;
			if (this.target.dynamic) {
				const t = this.resolve();
				if (!t) return { kind: 'fail' };
				if (Math.hypot(t.x - this.target.x, t.y - this.target.y) > RETARGET_MOVE) {
					this.target = t;
					this.replan(p);
					replanned = true;
				} else this.target = t;
			}
			const remain = this.remaining(p);
			if (!replanned && !this.arrived(p) && remain > this.checkRemain - STUCK_MOVE) {
				if (this.replans >= MAX_REPLANS) return { kind: 'fail' };
				this.replans += 1;
				this.replan(p, true);
			} else if (!replanned) this.checkRemain = remain;
		}
		if (this.arrived(p)) return { kind: 'done' };
		while (this.path.length) {
			const wp = this.path[0]!;
			const d = Math.hypot(wp.x - p.x, wp.y - p.y);
			if (d > (this.path.length === 1 ? LAST_DONE : WAYPOINT_DONE)) break;
			// Bỏ sớm waypoint giữa đường chỉ khi từ chỗ đang đứng đi thẳng tới điểm sau được (hộp chân thật): khe sát
			// tường mà cắt góc 4px là kẹt mép.
			const next = this.path[1];
			if (next && d > 0.5 && !this.nav.visible(p, next, 0)) break;
			this.path.shift();
		}
		const wp = this.path[0];
		if (!wp) {
			// Hết đường mà chưa vào vùng đích (đường cụt / đích không tới được): thử tìm lại, hết lượt thì thôi.
			if (this.replans >= MAX_REPLANS) return { kind: 'fail' };
			this.replans += 1;
			this.replan(p, true);
			return this.path.length ? this.step(p, 0) : { kind: 'fail' };
		}
		const dx = wp.x - p.x;
		const dy = wp.y - p.y;
		const len = Math.hypot(dx, dy) || 1;
		return { kind: 'move', x: dx / len, y: dy / len, run: this.remaining(p) > RUN_BEYOND, maxDist: len };
	}

	/** Quãng còn phải đi theo đường (px). */
	remaining(p: Point): number {
		let total = 0;
		let cur = p;
		for (const wp of this.path) {
			total += Math.hypot(wp.x - cur.x, wp.y - cur.y);
			cur = wp;
		}
		return total;
	}
}

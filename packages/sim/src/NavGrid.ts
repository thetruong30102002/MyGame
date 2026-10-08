/**
 * Tìm đường cho "tự đi tới chỗ làm nhiệm vụ" (thuần, không Pixi — test node gọi thẳng).
 *
 * Lưới ô 24px dựng một lần từ hàm va chạm THẬT của game (hộp chân 11×5 như `world.move`), A* 8 hướng không
 * cắt góc, chỉ nối hai ô khi hộp chân trượt được trọn đoạn giữa hai tâm (gốc cây vắt qua ranh giới ô không chặn
 * tâm ô nào nhưng chặn đoạn nối), đích là một VÙNG TRÒN (tới đủ gần là xong — mục tiêu đứng trên ô chặn như hình nộm vẫn tới được),
 * rồi kéo thẳng đường (bỏ các điểm gấp khúc khi nhìn thấy nhau) để nhân vật đi chéo tự nhiên.
 * NPC, quái, người chơi khác không chặn đường nên lưới là tĩnh.
 */

export type BlockedFn = (x: number, y: number, rx: number, ry: number) => boolean;

export interface Point {
	x: number;
	y: number;
}

export interface NavGoal extends Point {
	/** Tới cách tâm đích ≤ stop (px) là coi như tới nơi. */
	stop: number;
}

export interface NavPath {
	/** Các điểm phải đi qua (KHÔNG gồm điểm xuất phát), điểm cuối là chỗ dừng. */
	points: Point[];
	/** Không tới được vùng đích: đường dẫn tới ô gần đích nhất. */
	partial: boolean;
}

export const NAV_CELL = 24;
/** Hộp chân mặc định của `world.move`. */
const FOOT_RX = 11;
const FOOT_RY = 5;
/** Lấy mẫu va chạm dọc đoạn thẳng khi kéo thẳng đường. */
const SIGHT_STEP = 4;
/**
 * Đoạn đi (cạnh lưới, kéo thẳng) phải lọt hộp chân NỚI thêm chừng này mỗi phía: tâm ô sát tường đúng 0px (nhà ở
 * x1=529, tâm ô x=540) thì lệch 0,01px khỏi đoạn là trượt trục mãi không qua — chừa 1px cho sai số bám đường.
 */
const SIGHT_PAD = 1;
const MAX_OPEN = 20000;
const SQRT2 = Math.SQRT2;
/** 8 hướng theo chiều kim đồng hồ từ đông; hướng ngược của d là (d + 4) % 8. */
const DIRS: readonly (readonly [number, number])[] = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];

export class NavGrid {
	readonly cols: number;
	readonly rows: number;
	readonly walkable: Uint8Array;
	/** Bit d = đi thẳng được từ tâm ô sang tâm ô kề theo DIRS[d]. */
	private readonly links: Uint8Array;
	/** Số hiệu mảng liền của từng ô; `main` = mảng lớn nhất. Ô lẻ (khe chỉ lọt khi không chừa lề) không làm điểm xuất phát. */
	private readonly comp: Int32Array;
	private readonly main: number;
	private readonly g: Float32Array;
	private readonly parent: Int32Array;
	private readonly state: Uint8Array;
	private readonly heap: Int32Array;
	private readonly heapF: Float32Array;

	constructor(
		readonly width: number,
		readonly height: number,
		private readonly blocked: BlockedFn,
	) {
		this.cols = Math.ceil(width / NAV_CELL);
		this.rows = Math.ceil(height / NAV_CELL);
		const n = this.cols * this.rows;
		this.walkable = new Uint8Array(n);
		for (let i = 0; i < n; i += 1) {
			const c = this.center(i);
			this.walkable[i] = blocked(c.x, c.y, FOOT_RX, FOOT_RY) ? 0 : 1;
		}
		this.links = new Uint8Array(n);
		for (let i = 0; i < n; i += 1) {
			if (!this.walkable[i]) continue;
			const cx = i % this.cols;
			const cy = Math.floor(i / this.cols);
			// Nửa số hướng là đủ: cạnh đối xứng (visible lấy mẫu cùng các điểm theo cả hai chiều) nên ghi cho cả hai ô.
			for (let d = 0; d < 4; d += 1) {
				const [dx, dy] = DIRS[d]!;
				const nx = cx + dx;
				const ny = cy + dy;
				if (nx < 0 || ny < 0 || nx >= this.cols || ny >= this.rows) continue;
				const j = ny * this.cols + nx;
				if (!this.walkable[j]) continue;
				// Đi chéo phải trống cả hai ô kề — không lách qua góc tường.
				if (dx && dy && (!this.walkable[cy * this.cols + nx] || !this.walkable[ny * this.cols + cx])) continue;
				if (!this.visible(this.center(i), this.center(j))) continue;
				this.links[i] = this.links[i]! | (1 << d);
				this.links[j] = this.links[j]! | (1 << (d + 4));
			}
		}
		this.comp = new Int32Array(n).fill(-1);
		let main = -1;
		let mainSize = 0;
		const stack: number[] = [];
		for (let i = 0, id = 0; i < n; i += 1) {
			if (!this.walkable[i] || this.comp[i]! >= 0) continue;
			let size = 0;
			this.comp[i] = id;
			stack.push(i);
			while (stack.length) {
				const cur = stack.pop()!;
				size += 1;
				for (let d = 0; d < 8; d += 1) {
					const nb = this.neighbor(cur, d);
					if (nb >= 0 && this.comp[nb]! < 0) {
						this.comp[nb] = id;
						stack.push(nb);
					}
				}
			}
			if (size > mainSize) {
				mainSize = size;
				main = id;
			}
			id += 1;
		}
		this.main = main;
		this.g = new Float32Array(n);
		this.parent = new Int32Array(n);
		this.state = new Uint8Array(n);
		this.heap = new Int32Array(n * 8);
		this.heapF = new Float32Array(n * 8);
	}

	center(i: number): Point {
		return { x: (i % this.cols) * NAV_CELL + NAV_CELL / 2, y: Math.floor(i / this.cols) * NAV_CELL + NAV_CELL / 2 };
	}

	/** Ô kề theo hướng `d` (chỉ số DIRS) nối được với ô `i` không; -1 nếu không. */
	neighbor(i: number, d: number): number {
		if (!(this.links[i]! & (1 << d))) return -1;
		const [dx, dy] = DIRS[d]!;
		return i + dy * this.cols + dx;
	}

	cellAt(x: number, y: number): number {
		const cx = Math.min(this.cols - 1, Math.max(0, Math.floor(x / NAV_CELL)));
		const cy = Math.min(this.rows - 1, Math.max(0, Math.floor(y / NAV_CELL)));
		return cy * this.cols + cx;
	}

	/**
	 * Hai điểm nhìn thấy nhau: hộp chân trượt dọc đoạn thẳng không đụng gì (mẫu mỗi 4px). `pad` nới hộp chân —
	 * mặc định có chừa lề (đường đi); 0 = đúng hộp chân thật.
	 */
	visible(a: Point, b: Point, pad = SIGHT_PAD): boolean {
		const len = Math.hypot(b.x - a.x, b.y - a.y);
		const steps = Math.ceil(len / SIGHT_STEP);
		for (let k = 1; k <= steps; k += 1) {
			const t = k / steps;
			if (this.blocked(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, FOOT_RX + pad, FOOT_RY + pad)) return false;
		}
		return true;
	}

	/** Ô xuất phát được: đứng được và thuộc mảng liền chính. */
	private startable(i: number): boolean {
		return !!this.walkable[i] && this.comp[i] === this.main;
	}

	/** Ô xuất phát gần điểm nhất (xoắn ốc tối đa 4 ô) — điểm lỡ nằm trên ô chặn hoặc trong khe lẻ. */
	nearestWalkable(x: number, y: number, maxRing = 4): number {
		const start = this.cellAt(x, y);
		if (this.startable(start)) return start;
		const sx = start % this.cols;
		const sy = Math.floor(start / this.cols);
		let best = -1;
		let bestD = Infinity;
		for (let ring = 1; ring <= maxRing && best < 0; ring += 1) {
			for (let dy = -ring; dy <= ring; dy += 1) {
				for (let dx = -ring; dx <= ring; dx += 1) {
					if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
					const cx = sx + dx;
					const cy = sy + dy;
					if (cx < 0 || cy < 0 || cx >= this.cols || cy >= this.rows) continue;
					const i = cy * this.cols + cx;
					if (!this.startable(i)) continue;
					const c = this.center(i);
					const d = Math.hypot(c.x - x, c.y - y);
					if (d < bestD) {
						bestD = d;
						best = i;
					}
				}
			}
		}
		return best;
	}

	/**
	 * A* từ `from` tới vùng tròn quanh `goal`. Ô đích = ô trống đầu tiên cách tâm ≤ stop (trừ một chút để người
	 * chơi dừng ở tâm ô vẫn chắc chắn lọt vùng). null = điểm xuất phát bị vây kín.
	 */
	findPath(from: Point, goal: NavGoal): NavPath | null {
		const start = this.nearestWalkable(from.x, from.y);
		if (start < 0) return null;
		// Ô cách tâm ≤ reach: dừng ở tâm ô là chắc lọt vùng. Ô trong (reach, stop] chỉ nhận khi đích đứng được và
		// nhìn thấy từ ô đó — người chơi đi thẳng tiếp về phía đích, vào vùng là dừng.
		const reach = Math.max(goal.stop * 0.5, goal.stop - 8);
		const goalFree = !this.blocked(goal.x, goal.y, FOOT_RX, FOOT_RY);
		const distTo = (i: number): number => {
			const c = this.center(i);
			return Math.hypot(c.x - goal.x, c.y - goal.y);
		};
		const h = (i: number): number => Math.max(0, distTo(i) - goal.stop) / NAV_CELL;
		const isGoal = (i: number): boolean => {
			const d = distTo(i);
			return d <= reach || (d <= goal.stop && goalFree && this.visible(this.center(i), goal));
		};
		const { g, parent, state, links } = this;
		state.fill(0);
		let size = 0;
		const push = (i: number, f: number): void => {
			let k = size;
			size += 1;
			while (k > 0) {
				const p = (k - 1) >> 1;
				if (this.heapF[p]! <= f) break;
				this.heap[k] = this.heap[p]!;
				this.heapF[k] = this.heapF[p]!;
				k = p;
			}
			this.heap[k] = i;
			this.heapF[k] = f;
		};
		const pop = (): number => {
			const top = this.heap[0]!;
			size -= 1;
			const last = this.heap[size]!;
			const lastF = this.heapF[size]!;
			let k = 0;
			for (;;) {
				const l = k * 2 + 1;
				if (l >= size) break;
				const r = l + 1;
				const c = r < size && this.heapF[r]! < this.heapF[l]! ? r : l;
				if (this.heapF[c]! >= lastF) break;
				this.heap[k] = this.heap[c]!;
				this.heapF[k] = this.heapF[c]!;
				k = c;
			}
			this.heap[k] = last;
			this.heapF[k] = lastF;
			return top;
		};

		g[start] = 0;
		parent[start] = -1;
		state[start] = 1;
		push(start, h(start));
		let best = start;
		let bestD = distTo(start);
		let goalCell = -1;
		let opened = 1;
		while (size > 0) {
			const cur = pop();
			if (state[cur] === 2) continue;
			state[cur] = 2;
			const hc = h(cur);
			if (hc <= 0 && isGoal(cur)) {
				goalCell = cur;
				break;
			}
			const dc = distTo(cur);
			if (dc < bestD) {
				bestD = dc;
				best = cur;
			}
			if (opened > MAX_OPEN) break;
			const mask = links[cur]!;
			for (let d = 0; d < 8; d += 1) {
				if (!(mask & (1 << d))) continue;
				const ni = this.neighbor(cur, d);
				if (state[ni] === 2) continue;
				const ng = g[cur]! + (d & 1 ? SQRT2 : 1);
				if (state[ni] === 1 && ng >= g[ni]!) continue;
				g[ni] = ng;
				parent[ni] = cur;
				state[ni] = 1;
				opened += 1;
				push(ni, ng + h(ni));
			}
		}
		const partial = goalCell < 0;
		const end = partial ? best : goalCell;
		const cells: Point[] = [];
		for (let i = end; i >= 0; i = parent[i]!) {
			cells.push(this.center(i));
			if (i === start) break;
		}
		cells.reverse();
		// Đích đứng trên chỗ trống và nhìn thấy từ ô cuối: đi thẳng về phía đích (dừng ở bán kính), khỏi khựng ở tâm ô.
		const last = cells[cells.length - 1]!;
		if (!partial && goalFree && this.visible(last, goal)) cells.push({ x: goal.x, y: goal.y });
		return { points: this.smooth(from, cells), partial };
	}

	/** Kéo thẳng: từ điểm hiện tại nhảy tới điểm xa nhất còn nhìn thấy (tham lam theo chiều đi). */
	private smooth(from: Point, cells: Point[]): Point[] {
		const out: Point[] = [];
		let cur: Point = from;
		let i = 0;
		while (i < cells.length) {
			let j = i;
			while (j + 1 < cells.length && this.visible(cur, cells[j + 1]!)) j += 1;
			// Ô kề đầu tiên không nhìn thấy (điểm xuất phát lệch khỏi tâm ô) vẫn phải đi qua nó.
			cur = cells[j]!;
			out.push(cur);
			i = j + 1;
		}
		// Điểm đầu trùng chỗ đang đứng thì bỏ.
		if (out.length > 1 && Math.hypot(out[0]!.x - from.x, out[0]!.y - from.y) < 2) out.shift();
		return out;
	}
}

/** Mã phản ứng nguyên tố ổn định (dữ liệu nhiệm vụ dùng mã này, không dùng chữ hiển thị) — chỉ được THÊM, không đổi tên. */
export const REACTION_IDS = ['steam', 'burst', 'chill', 'freeze', 'melt', 'mud', 'lava', 'sandstorm', 'shatter'] as const;
export type ReactionId = (typeof REACTION_IDS)[number];

/**
 * Luật THUẦN của các kiểu đòn vùng + trạng thái mới (GĐ2 cây Nguyên tố) — CombatSystem gọi, test node gọi thẳng
 * (không kéo Pixi). Toạ độ là toạ độ thế giới; "mặt đất" là chân nhân vật (actor.x, actor.y).
 */

/** Vùng trên mặt đất nhìn nghiêng: elip dẹt theo chiều dọc — cùng tỉ lệ với vòng lửa/vòng nước trong atlas (≈ 0,62). */
export const GROUND_SQUASH = 0.62;

/** Điểm (x, y) nằm trong vùng tròn mặt đất tâm (cx, cy) bán kính r (+ `pad` = bề ngang thân mục tiêu). */
export function inCircle(x: number, y: number, cx: number, cy: number, r: number, pad = 0): boolean {
	return Math.hypot(x - cx, (y - cy) / GROUND_SQUASH) <= r + pad;
}

/** Trong nón: gốc (ox, oy), hướng (dx, dy), dài `range`, nửa góc `halfDeg` độ. Mục tiêu đè lên gốc (gần hơn `pad`) luôn trúng. */
export function inCone(x: number, y: number, ox: number, oy: number, dx: number, dy: number, range: number, halfDeg: number, pad = 0): boolean {
	const ex = x - ox;
	const ey = y - oy;
	const d = Math.hypot(ex, ey);
	if (d > range + pad) return false;
	if (d <= pad) return true;
	const len = Math.hypot(dx, dy) || 1;
	const cos = (ex * dx + ey * dy) / (d * len);
	// Mép nón nới theo bề ngang thân: mục tiêu sát mép (thân chạm vào nón) vẫn tính trúng.
	const slack = Math.asin(Math.min(1, pad / d));
	return Math.acos(Math.max(-1, Math.min(1, cos))) <= (halfDeg * Math.PI) / 180 + slack;
}

/** Khoảng cách từ điểm tới đoạn thẳng AB. */
export function segmentDistance(x: number, y: number, ax: number, ay: number, bx: number, by: number): number {
	const vx = bx - ax;
	const vy = by - ay;
	const l2 = vx * vx + vy * vy;
	const t = l2 > 0 ? Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / l2)) : 0;
	return Math.hypot(x - (ax + vx * t), y - (ay + vy * t));
}

/** Trong dải thẳng AB nửa bề ngang `half` (đầu mút bo tròn). */
export function inLine(x: number, y: number, ax: number, ay: number, bx: number, by: number, half: number, pad = 0): boolean {
	return segmentDistance(x, y, ax, ay, bx, by) <= half + pad;
}

export type Area =
	| { kind: 'circle'; x: number; y: number; r: number }
	| { kind: 'cone'; x: number; y: number; dx: number; dy: number; range: number; half: number }
	| { kind: 'line'; ax: number; ay: number; bx: number; by: number; half: number };

export function inArea(a: Area, x: number, y: number, pad = 0): boolean {
	if (a.kind === 'circle') return inCircle(x, y, a.x, a.y, a.r, pad);
	if (a.kind === 'cone') return inCone(x, y, a.x, a.y, a.dx, a.dy, a.range, a.half, pad);
	return inLine(x, y, a.ax, a.ay, a.bx, a.by, a.half, pad);
}

/** Hướng đẩy lùi (vector đơn vị) cho mục tiêu ở (x, y): ra xa tâm vùng tròn / gốc nón; theo chiều đường thẳng. */
export function knockDir(a: Area, x: number, y: number): { x: number; y: number } {
	let dx: number;
	let dy: number;
	if (a.kind === 'line') [dx, dy] = [a.bx - a.ax, a.by - a.ay];
	else [dx, dy] = [x - a.x, y - a.y];
	if (a.kind === 'cone' && Math.hypot(dx, dy) < 1) [dx, dy] = [a.dx, a.dy];
	const len = Math.hypot(dx, dy);
	return len < 1e-6 ? { x: 0, y: 1 } : { x: dx / len, y: dy / len };
}

/** Điểm nhắm trên mặt đất kẹp trong tầm `range` tính từ (ox, oy). */
export function clampTarget(ox: number, oy: number, tx: number, ty: number, range: number): { x: number; y: number } {
	const dx = tx - ox;
	const dy = ty - oy;
	const d = Math.hypot(dx, dy);
	if (d <= range || d < 1e-6) return { x: tx, y: ty };
	return { x: ox + (dx / d) * range, y: oy + (dy / d) * range };
}

/** Điểm đặt vùng khi không có chuột: trước mặt theo hướng nhìn (fx, fy — chưa cần chuẩn hoá) ở khoảng cách `dist`. */
export function aheadPoint(x: number, y: number, fx: number, fy: number, dist: number): { x: number; y: number } {
	const len = Math.hypot(fx, fy) || 1;
	return { x: x + (fx / len) * dist, y: y + (fy / len) * dist };
}

/** Cắt đường thẳng dài `length` từ (ox, oy) theo hướng (dx, dy) thành các đoạn `step` px (đoạn cuối có thể ngắn hơn). */
export function lineSegments(ox: number, oy: number, dx: number, dy: number, length: number, step: number): { i: number; ax: number; ay: number; bx: number; by: number; cx: number; cy: number }[] {
	const len = Math.hypot(dx, dy) || 1;
	const ux = dx / len;
	const uy = dy / len;
	const n = Math.max(1, Math.ceil(length / step));
	return Array.from({ length: n }, (_, i) => {
		const a = i * step;
		const b = Math.min(length, (i + 1) * step);
		const m = (a + b) / 2;
		return { i, ax: ox + ux * a, ay: oy + uy * a, bx: ox + ux * b, by: oy + uy * b, cx: ox + ux * m, cy: oy + uy * m };
	});
}

/** Lướt: vận tốc theo hướng (dx, dy) + thời gian để đi đúng `range` px ở tốc `speed`. */
export function dashPlan(dx: number, dy: number, range: number, speed: number): { vx: number; vy: number; t: number } {
	const len = Math.hypot(dx, dy) || 1;
	return { vx: (dx / len) * speed, vy: (dy / len) * speed, t: range / speed };
}

/** Một bước hút về tâm (cx, cy) với tốc `speed` px/giây — không vượt quá tâm. */
export function pullStep(x: number, y: number, cx: number, cy: number, speed: number, dt: number): { dx: number; dy: number } {
	const dx = cx - x;
	const dy = cy - y;
	const d = Math.hypot(dx, dy);
	if (d < 1e-6) return { dx: 0, dy: 0 };
	const step = Math.min(d, speed * dt);
	return { dx: (dx / d) * step, dy: (dy / d) * step };
}

// ———————————————————————————— trạng thái ————————————————————————————

/** Boss chỉ chịu một nửa thời lượng khống chế (cùng luật đóng băng cũ) — không để trận boss thành đứng chém bao cát. */
export function ccSeconds(seconds: number, boss: boolean | undefined): number {
	return boss ? seconds / 2 : seconds;
}

/**
 * Boss KHÁNG BĂNG: đang bị đóng băng thì không đóng băng lại (không gia hạn), băng vừa hết thì miễn đóng băng thêm chừng này
 * giây. Không có luật này thì nhịp tự động của vùng (Gọi Mưa làm ướt lại mỗi 0,5s + Băng Địa / vụn băng mỗi 0,5s) đặt lại
 * 0,8s băng trước khi băng cũ kịp tan — boss đứng im suốt trận dù đã "½ thời lượng". Quái thường không kháng (đóng băng hàng
 * loạt là combo người chơi muốn).
 */
export const BOSS_FREEZE_IMMUNE = 3;

/** Đóng băng mục tiêu được không: boss đang đóng băng hoặc còn kháng băng (`freezeImmune` giây) thì không. */
export function canFreeze(t: { boss?: boolean; freeze: number; freezeImmune?: number }): boolean {
	return !t.boss || (t.freeze <= 0 && (t.freezeImmune ?? 0) <= 0);
}

/** Hất lên: độ cao (px) của sprite ở giây `left` còn lại trên tổng `total` — một đường parabol, đỉnh `peak`. */
export function launchHeight(left: number, total: number, peak = 26): number {
	if (left <= 0 || total <= 0) return 0;
	const k = Math.max(0, Math.min(1, 1 - left / total));
	return Math.round(4 * peak * k * (1 - k));
}

/**
 * Phá giáp: giáp còn 50% VÀ nhận thêm 15% sát thương. Giáp quái chỉ 1–8 (trừ đi một nửa) nên riêng việc trừ giáp gần như
 * không thấy — phần "nhận thêm" mới làm phá giáp đáng giá.
 */
export const ARMOR_BREAK = { def: 0.5, taken: 1.15 } as const;

/** Sát thương sau giáp (giáp trừ một nửa như cũ), có/không phá giáp. */
export function armorDamage(raw: number, def: number, broken: boolean): number {
	return Math.max(1, Math.round(raw * (broken ? ARMOR_BREAK.taken : 1) - def * 0.5 * (broken ? ARMOR_BREAK.def : 1)));
}

/**
 * Vỡ giáp — "phá giáp CHỒNG phá giáp" (Phá Giáp của Kiếm Thần đánh mục tiêu ĐANG bị phá giáp: Dung Nham, kiếm phủ Thổ, Phá
 * Giáp trước đó): nhận thêm chừng này nữa từ mọi nguồn, nhân chồng lên phá giáp thường (×1,15 × 1,15 ≈ ×1,32).
 */
export const SUNDER_TAKEN = 1.15;

/** Số liệu trạng thái + 4 phản ứng Thổ (kế hoạch mục 2.5). */
export const EARTH = {
	/** Đòn Thổ trúng thường: bám bụi đất (giây) — Thuỷ/Hoả/Phong đánh vào sau đó ra phản ứng. */
	dust: 4,
	/** Bùn Lầy (Thổ + Thuỷ): chậm nặng — còn 30% tốc trong 3 giây. */
	mudSeconds: 3,
	mudSlow: 0.3,
	mudMult: 1.2,
	/** Dung Nham (Thổ + Hoả): cháy MẠNH (mỗi nhịp đốt ×2) + phá giáp 4 giây. */
	lavaBurn: 2,
	lavaArmor: 4,
	lavaMult: 1.3,
	/** Bão Cát (Thổ + Phong): quái đánh trượt 40% trong 3 giây. */
	sandMiss: 0.4,
	sandSeconds: 3,
	sandMult: 1.15,
	/** Vỡ Vụn (Thổ + Băng): mục tiêu đang đóng băng nhận ×2,2 rồi hết đóng băng. */
	shatterMult: 2.2,
} as const;

/**
 * Phủ phép Thổ lên kiếm: mỗi nhát phá giáp chừng này giây; nhát thứ 3 liên tiếp choáng ngắn (`stunUp` từ Thổ mốc 7).
 * `every` / `comboReset` là bộ đếm nhát CHUNG của mọi phủ phép (nhát thứ 3 nổ của phủ Hoả cũng đếm theo đây).
 */
export const EARTH_ENCHANT = { armor: 4, every: 3, stun: 0.5, stunUp: 0.9, comboReset: 2 } as const;

/**
 * Phủ phép theo mốc nguyên tố (kế hoạch 2.3) — phần THÊM ngoài việc đòn kiếm mang hệ (cháy, ướt, lạnh… như phép).
 * Mốc 5 = có phủ; mốc 7 (`talents.ENCHANT_UP_TIER`) = mạnh lên.
 * - Hoả 7: nhát thứ 3 liên tiếp nổ nhỏ quanh mục tiêu đầu tiên trúng nhát đó (`blastPower` × sát thương nhát).
 * - Thuỷ: hút máu `drain` (mốc 7: `drainUp`) sát thương thật — cộng với Huyết Thuỷ.
 * - Phong: tầm chém × `reach` + đẩy lùi nhẹ; mốc 7: mỗi nhát chém (melee) bắn thêm một lưỡi gió (`blade*`, không xuyên).
 * - Băng: trúng `stacks` nhát liên tiếp (mốc 7: `stacksUp`), mỗi nhát cách nhau ≤ `window` giây → đóng băng `freeze` giây.
 */
export const ENCHANT_FX = {
	fire: { blastPower: 0.6, blastRadius: 56 },
	water: { drain: 0.03, drainUp: 0.06 },
	wind: { reach: 1.25, knock: 14, bladePower: 0.5, bladeSpeed: 440, bladeRange: 210 },
	ice: { stacks: 3, stacksUp: 2, window: 3, freeze: 1 },
} as const;

/**
 * Băng phủ kiếm cộng dồn trên MỘT mục tiêu: nhát trước còn trong `window` giây thì cộng tiếp, không thì đếm lại từ 1; đủ
 * `need` thì đóng băng và về 0. Trả số nhát mới + có đóng băng không.
 */
export function frostStack(prev: { n: number; at: number }, now: number, need: number, window: number = ENCHANT_FX.ice.window): { n: number; freeze: boolean } {
	const n = now - prev.at <= window ? prev.n + 1 : 1;
	return n >= need ? { n: 0, freeze: true } : { n, freeze: false };
}

/** Trạng thái làm chậm trên một mục tiêu (quái). */
export interface SlowState {
	chill: number;
	frost?: number;
	wet: number;
	slow?: number;
	slowMult?: number;
}

/**
 * Hệ số tốc chạy của quái: lấy mức chậm MẠNH NHẤT giữa lạnh (50%, lạnh sâu `frostSlow`) và chậm nặng (Bùn Lầy) — không
 * nhân chồng (lạnh × bùn = 15% là đứng gần như im) — rồi nhân Thấm Sâu nếu đang ướt.
 */
export function moveFactor(s: SlowState, frostSlow: number, wetSlow: number): number {
	let k = 1;
	if (s.chill > 0) k = Math.min(k, (s.frost ?? 0) > 0 ? frostSlow : 0.5);
	if ((s.slow ?? 0) > 0) k = Math.min(k, s.slowMult ?? 1);
	if (s.wet > 0) k *= wetSlow;
	return k;
}

/** Đòn của quái đang dính Bão Cát có trượt không (`roll` = Math.random()). */
export function attackMisses(miss: number, chance: number, roll: number): boolean {
	return miss > 0 && roll < chance;
}

/**
 * Hồi máu từ hút máu (Huyết Thuỷ): phần trăm sát thương THẬT đã gây, làm tròn; dưới 1 thì không hồi. "Thật" = máu mục tiêu
 * thật sự mất — phần thừa của nhát kết liễu (đòn 600 vào quái còn 5 máu) không tính: bên gọi kẹp theo máu còn lại.
 */
export function lifestealHeal(damage: number, pct: number): number {
	return pct > 0 ? Math.floor(damage * pct + 0.5) : 0;
}

// ———————————————————————————— Kiếm lưu phái: thế đỡ (Thủy Thần), Ảnh Bộ (Bắc Thần) ————————————————————————————

/** Thế đỡ: Thế Tĩnh giữ suốt `duration` (chặn mọi đòn cận chiến); Lưu Thủy Phản là cửa sổ ngắn, đỡ MỘT đòn rồi thôi. */
export type GuardKind = 'stance' | 'parry';
/** Đòn của quái đánh vào người chơi: chém cận chiến / đạn bay / đòn vùng báo trước (boss dậm đất). */
export type IncomingKind = 'melee' | 'shot' | 'area';

export const GUARD = {
	/** Đạn / đòn vùng trúng người đang giữ thế (không phản được) chỉ còn chừng này sát thương. */
	shot: 0.4,
	/** Lưu Thủy Phản đỡ trúng: miễn thương thêm chừng này giây — đòn thứ hai của bầy không nện ngay vào nhát phản. */
	parryIframes: 0.4,
	/** Tâm Tĩnh: đứng yên ít nhất chừng này giây mới tính là "đứng yên". */
	still: 0.3,
} as const;

/**
 * Đòn đánh vào người đang giữ thế ra sao: `counter` = hoá giải + phản (không mất máu), còn lại nhận `mult` sát thương;
 * `ends` = thế đỡ tan sau đòn này. Thế Tĩnh: chặn + phản mọi đòn cận chiến, đạn giảm. Lưu Thủy Phản: hoá giải đòn đầu
 * tiên (cả đạn — phản ngược lại kẻ bắn) rồi tan. Đòn vùng (dậm đất) không đỡ được bằng kiếm: chỉ giảm, thế vẫn giữ.
 */
export function guardOutcome(guard: GuardKind, attack: IncomingKind): { counter: boolean; mult: number; ends: boolean } {
	if (attack === 'area') return { counter: false, mult: GUARD.shot, ends: false };
	if (guard === 'parry') return { counter: true, mult: 0, ends: true };
	return attack === 'melee' ? { counter: true, mult: 0, ends: false } : { counter: false, mult: GUARD.shot, ends: false };
}

/** Điểm "sau lưng" mục tiêu (tx, ty) nhìn từ (px, py): đi tiếp qua mục tiêu thêm `dist` px theo hướng tiếp cận. */
export function behindPoint(px: number, py: number, tx: number, ty: number, dist: number): { x: number; y: number } {
	const dx = tx - px;
	const dy = ty - py;
	const len = Math.hypot(dx, dy);
	if (len < 1e-6) return { x: tx, y: ty + dist };
	return { x: tx + (dx / len) * dist, y: ty + (dy / len) * dist };
}

/**
 * Chọn mục tiêu cho đòn lao tới (Ảnh Bộ): trong tầm `range` và trong nón ±`halfDeg` quanh hướng nhắm (dx, dy). Ưu tiên
 * mục tiêu gần hướng nhắm, rồi mới tới gần người: điểm = khoảng cách × (1 + góc lệch / nửa góc). −1 = không có.
 */
export function pickAhead(px: number, py: number, dx: number, dy: number, range: number, halfDeg: number, targets: readonly { x: number; y: number }[]): number {
	const len = Math.hypot(dx, dy) || 1;
	const half = (halfDeg * Math.PI) / 180;
	let best = -1;
	let bestScore = Infinity;
	targets.forEach((t, i) => {
		const ex = t.x - px;
		const ey = t.y - py;
		const d = Math.hypot(ex, ey);
		if (d > range) return;
		const ang = d < 1e-6 ? 0 : Math.acos(Math.max(-1, Math.min(1, (ex * dx + ey * dy) / (d * len))));
		if (ang > half) return;
		const score = d * (1 + ang / half);
		if (score < bestScore) [best, bestScore] = [i, score];
	});
	return best;
}

// ———————————————————————————— GĐ3 (mốc 6–9): tường, mưa, sét, mưa nhiều điểm, trạng thái mới ————————————————————————————

/** Tường tạm (Tường Lửa, Tường Đá): đoạn AB trên mặt đất (đường tâm), nửa bề dày `half`. */
export interface WallSeg {
	ax: number;
	ay: number;
	bx: number;
	by: number;
	half: number;
}

/**
 * Hai đầu tường dựng tại (cx, cy), VUÔNG GÓC với hướng nhắm (dx, dy) — vuông góc đo TRÊN MẶT ĐẤT (đất nhìn nghiêng ép dọc
 * `GROUND_SQUASH`), dài 2 × `halfLen` đo trên đất: nhắm xuống thì tường nằm ngang đủ dài, nhắm ngang thì tường dựng dọc và
 * ngắn lại theo phối cảnh (cùng luật với vùng tròn thành elip).
 */
export function wallEnds(cx: number, cy: number, dx: number, dy: number, halfLen: number): { ax: number; ay: number; bx: number; by: number } {
	let gx = dx;
	let gy = dy / GROUND_SQUASH;
	const len = Math.hypot(gx, gy);
	if (len < 1e-6) [gx, gy] = [0, 1];
	else [gx, gy] = [gx / len, gy / len];
	const px = -gy * halfLen;
	const py = gx * halfLen * GROUND_SQUASH;
	return { ax: cx - px, ay: cy - py, bx: cx + px, by: cy + py };
}

/** Đoạn PQ cắt (hoặc chạm) đoạn AB. */
export function segmentsCross(px: number, py: number, qx: number, qy: number, ax: number, ay: number, bx: number, by: number): boolean {
	const o = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) => Math.sign((x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1));
	const d1 = o(ax, ay, bx, by, px, py);
	const d2 = o(ax, ay, bx, by, qx, qy);
	const d3 = o(px, py, qx, qy, ax, ay);
	const d4 = o(px, py, qx, qy, bx, by);
	if (d1 !== d2 && d3 !== d4) return true;
	// Thẳng hàng: chỉ tính khi chồng lên nhau (đạn bay dọc đúng đường tâm tường).
	const on = (x: number, y: number, x1: number, y1: number, x2: number, y2: number) => Math.min(x1, x2) - 1e-9 <= x && x <= Math.max(x1, x2) + 1e-9 && Math.min(y1, y2) - 1e-9 <= y && y <= Math.max(y1, y2) + 1e-9;
	return (d1 === 0 && on(px, py, ax, ay, bx, by)) || (d2 === 0 && on(qx, qy, ax, ay, bx, by)) || (d3 === 0 && on(ax, ay, px, py, qx, qy)) || (d4 === 0 && on(bx, by, px, py, qx, qy));
}

/** Có tường nào chắn giữa hai điểm không (đạn quái, nhát chém của quái đánh qua tường). */
export function wallBetween(x0: number, y0: number, x1: number, y1: number, walls: readonly WallSeg[]): boolean {
	return walls.some((w) => segmentsCross(x0, y0, x1, y1, w.ax, w.ay, w.bx, w.by));
}

/**
 * Một bước đi (dx, dy) của quái từ (x, y) qua các tường: bước lấn vào dải tường (nửa bề dày + `pad` = bề ngang thân) hoặc
 * vượt đường tâm thì bỏ phần vuông góc với tường (đi tới sát mép là dừng) — giữ phần dọc tường nên quái TRƯỢT dọc tường, không
 * xuyên qua. Đứng sẵn trong dải (tường dựng đè lên) thì đi ra được, chỉ không vượt đường tâm.
 * CHỈ là va chạm: tự nó KHÔNG đưa quái vòng qua đầu tường — quái đuổi thẳng tới người chơi đứng sau giữa tường sẽ trượt về
 * đúng chỗ đối diện rồi đứng im (phần dọc tường về 0). Đường vòng là việc của `detourWaypoint` (quái đang đuổi).
 */
export function wallClip(x: number, y: number, dx: number, dy: number, walls: readonly WallSeg[], pad = 0): { dx: number; dy: number } {
	for (const w of walls) {
		const lx = w.bx - w.ax;
		const ly = w.by - w.ay;
		const L = Math.hypot(lx, ly);
		if (L < 1e-6) continue;
		const tx = lx / L;
		const ty = ly / L;
		const nx = -ty;
		const ny = tx;
		const s0 = (x - w.ax) * nx + (y - w.ay) * ny;
		const u0 = (x - w.ax) * tx + (y - w.ay) * ty;
		const dn = dx * nx + dy * ny;
		const du = dx * tx + dy * ty;
		const s1 = s0 + dn;
		const u1 = u0 + du;
		const reach = w.half + pad;
		// Ngoài hai đầu tường (đã đi vòng qua) thì tự do.
		if (u1 < -reach || u1 > L + reach) continue;
		if (Math.abs(s0) >= reach - 1e-6) {
			if (Math.abs(s1) >= reach && s0 * s1 > 0) continue;
			const keep = Math.sign(s0) * reach - s0;
			dx = tx * du + nx * keep;
			dy = ty * du + ny * keep;
		} else if (s0 * s1 < 0) {
			dx = tx * du;
			dy = ty * du;
		}
	}
	return { dx, dy };
}

/** Đường vòng qua tường: điểm hướng tới cách mép dải tường / đầu tường chừng này px (không cọ sát mép). */
export const DETOUR_MARGIN = 6;

/** Toạ độ của điểm (x, y) theo tường `w`: `u` dọc tường (0 ở đầu A, `L` ở đầu B), `s` vuông góc (âm / dương = hai phía). */
function wallFrame(w: WallSeg): { L: number; tx: number; ty: number; nx: number; ny: number } | null {
	const lx = w.bx - w.ax;
	const ly = w.by - w.ay;
	const L = Math.hypot(lx, ly);
	if (L < 1e-6) return null;
	return { L, tx: lx / L, ty: ly / L, nx: -ly / L, ny: lx / L };
}

/**
 * Tường `w` có chắn đường thẳng từ (x, y) tới (tx, ty) không — xét đúng vùng mà `wallClip` chặn: dải tường nới `pad` (bề
 * ngang thân) cả bề dày lẫn hai đầu. Một đầu mút đang đứng TRONG dải thì coi như đứng ở mép phía nó (từ trong dải đi ra
 * phía mình được, chỉ không vượt đường tâm). Đi sát dọc mép (không lấn vào) thì không tính là bị chắn.
 */
export function wallBlocks(x: number, y: number, tx: number, ty: number, w: WallSeg, pad = 0): boolean {
	const fr = wallFrame(w);
	if (!fr) return false;
	const reach = w.half + pad;
	const local = (px: number, py: number) => ({ u: (px - w.ax) * fr.tx + (py - w.ay) * fr.ty, s: (px - w.ax) * fr.nx + (py - w.ay) * fr.ny });
	const a = local(x, y);
	const b = local(tx, ty);
	// Đầu mút trong dải → đẩy ra mép phía nó (s = 0 đúng đường tâm: đi phía nào cũng được — theo phía đầu kia).
	const clampOut = (p: { u: number; s: number }, other: number) => {
		if (Math.abs(p.s) >= reach) return p;
		const side = Math.sign(p.s) || Math.sign(other) || 1;
		return { u: p.u, s: side * reach };
	};
	const p0 = clampOut(a, b.s);
	const p1 = clampOut(b, a.s);
	// Liang–Barsky: đoạn p0→p1 có đi qua phần TRONG (mở theo bề dày) của hình chữ nhật dải tường không.
	const eps = 1e-6;
	const du = p1.u - p0.u;
	const ds = p1.s - p0.s;
	let t0 = 0;
	let t1 = 1;
	const edges: [number, number][] = [
		[-du, p0.u + reach],
		[du, fr.L + reach - p0.u],
		[-ds, p0.s - (-reach + eps)],
		[ds, reach - eps - p0.s],
	];
	for (const [p, q] of edges) {
		if (Math.abs(p) < 1e-12) {
			if (q < 0) return false;
			continue;
		}
		const r = q / p;
		if (p < 0) t0 = Math.max(t0, r);
		else t1 = Math.min(t1, r);
		if (t0 > t1) return false;
	}
	return t1 - t0 > eps;
}

/** Hai góc vòng qua đầu `dir` (+1 = đầu B, −1 = đầu A) của tường, ở phía `side` (dấu của `s`), cách dải `DETOUR_MARGIN`. */
function detourCorner(w: WallSeg, fr: NonNullable<ReturnType<typeof wallFrame>>, reach: number, dir: 1 | -1, side: number): { x: number; y: number } {
	const off = reach + DETOUR_MARGIN;
	const u = dir > 0 ? fr.L + off : -off;
	const s = (side || 1) * off;
	return { x: w.ax + fr.tx * u + fr.nx * s, y: w.ay + fr.ty * u + fr.ny * s };
}

/**
 * Chọn đầu tường để vòng (quái đang đuổi bị tường chắn): đường "góc phía mình → góc phía đích → đích" qua đầu nào ngắn hơn
 * (đoạn giữa hai góc dài như nhau ở hai đầu nên chỉ so hai đoạn còn lại). +1 = đầu B, −1 = đầu A.
 */
export function detourSide(x: number, y: number, tx: number, ty: number, w: WallSeg, pad = 0): 1 | -1 {
	const fr = wallFrame(w);
	if (!fr) return 1;
	const reach = w.half + pad;
	const s0 = (x - w.ax) * fr.nx + (y - w.ay) * fr.ny;
	const st = (tx - w.ax) * fr.nx + (ty - w.ay) * fr.ny;
	const mine = Math.sign(s0) || -Math.sign(st) || 1;
	const theirs = Math.sign(st) || -mine;
	const cost = (dir: 1 | -1) => {
		const c1 = detourCorner(w, fr, reach, dir, mine);
		const c2 = detourCorner(w, fr, reach, dir, theirs);
		return Math.hypot(c1.x - x, c1.y - y) + Math.hypot(tx - c2.x, ty - c2.y);
	};
	return cost(1) <= cost(-1) ? 1 : -1;
}

/**
 * Điểm quái đang vòng tường nên đi tới kế tiếp (đầu `dir`): chưa qua khỏi đầu tường thì tới góc phía MÌNH (đi song song mép,
 * không lấn vào dải — `wallClip` không cắt bước), qua rồi thì tới góc phía ĐÍCH. Tới đó đường thẳng tới đích hết bị chắn
 * (`wallBlocks` = false) và quái đuổi thẳng như thường. Lý do cần hai góc: đứng ngay đầu tường mà nhắm thẳng về người chơi
 * đứng sau GIỮA tường thì đường đi vẫn cắt góc dải tường — bị cắt bước, trượt ngược về giữa (kẹt ở đầu tường).
 */
export function detourWaypoint(x: number, y: number, tx: number, ty: number, w: WallSeg, pad: number, dir: 1 | -1): { x: number; y: number } {
	const fr = wallFrame(w);
	if (!fr) return { x: tx, y: ty };
	const reach = w.half + pad;
	const u0 = (x - w.ax) * fr.tx + (y - w.ay) * fr.ty;
	const s0 = (x - w.ax) * fr.nx + (y - w.ay) * fr.ny;
	const st = (tx - w.ax) * fr.nx + (ty - w.ay) * fr.ny;
	const mine = Math.sign(s0) || -Math.sign(st) || 1;
	const theirs = Math.sign(st) || -mine;
	const half = DETOUR_MARGIN / 2;
	const passed = dir > 0 ? u0 >= fr.L + reach + half : u0 <= -reach - half;
	return detourCorner(w, fr, reach, dir, passed ? theirs : mine);
}

/** Lôi Vũ: số tia sét mỗi nhịp — mây đứng trong mưa của chính mình (Gọi Mưa) thì sét dày gấp đôi. */
export const THUNDER = { bolts: 2, rainBolts: 4 } as const;

export function thunderBolts(inRain: boolean): number {
	return inRain ? THUNDER.rainBolts : THUNDER.bolts;
}

/**
 * Chọn mục tiêu cho `n` tia sét của một nhịp, mỗi mục tiêu tối đa một tia: quái bị sét của mây này đánh ÍT lần hơn trước
 * (`struck` — sét rải khắp bầy qua các nhịp), cùng số lần thì quái ĐANG ƯỚT trước (Gọi Mưa → Lôi Vũ: sét ưu tiên quái ướt),
 * rồi gần tâm mây trước. Không có quái ướt thì tia vẫn rơi (vào quái khô gần tâm) — sét là đòn hệ Thuỷ, trúng là ướt.
 * Xếp "ít bị đánh" TRƯỚC "ướt" là cố ý: tia đã làm ướt con nào thì con đó thành "ướt"; xếp ướt trước thì dùng Lôi Vũ một mình
 * lên bầy khô, mọi nhịp dồn vào đúng mấy con trúng tia đầu (trước đây: 6 nhịp vào MỘT con, 4 con kia không trúng tia nào).
 * Trong mưa cả bầy đều ướt nên thứ tự này chỉ còn là rải đều — và mưa cho sét dày gấp đôi (`thunderBolts`). Trả chỉ số.
 */
export function pickBolts(targets: readonly { x: number; y: number; wet: boolean; struck?: number }[], cx: number, cy: number, n: number): number[] {
	const d = (i: number) => Math.hypot(targets[i]!.x - cx, (targets[i]!.y - cy) / GROUND_SQUASH);
	const dry = (i: number) => (targets[i]!.wet ? 0 : 1);
	const all = targets.map((_, i) => i).sort((a, b) => (targets[a]!.struck ?? 0) - (targets[b]!.struck ?? 0) || dry(a) - dry(b) || d(a) - d(b));
	return all.slice(0, Math.max(0, n));
}

/**
 * Điểm rơi (độ lệch so với tâm) của mưa nhiều điểm (Mưa Băng, Lở Đá): phủ đều vùng tròn bán kính `r` trên mặt đất theo kiểu
 * hoa hướng dương (cố định — không ngẫu nhiên, test đo được), rồi đổi thứ tự rơi theo bước nhảy nguyên tố cùng nhau với
 * `n` để viên sau rơi chỗ khác hẳn viên trước chứ không xoáy dần từ tâm ra.
 */
export function scatterPoints(n: number, r: number): { x: number; y: number }[] {
	const golden = Math.PI * (3 - Math.sqrt(5));
	const pts = Array.from({ length: n }, (_, i) => {
		const rr = r * Math.sqrt((i + 0.5) / n);
		const th = i * golden;
		return { x: rr * Math.cos(th), y: rr * Math.sin(th) * GROUND_SQUASH };
	});
	const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
	const step = [7, 5, 3, 11, 13].find((k) => gcd(k, n) === 1 && k < n) ?? 1;
	return pts.map((_, i) => pts[(i * step) % n]!);
}

/**
 * Thêm làm chậm (Trọng Lực): giữ mức chậm MẠNH hơn đang có (Bùn Lầy còn 30% không bị 80% đè lên), cùng mức thì lấy thời
 * lượng dài hơn, yếu hơn thì thay luôn. Sửa tại chỗ.
 */
export function addSlow(s: { slow?: number; slowMult?: number }, seconds: number, mult: number): void {
	const active = (s.slow ?? 0) > 0;
	const cur = s.slowMult ?? 1;
	if (active && cur < mult) return;
	s.slow = active && cur === mult ? Math.max(s.slow ?? 0, seconds) : seconds;
	s.slowMult = mult;
}

/** Tỉ lệ đánh trượt của quái: lấy mức CAO hơn giữa Bão Cát (`sand`, trạng thái `miss`) và Gió Loạn (`gust`, trạng thái `daze`). */
export function missChance(s: { miss?: number; daze?: number }, sand: number, gust: number): number {
	return Math.max((s.miss ?? 0) > 0 ? sand : 0, (s.daze ?? 0) > 0 ? gust : 0);
}

// ———————————————————————————— GĐ3 lượt B: Kiếm 3 lưu phái mốc 6–9 ————————————————————————————

/**
 * Đỡ / né "ĐÚNG LÚC" (Phản Đòn — Thủy Thần 7) và cửa sổ sau khi đỡ (Xoáy Nước — Thủy Thần 8). Dùng chung đường đi của đòn
 * quái `CombatSystem.incoming` + thế đỡ `guardOutcome`:
 * - `perfect`: NÉ đúng lúc = đòn quái chạm người trong chừng này giây kể từ lúc bấm né. Thế Tĩnh: đòn chạm trong chừng này
 *   giây ĐẦU của thế. Lưu Thủy Phản: cửa sổ đỡ của nó vốn ngắn (0,6s) — đỡ trúng là đúng lúc.
 *   0,12s chứ không 0,3s: đà đánh của quái 0,3s và i-frame cú lăn 0,32s — cửa sổ 0,3s thì cú né NÀO gặp đòn cũng là "đúng
 *   lúc", bấm né liên tục không cần canh nhịp cũng phản được gần hết (đo: Thủy Thần 9 + Phong 7 giữa 6 quái 40 giây không
 *   xuống dưới 85% máu). 0,12s = phải bấm trong ~1/3 cuối của đà đánh; trúng ngoài cửa sổ (còn trong i-frame) vẫn không mất
 *   máu, chỉ không có nhát phản.
 * - `after`: Xoáy Nước tung trong chừng này giây sau một lần đỡ / gạt / phản thành công thì mạnh hơn (`SkillDef.afterGuard`).
 */
export const COUNTER = { perfect: 0.12, after: 2.5 } as const;

/** Đòn chạm lúc `since` giây sau khi vào thế / bấm né có tính là "đúng lúc" không. */
export function perfectTiming(kind: GuardKind | 'dodge', since: number): boolean {
	if (kind === 'parry') return since >= 0;
	return since >= 0 && since <= COUNTER.perfect + 1e-9;
}

/** Thế Áp Đảo (Kiếm Thần 7): hệ số sát thương đòn Kiếm sau `stacks` nhát trúng liên tiếp (kẹp ở `max` lần). */
export function pressBonus(stacks: number, step: number, max: number): number {
	return 1 + step * Math.max(0, Math.min(max, Math.floor(stacks)));
}

/** Bất Khuất (Kiếm Thần 9): đang dưới ngưỡng máu chưa (còn sống — gục rồi thì thôi). */
export function lowHp(hp: number, hpMax: number, threshold: number): boolean {
	return hp > 0 && hpMax > 0 && hp < hpMax * threshold;
}

/** Vận tốc bay thẳng tới (tx, ty) từ (x, y) ở tốc `speed` — đạn phản (Gương Băng) bay về kẻ bắn, Phi Kiếm bay về tay. */
export function aimVelocity(x: number, y: number, tx: number, ty: number, speed: number): { vx: number; vy: number } {
	const dx = tx - x;
	const dy = ty - y;
	const len = Math.hypot(dx, dy) || 1;
	return { vx: (dx / len) * speed, vy: (dy / len) * speed };
}

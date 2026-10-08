import { wieldOf } from '@aether/sim/moves';
import type { AnimationName, CharacterManifestEntry } from '../assets/AssetManifest';

/**
 * Mốc thời gian của một động tác ra đòn (giây, tính từ lúc bấm). Một đồng hồ duy nhất là dt của game:
 * khung hình nhân vật, khung chạm (sát thương/đạn) và hit-stop cùng chạy theo nó nên luôn trùng nhau.
 */
export interface ActionTiming {
	fps: number;
	/** Số frame thật của động tác (theo hướng đang vung). */
	n: number;
	/** Bắt đầu khung chạm: hiệu ứng của đòn áp ra ở mốc này. */
	releaseAt: number;
	/** Khung chạm hiện trọn 1 frame rồi mới cho đòn kế / di chuyển cắt ngang. */
	cancelAt: number;
	dur: number;
}

/** Dung sai so mốc: cộng dồn 1/60 giây 24 lần ra 0,3999… — không có nó động tác dài thêm một frame. */
export const ACTION_EPS = 1e-6;

/** Chừa khe giữa hai đòn liên tiếp khi giữ phím: động tác luôn xong TRƯỚC khi hồi chiêu kịp sẵn sàng (khe đó đứng ở frame cuối — `HOLD_LINGER` của CombatSystem). */
const COOLDOWN_GAP = 0.02;

/** Frame tung đòn mặc định khi spec chưa khai `hitFrame`: kiếm vào thế ~1/3, phép (niệm / phóng / gọi…) đẩy tay ~3/8 chu kỳ. */
export function defaultHitFrame(anim: AnimationName, n: number): number {
	return Math.round(wieldOf(anim) === 'magic' ? (n * 3) / 8 : n / 3);
}

/**
 * Suy mốc thời gian từ manifest. Không có animation (atlas chưa vẽ) → null: đòn nổ ngay, không có động tác.
 * `frameCount` = số frame thật của hướng đang dùng (ưu tiên hơn `frames` trong manifest, vốn lấy hướng nhiều nhất).
 * Động tác dài hơn hồi chiêu thì co cả ba mốc theo cùng hệ số — giữ phím đánh liên tục không bao giờ khoá chồng.
 */
export function timingFor(entry: Pick<CharacterManifestEntry, 'animations'>, anim: AnimationName, cooldown: number, frameCount?: number): ActionTiming | null {
	const spec = entry.animations[anim];
	const n = frameCount ?? spec?.frames ?? 0;
	if (!spec || !(n > 0) || !(spec.fps > 0)) return null;
	const hit = Math.max(0, Math.min(n - 1, spec.hitFrame ?? defaultHitFrame(anim, n)));
	let fps = spec.fps;
	const room = cooldown - COOLDOWN_GAP;
	if (Number.isFinite(room) && room > 0 && n / fps > room) fps = n / room;
	return { fps, n, releaseAt: hit / fps, cancelAt: (hit + 1) / fps, dur: n / fps };
}

/** Frame cần hiện ở thời điểm `t` của động tác (đứng ở frame cuối nếu `t` vượt quá). */
export function frameAt(t: number, timing: ActionTiming): number {
	return Math.max(0, Math.min(timing.n - 1, Math.floor((t + ACTION_EPS) * timing.fps)));
}

/**
 * Nhịp đòn của QUÁI. Khác người chơi: quái giữ nguyên thời gian lấy đà cũ (cửa sổ né của người chơi), động tác
 * phải co/giãn để khung chạm (`hitFrame`) hiện ĐÚNG lúc đòn nổ. Pha vào thế (frame 0 → hitFrame) kéo giãn theo
 * `windup`; pha thu thế chạy đúng fps vẽ — giãn cả động tác thì đà 0,22s với hitFrame 1 sẽ thu thế lê thê.
 */
export interface StrikePlan {
	/** Nhịp gốc của động tác (fps của manifest) — thứ CharacterView phát; đồng hồ đưa vào qua `strikeClock`. */
	timing: ActionTiming;
	/** Giây game từ lúc bắt đầu vung tới khung chạm = lúc đòn nổ. Không bao giờ ngắn hơn đà cũ. */
	windup: number;
	/**
	 * Đà dài hơn pha vào thế kéo chậm tối đa (`STRIKE_MAX_SLOWDOWN`) thì phần dư đứng chờ ở frame 0 TRƯỚC khi vào thế —
	 * không kéo cả pha vào thế thành chiếu chậm rồi giật về nhịp gốc ở pha thu thế. 0 = vào thế ngay.
	 */
	lead: number;
	/**
	 * Tới mốc này (giây game) quái vẫn nháy trắng báo đòn dù có động tác: đoạn đứng chờ `lead` (frame 0 thường gần như
	 * dáng đứng), hoặc cả đà khi pha vào thế chỉ có 1 frame (dáng vung không tự báo được gì). 0 = dáng vung đủ báo hiệu.
	 */
	cueUntil: number;
	/** Giây game tới lúc khung chạm hiện trọn 1 frame — trước mốc này quái đứng yên, sau mốc này đi được (cắt thu thế). */
	cancelAt: number;
	/** Giây game của cả động tác. */
	dur: number;
}

/** Pha vào thế của quái được phát NHANH tối đa chừng này lần nhịp vẽ; nhanh hơn thì giãn đà ra (không bao giờ rút ngắn đà). */
export const STRIKE_MAX_SPEEDUP = 2;
/** …và CHẬM tối đa chừng này lần; đà còn dài hơn thì phần dư đứng chờ ở frame 0 (kèm nháy báo đòn) — xem `StrikePlan.lead`. */
export const STRIKE_MAX_SLOWDOWN = 2;

/**
 * Khung chạm mặc định cho đòn QUÁI khi spec không khai (hoặc khai 0): như người chơi (~1/3 chu kỳ) nhưng có ≥ 2 frame
 * vào thế khi động tác đủ dài (n ≥ 4) — PixelLab vẽ attack 4 frame thì round(4/3) = 1, cả đà chỉ còn frame 0.
 */
export function enemyHitFrame(n: number): number {
	return Math.min(n - 1, Math.max(n >= 4 ? 2 : 1, defaultHitFrame('attack', n)));
}

/**
 * Lập nhịp đòn quái từ manifest. null = không có attack / chỉ 1 frame → giữ cách cũ (đứng nháy trắng + giật).
 * `hitFrame` = 0 (khai thiếu hoặc vẽ đòn không vào thế) thì lấy `enemyHitFrame` (≥ 1, ≥ 2 khi n ≥ 4): khung chạm
 * phải có frame vào thế đứng trước, không thì cả đà chỉ là một frame đứng im rồi đòn nổ — đúng cái "giật" muốn bỏ.
 * Chỉ còn 1 frame vào thế (n = 2–3) thì `cueUntil` giữ nháy báo đòn suốt đà.
 */
export function strikePlan(entry: Pick<CharacterManifestEntry, 'animations'>, windup: number, frameCount?: number): StrikePlan | null {
	const spec = entry.animations.attack;
	const n = frameCount ?? spec?.frames ?? 0;
	if (!spec || !(spec.fps > 0) || !(n >= 2) || !(windup > 0)) return null;
	const declared = spec.hitFrame !== undefined ? Math.floor(spec.hitFrame) : 0;
	const hit = declared >= 1 ? Math.min(n - 1, declared) : enemyHitFrame(n);
	const fps = spec.fps;
	const releaseAt = hit / fps;
	const w = Math.max(windup, releaseAt / STRIKE_MAX_SPEEDUP);
	const lead = Math.max(0, w - releaseAt * STRIKE_MAX_SLOWDOWN);
	return {
		timing: { fps, n, releaseAt, cancelAt: (hit + 1) / fps, dur: n / fps },
		windup: w,
		lead,
		cueUntil: hit < 2 ? w : lead,
		cancelAt: w + 1 / fps,
		dur: w + (n - hit) / fps,
	};
}

/**
 * Giây game `t` (tính từ lúc bắt đầu vung) → thời điểm trong động tác. Đứng ở frame 0 suốt `lead`, rồi vào thế đều
 * tới `windup` (cùng dung sai với điều kiện nổ đòn của CombatSystem) là đúng mốc khung chạm, sau đó chạy 1:1.
 */
export function strikeClock(plan: StrikePlan, t: number): number {
	if (t + ACTION_EPS >= plan.windup) return plan.timing.releaseAt + Math.max(0, t - plan.windup);
	const u = Math.max(0, t - plan.lead);
	return (u * plan.timing.releaseAt) / (plan.windup - plan.lead);
}

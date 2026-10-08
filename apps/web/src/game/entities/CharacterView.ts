import { AnimatedSprite } from 'pixi.js';
import type { ActionName, AnimationName, CharacterManifestEntry, CharacterTextures, Direction } from '../assets/AssetManifest';
import { ACTION_EPS, frameAt, strikePlan, timingFor, type ActionTiming, type StrikePlan } from './actionClock';

/** Tốc độ di chuyển (px/giây) mà nhịp walk ở fps gốc khớp bước chân — đi nhanh/chậm hơn thì phát nhanh/chậm theo tỉ lệ. */
export const WALK_SPEED_REFERENCE = 78;

interface PlayingAction {
	anim: ActionName;
	dir: Direction;
	t: number;
	timing: ActionTiming;
	/** true: CombatSystem lái đồng hồ (`seekAction`); false: tự chạy theo `update(dt)` (người chơi khác). */
	external: boolean;
}

/**
 * Phần HIỂN THỊ của một nhân vật: đổi animation/hướng mà không dựng lại sprite (không rác GC).
 * Khung hình chạy theo dt của GAME (không theo Ticker của Pixi): hit-stop khựng cả chân lẫn vị trí (riêng người
 * chơi ĐANG ĐI thì Game đưa dt thật — bước chân không khựng mỗi nhát trúng), `step()` của hook QA đẩy được frame. Động tác một lần (vung kiếm, niệm phép) đè lên trạng thái nền (đứng/đi) —
 * trong lúc đó `set()` chỉ ghi nhớ nền, hết động tác thì trở về nền.
 */
export class CharacterView {
	readonly sprite: AnimatedSprite;
	private anim: AnimationName = 'idle';
	private dir: Direction = 'S';
	private speedScale = 1;
	/** Vị trí trong chu kỳ lặp, đơn vị frame (số thực). */
	private phase = 0;
	private base: { anim: AnimationName; dir: Direction; speedScale: number } = { anim: 'idle', dir: 'S', speedScale: 1 };
	private action: PlayingAction | null = null;

	constructor(private readonly textures: CharacterTextures) {
		this.sprite = new AnimatedSprite({ textures: textures.frames('idle', 'S'), autoUpdate: false });
		this.sprite.anchor.set(textures.entry.anchor.x, textures.entry.anchor.y);
		this.sprite.updateAnchor = false;
		this.sprite.gotoAndStop(0);
	}

	get displayName(): string {
		return this.textures.entry.displayName;
	}

	get entry(): CharacterManifestEntry {
		return this.textures.entry;
	}

	/** Chiều cao hình (px). Mọi mốc treo tên, tâm bắn phép, vùng trúng đòn tính theo số này. */
	get height(): number {
		return this.textures.entry.bodyHeight ?? 96;
	}

	/** Animation đang HIỆN (kể cả attack/cast). */
	get animation(): AnimationName {
		return this.anim;
	}

	/** Trạng thái nền (idle/walk/run) — thứ gửi qua mạng; động tác đi bằng tin riêng. */
	get baseAnimation(): AnimationName {
		return this.action ? this.base.anim : this.anim;
	}

	get direction(): Direction {
		return this.dir;
	}

	get busy(): boolean {
		return this.action !== null;
	}

	/** Động tác đang phát đã qua mốc huỷ (khung chạm đã hiện trọn) — cắt lúc này không mất nhát vung. */
	get actionCancellable(): boolean {
		const a = this.action;
		return !!a && a.t + ACTION_EPS >= a.timing.cancelAt;
	}

	/** `speedScale` > 1 khi nhân vật thiếu animation chạy: phát nhanh chu kỳ đi thay thế. */
	set(anim: AnimationName, dir: Direction, speedScale = 1): void {
		// Gọi mỗi frame: sửa tại chỗ, không tạo object mới.
		const b = this.base;
		b.anim = this.resolve(anim);
		b.dir = dir;
		b.speedScale = speedScale;
		if (this.action) return;
		this.show(this.base.anim, dir, speedScale);
	}

	update(dt: number): void {
		const a = this.action;
		if (a) {
			if (!a.external) this.seekAction(a.t + dt);
			return;
		}
		const total = this.sprite.totalFrames;
		const fps = this.textures.entry.animations[this.anim]?.fps ?? 8;
		this.phase = (this.phase + dt * fps * this.speedScale) % total;
		this.applyPhase();
	}

	/** Mốc thời gian của động tác cho hướng `dir`; null = hướng đó chưa vẽ (dùng phương án dự phòng). */
	actionTiming(anim: ActionName, dir: Direction, cooldown: number): ActionTiming | null {
		const frames = this.textures.actionFrames(anim, dir);
		return frames ? timingFor(this.textures.entry, anim, cooldown, frames.length) : null;
	}

	/** Nhịp đòn của quái cho hướng `dir` (khung chạm khớp đúng `windup` giây); null = hướng đó chưa vẽ attack. */
	strikePlan(dir: Direction, windup: number): StrikePlan | null {
		const frames = this.textures.actionFrames('attack', dir);
		return frames ? strikePlan(this.textures.entry, windup, frames.length) : null;
	}

	/** Bắt đầu động tác một lần. false = atlas chưa có hướng này, không đổi gì. */
	playAction(anim: ActionName, dir: Direction, opts: { timing: ActionTiming; external: boolean }): boolean {
		const frames = this.textures.actionFrames(anim, dir);
		if (!frames) return false;
		this.action = { anim, dir, t: 0, timing: opts.timing, external: opts.external };
		this.anim = anim;
		this.dir = dir;
		this.base.dir = dir;
		this.sprite.textures = frames;
		this.sprite.gotoAndStop(0);
		return true;
	}

	/** Đưa động tác tới thời điểm `t` (giây); hết động tác thì tự trở về trạng thái nền. */
	seekAction(t: number): void {
		const a = this.action;
		if (!a) return;
		a.t = t;
		if (t + ACTION_EPS >= a.timing.dur) return this.endAction();
		const f = Math.min(this.sprite.totalFrames - 1, frameAt(t, a.timing));
		if (f !== this.sprite.currentFrame) this.sprite.gotoAndStop(f);
	}

	endAction(): void {
		if (!this.action) return;
		this.action = null;
		this.show(this.base.anim, this.base.dir, this.base.speedScale);
	}

	/** Huỷ giữa chừng (bị ngắt, né, đổi sprite): hình trở về nền ngay. */
	cancelAction(): void {
		this.endAction();
	}

	private show(target: AnimationName, dir: Direction, speedScale: number): void {
		this.speedScale = speedScale;
		if (target === this.anim && dir === this.dir) return;
		// Đổi hướng giữa chừng bước đi thì giữ nhịp chân (giữ `phase`), đổi animation thì về frame 0.
		if (target !== this.anim) this.phase = 0;
		this.anim = target;
		this.dir = dir;
		this.sprite.textures = this.textures.frames(target, dir);
		this.sprite.gotoAndStop(0);
		this.applyPhase();
	}

	private applyPhase(): void {
		const f = Math.floor(this.phase) % this.sprite.totalFrames;
		if (f !== this.sprite.currentFrame) this.sprite.gotoAndStop(f);
	}

	private resolve(anim: AnimationName): AnimationName {
		if (this.textures.has(anim)) return anim;
		if (anim === 'run' && this.textures.has('walk')) return 'walk';
		return 'idle';
	}
}

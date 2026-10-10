import { AnimatedSprite } from 'pixi.js';
import type { ActionName, AnimationName, CharacterManifestEntry, CharacterTextures, Direction, HeldArt } from '../assets/AssetManifest';
import { heldAction, heldAnimation, isHeldBodyAction } from '../gearArt';
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
 * Đang cầm vũ khí vẽ liền thân (`setHeld`): nền đứng / đi HIỆN bằng bản cầm món đó (`idlesword`…) nếu atlas có — `base.anim`
 * vẫn là tên gốc (idle / walk / run) vì đó là thứ gửi qua mạng; máy người xem tự chọn bản cầm theo đồ người kia mặc. Động tác
 * thân (trúng đòn, lướt, gục, đứng dậy, uống bình) cũng vậy: gọi bằng tên gốc (`hit`…), hiện bản cầm (`hitsword`…) nếu atlas có
 * hướng đó — người chơi mình lẫn người chơi khác (tin `action` vẫn mang tên gốc).
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
	private held: HeldArt | null = null;
	/** Bản đứng / đi theo vũ khí đang cầm — tính một lần lúc đổi món (`set()` chạy mỗi khung, không tra atlas mỗi khung). */
	private heldIdle: AnimationName = 'idle';
	private heldWalk: AnimationName = 'walk';

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

	/** Trạng thái nền (idle/walk/run, KHÔNG kèm hậu tố vũ khí) — thứ gửi qua mạng; động tác đi bằng tin riêng. */
	get baseAnimation(): AnimationName {
		return this.base.anim;
	}

	/** Vũ khí vẽ liền thân đang cầm (null = tay không). */
	get heldArt(): HeldArt | null {
		return this.held;
	}

	/** Animation ĐỨNG đang dùng: bản cầm vũ khí nếu atlas có, không thì `idle` — kho đồ vẽ hình nhân vật bằng khung này. */
	get restingAnimation(): AnimationName {
		return this.withHeld('idle');
	}

	/**
	 * Đổi vũ khí đang cầm (`gearLayers.heldArt` theo đồ mặc + thế cầm). Đang đứng / đi thì đổi bản ngay, giữ nhịp chân; đang
	 * diễn động tác thì hết động tác mới hiện bản mới.
	 */
	setHeld(held: HeldArt | null): void {
		if (held === this.held) return;
		this.held = held;
		// Atlas chưa dựng bản cầm (máy cũ) thì giữ bản tay không.
		const pick = (base: 'idle' | 'walk'): AnimationName => {
			if (!held) return base;
			const anim = heldAnimation(base, held);
			return this.textures.has(anim) ? anim : base;
		};
		this.heldIdle = pick('idle');
		this.heldWalk = pick('walk');
		if (!this.action) this.show(this.withHeld(this.base.anim), this.base.dir, this.base.speedScale, true);
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
		this.show(this.withHeld(b.anim), dir, speedScale);
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

	/** Atlas đã vẽ động tác `anim` cho hướng `dir` (hoặc hướng kề) — chưa có thì skill dùng động tác sẵn có của nó. */
	hasAction(anim: ActionName, dir: Direction): boolean {
		return this.textures.actionFrames(this.actionArt(anim, dir), dir) !== null;
	}

	/** Mốc thời gian của động tác cho hướng `dir`; null = hướng đó chưa vẽ (dùng phương án dự phòng). */
	actionTiming(anim: ActionName, dir: Direction, cooldown: number): ActionTiming | null {
		const art = this.actionArt(anim, dir);
		const frames = this.textures.actionFrames(art, dir);
		// Bản cầm vũ khí cùng nhịp với bản tay không (spec khai cùng fps / hitFrame) — manifest chưa khai bản cầm thì lấy của bản gốc.
		return frames ? timingFor(this.textures.entry, this.textures.entry.animations[art] ? art : anim, cooldown, frames.length) : null;
	}

	/** Nhịp đòn của quái cho hướng `dir` (khung chạm khớp đúng `windup` giây); null = hướng đó chưa vẽ attack. */
	strikePlan(dir: Direction, windup: number): StrikePlan | null {
		const frames = this.textures.actionFrames('attack', dir);
		return frames ? strikePlan(this.textures.entry, windup, frames.length) : null;
	}

	/** Bắt đầu động tác một lần. false = atlas chưa có hướng này, không đổi gì. */
	playAction(anim: ActionName, dir: Direction, opts: { timing: ActionTiming; external: boolean }): boolean {
		const art = this.actionArt(anim, dir);
		const frames = this.textures.actionFrames(art, dir);
		if (!frames) return false;
		this.action = { anim, dir, t: 0, timing: opts.timing, external: opts.external };
		this.anim = art;
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
		this.show(this.withHeld(this.base.anim), this.base.dir, this.base.speedScale);
	}

	/** Huỷ giữa chừng (bị ngắt, né, đổi sprite): hình trở về nền ngay. */
	cancelAction(): void {
		this.endAction();
	}

	/** `keepPhase`: đổi bản cầm vũ khí giữa chừng (đi tay không → đi cầm kiếm cùng chu kỳ bước) — không giật về frame 0. */
	private show(target: AnimationName, dir: Direction, speedScale: number, keepPhase = false): void {
		this.speedScale = speedScale;
		if (target === this.anim && dir === this.dir) return;
		// Đổi hướng giữa chừng bước đi thì giữ nhịp chân (giữ `phase`), đổi animation thì về frame 0.
		if (target !== this.anim && !keepPhase) this.phase = 0;
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

	/** Bản cầm vũ khí của nền đứng / đi (`idle` → `idlesword`, chọn sẵn ở `setHeld`); động tác khác giữ nguyên. */
	private withHeld(anim: AnimationName): AnimationName {
		return anim === 'idle' ? this.heldIdle : anim === 'walk' ? this.heldWalk : anim;
	}

	/**
	 * Bản vẽ của động tác `anim` ở hướng `dir`: động tác thân lúc đang cầm vũ khí vẽ liền thân → bản cầm món đó (`hit` → `hitsword`)
	 * nếu atlas có hướng này (hoặc hướng kề); chưa vẽ / atlas cũ → bản tay không như trước. Động tác ra đòn vốn vẽ cầm vũ khí.
	 */
	private actionArt(anim: ActionName, dir: Direction): AnimationName {
		const held = this.held;
		if (!held || !isHeldBodyAction(anim)) return anim;
		const art = heldAction(anim, held);
		return this.textures.actionFrames(art, dir) ? art : anim;
	}
}

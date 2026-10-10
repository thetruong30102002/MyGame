import { Container, Graphics } from 'pixi.js';
import type { CharacterTextures, Direction, HeldArt } from '../assets/AssetManifest';
import { directionOf } from '../input/Keyboard';
import type { Wield } from '../gearArt';
import { heldArt, type GearPiece } from '../gearLayers';
import { CharacterView, WALK_SPEED_REFERENCE } from './CharacterView';
import { GearLayers } from './GearLayers';

export type Mover = (pos: { x: number; y: number }, dx: number, dy: number) => void;

export interface WanderArea {
	x: number;
	y: number;
	radius: number;
}

/**
 * Một thực thể trong thế giới: vị trí logic (số thực) + phần hiển thị (làm tròn về pixel nguyên).
 * AI lang thang ở đây là TẠM cho sân thử — Phase 7/11 đưa hành vi quái lên server authoritative.
 */
export class Actor {
	readonly root = new Container();
	readonly view: CharacterView;
	x: number;
	y: number;
	/** Tắt khi quái đang giao chiến — lúc đó CombatSystem điều khiển di chuyển. */
	wanderEnabled = true;
	/** Độ lệch hiển thị khi ra đòn/bị đánh (lao tới, giật lùi) — không đổi vị trí logic. */
	private kick = { x: 0, y: 0, t: 0 };
	private target: { x: number; y: number } | null = null;
	private restTimer: number;
	/** Lớp đồ gắn — chỉ dựng khi có món đầu tiên (quái/NPC không bao giờ có). */
	private gearLayers: GearLayers | null = null;
	private initialStance: Wield = 'melee';
	/** Đầu vào của lần chọn vũ khí vẽ liền thân gần nhất (`syncHeld`). */
	private heldFor: readonly GearPiece[] | null = null;
	private heldStance: Wield | null = null;

	constructor(
		readonly id: string,
		private readonly textures: CharacterTextures,
		x: number,
		y: number,
		facing: Direction,
		readonly wander: WanderArea | null,
		private readonly speed = 46,
	) {
		this.x = x;
		this.y = y;
		this.view = new CharacterView(textures);
		this.view.set('idle', facing);
		const shadow = new Graphics().ellipse(0, 0, 18, 6).fill({ color: 0x000000, alpha: 0.28 });
		this.root.addChild(shadow, this.view.sprite);
		this.restTimer = 1 + Math.random() * 3;
		this.sync();
	}

	get displayName(): string {
		return this.view.displayName;
	}

	get height(): number {
		return this.view.height;
	}

	/** Độ cao tâm thân (px trên chân): nơi phép bắn ra, nơi hiệu ứng trúng đòn hiện lên. */
	get chest(): number {
		return Math.round(this.view.height * 0.48);
	}

	update(dt: number, mover?: Mover): void {
		if (this.wander && this.wanderEnabled) this.think(dt, mover);
		this.view.update(dt);
		this.syncGear();
		this.sync(dt);
	}

	/**
	 * Đồ gắn đang mặc (vẽ lớp trước/sau thân theo hướng) — kiếm / trượng vẽ liền thân thì đổi luôn bản đứng / đi cầm món đó.
	 * Danh sách rỗng = gỡ hết lớp, đứng / đi tay không.
	 */
	setGear(pieces: readonly GearPiece[]): void {
		if (!this.gearLayers) {
			if (!pieces.length) return;
			this.gearLayers = new GearLayers(this.textures, this.view.sprite);
			this.gearLayers.stance = this.initialStance;
			this.root.addChildAt(this.gearLayers.behind, this.root.getChildIndex(this.view.sprite));
			this.root.addChild(this.gearLayers.front);
		}
		this.gearLayers.set(pieces);
		this.syncHeld();
	}

	get gear(): readonly GearPiece[] {
		return this.gearLayers?.current ?? [];
	}

	/** Thế cầm hiện tại (kiếm / gậy) — kho đồ vẽ cùng thế với nhân vật ngoài trận. */
	get gearStance(): Wield {
		return this.gearLayers?.stance ?? this.initialStance;
	}

	/** Đặt thế cầm (lúc dựng nhân vật: theo con đường); sau đó tự đổi theo động tác chém / niệm. */
	setGearStance(stance: Wield): void {
		this.initialStance = stance;
		if (this.gearLayers) {
			this.gearLayers.stance = stance;
			this.gearLayers.sync();
		}
		this.syncHeld();
	}

	/**
	 * Đặt lại lớp đồ theo khung đang hiện (thế cầm đổi theo động tác chém / niệm vừa hiện) rồi chọn vũ khí vẽ liền thân đang cầm —
	 * gọi mỗi khung, và sau khi CombatSystem tua động tác (`seekAction`) trong cùng khung hình.
	 */
	syncGear(): void {
		this.gearLayers?.sync();
		this.syncHeld();
	}

	/** Vũ khí vẽ liền thân đang cầm (null = tay không) — kho đồ vẽ hình nhân vật cùng bản. */
	get held(): HeldArt | null {
		return this.view.heldArt;
	}

	/** Chạy mỗi khung: chỉ tính lại khi danh sách đồ (mảng mới mỗi lần đổi) hoặc thế cầm đổi. */
	private syncHeld(): void {
		const g = this.gearLayers;
		const pieces = g?.current ?? null;
		const stance = g?.stance ?? null;
		if (pieces === this.heldFor && stance === this.heldStance) return;
		this.heldFor = pieces;
		this.heldStance = stance;
		this.view.setHeld(g ? heldArt(g.current, g.stance) : null);
	}

	/** Lao `px` pixel theo hướng (dx, dy) rồi tự về chỗ trong ~0.12s — chỉ còn dùng cho quái (người chơi có động tác thật). */
	lunge(dx: number, dy: number, px: number): void {
		const len = Math.hypot(dx, dy) || 1;
		this.kick = { x: (dx / len) * px, y: (dy / len) * px * 0.6, t: 0.12 };
	}

	sync(dt = 0): void {
		this.kick.t = Math.max(0, this.kick.t - dt);
		const k = this.kick.t / 0.12;
		this.root.position.set(Math.round(this.x + this.kick.x * k), Math.round(this.y + this.kick.y * k));
		this.root.zIndex = Math.round(this.y);
	}

	private think(dt: number, mover?: Mover): void {
		const area = this.wander!;
		if (!this.target) {
			this.restTimer -= dt;
			if (this.restTimer > 0) return;
			const a = Math.random() * Math.PI * 2;
			const r = Math.sqrt(Math.random()) * area.radius;
			this.target = { x: area.x + Math.cos(a) * r, y: area.y + Math.sin(a) * r };
		}
		const dx = this.target.x - this.x;
		const dy = this.target.y - this.y;
		const dist = Math.hypot(dx, dy);
		if (dist < 2) {
			this.target = null;
			this.restTimer = 1.5 + Math.random() * 3.5;
			this.view.set('idle', this.view.direction);
			return;
		}
		const step = Math.min(dist, this.speed * dt);
		const before = { x: this.x, y: this.y };
		if (mover) mover(this, (dx / dist) * step, (dy / dist) * step);
		else {
			this.x += (dx / dist) * step;
			this.y += (dy / dist) * step;
		}
		// Bị chặn (đụng cây/đá) thì bỏ đích này, nghỉ rồi chọn đích khác.
		if (Math.hypot(this.x - before.x, this.y - before.y) < step * 0.2) {
			this.target = null;
			this.restTimer = 0.5 + Math.random();
			this.view.set('idle', this.view.direction);
			return;
		}
		this.view.set('walk', directionOf(dx, dy), this.speed / WALK_SPEED_REFERENCE);
	}
}

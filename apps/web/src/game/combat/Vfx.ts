import { Assets, Container, Sprite, type Spritesheet, type Texture } from 'pixi.js';

export type VfxId =
	| 'fire_burst'
	| 'fire_flash'
	| 'fire_ring'
	| 'fire_orb'
	| 'flame'
	| 'water_splash'
	| 'water_ring'
	| 'water_wave'
	| 'wind_spin'
	| 'wind_burst'
	| 'frost'
	| 'steam'
	| 'ice_shard'
	| 'ice_burst'
	| 'arcane_burst'
	| 'arcane_orb'
	| 'sparkle'
	| 'crit_flash'
	| 'slash'
	| 'magic_circle'
	| 'dark_ring'
	| 'dark_ring_warn'
	| 'shadow'
	| 'dark_orb'
	| 'light_pillar'
	| 'dust'
	| 'blood_hit'
	| PendingVfxId;

/**
 * Hiệu ứng skill lớn ĐÃ KHAI ở pipeline (`packages/asset-pipeline/src/vfx/buildVfx.ts`) nhưng PixelLab chưa vẽ xong —
 * atlas chưa có thì `frames()` rỗng, bên gọi rơi về hình tạm (`tempArt.TEMP_ART`). Có bản vẽ thì tự dùng, không sửa code.
 */
export type PendingVfxId = 'ice_pillar' | 'ice_rain' | 'rain_cloud' | 'lightning_strike' | 'tornado' | 'meteor' | 'rock_spikes';

export interface VfxOptions {
	fps?: number;
	rotation?: number;
	tint?: number;
	/** 'add' cho lửa/phép sáng: cộng màu lên nền thay vì phủ — ra cảm giác phát sáng. */
	blend?: 'normal' | 'add';
	/**
	 * 'ground': dưới chân mọi nhân vật. 'top' (mặc định): đè lên mọi nhân vật. 'world': xếp chiều sâu CHUNG với nhân vật
	 * (theo `depthY`) — vật đứng lâu trên mặt đất (khối đá của Tường Đá, ngọn lửa của Tường Lửa): quái đứng trước tường (gần
	 * camera) vẽ đè lên tường, đứng sau thì bị tường che. Chưa gắn lớp chung (`Vfx.world`) thì rơi về 'top'.
	 */
	layer?: 'ground' | 'top' | 'world';
	/** Lớp 'world': mốc xếp chiều sâu (y của CHÂN vật trên mặt đất) — thiếu = y vẽ. */
	depthY?: number;
	flipX?: boolean;
	/**
	 * Lật theo trục Y CỦA SPRITE (trước khi xoay). Vệt chém đổi chiều vung dùng cờ này: xoay θ rồi lật Y = gương qua
	 * hướng đánh, bụng vệt vẫn quay về phía trước; lật X thì bụng quay ngược vào người đánh.
	 */
	flipY?: boolean;
	alpha?: number;
	/** Nhân NGUYÊN (giữ lưới pixel). */
	scale?: number;
	/** Ép dẹt / kéo dài: nhân NGUYÊN riêng từng trục (thay `scale` của trục đó). */
	scaleX?: number;
	scaleY?: number;
	/** Lặp các frame cho tới hết chừng này giây (vùng tồn tại: lốc, mặt băng…). Thiếu = phát một lượt rồi tắt. */
	duration?: number;
	/** Cùng `duration`: phát MỘT lượt rồi đứng ở frame cuối tới hết `duration` (tường đá, mây đứng yên) thay vì lặp. */
	stay?: boolean;
	/** Neo theo một vật đang di chuyển (vd vòng phép dưới chân người chơi). */
	follow?: { x: number; y: number };
	followOffset?: { x: number; y: number };
}

interface Playing {
	sprite: Sprite;
	frames: Texture[];
	t: number;
	fps: number;
	x: number;
	y: number;
	follow?: { x: number; y: number };
	off: { x: number; y: number };
	layer: Container;
	/** Lớp 'world': mốc chiều sâu cố định (lệch so với y vẽ — vật bám người thì dời theo). */
	depthOff: number | null;
	/** Giây phải lặp tới (`VfxOptions.duration`); 0 = một lượt. */
	until: number;
	/** Hết frame thì đứng ở frame cuối (tới `until`) thay vì lặp. */
	stay: boolean;
}

/**
 * Phát hiệu ứng dựng sẵn (`assets/vfx/vfx.json`, sinh bởi `npm run assets:vfx`). Sprite dùng pool,
 * frame chạy theo đồng hồ GAME (truyền dt vào `update`) — hit-stop làm chậm game thì hiệu ứng cũng
 * khựng theo, đúng cảm giác "nặng tay".
 */
export class Vfx {
	readonly ground = new Container();
	readonly top = new Container();
	/** Lớp chung với nhân vật (Game gắn container thực thể — có `sortableChildren`, zIndex = y chân). null = dùng `top`. */
	world: Container | null = null;
	private sheet: Spritesheet | null = null;
	private readonly free: Sprite[] = [];
	private readonly playing: Playing[] = [];

	async load(): Promise<void> {
		this.sheet = await Assets.load<Spritesheet>('/assets/vfx/vfx.json');
	}

	frames(id: VfxId): Texture[] {
		return this.sheet?.animations[id] ?? [];
	}

	play(id: VfxId, x: number, y: number, o: VfxOptions = {}): void {
		const frames = this.frames(id);
		if (!frames.length || this.playing.length > 220) return;
		const layer = o.layer === 'ground' ? this.ground : o.layer === 'world' && this.world ? this.world : this.top;
		const sprite = this.free.pop() ?? new Sprite();
		sprite.anchor.set(0.5);
		sprite.texture = frames[0]!;
		sprite.rotation = o.rotation ?? 0;
		sprite.tint = o.tint ?? 0xffffff;
		sprite.blendMode = o.blend === 'add' ? 'add' : 'normal';
		sprite.alpha = o.alpha ?? 1;
		const s = Math.max(1, Math.round(o.scale ?? 1));
		const sx = Math.max(1, Math.round(o.scaleX ?? s));
		const sy = Math.max(1, Math.round(o.scaleY ?? s));
		sprite.scale.set(o.flipX ? -sx : sx, o.flipY ? -sy : sy);
		sprite.visible = true;
		layer.addChild(sprite);
		const off = o.followOffset ?? { x: 0, y: 0 };
		const depthOff = layer === this.world ? (o.depthY ?? y) - y : null;
		const p: Playing = { sprite, frames, t: 0, fps: o.fps ?? 18, x, y, follow: o.follow, off, layer, depthOff, until: o.duration ?? 0, stay: !!o.stay };
		this.place(p);
		this.playing.push(p);
	}

	/**
	 * `holdTimed`: trận đang đứng (thoại / thẻ / bảng Nhân vật mở — `CombatSystem.update(frozen)`): hình có thời lượng (tường,
	 * mây, khiên, vùng — `duration`) đứng yên theo đồng hồ trận; chỉ hình phát một lượt chạy nốt. Không thì mở bảng 8 giây là
	 * khối đá đã tan mà tường (logic) còn chặn thêm 7 giây.
	 */
	update(dt: number, holdTimed = false): void {
		for (let i = this.playing.length - 1; i >= 0; i -= 1) {
			const p = this.playing[i]!;
			if (holdTimed && p.until > 0) {
				this.place(p);
				continue;
			}
			p.t += dt;
			const raw = Math.floor(p.t * p.fps);
			const f = p.until > 0 ? (p.stay ? Math.min(raw, p.frames.length - 1) : raw % p.frames.length) : raw;
			if (p.until > 0 ? p.t >= p.until : f >= p.frames.length) {
				this.release(i);
				continue;
			}
			p.sprite.texture = p.frames[f]!;
			this.place(p);
		}
	}

	/** Gỡ mọi hình đang phát (đổi map: tường / mây / lốc của map cũ không được hiện tiếp ở toạ độ cũ trên map mới). */
	clear(): void {
		for (let i = this.playing.length - 1; i >= 0; i -= 1) this.release(i);
	}

	private release(i: number): void {
		const p = this.playing[i]!;
		p.sprite.visible = false;
		p.layer.removeChild(p.sprite);
		p.sprite.zIndex = 0;
		this.free.push(p.sprite);
		this.playing[i] = this.playing[this.playing.length - 1]!;
		this.playing.pop();
	}

	private place(p: Playing): void {
		const x = p.follow ? p.follow.x + p.off.x : p.x;
		const y = p.follow ? p.follow.y + p.off.y : p.y;
		p.sprite.position.set(Math.round(x), Math.round(y));
		if (p.depthOff !== null) p.sprite.zIndex = Math.round(y + p.depthOff);
		else if (p.layer === this.top) p.sprite.zIndex = y + 200;
	}
}

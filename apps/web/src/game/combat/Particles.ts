import { Container, Sprite, type Texture } from 'pixi.js';

interface Particle {
	sprite: Sprite;
	/** Vị trí số thực; sprite chỉ nhận bản làm tròn — làm tròn dồn mỗi frame sẽ nuốt mất chuyển động chậm. */
	x: number;
	y: number;
	vx: number;
	vy: number;
	life: number;
	maxLife: number;
	gravity: number;
}

/**
 * Hạt hiệu ứng dùng chung một pool sprite: tạo trước, tái sử dụng, không `new` trong lúc đánh nhau
 * (đỡ rác GC → không khựng frame khi nhiều phép nổ cùng lúc).
 */
export class Particles {
	readonly layer = new Container();
	private readonly free: Sprite[] = [];
	private readonly alive: Particle[] = [];

	constructor(prewarm = 400) {
		for (let i = 0; i < prewarm; i += 1) this.free.push(this.make());
	}

	burst(x: number, y: number, textures: Texture[], count: number, speed: number, opts: { gravity?: number; life?: number; up?: number } = {}): void {
		for (let i = 0; i < count; i += 1) {
			const a = Math.random() * Math.PI * 2;
			const v = speed * (0.4 + Math.random() * 0.6);
			this.spawn(x, y, textures[i % textures.length]!, Math.cos(a) * v, Math.sin(a) * v * 0.6 - (opts.up ?? 0), opts.life ?? 0.45, opts.gravity ?? 0);
		}
	}

	spawn(x: number, y: number, texture: Texture, vx: number, vy: number, life: number, gravity = 0): void {
		if (this.alive.length > 900) return;
		const sprite = this.free.pop() ?? this.make();
		sprite.texture = texture;
		sprite.position.set(Math.round(x), Math.round(y));
		sprite.alpha = 1;
		sprite.visible = true;
		this.alive.push({ sprite, x, y, vx, vy, life, maxLife: life, gravity });
	}

	update(dt: number): void {
		for (let i = this.alive.length - 1; i >= 0; i -= 1) {
			const p = this.alive[i]!;
			p.life -= dt;
			if (p.life <= 0) {
				p.sprite.visible = false;
				this.free.push(p.sprite);
				this.alive[i] = this.alive[this.alive.length - 1]!;
				this.alive.pop();
				continue;
			}
			p.vy += p.gravity * dt;
			p.x += p.vx * dt;
			p.y += p.vy * dt;
			p.sprite.position.set(Math.round(p.x), Math.round(p.y));
			p.sprite.alpha = Math.min(1, (p.life / p.maxLife) * 1.6);
		}
	}

	private make(): Sprite {
		const s = new Sprite();
		s.anchor.set(0.5);
		s.visible = false;
		this.layer.addChild(s);
		return s;
	}
}

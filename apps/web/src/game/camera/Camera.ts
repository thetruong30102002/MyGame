import type { Container } from 'pixi.js';

/**
 * Camera bám mượt + rung màn, nhưng vị trí CUỐI luôn làm tròn về pixel thiết bị và zoom là số
 * nguyên — đó là hai điều kiện để sprite không bao giờ bị lấy mẫu giữa hai texel (nhoè).
 */
export class Camera {
	x = 0;
	y = 0;
	zoom: number;
	private shakeTime = 0;
	private shakeDuration = 0;
	private shakeStrength = 0;

	constructor(
		private readonly world: Container,
		zoom: number,
		private readonly followRate = 9,
	) {
		this.zoom = Math.max(1, Math.round(zoom));
	}

	snapTo(x: number, y: number): void {
		this.x = x;
		this.y = y;
	}

	setZoom(zoom: number): void {
		this.zoom = Math.max(1, Math.min(8, Math.round(zoom)));
	}

	shake(strength: number, seconds: number): void {
		this.shakeStrength = strength;
		this.shakeDuration = seconds;
		this.shakeTime = seconds;
	}

	/** Giới hạn camera trong map (px thế giới); map nhỏ hơn màn hình thì căn giữa. */
	bounds: { w: number; h: number } | null = null;

	/** Vùng thế giới đang nhìn thấy — để sinh chunk mặt đất và cull. */
	view(viewW: number, viewH: number): { x0: number; y0: number; x1: number; y1: number } {
		const hw = viewW / 2 / this.zoom;
		const hh = viewH / 2 / this.zoom;
		return { x0: this.x - hw, y0: this.y - hh, x1: this.x + hw, y1: this.y + hh };
	}

	update(dt: number, targetX: number, targetY: number, viewW: number, viewH: number): void {
		if (this.bounds) {
			const hw = viewW / 2 / this.zoom;
			const hh = viewH / 2 / this.zoom;
			targetX = this.bounds.w <= hw * 2 ? this.bounds.w / 2 : Math.max(hw, Math.min(this.bounds.w - hw, targetX));
			targetY = this.bounds.h <= hh * 2 ? this.bounds.h / 2 : Math.max(hh, Math.min(this.bounds.h - hh, targetY));
		}
		const k = 1 - Math.exp(-this.followRate * dt);
		this.x += (targetX - this.x) * k;
		this.y += (targetY - this.y) * k;

		let ox = 0;
		let oy = 0;
		if (this.shakeTime > 0) {
			this.shakeTime = Math.max(0, this.shakeTime - dt);
			const falloff = this.shakeTime / this.shakeDuration;
			ox = (Math.random() * 2 - 1) * this.shakeStrength * falloff;
			oy = (Math.random() * 2 - 1) * this.shakeStrength * falloff;
		}
		this.world.scale.set(this.zoom);
		this.world.position.set(Math.round(viewW / 2 - (this.x + ox) * this.zoom), Math.round(viewH / 2 - (this.y + oy) * this.zoom));
	}
}

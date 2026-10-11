import { virtualInput } from './virtualInput';

/** Lệnh di chuyển — đúng thứ sau này client gửi lên server authoritative (không gửi toạ độ). */
export interface MoveIntent {
	x: number;
	y: number;
	run: boolean;
}

const KEYS: Record<string, [number, number]> = {
	KeyW: [0, -1],
	ArrowUp: [0, -1],
	KeyS: [0, 1],
	ArrowDown: [0, 1],
	KeyA: [-1, 0],
	ArrowLeft: [-1, 0],
	KeyD: [1, 0],
	ArrowRight: [1, 0],
};

export class Keyboard {
	private readonly down = new Set<string>();
	private readonly presses: string[] = [];
	private readonly onDown = (e: KeyboardEvent): void => {
		if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
		// Phím trong bảng/cửa sổ (role=dialog) là của bảng: chặn Space thì nút đang focus không bấm được, chặn mũi tên thì
		// không cuộn được — mà bảng mở thì nhân vật đứng yên, game không cần phím đó.
		if (e.target instanceof Element && e.target.closest('[role="dialog"]')) return;
		// Tab = đổi mục tiêu (`focus.ts`) — không để trình duyệt chuyển focus sang nút / ô nhập.
		if (e.code in KEYS || e.code === 'Space' || e.code === 'Tab') e.preventDefault();
		if (!e.repeat) this.presses.push(e.code);
		this.down.add(e.code);
	};
	private readonly onUp = (e: KeyboardEvent): void => {
		this.down.delete(e.code);
	};
	private readonly onBlur = (): void => {
		this.down.clear();
		this.presses.length = 0;
	};

	constructor() {
		window.addEventListener('keydown', this.onDown);
		window.addEventListener('keyup', this.onUp);
		window.addEventListener('blur', this.onBlur);
	}

	intent(): MoveIntent {
		// Joystick cảm ứng (analog) được ưu tiên khi đang đẩy; kéo hết cỡ thì chạy.
		const ax = virtualInput.axis;
		const mag = Math.hypot(ax.x, ax.y);
		if (mag > 0.18) return { x: ax.x / mag, y: ax.y / mag, run: mag > 0.92 };
		let x = 0;
		let y = 0;
		for (const code of this.down) {
			const v = KEYS[code];
			if (v) {
				x += v[0];
				y += v[1];
			}
		}
		x = Math.sign(x);
		y = Math.sign(y);
		return { x, y, run: this.down.has('ShiftLeft') || this.down.has('ShiftRight') };
	}

	pressed(code: string): boolean {
		return this.down.has(code);
	}

	/** Các phím vừa được NHẤN (không tính giữ/lặp) từ lần gọi trước — dùng cho kỹ năng, tương tác. */
	drainPresses(): string[] {
		return [...this.presses.splice(0), ...virtualInput.presses.splice(0)];
	}

	destroy(): void {
		window.removeEventListener('keydown', this.onDown);
		window.removeEventListener('keyup', this.onUp);
		window.removeEventListener('blur', this.onBlur);
	}
}

/** Vector → 1 trong 8 hướng (trục y màn hình hướng xuống, S = về phía người xem). */
export function directionOf(x: number, y: number): 'S' | 'SW' | 'W' | 'NW' | 'N' | 'NE' | 'E' | 'SE' {
	const order = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'] as const;
	const octant = Math.round(Math.atan2(y, x) / (Math.PI / 4));
	// NaN (toạ độ hỏng) mà lọt xuống thì bảng hướng trả undefined và CharacterView ném lỗi giữa frame.
	return Number.isFinite(octant) ? order[(octant + 8) % 8]! : 'S';
}

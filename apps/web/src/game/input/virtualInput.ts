/**
 * Đầu vào ảo cho màn hình cảm ứng (joystick + nút trên HUD React). Keyboard đọc chung nguồn này nên
 * game không phân biệt phím thật hay nút chạm — một đường xử lý duy nhất cho mọi thiết bị.
 */
export const virtualInput = {
	/** Hướng joystick, độ dài 0..1 (đẩy hết cỡ = chạy). */
	axis: { x: 0, y: 0 },
	presses: [] as string[],
	/** Ngón tay đang đặt trên cần gạt (kể cả chạm nhẹ trong vùng chết) — dùng để huỷ "tự đi". */
	stickActive: false,
	/** Đếm số lần đặt tay lên cần gạt — chạm rất nhanh (nhấc tay trước frame kế) vẫn được game thấy. */
	stickDowns: 0,
};

export function virtualPress(code: string): void {
	virtualInput.presses.push(code);
}

export function setVirtualAxis(x: number, y: number): void {
	virtualInput.axis.x = x;
	virtualInput.axis.y = y;
}

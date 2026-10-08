import type { Gender } from '@aether/protocol';

/**
 * Nhân vật người chơi đóng vai chính của cốt truyện. Thoại gốc viết cho "Lior" (nam); lúc HIỂN THỊ thì
 * thay tên và các cách gọi theo giới tính — dữ liệu truyện giữ nguyên một bản duy nhất.
 */
export interface Persona {
	name: string;
	gender: Gender;
}

let current: Persona = { name: 'Lior', gender: 'male' };

export function setPersona(p: Persona): void {
	current = p;
}

export function persona(): Persona {
	return current;
}

/** Cách gọi gắn giới tính trong thoại → bản nữ. Chỉ liệt kê cụm có thật trong `childhood.ts` / `youth.ts`. */
const FEMALE: [RegExp, string][] = [[/con trai/g, 'con gái']];

export function personalize(text: string): string {
	let out = text.replace(/\bLior\b/g, current.name);
	if (current.gender === 'female') for (const [re, to] of FEMALE) out = out.replace(re, to);
	return out;
}

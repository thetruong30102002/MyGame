/**
 * Dấu ẩn bản quyền — bản TS của `UnityGame/Assets/HavenLord/Editor/Watermark.cs` (Unity đóng dấu lúc nhập, ở đây để KIỂM một ảnh nghi bị
 * trích từ bộ cài và để test). Bit thấp kênh xanh lam của mọi điểm ảnh đặc = mẫu 16×16 từ HMAC-SHA256(khoá, "AETHER-MARK-v1:x,y"), toạ
 * độ PNG gốc trái-trên. Dò: thử đủ 256 độ lệch (ảnh có thể là một khung cắt ra từ atlas) — có dấu thì khớp ~100%, ảnh thường ~50%.
 * Chi tiết + cách dùng làm bằng chứng: docs/ban-quyen.md.
 */
import { createHmac, randomBytes } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { RGBAImage } from '../image/rgba.js';

export const TILE = 16;
// Mã định dạng dấu đã nhúng trong ảnh phát hành — GIỮ tên cũ khi đổi tên dự án, đổi là không dò được dấu ảnh cũ.
const DOMAIN = 'AETHER-MARK-v1';

/** Khoá: HAVENLORD_MARK_KEY (hex) hoặc %USERPROFILE%/.havenlord/mark.key — cùng chỗ Unity đọc; còn khoá ở
 * chỗ cũ %USERPROFILE%/.aether/mark.key (trước đổi tên dự án) thì chép sang chỗ mới. `create`: chưa có thì tạo. */
export function markKey(create = false): Buffer | null {
	const env = process.env.HAVENLORD_MARK_KEY;
	if (env) return Buffer.from(env.trim(), 'hex');
	const file = join(homedir(), '.havenlord', 'mark.key');
	if (existsSync(file)) return Buffer.from(readFileSync(file, 'utf8').trim(), 'hex');
	const legacy = join(homedir(), '.aether', 'mark.key');
	if (existsSync(legacy)) {
		mkdirSync(join(homedir(), '.havenlord'), { recursive: true });
		copyFileSync(legacy, file);
		return Buffer.from(readFileSync(file, 'utf8').trim(), 'hex');
	}
	if (!create) return null;
	mkdirSync(join(homedir(), '.havenlord'), { recursive: true });
	const k = randomBytes(32);
	writeFileSync(file, k.toString('hex'));
	return k;
}

/** Mẫu 16×16 (chỉ số y·16 + x). */
export function markTable(key: Buffer): Uint8Array {
	const t = new Uint8Array(TILE * TILE);
	for (let y = 0; y < TILE; y += 1)
		for (let x = 0; x < TILE; x += 1) t[y * TILE + x] = createHmac('sha256', key).update(`${DOMAIN}:${x},${y}`, 'ascii').digest()[0]! & 1;
	return t;
}

/** Đóng dấu tại chỗ (giống hệt Watermark.Mark của Unity). */
export function markImage(img: RGBAImage, key: Buffer): RGBAImage {
	const t = markTable(key);
	const d = img.data;
	for (let y = 0; y < img.height; y += 1)
		for (let x = 0; x < img.width; x += 1) {
			const i = (y * img.width + x) * 4;
			if (d[i + 3] !== 255) continue;
			d[i + 2] = (d[i + 2]! & 0xfe) | t[(y % TILE) * TILE + (x % TILE)]!;
		}
	return img;
}

export interface MarkResult {
	/** Số điểm ảnh đặc đã xét. */
	pixels: number;
	/** Tỉ lệ khớp ở độ lệch tốt nhất (0–1). */
	rate: number;
	ox: number;
	oy: number;
	/** Độ lệch chuẩn so với đoán bừa 50% — từ ~8 trở lên là chắc chắn có dấu (đã tính cả việc chọn độ lệch tốt nhất trong 256). */
	z: number;
	/** Kết luận: có dấu (z ≥ 8 và khớp ≥ 90%). */
	marked: boolean;
}

/** Dò dấu trong ảnh (có thể là một khung cắt lẻ, đã dịch toạ độ). */
export function detectMark(img: RGBAImage, key: Buffer): MarkResult {
	const t = markTable(key);
	const d = img.data;
	// Đếm trước theo ô (x mod 16, y mod 16) × bit, rồi mới thử 256 độ lệch trên bảng đếm — atlas 4096² vẫn nhanh.
	const cnt = new Uint32Array(TILE * TILE * 2);
	let n = 0;
	for (let y = 0; y < img.height; y += 1)
		for (let x = 0; x < img.width; x += 1) {
			const i = (y * img.width + x) * 4;
			if (d[i + 3] !== 255) continue;
			n += 1;
			const c = ((y % TILE) * TILE + (x % TILE)) * 2 + (d[i + 2]! & 1);
			cnt[c] = cnt[c]! + 1;
		}
	const hits = new Uint32Array(TILE * TILE);
	for (let oy = 0; oy < TILE; oy += 1)
		for (let ox = 0; ox < TILE; ox += 1) {
			let h = 0;
			for (let cy = 0; cy < TILE; cy += 1)
				for (let cx = 0; cx < TILE; cx += 1) h += cnt[(cy * TILE + cx) * 2 + t[((cy + oy) % TILE) * TILE + ((cx + ox) % TILE)]!]!;
			hits[oy * TILE + ox] = h;
		}
	let best = 0;
	for (let k = 1; k < hits.length; k += 1) if (hits[k]! > hits[best]!) best = k;
	const rate = n ? hits[best]! / n : 0;
	const z = n ? (hits[best]! - n / 2) / Math.sqrt(n / 4) : 0;
	return { pixels: n, rate, ox: best % TILE, oy: Math.floor(best / TILE), z, marked: n >= 64 && z >= 8 && rate >= 0.9 };
}

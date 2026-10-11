// Chạy: npx tsx tests/gear-anchors.test.ts — neo đồ gắn tính từ alpha (hình nhân tạo + atlas thật đã xuất).
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { annotateAtlas, computeGearAnchors, type GearAnchors } from '../src/atlas/gearAnchors.js';
import { createImage, crop, readPng, type RGBAImage } from '../src/image/rgba.js';

let passed = 0;
const test = (name: string, fn: () => void): void => {
	fn();
	passed += 1;
	console.log(`  ✔ ${name}`);
};
console.log('gear-anchors');

const rect = (img: RGBAImage, x0: number, y0: number, x1: number, y1: number): void => {
	for (let y = y0; y <= y1; y += 1) for (let x = x0; x <= x1; x += 1) img.data.set([200, 150, 100, 255], (y * img.width + x) * 4);
};

/**
 * Hình nhân 64×80, chân ở hàng 79: đầu chibi 16–47 × 0–22 (rộng 32 — rộng hơn vai + hai tay), cổ 28–35 × 23–25, thân 22–41 × 26–55, tay buông hai bên
 * 16–19 / 44–47 từ hàng 26 tới 52 (bàn tay đáy hàng 52 = 66% chiều cao), chân 24–39 × 56–79.
 */
function doll(): RGBAImage {
	const img = createImage(64, 80);
	rect(img, 16, 0, 47, 22);
	rect(img, 28, 23, 35, 25);
	rect(img, 22, 26, 41, 55);
	rect(img, 16, 26, 19, 52);
	rect(img, 44, 26, 47, 52);
	rect(img, 24, 56, 39, 79);
	return img;
}

test('hình nhân đối xứng: đỉnh/tâm đầu giữa, cổ đúng chỗ thắt, tay ở đầu mút dưới hai cánh tay', () => {
	const a = computeGearAnchors(doll())!;
	assert.deepEqual(a.top, [32, 0]);
	assert.equal(a.head[0], 32);
	assert.equal(a.head[1], 12, 'tâm đầu = giữa đỉnh (0) và cổ (23)');
	assert.deepEqual(a.back, [32, 25], 'vai = cổ + 2 (hàng 25), x giữa thân');
	assert.deepEqual(a.handL, [16, 52]);
	assert.deepEqual(a.handR, [47, 52]);
});

test('vạt áo loe dưới 70% không bị nhận nhầm là tay (bài học idle_S của player_hero_adult)', () => {
	const img = doll();
	rect(img, 14, 60, 49, 62);
	const a = computeGearAnchors(img)!;
	assert.deepEqual(a.handL, [16, 52]);
	assert.deepEqual(a.handR, [47, 52]);
});

test('đuôi tóc thò ra ngoài tay ở nửa trên không bị nhận là tay (bài học idle_S của player_hero_adult_f)', () => {
	const img = doll();
	rect(img, 50, 10, 52, 44);
	const a = computeGearAnchors(img)!;
	assert.deepEqual(a.handR, [47, 52]);
});

test('hướng nhìn ngang: thân hẹp như cổ — cổ vẫn ngay dưới đầu, không tụt xuống thắt lưng', () => {
	const img = createImage(64, 80);
	rect(img, 20, 0, 43, 22);
	rect(img, 26, 23, 37, 79);
	const a = computeGearAnchors(img)!;
	assert.equal(a.back[1], 25);
	assert.ok(a.head[1] <= 12);
});

test('khung trống → null; annotateAtlas ghi `gear` cho khung có hình, xoá ở khung trống', () => {
	assert.equal(computeGearAnchors(createImage(8, 8)), null);
	const sheet = createImage(130, 80);
	const d = doll();
	for (let y = 0; y < 80; y += 1) sheet.data.set(d.data.subarray(y * 64 * 4, (y + 1) * 64 * 4), (y * 130 + 0) * 4);
	const json = {
		frames: {
			a: { frame: { x: 0, y: 0, w: 64, h: 80 } } as { frame: { x: number; y: number; w: number; h: number }; gear?: GearAnchors },
			b: { frame: { x: 66, y: 0, w: 64, h: 80 }, gear: { top: [0, 0], head: [0, 0], back: [0, 0], handL: [0, 0], handR: [0, 0] } } as { frame: { x: number; y: number; w: number; h: number }; gear?: GearAnchors },
		},
	};
	assert.equal(annotateAtlas(json, sheet), 1);
	assert.deepEqual(json.frames.a.gear, computeGearAnchors(d));
	assert.equal(json.frames.b.gear, undefined);
});

// Atlas thật (nếu đã xuất): số đo kiểm bằng mắt trên ảnh debug ngày 09/10/2026 (nhân vật người chơi MỚI, ô 112×112, chân y=100) —
// găng tay idle_S của hero nam quanh (42,71) và (69,70), đỉnh tóc hàng 26. Lệch quá 3px nghĩa là thuật toán (hoặc atlas) đã đổi —
// xem lại bằng mắt. (Neo vai `back` đang rơi vào mặt vì khăn quàng che chỗ thắt cổ — chưa kiểm, xử khi làm áo choàng ở Mốc 3.)
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const atlas = join(ROOT, 'assets/characters/player_hero_adult/player_hero_adult');
if (existsSync(`${atlas}.json`)) {
	test('player_hero_adult idle_S_0: tay trùng găng tay, đỉnh đầu trùng đỉnh tóc, JSON đã xuất có neo khớp ảnh', () => {
		const json = JSON.parse(readFileSync(`${atlas}.json`, 'utf8')) as { frames: Record<string, { frame: { x: number; y: number; w: number; h: number }; gear?: GearAnchors }> };
		const f = json.frames['player_hero_adult/idle_S_0']!;
		const a = computeGearAnchors(crop(readPng(`${atlas}.png`), f.frame.x, f.frame.y, f.frame.w, f.frame.h))!;
		const near = (p: [number, number], q: [number, number]) => Math.abs(p[0] - q[0]) <= 3 && Math.abs(p[1] - q[1]) <= 3;
		assert.ok(near(a.handL, [42, 71]), `handL ${a.handL}`);
		assert.ok(near(a.handR, [69, 70]), `handR ${a.handR}`);
		assert.ok(near(a.top, [55, 26]), `top ${a.top}`);
		assert.deepEqual(f.gear, a, 'atlas đã xuất phải mang đúng neo của thuật toán hiện tại (chạy `npm run assets:anchors`)');
	});
}

console.log(`${passed} test qua`);

// Chạy: npx tsx tests/watermark.test.ts — dấu ẩn bản quyền (src/watermark/mark.ts, bản Unity: Editor/Watermark.cs).
import assert from 'node:assert/strict';
import { createImage, crop, type RGBAImage } from '../src/image/rgba.js';
import { detectMark, markImage, markTable, TILE } from '../src/watermark/mark.js';

const key = Buffer.from('00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff', 'hex');
const other = Buffer.from('ffeeddccbbaa99887766554433221100ffeeddccbbaa99887766554433221100', 'hex');

/** Ảnh giả kiểu pixel art: mảng màu phẳng lớn + nền trong suốt, số ngẫu nhiên cố định. */
function fakeArt(w: number, h: number, seed: number): RGBAImage {
	const img = createImage(w, h);
	let s = seed;
	const rnd = () => ((s = (s * 1103515245 + 12345) >>> 0) / 2 ** 32);
	const palette = Array.from({ length: 6 }, () => [Math.floor(rnd() * 256), Math.floor(rnd() * 256), Math.floor(rnd() * 256)]);
	for (let y = 0; y < h; y += 1)
		for (let x = 0; x < w; x += 1) {
			const i = (y * w + x) * 4;
			const inside = (x - w / 2) ** 2 + (y - h / 2) ** 2 < (Math.min(w, h) * 0.45) ** 2;
			const c = palette[(Math.floor(x / 7) + Math.floor(y / 5)) % palette.length]!;
			img.data.set([c[0]!, c[1]!, c[2]!, inside ? 255 : 0], i);
		}
	return img;
}

// 1) Mẫu: 16×16, cố định theo khoá, đủ cả bit 0 lẫn 1.
{
	const t = markTable(key);
	assert.equal(t.length, TILE * TILE);
	assert.deepEqual(markTable(key), t, 'cùng khoá → cùng mẫu');
	const ones = t.reduce((a, b) => a + b, 0);
	assert.ok(ones > 80 && ones < 176, `mẫu cân bằng (${ones}/256 bit 1)`);
	assert.notDeepEqual(markTable(other), t, 'khoá khác → mẫu khác');
}

// 2) Đóng dấu chỉ đổi bit thấp kênh xanh lam của điểm ảnh đặc; điểm trong suốt giữ nguyên.
{
	const a = fakeArt(96, 80, 7);
	const b = markImage(structuredClone(a), key);
	let changed = 0;
	for (let i = 0; i < a.data.length; i += 4) {
		assert.equal(a.data[i], b.data[i]);
		assert.equal(a.data[i + 1], b.data[i + 1]);
		assert.equal(a.data[i + 3], b.data[i + 3]);
		assert.ok(Math.abs(a.data[i + 2]! - b.data[i + 2]!) <= 1, 'xanh lam lệch tối đa 1');
		if (a.data[i + 3] !== 255) assert.equal(a.data[i + 2], b.data[i + 2], 'điểm trong suốt không đổi');
		if (a.data[i + 2] !== b.data[i + 2]) changed += 1;
	}
	assert.ok(changed > 0);
}

// 3) Dò: cả ảnh, một khung cắt lệch toạ độ, ảnh chưa đóng dấu, sai khoá.
{
	const marked = markImage(fakeArt(256, 192, 3), key);
	const whole = detectMark(marked, key);
	assert.ok(whole.marked && whole.rate === 1, `cả atlas: ${JSON.stringify(whole)}`);
	assert.deepEqual([whole.ox, whole.oy], [0, 0]);
	const frame = crop(marked, 37, 53, 48, 48);
	const fr = detectMark(frame, key);
	assert.ok(fr.marked && fr.rate === 1, `khung cắt lẻ: ${JSON.stringify(fr)}`);
	assert.deepEqual([fr.ox, fr.oy], [37 % TILE, 53 % TILE], 'độ lệch tìm ra đúng chỗ cắt');
	for (const seed of [1, 2, 5, 9, 11]) {
		const plain = detectMark(fakeArt(128, 128, seed), key);
		assert.ok(!plain.marked, `ảnh thường không bị nhận nhầm (seed ${seed}: ${JSON.stringify(plain)})`);
	}
	assert.ok(!detectMark(marked, other).marked, 'sai khoá thì không nhận');
	assert.ok(!detectMark(crop(marked, 0, 0, 4, 4), key).marked, 'quá ít điểm ảnh (< 64) thì không kết luận');
}

console.log('✔ watermark.test: đóng dấu + dò dấu');

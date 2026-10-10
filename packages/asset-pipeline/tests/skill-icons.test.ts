// Chạy: npx tsx tests/skill-icons.test.ts — atlas icon chiêu (src/props/skillIcons.ts). v1 (lưu trữ): cắt tấm 3×3 nền magenta
// theo bảng khoá (theo thành phần liên thông của cả tấm), ô lỗi bị bỏ chứ không chết cả lệnh, lưới đều bội 12. v2 (đang
// dùng): một ảnh 32×32 mỗi khoá — dọn nhẹ (alpha cứng, bỏ đốm rời, dời vào giữa ô), lưới 36. Mỗi bộ thêm một lượt soát bộ
// THẬT (đủ khoá, không icon nào bị bỏ).
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createImage, readPng, writePng, type RGBAImage } from '../src/image/rgba.js';
import { keyMagenta } from '../src/props/sheet.js';
import {
	buildSkillIcons,
	buildSkillIconsV2,
	cutIconSheet,
	cutSkillIcons,
	loadSkillIconsV2,
	packSkillIcons,
	tidySkillIcon,
	type SkillIconTable,
	type SkillIconTableV2,
} from '../src/props/skillIcons.js';

let passed = 0;
const test = (name: string, fn: () => void): void => {
	fn();
	passed += 1;
	console.log(`  ✔ ${name}`);
};
console.log('skill-icons');

const MAGENTA = [255, 0, 255, 255] as const;
const px = (img: RGBAImage, x: number, y: number, c: readonly number[]) => img.data.set(c, (y * img.width + x) * 4);

/** Tấm 3×3 ô 20px nền magenta; `draw[i]` = [rộng, cao, màu] của khối vẽ giữa ô i (null = ô rỗng). */
function sheet(draw: ([number, number, readonly number[]] | null)[]): RGBAImage {
	const img = createImage(60, 60);
	for (let y = 0; y < 60; y += 1) for (let x = 0; x < 60; x += 1) px(img, x, y, MAGENTA);
	draw.forEach((d, i) => {
		if (!d) return;
		const [w, h, c] = d;
		const ox = (i % 3) * 20 + Math.floor((20 - w) / 2);
		const oy = Math.floor(i / 3) * 20 + Math.floor((20 - h) / 2);
		for (let y = 0; y < h; y += 1) for (let x = 0; x < w; x += 1) px(img, ox + x, oy + y, c);
	});
	return img;
}

const RED = [200, 40, 30, 255];
const BLUE = [30, 60, 200, 255];

test('cắt theo thứ tự ô, bỏ ô rỗng / khoá trùng / tấm thiếu, atlas lưới đều bội 12', () => {
	const dir = mkdtempSync(join(tmpdir(), 'skill-icons-'));
	try {
		writePng(join(dir, 'A.png'), sheet([[8, 6, RED], [10, 10, BLUE], null, [4, 12, RED], null, null, null, null, [6, 6, BLUE]]));
		const table: SkillIconTable = {
			sheets: [
				{ sheet: 'A', icons: ['a0', 'a1', 'a2', 'a3', 'a1', 'a5', 'a6', 'a7', 'a8'].map((key) => ({ key })) },
				{ sheet: 'B', icons: [{ key: 'b0' }] },
			],
		};
		writeFileSync(join(dir, 'skill_icons.json'), JSON.stringify(table));
		const out = join(dir, 'out');
		const r = buildSkillIcons({ sourceDir: dir, outDir: out, previewPath: join(dir, 'preview.png') });
		assert.equal(r.total, 10);
		const rects = JSON.parse(readFileSync(join(out, 'skill-icons.json'), 'utf8')) as Record<string, { x: number; y: number; w: number; h: number }>;
		assert.deepEqual(Object.keys(rects), ['a0', 'a1', 'a3', 'a8']);
		assert.deepEqual([rects.a0!.w, rects.a0!.h, rects.a3!.w, rects.a3!.h], [8, 6, 4, 12], 'hộp sát đúng cỡ khối vẽ');
		const dropped = Object.fromEntries(r.issues.filter((i) => i.dropped).map((i) => [`${i.sheet}#${i.index}`, i.reason]));
		assert.match(dropped['A#2']!, /rỗng/);
		assert.match(dropped['A#4']!, /trùng/, 'ô 4 rỗng nhưng khoá trùng a1 bị bắt trước');
		assert.match(dropped['B#0']!, /chưa có tấm/);
		assert.equal(r.pitch % 12, 0);
		assert.ok(r.pitch >= 12 + 4, 'đủ chỗ icon lớn nhất + khe');
		for (const v of Object.values(rects)) assert.ok(v.x % r.pitch === 0 && v.y % r.pitch === 0, 'icon ở góc ô lưới');
		const atlas = readPng(join(out, 'skill-icons.png'));
		assert.deepEqual([atlas.width, atlas.height], [4 * r.pitch, r.pitch]);
		const at = (x: number, y: number) => Array.from(atlas.data.subarray((y * atlas.width + x) * 4, (y * atlas.width + x) * 4 + 4));
		assert.deepEqual(at(rects.a1!.x, rects.a1!.y), BLUE);
		assert.deepEqual(at(rects.a3!.x + 3, rects.a3!.y + 11), RED);
		assert.equal(at(rects.a0!.x + 8, rects.a0!.y)[3], 0, 'ngoài hộp icon trong suốt (nền magenta đã tách)');
		assert.ok(existsSync(join(dir, 'preview.png')));
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test('cắt theo thành phần cả tấm: tia sát mép giữ, phần thò sang ô bên không lọt vào ô khác, vạch mép tấm bỏ, icon dính nhau xén + báo', () => {
	const img = createImage(60, 60);
	const rect = (x0: number, y0: number, x1: number, y1: number, c: readonly number[]) => {
		for (let y = y0; y <= y1; y += 1) for (let x = x0; x <= x1; x += 1) px(img, x, y, c);
	};
	rect(0, 0, 59, 59, MAGENTA);
	rect(6, 6, 11, 11, RED);
	rect(17, 8, 18, 9, RED); // tia lửa rời, cách mép phải ô 0 chỉ 1px — luật 3px của loadSheetCell sẽ xoá
	rect(26, 6, 33, 13, BLUE);
	rect(33, 10, 41, 10, BLUE); // vệt của icon ô 1 thò sang ô 2
	rect(46, 6, 51, 11, RED);
	rect(0, 59, 59, 59, BLUE); // vạch 1px ở đáy tấm
	rect(4, 25, 13, 34, RED);
	rect(14, 29, 25, 30, RED);
	rect(26, 25, 35, 34, RED); // ô 3 và ô 4 dính liền
	for (const c of [5, 6, 7, 8]) rect((c % 3) * 20 + 7, Math.floor(c / 3) * 20 + 7, (c % 3) * 20 + 10, Math.floor(c / 3) * 20 + 10, BLUE);
	keyMagenta(img);
	const cut = cutIconSheet(img, 3);
	const ok = (c: number) => {
		const r = cut[c]!;
		assert.ok(!('error' in r), `ô ${c}: ${'error' in r ? r.error : ''}`);
		return r as { img: RGBAImage; clipped: boolean };
	};
	assert.deepEqual([ok(0).img.width, ok(0).img.height], [13, 6], 'ô 0 giữ cả tia lửa sát mép');
	assert.deepEqual([ok(1).img.width, ok(1).img.height], [14, 8], 'ô 1 giữ vệt tới mép ô, phần thò sang ô 2 bị xén');
	assert.deepEqual([ok(2).img.width, ok(2).img.height], [6, 6], 'ô 2 không nhận vệt của ô 1');
	assert.equal(ok(6).img.height, 4, 'vạch đáy tấm bị bỏ');
	assert.ok(ok(3).clipped && ok(4).clipped && !ok(0).clipped);
	assert.deepEqual([ok(3).img.width, ok(4).img.width], [16, 16], 'icon dính nhau xén đúng mép ô 20px');
});

test('không cắt được icon nào → không ghi atlas (giữ bản cũ)', () => {
	const dir = mkdtempSync(join(tmpdir(), 'skill-icons-'));
	try {
		writeFileSync(join(dir, 'skill_icons.json'), JSON.stringify({ sheets: [{ sheet: 'Z', icons: [{ key: 'z' }] }] }));
		const r = buildSkillIcons({ sourceDir: dir, outDir: join(dir, 'out'), previewPath: join(dir, 'p.png') });
		assert.equal(r.count, 0);
		assert.ok(!existsSync(join(dir, 'out', 'skill-icons.json')));
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test('xếp lưới: hàng cuối thiếu vẫn đúng cỡ, bước làm tròn lên bội 12', () => {
	const icon = (w: number, h: number) => ({ key: `${w}x${h}`, img: createImage(w, h) });
	const p = packSkillIcons([icon(61, 26), icon(40, 40), icon(20, 50)], 2);
	assert.equal(p.pitch, 72);
	assert.deepEqual([p.image.width, p.image.height], [144, 144]);
	assert.deepEqual(p.rects['20x50'], { x: 0, y: 72, w: 20, h: 50 });
});

test('bộ tấm THẬT: bảng khoá đủ 10 tấm × 9 ô, khoá không trùng, cắt được hết', () => {
	const dir = join(dirname(fileURLToPath(import.meta.url)), '../sources/pixellab/skill-icons');
	const table = JSON.parse(readFileSync(join(dir, 'skill_icons.json'), 'utf8')) as SkillIconTable;
	assert.equal(table.sheets.length, 10);
	for (const s of table.sheets) assert.equal(s.icons.length, 9, s.sheet);
	const keys = table.sheets.flatMap((s) => s.icons.map((i) => i.key));
	assert.equal(new Set(keys).size, keys.length);
	const { icons, issues } = cutSkillIcons(dir, table);
	assert.deepEqual(
		issues.map((i) => `${i.key}: ${i.reason}`),
		[],
	);
	assert.equal(icons.length, 90);
});

// ———————————————————————————— v2: một ảnh 32×32 mỗi khoá ————————————————————————————

/** Ảnh 32×32 trong suốt; `rects` = [x, y, rộng, cao, màu, alpha?]. */
function icon32(rects: [number, number, number, number, readonly number[], number?][], size = 32): RGBAImage {
	const img = createImage(size, size);
	for (const [x0, y0, w, h, c, a] of rects) for (let y = y0; y < y0 + h; y += 1) for (let x = x0; x < x0 + w; x += 1) px(img, x, y, [c[0]!, c[1]!, c[2]!, a ?? 255]);
	return img;
}
const alphaAt32 = (img: RGBAImage, x: number, y: number) => img.data[(y * img.width + x) * 4 + 3]!;

test('v2 dọn icon: alpha cứng, bỏ đốm rời ≤ 2 điểm, giữ chi tiết có viền, dời hộp bao vào giữa ô (không co giãn)', () => {
	const src = icon32([
		[2, 4, 10, 8, RED], // hình chính lệch trái-trên
		[20, 20, 1, 1, BLUE], // đốm 1 điểm
		[25, 2, 2, 1, BLUE], // đốm 2 điểm
		[14, 4, 3, 3, BLUE], // chi tiết rời 9 điểm — giữ
		[2, 13, 4, 1, RED, 60], // bán trong suốt mờ → bỏ
		[7, 13, 4, 1, RED, 200], // bán trong suốt đậm → đặc
	]);
	const t = tidySkillIcon(src);
	assert.equal(t.specks, 3);
	assert.deepEqual(t.box, { w: 15, h: 10 }, 'hộp bao = hình chính + chi tiết 3×3 + vạch đậm, bỏ đốm');
	const b = { x0: Math.floor((32 - 15) / 2), y0: Math.floor((32 - 10) / 2) };
	assert.equal(alphaAt32(t.img, b.x0, b.y0), 255, 'góc trên trái hình chính dời về giữa');
	assert.equal(alphaAt32(t.img, b.x0 + 12, b.y0), 255, 'chi tiết 3×3 đi cùng');
	let semi = 0;
	for (let i = 3; i < t.img.data.length; i += 4) if (t.img.data[i] && t.img.data[i] !== 255) semi += 1;
	assert.equal(semi, 0, 'không còn điểm bán trong suốt');
	assert.equal(tidySkillIcon(createImage(32, 32)).box, null);
});

test('v2 đọc bảng khoá: thiếu ảnh / sai cỡ / rỗng / khoá trùng bị bỏ; chạm mép chỉ báo; atlas lưới 36, hộp = cả ô 32', () => {
	const dir = mkdtempSync(join(tmpdir(), 'skill-icons-v2-'));
	try {
		writePng(join(dir, 'a.png'), icon32([[8, 8, 16, 16, RED]]));
		writePng(join(dir, 'b.png'), icon32([[0, 4, 32, 20, BLUE]]));
		writePng(join(dir, 'c.png'), icon32([[4, 4, 8, 8, RED]], 48));
		writePng(join(dir, 'd.png'), createImage(32, 32));
		const table: SkillIconTableV2 = {
			version: 2,
			style: { width: 32, height: 32 },
			icons: [
				{ key: 'a', file: 'a.png' },
				{ key: 'b', file: 'b.png' },
				{ key: 'c', file: 'c.png' },
				{ key: 'd', file: 'd.png' },
				{ key: 'e', file: 'e.png' },
				{ key: 'a', file: 'b.png' },
			],
		};
		writeFileSync(join(dir, 'skill_icons_v2.json'), JSON.stringify(table));
		const out = join(dir, 'out');
		const r = buildSkillIconsV2({ sourceDir: dir, outDir: out, previewPath: join(dir, 'preview.png') });
		assert.equal(r.total, 6);
		assert.equal(r.count, 2);
		const why = Object.fromEntries(r.issues.map((i) => [`${i.key}${i.dropped ? '✘' : '⚠'}${i.file}`, i.reason]));
		assert.match(why['b⚠b.png']!, /chạm mép/);
		assert.match(why['c✘c.png']!, /48×48/);
		assert.match(why['d✘d.png']!, /rỗng/);
		assert.match(why['e✘e.png']!, /chưa có ảnh/);
		assert.match(why['a✘b.png']!, /trùng/);
		const rects = JSON.parse(readFileSync(join(out, 'skill-icons.json'), 'utf8')) as Record<string, { x: number; y: number; w: number; h: number }>;
		assert.deepEqual(rects, { a: { x: 0, y: 0, w: 32, h: 32 }, b: { x: 36, y: 0, w: 32, h: 32 } });
		assert.equal(r.pitch % 12, 0);
		const atlas = readPng(join(out, 'skill-icons.png'));
		assert.deepEqual([atlas.width, atlas.height], [72, 36]);
		assert.equal(atlas.data[(8 * 72 + 8) * 4 + 3], 255, 'icon a giữ chỗ (đã ở giữa ô)');
		assert.ok(existsSync(join(dir, 'preview.png')));
		const none = buildSkillIconsV2({ sourceDir: dir, outDir: join(dir, 'out2'), previewPath: join(dir, 'p2.png') });
		assert.equal(none.count, 2, 'cùng bảng khoá dựng lại được');
		writeFileSync(join(dir, 'skill_icons_v2.json'), JSON.stringify({ ...table, icons: [{ key: 'z', file: 'z.png' }] }));
		const empty = buildSkillIconsV2({ sourceDir: dir, outDir: join(dir, 'out3'), previewPath: join(dir, 'p3.png') });
		assert.equal(empty.count, 0);
		assert.ok(!existsSync(join(dir, 'out3', 'skill-icons.json')), 'không icon nào thì không ghi atlas');
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test('bộ v2 THẬT: đủ 90 khoá đúng thứ tự bộ v1, mỗi khoá một ảnh 32×32, không icon nào bị bỏ', () => {
	const v1 = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../sources/pixellab/skill-icons/skill_icons.json'), 'utf8')) as SkillIconTable;
	const dir = join(dirname(fileURLToPath(import.meta.url)), '../sources/pixellab/skill-icons-v2');
	const table = JSON.parse(readFileSync(join(dir, 'skill_icons_v2.json'), 'utf8')) as SkillIconTableV2;
	assert.deepEqual(
		table.icons.map((i) => i.key),
		v1.sheets.flatMap((s) => s.icons.map((i) => i.key)),
	);
	assert.equal(new Set(table.icons.map((i) => i.file)).size, 90, 'mỗi khoá một file riêng');
	const { icons, issues } = loadSkillIconsV2(dir, table);
	assert.deepEqual(
		issues.filter((i) => i.dropped).map((i) => `${i.key}: ${i.reason}`),
		[],
	);
	assert.equal(icons.length, 90);
});

console.log(`\n${passed} test qua.`);

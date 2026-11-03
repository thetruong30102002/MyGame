// Chạy: npx tsx tests/layered-review.test.ts — trang soi nhân vật ghép lớp (src/layered/review.ts) xuất đủ ảnh + data.json.
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createImage, readPng, type RGBAImage } from '../src/image/rgba.js';
import { cellOffset, cutHead, extractHead, measureNeck, placeInCell } from '../src/layered/cut.js';
import { writeReview } from '../src/layered/review.js';
import { loadLayeredStandard } from '../src/layered/standard.js';

let passed = 0;
const test = (name: string, fn: () => void): void => {
	fn();
	passed += 1;
	console.log(`  ✔ ${name}`);
};
console.log('layered-review');

const std = loadLayeredStandard();
const rect = (img: RGBAImage, x0: number, y0: number, x1: number, y1: number, c: readonly number[]): void => {
	for (let y = y0; y <= y1; y += 1) for (let x = x0; x <= x1; x += 1) img.data.set(c, (y * img.width + x) * 4);
};
/** Hình nhân như layered-cut.test.ts, `bob` hạ cả người xuống (giả bước đi). */
function doll(hair: boolean, bob = 0): RGBAImage {
	const img = createImage(64, 100);
	const S = [224, 172, 140, 255];
	rect(img, 28, 10 + bob, 35, 11 + bob, S);
	rect(img, 26, 12 + bob, 37, 19 + bob, S);
	rect(img, 27, 20 + bob, 36, 20 + bob, S);
	rect(img, 28, 21 + bob, 35, 21 + bob, S);
	rect(img, 30, 22 + bob, 33, 24 + bob, S);
	rect(img, 21, 25 + bob, 42, 80, S);
	rect(img, 24, 81, 30, 99, [60, 60, 90, 255]);
	rect(img, 33, 81, 39, 99, [60, 60, 90, 255]);
	if (hair) rect(img, 25, 8 + bob, 38, 13 + bob, [20, 18, 22, 255]);
	return img;
}

test('xuất trang soi: data.json đúng cấu trúc, đủ ảnh thân / đầu, neo theo khung', () => {
	const out = mkdtempSync(join(tmpdir(), 'layered-review-'));
	const off = cellOffset(doll(false), std);
	const head = extractHead(doll(true), measureNeck(doll(false)), std).head;
	const frames = [0, 1, 0, -1].map((bob) => {
		const cell = placeInCell(doll(false, bob), off, std);
		const m = measureNeck(cell);
		return { body: cutHead(cell, m).body, head, neck: m.neck, durationMs: 100 };
	});
	const page = writeReview({ id: 'demo', title: 'Soi thử', notes: ['ghi chú'], clips: [{ id: 'walk', label: 'Đi', dir: 'S', loop: true, frames }] }, out, std);
	assert.ok(existsSync(page));
	const data = JSON.parse(readFileSync(join(out, 'data.json'), 'utf8'));
	assert.equal(data.clips[0].frames.length, 4);
	assert.deepEqual(data.cell.root, std.cell.root);
	assert.deepEqual(data.head.neckAnchor, std.head.neckAnchor);
	assert.equal(data.clips[0].frames[1].neck[1], data.clips[0].frames[0].neck[1] + 1, 'neo cổ đi theo bước');
	for (const f of data.clips[0].frames) {
		assert.equal(readPng(join(out, f.body)).width, std.cell.width);
		assert.equal(readPng(join(out, f.head)).width, std.head.canvas[0]);
	}
	assert.match(readFileSync(page, 'utf8'), /Soi thử/);
	writeReview({id:'demo',title:'Soi thử',notes:[],clips:[{id:'walk',label:'Đi',dir:'S',loop:true,frames}]},out,std);
	const updated=JSON.parse(readFileSync(join(out,'data.json'),'utf8'));
	assert.notEqual(updated.clips[0].frames[0].body,data.clips[0].frames[0].body,'Ảnh mới không dùng URL đệm của pose cũ');
	assert.ok(existsSync(join(out,updated.clips[0].frames[0].body)));
});

console.log(`${passed} nhóm kiểm đạt`);

// Chạy: npx tsx tests/layered-cut.test.ts — cắt / tách / ghép lớp nhân vật (src/layered/cut.ts) trên hình nhân tổng hợp.
import assert from 'node:assert/strict';
import { createImage, getPixel, type RGBAImage } from '../src/image/rgba.js';
import {
	binarizeAlpha, cellOffset, colorSet, composeHead, cutHead, extractHead, footRoot, foreignPixels, measureNeck, neckSeamHoles, placeInCell, alignHead, shiftCut, headMaskProtect,
} from '../src/layered/cut.js';
import { loadLayeredStandard, mirrorImage } from '../src/layered/standard.js';

let passed = 0;
const test = (name: string, fn: () => void): void => {
	fn();
	passed += 1;
	console.log(`  ✔ ${name}`);
};
console.log('layered-cut');

const std = loadLayeredStandard();
const SKIN = [224, 172, 140, 255] as const;
const PANTS = [60, 60, 90, 255] as const;
const HAIR = [20, 18, 22, 255] as const;
const COLLAR = [180, 40, 40, 255] as const;

const rect = (img: RGBAImage, x0: number, y0: number, x1: number, y1: number, c: readonly number[]): void => {
	for (let y = y0; y <= y1; y += 1) for (let x = x0; x <= x1; x += 1) img.data.set(c, (y * img.width + x) * 4);
};

/**
 * Hình nhân 64×100 đầu trọc: đỉnh 10–11 rộng 8 (28–35), đầu 12–19 rộng 12 (26–37), hàm 20 rộng 10, cằm 21 rộng 8, CỔ 22–24 rộng 4
 * (30–33), vai/thân 25–55 rộng 22 (21–42), quần 56–80, hai chân 81–99. `hair`: tóc đen 8–13 rộng 14 (25–38) phủ đỉnh đầu.
 */
function doll(opts: { hair?: boolean } = {}): RGBAImage {
	const img = createImage(64, 100);
	rect(img, 28, 10, 35, 11, SKIN);
	rect(img, 26, 12, 37, 19, SKIN);
	rect(img, 27, 20, 36, 20, SKIN);
	rect(img, 28, 21, 35, 21, SKIN);
	rect(img, 30, 22, 33, 24, SKIN);
	rect(img, 21, 25, 42, 55, SKIN);
	rect(img, 24, 56, 39, 80, PANTS);
	rect(img, 24, 81, 30, 99, PANTS);
	rect(img, 33, 81, 39, 99, PANTS);
	if (opts.hair) rect(img, 25, 8, 38, 13, HAIR);
	return img;
}

const same = (a: RGBAImage, b: RGBAImage): boolean => a.width === b.width && a.height === b.height && Buffer.compare(Buffer.from(a.data), Buffer.from(b.data)) === 0;

test('đo cổ: neo dưới cằm, cổ dài 3px (trong thước 2–5), đường giữa', () => {
	const m = measureNeck(doll());
	assert.deepEqual(m.neck, [31, 22]);
	assert.equal(m.chinY, 21);
	assert.equal(m.shoulderY, 25);
	assert.equal(m.neckLength, 3);
	assert.equal(m.neckWidth, 4);
	assert.equal(m.headWidth, 12);
	const [lo, hi] = std.body.neckLengthPx;
	assert.ok(m.neckLength >= lo && m.neckLength <= hi);
	// Tóc không làm lệch neo cổ (đo trên đường giữa, tóc chỉ ở trên đỉnh).
	assert.deepEqual(measureNeck(doll({ hair: true })).neck, [31, 22]);
});

test('không có dạng đầu → cổ → vai thì báo lỗi, không đoán', () => {
	const block = createImage(20, 40);
	rect(block, 5, 0, 14, 39, SKIN);
	assert.throws(() => measureNeck(block), /Không thấy dạng/);
});

test('cắt đầu: thân không còn pixel nào trên hàng cổ; cổ và vai giữ nguyên', () => {
	const img = doll();
	const m = measureNeck(img);
	const cut = cutHead(img, m);
	assert.equal(cut.remnants.length, 0);
	for (let y = 0; y < m.neck[1]; y += 1) for (let x = 0; x < 64; x += 1) assert.equal(getPixel(cut.body, x, y)[3], 0, `còn pixel đầu (${x},${y})`);
	assert.deepEqual([...getPixel(cut.body, 31, 22)], [...SKIN], 'cổ thuộc thân');
	assert.deepEqual([...getPixel(cut.body, 21, 25)], [...SKIN], 'vai thuộc thân');
	assert.equal(cut.removedCount, 8 * 2 + 12 * 8 + 10 + 8);
});

test('pixel lạc trên cổ không nối với đầu bị báo (Q2), không lờ đi', () => {
	const img = doll();
	rect(img, 24, 15, 24, 15, HAIR);
	const cut = cutHead(img, measureNeck(img));
	assert.deepEqual(cut.remnants, [[24, 15]]);
});

test('tay giơ chạm đầu: vùng bảo vệ giữ tay ở thân', () => {
	const img = doll();
	rect(img, 38, 5, 41, 12, SKIN);
	const m = measureNeck(img, { cx: 31 });
	const protect = (x: number, y: number): boolean => x >= 38 && y <= 12;
	const cut = cutHead(img, m, protect);
	assert.equal(cut.remnants.length, 0);
	assert.equal(getPixel(cut.body, 40, 8)[3], 255, 'tay còn');
	assert.equal(getPixel(cut.body, 30, 15)[3], 0, 'đầu đã bỏ');
	const noProtect = cutHead(img, m);
	assert.equal(getPixel(noProtect.body, 40, 8)[3], 0, 'không bảo vệ thì tay bị cắt theo đầu — đúng lý do cần vùng bảo vệ');
});

test('cắt thân trọc + tách đầu có tóc → ghép lại Y HỆT bản có tóc từng pixel', () => {
	const bald = doll();
	const haired = doll({ hair: true });
	const m = measureNeck(bald);
	const body = cutHead(bald, m).body;
	const { head, pixels } = extractHead(haired, m, std);
	assert.equal(head.width, std.head.canvas[0]);
	assert.ok(pixels > 0);
	assert.deepEqual([...getPixel(head, std.head.neckAnchor[0], std.head.neckAnchor[1])], [...SKIN], 'neo cổ là cổ da');
	assert.equal(getPixel(head, std.head.neckAnchor[0], std.head.neckAnchor[1] + std.head.bareNeckMaxPx)[3], 0, 'cổ da tối đa bareNeckMaxPx hàng');
	const composed = composeHead(body, head, m.neck, std);
	assert.ok(same(composed, haired), 'ghép lại phải trùng khít bản vẽ liền');
	assert.equal(neckSeamHoles(composed, m.neck).length, 0);
});

test('Q5: đầu lệch lên 3px thì lộ khe ở cổ', () => {
	const bald = doll();
	const m = measureNeck(bald);
	const body = cutHead(bald, m).body;
	const { head } = extractHead(doll({ hair: true }), m, std);
	const shifted = composeHead(body, head, [m.neck[0], m.neck[1] - 3], std);
	assert.ok(neckSeamHoles(shifted, m.neck).length > 0);
});

test('Q8: lớp đầu dính màu áo bị phát hiện', () => {
	const m = measureNeck(doll());
	const allowed = new Set([...colorSet(doll({ hair: true }))].filter((c) => c !== ((PANTS[0] << 16) | (PANTS[1] << 8) | PANTS[2])));
	const clean = extractHead(doll({ hair: true }), m, std).head;
	assert.equal(foreignPixels(clean, allowed).length, 0);
	const collared = doll({ hair: true });
	rect(collared, 31, 22, 31, 22, COLLAR);
	assert.equal(foreignPixels(extractHead(collared, m, std).head, allowed).length, 1);
});

test('đầu to quá canvas thì báo lỗi, không cắt im lặng', () => {
	const m = measureNeck(doll());
	assert.throws(() => extractHead(doll({ hair: true }), m, { head: { ...std.head, canvas: [10, 10], neckAnchor: [5, 8] } }), /tràn ra ngoài canvas/);
});

test('lật: ghép từ thân lật + đầu lật = lật của bản ghép (cùng một cách tính neo)', () => {
	const bald = doll();
	const m = measureNeck(bald);
	const body = cutHead(bald, m).body;
	const { head } = extractHead(doll({ hair: true }), m, std);
	const axis = m.neck[0];
	const a = composeHead(mirrorImage(body, axis), mirrorImage(head, std.head.neckAnchor[0]), m.neck, std);
	const b = mirrorImage(composeHead(body, head, m.neck, std), axis);
	assert.ok(same(a, b));
});

test('đặt vào ô: chân → root bằng một offset nguyên, tràn ô thì báo lỗi', () => {
	const img = doll();
	assert.deepEqual(footRoot(img), [32, 99]);
	const off = cellOffset(img, std);
	assert.deepEqual(off, [48, 45]);
	const cell = placeInCell(img, off, std);
	assert.equal(cell.width, 160);
	assert.deepEqual(footRoot(cell), std.cell.root);
	assert.throws(() => placeInCell(img, [130, 0], std), /tràn ô/);
});

const OUTLINE = [14, 17, 29, 255] as const;
const opaqueAt = (img: RGBAImage, x: number, y: number): boolean => getPixel(img, x, y)[3] !== 0;

/**
 * Hình nhân có tóc như ảnh PixelLab: viền đen hai bên cổ (cột 29, 34, hàng 22–24), tóc bồng rộng hơn mặt (23–40, hàng 8–13), tóc gáy
 * rủ sát hai bên cổ (27–28 và 35–36, hàng 22–23) và một lọn tóc tách rời trên đỉnh (31–32, hàng 4–5). `back`: nhìn từ sau — tóc phủ cằm
 * và hàng cổ đầu (28–35, hàng 21–22) với một khe sáng 1px trong tóc gáy.
 */
function hairedDoll(opts: { back?: boolean } = {}): RGBAImage {
	const img = doll();
	rect(img, 23, 8, 40, 13, HAIR);
	rect(img, 31, 4, 32, 5, HAIR);
	rect(img, 29, 22, 29, 24, OUTLINE);
	rect(img, 34, 22, 34, 24, OUTLINE);
	rect(img, 27, 22, 28, 23, HAIR);
	rect(img, 35, 22, 36, 23, HAIR);
	if (opts.back) {
		rect(img, 28, 21, 35, 22, HAIR);
		rect(img, 31, 22, 31, 22, SKIN);
	}
	return img;
}

test('ảnh có tóc: đo từ vai lên quanh hàng cổ thân trọc — tóc bồng / lọn tách rời / tóc rủ sát cổ không làm lệch neo', () => {
	const m = measureNeck(hairedDoll(), { nearY: 22 });
	assert.deepEqual(m.neck, [31, 22]);
	assert.equal(m.shoulderY, 25);
	assert.equal(m.neckLength, 3);
	assert.equal(m.neckWidth, 4, 'chỉ ruột giữa hai viền');
	assert.deepEqual(m.spans, [[29, 34], [29, 34], [29, 34]]);
	// Lệch gợi ý vài hàng vẫn ra đúng neo (khung động tác nảy lên xuống).
	assert.deepEqual(measureNeck(hairedDoll(), { nearY: 24 }).neck, [31, 22]);
	assert.deepEqual(measureNeck(hairedDoll(), { nearY: 20 }).neck, [31, 22]);
});

test('ảnh có tóc nhìn từ sau: khe sáng trong tóc gáy không bị nhận là cổ', () => {
	const m = measureNeck(hairedDoll({ back: true }), { nearY: 22 });
	assert.deepEqual(m.neck, [31, 23]);
	assert.equal(m.neckLength, 2);
});

test('ảnh có tóc: tách 3 lớp — thân không còn tóc, tóc rủ sát cổ sang hairBack, lọn tách rời vào đầu, ghép lại trùng khít', () => {
	const img = hairedDoll();
	const m = measureNeck(img, { nearY: 22 });
	const cut = cutHead(img, m);
	assert.equal(cut.remnants.length, 0, 'lọn tách rời không sót trên thân');
	assert.equal(cut.hairBackCount, 8);
	for (const [x, y] of [[27, 22], [28, 23], [35, 22], [36, 23], [31, 4]] as const) assert.ok(!opaqueAt(cut.body, x, y), `thân còn tóc ở (${x},${y})`);
	for (const [x, y] of [[29, 22], [34, 23], [31, 22]] as const) assert.ok(opaqueAt(cut.body, x, y), `viền / cổ phải thuộc thân (${x},${y})`);
	const ex = extractHead(img, m, std);
	assert.ok(ex.hairBack, 'có lớp tóc sau');
	const [ax, ay] = std.head.neckAnchor;
	assert.ok(opaqueAt(ex.head, 31 - 31 + ax, 4 - 22 + ay), 'lọn tách rời nằm trong lớp đầu');
	assert.ok(opaqueAt(ex.hairBack!, 27 - 31 + ax, 22 - 22 + ay), 'tóc rủ sát cổ nằm trong lớp tóc sau');
	assert.ok(same(composeHead(cut.body, ex.head, m.neck, std, ex.hairBack), img), 'tóc sau / thân / đầu ghép lại phải trùng bản vẽ liền');
	assert.equal(neckSeamHoles(composeHead(cut.body, ex.head, m.neck, std, ex.hairBack), m.neck, m.spans![0]).length, 0);
});

test('ảnh có tóc: không có vai rộng ra dưới dải hẹp thì báo lỗi, không đoán', () => {
	const block = createImage(20, 40);
	rect(block, 5, 0, 14, 39, SKIN);
	assert.throws(() => measureNeck(block, { nearY: 20 }), /không thấy vai/);
});

/**
 * Hình nhân có tóc mặc áo (màu COLLAR) từ vai (hàng 25) xuống, cổ áo chữ V có viền: hở da 29–34 ở hàng 25 rồi hẹp dần tới mũi V hàng 28 —
 * giữa ngực là khoảng hở da nên đo từ vai lên không dùng được. `up`: cả hình dịch lên 1 hàng (bản vẽ mặc đồ là bản khác, lệch nhẹ).
 */
function dressedDoll(up = 0): RGBAImage {
	const src = hairedDoll();
	rect(src, 21, 25, 42, 55, COLLAR);
	rect(src, 28, 25, 35, 25, OUTLINE);
	rect(src, 29, 25, 34, 25, SKIN);
	rect(src, 29, 26, 34, 26, OUTLINE);
	rect(src, 30, 26, 33, 26, SKIN);
	rect(src, 30, 27, 33, 27, OUTLINE);
	rect(src, 31, 27, 32, 27, SKIN);
	rect(src, 31, 28, 32, 28, OUTLINE);
	const img = createImage(src.width, src.height);
	img.data.set(src.data.subarray(up * src.width * 4), 0);
	return img;
}

test('ảnh mặc đồ: khớp đầu thân trần → neo = neo thân trần + độ dịch (không đo lại cổ có cổ áo), ghép không hở cổ', () => {
	const bare = hairedDoll();
	const base = measureNeck(bare, { nearY: 22 });
	const ex = extractHead(bare, base, std);
	const dressed = dressedDoll();
	const al = alignHead(dressed, ex.head, base.neck, std);
	assert.deepEqual([al.dx, al.dy, al.match], [0, 0, 1]);
	const m = shiftCut(base, al.dx, al.dy);
	const body = cutHead(dressed, m).body;
	for (const [x, y] of [[27, 22], [36, 23], [31, 4], [31, 10]] as const) assert.ok(!opaqueAt(body, x, y), `thân bộ đồ còn đầu / tóc ở (${x},${y})`);
	assert.ok(opaqueAt(body, 30, 25), 'cổ áo thuộc thân');
	const composed = composeHead(body, ex.head, m.neck, std, ex.hairBack);
	assert.equal(neckSeamHoles(composed, m.neck, m.spans![0]).length, 0);
	assert.ok(same(composed, dressed), 'đầu thân trần ghép lên thân bộ đồ phải trùng bản mặc đồ vẽ liền');
	// Bản mặc đồ lệch lên 1 hàng (bản vẽ khác): khớp đầu ra dy = −1, neo đi theo.
	const up = alignHead(dressedDoll(1), ex.head, base.neck, std);
	assert.deepEqual([up.dx, up.dy, up.match], [0, -1, 1]);
	assert.deepEqual(shiftCut(base, up.dx, up.dy).neck, [31, 21]);
});

test('tay chạm đầu không có khung xương: vùng bảo vệ dựng từ bóng đầu mẫu giữ tay ở thân', () => {
	const bare = hairedDoll();
	const base = measureNeck(bare, { nearY: 22 });
	const mold = extractHead(bare, base, std).head;
	const img = hairedDoll();
	rect(img, 41, 12, 46, 30, SKIN); // tay giơ sát đầu phải, chạm tóc (40, 12) và nối vai
	const m = measureNeck(img, { nearY: 22 });
	const protect = headMaskProtect(mold, m.neck, std);
	const cut = cutHead(img, m, protect);
	assert.ok(opaqueAt(cut.body, 44, 15), 'tay còn ở thân');
	assert.ok(!opaqueAt(cut.body, 31, 10), 'đầu đã bỏ');
	const ex = extractHead(img, m, std, protect);
	assert.ok(!opaqueAt(ex.head, 44 - 31 + std.head.neckAnchor[0], 15 - 22 + std.head.neckAnchor[1]), 'lớp đầu không lấy tay');
	assert.ok(same(composeHead(cut.body, ex.head, m.neck, std, ex.hairBack), img), 'ghép lại vẫn trùng khít');
	assert.equal(getPixel(cutHead(img, m).body, 44, 15)[3], 0, 'không bảo vệ thì tay bị loang theo đầu — đúng lý do cần vùng bảo vệ');
	// Có ảnh: tay da lấn vào bóng đầu (chỗ mẫu là tóc đen) vẫn là tay; lọn tóc nảy ra ngoài bóng (không nối thân) vẫn là đầu.
	const img2 = hairedDoll();
	rect(img2, 41, 8, 46, 30, SKIN);
	rect(img2, 38, 8, 40, 9, SKIN); // tay lấn vào chỗ tóc của mẫu (xa mặt — tay da sát má da thì không tách được bằng màu)
	rect(img2, 17, 10, 22, 10, HAIR); // lọn tóc nảy xa bóng đầu
	const m2 = measureNeck(img2, { nearY: 22 });
	const p2 = headMaskProtect(mold, m2.neck, std, 2, img2);
	const cut2 = cutHead(img2, m2, p2);
	assert.ok(opaqueAt(cut2.body, 39, 8), 'tay lấn vào bóng đầu vẫn ở thân');
	assert.ok(!opaqueAt(cut2.body, 17, 10), 'lọn tóc nảy xa không nối thân → thuộc đầu, không sót trên thân');
	assert.equal(cut2.remnants.length, 0);
});

test('cắt chặt bộ đồ: mảnh tay áo sau gáy đứt khỏi thân và viền tay ngoài bóng về thân, chấm bóng lẻ trong đầu vẫn là đầu', () => {
	const bare = hairedDoll();
	const base = measureNeck(bare, { nearY: 22 });
	const mold = extractHead(bare, base, std).head;
	const img = hairedDoll();
	const SLEEVE = [240, 230, 210, 255] as const;
	rect(img, 21, 10, 26, 11, SLEEVE); // tay áo lấp sau tóc, tóc che đứt khỏi vai
	rect(img, 17, 11, 20, 11, OUTLINE); // viền tay ngoài bóng đầu, nối mảnh tay áo
	rect(img, 31, 15, 31, 15, [150, 100, 90, 255]); // một chấm bóng lệch màu trên mặt vẽ lại
	const m = measureNeck(img, { nearY: 22 });
	const protect = headMaskProtect(mold, m.neck, std, 2, img, 48, true);
	const cut = cutHead(img, m, protect);
	const ex = extractHead(img, m, std, protect);
	const inHead = (x: number, y: number): boolean => opaqueAt(ex.head, x - m.neck[0] + std.head.neckAnchor[0], y - m.neck[1] + std.head.neckAnchor[1]);
	for (const [x, y] of [[25, 10], [19, 11]] as const) {
		assert.ok(opaqueAt(cut.body, x, y), `(${x},${y}) phải ở thân`);
		assert.ok(!inHead(x, y), `lớp đầu không được mang (${x},${y})`);
	}
	assert.ok(inHead(31, 15) && !opaqueAt(cut.body, 31, 15), 'chấm bóng lẻ thuộc đầu, không sót trên thân');
	assert.ok(!opaqueAt(cut.body, 31, 10), 'đầu đã bỏ');
	assert.ok(same(composeHead(cut.body, ex.head, m.neck, std, ex.hairBack), img), 'ghép lại trùng khít');
});

test('alpha bán trong suốt làm tròn về 0 / 255', () => {
	const img = createImage(2, 1);
	img.data.set([10, 10, 10, 200, 20, 20, 20, 40]);
	assert.equal(binarizeAlpha(img), 2);
	assert.equal(img.data[3], 255);
	assert.deepEqual([...img.data.subarray(4, 8)], [0, 0, 0, 0]);
});

console.log(`${passed} nhóm kiểm đạt`);

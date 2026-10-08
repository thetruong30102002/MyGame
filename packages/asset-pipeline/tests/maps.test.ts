// Chạy: npx tsx tests/maps.test.ts — luật vùng nhiều map + bộ cắt tấm đồ vật PixelLab, không cần ảnh thật.
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createImage, writePng, type RGBAImage } from '../src/image/rgba.js';
import { buildHumanRegion, validateRegion, type MapData } from '../src/maps/human/index.js';
import { keyMagenta, loadSheetCell, parseSheetPath } from '../src/props/sheet.js';

let passed = 0;
const test = (name: string, fn: () => void): void => {
	fn();
	passed += 1;
	console.log(`  ✔ ${name}`);
};
console.log('maps');

// Không có atlas (meta rỗng): đồ vật bị bỏ qua nhưng địa hình, địa điểm, vùng quái, lối vẫn dựng đủ.
const region = buildHumanRegion({}, []);
const clone = (): MapData[] => JSON.parse(JSON.stringify(region.maps)) as MapData[];

test('vùng thật đạt luật: 6 map, lối hai chiều, chỉ mục khớp', () => {
	assert.deepEqual(validateRegion(region.maps), []);
	assert.deepEqual(Object.keys(region.index.maps).sort(), ['bonehills', 'cliffs', 'graveyard', 'mossvale', 'shrine', 'town']);
	assert.deepEqual(region.index.maps.town!.exits.map((e) => e.to).sort(), ['graveyard', 'mossvale']);
	assert.deepEqual(region.index.maps.mossvale!.exits.map((e) => e.to).sort(), ['shrine', 'town']);
	assert.deepEqual(region.index.maps.graveyard!.exits.map((e) => e.to).sort(), ['bonehills', 'cliffs', 'town']);
	assert.equal(region.index.maps.shrine!.boss, 'boss_demon_001');
	assert.ok(region.index.maps.town!.spots.includes('home') && region.index.maps.mossvale!.spots.includes('forest_edge'));
});

test('mỗi map chỉ một loại quái, bầy ≥ 3 con (vùng boss 1 con đứng ngoài luật)', () => {
	for (const m of region.maps) {
		const packs = m.monsterZones.filter((z) => !z.boss);
		assert.ok(new Set(packs.flatMap((z) => z.monsters)).size <= 1, m.id);
		for (const z of packs) assert.ok(z.count >= 3, `${m.id}/${z.id}`);
		for (const z of m.monsterZones) if (z.boss) assert.ok(z.count === 1 && z.monsters.length === 1, `${m.id}/${z.id}`);
	}
	const bad = clone();
	bad.find((m) => m.id === 'mossvale')!.monsterZones[1]!.monsters = ['mob_skeleton_archer_001'];
	assert.ok(validateRegion(bad).some((e) => e.includes('loại quái')));
	// Bỏ cờ boss thì Vua Lich thành loại quái thứ hai của nghĩa địa → phải bị bắt.
	const unflagged = clone();
	for (const z of unflagged.find((m) => m.id === 'graveyard')!.monsterZones) delete z.boss;
	assert.ok(validateRegion(unflagged).some((e) => e.startsWith('graveyard') && e.includes('loại quái')));
});

test('id địa điểm trùng giữa hai map bị bắt', () => {
	const bad = clone();
	bad.find((m) => m.id === 'shrine')!.spots.push({ id: 'home', name: 'x', x: 700, y: 700, r: 40 });
	assert.ok(validateRegion(bad).some((e) => e.includes('"home" trùng')));
});

test('lối sai: map đích không có / điểm đến không có / điểm đến nằm trong dải lối về', () => {
	const a = clone();
	a.find((m) => m.id === 'town')!.exits[0]!.to = 'desert';
	assert.ok(validateRegion(a).some((e) => e.includes('"desert" không có')));
	const b = clone();
	b.find((m) => m.id === 'town')!.exits[0]!.toSpot = 'nowhere';
	assert.ok(validateRegion(b).some((e) => e.includes('nowhere')));
	const c = clone();
	const forest = c.find((m) => m.id === 'mossvale')!;
	const back = forest.exits.find((e) => e.to === 'town')!;
	const arrive = forest.spots.find((s) => s.id === 'west_entry')!;
	Object.assign(arrive, { x: back.x0 + 10, y: (back.y0 + back.y1) / 2 });
	assert.ok(validateRegion(c).some((e) => e.includes('nằm trong lối')));
});

test('đường dẫn tấm: sheet:<tấm>#<ô>@<cột>x<hàng>', () => {
	assert.deepEqual(parseSheetPath('sheet:N1_nature#5@3x3'), { sheet: 'N1_nature', index: 5, cols: 3, rows: 3 });
	assert.equal(parseSheetPath('pixellab:tree_oak_front'), null);
	assert.throws(() => parseSheetPath('sheet:T1#4@2x2'));
});

const px = (img: RGBAImage, x: number, y: number, c: [number, number, number, number]): void => img.data.set(c, (y * img.width + x) * 4);

test('tách nền magenta + khử viền tím + bỏ mẩu lấn từ ô bên', () => {
	const dir = mkdtempSync(join(tmpdir(), 'sheet-'));
	try {
		// Tấm 2×1 ô 20px, nền magenta. Ô 0: khối xanh 8×8 có viền tím sẫm; mẩu 2px của ô 1 lấn sang mép phải ô 0.
		const s = createImage(40, 20);
		for (let y = 0; y < 20; y += 1) for (let x = 0; x < 40; x += 1) px(s, x, y, [255, 0, 255, 255]);
		for (let y = 6; y < 14; y += 1) for (let x = 6; x < 14; x += 1) px(s, x, y, [40, 160, 60, 255]);
		for (let y = 6; y < 14; y += 1) px(s, 5, y, [70, 10, 70, 255]);
		px(s, 19, 10, [200, 200, 200, 255]);
		px(s, 18, 10, [200, 200, 200, 255]);
		for (let y = 4; y < 16; y += 1) for (let x = 20; x < 32; x += 1) px(s, x, y, [200, 200, 200, 255]);
		writePng(join(dir, 'X.png'), s);
		const cell = loadSheetCell(dir, { sheet: 'X', index: 0, cols: 2, rows: 1 });
		assert.equal(cell.width, 9, 'mẩu lấn bị bỏ, viền tím sẫm còn lại thành viền đen');
		assert.equal(cell.height, 8);
		const left = cell.data.subarray(0, 4);
		assert.deepEqual([...left.subarray(0, 3)], [8, 6, 10], 'viền tím sẫm sát nền → màu viền đen');
		const sheet2 = createImage(4, 1);
		px(sheet2, 0, 0, [255, 0, 255, 255]);
		px(sheet2, 1, 0, [230, 20, 240, 255]);
		px(sheet2, 2, 0, [240, 150, 170, 255]);
		px(sheet2, 3, 0, [130, 190, 240, 255]);
		keyMagenta(sheet2);
		assert.deepEqual([0, 1, 2, 3].map((i) => sheet2.data[i * 4 + 3]), [0, 0, 255, 255], 'hoa hồng / nấm xanh không bị tách nhầm');
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

test('ô còn nền (tách nền hỏng) bị từ chối', () => {
	const dir = mkdtempSync(join(tmpdir(), 'sheet-'));
	try {
		const s = createImage(20, 20);
		for (let i = 0; i < s.data.length; i += 4) s.data.set([90, 120, 90, 255], i);
		writePng(join(dir, 'Y.png'), s);
		assert.throws(() => loadSheetCell(dir, { sheet: 'Y', index: 0, cols: 1, rows: 1 }), /còn nền/);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});

console.log(`${passed} test đạt`);

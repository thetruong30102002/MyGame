// Chạy: npx tsx tests/maps.test.ts — luật vùng nhiều map + bộ cắt tấm đồ vật PixelLab, không cần ảnh thật.
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createImage, writePng, type RGBAImage } from '../src/image/rgba.js';
import { buildHumanRegion, crossRegionExits, validateRegion, type MapData } from '../src/maps/human/index.js';
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

test('vùng thật đạt luật: 12 map (thiết kế 10/10/2026), lối hai chiều, chỉ mục khớp', () => {
	assert.deepEqual(validateRegion(region.maps), []);
	assert.deepEqual(Object.keys(region.index.maps).sort(), ['bonehills', 'cliffs', 'gargoyle_cave', 'graveyard', 'mossrift', 'mossvale', 'nameless', 'oldfort', 'riverflats', 'rivergate', 'shrine', 'town']);
	const to = (id: string): string[] => region.index.maps[id]!.exits.map((e) => e.to).sort();
	assert.deepEqual(to('town'), ['graveyard', 'mossvale', 'riverflats']);
	assert.deepEqual(to('mossvale'), ['mossrift', 'oldfort', 'shrine', 'town']);
	assert.deepEqual(to('graveyard'), ['bonehills', 'cliffs', 'nameless', 'town']);
	assert.deepEqual(to('bonehills'), ['graveyard', 'oldfort']);
	assert.deepEqual(to('cliffs'), ['gargoyle_cave', 'graveyard']);
	assert.deepEqual(to('shrine'), ['mossvale']);
	assert.deepEqual(to('riverflats'), ['mossrift', 'rivergate', 'town']);
	assert.deepEqual(to('mossrift'), ['mossvale', 'riverflats']);
	assert.deepEqual(to('nameless'), ['gargoyle_cave', 'graveyard']);
	assert.deepEqual(to('oldfort'), ['bonehills', 'mossvale']);
	assert.deepEqual(to('gargoyle_cave'), ['cliffs', 'nameless']);
	assert.deepEqual(to('rivergate'), ['riverflats', 'swamp/hub']);
	// 14 cạnh trong vùng (28 lối) + 1 lối sang vùng 2.
	assert.equal(region.maps.reduce((n, m) => n + m.exits.length, 0), 29);
	assert.equal(region.index.maps.shrine!.boss, 'boss_demon_001');
	assert.ok(region.index.maps.town!.spots.includes('home') && region.index.maps.mossvale!.spots.includes('forest_edge'));
});

test('map cũ: lối CŨ giữ đầu mảng (dẫn đường nhiệm vụ đi lối khai trước — town ↔ mossvale vẫn một bước), lối mới ở cuối', () => {
	const first = (id: string): string[] => region.maps.find((m) => m.id === id)!.exits.map((e) => e.to);
	assert.deepEqual(first('town'), ['mossvale', 'graveyard', 'riverflats']);
	assert.deepEqual(first('mossvale'), ['town', 'shrine', 'mossrift', 'oldfort']);
	assert.deepEqual(first('graveyard'), ['town', 'cliffs', 'bonehills', 'nameless']);
	assert.deepEqual(first('bonehills'), ['graveyard', 'oldfort']);
	assert.deepEqual(first('cliffs'), ['graveyard', 'gargoyle_cave']);
	// Dải lối cũ không xê dịch (bản lưu đứng ngay cạnh lối, nhiệm vụ dẫn tới lối).
	const town = region.maps.find((m) => m.id === 'town')!;
	assert.deepEqual([town.exits[0]!.x0, town.exits[0]!.y0, town.exits[1]!.x0, town.exits[1]!.y0], [2352, 1104, 960, 0]);
});

test('Hang Gargoyle: một khu boss Gargoyle Đá 1 con; quái thường là dơi hang; lối sang vùng 2 duy nhất ở Hẻm Cửa Sông', () => {
	const cave = region.maps.find((m) => m.id === 'gargoyle_cave')!;
	const bosses = cave.monsterZones.filter((z) => z.boss);
	assert.equal(bosses.length, 1);
	assert.deepEqual([bosses[0]!.monsters, bosses[0]!.count, bosses[0]!.fromAge], [['boss_stone_gargoyle_001'], 1, 16]);
	assert.deepEqual([...new Set(cave.monsterZones.filter((z) => !z.boss).flatMap((z) => z.monsters))], ['mob_cave_bat_001']);
	assert.deepEqual(crossRegionExits('human', region.maps), [{ from: 'human/rivergate', to: 'swamp/hub', toSpot: 'east_gate' }]);
});

test('cấp quái theo khu: map cũ không khai cấp (chỉ số gốc), map mới có; chỉ mục ghi cấp từng khu + khoảng cấp của map', () => {
	for (const id of ['town', 'mossvale', 'shrine', 'graveyard', 'bonehills', 'cliffs']) {
		assert.ok(region.maps.find((m) => m.id === id)!.monsterZones.every((z) => z.level === undefined), `${id}: không khai level`);
		assert.equal(region.index.maps[id]!.levels, undefined, id);
	}
	const levels = (id: string) => region.index.maps[id]!.levels;
	assert.deepEqual(
		['riverflats', 'mossrift', 'nameless', 'oldfort', 'gargoyle_cave', 'rivergate'].map(levels),
		[
			[1, 4],
			[5, 6],
			[6, 7],
			[7, 8],
			[8, 9],
			[9, 10],
		],
	);
	assert.equal(region.index.maps.rivergate!.zones.find((z) => z.id === 'vg_gate')!.level, 10);
	assert.equal(region.index.maps.gargoyle_cave!.zones.find((z) => z.id === 'gc_hall')!.level, undefined, 'boss khu dùng cấp gốc (10)');
	// Bãi Bồi: hai bầy tuổi thơ riêng (8–15 tuổi, cấp 1) + hai bầy dùng chung 16+.
	const rf = region.maps.find((m) => m.id === 'riverflats')!.monsterZones;
	assert.deepEqual(
		rf.map((z) => [z.id, z.fromAge, z.untilAge, z.level]),
		[
			['rf_orchard', 8, 15, 1],
			['rf_levee', 8, 15, 1],
			['rf_oldbed', 16, undefined, 3],
			['rf_east_bank', 16, undefined, 4],
		],
	);
});

test('luật mới: cấp khu trong khoảng cấp vùng; tâm bầy cách nước ≥ 6 ô; khu tuổi thơ phải có untilAge ≤ 15', () => {
	const a = clone();
	a.find((m) => m.id === 'mossrift')!.monsterZones[0]!.level = 11;
	a.find((m) => m.id === 'rivergate')!.monsterZones[0]!.level = 0;
	const errs = validateRegion(a);
	assert.ok(errs.some((e) => e.startsWith('mossrift') && e.includes('ngoài khoảng cấp')));
	assert.ok(errs.some((e) => e.startsWith('rivergate') && e.includes('ngoài khoảng cấp')));
	assert.ok(validateRegion(a, [1, 20]).every((e) => !e.startsWith('mossrift')), 'khoảng cấp vùng khác thì đạt');

	// Bầy Bờ đông của Bãi Bồi dời vào cột 38 (sông hàng 30 ở cột 33–35 — cách 3 ô): bị bắt; khu boss không xét.
	const b = clone();
	const flats = b.find((m) => m.id === 'riverflats')!;
	const bank = flats.monsterZones.find((z) => z.id === 'rf_east_bank')!;
	bank.x = 38 * 48 + 24;
	assert.ok(validateRegion(b).some((e) => e.startsWith('riverflats') && e.includes('rf_east_bank') && e.includes('cách nước')));
	const cave = b.find((m) => m.id === 'gargoyle_cave')!;
	const hall = cave.monsterZones.find((z) => z.boss)!;
	Object.assign(hall, { x: 22 * 48 + 24, y: 30 * 48 + 24 });
	assert.ok(!validateRegion(b).some((e) => e.includes('gc_hall')), 'khu boss đứng cạnh suối vẫn được');

	// Khu tuổi thơ thiếu untilAge (người lớn sẽ thấy bầy cấp 1, EXP bị chặn nhầm) / untilAge 16 / không ghi tuổi.
	const c = clone();
	const zones = c.find((m) => m.id === 'riverflats')!.monsterZones;
	delete zones[0]!.untilAge;
	zones[1]!.untilAge = 16;
	delete zones[2]!.fromAge;
	const kidErrs = validateRegion(c).flatMap((e) => /khu tuổi thơ (\S+) .*thiếu untilAge/.exec(e)?.[1] ?? []);
	assert.deepEqual(kidErrs, ['rf_orchard', 'rf_levee', 'rf_oldbed']);
	// Khu nhiệm vụ (onDemand, không ghi tuổi — mossvale_edge của c8) không phải khu tự sinh: đạt.
	assert.ok(!validateRegion(c).some((e) => e.includes('mossvale_edge')));
	const d = clone();
	d.find((m) => m.id === 'riverflats')!.monsterZones[0]!.untilAge = 6;
	assert.ok(validateRegion(d).some((e) => e.includes('không bao giờ sinh')));
});

test('lối hai chiều phải ở hai mép đối diện (ra mép bắc → vào từ mép nam)', () => {
	const a = clone();
	const flats = a.find((m) => m.id === 'riverflats')!;
	flats.exits.find((e) => e.to === 'town')!.edge = 'W';
	assert.ok(validateRegion(a).some((e) => e.startsWith('town') && e.includes('to_riverflats') && e.includes('mép N')));
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

test('lối sang vùng khác (`vùng/map`): không bắt map đích trong vùng này; sai dạng thì báo; liệt kê để kiểm chéo', () => {
	const a = clone();
	const town = a.find((m) => m.id === 'town')!;
	town.exits.push({ ...town.exits[0]!, id: 'to_swamp', to: 'swamp/hub', toSpot: 'west_entry' });
	assert.deepEqual(validateRegion(a), []);
	assert.deepEqual(crossRegionExits('human', a), [
		{ from: 'human/town', to: 'swamp/hub', toSpot: 'west_entry' },
		{ from: 'human/rivergate', to: 'swamp/hub', toSpot: 'east_gate' },
	]);
	town.exits.at(-1)!.to = 'Swamp/../hub';
	assert.ok(validateRegion(a).some((e) => e.includes('sai dạng vùng/map')));
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

test('ô nới `+<px>`: món vẽ lấn đường lưới vài điểm vẫn đủ hình, mẩu món ô bên trong phần nới bị bỏ', () => {
	assert.deepEqual(parseSheetPath('sheet:C1_chapter1#2@2x3+3'), { sheet: 'C1_chapter1', index: 2, cols: 2, rows: 3, grow: 3 });
	const dir = mkdtempSync(join(tmpdir(), 'sheet-'));
	try {
		// Tấm 1×2 ô 20px, nền magenta. Ô 1 (dưới): khối xám 8×10 ở y 18–27 — lấn 2px lên ô 0; ô 0 có khối xanh to ở y 2–9.
		const s = createImage(20, 40);
		for (let y = 0; y < 40; y += 1) for (let x = 0; x < 20; x += 1) px(s, x, y, [255, 0, 255, 255]);
		for (let y = 18; y < 28; y += 1) for (let x = 6; x < 14; x += 1) px(s, x, y, [200, 200, 200, 255]);
		for (let y = 2; y < 10; y += 1) for (let x = 2; x < 18; x += 1) px(s, x, y, [40, 160, 60, 255]);
		writePng(join(dir, 'Z.png'), s);
		assert.equal(loadSheetCell(dir, { sheet: 'Z', index: 1, cols: 1, rows: 2 }).height, 8, 'không nới: cụt 2px trên');
		const grown = loadSheetCell(dir, { sheet: 'Z', index: 1, cols: 1, rows: 2, grow: 3 });
		assert.equal(grown.height, 10, 'nới 3px: đủ hình');
		assert.equal(grown.width, 8);
		const big = loadSheetCell(dir, { sheet: 'Z', index: 1, cols: 1, rows: 2, grow: 11 });
		assert.equal(big.height, 10, 'phần nới chạm khối xanh của ô 0 (sát mép, nhỏ hơn) → bỏ như mẩu lấn');
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

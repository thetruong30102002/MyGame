// Chạy: npx tsx tests/worldmap.test.ts — dữ liệu bản đồ lớn ba tầng (phím M — docs/ke-hoach-the-gioi.md mục 3 / 3.1):
// toạ độ 10 vùng trên tranh lục địa (đủ vùng, khớp regions.ts, trong 0–1, đúng hướng bảng mục 3.1, tâm nằm trong đường bao của
// chính vùng đó, các đường bao không chồng nhau), tranh đã dựng vào web khớp từng byte ảnh nguồn PixelLab, sơ đồ 12 map vùng 1
// (đủ map, lối đúng hướng, đường nối không cắt ngang nút), khoảng cấp / boss của nút, trạng thái vùng theo cổng. Không cần trình duyệt.
// Kiểm thư mục nháp: AETHER_WEB_ASSETS=<thư mục> npx tsx tests/worldmap.test.ts.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { REGIONS, regionDef, regionGate } from '@aether/sim/regions';
import { EDGE_DIR } from '../src/game/world/exits';
import type { WorldIndexData } from '../src/game/world/WorldIndex';
import {
	CONTINENT,
	CONTINENT_PLACES,
	exitEdge,
	inPolygon,
	mapBosses,
	mapLevels,
	outlinePath,
	placeAt,
	placeBox,
	REGION_LAYOUTS,
	regionGraph,
	regionStatus,
	statusText,
	type Pt,
} from '../src/game/world/worldAtlas';

let passed = 0;
const test = (name: string, fn: () => void): void => {
	fn();
	passed += 1;
	console.log(`  ✔ ${name}`);
};
console.log('bản đồ lớn: tranh lục địa + sơ đồ vùng');

/** Thư mục assets (có `/` cuối) — public hoặc thư mục nháp `AETHER_WEB_ASSETS` (như tests/region.ts). */
const ASSETS = process.env.AETHER_WEB_ASSETS ? pathToFileURL(`${resolve(process.env.AETHER_WEB_ASSETS)}/`) : new URL('../public/assets/', import.meta.url);
const SOURCE = new URL('../../../packages/asset-pipeline/sources/pixellab/world/continent.png', import.meta.url);
const world = JSON.parse(readFileSync(new URL('maps/human/world.json', ASSETS), 'utf8')) as WorldIndexData;

/** Rộng × cao của ảnh PNG (khối IHDR ngay sau chữ ký 8 byte). */
const pngSize = (buf: Buffer): [number, number] => {
	assert.equal(buf.subarray(1, 4).toString('latin1'), 'PNG', 'không phải PNG');
	return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
};
/** Diện tích có dấu (công thức dây giày) — dương = theo chiều kim đồng hồ trên màn (trục y hướng xuống). */
const signedArea = (o: readonly Pt[]): number => o.reduce((a, [x, y], i) => a + x * o[(i + 1) % o.length]![1] - o[(i + 1) % o.length]![0] * y, 0) / 2;

const ids = REGIONS.map((r) => r.id);
const center = (id: string): Pt => CONTINENT_PLACES[id]!.center;

test('tranh lục địa: đủ 10 vùng của regions.ts, không thừa vùng lạ; khổ ảnh nguồn đúng 688×384 như CONTINENT', () => {
	assert.deepEqual(Object.keys(CONTINENT_PLACES).sort(), [...ids].sort());
	assert.ok(existsSync(SOURCE), 'thiếu ảnh nguồn sources/pixellab/world/continent.png');
	assert.deepEqual(pngSize(readFileSync(SOURCE)), [CONTINENT.width, CONTINENT.height]);
});

test('ảnh tranh trong web (`ui/world-continent.png`) giống từng byte ảnh nguồn', () => {
	const file = new URL(CONTINENT.url.replace(/^\/assets\//, ''), ASSETS);
	if (!existsSync(file)) {
		// Bản thật (public) chỉ có tranh sau khi triển khai — dựng thử nằm ở thư mục nháp.
		assert.ok(!process.env.AETHER_WEB_ASSETS, `thiếu ${file.pathname} — chạy AETHER_WEB_ASSETS=<thư mục> npm run assets:world`);
		console.log(`    (bỏ qua: ${file.pathname} chưa có — triển khai: npm run assets:world hoặc chép từ .aether-stage/assets/ui/)`);
		return;
	}
	assert.ok(readFileSync(file).equals(readFileSync(SOURCE)), 'tranh trong web khác ảnh nguồn — dựng lại bằng npm run assets:world');
});

test('toạ độ trong 0–1; đường bao ≥ 3 đỉnh, cùng chiều kim đồng hồ (ranh chung triệt tiêu khi gộp đường), tâm nằm trong hộp bao', () => {
	for (const id of ids) {
		const p = CONTINENT_PLACES[id]!;
		assert.ok(p.outline.length >= 3, `${id}: đường bao quá ít đỉnh`);
		for (const [x, y] of [p.center, ...p.outline]) assert.ok(x >= 0 && x <= 1 && y >= 0 && y <= 1, `${id}: điểm (${x}, ${y}) ngoài ảnh`);
		assert.ok(signedArea(p.outline) > 0.004, `${id}: đường bao phải theo chiều kim đồng hồ và không suy biến (${signedArea(p.outline)})`);
		const [x0, y0, x1, y1] = placeBox(p.outline);
		assert.ok(x0 < p.center[0] && p.center[0] < x1 && y0 < p.center[1] && p.center[1] < y1, `${id}: tâm ngoài hộp bao`);
	}
});

test('tâm của mỗi vùng nằm trong đường bao của chính nó và không lọt vào vùng khác (rê / chạm đúng vùng)', () => {
	for (const id of ids) {
		const [x, y] = center(id);
		assert.ok(inPolygon(x, y, CONTINENT_PLACES[id]!.outline), `${id}: tâm ngoài đường bao`);
		for (const other of ids) if (other !== id) assert.ok(!inPolygon(x, y, CONTINENT_PLACES[other]!.outline), `${id}: tâm lọt vào ${other}`);
		assert.equal(placeAt(x, y), id);
	}
	assert.equal(placeAt(0.02, 0.5), null, 'biển phía tây không thuộc vùng nào');
});

test('đường bao không chồng lên nhau (lưới 200×120 điểm: < 0,5% điểm đất thuộc 2 vùng) và phủ phần lớn tranh', () => {
	let land = 0;
	let both = 0;
	for (let i = 0; i < 200; i += 1) {
		for (let j = 0; j < 120; j += 1) {
			const x = (i + 0.5) / 200;
			const y = (j + 0.5) / 120;
			const n = ids.filter((id) => inPolygon(x, y, CONTINENT_PLACES[id]!.outline)).length;
			if (n) land += 1;
			if (n > 1) both += 1;
		}
	}
	assert.ok(both / land < 0.005, `chồng ${both}/${land} điểm`);
	assert.ok(land / (200 * 120) > 0.5, `10 vùng chỉ phủ ${Math.round((land / 24000) * 100)}% tranh`);
});

test('đúng bố cục bảng mục 3.1: giữa Thistlewood, Bắc / Nam / Đông / Tây, bốn góc, Vực Hư Không ngoài khơi góc Đông Bắc', () => {
	const [hx, hy] = center('human');
	assert.ok(hx > 0.35 && hx < 0.65 && hy > 0.35 && hy < 0.65, 'Thistlewood ở giữa');
	const at = (id: string): { dx: number; dy: number } => ({ dx: center(id)[0] - hx, dy: center(id)[1] - hy });
	const near = (v: number): boolean => Math.abs(v) < 0.15;
	assert.ok(at('tundra').dy < -0.15 && near(at('tundra').dx), 'Bắc: Lãnh nguyên');
	assert.ok(at('desert').dy > 0.15 && near(at('desert').dx), 'Nam: Sa mạc');
	assert.ok(at('volcano').dx > 0.15 && near(at('volcano').dy), 'Đông: Núi lửa');
	assert.ok(at('fungal').dx < -0.15 && near(at('fungal').dy), 'Tây: Rừng Nấm');
	assert.ok(at('ruins').dx < -0.15 && at('ruins').dy < -0.15, 'Tây Bắc: Phế tích');
	assert.ok(at('highland').dx > 0.1 && at('highland').dy < -0.15, 'Đông Bắc: Cao nguyên');
	assert.ok(at('swamp').dx < -0.15 && at('swamp').dy > 0.15, 'Tây Nam: Đầm lầy');
	assert.ok(at('isles').dx > 0.15 && at('isles').dy > 0.15, 'Đông Nam: Quần đảo');
	for (const id of ids) if (id !== 'void') assert.ok(center('void')[0] > center(id)[0], `Vực Hư Không xa về đông hơn ${id}`);
	assert.ok(at('void').dy < -0.15, 'Vực Hư Không ở phía bắc');
});

test('outlinePath: mỗi vùng một nét con, toạ độ nhân theo cỡ hiện (1× / 2×)', () => {
	const p1 = outlinePath(['swamp', 'desert'], CONTINENT.width, CONTINENT.height);
	assert.equal(p1.match(/M/g)?.length, 2);
	assert.equal(p1.match(/Z/g)?.length, 2);
	const [x, y] = CONTINENT_PLACES.swamp!.outline[0]!;
	assert.ok(p1.startsWith(`M${+(x * CONTINENT.width).toFixed(1)} ${+(y * CONTINENT.height).toFixed(1)}L`));
	assert.ok(outlinePath(['swamp'], CONTINENT.width * 2, CONTINENT.height * 2).startsWith(`M${+(x * CONTINENT.width * 2).toFixed(1)} `));
	assert.equal(outlinePath([], 688, 384), '');
});

test('mọi vùng có hệ nguyên tố + hệ quái yếu (thẻ vùng)', () => {
	for (const r of REGIONS) assert.ok(r.element.name && r.element.weak, `${r.id}: thiếu nguyên tố`);
	assert.deepEqual(regionDef('human')!.element, { name: 'Bóng tối', weak: 'Hoả, Aether' });
});

test('trạng thái vùng: đang ở / đang xây dựng / cần cấp + boss chúa vùng trước / đã mở — cùng luật cổng vùng', () => {
	const ctx = { level: 5, bossKills: {} };
	assert.deepEqual(regionStatus('human', 'human', ctx), { kind: 'here' });
	assert.equal(statusText(regionStatus('human', 'human', ctx)), 'Bạn đang ở đây');
	// Vùng 2–7 đã có map từ 10/10/2026 — "đang xây dựng" giờ chỉ còn vùng 8–10.
	assert.deepEqual(regionStatus('void', 'human', ctx), { kind: 'building' });
	assert.equal(statusText(regionStatus('void', 'human', ctx)), 'Đang xây dựng');
	assert.deepEqual(regionStatus('human', 'swamp', ctx), { kind: 'open' }, 'vùng đầu luôn mở');
	// Giả vùng 2 đã có map (đổi tạm rồi trả lại): cổng xét cấp 10 + Quỷ vương rừng sâu.
	const swamp = regionDef('swamp')!;
	const was = swamp.ready;
	(swamp as { ready: boolean }).ready = true;
	try {
		const locked = regionStatus('swamp', 'human', ctx);
		assert.deepEqual(locked, { kind: 'locked', level: 10, levelOk: false, chief: 'Quỷ vương rừng sâu', chiefOk: false });
		assert.equal(statusText(locked), 'Cần cấp 10 + hạ Quỷ vương rừng sâu');
		assert.deepEqual(regionStatus('swamp', 'human', { level: 12, bossKills: {} }), { kind: 'locked', level: 10, levelOk: true, chief: 'Quỷ vương rừng sâu', chiefOk: false });
		const open = { level: 12, bossKills: { boss_demon_001: 1 } };
		assert.deepEqual(regionStatus('swamp', 'human', open), { kind: 'open' });
		assert.equal(regionGate('swamp', open), null, 'đã mở trên bản đồ ⇔ cổng cho qua');
		assert.match(regionGate('swamp', ctx)!, /Cần cấp 10 để vào Đầm lầy Mù Sương \(bạn đang cấp 5\)/, 'câu báo của cổng giữ nguyên');
		assert.match(regionGate('swamp', { level: 12, bossKills: {} })!, /Hạ Quỷ vương rừng sâu ở Thung lũng Thistlewood trước đã/);
	} finally {
		(swamp as { ready: boolean }).ready = was;
	}
});

test('khoảng cấp + boss của nút map (world.json): trạm an toàn, map cũ lấy cấp gốc của quái, map mới theo `levels` của pipeline', () => {
	const m = world.maps;
	assert.equal(mapLevels(m.town!), null);
	assert.deepEqual(mapLevels(m.mossvale!), [2, 2], 'nấm cấp gốc 2');
	assert.deepEqual(mapLevels(m.graveyard!), [4, 4], 'xác sống cấp gốc 4 — Vua Lich không tính vào khoảng');
	assert.deepEqual(mapLevels(m.riverflats!), [1, 4], 'khu tuổi thơ cấp 1 + khu 16+ cấp 3–4');
	assert.deepEqual(mapLevels(m.gargoyle_cave!), [8, 9]);
	assert.equal(mapLevels(m.shrine!), null, 'thánh địa chỉ có boss chúa');
	assert.deepEqual(mapBosses(m.shrine!), ['boss_demon_001']);
	assert.deepEqual(mapBosses(m.graveyard!), ['boss_lich_001']);
	assert.deepEqual(mapBosses(m.gargoyle_cave!), ['boss_stone_gargoyle_001']);
	assert.deepEqual(mapBosses(m.mossvale!), []);
});

test('sơ đồ vùng 1: đủ 12 map của world.json, mỗi map một ô riêng, 14 đường nối + cổng sang Đầm lầy ở phía tây Hẻm Cửa Sông', () => {
	const layout = REGION_LAYOUTS.human!;
	assert.deepEqual(Object.keys(layout.nodes).sort(), Object.keys(world.maps).sort());
	const g = regionGraph(world);
	assert.equal(g.nodes.length, 12);
	assert.equal(g.links.length, 14, 'thiết kế 12 map: 14 cạnh trong vùng');
	for (const a of g.nodes) for (const b of g.nodes) if (a !== b) assert.ok(Math.hypot(a.col - b.col, a.row - b.row) >= 1, `${a.id} chồng ${b.id}`);
	assert.equal(g.gates.length, 1);
	const gate = g.gates[0]!;
	assert.deepEqual({ from: gate.from, to: gate.to, region: gate.region, edge: gate.edge }, { from: 'rivergate', to: 'swamp/hub', region: 'swamp', edge: 'W' });
	for (const n of g.nodes) assert.ok(Math.hypot(n.col - gate.col, n.row - gate.row) >= 1, `cổng chồng ${n.id}`);
	assert.equal(g.nodes.find((n) => n.hub)?.id, 'town', 'trạm = map hub của vùng');
	assert.ok(g.col0 <= 0 && g.row0 <= 0 && g.cols >= 4 && g.rows >= 6);
});

test('sơ đồ vùng 1: mọi lối đúng hướng trên sơ đồ (lối mép bắc → map kia ở phía trên…), đường nối không cắt ngang nút khác', () => {
	const at = REGION_LAYOUTS.human!.nodes;
	for (const [id, m] of Object.entries(world.maps)) {
		for (const e of m.exits) {
			if (e.to.includes('/')) continue;
			const d = EDGE_DIR[exitEdge(m, e)];
			const dx = at[e.to]![0] - at[id]![0];
			const dy = at[e.to]![1] - at[id]![1];
			if (d.x) assert.ok(Math.sign(dx) === d.x, `${id} → ${e.to}: lối mép ${exitEdge(m, e)} nhưng trên sơ đồ lệch ngang ${dx}`);
			if (d.y) assert.ok(Math.sign(dy) === d.y, `${id} → ${e.to}: lối mép ${exitEdge(m, e)} nhưng trên sơ đồ lệch dọc ${dy}`);
		}
	}
	// Khoảng cách từ tâm nút khác tới đoạn nối (đơn vị ô) — dưới 0,42 ô là đường chui qua giữa nút.
	const dist = (p: Pt, a: Pt, b: Pt): number => {
		const [px, py] = p;
		const [ax, ay] = a;
		const [bx, by] = b;
		const t = Math.max(0, Math.min(1, ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2)));
		return Math.hypot(px - (ax + t * (bx - ax)), py - (ay + t * (by - ay)));
	};
	const g = regionGraph(world);
	for (const [a, b] of g.links) {
		for (const n of g.nodes) {
			if (n.id === a || n.id === b) continue;
			assert.ok(dist([n.col, n.row], at[a]!, at[b]!) > 0.42, `đường ${a}–${b} cắt qua nút ${n.id}`);
		}
	}
});

test('mép của lối tính từ toạ độ dải lối (world.json chỉ ghi tâm dải)', () => {
	const m = { width: 2400, height: 2496 };
	assert.equal(exitEdge(m, { x: 2376, y: 1272 }), 'E');
	assert.equal(exitEdge(m, { x: 1080, y: 24 }), 'N');
	assert.equal(exitEdge(m, { x: 1080, y: 2472 }), 'S');
	assert.equal(exitEdge(m, { x: 24, y: 1032 }), 'W');
});

test('vùng chưa khai sơ đồ: map xếp nối đuôi thành hàng, không mất map nào', () => {
	const g = regionGraph({ region: 'swamp', start: 'hub', maps: { hub: { ...world.maps.town!, exits: [] }, a: { ...world.maps.mossvale!, exits: [] } } }, undefined);
	assert.deepEqual(
		g.nodes.map((n) => [n.id, n.col, n.row]),
		[
			['hub', 0, 0],
			['a', 1, 0],
		],
	);
	assert.equal(g.nodes.find((n) => n.id === 'hub')?.hub, true);
});

console.log(`${passed} test qua`);

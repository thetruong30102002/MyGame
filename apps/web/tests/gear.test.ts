// Chạy: npx tsx tests/gear.test.ts — đồ mặc lên người: chọn neo + trước/sau thân theo hướng, ẩn lớp vũ khí dán ngoài trong động
// tác đã vẽ liền vũ khí, kiếm / trượng vẽ liền thân (không dán ảnh, chọn bản đứng / đi cầm theo thế), chọn bộ trang phục, nhuộm/viền
// độ hiếm, mã hoá gửi qua mạng (tương thích ngược), neo trong atlas đã xuất. AETHER_WEB_ASSETS = thư mục nháp → kiểm atlas dựng thử.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { cleanGearView, GEAR_RARITY_LEVELS, GEAR_VIEW_SLOTS } from '@aether/protocol';
import { DIRECTIONS, HELD_ARTS, type Direction } from '../src/game/assets/AssetManifest';
import { RARITY_ORDER, type GearState } from '../src/game/equipment';
import { GEAR_ART, HELD_BODY_ACTIONS, heldAction, heldAnimation, type GearArt } from '../src/game/gearArt';
import { baseOfOutfit, decodeGear, defaultStance, encodeGear, figureGear, gearPieces, heldArt, layoutPiece, outfitSprite, slotRule, stanceAfter, viewFor, wieldedPieces, type GearAnchors } from '../src/game/gearLayers';
import { GEAR_PAD, gripIn, halve, prepareGearPixels, RARITY_FX, type Pixels } from '../src/game/gearPixels';

let passed = 0;
const test = (name: string, fn: () => void): void => {
	fn();
	passed += 1;
	console.log(`  ✔ ${name}`);
};
console.log('gear (đồ mặc lên người)');

const A: GearAnchors = { top: [40, 8], head: [40, 18], back: [40, 29], handL: [21, 57], handR: [52, 57] };
const ART: Record<string, GearArt> = {
	blade: { slot: 'main', views: { S: { src: 's.png', w: 10, h: 20, grip: [2, 18] }, E: { src: 'e.png', w: 10, h: 20, grip: [3, 17] }, N: { src: 'n.png', w: 10, h: 20, grip: [4, 16], flip: true } } },
	shield: { slot: 'off', views: { S: { src: 'sh.png', w: 12, h: 12, grip: [6, 6] } } },
	cloak: { slot: 'back', views: { S: { src: 'c.png', w: 30, h: 40, grip: [15, 0] } } },
	cap: { slot: 'head', views: { S: { src: 'h.png', w: 20, h: 10, grip: [10, 9] } } },
};

test('nhìn trước (S): vũ khí ở tay TRÁI màn hình, tay phụ tay phải, cả hai trước thân; áo choàng sau thân; mũ ở đỉnh đầu', () => {
	assert.deepEqual(slotRule('S', 'main'), { anchor: 'handL', front: true });
	assert.deepEqual(slotRule('S', 'off'), { anchor: 'handR', front: true });
	assert.equal(slotRule('S', 'back').front, false);
	assert.deepEqual(slotRule('S', 'head'), { anchor: 'top', front: true });
});

test('nhìn sau (N): vũ khí + tay phụ SAU thân, áo choàng TRƯỚC thân (thấy lưng); mũ luôn trước', () => {
	assert.equal(slotRule('N', 'main').front, false);
	assert.equal(slotRule('N', 'off').front, false);
	assert.equal(slotRule('N', 'back').front, true);
	assert.equal(slotRule('NE', 'back').front, true);
	for (const d of DIRECTIONS) assert.equal(slotRule(d, 'head').front, true, d);
});

test('nhìn ngang (E): vũ khí trước thân ở tay phía trước; tay phụ sau thân, lùi về phía lưng', () => {
	assert.deepEqual(slotRule('E', 'main'), { anchor: 'handR', front: true });
	assert.deepEqual(slotRule('E', 'off'), { anchor: 'handR', dx: -4, front: false });
});

test('hướng tây = lật gương hướng đông: đổi tay trái/phải màn hình, đảo dấu dx, giữ trước/sau', () => {
	const pairs: [Direction, Direction][] = [['W', 'E'], ['SW', 'SE'], ['NW', 'NE']];
	for (const [w, e] of pairs) {
		for (const slot of ['head', 'main', 'off', 'back'] as const) {
			const a = slotRule(w, slot);
			const b = slotRule(e, slot);
			assert.equal(a.front, b.front, `${w}/${slot}`);
			const swap: Record<string, string> = { handL: 'handR', handR: 'handL' };
			assert.equal(a.anchor, swap[b.anchor] ?? b.anchor, `${w}/${slot}`);
			assert.equal((a.dx ?? 0) + (b.dx ?? 0), 0, `${w}/${slot} dx đảo dấu`);
		}
	}
});

test('ảnh theo hướng: S/SE/SW → S, E/W → E, chéo bắc → N; hướng tây lật (XOR với lật của ảnh); thiếu ảnh thì dùng S', () => {
	const b = ART.blade!;
	assert.equal(viewFor(b, 'SE')!.img.src, 's.png');
	assert.equal(viewFor(b, 'SW')!.flip, true);
	assert.equal(viewFor(b, 'W')!.img.src, 'e.png');
	assert.equal(viewFor(b, 'W')!.flip, true);
	assert.equal(viewFor(b, 'NE')!.img.src, 'n.png');
	assert.equal(viewFor(b, 'NE')!.flip, true, 'ảnh N tự khai flip');
	assert.equal(viewFor(b, 'NW')!.flip, false, 'flip của ảnh XOR lật gương = không lật');
	assert.equal(viewFor(ART.shield!, 'N')!.img.src, 'sh.png');
});

test('layoutPiece: đặt điểm nắm trùng neo (cộng dx), trả null khi id lạ / sai ô / động tác ra đòn (ẩn đồ cầm tay)', () => {
	assert.deepEqual(layoutPiece({ slot: 'main', id: 'blade' }, A, 'S', 'idle', ART), { x: 21, y: 57, front: true, flip: false, img: ART.blade!.views.S });
	assert.deepEqual(layoutPiece({ slot: 'off', id: 'shield' }, A, 'E', 'walk', ART)?.x, 52 - 4);
	assert.equal(layoutPiece({ slot: 'main', id: 'nope' }, A, 'S', 'idle', ART), null);
	assert.equal(layoutPiece({ slot: 'off', id: 'blade' }, A, 'S', 'idle', ART), null, 'kiếm khai ô main không vẽ ở ô off');
	assert.equal(layoutPiece({ slot: 'main', id: 'blade' }, A, 'S', 'attack', ART), null, 'atlas chém đã vẽ kiếm');
	assert.equal(layoutPiece({ slot: 'off', id: 'shield' }, A, 'S', 'cast', ART), null, 'atlas niệm đã vẽ trượng');
	assert.ok(layoutPiece({ slot: 'head', id: 'cap' }, A, 'S', 'attack', ART), 'mũ không bị ẩn khi chém');
	assert.equal(layoutPiece({ slot: 'back', id: 'cloak' }, A, 'N', 'idle', ART)?.front, true);
	const baked: Record<string, GearArt> = { blade: { ...ART.blade!, held: 'sword' } };
	for (const anim of ['idle', 'walk', 'idlesword', 'hit', 'attack']) assert.equal(layoutPiece({ slot: 'main', id: 'blade' }, A, 'S', anim, baked), null, `vẽ liền thân: không dán ở ${anim}`);
});

test('gearPieces: chỉ món có art đúng ô; độ hiếm lấy từ danh mục; ô không có lớp (nhẫn, áo) bị bỏ', () => {
	const equip: GearState['equip'] = { main: { uid: 'i1', id: 'sword' }, off: { uid: 'i2', id: 'staff' }, ring1: { uid: 'i3', id: 'sword' }, head: { uid: 'i4', id: 'unknown_hat' } };
	assert.deepEqual(gearPieces(equip), [
		{ slot: 'main', id: 'sword', rarity: 'common' },
		{ slot: 'off', id: 'staff', rarity: 'common' },
	]);
	assert.equal(GEAR_ART.sword?.slot, 'main');
	assert.equal(GEAR_ART.staff?.slot, 'off');
});

test('mạng: encode → decode giữ nguyên; bậc thường không có hậu tố; đúng số ô và chữ số bậc của giao thức', () => {
	const pieces = [
		{ slot: 'main' as const, id: 'sword', rarity: 'common' as const },
		{ slot: 'off' as const, id: 'staff', rarity: 'legendary' as const },
	];
	const v = encodeGear(pieces);
	assert.deepEqual(v, ['', 'sword', 'staff:4', '']);
	assert.deepEqual(cleanGearView(v), v, 'gói client gửi qua được bộ kiểm của máy chủ');
	assert.deepEqual(decodeGear(v), pieces);
	assert.equal(RARITY_ORDER.length, GEAR_RARITY_LEVELS);
	assert.equal(v.length, GEAR_VIEW_SLOTS.length);
});

test('tương thích ngược: máy chủ cũ (không có trường gear) / dữ liệu rác → không vẽ gì, không lỗi; món máy này chưa có art bị bỏ', () => {
	assert.deepEqual(decodeGear(undefined), []);
	assert.deepEqual(decodeGear(null), []);
	assert.deepEqual(decodeGear('sword'), []);
	assert.deepEqual(decodeGear(['', 'sword:9', 'staff', '', '', '']), [], 'quá số ô → bỏ cả gói');
	assert.deepEqual(decodeGear(['', 'future_blade:3', 'staff', '']), [{ slot: 'off', id: 'staff', rarity: 'common' }]);
	assert.deepEqual(decodeGear(['', 'staff', '', '']), [], 'trượng ở ô vũ khí chính: sai ô → bỏ');
});

test('bộ trang phục: áo có bộ cho sprite gốc VÀ bộ có trong manifest → dùng bộ; thiếu một trong hai → sprite gốc; tra ngược', () => {
	const table = { leather_armor: { player_hero_adult: 'player_hero_adult_leather', player_hero_adult_f: 'player_hero_adult_f_leather' } };
	const has = (id: string) => id !== 'player_hero_adult_f_leather';
	assert.equal(outfitSprite('player_hero_adult', 'leather_armor', has, table), 'player_hero_adult_leather');
	assert.equal(outfitSprite('player_hero_adult_f', 'leather_armor', has, table), 'player_hero_adult_f', 'bộ nữ chưa vẽ');
	assert.equal(outfitSprite('player_lior_child', 'leather_armor', has, table), 'player_lior_child', 'bộ không có bản trẻ con');
	assert.equal(outfitSprite('player_hero_adult', undefined, has, table), 'player_hero_adult');
	assert.equal(baseOfOutfit('player_hero_adult_f_leather', table), 'player_hero_adult_f');
	assert.equal(baseOfOutfit('player_hero_adult', table), null);
});

const px = (w: number, h: number, fill: (x: number, y: number) => [number, number, number, number] | null): Pixels => {
	const data = new Uint8ClampedArray(w * h * 4);
	for (let y = 0; y < h; y += 1) for (let x = 0; x < w; x += 1) {
		const c = fill(x, y);
		if (c) data.set(c, (y * w + x) * 4);
	}
	return { width: w, height: h, data };
};
const alpha = (p: Pixels, x: number, y: number) => p.data[(y * p.width + x) * 4 + 3]!;

test('độ hiếm: thường = giữ nguyên màu, chỉ thêm lề; hiếm = nhuộm + viền 1px (4 hướng) màu bậc quanh nét vẽ', () => {
	const src = px(3, 3, (x, y) => (x === 1 && y === 1 ? [100, 80, 60, 255] : null));
	const c = prepareGearPixels(src, 1, 'common');
	assert.equal(c.width, 3 + GEAR_PAD * 2);
	assert.deepEqual([...c.data.subarray((2 * 5 + 2) * 4, (2 * 5 + 2) * 4 + 4)], [100, 80, 60, 255]);
	assert.equal(c.data.filter((_, i) => i % 4 === 3 && c.data[i]! > 0).length, 1, 'thường: không viền');
	const r = prepareGearPixels(src, 1, 'rare');
	const [cr, cg, cb] = RARITY_FX.rare!.color;
	for (const [x, y] of [[1, 2], [3, 2], [2, 1], [2, 3]]) assert.deepEqual([...r.data.subarray((y * 5 + x) * 4, (y * 5 + x) * 4 + 3)], [cr, cg, cb], `viền ở ${x},${y}`);
	assert.equal(alpha(r, 1, 1), 0, 'góc chéo không viền (giữ nét pixel)');
	assert.notDeepEqual([...r.data.subarray((2 * 5 + 2) * 4, (2 * 5 + 2) * 4 + 3)], [100, 80, 60], 'nét vẽ được nhuộm');
});

test('thu ½ kiểu pixel art: mỗi ô 2×2 giữ điểm có hình đầu tiên (nét 1px không mất); điểm nắm thu theo + lề', () => {
	const src = px(4, 2, (x) => (x === 1 || x === 3 ? [9, 9, 9, 255] : null));
	const h = halve(src);
	assert.equal(h.width, 2);
	assert.equal(alpha(h, 0, 0), 255);
	assert.equal(alpha(h, 1, 0), 255);
	assert.deepEqual(gripIn([12, 37], 0.5), [6 + GEAR_PAD, 19 + GEAR_PAD]);
});

test('figureGear (kho đồ): cùng luật với game — góc ảnh = neo − điểm nắm, cỡ = ảnh thu + lề viền; kiếm / trượng thật không dán', () => {
	const icon = { src: 'sw.png', w: 49, h: 49, grip: [12, 37] as [number, number], scale: 0.5 as const, flip: true };
	const T: Record<string, GearArt> = { blade: { slot: 'main', wield: 'melee', views: { S: icon } } };
	const [g] = figureGear([{ slot: 'main', id: 'blade', rarity: 'rare' }], A, 'S', 'idle', T);
	const [gx, gy] = gripIn(icon.grip, 0.5);
	assert.equal(g!.left, A.handL[0] - gx);
	assert.equal(g!.top, A.handL[1] - gy);
	assert.equal(g!.w, Math.ceil(icon.w / 2) + GEAR_PAD * 2);
	assert.equal(g!.flip, true);
	assert.equal(g!.front, true);
	assert.deepEqual(figureGear([{ slot: 'main', id: 'blade', rarity: 'common' }], undefined, 'S', 'idle', T), [], 'atlas chưa có neo → không vẽ');
	const real = [{ slot: 'main' as const, id: 'sword', rarity: 'rare' as const }, { slot: 'off' as const, id: 'staff', rarity: 'common' as const }];
	assert.deepEqual(figureGear(real, A, 'S', 'idlesword'), [], 'kiếm / trượng nằm sẵn trong khung đứng cầm vũ khí');
});

/** Thư mục assets: public (bản người chơi đang chạy) hoặc thư mục nháp `AETHER_WEB_ASSETS` (atlas dựng thử, như tests/region.ts). */
const ASSETS = process.env.AETHER_WEB_ASSETS ? pathToFileURL(`${resolve(process.env.AETHER_WEB_ASSETS)}/`) : new URL('../public/assets/', import.meta.url);

test('atlas đã xuất: mọi khung của 4 sprite người chơi có neo hợp lệ (trong khung, tay dưới vai, đỉnh trên tâm đầu)', () => {
	for (const id of ['player_hero_adult', 'player_hero_adult_f', 'player_lior_child', 'player_lior_child_f']) {
		const j = JSON.parse(readFileSync(new URL(`characters/${id}/${id}.json`, ASSETS), 'utf8')) as { frames: Record<string, { frame: { w: number; h: number }; gear?: GearAnchors }> };
		for (const [name, f] of Object.entries(j.frames)) {
			const g = f.gear;
			assert.ok(g, `${name} thiếu neo — chạy npm run assets:anchors`);
			for (const p of Object.values(g)) assert.ok(p[0] >= 0 && p[0] < f.frame.w && p[1] >= 0 && p[1] < f.frame.h, `${name} neo ngoài khung`);
			assert.ok(g.top[1] < g.head[1] && g.head[1] < g.back[1], `${name} đỉnh < tâm đầu < vai`);
			assert.ok(g.handL[1] >= g.back[1] && g.handR[1] >= g.back[1], `${name} tay dưới vai`);
			assert.ok(g.handL[0] <= g.handR[0], `${name} tay trái màn hình nằm bên trái`);
		}
	}
});

test('thế cầm: mỗi lúc chỉ MỘT loại vũ khí — chém thì cầm kiếm, niệm thì cầm gậy, đứng/đi giữ thế trước; khiên/mũ luôn hiện', () => {
	assert.equal(GEAR_ART.sword!.wield, 'melee');
	assert.equal(GEAR_ART.staff!.wield, 'magic');
	assert.equal(stanceAfter('attack', 'magic'), 'melee');
	assert.equal(stanceAfter('cast', 'melee'), 'magic');
	assert.deepEqual([stanceAfter('idle', 'magic'), stanceAfter('walk', 'melee'), stanceAfter(undefined, 'magic')], ['magic', 'melee', 'magic'], 'đứng / đi giữ thế');
	assert.deepEqual([defaultStance('mage'), defaultStance('sword'), defaultStance(null)], ['magic', 'melee', 'melee']);
	const T: Record<string, GearArt> = { ...ART, blade: { ...ART.blade!, wield: 'melee' }, rod: { slot: 'off', wield: 'magic', views: { S: { src: 'r.png', w: 6, h: 20, grip: [3, 18] } } } };
	const ids = (list: readonly { id: string }[]) => list.map((x) => x.id).sort();
	const both = [{ slot: 'main' as const, id: 'blade', rarity: 'common' as const }, { slot: 'off' as const, id: 'rod', rarity: 'common' as const }, { slot: 'head' as const, id: 'cap', rarity: 'common' as const }];
	assert.deepEqual(ids(wieldedPieces(both, 'melee', T)), ['blade', 'cap'], 'thế kiếm: ẩn gậy');
	assert.deepEqual(ids(wieldedPieces(both, 'magic', T)), ['cap', 'rod'], 'thế phép: ẩn kiếm');
	const sword = [{ slot: 'main' as const, id: 'blade', rarity: 'common' as const }, { slot: 'off' as const, id: 'shield', rarity: 'common' as const }];
	assert.deepEqual(ids(wieldedPieces(sword, 'magic', T)), ['blade', 'shield'], 'không có gậy: vẫn cầm kiếm đang mặc; khiên không phải vũ khí');
	assert.deepEqual(figureGear(both, A, 'S', 'idle', T, 'magic').map((g) => g.src).sort(), ['h.png', 'r.png'], 'kho đồ vẽ cùng thế');
});

test('vũ khí vẽ liền thân đang cầm (đứng / đi chọn bản `idle<món>`): theo thế, thiếu món đúng thế thì món đang có, không có thì tay không', () => {
	const sw = { slot: 'main' as const, id: 'sword', rarity: 'common' as const };
	const st = { slot: 'off' as const, id: 'staff', rarity: 'rare' as const };
	assert.equal(heldArt([sw, st], 'melee'), 'sword');
	assert.equal(heldArt([sw, st], 'magic'), 'staff');
	assert.equal(heldArt([st], 'melee'), 'staff', 'thế kiếm mà chỉ mặc trượng: cầm trượng');
	assert.equal(heldArt([sw], 'magic'), 'sword', 'thế phép mà chỉ mặc kiếm: cầm kiếm');
	assert.equal(heldArt([], 'melee'), null, 'chưa được trao vũ khí / tháo ra: tay không');
	// Vũ khí đúng thế mà CHƯA có bản vẽ liền thân (chỉ có ảnh dán) → tay không + lớp dán, không cầm nhầm món kia.
	const T: Record<string, GearArt> = { ...GEAR_ART, iron: { slot: 'main', wield: 'melee', views: { S: { src: 'i.png', w: 9, h: 20, grip: [4, 18] } } } };
	assert.equal(heldArt([{ slot: 'main', id: 'iron', rarity: 'fine' }, st], 'melee', T), null);
	assert.equal(heldArt([{ slot: 'main', id: 'iron', rarity: 'fine' }, st], 'magic', T), 'staff');
	for (const h of HELD_ARTS) assert.match(heldAnimation('idle', h), /^[a-z]+$/, 'tên khung atlas chỉ a–z');
});

test('atlas đã xuất: động tác thân bản cầm vũ khí (nếu có) cùng số khung với bản tay không ở mọi hướng đã vẽ; atlas ≤ 4096', () => {
	for (const id of ['player_hero_adult', 'player_hero_adult_f', 'player_lior_child', 'player_lior_child_f']) {
		const j = JSON.parse(readFileSync(new URL(`characters/${id}/${id}.json`, ASSETS), 'utf8')) as { animations: Record<string, string[]>; meta: { size: { w: number; h: number } } };
		assert.ok(j.meta.size.w <= 4096 && j.meta.size.h <= 4096, `${id}: atlas ${j.meta.size.w}×${j.meta.size.h} vượt 4096`);
		for (const b of HELD_BODY_ACTIONS) {
			for (const h of HELD_ARTS) {
				for (const d of DIRECTIONS) {
					const held = j.animations[`${heldAction(b, h)}_${d}`];
					if (!held) continue;
					// Cùng nhịp với bản tay không: hitFrame / thời lượng spec tính theo số khung.
					assert.equal(held.length, j.animations[`${b}_${d}`]?.length, `${id} ${heldAction(b, h)}_${d}: số khung khác bản tay không`);
				}
			}
		}
	}
});

test('atlas đã xuất có bản cầm vũ khí thì đủ 8 hướng đứng / đi cho mỗi món (thiếu hẳn = atlas cũ, game giữ tay không)', () => {
	for (const id of ['player_hero_adult', 'player_hero_adult_f', 'player_lior_child', 'player_lior_child_f']) {
		const j = JSON.parse(readFileSync(new URL(`characters/${id}/${id}.json`, ASSETS), 'utf8')) as { animations: Record<string, string[]> };
		for (const h of HELD_ARTS) {
			for (const base of ['idle', 'walk'] as const) {
				const anim = heldAnimation(base, h);
				const dirs = DIRECTIONS.filter((d) => j.animations[`${anim}_${d}`]?.length);
				if (!dirs.length) continue;
				assert.equal(dirs.length, DIRECTIONS.length, `${id} ${anim}: có ${dirs.join(',')}`);
			}
		}
	}
});

console.log(`${passed} test qua`);

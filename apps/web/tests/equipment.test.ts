// Chạy: npx tsx tests/equipment.test.ts — mô hình trang bị (mặc / tháo / đổi chỗ / chuẩn hoá bản lưu), chuyển bản lưu cũ
// sang trang bị, trao quà khi đang chơi, và đường cộng chỉ số trang bị vào CombatSystem.
import assert from 'node:assert/strict';

const store = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
	getItem: (k: string) => store.get(k) ?? null,
	setItem: (k: string, v: string) => void store.set(k, v),
	removeItem: (k: string) => void store.delete(k),
	clear: () => store.clear(),
	key: () => null,
	length: 0,
};
// DOM tối thiểu cho Pixi (CombatSystem vẽ texture hiệu ứng bằng canvas lúc dựng) — như tests/action.test.ts.
const fakeCtx = new Proxy({}, { get: () => () => undefined, set: () => true });
class FakeCanvas {
	width = 1;
	height = 1;
	style = {};
	getContext() {
		return fakeCtx;
	}
}
Object.assign(globalThis, { HTMLCanvasElement: FakeCanvas, document: { createElement: () => new FakeCanvas() }, window: globalThis });

const E = await import('../src/game/equipment');
const { BAG_SIZE, EQUIP_SLOTS, ITEMS, SLOT_KIND, addItem, canEquip, cleanGear, compareGear, emptyGear, equipItem, gearBonus, mint, shownStat, unequipItem } = E;
type GearState = import('../src/game/equipment').GearState;
type ItemDef = import('../src/game/equipment').ItemDef;

// Đồ thử: chỉ thêm vào bảng TRONG test (danh mục thật chưa có đồ có chỉ số).
const TEST_ITEMS: ItemDef[] = [
	{ id: 't_cap', name: 'Mũ vải', desc: '', icon: '', w: 0, h: 0, kind: 'equip', equip: 'head', stats: { def: 2 } },
	{ id: 't_blade', name: 'Kiếm sắt', desc: '', icon: '', w: 0, h: 0, kind: 'equip', equip: 'weapon', stats: { atk: 6, crit: 2 }, levelReq: 10 },
	{ id: 't_stick', name: 'Gậy', desc: '', icon: '', w: 0, h: 0, kind: 'equip', equip: 'weapon', stats: { atk: 1 } },
	{ id: 't_ring_a', name: 'Nhẫn A', desc: '', icon: '', w: 0, h: 0, kind: 'equip', equip: 'ring', stats: { hp: 10 } },
	{ id: 't_ring_b', name: 'Nhẫn B', desc: '', icon: '', w: 0, h: 0, kind: 'equip', equip: 'ring', stats: { mp: 5 } },
	{ id: 't_ring_c', name: 'Nhẫn C', desc: '', icon: '', w: 0, h: 0, kind: 'equip', equip: 'ring', stats: { mag: 3 } },
	{ id: 't_kid_cap', name: 'Mũ người lớn', desc: '', icon: '', w: 0, h: 0, kind: 'equip', equip: 'head', ageReq: 16 },
];
for (const d of TEST_ITEMS) ITEMS[d.id] = d;

/** Túi dựng sẵn: mỗi id một món (mint tuần tự). */
function bagOf(ids: string[], base: GearState = emptyGear()): GearState {
	let g = base;
	for (const id of ids) {
		const m = mint(g, id);
		g = { ...m.g, bag: [...m.g.bag, m.stack] };
	}
	return g;
}
const frozen = <T>(o: T): T => JSON.parse(JSON.stringify(o)) as T;

// 1) Danh mục: mọi món `equip` có loại hợp lệ, id khớp khoá và là duy nhất, `stack ≥ 1`; mỗi loại có ít nhất một ô.
{
	const kinds = new Set(Object.values(SLOT_KIND));
	const ids = new Set<string>();
	for (const [key, d] of Object.entries(ITEMS)) {
		assert.equal(d.id, key, `id ${d.id} khớp khoá`);
		assert.ok(!ids.has(d.id), `id ${d.id} trùng`);
		ids.add(d.id);
		if (d.kind === 'equip') assert.ok(d.equip && kinds.has(d.equip), `${d.id}: loại trang bị hợp lệ`);
		assert.ok((d.stack ?? 1) >= 1, `${d.id}: stack ≥ 1`);
	}
	assert.equal(EQUIP_SLOTS.length, 10, '10 ô (có Găng + 2 Nhẫn)');
	for (const id of ['sword', 'staff']) {
		const d = ITEMS[id]!;
		assert.ok(d.bound && d.kind === 'equip' && !d.stats, `${id}: kỷ vật, chỉ số 0 (cân bằng không đổi)`);
	}
	assert.equal(ITEMS.sword!.equip, 'weapon');
	assert.equal(ITEMS.staff!.equip, 'offhand');
	assert.equal(ITEMS.potion!.stack, 99);
}

// 2) mint: tăng `seq`, uid xác định, không đụng túi.
{
	const g0 = emptyGear();
	const a = mint(g0, 'sword');
	const b = mint(a.g, 'staff');
	assert.deepEqual([a.stack.uid, b.stack.uid, b.g.seq], ['i1', 'i2', 2]);
	assert.deepEqual(g0, emptyGear(), 'mint không sửa state cũ');
	assert.equal(b.g.bag.length, 0, 'mint chưa bỏ vào túi');
	assert.equal(mint(emptyGear(), 'potion', 5).stack.n, 5);
}

// 3) Mặc vào ô trống: món rời túi, nằm ở ô; `gearBonus` cộng đúng (cả roll).
{
	let g = bagOf(['t_cap', 't_ring_a']);
	g = { ...g, bag: g.bag.map((s, i) => (i === 1 ? { ...s, roll: { hp: 3, crit: 1 } } : s)) };
	const before = frozen(g);
	const r = equipItem(g, 'i1', undefined, 1, 16);
	assert.ok(typeof r !== 'string');
	assert.deepEqual(g, before, 'equipItem bất biến');
	assert.equal(r.equip.head?.uid, 'i1');
	assert.deepEqual(r.bag.map((s) => s.uid), ['i2']);
	const r2 = equipItem(r, 'i2', undefined, 1, 16) as GearState;
	assert.equal(r2.equip.ring1?.uid, 'i2', 'nhẫn vào ô nhẫn trống đầu tiên');
	assert.deepEqual(gearBonus(r2), { atk: 0, mag: 0, def: 2, hp: 13, mp: 0, crit: 1, move: 0 }, 'gốc + roll');
}

// 4) Đổi chỗ: món cũ về ĐÚNG vị trí cũ của món mới trong túi.
{
	let g = bagOf(['t_stick', 't_cap', 't_blade', 't_ring_a']);
	g = equipItem(g, 'i1', 'main', 20, 16) as GearState;
	assert.deepEqual(g.bag.map((s) => s.uid), ['i2', 'i3', 'i4']);
	const r = equipItem(g, 'i3', undefined, 20, 16) as GearState;
	assert.equal(r.equip.main?.uid, 'i3');
	assert.deepEqual(r.bag.map((s) => s.uid), ['i2', 'i1', 'i4'], 'gậy cũ về chỗ của kiếm sắt (chỉ số 1)');
	assert.equal(gearBonus(r).atk, 6);
}

// 5) Nhẫn: ô trống đầu tiên; đầy cả hai mà không chỉ định thì thay ring1; chỉ định ring2 thì thay ring2. Đổi ô giữa hai nhẫn.
{
	let g = bagOf(['t_ring_a', 't_ring_b', 't_ring_c']);
	g = equipItem(g, 'i2', 'ring2', 1, 16) as GearState;
	g = equipItem(g, 'i1', undefined, 1, 16) as GearState;
	assert.deepEqual([g.equip.ring1?.uid, g.equip.ring2?.uid], ['i1', 'i2'], 'ring2 có đồ → vào ring1 đang trống');
	const auto = equipItem(g, 'i3', undefined, 1, 16) as GearState;
	assert.deepEqual([auto.equip.ring1?.uid, auto.equip.ring2?.uid, auto.bag.map((s) => s.uid)], ['i3', 'i2', ['i1']], 'cả hai đầy → thay ring1');
	const r2 = equipItem(g, 'i3', 'ring2', 1, 16) as GearState;
	assert.deepEqual([r2.equip.ring1?.uid, r2.equip.ring2?.uid, r2.bag.map((s) => s.uid)], ['i1', 'i3', ['i2']], 'chỉ định ring2 → thay ring2');
	const swap = equipItem(g, 'i1', 'ring2', 1, 16) as GearState;
	assert.deepEqual([swap.equip.ring1?.uid, swap.equip.ring2?.uid], ['i2', 'i1'], 'đang mặc ở nhẫn 1 → chuyển sang nhẫn 2 = đổi chỗ');
}

// 6) Sai loại ô → chuỗi lỗi, state giữ nguyên.
{
	const g = bagOf(['t_cap', 'potion']);
	assert.equal(typeof equipItem(g, 'i1', 'main', 1, 16), 'string', 'mũ không vào ô vũ khí');
	assert.match(String(equipItem(g, 'i1', 'main', 1, 16)), /Vũ khí chính/);
	assert.equal(equipItem(g, 'i2', undefined, 1, 16), 'Món này không mặc được', 'bình không mặc được');
	assert.equal(typeof equipItem(g, 'nope', undefined, 1, 16), 'string', 'uid lạ');
	assert.equal(canEquip(ITEMS.sword!, 'off', 1, 16), 'Không mặc vào ô Tay phụ được');
	assert.equal(canEquip(ITEMS.staff!, 'off', 1, 6), true);
}

// 7) Thiếu cấp / tuổi → "Cần cấp N" / "Cần N tuổi".
{
	const g = bagOf(['t_blade', 't_kid_cap']);
	assert.equal(equipItem(g, 'i1', undefined, 9, 16), 'Cần cấp 10');
	assert.ok(typeof equipItem(g, 'i1', undefined, 10, 16) !== 'string', 'đủ cấp 10 thì mặc được');
	assert.equal(equipItem(g, 'i2', undefined, 30, 8), 'Cần 16 tuổi');
}

// 8) Tháo khi túi đầy → "Túi đầy", state cũ KHÔNG bị sửa. Tháo bình thường về cuối túi.
{
	let g = bagOf(['t_cap']);
	g = equipItem(g, 'i1', undefined, 1, 16) as GearState;
	const off = unequipItem(g, 'head') as GearState;
	assert.deepEqual([off.equip.head, off.bag.map((s) => s.uid)], [undefined, ['i1']]);
	assert.equal(unequipItem(off, 'head'), 'Ô này đang trống');
	const full = bagOf(Array.from({ length: BAG_SIZE }, () => 't_stick'), g);
	const snap = frozen(full);
	assert.equal(unequipItem(full, 'head'), 'Túi đầy');
	assert.deepEqual(full, snap, 'túi đầy: không mutate');
}

// 9) addItem: chồng bình tới 99 rồi mở chồng mới; đồ không chồng mỗi món một ô; túi đầy trả `overflow`.
{
	let r = addItem(emptyGear(), 'potion', 150);
	assert.deepEqual(r.g.bag.map((s) => s.n ?? 1), [99, 51]);
	r = addItem(r.g, 'potion', 60);
	assert.deepEqual(r.g.bag.map((s) => s.n ?? 1), [99, 99, 12], 'dồn vào chồng chưa đầy trước');
	const w = addItem(emptyGear(), 't_stick', 3);
	assert.deepEqual(w.g.bag.map((s) => [s.uid, s.n ?? 1]), [['i1', 1], ['i2', 1], ['i3', 1]]);
	const full = addItem(bagOf(Array.from({ length: BAG_SIZE - 1 }, () => 't_stick')), 't_cap', 3);
	assert.deepEqual([full.g.bag.length, full.overflow], [BAG_SIZE, 2]);
	const pot = addItem(bagOf(Array.from({ length: BAG_SIZE - 1 }, () => 't_stick')), 'potion', 120);
	assert.deepEqual([pot.g.bag.length, pot.overflow], [BAG_SIZE, 21], 'chồng 99 vào ô cuối, dư 21');
}

// 10) cleanGear: mục hỏng bỏ, uid trùng khử, sai loại ô → túi, id lạ GIỮ, vượt BAG_SIZE không mất đồ, n kẹp theo stack.
{
	assert.deepEqual(cleanGear(null), emptyGear());
	assert.deepEqual(cleanGear('rác'), emptyGear());
	assert.deepEqual(cleanGear([1, 2]), emptyGear());
	const raw = {
		seq: 3,
		equip: { main: { uid: 'i1', id: 'sword' }, head: { uid: 'i2', id: 'staff' }, off: { uid: 'i9', id: 'mystery_axe' }, cloak: { uid: 'i20', id: 't_cap' }, ring1: 7 },
		bag: [{ uid: 'i1', id: 'sword' }, { uid: 5, id: 'x' }, null, { uid: 'i3', id: 'potion', n: 500 }, { uid: 'i4', id: 'potion', n: -2 }, { uid: 'i5', id: 't_cap', n: 3, roll: { def: 1, zz: 4, atk: 'x' } }, { uid: 'i6', id: 'mystery_gem', n: 7 }],
	};
	const g = cleanGear(raw);
	assert.equal(g.equip.main?.uid, 'i1', 'đồ đúng ô giữ nguyên');
	assert.equal(g.equip.head, undefined, 'trượng nằm ở ô Mũ → về túi');
	assert.equal(g.equip.off, undefined, 'id lạ đang mặc → về túi');
	const bag = Object.fromEntries(g.bag.map((s) => [s.uid, s]));
	assert.ok(bag.i2 && bag.i9 && bag.i20, 'đồ sai ô / ô lạ / id lạ đều còn trong túi');
	assert.equal(g.bag.filter((s) => s.uid === 'i1').length, 0, 'uid trùng (đã mặc) bị khử khỏi túi');
	assert.equal(bag.i3?.n, 99, 'n kẹp theo stack');
	assert.equal(bag.i4?.n, undefined, 'n hỏng → 1');
	assert.deepEqual([bag.i5?.n, bag.i5?.roll], [undefined, { def: 1 }], 'đồ không chồng: n = 1; roll chỉ giữ số');
	assert.equal(bag.i6?.n, 7, 'id lạ giữ cả số lượng');
	assert.equal(g.seq, 20, 'seq ≥ số lớn nhất trong uid (uid mới không trùng uid cũ)');
	assert.equal(mint(g, 't_cap').stack.uid, 'i21');
	const big = { seq: 0, equip: {}, bag: Array.from({ length: BAG_SIZE + 6 }, (_, i) => ({ uid: `i${i + 1}`, id: 't_stick' })) };
	const bg = cleanGear(big);
	assert.equal(bg.bag.length, BAG_SIZE + 6, 'túi vượt BAG_SIZE: giữ nguyên, không mất đồ');
	assert.equal(addItem(bg, 't_cap').overflow, 1, '… chỉ chặn thêm đồ mới');
}

// 11) JSON stringify → parse → cleanGear cho lại đúng state.
{
	let g = bagOf(['t_cap', 't_blade', 't_ring_a', 't_ring_b']);
	g = equipItem(g, 'i1', undefined, 20, 16) as GearState;
	g = equipItem(g, 'i3', 'ring2', 20, 16) as GearState;
	g = addItem(g, 'potion', 7).g;
	g = { ...g, bag: g.bag.map((s) => (s.uid === 'i2' ? { ...s, roll: { atk: 2 } } : s)) };
	assert.deepEqual(cleanGear(JSON.parse(JSON.stringify(g))), g);
}

// Bảng so sánh trên thẻ: số trên bảng trước → sau, chỉ các chỉ số món mới hoặc món cũ có.
{
	const basis = { base: { atk: 20, mag: 20, def: 7, hp: 146, mp: 60, crit: 8, move: 0 }, scale: { atk: 1.3, mag: 0.7, def: 1, hp: 1, mp: 1, crit: 1, move: 1 } };
	assert.equal(shownStat(basis, 'atk', 0), 26);
	const g = bagOf(['t_blade', 't_stick']);
	const rows = compareGear(basis, { atk: 1 }, g.bag[0]!, g.bag[1]!);
	assert.deepEqual(rows, [
		{ key: 'atk', before: 27, after: 34 },
		{ key: 'crit', before: 8, after: 10 },
	]);
	assert.deepEqual(compareGear(basis, {}, mint(emptyGear(), 'sword').stack, null), [], 'đồ khởi đầu không có chỉ số → không dòng nào');
}

// 12–16) StoryDirector: chuyển bản lưu cũ, trao quà khi đang chơi, chơi lại, luật kỹ năng không theo đồ đang cầm.
{
	const { STORY } = await import('../src/game/story/story');
	const { StoryDirector } = await import('../src/game/story/StoryDirector');
	const { knowsSkill } = await import('../src/game/combat/talents');
	const { HERO_SKILLS } = await import('../src/game/combat/skills');
	const overflow: [string, number][] = [];
	const noop = { dialogue() {}, reward() {}, questsChanged() {}, pickups() {}, clearPickups() {}, awakenBoss() {}, spawnZone() {}, questCompleted() {}, unlocked() {}, ageChanged() {}, chapterEnd() {}, itemOverflow: (id: string, n: number) => void overflow.push([id, n]) };
	const youthDone = ['c4_silverdew', 'c4_dinner', 'c6_wooden_sword', 'c6_first_thread', 'c6_old_hat', 'c8_forest_edge', 'c8_snow', 'y1_mushrooms'];
	const oldSave = (unlocked: string[], extra: Record<string, unknown> = {}) =>
		store.set('aether.save.v2', JSON.stringify({ version: 2, index: 8, questId: 'y2_shadows', accepted: true, ready: false, progress: 0, completed: youthDone, unlocked, age: 16, player: { level: 4, exp: 0, coins: 5, potions: 2 }, talentsV: 2, talents: {}, ...extra }));

	// 12) Bản lưu cũ (không `gearV`) đã mở kiếm + trượng → kiếm ở ô Vũ khí chính, trượng ở ô Tay phụ; nạp lần 2 không nhân đôi.
	oldSave(['sword', 'staff', 'fire', 'water', 'wind', 'ice', 'earth']);
	let d = new StoryDirector(STORY, noop);
	assert.equal(d.state.gearV, 1);
	assert.deepEqual([d.gear.equip.main?.id, d.gear.equip.off?.id, d.gear.bag.length], ['sword', 'staff', 0]);
	d.save();
	d = new StoryDirector(STORY, noop);
	d.save();
	d = new StoryDirector(STORY, noop);
	const all = [...Object.values(d.gear.equip), ...d.gear.bag].map((s) => s!.id).sort();
	assert.deepEqual(all, ['staff', 'sword'], 'nạp lại nhiều lần: vẫn đúng một kiếm, một trượng');
	assert.deepEqual([d.state.player.coins, d.state.player.potions], [5, 2], 'xu / bình giữ ở `player` (HUD, phím R, máy chủ đọc)');

	// 13) Chỉ mở kiếm → chỉ có ô Vũ khí chính (mã mở tay, chưa nhận trượng). Theo cốt truyện thật trượng tới trước: đang
	// chờ cha giao kiếm thì chỉ có ô Tay phụ.
	store.set('aether.save.v2', JSON.stringify({ version: 2, index: 2, questId: 'c6_first_thread', accepted: false, ready: false, progress: 0, completed: ['c4_silverdew', 'c4_dinner'], unlocked: ['sword'], age: 6, player: { level: 1, exp: 0, coins: 0, potions: 0 } }));
	d = new StoryDirector(STORY, noop);
	assert.deepEqual([d.gear.equip.main?.id, d.gear.equip.off, d.gear.bag.length], ['sword', undefined, 0]);
	store.set('aether.save.v2', JSON.stringify({ version: 2, index: 3, questId: 'c6_wooden_sword', accepted: false, ready: false, progress: 0, completed: ['c4_silverdew', 'c4_dinner', 'c6_first_thread'], unlocked: ['staff', 'fire'], age: 6, player: { level: 2, exp: 0, coins: 0, potions: 0 } }));
	d = new StoryDirector(STORY, noop);
	assert.deepEqual([d.gear.equip.main, d.gear.equip.off?.id, d.gear.bag.length], [undefined, 'staff', 0]);

	// Bản lưu ĐÃ có trang bị, nạp ở bản game chèn thêm nhiệm vụ trao kiếm phía trước (bù quà lúc nạp): kiếm được trao
	// luôn vào ô trống, trượng đang cầm giữ nguyên; nạp lại không trao lặp.
	store.set('aether.save.v2', JSON.stringify({ version: 2, index: 3, questId: 'c6_old_hat', accepted: false, ready: false, progress: 0, completed: ['c4_silverdew', 'c4_dinner', 'c6_first_thread'], unlocked: ['staff', 'fire'], age: 6, player: { level: 2, exp: 0, coins: 0, potions: 0 }, gearV: 1, gear: { seq: 1, bag: [], equip: { off: { uid: 'i1', id: 'staff' } } } }));
	d = new StoryDirector(STORY, noop);
	assert.ok(d.granted.includes('sword'));
	assert.deepEqual([d.gear.equip.main?.id, d.gear.equip.main?.uid, d.gear.equip.off?.uid], ['sword', 'i2', 'i1']);
	d.save();
	assert.equal(new StoryDirector(STORY, noop).gear.seq, 2, 'nạp lại: không trao kiếm lần hai');

	// Bản lưu đã có `gearV` nhưng `gear` hỏng (người sửa tay) → chuẩn hoá, không văng; khoá lạ về túi.
	oldSave(['sword', 'staff'], { gearV: 1, gear: { seq: 'x', equip: { main: { uid: 'i1', id: 'sword' }, wings: { uid: 'i2', id: 'staff' } }, bag: 'hỏng' } });
	d = new StoryDirector(STORY, noop);
	assert.deepEqual([d.gear.equip.main?.id, d.gear.bag.map((s) => s.id), d.gear.seq], ['sword', ['staff'], 2]);

	// 14) Trao quà khi đang chơi: ô trống thì tự mặc; ô có đồ thì vào túi. Túi đầy → báo itemOverflow.
	store.clear();
	d = new StoryDirector(STORY, noop);
	d.restore();
	assert.deepEqual(d.gear, { bag: [], equip: {}, seq: 0 }, 'ván mới: hành trang rỗng');
	for (let guard = 0; guard < 40 && !(d.isUnlocked('sword') && d.isUnlocked('staff')); guard += 1) {
		const q = d.quest!;
		if (!d.state.accepted && q.giver) d.talk(q.giver);
		else if (d.state.ready) d.talk(q.turnIn as string);
		else if (q.objective.type === 'pickup') d.pickup(q.objective.item);
		else if (q.objective.type === 'practice') d.practiced(q.objective.element ?? 'aether', q.objective.reaction ?? null);
		else if (q.objective.type === 'talk') d.talk(q.objective.npc);
	}
	assert.deepEqual([d.gear.equip.main?.id, d.gear.equip.off?.id], ['sword', 'staff'], 'cha trao kiếm, mẹ trao trượng: tự cầm đúng ô');
	const g2 = d.giveItem('t_stick', 1, true);
	assert.deepEqual([g2.equipped, d.gear.bag.map((s) => s.id)], [null, ['t_stick']], 'ô Vũ khí đã có kiếm → gậy vào túi');
	assert.deepEqual(d.giveItem('t_cap', 1, true).equipped, 'head', 'ô Mũ trống → tự đội');
	const before = d.gear;
	d.state.gear = { ...before, bag: Array.from({ length: BAG_SIZE }, (_, i) => ({ uid: `x${i}`, id: 't_stick' })), equip: { ...before.equip } };
	delete d.state.gear.equip.off;
	d.state.unlocked = d.state.unlocked.filter((u) => u !== 'staff');
	overflow.length = 0;
	assert.ok(d.grantUnlock('staff'));
	assert.equal(d.gear.equip.off?.id, 'staff', 'túi đầy nhưng ô Tay phụ trống → vẫn cầm được, không rơi');
	delete d.state.gear.equip.off;
	d.state.gear.equip.off = { uid: 'z', id: 't_stick' } as never;
	d.state.unlocked = d.state.unlocked.filter((u) => u !== 'staff');
	assert.ok(d.grantUnlock('staff'));
	assert.deepEqual(overflow, [['staff', 1]], 'ô có đồ + túi đầy → báo để Game thả xuống đất');
	assert.equal(d.grantUnlock('staff'), false, 'mã đã có: không trao lặp');

	// 15) Chơi lại (xoá tiến độ) → hành trang rỗng, `gearV` = 1.
	await StoryDirector.reset();
	StoryDirector.thaw();
	d = new StoryDirector(STORY, noop);
	assert.deepEqual([d.gear, d.state.gearV], [{ bag: [], equip: {}, seq: 0 }, 1]);

	// 16) Tháo kiếm KHÔNG mất Trảm (kỹ năng mở theo `unlocked` của cốt truyện, không theo đồ đang cầm).
	oldSave(['sword', 'staff']);
	d = new StoryDirector(STORY, noop);
	const off = unequipItem(d.gear, 'main');
	assert.ok(typeof off !== 'string');
	d.setGear(off);
	const slash = HERO_SKILLS.find((s) => s.unlock === 'sword')!;
	assert.ok(knowsSkill(slash, d.talentTiers(), (id) => d.isUnlocked(id), d.swordStyle), 'tháo kiếm vẫn còn Trảm');
	assert.equal(new StoryDirector(STORY, noop).gear.bag[0]?.id, 'sword', 'kiếm tháo ra nằm trong túi sau khi nạp lại');
	store.clear();
}

// 17–18) CombatSystem: trang bị toàn 0 → chỉ số y hệt trước khi có trang bị; {atk: 2} cộng TRƯỚC hệ số con đường.
{
	const { CombatSystem } = await import('../src/game/combat/CombatSystem');
	const { PATHS } = await import('../src/game/combat/skills');
	const { Vfx } = await import('../src/game/combat/Vfx');
	const hooks = new Proxy({}, { get: () => () => undefined }) as ConstructorParameters<typeof CombatSystem>[0];
	const make = () => new CombatSystem(hooks, { level: 12, exp: 0, coins: 0, potions: 0 }, new Vfx());
	for (const path of [null, 'sword', 'mage'] as const) {
		const plain = make();
		const geared = make();
		plain.setPath(path);
		geared.setPath(path);
		geared.setGear({ atk: 0, mag: 0, def: 0, hp: 0, mp: 0, crit: 0, move: 0 });
		assert.deepEqual(geared.sheet, plain.sheet, `${path}: trang bị 0 → bảng chỉ số y hệt`);
		assert.deepEqual([geared.pc.hpMax, geared.pc.mpMax, geared.pc.atk, geared.pc.def, geared.moveScale], [plain.pc.hpMax, plain.pc.mpMax, plain.pc.atk, plain.pc.def, plain.moveScale]);
		const b = geared.gearBasis;
		assert.deepEqual(
			[shownStat(b, 'atk', 0), shownStat(b, 'mag', 0), shownStat(b, 'def', 0), shownStat(b, 'hp', 0)],
			[plain.sheet.attack, plain.sheet.magic, plain.sheet.defense, plain.pc.hpMax],
			`${path}: gearBasis cùng công thức với sheet`,
		);
	}
	const c = make();
	c.setPath('sword');
	const base = c.pc.atk;
	c.setGear({ atk: 2, def: 3, hp: 10, mp: 4, crit: 5, move: 10 });
	const p = PATHS.sword;
	assert.equal(c.sheet.attack, Math.round((base + 2) * p.sword), '{atk: 2} cộng trước hệ số con đường');
	assert.equal(c.sheet.magic, Math.round(base * p.magic), 'atk của trang bị không vào phép');
	assert.equal(c.pc.hpMax, Math.round(p.hp[0] + 11 * p.hp[1] + 10), 'máu tối đa cộng phẳng');
	assert.equal(c.pc.mpMax, p.mp[0] + 11 * p.mp[1] + 4);
	assert.ok(Math.abs(c.sheet.critChance - (make().sheet.critChance + 0.05)) < 1e-9, 'crit 5 = +5%');
	const gb = c.gearBasis;
	assert.deepEqual(
		[shownStat(gb, 'atk', 2), shownStat(gb, 'def', 3), shownStat(gb, 'hp', 10)],
		[c.sheet.attack, c.sheet.defense, c.pc.hpMax],
		'"+N trang bị" và so sánh dùng đúng số trên bảng',
	);
	c.setGear({});
	assert.equal(c.sheet.attack, Math.round(base * p.sword), 'tháo hết → về như cũ');
	assert.ok(c.pc.hp <= c.pc.hpMax, 'tháo đồ máu: máu hiện tại kẹp xuống');
}

// 19) Đốt + Bùng Lửa là sát thương PHÉP: cộng Phép thuật của trang bị (`magicAtk`) như Tro Tàn / vụn băng — trước đây
// đọc thẳng `pc.atk` nên bảng báo "Phép thuật 16 → 116" mà hai đòn này đứng yên. ATK của trang bị (đòn Kiếm) không vào.
{
	const { Container, Texture } = await import('pixi.js');
	const { Actor } = await import('../src/game/entities/Actor');
	const { CombatSystem } = await import('../src/game/combat/CombatSystem');
	type Textures = import('../src/game/assets/AssetManifest').CharacterTextures;
	type Dir = import('../src/game/assets/AssetManifest').Direction;
	type Fighter = import('../src/game/combat/CombatSystem').Fighter;
	const DIRS: Dir[] = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'];
	const strip = (n: number) => Array.from({ length: n }, () => new Texture());
	const fakeTextures = (): Textures => {
		const anims = { idle: Object.fromEntries(DIRS.map((d) => [d, strip(4)])), walk: Object.fromEntries(DIRS.map((d) => [d, strip(6)])) } as Record<string, Partial<Record<Dir, InstanceType<typeof Texture>[]>>>;
		return {
			id: 'test',
			entry: { displayName: 'Thử', role: 'player', atlas: '', frameSize: { width: 64, height: 64 }, anchor: { x: 0.5, y: 0.9 }, animations: { idle: { fps: 6 }, walk: { fps: 10 } }, source: { provider: 'test', ref: null }, bodyHeight: 60 },
			frames: (anim, dir) => anims[anim]?.[dir] ?? anims.idle!.S!,
			has: (anim) => !!anims[anim],
			hasDir: () => false,
			actionFrames: () => null,
		};
	};
	const setup = (gear: Partial<Record<string, number>>) => {
		const vfx = { ground: new Container(), top: new Container(), play: () => undefined, frames: () => [], update: () => undefined, clear: () => undefined };
		const hooks = { mover: (pos: { x: number; y: number }, dx: number, dy: number) => void Object.assign(pos, { x: pos.x + dx, y: pos.y + dy }), shake: () => undefined, toast: () => undefined, enemyKilled: () => undefined, bossNear: () => false, playerRespawn: () => ({ x: 0, y: 0 }), isUnlocked: () => true, practiceHit: () => undefined };
		const combat = new CombatSystem(hooks as unknown as ConstructorParameters<typeof CombatSystem>[0], { level: 1, exp: 0, coins: 0, potions: 0 }, vfx as never);
		const p = new Actor('hero', fakeTextures(), 40, 100, 'S', null);
		combat.setPlayer(p);
		combat.setGear(gear);
		const enemy = (): Fighter => {
			const home = { x: 300, y: 100, radius: 60 };
			const f = combat.addEnemy(new Actor('mob_zombie_001', fakeTextures(), 300, 100, 'W', home), 'mob_zombie_001', home, 'mob_zombie_001')!;
			Object.assign(f, { attackTimer: 99, stun: 99, hpMax: 100000, hp: 100000 });
			return f;
		};
		const tick = (n: number) => {
			for (let i = 0; i < n; i += 1) {
				p.update(1 / 60);
				combat.update(1 / 60, (x, y) => ({ x, y }), 2);
			}
		};
		return { combat, enemy, tick };
	};
	/** Một nhịp đốt (cháy còn 0,51s → qua mốc 0,5s ở khung đầu). */
	const burnTick = (gear: Partial<Record<string, number>>): number => {
		const s = setup(gear);
		const f = s.enemy();
		Object.assign(f, { burn: 0.51, burnPower: 1 });
		s.tick(3);
		return f.hpMax - f.hp;
	};
	/** Gió đánh vào quái đang cháy = Bùng Lửa. */
	const burst = (gear: Partial<Record<string, number>>): { id: string | undefined; dmg: number } => {
		const s = setup(gear);
		const f = s.enemy();
		f.burn = 2;
		const r = (s.combat as unknown as { react(t: Fighter, el: string, x: number, y: number): { reaction: { id: string } | null } }).react(f, 'wind', 300, 100);
		return { id: r.reaction?.id, dmg: f.hpMax - f.hp };
	};
	const base = setup({}).combat.pc.atk;
	assert.equal(burnTick({}), Math.round(base * 0.18), 'không đồ: nhịp đốt như cũ (cân bằng không đổi)');
	assert.equal(burnTick({ mag: 100 }), Math.round((base + 100) * 0.18), '+100 Phép thuật: nhịp đốt tăng đúng tỉ lệ');
	assert.equal(burnTick({ atk: 100 }), burnTick({}), 'ATK của trang bị (đòn Kiếm) không vào đốt');
	const b0 = burst({});
	const b1 = burst({ mag: 100 });
	assert.equal(b0.id, 'burst');
	assert.ok(b1.dmg > b0.dmg, `Bùng Lửa cộng Phép thuật của trang bị (${b0.dmg} → ${b1.dmg})`);
	assert.ok(Math.abs(b1.dmg / b0.dmg - (base + 100) / base) < 0.15, 'Bùng Lửa tăng theo tỉ lệ sức phép');
}

// 20) Đường UI → Game của kho đồ (`applyGearRequest` = phần luật của `Game.onGearRequest`): mặc / tháo qua request, yêu
// cầu lặp của cú bấm trùng không làm gì, mã ô lạ bị bỏ, lý do từ chối trả nguyên văn.
{
	const { applyGearRequest, bagUsed, VIRTUAL_POTION_UID } = E;
	let g = bagOf(['t_stick', 't_cap']);
	const r1 = applyGearRequest(g, { kind: 'equip', uid: 'i1', equipSlot: 'main' }, 1, 16);
	assert.ok(r1 && typeof r1 !== 'string');
	assert.equal(r1.text, 'Đã mặc Gậy · Vũ khí chính');
	g = r1.g;
	assert.equal(applyGearRequest(g, { kind: 'equip', uid: 'i1', equipSlot: 'main' }, 1, 16), null, 'mặc lại món đã ở đúng ô (bấm trùng): không làm gì');
	assert.equal(applyGearRequest(g, { kind: 'equip', uid: 'i2', equipSlot: 'wings' }, 1, 16), null, 'mã ô lạ: bỏ');
	assert.equal(applyGearRequest(g, { kind: 'equip' }, 1, 16), null, 'thiếu uid: bỏ');
	assert.match(String(applyGearRequest(g, { kind: 'equip', uid: 'i2', equipSlot: 'main' }, 1, 16)), /Vũ khí chính/, 'sai loại ô: lý do nguyên văn');
	const r2 = applyGearRequest(g, { kind: 'unequip', equipSlot: 'main' }, 1, 16);
	assert.ok(r2 && typeof r2 !== 'string');
	assert.deepEqual([r2.text, r2.g.bag.map((s) => s.uid)], ['Đã tháo Gậy về túi', ['i2', 'i1']]);
	assert.equal(applyGearRequest(r2.g, { kind: 'unequip', equipSlot: 'main' }, 1, 16), 'Ô này đang trống', 'tháo lặp (cú bấm trùng): báo ô trống, không đụng túi');
	const full = bagOf(Array.from({ length: BAG_SIZE }, () => 't_stick'), g);
	assert.equal(applyGearRequest(full, { kind: 'unequip', equipSlot: 'main' }, 1, 16), 'Túi đầy');

	// Bộ đếm "n/24 ô" đếm như luật túi đầy: chồng ảo bình mật ong không chiếm ô.
	const view = (n: number, potion: boolean) => [...Array.from({ length: n }, (_, i) => ({ uid: `i${i + 1}` })), ...(potion ? [{ uid: VIRTUAL_POTION_UID }] : [])];
	assert.equal(bagUsed(view(0, true)), 0, 'túi rỗng + bình: 0/24, không phải 1/24');
	assert.equal(bagUsed(view(23, true)), 23, '23 món thật: chưa đầy (vẫn tháo được)');
	assert.equal(bagUsed(view(BAG_SIZE, true)), BAG_SIZE, '24 món thật: 24/24, không phải 25/24');
}

// 21) Nhấp đúp ô búp bê: cú đầu vào ô ĐANG SÁNG là mặc — dblclick sau đó không được tháo ngay món vừa mặc (đã dẫm: nhấp
// đúp ô Vũ khí chính đang sáng → ô trống, cả hai kiếm về túi). Nhấp đúp ô đang có đồ từ trước thì vẫn tháo.
{
	const { dollDoubleUnequips } = await import('../src/components/inventory/dollClick');
	assert.equal(dollDoubleUnequips({ slot: 'main', uid: 'i1', target: true }, 'main', 'i5'), false, 'cú đầu = mặc kiếm sắt vào ô sáng → không tháo');
	assert.equal(dollDoubleUnequips({ slot: 'main', uid: null, target: true }, 'main', 'i5'), false, 'ô trống sáng → mặc, không tháo');
	assert.equal(dollDoubleUnequips({ slot: 'main', uid: 'i1', target: false }, 'main', 'i1'), true, 'ô có đồ từ trước, không sáng → tháo');
	assert.equal(dollDoubleUnequips({ slot: 'off', uid: 'i1', target: false }, 'main', 'i1'), false, 'cú đầu ở ô khác');
	assert.equal(dollDoubleUnequips(null, 'main', 'i1'), false, 'không thấy cú đầu (bàn phím…)');
	assert.equal(dollDoubleUnequips({ slot: 'main', uid: null, target: false }, 'main', null), false, 'ô trống: không có gì để tháo');
}

// 22) Quà bù LÚC NẠP (bản lưu đã có `gearV`) mà túi đầy + ô đã có đồ: không được mất — giữ phần dư cho Game thả xuống đất
// sau khi dựng người chơi (`takeOverflow`), lấy một lần; mã quà vẫn vào `unlocked` (không trao lặp).
{
	const { STORY } = await import('../src/game/story/story');
	const { StoryDirector } = await import('../src/game/story/StoryDirector');
	const overflow: [string, number][] = [];
	const noop = { dialogue() {}, reward() {}, questsChanged() {}, pickups() {}, clearPickups() {}, awakenBoss() {}, spawnZone() {}, questCompleted() {}, unlocked() {}, ageChanged() {}, chapterEnd() {}, itemOverflow: (id: string, n: number) => void overflow.push([id, n]) };
	store.clear();
	const bag = Array.from({ length: BAG_SIZE }, (_, i) => ({ uid: `i${i + 2}`, id: 't_cap' }));
	store.set('aether.save.v2', JSON.stringify({ version: 2, index: 3, questId: 'c6_old_hat', accepted: false, ready: false, progress: 0, completed: ['c4_silverdew', 'c4_dinner', 'c6_first_thread'], unlocked: ['staff', 'fire'], age: 6, player: { level: 2, exp: 0, coins: 0, potions: 0 }, gearV: 1, gear: { seq: 30, bag, equip: { main: { uid: 'i1', id: 't_stick' } } } }));
	const d = new StoryDirector(STORY, noop);
	assert.ok(d.granted.includes('sword') && d.isUnlocked('sword'), 'kiếm được bù lúc nạp');
	assert.deepEqual([d.gear.equip.main?.id, d.gear.bag.length], ['t_stick', BAG_SIZE], 'ô Vũ khí có gậy, túi 24 món → kiếm chưa vào được');
	assert.deepEqual(d.takeOverflow(), [{ id: 'sword', n: 1 }], 'phần dư giữ lại cho Game thả xuống đất');
	assert.deepEqual(d.takeOverflow(), [], 'lấy một lần');
	assert.deepEqual(overflow, [], 'lúc nạp chưa có người chơi: không báo itemOverflow (Game tự thả sau khi dựng)');
	store.clear();
}

console.log('✔ equipment: danh mục, mặc/tháo/đổi chỗ, nhẫn, sai ô, thiếu cấp, túi đầy, chồng đồ, cleanGear, so sánh, chuyển bản lưu cũ, quà khi đang chơi, chơi lại, tháo kiếm vẫn còn Trảm, cộng chỉ số vào CombatSystem, đốt + Bùng Lửa theo sức phép, request mặc/tháo, bộ đếm túi, nhấp đúp ô búp bê, quà bù lúc nạp khi túi đầy');

// Test vector nhóm "economy" (equipment.ts, economy.ts, shop.ts, rewards.ts) sinh từ CHÍNH hàm TypeScript → Tests~/vectors/economy.json.
// Test C#: Tests~/HavenLord.Core.Tests/EconomyTests.cs. Chạy ở gốc repo:
//   npx tsx UnityGame/Tools~/vectors-economy.mts
// ITEMS thật chỉ có 4 món chỉ số 0 → script THÊM đồ thử (TEST_ITEMS) vào ITEMS ngay trong tiến trình này (không sửa file nào) để phủ
// chỉ số / cấp / tuổi / nhẫn / chồng; danh sách đồ thử ghi kèm vector để test C# dựng cùng danh mục.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { addExp, applyAdminEco, capExpGain, cleanEco, COIN_CAP, fromTotalExp, POTION_CAP, shiftExp, totalExp } from '../../packages/sim/src/economy.ts';
import {
	addItem,
	applyGearRequest,
	autoSlot,
	BAG_SIZE,
	bagUsed,
	canEquip,
	cleanGear,
	compareGear,
	EQUIP_SLOTS,
	type EquipKind,
	type EquipSlotId,
	emptyGear,
	equipItem,
	type GearState,
	gearBonus,
	ITEMS,
	type ItemDef,
	type ItemStack,
	itemDef,
	KIND_NAME,
	mint,
	RARITY_ORDER,
	SLOT_NAME,
	SLOT_SHORT,
	type StatBasis,
	STAT_KEYS,
	STAT_NAME,
	slotsFor,
	stackStats,
	shownStat,
	unequipItem,
} from '../../packages/sim/src/equipment.ts';
import { CHECKIN_CYCLE, CHRONICLER, checkinGift, checkinSlot, dayBefore, GOAL_KIND_INFO, GOALS, killStats, nextStreak, vnDay } from '../../packages/sim/src/rewards.ts';
import { BUFF_GROUP, BUFF_MAX_MS, buffLabel, buffMults, buffPower, fmtRemaining, MERCHANT, MERCHANT_NPCS, MERCHANTS, SHOP } from '../../packages/sim/src/shop.ts';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'Tests~', 'vectors');
mkdirSync(OUT, { recursive: true });

// ---- Đồ thử --------------------------------------------------------------------------------------------------------------
const base = { desc: 'thử', icon: '', w: 32, h: 32 } as const;
const TEST_ITEMS: Record<string, ItemDef> = {
	t_ring_a: { ...base, id: 't_ring_a', name: 'Nhẫn Ánh Trăng', kind: 'equip', equip: 'ring', stats: { atk: 3, crit: 1.5 }, rarity: 'rare', price: 40 },
	t_ring_b: { ...base, id: 't_ring_b', name: 'Nhẫn Đá Núi', kind: 'equip', equip: 'ring', stats: { def: 2, hp: 10 }, levelReq: 5 },
	t_helm: { ...base, id: 't_helm', name: 'Mũ Sắt', kind: 'equip', equip: 'head', stats: { def: 4, hp: 25 }, ageReq: 16 },
	t_plate: { ...base, id: 't_plate', name: 'Giáp Lá', kind: 'equip', equip: 'body', stats: { def: 7.25, move: -3 }, levelReq: 12, ageReq: 18 },
	t_blade: { ...base, id: 't_blade', name: 'Đao Thép', kind: 'equip', equip: 'weapon', stats: { atk: 12, crit: 2, mag: 0.1 }, levelReq: 3 },
	t_amulet: { ...base, id: 't_amulet', name: 'Bùa Gió', kind: 'equip', equip: 'neck', stats: { mp: 15, mag: 0.2, move: 2.5 }, levelReq: 2.5 },
	t_boots: { ...base, id: 't_boots', name: 'Giày Da', kind: 'equip', equip: 'feet', stats: { move: 4 } },
	t_herb: { ...base, id: 't_herb', name: 'Lá Thuốc', kind: 'consumable', stack: 5 },
	t_ore: { ...base, id: 't_ore', name: 'Quặng', kind: 'material', stack: 20 },
	t_note: { ...base, id: 't_note', name: 'Thư Tay', kind: 'quest' },
	t_broken: { ...base, id: 't_broken', name: 'Đồ Hỏng', kind: 'equip' },
	t_zero: { ...base, id: 't_zero', name: 'Đá Vụn', kind: 'material', stack: 0 },
};
Object.assign(ITEMS, TEST_ITEMS);
const ALL_IDS = [...Object.keys(ITEMS), 'mystery', ''];
const SLOTS_X: (EquipSlotId | undefined | string)[] = [...EQUIP_SLOTS, undefined, 'tail', ''];
const KINDS: (EquipKind | undefined)[] = [...new Set(Object.values({ head: 'head', body: 'body', hands: 'hands', legs: 'legs', feet: 'feet', neck: 'neck', main: 'weapon', off: 'offhand', ring: 'ring' } as Record<string, EquipKind>)), undefined];

// PRNG xác định (mulberry32) — chuỗi thao tác ra y hệt mỗi lần chạy.
function rng(seed: number) {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
const pick = <T,>(r: () => number, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)]!;

/** Số không hữu hạn → chuỗi (JSON không có NaN / ∞); undefined trong mảng → null. */
const replacer = (_k: string, v: unknown) => (typeof v === 'number' && !Number.isFinite(v) ? String(v) : v);
const gearOut = (x: GearState | string) => (typeof x === 'string' ? { error: x } : { g: x });

// ---- Trạng thái mẫu ------------------------------------------------------------------------------------------------------
const st = (bag: ItemStack[], equip: GearState['equip'], seq: number): GearState => ({ bag, equip, seq });
const S = (uid: string, id: string, extra: Partial<ItemStack> = {}): ItemStack => ({ uid, id, ...extra });
const fullBag = Array.from({ length: BAG_SIZE }, (_, i) => S(`f${i}`, i % 3 === 0 ? 't_ore' : 't_note', i % 3 === 0 ? { n: 20 } : {}));
const STATES: GearState[] = [
	emptyGear(),
	st([S('i1', 't_ring_a'), S('i2', 't_ring_b'), S('i3', 't_helm', { roll: { def: 1, crit: 0.5 } })], {}, 3),
	st([S('i4', 't_ring_a', { roll: { atk: -1 } })], { ring1: S('i1', 't_ring_a'), ring2: S('i2', 't_ring_b'), head: S('i3', 't_helm') }, 4),
	st([S('i5', 't_blade'), S('i6', 't_plate'), S('i7', 't_herb', { n: 3 }), S('i8', 'mystery')], { main: S('sw', 'sword'), off: S('sf', 'staff'), neck: S('i9', 't_amulet', { roll: { mp: 2, move: 0.25 } }) }, 9),
	st(fullBag, { ring1: S('r1', 't_ring_a'), feet: S('b1', 't_boots', { roll: { move: 1.5, hp: 7 } }) }, 40),
	st([S('i1', 't_herb', { n: 5 }), S('i2', 't_herb', { n: 2 }), S('i3', 't_herb', { roll: { atk: 1 } }), S('i4', 't_ore', { n: 19 }), S('i5', 'potion', { n: 98 })], { ring2: S('i6', 't_ring_b') }, 6),
	st([S('i1', 't_zero'), S('i2', 'mystery', { n: 4 })], { main: S('i3', 'mystery') }, 2.5),
];

// ---- equipment -----------------------------------------------------------------------------------------------------------
const equipment = {
	testItems: TEST_ITEMS,
	tables: { EQUIP_SLOTS, SLOT_NAME, SLOT_SHORT, KIND_NAME, STAT_KEYS, STAT_NAME, RARITY_ORDER, BAG_SIZE, itemIds: Object.keys(ITEMS) },
	states: STATES,
	itemDef: ALL_IDS.map((id) => ({ id, out: itemDef(id) })),
	bagUsed: [[], ['potion'], ['i1', 'potion', 'i2'], ['potion', 'potion'], [undefined, 'x']].map((uids) => ({ uids, out: bagUsed(uids.map((uid) => ({ uid }))) })),
	mint: STATES.flatMap((g, si) => ['t_ore', 'mystery'].flatMap((id) => [undefined, 1, 0, 2, 7.5, -3].map((n) => ({ state: si, id, n: n ?? null, out: mint(g, id, n) })))),
	gearBonus: STATES.map((g, si) => ({ state: si, out: gearBonus(g) })),
	stackStats: [null, ...STATES.flatMap((g) => [...g.bag, ...Object.values(g.equip)])].map((it) => ({ it, out: stackStats(it as ItemStack | null) })),
	slotsFor: KINDS.map((kind) => ({ kind: kind ?? null, out: slotsFor(kind) })),
	autoSlot: STATES.flatMap((g, si) => KINDS.map((kind) => ({ state: si, kind: kind ?? null, out: autoSlot(kind, g.equip) }))),
	canEquip: ALL_IDS.flatMap((id) =>
		[...EQUIP_SLOTS, 'tail'].flatMap((slot) =>
			[
				[1, 6],
				[2.5, 15.9],
				[5, 16],
				[12, 18],
				[100, 100],
				[Number.NaN, Number.NaN],
			].map(([level, age]) => ({ id, slot, level, age, out: canEquip(itemDef(id), slot as EquipSlotId, level!, age!) })),
		),
	),
	equipItem: STATES.flatMap((g, si) => {
		const uids = [...g.bag.map((s) => s.uid), ...Object.values(g.equip).map((s) => s!.uid), 'nope'];
		return uids.flatMap((uid) =>
			SLOTS_X.flatMap((slot) =>
				[
					[1, 6],
					[20, 30],
				].map(([level, age]) => {
					const out = equipItem(g, uid, slot as EquipSlotId | undefined, level!, age!);
					return { state: si, uid, slot: slot ?? null, level, age, same: out === g, ...gearOut(out) };
				}),
			),
		);
	}),
	unequipItem: STATES.flatMap((g, si) => SLOTS_X.map((slot) => ({ state: si, slot: slot ?? null, ...gearOut(unequipItem(g, slot as EquipSlotId)) }))),
	applyGearRequest: STATES.flatMap((g, si) => {
		const uids = [...g.bag.map((s) => s.uid), ...Object.values(g.equip).map((s) => s!.uid), 'nope', undefined, ''];
		const reqs = [
			...uids.flatMap((uid) => SLOTS_X.map((equipSlot) => ({ kind: 'equip' as const, uid, equipSlot }))),
			...SLOTS_X.map((equipSlot) => ({ kind: 'unequip' as const, equipSlot })),
		];
		return reqs.map((r) => {
			const out = applyGearRequest(g, r as Parameters<typeof applyGearRequest>[1], 20, 30);
			return { state: si, r: { kind: r.kind, uid: 'uid' in r ? (r.uid ?? null) : null, equipSlot: r.equipSlot ?? null }, level: 20, age: 30, out: out === null ? null : typeof out === 'string' ? { error: out } : out };
		});
	}),
	addItem: STATES.flatMap((g, si) =>
		['t_herb', 't_ore', 't_note', 'potion', 'mystery', 't_zero', 't_ring_a'].flatMap((id) =>
			[undefined, 1, 3, 4.9, 0, -2, 25, 200, Number.NaN, Number.POSITIVE_INFINITY].map((n) => ({ state: si, id, n: n ?? null, out: addItem(g, id, n) })),
		),
	),
	shownStat: (() => {
		const b: StatBasis = {
			base: { atk: 10, mag: 7, def: 3, hp: 120, mp: 50, crit: 5, move: 100 },
			scale: { atk: 1.5, mag: 1.25, def: 0.5, hp: 1, mp: 1.1, crit: 1, move: 0.5 },
		};
		const flats = [0, 1, 0.5, -0.5, 2.5, -13, 3.3, 1e-9, -20.5];
		return { b, rows: STAT_KEYS.flatMap((key) => flats.map((flat) => ({ key, flat, out: shownStat(b, key, flat) }))) };
	})(),
	compareGear: (() => {
		const b: StatBasis = {
			base: { atk: 9, mag: 4, def: 1, hp: 80, mp: 30, crit: 3, move: 100 },
			scale: { atk: 1.15, mag: 1.3, def: 1, hp: 1.05, mp: 1, crit: 1, move: 1 },
		};
		const items: (ItemStack | null)[] = [null, ...STATES.flatMap((g) => [...g.bag, ...Object.values(g.equip)]).slice(0, 14) as ItemStack[]];
		const currents = [{}, { atk: 3, crit: 1.5, def: 7.25 }, gearBonus(STATES[3]!)];
		const rows = [];
		for (const next of items) for (const prev of items) for (const current of currents) rows.push({ current, next, prev, out: compareGear(b, current, next, prev) });
		return { b, rows };
	})(),
	cleanGear: [
		null,
		42,
		'gear',
		[],
		[{ uid: 'i1', id: 'sword' }],
		{},
		{ bag: 'x', equip: [], seq: 'abc' },
		{ bag: [{ uid: 'i1', id: 'sword' }], equip: { main: { uid: 'i1', id: 'sword' } }, seq: 1 },
		{
			bag: [null, 5, 'x', [], { uid: '', id: 'sword' }, { uid: 'a', id: '' }, { uid: 3, id: 'x' }, { uid: 'i12', id: 't_herb', n: 9 }, { uid: 'i13', id: 't_herb', n: '3' }, { uid: 'i14', id: 't_herb', n: -4 }, { uid: 'i15', id: 'mystery', n: 1e6 }, { uid: 'i16', id: 'mystery', n: 2.7 }, { uid: 'i17', id: 'potion', n: null }, { uid: 'i18', id: 'potion', n: true }, { uid: 'i19', id: 'potion', n: [42] }, { uid: 'i20', id: 'potion', n: '0x1F' }, { uid: 'i21', id: 'potion', n: ' 12 ' }, { uid: 'i22', id: 'potion', n: '1e2' }, { uid: 'i23', id: 'potion', n: {} }, { uid: 'i24', id: 'potion', n: 'Infinity' }],
			equip: { head: { uid: 'h', id: 't_ring_a' }, ring1: { uid: 'r', id: 't_ring_a', roll: { atk: 2, crit: '1.5', def: 0, hp: null, mp: 'x', move: [3], junk: 9 } }, ring2: { uid: 'r', id: 't_ring_b' }, main: { uid: 'm', id: 'mystery' }, wings: { uid: 'w', id: 't_boots' }, '7': { uid: 'n7', id: 't_note' }, '02': { uid: 'n2', id: 't_note' }, '3': { uid: 'n3', id: 't_note' } },
			seq: 5,
		},
		{ bag: [{ uid: 'i99', id: 't_ore', roll: [] }, { uid: 'i7', id: 't_ore', roll: { atk: 0 } }, { uid: 'i007', id: 't_ore' }, { uid: 'x9', id: 't_ore' }, { uid: 'i5x', id: 't_ore' }, { uid: 'i99', id: 'dup' }], equip: {}, seq: 50.9 },
		{ bag: [{ uid: 'i123456789012345678901234567890', id: 't_ore' }], seq: -5 },
		{ bag: [], equip: { feet: { uid: 'b', id: 't_boots', n: 3 } }, seq: '17' },
		{ bag: [{ uid: 'z', id: 't_zero', n: 4 }], equip: { off: { uid: 'o', id: 'staff' }, body: { uid: 'p', id: 't_plate' } }, seq: true },
		{ bag: [{ uid: 'i1', id: 't_ore', n: '  ' }], seq: 'Infinity' },
	].map((raw) => ({ raw, out: cleanGear(raw) })),
};

// Chuỗi thao tác: thêm / mặc / tháo / yêu cầu từ UI, áp nối tiếp; mỗi bước ghi kết quả để C# chạy lại đúng y hệt.
const scenarios = Array.from({ length: 60 }, (_, si) => {
	const r = rng(1000 + si);
	const start: GearState = si % 3 === 0 ? emptyGear() : (STATES[si % STATES.length] as GearState);
	let g = start;
	const steps: unknown[] = [];
	for (let k = 0; k < 40; k += 1) {
		const uids = [...g.bag.map((s) => s.uid), ...EQUIP_SLOTS.map((s) => g.equip[s]?.uid).filter((u): u is string => !!u), 'ghost'];
		const level = pick(r, [1, 3, 5, 12, 20]);
		const age = pick(r, [6, 16, 18, 30]);
		const op = pick(r, ['add', 'add', 'equip', 'equip', 'unequip', 'req']);
		if (op === 'add') {
			const id = pick(r, ['t_ring_a', 't_ring_b', 't_helm', 't_plate', 't_blade', 't_amulet', 't_boots', 't_herb', 't_ore', 't_note', 'potion', 'mystery']);
			const n = pick(r, [1, 1, 2, 3, 6, 0, 13, 2.5]);
			const out = addItem(g, id, n);
			steps.push({ op, id, n, out });
			g = out.g;
		} else if (op === 'equip') {
			const uid = pick(r, uids);
			const slot = pick(r, SLOTS_X.slice(0, 11));
			const out = equipItem(g, uid, slot as EquipSlotId | undefined, level, age);
			steps.push({ op, uid, slot: slot ?? null, level, age, same: out === g, ...gearOut(out) });
			if (typeof out !== 'string') g = out;
		} else if (op === 'unequip') {
			const slot = pick(r, EQUIP_SLOTS);
			const out = unequipItem(g, slot);
			steps.push({ op, slot, ...gearOut(out) });
			if (typeof out !== 'string') g = out;
		} else {
			const kind = pick(r, ['equip', 'equip', 'unequip'] as const);
			const uid = kind === 'equip' ? pick(r, [...uids, undefined]) : undefined;
			const equipSlot = pick(r, SLOTS_X);
			const out = applyGearRequest(g, { kind, uid, equipSlot }, level, age);
			steps.push({ op, r: { kind, uid: uid ?? null, equipSlot: equipSlot ?? null }, level, age, out: out === null ? null : typeof out === 'string' ? { error: out } : out });
			if (out && typeof out !== 'string') g = out.g;
		}
	}
	return { start, steps };
});

// ---- economy -------------------------------------------------------------------------------------------------------------
const nums = [-5, 0, 0.5, 1, 1.5, 2, 9, 10, 11, 50, 99, 99.5, 100, 101, 250];
const economy = {
	tables: { COIN_CAP, POTION_CAP },
	cleanEco: [
		null,
		7,
		'x',
		[],
		{},
		{ level: 5, exp: 120, coins: 300, potions: 4 },
		{ level: 5, exp: 1e9, coins: 2e9, potions: 1000 },
		{ level: 0, exp: -3, coins: -1, potions: -1 },
		{ level: 100, exp: 77, coins: 1e9, potions: 999 },
		{ level: 250, exp: 5, coins: 12.9, potions: 2.2 },
		{ level: '12', exp: '40.7', coins: ' 0x10 ', potions: true },
		{ level: null, exp: null, coins: null, potions: null },
		{ level: [7], exp: ['8'], coins: [1, 2], potions: {} },
		{ level: 'Infinity', exp: '-Infinity', coins: 'abc', potions: '' },
		{ level: 99.99, exp: 1e13, coins: 999999999.5, potions: false },
		{ level: 3, exp: 1e300 },
	].map((e) => ({ e, out: cleanEco(e as never) })),
	addExp: nums.flatMap((level) => [0, 1, 99.9, 150, 5000, 1e6, -20, Number.NaN, Number.POSITIVE_INFINITY].flatMap((gain) => [0, 37].map((exp) => ({ level, exp, gain, out: addExp(level, exp, gain) })))),
	capExpGain: [1, 2, 3, 4.5, 5, 9, 10, 11, 20].flatMap((level) =>
		[0, 1, 50].flatMap((exp) => [0, 10, 100, 1e5, 1e9, -3, 7.7].flatMap((gain) => [0, 3, 5, 10, 12].map((cap) => ({ level, exp, gain, cap, out: capExpGain(level, exp, gain, cap) })))),
	),
	totalExp: [...nums, Number.NaN, -Infinity, 1e9].flatMap((level) => [0, 12.7, 500, -4, 1e15, Number.NaN].map((exp) => ({ level, exp, out: totalExp(level, exp) }))),
	fromTotalExp: [-10, 0, 99, 100, 249.9, 250, 1000, 5e4, 1e6, 1e9, 1e12, 1e15, 1e18, Number.NaN, Number.POSITIVE_INFINITY].map((total) => ({ total, out: fromTotalExp(total) })),
	shiftExp: [1, 3, 10, 40, 99, 100].flatMap((level) => [0, 55].flatMap((exp) => [0, 1, -1, 120.8, -120.8, 1e7, -1e7, 1e15, -1e15].map((delta) => ({ level, exp, delta, out: shiftExp(level, exp, delta) })))),
	applyAdminEco: [
		{ level: 1, exp: 0, coins: 0, potions: 0 },
		{ level: 7, exp: 300, coins: 5000, potions: 12 },
		{ level: 100, exp: 0, coins: 1e9, potions: 999 },
	].flatMap((cur) =>
		[
			{},
			{ coins: 250 },
			{ coins: -1e12, potions: -3 },
			{ potions: 2000, coins: 1e10 },
			{ exp: 5000 },
			{ exp: -5000 },
			{ exp: 0.5 },
			{ exp: Number.NaN, coins: Number.NaN },
			{ setLevel: 50 },
			{ setLevel: 0, exp: 10 },
			{ setLevel: 300, exp: -1 },
			{ setLevel: 12.7, exp: 77, coins: 3.9, potions: -2.9 },
			{ setLevel: null, exp: -1e15 },
			{ setLevel: -4 },
		].map((d) => ({ cur, d, out: applyAdminEco(cur, d) })),
	),
};

// ---- shop ----------------------------------------------------------------------------------------------------------------
const mults = [1, 2, 3, 1.1, 1.2, 0.9, 0.8, 1.15, 1.005, 2.5, 0.1 + 0.2, 0, -1, 1e21, 1e-7, 123.456, 1.0049999999999999];
const shop = {
	tables: { SHOP, MERCHANTS, MERCHANT, MERCHANT_NPCS, BUFF_MAX_MS, BUFF_GROUP },
	buffPower: mults.map((mult) => ({ mult, out: buffPower(mult) })),
	buffLabel: ['exp', 'dmg', 'guard', 'other'].flatMap((kind) => mults.map((mult) => ({ kind, mult, out: buffLabel(kind as never, mult) }))),
	buffMults: [[], [{ kind: 'exp', mult: 2 }], [{ kind: 'guard', mult: 0.8 }, { kind: 'dmg', mult: 1.2 }, { kind: 'exp', mult: 3 }, { kind: 'exp', mult: 2 }], [{ kind: 'luck', mult: 5 }]].map((list) => ({
		list,
		out: buffMults(list as never),
	})),
	fmtRemaining: [0, 0.1, 1, 9, 59.5, 60, 61, 599, 3599, 3599.01, 3600, 3661, 1781, 36000, 86399, 359999, 1e7, -5, -0.4, 1e21, 2 ** 53 + 2, Number.NaN, Number.POSITIVE_INFINITY].map((s) => ({ s, out: fmtRemaining(s) })),
};

// ---- rewards -------------------------------------------------------------------------------------------------------------
const tryOut = (f: () => unknown) => {
	try {
		return { out: f() };
	} catch (e) {
		return { error: (e as Error).constructor.name };
	}
};
const DAY = 86_400_000;
const rewards = {
	tables: { CHECKIN_CYCLE, GOALS, GOAL_KIND_INFO, CHRONICLER },
	vnDay: [
		0, 1, -1, 1.7, -1.7, -25_200_000, -25_200_000.5, -25_200_001, 61_199_999, 61_200_000, Date.UTC(2026, 9, 9, 16, 59, 59, 999), Date.UTC(2026, 9, 9, 17), Date.UTC(2024, 1, 28, 17), Date.UTC(2100, 1, 28, 17),
		Date.UTC(2000, 1, 29, 3), 253402275599999, 253402275600000, -62167244400001, -62167244400000, 8.64e15 - 25_200_000, 8.64e15 - 25_200_000 + 1, -8.64e15 - 25_200_000, -8.64e15 - 25_200_001, -1e15, 3e14 + 0.5, Number.NaN, Number.POSITIVE_INFINITY,
		...Array.from({ length: 40 }, (_, i) => (i - 20) * 97 * DAY * 37 + i * 3_600_123),
	].map((ms) => ({ ms, ...tryOut(() => vnDay(ms)) })),
	dayBefore: [
		'2026-10-10', '2026-01-01', '2026-03-01', '2024-03-01', '2100-03-01', '2000-03-01', '1970-01-01', '1969-12-31', '0000-01-01', '0001-01-01', '9999-12-31',
		'+010000-01-01', '-000001-12-31', '+002026-10-10', '-002026-10-10', '-000000-01-01', '+275760-09-13', '+275760-09-14', '-271821-04-20', '-271821-04-21',
		'2026-02-30', '2026-02-31', '2024-02-30', '2026-04-31', '2026-13-01', '2026-00-10', '2026-01-00', '2026-01-32', 'abc', '', '2026-1-5', '2026-10', '2026', '2026/10/10', ' 2026-10-10', '2026-10-10 ',
	].map((day) => ({ day, ...tryOut(() => dayBefore(day)) })),
	checkinSlot: [-3, 0, 0.5, 1, 2, 6.9, 7, 8, 13, 14, 15, 100, 1e9 + 3, Number.NaN, Number.POSITIVE_INFINITY].map((streak) => ({ streak, out: checkinSlot(streak) })),
	checkinGift: [0, 1, 2, 3, 6, 7, 8, 14, 21, 22, 365, Number.NaN].map((streak) => ({ streak, out: checkinGift(streak) })),
	nextStreak: [
		[null, 0, '2026-10-10'], ['2026-10-09', 4, '2026-10-10'], ['2026-10-08', 4, '2026-10-10'], ['2026-10-10', 4, '2026-10-10'], ['2026-02-28', 6, '2026-03-01'], ['2024-02-29', 1, '2024-03-01'],
		['2025-12-31', 30, '2026-01-01'], ['2026-03-01', 2, '2026-02-30'], [null, 3, 'bad'], ['x', 2.5, '2026-10-10'],
	].map(([last, streak, today]) => ({ last, streak, today, ...tryOut(() => nextStreak(last as string | null, streak as number, today as string)) })),
	killStats: [{}, { slime: 3, boss_lich: 1 }, { boss_a: 2, boss_b: 5, wolf: 10, bat: 0.5, '12': 4, boss: 7, Boss_x: 1 }, { boss_: 9, 'xboss_': 1 }].map((counts) => ({ counts, out: killStats(counts) })),
};

const doc = { equipment, scenarios, economy, shop, rewards };
writeFileSync(join(OUT, 'economy.json'), `${JSON.stringify(doc, replacer, '\t')}\n`);
const count = (o: Record<string, unknown>) => Object.values(o).reduce<number>((n, v) => n + (Array.isArray(v) ? v.length : v && typeof v === 'object' && Array.isArray((v as { rows?: unknown[] }).rows) ? (v as { rows: unknown[] }).rows.length : 0), 0);
const steps = scenarios.reduce((n, s) => n + s.steps.length, 0);
console.log(`✔ vector → ${OUT}/economy.json: trang bị ${count(equipment)} · chuỗi ${scenarios.length} (${steps} bước) · kinh tế ${count(economy)} · cửa hàng ${count(shop)} · thưởng ${count(rewards)}`);

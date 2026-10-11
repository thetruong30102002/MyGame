// Test vector nhóm "talents": phần còn lại của packages/sim/src/talents.ts + phần chữ của skills.ts, sinh từ CHÍNH hàm TS gốc →
// Tests~/vectors/talents-full.json. Test C#: Tests~/Aether.Core.Tests/TalentsFullTests.cs. Chạy ở gốc repo:
//   npx tsx UnityGame/Tools~/vectors-talents.mts
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { estimateText, HERO_SKILLS, isGroundTarget, isSwordSkill, powerText, type SkillDef, skillFacts } from '../../packages/sim/src/skills.ts';
import {
	addTier,
	aetherScale,
	assignSlot,
	type Branch,
	BRANCHES,
	canEnchant,
	defaultLoadout,
	depthBonus,
	describeBuild,
	ENCHANTS,
	enchantDesc,
	fitTiers,
	knowsSkill,
	nextTierCost,
	normalizeLoadout,
	passiveEffects,
	placeSkill,
	reactionBonus,
	reactionOfPair,
	resetCost,
	skillDesc,
	skillScale,
	spentPoints,
	type SwordStyle,
	tierCap,
	type Tiers,
	tiersFrom,
	treeOf,
	unspent,
} from '../../packages/sim/src/talents.ts';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'Tests~', 'vectors');
mkdirSync(OUT, { recursive: true });

// Ngẫu nhiên có hạt giống (mulberry32) để bộ số ổn định giữa các lần chạy.
let seed = 0x5eed1234;
const rnd = () => {
	seed = (seed + 0x6d2b79f5) | 0;
	let t = seed;
	t = Math.imul(t ^ (t >>> 15), t | 1);
	t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
	return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = <T,>(a: readonly T[]) => a[Math.floor(rnd() * a.length)]!;

// ——— đầu vào dùng chung ———
const tierSets: Tiers[] = [
	{},
	{ sword: 1 },
	{ sword: 2 },
	{ sword: 4, fire: 2 },
	{ sword: 9, fire: 5, water: 5 },
	{ fire: 9 },
	{ water: 4, ice: 7 },
	{ wind: 7, sword: 4 },
	{ earth: 9, ice: 9 },
	{ sword: 10, fire: 10, water: 10, wind: 10, ice: 10, earth: 10 },
	{ sword: 2.7, fire: 4.5 },
	{ sword: 0, fire: 0 },
	{ sword: 5, earth: 5, wind: 2 },
	{ sword: 3, wind: 3 },
	{ water: 9, wind: 9, sword: 7 },
	{ fire: 3, earth: 3, ice: 3, water: 3 },
	{ sword: -2, ice: 12 },
	{ water: 2, ice: 2 },
	{ sword: 6, ice: 5 },
	{ earth: 7, fire: 7 },
];
for (let i = 0; i < 20; i += 1) {
	const t: Tiers = {};
	for (const b of BRANCHES) if (rnd() < 0.6) t[b] = Math.floor(rnd() * 11);
	tierSets.push(t);
}
const unlockSets: string[][] = [['sword', 'staff', 'fire', 'water', 'wind', 'ice', 'earth'], ['sword', 'fire', 'water'], []];
const unlocker = (u: number) => (id: string) => unlockSets[u]!.includes(id);
const styles: (SwordStyle | null)[] = [null, 'kiem_than', 'thuy_than', 'bac_than'];
const branchesX = [...BRANCHES, 'bogus' as Branch];
const levels = [-5, 0, 1, 1.9, 2, 5, 9, 10, 20, 39, 40, 41, 77, 100];

// Kỹ năng tự dựng phủ các nhánh lạ của skillFacts/powerText/estimateText (thiếu trường, số lẻ, 0, âm, số rất lớn/rất nhỏ).
const base = { name: 'Thử', mpCost: 0, cooldown: 1 };
const synth: SkillDef[] = [
	{ ...base, id: 's_fall', element: 'fire', power: 2.675, kind: 'aoe_target', fall: true, range: 300 },
	{ ...base, id: 's_aoe_t', element: 'fire', power: 1.005, kind: 'aoe_target', range: 300, radius: 99.5 },
	{ ...base, id: 's_aoe_self', element: 'ice', power: 0.125, kind: 'aoe_self' },
	{ ...base, id: 's_pillar', element: 'ice', power: 1, kind: 'pillar', delay: -1.235, range: 0, radius: 1e-7 },
	{ ...base, id: 's_cone', element: 'water', power: 1.3, kind: 'cone', range: 100, angle: 0.30000000000000004 },
	{ ...base, id: 's_cone0', element: 'water', power: 1.3, kind: 'cone' },
	{ ...base, id: 's_line', element: 'earth', power: 1, kind: 'line', range: 12.5, width: 1e-7 },
	{ ...base, id: 's_dash0', element: 'wind', power: 0, kind: 'dash', range: 100 },
	{ ...base, id: 's_dash1', element: 'wind', power: 1, kind: 'dash', range: 100, iframes: 0.005 },
	{ ...base, id: 's_zone_inf', element: 'wind', power: 0.3, kind: 'zone', range: 200, radius: 50, duration: 4, tick: 0, pull: 0 },
	{ ...base, id: 's_zone_nan', element: 'wind', power: 0.3, kind: 'zone', duration: 0, tick: 0 },
	{ ...base, id: 's_zone_move', element: 'wind', power: 0.34, kind: 'zone', move: 33.3, radius: 80, duration: 2.25, tick: 0.35 },
	{ ...base, id: 's_zone_follow', element: 'wind', power: 0.36, kind: 'zone', follow: true, radius: 100, duration: 2.4, tick: 0.3, pull: 12 },
	{ ...base, id: 's_zone_bolts', element: 'water', power: 0.6, kind: 'zone', bolts: true, range: 320, radius: 170, duration: 3.3, tick: 0.5 },
	{ ...base, id: 's_zone_rain', element: 'water', power: 0, kind: 'zone', rain: true, duration: 6 },
	{ ...base, id: 's_zone_plain', element: 'ice', power: 0.22, kind: 'zone', range: 260, radius: 105, duration: 4 },
	{ ...base, id: 's_wall', element: 'earth', power: 1.1, kind: 'wall', range: 220, width: 100.25, duration: 123456.789 },
	{ ...base, id: 's_wall_t', element: 'fire', power: 0.25, kind: 'wall', range: 240, width: 80, duration: 5, tick: 0.5 },
	{ ...base, id: 's_ward', element: 'ice', power: 1.6, kind: 'ward' },
	{ ...base, id: 's_ward_s', element: 'steel', power: 2, kind: 'ward', duration: 2.499 },
	{ ...base, id: 's_spin', element: 'steel', power: 1.9, kind: 'spin', radius: 110 },
	{ ...base, id: 's_spin_ag', element: 'steel', power: 1.9, kind: 'spin', radius: 110, afterGuard: 1.255 },
	{ ...base, id: 's_barrage', element: 'ice', power: 0.9, kind: 'barrage', radius: 150 },
	{ ...base, id: 's_melee2', element: 'steel', power: 0.8, kind: 'melee', range: 80, count: 2 },
	{ ...base, id: 's_melee_ch', element: 'steel', power: 2.8, kind: 'melee', range: 96, charge: 0.333 },
	{ ...base, id: 's_melee_arc0', element: 'steel', power: 1, kind: 'melee', range: 96, arc: 0, charge: 0 },
	{ ...base, id: 's_melee_arc', element: 'steel', power: 1, kind: 'melee', range: 96, arc: 32.5, count: 1 },
	{ ...base, id: 's_guard', element: 'steel', power: 1.4, kind: 'guard' },
	{ ...base, id: 's_guard_p', element: 'steel', power: 2.8, kind: 'guard', guard: 'parry', duration: 0.6 },
	{ ...base, id: 's_guard_s', element: 'steel', power: 2.2, kind: 'guard', guard: 'still', duration: 5 },
	{ ...base, id: 's_blink', element: 'steel', power: 2, kind: 'blink', range: 260 },
	{ ...base, id: 's_summon_e', element: 'earth', power: 1.7, kind: 'summon', range: 260, radius: 115, duration: 10 },
	{ ...base, id: 's_summon_s', element: 'steel', power: 0.95, kind: 'summon', count: 3, range: 320, duration: 6, tick: 0.4 },
	{ ...base, id: 's_proj3', element: 'wind', power: 1.2, kind: 'projectile', count: 3, spread: 12.5, range: 300, pierce: true },
	{ ...base, id: 's_proj_ret', element: 'steel', power: 1.8, kind: 'projectile', range: 320, returns: true },
	{ ...base, id: 's_proj_steel', element: 'steel', power: 3, kind: 'projectile', range: 440 },
	{ ...base, id: 's_proj', element: 'fire', power: 1.4, kind: 'projectile' },
	{ ...base, id: 's_heal', element: 'healing', power: 0.125, kind: 'heal' },
	{ ...base, id: 's_heal2', element: 'healing', power: 0.345, kind: 'heal' },
	{ ...base, id: 's_weird', element: 'fire', power: -0.004, kind: 'weird' as SkillDef['kind'] },
	{
		...base,
		id: 's_hit',
		element: 'earth',
		power: 1e21,
		kind: 'melee',
		hit: { knock: 12.5, stun: 0.005, launch: 1.005, freeze: 2.675, freezeChilled: -0.001, drain: 0.145, armor: 1e-7, sunder: 3 },
		crit: 0.005,
	},
	{ ...base, id: 's_hit0', element: 'earth', power: 1, kind: 'melee', hit: { knock: 0, stun: 0 }, crit: 1.5 },
	{ ...base, id: 's_critneg', element: 'earth', power: 1, kind: 'melee', crit: -0.2, blade: true },
];
const allSkills = [...HERO_SKILLS, ...synth];
const hits = [0, 7, 12.5, 33, 1234, 0.1 + 0.2, -3.5, 1e-7, 2.5];

// ——— skills.ts ———
const skills = {
	synth,
	isSwordSkill: allSkills.map((s) => ({ id: s.id, out: isSwordSkill(s) })),
	isGroundTarget: allSkills.map((s) => ({ id: s.id, out: isGroundTarget(s) })),
	skillFacts: allSkills.map((s) => ({ id: s.id, out: skillFacts(s) })),
	powerText: allSkills.map((s) => ({ id: s.id, out: powerText(s) })),
	estimateText: allSkills.flatMap((s) => hits.map((hit) => ({ id: s.id, hit, out: estimateText(s, hit) }))),
	skillDesc: [...HERO_SKILLS.map((s) => s.id), 'khong_co'].map((id) => ({ id, out: skillDesc(id) })),
};

// ——— talents.ts ———
const loadouts: (string | null)[][] = [
	Array(10).fill(null),
	['slash', 'aether_bolt', null, null, null, null, null, null, null, null],
	['meteor', 'heal', 'slash', 'fire_bolt', 'water_lance', 'wind_blade', 'ice_shard', 'quake', 'cyclone', 'tidal_wave'],
	['slash'],
	[null, null, 'heal', null, null, 'meteor', null, null, null, null],
];
const knownLists = [[], ['slash', 'aether_bolt'], ['heal', 'meteor', 'slash', 'fire_bolt', 'water_lance', 'wind_blade', 'ice_shard', 'aether_bolt', 'quake', 'cyclone', 'tidal_wave', 'rockslide'], HERO_SKILLS.map((s) => s.id)];
const rawLoadouts: unknown[] = ['abc', 42, null, { a: 1 }, [], ['slash', 'slash', 7, null, 'heal', 'meteor', 'nope'], ...loadouts, Array.from({ length: 14 }, () => pick(HERO_SKILLS).id)];

const talents = {
	tierSets,
	unlockSets,
	treeOf: BRANCHES.flatMap((b) => [...styles, 'bogus' as SwordStyle].map((style) => ({ branch: b, style, out: treeOf(b, style).map((n) => ({ tier: n.tier, name: n.name, skillId: n.skillId ?? null, ready: n.ready })) }))),
	tierCap: BRANCHES.map((b) => ({ branch: b, out: tierCap(b) })),
	tiersFrom: tierSets.flatMap((t, ti) => unlockSets.map((_, u) => ({ t: ti, u, out: tiersFrom(t, unlocker(u)) }))),
	spentPoints: tierSets.map((t, ti) => ({ t: ti, out: spentPoints(t) })),
	unspent: tierSets.flatMap((t, ti) => [1, 5, 20, 40, 99].flatMap((level) => [0, 3, 2000].map((bonus) => ({ t: ti, level, bonus, out: unspent(level, t, bonus) })))),
	nextTierCost: tierSets.flatMap((t, ti) => branchesX.flatMap((b) => unlockSets.map((_, u) => ({ t: ti, branch: b, u, out: nextTierCost(t, b, unlocker(u)) })))),
	addTier: tierSets.flatMap((t, ti) =>
		branchesX.flatMap((b) =>
			[1, 10, 40].flatMap((level) =>
				[0, 5].flatMap((bonus) =>
					unlockSets.map((_, u) => {
						const after = { ...t };
						const out = addTier(level, after, b, unlocker(u), bonus);
						return { t: ti, branch: b, level, bonus, u, out, after };
					}),
				),
			),
		),
	),
	fitTiers: tierSets.flatMap((t, ti) => [0, 3, 10, 12.5, 29, 47, 100, -5].map((points) => ({ t: ti, points, out: fitTiers(t, points) }))),
	depthBonus: [-3, 0, 0.5, 1, 1.9, 2, 5, 7.5, 9, 10, 11, 15].map((tier) => ({ tier, out: depthBonus(tier) })),
	aetherScale: levels.map((level) => ({ level, out: aetherScale(level) })),
	skillScale: tierSets.slice(0, 16).flatMap((t, ti) => [...HERO_SKILLS.map((s) => s.id), 'nope'].flatMap((id) => [1, 20, 40.7, 77].map((level) => ({ t: ti, id, level, out: skillScale(t, id, level) })))),
	knowsSkill: tierSets.slice(0, 14).flatMap((t, ti) => HERO_SKILLS.flatMap((s) => unlockSets.flatMap((_, u) => styles.map((style) => ({ t: ti, id: s.id, u, style, out: knowsSkill(s, t, unlocker(u), style) }))))),
	passiveEffects: tierSets.flatMap((t, ti) => [...styles, 'bogus' as SwordStyle].map((style) => ({ t: ti, style, out: passiveEffects(t, style) }))),
	reactionOfPair: branchesX.flatMap((a) => branchesX.map((b) => ({ a, b, out: reactionOfPair(a, b) }))),
	reactionBonus: tierSets.flatMap((t, ti) => BRANCHES.flatMap((a) => BRANCHES.map((b) => ({ t: ti, a, b, out: reactionBonus(t, a, b) })))),
	describeBuild: tierSets.flatMap((t, ti) => styles.map((style) => ({ t: ti, style, out: describeBuild(t, style) }))),
	resetCost: [0, 1, 5, 5.5, 6, 40, 100].map((level) => ({ level, out: resetCost(level) })),
	enchantDesc: [...ENCHANTS, 'sword', 'bogus'].flatMap((e) => [0, 4, 5, 6, 6.9, 7, 10].map((tier) => ({ e, tier, out: enchantDesc(e as never, tier) }))),
	canEnchant: tierSets.flatMap((t, ti) => [...ENCHANTS, 'sword'].map((e) => ({ t: ti, e, out: canEnchant(t, e as never) }))),
	placeSkill: loadouts.flatMap((lo) => ['slash', 'heal', 'meteor', 'ice_shard', 'aether_bolt', 'quake'].map((id) => ({ loadout: lo, id, out: placeSkill(lo, id) }))),
	defaultLoadout: knownLists.map((known) => ({ known, out: defaultLoadout(known) })),
	normalizeLoadout: rawLoadouts.flatMap((raw) => knownLists.map((known) => ({ raw, known, out: normalizeLoadout(raw, known) }))),
	assignSlot: loadouts.flatMap((lo) => [-1, 0, 3, 9, 10].flatMap((slot) => [null, 'slash', 'heal', 'meteor'].map((id) => ({ loadout: lo, slot, id, out: assignSlot(lo, slot, id) })))),
};

const doc = { skills, talents };
// JSON không có NaN/Infinity: đổi thành chuỗi (TestData.Num đọc lại).
const json = JSON.stringify(doc, (_k, v) => (typeof v === 'number' && !Number.isFinite(v) ? String(v) : v), '\t');
writeFileSync(join(OUT, 'talents-full.json'), `${json}\n`);
const count = (o: Record<string, unknown>) => Object.entries(o).reduce((a, [k, v]) => a + (Array.isArray(v) && !['synth', 'tierSets', 'unlockSets'].includes(k) ? v.length : 0), 0);
console.log(`✔ vector → ${join(OUT, 'talents-full.json')}: ${count(skills)} kỹ năng · ${count(talents)} tiềm năng`);

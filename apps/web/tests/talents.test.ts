// Chạy: npx tsx tests/talents.test.ts — cây Nguyên tố (hàm thuần + lưu ở StoryDirector), bị động mốc 2/4, phủ phép Kiếm,
// thanh 10 ô, và hệ Băng / phản ứng trong trận.
import assert from 'node:assert/strict';
import {
	addTier,
	aetherScale,
	assignSlot,
	baseTier,
	BRANCH_LOCK_NOTE,
	BRANCH_UNLOCK,
	BRANCHES,
	canEnchant,
	defaultLoadout,
	depthBonus,
	describeBuild,
	ENCHANT_SWAP_SECONDS,
	fitTiers,
	FREE_FIRST_TIER,
	HOME_SLOT,
	knowsSkill,
	MAX_LEVEL,
	MAX_TIER,
	TALENT_LEVEL_CAP,
	nextTierCost,
	normalizeLoadout,
	PASSIVE,
	passiveEffects,
	placeSkill,
	pointsForLevel,
	pointsToTier,
	REACTION_PAIR,
	reactionBonus,
	reactionOfPair,
	resetCost,
	SKILL_NODE,
	skillScale,
	SLOT_CODES,
	SLOT_COUNT,
	SLOT_KEYS,
	spentPoints,
	STYLE_TREE,
	SWORD_ART_TIER,
	SWORD_ARTS,
	SWORD_STYLES,
	TIER_COST,
	tierCap,
	tierCost,
	tiersFrom,
	TREE,
	treeOf,
	unspent,
	type Branch,
	type Tiers,
} from '../src/game/combat/talents';
import { HERO_SKILLS } from '../src/game/combat/skills';

const near = (a: number, b: number, what: string) => assert.ok(Math.abs(a - b) < 1e-9, `${what}: ${a} ≠ ${b}`);
const all = (_: string) => true;

// 1) Điểm theo cấp: 1 điểm mỗi lần lên cấp + 1 thưởng ở mỗi mốc 5; cấp tối đa thiết kế 40 = 47 điểm.
{
	const want: [number, number][] = [[1, 0], [2, 1], [4, 3], [5, 5], [6, 6], [9, 9], [10, 11], [15, 17]];
	for (const [lv, pts] of want) assert.equal(pointsForLevel(lv), pts, `cấp ${lv}`);
	assert.equal(pointsForLevel(0), 0, 'cấp lạ (0) coi như cấp 1');
	for (let lv = 2; lv <= 30; lv += 1) assert.equal(pointsForLevel(lv) - pointsForLevel(lv - 1), lv % 5 === 0 ? 2 : 1, `lên cấp ${lv} nhận đúng số điểm`);
	assert.deepEqual([MAX_LEVEL, TALENT_LEVEL_CAP], [100, 40], 'trần cấp 100 (08/10/2026), điểm dừng ở cấp 40');
	assert.equal(pointsForLevel(TALENT_LEVEL_CAP), 47, 'cấp 40 = 47 điểm');
	assert.equal(pointsForLevel(MAX_LEVEL), 47, 'cấp 41–100 không thêm điểm');
}

// 2) Giá mốc: mốc 1 nguyên tố = 1 điểm (học phép đầu — chủ dự án 10/10/2026: mở nhánh chỉ là được phép học), Kiếm mốc 1
//    miễn phí (Trảm có sẵn khi nhận kiếm); mốc 2→10 = 1·2·2·3·3·4·4·5·5. Tích luỹ: Kiếm m10 = 29, nguyên tố m10 = 30. Cấp 40
//    (47 điểm) chỉ master được MỘT nhánh.
{
	assert.deepEqual([...TIER_COST], [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
	assert.deepEqual(FREE_FIRST_TIER, ['sword']);
	assert.deepEqual(BRANCHES.map(baseTier), [1, 0, 0, 0, 0, 0], 'vừa mở: Kiếm mốc 1, nguyên tố mốc 0 (chưa học)');
	assert.deepEqual([tierCost('sword', 1), tierCost('fire', 1), tierCost('sword', 2), tierCost('fire', 2), tierCost('earth', 10)], [0, 1, 1, 1, 5]);
	const tiers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
	assert.deepEqual(tiers.map((t) => pointsToTier(t, 'sword')), [0, 1, 3, 5, 8, 11, 15, 19, 24, 29], 'Kiếm');
	assert.deepEqual(tiers.map((t) => pointsToTier(t, 'fire')), [1, 2, 4, 6, 9, 12, 16, 20, 25, 30], 'nguyên tố: thêm 1 điểm mốc 1');
	assert.deepEqual([pointsToTier(0, 'fire'), pointsToTier(0, 'sword')], [0, 0], 'mốc 0 = chưa tiêu gì');
	assert.deepEqual([pointsToTier(99, 'sword'), pointsToTier(99, 'ice')], [29, 30], 'quá mốc 10 thì kẹp');
	const pts = pointsForLevel(TALENT_LEVEL_CAP);
	for (const main of ['sword', 'fire'] as const) {
		const left = pts - pointsToTier(MAX_TIER, main);
		assert.ok(left < pointsToTier(MAX_TIER, 'sword'), `master ${main}: không master được nhánh thứ hai`);
		assert.ok(pointsToTier(7, 'water') <= left && pointsToTier(8, 'water') > left, `master ${main}: phần dư đủ cho nguyên tố phụ tới mốc 7`);
	}
	assert.equal(pts - pointsToTier(MAX_TIER, 'sword'), 2 * pointsToTier(5, 'fire'), 'master Kiếm (29): dư 18 = đúng hai nguyên tố tới mốc 5 (phủ phép tối đa 2 hệ)');
	assert.equal(pts - pointsToTier(MAX_TIER, 'fire'), pointsToTier(5, 'sword') + pointsToTier(5, 'water'), 'master nguyên tố (30): dư 17 = Kiếm 5 + một nguyên tố 5');
}

// 3) Dữ liệu cây: 6 nhánh × 10 mốc, chủ động 1/3/5/6/8/10, bị động 2/4/7/9; GĐ3 hiện thực mốc 1–9 của 5 nguyên tố, Kiếm
//    giữ mốc 1–5 (mốc 3–5 theo 3 lưu phái — GĐ2 lượt B; mốc 6+ của lưu phái là việc sau).
{
	assert.deepEqual([...BRANCHES], ['sword', 'fire', 'water', 'wind', 'ice', 'earth']);
	for (const b of BRANCHES) {
		assert.equal(TREE[b].length, 10, `${b}: 10 mốc`);
		assert.deepEqual(TREE[b].map((n) => n.tier), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
		assert.deepEqual(TREE[b].filter((n) => n.kind === 'active').map((n) => n.tier), [1, 3, 5, 6, 8, 10], `${b}: mốc chủ động`);
		for (const n of TREE[b]) assert.ok(n.name && n.desc, `${b} mốc ${n.tier}: có tên + mô tả (kể cả "Sắp có")`);
	}
	const first: Record<string, string> = { sword: 'slash', fire: 'fire_bolt', water: 'water_lance', wind: 'wind_blade', ice: 'ice_shard', earth: 'rock_throw' };
	for (const [b, id] of Object.entries(first)) {
		const ready = TREE[b as Branch].filter((n) => n.ready).map((n) => n.tier);
		const cap = 9;
		assert.deepEqual(ready, Array.from({ length: cap }, (_, i) => i + 1), `${b}: mốc đã hiện thực`);
		assert.equal(TREE[b as Branch][0]!.skillId, id, `${b}: mốc 1 là kỹ năng có sẵn`);
		assert.equal(tierCap(b as Branch), cap, `${b}: trần GĐ3 — mọi nhánh mốc 9 (Kiếm: lượt B, ba lưu phái đủ mốc 3–9)`);
		assert.equal(HERO_SKILLS.find((s) => s.id === id)?.unlock, BRANCH_UNLOCK[b as Branch], `${id}: mở cùng mã với nhánh`);
	}
	assert.deepEqual(SKILL_NODE.heal, { branch: 'water', tier: 3 }, 'Suối Lành = Thuỷ mốc 3');
	const heal = HERO_SKILLS[5]!;
	assert.deepEqual([heal.id, heal.name, heal.unlock], ['heal', 'Suối Lành', undefined], 'Suối Lành không còn mở bằng cốt truyện');
	assert.equal(SKILL_NODE.aether_bolt, undefined, 'Tia Aether ngoài cây');
	assert.deepEqual(TREE.earth.filter((n) => n.ready && n.skillId).map((n) => n.skillId), ['rock_throw', 'quake', 'stone_spikes', 'stone_wall', 'rockslide'], 'Thổ: Đá Văng · Địa Chấn · Gai Đá · Tường Đá · Lở Đá');
	// Mốc 10 gắn tuyệt kỹ nhưng vẫn "Sắp có" ở game thật (chỉ phòng tập dùng — 10/10/2026).
	assert.deepEqual([TREE.earth[9]!.skillId, TREE.earth[9]!.ready], ['mountain_god', false], 'Thổ mốc 10: Sơn Thần, chưa mở ở game thật');
	assert.match(BRANCH_LOCK_NOTE.earth ?? '', /tuổi 16/, 'Thổ chưa mở: nhắc nhiệm vụ tuổi 16 (chỉ là chữ, không khoá cứng)');
	const ice = HERO_SKILLS[6]!;
	assert.deepEqual([ice.id, ice.element, ice.mpCost, ice.cooldown, ice.power, ice.kind, ice.speed, ice.range, ice.unlock, ice.anim], ['ice_shard', 'ice', 9, 1.8, 1.35, 'projectile', 440, 420, 'ice', 'cast'], 'Băng Tiễn ở chỉ số 6');
}

// 4) Mốc suy từ số mốc đã mua + nhánh đã mở (`baseTier` + số đã mua): Kiếm mở là mốc 1, nguyên tố mở là mốc 0 (chưa học);
//    Thổ mở khi có mã `earth`; kẹp ở trần đã hiện thực (mọi nhánh mốc 9).
{
	const has = new Set(['sword', 'staff', 'fire', 'earth']);
	const t = tiersFrom({ sword: 20, fire: 20, water: 3, ice: -4, earth: 5 }, (id) => has.has(id));
	assert.deepEqual(t, { sword: 9, fire: 9, water: 0, wind: 0, ice: 0, earth: 5 });
	assert.equal(spentPoints(t), 24 + 25 + 9);
	assert.equal(tiersFrom({ earth: 3 }, (id) => id !== 'earth').earth, 0, 'chưa có mã: Thổ 0 dù bản lưu có số');
	assert.deepEqual(tiersFrom({}, (id) => has.has(id)), { sword: 1, fire: 0, water: 0, wind: 0, ice: 0, earth: 0 }, 'vừa mở chưa mua gì: Kiếm 1 (Trảm), Hoả / Thổ 0');
	assert.equal(spentPoints(tiersFrom({}, (id) => has.has(id))), 0);
}

// 5) Cộng mốc: giá đúng, không vượt trần đã hiện thực, nhánh chưa mở / nhánh lạ / hết điểm thì không. Nhánh nguyên tố ĐÃ MỞ ở
//    mốc 0 khác nhánh CHƯA MỞ: đã mở thì nấc kế là học phép đầu (1 điểm), chưa mở thì null.
{
	const open = (id: string) => id !== 'earth';
	const t: Tiers = { sword: 1, fire: 0, water: 0, earth: 0 };
	assert.equal(nextTierCost(t, 'fire', open), 1, 'Hoả đã mở, mốc 0: học Hoả Cầu = 1 điểm');
	assert.equal(nextTierCost(t, 'earth', open), null, 'Thổ chưa mở: không có nấc kế dù cũng mốc 0');
	assert.equal(addTier(1, t, 'fire', open), null, 'cấp 1 chưa có điểm: chưa học được Hoả Cầu');
	assert.equal(addTier(2, t, 'fire', open), 1, 'cấp 2 = 1 điểm: học Hoả Cầu (mốc 1)');
	assert.equal(knowsSkill(HERO_SKILLS.find((s) => s.id === 'fire_bolt')!, t, open), true, 'mua mốc 1 là học Hoả Cầu');
	assert.equal(nextTierCost(t, 'fire', open), 1, 'mốc 2 = 1 điểm');
	assert.equal(addTier(2, t, 'fire', open), null, 'cấp 2 đã tiêu hết');
	assert.equal(addTier(3, t, 'fire', open), 2, 'cấp 3 = 2 điểm: mốc 2');
	assert.equal(nextTierCost(t, 'fire', open), 2);
	assert.equal(addTier(4, t, 'fire', open), null, 'cấp 4 còn 1 điểm, mốc 3 cần 2');
	assert.equal(unspent(4, t), 1);
	assert.equal(addTier(5, t, 'fire', open), 3, 'cấp 5 = 5 điểm: mốc 3 (Vòng Lửa), tổng 4');
	assert.equal(addTier(6, t, 'fire', open), 4, 'cấp 6 = 6 điểm: mốc 4, tổng 6');
	assert.equal(nextTierCost(t, 'fire', open), 3, 'mốc 5 = 3 điểm');
	assert.equal(addTier(8, t, 'fire', open), null, 'cấp 8 = 8 điểm, mốc 5 cần tổng 9');
	assert.equal(addTier(9, t, 'fire', open), 5, 'cấp 9 = 9 điểm: Bộc Hoả');
	assert.equal(nextTierCost(t, 'fire', open), 3, 'mốc 6 = 3 điểm (GĐ3)');
	assert.equal(addTier(10, t, 'fire', open), null, 'cấp 10 = 11 điểm, mốc 6 cần tổng 12');
	assert.equal(addTier(11, t, 'fire', open), 6, 'cấp 11 = 12 điểm: Tường Lửa');
	assert.deepEqual([7, 8, 9].map(() => addTier(40, t, 'fire', open)), [7, 8, 9], 'mốc 7 (Tro Tàn), 8 (Thiên Thạch), 9 (Hoả Thân)');
	assert.equal(nextTierCost(t, 'fire', open), null, 'trần GĐ3: mốc 9 (tuyệt kỹ mốc 10 — GĐ4)');
	assert.equal(addTier(40, t, 'fire', open), null);
	assert.equal(addTier(40, t, 'sword', open), 2, 'Kiếm mốc 2 (Nhịp Chém) — Kiếm mốc 1 có sẵn');
	// Hàm thuần không biết lưu phái — chọn lưu phái ở mốc 3 do StoryDirector.spendTalent bắt (mục 13).
	assert.equal(addTier(40, t, 'sword', open), 3, 'Kiếm mốc 3');
	assert.equal(addTier(40, t, 'sword', open), 4);
	assert.equal(addTier(40, t, 'sword', open), 5);
	assert.deepEqual([6, 7, 8].map(() => addTier(40, t, 'sword', open)), [6, 7, 8], 'GĐ3 lượt B: Kiếm mốc 6–8');
	assert.equal(addTier(40, t, 'sword', open), null, 'cấp 40: Hoả 9 (25) + Kiếm 8 (19) = 44 điểm, Kiếm mốc 9 cần 5 (còn 3) — chỉ master được một nhánh');
	const k: Tiers = { sword: 8 };
	assert.equal(addTier(40, k, 'sword', open), 9, 'Kiếm mốc 9');
	assert.equal(nextTierCost(k, 'sword', open), null, 'Kiếm trần mốc 9 (tuyệt kỹ mốc 10 — GĐ4)');
	assert.equal(addTier(40, t, 'earth', open), null, 'Thổ chưa mở (chưa có mã)');
	assert.equal(addTier(40, { sword: 0 }, 'sword', () => false), null, 'nhánh chưa mở');
	assert.equal(addTier(40, t, 'bogus' as Branch, open), null, 'nhánh lạ');
	assert.equal(unspent(40, t), 47 - 25 - 19);
	assert.deepEqual([0, 1, 5, 6, 12].map(resetCost), [0, 0, 0, 60, 120], 'tẩy điểm: miễn phí tới cấp 5, sau đó 10 xu × cấp');
	// Chia lại điểm khi không đủ giữ mọi mốc (chuyển bản lưu): nhánh sâu nhất giữ trước, nhánh chỉ có mốc 1 mất trước, không âm.
	assert.deepEqual(fitTiers({ fire: 5, water: 1 }, 99), { fire: 5, water: 1 }, 'đủ điểm: giữ nguyên');
	assert.deepEqual(fitTiers({ fire: 5, water: 1 }, 8), { fire: 4, water: 1 }, 'Hoả 5 (9) + Thuỷ 1 (1) với 8 điểm: Hoả 4 (6) + Thuỷ 1, dư 1');
	assert.deepEqual(fitTiers({ sword: 2, fire: 3, water: 2, wind: 1, ice: 1 }, 5), { sword: 2, fire: 3, water: 0, wind: 0, ice: 0 }, 'nhánh sâu nhất (Hoả 3) trước, rồi Kiếm 2 (bằng mốc: nhánh mở trước)');
	assert.deepEqual(fitTiers({ fire: 1, water: 1, wind: 1, ice: 1 }, 3), { fire: 1, water: 1, wind: 1, ice: 0 }, 'chỉ mốc 1: nhánh mở sau mất trước');
	assert.deepEqual(fitTiers({ sword: 3, fire: 1 }, 0), { sword: 1, fire: 0 }, 'Kiếm không xuống dưới mốc có sẵn');
	assert.deepEqual(fitTiers({ fire: 2 }, -5), { fire: 0 }, 'điểm âm coi như 0');
	for (const [want, pts] of [[{ sword: 9, fire: 9, water: 9, ice: 9 }, 47], [{ fire: 3, wind: 7 }, 12], [{ earth: 9, sword: 2 }, 3]] as [Tiers, number][]) {
		const kept = fitTiers(want, pts);
		assert.ok(spentPoints(kept) <= pts, `fitTiers không bao giờ tiêu quá điểm (${JSON.stringify(want)} / ${pts})`);
	}
}

// 6) Thưởng chiều sâu +4%/mốc trên mốc 1 (mốc 10 = +36%), thay rankPower; Tia Aether theo cấp.
{
	near(depthBonus(0), 1, 'chưa mở');
	near(depthBonus(1), 1, 'mốc 1');
	near(depthBonus(4), 1.12, 'mốc 4');
	near(depthBonus(10), 1.36, 'mốc 10');
	near(depthBonus(99), 1.36, 'kẹp');
	near(skillScale({ fire: 4 }, 'fire_bolt', 1), 1.12, 'Hoả Cầu theo mốc Hoả');
	near(skillScale({ water: 3 }, 'heal', 1), 1.08, 'Suối Lành theo mốc Thuỷ');
	near(skillScale({}, 'slash', 1), 1, 'chưa có mốc');
	near(skillScale({ sword: 9 }, 'aether_bolt', 1), 1, 'Aether không ăn mốc nhánh nào');
	near(aetherScale(1), 1, 'Aether cấp 1');
	near(aetherScale(11), 1.3, 'Aether +3%/cấp');
	near(skillScale({}, 'aether_bolt', 40), 1 + 0.03 * 39, 'Aether cấp 40');
}

// 7) Phản ứng: +5% mỗi mốc (trên mốc 1) của hệ yếu hơn — không còn đòi "build song hệ", bỏ +6%/điểm cũ.
{
	assert.deepEqual(REACTION_PAIR, {
		steam: ['fire', 'water'],
		burst: ['fire', 'wind'],
		chill: ['water', 'wind'],
		freeze: ['ice', 'water'],
		melt: ['ice', 'fire'],
		mud: ['earth', 'water'],
		lava: ['earth', 'fire'],
		sandstorm: ['earth', 'wind'],
		shatter: ['earth', 'ice'],
	});
	for (const [id, [a, b]] of Object.entries(REACTION_PAIR) as [keyof typeof REACTION_PAIR, [Branch, Branch]][]) {
		assert.equal(reactionOfPair(a, b), id);
		assert.equal(reactionOfPair(b, a), id, 'không phụ thuộc thứ tự');
		near(reactionBonus({ [a]: 4, [b]: 3 }, a, b), 1.1, `${id}: hệ yếu mốc 3`);
		near(reactionBonus({ sword: 4, earth: 4, [a]: 4, [b]: 3 }, b, a), 1.1, `${id}: build có thêm nhánh khác vẫn ăn`);
	}
	assert.equal(reactionOfPair('sword', 'fire'), null);
	near(reactionBonus({ ice: 1, water: 1 }, 'ice', 'water'), 1, 'mốc 1: +0%');
	near(reactionBonus({ ice: 0, water: 5 }, 'ice', 'water'), 1, 'một hệ chưa học (mốc 0): +0%');
	near(reactionBonus({ ice: 10, water: 10 }, 'ice', 'water'), 1.45, 'tối đa');
}

// 8) Bị động mốc 2 (chỉ chính nguyên tố đó) + mốc 4 (bị động chung).
{
	const none = passiveEffects({ sword: 1, fire: 1, water: 1, wind: 1, ice: 1, earth: 1 });
	assert.deepEqual(
		none,
		{
			swordCooldown: 1,
			crit: 0,
			burn: 1,
			burning: 1,
			wet: 1,
			wetSlow: 1,
			lifesteal: 0,
			windShot: 1,
			cooldown: 1,
			moveSpeed: 1,
			chill: 1,
			frost: false,
			damageTaken: 1,
			earthCC: 1,
			defense: 1,
			steadfast: false,
			calm: 1,
			dodgeCost: 1,
			ember: false,
			burnDamage: 1,
			fireResist: false,
			spring: false,
			wetTaken: 1,
			dodgeHaste: 1,
			gust: false,
			freeze: 1,
			frozenTaken: 1,
			gravity: false,
			hpMax: 1,
			mountain: false,
			press: false,
			rage: false,
			riposte: false,
			lake: false,
			momentum: false,
			evade: 0,
		},
		'mốc 1 chưa có bị động',
	);
	const two = passiveEffects({ sword: 2, fire: 2, water: 2, wind: 2, ice: 2, earth: 2 });
	near(two.swordCooldown, 1 / 1.1, 'Nhịp Chém');
	assert.deepEqual([two.burn, two.wet, two.wetSlow, two.windShot, two.chill, two.frost, two.earthCC], [1.5, 1.5, 0.9, 1.2, 1.6, true, 1.5], 'mốc 2 của từng hệ (Thấm Sâu thêm chậm 10%, Đá Nặng)');
	assert.deepEqual([two.crit, two.burning, two.lifesteal, two.cooldown, two.moveSpeed, two.damageTaken, two.defense, two.steadfast], [0, 1, 0, 1, 1, 1, 1, false], 'mốc 2 không cho bị động chung');
	const four = passiveEffects({ sword: 4, fire: 4, water: 4, wind: 4, ice: 4, earth: 4 }, 'kiem_than');
	assert.deepEqual([four.crit, four.burning, four.lifesteal, four.cooldown, four.moveSpeed, four.damageTaken, four.defense, four.steadfast], [PASSIVE.crit, 1.2, 0.05, 0.9, 1.1, 0.9, 1.15, true], 'mốc 4 (Huyết Thuỷ, Da Đá; Kiếm Thần: Mắt Tinh)');
	// Kiếm mốc 4 theo lưu phái: chưa chọn lưu phái thì không có bị động mốc 4 nào.
	assert.equal(passiveEffects({ sword: 4 }).crit, 0, 'Kiếm 4 không lưu phái: không có Mắt Tinh');
	assert.deepEqual([passiveEffects({ sword: 4 }, 'thuy_than').calm, passiveEffects({ sword: 3 }, 'thuy_than').calm], [PASSIVE.calm, 1], 'Tâm Tĩnh: Thủy Thần mốc 4');
	const swift = passiveEffects({ sword: 4, wind: 4 }, 'bac_than');
	near(swift.moveSpeed, PASSIVE.moveSpeed * PASSIVE.swiftMove, 'Nhẹ Như Gió nhân chồng Thuận Gió');
	assert.deepEqual([swift.dodgeCost, swift.crit, swift.calm], [PASSIVE.swiftDodge, 0, 1], 'Bắc Thần: né rẻ hơn, không có bị động của lưu phái khác');
	assert.deepEqual([TREE.sword[1]!.name, TREE.water[1]!.name, TREE.water[3]!.name], ['Nhịp Chém', 'Thấm Sâu', 'Huyết Thuỷ'], 'tên bị động GĐ1.5');
}

// 9) Học kỹ năng: Trảm (Kiếm mốc 1) chỉ cần mã cốt truyện; phép mốc 1 của nguyên tố phải HỌC (nhánh ≥ mốc 1 — luật
//    10/10/2026, mở nhánh chưa đủ); Suối Lành cần Thuỷ mốc 3; Tia Aether bẩm sinh.
{
	const heal = HERO_SKILLS[5]!;
	assert.equal(knowsSkill(heal, { water: 2 }, all), false);
	assert.equal(knowsSkill(heal, { water: 3 }, all), true);
	assert.equal(knowsSkill(HERO_SKILLS[0]!, {}, all), true, 'Trảm: có kiếm là dùng được');
	assert.equal(knowsSkill(HERO_SKILLS[0]!, { sword: 4 }, () => false), false, 'chưa nhận kiếm');
	assert.equal(knowsSkill(HERO_SKILLS.find((s) => s.id === 'aether_bolt')!, {}, all), true, 'Tia Aether: có trượng là dùng được');
	const first: Record<string, string> = { fire: 'fire_bolt', water: 'water_lance', wind: 'wind_blade', ice: 'ice_shard', earth: 'rock_throw' };
	for (const [b, id] of Object.entries(first)) {
		const s = HERO_SKILLS.find((x) => x.id === id)!;
		assert.equal(knowsSkill(s, {}, all), false, `${id}: mở nhánh chưa đủ — chưa nhận mốc nào thì chưa học`);
		assert.equal(knowsSkill(s, { [b]: 0 }, all), false, `${id}: nhánh mở ở mốc 0 = chưa học`);
		assert.equal(knowsSkill(s, { [b]: 1 }, all), true, `${id}: mua mốc 1 là học`);
		assert.equal(knowsSkill(s, { [b]: 1 }, (u) => u !== BRANCH_UNLOCK[b as Branch]), false, `${id}: thiếu mã cốt truyện thì không`);
	}
}

// 10) Lối build chỉ để hiển thị (không còn thưởng/phạt theo build).
{
	assert.equal(describeBuild({ sword: 1, fire: 1 }).kind, 'none');
	const f = describeBuild({ ice: 4, fire: 1 });
	assert.deepEqual([f.kind, f.label], ['focused', 'Thuần Băng']);
	assert.match(f.detail, /Băng mốc 4 \(\+12%\)/);
	const h = describeBuild({ water: 4, ice: 3 });
	assert.deepEqual([h.kind, h.label], ['hybrid', 'Thuỷ – Băng']);
	assert.match(h.detail, /Đóng Băng \+10%/);
	assert.equal(describeBuild({ sword: 2, fire: 2, ice: 2 }).kind, 'spread');
}

// 11) Phủ phép: Kiếm ≥ mốc 2 VÀ nguyên tố ≥ mốc 5 (GĐ1 chưa ai đạt — trần mốc 4).
{
	assert.equal(canEnchant({ sword: 2, ice: 5 }, 'ice'), true);
	assert.equal(canEnchant({ sword: 1, ice: 5 }, 'ice'), false, 'Kiếm mốc 1');
	assert.equal(canEnchant({ sword: 10, ice: 4 }, 'ice'), false, 'Băng mốc 4');
	assert.equal(canEnchant({ sword: 10, fire: 10 }, 'ice'), false, 'nguyên tố khác không tính');
	const cap = tiersFrom({ sword: 9, ice: 9 }, all);
	assert.deepEqual([cap.sword, cap.ice], [9, 9], 'kẹp trần: Kiếm 9, Băng 9 (GĐ3)');
	assert.equal(canEnchant(cap, 'ice'), true, 'Kiếm mốc 9 + Băng mốc 9 → phủ được');
	assert.equal(canEnchant({ sword: 2, earth: 5 }, 'earth'), true, 'phủ Thổ');
	assert.equal(ENCHANT_SWAP_SECONDS, 10);
}

// 12) Thanh 10 ô: phím J, K, 1–8; mặc định theo ô cũ; kẹp bản lưu; đổi chỗ khi gán.
{
	assert.equal(SLOT_COUNT, 10);
	assert.deepEqual([...SLOT_KEYS], ['J', 'K', '1', '2', '3', '4', '5', '6', '7', '8']);
	assert.deepEqual([...SLOT_CODES], ['KeyJ', 'KeyK', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8']);
	for (const s of HERO_SKILLS.filter((d) => d.key)) assert.equal(SLOT_KEYS[HOME_SLOT[s.id]!], s.key, `${s.id}: ô nhà = phím cũ`);
	for (const s of HERO_SKILLS.filter((d) => !d.key)) assert.equal(HOME_SLOT[s.id], undefined, `${s.id}: kỹ năng GĐ2 không có ô nhà — vào ô trống đầu tiên`);
	assert.equal(placeSkill(defaultLoadout(['slash', 'aether_bolt', 'fire_bolt', 'water_lance', 'wind_blade', 'heal', 'ice_shard']), 'flame_ring')[7], 'flame_ring', 'Vòng Lửa vào ô 6 (trống đầu tiên)');
	const known = ['slash', 'aether_bolt', 'fire_bolt', 'water_lance', 'wind_blade', 'ice_shard'];
	assert.deepEqual(defaultLoadout(known), ['slash', 'aether_bolt', 'fire_bolt', 'water_lance', 'wind_blade', null, 'ice_shard', null, null, null], 'mặc định J=Trảm, K=Tia Aether, rồi đúng phím cũ');
	assert.deepEqual(defaultLoadout([]), Array(10).fill(null));
	// Mới mở trượng trước kiếm: Aether vẫn vào ô K, không chiếm ô J.
	assert.deepEqual(defaultLoadout(['aether_bolt']).slice(0, 2), [null, 'aether_bolt']);

	const saved = ['heal', 'slash', 'slash', 'bogus', 7, 'fire_bolt'];
	assert.deepEqual(normalizeLoadout(saved, known), [null, 'slash', null, null, null, 'fire_bolt', null, null, null, null], 'mất Suối Lành / id lạ / trùng → ô trống');
	assert.equal(normalizeLoadout('rác', known), null);
	assert.equal(normalizeLoadout(undefined, known), null, 'bản lưu thiếu → bên gọi dựng mặc định');

	let lo = placeSkill(defaultLoadout(known), 'heal');
	assert.equal(lo[5], 'heal', 'học Suối Lành → ô nhà (phím 4)');
	lo = assignSlot(lo, 5, 'fire_bolt');
	assert.deepEqual([lo[2], lo[5]], ['heal', 'fire_bolt'], 'gán kỹ năng đã có ở ô khác = đổi chỗ');
	lo = assignSlot(lo, 9, 'slash');
	assert.deepEqual([lo[0], lo[9]], [null, 'slash'], 'chuyển sang ô trống');
	lo = assignSlot(lo, 9, null);
	assert.equal(lo[9], null, 'gỡ khỏi ô');
	assert.deepEqual(assignSlot(lo, 12, 'slash'), lo, 'ô lạ: không đổi');
	const full = placeSkill(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'], 'heal');
	assert.ok(!full.includes('heal'), 'hết ô thì không chen');
}

// 13) StoryDirector: hoàn điểm bản lưu cũ (một lần), kẹp bản lưu mới, cộng/tẩy, lưu thanh + phủ phép.
const store = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
	getItem: (k: string) => store.get(k) ?? null,
	setItem: (k: string, v: string) => void store.set(k, v),
	removeItem: (k: string) => void store.delete(k),
	clear: () => store.clear(),
	key: () => null,
	length: 0,
};
{
	const { STORY } = await import('../src/game/story/story');
	const { StoryDirector } = await import('../src/game/story/StoryDirector');
	const noop = { dialogue() {}, reward() {}, questsChanged() {}, pickups() {}, clearPickups() {}, awakenBoss() {}, spawnZone() {}, questCompleted() {}, unlocked() {}, ageChanged() {}, chapterEnd() {} };
	const childhood = ['c4_silverdew', 'c4_dinner', 'c6_wooden_sword', 'c6_first_thread', 'c6_old_hat', 'c8_forest_edge', 'c8_snow'];
	const save = (level: number, extra: Record<string, unknown>) =>
		store.set('aether.save.v2', JSON.stringify({ version: 2, index: 7, questId: 'y1_mushrooms', accepted: false, ready: false, progress: 0, completed: childhood, unlocked: ['sword', 'staff', 'fire', 'water', 'wind', 'heal'], age: 16, player: { level, exp: 0, coins: 0, potions: 0 }, ...extra }));
	const saved = () => JSON.parse(store.get('aether.save.v2')!) as { talents?: unknown; talentsV?: number; loadout?: unknown; enchant?: unknown };

	// Bản lưu hệ cũ (điểm theo kỹ năng, chưa có talentsV): hoàn TOÀN BỘ, đánh dấu phiên bản.
	save(10, { talents: { sword: 3, aether: 2, healing: 4, fire: 'x' } });
	let d = new StoryDirector(STORY, noop);
	assert.equal(d.refunded, 9, 'hoàn 9 điểm cũ');
	assert.deepEqual(d.state.talents, {});
	assert.equal(d.state.talentsV, 3);
	assert.equal(d.talentsMigrated, null, 'hoàn điểm hệ rất cũ không đi qua chuyển 2 → 3');
	assert.deepEqual(d.talentTiers(), { sword: 1, fire: 0, water: 0, wind: 0, ice: 0, earth: 0 }, 'nhánh đã mở về mốc có sẵn: Kiếm 1, nguyên tố 0 = chưa học (Băng trao bù)');
	d.save();
	d = new StoryDirector(STORY, noop);
	assert.equal(d.refunded, 0, 'nạp lại: không hoàn lặp');

	// Định dạng 3: kẹp trần đã hiện thực, bỏ nhánh khoá/chưa mở, tổng giá vượt điểm thì hạ từ nhánh cuối.
	save(6, { talentsV: 3, talents: { sword: 9, fire: 2.7, water: -3, earth: 4, bogus: 5, ice: 3 } });
	d = new StoryDirector(STORY, noop);
	assert.equal(d.refunded, 0);
	// cấp 6 = 6 điểm: Kiếm kẹp trần mốc 9 (24 điểm) không đủ → hạ dần tới mốc 4 (5) → còn 1; Hoả muốn mốc 2 (2) → mốc 1 (1) → còn 0;
	// Băng muốn mốc 3 → mốc 0 (chưa học). Thổ chưa có mã → bỏ.
	assert.deepEqual(d.state.talents, { sword: 3, fire: 1 });
	assert.deepEqual(d.talentTiers(), { sword: 4, fire: 1, water: 0, wind: 0, ice: 0, earth: 0 });
	assert.ok(unspent(6, d.talentTiers()) >= 0, 'không bao giờ âm điểm');
	assert.deepEqual([d.state.swordStyle, d.styleMigrated], ['kiem_than', true], 'Kiếm mốc 4 chưa có lưu phái → Kiếm Thần');
	for (const bad of [null, 'rác', 7, []]) {
		save(6, { talentsV: 3, talents: bad });
		assert.deepEqual(new StoryDirector(STORY, noop).state.talents, {}, `talents hỏng (${JSON.stringify(bad)}) → {}`);
	}
	save(6, { talentsV: 3, talents: {}, enchant: 'lava' });
	assert.equal(new StoryDirector(STORY, noop).state.enchant, null, 'phủ phép lạ → null');
	store.delete('aether.save.v2');
	d = new StoryDirector(STORY, noop);
	assert.deepEqual([d.state.talents, d.state.talentsV, d.refunded, d.talentsMigrated], [{}, 3, 0, null], 'ván mới');

	save(4, { talentsV: 3, talents: {} });
	d = new StoryDirector(STORY, noop);
	assert.deepEqual([d.talentTiers().water, unspent(4, d.talentTiers())], [0, 3], 'Thuỷ đã mở mà chưa học (mốc 0), cấp 4 = 3 điểm');
	assert.equal(d.spendTalent('water', 4), true, 'Thuỷ mốc 1: học Thuỷ Tiễn (1 điểm)');
	assert.equal(d.spendTalent('water', 4), true, 'Thuỷ mốc 2 (1 điểm)');
	assert.deepEqual(saved().talents, { water: 2 }, 'cộng xong là lưu (định dạng 3: nguyên tố lưu đúng số mốc)');
	assert.equal(d.talentTiers().water, 2);
	assert.equal(d.spendTalent('water', 4), false, 'hết điểm (còn 1, mốc 3 cần 2)');
	assert.equal(d.spendTalent('earth', 40), false, 'Thổ chưa mở');
	assert.equal(d.spendTalent('bogus' as Branch, 40), false);
	assert.equal(d.spendTalent('water', 6), true, 'cấp 6: Thuỷ mốc 3 (Suối Lành)');
	assert.equal(d.spendTalent('water', 8), true, 'cấp 8: Thuỷ mốc 4');
	assert.equal(d.spendTalent('water', 8), false, 'cấp 8 = 8 điểm: mốc 5 cần tổng 9');
	assert.equal(d.spendTalent('water', 9), true, 'cấp 9: Thuỷ mốc 5 (Sóng Dữ)');
	assert.deepEqual([6, 7, 8, 9].map(() => d.spendTalent('water', 40)), [true, true, true, true], 'GĐ3: Thuỷ mốc 6–9 (Gọi Mưa, Mạch Nguồn, Lôi Vũ, Thuỷ Triều Dâng)');
	assert.equal(d.talentTiers().water, 9);
	assert.equal(d.spendTalent('water', 40), false, 'trần mốc 9');
	d.setLoadout(['slash', 'aether_bolt', null, null, null, 'heal', null, null, null, null]);
	d.setEnchant('ice');
	assert.deepEqual([saved().loadout, saved().enchant], [['slash', 'aether_bolt', null, null, null, 'heal', null, null, null, null], 'ice']);
	d.resetTalents();
	assert.deepEqual([saved().talents, saved().enchant], [{}, null], 'tẩy điểm cũng lưu và tắt phủ phép');
	assert.deepEqual([d.talentTiers().water, d.talentTiers().sword, d.isUnlocked('water')], [0, 1, true], 'tẩy xong: nguyên tố về chưa học (mốc 0), Kiếm mốc 1, không mất nhánh');
	assert.equal(d.spendTalent('water', 4), true, 'tẩy xong học lại Thuỷ Tiễn được ngay');

	// 13b) Kiếm 3 lưu phái: lần đầu lên mốc 3 PHẢI chọn lưu phái; đã chọn thì cộng tiếp bình thường; tẩy điểm xoá lưu phái.
	save(10, { talentsV: 3, talents: {} });
	d = new StoryDirector(STORY, noop);
	assert.equal(d.swordStyle, null);
	assert.equal(d.spendTalent('sword', 10), true, 'Kiếm mốc 2 (Nhịp Chém) không cần lưu phái');
	assert.equal(d.spendTalent('sword', 10), false, 'mốc 3 thiếu lưu phái: không lên');
	assert.equal(d.spendTalent('sword', 10, 'bogus' as never), false, 'lưu phái lạ: không lên');
	assert.equal(d.talentTiers().sword, 2);
	assert.equal(d.spendTalent('sword', 10, 'bac_than'), true, 'chọn Bắc Thần ở mốc 3');
	assert.deepEqual([d.swordStyle, (saved() as { swordStyle?: string }).swordStyle, d.talentTiers().sword], ['bac_than', 'bac_than', 3], 'lưu lưu phái cùng mốc');
	assert.equal(d.spendTalent('sword', 10, 'kiem_than'), true, 'mốc 4: đã có lưu phái — tham số lưu phái bị bỏ qua');
	assert.deepEqual([d.swordStyle, d.talentTiers().sword], ['bac_than', 4], 'không đổi lưu phái giữa chừng');
	d.resetTalents();
	assert.deepEqual([d.swordStyle, 'swordStyle' in (saved() as object), d.talentTiers().sword], [null, false, 1], 'tẩy điểm: xoá lưu phái');
	assert.equal(d.spendTalent('sword', 10), true);
	assert.equal(d.spendTalent('sword', 10, 'thuy_than'), true, 'tẩy xong chọn lại lưu phái khác');
	assert.equal(d.swordStyle, 'thuy_than');

	// 13c) Chuyển bản lưu: production GĐ1 (trần Kiếm mốc 4, mốc 4 = Kiếm Tâm) — Kiếm mốc 3–4 chưa có lưu phái → Kiếm Thần,
	// báo một lần; lưu xong nạp lại thì không báo nữa. Bản lưu dev bị lượt A kẹp về mốc 2 thì thôi. Mã lưu phái lạ thì bỏ.
	for (const spent of [2, 3]) {
		save(10, { talentsV: 2, talents: { sword: spent } });
		d = new StoryDirector(STORY, noop);
		assert.deepEqual([d.swordStyle, d.styleMigrated, d.talentTiers().sword], ['kiem_than', true, spent + 1], `Kiếm mốc ${spent + 1} cũ → Kiếm Thần`);
		d.save();
		d = new StoryDirector(STORY, noop);
		assert.deepEqual([d.swordStyle, d.styleMigrated], ['kiem_than', false], 'nạp lại: đã có lưu phái, không báo lặp');
	}
	const fx4 = passiveEffects({ sword: 4 }, d.swordStyle);
	assert.equal(fx4.crit, PASSIVE.crit, 'bản lưu Kiếm mốc 4 cũ giữ đúng chí mạng +8% (Mắt Tinh = Kiếm Tâm)');
	save(10, { talentsV: 2, talents: { sword: 1 } });
	d = new StoryDirector(STORY, noop);
	assert.deepEqual([d.swordStyle, d.styleMigrated], [null, false], 'Kiếm mốc 2 (bản lưu bị lượt A kẹp): không gán lưu phái');
	save(10, { talentsV: 2, talents: { sword: 1 }, swordStyle: 'thuy_than' });
	assert.equal(new StoryDirector(STORY, noop).swordStyle, null, 'Kiếm dưới mốc 3 thì không giữ lưu phái');
	save(10, { talentsV: 2, talents: { sword: 2 }, swordStyle: 'lol' });
	d = new StoryDirector(STORY, noop);
	assert.deepEqual([d.swordStyle, d.styleMigrated], ['kiem_than', true], 'mã lưu phái lạ → coi như chưa có');
	save(10, { talentsV: 2, talents: { sword: 2 }, swordStyle: 'thuy_than' });
	d = new StoryDirector(STORY, noop);
	assert.deepEqual([d.swordStyle, d.styleMigrated], ['thuy_than', false], 'lưu phái hợp lệ giữ nguyên');
	save(10, { talents: { slash: 3 } });
	d = new StoryDirector(STORY, noop);
	assert.deepEqual([d.swordStyle, d.styleMigrated, d.refunded], [null, false, 3], 'bản lưu hệ rất cũ: hoàn điểm, không có lưu phái');

	// 13e) GĐ3 lượt B — bản lưu cũ vẫn nạp được: bản lưu GĐ2 (Kiếm trần mốc 5) giữ nguyên mốc + lưu phái + thanh 10 ô; nạp xong
	// cộng tiếp được lên mốc 6–9 (học kỹ năng / bị động mới); bản lưu ghi số mốc vượt trần cũ (sửa tay / máy chủ) kẹp ở mốc 9.
	save(20, { talentsV: 2, talents: { sword: 4, water: 2 }, swordStyle: 'bac_than', loadout: ['slash', 'aether_bolt', 'side_slash', 'shadow_step', null, null, null, null, null, null], enchant: null });
	d = new StoryDirector(STORY, noop);
	assert.deepEqual([d.refunded, d.styleMigrated, d.swordStyle, d.talentTiers().sword, d.talentTiers().water], [0, false, 'bac_than', 5, 3], 'bản lưu GĐ2: giữ nguyên Kiếm mốc 5 Bắc Thần');
	assert.deepEqual(d.state.loadout, ['slash', 'aether_bolt', 'side_slash', 'shadow_step', null, null, null, null, null, null], 'thanh 10 ô giữ nguyên');
	// Bản lưu định dạng 2 → 3: Hoả / Thuỷ / Phong đã mở nay tính thêm 1 điểm mốc 1 mỗi nhánh — cấp 20 = 23 điểm dư sức, giữ nguyên
	// mọi mốc. Băng được BÙ mã ngay lần nạp này (bản lưu thiếu `ice`) — chưa từng có nên không tính, về mốc 0.
	assert.deepEqual(d.talentsMigrated, { charged: ['fire', 'water', 'wind'], lowered: [], left: 9 });
	assert.deepEqual(d.talentTiers(), { sword: 5, fire: 1, water: 3, wind: 1, ice: 0, earth: 0 });
	// Cấp 23 = 26 điểm; đã dùng 8 (Kiếm 5) + 4 (Thuỷ 3) + 2 (mốc 1 Hoả / Phong) = 14 → còn 12: Kiếm mốc 6 (3) + 7 (4) + 8 (4) = 11.
	assert.deepEqual([6, 7, 8].map(() => d.spendTalent('sword', 23)), [true, true, true], 'cộng tiếp Kiếm mốc 6–8 (Liên Hoàn, Đà Lướt, Phi Kiếm)');
	assert.equal(d.spendTalent('sword', 23), false, 'còn 1 điểm: chưa đủ mốc 9 (5 điểm)');
	assert.equal(d.spendTalent('sword', 40), true, 'cấp 40: Kiếm mốc 9 (Bóng Mờ)');
	assert.equal(d.spendTalent('sword', 40), false, 'trần Kiếm mốc 9');
	assert.deepEqual([(saved() as { talents: { sword: number } }).talents.sword, d.talentTiers().sword, d.swordStyle], [8, 9, 'bac_than'], 'lưu: 8 mốc đã mua = mốc 9');
	save(40, { talentsV: 2, talents: { sword: 15 }, swordStyle: 'thuy_than' });
	d = new StoryDirector(STORY, noop);
	assert.deepEqual([d.talentTiers().sword, d.swordStyle, d.styleMigrated], [9, 'thuy_than', false], 'số mốc vượt trần → kẹp mốc 9, giữ lưu phái');
	save(40, { talentsV: 2, talents: { sword: 6 } });
	d = new StoryDirector(STORY, noop);
	assert.deepEqual([d.talentTiers().sword, d.swordStyle, d.styleMigrated], [7, 'kiem_than', true], 'Kiếm mốc 7 mà thiếu lưu phái (bản lưu lạ) → Kiếm Thần như luật chuyển GĐ1');

	// 13f) Chuyển bản lưu định dạng 2 → 3 (chủ dự án 10/10/2026: phép đầu nhánh nguyên tố học bằng 1 điểm; trước đó mở nhánh là
	//      có mốc 1 miễn phí). Không bao giờ âm điểm; đủ điểm thì giữ NGUYÊN mốc (chỉ bớt điểm chưa cộng); thiếu thì nhánh sâu nhất
	//      giữ trước, nhánh chỉ có mốc 1 mất trước; báo một lần (`talentsMigrated` → Game toast), nạp lại không chuyển lặp.
	{
		const { talentsMigrationText } = await import('../src/game/story/StoryDirector');
		const fireBolt = HERO_SKILLS.find((s) => s.id === 'fire_bolt')!;
		/** Bản lưu định dạng 2 đang ở nhiệm vụ `questId` (chưa nhận), các nhiệm vụ trước đã xong và mã của chúng có sẵn. */
		const v2 = (questId: string, level: number, talents: Record<string, number>, extra: Record<string, unknown> = {}) => {
			const i = STORY.quests.findIndex((q) => q.id === questId);
			const done = STORY.quests.slice(0, i);
			const unlocked = done.flatMap((q) => [q.reward.unlockSkill, q.onGive?.unlock]).filter((x): x is string => !!x);
			store.set('aether.save.v2', JSON.stringify({ version: 2, index: i, questId, accepted: false, ready: false, progress: 0, completed: done.map((q) => q.id), unlocked, age: STORY.quests[i]!.age, player: { level, exp: 0, coins: 0, potions: 0 }, talentsV: 2, talents, ...extra }));
			const dir = new StoryDirector(STORY, noop);
			assert.ok(unspent(level, dir.talentTiers()) >= 0, `${questId} cấp ${level}: không bao giờ âm điểm`);
			assert.equal(dir.state.talentsV, 3);
			return dir;
		};
		// a) Mới mở Hoả (đang làm "Mũ cũ", cấp 1 = 0 điểm): Hoả Cầu (mốc 1 miễn phí cũ) chưa trả nổi → nhánh về mốc 0, báo.
		d = v2('c6_old_hat', 1, {});
		assert.deepEqual([d.talentTiers().fire, knowsSkill(fireBolt, d.talentTiers(), (u) => d.isUnlocked(u))], [0, false]);
		assert.deepEqual(d.talentsMigrated, { charged: ['fire'], lowered: [{ branch: 'fire', from: 1, to: 0 }], left: 0 });
		assert.match(talentsMigrationText(d.talentsMigrated!), /Hoả về chưa học/);
		// … và bài tập "Mũ cũ" không kẹt: chưa học Hoả Cầu thì Tia Aether được tính.
		d.talk('mother_elin');
		d.practiced('aether');
		assert.equal(d.state.progress, 1, 'Mũ cũ: Tia Aether thay Hoả Cầu');
		// Cấp 2 (1 điểm): đủ trả giá mốc 1 → giữ Hoả Cầu.
		d = v2('c6_old_hat', 2, {});
		assert.deepEqual([d.talentTiers().fire, d.state.talents, d.talentsMigrated?.lowered, d.talentsMigrated?.left], [1, { fire: 1 }, [], 0]);
		assert.match(talentsMigrationText(d.talentsMigrated!), /giữ nguyên mọi mốc/);
		// b) Hoả 5 + Thuỷ 1 (đã tiêu đủ 8 điểm của cấp 8 vào Hoả): giờ cần 9 + 1 → Hoả lùi về mốc 4 (6), giữ Thuỷ Tiễn, dư 1.
		d = v2('c8_forest_edge', 8, { fire: 4 });
		assert.deepEqual(d.talentTiers(), { sword: 1, fire: 4, water: 1, wind: 0, ice: 0, earth: 0 });
		assert.deepEqual(d.talentsMigrated, { charged: ['fire', 'water'], lowered: [{ branch: 'fire', from: 5, to: 4 }], left: 1 });
		assert.match(talentsMigrationText(d.talentsMigrated!), /Hoả mốc 5 → 4.*còn 1 điểm/);
		// … cấp 10 (11 điểm) thì đủ: giữ nguyên Hoả 5 + Thuỷ 1, chỉ bớt điểm chưa cộng (còn 1). Nạp lại không chuyển / báo lặp.
		d = v2('c8_forest_edge', 10, { fire: 4 });
		assert.deepEqual([d.talentTiers().fire, d.talentTiers().water, d.state.talents, d.talentsMigrated?.lowered, d.talentsMigrated?.left], [5, 1, { fire: 5, water: 1 }, [], 1]);
		d.save();
		d = new StoryDirector(STORY, noop);
		assert.deepEqual([d.talentsMigrated, d.state.talents, d.talentTiers().fire], [null, { fire: 5, water: 1 }, 5], 'nạp lại: định dạng 3, không chuyển lặp');
		// c) Điểm đã tiêu hết (cấp 5 = 5 điểm: Kiếm 2 + Hoả 3 + Thuỷ 2), mở cả Phong / Băng: nhánh sâu nhất (Hoả 3) giữ trước, rồi
		//    Kiếm 2 (bằng mốc Thuỷ: nhánh mở trước); Thuỷ / Phong / Băng về chưa học — tiêu đúng 5 điểm, không âm.
		d = v2('y1_mushrooms', 5, { sword: 1, fire: 2, water: 1 });
		assert.deepEqual(d.talentTiers(), { sword: 2, fire: 3, water: 0, wind: 0, ice: 0, earth: 0 });
		assert.equal(unspent(5, d.talentTiers()), 0);
		assert.deepEqual(d.talentsMigrated?.lowered, [
			{ branch: 'water', from: 2, to: 0 },
			{ branch: 'wind', from: 1, to: 0 },
			{ branch: 'ice', from: 1, to: 0 },
		]);
		// d) Kiếm sĩ Bắc Thần 4 (5 điểm) + 4 nguyên tố mốc 1 ở cấp 6 (6 điểm): Kiếm giữ nguyên cả lưu phái, Hoả giữ, còn lại về 0.
		d = v2('y1_mushrooms', 6, { sword: 3 }, { swordStyle: 'bac_than' });
		assert.deepEqual([d.talentTiers().sword, d.swordStyle, d.styleMigrated, d.talentTiers().fire, d.talentTiers().water], [4, 'bac_than', false, 1, 0]);
		// e) Chưa mở nhánh nguyên tố nào (đang làm "Sợi tơ đầu tiên"): không có gì để báo.
		d = v2('c6_first_thread', 1, {});
		assert.equal(d.talentsMigrated, null);
	}
	store.clear();
}

// 13d) Kỹ năng lưu phái + kiếm pháp nguyên tố: học theo mốc + đúng lưu phái; kiếm pháp cần Kiếm 5 VÀ nguyên tố 5 (mọi lưu phái).
{
	const want: Record<string, [string, number]> = {
		heavy_strike: ['kiem_than', 3],
		pierce_rush: ['kiem_than', 5],
		calm_stance: ['thuy_than', 3],
		flowing_counter: ['thuy_than', 5],
		side_slash: ['bac_than', 3],
		shadow_step: ['bac_than', 5],
	};
	for (const [id, [style, tier]] of Object.entries(want)) {
		assert.deepEqual(SKILL_NODE[id], { branch: 'sword', tier, style }, `${id}: Kiếm mốc ${tier} của ${style}`);
		const s = HERO_SKILLS.find((x) => x.id === id)!;
		assert.equal(s.element, 'steel', `${id}: đòn thép (ăn phủ phép)`);
		assert.equal(knowsSkill(s, { sword: tier }, all, style as never), true);
		assert.equal(knowsSkill(s, { sword: tier - 1 }, all, style as never), false, `${id}: chưa đủ mốc`);
		for (const other of SWORD_STYLES.filter((x) => x !== style)) assert.equal(knowsSkill(s, { sword: 10 }, all, other), false, `${id}: lưu phái khác không học được`);
		assert.equal(knowsSkill(s, { sword: 10 }, all), false, `${id}: chưa chọn lưu phái`);
	}
	for (const st of SWORD_STYLES) {
		assert.deepEqual(STYLE_TREE[st].map((n) => n.tier), [3, 4, 5, 6, 7, 8, 9, 10], `${st}: mốc 3–10`);
		assert.deepEqual(STYLE_TREE[st].filter((n) => n.ready).map((n) => n.tier), [3, 4, 5, 6, 7, 8, 9], `${st}: hiện thực mốc 3–9 (GĐ2 lượt B: 3–5, GĐ3 lượt B: 6–9)`);
		assert.deepEqual(STYLE_TREE[st].filter((n) => n.kind === 'active').map((n) => n.tier), [3, 5, 6, 8, 10]);
		assert.deepEqual(treeOf('sword', st).map((n) => n.tier), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
		assert.equal(treeOf('sword', st)[1]!.name, 'Nhịp Chém', 'mốc 1–2 chung');
	}
	assert.deepEqual(STYLE_TREE.kiem_than.map((n) => n.name).slice(0, 3), ['Nhất Kích', 'Mắt Tinh', 'Đột Kích']);
	assert.deepEqual(STYLE_TREE.thuy_than.map((n) => n.name).slice(0, 3), ['Thế Tĩnh', 'Tâm Tĩnh', 'Lưu Thủy Phản']);
	assert.deepEqual(STYLE_TREE.bac_than.map((n) => n.name).slice(0, 3), ['Lướt Chém', 'Nhẹ Như Gió', 'Ảnh Bộ']);
	assert.deepEqual(STYLE_TREE.kiem_than.map((n) => n.name).slice(3), ['Phá Giáp', 'Thế Áp Đảo', 'Lưỡi Sóng', 'Bất Khuất', 'Phán Quyết'], 'mốc 6–10 đúng bảng 3.1 (mốc 10 "Sắp có")');
	assert.deepEqual(STYLE_TREE.thuy_than.map((n) => n.name).slice(3), ['Dòng Chảy Ngược', 'Phản Đòn', 'Xoáy Nước', 'Mặt Hồ Phẳng', 'Thiên Tĩnh']);
	assert.deepEqual(STYLE_TREE.bac_than.map((n) => n.name).slice(3), ['Liên Hoàn', 'Đà Lướt', 'Phi Kiếm', 'Bóng Mờ', 'Ngàn Bóng']);
	assert.equal(treeOf('sword', null), TREE.sword, 'chưa chọn: cây gộp');
	assert.match(TREE.sword[2]!.name, /Nhất Kích · Thế Tĩnh · Lướt Chém/);

	const arts: Record<string, string> = { fire: 'blaze_slash', water: 'water_dragon_slash', wind: 'gale_blade_dance', ice: 'frost_cleave', earth: 'earth_rend' };
	assert.deepEqual(SWORD_ARTS, arts);
	assert.equal(SWORD_ART_TIER, 5);
	for (const [e, id] of Object.entries(arts)) {
		const s = HERO_SKILLS.find((x) => x.id === id)!;
		assert.deepEqual(SKILL_NODE[id], { branch: 'sword', tier: 5, art: e });
		assert.ok(s.blade && s.element === e, `${id}: đòn kiếm mang hệ ${e}`);
		assert.equal(knowsSkill(s, { sword: 5, [e]: 5 }, all), true, `${id}: Kiếm 5 + ${e} 5 (chưa cần lưu phái cụ thể)`);
		for (const st of SWORD_STYLES) assert.equal(knowsSkill(s, { sword: 5, [e]: 5 }, all, st), true, `${id}: mọi lưu phái`);
		assert.equal(knowsSkill(s, { sword: 4, [e]: 10 }, all), false, `${id}: Kiếm 4 chưa đủ`);
		assert.equal(knowsSkill(s, { sword: 10, [e]: 4 }, all), false, `${id}: ${e} 4 chưa đủ`);
		near(skillScale({ sword: 5, [e]: 3 }, id, 1), depthBonus(3), `${id}: thưởng chiều sâu theo nhánh yếu hơn`);
	}
	assert.equal(knowsSkill(HERO_SKILLS.find((x) => x.id === 'blaze_slash')!, { sword: 5, fire: 5, ice: 5 }, all), true);
	assert.equal(knowsSkill(HERO_SKILLS.find((x) => x.id === 'frost_cleave')!, { sword: 5, fire: 5 }, all), false, 'mỗi kiếm pháp đúng nguyên tố của nó');
}

// 14) Trong trận.
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

const { Container, Texture } = await import('pixi.js');
const { Actor } = await import('../src/game/entities/Actor');
const { CombatSystem } = await import('../src/game/combat/CombatSystem');
const { expForLevel } = await import('../src/game/combat/skills');
type Textures = import('../src/game/assets/AssetManifest').CharacterTextures;
type Dir = import('../src/game/assets/AssetManifest').Direction;
type Fighter = import('../src/game/combat/CombatSystem').Fighter;

const DIRS: Dir[] = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'];
const strip = (n: number) => Array.from({ length: n }, () => new Texture());
/** Nhân vật giả không có động tác ra đòn: đòn nổ ngay lúc bấm (đủ để kiểm phản ứng, không cần khung chạm). */
function fakeTextures(): Textures {
	const anims = { idle: Object.fromEntries(DIRS.map((d) => [d, strip(4)])), walk: Object.fromEntries(DIRS.map((d) => [d, strip(6)])) } as Record<string, Partial<Record<Dir, InstanceType<typeof Texture>[]>>>;
	return {
		id: 'test',
		entry: { displayName: 'Thử', role: 'player', atlas: '', frameSize: { width: 64, height: 64 }, anchor: { x: 0.5, y: 0.9 }, animations: { idle: { fps: 6 }, walk: { fps: 10 } }, source: { provider: 'test', ref: null }, bodyHeight: 60 },
		frames: (anim, dir) => anims[anim]?.[dir] ?? anims.idle!.S!,
		has: (anim) => !!anims[anim],
		hasDir: () => false,
		actionFrames: () => null,
	};
}

interface Internals {
	dummies: { wet: number; burn: number; chill: number; frost: number; freeze: number }[];
	projectiles: { damage: number; vx: number; vy: number; life: number }[];
	react(t: { burn: number; wet: number; chill: number; freeze: number; frost?: number; boss?: boolean }, element: string, x: number, y: number): { mult: number; reaction: { id: string } | null };
	flameBurst(x: number, y: number, damage: number): void;
	hurtPlayer(amount: number): void;
}

function setup(o: { dummy?: boolean } = {}) {
	const hits: string[] = [];
	const plays: { id: string; tint?: number }[] = [];
	const toasts: string[] = [];
	const levels: number[] = [];
	const vfx = {
		ground: new Container(),
		top: new Container(),
		play: (id: string, _x: number, _y: number, opt?: { tint?: number }) => void plays.push({ id, tint: opt?.tint }),
		frames: () => [],
		update: () => undefined, clear: () => undefined,
	};
	const combat = new CombatSystem(
		{
			// Quái đi thật (để thấy đóng băng làm nó đứng im).
			mover: (pos, dx, dy) => {
				pos.x += dx;
				pos.y += dy;
			},
			shake: () => undefined,
			toast: (text) => void toasts.push(text),
			enemyKilled: () => undefined,
			bossNear: () => false,
			playerRespawn: () => ({ x: 0, y: 0 }),
			isUnlocked: () => true,
			practiceHit: (el, r) => void hits.push(`${el}:${r}`),
			levelUp: (lv) => void levels.push(lv),
		},
		{ level: 1, exp: 0, coins: 0, potions: 0 },
		vfx as never,
	);
	const p = new Actor('hero', fakeTextures(), 40, 100, 'S', null);
	combat.setPlayer(p);
	// Luật 10/10/2026: phép mốc 1 của nguyên tố phải học bằng điểm — coi như đã học mốc 1 mọi nhánh (mốc 1: không bị động,
	// thưởng chiều sâu / phản ứng +0% — số liệu y như trước).
	combat.setTalents({ sword: 1, fire: 1, water: 1, wind: 1, ice: 1, earth: 1 });
	if (o.dummy !== false) combat.addDummy(100, 100);
	const east = { x: 100, y: 100 - p.chest };
	const tick = (dt = 1 / 60) => {
		p.update(dt);
		combat.update(dt, (x, y) => ({ x, y }), 2);
	};
	const inner = combat as unknown as Internals;
	/** Bấm kỹ năng `index` về phía hình nộm và chờ đòn trúng (mỗi lần trúng thêm một dòng `hits`). */
	const shoot = (index: number) => {
		const before = hits.length;
		combat.pc.mp = combat.pc.mpMax;
		combat.pc.cooldowns.clear();
		assert.equal(combat.cast(index, east), 'started');
		for (let f = 0; hits.length === before; f += 1) {
			assert.ok(f < 120, `đòn ${index} phải trúng hình nộm`);
			tick();
		}
		return hits[hits.length - 1];
	};
	const enemy = (id: string, x: number): Fighter => {
		const home = { x, y: 100, radius: 60 };
		return combat.addEnemy(new Actor(id, fakeTextures(), x, 100, 'W', home), id, home, id)!;
	};
	return { combat, p, hits, plays, toasts, levels, east, tick, inner, shoot, enemy };
}

// 14a) Hình nộm (đường đạn thật): Băng vào ướt = Đóng Băng; Băng vào cháy = Tan Chảy; Lửa vào đóng băng / lạnh = Tan Chảy.
{
	const s = setup();
	const dummy = s.inner.dummies[0]!;
	assert.equal(s.shoot(3), 'water:null');
	assert.ok(dummy.wet > 3.9 && dummy.wet <= 4, 'ướt 4 giây');
	assert.equal(s.shoot(6), 'ice:freeze', 'Băng vào hình nộm ướt');
	assert.ok(dummy.freeze > 1.5 && dummy.freeze <= 1.6 && dummy.wet === 0, `đóng băng 1,6s, hết ướt (freeze ${dummy.freeze})`);
	assert.ok(s.plays.some((x) => x.id === 'ice_burst'), 'hiệu ứng ice_burst');
	assert.equal(s.shoot(2), 'fire:melt', 'Lửa vào mục tiêu đóng băng');
	assert.ok(dummy.freeze === 0 && dummy.chill === 0 && dummy.burn === 0, 'tan: gỡ đóng băng, không bén lửa');
	assert.equal(s.shoot(2), 'fire:null');
	assert.ok(dummy.burn > 2.9 && dummy.burn <= 3, 'cháy 3 giây');
	assert.equal(s.shoot(6), 'ice:melt', 'Băng vào mục tiêu đang cháy');
	assert.equal(dummy.burn, 0, 'tan chảy dập lửa');
	assert.equal(s.shoot(6), 'ice:null', 'Băng trúng thường');
	assert.ok(dummy.chill > 2.4 && dummy.chill <= 2.5 && dummy.frost === 0, 'Băng trúng thường: lạnh 2,5s, chưa lạnh sâu');
	assert.equal(s.shoot(2), 'fire:melt', 'Lửa vào mục tiêu lạnh');
	assert.equal(s.shoot(3), 'water:null');
	assert.equal(s.shoot(4), 'wind:chill', 'Băng Giá cũ (Thuỷ + Phong) vẫn giữ mã chill');
}

// 14b) Hệ số phản ứng (gọi thẳng `react`) + thưởng +5%/mốc của hệ yếu hơn.
{
	const s = setup();
	const t = () => ({ burn: 0, wet: 0, chill: 0, freeze: 0 });
	let r = s.inner.react({ ...t(), wet: 2 }, 'ice', 0, 0);
	assert.deepEqual([r.reaction?.id, r.mult], ['freeze', 1.3]);
	r = s.inner.react({ ...t(), burn: 2 }, 'ice', 0, 0);
	assert.deepEqual([r.reaction?.id, r.mult], ['melt', 1.6]);
	r = s.inner.react({ ...t(), freeze: 1, chill: 1 }, 'fire', 0, 0);
	assert.deepEqual([r.reaction?.id, r.mult], ['melt', 1.5]);
	const boss = { ...t(), wet: 2, boss: true };
	s.inner.react(boss, 'ice', 0, 0);
	assert.equal(boss.freeze, 0.8, 'boss chỉ đóng băng nửa thời gian');
	s.combat.setTalents({ water: 4, ice: 3 });
	r = s.inner.react({ ...t(), wet: 2 }, 'ice', 0, 0);
	near(r.mult, 1.3 * 1.1, 'Thuỷ 4 + Băng 3: Đóng Băng +10%');
	r = s.inner.react({ ...t(), burn: 2 }, 'ice', 0, 0);
	near(r.mult, 1.6, 'Tan Chảy: Hoả chưa lên mốc → +0%');
	s.combat.setTalents({ fire: 3, wind: 3 });
	let burst = 0;
	s.inner.flameBurst = (_x, _y, dmg) => void (burst = dmg);
	r = s.inner.react({ ...t(), burn: 2 }, 'wind', 0, 0);
	assert.equal(r.reaction?.id, 'burst');
	near(burst, s.combat.pc.atk * 1.2 * 1.1, 'Bùng Lửa nổ lan cũng ăn thưởng phản ứng');
}

// 14c) Quái bị đóng băng: đứng im, không vào thế, không đánh; tan băng thì đánh lại. Chết thì sạch trạng thái.
{
	const s = setup({ dummy: false });
	const f = s.enemy('mob_mushroom_001', 75);
	f.wet = 3;
	f.attackTimer = 0;
	s.combat.pc.cooldowns.clear();
	assert.equal(s.combat.cast(6, s.east), 'started');
	for (let i = 0; f.freeze === 0; i += 1) {
		assert.ok(i < 60, 'Băng Tiễn phải trúng quái');
		s.tick();
	}
	assert.ok(f.freeze > 1.5 && f.wet === 0, 'quái ướt trúng Băng → đóng băng');
	const at = { x: f.actor.x, y: f.actor.y };
	const hp = s.combat.pc.hp;
	for (let i = 0; i < 60; i += 1) {
		s.tick();
		assert.equal(f.windup, 0, 'đóng băng thì không vào thế');
	}
	assert.deepEqual({ x: f.actor.x, y: f.actor.y }, at, 'đóng băng thì đứng im');
	assert.equal(s.combat.pc.hp, hp, 'đóng băng thì không đánh');
	let woke = false;
	for (let i = 0; i < 240 && !woke; i += 1) {
		s.tick();
		woke = f.windup > 0 || s.combat.pc.hp < hp;
	}
	assert.ok(woke && f.freeze === 0, 'tan băng thì đánh lại');
	f.freeze = 1;
	f.frost = 1;
	f.hp = 1;
	s.combat.pc.cooldowns.clear();
	s.combat.pc.iframes = 99;
	s.combat.cast(1, { x: f.actor.x, y: f.actor.y - f.actor.chest });
	for (let i = 0; !f.dead; i += 1) {
		assert.ok(i < 60, 'Tia Aether phải hạ quái');
		s.tick();
	}
	assert.ok(f.freeze === 0 && f.frost === 0, 'chết thì sạch đóng băng / lạnh sâu');

	const b = s.enemy('boss_demon_001', 75);
	b.wet = 3;
	s.combat.pc.cooldowns.clear();
	s.combat.cast(6, s.east);
	for (let i = 0; b.freeze === 0; i += 1) {
		assert.ok(i < 60, 'Băng Tiễn phải trúng boss');
		s.tick();
	}
	assert.ok(b.freeze <= 0.8 && b.freeze > 0.7, `boss đóng băng nửa thời gian (${b.freeze})`);
}

// 14d) Phủ phép Kiếm: chỉ khi đủ điều kiện; đổi có hồi 10s; nhát chém mang hệ nhưng nhiệm vụ luyện kiếm vẫn nhận "steel".
{
	const plain = setup();
	plain.combat.setTalents({ sword: 4, ice: 4, water: 1 });
	assert.equal(plain.combat.setEnchant('ice'), 'locked', 'Băng mốc 4: chưa phủ được');
	plain.shoot(3);
	assert.equal(plain.shoot(0), 'steel:null', 'không phủ: chém thép, không phản ứng');
	assert.ok(plain.inner.dummies[0]!.wet > 0, 'chém thép không làm khô');

	const s = setup();
	s.combat.setTalents({ sword: 2, ice: 5, fire: 5, water: 1 });
	assert.equal(s.combat.enchantment, null);
	assert.equal(s.combat.setEnchant('ice'), 'ok');
	assert.equal(s.combat.enchantment, 'ice');
	assert.equal(s.combat.setEnchant('ice'), 'same');
	near(s.combat.enchantCooldown, ENCHANT_SWAP_SECONDS, 'đổi xong: hồi 10 giây');
	assert.equal(s.combat.setEnchant('fire'), 'cooldown', 'đổi ngay sang Lửa: bị chặn');
	assert.equal(s.combat.setEnchant('wind'), 'locked', 'Phong chưa mốc 5');
	s.shoot(3);
	assert.equal(s.shoot(0), 'steel:freeze', 'Kiếm Băng vào hình nộm ướt: Đóng Băng, báo nhiệm vụ là steel');
	assert.ok(s.plays.some((x) => x.id === 'slash' && x.tint === 0xc4f1ff), 'vệt chém màu băng');
	assert.equal(s.shoot(0), 'steel:null');
	assert.ok(s.inner.dummies[0]!.chill > 0, 'nhát chém băng thường làm lạnh');
	for (let i = 0; i < 10 * 60 + 5; i += 1) s.tick();
	assert.equal(s.combat.enchantCooldown, 0);
	assert.equal(s.combat.setEnchant('fire'), 'ok', 'hết hồi: đổi được');
	assert.equal(s.combat.setEnchant(null), 'ok', 'tắt luôn được');
	assert.equal(s.combat.enchantment, null);
	s.combat.restoreEnchant('ice');
	s.combat.setTalents({ sword: 1, ice: 5 });
	assert.equal(s.combat.enchantment, null, 'mất điều kiện (tẩy điểm) thì phủ phép hết tác dụng');
}

// 14e) Hệ số nhân vào sát thương / hồi máu; Suối Lành ở Thuỷ mốc 3; Tia Aether theo cấp.
{
	const s = setup();
	s.combat.pc.cooldowns.clear();
	s.combat.cast(2, s.east);
	near(s.inner.projectiles.at(-1)!.damage, 16 * 1.4, 'Hoả Cầu mốc 1: ×1 (không còn ×0,7)');
	s.combat.setTalents({ fire: 4 });
	s.combat.pc.cooldowns.clear();
	s.combat.cast(2, s.east);
	near(s.inner.projectiles.at(-1)!.damage, 16 * 1.4 * 1.12, 'Hoả Cầu mốc 4: +12%');
	near(s.combat.skillScaleOf(HERO_SKILLS[2]!), 1.12, 'HUD đọc đúng hệ số');
	s.combat.pc.cooldowns.clear();
	s.combat.cast(1, s.east);
	near(s.inner.projectiles.at(-1)!.damage, 16 * 1, 'Tia Aether cấp 1');

	s.combat.setTalents({ water: 2 });
	assert.equal(s.combat.knows(HERO_SKILLS[5]!), false);
	assert.equal(s.combat.cast(5, s.east), 'locked', 'Suối Lành chưa học ở Thuỷ mốc 2');
	s.combat.setTalents({ water: 3 });
	s.combat.pc.hp = 1;
	s.combat.pc.cooldowns.clear();
	assert.equal(s.combat.cast(5, s.east), 'started');
	assert.equal(s.combat.pc.hp, 1 + Math.round(s.combat.pc.hpMax * 0.35 * 1.08), 'Suối Lành ăn mốc Thuỷ');

	assert.deepEqual(s.combat.sheet, { attack: 16, magic: 16, defense: 4, critChance: 0.1, critMult: 1.75, evade: 0, rage: false });
	s.combat.setPath('sword');
	assert.deepEqual(s.combat.sheet, { attack: Math.round(17 * 1.35), magic: Math.round(17 * 0.65), defense: 6, critChance: 0.1, critMult: 1.75, evade: 0, rage: false });

	s.combat.grantExp(expForLevel(1) + expForLevel(2));
	assert.deepEqual(s.levels, [2, 3], 'báo từng cấp một');
	assert.ok(!s.toasts.some((x) => x.startsWith('Lên cấp')), 'có hook thì Game tự báo lên cấp');
	s.combat.pc.cooldowns.clear();
	s.combat.cast(1, s.east);
	near(s.inner.projectiles.at(-1)!.damage, s.combat.pc.atk * 0.65 * 1.06, 'Tia Aether cấp 3: +6% (×0,65 phép của Kiếm sĩ)');
}

// 14f) Bị động trong trận.
{
	const s = setup();
	const dummy = s.inner.dummies[0]!;
	s.combat.setTalents({ fire: 2, water: 2, ice: 2, sword: 2, wind: 2 });
	s.shoot(2);
	assert.ok(dummy.burn > 4.4 && dummy.burn <= 4.5, `Mồi Lửa: cháy 4,5s (${dummy.burn})`);
	s.shoot(3);
	assert.ok(dummy.wet > 5.9 && dummy.wet <= 6, 'Thấm Sâu: ướt 6s');
	dummy.wet = 0;
	s.shoot(6);
	assert.ok(dummy.chill > 3.9 && dummy.chill <= 4 && dummy.frost > 3.9, 'Hàn Khí: lạnh 4s, lạnh sâu');
	near(s.combat.cooldownOf(HERO_SKILLS[0]!), 0.38 / 1.1, 'Nhịp Chém: tốc chém +10%');
	near(s.combat.cooldownOf(HERO_SKILLS[2]!), 1, 'Nhịp Chém không đụng phép');
	s.combat.pc.cooldowns.clear();
	s.combat.cast(4, s.east);
	const wind = s.inner.projectiles.at(-1)!;
	near(Math.hypot(wind.vx, wind.vy), 520 * 1.2, 'Gió Sắc: Phong Nhận bay nhanh +20%');
	near(Math.hypot(wind.vx, wind.vy) * wind.life, 460 * 1.2, 'Gió Sắc: bay xa +20%');
	s.combat.pc.cooldowns.clear();
	s.combat.cast(2, s.east);
	const fire = s.inner.projectiles.at(-1)!;
	near(Math.hypot(fire.vx, fire.vy), 360, 'Gió Sắc không đụng Hoả Cầu');
	assert.equal(s.combat.moveScale, 1, 'mốc 2 chưa có tốc chạy');
	assert.equal(s.combat.sheet.critChance, 0.1, 'mốc 2 chưa có chí mạng');

	s.combat.setTalents({ sword: 4, fire: 4, water: 4, wind: 4, ice: 4 });
	assert.equal(s.combat.sheet.critChance, 0.1, 'Kiếm 4 chưa có lưu phái: không có Mắt Tinh');
	s.combat.setTalents({ sword: 4, fire: 4, water: 4, wind: 4, ice: 4 }, 'kiem_than');
	assert.equal(s.combat.sheet.critChance, 0.1 + PASSIVE.crit, 'Mắt Tinh (Kiếm Thần 4)');
	assert.equal(s.combat.moveScale, 1.1, 'Thuận Gió: tốc chạy');
	near(s.combat.cooldownOf(HERO_SKILLS[2]!), 0.9, 'Thuận Gió: hồi chiêu −10%');
	near(s.combat.cooldownOf(HERO_SKILLS[0]!), (0.38 / 1.1) * 0.9, 'Nhịp Chém × Thuận Gió');
	s.combat.pc.mp = 0;
	for (let i = 0; i < 60; i += 1) s.tick();
	near(s.combat.pc.mp, 3.2, 'Dòng Chảy đã thay bằng Huyết Thuỷ: hồi MP gốc 3,2/giây');

	// Giáp Sương + Tim Lò: khoá ngẫu nhiên ở 0,5 (biên độ ×1, không chí mạng) để đo đúng số.
	const rnd = Math.random;
	Math.random = () => 0.5;
	try {
		const pc = s.combat.pc;
		pc.iframes = 0;
		const hp = (pc.hp = pc.hpMax);
		s.inner.hurtPlayer(40);
		assert.equal(hp - pc.hp, Math.max(1, Math.round(40 * 0.9 - pc.def * 0.5)), 'Giáp Sương: nhận −10%');

		const q = setup({ dummy: false });
		q.combat.setTalents({ fire: 4 });
		const f = q.enemy('mob_zombie_001', 75);
		const slash = () => {
			q.combat.pc.cooldowns.clear();
			const before = f.hp;
			q.combat.cast(0, q.east);
			return before - f.hp;
		};
		const cold = slash();
		f.burn = 2;
		const hot = slash();
		const base = q.combat.pc.atk * 1.25;
		assert.equal(cold, Math.round(base - f.stats.def * 0.5));
		assert.equal(hot, Math.round(base * 1.2 - f.stats.def * 0.5), 'Tim Lò: +20% vào mục tiêu đang cháy');
	} finally {
		Math.random = rnd;
	}

	// Lạnh sâu làm quái chậm hơn lạnh thường.
	const pace = (frost: boolean) => {
		const q = setup({ dummy: false });
		const f = q.enemy('mob_zombie_001', 400);
		f.engaged = true;
		f.attackTimer = 99;
		const x0 = f.actor.x;
		for (let i = 0; i < 30; i += 1) {
			f.chill = 5;
			f.frost = frost ? 5 : 0;
			q.tick();
		}
		return x0 - f.actor.x;
	};
	near(pace(true) / pace(false), PASSIVE.frostSlow / 0.5, 'Hàn Khí: quái còn 35% tốc thay vì 50%');
}

// 14g) Luật 10/10/2026 trong trận, đi qua StoryDirector thật: đang làm "Mũ cũ" với 0 điểm → Hoả đã mở nhưng Hoả Cầu KHOÁ (chưa
//      học); Tia Aether trúng Ông Rơm báo 'aether' và bài tập vẫn tiến. Học Hoả Cầu (cấp 2 = 1 điểm) thì Hoả Cầu dùng được.
{
	const { STORY } = await import('../src/game/story/story');
	const { StoryDirector } = await import('../src/game/story/StoryDirector');
	const quiet = { dialogue() {}, reward() {}, questsChanged() {}, pickups() {}, clearPickups() {}, awakenBoss() {}, spawnZone() {}, questCompleted() {}, unlocked() {}, ageChanged() {}, chapterEnd() {} };
	const i = STORY.quests.findIndex((q) => q.id === 'c6_old_hat');
	store.set('aether.save.v2', JSON.stringify({ version: 2, index: i, questId: 'c6_old_hat', accepted: true, ready: false, progress: 0, completed: STORY.quests.slice(0, i).map((q) => q.id), unlocked: [], age: 6, player: { level: 1, exp: 0, coins: 0, potions: 0 }, talentsV: 3, talents: {} }));
	const story = new StoryDirector(STORY, quiet);
	const s = setup();
	s.combat.setTalents(story.talentTiers(), story.swordStyle);
	assert.deepEqual([story.isUnlocked('fire'), story.talentTiers().fire], [true, 0], 'Hoả đã mở, mốc 0');
	s.combat.pc.cooldowns.clear();
	assert.equal(s.combat.cast(2, s.east), 'locked', 'Hoả Cầu chưa học: bấm là "Chưa học"');
	assert.ok(s.toasts.some((x) => x.includes('Chưa học') && x.includes('Hoả Cầu')));
	const hit = s.shoot(1);
	assert.equal(hit, 'aether:null', 'Tia Aether trúng Ông Rơm');
	story.practiced('aether', null);
	assert.equal(story.state.progress, 1, 'bài "Mũ cũ" nhận Tia Aether');
	assert.equal(story.spendTalent('fire', 2), true, 'cấp 2: học Hoả Cầu');
	s.combat.setTalents(story.talentTiers(), story.swordStyle);
	assert.equal(s.shoot(2), 'fire:null', 'học rồi thì Hoả Cầu ra đòn');
	story.practiced('aether', null);
	assert.equal(story.state.progress, 1, 'đã học Hoả Cầu: Tia Aether thôi tính');
	story.practiced('fire', null);
	assert.equal(story.state.progress, 2);
	store.clear();
}

console.log(
	'✔ talents.test: điểm theo cấp (cấp 40 = 47), giá mốc (nguyên tố mốc 1 = 1 điểm, Kiếm mốc 1 miễn phí) + trần đã hiện thực (mọi nhánh mốc 9), chuyển bản lưu định dạng 2 → 3 (giữ mốc nếu đủ điểm, không âm, báo một lần), bản lưu GĐ2 nạp được + cộng tiếp Kiếm mốc 6–9, cây 6×10 (Suối Lành = Thuỷ 3, Thổ mở bằng mã), Kiếm 3 lưu phái (chọn ở mốc 3, tẩy = xoá, bản lưu GĐ1 Kiếm 3–4 → Kiếm Thần), kiếm pháp nguyên tố (Kiếm 5 + nguyên tố 5), thưởng +4%/mốc, Aether theo cấp, phản ứng +5%/mốc, bị động mốc 2/4 theo lưu phái (thuần + trong trận), phủ phép (điều kiện + hồi 10s), thanh 10 ô (mặc định, kẹp, đổi chỗ), hoàn điểm bản lưu cũ một lần, kẹp bản lưu mới; Băng: Đóng Băng, Tan Chảy, quái đứng im, boss nửa thời gian',
);

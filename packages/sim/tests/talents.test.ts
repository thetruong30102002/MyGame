// Phần LUẬT THUẦN tách từ apps/web/tests/talents.test.ts (11/10/2026, chuẩn bị xoá bản web): chỉ hàm của @aether/sim (+ bảng hình
// tạm `UnityGame/Tools~/data/tempArt.ts`). Phần chạy CombatSystem của web bỏ cùng bản web — client Unity có test C# + vector riêng.
// Chạy: npx tsx tests/talents.test.ts (trong packages/sim) hoặc `npm test -w @aether/sim`.
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
} from '../src/talents.ts';
import { HERO_SKILLS } from '../src/skills.ts';

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

console.log('✔ talents.test (sim): phần luật');

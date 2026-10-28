// Phần LUẬT THUẦN tách từ apps/web/tests/talents.test.ts (11/10/2026, chuẩn bị xoá bản web): chỉ hàm của @havenlord/sim (+ bảng hình
// tạm `UnityGame/Tools~/data/tempArt.ts`). Phần chạy CombatSystem của web bỏ cùng bản web — client Unity có test C# + vector riêng.
// Chạy: npx tsx tests/talents.test.ts (trong packages/sim) hoặc `npm test -w @havenlord/sim`.
// Chạy: npx tsx tests/talents.test.ts — cây Nguyên tố (hàm thuần + lưu ở StoryDirector), bị động mốc 2/4, phủ phép Kiếm,
// thanh 10 ô, và hệ Băng / phản ứng trong trận.
import assert from 'node:assert/strict';
import {
	addTier,
	havenScale,
	assignSlot,
	baseTier,
	BRANCH_LOCK_NOTE,
	BRANCH_UNLOCK,
	BRANCHES,
	canEnchant,
	chosenElement,
	defaultLoadout,
	depthBonus,
	describeBuild,
	ENCHANT_SWAP_SECONDS,
	fitTiers,
	FREE_FIRST_TIER,
	HOME_SLOT,
	imbueSeconds,
	knowsSkill,
	MAX_LEVEL,
	MAX_TIER,
	migrateBought,
	TALENT_LEVEL_CAP,
	nextTierCost,
	normalizeLoadout,
	PASSIVE,
	passiveEffects,
	pathAllowsBranch,
	pathAllowsSkill,
	placeSkill,
	pointsForLevel,
	pointsToTier,
	REACTION_PAIR,
	reactionBonus,
	reactionOfPair,
	resetCost,
	resetDiamonds,
	SKILL_NODE,
	skillScale,
	SLOT_CODES,
	SLOT_COUNT,
	SLOT_KEYS,
	spentPoints,
	STYLE_BRANCHES,
	STYLE_OFFSET,
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

// 2) Giá mốc: mốc 1 nguyên tố = 1 điểm, Kiếm mốc 1 miễn phí; mốc 2→10 = 1·2·2·3·3·4·4·5·5. Kiếm chỉ còn 2 mốc (Trảm + Nhịp
//    Chém); 3 lưu phái là 3 NHÁNH riêng, mốc phái t = mốc Kiếm cũ t + 2 (cùng giá) — Kiếm 2 + một phái 7 = 24 điểm, đúng bằng
//    Kiếm cũ mốc 9 (11/10/2026).
{
	assert.deepEqual([...TIER_COST], [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
	assert.deepEqual(FREE_FIRST_TIER, ['sword']);
	assert.deepEqual(BRANCHES.map(baseTier), [1, 0, 0, 0, 0, 0, 0, 0, 0], 'vừa mở: Kiếm mốc 1, phái + nguyên tố mốc 0');
	assert.deepEqual([tierCost('sword', 1), tierCost('fire', 1), tierCost('sword', 2), tierCost('fire', 2), tierCost('earth', 10)], [0, 1, 1, 1, 5]);
	assert.equal(STYLE_OFFSET, 2);
	assert.deepEqual([1, 2, 3, 4, 5, 6, 7].map((t) => tierCost('kiem_than', t)), [2, 2, 3, 3, 4, 4, 5], 'phái: giá mốc Kiếm cũ 3–9');
	const tiers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
	assert.deepEqual(tiers.map((t) => pointsToTier(t, 'fire')), [1, 2, 4, 6, 9, 12, 16, 20, 25, 30], 'nguyên tố');
	assert.deepEqual([1, 2].map((t) => pointsToTier(t, 'sword')), [0, 1], 'Kiếm');
	assert.deepEqual([1, 2, 3, 4, 5, 6, 7].map((t) => pointsToTier(t, 'bac_than')), [2, 4, 7, 10, 14, 18, 23], 'phái');
	assert.deepEqual([pointsToTier(0, 'fire'), pointsToTier(0, 'sword')], [0, 0], 'mốc 0 = chưa tiêu gì');
	assert.equal(pointsToTier(2, 'sword') + pointsToTier(7, 'kiem_than'), 24, 'Kiếm 2 + phái 7 = Kiếm cũ mốc 9');
	const pts = pointsForLevel(TALENT_LEVEL_CAP);
	assert.ok(pointsToTier(2, 'sword') + pointsToTier(7, 'kiem_than') + pointsToTier(9, 'fire') > pts, 'cấp 40: không vừa master một phái vừa master nguyên tố');
	assert.ok(pointsToTier(2, 'sword') + pointsToTier(7, 'kiem_than') + pointsToTier(8, 'fire') <= pts, 'cấp 40: phái 7 + nguyên tố 8 thì vừa');
}

// 3) Dữ liệu cây: Kiếm 2 mốc, 3 phái × 8 mốc (mốc Kiếm cũ 3–10), 5 nguyên tố × 10 mốc; chủ động theo mốc cũ 1/3/5/6/8/10.
{
	assert.deepEqual([...BRANCHES], ['sword', 'kiem_than', 'thuy_than', 'bac_than', 'fire', 'water', 'wind', 'ice', 'earth']);
	assert.deepEqual([...STYLE_BRANCHES], ['kiem_than', 'thuy_than', 'bac_than']);
	const shape: Record<string, { n: number; active: number[]; cap: number }> = { sword: { n: 2, active: [1], cap: 2 } };
	for (const st of STYLE_BRANCHES) shape[st] = { n: 8, active: [1, 3, 4, 6, 8], cap: 7 };
	for (const e of ['fire', 'water', 'wind', 'ice', 'earth']) shape[e] = { n: 10, active: [1, 3, 5, 6, 8, 10], cap: 9 };
	for (const b of BRANCHES) {
		const want = shape[b]!;
		assert.deepEqual(TREE[b].map((n) => n.tier), Array.from({ length: want.n }, (_, i) => i + 1), `${b}: số mốc`);
		assert.deepEqual(TREE[b].filter((n) => n.kind === 'active').map((n) => n.tier), want.active, `${b}: mốc chủ động`);
		assert.equal(tierCap(b), want.cap, `${b}: trần đã hiện thực`);
		assert.deepEqual(TREE[b].filter((n) => n.ready).map((n) => n.tier), Array.from({ length: want.cap }, (_, i) => i + 1), `${b}: mốc đã hiện thực`);
		for (const n of TREE[b]) assert.ok(n.name && n.desc, `${b} mốc ${n.tier}: có tên + mô tả (kể cả "Sắp có")`);
		assert.equal(treeOf(b), TREE[b]);
	}
	const first: Record<string, string> = { sword: 'slash', kiem_than: 'heavy_strike', thuy_than: 'calm_stance', bac_than: 'side_slash', fire: 'fire_bolt', water: 'water_lance', wind: 'wind_blade', ice: 'ice_shard', earth: 'rock_throw' };
	for (const [b, id] of Object.entries(first)) {
		assert.equal(TREE[b as Branch][0]!.skillId, id, `${b}: mốc 1 là ${id}`);
		const unlock = HERO_SKILLS.find((s) => s.id === id)?.unlock;
		if (unlock !== undefined) assert.equal(unlock, BRANCH_UNLOCK[b as Branch], `${id}: mở cùng mã với nhánh`);
	}
	assert.deepEqual(STYLE_BRANCHES.map((b) => BRANCH_UNLOCK[b]), ['sword', 'sword', 'sword'], 'phái mở cùng kiếm gỗ');
	assert.deepEqual(SKILL_NODE.heal, { branch: 'water', tier: 3 }, 'Suối Lành = Thuỷ mốc 3');
	const heal = HERO_SKILLS[5]!;
	assert.deepEqual([heal.id, heal.name, heal.unlock], ['heal', 'Suối Lành', undefined], 'Suối Lành không còn mở bằng cốt truyện');
	assert.equal(SKILL_NODE.haven_bolt, undefined, 'Tia Haven ngoài cây');
	assert.deepEqual(TREE.earth.filter((n) => n.ready && n.skillId).map((n) => n.skillId), ['rock_throw', 'quake', 'stone_spikes', 'stone_wall', 'rockslide'], 'Thổ: Đá Văng · Địa Chấn · Gai Đá · Tường Đá · Lở Đá');
	assert.deepEqual([TREE.earth[9]!.skillId, TREE.earth[9]!.ready], ['mountain_god', false], 'Thổ mốc 10: Sơn Thần, chưa mở ở game thật');
	assert.match(BRANCH_LOCK_NOTE.earth ?? '', /tuổi 16/, 'Thổ chưa mở: nhắc nhiệm vụ tuổi 16 (chỉ là chữ, không khoá cứng)');
	const ice = HERO_SKILLS[6]!;
	assert.deepEqual([ice.id, ice.element, ice.mpCost, ice.cooldown, ice.power, ice.kind, ice.speed, ice.range, ice.unlock, ice.anim], ['ice_shard', 'ice', 9, 1.8, 1.35, 'projectile', 440, 420, 'ice', 'cast'], 'Băng Tiễn ở chỉ số 6');
}

// 4) Mốc suy từ số mốc đã mua + nhánh đã mở: kẹp ở trần đã hiện thực; MỘT nguyên tố (giữ nhánh sâu nhất); phái cần Kiếm mốc 2.
//    Bản lưu trước khi tách lưu phái (Kiếm cũ mốc n ≥ 3 + `swordStyle`) chuyển thành Kiếm 2 + phái n − 2, cùng số điểm.
{
	const has = new Set(['sword', 'staff', 'fire', 'earth']);
	const t = tiersFrom({ sword: 20, fire: 20, water: 3, ice: -4, earth: 5 }, (id) => has.has(id));
	assert.deepEqual(t, { sword: 2, kiem_than: 0, thuy_than: 0, bac_than: 0, fire: 9, water: 0, wind: 0, ice: 0, earth: 0 }, 'một nguyên tố: Hoả 9 sâu hơn Thổ 5 → Thổ về 0');
	assert.equal(spentPoints(t), 1 + 25);
	assert.equal(tiersFrom({ earth: 3 }, (id) => id !== 'earth').earth, 0, 'chưa có mã: Thổ 0 dù bản lưu có số');
	assert.deepEqual(tiersFrom({}, (id) => has.has(id)), { sword: 1, kiem_than: 0, thuy_than: 0, bac_than: 0, fire: 0, water: 0, wind: 0, ice: 0, earth: 0 }, 'vừa mở chưa mua gì');
	assert.equal(spentPoints(tiersFrom({}, (id) => has.has(id))), 0);
	assert.deepEqual([tiersFrom({ sword: 1, kiem_than: 5 }, all).kiem_than, tiersFrom({ kiem_than: 5 }, all).kiem_than], [5, 0], 'phái cần Kiếm mốc 2');
	assert.equal(tiersFrom({ sword: 1, bac_than: 99 }, all).bac_than, 7, 'phái kẹp trần mốc 7');
	assert.equal(chosenElement({ fire: 3, ice: 3 }), 'fire', 'bằng mốc: theo thứ tự ELEMENTS');
	assert.equal(chosenElement({ sword: 2, kiem_than: 4 }), null, 'chưa chọn nguyên tố');
	// Chuyển bản lưu.
	const old = migrateBought({ sword: 6, fire: 2 }, 'thuy_than');
	assert.deepEqual(old, { sword: 1, fire: 2, thuy_than: 5 });
	const nt = tiersFrom(old, all);
	assert.deepEqual([nt.sword, nt.thuy_than], [2, 5]);
	assert.equal(pointsToTier(2, 'sword') + pointsToTier(5, 'thuy_than'), pointsToTier(7, 'sword') + 0 * 1 || 15, 'cùng số điểm với Kiếm cũ mốc 7 (15)');
	assert.equal(pointsToTier(2, 'sword') + pointsToTier(5, 'thuy_than'), 15);
	assert.deepEqual(migrateBought({ sword: 6 }, null), { sword: 1 }, 'chưa chọn lưu phái: phần mốc 3+ trả lại điểm');
	assert.deepEqual(migrateBought({ sword: 1, fire: 3 }, 'kiem_than'), { sword: 1, fire: 3 }, 'Kiếm ≤ 2: giữ nguyên');
	assert.deepEqual(migrateBought({ sword: 1, bac_than: 2 }, 'kiem_than'), { sword: 1, bac_than: 2 }, 'đã có nhánh phái: không chuyển lần nữa');
}

// 5) Cộng mốc: giá đúng, không vượt trần, nhánh chưa mở / nhánh lạ / hết điểm thì không; nguyên tố thứ hai bị khoá; phái cần
//    Kiếm mốc 2; Pháp sư không cộng Kiếm / phái.
{
	const open = (id: string) => id !== 'earth';
	const t: Tiers = { sword: 1, fire: 0, water: 0, earth: 0 };
	assert.equal(nextTierCost(t, 'fire', open), 1, 'Hoả đã mở, mốc 0: học Hoả Cầu = 1 điểm');
	assert.equal(nextTierCost(t, 'earth', open), null, 'Thổ chưa mở: không có nấc kế dù cũng mốc 0');
	assert.equal(addTier(1, t, 'fire', open), null, 'cấp 1 chưa có điểm: chưa học được Hoả Cầu');
	assert.equal(addTier(2, t, 'fire', open), 1, 'cấp 2 = 1 điểm: học Hoả Cầu (mốc 1)');
	assert.equal(knowsSkill(HERO_SKILLS.find((s) => s.id === 'fire_bolt')!, t, open), true, 'mua mốc 1 là học Hoả Cầu');
	assert.equal(nextTierCost(t, 'water', open), null, 'đã chọn Hoả: Thuỷ khoá (một nguyên tố)');
	assert.equal(addTier(40, t, 'water', open), null);
	assert.equal(nextTierCost(t, 'fire', open), 1, 'mốc 2 = 1 điểm');
	assert.equal(addTier(2, t, 'fire', open), null, 'cấp 2 đã tiêu hết');
	assert.equal(addTier(3, t, 'fire', open), 2, 'cấp 3 = 2 điểm: mốc 2');
	assert.equal(addTier(4, t, 'fire', open), null, 'cấp 4 còn 1 điểm, mốc 3 cần 2');
	assert.equal(unspent(4, t), 1);
	assert.equal(addTier(5, t, 'fire', open), 3, 'cấp 5 = 5 điểm: mốc 3 (Vòng Lửa), tổng 4');
	assert.equal(addTier(6, t, 'fire', open), 4, 'cấp 6 = 6 điểm: mốc 4, tổng 6');
	assert.equal(addTier(8, t, 'fire', open), null, 'cấp 8 = 8 điểm, mốc 5 cần tổng 9');
	assert.equal(addTier(9, t, 'fire', open), 5, 'cấp 9 = 9 điểm: Bộc Hoả');
	assert.equal(addTier(10, t, 'fire', open), null, 'cấp 10 = 11 điểm, mốc 6 cần tổng 12');
	assert.equal(addTier(11, t, 'fire', open), 6, 'cấp 11 = 12 điểm: Tường Lửa');
	assert.deepEqual([7, 8, 9].map(() => addTier(40, t, 'fire', open)), [7, 8, 9], 'mốc 7 (Tro Tàn), 8 (Thiên Thạch), 9 (Hoả Thân)');
	assert.equal(nextTierCost(t, 'fire', open), null, 'trần mốc 9 (tuyệt kỹ mốc 10 — GĐ4)');
	assert.equal(addTier(40, t, 'kiem_than', open), null, 'Kiếm mốc 1: chưa vào được phái');
	assert.equal(addTier(40, t, 'sword', open), 2, 'Kiếm mốc 2 (Nhịp Chém)');
	assert.equal(addTier(40, t, 'sword', open), null, 'Kiếm trần mốc 2');
	assert.equal(addTier(40, t, 'kiem_than', open), 1, 'Kiếm Thần mốc 1 (Nhất Kích, 2 điểm)');
	assert.deepEqual([2, 3, 4, 5, 6].map(() => addTier(40, t, 'kiem_than', open)), [2, 3, 4, 5, 6]);
	assert.equal(addTier(40, t, 'kiem_than', open), null, 'cấp 40: Hoả 9 (25) + Kiếm 2 (1) + Kiếm Thần 6 (18) = 44, mốc 7 cần 5 (còn 3)');
	assert.equal(unspent(40, t), 3);
	assert.equal(addTier(40, { sword: 2 }, 'bac_than', open), 1, 'phái nào cũng cộng được — tự do build');
	assert.equal(addTier(40, t, 'earth', open), null, 'Thổ chưa mở (chưa có mã)');
	assert.equal(addTier(40, { sword: 0 }, 'sword', () => false), null, 'nhánh chưa mở');
	assert.equal(addTier(40, t, 'bogus' as Branch, open), null, 'nhánh lạ');
	// Lớp nhân vật.
	assert.deepEqual([pathAllowsBranch('mage', 'sword'), pathAllowsBranch('mage', 'kiem_than'), pathAllowsBranch('mage', 'fire')], [false, false, true]);
	assert.deepEqual([pathAllowsBranch('sword', 'sword'), pathAllowsBranch('sword', 'bac_than'), pathAllowsBranch('sword', 'ice'), pathAllowsBranch('none', 'sword')], [true, true, true, true]);
	assert.equal(addTier(40, { sword: 1 }, 'sword', open, 0, 'mage'), null, 'Pháp sư không cộng Kiếm');
	assert.equal(addTier(40, { sword: 2 }, 'thuy_than', open, 0, 'mage'), null, 'Pháp sư không cộng phái');
	assert.equal(addTier(40, { sword: 2 }, 'water', open, 0, 'sword'), 1, 'Kiếm sĩ vẫn học nguyên tố (để Bọc nguyên tố)');
	assert.deepEqual([0, 1, 5, 6, 12].map(resetCost), [0, 0, 0, 60, 120], 'tẩy điểm bằng xu (cũ)');
	assert.deepEqual([0, 1, 5, 6, 40].map(resetDiamonds), [0, 0, 0, 40, 40], 'tẩy điểm bằng kim cương: miễn phí tới cấp 5');
	// Chia lại điểm khi không đủ giữ mọi mốc (chuyển bản lưu): nhánh sâu nhất giữ trước, nhánh chỉ có mốc 1 mất trước, không âm.
	assert.deepEqual(fitTiers({ fire: 5, water: 1 }, 99), { fire: 5, water: 1 }, 'đủ điểm: giữ nguyên');
	assert.deepEqual(fitTiers({ fire: 5, water: 1 }, 8), { fire: 4, water: 1 }, 'Hoả 5 (9) + Thuỷ 1 (1) với 8 điểm: Hoả 4 (6) + Thuỷ 1, dư 1');
	assert.deepEqual(fitTiers({ sword: 2, fire: 3, water: 2, wind: 1, ice: 1 }, 5), { sword: 2, fire: 3, water: 0, wind: 0, ice: 0 }, 'nhánh sâu nhất (Hoả 3) trước, rồi Kiếm 2');
	assert.deepEqual(fitTiers({ fire: 1, water: 1, wind: 1, ice: 1 }, 3), { fire: 1, water: 1, wind: 1, ice: 0 }, 'chỉ mốc 1: nhánh mở sau mất trước');
	assert.deepEqual(fitTiers({ sword: 3, fire: 1 }, 0), { sword: 1, fire: 0 }, 'Kiếm không xuống dưới mốc có sẵn');
	assert.deepEqual(fitTiers({ fire: 2 }, -5), { fire: 0 }, 'điểm âm coi như 0');
	assert.deepEqual(fitTiers({ sword: 2, kiem_than: 5, fire: 3 }, 12), { sword: 2, kiem_than: 4, fire: 1 }, 'Kiếm (cổng phái) giữ trước, rồi phái sâu nhất: Kiếm 2 (1) + Kiếm Thần 4 (10) + Hoả 1');
	assert.deepEqual(fitTiers({ sword: 2, bac_than: 3 }, 0), { sword: 1, bac_than: 0 }, 'Kiếm không đủ mốc 2 thì phái về 0');
	for (const [want, pts] of [[{ sword: 2, kiem_than: 7, fire: 9 }, 47], [{ fire: 3, wind: 7 }, 12], [{ earth: 9, sword: 2 }, 3]] as [Tiers, number][]) {
		const kept = fitTiers(want, pts);
		assert.ok(spentPoints(kept) <= pts, `fitTiers không bao giờ tiêu quá điểm (${JSON.stringify(want)} / ${pts})`);
	}
}

// 6) Thưởng chiều sâu +4%/mốc trên mốc 1 (mốc 10 = +36%), thay rankPower; Tia Haven theo cấp.
{
	near(depthBonus(0), 1, 'chưa mở');
	near(depthBonus(1), 1, 'mốc 1');
	near(depthBonus(4), 1.12, 'mốc 4');
	near(depthBonus(10), 1.36, 'mốc 10');
	near(depthBonus(99), 1.36, 'kẹp');
	near(skillScale({ fire: 4 }, 'fire_bolt', 1), 1.12, 'Hoả Cầu theo mốc Hoả');
	near(skillScale({ water: 3 }, 'heal', 1), 1.08, 'Suối Lành theo mốc Thuỷ');
	near(skillScale({}, 'slash', 1), 1, 'chưa có mốc');
	near(skillScale({ sword: 9 }, 'haven_bolt', 1), 1, 'Haven không ăn mốc nhánh nào');
	near(havenScale(1), 1, 'Haven cấp 1');
	near(havenScale(11), 1.3, 'Haven +3%/cấp');
	near(skillScale({}, 'haven_bolt', 40), 1 + 0.03 * 39, 'Haven cấp 40');
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

// 8) Bị động mốc 2 (chỉ chính nguyên tố đó) + mốc 4 (bị động chung); bị động lưu phái theo nhánh phái (mốc phái 2 / 5 / 7).
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
	const four = passiveEffects({ sword: 2, kiem_than: 2, fire: 4, water: 4, wind: 4, ice: 4, earth: 4 });
	assert.deepEqual([four.crit, four.burning, four.lifesteal, four.cooldown, four.moveSpeed, four.damageTaken, four.defense, four.steadfast], [PASSIVE.crit, 1.2, 0.05, 0.9, 1.1, 0.9, 1.15, true], 'mốc 4 (Huyết Thuỷ, Da Đá; Kiếm Thần mốc 2: Mắt Tinh)');
	assert.equal(passiveEffects({ sword: 2 }).crit, 0, 'không có phái: không có Mắt Tinh');
	assert.deepEqual([passiveEffects({ sword: 2, thuy_than: 2 }).calm, passiveEffects({ sword: 2, thuy_than: 1 }).calm], [PASSIVE.calm, 1], 'Tâm Tĩnh: Thủy Thần mốc 2');
	const swift = passiveEffects({ sword: 2, bac_than: 2, wind: 4 });
	near(swift.moveSpeed, PASSIVE.moveSpeed * PASSIVE.swiftMove, 'Nhẹ Như Gió nhân chồng Thuận Gió');
	assert.deepEqual([swift.dodgeCost, swift.crit, swift.calm], [PASSIVE.swiftDodge, 0, 1], 'Bắc Thần: né rẻ hơn, không có bị động của phái khác');
	const mix = passiveEffects({ sword: 2, kiem_than: 2, thuy_than: 2 });
	assert.deepEqual([mix.crit, mix.calm], [PASSIVE.crit, PASSIVE.calm], 'tự do build: cộng hai phái thì có bị động của cả hai');
	const deep = passiveEffects({ sword: 2, kiem_than: 7, thuy_than: 5, bac_than: 7 });
	assert.deepEqual([deep.press, deep.rage, deep.riposte, deep.lake, deep.momentum, deep.evade], [true, true, true, false, true, PASSIVE.evade], 'mốc phái 5 / 7 = Kiếm cũ 7 / 9');
	assert.deepEqual([TREE.sword[1]!.name, TREE.water[1]!.name, TREE.water[3]!.name], ['Nhịp Chém', 'Thấm Sâu', 'Huyết Thuỷ'], 'tên bị động GĐ1.5');
}

// 9) Học kỹ năng: Trảm (Kiếm mốc 1) chỉ cần mã cốt truyện; phép mốc 1 của nguyên tố phải HỌC (nhánh ≥ mốc 1 — luật
//    10/10/2026, mở nhánh chưa đủ); Suối Lành cần Thuỷ mốc 3; Tia Haven bẩm sinh.
{
	const heal = HERO_SKILLS[5]!;
	assert.equal(knowsSkill(heal, { water: 2 }, all), false);
	assert.equal(knowsSkill(heal, { water: 3 }, all), true);
	assert.equal(knowsSkill(HERO_SKILLS[0]!, {}, all), true, 'Trảm: có kiếm là dùng được');
	assert.equal(knowsSkill(HERO_SKILLS[0]!, { sword: 4 }, () => false), false, 'chưa nhận kiếm');
	assert.equal(knowsSkill(HERO_SKILLS.find((s) => s.id === 'haven_bolt')!, {}, all), true, 'Tia Haven: có trượng là dùng được');
	const first: Record<string, string> = { fire: 'fire_bolt', water: 'water_lance', wind: 'wind_blade', ice: 'ice_shard', earth: 'rock_throw' };
	for (const [b, id] of Object.entries(first)) {
		const s = HERO_SKILLS.find((x) => x.id === id)!;
		assert.equal(knowsSkill(s, {}, all), false, `${id}: mở nhánh chưa đủ — chưa nhận mốc nào thì chưa học`);
		assert.equal(knowsSkill(s, { [b]: 0 }, all), false, `${id}: nhánh mở ở mốc 0 = chưa học`);
		assert.equal(knowsSkill(s, { [b]: 1 }, all), true, `${id}: mua mốc 1 là học`);
		assert.equal(knowsSkill(s, { [b]: 1 }, (u) => u !== BRANCH_UNLOCK[b as Branch]), false, `${id}: thiếu mã cốt truyện thì không`);
	}
}

// 10) Lối build chỉ để hiển thị. Kiếm (2 mốc) là cổng vào phái, không tính là một lối; phái tính thưởng theo thang Kiếm cũ.
{
	assert.equal(describeBuild({ sword: 2, fire: 1 }).kind, 'none');
	const f = describeBuild({ sword: 2, ice: 4, fire: 1 });
	assert.deepEqual([f.kind, f.label], ['focused', 'Thuần Băng']);
	assert.match(f.detail, /Băng mốc 4 \(\+12%\)/);
	const h = describeBuild({ sword: 2, kiem_than: 4, fire: 3 });
	assert.deepEqual([h.kind, h.label], ['hybrid', 'Kiếm Thần – Hoả']);
	assert.match(h.detail, /Kiếm Thần mốc 4 \(\+20%\)/);
	assert.equal(describeBuild({ sword: 2, kiem_than: 2, bac_than: 2, fire: 2 }).kind, 'spread');
}

// 11) Bọc nguyên tố (11/10/2026): KỸ NĂNG kích hoạt có thời gian — Kiếm ≥ mốc 2 + nguyên tố ĐÃ CHỌN ≥ mốc 3; 10 giây + 1 giây
//     mỗi mốc nguyên tố, tối đa 20. Chỉ Kiếm sĩ (và tuổi thơ chưa chọn lớp).
{
	assert.equal(canEnchant({ sword: 2, ice: 3 }, 'ice'), true);
	assert.equal(canEnchant({ sword: 1, ice: 5 }, 'ice'), false, 'Kiếm mốc 1');
	assert.equal(canEnchant({ sword: 2, ice: 2 }, 'ice'), false, 'Băng mốc 2');
	assert.equal(canEnchant({ sword: 2, fire: 9 }, 'ice'), false, 'nguyên tố khác không tính');
	assert.equal(canEnchant({ sword: 2, ice: 3, fire: 5 }, 'ice'), false, 'chỉ bọc được nguyên tố đã chọn (Hoả sâu hơn)');
	const cap = tiersFrom({ sword: 9, ice: 9 }, all);
	assert.deepEqual([cap.sword, cap.ice], [2, 9], 'kẹp trần: Kiếm 2, Băng 9');
	assert.equal(canEnchant(cap, 'ice'), true);
	assert.equal(canEnchant({ sword: 2, earth: 3 }, 'earth'), true, 'bọc Thổ');
	assert.deepEqual([0, 3, 9, 15].map(imbueSeconds), [10, 13, 19, 20]);
	assert.equal(ENCHANT_SWAP_SECONDS, 10);
	const imbue = HERO_SKILLS.find((s) => s.id === 'imbue')!;
	assert.deepEqual([imbue.kind, imbue.unlock, imbue.power], ['imbue', 'sword', 0]);
	assert.deepEqual(SKILL_NODE.imbue, { branch: 'sword', tier: 2, imbue: true });
	assert.equal(knowsSkill(imbue, { sword: 2, fire: 3 }, all), true, 'Kiếm 2 + Hoả 3');
	assert.equal(knowsSkill(imbue, { sword: 2, fire: 2 }, all), false, 'Hoả 2 chưa đủ');
	assert.equal(knowsSkill(imbue, { sword: 1, fire: 5 }, all), false, 'Kiếm 1 chưa đủ');
	assert.equal(knowsSkill(imbue, { sword: 2, fire: 3 }, all, 'sword'), true, 'Kiếm sĩ');
	assert.equal(knowsSkill(imbue, { sword: 2, fire: 3 }, all, 'mage'), false, 'Pháp sư không bọc kiếm');
}

// 12) Thanh 10 ô: phím J, K, 1–8; mặc định theo ô cũ; kẹp bản lưu; đổi chỗ khi gán.
{
	assert.equal(SLOT_COUNT, 10);
	assert.deepEqual([...SLOT_KEYS], ['J', 'K', '1', '2', '3', '4', '5', '6', '7', '8']);
	assert.deepEqual([...SLOT_CODES], ['KeyJ', 'KeyK', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8']);
	for (const s of HERO_SKILLS.filter((d) => d.key)) assert.equal(SLOT_KEYS[HOME_SLOT[s.id]!], s.key, `${s.id}: ô nhà = phím cũ`);
	for (const s of HERO_SKILLS.filter((d) => !d.key && d.id !== 'imbue')) assert.equal(HOME_SLOT[s.id], undefined, `${s.id}: kỹ năng GĐ2 không có ô nhà — vào ô trống đầu tiên`);
	assert.equal(HOME_SLOT.imbue, 1, 'Bọc nguyên tố: ô K của Kiếm sĩ (Pháp sư dùng ô K cho Tia Haven)');
	assert.equal(placeSkill(defaultLoadout(['slash', 'haven_bolt', 'fire_bolt', 'water_lance', 'wind_blade', 'heal', 'ice_shard']), 'flame_ring')[7], 'flame_ring', 'Vòng Lửa vào ô 6 (trống đầu tiên)');
	const known = ['slash', 'haven_bolt', 'fire_bolt', 'water_lance', 'wind_blade', 'ice_shard'];
	assert.deepEqual(defaultLoadout(known), ['slash', 'haven_bolt', 'fire_bolt', 'water_lance', 'wind_blade', null, 'ice_shard', null, null, null], 'mặc định J=Trảm, K=Tia Haven, rồi đúng phím cũ');
	assert.deepEqual(defaultLoadout([]), Array(10).fill(null));
	// Mới mở trượng trước kiếm: Haven vẫn vào ô K, không chiếm ô J.
	assert.deepEqual(defaultLoadout(['haven_bolt']).slice(0, 2), [null, 'haven_bolt']);

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

// 13d) Kỹ năng lưu phái (nhánh riêng) + kiếm pháp nguyên tố: học theo mốc phái; kiếm pháp cần nguyên tố đó ≥ 5 + một phái ≥ 3.
{
	const want: Record<string, [Branch, number]> = {
		heavy_strike: ['kiem_than', 1],
		pierce_rush: ['kiem_than', 3],
		calm_stance: ['thuy_than', 1],
		flowing_counter: ['thuy_than', 3],
		side_slash: ['bac_than', 1],
		shadow_step: ['bac_than', 3],
	};
	for (const [id, [style, tier]] of Object.entries(want)) {
		assert.deepEqual(SKILL_NODE[id], { branch: style, tier }, `${id}: ${style} mốc ${tier}`);
		const s = HERO_SKILLS.find((x) => x.id === id)!;
		assert.equal(s.element, 'steel', `${id}: đòn thép (ăn bọc nguyên tố)`);
		assert.equal(knowsSkill(s, { sword: 2, [style]: tier }, all), true);
		assert.equal(knowsSkill(s, { sword: 2, [style]: tier - 1 }, all), false, `${id}: chưa đủ mốc`);
		for (const other of STYLE_BRANCHES.filter((x) => x !== style)) assert.equal(knowsSkill(s, { sword: 2, [other]: 7 }, all), false, `${id}: phái khác không cho`);
		assert.equal(knowsSkill(s, { sword: 2, [style]: tier }, all, 'mage'), false, `${id}: Pháp sư không dùng`);
		assert.equal(pathAllowsSkill('sword', id), true);
		near(skillScale({ sword: 2, [style]: tier }, id, 1), depthBonus(tier + STYLE_OFFSET), `${id}: thưởng chiều sâu theo thang Kiếm cũ`);
	}
	assert.deepEqual(STYLE_TREE.kiem_than.map((n) => n.name).slice(0, 3), ['Nhất Kích', 'Mắt Tinh', 'Đột Kích']);
	assert.deepEqual(STYLE_TREE.thuy_than.map((n) => n.name).slice(0, 3), ['Thế Tĩnh', 'Tâm Tĩnh', 'Lưu Thủy Phản']);
	assert.deepEqual(STYLE_TREE.bac_than.map((n) => n.name).slice(0, 3), ['Lướt Chém', 'Nhẹ Như Gió', 'Ảnh Bộ']);
	assert.deepEqual(STYLE_TREE.kiem_than.map((n) => n.name).slice(3), ['Phá Giáp', 'Thế Áp Đảo', 'Lưỡi Sóng', 'Bất Khuất', 'Phán Quyết'], 'mốc 4–8 đúng bảng 3.1 (mốc 8 "Sắp có")');
	assert.deepEqual(STYLE_TREE.thuy_than.map((n) => n.name).slice(3), ['Dòng Chảy Ngược', 'Phản Đòn', 'Xoáy Nước', 'Mặt Hồ Phẳng', 'Thiên Tĩnh']);
	assert.deepEqual(STYLE_TREE.bac_than.map((n) => n.name).slice(3), ['Liên Hoàn', 'Đà Lướt', 'Phi Kiếm', 'Bóng Mờ', 'Ngàn Bóng']);
	assert.deepEqual(TREE.sword.map((n) => n.name), ['Trảm', 'Nhịp Chém'], 'Kiếm chỉ còn mốc chung');
	for (const st of SWORD_STYLES) assert.equal(TREE[st], STYLE_TREE[st]);

	const arts: Record<string, string> = { fire: 'blaze_slash', water: 'water_dragon_slash', wind: 'gale_blade_dance', ice: 'frost_cleave', earth: 'earth_rend' };
	assert.deepEqual(SWORD_ARTS, arts);
	assert.equal(SWORD_ART_TIER, 5);
	for (const [e, id] of Object.entries(arts)) {
		const s = HERO_SKILLS.find((x) => x.id === id)!;
		assert.deepEqual(SKILL_NODE[id], { branch: 'sword', tier: 2, art: e });
		assert.ok(s.blade && s.element === e, `${id}: đòn kiếm mang hệ ${e}`);
		for (const st of STYLE_BRANCHES) assert.equal(knowsSkill(s, { sword: 2, [st]: 3, [e]: 5 }, all), true, `${id}: phái nào ≥ 3 cũng được`);
		assert.equal(knowsSkill(s, { sword: 2, kiem_than: 2, [e]: 9 }, all), false, `${id}: phái 2 chưa đủ`);
		assert.equal(knowsSkill(s, { sword: 2, kiem_than: 7, [e]: 4 }, all), false, `${id}: ${e} 4 chưa đủ`);
		assert.equal(knowsSkill(s, { sword: 2, kiem_than: 3, [e]: 5 }, all, 'mage'), false, `${id}: Pháp sư không dùng`);
		near(skillScale({ sword: 2, kiem_than: 3, [e]: 3 }, id, 1), depthBonus(3), `${id}: thưởng chiều sâu theo nhánh yếu hơn`);
	}
	assert.equal(knowsSkill(HERO_SKILLS.find((x) => x.id === 'frost_cleave')!, { sword: 2, kiem_than: 3, fire: 5 }, all), false, 'mỗi kiếm pháp đúng nguyên tố của nó');
}

// 14) Lớp → vũ khí: Kiếm sĩ chỉ đòn kiếm (Trảm, phái, kiếm pháp, Bọc nguyên tố), Pháp sư chỉ trượng (Tia Haven + phép).
{
	const blade = ['slash', 'heavy_strike', 'blaze_slash', 'imbue'];
	const staff = ['haven_bolt', 'fire_bolt', 'heal', 'ice_shard'];
	for (const id of blade) assert.deepEqual([pathAllowsSkill('sword', id), pathAllowsSkill('mage', id), pathAllowsSkill('none', id)], [true, false, true], id);
	for (const id of staff) assert.deepEqual([pathAllowsSkill('sword', id), pathAllowsSkill('mage', id), pathAllowsSkill('none', id)], [false, true, true], id);
	const slash = HERO_SKILLS[0]!;
	assert.equal(knowsSkill(slash, {}, all, 'mage'), false, 'Pháp sư bỏ kiếm');
	assert.equal(knowsSkill(HERO_SKILLS.find((s) => s.id === 'fire_bolt')!, { fire: 1 }, all, 'sword'), false, 'Kiếm sĩ học Hoả chỉ để bọc kiếm, không tung phép');
}

console.log('✔ talents.test (sim): phần luật');

// Chạy: npx tsx tests/talentsView.test.ts — hàm thuần dựng bảng Tiềm năng (game/talentsView.ts, Game + phòng thử dùng chung)
// và số liệu cột chi tiết (components/talents/talentInfo.ts: skillSheet, statLine, reactionRows, tiersOf).
import assert from 'node:assert/strict';
import { reactionRows, skillSheet, statLine, tiersOf } from '../src/components/talents/talentInfo';
import { HERO_SKILLS } from '../src/game/combat/skills';
import { BRANCHES, defaultLoadout, ENCHANT_SWAP_SECONDS, PASSIVE, SLOT_KEYS, type Tiers } from '../src/game/combat/talents';
import { buildTalentsView, ENCHANT_LABEL, knownSkillIds } from '../src/game/talentsView';

let passed = 0;
function test(name: string, fn: () => void): void {
	fn();
	passed += 1;
	console.log(`  ✓ ${name}`);
}

/** Mã cốt truyện đã mở: nhánh có mốc > 0, cộng thêm `open` (nhánh nguyên tố đã mở mà chưa học — mốc 0). */
const openAll = (tiers: Tiers, open: string[] = []) => (id: string): boolean => open.includes(id) || BRANCHES.some((b) => b === id && (tiers[b] ?? 0) > 0);
function make(tiers: Tiers, style: 'kiem_than' | 'thuy_than' | 'bac_than' | null, level: number, enchant: 'fire' | null = null, cd = 0, open: string[] = []) {
	const isUnlocked = openAll(tiers, open);
	const known = knownSkillIds(tiers, isUnlocked, style);
	return buildTalentsView({ tiers, level, style, isUnlocked, enchant, enchantCooldown: cd, loadout: defaultLoadout(known) });
}

console.log('talentsView');

test('dựng đủ 6 nhánh, điểm theo cấp, nhánh khoá có lý do, Kiếm có 3 lưu phái', () => {
	// Cấp 21 = 24 điểm; đã dùng Kiếm 5 (8) + Hoả 5 (9) + Thuỷ 2 (2) + Phong 1 (1) + Băng 1 (1) = 21 (mốc 1 nguyên tố = 1 điểm).
	const t = make({ sword: 5, fire: 5, water: 2, wind: 1, ice: 1, earth: 0 }, 'kiem_than', 21, 'fire', 3.2);
	assert.equal(t.branches.length, 6);
	assert.equal(t.points, 24);
	assert.equal(t.spent, 21);
	assert.equal(t.unspent, 3);
	const earth = t.branches.find((b) => b.branch === 'earth')!;
	assert.equal(earth.unlocked, false);
	assert.ok(earth.lockNote.length > 0);
	const sword = t.branches.find((b) => b.branch === 'sword')!;
	assert.equal(sword.style, 'kiem_than');
	assert.equal(sword.styles?.length, 3);
	assert.equal(sword.bonusPct, 16);
	// Hồi phủ phép làm tròn LÊN giây (store so JSON — không ghi lại mỗi frame).
	assert.equal(t.enchant.cooldown, 4);
	assert.equal(t.enchant.current, 'fire');
	assert.equal(t.enchant.options.find((o) => o.id === 'fire')!.name, ENCHANT_LABEL.fire);
	assert.ok(t.enchant.options.find((o) => o.id === 'fire')!.ok);
	assert.ok(!t.enchant.options.find((o) => o.id === 'water')!.ok);
	assert.equal(t.loadout.length, SLOT_KEYS.length);
	assert.equal(t.loadout[0]!.key, 'J');
	// Kiếm 5 + Hoả 5 → đã lĩnh ngộ Liệt Hoả Trảm, Thuỷ chưa.
	assert.ok(t.arts.find((a) => a.element === 'fire')!.learned);
	assert.ok(!t.arts.find((a) => a.element === 'water')!.learned);
	assert.ok(t.learned.some((s) => s.id === 'blaze_slash'));
	assert.ok(!t.learned.some((s) => s.id === 'calm_stance'), 'kỹ năng lưu phái khác không học');
});

test('nhánh nguyên tố ĐÃ MỞ mà chưa học (luật 10/10/2026): unlocked + mốc 0, nấc mốc 1 giá 1 điểm, chưa có phép trên thanh', () => {
	const t = make({ sword: 1, fire: 0 }, null, 3, null, 0, ['sword', 'fire', 'staff']);
	const fire = t.branches.find((b) => b.branch === 'fire')!;
	const water = t.branches.find((b) => b.branch === 'water')!;
	const sword = t.branches.find((b) => b.branch === 'sword')!;
	assert.deepEqual([fire.unlocked, fire.tier, fire.nextCost, fire.nodes[0]!.cost, fire.nodes[0]!.reached, fire.lockNote], [true, 0, 1, 1, false, ''], 'Hoả mở: mốc 0, học Hoả Cầu 1 điểm');
	assert.deepEqual([water.unlocked, water.tier, water.nextCost], [false, 0, null], 'Thuỷ chưa mở: cũng mốc 0 nhưng khoá, không có nấc kế');
	assert.deepEqual([sword.tier, sword.nodes[0]!.cost, sword.nodes[0]!.reached, sword.nodes[1]!.cost], [1, 0, true, 1], 'Kiếm mốc 1 có sẵn (giá 0), mốc 2 = 1 điểm');
	assert.deepEqual([t.points, t.spent, t.unspent], [2, 0, 2]);
	assert.ok(!t.learned.some((s) => s.id === 'fire_bolt'), 'Hoả Cầu chưa học');
	assert.deepEqual(t.learned.map((s) => s.id), ['slash', 'aether_bolt']);
	assert.ok(!t.loadout.some((x) => x.skillId === 'fire_bolt'), 'thanh 10 ô không gán phép chưa học');
	assert.deepEqual(t.loadout.slice(0, 2).map((x) => x.skillId), ['slash', 'aether_bolt'], 'J = Trảm, K = Tia Aether');
	// Học xong mốc 1 → Hoả Cầu vào danh sách đã học và ô nhà (phím 1).
	const after = make({ sword: 1, fire: 1 }, null, 3, null, 0, ['sword', 'fire', 'staff']);
	assert.ok(after.learned.some((s) => s.id === 'fire_bolt'));
	assert.equal(after.loadout[2]!.skillId, 'fire_bolt');
	assert.deepEqual([after.spent, after.unspent], [1, 1]);
});

test('skillSheet lấy số THẬT của HERO_SKILLS: MP, hồi chiêu, uy lực, hệ, cách đánh + hiệu ứng tách đúng', () => {
	const t = make({ sword: 5, fire: 5, water: 2, wind: 1, ice: 1, earth: 0 }, 'kiem_than', 18);
	for (const s of HERO_SKILLS) {
		const sk = skillSheet(t, s.id);
		assert.ok(sk, s.id);
		assert.equal(sk.mp, s.mpCost, `${s.id} MP`);
		assert.equal(sk.cooldown, s.cooldown, `${s.id} hồi`);
		assert.ok(!sk.power.startsWith('uy lực'), `${s.id}: bỏ chữ "uy lực"`);
		assert.ok(!sk.effects.some((e) => sk.how.includes(e)), `${s.id}: câu tả và hiệu ứng không lặp`);
	}
	const ice = skillSheet(t, 'ice_spire', 5)!;
	assert.deepEqual(ice.effects, ['hất 0,5s', 'đóng băng 1,4s']);
	assert.equal(ice.how.length, 1);
	assert.equal(ice.elementName, 'Băng');
	// Nút chưa đạt: thưởng chiều sâu tính ở mốc của nút (Băng 5 → +16%).
	assert.equal(ice.depthPct, 16);
	assert.equal(ice.powerNow, '≈ ×3,02');
	const heal = skillSheet(t, 'heal', 3)!;
	assert.equal(heal.power, 'Hồi 35% máu tối đa');
	assert.equal(statLine(heal), '15 MP · hồi 6s · hồi 35% máu tối đa');
});

test('hồi chiêu sau bị động: Nhịp Chém (đòn Kiếm) và Thuận Gió (mọi đòn) — như CombatSystem.cooldownOf', () => {
	const base = make({ sword: 1, fire: 1, water: 0, wind: 1, ice: 0, earth: 0 }, null, 3);
	assert.equal(skillSheet(base, 'fire_bolt')!.cooldownNow, 1);
	assert.deepEqual(skillSheet(base, 'fire_bolt')!.cooldownBy, []);
	const t = make({ sword: 3, fire: 1, water: 0, wind: 4, ice: 0, earth: 0 }, 'kiem_than', 12);
	const fb = skillSheet(t, 'fire_bolt')!;
	assert.equal(fb.cooldownNow, Math.round(1 * PASSIVE.cooldown * 100) / 100);
	assert.deepEqual(fb.cooldownBy, ['Thuận Gió']);
	const hs = skillSheet(t, 'heavy_strike')!;
	assert.equal(hs.cooldownNow, Math.round((4.5 / (1 + PASSIVE.swordHaste)) * PASSIVE.cooldown * 100) / 100);
	assert.deepEqual(hs.cooldownBy, ['Nhịp Chém', 'Thuận Gió']);
	assert.ok(hs.blade);
});

test('reactionRows: chỉ cặp hệ đều đã học (≥ mốc 1), thưởng +5% mỗi mốc trên mốc 1 của hệ yếu hơn', () => {
	const t = make({ sword: 2, fire: 4, water: 3, wind: 0, ice: 1, earth: 0 }, null, 12);
	const rows = reactionRows(t);
	assert.deepEqual(rows.map((r) => r.id).sort(), ['freeze', 'melt', 'steam']);
	// Phong đã mở mà chưa học (mốc 0): chưa có phép Phong nào để ra Bùng Lửa / Băng Giá — chưa liệt kê.
	assert.deepEqual(reactionRows(make({ sword: 2, fire: 4, water: 3, wind: 0, ice: 1, earth: 0 }, null, 12, null, 0, ['wind'])).map((r) => r.id).sort(), ['freeze', 'melt', 'steam']);
	const steam = rows.find((r) => r.id === 'steam')!;
	assert.equal(steam.pct, 10);
	assert.equal(steam.nextPct, 15);
	assert.equal(rows[0]!.id, 'steam', 'thưởng cao trước');
	assert.deepEqual(tiersOf(t).tiers, { sword: 2, fire: 4, water: 3, wind: 0, ice: 1, earth: 0 });
});

test('ENCHANT_SWAP_SECONDS còn là 10 (chữ trên bảng Gán ô · Phủ phép đọc thẳng hằng số)', () => {
	assert.equal(ENCHANT_SWAP_SECONDS, 10);
});

console.log(`\n${passed} test qua.`);

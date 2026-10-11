// Phần LUẬT THUẦN tách từ apps/web/tests/swordstyles.test.ts (11/10/2026, chuẩn bị xoá bản web): chỉ hàm của @aether/sim (+ bảng hình
// tạm `UnityGame/Tools~/data/tempArt.ts`). Phần chạy CombatSystem của web bỏ cùng bản web — client Unity có test C# + vector riêng.
// Chạy: npx tsx tests/swordstyles.test.ts (trong packages/sim) hoặc `npm test -w @aether/sim`.
// Chạy: npx tsx tests/swordstyles.test.ts — GĐ2 lượt B: Kiếm 3 lưu phái trong trận (Nhất Kích dồn lực, Đột Kích, Thế Tĩnh
// chặn + phản, Lưu Thủy Phản cửa sổ đỡ, Tâm Tĩnh, Lướt Chém i-frame, Nhẹ Như Gió, Ảnh Bộ ra sau lưng + chí mạng), 5 kiếm
// pháp nguyên tố, luật thuần thế đỡ / Ảnh Bộ, và hình tạm Băng Trụ / Lốc Xoáy làm lại.
import assert from 'node:assert/strict';
import { armorDamage, behindPoint, GUARD, guardOutcome, lifestealHeal, pickAhead } from '../src/skillRules.ts';
import { HERO_SKILLS, isGroundTarget, isSwordSkill, skillFacts } from '../src/skills.ts';
import { depthBonus, PASSIVE, type SwordStyle, type Tiers } from '../src/talents.ts';
import { TEMP_ART } from '../../../UnityGame/Tools~/data/tempArt.ts';

const near = (a: number, b: number, what: string, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${what}: ${a} ≠ ${b}`);
const idx = (id: string) => {
	const i = HERO_SKILLS.findIndex((s) => s.id === id);
	assert.ok(i >= 0, `có kỹ năng ${id}`);
	return i;
};
const def = (id: string) => HERO_SKILLS[idx(id)]!;

// 1) Luật thuần.
{
	// Thế Tĩnh: chặn + phản cận chiến, đạn / đòn vùng còn 40%, không tan. Lưu Thủy Phản: hoá giải đòn đầu (cả đạn) rồi tan.
	assert.deepEqual(guardOutcome('stance', 'melee'), { counter: true, mult: 0, ends: false });
	assert.deepEqual(guardOutcome('stance', 'shot'), { counter: false, mult: GUARD.shot, ends: false });
	assert.deepEqual(guardOutcome('parry', 'melee'), { counter: true, mult: 0, ends: true });
	assert.deepEqual(guardOutcome('parry', 'shot'), { counter: true, mult: 0, ends: true });
	for (const g of ['stance', 'parry'] as const) assert.deepEqual(guardOutcome(g, 'area'), { counter: false, mult: GUARD.shot, ends: false }, `${g}: đòn vùng chỉ giảm`);
	// Sau lưng = đi tiếp qua mục tiêu theo hướng tiếp cận.
	assert.deepEqual(behindPoint(0, 0, 100, 0, 34), { x: 134, y: 0 });
	assert.deepEqual(behindPoint(100, 100, 100, 0, 30), { x: 100, y: -30 });
	// Chọn mục tiêu: trong tầm + trong nón; gần hướng nhắm hơn thì thắng dù xa hơn một chút.
	const t = [
		{ x: 120, y: 60 },
		{ x: 180, y: 0 },
		{ x: -50, y: 0 },
		{ x: 400, y: 0 },
	];
	assert.equal(pickAhead(0, 0, 1, 0, 260, 60, t), 1, 'gần hướng nhắm');
	assert.equal(pickAhead(0, 0, -1, 0, 260, 60, t), 2, 'nhắm ngược lại: mục tiêu phía sau');
	assert.equal(pickAhead(0, 0, 0, -1, 260, 60, t), -1, 'không có gì trong nón');
	assert.equal(pickAhead(0, 0, 1, 0, 100, 60, t), -1, 'ngoài tầm');
}

// 2) Dữ liệu: nối CUỐI (chỉ số 0–16 giữ nguyên), đòn thép ăn phủ phép, kiếm pháp mang hệ + tính là đòn kiếm, không nhắm đất.
{
	assert.deepEqual(
		HERO_SKILLS.slice(0, 17).map((s) => s.id),
		['slash', 'aether_bolt', 'fire_bolt', 'water_lance', 'wind_blade', 'heal', 'ice_shard', 'flame_ring', 'fire_blast', 'tidal_wave', 'cyclone', 'gale_dash', 'frost_field', 'ice_spire', 'rock_throw', 'quake', 'stone_spikes'],
		'chỉ số cũ không lệch (thanh kỹ năng / máy người khác tra theo chỉ số)',
	);
	for (const id of ['heavy_strike', 'pierce_rush', 'calm_stance', 'flowing_counter', 'side_slash', 'shadow_step']) {
		assert.ok(isSwordSkill(def(id)) && def(id).element === 'steel', `${id}: đòn Kiếm thép`);
		assert.ok(!def(id).key, `${id}: không có ô nhà — vào ô trống đầu tiên`);
	}
	for (const id of ['blaze_slash', 'water_dragon_slash', 'gale_blade_dance', 'frost_cleave', 'earth_rend']) {
		assert.ok(isSwordSkill(def(id)) && def(id).blade && def(id).element !== 'steel', `${id}: đòn kiếm mang hệ`);
		assert.ok(!isGroundTarget(def(id)), `${id}: không nhắm điểm trên đất`);
		assert.ok(def(id).power >= 2.4 && def(id).mpCost >= 18 || def(id).kind === 'zone', `${id}: mạnh cỡ kỹ năng mốc 5`);
	}
	assert.equal(def('flowing_counter').power, 2 * def('calm_stance').power, 'Lưu Thủy Phản phản gấp đôi Thế Tĩnh');
	assert.equal(def('shadow_step').crit, 1, 'Ảnh Bộ chắc chắn chí mạng');
	assert.ok((def('side_slash').iframes ?? 0) >= (def('side_slash').range ?? 0) / (def('side_slash').speed ?? 1), 'Lướt Chém: i-frame phủ hết quãng lướt');
	assert.match(skillFacts(def('calm_stance'))[0]!, /Giữ thế 1,5s.*40%/);
	assert.match(skillFacts(def('flowing_counter'))[0]!, /Cửa sổ đỡ 0,6s/);
	assert.ok(skillFacts(def('shadow_step')).includes('chắc chắn chí mạng'));
	assert.match(skillFacts(def('heavy_strike'))[0]!, /dồn lực 0,3s/);
	assert.ok(skillFacts(def('water_dragon_slash')).includes('hút máu 15%'));
	assert.match(skillFacts(def('gale_blade_dance'))[0]!, /^Quanh mình 2,4s/);
	for (const id of ['heavy_strike', 'pierce_rush', 'calm_stance', 'flowing_counter', 'side_slash', 'shadow_step', 'blaze_slash', 'water_dragon_slash', 'gale_blade_dance', 'frost_cleave', 'earth_rend']) {
		assert.ok(TEMP_ART[id]?.icon && TEMP_ART[id]!.todo, `${id}: hình tạm + icon tạm + ghi chú cần vẽ`);
	}
	assert.equal(TEMP_ART.earth_rend!.final, 'rock_spikes', 'Địa Liệt Trảm tự dùng gai đá PixelLab khi có');
}

console.log('✔ swordstyles.test (sim): phần luật');

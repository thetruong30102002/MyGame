// Chạy: npx tsx tests/skilllab.test.ts — luật dựng bộ chiêu của trang Thử chiêu (`src/game/skillLabBuild.ts`): mốc theo lựa chọn,
// kỹ năng đã biết, thanh 10 ô mặc định, phủ phép, bị động. Không cần trình duyệt.
import assert from 'node:assert/strict';
import { guardOutcome } from '../src/game/combat/skillRules';
import { HERO_SKILLS } from '../src/game/combat/skills';
import { SKILL_NODE, SLOT_COUNT, SWORD_ARTS, tierCap, ULT_TIER } from '../src/game/combat/talents';
import { EMPTY_BUILD, labEnchant, labKnown, labLoadout, labPassives, labTiers, toggleElement } from '../src/game/skillLabBuild';

// Chưa chọn gì: chỉ Trảm + Tia Aether, Kiếm mốc 2.
assert.deepEqual(labTiers(EMPTY_BUILD), { sword: 2 });
assert.deepEqual(labKnown(EMPTY_BUILD), ['slash', 'aether_bolt']);
assert.deepEqual(labLoadout(EMPTY_BUILD).slice(0, 3), ['slash', 'aether_bolt', null]);
assert.equal(labLoadout(EMPTY_BUILD).length, SLOT_COUNT);

// Một nguyên tố: phòng tập lên mốc 10 (game thật vẫn dừng mốc 9 — tuyệt kỹ chỉ ở đây); đủ 6 chiêu chủ động của nhánh, tuyệt kỹ
// lên ô 1, còn lại theo mốc.
const fire = toggleElement(EMPTY_BUILD, 'fire');
assert.equal(tierCap('fire'), 9, 'game thật không cộng tới mốc 10');
assert.equal(labTiers(fire).fire, ULT_TIER);
const fireLo = labLoadout(fire);
assert.deepEqual(fireLo.slice(0, 3), ['slash', 'aether_bolt', 'phoenix']);
const fireSkills = fireLo.slice(2).filter((x): x is string => !!x);
assert.equal(fireSkills.length, 6);
assert.ok(fireSkills.every((id) => SKILL_NODE[id]?.branch === 'fire'));
const rest = fireSkills.slice(1).map((id) => SKILL_NODE[id]!.tier);
assert.deepEqual(rest, [...rest].sort((a, b) => a - b));
// Mỗi nhánh / lưu phái có đúng một tuyệt kỹ ở mốc 10.
const ults = HERO_SKILLS.filter((s) => s.ult);
assert.equal(ults.length, 8);
assert.ok(ults.every((s) => SKILL_NODE[s.id]?.tier === ULT_TIER));
// Không có lưu phái thì không có kiếm pháp nguyên tố.
assert.ok(!labKnown(fire).includes(SWORD_ARTS.fire));

// Lưu phái: chiêu riêng của đúng lưu phái, không lẫn lưu phái khác.
for (const style of ['kiem_than', 'thuy_than', 'bac_than'] as const) {
	const b = { ...EMPTY_BUILD, style };
	const known = labKnown(b);
	const own = known.filter((id) => SKILL_NODE[id]?.style);
	assert.equal(own.length, 5, style);
	assert.ok(own.some((id) => HERO_SKILLS.find((s) => s.id === id)?.ult), style);
	assert.ok(own.every((id) => SKILL_NODE[id]!.style === style), style);
}

// Lưu phái + nguyên tố: có kiếm pháp, phủ phép bật được; bỏ nguyên tố thì phủ phép tự tắt.
const combo = { ...toggleElement({ ...EMPTY_BUILD, style: 'kiem_than' as const }, 'ice'), enchant: 'ice' as const };
assert.ok(labKnown(combo).includes(SWORD_ARTS.ice));
assert.ok(labLoadout(combo).includes(SWORD_ARTS.ice));
assert.equal(labEnchant(combo), 'ice');
assert.equal(toggleElement(combo, 'ice').enchant, null);
assert.equal(labEnchant({ ...combo, style: null }), null);

// Nhiều nhánh: thanh đầy 10 ô, không trùng; phần thừa vẫn nằm trong danh sách đã biết.
const many = ['fire', 'water', 'wind'].reduce((b, e) => toggleElement(b, e as 'fire'), { ...EMPTY_BUILD, style: 'bac_than' as const });
const lo = labLoadout(many);
assert.equal(lo.filter(Boolean).length, SLOT_COUNT);
assert.equal(new Set(lo).size, SLOT_COUNT);
assert.ok(lo.every((id) => id && labKnown(many).includes(id)));

// Bị động: chỉ của nhánh đã chọn, đủ mốc.
const passives = labPassives(fire);
assert.ok(passives.some((p) => p.branch === 'fire'));
assert.ok(passives.every((p) => p.branch === 'fire' || p.branch === 'sword'));

// Thiên Tĩnh: hoá giải + phản MỌI loại đòn, giữ suốt thời gian (Thế Tĩnh thường chỉ giảm đạn / đòn vùng).
for (const k of ['melee', 'shot', 'area'] as const) assert.deepEqual(guardOutcome('still', k), { counter: true, mult: 0, ends: false }, `Thiên Tĩnh: ${k}`);
assert.equal(guardOutcome('stance', 'area').counter, false, 'Thế Tĩnh không phản đòn vùng');

console.log('skilllab: ok');

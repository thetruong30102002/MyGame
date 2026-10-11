// Phần LUẬT THUẦN tách từ apps/web/tests/elements.test.ts (11/10/2026, chuẩn bị xoá bản web): chỉ hàm của @aether/sim (+ bảng hình
// tạm `UnityGame/Tools~/data/tempArt.ts`). Phần chạy CombatSystem của web bỏ cùng bản web — client Unity có test C# + vector riêng.
// Chạy: npx tsx tests/elements.test.ts (trong packages/sim) hoặc `npm test -w @aether/sim`.
// Chạy: npx tsx tests/elements.test.ts — GĐ2 cây Nguyên tố (lượt A): kiểu đòn mới (vùng quanh mình, vùng nhắm, nón,
// đường thẳng, lướt, cột trồi, vùng tồn tại có hút), trạng thái mới (choáng, hất, phá giáp, trượt, chậm nặng, đẩy lùi;
// boss một nửa), 4 phản ứng Thổ, bị động Thấm Sâu / Huyết Thuỷ / Đá Nặng / Da Đá, phủ Thổ, trần mốc, bảng TEMP_ART.
// Mốc 6–9 (GĐ3) ở tests/tiers69.test.ts.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
	aheadPoint,
	armorDamage,
	attackMisses,
	ccSeconds,
	clampTarget,
	dashPlan,
	EARTH,
	EARTH_ENCHANT,
	GROUND_SQUASH,
	inArea,
	inCircle,
	inCone,
	inLine,
	knockDir,
	launchHeight,
	lifestealHeal,
	lineSegments,
	moveFactor,
	pullStep,
	segmentDistance,
} from '../src/skillRules.ts';
import { HERO_SKILLS, isGroundTarget, isSwordSkill, skillFacts, type SkillKind } from '../src/skills.ts';
import { knowsSkill, PASSIVE, REACTION_NAME, REACTION_PAIR, SKILL_NODE, tierCap, TREE, BRANCHES, type Branch } from '../src/talents.ts';
import { TEMP_ART, tempIcon } from '../../../UnityGame/Tools~/data/tempArt.ts';

const near = (a: number, b: number, what: string, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${what}: ${a} ≠ ${b}`);
const idx = (id: string) => {
	const i = HERO_SKILLS.findIndex((s) => s.id === id);
	assert.ok(i >= 0, `có kỹ năng ${id}`);
	return i;
};

// 1) Hình học thuần của các kiểu đòn.
{
	// Vùng tròn trên mặt đất là elip dẹt dọc (0,62): 60px xuống dưới = 96,8 "đơn vị đất" < 100.
	assert.equal(GROUND_SQUASH, 0.62);
	assert.equal(inCircle(0, 60, 0, 0, 100), true);
	assert.equal(inCircle(0, 70, 0, 0, 100), false, 'theo chiều dọc vùng ngắn hơn');
	assert.equal(inCircle(100, 0, 0, 0, 100), true, 'mép ngang');
	assert.equal(inCircle(110, 0, 0, 0, 100, 14), true, 'nới bằng bề ngang thân');
	// Nón: hướng đông, dài 150, nửa góc 30°.
	assert.equal(inCone(100, 0, 0, 0, 1, 0, 150, 30), true);
	assert.equal(inCone(100, 70, 0, 0, 1, 0, 150, 30), false, '35° > 30°');
	assert.equal(inCone(100, 70, 0, 0, 1, 0, 150, 30, 14), true, 'thân chạm mép nón vẫn trúng');
	assert.equal(inCone(100, 100, 0, 0, 1, 0, 150, 30, 14), false, '45° ngoài nón');
	assert.equal(inCone(-50, 0, 0, 0, 1, 0, 150, 30, 14), false, 'sau lưng');
	assert.equal(inCone(160, 0, 0, 0, 1, 0, 150, 30), false, 'quá tầm');
	assert.equal(inCone(5, 5, 0, 0, 1, 0, 150, 30, 14), true, 'đè lên gốc');
	// Đường thẳng (đầu mút bo tròn).
	near(segmentDistance(50, 20, 0, 0, 100, 0), 20, 'khoảng cách tới đoạn');
	near(segmentDistance(130, 0, 0, 0, 100, 0), 30, 'quá đầu mút');
	assert.equal(inLine(50, 20, 0, 0, 100, 0, 26), true);
	assert.equal(inLine(50, 30, 0, 0, 100, 0, 26), false);
	assert.equal(inLine(50, 30, 0, 0, 100, 0, 26, 14), true);
	assert.equal(inLine(110, 0, 0, 0, 100, 0, 26), true, 'đầu mút bo tròn');
	assert.equal(inArea({ kind: 'line', ax: 0, ay: 0, bx: 100, by: 0, half: 26 }, 130, 0), false);
	assert.equal(inArea({ kind: 'cone', x: 0, y: 0, dx: 0, dy: 1, range: 100, half: 40 }, 0, 80), true);
	// Điểm nhắm kẹp theo tầm; không chuột thì đặt trước mặt.
	assert.deepEqual(clampTarget(0, 0, 300, 400, 250), { x: 150, y: 200 });
	assert.deepEqual(clampTarget(0, 0, 30, 40, 250), { x: 30, y: 40 }, 'trong tầm: giữ nguyên');
	const a = aheadPoint(10, 20, 1, 1, 100);
	near(a.x, 10 + 100 / Math.SQRT2, 'trước mặt (chéo) x');
	near(a.y, 20 + 100 / Math.SQRT2, 'trước mặt (chéo) y');
	// Gai trồi theo đoạn 34px.
	const segs = lineSegments(0, 0, 2, 0, 100, 34);
	assert.deepEqual(segs.map((s) => [s.ax, s.bx, s.cx]), [[0, 34, 17], [34, 68, 51], [68, 100, 84]]);
	// Lướt + hút.
	assert.deepEqual(dashPlan(3, 4, 200, 500), { vx: 300, vy: 400, t: 0.4 });
	assert.deepEqual(pullStep(0, 0, 10, 0, 90, 1), { dx: 10, dy: 0 }, 'không hút quá tâm');
	assert.deepEqual(pullStep(0, 0, 100, 0, 90, 0.5), { dx: 45, dy: 0 });
	// Hướng đẩy: ra xa tâm vùng / gốc nón; theo chiều đường thẳng.
	assert.deepEqual(knockDir({ kind: 'circle', x: 0, y: 0, r: 50 }, 0, 10), { x: 0, y: 1 });
	assert.deepEqual(knockDir({ kind: 'line', ax: 0, ay: 0, bx: 0, by: -50, half: 10 }, 5, -10), { x: 0, y: -1 });
	assert.deepEqual(knockDir({ kind: 'cone', x: 0, y: 0, dx: 1, dy: 0, range: 50, half: 30 }, 0, 0), { x: 1, y: 0 }, 'đè lên gốc: theo hướng nón');
}

// 2) Trạng thái thuần: boss nửa thời lượng, hất parabol, phá giáp, chậm, trượt, hút máu.
{
	assert.equal(ccSeconds(1.6, true), 0.8);
	assert.equal(ccSeconds(1.6, false), 1.6);
	assert.equal(launchHeight(0.25, 0.5), 26, 'đỉnh hất ở giữa');
	assert.deepEqual([launchHeight(0.5, 0.5), launchHeight(0, 0.5)], [0, 0], 'đầu/cuối nằm trên đất');
	assert.equal(armorDamage(40, 8, false), 36);
	assert.equal(armorDamage(40, 8, true), 44, 'phá giáp: giáp còn nửa + nhận thêm 15%');
	assert.equal(armorDamage(1, 50, true), 1, 'sàn 1');
	assert.equal(moveFactor({ chill: 1, wet: 0 }, 0.35, 1), 0.5, 'lạnh');
	assert.equal(moveFactor({ chill: 1, frost: 1, wet: 0 }, 0.35, 1), 0.35, 'lạnh sâu');
	assert.equal(moveFactor({ chill: 1, wet: 0, slow: 2, slowMult: EARTH.mudSlow }, 0.35, 1), 0.3, 'Bùn Lầy: lấy mức chậm nhất, không nhân chồng');
	near(moveFactor({ chill: 0, wet: 2 }, 0.35, PASSIVE.wetSlow), 0.9, 'Thấm Sâu');
	near(moveFactor({ chill: 1, wet: 2 }, 0.35, PASSIVE.wetSlow), 0.45, 'Thấm Sâu nhân thêm lên lạnh');
	assert.deepEqual([attackMisses(1, 0.4, 0.39), attackMisses(1, 0.4, 0.41), attackMisses(0, 0.4, 0)], [true, false, false]);
	assert.deepEqual([lifestealHeal(38, 0.05), lifestealHeal(9, 0.05), lifestealHeal(10, 0.05), lifestealHeal(100, 0)], [2, 0, 1, 0]);
}

// 3) Dữ liệu kỹ năng GĐ2: đủ 7 kiểu đòn mới, nhánh/mốc đúng bảng 3.2, phím mặc định, nhắm điểm, Lướt Gió không phải kiếm.
{
	const want: Record<string, [Branch, number, SkillKind]> = {
		flame_ring: ['fire', 3, 'aoe_self'],
		fire_blast: ['fire', 5, 'aoe_target'],
		tidal_wave: ['water', 5, 'cone'],
		cyclone: ['wind', 3, 'zone'],
		gale_dash: ['wind', 5, 'dash'],
		frost_field: ['ice', 3, 'zone'],
		ice_spire: ['ice', 5, 'pillar'],
		rock_throw: ['earth', 1, 'projectile'],
		quake: ['earth', 3, 'aoe_self'],
		stone_spikes: ['earth', 5, 'line'],
	};
	for (const [id, [branch, tier, kind]] of Object.entries(want)) {
		assert.deepEqual(SKILL_NODE[id], { branch, tier }, `${id}: nhánh + mốc`);
		assert.equal(HERO_SKILLS[idx(id)]!.kind, kind, `${id}: kiểu đòn`);
		assert.ok(idx(id) >= 7, `${id}: nối cuối, không lệch chỉ số 0–6`);
	}
	const kinds = new Set(HERO_SKILLS.map((s) => s.kind));
	for (const k of ['aoe_self', 'aoe_target', 'cone', 'line', 'dash', 'pillar', 'zone'] as SkillKind[]) assert.ok(kinds.has(k), `có kỹ năng kiểu ${k}`);
	assert.deepEqual(
		HERO_SKILLS.filter((s) => isGroundTarget(s)).map((s) => s.id),
		['fire_blast', 'cyclone', 'frost_field', 'ice_spire', 'fire_wall', 'meteor', 'call_rain', 'thunder_rain', 'ice_rain', 'stone_wall', 'rockslide', 'whirlpool', 'heaven_wind', 'ice_age', 'mountain_god', 'judgment', 'still_heaven', 'thousand_shadows'],
		'nhắm điểm trên đất (GĐ3: tường, thiên thạch, mưa, mây sét, mưa nhiều điểm — Vòi Rồng chỉ cần hướng; 11/10/2026: Xoáy Nước + mọi tuyệt kỹ đặt vùng đánh vào chỗ nhắm)',
	);
	for (const s of HERO_SKILLS.filter((d) => isGroundTarget(d))) assert.ok((s.aimDist ?? 0) > 0 && (s.aimDist ?? 0) <= (s.range ?? 0), `${s.id}: tầm đặt mặc định (cảm ứng) trong tầm`);
	assert.equal(isSwordSkill(HERO_SKILLS[idx('gale_dash')]!), false, 'Lướt Gió là phép Phong, không ăn phủ phép/hệ số kiếm');
	assert.equal(HERO_SKILLS[idx('rock_throw')]!.unlock, 'earth');
	// Mốc 5 là kỹ năng đặc trưng: mạnh rõ hơn mốc 1 cùng nhánh (một phát), tốn MP hơn.
	for (const [b, t1] of [['fire', 'fire_bolt'], ['water', 'water_lance'], ['wind', 'wind_blade'], ['ice', 'ice_shard'], ['earth', 'rock_throw']] as const) {
		const five = HERO_SKILLS.find((s) => SKILL_NODE[s.id]?.branch === b && SKILL_NODE[s.id]?.tier === 5)!;
		const one = HERO_SKILLS[idx(t1)]!;
		assert.ok(five.power >= one.power * 1.3, `${b} mốc 5 (${five.name} ×${five.power}) mạnh hơn rõ mốc 1 (×${one.power})`);
		assert.ok(five.mpCost > one.mpCost, `${b} mốc 5 tốn MP hơn`);
	}
	assert.deepEqual(skillFacts(HERO_SKILLS[idx('flame_ring')]!), ['Vùng quanh mình, bán kính 110', 'đẩy lùi 50']);
	assert.match(skillFacts(HERO_SKILLS[idx('cyclone')]!)[0]!, /5 nhịp, hút quái/);
	// Mô tả nấc trên bảng Tiềm năng sinh từ số liệu kỹ năng.
	assert.match(TREE.ice[4]!.desc, /Băng Trụ|Cột băng/);
	assert.match(TREE.ice[4]!.desc, /24 MP/);
	assert.equal(TREE.earth[1]!.name, 'Đá Nặng');
	assert.equal(TREE.earth[3]!.name, 'Da Đá');
	// Trần GĐ3: mọi nhánh mốc 9 — 5 nguyên tố (lượt A) + Kiếm 3 lưu phái (lượt B, xem tests/swordstyles.test.ts).
	for (const b of BRANCHES) assert.equal(tierCap(b), 9, `${b}: trần`);
	const ok = () => true;
	assert.equal(knowsSkill(HERO_SKILLS[idx('flame_ring')]!, { fire: 2 }, ok), false);
	assert.equal(knowsSkill(HERO_SKILLS[idx('flame_ring')]!, { fire: 3 }, ok), true);
	assert.equal(knowsSkill(HERO_SKILLS[idx('fire_blast')]!, { fire: 4 }, ok), false);
	assert.equal(knowsSkill(HERO_SKILLS[idx('fire_blast')]!, { fire: 5 }, ok), true);
	assert.equal(knowsSkill(HERO_SKILLS[idx('rock_throw')]!, { earth: 1 }, (u) => u !== 'earth'), false, 'Đá Văng cần mã earth');
	assert.equal(knowsSkill(HERO_SKILLS[idx('quake')]!, { earth: 0 }, ok), false, 'nhánh chưa mở');
	assert.deepEqual(REACTION_PAIR.mud, ['earth', 'water']);
	assert.deepEqual([REACTION_NAME.mud, REACTION_NAME.lava, REACTION_NAME.sandstorm, REACTION_NAME.shatter], ['Bùn Lầy', 'Dung Nham', 'Bão Cát', 'Vỡ Vụn']);
}

// 4) TEMP_ART: mọi kỹ năng GĐ2 có hình tạm; mọi id trỏ tới hiệu ứng CÓ trong atlas; id PixelLab sẽ thay có trong pipeline.
{
	const atlas = JSON.parse(readFileSync(new URL('../../../assets/vfx/vfx.json', import.meta.url), 'utf8')) as { animations: Record<string, string[]>; frames: Record<string, unknown> };
	const pipeline = readFileSync(new URL('../../asset-pipeline/src/vfx/buildVfx.ts', import.meta.url), 'utf8');
	const pipelineIds = new Set([...pipeline.matchAll(/\{\s*id:\s*'([a-z_]+)'/g)].map((m) => m[1]!));
	assert.ok(pipelineIds.has('ice_pillar') && pipelineIds.has('rock_spikes'), 'đọc được danh sách id pipeline');
	for (const s of HERO_SKILLS.slice(7)) {
		const a = TEMP_ART[s.id];
		assert.ok(a, `${s.id}: có hàng TEMP_ART`);
		assert.ok(a.icon && atlas.frames[`vfx/${a.icon}`], `${s.id}: icon tạm ${a.icon} có trong atlas`);
		assert.equal(tempIcon(s.id, (id) => !!atlas.frames[`vfx/${id}`]), a.final && atlas.animations[a.final] ? `${a.final}_3` : a.icon, `${s.id}: icon dùng`);
	}
	for (const key of ['earth_hit', 'react_mud', 'react_lava', 'react_sandstorm', 'react_shatter']) assert.ok(TEMP_ART[key], `có hình tạm ${key}`);
	for (const [key, a] of Object.entries(TEMP_ART)) {
		for (const l of [...a.look, ...(a.charge ?? []), ...(a.shot ? [a.shot] : [])]) assert.ok(atlas.animations[l.id]?.length, `${key}: hình tạm "${l.id}" phải có trong atlas`);
		assert.ok(a.look.length > 0 && a.todo, `${key}: có hình + ghi chú cần vẽ gì`);
		for (const l of [...a.look, ...(a.charge ?? [])]) assert.ok(Number.isInteger(l.scale ?? 1) && Number.isInteger(l.scaleX ?? 1) && Number.isInteger(l.scaleY ?? 1), `${key}: phóng NGUYÊN lần (giữ lưới pixel)`);
		if (a.final) assert.ok(pipelineIds.has(a.final), `${key}: id PixelLab "${a.final}" đã khai ở pipeline`);
	}
	// Đúng các id đã xếp lịch ở kế hoạch 5b.
	assert.deepEqual([TEMP_ART.ice_spire!.final, TEMP_ART.cyclone!.final, TEMP_ART.stone_spikes!.final], ['ice_pillar', 'tornado', 'rock_spikes']);
	assert.equal(tempIcon('ice_spire', (id) => id === 'ice_pillar_0'), 'ice_pillar_3', 'atlas có bản PixelLab → icon tự đổi');
	assert.equal(tempIcon('fire_bolt', () => true), null, 'kỹ năng có hình riêng: không dùng icon tạm');
}

console.log('✔ elements.test (sim): phần luật');

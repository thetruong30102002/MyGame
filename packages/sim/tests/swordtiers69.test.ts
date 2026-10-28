// Phần LUẬT THUẦN tách từ apps/web/tests/swordtiers69.test.ts (11/10/2026, chuẩn bị xoá bản web): chỉ hàm của @havenlord/sim (+ bảng hình
// tạm `UnityGame/Tools~/data/tempArt.ts`). Phần chạy CombatSystem của web bỏ cùng bản web — client Unity có test C# + vector riêng.
// Chạy: npx tsx tests/swordtiers69.test.ts (trong packages/sim) hoặc `npm test -w @havenlord/sim`.
// Chạy: npx tsx tests/swordtiers69.test.ts — GĐ3 lượt B: mốc 6–9 của 3 lưu phái Kiếm (bảng 3.1). Luật thuần (đúng lúc, cộng
// dồn, ngưỡng máu), dữ liệu + mô tả sinh từ số liệu, trần mốc 9 mọi nhánh, và chạy thật trong CombatSystem: Phá Giáp (phá
// giáp + vỡ giáp chồng lên), Thế Áp Đảo (cộng dồn / về 0), Lưỡi Sóng (xuyên, rộng, mang phủ phép), Bất Khuất, Dòng Chảy Ngược
// (gạt đạn), Phản Đòn (cửa sổ né đúng lúc + đỡ đúng lúc), Xoáy Nước (mạnh hơn sau khi đỡ), Mặt Hồ Phẳng, Liên Hoàn, Đà Lướt,
// Phi Kiếm (đi–về không trúng lặp), Bóng Mờ (tỉ lệ bằng chuỗi ngẫu nhiên có hạt giống).
import assert from 'node:assert/strict';
import { armorDamage, COUNTER, lifestealHeal, lowHp, perfectTiming, pressBonus, SUNDER_TAKEN } from '../src/skillRules.ts';
import { estimateText, HERO_SKILLS, isSwordSkill, powerText, skillFacts, type SkillDef } from '../src/skills.ts';
import {
	BRANCHES,
	depthBonus,
	isStyleBranch,
	knowsSkill,
	nextTierCost,
	PASSIVE,
	passiveEffects,
	SKILL_NODE,
	STYLE_OFFSET,
	STYLE_TREE,
	SWORD_STYLES,
	tierCap,
	TREE,
	type SwordStyle,
	type Tiers,
} from '../src/talents.ts';
import { TEMP_ART } from '../../../UnityGame/Tools~/data/tempArt.ts';

const near = (a: number, b: number, what: string, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${what}: ${a} ≠ ${b}`);
const idx = (id: string) => {
	const i = HERO_SKILLS.findIndex((s) => s.id === id);
	assert.ok(i >= 0, `có kỹ năng ${id}`);
	return i;
};
const def = (id: string): SkillDef => HERO_SKILLS[idx(id)]!;
const all = () => true;

/** 6 kỹ năng GĐ3 lượt B: lưu phái, mốc. */
const NEW: Record<string, [SwordStyle, number]> = {
	sunder_strike: ['kiem_than', 6],
	blade_wave: ['kiem_than', 8],
	backflow: ['thuy_than', 6],
	whirlpool: ['thuy_than', 8],
	chain_slash: ['bac_than', 6],
	flying_sword: ['bac_than', 8],
};

// 1) Luật thuần.
{
	assert.deepEqual([COUNTER.perfect, COUNTER.after], [0.12, 2.5]);
	// 0,12s chứ không 0,3s: đà đánh quái 0,3s ≈ i-frame cú lăn 0,32s → cửa sổ 0,3s thì cú né nào gặp đòn cũng "đúng lúc".
	assert.deepEqual([0, 0.06, 0.12, 0.13, 0.3, -0.01].map((t) => perfectTiming('dodge', t)), [true, true, true, false, false, false], 'né đúng lúc: đòn chạm trong 0,12s sau khi bấm né');
	assert.deepEqual([0.05, 0.12, 0.3].map((t) => perfectTiming('stance', t)), [true, true, false], 'Thế Tĩnh: 0,12s đầu của thế');
	assert.deepEqual([0, 0.55].map((t) => perfectTiming('parry', t)), [true, true], 'Lưu Thủy Phản: cả cửa sổ đỡ (vốn ngắn) là đúng lúc');
	near(pressBonus(0, 0.05, 5), 1, 'chưa trúng');
	near(pressBonus(3, 0.05, 5), 1.15, '3 nhát');
	near(pressBonus(9, 0.05, 5), 1.25, 'kẹp 5 lần');
	assert.deepEqual([lowHp(29, 100, 0.3), lowHp(30, 100, 0.3), lowHp(0, 100, 0.3)], [true, false, false], 'Bất Khuất: dưới 30% (gục rồi thì thôi)');
	assert.equal(SUNDER_TAKEN, 1.15);
}

// 2) Dữ liệu: nối CUỐI (chỉ số 38+), đúng lưu phái / mốc, đòn thép, mô tả + tooltip sinh từ số liệu, trần mốc 9 mọi nhánh.
{
	assert.deepEqual(
		HERO_SKILLS.slice(38, 44).map((s) => s.id),
		Object.keys(NEW),
		'nối cuối, không lệch chỉ số cũ',
	);
	for (const [id, [style, tier]] of Object.entries(NEW)) {
		const s = def(id);
		// `tier` theo thang Kiếm cũ; từ 11/10/2026 lưu phái là nhánh riêng: mốc phái = mốc cũ − STYLE_OFFSET.
		const st = tier - STYLE_OFFSET;
		assert.deepEqual(SKILL_NODE[id], { branch: style, tier: st }, `${id}: ${style} mốc ${st} (Kiếm cũ ${tier})`);
		assert.ok(s.element === 'steel' && isSwordSkill(s) && s.anim === 'attack' && !s.key, `${id}: đòn Kiếm thép (ăn phủ phép), động tác vung kiếm sẵn có, vào ô trống`);
		const node = STYLE_TREE[style][tier - 3]!;
		assert.deepEqual([node.skillId, node.kind, node.ready], [id, 'active', true], `${id}: cây lưu phái trỏ đúng`);
		assert.equal(knowsSkill(s, { sword: 2, [style]: st }, all), true, `${id}: đủ mốc là học`);
		assert.equal(knowsSkill(s, { sword: 2, [style]: st - 1 }, all), false, `${id}: chưa đủ mốc`);
		for (const other of SWORD_STYLES.filter((x) => x !== style)) assert.equal(knowsSkill(s, { sword: 2, [other]: 7 }, all), false, `${id}: lưu phái khác không học được`);
		assert.ok(TEMP_ART[id]?.icon && TEMP_ART[id]!.look.length && TEMP_ART[id]!.todo, `${id}: hình tạm + icon tạm + ghi chú cần vẽ`);
	}
	const passives: Record<SwordStyle, [string, string]> = { kiem_than: ['Thế Áp Đảo', 'Bất Khuất'], thuy_than: ['Phản Đòn', 'Mặt Hồ Phẳng'], bac_than: ['Đà Lướt', 'Bóng Mờ'] };
	for (const st of SWORD_STYLES) {
		const t = STYLE_TREE[st];
		assert.deepEqual([t[4]!.name, t[4]!.kind, t[4]!.ready, t[6]!.name, t[6]!.kind, t[6]!.ready], [passives[st][0], 'passive', true, passives[st][1], 'passive', true], `${st}: bị động mốc 7 / 9`);
		assert.equal(t[7]!.ready, false, `${st}: mốc 10 (tuyệt kỹ) vẫn "Sắp có" — GĐ4`);
		assert.ok(['passive', 'active'].includes(t[7]!.kind));
	}
	// Trần mốc Kiếm cũ 9 mọi nhánh (phái: mốc 7); tuyệt kỹ vẫn "Sắp có".
	for (const b of BRANCHES.filter((x) => x !== 'sword')) {
		const top = isStyleBranch(b) ? 9 - STYLE_OFFSET : 9;
		const base: Tiers = isStyleBranch(b) ? { sword: 2 } : {};
		assert.equal(tierCap(b), top, `${b}: trần mốc ${top}`);
		assert.equal(TREE[b][top]!.ready, false, `${b}: tuyệt kỹ sắp có`);
		assert.equal(nextTierCost({ ...base, [b]: top } as Tiers, b, all), null, `${b}: trần thì hết cộng`);
		assert.equal(nextTierCost({ ...base, [b]: top - 1 } as Tiers, b, all), 5, `${b}: mốc cuối giá 5`);
	}
	assert.equal(tierCap('sword'), 2, 'Kiếm chỉ còn Trảm + Nhịp Chém');

	// Mô tả nấc / tooltip sinh từ số liệu.
	const kt = STYLE_TREE.kiem_than;
	const tt = STYLE_TREE.thuy_than;
	const bt = STYLE_TREE.bac_than;
	assert.match(kt[3]!.desc, /phá giáp 6s · quái đang bị phá giáp: vỡ giáp 6s \(nhận thêm 15%\).*uy lực ×2,4 · 10 MP · hồi 6s/);
	assert.match(kt[4]!.desc, /\+5% sát thương đòn Kiếm \(tối đa 5 lần = \+25%\).*3 giây/);
	assert.match(kt[5]!.desc, /Luồng kiếm bay xa 440, xuyên mục tiêu · uy lực ×3 · 18 MP · hồi 8s/);
	assert.match(kt[6]!.desc, /Dưới 30% máu: công \+20%, hút máu 5%/);
	assert.match(tt[3]!.desc, /Gạt đạn 2,5s: đạn quái bay tới gần bị chém bay ngược về kẻ bắn · đạn phản ×2 · 10 MP · hồi 8s/);
	assert.match(tt[4]!.desc, /trong 0,12 giây sau khi bấm né.*chắc chắn chí mạng.*×1,6/);
	assert.match(tt[6]!.desc, /tối đa một lần mỗi 1 giây/, 'Mặt Hồ Phẳng: ghi hồi nội');
	assert.match(tt[5]!.desc, /Xoáy chém tại chỗ nhắm \(tầm 300\), bán kính 110 · vừa đỡ \/ gạt \/ phản đòn \(trong 2,5s\): mạnh thêm ×1,8 · đẩy lùi 60 · uy lực ×1,9/);
	assert.match(tt[6]!.desc, /hồi 5% máu tối đa/);
	assert.match(bt[3]!.desc, /Chuỗi 4 nhát chém, tầm 80, góc 130° · uy lực ×0,8 mỗi nhát · 10 MP · hồi 5s/);
	assert.match(bt[4]!.desc, /Né xong, 3 đòn Kiếm kế \(trong 3 giây\) nhanh hơn 25%/);
	assert.match(bt[5]!.desc, /Phóng kiếm bay xa 320, xuyên mục tiêu rồi bay về tay.*uy lực ×1,8 mỗi lượt \(đi \+ về\)/);
	assert.match(bt[6]!.desc, /15% né hoàn toàn một đòn/);
	assert.equal(powerText(def('chain_slash')), 'uy lực ×0,8 mỗi nhát');
	assert.equal(powerText(def('slash')), 'uy lực ×1,97', 'Trảm: uy lực theo nhịp chém mới (0,6 s)');
	assert.deepEqual(skillFacts(def('slash')), [], 'Trảm giữ tooltip cũ');
	assert.equal(estimateText(def('chain_slash'), 10), '≈ 10 mỗi nhát × 4');
	assert.equal(estimateText(def('flying_sword'), 23), '≈ 23 mỗi lượt × 2 (đi + về)');
	assert.equal(estimateText(def('whirlpool'), 30), '≈ 30 sát thương (vừa đỡ đòn: ≈ 54)');
	assert.equal(estimateText(def('blade_wave'), 48), '≈ 48 sát thương');
	assert.equal(estimateText(def('backflow'), 32), 'đạn phản ≈ 32');
	assert.match(skillFacts(def('ice_mirror'))[0]!, /^Khiên 4s/, 'Gương Băng (phép) giữ chữ cũ');

	// Tự cân: mốc 8 của lưu phái mạnh hơn mốc 5 trên MỘT mục tiêu (Ảnh Bộ tính chí mạng chắc chắn; Xoáy Nước tính lúc vừa đỡ;
	// Phi Kiếm trúng cả đi lẫn về), tốn MP hơn, hồi chiêu dài hơn; mốc 6 nhẹ hơn mốc 8.
	const perTarget = (s: SkillDef) => s.power * (s.crit && s.crit >= 1 ? 1.75 : 1) * (s.afterGuard ?? 1) * (s.returns ? 2 : 1) * (s.count && s.kind === 'melee' ? s.count : 1);
	const five: Record<SwordStyle, string> = { kiem_than: 'pierce_rush', thuy_than: 'flowing_counter', bac_than: 'shadow_step' };
	for (const st of SWORD_STYLES) {
		const s5 = def(five[st]);
		const s6 = HERO_SKILLS.find((s) => SKILL_NODE[s.id]?.branch === st && SKILL_NODE[s.id]?.tier === 6 - STYLE_OFFSET)!;
		const s8 = HERO_SKILLS.find((s) => SKILL_NODE[s.id]?.branch === st && SKILL_NODE[s.id]?.tier === 8 - STYLE_OFFSET)!;
		assert.ok(perTarget(s8) >= perTarget(s5), `${st}: ${s8.name} (×${perTarget(s8).toFixed(2)}) ≥ ${s5.name} (×${perTarget(s5).toFixed(2)})`);
		assert.ok(s8.mpCost > s5.mpCost && s8.cooldown > s5.cooldown, `${st}: mốc 8 tốn MP + hồi lâu hơn mốc 5`);
		assert.ok(s6.mpCost < s8.mpCost && s6.cooldown <= s8.cooldown, `${st}: mốc 6 nhẹ hơn mốc 8`);
	}

	// Bị động theo lưu phái + mốc.
	const fx = (tier: number, style: SwordStyle | null) => passiveEffects(style ? { sword: 2, [style]: tier - STYLE_OFFSET } : { sword: 2 });
	const flags = (e: ReturnType<typeof fx>) => [e.press, e.rage, e.riposte, e.lake, e.momentum, e.evade];
	assert.deepEqual(flags(fx(6, 'kiem_than')), [false, false, false, false, false, 0], 'mốc 6: chưa có bị động 7/9');
	assert.deepEqual(flags(fx(7, 'kiem_than')), [true, false, false, false, false, 0], 'Kiếm Thần 7: Thế Áp Đảo');
	assert.deepEqual(flags(fx(9, 'kiem_than')), [true, true, false, false, false, 0], 'Kiếm Thần 9: + Bất Khuất');
	assert.deepEqual(flags(fx(9, 'thuy_than')), [false, false, true, true, false, 0], 'Thủy Thần 9: Phản Đòn + Mặt Hồ Phẳng');
	assert.deepEqual(flags(fx(8, 'bac_than')), [false, false, false, false, true, 0], 'Bắc Thần 8: Đà Lướt');
	assert.deepEqual(flags(fx(9, 'bac_than')), [false, false, false, false, true, PASSIVE.evade], 'Bắc Thần 9: + Bóng Mờ');
	assert.deepEqual(flags(fx(9, null)), [false, false, false, false, false, 0], 'chưa có lưu phái: không có gì');
	assert.deepEqual([PASSIVE.pressStep, PASSIVE.pressMax, PASSIVE.rageHp, PASSIVE.rageAtk, PASSIVE.rageDrain, PASSIVE.lakeHeal, PASSIVE.momentumHits, PASSIVE.momentumSpeed, PASSIVE.evade], [0.05, 5, 0.3, 1.2, 0.05, 0.05, 3, 1.25, 0.15], 'đúng bảng 3.1');
}

console.log('✔ swordtiers69.test (sim): phần luật');

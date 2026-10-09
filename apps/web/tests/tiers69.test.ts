// Chạy: npx tsx tests/tiers69.test.ts — GĐ3 cây Nguyên tố: mốc 6–9 của 5 nguyên tố (bảng 3.2). Hàm thuần (tường, sét chọn
// quái ướt, điểm rơi, chậm, trượt, bị động) + chạy thật trong CombatSystem: tường chặn đi / đạn + hết hạn, Tường Lửa đốt,
// Tường Đá hất, Gương Băng phản đạn, Gọi Mưa ướt liên tục + Lôi Vũ (sét ưu tiên quái ướt, dày gấp đôi trong mưa) + Mạch
// Nguồn, Vòi Rồng đi + cuốn, Phong Bạo 3 lưỡi, Thiên Thạch, Mưa Băng / Lở Đá nhiều điểm, Tro Tàn dây chuyền có giới hạn,
// mọi bị động mốc 7/9, Núi Thiêng đổi máu tối đa, TEMP_ART + tự dùng bản PixelLab khi atlas có.
import assert from 'node:assert/strict';
import {
	addSlow,
	aimVelocity,
	BOSS_FREEZE_IMMUNE,
	canFreeze,
	detourSide,
	detourWaypoint,
	GROUND_SQUASH,
	inCircle,
	lifestealHeal,
	missChance,
	pickBolts,
	scatterPoints,
	segmentsCross,
	THUNDER,
	thunderBolts,
	wallBetween,
	wallBlocks,
	wallClip,
	wallEnds,
	type WallSeg,
} from '../src/game/combat/skillRules';
import { estimateText, HERO_SKILLS, isGroundTarget, powerText, skillFacts, type SkillDef } from '../src/game/combat/skills';
import { defaultLoadout, knowsSkill, PASSIVE, passiveEffects, placeSkill, SKILL_NODE, TREE, type Branch } from '../src/game/combat/talents';
import { TEMP_ART } from '../src/game/combat/tempArt';

const near = (a: number, b: number, what: string, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${what}: ${a} ≠ ${b}`);
const idx = (id: string) => {
	const i = HERO_SKILLS.findIndex((s) => s.id === id);
	assert.ok(i >= 0, `có kỹ năng ${id}`);
	return i;
};
const def = (id: string): SkillDef => HERO_SKILLS[idx(id)]!;

/** 10 kỹ năng GĐ3: nhánh, mốc, kiểu đòn. */
const NEW: Record<string, [Branch, number, SkillDef['kind']]> = {
	fire_wall: ['fire', 6, 'wall'],
	meteor: ['fire', 8, 'aoe_target'],
	call_rain: ['water', 6, 'zone'],
	thunder_rain: ['water', 8, 'zone'],
	gale_fan: ['wind', 6, 'projectile'],
	tornado: ['wind', 8, 'zone'],
	ice_mirror: ['ice', 6, 'ward'],
	ice_rain: ['ice', 8, 'barrage'],
	stone_wall: ['earth', 6, 'wall'],
	rockslide: ['earth', 8, 'barrage'],
};

// 1) Tường thuần: dựng vuông góc hướng nhắm TRÊN MẶT ĐẤT, cắt đoạn, chặn bước đi (trượt dọc tường), chắn giữa hai điểm.
{
	// Nhắm xuống (nam): tường nằm ngang đủ dài; nhắm ngang (đông): tường dựng dọc, ngắn lại theo phối cảnh 0,62.
	const s = wallEnds(100, 200, 0, 1, 80);
	near(Math.abs(s.ax - s.bx), 160, 'nhắm xuống: dài 160 ngang');
	near(s.ay, 200, 'nằm ngang (ay)');
	near(s.by, 200, 'nằm ngang (by)');
	const e = wallEnds(100, 200, 1, 0, 80);
	near(e.ax, 100, 'nhắm ngang: dựng dọc');
	near(Math.abs(e.ay - e.by), 160 * GROUND_SQUASH, 'dọc: ngắn theo phối cảnh');
	near((e.ay + e.by) / 2, 200, 'tâm tường đúng điểm nhắm');
	assert.equal(segmentsCross(0, 0, 10, 10, 0, 10, 10, 0), true, 'chéo nhau');
	assert.equal(segmentsCross(0, 0, 4, 4, 6, 6, 10, 10), false, 'thẳng hàng không chồng');
	assert.equal(segmentsCross(0, 0, 10, 0, 5, 1, 5, 9), false, 'không chạm');
	assert.equal(segmentsCross(0, 5, 10, 5, 5, 5, 5, 9), true, 'chạm mút');

	const wall = { ax: 0, ay: 100, bx: 200, by: 100, half: 10 };
	// Đi thẳng xuống tường từ trên: dừng ở mép (nửa bề dày + bề ngang thân), không qua.
	let st = wallClip(100, 60, 0, 50, [wall], 14);
	near(60 + st.dy, 100 - 24, 'dừng sát mép trên');
	near(st.dx, 0, 'không có phần dọc tường');
	// Đi chéo: giữ phần dọc tường → trượt.
	st = wallClip(100, 76, 8, 8, [wall], 14);
	assert.deepEqual([Math.round(st.dx * 1e6) / 1e6, Math.round(st.dy * 1e6) / 1e6], [8, 0], 'đang sát mép: chỉ trượt dọc tường');
	// Ngoài đầu tường: tự do.
	assert.deepEqual(wallClip(260, 60, 0, 80, [wall], 14), { dx: 0, dy: 80 }, 'vòng qua đầu tường');
	// Bước nhỏ không chạm dải: giữ nguyên.
	assert.deepEqual(wallClip(100, 40, 3, 4, [wall], 14), { dx: 3, dy: 4 });
	// Đứng sẵn trong dải (tường dựng đè lên): đi ra được, không vượt đường tâm.
	assert.deepEqual(wallClip(100, 95, 0, -20, [wall], 14), { dx: 0, dy: -20 }, 'trong dải: đi ra phía mình được');
	st = wallClip(100, 95, 5, 20, [wall], 14);
	near(st.dy, 0, 'trong dải: không vượt đường tâm');
	near(st.dx, 5, 'trong dải: vẫn trượt dọc');
	// Nhiều bước nhỏ lao thẳng vào tường không bao giờ qua được.
	let y = 0;
	for (let i = 0; i < 200; i += 1) y += wallClip(100, y, 0, 3, [wall], 14).dy;
	near(y, 76, 'dồn mãi vẫn đứng ở mép', 1e-6);
	assert.equal(wallBetween(100, 50, 100, 150, [wall]), true, 'tường chắn giữa');
	assert.equal(wallBetween(250, 50, 250, 150, [wall]), false, 'đi vòng ngoài đầu tường');
	assert.equal(wallBetween(100, 50, 100, 90, [wall]), false, 'chưa tới tường');

	// Đường vòng: tường có chắn đường thẳng (đúng vùng `wallClip` chặn — dải nới bề ngang thân, cả hai đầu) không.
	assert.equal(wallBlocks(100, 60, 100, 150, wall, 14), true, 'đi thẳng qua tường: bị chắn');
	assert.equal(wallBlocks(250, 60, 250, 150, wall, 14), false, 'ngoài đầu tường: không');
	assert.equal(wallBlocks(100, 76, 300, 76, wall, 14), false, 'đi sát dọc mép (không lấn vào dải): không');
	assert.equal(wallBlocks(100, 60, 100, 90, wall, 14), false, 'đích đứng trong dải nhưng phía mình: không');
	assert.equal(wallBlocks(100, 60, 100, 110, wall, 14), true, 'đích đứng trong dải phía bên kia: bị chắn');
	assert.equal(wallBlocks(224 + 2, 76, 100, 160, wall, 14), true, 'đứng ngay đầu tường mà nhắm về giữa phía bên kia: đường cắt góc dải → vẫn chắn');
	assert.deepEqual([detourSide(130, 160, 100, 0, wall, 14), detourSide(60, 160, 100, 0, wall, 14)], [1, -1], 'vòng qua đầu gần hơn');
	// Hai góc: chưa qua đầu tường → góc phía MÌNH (cách dải 6px); qua rồi → góc phía ĐÍCH.
	assert.deepEqual(detourWaypoint(150, 130, 100, 0, wall, 14, 1), { x: 230, y: 130 }, 'tới góc phía mình');
	assert.deepEqual(detourWaypoint(230, 130, 100, 0, wall, 14, 1), { x: 230, y: 70 }, 'qua đầu tường: tới góc phía đích');

	// Ca của review: tường dựng tại (0, 110) dài 200 (nhắm thẳng xuống), người chơi (0, 0) đứng sau GIỮA tường, quái tốc 58
	// đuổi từ 4 chỗ. Trước đây (chỉ `wallClip`) cả 4 kẹt ở mặt tường y = 134. Mô phỏng đúng vòng đuổi của CombatSystem.
	const w2: WallSeg = { ...wallEnds(0, 110, 0, 1, 100), half: 10 };
	for (const start of [
		{ x: 30, y: 200 },
		{ x: 0, y: 200 },
		{ x: -60, y: 200 },
		{ x: 80, y: 180 },
	]) {
		const q = { ...start };
		let route: { dir: 1 | -1 } | null = null;
		let crossed = -1;
		for (let i = 0; i < 60 * 7; i += 1) {
			const blocked = wallBlocks(q.x, q.y, 0, 0, w2, 14);
			if (!blocked) route = null;
			else route ??= { dir: detourSide(q.x, q.y, 0, 0, w2, 14) };
			const to = route ? detourWaypoint(q.x, q.y, 0, 0, w2, 14, route.dir) : { x: 0, y: 0 };
			const d = Math.hypot(to.x - q.x, to.y - q.y);
			const step = Math.min(d, 58 / 60);
			if (d < 1e-6) break;
			const st = wallClip(q.x, q.y, ((to.x - q.x) / d) * step, ((to.y - q.y) / d) * step, [w2], 14);
			q.x += st.dx;
			q.y += st.dy;
			// Không lấn vào dải dọc thân tường (hai đầu tường hở tới đường tâm như `wallClip` — thân quái chạm mép đầu tường được).
			assert.ok(!(Math.abs(q.y - 110) < 24 - 1e-6 && q.x > -100 && q.x < 100), `(${start.x}, ${start.y}): không lấn vào dải tường (${q.x.toFixed(1)}, ${q.y.toFixed(1)})`);
			if (crossed < 0 && q.y < 86) crossed = i / 60;
		}
		assert.ok(crossed >= 0 && crossed < 6, `(${start.x}, ${start.y}): vòng qua đầu tường sang phía người chơi sau ${crossed.toFixed(2)}s`);
		assert.equal(wallBetween(q.x, q.y, 0, 0, [w2]), false, 'hết bị tường chắn');
	}
}

// 2) Sét, điểm rơi, chậm, trượt, vận tốc phản.
{
	assert.deepEqual([thunderBolts(false), thunderBolts(true)], [THUNDER.bolts, THUNDER.rainBolts]);
	assert.deepEqual([THUNDER.bolts, THUNDER.rainBolts], [2, 4], 'trong mưa của mình: sét dày gấp đôi');
	const t = [
		{ x: 0, y: 0, wet: false },
		{ x: 50, y: 0, wet: true },
		{ x: 10, y: 0, wet: true },
		{ x: 90, y: 0, wet: true },
		{ x: 5, y: 0, wet: false },
	];
	assert.deepEqual(pickBolts(t, 0, 0, 2), [2, 1], 'quái ướt trước, gần tâm trước — quái khô gần hơn chờ');
	assert.deepEqual(pickBolts(t, 0, 0, 4), [2, 1, 3, 0], 'hết quái ướt: tia dư sang quái khô gần tâm');
	assert.deepEqual(pickBolts(t, 0, 0, 9), [2, 1, 3, 0, 4], 'mỗi quái tối đa một tia mỗi nhịp');
	assert.deepEqual(pickBolts(t.map((x) => ({ ...x, wet: false })), 0, 0, 2), [0, 4], 'không quái ướt: đủ tia vào quái khô gần tâm nhất (không dồn một con)');
	assert.deepEqual(pickBolts([], 0, 0, 4), []);
	// Nhịp sau: con ít bị sét đánh hơn được ưu tiên — sét rải khắp bầy ướt thay vì dồn vào vài con gần tâm.
	assert.deepEqual(pickBolts(t.map((x, i) => ({ ...x, struck: i === 2 || i === 1 ? 1 : 0 })), 0, 0, 2), [3, 0], 'ít bị đánh trước (ướt trước), rồi gần tâm');
	assert.deepEqual(pickBolts(t.map((x) => ({ ...x, struck: 1 })), 0, 0, 2), [2, 1], 'cùng số lần: quái ướt trước');
	// Theo khoảng cách TRÊN ĐẤT (dọc bị ép 0,62): quái lệch dọc 40px xa hơn quái lệch ngang 60px.
	assert.deepEqual(pickBolts([{ x: 0, y: 40, wet: true }, { x: 60, y: 0, wet: true }], 0, 0, 1), [1]);

	const pts = scatterPoints(20, 150);
	assert.equal(pts.length, 20);
	assert.deepEqual(scatterPoints(20, 150), pts, 'cố định (không ngẫu nhiên)');
	for (const p of pts) assert.ok(inCircle(p.x, p.y, 0, 0, 150), `điểm rơi trong vùng (${p.x}, ${p.y})`);
	assert.equal(new Set(pts.map((p) => `${p.x},${p.y}`)).size, 20, 'không trùng điểm');
	const inner = pts.filter((p) => inCircle(p.x, p.y, 0, 0, 75)).length;
	assert.ok(inner >= 4 && inner <= 6, `phủ đều: 1/4 diện tích trong → ${inner}/20 điểm`);
	const gap = pts.slice(1).reduce((a, p, i) => a + Math.hypot(p.x - pts[i]!.x, p.y - pts[i]!.y), 0) / 19;
	assert.ok(gap > 80, `viên sau rơi xa viên trước (trung bình ${gap.toFixed(0)}px) — không xoáy dần từ tâm`);

	const mud = { slow: 3, slowMult: 0.3 };
	addSlow(mud, 2, 0.8);
	assert.deepEqual(mud, { slow: 3, slowMult: 0.3 }, 'Trọng Lực không đè Bùn Lầy');
	const same = { slow: 1, slowMult: 0.8 };
	addSlow(same, 2, 0.8);
	assert.deepEqual(same, { slow: 2, slowMult: 0.8 }, 'cùng mức: lấy thời lượng dài hơn');
	const weak = { slow: 4, slowMult: 0.9 };
	addSlow(weak, 2, 0.8);
	assert.deepEqual(weak, { slow: 2, slowMult: 0.8 }, 'mức yếu hơn thì thay');
	const none: { slow?: number; slowMult?: number } = {};
	addSlow(none, 2, 0.8);
	assert.deepEqual(none, { slow: 2, slowMult: 0.8 });

	assert.equal(missChance({ miss: 0, daze: 0 }, 0.4, 0.2), 0);
	assert.equal(missChance({ daze: 1 }, 0.4, 0.2), 0.2, 'Gió Loạn 20%');
	assert.equal(missChance({ miss: 1, daze: 1 }, 0.4, 0.2), 0.4, 'dính cả hai: lấy mức cao hơn');
	assert.deepEqual(aimVelocity(0, 0, 30, 40, 100), { vx: 60, vy: 80 });
}

// 3) Dữ liệu: 10 kỹ năng đúng nhánh / mốc / kiểu, nối cuối; số liệu tự cân so với mốc 3/5; mô tả sinh từ số liệu.
{
	for (const [id, [branch, tier, kind]] of Object.entries(NEW)) {
		assert.deepEqual(SKILL_NODE[id], { branch, tier }, `${id}: nhánh + mốc`);
		assert.equal(def(id).kind, kind, `${id}: kiểu đòn`);
		assert.ok(idx(id) >= 28, `${id}: nối CUỐI (chỉ số ${idx(id)}), không lệch chỉ số cũ`);
		assert.equal(TREE[branch][tier - 1]!.skillId, id, `${id}: cây trỏ đúng`);
		assert.equal(TREE[branch][tier - 1]!.ready, true);
		assert.equal(def(id).element, branch, `${id}: hệ = nhánh`);
		assert.ok(def(id).anim === 'cast', `${id}: động tác niệm phép có sẵn`);
		const ok = () => true;
		assert.equal(knowsSkill(def(id), { [branch]: tier - 1 }, ok), false, `${id}: chưa đủ mốc`);
		assert.equal(knowsSkill(def(id), { [branch]: tier }, ok), true, `${id}: đủ mốc là học`);
	}
	// Bị động mốc 7/9 đã hiện thực, đúng tên bảng 3.2.
	const passives: Record<Exclude<Branch, 'sword'>, [string, string]> = {
		fire: ['Tro Tàn', 'Hoả Thân'],
		water: ['Mạch Nguồn', 'Thuỷ Triều Dâng'],
		wind: ['Mắt Bão', 'Gió Loạn'],
		ice: ['Hàn Tâm', 'Vỡ Vụn'],
		earth: ['Trọng Lực', 'Núi Thiêng'],
	};
	for (const [b, [p7, p9]] of Object.entries(passives) as [Exclude<Branch, 'sword'>, [string, string]][]) {
		assert.deepEqual([TREE[b][6]!.name, TREE[b][6]!.kind, TREE[b][6]!.ready], [p7, 'passive', true], `${b} mốc 7`);
		assert.deepEqual([TREE[b][8]!.name, TREE[b][8]!.kind, TREE[b][8]!.ready], [p9, 'passive', true], `${b} mốc 9`);
		assert.equal(TREE[b][9]!.ready, false, `${b} mốc 10 (tuyệt kỹ) vẫn "Sắp có"`);
	}
	assert.equal(TREE.sword.filter((n) => n.ready).length, 9, 'Kiếm cũng tới mốc 9 (GĐ3 lượt B — 3 lưu phái, xem swordstyles.test)');
	// Mô tả nấc sinh từ số liệu.
	assert.match(TREE.fire[5]!.desc, /Tường dài 160.*đốt quái áp sát.*uy lực ×0,25 mỗi nhịp đốt · 18 MP · hồi 10s/);
	assert.match(TREE.water[5]!.desc, /không gây sát thương/);
	assert.match(TREE.water[7]!.desc, /6 nhịp × 2 tia sét \(4 nếu mây trong mưa của mình\).*mỗi tia sét/);
	assert.match(TREE.wind[7]!.desc, /Lốc đi theo hướng nhắm 385px trong 3,5s.*10 nhịp/);
	assert.match(TREE.wind[5]!.desc, /3 lưỡi toả quạt 36°.*mỗi lưỡi/);
	assert.match(TREE.ice[5]!.desc, /Khiên 4s.*đạn phản ×1,6/);
	assert.match(TREE.ice[7]!.desc, /20 viên rơi rải trong 1,8s.*mỗi viên/);
	assert.match(TREE.earth[7]!.desc, /choáng 0,5s/);
	assert.match(TREE.fire[7]!.desc, /Rơi từ trời.*sau 0,8s, bán kính 150/);
	assert.match(TREE.fire[6]!.desc, /tối đa 4 đợt/);
	assert.match(TREE.earth[8]!.desc, /Máu tối đa \+15%.*2% máu tối đa/);
	assert.match(TREE.wind[6]!.desc, /50%.*\+15%.*2 giây/);
	assert.equal(powerText(def('call_rain')), 'không gây sát thương');
	assert.equal(powerText(def('cyclone')), 'uy lực ×0,32 mỗi nhịp', 'kỹ năng cũ giữ nguyên chữ');
	assert.equal(powerText(def('heal')), 'hồi 35% máu tối đa');
	assert.equal(estimateText(def('rockslide'), 20), '≈ 20 mỗi viên × 12');
	assert.equal(estimateText(def('gale_fan'), 19), '≈ 19 mỗi lưỡi × 3');
	assert.equal(estimateText(def('thunder_rain'), 12), '≈ 12 mỗi tia × 6 nhịp');
	assert.equal(estimateText(def('fire_wall'), 4), '≈ 4 mỗi nhịp đốt × 10');
	assert.equal(estimateText(def('stone_wall'), 17), '≈ 17 lúc đá trồi');
	assert.equal(estimateText(def('ice_mirror'), 25), 'đạn phản ≈ 25');
	assert.equal(estimateText(def('cyclone'), 5), '≈ 5 mỗi nhịp × 5', 'kỹ năng cũ giữ nguyên');
	assert.equal(estimateText(def('fire_bolt'), 22), '≈ 22 sát thương');
	assert.ok(skillFacts(def('tornado'))[0]!.includes('cuốn quái'));
	assert.equal(isGroundTarget(def('tornado')), false, 'Vòi Rồng chỉ cần hướng');
	assert.equal(isGroundTarget(def('ice_mirror')), false);

	// Tự cân: uy lực lên MỘT mục tiêu đứng trong vùng (ước lượng). Mốc 8 mạnh rõ hơn mốc 5 (≥ ×1,15), vùng rộng hơn, hồi
	// chiêu dài hơn, MP nhiều hơn; mốc 6 thiên khống chế: MP / hồi chiêu ở giữa.
	const perTarget = (s: SkillDef): number => {
		if (s.kind === 'barrage') return (s.count ?? 0) * Math.min(1, ((s.width ?? 0) + 14) ** 2 / (s.radius ?? 1) ** 2) * s.power;
		if (s.kind === 'zone') return Math.round((s.duration ?? 0) / (s.tick ?? 1)) * s.power;
		return s.power;
	};
	const five: Record<Exclude<Branch, 'sword'>, string> = { fire: 'fire_blast', water: 'tidal_wave', wind: 'gale_dash', ice: 'ice_spire', earth: 'stone_spikes' };
	for (const [b, id5] of Object.entries(five) as [Exclude<Branch, 'sword'>, string][]) {
		const s5 = def(id5);
		const s8 = HERO_SKILLS.find((s) => SKILL_NODE[s.id]?.branch === b && SKILL_NODE[s.id]?.tier === 8)!;
		const s6 = HERO_SKILLS.find((s) => SKILL_NODE[s.id]?.branch === b && SKILL_NODE[s.id]?.tier === 6)!;
		assert.ok(perTarget(s8) >= perTarget(s5) * 1.15, `${b}: ${s8.name} (≈×${perTarget(s8).toFixed(2)}/mục tiêu) mạnh rõ hơn ${s5.name} (×${perTarget(s5).toFixed(2)})`);
		assert.ok(s8.cooldown > s5.cooldown && s8.cooldown >= 14, `${b}: mốc 8 hồi chiêu dài hơn`);
		assert.ok(s8.mpCost > s5.mpCost && s8.mpCost >= 30, `${b}: mốc 8 tốn MP hơn`);
		assert.ok(s6.mpCost < s8.mpCost && s6.cooldown < s8.cooldown, `${b}: mốc 6 nhẹ hơn mốc 8`);
		// Diện tích mặt đất đòn phủ được (đơn vị đất): vùng tròn, nón, dải thẳng / vệt lướt, lốc đi theo hướng.
		const area = (s: SkillDef): number => {
			const r = s.radius ?? 0;
			if (s.kind === 'cone') return ((s.angle ?? 0) / 180) * Math.PI * (s.range ?? 0) ** 2;
			if (s.kind === 'line' || s.kind === 'dash') return (s.range ?? 0) * (s.width ?? 0) * 2;
			if (s.kind === 'zone' && s.move) return Math.PI * r * r + 2 * r * s.move * (s.duration ?? 0);
			return Math.PI * r * r;
		};
		assert.ok(area(s8) >= area(s5) * 2, `${b}: mốc 8 phủ rộng hơn hẳn (${Math.round(area(s8))} so với ${Math.round(area(s5))})`);
	}

	// Gán được vào 10 ô: học xong tự lên ô trống, giữ ô cũ.
	const lo = defaultLoadout(['slash', 'aether_bolt', 'fire_bolt']);
	const lo2 = placeSkill(placeSkill(lo, 'meteor'), 'fire_wall');
	assert.deepEqual(lo2.slice(0, 5), ['slash', 'aether_bolt', 'fire_bolt', 'meteor', 'fire_wall']);
}

// 4) Bị động mốc 7 / 9 (thuần).
{
	const six = passiveEffects({ fire: 6, water: 6, wind: 6, ice: 6, earth: 6 });
	assert.deepEqual(
		[six.ember, six.burnDamage, six.spring, six.wetTaken, six.dodgeHaste, six.gust, six.freeze, six.frozenTaken, six.gravity, six.hpMax, six.mountain, six.fireResist],
		[false, 1, false, 1, 1, false, 1, 1, false, 1, false, false],
		'mốc 6: chưa có bị động 7/9',
	);
	near(six.lifesteal, PASSIVE.lifesteal, 'mốc 6 vẫn Huyết Thuỷ 5%');
	const seven = passiveEffects({ fire: 7, water: 7, wind: 7, ice: 7, earth: 7 });
	assert.deepEqual([seven.ember, seven.spring, seven.dodgeHaste, seven.freeze, seven.gravity], [true, true, PASSIVE.eyeHaste, PASSIVE.deepFreeze, true], 'mốc 7');
	assert.deepEqual([seven.burnDamage, seven.wetTaken, seven.gust, seven.frozenTaken, seven.hpMax], [1, 1, false, 1, 1], 'mốc 7 chưa có mốc 9');
	near(seven.dodgeCost, PASSIVE.eyeDodge, 'Mắt Bão: né tốn 50%');
	near(passiveEffects({ sword: 4, wind: 7 }, 'bac_than').dodgeCost, Math.min(PASSIVE.swiftDodge, PASSIVE.eyeDodge), 'Nhẹ Như Gió + Mắt Bão: lấy mức rẻ hơn (50%), không nhân chồng');
	near(passiveEffects({ sword: 4, wind: 6 }, 'bac_than').dodgeCost, PASSIVE.swiftDodge, 'chỉ Nhẹ Như Gió: 70%');
	assert.equal(PASSIVE.shardChain, 1, 'vụn băng Đóng Băng lan tối đa 1 đợt');
	assert.deepEqual([BOSS_FREEZE_IMMUNE, canFreeze({ freeze: 0 }), canFreeze({ boss: true, freeze: 0.1 }), canFreeze({ boss: true, freeze: 0, freezeImmune: 1 }), canFreeze({ boss: true, freeze: 0, freezeImmune: 0 }), canFreeze({ freeze: 1 })], [3, true, false, false, true, true], 'boss: đang băng / còn kháng băng thì không đóng băng lại; quái thường thì được');
	assert.equal(lifestealHeal(5, 0.12), 1, 'hút máu trên máu THẬT mất');
	const nine = passiveEffects({ fire: 9, water: 9, wind: 9, ice: 9, earth: 9 });
	assert.deepEqual(
		[nine.burnDamage, nine.fireResist, nine.lifesteal, nine.wetTaken, nine.gust, nine.frozenTaken, nine.hpMax, nine.mountain],
		[1.5, true, 0.12, 1.15, true, 1.4, 1.15, true],
		'mốc 9: Hoả Thân, Thuỷ Triều Dâng (hút 12% thay 5%), Gió Loạn, Vỡ Vụn, Núi Thiêng',
	);
	assert.deepEqual([PASSIVE.emberChain, PASSIVE.gustMiss, PASSIVE.gravitySlow, PASSIVE.gravityStunned, PASSIVE.springHp, PASSIVE.springMp], [4, 0.2, 0.8, 1.2, 0.03, 4]);
}

// 5) TEMP_ART: 10 kỹ năng + 5 hình bị động; id PixelLab sẽ thay đúng bảng 5b.
{
	for (const id of Object.keys(NEW)) {
		const a = TEMP_ART[id];
		assert.ok(a && a.icon && a.look.length && a.todo, `${id}: có hình tạm + icon + ghi chú cần vẽ`);
	}
	for (const key of ['ember_burst', 'shatter_burst', 'spring_heal', 'mountain_heal', 'eye_haste']) assert.ok(TEMP_ART[key]?.look.length, `hình tạm bị động ${key}`);
	assert.deepEqual(
		['meteor', 'call_rain', 'thunder_rain', 'tornado', 'ice_rain'].map((id) => TEMP_ART[id]!.final),
		['meteor', 'rain_cloud', 'lightning_strike', 'tornado', 'ice_rain'],
		'atlas có bản PixelLab thì tự dùng (id khai ở buildVfx.ts)',
	);
	for (const id of ['meteor', 'ice_rain', 'rockslide', 'ice_mirror']) assert.ok(TEMP_ART[id]!.shot, `${id}: có hình vật rơi / đạn phản`);
	assert.ok(TEMP_ART.call_rain!.tick?.length, 'Gọi Mưa: hình mỗi nhịp (nước bắn)');
	assert.ok(TEMP_ART.stone_wall!.look.some((l) => l.stay) && TEMP_ART.fire_wall!.look.some((l) => l.loop), 'tường: lớp đứng yên / lặp suốt thời gian');
}

// 6) Trong trận.
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
type Textures = import('../src/game/assets/AssetManifest').CharacterTextures;
type Dir = import('../src/game/assets/AssetManifest').Direction;
type Fighter = import('../src/game/combat/CombatSystem').Fighter;
type Tiers = import('../src/game/combat/talents').Tiers;

const DIRS: Dir[] = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'];
const strip = (n: number) => Array.from({ length: n }, () => new Texture());
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

type St = { burn: number; wet: number; chill: number; freeze: number; boss?: boolean };
interface Internals {
	dummies: { wet: number; daze: number }[];
	projectiles: { damage: number; ghost?: boolean; team: string; element: string; x: number; y: number; vx: number; vy: number }[];
	pending: unknown[];
	zones: { x: number; y: number; rain: boolean }[];
	walls: { ax: number; ay: number; bx: number; by: number }[];
	react(t: St, element: string, x: number, y: number): { mult: number; reaction: { id: string } | null };
	hit(f: Fighter, base: number, element: string, kx: number, ky: number): void;
	fire(o: { ghost?: boolean }): void;
	hurtPlayer(amount: number): void;
	strike(f: Fighter, dist: number): void;
	enemyShot(f: Fighter, nx: number, ny: number): void;
}
type Play = { id: string; x: number; y: number; scale?: number; duration?: number; tint?: number; stay?: boolean };

function setup(o: { dummy?: { x: number; y: number }; tiers?: Tiers; have?: string[] } = {}) {
	const hits: string[] = [];
	const plays: Play[] = [];
	const floats: string[] = [];
	const have = new Set(o.have ?? []);
	const vfx = {
		ground: new Container(),
		top: new Container(),
		play: (id: string, x: number, y: number, opt?: { scale?: number; duration?: number; tint?: number; stay?: boolean }) =>
			void plays.push({ id, x, y, scale: opt?.scale, duration: opt?.duration, tint: opt?.tint, stay: opt?.stay }),
		frames: (id: string) => (have.has(id) ? [new Texture()] : []),
		update: () => undefined, clear: () => undefined,
	};
	const combat = new CombatSystem(
		{
			mover: (pos, dx, dy) => {
				pos.x += dx;
				pos.y += dy;
			},
			shake: () => undefined,
			toast: () => undefined,
			enemyKilled: () => undefined,
			bossNear: () => false,
			playerRespawn: () => ({ x: 0, y: 0 }),
			isUnlocked: () => true,
			practiceHit: (el, r) => void hits.push(`${el}:${r}`),
		},
		{ level: 1, exp: 0, coins: 0, potions: 0 },
		vfx as never,
	);
	const p = new Actor('hero', fakeTextures(), 40, 100, 'S', null);
	combat.setPlayer(p);
	if (o.tiers) combat.setTalents(o.tiers);
	if (o.dummy) combat.addDummy(o.dummy.x, o.dummy.y);
	const inner = combat as unknown as Internals;
	const c = combat as unknown as { float: (wx: number, wy: number, text: string, color: number, size: number) => void };
	const realFloat = c.float.bind(combat);
	c.float = (wx, wy, text, color, size) => {
		floats.push(text);
		realFloat(wx, wy, text, color, size);
	};
	const tick = (n = 1, dt = 1 / 60) => {
		for (let i = 0; i < n; i += 1) {
			p.update(dt);
			combat.update(dt, (x, y) => ({ x, y }), 2);
		}
	};
	const cast = (id: string, aim: { x: number; y: number }) => {
		combat.pc.mp = combat.pc.mpMax;
		combat.pc.cooldowns.clear();
		return combat.cast(idx(id), aim);
	};
	const enemy = (id: string, x: number, y = 100, hold = true): Fighter => {
		const home = { x, y, radius: 60 };
		const f = combat.addEnemy(new Actor(id, fakeTextures(), x, y, 'W', home), id, home, id)!;
		f.attackTimer = 99;
		if (hold) f.stun = 99;
		return f;
	};
	/** Hướng nhắm ngang từ ngực (đòn bắn / đòn chỉ cần hướng). */
	const east = () => ({ x: p.x + 300, y: p.y - p.chest });
	return { combat, p, hits, plays, floats, tick, inner, cast, enemy, east };
}
const full = (f: Fighter) => f.hp === f.hpMax;
const fixRandom = <T>(v: number, run: () => T): T => {
	const rnd = Math.random;
	Math.random = () => v;
	try {
		return run();
	} finally {
		Math.random = rnd;
	}
};

// 6a) Chưa đủ mốc thì không tung; đủ mốc thì tung được cả 10 kỹ năng.
{
	for (const [id, [branch, tier]] of Object.entries(NEW)) {
		const s = setup({ tiers: { [branch]: tier - 1 } });
		assert.equal(s.cast(id, { x: 200, y: 100 }), 'locked', `${id}: mốc ${tier - 1} chưa học`);
		s.combat.setTalents({ [branch]: tier });
		assert.equal(s.cast(id, { x: 200, y: 100 }), 'started', `${id}: mốc ${tier} tung được`);
		s.tick(60 * 7.5);
		assert.equal(s.inner.pending.length, 0, `${id}: hết lịch hẹn`);
		assert.equal(s.inner.zones.length + s.inner.walls.length, 0, `${id}: vùng / tường tan hết`);
	}
}

// 6b) Tường Đá: quái đuổi theo KHÔNG đi xuyên tường mà vòng qua đầu tường (người chơi đứng sau GIỮA tường — trước đây quái
//     trượt về chỗ đối diện rồi đứng im suốt 7s, không đánh được); tường chắn thì không lấy đà đánh; quái đánh xa đã đủ tầm
//     cũng đi vòng chứ không bắn vào tường; quái đi lang thang (chưa giao chiến) không xuyên tường; đá trồi hất quái đứng trên
//     đường tâm ra khỏi dải; hết giờ thì sụp.
{
	const s = setup({ tiers: { earth: 6 } });
	const chaser = s.enemy('mob_zombie_001', 40, 260, false);
	chaser.engaged = true;
	chaser.attackTimer = 0;
	const onLine = s.enemy('mob_zombie_001', 100, 200);
	assert.equal(s.cast('stone_wall', { x: 40, y: 200 }), 'started');
	assert.equal(s.inner.walls.length, 1);
	const w = s.inner.walls[0]!;
	near(w.ay, 200, 'tường ngang tại điểm nhắm');
	near(Math.abs(w.ax - w.bx), 200, 'dài 200');
	assert.ok(!full(onLine), 'đá trồi đánh quái đứng trên tường');
	assert.ok(onLine.dust > 0, 'đòn Thổ: bám bụi');
	s.tick(20);
	assert.ok(Math.abs(onLine.actor.y - 200) >= 24, `bị hất ra khỏi dải tường (y ${onLine.actor.y})`);
	onLine.dead = true;
	let around = -1;
	let swungWalled = false;
	for (let i = 0; i < 60 * 6.3 && around < 0; i += 1) {
		const c = chaser.actor;
		const prev = { x: c.x, y: c.y };
		s.tick();
		assert.ok(!segmentsCross(prev.x, prev.y, c.x, c.y, w.ax, w.ay, w.bx, w.by), `không đi xuyên tường (${c.x.toFixed(1)}, ${c.y.toFixed(1)})`);
		assert.ok(!(Math.abs(c.y - 200) < 24 - 1e-6 && c.x > Math.min(w.ax, w.bx) + 2 && c.x < Math.max(w.ax, w.bx) - 2), `không lấn vào dải dọc thân tường (${c.x.toFixed(1)}, ${c.y.toFixed(1)})`);
		if (chaser.windup > 0 && wallBetween(c.x, c.y, s.p.x, s.p.y, [w])) swungWalled = true;
		if (c.y < 176) around = i / 60;
	}
	assert.ok(around > 0 && s.inner.walls.length === 1, `vòng qua đầu tường sang phía người chơi khi tường còn đứng (${around.toFixed(2)}s)`);
	assert.ok(!swungWalled, 'tường chắn giữa: không lấy đà đánh vào tường');
	assert.ok(s.plays.some((x) => x.id === 'steam' && x.stay && x.duration === 7), 'hình tạm: khối đá đứng yên suốt 7s');
	s.tick(60 * 7);
	assert.equal(s.inner.walls.length, 0, 'hết 7s: tường sụp');

	// Quái đánh xa ĐÃ đủ tầm nhưng tường chắn: không bắn vào tường mà đi vòng.
	const r = setup({ tiers: { earth: 6 } });
	const archer = r.enemy('mob_skeleton_archer_001', 40, 250, false);
	archer.engaged = true;
	archer.attackTimer = 0;
	r.cast('stone_wall', { x: 40, y: 200 });
	const at0 = { x: archer.actor.x, y: archer.actor.y };
	let shotsWalled = 0;
	for (let i = 0; i < 60 * 1.5; i += 1) {
		r.tick();
		if (wallBetween(archer.actor.x, archer.actor.y, r.p.x, r.p.y, [r.inner.walls[0]!])) shotsWalled += r.inner.projectiles.filter((x) => x.team === 'enemy').length;
	}
	assert.ok(Math.hypot(archer.actor.x - at0.x, archer.actor.y - at0.y) > 30, 'cung thủ đủ tầm vẫn đi vòng tường');
	assert.equal(shotsWalled, 0, 'không bắn vào tường');

	// Quái chưa giao chiến đi lang thang (`Actor.think` → `wanderMover`): không xuyên tường.
	const g = setup({ tiers: { earth: 6 } });
	g.cast('stone_wall', { x: 40, y: 200 });
	const pos = { x: 40, y: 236 };
	for (let i = 0; i < 30; i += 1) g.combat.wanderMover(pos, 0, -4);
	near(pos.y, 224, 'đi lang thang: dừng ở mép tường', 1e-6);
}

// 6c) Tường Lửa: chặn quái + chặn đạn quái; quái áp sát tường bị đốt mỗi nhịp; hết 5s thì tắt.
{
	const s = setup({ tiers: { fire: 6 } });
	const z = s.enemy('mob_zombie_001', 250, 100, false);
	z.engaged = true;
	assert.equal(s.cast('fire_wall', { x: 170, y: 100 }), 'started');
	const w = s.inner.walls[0]!;
	near(w.ax, 170, 'nhắm ngang: tường dựng dọc');
	let burned = false;
	let around = false;
	for (let i = 0; i < 60 * 4.5; i += 1) {
		const prev = { x: z.actor.x, y: z.actor.y };
		s.tick();
		assert.ok(!segmentsCross(prev.x, prev.y, z.actor.x, z.actor.y, w.ax, w.ay, w.bx, w.by), `không đi xuyên tường lửa (${z.actor.x.toFixed(1)}, ${z.actor.y.toFixed(1)})`);
		burned ||= z.burn > 0 && !full(z);
		around ||= z.actor.x < 146;
	}
	assert.ok(around, 'vòng qua đầu tường lửa');
	assert.ok(burned, 'đi sát tường lửa (vòng qua đầu): bị đốt + cháy');
	// Đạn quái bắn xuyên tường: bị chặn, người chơi không mất máu. Không tường: trúng.
	const archer = s.enemy('mob_skeleton_archer_001', 300, 100);
	const hp = s.combat.pc.hp;
	s.combat.pc.iframes = 0;
	s.inner.enemyShot(archer, -1, 0);
	s.tick(70);
	assert.equal(s.combat.pc.hp, hp, 'tường chặn đạn');
	assert.equal(s.inner.projectiles.filter((x) => x.team === 'enemy').length, 0, 'đạn tan ở tường');
	s.tick(60 * 3);
	assert.equal(s.inner.walls.length, 0, 'hết 5s: tường lửa tắt');
	s.combat.pc.iframes = 0;
	s.inner.enemyShot(archer, -1, 0);
	s.tick(70);
	assert.ok(s.combat.pc.hp < hp, 'không còn tường: đạn trúng');
	assert.ok(s.plays.filter((x) => x.id === 'flame' && x.duration === 5).length >= 3, 'hình tạm: ngọn lửa lặp suốt 5s dọc tường');
}

// 6d) Gương Băng: đạn quái chạm khiên bay ngược về kẻ bắn thành mũi băng; hết 4s thì đạn lại trúng.
{
	const s = setup({ tiers: { ice: 6 } });
	const archer = s.enemy('mob_skeleton_archer_001', 300, 100);
	assert.equal(s.cast('ice_mirror', s.east()), 'started');
	assert.ok(s.combat.pc.ward && s.combat.pc.ward.radius === 46);
	const hp = s.combat.pc.hp;
	s.combat.pc.iframes = 0;
	s.inner.enemyShot(archer, -1, 0);
	s.tick(60);
	assert.equal(s.combat.pc.hp, hp, 'khiên: không mất máu');
	assert.ok(s.floats.includes('Phản!'));
	s.tick(60);
	assert.ok(!full(archer) && archer.chill > 0, 'mũi băng phản trúng kẻ bắn: mất máu + bị lạnh');
	s.tick(60 * 2 + 10);
	assert.equal(s.combat.pc.ward, null, 'hết 4s: khiên tắt');
	s.combat.pc.iframes = 0;
	s.inner.enemyShot(archer, -1, 0);
	s.tick(70);
	assert.ok(s.combat.pc.hp < hp, 'không khiên: đạn trúng');
}

// 6e) Gọi Mưa: quái trong vùng ướt LIÊN TỤC (làm mới mỗi nhịp), không mất máu; ngoài vùng không ướt; atlas có rain_cloud thì dùng.
{
	const s = setup({ tiers: { water: 6 }, dummy: { x: 230, y: 110 } });
	const inside = s.enemy('mob_zombie_001', 200, 100);
	const outside = s.enemy('mob_zombie_001', 420, 100);
	assert.equal(s.cast('call_rain', { x: 200, y: 100 }), 'started');
	s.tick(60 * 6 - 2);
	assert.ok(inside.wet > 5, `vẫn ướt gần đầy lúc mưa sắp tạnh (${inside.wet.toFixed(2)}) — được làm mới mỗi nhịp`);
	assert.ok(full(inside), 'mưa không gây sát thương');
	assert.equal(outside.wet, 0, 'ngoài vùng: khô');
	assert.ok(s.inner.dummies[0]!.wet > 0, 'hình nộm cũng ướt');
	assert.ok(s.plays.some((x) => x.id === 'steam' && x.stay && x.duration === 6), 'hình tạm: mây steam đứng yên 6s');
	assert.ok(s.plays.filter((x) => x.id === 'water_splash').length >= 30, 'nước bắn mỗi nhịp');
	s.tick(10);
	assert.equal(s.inner.zones.length, 0, 'hết 6s: tạnh');

	const q = setup({ tiers: { water: 6 }, have: ['rain_cloud'] });
	q.cast('call_rain', { x: 200, y: 100 });
	assert.ok(q.plays.some((x) => x.id === 'rain_cloud' && x.duration === 6) && !q.plays.some((x) => x.id === 'steam'), 'atlas có rain_cloud: tự dùng');
}

// 6f) Lôi Vũ: sét ƯU TIÊN quái ướt (quái khô gần tâm hơn vẫn chờ), tia dư mới sang quái khô — dùng một mình lên bầy khô vẫn
//     đánh cả bầy chứ không dồn 6 nhịp vào một con; trong mưa của Gọi Mưa sét dày gấp đôi (4 tia / nhịp).
{
	const spots = [200, 240, 160, 260, 140];
	{
		const s = setup({ tiers: { water: 8 } });
		const fs = spots.map((x) => s.enemy('mob_zombie_001', x, 100));
		fs[3]!.wet = 9;
		s.cast('thunder_rain', { x: 200, y: 100 });
		s.tick(2);
		assert.deepEqual(fs.map((f) => !full(f)), [true, false, false, true, false], 'nhịp 1: quái ướt (xa tâm) trước, tia dư vào quái khô gần tâm nhất');
		s.tick(60 * 3);
		assert.ok(fs.every((f) => !full(f)), 'cả 6 nhịp: sét rải khắp bầy');
		assert.equal(s.plays.filter((x) => x.id === 'light_pillar').length, 12, '6 nhịp × 2 tia (hình tạm: cột sáng nhuộm xanh)');
		assert.ok(s.plays.some((x) => x.id === 'steam' && x.duration === 3), 'nền mây dùng chung hình Gọi Mưa');
	}
	{
		const s = setup({ tiers: { water: 8 } });
		const fs = spots.map((x) => s.enemy('mob_zombie_001', x, 100));
		s.cast('thunder_rain', { x: 200, y: 100 });
		s.tick(2);
		assert.equal(fs.filter((f) => !full(f)).length, THUNDER.bolts, 'không quái nào ướt: đủ 2 tia vào quái gần tâm');
		assert.ok(!full(fs[0]!) && fs[0]!.wet > 0, 'tia làm ướt (đòn Thuỷ)');
		s.tick(31);
		assert.equal(fs.filter((f) => !full(f)).length, 2 * THUNDER.bolts, 'nhịp 2: sang 2 con khác (ít bị đánh trước)');
	}
	{
		const s = setup({ tiers: { water: 8 } });
		const fs = spots.map((x) => s.enemy('mob_zombie_001', x, 100));
		s.cast('call_rain', { x: 200, y: 100 });
		s.tick(2);
		assert.ok(fs.every((f) => f.wet > 0), 'Gọi Mưa làm ướt cả nhóm');
		s.cast('thunder_rain', { x: 200, y: 100 });
		s.tick(2);
		assert.equal(fs.filter((f) => !full(f)).length, THUNDER.rainBolts, 'mây trong mưa: 4 tia mỗi nhịp');
		s.tick(31);
		assert.equal(fs.filter((f) => !full(f)).length, 5, 'nhịp 2: tia đánh tiếp quái còn lại');
	}
	{
		// Ngoài mưa nhưng cả nhóm ướt sẵn: 2 tia / nhịp.
		const s = setup({ tiers: { water: 8 } });
		const fs = spots.map((x) => s.enemy('mob_zombie_001', x, 100));
		for (const f of fs) f.wet = 9;
		s.cast('thunder_rain', { x: 200, y: 100 });
		s.tick(2);
		assert.equal(fs.filter((f) => !full(f)).length, THUNDER.bolts, 'ngoài mưa: 2 tia mỗi nhịp');
	}
	{
		const q = setup({ tiers: { water: 8 }, have: ['lightning_strike', 'rain_cloud'] });
		q.enemy('mob_zombie_001', 200).wet = 9;
		q.cast('thunder_rain', { x: 200, y: 100 });
		q.tick(2);
		assert.ok(q.plays.some((x) => x.id === 'lightning_strike') && q.plays.some((x) => x.id === 'rain_cloud') && !q.plays.some((x) => x.id === 'light_pillar'), 'atlas có lightning_strike + rain_cloud: tự dùng');
	}
}

// 6g) Mạch Nguồn (Thuỷ 7): đứng trong mưa của mình mỗi giây hồi 3% máu tối đa + 4 MP; ra khỏi mưa thì thôi.
{
	const regen = (tiers: Tiers, rainAt: { x: number; y: number } | null) => {
		const s = setup({ tiers });
		if (rainAt) s.cast('call_rain', rainAt);
		s.combat.pc.hp = 50;
		s.combat.pc.mp = 0;
		s.combat.pc.lastHurt = 1e9; // tắt hồi máu ngoài trận (2 máu/giây sau 5 giây không trúng đòn)
		s.tick(60 * 2 + 3);
		return { hp: s.combat.pc.hp - 50, mp: s.combat.pc.mp, max: s.combat.pc.hpMax };
	};
	const inRain = regen({ water: 7 }, { x: 60, y: 100 });
	assert.equal(inRain.hp, 2 * Math.round(inRain.max * PASSIVE.springHp), `2 giây trong mưa: +${inRain.hp} máu`);
	near(inRain.mp, 2 * PASSIVE.springMp + 3.2 * (2 + 3 / 60), 'MP: hồi gốc 3,2/giây + 4 mỗi giây', 0.05);
	assert.deepEqual(regen({ water: 7 }, { x: 300, y: 100 }).hp, 0, 'mưa ở chỗ khác: không hồi');
	assert.deepEqual(regen({ water: 6 }, { x: 60, y: 100 }).hp, 0, 'Thuỷ mốc 6: chưa có Mạch Nguồn');
}

// 6h) Vòi Rồng: vùng đi theo hướng nhắm, cuốn quái theo (không cuốn boss), đủ 10 nhịp, hết giờ thì tan; atlas có tornado thì dùng ×2.
{
	const s = setup({ tiers: { wind: 8 } });
	const f = s.enemy('mob_zombie_001', 160, 104);
	const boss = s.enemy('boss_demon_001', 230, 40);
	const bx = boss.actor.x;
	let ticks = 0;
	let last = f.hp;
	assert.equal(s.cast('tornado', s.east()), 'started');
	const z = s.inner.zones[0]!;
	near(z.x, 80, 'sinh ngay trước mặt');
	for (let i = 0; i < 60 * 3.6; i += 1) {
		s.tick();
		if (f.hp < last) ticks += 1;
		last = f.hp;
		if (i === 59) near(z.x, 80 + 110, 'đi 110px mỗi giây theo hướng nhắm', 2);
	}
	assert.ok(f.actor.x > 330, `quái bị cuốn theo lốc (x ${f.actor.x.toFixed(0)})`);
	assert.equal(ticks, 10, 'đủ 10 nhịp chém');
	near(boss.actor.x, bx, 'boss không bị cuốn', 1e-9);
	assert.equal(s.inner.zones.length, 0, 'hết 3,5s: tan');
	assert.ok(s.plays.some((x) => x.id === 'wind_spin' && x.duration === 3.5));
	const q = setup({ tiers: { wind: 8 }, have: ['tornado'] });
	q.cast('tornado', q.east());
	assert.ok(q.plays.some((x) => x.id === 'tornado' && x.scale === 2 && x.duration === 3.5), 'atlas có tornado: Vòi Rồng = bản phóng ×2');
}

// 6i) Phong Bạo: 3 lưỡi toả quạt 36°, mỗi lưỡi trúng quái theo hướng của nó, xuyên + đẩy lùi.
{
	const s = setup({ tiers: { wind: 6 } });
	const at = (deg: number) => s.enemy('mob_zombie_001', 40 + 200 * Math.cos((deg * Math.PI) / 180), 100 + 200 * Math.sin((deg * Math.PI) / 180));
	const [mid, up, down] = [at(0), at(-18), at(18)];
	assert.equal(s.cast('gale_fan', s.east()), 'started');
	const blades = s.inner.projectiles.filter((x) => x.team === 'player' && !x.ghost);
	assert.equal(blades.length, 3, '3 lưỡi');
	assert.deepEqual(blades.map((b) => Math.round((Math.atan2(b.vy, b.vx) * 180) / Math.PI)).sort((a, b) => a - b), [-18, 0, 18], 'toả quạt ±18°');
	const d0 = [mid, up, down].map((f) => Math.hypot(f.actor.x - 40, f.actor.y - 100));
	s.tick(40);
	[mid, up, down].forEach((f, i) => {
		const pushed = Math.hypot(f.actor.x - 40, f.actor.y - 100) - d0[i]!;
		assert.ok(!full(f) && pushed > 50, `mỗi hướng một lưỡi trúng + đẩy lùi (${pushed.toFixed(0)}px)`);
	});
}

// 6j) Thiên Thạch: vòng báo + vật rơi; nổ sau 0,8s ở vùng bán kính 150, đốt + đẩy; atlas có meteor thì dùng.
{
	const s = setup({ tiers: { fire: 8 } });
	const center = s.enemy('mob_zombie_001', 300, 100);
	const edge = s.enemy('mob_zombie_001', 440, 100);
	const outside = s.enemy('mob_zombie_001', 300, 215);
	s.cast('meteor', { x: 300, y: 100 });
	assert.ok(s.inner.projectiles.some((x) => x.ghost), 'vật rơi (chỉ là hình)');
	assert.ok(s.plays.some((x) => x.id === 'magic_circle' && Math.abs(x.x - 300) < 1), 'vòng báo dưới đất');
	s.tick(45);
	assert.ok(full(center), 'chưa rơi (0,75s)');
	s.tick(6);
	assert.ok(!full(center) && !full(edge), 'nổ vùng lớn (mép 140px vẫn trúng)');
	assert.ok(center.burn > 0 && edge.push !== null, 'đốt + đẩy văng');
	assert.ok(full(outside), 'lệch dọc 115px (≈185 trên đất): ngoài vùng');
	// Atlas có `meteor` (clip tự có cảnh thiên thạch lao xuống): bỏ vật rơi tạm, phát clip SỚM `finalImpact` frame để frame
	// va chạm trùng lúc nổ — không hiện vật rơi hai lần, vụ nổ không trễ sau sát thương.
	const q = setup({ tiers: { fire: 8 }, have: ['meteor'] });
	const qc = q.enemy('mob_zombie_001', 300, 100);
	q.cast('meteor', { x: 300, y: 100 });
	assert.ok(!q.inner.projectiles.some((x) => x.ghost), 'có bản PixelLab: không bắn vật rơi tạm');
	assert.ok(q.plays.some((x) => x.id === 'magic_circle'), 'vẫn có vòng báo dưới đất');
	const lead = TEMP_ART.meteor!.finalImpact! / 18;
	const early = Math.ceil((0.8 - lead) * 60) + 1;
	q.tick(early);
	assert.ok(q.plays.some((x) => x.id === 'meteor') && full(qc), `clip phát trước lúc nổ ${lead.toFixed(2)}s`);
	// Tới ngay sau mốc 0,8s (đã tick `early` nhịp) — độ sớm lấy theo khung va chạm thật của bản vẽ nên không cố định.
	q.tick(Math.ceil(0.8 * 60) - early + 2);
	assert.ok(!full(qc), 'nổ đúng 0,8s');
	assert.equal(q.plays.filter((x) => x.id === 'meteor').length, 1, 'phát đúng một lần');
	assert.ok(!q.plays.some((x) => x.id === 'fire_ring'), 'không phát hình tạm');
}

// 6k) Mưa Băng / Lở Đá: nhiều điểm rơi rải theo thời gian, một mục tiêu trúng nhiều viên; Mưa Băng + quái ướt = Đóng Băng
//     hàng loạt; Lở Đá choáng; atlas có ice_rain thì phát ở mỗi viên thứ 3.
{
	const count = (id: string, tiers: Tiers, look: string, tint?: number) => {
		const s = setup({ tiers });
		s.cast(id, { x: 200, y: 100 });
		s.tick(10);
		const early = s.plays.filter((x) => x.id === look && (tint === undefined || x.tint === tint)).length;
		s.tick(60 * 3);
		return { early, total: s.plays.filter((x) => x.id === look && (tint === undefined || x.tint === tint)).length, ghosts: s.inner.pending.length };
	};
	const ice = count('ice_rain', { ice: 8 }, 'frost');
	assert.deepEqual([ice.total, ice.ghosts], [20, 0], 'Mưa Băng: đúng 20 mũi, hết lịch');
	assert.ok(ice.early < 3, 'rơi rải theo thời gian chứ không một lượt');
	assert.equal(count('rockslide', { earth: 8 }, 'steam', 0x9a7650).total, 12, 'Lở Đá: đúng 12 tảng');

	const s = setup({ tiers: { ice: 8 }, dummy: { x: 200, y: 100 } });
	const wets = [s.enemy('mob_zombie_001', 230, 110), s.enemy('mob_zombie_001', 170, 92), s.enemy('mob_zombie_001', 210, 80)];
	for (const f of wets) f.wet = 30;
	s.cast('ice_rain', { x: 200, y: 100 });
	const froze = new Set<Fighter>();
	for (let i = 0; i < 60 * 2.4; i += 1) {
		s.tick();
		for (const f of wets) if (f.freeze > 0) froze.add(f);
	}
	assert.equal(froze.size, 3, 'quái ướt trong vùng: Đóng Băng hàng loạt');
	assert.ok(s.hits.filter((h) => h.startsWith('ice')).length >= 2, `một mục tiêu trúng nhiều mũi (${s.hits.length})`);

	// Combo người chơi muốn: Gọi Mưa → Mưa Băng / Băng Trụ (mưa làm ướt cả bầy, băng rơi xuống = Đóng Băng hàng loạt).
	for (const finisher of ['ice_rain', 'ice_spire']) {
		const c = setup({ tiers: { water: 6, ice: 8 } });
		const pack = [c.enemy('mob_zombie_001', 200, 100), c.enemy('mob_zombie_001', 225, 112), c.enemy('mob_zombie_001', 180, 90)];
		c.cast('call_rain', { x: 200, y: 100 });
		c.tick(2);
		c.cast(finisher, { x: 200, y: 100 });
		const iced = new Set<Fighter>();
		for (let i = 0; i < 60 * 2.4; i += 1) {
			c.tick();
			for (const f of pack) if (f.freeze > 0) iced.add(f);
		}
		assert.equal(iced.size, 3, `Gọi Mưa → ${finisher}: cả bầy Đóng Băng`);
	}

	const r = setup({ tiers: { earth: 8 } });
	const g = r.enemy('mob_gargoyle_001', 200, 100, false);
	g.attackTimer = 99;
	let stunned = 0;
	r.cast('rockslide', { x: 200, y: 100 });
	for (let i = 0; i < 60 * 2.2; i += 1) {
		r.tick();
		stunned = Math.max(stunned, g.stun);
	}
	near(stunned, 0.5 * PASSIVE.earthCC, 'Lở Đá choáng 0,5s × Đá Nặng', 0.02);

	const ghosts = (have: string[]) => {
		const q = setup({ tiers: { ice: 8 }, have });
		const inner = q.inner as unknown as { fire: (o: { ghost?: boolean }) => void };
		const fire = inner.fire.bind(q.combat);
		let n = 0;
		inner.fire = (o) => {
			if (o.ghost) n += 1;
			fire(o);
		};
		q.cast('ice_rain', { x: 200, y: 100 });
		q.tick(60 * 3);
		return { q, n };
	};
	const fin = ghosts(['ice_rain']);
	assert.deepEqual([fin.q.plays.filter((x) => x.id === 'ice_rain').length, fin.q.plays.filter((x) => x.id === 'frost').length], [7, 0], 'atlas có ice_rain: phát ở mỗi mũi thứ 3');
	assert.deepEqual([fin.n, ghosts([]).n], [13, 20], 'mũi phát bản PixelLab (tự có cảnh cắm xuống) bỏ vật rơi tạm — không rơi hai lần');
}

// 6l) Tro Tàn (Hoả 7): quái chết lúc đang cháy nổ lan lửa → quái gần bén lửa, chết thì nổ tiếp — dây chuyền dừng ở 4 đợt.
{
	const chain = (tiers: Tiers) => {
		const s = setup({ tiers });
		const row = Array.from({ length: 8 }, (_, i) => s.enemy('mob_zombie_001', 200 + i * 60, 100));
		for (const f of row) f.hp = 5;
		row[0]!.burn = 2;
		s.inner.hit(row[0]!, 1000, 'aether', 1, 0);
		let frames = 0;
		while (s.inner.pending.length && frames < 600) {
			s.tick();
			frames += 1;
		}
		assert.ok(frames < 600, 'không lặp vô hạn: lịch hẹn cạn');
		return { dead: row.map((f) => f.dead), bursts: s.plays.filter((x) => x.id === 'fire_ring').length };
	};
	const on = chain({ fire: 7 });
	assert.deepEqual(on.dead, [true, true, true, true, true, false, false, false], 'chết lúc cháy → nổ lan, dây chuyền 4 đợt rồi dừng');
	assert.equal(on.bursts, PASSIVE.emberChain, '4 vụ nổ');
	const off = chain({ fire: 6 });
	assert.deepEqual([off.dead.filter(Boolean).length, off.bursts], [1, 0], 'Hoả 6: chưa có Tro Tàn');
	// Chết vì chính nhịp cháy (không có đòn nào của người chơi) cũng nổ lan.
	const s = setup({ tiers: { fire: 7 } });
	const a = s.enemy('mob_zombie_001', 200, 100);
	const b = s.enemy('mob_zombie_001', 250, 100);
	Object.assign(a, { hp: 1, burn: 0.51 });
	s.tick(20);
	assert.ok(a.dead && !full(b) && b.burn > 0, 'nhịp cháy giết quái: vẫn nổ lan');

	// Dây chuyền KHÔNG đồng bộ: vụ nổ chỉ đốt (không giết), quái chết vì nhịp cháy ở frame sau — trước đây độ sâu đếm lại từ 1
	// nên cháy lan hết cả hàng. Độ sâu nay đi theo LỬA trên quái: vẫn dừng ở 4 đợt.
	fixRandom(0.5, () => {
		const q = setup({ tiers: { fire: 7 } });
		const row = Array.from({ length: 8 }, (_, i) => q.enemy('mob_zombie_001', 200 + i * 60, 100));
		for (const f of row) f.hp = 25;
		row[0]!.burn = 2;
		q.inner.hit(row[0]!, 1000, 'aether', 1, 0);
		q.tick(10);
		assert.ok(!row[1]!.dead && row[1]!.burn > 0, `vụ nổ chỉ đốt, chưa giết (còn ${row[1]!.hp} máu)`);
		// Ghi "đã chết" từng frame — quái chết sớm hồi sinh sau `MONSTER_RESPAWN` giây.
		const died = row.map((f) => f.dead);
		for (let i = 0; i < 60 * 15; i += 1) {
			q.tick();
			row.forEach((f, k) => (died[k] ||= f.dead));
		}
		assert.deepEqual(died, [true, true, true, true, true, false, false, false], 'chết dần vì nhịp cháy: vẫn dừng ở 4 đợt');
		assert.equal(q.plays.filter((x) => x.id === 'fire_ring').length, PASSIVE.emberChain);
	});

	// Quái đang cháy bị nhát kết liễu dập lửa (Thuỷ — Hơi Nước): lúc trúng đòn vẫn đang cháy → vẫn nổ.
	const k = setup({ tiers: { fire: 7 } });
	const ka = k.enemy('mob_zombie_001', 200, 100);
	const kb = k.enemy('mob_zombie_001', 250, 100);
	Object.assign(ka, { hp: 5, burn: 2 });
	k.inner.hit(ka, 1000, 'water', 1, 0);
	k.tick(12);
	assert.ok(ka.dead && !full(kb), 'kết liễu bằng Thuỷ (dập lửa): vẫn nổ Tro Tàn');
}

// 6m) Mắt Bão (Phong 7): né tốn 50% thể lực; né xong tốc chạy ×1,15 trong 2 giây.
{
	const s = setup({ tiers: { wind: 7 } });
	near(s.combat.dodgeStamina, 12.5, 'né tốn 12,5 thay 25');
	near(s.combat.moveScale, PASSIVE.moveSpeed, 'chưa né: Thuận Gió');
	s.combat.dodge({ x: 1, y: 0 });
	near(s.combat.pc.stamina, 100 - 12.5, 'trừ đúng thể lực');
	near(s.combat.moveScale, PASSIVE.moveSpeed * PASSIVE.eyeHaste, 'né xong: +15% tốc chạy');
	s.tick(60 * 2);
	near(s.combat.moveScale, PASSIVE.moveSpeed * PASSIVE.eyeHaste, 'vẫn còn ở 2 giây (tính từ lúc lăn xong)');
	s.tick(20);
	near(s.combat.moveScale, PASSIVE.moveSpeed, 'hết 2 giây');
	assert.ok(s.plays.some((x) => x.id === 'wind_burst'), 'hình tạm Mắt Bão');
}

// 6n) Gió Loạn (Phong 9): đòn hệ Phong làm quái trượt 20% trong 3 giây (boss đủ thời gian); Bão Cát đang dính thì 40%.
{
	const s = setup({ tiers: { wind: 9 } });
	const f = s.enemy('mob_zombie_001', 70, 100, false);
	const b = s.enemy('boss_demon_001', 300, 100);
	fixRandom(0.5, () => {
		s.inner.hit(f, 10, 'wind', 1, 0);
		s.inner.hit(b, 10, 'wind', 1, 0);
	});
	near(f.daze, PASSIVE.gustSeconds, 'quái: 3 giây');
	near(b.daze, PASSIVE.gustSeconds, 'boss: đủ 3 giây (suy yếu, không phải khống chế)');
	let hp = s.combat.pc.hp;
	fixRandom(0.19, () => s.inner.strike(f, 30));
	assert.equal(s.combat.pc.hp, hp, 'xúc xắc 0,19 < 20%: trượt');
	assert.ok(s.floats.includes('Trượt'));
	s.combat.pc.iframes = 0;
	hp = s.combat.pc.hp;
	fixRandom(0.21, () => s.inner.strike(f, 30));
	assert.ok(s.combat.pc.hp < hp, '0,21: trúng');
	f.miss = 2;
	s.combat.pc.iframes = 0;
	hp = s.combat.pc.hp;
	fixRandom(0.3, () => s.inner.strike(f, 30));
	assert.equal(s.combat.pc.hp, hp, 'Bão Cát + Gió Loạn: 40%');
	const q = setup({ tiers: { wind: 8 } });
	const g = q.enemy('mob_zombie_001', 300);
	fixRandom(0.5, () => q.inner.hit(g, 10, 'wind', 1, 0));
	assert.equal(g.daze, 0, 'Phong 8: chưa có Gió Loạn');
}

// 6o) Hàn Tâm (Băng 7): đóng băng lâu ×1,5 — phản ứng Đóng Băng, Băng Trụ; boss vẫn một nửa.
{
	const s = setup({ tiers: { ice: 7 } });
	const st: St = { burn: 0, wet: 2, chill: 0, freeze: 0 };
	s.inner.react(st, 'ice', 0, 0);
	near(st.freeze, 1.6 * PASSIVE.deepFreeze, 'Đóng Băng 2,4s');
	const bs: St = { burn: 0, wet: 2, chill: 0, freeze: 0, boss: true };
	s.inner.react(bs, 'ice', 0, 0);
	near(bs.freeze, (1.6 * PASSIVE.deepFreeze) / 2, 'boss một nửa');
	const f = s.enemy('mob_zombie_001', 200, 100, false);
	s.cast('ice_spire', { x: 200, y: 100 });
	s.tick(32);
	assert.ok(f.freeze > 1.4 * PASSIVE.deepFreeze - 0.05, `Băng Trụ đóng băng 2,1s (${f.freeze.toFixed(2)})`);
	const q = setup({ tiers: { ice: 6 } });
	const s6: St = { burn: 0, wet: 2, chill: 0, freeze: 0 };
	q.inner.react(s6, 'ice', 0, 0);
	near(s6.freeze, 1.6, 'Băng 6: chưa có Hàn Tâm');
}

// 6p) Vỡ Vụn (Băng 9): đánh quái đóng băng ×1,4; băng tan thì nổ vụn băng trúng quái quanh (không trúng chính nó); quái
//     chết lúc đóng băng cũng nổ.
{
	fixRandom(0.5, () => {
		const s = setup({ tiers: { ice: 9 } });
		const a = s.enemy('mob_zombie_001', 200, 100);
		const b = s.enemy('mob_zombie_001', 250, 100);
		const far = s.enemy('mob_zombie_001', 450, 100);
		const plain = s.enemy('mob_zombie_001', 600, 100);
		a.freeze = 1;
		s.tick();
		let before = a.hp;
		s.inner.hit(a, 40, 'aether', 1, 0);
		const frozenHit = before - a.hp;
		before = plain.hp;
		s.inner.hit(plain, 40, 'aether', 1, 0);
		assert.deepEqual([frozenHit, before - plain.hp], [Math.round(40 * 1.4 - 2), 38], 'đánh quái đóng băng +40%');
		const aHp = a.hp;
		s.tick(70);
		assert.ok(a.freeze === 0 && !full(b) && b.chill > 0, 'băng tan: vụn băng trúng quái bên cạnh (làm lạnh)');
		assert.equal(a.hp, aHp, 'không trúng chính nó');
		assert.ok(full(far), 'xa: không trúng');
		assert.ok(s.floats.includes('Vỡ băng!'));
		// Quái chết lúc đóng băng.
		const c = s.enemy('mob_zombie_001', 700, 100);
		const d = s.enemy('mob_zombie_001', 740, 100);
		c.freeze = 2;
		s.inner.hit(c, 5000, 'aether', 1, 0);
		assert.ok(c.dead && !full(d), 'chết lúc đóng băng: nổ vụn băng');
		const q = setup({ tiers: { ice: 8 } });
		const e = q.enemy('mob_zombie_001', 200, 100);
		const n = q.enemy('mob_zombie_001', 250, 100);
		e.freeze = 0.2;
		q.tick(30);
		assert.ok(full(n), 'Băng 8: chưa có Vỡ Vụn');
		// Nhát kết liễu tự phá băng (Thổ — Vỡ Vụn ×2,2; Hoả — Tan Chảy): phản ứng xoá băng TRƯỚC khi quái chết — vẫn nổ vụn.
		for (const el of ['earth', 'fire']) {
			const k = setup({ tiers: { ice: 9 } });
			const kf = k.enemy('mob_zombie_001', 200, 100);
			const kn = k.enemy('mob_zombie_001', 240, 100);
			kf.freeze = 2;
			k.tick();
			k.inner.hit(kf, 5000, el, 1, 0);
			assert.ok(kf.dead && !full(kn) && k.floats.includes('Vỡ băng!'), `kết liễu quái đóng băng bằng ${el}: vẫn nổ vụn băng`);
		}
	});
}

// 6p2) Vỡ Vụn + Gọi Mưa: vụn băng Đóng Băng quái ướt chỉ LAN MỘT ĐỢT (`PASSIVE.shardChain`) — trước đây mưa làm ướt lại mỗi
//      0,5s + vụn của con này đóng băng con kia, con kia tan lại đóng băng con này: một Băng Tiễn khoá cả bầy ~5s / 12s.
{
	const s = setup({ tiers: { ice: 9, water: 6 } });
	const pack = [s.enemy('mob_zombie_001', 200, 100), s.enemy('mob_zombie_001', 230, 110), s.enemy('mob_zombie_001', 175, 92), s.enemy('mob_zombie_001', 215, 80)];
	for (const f of pack) f.hp = f.hpMax = 1e6;
	s.cast('call_rain', { x: 200, y: 100 });
	s.tick(2);
	s.inner.hit(pack[0]!, 1, 'ice', 1, 0);
	const frozen = pack.map(() => 0);
	for (let i = 0; i < 60 * 12; i += 1) {
		s.tick();
		pack.forEach((f, k) => (frozen[k]! += f.freeze > 0 ? 1 / 60 : 0));
	}
	const freezes = s.floats.filter((t) => t === 'Đóng Băng!').length;
	assert.equal(freezes, pack.length, `con đầu + 3 con quanh (một đợt vụn) — ${freezes} lần Đóng Băng`);
	assert.ok(frozen.every((t) => t <= 2.4 * 1 + 0.05), `mỗi con đóng băng tối đa một lần 2,4s (${frozen.map((t) => t.toFixed(1)).join(' / ')})`);
	assert.ok(pack.slice(1).every((f) => !full(f)), 'đợt vụn sau vẫn gây sát thương + làm lạnh');
}

// 6p3) Boss kháng băng: Gọi Mưa (ướt lại mỗi 0,5s) + Băng Địa (nhịp Băng mỗi 0,5s) — trước đây đặt lại 0,8s băng mỗi nhịp, boss
//      đứng im ~4,3s liền. Nay: đang băng thì không gia hạn, tan rồi kháng 3s. Quái thường cùng chỗ vẫn bị khoá (combo cố ý).
{
	const s = setup({ tiers: { ice: 6, water: 6 } });
	const boss = s.enemy('boss_demon_001', 200, 100);
	const mob = s.enemy('mob_zombie_001', 230, 105);
	s.cast('call_rain', { x: 200, y: 100 });
	s.tick(2);
	s.cast('frost_field', { x: 200, y: 100 });
	let bossT = 0;
	let mobT = 0;
	let longestGap = 0;
	let gap = 0;
	for (let i = 0; i < 60 * 4.5; i += 1) {
		s.tick();
		bossT += boss.freeze > 0 ? 1 / 60 : 0;
		mobT += mob.freeze > 0 ? 1 / 60 : 0;
		gap = boss.freeze > 0 ? 0 : gap + 1 / 60;
		longestGap = Math.max(longestGap, gap);
	}
	assert.ok(bossT <= 0.8 + 0.05, `boss đóng băng ${bossT.toFixed(2)}s / 4,5s (một lần ½ thời lượng)`);
	assert.ok(longestGap >= BOSS_FREEZE_IMMUNE - 0.05, `boss có quãng không băng ${longestGap.toFixed(2)}s`);
	assert.ok(mobT > 3.5, `quái thường vẫn bị khoá ${mobT.toFixed(2)}s (Đóng Băng hàng loạt)`);
}

// 6q) Trọng Lực (Thổ 7): đòn Thổ làm chậm 20% 2 giây (không đè Bùn Lầy; boss nửa thời gian); quái đang choáng nhận +20%.
{
	fixRandom(0.5, () => {
		const s = setup({ tiers: { earth: 7 } });
		const f = s.enemy('mob_zombie_001', 300, 100);
		f.stun = 0;
		s.inner.hit(f, 10, 'earth', 1, 0);
		assert.deepEqual([f.slow, f.slowMult], [PASSIVE.gravitySeconds, PASSIVE.gravitySlow], 'đòn Thổ: chậm 20% 2 giây');
		const b = s.enemy('boss_demon_001', 400, 100);
		b.stun = 0;
		s.inner.hit(b, 10, 'earth', 1, 0);
		near(b.slow, PASSIVE.gravitySeconds / 2, 'boss: nửa thời gian');
		const m = s.enemy('mob_zombie_001', 500, 100);
		Object.assign(m, { stun: 0, slow: 3, slowMult: 0.3 });
		s.inner.hit(m, 10, 'earth', 1, 0);
		assert.equal(m.slowMult, 0.3, 'không đè Bùn Lầy');
		const stunned = s.enemy('mob_zombie_001', 600, 100);
		const awake = s.enemy('mob_zombie_001', 700, 100);
		awake.stun = 0;
		const dmg = (g: Fighter) => {
			const hp = g.hp;
			s.inner.hit(g, 40, 'aether', 1, 0);
			return hp - g.hp;
		};
		assert.deepEqual([dmg(stunned), dmg(awake)], [Math.round(40 * 1.2 - 2), 38], 'đang choáng: +20%');
		const q = setup({ tiers: { earth: 6 } });
		const g = q.enemy('mob_zombie_001', 300);
		q.inner.hit(g, 10, 'earth', 1, 0);
		assert.equal(g.slow, 0, 'Thổ 6: chưa có Trọng Lực');
	});
}

// 6r) Hoả Thân (Hoả 9): nhịp cháy ×1,5; kháng cháy là CỜ.
{
	const burnTick = (tiers: Tiers) => {
		const q = setup({ tiers });
		const f = q.enemy('mob_zombie_001', 300);
		Object.assign(f, { burn: 0.51, burnPower: 1 });
		const before = f.hp;
		q.tick(3);
		return { dmg: before - f.hp, resist: q.combat.fireResist };
	};
	assert.deepEqual(burnTick({ fire: 8 }), { dmg: Math.round(16 * 0.18), resist: false });
	assert.deepEqual(burnTick({ fire: 9 }), { dmg: Math.round(16 * 0.18 * PASSIVE.burnDamage), resist: true }, 'Hoả Thân: thiêu đốt +50%, cờ kháng cháy');
}

// 6s) Thuỷ Triều Dâng (Thuỷ 9): quái ướt nhận ×1,15 từ mọi nguồn; hút máu đòn Thuỷ 12%.
{
	fixRandom(0.5, () => {
		const s = setup({ tiers: { water: 9 } });
		const wet = s.enemy('mob_zombie_001', 300);
		const dry = s.enemy('mob_zombie_001', 400);
		wet.wet = 5;
		const dmg = (g: Fighter) => {
			const hp = g.hp;
			s.inner.hit(g, 40, 'aether', 1, 0);
			return hp - g.hp;
		};
		assert.deepEqual([dmg(wet), dmg(dry)], [Math.round(40 * 1.15 - 2), 38], 'quái ướt +15%');
		s.combat.pc.hp = 50;
		const before = dry.hp;
		s.inner.hit(dry, 40, 'water', 1, 0);
		const dealt = before - dry.hp;
		assert.equal(s.combat.pc.hp, 50 + Math.floor(dealt * 0.12 + 0.5), `hút 12% của ${dealt}`);
		// Nhát kết liễu thừa sát thương: chỉ hút trên máu thật còn lại (5), không trên 600.
		const last = s.enemy('mob_zombie_001', 500);
		last.hp = 5;
		s.combat.pc.hp = 50;
		s.inner.hit(last, 600, 'water', 1, 0);
		assert.ok(last.dead);
		assert.equal(s.combat.pc.hp, 50 + lifestealHeal(5, 0.12), 'kết liễu quái còn 5 máu bằng đòn 600: hút trên 5 máu');
		// Nhịp cháy lên quái ướt cũng ăn thêm (mọi nguồn).
		const q = setup({ tiers: { water: 9 } });
		const f = q.enemy('mob_zombie_001', 300);
		Object.assign(f, { burn: 0.51, burnPower: 1, wet: 3 });
		const hp = f.hp;
		q.tick(3);
		assert.equal(hp - f.hp, Math.round(16 * 0.18 * 1.15), 'nhịp cháy lên quái ướt: +15%');
	});
}

// 6t) Núi Thiêng (Thổ 9): máu tối đa ×1,15 (đổi ngay khi cộng mốc, không hồi đầy); đứng yên từ 1 giây thì hồi 2%/giây.
{
	const s = setup({ tiers: { earth: 8 } });
	const base = s.combat.pc.hpMax;
	s.combat.setTalents({ earth: 9 });
	assert.equal(s.combat.pc.hpMax, Math.round(base * PASSIVE.mountainHp), 'máu tối đa +15% (HUD đọc pc.hpMax)');
	assert.equal(s.combat.pc.hp, base, 'không hồi đầy khi cộng mốc');
	s.combat.setTalents({ earth: 8 });
	assert.deepEqual([s.combat.pc.hpMax, s.combat.pc.hp], [base, base], 'tẩy điểm: về lại, máu kẹp theo');
	// Vào game (đúng thứ tự Game.boot: dựng → setPlayer → setPath → setTalents → refill): đầy máu theo máu tối đa MỚI.
	const boot = setup();
	boot.combat.setPath('sword');
	boot.combat.setTalents({ earth: 9 });
	assert.ok(boot.combat.pc.hp < boot.combat.pc.hpMax, 'chưa refill: thiếu máu (lỗi cũ — bản lưu không cất máu)');
	boot.combat.refill();
	assert.deepEqual([boot.combat.pc.hp, boot.combat.pc.mp], [boot.combat.pc.hpMax, boot.combat.pc.mpMax], 'vào game: đầy máu + MP');

	const still = (tiers: Tiers, move: boolean) => {
		const q = setup({ tiers });
		q.combat.pc.hp = 50;
		q.combat.pc.lastHurt = 1e9;
		for (let i = 0; i < 60 * 3 + 3; i += 1) {
			if (move) q.p.x += 0.5;
			q.tick();
		}
		return q.combat.pc.hp - 50;
	};
	const healed = still({ earth: 9 }, false);
	const per = Math.round(Math.round(base * PASSIVE.mountainHp) * PASSIVE.mountainRegen);
	assert.ok(healed >= per && healed % per === 0, `đứng yên: hồi ${healed} (mỗi giây ${per})`);
	assert.equal(still({ earth: 9 }, true), 0, 'đang đi: không hồi');
	assert.equal(still({ earth: 8 }, false), 0, 'Thổ 8: chưa có Núi Thiêng');
}

// 6u) Vfx `stay`: phát một lượt rồi đứng ở frame cuối tới hết `duration` (tường đá, mây).
{
	const { Vfx } = await import('../src/game/combat/Vfx');
	const v = new Vfx();
	const frames = strip(3);
	(v as unknown as { sheet: unknown }).sheet = { animations: { steam: frames } };
	const live = () => (v as unknown as { playing: { sprite: { texture: unknown } }[] }).playing;
	v.play('steam', 0, 0, { fps: 10, duration: 2, stay: true });
	v.update(0.15);
	assert.equal(live()[0]!.sprite.texture, frames[1]);
	v.update(1);
	assert.equal(live()[0]!.sprite.texture, frames[2], 'đứng ở frame cuối, không lặp về frame đầu');
	v.update(1);
	assert.equal(live().length, 0, 'hết duration thì tắt');

	// Trận đứng (bảng P / thoại mở): hình có thời lượng đứng theo đồng hồ trận; hình một lượt chạy nốt.
	(v as unknown as { sheet: unknown }).sheet = { animations: { steam: frames, dust: strip(2) } };
	v.play('steam', 0, 0, { fps: 10, duration: 2, stay: true });
	v.play('dust', 0, 0, { fps: 10 });
	v.update(8, true);
	assert.equal(live().length, 1, 'mở bảng 8 giây: tường / mây còn nguyên, bụi một lượt đã xong');
	v.update(1.5);
	assert.equal(live().length, 1, 'chạy tiếp từ chỗ dừng');
	v.update(0.6);
	assert.equal(live().length, 0);

	// Đổi map: gỡ mọi hình đang phát (CombatSystem.clearWorld gọi `clear`).
	v.play('steam', 0, 0, { duration: 7, stay: true });
	v.play('dust', 0, 0);
	v.clear();
	assert.equal(live().length, 0, 'clear: không còn hình nào');
	let cleared = 0;
	const s = setup();
	(s.inner as unknown as { vfx: { clear: () => void } }).vfx.clear = () => void (cleared += 1);
	s.combat.clearWorld();
	assert.equal(cleared, 1, 'đổi map: dọn hình của map cũ');

	// Lớp 'world': xếp chiều sâu chung với nhân vật theo chân vật (khối đá Tường Đá): quái đứng trước tường vẽ đè lên tường.
	const ents = new Container({ sortableChildren: true });
	v.world = ents;
	v.play('steam', 100, 168, { layer: 'world', depthY: 200, duration: 7, stay: true });
	const rock = live()[0]!.sprite as unknown as { parent: unknown; zIndex: number };
	assert.equal(rock.parent, ents, 'vào lớp chung với nhân vật');
	assert.equal(rock.zIndex, 200, 'zIndex = chân tường (không phải y vẽ đã nhấc)');
	assert.ok(224 > rock.zIndex && 176 < rock.zIndex, 'quái ở mép trước (y 224) vẽ đè; mép sau (y 176) bị che');
	assert.equal(TEMP_ART.stone_wall!.look.find((l) => l.stay)!.layer, 'world', 'khối đá Tường Đá ở lớp world');
	assert.equal(TEMP_ART.fire_wall!.look.find((l) => l.loop)!.layer, 'world', 'lửa Tường Lửa ở lớp world');
	const cloud = TEMP_ART.call_rain!.look.find((l) => l.stay)!;
	assert.ok((cloud.lift ?? 0) - 45 >= 120 && (cloud.alpha ?? 1) <= 0.8, 'mây Gọi Mưa treo cao + hơi trong: không che thân quái trong vùng mưa');
}

console.log(
	'✔ tiers69.test: tường (dựng vuông góc trên đất, chặn đi + chặn đạn, quái đuổi / đánh xa / lang thang không xuyên mà VÒNG qua đầu tường, hết hạn; Tường Lửa đốt, Tường Đá hất), Gương Băng phản đạn, Gọi Mưa ướt liên tục, Lôi Vũ (rải khắp bầy, ướt trước, 4 tia trong mưa) + Mạch Nguồn, Vòi Rồng đi + cuốn, Phong Bạo 3 lưỡi, Thiên Thạch (bản PixelLab: không rơi hai lần, nổ đúng lúc), Mưa Băng / Lở Đá nhiều điểm (Đóng Băng hàng loạt, choáng), Tro Tàn dây chuyền dừng ở 4 đợt (cả khi chết dần vì nhịp cháy, cả khi nhát kết liễu dập lửa), Mắt Bão (không nhân chồng Nhẹ Như Gió), Gió Loạn, Hàn Tâm, Vỡ Vụn (nhát kết liễu phá băng vẫn nổ; vụn Đóng Băng lan một đợt), boss kháng băng, Trọng Lực, Hoả Thân, Thuỷ Triều Dâng (hút trên máu thật), Núi Thiêng (máu tối đa + hồi khi đứng yên + vào game đầy máu), Vfx (đứng khi trận đứng, dọn khi đổi map, lớp world), số liệu tự cân, TEMP_ART + tự dùng bản PixelLab',
);

// Phần LUẬT THUẦN tách từ apps/web/tests/tiers69.test.ts (11/10/2026, chuẩn bị xoá bản web): chỉ hàm của @havenlord/sim (+ bảng hình
// tạm `UnityGame/Tools~/data/tempArt.ts`). Phần chạy CombatSystem của web bỏ cùng bản web — client Unity có test C# + vector riêng.
// Chạy: npx tsx tests/tiers69.test.ts (trong packages/sim) hoặc `npm test -w @havenlord/sim`.
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
} from '../src/skillRules.ts';
import { estimateText, HERO_SKILLS, isGroundTarget, powerText, skillFacts, type SkillDef } from '../src/skills.ts';
import { defaultLoadout, knowsSkill, PASSIVE, passiveEffects, placeSkill, SKILL_NODE, TREE, type Branch } from '../src/talents.ts';
import { TEMP_ART } from '../../../UnityGame/Tools~/data/tempArt.ts';

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
	const passives: Record<'fire' | 'water' | 'wind' | 'ice' | 'earth', [string, string]> = {
		fire: ['Tro Tàn', 'Hoả Thân'],
		water: ['Mạch Nguồn', 'Thuỷ Triều Dâng'],
		wind: ['Mắt Bão', 'Gió Loạn'],
		ice: ['Hàn Tâm', 'Vỡ Vụn'],
		earth: ['Trọng Lực', 'Núi Thiêng'],
	};
	for (const [b, [p7, p9]] of Object.entries(passives) as ['fire' | 'water' | 'wind' | 'ice' | 'earth', [string, string]][]) {
		assert.deepEqual([TREE[b][6]!.name, TREE[b][6]!.kind, TREE[b][6]!.ready], [p7, 'passive', true], `${b} mốc 7`);
		assert.deepEqual([TREE[b][8]!.name, TREE[b][8]!.kind, TREE[b][8]!.ready], [p9, 'passive', true], `${b} mốc 9`);
		assert.equal(TREE[b][9]!.ready, false, `${b} mốc 10 (tuyệt kỹ) vẫn "Sắp có"`);
	}
	assert.equal(TREE.sword.filter((n) => n.ready).length, 2, 'Kiếm chỉ còn 2 mốc chung; lưu phái là nhánh riêng tới mốc 7 (= Kiếm cũ 9)');
	for (const st of ['kiem_than', 'thuy_than', 'bac_than'] as const) assert.equal(TREE[st].filter((n) => n.ready).length, 7, `${st}: mốc 1–7`);
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
	const five: Record<'fire' | 'water' | 'wind' | 'ice' | 'earth', string> = { fire: 'fire_blast', water: 'tidal_wave', wind: 'gale_dash', ice: 'ice_spire', earth: 'stone_spikes' };
	for (const [b, id5] of Object.entries(five) as ['fire' | 'water' | 'wind' | 'ice' | 'earth', string][]) {
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
	near(passiveEffects({ sword: 2, bac_than: 2, wind: 7 }).dodgeCost, Math.min(PASSIVE.swiftDodge, PASSIVE.eyeDodge), 'Nhẹ Như Gió + Mắt Bão: lấy mức rẻ hơn (50%), không nhân chồng');
	near(passiveEffects({ sword: 2, bac_than: 2, wind: 6 }).dodgeCost, PASSIVE.swiftDodge, 'chỉ Nhẹ Như Gió: 70%');
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

console.log('✔ tiers69.test (sim): phần luật');

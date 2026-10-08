// Chạy: npx tsx tests/talentTree.test.ts — bố cục cây Tiềm năng dạng lưới (components/talents/treeLayout.ts), trạng thái
// nút, đoạn nối, "Học được ngay", lộ trình, chi tiết nút (talentInfo.ts) và bảng icon tạm của bị động.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { nodeInfo, nodeAria } from '../src/components/talents/talentInfo';
import {
	artHalfDiagonal,
	findNode,
	fitPhoneTree,
	layoutTree,
	learnableNow,
	nextSteps,
	nodeState,
	parseKey,
	routeTo,
	TREE_DESKTOP,
	TREE_FRAME,
	TREE_LOW,
	TREE_PHONE,
	type LaidNode,
	type TreeParams,
} from '../src/components/talents/treeLayout';
import { PASSIVE_TEMP, passiveTempKey } from '../src/game/combat/passiveTempArt';
import { TEMP_ART } from '../src/game/combat/tempArt';
import {
	BRANCH_LOCK_NOTE,
	BRANCH_NAME,
	BRANCHES,
	canEnchant,
	depthBonus,
	describeBuild,
	knowsSkill,
	MAX_TIER,
	nextTierCost,
	pointsForLevel,
	resetCost,
	spentPoints,
	STYLE_TIER,
	STYLE_TREE,
	SWORD_ART_TIER,
	SWORD_ARTS,
	SWORD_STYLE_INFO,
	SWORD_STYLES,
	TIER_COST,
	tierCap,
	TREE,
	treeOf,
	unspent,
	type Branch,
	type EnchantId,
	type SwordStyle,
	type Tiers,
	type TreeNode,
} from '../src/game/combat/talents';
import { HERO_SKILLS } from '../src/game/combat/skills';
import type { TalentsView } from '../src/store/useGameStore';

let passed = 0;
function test(name: string, fn: () => void): void {
	fn();
	passed += 1;
	console.log(`  ✓ ${name}`);
}

/**
 * Dựng `TalentsView` y như `Game.talentsView` (cùng hàm thuần của talents.ts) — fixture cho mọi test bên dưới.
 * `tiers`: mốc từng nhánh (0 = chưa mở), `style`: lưu phái Kiếm, `level`: cấp (quyết định số điểm).
 */
function view(tiers: Tiers, style: SwordStyle | null, level: number): TalentsView {
	const isUnlocked = (id: string): boolean => BRANCHES.some((b) => b === id && (tiers[b] ?? 0) > 0);
	const nodeView = (n: TreeNode, tier: number) => ({ tier: n.tier, kind: n.kind, name: n.name, desc: n.desc, ready: n.ready, reached: tier >= n.tier, cost: TIER_COST[n.tier] ?? 0, ...(n.skillId ? { skillId: n.skillId } : {}) });
	const build = describeBuild(tiers, style);
	return {
		points: pointsForLevel(level),
		spent: spentPoints(tiers),
		unspent: unspent(level, tiers),
		buildKind: build.kind,
		buildLabel: build.label,
		buildDetail: build.detail,
		branches: BRANCHES.map((b) => {
			const tier = tiers[b] ?? 0;
			const unlocked = tier > 0;
			const first = TREE[b][0];
			return {
				branch: b,
				name: BRANCH_NAME[b],
				unlocked,
				lockNote: unlocked ? '' : (BRANCH_LOCK_NOTE[b] ?? 'Mở theo cốt truyện'),
				tier,
				maxTier: MAX_TIER,
				cap: tierCap(b),
				bonusPct: Math.round((depthBonus(tier) - 1) * 100),
				nextCost: nextTierCost(tiers, b),
				iconSkill: first?.ready && first.skillId ? first.skillId : null,
				nodes: treeOf(b, style).map((n) => nodeView(n, tier)),
				...(b === 'sword'
					? {
							style,
							styleTier: STYLE_TIER,
							styles: SWORD_STYLES.map((s) => ({ id: s, ...SWORD_STYLE_INFO[s], chosen: style === s, iconSkill: STYLE_TREE[s][0]?.skillId ?? null, nodes: STYLE_TREE[s].map((n) => nodeView(n, style === s ? tier : 0)) })),
						}
					: {}),
			};
		}),
		resetCost: resetCost(level),
		enchant: { current: null, cooldown: 0, options: (['fire', 'water', 'wind', 'ice', 'earth'] as EnchantId[]).map((e) => ({ id: e, name: e, ok: canEnchant(tiers, e), need: '' })) },
		loadout: [],
		arts: (Object.entries(SWORD_ARTS) as [EnchantId, string][]).map(([e, id]) => {
			const s = HERO_SKILLS.find((d) => d.id === id)!;
			return {
				skillId: id,
				name: s.name,
				desc: '',
				element: e,
				elementName: BRANCH_NAME[e],
				need: '',
				swordOk: (tiers.sword ?? 0) >= SWORD_ART_TIER,
				elementOk: (tiers[e] ?? 0) >= SWORD_ART_TIER,
				learned: knowsSkill(s, tiers, isUnlocked, style),
			};
		}),
		learned: [],
	};
}

/** Lòng tab trên điện thoại dọc = bề ngang màn − 64 (lề lớp phủ 6 + viền khung 18 + lề tab 8, mỗi bên); khung lưới thêm `TREE_FRAME`. */
const paneOf = (vw: number): number => vw - 64;
const ALL: [string, TreeParams][] = [
	['DESKTOP', TREE_DESKTOP],
	['PHONE', TREE_PHONE],
	['LOW', TREE_LOW],
	['PHONE-360', fitPhoneTree(paneOf(360) - TREE_FRAME)],
	['PHONE-320', fitPhoneTree(paneOf(320) - TREE_FRAME)],
];

/** Cảnh giữa game của mock: Kiếm Thần 5, Hoả 5, Thuỷ 1, Phong 2, Băng 1, Thổ chưa mở. */
const MID = view({ sword: 5, fire: 5, water: 1, wind: 2, ice: 1, earth: 0 }, 'kiem_than', 20);
/** Ngã ba lưu phái: Kiếm 2, chưa chọn lưu phái. */
const FORK = view({ sword: 2, fire: 1, water: 1, wind: 1, ice: 1, earth: 0 }, null, 4);
/** Mở cả 6 nhánh, cấp cao. */
const FULL = view({ sword: 9, fire: 9, water: 5, wind: 3, ice: 2, earth: 1 }, 'bac_than', 40);

const byKey = (nodes: LaidNode[], key: string): LaidNode => {
	const n = nodes.find((x) => x.key === key);
	assert.ok(n, `thiếu nút ${key}`);
	return n;
};

console.log('talentTree');

// 19. Đủ 81 nút với cả 3 bộ thông số; số đoạn nối đúng.
test('19. đủ 81 nút (26 Kiếm + 50 nguyên tố + 5 kiếm pháp) và 78 đoạn nối ở cả 3 bộ thông số', () => {
	for (const [name, p] of ALL) {
		for (const t of [MID, FORK, FULL]) {
			const L = layoutTree(p, t);
			assert.equal(L.nodes.length, 81, `${name}: số nút`);
			assert.equal(L.nodes.filter((n) => n.branch === 'sword' && !n.art).length, 26, `${name}: nút Kiếm`);
			assert.equal(L.nodes.filter((n) => n.shape === 'art').length, 5, `${name}: kiếm pháp`);
			// 5 nguyên tố × 9 · Kiếm: 1→2, thân rẽ, 2 đoạn ngang (lưu phái giữa nằm ngay dưới tâm) + 3 đoạn xuống, 3 × 7 · 5 nhánh ngang kiếm pháp.
			assert.equal(L.edges.length, 45 + (1 + 1 + 2 + 3 + 21) + 5, `${name}: số đoạn nối`);
			assert.equal(new Set(L.nodes.map((n) => n.key)).size, 81, `${name}: khoá trùng`);
		}
	}
});

test('19b. toạ độ đúng công thức: cột, hàng, dải rẽ lưu phái, dải kiếm pháp — mọi số nguyên', () => {
	const p = TREE_DESKTOP;
	const L = layoutTree(p, MID);
	assert.equal(L.width, 462);
	assert.equal(L.rows[1], p.head + 6 + p.act / 2);
	assert.equal(L.rows[2], L.rows[1]! + p.step);
	assert.equal(L.rows[3], L.rows[2]! + p.step + p.forkBand);
	assert.equal(L.rows[6], L.rows[5]! + p.step + p.artBand);
	assert.equal(L.rows[10], L.rows[6]! + 4 * p.step);
	assert.equal(byKey(L.nodes, 'sword:1').x, p.ruler + p.swordCol * 1.5);
	assert.deepEqual(L.styleX, [52, 116, 180]);
	assert.equal(byKey(L.nodes, 'sword:thuy_than:3').x, 116);
	assert.equal(byKey(L.nodes, 'fire:1').x, 212 + 25);
	assert.equal(byKey(L.nodes, 'earth:10').x, 412 + 25);
	// Kiếm pháp: lệch trái nửa cột nguyên tố, ở giữa dải mốc 5–6.
	assert.equal(byKey(L.nodes, 'art:fire').x, 212);
	assert.equal(byKey(L.nodes, 'art:water').x, 262);
	assert.equal(byKey(L.nodes, 'art:fire').y, Math.round((L.rows[5]! + L.rows[6]!) / 2));
	for (const [, q] of ALL) {
		const M = layoutTree(q, FULL);
		for (const n of M.nodes) assert.ok(Number.isInteger(n.x) && Number.isInteger(n.y), `${n.key} toạ độ lẻ`);
		for (const e of M.edges) assert.ok([e.x1, e.y1, e.x2, e.y2].every(Number.isInteger), `đoạn ${e.from}→${e.to} toạ độ lẻ`);
	}
	assert.equal(layoutTree(TREE_PHONE, MID).width, 311);
	assert.equal(layoutTree(TREE_LOW, MID).width, 392);
});

// 20. Không hai nút nào chồng nhau (hộp + lề 2px); mọi nút nằm trong lưới; PHONE rộng ≤ 311.
test('20. không nút nào chồng nhau (lề 2px, thoi tính đúng hình thoi), mọi nút nằm trong [0, width] × [head, height]', () => {
	const M = 2;
	for (const [name, p] of ALL) {
		const L = layoutTree(p, MID);
		const half = artHalfDiagonal(p);
		const box = (n: LaidNode) => (n.shape === 'art' ? { x0: n.x - half, x1: n.x + half, y0: n.y - half, y1: n.y + half } : { x0: n.x - n.size / 2, x1: n.x + n.size / 2, y0: n.y - n.size / 2, y1: n.y + n.size / 2 });
		for (const n of L.nodes) {
			const b = box(n);
			assert.ok(b.x0 >= 0 && b.x1 <= L.width, `${name}: ${n.key} tràn ngang`);
			assert.ok(b.y0 >= p.head && b.y1 <= L.height, `${name}: ${n.key} tràn dọc (đè dải đầu cột hoặc đáy)`);
		}
		for (let i = 0; i < L.nodes.length; i += 1) {
			for (let j = i + 1; j < L.nodes.length; j += 1) {
				const a = L.nodes[i]!;
				const b = L.nodes[j]!;
				if (a.shape === 'art' || b.shape === 'art') {
					// Hình thoi tâm (cx, cy) bán kính L1 = nửa đường chéo: cắt hộp khi khoảng cách L1 từ tâm tới hộp ≤ bán kính.
					const [d, r] = a.shape === 'art' ? [a, b] : [b, a];
					const rb = box(r);
					if (r.shape === 'art') {
						assert.ok(Math.abs(d.x - r.x) + Math.abs(d.y - r.y) > 2 * half + M, `${name}: ${d.key} đè ${r.key}`);
						continue;
					}
					const dx = Math.max(0, rb.x0 - d.x, d.x - rb.x1);
					const dy = Math.max(0, rb.y0 - d.y, d.y - rb.y1);
					assert.ok(dx + dy > (p.art * Math.SQRT2) / 2 + M, `${name}: ${d.key} đè ${r.key} (L1 ${dx + dy})`);
					continue;
				}
				const ba = box(a);
				const bb = box(b);
				const apart = ba.x1 + M <= bb.x0 || bb.x1 + M <= ba.x0 || ba.y1 + M <= bb.y0 || bb.y1 + M <= ba.y0;
				assert.ok(apart, `${name}: ${a.key} đè ${b.key}`);
			}
		}
	}
	assert.ok(layoutTree(TREE_PHONE, FULL).width <= 311);
});

// 20b. Điện thoại dọc hẹp (360 / 320px): khung lưới (bề ngang + viền) vừa lòng tab ĐO THẬT — không tràn ngang (tab chỉ cuộn
// dọc, lớp phủ `touch-none`: tràn là mất hẳn cột Thổ). 375px trở lên giữ đúng bộ chuẩn 311.
test('20b. fitPhoneTree: khung lưới + viền ≤ lòng tab ở 320 / 360 / 375px, cỡ nút chẵn, đủ chỗ thì giữ TREE_PHONE', () => {
	for (const vw of [320, 360, 375, 390, 412]) {
		const p = fitPhoneTree(paneOf(vw) - TREE_FRAME);
		const L = layoutTree(p, FULL);
		assert.ok(L.width + TREE_FRAME <= paneOf(vw), `${vw}px: khung ${L.width + TREE_FRAME} > lòng tab ${paneOf(vw)}`);
		for (const k of ['act', 'pas', 'ult', 'art'] as const) assert.equal(p[k] % 2, 0, `${vw}px: cỡ nút ${k} lẻ`);
		assert.ok(p.act <= p.elemCol - 6 && p.act <= p.swordCol - 6, `${vw}px: nút chừa ≥ 6px giữa hai cột`);
	}
	assert.equal(fitPhoneTree(311), TREE_PHONE, 'đủ 311: giữ nguyên bộ chuẩn');
	assert.equal(fitPhoneTree(0), TREE_PHONE, 'chưa đo được: bộ chuẩn');
	assert.ok(layoutTree(fitPhoneTree(paneOf(375) - TREE_FRAME), FULL).width <= 307, '375px: khung 311 − viền → lưới ≤ 307 (không tràn 4px)');
});

// 21. Trạng thái theo fixture.
test('21. trạng thái: ngã ba 3 nút next · lưu phái khác dim · nhánh khoá locked · !ready soon · thiếu điểm next-poor', () => {
	const L = layoutTree(TREE_DESKTOP, FORK);
	// FORK: cấp 4 → 3 điểm, đã dùng 1 (Kiếm 2) → còn 2 = đúng giá mốc 3.
	assert.equal(FORK.unspent, 2);
	for (const s of SWORD_STYLES) assert.equal(byKey(L.nodes, `sword:${s}:3`).state, 'next', `${s} mốc 3`);
	for (const s of SWORD_STYLES) assert.equal(byKey(L.nodes, `sword:${s}:4`).state, 'future');
	assert.equal(byKey(L.nodes, 'sword:2').state, 'reached');
	// Thiếu điểm: cùng cây nhưng cấp 3 (2 điểm, đã dùng 1 → còn 1 < 2).
	const poor = layoutTree(TREE_DESKTOP, view({ sword: 2, fire: 1, water: 1, wind: 1, ice: 1 }, null, 3));
	for (const s of SWORD_STYLES) assert.equal(byKey(poor.nodes, `sword:${s}:3`).state, 'next-poor');
	assert.equal(byKey(poor.nodes, 'fire:2').state, 'next', 'Hoả 2 chỉ 1 điểm');

	const M = layoutTree(TREE_DESKTOP, MID);
	for (let tier = 3; tier <= 10; tier += 1) {
		assert.equal(byKey(M.nodes, `sword:thuy_than:${tier}`).state, 'dim');
		assert.equal(byKey(M.nodes, `sword:bac_than:${tier}`).state, 'dim');
	}
	assert.equal(byKey(M.nodes, 'sword:kiem_than:5').state, 'reached');
	assert.equal(byKey(M.nodes, 'sword:kiem_than:6').state, 'next');
	assert.equal(byKey(M.nodes, 'sword:kiem_than:7').state, 'future');
	assert.equal(byKey(M.nodes, 'sword:kiem_than:10').state, 'soon', 'mốc 10 chưa hiện thực');
	for (let tier = 1; tier <= 10; tier += 1) assert.equal(byKey(M.nodes, `earth:${tier}`).state, 'locked');
	assert.equal(byKey(M.nodes, 'fire:6').state, 'next');
	assert.equal(byKey(M.nodes, 'fire:10').state, 'soon');
	// Chạm trần mốc 9: không còn nấc kế, mốc 10 vẫn "sắp có" chứ không phải next.
	const F = layoutTree(TREE_DESKTOP, FULL);
	assert.equal(byKey(F.nodes, 'fire:9').state, 'reached');
	assert.equal(byKey(F.nodes, 'fire:10').state, 'soon');
	assert.equal(nodeState(MID, 'fire:6'), 'next');
	assert.equal(nodeState(MID, 'sword:bac_than:4'), 'dim');
	assert.equal(nodeState(MID, 'earth:1'), 'locked');
});

test('21b. đoạn nối: lit giữa hai nút đã đạt, next từ nút đạt tới nấc kế, soon tới nút sắp có, dim với lưu phái không theo', () => {
	const M = layoutTree(TREE_DESKTOP, MID);
	const edge = (from: string, to: string) => {
		const e = M.edges.find((x) => x.from === from && x.to === to);
		assert.ok(e, `thiếu đoạn ${from}→${to}`);
		return e;
	};
	assert.equal(edge('fire:4', 'fire:5').kind, 'lit');
	assert.equal(edge('fire:5', 'fire:6').kind, 'next');
	assert.equal(edge('fire:6', 'fire:7').kind, 'off');
	assert.equal(edge('fire:9', 'fire:10').kind, 'soon');
	assert.equal(edge('sword:kiem_than:5', 'sword:kiem_than:6').kind, 'next');
	assert.equal(edge('sword:thuy_than:3', 'sword:thuy_than:4').kind, 'dim');
	assert.equal(edge('earth:1', 'earth:2').kind, 'dim');
	// Rẽ lưu phái: đường tới lưu phái đang theo sáng, hai đường kia mờ.
	const toKiem = M.edges.filter((e) => e.to === 'sword:kiem_than:3');
	assert.ok(toKiem.length >= 2 && toKiem.every((e) => e.kind === 'lit'));
	assert.ok(M.edges.filter((e) => e.to === 'sword:bac_than:3').every((e) => e.kind === 'dim'));
	// Ngã ba chưa chọn: cả ba đường rẽ là "next".
	const K = layoutTree(TREE_DESKTOP, FORK);
	for (const s of SWORD_STYLES) assert.ok(K.edges.filter((e) => e.to === `sword:${s}:3`).every((e) => e.kind === 'next'), s);
	// Đường rẽ là gấp khúc vuông góc: đoạn nào cũng nằm ngang hoặc dọc.
	for (const e of K.edges) assert.ok(e.x1 === e.x2 || e.y1 === e.y2, `${e.from}→${e.to} chéo`);
});

// 22. Kiếm pháp.
test('22. kiếm pháp: nhánh ngang lit ⇔ elementOk; nút reached ⇔ learned', () => {
	for (const t of [MID, FORK, FULL]) {
		const L = layoutTree(TREE_DESKTOP, t);
		for (const a of t.arts) {
			const n = byKey(L.nodes, `art:${a.element}`);
			const e = L.edges.find((x) => x.to === n.key)!;
			assert.equal(e.kind === 'lit', a.elementOk, `${a.element}: đoạn ngang`);
			assert.equal(n.state === 'reached', a.learned, `${a.element}: nút`);
			assert.equal(e.y1, n.y);
			assert.equal(e.y2, n.y);
		}
	}
	// MID: Kiếm 5 + Hoả 5 → Liệt Hoả Trảm đã học; Thổ chưa mở → khoá.
	const L = layoutTree(TREE_DESKTOP, MID);
	assert.equal(byKey(L.nodes, 'art:fire').state, 'reached');
	assert.equal(byKey(L.nodes, 'art:water').state, 'future');
	assert.equal(byKey(L.nodes, 'art:earth').state, 'locked');
});

// 23. learnableNow.
test('23. learnableNow: nhánh mốc cao trước rồi giá tăng dần; bỏ nhánh khoá + nhánh chạm trần; có dòng ngã ba khi chưa chọn lưu phái', () => {
	// MID còn: 20 → 23 điểm, đã dùng 8 + 8 + 0 + 1 + 0 = 17 → còn 6.
	assert.equal(MID.unspent, 6);
	const now = learnableNow(MID);
	assert.deepEqual(
		now.map((s) => `${s.branch}${s.style ? `/${s.style}` : ''}:${s.tier}:${s.cost}`),
		['sword/kiem_than:6:3', 'fire:6:3', 'wind:3:2', 'water:2:1', 'ice:2:1'],
	);
	assert.ok(now.every((s) => s.branch !== 'earth'), 'nhánh khoá không có');
	assert.equal(now[0]!.key, 'sword:kiem_than:6');
	// Thiếu điểm thì không "học được ngay" nhưng vẫn là nấc kế.
	const broke = view({ sword: 5, fire: 5, water: 1, wind: 2, ice: 1 }, 'kiem_than', 18);
	assert.equal(broke.unspent, 3);
	assert.ok(nextSteps(broke).length === 5 && learnableNow(broke).every((s) => s.cost <= 3));
	// Chạm trần: Hoả 9 / Kiếm 9 không còn dòng nào.
	const capped = nextSteps(FULL);
	assert.ok(capped.every((s) => s.branch !== 'fire' && s.branch !== 'sword'));
	// Ngã ba.
	const fork = learnableNow(FORK);
	const row = fork.find((s) => s.branch === 'sword');
	assert.ok(row?.fork, 'có dòng ngã ba');
	assert.equal(row.tier, 3);
	assert.equal(row.cost, 2);
	assert.equal(row.name, 'chọn lưu phái');
	assert.equal(row.key, 'sword:kiem_than:3');
	assert.equal(fork[0]!.branch, 'sword', 'Kiếm 2 là nhánh mốc cao nhất');
});

test('lộ trình + tra khoá: routeTo cộng đúng giá, findNode/parseKey khớp, kiếm pháp không có lộ trình', () => {
	assert.deepEqual(parseKey('sword:bac_than:7'), { branch: 'sword', style: 'bac_than', tier: 7 });
	assert.deepEqual(parseKey('art:ice'), { branch: 'sword', tier: SWORD_ART_TIER, art: 'ice' });
	assert.deepEqual(parseKey('fire:6'), { branch: 'fire', tier: 6 });
	assert.equal(parseKey('nope:1'), null);
	assert.equal(findNode(MID, 'sword:3'), null, 'Kiếm mốc 3 chỉ có theo lưu phái');
	assert.equal(findNode(MID, 'fire:6')!.n.name, 'Tường Lửa');
	const r = routeTo(MID, 'fire:8')!;
	assert.deepEqual(r.keys, ['fire:6', 'fire:7', 'fire:8']);
	assert.equal(r.total, TIER_COST[6]! + TIER_COST[7]! + TIER_COST[8]!);
	assert.deepEqual(routeTo(FORK, 'sword:bac_than:4')!.keys, ['sword:bac_than:3', 'sword:bac_than:4']);
	assert.equal(routeTo(MID, 'fire:3'), null, 'đã đạt');
	assert.equal(routeTo(MID, 'sword:thuy_than:6'), null, 'lưu phái không theo');
	assert.equal(routeTo(MID, 'earth:3'), null, 'nhánh khoá');
	assert.equal(routeTo(MID, 'art:water'), null);
});

test('chi tiết nút: brief + số liệu tách khỏi desc, thưởng chiều sâu, mở kiếm pháp / phủ phép, mốc kế, ngã ba', () => {
	const fw = nodeInfo(MID, 'fire:6')!;
	assert.equal(fw.name, 'Tường Lửa');
	assert.equal(fw.kind, 'active');
	assert.equal(fw.state, 'next');
	assert.equal(fw.cost, 3);
	assert.equal(fw.bonusNow, 16);
	assert.equal(fw.bonusAt, 20);
	assert.ok(fw.stat.includes('MP') && fw.stat.includes('hồi'), fw.stat);
	assert.ok(fw.facts.length > fw.stat.length);
	assert.ok(!fw.brief.includes(' · '), 'brief chỉ là câu mô tả');
	assert.deepEqual(fw.next, { key: 'fire:7', tier: 7, name: 'Tro Tàn', cost: 4, ready: true });
	assert.equal(nodeAria(fw), 'Hoả mốc 6: Tường Lửa (chủ động, học được, 3 điểm)');
	// Băng lên mốc 5 khi Kiếm đã 5 → mở luôn kiếm pháp Băng + phủ phép Băng.
	const ice5 = nodeInfo(view({ sword: 5, ice: 4, fire: 1 }, 'kiem_than', 30), 'ice:5')!;
	assert.ok(ice5.opens.some((o) => o.startsWith('kiếm pháp')), ice5.opens.join());
	assert.ok(ice5.opens.includes('phủ phép Băng cho Kiếm'));
	// Kiếm lên mốc 5 khi Hoả đã 5 → mở Liệt Hoả Trảm.
	const sw5 = nodeInfo(view({ sword: 4, fire: 5 }, 'kiem_than', 30), 'sword:kiem_than:5')!;
	assert.deepEqual(sw5.opens, [`kiếm pháp ${HERO_SKILLS.find((s) => s.id === SWORD_ARTS.fire)!.name}`]);
	// Ngã ba: Kiếm 2 → mốc kế là ngã ba; nút mốc 3 có lối chơi để chọn.
	assert.deepEqual(nodeInfo(FORK, 'sword:2')!.next, { fork: true, tier: 3, cost: 2 });
	const k3 = nodeInfo(FORK, 'sword:thuy_than:3')!;
	assert.equal(k3.styleName, 'Thủy Thần');
	assert.ok(k3.styleChoice?.play.length);
	// Lưu phái không theo / nhánh khoá / kiếm pháp.
	assert.equal(nodeInfo(MID, 'sword:thuy_than:8')!.state, 'dim');
	assert.ok(nodeInfo(MID, 'earth:2')!.lockNote.length > 0);
	const art = nodeInfo(MID, 'art:water')!;
	assert.equal(art.kind, 'art');
	assert.deepEqual(art.artNeed, { swordTier: 5, swordOk: true, elementTier: 1, elementOk: false, elementName: 'Thuỷ', learned: false });
});

test('PASSIVE_TEMP: đủ mọi mốc bị động đã hiện thực, không lặp icon nhánh, frame/ảnh tồn tại', () => {
	// Đọc atlas thật — tránh khai frame không có (ô sẽ trống).
	const atlas = JSON.parse(readFileSync('public/assets/vfx/vfx.json', 'utf8')) as { frames: Record<string, unknown> };
	const frames = new Set(Object.keys(atlas.frames).map((k) => k.replace(/^vfx\//, '')));
	const branchIcon: Partial<Record<Branch, string>> = { sword: 'slash_2', fire: 'fire_orb_0', water: 'water_wave_0', wind: 'wind_spin_0', ice: 'ice_shard_0', earth: TEMP_ART.rock_throw?.icon };
	const need: string[] = [];
	for (const b of BRANCHES) for (const n of TREE[b]) if (n.kind === 'passive' && n.ready && n.tier < STYLE_TIER) need.push(passiveTempKey(b, n.tier));
	for (const b of BRANCHES) if (b !== 'sword') for (const n of TREE[b]) if (n.kind === 'passive' && n.ready) need.push(passiveTempKey(b, n.tier));
	for (const s of SWORD_STYLES) for (const n of STYLE_TREE[s]) if (n.kind === 'passive' && n.ready) need.push(passiveTempKey('sword', n.tier, s));
	for (const k of new Set(need)) assert.ok(PASSIVE_TEMP[k], `thiếu icon tạm ${k}`);
	for (const [k, v] of Object.entries(PASSIVE_TEMP)) {
		if ('vfx' in v) {
			assert.ok(frames.has(v.vfx), `${k}: atlas không có frame ${v.vfx}`);
			const b = k.split(':')[0] as Branch;
			if (branchIcon[b]) assert.notEqual(v.vfx, branchIcon[b], `${k} lặp icon nhánh`);
		} else assert.ok(existsSync(`public${v.ui}`), `${k}: thiếu ảnh ${v.ui}`);
	}
});

console.log(`\n${passed} test qua.`);

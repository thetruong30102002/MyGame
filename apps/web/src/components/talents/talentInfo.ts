/**
 * Chi tiết một nút trên cây Tiềm năng cho cột bên / sheet điện thoại / tooltip / chế độ Từng nhánh (đặc tả cây mục 1.3) —
 * HÀM THUẦN. Số liệu kỹ năng đọc thẳng từ dữ liệu chiến đấu (`skills.ts`, `talents.ts`), không thêm trường vào
 * `TalentsView` (hợp đồng store giữ nguyên): `desc` của mốc chủ động gộp cả câu mô tả lẫn số liệu nên ở đây tách lại
 * thành `brief` (một câu) + `facts` (kiểu đòn · uy lực · MP · hồi).
 */
import { HERO_SKILLS, isSwordSkill, powerText, skillFacts, type SkillDef, type SkillKind } from '../../game/combat/skills';
import {
	BRANCH_NAME,
	DEPTH_BONUS,
	depthBonus,
	ENCHANT_ELEMENT_TIER,
	ENCHANT_SWORD_TIER,
	ENCHANT_UP_TIER,
	enchantDesc,
	passiveEffects,
	REACTION_NAME,
	REACTION_PAIR,
	reactionBonus,
	REACTION_PER_TIER,
	SKILL_NODE,
	STYLE_TIER,
	SWORD_ART_TIER,
	SWORD_STYLE_INFO,
	type Branch,
	type SwordStyle,
	type Tiers,
} from '../../game/combat/talents';
import type { BranchId, ElementId, EnchantId, SwordStyleId, TalentsView } from '../../store/useGameStore';
import { findNode, nodeKey, nodeState, parseKey, routeTo, styleKey, type NodeState } from './treeLayout';

export type NodeKind = 'active' | 'passive' | 'ult' | 'art';

export const KIND_LABEL: Record<NodeKind, string> = { active: 'Chủ động', passive: 'Bị động', ult: 'Tuyệt kỹ', art: 'Kiếm pháp' };

export interface NodeInfo {
	key: string;
	branch: BranchId;
	style?: SwordStyleId;
	art?: EnchantId;
	tier: number;
	kind: NodeKind;
	name: string;
	/** "Hoả" / "Kiếm" (kiếm pháp: tên nguyên tố của nó). */
	branchName: string;
	/** Tên lưu phái của nút ("Thủy Thần"). */
	styleName?: string;
	/** "Hoả · mốc 6 · chủ động" — bên vẽ tự viết hoa. */
	kicker: string;
	skillId?: string;
	/** Một câu mô tả. */
	brief: string;
	/** Số liệu đầy đủ ("Tường dài 120 … · uy lực ×0,5 mỗi nhịp đốt · 18 MP · hồi 10s"); bị động = ''. */
	facts: string;
	/** Số liệu ngắn cho cột bên hẹp ("18 MP · hồi 10 giây"). */
	stat: string;
	state: NodeState;
	ready: boolean;
	/** Giá lên mốc này (kiếm pháp = 0). */
	cost: number;
	/** Thưởng chiều sâu (%) nhánh đang có / sẽ có khi đạt mốc này. */
	bonusNow: number;
	bonusAt: number;
	/** Đạt mốc này thì mở luôn: "kiếm pháp Liệt Hoả Trảm", "phủ phép Hoả cho Kiếm". */
	opens: string[];
	/** Mốc kế trong cùng cột ("Kế: mốc 7 Tro Tàn · 4đ"); `fork` = mốc kế là ngã ba lưu phái. */
	next: { key: string; tier: number; name: string; cost: number; ready: boolean } | { fork: true; tier: number; cost: number } | null;
	/** Lộ trình tới nút chưa đạt (các khoá phải cộng + tổng điểm). */
	route: { keys: string[]; total: number } | null;
	lockNote: string;
	/** Kiếm pháp: điều kiện Kiếm 5 + nguyên tố 5. */
	artNeed?: { swordTier: number; swordOk: boolean; elementTier: number; elementOk: boolean; elementName: string; learned: boolean };
	/** Nút mốc 3 của lưu phái khi CHƯA chọn: lối chơi + phủ phép hợp để chọn. */
	styleChoice?: { play: string; enchants: string };
}

const ELEMENT_NAME = BRANCH_NAME;

const num = (n: number): string => String(Number(n.toFixed(2))).replace('.', ',');

/** Câu mô tả + số liệu của một kỹ năng (tách khỏi `skillDesc` vốn gộp làm một). */
export function skillBrief(id: string): { brief: string; facts: string; stat: string } {
	const s = HERO_SKILLS.find((d) => d.id === id);
	if (!s) return { brief: '', facts: '', stat: '' };
	const mp = s.mpCost ? `${s.mpCost} MP` : 'không tốn MP';
	return {
		brief: s.desc ?? '',
		facts: [...skillFacts(s), powerText(s), mp, `hồi ${num(s.cooldown)}s`].join(' · '),
		stat: `${mp} · hồi ${num(s.cooldown)} giây`,
	};
}

const pctAt = (tier: number): number => Math.round(DEPTH_BONUS * 100 * Math.max(0, tier - 1));

export function nodeInfo(t: TalentsView, key: string): NodeInfo | null {
	const k = parseKey(key);
	if (!k) return null;
	const state = nodeState(t, key);
	const sword = t.branches.find((b) => b.branch === 'sword');
	const tierOf = (b: BranchId): number => t.branches.find((x) => x.branch === b)?.tier ?? 0;

	if (k.art) {
		const a = t.arts.find((x) => x.element === k.art);
		if (!a) return null;
		const sk = skillBrief(a.skillId);
		const eb = t.branches.find((b) => b.branch === k.art);
		return {
			key,
			branch: 'sword',
			art: k.art,
			tier: SWORD_ART_TIER,
			kind: 'art',
			name: a.name,
			branchName: a.elementName,
			kicker: `Kiếm pháp · Kiếm ${SWORD_ART_TIER} + ${a.elementName} ${SWORD_ART_TIER}`,
			skillId: a.skillId,
			...sk,
			state,
			ready: true,
			cost: 0,
			bonusNow: 0,
			bonusAt: 0,
			opens: [],
			next: null,
			route: null,
			lockNote: !sword?.unlocked ? sword?.lockNote || 'Nhánh Kiếm chưa mở' : !eb?.unlocked ? eb?.lockNote || `Nhánh ${a.elementName} chưa mở` : '',
			artNeed: { swordTier: tierOf('sword'), swordOk: a.swordOk, elementTier: tierOf(k.art), elementOk: a.elementOk, elementName: a.elementName, learned: a.learned },
		};
	}

	const f = findNode(t, key);
	if (!f) return null;
	const { b, n, s } = f;
	const kind: NodeKind = n.tier >= 10 ? 'ult' : n.kind;
	const sk = n.skillId && n.ready ? skillBrief(n.skillId) : null;
	const st = b.styleTier ?? STYLE_TIER;

	// Mốc kế trong cùng cột (Kiếm mốc 2 → ngã ba nếu chưa chọn lưu phái).
	let next: NodeInfo['next'] = null;
	const nt = n.tier + 1;
	if (nt <= 10) {
		if (b.branch === 'sword' && !s && nt === st && b.styles?.length) {
			const chosen = b.style ? b.styles.find((x) => x.id === b.style) : undefined;
			const nn = chosen?.nodes.find((x) => x.tier === nt);
			next = chosen && nn ? { key: styleKey(chosen.id, nt), tier: nt, name: nn.name, cost: nn.cost, ready: nn.ready } : { fork: true, tier: nt, cost: b.styles[0]!.nodes[0]?.cost ?? 0 };
		} else {
			const nn = s ? s.nodes.find((x) => x.tier === nt) : b.nodes.find((x) => x.tier === nt);
			if (nn) next = { key: s ? styleKey(s.id, nt) : nodeKey(b.branch, nt), tier: nt, name: nn.name, cost: nn.cost, ready: nn.ready };
		}
	}

	// Đạt mốc này mở thêm gì (kiếm pháp: Kiếm 5 + hệ 5; phủ phép: Kiếm 2 + hệ 5) — chỉ khi nước đi này HOÀN TẤT điều kiện.
	const opens: string[] = [];
	if (state !== 'reached' && state !== 'dim' && state !== 'locked') {
		if (b.branch === 'sword' && n.tier === SWORD_ART_TIER) for (const a of t.arts) if (a.elementOk && !a.learned) opens.push(`kiếm pháp ${a.name}`);
		if (b.branch !== 'sword' && n.tier === SWORD_ART_TIER) {
			const a = t.arts.find((x) => x.element === b.branch);
			if (a && a.swordOk && !a.learned) opens.push(`kiếm pháp ${a.name}`);
		}
		const enchantOpen = (e: EnchantId): void => {
			const o = t.enchant.options.find((x) => x.id === e);
			if (o && !o.ok) opens.push(`phủ phép ${ELEMENT_NAME[e]} cho Kiếm`);
		};
		if (b.branch === 'sword' && n.tier === ENCHANT_SWORD_TIER) for (const e of t.enchant.options) if (tierOf(e.id) >= ENCHANT_ELEMENT_TIER) enchantOpen(e.id);
		if (b.branch !== 'sword' && n.tier === ENCHANT_ELEMENT_TIER && tierOf('sword') >= ENCHANT_SWORD_TIER) enchantOpen(b.branch as EnchantId);
		// Mốc 7 nguyên tố: phủ phép của hệ đó mạnh lên (chỉ báo khi kiếm đang phủ được hệ này).
		if (b.branch !== 'sword' && n.tier === ENCHANT_UP_TIER && t.enchant.options.find((x) => x.id === b.branch)?.ok) {
			opens.push(`phủ phép ${ELEMENT_NAME[b.branch as EnchantId]} mạnh hơn: ${enchantDesc(b.branch as EnchantId, ENCHANT_UP_TIER)}`);
		}
	}

	const styleName = s ? SWORD_STYLE_INFO[s.id].name : undefined;
	return {
		key,
		branch: b.branch,
		...(s ? { style: s.id, styleName } : {}),
		tier: n.tier,
		kind,
		name: n.name,
		branchName: b.name,
		kicker: `${s ? styleName : b.name} · mốc ${n.tier} · ${KIND_LABEL[kind].toLowerCase()}`,
		...(n.skillId ? { skillId: n.skillId } : {}),
		brief: sk ? sk.brief || n.desc : n.desc,
		facts: sk?.facts ?? '',
		stat: sk?.stat ?? '',
		state,
		ready: n.ready,
		cost: n.cost,
		bonusNow: b.bonusPct,
		bonusAt: pctAt(n.tier),
		opens,
		next,
		route: routeTo(t, key),
		lockNote: b.unlocked ? '' : b.lockNote,
		...(s && !b.style && n.tier === st ? { styleChoice: { play: SWORD_STYLE_INFO[s.id].play, enchants: SWORD_STYLE_INFO[s.id].enchants } } : {}),
	};
}

const STATE_WORD: Record<NodeState, string> = {
	reached: 'đã đạt',
	next: 'học được',
	'next-poor': 'thiếu điểm',
	future: 'chưa tới',
	soon: 'sắp có',
	dim: 'thuộc lưu phái khác',
	locked: 'nhánh chưa mở',
};

/** Nhãn đọc màn hình theo mẫu "Hoả mốc 6: Tường Lửa (chủ động, học được, 3 điểm)". */
export function nodeAria(i: NodeInfo): string {
	const where = i.kind === 'art' ? `Kiếm pháp ${i.branchName}` : `${i.styleName ?? i.branchName} mốc ${i.tier}`;
	const price = (i.state === 'next' || i.state === 'next-poor') && i.cost ? `, ${i.cost} điểm` : '';
	return `${where}: ${i.name} (${KIND_LABEL[i.kind].toLowerCase()}, ${STATE_WORD[i.state]}${price})`;
}

// ———————————————————————————— số liệu kỹ năng cho cột chi tiết ————————————————————————————

/** Mốc từng nhánh + lưu phái Kiếm đọc lại từ `TalentsView` (để gọi lại các hàm luật của `talents.ts`). */
export function tiersOf(t: TalentsView): { tiers: Tiers; style: SwordStyle | null } {
	const tiers: Tiers = Object.fromEntries(t.branches.map((b) => [b.branch, b.tier]));
	return { tiers, style: t.branches.find((b) => b.branch === 'sword')?.style ?? null };
}

/** Tên kiểu đòn (ô "Kiểu" của bảng số liệu). */
export const KIND_NAME: Record<SkillKind, string> = {
	projectile: 'Đạn bay',
	melee: 'Chém',
	spin: 'Xoay chém',
	dash: 'Lướt',
	heal: 'Hồi máu',
	aoe_self: 'Vùng quanh mình',
	aoe_target: 'Vùng nhắm',
	cone: 'Hình nón',
	line: 'Đường thẳng',
	pillar: 'Cột trồi',
	zone: 'Vùng duy trì',
	guard: 'Thế đỡ',
	blink: 'Ra sau lưng',
	wall: 'Tường',
	ward: 'Khiên phản đạn',
	barrage: 'Mưa nhiều điểm',
	summon: 'Triệu hồi',
};

/** Tên hệ (ô "Hệ"). */
export const ELEMENT_LABEL: Record<ElementId, string> = { aether: 'Aether', fire: 'Hoả', water: 'Thuỷ', wind: 'Phong', healing: 'Hồi phục', steel: 'Thép', ice: 'Băng', earth: 'Thổ' };

export interface SkillSheet {
	id: string;
	element: ElementId;
	/** "Hoả", "Thép"… */
	elementName: string;
	/** Đòn Kiếm: tính theo sức kiếm + Nhịp Chém; đòn thép ăn phủ phép, kiếm pháp giữ hệ riêng. */
	blade: boolean;
	kindName: string;
	mp: number;
	/** Hồi chiêu gốc và hồi chiêu với bị động ĐANG có (Nhịp Chém, Thuận Gió) — `CombatSystem.cooldownOf` trừ Đà Lướt. */
	cooldown: number;
	cooldownNow: number;
	cooldownBy: string[];
	/** Uy lực ghi theo kiểu đòn, bỏ chữ "uy lực" ("×0,25 mỗi nhịp đốt", "hồi 35% máu tối đa"). */
	power: string;
	/** Hệ số sau thưởng chiều sâu ("≈ ×0,3") — rỗng khi đòn không gây sát thương. */
	powerNow: string;
	/** Thưởng chiều sâu áp cho kỹ năng (%) và nhánh nào cho ("Hoả mốc 6"). */
	depthPct: number;
	depthFrom: string;
	/** Câu tả hình dạng đòn (tầm, bán kính, thời gian…) và hiệu ứng lên mục tiêu (đẩy lùi, choáng, chí mạng…). */
	how: string[];
	effects: string[];
}

/**
 * Bảng số liệu một kỹ năng, đọc thẳng từ `HERO_SKILLS` + luật `talents.ts` (không bịa số): câu tả + hiệu ứng tách bằng chính
 * `skillFacts` của gói sim (gọi trên bản sao bỏ `hit`/`crit` → chỉ còn câu tả; đổi `kind` sang kiểu không có câu tả → chỉ
 * còn hiệu ứng). `atTier`: mốc học của nút — nút chưa đạt thì thưởng chiều sâu tính ở mốc đó (lúc học xong nhánh ít nhất ở đó).
 */
export function skillSheet(t: TalentsView, id: string, atTier = 0): SkillSheet | null {
	const s: SkillDef | undefined = HERO_SKILLS.find((d) => d.id === id);
	if (!s) return null;
	const { tiers, style } = tiersOf(t);
	const fx = passiveEffects(tiers, style);
	const sword = isSwordSkill(s);
	const cdMul = (sword ? fx.swordCooldown : 1) * fx.cooldown;
	const cooldownBy = [...(sword && fx.swordCooldown < 1 ? ['Nhịp Chém'] : []), ...(fx.cooldown < 1 ? ['Thuận Gió'] : [])];
	const node = SKILL_NODE[s.id];
	let depth = 1;
	let depthFrom = '';
	if (node?.art) {
		const a = Math.max(tiers.sword ?? 0, SWORD_ART_TIER);
		const e = Math.max(tiers[node.art] ?? 0, SWORD_ART_TIER);
		depth = depthBonus(Math.min(a, e));
		depthFrom = `nhánh yếu hơn: ${a <= e ? `Kiếm mốc ${a}` : `${BRANCH_NAME[node.art]} mốc ${e}`}`;
	} else if (node) {
		const at = Math.max(tiers[node.branch] ?? 0, atTier, node.tier);
		depth = depthBonus(at);
		depthFrom = `${BRANCH_NAME[node.branch]} mốc ${at}`;
	}
	const scaled = s.power * depth;
	const powerNow = s.power <= 0 || depth === 1 ? '' : s.kind === 'heal' ? `≈ ${Math.round(scaled * 100)}% máu tối đa` : `≈ ×${num(scaled)}`;
	const p = powerText(s);
	return {
		id: s.id,
		element: s.element,
		elementName: ELEMENT_LABEL[s.element],
		blade: sword,
		kindName: KIND_NAME[s.kind],
		mp: s.mpCost,
		cooldown: s.cooldown,
		cooldownNow: Math.round(s.cooldown * cdMul * 100) / 100,
		cooldownBy,
		power: p.startsWith('uy lực ') ? p.slice('uy lực '.length) : p.charAt(0).toUpperCase() + p.slice(1),
		powerNow,
		depthPct: Math.round((depth - 1) * 100),
		depthFrom,
		how: skillFacts({ ...s, hit: undefined, crit: undefined }),
		effects: skillFacts({ ...s, kind: 'heal', afterGuard: undefined }),
	};
}

/** Số theo kiểu Việt ("0,25"). */
export const fmtNum = (n: number): string => num(n);

/** Một dòng số liệu ngắn cho danh sách: "18 MP · hồi 9s · ×0,25 mỗi nhịp đốt" (hồi chiêu đã tính bị động đang có). */
export const statLine = (sk: SkillSheet): string => `${sk.mp ? `${sk.mp} MP` : 'không tốn MP'} · hồi ${num(sk.cooldownNow)}s · ${sk.power.charAt(0).toLowerCase()}${sk.power.slice(1)}`;

export interface ReactionRow {
	id: keyof typeof REACTION_PAIR;
	name: string;
	a: Branch;
	b: Branch;
	/** Thưởng phản ứng hiện có (%): +5% mỗi mốc trên mốc 1 của hệ yếu hơn. */
	pct: number;
	/** Thưởng nếu hệ yếu hơn lên thêm một mốc. */
	nextPct: number;
}

/**
 * Phản ứng song hệ giữa các nhánh ĐÃ HỌC (cả hai ≥ mốc 1), thưởng cao trước. Nhánh nguyên tố mở mà chưa học mốc 1 (luật
 * 10/10/2026) chưa có phép nào để tạo phản ứng nên chưa liệt kê.
 */
export function reactionRows(t: TalentsView): ReactionRow[] {
	const { tiers } = tiersOf(t);
	const open = new Set(t.branches.filter((b) => b.unlocked && b.tier >= 1).map((b) => b.branch));
	return (Object.entries(REACTION_PAIR) as [keyof typeof REACTION_PAIR, [Branch, Branch]][])
		.filter(([, [a, b]]) => open.has(a) && open.has(b))
		.map(([id, [a, b]]) => {
			const lo = Math.min(tiers[a] ?? 0, tiers[b] ?? 0);
			return { id, name: REACTION_NAME[id], a, b, pct: Math.round((reactionBonus(tiers, a, b) - 1) * 100), nextPct: Math.round(REACTION_PER_TIER * 100 * Math.max(0, lo)) };
		})
		.sort((x, y) => y.pct - x.pct);
}

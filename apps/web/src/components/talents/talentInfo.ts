/**
 * Chi tiết một nút trên cây Tiềm năng cho cột bên / sheet điện thoại / tooltip / chế độ Từng nhánh (đặc tả cây mục 1.3) —
 * HÀM THUẦN. Số liệu kỹ năng đọc thẳng từ dữ liệu chiến đấu (`skills.ts`, `talents.ts`), không thêm trường vào
 * `TalentsView` (hợp đồng store giữ nguyên): `desc` của mốc chủ động gộp cả câu mô tả lẫn số liệu nên ở đây tách lại
 * thành `brief` (một câu) + `facts` (kiểu đòn · uy lực · MP · hồi).
 */
import { HERO_SKILLS, powerText, skillFacts } from '../../game/combat/skills';
import { BRANCH_NAME, DEPTH_BONUS, ENCHANT_ELEMENT_TIER, ENCHANT_SWORD_TIER, ENCHANT_UP_TIER, enchantDesc, STYLE_TIER, SWORD_ART_TIER, SWORD_STYLE_INFO } from '../../game/combat/talents';
import type { BranchId, EnchantId, SwordStyleId, TalentsView } from '../../store/useGameStore';
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

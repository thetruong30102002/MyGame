/**
 * Dựng `TalentsView` (dữ liệu bảng Tiềm năng của store) từ trạng thái THUẦN: mốc từng nhánh, cấp, lưu phái Kiếm, mã cốt
 * truyện đã mở, phủ phép, thanh 10 ô. Tách khỏi `Game.talentsView` để phòng thử `/lab/inventory?talents=demo` dựng được
 * đúng dữ liệu thật mà không cần chạy game — Game gọi lại hàm này nên hai nơi không bao giờ lệch nhau.
 * Không đụng Pixi / DOM: test node gọi thẳng được.
 */
import type { TalentsView } from '../store/useGameStore';
import { HERO_SKILLS } from './combat/skills';
import {
	BRANCH_LOCK_NOTE,
	BRANCH_NAME,
	BRANCHES,
	branchOpen,
	canEnchant,
	depthBonus,
	describeBuild,
	ENCHANT_ELEMENT_TIER,
	ENCHANT_SWORD_TIER,
	ENCHANTS,
	enchantDesc,
	knowsSkill,
	MAX_TIER,
	nextTierCost,
	pointsForLevel,
	resetCost,
	skillDesc,
	SLOT_KEYS,
	spentPoints,
	STYLE_TIER,
	STYLE_TREE,
	SWORD_ART_TIER,
	SWORD_ARTS,
	SWORD_STYLE_INFO,
	SWORD_STYLES,
	tierCap,
	tierCost,
	TREE,
	treeOf,
	unspent,
	type Branch,
	type EnchantId,
	type Loadout,
	type SwordStyle,
	type Tiers,
	type TreeNode,
} from './combat/talents';

/** Tên phủ phép trên bảng Tiềm năng và trong thông báo đổi phủ phép. */
export const ENCHANT_LABEL: Record<EnchantId, string> = { fire: 'Kiếm Lửa', water: 'Kiếm Thuỷ', wind: 'Kiếm Phong', ice: 'Kiếm Băng', earth: 'Kiếm Thổ' };

export interface TalentsInput {
	/** Mốc hiện tại từng nhánh (`StoryDirector.talentTiers`). */
	tiers: Tiers;
	level: number;
	/** Lưu phái Kiếm đang theo (null = chưa chọn). */
	style: SwordStyle | null;
	/** Mã cốt truyện đã mở (`StoryDirector.isUnlocked`). */
	isUnlocked: (unlockId: string) => boolean;
	/** Phủ phép đang có tác dụng + giây còn lại tới lúc đổi được (chưa làm tròn). */
	enchant: EnchantId | null;
	enchantCooldown: number;
	/** Thanh 10 ô hiện tại (đã kẹp). */
	loadout: Loadout;
}

/** Kỹ năng đang biết theo thứ tự `HERO_SKILLS`: mã cốt truyện + mốc nhánh đủ + đúng lưu phái Kiếm (như `Game.knownSkills`). */
export function knownSkillIds(tiers: Tiers, isUnlocked: (unlockId: string) => boolean, style: SwordStyle | null): string[] {
	return HERO_SKILLS.filter((s) => knowsSkill(s, tiers, isUnlocked, style)).map((s) => s.id);
}

/** Bảng tiềm năng: cây 6 nhánh (kể cả nhánh chưa mở — hiện khoá để người chơi biết còn gì phía trước), phủ phép, thanh 10 ô. */
export function buildTalentsView(input: TalentsInput): TalentsView {
	const { tiers, level, style, isUnlocked } = input;
	const build = describeBuild(tiers, style);
	const points = pointsForLevel(level);
	// Giá theo nhánh: nguyên tố mốc 1 = 1 điểm (học kỹ năng đầu), Kiếm mốc 1 = 0 (Trảm có sẵn khi nhận kiếm) — `tierCost`.
	const nodeView = (b: Branch, n: TreeNode, tier: number) => ({ tier: n.tier, kind: n.kind, name: n.name, desc: n.desc, ready: n.ready, reached: tier >= n.tier, cost: tierCost(b, n.tier), ...(n.skillId ? { skillId: n.skillId } : {}) });
	const branches = BRANCHES.map((b) => {
		const tier = tiers[b] ?? 0;
		// Mở / chưa mở theo mã cốt truyện: nhánh nguyên tố đã mở mà chưa học vẫn `unlocked` ở mốc 0 (nút mốc 1 = "Học · 1 điểm").
		const unlocked = branchOpen(b, isUnlocked);
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
			nextCost: nextTierCost(tiers, b, isUnlocked),
			iconSkill: first?.ready && first.skillId ? first.skillId : null,
			nodes: treeOf(b, style).map((n) => nodeView(b, n, tier)),
			// Kiếm: 3 lưu phái từ mốc 3 — chưa chọn thì hiện cả ba để chọn; đã chọn thì hai lưu phái kia mờ.
			...(b === 'sword'
				? {
						style,
						styleTier: STYLE_TIER,
						styles: SWORD_STYLES.map((s) => ({ id: s, ...SWORD_STYLE_INFO[s], chosen: style === s, iconSkill: STYLE_TREE[s][0]?.skillId ?? null, nodes: STYLE_TREE[s].map((n) => nodeView(b, n, style === s ? tier : 0)) })),
					}
				: {}),
		};
	});
	// Kiếm pháp nguyên tố: hiện cả khi chưa đủ điều kiện (biết đường mà nuôi), kèm điều kiện + đã học chưa.
	const arts = (Object.entries(SWORD_ARTS) as [EnchantId, string][]).flatMap(([e, id]) => {
		const s = HERO_SKILLS.find((d) => d.id === id);
		if (!s) return [];
		const swordOk = (tiers.sword ?? 0) >= SWORD_ART_TIER;
		const elementOk = (tiers[e] ?? 0) >= SWORD_ART_TIER;
		return [
			{
				skillId: id,
				name: s.name,
				desc: skillDesc(id),
				element: e,
				elementName: BRANCH_NAME[e],
				need: `Kiếm mốc ${SWORD_ART_TIER} + ${BRANCH_NAME[e]} mốc ${SWORD_ART_TIER}`,
				swordOk,
				elementOk,
				learned: knowsSkill(s, tiers, isUnlocked, style),
			},
		];
	});
	const enchantOptions = ENCHANTS.map((e) => ({
		id: e,
		name: ENCHANT_LABEL[e],
		ok: canEnchant(tiers, e),
		need: `Kiếm mốc ${ENCHANT_SWORD_TIER} + ${BRANCH_NAME[e]} mốc ${ENCHANT_ELEMENT_TIER}`,
		desc: enchantDesc(e, tiers[e] ?? 0),
	}));
	return {
		points,
		spent: spentPoints(tiers),
		unspent: unspent(level, tiers),
		buildKind: build.kind,
		buildLabel: build.label,
		buildDetail: build.detail,
		branches,
		resetCost: resetCost(level),
		// Hồi chiêu làm tròn lên giây: trùng JSON thì store không ghi (bảng không vẽ lại mỗi frame).
		enchant: { current: input.enchant, cooldown: Math.ceil(input.enchantCooldown), options: enchantOptions },
		loadout: input.loadout.map((skillId, slot) => ({ slot, key: SLOT_KEYS[slot]!, skillId })),
		arts,
		learned: knownSkillIds(tiers, isUnlocked, style).flatMap((id) => {
			const s = HERO_SKILLS.find((d) => d.id === id);
			return s ? [{ id: s.id, name: s.name, element: s.element }] : [];
		}),
	};
}

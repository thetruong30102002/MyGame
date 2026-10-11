// Luật dựng bộ chiêu cho trang Thử chiêu (`/thu-chieu`, `SkillLab`): người chơi chọn lưu phái Kiếm + các nguyên tố, sân tập cho
// MỌI nhánh đã chọn lên mốc cao nhất đã hiện thực (thấy trọn bộ chiêu + bị động), rồi xếp thanh 10 ô. Hàm thuần — có test
// (`tests/skilllab.test.ts`), không đụng Pixi.
import { HERO_SKILLS, type HeroPath } from './combat/skills';
import {
	canEnchant,
	knowsSkill,
	SKILL_NODE,
	SLOT_COUNT,
	SWORD_ARTS,
	treeOf,
	ULT_TIER,
	type Branch,
	type EnchantId,
	type Loadout,
	type SwordStyle,
	type Tiers,
	type TreeNode,
} from './combat/talents';

/** Lựa chọn ở bảng bên của trang Thử chiêu. */
export interface LabBuild {
	/** Lưu phái Kiếm (null = chỉ Trảm + Nhịp Chém như người chưa lên Kiếm mốc 3). */
	style: SwordStyle | null;
	/** Các nguyên tố đang thử (thứ tự bấm chọn). */
	elements: EnchantId[];
	/** Con đường 16 tuổi: đổi mạnh / yếu kiếm – phép, không khoá chiêu. */
	path: HeroPath | null;
	/** Phủ phép kiếm — chỉ có khi đã chọn lưu phái và nguyên tố đó. */
	enchant: EnchantId | null;
}

export const EMPTY_BUILD: LabBuild = { style: null, elements: [], path: null, enchant: null };

/** Hồi chiêu tối đa ở sân tập (giây) — chủ dự án 10/10/2026: "trong phòng tập skill 1s hồi chiêu". */
export const LAB_COOLDOWN = 1;

/** Cấp nhân vật ở sân tập (đủ điểm cho mọi mốc; quái gọi ra cùng cấp). */
export const LAB_LEVEL = 30;

/**
 * Mốc từng nhánh theo lựa chọn: nhánh chọn = mốc 10 (gồm TUYỆT KỸ — chỉ có ở phòng tập: game thật dừng ở mốc 9, chủ dự án
 * 10/10/2026 "mở skill 10 ở phòng tập thôi"); Kiếm không chọn lưu phái = mốc 2 (Trảm + Nhịp Chém).
 */
export function labTiers(b: LabBuild): Tiers {
	const tiers: Tiers = { sword: b.style ? ULT_TIER : 2 };
	for (const e of b.elements) tiers[e] = ULT_TIER;
	return tiers;
}

/** Mọi mã cốt truyện coi như đã mở (kiếm gỗ, trượng, các nhánh). */
const ALL_OPEN = (): boolean => true;

/** Kỹ năng đã biết theo bộ chọn — thứ tự `HERO_SKILLS`. */
export function labKnown(b: LabBuild): string[] {
	const tiers = labTiers(b);
	return HERO_SKILLS.filter((s) => knowsSkill(s, tiers, ALL_OPEN, b.style)).map((s) => s.id);
}

/**
 * Thanh mặc định: J = Trảm, K = Tia Aether, ô 1–8 lần lượt TUYỆT KỸ (lưu phái rồi từng nguyên tố — thứ người ta vào đây để thử) →
 * chiêu lưu phái → kiếm pháp nguyên tố → chiêu từng nguyên tố (theo thứ tự đã chọn, mốc thấp trước). Hết ô thì phần còn lại nằm ở
 * danh sách bên cạnh để tự gán.
 */
export function labLoadout(b: LabBuild): Loadout {
	const known = new Set(labKnown(b));
	const order: string[] = ['slash', 'aether_bolt'];
	const byTier = (ids: string[]) => ids.sort((x, y) => (SKILL_NODE[x]?.tier ?? 0) - (SKILL_NODE[y]?.tier ?? 0));
	order.push(...HERO_SKILLS.filter((s) => s.ult && SKILL_NODE[s.id]?.style === b.style && b.style).map((s) => s.id));
	for (const e of b.elements) order.push(...HERO_SKILLS.filter((s) => s.ult && SKILL_NODE[s.id]?.branch === e).map((s) => s.id));
	if (b.style) order.push(...byTier(HERO_SKILLS.filter((s) => SKILL_NODE[s.id]?.style === b.style).map((s) => s.id)));
	for (const e of b.elements) order.push(SWORD_ARTS[e]);
	for (const e of b.elements) order.push(...byTier(HERO_SKILLS.filter((s) => { const n = SKILL_NODE[s.id]; return n?.branch === e && !n.art; }).map((s) => s.id)));
	const lo: Loadout = Array.from({ length: SLOT_COUNT }, () => null);
	let at = 0;
	for (const id of order) {
		if (!known.has(id) || lo.includes(id)) continue;
		if (at >= SLOT_COUNT) break;
		lo[at] = id;
		at += 1;
	}
	return lo;
}

/** Phủ phép còn hợp lệ với bộ chọn không (bỏ chọn nguyên tố / lưu phái thì tắt). */
export function labEnchant(b: LabBuild): EnchantId | null {
	if (!b.enchant || !b.style || !b.elements.includes(b.enchant)) return null;
	return canEnchant(labTiers(b), b.enchant) ? b.enchant : null;
}

/** Bị động đang có của các nhánh đã chọn (để bảng bên liệt kê). */
export function labPassives(b: LabBuild): { branch: Branch; node: TreeNode }[] {
	const tiers = labTiers(b);
	const branches: Branch[] = ['sword', ...b.elements];
	return branches.flatMap((br) => treeOf(br, br === 'sword' ? b.style : null).filter((n) => n.kind === 'passive' && n.ready && n.tier <= (tiers[br] ?? 0)).map((node) => ({ branch: br, node })));
}

/** Bật / tắt một nguyên tố trong bộ chọn (giữ thứ tự bấm). */
export function toggleElement(b: LabBuild, e: EnchantId): LabBuild {
	const elements = b.elements.includes(e) ? b.elements.filter((x) => x !== e) : [...b.elements, e];
	const next = { ...b, elements };
	return { ...next, enchant: labEnchant(next) };
}

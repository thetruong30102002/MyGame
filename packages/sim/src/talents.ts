import { COUNTER, EARTH_ENCHANT, ENCHANT_FX, type ReactionId } from './skillRules.ts';
import { HERO_SKILLS, powerText, skillFacts } from './skills.ts';

/**
 * Cây Nguyên tố (kế hoạch `docs/ke-hoach-nguyen-to.md`, chốt 07/10/2026): điểm tiềm năng cộng vào NHÁNH, không cộng vào
 * từng kỹ năng. 6 nhánh × 10 mốc; mỗi mốc tốn điểm theo `TIER_COST`, mỗi mốc trên mốc 1 cho +4% sức mạnh mọi kỹ năng
 * của nhánh. Mỗi nhánh 6 mốc chủ động (học kỹ năng) + 4 mốc bị động.
 * Mở nhánh (cốt truyện) = ĐƯỢC PHÉP học (chủ dự án 10/10/2026): nhánh nguyên tố vừa mở ở mốc 0, mốc 1 (kỹ năng đầu — Hoả
 * Cầu, Thuỷ Tiễn…) mua bằng điểm như mọi mốc. Riêng Kiếm giữ mốc 1 miễn phí (`FREE_FIRST_TIER`: Trảm = đòn J, nhận kiếm
 * gỗ là chém được).
 * Tia Aether là năng lực bẩm sinh — NGOÀI cây, mạnh dần theo cấp.
 * Thuần dữ liệu + hàm — CombatSystem/Game/HUD đọc, test node gọi thẳng (chỉ import KIỂU, không kéo Pixi vào test).
 */
export type Branch = 'sword' | 'kiem_than' | 'thuy_than' | 'bac_than' | 'fire' | 'water' | 'wind' | 'ice' | 'earth';

/** Thứ tự nhánh trên bảng Tiềm năng (Kiếm trước, rồi các nguyên tố theo thứ tự mở trong cốt truyện, Thổ cuối). */
export const BRANCHES: readonly Branch[] = ['sword', 'kiem_than', 'thuy_than', 'bac_than', 'fire', 'water', 'wind', 'ice', 'earth'];

export const BRANCH_NAME: Record<Branch, string> = {
	sword: 'Kiếm',
	kiem_than: 'Kiếm Thần',
	thuy_than: 'Thủy Thần',
	bac_than: 'Bắc Thần',
	fire: 'Hoả',
	water: 'Thuỷ',
	wind: 'Phong',
	ice: 'Băng',
	earth: 'Thổ',
};

/**
 * Nhánh → mã mở khoá trong cốt truyện (`StoryDirector.isUnlocked`). Kiếm mở bằng QUÀ (kiếm gỗ của cha) nên mã là tên
 * món quà. Thổ: mã `earth` do nhiệm vụ tuổi 16 “Sợi tơ màu đất” trao (bia đá cổ ở Nghĩa địa Hoàng Hôn — `youth.ts`);
 * bản lưu đã qua mốc truyện đó được bù mã lúc nạp (`StoryDirector.migrate`). Lưới an toàn tuổi 16 của Game KHÔNG trao Thổ.
 */
export const BRANCH_UNLOCK: Record<Branch, string> = {
	sword: 'sword',
	kiem_than: 'sword',
	thuy_than: 'sword',
	bac_than: 'sword',
	fire: 'fire',
	water: 'water',
	wind: 'wind',
	ice: 'ice',
	earth: 'earth',
};

/**
 * Luật lớp + nguyên tố (chủ dự án 11/10/2026): "chỉ cho chọn 1 phép nguyên tố — lúc cộng tiềm năng sẽ được chọn"; "Kiếm thì học
 * skill tuỳ, không cần chọn phái, chỉ được tăng skill phái đó — tự do build"; "chọn Kiếm sĩ hay Pháp sư thì chỉ còn lại kiếm hoặc
 * trượng". Nên: 3 lưu phái Kiếm là 3 NHÁNH riêng (mốc phái t tương đương mốc Kiếm cũ t + `STYLE_OFFSET`, cùng giá), mở khi Kiếm
 * ≥ mốc `STYLE_NEEDS_SWORD`; mỗi nhân vật chỉ cộng điểm vào MỘT nhánh nguyên tố (`chosenElement`, đổi = tẩy điểm bằng kim cương);
 * Kiếm sĩ không có nhánh phép để tung (nguyên tố chỉ để Bọc nguyên tố vào kiếm + kiếm pháp), Pháp sư không có nhánh Kiếm.
 */
export const ELEMENTS: readonly Branch[] = ['fire', 'water', 'wind', 'ice', 'earth'];
export const STYLE_BRANCHES: readonly Branch[] = ['kiem_than', 'thuy_than', 'bac_than'];
/** Mốc phái t ⇔ mốc Kiếm cũ t + 2 (giá, thưởng chiều sâu, mốc bị động giữ nguyên như trước khi tách). */
export const STYLE_OFFSET = 2;
/** Kiếm phải ≥ mốc này mới cộng điểm vào phái. */
export const STYLE_NEEDS_SWORD = 2;
export function isStyleBranch(b: string): boolean {
	return (STYLE_BRANCHES as readonly string[]).includes(b);
}
export function isElementBranch(b: string): boolean {
	return (ELEMENTS as readonly string[]).includes(b);
}
/** Nhánh nguyên tố đã chọn (mốc cao nhất, bằng nhau lấy theo thứ tự `ELEMENTS`); null = chưa chọn. */
export function chosenElement(tiers: Tiers): Branch | null {
	let best: Branch | null = null;
	for (const e of ELEMENTS) if ((tiers[e] ?? 0) > 0 && (best === null || (tiers[e] ?? 0) > (tiers[best] ?? 0))) best = e;
	return best;
}
/** Lớp nhân vật: 'none' = chưa chọn (tuổi thơ — học được cả kiếm lẫn phép). */
export type PathId = 'none' | 'sword' | 'mage';
/** Lớp này được cộng điểm vào nhánh `b` không: Pháp sư không có nhánh Kiếm / phái. */
export function pathAllowsBranch(path: PathId, b: Branch): boolean {
	return path !== 'mage' || !(b === 'sword' || isStyleBranch(b));
}

/**
 * Lời nhắc riêng khi nhánh CHƯA mở (thiếu thì bảng ghi "Mở theo cốt truyện"). Chỉ là chữ — nhánh mở hay không do mã cốt
 * truyện quyết.
 */
export const BRANCH_LOCK_NOTE: Partial<Record<Branch, string>> = { earth: 'Mở ở nhiệm vụ “Sợi tơ màu đất” (tuổi 16, Nghĩa địa Hoàng Hôn)' };

export const MAX_TIER = 10;
/** Cấp tối đa của nhân vật (100 — `@aether/protocol`, máy chủ kẹp cùng số). */
export { MAX_LEVEL } from '@aether/protocol';
/**
 * Điểm tiềm năng DỪNG ở cấp này: `pointsForLevel(40)` = 47 điểm = 1 nhánh master (Kiếm 29, nguyên tố 30) + ~60% nhánh nữa —
 * cây thiết kế cho đúng số đó. Trần cấp lên 100 (08/10/2026) mà điểm cứ tăng thì cấp 100 có ~119 điểm → master 3–4 nhánh, phá
 * luật "1 master + nhánh phụ". Cấp 41–100 chỉ tăng chỉ số gốc + mở đồ bậc cao.
 */
export const TALENT_LEVEL_CAP = 40;

/**
 * Giá để lên mốc `t` từ mốc `t − 1` (chỉ số = mốc) — như nhau ở mọi nhánh, trừ Kiếm mốc 1 miễn phí (`tierCost`). Mốc 1 = học
 * kỹ năng đầu của nhánh nguyên tố: 1 điểm (chủ dự án 10/10/2026; trước đó mở nhánh là có mốc 1 miễn phí — bản lưu cũ chuyển ở
 * `StoryDirector`, định dạng `talentsV` 3). Tổng mốc 2→10 = 29 điểm; nguyên tố cả mốc 1 = 30.
 */
export const TIER_COST: readonly number[] = [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5];

/**
 * Nhánh có mốc 1 MIỄN PHÍ ngay khi mở: chỉ Kiếm (Trảm = đòn J — nhận kiếm gỗ là chém được, bài tập kiếm tuổi 6 dùng luôn).
 * Nhánh nguyên tố: mở nhánh chỉ là được phép học, mốc 1 phải mua.
 */
export const FREE_FIRST_TIER: readonly Branch[] = ['sword'];

/** Mốc của nhánh lúc VỪA MỞ (chưa cộng điểm nào): Kiếm 1 (Trảm có sẵn), nguyên tố 0 (chưa học gì). */
export function baseTier(b: Branch): number {
	return FREE_FIRST_TIER.includes(b) ? 1 : 0;
}

/** Giá lên mốc `t` của nhánh `b`: mốc nhánh có sẵn khi mở (Kiếm mốc 1) = 0, còn lại theo `TIER_COST`. */
export function tierCost(b: Branch, t: number): number {
	if (t <= baseTier(b)) return 0;
	return TIER_COST[isStyleBranch(b) ? t + STYLE_OFFSET : t] ?? 0;
}

/** Điểm tiềm năng có tới cấp `level`: 1 điểm mỗi lần lên cấp + 1 điểm thưởng ở mỗi mốc 5 cấp — tính tới `TALENT_LEVEL_CAP`. */
export function pointsForLevel(level: number): number {
	const lv = Math.min(TALENT_LEVEL_CAP, Math.max(1, Math.floor(level)));
	return lv - 1 + Math.floor(lv / 5);
}

/**
 * Điểm tiềm năng THƯỞNG (trang quản trị cộng — chủ dự án 10/10/2026): MÁY CHỦ giữ ở `CharacterProgress.bonusPoints`, cộng thêm vào
 * điểm theo cấp ở MỌI chỗ tính điểm — `talentPoints`, `unspent`, `addTier`, kẹp bản lưu ở StoryDirector (`cleanTalents`,
 * `migrateTalentsV2`) và bảng Tiềm năng. Quên một chỗ là lần nạp sau mốc mua bằng điểm thưởng bị cắt. Không theo trần cấp 40.
 */
export const TALENT_BONUS_CAP = 999;

/** Kẹp điểm thưởng nhận từ mạng / CSDL: số nguyên 0…`TALENT_BONUS_CAP` (số lạ / vắng = 0). */
export function cleanBonusPoints(v: unknown): number {
	const n = Math.floor(Number(v));
	return Number.isFinite(n) ? Math.max(0, Math.min(TALENT_BONUS_CAP, n)) : 0;
}

/** Tổng điểm tiềm năng: theo cấp (`pointsForLevel`) + điểm thưởng `bonus` (chơi một mình = 0). */
export function talentPoints(level: number, bonus = 0): number {
	return pointsForLevel(level) + cleanBonusPoints(bonus);
}

/**
 * Tổng điểm để nhánh `b` đi từ lúc vừa mở lên mốc `tier`. Nguyên tố: m1 = 1, m2 = 2, m3 = 4, m4 = 6, m5 = 9 … m10 = 30;
 * Kiếm (mốc 1 miễn phí): m1 = 0, m2 = 1, m3 = 3, m4 = 5, m5 = 8 … m10 = 29.
 */
export function pointsToTier(tier: number, b: Branch): number {
	let sum = 0;
	for (let t = 1; t <= Math.min(MAX_TIER, Math.floor(tier)); t += 1) sum += tierCost(b, t);
	return sum;
}

// ———————————————————————————— dữ liệu cây ————————————————————————————

export type NodeKind = 'active' | 'passive';

export interface TreeNode {
	tier: number;
	kind: NodeKind;
	name: string;
	desc: string;
	/** Kỹ năng chủ động học được ở mốc này (id trong `HERO_SKILLS`); bị động thì không có. */
	skillId?: string;
	/** Đã hiện thực trong game. false = "Sắp có": hiện tên + mô tả, không cộng điểm vượt quá được. */
	ready: boolean;
}

/** Mốc chủ động (học kỹ năng): 1, 3, 5, 6, 8, 10. Còn lại (2, 4, 7, 9) là bị động. */
const ACTIVE_TIERS = new Set([1, 3, 5, 6, 8, 10]);

type NodeSpec = [name: string, desc: string, extra?: { skillId?: string; ready?: boolean }];

/** `offset`: mốc phái t có kiểu (chủ động / bị động) của mốc Kiếm cũ t + offset. */
function branchNodes(specs: NodeSpec[], offset = 0): TreeNode[] {
	return specs.map(([name, desc, extra], i) => {
		const tier = i + 1;
		return { tier, kind: ACTIVE_TIERS.has(tier + offset) ? 'active' : 'passive', name, desc, ready: !!extra?.ready, ...(extra?.skillId ? { skillId: extra.skillId } : {}) };
	});
}

const READY = { ready: true } as const;

/**
 * Số liệu bị động mốc 2, 4 (GĐ1–2) và 7, 9 (GĐ3). Mốc 2 CHỈ tăng chính nguyên tố đó (rải 1 điểm để "nhặt" bị động chẳng
 * giúp gì cho build khác); bị động chung (tốc chạy, phòng thủ, hồi chiêu, hút máu, chí mạng) từ mốc 4 trở lên. Mốc 7/9 là
 * lõi của nhánh master: phần lớn làm mạnh CƠ CHẾ riêng của nguyên tố (cháy lan, mưa hồi máu, đóng băng lâu, choáng…).
 */
export const PASSIVE = {
	/** Kiếm 2 · Nhịp Chém: tốc chém +10% (hồi chiêu đòn Kiếm chia 1,1). */
	swordHaste: 0.1,
	/** Kiếm 4 · Mắt Tinh (Kiếm Thần): chí mạng +8 điểm % — đúng logic Kiếm Tâm của GĐ1 (bản lưu Kiếm mốc 4 cũ chuyển sang đây). */
	crit: 0.08,
	/** Kiếm 4 · Tâm Tĩnh (Thủy Thần): đứng yên (≥ `skillRules.GUARD.still` giây) hoặc đang giữ thế → nhận sát thương ×0,85. */
	calm: 0.85,
	/** Kiếm 4 · Nhẹ Như Gió (Bắc Thần): tốc chạy +10% (nhân chồng với Thuận Gió), né tốn 70% thể lực (gặp Mắt Bão: lấy mức rẻ hơn). */
	swiftMove: 1.1,
	swiftDodge: 0.7,
	/** Hoả 2 · Mồi Lửa: cháy lâu +50% (3 → 4,5 giây, thêm 3 nhịp đốt). */
	burn: 1.5,
	/** Hoả 4 · Tim Lò: +20% sát thương mọi đòn vào mục tiêu đang cháy. */
	burning: 1.2,
	/** Thuỷ 2 · Thấm Sâu: ướt lâu +50% (4 → 6 giây) và quái đang ướt còn 90% tốc. */
	wet: 1.5,
	wetSlow: 0.9,
	/** Thuỷ 4 · Huyết Thuỷ: đòn hệ Thuỷ hồi máu bằng 5% sát thương gây ra. */
	lifesteal: 0.05,
	/** Phong 2 · Gió Sắc: phép Phong bay nhanh + xa +20%. */
	windShot: 1.2,
	/** Phong 4 · Thuận Gió: hồi chiêu mọi kỹ năng −10%, tốc chạy +10%. */
	cooldown: 0.9,
	moveSpeed: 1.1,
	/** Băng 2 · Hàn Khí: Băng làm lạnh lâu +60% (2,5 → 4 giây) và lạnh sâu: quái còn 35% tốc thay vì 50%. */
	chill: 1.6,
	frostSlow: 0.35,
	/** Băng 4 · Giáp Sương: nhận sát thương −10%. */
	damageTaken: 0.9,
	/** Thổ 2 · Đá Nặng: phép Thổ đẩy lùi xa hơn + choáng/hất lâu hơn 50%. */
	earthCC: 1.5,
	/** Thổ 4 · Da Đá: phòng thủ +15% (và không bị đẩy lùi — quái hiện chưa có đòn đẩy người chơi). */
	defense: 1.15,
	// ——— GĐ3: mốc 7 + mốc 9 ———
	/**
	 * Hoả 7 · Tro Tàn: quái chết lúc đang cháy nổ lan lửa sang quái gần — uy lực (× sức phép × thưởng chiều sâu Hoả), bán
	 * kính, số đợt dây chuyền tối đa (nổ giết quái đang cháy thì nổ tiếp, quá chừng này đợt thì thôi), trễ mỗi đợt (giây).
	 */
	emberPower: 1,
	emberRadius: 85,
	emberChain: 4,
	emberDelay: 0.12,
	/** Hoả 9 · Hoả Thân: sát thương thiêu đốt (mỗi nhịp cháy, cả Dung Nham) ×1,5. Kháng cháy: CHỈ LÀ CỜ — quái chưa đốt được người chơi. */
	burnDamage: 1.5,
	/** Thuỷ 7 · Mạch Nguồn: đứng trong mưa của mình (Gọi Mưa) mỗi giây hồi chừng này phần máu tối đa + chừng này MP. */
	springHp: 0.03,
	springMp: 4,
	/** Thuỷ 9 · Thuỷ Triều Dâng: hút máu đòn Thuỷ lên 12% (thay 5% của Huyết Thuỷ); quái đang ướt nhận ×1,15 từ mọi nguồn. */
	tideLifesteal: 0.12,
	tideWet: 1.15,
	/**
	 * Phong 7 · Mắt Bão: né tốn 50% thể lực; né xong tốc chạy ×1,15 trong 2 giây. Có cả Nhẹ Như Gió thì lấy mức giảm MẠNH
	 * NHẤT (50%), không nhân chồng: 0,7 × 0,5 = 8,75 thể lực một cú né thì né liền 11 lần, i-frame phủ ~79% thời gian.
	 */
	eyeDodge: 0.5,
	eyeHaste: 1.15,
	eyeSeconds: 2,
	/** Phong 9 · Gió Loạn: quái trúng đòn hệ Phong đánh trượt 20% trong 3 giây (Bão Cát 40% vẫn thắng nếu đang dính cả hai). */
	gustMiss: 0.2,
	gustSeconds: 3,
	/** Băng 7 · Hàn Tâm: thời gian đóng băng ×1,5 (phản ứng Đóng Băng, Băng Trụ, Hàn Băng Trảm; boss vẫn một nửa). */
	deepFreeze: 1.5,
	/**
	 * Băng 9 · Vỡ Vụn: đánh quái đang đóng băng ×1,4; khi băng trên quái tan / vỡ (hết giờ, Tan Chảy, Vỡ Vụn của Thổ, quái
	 * chết) thì nổ vụn băng trúng quái quanh (× sức phép × thưởng chiều sâu Băng, hệ Băng — ướt thì Đóng Băng tiếp).
	 */
	frozenBonus: 1.4,
	shardPower: 0.6,
	shardRadius: 80,
	/**
	 * Vụn băng Đóng Băng quái ướt tối đa chừng này ĐỢT lan: quái bị chính vụn băng đóng băng thì lúc nó tan, vụn của nó chỉ
	 * làm lạnh. Không chặn thì Gọi Mưa (làm ướt lại mỗi 0,5s) + vụn băng tự đóng băng nhau mãi — một Băng Tiễn khoá cả bầy.
	 */
	shardChain: 1,
	/** Thổ 7 · Trọng Lực: đòn hệ Thổ làm chậm (còn 80% tốc, 2 giây); quái đang choáng nhận ×1,2 từ mọi đòn. */
	gravitySlow: 0.8,
	gravitySeconds: 2,
	gravityStunned: 1.2,
	/** Thổ 9 · Núi Thiêng: máu tối đa ×1,15; đứng yên từ 1 giây thì mỗi giây hồi 2% máu tối đa. */
	mountainHp: 1.15,
	mountainRegen: 0.02,
	mountainStill: 1,
	// ——— GĐ3 lượt B: mốc 7 + mốc 9 của 3 lưu phái Kiếm ———
	/**
	 * Kiếm Thần 7 · Thế Áp Đảo: mỗi NHÁT Kiếm trúng liên tiếp (chém, xoay chém, vệt lướt chém, luồng kiếm / kiếm bay trúng lần
	 * đầu) +5% sát thương mọi đòn Kiếm, tối đa 5 lần (+25%); một nhát chém hụt hẳn, hoặc 3 giây không nhát nào trúng → về 0.
	 */
	pressStep: 0.05,
	pressMax: 5,
	pressWindow: 3,
	/** Kiếm Thần 9 · Bất Khuất: máu dưới 30% → công +20% (mọi đòn ×1,2) + hút máu 5% mọi sát thương gây ra. */
	rageHp: 0.3,
	rageAtk: 1.2,
	rageDrain: 0.05,
	/**
	 * Thủy Thần 7 · Phản Đòn: né / đỡ ĐÚNG LÚC (`skillRules.COUNTER.perfect`) → nhát phản chắc chắn chí mạng. Né đúng lúc (không
	 * có thế đỡ) tự chém trả kẻ đánh với uy lực này (× sức kiếm × thưởng chiều sâu Kiếm); đạn thì hất ngược về kẻ bắn.
	 */
	ripostePower: 1.6,
	/**
	 * Thủy Thần 9 · Mặt Hồ Phẳng: mỗi lần phản đòn thành công (chặn-phản, đỡ-phản, gạt đạn, né đúng lúc) hồi 5% máu tối đa —
	 * cách nhau ít nhất `lakeCooldown` giây (một loạt 3 viên đạn gạt cùng lúc / bầy cùng chém vào thế đỡ chỉ hồi một lần).
	 */
	lakeHeal: 0.05,
	lakeCooldown: 1,
	/** Bắc Thần 7 · Đà Lướt: né xong, 3 đòn Kiếm kế (trong 3 giây) nhanh hơn 25% — hồi chiêu và động tác ÷1,25. */
	momentumHits: 3,
	momentumSpeed: 1.25,
	momentumSeconds: 3,
	/** Bắc Thần 9 · Bóng Mờ: mỗi đòn đánh vào (chém, đạn, đòn vùng) có 15% bị né hoàn toàn. */
	evade: 0.15,
} as const;

const pct = (k: number) => Math.round(Math.abs(k - 1) * 100);
/** Phần trăm của một tỉ lệ (0,03 → 3). */
const pc100 = (k: number) => Math.round(k * 100);
const fmt = (n: number) => String(Number(n.toFixed(2))).replace('.', ',');

/**
 * Mô tả nấc chủ động sinh từ CHÍNH số liệu kỹ năng (`skills.ts`) — chỉnh số một chỗ, bảng Tiềm năng tự đúng (cả khu
 * Kiếm pháp nguyên tố).
 */
export function skillDesc(id: string): string {
	const s = HERO_SKILLS.find((d) => d.id === id);
	if (!s) return id;
	const cost = s.mpCost ? `${s.mpCost} MP` : 'không tốn MP';
	return [s.desc ?? '', [...skillFacts(s), powerText(s), cost, `hồi ${fmt(s.cooldown)}s`].join(' · ')].filter(Boolean).join(' ');
}

const active = (id: string): NodeSpec => [HERO_SKILLS.find((d) => d.id === id)?.name ?? id, skillDesc(id), { skillId: id, ready: true }];
/**
 * Tuyệt kỹ mốc 10 (GĐ4, 10/10/2026): nút gắn kỹ năng nhưng `ready: false` — game thật không cộng điểm tới (trần nhánh vẫn mốc 9,
 * `tierCap`), chỉ phòng tập `/thu-chieu` đặt thẳng mốc 10 (chủ dự án: "mở skill 10 ở phòng tập thôi").
 */
const ult = (id: string): NodeSpec => [HERO_SKILLS.find((d) => d.id === id)?.name ?? id, skillDesc(id), { skillId: id, ready: false }];
/** Mốc của tuyệt kỹ. */
export const ULT_TIER = 10;

// ———————————————————————————— Kiếm: 3 lưu phái (kế hoạch 2.7 + bảng 3.1) ————————————————————————————

/** Lưu phái Kiếm — mã lưu ở `SaveData.swordStyle`: chỉ được THÊM, không đổi tên. */
export type SwordStyle = 'kiem_than' | 'thuy_than' | 'bac_than';
export const SWORD_STYLES: readonly SwordStyle[] = ['kiem_than', 'thuy_than', 'bac_than'];
/** Mốc Kiếm cũ nơi bắt đầu kỹ năng lưu phái (= mốc 1 của nhánh phái). Giữ cho dữ liệu cũ / bản lưu `swordStyle`. */
export const STYLE_TIER = 3;

/** Tên, lối chơi, phủ phép hợp (bảng 2.7) — bảng Tiềm năng hiện để người chơi chọn. */
export const SWORD_STYLE_INFO: Record<SwordStyle, { name: string; play: string; enchants: string }> = {
	kiem_than: { name: 'Kiếm Thần', play: 'Tấn công: nhát chém nặng, chí mạng, lướt chém xuyên hàng quái.', enchants: 'Hợp phủ Hoả (dồn sát thương), Thổ (phá giáp chồng phá giáp).' },
	thuy_than: { name: 'Thủy Thần', play: 'Tĩnh: giữ thế, chặn và phản đòn, đứng vững thì ít mất máu.', enchants: 'Hợp phủ Thuỷ (phản đòn kèm hút máu), Băng (phản đòn làm lạnh).' },
	bac_than: { name: 'Bắc Thần', play: 'Nhanh nhẹn: lướt không trúng đòn, ra sau lưng, chém chí mạng.', enchants: 'Hợp phủ Phong, Băng (chém nhanh cộng dồn đóng băng).' },
};

/**
 * Mốc 3–10 của từng lưu phái. Lượt B GĐ2: mốc 3 + 5 (chủ động) và mốc 4 (bị động). GĐ3 lượt B: mốc 6 + 8 (chủ động — số liệu
 * ở `skills.ts`, mô tả sinh từ số liệu) và mốc 7 + 9 (bị động — `PASSIVE`). Mốc 10 (tuyệt kỹ) "Sắp có" — GĐ4.
 */
const STYLE_SPECS: Record<SwordStyle, NodeSpec[]> = {
	kiem_than: [
		active('heavy_strike'),
		['Mắt Tinh', `Chí mạng +${Math.round(PASSIVE.crit * 100)}%.`, READY],
		active('pierce_rush'),
		active('sunder_strike'),
		[
			'Thế Áp Đảo',
			`Mỗi nhát Kiếm trúng liên tiếp +${pc100(PASSIVE.pressStep)}% sát thương đòn Kiếm (tối đa ${PASSIVE.pressMax} lần = +${pc100(PASSIVE.pressStep * PASSIVE.pressMax)}%); chém hụt hẳn hoặc ${PASSIVE.pressWindow} giây không trúng thì về 0.`,
			READY,
		],
		active('blade_wave'),
		['Bất Khuất', `Dưới ${pc100(PASSIVE.rageHp)}% máu: công +${pct(PASSIVE.rageAtk)}%, hút máu ${pc100(PASSIVE.rageDrain)}% mọi sát thương gây ra.`, READY],
		ult('judgment'),
	],
	thuy_than: [
		active('calm_stance'),
		['Tâm Tĩnh', `Đứng yên hoặc đang giữ thế: nhận sát thương −${pct(PASSIVE.calm)}%.`, READY],
		active('flowing_counter'),
		active('backflow'),
		[
			'Phản Đòn',
			`Né đúng lúc (đòn quái chạm trong ${fmt(COUNTER.perfect)} giây sau khi bấm né) hoặc đỡ đúng lúc (Lưu Thủy Phản; Thế Tĩnh trong ${fmt(COUNTER.perfect)} giây đầu): nhát phản chắc chắn chí mạng. Né đúng lúc tự chém trả kẻ đánh (×${fmt(PASSIVE.ripostePower)}) hoặc hất đạn ngược về kẻ bắn.`,
			READY,
		],
		active('whirlpool'),
		['Mặt Hồ Phẳng', `Mỗi lần phản đòn thành công (chặn-phản, đỡ-phản, gạt đạn, né đúng lúc) hồi ${pc100(PASSIVE.lakeHeal)}% máu tối đa — tối đa một lần mỗi ${fmt(PASSIVE.lakeCooldown)} giây.`, READY],
		ult('still_heaven'),
	],
	bac_than: [
		active('side_slash'),
		['Nhẹ Như Gió', `Tốc chạy +${pct(PASSIVE.swiftMove)}%, né tốn ít thể lực hơn ${pct(PASSIVE.swiftDodge)}%.`, READY],
		active('shadow_step'),
		active('chain_slash'),
		['Đà Lướt', `Né xong, ${PASSIVE.momentumHits} đòn Kiếm kế (trong ${PASSIVE.momentumSeconds} giây) nhanh hơn ${pct(PASSIVE.momentumSpeed)}%.`, READY],
		active('flying_sword'),
		['Bóng Mờ', `${pc100(PASSIVE.evade)}% né hoàn toàn một đòn (chém, đạn, đòn vùng).`, READY],
		ult('thousand_shadows'),
	],
};

/** Cây riêng của từng lưu phái — nay là nhánh riêng, mốc 1–8 (mốc Kiếm cũ 3–10). */
export const STYLE_TREE: Record<SwordStyle, TreeNode[]> = {
	kiem_than: branchNodes(STYLE_SPECS.kiem_than, STYLE_OFFSET),
	thuy_than: branchNodes(STYLE_SPECS.thuy_than, STYLE_OFFSET),
	bac_than: branchNodes(STYLE_SPECS.bac_than, STYLE_OFFSET),
};

/** Cây 6 nhánh × 10 mốc (tên/hiệu ứng theo bảng mục 3 của kế hoạch, đã duyệt 07/10/2026). Mốc chưa hiện thực để `ready: false`. */
export const TREE: Record<Branch, TreeNode[]> = {
	sword: branchNodes([active('slash'), ['Nhịp Chém', `Tốc chém +${Math.round(PASSIVE.swordHaste * 100)}% (đòn Kiếm hồi nhanh hơn).`, READY]]),
	kiem_than: STYLE_TREE.kiem_than,
	thuy_than: STYLE_TREE.thuy_than,
	bac_than: STYLE_TREE.bac_than,
	fire: branchNodes([
		active('fire_bolt'),
		['Mồi Lửa', `Cháy lâu hơn ${pct(PASSIVE.burn)}%.`, READY],
		active('flame_ring'),
		['Tim Lò', `+${pct(PASSIVE.burning)}% sát thương mọi đòn vào mục tiêu đang cháy.`, READY],
		active('fire_blast'),
		active('fire_wall'),
		['Tro Tàn', `Quái chết lúc đang cháy nổ lan lửa sang quái gần (×${fmt(PASSIVE.emberPower)} sức phép, bán kính ${PASSIVE.emberRadius}) — nổ dây chuyền tối đa ${PASSIVE.emberChain} đợt.`, READY],
		active('meteor'),
		['Hoả Thân', `Sát thương thiêu đốt +${pct(PASSIVE.burnDamage)}%, kháng cháy.`, READY],
		ult('phoenix'),
	]),
	water: branchNodes([
		active('water_lance'),
		['Thấm Sâu', `Ướt lâu hơn ${pct(PASSIVE.wet)}% (thêm thời gian gây phản ứng); quái đang ướt chậm ${pct(PASSIVE.wetSlow)}%.`, READY],
		active('heal'),
		['Huyết Thuỷ', `Hút máu: đòn hệ Thuỷ hồi máu bằng ${Math.round(PASSIVE.lifesteal * 100)}% sát thương gây ra.`, READY],
		active('tidal_wave'),
		active('call_rain'),
		['Mạch Nguồn', `Đứng trong mưa của mình (Gọi Mưa): mỗi giây hồi ${pc100(PASSIVE.springHp)}% máu tối đa + ${PASSIVE.springMp} MP.`, READY],
		active('thunder_rain'),
		['Thuỷ Triều Dâng', `Hút máu đòn Thuỷ lên ${pc100(PASSIVE.tideLifesteal)}%; quái đang ướt nhận thêm ${pct(PASSIVE.tideWet)}% sát thương từ mọi nguồn.`, READY],
		ult('great_flood'),
	]),
	wind: branchNodes([
		active('wind_blade'),
		['Gió Sắc', `Phép Phong bay nhanh và xa hơn ${pct(PASSIVE.windShot)}%.`, READY],
		active('cyclone'),
		['Thuận Gió', `Hồi chiêu mọi kỹ năng −${pct(PASSIVE.cooldown)}%, tốc chạy +${pct(PASSIVE.moveSpeed)}%.`, READY],
		active('gale_dash'),
		active('gale_fan'),
		['Mắt Bão', `Né tốn ít thể lực hơn ${pct(PASSIVE.eyeDodge)}% (không cộng dồn với Nhẹ Như Gió); né xong tốc chạy +${pct(PASSIVE.eyeHaste)}% trong ${PASSIVE.eyeSeconds} giây.`, READY],
		active('tornado'),
		['Gió Loạn', `Quái trúng đòn hệ Phong đánh trượt ${pc100(PASSIVE.gustMiss)}% trong ${PASSIVE.gustSeconds} giây.`, READY],
		ult('heaven_wind'),
	]),
	ice: branchNodes([
		active('ice_shard'),
		['Hàn Khí', `Băng làm lạnh lâu hơn ${pct(PASSIVE.chill)}% và chậm hơn (quái còn ${Math.round(PASSIVE.frostSlow * 100)}% tốc).`, READY],
		active('frost_field'),
		['Giáp Sương', `Nhận sát thương −${pct(PASSIVE.damageTaken)}%.`, READY],
		active('ice_spire'),
		active('ice_mirror'),
		['Hàn Tâm', `Thời gian đóng băng +${pct(PASSIVE.deepFreeze)}%.`, READY],
		active('ice_rain'),
		['Vỡ Vụn', `Đánh quái đang đóng băng +${pct(PASSIVE.frozenBonus)}%; băng tan hay vỡ thì nổ vụn băng (×${fmt(PASSIVE.shardPower)} sức phép, bán kính ${PASSIVE.shardRadius}) trúng quái quanh (quái ướt bị Đóng Băng — lan tối đa ${PASSIVE.shardChain} đợt).`, READY],
		ult('ice_age'),
	]),
	earth: branchNodes([
		active('rock_throw'),
		['Đá Nặng', `Phép Thổ đẩy lùi xa hơn, choáng/hất lâu hơn ${pct(PASSIVE.earthCC)}%.`, READY],
		active('quake'),
		['Da Đá', `Phòng thủ +${pct(PASSIVE.defense)}%, không bị đẩy lùi.`, READY],
		active('stone_spikes'),
		active('stone_wall'),
		['Trọng Lực', `Đòn hệ Thổ làm chậm ${pct(PASSIVE.gravitySlow)}% trong ${PASSIVE.gravitySeconds} giây; quái đang choáng nhận thêm ${pct(PASSIVE.gravityStunned)}% sát thương.`, READY],
		active('rockslide'),
		['Núi Thiêng', `Máu tối đa +${pct(PASSIVE.mountainHp)}%; đứng yên từ ${PASSIVE.mountainStill} giây thì mỗi giây hồi ${pc100(PASSIVE.mountainRegen)}% máu tối đa.`, READY],
		ult('mountain_god'),
	]),
};

/** Cây của một nhánh (giữ chữ ký cũ cho bên gọi; lưu phái nay là nhánh riêng). */
export function treeOf(b: Branch): TreeNode[] {
	return TREE[b];
}

// ———————————————————————————— Kiếm pháp nguyên tố (kế hoạch 2.3) ————————————————————————————

/** Nguyên tố ≥ mốc này VÀ một nhánh phái ≥ `SWORD_ART_STYLE_TIER` (= Kiếm cũ mốc 5) → học kiếm pháp của nguyên tố đó. */
export const SWORD_ART_TIER = 5;
export const SWORD_ART_STYLE_TIER = 3;
/** Mốc Kiếm "sâu nhất" quy về thang cũ: max(Kiếm, phái cao nhất + 2) — thưởng chiều sâu của kiếm pháp / mô tả. */
export function swordDepth(tiers: Tiers): number {
	let d = tiers.sword ?? 0;
	for (const s of STYLE_BRANCHES) if ((tiers[s] ?? 0) > 0) d = Math.max(d, (tiers[s] ?? 0) + STYLE_OFFSET);
	return d;
}
/** Nguyên tố → kiếm pháp. Khai TRƯỚC `SKILL_NODE` (dựng lúc nạp module). */
export const SWORD_ARTS: Record<'fire' | 'water' | 'wind' | 'ice' | 'earth', string> = { fire: 'blaze_slash', water: 'water_dragon_slash', wind: 'gale_blade_dance', ice: 'frost_cleave', earth: 'earth_rend' };

/**
 * Kỹ năng thuộc cây → nhánh + mốc học (Tia Aether không có ở đây: bẩm sinh, ngoài cây). `style`: kỹ năng riêng của một
 * lưu phái Kiếm. `art`: kiếm pháp nguyên tố — cần thêm nguyên tố đó ≥ `SWORD_ART_TIER`.
 */
export interface SkillNode {
	branch: Branch;
	tier: number;
	art?: Branch;
	/** Bọc nguyên tố (`imbue`): cần Kiếm ≥ mốc `tier` + nguyên tố đã chọn ≥ `ENCHANT_ELEMENT_TIER`. */
	imbue?: true;
}
export const SKILL_NODE: Record<string, SkillNode> = Object.fromEntries([
	...BRANCHES.flatMap((b) => TREE[b].flatMap((n) => (n.skillId ? [[n.skillId, { branch: b, tier: n.tier }]] : []))),
	...Object.entries(SWORD_ARTS).map(([art, id]) => [id, { branch: 'sword', tier: STYLE_NEEDS_SWORD, art }]),
	['imbue', { branch: 'sword', tier: 2, imbue: true }],
]);

/**
 * Mốc cao nhất ĐÃ HIỆN THỰC của nhánh — không cộng vượt quá (mốc "Sắp có" nằm giữa thì vẫn đi qua được). 0 = chưa có gì.
 * GĐ3: mọi nhánh tới mốc 9 — 5 nguyên tố (lượt A) và Kiếm (lượt B: ba lưu phái đều đủ mốc 3–9). Mốc 10 tuyệt kỹ — GĐ4.
 */
export function tierCap(b: Branch): number {
	return TREE[b].reduce((m, n) => (n.ready ? Math.max(m, n.tier) : m), 0);
}

// ———————————————————————————— mốc, điểm, hệ số ————————————————————————————

/**
 * Mốc hiện tại của từng nhánh. 0 = nhánh CHƯA MỞ, hoặc nhánh nguyên tố ĐÃ MỞ mà chưa học mốc 1 — hai trường hợp phân biệt bằng
 * `branchOpen` (mã cốt truyện), không bằng số mốc. Kiếm vừa mở = 1 (`baseTier`).
 */
export type Tiers = Partial<Record<Branch, number>>;

/**
 * Số mốc ĐÃ MUA (đã trả điểm) mỗi nhánh — thứ được lưu (`SaveData.talents`, định dạng `talentsV` 3). Kiếm = mốc − 1 (mốc 1
 * miễn phí), nguyên tố = mốc (mốc 1 cũng phải mua). Mốc suy từ đây + nhánh đã mở (`tiersFrom`).
 */
export type TalentSpent = Partial<Record<Branch, number>>;

/** Nhánh mở chưa: cốt truyện đã trao mã của nhánh — mở là ĐƯỢC PHÉP học (nguyên tố vẫn ở mốc 0 tới khi mua mốc 1). */
export function branchOpen(b: Branch, isUnlocked: (unlockId: string) => boolean): boolean {
	return isUnlocked(BRANCH_UNLOCK[b]);
}

/**
 * Mốc suy từ số mốc đã mua + nhánh đã mở: `baseTier` + số đã mua, kẹp ở mốc cao nhất đã hiện thực. Nhánh chưa mở = 0 dù bản
 * lưu có số.
 */
export function tiersFrom(bought: TalentSpent, isUnlocked: (unlockId: string) => boolean): Tiers {
	const tiers: Tiers = {};
	for (const b of BRANCHES) tiers[b] = branchOpen(b, isUnlocked) ? Math.min(tierCap(b), baseTier(b) + Math.max(0, Math.floor(bought[b] ?? 0))) : 0;
	// Một nguyên tố: bản lưu cũ học nhiều nhánh thì giữ nhánh sâu nhất, các nhánh khác về 0 (điểm tự trả lại).
	const keep = chosenElement(tiers);
	for (const e of ELEMENTS) if (e !== keep) tiers[e] = 0;
	// Phái cần Kiếm mốc 2.
	if ((tiers.sword ?? 0) < STYLE_NEEDS_SWORD) for (const s of STYLE_BRANCHES) tiers[s] = 0;
	return tiers;
}

/**
 * Bản lưu trước khi tách lưu phái (`talents.sword` = số mốc Kiếm đã mua, `swordStyle` = lưu phái): mốc Kiếm cũ ≥ 3 chuyển thành
 * Kiếm mốc 2 + nhánh phái mốc (cũ − 2), cùng số điểm. Bản lưu đã có nhánh phái thì giữ nguyên.
 */
export function migrateBought(bought: TalentSpent, swordStyle: unknown): TalentSpent {
	if (STYLE_BRANCHES.some((s) => (bought[s] ?? 0) > 0)) return { ...bought };
	const n = Math.max(0, Math.floor(bought.sword ?? 0));
	if (n <= 1) return { ...bought };
	const out: TalentSpent = { ...bought, sword: 1 };
	if (typeof swordStyle === 'string' && isStyleBranch(swordStyle)) out[swordStyle as Branch] = n - 1;
	return out;
}

/** Tổng điểm đã dùng cho các mốc hiện có (gồm mốc 1 của nhánh nguyên tố đã học). */
export function spentPoints(tiers: Tiers): number {
	return BRANCHES.reduce((a, b) => a + pointsToTier(tiers[b] ?? 0, b), 0);
}

/** Còn bao nhiêu điểm chưa cộng. `bonus`: điểm tiềm năng thưởng (`talentPoints`). */
export function unspent(level: number, tiers: Tiers, bonus = 0): number {
	return talentPoints(level, bonus) - spentPoints(tiers);
}

/**
 * Giá mốc kế tiếp của nhánh; null nếu nhánh chưa mở (mã cốt truyện) hoặc đã tới mốc cao nhất đã hiện thực. Nhánh nguyên tố
 * đã mở ở mốc 0 → giá mốc 1 (học kỹ năng đầu, 1 điểm).
 */
export function nextTierCost(tiers: Tiers, b: Branch, isUnlocked: (unlockId: string) => boolean, path: PathId = 'none'): number | null {
	if (!BRANCHES.includes(b) || !branchOpen(b, isUnlocked) || !pathAllowsBranch(path, b)) return null;
	if (isStyleBranch(b) && (tiers.sword ?? 0) < STYLE_NEEDS_SWORD) return null;
	if (isElementBranch(b)) {
		const chosen = chosenElement(tiers);
		if (chosen !== null && chosen !== b) return null;
	}
	const cur = Math.max(0, Math.floor(tiers[b] ?? 0));
	if (cur >= tierCap(b)) return null;
	return tierCost(b, cur + 1);
}

/**
 * Lên 1 mốc (đã mở, chưa chạm trần, đủ điểm của cấp + điểm thưởng `bonus`) — trả mốc mới, hoặc null nếu không lên được. Sửa
 * `tiers` tại chỗ.
 */
export function addTier(level: number, tiers: Tiers, b: Branch, isUnlocked: (unlockId: string) => boolean, bonus = 0, path: PathId = 'none'): number | null {
	const cost = nextTierCost(tiers, b, isUnlocked, path);
	if (cost === null || unspent(level, tiers, bonus) < cost) return null;
	tiers[b] = Math.max(0, Math.floor(tiers[b] ?? 0)) + 1;
	return tiers[b]!;
}

/**
 * Chia lại điểm cho bản lưu không còn đủ điểm giữ mọi mốc (chuyển luật, bản lưu hỏng): nhánh SÂU nhất giữ trước (mốc muốn
 * giữ cao hơn trước; bằng nhau theo thứ tự `BRANCHES` = thứ tự mở trong cốt truyện — nhánh mở trước giữ trước), mỗi nhánh
 * lấy mốc cao nhất ≤ mốc muốn giữ mà điểm còn lại trả nổi (không dưới `baseTier`). Không bao giờ tiêu quá `points` → không
 * bao giờ âm điểm. Nhánh chính của build giữ lâu nhất; nhánh chỉ có mốc 1 mất trước. Trả mốc giữ được (chỉ các nhánh có
 * trong `want`).
 */
export function fitTiers(want: Tiers, points: number): Tiers {
	// Kiếm là cổng vào phái (1 điểm) nên giữ TRƯỚC khi có phái muốn giữ; Kiếm không đủ mốc 2 thì phái về 0.
	const gate = STYLE_BRANCHES.some((s) => (want[s] ?? 0) > 0);
	const rank = (b: Branch) => (gate && b === 'sword' ? MAX_TIER + 1 : (want[b] ?? 0));
	const order = BRANCHES.filter((b) => want[b] !== undefined).sort((x, y) => rank(y) - rank(x) || BRANCHES.indexOf(x) - BRANCHES.indexOf(y));
	let left = Math.max(0, points);
	const kept: Tiers = {};
	for (const b of order) {
		if (isStyleBranch(b) && (kept.sword ?? 0) < STYLE_NEEDS_SWORD) {
			kept[b] = 0;
			continue;
		}
		let t = Math.max(baseTier(b), Math.min(tierCap(b), Math.floor(want[b] ?? 0)));
		while (t > baseTier(b) && pointsToTier(t, b) > left) t -= 1;
		kept[b] = t;
		left -= pointsToTier(t, b);
	}
	return kept;
}

/** Thưởng chiều sâu: +4% sức mạnh mọi kỹ năng của nhánh mỗi mốc trên mốc 1 (mốc 10 = +36%). Mốc 0 (chưa mở / chưa học) = 1. */
export const DEPTH_BONUS = 0.04;
export function depthBonus(tier: number): number {
	return 1 + DEPTH_BONUS * Math.max(0, Math.min(MAX_TIER, Math.floor(tier)) - 1);
}

/**
 * Tia Aether — năng lực bẩm sinh, ngoài cây: mạnh dần theo cấp (+3% mỗi cấp trên cấp 1; cấp 40 = ×2,17) — DỪNG ở cấp 40 như
 * điểm tiềm năng: sức đánh gốc đã tăng theo cấp, nhân thêm theo cấp tới 100 là Tia Aether ×3,97 vượt hẳn mọi kỹ năng cây.
 */
export const AETHER_PER_LEVEL = 0.03;
export function aetherScale(level: number): number {
	return 1 + AETHER_PER_LEVEL * (Math.min(TALENT_LEVEL_CAP, Math.max(1, Math.floor(level))) - 1);
}

/**
 * Hệ số của một kỹ năng theo cây (Aether không thuộc cây → dùng `aetherScale`). Kiếm pháp nguyên tố ăn thưởng chiều sâu
 * của nhánh YẾU hơn giữa Kiếm và nguyên tố đó (như thưởng phản ứng: phải nuôi cả hai).
 */
export function skillScale(tiers: Tiers, skillId: string, level: number): number {
	if (skillId === 'aether_bolt') return aetherScale(level);
	const node = SKILL_NODE[skillId];
	if (!node) return 1;
	if (node.art) return depthBonus(Math.min(swordDepth(tiers) || 1, tiers[node.art] ?? 1));
	if (isStyleBranch(node.branch)) return depthBonus((tiers[node.branch] ?? 0) + STYLE_OFFSET);
	return depthBonus(tiers[node.branch] ?? 1);
}

/** Lớp được dùng kỹ năng không: Kiếm sĩ chỉ kiếm (đòn Kiếm, phái, kiếm pháp, Bọc nguyên tố), Pháp sư chỉ trượng (Aether + phép). */
export function pathAllowsSkill(path: PathId, skillId: string): boolean {
	if (path === 'none') return true;
	const node = SKILL_NODE[skillId];
	const blade = skillId === 'slash' || (!!node && (node.branch === 'sword' || isStyleBranch(node.branch) || !!node.art || !!node.imbue));
	return path === 'sword' ? blade : !blade;
}

/**
 * Đã học kỹ năng chưa: mã cốt truyện (nếu có) đã mở VÀ nhánh đạt mốc học. Kỹ năng ở mốc có sẵn khi mở nhánh (`baseTier` —
 * chỉ Trảm, Kiếm mốc 1) chỉ cần mã cốt truyện: CombatSystem chưa nhận mốc nào vẫn chém được. Kỹ năng mốc 1 của nguyên tố (Hoả
 * Cầu, Thuỷ Tiễn…) cần nhánh ≥ mốc 1 — đã mua bằng điểm (chủ dự án 10/10/2026). Kỹ năng của lưu phái Kiếm cần đúng lưu phái
 * `style`; kiếm pháp nguyên tố cần thêm nguyên tố đó ≥ mốc 5.
 */
export function knowsSkill(skill: { id: string; unlock?: string }, tiers: Tiers, isUnlocked: (unlockId: string) => boolean, path: PathId = 'none'): boolean {
	if (skill.unlock && !isUnlocked(skill.unlock)) return false;
	if (!pathAllowsSkill(path, skill.id)) return false;
	const node = SKILL_NODE[skill.id];
	if (!node) return true;
	if (node.art && ((tiers[node.art] ?? 0) < SWORD_ART_TIER || !STYLE_BRANCHES.some((s) => (tiers[s] ?? 0) >= SWORD_ART_STYLE_TIER))) return false;
	if (node.imbue) {
		const e = chosenElement(tiers);
		if (e === null || (tiers[e] ?? 0) < ENCHANT_ELEMENT_TIER) return false;
	}
	return node.tier <= baseTier(node.branch) || (tiers[node.branch] ?? 0) >= node.tier;
}

/** Hiệu ứng bị động đang có (hệ số nhân; 1 / 0 / false = chưa có). */
export interface PassiveEffects {
	/** Nhân hồi chiêu đòn Kiếm. */
	swordCooldown: number;
	/** Cộng vào tỉ lệ chí mạng. */
	crit: number;
	burn: number;
	burning: number;
	wet: number;
	/** Thấm Sâu: nhân tốc của quái đang ướt (1 = chưa có). */
	wetSlow: number;
	/** Huyết Thuỷ: phần sát thương hệ Thuỷ hồi thành máu (0 = chưa có). */
	lifesteal: number;
	windShot: number;
	/** Nhân hồi chiêu mọi kỹ năng. */
	cooldown: number;
	moveSpeed: number;
	chill: number;
	/** Lạnh sâu (Hàn Khí): quái lạnh còn `PASSIVE.frostSlow` tốc. */
	frost: boolean;
	damageTaken: number;
	/** Đá Nặng: nhân đẩy lùi + choáng/hất của phép Thổ. */
	earthCC: number;
	/** Da Đá: nhân phòng thủ; `steadfast` = không bị đẩy lùi. */
	defense: number;
	steadfast: boolean;
	/** Tâm Tĩnh (Thủy Thần 4): nhân sát thương nhận khi đứng yên / giữ thế (1 = chưa có). */
	calm: number;
	/** Nhẹ Như Gió (Bắc Thần 4) × Mắt Bão (Phong 7): nhân thể lực mỗi lần né (1 = chưa có). */
	dodgeCost: number;
	// ——— GĐ3: mốc 7 + 9 ———
	/** Tro Tàn (Hoả 7): quái chết lúc đang cháy thì nổ lan lửa. */
	ember: boolean;
	/** Hoả Thân (Hoả 9): nhân sát thương thiêu đốt; `fireResist` = kháng cháy — CHỈ LÀ CỜ (quái chưa đốt được người chơi). */
	burnDamage: number;
	fireResist: boolean;
	/** Mạch Nguồn (Thuỷ 7): đứng trong mưa của mình thì hồi máu + MP mỗi giây. */
	spring: boolean;
	/** Thuỷ Triều Dâng (Thuỷ 9): nhân sát thương mọi nguồn lên quái đang ướt (1 = chưa có). Hút máu 12% nằm ở `lifesteal`. */
	wetTaken: number;
	/** Mắt Bão (Phong 7): nhân tốc chạy trong lúc vừa né xong (1 = chưa có). */
	dodgeHaste: number;
	/** Gió Loạn (Phong 9): đòn hệ Phong làm quái đánh trượt. */
	gust: boolean;
	/** Hàn Tâm (Băng 7): nhân thời gian đóng băng. */
	freeze: number;
	/** Vỡ Vụn (Băng 9): nhân sát thương lên quái đang đóng băng (1 = chưa có); có thì băng tan / vỡ nổ vụn trúng quái quanh. */
	frozenTaken: number;
	/** Trọng Lực (Thổ 7): đòn Thổ làm chậm + quái đang choáng nhận thêm. */
	gravity: boolean;
	/** Núi Thiêng (Thổ 9): nhân máu tối đa; `mountain` = đứng yên thì hồi máu. */
	hpMax: number;
	mountain: boolean;
	// ——— GĐ3 lượt B: Kiếm 3 lưu phái mốc 7 + 9 ———
	/** Thế Áp Đảo (Kiếm Thần 7): nhát Kiếm trúng liên tiếp cộng dồn sát thương đòn Kiếm. */
	press: boolean;
	/** Bất Khuất (Kiếm Thần 9): dưới ngưỡng máu thì công ×`PASSIVE.rageAtk` + hút máu. */
	rage: boolean;
	/** Phản Đòn (Thủy Thần 7): né / đỡ đúng lúc → nhát phản chắc chắn chí mạng (né đúng lúc tự chém trả). */
	riposte: boolean;
	/** Mặt Hồ Phẳng (Thủy Thần 9): mỗi lần phản đòn thành công hồi máu. */
	lake: boolean;
	/** Đà Lướt (Bắc Thần 7): né xong, vài đòn Kiếm kế nhanh hơn. */
	momentum: boolean;
	/** Bóng Mờ (Bắc Thần 9): tỉ lệ né hoàn toàn một đòn (0 = chưa có). */
	evade: number;
}

/** Bị động đang có theo mốc (bị động lưu phái theo nhánh phái: mốc Kiếm cũ 4 / 7 / 9 = mốc phái 2 / 5 / 7). */
export function passiveEffects(tiers: Tiers): PassiveEffects {
	const at = (b: Branch, t: number) => (tiers[b] ?? 0) >= t;
	/** `t` theo thang Kiếm cũ. */
	const swordAt = (s: SwordStyle, t: number) => at(s, t - STYLE_OFFSET);
	const sword4 = (s: SwordStyle) => swordAt(s, 4);
	return {
		swordCooldown: at('sword', 2) ? 1 / (1 + PASSIVE.swordHaste) : 1,
		crit: sword4('kiem_than') ? PASSIVE.crit : 0,
		burn: at('fire', 2) ? PASSIVE.burn : 1,
		burning: at('fire', 4) ? PASSIVE.burning : 1,
		wet: at('water', 2) ? PASSIVE.wet : 1,
		wetSlow: at('water', 2) ? PASSIVE.wetSlow : 1,
		lifesteal: at('water', 9) ? PASSIVE.tideLifesteal : at('water', 4) ? PASSIVE.lifesteal : 0,
		windShot: at('wind', 2) ? PASSIVE.windShot : 1,
		cooldown: at('wind', 4) ? PASSIVE.cooldown : 1,
		moveSpeed: (at('wind', 4) ? PASSIVE.moveSpeed : 1) * (sword4('bac_than') ? PASSIVE.swiftMove : 1),
		chill: at('ice', 2) ? PASSIVE.chill : 1,
		frost: at('ice', 2),
		damageTaken: at('ice', 4) ? PASSIVE.damageTaken : 1,
		earthCC: at('earth', 2) ? PASSIVE.earthCC : 1,
		defense: at('earth', 4) ? PASSIVE.defense : 1,
		steadfast: at('earth', 4),
		calm: sword4('thuy_than') ? PASSIVE.calm : 1,
		// Nhẹ Như Gió + Mắt Bão: lấy mức rẻ hơn, không nhân chồng (như làm chậm lấy mức chậm nhất).
		dodgeCost: Math.min(sword4('bac_than') ? PASSIVE.swiftDodge : 1, at('wind', 7) ? PASSIVE.eyeDodge : 1),
		ember: at('fire', 7),
		burnDamage: at('fire', 9) ? PASSIVE.burnDamage : 1,
		fireResist: at('fire', 9),
		spring: at('water', 7),
		wetTaken: at('water', 9) ? PASSIVE.tideWet : 1,
		dodgeHaste: at('wind', 7) ? PASSIVE.eyeHaste : 1,
		gust: at('wind', 9),
		freeze: at('ice', 7) ? PASSIVE.deepFreeze : 1,
		frozenTaken: at('ice', 9) ? PASSIVE.frozenBonus : 1,
		gravity: at('earth', 7),
		hpMax: at('earth', 9) ? PASSIVE.mountainHp : 1,
		mountain: at('earth', 9),
		press: swordAt('kiem_than', 7),
		rage: swordAt('kiem_than', 9),
		riposte: swordAt('thuy_than', 7),
		lake: swordAt('thuy_than', 9),
		momentum: swordAt('bac_than', 7),
		evade: swordAt('bac_than', 9) ? PASSIVE.evade : 0,
	};
}

// ———————————————————————————— phản ứng song hệ ————————————————————————————

/**
 * Cặp hệ của từng phản ứng. Khoá theo `ReactionId` của CombatSystem nên thêm phản ứng mới mà quên khai cặp là lỗi
 * biên dịch. 4 phản ứng Thổ (GĐ2): Bùn Lầy, Dung Nham, Bão Cát, Vỡ Vụn — số liệu ở `skillRules.EARTH`.
 */
export const REACTION_PAIR: Record<ReactionId, [Branch, Branch]> = {
	steam: ['fire', 'water'],
	burst: ['fire', 'wind'],
	chill: ['water', 'wind'],
	freeze: ['ice', 'water'],
	melt: ['ice', 'fire'],
	mud: ['earth', 'water'],
	lava: ['earth', 'fire'],
	sandstorm: ['earth', 'wind'],
	shatter: ['earth', 'ice'],
};

export const REACTION_NAME: Record<ReactionId, string> = {
	steam: 'Hơi Nước',
	burst: 'Bùng Lửa',
	chill: 'Băng Giá',
	freeze: 'Đóng Băng',
	melt: 'Tan Chảy',
	mud: 'Bùn Lầy',
	lava: 'Dung Nham',
	sandstorm: 'Bão Cát',
	shatter: 'Vỡ Vụn',
};

/** Phản ứng của cặp nhánh (null: cặp không có phản ứng nào, vd Kiếm + Hoả). */
export function reactionOfPair(a: Branch, b: Branch): ReactionId | null {
	for (const [id, [x, y]] of Object.entries(REACTION_PAIR) as [ReactionId, [Branch, Branch]][]) if ((x === a && y === b) || (x === b && y === a)) return id;
	return null;
}

/**
 * Thưởng phản ứng: +5% mỗi MỐC (trên mốc 1) của hệ YẾU hơn trong cặp. Từ 11/10/2026 mỗi nhân vật chỉ một nguyên tố nên phản ứng là
 * lối đánh NHÓM (người khác hệ đánh cùng một con — chủ dự án: "phản ứng cứ cho các user tự phối hợp với nhau"); hàm giữ cho mô tả.
 */
export const REACTION_PER_TIER = 0.05;
export function reactionBonus(tiers: Tiers, a: Branch, b: Branch): number {
	return 1 + REACTION_PER_TIER * Math.max(0, Math.min(tiers[a] ?? 0, tiers[b] ?? 0) - 1);
}

// ———————————————————————————— lối build (chỉ để hiển thị) ————————————————————————————

export type BuildKind = 'none' | 'focused' | 'hybrid' | 'spread';

export interface BuildInfo {
	kind: BuildKind;
	/** "Thuần Băng", "Kiếm – Phong", "Đa hệ"… */
	label: string;
	/** Một câu tóm thưởng đang có. */
	detail: string;
}

/** Đọc lối build từ mốc các nhánh (không còn thưởng/phạt theo build — sức mạnh nằm ở mốc). */
export function describeBuild(tiers: Tiers): BuildInfo {
	// Kiếm (2 mốc) chỉ là cổng vào lưu phái — không tính là một "lối"; phái tính thưởng theo thang Kiếm cũ (mốc + 2).
	const depth = (b: Branch) => (tiers[b] ?? 0) + (isStyleBranch(b) && (tiers[b] ?? 0) > 0 ? STYLE_OFFSET : 0);
	const deep = BRANCHES.filter((b) => b !== 'sword' && (tiers[b] ?? 0) >= 2).sort((x, y) => depth(y) - depth(x));
	const part = (b: Branch) => `${BRANCH_NAME[b]} mốc ${tiers[b]} (+${Math.round((depthBonus(depth(b)) - 1) * 100)}%)`;
	if (!deep.length) return { kind: 'none', label: 'Chưa có lối riêng', detail: 'Cộng điểm vào một nhánh: mỗi mốc +4% sức mạnh mọi kỹ năng của nhánh đó.' };
	if (deep.length === 1) {
		return { kind: 'focused', label: `Thuần ${BRANCH_NAME[deep[0]!]}`, detail: `${part(deep[0]!)}.` };
	}
	if (deep.length === 2) {
		const [a, b] = deep as [Branch, Branch];
		const r = reactionOfPair(a, b);
		const extra = r ? `; ${REACTION_NAME[r]} +${Math.round((reactionBonus(tiers, a, b) - 1) * 100)}%` : '';
		return { kind: 'hybrid', label: `${BRANCH_NAME[a]} – ${BRANCH_NAME[b]}`, detail: `${part(a)}, ${part(b)}${extra}.` };
	}
	return { kind: 'spread', label: 'Đa hệ', detail: `${deep.map(part).join(', ')}. Rải điểm thì khó chạm mốc cao.` };
}

/** Tẩy điểm: miễn phí tới cấp 5 (còn đang thử build), sau đó 10 xu × cấp. (Cũ — nay tẩy bằng kim cương `resetDiamonds`.) */
export function resetCost(level: number): number {
	return level <= 5 ? 0 : 10 * level;
}

/**
 * Tẩy điểm tiềm năng / thuộc tính bằng KIM CƯƠNG (chủ dự án 11/10/2026: "tẩy điểm tốn nhiều kim cương" — đổi nguyên tố đã chọn là
 * một quyết định lớn). Miễn phí tới cấp 5 để thử build; máy chủ trừ ví (`resetBuild`).
 */
export const RESET_DIAMONDS = 40;
export function resetDiamonds(level: number): number {
	return level <= 5 ? 0 : RESET_DIAMONDS;
}

// ———————————————————————————— phủ phép Kiếm ————————————————————————————

export type EnchantId = 'fire' | 'water' | 'wind' | 'ice' | 'earth';
export const ENCHANTS: readonly EnchantId[] = ['fire', 'water', 'wind', 'ice', 'earth'];
export const ENCHANT_SWORD_TIER = 2;
/**
 * Nguyên tố phải ≥ mốc này mới có Bọc nguyên tố (11/10/2026: một nguyên tố / nhân vật nên hạ từ 5 xuống 3 — 4 điểm). Bọc nguyên tố là
 * KỸ NĂNG kích hoạt có thời gian (chủ dự án: "bọc nguyên tố vào kiếm là skill kích hoạt có thời gian"), không còn bật sẵn.
 */
export const ENCHANT_ELEMENT_TIER = 3;
/** Thời gian bọc: 10 giây + 1 giây mỗi mốc nguyên tố, tối đa 20 giây. */
export const IMBUE_BASE_SECONDS = 10;
export const IMBUE_MAX_SECONDS = 20;
export function imbueSeconds(elementTier: number): number {
	return Math.min(IMBUE_MAX_SECONDS, IMBUE_BASE_SECONDS + Math.max(0, Math.floor(elementTier)));
}
/** Đổi phủ phép có hồi (giây): không chém Lửa rồi đổi ngay sang Băng để tự ăn Tan Chảy liên tục. */
export const ENCHANT_SWAP_SECONDS = 10;

/**
 * Phủ Thổ: nhát thứ 3 liên tiếp choáng ngắn từ mốc Thổ này (kế hoạch 2.3 ghi mốc 7; GĐ2 trần là mốc 5 nên kéo về mốc 5 —
 * tức mọi kiếm phủ Thổ đều có). Giữ mốc 5 khi mở mốc 6+ để không lấy lại thứ người chơi đã có; mốc 7 Thổ choáng lâu hơn.
 */
export const ENCHANT_EARTH_STUN_TIER = 5;
/** Phủ phép mạnh lên ở mốc nguyên tố này (cột "Mốc 7" bảng 2.3, số ở `skillRules.ENCHANT_FX`). Mốc 10 — GĐ4. */
export const ENCHANT_UP_TIER = 7;

/** Phủ phép làm gì ở mốc nguyên tố `tier` (bảng chọn phủ phép + chi tiết nấc mốc 7). Mốc < 5 trả phần của mốc 5. */
export function enchantDesc(e: EnchantId, tier: number): string {
	const up = tier >= ENCHANT_UP_TIER;
	const pct = (x: number) => `${Math.round(x * 100)}%`;
	switch (e) {
		case 'fire':
			return `Gây cháy.${up ? ` Nhát thứ ${EARTH_ENCHANT.every} liên tiếp nổ nhỏ (×${fmt(ENCHANT_FX.fire.blastPower)} sát thương nhát).` : ''}`;
		case 'water':
			return `Làm ướt, hút ${pct(up ? ENCHANT_FX.water.drainUp : ENCHANT_FX.water.drain)} sát thương thành máu.`;
		case 'wind':
			return `Tầm chém +${pct(ENCHANT_FX.wind.reach - 1)}, đẩy lùi nhẹ.${up ? ' Mỗi nhát chém bắn thêm một lưỡi gió.' : ''}`;
		case 'ice':
			return `Làm chậm; trúng ${up ? ENCHANT_FX.ice.stacksUp : ENCHANT_FX.ice.stacks} nhát liên tiếp thì đóng băng ${fmt(ENCHANT_FX.ice.freeze)} giây.`;
		case 'earth':
			return `Phá giáp ${fmt(EARTH_ENCHANT.armor)} giây; nhát thứ ${EARTH_ENCHANT.every} liên tiếp choáng ${fmt(up ? EARTH_ENCHANT.stunUp : EARTH_ENCHANT.stun)} giây.`;
		default:
			return '';
	}
}

/** Bọc được nguyên tố `e` chưa: Kiếm ≥ mốc 2, `e` là nguyên tố đã chọn và ≥ `ENCHANT_ELEMENT_TIER`. */
export function canEnchant(tiers: Tiers, e: EnchantId): boolean {
	return ENCHANTS.includes(e) && (tiers.sword ?? 0) >= ENCHANT_SWORD_TIER && chosenElement(tiers) === e && (tiers[e] ?? 0) >= ENCHANT_ELEMENT_TIER;
}

// ———————————————————————————— thanh 10 ô ————————————————————————————

export const SLOT_COUNT = 10;
/** Nhãn phím của từng ô (thứ tự ô) và mã phím `KeyboardEvent.code` tương ứng. */
export const SLOT_KEYS: readonly string[] = ['J', 'K', '1', '2', '3', '4', '5', '6', '7', '8'];
export const SLOT_CODES: readonly string[] = ['KeyJ', 'KeyK', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8'];

/** Ô gán tự do: id kỹ năng hoặc null (trống). Luôn đủ `SLOT_COUNT` phần tử. */
export type Loadout = (string | null)[];

/** Ô "nhà" của kỹ năng — đúng phím cũ (J kiếm, K Aether, 1–3 phép, 4 Suối Lành, 5 Băng Tiễn) để người chơi cũ khỏi tập lại. */
export const HOME_SLOT: Record<string, number> = { slash: 0, aether_bolt: 1, imbue: 1, fire_bolt: 2, water_lance: 3, wind_blade: 4, heal: 5, ice_shard: 6 };

/** Đặt kỹ năng chưa có trên thanh vào ô nhà nếu trống, không thì ô trống đầu tiên; hết ô thì để nguyên. Trả bản mới. */
export function placeSkill(loadout: Loadout, skillId: string): Loadout {
	const lo = [...loadout];
	if (lo.includes(skillId)) return lo;
	const home = HOME_SLOT[skillId];
	const at = home !== undefined && lo[home] == null ? home : lo.findIndex((x) => x == null);
	if (at >= 0) lo[at] = skillId;
	return lo;
}

/** Thanh mặc định: các kỹ năng đã biết (theo thứ tự truyền vào) vào ô nhà của chúng. */
export function defaultLoadout(known: readonly string[]): Loadout {
	return known.reduce<Loadout>((lo, id) => placeSkill(lo, id), Array.from({ length: SLOT_COUNT }, () => null));
}

/**
 * Kẹp thanh từ bản lưu: chỉ giữ kỹ năng ĐANG biết (bị mất — vd Suối Lành sau khi tẩy điểm — thì ô thành trống), bỏ
 * trùng, đủ 10 ô. Không phải mảng → null (bên gọi dựng mặc định).
 */
export function normalizeLoadout(raw: unknown, known: readonly string[]): Loadout | null {
	if (!Array.isArray(raw)) return null;
	const seen = new Set<string>();
	return Array.from({ length: SLOT_COUNT }, (_, i) => {
		const v = raw[i];
		if (typeof v !== 'string' || !known.includes(v) || seen.has(v)) return null;
		seen.add(v);
		return v;
	});
}

/** Gán kỹ năng vào ô `slot` (null = bỏ trống). Kỹ năng đang ở ô khác thì ĐỔI CHỖ với thứ đang ở `slot`. */
export function assignSlot(loadout: Loadout, slot: number, skillId: string | null): Loadout {
	const lo = [...loadout];
	if (slot < 0 || slot >= SLOT_COUNT) return lo;
	if (skillId !== null) {
		const from = lo.indexOf(skillId);
		if (from >= 0) lo[from] = lo[slot] ?? null;
	}
	lo[slot] = skillId;
	return lo;
}

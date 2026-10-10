import { ACTION_FX_FLAGS, cleanActionFx, WORLD_COORD_MAX, type ActionFx } from '@aether/protocol';
import { clampTarget } from './skillRules';
import { HERO_SKILLS, isGroundTarget, isSwordSkill, type Element, type SkillDef } from './skills';
import { ENCHANTS, type EnchantId } from './talents';

/**
 * Chiêu của NGƯỜI CHƠI KHÁC (tin `action` có phần chiêu `fx`) đã kiểm + giải nghĩa, sẵn để `CombatSystem.echoCast` vẽ lại HÌNH
 * y như lúc người đó tự tung. Chỉ hình: không có số sát thương, không trừ máu, không đụng quái. Phần quyết định (chiêu nào, hướng
 * nào, hệ nào, nhịp nào) nằm ở đây — thuần, không cần Pixi, test được (`tests/remoteCast.test.ts`).
 */
export interface RemoteCast {
	skill: SkillDef;
	/** Hướng ngắm (vector đơn vị). */
	dx: number;
	dy: number;
	/** Điểm nhắm của đòn đặt vùng; vắng = đặt trước mặt ở `aimDist` như lúc không có chuột. */
	tx?: number;
	ty?: number;
	/** Hệ phủ lên kiếm — chỉ đòn kiếm thép mang (cùng luật `CombatSystem.enchant`). */
	enchant?: Element;
	/** Hồi chiêu dùng dựng nhịp động tác (giây) + hệ số nhanh của động tác (Đà Lướt) — máy xem ra cùng khung chạm. */
	cooldown: number;
	speed: number;
	/** Đạn phép Phong bay nhanh + xa hơn chừng này lần (Gió Sắc); 1 với mọi chiêu khác. */
	boost: number;
	/** Nhát chém kèm lưỡi gió (phủ Phong mốc 7). */
	windBlade: boolean;
	/** Xoáy Nước bùng (người tung vừa đỡ đòn thành công). */
	surge: boolean;
	/** Chiêu có vung thân không — lướt, giữ thế (`SkillDef.anim` vắng) chỉ có hình, máy người tung cũng không vung. */
	body: boolean;
	/** Giây dồn lực trước khi vào động tác (Nhất Kích): tin tới lúc BẮT ĐẦU dồn. */
	wait: number;
}

const SKILLS: ReadonlyMap<string, SkillDef> = new Map(HERO_SKILLS.map((s) => [s.id, s]));
const round3 = (v: number): number => Math.round(v * 1000) / 1000;

/** Đòn mang hệ phủ phép (luật `CombatSystem.enchant`): kiếm pháp nguyên tố đã có hệ riêng, phủ phép không đè. */
function takesEnchant(skill: SkillDef): boolean {
	return isSwordSkill(skill) && skill.element === 'steel';
}

/**
 * Phía NGƯỜI TUNG (`CombatSystem.cast`): gói phần chiêu gửi kèm tin `action`. Chỉ gửi trường có ý nghĩa với chiêu đó — điểm nhắm
 * cho đòn đặt vùng (kẹp trước theo tầm chiêu quanh chỗ đứng, như khung chạm sẽ kẹp), hệ phủ phép cho đòn kiếm thép, hồi chiêu /
 * hệ số nhanh khi khác số gốc, cờ hình phụ khi chiêu đó có hình phụ.
 */
export function castFx(
	skill: SkillDef,
	o: {
		dx: number;
		dy: number;
		/** Chỗ đứng lúc bấm + điểm nhắm (toạ độ thế giới). */
		x: number;
		y: number;
		tx: number;
		ty: number;
		enchant: EnchantId | null;
		cd: number;
		sp: number;
		boost: number;
		/** Đủ mốc lưỡi gió của phủ Phong (Phong mốc 7) — chỉ có tác dụng khi đang phủ Phong lên đòn chém. */
		windBladeTier: boolean;
		/** Đang trong cửa sổ sau khi đỡ đòn thành công. */
		afterGuard: boolean;
	},
): ActionFx {
	const fx: ActionFx = { ax: round3(o.dx), ay: round3(o.dy) };
	if (isGroundTarget(skill)) {
		const at = clampTarget(o.x, o.y, o.tx, o.ty, skill.range ?? 0);
		fx.tx = Math.round(Math.min(WORLD_COORD_MAX, Math.max(0, at.x)));
		fx.ty = Math.round(Math.min(WORLD_COORD_MAX, Math.max(0, at.y)));
	}
	const enchant = o.enchant && takesEnchant(skill) ? o.enchant : null;
	if (enchant) fx.el = enchant;
	if (o.cd > 0 && o.cd < skill.cooldown - 1e-3) fx.cd = round3(o.cd);
	if (o.sp > 1) fx.sp = round3(o.sp);
	if (skill.kind === 'projectile' && skill.element === 'wind' && o.boost > 1) fx.boost = round3(o.boost);
	let fl = 0;
	if (enchant === 'wind' && o.windBladeTier && (skill.kind === 'melee' || skill.kind === 'blink')) fl |= ACTION_FX_FLAGS.windBlade;
	if (skill.afterGuard && o.afterGuard) fl |= ACTION_FX_FLAGS.surge;
	if (fl) fx.fl = fl;
	return fx;
}

/**
 * Phía NGƯỜI XEM: mã chiêu + phần chiêu nhận qua mạng → `RemoteCast`, hoặc null (chiêu lạ, thiếu / hỏng phần chiêu — khi đó chỉ
 * phát động tác thân như máy chủ / máy gửi bản cũ). Chuẩn hoá lại dù máy chủ đã kiểm: không tin dữ liệu mạng.
 */
export function planRemoteCast(skillId: unknown, raw: unknown): RemoteCast | null {
	const skill = typeof skillId === 'string' ? SKILLS.get(skillId) : undefined;
	if (!skill || raw === undefined) return null;
	const fx = cleanActionFx(raw);
	if (!fx) return null;
	const el = fx.el && (ENCHANTS as readonly string[]).includes(fx.el) && takesEnchant(skill) ? (fx.el as Element) : undefined;
	const flags = fx.fl ?? 0;
	return {
		skill,
		dx: fx.ax,
		dy: fx.ay,
		...(isGroundTarget(skill) && fx.tx !== undefined && fx.ty !== undefined ? { tx: fx.tx, ty: fx.ty } : {}),
		...(el ? { enchant: el } : {}),
		cooldown: Math.min(skill.cooldown, fx.cd ?? skill.cooldown),
		speed: fx.sp ?? 1,
		boost: skill.kind === 'projectile' && skill.element === 'wind' ? (fx.boost ?? 1) : 1,
		windBlade: el === 'wind' && (skill.kind === 'melee' || skill.kind === 'blink') && (flags & ACTION_FX_FLAGS.windBlade) !== 0,
		surge: !!skill.afterGuard && (flags & ACTION_FX_FLAGS.surge) !== 0,
		body: !!skill.anim,
		wait: skill.charge ?? 0,
	};
}

import { cleanActionFx, type ActionFx } from '@havenlord/protocol';
import { clampTarget } from '@havenlord/sim/skillRules';
import { HERO_SKILLS, isGroundTarget, type SkillDef } from '@havenlord/sim/skills';
import { ENCHANTS } from '@havenlord/sim/talents';

const SKILLS: ReadonlyMap<string, SkillDef> = new Map(HERO_SKILLS.map((s) => [s.id, s]));

/**
 * Điểm nhắm được lệch thêm chừng này px ngoài tầm của chiêu, tính từ vị trí máy chủ đang giữ: người gửi đã đi thêm tối đa một
 * nhịp gói vị trí (0,1 giây × tốc chạy) + trễ mạng. Máy người xem còn kẹp lại đúng tầm quanh nhân vật đang vẽ (`release`).
 */
export const AIM_SLACK = 96;

/**
 * Mã chiêu + phần chiêu của tin `action` → bản đã kiểm để phát cho người cùng map (CHỈ HÌNH — chiến đấu vẫn tính ở máy người
 * tung). `skill` = '' khi mã không có trong bộ chiêu thật (giữ trường như bản cũ — máy khách cũ tra hồi chiêu theo nó); `fx` vắng
 * khi chiêu lạ hoặc phần chiêu sai dạng (bỏ IM LẶNG, động tác thân vẫn đi). Điểm nhắm chỉ giữ cho chiêu đặt vùng, kẹp trong tầm
 * chiêu + `AIM_SLACK` quanh `from`; hệ phủ phép lạ thì bỏ riêng trường đó.
 */
export function cleanCast(skillRaw: unknown, fxRaw: unknown, from: { x: number; y: number }): { skill: string; fx?: ActionFx } {
	const skill = typeof skillRaw === 'string' ? SKILLS.get(skillRaw) : undefined;
	if (!skill) return { skill: '' };
	const fx = fxRaw === undefined ? null : cleanActionFx(fxRaw);
	if (!fx) return { skill: skill.id };
	if (fx.el !== undefined && !(ENCHANTS as readonly string[]).includes(fx.el)) delete fx.el;
	if (fx.tx !== undefined && fx.ty !== undefined) {
		if (isGroundTarget(skill)) {
			const at = clampTarget(from.x, from.y, fx.tx, fx.ty, (skill.range ?? 0) + AIM_SLACK);
			fx.tx = Math.round(at.x);
			fx.ty = Math.round(at.y);
		} else {
			delete fx.tx;
			delete fx.ty;
		}
	}
	// Hồi chiêu sau bị động chỉ NGẮN đi — dài hơn hồi chiêu gốc là số bịa: bỏ, máy nhận dùng số gốc.
	if (fx.cd !== undefined && fx.cd > skill.cooldown + 1e-3) delete fx.cd;
	return { skill: skill.id, fx };
}

/**
 * Phần HÌNH của cùng một chiêu phát lại sớm nhất sau tỉ lệ này × hồi chiêu GỐC: chừa bị động giảm hồi chiêu (Nhịp Chém ÷1,1, Đà Lướt
 * ÷1,25) + trễ mạng dồn gói. Thiếu cổng này thì máy khách sửa đổi gửi 8 chiêu vùng nặng mỗi giây (giới hạn nhịp chung) — mưa 6 giây
 * chồng ~48 vùng, mọi người cùng map phải vẽ hết (đã nêu ở bước rà 09/10/2026).
 */
export const FX_COOLDOWN_RATIO = 0.5;

/** Còn trong hồi chiêu của chiêu đó → false (bỏ phần hình, động tác thân vẫn đi); được phát thì ghi mốc thời gian. */
export function fxAllowed(last: Map<string, number>, skillId: string, now: number): boolean {
	const skill = SKILLS.get(skillId);
	if (!skill) return false;
	const prev = last.get(skillId);
	if (prev !== undefined && now - prev < skill.cooldown * 1000 * FX_COOLDOWN_RATIO) return false;
	last.set(skillId, now);
	return true;
}

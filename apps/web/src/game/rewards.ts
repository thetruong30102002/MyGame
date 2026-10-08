import type { BuffView, GiftView } from '@aether/protocol';
import { GOAL_KIND_INFO, GOALS, type GoalDef, type GoalKind } from '@aether/sim/rewards';

/**
 * Ví kim cương, điểm danh, Bia Danh Vọng phía client (K1 — docs/ke-hoach-kim-cuong.md). Luật THUẦN để test bằng node: máy chủ
 * quyết ai nhận gì, ở đây chỉ dựng chữ / nhóm mục tiêu để hiện.
 */

/** "+1 kim cương · +50 xu · +1 Bình hồi phục" — bỏ phần bằng 0. */
export function giftText(g: GiftView): string {
	const parts: string[] = [];
	if (g.diamonds > 0) parts.push(`+${g.diamonds} kim cương`);
	if (g.coins > 0) parts.push(`+${g.coins} xu`);
	if (g.potions > 0) parts.push(`+${g.potions} Bình hồi phục`);
	return parts.join(' · ');
}

/** Mục tiêu theo nhóm (Săn quái, Săn boss, Thám hiểm, Bạn bè), đúng thứ tự khai trong `GOALS`. */
export function goalGroups(): { kind: GoalKind; group: string; note: string; goals: GoalDef[] }[] {
	const out: { kind: GoalKind; group: string; note: string; goals: GoalDef[] }[] = [];
	for (const g of GOALS) {
		let row = out.find((r) => r.kind === g.kind);
		if (!row) {
			row = { kind: g.kind, ...GOAL_KIND_INFO[g.kind], goals: [] };
			out.push(row);
		}
		row.goals.push(g);
	}
	return out;
}

/**
 * Bình còn hiệu lực lúc `now`: máy chủ gửi giây còn lại lúc `at`, client tự đếm lùi (máy chủ chỉ trừ giờ lúc online, mà đang
 * nhận được tin là đang online). Hết giờ ở máy này là thôi áp ngay, không chờ tin máy chủ.
 */
export function activeBuffs(state: { list: BuffView[]; at: number } | null, now: number): BuffView[] {
	if (!state) return [];
	const gone = (now - state.at) / 1000;
	return state.list.flatMap((b) => (b.remaining - gone > 0 ? [{ ...b, remaining: b.remaining - gone }] : []));
}

/** Ô của khung lịch tháng chứa `day` (`YYYY-MM-DD`): tuần bắt đầu thứ Hai, null = ô trống đầu tháng. */
export function monthGrid(day: string): ({ day: string; date: number } | null)[] {
	const [y, m] = day.split('-').map(Number) as [number, number];
	const lead = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
	const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
	const out: ({ day: string; date: number } | null)[] = Array.from({ length: lead }, () => null);
	for (let d = 1; d <= days; d += 1) out.push({ day: `${day.slice(0, 7)}-${String(d).padStart(2, '0')}`, date: d });
	return out;
}

/** Số có dấu chấm ngăn nghìn kiểu Việt ("1.000"). */
export function fmtCount(n: number): string {
	return Math.max(0, Math.floor(n)).toLocaleString('vi-VN');
}

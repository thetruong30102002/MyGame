/**
 * Kinh tế ở máy chủ (M3.3a — docs/ke-hoach-m3-may-chu-chien-dau.md): cấp, EXP, xu, bình hồi phục do MÁY CHỦ giữ; client chỉ báo ý định
 * (hạ quái riêng, xong nhiệm vụ, tiêu xu, uống bình) và vẽ theo số máy chủ gửi. Luật thuần dùng chung (máy chủ tính, test node).
 */
import { MAX_LEVEL } from '@havenlord/protocol';
import { expForLevel } from './skills.ts';

export interface Eco {
	level: number;
	exp: number;
	coins: number;
	potions: number;
}

/** Trần số liệu (như `cleanProgress` của máy chủ trước M3.3). */
export const COIN_CAP = 1e9;
export const POTION_CAP = 999;

/** Kẹp một bản ghi kinh tế về khoảng hợp lệ (bản lưu cũ client tự ghi, số lạ). */
export function cleanEco(e: Partial<Eco> | null | undefined): Eco {
	const int = (v: unknown, min: number, max: number) => {
		const n = Math.floor(Number(v));
		return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : min;
	};
	const level = int(e?.level, 1, MAX_LEVEL);
	return {
		level,
		exp: level >= MAX_LEVEL ? 0 : Math.min(expForLevel(level) - 1, int(e?.exp, 0, 1e12)),
		coins: int(e?.coins, 0, COIN_CAP),
		potions: int(e?.potions, 0, POTION_CAP),
	};
}

/** Cộng `gain` EXP: lên cấp theo `expForLevel` (cùng đường với client), cấp tối đa thì EXP = 0 và không nhận thêm. */
export function addExp(level: number, exp: number, gain: number): { level: number; exp: number; levelsGained: number } {
	let lv = level;
	let x = exp;
	if (lv >= MAX_LEVEL) return { level: lv, exp: 0, levelsGained: 0 };
	x += Math.max(0, Math.floor(gain));
	while (lv < MAX_LEVEL && x >= expForLevel(lv)) {
		x -= expForLevel(lv);
		lv += 1;
	}
	return { level: lv, exp: lv >= MAX_LEVEL ? 0 : x, levelsGained: lv - level };
}

/**
 * Phần EXP được nhận từ một nguồn bị chặn ở cấp `cap` (khu tuổi thơ — `mobs.CHILD_ZONE_LEVEL_CAP`): nhiều nhất tới sát mốc lên cấp
 * `cap + 1` (đứng ở cấp `cap`, thanh EXP thiếu 1). Đã quá `cap` thì 0. Dùng chung cho client (chơi một mình) và máy chủ.
 */
export function capExpGain(level: number, exp: number, gain: number, cap: number): number {
	const g = Math.max(0, Math.floor(gain));
	if (level > cap) return 0;
	let room = expForLevel(level) - exp;
	for (let lv = level + 1; lv <= cap; lv += 1) room += expForLevel(lv);
	return Math.max(0, Math.min(g, room - 1));
}

/** Lý do một lần thay đổi (hiện ở client + nhật ký). */
export type EcoReason = 'kill' | 'quest' | 'boss' | 'checkin' | 'spend' | 'potion' | 'admin';

/** Tổng EXP tích từ cấp 1 tới (`level`, `exp`) — đổi qua lại với `fromTotalExp`. Cấp tối đa: EXP lẻ không tính (luôn 0). */
export function totalExp(level: number, exp: number): number {
	const lv = Math.max(1, Math.min(MAX_LEVEL, Math.floor(level)));
	let sum = 0;
	for (let l = 1; l < lv; l += 1) sum += expForLevel(l);
	return sum + (lv >= MAX_LEVEL ? 0 : Math.max(0, Math.floor(exp)));
}

/** Cấp + EXP ứng với tổng EXP `total` (âm coi như 0; quá cấp tối đa thì đứng ở cấp tối đa, EXP = 0). */
export function fromTotalExp(total: number): { level: number; exp: number } {
	let x = Math.max(0, Math.floor(total));
	let lv = 1;
	while (lv < MAX_LEVEL && x >= expForLevel(lv)) {
		x -= expForLevel(lv);
		lv += 1;
	}
	return { level: lv, exp: lv >= MAX_LEVEL ? 0 : x };
}

/**
 * Cộng / trừ EXP CÓ DẤU (trang quản trị): cộng y như `addExp` (lên cấp); trừ thì lùi theo tổng EXP — có thể xuống cấp, thấp nhất
 * cấp 1 EXP 0. Dưới cấp tối đa, cộng rồi trừ cùng một số thì về đúng chỗ cũ.
 */
export function shiftExp(level: number, exp: number, delta: number): { level: number; exp: number } {
	return fromTotalExp(totalExp(level, exp) + Math.trunc(delta));
}

/**
 * Quản trị đổi kinh tế (trang /admin): máy chủ áp, trang xem trước bằng CHÍNH hàm này nên hộp xác nhận khớp kết quả thật. Đặt cấp
 * trước (EXP về 0), rồi EXP có dấu (`shiftExp`), xu / bình cộng có dấu — tất cả kẹp qua `cleanEco` (trừ quá số đang có thì về 0, không
 * bao giờ âm; quá trần thì đứng ở trần).
 */
export function applyAdminEco(cur: Eco, d: { coins?: number; potions?: number; exp?: number; setLevel?: number | null }): Eco {
	let lv = { level: cur.level, exp: cur.exp };
	if (d.setLevel) lv = { level: Math.max(1, Math.min(MAX_LEVEL, Math.floor(d.setLevel))), exp: 0 };
	if (d.exp) lv = shiftExp(lv.level, lv.exp, d.exp);
	return cleanEco({ ...lv, coins: cur.coins + Math.trunc(d.coins ?? 0), potions: cur.potions + Math.trunc(d.potions ?? 0) });
}

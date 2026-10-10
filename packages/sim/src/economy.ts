/**
 * Kinh tế ở máy chủ (M3.3a — docs/ke-hoach-m3-may-chu-chien-dau.md): cấp, EXP, xu, bình hồi phục do MÁY CHỦ giữ; client chỉ báo ý định
 * (hạ quái riêng, xong nhiệm vụ, tiêu xu, uống bình) và vẽ theo số máy chủ gửi. Luật thuần dùng chung (máy chủ tính, test node).
 */
import { MAX_LEVEL } from '@aether/protocol';
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

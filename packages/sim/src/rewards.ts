/**
 * Điểm danh + thành tựu (K1 — docs/ke-hoach-kim-cuong.md). Luật thuần dùng chung: MÁY CHỦ quyết ai nhận gì (ngày theo giờ
 * máy chủ, đếm từ dữ liệu máy chủ tự ghi), client chỉ dùng để hiện chữ / tiến độ.
 */
import type { GiftView } from '@havenlord/protocol';

/** Ngày tính theo giờ Việt Nam (UTC+7) — sang ngày mới lúc 0 giờ VN, không theo đồng hồ máy người chơi. */
export const VN_OFFSET_MS = 7 * 3600_000;

/** `YYYY-MM-DD` của mốc `ms` theo giờ Việt Nam. */
export function vnDay(ms: number): string {
	return new Date(ms + VN_OFFSET_MS).toISOString().slice(0, 10);
}

/** Ngày liền trước `day` (`YYYY-MM-DD`). */
export function dayBefore(day: string): string {
	return new Date(Date.parse(`${day}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
}

/** Chuỗi điểm danh quay vòng 7 ngày: ngày thứ 8 liên tiếp nhận như ngày 1 (chuỗi vẫn đếm tiếp). */
export const CHECKIN_CYCLE = 7;

/** Ngày thứ mấy trong vòng 7 ngày (1–7) của lần điểm danh thứ `streak` liên tiếp. */
export function checkinSlot(streak: number): number {
	return ((Math.max(1, Math.floor(streak)) - 1) % CHECKIN_CYCLE) + 1;
}

/**
 * Quà điểm danh (chủ dự án 08/10/2026: "1 ngày được nhận 1 kc nếu điểm danh … quà bình thường thôi k xịn"): luôn đúng 1 kim
 * cương; xu tăng dần theo ngày trong vòng (30 → 90); ngày 7 thêm bình hồi phục. Chuỗi dài không thêm kim cương.
 */
export function checkinGift(streak: number): GiftView {
	const d = checkinSlot(streak);
	return { diamonds: 1, coins: 20 + 10 * d, potions: d === CHECKIN_CYCLE ? 3 : 1 };
}

/** Chuỗi sau khi điểm danh hôm nay: hôm qua có điểm danh thì nối, không thì về 1. */
export function nextStreak(lastDay: string | null, streak: number, today: string): number {
	return lastDay === dayBefore(today) ? streak + 1 : 1;
}

/**
 * Mục tiêu đếm được THẬT ở máy chủ (kế hoạch: trước M3 không phát kim cương cho số liệu client tự báo):
 * - `kills` / `bosses`: quái / boss DÙNG CHUNG mà máy chủ tính công (bảng `kill_counts`, M3.2) — quái riêng (khu tuổi thơ,
 *   nhiệm vụ, chơi một mình) không đếm.
 * - `maps`: số map đã đặt chân tới (máy chủ ghi lúc vào game / sang map, chỉ map có thật).
 * - `friends`: số bạn hiện có (cần người kia đồng ý).
 * Cấp nhân vật CHƯA làm mục tiêu: cấp còn do client báo (M3.3 mới chuyển lên máy chủ).
 */
export type GoalKind = 'kills' | 'bosses' | 'maps' | 'friends';

export interface GoalDef {
	id: string;
	kind: GoalKind;
	target: number;
	diamonds: number;
	title: string;
}

export type GoalStats = Record<GoalKind, number>;

export const GOALS: readonly GoalDef[] = [
	{ id: 'kills_100', kind: 'kills', target: 100, diamonds: 1, title: 'Hạ 100 quái' },
	{ id: 'kills_1k', kind: 'kills', target: 1000, diamonds: 3, title: 'Hạ 1.000 quái' },
	{ id: 'kills_10k', kind: 'kills', target: 10_000, diamonds: 5, title: 'Hạ 10.000 quái' },
	{ id: 'kills_100k', kind: 'kills', target: 100_000, diamonds: 10, title: 'Hạ 100.000 quái' },
	{ id: 'kills_1m', kind: 'kills', target: 1_000_000, diamonds: 30, title: 'Hạ 1.000.000 quái' },
	{ id: 'bosses_1', kind: 'bosses', target: 1, diamonds: 2, title: 'Hạ một boss vùng' },
	{ id: 'bosses_10', kind: 'bosses', target: 10, diamonds: 3, title: 'Hạ boss vùng 10 lần' },
	{ id: 'bosses_100', kind: 'bosses', target: 100, diamonds: 10, title: 'Hạ boss vùng 100 lần' },
	{ id: 'maps_5', kind: 'maps', target: 5, diamonds: 1, title: 'Đặt chân tới 5 map' },
	{ id: 'maps_10', kind: 'maps', target: 10, diamonds: 2, title: 'Đặt chân tới 10 map' },
	{ id: 'maps_30', kind: 'maps', target: 30, diamonds: 5, title: 'Đặt chân tới 30 map' },
	// Mỗi vùng 12 map × 10 vùng (thiết kế 12 map vùng 1, 10/10/2026 — trước là 70 theo khung 7 map/vùng; chưa ai đạt nên đổi mã an toàn).
	{ id: 'maps_120', kind: 'maps', target: 120, diamonds: 10, title: 'Đặt chân tới 120 map' },
	{ id: 'friends_1', kind: 'friends', target: 1, diamonds: 1, title: 'Kết người bạn đầu tiên' },
	{ id: 'friends_10', kind: 'friends', target: 10, diamonds: 3, title: 'Kết 10 người bạn' },
];

/** Chú thích cách đếm từng loại (hiện dưới tiêu đề nhóm). */
export const GOAL_KIND_INFO: Readonly<Record<GoalKind, { group: string; note: string }>> = {
	kills: { group: 'Săn quái', note: 'Quái ở khu thế giới dùng chung, được máy chủ tính công (đánh trúng trong 30 giây trước khi quái gục).' },
	bosses: { group: 'Săn boss', note: 'Boss vùng dùng chung (như Vua Lich ở hầm mộ Nghĩa địa).' },
	maps: { group: 'Thám hiểm', note: 'Mỗi map đặt chân tới tính một lần.' },
	friends: { group: 'Bạn bè', note: 'Số bạn hiện có trong danh sách.' },
};

/** Đếm quái / boss từ bảng số lần hạ: loại `boss_*` là boss, còn lại là quái thường. */
export function killStats(counts: Record<string, number>): Pick<GoalStats, 'kills' | 'bosses'> {
	let kills = 0;
	let bosses = 0;
	for (const [type, n] of Object.entries(counts)) {
		if (type.startsWith('boss_')) bosses += n;
		else kills += n;
	}
	return { kills, bosses };
}

/** Chỗ đứng của một NPC dịch vụ: địa điểm `spot` của map + lệch (dx, dy). Máy chủ chỉ phục vụ người đứng trong `range` px. */
export interface NpcSpot {
	npc: string;
	map: string;
	spot: string;
	dx: number;
	dy: number;
	range: number;
}

/** NPC nhận quà thành tựu: Bia Danh Vọng ở quảng trường Thistlewood (đối xứng với quầy của Bram). */
export const CHRONICLER = { npc: 'chronicler', map: 'human/town', spot: 'plaza', dx: 110, dy: -40, range: 240 } as const satisfies NpcSpot;

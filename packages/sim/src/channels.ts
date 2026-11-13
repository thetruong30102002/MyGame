/**
 * Khu (kênh) của map (chủ dự án 13/11/2026: "người dùng phải vào đúng khu giống nhau mới gặp được nhau phục vụ việc farm quái có thể bị
 * đông nên phải sang khu khác, boss to thì chỉ xuất hiện 1 khu và có thông báo thế giới khu bao nhiêu xuất hiện"): mỗi map ngoài thế
 * giới có `CHANNEL_COUNT` bản song song — người chơi, quái dùng chung, PvP, chat map đều tách theo khu. Vào map tự xếp vào khu đang
 * đứng nếu chưa đầy (`CHANNEL_SOFT_CAP`), không thì khu vắng nhất. Gia viên (`home/*`) không chia khu (bạn bè ghé phải gặp nhau).
 */
export const CHANNEL_COUNT = 5;
/** Quá số người này thì khu tính là đông — người mới vào map được xếp sang khu khác (vẫn tự chọn vào khu đông được). */
export const CHANNEL_SOFT_CAP = 15;
/** Trần cứng một khu (chọn tay cũng không vào được). */
export const CHANNEL_HARD_CAP = 40;

export const channelled = (map: string): boolean => !map.startsWith('home/');
/** Khoá bản map theo khu: `swamp/hub#2`. Map không chia khu luôn là khu 1. */
export const instanceKey = (map: string, channel: number): string => `${map}#${channelled(map) ? channel : 1}`;
export const baseMap = (instance: string): string => instance.split('#')[0]!;
export const channelOf = (instance: string): number => Number(instance.split('#')[1] ?? 1) || 1;

/** Khu cho người vào map: giữ khu mong muốn nếu chưa đông, không thì khu vắng nhất (cùng số thì khu nhỏ hơn). */
export function pickChannel(counts: readonly number[], wanted: number): number {
	const w = Math.min(CHANNEL_COUNT, Math.max(1, Math.floor(wanted) || 1));
	if ((counts[w - 1] ?? 0) < CHANNEL_SOFT_CAP) return w;
	let best = 1;
	for (let k = 2; k <= CHANNEL_COUNT; k++) if ((counts[k - 1] ?? 0) < (counts[best - 1] ?? 0)) best = k;
	return best;
}

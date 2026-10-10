/**
 * Luật boss tách khỏi Pixi để test được bằng node: hồi sinh, báo cốt truyện, chọn thanh máu boss cho HUD, thoại giới thiệu.
 *
 * Hai loại boss:
 * - Boss CỐT TRUYỆN (`boss_demon_001`, dựng qua `awakenBoss`): một lần, gắn nhiệm vụ `{ type: 'boss' }`, chết là hết.
 * - Boss VÙNG (vùng quái `boss: true` của map, vd Vua Lich ở hầm mộ Nghĩa địa): canh map, hồi sinh sau `REGION_BOSS_RESPAWN`,
 *   không đụng tới cốt truyện — hạ nó chỉ tính như hạ một con quái cho nhiệm vụ "kill".
 */

/** Quái thường gục rồi sống lại sau chừng này giây. */
export const MONSTER_RESPAWN = 14;
/** Boss vùng thức giấc lại sau ~3 phút. */
export const REGION_BOSS_RESPAWN = 180;

export interface BossFlags {
	boss: boolean;
	regionBoss: boolean;
}

/** Giây chờ hồi sinh; null = không bao giờ sống lại (boss cốt truyện). */
export function respawnDelay(f: BossFlags): number | null {
	if (f.regionBoss) return REGION_BOSS_RESPAWN;
	return f.boss ? null : MONSTER_RESPAWN;
}

export type KillOutcome = 'story-boss' | 'region-boss' | 'monster';

/**
 * Hạ xong báo gì cho cốt truyện: chỉ boss cốt truyện mới gọi `bossDefeated`. Boss vùng hồi sinh mãi — để nó gọi
 * `bossDefeated` là mở cửa cho nhiệm vụ boss sau này hoàn thành nhờ "farm" lại, nên nó đi đường quái thường.
 */
export function killOutcome(f: BossFlags): KillOutcome {
	if (f.regionBoss) return 'region-boss';
	return f.boss ? 'story-boss' : 'monster';
}

interface BossLike {
	dead: boolean;
	engaged: boolean;
	actor: { x: number; y: number };
}

/**
 * Boss hiện thanh máu trên HUD: boss cốt truyện đang giao chiến luôn được ưu tiên; không có thì boss vùng đang giao
 * chiến gần người chơi nhất. Không ai giao chiến → null (HUD ẩn thanh).
 */
export function pickHudBoss<T extends BossLike>(story: T | null, region: readonly T[], px: number, py: number): T | null {
	if (story && !story.dead && story.engaged) return story;
	let best: T | null = null;
	let bestD = Infinity;
	for (const b of region) {
		if (b.dead || !b.engaged) continue;
		const d = Math.hypot(b.actor.x - px, b.actor.y - py);
		if (d < bestD) [best, bestD] = [b, d];
	}
	return best;
}

/** Thoại giới thiệu theo id boss. Boss không có ở đây thì im lặng — không mượn lời Quỷ vương. */
export const BOSS_INTRO: Record<string, readonly string[]> = {
	boss_demon_001: ['Kẻ… mang ánh sáng… ngươi đánh thức ta rồi.', 'Phong ấn này… sẽ là mồ chôn của ngươi!'],
	boss_lich_001: [
		'Lại một kẻ còn hơi ấm… dám bước xuống hầm mộ của ta.',
		'Những sợi tơ quanh ngươi sáng quá. Dưới này, thứ ánh sáng nào rồi cũng tắt.',
		'Nằm xuống đi. Nghĩa địa này chưa bao giờ thiếu chỗ.',
	],
	// Câu đầu hé lộ đã có người tới trước (kẻ dùng cỗ máy đo đi qua Đường hầm của Đoàn — Chương 1 mục 6).
	boss_stone_gargoyle_001: [
		'Ba trăm năm canh giữ… và hôm nay đã có kẻ thứ hai tìm tới.',
		'Tên khắc trên đá không dành cho mắt ngươi.',
		'Đứng yên. Gian này còn chỗ cho thêm một pho tượng.',
	],
};

/**
 * Thoại cần chiếu khi boss `id` thấy người chơi; null = không chiếu. Boss vùng chỉ giới thiệu MỘT lần mỗi phiên
 * (`seen` do Game giữ suốt phiên, qua cả đổi map) — hồi sinh hay quay lại hầm mộ không lặp lại màn chào.
 */
export function bossIntro(id: string, regionBoss: boolean, seen: Set<string>): readonly string[] | null {
	const lines = BOSS_INTRO[id];
	if (!lines?.length) return null;
	if (regionBoss) {
		if (seen.has(id)) return null;
		seen.add(id);
	}
	return lines;
}

/** Toast khi hạ boss vùng: báo luôn là nó sẽ quay lại, để người chơi không tưởng đã dọn sạch vĩnh viễn. */
export function regionBossDownText(name: string, place: string): string {
	return `${name} đã ngã — ${place.toLowerCase()} sẽ lại thức giấc sau ít phút…`;
}

/**
 * Boss vùng còn phải nằm bao lâu khi map được dựng lại. Đồng hồ hồi sinh nằm trong Fighter nên đổi map là mất —
 * Game ghi mốc `wakeAt` (theo `CombatSystem.time`) lúc gỡ map rồi hỏi lại ở đây khi dựng vùng; 0 = dựng sống ngay.
 * Không có mốc này thì cứ ra cổng rồi vào lại là có boss mới đầy máu, bỏ qua `REGION_BOSS_RESPAWN`.
 */
export function regionBossDormancy(wakeAt: number | undefined, now: number): number {
	return wakeAt === undefined ? 0 : Math.max(0, wakeAt - now);
}

/**
 * Hết giờ chờ rồi boss vùng có được thức dậy chưa: người chơi còn đứng trong vùng canh (bán kính hang ổ + tầm aggro)
 * thì hoãn — không để boss hiện ra sát cạnh rồi lao vào đánh ngay. `playerDist` null = người chơi đang gục.
 * Quái thường giữ nhịp cũ (sống lại đúng hạn).
 */
export function regionBossMayWake(f: BossFlags, playerDist: number | null, guard: number): boolean {
	return !f.regionBoss || playerDist === null || playerDist >= guard;
}

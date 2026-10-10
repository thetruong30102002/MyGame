import type { ClientMessage, DailyView, GoalView, ServerMessage } from '@aether/protocol';
import { hubKeys } from '@aether/sim/regions';
import { checkinGift, checkinSlot, CHRONICLER, dayBefore, GOALS, killStats, nextStreak, vnDay, type GoalStats } from '@aether/sim/rewards';
import type { Store } from './db.ts';
import { mapExists, nearNpc } from './maps.ts';

/** Phần thế giới mà ví / quà cần: gửi tin + người chơi đang đứng đâu. */
export interface RewardsHost {
	send(player: string, msg: ServerMessage): void;
	where(player: string): { map: string; x: number; y: number } | null;
	/** Cộng xu + bình của quà (kinh tế ở máy chủ — M3.3a); `ref` chống trao lặp. */
	gift(player: string, coins: number, potions: number, ref: string): void;
}

type RewardMessage = Extract<ClientMessage, { t: 'checkin' | 'goals' | 'goalClaim' | 'hubs' }>;

/**
 * Ví kim cương + điểm danh + thành tựu (K1 — docs/ke-hoach-kim-cuong.md). Máy chủ quyết hết: ngày theo giờ máy chủ, tiến độ
 * thành tựu đếm từ dữ liệu máy chủ tự ghi (số lần hạ quái dùng chung, map đã tới, bạn bè), kim cương chỉ nằm trong CSDL.
 */
export class Rewards {
	constructor(
		private readonly store: Store,
		private readonly host: RewardsHost,
		private readonly mapsDir: string,
		private readonly now: () => number = Date.now,
	) {}

	/** Vừa vào game: số dư ví + trạng thái điểm danh hôm nay. */
	online(player: string): void {
		this.host.send(player, { t: 'wallet', diamonds: this.store.diamonds(player) });
		this.host.send(player, { t: 'daily', daily: this.daily(player) });
	}

	/** Đặt chân tới map (vào game / sang map) — chỉ đếm map có thật. */
	visit(player: string, map: string): void {
		if (mapExists(this.mapsDir, map)) this.store.visit(player, map);
	}

	handle(player: string, msg: RewardMessage): void {
		if (msg.t === 'checkin') return this.checkin(player);
		if (msg.t === 'goals') return this.host.send(player, { t: 'goals', list: this.goals(player) });
		if (msg.t === 'hubs') return this.host.send(player, { t: 'hubs', list: this.hubs(player), maps: this.store.visitedMaps(player) });
		return this.claim(player, String(msg.id ?? ''));
	}

	daily(player: string): DailyView {
		const today = vnDay(this.now());
		const s = this.store.checkinState(player);
		const done = s.lastDay === today;
		// Chuỗi đang SỐNG: điểm danh hôm nay hoặc hôm qua; bỏ một ngày là đứt (hiện 0, lần kế bắt đầu lại từ ngày 1).
		const streak = done || s.lastDay === dayBefore(today) ? s.streak : 0;
		const month = this.store.checkinDays(player, today.slice(0, 7));
		return { day: today, done, streak, next: checkinGift(done ? streak + 1 : nextStreak(s.lastDay, s.streak, today)), month };
	}

	/** Trạm (map trạm của vùng đã mở) đã từng đặt chân tới — cột dịch chuyển chỉ đưa tới những chỗ này. */
	hubs(player: string): string[] {
		const been = new Set(this.store.visitedMaps(player));
		return hubKeys().filter((k) => been.has(k));
	}

	stats(player: string): GoalStats {
		return { ...killStats(this.store.killCounts(player)), maps: this.store.visitedCount(player), friends: this.store.friendIds(player).length };
	}

	goals(player: string): GoalView[] {
		const stats = this.stats(player);
		const claimed = new Set(this.store.claimedGoals(player));
		return GOALS.map((g) => ({ id: g.id, progress: stats[g.kind], claimed: claimed.has(g.id) }));
	}

	private checkin(player: string): void {
		const today = vnDay(this.now());
		const s = this.store.checkinState(player);
		const streak = nextStreak(s.lastDay, s.streak, today);
		const gift = checkinGift(streak);
		const balance = s.lastDay === today ? null : this.store.checkin(player, today, streak, gift.diamonds);
		if (balance === null) {
			this.host.send(player, { t: 'system', text: 'Hôm nay bạn đã điểm danh rồi — quay lại vào ngày mai nhé' });
			return this.host.send(player, { t: 'daily', daily: this.daily(player) });
		}
		this.host.gift(player, gift.coins, gift.potions, `checkin-gift:${player}:${today}`);
		this.host.send(player, { t: 'gift', reason: 'checkin', title: `Điểm danh ngày ${checkinSlot(streak)}`, gift });
		this.host.send(player, { t: 'wallet', diamonds: balance });
		this.host.send(player, { t: 'daily', daily: this.daily(player) });
	}

	private claim(player: string, id: string): void {
		const g = GOALS.find((x) => x.id === id);
		if (!g) return;
		if (!nearNpc(this.mapsDir, this.host.where(player), CHRONICLER)) return this.host.send(player, { t: 'system', text: 'Hãy tới Bia Danh Vọng ở quảng trường Thistlewood để nhận quà thành tựu' });
		if (this.stats(player)[g.kind] < g.target) return this.host.send(player, { t: 'system', text: `Chưa đạt mục tiêu "${g.title}"` });
		const balance = this.store.claimGoal(player, g.id, g.diamonds);
		if (balance !== null) {
			this.host.send(player, { t: 'gift', reason: 'goal', title: g.title, gift: { diamonds: g.diamonds, coins: 0, potions: 0 } });
			this.host.send(player, { t: 'wallet', diamonds: balance });
		}
		this.host.send(player, { t: 'goals', list: this.goals(player) });
	}
}

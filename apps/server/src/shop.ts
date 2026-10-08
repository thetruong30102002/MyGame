import type { ServerMessage } from '@aether/protocol';
import { BUFF_MAX_MS, buffPower, MERCHANT, SHOP } from '@aether/sim/shop';
import type { Store } from './db.ts';
import { nearNpc } from './maps.ts';

/** Phần thế giới cửa hàng cần: gửi tin + người chơi đang đứng đâu (chỉ bán khi đứng cạnh Bram). */
export interface ShopHost {
	send(player: string, msg: ServerMessage): void;
	where(player: string): { map: string; x: number; y: number } | null;
}

/** Nhịp trừ giờ chơi của bình (ms) — đủ mịn cho đồng hồ phút:giây ở client (client tự đếm lùi giữa hai nhịp). */
export const BUFF_TICK_MS = 5000;

/**
 * Cửa hàng kim cương + bình thời hạn (K1 — docs/ke-hoach-kim-cuong.md), bán ở quầy Bram (`MERCHANT` — đứng xa thì không bán).
 * Giá theo danh mục CỦA MÁY CHỦ (`@aether/sim/shop`); kim cương trừ và bình ghi trong một transaction. Thời gian bình chỉ trôi lúc người chơi online: vào game bắt đầu đếm, mỗi
 * `BUFF_TICK_MS` trừ phần đã chơi, rời game trừ nốt.
 */
export class Shop {
	/** Người đang online → mốc (ms) đã trừ giờ chơi tới đó. */
	private readonly counted = new Map<string, number>();

	constructor(
		private readonly store: Store,
		private readonly host: ShopHost,
		private readonly mapsDir: string,
		private readonly now: () => number = Date.now,
	) {}

	private send(player: string, msg: ServerMessage): void {
		this.host.send(player, msg);
	}

	/** Vừa vào game: bắt đầu đếm giờ + gửi bình đang có. */
	online(player: string): void {
		this.counted.set(player, this.now());
		this.send(player, { t: 'buffs', list: this.store.buffs(player) });
	}

	/** Rời game: trừ nốt phần đã chơi, thôi đếm. */
	offline(player: string): void {
		this.spend(player);
		this.counted.delete(player);
	}

	/** Gọi định kỳ: trừ giờ chơi cho mọi người online; bình nào vừa hết thì gửi lại danh sách. */
	tick(): void {
		for (const player of this.counted.keys()) if (this.spend(player) > 0) this.send(player, { t: 'buffs', list: this.store.buffs(player) });
	}

	buy(player: string, raw: unknown): void {
		const item = SHOP.find((x) => x.id === String(raw ?? ''));
		if (!item) return;
		if (!nearNpc(this.mapsDir, this.host.where(player), MERCHANT)) return this.send(player, { t: 'system', text: 'Hãy tới quầy của Bram ở quảng trường Thistlewood để mua hàng' });
		// Trừ giờ đã chơi TRƯỚC khi so bình đang có / cộng thời gian — không thì phần chơi từ nhịp trước được tính lại.
		this.spend(player);
		const r = this.store.buyBuff(player, { id: item.id, price: item.price, kind: item.buff.kind, mult: item.buff.mult, ms: item.buff.minutes * 60_000 }, buffPower, BUFF_MAX_MS);
		if (r === 'weaker') return this.send(player, { t: 'system', text: `Bạn đang có bình mạnh hơn ${item.name} — đợi bình đó hết giờ đã` });
		if (r === 'poor') return this.send(player, { t: 'system', text: `Không đủ kim cương để mua ${item.name} (cần ${item.price})` });
		this.send(player, { t: 'bought', item: item.id });
		this.send(player, { t: 'wallet', diamonds: r.balance });
		this.send(player, { t: 'buffs', list: this.store.buffs(player) });
	}

	private spend(player: string): number {
		const from = this.counted.get(player);
		if (from === undefined) return 0;
		const t = this.now();
		this.counted.set(player, t);
		return t > from ? this.store.spendBuffs(player, t - from) : 0;
	}
}

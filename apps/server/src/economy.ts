import type { EcoGain, ServerMessage } from '@aether/protocol';
import { addExp, capExpGain, cleanEco, COIN_CAP, POTION_CAP, type Eco, type EcoReason } from '@aether/sim/economy';
import { CHILD_ZONE_LEVEL_CAP } from '@aether/sim/mobs';
import { buffMults } from '@aether/sim/shop';
import { ENEMY_STATS, enemyStatsAt, type EnemyStats } from '@aether/sim/skills';
import { questDef } from '@aether/sim/story/quests';
import { RateLimiter } from './auth.ts';
import type { Store } from './db.ts';
import { privateKill } from './maps.ts';

/** Quái thường hồi sinh sau ~14 giây (`@aether/sim/bossRules` `respawnDelay`) — nhịp tính trần số lần báo hạ quái riêng. */
const RESPAWN_MS = 14_000;

/** Phần thế giới mà kinh tế cần: gửi tin + map người chơi đang đứng (kiểm quái riêng có trên map đó). */
export interface EconomyHost {
	send(player: string, msg: ServerMessage): void;
	map(player: string): string | null;
}

/**
 * Kinh tế ở máy chủ (M3.3a — docs/ke-hoach-m3-may-chu-chien-dau.md): cấp, EXP, xu, bình hồi phục. Máy chủ là nguồn sự thật: gói
 * `save` của client không ghi đè được (`Store.saveProgress` giữ nguyên bốn số này), mọi thay đổi đi qua `change` — lưu CSDL, ghi nhật
 * ký (trừ hạ quái thường: đã đếm ở `kill_counts`), gửi `eco` cho client kèm phần vừa nhận.
 *
 * Nguồn: quái dùng chung (máy chủ tự tính công — M3.2), quái riêng client báo (chỉ loại có trên map đang đứng, có nhịp trần; boss cốt
 * truyện một lần), nhiệm vụ (thưởng theo dữ liệu truyện dùng chung, mỗi nhiệm vụ một lần), quà điểm danh. Tiêu: tẩy điểm, dịch chuyển,
 * uống bình — client làm ngay, máy chủ trừ (thiếu thì bỏ qua, client nhận lại số thật).
 */
export class Economy {
	private readonly eco = new Map<string, Eco>();
	/** Quái riêng: tối đa 30 con / 30 giây cộng mọi loại (trần chung chống báo dồn dập). */
	private readonly privateKills = new RateLimiter(30, 30_000);
	/** Mỗi loại quái riêng trên một map: tối đa bằng SỐ CON của loại đó trên map trong một nhịp hồi sinh — không cày quá số quái có thật. */
	private readonly perZone = new Map<string, number[]>();

	constructor(
		private readonly store: Store,
		private readonly host: EconomyHost,
		private readonly mapsDir: string,
		private readonly now: () => number = Date.now,
	) {}

	/** Vừa vào game: nạp số của CSDL (bản lưu cũ client tự ghi được kẹp lại) và gửi cho client. */
	online(player: string): void {
		const e = cleanEco(this.store.ecoOf(player));
		this.eco.set(player, e);
		this.host.send(player, { t: 'eco', ...e });
	}

	offline(player: string): void {
		this.eco.delete(player);
	}

	get(player: string): Eco | undefined {
		return this.eco.get(player);
	}

	/**
	 * Quái DÙNG CHUNG gục, người này được tính công (MobRegistry): EXP (× bình EXP đang dùng) + xu theo chỉ số của CHÍNH con quái đó
	 * (`stats` — đã nhân theo cấp của khu); vắng thì theo bảng gốc của loại.
	 */
	sharedKill(player: string, type: string, stats?: Pick<EnemyStats, 'exp' | 'coins'>): void {
		const s = stats ?? ENEMY_STATS[type];
		if (!s || !this.eco.has(player)) return;
		const exp = Math.round(s.exp * buffMults(this.store.buffs(player)).exp);
		this.change(player, { exp, coins: s.coins }, 'kill', type);
	}

	/**
	 * Quái RIÊNG (khu tuổi thơ / nhiệm vụ / boss cốt truyện) gục ở máy người chơi: chỉ nhận loại có trong khu riêng (hoặc là boss) của
	 * map đang đứng, trong nhịp trần; boss cốt truyện trao một lần cho mỗi nhân vật. `rawZone`: khu client báo — EXP / xu theo cấp của
	 * khu (`enemyStatsAt`), khu tuổi thơ thì EXP không đưa nhân vật quá `CHILD_ZONE_LEVEL_CAP` (xu vẫn nhận).
	 */
	privateKill(player: string, raw: unknown, rawZone?: unknown): void {
		const type = String(raw ?? '');
		const map = this.host.map(player);
		if (!ENEMY_STATS[type] || !map || !this.eco.has(player)) return;
		const zone = typeof rawZone === 'string' && rawZone ? rawZone.slice(0, 64) : undefined;
		const found = privateKill(this.mapsDir, map, type, zone);
		if (!found) return;
		if (found.kind === 'zone' && !this.withinRespawn(`${player}|${map}|${type}`, found.count)) return;
		if (!this.privateKills.allow(player)) return;
		const s = enemyStatsAt(type, found.kind === 'zone' ? found.level : undefined)!;
		let exp = Math.round(s.exp * buffMults(this.store.buffs(player)).exp);
		if (found.kind === 'boss') return void this.change(player, { exp, coins: s.coins }, 'boss', type, `boss:${type}`);
		if (found.child) {
			const cur = this.eco.get(player)!;
			exp = capExpGain(cur.level, cur.exp, exp, CHILD_ZONE_LEVEL_CAP);
		}
		this.change(player, { exp, coins: s.coins }, 'kill', type);
	}

	/** Xong nhiệm vụ `id`: thưởng theo dữ liệu truyện của máy chủ, mỗi nhiệm vụ một lần. */
	quest(player: string, raw: unknown): void {
		const q = questDef(String(raw ?? ''));
		if (!q || !this.eco.has(player)) return;
		this.change(player, { exp: q.reward.exp, coins: q.reward.coins ?? 0, potions: q.reward.potions ?? 0 }, 'quest', q.title, `quest:${q.id}`);
	}

	/** Quà điểm danh (xu + bình — kim cương đã vào ví riêng). `ref` chống trao lặp. */
	gift(player: string, coins: number, potions: number, ref: string): void {
		this.change(player, { coins, potions }, 'checkin', 'Điểm danh', ref);
	}

	/** Tiêu xu (`reason`: tẩy điểm, dịch chuyển…). Thiếu xu thì không trừ — gửi lại số thật cho client. */
	spend(player: string, rawReason: unknown, rawAmount: unknown): void {
		const e = this.eco.get(player);
		const amount = Math.floor(Number(rawAmount));
		if (!e || !Number.isFinite(amount) || amount <= 0) return;
		const reason = String(rawReason ?? '').slice(0, 24) || 'khác';
		if (e.coins < amount) return this.host.send(player, { t: 'eco', ...e });
		this.change(player, { coins: -amount }, 'spend', reason);
	}

	/** Uống một bình hồi phục (máu hồi ở client). Hết bình thì gửi lại số thật. */
	usePotion(player: string): void {
		const e = this.eco.get(player);
		if (!e) return;
		if (e.potions <= 0) return this.host.send(player, { t: 'eco', ...e });
		this.change(player, { potions: -1 }, 'potion', 'Bình hồi phục');
	}

	/** Còn chỗ trong nhịp hồi sinh: trong `RESPAWN_MS` gần nhất đã tính chưa tới `count` con (rồi ghi lần này). */
	private withinRespawn(key: string, count: number): boolean {
		const t = this.now();
		const list = (this.perZone.get(key) ?? []).filter((at) => t - at < RESPAWN_MS);
		if (list.length >= count) {
			this.perZone.set(key, list);
			return false;
		}
		list.push(t);
		this.perZone.set(key, list);
		return true;
	}

	/**
	 * MỘT cửa cho mọi thay đổi: cộng EXP (lên cấp), xu, bình (kẹp trần) → lưu CSDL + nhật ký (`ref` đã dùng thì bỏ cả lần này) → gửi
	 * `eco` kèm phần nhận. Hạ quái thường không ghi nhật ký (số lần hạ đã ở `kill_counts`, ghi từng con thì bảng phình rất nhanh).
	 */
	private change(player: string, d: { exp?: number; coins?: number; potions?: number }, reason: EcoReason, what: string, ref?: string): void {
		const cur = this.eco.get(player);
		if (!cur) return;
		const lv = addExp(cur.level, cur.exp, d.exp ?? 0);
		const next: Eco = {
			level: lv.level,
			exp: lv.exp,
			coins: Math.max(0, Math.min(COIN_CAP, cur.coins + Math.floor(d.coins ?? 0))),
			potions: Math.max(0, Math.min(POTION_CAP, cur.potions + Math.floor(d.potions ?? 0))),
		};
		const logged = reason !== 'kill' && reason !== 'potion';
		if (!this.store.saveEco(player, next, logged ? { reason: `${reason}:${what}`, coins: next.coins - cur.coins, potions: next.potions - cur.potions, exp: d.exp ?? 0, ref: ref ?? null } : null)) return;
		this.eco.set(player, next);
		const gain: EcoGain = { exp: d.exp ?? 0, coins: next.coins - cur.coins, potions: next.potions - cur.potions, levels: lv.levelsGained, reason, what };
		this.host.send(player, { t: 'eco', ...next, gain });
	}
}

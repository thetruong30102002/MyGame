import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { MobMove, MobView, ServerMessage } from '@aether/protocol';
import { respawnDelay } from '@aether/sim/bossRules';
import { isSharedZone, MOB_CREDIT_SECONDS, MOB_HIT_RANGE, MOB_OWNER_SWITCH, mobId, zoneSpawnPoints, type MonsterZoneDef } from '@aether/sim/mobs';
import { ENEMY_STATS } from '@aether/sim/skills';

/** Phần thế giới mà sổ quái cần: vị trí người chơi + gửi tin. */
export interface MobHost {
	position(player: string): { x: number; y: number } | null;
	send(player: string, msg: ServerMessage): void;
	/** Một người được tính công hạ quái loại `type` (đếm cho thành tựu). */
	credited(player: string, type: string): void;
}

interface Mob extends MobView {
	stats: (typeof ENEMY_STATS)[string];
	regionBoss: boolean;
	/** Ai đã gây sát thương + lúc nào (ms) — tính công khi quái gục. */
	hitters: Map<string, number>;
	respawnAt: number;
	/** Vị trí + giờ (ms) chủ báo lần cuối — chặn quái "dịch chuyển" quá tốc độ. */
	movedAt: number;
	dir: string;
	anim: string;
}

interface MapMobs {
	mobs: Map<string, Mob>;
	subs: Set<string>;
	/** Vị trí thay đổi từ lần phát trước (phát gộp 10 lần/giây). */
	dirty: Set<string>;
}

/** Đọc map JSON của client (cùng nguồn dữ liệu, không chép sang máy chủ). */
export function mapZonesFromDisk(dir: string): (map: string) => MonsterZoneDef[] {
	return (map) => {
		const [region, name] = map.split('/');
		if (!region || !name) return [];
		try {
			const d = JSON.parse(readFileSync(join(dir, region, `${name}.json`), 'utf8')) as { monsterZones?: MonsterZoneDef[] };
			return d.monsterZones ?? [];
		} catch {
			return [];
		}
	};
}

/**
 * Sổ quái dùng chung theo map (M3.2): máy chủ giữ máu, sống / chết, hồi sinh, ai được tính công; một người chơi trong map
 * làm "chủ" mỗi con và chạy AI (vị trí báo lên, máy chủ phát lại cho người khác). Đòn đánh do client báo, máy chủ kiểm
 * tầm / trần trước khi trừ máu. Kiểm sát thương theo chỉ số người chơi để M3.3 (khi cấp / trang bị nằm ở máy chủ).
 */
export class MobRegistry {
	private readonly maps = new Map<string, MapMobs>();
	/** Người chơi → map đang nhận quái. */
	private readonly subOf = new Map<string, string>();

	constructor(
		private readonly host: MobHost,
		private readonly zonesOf: (map: string) => MonsterZoneDef[],
		private readonly now: () => number = Date.now,
	) {}

	subscribe(player: string, map: string): void {
		this.unsubscribe(player);
		const m = this.ensure(map);
		if (!m.mobs.size) return;
		m.subs.add(player);
		this.subOf.set(player, map);
		// Quái chưa có chủ (map vắng người) → người mới vào làm chủ.
		for (const mob of m.mobs.values()) if (!mob.owner) this.setOwner(m, mob, player, false);
		this.host.send(player, { t: 'mobs', map, list: [...m.mobs.values()].map(view) });
	}

	unsubscribe(player: string): void {
		const map = this.subOf.get(player);
		if (!map) return;
		this.subOf.delete(player);
		const m = this.maps.get(map);
		if (!m) return;
		m.subs.delete(player);
		// Quái của người vừa đi chuyển cho người gần nhất còn ở map; không còn ai thì để trống (đứng yên chờ).
		for (const mob of m.mobs.values()) if (mob.owner === player) this.setOwner(m, mob, this.nearest(m, mob), true);
	}

	/** Chủ báo vị trí: chỉ nhận cho quái mình làm chủ, còn sống, không nhảy quá tốc độ (×2 + bù trễ mạng). */
	positions(player: string, list: unknown): void {
		const m = this.mapOf(player);
		if (!m || !Array.isArray(list)) return;
		const t = this.now();
		for (const raw of list.slice(0, 64)) {
			if (!Array.isArray(raw)) continue;
			const [id, x, y, dir, anim] = raw as MobMove;
			const mob = m.mobs.get(String(id));
			if (!mob || mob.owner !== player || mob.dead || !Number.isFinite(x) || !Number.isFinite(y)) continue;
			const dt = Math.max(0.05, (t - mob.movedAt) / 1000);
			if (Math.hypot(x - mob.x, y - mob.y) > mob.stats.speed * 2 * dt + 80) continue;
			Object.assign(mob, { x: Math.round(x), y: Math.round(y), dir: String(dir).slice(0, 2), anim: String(anim).slice(0, 8), movedAt: t });
			m.dirty.add(mob.id);
		}
	}

	/** Quái lao vào `player`: đổi chủ nếu người này gần nó hơn chủ cũ (hoặc chưa có chủ). */
	aggro(player: string, id: string): void {
		const m = this.mapOf(player);
		const mob = m?.mobs.get(String(id));
		if (!m || !mob || mob.dead || mob.owner === player) return;
		const me = this.host.position(player);
		const cur = mob.owner ? this.host.position(mob.owner) : null;
		if (!me) return;
		if (!cur || Math.hypot(me.x - mob.x, me.y - mob.y) + MOB_OWNER_SWITCH < Math.hypot(cur.x - mob.x, cur.y - mob.y)) this.setOwner(m, mob, player, true);
	}

	/** Đòn trúng: kiểm (còn sống, số hợp lệ, đứng đủ gần), trừ máu, phát cho cả map; về 0 thì gục + tính công. */
	hit(player: string, id: string, dmg: unknown): void {
		const m = this.mapOf(player);
		const mob = m?.mobs.get(String(id));
		const amount = Math.floor(Number(dmg));
		if (!m || !mob || mob.dead || !Number.isFinite(amount) || amount <= 0) return;
		const me = this.host.position(player);
		if (!me || Math.hypot(me.x - mob.x, me.y - mob.y) > MOB_HIT_RANGE) return;
		const t = this.now();
		const real = Math.min(mob.hp, amount);
		mob.hp -= real;
		mob.hitters.set(player, t);
		this.broadcast(m, { t: 'mobHp', id: mob.id, hp: mob.hp, by: player, dmg: real });
		if (mob.hp > 0) return;
		mob.dead = true;
		const delay = respawnDelay({ boss: mob.boss, regionBoss: mob.regionBoss });
		mob.respawnAt = delay === null ? Infinity : t + delay * 1000;
		const credit = [...mob.hitters].filter(([, at]) => t - at <= MOB_CREDIT_SECONDS * 1000).map(([p]) => p);
		mob.hitters.clear();
		for (const p of credit) this.host.credited(p, mob.type);
		this.broadcast(m, { t: 'mobDie', id: mob.id, by: player, credit });
	}

	/** Nhịp 10 lần/giây: phát vị trí đã đổi, hồi sinh quái tới giờ. */
	tick(): void {
		const t = this.now();
		for (const m of this.maps.values()) {
			if (m.dirty.size && m.subs.size) {
				const list: MobMove[] = [];
				for (const id of m.dirty) {
					const mob = m.mobs.get(id);
					if (mob && !mob.dead) list.push([mob.id, mob.x, mob.y, mob.dir, mob.anim]);
				}
				for (const p of m.subs) {
					const others = list.filter(([id]) => m.mobs.get(id)?.owner !== p);
					if (others.length) this.host.send(p, { t: 'mobMove', list: others });
				}
			}
			m.dirty.clear();
			for (const mob of m.mobs.values()) {
				if (!mob.dead || t < mob.respawnAt) continue;
				// Boss vùng / quái sống lại quanh chỗ canh (không đúng chỗ cũ), máu đầy, chủ = người gần nhất.
				const a = Math.random() * Math.PI * 2;
				const r = Math.random() * mob.home.r * 0.7;
				Object.assign(mob, { dead: false, hp: mob.hpMax, x: Math.round(mob.home.x + Math.cos(a) * r), y: Math.round(mob.home.y + Math.sin(a) * r), movedAt: t });
				mob.owner = this.nearest(m, mob);
				this.broadcast(m, { t: 'mobSpawn', mob: view(mob) });
			}
		}
	}

	/** Cho test / quản trị. */
	mob(map: string, id: string): MobView | null {
		const mob = this.maps.get(map)?.mobs.get(id);
		return mob ? view(mob) : null;
	}

	private ensure(map: string): MapMobs {
		let m = this.maps.get(map);
		if (m) return m;
		m = { mobs: new Map(), subs: new Set(), dirty: new Set() };
		const t = this.now();
		for (const z of this.zonesOf(map)) {
			if (!isSharedZone(z)) continue;
			for (const s of zoneSpawnPoints(z)) {
				const stats = ENEMY_STATS[s.type];
				if (!stats) continue;
				const id = mobId(map, z.id, s.index);
				const boss = !!z.boss || s.type.startsWith('boss_');
				m.mobs.set(id, {
					id,
					type: s.type,
					zone: z.id,
					x: Math.round(s.x),
					y: Math.round(s.y),
					hp: stats.hp,
					hpMax: stats.hp,
					dead: false,
					owner: null,
					home: { x: z.x, y: z.y, r: z.radius },
					boss,
					stats,
					regionBoss: !!z.boss,
					hitters: new Map(),
					respawnAt: 0,
					movedAt: t,
					dir: 'S',
					anim: 'idle',
				});
			}
		}
		this.maps.set(map, m);
		return m;
	}

	private mapOf(player: string): MapMobs | null {
		const map = this.subOf.get(player);
		return map ? (this.maps.get(map) ?? null) : null;
	}

	private nearest(m: MapMobs, mob: Mob): string | null {
		let best: string | null = null;
		let bestD = Infinity;
		for (const p of m.subs) {
			const pos = this.host.position(p);
			const d = pos ? Math.hypot(pos.x - mob.x, pos.y - mob.y) : 1e9;
			if (d < bestD) [best, bestD] = [p, d];
		}
		return best;
	}

	private setOwner(m: MapMobs, mob: Mob, owner: string | null, announce: boolean): void {
		if (mob.owner === owner) return;
		mob.owner = owner;
		mob.movedAt = this.now();
		if (announce) this.broadcast(m, { t: 'mobOwner', id: mob.id, owner });
	}

	private broadcast(m: MapMobs, msg: ServerMessage): void {
		for (const p of m.subs) this.host.send(p, msg);
	}
}

function view(m: Mob): MobView {
	return { id: m.id, type: m.type, zone: m.zone, x: m.x, y: m.y, hp: m.hp, hpMax: m.hpMax, dead: m.dead, owner: m.owner, home: m.home, boss: m.boss };
}

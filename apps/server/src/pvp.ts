import type { ActionFx, ServerMessage } from '@aether/protocol';
import { pvpAllowedOn, pvpBuild, pvpDamage, pvpInStrike, pvpStrikes, PVP_KILL_WINDOW_MS, PVP_SPAWN_SHIELD_MS, type PvpBuild, type PvpStrike } from '@aether/sim/pvp';
import { HERO_SKILLS, type SkillDef } from '@aether/sim/skills';

const SKILLS: ReadonlyMap<string, SkillDef> = new Map(HERO_SKILLS.map((s) => [s.id, s]));

/** Phần PvP của một kết nối: sức đánh (suy từ tiến độ đã lưu), miễn PvP sau khi vào map, ai vừa đánh trúng mình. */
export interface PvpState {
	story: unknown;
	bonus: number;
	shieldUntil: number;
	hitBy: Map<string, number>;
}

/** Thứ `Pvp` cần biết về một người chơi đang online. */
export interface PvpPlayer {
	view: { id: string; name: string; level: number; x: number; y: number; sprite: string; hp?: number; hpMax?: number };
	map: string;
	pvp: PvpState;
}

export const newPvpState = (story: unknown, bonus: number, now: number): PvpState => ({ story, bonus, shieldUntil: now + PVP_SPAWN_SHIELD_MS, hitBy: new Map() });

const buildOf = (p: PvpPlayer): PvpBuild => pvpBuild(p.view.level, p.pvp.story, p.pvp.bonus);

/**
 * Người đánh người trên máy chủ (`@aether/sim/pvp`): mỗi chiêu hợp lệ ở map cho phép PvP → hẹn các lần xét trúng theo hình học
 * của chiêu, xét trên vị trí máy chủ giữ LÚC ĐÓ (đứng ra khỏi vùng kịp là né được), tính sát thương, phát `pvpHit` cho cả map.
 * Máy bị đánh tự trừ máu (còn xét né / thế đỡ của nó) và báo `pvpDown` khi gục.
 */
export class Pvp {
	constructor(
		private readonly players: () => Iterable<PvpPlayer>,
		private readonly sendTo: (id: string, msg: ServerMessage) => void,
		private readonly now: () => number = Date.now,
		private readonly schedule: (ms: number, run: () => void) => void = (ms, run) => void setTimeout(run, ms),
		private readonly rand: () => number = Math.random,
	) {}

	private inMap(map: string): PvpPlayer[] {
		return [...this.players()].filter((p) => p.map === map && p.view.sprite);
	}

	private alive(p: PvpPlayer): boolean {
		return p.view.hp === undefined || p.view.hp > 0;
	}

	/** Người chơi `p` vừa tung chiêu `skillId` (đã kiểm) với phần chiêu `fx` (đã chuẩn hoá + kẹp điểm nhắm). */
	cast(p: PvpPlayer, skillId: string, fx: ActionFx): void {
		const skill = SKILLS.get(skillId);
		if (!skill || !pvpAllowedOn(p.map) || !this.alive(p)) return;
		const map = p.map;
		const x0 = p.view.x;
		const y0 = p.view.y;
		for (const st of pvpStrikes(skill.id, x0, y0, fx.ax, fx.ay, fx.tx, fx.ty)) {
			this.schedule(st.delay * 1000, () => this.strike(p, map, skill, st, x0, y0));
		}
	}

	private strike(p: PvpPlayer, map: string, skill: SkillDef, st: PvpStrike, x0: number, y0: number): void {
		// Người đánh đã rời map / gục / thoát: đòn thôi.
		if (p.map !== map || !this.alive(p) || ![...this.players()].includes(p)) return;
		const now = this.now();
		const strike = st.follow ? recenter(st, p.view.x - x0, p.view.y - y0) : st;
		let targets = this.inMap(map).filter((o) => o !== p && this.alive(o) && o.pvp.shieldUntil <= now && pvpInStrike(strike, o.view.x, o.view.y));
		if (strike.first && targets.length > 1) {
			const f = strike.first;
			targets.sort((a, b) => Math.hypot(a.view.x - f.x, a.view.y - f.y) - Math.hypot(b.view.x - f.x, b.view.y - f.y));
			targets = targets.slice(0, 1);
		}
		const att = buildOf(p);
		for (const o of targets) {
			const d = pvpDamage(skill, att, buildOf(o), this.rand);
			const dmg = Math.max(1, Math.round(d.dmg * strike.scale));
			o.pvp.hitBy.set(p.view.id, now);
			const len = Math.hypot(o.view.x - p.view.x, o.view.y - p.view.y) || 1;
			const msg: ServerMessage = {
				t: 'pvpHit',
				from: p.view.id,
				to: o.view.id,
				skill: skill.id,
				dmg,
				...(d.crit ? { crit: true as const } : {}),
				kx: Math.round(((o.view.x - p.view.x) / len) * 1000) / 1000,
				ky: Math.round(((o.view.y - p.view.y) / len) * 1000) / 1000,
			};
			for (const w of this.inMap(map)) this.sendTo(w.view.id, msg);
		}
	}

	/** `p` báo gục vì `by`: chỉ nhận khi `by` vừa đánh trúng `p` (`PVP_KILL_WINDOW_MS`) — thông báo cả map. */
	down(p: PvpPlayer, by: unknown): void {
		const id = typeof by === 'string' ? by : '';
		const at = p.pvp.hitBy.get(id);
		if (at === undefined || this.now() - at > PVP_KILL_WINDOW_MS) return;
		p.pvp.hitBy.clear();
		const killer = [...this.players()].find((o) => o.view.id === id);
		const msg: ServerMessage = { t: 'pvpKill', by: id, byName: killer?.view.name ?? '?', to: p.view.id, toName: p.view.name };
		for (const w of this.inMap(p.map)) this.sendTo(w.view.id, msg);
	}

	/** Vừa vào map / hồi sinh: miễn PvP một lúc. */
	shield(p: PvpPlayer): void {
		p.pvp.shieldUntil = this.now() + PVP_SPAWN_SHIELD_MS;
	}
}

/** Vùng bám người tung: dời tâm theo quãng người tung đã đi từ lúc bấm. */
function recenter(st: PvpStrike, dx: number, dy: number): PvpStrike {
	const a = st.area;
	if (a.kind === 'line') return { ...st, area: { ...a, ax: a.ax + dx, ay: a.ay + dy, bx: a.bx + dx, by: a.by + dy } };
	return { ...st, area: { ...a, x: a.x + dx, y: a.y + dy } };
}

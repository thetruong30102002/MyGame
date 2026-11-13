import type { ActionFx, ServerMessage } from '@havenlord/protocol';
import { pvpAllowedOn, pvpBuild, pvpDamage, pvpInStrike, pvpStrikes, PVP_KILL_WINDOW_MS, PVP_SPAWN_SHIELD_MS, type PvpBuild, type PvpStrike } from '@havenlord/sim/pvp';
import {
	newPkRecord,
	pkBounty,
	pkCanHit,
	pkDeathLoss,
	pkDecay,
	pkInnocent,
	pkOnInnocentKill,
	pkTitle,
	PK_ATONE_COINS,
	PK_OFF_COOLDOWN_MS,
	type PkRecord,
} from '@havenlord/sim/pk';
import { HERO_SKILLS, type SkillDef } from '@havenlord/sim/skills';

const SKILLS: ReadonlyMap<string, SkillDef> = new Map(HERO_SKILLS.map((s) => [s.id, s]));

/** Phần PvP của một kết nối: sức đánh (suy từ tiến độ đã lưu), miễn PvP sau khi vào map, ai vừa đánh trúng mình. */
export interface PvpState {
	story: unknown;
	bonus: number;
	/** Thiên phú nguyên tố máy chủ đã bốc (nhiệm vụ "Tám ngọn đèn"); null = chưa có. */
	element: string | null;
	/** Lớp theo class lúc tạo nhân vật: trượng = Pháp sư, còn lại Kiếm sĩ. */
	path: 'sword' | 'mage';
	shieldUntil: number;
	/** Ai vừa đánh trúng mình, lúc nào (đánh trả + xét kẻ hạ). */
	hitBy: Map<string, number>;
	/** Đồ sát đang bật (mỗi lần vào game mặc định tắt). */
	on: boolean;
	/** Lần cuối đánh trúng người (chặn tắt đồ sát ngay sau khi đánh). */
	lastAttack: number;
	/** Tiếng xấu / truy nã (bảng `pk_states`). */
	pk: PkRecord;
}

/** Thứ `Pvp` cần biết về một người chơi đang online. */
export interface PvpPlayer {
	view: { id: string; name: string; level: number; x: number; y: number; sprite: string; hp?: number; hpMax?: number };
	map: string;
	/** Khu của map (`@havenlord/sim/channels`) — chỉ người cùng khu đánh được nhau. Vắng = khu 1. */
	channel?: number;
	pvp: PvpState;
}

export const newPvpState = (story: unknown, bonus: number, now: number, element: string | null = null, classId?: string, pk?: PkRecord): PvpState => ({
	story,
	bonus,
	element,
	path: classId === 'staff' ? 'mage' : 'sword',
	shieldUntil: now + PVP_SPAWN_SHIELD_MS,
	hitBy: new Map(),
	on: false,
	lastAttack: 0,
	// Chỉ tính thời gian online cho việc tự giảm điểm ác: vào game thì mốc bắt đầu lại từ bây giờ.
	pk: { ...(pk ?? newPkRecord(now)), decayAt: now },
});

/** Phần đồ sát gắn vào `PlayerView` (người khác thấy tên đỏ + danh hiệu); vắng = người thường. */
export function pkView(s: PvpState, now: number): { on?: true; infamy?: number; wanted?: true; title?: string } | undefined {
	const wanted = s.pk.wantedUntil > now;
	const title = pkTitle(s.pk.infamy, wanted);
	if (!s.on && !wanted && s.pk.infamy <= 0) return undefined;
	return { ...(s.on ? { on: true as const } : {}), ...(s.pk.infamy > 0 ? { infamy: s.pk.infamy } : {}), ...(wanted ? { wanted: true as const } : {}), ...(title ? { title } : {}) };
}

/** Máy chủ làm thay cho `Pvp` những việc ngoài trận: lưu tiếng xấu, trả thưởng truy nã, phạt khi gục, báo cả thế giới. */
export interface PkHooks {
	save(id: string, r: PkRecord): void;
	bounty(id: string, coins: number, what: string): void;
	/** Mất phần `frac` xu + EXP trong cấp (tiếng xấu càng cao càng mất nhiều). */
	penalty(id: string, frac: number): void;
	announce(text: string): void;
	/** Trạng thái đồ sát của người này vừa đổi (phát lại view cho người cùng map). */
	changed(id: string): void;
	/** Trừ xu (chuộc tội); false = không đủ. */
	pay(id: string, coins: number): boolean;
	/** Đứng gần NPC chuộc tội không. */
	nearAtoner(id: string): boolean;
}

const buildOf = (p: PvpPlayer): PvpBuild => pvpBuild(p.view.level, p.pvp.story, p.pvp.bonus, { element: p.pvp.element, path: p.pvp.path });

/**
 * Người đánh người trên máy chủ (`@havenlord/sim/pvp`): mỗi chiêu hợp lệ ở map cho phép PvP → hẹn các lần xét trúng theo hình học
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
		private readonly hooks?: PkHooks,
	) {}

	private wanted(p: PvpPlayer, now = this.now()): boolean {
		return p.pvp.pk.wantedUntil > now;
	}

	/** Tin `pk` của chính người chơi: bật / tắt đồ sát, chuộc tội, xin trạng thái. Từ chối thì báo lý do bằng `system`. */
	handle(p: PvpPlayer, raw: { op?: unknown; points?: unknown }): void {
		const now = this.now();
		const op = String(raw.op ?? '');
		if (op === 'on') p.pvp.on = true;
		else if (op === 'off') {
			if (this.wanted(p, now)) return this.say(p, 'Đang bị truy nã — không tắt được đồ sát');
			const wait = Math.ceil((p.pvp.lastAttack + PK_OFF_COOLDOWN_MS - now) / 1000);
			if (wait > 0) return this.say(p, `Vừa đánh người — chờ ${wait} giây nữa mới tắt được đồ sát`);
			p.pvp.on = false;
		} else if (op === 'atone') {
			p.pvp.pk = pkDecay(p.pvp.pk, now);
			const points = Math.min(p.pvp.pk.infamy, Math.max(1, Math.floor(Number(raw.points) || p.pvp.pk.infamy)));
			if (points <= 0) return this.say(p, 'Bạn không có tiếng xấu nào cần chuộc');
			if (this.wanted(p, now)) return this.say(p, 'Kẻ đang bị truy nã không được chuộc tội');
			if (!this.hooks?.nearAtoner(p.view.id)) return this.say(p, 'Hãy tới gặp Lena ở nhà thờ để chuộc tội');
			if (!this.hooks.pay(p.view.id, points * PK_ATONE_COINS)) return this.say(p, `Cần ${points * PK_ATONE_COINS} xu để chuộc ${points} điểm ác`);
			p.pvp.pk = { ...p.pvp.pk, infamy: p.pvp.pk.infamy - points };
			this.hooks.save(p.view.id, p.pvp.pk);
			this.say(p, `Đã chuộc ${points} điểm ác`);
		} else if (op !== 'get') return;
		this.sync(p);
	}

	/** Tự giảm điểm ác theo thời gian online (gọi định kỳ + lúc thoát). */
	tick(p: PvpPlayer): void {
		const before = p.pvp.pk;
		const after = pkDecay(before, this.now());
		if (after === before) return;
		p.pvp.pk = after;
		this.hooks?.save(p.view.id, after);
		if (after.infamy !== before.infamy) this.sync(p);
	}

	/** Gửi trạng thái đồ sát cho chính người chơi + báo máy chủ phát lại view cho người cùng map. */
	sync(p: PvpPlayer): void {
		const now = this.now();
		this.sendTo(p.view.id, { t: 'pk', on: p.pvp.on, infamy: p.pvp.pk.infamy, wantedUntil: p.pvp.pk.wantedUntil > now ? p.pvp.pk.wantedUntil : 0 });
		this.hooks?.changed(p.view.id);
	}

	private say(p: PvpPlayer, text: string): void {
		this.sendTo(p.view.id, { t: 'system', text });
	}

	private inMap(map: string, channel = 1): PvpPlayer[] {
		return [...this.players()].filter((p) => p.map === map && (p.channel ?? 1) === channel && p.view.sprite);
	}

	private alive(p: PvpPlayer): boolean {
		return p.view.hp === undefined || p.view.hp > 0;
	}

	/** Người chơi `p` vừa tung chiêu `skillId` (đã kiểm) với phần chiêu `fx` (đã chuẩn hoá + kẹp điểm nhắm). */
	cast(p: PvpPlayer, skillId: string, fx: ActionFx): void {
		const skill = SKILLS.get(skillId);
		if (!skill || !pvpAllowedOn(p.map) || !this.alive(p)) return;
		const map = p.map;
		const channel = p.channel ?? 1;
		const x0 = p.view.x;
		const y0 = p.view.y;
		for (const st of pvpStrikes(skill.id, x0, y0, fx.ax, fx.ay, fx.tx, fx.ty)) {
			this.schedule(st.delay * 1000, () => this.strike(p, map, channel, skill, st, x0, y0));
		}
	}

	private strike(p: PvpPlayer, map: string, channel: number, skill: SkillDef, st: PvpStrike, x0: number, y0: number): void {
		// Người đánh đã rời map / gục / thoát: đòn thôi.
		if (p.map !== map || (p.channel ?? 1) !== channel || !this.alive(p) || ![...this.players()].includes(p)) return;
		const now = this.now();
		const strike = st.follow ? recenter(st, p.view.x - x0, p.view.y - y0) : st;
		// Đồ sát: bật thì đánh được mọi người; không bật chỉ đánh trả kẻ vừa đánh mình; kẻ truy nã ai cũng đánh được.
		const me = { on: p.pvp.on, wanted: this.wanted(p, now) };
		let targets = this.inMap(map, channel).filter(
			(o) =>
				o !== p &&
				this.alive(o) &&
				o.pvp.shieldUntil <= now &&
				pkCanHit(me, { on: o.pvp.on, wanted: this.wanted(o, now) }, p.pvp.hitBy.get(o.view.id), now) &&
				pvpInStrike(strike, o.view.x, o.view.y),
		);
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
			p.pvp.lastAttack = now;
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
			for (const w of this.inMap(map, channel)) this.sendTo(w.view.id, msg);
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
		for (const w of this.inMap(p.map, p.channel ?? 1)) this.sendTo(w.view.id, msg);
		this.judge(killer, p);
	}

	/** Sau một lần hạ người: kẻ truy nã gục → thưởng; hạ người vô tội → điểm ác / truy nã; người gục mất xu / EXP theo tiếng xấu. */
	private judge(killer: PvpPlayer | undefined, victim: PvpPlayer): void {
		const now = this.now();
		if (killer) {
			if (this.wanted(victim, now)) {
				const coins = pkBounty(victim.view.level);
				this.hooks?.bounty(killer.view.id, coins, `Truy nã ${victim.view.name}`);
				this.hooks?.announce(`⚔ ${killer.view.name} đã hạ kẻ bị truy nã ${victim.view.name} — nhận ${coins} xu tiền thưởng!`);
				victim.pvp.pk = { ...victim.pvp.pk, wantedUntil: 0 };
			} else if (pkInnocent({ on: victim.pvp.on, wanted: false }, killer.pvp.hitBy.get(victim.view.id), now)) {
				const r = pkOnInnocentKill(pkDecay(killer.pvp.pk, now), now);
				killer.pvp.pk = r.r;
				this.hooks?.save(killer.view.id, r.r);
				if (r.nowWanted) this.hooks?.announce(`⚔ Truy nã: ${killer.view.name} đã hạ nhiều người vô tội! Ai hạ được sẽ nhận ${pkBounty(killer.view.level)} xu.`);
				this.sync(killer);
			}
		}
		const loss = pkDeathLoss(victim.pvp.pk.infamy);
		if (loss > 0) this.hooks?.penalty(victim.view.id, loss);
		this.hooks?.save(victim.view.id, victim.pvp.pk);
		this.sync(victim);
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

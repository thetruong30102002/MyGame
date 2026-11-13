import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DatabaseSync } from 'node:sqlite';
import type { ServerMessage } from '@havenlord/protocol';
import { randomInt } from 'node:crypto';
import { expForLevel } from '@havenlord/sim/skills';
import { TALENT_ELEMENT_NAME, TALENT_ELEMENTS } from '@havenlord/sim/talents';
import { PK_REFUSE_AT } from '@havenlord/sim/pk';
import { STORY } from '@havenlord/sim/story/story';
import {
	newQ2State,
	objectiveHit,
	objectiveTotal,
	pickDaily,
	q2Available,
	q2DateKey,
	q2Quest,
	Q2_DAILY,
	Q2_DAILY_BONUS,
	Q2_DAILY_REWARD,
	Q2_WORLD_BOSS,
	type Q2Def,
	type Q2Event,
	type Q2State,
} from '@havenlord/sim/quests2';
import { spotOf } from './maps.ts';

/** Phần thế giới mà sổ nhiệm vụ cần. */
export interface Quests2Host {
	where(id: string): { map: string; x: number; y: number } | null;
	send(id: string, msg: ServerMessage): void;
	level(id: string): number;
	account(id: string): number | null;
	farmOpen(account: number): boolean;
	unlockFarm(id: string, account: number): void;
	reward(id: string, exp: number, coins: number, ref: string, title: string): void;
	/** Điểm ác (đồ sát): từ `PK_REFUSE_AT` người giao việc không tiếp. */
	infamy?(id: string): number;
	/** Vừa bốc thiên phú nguyên tố (PvP tính lại nhánh mở). */
	element?(id: string, element: string): void;
}

/** Bảng trạng thái nhiệm vụ mới theo nhân vật (migration riêng, không đụng `progress.story` cũ — chưa chuyển save). */
export class Quest2Store {
	constructor(private readonly db: DatabaseSync) {
		db.exec('CREATE TABLE IF NOT EXISTS quest2_states(character_id TEXT PRIMARY KEY REFERENCES characters(id) ON DELETE CASCADE, state TEXT NOT NULL, updated_at INTEGER NOT NULL);');
	}
	read(character: string): Q2State {
		const row = this.db.prepare('SELECT state FROM quest2_states WHERE character_id=?').get(character) as { state: string } | undefined;
		return row ? (JSON.parse(row.state) as Q2State) : newQ2State();
	}
	/** Nhân vật đã mở hệ nhiệm vụ mới (client gửi `get` lần đầu) — chưa mở thì không đếm sự kiện / không trao thưởng ngầm. */
	has(character: string): boolean {
		return !!this.db.prepare('SELECT 1 FROM quest2_states WHERE character_id=?').get(character);
	}
	write(character: string, s: Q2State, now: number): void {
		this.db.prepare('INSERT INTO quest2_states(character_id,state,updated_at) VALUES(?,?,?) ON CONFLICT(character_id) DO UPDATE SET state=excluded.state,updated_at=excluded.updated_at').run(character, JSON.stringify(s), now);
	}
}

interface WorldSession { id: string; map: string; boss: string; channel: number; endAt: number }

/**
 * Hệ nhiệm vụ mới trên máy chủ (`@havenlord/sim/quests2`, 13/11/2026). Client chỉ BÁO "tôi nói chuyện với X / tôi đứng ở chỗ Y" —
 * máy chủ kiểm khoảng cách theo vị trí nó giữ; hạ quái và việc Gia viên đến từ sự kiện máy chủ đã chứng thực. Thưởng qua `reward` với
 * `ref` duy nhất (`q2:<id>`, `q2d:<ngày>:<ô>`, `q2w:<phiên>`) nên không nhận hai lần.
 */
export class Quests2 {
	private readonly world: WorldSession[] = [];
	private readonly mapIndex = new Map<string, string[]>();

	constructor(
		private readonly store: Quest2Store,
		private readonly host: Quests2Host,
		private readonly mapsDir: string,
		private readonly now: () => number = Date.now,
		/** Bốc thiên phú: số nguyên 0…n−1 (test truyền hàm cố định). */
		private readonly pick: (n: number) => number = (n) => randomInt(n),
	) {}

	handle(id: string, raw: { op?: unknown; npc?: unknown; spot?: unknown; id?: unknown }): void {
		const op = String(raw.op ?? '');
		try {
			if (op === 'get') return this.send(id);
			if (op === 'track') {
				const qid = String(raw.id ?? '');
				return this.mutate(id, (s) => void (s.tracked = s.active[qid] || s.daily?.slots.some((d) => d.tpl === qid) ? qid : null));
			}
			if (op === 'talk') {
				const npc = String(raw.npc ?? '');
				const at = this.host.where(id);
				const place = this.npcPlace(npc);
				if (!at || !place || at.map !== place.map || Math.hypot(at.x - place.x, at.y - place.y) > 170) throw new Error('Hãy tới gần người muốn trò chuyện');
				if ((this.host.infamy?.(id) ?? 0) >= PK_REFUSE_AT) throw new Error('Người này không muốn dính dáng tới kẻ mang tiếng xấu — hãy chuộc tội ở chỗ Lena trước');
				return this.event(id, { kind: 'talk', npc }, npc);
			}
			if (op === 'reach') {
				const spot = String(raw.spot ?? '');
				const at = this.host.where(id);
				const p = at ? spotOf(this.mapsDir, at.map, spot) : null;
				if (!at || !p || Math.hypot(at.x - p.x, at.y - p.y) > 170) return;
				return this.event(id, { kind: 'reach', spot });
			}
		} catch (e) {
			this.host.send(id, { t: 'system', text: e instanceof Error ? e.message : 'Không thực hiện được' });
		}
	}

	/** Hạ quái (dùng chung hoặc riêng) đã được máy chủ tính công. */
	kill(id: string, monster: string, map: string | null): void {
		this.event(id, { kind: 'kill', monster, ...(map ? { region: map.split('/')[0] } : {}) });
	}

	/** Việc Gia viên đã commit (thu hoạch / câu được cá / nấu xong / cho ăn). */
	life(id: string, kind: 'harvest' | 'fish' | 'cook' | 'feed'): void {
		this.event(id, { kind });
	}

	/** Boss vùng xuất hiện ở một khu → mở phiên Thế giới 30 phút. */
	bossAppeared(map: string, boss: string, channel: number): void {
		const t = this.now();
		for (let i = this.world.length - 1; i >= 0; i--) if (this.world[i]!.endAt < t || this.world[i]!.boss === boss) this.world.splice(i, 1);
		this.world.push({ id: `${boss}:${t}`, map, boss, channel, endAt: t + Q2_WORLD_BOSS.minutes * 60_000 });
	}

	/** Boss vùng gục: mọi người được tính công nhận thưởng phiên (mỗi người một lần mỗi phiên). */
	bossKilled(boss: string, credit: readonly string[]): void {
		const t = this.now();
		const w = this.world.find((x) => x.boss === boss && x.endAt >= t);
		if (!w) return;
		this.world.splice(this.world.indexOf(w), 1);
		for (const p of credit) {
			const lv = this.host.level(p);
			this.host.reward(p, Q2_WORLD_BOSS.reward.expFrac * expForLevel(lv), Q2_WORLD_BOSS.reward.coins, `q2w:${w.id}:${p}`, Q2_WORLD_BOSS.title);
		}
	}

	/** Phiên Thế giới đang mở (cho client hiện ở tab). */
	worldSessions(): { id: string; title: string; boss: string; map: string; channel: number; endAt: number }[] {
		const t = this.now();
		return this.world.filter((w) => w.endAt >= t).map((w) => ({ id: w.id, title: Q2_WORLD_BOSS.title, boss: w.boss, map: w.map, channel: w.channel, endAt: w.endAt }));
	}

	// ---------------- lõi ----------------

	private send(id: string): void {
		const s = this.prepare(id, this.store.read(id));
		this.store.write(id, s, this.now());
		this.host.send(id, { t: 'q2', state: s, world: this.worldSessions() } as ServerMessage);
	}

	private mutate(id: string, fn: (s: Q2State) => void): void {
		const s = this.prepare(id, this.store.read(id));
		fn(s);
		this.store.write(id, s, this.now());
		this.host.send(id, { t: 'q2', state: s, world: this.worldSessions() } as ServerMessage);
	}

	/** Nhận tự động việc Chính kế tiếp (+ việc thiên phú cấp 10), làm mới bộ việc ngày khi sang ngày (00:00 giờ Việt Nam). */
	private prepare(id: string, s: Q2State): Q2State {
		const lv = this.host.level(id);
		if (!Object.keys(s.active).some((q) => q2Quest(q)?.kind === 'main')) {
			const next = q2Available(s, lv).find((q) => q.kind === 'main');
			if (next) s.active[next.id] = { step: 0, count: 0 };
		}
		// Thiên phú cấp 10 ("Tám ngọn đèn") nhận ngay khi đủ cấp, không chờ việc Chính đang làm.
		for (const q of q2Available(s, lv)) if (q.reward.element) s.active[q.id] = { step: 0, count: 0 };
		const date = q2DateKey(this.now());
		if (s.daily?.date !== date) {
			const acc = this.host.account(id);
			const farm = acc !== null && this.host.farmOpen(acc);
			s.daily = { date, slots: pickDaily(id, date, lv, farm).map((tpl) => ({ tpl, count: 0, done: false })), bonus: false };
		}
		if (!s.tracked || (!s.active[s.tracked] && !s.daily.slots.some((d) => d.tpl === s.tracked && !d.done)))
			s.tracked = Object.keys(s.active).find((q) => q2Quest(q)?.kind === 'main') ?? Object.keys(s.active)[0] ?? null;
		return s;
	}

	/** Áp một sự kiện: nhận việc Phụ khi nói chuyện với người giao; tăng tiến độ MỘT bước mỗi việc; xong thì trao thưởng. */
	private event(id: string, ev: Q2Event, talkedTo?: string): void {
		if (!this.store.has(id)) return;
		const s = this.prepare(id, this.store.read(id));
		const lv = this.host.level(id);
		let changed = false;
		const finished: Q2Def[] = [];
		if (talkedTo)
			for (const q of q2Available(s, lv))
				if (q.kind === 'side' && q.giver === talkedTo) {
					s.active[q.id] = { step: 0, count: 0 };
					changed = true;
				}
		for (const [qid, p] of Object.entries(s.active)) {
			const q = q2Quest(qid);
			const step = q?.steps[p.step];
			if (!q || !step) continue;
			const hit = objectiveHit(step.objective, ev, p.met);
			if (!hit) continue;
			changed = true;
			if (step.objective.kind === 'talkAll' && ev.kind === 'talk') p.met = [...(p.met ?? []), ev.npc];
			p.count += hit;
			if (p.count < objectiveTotal(step.objective)) continue;
			p.step += 1;
			p.count = 0;
			delete p.met;
			if (step.done) this.host.send(id, { t: 'system', text: step.done });
			if (p.step >= q.steps.length) finished.push(q);
			else if (q.steps[p.step]!.start) this.host.send(id, { t: 'system', text: q.steps[p.step]!.start! });
		}
		for (const q of finished) {
			delete s.active[q.id];
			if (!s.done.includes(q.id)) s.done.push(q.id);
			this.host.reward(id, q.reward.expFrac * expForLevel(lv), q.reward.coins, `q2:${q.id}`, q.title);
			if (q.reward.unlockFarm) {
				const acc = this.host.account(id);
				if (acc !== null) this.host.unlockFarm(id, acc);
			}
			if (q.reward.element && !s.element) {
				s.element = TALENT_ELEMENTS[this.pick(TALENT_ELEMENTS.length)]!;
				this.host.send(id, { t: 'system', text: `Thiên phú thức tỉnh: hệ ${TALENT_ELEMENT_NAME[s.element]}` });
				this.host.element?.(id, s.element);
			}
			this.host.send(id, { t: 'system', text: `Hoàn thành nhiệm vụ: ${q.title}` });
		}
		if (s.daily)
			s.daily.slots.forEach((d, i) => {
				const t = Q2_DAILY.find((x) => x.id === d.tpl);
				if (!t || d.done || !objectiveHit(t.objective, ev, undefined)) return;
				changed = true;
				d.count += 1;
				if (d.count < objectiveTotal(t.objective)) return;
				d.done = true;
				const r = Q2_DAILY_REWARD[i] ?? Q2_DAILY_REWARD[0];
				this.host.reward(id, r.expFrac * expForLevel(lv), r.coins, `q2d:${s.daily!.date}:${i}:${id}`, t.title);
			});
		if (s.daily && !s.daily.bonus && s.daily.slots.length && s.daily.slots.every((d) => d.done)) {
			s.daily.bonus = true;
			this.host.reward(id, Q2_DAILY_BONUS.expFrac * expForLevel(lv), Q2_DAILY_BONUS.coins, `q2d:${s.daily.date}:all:${id}`, 'Đủ việc hằng ngày');
		}
		if (!changed) return;
		const after = this.prepare(id, s);
		this.store.write(id, after, this.now());
		this.host.send(id, { t: 'q2', state: after, world: this.worldSessions() } as ServerMessage);
	}

	/** Chỗ đứng NPC: tìm địa điểm `at.spot` trên mọi map của vùng NPC (chỉ mục `world.json`). */
	npcPlace(key: string): { map: string; x: number; y: number } | null {
		const n = STORY.npcs[key];
		if (!n) return null;
		const region = n.region ?? 'human';
		let maps = this.mapIndex.get(region);
		if (!maps) {
			try {
				maps = Object.keys((JSON.parse(readFileSync(join(this.mapsDir, region, 'world.json'), 'utf8')) as { maps: Record<string, unknown> }).maps);
			} catch {
				maps = [];
			}
			this.mapIndex.set(region, maps);
		}
		for (const m of maps) {
			const s = spotOf(this.mapsDir, `${region}/${m}`, n.at.spot);
			if (s) return { map: `${region}/${m}`, x: s.x + (n.at.dx ?? 0), y: s.y + (n.at.dy ?? 0) };
		}
		return null;
	}
}

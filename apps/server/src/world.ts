import type { WebSocket } from 'ws';
import { ACTION_ANIMS, CHAT_MAX, cleanGearView, DIRS8, MAX_LEVEL, SNAPSHOT_HZ, WORLD_CHAT_DIAMONDS, WORLD_CHAT_GAP_MS, type CharacterProgress, type ClientMessage, type PlayerView, type ServerMessage } from '@aether/protocol';
import { cleanCast, fxAllowed } from './actions.ts';
import { RateLimiter } from './auth.ts';
import type { Store } from './db.ts';
import { Social } from './social.ts';
import { MobRegistry, mapZonesFromDisk } from './mobs.ts';
import { Rewards } from './rewards.ts';
import { BUFF_TICK_MS, Shop } from './shop.ts';
import { Economy } from './economy.ts';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Tốc độ tối đa hợp lệ (px/giây): chạy 150 + lăn né; dư ra để bù trễ mạng. Vượt quá thì bỏ gói tin. */
const MAX_SPEED = 420;
const MAX_PROGRESS_BYTES = 64 * 1024;

interface Conn {
	ws: WebSocket;
	accountId: number;
	view: PlayerView;
	map: string;
	dirty: boolean;
	lastMoveAt: number;
	saves: RateLimiter;
	chat: RateLimiter;
	/** Kênh Thế giới: 1 tin / `WORLD_CHAT_GAP_MS` (chặt hơn chat map — cả server cùng đọc). */
	worldChat: RateLimiter;
	actions: RateLimiter;
	/** Mốc phát HÌNH gần nhất của từng chiêu (`actions.fxAllowed`). */
	fxLast: Map<string, number>;
	maps: RateLimiter;
	gears: RateLimiter;
	/** Mời / trả lời / huỷ bạn, chặn — bấm tay nên 20 lần / 10 giây là trần chống spam. */
	social: RateLimiter;
	whispers: RateLimiter;
	/** Đòn trúng quái: nhanh nhất ~ chục nhát/giây (Liên Hoàn, mưa nhiều điểm) — 40/giây là trần chống spam. */
	mobHits: RateLimiter;
	mobPos: RateLimiter;
	/** Động tác đánh của quái mình làm chủ + khống chế mình gây ra (M3.2b). */
	mobActs: RateLimiter;
	/** Báo hạ quái riêng / xong nhiệm vụ / tiêu xu / uống bình (M3.3a). */
	eco: RateLimiter;
}

/** Thư mục map của client — máy chủ đọc chung nguồn dữ liệu (`AETHER_MAPS` để đổi). */
const MAPS_DIR = process.env.AETHER_MAPS ?? join(dirname(fileURLToPath(import.meta.url)), '../../web/public/assets/maps');

/** Mã map `<vùng>/<map>` (chữ thường, số, gạch dưới) — chặn chuỗi lạ làm khoá nhóm người chơi. */
const MAP_ID = /^[a-z0-9_]{1,20}\/[a-z0-9_]{1,20}$/;

/**
 * Thế giới trực tuyến mức 1: biết ai đang ở đâu, phát lại vị trí cho người cùng bản đồ, chat, lưu tiến
 * độ. Chiến đấu vẫn tính ở máy người chơi — chuyển lên máy chủ ở mức 2 (quái dùng chung, rơi đồ).
 */
export class World {
	private readonly conns = new Map<string, Conn>();
	private readonly timer: NodeJS.Timeout;
	readonly social: Social;
	readonly mobs: MobRegistry;
	readonly rewards: Rewards;
	readonly shop: Shop;
	readonly economy: Economy;
	private readonly buffTimer: NodeJS.Timeout;

	constructor(
		private readonly store: Store,
		zonesOf = mapZonesFromDisk(MAPS_DIR),
		mapsDir = MAPS_DIR,
		private readonly now: () => number = Date.now,
	) {
		this.timer = setInterval(() => {
			this.broadcastSnapshots();
			this.mobs.tick();
		}, 1000 / SNAPSHOT_HZ);
		this.mobs = new MobRegistry(
			{
				position: (id) => {
					const c = this.conns.get(id);
					return c && c.view.x >= 0 ? { x: c.view.x, y: c.view.y } : null;
				},
				send: (id, msg) => {
					const c = this.conns.get(id);
					if (c) send(c.ws, msg);
				},
				credited: (id, type, stats) => {
					this.store.addKill(id, type);
					this.economy.sharedKill(id, type, stats);
				},
			},
			zonesOf,
		);
		this.economy = new Economy(
			store,
			{
				send: (id, msg) => {
					const c = this.conns.get(id);
					if (!c) return;
					send(c.ws, msg);
					// Lên cấp (máy chủ tính): người khác thấy cấp mới, bạn bè cập nhật trạng thái.
					if (msg.t === 'eco' && msg.level !== c.view.level) {
						c.view.level = msg.level;
						c.dirty = true;
						this.social.presenceChanged(id);
					}
				},
				map: (id) => this.conns.get(id)?.map ?? null,
			},
			mapsDir,
			now,
		);
		this.rewards = new Rewards(
			store,
			{
				gift: (id, coins, potions, ref) => this.economy.gift(id, coins, potions, ref),
				send: (id, msg) => {
					const c = this.conns.get(id);
					if (c) send(c.ws, msg);
				},
				// Chỉ tính chỗ đứng khi đã có gói vị trí ở map hiện tại (`sprite` đặt lại khi sang map).
				where: (id) => {
					const c = this.conns.get(id);
					return c && c.view.sprite ? { map: c.map, x: c.view.x, y: c.view.y } : null;
				},
			},
			mapsDir,
			now,
		);
		this.shop = new Shop(
			store,
			{
				send: (id, msg) => {
					const c = this.conns.get(id);
					if (c) send(c.ws, msg);
				},
				where: (id) => {
					const c = this.conns.get(id);
					return c && c.view.sprite ? { map: c.map, x: c.view.x, y: c.view.y } : null;
				},
			},
			mapsDir,
			now,
		);
		this.buffTimer = setInterval(() => this.shop.tick(), BUFF_TICK_MS);
		this.social = new Social(store, {
			presence: (id) => {
				const c = this.conns.get(id);
				return c ? { map: c.map, level: c.view.level } : null;
			},
			send: (id, msg) => {
				const c = this.conns.get(id);
				if (c) send(c.ws, msg);
			},
		});
	}

	get online(): number {
		return this.conns.size;
	}

	/** Nhân vật `id` đang online? (trang quản trị hiện trạng thái). */
	isOnline(id: string): boolean {
		return this.conns.has(id);
	}

	/** Gửi một tin cho nhân vật đang online (trang quản trị: ví kim cương mới). false = không online. */
	notify(id: string, msg: ServerMessage): boolean {
		const c = this.conns.get(id);
		if (!c) return false;
		send(c.ws, msg);
		return true;
	}

	stop(): void {
		clearInterval(this.timer);
		clearInterval(this.buffTimer);
	}

	/** Kết nối mới: chờ tin `hello` trong 5 giây, không có thì đóng. */
	accept(ws: WebSocket): void {
		let conn: Conn | null = null;
		const timeout = setTimeout(() => ws.close(4001, 'hello timeout'), 5000);
		ws.on('message', (raw) => {
			let msg: ClientMessage;
			try {
				msg = JSON.parse(String(raw)) as ClientMessage;
			} catch {
				return;
			}
			if (!conn) {
				if (msg.t !== 'hello') return;
				clearTimeout(timeout);
				conn = this.hello(ws, msg.token, msg.character);
				return;
			}
			this.handle(conn, msg);
		});
		ws.on('close', () => {
			clearTimeout(timeout);
			if (conn && this.conns.get(conn.view.id) === conn) this.leave(conn);
		});
	}

	private hello(ws: WebSocket, token: string, characterId: string): Conn | null {
		const s = this.store.sessionAccount(String(token));
		const ch = s ? this.store.character(String(characterId), s.accountId) : null;
		if (!s || !ch) {
			send(ws, { t: 'kicked', reason: 'Phiên đăng nhập không hợp lệ' });
			ws.close(4003, 'unauthorized');
			return null;
		}
		// Một nhân vật chỉ online ở một nơi: bản cũ bị đẩy ra.
		const old = this.conns.get(ch.id);
		if (old) {
			send(old.ws, { t: 'kicked', reason: 'Nhân vật vừa đăng nhập ở nơi khác' });
			this.leave(old);
			old.ws.close(4000, 'replaced');
		}
		const p = ch.progress;
		const conn: Conn = {
			ws,
			accountId: s.accountId,
			map: p.map || 'human/town',
			view: { id: ch.id, name: ch.name, gender: ch.gender, sprite: '', level: p.level, x: p.x, y: p.y, dir: 'S', anim: 'idle' },
			dirty: false,
			lastMoveAt: 0,
			saves: new RateLimiter(10, 10_000),
			chat: new RateLimiter(5, 5000),
			worldChat: new RateLimiter(1, WORLD_CHAT_GAP_MS),
			// Nhịp đánh nhanh nhất (Trảm 0.38s) ≈ 2.6 đòn/giây; 8/giây là trần chống spam.
			actions: new RateLimiter(8, 1000),
			fxLast: new Map(),
			// Chuyển map hợp lệ cách nhau ít nhất vài giây (màn tối + đi bộ); trần này chỉ chặn spam.
			maps: new RateLimiter(10, 10_000),
			// Đổi đồ là bấm tay trong kho đồ; 20 lần / 10 giây là trần chống spam (mỗi lần phát cho cả map).
			gears: new RateLimiter(20, 10_000),
			social: new RateLimiter(20, 10_000),
			whispers: new RateLimiter(5, 5000),
			mobHits: new RateLimiter(40, 1000),
			mobPos: new RateLimiter(25, 1000),
			mobActs: new RateLimiter(60, 1000),
			eco: new RateLimiter(40, 10_000, this.now),
		};
		this.conns.set(ch.id, conn);
		const others = this.inMap(conn.map).filter((c) => c !== conn && c.view.sprite);
		send(ws, { t: 'welcome', you: ch.id, players: others.map((c) => c.view) });
		// Sau `welcome`: client đã sẵn sàng nhận trạng thái bạn bè + tin nhắn riêng chờ giao.
		this.social.online(ch.id);
		this.economy.online(ch.id);
		this.rewards.online(ch.id);
		this.shop.online(ch.id);
		this.rewards.visit(ch.id, conn.map);
		console.log(`+ ${ch.name} (${this.conns.size} online)`);
		return conn;
	}

	private handle(c: Conn, msg: ClientMessage): void {
		switch (msg.t) {
			case 'move':
				return this.move(c, msg);
			case 'chat': {
				const text = String(msg.text ?? '').replace(/\s+/g, ' ').trim().slice(0, CHAT_MAX);
				if (!text) return;
				if (msg.ch === 'world') return this.worldChat(c, text);
				if (!c.chat.allow('chat')) return send(c.ws, { t: 'system', text: 'Bạn chat nhanh quá, chậm lại chút nhé' });
				const out: ServerMessage = { t: 'chat', from: c.view.id, name: c.view.name, text, at: Date.now() };
				for (const o of this.inMap(c.map)) send(o.ws, out);
				return;
			}
			case 'action':
				return this.action(c, msg);
			case 'actionEnd': {
				// Ngăn riêng trong cùng bộ đếm (khoá khác): tin dừng không ăn vào trần 8 động tác/giây.
				if (!c.view.sprite || !c.actions.allow('actionEnd')) return;
				// `hit` (đòn đã qua khung chạm): chỉ nhận đúng `true` — máy người xem vẽ nốt chiêu thay vì bỏ.
				const out: ServerMessage = { t: 'actionEnd', id: c.view.id, ...(msg.hit === true ? { hit: true as const } : {}) };
				for (const o of this.inMap(c.map)) if (o !== c) send(o.ws, out);
				return;
			}
			case 'save':
				return this.save(c, msg.progress);
			case 'gear':
				return this.gear(c, msg.gear);
			case 'map':
				return this.changeMap(c, msg.map);
			case 'ping':
				return send(c.ws, { t: 'pong', at: Number(msg.at) || 0 });
			case 'friendAdd':
			case 'friendRespond':
			case 'friendRemove':
			case 'block':
				if (!c.social.allow('social')) return send(c.ws, { t: 'system', text: 'Thao tác nhanh quá, chậm lại chút nhé' });
				return this.social.handle(c.view.id, msg);
			case 'whisper':
				if (!c.whispers.allow('whisper')) return send(c.ws, { t: 'system', text: 'Bạn nhắn nhanh quá, chậm lại chút nhé' });
				return this.social.handle(c.view.id, msg);
			case 'mobSub':
				if (!c.maps.allow('mobSub')) return;
				return msg.on ? this.mobs.subscribe(c.view.id, c.map) : this.mobs.unsubscribe(c.view.id);
			case 'mobPos':
				if (!c.mobPos.allow('mobPos')) return;
				return this.mobs.positions(c.view.id, msg.list);
			case 'mobHit':
				if (!c.mobHits.allow('mobHit')) return;
				return this.mobs.hit(c.view.id, String(msg.id ?? ''), msg.dmg);
			case 'mobAggro':
				if (!c.mobPos.allow('mobAggro')) return;
				return this.mobs.aggro(c.view.id, String(msg.id ?? ''));
			case 'checkin':
			case 'goals':
			case 'goalClaim':
			case 'hubs':
				if (!c.social.allow('rewards')) return send(c.ws, { t: 'system', text: 'Thao tác nhanh quá, chậm lại chút nhé' });
				return this.rewards.handle(c.view.id, msg);
			case 'kill':
			case 'quest':
			case 'spend':
			case 'potion':
				if (!c.eco.allow('eco')) return;
				if (msg.t === 'kill') return this.economy.privateKill(c.view.id, msg.type, msg.zone);
				if (msg.t === 'quest') return this.economy.quest(c.view.id, msg.id);
				if (msg.t === 'spend') return this.economy.spend(c.view.id, msg.reason, msg.amount);
				return this.economy.usePotion(c.view.id);
			case 'shopBuy':
				if (!c.social.allow('shop')) return send(c.ws, { t: 'system', text: 'Thao tác nhanh quá, chậm lại chút nhé' });
				return this.shop.buy(c.view.id, msg.item);
			case 'mobAct':
				if (!c.mobActs.allow('mobAct')) return;
				return this.mobs.act(c.view.id, String(msg.id ?? ''), msg.act);
			case 'mobCc':
				if (!c.mobActs.allow('mobCc')) return;
				return this.mobs.cc(c.view.id, String(msg.id ?? ''), msg.cc);
			default:
		}
	}

	/**
	 * Kênh Thế giới: mọi người đang online (cả người ở map khác) — cấp nào cũng chat được, 1 tin / 10 giây, mỗi tin trừ
	 * `WORLD_CHAT_DIAMONDS` kim cương (kiểm đủ tiền TRƯỚC khi tính lượt, trừ xong mới phát — thiếu tiền không mất lượt).
	 */
	private worldChat(c: Conn, text: string): void {
		const id = c.view.id;
		if (this.store.diamonds(id) < WORLD_CHAT_DIAMONDS) return send(c.ws, { t: 'system', text: `Chat kênh Thế giới tốn ${WORLD_CHAT_DIAMONDS} kim cương mỗi tin — bạn chưa đủ` });
		if (!c.worldChat.allow('world')) return send(c.ws, { t: 'system', text: `Kênh Thế giới: mỗi ${WORLD_CHAT_GAP_MS / 1000} giây một tin thôi nhé` });
		const balance = this.store.addDiamonds(id, -WORLD_CHAT_DIAMONDS, 'chat:world');
		if (balance === null) return send(c.ws, { t: 'system', text: `Chat kênh Thế giới tốn ${WORLD_CHAT_DIAMONDS} kim cương mỗi tin — bạn chưa đủ` });
		send(c.ws, { t: 'wallet', diamonds: balance });
		const out: ServerMessage = { t: 'chat', from: id, name: c.view.name, text, at: Date.now(), ch: 'world' };
		for (const o of this.conns.values()) send(o.ws, out);
	}

	private move(c: Conn, m: Extract<ClientMessage, { t: 'move' }>): void {
		const x = Number(m.x);
		const y = Number(m.y);
		if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0 || x > 20000 || y > 20000) return;
		const now = Date.now();
		const first = !c.view.sprite;
		// Gói đầu tiên (vừa vào map) đặt vị trí tự do; sau đó chặn dịch chuyển quá tốc độ.
		if (!first && c.view.x >= 0) {
			const dt = Math.max(0.05, (now - c.lastMoveAt) / 1000);
			if (Math.hypot(x - c.view.x, y - c.view.y) > MAX_SPEED * dt + 48) return;
		}
		c.lastMoveAt = now;
		Object.assign(c.view, { x: Math.round(x), y: Math.round(y), dir: String(m.dir).slice(0, 2), anim: String(m.anim).slice(0, 12), sprite: String(m.sprite).slice(0, 48) });
		if (first) {
			for (const o of this.inMap(c.map)) if (o !== c) send(o.ws, { t: 'join', player: c.view });
		} else c.dirty = true;
	}

	/**
	 * Phát lại động tác ra đòn + HÌNH của chiêu cho người cùng map (chỉ phần hình — chiến đấu vẫn tính ở máy người chơi). Mã chiêu
	 * phải có trong bộ chiêu thật, phần chiêu (`fx`) chuẩn hoá + kẹp điểm nhắm quanh vị trí máy chủ đang giữ (`actions.cleanCast`);
	 * sai thì bỏ phần chiêu im lặng, động tác thân vẫn đi. Không dội về người gửi.
	 * Chỗ móc PvP (M3 — chưa làm): sát thương người-đánh-người phải do MÁY CHỦ tính tại đây (chiêu + hướng + điểm nhắm đã kiểm,
	 * vị trí người trong map) — không bao giờ tin con số sát thương máy khách gửi.
	 */
	private action(c: Conn, m: Extract<ClientMessage, { t: 'action' }>): void {
		const anim = (ACTION_ANIMS as readonly string[]).includes(m.anim) ? m.anim : null;
		const dir = (DIRS8 as readonly string[]).includes(m.dir) ? m.dir : null;
		// Chưa vào map (chưa có gói vị trí đầu) thì người khác chưa thấy mình — bỏ qua im lặng.
		if (!anim || !dir || !c.view.sprite || !c.actions.allow('action')) return;
		c.view.dir = dir;
		c.dirty = true;
		const cast = cleanCast(m.skill, m.fx, c.view);
		const fx = cast.fx && fxAllowed(c.fxLast, cast.skill, Date.now()) ? cast.fx : undefined;
		const out: ServerMessage = { t: 'action', id: c.view.id, anim, dir, skill: cast.skill, ...(fx ? { fx } : {}) };
		for (const o of this.inMap(c.map)) if (o !== c) send(o.ws, out);
	}

	/**
	 * Người chơi sang map khác: người ở map cũ thấy mình rời đi, mình nhận danh sách người ở map mới. Vị trí đầu
	 * tiên ở map mới đặt tự do (không chặn theo tốc độ) và báo `join` cho người ở đó — y như lúc vừa vào game.
	 */
	private changeMap(c: Conn, raw: unknown): void {
		const map = String(raw ?? '');
		if (!MAP_ID.test(map) || map === c.map || !c.maps.allow('map')) return;
		// Quái dùng chung của map cũ: thôi nhận (client bật lại cho map mới nếu ở thế giới người lớn).
		this.mobs.unsubscribe(c.view.id);
		for (const o of this.inMap(c.map)) if (o !== c) send(o.ws, { t: 'leave', id: c.view.id });
		c.map = map;
		c.view.sprite = '';
		c.dirty = false;
		const others = this.inMap(map).filter((o) => o !== c && o.view.sprite);
		send(c.ws, { t: 'welcome', you: c.view.id, players: others.map((o) => o.view) });
		this.rewards.visit(c.view.id, map);
		this.social.presenceChanged(c.view.id);
	}

	/**
	 * Đồ gắn đang mặc: chỉ phần HÌNH (chỉ số vẫn tính ở máy người chơi). Kiểm dạng bằng `cleanGearView` (đúng số ô, id
	 * ngắn dạng chữ thường/số/gạch dưới, bậc hiếm 0–4); sai dạng thì bỏ cả gói. Lưu vào `view` → người vào sau nhận qua
	 * `welcome` / `join`; người đang cùng map nhận tin `gear` ngay. Client bản cũ không gửi tin này → `view.gear` vắng.
	 */
	private gear(c: Conn, raw: unknown): void {
		const gear = cleanGearView(raw);
		if (!gear || !c.gears.allow('gear')) return;
		if (c.view.gear && c.view.gear.join('|') === gear.join('|')) return;
		c.view.gear = gear;
		// Chưa vào map (chưa có gói vị trí đầu) thì người khác sẽ nhận đồ kèm tin `join`.
		if (!c.view.sprite) return;
		const out: ServerMessage = { t: 'gear', id: c.view.id, gear };
		for (const o of this.inMap(c.map)) if (o !== c) send(o.ws, out);
	}

	/** Tiến độ client gửi: vị trí, map, truyện… — cấp / EXP / xu / bình KHÔNG lấy từ đây (máy chủ giữ — `Economy`, `Store.saveProgress`). */
	private save(c: Conn, p: CharacterProgress): void {
		if (!c.saves.allow('save')) return;
		const clean = cleanProgress(p);
		if (!clean) return;
		this.store.saveProgress(c.view.id, clean);
	}

	private leave(c: Conn): void {
		this.conns.delete(c.view.id);
		this.shop.offline(c.view.id);
		this.economy.offline(c.view.id);
		this.mobs.unsubscribe(c.view.id);
		for (const o of this.inMap(c.map)) send(o.ws, { t: 'leave', id: c.view.id });
		this.social.presenceChanged(c.view.id);
		console.log(`- ${c.view.name} (${this.conns.size} online)`);
	}

	private inMap(map: string): Conn[] {
		return [...this.conns.values()].filter((c) => c.map === map);
	}

	private broadcastSnapshots(): void {
		const byMap = new Map<string, Conn[]>();
		for (const c of this.conns.values()) {
			const list = byMap.get(c.map);
			if (list) list.push(c);
			else byMap.set(c.map, [c]);
		}
		for (const list of byMap.values()) {
			const changed = list.filter((c) => c.dirty);
			if (!changed.length) continue;
			const players = changed.map(({ view: v }) => ({ id: v.id, x: v.x, y: v.y, dir: v.dir, anim: v.anim, sprite: v.sprite, level: v.level }));
			for (const c of changed) c.dirty = false;
			for (const c of list) {
				const others = players.filter((p) => p.id !== c.view.id);
				if (others.length) send(c.ws, { t: 'snapshot', players: others });
			}
		}
	}
}

function send(ws: WebSocket, msg: ServerMessage): void {
	if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
}

/** Kiểm + chuẩn hoá tiến độ client gửi lên; null = sai dạng hoặc quá lớn. */
export function cleanProgress(p: CharacterProgress | undefined): CharacterProgress | null {
	if (!p || typeof p !== 'object') return null;
	const clean: CharacterProgress = {
		level: clampInt(p.level, 1, MAX_LEVEL),
		exp: clampInt(p.exp, 0, 1e9),
		coins: clampInt(p.coins, 0, 1e9),
		potions: clampInt(p.potions, 0, 999),
		map: typeof p.map === 'string' ? p.map.slice(0, 40) : 'human/town',
		x: Math.round(Number(p.x) || -1),
		y: Math.round(Number(p.y) || -1),
		story: p.story ?? null,
		introSeen: !!p.introSeen,
	};
	return JSON.stringify(clean).length > MAX_PROGRESS_BYTES ? null : clean;
}

function clampInt(v: unknown, min: number, max: number): number {
	const n = Math.floor(Number(v));
	return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : min;
}

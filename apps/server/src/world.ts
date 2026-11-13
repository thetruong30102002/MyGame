import type { WebSocket } from 'ws';
import { ACTION_ANIMS, CHAT_MAX, cleanGearView, DIRS8, MAX_LEVEL, SNAPSHOT_HZ, WORLD_CHAT_DIAMONDS, WORLD_CHAT_GAP_MS, type CharacterProgress, type ClientMessage, type PlayerView, type ServerMessage } from '@havenlord/protocol';
import { cleanCast, fxAllowed } from './actions.ts';
import { RateLimiter } from './auth.ts';
import type { Store } from './db.ts';
import { Social } from './social.ts';
import { MobRegistry, mapZonesFromDisk } from './mobs.ts';
import { Rewards } from './rewards.ts';
import { BUFF_TICK_MS, Shop } from './shop.ts';
import { Economy } from './economy.ts';
import { Farm } from './farm.ts';
import { Quests2 } from './quests2.ts';
import { newPvpState, pkView, Pvp, type PvpState } from './pvp.ts';
import { PK_ATONE_NPC } from '@havenlord/sim/pk';
import { resetDiamonds } from '@havenlord/sim/talents';
import { REGIONS } from '@havenlord/sim/regions';
import { mapName } from './maps.ts';
import { CHANNEL_COUNT, CHANNEL_HARD_CAP, channelled, instanceKey, pickChannel } from '@havenlord/sim/channels';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Tốc độ tối đa hợp lệ (px/giây): chạy 150 + lăn né; dư ra để bù trễ mạng. Vượt quá thì bỏ gói tin. */
const MAX_SPEED = 420;
const MAX_PROGRESS_BYTES = 64 * 1024;

interface Conn {
	ws: WebSocket;
	accountId: number;
	modelId: string;
	view: PlayerView;
	map: string;
	/** Khu của map (`@havenlord/sim/channels`): chỉ người cùng map + cùng khu thấy nhau, đánh chung quái. */
	channel: number;
	/** Vừa đổi khu: lần báo `map` kế tiếp (client tải lại map) được nhận dù trùng map. */
	rejoin?: boolean;
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
	/** Người đánh người: sức đánh suy từ tiến độ, miễn PvP sau khi vào map, ai vừa đánh trúng mình (`pvp.ts`). */
	pvp: PvpState;
}

/** Thư mục map của client — máy chủ đọc chung nguồn dữ liệu (`HAVENLORD_MAPS` để đổi). */
const MAPS_DIR = process.env.HAVENLORD_MAPS ?? join(dirname(fileURLToPath(import.meta.url)), '../../../assets/maps');

/** Mã map `<vùng>/<map>` (chữ thường, số, gạch dưới) — chặn chuỗi lạ làm khoá nhóm người chơi. */
const MAP_ID = /^[a-z0-9_]{1,20}\/[a-z0-9_]{1,20}$/;

/**
 * Thế giới trực tuyến mức 1: biết ai đang ở đâu, phát lại vị trí cho người cùng bản đồ, chat, lưu tiến
 * độ. Chiến đấu vẫn tính ở máy người chơi — chuyển lên máy chủ ở mức 2 (quái dùng chung, rơi đồ).
 */
/**
 * Hình phát cho người khác: mẫu đã chọn hoặc bản tháo áo / bộ 2 CỦA CHÍNH mẫu đó. Không cho mượn hình mẫu khác.
 */
export function bareOrModel(modelId: string, sent: unknown): string {
	return sent === `${modelId}_bare` || sent === `${modelId}_outfit_2` ? String(sent) : modelId;
}

export class World {
	private readonly conns = new Map<string, Conn>();
	private readonly timer: NodeJS.Timeout;
	readonly social: Social;
	readonly mobs: MobRegistry;
	readonly rewards: Rewards;
	readonly shop: Shop;
	readonly economy: Economy;
	readonly farm: Farm;
	readonly quests2: Quests2;
	readonly pvp: Pvp;
	private pkTicks = 0;
	private readonly buffTimer: NodeJS.Timeout;

	constructor(
		private readonly store: Store,
		zonesOf = mapZonesFromDisk(MAPS_DIR),
		mapsDir = MAPS_DIR,
		private readonly now: () => number = Date.now,
	) {
		this.pvp = new Pvp(
			() => this.conns.values(),
			(id, msg) => {
				const c = this.conns.get(id);
				if (c) send(c.ws, msg);
			},
			now,
			undefined,
			undefined,
			{
				save: (id, r) => store.pk.write(id, r),
				bounty: (id, coins, what) => this.economy.pkBounty(id, coins, what),
				penalty: (id, frac) => this.economy.pkPenalty(id, frac),
				announce: (text) => {
					for (const o of this.conns.values()) send(o.ws, { t: 'system', text });
				},
				changed: (id) => {
					const c = this.conns.get(id);
					if (!c) return;
					c.view.pk = pkView(c.pvp, this.now());
					c.dirty = true;
				},
				pay: (id, coins) => this.economy.pay(id, coins, 'Chuộc tội'),
				nearAtoner: (id) => {
					const c = this.conns.get(id);
					const at = this.quests2.npcPlace(PK_ATONE_NPC);
					return !!c && !!at && c.map === at.map && Math.hypot(c.view.x - at.x, c.view.y - at.y) <= 170;
				},
			},
		);
		this.timer = setInterval(() => {
			this.broadcastSnapshots();
			this.mobs.tick();
			// Mỗi phút: tiếng xấu tự giảm theo thời gian online (đồ sát — `@havenlord/sim/pk`).
			if (++this.pkTicks % (SNAPSHOT_HZ * 60) === 0) for (const c of this.conns.values()) this.pvp.tick(c);
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
					this.quests2.kill(id, type, this.conns.get(id)?.map ?? null);
				},
				bossKilled: (type, credit) => this.quests2.bossKilled(type, credit),
				// Boss vùng chỉ ở một khu: báo cả thế giới tên boss, map, số khu (chủ dự án 13/11/2026).
				bossAppeared: (map, type, channel) => {
					const name = REGIONS.find((r) => r.chief?.id === type)?.chief?.name ?? type;
					const text = `⚔ ${name} đã xuất hiện ở ${mapName(mapsDir, map) ?? map} · Khu ${channel}!`;
					for (const o of this.conns.values()) send(o.ws, { t: 'system', text });
					this.quests2.bossAppeared(map, type, channel);
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
				killed: (id, type) => this.quests2.kill(id, type, this.conns.get(id)?.map ?? null),
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
				outfitPurchased: (id, eco, name, price) => this.economy.shopApplied(id, eco, name, price),
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
		this.farm = new Farm(store, {
			life: (id, kind) => this.quests2.life(id, kind),
			infamy: (id) => this.conns.get(id)?.pvp.pk.infamy ?? 0,
			where: id => {const c=this.conns.get(id);return c?{map:c.map,x:c.view.x,y:c.view.y}:null;},
			send: (id,msg) => {const c=this.conns.get(id);if(c)send(c.ws,msg);},
			move: (id,map) => {const c=this.conns.get(id);if(c)this.changeMap(c,map,true);},
			count: map => this.inMap(map).length,
			refresh: id => {this.economy.online(id);const c=this.conns.get(id);if(c)send(c.ws,{t:'buffs',list:store.buffs(id)});},
		}, mapsDir, now);
		// Nhiệm vụ mới bốn loại (13/11/2026): máy chủ kiểm vị trí, đếm sự kiện thật, trao thưởng một lần.
		this.quests2 = new Quests2(store.quests2, {
			where: (id) => { const c = this.conns.get(id); return c ? { map: c.map, x: c.view.x, y: c.view.y } : null; },
			send: (id, msg) => { const c = this.conns.get(id); if (c) send(c.ws, msg); },
			level: (id) => this.economy.get(id)?.level ?? this.conns.get(id)?.view.level ?? 1,
			account: (id) => this.conns.get(id)?.accountId ?? null,
			farmOpen: (acc) => store.farm.read(acc).unlocked,
			unlockFarm: (id, acc) => this.farm.unlockByQuest(id, acc),
			reward: (id, exp, coins, ref, title) => this.economy.questReward(id, exp, coins, ref, title),
			element: (id, el) => { const c = this.conns.get(id); if (c) c.pvp.element = el; },
			infamy: (id) => this.conns.get(id)?.pvp.pk.infamy ?? 0,
		}, mapsDir, now);
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
			map: p.map?.startsWith('home/') ? 'human/town' : p.map || 'human/town',
			channel: 1,
			modelId: ch.modelId!,
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
			pvp: newPvpState(p.story, p.bonusPoints ?? 0, this.now(), this.store.quests2.read(ch.id).element ?? null, ch.classId, this.store.pk.read(ch.id)),
		};
		conn.channel = channelled(conn.map) ? pickChannel(this.counts(conn.map), 1) : 1;
		this.conns.set(ch.id, conn);
		this.pvp.sync(conn);
		const others = this.inRoom(conn).filter((c) => c !== conn && c.view.sprite);
		send(ws, { t: 'welcome', you: ch.id, players: others.map((c) => c.view) });
		this.sendChannel(conn);
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
			case 'q2':
				if (!c.social.allow('q2')) return;
				return this.quests2.handle(c.view.id, msg);
			case 'farm':
				if (!c.social.allow('farm')) return;
				return this.farm.handle(c.view.id,c.accountId,msg);
			case 'move':
				return this.move(c, msg);
			case 'chat': {
				const text = String(msg.text ?? '').replace(/\s+/g, ' ').trim().slice(0, CHAT_MAX);
				if (!text) return;
				if (msg.ch === 'world') return this.worldChat(c, text);
				if (!c.chat.allow('chat')) return send(c.ws, { t: 'system', text: 'Bạn chat nhanh quá, chậm lại chút nhé' });
				const out: ServerMessage = { t: 'chat', from: c.view.id, name: c.view.name, text, at: Date.now() };
				for (const o of this.inRoom(c)) send(o.ws, out);
				return;
			}
			case 'action':
				return this.action(c, msg);
			case 'actionEnd': {
				// Ngăn riêng trong cùng bộ đếm (khoá khác): tin dừng không ăn vào trần 8 động tác/giây.
				if (!c.view.sprite || !c.actions.allow('actionEnd')) return;
				// `hit` (đòn đã qua khung chạm): chỉ nhận đúng `true` — máy người xem vẽ nốt chiêu thay vì bỏ.
				const out: ServerMessage = { t: 'actionEnd', id: c.view.id, ...(msg.hit === true ? { hit: true as const } : {}) };
				for (const o of this.inRoom(c)) if (o !== c) send(o.ws, out);
				return;
			}
			case 'save':
				return this.save(c, msg.progress);
			case 'gear':
				return this.gear(c, msg.gear);
			case 'map':
				return this.changeMap(c, msg.map);
			case 'channel':
				return this.switchChannel(c, msg.channel);
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
				return msg.on ? this.mobs.subscribe(c.view.id, instanceKey(c.map, c.channel)) : this.mobs.unsubscribe(c.view.id);
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
			case 'spend':
			case 'potion':
				if (!c.eco.allow('eco')) return;
				if (msg.t === 'kill') return this.economy.privateKill(c.view.id, msg.type, msg.zone);
				if (msg.t === 'spend') return this.economy.spend(c.view.id, msg.reason, msg.amount);
				return this.economy.usePotion(c.view.id);
			case 'resetBuild': {
				if (!c.social.allow('shop')) return send(c.ws, { t: 'system', text: 'Thao tác nhanh quá, chậm lại chút nhé' });
				const cost = resetDiamonds(c.view.level);
				if (cost > 0) {
					const balance = this.store.addDiamonds(c.view.id, -cost, 'reset:build');
					if (balance === null) return send(c.ws, { t: 'system', text: `Tẩy điểm cần ${cost} kim cương — bạn chưa đủ` });
					send(c.ws, { t: 'wallet', diamonds: balance });
				}
				return send(c.ws, { t: 'bought', item: 'reset_build' });
			}
			case 'shopBuy':
				if (!c.social.allow('shop')) return send(c.ws, { t: 'system', text: 'Thao tác nhanh quá, chậm lại chút nhé' });
				return this.shop.buy(c.view.id, msg.item);
			case 'mobAct':
				if (!c.mobActs.allow('mobAct')) return;
				return this.mobs.act(c.view.id, String(msg.id ?? ''), msg.act);
			case 'mobCc':
				if (!c.mobActs.allow('mobCc')) return;
				return this.mobs.cc(c.view.id, String(msg.id ?? ''), msg.cc);
			case 'pvpDown':
				if (!c.eco.allow('pvpDown')) return;
				return this.pvp.down(c, msg.by);
			case 'pk':
				if (!c.social.allow('pk')) return send(c.ws, { t: 'system', text: 'Thao tác nhanh quá, chậm lại chút nhé' });
				return this.pvp.handle(c, msg);
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
		Object.assign(c.view, { x: Math.round(x), y: Math.round(y), dir: String(m.dir).slice(0, 2), anim: String(m.anim).slice(0, 12), sprite: bareOrModel(c.modelId, m.sprite) });
		// Máu máy người chơi báo (PvP: người khác vẽ thanh máu; máy chủ bỏ qua đòn của người đã gục). Số lạ thì giữ số cũ.
		const hpMax = Number(m.hpMax);
		const hp = Number(m.hp);
		if (Number.isFinite(hpMax) && hpMax > 0 && hpMax < 1e6 && Number.isFinite(hp)) {
			c.view.hpMax = Math.round(hpMax);
			c.view.hp = Math.max(0, Math.min(c.view.hpMax, Math.round(hp)));
		}
		if (first) {
			this.pvp.shield(c);
			for (const o of this.inRoom(c)) if (o !== c) send(o.ws, { t: 'join', player: c.view });
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
		for (const o of this.inRoom(c)) if (o !== c) send(o.ws, out);
		// PvP: máy chủ tính trúng từ chính chiêu + hướng + điểm nhắm đã kiểm (cổng `fxAllowed` = nhịp hồi chiêu chống spam).
		if (fx) this.pvp.cast(c, cast.skill, fx);
	}

	/**
	 * Người chơi sang map khác: người ở map cũ thấy mình rời đi, mình nhận danh sách người ở map mới. Vị trí đầu
	 * tiên ở map mới đặt tự do (không chặn theo tốc độ) và báo `join` cho người ở đó — y như lúc vừa vào game.
	 */
	private changeMap(c: Conn, raw: unknown, trusted = false): void {
		const map = String(raw ?? '');
		if (!MAP_ID.test(map) || (map === c.map && !c.rejoin) || (!trusted && !c.maps.allow('map'))) return;
		if (map.startsWith('home/') && (!trusted || !this.farm.canEnterMap(c.view.id, c.accountId, map) || !this.farm.canEnter(c.accountId))) return;
		// Quái dùng chung của map cũ: thôi nhận (client bật lại cho map mới nếu ở thế giới người lớn).
		this.mobs.unsubscribe(c.view.id);
		if (!c.rejoin) for (const o of this.inRoom(c)) if (o !== c) send(o.ws, { t: 'leave', id: c.view.id });
		// Sang map mới: giữ số khu đang đứng nếu khu đó chưa đông, không thì khu vắng nhất. Vừa đổi khu (rejoin) thì giữ khu đã chọn.
		if (!c.rejoin) c.channel = channelled(map) ? pickChannel(this.counts(map, c), c.channel) : 1;
		c.rejoin = false;
		c.map = map;
		c.view.sprite = '';
		c.dirty = false;
		const others = this.inRoom(c).filter((o) => o !== c && o.view.sprite);
		send(c.ws, { t: 'welcome', you: c.view.id, players: others.map((o) => o.view) });
		this.sendChannel(c);
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
		for (const o of this.inRoom(c)) if (o !== c) send(o.ws, out);
	}

	/** Tiến độ client gửi: vị trí, map, truyện… — cấp / EXP / xu / bình KHÔNG lấy từ đây (máy chủ giữ — `Economy`, `Store.saveProgress`). */
	private save(c: Conn, p: CharacterProgress): void {
		if (!c.saves.allow('save')) return;
		const clean = cleanProgress(p);
		if (!clean) return;
		this.store.saveProgress(c.view.id, clean);
		c.pvp.story = clean.story;
	}

	private leave(c: Conn): void {
		this.pvp.tick(c);
		this.conns.delete(c.view.id);
		this.shop.offline(c.view.id);
		this.economy.offline(c.view.id);
		this.mobs.unsubscribe(c.view.id);
		for (const o of this.inRoom(c)) send(o.ws, { t: 'leave', id: c.view.id });
		this.social.presenceChanged(c.view.id);
		console.log(`- ${c.view.name} (${this.conns.size} online)`);
	}

	private inMap(map: string): Conn[] {
		return [...this.conns.values()].filter((c) => c.map === map);
	}

	/** Người cùng map + cùng khu với `c` (gồm cả `c`). */
	private inRoom(c: Conn): Conn[] {
		return [...this.conns.values()].filter((o) => o.map === c.map && o.channel === c.channel);
	}

	/** Số người từng khu của map (bỏ qua `except`). */
	private counts(map: string, except?: Conn): number[] {
		const out = Array.from({ length: CHANNEL_COUNT }, () => 0);
		for (const o of this.conns.values()) if (o !== except && o.map === map && o.channel >= 1 && o.channel <= CHANNEL_COUNT) out[o.channel - 1]! += 1;
		return out;
	}

	private sendChannel(c: Conn): void {
		send(c.ws, { t: 'channel', channel: c.channel, counts: channelled(c.map) ? this.counts(c.map) : [] });
	}

	/**
	 * Đổi khu (bấm biển "Khu N"): rời khu cũ (người cũ thấy mình đi, thôi nhận quái), đặt khu mới rồi báo client — client tải lại map
	 * và gửi lại `map` như lúc mới vào (nhận `welcome` + quái của khu mới). `channel` 0 = chỉ hỏi số người.
	 */
	private switchChannel(c: Conn, raw: unknown): void {
		const k = Math.floor(Number(raw));
		if (!k || k === c.channel || !channelled(c.map)) return this.sendChannel(c);
		if (k < 1 || k > CHANNEL_COUNT || !c.maps.allow('channel')) return;
		if ((this.counts(c.map, c)[k - 1] ?? 0) >= CHANNEL_HARD_CAP) return send(c.ws, { t: 'system', text: `Khu ${k} đã đầy, chọn khu khác nhé` });
		this.mobs.unsubscribe(c.view.id);
		for (const o of this.inRoom(c)) if (o !== c) send(o.ws, { t: 'leave', id: c.view.id });
		c.channel = k;
		c.rejoin = true;
		c.view.sprite = '';
		c.dirty = false;
		this.sendChannel(c);
		this.social.presenceChanged(c.view.id);
	}

	private broadcastSnapshots(): void {
		const byMap = new Map<string, Conn[]>();
		for (const c of this.conns.values()) {
			const key = instanceKey(c.map, c.channel);
			const list = byMap.get(key);
			if (list) list.push(c);
			else byMap.set(key, [c]);
		}
		for (const list of byMap.values()) {
			const changed = list.filter((c) => c.dirty);
			if (!changed.length) continue;
			// `pk` luôn gửi (rỗng = người thường) để máy nhận xoá được tên đỏ khi tắt đồ sát / hết truy nã.
			const players = changed.map(({ view: v }) => ({ id: v.id, x: v.x, y: v.y, dir: v.dir, anim: v.anim, sprite: v.sprite, level: v.level, ...(v.hpMax ? { hp: v.hp, hpMax: v.hpMax } : {}), pk: v.pk ?? {} }));
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

import type { CharacterInfo, CharacterProgress, ClientMessage, MobAct, MobCc, MobMove, MobView, PlayerView, ServerMessage, SocialState, WhisperMessage } from '@aether/protocol';
import { api, serverUrl } from './api';

export interface OnlineHandlers {
	welcome(players: PlayerView[]): void;
	join(p: PlayerView): void;
	leave(id: string): void;
	snapshot(players: Extract<ServerMessage, { t: 'snapshot' }>['players']): void;
	chat(m: { from: string; name: string; text: string; at: number }): void;
	action(m: Extract<ServerMessage, { t: 'action' }>): void;
	actionEnd(m: Extract<ServerMessage, { t: 'actionEnd' }>): void;
	/** Người khác đổi đồ gắn (máy chủ bản cũ không bao giờ gửi tin này). */
	gear(m: Extract<ServerMessage, { t: 'gear' }>): void;
	system(text: string): void;
	/** Bạn bè / lời mời / chặn — nguyên khối, mỗi lần có thay đổi (máy chủ bản cũ không gửi). */
	social(state: SocialState): void;
	/** Tin nhắn riêng (gồm cả bản mình vừa gửi, và các tin nhận lúc offline khi vừa vào game). */
	whisper(messages: WhisperMessage[]): void;
	/** Quái dùng chung (M3.2): danh sách đầy đủ, vị trí, máu, gục, sống lại, đổi chủ. */
	mobs(map: string, list: MobView[]): void;
	mobMove(list: MobMove[]): void;
	mobHp(m: Extract<ServerMessage, { t: 'mobHp' }>): void;
	mobDie(m: Extract<ServerMessage, { t: 'mobDie' }>): void;
	mobSpawn(mob: MobView): void;
	mobOwner(id: string, owner: string | null): void;
	mobAct(id: string, act: MobAct): void;
	mobCc(id: string, cc: MobCc): void;
	kicked(reason: string): void;
	status(online: boolean): void;
}

/** Lưu định kỳ qua WebSocket không dồn dày hơn mức này (máy chủ cho tối đa 10 lần / 10 giây). */
const SAVE_GAP = 2500;

/**
 * Một phiên chơi trực tuyến của MỘT nhân vật: giữ bản tiến độ sống, kết nối WebSocket (tự nối lại khi
 * rớt mạng), lưu tiến độ lên máy chủ. Game đăng ký `handlers` để vẽ người chơi khác và chat.
 */
export class OnlineSession {
	readonly progress: CharacterProgress;
	handlers: Partial<OnlineHandlers> = {};
	private ws: WebSocket | null = null;
	private closed = false;
	private retry = 0;
	private saveTimer: ReturnType<typeof setTimeout> | null = null;
	private lastSaveAt = 0;
	private readonly onUnload = () => this.flush();

	constructor(
		readonly token: string,
		readonly character: CharacterInfo,
	) {
		this.progress = structuredClone(character.progress);
		window.addEventListener('pagehide', this.onUnload);
	}

	connect(): void {
		if (this.closed || (this.ws && this.ws.readyState <= WebSocket.OPEN)) return;
		const ws = new WebSocket(`${serverUrl().replace(/^http/, 'ws')}/ws`);
		this.ws = ws;
		ws.onopen = () => {
			this.retry = 0;
			this.send({ t: 'hello', token: this.token, character: this.character.id });
		};
		ws.onmessage = (e) => {
			let m: ServerMessage;
			try {
				m = JSON.parse(String(e.data)) as ServerMessage;
			} catch {
				return;
			}
			const h = this.handlers;
			if (m.t === 'welcome') {
				h.status?.(true);
				h.welcome?.(m.players);
			} else if (m.t === 'join') h.join?.(m.player);
			else if (m.t === 'leave') h.leave?.(m.id);
			else if (m.t === 'snapshot') h.snapshot?.(m.players);
			else if (m.t === 'chat') h.chat?.(m);
			else if (m.t === 'action') h.action?.(m);
			else if (m.t === 'actionEnd') h.actionEnd?.(m);
			else if (m.t === 'gear') h.gear?.(m);
			else if (m.t === 'system') h.system?.(m.text);
			else if (m.t === 'social') h.social?.(m.state);
			else if (m.t === 'whisper') h.whisper?.(m.messages);
			else if (m.t === 'mobs') h.mobs?.(m.map, m.list);
			else if (m.t === 'mobMove') h.mobMove?.(m.list);
			else if (m.t === 'mobHp') h.mobHp?.(m);
			else if (m.t === 'mobDie') h.mobDie?.(m);
			else if (m.t === 'mobSpawn') h.mobSpawn?.(m.mob);
			else if (m.t === 'mobOwner') h.mobOwner?.(m.id, m.owner);
			else if (m.t === 'mobAct') h.mobAct?.(m.id, m.act);
			else if (m.t === 'mobCc') h.mobCc?.(m.id, m.cc);
			else if (m.t === 'kicked') {
				this.closed = true;
				h.kicked?.(m.reason);
			}
		};
		ws.onclose = () => {
			if (this.ws !== ws) return;
			this.handlers.status?.(false);
			if (this.closed) return;
			// Rớt mạng: nối lại lùi dần 1s → 2s → 4s … tối đa 15s.
			this.retry += 1;
			setTimeout(() => this.connect(), Math.min(15000, 1000 * 2 ** (this.retry - 1)));
		};
	}

	send(msg: ClientMessage): void {
		if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg));
	}

	chat(text: string): void {
		this.send({ t: 'chat', text });
	}

	/** Mời kết bạn theo id (bấm tên) hoặc theo tên gõ tay. */
	friendAdd(target: { id: string } | { name: string }): void {
		this.send({ t: 'friendAdd', ...target });
	}

	friendRespond(id: string, accept: boolean): void {
		this.send({ t: 'friendRespond', id, accept });
	}

	/** Huỷ bạn, hoặc rút lại lời mời đã gửi. */
	friendRemove(id: string): void {
		this.send({ t: 'friendRemove', id });
	}

	block(id: string, on: boolean): void {
		this.send({ t: 'block', id, on });
	}

	/** Nhắn riêng tới id, hoặc `line` = phần sau `/w ` (máy chủ tự tách tên có khoảng trắng). */
	whisper(target: { to: string; text: string } | { line: string }): void {
		this.send({ t: 'whisper', ...target });
	}

	/** Lưu "mềm": gộp nhiều lần gọi liền nhau thành một gói WebSocket. */
	save(): void {
		if (this.saveTimer) return;
		const wait = Math.max(0, SAVE_GAP - (Date.now() - this.lastSaveAt));
		this.saveTimer = setTimeout(() => {
			this.saveTimer = null;
			this.lastSaveAt = Date.now();
			this.send({ t: 'save', progress: this.progress });
		}, wait);
	}

	/** Lưu "chắc": qua HTTP, chờ máy chủ xác nhận (xoá tiến độ, rời game, đóng trang). */
	flush(): Promise<void> {
		if (this.saveTimer) clearTimeout(this.saveTimer);
		this.saveTimer = null;
		return api.saveProgress(this.token, this.character.id, this.progress).then(
			() => undefined,
			() => undefined,
		);
	}

	close(): void {
		this.closed = true;
		window.removeEventListener('pagehide', this.onUnload);
		if (this.saveTimer) clearTimeout(this.saveTimer);
		this.ws?.close();
		this.ws = null;
	}
}

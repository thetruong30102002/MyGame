import { CHAT_MAX, FRIEND_REQUEST_TTL, MAX_FRIENDS, NAME_MAX, WHISPER_KEEP, WHISPER_TTL, type ClientMessage, type ServerMessage, type SocialPerson, type SocialState, type WhisperMessage } from '@havenlord/protocol';
import type { CharacterBrief, Store } from './db.ts';

/** Lời mời đang chờ một người gửi đi tối đa — chặn rải lời mời hàng loạt. */
export const MAX_OUTGOING = 50;

/** Phần của thế giới mà xã hội cần biết: ai đang online ở map nào, và gửi tin cho một nhân vật đang online. */
export interface SocialHost {
	presence(id: string): { map: string; level: number } | null;
	send(id: string, msg: ServerMessage): void;
}

type SocialMsg = Extract<ClientMessage, { t: 'friendAdd' | 'friendRespond' | 'friendRemove' | 'block' | 'whisper' }>;

/**
 * Bạn bè, lời mời, chặn, chat riêng (docs/ke-hoach-xa-hoi.md X1 + X2). Mọi quyết định ở máy chủ; client chỉ gửi ý định và
 * nhận lại trạng thái nguyên khối (`social`). Người bị chặn không biết mình bị chặn: lời mời / tin nhắn của họ báo một câu
 * chung "không gửi được".
 */
export class Social {
	constructor(
		private readonly store: Store,
		private readonly host: SocialHost,
	) {}

	/** Vừa vào game: gửi trạng thái + các tin nhắn riêng nhận được lúc offline; báo bạn bè đang online thấy mình online. */
	online(me: string): void {
		this.push(me);
		const pending = this.store.takeWhispers(me, WHISPER_TTL);
		if (pending.length) {
			const meName = this.store.brief(me)?.name ?? '';
			const names = new Map<string, string>();
			const messages: WhisperMessage[] = pending.map((w) => {
				if (!names.has(w.from)) names.set(w.from, this.store.brief(w.from)?.name ?? '?');
				return { from: w.from, fromName: names.get(w.from)!, to: me, toName: meName, text: w.text, at: w.at };
			});
			this.host.send(me, { t: 'whisper', messages });
		}
		this.pushFriends(me);
	}

	/** Rời game / đổi map / đổi cấp: bạn bè đang online cập nhật trạng thái của mình. */
	presenceChanged(me: string): void {
		this.pushFriends(me);
	}

	handle(me: string, msg: SocialMsg): void {
		switch (msg.t) {
			case 'friendAdd':
				return this.add(me, msg.id, msg.name);
			case 'friendRespond':
				return this.respond(me, String(msg.id ?? ''), !!msg.accept);
			case 'friendRemove':
				return this.remove(me, String(msg.id ?? ''));
			case 'block':
				return this.block(me, String(msg.id ?? ''), !!msg.on);
			case 'whisper':
				return this.whisper(me, msg);
			default:
		}
	}

	state(me: string): SocialState {
		const person = (b: CharacterBrief, friend: boolean): SocialPerson => {
			const p = this.host.presence(b.id);
			// Map đang đứng chỉ lộ cho BẠN; người lạ / lời mời chỉ thấy có online hay không.
			return { id: b.id, name: b.name, level: p?.level ?? b.level, online: !!p, ...(friend && p ? { map: p.map } : {}) };
		};
		const list = (ids: string[], friend = false) => ids.flatMap((id) => {
			const b = this.store.brief(id);
			return b ? [person(b, friend)] : [];
		});
		return {
			friends: list(this.store.friendIds(me), true),
			incoming: list(this.store.requests(me, 'in', FRIEND_REQUEST_TTL)),
			outgoing: list(this.store.requests(me, 'out', FRIEND_REQUEST_TTL)),
			blocked: list(this.store.blockedIds(me)),
		};
	}

	private add(me: string, id: unknown, name: unknown): void {
		const target = typeof id === 'string' && id ? this.store.brief(id) : typeof name === 'string' && name.trim() ? this.store.briefByName(name.slice(0, 40)) : null;
		if (!target) return this.say(me, typeof name === 'string' && name.trim() ? `Không tìm thấy nhân vật tên "${name.trim().slice(0, NAME_MAX)}".` : 'Không tìm thấy nhân vật.');
		const t = target.id;
		if (t === me) return this.say(me, 'Không thể tự kết bạn với chính mình.');
		if (this.store.areFriends(me, t)) return this.say(me, `${target.name} đã là bạn của bạn.`);
		if (this.store.isBlocked(me, t)) return this.say(me, `Bạn đang chặn ${target.name} — bỏ chặn trước đã.`);
		// Bị người kia chặn: báo câu chung, không lộ là bị chặn.
		if (this.store.isBlocked(t, me)) return this.say(me, `Không gửi được lời mời tới ${target.name}.`);
		// Người kia đã mời mình từ trước → mời lại coi như đồng ý.
		if (this.store.hasRequest(t, me)) return this.respond(me, t, true);
		if (this.store.hasRequest(me, t)) return this.say(me, `Đã gửi lời mời tới ${target.name} rồi, chờ họ trả lời nhé.`);
		if (this.store.friendIds(me).length >= MAX_FRIENDS) return this.say(me, `Danh sách bạn đã đủ ${MAX_FRIENDS} người.`);
		if (this.store.requests(me, 'out', FRIEND_REQUEST_TTL).length >= MAX_OUTGOING) return this.say(me, 'Bạn đang chờ quá nhiều lời mời — đợi bớt rồi mời tiếp.');
		this.store.addRequest(me, t);
		this.say(me, `Đã gửi lời mời kết bạn tới ${target.name}.`);
		const myName = this.store.brief(me)?.name ?? '?';
		this.say(t, `${myName} muốn kết bạn với bạn — mở bảng Bạn bè (phím F) để trả lời.`);
		this.push(me);
		this.push(t);
	}

	private respond(me: string, from: string, accept: boolean): void {
		if (!this.store.hasRequest(from, me)) return;
		const other = this.store.brief(from);
		if (!other) return;
		if (!accept) {
			this.store.deleteRequest(from, me);
			this.push(me);
			this.push(from);
			return;
		}
		if (this.store.friendIds(me).length >= MAX_FRIENDS) return this.say(me, `Danh sách bạn đã đủ ${MAX_FRIENDS} người.`);
		if (this.store.friendIds(from).length >= MAX_FRIENDS) return this.say(me, `Danh sách bạn của ${other.name} đã đầy.`);
		this.store.addFriendship(me, from);
		const myName = this.store.brief(me)?.name ?? '?';
		this.say(me, `Bạn và ${other.name} đã là bạn bè.`);
		this.say(from, `${myName} đã đồng ý kết bạn.`);
		this.push(me);
		this.push(from);
	}

	/** Huỷ bạn (không báo người kia) hoặc rút lại lời mời mình đã gửi. */
	private remove(me: string, other: string): void {
		// Xét lời mời TRƯỚC: `removeFriendship` xoá luôn lời mời giữa hai người nên kiểm sau thì luôn thấy "không có gì".
		const friends = this.store.areFriends(me, other);
		if (!friends && !this.store.hasRequest(me, other)) return;
		if (friends) this.store.removeFriendship(me, other);
		else this.store.deleteRequest(me, other);
		this.push(me);
		this.push(other);
	}

	private block(me: string, other: string, on: boolean): void {
		if (other === me || !this.store.brief(other)) return;
		this.store.setBlock(me, other, on);
		this.push(me);
		this.push(other);
	}

	private whisper(me: string, msg: Extract<SocialMsg, { t: 'whisper' }>): void {
		let target: CharacterBrief | null = null;
		let text = '';
		if (typeof msg.to === 'string' && msg.to) {
			target = this.store.brief(msg.to);
			text = String(msg.text ?? '');
		} else if (typeof msg.line === 'string') {
			const split = this.splitLine(msg.line.slice(0, NAME_MAX + 1 + CHAT_MAX));
			if (!split) return this.say(me, 'Cách nhắn riêng: /w <tên nhân vật> <nội dung>. Không tìm thấy tên đó.');
			[target, text] = split;
		}
		text = text.replace(/\s+/g, ' ').trim().slice(0, CHAT_MAX);
		if (!target) return this.say(me, 'Không tìm thấy nhân vật.');
		if (!text) return;
		if (target.id === me) return this.say(me, 'Không thể nhắn riêng cho chính mình.');
		if (this.store.isBlocked(me, target.id)) return this.say(me, `Bạn đang chặn ${target.name} — bỏ chặn để nhắn.`);
		if (this.store.isBlocked(target.id, me)) return this.say(me, `Không gửi được tin nhắn tới ${target.name}.`);
		const myName = this.store.brief(me)?.name ?? '?';
		const w: WhisperMessage = { from: me, fromName: myName, to: target.id, toName: target.name, text, at: Date.now() };
		this.host.send(me, { t: 'whisper', messages: [w] });
		if (this.host.presence(target.id)) this.host.send(target.id, { t: 'whisper', messages: [w] });
		else {
			this.store.queueWhisper(me, target.id, text, w.at, WHISPER_KEEP);
			this.say(me, `${target.name} đang offline — tin sẽ tới khi họ vào game.`);
		}
	}

	/**
	 * `/w <tên> <nội dung>`: tên được có khoảng trắng đơn ở giữa nên không tách ở dấu cách đầu tiên được — thử ghép 1, 2, 3…
	 * từ đầu làm tên, lấy cách ghép DÀI NHẤT trùng một nhân vật có thật.
	 */
	private splitLine(line: string): [CharacterBrief, string] | null {
		const words = line.trim().split(/\s+/);
		for (let n = Math.min(words.length - 1, 8); n >= 1; n -= 1) {
			const name = words.slice(0, n).join(' ');
			if (name.length > NAME_MAX) continue;
			const b = this.store.briefByName(name);
			if (b) return [b, words.slice(n).join(' ')];
		}
		return null;
	}

	private push(id: string): void {
		if (this.host.presence(id)) this.host.send(id, { t: 'social', state: this.state(id) });
	}

	private pushFriends(id: string): void {
		for (const f of this.store.friendIds(id)) this.push(f);
	}

	private say(id: string, text: string): void {
		this.host.send(id, { t: 'system', text });
	}
}

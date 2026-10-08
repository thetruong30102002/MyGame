import { create } from 'zustand';
import type { BuffView, CharacterInfo, DailyView, Gender, GoalView, SocialState } from '@aether/protocol';
import { api, ApiError } from '@/net/api';
import { OnlineSession } from '@/net/OnlineSession';

const TOKEN_KEY = 'aether.token';
/** Tên đăng nhập lần trước: API danh sách nhân vật không trả tên tài khoản, tải lại trang mà không giữ là mất. */
const USER_KEY = 'aether.username';

export type Screen = 'boot' | 'auth' | 'characters' | 'game';

export interface ChatLine {
	id: number;
	name: string;
	text: string;
	self: boolean;
	system?: boolean;
	/** Date.now() lúc nhận — chat thu gọn trên điện thoại làm mờ tin cũ. */
	at: number;
	/** Id nhân vật người nói (chat map) — bấm tên để nhắn riêng / kết bạn / chặn. */
	fromId?: string;
	/** Tin nhắn riêng: `in` = người khác nhắn mình, `out` = mình nhắn (`name` khi đó là người nhận). */
	whisper?: 'in' | 'out';
	/** Kênh của tin chat (thiếu = chat map) — thẻ kênh ở khung chat lọc theo trường này. */
	ch?: 'map' | 'world';
}

/** Một người để nhắn riêng / thao tác (từ bảng Bạn bè hoặc bấm tên trong chat). */
export interface PersonRef {
	id: string;
	name: string;
}

export const EMPTY_SOCIAL: SocialState = { friends: [], incoming: [], outgoing: [], blocked: [] };

interface SessionState {
	screen: Screen;
	token: string | null;
	username: string;
	characters: CharacterInfo[];
	online: OnlineSession | null;
	busy: boolean;
	error: string | null;
	connected: boolean;
	chat: ChatLine[];
	/** Bạn bè / lời mời / chặn (máy chủ đẩy nguyên khối). */
	social: SocialState;
	/** Số kim cương trong ví (máy chủ đẩy sau khi vào game và mỗi lần đổi) — null = chưa biết (máy chủ bản cũ). */
	diamonds: number | null;
	/** Điểm danh hôm nay (máy chủ đẩy lúc vào game + sau mỗi lần điểm danh). */
	daily: DailyView | null;
	/** Tiến độ thành tựu — chỉ có sau khi xin (mở Bia Danh Vọng). */
	goals: GoalView[] | null;
	/** Bình thời hạn đang hiệu lực + lúc nhận (Date.now) — giây còn lại tính lùi từ mốc này (`activeBuffs`). */
	buffs: { list: BuffView[]; at: number } | null;
	/** Trạm đã từng tới (`vùng/map`, máy chủ gửi khi mở cột dịch chuyển) — null = chưa xin. */
	hubs: string[] | null;
	/** Đang nhắn riêng cho ai (ô nhập chat gửi tin riêng tới người này) — null = chat map. */
	whisperTo: PersonRef | null;
	/** Người vừa nhắn riêng cho mình gần nhất — lệnh `/r` trả lời người này. */
	lastWhisper: PersonRef | null;
	setWhisperTo(p: PersonRef | null): void;
	/** Menu thao tác với một người chơi (bấm tên trong chat / bấm nhân vật trên map) — toạ độ màn hình. */
	personMenu: { person: PersonRef; at: { x: number; y: number } } | null;
	setPersonMenu(m: { person: PersonRef; at: { x: number; y: number } } | null): void;
	/** Lời nhắn hiện ở màn chọn nhân vật sau khi bị đưa ra khỏi game (vd đăng nhập ở nơi khác). */
	notice: string | null;
	boot(): Promise<void>;
	login(username: string, password: string, register: boolean): Promise<void>;
	logout(): Promise<void>;
	createCharacter(name: string, gender: Gender): Promise<boolean>;
	deleteCharacter(id: string): Promise<void>;
	play(character: CharacterInfo): void;
	/** Về màn chọn nhân vật: lưu chắc chắn rồi đóng phiên trực tuyến. `notice`: lý do hiện cho người chơi đọc. */
	leaveGame(notice?: string): Promise<void>;
	clearNotice(): void;
	pushChat(line: Omit<ChatLine, 'id' | 'at'>): void;
}

let chatId = 0;
/** Số dòng chat giữ lại (mọi kênh chung một danh sách — kênh Thế giới đông nên giữ nhiều hơn một màn). */
const CHAT_KEEP = 120;

/** Ví / điểm danh / thành tựu của nhân vật trước không được lọt sang lượt chơi mới. */
const NO_REWARDS = { diamonds: null, daily: null, goals: null, buffs: null, hubs: null };

function readStored(key: string): string | null {
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}

function writeStored(key: string, value: string | null): void {
	try {
		if (value) localStorage.setItem(key, value);
		else localStorage.removeItem(key);
	} catch {
		/* chế độ ẩn danh: mỗi lần mở trang đăng nhập lại */
	}
}

const readToken = (): string | null => readStored(TOKEN_KEY);
const writeToken = (token: string | null): void => writeStored(TOKEN_KEY, token);

/** Phiên người chơi: đăng nhập → chọn/tạo nhân vật → vào game. Token phiên giữ ở localStorage để lần sau khỏi đăng nhập. */
export const useSession = create<SessionState>((set, get) => {
	const fail = (e: unknown) => {
		const message = e instanceof Error ? e.message : String(e);
		if (e instanceof ApiError && e.status === 401 && get().token) {
			writeToken(null);
			set({ token: null, screen: 'auth' });
		}
		set({ error: message, busy: false });
	};

	return {
		screen: 'boot',
		token: null,
		username: '',
		characters: [],
		online: null,
		busy: false,
		error: null,
		connected: false,
		chat: [],
		social: EMPTY_SOCIAL,
		diamonds: null,
		daily: null,
		goals: null,
		buffs: null,
		hubs: null,
		whisperTo: null,
		lastWhisper: null,
		setWhisperTo: (whisperTo) => set({ whisperTo }),
		personMenu: null,
		setPersonMenu: (personMenu) => set({ personMenu }),
		notice: null,
		boot: async () => {
			const token = readToken();
			// Đăng xuất vẫn giữ tên: màn đăng nhập điền sẵn, chỉ phải gõ lại mật khẩu.
			const username = readStored(USER_KEY) ?? '';
			if (!token) return set({ screen: 'auth', username });
			set({ token, username, busy: true });
			try {
				const characters = await api.characters(token);
				set({ characters, screen: 'characters', busy: false });
			} catch (e) {
				fail(e);
				if (get().screen === 'boot') set({ screen: 'auth' });
			}
		},
		login: async (username, password, register) => {
			set({ busy: true, error: null });
			try {
				const r = register ? await api.register(username, password) : await api.login(username, password);
				writeToken(r.token);
				writeStored(USER_KEY, r.username);
				const characters = await api.characters(r.token);
				set({ token: r.token, username: r.username, characters, screen: 'characters', busy: false });
			} catch (e) {
				fail(e);
			}
		},
		logout: async () => {
			const { token, online } = get();
			online?.close();
			writeToken(null);
			set({ token: null, characters: [], online: null, screen: 'auth', chat: [], notice: null, social: EMPTY_SOCIAL, ...NO_REWARDS, whisperTo: null, lastWhisper: null });
			if (token) await api.logout(token).catch(() => undefined);
		},
		createCharacter: async (name, gender) => {
			const token = get().token;
			if (!token) return false;
			set({ busy: true, error: null });
			try {
				const c = await api.createCharacter(token, name, gender);
				set({ characters: [...get().characters, c], busy: false });
				return true;
			} catch (e) {
				fail(e);
				return false;
			}
		},
		deleteCharacter: async (id) => {
			const token = get().token;
			if (!token) return;
			set({ busy: true, error: null });
			try {
				await api.deleteCharacter(token, id);
				set({ characters: get().characters.filter((c) => c.id !== id), busy: false });
			} catch (e) {
				fail(e);
			}
		},
		play: (character) => {
			const token = get().token;
			if (!token) return;
			const online = new OnlineSession(token, character);
			set({ online, screen: 'game', chat: [], error: null, notice: null, social: EMPTY_SOCIAL, ...NO_REWARDS, whisperTo: null, lastWhisper: null });
		},
		leaveGame: async (notice) => {
			const { online, token } = get();
			if (online) {
				await online.flush();
				online.close();
			}
			// Kiểm kiểu: lỡ ai gắn thẳng `onClick={leaveGame}` thì sự kiện chuột không được thành lời nhắn.
			set({ online: null, screen: 'characters', connected: false, notice: typeof notice === 'string' && notice ? notice : null });
			if (token) {
				const characters = await api.characters(token).catch(() => get().characters);
				set({ characters });
			}
		},
		clearNotice: () => set({ notice: null }),
		pushChat: (line) => {
			chatId += 1;
			set({ chat: [...get().chat.slice(-(CHAT_KEEP - 1)), { ...line, id: chatId, at: Date.now() }] });
		},
	};
});

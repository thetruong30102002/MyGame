import { create } from 'zustand';

/**
 * Cài đặt của MÁY NÀY (âm thanh, hiển thị) — sở thích theo thiết bị nên lưu ở trình duyệt, không lên máy chủ: điện thoại
 * tắt tiếng không có nghĩa máy tính ở nhà cũng tắt. Đọc / ghi bọc try/catch (chế độ ẩn danh, chặn lưu trữ → dùng mặc định).
 */
export interface Settings {
	/** Âm lượng 0–1. Game CHƯA có âm thanh — lưu sẵn, khi có nhạc / hiệu ứng âm thanh thì đọc từ đây. */
	volume: number;
	music: number;
	sfx: number;
	muted: boolean;
	/** Vẽ người chơi khác trên map (tắt cho đỡ rối / máy yếu). Tắt thì cả tên trên đầu họ cũng ẩn. */
	showOthers: boolean;
	/** Tên + cấp trên đầu người chơi khác. */
	showOtherNames: boolean;
	/** Rung màn hình khi đánh trúng / nổ. */
	shake: boolean;
}

export const DEFAULT_SETTINGS: Settings = { volume: 0.8, music: 0.6, sfx: 0.8, muted: false, showOthers: true, showOtherNames: true, shake: true };
const KEY = 'aether.settings';

/** Bản lưu cũ / sửa tay: chỉ nhận đúng kiểu từng trường, thiếu hay sai thì lấy mặc định. */
export function cleanSettings(raw: unknown): Settings {
	const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
	const num = (k: 'volume' | 'music' | 'sfx') => (typeof o[k] === 'number' && Number.isFinite(o[k]) ? Math.min(1, Math.max(0, o[k] as number)) : DEFAULT_SETTINGS[k]);
	const bool = (k: 'muted' | 'showOthers' | 'showOtherNames' | 'shake') => (typeof o[k] === 'boolean' ? (o[k] as boolean) : DEFAULT_SETTINGS[k]);
	return { volume: num('volume'), music: num('music'), sfx: num('sfx'), muted: bool('muted'), showOthers: bool('showOthers'), showOtherNames: bool('showOtherNames'), shake: bool('shake') };
}

function load(): Settings {
	try {
		return cleanSettings(JSON.parse(localStorage.getItem(KEY) ?? 'null'));
	} catch {
		return DEFAULT_SETTINGS;
	}
}

export const useSettings = create<Settings & { set(patch: Partial<Settings>): void; reset(): void }>((set, get) => {
	const save = (): void => {
		try {
			const { set: _s, reset: _r, ...data } = get();
			localStorage.setItem(KEY, JSON.stringify(data));
		} catch {
			/* không lưu được: vẫn áp dụng trong phiên này */
		}
	};
	return {
		...(typeof window === 'undefined' ? DEFAULT_SETTINGS : load()),
		set: (patch) => {
			set(cleanSettings({ ...get(), ...patch }));
			save();
		},
		reset: () => {
			set(DEFAULT_SETTINGS);
			save();
		},
	};
});

import type { ChatLine } from '@/store/useSession';

/**
 * Thẻ kênh của khung chat (docs/ke-hoach-xa-hoi.md mục 2). Luật THUẦN để test bằng node: tin nào hiện ở thẻ nào, đếm tin chưa
 * đọc. Thông báo hệ thống hiện ở MỌI thẻ (lỗi gửi, "chậm lại chút" phải thấy ngay ở thẻ đang gõ). Thẻ Tổ đội có khi có tổ đội.
 */
export type ChatTab = 'all' | 'map' | 'world' | 'whisper';

export const CHAT_TABS: readonly { id: ChatTab; label: string }[] = [
	{ id: 'all', label: 'Tất cả' },
	{ id: 'map', label: 'Map' },
	{ id: 'world', label: 'Thế giới' },
	{ id: 'whisper', label: 'Riêng' },
];

/** Kênh của một dòng (tin không ghi kênh = chat map, như máy chủ bản cũ). */
export function lineChannel(l: ChatLine): 'system' | 'whisper' | 'world' | 'map' {
	if (l.system) return 'system';
	if (l.whisper) return 'whisper';
	return l.ch === 'world' ? 'world' : 'map';
}

export function inTab(l: ChatLine, tab: ChatTab): boolean {
	const ch = lineChannel(l);
	return tab === 'all' || ch === 'system' || ch === tab;
}

/** Số tin của NGƯỜI KHÁC ở thẻ `tab` mới hơn mốc đã xem `seen` (id dòng). Thông báo hệ thống / tin của mình không tính. */
export function unread(lines: readonly ChatLine[], tab: ChatTab, seen: number): number {
	if (tab === 'all') return 0;
	let n = 0;
	for (const l of lines) if (l.id > seen && !l.self && !l.system && lineChannel(l) === tab) n += 1;
	return n;
}

/** Một người trong thẻ Riêng: tab riêng theo từng người đã nhắn / được nhắn (mới nhất trước). */
export interface WhisperPartner {
	id: string;
	name: string;
	/** id dòng tin cuối với người này. */
	last: number;
}

/** Những người có tin riêng trong danh sách chat (dòng tin riêng ghi `fromId` = người kia — cả tin mình gửi đi), mới nhất trước. */
export function whisperPartners(lines: readonly ChatLine[]): WhisperPartner[] {
	const map = new Map<string, WhisperPartner>();
	for (const l of lines) {
		if (!l.whisper || !l.fromId) continue;
		map.set(l.fromId, { id: l.fromId, name: l.name, last: l.id });
	}
	return [...map.values()].sort((a, b) => b.last - a.last);
}

/** Tin riêng CỦA người `id` gửi mình, mới hơn mốc đã xem `seen`. */
export function unreadFrom(lines: readonly ChatLine[], id: string, seen: number): number {
	let n = 0;
	for (const l of lines) if (l.id > seen && l.whisper === 'in' && l.fromId === id) n += 1;
	return n;
}

/** Dòng thuộc cuộc trò chuyện riêng với `id` (cả thông báo hệ thống — vd "đang offline, tin sẽ tới sau"). */
export function inConversation(l: ChatLine, id: string): boolean {
	return !!l.system || (!!l.whisper && l.fromId === id);
}

/**
 * Gửi dòng `text` theo thẻ đang mở: `/g <nội dung>` = kênh Thế giới từ thẻ nào cũng được; ở thẻ Thế giới → Thế giới; thẻ Riêng
 * mà chưa chọn người → nhắc cách nhắn riêng; còn lại → chat map. (`/w`, `/r` và "đang nhắn riêng cho ai" xử lý trước ở ChatBox.)
 */
export function routeLine(text: string, tab: ChatTab): { ch: 'map' | 'world'; text: string } | { hint: string } {
	const g = /^\/g(?:\s+([\s\S]*))?$/i.exec(text);
	if (g) {
		const rest = (g[1] ?? '').trim();
		return rest ? { ch: 'world', text: rest } : { hint: 'Cách chat kênh Thế giới: /g <nội dung> (hoặc mở thẻ Thế giới).' };
	}
	if (tab === 'world') return { ch: 'world', text };
	if (tab === 'whisper') return { hint: 'Thẻ Riêng: gõ /w <tên> <nội dung>, /r để trả lời, hoặc bấm tên người chơi → Nhắn riêng.' };
	return { ch: 'map', text };
}

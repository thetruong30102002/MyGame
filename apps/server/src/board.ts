// Trang chủ (chủ dự án 14/10/2026: "thêm trên landing page 1 trang admin … bổ sung tính năng đăng nhập trên trang chủ và góp ý, đăng
// bài"): tin tức do quản trị đăng / sửa / xoá (thay cho sửa tay site/news.json) + bài viết cộng đồng của người chơi kèm bình luận.
// Phiên + quyền kiểm ở `http.ts`; ở đây kiểm DỮ LIỆU (độ dài, nhãn, ký tự điều khiển) và ai được xoá gì: chủ bài / chủ bình luận
// hoặc quản trị. Xoá = ẩn (CSDL giữ lại).
import { readFileSync } from 'node:fs';
import {
	COMMENT_MAX,
	FEEDBACK_REPLY_MAX,
	FEEDBACK_STATUS,
	POST_CATEGORIES,
	NEWS_LINE_MAX,
	NEWS_LINES_MAX,
	NEWS_TAGS,
	NEWS_TITLE_MAX,
	POST_BODY_MAX,
	POST_TITLE_MAX,
	type CommentItem,
	type FeedbackEntry,
	type FeedbackStatus,
	type MyFeedback,
	type PostCategory,
	type NewsItem,
	type NewsTag,
	type PostItem,
} from '@aether/protocol';
import type { CommentRow, NewsRow, PostRow, Store } from './db.ts';

export class BoardError extends Error {
	constructor(
		readonly status: number,
		message: string,
	) {
		super(message);
	}
}

/** Người đang gọi: tài khoản + có phải quản trị không. */
export interface Viewer {
	accountId: number;
	username: string;
	admin: boolean;
}

const PAGE = { fallback: 20, max: 50 };
const DATE = new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' });

export class Board {
	constructor(private readonly store: Store) {}

	// ———— Tin tức ————

	news(rawLimit: unknown): NewsItem[] {
		return this.store.newsList(clampLimit(rawLimit, 50, 200)).map(toNews);
	}

	addNews(admin: Viewer, raw: unknown): NewsItem {
		const n = parseNews(raw);
		return toNews(this.store.news(this.store.addNews(n.tag, n.title, n.body, admin.username))!);
	}

	updateNews(id: number, raw: unknown): NewsItem {
		const n = parseNews(raw);
		if (!this.store.updateNews(id, n.tag, n.title, n.body)) throw new BoardError(404, 'Không có tin này');
		return toNews(this.store.news(id)!);
	}

	deleteNews(id: number): void {
		if (!this.store.deleteNews(id)) throw new BoardError(404, 'Không có tin này');
	}

	/**
	 * Lần đầu (bảng tin rỗng) nạp tin cũ từ site/news.json — file dạng `{ date: 'dd/mm/yyyy', tag, title, body: string[] }[]`, mới nhất
	 * trước. Trả số tin đã nạp; file hỏng / thiếu thì 0.
	 */
	seedNews(file: string): number {
		if (this.store.newsCount() > 0) return 0;
		let list: unknown;
		try {
			list = JSON.parse(readFileSync(file, 'utf8'));
		} catch {
			return 0;
		}
		if (!Array.isArray(list)) return 0;
		let n = 0;
		// Thêm từ cũ tới mới để tin cùng ngày giữ đúng thứ tự (id lớn hơn = mới hơn).
		for (const it of [...list].reverse()) {
			const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(String(it?.date ?? ''));
			if (!m || typeof it.title !== 'string' || !Array.isArray(it.body)) continue;
			// 12:00 giờ Việt Nam (UTC+7) của ngày ghi trong file.
			const at = Date.UTC(+m[3]!, +m[2]! - 1, +m[1]!, 5);
			const tag = (NEWS_TAGS as readonly string[]).includes(it.tag) ? it.tag : NEWS_TAGS[0];
			this.store.addNews(tag, it.title, it.body.map(String), 'Aether', at);
			n++;
		}
		return n;
	}

	// ———— Bài viết + bình luận ————

	/** Danh sách bài: `category` lạ / vắng = mọi chuyên mục; `q` tìm chữ (tối đa 60 ký tự). */
	posts(viewer: Viewer | null, rawLimit: unknown, rawBefore: unknown, rawCategory?: unknown, rawQ?: unknown): PostItem[] {
		const b = Math.floor(Number(rawBefore));
		const q = oneLine(rawQ).slice(0, 60);
		return this.store
			.posts(clampLimit(rawLimit, PAGE.fallback, PAGE.max), Number.isFinite(b) && b > 0 ? b : null, category(rawCategory), q)
			.map((r) => toPost(r, viewer));
	}

	/** Số bài theo chuyên mục (đủ mọi chuyên mục, chưa có bài = 0) + tổng. */
	postCounts(): { total: number; categories: Record<PostCategory, number> } {
		const raw = this.store.postCounts();
		const categories = Object.fromEntries(Object.keys(POST_CATEGORIES).map((k) => [k, raw[k] ?? 0])) as Record<PostCategory, number>;
		return { total: Object.values(categories).reduce((a, n) => a + n, 0), categories };
	}

	post(viewer: Viewer | null, id: number): { post: PostItem; comments: CommentItem[] } {
		const p = this.store.post(id);
		if (!p) throw new BoardError(404, 'Bài viết không còn');
		return { post: toPost(p, viewer), comments: this.store.comments(id).map((c) => toComment(c, viewer)) };
	}

	addPost(viewer: Viewer, raw: unknown): PostItem {
		const b = obj(raw);
		const title = oneLine(b.title);
		const body = multiLine(b.body);
		if (title.length < 3) throw new BoardError(400, 'Tiêu đề ngắn quá');
		if (title.length > POST_TITLE_MAX) throw new BoardError(400, `Tiêu đề tối đa ${POST_TITLE_MAX} ký tự`);
		if (body.length < 3) throw new BoardError(400, 'Nội dung ngắn quá');
		if (body.length > POST_BODY_MAX) throw new BoardError(400, `Nội dung tối đa ${POST_BODY_MAX} ký tự`);
		const id = this.store.addPost(viewer.accountId, this.author(viewer, b.characterId), title, body, category(b.category) ?? 'chung');
		return toPost(this.store.post(id)!, viewer);
	}

	addComment(viewer: Viewer, postId: number, raw: unknown): CommentItem {
		if (!this.store.post(postId)) throw new BoardError(404, 'Bài viết không còn');
		const b = obj(raw);
		const body = multiLine(b.body);
		if (body.length < 1) throw new BoardError(400, 'Chưa viết gì');
		if (body.length > COMMENT_MAX) throw new BoardError(400, `Bình luận tối đa ${COMMENT_MAX} ký tự`);
		const id = this.store.addComment(postId, viewer.accountId, this.author(viewer, b.characterId), body);
		return toComment(this.store.comment(id)!, viewer);
	}

	/** Chủ bài hoặc quản trị. */
	deletePost(viewer: Viewer, id: number): void {
		const p = this.store.post(id);
		if (!p) throw new BoardError(404, 'Bài viết không còn');
		if (p.account_id !== viewer.accountId && !viewer.admin) throw new BoardError(403, 'Chỉ người đăng hoặc quản trị được xoá');
		this.store.hidePost(id);
	}

	deleteComment(viewer: Viewer, id: number): void {
		const c = this.store.comment(id);
		if (!c) throw new BoardError(404, 'Bình luận không còn');
		if (c.account_id !== viewer.accountId && !viewer.admin) throw new BoardError(403, 'Chỉ người viết hoặc quản trị được xoá');
		this.store.hideComment(id);
	}

	// ———— Góp ý: người gửi xem lại, quản trị đổi trạng thái / trả lời ————

	myFeedback(viewer: Viewer): MyFeedback[] {
		return this.store.myFeedback(viewer.accountId, 100);
	}

	updateFeedback(admin: Viewer, id: number, raw: unknown): FeedbackEntry {
		const b = obj(raw);
		let status: FeedbackStatus | null = null;
		if (b.status !== undefined) {
			if (typeof b.status !== 'string' || !(b.status in FEEDBACK_STATUS)) throw new BoardError(400, 'Trạng thái: ' + Object.keys(FEEDBACK_STATUS).join(' / '));
			status = b.status as FeedbackStatus;
		}
		const reply = b.reply === undefined ? null : multiLine(b.reply);
		if (reply && reply.length > FEEDBACK_REPLY_MAX) throw new BoardError(400, `Trả lời tối đa ${FEEDBACK_REPLY_MAX} ký tự`);
		if (status === null && reply === null) throw new BoardError(400, 'Chưa có thay đổi nào');
		// Trả lời mà chưa chọn trạng thái → coi như đã xem.
		const cur = this.store.feedback(id);
		if (!cur) throw new BoardError(404, 'Không có góp ý này');
		if (reply && !status && cur.status === 'moi') status = 'da-xem';
		this.store.updateFeedback(id, status, reply, admin.username);
		return this.store.feedback(id)!;
	}

	/** Tên hiện: nhân vật được chọn (phải thuộc đúng tài khoản) → nhân vật đầu tiên → tên tài khoản. */
	private author(viewer: Viewer, characterId: unknown): string {
		const chars = this.store.characters(viewer.accountId);
		return (chars.find((c) => c.id === characterId) ?? chars[0])?.name ?? viewer.username;
	}
}

function toNews(r: NewsRow): NewsItem {
	let body: string[] = [];
	try {
		const v = JSON.parse(r.body);
		if (Array.isArray(v)) body = v.map(String);
	} catch {
		/* dòng hỏng → tin không có nội dung */
	}
	return { id: r.id, at: r.at, date: DATE.format(r.at), tag: r.tag as NewsTag, title: r.title, body, author: r.author };
}

function toPost(r: PostRow, viewer: Viewer | null): PostItem {
	return {
		id: r.id,
		at: r.at,
		category: category(r.category) ?? 'chung',
		author: r.author,
		title: r.title,
		body: r.body,
		comments: Number(r.comments) || 0,
		mine: viewer?.accountId === r.account_id,
	};
}

function toComment(r: CommentRow, viewer: Viewer | null): CommentItem {
	return { id: r.id, at: r.at, author: r.author, body: r.body, mine: viewer?.accountId === r.account_id };
}

/** Kiểm + chuẩn hoá tin: nhãn trong `NEWS_TAGS`, tiêu đề 3…, nội dung nhiều dòng → mỗi dòng không rỗng một gạch đầu dòng. */
export function parseNews(raw: unknown): { tag: NewsTag; title: string; body: string[] } {
	const b = obj(raw);
	const tag = NEWS_TAGS.find((t) => t === b.tag);
	if (!tag) throw new BoardError(400, `Nhãn tin: ${NEWS_TAGS.join(' / ')}`);
	const title = oneLine(b.title);
	if (title.length < 3) throw new BoardError(400, 'Tiêu đề ngắn quá');
	if (title.length > NEWS_TITLE_MAX) throw new BoardError(400, `Tiêu đề tối đa ${NEWS_TITLE_MAX} ký tự`);
	const body = multiLine(b.body)
		.split('\n')
		.map((l) => l.replace(/^\s*[-•*]\s*/, '').trim())
		.filter(Boolean);
	if (!body.length) throw new BoardError(400, 'Chưa có nội dung');
	if (body.length > NEWS_LINES_MAX) throw new BoardError(400, `Tối đa ${NEWS_LINES_MAX} dòng`);
	if (body.some((l) => l.length > NEWS_LINE_MAX)) throw new BoardError(400, `Mỗi dòng tối đa ${NEWS_LINE_MAX} ký tự`);
	return { tag, title, body };
}

/** Id chuyên mục hợp lệ, không thì null. */
function category(v: unknown): PostCategory | null {
	return typeof v === 'string' && v in POST_CATEGORIES ? (v as PostCategory) : null;
}

function obj(raw: unknown): Record<string, unknown> {
	return raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
}

/** Một dòng: bỏ ký tự điều khiển, gộp khoảng trắng. */
function oneLine(v: unknown): string {
	return typeof v === 'string'
		? v
				.normalize('NFC')
				.replace(/[\u0000-\u001f\u007f]/g, ' ')
				.replace(/\s+/g, ' ')
				.trim()
		: '';
}

/** Nhiều dòng: giữ xuống dòng (tối đa 2 dòng trống liền nhau), bỏ ký tự điều khiển khác. */
function multiLine(v: unknown): string {
	return typeof v === 'string'
		? v
				.normalize('NFC')
				.replace(/\r\n?/g, '\n')
				.replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, ' ')
				.replace(/\n{3,}/g, '\n\n')
				.trim()
		: '';
}

function clampLimit(raw: unknown, fallback: number, max: number): number {
	const n = Math.floor(Number(raw));
	return Number.isFinite(n) && n > 0 ? Math.min(max, n) : fallback;
}

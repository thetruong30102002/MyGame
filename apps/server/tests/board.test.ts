// Trang chủ (14/10/2026): /api/me, tin tức (quản trị đăng / sửa / xoá, nạp lần đầu từ news.json), bài viết + bình luận cộng đồng
// (cần đăng nhập, kẹp độ dài, tên hiện = nhân vật của đúng tài khoản, chủ bài / quản trị mới xoá được, chặn dồn dập), trang /admin.
// Chạy: npx tsx --test tests/board.test.ts (trong apps/server).
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { POST_BODY_MAX, type CommentItem, type FeedbackEntry, type MeResponse, type MyFeedback, type NewsItem, type PostItem } from '@havenlord/protocol';
import { Board } from '../src/board.ts';
import { Store } from '../src/db.ts';
import { createApi, newProgress } from '../src/http.ts';

const dir = mkdtempSync(join(tmpdir(), 'aether-board-'));
const store = new Store(join(dir, 'b.db'));
const api = createApi(store);
const server: Server = createServer((req, res) => void api(req, res));
await new Promise<void>((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${(server.address() as { port: number }).port}`;

async function call<T>(method: string, path: string, token: string | null, body?: unknown): Promise<{ status: number; data: T }> {
	const r = await fetch(BASE + path, {
		method,
		headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
		body: body === undefined ? undefined : JSON.stringify(body),
	});
	const text = await r.text();
	return { status: r.status, data: (r.headers.get('content-type')?.includes('json') ? JSON.parse(text) : text) as T };
}

const player = store.createAccount('nguoi_choi', 'x')!;
store.createSession('tokPlayer', player, 3600_000);
const other = store.createAccount('nguoi_khac', 'x')!;
store.createSession('tokOther', other, 3600_000);
store.createSession('tokAdmin', store.createAccount('quan_tri', 'x')!, 3600_000);
store.setAdmin('quan_tri', true);
const hero = store.createCharacter('00000000-0000-0000-0000-0000000000c1', player, 'Ánh Dương', 'female', newProgress())!.id;
const stranger = store.createCharacter('00000000-0000-0000-0000-0000000000c2', other, 'Minh Khôi', 'male', newProgress())!.id;

try {
	test('/api/me: cần đăng nhập; trả tên, quyền quản trị, nhân vật', async () => {
		assert.equal((await call('GET', '/api/me', null)).status, 401);
		const me = await call<MeResponse>('GET', '/api/me', 'tokPlayer');
		assert.deepEqual([me.data.username, me.data.admin, me.data.characters.map((c) => c.name)], ['nguoi_choi', false, ['Ánh Dương']]);
		assert.equal((await call<MeResponse>('GET', '/api/me', 'tokAdmin')).data.admin, true);
	});

	test('nạp tin từ news.json chỉ một lần, giữ thứ tự mới nhất trước', () => {
		const s2 = new Store(join(dir, 'seed.db'));
		const file = join(dir, 'news.json');
		writeFileSync(file, JSON.stringify([
			{ date: '13/10/2026', tag: 'Cập nhật', title: 'Tin mới', body: ['a', 'b'] },
			{ date: '13/10/2026', tag: 'Lạ', title: 'Cùng ngày, cũ hơn', body: ['c'] },
			{ date: '11/10/2026', tag: 'Thông báo', title: 'Tin cũ', body: ['d'] },
			{ date: 'hỏng', title: 'bỏ qua', body: [] },
		]));
		const b = new Board(s2);
		assert.equal(b.seedNews(file), 3);
		assert.equal(b.seedNews(file), 0, 'bảng đã có tin → không nạp lại');
		const list = b.news(undefined);
		assert.deepEqual(list.map((n) => [n.title, n.date, n.tag]), [
			['Tin mới', '13/10/2026', 'Cập nhật'],
			['Cùng ngày, cũ hơn', '13/10/2026', 'Cập nhật'],
			['Tin cũ', '11/10/2026', 'Thông báo'],
		]);
		s2.close();
	});

	test('tin tức: chỉ quản trị đăng / sửa / xoá; ai cũng đọc được', async () => {
		const add = { tag: 'Sự kiện', title: 'Săn boss cuối tuần', body: '- Nhân đôi EXP\n\n• Rơi đồ hiếm\n' };
		assert.equal((await call('POST', '/api/admin/news', null, add)).status, 401);
		assert.equal((await call('POST', '/api/admin/news', 'tokPlayer', add)).status, 403);
		assert.equal((await call('POST', '/api/admin/news', 'tokAdmin', { ...add, tag: 'Lạ' })).status, 400);
		assert.equal((await call('POST', '/api/admin/news', 'tokAdmin', { ...add, body: '  \n ' })).status, 400);
		const made = await call<NewsItem>('POST', '/api/admin/news', 'tokAdmin', add);
		assert.equal(made.status, 200);
		assert.deepEqual([made.data.body, made.data.author], [['Nhân đôi EXP', 'Rơi đồ hiếm'], 'quan_tri'], 'bỏ gạch đầu dòng + dòng trống');
		const edited = await call<NewsItem>('PUT', `/api/admin/news/${made.data.id}`, 'tokAdmin', { ...add, title: 'Săn boss cả tuần' });
		assert.deepEqual([edited.data.title, edited.data.at], ['Săn boss cả tuần', made.data.at], 'sửa giữ ngày đăng');
		const pub = await call<NewsItem[]>('GET', '/api/news', null);
		assert.equal(pub.data[0]!.title, 'Săn boss cả tuần');
		assert.equal((await call('DELETE', `/api/admin/news/${made.data.id}`, 'tokPlayer')).status, 403);
		assert.equal((await call('DELETE', `/api/admin/news/${made.data.id}`, 'tokAdmin')).status, 200);
		assert.equal((await call('DELETE', `/api/admin/news/${made.data.id}`, 'tokAdmin')).status, 404);
	});

	test('bài viết: cần đăng nhập, kẹp độ dài, tên hiện là nhân vật của đúng tài khoản', async () => {
		assert.equal((await call('POST', '/api/posts', null, { title: 'Xin chào', body: 'mọi người' })).status, 401);
		assert.equal((await call('POST', '/api/posts', 'tokPlayer', { title: 'a', body: 'nội dung' })).status, 400);
		assert.equal((await call('POST', '/api/posts', 'tokPlayer', { title: 'Dài quá', body: 'x'.repeat(POST_BODY_MAX + 1) })).status, 400);
		// Chọn nhân vật của người khác → không nhận, lấy nhân vật đầu của chính tài khoản.
		const p = await call<PostItem>('POST', '/api/posts', 'tokPlayer', { title: 'Tìm tổ đội', body: 'Ai đi\r\nđầm lầy không?', characterId: stranger });
		assert.equal(p.status, 200);
		assert.deepEqual([p.data.author, p.data.body, p.data.mine], ['Ánh Dương', 'Ai đi\nđầm lầy không?', true]);
		// Tài khoản không có nhân vật → tên tài khoản.
		const a = await call<PostItem>('POST', '/api/posts', 'tokAdmin', { title: 'Lịch bảo trì', body: 'Tối nay 22h' });
		assert.equal(a.data.author, 'quan_tri');
		const list = await call<PostItem[]>('GET', '/api/posts', null);
		assert.deepEqual(list.data.map((x) => [x.title, x.mine]), [['Lịch bảo trì', false], ['Tìm tổ đội', false]], 'chưa đăng nhập → mine luôn false');
		const page2 = await call<PostItem[]>('GET', `/api/posts?limit=1&before=${a.data.id}`, 'tokPlayer');
		assert.deepEqual(page2.data.map((x) => [x.title, x.mine]), [['Tìm tổ đội', true]]);
	});

	test('bình luận + xoá: chủ hoặc quản trị; bài đã xoá thì không bình luận được', async () => {
		const p = (await call<PostItem>('POST', '/api/posts', 'tokOther', { title: 'Hỏi đường', body: 'Làng Lau Xám ở đâu?' })).data;
		const c = await call<CommentItem>('POST', `/api/posts/${p.id}/comments`, 'tokPlayer', { body: 'Đi về phía tây nam', characterId: hero });
		assert.deepEqual([c.status, c.data.author], [200, 'Ánh Dương']);
		assert.equal((await call('POST', `/api/posts/${p.id}/comments`, 'tokPlayer', { body: '   ' })).status, 400);
		const detail = await call<{ post: PostItem; comments: CommentItem[] }>('GET', `/api/posts/${p.id}`, 'tokOther');
		assert.deepEqual([detail.data.post.comments, detail.data.post.mine, detail.data.comments[0]!.mine], [1, true, false]);
		assert.equal((await call('DELETE', `/api/comments/${c.data.id}`, 'tokOther')).status, 403, 'chủ bài không xoá bình luận của người khác');
		assert.equal((await call('DELETE', `/api/comments/${c.data.id}`, 'tokAdmin')).status, 200);
		assert.equal((await call<{ comments: CommentItem[] }>('GET', `/api/posts/${p.id}`, null)).data.comments.length, 0);
		assert.equal((await call('DELETE', `/api/posts/${p.id}`, 'tokPlayer')).status, 403);
		assert.equal((await call('DELETE', `/api/posts/${p.id}`, 'tokOther')).status, 200);
		assert.equal((await call('GET', `/api/posts/${p.id}`, null)).status, 404);
		assert.equal((await call('POST', `/api/posts/${p.id}/comments`, 'tokPlayer', { body: 'muộn rồi' })).status, 404);
	});

	test('chặn dồn dập: 3 bài / 10 phút mỗi tài khoản (tính cả lần hỏng)', async () => {
		// tokPlayer đã dùng 3 lượt ở trên (2 lần hỏng + 1 bài; lần chưa đăng nhập không tính) → lượt thứ 4 bị chặn.
		assert.equal((await call('POST', '/api/posts', 'tokPlayer', { title: 'Lần nữa', body: 'thử chặn' })).status, 429);
	});

	test('diễn đàn: chuyên mục (lạ → chung), lọc, tìm chữ, đếm theo chuyên mục', async () => {
		const mk = (title: string, category?: string) => call<PostItem>('POST', '/api/posts', 'tokOther', { title, body: 'nội dung ' + title, category });
		const a = (await mk('Đi săn Hydra', 'to-doi')).data;
		const b = (await mk('Cách lên cấp nhanh', 'lạ')).data;
		assert.deepEqual([a.category, b.category], ['to-doi', 'chung']);
		const team = await call<PostItem[]>('GET', '/api/posts?category=to-doi', null);
		assert.deepEqual(team.data.map((p) => p.title), ['Đi săn Hydra']);
		const found = await call<PostItem[]>('GET', '/api/posts?q=' + encodeURIComponent('lên cấp'), null);
		assert.deepEqual(found.data.map((p) => p.title), ['Cách lên cấp nhanh']);
		const pct = await call<PostItem[]>('GET', '/api/posts?q=%25', null);
		assert.equal(pct.data.length, 0, '"%" là chữ thường, không phải ký tự đại diện');
		const counts = await call<{ total: number; categories: Record<string, number> }>('GET', '/api/posts/counts', null);
		assert.equal(counts.data.categories['to-doi'], 1);
		assert.equal(counts.data.categories['hoi-dap'], 0);
		assert.equal(counts.data.total, Object.values(counts.data.categories).reduce((x, n) => x + n, 0));
	});

	test('góp ý: loại, xem lại của mình, quản trị trả lời + đổi trạng thái', async () => {
		// Tài khoản mới (giới hạn 5 góp ý / 10 phút tính riêng mỗi tài khoản).
		const acc = store.createAccount('gop_y', 'x')!;
		store.createSession('tokFb', acc, 3600_000);
		const sent = await call<{ id: number }>('POST', '/api/feedback', 'tokFb', { text: 'Map sa mạc hơi tối', kind: 'loi', platform: 'web' });
		await call('POST', '/api/feedback', 'tokFb', { text: 'Loại lạ thì thành khác', kind: 'abc' });
		assert.equal((await call('GET', '/api/feedback/mine', null)).status, 401);
		const mine = await call<MyFeedback[]>('GET', '/api/feedback/mine', 'tokFb');
		assert.deepEqual(mine.data.map((f) => [f.kind, f.status, f.reply]), [['khac', 'moi', null], ['loi', 'moi', null]]);
		assert.equal((await call<MyFeedback[]>('GET', '/api/feedback/mine', 'tokOther')).data.some((f) => f.id === sent.data.id), false, 'không thấy góp ý người khác');
		const put = (tok: string, b: unknown) => call<FeedbackEntry>('PUT', `/api/admin/feedback/${sent.data.id}`, tok, b);
		assert.equal((await put('tokPlayer', { status: 'da-xem' })).status, 403);
		assert.equal((await put('tokAdmin', { status: 'lạ' })).status, 400);
		assert.equal((await put('tokAdmin', {})).status, 400);
		const r = await put('tokAdmin', { reply: 'Cảm ơn bạn, bản sau sẽ sáng hơn' });
		assert.deepEqual([r.data.status, r.data.reply, r.data.repliedBy], ['da-xem', 'Cảm ơn bạn, bản sau sẽ sáng hơn', 'quan_tri'], 'trả lời góp ý mới → tự thành đã xem');
		await put('tokAdmin', { status: 'da-xu-ly' });
		const after = (await call<MyFeedback[]>('GET', '/api/feedback/mine', 'tokFb')).data.find((f) => f.id === sent.data.id)!;
		assert.deepEqual([after.status, after.reply], ['da-xu-ly', 'Cảm ơn bạn, bản sau sẽ sáng hơn']);
		assert.equal((await put('tokAdmin', { reply: '' })).data.reply, null, 'chuỗi rỗng = xoá lời trả lời');
		assert.equal((await call('PUT', '/api/admin/feedback/999999', 'tokAdmin', { status: 'da-xem' })).status, 404);
	});

	test('CSDL cũ (chưa có cột mới) mở lại vẫn chạy: cột tự thêm, dữ liệu cũ giữ nguyên', async () => {
		const { DatabaseSync } = await import('node:sqlite');
		const file = join(dir, 'old.db');
		const old = new DatabaseSync(file);
		old.exec(`CREATE TABLE posts (id INTEGER PRIMARY KEY, account_id INTEGER NOT NULL, author TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL, at INTEGER NOT NULL, hidden INTEGER NOT NULL DEFAULT 0);
			CREATE TABLE feedback (id INTEGER PRIMARY KEY, account_id INTEGER NOT NULL, username TEXT NOT NULL, character_name TEXT, text TEXT NOT NULL, build INTEGER, platform TEXT, at INTEGER NOT NULL);
			INSERT INTO posts (account_id, author, title, body, at) VALUES (1, 'cu', 'Bài cũ', 'x', 1);
			INSERT INTO feedback (account_id, username, text, at) VALUES (1, 'cu', 'Góp ý cũ', 1);`);
		old.close();
		const s2 = new Store(file);
		assert.equal(new Board(s2).posts(null, 10, null)[0]!.category, 'chung');
		assert.deepEqual([s2.feedbackList(5)[0]!.kind, s2.feedbackList(5)[0]!.status], ['khac', 'moi']);
		s2.close();
		new Store(file).close(); // mở lần hai: cột đã có thì bỏ qua, không lỗi
	});

	test('/admin trả trang quản trị', async () => {
		const r = await call<string>('GET', '/admin', null);
		assert.equal(r.status, 200);
		assert.match(r.data, /<title>[^<]*Quản trị/);
	});
} finally {
	test('dọn', () => {
		server.close();
		store.close();
		rmSync(dir, { recursive: true, force: true });
	});
}

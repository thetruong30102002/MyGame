import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { AdminChange, AdminField, AdminLogEntry, BuffKind, FeedbackEntry, FeedbackKind, FeedbackStatus, MyFeedback, BuffView, CharacterInfo, CharacterProgress, Gender } from '@aether/protocol';
import type { Eco } from '@aether/sim/economy';
import { cleanBonusPoints } from '@aether/sim/talents';

/**
 * Lưu trữ bằng SQLite có sẵn trong Node (`node:sqlite`) — không cần cài máy chủ CSDL riêng. Đủ cho vài
 * trăm người chơi; khi lên quy mô thật thì thay lớp này bằng PostgreSQL, các hàm giữ nguyên chữ ký.
 */
export class Store {
	private readonly db: DatabaseSync;

	constructor(path: string) {
		mkdirSync(dirname(path), { recursive: true });
		this.db = new DatabaseSync(path);
		this.db.exec(`
			PRAGMA journal_mode = WAL;
			PRAGMA foreign_keys = ON;
			CREATE TABLE IF NOT EXISTS accounts (
				id INTEGER PRIMARY KEY,
				username TEXT NOT NULL UNIQUE,
				pass_hash TEXT NOT NULL,
				created_at INTEGER NOT NULL
			);
			CREATE TABLE IF NOT EXISTS sessions (
				token TEXT PRIMARY KEY,
				account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
				expires_at INTEGER NOT NULL
			);
			CREATE TABLE IF NOT EXISTS characters (
				id TEXT PRIMARY KEY,
				account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
				name TEXT NOT NULL,
				name_key TEXT NOT NULL UNIQUE,
				gender TEXT NOT NULL,
				progress TEXT NOT NULL,
				created_at INTEGER NOT NULL,
				updated_at INTEGER NOT NULL
			);
			CREATE INDEX IF NOT EXISTS characters_account ON characters(account_id);
			-- Xã hội (docs/ke-hoach-xa-hoi.md). Tình bạn lưu HAI hàng (a→b, b→a) cho truy vấn một chiều đơn giản.
			CREATE TABLE IF NOT EXISTS friends (
				a TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
				b TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
				since INTEGER NOT NULL,
				PRIMARY KEY (a, b)
			);
			CREATE TABLE IF NOT EXISTS friend_requests (
				from_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
				to_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
				at INTEGER NOT NULL,
				PRIMARY KEY (from_id, to_id)
			);
			CREATE INDEX IF NOT EXISTS friend_requests_to ON friend_requests(to_id);
			CREATE TABLE IF NOT EXISTS blocks (
				owner TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
				target TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
				at INTEGER NOT NULL,
				PRIMARY KEY (owner, target)
			);
			-- Chỉ giữ tin nhắn riêng CHỜ GIAO (người nhận offline); giao xong là xoá.
			CREATE TABLE IF NOT EXISTS whispers (
				id INTEGER PRIMARY KEY,
				from_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
				to_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
				text TEXT NOT NULL,
				at INTEGER NOT NULL
			);
			CREATE INDEX IF NOT EXISTS whispers_to ON whispers(to_id);
			-- Số lần được tính công hạ từng loại quái (máy chủ đếm — nền cho thành tựu / NPC phát kim cương).
			CREATE TABLE IF NOT EXISTS kill_counts (
				character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
				monster TEXT NOT NULL,
				n INTEGER NOT NULL,
				PRIMARY KEY (character_id, monster)
			);
			-- Ví kim cương (K1 — docs/ke-hoach-kim-cuong.md): số dư + nhật ký, mọi thay đổi qua \`addDiamonds\` trong MỘT
			-- transaction. \`ref\` duy nhất: cùng một giao dịch (điểm danh một ngày, một thành tựu, sau này một lần nạp) không cộng hai lần.
			CREATE TABLE IF NOT EXISTS wallets (
				character_id TEXT PRIMARY KEY REFERENCES characters(id) ON DELETE CASCADE,
				diamonds INTEGER NOT NULL DEFAULT 0
			);
			CREATE TABLE IF NOT EXISTS diamond_ledger (
				id INTEGER PRIMARY KEY,
				character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
				delta INTEGER NOT NULL,
				balance INTEGER NOT NULL,
				reason TEXT NOT NULL,
				ref TEXT UNIQUE,
				at INTEGER NOT NULL
			);
			CREATE INDEX IF NOT EXISTS diamond_ledger_char ON diamond_ledger(character_id);
			CREATE TABLE IF NOT EXISTS checkins (
				character_id TEXT PRIMARY KEY REFERENCES characters(id) ON DELETE CASCADE,
				last_day TEXT NOT NULL,
				streak INTEGER NOT NULL,
				total INTEGER NOT NULL
			);
			-- Nhật ký kinh tế (M3.3a): mọi thay đổi xu / bình / EXP trừ hạ quái thường (đã đếm ở kill_counts). \`ref\` duy nhất: nhiệm vụ,
			-- boss cốt truyện, quà điểm danh chỉ trao một lần.
			CREATE TABLE IF NOT EXISTS eco_ledger (
				id INTEGER PRIMARY KEY,
				character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
				coins INTEGER NOT NULL,
				potions INTEGER NOT NULL,
				exp INTEGER NOT NULL,
				reason TEXT NOT NULL,
				ref TEXT UNIQUE,
				at INTEGER NOT NULL
			);
			CREATE INDEX IF NOT EXISTS eco_ledger_char ON eco_ledger(character_id);
			-- Mỗi ngày đã điểm danh (khung lịch ở client).
			CREATE TABLE IF NOT EXISTS checkin_days (
				character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
				day TEXT NOT NULL,
				PRIMARY KEY (character_id, day)
			);
			-- Lịch sử ngày điểm danh có từ 08/10/2026 (K1): bù ngày điểm danh gần nhất của bảng cũ, chạy lại không trùng.
			INSERT OR IGNORE INTO checkin_days (character_id, day) SELECT character_id, last_day FROM checkins;
			CREATE TABLE IF NOT EXISTS goals_claimed (
				character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
				goal TEXT NOT NULL,
				at INTEGER NOT NULL,
				PRIMARY KEY (character_id, goal)
			);
			-- Bình thời hạn mua bằng kim cương: mỗi loại một bình, \`remaining_ms\` chỉ trừ lúc người chơi online.
			CREATE TABLE IF NOT EXISTS buffs (
				character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
				kind TEXT NOT NULL,
				mult REAL NOT NULL,
				remaining_ms INTEGER NOT NULL,
				PRIMARY KEY (character_id, kind)
			);
			CREATE TABLE IF NOT EXISTS visited_maps (
				character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
				map TEXT NOT NULL,
				at INTEGER NOT NULL,
				PRIMARY KEY (character_id, map)
			);
			-- Quản trị (trang /admin, 10/10/2026): tài khoản được cộng tiền / điểm cho nhân vật. Cấp bằng lệnh \`src/admin.ts\`, mặc định
			-- KHÔNG ai. API đọc bảng ở mỗi lần gọi → cấp / thu quyền có hiệu lực ngay.
			CREATE TABLE IF NOT EXISTS admins (
				account_id INTEGER PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
				granted_at INTEGER NOT NULL
			);
			-- Nhật ký quản trị: MỖI trường đổi một dòng (trước → sau). Không khoá ngoại: xoá nhân vật / tài khoản thì nhật ký vẫn còn
			-- (giữ sẵn tên để đọc).
			CREATE TABLE IF NOT EXISTS admin_log (
				id INTEGER PRIMARY KEY,
				admin_id INTEGER NOT NULL,
				admin TEXT NOT NULL,
				character_id TEXT NOT NULL,
				character_name TEXT NOT NULL,
				field TEXT NOT NULL,
				from_value INTEGER NOT NULL,
				to_value INTEGER NOT NULL,
				reason TEXT NOT NULL,
				at INTEGER NOT NULL
			);
			CREATE INDEX IF NOT EXISTS admin_log_char ON admin_log(character_id);
			-- Góp ý bản beta (Cài đặt → Góp ý, 11/10/2026). Giữ sẵn tên để đọc dù tài khoản / nhân vật bị xoá.
			CREATE TABLE IF NOT EXISTS feedback (
				id INTEGER PRIMARY KEY,
				account_id INTEGER NOT NULL,
				username TEXT NOT NULL,
				character_name TEXT,
				text TEXT NOT NULL,
				build INTEGER,
				platform TEXT,
				at INTEGER NOT NULL
			);
			-- Trang chủ (14/10/2026): tin tức do quản trị đăng (thay cho sửa tay site/news.json — lần đầu chạy nạp từ file đó, xem
			-- main.ts). \`body\`: mảng JSON các dòng.
			CREATE TABLE IF NOT EXISTS news (
				id INTEGER PRIMARY KEY,
				tag TEXT NOT NULL,
				title TEXT NOT NULL,
				body TEXT NOT NULL,
				author TEXT NOT NULL,
				at INTEGER NOT NULL
			);
			-- Bài viết cộng đồng + bình luận (người chơi đăng trên trang chủ). Xoá = ẩn (\`hidden\`), giữ lại để quản trị tra khi cần.
			-- Giữ sẵn tên hiện (\`author\`) như lúc đăng.
			CREATE TABLE IF NOT EXISTS posts (
				id INTEGER PRIMARY KEY,
				account_id INTEGER NOT NULL,
				author TEXT NOT NULL,
				title TEXT NOT NULL,
				body TEXT NOT NULL,
				at INTEGER NOT NULL,
				hidden INTEGER NOT NULL DEFAULT 0
			);
			CREATE TABLE IF NOT EXISTS post_comments (
				id INTEGER PRIMARY KEY,
				post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
				account_id INTEGER NOT NULL,
				author TEXT NOT NULL,
				body TEXT NOT NULL,
				at INTEGER NOT NULL,
				hidden INTEGER NOT NULL DEFAULT 0
			);
			CREATE INDEX IF NOT EXISTS post_comments_post ON post_comments(post_id);
		`);
		// Cột thêm sau (14/10/2026, trang web chia nhiều trang): chuyên mục diễn đàn; loại / trạng thái / lời trả lời của góp ý.
		this.addColumn('posts', 'category', "TEXT NOT NULL DEFAULT 'chung'");
		this.addColumn('feedback', 'kind', "TEXT NOT NULL DEFAULT 'khac'");
		this.addColumn('feedback', 'status', "TEXT NOT NULL DEFAULT 'moi'");
		this.addColumn('feedback', 'reply', 'TEXT');
		this.addColumn('feedback', 'reply_at', 'INTEGER');
		this.addColumn('feedback', 'replied_by', 'TEXT');
		this.db.exec('CREATE INDEX IF NOT EXISTS feedback_account ON feedback(account_id)');
	}

	/** Thêm cột vào bảng đã có (CSDL cũ) — có rồi thì bỏ qua. */
	private addColumn(table: string, column: string, def: string): void {
		const cols = this.db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
		if (!cols.some((c) => c.name === column)) this.db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${def}`);
	}

	close(): void {
		this.db.close();
	}

	createAccount(username: string, passHash: string): number | null {
		try {
			const r = this.db.prepare('INSERT INTO accounts (username, pass_hash, created_at) VALUES (?, ?, ?)').run(username, passHash, Date.now());
			return Number(r.lastInsertRowid);
		} catch {
			return null;
		}
	}

	/** Đổi mật khẩu và đăng xuất mọi phiên cũ của tài khoản. Trả false nếu không có tài khoản đó. */
	setPassword(username: string, passHash: string): boolean {
		const acc = this.account(username);
		if (!acc) return false;
		this.db.prepare('UPDATE accounts SET pass_hash = ? WHERE id = ?').run(passHash, acc.id);
		this.db.prepare('DELETE FROM sessions WHERE account_id = ?').run(acc.id);
		return true;
	}

	account(username: string): { id: number; passHash: string } | null {
		const row = this.db.prepare('SELECT id, pass_hash FROM accounts WHERE username = ?').get(username) as { id: number; pass_hash: string } | undefined;
		return row ? { id: row.id, passHash: row.pass_hash } : null;
	}

	createSession(token: string, accountId: number, ttlMs: number): void {
		this.db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());
		this.db.prepare('INSERT INTO sessions (token, account_id, expires_at) VALUES (?, ?, ?)').run(token, accountId, Date.now() + ttlMs);
	}

	sessionAccount(token: string): { accountId: number; username: string } | null {
		const row = this.db
			.prepare('SELECT a.id, a.username FROM sessions s JOIN accounts a ON a.id = s.account_id WHERE s.token = ? AND s.expires_at > ?')
			.get(token, Date.now()) as { id: number; username: string } | undefined;
		return row ? { accountId: row.id, username: row.username } : null;
	}

	deleteSession(token: string): void {
		this.db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
	}

	characters(accountId: number): CharacterInfo[] {
		const rows = this.db.prepare('SELECT * FROM characters WHERE account_id = ? ORDER BY created_at').all(accountId) as unknown as CharacterRow[];
		return rows.map(toInfo);
	}

	character(id: string, accountId: number): CharacterInfo | null {
		const row = this.db.prepare('SELECT * FROM characters WHERE id = ? AND account_id = ?').get(id, accountId) as unknown as CharacterRow | undefined;
		return row ? toInfo(row) : null;
	}

	/** Trả null khi tên đã có người dùng (so không phân biệt hoa thường). */
	createCharacter(id: string, accountId: number, name: string, gender: Gender, progress: CharacterProgress): CharacterInfo | null {
		const now = Date.now();
		try {
			this.db
				.prepare('INSERT INTO characters (id, account_id, name, name_key, gender, progress, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
				.run(id, accountId, name, nameKey(name), gender, JSON.stringify(progress), now, now);
		} catch {
			return null;
		}
		return this.character(id, accountId);
	}

	deleteCharacter(id: string, accountId: number): boolean {
		return Number(this.db.prepare('DELETE FROM characters WHERE id = ? AND account_id = ?').run(id, accountId).changes) > 0;
	}

	/**
	 * Lưu tiến độ client gửi (vị trí, map, truyện…) — GIỮ NGUYÊN cấp / EXP / xu / bình đang có trong CSDL (M3.3a: máy chủ là nguồn sự
	 * thật, ghi qua `saveEco`). Bản ghi cũ thiếu trường nào thì lấy số client gửi (chỉ lần đầu). Điểm tiềm năng thưởng (`bonusPoints` —
	 * trang quản trị) cũng giữ nguyên, và KHÔNG BAO GIỜ lấy số client gửi: chưa có thì 0.
	 */
	saveProgress(id: string, progress: CharacterProgress): void {
		const row = this.db.prepare(`SELECT json_extract(progress, '$.story') AS story FROM characters WHERE id = ?`).get(id) as { story: string | null } | undefined;
		const next = keepNewerTalents(row?.story ? (JSON.parse(row.story) as unknown) : null, progress);
		const keep = [
			...['level', 'exp', 'coins', 'potions'].map((k) => `'$.${k}', coalesce(json_extract(progress, '$.${k}'), json_extract(?1, '$.${k}'))`),
			`'$.bonusPoints', coalesce(json_extract(progress, '$.bonusPoints'), 0)`,
		].join(', ');
		this.db.prepare(`UPDATE characters SET progress = json_set(?1, ${keep}), updated_at = ?2 WHERE id = ?3`).run(JSON.stringify(next), Date.now(), id);
	}

	/** Điểm tiềm năng thưởng đang lưu (0 nếu chưa có / không có nhân vật). */
	bonusPoints(id: string): number {
		const row = this.db.prepare(`SELECT json_extract(progress, '$.bonusPoints') AS b FROM characters WHERE id = ?`).get(id) as { b: unknown } | undefined;
		return cleanBonusPoints(row?.b);
	}

	/** Cấp / EXP / xu / bình đang lưu (null = không có nhân vật). */
	ecoOf(id: string): Eco | null {
		const row = this.db
			.prepare(`SELECT json_extract(progress, '$.level') AS level, json_extract(progress, '$.exp') AS exp, json_extract(progress, '$.coins') AS coins, json_extract(progress, '$.potions') AS potions FROM characters WHERE id = ?`)
			.get(id) as Eco | undefined;
		return row ? { level: row.level, exp: row.exp, coins: row.coins, potions: row.potions } : null;
	}

	/**
	 * Ghi cấp / EXP / xu / bình (một transaction) + một dòng nhật ký nếu có `log`. Trả false = `log.ref` đã dùng (nhiệm vụ / boss / quà
	 * đã trao) — không đổi gì.
	 */
	saveEco(id: string, e: Eco, log: EcoLog | null): boolean {
		let ok = false;
		this.tx(() => {
			if (log?.ref && this.db.prepare('SELECT 1 FROM eco_ledger WHERE ref = ?').get(log.ref)) return;
			this.writeEco(id, e, log);
			ok = true;
		});
		return ok;
	}

	/** Phần ghi của `saveEco` (gọi TRONG transaction) — trang quản trị dùng chung câu ghi + nhật ký (`adminGrant`). */
	private writeEco(id: string, e: Eco, log: EcoLog | null): void {
		this.db
			.prepare(`UPDATE characters SET progress = json_set(progress, '$.level', ?, '$.exp', ?, '$.coins', ?, '$.potions', ?), updated_at = ? WHERE id = ?`)
			.run(e.level, e.exp, e.coins, e.potions, Date.now(), id);
		if (log) this.db.prepare('INSERT INTO eco_ledger (character_id, coins, potions, exp, reason, ref, at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(id, log.coins, log.potions, log.exp, log.reason, log.ref, Date.now());
	}

	/** Nhật ký kinh tế gần nhất trước (quản trị / test). */
	ecoLedger(id: string, limit = 20): { coins: number; potions: number; exp: number; reason: string; ref: string | null }[] {
		return this.db.prepare('SELECT coins, potions, exp, reason, ref FROM eco_ledger WHERE character_id = ? ORDER BY id DESC LIMIT ?').all(id, limit) as {
			coins: number;
			potions: number;
			exp: number;
			reason: string;
			ref: string | null;
		}[];
	}

	// ———— Quản trị (trang /admin) ————

	isAdmin(accountId: number): boolean {
		return !!this.db.prepare('SELECT 1 FROM admins WHERE account_id = ?').get(accountId);
	}

	/** Cấp / thu quyền quản trị theo tên tài khoản. null = không có tài khoản đó; false = đã ở đúng trạng thái đó từ trước. */
	setAdmin(username: string, on: boolean): boolean | null {
		const acc = this.account(username);
		if (!acc) return null;
		const r = on
			? this.db.prepare('INSERT OR IGNORE INTO admins (account_id, granted_at) VALUES (?, ?)').run(acc.id, Date.now())
			: this.db.prepare('DELETE FROM admins WHERE account_id = ?').run(acc.id);
		return Number(r.changes) > 0;
	}

	/** Các tài khoản quản trị (cấp trước đứng trước). */
	admins(): { username: string; grantedAt: number }[] {
		const rows = this.db.prepare('SELECT a.username, m.granted_at FROM admins m JOIN accounts a ON a.id = m.account_id ORDER BY m.granted_at').all() as { username: string; granted_at: number }[];
		return rows.map((r) => ({ username: r.username, grantedAt: r.granted_at }));
	}

	/**
	 * Tìm nhân vật cho trang quản trị: tên nhân vật HOẶC tên tài khoản chứa `q` (không phân biệt hoa thường — như kiểm trùng tên); `q`
	 * rỗng = các nhân vật lưu gần nhất. Số kinh tế là số THÔ trong CSDL (người gọi kẹp, hoặc lấy bộ nhớ nếu nhân vật đang online).
	 */
	adminSearch(q: string, limit: number): AdminRow[] {
		const like = `%${nameKey(q.trim()).replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
		const rows = this.db.prepare(`${ADMIN_ROW_SQL} WHERE c.name_key LIKE ?1 ESCAPE '\\' OR a.username LIKE ?1 ESCAPE '\\' ORDER BY c.updated_at DESC LIMIT ?2`).all(like, limit);
		return (rows as unknown as AdminRow[]).map(toAdminRow);
	}

	/** Một nhân vật cho trang quản trị (null = không có). */
	adminRow(id: string): AdminRow | null {
		const row = this.db.prepare(`${ADMIN_ROW_SQL} WHERE c.id = ?`).get(id) as unknown as AdminRow | undefined;
		return row ? toAdminRow(row) : null;
	}

	/**
	 * Quản trị cộng / trừ — MỘT transaction: cấp / EXP / xu / bình (số mới do `Economy` tính — nhân vật đang online thì từ bộ nhớ của nó)
	 * ghi bằng đúng câu ghi + nhật ký `eco_ledger` của `saveEco`; kim cương qua ví (`diamond_ledger`, trừ quá số dư thì kẹp về 0); điểm
	 * tiềm năng thưởng (`progress.bonusPoints`, kẹp 0…`TALENT_BONUS_CAP`); MỖI trường đổi một dòng `admin_log`. Lý do ở hai sổ kinh tế:
	 * `admin:<tài khoản quản trị>:<lý do>`. Trả các trường đã đổi (trước → sau) — rỗng nếu không có gì đổi / không có nhân vật.
	 */
	adminGrant(id: string, g: AdminGrantWrite): AdminChange[] {
		const changes: AdminChange[] = [];
		const why = `admin:${g.admin.username}:${g.reason}`;
		this.tx(() => {
			const row = this.db.prepare('SELECT name FROM characters WHERE id = ?').get(id) as { name: string } | undefined;
			if (!row) return;
			if (g.eco) {
				const { before: b, after: a } = g.eco;
				const fields = (['level', 'exp', 'coins', 'potions'] as const).filter((k) => a[k] !== b[k]);
				if (fields.length) {
					this.writeEco(id, a, { reason: why, coins: a.coins - b.coins, potions: a.potions - b.potions, exp: g.eco.exp, ref: null });
					for (const k of fields) changes.push({ field: k, from: b[k], to: a[k] });
				}
			}
			if (g.diamonds) {
				const cur = this.diamonds(id);
				const delta = Math.max(Math.trunc(g.diamonds), -cur);
				if (delta) changes.push({ field: 'diamonds', from: cur, to: this.applyDiamonds(id, delta, why, null)! });
			}
			if (g.bonusPoints) {
				const cur = this.bonusPoints(id);
				const next = cleanBonusPoints(cur + Math.trunc(g.bonusPoints));
				if (next !== cur) {
					this.db.prepare(`UPDATE characters SET progress = json_set(progress, '$.bonusPoints', ?), updated_at = ? WHERE id = ?`).run(next, Date.now(), id);
					changes.push({ field: 'bonusPoints', from: cur, to: next });
				}
			}
			const at = Date.now();
			const log = this.db.prepare('INSERT INTO admin_log (admin_id, admin, character_id, character_name, field, from_value, to_value, reason, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
			for (const c of changes) log.run(g.admin.id, g.admin.username, id, row.name, c.field, c.from, c.to, g.reason, at);
		});
		return changes;
	}

	/** Nhật ký quản trị, mới nhất trước (`characterId`: chỉ một nhân vật). */
	adminLog(limit: number, characterId?: string): AdminLogEntry[] {
		const rows = (
			characterId
				? this.db.prepare('SELECT * FROM admin_log WHERE character_id = ? ORDER BY id DESC LIMIT ?').all(characterId, limit)
				: this.db.prepare('SELECT * FROM admin_log ORDER BY id DESC LIMIT ?').all(limit)
		) as unknown as AdminLogRow[];
		return rows.map((r) => ({ id: r.id, at: r.at, admin: r.admin, characterId: r.character_id, characterName: r.character_name, field: r.field as AdminField, from: r.from_value, to: r.to_value, reason: r.reason }));
	}

	// ———— Góp ý ————

	addFeedback(accountId: number, username: string, characterName: string | null, text: string, build: number | null, platform: string | null, kind: FeedbackKind = 'khac'): number {
		return Number(
			this.db
				.prepare('INSERT INTO feedback (account_id, username, character_name, text, build, platform, kind, at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
				.run(accountId, username, characterName, text, build, platform, kind, Date.now()).lastInsertRowid,
		);
	}

	/** Góp ý mới nhất trước. */
	feedbackList(limit: number): FeedbackEntry[] {
		const rows = this.db.prepare('SELECT * FROM feedback ORDER BY id DESC LIMIT ?').all(limit) as unknown as FeedbackRow[];
		return rows.map(toFeedback);
	}

	feedback(id: number): FeedbackEntry | null {
		const r = this.db.prepare('SELECT * FROM feedback WHERE id = ?').get(id) as unknown as FeedbackRow | undefined;
		return r ? toFeedback(r) : null;
	}

	/** Góp ý của một tài khoản, mới nhất trước. */
	myFeedback(accountId: number, limit: number): MyFeedback[] {
		const rows = this.db.prepare('SELECT * FROM feedback WHERE account_id = ? ORDER BY id DESC LIMIT ?').all(accountId, limit) as unknown as FeedbackRow[];
		return rows.map((r) => ({ id: r.id, at: r.at, kind: r.kind, text: r.text, status: r.status, reply: r.reply, replyAt: r.reply_at }));
	}

	/** Quản trị đổi trạng thái / trả lời (`reply` null = giữ nguyên, '' = xoá lời trả lời). Trả false nếu không có góp ý đó. */
	updateFeedback(id: number, status: FeedbackStatus | null, reply: string | null, by: string): boolean {
		if (!this.db.prepare('SELECT id FROM feedback WHERE id = ?').get(id)) return false;
		if (status) this.db.prepare('UPDATE feedback SET status = ? WHERE id = ?').run(status, id);
		if (reply !== null) {
			if (reply) this.db.prepare('UPDATE feedback SET reply = ?, reply_at = ?, replied_by = ? WHERE id = ?').run(reply, Date.now(), by, id);
			else this.db.prepare('UPDATE feedback SET reply = NULL, reply_at = NULL, replied_by = NULL WHERE id = ?').run(id);
		}
		return true;
	}

	// ———— Tin tức trang chủ ————

	newsCount(): number {
		return Number((this.db.prepare('SELECT count(*) AS n FROM news').get() as { n: number }).n);
	}

	/** Tin mới nhất trước (theo `at`, cùng lúc thì tin thêm sau trước). */
	newsList(limit: number): NewsRow[] {
		return this.db.prepare('SELECT * FROM news ORDER BY at DESC, id DESC LIMIT ?').all(limit) as unknown as NewsRow[];
	}

	news(id: number): NewsRow | null {
		return (this.db.prepare('SELECT * FROM news WHERE id = ?').get(id) as unknown as NewsRow | undefined) ?? null;
	}

	addNews(tag: string, title: string, body: string[], author: string, at: number = Date.now()): number {
		return Number(this.db.prepare('INSERT INTO news (tag, title, body, author, at) VALUES (?, ?, ?, ?, ?)').run(tag, title, JSON.stringify(body), author, at).lastInsertRowid);
	}

	/** Sửa chữ + nhãn, giữ ngày đăng. Trả false nếu không có tin đó. */
	updateNews(id: number, tag: string, title: string, body: string[]): boolean {
		return Number(this.db.prepare('UPDATE news SET tag = ?, title = ?, body = ? WHERE id = ?').run(tag, title, JSON.stringify(body), id).changes) > 0;
	}

	deleteNews(id: number): boolean {
		return Number(this.db.prepare('DELETE FROM news WHERE id = ?').run(id).changes) > 0;
	}

	// ———— Bài viết cộng đồng ————

	/**
	 * Bài chưa ẩn, mới nhất trước; `before` = id bài cuối trang trước (phân trang), `category` lọc chuyên mục, `q` tìm trong tiêu đề /
	 * nội dung / tên người đăng (chứa chuỗi, không phân biệt hoa thường với chữ không dấu). Kèm số bình luận chưa ẩn.
	 */
	posts(limit: number, before: number | null, category: string | null = null, q = ''): PostRow[] {
		const like = '%' + q.replace(/[!%_]/g, (c) => '!' + c) + '%';
		return this.db
			.prepare(
				`SELECT p.*, (SELECT count(*) FROM post_comments c WHERE c.post_id = p.id AND c.hidden = 0) AS comments
				 FROM posts p WHERE p.hidden = 0 AND p.id < ? AND (? IS NULL OR p.category = ?)
				 AND (? = '' OR p.title LIKE ? ESCAPE '!' OR p.body LIKE ? ESCAPE '!' OR p.author LIKE ? ESCAPE '!')
				 ORDER BY p.id DESC LIMIT ?`,
			)
			.all(before ?? Number.MAX_SAFE_INTEGER, category, category, q, like, like, like, limit) as unknown as PostRow[];
	}

	/** Số bài chưa ẩn theo chuyên mục. */
	postCounts(): Record<string, number> {
		const rows = this.db.prepare('SELECT category, count(*) AS n FROM posts WHERE hidden = 0 GROUP BY category').all() as { category: string; n: number }[];
		return Object.fromEntries(rows.map((r) => [r.category, Number(r.n)]));
	}

	post(id: number): PostRow | null {
		return (
			(this.db
				.prepare('SELECT p.*, (SELECT count(*) FROM post_comments c WHERE c.post_id = p.id AND c.hidden = 0) AS comments FROM posts p WHERE p.id = ? AND p.hidden = 0')
				.get(id) as unknown as PostRow | undefined) ?? null
		);
	}

	addPost(accountId: number, author: string, title: string, body: string, category: string = 'chung'): number {
		return Number(
			this.db.prepare('INSERT INTO posts (account_id, author, title, body, category, at) VALUES (?, ?, ?, ?, ?, ?)').run(accountId, author, title, body, category, Date.now()).lastInsertRowid,
		);
	}

	hidePost(id: number): boolean {
		return Number(this.db.prepare('UPDATE posts SET hidden = 1 WHERE id = ? AND hidden = 0').run(id).changes) > 0;
	}

	comments(postId: number): CommentRow[] {
		return this.db.prepare('SELECT * FROM post_comments WHERE post_id = ? AND hidden = 0 ORDER BY id').all(postId) as unknown as CommentRow[];
	}

	comment(id: number): CommentRow | null {
		return (this.db.prepare('SELECT * FROM post_comments WHERE id = ? AND hidden = 0').get(id) as unknown as CommentRow | undefined) ?? null;
	}

	addComment(postId: number, accountId: number, author: string, body: string): number {
		return Number(this.db.prepare('INSERT INTO post_comments (post_id, account_id, author, body, at) VALUES (?, ?, ?, ?, ?)').run(postId, accountId, author, body, Date.now()).lastInsertRowid);
	}

	hideComment(id: number): boolean {
		return Number(this.db.prepare('UPDATE post_comments SET hidden = 1 WHERE id = ? AND hidden = 0').run(id).changes) > 0;
	}

	// ———— Xã hội ————

	/** Tên + cấp của một nhân vật (không cần biết tài khoản) — null nếu không có. */
	brief(id: string): CharacterBrief | null {
		const row = this.db.prepare(`SELECT id, name, json_extract(progress, '$.level') AS level FROM characters WHERE id = ?`).get(id) as BriefRow | undefined;
		return row ? toBrief(row) : null;
	}

	/** Tìm nhân vật theo tên (không phân biệt hoa thường, như lúc kiểm trùng tên). */
	briefByName(name: string): CharacterBrief | null {
		const row = this.db.prepare(`SELECT id, name, json_extract(progress, '$.level') AS level FROM characters WHERE name_key = ?`).get(nameKey(name.trim())) as BriefRow | undefined;
		return row ? toBrief(row) : null;
	}

	friendIds(id: string): string[] {
		return (this.db.prepare('SELECT b FROM friends WHERE a = ? ORDER BY since').all(id) as { b: string }[]).map((r) => r.b);
	}

	areFriends(a: string, b: string): boolean {
		return !!this.db.prepare('SELECT 1 FROM friends WHERE a = ? AND b = ?').get(a, b);
	}

	/** Kết bạn: thêm hai chiều + xoá mọi lời mời giữa hai người (một transaction). */
	addFriendship(a: string, b: string): void {
		const now = Date.now();
		this.tx(() => {
			this.db.prepare('INSERT OR IGNORE INTO friends (a, b, since) VALUES (?, ?, ?), (?, ?, ?)').run(a, b, now, b, a, now);
			this.clearRequests(a, b);
		});
	}

	/** Huỷ bạn + mọi lời mời giữa hai người. Trả true nếu đã là bạn. */
	removeFriendship(a: string, b: string): boolean {
		let was = false;
		this.tx(() => {
			was = Number(this.db.prepare('DELETE FROM friends WHERE (a = ? AND b = ?) OR (a = ? AND b = ?)').run(a, b, b, a).changes) > 0;
			this.clearRequests(a, b);
		});
		return was;
	}

	/** Lời mời còn hạn: gửi TỚI `id` (`dir = 'in'`) hoặc `id` đã gửi đi (`'out'`). Lời mời quá hạn bị xoá luôn. */
	requests(id: string, dir: 'in' | 'out', ttl: number): string[] {
		this.db.prepare('DELETE FROM friend_requests WHERE at < ?').run(Date.now() - ttl);
		const sql = dir === 'in' ? 'SELECT from_id AS other FROM friend_requests WHERE to_id = ? ORDER BY at' : 'SELECT to_id AS other FROM friend_requests WHERE from_id = ? ORDER BY at';
		return (this.db.prepare(sql).all(id) as { other: string }[]).map((r) => r.other);
	}

	hasRequest(from: string, to: string): boolean {
		return !!this.db.prepare('SELECT 1 FROM friend_requests WHERE from_id = ? AND to_id = ?').get(from, to);
	}

	addRequest(from: string, to: string): void {
		this.db.prepare('INSERT OR REPLACE INTO friend_requests (from_id, to_id, at) VALUES (?, ?, ?)').run(from, to, Date.now());
	}

	deleteRequest(from: string, to: string): boolean {
		return Number(this.db.prepare('DELETE FROM friend_requests WHERE from_id = ? AND to_id = ?').run(from, to).changes) > 0;
	}

	blockedIds(owner: string): string[] {
		return (this.db.prepare('SELECT target FROM blocks WHERE owner = ? ORDER BY at').all(owner) as { target: string }[]).map((r) => r.target);
	}

	isBlocked(owner: string, target: string): boolean {
		return !!this.db.prepare('SELECT 1 FROM blocks WHERE owner = ? AND target = ?').get(owner, target);
	}

	/** Chặn thì xoá luôn tình bạn + lời mời hai chiều. */
	setBlock(owner: string, target: string, on: boolean): void {
		if (!on) return void this.db.prepare('DELETE FROM blocks WHERE owner = ? AND target = ?').run(owner, target);
		this.tx(() => {
			this.db.prepare('INSERT OR IGNORE INTO blocks (owner, target, at) VALUES (?, ?, ?)').run(owner, target, Date.now());
			this.db.prepare('DELETE FROM friends WHERE (a = ? AND b = ?) OR (a = ? AND b = ?)').run(owner, target, target, owner);
			this.clearRequests(owner, target);
		});
	}

	/** Cất tin nhắn riêng chờ giao; giữ tối đa `keep` tin mới nhất cho mỗi cặp người gửi → người nhận. */
	queueWhisper(from: string, to: string, text: string, at: number, keep: number): void {
		this.tx(() => {
			this.db.prepare('INSERT INTO whispers (from_id, to_id, text, at) VALUES (?, ?, ?, ?)').run(from, to, text, at);
			this.db
				.prepare('DELETE FROM whispers WHERE from_id = ? AND to_id = ? AND id NOT IN (SELECT id FROM whispers WHERE from_id = ? AND to_id = ? ORDER BY id DESC LIMIT ?)')
				.run(from, to, from, to, keep);
		});
	}

	/** Lấy hết tin chờ giao của `to` (còn hạn `ttl`, cũ trước) rồi xoá khỏi hàng chờ. */
	takeWhispers(to: string, ttl: number): { from: string; text: string; at: number }[] {
		let rows: { from_id: string; text: string; at: number }[] = [];
		this.tx(() => {
			this.db.prepare('DELETE FROM whispers WHERE at < ?').run(Date.now() - ttl);
			rows = this.db.prepare('SELECT from_id, text, at FROM whispers WHERE to_id = ? ORDER BY id').all(to) as typeof rows;
			this.db.prepare('DELETE FROM whispers WHERE to_id = ?').run(to);
		});
		return rows.map((r) => ({ from: r.from_id, text: r.text, at: r.at }));
	}

	addKill(characterId: string, monster: string): void {
		this.db.prepare('INSERT INTO kill_counts (character_id, monster, n) VALUES (?, ?, 1) ON CONFLICT(character_id, monster) DO UPDATE SET n = n + 1').run(characterId, monster);
	}

	killCounts(characterId: string): Record<string, number> {
		const rows = this.db.prepare('SELECT monster, n FROM kill_counts WHERE character_id = ?').all(characterId) as { monster: string; n: number }[];
		return Object.fromEntries(rows.map((r) => [r.monster, r.n]));
	}

	diamonds(characterId: string): number {
		const row = this.db.prepare('SELECT diamonds FROM wallets WHERE character_id = ?').get(characterId) as { diamonds: number } | undefined;
		return row?.diamonds ?? 0;
	}

	/**
	 * Cộng / trừ kim cương + ghi nhật ký trong MỘT transaction. Trả số dư mới; null = trừ quá số dư, hoặc `ref` đã dùng (giao
	 * dịch lặp — vd webhook nạp gửi hai lần).
	 */
	addDiamonds(characterId: string, delta: number, reason: string, ref: string | null = null): number | null {
		let out: number | null = null;
		this.tx(() => {
			out = this.applyDiamonds(characterId, delta, reason, ref);
		});
		return out;
	}

	/** Nhật ký kim cương gần nhất trước. */
	diamondLedger(characterId: string, limit = 20): { delta: number; balance: number; reason: string; at: number }[] {
		return this.db.prepare('SELECT delta, balance, reason, at FROM diamond_ledger WHERE character_id = ? ORDER BY id DESC LIMIT ?').all(characterId, limit) as {
			delta: number;
			balance: number;
			reason: string;
			at: number;
		}[];
	}

	checkinState(characterId: string): { lastDay: string | null; streak: number; total: number } {
		const row = this.db.prepare('SELECT last_day, streak, total FROM checkins WHERE character_id = ?').get(characterId) as { last_day: string; streak: number; total: number } | undefined;
		return row ? { lastDay: row.last_day, streak: row.streak, total: row.total } : { lastDay: null, streak: 0, total: 0 };
	}

	/** Điểm danh ngày `day` (chuỗi mới `streak`) + cộng kim cương — một transaction. Trả số dư mới; null = ngày đó đã điểm danh. */
	checkin(characterId: string, day: string, streak: number, diamonds: number): number | null {
		let out: number | null = null;
		this.tx(() => {
			const cur = this.checkinState(characterId);
			if (cur.lastDay === day) return;
			this.db
				.prepare('INSERT INTO checkins (character_id, last_day, streak, total) VALUES (?, ?, ?, 1) ON CONFLICT(character_id) DO UPDATE SET last_day = excluded.last_day, streak = excluded.streak, total = total + 1')
				.run(characterId, day, streak);
			this.db.prepare('INSERT OR IGNORE INTO checkin_days (character_id, day) VALUES (?, ?)').run(characterId, day);
			out = this.applyDiamonds(characterId, diamonds, 'checkin', `checkin:${characterId}:${day}`);
		});
		return out;
	}

	/** Các ngày đã điểm danh trong tháng `month` (`YYYY-MM`), tăng dần. */
	checkinDays(characterId: string, month: string): string[] {
		return (this.db.prepare("SELECT day FROM checkin_days WHERE character_id = ? AND substr(day, 1, 7) = ? ORDER BY day").all(characterId, month) as { day: string }[]).map((r) => r.day);
	}

	claimedGoals(characterId: string): string[] {
		return (this.db.prepare('SELECT goal FROM goals_claimed WHERE character_id = ?').all(characterId) as { goal: string }[]).map((r) => r.goal);
	}

	/** Nhận quà thành tựu `goal` + cộng kim cương — một transaction. Trả số dư mới; null = đã nhận rồi. */
	claimGoal(characterId: string, goal: string, diamonds: number): number | null {
		let out: number | null = null;
		this.tx(() => {
			if (this.db.prepare('SELECT 1 FROM goals_claimed WHERE character_id = ? AND goal = ?').get(characterId, goal)) return;
			this.db.prepare('INSERT INTO goals_claimed (character_id, goal, at) VALUES (?, ?, ?)').run(characterId, goal, Date.now());
			out = this.applyDiamonds(characterId, diamonds, `goal:${goal}`, `goal:${characterId}:${goal}`);
		});
		return out;
	}

	visit(characterId: string, map: string): void {
		this.db.prepare('INSERT OR IGNORE INTO visited_maps (character_id, map, at) VALUES (?, ?, ?)').run(characterId, map, Date.now());
	}

	/** Các map đã đặt chân tới (`vùng/map`). */
	visitedMaps(characterId: string): string[] {
		return (this.db.prepare('SELECT map FROM visited_maps WHERE character_id = ? ORDER BY at').all(characterId) as { map: string }[]).map((r) => r.map);
	}

	visitedCount(characterId: string): number {
		return (this.db.prepare('SELECT COUNT(*) AS n FROM visited_maps WHERE character_id = ?').get(characterId) as { n: number }).n;
	}

	buffs(characterId: string): BuffView[] {
		const rows = this.db.prepare('SELECT kind, mult, remaining_ms FROM buffs WHERE character_id = ? AND remaining_ms > 0 ORDER BY kind').all(characterId) as { kind: BuffKind; mult: number; remaining_ms: number }[];
		return rows.map((r) => ({ kind: r.kind, mult: r.mult, remaining: Math.ceil(r.remaining_ms / 1000) }));
	}

	/**
	 * Mua bình (một transaction): bình cùng loại MẠNH hơn đang chạy → 'weaker' (không trừ gì); thiếu kim cương → 'poor'; cùng mức
	 * thì cộng thời gian (trần `maxMs`), mạnh hơn thì thay hẳn. `power`: độ mạnh để so (`@aether/sim/shop` `buffPower`).
	 */
	buyBuff(
		characterId: string,
		item: { id: string; price: number; kind: BuffKind; mult: number; ms: number },
		power: (mult: number) => number,
		maxMs: number,
	): { balance: number } | 'weaker' | 'poor' {
		let out: { balance: number } | 'weaker' | 'poor' = 'poor';
		this.tx(() => {
			const cur = this.db.prepare('SELECT mult, remaining_ms FROM buffs WHERE character_id = ? AND kind = ? AND remaining_ms > 0').get(characterId, item.kind) as { mult: number; remaining_ms: number } | undefined;
			if (cur && power(cur.mult) > power(item.mult)) return void (out = 'weaker');
			const balance = this.applyDiamonds(characterId, -item.price, `shop:${item.id}`, null);
			if (balance === null) return void (out = 'poor');
			const ms = cur && power(cur.mult) === power(item.mult) ? Math.min(maxMs, cur.remaining_ms + item.ms) : item.ms;
			this.db
				.prepare('INSERT INTO buffs (character_id, kind, mult, remaining_ms) VALUES (?, ?, ?, ?) ON CONFLICT(character_id, kind) DO UPDATE SET mult = excluded.mult, remaining_ms = excluded.remaining_ms')
				.run(characterId, item.kind, item.mult, ms);
			out = { balance };
		});
		return out;
	}

	/** Trừ `ms` giờ chơi khỏi mọi bình của nhân vật; trả số bình vừa hết (đã xoá). */
	spendBuffs(characterId: string, ms: number): number {
		let expired = 0;
		this.tx(() => {
			this.db.prepare('UPDATE buffs SET remaining_ms = remaining_ms - ? WHERE character_id = ?').run(Math.max(0, Math.round(ms)), characterId);
			expired = Number(this.db.prepare('DELETE FROM buffs WHERE character_id = ? AND remaining_ms <= 0').run(characterId).changes);
		});
		return expired;
	}

	private applyDiamonds(characterId: string, delta: number, reason: string, ref: string | null): number | null {
		if (ref && this.db.prepare('SELECT 1 FROM diamond_ledger WHERE ref = ?').get(ref)) return null;
		const next = this.diamonds(characterId) + Math.trunc(delta);
		if (next < 0) return null;
		this.db.prepare('INSERT INTO wallets (character_id, diamonds) VALUES (?, ?) ON CONFLICT(character_id) DO UPDATE SET diamonds = excluded.diamonds').run(characterId, next);
		this.db.prepare('INSERT INTO diamond_ledger (character_id, delta, balance, reason, ref, at) VALUES (?, ?, ?, ?, ?, ?)').run(characterId, Math.trunc(delta), next, reason, ref, Date.now());
		return next;
	}

	private clearRequests(a: string, b: string): void {
		this.db.prepare('DELETE FROM friend_requests WHERE (from_id = ? AND to_id = ?) OR (from_id = ? AND to_id = ?)').run(a, b, b, a);
	}

	private tx(fn: () => void): void {
		this.db.exec('BEGIN');
		try {
			fn();
			this.db.exec('COMMIT');
		} catch (e) {
			this.db.exec('ROLLBACK');
			throw e;
		}
	}
}

/** Một dòng nhật ký kinh tế (`eco_ledger`) đi kèm lần ghi cấp / EXP / xu / bình. */
type EcoLog = { reason: string; coins: number; potions: number; exp: number; ref: string | null };

/** Việc ghi của một lần quản trị cộng / trừ (`Store.adminGrant`). */
export interface AdminGrantWrite {
	admin: { id: number; username: string };
	reason: string;
	/** Kinh tế trước / sau (`@aether/sim/economy` `applyAdminEco`) + tổng EXP thay đổi (có dấu) cho nhật ký kinh tế. */
	eco?: { before: Eco; after: Eco; exp: number };
	/** Kim cương cộng (âm = trừ). */
	diamonds?: number;
	/** Điểm tiềm năng thưởng cộng (âm = trừ). */
	bonusPoints?: number;
}

/** Nhân vật cho trang quản trị: số kinh tế THÔ trong CSDL (bản lưu cũ có thể thiếu / lạ — người gọi kẹp bằng `cleanEco`). */
export interface AdminRow {
	id: string;
	name: string;
	account: string;
	level: unknown;
	exp: unknown;
	coins: unknown;
	potions: unknown;
	diamonds: number;
	bonusPoints: number;
}

const ADMIN_ROW_SQL = `SELECT c.id, c.name, a.username AS account, json_extract(c.progress, '$.level') AS level, json_extract(c.progress, '$.exp') AS exp,
	json_extract(c.progress, '$.coins') AS coins, json_extract(c.progress, '$.potions') AS potions, json_extract(c.progress, '$.bonusPoints') AS bonusPoints,
	coalesce(w.diamonds, 0) AS diamonds
	FROM characters c JOIN accounts a ON a.id = c.account_id LEFT JOIN wallets w ON w.character_id = c.id`;

function toAdminRow(r: AdminRow): AdminRow {
	return { id: r.id, name: r.name, account: r.account, level: r.level, exp: r.exp, coins: r.coins, potions: r.potions, diamonds: Number(r.diamonds) || 0, bonusPoints: cleanBonusPoints(r.bonusPoints) };
}

export interface NewsRow {
	id: number;
	tag: string;
	title: string;
	/** Mảng JSON các dòng. */
	body: string;
	author: string;
	at: number;
}

export interface PostRow {
	id: number;
	account_id: number;
	category: string;
	author: string;
	title: string;
	body: string;
	at: number;
	comments: number;
}

export interface CommentRow {
	id: number;
	post_id: number;
	account_id: number;
	author: string;
	body: string;
	at: number;
}

interface FeedbackRow {
	id: number;
	account_id: number;
	username: string;
	character_name: string | null;
	text: string;
	build: number | null;
	platform: string | null;
	kind: FeedbackKind;
	status: FeedbackStatus;
	reply: string | null;
	reply_at: number | null;
	replied_by: string | null;
	at: number;
}

function toFeedback(r: FeedbackRow): FeedbackEntry {
	return {
		id: r.id,
		at: r.at,
		username: r.username,
		characterName: r.character_name,
		text: r.text,
		build: r.build,
		platform: r.platform,
		kind: r.kind,
		status: r.status,
		reply: r.reply,
		replyAt: r.reply_at,
		repliedBy: r.replied_by,
	};
}

interface AdminLogRow {
	id: number;
	admin: string;
	character_id: string;
	character_name: string;
	field: string;
	from_value: number;
	to_value: number;
	reason: string;
	at: number;
}

export interface CharacterBrief {
	id: string;
	name: string;
	level: number;
}

interface BriefRow {
	id: string;
	name: string;
	level: number | null;
}

function toBrief(r: BriefRow): CharacterBrief {
	return { id: r.id, name: r.name, level: Number(r.level) || 1 };
}

interface CharacterRow {
	id: string;
	name: string;
	gender: Gender;
	progress: string;
	created_at: number;
}

function toInfo(r: CharacterRow): CharacterInfo {
	return { id: r.id, name: r.name, gender: r.gender, createdAt: r.created_at, progress: JSON.parse(r.progress) as CharacterProgress };
}

/** Các trường tiềm năng trong bản lưu truyện (`SaveData` của web) — đi cùng nhau, đổi định dạng là đổi cả nhóm. */
const TALENT_FIELDS = ['talents', 'talentsV', 'loadout', 'enchant', 'swordStyle', 'attrs', 'attrTalent'] as const;

/**
 * Phần tiềm năng KHÔNG bị bản lưu mang định dạng `talentsV` CŨ hơn ghi đè: tab mở từ trước lần triển khai đọc định dạng mới
 * thành "hệ cũ", hoàn điểm rồi lưu lại — mất mốc đã mua (10/10/2026, định dạng 3). Khi đó giữ nguyên nhóm trường tiềm năng đang
 * lưu, phần còn lại của truyện (nhiệm vụ, đồ…) vẫn nhận. Xoá tiến độ (`story` null) không bị chặn.
 */
export function keepNewerTalents(storedStory: unknown, next: CharacterProgress): CharacterProgress {
	const s = storedStory && typeof storedStory === 'object' ? (storedStory as Record<string, unknown>) : null;
	const n = next.story && typeof next.story === 'object' ? (next.story as Record<string, unknown>) : null;
	if (!s || !n) return next;
	const sv = Number(s.talentsV);
	const nv = Number(n.talentsV);
	if (!Number.isFinite(sv) || sv <= (Number.isFinite(nv) ? nv : 0)) return next;
	const story: Record<string, unknown> = { ...n };
	for (const k of TALENT_FIELDS) {
		if (k in s) story[k] = s[k];
		else delete story[k];
	}
	return { ...next, story };
}

/** Khoá so trùng tên: chữ thường + chuẩn hoá Unicode (để "Lior" và "lior", "Ánh" dựng sẵn/tổ hợp coi là một). */
export function nameKey(name: string): string {
	return name.normalize('NFC').toLocaleLowerCase('vi');
}

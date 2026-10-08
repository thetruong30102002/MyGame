import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { CharacterInfo, CharacterProgress, Gender } from '@aether/protocol';

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
		`);
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

	saveProgress(id: string, progress: CharacterProgress): void {
		this.db.prepare('UPDATE characters SET progress = ?, updated_at = ? WHERE id = ?').run(JSON.stringify(progress), Date.now(), id);
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

/** Khoá so trùng tên: chữ thường + chuẩn hoá Unicode (để "Lior" và "lior", "Ánh" dựng sẵn/tổ hợp coi là một). */
export function nameKey(name: string): string {
	return name.normalize('NFC').toLocaleLowerCase('vi');
}

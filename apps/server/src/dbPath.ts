// Đường dẫn CSDL máy chủ. Đổi tên dự án Aether → Haven Lord (28/10/2026): CSDL thật đổi từ data/aether.db sang data/havenlord.db.
import { existsSync, renameSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
export const LIVE_DB = join(DATA_DIR, 'havenlord.db');
const LEGACY_DB = join(DATA_DIR, 'aether.db');

/**
 * CSDL đang dùng: HAVENLORD_DB nếu có đặt, không thì data/havenlord.db. Máy chưa chạy bản mới (chỉ còn data/aether.db) thì trả
 * tên cũ; `migrate` (chỉ máy chủ game lúc khởi động) đổi tên file cũ sang tên mới kèm `-wal` / `-shm`. File cũ đang bị tiến trình
 * khác mở (Windows khoá, đổi tên lỗi) thì giữ nguyên và dùng tên cũ — không bao giờ tách CSDL khỏi file WAL của nó.
 */
export function dbPath(migrate = false): string {
	if (process.env.HAVENLORD_DB) return process.env.HAVENLORD_DB;
	if (existsSync(LIVE_DB) || !existsSync(LEGACY_DB)) return LIVE_DB;
	if (!migrate) return LEGACY_DB;
	try {
		renameSync(LEGACY_DB, LIVE_DB);
	} catch {
		return LEGACY_DB;
	}
	if (existsSync(LEGACY_DB + '-wal')) {
		try {
			renameSync(LEGACY_DB + '-wal', LIVE_DB + '-wal');
		} catch {
			// WAL chứa giao dịch chưa gộp vào file chính: không chuyển được thì trả file chính về tên cũ.
			renameSync(LIVE_DB, LEGACY_DB);
			return LEGACY_DB;
		}
	}
	// -shm chỉ là chỉ mục của WAL, SQLite tự dựng lại khi thiếu.
	if (existsSync(LEGACY_DB + '-shm')) try { renameSync(LEGACY_DB + '-shm', LIVE_DB + '-shm'); } catch { /* bỏ qua */ }
	console.log('Đã đổi tên CSDL data/aether.db → data/havenlord.db');
	return LIVE_DB;
}

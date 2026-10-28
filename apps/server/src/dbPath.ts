// Đường dẫn CSDL máy chủ: data/havenlord.db.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
export const LIVE_DB = join(DATA_DIR, 'havenlord.db');

/** CSDL đang dùng: HAVENLORD_DB nếu có đặt, không thì data/havenlord.db. */
export function dbPath(): string {
	return process.env.HAVENLORD_DB || LIVE_DB;
}

// Bản triển khai Funnel build xen kẽ HAI thư mục (`.next-funnel` ↔ `.next-funnel-b`): build luôn ghi vào thư mục KHÔNG đang chạy,
// `next start` đang phục vụ không bị ghi đè giữa chừng (đã dẫm 07/10/2026 — trang sập khi build đè thư mục đang chạy). Thư mục của
// bản mới nhất ghi ở `.funnel-current`; `start:funnel` đọc file này.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const CURRENT = fileURLToPath(new URL('../.funnel-current', import.meta.url));
const DIRS = ['.next-funnel', '.next-funnel-b'];

/** Thư mục của bản build mới nhất (chưa có file thì là `.next-funnel` như trước). */
export function currentDir() {
	const d = existsSync(CURRENT) ? readFileSync(CURRENT, 'utf8').trim() : '';
	return DIRS.includes(d) ? d : DIRS[0];
}

/** Thư mục để build lần này: cái còn lại. */
export function nextDir() {
	return currentDir() === DIRS[0] ? DIRS[1] : DIRS[0];
}

export function setCurrent(dir) {
	writeFileSync(CURRENT, `${dir}\n`);
}

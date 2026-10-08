import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Mã map `<vùng>/<tên>` hợp lệ — chỉ chữ thường, số, gạch dưới (không cho `..` lọt ra ngoài thư mục map). */
const MAP_ID = /^[a-z0-9_]{1,24}\/[a-z0-9_]{1,40}$/;

/** Đường dẫn file JSON của map trong thư mục map của client (cùng nguồn dữ liệu, không chép sang máy chủ); null = mã sai dạng. */
export function mapFile(dir: string, map: string): string | null {
	if (!MAP_ID.test(map)) return null;
	const [region, name] = map.split('/');
	return join(dir, region!, `${name}.json`);
}

const exists = new Map<string, boolean>();

/** Map có thật (có file) — dùng để chỉ đếm map thật khi tính thành tựu thám hiểm. */
export function mapExists(dir: string, map: string): boolean {
	const file = mapFile(dir, map);
	if (!file || map.endsWith('/world') || map.endsWith('/props')) return false;
	let ok = exists.get(file);
	if (ok === undefined) {
		ok = existsSync(file);
		exists.set(file, ok);
	}
	return ok;
}

const spots = new Map<string, Record<string, { x: number; y: number }>>();

/** Toạ độ một địa điểm (`spots`) của map; null = không có. */
export function spotOf(dir: string, map: string, id: string): { x: number; y: number } | null {
	const file = mapFile(dir, map);
	if (!file) return null;
	let list = spots.get(file);
	if (!list) {
		try {
			const d = JSON.parse(readFileSync(file, 'utf8')) as { spots?: { id: string; x: number; y: number }[] };
			list = Object.fromEntries((d.spots ?? []).map((s) => [s.id, { x: s.x, y: s.y }]));
		} catch {
			list = {};
		}
		spots.set(file, list);
	}
	return list[id] ?? null;
}

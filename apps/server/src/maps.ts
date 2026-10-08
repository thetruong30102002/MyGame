import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isSharedZone, type MonsterZoneDef } from '@aether/sim/mobs';
import type { NpcSpot } from '@aether/sim/rewards';

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

/** Người chơi đứng (map, x, y) có ở gần NPC dịch vụ `npc` không — máy chủ chỉ phục vụ (trao quà, bán hàng) khi đúng chỗ. */
export function nearNpc(dir: string, at: { map: string; x: number; y: number } | null, npc: NpcSpot): boolean {
	const spot = spotOf(dir, npc.map, npc.spot);
	if (!at || !spot || at.map !== npc.map) return false;
	return Math.hypot(at.x - (spot.x + npc.dx), at.y - (spot.y + npc.dy)) <= npc.range;
}

const privates = new Map<string, { zone: Map<string, number>; boss: string | null }>();

/**
 * Quái RIÊNG có trên map (M3.3a — client báo hạ, máy chủ kiểm): `zone` = loại trong khu KHÔNG dùng chung (tuổi thơ, nhiệm vụ) kèm
 * TỔNG số con của loại đó trên map (trần số lần báo trong một nhịp hồi sinh); `boss` = boss cốt truyện của map; null = không có (quái
 * dùng chung do máy chủ tự tính công, không nhận báo từ client).
 */
export function privateKill(dir: string, map: string, type: string): { kind: 'zone'; count: number } | { kind: 'boss' } | null {
	const file = mapFile(dir, map);
	if (!file) return null;
	let p = privates.get(file);
	if (!p) {
		try {
			const d = JSON.parse(readFileSync(file, 'utf8')) as { monsterZones?: MonsterZoneDef[]; boss?: { characterId: string } | null };
			const zone = new Map<string, number>();
			// Khu nhiều loại quái chia đều số con (mỗi loại tính đủ `count` — trần rộng tay, vẫn chặn được báo dồn dập).
			for (const z of (d.monsterZones ?? []).filter((x) => !isSharedZone(x))) for (const t of z.monsters) zone.set(t, (zone.get(t) ?? 0) + z.count);
			p = { zone, boss: d.boss?.characterId ?? null };
		} catch {
			p = { zone: new Map(), boss: null };
		}
		privates.set(file, p);
	}
	if (p.boss === type) return { kind: 'boss' };
	const count = p.zone.get(type);
	return count ? { kind: 'zone', count } : null;
}

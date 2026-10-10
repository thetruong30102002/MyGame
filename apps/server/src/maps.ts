import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isChildZone, isSharedZone, type MonsterZoneDef } from '@aether/sim/mobs';
import { enemyLevel } from '@aether/sim/skills';
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

/** Một khu RIÊNG trên map (không dùng chung): cấp + có phải khu tuổi thơ (EXP bị chặn) + các loại quái. */
interface PrivateZone {
	id: string;
	level?: number;
	child: boolean;
	monsters: string[];
}

const privates = new Map<string, { zones: PrivateZone[]; count: Map<string, number>; boss: string | null }>();

/** Quái riêng client vừa báo hạ, đã khớp với dữ liệu map. */
export type PrivateKill = { kind: 'zone'; count: number; zone: string; level?: number; child: boolean } | { kind: 'boss' };

/**
 * Quái RIÊNG có trên map (M3.3a — client báo hạ, máy chủ kiểm): `zone` = loại trong khu KHÔNG dùng chung (tuổi thơ, nhiệm vụ) kèm
 * TỔNG số con của loại đó trên map (trần số lần báo trong một nhịp hồi sinh), khu đã khớp + cấp của khu (EXP / xu theo
 * `enemyStatsAt`) + khu tuổi thơ hay không (EXP chặn ở `CHILD_ZONE_LEVEL_CAP`); `boss` = boss cốt truyện của map; null = không có
 * (quái dùng chung do máy chủ tự tính công, không nhận báo từ client).
 * `zoneId`: khu client báo (thiết kế 12 map vùng 1) — phải là khu riêng của map này và có loại đó, sai thì null. Vắng (client bản
 * cũ) thì lấy khu riêng CẤP THẤP NHẤT có loại đó (ít EXP nhất; ngang cấp thì khu tuổi thơ trước — bị chặn EXP).
 */
export function privateKill(dir: string, map: string, type: string, zoneId?: string): PrivateKill | null {
	const file = mapFile(dir, map);
	if (!file) return null;
	let p = privates.get(file);
	if (!p) {
		try {
			const d = JSON.parse(readFileSync(file, 'utf8')) as { monsterZones?: MonsterZoneDef[]; boss?: { characterId: string } | null };
			const zones = (d.monsterZones ?? []).filter((x) => !isSharedZone(x)).map((z) => ({ id: z.id, level: z.level, child: isChildZone(z), monsters: z.monsters }));
			const count = new Map<string, number>();
			// Khu nhiều loại quái chia đều số con (mỗi loại tính đủ `count` — trần rộng tay, vẫn chặn được báo dồn dập).
			for (const z of (d.monsterZones ?? []).filter((x) => !isSharedZone(x))) for (const t of z.monsters) count.set(t, (count.get(t) ?? 0) + z.count);
			p = { zones, count, boss: d.boss?.characterId ?? null };
		} catch {
			p = { zones: [], count: new Map(), boss: null };
		}
		privates.set(file, p);
	}
	if (p.boss === type) return { kind: 'boss' };
	const count = p.count.get(type);
	if (!count) return null;
	const fits = p.zones.filter((z) => z.monsters.includes(type));
	const lv = (z: PrivateZone): number => enemyLevel(type, z.level) ?? 0;
	const z = zoneId ? fits.find((x) => x.id === zoneId) : [...fits].sort((a, b) => lv(a) - lv(b) || Number(b.child) - Number(a.child))[0];
	if (!z) return null;
	return { kind: 'zone', count, zone: z.id, ...(z.level !== undefined ? { level: z.level } : {}), child: z.child };
}

// Chạy: npx tsx tests/worldmaps.test.ts — map của MỌI vùng đã mở (vùng 2–10 dựng bằng bộ dựng chung `packages/asset-pipeline/src/
// maps/kit`, 10/10/2026): đi bằng CHÂN THẬT (hộp chân 11×5 như client, va chạm `@aether/sim/collision`) từ điểm vào đầu tiên tới
// được mọi điểm đến, lối ra, điểm sinh quái, tâm sân boss; lối xuyên vùng hai chiều đúng mép đối diện; quái + boss có chỉ số.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { buildSolids, isBlocked, type CollisionMap, type PropFootprint } from '@aether/sim/collision';
import { zoneSpawnPoints, type MonsterZoneDef } from '@aether/sim/mobs';
import { REGIONS } from '@aether/sim/regions';
import { ENEMY_STATS } from '@aether/sim/skills';

const MAPS = process.env.AETHER_MAPS ?? join(import.meta.dirname, '../../../assets/maps');
const STEP = 6;

interface MapJson extends CollisionMap {
	id: string;
	spots: { id: string; x: number; y: number }[];
	monsterZones: (MonsterZoneDef & { id: string; boss?: boolean })[];
	exits: { id: string; to: string; toSpot: string; edge: 'N' | 'S' | 'E' | 'W'; x0: number; y0: number; x1: number; y1: number }[];
}

const read = <T>(...p: string[]): T => JSON.parse(readFileSync(join(MAPS, ...p), 'utf8')) as T;
const OPP = { N: 'S', S: 'N', E: 'W', W: 'E' } as const;

const regions = REGIONS.filter((r) => r.ready && r.id !== 'human');
const all = new Map<string, MapJson>();
for (const r of regions) {
	const idx = read<{ maps: Record<string, unknown> }>(r.id, 'world.json');
	for (const id of Object.keys(idx.maps)) all.set(`${r.id}/${id}`, read<MapJson>(r.id, `${id}.json`));
}

/** Ô lưới STEP px tới được từ (x, y) bằng hộp chân 11×5. */
function reachable(map: MapJson, meta: Record<string, PropFootprint>, x: number, y: number): (px: number, py: number) => boolean {
	const solids = buildSolids(map, meta);
	const W = map.width * map.tileSize;
	const H = map.height * map.tileSize;
	const gw = Math.floor(W / STEP);
	const gh = Math.floor(H / STEP);
	const seen = new Uint8Array(gw * gh);
	const free = (gx: number, gy: number): boolean => !isBlocked(map, solids, gx * STEP + STEP / 2, gy * STEP + STEP / 2, 11, 5);
	const stack: number[] = [];
	const sx = Math.floor(x / STEP);
	const sy = Math.floor(y / STEP);
	if (free(sx, sy)) {
		seen[sy * gw + sx] = 1;
		stack.push(sy * gw + sx);
	}
	while (stack.length) {
		const i = stack.pop()!;
		const cx = i % gw;
		const cy = (i - cx) / gw;
		for (const [nx, ny] of [
			[cx + 1, cy],
			[cx - 1, cy],
			[cx, cy + 1],
			[cx, cy - 1],
		] as const) {
			if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue;
			const j = ny * gw + nx;
			if (seen[j] || !free(nx, ny)) continue;
			seen[j] = 1;
			stack.push(j);
		}
	}
	// Điểm tính là tới được nếu một ô lưới trong bán kính 2 ô lưới quanh nó đã loang tới (điểm neo có thể nằm sát mép đồ vật).
	return (px, py) => {
		const gx = Math.floor(px / STEP);
		const gy = Math.floor(py / STEP);
		for (let dy = -2; dy <= 2; dy += 1) for (let dx = -2; dx <= 2; dx += 1) if (seen[(gy + dy) * gw + gx + dx]) return true;
		return false;
	};
}

test('Thistlewood: tới sân cổng và cả ba lối nguyên tố bằng chân', () => {
	const meta = read<Record<string, PropFootprint>>('human', 'props.meta.json');
	for (const id of ['town', 'element_gate']) {
		const m = read<MapJson>('human', `${id}.json`);
		const ok = reachable(m, meta, m.spots[0]!.x, m.spots[0]!.y);
		for (const s of m.spots) assert.ok(ok(s.x, s.y), `${id}: ${s.id}`);
		for (const e of m.exits) {
			const to = e.to.includes('/') ? e.to.split('/') : ['human', e.to];
			const dest = read<MapJson>(to[0]!, `${to[1]}.json`);
			assert.ok(dest.spots.some(s => s.id === e.toSpot), `${id}: ${e.to}#${e.toSpot}`);
		}
	}
});

test('vùng 2–10: mọi điểm đến / lối / điểm sinh quái / sân boss tới được bằng chân từ lối vào đầu tiên', () => {
	const problems: string[] = [];
	for (const r of regions) {
		const meta = read<Record<string, PropFootprint>>(r.id, 'props.meta.json');
		for (const [key, m] of all) {
			if (!key.startsWith(`${r.id}/`)) continue;
			const start = m.spots[0]!;
			const ok = reachable(m, meta, start.x, start.y);
			for (const s of m.spots) if (!ok(s.x, s.y)) problems.push(`${key}: điểm ${s.id}`);
			for (const e of m.exits) {
				// Đứng sát dải lối (lùi vào trong 1 ô) phải tới được.
				const cx = (e.x0 + e.x1) / 2 + (e.edge === 'W' ? 48 : e.edge === 'E' ? -48 : 0);
				const cy = (e.y0 + e.y1) / 2 + (e.edge === 'N' ? 48 : e.edge === 'S' ? -48 : 0);
				if (!ok(cx, cy)) problems.push(`${key}: lối ${e.id} → ${e.to}`);
			}
			for (const z of m.monsterZones) {
				if (z.boss) {
					if (!ok(z.x, z.y)) problems.push(`${key}: sân boss ${z.id}`);
					continue;
				}
				for (const p of zoneSpawnPoints(z)) if (!ok(p.x, p.y)) problems.push(`${key}: điểm sinh ${z.id}#${p.index}`);
			}
		}
	}
	assert.deepEqual(problems, []);
});

test('vùng 2–10: lối xuyên vùng hai chiều, đúng mép đối diện, điểm đến có thật', () => {
	const human = (id: string): MapJson => read<MapJson>('human', `${id}.json`);
	const get = (key: string): MapJson | undefined => all.get(key) ?? (key.startsWith('human/') ? human(key.slice(6)) : undefined);
	let cross = 0;
	for (const [key, m] of all) {
		for (const e of m.exits) {
			if (!e.to.includes('/')) continue;
			const t = get(e.to);
			if (!t) continue; // vùng đích chưa dựng (vùng 8)
			cross += 1;
			assert.ok(t.spots.some((s) => s.id === e.toSpot), `${key} → ${e.to}#${e.toSpot}`);
			const back = t.exits.find((b) => b.to === key);
			assert.ok(back, `${e.to} thiếu lối về ${key}`);
			assert.equal(back!.edge, OPP[e.edge], `${key} ra mép ${e.edge}, ${e.to} về mép ${back!.edge}`);
		}
	}
	assert.equal(cross, 2 * regions.filter(r => !r.branch).length - 1 + regions.filter(r => r.branch).length, 'vùng 1→2 … 6→7: 6 lối vào trạm + 5 lối ra map cửa (lối ra của vùng 7 dẫn tới vùng 8 chưa dựng)');
});

test('vùng 2–10: mọi loại quái / boss trên map có chỉ số + kháng hệ', () => {
	const missing = new Set<string>();
	for (const m of all.values()) for (const z of m.monsterZones) for (const t of z.monsters) if (!ENEMY_STATS[t]?.resist) missing.add(t);
	assert.deepEqual([...missing], []);
	for (const r of regions.filter((r) => r.chief)) assert.ok(r.chief && [...all.values()].some((m) => m.monsterZones.some((z) => z.monsters.includes(r.chief!.id))), `${r.id}: boss chúa ${r.chief?.id} có trên map`);
});

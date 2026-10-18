import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { buildSolids, isBlocked } from '../../sim/src/collision.js';
import { BUILDINGS } from '../src/maps/buildings.js';
import { regionBuild } from '../src/maps/regions.js';
import { GroundShader } from '../src/maps/groundShade.js';
import { ELEMENT_TREES } from '../src/props/elemental.js';

const root = process.env.AETHER_MAPS ?? join(import.meta.dirname, '../../../assets/maps');
for (const [region, trees] of Object.entries(ELEMENT_TREES)) test(`${region}: đủ 12 loài cây thật, 12 map ngoài trời và một công trình`, () => {
	const meta = JSON.parse(readFileSync(join(root, region, 'props.meta.json'), 'utf8'));
	const { maps } = regionBuild(region).build(meta, []);
	assert.equal(maps.length, 13);
	assert.equal(new Set(trees).size, 12);
	for (const tree of trees) {
		assert.ok(meta[tree], `${tree}: ảnh đã vào atlas`);
		assert.ok(maps.some(m => m.props.some(p => p.id === tree || p.id === `${tree}_flip`)), `${tree}: có trên map`);
	}
});
for (const [region, spec] of Object.entries(BUILDINGS)) test(`${region}: phòng, lối hai chiều và đường đi thật trong công trình`, () => {
	const meta = JSON.parse(readFileSync(join(root, region, 'props.meta.json'), 'utf8'));
	const { maps, index } = regionBuild(region).build(meta, []);
	const m = maps.find((x) => x.id === spec.id)!;
	const source = maps.find((x) => x.id === spec.from)!;
	assert.ok(index.maps[spec.id]);
	assert.equal(m.areas.length, 3);
	assert.equal(m.monsterZones.length, spec.monster ? 3 : 0);
	assert.ok(source.exits.some((e) => e.to === m.id));
	assert.equal(m.exits[0]!.to, source.id);
	for (const target of [m, source]) {
		const m = target;
		const solids = buildSolids(m, meta);
		const free = (x: number, y: number) => !isBlocked(m, solids, x * 12 + 6, y * 12 + 6, 11, 5);
		const width = m.width * 4, height = m.height * 4;
		const seen = new Set<string>(), queue: [number, number][] = [[Math.floor(m.spawn.x / 12), Math.floor(m.spawn.y / 12)]];
		assert.ok(free(...queue[0]!), 'điểm vào không bị chặn');
		for (let i = 0; i < queue.length; i++) {
			const [x, y] = queue[i]!;
			for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
				const key = `${nx},${ny}`;
				if (nx! < 0 || ny! < 0 || nx! >= width || ny! >= height || seen.has(key) || !free(nx!, ny!)) continue;
				seen.add(key); queue.push([nx!, ny!]);
			}
		}
		const points = m.id === spec.id ? [...m.spots, ...m.monsterZones] : m.spots.filter((p) => p.id === `${spec.id}_outside`);
		for (const p of points) assert.ok(seen.has(`${Math.floor(p.x / 12)},${Math.floor(p.y / 12)}`), `${m.id}: tới được ${p.id}`);
		if (m.id === spec.id) assert.ok(isBlocked(m, solids, 24, 24, 11, 5), 'tường chặn chân thật');
	}
	const shader = new GroundShader({ ...m, biome: 'rocky' });
	assert.deepEqual(shader.shade(0, 0), [31, 28, 25]);
});

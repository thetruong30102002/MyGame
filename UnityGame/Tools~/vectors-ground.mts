// Vector đối chiếu MẶT ĐẤT: băm SHA-1 điểm ảnh do CHÍNH groundShade.ts (packages/asset-pipeline) tô (renderGroundChunk) cho vài vùng của mỗi map,
// cùng bảng màu lót terrainColor. Test C# (Tests~/HavenLord.Data.Tests) chạy GroundShader.cs cùng đầu vào và đòi ra y hệt từng byte.
//   npx tsx UnityGame/Tools~/vectors-ground.mts
import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderGroundChunk, terrainColor, type Biome } from '../../packages/asset-pipeline/src/maps/groundShade.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const MAPS = join(HERE, '..', '..', 'assets', 'maps', 'human');
const OUT = join(HERE, '..', 'Tests~', 'vectors');
mkdirSync(OUT, { recursive: true });

const SIZE = 160;
const chunks: { map: string; ox: number; oy: number; w: number; h: number; sha1: string }[] = [];
for (const file of readdirSync(MAPS).filter((f) => f.endsWith('.json') && !f.includes('.minimap.') && !['props.json', 'props.meta.json', 'world.json'].includes(f)).sort()) {
	const m = JSON.parse(readFileSync(join(MAPS, file), 'utf8'));
	const W = m.width * m.tileSize;
	const H = m.height * m.tileSize;
	const pts: [number, number][] = [[0, 0], [Math.floor(W / 2), Math.floor(H / 2)], [W - SIZE, H - SIZE]];
	// Vùng có cầu / nước / đường nếu map có: tâm ô đầu tiên của loại đó.
	for (const ch of ['b', 'w', 'd', 'c', 'f']) {
		const y = m.terrain.findIndex((r: string) => r.includes(ch));
		if (y >= 0) pts.push([Math.max(0, m.terrain[y].indexOf(ch) * m.tileSize - 60), Math.max(0, y * m.tileSize - 60)]);
	}
	for (const [ox, oy] of pts) {
		const w = Math.min(SIZE, W - ox);
		const h = Math.min(SIZE, H - oy);
		const px = renderGroundChunk({ tileSize: m.tileSize, width: m.width, height: m.height, seed: m.seed, terrain: m.terrain, biome: m.biome }, ox, oy, w, h);
		chunks.push({ map: file.replace('.json', ''), ox, oy, w, h, sha1: createHash('sha1').update(px).digest('hex') });
	}
}
const biomes: (Biome | undefined)[] = [undefined, 'meadow', 'deadland', 'rocky', 'wood', 'light', 'dark'];
const colors = biomes.flatMap((b) => [...'gfdcwbx'].map((ch) => ({ biome: b ?? null, ch, rgb: terrainColor(b, ch) })));
writeFileSync(join(OUT, 'ground.json'), `${JSON.stringify({ chunks, colors }, null, '\t')}\n`);
console.log(`✔ vector mặt đất → ${OUT}/ground.json: ${chunks.length} vùng · ${colors.length} màu lót`);

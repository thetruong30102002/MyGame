// Chạy: npx tsx tests/codex.test.ts — Thư viện: danh mục quái / boss / NPC dựng từ dữ liệu thật (world.json, cốt truyện),
// đủ tên + lời giới thiệu, nơi ở đúng map, NPC gộp theo người, bản lưu tiến độ lạ không làm vỡ.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { REGIONS } from '@aether/sim/regions';
import { agesText, buildCodex, cleanCodex, MONSTER_INFO, NPC_LORE, npcKey } from '../src/game/codex';
import { ENEMY_STATS } from '../src/game/combat/skills';
import { STORY } from '../src/game/story/story';
import type { WorldIndexData } from '../src/game/world/WorldIndex';

// AETHER_WEB_ASSETS = thư mục nháp của lệnh dựng map → kiểm map mới dựng trước khi chép vào public (như tests/region.ts).
const ASSETS = process.env.AETHER_WEB_ASSETS ?? 'public/assets';
const world = JSON.parse(readFileSync(join(ASSETS, 'maps/human/world.json'), 'utf8')) as WorldIndexData;
const manifest = JSON.parse(readFileSync('public/assets/manifest.json', 'utf8')) as { characters: Record<string, unknown> };
// Quái vùng 2–7 (dựng 10/10/2026) sống ở world.json của vùng đó — gộp mọi vùng đã có map (khoá `vùng/map`) để kiểm nơi ở.
const allWorlds: WorldIndexData = {
	...world,
	maps: Object.assign(
		{ ...world.maps },
		...REGIONS.filter((r) => r.ready && r.id !== 'human').map((r) => {
			const w = JSON.parse(readFileSync(join(ASSETS, `maps/${r.id}/world.json`), 'utf8')) as WorldIndexData;
			return Object.fromEntries(Object.entries(w.maps).map(([k, m]) => [`${r.id}/${k}`, m]));
		}),
	),
};
const codex = buildCodex(allWorlds, STORY.npcs, (id) => id in manifest.characters);
const get = (id: string) => codex.find((e) => e.id === id)!;

for (const id of Object.keys(ENEMY_STATS)) assert.ok(MONSTER_INFO[id], `quái ${id} có tên + lời giới thiệu`);
for (const n of Object.values(STORY.npcs)) assert.ok(NPC_LORE[n.name], `NPC ${n.name} có lời giới thiệu`);
// Dơi hang + Gargoyle Đá sống ở Hang Gargoyle (thiết kế 12 map vùng 1, 10/10/2026): world.json chưa có Hang (bản public trước khi
// dựng lại vùng) thì chưa có nơi ở — có Hang rồi thì bắt buộc như mọi loại khác.
const cave = 'gargoyle_cave' in world.maps;
const awaitingCave = cave ? [] : ['mob_cave_bat_001', 'boss_stone_gargoyle_001'];
for (const e of codex) if (!awaitingCave.includes(e.id)) assert.ok(e.places.length > 0, `${e.name}: có nơi ở trên bản đồ`);
if (cave) {
	assert.deepEqual(get('mob_cave_bat_001').places, [{ map: 'gargoyle_cave' }], 'dơi chỉ ở Hang');
	assert.deepEqual(get('boss_stone_gargoyle_001').places, [{ map: 'gargoyle_cave', zone: 'gc_hall' }], 'Gargoyle Đá: hang ổ gc_hall');
}
assert.equal(get('boss_stone_gargoyle_001').kind, 'boss');
assert.equal(get('mob_cave_bat_001').kind, 'monster');

// Xác sống: Nghĩa địa (+ Mộ Vô Danh khi vùng 12 map đã dựng) — cả map, không gắn khu.
const zombieMaps = get('mob_zombie_001').places.map((p) => p.map);
assert.ok(zombieMaps.includes('graveyard'), zombieMaps.join(', '));
assert.ok(zombieMaps.every((m) => ['graveyard', 'nameless'].includes(m)) && get('mob_zombie_001').places.every((p) => !p.zone), zombieMaps.join(', '));
// Xác sống đã có hình PixelLab (09/10/2026) → sprite trỏ đúng id; quái chưa có hình thì sprite = null (Mốc 2 chưa vào manifest).
assert.equal(get('mob_zombie_001').sprite, 'mob_zombie_001');
assert.deepEqual(get('boss_lich_001').places, [{ map: 'graveyard', zone: 'gy_crypt' }], 'boss vùng: hang ổ trong map');
assert.deepEqual(get('boss_demon_001').places, [{ map: 'shrine' }], 'boss cốt truyện: map có nó làm boss');
assert.equal(get('boss_demon_001').kind, 'boss');
assert.equal(get('mob_mushroom_001').sprite, 'mob_mushroom_001');

const elin = get(npcKey('Elin Ashvale'));
assert.equal(codex.filter((e) => e.name === 'Elin Ashvale').length, 1, 'mẹ lúc con 4 tuổi và 16 tuổi là MỘT mục');
assert.equal(agesText(elin.ages!), '4–8 tuổi · từ 16 tuổi');
const aldric = get(npcKey('Aldric'));
assert.equal(aldric.sprite, 'npc_aldric_001', 'hình theo tuổi lớn nhất');
assert.ok(aldric.titles.length >= 2, 'nhiều danh hiệu theo tuổi');
assert.equal(get(npcKey('Bia đá cổ')).sprite, null);

assert.deepEqual(cleanCodex(null), { seen: [], kills: {} });
assert.deepEqual(cleanCodex({ seen: ['a', 'a', 5, 'b'], kills: { x: 3.7, y: -1, z: 'nhiều' } }), { seen: ['a', 'b'], kills: { x: 3 } });
console.log(`✔ codex.test: ${codex.length} mục (quái + boss + NPC) đủ tên, lời giới thiệu, nơi ở; NPC gộp theo người; bản lưu lạ an toàn`);

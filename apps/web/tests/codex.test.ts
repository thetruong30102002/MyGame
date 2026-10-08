// Chạy: npx tsx tests/codex.test.ts — Thư viện: danh mục quái / boss / NPC dựng từ dữ liệu thật (world.json, cốt truyện),
// đủ tên + lời giới thiệu, nơi ở đúng map, NPC gộp theo người, bản lưu tiến độ lạ không làm vỡ.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { agesText, buildCodex, cleanCodex, MONSTER_INFO, NPC_LORE, npcKey } from '../src/game/codex';
import { ENEMY_STATS } from '../src/game/combat/skills';
import { STORY } from '../src/game/story/story';
import type { WorldIndexData } from '../src/game/world/WorldIndex';

const world = JSON.parse(readFileSync('public/assets/maps/human/world.json', 'utf8')) as WorldIndexData;
const manifest = JSON.parse(readFileSync('public/assets/manifest.json', 'utf8')) as { characters: Record<string, unknown> };
const codex = buildCodex(world, STORY.npcs, (id) => id in manifest.characters);
const get = (id: string) => codex.find((e) => e.id === id)!;

for (const id of Object.keys(ENEMY_STATS)) assert.ok(MONSTER_INFO[id], `quái ${id} có tên + lời giới thiệu`);
for (const n of Object.values(STORY.npcs)) assert.ok(NPC_LORE[n.name], `NPC ${n.name} có lời giới thiệu`);
for (const e of codex) assert.ok(e.places.length > 0, `${e.name}: có nơi ở trên bản đồ`);

assert.deepEqual(get('mob_zombie_001').places, [{ map: 'graveyard' }]);
assert.equal(get('mob_zombie_001').sprite, null, 'chưa có hình PixelLab → null');
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

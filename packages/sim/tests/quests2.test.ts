import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { ENEMY_STATS } from '../src/skills.ts';
import { STORY } from '../src/story/story.ts';
import { pickDaily, q2Available, q2DateKey, newQ2State, objectiveHit, Q2_DAILY, Q2_QUESTS } from '../src/quests2.ts';

const root = join(import.meta.dirname, '../../../');
const humanSpots = new Set<string>();
for (const id of Object.keys(JSON.parse(readFileSync(join(root, 'assets/maps/human/world.json'), 'utf8')).maps))
	for (const s of JSON.parse(readFileSync(join(root, 'assets/maps/human', id + '.json'), 'utf8')).spots) humanSpots.add(s.id);

test('dữ liệu nhiệm vụ mới: id duy nhất, NPC / địa điểm / quái / việc trước đều có thật', () => {
	const ids = Q2_QUESTS.map((q) => q.id);
	assert.equal(new Set(ids).size, ids.length);
	for (const q of Q2_QUESTS) {
		if (q.giver) assert(STORY.npcs[q.giver], `${q.id}: người giao ${q.giver}`);
		for (const a of q.unlock.after ?? []) assert(ids.includes(a), `${q.id}: việc trước ${a}`);
		for (const s of q.steps) {
			const o = s.objective;
			if (o.kind === 'talk') assert(STORY.npcs[o.npc], `${q.id}.${s.id}: NPC ${o.npc}`);
			if (o.kind === 'talkAll') for (const n of o.npcs) assert(STORY.npcs[n], `${q.id}.${s.id}: NPC ${n}`);
			if (o.kind === 'reach') assert(humanSpots.has(o.spot), `${q.id}.${s.id}: địa điểm ${o.spot}`);
			if (o.kind === 'kill' && o.monster) assert(ENEMY_STATS[o.monster], `${q.id}.${s.id}: quái ${o.monster}`);
			if (o.kind === 'boss') assert(ENEMY_STATS[o.id], `${q.id}.${s.id}: boss ${o.id}`);
		}
	}
	for (const t of Q2_DAILY) if (t.objective.kind === 'talk') assert(STORY.npcs[t.objective.npc], t.id);
});
test('việc mở theo cấp và việc trước; việc ngày tất định, không trùng, không bốc Gia viên khi chưa mở', () => {
	const s = newQ2State();
	assert.deepEqual(q2Available(s, 1).map((q) => q.id), ['q2_main_01']);
	s.done.push('q2_main_01');
	assert(q2Available(s, 1).some((q) => q.id === 'q2_side_01'));
	const a = pickDaily('char-a', '2026-11-13', 5, false);
	assert.deepEqual(a, pickDaily('char-a', '2026-11-13', 5, false));
	assert.equal(new Set(a).size, a.length);
	assert(a.length >= 3 && a.every((id) => !Q2_DAILY.find((t) => t.id === id)!.farm));
	assert(pickDaily('char-a', '2026-11-13', 5, true).some((id) => Q2_DAILY.find((t) => t.id === id)!.farm));
	assert.equal(q2DateKey(Date.parse('2026-11-13T23:59:00+07:00')), '2026-11-13');
	assert.equal(q2DateKey(Date.parse('2026-11-14T00:00:00+07:00')), '2026-11-14');
	assert.equal(objectiveHit({ kind: 'talkAll', npcs: ['a', 'b'] }, { kind: 'talk', npc: 'a' }, ['a']), 0, 'đã gặp không đếm lại');
});

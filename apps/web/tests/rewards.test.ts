// Chạy: npx tsx tests/rewards.test.ts — ví kim cương / điểm danh / Bia Danh Vọng phía client (K1): chữ báo quà, nhóm mục tiêu,
// và Bia Danh Vọng đứng ĐÚNG chỗ máy chủ kiểm khi trao quà (cùng `CHRONICLER`, trong map thật).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CHRONICLER, GOALS } from '@aether/sim/rewards';
import { activeBuffs, fmtCount, giftText, goalGroups } from '../src/game/rewards';
import { STORY } from '../src/game/story/story';

let passed = 0;
const test = (name: string, fn: () => void): void => {
	fn();
	passed += 1;
	console.log(`  ✔ ${name}`);
};
console.log('rewards (client)');

test('chữ báo quà: bỏ phần bằng 0', () => {
	assert.equal(giftText({ diamonds: 1, coins: 50, potions: 1 }), '+1 kim cương · +50 xu · +1 Bình hồi phục');
	assert.equal(giftText({ diamonds: 3, coins: 0, potions: 0 }), '+3 kim cương');
	assert.equal(fmtCount(1_000_000), '1.000.000');
});

test('nhóm mục tiêu: đủ mọi mục tiêu, mỗi nhóm một loại, giữ thứ tự khai', () => {
	const groups = goalGroups();
	assert.deepEqual(groups.map((g) => g.group), ['Săn quái', 'Săn boss', 'Thám hiểm', 'Bạn bè']);
	assert.deepEqual(groups.flatMap((g) => g.goals.map((x) => x.id)), GOALS.map((g) => g.id));
	assert.ok(groups.every((g) => g.goals.every((x) => x.kind === g.kind)));
});

test('Bia Danh Vọng: NPC ở quảng trường Thistlewood, đúng chỗ máy chủ kiểm, có ở mọi tuổi', () => {
	const npc = STORY.npcs[CHRONICLER.npc]!;
	assert.deepEqual(npc.at, { spot: CHRONICLER.spot, dx: CHRONICLER.dx, dy: CHRONICLER.dy });
	assert.deepEqual(npc.ages, [0, 99]);
	const [region, map] = CHRONICLER.map.split('/');
	const data = JSON.parse(readFileSync(new URL(`../public/assets/maps/${region}/${map}.json`, import.meta.url), 'utf8')) as { spots: { id: string }[] };
	assert.ok(data.spots.some((s) => s.id === CHRONICLER.spot), 'map có địa điểm của bia');
	// Bấm E được trong 76px (Game.nearestInteractable) — nằm gọn trong tầm máy chủ chấp nhận.
	assert.ok(76 < CHRONICLER.range);
});

test('bình đang dùng: client tự đếm lùi từ lúc nhận, hết giờ thì thôi áp', () => {
	const st = { list: [{ kind: 'exp' as const, mult: 2, remaining: 60 }, { kind: 'guard' as const, mult: 0.9, remaining: 10 }], at: 1000 };
	assert.deepEqual(activeBuffs(st, 1000 + 30_000), [{ kind: 'exp', mult: 2, remaining: 30 }]);
	assert.deepEqual(activeBuffs(st, 1000 + 61_000), []);
	assert.deepEqual(activeBuffs(null, 0), []);
});

console.log(`${passed} test qua`);

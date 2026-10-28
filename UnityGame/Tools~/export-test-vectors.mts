// Bộ số mẫu (test vector) sinh từ CHÍNH hàm TypeScript của packages/sim → Tests~/vectors/*.json. Test C# (Tests~/HavenLord.Core.Tests)
// gọi hàm C# cùng đầu vào và đòi ra đúng y hệt — đây là phép đối chiếu bản C# với luật gốc. Chạy ở gốc repo:
//   npx tsx UnityGame/Tools~/export-test-vectors.mts
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cleanLevel, ENEMY_STATS, enemyLevel, enemyStatsAt, expForLevel } from '../../packages/sim/src/skills.ts';
import { BRANCHES, baseTier, cleanBonusPoints, MAX_TIER, pointsForLevel, pointsToTier, talentPoints, tierCost } from '../../packages/sim/src/talents.ts';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'Tests~', 'vectors');
mkdirSync(OUT, { recursive: true });

const levels = [-5, 0, 0.4, 1, 1.9, 2, 5, 9, 10, 10.5, 11, 15, 20, 39, 40, 41, 50, 75, 99, 100, 150];
const progression = {
	expForLevel: levels.map((l) => ({ level: l, exp: expForLevel(l) })),
	cleanLevel: [
		[1, 0, 100], [3, 42, 100], [3, 99999, 100], [0, 5, 100], [-2, -7, 100], [100, 500, 100], [150, 1, 100], [12.7, 3000.9, 100],
		[NaN, NaN, 100], [5, 20, 5], [7, 10, 40],
	].map(([level, exp, maxLevel]) => ({ level: Number.isNaN(level) ? 'NaN' : level, exp: Number.isNaN(exp) ? 'NaN' : exp, maxLevel, out: cleanLevel(level, exp, maxLevel) })),
	enemyLevel: Object.keys(ENEMY_STATS).flatMap((type) => [undefined, 0, 1, 3, 7.6, 12].map((lv) => ({ type, level: lv ?? null, out: enemyLevel(type, lv) }))),
	enemyStatsAt: Object.keys(ENEMY_STATS).flatMap((type) => [undefined, 1, 2, 4, 5, 6, 8, 10, 12, 15, 20].map((lv) => ({ type, level: lv ?? null, out: enemyStatsAt(type, lv) }))),
};
writeFileSync(join(OUT, 'progression.json'), `${JSON.stringify(progression, null, '\t')}\n`);

const talents = {
	baseTier: BRANCHES.map((b) => ({ branch: b, out: baseTier(b) })),
	tierCost: BRANCHES.flatMap((b) => Array.from({ length: MAX_TIER + 2 }, (_, t) => ({ branch: b, tier: t, out: tierCost(b, t) }))),
	pointsForLevel: levels.map((l) => ({ level: l, out: pointsForLevel(l) })),
	cleanBonusPoints: [undefined, null, -3, 0, 2.7, 15, 998.9, 5000, 'abc'].map((v) => ({ value: v === undefined ? null : v, out: cleanBonusPoints(v) })),
	talentPoints: levels.flatMap((l) => [0, 3, 2000].map((bonus) => ({ level: l, bonus, out: talentPoints(l, bonus) }))),
	pointsToTier: BRANCHES.flatMap((b) => [0, 1, 2, 3, 5, 7.5, 10, 12].map((tier) => ({ branch: b, tier, out: pointsToTier(tier, b) }))),
};
writeFileSync(join(OUT, 'talents.json'), `${JSON.stringify(talents, null, '\t')}\n`);
console.log(`✔ vector → ${OUT}: ${Object.values(progression).flat().length} tiến trình · ${Object.values(talents).flat().length} tiềm năng`);

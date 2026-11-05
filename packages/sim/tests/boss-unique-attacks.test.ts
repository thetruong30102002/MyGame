// LUẬT 05/11/2026 (chủ dự án: "với các đòn đánh boss thấy bắn ra cầu tròn đen cần phải có đòn riêng", "boss nghiêm cấm đòn chung",
// "thêm vào luật"): mỗi boss / rồng có đòn thường và chiêu RIÊNG — không bắn chung quả cầu đen `dark_orb` (đòn xa `ranged: 'shadow'`
// của kiểu caster), không dùng chung hình chiêu (`look` trong `CombatSystem.Bosses.cs`) với boss khác.
// Boss cũ đang vi phạm ghi ở hai danh sách NỢ dưới đây (kế hoạch `boss-unique-attacks`): sửa con nào thì XOÁ khỏi danh sách; thêm boss
// mới vi phạm là test hỏng. Đọc thẳng nguồn (bảng TS + bảng C#) để luật áp cả client Unity.
// Chạy: npx tsx tests/boss-unique-attacks.test.ts (trong packages/sim) hoặc `npm test -w @havenlord/sim`.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const skills = readFileSync(join(root, 'packages/sim/src/skills.ts'), 'utf8');
const bosses = readFileSync(join(root, 'UnityGame/Assets/HavenLord/Client/Combat/CombatSystem.Bosses.cs'), 'utf8');

/** Nợ: boss / rồng còn bắn quả cầu đen chung (05/11/2026). */
const OWED_ORB = new Set(['boss_demon_001', 'boss_fire_god_001', 'boss_ghost_captain_001', 'boss_ice_queen_001', 'boss_kraken_001', 'boss_lich_001', 'boss_mud_hydra_001', 'boss_pharaoh_001', 'boss_salamander_001', 'boss_swamp_witch_001', 'boss_wind_drake_001', 'boss_wind_mage_001', 'dragon_fire_001', 'dragon_ice_001', 'dragon_water_001', 'dragon_wind_001']);
/** Nợ: hình chiêu đang dùng chung giữa hai boss (05/11/2026). */
const OWED_LOOK = new Set(['boss_hellfire', 'boss_avalanche', 'boss_frost_roar', 'boss_oblivion_mist', 'boss_forge_sigil']);

const BOSS = /^(boss|dragon)_/;
// Đòn xa cầu đen: kiểu caster của bảng boss thế giới + chỉ số viết tay có `ranged: 'shadow'`.
const orb = new Set<string>();
for (const m of skills.matchAll(/\['((?:boss|dragon)_[a-z0-9_]+)', \d+, '(\w+)', '\w+', '\w+'\]/g)) if (m[2] === 'caster') orb.add(m[1]!);
for (const m of skills.matchAll(/\t([a-z0-9_]+): \{[^}\n]*ranged: 'shadow'/g)) if (BOSS.test(m[1]!)) orb.add(m[1]!);
const newOrb = [...orb].filter((b) => !OWED_ORB.has(b));
assert.deepEqual(newOrb, [], `Boss mới bắn chung quả cầu đen (dark_orb) — cần đòn riêng: ${newOrb.join(', ')}`);

// Hình chiêu boss: mỗi `look` chỉ thuộc MỘT boss.
const owners = new Map<string, Set<string>>();
for (const m of bosses.matchAll(/\["((?:boss|dragon)_[a-z0-9_]+)"\] = new\[\] \{(.*?)\},\r?\n/g))
	for (const s of m[2]!.matchAll(/BossSkill\(Shape\.\w+, "([a-z0-9_]+)"/g)) owners.set(s[1]!, (owners.get(s[1]!) ?? new Set()).add(m[1]!));
assert.ok(owners.size >= 20, 'Không đọc được bảng chiêu boss trong CombatSystem.Bosses.cs');
const shared = [...owners].filter(([look, who]) => who.size > 1 && !OWED_LOOK.has(look)).map(([look, who]) => `${look} (${[...who].join(', ')})`);
assert.deepEqual(shared, [], `Hình chiêu boss dùng chung — mỗi boss phải có chiêu riêng: ${shared.join('; ')}`);

const owedOrb = [...OWED_ORB].filter((b) => orb.has(b)).length;
const owedLook = [...OWED_LOOK].filter((l) => (owners.get(l)?.size ?? 0) > 1).length;
console.log(`PASS boss không đòn chung mới; còn nợ ${owedOrb} boss bắn cầu đen, ${owedLook} hình chiêu dùng chung (kế hoạch boss-unique-attacks)`);

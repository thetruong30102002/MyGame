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
/** Danh sách hiệu ứng được đóng atlas — hình đạn / chiêu boss khai mà thiếu ở đây thì trong game tàng hình. */
const vfxList = readFileSync(join(root, 'packages/asset-pipeline/src/vfx/buildVfx.ts'), 'utf8');
const hasVfx = (id: string): boolean => vfxList.includes(`id: '${id}',`);

/** Nợ: boss / rồng còn bắn quả cầu đen chung (05/11/2026). */
const OWED_ORB = new Set<string>([]);
/** Nợ: hình chiêu đang dùng chung giữa hai boss (05/11/2026). */
const OWED_LOOK = new Set<string>([]);

const BOSS = /^(boss|dragon)_/;
// Đòn xa cầu đen: kiểu caster của bảng boss thế giới + chỉ số viết tay có `ranged: 'shadow'`.
const orb = new Set<string>();
for (const m of skills.matchAll(/\['((?:boss|dragon)_[a-z0-9_]+)', \d+, '(\w+)', '\w+', '\w+'\]/g)) if (m[2] === 'caster') orb.add(m[1]!);
for (const m of skills.matchAll(/\t([a-z0-9_]+): \{[^}\n]*ranged: 'shadow'/g)) if (BOSS.test(m[1]!)) orb.add(m[1]!);
// Boss có đạn riêng trong `BOSS_SHOTS` (skills.ts) thì không còn bắn cầu đen; mỗi hình đạn / hình nổ chỉ thuộc một boss.
const shotBlock = skills.split('export const BOSS_SHOTS')[1]?.split(/\r?\n\};/)[0] ?? '';
const shotArt = new Map<string, string>();
for (const m of shotBlock.matchAll(/\t((?:boss|dragon)_[a-z0-9_]+): \{ vfx: '([a-z0-9_]+)', impact: '([a-z0-9_]+)'/g)) {
	orb.delete(m[1]!);
	for (const art of [m[2]!, m[3]!]) {
		assert.ok(!shotArt.has(art) || shotArt.get(art) === m[1], `Hình đạn boss dùng chung: ${art} (${shotArt.get(art)}, ${m[1]})`);
		assert.notEqual(art, 'dark_orb', `${m[1]} vẫn dùng quả cầu đen chung`);
		assert.ok(hasVfx(art), `${m[1]}: hình ${art} chưa có trong buildVfx.ts (đạn tàng hình)`);
		shotArt.set(art, m[1]!);
	}
}
assert.ok(shotArt.size >= 4, 'Không đọc được bảng BOSS_SHOTS trong skills.ts');
const newOrb = [...orb].filter((b) => !OWED_ORB.has(b));
assert.deepEqual(newOrb, [], `Boss mới bắn chung quả cầu đen (dark_orb) — cần đòn riêng: ${newOrb.join(', ')}`);

// Hình chiêu boss: mỗi `look` chỉ thuộc MỘT boss.
const owners = new Map<string, Set<string>>();
for (const m of bosses.matchAll(/\["((?:boss|dragon)_[a-z0-9_]+)"\] = new\[\] \{(.*?)\},\r?\n/g))
	for (const s of m[2]!.matchAll(/BossSkill\(Shape\.\w+, "([a-z0-9_]+)"/g)) owners.set(s[1]!, (owners.get(s[1]!) ?? new Set()).add(m[1]!));
assert.ok(owners.size >= 20, 'Không đọc được bảng chiêu boss trong CombatSystem.Bosses.cs');
const missingLook = [...owners.keys()].filter((l) => !hasVfx(l));
assert.deepEqual(missingLook, [], `Hình chiêu boss chưa có trong buildVfx.ts: ${missingLook.join(', ')}`);
const shared = [...owners].filter(([look, who]) => who.size > 1 && !OWED_LOOK.has(look)).map(([look, who]) => `${look} (${[...who].join(', ')})`);
assert.deepEqual(shared, [], `Hình chiêu boss dùng chung — mỗi boss phải có chiêu riêng: ${shared.join('; ')}`);

const owedOrb = [...OWED_ORB].filter((b) => orb.has(b)).length;
const owedLook = [...OWED_LOOK].filter((l) => (owners.get(l)?.size ?? 0) > 1).length;
console.log(`PASS boss không đòn chung mới; còn nợ ${owedOrb} boss bắn cầu đen, ${owedLook} hình chiêu dùng chung (kế hoạch boss-unique-attacks)`);

// Chạy: npx tsx tests/skillIcons.test.ts — khoá icon chiêu riêng (game/combat/skillIconKeys.ts) khớp bảng khoá của
// pipeline (bộ v2: sources/pixellab/skill-icons-v2/skill_icons_v2.json): mọi kỹ năng, mọi nút bị động / tuyệt kỹ "sắp có",
// bí danh và biểu tượng dự phòng đều có ô vẽ; atlas đã xuất ở public (nếu có) chứa đủ khoá của bảng, ô 32×32; cỡ hiện
// (`skillIconFit`) luôn nguyên lần hoặc 1/n, đặt ở toạ độ nguyên.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fitScale, skillIconFit } from '../src/components/iconFit';
import { ENCHANT_EMPTY_KEY, nodeIconKey, SKILL_ICON_ALIAS, skillIconKey, STYLE_ICON_KEY, SWORD_HEAD_KEY } from '../src/game/combat/skillIconKeys';
import { HERO_SKILLS } from '../src/game/combat/skills';
import { BRANCHES, STYLE_TREE, SWORD_STYLES, TREE } from '../src/game/combat/talents';

let passed = 0;
function test(name: string, fn: () => void): void {
	fn();
	passed += 1;
	console.log(`  ✓ ${name}`);
}

const table = JSON.parse(readFileSync('../../packages/asset-pipeline/sources/pixellab/skill-icons-v2/skill_icons_v2.json', 'utf8')) as { icons: { key: string }[] };
const KEYS = new Set(table.icons.map((i) => i.key));

test('dạng khoá nút cây: kỹ năng, bị động, sắp có, Kiếm chưa chọn lưu phái', () => {
	assert.equal(nodeIconKey('fire_bolt', 'fire', 1), 'fire_bolt');
	assert.equal(nodeIconKey(undefined, 'fire', 2), 'passive:fire:2');
	assert.equal(nodeIconKey(undefined, 'fire', 10), 'future:fire:10');
	assert.equal(nodeIconKey(undefined, 'sword', 2), 'passive:sword:2');
	assert.equal(nodeIconKey(undefined, 'sword', 2, 'kiem_than'), 'passive:sword:2', 'mốc dưới 3 không theo lưu phái');
	assert.equal(nodeIconKey(undefined, 'sword', 7, 'thuy_than'), 'passive:sword:7:thuy_than');
	assert.equal(nodeIconKey(undefined, 'sword', 10, 'bac_than'), 'future:sword:10:bac_than');
	assert.equal(nodeIconKey(undefined, 'sword', 4), SWORD_HEAD_KEY);
	assert.equal(nodeIconKey(undefined, 'sword', 6), SWORD_HEAD_KEY);
	assert.equal(skillIconKey('dodge'), 'spare:aether:1');
});

test('mọi khoá web dùng đều có ô trong bảng khoá của pipeline', () => {
	const need = new Set<string>();
	for (const s of HERO_SKILLS) need.add(skillIconKey(s.id));
	for (const b of BRANCHES) for (const n of TREE[b]) need.add(nodeIconKey(n.skillId, b, n.tier));
	for (const s of SWORD_STYLES) for (const n of STYLE_TREE[s]) need.add(nodeIconKey(n.skillId, 'sword', n.tier, s));
	for (const k of Object.values(SKILL_ICON_ALIAS)) need.add(k);
	for (const k of Object.values(STYLE_ICON_KEY)) need.add(k);
	need.add(SWORD_HEAD_KEY);
	need.add(ENCHANT_EMPTY_KEY);
	const missing = [...need].filter((k) => !KEYS.has(k));
	assert.deepEqual(missing, [], `bảng khoá thiếu: ${missing.join(', ')}`);
	// Ngược lại: ô vẽ nào cũng có chỗ dùng (trừ dự phòng chưa gắn) — bắt khoá gõ sai trong bảng.
	const unused = [...KEYS].filter((k) => !need.has(k) && !['spare:aether:2', 'spare:aether:3'].includes(k));
	assert.deepEqual(unused, [], `ô vẽ không ai dùng: ${unused.join(', ')}`);
});

test('atlas đã xuất (public/assets/ui/skill-icons.json) chứa đủ khoá, hộp nằm trong ảnh', () => {
	const path = 'public/assets/ui/skill-icons.json';
	if (!existsSync(path)) {
		console.log('    (chưa xuất atlas — bỏ qua)');
		return;
	}
	const atlas = JSON.parse(readFileSync(path, 'utf8')) as Record<string, { x: number; y: number; w: number; h: number }>;
	const missing = [...KEYS].filter((k) => !atlas[k]);
	assert.deepEqual(missing, [], `atlas thiếu (ô vẽ hỏng bị pipeline bỏ?): ${missing.join(', ')}`);
	const png = readFileSync('public/assets/ui/skill-icons.png');
	const [W, H] = [png.readUInt32BE(16), png.readUInt32BE(20)];
	for (const [k, r] of Object.entries(atlas)) assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.w <= W && r.y + r.h <= H && r.w > 0 && r.h > 0, k);
	// Bộ v2: mọi ô 32×32, toạ độ chia hết 12 → thu ½ / ⅓ vẫn ra `background-position` nguyên.
	for (const [k, r] of Object.entries(atlas)) assert.ok(r.w === 32 && r.h === 32 && r.x % 12 === 0 && r.y % 12 === 0, `${k}: ${JSON.stringify(r)}`);
});

test('cỡ hiện icon 32: ô thanh kỹ năng 1×, ô to 2×, ô 28–31 vẫn 1× (lề trong suốt tràn), ô 14–27 thu ½ — luôn nguyên lần / 1/n, toạ độ nguyên', () => {
	const at = (box: number) => skillIconFit(32, 32, box);
	assert.equal(at(32).k, 1, 'thanh kỹ năng (ô trong 32×31), cây chiêu, chi tiết');
	assert.equal(at(44).k, 1, 'nút cảm ứng vừa');
	assert.equal(at(64).k, 2, 'nút cảm ứng to');
	for (const box of [28, 30, 31]) {
		const f = at(box);
		assert.equal(f.k, 1, `ô ${box}`);
		assert.deepEqual([f.outerW, f.outerH], [box, box], 'khung chiếm chỗ không vượt ô');
		assert.ok(f.left <= 0 && f.left >= -2, 'chỉ lề trong suốt (≤ 2px) tràn ra');
	}
	for (const box of [14, 16, 18, 20, 22, 24, 26, 27]) assert.equal(at(box).k, 1 / 2, `ô ${box}`);
	for (let box = 8; box <= 130; box += 1) {
		const f = at(box);
		assert.ok(Number.isInteger(f.k) || Number.isInteger(1 / f.k), `ô ${box}: tỉ lệ ${f.k}`);
		assert.ok([f.w, f.h, f.outerW, f.outerH, f.left, f.top].every(Number.isInteger), `ô ${box}: toạ độ / cỡ nguyên`);
		assert.ok(f.outerW <= box && f.outerH <= box, `ô ${box}: khung ≤ ô`);
	}
	// Ảnh khác (icon tạm, ảnh UI) vẫn theo `fitScale` cũ: không bao giờ ×0,8.
	assert.equal(fitScale(49, 49, 24), 1 / 2, 'ảnh 49 thu ½ = 24 vừa ô 24');
	assert.equal(fitScale(49, 49, 23), 1 / 3);
	assert.equal(fitScale(20, 20, 44), 2);
});

console.log(`\n${passed} test qua.`);

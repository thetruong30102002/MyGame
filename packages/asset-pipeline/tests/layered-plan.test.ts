// Chạy: npx tsx tests/layered-plan.test.ts — bảng kế hoạch vẽ (src/layered/plan.ts) bị chặn khi lệch chuẩn, trước khi tiêu lượt.
import assert from 'node:assert/strict';
import { blockingStage, itemArgs, loadPlan, validatePlan, type SamplePlan } from '../src/layered/plan.js';
import { loadLayeredStandard } from '../src/layered/standard.js';

let passed = 0;
const test = (name: string, fn: () => void): void => {
	fn();
	passed += 1;
	console.log(`  ✔ ${name}`);
};
console.log('layered-plan');

const std = loadLayeredStandard();
const real = loadPlan('mau-1');
const broken = (mutate: (p: SamplePlan) => void, expect: string): void => {
	const p = structuredClone(real);
	mutate(p);
	const errors = validatePlan(p, std);
	assert.ok(errors.some((e) => e.includes(expect)), `mong lỗi chứa "${expect}", nhận: ${JSON.stringify(errors)}`);
};
const A = (p: SamplePlan) => p.stages.A!.items;
const EDIT = 0;
const CREATE = 1;
const WALK = 4;

test('bảng mẫu 1 đạt chuẩn; prompt chèn từ chuẩn', () => {
	assert.deepEqual(validatePlan(real, std), []);
	assert.equal(itemArgs(A(real)[EDIT]!, std).description, std.prompts.baseMaleEdit);
	assert.equal(itemArgs(A(real)[CREATE]!, std).description, std.prompts.baseMale);
});

test('cấm tạo nhân vật chỉ bằng chữ: create_character phải có ảnh tham chiếu sửa từ ảnh mẫu', () => {
	broken((p) => delete A(p)[CREATE]!.reference, 'cấm tạo chỉ bằng chữ');
	broken((p) => (A(p)[CREATE]!.reference = 'A2-walk-S'), 'cấm tạo chỉ bằng chữ');
	broken((p) => (A(p)[CREATE]!.pick = 999), 'không phải seed');
});

test('tham số xoay khớp chuẩn; không truyền size; cấm ghi description / ảnh tay', () => {
	broken((p) => (A(p)[CREATE]!.args.view = 'side'), 'args.view');
	broken((p) => (A(p)[CREATE]!.args.size = 88), 'không truyền size');
	broken((p) => (A(p)[CREATE]!.args.description = 'tóc nâu'), 'description');
	broken((p) => (A(p)[EDIT]!.args.image_base64 = 'abc'), 'description / ảnh tay');
});

test('sửa ảnh mẫu: đúng prompt sửa, ảnh mẫu đã chốt, seed không trùng, lượt = số bản', () => {
	broken((p) => (A(p)[EDIT]!.prompt = 'baseMale'), 'baseMaleEdit');
	broken((p) => delete A(p)[EDIT]!.source, 'source');
	broken((p) => (A(p)[EDIT]!.seeds = [1, 1]), 'không trùng');
	broken((p) => (A(p)[EDIT]!.estimate = 5), 'bằng số bản');
});

test('động tác: đúng template, ai_freedom 0, chỉ hướng vẽ thật, trỏ đúng nhân vật', () => {
	broken((p) => (A(p)[WALK]!.args.template_animation_id = 'walking-6-frames'), 'walking-8-frames');
	broken((p) => (A(p)[WALK]!.args.ai_freedom = 200), 'ai_freedom');
	broken((p) => (A(p)[WALK]!.args.directions = ['west']), 'không phải hướng vẽ thật');
	broken((p) => (A(p)[WALK]!.character = 'khong-co'), 'create_character');
});

const B = (p: SamplePlan) => p.stages.B!.items;
const OUTFIT_EDIT = 0;
const OUTFIT_CHAR = 1;
const HEAD_CHAR = 3;

test('xoay ảnh có tóc phải dùng heroMale (baseMale ghi bald), đủ hair / raceFeatures / outfit', () => {
	assert.ok(!(itemArgs(A(real)[HEAD_CHAR]!, std).description as string).includes('bald'));
	assert.ok((itemArgs(B(real)[OUTFIT_CHAR]!, std).description as string).includes('swordsman'));
	broken((p) => (A(p)[HEAD_CHAR]!.prompt = 'baseMale'), 'heroMale');
	broken((p) => delete B(p)[OUTFIT_CHAR]!.outfit, 'cần hair, raceFeatures, outfit');
});

test('sửa đồ: từ bản đầu đã chọn, có outfit', () => {
	assert.ok((itemArgs(B(real)[OUTFIT_EDIT]!, std).description as string).startsWith('Change ONLY the clothes: dress this character in a simple beginner swordsman'));
	broken((p) => (B(p)[OUTFIT_EDIT]!.sourceItem = 'A0-base-edit'), 'headEdit');
	broken((p) => (B(p)[OUTFIT_EDIT]!.sourcePick = 404), 'sourcePick');
	broken((p) => delete B(p)[OUTFIT_EDIT]!.outfit, 'cần outfit');
	broken((p) => (B(p)[OUTFIT_EDIT]!.outfit = 'x'.repeat(400)), 'PixelLab chỉ nhận');
});

test('cổng duyệt: chặng sau chỉ chạy khi mọi chặng trước đã duyệt', () => {
	assert.equal(blockingStage(real, 'A'), null);
	assert.equal(blockingStage(real, 'B'), null);
	const p = structuredClone(real);
	delete p.stages.A!.approved;
	assert.equal(blockingStage(p, 'B'), 'A');
	assert.equal(blockingStage(p, 'A'), null);
});

test('vượt ngân sách chặng (kể cả hệ số vẽ lại) thì chặn', () => {
	broken((p) => (A(p)[CREATE]!.estimate = 10), 'vượt ngân sách');
});

test('nghiêm cấm áo đội mũ (06/11/2026): bộ đồ có mũ trùm / mũ / mũ giáp bị chặn; "no hood" và ngoại lệ cũ có lý do thì qua', () => {
	const U = (p: SamplePlan) => p.stages.U!.items;
	const sword = (p: SamplePlan) => U(p).find((i) => i.id === 'U2-sword-outfit-S')!;
	broken((p) => (sword(p).outfit = 'a red tunic with a hood up over the head'), 'áo đội mũ');
	broken((p) => (sword(p).outfit = 'plate armor and a steel helmet'), 'áo đội mũ');
	broken((p) => (sword(p).outfit = 'a leather jacket and a wide brim hat'), 'áo đội mũ');
	const ok = structuredClone(real);
	sword(ok).outfit = 'a red tunic, no hood, no hat';
	assert.deepEqual(validatePlan(ok, std), []);
	broken((p) => delete U(p).find((i) => i.legacyHood)!.legacyHood, 'áo đội mũ');
});

console.log(`${passed} nhóm kiểm đạt`);

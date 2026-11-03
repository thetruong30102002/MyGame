// Chạy: npx tsx tests/layered-standard.test.ts — chuẩn nhân vật ghép lớp (src/layered/standard.ts) chặn cấu hình sai trước khi vẽ / build.
import assert from 'node:assert/strict';
import { createImage, getPixel, setPixel } from '../src/image/rgba.js';
import {
	clipDurationMs, frameAt, loadLayeredStandard, mirrorDir, mirrorImage, mirrorKeypoints, mirrorX, validateLayeredStandard, type LayeredStandard,
} from '../src/layered/standard.js';

let passed = 0;
const test = (name: string, fn: () => void): void => {
	fn();
	passed += 1;
	console.log(`  ✔ ${name}`);
};
console.log('layered-standard');

const real = loadLayeredStandard();
/** Bản sao sửa một chỗ rồi kiểm — phải ra đúng lỗi có chứa `expect`. */
const broken = (mutate: (s: LayeredStandard) => void, expect: string): void => {
	const s = structuredClone(real);
	mutate(s);
	const errors = validateLayeredStandard(s);
	assert.ok(errors.some((e) => e.includes(expect)), `mong lỗi chứa "${expect}", nhận: ${JSON.stringify(errors)}`);
};

test('chuẩn trong repo hợp lệ', () => {
	assert.deepEqual(validateLayeredStandard(real), []);
	assert.equal(real.pixel.ppu, 48);
	assert.equal(real.directions.length, 8);
});

test('cấm scale / offset riêng / xoay vũ khí bằng code; vũ khí luôn phía trước', () => {
	broken((s) => (s.pixel.runtimeScale = 2), 'runtimeScale');
	broken((s) => (s.pixel.allowRuntimeOffsetPerAsset = true), 'allowRuntimeOffsetPerAsset');
	broken((s) => (s.pixel.allowResample = true), 'allowResample');
	broken((s) => (s.weapon.rotateInCode = true), 'rotateInCode');
	broken((s) => (s.weapon.defaultLayer = 'back'), 'defaultLayer');
});

test('lật hướng: vẽ S/SE/E/NE/N, lật SW/W/NW đúng ảnh gương', () => {
	assert.deepEqual([...real.generation.drawDirections].sort(), ['E', 'N', 'NE', 'S', 'SE']);
	const dir = (s: LayeredStandard, id: string) => s.directions.find((d) => d.id === id)!;
	broken((s) => (dir(s, 'W').mirrorOf = 'NE'), 'ảnh gương');
	broken((s) => (dir(s, 'S').mirrorOf = 'S'), 'hướng S phải vẽ thật');
	broken((s) => ((dir(s, 'E').mirrorOf = 'W'), (s.generation.drawDirections = ['S', 'SE', 'NE', 'N'])), 'không phải hướng vẽ thật');
	broken((s) => (s.generation.mirrorDirections = false), 'không hướng nào được mirrorOf');
	broken((s) => (s.generation.drawDirections = ['S', 'E', 'N']), 'drawDirections');
});

test('hàm lật: hướng, toạ độ, khung xương, ảnh nguyên pixel', () => {
	assert.equal(mirrorDir('E'), 'W');
	assert.equal(mirrorDir('NE'), 'NW');
	assert.equal(mirrorDir('S'), 'S');
	assert.equal(mirrorX(64, 64), 64, 'cột root giữ nguyên');
	assert.equal(mirrorX(70, 64), 58);
	const kp = mirrorKeypoints([{ label: 'RIGHT ARM', x: 0.7, y: 0.5 }, { label: 'NECK', x: 0.5, y: 0.2 }]);
	assert.deepEqual(kp.map((k) => k.label), ['LEFT ARM', 'NECK']);
	assert.ok(Math.abs(kp[0]!.x - 0.3) < 1e-9);
	const img = createImage(8, 2);
	setPixel(img, 5, 1, [10, 20, 30, 255]);
	const m = mirrorImage(img, 4);
	assert.deepEqual([...getPixel(m, 3, 1)], [10, 20, 30, 255]);
	assert.equal(getPixel(m, 5, 1)[3], 0);
	setPixel(img, 0, 0, [1, 1, 1, 255]);
	assert.throws(() => mirrorImage(img, 4), /lật ra ngoài ô/, 'cột 0 có hình thì phải báo lỗi, không cắt im lặng');
});

test('cell và root', () => {
	broken((s) => (s.cell.root = [76, 144]), 'giữa bề ngang');
	broken((s) => (s.cell.root = [80, 156]), '8px dưới chân');
	broken((s) => (s.cell.root = [80, 120]), 'quá thấp');
	broken((s) => (s.cell.root = [80, 200]), 'ngoài cell');
	broken((s) => ((s.cell.width = 64), (s.cell.root = [32, 112])), 'nhỏ hơn canvas sinh ảnh');
});

test('đủ 8 hướng đúng tên PixelLab', () => {
	broken((s) => s.directions.pop(), 'đủ 8 hướng');
	broken((s) => (s.directions[0]!.pixellab = 'north'), 'directions.S');
});

test('chuẩn đầu: neo giữa canvas, đủ chỗ cổ da, đo má trước khi duyệt', () => {
	broken((s) => (s.head.neckAnchor = [23, 40]), 'giữa bề ngang canvas đầu');
	broken((s) => (s.head.neckAnchor = [24, 46]), 'cổ da');
	broken((s) => (s.head.neckAnchor = [24, 50]), 'ngoài canvas đầu');
	broken((s) => (s.status = 'approved'), 'cheekWidthPx');
});

test('thứ tự lớp: hairBack < body < head < bodyFront', () => {
	broken((s) => (s.layers = s.layers.filter((l) => l.id !== 'head')), 'thiếu lớp bắt buộc "head"');
	broken((s) => (s.layers.find((l) => l.id === 'body')!.optional = true), 'không được optional');
	broken((s) => {
		const head = s.layers.find((l) => l.id === 'head')!;
		const body = s.layers.find((l) => l.id === 'body')!;
		[head.z, body.z] = [body.z, head.z];
		s.layers.sort((a, b) => a.z - b.z);
	}, 'head phải nằm trên body');
	broken((s) => (s.layers[3]!.z = s.layers[2]!.z), 'z tăng dần');
});

test('khung xương đủ 18 khớp COCO-18', () => {
	broken((s) => (s.skeleton.joints = s.skeleton.joints.slice(1)), 'COCO-18');
});

test('clip: số frame, thời lượng, pha chém liền và nhịp lấy lực chậm → chạm nhanh', () => {
	const slash = (s: LayeredStandard) => s.animations.find((a) => a.id === 'slash')!;
	broken((s) => slash(s).durationsMs.pop(), 'cần 15');
	broken((s) => (slash(s).frames = 16), 'chỉ nhận 3–15 frame');
	broken((s) => (slash(s).hitFrame = 13), 'pha impact');
	broken((s) => (slash(s).phases!.accelerate = [7, 8]), 'nối liền');
	broken((s) => (slash(s).durationsMs = slash(s).durationsMs.map(() => 50)), 'chậm rõ hơn impact');
	broken((s) => (s.animations = s.animations.filter((a) => a.id !== 'walk')), '"walk"');
});

test('chống đầu dính áo: prompt cởi trần / đầu trọc / cấm cổ áo, Q8 = 0', () => {
	broken((s) => (s.qa.headForeignColorPxMax = 3), 'dính áo');
	broken((s) => (s.prompts.baseMale = s.prompts.baseMale.replace('completely bald smooth head with no hair', 'short brown hair')), 'bald');
	broken((s) => (s.prompts.baseFemale = s.prompts.baseFemale.replace('no hood, ', '')), 'collar / scarf / hood');
	broken((s) => (s.prompts.headEdit = 'Give him short hair and a leather collar.'), 'chỉ đổi phần đầu');
});

test('cổ không dài: prompt short neck, cấm cụm làm dài cổ, thước 2–5px', () => {
	assert.deepEqual(real.body.neckLengthPx, [2, 5]);
	broken((s) => (s.prompts.baseMale = s.prompts.baseMale.replace('natural short neck in normal proportion, not long', 'short head, a long neck')), 'long neck');
	broken((s) => (s.prompts.baseFemale = s.prompts.baseFemale.replace('natural short neck', 'natural neck')), 'short neck');
	broken((s) => (s.prompts.forbiddenWords = ['long neck']), 'forbiddenWords');
	broken((s) => (s.body.neckLengthPx = [2, 9]), 'neckLengthPx');
});

test('đầu có khung riêng khi chạy, cùng template với thân', () => {
	assert.deepEqual(real.head.animatedClips, ['run']);
	broken((s) => (s.head.animatedClips = []), 'chạy cần khung đầu riêng');
	broken((s) => (s.head.animatedClips = ['run', 'slash']), 'phải là clip template');
	broken((s) => (s.head.animatedClips = ['run', 'swim']), 'không có clip này');
	broken((s) => (s.frameMeta.required = s.frameMeta.required.filter((f) => f !== 'headFrame')), 'headFrame');
});

test('khoá phong cách: chỉ tạo từ ảnh mẫu NPC tóc trắng, prompt sửa giữ mặt anime', () => {
	assert.equal(real.style.reference.male, 'npc_silver_youth/idle_S_0');
	broken((s) => (s.generation.method = 'text'), 'cấm tạo nhân vật chỉ bằng chữ');
	broken((s) => (s.style.textOnlyForbidden = false), 'textOnlyForbidden');
	broken((s) => (s.style.reference.male = 'player_verdant_sword/idle_S_0'), 'NPC tóc trắng');
	broken((s) => (s.prompts.baseMaleEdit = s.prompts.baseMaleEdit.replace('same anime face', 'same face')), 'mặt anime');
});

test('đồ thân gốc: nam quần đùi, nữ bikini quai qua vai (cấm halter), người lớn không gợi dục', () => {
	broken((s) => (s.prompts.baseMaleEdit = s.prompts.baseMaleEdit.replace('shorts', 'trousers')), 'quần đùi');
	broken((s) => (s.prompts.baseFemaleEdit = s.prompts.baseFemaleEdit.replace(/bikini/g, 'swimsuit')), 'bikini');
	broken((s) => (s.prompts.baseFemale = s.prompts.baseFemale.replace('no halter neck tie, ', '')), 'halter');
	broken((s) => (s.prompts.baseFemaleEdit = s.prompts.baseFemaleEdit.replace('modest and non-sexualized', 'stylish')), 'không gợi dục');
});

test('mọi đầu mắt nâu', () => {
	broken((s) => (s.prompts.headEdit = s.prompts.headEdit.replace(', brown eyes', '')), 'mắt nâu');
});

test('sửa đồ / xoay nhân vật có tóc: chỉ đổi quần áo, cổ áo dưới cổ, không ghi bald, không vẽ vũ khí', () => {
	broken((s) => (s.prompts.outfitEdit = s.prompts.outfitEdit.replace('below the neck', 'at the neck')), 'cổ áo dưới cổ');
	broken((s) => (s.prompts.outfitEdit = s.prompts.outfitEdit.replace('no collar, ', '')), 'collar');
	broken((s) => (s.prompts.outfitEdit = s.prompts.outfitEdit.replace('{outfit}', 'armor')), '{outfit}');
	broken((s) => (s.prompts.heroMale = `bald ${s.prompts.heroMale}`), 'không được ghi bald');
	broken((s) => (s.prompts.heroMale = s.prompts.heroMale.replace(', no weapon', '')), 'vũ khí');
});

test('QA và ngân sách lượt', () => {
	broken((s) => (s.qa.headRemovedAbovePx = 2), 'headRemovedAbovePx');
	broken((s) => (s.qa.sourcePixelsOnly = false), 'sourcePixelsOnly');
	broken((s) => (s.budget.rounds[0]!.gate = ''), 'cổng duyệt');
});

test('frameAt theo thời lượng từng frame (không FPS đều)', () => {
	const slash = real.animations.find((a) => a.id === 'slash')!;
	assert.equal(clipDurationMs(slash), 755);
	assert.equal(frameAt(slash, 0), 1);
	assert.equal(frameAt(slash, 79), 1);
	assert.equal(frameAt(slash, 80), 2);
	assert.equal(frameAt(slash, 10_000), 15, 'clip không lặp giữ frame cuối');
	const walk = real.animations.find((a) => a.id === 'walk')!;
	assert.equal(frameAt(walk, 850), 1, 'clip lặp quay vòng');
});

console.log(`${passed} nhóm kiểm đạt`);

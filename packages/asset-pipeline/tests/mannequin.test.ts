// Kiểm dữ liệu thật đã sinh, không giả lập Unity hoặc chứng nhận chất lượng neo tự động.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { blit, createImage, crop, getPixel, opaqueBounds, readPng, writePng, type RGBAImage } from '../src/image/rgba.js';

const root = resolve(import.meta.dirname, '../../..');
const source = join(root, 'assets/mannequin');
const dest = join(root, '.aether-stage/mannequin');
const catalog = JSON.parse(readFileSync(join(source, 'catalog.json'), 'utf8'));
const annotations = JSON.parse(readFileSync(join(root, 'packages/asset-pipeline/src/mannequin/anchors.json'), 'utf8'));
assert.equal(catalog.template, 'adult-112-authored-v1');
assert.deepEqual(catalog.frameSize, [112, 112]);
assert.deepEqual(catalog.anchor, [56, 100]);
assert.equal(catalog.ppu, 48);
assert.deepEqual(catalog.outfits.map((x: { id: string }) => x.id), ['starter']);
assert.deepEqual(catalog.weapons.map((x: { action: string }) => x.action), ['attack', 'cast']);
assert.equal(catalog.identities.length, 2);
assert.equal(catalog.reviewRequired, true);
for (const part of ['moonsteel-sword', 'aether-staff', 'silver-male', 'silver-female']) {
	const art = readPng(join(source, 'parts', part + '.png'));
	assert.ok(opaqueBounds(art), `Mảnh mới rỗng: ${part}`);
	for (let k = 3; k < art.data.length; k += 4) assert.ok(art.data[k] === 0 || art.data[k] === 255, `Alpha mờ: ${part}`);
}
for (const sex of ['male', 'female']) for (const dir of ['S', 'W', 'N', 'E']) {
	const art = readPng(join(source, 'rework', `midnight-${sex}-${dir}.png`));
	assert.equal(art.width, 112); assert.equal(art.height, 112);
	const box = opaqueBounds(art);
	assert.ok(box && box.y1 === 100 && box.y0 === 26, `Sai chiều cao/root Dạ Ngân: ${sex}/${dir}`);
	for (let k = 3; k < art.data.length; k += 4) assert.ok(art.data[k] === 0 || art.data[k] === 255);
}
let poseCount = 0, imageChecks = 0;
const matrix = createImage(8 * 112, 4 * 112);
const directionsPreview = createImage(8 * 112, 16 * 112);
const hairPreview = createImage(8 * 112, 2 * 112);
let row = 0, dirRow = 0;
for (const identity of catalog.identities) {
    let hairDifferences = 0, addedHairPixels = 0;
	const names: string[] = JSON.parse(readFileSync(join(source, identity.id + '-slices.json'), 'utf8'));
	assert.equal(names.length, new Set(names).size);
	const pages: RGBAImage[] = [];
	for (let p = 0; p < Math.ceil(names.length / 256); p++) {
		const page = readPng(join(source, `${identity.id}-${p}.png`));
		assert.equal(page.width, 1792); assert.equal(page.height, 1792);
		pages.push(page);
	}
	const image = (name: string): RGBAImage => {
		const i = names.indexOf(name);
		assert.ok(i >= 0, `Thiếu lớp ${identity.id}/${name}`);
		return crop(pages[Math.floor(i / 256)]!, i % 16 * 112, Math.floor(i % 256 / 16) * 112, 112, 112);
	};
	for (const action of ['idle', 'walk', 'attack', 'cast']) {
		const sequences = identity.sequences.filter((s: { action: string }) => s.action === action);
		assert.deepEqual(sequences.map((s: { direction: string }) => s.direction), action === 'idle' || action === 'walk' ? catalog.directions : ['S', 'W', 'N', 'E']);
		for (const sequence of sequences) {
			assert.ok(sequence.fps > 0);
			const hashes = new Set();
			for (const frame of sequence.frames) {
				poseCount++;
				const body = image(frame.name + '_starter'), head = image(frame.name + '_identity');
				const combined = createImage(112, 112); blit(combined, body, 0, 0); blit(combined, head, 0, 0);
				assert.equal(createHash('sha256').update(combined.data).digest('hex'), frame.hash, `Pixel mất / sai màu: ${frame.name}`);
				hashes.add(frame.hash);
				for (const part of [frame.root, frame.neck, frame.grip]) assert.ok(part.every((v: number) => Number.isInteger(v) && v >= 0 && v < 112));
				assert.equal(frame.anchorsReviewed, annotations[`${identity.id}/${frame.name}`]?.reviewed === true, 'Không chứng nhận tự động điểm nắm');
				const file = frame.source.split('#')[0];
				assert.ok(existsSync(join(root, file)), file);
				const silver = image(frame.name + '_silver');
				if (!Buffer.from(head.data).equals(Buffer.from(silver.data))) hairDifferences++;
				for (let k = 3; k < body.data.length; k += 4) {
					if (!head.data[k] && silver.data[k]) addedHairPixels++;
				}
				for (const layer of [silver]) for (let k = 3; k < layer.data.length; k += 4)
					assert.ok(layer.data[k] === 0 || layer.data[k] === 255, 'Asset native phải có alpha cứng');
				for (const w of catalog.weapons) {
					const weapon = image(frame.name + '_' + w.id);
					assert.ok(opaqueBounds(weapon), 'Vũ khí rỗng');
					for (const outfit of catalog.outfits) {
						const dressed = image(frame.name + '_' + outfit.id);
						assert.ok(opaqueBounds(dressed));
						imageChecks++;
					}
				}
			}
			if (action === 'attack' || action === 'cast') assert.ok(hashes.size >= 4, 'Động tác không có đủ pose khác nhau');
		}
	}
    assert.equal(hairDifferences, 160, `Tóc mới thiếu pose: ${identity.id}`);
    assert.ok(addedHairPixels > 1000, `Tóc mới chưa có đường viền riêng: ${identity.id}`);
	// Ma trận Nam/Nữ × bộ đồ × vũ khí, 8 khung đầy đủ hướng S.
	for (const outfit of catalog.outfits) for (const w of catalog.weapons) {
		const seq = identity.sequences.find((s: { action: string; direction: string }) => s.action === w.action && s.direction === 'S');
		for (const [i, frame] of seq.frames.entries()) {
			const composed = createImage(112, 112);
			if (frame.weaponOrder < 0) blit(composed, image(frame.name + '_' + w.id), 0, 0);
			blit(composed, image(frame.name + '_' + outfit.id), 0, 0);
			if (frame.weaponOrder >= 0) blit(composed, image(frame.name + '_' + w.id), 0, 0);
			blit(composed, image(frame.name + '_identity'), 0, 0);
			blit(matrix, composed, i * 112, row * 112);
		}
		row++;
	}
	for (const outfit of catalog.outfits) {
		const seq = identity.sequences.find((s: { action: string; direction: string }) => s.action === 'idle' && s.direction === 'S');
		for (const [i, frame] of seq.frames.entries()) {
			const composed = createImage(112, 112);
			blit(composed, image(frame.name + '_' + outfit.id), 0, 0);
			blit(composed, image(frame.name + '_silver'), 0, 0);
			const hairRow = identity.id.endsWith('_f') ? 1 : 0;
			blit(hairPreview, composed, i * 112, hairRow * 112);
		}
	}
	for (const w of catalog.weapons) for (const dir of ['S', 'W', 'N', 'E']) {
		const seq = identity.sequences.find((s: { action: string; direction: string }) => s.action === w.action && s.direction === dir);
		for (const [i, frame] of seq.frames.entries()) {
			const composed = createImage(112, 112);
			if (frame.weaponOrder < 0) blit(composed, image(frame.name + '_' + w.id), 0, 0);
			blit(composed, image(frame.name + '_starter'), 0, 0);
			if (frame.weaponOrder >= 0) blit(composed, image(frame.name + '_' + w.id), 0, 0);
			blit(composed, image(frame.name + '_identity'), 0, 0);
			// Tọa độ nắm là ứng viên, không phải chứng nhận mỹ thuật.
			for (const [x, y] of [frame.grip]) {
				assert.ok(getPixel(composed, x, y)[3] > 0 || !frame.anchorsReviewed);
			}
			blit(directionsPreview, composed, i * 112, dirRow * 112);
		}
		dirRow++;
	}
}
assert.equal(poseCount, 320);
assert.equal(imageChecks, 640);
mkdirSync(dest, { recursive: true });
writePng(join(dest, 'matrix.png'), matrix);
writePng(join(dest, 'directions-preview.png'), directionsPreview);
writePng(join(dest, 'hair-preview.png'), hairPreview);
const report = { result: 'PASS_DATA_ONLY', poses: poseCount, combinationsChecked: imageChecks, unityRuntime: 'BLOCKED_LICENSE', anchors: 'UNREVIEWED', directionArt: 'REQUIRES_CORRECTION', acceptance: 'NOT_PASSED' };
writeFileSync(join(dest, 'validation.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report));

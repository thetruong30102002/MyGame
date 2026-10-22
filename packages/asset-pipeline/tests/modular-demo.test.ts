// Kiểm mẫu lắp đồ ở pixel thật: thay Outfit/tóc độc lập, không để mảnh rời.
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { blit, createImage, readPng, type RGBAImage } from '../src/image/rgba.js';

const root = resolve(import.meta.dirname, '../../..');
const dir = join(root, 'assets/mannequin/modular/native');
const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
assert.deepEqual(manifest.frameSize, [112, 112]);
assert.deepEqual(manifest.root, [56, 100]);
assert.equal(manifest.status, 'art-review-only');
assert.deepEqual(Object.keys(manifest.outfits), ['midnight', 'ranger']);
assert.deepEqual(manifest.hair, ['hair_chestnut', 'hair_silver']);
for (const file of Object.values(manifest.weapons) as string[])
	assert.ok(existsSync(resolve(dir, file)), `Thiếu vũ khí độc lập: ${file}`);

function componentCount(img: RGBAImage): number {
	const seen = new Uint8Array(img.width * img.height);
	let count = 0;
	for (let i = 0; i < seen.length; i++) {
		if (seen[i] || img.data[i * 4 + 3] === 0) continue;
		count++;
		const stack = [i]; seen[i] = 1;
		while (stack.length) {
			const at = stack.pop()!, x = at % img.width, y = Math.floor(at / img.width);
			for (let yy = Math.max(0, y - 1); yy <= Math.min(img.height - 1, y + 1); yy++)
				for (let xx = Math.max(0, x - 1); xx <= Math.min(img.width - 1, x + 1); xx++) {
					const next = yy * img.width + xx;
					if (seen[next] || img.data[next * 4 + 3] === 0) continue;
					seen[next] = 1; stack.push(next);
				}
		}
	}
	return count;
}

let combinations = 0;
for (const sex of ['male', 'female']) {
	const parts = new Map<string, RGBAImage>();
	for (const def of manifest.identities.find((x: { identity: string }) => x.identity === sex).parts) {
		const art = readPng(join(dir, `${sex}_${def.id}.png`));
		assert.equal(art.width, 112); assert.equal(art.height, 112);
		for (let k = 3; k < art.data.length; k += 4) assert.ok(art.data[k] === 0 || art.data[k] === 255, `${sex}/${def.id}: alpha mờ`);
		parts.set(def.id, art);
	}
	const variants = new Map<string, RGBAImage>();
	for (const outfit of Object.keys(manifest.outfits)) for (const hair of manifest.hair as string[]) {
		const composed = createImage(112, 112);
		for (const id of [...manifest.outfits[outfit], 'face', hair]) blit(composed, parts.get(id)!, 0, 0);
		const saved = readPng(join(dir, `assembled_${sex}_${outfit}_${hair}.png`));
		assert.ok(Buffer.from(composed.data).equals(Buffer.from(saved.data)), `${sex}/${outfit}/${hair}: ghép sai lớp`);
		assert.equal(componentCount(saved), 1, `${sex}/${outfit}/${hair}: có mảnh rời`);
		variants.set(`${outfit}/${hair}`, saved);
		combinations++;
	}
	for (const hair of manifest.hair as string[])
		assert.ok(!Buffer.from(variants.get(`midnight/${hair}`)!.data).equals(Buffer.from(variants.get(`ranger/${hair}`)!.data)), `${sex}: Outfit không đổi`);
	for (const outfit of Object.keys(manifest.outfits))
		assert.ok(!Buffer.from(variants.get(`${outfit}/hair_chestnut`)!.data).equals(Buffer.from(variants.get(`${outfit}/hair_silver`)!.data)), `${sex}: tóc không đổi`);
	for (const weapon of Object.keys(manifest.weapons)) {
		const armed = readPng(join(dir, `assembled_${sex}_midnight_${weapon}.png`));
		assert.equal(componentCount(armed), 1, `${sex}/${weapon}: vũ khí rời khỏi tay`);
	}
}
assert.equal(combinations, 8);
console.log(`PASS art review: ${combinations} tổ hợp Nam/Nữ × Outfit × tóc, alpha cứng, cùng neo, không mảnh rời.`);

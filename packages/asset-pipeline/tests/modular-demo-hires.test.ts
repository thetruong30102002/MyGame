import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { blit, createImage, readPng, type RGBAImage } from '../src/image/rgba.js';

const root = resolve(import.meta.dirname, '../../..');
const dir = join(root, 'assets/mannequin/modular/native-224');
const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8'));
assert.deepEqual(manifest.frameSize, [224, 224]);
assert.deepEqual(manifest.root, [112, 200]);

function components(img: RGBAImage): number {
  const seen = new Uint8Array(img.width * img.height);
  let count = 0;
  for (let i = 0; i < seen.length; i++) {
    if (seen[i] || !img.data[i * 4 + 3]) continue;
    count++;
    const stack = [i]; seen[i] = 1;
    while (stack.length) {
      const at = stack.pop()!, x = at % img.width, y = Math.floor(at / img.width);
      for (let yy = Math.max(0, y - 1); yy <= Math.min(img.height - 1, y + 1); yy++)
        for (let xx = Math.max(0, x - 1); xx <= Math.min(img.width - 1, x + 1); xx++) {
          const next = yy * img.width + xx;
          if (seen[next] || !img.data[next * 4 + 3]) continue;
          seen[next] = 1; stack.push(next);
        }
    }
  }
  return count;
}

for (const sex of ['male', 'female']) {
  const parts = new Map<string, RGBAImage>();
  for (const def of manifest.identities.find((item: { identity: string }) => item.identity === sex).parts) {
    const part = readPng(join(dir, `${sex}_${def.id}.png`));
    assert.deepEqual([part.width, part.height], [224, 224]);
    for (let i = 3; i < part.data.length; i += 4) assert.ok(part.data[i] === 0 || part.data[i] === 255, `${sex}/${def.id}: alpha mờ`);
    parts.set(def.id, part);
  }
  for (const outfit of ['midnight', 'ranger']) for (const hair of ['hair_chestnut', 'hair_silver']) {
    const composed = createImage(224, 224);
    for (const id of [`${outfit}_lower`, `${outfit}_upper`, 'face', hair]) blit(composed, parts.get(id)!, 0, 0);
    const saved = readPng(join(dir, `assembled_${sex}_${outfit}_${hair}.png`));
    assert.ok(Buffer.from(composed.data).equals(Buffer.from(saved.data)), `${sex}/${outfit}/${hair}: ghép sai`);
    assert.equal(components(saved), 1, `${sex}/${outfit}/${hair}: có mảnh rời`);
  }
}
console.log('PASS art review 224 px: 8 tổ hợp tái ghép đúng từ mảng riêng, alpha cứng, một khối liền.');

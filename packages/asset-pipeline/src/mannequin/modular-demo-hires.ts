// Bộ mảng độc lập cho trang review, lấy nhiều chi tiết hơn từ tranh nguồn.
// Không thay thế bộ sprite runtime 112px cho đến khi có đủ hướng và animation.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { blit, createImage, getPixel, setPixel, writePng, type RGBAImage } from '../image/rgba.js';
import { nativeCutout } from './art.js';

type Part = { id: string; file: string; width: number; height: number; x: number; y: number };
const root = resolve(import.meta.dirname, '../../../..');
const source = join(root, 'assets/mannequin/modular/source-art');
const weaponSource = join(root, 'assets/mannequin/source-art');
const output = join(root, 'assets/mannequin/modular/native-224');
const frame = 224;
const previewScale = 2;
mkdirSync(output, { recursive: true });

const original: Record<string, Part[]> = {
  male: [
    { id: 'face', file: 'male-face.png', width: 17, height: 19, x: 48, y: 30 },
    { id: 'midnight_upper', file: 'male-midnight-upper.png', width: 38, height: 34, x: 37, y: 42 },
    { id: 'midnight_lower', file: 'male-midnight-lower.png', width: 25, height: 39, x: 44, y: 61 },
    { id: 'ranger_upper', file: 'male-ranger-upper.png', width: 38, height: 34, x: 37, y: 42 },
    { id: 'ranger_lower', file: 'male-ranger-lower.png', width: 25, height: 39, x: 44, y: 61 },
    { id: 'hair_chestnut', file: 'male-chestnut-hair-v2.png', width: 31, height: 27, x: 41, y: 22 },
    { id: 'hair_silver', file: 'male-silver-hair-v2.png', width: 34, height: 29, x: 39, y: 21 },
  ],
  female: [
    { id: 'face', file: 'female-face.png', width: 17, height: 19, x: 48, y: 30 },
    { id: 'midnight_upper', file: 'female-midnight-upper.png', width: 42, height: 34, x: 35, y: 42 },
    { id: 'midnight_lower', file: 'female-midnight-lower.png', width: 30, height: 39, x: 41, y: 61 },
    { id: 'ranger_upper', file: 'female-ranger-upper.png', width: 42, height: 34, x: 35, y: 42 },
    { id: 'ranger_lower', file: 'female-ranger-lower.png', width: 30, height: 39, x: 41, y: 61 },
    { id: 'hair_chestnut', file: 'female-chestnut-hair-v2.png', width: 42, height: 40, x: 41, y: 18 },
    { id: 'hair_silver', file: 'female-silver-hair-v2.png', width: 34, height: 29, x: 39, y: 21 },
  ],
};

const weaponDefs = {
  sword: { file: 'sword-moonsteel-concept.png', width: 28, height: 92, x: 130, y: 60 },
  staff: { file: 'staff-aether-concept.png', width: 20, height: 96, x: 134, y: 70 },
};
const weapons = new Map<string, RGBAImage>();
for (const [id, item] of Object.entries(weaponDefs)) {
  const cutout = nativeCutout(item.file, item.width, item.height, weaponSource);
  writePng(join(output, `${id}.png`), cutout);
  weapons.set(id, cutout);
}

function previewBlit(preview: RGBAImage, art: RGBAImage, column: number, row: number) {
  for (let y = 0; y < frame * previewScale; y++) for (let x = 0; x < frame * previewScale; x++) {
    const color = getPixel(art, Math.floor(x / previewScale), Math.floor(y / previewScale));
    if (color[3]) setPixel(preview, column * frame * previewScale + x, row * frame * previewScale + y, color);
  }
}

function removeIsolatedPixels(art: RGBAImage) {
  const alone: Array<[number, number]> = [];
  for (let y = 0; y < art.height; y++) for (let x = 0; x < art.width; x++) {
    if (!getPixel(art, x, y)[3]) continue;
    let neighbor = false;
    for (let yy = Math.max(0, y - 1); yy <= Math.min(art.height - 1, y + 1); yy++)
      for (let xx = Math.max(0, x - 1); xx <= Math.min(art.width - 1, x + 1); xx++)
        if ((xx !== x || yy !== y) && getPixel(art, xx, yy)[3]) neighbor = true;
    if (!neighbor) alone.push([x, y]);
  }
  for (const [x, y] of alone) setPixel(art, x, y, [0, 0, 0, 0]);
}

// Tóc là một mảng riêng, nhưng mép trong cần chừa vùng mắt của mặt chuẩn.
// Chỉ xóa pixel tóc khi có da/mắt của chính lớp mặt nằm bên dưới.
function fitHairToFace(hair: RGBAImage, face: RGBAImage) {
  for (let y = 76; y <= 99; y++) for (let x = 100; x <= 124; x++) {
    if (getPixel(face, x, y)[3]) setPixel(hair, x, y, [0, 0, 0, 0]);
  }
}

const preview = createImage(2 * frame * previewScale, 4 * frame * previewScale);
const armedPreview = createImage(2 * frame * previewScale, 2 * frame * previewScale);
const identities = [];
for (const [sexIndex, sex] of ['male', 'female'].entries()) {
  const parts = new Map<string, RGBAImage>();
  const definitions = original[sex]!.map(item => ({ ...item, width: item.width * 2, height: item.height * 2, x: item.x * 2, y: item.y * 2 }));
  for (const item of definitions) {
    const cutout = nativeCutout(item.file, item.width, item.height, source);
    if (item.id.startsWith('hair_')) removeIsolatedPixels(cutout);
    const layer = createImage(frame, frame);
    blit(layer, cutout, item.x, item.y);
    if (item.id.startsWith('hair_')) fitHairToFace(layer, parts.get('face')!);
    writePng(join(output, `${sex}_${item.id}.png`), layer);
    parts.set(item.id, layer);
  }
  for (const [outfitIndex, outfit] of ['midnight', 'ranger'].entries()) {
    for (const [hairIndex, hair] of ['hair_chestnut', 'hair_silver'].entries()) {
      const composed = createImage(frame, frame);
      for (const id of [`${outfit}_lower`, `${outfit}_upper`, 'face', hair]) blit(composed, parts.get(id)!, 0, 0);
      writePng(join(output, `assembled_${sex}_${outfit}_${hair}.png`), composed);
      previewBlit(preview, composed, hairIndex, sexIndex * 2 + outfitIndex);
    }
  }
  for (const [weaponIndex, weapon] of ['sword', 'staff'].entries()) {
    const composed = createImage(frame, frame);
    const placement = weaponDefs[weapon as keyof typeof weaponDefs];
    blit(composed, parts.get('midnight_lower')!, 0, 0);
    blit(composed, weapons.get(weapon)!, placement.x, placement.y);
    for (const id of ['midnight_upper', 'face', 'hair_chestnut']) blit(composed, parts.get(id)!, 0, 0);
    writePng(join(output, `assembled_${sex}_midnight_${weapon}.png`), composed);
    previewBlit(armedPreview, composed, weaponIndex, sexIndex);
  }
  identities.push({ identity: sex, parts: definitions });
}
writePng(join(output, 'assembly-preview-2x.png'), preview);
writePng(join(output, 'weapon-preview-2x.png'), armedPreview);
writeFileSync(join(output, 'manifest.json'), JSON.stringify({
  frameSize: [frame, frame], root: [112, 200], direction: 'S', action: 'idle', status: 'art-review-only',
  drawOrder: ['outfit.lower', 'weapon', 'outfit.upper', 'face', 'hair'],
  outfits: { midnight: ['midnight_lower', 'midnight_upper'], ranger: ['ranger_lower', 'ranger_upper'] },
  hair: ['hair_chestnut', 'hair_silver'], weapons: weaponDefs, identities,
}, null, 2) + '\n');
console.log('Đã ghép bộ review 224×224 từ tranh mảng riêng và tóc v2.');

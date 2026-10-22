// Mẫu art review: mỗi mảng được vẽ riêng rồi ghép trên chung lưới/neo.
// Chỉ pose đứng hướng Nam; không nhập runtime khi thiếu các hướng/action.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { blit, createImage, getPixel, readPng, setPixel, writePng, type RGBAImage } from '../image/rgba.js';
import { nativeCutout } from './art.js';

type Part = { id: string; file: string; width: number; height: number; x: number; y: number; source: string };
const root = resolve(import.meta.dirname, '../../../..');
const source = join(root, 'assets/mannequin/modular/source-art');
const output = join(root, 'assets/mannequin/modular/native');
const weaponDir = join(root, 'assets/mannequin/parts');
const scale = 4;
mkdirSync(output, { recursive: true });
const design: Record<string, Part[]> = {
	male: [
		{ id: 'face', file: 'male-face.png', width: 17, height: 19, x: 48, y: 30, source },
		{ id: 'midnight_upper', file: 'male-midnight-upper.png', width: 38, height: 34, x: 37, y: 42, source },
		{ id: 'midnight_lower', file: 'male-midnight-lower.png', width: 25, height: 39, x: 44, y: 61, source },
		{ id: 'ranger_upper', file: 'male-ranger-upper.png', width: 38, height: 34, x: 37, y: 42, source },
		{ id: 'ranger_lower', file: 'male-ranger-lower.png', width: 25, height: 39, x: 44, y: 61, source },
		{ id: 'hair_chestnut', file: 'male-chestnut-hair.png', width: 31, height: 27, x: 41, y: 22, source },
		{ id: 'hair_silver', file: 'male-silver-hair.png', width: 34, height: 29, x: 39, y: 21, source },
	],
	female: [
		{ id: 'face', file: 'female-face.png', width: 17, height: 19, x: 48, y: 30, source },
		{ id: 'midnight_upper', file: 'female-midnight-upper.png', width: 42, height: 34, x: 35, y: 42, source },
		{ id: 'midnight_lower', file: 'female-midnight-lower.png', width: 30, height: 39, x: 41, y: 61, source },
		{ id: 'ranger_upper', file: 'female-ranger-upper.png', width: 42, height: 34, x: 35, y: 42, source },
		{ id: 'ranger_lower', file: 'female-ranger-lower.png', width: 30, height: 39, x: 41, y: 61, source },
		{ id: 'hair_chestnut', file: 'female-chestnut-hair.png', width: 42, height: 40, x: 41, y: 18, source },
		{ id: 'hair_silver', file: 'female-silver-hair.png', width: 34, height: 29, x: 39, y: 21, source },
	],
};

const preview = createImage(2 * 112 * scale, 4 * 112 * scale);
const weaponPreview = createImage(2 * 112 * scale, 2 * 112 * scale);
const manifests = [];
for (const [sexIndex, sex] of ['male', 'female'].entries()) {
	const parts = new Map<string, RGBAImage>();
	for (const item of design[sex]!) {
		const cutout = nativeCutout(item.file, item.width, item.height, item.source);
		const canvas = createImage(112, 112);
		blit(canvas, cutout, item.x, item.y);
		writePng(join(output, `${sex}_${item.id}.png`), canvas);
		parts.set(item.id, canvas);
	}
	for (const [outfitIndex, outfit] of ['midnight', 'ranger'].entries())
		for (const [hairIndex, hair] of ['hair_chestnut', 'hair_silver'].entries()) {
			const composite = createImage(112, 112);
			for (const id of [`${outfit}_lower`, `${outfit}_upper`, 'face', hair]) blit(composite, parts.get(id)!, 0, 0);
			writePng(join(output, `assembled_${sex}_${outfit}_${hair}.png`), composite);
			const row = sexIndex * 2 + outfitIndex;
			for (let y = 0; y < 112 * scale; y++) for (let x = 0; x < 112 * scale; x++) {
				const color = getPixel(composite, Math.floor(x / scale), Math.floor(y / scale));
				if (color[3]) setPixel(preview, hairIndex * 112 * scale + x, row * 112 * scale + y, color);
			}
		}
	for (const [weaponIndex, weapon] of ['sword', 'staff'].entries()) {
		const composite = createImage(112, 112);
		const asset = readPng(join(weaponDir, weapon === 'sword' ? 'moonsteel-sword.png' : 'aether-staff.png'));
		blit(composite, parts.get('midnight_lower')!, 0, 0);
		// Chuôi ở khoảng (72,70), vũ khí đứng phía sau găng tay phải.
		blit(composite, asset, weapon === 'sword' ? 65 : 67, weapon === 'sword' ? 30 : 35);
		for (const id of ['midnight_upper', 'face', 'hair_chestnut']) blit(composite, parts.get(id)!, 0, 0);
		writePng(join(output, `assembled_${sex}_midnight_${weapon}.png`), composite);
		for (let y = 0; y < 112 * scale; y++) for (let x = 0; x < 112 * scale; x++) {
			const color = getPixel(composite, Math.floor(x / scale), Math.floor(y / scale));
			if (color[3]) setPixel(weaponPreview, weaponIndex * 112 * scale + x, sexIndex * 112 * scale + y, color);
		}
	}
	manifests.push({ identity: sex, parts: design[sex]!.map(({ source: _source, ...item }) => item) });
}
writePng(join(output, 'assembly-preview-4x.png'), preview);
writePng(join(output, 'weapon-preview-4x.png'), weaponPreview);
writeFileSync(join(output, 'manifest.json'), JSON.stringify({ frameSize: [112, 112], root: [56, 100],
	direction: 'S', action: 'idle', status: 'art-review-only',
	drawOrder: ['outfit.lower', 'outfit.upper', 'face', 'hair'],
	outfits: { midnight: ['midnight_lower', 'midnight_upper'], ranger: ['ranger_lower', 'ranger_upper'] },
	hair: ['hair_chestnut', 'hair_silver'],
	weapons: { sword: '../../parts/moonsteel-sword.png', staff: '../../parts/aether-staff.png' },
	identities: manifests }, null, 2) + '\n');
console.log('Đã ghép Nam/Nữ × 2 Outfit × 2 tóc từ các mảng gốc độc lập; chỉ mẫu đứng hướng S.');

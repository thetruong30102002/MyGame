// Lát cắt trong phòng thử: dùng pose vẽ tay lưu trữ, không xoay/biến dạng mảnh thân.
// Chạy từ gốc repo: npx tsx packages/asset-pipeline/src/mannequin/build.ts
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { computeGearAnchors } from '../atlas/gearAnchors.js';
import { blit, createImage, crop, getPixel, opaqueBounds, readPng, setPixel, writePng, type RGBAImage } from '../image/rgba.js';
import { nativeCutout, silverHead, weaponFrame } from './art.js';

const root = resolve(import.meta.dirname, '../../../..');
const output = join(root, 'assets/mannequin');
const directions = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'];
const cardinals = ['S', 'W', 'N', 'E'];
const sourceDirs: Record<string, string> = { S: 'south', E: 'east', N: 'north', W: 'east' };
// Dạ Ngân đang được vẽ lại ở rework/; chưa phát hành Outfit thiếu pose hành động.
const outfits = [{ id: 'starter', name: 'Bộ tân thủ' }];
const weapons = [
	{ id: 'sword', name: 'Kiếm Nguyệt Cương', action: 'attack', skill: 'slash', fps: 22, hitFrame: 3, hands: 1 },
	{ id: 'staff', name: 'Trượng Aether', action: 'cast', skill: 'aether_bolt', fps: 20, hitFrame: 3, hands: 1 },
];
type Point = [number, number];
type Frame = { name: string; index: number; root: Point; neck: Point; grip: Point; weaponOrder: number; source: string; hash: string; anchorsReviewed: boolean };
type Sequence = { action: string; direction: string; fps: number; hitFrame: number; frames: Frame[] };
type Identity = { id: string; name: string; texture: string; sequences: Sequence[] };
const identities: Identity[] = [];
const review: string[] = [];
type AnchorReview = { neck: Point; grip: Point; weaponOrder: number; reviewed: boolean };
const anchorReviews = JSON.parse(readFileSync(join(import.meta.dirname, 'anchors.json'), 'utf8')) as Record<string, AnchorReview>;
const concept = join(output, 'source-art');
const swordArt = nativeCutout('sword-moonsteel-concept.png', 14, 46, concept);
const staffArt = nativeCutout('staff-aether-concept.png', 10, 48, concept);
const maleHair = nativeCutout('hair-silver-male-concept.png', 34, 29, concept);
const femaleHair = nativeCutout('hair-silver-female-concept.png', 34, 29, concept);
for (const [name, art] of [['moonsteel-sword', swordArt], ['aether-staff', staffArt], ['silver-male', maleHair], ['silver-female', femaleHair]] as const)
	writePng(join(output, 'parts', `${name}.png`), art);

function mirrored(src: RGBAImage): RGBAImage {
	const out = createImage(src.width, src.height);
	for (let y = 0; y < src.height; y++) for (let x = 0; x < src.width; x++) setPixel(out, src.width - 1 - x, y, getPixel(src, x, y));
	return out;
}

// Chỉ gợi ý điểm nắm từ màu da nguồn. Chưa duyệt thủ công => ghi cờ rõ trong dữ liệu, không chứng nhận pose.
function candidateGrip(img: RGBAImage, neckY: number, centerX: number, dir: string, fallback: Point): Point {
	const candidates: Point[] = [];
	for (let y = neckY + 1; y < Math.min(88, neckY + 30); y++) for (let x = 20; x < 93; x++) {
		const [r, g, b, a] = getPixel(img, x, y);
		if (a && r > 160 && r - g > 24 && g - b > 18 && (dir === 'W' ? x < centerX - 4 : x > centerX + 4)) candidates.push([x, y]);
	}
	if (!candidates.length) return fallback;
	const extreme = dir === 'W' ? Math.min(...candidates.map(p => p[0])) : Math.max(...candidates.map(p => p[0]));
	const tip = candidates.filter(p => Math.abs(p[0] - extreme) <= 3);
	return [Math.round(tip.reduce((n, p) => n + p[0], 0) / tip.length), Math.round(tip.reduce((n, p) => n + p[1], 0) / tip.length)];
}

mkdirSync(output, { recursive: true });
for (const [id, sex, name] of [['player_hero_adult', 'm', 'Nam'], ['player_hero_adult_f', 'f', 'Nữ']] as const) {
	const entry = JSON.parse(readFileSync(join(root, 'assets/manifest.json'), 'utf8')).characters[id];
	const atlasMeta = JSON.parse(readFileSync(join(root, 'assets', entry.atlas), 'utf8'));
	const atlas = readPng(join(root, 'assets', dirname(entry.atlas), atlasMeta.meta.image));
	const cells: RGBAImage[] = [];
	const sequences: Sequence[] = [];
	const cellNames: string[] = [];
	const add = (name: string, img: RGBAImage): void => { cellNames.push(name); cells.push(img); };
	for (const action of ['idle', 'walk', 'attack', 'cast']) for (const dir of action === 'idle' || action === 'walk' ? directions : cardinals) {
		let sources: { img: RGBAImage; source: string }[] = [];
		if (action === 'idle' || action === 'walk') {
			const names: string[] = atlasMeta.animations[`${action}_${dir}`];
			if (!names?.length) throw new Error(`Thiếu ${id}/${action}/${dir}`);
			sources = names.map(n => { const r = atlasMeta.frames[n].frame; return { img: crop(atlas, r.x, r.y, r.w, r.h), source: `assets/${entry.atlas}#${n}` }; });
		} else {
			const base = `packages/asset-pipeline/sources/pixellab/player_hero_v2_${sex}/Idle/animations`;
			const variant = action === 'attack'
				? (existsSync(join(root, base, 'attack-hand2', sourceDirs[dir]!)) ? 'attack-hand2' : 'attack-hand') : 'cast-hand';
			const folder = join(root, base, variant, sourceDirs[dir]!);
			if (!existsSync(folder)) throw new Error(`Thiếu nguồn: ${folder}`);
			const files = readdirSync(folder).filter(f => /^frame_\d+\.png$/.test(f)).sort();
			if (files.length !== 8) throw new Error(`${folder}: cần 8 khung, có ${files.length}`);
			// Giữ offset CỐ ĐỊNH của cả chuỗi; không căn hộp bao từng frame.
			const first = readPng(join(folder, files[0]!));
			const ref = crop(atlas, atlasMeta.frames[`${id}/idle_${dir}_0`].frame.x, atlasMeta.frames[`${id}/idle_${dir}_0`].frame.y, 112, 112);
			const dy = opaqueBounds(ref)!.y1 - opaqueBounds(first)!.y1;
			for (const file of files) {
				let img = readPng(join(folder, file));
				const padded = createImage(112, 112);
				blit(padded, img, Math.floor((112 - img.width) / 2), dy);
				img = dir === 'W' ? mirrored(padded) : padded;
				sources.push({ img, source: `${base}/${variant}/${sourceDirs[dir]}/${file}${dir === 'W' ? '#mirror' : ''}` });
			}
		}
		const seq: Sequence = { action, direction: dir, fps: entry.animations[action].fps, hitFrame: action === 'attack' || action === 'cast' ? 3 : -1, frames: [] };
		for (const [i, { img, source }] of sources.entries()) {
			const prefix = `${action}_${dir}_${i}`;
			const measured = computeGearAnchors(img);
			if (!measured) throw new Error(`Khung rỗng ${id}/${prefix}`);
			const annotation = anchorReviews[`${id}/${prefix}`];
			const neck: Point = annotation?.neck ?? [measured.back[0], measured.back[1] - 2];
			const neckY = neck[1];
			const grip = annotation?.grip ?? candidateGrip(img, neckY, measured.head[0], dir, dir === 'W' ? measured.handL : measured.handR);
			for (const point of [neck, grip]) if (point.some(v => !Number.isInteger(v) || v < 0 || v >= 112)) throw new Error(`Neo ngoài khung ${id}/${prefix}`);
			if (annotation?.reviewed && getPixel(img, grip[0], grip[1])[3] === 0) throw new Error(`Neo đã duyệt không chạm hình ${id}/${prefix}`);
			const identity = createImage(112, 112), body = createImage(112, 112);
			const hairPalette = new Set<string>();
			if (sex === 'f') for (let hy = measured.top[1]; hy < measured.head[1] - 2; hy++)
				for (let hx = measured.head[0] - 16; hx <= measured.head[0] + 16; hx++) {
					const hc = getPixel(img, hx, hy);
					if (hc[3] && hc[0] > hc[1] + 10 && hc[1] > hc[2] + 5 && hc[0] < 180)
						hairPalette.add(hc.slice(0, 3).join(','));
				}
			for (let y = 0; y < 112; y++) for (let x = 0; x < 112; x++) {
				const c = getPixel(img, x, y);
				if (!c[3]) continue;
				const tail = sex === 'f' && y <= neckY + 21 && Math.abs(x - measured.head[0]) >= 9
					&& hairPalette.has(c.slice(0, 3).join(','));
				if (y <= neckY || tail) {
					setPixel(identity, x, y, c);
				} else {
					setPixel(body, x, y, c);
				}
			}
			const rebuilt = createImage(112, 112); blit(rebuilt, body, 0, 0); blit(rebuilt, identity, 0, 0);
			for (let k = 0; k < img.data.length; k++) if (img.data[k] !== rebuilt.data[k]) throw new Error(`Mất pixel ${id}/${prefix}/${k}`);
			const silver = silverHead(identity, sex === 'm' ? maleHair : femaleHair, measured.head, measured.top, neckY, sex === 'f', dir);
			add(`${prefix}_identity`, identity); add(`${prefix}_silver`, silver);
			add(`${prefix}_starter`, body);
			add(`${prefix}_sword`, weaponFrame(swordArt, grip, action, i, dir, false));
			add(`${prefix}_staff`, weaponFrame(staffArt, grip, action, i, dir, true));
			seq.frames.push({ name: prefix, index: cellNames.length - 5, root: [56, 100], neck, grip, weaponOrder: annotation?.weaponOrder ?? (dir === 'N' ? -1 : 1), source, hash: createHash('sha256').update(img.data).digest('hex'), anchorsReviewed: annotation?.reviewed === true });
		}
		sequences.push(seq);
	}
	// 5 lớp / pose, atlas nhiều trang nhỏ để không bị Unity co ảnh vượt maxSize.
	const cols = 16, rows = 16, perPage = cols * rows;
	for (let page = 0; page * perPage < cells.length; page++) {
		const image = createImage(cols * 112, rows * 112);
		cells.slice(page * perPage, (page + 1) * perPage).forEach((img, k) => blit(image, img, k % cols * 112, Math.floor(k / cols) * 112));
		writePng(join(output, `${id}-${page}.png`), image);
	}
	writeFileSync(join(output, `${id}-slices.json`), JSON.stringify(cellNames));
	identities.push({ id, name, texture: id, sequences });
	review.push(`${id}: ${sequences.length} chuỗi, ${sequences.reduce((n, s) => n + s.frames.length, 0)} pose; neo tay và ranh đầu CHƯA duyệt thủ công.`);
}
const catalog = { version: 1, template: 'adult-112-authored-v1', frameSize: [112, 112], ppu: 48, anchor: [56, 100], directions, outfits, weapons, identities, reviewRequired: true };
writeFileSync(join(output, 'catalog.json'), JSON.stringify(catalog, null, '\t') + '\n');
writeFileSync(join(output, 'review.txt'), review.join('\n')
	+ '\nBộ Dạ Ngân cũ đã loại khỏi catalog; sprite đứng mới ở rework/ chưa đủ hướng chéo/đi/đánh.\n'
	+ 'NGUỒN attack-hand2/east của nam đổi dáng về phía Nam giữa chuỗi: chưa đạt duyệt hướng.\n');
console.log(review.join('\n'));

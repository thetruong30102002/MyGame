/**
 * Đóng gói nhân vật cỡ NPC (chặng U, chủ dự án 04/11: "cho vào game cả nữ", "full đầu", đòn đánh "tạm dùng dáng đứng") thành atlas game:
 * 2 giới × 15 đầu (5 tộc × 3) × 5 class = 150 lựa chọn; thêm 150 bản tháo áo và 150 bản bộ shop 2.
 * Đứng / đi / chạy 8 hướng. Chỉ ghép lại các lớp PixelLab đã tách trong
 * assets/layered/mau-1/layered.json (thân khuôn npc, đầu npc-*, vũ khí đeo lưng, tóc dài) — không sinh ảnh mới, không co / phóng.
 * Đòn đánh: tạm lặp khung đứng của hướng đó (tấn công tạm dừng vẽ, chốt 03/11) — vẫn có mốc hit để gameplay chạy.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { readPng, writePng, createImage, crop, blit, opaqueBounds, type RGBAImage } from '../packages/asset-pipeline/src/image/rgba.js';

const src = 'assets/layered/mau-1';
const data = JSON.parse(readFileSync(join(src, 'layered.json'), 'utf8'));
const heads = readPng(join(src, data.head.sheet));
const hairs = data.head.long ? readPng(join(src, data.head.long.sheet)) : null;
const [hw, hh] = data.head.canvas as [number, number];
const [hax, hay] = data.head.neckAnchor as [number, number];
const [lw, lh] = (data.head.long?.canvas ?? [64, 112]) as [number, number];
const [lax, lay] = (data.head.long?.neckAnchor ?? [32, 40]) as [number, number];
const CELL = 160;
const DIRS = ['S', 'SE', 'E', 'NE', 'N', 'SW', 'W', 'NW'];
const RACES: Record<string, string> = { human: 'Nhân tộc', elf: 'Elf', demon: 'Ma tộc', beast: 'Thú nhân', dragon: 'Long tộc' };
// thân khuôn → class (id game, nhãn, tên động tác đánh trong game)
const CLASSES: Array<[string, string, string, string]> = [['', 'sword', 'Kiếm sĩ', 'attack'], ['-mage', 'staff', 'Pháp sư', 'cast'], ['-lancer', 'spear', 'Thương thủ', 'thrust'], ['-archer', 'bow', 'Cung thủ', 'shoot'], ['-guard', 'shield', 'Hộ vệ', 'bash']];
// Bộ shop 2 đã có đủ thân nam/nữ. Chỉ đóng gói từ các lớp nguồn, không tạo ảnh mới.
const SHOP2_BODY: Record<string, string> = { sword: 'sword2', staff: 'mage2', spear: 'lancer2', bow: 'archer2', shield: 'guard2' };
// Thân nền tháo đồ (06/11, chốt 28/10: nam quần đùi cởi trần, nữ bikini, chân trần; "khi tháo áo có hiện" vũ khí): mỗi mẫu có thêm bản
// `<mẫu>_bare` — cùng đầu, thân nền của class đó (vẫn đeo vũ khí class sau lưng). Không vào danh mục chọn lúc tạo nhân vật: game đổi sang
// bản này khi ô Áo trống (danh sách riêng `bare` trong catalog.json).
const sheetCache = new Map<string, RGBAImage>();
const cellOf = (sheet: string, i: number): RGBAImage => {
	if (!sheetCache.has(sheet)) sheetCache.set(sheet, readPng(join(src, sheet)));
	return crop(sheetCache.get(sheet)!, (i % 16) * CELL, Math.floor(i / 16) * CELL, CELL, CELL);
};
const headCell = (i: number): RGBAImage => crop(heads, (i % 16) * hw, Math.floor(i / 16) * hh, hw, hh);
const longCell = (i: number): RGBAImage => crop(hairs!, (i % 16) * lw, Math.floor(i / 16) * lh, lw, lh);

const dest = 'assets/player-roster/npc-v1';
mkdirSync(dest, { recursive: true });
const manifest = JSON.parse(readFileSync('assets/manifest.json', 'utf8'));
const catalog: any[] = [];
const bare: any[] = [];
const outfits2: any[] = [];
const proof: any[] = [];
for (const gender of (process.env.NPC_GENDERS ?? 'male,female').split(',') as Array<'male' | 'female'>) {
	const g = gender === 'male' ? 'm' : 'f';
	const bodyPrefix = gender === 'male' ? 'u' : 'uf';
	const genderHeads = data.heads.filter((h: any) => h.mould === 'npc' && h.gender === gender);
	if (genderHeads.length !== 15) throw Error(`Cần 15 đầu ${gender} cỡ NPC, đang có ${genderHeads.length}`);
	for (const appearance of ['base', 'bare', 'outfit_2'] as const)
	for (const [suffix, classId, classLabel, action] of CLASSES) {
		const bareBody = appearance === 'bare';
		const bodyId = appearance === 'outfit_2' ? `${bodyPrefix}-${SHOP2_BODY[classId]}` : bodyPrefix + (bareBody ? '-bare' : '') + suffix;
		const b = data.bodies.find((x: any) => x.id === bodyId);
		if (!b || b.mould !== 'npc') throw Error(`Thiếu thân ${bodyId}`);
		for (const head of genderHeads) {
			const m = /^npc-[mf]-([a-z]+)(\d)$/.exec(head.id);
			if (!m) throw Error('Mã đầu lạ ' + head.id);
			const [, raceId, variant] = m as unknown as [string, string, string];
			const id = `player_npc_${raceId}${variant}_${classId}_${g}${appearance === 'base' ? '' : appearance === 'bare' ? '_bare' : '_outfit_2'}`;
			const folder = 'assets/characters/' + id;
			mkdirSync(folder, { recursive: true });
			const cells: RGBAImage[] = [];
			const frames: any = {};
			const animations: any = {};
			const spec: any = {};
			const compose = (f: any, d: string): RGBAImage => {
				const hf = head.dirs[d];
				const im = createImage(CELL, CELL);
				const nx = f.chin[0] - (hf.chinOffset?.[0] || 0);
				const ny = f.chin[1] - (hf.chinOffset?.[1] || 0);
				if (hairs && hf.hairLong >= 0 && !hf.hairLongFront) blit(im, longCell(hf.hairLong), nx - lax, ny - lay);
				if (hf.hairBack >= 0) blit(im, headCell(hf.hairBack), nx - hax, ny - hay);
				// Vũ khí sau thân vẫn NGOÀI tóc (chủ dự án 05/11): tóc xoã ngoài cùng sau lưng, nhìn trước / ngang tóc dài không che vũ khí.
				if (f.weaponBehind && f.weapon >= 0) blit(im, cellOf(b.sheet, f.weapon), 0, 0);
				blit(im, cellOf(b.sheet, f.body), 0, 0);
				if (f.weaponMid >= 0) blit(im, cellOf(b.sheet, f.weaponMid), 0, 0);
				if (hairs && hf.hairLong >= 0 && hf.hairLongFront) blit(im, longCell(hf.hairLong), nx - lax, ny - lay);
				blit(im, headCell(hf.head), nx - hax, ny - hay);
				if (f.front >= 0) blit(im, cellOf(b.sheet, f.front), 0, 0);
				if (!f.weaponBehind && f.weapon >= 0) blit(im, cellOf(b.sheet, f.weapon), 0, 0);
				if (f.hand >= 0) blit(im, cellOf(b.sheet, f.hand), 0, 0);
				return im;
			};
			for (const state of ['idle', 'walk', 'run', action]) {
				let ms = 0;
				let count = 0;
				for (const d of DIRS) {
					const clipName = (state === action ? 'idle' : state) + '_' + d;
					const clip = b.clips[clipName];
					if (!clip?.length) throw Error(`${id} thiếu ${clipName}`);
					// Đánh: tạm 4 khung đứng (giữ nhịp đòn ~0,5s cho gameplay), chờ bộ đòn mới.
					const list = state === action ? [clip[0], clip[0], clip[0], clip[0]] : clip;
					const names: string[] = [];
					for (const [i, f] of list.entries()) {
						const file = `${id}_${state === action ? action : state}_${d}_${String(i).padStart(2, '0')}`;
						cells.push(compose(f, d));
						frames[file] = { anchor: { x: 0.5, y: 0.9 } };
						names.push(file);
					}
					animations[`${state === action ? action : state}_${d}`] = names;
					if (d === 'S') {
						ms = state === action ? 500 : clip.reduce((n: number, f: any) => n + f.ms, 0);
						count = list.length;
					}
				}
				const name = state === action ? action : state;
				spec[name] = { fps: (count * 1000) / ms, frames: count, loop: state !== action, hitFrame: state === action ? 2 : undefined, directions: DIRS };
			}
			// Đóng gói: chỉ bỏ biên alpha rỗng; sourceSize / pivot giữ nguyên ô 160, không co hình.
			const names = Object.keys(frames);
			const packed: Array<{ image: RGBAImage; x: number; y: number }> = [];
			const frameHashes: Record<string, string> = {};
			let px = 0;
			let py = 0;
			let rowHeight = 0;
			cells.forEach((im, i) => {
				const box = opaqueBounds(im);
				if (!box) throw Error('Khung rỗng ' + id);
				const w = box.x1 - box.x0;
				const h = box.y1 - box.y0;
				if (px + w + 2 > 1024) {
					px = 0;
					py += rowHeight + 2;
					rowHeight = 0;
				}
				const name = names[i]!;
				frames[name] = { frame: { x: px, y: py, w, h }, rotated: false, trimmed: true, spriteSourceSize: { x: box.x0, y: box.y0, w, h }, sourceSize: { w: CELL, h: CELL }, anchor: { x: 0.5, y: 0.9 } };
				packed.push({ image: crop(im, box.x0, box.y0, w, h), x: px, y: py });
				frameHashes[name] = createHash('sha256').update(im.data).digest('hex');
				px += w + 2;
				rowHeight = Math.max(rowHeight, h);
			});
			const atlasHeight = py + rowHeight;
			if (atlasHeight > 2048) throw Error('Atlas vượt trần mobile: ' + id);
			const image = createImage(1024, atlasHeight);
			packed.forEach((p) => blit(image, p.image, p.x, p.y));
			writePng(join(folder, id + '.png'), image);
			writeFileSync(join(folder, id + '.json'), JSON.stringify({ frames, animations, meta: { image: id + '.png', size: { w: image.width, h: image.height } } }));
			const raceLabel = RACES[raceId] ?? raceId;
			manifest.characters[id] = { displayName: `${raceLabel} ${variant} · ${classLabel}${bareBody ? ' (tháo áo)' : appearance === 'outfit_2' ? ' (bộ 2)' : ''}`, role: 'player', atlas: `characters/${id}/${id}.json`, frameSize: { width: CELL, height: CELL }, anchor: { x: 0.5, y: 0.9 }, bodyHeight: 72, directions: DIRS, animations: spec };
			if (bareBody) bare.push({ id, of: id.replace(/_bare$/, ''), classId, gender, raceId, variant: Number(variant) });
			else if (appearance === 'outfit_2') outfits2.push({ id, of: id.replace(/_outfit_2$/, ''), classId, gender, raceId, variant: Number(variant) });
			else catalog.push({ id, displayName: `${raceLabel} ${variant}`, classId, classLabel, gender, raceId, raceLabel, variant: Number(variant), headLabel: head.label, playable: true });
			proof.push({ id, bodyId: b.id, headId: head.id, frames: cells.length, atlasSize: [image.width, image.height], frameHashes });
		}
	}
}
writeFileSync('assets/manifest.json', JSON.stringify(manifest, null, '\t') + '\n');
writeFileSync(dest + '/catalog.json', JSON.stringify({ version: 'npc-v1', characters: catalog, bare, outfits2 }, null, 2));
writeFileSync(dest + '/provenance.json', JSON.stringify({ source: src, newImageCalls: 0, attack: 'tạm dùng khung đứng (tấn công tạm dừng vẽ, chốt 03/11)', models: proof }, null, 2));
// Máy chủ / client dùng chung danh mục (packages/protocol): thêm khối NPC_MODELS, giữ mẫu cũ để nhân vật đã tạo vẫn hợp lệ.
const protocol = 'packages/protocol/src/roster.ts';
let text = readFileSync(protocol, 'utf8');
const block = `export const NPC_MODELS = ${JSON.stringify(catalog.map((c) => ({ id: c.id, classId: c.classId, gender: c.gender, name: c.displayName, raceId: c.raceId, variant: c.variant })), null, 2)} as const;\n`;
if (text.includes('export const NPC_MODELS')) text = text.replace(/export const NPC_MODELS = [\s\S]*? as const;\n/, block);
else text = text.replace('export const PLAYER_MODELS = [...PIXELLAB_MALE_MODELS, ...LEGACY_PLAYER_MODELS] as const;', `// Cỡ NPC 8 hướng (04/11, scripts/export-npc-roster.mts).\n${block}export const PLAYER_MODELS = [...NPC_MODELS, ...PIXELLAB_MALE_MODELS, ...LEGACY_PLAYER_MODELS] as const;`);
writeFileSync(protocol, text);
console.log(`Đóng gói ${catalog.length} nhân vật cỡ NPC (2 giới × 15 đầu × 5 class) + ${bare.length} bản tháo áo + ${outfits2.length} bản bộ shop 2, 8 hướng đứng / đi / chạy; đòn đánh tạm khung đứng; 0 ảnh vẽ mới.`);

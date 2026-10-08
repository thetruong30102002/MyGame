import { blit, createImage, fill, scaleNearest, type RGBAImage } from '../image/rgba.js';
import type { AnimationFrames } from '../normalize/PixelStyleNormalizer.js';
import { DIRECTIONS, type AnimationName, type Direction } from '../providers/types.js';

/** Định dạng spritesheet JSON của PixiJS (Spritesheet / Assets.load hiểu trực tiếp). */
export interface PixiSpritesheetJson {
	frames: Record<
		string,
		{
			frame: { x: number; y: number; w: number; h: number };
			rotated: false;
			trimmed: false;
			spriteSourceSize: { x: number; y: number; w: number; h: number };
			sourceSize: { w: number; h: number };
			anchor: { x: number; y: number };
		}
	>;
	animations: Record<string, string[]>;
	meta: { app: string; version: string; image: string; format: 'RGBA8888'; size: { w: number; h: number }; scale: '1' };
}

/**
 * Xếp atlas theo lưới: mỗi animation chiếm 8 hàng (một hàng/hướng), mỗi cột một frame.
 * Chừa `padding` px trống giữa các ô để khi camera zoom lẻ không bị lem pixel ô bên cạnh.
 * Tên frame `<prefix><anim>_<DIR>_<i>`, tên animation `<anim>_<DIR>`.
 */
export function packAtlas(frames: AnimationFrames, imageName: string, anchorY: number, padding = 2, prefix = ''): { image: RGBAImage; json: PixiSpritesheetJson } {
	const anims = Object.keys(frames) as AnimationName[];
	const sample = Object.values(Object.values(frames)[0] ?? {})[0]?.[0];
	if (!sample) throw new Error('Không có frame để đóng atlas');
	const cw = sample.width;
	const ch = sample.height;
	const maxCols = Math.max(...anims.flatMap((a) => DIRECTIONS.map((d) => frames[a]?.[d]?.length ?? 0)));
	const width = maxCols * (cw + padding) + padding;
	const height = anims.length * DIRECTIONS.length * (ch + padding) + padding;
	const image = createImage(width, height);
	const json: PixiSpritesheetJson = {
		frames: {},
		animations: {},
		meta: { app: '@aether/asset-pipeline', version: '1', image: imageName, format: 'RGBA8888', size: { w: width, h: height }, scale: '1' },
	};
	anims.forEach((anim, ai) => {
		DIRECTIONS.forEach((dir: Direction, di) => {
			const list = frames[anim]?.[dir] ?? [];
			const names: string[] = [];
			list.forEach((img, fi) => {
				const x = padding + fi * (cw + padding);
				const y = padding + (ai * DIRECTIONS.length + di) * (ch + padding);
				blit(image, img, x, y);
				// Tiền tố id: cache texture của Pixi là TOÀN CỤC, hai atlas cùng tên frame sẽ đè nhau.
				const name = `${prefix}${anim}_${dir}_${fi}`;
				json.frames[name] = {
					frame: { x, y, w: cw, h: ch },
					rotated: false,
					trimmed: false,
					spriteSourceSize: { x: 0, y: 0, w: cw, h: ch },
					sourceSize: { w: cw, h: ch },
					anchor: { x: 0.5, y: anchorY / ch },
				};
				names.push(name);
			});
			if (names.length) json.animations[`${anim}_${dir}`] = names;
		});
	});
	return { image, json };
}

/** Ảnh duyệt bằng mắt: nền tối caro, phóng `scale` lần, hàng = hướng, cột = frame, các animation xếp dọc. */
export function contactSheet(frames: AnimationFrames, scale = 2): RGBAImage {
	const anims = Object.keys(frames) as AnimationName[];
	const sample = Object.values(Object.values(frames)[0] ?? {})[0]?.[0];
	if (!sample) throw new Error('Không có frame');
	const cw = sample.width * scale;
	const ch = sample.height * scale;
	const gap = 4;
	const maxCols = Math.max(...anims.flatMap((a) => DIRECTIONS.map((d) => frames[a]?.[d]?.length ?? 0)));
	const out = createImage(maxCols * (cw + gap) + gap, anims.length * DIRECTIONS.length * (ch + gap) + gap);
	fill(out, [24, 26, 34, 255]);
	anims.forEach((anim, ai) => {
		DIRECTIONS.forEach((dir, di) => {
			(frames[anim]?.[dir] ?? []).forEach((img, fi) => {
				const x = gap + fi * (cw + gap);
				const y = gap + (ai * DIRECTIONS.length + di) * (ch + gap);
				const cell = createImage(cw, ch);
				for (let py = 0; py < ch; py += 1) {
					for (let px = 0; px < cw; px += 1) {
						const dark = ((px >> 4) + (py >> 4)) % 2 === 0;
						const i = (py * cw + px) * 4;
						cell.data.set(dark ? [52, 56, 70, 255] : [64, 69, 86, 255], i);
					}
				}
				blit(cell, scaleNearest(img, scale), 0, 0);
				blit(out, cell, x, y);
			});
		});
	});
	return out;
}

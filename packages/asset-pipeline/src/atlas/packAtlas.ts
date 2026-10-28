import { createHash } from 'node:crypto';
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

/** Cạnh atlas tối đa — texture WebGL trên máy yếu / điện thoại thường chỉ nhận tới 4096. */
const MAX_SIDE = 4096;

/**
 * Xếp atlas kiểu KỆ: các ô cùng cỡ (không cắt sát — neo đồ gắn và bảng kho đồ đọc toạ độ theo ô), chuỗi khung của từng
 * (animation, hướng) đặt liền nhau, hết chỗ trong hàng thì xuống hàng; hàng rộng tới mức atlas gần vuông. Lưới cũ (một hàng
 * mỗi hướng × 8 hướng mỗi animation) với 25 động tác khung 112px cao ~24.000px — quá giới hạn texture.
 * Chừa `padding` px trống giữa các ô để khi camera zoom lẻ không bị lem pixel ô bên cạnh.
 * Khung TRÙNG từng điểm ảnh (vd `revive` = `death` phát ngược) dùng chung MỘT ô: tên khung vẫn riêng, toạ độ trùng nhau.
 * Tên frame `<prefix><anim>_<DIR>_<i>`, tên animation `<anim>_<DIR>`.
 */
export function packAtlas(frames: AnimationFrames, imageName: string, anchorY: number, padding = 2, prefix = ''): { image: RGBAImage; json: PixiSpritesheetJson } {
	const anims = Object.keys(frames) as AnimationName[];
	const sample = Object.values(Object.values(frames)[0] ?? {})[0]?.[0];
	if (!sample) throw new Error('Không có frame để đóng atlas');
	const cw = sample.width;
	const ch = sample.height;
	const keyOf = (img: RGBAImage) => `${img.width}x${img.height}:${createHash('sha1').update(img.data).digest('base64')}`;
	const runs = anims.flatMap((anim) =>
		DIRECTIONS.map((dir) => ({ anim, dir, list: frames[anim]?.[dir] ?? [] }))
			.filter((r) => r.list.length)
			.map((r) => ({ ...r, keys: r.list.map(keyOf) })),
	);
	// Số ô MỚI mỗi chuỗi cần (khung đã có ô — ở chuỗi trước hay ngay trong chuỗi — không chiếm thêm).
	const seen = new Set<string>();
	const fresh = runs.map((r) => r.keys.filter((k) => !seen.has(k) && !!seen.add(k)).length);
	const total = fresh.reduce((n, k) => n + k, 0);
	const longest = Math.max(1, ...fresh);
	// Đặt trước để biết chiều cao: chuỗi vừa một hàng thì không bẻ đôi (dễ đọc khi soi atlas), dài hơn hàng thì bẻ — chỗ trống
	// cuối hàng làm atlas cao hơn ước tính vuông, nên nới thêm cột tới khi cao ≤ MAX_SIDE. Hết cột mà vẫn cao quá thì bẻ MỌI chuỗi
	// qua hàng (`dense`, không bỏ ô trống cuối hàng — 10/10/2026: người chơi 16 tuổi thêm đứng / đi cầm vũ khí, 1112 khung 112px cao
	// 4106px); vẫn vượt thì thu lề giữa ô còn 1px (lấy mẫu nearest / linear ở zoom lẻ chỉ với tới 1 texel kề — 1px trống vẫn chặn
	// lem; 10/10/2026: thêm trúng đòn / lướt / gục cầm vũ khí, ~1240 khung 112px > 35×35 ô lề 2px); vẫn vượt thì đành vượt, có
	// cảnh báo. Atlas vốn vừa thì xếp y như cũ.
	const layout = (cols: number, pad: number, dense = false) => {
		const at = new Map<string, { x: number; y: number }>();
		let col = 0;
		let row = 0;
		runs.forEach((r, ri) => {
			const n = fresh[ri]!;
			if (!n) return;
			if (!dense && col > 0 && col + n > cols && n <= cols) {
				col = 0;
				row += 1;
			}
			for (const k of r.keys) {
				if (at.has(k)) continue;
				if (col >= cols) {
					col = 0;
					row += 1;
				}
				at.set(k, { x: pad + col * (cw + pad), y: pad + row * (ch + pad) });
				col += 1;
			}
		});
		return { cols, pad, at, height: (row + 1) * (ch + pad) + pad };
	};
	const planFor = (pad: number) => {
		const fitCols = Math.floor((MAX_SIDE - pad) / (cw + pad));
		let p = layout(Math.min(fitCols, Math.max(longest, Math.ceil(Math.sqrt((total * (ch + pad)) / (cw + pad))))), pad);
		while (p.height > MAX_SIDE && p.cols < fitCols) p = layout(p.cols + 1, pad);
		if (p.height > MAX_SIDE) p = layout(fitCols, pad, true);
		return p;
	};
	let plan = planFor(padding);
	if (plan.height > MAX_SIDE && padding > 1) {
		const tight = planFor(1);
		if (tight.height < plan.height) plan = tight;
		console.log(`  atlas ${imageName}: ${total} ô không vừa ${MAX_SIDE}px với lề ${padding}px → lề 1px`);
	}
	const { cols, pad, at, height } = plan;
	const width = cols * (cw + pad) + pad;
	if (height > MAX_SIDE) console.warn(`  ⚠ atlas ${imageName} cao ${height}px > ${MAX_SIDE} — máy yếu có thể không nạp được`);
	const image = createImage(width, height);
	const json: PixiSpritesheetJson = {
		frames: {},
		animations: {},
		meta: { app: '@havenlord/asset-pipeline', version: '1', image: imageName, format: 'RGBA8888', size: { w: width, h: height }, scale: '1' },
	};
	const drawn = new Set<string>();
	runs.forEach(({ anim, dir, list, keys }) => {
		const names: string[] = [];
		list.forEach((img, fi) => {
			const { x, y } = at.get(keys[fi]!)!;
			if (!drawn.has(keys[fi]!)) blit(image, img, x, y);
			drawn.add(keys[fi]!);
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
		json.animations[`${anim}_${dir}`] = names;
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

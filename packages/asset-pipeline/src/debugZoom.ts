// Công cụ duyệt: phóng to một frame SAU khi dọn tự động, kẻ lưới toạ độ canvas để khai luật erase.
import { join } from 'node:path';
import { createImage, fill, blit, scaleNearest, setPixel, writePng } from './image/rgba.js';
import { removeForeignObjects } from './normalize/cleanup.js';
import { normalizeCharacter, type AnimationFrames } from './normalize/PixelStyleNormalizer.js';
import { FreePixelProvider } from './providers/FreePixelProvider.js';
import { DIRECTIONS, type AnimationName, type Direction } from './providers/types.js';

const [slug, anim, dir, frame, x0, y0, x1, y1] = process.argv.slice(2);
const fp = new FreePixelProvider(join(process.cwd(), '../../.asset-cache/freepixel'));
const raw: AnimationFrames = {};
for (const a of ['idle', 'walk'] as AnimationName[]) raw[a] = (await fp.generateAnimation({ identity: {} as never, sourceRef: slug, animation: a, directions: DIRECTIONS })).frames;
const { frames } = normalizeCharacter(raw, { canvas: { width: 128, height: 160 }, baselineY: 150 });
const img = removeForeignObjects(frames).frames[anim as AnimationName]![dir as Direction]![Number(frame)]!;
const [bx0, by0, bx1, by1] = [x0, y0, x1, y1].map(Number) as [number, number, number, number];
const S = 10;
const out = createImage((bx1 - bx0) * S, (by1 - by0) * S);
fill(out, [60, 66, 60, 255]);
const crop = createImage(bx1 - bx0, by1 - by0);
for (let y = by0; y < by1; y += 1) for (let x = bx0; x < bx1; x += 1) {
	const i = (y * img.width + x) * 4;
	setPixel(crop, x - bx0, y - by0, [img.data[i]!, img.data[i + 1]!, img.data[i + 2]!, img.data[i + 3]!]);
}
blit(out, scaleNearest(crop, S), 0, 0);
for (let x = bx0; x <= bx1; x += 1) if (x % 2 === 0) for (let y = 0; y < out.height; y += 1) setPixel(out, (x - bx0) * S, y, x % 10 === 0 ? [255, 230, 0, 255] : [120, 120, 120, 255]);
for (let y = by0; y <= by1; y += 1) if (y % 2 === 0) for (let x = 0; x < out.width; x += 1) setPixel(out, x, (y - by0) * S, y % 10 === 0 ? [255, 230, 0, 255] : [120, 120, 120, 255]);
writePng(join(process.cwd(), `reports/zoom-${anim}-${dir}-${frame}.png`), out);
console.log(`lưới vàng = bội 10, xám = bội 2; gốc (${bx0},${by0})`);

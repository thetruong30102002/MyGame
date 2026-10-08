// Công cụ duyệt: tô hồng các pixel bị removeForeignObjects xoá, liệt kê frame bị đụng tới.
import { join } from 'node:path';
import { contactSheet } from './atlas/packAtlas.js';
import { cloneImage, getPixel, setPixel, writePng } from './image/rgba.js';
import { eachFrame, removeForeignObjects } from './normalize/cleanup.js';
import { mapFrames, normalizeCharacter, type AnimationFrames } from './normalize/PixelStyleNormalizer.js';
import { FreePixelProvider } from './providers/FreePixelProvider.js';
import { DIRECTIONS, type AnimationName } from './providers/types.js';

const [slug = 'blue-wizard', ...anims] = process.argv.slice(2);
const fp = new FreePixelProvider(join(process.cwd(), '../../.asset-cache/freepixel'));
const raw: AnimationFrames = {};
for (const a of (anims.length ? anims : ['idle', 'walk']) as AnimationName[]) {
	raw[a] = (await fp.generateAnimation({ identity: {} as never, sourceRef: slug, animation: a, directions: DIRECTIONS })).frames;
}
const { frames } = normalizeCharacter(raw, { canvas: { width: 128, height: 160 }, baselineY: 150 });
const { frames: cleaned } = removeForeignObjects(frames);
const touched: string[] = [];
const marked = mapFrames(frames, (img, anim, dir, i) => {
	const after = cleaned[anim]![dir]![i]!;
	const out = cloneImage(img);
	let n = 0;
	for (let y = 0; y < img.height; y += 1)
		for (let x = 0; x < img.width; x += 1)
			if (getPixel(img, x, y)[3] && !getPixel(after, x, y)[3]) {
				setPixel(out, x, y, [255, 0, 200, 255]);
				n += 1;
			}
	if (n) touched.push(`${anim}/${dir}#${i}:${n}`);
	return out;
});
eachFrame(marked, () => {});
writePng(join(process.cwd(), `reports/removed-${slug}.png`), contactSheet(marked, 2));
console.log(touched.join('  '));

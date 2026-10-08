// Công cụ duyệt: dựng ảnh tĩnh một vùng map (mặt đất + decal + đồ vật + nhân vật) đúng như game vẽ, để so
// trước/sau khi sửa đồ hoạ mà không cần mở trình duyệt. Chạy: `npx tsx src/debugMapPreview.ts [tên-ảnh]`.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderGroundChunk, type TerrainGrid } from '../../../apps/web/src/game/world/groundShade.js';
import { createImage, opaqueBounds, readPng, scaleNearest, writePng, type RGBAImage } from './image/rgba.js';

const WEB = join(process.cwd(), '../../apps/web/public/assets');
const map = JSON.parse(readFileSync(join(WEB, 'maps/human/town.json'), 'utf8')) as TerrainGrid & {
	props: { id: string; x: number; y: number }[];
	decals: { id: string; x: number; y: number }[];
	spots: { id: string; x: number; y: number }[];
};
const atlas = readPng(join(WEB, 'maps/human/props.png'));
const frames = (JSON.parse(readFileSync(join(WEB, 'maps/human/props.json'), 'utf8')) as { frames: Record<string, { frame: { x: number; y: number; w: number; h: number } }> }).frames;

interface Sheet {
	img: RGBAImage;
	frames: Record<string, { frame: { x: number; y: number; w: number; h: number } }>;
}
const charSheet = (id: string): Sheet => ({
	img: readPng(join(WEB, `characters/${id}/${id}.png`)),
	frames: (JSON.parse(readFileSync(join(WEB, `characters/${id}/${id}.json`), 'utf8')) as Sheet).frames,
});

/** Vẽ đè một vùng atlas lên ảnh đích, alpha cứng (asset đã qua cổng: không có pixel bán trong suốt). */
function draw(dst: RGBAImage, src: RGBAImage, r: { x: number; y: number; w: number; h: number }, dx: number, dy: number): void {
	for (let y = 0; y < r.h; y += 1) {
		const ty = dy + y;
		if (ty < 0 || ty >= dst.height) continue;
		for (let x = 0; x < r.w; x += 1) {
			const tx = dx + x;
			if (tx < 0 || tx >= dst.width) continue;
			const si = ((r.y + y) * src.width + r.x + x) * 4;
			if (src.data[si + 3]! < 128) continue;
			const di = (ty * dst.width + tx) * 4;
			dst.data[di] = src.data[si]!;
			dst.data[di + 1] = src.data[si + 1]!;
			dst.data[di + 2] = src.data[si + 2]!;
			dst.data[di + 3] = 255;
		}
	}
}

const VIEWS: Record<string, { x: number; y: number }> = {
	home: { x: 456, y: 1080 },
	plaza: { x: 1080, y: 1250 },
	river: { x: 2100, y: 1290 },
	forest: { x: 2800, y: 1300 },
	church: { x: 640, y: 660 },
};
const W = 640;
const H = 400;
const tag = process.argv[2] ?? 'preview';
const lior = charSheet('player_lior_child');

for (const [name, c] of Object.entries(VIEWS)) {
	const ox = Math.round(c.x - W / 2);
	const oy = Math.round(c.y - H / 2);
	const img = createImage(W, H);
	img.data.set(renderGroundChunk(map, ox, oy, W, H));
	for (const d of map.decals) {
		if (process.argv.includes('--no-tufts') && d.id.startsWith('tuft')) continue;
		const f = frames[`human/${d.id}`]?.frame;
		if (f) draw(img, atlas, f, d.x - ox - Math.floor(f.w / 2), d.y - oy - f.h);
	}
	const sprites: { y: number; paint: () => void }[] = [];
	for (const p of map.props) {
		const f = frames[`human/${p.id}`]?.frame;
		if (f) sprites.push({ y: p.y, paint: () => draw(img, atlas, f, p.x - ox - Math.floor(f.w / 2), p.y - oy - f.h) });
	}
	// Lior đứng giữa khung để so tỉ lệ người / nhà / cây.
	const heroArg = process.argv.indexOf('--hero');
	if (heroArg > 0) {
		// Một hoặc nhiều sprite mới (cách nhau dấu phẩy) đứng thành hàng; chân = mép dưới phần có hình của ảnh.
		const heroes = process.argv[heroArg + 1]!.split(',').map((f) => readPng(f));
		heroes.forEach((hero, i) => {
			const feet = opaqueBounds(hero)?.y1 ?? hero.height;
			const hx = Math.round(c.x + (i - (heroes.length - 1) / 2) * 46);
			sprites.push({ y: c.y, paint: () => draw(img, hero, { x: 0, y: 0, w: hero.width, h: hero.height }, hx - ox - Math.floor(hero.width / 2), c.y - oy - feet) });
		});
	} else {
		const lf = lior.frames['player_lior_child/idle_S_0']!.frame;
		sprites.push({ y: c.y, paint: () => draw(img, lior.img, lf, c.x - ox - 64, c.y - oy - 150) });
	}
	for (const s of sprites.sort((a, b) => a.y - b.y)) s.paint();
	writePng(join(process.cwd(), `reports/map-preview/${tag}-${name}.png`), scaleNearest(img, 2));
}
console.log(`đã ghi reports/map-preview/${tag}-*.png`);

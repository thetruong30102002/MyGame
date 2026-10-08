import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { blit, createImage, crop, readPng, writePng, type RGBAImage } from '../image/rgba.js';

export type Biome = 'meadow' | 'deadland' | 'rocky';

/** Màu theo HSV — chép từ apps/web groundShade (pipeline không import được code web: khác chuẩn module). */
function hsv(h: number, s: number, v: number): [number, number, number] {
	const f = (n: number): number => {
		const k = (n + h / 60) % 6;
		return Math.round((v - v * s * Math.max(0, Math.min(k, 4 - k, 1))) * 255);
	};
	return [f(5), f(3), f(1)];
}

/**
 * Màu phẳng từng loại địa hình theo vùng — PHẢI khớp `terrainColor` của apps/web groundShade (bậc giữa dải cỏ/nền
 * rừng của bảng màu vùng); sửa bảng màu bên đó thì sửa cả đây.
 */
const TERRAIN_RGB: Record<string, [number, number, number]> = { g: [83, 133, 67], f: [55, 88, 51], d: [133, 100, 66], c: [150, 145, 133], w: [58, 110, 160], b: [130, 92, 58] };
const BIOME_RGB: Record<Exclude<Biome, 'meadow'>, Record<string, [number, number, number]>> = {
	deadland: { g: hsv(48, 0.38, 0.45), f: hsv(46, 0.27, 0.29) },
	rocky: { g: hsv(60, 0.1, 0.47), f: hsv(205, 0.1, 0.3) },
};
export function terrainColor(biome: Biome | undefined, ch: string): [number, number, number] {
	return (biome && biome !== 'meadow' ? BIOME_RGB[biome][ch] : undefined) ?? TERRAIN_RGB[ch] ?? [0, 0, 0];
}

/**
 * Ảnh toàn cảnh một vùng (minimap + bản đồ lớn trong game, ảnh xem trước của pipeline), dựng THẲNG từ dữ liệu
 * map: màu phẳng theo địa hình + đồ vật thật của atlas. Không vẽ gì bằng tay — đổi bố cục map là ảnh đổi theo.
 */


export interface OverviewMap {
	tileSize: number;
	width: number;
	height: number;
	terrain: string[];
	props: { id: string; x: number; y: number }[];
	biome?: Biome;
}

/**
 * Tô địa hình đủ cỡ, dán đồ vật theo thứ tự y (neo chân giữa như trong game, bỏ decal), rồi thu nhỏ bằng
 * TRUNG BÌNH khối factor×factor — lấy mẫu một điểm thì răng cưa, lấy màu đa số thì viền đen của đồ vật thắng phiếu.
 */
export function renderOverview(map: OverviewMap, sprites: Record<string, RGBAImage>, factor: number): RGBAImage {
	const t = map.tileSize;
	const full = createImage(map.width * t, map.height * t);
	map.terrain.forEach((row, ty) => {
		for (let tx = 0; tx < row.length; tx += 1) {
			const c = terrainColor(map.biome, row[tx]!);
			const line = new Uint8Array(t * 4);
			for (let x = 0; x < t; x += 1) line.set([c[0], c[1], c[2], 255], x * 4);
			for (let y = 0; y < t; y += 1) full.data.set(line, ((ty * t + y) * full.width + tx * t) * 4);
		}
	});
	for (const p of [...map.props].sort((a, b) => a.y - b.y)) {
		const img = sprites[p.id];
		if (img) blit(full, img, Math.round(p.x - img.width / 2), p.y - img.height);
	}
	if (factor <= 1) return full;
	const out = createImage(Math.floor(full.width / factor), Math.floor(full.height / factor));
	const n = factor * factor;
	for (let y = 0; y < out.height; y += 1) {
		for (let x = 0; x < out.width; x += 1) {
			let r = 0;
			let g = 0;
			let b = 0;
			for (let dy = 0; dy < factor; dy += 1) {
				let i = ((y * factor + dy) * full.width + x * factor) * 4;
				for (let dx = 0; dx < factor; dx += 1, i += 4) {
					r += full.data[i]!;
					g += full.data[i + 1]!;
					b += full.data[i + 2]!;
				}
			}
			out.data.set([Math.round(r / n), Math.round(g / n), Math.round(b / n), 255], (y * out.width + x) * 4);
		}
	}
	return out;
}

/** Cắt từng frame `<region>/<id>` của atlas đồ vật đã xuất (props.png + props.json). */
export function spritesFromAtlas(atlas: RGBAImage, atlasJson: { frames: Record<string, { frame: { x: number; y: number; w: number; h: number } }> }, region = 'human'): Record<string, RGBAImage> {
	const out: Record<string, RGBAImage> = {};
	for (const [key, f] of Object.entries(atlasJson.frames)) {
		if (!key.startsWith(`${region}/`)) continue;
		out[key.slice(region.length + 1)] = crop(atlas, f.frame.x, f.frame.y, f.frame.w, f.frame.h);
	}
	return out;
}

export const MINIMAP_DOWNSCALE = 8;

/**
 * Ghi `<mapId>.minimap.png` (1/8) + `<mapId>.minimap.json` vào thư mục vùng. `version` = sha1 của map + atlas để
 * trình duyệt không giữ ảnh cũ khi map đổi. Chỉ ĐỌC town.json/props.* — không bao giờ ghi lại chúng.
 */
export function writeMinimap(regionDir: string, mapId: string, map?: OverviewMap, sprites?: Record<string, RGBAImage>): { png: string; json: string; width: number; height: number } {
	const mapRaw = readFileSync(join(regionDir, `${mapId}.json`));
	const atlasRaw = readFileSync(join(regionDir, 'props.png'));
	const data = map ?? (JSON.parse(mapRaw.toString('utf8')) as OverviewMap);
	const sp = sprites ?? spritesFromAtlas(readPng(join(regionDir, 'props.png')), JSON.parse(readFileSync(join(regionDir, 'props.json'), 'utf8')) as Parameters<typeof spritesFromAtlas>[1], basename(regionDir));
	const img = renderOverview(data, sp, MINIMAP_DOWNSCALE);
	const version = createHash('sha1').update(mapRaw).update(atlasRaw).digest('hex').slice(0, 8);
	const png = join(regionDir, `${mapId}.minimap.png`);
	const json = join(regionDir, `${mapId}.minimap.json`);
	writePng(png, img);
	const info = {
		map: mapId,
		image: `${mapId}.minimap.png`,
		width: img.width,
		height: img.height,
		downscale: MINIMAP_DOWNSCALE,
		world: { width: data.width * data.tileSize, height: data.height * data.tileSize, tileSize: data.tileSize },
		version,
	};
	writeFileSync(json, `${JSON.stringify(info, null, '\t')}\n`);
	return { png, json, width: img.width, height: img.height };
}

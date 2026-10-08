import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { alphaAt, blit, createImage, crop, decodePng, opaqueBounds, type RGBAImage } from '../image/rgba.js';
import { detectPixelScale } from '../normalize/PixelStyleNormalizer.js';
import type { PropDef } from './humanKingdom.js';

const CDN = 'https://pub-8b7609252a6742d7b029292aaede7f7f.r2.dev/sorted';
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (asset-pipeline; +https://freepixel.art/license/)' };

export interface PropMeta {
	kind: string;
	w: number;
	h: number;
	blocks: boolean;
	/** Vùng chặn tính bằng px, gốc toạ độ là điểm neo (giữa mép dưới). */
	footprint: { x: number; y: number; w: number; h: number };
}

interface Packed {
	id: string;
	img: RGBAImage;
}

export async function loadFreePixelImage(cacheDir: string, path: string): Promise<RGBAImage> {
	const file = join(cacheDir, path);
	if (!existsSync(file)) {
		let res: Response | null = null;
		for (let i = 1; i <= 4 && !res?.ok; i += 1) {
			try {
				res = await fetch(`${CDN}/${path}`, { headers: HEADERS });
			} catch {
				await new Promise((r) => setTimeout(r, 600 * i));
			}
		}
		if (!res?.ok) throw new Error(`Không tải được ${path} (HTTP ${res?.status ?? 'mất kết nối'})`);
		mkdirSync(dirname(file), { recursive: true });
		writeFileSync(file, Buffer.from(await res.arrayBuffer()));
	}
	return decodePng(readFileSync(file));
}

/** Cổng chất lượng cho đồ vật: nền trong suốt, mép cứng, đúng lưới gốc. Trả về lý do trượt (rỗng = đạt). */
export function propIssues(img: RGBAImage): string[] {
	const issues: string[] = [];
	let semi = 0;
	for (let i = 3; i < img.data.length; i += 4) if (img.data[i]! > 0 && img.data[i]! < 255) semi += 1;
	if (semi > 0) issues.push(`${semi} px bán trong suốt`);
	const corners = [alphaAt(img, 0, 0), alphaAt(img, img.width - 1, 0), alphaAt(img, 0, img.height - 1), alphaAt(img, img.width - 1, img.height - 1)];
	if (corners.some((a) => a > 0)) issues.push('góc ảnh không trong suốt (ảnh có nền/khung cảnh)');
	const scale = detectPixelScale(img);
	if (scale !== 1) issues.push(`ảnh đã bị phóng ${scale}× (sai lưới gốc)`);
	if (!opaqueBounds(img)) issues.push('ảnh rỗng');
	return issues;
}

export function trim(img: RGBAImage): RGBAImage {
	const b = opaqueBounds(img)!;
	return crop(img, b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0);
}

/** Tách các cụm rời trên một tấm (búi cỏ, viên sỏi) thành sprite riêng. */
export function extractDecals(img: RGBAImage, minPixels: number, maxSize: number): RGBAImage[] {
	const seen = new Uint8Array(img.width * img.height);
	const out: RGBAImage[] = [];
	for (let y = 0; y < img.height; y += 1) {
		for (let x = 0; x < img.width; x += 1) {
			if (seen[y * img.width + x] || !alphaAt(img, x, y)) continue;
			const stack: [number, number][] = [[x, y]];
			const pixels: [number, number][] = [];
			seen[y * img.width + x] = 1;
			let x0 = x;
			let y0 = y;
			let x1 = x;
			let y1 = y;
			let n = 0;
			while (stack.length) {
				const [cx, cy] = stack.pop()!;
				pixels.push([cx, cy]);
				n += 1;
				x0 = Math.min(x0, cx);
				y0 = Math.min(y0, cy);
				x1 = Math.max(x1, cx);
				y1 = Math.max(y1, cy);
				for (let dy = -1; dy <= 1; dy += 1) {
					for (let dx = -1; dx <= 1; dx += 1) {
						const nx = cx + dx;
						const ny = cy + dy;
						if (nx < 0 || ny < 0 || nx >= img.width || ny >= img.height) continue;
						if (seen[ny * img.width + nx] || !alphaAt(img, nx, ny)) continue;
						seen[ny * img.width + nx] = 1;
						stack.push([nx, ny]);
					}
				}
			}
			const w = x1 - x0 + 1;
			const h = y1 - y0 + 1;
			// Cụm chạm mép tấm có thể bị cắt dở → bỏ.
			const touchesEdge = x0 === 0 || y0 === 0 || x1 === img.width - 1 || y1 === img.height - 1;
			if (n >= minPixels && w <= maxSize && h <= maxSize && !touchesEdge) {
				// Chỉ chép pixel của CHÍNH cụm này — hộp bao có thể chồng lên cụm bên cạnh.
				const decal = createImage(w, h);
				for (const [px, py] of pixels) decal.data.set(img.data.subarray((py * img.width + px) * 4, (py * img.width + px) * 4 + 4), ((py - y0) * w + (px - x0)) * 4);
				out.push(decal);
			}
		}
	}
	return out;
}

/**
 * Thu nhỏ NGUYÊN lần, mỗi khối f×f lấy màu xuất hiện nhiều nhất (alpha theo đa số). Giữ mép cứng và
 * không sinh màu mới — khác hẳn nội suy song tuyến làm nhoè pixel art.
 */
export function downscaleMode(img: RGBAImage, f: number): RGBAImage {
	const out = createImage(Math.floor(img.width / f), Math.floor(img.height / f));
	for (let y = 0; y < out.height; y += 1) {
		for (let x = 0; x < out.width; x += 1) {
			const counts = new Map<number, number>();
			let opaque = 0;
			for (let dy = 0; dy < f; dy += 1) {
				for (let dx = 0; dx < f; dx += 1) {
					const i = ((y * f + dy) * img.width + x * f + dx) * 4;
					if (img.data[i + 3] === 0) continue;
					opaque += 1;
					const k = (img.data[i]! << 16) | (img.data[i + 1]! << 8) | img.data[i + 2]!;
					counts.set(k, (counts.get(k) ?? 0) + 1);
				}
			}
			if (opaque * 2 < f * f) continue;
			const best = [...counts].sort((a, b) => b[1] - a[1])[0]![0];
			out.data.set([(best >> 16) & 255, (best >> 8) & 255, best & 255, 255], (y * out.width + x) * 4);
		}
	}
	return out;
}

/** Xếp kệ (shelf packing) theo chiều cao giảm dần, chừa `pad` px trong suốt giữa các hình. */
export function packShelf(items: Packed[], maxWidth: number, pad = 2): { image: RGBAImage; frames: Record<string, { x: number; y: number; w: number; h: number }> } {
	const sorted = [...items].sort((a, b) => b.img.height - a.img.height);
	const frames: Record<string, { x: number; y: number; w: number; h: number }> = {};
	let x = pad;
	let y = pad;
	let rowH = 0;
	let width = 0;
	for (const it of sorted) {
		if (x + it.img.width + pad > maxWidth) {
			x = pad;
			y += rowH + pad;
			rowH = 0;
		}
		frames[it.id] = { x, y, w: it.img.width, h: it.img.height };
		x += it.img.width + pad;
		rowH = Math.max(rowH, it.img.height);
		width = Math.max(width, x);
	}
	const height = y + rowH + pad;
	const image = createImage(width, height);
	for (const it of sorted) blit(image, it.img, frames[it.id]!.x, frames[it.id]!.y);
	return { image, frames };
}

export function propMeta(def: PropDef, img: RGBAImage): PropMeta {
	const fw = Math.round(img.width * def.footprint.w);
	return {
		kind: def.kind,
		w: img.width,
		h: img.height,
		blocks: def.blocks,
		footprint: { x: -Math.round(fw / 2), y: -def.footprint.h, w: fw, h: def.footprint.h },
	};
}


/**
 * Viền tối 1px quanh hình (mở rộng khung 1px mỗi phía). Đồ vật FreePixel không có viền; bộ PixelLab nhìn chính
 * diện thì viền đen đậm → thêm viền cho đồ cũ để cả map cùng nét (06/10/2026).
 */
export function addOutline(img: RGBAImage, color: [number, number, number] = [8, 6, 10]): RGBAImage {
	const out = createImage(img.width + 2, img.height + 2);
	blit(out, img, 1, 1);
	const solid = (x: number, y: number) => x >= 0 && y >= 0 && x < out.width && y < out.height && out.data[(y * out.width + x) * 4 + 3]! > 0;
	const edge: number[] = [];
	for (let y = 0; y < out.height; y += 1) {
		for (let x = 0; x < out.width; x += 1) {
			if (!solid(x, y) && (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1))) edge.push(y * out.width + x);
		}
	}
	for (const i of edge) out.data.set([...color, 255], i * 4);
	return out;
}

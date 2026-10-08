import { Texture } from 'pixi.js';
import type { Rarity } from './equipment';
import { prepareGearPixels } from './gearPixels';

/**
 * Ảnh đồ gắn đã thu nhỏ + nhuộm độ hiếm, dựng MỘT lần mỗi (ảnh, cỡ, bậc) trên canvas rồi dùng lại: texture cho Pixi (game,
 * người chơi khác) và data URL cho kho đồ. Ảnh tải hỏng → Promise lỗi, chỗ gọi bỏ lớp đó (không vẽ thay bằng hình khác).
 */
const canvases = new Map<string, Promise<HTMLCanvasElement>>();
const textures = new Map<string, Promise<Texture>>();
const urls = new Map<string, Promise<string>>();

const keyOf = (src: string, scale: number, rarity: Rarity) => `${src}|${scale}|${rarity}`;

function gearCanvas(src: string, scale: number, rarity: Rarity): Promise<HTMLCanvasElement> {
	const key = keyOf(src, scale, rarity);
	let p = canvases.get(key);
	if (!p) {
		p = new Promise<HTMLCanvasElement>((resolve, reject) => {
			const img = new Image();
			img.onload = () => {
				const c = document.createElement('canvas');
				c.width = img.naturalWidth;
				c.height = img.naturalHeight;
				const ctx = c.getContext('2d', { willReadFrequently: true });
				if (!ctx) return reject(new Error('canvas 2d'));
				ctx.drawImage(img, 0, 0);
				const px = prepareGearPixels(ctx.getImageData(0, 0, c.width, c.height), scale, rarity);
				const out = document.createElement('canvas');
				out.width = px.width;
				out.height = px.height;
				out.getContext('2d')!.putImageData(new ImageData(px.data as Uint8ClampedArray<ArrayBuffer>, px.width, px.height), 0, 0);
				resolve(out);
			};
			img.onerror = () => reject(new Error(src));
			img.src = src;
		});
		canvases.set(key, p);
		p.catch(() => canvases.delete(key));
	}
	return p;
}

export function gearTexture(src: string, scale: number, rarity: Rarity): Promise<Texture> {
	const key = keyOf(src, scale, rarity);
	let p = textures.get(key);
	if (!p) {
		p = gearCanvas(src, scale, rarity).then((c) => {
			const t = Texture.from(c);
			t.source.scaleMode = 'nearest';
			return t;
		});
		textures.set(key, p);
		p.catch(() => textures.delete(key));
	}
	return p;
}

export function gearImageUrl(src: string, scale: number, rarity: Rarity): Promise<string> {
	const key = keyOf(src, scale, rarity);
	let p = urls.get(key);
	if (!p) {
		p = gearCanvas(src, scale, rarity).then((c) => c.toDataURL());
		urls.set(key, p);
		p.catch(() => urls.delete(key));
	}
	return p;
}

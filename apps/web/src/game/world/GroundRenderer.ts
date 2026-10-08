import { Container, Sprite, Texture } from 'pixi.js';
import { renderGroundChunk, terrainColor, type TerrainGrid } from './groundShade';

export type { TerrainGrid } from './groundShade';

const CHUNK = 384;
const MAX_IN_FLIGHT = 4;

interface ChunkResult {
	key: string;
	ox: number;
	oy: number;
	w: number;
	h: number;
	pixels: Uint8ClampedArray;
}

/**
 * Mặt đất theo chunk 384px, CHỈ sinh khi chunk lọt vào vùng nhìn (+ lề) — không vẽ cả map một lúc.
 * Pixel tính trong Web Worker (`groundWorker.ts`); luồng chính chỉ đặt pixel vào texture (~1ms/chunk).
 */
export class GroundRenderer {
	readonly layer = new Container();
	private readonly chunks = new Map<string, Sprite>();
	private readonly pending = new Set<string>();
	private readonly worker: Worker | null;
	private readonly ready: ChunkResult[] = [];
	private readonly underlay: Sprite;

	constructor(private readonly map: TerrainGrid) {
		this.worker = typeof Worker === 'undefined' ? null : new Worker(new URL('./groundWorker.ts', import.meta.url), { type: 'module' });
		this.underlay = this.createUnderlay();
		this.layer.addChild(this.underlay);
		if (this.worker) {
			this.worker.postMessage({ type: 'init', map: { tileSize: map.tileSize, width: map.width, height: map.height, seed: map.seed, terrain: map.terrain, biome: map.biome } });
			this.worker.onmessage = (e: MessageEvent<ChunkResult>) => this.ready.push(e.data);
		}
	}

	get pixelWidth(): number {
		return this.map.width * this.map.tileSize;
	}

	get pixelHeight(): number {
		return this.map.height * this.map.tileSize;
	}

	/** Gọi mỗi frame với vùng nhìn (toạ độ thế giới). */
	update(view: { x0: number; y0: number; x1: number; y1: number }): void {
		for (const r of this.ready.splice(0)) this.place(r);
		const margin = CHUNK / 2;
		const cx0 = Math.max(0, Math.floor((view.x0 - margin) / CHUNK));
		const cy0 = Math.max(0, Math.floor((view.y0 - margin) / CHUNK));
		const cx1 = Math.min(Math.ceil(this.pixelWidth / CHUNK) - 1, Math.floor((view.x1 + margin) / CHUNK));
		const cy1 = Math.min(Math.ceil(this.pixelHeight / CHUNK) - 1, Math.floor((view.y1 + margin) / CHUNK));
		const cx = (view.x0 + view.x1) / 2;
		const cy = (view.y0 + view.y1) / 2;
		const wanted: { key: string; x: number; y: number; d: number }[] = [];
		for (let y = cy0; y <= cy1; y += 1) {
			for (let x = cx0; x <= cx1; x += 1) {
				const key = `${x},${y}`;
				if (!this.chunks.has(key) && !this.pending.has(key)) wanted.push({ key, x, y, d: Math.hypot((x + 0.5) * CHUNK - cx, (y + 0.5) * CHUNK - cy) });
			}
		}
		wanted.sort((a, b) => a.d - b.d);
		for (const w of wanted) {
			if (this.pending.size >= MAX_IN_FLIGHT) break;
			this.request(w.key, w.x, w.y);
		}
		for (const [key, sprite] of this.chunks) {
			const [x, y] = key.split(',').map(Number) as [number, number];
			sprite.visible = x >= cx0 && x <= cx1 && y >= cy0 && y <= cy1;
		}
	}

	/** Sinh ĐỒNG BỘ các chunk quanh điểm vào map, để màn đầu tiên không có lỗ đen. */
	warm(x: number, y: number, radius: number): void {
		for (let cy = Math.max(0, Math.floor((y - radius) / CHUNK)); cy <= Math.floor((y + radius) / CHUNK); cy += 1) {
			for (let cx = Math.max(0, Math.floor((x - radius) / CHUNK)); cx <= Math.floor((x + radius) / CHUNK); cx += 1) {
				const key = `${cx},${cy}`;
				if (this.chunks.has(key) || cx * CHUNK >= this.pixelWidth || cy * CHUNK >= this.pixelHeight) continue;
				const { ox, oy, w, h } = this.rect(cx, cy);
				this.place({ key, ox, oy, w, h, pixels: renderGroundChunk(this.map, ox, oy, w, h) });
			}
		}
	}

	destroy(): void {
		this.worker?.terminate();
		for (const s of this.chunks.values()) s.destroy({ texture: true, textureSource: true });
		this.chunks.clear();
		this.pending.clear();
		this.ready.length = 0;
		this.underlay.destroy({ texture: true, textureSource: true });
	}

	/**
	 * Lớp lót 1 pixel/ô (màu trung bình của địa hình) phóng 48× nằm dưới các chunk: camera chạy
	 * nhanh hơn worker thì chỗ chưa sinh kịp hiện đúng màu cỏ/nước thay vì lỗ đen.
	 */
	private createUnderlay(): Sprite {
		const canvas = document.createElement('canvas');
		canvas.width = this.map.width;
		canvas.height = this.map.height;
		const ctx = canvas.getContext('2d')!;
		const img = ctx.createImageData(this.map.width, this.map.height);
		this.map.terrain.forEach((row, y) => {
			for (let x = 0; x < row.length; x += 1) {
				const c = terrainColor(this.map.biome, row[x]!);
				img.data.set([c[0], c[1], c[2], 255], (y * this.map.width + x) * 4);
			}
		});
		ctx.putImageData(img, 0, 0);
		const texture = Texture.from(canvas, true);
		texture.source.scaleMode = 'nearest';
		const sprite = new Sprite(texture);
		sprite.scale.set(this.map.tileSize);
		return sprite;
	}

	private rect(cx: number, cy: number): { ox: number; oy: number; w: number; h: number } {
		const ox = cx * CHUNK;
		const oy = cy * CHUNK;
		return { ox, oy, w: Math.min(CHUNK, this.pixelWidth - ox), h: Math.min(CHUNK, this.pixelHeight - oy) };
	}

	private request(key: string, cx: number, cy: number): void {
		const r = this.rect(cx, cy);
		if (!this.worker) {
			this.place({ key, ...r, pixels: renderGroundChunk(this.map, r.ox, r.oy, r.w, r.h) });
			return;
		}
		this.pending.add(key);
		this.worker.postMessage({ type: 'chunk', key, ...r });
	}

	private place(r: ChunkResult): void {
		this.pending.delete(r.key);
		if (this.chunks.has(r.key)) return;
		const canvas = document.createElement('canvas');
		canvas.width = r.w;
		canvas.height = r.h;
		canvas.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(r.pixels), r.w, r.h), 0, 0);
		// skipCache: canvas tạm không được nằm lại trong Cache toàn cục của Pixi sau khi Game bị huỷ.
		const texture = Texture.from(canvas, true);
		texture.source.scaleMode = 'nearest';
		const sprite = new Sprite(texture);
		sprite.position.set(r.ox, r.oy);
		this.layer.addChild(sprite);
		this.chunks.set(r.key, sprite);
	}
}

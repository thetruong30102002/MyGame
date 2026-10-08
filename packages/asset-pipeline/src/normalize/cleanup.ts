import { luminance, rgbToHsl } from '../image/color.js';
import { alphaAt, cloneImage, colorKey, getPixel, setPixel, type RGBA, type RGBAImage } from '../image/rgba.js';
import type { AnimationName, Direction } from '../providers/types.js';
import { mapFrames, type AnimationFrames } from './PixelStyleNormalizer.js';

/** Màu viền: gần đen. Viền chạy quanh cả thân lẫn vật lạ nên không dùng làm "hạt giống" vật lạ. */
export function isOutline(c: RGBA): boolean {
	return c[3] > 0 && luminance(c[0], c[1], c[2]) < 0.07;
}

export function isSkin(c: RGBA): boolean {
	if (c[3] === 0) return false;
	const { h, s, l } = rgbToHsl(c[0], c[1], c[2]);
	return h >= 8 && h <= 38 && s >= 0.25 && s <= 0.8 && l >= 0.4 && l <= 0.88;
}

export interface ForeignCluster {
	animation: AnimationName;
	direction: Direction;
	frame: number;
	pixels: number;
	bounds: { x0: number; y0: number; x1: number; y1: number };
	colors: string[];
}

export interface ForeignScanOptions {
	/** Màu chỉ xuất hiện trong ≤ tỉ lệ frame này của CẢ nhân vật thì tính là màu hiếm. */
	rareFrameRatio?: number;
	/** Cụm màu hiếm nhỏ hơn ngưỡng này là chi tiết lẻ (ánh sáng, nếp vải), không phải vật lạ. */
	minClusterPixels?: number;
}

/**
 * Bắt "vật thể lạ" giữa các frame: vũ khí lúc có lúc không, áo/tóc đổi màu giữa chừng.
 * Cơ sở: một nhân vật nhất quán dùng lại cùng bảng màu ở gần như mọi frame; một cụm pixel liền nhau
 * mang màu mà gần như không frame nào khác có là dấu hiệu AI vẽ thêm đồ vào riêng frame đó.
 */
export function findForeignClusters(frames: AnimationFrames, opts: ForeignScanOptions = {}): ForeignCluster[] {
	const rare = rareColors(frames, opts.rareFrameRatio ?? 0.1);
	const minPixels = opts.minClusterPixels ?? 12;
	const out: ForeignCluster[] = [];
	eachFrame(frames, (img, animation, direction, frame) => {
		for (const comp of foreignSeeds(img, rare, minPixels)) {
			const xs = comp.map((p) => p[0]);
			const ys = comp.map((p) => p[1]);
			const colors = new Set(comp.map(([x, y]) => colorKey(getPixel(img, x, y))));
			out.push({
				animation,
				direction,
				frame,
				pixels: comp.length,
				bounds: { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs) + 1, y1: Math.max(...ys) + 1 },
				colors: [...colors].map((k) => `#${k.toString(16).padStart(6, '0')}`),
			});
		}
	});
	return out;
}

/**
 * Xoá vật lạ: lấy cụm màu hiếm làm hạt giống, rồi loang sang pixel chỉ giáp hạt giống/viền/nền
 * (phần cán, viền của chính vật đó) — pixel nào còn chạm màu của THÂN thì giữ lại. Mép thân lộ ra
 * sau khi xoá được kẻ viền lại để không bị hở.
 */
export function removeForeignObjects(frames: AnimationFrames, opts: ForeignScanOptions = {}): { frames: AnimationFrames; removedPixels: number } {
	const rare = rareColors(frames, opts.rareFrameRatio ?? 0.1);
	let removedPixels = 0;
	const result = mapFrames(frames, (src) => {
		const seeds = foreignSeeds(src, rare, opts.minClusterPixels ?? 12);
		if (seeds.length === 0) return src;
		const removed = new Uint8Array(src.width * src.height);
		for (const comp of seeds) for (const [x, y] of comp) removed[y * src.width + x] = 1;
		growIntoAttachedParts(src, removed);
		const { image, count } = commitRemoval(src, removed);
		removedPixels += count;
		return image;
	});
	return { frames: result, removedPixels };
}

/** Luật xoá theo vùng do người duyệt khai trong spec — cho phần máy không tự tách được (cán trượng tối màu). */
export interface EraseRule {
	animation: AnimationName;
	direction: Direction;
	/** Bỏ trống = mọi frame của hướng đó. */
	frames?: number[];
	/** Toạ độ canvas đích, [x0, y0, x1, y1) — x1/y1 không tính. */
	rect: [number, number, number, number];
	reason: string;
}

export function eraseRegions(frames: AnimationFrames, rules: readonly EraseRule[]): { frames: AnimationFrames; removedPixels: number } {
	let removedPixels = 0;
	const result = mapFrames(frames, (src, anim, dir, i) => {
		const hits = rules.filter((r) => r.animation === anim && r.direction === dir && (!r.frames || r.frames.includes(i)));
		if (!hits.length) return src;
		const removed = new Uint8Array(src.width * src.height);
		for (const { rect } of hits) {
			for (let y = rect[1]; y < rect[3]; y += 1) {
				for (let x = rect[0]; x < rect[2]; x += 1) {
					const c = getPixel(src, x, y);
					if (c[3] > 0 && !isSkin(c)) removed[y * src.width + x] = 1;
				}
			}
		}
		const { image, count } = commitRemoval(src, removed);
		removedPixels += count;
		return image;
	});
	return { frames: result, removedPixels };
}

export interface ThinOptions {
	/** Chỉ xét từ hàng này trở xuống: vật cầm tay thò ra ở nửa dưới, ngọn tóc nhọn ở nửa trên không bị đụng. */
	minY: number;
	/** Bán kính bào mòn: phần dày dưới 2·radius+1 px tính là "mảnh". */
	radius?: number;
	/** Mảnh phải dài ít nhất chừng này (đường chéo hộp bao, px) mới xoá — răng cưa lẻ ở mép không bị đụng. */
	minLength?: number;
	/** Tỉ lệ tối thiểu pixel màu gỗ hoặc viền trong mảnh — tay (da), ống tay áo không bị coi là que. */
	woodRatio?: number;
}

/**
 * Gỡ vật cầm tay mảnh (que, gậy) khỏi thân nhân vật: "bào mòn rồi đắp lại" mặt nạ hình, phần biến mất
 * là phần mảnh; chỉ xoá mảnh DÀI, ở nửa dưới, gần như toàn màu gỗ/viền. Dùng khi thân phải tay không
 * vì vũ khí là lớp riêng (docs/online-va-build.md).
 */
export function removeThinProtrusions(frames: AnimationFrames, opts: ThinOptions): { frames: AnimationFrames; removedPixels: number } {
	const r = opts.radius ?? 2;
	const minLength = opts.minLength ?? 7;
	const woodRatio = opts.woodRatio ?? 0.7;
	let removedPixels = 0;
	const result = mapFrames(frames, (src) => {
		const w = src.width;
		const h = src.height;
		const mask = new Uint8Array(w * h);
		for (let i = 0; i < w * h; i += 1) mask[i] = src.data[i * 4 + 3]! > 0 ? 1 : 0;
		const square = (m: Uint8Array, all: boolean): Uint8Array => {
			const out = new Uint8Array(w * h);
			for (let y = 0; y < h; y += 1) {
				for (let x = 0; x < w; x += 1) {
					let v = all ? 1 : 0;
					for (let dy = -r; dy <= r && v === (all ? 1 : 0); dy += 1) {
						for (let dx = -r; dx <= r; dx += 1) {
							const nx = x + dx;
							const ny = y + dy;
							const inside = nx >= 0 && ny >= 0 && nx < w && ny < h ? m[ny * w + nx]! : 0;
							if (all && !inside) {
								v = 0;
								break;
							}
							if (!all && inside) {
								v = 1;
								break;
							}
						}
					}
					out[y * w + x] = v;
				}
			}
			return out;
		};
		const opened = square(square(mask, true), false);
		const cand = new Uint8Array(w * h);
		for (let y = opts.minY; y < h; y += 1) for (let x = 0; x < w; x += 1) if (mask[y * w + x] && !opened[y * w + x]) cand[y * w + x] = 1;
		const removed = new Uint8Array(w * h);
		const seen = new Uint8Array(w * h);
		for (let i = 0; i < w * h; i += 1) {
			if (!cand[i] || seen[i]) continue;
			const comp: number[] = [];
			const stack = [i];
			seen[i] = 1;
			while (stack.length) {
				const j = stack.pop()!;
				comp.push(j);
				const cx = j % w;
				const cy = (j - cx) / w;
				for (let dy = -1; dy <= 1; dy += 1) {
					for (let dx = -1; dx <= 1; dx += 1) {
						const nx = cx + dx;
						const ny = cy + dy;
						if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
						const k = ny * w + nx;
						if (cand[k] && !seen[k]) {
							seen[k] = 1;
							stack.push(k);
						}
					}
				}
			}
			const xs = comp.map((j) => j % w);
			const ys = comp.map((j) => Math.floor(j / w));
			const length = Math.hypot(Math.max(...xs) - Math.min(...xs) + 1, Math.max(...ys) - Math.min(...ys) + 1);
			const wood = comp.filter((j) => {
				const c = getPixel(src, j % w, Math.floor(j / w));
				return isOutline(c) || isWood(c);
			}).length;
			if (length >= minLength && wood / comp.length >= woodRatio) for (const j of comp) removed[j] = 1;
		}
		const { image, count } = commitRemoval(src, removed);
		removedPixels += count;
		return image;
	});
	return { frames: result, removedPixels };
}

/**
 * Căn frame các động tác theo ảnh đứng (idle) cùng hướng. Nguồn như PixelLab đặt frame động tác lệch
 * vài px so với ảnh xoay; không căn thì vào game chuyển đứng ↔ đi là nhân vật nhảy lên/xuống. Dò độ dời
 * làm phần đầu–thân (60% trên của ảnh đứng, ít đổi nhất khi bước) khớp nhất, lấy TRUNG VỊ cho cả chu kỳ
 * để giữ nguyên nhịp nhún của từng frame.
 */
export function alignToIdle(frames: AnimationFrames, maxShift = 6): { frames: AnimationFrames; shifts: Record<string, [number, number]> } {
	const shifts: Record<string, [number, number]> = {};
	const out: AnimationFrames = { ...frames };
	for (const [anim, dirs] of Object.entries(frames) as [AnimationName, Partial<Record<Direction, RGBAImage[]>>][]) {
		if (anim === 'idle') continue;
		const next: Partial<Record<Direction, RGBAImage[]>> = {};
		for (const [dir, imgs] of Object.entries(dirs) as [Direction, RGBAImage[]][]) {
			const ref = frames.idle?.[dir]?.[0];
			// Hướng đang dùng ảnh tĩnh tạm (frame đầu trùng ảnh đứng) thì không căn.
			if (!ref || !imgs.length || sameImage(ref, imgs[0]!)) {
				next[dir] = imgs;
				continue;
			}
			const best = imgs.map((img) => bestShift(ref, img, maxShift));
			const med = (k: 0 | 1): number => [...best.map((b) => b[k])].sort((a, b) => a - b)[Math.floor(best.length / 2)]!;
			const shift: [number, number] = [med(0), med(1)];
			shifts[`${anim}/${dir}`] = shift;
			next[dir] = shift[0] || shift[1] ? imgs.map((img) => translate(img, shift[0], shift[1])) : imgs;
		}
		out[anim] = next;
	}
	return { frames: out, shifts };
}

function sameImage(a: RGBAImage, b: RGBAImage): boolean {
	if (a.width !== b.width || a.height !== b.height) return false;
	for (let i = 0; i < a.data.length; i += 1) if (a.data[i] !== b.data[i]) return false;
	return true;
}

function bestShift(ref: RGBAImage, img: RGBAImage, maxShift: number): [number, number] {
	const w = ref.width;
	const h = ref.height;
	let top = h;
	let bottom = 0;
	for (let y = 0; y < h; y += 1) {
		for (let x = 0; x < w; x += 1) {
			if (ref.data[(y * w + x) * 4 + 3]! === 0) continue;
			top = Math.min(top, y);
			bottom = Math.max(bottom, y);
		}
	}
	const cut = top + Math.round((bottom - top) * 0.6);
	let best: [number, number] = [0, 0];
	let bestScore = -1;
	for (let dy = -maxShift; dy <= maxShift; dy += 1) {
		for (let dx = -maxShift; dx <= maxShift; dx += 1) {
			let inter = 0;
			let union = 0;
			for (let y = top; y <= cut; y += 1) {
				for (let x = 0; x < w; x += 1) {
					const a = ref.data[(y * w + x) * 4 + 3]! > 0;
					const sx = x - dx;
					const sy = y - dy;
					const b = sx >= 0 && sy >= 0 && sx < w && sy < h && img.data[(sy * w + sx) * 4 + 3]! > 0;
					if (a && b) inter += 1;
					if (a || b) union += 1;
				}
			}
			const score = union ? inter / union : 0;
			// Hoà điểm thì chọn độ dời nhỏ hơn — không dời vô cớ.
			if (score > bestScore + 1e-9 || (Math.abs(score - bestScore) <= 1e-9 && Math.abs(dx) + Math.abs(dy) < Math.abs(best[0]) + Math.abs(best[1]))) {
				bestScore = score;
				best = [dx, dy];
			}
		}
	}
	return best;
}

function translate(img: RGBAImage, dx: number, dy: number): RGBAImage {
	const out = { width: img.width, height: img.height, data: new Uint8Array(img.data.length) };
	for (let y = 0; y < img.height; y += 1) {
		for (let x = 0; x < img.width; x += 1) {
			const sx = x - dx;
			const sy = y - dy;
			if (sx < 0 || sy < 0 || sx >= img.width || sy >= img.height) continue;
			const s = (sy * img.width + sx) * 4;
			out.data.set(img.data.subarray(s, s + 4), (y * img.width + x) * 4);
		}
	}
	return out;
}

/** Gỗ / da thuộc: nâu ấm, độ bão hoà vừa. Gồm cả nâu rất tối (viền nâu quanh que). */
function isWood(c: RGBA): boolean {
	if (c[3] === 0) return false;
	const { h, s, l } = rgbToHsl(c[0], c[1], c[2]);
	return h >= 8 && h <= 42 && s >= 0.15 && s <= 0.8 && l >= 0.08 && l <= 0.62;
}

/**
 * Cụm màu hiếm đủ lớn. Cụm GIÁP DA bị loại: đó là mắt/miệng nhìn nghiêng — chỉ hiện ở vài hướng
 * nên "hiếm" một cách hợp lệ (bản đầu đã xoá nhầm mắt ở các hướng W/E/SE vì thiếu luật này).
 */
function foreignSeeds(img: RGBAImage, rare: Set<number>, minPixels: number): [number, number][][] {
	return components(img, (c) => rare.has(colorFamily(c))).filter(
		(comp) =>
			comp.length >= minPixels &&
			!comp.some(([x, y]) => {
				for (let dy = -1; dy <= 1; dy += 1) for (let dx = -1; dx <= 1; dx += 1) if (isSkin(getPixel(img, x + dx, y + dy))) return true;
				return false;
			}),
	);
}

/** Loang sang pixel chỉ giáp phần đã xoá/viền/nền — pixel nào còn chạm màu của THÂN thì giữ. */
function growIntoAttachedParts(img: RGBAImage, removed: Uint8Array): void {
	const idx = (x: number, y: number): number => y * img.width + x;
	const inside = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < img.width && y < img.height;
	const isBody = (x: number, y: number): boolean => inside(x, y) && !removed[idx(x, y)] && !isOutline(getPixel(img, x, y)) && alphaAt(img, x, y) > 0;
	let grew = true;
	while (grew) {
		grew = false;
		for (let y = 0; y < img.height; y += 1) {
			for (let x = 0; x < img.width; x += 1) {
				if (removed[idx(x, y)] || alphaAt(img, x, y) === 0 || isSkin(getPixel(img, x, y))) continue;
				const n4: [number, number][] = [
					[x + 1, y],
					[x - 1, y],
					[x, y + 1],
					[x, y - 1],
				];
				if (!n4.some(([nx, ny]) => inside(nx, ny) && removed[idx(nx, ny)])) continue;
				if (n4.some(([nx, ny]) => isBody(nx, ny))) continue;
				removed[idx(x, y)] = 1;
				grew = true;
			}
		}
	}
}

/** Xoá theo mặt nạ rồi kẻ viền lại mép thân bị lộ (bằng đúng màu viền của sprite). */
function commitRemoval(src: RGBAImage, removed: Uint8Array): { image: RGBAImage; count: number } {
	const img = cloneImage(src);
	const outline = darkestOutline(img);
	let count = 0;
	for (let i = 0; i < removed.length; i += 1) {
		if (!removed[i]) continue;
		img.data.fill(0, i * 4, i * 4 + 4);
		count += 1;
	}
	for (let y = 0; y < img.height; y += 1) {
		for (let x = 0; x < img.width; x += 1) {
			const c = getPixel(img, x, y);
			if (c[3] === 0 || isOutline(c)) continue;
			const exposed = [
				[x + 1, y],
				[x - 1, y],
				[x, y + 1],
				[x, y - 1],
			].some(([nx, ny]) => nx! >= 0 && ny! >= 0 && nx! < img.width && ny! < img.height && removed[ny! * img.width + nx!] === 1);
			if (exposed) setPixel(img, x, y, outline);
		}
	}
	return { image: img, count };
}

/**
 * So theo HỌ màu (lượng tử 3 bit/kênh), không theo mã màu chính xác: chi tiết thật như viên đá
 * trên ngực đổi sắc độ từng frame, so khớp chính xác sẽ coi nó là vật lạ.
 */
function colorFamily(c: RGBA): number {
	return ((c[0] >> 5) << 6) | ((c[1] >> 5) << 3) | (c[2] >> 5);
}

function rareColors(frames: AnimationFrames, ratio: number): Set<number> {
	const seenIn = new Map<number, number>();
	let total = 0;
	eachFrame(frames, (img) => {
		total += 1;
		const local = new Set<number>();
		for (let i = 0; i < img.width * img.height; i += 1) {
			if (img.data[i * 4 + 3] === 0) continue;
			const c: RGBA = [img.data[i * 4]!, img.data[i * 4 + 1]!, img.data[i * 4 + 2]!, 255];
			if (!isOutline(c)) local.add(colorFamily(c));
		}
		for (const k of local) seenIn.set(k, (seenIn.get(k) ?? 0) + 1);
	});
	const limit = Math.max(1, Math.floor(total * ratio));
	return new Set([...seenIn].filter(([, n]) => n <= limit).map(([k]) => k));
}

function components(img: RGBAImage, pick: (c: RGBA) => boolean): [number, number][][] {
	const seen = new Uint8Array(img.width * img.height);
	const out: [number, number][][] = [];
	for (let y = 0; y < img.height; y += 1) {
		for (let x = 0; x < img.width; x += 1) {
			if (seen[y * img.width + x] || !pick(getPixel(img, x, y))) continue;
			const comp: [number, number][] = [];
			const stack: [number, number][] = [[x, y]];
			seen[y * img.width + x] = 1;
			while (stack.length) {
				const [cx, cy] = stack.pop()!;
				comp.push([cx, cy]);
				for (let dy = -1; dy <= 1; dy += 1) {
					for (let dx = -1; dx <= 1; dx += 1) {
						const nx = cx + dx;
						const ny = cy + dy;
						if (nx < 0 || ny < 0 || nx >= img.width || ny >= img.height) continue;
						if (seen[ny * img.width + nx] || !pick(getPixel(img, nx, ny))) continue;
						seen[ny * img.width + nx] = 1;
						stack.push([nx, ny]);
					}
				}
			}
			out.push(comp);
		}
	}
	return out;
}

/** Màu viền phổ biến nhất của chính sprite — kẻ viền lại bằng đúng màu đó, không áp đen thuần. */
function darkestOutline(img: RGBAImage): RGBA {
	const counts = new Map<number, number>();
	for (let i = 0; i < img.width * img.height; i += 1) {
		const c: RGBA = [img.data[i * 4]!, img.data[i * 4 + 1]!, img.data[i * 4 + 2]!, img.data[i * 4 + 3]!];
		if (isOutline(c)) counts.set(colorKey(c), (counts.get(colorKey(c)) ?? 0) + 1);
	}
	const best = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;
	return [(best >> 16) & 255, (best >> 8) & 255, best & 255, 255];
}

export function eachFrame(frames: AnimationFrames, fn: (img: RGBAImage, anim: AnimationName, dir: Direction, index: number) => void): void {
	for (const [anim, dirs] of Object.entries(frames) as [AnimationName, Partial<Record<Direction, RGBAImage[]>>][]) {
		for (const [dir, list] of Object.entries(dirs) as [Direction, RGBAImage[]][]) list.forEach((img, i) => fn(img, anim, dir, i));
	}
}

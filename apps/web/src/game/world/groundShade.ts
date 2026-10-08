import { fbm, hash2, valueNoise } from './noise';

export interface TerrainGrid {
	tileSize: number;
	width: number;
	height: number;
	seed: number;
	terrain: string[];
	/** Bảng màu mặt đất của vùng (thiếu = đồng cỏ): nghĩa địa/đồi xương là đất chết, vách đá là nền đá. */
	biome?: Biome;
}

export type Biome = 'meadow' | 'deadland' | 'rocky';

type RGB = [number, number, number];

/** Màu theo HSV (độ, 0–1, 0–1): bảng màu dưới đây đổi sắc theo độ sáng (tối ngả lạnh, sáng ngả ấm) như pixel art vẽ tay. */
function hsv(h: number, s: number, v: number): RGB {
	const f = (n: number): number => {
		const k = (n + h / 60) % 6;
		return Math.round((v - v * s * Math.max(0, Math.min(k, 4 - k, 1))) * 255);
	};
	return [f(5), f(3), f(1)];
}

/**
 * Bảng màu mặt đất, mỗi dải từ tối tới sáng. Cỏ cùng họ sắc với lá cây FreePixel (h 85–110) nhưng nhạt
 * và trầm hơn một bậc để nền lùi ra sau, đồ vật nổi lên trên.
 */
const MEADOW = {
	grass: [hsv(118, 0.56, 0.27), hsv(112, 0.54, 0.35), hsv(106, 0.52, 0.43), hsv(100, 0.52, 0.5), hsv(93, 0.52, 0.58), hsv(85, 0.5, 0.66), hsv(76, 0.44, 0.75)],
	forest: [hsv(150, 0.5, 0.15), hsv(138, 0.48, 0.2), hsv(124, 0.46, 0.26), hsv(112, 0.45, 0.33), hsv(100, 0.45, 0.41), hsv(90, 0.45, 0.49), hsv(80, 0.42, 0.57)],
	dirt: [hsv(20, 0.52, 0.22), hsv(24, 0.5, 0.3), hsv(27, 0.48, 0.38), hsv(30, 0.46, 0.46), hsv(33, 0.43, 0.54), hsv(36, 0.38, 0.62), hsv(40, 0.3, 0.7)],
	stone: [hsv(30, 0.18, 0.2), hsv(35, 0.12, 0.38), hsv(36, 0.11, 0.48), hsv(38, 0.1, 0.56), hsv(40, 0.09, 0.64), hsv(42, 0.08, 0.72), hsv(45, 0.06, 0.8)],
	water: [hsv(222, 0.72, 0.3), hsv(216, 0.68, 0.38), hsv(210, 0.64, 0.47), hsv(203, 0.58, 0.56), hsv(195, 0.5, 0.64), hsv(188, 0.4, 0.72), hsv(184, 0.26, 0.84)],
	foam: hsv(185, 0.1, 0.94),
	wood: [hsv(22, 0.55, 0.18), hsv(25, 0.52, 0.3), hsv(27, 0.5, 0.38), hsv(29, 0.48, 0.46), hsv(31, 0.44, 0.54), hsv(34, 0.38, 0.63)],
	petals: [hsv(50, 0.08, 0.96), hsv(48, 0.62, 0.97), hsv(335, 0.38, 0.95), hsv(265, 0.3, 0.9), hsv(205, 0.42, 0.95)],
	flowerCore: hsv(42, 0.75, 0.95),
	leaf: [hsv(28, 0.62, 0.55), hsv(18, 0.66, 0.48), hsv(38, 0.6, 0.6)],
	moss: hsv(95, 0.5, 0.45),
};

type Palette = typeof MEADOW;
const DRY_LEAF = [hsv(30, 0.45, 0.42), hsv(22, 0.5, 0.36), hsv(40, 0.4, 0.48)];

/**
 * Bảng màu theo vùng: chỉ thay dải cỏ/nền rừng/lá rụng/hoa (đất, đá, nước, gỗ cầu giữ chung). Mỗi dải vẫn 7 bậc tối →
 * sáng, sắc trôi theo độ sáng như bảng đồng cỏ để nền vẫn đọc ra "vẽ tay".
 */
const PALETTES: Record<Biome, Palette> = {
	meadow: MEADOW,
	deadland: {
		...MEADOW,
		grass: [hsv(60, 0.38, 0.24), hsv(56, 0.38, 0.31), hsv(52, 0.38, 0.38), hsv(48, 0.38, 0.45), hsv(45, 0.36, 0.52), hsv(42, 0.34, 0.6), hsv(40, 0.3, 0.68)],
		forest: [hsv(40, 0.28, 0.13), hsv(42, 0.28, 0.18), hsv(44, 0.27, 0.23), hsv(46, 0.27, 0.29), hsv(48, 0.26, 0.35), hsv(50, 0.25, 0.42), hsv(52, 0.24, 0.49)],
		petals: [hsv(50, 0.05, 0.85), hsv(280, 0.2, 0.7), hsv(0, 0, 0.75), hsv(60, 0.3, 0.8), hsv(220, 0.15, 0.75)],
		leaf: DRY_LEAF,
		moss: hsv(70, 0.35, 0.38),
	},
	rocky: {
		...MEADOW,
		grass: [hsv(90, 0.12, 0.25), hsv(80, 0.12, 0.32), hsv(70, 0.11, 0.4), hsv(60, 0.1, 0.47), hsv(50, 0.1, 0.54), hsv(45, 0.09, 0.61), hsv(40, 0.08, 0.69)],
		forest: [hsv(220, 0.12, 0.14), hsv(215, 0.11, 0.19), hsv(210, 0.1, 0.24), hsv(205, 0.1, 0.3), hsv(200, 0.09, 0.36), hsv(195, 0.09, 0.42), hsv(190, 0.08, 0.48)],
		petals: [hsv(50, 0.05, 0.85), hsv(48, 0.4, 0.85), hsv(0, 0, 0.75), hsv(200, 0.2, 0.8), hsv(30, 0.3, 0.8)],
		leaf: DRY_LEAF,
		moss: hsv(95, 0.35, 0.4),
	},
};

/** Màu lót một ô (khi chunk chưa sinh kịp) và màu phẳng của minimap — bậc giữa của từng dải trong bảng màu vùng. */
const UNDERLAY_MEADOW: Record<string, RGB> = { g: [83, 133, 67], f: [55, 88, 51], d: [133, 100, 66], c: [150, 145, 133], w: [58, 110, 160], b: [130, 92, 58] };
export function terrainColor(biome: Biome | undefined, ch: string): RGB {
	if (!biome || biome === 'meadow') return UNDERLAY_MEADOW[ch] ?? [0, 0, 0];
	const p = PALETTES[biome];
	if (ch === 'g') return p.grass[3]!;
	if (ch === 'f') return p.forest[3]!;
	return UNDERLAY_MEADOW[ch] ?? [0, 0, 0];
}

const G = 0;
const F = 1;
const D = 2;
const C = 3;
const W = 4;
const B = 5;
const CODE: Record<string, number> = { g: G, f: F, d: D, c: C, w: W, b: B };

/**
 * Ngọn cỏ 7×6, hàng cuối là gốc. l = ngọn sáng, m = thân, d = bóng ở gốc. Rải theo lưới lệch ngẫu nhiên
 * nên đọc ra "bãi cỏ" thay vì "nhiễu" — mắt bắt được hình ngọn cỏ chứ không phải hạt màu.
 */
const BLADES = [
	['.......', '...l...', '...m...', '..m....', '..m....', '..d....'],
	['.......', '.l...l.', '..l.m..', '..m.m..', '.m.m.m.', '..ddd..'],
	['.......', '....l..', '.l..m..', '.m.m...', '..mm...', '..dd...'],
	['.......', '.......', '.......', '..l.l..', '..m.m..', '...d...'],
	['.......', '..l....', '...m.l.', '.l.m.m.', '..mmm..', '..ddd..'],
	['.......', '.......', '...l...', '.l.m...', '..mm...', '..dd...'],
].map((rows) => rows.map((r) => [...r]));

const PEBBLES = [
	['.lm.', 'lmmd', '.dd.'],
	['lm', 'md'],
	['.lm', 'lmd'],
].map((rows) => rows.map((r) => [...r]));

/**
 * Tô màu mặt đất — hàm THUẦN (không đụng DOM) để chạy được trong Web Worker. Trả về RGBA của vùng
 * [ox, ox+w) × [oy, oy+h) toạ độ thế giới.
 */
export function renderGroundChunk(map: TerrainGrid, ox: number, oy: number, w: number, h: number): Uint8ClampedArray {
	const s = shaderFor(map);
	const out = new Uint8ClampedArray(w * h * 4);
	for (let y = 0; y < h; y += 1) {
		for (let x = 0; x < w; x += 1) {
			const c = s.shade(ox + x, oy + y);
			const i = (y * w + x) * 4;
			out[i] = c[0];
			out[i + 1] = c[1];
			out[i + 2] = c[2];
			out[i + 3] = 255;
		}
	}
	return out;
}

let cached: { map: TerrainGrid; shader: GroundShader } | null = null;
function shaderFor(map: TerrainGrid): GroundShader {
	if (cached?.map !== map) cached = { map, shader: new GroundShader(map) };
	return cached.shader;
}

export class GroundShader {
	private readonly kinds: Uint8Array;
	/** Ô cách cầu ≤ 1 ô: KHÔNG làm méo biên ở đây, để đất và bờ sông gặp đúng mép dầm cầu. */
	private readonly calm: Uint8Array;
	private readonly seed: number;
	private readonly T: number;
	private readonly acc = new Float32Array(6);
	private readonly pal: Palette;
	/** Kết quả `sample`: loại địa hình, loại kề bên, khoảng cách (px) tới biên với loại kề bên. */
	private k = G;
	private k2 = G;
	private d = 0;

	constructor(private readonly map: TerrainGrid) {
		this.pal = PALETTES[map.biome ?? 'meadow'] ?? MEADOW;
		this.seed = map.seed;
		this.T = map.tileSize;
		this.kinds = new Uint8Array(map.width * map.height);
		this.calm = new Uint8Array(map.width * map.height);
		for (let y = 0; y < map.height; y += 1) {
			for (let x = 0; x < map.width; x += 1) this.kinds[y * map.width + x] = CODE[map.terrain[y]![x]!] ?? W;
		}
		for (let y = 0; y < map.height; y += 1) {
			for (let x = 0; x < map.width; x += 1) {
				if (this.kinds[y * map.width + x] !== B) continue;
				for (let j = -1; j <= 1; j += 1) for (let i = -2; i <= 2; i += 1) this.setCalm(x + i, y + j);
			}
		}
	}

	/** Loại địa hình của ô (đúng như map, không làm mềm) — cầu, va chạm. */
	tileAt(px: number, py: number): number {
		const tx = Math.min(this.map.width - 1, Math.max(0, Math.floor(px / this.T)));
		const ty = Math.min(this.map.height - 1, Math.max(0, Math.floor(py / this.T)));
		return this.kinds[ty * this.map.width + tx]!;
	}

	shade(x: number, y: number): RGB {
		if (this.onBridge(x, y)) return this.bridge(x, y);
		this.sample(x, y);
		switch (this.k) {
			case W:
				return this.water(x, y);
			case D:
				return this.dirt(x, y);
			case C:
				return this.cobble(x, y);
			case F:
				return this.forest(x, y);
			default:
				return this.grass(x, y);
		}
	}

	private setCalm(tx: number, ty: number): void {
		if (tx >= 0 && ty >= 0 && tx < this.map.width && ty < this.map.height) this.calm[ty * this.map.width + tx] = 1;
	}

	/**
	 * Địa hình làm MỀM: trọng số song tuyến của 4 tâm ô quanh điểm (sau khi làm méo bằng nhiễu) → góc
	 * vuông của lưới ô thành đường cong, bờ sông bậc thang thành bờ lượn. `d` ≈ khoảng cách tới biên
	 * (px), dùng cho viền/bờ mà không phải lấy mẫu điểm lân cận.
	 */
	private sample(x: number, y: number): void {
		const s = this.seed;
		const T = this.T;
		const calm = this.calm[Math.min(this.map.height - 1, Math.max(0, Math.floor(y / T))) * this.map.width + Math.min(this.map.width - 1, Math.max(0, Math.floor(x / T)))] === 1;
		const a = calm ? 0 : 1;
		const wx = x + a * ((valueNoise(x / 31, y / 31, s + 7) - 0.5) * 18 + (valueNoise(x / 7, y / 7, s + 9) - 0.5) * 4);
		const wy = y + a * ((valueNoise(x / 31, y / 31, s + 8) - 0.5) * 18 + (valueNoise(x / 7, y / 7, s + 10) - 0.5) * 4);
		const u = wx / T - 0.5;
		const v = wy / T - 0.5;
		const i = Math.floor(u);
		const j = Math.floor(v);
		const fu = u - i;
		const fv = v - j;
		const acc = this.acc;
		acc.fill(0);
		acc[this.smoothKind(i, j)]! += (1 - fu) * (1 - fv);
		acc[this.smoothKind(i + 1, j)]! += fu * (1 - fv);
		acc[this.smoothKind(i, j + 1)]! += (1 - fu) * fv;
		acc[this.smoothKind(i + 1, j + 1)]! += fu * fv;
		let k = G;
		let k2 = -1;
		for (let n = 1; n < 6; n += 1) if (acc[n]! > acc[k]!) k = n;
		for (let n = 0; n < 6; n += 1) if (n !== k && acc[n]! > 0 && (k2 < 0 || acc[n]! > acc[k2]!)) k2 = n;
		this.k = k;
		this.k2 = k2 < 0 ? k : k2;
		this.d = k2 < 0 ? T / 2 : ((acc[k]! - acc[k2]!) * T) / 2;
	}

	/** Cầu tính như nước khi làm mềm: dòng sông chảy liền dưới cầu, cầu vẽ đè lên sau. */
	private smoothKind(tx: number, ty: number): number {
		const k = this.kinds[Math.min(this.map.height - 1, Math.max(0, ty)) * this.map.width + Math.min(this.map.width - 1, Math.max(0, tx))]!;
		return k === B ? W : k;
	}

	/** Ô cầu + mố cầu lấn 4px sang ô đất hai đầu (che khe giữa đất và dầm). */
	private onBridge(x: number, y: number): boolean {
		if (this.tileAt(x, y) === B) return true;
		return this.tileAt(x - 4, y) === B || this.tileAt(x + 4, y) === B;
	}

	/** Ngọn cỏ tại điểm: 0 = không có, 1 = ngọn, 2 = thân, 3 = gốc. Hình 7×6, gốc ở hàng cuối. */
	private blade(x: number, y: number, cell: number, density: number, salt: number): number {
		const gx = Math.floor(x / cell);
		const gy = Math.floor(y / cell);
		// Gốc ngọn cỏ luôn ở dưới hoặc ngang điểm, ngọn vươn lên tối đa 5px → chỉ cần xét các ô từ hàng hiện tại trở xuống.
		const cyMax = gy + 1 + Math.floor(4 / cell);
		for (let cy = gy; cy <= cyMax; cy += 1) {
			for (let cx = gx - 1; cx <= gx + 1; cx += 1) {
				if (hash2(cx, cy, salt) > density) continue;
				const bx = cx * cell + Math.floor(hash2(cx, cy, salt + 1) * cell);
				const by = cy * cell + Math.floor(hash2(cx, cy, salt + 2) * cell);
				const dx = x - bx + 3;
				const dy = y - by + 5;
				if (dx < 0 || dx > 6 || dy < 0 || dy > 5) continue;
				const g = BLADES[Math.floor(hash2(cx, cy, salt + 3) * BLADES.length)]!;
				const ch = g[dy]![dx];
				if (ch === 'l') return 1;
				if (ch === 'm') return 2;
				if (ch === 'd') return 3;
			}
		}
		return 0;
	}

	/** Hoa dại hình chữ thập 3×3: nhuỵ vàng, cánh một màu theo bông. Trả về màu hoặc null. */
	private flower(x: number, y: number, density: number): RGB | null {
		const cell = 9;
		const gx = Math.floor(x / cell);
		const gy = Math.floor(y / cell);
		const s = this.seed + 300;
		for (let cy = gy - 1; cy <= gy + 1; cy += 1) {
			for (let cx = gx - 1; cx <= gx + 1; cx += 1) {
				if (hash2(cx, cy, s) > density) continue;
				const fx = cx * cell + 1 + Math.floor(hash2(cx, cy, s + 1) * (cell - 2));
				const fy = cy * cell + 1 + Math.floor(hash2(cx, cy, s + 2) * (cell - 2));
				const dx = x - fx;
				const dy = y - fy;
				if (dx === 0 && dy === 0) return this.pal.flowerCore;
				if (Math.abs(dx) + Math.abs(dy) === 1) return this.pal.petals[Math.floor(hash2(cx, cy, s + 3) * this.pal.petals.length)]!;
			}
		}
		return null;
	}

	private grassLevel(x: number, y: number): number {
		const s = this.seed;
		// Mảng sáng/tối rất rộng; nhiễu kéo dãn theo trục DỌC làm mép mảng răng cưa như ngọn cỏ, không loang như vết sơn.
		const t = fbm(x / 160, y / 160, s + 1, 3) * 0.8 + fbm(x / 48, y / 48, s + 2, 2) * 0.2 + (valueNoise(x / 1.7, y / 5, s + 3) - 0.5) * 0.16;
		return 2 + Math.max(-1, Math.min(2, Math.round((t - 0.5) * 5)));
	}

	private grass(x: number, y: number): RGB {
		const s = this.seed;
		let lvl = this.grassLevel(x, y);
		if (this.k2 === F && this.d < 7 && hash2(x, y, s + 70) < (1 - this.d / 7) * 0.55) return this.forest(x, y);
		if (this.k2 === W && this.d < 4) return this.d < 1.6 ? this.pal.dirt[1]! : this.pal.grass[Math.max(0, lvl - 2)]!;
		const meadow = fbm(x / 90, y / 90, s + 4, 2);
		const bloom = fbm(x / 45, y / 45, s + 16, 2);
		if (bloom > 0.64) {
			const fl = this.flower(x, y, Math.min(0.6, (bloom - 0.64) * 3));
			if (fl) return fl;
		}
		const b = this.blade(x, y, 6, 0.22 + meadow * 0.5, s + 200);
		if (b === 1) return this.pal.grass[Math.min(6, lvl + 2)]!;
		if (b === 2) return this.pal.grass[Math.min(6, lvl + 1)]!;
		if (b === 3) lvl -= 1;
		// Mép cỏ giáp đường/đá: một viền tối đứt quãng như mép thảm cỏ dày đổ bóng xuống đường.
		if ((this.k2 === D || this.k2 === C) && this.d < 1.4 && hash2(x >> 1, y >> 1, s + 71) > 0.25) lvl = Math.min(lvl, 1) - 1;
		return this.pal.grass[Math.max(0, lvl)]!;
	}

	private forest(x: number, y: number): RGB {
		const s = this.seed;
		const t = fbm(x / 70, y / 70, s + 5, 3) * 0.8 + (valueNoise(x / 4, y / 4, s + 6) - 0.5) * 0.14;
		let lvl = 1 + Math.max(0, Math.min(3, Math.floor(t * 4)));
		if (this.k2 === W && this.k === F && this.d < 4) return this.d < 1.6 ? this.pal.dirt[0]! : this.pal.forest[Math.max(0, lvl - 2)]!;
		if (fbm(x / 26, y / 26, s + 15, 2) > 0.66) lvl += 1;
		const lc = 5;
		const lx = Math.floor(x / lc);
		const ly = Math.floor(y / lc);
		if (hash2(lx, ly, s + 41) < 0.09) {
			const px = lx * lc + Math.floor(hash2(lx, ly, s + 42) * 3);
			const py = ly * lc + Math.floor(hash2(lx, ly, s + 43) * 4);
			if ((x === px || x === px + 1) && y === py) return this.pal.leaf[Math.floor(hash2(lx, ly, s + 44) * this.pal.leaf.length)]!;
		}
		const b = this.blade(x, y, 6, 0.12, s + 210);
		if (b === 1) return this.pal.forest[Math.min(6, lvl + 2)]!;
		if (b === 2) return this.pal.forest[Math.min(6, lvl + 1)]!;
		if (b === 3) lvl -= 1;
		return this.pal.forest[Math.max(0, lvl)]!;
	}

	/** Đường đất hơi LÕM: tối dần về sát mép cỏ, có sỏi nhỏ đổ bóng, cỏ mép đường mọc lấn ra. */
	private dirt(x: number, y: number): RGB {
		const s = this.seed;
		const edge = this.k2 === G || this.k2 === F;
		if (edge && this.d < 3) {
			const b = this.blade(x, y, 4, 0.55, s + 220);
			const pal = this.k2 === F ? this.pal.forest : this.pal.grass;
			if (b === 1) return pal[4]!;
			if (b === 2) return pal[3]!;
		}
		if (this.k2 === W && this.d < 3) return this.d < 1.4 ? this.pal.dirt[0]! : this.pal.dirt[1]!;
		const t = fbm(x / 90, y / 90, s + 11, 3) * 0.75 + (valueNoise(x / 5, y / 2.5, s + 12) - 0.5) * 0.14;
		let lvl = 3 + Math.max(-1, Math.min(1, Math.round((t - 0.5) * 4)));
		if (edge) {
			if (this.d < 1.5) lvl = 0;
			else if (this.d < 4.5) lvl -= 1;
		}
		// Vệt bánh xe: hai rãnh song song cách mép đường ~12px (d bão hoà ở nửa ô nên chỉ đường đủ rộng mới có).
		if (this.d > 11 && this.d < 13.5 && valueNoise(x / 11, y / 11, s + 13) > 0.35) lvl -= 1;
		const p = this.pebble(x, y, 8, 0.05, s + 230);
		if (p) {
			const stone = hash2(Math.floor(x / 8), Math.floor(y / 8), s + 234) < 0.6;
			const pal = stone ? this.pal.stone : this.pal.dirt;
			if (p === 1) return pal[stone ? 5 : 5]!;
			if (p === 2) return pal[stone ? 3 : 4]!;
			if (p === 3) return pal[stone ? 1 : 1]!;
			lvl = Math.min(lvl, 1);
		}
		return this.pal.dirt[Math.max(0, lvl)]!;
	}

	/** Sỏi tại điểm: 1 sáng, 2 giữa, 3 tối, 4 = bóng đổ ngay dưới viên sỏi. */
	private pebble(x: number, y: number, cell: number, density: number, salt: number): number {
		const gx = Math.floor(x / cell);
		const gy = Math.floor(y / cell);
		for (let cy = gy - 1; cy <= gy; cy += 1) {
			for (let cx = gx - 1; cx <= gx; cx += 1) {
				if (hash2(cx, cy, salt) > density) continue;
				const g = PEBBLES[Math.floor(hash2(cx, cy, salt + 3) * PEBBLES.length)]!;
				const px = cx * cell + Math.floor(hash2(cx, cy, salt + 1) * (cell - 3));
				const py = cy * cell + Math.floor(hash2(cx, cy, salt + 2) * (cell - 3));
				const dx = x - px;
				const dy = y - py;
				if (dy === g.length && dx >= 0 && dx < g[0]!.length) return 4;
				const ch = g[dy]?.[dx];
				if (ch === 'l') return 1;
				if (ch === 'm') return 2;
				if (ch === 'd') return 3;
			}
		}
		return 0;
	}

	/** Đá cuội: mỗi viên một sắc, mạch vữa tối có rêu, nửa trên-trái viên sáng, nửa dưới-phải tối (nắng từ trên-trái). */
	private cobble(x: number, y: number): RGB {
		const s = this.seed;
		const edge = this.k2 === G || this.k2 === F;
		if (edge && this.d < 3) {
			const b = this.blade(x, y, 4, 0.6, s + 240);
			if (b === 1) return this.pal.grass[4]!;
			if (b === 2) return this.pal.grass[3]!;
			if (this.d < 1.6) return this.pal.stone[0]!;
		}
		const cell = 11;
		const gx = Math.floor(x / cell);
		const gy = Math.floor(y / cell);
		let d1 = Infinity;
		let d2 = Infinity;
		let id = 0;
		let fx = 0;
		let fy = 0;
		for (let j = -1; j <= 1; j += 1) {
			for (let i = -1; i <= 1; i += 1) {
				const px = (gx + i + 0.15 + hash2(gx + i, gy + j, s + 21) * 0.7) * cell;
				const py = (gy + j + 0.15 + hash2(gx + i, gy + j, s + 22) * 0.7) * cell;
				const dd = Math.hypot(x - px, (y - py) * 1.2);
				if (dd < d1) {
					d2 = d1;
					d1 = dd;
					id = hash2(gx + i, gy + j, s + 23);
					fx = px;
					fy = py;
				} else if (dd < d2) d2 = dd;
			}
		}
		const gap = d2 - d1;
		if (gap < 1.4) return hash2(x, y, s + 24) < 0.1 ? this.pal.moss : this.pal.stone[0]!;
		let lvl = 2 + Math.floor(id * 3);
		if (gap < 3.2) {
			const side = (x - fx) + (y - fy);
			if (side < -1) lvl += 1;
			else if (side > 1) lvl -= 1;
		}
		if (hash2(x, y, s + 25) < 0.04) lvl -= 1;
		return this.pal.stone[Math.max(1, Math.min(6, lvl))]!;
	}

	/** Nước: nông sáng ở bờ → sâu tối ở giữa, viền bọt đứt quãng, gợn sáng chạy dọc dòng chảy. */
	private water(x: number, y: number): RGB {
		const s = this.seed;
		const d = this.d;
		if (d < 1.1) return valueNoise(x / 3, y / 2, s + 31) > 0.38 ? this.pal.foam : this.pal.water[5]!;
		let lvl: number;
		if (d < 3.5) lvl = 5;
		else if (d < 8) lvl = 4;
		else if (d < 14) lvl = 3;
		else {
			const flow = valueNoise(x / 16, y / 46, s + 32) * 0.7 + valueNoise(x / 5, y / 12, s + 33) * 0.3;
			lvl = flow > 0.62 ? 2 : flow < 0.3 ? 0 : 1;
			const rx = Math.floor(x / 11);
			const ry = Math.floor(y / 6);
			if (y % 6 === 0 && hash2(rx, ry, s + 34) < 0.16 && x % 11 < 2 + Math.floor(hash2(rx, ry, s + 35) * 5)) lvl = 4;
		}
		// Bóng cầu đổ xuống mặt nước ngay dưới dầm cầu.
		if (this.tileAt(x, y - 7) === B && this.tileAt(x, y) !== B) lvl = Math.max(0, lvl - 2);
		return this.pal.water[lvl]!;
	}

	/** Cầu gỗ Đông–Tây: ván ngang dòng chảy (mỗi tấm rộng 6px), dầm hai mép, đinh ở hai đầu ván. */
	private bridge(x: number, y: number): RGB {
		const T = this.T;
		// Điểm trên mố cầu (lấn sang ô đất) thì lấy cột cầu kề bên để tìm mép trên/dưới.
		const tx = Math.floor((this.tileAt(x, y) === B ? x : this.tileAt(x - 4, y) === B ? x - 4 : x + 4) / T);
		const mw = this.map.width;
		let top = Math.floor(y / T);
		while (top > 0 && this.kinds[(top - 1) * mw + tx] === B) top -= 1;
		let bottom = Math.floor(y / T);
		while (bottom < this.map.height - 1 && this.kinds[(bottom + 1) * mw + tx] === B) bottom += 1;
		const ly = y - top * T;
		const h = (bottom - top + 1) * T;
		if (ly < 2 || ly >= h - 2) return this.pal.wood[0]!;
		if (ly < 5) return ly === 2 ? this.pal.wood[4]! : this.pal.wood[2]!;
		if (ly >= h - 6) return ly === h - 3 ? this.pal.wood[1]! : this.pal.wood[2]!;
		const plank = Math.floor(x / 6);
		const px = ((x % 6) + 6) % 6;
		if (px === 0) return this.pal.wood[0]!;
		if ((ly === 7 || ly === h - 8) && px === 3) return this.pal.wood[1]!;
		let lvl = 2 + Math.floor(hash2(plank, 0, this.seed + 50) * 2.4);
		if (px === 1) lvl += 1;
		if (px === 5) lvl -= 1;
		if (hash2(plank, Math.floor(ly / 9), this.seed + 51) < 0.12 && px === 3) lvl -= 1;
		return this.pal.wood[Math.max(1, Math.min(5, lvl))]!;
	}
}

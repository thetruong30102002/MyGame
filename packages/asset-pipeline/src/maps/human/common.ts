import type { PropMeta } from '../../props/buildProps.js';

/**
 * Phần dùng chung của các map vùng Human Kingdom. Mỗi map sinh từ hạt giống cố định → chạy lại ra đúng map cũ;
 * sửa bố cục thì sửa file map rồi chạy `map`.
 * Địa hình (1 ký tự/ô 48px): g cỏ · f nền rừng · d đường đất · c đá cuội · w nước · b cầu gỗ.
 */
export const TILE = 48;

export type Edge = 'N' | 'S' | 'E' | 'W';

/**
 * Lối sang map khác: dải 1 ô sát MÉP map. Người chơi bước vào dải (đang đi về phía mép đó) thì nạp map `to`, đứng
 * ở địa điểm `toSpot` của map đó. `label` hiện cạnh mũi tên chỉ hướng.
 */
export interface MapExit {
	id: string;
	to: string;
	toSpot: string;
	edge: Edge;
	x0: number;
	y0: number;
	x1: number;
	y1: number;
	label: string;
}

export interface MonsterZone {
	id: string;
	name: string;
	x: number;
	y: number;
	radius: number;
	/** Mỗi map CHỈ MỘT loại quái (chủ dự án chốt 07/10/2026) — pipeline kiểm. */
	monsters: string[];
	/** Số con của bầy. Cả bầy dùng chung một `home` nên một con thấy người chơi là cả bầy lao vào. */
	count: number;
	/** `fromAge`: chỉ sinh khi đủ tuổi; `onDemand`: chỉ sinh khi nhiệm vụ gọi (`onGive.zone`). */
	fromAge?: number;
	/**
	 * Chỉ sinh tới HẾT tuổi này (`untilAge: 15` = trẻ 8 tuổi thấy, người 16+ không thấy — `@aether/sim/mobs` `zoneLiveAt`). Khu tuổi
	 * thơ dùng chung map với người lớn — thiết kế 12 map vùng 1, 10/10/2026.
	 */
	untilAge?: number;
	/**
	 * Cấp quái của khu (`@aether/sim` `enemyStatsAt`): cùng một loại quái ở map sau mạnh hơn. Vắng = chỉ số gốc của
	 * `ENEMY_STATS` (6 map cũ của vùng 1 giữ nguyên số).
	 */
	level?: number;
	onDemand?: boolean;
	/** Boss của vùng (1 con, hiện thanh máu boss): KHÔNG tính vào luật "mỗi map một loại quái". */
	boss?: boolean;
}

/**
 * Bảng màu mặt đất của map (apps/web groundShade · Unity `GroundShader`): đồng cỏ, đất chết (nghĩa địa/đồi xương), nền đá (vách đá);
 * vùng 2–7 (10/10/2026): đầm lầy, sa mạc (cỏ = cát), cao nguyên, tuyết (nước = hồ băng), núi lửa (nước = dung nham), bãi biển.
 */
export type Biome = 'meadow' | 'deadland' | 'rocky' | 'swamp' | 'desert' | 'highland' | 'snow' | 'volcanic' | 'beach';

export interface MapData {
	id: string;
	name: string;
	tileSize: number;
	width: number;
	height: number;
	seed: number;
	terrain: string[];
	biome?: Biome;
	props: { id: string; x: number; y: number }[];
	decals: { id: string; x: number; y: number }[];
	spawn: { x: number; y: number };
	npcs: { characterId: string; x: number; y: number; facing: string; role: string }[];
	monsterZones: MonsterZone[];
	boss: { characterId: string; x: number; y: number; radius: number } | null;
	areas: { name: string; x0: number; y0: number; x1: number; y1: number }[];
	/** Địa điểm có tên cho nhiệm vụ "đi tới…" và chỗ đứng của NPC (toạ độ px, bán kính chạm). */
	spots: { id: string; name: string; x: number; y: number; r: number }[];
	/** Hình nộm tập phép (nhiệm vụ "practice"). */
	dummies: { id: string; x: number; y: number }[];
	exits: MapExit[];
}

export const px = (t: number): number => Math.round(t * TILE + TILE / 2);

/**
 * Điểm sinh từng con của một bầy (px) — CHÉP ĐÚNG công thức `zoneSpawnPoints` của `@aether/sim/mobs` (máy chủ + client sinh quái
 * ở đó; pipeline không phụ thuộc gói sim). `apps/web/tests/nav.test.ts` kiểm lại mọi điểm sinh bằng hàm thật của sim.
 */
export function herdSpawnPoints(z: Pick<MonsterZone, 'x' | 'y' | 'radius' | 'count'>): { x: number; y: number }[] {
	return Array.from({ length: z.count }, (_, i) => {
		const a = (i / z.count) * Math.PI * 2;
		const r = z.radius * (0.3 + (0.6 * ((i * 37) % 10)) / 10);
		return { x: z.x + Math.cos(a) * r, y: z.y + Math.sin(a) * r };
	});
}

interface PlaceOpts {
	force?: boolean;
	allowRoad?: boolean;
	canopy?: boolean;
}

/** Bàn dựng một map: lưới địa hình + đặt đồ vật có kiểm chồng hình/đường/nước + rải decal. */
export class Layout {
	readonly T: string[][];
	readonly rand: () => number;
	readonly props: MapData['props'] = [];
	readonly decals: MapData['decals'] = [];
	readonly missing = new Set<string>();
	private readonly boxes: { x0: number; y0: number; x1: number; y1: number }[] = [];
	private readonly trunks: { x: number; y: number }[] = [];
	/** Vùng cấm đặt đồ vật (khoảng trống quái, lối đi quanh lối sang map…), toạ độ ô. */
	private readonly keepOut: { x: number; y: number; r: number }[] = [];

	constructor(
		readonly w: number,
		readonly h: number,
		readonly seed: number,
		private readonly meta: Record<string, PropMeta>,
		fillChar: string,
	) {
		this.rand = mulberry32(seed);
		this.T = Array.from({ length: h }, () => Array.from({ length: w }, () => fillChar));
	}

	set(x: number, y: number, c: string): void {
		if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.T[y]![x] = c;
	}

	at(x: number, y: number): string {
		return this.T[y]?.[x] ?? 'w';
	}

	rect(x0: number, y0: number, x1: number, y1: number, c: string): void {
		for (let y = y0; y <= y1; y += 1) for (let x = x0; x <= x1; x += 1) this.set(x, y, c);
	}

	/** Đĩa tròn tâm (cx, cy) bán kính r ô; `only`: chỉ đè lên các ký tự này. */
	disc(cx: number, cy: number, r: number, c: string, only?: string): void {
		for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y += 1)
			for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x += 1) if (Math.hypot(x - cx, y - cy) <= r && (!only || only.includes(this.at(x, y)))) this.set(x, y, c);
	}

	/** Đường đất rộng `width` ô nối các điểm (ô), đi thẳng theo từng đoạn ngang rồi dọc cho dễ đọc. */
	path(points: [number, number][], width = 2, c = 'd'): void {
		for (let i = 1; i < points.length; i += 1) {
			const [ax, ay] = points[i - 1]!;
			const [bx, by] = points[i]!;
			const steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
			for (let s = 0; s <= steps; s += 1) {
				const x = Math.round(ax + ((bx - ax) * s) / steps);
				const y = Math.round(ay + ((by - ay) * s) / steps);
				this.rect(x, y, x + width - 1, y + width - 1, c);
			}
		}
	}

	reserve(x: number, y: number, r: number): void {
		this.keepOut.push({ x, y, r });
	}

	/**
	 * Giữ trống chỗ sinh từng con của bầy (`herdSpawnPoints`, bán kính `r` ô quanh mỗi điểm): đồ vật đặt KHÔNG ép tránh ra. Quái
	 * sinh trong chân đồ vật chặn thì kẹt luôn (bước nào cũng còn đè chân) — gọi TRƯỚC khi rải bia / gò mộ trong khu bầy.
	 */
	keepSpawnsClear(z: Pick<MonsterZone, 'x' | 'y' | 'radius' | 'count'>, r = 0.75): void {
		for (const p of herdSpawnPoints(z)) this.reserve(p.x / TILE, p.y / TILE, r);
	}

	/** Đặt một đồ vật, neo ở giữa mép dưới (px). Kiểm chồng hình và không đè lên đường/nước (trừ khi `force`). */
	place(id: string, x: number, y: number, opts: PlaceOpts = {}): boolean {
		const m = this.meta[id];
		if (!m) {
			// Đồ vật chưa có trong atlas (tấm PixelLab chưa vẽ / bị loại) thì bỏ chỗ đó trống, không làm hỏng cả map.
			this.missing.add(id);
			return false;
		}
		const box = { x0: x - m.w / 2, y0: y - m.h, x1: x + m.w / 2, y1: y };
		const foot = { x0: x + m.footprint.x, y0: y + m.footprint.y, x1: x + m.footprint.x + m.footprint.w, y1: y };
		if (!opts.force) {
			if (box.x0 < 0 || box.x1 > this.w * TILE || box.y0 < 0 || box.y1 > this.h * TILE) return false;
			if (this.keepOut.some((k) => Math.hypot(x / TILE - k.x, y / TILE - k.y) < k.r)) return false;
			// Cây trong rừng (`canopy`): tán được chồng lên nhau, chỉ cần các GỐC cách nhau ≥ 70px.
			const overlap = opts.canopy
				? this.trunks.some((t) => Math.hypot(t.x - x, (t.y - y) * 1.6) < 70) || this.boxes.some((b) => foot.x0 < b.x1 && foot.x1 > b.x0 && foot.y0 < b.y1 && foot.y1 > b.y0)
				: this.boxes.some((b) => box.x0 < b.x1 - 6 && box.x1 > b.x0 + 6 && box.y0 < b.y1 - 6 && box.y1 > b.y0 + 6);
			if (overlap) return false;
			for (let ty = Math.floor(foot.y0 / TILE); ty <= Math.floor((foot.y1 - 1) / TILE); ty += 1) {
				for (let tx = Math.floor(foot.x0 / TILE); tx <= Math.floor((foot.x1 - 1) / TILE); tx += 1) {
					const t = this.at(tx, ty);
					if (t === 'w' || t === 'b' || (!opts.allowRoad && (t === 'd' || t === 'c'))) return false;
				}
			}
		}
		this.props.push({ id, x: Math.round(x), y: Math.round(y) });
		if (opts.canopy) this.trunks.push({ x, y });
		else this.boxes.push(box);
		return true;
	}

	scatter(attempts: number, tryPlace: (x: number, y: number) => boolean): void {
		for (let i = 0; i < attempts; i += 1) tryPlace(Math.round(this.rand() * this.w * TILE), Math.round(this.rand() * this.h * TILE));
	}

	pick<T>(list: readonly T[]): T {
		return list[Math.floor(this.rand() * list.length)]!;
	}

	/** Decal mặt đất (búi cỏ, hoa li ti, sỏi): không chặn đường, không tính chồng hình. Sỏi chỉ trên đường đất. */
	sprinkleDecals(decalIds: string[], count: number): void {
		const pebbles = decalIds.filter((d) => d.includes('pebble'));
		const grass = decalIds.filter((d) => !d.includes('pebble'));
		for (let i = 0; i < count; i += 1) {
			const x = Math.round(this.rand() * this.w * TILE);
			const y = Math.round(this.rand() * this.h * TILE);
			const t = this.at(Math.floor(x / TILE), Math.floor(y / TILE));
			if (t === 'w' || t === 'b' || t === 'c') continue;
			const pool = t === 'd' ? pebbles : grass;
			if (pool.length) this.decals.push({ id: this.pick(pool), x, y });
		}
	}

	/** Dải lối sang map ở mép `edge`, phủ ô `from..to` dọc theo mép (toạ độ ô, gồm cả hai đầu). */
	exitStrip(edge: Edge, from: number, to: number): Pick<MapExit, 'x0' | 'y0' | 'x1' | 'y1'> {
		const W = this.w * TILE;
		const H = this.h * TILE;
		const a = from * TILE;
		const b = (to + 1) * TILE;
		if (edge === 'E') return { x0: W - TILE, y0: a, x1: W, y1: b };
		if (edge === 'W') return { x0: 0, y0: a, x1: TILE, y1: b };
		if (edge === 'N') return { x0: a, y0: 0, x1: b, y1: TILE };
		return { x0: a, y0: H - TILE, x1: b, y1: H };
	}

	finish(base: Omit<MapData, 'tileSize' | 'width' | 'height' | 'seed' | 'terrain' | 'props' | 'decals'>): MapData {
		if (this.missing.size) console.log(`  ⚠ ${base.id}: bỏ qua đồ vật chưa có trong atlas: ${[...this.missing].join(', ')}`);
		return {
			...base,
			tileSize: TILE,
			width: this.w,
			height: this.h,
			seed: this.seed,
			terrain: this.T.map((row) => row.join('')),
			props: [...this.props].sort((a, b) => a.y - b.y),
			decals: this.decals,
		};
	}
}

export function mulberry32(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** Cây chung cả vùng: MỘT loại cây PixelLab + bản lật gương + lá thu (chủ dự án: ít loại cây cho nhẹ tài nguyên). */
export const TREES = ['tree', 'tree_flip', 'tree', 'tree_flip', 'tree', 'tree_flip', 'tree_autumn'] as const;
/** Decal của một tấm (`d1` đồng cỏ, `d2` đất chết) — id dạng `<tag>_<pebble|tuft>_<i>`. */
export const decalsOf = (decalIds: string[], tag: string): string[] => decalIds.filter((d) => d.startsWith(`${tag}_`));
/** Cây bụi/cỏ hoa rải trên nền cỏ (tấm thiên nhiên PixelLab). */
export const GROUND_PLANTS = ['bush', 'bush_flower', 'fern', 'wildflowers', 'bush', 'fern'] as const;

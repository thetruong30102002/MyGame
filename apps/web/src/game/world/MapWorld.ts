import { Assets, Container, Sprite, type Spritesheet, type Texture } from 'pixi.js';
import { addSolid, isBlocked, type Rect, type Solids } from './collision';
import type { MapExit } from './exits';
import { GroundRenderer } from './GroundRenderer';
import type { Biome } from './groundShade';

export interface MapData {
	id: string;
	name: string;
	tileSize: number;
	width: number;
	height: number;
	seed: number;
	terrain: string[];
	/** Bảng màu mặt đất của vùng (groundShade): thiếu = đồng cỏ. */
	biome?: Biome;
	props: { id: string; x: number; y: number }[];
	decals: { id: string; x: number; y: number }[];
	spawn: { x: number; y: number };
	npcs: { characterId: string; x: number; y: number; facing: string; role: string }[];
	/** `boss`: boss của vùng (1 con, có thanh máu boss) — không tính vào luật "mỗi map một loại quái". */
	monsterZones: { id: string; name: string; x: number; y: number; radius: number; monsters: string[]; count: number; fromAge?: number; onDemand?: boolean; boss?: boolean }[];
	boss: { characterId: string; x: number; y: number; radius: number } | null;
	areas: { name: string; x0: number; y0: number; x1: number; y1: number }[];
	spots: { id: string; name: string; x: number; y: number; r: number }[];
	dummies: { id: string; x: number; y: number }[];
	/** Lối sang map khác: dải 1 ô sát mép (pipeline `maps/human/common.ts`). Map cũ chưa có thì coi như rỗng. */
	exits?: MapExit[];
}

export { EDGE_DIR, type Edge, type MapExit } from './exits';

/** Ảnh toàn cảnh do pipeline sinh (`<map>.minimap.json`, lệnh `map-overview`). */
export interface MinimapInfo {
	map: string;
	image: string;
	width: number;
	height: number;
	downscale: number;
	world: { width: number; height: number; tileSize: number };
	version: string;
}

interface PropMeta {
	kind: string;
	w: number;
	h: number;
	blocks: boolean;
	footprint: { x: number; y: number; w: number; h: number };
}

interface PlacedProp {
	sprite: Sprite;
	meta: PropMeta;
	bounds: Rect;
}

/**
 * Một vùng đã nạp: mặt đất (chunk lazy), decal, đồ vật (y-sort chung với nhân vật), va chạm.
 * Mỗi vùng là một gói asset riêng `assets/maps/<vùng>/` — vào vùng nào tải vùng đó.
 */
export class MapWorld {
	readonly ground: GroundRenderer;
	readonly decalLayer = new Container();
	private readonly props: PlacedProp[] = [];
	private readonly solids: Solids = new Map();
	private readonly faded = new Set<PlacedProp>();
	/** null: chưa sinh ảnh minimap (game vẫn chạy, chỉ không có bản đồ). */
	minimap: (MinimapInfo & { url: string }) | null = null;

	private constructor(
		readonly data: MapData,
		private readonly sheet: Spritesheet,
		meta: Record<string, PropMeta>,
		entityLayer: Container,
		private readonly region: string,
	) {
		this.ground = new GroundRenderer(data);
		for (const d of data.decals) {
			const tex = sheet.textures[`${region}/${d.id}`];
			if (!tex) continue;
			const s = new Sprite(tex);
			s.anchor.set(0.5, 1);
			s.position.set(d.x, d.y);
			s.cullable = true;
			this.decalLayer.addChild(s);
		}
		for (const p of data.props) {
			const tex = sheet.textures[`${region}/${p.id}`];
			const m = meta[p.id];
			if (!tex || !m) continue;
			const s = new Sprite(tex);
			s.anchor.set(0.5, 1);
			s.position.set(p.x, p.y);
			s.zIndex = p.y;
			s.cullable = true;
			entityLayer.addChild(s);
			const placed = { sprite: s, meta: m, bounds: { x0: p.x - m.w / 2, y0: p.y - m.h, x1: p.x + m.w / 2, y1: p.y } };
			this.props.push(placed);
			if (m.blocks && m.footprint.w > 0) addSolid(this.solids, { x0: p.x + m.footprint.x, y0: p.y + m.footprint.y, x1: p.x + m.footprint.x + m.footprint.w, y1: p.y });
		}
	}

	static async load(region: string, mapId: string, entityLayer: Container): Promise<MapWorld> {
		const base = `/assets/maps/${region}/`;
		const [data, sheet, meta, minimap] = await Promise.all([
			fetch(`${base}${mapId}.json`).then((r) => r.json() as Promise<MapData>),
			Assets.load<Spritesheet>(`${base}props.json`),
			fetch(`${base}props.meta.json`).then((r) => r.json() as Promise<Record<string, PropMeta>>),
			fetch(`${base}${mapId}.minimap.json`)
				.then((r) => (r.ok ? (r.json() as Promise<MinimapInfo>) : null))
				.catch(() => null),
		]);
		const world = new MapWorld(data, sheet, meta, entityLayer, region);
		if (minimap?.image) world.minimap = { ...minimap, url: `${base}${minimap.image}?v=${minimap.version}` };
		return world;
	}

	/** Gỡ map khỏi cảnh khi chuyển sang map khác: đồ vật (nằm chung lớp nhân vật), decal, mặt đất. Atlas giữ lại (dùng chung cả vùng). */
	destroy(): void {
		for (const p of this.props) p.sprite.destroy();
		this.props.length = 0;
		this.faded.clear();
		this.decalLayer.destroy({ children: true });
		this.ground.destroy();
		// Pixi tự gỡ container khỏi cha khi destroy — cảnh không còn giữ lớp mặt đất cũ.
		this.ground.layer.destroy({ children: true });
	}

	get exits(): MapExit[] {
		return this.data.exits ?? [];
	}

	/** Lối mà điểm chân (x, y) đang đứng trong dải của nó. */
	exitAt(x: number, y: number): MapExit | null {
		return this.exits.find((e) => x >= e.x0 && x < e.x1 && y >= e.y0 && y < e.y1) ?? null;
	}

	/** Texture một đồ vật của vùng (dùng lại cho vật phẩm nhặt được, hiệu ứng…). */
	propTexture(id: string): Texture | undefined {
		return this.sheet.textures[`${this.region}/${id}`];
	}

	get width(): number {
		return this.data.width * this.data.tileSize;
	}

	get height(): number {
		return this.data.height * this.data.tileSize;
	}

	spot(id: string): MapData['spots'][number] | undefined {
		return this.data.spots?.find((s) => s.id === id);
	}

	areaAt(x: number, y: number): string {
		return this.data.areas.find((a) => x >= a.x0 && x < a.x1 && y >= a.y0 && y < a.y1)?.name ?? this.data.name;
	}

	/** Hộp chân (rộng 2·rx, cao 2·ry quanh điểm chân) có đè lên nước / đồ vật / mép map không — logic ở `collision.ts`. */
	blocked(x: number, y: number, rx: number, ry: number): boolean {
		return isBlocked(this.data, this.solids, x, y, rx, ry);
	}

	/** Di chuyển có trượt theo từng trục: kẹt trục X vẫn đi được trục Y (đi men theo tường). */
	move(pos: { x: number; y: number }, dx: number, dy: number, rx = 11, ry = 5): void {
		if (dx && !this.blocked(pos.x + dx, pos.y, rx, ry)) pos.x += dx;
		if (dy && !this.blocked(pos.x, pos.y + dy, rx, ry)) pos.y += dy;
	}

	/**
	 * Nhà/cây đứng TRƯỚC nhân vật (chân đồ vật thấp hơn chân nhân vật) mà che lên thân nhân vật thì
	 * làm mờ, để không bao giờ mất dấu nhân vật sau mái nhà hay tán cây.
	 */
	updateOcclusion(actor: { x: number; y: number; h: number }): void {
		const body = { x0: actor.x - 16, y0: actor.y - actor.h, x1: actor.x + 16, y1: actor.y - 8 };
		for (const p of this.faded) {
			p.sprite.alpha = 1;
		}
		this.faded.clear();
		for (const p of this.props) {
			if (p.meta.kind !== 'building' && p.meta.kind !== 'tree') continue;
			const b = p.bounds;
			if (b.y1 <= actor.y || body.x1 < b.x0 || body.x0 > b.x1 || body.y1 < b.y0 || body.y0 > b.y1) continue;
			p.sprite.alpha = 0.55;
			this.faded.add(p);
		}
	}
}

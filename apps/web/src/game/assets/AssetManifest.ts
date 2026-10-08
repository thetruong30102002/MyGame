import { Assets, type Spritesheet, type Texture } from 'pixi.js';
import type { GearAnchors } from '../gearLayers';

export const DIRECTIONS = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'] as const;
export type Direction = (typeof DIRECTIONS)[number];
export type AnimationName = 'idle' | 'walk' | 'run' | 'attack' | 'cast' | 'hit' | 'death' | 'dodge' | 'block';
/** Động tác một lần (không lặp) — vung kiếm, vung tay niệm phép. */
export type ActionName = 'attack' | 'cast';

/**
 * Thông số một animation. Động tác một lần (pipeline đánh dấu `loop: false`) có thêm `frames` (số frame
 * thật), `hitFrame` (frame tung đòn — sát thương/đạn ra đúng frame này) và `directions` (hướng đã vẽ).
 */
export interface AnimationSpec {
	fps: number;
	hitFrame?: number;
	frames?: number;
	loop?: boolean;
	directions?: Direction[];
}

export interface CharacterManifestEntry {
	displayName: string;
	role: 'player' | 'npc' | 'monster' | 'boss';
	atlas: string;
	frameSize: { width: number; height: number };
	anchor: { x: number; y: number };
	animations: Partial<Record<AnimationName, AnimationSpec>>;
	source: { provider: string; ref: string | null };
	/** Chiều cao hình (px, từ chân tới đỉnh đầu) — nhân vật cũ không khai thì game coi như 96px. */
	bodyHeight?: number;
	/** Chân dung khung thoại do pipeline cắt sẵn (đường dẫn trong `assets/`); không có thì cắt từ atlas kiểu cũ. */
	portrait?: string | null;
}

export interface AssetManifest {
	version: number;
	characters: Record<string, CharacterManifestEntry>;
}

export interface CharacterTextures {
	id: string;
	entry: CharacterManifestEntry;
	frames(anim: AnimationName, dir: Direction): Texture[];
	has(anim: AnimationName): boolean;
	/** Có frame cho hướng `dir` (kể cả hướng kề theo bảng thay thế) — KHÔNG rơi về hướng bất kỳ. */
	hasDir(anim: AnimationName, dir: Direction): boolean;
	/** Frame động tác cho hướng `dir`, null khi hướng đó (và hướng kề) chưa vẽ: vung sai hướng còn xấu hơn không vung. */
	actionFrames(anim: AnimationName, dir: Direction): Texture[] | null;
	/**
	 * Khung đang hiện thuộc animation/hướng nào + neo đồ gắn pipeline ghi trong atlas (`frames[...].gear`). undefined = texture
	 * không thuộc atlas này; `gear` vắng = atlas xuất trước khi có neo (`npm run assets:anchors`) → không vẽ lớp đồ.
	 */
	frameInfo(tex: Texture): FrameInfo | undefined;
}

export interface FrameInfo {
	anim: string;
	dir: Direction;
	gear?: GearAnchors;
}

const BASE = '/assets/';

/** Nhân vật chỉ có 4 hướng (S/E/W/N) thì hướng chéo lấy hướng gần nhất — ưu tiên hướng ngang để nhìn rõ mặt. */
const FALLBACK: Record<Direction, Direction[]> = {
	S: ['S', 'SE', 'SW'],
	N: ['N', 'NE', 'NW'],
	E: ['E', 'SE', 'NE', 'S'],
	W: ['W', 'SW', 'NW', 'S'],
	SE: ['SE', 'E', 'S'],
	SW: ['SW', 'W', 'S'],
	NE: ['NE', 'E', 'N'],
	NW: ['NW', 'W', 'N'],
};
/**
 * Bảng thay thế cho ĐỘNG TÁC: chỉ lấy hướng kề (≤45°). Bỏ đuôi "S" của E/W — vung tay quay mặt ra
 * người xem trong khi đạn bay sang ngang là sai hướng rõ rệt; thà dùng phương án dự phòng (nổ tức thì).
 */
const ACTION_FALLBACK: Record<Direction, Direction[]> = { ...FALLBACK, E: ['E', 'SE', 'NE'], W: ['W', 'SW', 'NW'] };
let manifestPromise: Promise<AssetManifest> | null = null;
const characterCache = new Map<string, Promise<CharacterTextures>>();

/**
 * Manifest nhỏ tải lúc vào game; atlas của từng nhân vật chỉ tải khi có thực thể cần nó
 * (lazy) và được cache theo id — vào vùng mới thì tải gói vùng đó, không tải cả game.
 */
export function loadManifest(): Promise<AssetManifest> {
	manifestPromise ??= fetch(`${BASE}manifest.json`, { cache: 'no-cache' }).then((r) => {
		if (!r.ok) throw new Error(`Không tải được manifest (HTTP ${r.status})`);
		return r.json() as Promise<AssetManifest>;
	});
	// Lỗi mạng một lần không được kẹt tới lúc F5: lần gọi sau thử tải lại.
	manifestPromise.catch(() => {
		manifestPromise = null;
	});
	return manifestPromise;
}

export function loadCharacter(id: string): Promise<CharacterTextures> {
	let p = characterCache.get(id);
	if (!p) {
		p = (async () => {
			const manifest = await loadManifest();
			const entry = manifest.characters[id];
			if (!entry) throw new Error(`Manifest không có nhân vật "${id}"`);
			const sheet = await Assets.load<Spritesheet>(`${BASE}${entry.atlas}`);
			const info = new Map<Texture, FrameInfo>();
			const raw = sheet.data.frames as Record<string, { gear?: GearAnchors }>;
			for (const [name, tex] of Object.entries(sheet.textures)) {
				const m = /([a-z]+)_([NSEW]{1,2})_\d+$/.exec(name);
				if (m) info.set(tex, { anim: m[1]!, dir: m[2] as Direction, ...(raw[name]?.gear ? { gear: raw[name].gear } : {}) });
			}
			const near = (anim: AnimationName, dir: Direction): Texture[] | null => {
				for (const d of ACTION_FALLBACK[dir]) {
					const list = sheet.animations[`${anim}_${d}`];
					if (list?.length) return list;
				}
				return null;
			};
			return {
				id,
				entry,
				has: (anim) => DIRECTIONS.some((d) => sheet.animations[`${anim}_${d}`]),
				hasDir: (anim, dir) => near(anim, dir) !== null,
				actionFrames: near,
				frameInfo: (tex) => info.get(tex),
				frames: (anim, dir) => {
					for (const d of FALLBACK[dir]) {
						const list = sheet.animations[`${anim}_${d}`];
						if (list) return list;
					}
					const any = DIRECTIONS.map((d) => sheet.animations[`${anim}_${d}`]).find(Boolean);
					if (!any) throw new Error(`${id} thiếu animation ${anim}`);
					return any;
				},
			};
		})();
		characterCache.set(id, p);
		p.catch(() => characterCache.delete(id));
	}
	return p;
}

import { cleanGearView, GEAR_VIEW_SLOTS, type GearView } from '@aether/protocol';
import { wieldOf } from '@aether/sim/moves';
import type { Direction, HeldArt } from './assets/AssetManifest';
import { EQUIP_SLOTS, ITEMS, RARITY_ORDER, type EquipSlotId, type GearState, type Rarity } from './equipment';
import { BAKED_HELD, GEAR_ART, OUTFITS, VIEW_OF, type GearArt, type GearLayerSlot, type GearViewArt, type Wield } from './gearArt';
import { GEAR_PAD, gripIn } from './gearPixels';

/**
 * Luật THUẦN của lớp đồ mặc lên người (không Pixi/DOM — test bằng `npx tsx tests/gear.test.ts`): chọn điểm neo + trước/sau
 * thân theo hướng, đặt ảnh, chọn vũ khí vẽ liền thân đang cầm, chọn bộ trang phục, mã hoá gửi qua mạng.
 */

/** Neo pipeline ghi vào từng khung atlas (`frames[...].gear`, xem `packages/asset-pipeline/src/atlas/gearAnchors.ts`). */
export interface GearAnchors {
	top: [number, number];
	head: [number, number];
	back: [number, number];
	handL: [number, number];
	handR: [number, number];
}

/** Một món đang mặc cần vẽ lớp. */
export interface GearPiece {
	slot: GearLayerSlot;
	id: string;
	rarity: Rarity;
}

interface SlotRule {
	anchor: keyof GearAnchors;
	/** Dịch ngang (px) so với neo — tay xa ở hướng nhìn ngang lấp sau thân, lùi về phía lưng. */
	dx?: number;
	front: boolean;
}

/**
 * Thứ tự lớp + tay nào cầm, cho các hướng phía ĐÔNG và hai hướng S/N. "Tay trái/phải màn hình" (`handL`/`handR`) chứ không
 * phải tay của nhân vật: nhìn trước (S) tay phải nhân vật nằm bên TRÁI màn hình.
 * - Mũ: luôn trước thân. Áo choàng: SAU thân khi nhìn trước/ngang, TRƯỚC thân khi nhìn sau (thấy lưng).
 * - Vũ khí (tay phải nhân vật): trước thân trừ khi nhìn thẳng sau (N) — lúc đó thân che tay.
 * - Tay phụ (tay trái): trước thân chỉ khi nhìn thẳng trước (S); nhìn ngang tay trái ở phía xa → sau thân, lùi 4px về lưng.
 * Hướng TÂY = lật gương hướng đông (atlas tây cũng là bản lật của đông): đổi handL↔handR, đảo dấu dx, giữ trước/sau.
 */
const EAST_RULES: Record<'S' | 'SE' | 'E' | 'NE' | 'N', Record<GearLayerSlot, SlotRule>> = {
	S: { head: { anchor: 'top', front: true }, back: { anchor: 'back', front: false }, main: { anchor: 'handL', front: true }, off: { anchor: 'handR', front: true } },
	SE: { head: { anchor: 'top', front: true }, back: { anchor: 'back', front: false }, main: { anchor: 'handL', front: true }, off: { anchor: 'handR', front: false } },
	E: { head: { anchor: 'top', front: true }, back: { anchor: 'back', front: false }, main: { anchor: 'handR', front: true }, off: { anchor: 'handR', dx: -4, front: false } },
	NE: { head: { anchor: 'top', front: true }, back: { anchor: 'back', front: true }, main: { anchor: 'handR', front: true }, off: { anchor: 'handL', front: false } },
	N: { head: { anchor: 'top', front: true }, back: { anchor: 'back', front: true }, main: { anchor: 'handR', front: false }, off: { anchor: 'handL', front: false } },
};
const MIRROR_OF: Record<'W' | 'SW' | 'NW', 'E' | 'SE' | 'NE'> = { W: 'E', SW: 'SE', NW: 'NE' };
const SWAP: Partial<Record<keyof GearAnchors, keyof GearAnchors>> = { handL: 'handR', handR: 'handL' };

export function slotRule(dir: Direction, slot: GearLayerSlot): SlotRule {
	const east = dir === 'W' || dir === 'SW' || dir === 'NW' ? MIRROR_OF[dir] : null;
	if (!east) return EAST_RULES[dir as keyof typeof EAST_RULES][slot];
	const r = EAST_RULES[east][slot];
	return { anchor: SWAP[r.anchor] ?? r.anchor, ...(r.dx ? { dx: -r.dx } : {}), front: r.front };
}

/** Ảnh dùng cho hướng khung `dir` + có lật không (lật của ảnh XOR lật gương hướng tây). */
export function viewFor(art: GearArt, dir: Direction): { img: GearViewArt; flip: boolean } | null {
	const v = VIEW_OF[dir];
	const img = art.views[v.view] ?? art.views.S ?? art.views.E ?? art.views.N;
	return img ? { img, flip: !!img.flip !== v.mirror } : null;
}

/** Vị trí một lớp, toạ độ KHUNG nhân vật (px, góc trên-trái khung). Ảnh đặt với điểm `grip` (đã thu `scale`) trùng `x, y`. */
export interface PieceLayout {
	x: number;
	y: number;
	front: boolean;
	flip: boolean;
	img: GearViewArt;
}

/**
 * Đặt món `piece` lên khung có neo `anchors`, hướng khung `dir` (hướng của ẢNH đang hiện — động tác chưa vẽ hướng chéo dùng
 * khung hướng kề, nên lấy hướng của khung chứ không lấy hướng nhân vật đang quay). null = không vẽ: chưa có art, món VẼ LIỀN
 * THÂN (`held` — kiếm / trượng nằm sẵn trong atlas, không dán ảnh ở bất kỳ động tác nào), hoặc động tác `anim` đã vẽ liền vũ
 * khí (`BAKED_HELD`) nên lớp vũ khí dán ngoài phải ẩn.
 */
export function layoutPiece(piece: Pick<GearPiece, 'slot' | 'id'>, anchors: GearAnchors, dir: Direction, anim: string, table: Record<string, GearArt> = GEAR_ART): PieceLayout | null {
	const art = table[piece.id];
	if (!art || art.slot !== piece.slot || art.held) return null;
	if (BAKED_HELD[anim]?.includes(piece.slot)) return null;
	const v = viewFor(art, dir);
	if (!v) return null;
	const r = slotRule(dir, piece.slot);
	const [ax, ay] = anchors[r.anchor];
	return { x: ax + (r.dx ?? 0), y: ay, front: r.front, flip: v.flip, img: v.img };
}

/**
 * Thế cầm sau khung động tác `anim`: động tác kiếm (chém, đâm, bổ, xoay…) → cầm kiếm, động tác phép (niệm, phóng, gọi…) → cầm
 * gậy (`@aether/sim/moves`); động tác khác (đứng, đi, trúng đòn, uống bình) giữ thế trước đó — niệm xong đi tiếp vẫn cầm gậy.
 */
export function stanceAfter(anim: string | undefined, prev: Wield): Wield {
	return wieldOf(anim) ?? prev;
}

/** Thế cầm mặc định theo con đường (chưa ra đòn nào): Pháp sư cầm gậy, còn lại cầm kiếm. */
export function defaultStance(path: 'sword' | 'mage' | null | undefined): Wield {
	return path === 'mage' ? 'magic' : 'melee';
}

/**
 * Món được VẼ theo thế cầm: mỗi lúc chỉ một loại vũ khí. Món không phải vũ khí (khiên, mũ…) luôn vẽ. Đang mặc vũ khí loại
 * khác thế mà không có món đúng thế (vd chỉ mặc gậy mà vừa chém — động tác chém đã vẽ liền kiếm) thì vẫn vẽ món đang có.
 */
export function wieldedPieces(pieces: readonly GearPiece[], stance: Wield, table: Record<string, GearArt> = GEAR_ART): GearPiece[] {
	const armed = pieces.filter((p) => table[p.id]?.wield);
	const match = armed.some((p) => table[p.id]!.wield === stance);
	return pieces.filter((p) => {
		const w = table[p.id]?.wield;
		return !w || !match || w === stance;
	});
}

/**
 * Vũ khí VẼ LIỀN THÂN đang cầm lúc đứng / đi (atlas `idle<held>` / `walk<held>`): cùng luật một-loại-một-lúc của `wieldedPieces` —
 * thế kiếm + đang mặc kiếm → kiếm, thế phép + đang mặc trượng → trượng, thế không có món đúng → món đang có. null = tay không: chưa
 * mặc vũ khí (bé 4 tuổi chưa được trao kiếm), tháo ra rồi, hoặc món đúng thế chưa có bản vẽ liền thân (dùng lớp dán nếu có ảnh).
 */
export function heldArt(pieces: readonly GearPiece[], stance: Wield, table: Record<string, GearArt> = GEAR_ART): HeldArt | null {
	for (const p of wieldedPieces(pieces, stance, table)) {
		const art = table[p.id];
		if (art?.wield && art.held) return art.held;
	}
	return null;
}

/** Ô trang bị → lớp vẽ. Áo choàng chưa có ô trang bị riêng (lớp `back` để sẵn cho khi có ô). */
const LAYER_OF: Partial<Record<EquipSlotId, GearLayerSlot>> = { head: 'head', main: 'main', off: 'off' };

/** Các món đang mặc có lớp vẽ (id lạ / món chưa khai art thì bỏ — không vẽ gì, không lỗi). */
export function gearPieces(equip: GearState['equip'], table: Record<string, GearArt> = GEAR_ART): GearPiece[] {
	const out: GearPiece[] = [];
	for (const s of EQUIP_SLOTS) {
		const layer = LAYER_OF[s];
		const it = equip[s];
		if (!layer || !it || table[it.id]?.slot !== layer) continue;
		out.push({ slot: layer, id: it.id, rarity: ITEMS[it.id]?.rarity ?? 'common' });
	}
	return out;
}

/** Món → `GearView` gửi qua mạng: ô theo `GEAR_VIEW_SLOTS`, bậc hiếm 0 thì bỏ hậu tố. */
export function encodeGear(pieces: readonly GearPiece[]): GearView {
	return GEAR_VIEW_SLOTS.map((s) => {
		const p = pieces.find((x) => x.slot === s);
		if (!p) return '';
		const r = Math.max(0, RARITY_ORDER.indexOf(p.rarity));
		return r ? `${p.id}:${r}` : p.id;
	});
}

/** Ngược lại, từ dữ liệu mạng CHƯA kiểm (máy chủ cũ không gửi → []). Món chưa có art ở máy này thì bỏ (bản game cũ hơn). */
export function decodeGear(raw: unknown, table: Record<string, GearArt> = GEAR_ART): GearPiece[] {
	const v = cleanGearView(raw);
	if (!v) return [];
	const out: GearPiece[] = [];
	v.forEach((s, i) => {
		if (!s) return;
		const [id, r] = s.split(':') as [string, string | undefined];
		const slot = GEAR_VIEW_SLOTS[i]!;
		if (table[id]?.slot !== slot) return;
		out.push({ slot, id, rarity: RARITY_ORDER[Number(r ?? 0)] ?? 'common' });
	});
	return out;
}

/**
 * Sprite theo bộ trang phục: món áo `bodyId` có bộ cho sprite gốc `base` VÀ bộ đó có trong manifest (`has`) thì dùng bộ;
 * không thì giữ sprite gốc.
 */
export function outfitSprite(base: string, bodyId: string | undefined, has: (id: string) => boolean, table: Record<string, Partial<Record<string, string>>> = OUTFITS): string {
	const id = bodyId ? table[bodyId]?.[base] : undefined;
	return id && has(id) ? id : base;
}

/** Sprite gốc của một sprite bộ trang phục (người khác mặc bộ mà máy này chưa có atlas → vẽ sprite gốc). */
export function baseOfOutfit(sprite: string, table: Record<string, Partial<Record<string, string>>> = OUTFITS): string | null {
	for (const byBase of Object.values(table)) for (const [base, id] of Object.entries(byBase)) if (id === sprite) return base;
	return null;
}

/** Một lớp đồ trong hình nhân vật giữa kho đồ (DOM): toạ độ KHUNG nhân vật của góc trên-trái ảnh đã xử lý. */
export interface FigureGearView {
	src: string;
	scale: number;
	rarity: Rarity;
	left: number;
	top: number;
	/** Cỡ ảnh đã xử lý (thu `scale` + lề viền) — đặt chỗ trước khi ảnh tải xong. */
	w: number;
	h: number;
	gripX: number;
	flip: boolean;
	front: boolean;
}

/**
 * Cùng luật đặt lớp với game (`layoutPiece`), cho một khung tĩnh (kho đồ dùng khung đứng nhìn trước `idle_S_0`, hoặc bản cầm vũ khí
 * `idlesword_S_0` — kiếm / trượng đã nằm trong khung nên không có lớp dán).
 */
export function figureGear(pieces: readonly GearPiece[], anchors: GearAnchors | undefined, dir: Direction, anim = 'idle', table: Record<string, GearArt> = GEAR_ART, stance: Wield = 'melee'): FigureGearView[] {
	if (!anchors) return [];
	const out: FigureGearView[] = [];
	for (const p of wieldedPieces(pieces, stance, table)) {
		const lay = layoutPiece(p, anchors, dir, anim, table);
		if (!lay) continue;
		const scale = lay.img.scale ?? 1;
		const [gx, gy] = gripIn(lay.img.grip, scale);
		out.push({
			src: lay.img.src,
			scale,
			rarity: p.rarity,
			left: lay.x - gx,
			top: lay.y - gy,
			w: Math.ceil(lay.img.w * scale) + GEAR_PAD * 2,
			h: Math.ceil(lay.img.h * scale) + GEAR_PAD * 2,
			gripX: gx,
			flip: lay.flip,
			front: lay.front,
		});
	}
	return out;
}

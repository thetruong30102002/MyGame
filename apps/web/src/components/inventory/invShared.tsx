'use client';

import { useState, type ReactNode } from 'react';
import { KIND_NAME, RARITY_NAME, SLOT_NAME, slotsFor, STAT_NAME, STAT_PERCENT, shownStat, type EquipSlotId, type StatBasis, type StatKey } from '@/game/equipment';
import { RARITY_FX } from '@/game/gearPixels';
import type { EquipSlotView, InventoryItem } from '@/store/useGameStore';

/** Lòng ô đá 58×57 (viền slot.png 13px mỗi bên). */
export const SLOT_INNER: [number, number] = [32, 31];

/** Bố cục kho đồ: máy tính, điện thoại dọc (< 640px), màn thấp (cao ≤ 500px — điện thoại xoay ngang). */
export type InvMode = 'desktop' | 'phone' | 'low';

/** Màu tên theo độ hiếm — chờ khung ô PixelLab theo độ hiếm thì thêm viền. */
export const RARITY_COLOR: Record<string, string> = { common: 'var(--color-ink-brown)', fine: 'var(--color-leaf)', rare: '#1f5cc2', epic: 'var(--color-exp)', legendary: '#c2410c' };

const KIND_TEXT: Record<InventoryItem['kind'], string> = { equip: 'Trang bị', consumable: 'Đồ dùng được', currency: 'Tiền tệ', material: 'Nguyên liệu', quest: 'Vật phẩm nhiệm vụ' };

/** "Thường · Vũ khí chính · cấp 10" — độ hiếm, ô / loại, cấp yêu cầu. */
export function itemSubline(it: InventoryItem): string {
	const parts: string[] = [];
	if (it.rarity) parts.push(RARITY_NAME[it.rarity]);
	if (it.equipKind) {
		const slots = slotsFor(it.equipKind);
		parts.push(slots.length === 1 ? SLOT_NAME[slots[0]!] : KIND_NAME[it.equipKind]);
	} else parts.push(KIND_TEXT[it.kind]);
	if (it.levelReq) parts.push(`cấp ${it.levelReq}`);
	return parts.join(' · ');
}

/** Ô đích khi mặc món này mà không chỉ định: ô trống đầu tiên của loại, cả hai nhẫn đầy thì Nhẫn 1 (khớp `equipment.autoSlot`). */
export function targetSlot(it: InventoryItem, equipment: EquipSlotView[]): EquipSlotId | null {
	const slots = slotsFor(it.equipKind);
	return slots.find((s) => !equipment.find((e) => e.slot === s)?.item) ?? slots[0] ?? null;
}

/** "27" / "8%" — số trên bảng của chỉ số `key` khi phần cộng của trang bị là `flat`. */
export function fmtStat(b: StatBasis, key: StatKey, flat: number): string {
	return `${shownStat(b, key, flat)}${STAT_PERCENT.has(key) ? '%' : ''}`;
}

/** Phần chỉ số do trang bị góp, tính bằng số trên bảng (có đồ − không đồ) — "+N trang bị". */
export function gearPart(stats: { gearBasis: StatBasis; gear: Partial<Record<StatKey, number>> }, key: StatKey): number {
	const flat = stats.gear[key] ?? 0;
	return flat ? shownStat(stats.gearBasis, key, flat) - shownStat(stats.gearBasis, key, 0) : 0;
}

export interface CompareLine {
	key: StatKey;
	label: string;
	before: number;
	after: number;
}

/**
 * Mặc `next` thay `prev` (null = ô trống): số trên bảng trước → sau, cùng công thức với CombatSystem (`shownStat`). Chỉ
 * các chỉ số mà món mới hoặc món cũ có.
 */
export function compareLines(b: StatBasis, current: Partial<Record<StatKey, number>>, next: InventoryItem | null, prev: InventoryItem | null): CompareLine[] {
	const keys = (Object.keys(STAT_NAME) as StatKey[]).filter((k) => (next?.stats?.[k] ?? 0) !== 0 || (prev?.stats?.[k] ?? 0) !== 0);
	return keys.map((key) => {
		const cur = current[key] ?? 0;
		return { key, label: STAT_NAME[key], before: shownStat(b, key, cur), after: shownStat(b, key, cur - (prev?.stats?.[key] ?? 0) + (next?.stats?.[key] ?? 0)) };
	});
}

/**
 * Ảnh vật phẩm đúng 1× ở cỡ gốc, căn giữa lòng ô bằng toạ độ NGUYÊN (ảnh to hơn lòng ô thì tràn lên viền đá như đặt nổi
 * trên khay, không thu lẻ). Ảnh lỗi / rỗng (vật phẩm lạ) → ô trống + TÊN món (đặc tả mục 3, không emoji): chữ trải cả ô
 * 58×57 như chữ ô trống của búp bê nhưng sáng hơn (`parchment`) — ô có đồ không bị đọc nhầm thành ô trống.
 */
export function ItemIcon({ item, box = SLOT_INNER, dim = false }: { item: Pick<InventoryItem, 'icon' | 'w' | 'h' | 'name' | 'rarity'>; box?: [number, number]; dim?: boolean }) {
	const [broken, setBroken] = useState<string | null>(null);
	if (!item.icon || broken === item.icon || !item.w || !item.h)
		return (
			<span className={`pointer-events-none absolute -inset-[13px] flex items-center justify-center overflow-hidden px-1.5 text-center text-[11px] leading-[13px] font-extrabold break-words text-parchment ${dim ? 'opacity-40' : ''}`}>
				<span className="line-clamp-3">{item.name}</span>
			</span>
		);
	return (
		<img
			src={item.icon}
			alt=""
			width={item.w}
			height={item.h}
			draggable={false}
			onError={() => setBroken(item.icon)}
			className={`pixel-img pointer-events-none absolute max-w-none select-none ${dim ? 'opacity-40 grayscale' : ''}`}
			style={{ left: Math.floor((box[0] - item.w) / 2), top: Math.floor((box[1] - item.h) / 2), width: item.w, height: item.h, filter: dim ? undefined : rarityOutline(item.rarity) }}
		/>
	);
}

/**
 * Viền 1px màu độ hiếm quanh icon (cùng màu với viền lớp đồ trên người — `gearPixels.RARITY_FX`), bằng 4 drop-shadow lệch
 * 1px không nhoè: không tốn art, giữ nét pixel. Thường thì không viền.
 */
export function rarityOutline(rarity: InventoryItem['rarity']): string | undefined {
	const fx = rarity ? RARITY_FX[rarity] : null;
	if (!fx) return undefined;
	const c = `rgb(${fx.color.join(' ')})`;
	return `drop-shadow(1px 0 0 ${c}) drop-shadow(-1px 0 0 ${c}) drop-shadow(0 1px 0 ${c}) drop-shadow(0 -1px 0 ${c})`;
}

/**
 * Bóng mờ ô trống (`items.SLOT_SILHOUETTE`): cỡ gốc chỉ biết sau khi tải — đo `naturalWidth` rồi đặt 1× toạ độ nguyên.
 * Chưa khai / tải hỏng → `fallback` (chữ tên ô, TẠM).
 */
export function SlotSilhouette({ src, fallback }: { src: string | null; fallback: ReactNode }) {
	const [size, setSize] = useState<{ src: string; w: number; h: number } | null>(null);
	const [broken, setBroken] = useState<string | null>(null);
	if (!src || broken === src) return <>{fallback}</>;
	const ok = size?.src === src ? size : null;
	return (
		<img
			src={src}
			alt=""
			draggable={false}
			onLoad={(e) => setSize({ src, w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
			onError={() => setBroken(src)}
			className="pixel-img pointer-events-none absolute max-w-none select-none"
			style={ok ? { left: Math.floor((SLOT_INNER[0] - ok.w) / 2), top: Math.floor((SLOT_INNER[1] - ok.h) / 2), width: ok.w, height: ok.h } : { left: 0, top: 0, width: 0, height: 0, visibility: 'hidden' }}
		/>
	);
}

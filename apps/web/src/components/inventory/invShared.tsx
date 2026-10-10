'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';
import { SLOT_NAME, slotsFor, STAT_NAME, STAT_PERCENT, shownStat, type EquipKind, type EquipSlotId, type StatBasis, type StatKey } from '@/game/equipment';
import type { EquipSlotView, InventoryItem } from '@/store/useGameStore';
import { fmtNum } from '../CharacterPanelParts';

/** Lòng ô mềm `.inv-cell` 58×58 (viền 1px mỗi bên) — icon 1× lớn nhất hiện nay 54×54 (trượng) vẫn lọt lòng ô. */
export const SLOT_INNER: [number, number] = [56, 56];

/** Lớp chung của MỌI ô vật phẩm trong kho đồ (búp bê, túi, thẻ chi tiết): ô giấy mềm 58×58 (globals.css khối `inv-*`). */
export const CELL = 'inv-cell h-[58px] w-[58px] shrink-0';

/** Bố cục kho đồ: máy tính, điện thoại dọc (< 640px), màn thấp (cao ≤ 500px — điện thoại xoay ngang). */
export type InvMode = 'desktop' | 'phone' | 'low';

/** Màu tên theo độ hiếm (đủ tương phản trên giấy) — cũng là màu chữ nhãn bậc (`rarityTag`). Ô dùng tông nhạt cùng họ (`inv-r-*`). */
export const RARITY_COLOR: Record<string, string> = { common: 'var(--color-ink-brown)', fine: 'var(--color-leaf)', rare: '#1f5cc2', epic: 'var(--color-exp)', legendary: '#c2410c' };

/**
 * Lớp ô theo độ hiếm: viền mảnh ngả màu bậc + lòng ô phớt màu bậc + vệt màu nhỏ ở đáy ô (khối `inv-*` cuối globals.css). Đồ
 * Thường giữ ô kem — ô có màu là đồ đáng chú ý, nhìn lướt túi là thấy.
 */
export function rarityClass(r: InventoryItem['rarity']): string {
	return r && r !== 'common' ? `inv-r-${r}` : '';
}

/** Nhãn bậc / nhãn mềm: viên phớt màu (13% màu chữ trộn kem), không viền — thay nhãn viền màu 2px. */
export function softTag(color: string): CSSProperties {
	return { color, background: `color-mix(in srgb, ${color} 13%, var(--color-cream))` };
}

export const KIND_TEXT: Record<InventoryItem['kind'], string> = { equip: 'Trang bị', consumable: 'Đồ dùng được', currency: 'Tiền tệ', material: 'Nguyên liệu', quest: 'Vật phẩm nhiệm vụ' };

/** Các ô nhận loại đồ này: "Vũ khí chính" · "Nhẫn 1 / Nhẫn 2". */
export function slotText(kind: EquipKind | undefined): string {
	return slotsFor(kind)
		.map((s) => SLOT_NAME[s])
		.join(' / ');
}

/** "+6" · "−2%" — chỉ số CỘNG của một món (số tự thân, chưa nhân hệ số con đường). */
export function signedStat(n: number, key: StatKey): string {
	return `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n)}${STAT_PERCENT.has(key) ? '%' : ''}`;
}

/**
 * Số trên bảng của chỉ số `key` kèm đơn vị: "140" · "12%". Tốc chạy là phần TĂNG so với tốc gốc (gốc luôn 0 — trang bị
 * cộng % tốc chạy, `CombatSystem` nhân `1 + move/100`) nên hiện có dấu: "+8%", để "0%" không bị đọc thành đứng yên.
 */
export function fmtShown(key: StatKey, n: number): string {
	if (key === 'move') return n > 0 ? `+${n}%` : n < 0 ? `−${-n}%` : '+0%';
	return `${fmtNum(n)}${STAT_PERCENT.has(key) ? '%' : ''}`;
}

/** Ô đích khi mặc món này mà không chỉ định: ô trống đầu tiên của loại, cả hai nhẫn đầy thì Nhẫn 1 (khớp `equipment.autoSlot`). */
export function targetSlot(it: InventoryItem, equipment: EquipSlotView[]): EquipSlotId | null {
	const slots = slotsFor(it.equipKind);
	return slots.find((s) => !equipment.find((e) => e.slot === s)?.item) ?? slots[0] ?? null;
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
 * Ảnh vật phẩm đúng 1× ở cỡ gốc, căn giữa lòng ô bằng toạ độ NGUYÊN (không thu lẻ — nét pixel sắc), để NGUYÊN hình (bỏ viền
 * 1px màu độ hiếm chói quanh icon — 10/10/2026, độ hiếm đã hiện ở lòng ô phớt màu + vệt đáy ô). Ảnh lỗi / rỗng (vật phẩm
 * lạ) → TÊN món trong lòng ô (đặc tả mục 3, không emoji), chữ nâu đậm trên lòng kem của ô có đồ — không bị đọc nhầm thành ô
 * trống (ô trống lõm sẫm hơn, không chữ).
 */
export function ItemIcon({ item, box = SLOT_INNER, dim = false }: { item: Pick<InventoryItem, 'icon' | 'w' | 'h' | 'name' | 'rarity'>; box?: [number, number]; dim?: boolean }) {
	const [broken, setBroken] = useState<string | null>(null);
	if (!item.icon || broken === item.icon || !item.w || !item.h)
		return (
			<span className={`pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden px-1 text-center text-[11px] leading-[13px] font-extrabold break-words text-ink-brown ${dim ? 'opacity-40' : ''}`}>
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
			style={{ left: Math.floor((box[0] - item.w) / 2), top: Math.floor((box[1] - item.h) / 2), width: item.w, height: item.h }}
		/>
	);
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

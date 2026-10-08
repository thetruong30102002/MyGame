'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { SLOT_NAME, SLOT_SHORT, type EquipSlotId } from '@/game/equipment';
import { SLOT_SILHOUETTE } from '@/game/items';
import type { EquipSlotView, PlayerSpriteView } from '@/store/useGameStore';
import { dollDoubleUnequips, type FirstClick } from './dollClick';
import { ItemIcon, SlotSilhouette, type InvMode } from './invShared';
import { PlayerFigure } from './PlayerFigure';

const LEFT: EquipSlotId[] = ['head', 'body', 'hands', 'legs', 'feet'];
const RIGHT: EquipSlotId[] = ['neck', 'main', 'off', 'ring1', 'ring2'];

/**
 * Màn thấp: mỗi bên lưới 2×3, cột TRONG (sát nhân vật) giữ đồ theo thân người — trái: Mũ hàng 1, Áo / Quần cột trong,
 * Găng / Giày cột ngoài; phải: Dây chuyền / Vũ khí / Nhẫn 1 cột trong, Tay phụ / Nhẫn 2 cột ngoài.
 */
const LOW_AREA: Record<EquipSlotId, string> = {
	head: '1 / 2',
	body: '2 / 2',
	hands: '2 / 1',
	legs: '3 / 2',
	feet: '3 / 1',
	neck: '1 / 1',
	main: '2 / 1',
	off: '2 / 2',
	ring1: '3 / 1',
	ring2: '3 / 2',
};

/** Số in góc CẢ HAI ô nhẫn, trống hay có đồ (nhãn ô trống chỉ ghi "Nhẫn" — `SLOT_SHORT`): ghi chú thẻ "bấm ô nhẫn có số 2" chỉ đúng ô. */
const RING_NO: Partial<Record<EquipSlotId, string>> = { ring1: '1', ring2: '2' };

export interface DollProps {
	mode: InvMode;
	equipment: EquipSlotView[];
	/** Ô sáng viền (món trang bị trong túi đang chọn hợp ô này) — bấm là mặc vào đó. */
	targets: ReadonlySet<EquipSlotId>;
	/** Ô đang chọn (món đang mặc được chọn, hoặc ô trống đang lọc nhanh). */
	selected: EquipSlotId | null;
	sprite: PlayerSpriteView | null;
	name: string;
	sub: string;
	/** Máy có chuột: nhấp đúp ô = tháo. */
	fine: boolean;
	onSlot: (slot: EquipSlotId, keyboard: boolean) => void;
	onSlotDouble: (slot: EquipSlotId) => void;
	onHover: (uid: string | null) => void;
}

/**
 * Búp bê: 5 ô trái (theo thân người từ trên xuống) · sân khấu giấy lõm có nhân vật · 5 ô phải. Ô đá đúng 58×57 (luật viền 9
 * mảnh: chỉ 58×57 hoặc 90×88). Sân khấu KHÔNG dùng vòng phép tối làm bục.
 */
export function EquipDoll({ mode, equipment, targets, selected, sprite, name, sub, fine, onSlot, onSlotDouble, onHover }: DollProps) {
	const stageRef = useRef<HTMLDivElement>(null);
	const [stage, setStage] = useState({ w: 0, h: 0 });
	/** Cú nhấp ĐẦU của chuỗi nhấp (detail 1): ô nào, món nào đang nằm đó, ô có đang sáng không — nhấp đúp xét theo nó. */
	const firstClick = useRef<FirstClick | null>(null);
	useEffect(() => {
		const el = stageRef.current;
		if (!el) return undefined;
		const ro = new ResizeObserver(() => setStage({ w: el.clientWidth, h: el.clientHeight }));
		ro.observe(el);
		return () => ro.disconnect();
	}, []);
	const low = mode === 'low';

	const cell = (slot: EquipSlotId) => {
		const it = equipment.find((e) => e.slot === slot)?.item ?? null;
		const target = targets.has(slot);
		const on = selected === slot;
		// Nhãn ô trống: `px-[13px]` bù đúng `-inset-[13px]` → hộp chữ = lòng tối 32px, nhãn dài ("Vũ khí", "Tay phụ") xuống
		// 2 dòng thay vì tràn lên dải sáng 2px của khung (chữ parchment-dim trên nền giấy là mất nét).
		const label = SLOT_SHORT[slot];
		return (
			<button
				key={slot}
				type="button"
				title={it ? `${SLOT_NAME[slot]}: ${it.name}` : `${SLOT_NAME[slot]} — trống`}
				aria-label={`${SLOT_NAME[slot]}: ${it ? it.name : 'trống'}${target ? ' — bấm để mặc vào đây' : ''}`}
				aria-pressed={on}
				data-slot={slot}
				onClick={(e) => {
					if (e.detail === 1) firstClick.current = { slot, uid: it?.uid ?? null, target };
					// Cú thứ hai của nhấp đúp (máy có chuột) không chọn / lọc lại — nhấp đúp do `onDoubleClick` lo trọn.
					if (fine && e.detail >= 2) return;
					onSlot(slot, e.detail === 0);
				}}
				onDoubleClick={() => {
					const f = firstClick.current;
					firstClick.current = null;
					if (fine && dollDoubleUnequips(f, slot, it?.uid ?? null)) onSlotDouble(slot);
				}}
				onPointerEnter={(e) => e.pointerType === 'mouse' && onHover(it?.uid ?? null)}
				onPointerLeave={(e) => e.pointerType === 'mouse' && onHover(null)}
				className={`ui-slot relative h-[57px] w-[58px] shrink-0 cursor-pointer ${target ? 'inv-target' : on ? 'outline-[3px] outline-offset-2 outline-ink-brown' : 'hover:brightness-110'}`}
				style={low ? ({ gridArea: LOW_AREA[slot] } as CSSProperties) : undefined}
			>
				{it ? (
					<ItemIcon item={it} />
				) : (
					<SlotSilhouette
						src={SLOT_SILHOUETTE[slot]}
						fallback={<span className="pointer-events-none absolute -inset-[13px] flex items-center justify-center px-[13px] text-center text-[11px] leading-[13px] font-extrabold text-parchment-dim">{label}</span>}
					/>
				)}
				{RING_NO[slot] && (
					<span aria-hidden className="pointer-events-none absolute -top-[11px] -right-[11px] flex h-4 min-w-4 items-center justify-center rounded-[4px] border-2 border-outline bg-parchment px-0.5 text-[11px] leading-none font-extrabold text-ink-brown tabular-nums">
						{RING_NO[slot]}
					</span>
				)}
			</button>
		);
	};

	const side = (slots: EquipSlotId[], aria: string) => (
		<div role="group" aria-label={aria} className={low ? 'grid grid-cols-[58px_58px] grid-rows-[repeat(3,57px)] gap-1.5' : 'flex flex-col gap-2'}>
			{slots.map(cell)}
		</div>
	);

	return (
		<div className={low ? 'grid grid-cols-[122px_110px_122px] gap-x-2' : 'grid grid-cols-[58px_minmax(0,1fr)_58px] gap-x-2 sm:gap-x-3'}>
			{side(LEFT, 'Trang phục')}
			{/* Lớp trong `absolute`: hình không bao giờ đẩy cao hàng lưới — cỡ sân khấu chỉ do hai cột ô quyết, nên phép đo không tự nuôi nhau. */}
			<div ref={stageRef} className="relative min-w-0 overflow-hidden rounded-[10px] border-2 border-paper-line bg-paper-sunk">
				<div className="absolute inset-0 flex flex-col items-center justify-end px-1 pt-2 pb-2">
					<PlayerFigure sprite={sprite} maxW={stage.w} maxH={stage.h} reserve={low ? 12 : 52} kMax={low ? 2 : 4} alt={name} />
					{!low && (
						<div className="mt-1.5 max-w-full text-center">
							<p className="truncate font-display text-[18px] leading-[24px] font-extrabold">{name}</p>
							<p className="truncate text-note text-ink-soft">{sub}</p>
						</div>
					)}
				</div>
			</div>
			{side(RIGHT, 'Vũ khí và trang sức')}
		</div>
	);
}

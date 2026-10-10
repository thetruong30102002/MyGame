'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { EQUIP_SLOTS, SLOT_NAME, SLOT_SHORT, type EquipSlotId } from '@/game/equipment';
import { SLOT_SILHOUETTE } from '@/game/items';
import type { EquipSlotView, PlayerSpriteView } from '@/store/useGameStore';
import { dollDoubleUnequips, type FirstClick } from './dollClick';
import { ItemIcon, rarityClass, SlotSilhouette, type InvMode } from './invShared';
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

/**
 * Nhãn DƯỚI mỗi ô (không in vào lòng ô — chỗ đó dành cho bóng mờ PixelLab `SLOT_SILHOUETTE` và icon đồ): tên ngắn, riêng hai
 * ô nhẫn ghi đủ số ("Nhẫn 1" / "Nhẫn 2") để ghi chú thẻ "bấm ô Nhẫn 2" chỉ đúng ô. Rộng nhất là "Dây chuyền" ≈ 58px ở 11px.
 */
const caption = (slot: EquipSlotId): string => (slot === 'ring1' || slot === 'ring2' ? SLOT_NAME[slot] : SLOT_SHORT[slot]);

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
 * Búp bê: tiêu đề "Trang bị · đang mặc n/10 ô", rồi 5 ô trái (theo thân người từ trên xuống) · sân khấu giấy lõm có nhân
 * vật · 5 ô phải. Ô đá đúng 58×57 (luật viền 9 mảnh: chỉ 58×57 hoặc 90×88), tên ô in DƯỚI ô; ô có đồ mang vòng màu độ
 * hiếm, ô trống mờ đi một chút. Sân khấu KHÔNG dùng vòng phép tối làm bục. Màn thấp: chỉ lưới, không tiêu đề.
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
		return (
			<div key={slot} className="flex w-[64px] flex-col items-center gap-[5px]" style={low ? ({ gridArea: LOW_AREA[slot] } as CSSProperties) : undefined}>
				<button
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
					className={`ui-slot relative h-[57px] w-[58px] shrink-0 cursor-pointer ${it ? rarityClass(it.rarity) : 'opacity-85'} ${target ? 'inv-target' : on ? 'outline-[3px] outline-offset-1 outline-ink-brown' : 'hover:brightness-110'}`}
				>
					{it ? <ItemIcon item={it} /> : <SlotSilhouette src={SLOT_SILHOUETTE[slot]} fallback={null} />}
				</button>
				<span aria-hidden className={`w-full truncate text-center text-[11px] leading-[13px] font-extrabold ${target ? 'text-amber' : it ? 'text-ink-brown' : 'text-ink-faint'}`}>
					{caption(slot)}
				</span>
			</div>
		);
	};

	const side = (slots: EquipSlotId[], aria: string) => (
		<div role="group" aria-label={aria} className={low ? 'grid grid-cols-[64px_64px] grid-rows-[repeat(3,auto)] gap-x-0.5 gap-y-1' : 'flex flex-col gap-1.5'}>
			{slots.map(cell)}
		</div>
	);
	const worn = equipment.filter((e) => e.item).length;

	const grid = (
		<div className={low ? 'grid grid-cols-[130px_minmax(0,1fr)_130px] gap-x-1.5' : 'grid grid-cols-[64px_minmax(0,1fr)_64px] gap-x-1.5 sm:gap-x-2.5'}>
			{side(LEFT, 'Trang phục')}
			{/* Lớp trong `absolute`: hình không bao giờ đẩy cao hàng lưới — cỡ sân khấu chỉ do hai cột ô quyết, nên phép đo không tự nuôi nhau. */}
			<div ref={stageRef} className="relative min-w-0 overflow-hidden rounded-[10px] border-2 border-paper-line bg-[linear-gradient(var(--color-paper-sunk),#e3c48f)]">
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
	// Cây giữ NGUYÊN hình dạng khi đổi chế độ (tiêu đề chỉ bật/tắt): `useInvMode` thường ra chế độ thật sau lần vẽ đầu, mà
	// đổi kiểu phần tử gốc thì React dựng lại sân khấu — ResizeObserver (gắn một lần) bám nút cũ, hình nhân vật mất hẳn.
	return (
		<>
			{!low && (
				<div className="mb-1.5 flex items-baseline gap-2">
					<h3 className="font-display text-[18px] leading-[1.3] font-extrabold">Trang bị</h3>
					<span className="text-note text-ink-soft tabular-nums">
						đang mặc {worn}/{EQUIP_SLOTS.length} ô
					</span>
				</div>
			)}
			{grid}
		</>
	);
}

'use client';

import { useRef, type KeyboardEvent } from 'react';
import { BAG_SIZE, bagUsed } from '@/game/equipment';
import { ITEM_INFO } from '@/game/items';
import type { InventoryItem } from '@/store/useGameStore';
import { useSession } from '@/store/useSession';
import { fmtNum } from '../CharacterPanelParts';
import { ItemIcon, type InvMode } from './invShared';

export type BagFilter = 'all' | 'equip' | 'use' | 'other';
const FILTERS: { id: BagFilter; label: string }[] = [
	{ id: 'all', label: 'Tất cả' },
	{ id: 'equip', label: 'Trang bị' },
	{ id: 'use', label: 'Dùng' },
	{ id: 'other', label: 'Khác' },
];

const pass = (f: BagFilter, it: InventoryItem): boolean => f === 'all' || (f === 'equip' ? it.kind === 'equip' : f === 'use' ? it.kind === 'consumable' : it.kind !== 'equip' && it.kind !== 'consumable');

/** Chồng đồ / bình mật ong hiện số ở góc; món lẻ thì không. */
const badgeOf = (it: InventoryItem): string | null => (it.id === 'potion' || it.count > 1 ? fmtNum(it.count) : null);

export interface BagProps {
	mode: InvMode;
	items: InventoryItem[];
	coins: number;
	filter: BagFilter;
	onFilter: (f: BagFilter) => void;
	selected: string | null;
	/** Món hợp ô trống đang lọc nhanh — viền nét đứt. */
	fits: ReadonlySet<string>;
	/** Số cột tối thiểu để tính số ô trống vẽ thêm (lưới tự xếp `auto-fill` 58px). */
	cols: number;
	fine: boolean;
	/** Máy cảm ứng: chip lọc cao 44 (cùng chuẩn với "Thôi" / "Đóng"). */
	touch: boolean;
	onPick: (uid: string, keyboard: boolean) => void;
	onPickDouble: (uid: string) => void;
	onHover: (uid: string | null) => void;
	/** Dòng ghi chú trên lưới (lọc nhanh theo ô trống ở màn thấp). */
	note?: string | null;
}

/**
 * Túi đồ: tiêu đề "Túi đồ n/24" + ví (xu ra khỏi lưới), chip lọc, lưới ô 58×57. Ô có đồ là ô đá + ảnh 1×; ô trống là ô
 * giấy lõm. Máy tính: lưới hiện 2 hàng, cuộn trong; điện thoại: cả tab cuộn chung (không lồng vùng cuộn).
 */
export function BagGrid({ mode, items, coins, filter, onFilter, selected, fits, cols, fine, touch, onPick, onPickDouble, onHover, note }: BagProps) {
	const diamonds = useSession((s) => s.diamonds);
	const gridRef = useRef<HTMLDivElement>(null);
	// Màn thấp không có chip lọc: bộ lọc chọn từ lúc máy còn dọc (state ở màn cha, xoay máy không dựng lại) không được giấu
	// đồ mà không còn nút nào để bỏ lọc.
	const active: BagFilter = mode === 'low' ? 'all' : filter;
	const shown = items.filter((it) => pass(active, it));
	const cells = Math.max(cols * 2, Math.min(Math.max(BAG_SIZE, shown.length), Math.ceil((shown.length + 1) / cols) * cols));

	// Mũi tên đi trong lưới (số cột đọc từ bố cục thật — `auto-fill` đổi theo bề ngang).
	const onKey = (e: KeyboardEvent<HTMLDivElement>): void => {
		const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: 0, ArrowDown: 0 }[e.key];
		if (step === undefined) return;
		const grid = gridRef.current;
		const btns = grid ? [...grid.querySelectorAll<HTMLButtonElement>('button[data-uid]')] : [];
		const i = btns.indexOf(document.activeElement as HTMLButtonElement);
		if (i < 0 || !grid) return;
		const n = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length || cols;
		const j = i + (e.key === 'ArrowUp' ? -n : e.key === 'ArrowDown' ? n : step);
		if (j < 0 || j >= btns.length) return;
		e.preventDefault();
		btns[j]!.focus();
	};

	return (
		<div className="flex min-w-0 flex-col gap-2">
			<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
				<h3 className="whitespace-nowrap font-display text-[18px] leading-[1.3] font-extrabold">Túi đồ</h3>
				<span className="whitespace-nowrap text-note text-ink-soft tabular-nums" title="Bình mật ong không chiếm ô túi">
					{bagUsed(items)}/{BAG_SIZE} ô
				</span>
				{/* Tiền: xu + kim cương thành một cụm — màn hẹp thì cả cụm xuống hàng riêng thay vì bẻ chữ. */}
				<span className="ml-auto flex items-center gap-3 whitespace-nowrap">
				<span className="flex items-center gap-1" title="Xu — để tẩy điểm tiềm năng">
					<img src={ITEM_INFO.coins?.icon ?? '/assets/ui/icon_coins.png'} width={44} height={37} alt="" draggable={false} className="pixel-img max-w-none" />
					<b className="text-[18px] font-extrabold tabular-nums">{fmtNum(coins)}</b>
					<span className="text-note text-ink-soft">xu</span>
				</span>
				{/* Kim cương (K1): số dư ở máy chủ — chỉ có khi chơi trực tuyến. Icon TẠM vẽ tay, có icon PixelLab thì thay file. */}
				{diamonds !== null && (
					<span className="flex items-center gap-1" title="Kim cương — nhận từ điểm danh và Bia Danh Vọng, mua đồ ở quầy Bram">
						<img src="/assets/ui/icon_diamond.png" width={44} height={36} alt="" draggable={false} className="pixel-img max-w-none" />
						<b className="text-[18px] font-extrabold tabular-nums">{fmtNum(diamonds)}</b>
						<span className="text-note text-ink-soft">kim cương</span>
					</span>
				)}
				</span>
			</div>
			{mode !== 'low' && (
				<div role="group" aria-label="Lọc túi đồ" className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
					{FILTERS.map((f) => (
						<button key={f.id} type="button" aria-pressed={active === f.id} onClick={() => onFilter(f.id)} className={`ui-chip ${touch ? 'min-h-11' : 'min-h-[30px]'} shrink-0 px-2.5 text-[13px]`}>
							{f.label}
						</button>
					))}
				</div>
			)}
			{note && <p className="text-note text-ink-soft">{note}</p>}
			<div
				ref={gridRef}
				role="group"
				aria-label="Ô túi đồ"
				onKeyDown={onKey}
				className={`grid grid-cols-[repeat(auto-fill,58px)] gap-1 ${mode === 'desktop' ? '-m-1.5 max-h-[134px] overflow-y-auto p-1.5 [scrollbar-color:var(--color-paper-line)_transparent] [scrollbar-width:thin]' : mode === 'phone' ? 'justify-between gap-y-1.5' : ''}`}
			>
				{Array.from({ length: cells }, (_, i) => {
					const it = shown[i];
					if (!it) return <div key={`empty-${i}`} className="h-[57px] w-[58px] rounded-[6px] border-2 border-paper-line bg-paper-sunk" />;
					const b = badgeOf(it);
					const on = selected === it.uid;
					const fit = fits.has(it.uid);
					return (
						<button
							key={it.uid}
							type="button"
							data-uid={it.uid}
							title={it.name}
							aria-label={`${it.name}${b ? ` × ${b}` : ''}`}
							aria-pressed={on}
							onClick={(e) => onPick(it.uid, e.detail === 0)}
							onDoubleClick={() => fine && onPickDouble(it.uid)}
							onPointerEnter={(e) => e.pointerType === 'mouse' && onHover(it.uid)}
							onPointerLeave={(e) => e.pointerType === 'mouse' && onHover(null)}
							className={`ui-slot relative h-[57px] w-[58px] cursor-pointer ${on ? 'outline-[3px] outline-offset-2 outline-gold-hi' : fit ? 'outline-2 outline-offset-2 outline-dashed outline-amber' : 'hover:brightness-110'}`}
						>
							<ItemIcon item={it} dim={it.id === 'potion' && it.count <= 0} />
							{b && <span className="pointer-events-none absolute -right-2.5 -bottom-2.5 text-[13px] leading-none font-extrabold text-white tabular-nums text-outline">{b}</span>}
						</button>
					);
				})}
			</div>
		</div>
	);
}

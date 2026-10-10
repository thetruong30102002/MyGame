'use client';

import { useRef, type CSSProperties, type KeyboardEvent } from 'react';
import { BAG_SIZE, bagUsed, RARITY_NAME } from '@/game/equipment';
import { ITEM_INFO } from '@/game/items';
import type { InventoryItem } from '@/store/useGameStore';
import { useSession } from '@/store/useSession';
import { fmtNum } from '../CharacterPanelParts';
import { CELL, ItemIcon, rarityClass, type InvMode } from './invShared';

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
	/** Cấp nhân vật — món trong túi đòi cấp cao hơn thì in nhãn "Cấp N" đỏ ở góc. */
	level: number;
	filter: BagFilter;
	onFilter: (f: BagFilter) => void;
	selected: string | null;
	/** Món hợp ô trống đang lọc nhanh — viền nét đứt. */
	fits: ReadonlySet<string>;
	/** Số cột tối thiểu (màn thấp: tính số ô trống vẽ thêm; lưới tự xếp `auto-fill` 58px). */
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
 * Túi đồ: tiêu đề "Túi đồ" + thanh sức chứa "n/24 ô" + ví (xu, kim cương), chip lọc kèm số món, lưới ô mềm 58×58 (`CELL`, cùng
 * kiểu ô búp bê). Ô có đồ lòng kem + ảnh 1× (đồ từ Tốt trở lên phớt màu độ hiếm, đồ chưa đủ cấp có nhãn "Cấp N" đỏ trong góc,
 * chồng đồ có viên số ở góc dưới); ô trống là ô giấy lõm.
 * Thẻ "Tất cả" vẽ ĐỦ sức chứa túi (thấy ngay còn bao nhiêu chỗ); thẻ lọc chỉ vẽ món khớp. Máy tính: lưới cao tối đa 3 hàng,
 * cuộn trong (máy rộng 8 cột là vừa trọn 24 ô); điện thoại: cả tab cuộn chung; màn thấp: chỉ 2 hàng + phần đã dùng.
 */
export function BagGrid({ mode, items, coins, level, filter, onFilter, selected, fits, cols, fine, touch, onPick, onPickDouble, onHover, note }: BagProps) {
	const diamonds = useSession((s) => s.diamonds);
	const gridRef = useRef<HTMLDivElement>(null);
	// Màn thấp không có chip lọc: bộ lọc chọn từ lúc máy còn dọc (state ở màn cha, xoay máy không dựng lại) không được giấu
	// đồ mà không còn nút nào để bỏ lọc.
	const active: BagFilter = mode === 'low' ? 'all' : filter;
	const shown = items.filter((it) => pass(active, it));
	const used = bagUsed(items);
	const full = used >= BAG_SIZE;
	const cells = active !== 'all' ? shown.length : mode === 'low' ? Math.max(cols * 2, Math.min(Math.max(BAG_SIZE, shown.length), Math.ceil((shown.length + 1) / cols) * cols)) : Math.max(BAG_SIZE, shown.length);
	const fill = full ? 'var(--color-berry)' : used >= BAG_SIZE * 0.75 ? 'var(--color-stamina)' : 'var(--color-leaf)';

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
			<div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
				<h3 className="font-display text-[18px] leading-[1.3] font-extrabold whitespace-nowrap">Túi đồ</h3>
				{/* Sức chứa: thanh + số. Bình mật ong là chồng ảo, không chiếm ô — đếm cùng phép với luật "Túi đầy" (`bagUsed`). */}
				<span className="flex items-center gap-1.5 whitespace-nowrap" title="Ô túi đã dùng — bình mật ong không chiếm ô">
					<span className="inv-meter w-16" aria-hidden>
						<i style={{ width: `${Math.min(100, (used / BAG_SIZE) * 100)}%`, '--fill': fill } as CSSProperties} />
					</span>
					<span className={`text-note font-bold tabular-nums ${full ? 'text-berry' : 'text-ink-soft'}`}>
						{used}/{BAG_SIZE} ô{full ? ' · đầy' : ''}
					</span>
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
					{FILTERS.map((f) => {
						const n = f.id === 'all' ? items.length : items.filter((it) => pass(f.id, it)).length;
						return (
							<button key={f.id} type="button" aria-pressed={active === f.id} onClick={() => onFilter(f.id)} className={`ui-chip ${touch ? 'min-h-11' : 'min-h-8'} shrink-0 gap-1.5 pr-1.5 pl-3 text-[13px]`}>
								{f.label}
								<span className={`min-w-[20px] rounded-full bg-[rgb(122_85_52/0.1)] px-1.5 text-center text-[12px] leading-[18px] tabular-nums ${n ? 'text-ink-soft' : 'text-ink-faint opacity-70'}`}>{n}</span>
							</button>
						);
					})}
				</div>
			)}
			{note && <p className="text-note text-ink-soft">{note}</p>}
			{cells === 0 ? (
				<p className="inv-well px-3 py-2.5 text-note text-ink-soft">Không có món nào trong nhóm này.</p>
			) : (
				<div
					ref={gridRef}
					role="group"
					aria-label="Ô túi đồ"
					onKeyDown={onKey}
					className={`grid grid-cols-[repeat(auto-fill,58px)] gap-1.5 ${mode === 'desktop' ? '-m-1.5 max-h-[198px] overflow-y-auto p-1.5 [scrollbar-color:var(--color-paper-line)_transparent] [scrollbar-width:thin]' : mode === 'phone' ? 'justify-between' : ''}`}
				>
					{Array.from({ length: cells }, (_, i) => {
						const it = shown[i];
						if (!it) return <div key={`empty-${i}`} className={CELL} />;
						const b = badgeOf(it);
						const on = selected === it.uid;
						const fit = fits.has(it.uid);
						const lack = (it.levelReq ?? 0) > level ? it.levelReq! : 0;
						return (
							<button
								key={it.uid}
								type="button"
								data-uid={it.uid}
								title={`${it.name}${it.rarity && it.rarity !== 'common' ? ` · ${RARITY_NAME[it.rarity]}` : ''}${lack ? ` · cần cấp ${lack}` : ''}`}
								aria-label={`${it.name}${b ? ` × ${b}` : ''}${it.rarity && it.rarity !== 'common' ? `, ${RARITY_NAME[it.rarity]}` : ''}${lack ? `, cần cấp ${lack}` : ''}`}
								aria-pressed={on}
								onClick={(e) => onPick(it.uid, e.detail === 0)}
								onDoubleClick={() => fine && onPickDouble(it.uid)}
								onPointerEnter={(e) => e.pointerType === 'mouse' && onHover(it.uid)}
								onPointerLeave={(e) => e.pointerType === 'mouse' && onHover(null)}
								data-full=""
								className={`${CELL} ${rarityClass(it.rarity)} ${fit && !on ? 'inv-fit' : ''}`}
							>
								<ItemIcon item={it} dim={it.id === 'potion' && it.count <= 0} />
								{lack > 0 && (
									<span aria-hidden className="pointer-events-none absolute top-[3px] left-[3px] rounded-full bg-berry/90 px-[5px] text-[11px] leading-[15px] font-extrabold whitespace-nowrap text-paper-hi shadow-[0_1px_2px_rgb(74_46_28/0.25)]">
										Cấp {lack}
									</span>
								)}
								{b && <span className="pointer-events-none absolute right-[3px] bottom-[3px] min-w-[18px] rounded-full bg-cream/95 px-[5px] text-center text-[12px] leading-[16px] font-extrabold text-ink-brown tabular-nums shadow-[0_1px_2px_rgb(74_46_28/0.25)]">{b}</span>}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}

'use client';

import { useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { BAG_SIZE, bagUsed, KIND_NAME, SLOT_KIND, SLOT_NAME, slotsFor, type EquipSlotId, type StatKey } from '@/game/equipment';
import { STAT_ICON } from '@/game/items';
import { useGameStore, type InventoryItem } from '@/store/useGameStore';
import { BagGrid, type BagFilter } from './inventory/BagGrid';
import { EquipDoll } from './inventory/EquipDoll';
import { compareLines, fmtStat, gearPart, targetSlot, type InvMode } from './inventory/invShared';
import { ItemCard } from './inventory/ItemCard';
import { useTouchDevice } from './TouchControls';
import { useMediaQuery } from './useMediaQuery';

/** Bốn chỉ số dưới búp bê: số trên bảng (đã gồm trang bị) + "+N" phần của trang bị. Icon PixelLab đúng 1× (ui.json). */
const DOLL_STATS: { key: StatKey; label: string; icon: { src: string; w: number; h: number } }[] = [
	{ key: 'atk', label: 'Tấn công', icon: { src: STAT_ICON.attack, w: 48, h: 44 } },
	{ key: 'mag', label: 'Phép thuật', icon: { src: STAT_ICON.magic, w: 35, h: 39 } },
	{ key: 'def', label: 'Phòng thủ', icon: { src: STAT_ICON.defense, w: 48, h: 49 } },
	{ key: 'hp', label: 'Máu tối đa', icon: { src: STAT_ICON.hp, w: 43, h: 38 } },
];

/** Bố cục theo cỡ màn — màn thấp (điện thoại xoay ngang) ưu tiên trước điện thoại dọc, như bảng Tiềm năng. */
function useInvMode(): InvMode {
	const low = useMediaQuery('(max-height: 500px)');
	const phone = useMediaQuery('(max-width: 639px)');
	return low ? 'low' : phone ? 'phone' : 'desktop';
}

/**
 * Tab "Kho đồ" kiểu búp bê giấy: nhân vật đứng giữa, 10 ô trang bị quanh người (Mũ · Áo · Găng · Quần · Giày | Dây chuyền ·
 * Vũ khí chính · Tay phụ · Nhẫn 1 · Nhẫn 2), túi đồ + thẻ so sánh bên cạnh (điện thoại: thẻ là sheet trượt từ đáy).
 * Chọn món trang bị trong túi → ô đích trên búp bê sáng viền; bấm ô sáng (hoặc nút Trang bị) là mặc. Chỉ chạm, không kéo
 * thả (lớp phủ đang `touch-none` cho cần gạt). Mọi thao tác đi qua `request('equip' | 'unequip' | 'use_potion')`.
 * Esc đóng thẻ trước rồi mới đóng bảng.
 */
export function CharacterInventoryTab() {
	const items = useGameStore((st) => st.inventory);
	const equipment = useGameStore((st) => st.equipment);
	// Chỉ các trường bảng này đọc: `stats` cả khối đổi mỗi nhịp HUD (100ms) — chọn nguyên khối là vẽ lại 10 lần/giây.
	const stats = useGameStore(
		useShallow((st) => ({ name: st.stats.name, level: st.stats.level, path: st.stats.path, age: st.stats.age, coins: st.stats.coins, hp: st.stats.hp, hpMax: st.stats.hpMax, gear: st.stats.gear, gearBasis: st.stats.gearBasis })),
	);
	const sprite = useGameStore((st) => st.playerSprite);
	const request = useGameStore((st) => st.request);
	const mode = useInvMode();
	const touch = useTouchDevice();
	const fine = useMediaQuery('(hover: hover) and (pointer: fine)');
	const narrow = useMediaQuery('(max-width: 359px)');
	const [sel, setSel] = useState<string | null>(null);
	const [emptySlot, setEmptySlot] = useState<EquipSlotId | null>(null);
	const [hover, setHover] = useState<string | null>(null);
	const [filter, setFilter] = useState<BagFilter>('all');
	const primaryRef = useRef<HTMLButtonElement>(null);
	const focusPrimary = useRef(false);
	const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	// Sheet điện thoại che đáy tab: chừa đúng chừng ấy chỗ dưới túi để vẫn cuộn được món cuối lên trên sheet.
	const sheetRef = useRef<HTMLDivElement>(null);
	const [sheetH, setSheetH] = useState(0);
	const rootRef = useRef<HTMLDivElement>(null);
	/**
	 * Mặc / tháo gỡ thẻ cùng nút đang giữ focus, uống tới đầy máu thì nút Uống tắt — focus rơi xuống body và phím Tab kế
	 * tiếp nhảy ra HUD nằm dưới lớp phủ. Ghi chỗ nhận focus thay (ô búp bê vừa nhận / vừa tháo đồ, ô bình trong túi); sau
	 * lần vẽ kế, focus đã mất thì đưa về đó. Hết hạn sau 1,5 giây (người chơi đã tự đi chỗ khác thì thôi).
	 */
	const refocus = useRef<{ sel: string; until: number } | null>(null);

	const find = (uid: string | null): InventoryItem | null => (uid ? (items.find((it) => it.uid === uid) ?? equipment.find((e) => e.item?.uid === uid)?.item ?? null) : null);
	// Món đang chọn không còn trong túi lẫn trên người thì thẻ tự đóng.
	const selected = find(sel);
	const shown = selected ?? (fine && !emptySlot ? find(hover) : null);
	const preview = !selected && !!shown;
	const bagFull = bagUsed(items) >= BAG_SIZE;

	const targets = useMemo(() => new Set<EquipSlotId>(selected?.kind === 'equip' && !selected.equippedAt ? slotsFor(selected.equipKind) : []), [selected]);
	const fits = useMemo(() => new Set(emptySlot ? items.filter((it) => it.equipKind && slotsFor(it.equipKind).includes(emptySlot)).map((it) => it.uid) : []), [emptySlot, items]);

	const clear = (): void => {
		setSel(null);
		setEmptySlot(null);
	};

	// Esc: đóng thẻ / lọc nhanh trước, bảng đóng ở lần Esc sau. Nghe ở pha bắt của window (chạy TRƯỚC listener đóng bảng
	// của CharacterPanel) rồi chặn lan để bảng không đóng cùng lúc.
	const open = !!selected || !!emptySlot;
	useEffect(() => {
		if (!open) return undefined;
		const onKey = (e: KeyboardEvent): void => {
			if (e.code !== 'Escape' || e.repeat) return;
			e.stopPropagation();
			setSel(null);
			setEmptySlot(null);
		};
		window.addEventListener('keydown', onKey, true);
		return () => window.removeEventListener('keydown', onKey, true);
	}, [open]);

	// Chọn bằng bàn phím (Enter trên ô): đưa focus sang nút chính của thẻ — Enter lần nữa là thực hiện.
	useEffect(() => {
		if (!focusPrimary.current || !sel) return;
		focusPrimary.current = false;
		primaryRef.current?.focus({ preventScroll: true });
	}, [sel]);

	useEffect(
		() => () => {
			if (hoverTimer.current) clearTimeout(hoverTimer.current);
		},
		[],
	);

	// Sau MỌI lần vẽ: còn chỗ chờ nhận focus mà focus đã rơi (body / nút vừa bị tắt) thì đưa về chỗ đó.
	useEffect(() => {
		const want = refocus.current;
		const root = rootRef.current;
		if (!want || !root) return;
		if (performance.now() > want.until) {
			refocus.current = null;
			return;
		}
		const a = document.activeElement;
		const lost = !a || a === document.body || (a instanceof HTMLButtonElement && a.disabled);
		if (!lost) {
			if (!root.contains(a)) refocus.current = null;
			return;
		}
		const el = root.querySelector<HTMLElement>(want.sel);
		if (!el) return;
		refocus.current = null;
		el.focus({ preventScroll: true });
	});

	const sheetOpen = mode === 'phone' && open;
	useEffect(() => {
		const el = sheetRef.current;
		if (!sheetOpen || !el) return setSheetH(0);
		const ro = new ResizeObserver(() => setSheetH(el.offsetHeight));
		ro.observe(el);
		return () => ro.disconnect();
	}, [sheetOpen]);

	const pick = (uid: string, keyboard: boolean): void => {
		refocus.current = null;
		setEmptySlot(null);
		setSel(uid);
		focusPrimary.current = keyboard;
	};
	const holdFocus = (sel: string): void => {
		refocus.current = { sel, until: performance.now() + 1500 };
	};
	const equip = (uid: string, slot?: EquipSlotId): void => {
		const it = find(uid);
		const dest = slot ?? (it ? targetSlot(it, equipment) : null);
		if (dest) holdFocus(`[data-slot="${dest}"]`);
		request('equip', { uid, ...(slot ? { equipSlot: slot } : {}) });
		clear();
	};
	const unequip = (slot: EquipSlotId): void => {
		holdFocus(`[data-slot="${slot}"]`);
		request('unequip', { equipSlot: slot });
		clear();
	};
	const drink = (): void => {
		holdFocus('[data-uid="potion"]');
		request('use_potion');
	};
	const onSlot = (slot: EquipSlotId, keyboard: boolean): void => {
		if (selected && targets.has(slot)) return equip(selected.uid, slot);
		const it = equipment.find((e) => e.slot === slot)?.item;
		if (it) return pick(it.uid, keyboard);
		setSel(null);
		setEmptySlot(emptySlot === slot ? null : slot);
	};
	// Rê chuột (chỉ máy có chuột): trễ 80ms mới xem trước, rời ô thì thôi.
	const onHover = (uid: string | null): void => {
		if (hoverTimer.current) clearTimeout(hoverTimer.current);
		if (!fine) return;
		if (!uid) return setHover(null);
		hoverTimer.current = setTimeout(() => setHover(uid), 80);
	};
	// Chạm chỗ trống của tab = đóng thẻ (sheet điện thoại cũng đóng kiểu này).
	const onBackdrop = (e: MouseEvent<HTMLDivElement>): void => {
		if ((e.target as Element).closest('button, a, input, [data-inv-card]')) return;
		if (open) clear();
	};

	const name = stats.name.split(' · ')[0] ?? stats.name;
	const sub = `Cấp ${stats.level}${stats.path ? ` · ${stats.path}` : stats.age > 0 ? ` · ${stats.age} tuổi` : ''}`;
	// Chọn món trang bị trong túi: ô chỉ số dưới búp bê đổi thành "27 → 33" (so với món ở ô đích sẽ bị thay).
	const cmpSlot = selected?.kind === 'equip' && !selected.equippedAt ? targetSlot(selected, equipment) : null;
	const cmp = selected && cmpSlot ? compareLines(stats.gearBasis, stats.gear, selected, equipment.find((e) => e.slot === cmpSlot)?.item ?? null) : null;

	const emptyMsg = emptySlot ? (fits.size ? `${fits.size} món hợp ô ${SLOT_NAME[emptySlot]} — viền nét đứt trong túi.` : `Chưa có ${KIND_NAME[SLOT_KIND[emptySlot]].toLowerCase()} nào trong túi.`) : null;

	const card: ReactNode = shown ? (
		<ItemCard
			mode={mode}
			item={shown}
			preview={preview}
			equipment={equipment}
			stats={stats}
			bagFull={bagFull}
			touch={touch}
			primaryRef={primaryRef}
			onEquip={equip}
			onUnequip={unequip}
			onPotion={drink}
			onClose={clear}
			onBack={mode === 'low' ? clear : undefined}
		/>
	) : null;

	const doll = (
		<EquipDoll
			mode={mode}
			equipment={equipment}
			targets={targets}
			selected={emptySlot ?? (selected?.equippedAt || null)}
			sprite={sprite}
			name={name}
			sub={sub}
			fine={fine}
			onSlot={onSlot}
			onSlotDouble={unequip}
			onHover={onHover}
		/>
	);

	const dollStats =
		mode === 'low' ? (
			<p className="mt-1.5 flex flex-wrap gap-x-3 text-note text-ink-soft">
				{DOLL_STATS.map((d) => {
					const line = cmp?.find((l) => l.key === d.key);
					return (
						<span key={d.key} className="whitespace-nowrap">
							{d.label}{' '}
							{line ? (
								// Đang so sánh: "76 → 84" tô màu số sau như bản 2×2 — KHÔNG kèm "+N" (đọc thành mức đổi).
								<b className="text-ink-brown tabular-nums">
									{line.before} → <span className={line.after > line.before ? 'text-leaf' : line.after < line.before ? 'text-berry' : ''}>{line.after}</span>
								</b>
							) : (
								<>
									<b className="text-ink-brown tabular-nums">{fmtStat(stats.gearBasis, d.key, stats.gear[d.key] ?? 0)}</b> <GearPlus n={gearPart(stats, d.key)} />
								</>
							)}
						</span>
					);
				})}
			</p>
		) : (
			<div className="mt-2 grid grid-cols-2 gap-1">
				{DOLL_STATS.map((d) => {
					const line = cmp?.find((l) => l.key === d.key);
					return (
						<div key={d.key} className="flex min-w-0 items-center gap-1 rounded-[8px] border-2 border-paper-line bg-paper-hi px-1.5 py-0.5">
							<span className="flex w-12 shrink-0 justify-center">
								<img src={d.icon.src} width={d.icon.w} height={d.icon.h} alt="" draggable={false} className="pixel-img max-w-none" />
							</span>
							<span className="flex min-w-0 flex-col leading-[1.15]">
								<small className="truncate text-[11px] font-bold text-ink-soft">{d.label}</small>
								{line ? (
									<b className="text-[16px] font-extrabold tabular-nums">
										{line.before} → <span className={line.after > line.before ? 'text-leaf' : line.after < line.before ? 'text-berry' : ''}>{line.after}</span>
									</b>
								) : (
									<b className="text-[16px] font-extrabold tabular-nums">
										{fmtStat(stats.gearBasis, d.key, stats.gear[d.key] ?? 0)} <GearPlus n={gearPart(stats, d.key)} />
									</b>
								)}
							</span>
						</div>
					);
				})}
			</div>
		);

	const bag = (
		<BagGrid
			mode={mode}
			items={items}
			coins={stats.coins}
			filter={filter}
			onFilter={setFilter}
			selected={sel}
			fits={fits}
			cols={mode === 'low' || narrow ? 4 : 5}
			fine={fine}
			touch={touch}
			onPick={pick}
			onPickDouble={(uid) => {
				const it = find(uid);
				if (it?.kind === 'equip' && !it.equippedAt) equip(uid);
			}}
			onHover={onHover}
			note={mode === 'low' ? emptyMsg : null}
		/>
	);

	if (mode === 'low') {
		return (
			<div ref={rootRef} className="grid grid-cols-[370px_minmax(0,1fr)] items-start gap-3" onClick={onBackdrop}>
				<section aria-label="Trang bị đang mặc">
					{doll}
					{dollStats}
				</section>
				<section aria-label={selected ? 'Chi tiết vật phẩm' : 'Túi đồ'} className="min-w-0">
					{selected ? (
						<div data-inv-card className="ui-paper border-bark p-2.5">
							{card}
						</div>
					) : (
						bag
					)}
				</section>
			</div>
		);
	}

	if (mode === 'phone') {
		return (
			<div ref={rootRef} className="flex flex-col gap-3" onClick={onBackdrop}>
				<section aria-label="Trang bị đang mặc">
					{doll}
					{dollStats}
				</section>
				<section aria-label="Túi đồ">{bag}</section>
				{sheetH > 0 && <div aria-hidden style={{ height: sheetH }} />}
				{(selected || emptyMsg) && (
					// Sheet trượt từ đáy: định vị theo khung bảng (tab không có tổ tiên `relative`), búp bê vẫn nhìn thấy để ô đích sáng viền.
					<div
						ref={sheetRef}
						data-inv-card
						role="dialog"
						aria-label={selected ? selected.name : 'Lọc theo ô'}
						className="absolute inset-x-0 bottom-0 max-h-[60%] touch-pan-y overflow-y-auto overscroll-contain rounded-t-[14px] border-t-2 border-bark bg-paper-hi px-3 pt-1.5 pb-[max(14px,env(safe-area-inset-bottom))] shadow-[0_-6px_0_rgb(26_17_10/0.25)]"
					>
						<div className="mx-auto mb-1.5 h-[5px] w-11 rounded-[3px] bg-paper-line" aria-hidden />
						{card ?? (
							<div className="flex items-center gap-2">
								<p className="min-w-0 flex-1 text-body text-ink-soft">{emptyMsg}</p>
								<button type="button" className="ui-chip min-h-11" onClick={clear}>
									Thôi
								</button>
							</div>
						)}
					</div>
				)}
			</div>
		);
	}

	return (
		<div ref={rootRef} className="grid grid-cols-[340px_minmax(0,1fr)] items-start gap-3.5" onClick={onBackdrop}>
			<section aria-label="Trang bị đang mặc">
				{doll}
				{dollStats}
			</section>
			<section aria-label="Túi đồ" className="flex min-w-0 flex-col gap-2.5">
				{bag}
				{shown ? (
					<div data-inv-card className="ui-paper border-bark p-2.5 shadow-[0_3px_0_rgb(26_17_10/0.35)]">
						{card}
					</div>
				) : (
					<div className="ui-tray p-2.5 text-note text-ink-soft">
						{emptyMsg ?? (fine ? 'Chạm một món để xem và so sánh. Món trang bị: nhấp đúp để mặc ngay, nhấp đúp ô trên người để tháo.' : 'Chạm một món để xem và so sánh với đồ đang mặc.')}
					</div>
				)}
			</section>
		</div>
	);
}

/** "+0" mờ khi chưa có gì, "+2" màu lá khi trang bị đang góp. */
function GearPlus({ n }: { n: number }) {
	return <em className={`text-[12px] not-italic ${n > 0 ? 'text-leaf' : n < 0 ? 'text-berry' : 'text-ink-faint'}`}>{n > 0 ? `+${n}` : n < 0 ? `−${-n}` : '+0'}</em>;
}

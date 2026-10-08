'use client';

import type { ReactNode, Ref } from 'react';
import { SLOT_NAME, STAT_NAME, STAT_PERCENT, type EquipSlotId, type StatKey } from '@/game/equipment';
import type { EquipSlotView, InventoryItem, PlayerStats } from '@/store/useGameStore';
import { compareLines, ItemIcon, itemSubline, RARITY_COLOR, targetSlot, type InvMode } from './invShared';

/** Động từ theo chỗ đeo: vũ khí "cầm", trang sức "đeo", còn lại "mặc". */
const verbOf = (it: InventoryItem): string => (it.equipKind === 'weapon' || it.equipKind === 'offhand' ? 'đang cầm' : it.equipKind === 'ring' || it.equipKind === 'neck' ? 'đang đeo' : 'đang mặc');

const signed = (n: number, key: StatKey): string => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n)}${STAT_PERCENT.has(key) ? '%' : ''}`;

export interface CardProps {
	mode: InvMode;
	item: InventoryItem;
	/** Rê chuột xem trước: chỉ thông tin, không nút. */
	preview: boolean;
	equipment: EquipSlotView[];
	stats: Pick<PlayerStats, 'gear' | 'gearBasis' | 'level' | 'hp' | 'hpMax'>;
	/** Túi thật đã đầy (không tính chồng ảo bình mật ong) — tháo đồ bị từ chối. */
	bagFull: boolean;
	touch: boolean;
	primaryRef: Ref<HTMLButtonElement>;
	onEquip: (uid: string, slot?: EquipSlotId) => void;
	onUnequip: (slot: EquipSlotId) => void;
	onPotion: () => void;
	onClose: () => void;
	/** Màn thấp: thẻ thay chỗ túi — chip "Túi đồ" để quay lại. */
	onBack?: () => void;
}

/**
 * Thẻ chi tiết / so sánh một món: ô 58 + tên (màu theo độ hiếm), "So với … đang cầm" + bảng "27 → 33 · +6", tác dụng,
 * mô tả, nút theo ngữ cảnh (Trang bị / Thay / Tháo / Uống) và chip Thôi. Mọi thao tác đi qua `request` — thẻ không tự sửa state.
 */
export function ItemCard({ mode, item: it, preview, equipment, stats, bagFull, touch, primaryRef, onEquip, onUnequip, onPotion, onClose, onBack }: CardProps) {
	const equippedAt = it.equippedAt ?? null;
	const big = touch ? 'h-11' : '';
	let body: ReactNode = null;
	let action: ReactNode = null;
	let note: ReactNode = null;

	if (it.kind === 'equip' && !equippedAt) {
		const slot = targetSlot(it, equipment);
		const prev = slot ? (equipment.find((e) => e.slot === slot)?.item ?? null) : null;
		const lines = compareLines(stats.gearBasis, stats.gear, it, prev);
		const lacking = (it.levelReq ?? 0) > stats.level ? `Cần cấp ${it.levelReq}` : null;
		body = (
			<>
				<p className="mt-1.5 text-note text-ink-soft">
					{prev ? (
						<>
							So với <b className="text-ink-brown">{prev.name}</b> {verbOf(prev)}:
						</>
					) : (
						`Ô ${slot ? SLOT_NAME[slot] : ''} đang trống.`
					)}
				</p>
				{lines.length ? (
					<table className="mt-1 w-full border-collapse text-[14px]">
						<tbody>
							{lines.map((l) => {
								const d = l.after - l.before;
								return (
									<tr key={l.key} className="border-t border-paper-line leading-5">
										<td className="py-0.5">{l.label}</td>
										<td className="py-0.5 text-right font-extrabold whitespace-nowrap tabular-nums">
											{l.before}
											{STAT_PERCENT.has(l.key) ? '%' : ''} → {l.after}
											{STAT_PERCENT.has(l.key) ? '%' : ''}
										</td>
										<td className={`w-[76px] py-0.5 text-right font-extrabold whitespace-nowrap tabular-nums ${d > 0 ? 'text-leaf' : d < 0 ? 'text-berry' : 'text-ink-faint'}`}>{d ? signed(d, l.key) : 'không đổi'}</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				) : (
					<p className="text-note text-ink-faint">Không cộng thêm chỉ số nào.</p>
				)}
			</>
		);
		if (slot) {
			action = (
				<button ref={primaryRef} type="button" className={`ui-btn min-w-[96px] ${big}`} disabled={!!lacking} onClick={() => onEquip(it.uid)}>
					{lacking ?? (prev ? 'Thay' : `Trang bị vào ${SLOT_NAME[slot]}`)}
				</button>
			);
			const both = it.equipKind === 'ring' && equipment.filter((e) => e.slot.startsWith('ring') && e.item).length === 2;
			note = prev ? `${prev.name} về lại túi.${both ? ' Muốn thay Nhẫn 2: bấm ô nhẫn có số 2 đang sáng.' : ''}` : null;
		}
	} else if (it.kind === 'equip' && equippedAt) {
		const own = (Object.keys(STAT_NAME) as StatKey[]).filter((k) => (it.stats?.[k] ?? 0) !== 0);
		body = (
			<>
				<p className="mt-1.5 text-note text-ink-soft">
					{verbOf(it).replace('đang ', 'Đang ')} ở ô <b className="text-ink-brown">{SLOT_NAME[equippedAt]}</b>.
				</p>
				{own.length > 0 && (
					<p className="mt-1 flex flex-wrap gap-1.5">
						{own.map((k) => (
							<span key={k} className="ui-tag border border-paper-line bg-paper-hi text-ink-brown">
								{STAT_NAME[k]} <span className="ml-1 text-leaf">{signed(it.stats![k]!, k)}</span>
							</span>
						))}
					</p>
				)}
			</>
		);
		action = (
			<button ref={primaryRef} type="button" className={`ui-btn min-w-[96px] ${big}`} disabled={bagFull} onClick={() => onUnequip(equippedAt)}>
				Tháo
			</button>
		);
		note = bagFull ? 'Túi đầy — dọn bớt rồi mới tháo được.' : it.effect ? `Tháo vẫn giữ ${it.effect.replace(/^Mở /, '')}.` : null;
	} else if (it.id === 'potion') {
		const hpFull = stats.hp >= stats.hpMax;
		body = <p className="mt-1.5 text-note text-ink-soft">Còn {it.count} bình.</p>;
		if (it.usable) {
			action = (
				<button ref={primaryRef} type="button" className={`ui-btn min-w-[96px] ${big}`} disabled={it.count <= 0 || hpFull} onClick={onPotion}>
					Uống một bình
				</button>
			);
			note = hpFull ? 'Máu đang đầy, để dành đã.' : touch ? null : (
				<>
					Phím <kbd className="ui-key">R</kbd>
				</>
			);
		}
	}

	const head = (
		<div className="flex items-center gap-2.5">
			<div className="ui-slot relative h-[57px] w-[58px] shrink-0">
				<ItemIcon item={it} />
			</div>
			<div className="min-w-0 flex-1">
				<p className="font-display text-[19px] leading-[1.25] font-extrabold" style={{ color: RARITY_COLOR[it.rarity ?? 'common'] }}>
					{it.name}
				</p>
				<p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12px] leading-[18px] font-extrabold text-ink-soft">
					<span>{itemSubline(it)}</span>
					{it.bound && <span className="ui-tag h-[18px] bg-honey px-1.5 text-amber">Kỷ vật</span>}
				</p>
			</div>
			{onBack && (
				<button type="button" className={`ui-chip ${touch ? 'min-h-11' : 'min-h-8'} shrink-0 self-start px-2`} onClick={onBack}>
					Túi đồ
				</button>
			)}
		</div>
	);

	return (
		<>
			{head}
			{body}
			{it.effect && <p className="mt-1.5 text-body font-bold text-ink-brown">{it.effect}</p>}
			<p className={`${it.effect ? 'mt-0.5' : 'mt-1.5'} text-note text-ink-soft`}>{it.desc}</p>
			{preview ? (
				<p className="mt-1.5 text-note text-ink-faint">{it.kind === 'equip' ? (equippedAt ? 'Nhấp để chọn · nhấp đúp để tháo' : 'Nhấp để chọn · nhấp đúp để mặc') : 'Nhấp để chọn'}</p>
			) : mode === 'low' ? (
				<>
					{note && <p className="mt-1 text-note text-ink-soft">{note}</p>}
					{/* Màn thấp chỉ ~250px chiều cao: hàng nút dính đáy vùng cuộn (bù đúng pb-5 của tab), ghi chú để ngoài cho hàng nút thấp. */}
					<div className="sticky -bottom-5 -mx-2.5 -mb-2.5 mt-1.5 flex items-center gap-1.5 bg-paper-hi px-2.5 pt-1.5 pb-2.5">
						{action}
						<button type="button" className={`ui-chip ${touch ? 'min-h-11' : ''}`} onClick={onClose}>
							Thôi
						</button>
					</div>
				</>
			) : (
				<div className="mt-2 flex flex-wrap items-center gap-1.5">
					{action}
					<button type="button" className={`ui-chip ${touch ? 'min-h-11' : ''}`} onClick={onClose}>
						Thôi
					</button>
					{note && <span className="min-w-[96px] flex-1 text-note text-ink-soft">{note}</span>}
				</div>
			)}
		</>
	);
}

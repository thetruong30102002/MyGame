'use client';

import { Fragment, type ReactNode, type Ref } from 'react';
import { KIND_NAME, RARITY_NAME, SLOT_NAME, STAT_KEYS, STAT_NAME, type EquipSlotId } from '@/game/equipment';
import type { EquipSlotView, InventoryItem, PlayerStats } from '@/store/useGameStore';
import { fmtNum } from '../CharacterPanelParts';
import { CELL, compareLines, fmtShown, ItemIcon, KIND_TEXT, RARITY_COLOR, rarityClass, signedStat, slotText, softTag, targetSlot, type CompareLine, type InvMode } from './invShared';

/** Động từ theo chỗ đeo: vũ khí "cầm", trang sức "đeo", còn lại "mặc". */
const verbOf = (it: InventoryItem): string => (it.equipKind === 'weapon' || it.equipKind === 'offhand' ? 'đang cầm' : it.equipKind === 'ring' || it.equipKind === 'neck' ? 'đang đeo' : 'đang mặc');

const tone = (n: number): string => (n > 0 ? 'text-leaf' : n < 0 ? 'text-berry' : 'text-ink-faint');

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

/** Bảng "trước → sau · chênh" (số trên bảng nhân vật, đã nhân hệ số con đường) — dùng cho cả mặc vào lẫn tháo ra. */
function CompareTable({ lines }: { lines: CompareLine[] }) {
	return (
		<table className="mt-0.5 w-full border-collapse text-[14px]">
			<tbody>
				{lines.map((l) => {
					const d = l.after - l.before;
					return (
						<tr key={l.key} className="border-t border-line-soft/70 leading-5">
							<td className="py-0.5">{l.label}</td>
							<td className="py-0.5 text-right font-extrabold whitespace-nowrap tabular-nums">
								{fmtShown(l.key, l.before)} → {fmtShown(l.key, l.after)}
							</td>
							<td className={`w-[76px] py-0.5 text-right font-extrabold whitespace-nowrap tabular-nums ${tone(d)}`}>{d ? signedStat(d, l.key) : 'không đổi'}</td>
						</tr>
					);
				})}
			</tbody>
		</table>
	);
}

/** Bảng thông tin "nhãn: giá trị" — thẻ rộng (≥ 28rem) xếp 2 cặp mỗi hàng, thẻ hẹp (sheet điện thoại) 1 cặp. */
function Facts({ rows }: { rows: [string, ReactNode][] }) {
	return (
		<dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-0.5 border-y border-line-soft/70 py-1.5 text-[13px] leading-[20px] @md:grid-cols-[auto_minmax(0,1fr)_auto_minmax(0,1fr)]">
			{rows.map(([k, v]) => (
				<Fragment key={k}>
					<dt className="font-bold whitespace-nowrap text-ink-soft">{k}</dt>
					<dd className="min-w-0 font-extrabold text-ink-brown">{v}</dd>
				</Fragment>
			))}
		</dl>
	);
}

/**
 * Thẻ chi tiết một món: ô mềm 58 phớt màu độ hiếm + tên (màu độ hiếm) + nhãn bậc / Kỷ vật / Đang mặc (viên phớt màu, không
 * viền); bảng thông tin (loại, ô mặc, yêu cầu cấp — đủ hay thiếu, ràng buộc); thuộc tính tự thân của món ("Tấn công +6"); so
 * sánh trên bảng nhân vật (món trong túi: "So với … đang cầm" 27 → 33 · +6; món đang mặc: "Nếu tháo ra"); tác dụng, mô tả;
 * nút hổ phách theo ngữ cảnh (Trang bị / Thay / Tháo / Uống — `.inv-btn`) và chip Thôi. Mọi thao tác đi qua `request` — thẻ
 * không tự sửa state.
 */
export function ItemCard({ mode, item: it, preview, equipment, stats, bagFull, touch, primaryRef, onEquip, onUnequip, onPotion, onClose, onBack }: CardProps) {
	const equippedAt = it.equippedAt ?? null;
	const big = touch ? 'h-11' : '';
	const color = RARITY_COLOR[it.rarity ?? 'common'];
	const lacking = (it.levelReq ?? 0) > stats.level;
	const facts: [string, ReactNode][] = [];
	let compare: ReactNode = null;
	let action: ReactNode = null;
	let note: ReactNode = null;

	// Loại đồ đã in ở dòng phụ dưới tên — bảng thông tin không lặp lại.
	if (it.kind === 'equip') {
		facts.push([equippedAt ? 'Đang ở ô' : 'Ô mặc', equippedAt ? SLOT_NAME[equippedAt] : slotText(it.equipKind) || '—']);
		facts.push([
			'Yêu cầu',
			it.levelReq ? <span className={lacking ? 'text-berry' : 'text-leaf'}>{lacking ? `Cấp ${it.levelReq} · thiếu ${it.levelReq - stats.level} cấp` : `Cấp ${it.levelReq} · đã đủ`}</span> : 'Mọi cấp',
		]);
		facts.push(['Ràng buộc', it.bound ? <span className="text-amber">Kỷ vật · không bán, không vứt</span> : 'Không']);
	} else {
		if (it.id === 'potion') {
			facts.push(['Còn lại', `${fmtNum(it.count)} bình`]);
			// Chồng ảo dựng từ `player.potions` — không tính vào sức chứa túi (`bagUsed`).
			facts.push(['Trong túi', 'Không chiếm ô']);
			if (!touch) facts.push(['Phím tắt', <kbd key="r" className="ui-key border border-[rgb(122_85_52/0.35)] bg-cream text-ink-brown">R</kbd>]);
		} else if (it.count > 1) facts.push(['Số lượng', fmtNum(it.count)]);
	}

	const own = STAT_KEYS.filter((k) => (it.stats?.[k] ?? 0) !== 0);
	const attrs =
		it.kind === 'equip' ? (
			<div className="mt-2">
				<p className="text-[12px] leading-[18px] font-bold text-ink-soft">Thuộc tính của món</p>
				{own.length ? (
					<p className="mt-0.5 flex flex-wrap gap-1">
						{own.map((k) => (
							<span key={k} className="ui-tag h-6 bg-[rgb(122_85_52/0.09)] px-2.5 text-ink-brown">
								{STAT_NAME[k]} <b className={`ml-1 ${tone(it.stats![k]!)}`}>{signedStat(it.stats![k]!, k)}</b>
							</span>
						))}
					</p>
				) : (
					<p className="text-note text-ink-faint">Không cộng chỉ số nào.</p>
				)}
			</div>
		) : null;

	if (it.kind === 'equip' && !equippedAt) {
		const slot = targetSlot(it, equipment);
		const prev = slot ? (equipment.find((e) => e.slot === slot)?.item ?? null) : null;
		const lines = compareLines(stats.gearBasis, stats.gear, it, prev);
		compare = (
			<div className="mt-2">
				<p className="text-note text-ink-soft">
					{prev ? (
						<>
							So với{' '}
							<b className="font-extrabold" style={{ color: RARITY_COLOR[prev.rarity ?? 'common'] }}>
								{prev.name}
							</b>{' '}
							{verbOf(prev)}:
						</>
					) : (
						`Ô ${slot ? SLOT_NAME[slot] : ''} đang trống — mặc vào thì:`
					)}
				</p>
				{lines.length ? <CompareTable lines={lines} /> : <p className="text-note text-ink-faint">Bảng chỉ số không đổi.</p>}
			</div>
		);
		if (slot) {
			action = (
				<button ref={primaryRef} type="button" className={`inv-btn min-w-[96px] ${big}`} disabled={lacking} onClick={() => onEquip(it.uid)}>
					{lacking ? `Cần cấp ${it.levelReq}` : prev ? 'Thay' : `Trang bị vào ${SLOT_NAME[slot]}`}
				</button>
			);
			const both = it.equipKind === 'ring' && equipment.filter((e) => e.slot.startsWith('ring') && e.item).length === 2;
			note = prev ? `${prev.name} về lại túi.${both ? ' Muốn thay Nhẫn 2: bấm ô Nhẫn 2 đang sáng.' : ''}` : null;
		}
	} else if (it.kind === 'equip' && equippedAt) {
		const lines = compareLines(stats.gearBasis, stats.gear, null, it);
		if (lines.length) {
			compare = (
				<div className="mt-2">
					<p className="text-note text-ink-soft">Nếu tháo ra:</p>
					<CompareTable lines={lines} />
				</div>
			);
		}
		action = (
			<button ref={primaryRef} type="button" className={`inv-btn min-w-[96px] ${big}`} disabled={bagFull} onClick={() => onUnequip(equippedAt)}>
				Tháo
			</button>
		);
		note = bagFull ? 'Túi đầy — dọn bớt rồi mới tháo được.' : it.effect ? `Tháo vẫn giữ ${it.effect.replace(/^Mở /, '')}.` : null;
	} else if (it.id === 'potion') {
		const hpFull = stats.hp >= stats.hpMax;
		if (it.usable) {
			action = (
				<button ref={primaryRef} type="button" className={`inv-btn min-w-[96px] ${big}`} disabled={it.count <= 0 || hpFull} onClick={onPotion}>
					Uống một bình
				</button>
			);
			note = hpFull ? 'Máu đang đầy, để dành đã.' : it.count <= 0 ? 'Đã hết bình.' : null;
		}
	}

	const head = (
		<div className="flex items-center gap-2.5">
			<div data-full="" className={`${CELL} ${rarityClass(it.rarity)}`}>
				<ItemIcon item={it} />
			</div>
			<div className="min-w-0 flex-1">
				<p className="font-display text-[19px] leading-[1.25] font-extrabold" style={{ color }}>
					{it.name}
				</p>
				<p className="mt-0.5 flex flex-wrap items-center gap-1">
					{it.rarity && (
						<span className="ui-tag h-5 px-2" style={softTag(color!)}>
							{RARITY_NAME[it.rarity]}
						</span>
					)}
					<span className="text-[12px] leading-[18px] font-extrabold text-ink-soft">{it.equipKind ? KIND_NAME[it.equipKind] : KIND_TEXT[it.kind]}</span>
					{equippedAt && <span className="ui-tag h-5 bg-[#dcebd0] px-2 text-leaf">{verbOf(it).replace('đang ', 'Đang ')}</span>}
					{it.bound && <span className="ui-tag h-5 bg-honey px-2 text-amber">Kỷ vật</span>}
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
		<div className="@container">
			{head}
			{facts.length > 0 && <Facts rows={facts} />}
			{attrs}
			{compare}
			{it.effect && (
				<p className="mt-2 text-body font-bold text-ink-brown">
					<span className="text-ink-soft">Tác dụng: </span>
					{it.effect}
				</p>
			)}
			<p className={`${it.effect ? 'mt-1' : 'mt-2'} border-l-2 border-line-soft pl-2.5 text-note text-ink-soft`}>{it.desc}</p>
			{preview ? (
				<p className="mt-1.5 text-note text-ink-faint">{it.kind === 'equip' ? (equippedAt ? 'Nhấp để chọn · nhấp đúp để tháo' : 'Nhấp để chọn · nhấp đúp để mặc') : 'Nhấp để chọn'}</p>
			) : mode === 'low' ? (
				<>
					{note && <p className="mt-1 text-note text-ink-soft">{note}</p>}
					{/* Màn thấp chỉ ~250px chiều cao: hàng nút dính đáy vùng cuộn (bù đúng pb-5 của tab), ghi chú để ngoài cho hàng nút thấp. */}
					<div className="sticky -bottom-5 -mx-2.5 -mb-2.5 mt-1.5 flex items-center gap-1.5 rounded-b-[13px] bg-paper-hi px-2.5 pt-1.5 pb-2.5">
						{action}
						<button type="button" className={`ui-chip ${touch ? 'min-h-11' : ''}`} onClick={onClose}>
							Thôi
						</button>
					</div>
				</>
			) : (
				<div className="mt-2.5 flex flex-wrap items-center gap-1.5">
					{action}
					<button type="button" className={`ui-chip ${touch ? 'min-h-11' : ''}`} onClick={onClose}>
						Thôi
					</button>
					{note && <span className="min-w-[96px] flex-1 text-note text-ink-soft">{note}</span>}
				</div>
			)}
		</div>
	);
}

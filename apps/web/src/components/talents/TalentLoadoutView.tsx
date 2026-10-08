'use client';

import { useState } from 'react';
import { BRANCHES, SKILL_NODE } from '@/game/combat/talents';
import { useGameStore, type BranchId, type EnchantView, type TalentsView } from '@/store/useGameStore';
import { ELEMENT_STYLE } from '../SkillBar';
import { SkillIcon } from '../SkillIcon';
import { BranchIcon } from './TalentArt';

/** Icon kỹ năng mốc 1 của từng nguyên tố — dùng cho chip phủ phép (Thổ: icon tạm của Đá Văng). */
const ELEMENT_ICON: Partial<Record<string, string>> = { fire: 'fire_bolt', water: 'water_lance', wind: 'wind_blade', ice: 'ice_shard', earth: 'rock_throw' };

/** Phủ phép Kiếm: chọn một nguyên tố (hoặc tắt). Chưa đủ điều kiện thì chip mờ và ghi điều kiện. */
function EnchantPanel({ e, onPick }: { e: EnchantView; onPick: (id: EnchantView['current']) => void }) {
	const cooling = e.cooldown > 0;
	return (
		<section className="rounded-[8px] border-2 border-paper-line p-3">
			<p className="font-display text-label font-extrabold">Phủ phép Kiếm</p>
			<p className="text-note text-ink-soft">Mọi đòn Kiếm mang hệ nguyên tố và gây phản ứng như phép. Một hệ mỗi lúc, đổi có hồi 10 giây.</p>
			<div className="mt-2 flex flex-wrap gap-2">
				<button type="button" className="ui-chip" aria-pressed={e.current === null} disabled={e.current === null} onClick={() => onPick(null)}>
					Không phủ
				</button>
				{e.options.map((o) => (
					<button
						key={o.id}
						type="button"
						className="ui-chip flex-col items-start gap-0 py-1"
						aria-pressed={e.current === o.id}
						disabled={!o.ok || (cooling && e.current !== o.id)}
						title={o.ok ? o.name : `Cần ${o.need}`}
						onClick={() => onPick(o.id)}
					>
						<span className="flex items-center gap-1.5">
							{ELEMENT_ICON[o.id] && <SkillIcon skillId={ELEMENT_ICON[o.id]!} box={20} />}
							{o.name}
						</span>
						{o.ok ? <span className="max-w-[220px] text-left text-[12px] text-ink-soft">{o.desc}</span> : <span className="text-[12px] font-bold text-ink-faint">Cần {o.need}</span>}
					</button>
				))}
			</div>
			{cooling && <p className="mt-1.5 text-note font-bold text-amber tabular-nums">Đổi phủ phép được sau {e.cooldown} giây.</p>}
		</section>
	);
}

/** Nhánh của một kỹ năng đã học (kiếm pháp thuộc Kiếm; Tia Aether bẩm sinh = 'aether'). */
const schoolOf = (id: string): BranchId | 'aether' => SKILL_NODE[id]?.branch ?? 'aether';

/**
 * Gán kỹ năng vào thanh 10 ô (giữ NGUYÊN luật cũ): bấm một kỹ năng (trong danh sách HOẶC trong ô) rồi bấm ô đích — kỹ
 * năng đã có ở ô khác thì hai ô đổi chỗ. Chạm được trên điện thoại (không kéo-thả). Ô đá giữ đúng cỡ gốc 58×57 (co giãn là
 * vân viền nhoè): 1×10 khi đủ chỗ, 2×5 trên điện thoại / màn hẹp. Máy dưới ~375px không đủ 5×58 = 290px (lòng tab 256 ở
 * 320px): lưới `auto-fill` tự xuống 4 cột thay vì đẩy cột 5 (ô 3 / ô 8) ra ngoài khung mà không vuốt ngang được. Lề trái
 * 10 chừa chỗ cho chip phím lòi −10px; lề phải 6 để 375px vẫn đủ 5 cột. Kỹ năng đã học nhóm theo nhánh.
 */
function LoadoutPanel({ t, touch, wide, initialHeld }: { t: TalentsView; touch: boolean; wide: boolean; initialHeld: string | null }) {
	const request = useGameStore((st) => st.request);
	const [held, setHeld] = useState<{ id: string; slot: number | null } | null>(() =>
		initialHeld && t.learned.some((s) => s.id === initialHeld) ? { id: initialHeld, slot: t.loadout.find((x) => x.skillId === initialHeld)?.slot ?? null } : null,
	);
	const name = (id: string) => t.learned.find((s) => s.id === id)?.name ?? id;
	const color = (id: string) => ELEMENT_STYLE[t.learned.find((s) => s.id === id)?.element ?? 'aether']?.color;
	const tapSlot = (slot: number, skillId: string | null): void => {
		if (held) {
			if (held.slot !== slot) request('set_slot', { slot, skillId: held.id });
			setHeld(null);
		} else if (skillId) setHeld({ id: skillId, slot });
	};
	const groups: { key: BranchId | 'aether'; label: string; skills: TalentsView['learned'] }[] = [
		...BRANCHES.map((b) => ({ key: b as BranchId, label: t.branches.find((x) => x.branch === b)?.name ?? b, skills: t.learned.filter((s) => schoolOf(s.id) === b) })),
		{ key: 'aether' as const, label: 'Bẩm sinh', skills: t.learned.filter((s) => schoolOf(s.id) === 'aether') },
	].filter((g) => g.skills.length > 0);
	return (
		<section className={`rounded-[8px] border-2 border-paper-line ${wide ? 'p-3' : 'py-3 pr-1.5 pl-2.5'}`}>
			<p className="font-display text-label font-extrabold">Gán vào ô</p>
			<p className="text-note text-ink-soft">
				{held
					? `Đang cầm “${name(held.id)}” — bấm ô muốn đặt${held.slot !== null ? ' (ô đang có kỹ năng thì hai ô đổi chỗ)' : ''}.`
					: `Bấm một kỹ năng rồi bấm ô để gán${touch ? '' : ` — phím ${t.loadout.map((s) => s.key).join(', ')}`}. Bị động không chiếm ô.`}
			</p>
			<div className={`mt-4 grid gap-y-4 ${wide ? 'grid-cols-[repeat(10,58px)] justify-between' : 'grid-cols-[repeat(auto-fill,58px)] justify-between'}`}>
				{t.loadout.map((s) => (
					<button
						key={s.slot}
						type="button"
						onClick={() => tapSlot(s.slot, s.skillId)}
						aria-label={`Ô ${s.key}: ${s.skillId ? name(s.skillId) : 'trống'}`}
						className={`ui-slot relative flex h-[57px] w-[58px] items-center justify-center ${held && held.slot === s.slot ? 'brightness-125' : held ? 'tt-target hover:brightness-125' : ''}`}
					>
						{s.skillId && <SkillIcon skillId={s.skillId} box={30} />}
						<span
							className="absolute -left-[10px] -top-[11px] flex h-5 min-w-5 items-center justify-center rounded-[5px] border-2 border-outline px-1 text-chip font-extrabold leading-none text-ink-brown"
							style={{ background: s.skillId ? color(s.skillId) : 'var(--color-parchment)' }}
						>
							{s.key}
						</span>
					</button>
				))}
			</div>
			<div className="mt-3 flex flex-col gap-2">
				{groups.map((g) => (
					<div key={g.key} className="flex flex-wrap items-center gap-2">
						<span className="flex min-w-[76px] items-center gap-1.5 text-note font-extrabold text-ink-soft">
							{g.key === 'aether' ? <SkillIcon skillId="aether_bolt" box={20} /> : <BranchIcon branch={g.key} iconSkill={t.branches.find((x) => x.branch === g.key)?.iconSkill ?? null} box={20} />}
							{g.label}
						</span>
						{g.skills.map((s) => (
							<button key={s.id} type="button" className="ui-chip" aria-pressed={held?.id === s.id} onClick={() => setHeld(held?.id === s.id ? null : { id: s.id, slot: t.loadout.find((x) => x.skillId === s.id)?.slot ?? null })}>
								<SkillIcon skillId={s.id} box={20} />
								{s.name}
								{!t.loadout.some((x) => x.skillId === s.id) && <span className="text-[12px] text-ink-faint">(chưa gán)</span>}
							</button>
						))}
					</div>
				))}
				{held && (
					<div className="flex flex-wrap gap-2">
						{held.slot !== null && (
							<button
								type="button"
								className="ui-chip ui-chip-danger"
								onClick={() => {
									request('set_slot', { slot: held.slot!, skillId: null });
									setHeld(null);
								}}
							>
								Gỡ khỏi ô {t.loadout[held.slot]?.key}
							</button>
						)}
						<button type="button" className="ui-chip" onClick={() => setHeld(null)}>
							Thôi
						</button>
					</div>
				)}
			</div>
		</section>
	);
}

/** Chế độ "Gán ô · Phủ phép" (đặc tả cây 1.5): chuyển NGUYÊN hai khối cũ, logic `set_slot` / `set_enchant` không đổi. */
export function TalentLoadoutView({ t, touch, wide, initialHeld }: { t: TalentsView; touch: boolean; wide: boolean; initialHeld: string | null }) {
	const request = useGameStore((st) => st.request);
	return (
		<div className="flex flex-col gap-3">
			{t.loadout.length > 0 ? <LoadoutPanel t={t} touch={touch} wide={wide} initialHeld={initialHeld} /> : <p className="text-body text-ink-soft">Chưa có kỹ năng nào để gán.</p>}
			{t.enchant.options.length > 0 && <EnchantPanel e={t.enchant} onPick={(enchant) => request('set_enchant', { enchant })} />}
		</div>
	);
}

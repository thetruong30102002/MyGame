'use client';

import { useState } from 'react';
import { BRANCHES, ENCHANT_ELEMENT_TIER, ENCHANT_SWAP_SECONDS, ENCHANT_SWORD_TIER, SKILL_NODE } from '@/game/combat/talents';
import { useGameStore, type BranchId, type EnchantView, type TalentsView } from '@/store/useGameStore';
import { ELEMENT_STYLE } from '../SkillBar';
import { SkillIcon } from '../SkillIcon';
import { BranchIcon } from './TalentArt';
import { skillSheet, statLine } from './talentInfo';
import { ELEMENT_ICON } from './TalentOverview';
import { BRANCH_FILL, TierPips } from './TalentParts';

/**
 * Phủ phép Kiếm: chọn một nguyên tố (hoặc tắt). Mỗi hệ một thẻ — icon, tên, nhãn trạng thái (đang phủ / phủ được / chưa
 * đủ), phủ làm gì ở mốc nguyên tố hiện tại, và khi chưa đủ thì hai thanh mốc Kiếm / nguyên tố tới điều kiện.
 */
function EnchantPanel({ t, e, onPick }: { t: TalentsView; e: EnchantView; onPick: (id: EnchantView['current']) => void }) {
	const cooling = e.cooldown > 0;
	const tierOf = (b: BranchId): number => t.branches.find((x) => x.branch === b)?.tier ?? 0;
	return (
		<section className="rounded-[8px] border-2 border-paper-line p-3">
			<div className="flex flex-wrap items-start gap-x-3 gap-y-1.5">
				<div className="min-w-[200px] flex-1">
					<p className="font-display text-label font-extrabold">Phủ phép Kiếm</p>
					<p className="text-note text-ink-soft">Mọi đòn Kiếm mang hệ nguyên tố và gây phản ứng như phép. Một hệ mỗi lúc, đổi có hồi {ENCHANT_SWAP_SECONDS} giây. Mốc 7 của hệ làm phủ phép mạnh hơn.</p>
				</div>
				<button type="button" className="ui-chip shrink-0" aria-pressed={e.current === null} disabled={e.current === null} onClick={() => onPick(null)}>
					Không phủ
				</button>
			</div>
			<div className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-2">
				{e.options.map((o) => {
					const on = e.current === o.id;
					const sw = tierOf('sword');
					const el = tierOf(o.id);
					return (
						<button
							key={o.id}
							type="button"
							className={`flex min-w-0 flex-col gap-1 rounded-[8px] border-2 px-2 py-1.5 text-left ${on ? 'border-[#8a4a0a] bg-honey shadow-[0_2px_0_#8a4a0a]' : o.ok ? 'border-bark bg-paper-hi shadow-[0_2px_0_var(--color-bark)] hover:bg-[#fff8e8]' : 'border-paper-line bg-paper'} disabled:cursor-default`}
							style={{ borderLeftWidth: 5, borderLeftColor: BRANCH_FILL[o.id] }}
							aria-pressed={on}
							disabled={!o.ok || (cooling && !on)}
							title={o.ok ? o.name : `Cần ${o.need}`}
							onClick={() => onPick(o.id)}
						>
							<span className="flex items-center gap-1.5">
								<span className={`flex h-6 w-6 shrink-0 items-center justify-center ${o.ok ? '' : 'opacity-60 grayscale'}`}>{ELEMENT_ICON[o.id] && <SkillIcon skillId={ELEMENT_ICON[o.id]!} box={22} />}</span>
								<b className={`min-w-0 flex-1 truncate text-[14px] ${o.ok ? 'text-ink-brown' : 'text-ink-faint'}`}>{o.name}</b>
								<span className={`ui-tag h-5 shrink-0 px-1.5 text-[11px] ${on ? 'bg-leaf text-paper-hi' : o.ok ? 'border-2 border-bark text-ink-brown' : 'bg-paper-sunk text-ink-faint'}`}>{on ? 'Đang phủ' : o.ok ? 'Phủ được' : 'Chưa đủ'}</span>
							</span>
							{o.ok ? (
								<span className="text-[12px] leading-4 text-ink-soft">{o.desc}</span>
							) : (
								<span className="flex flex-col gap-1 text-[12px] leading-4 text-ink-faint">
									<span>Cần {o.need}</span>
									<span className="flex items-center gap-1.5">
										<span className="w-11 shrink-0 font-bold">Kiếm</span>
										<TierPips tier={sw} cap={10} branch="sword" target={ENCHANT_SWORD_TIER} size="sm" />
									</span>
									<span className="flex items-center gap-1.5">
										<span className="w-11 shrink-0 font-bold">{o.name.replace('Kiếm ', '')}</span>
										<TierPips tier={el} cap={10} branch={o.id} target={ENCHANT_ELEMENT_TIER} size="sm" locked={el === 0} />
									</span>
								</span>
							)}
						</button>
					);
				})}
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
 * 10 chừa chỗ cho chip phím lòi −10px; lề phải 6 để 375px vẫn đủ 5 cột. Dưới mỗi ô là tên kỹ năng đang gán; kỹ năng đã
 * học nhóm theo nhánh, chip ghi ô đang ở, rê chuột xem MP · hồi chiêu · uy lực.
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
	const used = t.loadout.filter((s) => s.skillId).length;
	const hint = (id: string): string => {
		const sk = skillSheet(t, id);
		return sk ? `${name(id)} — ${statLine(sk)}` : name(id);
	};
	return (
		<section className={`rounded-[8px] border-2 border-paper-line ${wide ? 'p-3' : 'py-3 pr-1.5 pl-2.5'}`}>
			<p className="flex flex-wrap items-baseline gap-x-2">
				<span className="whitespace-nowrap font-display text-label font-extrabold">Thanh 10 ô</span>
				<span className="text-note text-ink-soft tabular-nums">
					đã gán {used}/{t.loadout.length} · học {t.learned.length} kỹ năng chủ động
				</span>
			</p>
			<p className={`text-note ${held ? 'font-bold text-amber' : 'text-ink-soft'}`}>
				{held
					? `Đang cầm “${name(held.id)}” — bấm ô muốn đặt${held.slot !== null ? ' (ô đang có kỹ năng thì hai ô đổi chỗ)' : ''}.`
					: `Bấm một kỹ năng rồi bấm ô để gán${touch ? '' : ` — phím ${t.loadout.map((s) => s.key).join(', ')}`}. Bị động không chiếm ô.`}
			</p>
			<div className={`mt-4 grid gap-y-2 ${wide ? 'grid-cols-[repeat(10,58px)] justify-between' : 'grid-cols-[repeat(auto-fill,58px)] justify-between'}`}>
				{t.loadout.map((s) => (
					<div key={s.slot} className="flex w-[58px] flex-col items-center gap-0.5">
						<button
							type="button"
							onClick={() => tapSlot(s.slot, s.skillId)}
							aria-label={`Ô ${s.key}: ${s.skillId ? name(s.skillId) : 'trống'}`}
							title={s.skillId ? hint(s.skillId) : 'Ô trống'}
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
						<span className={`w-full truncate text-center text-[11px] font-bold leading-[14px] ${s.skillId ? 'text-ink-brown' : 'text-ink-faint'}`}>{s.skillId ? name(s.skillId) : 'trống'}</span>
					</div>
				))}
			</div>
			<div className="mt-3 flex flex-col gap-2 border-t-2 border-paper-line pt-2.5">
				{groups.map((g) => (
					<div key={g.key} className="flex flex-wrap items-center gap-2">
						<span className="flex min-w-[76px] items-center gap-1.5 text-note font-extrabold text-ink-soft">
							{g.key === 'aether' ? <SkillIcon skillId="aether_bolt" box={20} /> : <BranchIcon branch={g.key} iconSkill={t.branches.find((x) => x.branch === g.key)?.iconSkill ?? null} box={20} />}
							{g.label}
						</span>
						{g.skills.map((s) => {
							const at = t.loadout.find((x) => x.skillId === s.id);
							return (
								<button key={s.id} type="button" className="ui-chip" title={hint(s.id)} aria-pressed={held?.id === s.id} onClick={() => setHeld(held?.id === s.id ? null : { id: s.id, slot: at?.slot ?? null })}>
									<SkillIcon skillId={s.id} box={20} />
									{s.name}
									{at ? <kbd className="ui-key h-[18px] min-w-[18px] px-1 text-[11px]">{at.key}</kbd> : <span className="text-[12px] text-ink-faint">(chưa gán)</span>}
								</button>
							);
						})}
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

/** Chế độ "Gán ô · Phủ phép" (đặc tả cây 1.5): thanh 10 ô + phủ phép, logic `set_slot` / `set_enchant` không đổi. */
export function TalentLoadoutView({ t, touch, wide, initialHeld }: { t: TalentsView; touch: boolean; wide: boolean; initialHeld: string | null }) {
	const request = useGameStore((st) => st.request);
	return (
		<div className="flex flex-col gap-3">
			{t.loadout.length > 0 ? <LoadoutPanel t={t} touch={touch} wide={wide} initialHeld={initialHeld} /> : <p className="text-body text-ink-soft">Chưa có kỹ năng nào để gán.</p>}
			{t.enchant.options.length > 0 && <EnchantPanel t={t} e={t.enchant} onPick={(enchant) => request('set_enchant', { enchant })} />}
		</div>
	);
}

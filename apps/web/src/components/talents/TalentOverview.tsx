'use client';

import { ENCHANT_ELEMENT_TIER, ENCHANT_SWORD_TIER, REACTION_PER_TIER, SWORD_ART_TIER, SWORD_STYLE_INFO } from '@/game/combat/talents';
import type { BranchId, TalentsView } from '@/store/useGameStore';
import { LockGlyph, SkillIcon } from '../SkillIcon';
import { BranchIcon, EnchantEmptyIcon } from './TalentArt';
import { reactionRows } from './talentInfo';
import { BRANCH_INK, TierPips } from './TalentParts';
import { nextSteps, nodeKey, nodeState, artKey, styleKey } from './treeLayout';

/** Icon kỹ năng mốc 1 của từng nguyên tố — dùng cho dòng phủ phép (Thổ: icon tạm của Đá Văng). */
export const ELEMENT_ICON: Partial<Record<BranchId, string>> = { fire: 'fire_bolt', water: 'water_lance', wind: 'wind_blade', ice: 'ice_shard', earth: 'rock_throw' };

/** Nút "mặt tiền" của một nhánh để chọn khi bấm dòng nhánh: nấc kế (nếu có), không thì mốc cao nhất đã đạt, khoá thì mốc 1. */
function frontKey(t: TalentsView, b: BranchId): string {
	const step = nextSteps(t).find((s) => s.branch === b);
	if (step) return step.key;
	const br = t.branches.find((x) => x.branch === b);
	const tier = Math.max(1, br?.tier ?? 1);
	if (b === 'sword' && br?.style && tier >= (br.styleTier ?? 3)) return styleKey(br.style, tier);
	return nodeKey(b, Math.min(tier, b === 'sword' && !br?.style ? 2 : tier));
}

/**
 * Tổng quan khi chưa chọn nút (đặc tả làm lại 09/10/2026): "Học được ngay" do bên gọi đặt trên cùng, rồi ba khối — CÁC
 * NHÁNH (thanh 10 mốc màu hệ, mốc/thưởng chiều sâu, lý do khoá), PHẢN ỨNG song hệ đang có (+5% mỗi mốc của hệ yếu hơn) và
 * PHỦ PHÉP · KIẾM PHÁP (đang phủ gì, đã lĩnh ngộ mấy đòn). Bấm dòng nhánh = chọn nút mặt tiền của nhánh trên cây. `build`: thêm
 * khối LỐI TU LUYỆN (điện thoại / màn thấp — dải đầu ở đó không đủ chỗ ghi).
 */
export function TalentOverview({ t, build = false, onSelect, onLoadout }: { t: TalentsView; build?: boolean; onSelect: (key: string) => void; onLoadout: () => void }) {
	const reactions = reactionRows(t);
	const live = reactions.filter((r) => r.pct > 0);
	const cur = t.enchant.current ? t.enchant.options.find((o) => o.id === t.enchant.current) : null;
	const canAny = t.enchant.options.some((o) => o.ok);
	const learnedArts = t.arts.filter((a) => a.learned).length;
	const name = (b: BranchId): string => t.branches.find((x) => x.branch === b)?.name ?? b;
	return (
		<div className="flex flex-col gap-3">
			{build && (
				<section className="flex flex-col gap-0.5" aria-label="Lối tu luyện">
					<p className="flex items-baseline gap-1.5">
						<span className="tt-kicker">Lối tu luyện</span>
						<b className="font-display text-[16px] leading-5 text-ink-brown">{t.buildLabel}</b>
					</p>
					<p className="text-[12px] leading-4 text-ink-soft">{t.buildDetail}</p>
				</section>
			)}
			<section className="flex flex-col gap-1" aria-label="Các nhánh">
				<p className="tt-kicker">Các nhánh · mốc 1–10</p>
				<ul className="flex flex-col">
					{t.branches.map((b) => {
						const style = b.branch === 'sword' && b.style ? SWORD_STYLE_INFO[b.style].name : '';
						return (
							<li key={b.branch} className="border-b-2 border-paper-line/70 last:border-b-0">
								<button type="button" className="flex w-full items-center gap-2 py-1 text-left hover:bg-paper-sunk/40" onClick={() => onSelect(frontKey(t, b.branch))} title={b.unlocked ? `${b.name} mốc ${b.tier}/${b.maxTier} — xem nấc kế trên cây` : b.lockNote}>
									<span className={`flex h-6 w-6 shrink-0 items-center justify-center ${b.unlocked ? '' : 'opacity-60 grayscale'}`}>{b.unlocked ? <BranchIcon branch={b.branch} iconSkill={b.iconSkill} box={22} /> : <LockGlyph size={18} />}</span>
									<span className="flex min-w-0 flex-1 flex-col gap-0.5">
										<span className="flex items-baseline gap-1.5 leading-4">
											<b className="text-[13px]" style={{ color: b.unlocked ? BRANCH_INK[b.branch] : undefined }}>
												{b.name}
											</b>
											{style && <span className="truncate text-[12px] font-bold text-ink-soft">{style}</span>}
											<span className="ml-auto shrink-0 text-[12px] font-bold text-ink-soft tabular-nums">
												{b.unlocked ? (
													<>
														<b className="text-ink-brown">{b.tier}</b>/{b.maxTier}
														{b.bonusPct > 0 && <b className="ml-1 text-amber">+{b.bonusPct}%</b>}
													</>
												) : (
													'khoá'
												)}
											</span>
										</span>
										{b.unlocked ? <TierPips tier={b.tier} cap={b.cap} branch={b.branch} size="sm" /> : <span className="line-clamp-2 text-[12px] leading-4 text-ink-faint">{b.lockNote}</span>}
									</span>
								</button>
							</li>
						);
					})}
				</ul>
			</section>

			<section className="flex flex-col gap-1" aria-label="Phản ứng nguyên tố">
				<p className="tt-kicker">Phản ứng song hệ</p>
				{live.length ? (
					<ul className="flex flex-col gap-0.5">
						{live.map((r) => (
							<li key={r.id} className="flex items-baseline gap-1.5 text-note leading-[18px]">
								<b className="text-ink-brown">{r.name}</b>
								<span className="truncate text-[12px] text-ink-soft">
									{name(r.a)} + {name(r.b)}
								</span>
								<b className="ml-auto shrink-0 text-amber tabular-nums">+{r.pct}%</b>
							</li>
						))}
					</ul>
				) : (
					<p className="text-[12px] leading-4 text-ink-soft">Hai hệ cùng từ mốc 2 thì phản ứng giữa chúng mạnh thêm {Math.round(REACTION_PER_TIER * 100)}% mỗi mốc của hệ yếu hơn.</p>
				)}
				{reactions.length > live.length && (
					<p className="text-[12px] leading-4 text-ink-faint">
						Chưa có thưởng: {reactions
							.filter((r) => r.pct === 0)
							.map((r) => r.name)
							.join(', ')}
					</p>
				)}
			</section>

			<section className="flex flex-col gap-1.5" aria-label="Phủ phép và kiếm pháp">
				<p className="tt-kicker">Phủ phép · kiếm pháp</p>
				<div className="flex items-center gap-2 text-note leading-[18px]">
					<span className="flex h-6 w-6 shrink-0 items-center justify-center">{cur && ELEMENT_ICON[cur.id] ? <SkillIcon skillId={ELEMENT_ICON[cur.id]!} box={22} /> : <EnchantEmptyIcon box={22} />}</span>
					<span className="min-w-0">
						<b className="block text-ink-brown">{cur ? cur.name : canAny ? 'Chưa phủ phép' : 'Chưa phủ được'}</b>
						<span className="block text-[12px] leading-4 text-ink-soft">{cur ? cur.desc : canAny ? 'Có hệ phủ được — chọn ở Gán ô · Phủ phép.' : `Cần Kiếm mốc ${ENCHANT_SWORD_TIER} + một nguyên tố mốc ${ENCHANT_ELEMENT_TIER}.`}</span>
					</span>
				</div>
				<div className="grid grid-cols-5 gap-1">
					{t.arts.map((a) => {
						const st = nodeState(t, artKey(a.element));
						return (
							<button key={a.element} type="button" className="flex min-w-0 flex-col items-center gap-0.5 rounded-[6px] py-0.5 hover:bg-paper-sunk/50" onClick={() => onSelect(artKey(a.element))} title={`${a.name} — ${a.learned ? 'đã lĩnh ngộ' : a.need}`}>
								<span className="tt-node" data-shape="art" data-state={st} style={{ position: 'relative', width: 22, height: 22, cursor: 'inherit' }}>
									<span className="tt-ic">
										<SkillIcon skillId={a.skillId} box={16} />
									</span>
								</span>
								<span className={`text-[11px] font-extrabold leading-[13px] ${a.learned ? 'text-leaf' : 'text-ink-faint'}`}>{a.elementName}</span>
							</button>
						);
					})}
				</div>
				<p className="flex items-center gap-2 text-[12px] leading-4 text-ink-soft">
					<span>
						Kiếm pháp đã lĩnh ngộ <b className="text-ink-brown">{learnedArts}/{t.arts.length}</b> · Kiếm {SWORD_ART_TIER} + hệ {SWORD_ART_TIER}
					</span>
					<button type="button" className="ui-chip tt-chip-sm ml-auto shrink-0" onClick={onLoadout}>
						Gán ô · Phủ phép
					</button>
				</p>
			</section>
		</div>
	);
}

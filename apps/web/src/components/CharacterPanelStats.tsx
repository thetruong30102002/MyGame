'use client';

import type { ReactNode } from 'react';
import { MAX_LEVEL } from '@aether/protocol';
import { ITEM_INFO, STAT_ICON } from '@/game/items';
import { useGameStore } from '@/store/useGameStore';
import { fmtNum, PixelPortrait, StatBar } from './CharacterPanelParts';
import { gearPart } from './inventory/invShared';
import { KEY_HINT } from './keyHints';
import { SkillIcon } from './SkillIcon';

/** Icon PixelLab hiện đúng 1× ở cỡ gốc (public/assets/ui/ui.json) — không phóng/thu lẻ. */
function Icon1x({ src, w, h }: { src: string; w: number; h: number }) {
	return <img src={src} width={w} height={h} alt="" draggable={false} className="pixel-img max-w-none" />;
}

/** "(+2 trang bị)" màu lá — phần chỉ số đồ đang mặc góp vào (0 thì không hiện). */
function GearNote({ n, pct = false }: { n: number; pct?: boolean }) {
	if (!n) return null;
	return (
		<span className={`text-note font-bold whitespace-nowrap ${n > 0 ? 'text-leaf' : 'text-berry'}`}>
			({n > 0 ? `+${n}` : `−${-n}`}
			{pct ? '%' : ''} trang bị)
		</span>
	);
}

/** Một hàng sinh lực (Máu / Phép lực / Thể lực): cột icon 49px, nhãn + số, thanh bên dưới. Ngăn hàng bằng đường kẻ. */
function VitalRow({ icon, label, value, bar, gear = 0 }: { icon: ReactNode; label: string; value: string; bar: { value: number; max: number; fill: string }; gear?: number }) {
	return (
		<div className="flex min-h-[52px] items-center gap-2.5 border-b border-paper-line py-1.5 last:border-b-0">
			<span className="flex w-[49px] shrink-0 justify-center">{icon}</span>
			<div className="min-w-0 flex-1">
				<div className="flex flex-wrap items-baseline gap-x-2">
					<span className="font-display text-label font-extrabold">{label}</span>
					<GearNote n={gear} />
					<span className="ml-auto text-[18px] font-extrabold tabular-nums">{value}</span>
				</div>
				<StatBar {...bar} />
			</div>
		</div>
	);
}

/** Một ô chỉ số chiến đấu trong khay: icon 1× + nhãn + ghi chú ngắn, số to bên phải. `gear`: phần trang bị góp (0 = ẩn). */
function CombatCell({ icon, label, note, value, gear = 0, pct = false }: { icon: ReactNode; label: string; note: string; value: string; gear?: number; pct?: boolean }) {
	return (
		<div className="flex min-h-[60px] items-center gap-2.5">
			<span className="flex w-[57px] shrink-0 justify-center">{icon}</span>
			<div className="min-w-0">
				<p className="font-display text-label font-extrabold">{label}</p>
				<p className="text-note text-ink-soft">
					{note} <GearNote n={gear} pct={pct} />
				</p>
			</div>
			<span className="ml-auto text-[22px] font-extrabold tabular-nums">{value}</span>
		</div>
	);
}

/** Tab "Nhân vật": chân dung, cấp + EXP, xu, chỉ số sinh lực / chiến đấu và lối tu luyện hiện tại. */
export function CharacterStatsTab({ compact, touch }: { compact: boolean; touch: boolean }) {
	const s = useGameStore((st) => st.stats);
	const portrait = useGameStore((st) => st.playerPortrait);
	const talents = useGameStore((st) => st.talents);
	const hud = useGameStore((st) => st.hud);
	const setPanel = useGameStore((st) => st.setPanel);
	// `stats.name` ở HUD đã ghép "Tên · 8 tuổi" — bảng có dòng tuổi/con đường riêng nên chỉ lấy phần tên.
	const name = s.name.split(' · ')[0] ?? s.name;
	const expLeft = Math.max(0, Math.ceil(s.expNext - s.exp));
	return (
		<div className="flex flex-col gap-4 sm:flex-row sm:items-start">
			<section className={`flex shrink-0 gap-3 sm:w-[190px] sm:flex-col sm:items-center sm:text-center ${compact ? 'items-center' : ''}`}>
				<PixelPortrait src={portrait} alt={name} box={96} />
				<div className="flex min-w-0 flex-1 flex-col gap-1 sm:w-full">
					<p className="truncate font-display text-title leading-[1.45] font-extrabold">{name}</p>
					{(s.age > 0 || s.path) && (
						<p className="flex flex-wrap gap-1.5 sm:justify-center">
							{s.age > 0 && <span className="ui-tag bg-paper-sunk text-ink-soft">{s.age} tuổi</span>}
							{s.path && <span className="ui-tag bg-gold text-ink-brown">{s.path}</span>}
						</p>
					)}
					<div className="mt-1 flex items-baseline justify-between gap-2">
						<span className="font-display text-head font-extrabold">Cấp {s.level}</span>
						<span className="text-note text-ink-soft tabular-nums">{s.level >= MAX_LEVEL ? 'Cấp tối đa' : `còn ${fmtNum(expLeft)} EXP`}</span>
					</div>
					<StatBar value={s.exp} max={s.expNext} fill="var(--color-exp)" />
					<div className="mt-2 flex items-center gap-2 text-left">
						<Icon1x src={ITEM_INFO.coins?.icon ?? '/assets/ui/icon_coins.png'} w={44} h={37} />
						<div className="min-w-0">
							<p className="text-[18px] font-extrabold tabular-nums">{fmtNum(s.coins)} xu</p>
							<p className="text-note text-ink-soft">Để tẩy điểm tiềm năng</p>
						</div>
					</div>
				</div>
			</section>
			<section className="flex min-w-0 flex-1 flex-col">
				<div>
					<VitalRow icon={<Icon1x src={STAT_ICON.hp} w={43} h={38} />} label="Máu" value={`${s.hp} / ${s.hpMax}`} bar={{ value: s.hp, max: s.hpMax, fill: 'var(--color-hp)' }} gear={gearPart(s, 'hp')} />
					<VitalRow icon={<Icon1x src={STAT_ICON.mp} w={31} h={46} />} label="Phép lực" value={`${s.mp} / ${s.mpMax}`} bar={{ value: s.mp, max: s.mpMax, fill: 'var(--color-mana)' }} gear={gearPart(s, 'mp')} />
					{/* Thể lực chưa có tranh riêng: để trống cột icon, không mượn icon kỹ năng (dễ đọc nhầm). */}
					<VitalRow icon={null} label="Thể lực" value={`${Math.round(s.stamina)} / ${s.staminaMax}`} bar={{ value: s.stamina, max: s.staminaMax, fill: 'var(--color-stamina)' }} />
				</div>
				<div className="ui-tray mt-2.5 grid gap-x-4 gap-y-1 px-3 py-2.5 min-[480px]:grid-cols-2">
					<CombatCell icon={<Icon1x src={STAT_ICON.attack} w={48} h={44} />} label="Tấn công" note={s.rage ? 'Bất Khuất: công +20%' : 'sức chém'} value={fmtNum(s.attack)} gear={gearPart(s, 'atk')} />
					<CombatCell icon={<Icon1x src={STAT_ICON.magic} w={35} h={39} />} label="Phép thuật" note={s.rage ? 'Bất Khuất: công +20%' : 'sức phép'} value={fmtNum(s.magic)} gear={gearPart(s, 'mag')} />
					<CombatCell icon={<Icon1x src={STAT_ICON.defense} w={48} h={49} />} label="Phòng thủ" note="đỡ đòn" value={fmtNum(s.defense)} gear={gearPart(s, 'def')} />
					<CombatCell icon={<SkillIcon skillId="crit" box={57} />} label="Chí mạng" note={`gây ×${fmtNum(s.critMult)}`} value={`${Math.round(s.critChance * 100)}%`} gear={gearPart(s, 'crit')} pct />
					{s.evade > 0 && <CombatCell icon={<SkillIcon skillId="evade" box={57} />} label="Né hoàn toàn" note="Bóng Mờ" value={`${Math.round(s.evade * 100)}%`} />}
				</div>
				<div className="ui-paper mt-2.5 flex flex-wrap items-center gap-3 p-3">
					<div className="min-w-0 flex-1">
						<p className="text-note font-bold text-ink-soft">Lối tu luyện</p>
						<p className={`font-display text-head font-extrabold ${talents.buildKind === 'none' ? 'text-ink-soft' : ''}`}>{talents.buildLabel}</p>
						{talents.buildDetail && <p className="text-body text-ink-soft">{talents.buildDetail}</p>}
					</div>
					{talents.unspent > 0 && (
						<button type="button" className="ui-btn min-w-[120px] shrink-0" onClick={() => setPanel('talents')}>
							Dùng {talents.unspent} điểm
						</button>
					)}
				</div>
				{!touch && (
					<details className="mt-3">
						<summary className="cursor-pointer font-display text-label font-extrabold">Phím tắt</summary>
						<div className="mt-1 flex flex-col gap-0.5 text-body text-ink-soft">
							{KEY_HINT[hud].map((line) => (
								<p key={line}>{line}</p>
							))}
						</div>
					</details>
				)}
			</section>
		</div>
	);
}

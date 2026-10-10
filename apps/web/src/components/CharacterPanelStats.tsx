'use client';

import { MAX_LEVEL } from '@aether/protocol';
import { ITEM_INFO } from '@/game/items';
import { useGameStore } from '@/store/useGameStore';
import { fmtNum, PixelPortrait, StatBar, StatGroupTitle } from './CharacterPanelParts';
import { gearPart } from './inventory/invShared';
import { KEY_HINT } from './keyHints';

/**
 * Icon PixelLab hiện đúng 1× ở cỡ gốc (public/assets/ui/ui.json) — không phóng/thu lẻ. Thẻ này chỉ còn icon xu: chủ dự án
 * 10/10/2026 bỏ mọi icon chỉ số (máu, phép lực, tấn công, chí mạng…) khỏi cửa sổ nhân vật, chỉ giữ xu / kim cương.
 */
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

/** Một hàng sinh lực (Máu / Phép lực / Thể lực): nhãn nhỏ + phần trang bị góp bên trái, số to bên phải, thanh màu bên dưới. */
function VitalRow({ label, value, bar, gear = 0 }: { label: string; value: string; bar: { value: number; max: number; fill: string }; gear?: number }) {
	return (
		<div className="py-1">
			<div className="flex flex-wrap items-baseline gap-x-2">
				<span className="text-body font-bold text-ink-soft">{label}</span>
				<GearNote n={gear} />
				<span className="ml-auto text-[18px] leading-6 font-extrabold text-ink-brown tabular-nums">{value}</span>
			</div>
			<StatBar {...bar} />
		</div>
	);
}

/**
 * Một dòng chỉ số: nhãn nhỏ nhạt + ghi chú ngắn (và phần trang bị góp) bên trái, số to đậm bên phải — các dòng một nhóm
 * xếp dọc nên cột số thẳng hàng. `gear`: phần trang bị góp (0 = ẩn).
 */
function StatLine({ label, note, value, gear = 0, pct = false }: { label: string; note: string; value: string; gear?: number; pct?: boolean }) {
	return (
		<div className="flex min-h-[48px] items-center gap-3 py-1">
			<div className="min-w-0 flex-1">
				<p className="text-body font-bold text-ink-soft">{label}</p>
				<p className="text-note text-ink-soft">
					{note} <GearNote n={gear} pct={pct} />
				</p>
			</div>
			<span className="shrink-0 text-[22px] leading-7 font-extrabold text-ink-brown tabular-nums">{value}</span>
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
			{/* `@container`: cột chỉ số đủ rộng (≥ 26rem — cả điện thoại xoay ngang) thì Chiến đấu · Phụ đứng cạnh nhau, hẹp hơn thì xếp dọc. */}
			<section className="@container flex min-w-0 flex-1 flex-col">
				<StatGroupTitle>Sinh lực</StatGroupTitle>
				<div className="mt-0.5">
					<VitalRow label="Máu" value={`${s.hp} / ${s.hpMax}`} bar={{ value: s.hp, max: s.hpMax, fill: 'var(--color-hp)' }} gear={gearPart(s, 'hp')} />
					<VitalRow label="Phép lực" value={`${s.mp} / ${s.mpMax}`} bar={{ value: s.mp, max: s.mpMax, fill: 'var(--color-mana)' }} gear={gearPart(s, 'mp')} />
					<VitalRow label="Thể lực" value={`${Math.round(s.stamina)} / ${s.staminaMax}`} bar={{ value: s.stamina, max: s.staminaMax, fill: 'var(--color-stamina)' }} />
				</div>
				<div className="ui-tray mt-3 grid gap-x-6 gap-y-2.5 px-3 pt-2 pb-1.5 @min-[26rem]:grid-cols-2">
					<div className="min-w-0">
						<StatGroupTitle>Chiến đấu</StatGroupTitle>
						<div className="divide-y divide-paper-line">
							<StatLine label="Tấn công" note={s.rage ? 'Bất Khuất: công +20%' : 'sức chém'} value={fmtNum(s.attack)} gear={gearPart(s, 'atk')} />
							<StatLine label="Phép thuật" note={s.rage ? 'Bất Khuất: công +20%' : 'sức phép'} value={fmtNum(s.magic)} gear={gearPart(s, 'mag')} />
							<StatLine label="Phòng thủ" note="đỡ đòn" value={fmtNum(s.defense)} gear={gearPart(s, 'def')} />
						</div>
					</div>
					<div className="min-w-0">
						<StatGroupTitle>Phụ</StatGroupTitle>
						<div className="divide-y divide-paper-line">
							<StatLine label="Chí mạng" note={`gây ×${fmtNum(s.critMult)}`} value={`${Math.round(s.critChance * 100)}%`} gear={gearPart(s, 'crit')} pct />
							{s.evade > 0 && <StatLine label="Né hoàn toàn" note="Bóng Mờ" value={`${Math.round(s.evade * 100)}%`} />}
						</div>
					</div>
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

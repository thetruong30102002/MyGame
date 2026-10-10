'use client';

import type { ReactNode } from 'react';
import type { BranchId } from '@/store/useGameStore';
import { ELEMENT_STYLE } from '../SkillBar';
import { UiFit } from './TalentArt';
import { fmtNum, type NodeKind, type SkillSheet } from './talentInfo';
import type { NodeState } from './treeLayout';

/** Màu hệ của nhánh: `fill` cho thanh / dải màu, `ink` cho chữ + nét trên giấy (đủ tương phản). Kiếm = thép. */
export const BRANCH_FILL: Record<BranchId, string> = {
	sword: ELEMENT_STYLE.steel.color,
	fire: ELEMENT_STYLE.fire.color,
	water: ELEMENT_STYLE.water.color,
	wind: ELEMENT_STYLE.wind.color,
	ice: ELEMENT_STYLE.ice.color,
	earth: ELEMENT_STYLE.earth.color,
};
export const BRANCH_INK: Record<BranchId, string> = {
	sword: ELEMENT_STYLE.steel.ink,
	fire: ELEMENT_STYLE.fire.ink,
	water: ELEMENT_STYLE.water.ink,
	wind: ELEMENT_STYLE.wind.ink,
	ice: ELEMENT_STYLE.ice.ink,
	earth: ELEMENT_STYLE.earth.ink,
};

/**
 * Thanh 10 mốc của một nhánh: ô đặc màu hệ = đã đạt, ô viền hổ phách = mốc đang xem / mốc đích (`target`), ô đứt nét = sắp có
 * (trên `cap`), còn lại ô trống. Khoá thì cả thanh mờ.
 */
export function TierPips({ tier, cap, max = 10, branch, target = 0, locked = false, size = 'md' }: { tier: number; cap: number; max?: number; branch: BranchId; target?: number; locked?: boolean; size?: 'sm' | 'md' }) {
	const h = size === 'sm' ? 'h-2' : 'h-2.5';
	return (
		<span className={`flex w-full gap-[3px] ${locked ? 'opacity-45' : ''}`} aria-hidden>
			{Array.from({ length: max }, (_, i) => {
				const n = i + 1;
				const on = n <= tier;
				const goal = !on && target > 0 && n <= target;
				const soon = n > cap;
				return (
					<i
						key={n}
						className={`${h} min-w-0 flex-1 rounded-[2px] border-2 ${on ? 'border-outline' : goal ? 'border-amber bg-honey' : soon ? 'border-dashed border-paper-line' : 'border-paper-line bg-paper-hi'}`}
						style={on ? { background: BRANCH_FILL[branch] } : undefined}
					/>
				);
			})}
		</span>
	);
}

export const KIND_TONE: Record<NodeKind, string> = {
	active: 'bg-bark text-paper-hi',
	passive: 'border-2 border-bark text-ink-brown',
	ult: 'bg-amber text-paper-hi',
	art: 'bg-[#6e1a0e] text-paper-hi',
};

/** Nhãn trạng thái của một nút (đi cùng kicker). */
export function StateTag({ state, kind, cost, unspent }: { state: NodeState; kind: NodeKind; cost: number; unspent: number }) {
	switch (state) {
		case 'reached':
			return <span className="ui-tag bg-leaf text-paper-hi">{kind === 'passive' ? 'Đã đạt' : 'Đã học'}</span>;
		case 'next':
			return <span className="ui-tag bg-gold text-ink-brown ring-2 ring-outline">Học được · {cost}đ</span>;
		case 'next-poor':
			return (
				<span className="ui-tag border-2 border-berry bg-[#f6d6c8] text-berry">
					Cần {cost}đ · còn {unspent}
				</span>
			);
		case 'future':
			return kind === 'art' ? <span className="ui-tag border-2 border-paper-line text-ink-soft">Tự học khi đủ</span> : <span className="ui-tag border-2 border-paper-line text-ink-soft">Chưa tới</span>;
		case 'soon':
			return <span className="ui-tag border-2 border-dashed border-paper-line text-ink-faint">Sắp có</span>;
		case 'dim':
			return <span className="ui-tag bg-paper-sunk text-ink-faint">Lưu phái khác</span>;
		default:
			return <span className="ui-tag bg-paper-sunk text-ink-faint">Khoá</span>;
	}
}

/** Một ô số liệu: nhãn nhỏ viết hoa, số to, dòng phụ. */
function Tile({ label, icon, children, sub, accent }: { label: string; icon?: ReactNode; children: ReactNode; sub?: ReactNode; accent?: string }) {
	return (
		<div className="min-w-0 rounded-[6px] border-2 border-paper-line bg-paper-hi px-2 py-1" style={accent ? { borderLeftColor: accent, borderLeftWidth: 5 } : undefined}>
			<p className="flex items-center gap-1 text-[11px] font-extrabold uppercase leading-[14px] tracking-[0.05em] text-ink-soft">
				{icon}
				{label}
			</p>
			<p className="font-display text-[16px] font-extrabold leading-5 text-ink-brown tabular-nums">{children}</p>
			{sub && <p className="text-[12px] leading-4 text-ink-faint">{sub}</p>}
		</div>
	);
}

const MP_ICON = <UiFit src="/assets/ui/icon_mp.png" w={31} h={46} box={16} />;

/**
 * Bảng số liệu kỹ năng (số THẬT từ `skillSheet`): 4 ô MP · Hồi chiêu · Uy lực · Hệ, rồi câu tả cách đánh + chip hiệu ứng.
 * `compact` (sheet điện thoại): 4 ô một hàng, chữ gọn, bỏ dòng phụ.
 */
export function SkillStats({ sheet: s, compact = false, showHow = true }: { sheet: SkillSheet; compact?: boolean; showHow?: boolean }) {
	const el = ELEMENT_STYLE[s.element] ?? ELEMENT_STYLE.aether;
	const cdChanged = s.cooldownNow !== s.cooldown;
	if (compact) {
		return (
			<div className="grid grid-cols-2 gap-1.5 min-[360px]:grid-cols-4">
				{(
					[
						['MP', s.mp ? String(s.mp) : '0'],
						['Hồi', `${fmtNum(cdChanged ? s.cooldownNow : s.cooldown)}s`],
						['Uy lực', (s.powerNow || s.power).match(/×?[\d,]+%?/)?.[0] ?? '—'],
						['Hệ', s.elementName],
					] as [string, string][]
				).map(([k, v], i) => (
					<div key={k} className="min-w-0 rounded-[6px] border-2 border-paper-line bg-paper-hi px-1.5 py-0.5 text-center" style={i === 3 ? { borderBottomColor: el.color, borderBottomWidth: 4 } : undefined}>
						<p className="whitespace-nowrap text-[11px] font-extrabold uppercase leading-[13px] tracking-[0.02em] text-ink-soft">{k}</p>
						<p className="truncate font-display text-[clamp(12px,3.8vw,15px)] font-extrabold leading-5 text-ink-brown tabular-nums">{v}</p>
					</div>
				))}
			</div>
		);
	}
	return (
		<div className="@container flex flex-col gap-1.5">
			<div className="grid grid-cols-2 gap-1.5 @lg:grid-cols-4">
				<Tile label="Phép lực" icon={MP_ICON} sub={s.mp ? undefined : 'dùng thoải mái'}>
					{s.mp ? `${s.mp} MP` : 'Không tốn'}
				</Tile>
				<Tile label="Hồi chiêu" sub={cdChanged ? `gốc ${fmtNum(s.cooldown)}s · ${s.cooldownBy.join(', ')}` : undefined}>
					{fmtNum(cdChanged ? s.cooldownNow : s.cooldown)} giây
				</Tile>
				<Tile label="Uy lực" sub={s.powerNow ? `${s.powerNow} · +${s.depthPct}% (${s.depthFrom})` : undefined}>
					{s.power}
				</Tile>
				<Tile label="Hệ · kiểu" accent={el.color} sub={s.blade ? (s.element === 'steel' ? 'đòn Kiếm · ăn phủ phép' : 'đòn Kiếm mang hệ') : 'phép · theo sức phép'}>
					{s.elementName} · {s.kindName}
				</Tile>
			</div>
			{showHow && <SkillHow sheet={s} />}
		</div>
	);
}

/** Câu tả cách đánh (tầm, bán kính, thời gian…) + chip hiệu ứng lên mục tiêu — phần chữ của bảng số liệu. */
export function SkillHow({ sheet: s }: { sheet: SkillSheet }) {
	if (!s.how.length && !s.effects.length) return null;
	return (
		<>
			{s.how.length > 0 && (
				<p className="text-note text-ink-soft">
					<b className="text-ink-brown">Cách đánh:</b> {s.how.join(' · ')}
				</p>
			)}
			{s.effects.length > 0 && (
				<p className="flex flex-wrap items-center gap-1">
					<b className="mr-0.5 text-note text-ink-brown">Hiệu ứng:</b>
					{s.effects.map((e) => (
						<span key={e} className="rounded-[4px] border-2 border-paper-line bg-paper-hi px-1.5 text-[12px] font-bold leading-[18px] text-ink-brown">
							{e}
						</span>
					))}
				</p>
			)}
		</>
	);
}

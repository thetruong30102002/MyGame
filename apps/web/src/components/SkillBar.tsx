'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { estimateText, HERO_SKILLS, skillFacts, type SkillDef } from '@/game/combat/skills';
import { BRANCH_NAME } from '@/game/combat/talents';
import { ITEM_INFO } from '@/game/items';
import { useGameStore, type ElementId, type PlayerStats, type SkillSlot } from '@/store/useGameStore';
import { LockGlyph, PixelIcon, SkillIcon } from './SkillIcon';

/**
 * Màu từng hệ. `color`: nền chip phím trên ô kỹ năng (máy tính, bảng Tiềm năng) và quầng nút cảm ứng — tông sáng, chữ
 * mực đặt lên được. `ink`: cùng hệ nhưng đậm, dùng cho CHỮ tên hệ trên nền giấy của tooltip.
 */
export const ELEMENT_STYLE: Record<ElementId, { name: string; color: string; ink: string }> = {
	aether: { name: 'Aether', color: '#b69cff', ink: '#6e34cb' },
	fire: { name: 'Lửa', color: '#ff8a3d', ink: '#a33f0c' },
	water: { name: 'Thuỷ', color: '#4fb4ff', ink: '#1f5cc2' },
	wind: { name: 'Phong', color: '#5fe0a8', ink: '#23684a' },
	healing: { name: 'Suối Lành', color: '#b8f05a', ink: '#446a0f' },
	steel: { name: 'Kiếm', color: '#d9dde6', ink: '#4a4f5c' },
	ice: { name: 'Băng', color: '#9fe8ff', ink: '#186a87' },
	earth: { name: 'Thổ', color: '#d6a964', ink: '#6b4a1f' },
};

/** Ô đá giữ đúng cỡ gốc 58×57 của slot.png: viền 13px không bị co giãn, vùng trong 32×31 vừa icon 32px. */
const CELL = 'ui-slot relative h-[57px] w-[58px] shrink-0';
const INNER: [number, number] = [32, 31];
/** Dữ liệu gốc của từng kỹ năng — store chỉ mang hệ số mốc nhánh (`scale`), tooltip cần cả hai để ước sát thương + kiểu đòn. */
const SKILL_DEF: Record<string, SkillDef> = Object.fromEntries(HERO_SKILLS.map((d) => [d.id, d]));

/** Số kiểu Việt: dấu phẩy thập phân, bỏ số 0 thừa (1,8 · 0,38 · 2). */
function fmt(n: number, digits = 2): string {
	return String(Number(n.toFixed(digits))).replace('.', ',');
}

function useNow(active: boolean): number {
	const [now, setNow] = useState(() => performance.now());
	useEffect(() => {
		if (!active) return undefined;
		let raf = 0;
		const tick = (): void => {
			setNow(performance.now());
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [active]);
	return now;
}

type TipAlign = 'left' | 'center' | 'right';

/**
 * Tooltip hiện khi rê chuột lên ô: tờ giấy note. Hai ô ở mỗi đầu thanh neo theo mép ô thay vì căn giữa — căn giữa thì
 * ô đầu/cuối đẩy tooltip 240px tràn khỏi cửa sổ hẹp.
 */
function Tip({ align, children }: { align: TipAlign; children: ReactNode }) {
	const pos = align === 'left' ? 'left-0' : align === 'right' ? 'right-0' : 'left-1/2 -translate-x-1/2';
	return (
		<div role="tooltip" className={`pointer-events-none invisible absolute bottom-full z-10 mb-4 w-[240px] opacity-0 transition-opacity duration-100 group-hover:visible group-hover:opacity-100 ${pos}`}>
			<div className="rounded-[10px] border-2 border-wood-edge bg-paper px-3 py-2 text-left text-note text-ink-brown shadow-[0_4px_0_rgb(0_0_0/0.3)]">{children}</div>
		</div>
	);
}

function TipHead({ name, sub }: { name: string; sub: ReactNode }) {
	return (
		<>
			<p className="font-display text-label font-extrabold">{name}</p>
			<p className="flex items-center gap-1.5 text-note text-ink-soft">{sub}</p>
			<div className="my-1.5 h-0.5 bg-paper-line" />
		</>
	);
}

function TipRows({ rows }: { rows: [string, ReactNode][] }) {
	return (
		<div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
			{rows.map(([k, v]) => (
				<div key={k} className="contents">
					<span className="text-ink-soft">{k}</span>
					<span className="font-extrabold tabular-nums">{v}</span>
				</div>
			))}
		</div>
	);
}

/** Chip phím neo góc trên trái, đè lên viền đá chứ không lên icon. `color`: màu hệ của kỹ năng; không có thì nền giấy. */
function KeyBadge({ k, color }: { k: string; color?: string }) {
	return (
		<span
			className={`absolute -left-[10px] -top-[11px] flex h-5 min-w-5 items-center justify-center rounded-[5px] border-2 border-outline px-1 text-chip font-extrabold leading-none text-ink-brown ${color ? '' : 'bg-parchment'}`}
			style={color ? { background: color } : undefined}
		>
			{k}
		</span>
	);
}

/**
 * Ước lượng một đòn ở mốc hiện tại: kiếm theo sức đánh, phép theo phép thuật (đã gồm hệ số con đường), Suối Lành theo máu
 * tối đa. Chữ theo kiểu đòn (mỗi nhịp / mỗi tia / mỗi viên / mỗi lưỡi…) ở `skills.estimateText`.
 */
function estimate(s: SkillSlot, stats: PlayerStats): string | null {
	const def = SKILL_DEF[s.id];
	if (!def) return null;
	if (s.element === 'healing') return `hồi ≈ ${Math.round(stats.hpMax * def.power * s.scale)} máu`;
	const base = s.school === 'sword' ? stats.attack : stats.magic;
	return estimateText(def, Math.round(base * def.power * s.scale));
}

function SkillCell({ s, now, stats, unspent, align }: { s: SkillSlot; now: number; stats: PlayerStats; unspent: number; align: TipAlign }) {
	const remain = Math.max(0, (s.readyAt - now) / 1000);
	const pct = s.cooldown > 0 ? Math.min(1, remain / s.cooldown) : 0;
	const learned = !s.locked;
	const noMp = learned && stats.mp < s.mpCost;
	const el = ELEMENT_STYLE[s.element] ?? ELEMENT_STYLE.aether;
	const est = learned ? estimate(s, stats) : null;
	const branch = s.school === 'aether' ? null : BRANCH_NAME[s.school];
	const def = SKILL_DEF[s.id];
	const facts = def ? skillFacts(def) : [];
	const rows: [string, ReactNode][] = [
		['Nhánh', !learned ? <span className="text-berry">Chưa học</span> : branch ? `${branch} mốc ${s.rank}/${s.maxRank}` : 'Bẩm sinh · mạnh theo cấp'],
		...(learned ? ([['Uy lực', `×${fmt(s.scale)}${est ? ` · ${est}` : ''}`]] as [string, ReactNode][]) : []),
		...(facts.length ? ([['Kiểu đòn', facts.join(' · ')]] as [string, ReactNode][]) : []),
		['Phép lực', s.mpCost ? <span className={noMp ? 'text-berry' : ''}>{s.mpCost} MP{noMp ? ' (chưa đủ)' : ''}</span> : 'Không tốn MP'],
		['Hồi chiêu', `${fmt(s.cooldown)} giây`],
	];
	return (
		<div className="group relative">
			<div className={`${CELL} transition-[filter] group-hover:brightness-[1.15] ${learned ? '' : 'brightness-[0.75]'}`}>
				<div className={`flex h-full w-full items-center justify-center ${learned ? '' : 'opacity-30 grayscale'}`}>
					<SkillIcon skillId={s.id} box={INNER[0]} />
				</div>
				{s.locked && (
					<div className="absolute inset-0 flex items-center justify-center">
						<LockGlyph />
					</div>
				)}
				{noMp && <div className="absolute inset-0 bg-[#08122e]/65" />}
				{pct > 0 && (
					<div className="absolute inset-0 flex items-center justify-center bg-[#2a170b]/70 text-[14px] font-extrabold tabular-nums text-white text-outline" style={{ clipPath: `inset(${(1 - pct) * 100}% 0 0 0)` }}>
						{remain.toFixed(1).replace('.', ',')}
					</div>
				)}
				<KeyBadge k={s.key} color={el.color} />
				{learned && s.maxRank > 0 && (
					// Mốc nhánh = hạt vàng nằm trên viền đá dưới (vùng trong đã chật icon). Dải rộng bằng cả ô để 10 hạt (39px) căn giữa đủ chỗ.
					<span className="absolute -inset-x-[13px] -bottom-[9px] flex justify-center gap-px">
						{Array.from({ length: s.maxRank }, (_, r) => (
							<span key={r} className={`h-1 w-1 ${r < s.rank ? 'bg-gold' : 'bg-outline/70'}`} />
						))}
					</span>
				)}
			</div>
			<Tip align={align}>
				<TipHead
					name={s.name}
					sub={
						<>
							<span className="font-extrabold" style={{ color: el.ink }}>
								{s.element === 'healing' ? 'Hồi máu' : `Hệ ${el.name}`}
							</span>
							<span>· Phím {s.key}</span>
						</>
					}
				/>
				{def?.desc && <p className="mb-1">{def.desc}</p>}
				<TipRows rows={rows} />
				{s.locked && <p className="mt-1.5 text-note text-ink-soft">Chưa học — xem bảng Tiềm năng (P).</p>}
				{learned && unspent > 0 && branch && s.rank < s.maxRank && <p className="mt-1.5 text-note font-bold text-amber">Còn {unspent} điểm, mở Tiềm năng (P) để lên mốc {branch}.</p>}
			</Tip>
		</div>
	);
}

/** `cost`: thể lực mỗi lần né (khớp `CombatSystem.dodgeStamina` — Nhẹ Như Gió giảm). */
function DodgeCell({ stamina, cost, align }: { stamina: number; cost: number; align: TipAlign }) {
	const tired = stamina < cost;
	return (
		<div className="group relative">
			<div className={`${CELL} transition-[filter] group-hover:brightness-[1.15]`}>
				<div className="flex h-full w-full items-center justify-center">
					<SkillIcon skillId="dodge" box={INNER[0]} />
				</div>
				{tired && <div className="absolute inset-0 bg-[#2a170b]/60" />}
				<KeyBadge k="Space" />
			</div>
			<Tip align={align}>
				<TipHead name="Né" sub="Phím Space" />
				<p className="mb-1">Lăn một đoạn ngắn theo hướng đang đi, không trúng đòn trong lúc lăn; huỷ được thế đang vung.</p>
				<TipRows rows={[['Thể lực', <span className={tired ? 'text-berry' : ''}>{fmt(cost, 1)}{tired ? ' (chưa đủ)' : ''}</span>]]} />
			</Tip>
		</div>
	);
}

function PotionCell({ potions, align }: { potions: number; align: TipAlign }) {
	const info = ITEM_INFO.potion!;
	return (
		<div className="group relative">
			<div className={`${CELL} transition-[filter] group-hover:brightness-[1.15]`}>
				{/* Bình 35×44 lớn hơn vùng trong 32×31: giữ 1× và cho tràn lên viền đá (như đặt nổi trên khay), không thu lẻ tỉ lệ. */}
				<PixelIcon src={info.icon} w={35} h={44} box={INNER} dim={potions <= 0} />
				<KeyBadge k="R" />
				<span className="ui-tag absolute -bottom-2.5 -right-2.5 h-5 border-2 border-outline bg-bark px-1.5 tabular-nums text-white">{potions}</span>
			</div>
			<Tip align={align}>
				<TipHead name={info.name} sub="Phím R" />
				<p className="mb-1">{info.desc}</p>
				<TipRows rows={[['Còn', <span className={potions <= 0 ? 'text-berry' : ''}>{potions} bình</span>]]} />
			</Tip>
		</div>
	);
}

/**
 * Thanh kỹ năng máy tính (giữa đáy, rộng tối đa 780px — khung chat bên trái co theo con số này). Khay gỗ phẳng, mỗi kỹ
 * năng một ô đá: chip phím màu hệ, hạt vàng = bậc, quét hồi chiêu từ trên xuống, phủ xanh khi thiếu MP, mờ + ổ khoá khi chưa học.
 * Ngân sách bề ngang khi đủ 12 ô (thanh 10 ô J, K, 1–8 + né + bình): 12×58 + 11 khe 4px + vạch ngăn 8 + đệm 20 + viền 4 = 772px
 * ≤ 780. Trần cũ 600px (vừa 9 ô) làm ô bình máu rơi xuống một hàng RIÊNG — khay cao gấp đôi, đè lên nút của khung chat.
 */
export function SkillBar() {
	const skills = useGameStore((s) => s.skills);
	const hud = useGameStore((s) => s.hud);
	const stats = useGameStore((s) => s.stats);
	const unspent = useGameStore((s) => s.talents.unspent);
	const cooling = skills.some((s) => s.readyAt > performance.now());
	// useNow chỉ để kích vẽ lại mỗi frame khi đang hồi chiêu; mốc thời gian phải lấy NGAY lúc vẽ —
	// dùng giá trị của hook khi nó đang nghỉ là đọc mốc cũ từ lúc mount (ra "18.4s" ảo).
	useNow(cooling);
	const now = performance.now();
	const full = hud === 'full';
	const count = skills.length + (full ? 2 : 0);
	const align = (i: number): TipAlign => (i < 2 ? 'left' : i >= count - 2 ? 'right' : 'center');
	return (
		<div className="ui-plank pointer-events-auto flex max-w-[min(780px,calc(100vw-24px))] flex-wrap items-center justify-center gap-x-1 gap-y-6 px-2.5 pt-4 pb-4">
			{skills.map((s, i) => (
				<SkillCell key={s.id} s={s} now={now} stats={stats} unspent={unspent} align={align(i)} />
			))}
			{full && <span className="w-2" aria-hidden />}
			{full && <DodgeCell stamina={stats.stamina} cost={stats.dodgeStamina} align={align(skills.length)} />}
			{full && <PotionCell potions={stats.potions} align={align(skills.length + 1)} />}
		</div>
	);
}

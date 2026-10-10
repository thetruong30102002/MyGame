'use client';

import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { setVirtualAxis, virtualInput, virtualPress } from '@/game/input/virtualInput';
import { useGameStore, type SkillSlot } from '@/store/useGameStore';
import { ELEMENT_STYLE } from './SkillBar';
import { LockGlyph, PixelIcon, SkillIcon } from './SkillIcon';
import { useMediaQuery } from './useMediaQuery';

/** Có màn cảm ứng làm thiết bị trỏ chính (điện thoại/máy tính bảng) — desktop có chuột thì ẩn hết. */
export function useTouchDevice(): boolean {
	const [touch, setTouch] = useState(false);
	useEffect(() => {
		const mq = window.matchMedia('(pointer: coarse)');
		const update = (): void => setTouch(mq.matches || navigator.maxTouchPoints > 0);
		update();
		mq.addEventListener('change', update);
		return () => mq.removeEventListener('change', update);
	}, []);
	return touch;
}

function Joystick() {
	const base = useRef<HTMLDivElement>(null);
	const [knob, setKnob] = useState({ x: 0, y: 0, active: false });
	// State React chưa kịp cập nhật giữa pointerdown và pointermove ngay sau đó → giữ cờ trong ref.
	const active = useRef(false);
	const RADIUS = 52;

	const move = (e: React.PointerEvent): void => {
		const r = base.current!.getBoundingClientRect();
		let dx = e.clientX - (r.left + r.width / 2);
		let dy = e.clientY - (r.top + r.height / 2);
		const len = Math.hypot(dx, dy);
		if (len > RADIUS) {
			dx = (dx / len) * RADIUS;
			dy = (dy / len) * RADIUS;
		}
		active.current = true;
		setKnob({ x: dx, y: dy, active: true });
		setVirtualAxis(dx / RADIUS, dy / RADIUS);
	};
	const end = (): void => {
		active.current = false;
		virtualInput.stickActive = false;
		setKnob({ x: 0, y: 0, active: false });
		setVirtualAxis(0, 0);
	};
	useEffect(() => end, []);

	return (
		<div
			ref={base}
			className="pointer-events-auto relative h-36 w-36 shrink-0 touch-none rounded-full border border-white/15 bg-black/25 backdrop-blur-[2px] max-[399px]:h-32 max-[399px]:w-32"
			onPointerDown={(e) => {
				// Chạm nhẹ trong vùng chết (chưa thành hướng đi) vẫn là "tự điều khiển" → huỷ tự đi.
				virtualInput.stickActive = true;
				virtualInput.stickDowns += 1;
				try {
					e.currentTarget.setPointerCapture(e.pointerId);
				} catch {
					/* pointer không còn hoạt động (sự kiện giả lập) — vẫn đọc hướng bình thường */
				}
				move(e);
			}}
			onPointerMove={(e) => active.current && move(e)}
			onPointerUp={end}
			onPointerCancel={end}
		>
			<div
				className={`absolute left-1/2 top-1/2 h-16 w-16 rounded-full border-2 ${knob.active ? 'border-gold/80 bg-gold/25' : 'border-white/30 bg-white/10'}`}
				style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
			/>
			<span className="absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-chip font-bold text-white text-outline">Kéo xa để chạy</span>
		</div>
	);
}

/**
 * Nút đá tròn cùng chất liệu ô `ui-slot`: border-image không bo tròn được nên vẽ bằng bóng — mép tối ngoài viền vàng,
 * gờ sáng trên, lõm tối dưới.
 */
const STONE_SHADOW = '0 0 0 2px rgb(26 17 10 / 0.9), inset 0 2px 0 rgb(255 236 190 / 0.14), inset 0 -4px 8px rgb(0 0 0 / 0.55), 0 4px 12px rgb(0 0 0 / 0.55)';
/** Lòng nút (trừ viền 2px) — ảnh 1× đặt bằng toạ độ nguyên theo cỡ này. */
const INNER = { lg: 76, md: 52, sm: 40 } as const;

function ActionButton({ label, code, size = 'md', skill, badge, children }: { label: string; code: string; size?: 'lg' | 'md' | 'sm'; skill?: SkillSlot; badge?: ReactNode; children?: ReactNode }) {
	const [now, setNow] = useState(() => performance.now());
	const mp = useGameStore((s) => s.stats.mp);
	const cooling = !!skill && skill.readyAt > now;
	useEffect(() => {
		if (!skill || skill.readyAt <= performance.now()) return undefined;
		let raf = 0;
		const tick = (): void => {
			setNow(performance.now());
			if (performance.now() < skill.readyAt) raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [skill, skill?.readyAt]);
	const pct = cooling && skill ? Math.min(1, (skill.readyAt - now) / (skill.cooldown * 1000)) : 0;
	const dim = size === 'lg' ? 'h-20 w-20' : size === 'md' ? 'h-14 w-14' : 'h-11 w-11';
	const locked = !!skill?.locked;
	const noMp = !!skill && !locked && mp < skill.mpCost;
	const glow = skill && !locked ? ELEMENT_STYLE[skill.element]?.color : undefined;
	return (
		<button
			type="button"
			aria-label={label}
			disabled={locked}
			onPointerDown={(e) => {
				e.preventDefault();
				virtualPress(code);
			}}
			style={{ boxShadow: glow ? `${STONE_SHADOW}, 0 0 12px -1px ${glow}, inset 0 0 10px ${glow}44` : STONE_SHADOW }}
			className={`pointer-events-auto relative ${dim} touch-none select-none rounded-full border-2 border-gold/75 bg-[radial-gradient(circle_at_50%_32%,#4b4853,#26242c_62%,#17161b)] active:translate-y-0.5 disabled:brightness-75`}
		>
			<span className={`absolute inset-0 flex items-center justify-center ${locked ? 'opacity-30 grayscale' : ''}`}>{children ?? (skill ? <SkillIcon skillId={skill.id} box={size === 'lg' ? 64 : 32} /> : null)}</span>
			{noMp && <span className="absolute inset-0 rounded-full bg-[#08122e]/60" />}
			{pct > 0 && <span className="absolute inset-0 rounded-full bg-black/60" style={{ clipPath: `inset(${(1 - pct) * 100}% 0 0 0)` }} />}
			{locked && (
				<span className="absolute inset-0 flex items-center justify-center">
					<LockGlyph />
				</span>
			)}
			{badge !== undefined && <span className="ui-tag absolute -bottom-1 -right-1 h-5 border-2 border-outline bg-bark px-1.5 tabular-nums text-white">{badge}</span>}
		</button>
	);
}

/**
 * Điều khiển cảm ứng: joystick trái, cụm nút phải. Bấm nút = "nhấn phím" tương ứng qua virtualInput,
 * nên mọi luật của game (khoá theo tuổi, hồi chiêu, MP) áp y như bàn phím.
 */
export function TouchControls() {
	const touch = useTouchDevice();
	// Điện thoại ngang thấp: cụm nút không được cao thêm (bản đồ nhỏ + chip nhiệm vụ phải xong trước y≈152).
	const low = useMediaQuery('(max-height: 500px)');
	const scene = useGameStore((s) => s.scene);
	const status = useGameStore((s) => s.status);
	const dialogue = useGameStore((s) => s.dialogue);
	const card = useGameStore((s) => s.card);
	const hud = useGameStore((s) => s.hud);
	const skills = useGameStore((s) => s.skills);
	const hint = useGameStore((s) => s.interactHint);
	const potions = useGameStore((s) => s.stats.potions);
	if (!touch || status !== 'ready' || scene !== 'play' || dialogue || card) return null;
	const full = hud === 'full';
	const gap = <span />;
	const skillButton = (s: SkillSlot | undefined, size?: 'lg' | 'md' | 'sm'): ReactNode => (s ? <ActionButton key={s.id} label={s.name} code={s.code} size={size} skill={s} /> : gap);
	const talk = hint ? (
		<ActionButton label={hint} code="KeyE" size="md">
			<span className="font-display text-[16px] leading-[1.45] font-extrabold text-white text-outline">{hint.startsWith('Nhặt') ? 'Nhặt' : hint.startsWith('Xem') ? 'Xem' : hint.startsWith('Mua') ? 'Mua' : hint.startsWith('Dùng') ? 'Dùng' : 'Nói'}</span>
		</ActionButton>
	) : null;
	const dodge = full ? (
		<ActionButton label="Né" code="Space" size="md">
			<SkillIcon skillId="dodge" box={32} />
		</ActionButton>
	) : (
		gap
	);
	const potion = full ? (
		<ActionButton label="Uống thuốc" code="KeyR" size="sm" badge={potions}>
			<PixelIcon src="/assets/ui/icon_potion.png" w={35} h={44} box={INNER.sm} dim={potions <= 0} />
		</ActionButton>
	) : (
		gap
	);
	// Nút theo THANH 10 Ô (store chỉ gửi ô đã gán): ô J nút lớn, ô K cạnh nó — đúng chỗ dưới ngón cái như trước; các ô 1–8
	// đã gán là "phụ", xếp từng nhóm 3. Nút Nói/Nhặt vào ô trống hàng cuối ngay dưới K.
	const j = skillButton(skills.find((s) => s.slot === 0), 'lg');
	const k = skillButton(skills.find((s) => s.slot === 1));
	const extras = skills.filter((s) => s.slot >= 2).map((s) => skillButton(s));
	const triple = (xs: ReactNode[]): ReactNode[] => (xs.length === 1 ? [gap, xs[0], gap] : xs.length === 2 ? [xs[0], gap, xs[1]] : xs);
	const groups: ReactNode[][] = [];
	for (let i = 0; i < extras.length; i += 3) groups.push(extras.slice(i, i + 3));
	const base = [k, j, dodge, talk ?? gap, gap, potion];
	// Dọc (bề ngang 360px đã kín: cần gạt 128–144px + lưới 208px): nhóm phụ thành HÀNG chồng lên trên, nhóm đầu sát J/K.
	// Ngang thấp (chiều cao kín, bề ngang thừa): nhóm đầu làm hàng trên J/K, nhóm sau thành CỘT bên trái — cao tối đa 3 hàng;
	// cột chưa đủ 3 nút thì dồn xuống đáy (gần ngón cái).
	const sideCols = low ? groups.slice(1) : [];
	const rows: ReactNode[][] = low ? [triple(groups[0] ?? []), base.slice(0, 3), base.slice(3)] : [...groups.map(triple).reverse(), base.slice(0, 3), base.slice(3)];
	const cells: ReactNode[] = rows.flatMap((row, r) => [...[...sideCols].reverse().map((col) => (low && r < 3 ? (col[r - (3 - col.length)] ?? gap) : gap)), ...(row.length ? row : [gap, gap, gap])]);
	const columns = `${sideCols.map(() => '56px ').join('')}56px 80px 56px`;

	return (
		<div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
			<Joystick />
			{hud === 'minimal' ? (
				talk && <div className="flex items-end">{talk}</div>
			) : (
				// Cột cố định (56 · 80 · 56, thêm cột 56 bên trái khi ngang): cụm nút không bóp cần gạt.
				<div className="grid shrink-0 items-end justify-items-center gap-2 max-[399px]:gap-1.5" style={{ gridTemplateColumns: columns }}>
					{cells.map((c, i) => (
						<Fragment key={i}>{c}</Fragment>
					))}
				</div>
			)}
		</div>
	);
}

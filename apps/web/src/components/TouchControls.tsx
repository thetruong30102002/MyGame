'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { setVirtualAxis, virtualInput, virtualPress } from '@/game/input/virtualInput';
import { useGameStore, type SkillSlot } from '@/store/useGameStore';
import { CooldownSweep, useCooldownLeft } from './CooldownSweep';
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

function ActionButton({ label, code, size = 'md', skill, badge, style, children }: { label: string; code: string; size?: 'lg' | 'md' | 'sm'; skill?: SkillSlot; badge?: ReactNode; style?: CSSProperties; children?: ReactNode }) {
	const mp = useGameStore((s) => s.stats.mp);
	const remain = useCooldownLeft(skill?.readyAt ?? 0);
	const dim = size === 'lg' ? 'h-20 w-20' : size === 'md' ? 'h-14 w-14' : 'h-11 w-11';
	const locked = !!skill?.locked;
	const noMp = !!skill && !locked && remain <= 0 && mp < skill.mpCost;
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
			style={{ ...style, boxShadow: glow ? `${STONE_SHADOW}, 0 0 12px -1px ${glow}, inset 0 0 10px ${glow}44` : STONE_SHADOW }}
			className={`pointer-events-auto ${style ? 'absolute' : 'relative'} ${dim} touch-none select-none rounded-full border-2 border-gold/75 bg-[radial-gradient(circle_at_50%_32%,#4b4853,#26242c_62%,#17161b)] active:translate-y-0.5 disabled:brightness-75`}
		>
			<span className={`absolute inset-0 flex items-center justify-center ${locked ? 'opacity-30 grayscale' : ''}`}>{children ?? (skill ? <SkillIcon skillId={skill.id} box={size === 'lg' ? 64 : 32} /> : null)}</span>
			{noMp && <span className="absolute inset-0 rounded-full bg-[#08122e]/60" />}
			{skill && <CooldownSweep remain={remain} total={skill.cooldown} round size={size} />}
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
 * Biểu tượng đổi mục tiêu: vòng tròn ba mũi tên nối đuôi (chủ dự án 10/10/2026). Hình TẠM vẽ bằng SVG nét vuông — có icon
 * PixelLab thì thay.
 */
function TargetCycleGlyph() {
	const arc = (a0: number): string => {
		const r = 11;
		const p = (a: number): string => `${(16 + r * Math.cos(a)).toFixed(1)} ${(16 + r * Math.sin(a)).toFixed(1)}`;
		const a1 = a0 + (Math.PI * 2) / 3 - 0.55;
		return `M ${p(a0)} A ${r} ${r} 0 0 1 ${p(a1)}`;
	};
	const head = (a: number): string => {
		const r = 11;
		const tip = a + (Math.PI * 2) / 3 - 0.35;
		const x = 16 + r * Math.cos(tip);
		const y = 16 + r * Math.sin(tip);
		const tx = -Math.sin(tip);
		const ty = Math.cos(tip);
		const back = (s: number): string => `${(x - tx * 5 + Math.cos(tip) * 4 * s).toFixed(1)} ${(y - ty * 5 + Math.sin(tip) * 4 * s).toFixed(1)}`;
		return `M ${x.toFixed(1)} ${y.toFixed(1)} L ${back(1)} L ${back(-1)} Z`;
	};
	const starts = [-Math.PI / 2, -Math.PI / 2 + (Math.PI * 2) / 3, -Math.PI / 2 + (Math.PI * 4) / 3];
	return (
		<svg viewBox="0 0 32 32" width={30} height={30} aria-hidden className="drop-shadow-[0_1px_0_rgb(0_0_0/0.8)]">
			{starts.map((a) => (
				<g key={a}>
					<path d={arc(a)} fill="none" stroke="#f3dfa8" strokeWidth={3} strokeLinecap="square" />
					<path d={head(a)} fill="#f3dfa8" />
				</g>
			))}
			<circle cx={16} cy={16} r={2.5} fill="#ff4d3d" />
		</svg>
	);
}

/** Bán kính (px) của nút theo cỡ: lg 80, md 56, sm 44. */
const BTN_R = { lg: 40, md: 28, sm: 22 } as const;
/**
 * Vị trí vòng cung quanh nút J (tâm J ở góc dưới phải): góc tính kiểu màn hình (0° = phải, 90° = xuống, 180° = trái, 270° =
 * lên). Vòng trong (nút vừa): Né · K · ô 1 · ô 2; vòng ngoài (nút nhỏ): ô 3–8. Bán kính / bước góc chọn để các nút không chạm
 * nhau và không lòi khỏi mép phải / mép dưới (kiểm ở `tests/touchLayout.test.ts`).
 */
export const TOUCH_ARC = {
	inner: { r: 88, angles: [170, 208.5, 247, 285.5] },
	outer: { r: 150, angles: [190, 207.6, 225.2, 242.8, 260.4, 278] },
} as const;
const arcPos = (r: number, deg: number): { dx: number; dy: number } => ({ dx: r * Math.cos((deg * Math.PI) / 180), dy: r * Math.sin((deg * Math.PI) / 180) });
/** Khung chứa cụm vòng cung (px): J ở góc dưới phải; đủ chỗ cho vòng ngoài. */
const ARC_BOX = 240;

/**
 * Điều khiển cảm ứng: cần gạt trái, cụm nút phải xếp VÒNG CUNG quanh nút J (chủ dự án 10/10/2026: "sửa lại giao diện khung skill
 * ở mobile … cần đẹp hơn và sắp xếp hợp lý hơn"). Ô kỹ năng cố định theo phím như thanh máy tính (ô chưa gán thì để trống chỗ).
 * Nút phụ (đổi mục tiêu, bình máu, Nói / Nhặt) gom một hàng cạnh cần gạt. Bấm nút = "nhấn phím" tương ứng qua virtualInput,
 * nên mọi luật của game (khoá theo tuổi, hồi chiêu, MP) áp y như bàn phím.
 */
export function TouchControls() {
	const touch = useTouchDevice();
	// Điện thoại ngang thấp: cụm nút thu nhỏ để đỉnh vòng ngoài xong trước chip nhiệm vụ (y≈152); màn dọc hẹp (< 400px) thu nhẹ
	// để vòng ngoài không đè lên cần gạt.
	const low = useMediaQuery('(max-height: 500px)');
	const narrow = useMediaQuery('(max-width: 399px)');
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
	const talk = hint ? (
		<ActionButton label={hint} code="KeyE" size="md">
			<span className="font-display text-[16px] leading-[1.45] font-extrabold text-white text-outline">{hint.startsWith('Nhặt') ? 'Nhặt' : hint.startsWith('Xem') ? 'Xem' : hint.startsWith('Mua') ? 'Mua' : hint.startsWith('Dùng') ? 'Dùng' : 'Nói'}</span>
		</ActionButton>
	) : null;
	if (hud === 'minimal') {
		return (
			<div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
				<Joystick />
				{talk && <div className="flex items-end">{talk}</div>}
			</div>
		);
	}
	const bySlot = (slot: number): SkillSlot | undefined => skills.find((s) => s.slot === slot);
	// Nút ở vị trí (dx, dy) so với tâm J — đặt tuyệt đối trong khung ARC_BOX (J nằm sát góc dưới phải khung).
	const at = (size: 'md' | 'sm', p: { dx: number; dy: number }): CSSProperties => ({
		right: BTN_R.lg - BTN_R[size] - p.dx,
		bottom: BTN_R.lg - BTN_R[size] - p.dy,
	});
	const ring: ReactNode[] = [];
	// Vòng trong: Né (chỉ HUD đủ) · K · ô 1 · ô 2.
	const innerItems: (number | 'dodge')[] = ['dodge', 1, 2, 3];
	innerItems.forEach((it, k) => {
		const style = at('md', arcPos(TOUCH_ARC.inner.r, TOUCH_ARC.inner.angles[k]!));
		if (it === 'dodge') {
			if (full)
				ring.push(
					<ActionButton key="dodge" label="Né" code="Space" size="md" style={style}>
						<SkillIcon skillId="dodge" box={32} />
					</ActionButton>,
				);
			return;
		}
		const s = bySlot(it);
		if (s) ring.push(<ActionButton key={s.id} label={s.name} code={s.code} size="md" skill={s} style={style} />);
	});
	// Vòng ngoài: ô 3–8 (chỉ số ô 4–9).
	TOUCH_ARC.outer.angles.forEach((deg, k) => {
		const s = bySlot(4 + k);
		if (s) ring.push(<ActionButton key={s.id} label={s.name} code={s.code} size="sm" skill={s} style={at('sm', arcPos(TOUCH_ARC.outer.r, deg))} />);
	});
	const j = bySlot(0);
	const scale = low ? 0.85 : narrow ? 0.9 : 1;
	return (
		<div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
			{/* Màn dọc: hàng nút phụ nằm TRÊN cần gạt; màn ngang thấp (chiều cao chật): nằm BÊN PHẢI cần gạt. */}
			<div className={`flex gap-2 ${low ? 'flex-row items-end' : 'flex-col-reverse items-start'}`}>
				<Joystick />
				<div className="flex items-end gap-2">
					<ActionButton label="Đổi mục tiêu" code="Tab" size="sm">
						<TargetCycleGlyph />
					</ActionButton>
					{full && (
						<ActionButton label="Uống thuốc" code="KeyR" size="sm" badge={potions}>
							<PixelIcon src="/assets/ui/icon_potion.png" w={35} h={44} box={INNER.sm} dim={potions <= 0} />
						</ActionButton>
					)}
					{talk}
				</div>
			</div>
			<div className="relative shrink-0 origin-bottom-right" style={{ width: ARC_BOX, height: ARC_BOX, transform: scale < 1 ? `scale(${scale})` : undefined }}>
				{ring}
				{j && <ActionButton key={j.id} label={j.name} code={j.code} size="lg" skill={j} style={{ right: 0, bottom: 0 }} />}
			</div>
		</div>
	);
}

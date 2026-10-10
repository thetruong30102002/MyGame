'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { REGIONS, regionDef } from '@aether/sim/regions';
import { CONTINENT, CONTINENT_PLACES, outlinePath, regionStatus, statusText, type RegionStatus } from '@/game/world/worldAtlas';
import { useGameStore } from '@/store/useGameStore';
import type { MapRoom } from './WorldMap';

/** Bề ngang thẻ vùng khi đè lên góc tranh. */
const CARD_W = 268;
/** Chỗ cho dòng gợi ý + thẻ vùng nằm DƯỚI tranh (màn hẹp: chữ của thẻ xuống dòng nhiều hơn). */
const DOCK = { wide: 172, narrow: 196 };
/** Thẻ nằm dưới tranh khi tranh vẫn còn thấy được ít nhất chừng này (px) — màn thấp hơn (điện thoại ngang) thì thẻ đè lên góc tranh. */
const DOCK_MIN_VIEW = 300;

/**
 * Viền chữ sẫm của nhãn vùng — đặt bằng style chứ không bằng lớp `text-outline`: tên lớp đó trùng màu `--color-outline` nên
 * Tailwind sinh THÊM `color: outline`, đè mọi màu chữ xếp trước nó theo vần (`text-gold-hi` thành chữ nâu sẫm).
 */
const INK_EDGE = { textShadow: '1px 0 #2a160c, -1px 0 #2a160c, 0 1px #2a160c, 0 -1px #2a160c' } as const;

/** Làm tối NHẸ vùng chưa mở (tranh vẫn phải xem được): đang xây dựng tối + nhạt màu hơn vùng đã có map mà cổng còn đóng. */
const VEIL = { building: 'saturate(0.6) brightness(0.7)', locked: 'saturate(0.85) brightness(0.84)' } as const;

/** Thẻ nhỏ của một vùng: tên, thứ tự + cấp, nguyên tố, nơi ở + một câu giới thiệu, trạng thái (+ nút sang tầng Vùng). */
function RegionCard({ id, status, onOpen, docked }: { id: string; status: RegionStatus; onOpen: (() => void) | null; docked: boolean }) {
	const r = regionDef(id);
	if (!r) return null;
	const tone = status.kind === 'here' || status.kind === 'open' ? 'text-leaf' : status.kind === 'locked' ? 'text-berry' : 'text-ink-soft';
	return (
		<div className={`ui-paper flex flex-col gap-0.5 px-3 py-2 text-ink-brown ${docked ? 'min-h-[134px]' : 'shadow-[0_3px_0_rgb(26_17_10/0.45)]'}`}>
			<p className="flex items-baseline gap-2">
				<span className="min-w-0 flex-1 truncate font-display text-label font-extrabold">{r.name}</span>
				<span className="shrink-0 text-note whitespace-nowrap text-ink-soft">
					Vùng {r.order} · <b className="text-ink-brown">cấp {r.levels[0]}–{r.levels[1]}</b>
				</span>
			</p>
			<p className="text-note">
				Nguyên tố <b>{r.element.name}</b> · quái yếu <b>{r.element.weak}</b>
			</p>
			{/* Tên nơi ở đã gồm loại (Thị trấn / Làng / Thành / Pháo đài…) — không ghi thêm "làng / toà thành". */}
			<p className="line-clamp-2 text-note text-ink-soft">
				<b className="text-ink-brown">{r.settlement.name}</b> — {r.intro}
			</p>
			<div className="mt-auto flex items-center gap-2 pt-0.5">
				<p className={`min-w-0 flex-1 text-body font-extrabold ${tone}`}>
					{status.kind === 'locked' ? (
						<>
							Cần <span className={status.levelOk ? 'text-leaf' : ''}>cấp {status.level}</span>
							{status.chief && (
								<>
									{' + '}
									<span className={status.chiefOk ? 'text-leaf' : ''}>hạ {status.chief}</span>
								</>
							)}
						</>
					) : (
						statusText(status)
					)}
				</p>
				{onOpen && (
					<button type="button" className="ui-chip shrink-0" onClick={onOpen}>
						Xem các map
					</button>
				)}
			</div>
		</div>
	);
}

/**
 * Tầng **Thế giới** của bản đồ lớn: tranh lục địa PixelLab (688×384) hiện NGUYÊN lần — 2× khi màn đủ chỗ, không thì 1× và cuộn
 * (điện thoại); nét pixel sắc. Đè lên bằng giao diện: nhãn tên + cấp 10 vùng, "Bạn ở đây", viền vàng vùng đang ở / đang rê, vùng
 * chưa mở làm tối (đang xây dựng tối hơn vùng đã có map mà cổng còn đóng). Rê / chạm vùng → thẻ nhỏ: tên, cấp, nguyên tố, nơi ở,
 * trạng thái (đang ở / đã mở / cần cấp + boss chúa vùng trước / đang xây dựng). Chuột: bấm vùng đang mở là sang tầng Vùng của vùng
 * đó; cảm ứng: chạm lần đầu chọn (hiện thẻ), chạm lại hoặc nút "Xem các map" mới sang. Toạ độ vùng: `game/world/worldAtlas.ts`.
 */
export function ContinentMap({ here, focus, room, touch, onOpenRegion }: { here: string; focus: string | null; room: MapRoom; touch: boolean; onOpenRegion: (region: string) => void }) {
	const level = useGameStore((s) => s.stats.level);
	const kills = useGameStore((s) => s.codex.kills);
	const [hover, setHover] = useState<string | null>(null);
	const [picked, setPicked] = useState<string | null>(focus);
	const [broken, setBroken] = useState(false);
	// Gợi ý "chạm / rê để xem" đè lên góc tranh (màn ngang thấp) tự ẩn sau vài giây hoặc khi đã chạm tranh — khỏi che nhãn vùng.
	const [hintGone, setHintGone] = useState(false);
	const [scroll, setScroll] = useState({ x: 0, y: 0 });
	const viewport = useRef<HTMLDivElement>(null);
	// Loại con trỏ của lần nhấn gần nhất + lúc nhấn xuống vùng đó ĐÃ được chọn chưa (ghi ở pointerdown — focus của nhãn chọn vùng
	// ngay trước click nên không đọc `picked` ở click được).
	const pointer = useRef('mouse');
	const armed = useRef(false);

	// 2× chỉ khi cả tranh lẫn thẻ dưới tranh vừa màn (không phải cuộn trên máy tính); còn lại 1×, thiếu chỗ thì cuộn.
	const s = room.w >= CONTINENT.width * 2 && room.h >= CONTINENT.height * 2 + DOCK.wide ? 2 : 1;
	const W = CONTINENT.width * s;
	const H = CONTINENT.height * s;
	const vw = Math.min(W, room.w);
	const dock = vw < 420 ? DOCK.narrow : DOCK.wide;
	const docked = room.h >= Math.min(H, DOCK_MIN_VIEW) + dock;
	const vh = Math.min(H, docked ? room.h - dock : room.h);

	const status = useMemo(() => Object.fromEntries(REGIONS.map((r) => [r.id, regionStatus(r.id, here, { level, bossKills: kills })])) as Record<string, RegionStatus>, [here, level, kills]);
	const veiled = (kind: RegionStatus['kind']): string[] => REGIONS.filter((r) => status[r.id]?.kind === kind).map((r) => r.id);
	const building = veiled('building');
	const locked = veiled('locked');
	const shown = hover ?? picked;
	const enterable = (id: string): boolean => {
		const k = status[id]?.kind;
		return (k === 'here' || k === 'open') && !!regionDef(id)?.ready;
	};

	// Mở ra căn giữa vùng đang đứng (hoặc vùng chọn sẵn) khi tranh lớn hơn khung.
	useLayoutEffect(() => {
		const el = viewport.current;
		const c = CONTINENT_PLACES[focus ?? here]?.center;
		if (!el || !c) return;
		el.scrollLeft = Math.max(0, c[0] * W - el.clientWidth / 2);
		el.scrollTop = Math.max(0, c[1] * H - el.clientHeight / 2);
		setScroll({ x: el.scrollLeft, y: el.scrollTop });
	}, [W, H, vw, vh, focus, here]);

	/** Bấm một vùng: chuột / bàn phím → vào luôn vùng đang mở; cảm ứng → lần đầu chỉ chọn (hiện thẻ), chạm lại vùng đã chọn mới vào. */
	useEffect(() => {
		const t = window.setTimeout(() => setHintGone(true), 4500);
		return () => window.clearTimeout(t);
	}, []);

	const activate = (id: string, keyboard: boolean): void => {
		const viaTouch = !keyboard && (pointer.current === 'touch' || pointer.current === 'pen');
		if (enterable(id) && (!viaTouch || armed.current)) return onOpenRegion(id);
		setPicked(id);
	};
	const press = (id: string) => (e: React.PointerEvent): void => {
		pointer.current = e.pointerType;
		armed.current = picked === id;
		setHintGone(true);
	};
	const hoverOn = (id: string) => (e: React.PointerEvent): void => {
		if (e.pointerType === 'mouse') setHover(id);
	};
	const hoverOff = (e: React.PointerEvent): void => {
		if (e.pointerType === 'mouse') setHover(null);
	};

	// Thẻ đè lên góc xa vùng đang xem nhất (trong phần tranh đang thấy). Dư chỗ dưới tranh (máy tính, điện thoại dọc) thì thẻ nằm dưới
	// tranh, chưa rê / chọn vùng nào thì là thẻ vùng đang đứng — khung không co giãn theo từng lần rê chuột.
	const c = shown ? CONTINENT_PLACES[shown]?.center : undefined;
	const right = c ? c[0] * W - scroll.x < vw / 2 : true;
	const bottom = c ? c[1] * H - scroll.y < vh / 2 : true;
	const cardOf = (id: string | null) => (id && status[id] ? <RegionCard id={id} status={status[id]!} docked={docked} onOpen={enterable(id) ? () => onOpenRegion(id) : null} /> : null);
	const card = cardOf(shown);
	const hint = touch ? 'Chạm vào một vùng để xem' : 'Rê chuột lên một vùng để xem';

	if (broken) {
		return (
			<p className="ui-tray px-4 py-6 text-center text-body text-ink-soft" style={{ width: Math.min(room.w, 380) }}>
				Chưa tải được tranh lục địa — thử mở lại sau.
			</p>
		);
	}

	return (
		<>
			<div className="relative shrink-0 self-center overflow-hidden rounded-[4px] ring-2 ring-bark" style={{ width: vw, height: vh }}>
				<div
					ref={viewport}
					className="absolute inset-0 touch-pan-x touch-pan-y overflow-auto overscroll-contain [scrollbar-color:var(--color-paper-line)_transparent] [scrollbar-width:thin]"
					onScroll={(e) => setScroll({ x: e.currentTarget.scrollLeft, y: e.currentTarget.scrollTop })}
				>
					<div className="relative" style={{ width: W, height: H }} onClick={() => setPicked(null)}>
						<img src={CONTINENT.url} alt="Tranh lục địa Aether" width={W} height={H} draggable={false} onError={() => setBroken(true)} className="pixel-img absolute inset-0 max-w-none select-none" />
						{building.length > 0 && (
							<img src={CONTINENT.url} alt="" aria-hidden="true" width={W} height={H} draggable={false} className="pixel-img pointer-events-none absolute inset-0 max-w-none" style={{ clipPath: `path('${outlinePath(building, W, H)}')`, filter: VEIL.building }} />
						)}
						{locked.length > 0 && (
							<img src={CONTINENT.url} alt="" aria-hidden="true" width={W} height={H} draggable={false} className="pixel-img pointer-events-none absolute inset-0 max-w-none" style={{ clipPath: `path('${outlinePath(locked, W, H)}')`, filter: VEIL.locked }} />
						)}
						<svg className="absolute inset-0" width={W} height={H} viewBox="0 0 1 1" preserveAspectRatio="none">
							{REGIONS.map((r) => {
								const p = CONTINENT_PLACES[r.id];
								if (!p) return null;
								const pts = p.outline.map(([x, y]) => `${x},${y}`).join(' ');
								const on = shown === r.id;
								const me = r.id === here;
								return (
									<g key={r.id}>
										{(on || me) && <polygon points={pts} fill={on ? 'rgba(255,236,179,0.16)' : 'none'} stroke="rgba(42,22,12,0.8)" strokeWidth={on ? 5 : 4} strokeLinejoin="round" vectorEffect="non-scaling-stroke" pointerEvents="none" />}
										<polygon
											points={pts}
											fill="transparent"
											stroke={on ? '#ffd166' : me ? 'rgba(255,209,102,0.9)' : 'none'}
											strokeWidth={on ? 2.5 : 1.5}
											strokeLinejoin="round"
											vectorEffect="non-scaling-stroke"
											pointerEvents="all"
											className="cursor-pointer"
											onPointerEnter={hoverOn(r.id)}
											onPointerLeave={hoverOff}
											onPointerDown={press(r.id)}
											onClick={(e) => {
												e.stopPropagation();
												activate(r.id, false);
											}}
										/>
									</g>
								);
							})}
						</svg>
						{REGIONS.map((r) => {
							const p = CONTINENT_PLACES[r.id];
							const st = status[r.id];
							if (!p || !st) return null;
							const veil = st.kind === 'building' || st.kind === 'locked';
							// Nhãn chữ trên nền sẫm trong mờ: đọc được cả trên tuyết / đồng cỏ sáng.
							return (
								<button
									key={r.id}
									type="button"
									data-region={r.id}
									aria-label={`${r.name} — cấp ${r.levels[0]}–${r.levels[1]} — ${statusText(st)}`}
									className={`absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-[6px] outline-none focus-visible:ring-2 focus-visible:ring-gold-hi ${s === 2 ? 'px-2 py-0.5' : 'px-1.5 py-px'} ${shown === r.id ? 'bg-[#1a110a]/70' : 'bg-[#1a110a]/45'}`}
									style={{ left: p.center[0] * W, top: p.center[1] * H }}
									onPointerEnter={hoverOn(r.id)}
									onPointerLeave={hoverOff}
									onPointerDown={press(r.id)}
									onFocus={() => setPicked(r.id)}
									onClick={(e) => {
										e.stopPropagation();
										// detail 0 = click sinh từ phím Enter / Space trên nhãn (đã focus = đã chọn).
										activate(r.id, e.detail === 0);
									}}
								>
									<span className={`whitespace-nowrap font-display font-extrabold ${s === 2 ? 'text-[19px] leading-[23px]' : 'text-[13px] leading-[16px]'} ${veil ? 'text-parchment' : 'text-white'}`} style={INK_EDGE}>
										{r.name}
									</span>
									<span className={`whitespace-nowrap font-bold ${s === 2 ? 'text-[14px] leading-[18px]' : 'text-[12px] leading-[14px]'} ${veil ? 'text-parchment-dim' : 'text-gold-hi'}`} style={INK_EDGE}>
										Cấp {r.levels[0]}–{r.levels[1]}
									</span>
									{st.kind === 'here' && <span className="ui-tag mt-0.5 h-5 border-2 border-outline bg-gold text-ink-brown">Bạn ở đây</span>}
								</button>
							);
						})}
					</div>
				</div>
				{!docked && card && (
					<div className={`pointer-events-auto absolute z-[1] ${right ? 'right-2' : 'left-2'} ${bottom ? 'bottom-2' : 'top-2'}`} style={{ width: Math.min(CARD_W, vw - 16) }}>
						{card}
					</div>
				)}
				{!docked && !card && !hintGone && <span className="ui-tag pointer-events-none absolute bottom-2 left-1/2 h-6 -translate-x-1/2 bg-bark/90 text-parchment">{hint}</span>}
			</div>
			{docked && (
				// Chặn trần bằng chỗ đã chừa: thẻ dài hơn dự tính thì cuộn trong khung chứ không đẩy khung tràn khỏi màn.
				<div className="mt-1 flex touch-pan-y flex-col self-center overflow-y-auto overscroll-contain" style={{ width: vw, maxHeight: dock - 4 }}>
					<p className="mb-1 truncate px-1 text-note text-ink-soft">{hint} · vùng tối là chưa mở.</p>
					{card ?? cardOf(here)}
				</div>
			)}
		</>
	);
}

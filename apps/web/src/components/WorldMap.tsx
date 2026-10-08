'use client';

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { DIRECTION_DEG, PlayerArrow } from './Minimap';
import { useViewport } from './useMediaQuery';
import { useTouchDevice } from './TouchControls';

/** Phím M / Esc không được cướp phím khi đang gõ chat. */
const typingIn = (t: EventTarget | null): boolean => t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement;

/** Khung gỗ `.ui-frame`: viền 18px + đệm 4px mỗi bên. */
const FRAME = 2 * (18 + 4);
/**
 * Bề ngang tối thiểu của khung: hàng tiêu đề phải chứa dải "Bản đồ" + nút Đóng (+ gợi ý phím trên máy tính, nút
 * thoát trên cảm ứng). Ảnh bản đồ nhỏ (đền ~180px) thì nằm giữa khung thay vì để hàng tiêu đề tràn ra.
 */
const MIN_W_TOUCH = 360;
const MIN_W_DESK = 330;

/**
 * Bản đồ lớn (lớp phủ z-15: trên chat và cần gạt, DƯỚI thoại/thẻ z-20 — không bao giờ chặn truyện, và tự đóng
 * khi thoại/thẻ hiện lên). Không dừng game. Nuốt mọi cú chạm nên chạm lên bản đồ không thành đòn đánh.
 * Đóng: nút Đóng, Esc, M, hoặc chạm ra ngoài khung — đóng ở `click` của chính lớp nền (chạm xuống VÀ nhấc lên trên nền),
 * không ở pointerdown: đóng sớm thì cú click sinh sau touchend rơi xuống thứ nằm dưới (bản đồ nhỏ mở lại, ô nhiệm vụ
 * bắt đầu tự đi).
 */
/**
 * Tâm nhãn tên khu kẹp vào trong ảnh: khu sát mép (bìa rừng phía tây…) có tâm gần mép, nhãn căn giữa sẽ lòi nửa chữ ra
 * ngoài khung (điện thoại thu nhỏ hay gặp). Bề ngang nhãn ước theo số ký tự (font hiển thị ~0,55em mỗi ký tự).
 */
function clampLabel(x: number, text: string, px: number, width: number): number {
	const half = (text.length * px * 0.55) / 2 + 4;
	return half * 2 >= width ? width / 2 : Math.min(width - half, Math.max(half, x));
}

export function WorldMap() {
	const open = useGameStore((s) => s.mapOpen);
	const setMapOpen = useGameStore((s) => s.setMapOpen);
	const info = useGameStore((s) => s.mapInfo);
	const story = useGameStore((s) => !!s.dialogue || !!s.card);
	const scene = useGameStore((s) => s.scene);
	// `mapInfo` còn là của lượt chơi trước trong lúc nạp thế giới mới — chưa sẵn sàng thì không mở.
	const ready = useGameStore((s) => s.status === 'ready');
	const pos = useGameStore((s) => s.position);
	const dir = useGameStore((s) => s.direction);
	const markers = useGameStore((s) => s.mapMarkers);
	const auto = useGameStore((s) => s.autoWalk);
	const quests = useGameStore((s) => s.quests);
	const requestAutoWalk = useGameStore((s) => s.requestAutoWalk);
	const downOnBackdrop = useRef(false);
	const touch = useTouchDevice();
	const vp = useViewport();
	const visible = open && !!info && ready && scene === 'play' && !story;

	useEffect(() => {
		if (open && (story || scene !== 'play' || !ready)) setMapOpen(false);
	}, [open, story, scene, ready, setMapOpen]);

	useEffect(() => {
		const onKey = (e: KeyboardEvent): void => {
			if (typingIn(e.target) || e.repeat) return;
			const st = useGameStore.getState();
			if (st.dialogue || st.card || st.scene !== 'play' || st.status !== 'ready' || !st.mapInfo) return;
			if (e.code === 'KeyM') st.setMapOpen(!st.mapOpen);
			else if (e.code === 'Escape' && st.mapOpen) st.setMapOpen(false);
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, []);

	if (!visible || !info) return null;
	// Phóng ảnh 1/8 theo màn: ≥1 thì làm tròn xuống số nguyên + giữ nét pixel; <1 (điện thoại) thì thu mượt.
	// Phần trừ hao: lề ngoài 16 + khung gỗ 44; chiều cao thêm hàng tiêu đề (50) và hàng nhiệm vụ (tới ~74 khi mục tiêu dài
	// 2 dòng) — thiếu thì khung kẹp max-h-full và hàng nhiệm vụ lòi ra dưới viền gỗ.
	const raw = Math.min((vp.w - 16 - FRAME) / info.imgW, (vp.h - 184) / info.imgH);
	const k = raw >= 1 ? Math.floor(raw) : Math.max(0.3, raw);
	const dw = Math.round(info.imgW * k);
	const dh = Math.round(info.imgH * k);
	const f = info.scale * k;
	const quest = quests.find((q) => !q.done);
	const q = markers.quest;
	const tiny = k < 1;
	const close = (): void => setMapOpen(false);

	return (
		<div
			className="pointer-events-auto absolute inset-0 z-[15] flex touch-none items-center justify-center bg-[#1a110a]/55 p-2"
			onPointerDown={(e) => {
				downOnBackdrop.current = e.target === e.currentTarget;
			}}
			onClick={(e) => {
				if (downOnBackdrop.current && e.target === e.currentTarget) close();
				downOnBackdrop.current = false;
			}}
			onContextMenu={(e) => e.preventDefault()}
		>
			<div role="dialog" aria-modal="true" aria-label="Bản đồ" className="ui-frame relative flex max-h-full max-w-full flex-col p-1 select-none" style={{ width: Math.max(dw + FRAME, touch ? MIN_W_TOUCH : MIN_W_DESK) }}>
				<div className="mb-1.5 flex items-center gap-2">
					{/*
					 * Dải cuộn giấy cao 57px (1× ảnh gốc) lấn lên viền gỗ trên — treo trên khung, hàng tiêu đề vẫn chỉ cao bằng nút Đóng.
					 * Được co (chữ thành "Bản…") chứ không để hàng tràn: điện thoại hẹp lúc nút thoát "lên cò" dài ra. Dải co ít hơn
					 * phần nút nở thêm nên chỗ vừa chạm vẫn nằm trong nút → lần chạm thứ hai không trượt.
					 */}
					<p className="ui-banner -mt-[22px] h-[57px] min-w-0 px-1 text-label">
						<span className="truncate leading-[1.45]">Bản đồ</span>
					</p>
					<span className="hidden text-note text-ink-soft sm:block">Nhấn M hoặc Esc để gấp lại</span>
					<button type="button" aria-label="Đóng bản đồ" onClick={close} className="ui-chip ml-auto min-h-11 shrink-0">
						Đóng
					</button>
				</div>
				<div className="relative shrink-0 self-center overflow-hidden rounded-[4px] ring-2 ring-bark" style={{ width: dw, height: dh }}>
					<img src={info.url} alt="Bản đồ Thistlewood" draggable={false} className="absolute inset-0 h-full w-full max-w-none" style={{ imageRendering: k >= 1 ? 'pixelated' : 'auto' }} />
					<svg className="absolute inset-0" width={dw} height={dh} viewBox={`0 0 ${info.worldW} ${info.worldH}`} preserveAspectRatio="none">
						{q?.r && <circle cx={q.x} cy={q.y} r={q.r} fill="rgba(250,204,21,0.14)" stroke="rgba(250,204,21,0.6)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />}
						{auto && (
							<polyline
								points={[pos, ...auto.path].map((p) => `${p.x},${p.y}`).join(' ')}
								fill="none"
								stroke="#facc15"
								strokeWidth="2"
								strokeDasharray="5 4"
								strokeLinecap="round"
								vectorEffect="non-scaling-stroke"
							/>
						)}
					</svg>
					{info.areas.map((a) => (
						<span
							key={a.name}
							className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-display font-extrabold text-white text-outline ${tiny ? 'text-[12px]' : 'text-[16px]'}`}
							style={{ left: clampLabel(a.x * f, a.name, tiny ? 12 : 16, dw), top: a.y * f }}
						>
							{a.name}
						</span>
					))}
					{/* Bản đồ thu nhỏ (điện thoại): ẩn nhãn mốc và tên NPC thay vì ép chữ xuống dưới 12px. */}
					{!tiny &&
						info.landmarks.map((l) => (
							<span key={l.id} className="ui-tag pointer-events-none absolute h-5 -translate-x-1/2 -translate-y-1/2 bg-bark/85 text-parchment" style={{ left: l.x * f, top: l.y * f }}>
								{l.name}
							</span>
						))}
					{markers.npcs.map((n) => (
						<span key={n.key} className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-0.5" style={{ left: n.x * f, top: n.y * f }}>
							<span className="h-2 w-2 rounded-full bg-white ring-1 ring-outline" />
							{!tiny && <span className="whitespace-nowrap text-[12px] font-bold text-white text-outline">{n.name}</span>}
						</span>
					))}
					{markers.remotes.map((r, i) => (
						<span key={`${r.name}-${i}`} className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-0.5" style={{ left: r.x * f, top: r.y * f }}>
							<span className="h-2 w-2 rounded-full bg-sky ring-1 ring-outline" />
							{!tiny && <span className="whitespace-nowrap text-[12px] font-bold text-sky text-outline">{r.name}</span>}
						</span>
					))}
					{q && (
						<span className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={{ left: q.x * f, top: q.y * f }}>
							<span className="h-2.5 w-2.5 rounded-full bg-gold ring-2 ring-outline" />
							<span className="ui-tag mt-0.5 h-5 bg-gold text-ink-brown">{q.label}</span>
						</span>
					)}
					<span className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2" style={{ left: pos.x * f, top: pos.y * f }}>
						<PlayerArrow deg={DIRECTION_DEG[dir] ?? 90} size={tiny ? 14 : 18} />
					</span>
				</div>
				{quest && (
					<div className="ui-tray mt-2 flex items-center gap-2 px-3 py-2">
						<div className="min-w-0 flex-1">
							<p className="truncate text-read font-extrabold">{quest.title}</p>
							<p className="line-clamp-2 text-body text-ink-soft">{quest.objective}</p>
						</div>
						{q && (
							<button
								type="button"
								onClick={() => {
									requestAutoWalk('start');
									close();
								}}
								className="ui-btn shrink-0"
							>
								Dẫn đường
							</button>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

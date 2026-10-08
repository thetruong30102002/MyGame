'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useGameStore, type PanelId } from '@/store/useGameStore';
import { Toasts } from './Hud';

/**
 * Khung cửa sổ của NPC dịch vụ / tiện ích ngoài Hành trang (Bia Danh Vọng, quầy Bram, lịch điểm danh): lớp phủ z-15 như bảng
 * Hành trang — Esc / chạm nền để đóng, tự đóng khi truyện chen vào, người chơi đứng yên lúc mở (`canAct`). Chỉ vẽ khi
 * `panel === id`. `onOpen` chạy mỗi lần mở (xin số liệu mới từ máy chủ).
 */
export function ServiceWindow({ id, title, subtitle, aside, onOpen, children }: { id: PanelId; title: string; subtitle?: string; aside?: ReactNode; onOpen?: () => void; children: ReactNode }) {
	const panel = useGameStore((s) => s.panel);
	const setPanel = useGameStore((s) => s.setPanel);
	const story = useGameStore((s) => !!s.dialogue || !!s.card);
	const scene = useGameStore((s) => s.scene);
	const ready = useGameStore((s) => s.status === 'ready');
	const downOnBackdrop = useRef(false);
	const closeBtn = useRef<HTMLButtonElement>(null);
	const open = panel === id;
	const visible = open && ready && scene === 'play' && !story;
	const opened = useRef(onOpen);
	opened.current = onOpen;

	useEffect(() => {
		if (open && (story || scene !== 'play' || !ready)) setPanel(null);
	}, [open, story, scene, ready, setPanel]);

	useEffect(() => {
		if (!visible) return undefined;
		opened.current?.();
		closeBtn.current?.focus({ preventScroll: true });
		const onKey = (e: KeyboardEvent): void => {
			if (e.code === 'Escape') setPanel(null);
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [visible, setPanel]);

	if (!visible) return null;
	const close = (): void => setPanel(null);
	const titleId = `${id}-title`;

	return (
		<div
			className="pointer-events-auto absolute inset-0 z-[15] flex touch-none items-center justify-center bg-[#1a110a]/55 p-[max(6px,env(safe-area-inset-top))] sm:p-3"
			onPointerDown={(e) => {
				downOnBackdrop.current = e.target === e.currentTarget;
			}}
			onClick={(e) => {
				if (downOnBackdrop.current && e.target === e.currentTarget) close();
				downOnBackdrop.current = false;
			}}
			onContextMenu={(e) => e.preventDefault()}
		>
			<div role="dialog" aria-modal="true" aria-labelledby={titleId} className="ui-frame relative flex h-full max-h-full w-full max-w-[720px] flex-col select-none sm:h-[min(100%,640px)]">
				<div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b-2 border-wood-edge px-1 pb-2">
					<h2 id={titleId} className="font-display text-head font-extrabold leading-tight text-ink-brown sm:text-title">
						{title}
					</h2>
					<span className="ml-auto flex shrink-0 items-center gap-2">{aside}</span>
					<button ref={closeBtn} type="button" aria-label="Đóng bảng" title="Esc" onClick={close} className="ui-chip shrink-0">
						Đóng
					</button>
					{subtitle && <p className="w-full text-note text-ink-soft">{subtitle}</p>}
				</div>
				<div className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-2 pt-3 pb-5 text-body text-ink-brown [scrollbar-color:var(--color-paper-line)_transparent] [scrollbar-width:thin] sm:px-3">
					{children}
				</div>
				<div className="pointer-events-none absolute inset-x-0 bottom-3 z-40 flex justify-center px-3">
					<Toasts max={2} center />
				</div>
			</div>
		</div>
	);
}

/** Số kim cương kèm icon (icon TẠM — `items.UI_TEMP_ICON`). */
export function DiamondCount({ n, size = 'md' }: { n: number; size?: 'md' | 'lg' }) {
	return (
		<span className="flex items-center gap-1" title="Kim cương">
			<img src="/assets/ui/icon_diamond.png" width={size === 'lg' ? 44 : 22} height={size === 'lg' ? 36 : 18} alt="" draggable={false} className="pixel-img max-w-none" />
			<b className={`font-extrabold tabular-nums ${size === 'lg' ? 'text-[18px]' : 'text-label'}`}>{n}</b>
			<span className="text-note text-ink-soft">kim cương</span>
		</span>
	);
}

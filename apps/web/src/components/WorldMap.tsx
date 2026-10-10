'use client';

import { useEffect, useRef, useState } from 'react';
import { useGameStore, type MapTab } from '@/store/useGameStore';
import { useViewport } from './useMediaQuery';
import { useTouchDevice } from './TouchControls';
import { AreaMap } from './WorldMapArea';
import { RegionMap } from './WorldMapRegion';
import { ContinentMap } from './WorldMapWorld';

/** Phím M / Esc không được cướp phím khi đang gõ chat. */
const typingIn = (t: EventTarget | null): boolean => t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement;

/** Khung gỗ `.ui-frame`: viền 18px + đệm 4px mỗi bên. */
const FRAME = 2 * (18 + 4);
/** Lề lớp phủ (`p-2`) mỗi bên. */
const EDGE = 8;
/** Hàng thẻ (`ui-tab` cao 48 + viền dưới 2) + khoảng cách xuống nội dung. */
const HEADER = 58;

const TABS: { id: MapTab; label: string; hint: string }[] = [
	{ id: 'area', label: 'Khu vực', hint: 'Map đang đứng' },
	{ id: 'region', label: 'Vùng', hint: 'Các map của vùng' },
	{ id: 'world', label: 'Thế giới', hint: 'Tranh lục địa — 10 vùng' },
];

/** Chỗ còn lại cho nội dung một tầng (css px): màn trừ lề lớp phủ, khung gỗ, hàng thẻ. */
export interface MapRoom {
	w: number;
	h: number;
}

/**
 * Bản đồ lớn (phím M / chạm bản đồ nhỏ) — ba tầng xem, chuyển bằng thẻ: **Khu vực** (map đang đứng, như trước), **Vùng** (sơ đồ các
 * map của vùng: đường nối, map đang đứng, khoảng cấp, map chưa tới mờ đi), **Thế giới** (tranh lục địa PixelLab, 10 vùng). Mở lần đầu
 * là Khu vực, sau đó nhớ tầng đã chọn trong phiên (`mapTab` của store). Chạm vùng đang mở trên tầng Thế giới → tầng Vùng của vùng đó;
 * chạm cổng sang vùng khác trên sơ đồ → tầng Thế giới, chọn sẵn vùng đó.
 *
 * Lớp phủ z-15: trên chat và cần gạt, DƯỚI thoại/thẻ z-20 — không bao giờ chặn truyện, và tự đóng khi thoại/thẻ hiện lên. Không
 * dừng game. Nuốt mọi cú chạm nên chạm lên bản đồ không thành đòn đánh (vùng cuộn của từng tầng tự xin lại cử chỉ vuốt).
 * Đóng: nút Đóng, Esc, M, hoặc chạm ra ngoài khung — đóng ở `click` của chính lớp nền (chạm xuống VÀ nhấc lên trên nền), không ở
 * pointerdown: đóng sớm thì cú click sinh sau touchend rơi xuống thứ nằm dưới (bản đồ nhỏ mở lại, ô nhiệm vụ bắt đầu tự đi).
 * Khung ôm vừa nội dung (`w-fit`): bề ngang tối thiểu là hàng thẻ + nút Đóng.
 */
export function WorldMap() {
	const open = useGameStore((s) => s.mapOpen);
	const setMapOpen = useGameStore((s) => s.setMapOpen);
	const info = useGameStore((s) => s.mapInfo);
	const story = useGameStore((s) => !!s.dialogue || !!s.card);
	const scene = useGameStore((s) => s.scene);
	// `mapInfo` còn là của lượt chơi trước trong lúc nạp thế giới mới — chưa sẵn sàng thì không mở.
	const ready = useGameStore((s) => s.status === 'ready');
	const tab = useGameStore((s) => s.mapTab);
	const setTab = useGameStore((s) => s.setMapTab);
	// Tầng Vùng xem vùng nào (null = vùng đang đứng) · tầng Thế giới chọn sẵn vùng nào (bấm cổng trên sơ đồ). Mỗi lần mở lại về mặc định.
	const [viewRegion, setViewRegion] = useState<string | null>(null);
	const [focusRegion, setFocusRegion] = useState<string | null>(null);
	const downOnBackdrop = useRef(false);
	const activeTab = useRef<HTMLButtonElement>(null);
	const touch = useTouchDevice();
	const vp = useViewport();
	const visible = open && !!info && ready && scene === 'play' && !story;

	useEffect(() => {
		if (open && (story || scene !== 'play' || !ready)) setMapOpen(false);
	}, [open, story, scene, ready, setMapOpen]);

	useEffect(() => {
		if (!open) return;
		setViewRegion(null);
		setFocusRegion(null);
	}, [open]);

	// Đưa focus vào khung: để nguyên trên nút HUD vừa bấm (nằm dưới lớp phủ) thì Enter / Space bấm nhầm thứ phía sau.
	useEffect(() => {
		if (visible) activeTab.current?.focus({ preventScroll: true });
	}, [visible]);

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
	const close = (): void => setMapOpen(false);
	const room: MapRoom = { w: Math.max(200, vp.w - 2 * EDGE - FRAME), h: Math.max(160, vp.h - 2 * EDGE - FRAME - HEADER) };
	const active = TABS.find((t) => t.id === tab) ?? TABS[0]!;

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
			<div role="dialog" aria-modal="true" aria-labelledby="world-map-title" className="ui-frame relative flex max-h-full w-fit max-w-full flex-col p-1 select-none">
				<h2 id="world-map-title" className="sr-only">
					Bản đồ · {active.label}
				</h2>
				<div className="ui-tabs mb-2 flex-nowrap px-0.5">
					<div role="tablist" aria-label="Tầng bản đồ" className="flex min-w-0 items-end gap-1 sm:gap-1.5">
						{TABS.map((t) => {
							const on = t.id === active.id;
							return (
								<button
									key={t.id}
									ref={on ? activeTab : undefined}
									type="button"
									role="tab"
									aria-selected={on}
									title={t.hint}
									onClick={() => {
										if (t.id === 'region') setViewRegion(null);
										if (t.id === 'world') setFocusRegion(null);
										setTab(t.id);
									}}
									className="ui-tab shrink-0 justify-center px-2 max-[379px]:px-1.5 max-[379px]:text-[15px] sm:px-3"
								>
									<span className="whitespace-nowrap leading-[1.45]">{t.label}</span>
								</button>
							);
						})}
					</div>
					{!touch && <span className="mb-2.5 ml-auto hidden pl-3 text-note whitespace-nowrap text-ink-soft lg:block">M hoặc Esc để gấp lại</span>}
					<button type="button" aria-label="Đóng bản đồ" title="M / Esc" onClick={close} className={`ui-chip mb-1.5 ml-auto shrink-0 max-[379px]:px-2 lg:ml-3 ${touch ? 'min-h-11' : ''}`}>
						Đóng
					</button>
				</div>
				<div role="tabpanel" aria-label={active.hint} className="flex min-h-0 flex-col">
					{active.id === 'area' && <AreaMap info={info} room={room} close={close} />}
					{active.id === 'region' && (
						<RegionMap
							region={viewRegion ?? info.region}
							here={info}
							room={room}
							onGate={(r) => {
								setFocusRegion(r);
								setTab('world');
							}}
						/>
					)}
					{active.id === 'world' && (
						<ContinentMap
							here={info.region}
							focus={focusRegion}
							room={room}
							touch={touch}
							onOpenRegion={(r) => {
								setViewRegion(r);
								setTab('region');
							}}
						/>
					)}
				</div>
			</div>
		</div>
	);
}

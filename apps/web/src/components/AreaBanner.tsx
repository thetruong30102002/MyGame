'use client';

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { useTouchDevice } from './TouchControls';
import { useMediaQuery } from './useMediaQuery';

/** Điện thoại ngang thấp (khớp Hud): bảng tên rộng 300px từ lề 12px, bản đồ nhỏ rộng 112px sát lề phải 12px. */
const LOW_FRAME_RIGHT = 12 + 300;
const LOW_MINIMAP_RIGHT = 12 + 112;
const LOW_GAP = 12;
/** Toast ở màn ngang thấp nằm cùng dải trên với băng rôn → lùi xuống trong lúc băng rôn hiện (Hud đọc biến này). */
const CLEAR_VAR = '--area-banner-clear';

/**
 * Băng rôn tên vùng hiện 3 giây mỗi lần bước qua ranh giới vùng — dải cuộn giấy `.ui-banner` đúng 1× ảnh gốc (cao 57px)
 * trên mọi màn: phóng 2× cho máy tính thì to hơn nhưng lệch cỡ điểm ảnh với mọi khung khác trên màn.
 */
export function AreaBanner() {
	const area = useGameStore((s) => s.area);
	const changedAt = useGameStore((s) => s.areaChangedAt);
	const [visible, setVisible] = useState(false);
	// Điện thoại dọc: neo ngay dưới hai cột HUD trên (Hud ghi `--hud-clear-top`), không đoán theo % — ô nhiệm vụ cao thêm
	// dòng "Đang tự đi…" đúng lúc băng qua ranh giới vùng. Điện thoại ngang thấp (người chơi chọn 08/10/2026): ở DẢI TRÊN
	// như màn dọc — dưới HUD không còn chỗ (giữa màn là nhân vật, hai bên là cần gạt + cụm nút), nên nằm cùng hàng với bảng
	// tên và bản đồ nhỏ, tâm càng sát giữa màn càng tốt mà không đè lên hai khung đó (đo bề ngang thật của băng rôn).
	const touch = useTouchDevice();
	const low = useMediaQuery('(max-height: 500px)') && touch;
	const box = useRef<HTMLDivElement>(null);
	const [lowLeft, setLowLeft] = useState<number | null>(null);

	useEffect(() => {
		if (!area) return undefined;
		setVisible(true);
		const t = setTimeout(() => setVisible(false), 3000);
		return () => clearTimeout(t);
	}, [area, changedAt]);

	useLayoutEffect(() => {
		if (!low || !box.current) return setLowLeft(null);
		const w = box.current.offsetWidth;
		const minLeft = LOW_FRAME_RIGHT + LOW_GAP;
		const maxLeft = window.innerWidth - LOW_MINIMAP_RIGHT - LOW_GAP - w;
		setLowLeft(Math.round(Math.max(minLeft, Math.min(maxLeft, window.innerWidth / 2 - w / 2))));
	}, [low, area, changedAt]);

	useEffect(() => {
		const root = document.documentElement.style;
		if (low && visible) root.setProperty(CLEAR_VAR, '64px');
		else root.removeProperty(CLEAR_VAR);
		return () => {
			root.removeProperty(CLEAR_VAR);
		};
	}, [low, visible]);

	const place = !touch
		? 'left-1/2 top-[16%] -translate-x-1/2'
		: low
			? 'top-[max(12px,env(safe-area-inset-top))]'
			: 'left-1/2 top-[calc(var(--hud-clear-top,30%)+12px)] max-w-[calc(100vw-24px)] -translate-x-1/2';
	// Chưa đo xong thì đứng ở giữa (ẩn sẵn, chỉ một khung hình) — đo được là đặt đúng chỗ trước khi hiện.
	const style: CSSProperties | undefined = low
		? { left: lowLeft ?? '50%', maxWidth: `calc(100vw - ${LOW_FRAME_RIGHT + LOW_MINIMAP_RIGHT + LOW_GAP * 2}px)` }
		: undefined;

	return (
		<div
			ref={box}
			style={style}
			className={`pointer-events-none absolute w-max ${place} text-center transition-[opacity,translate] duration-700 ${visible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'}`}
		>
			<p className={`ui-banner h-[57px] max-w-full px-2 drop-shadow-[0_3px_0_rgba(26,17,10,0.45)] ${!touch ? 'text-[26px]' : low ? 'text-[17px]' : 'text-head'}`}>
				<span className="truncate leading-[1.45]">{area}</span>
			</p>
		</div>
	);
}

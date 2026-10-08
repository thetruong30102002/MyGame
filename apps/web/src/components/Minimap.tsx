'use client';

import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';

/** Góc xoay (độ, 0 = hướng đông, chiều kim đồng hồ vì trục y hướng xuống) của 8 hướng nhân vật. */
export const DIRECTION_DEG: Record<string, number> = { E: 0, SE: 45, S: 90, SW: 135, W: 180, NW: 225, N: 270, NE: 315 };

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

/** Mũi tên vàng = mình, mũi nhọn chỉ hướng đang nhìn. */
export function PlayerArrow({ deg, size = 12 }: { deg: number; size?: number }) {
	return (
		<svg width={size} height={size} viewBox="-6 -6 12 12" style={{ transform: `rotate(${deg}deg)` }} className="drop-shadow-[0_0_2px_rgba(0,0,0,0.9)]">
			<path d="M5.5 0 L-4.5 -4.5 L-2 0 L-4.5 4.5 Z" fill="#facc15" stroke="#1c1917" strokeWidth="1" strokeLinejoin="round" />
		</svg>
	);
}

/**
 * Bản đồ nhỏ góc trên phải: cửa sổ 1:1 trên ảnh toàn cảnh 1/8 (1px ảnh = 1px màn), trượt theo nhân vật.
 * Chạm/click (hoặc phím M) mở bản đồ lớn. Ký hiệu vẽ bằng SVG/DOM: mình, chỗ làm nhiệm vụ, đường tự đi,
 * NPC, người chơi khác.
 *
 * Khung đá `.ui-slot` (viền 13px) nằm TRONG bề ngang cũ: cột phải của HUD (ô nhiệm vụ, toast) xếp theo đúng cỡ này,
 * nhất là điện thoại ngang. Đo khung nhìn bằng clientWidth/Height (vùng trong viền) nên phép trượt không đổi.
 */
export function Minimap({ touch, low }: { touch: boolean; low: boolean }) {
	const info = useGameStore((s) => s.mapInfo);
	const pos = useGameStore((s) => s.position);
	const dir = useGameStore((s) => s.direction);
	const markers = useGameStore((s) => s.mapMarkers);
	const auto = useGameStore((s) => s.autoWalk);
	const area = useGameStore((s) => s.area);
	const setMapOpen = useGameStore((s) => s.setMapOpen);
	const frame = useRef<HTMLButtonElement>(null);
	const [box, setBox] = useState({ w: 0, h: 0 });

	useEffect(() => {
		const el = frame.current;
		if (!el) return undefined;
		const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
		ro.observe(el);
		return () => ro.disconnect();
	}, [info]);

	if (!info) return null;
	const s = info.scale;
	const { w: W, h: H } = box;
	const px = pos.x * s;
	const py = pos.y * s;
	const ox = clamp(px - W / 2, 0, Math.max(0, info.imgW - W));
	const oy = clamp(py - H / 2, 0, Math.max(0, info.imgH - H));
	const slide = 'transform 100ms linear';
	const size = touch ? (low ? 'w-[112px]' : 'w-[min(144px,calc(100vw-232px))]') : 'w-[200px] min-[1600px]:w-[240px]';

	// Chỗ làm nhiệm vụ ra ngoài khung: ghim vào mép, kèm mũi tên chỉ hướng.
	const q = markers.quest;
	let edge: { x: number; y: number; deg: number } | null = null;
	if (q && W > 0) {
		const qx = q.x * s - ox;
		const qy = q.y * s - oy;
		if (qx < 4 || qy < 4 || qx > W - 4 || qy > H - 4) {
			const cx = px - ox;
			const cy = py - oy;
			const deg = (Math.atan2(qy - cy, qx - cx) * 180) / Math.PI;
			edge = { x: clamp(qx, 7, W - 7), y: clamp(qy, 7, H - 7), deg };
		}
	}
	const pathPts = auto ? [pos, ...auto.path].map((p) => `${(p.x * s).toFixed(1)},${(p.y * s).toFixed(1)}`).join(' ') : '';

	// Thẻ tên vùng treo lệch xuống dưới mép khung đá nên phải nằm NGOÀI nút (nút cắt tràn bằng overflow-hidden).
	return (
		<div className={`relative shrink-0 ${size}`}>
			<button
				ref={frame}
				type="button"
				aria-label="Mở bản đồ (M)"
				title="Bản đồ (M)"
				onClick={() => setMapOpen(true)}
				className="ui-slot pointer-events-auto relative block aspect-[432/312] w-full overflow-hidden p-0 transition-[filter] hover:brightness-110"
			>
				<div className="absolute left-0 top-0" style={{ width: info.imgW, height: info.imgH, transform: `translate3d(${-ox}px, ${-oy}px, 0)`, transition: slide }}>
					<img src={info.url} alt="" draggable={false} width={info.imgW} height={info.imgH} className="pixel-img absolute inset-0 max-w-none select-none" />
					<svg className="absolute inset-0 overflow-visible" width={info.imgW} height={info.imgH} viewBox={`0 0 ${info.imgW} ${info.imgH}`}>
						{q?.r && <circle cx={q.x * s} cy={q.y * s} r={q.r * s} fill="rgba(250,204,21,0.12)" stroke="rgba(250,204,21,0.55)" strokeWidth="1" />}
						{pathPts && <polyline points={pathPts} fill="none" stroke="#facc15" strokeWidth="1.5" strokeDasharray="3 2" strokeLinecap="round" strokeLinejoin="round" />}
						{markers.npcs.map((n) => (
							<circle key={n.key} cx={n.x * s} cy={n.y * s} r="1.8" fill="#f8fafc" stroke="#0f172a" strokeWidth="0.8" />
						))}
						{markers.remotes.map((r, i) => (
							<circle key={`${r.name}-${i}`} cx={r.x * s} cy={r.y * s} r="2.2" fill="#38bdf8" stroke="#0c4a6e" strokeWidth="0.8" />
						))}
						{q && !edge && (
							<g>
								<circle cx={q.x * s} cy={q.y * s} r="5" fill="none" stroke="#facc15" strokeWidth="1.5" />
								<circle cx={q.x * s} cy={q.y * s} r="2.6" fill="#facc15" stroke="#422006" strokeWidth="0.8" />
							</g>
						)}
					</svg>
				</div>
				{edge && (
					<span className="absolute" style={{ left: edge.x, top: edge.y, transform: `translate(-50%, -50%) rotate(${edge.deg}deg)` }}>
						<svg width="12" height="12" viewBox="-6 -6 12 12">
							<path d="M5 0 L-3 -4 L-3 4 Z" fill="#facc15" stroke="#422006" strokeWidth="0.8" />
						</svg>
					</span>
				)}
				<span className="absolute left-0 top-0" style={{ transform: `translate3d(${px - ox - 6}px, ${py - oy - 6}px, 0)`, transition: slide }}>
					<PlayerArrow deg={DIRECTION_DEG[dir] ?? 90} />
				</span>
				{auto && <span className="ui-tag pointer-events-none absolute right-1 top-1 h-5 bg-gold text-ink-brown">Đang tự đi</span>}
			</button>
			{area && !(touch && low) && (
				<span className="ui-plank pointer-events-none absolute -bottom-3 left-2 block max-w-[calc(100%-16px)] truncate px-2 text-chip leading-[1.5] font-bold">{area}</span>
			)}
		</div>
	);
}

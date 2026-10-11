'use client';

import { useEffect, useState } from 'react';

/**
 * Hồi chiêu kiểu kim đồng hồ (chủ dự án 10/10/2026: "đổi thành 1 vòng kim đồng hồ quét làm mờ và hiển thị số giây 2s, 1s"):
 * phần CÒN PHẢI CHỜ phủ tối, phần đã hồi lộ ra theo chiều kim đồng hồ từ 12 giờ; một vạch sáng làm kim; giữa ô là số giây làm
 * tròn lên ("2s", "1s"). Dùng chung cho ô đá thanh kỹ năng (máy tính) và nút tròn cảm ứng (`round`).
 */
export function CooldownSweep({ remain, total, round = false, size = 'md' }: { remain: number; total: number; round?: boolean; size?: 'sm' | 'md' | 'lg' }) {
	if (remain <= 0 || total <= 0) return null;
	const deg = Math.max(0, Math.min(360, (1 - remain / total) * 360));
	const shape = round ? 'rounded-full' : 'rounded-[4px]';
	const text = size === 'lg' ? 'text-[20px]' : size === 'sm' ? 'text-[12px]' : 'text-[14px]';
	return (
		<span className={`pointer-events-none absolute inset-0 overflow-hidden ${shape}`} aria-hidden>
			<span className="absolute inset-0" style={{ background: `conic-gradient(transparent 0deg ${deg}deg, rgb(10 7 5 / 0.72) ${deg}deg 360deg)` }} />
			{/* Kim: nêm sáng 3° ngay mép đã hồi. */}
			<span className="absolute inset-0" style={{ background: `conic-gradient(from ${deg - 1.5}deg, rgb(255 222 140 / 0.85) 0deg 3deg, transparent 3deg)` }} />
			<span className={`absolute inset-0 flex items-center justify-center font-extrabold tabular-nums text-white text-outline ${text}`}>{Math.ceil(remain)}s</span>
		</span>
	);
}

/**
 * Giây còn lại tới `readyAt` (mốc `performance.now()`; 0 = sẵn sàng) — tự vẽ lại mỗi khung trong lúc còn hồi, dừng khi xong.
 * Mốc lấy NGAY lúc vẽ (không giữ mốc cũ trong state: giữ mốc cũ là lớp tối dày dần sau khi đã hồi xong — lỗi cũ của nút cảm ứng).
 */
export function useCooldownLeft(readyAt: number): number {
	const [, tick] = useState(0);
	const left = readyAt > 0 ? Math.max(0, (readyAt - performance.now()) / 1000) : 0;
	useEffect(() => {
		if (readyAt <= performance.now()) return undefined;
		let raf = 0;
		const loop = (): void => {
			tick((n) => n + 1);
			if (performance.now() < readyAt) raf = requestAnimationFrame(loop);
		};
		raf = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(raf);
	}, [readyAt]);
	return left;
}

'use client';

import { memo, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import type { FigureGearView } from '@/game/gearLayers';
import { gearImageUrl } from '@/game/gearTexture';
import type { PlayerSpriteView } from '@/store/useGameStore';

/** Vùng có hình (alpha > 0) gộp mọi khung, toạ độ tính từ góc khung; + cỡ atlas để dựng `background-size`. */
interface Measure {
	sheetW: number;
	sheetH: number;
	x: number;
	y: number;
	w: number;
	h: number;
}

const pending = new Map<string, Promise<Measure>>();
/** Đo xong rồi — mở lại kho đồ thì vẽ ngay, không chớp qua khung trống. */
const measured = new Map<string, Measure>();

const keyOf = (sp: PlayerSpriteView): string => `${sp.sheet}#${sp.frames.map((f) => `${f.x},${f.y},${f.w},${f.h}`).join(';')}`;

/**
 * Đo MỘT lần mỗi sprite: vẽ atlas lên canvas, quét alpha trong từng khung `idle_S`, lấy hộp bao chung. Khung 80×88 có
 * nhiều lề trống (người lớn chỉ 33×74) — phóng theo hộp bao thì nhân vật to hơn mà vẫn nguyên lần. Đọc điểm ảnh hỏng
 * (canvas bị chặn) thì lấy nguyên khung.
 */
function measure(sp: PlayerSpriteView): Promise<Measure> {
	const key = keyOf(sp);
	let p = pending.get(key);
	if (p) return p;
	p = new Promise<Measure>((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			const f0 = sp.frames[0]!;
			let box = { x: 0, y: 0, w: f0.w, h: f0.h };
			try {
				const c = document.createElement('canvas');
				c.width = img.naturalWidth;
				c.height = img.naturalHeight;
				const ctx = c.getContext('2d', { willReadFrequently: true });
				if (ctx) {
					ctx.drawImage(img, 0, 0);
					let x0 = Infinity;
					let y0 = Infinity;
					let x1 = -1;
					let y1 = -1;
					for (const f of sp.frames) {
						const d = ctx.getImageData(f.x, f.y, f.w, f.h).data;
						for (let y = 0; y < f.h; y += 1) {
							for (let x = 0; x < f.w; x += 1) {
								if (d[(y * f.w + x) * 4 + 3]! === 0) continue;
								x0 = Math.min(x0, x);
								y0 = Math.min(y0, y);
								x1 = Math.max(x1, x);
								y1 = Math.max(y1, y);
							}
						}
					}
					if (x1 >= 0) box = { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
				}
			} catch {
				/* atlas khác nguồn / trình duyệt chặn đọc điểm ảnh: giữ nguyên khung */
			}
			const m = { sheetW: img.naturalWidth, sheetH: img.naturalHeight, ...box };
			measured.set(key, m);
			resolve(m);
		};
		img.onerror = () => reject(new Error(sp.sheet));
		img.src = sp.sheet;
	});
	pending.set(key, p);
	p.catch(() => pending.delete(key));
	return p;
}

/**
 * Nhân vật đứng giữa kho đồ: khung `idle_S` của CHÍNH sprite đang chơi (atlas), phóng NGUYÊN lần
 * `k = floor(min((maxW − 8) / bw, (maxH − reserve) / bh))` kẹp trong [kMin, kMax], toạ độ nguyên, `pixelated`. Bốn khung đứng
 * thở chạy bằng `steps(4)` (tắt khi giảm chuyển động) khi các khung cách đều nhau trên atlas.
 * Đồ GẮN đang mặc (vũ khí, tay phụ, mũ…) vẽ chồng trước/sau thân theo CÙNG luật với game (`sprite.gear`, neo của khung đứng
 * đầu tiên). Hộp phóng tính cả phần đồ thò ra (nới đều hai bên để thân vẫn ở giữa) — kiếm không bị cắt ở mép sân khấu.
 * Đồ đứng yên theo khung đầu trong lúc thân thở (tay chỉ nhích ≤ 1px). Bộ trang phục thì chính là sprite (`sheet`).
 */
export const PlayerFigure = memo(function PlayerFigure({ sprite, maxW, maxH, reserve, kMin = 2, kMax = 4, alt }: { sprite: PlayerSpriteView | null; maxW: number; maxH: number; reserve: number; kMin?: number; kMax?: number; alt: string }) {
	const [, rerender] = useState(0);
	const ref = useRef<HTMLDivElement>(null);
	// Căn giữa trong khung lẻ / dòng chữ cao lẻ (23,4px) đặt hình ở nửa điểm ảnh → trình duyệt nội suy, nét vẽ nhoè. Đo vị
	// trí thật rồi dịch phần lẻ để góc hình rơi đúng điểm ảnh nguyên.
	useLayoutEffect(() => {
		const el = ref.current;
		if (!el) return;
		el.style.transform = '';
		const r = el.getBoundingClientRect();
		const dx = Math.round(r.left) - r.left;
		const dy = Math.round(r.top) - r.top;
		if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) el.style.transform = `translate(${dx}px, ${dy}px)`;
	});
	const key = sprite ? keyOf(sprite) : '';
	useEffect(() => {
		if (!sprite || measured.has(key)) return undefined;
		let alive = true;
		measure(sprite)
			.then(() => alive && rerender((n) => n + 1))
			.catch(() => {});
		return () => {
			alive = false;
		};
	}, [sprite, key]);
	const m = measured.get(key);
	const f0 = sprite?.frames[0];
	if (!sprite || !f0 || !m || maxW <= 0 || maxH <= 0) return <span className="block h-px w-px" aria-hidden />;
	const gear = sprite.gear ?? [];
	// Hộp hiển thị = thân ∪ đồ, nới ĐỀU hai bên theo phần thò ra nhiều hơn (thân giữ chính giữa sân khấu).
	let over = 0;
	let uy0 = m.y;
	let uy1 = m.y + m.h;
	for (const g of gear) {
		over = Math.max(over, m.x - g.left, g.left + g.w - (m.x + m.w));
		uy0 = Math.min(uy0, g.top);
		uy1 = Math.max(uy1, g.top + g.h);
	}
	const u = { x: m.x - over, y: uy0, w: m.w + over * 2, h: uy1 - uy0 };
	const k = Math.max(kMin, Math.min(kMax, Math.floor(Math.min((maxW - 8) / u.w, (maxH - reserve) / u.h))));
	const fr = sprite.frames;
	const stride = fr.length > 1 ? fr[1]!.x - f0.x : 0;
	const even = stride > 0 && fr.every((f, i) => f.y === f0.y && f.x === f0.x + i * stride);
	const x0 = -(f0.x + m.x) * k;
	const style = {
		left: (m.x - u.x) * k,
		top: (m.y - u.y) * k,
		width: m.w * k,
		height: m.h * k,
		backgroundImage: `url(${sprite.sheet})`,
		backgroundSize: `${m.sheetW * k}px ${m.sheetH * k}px`,
		backgroundPosition: `${x0}px ${-(f0.y + m.y) * k}px`,
		...(even ? { '--inv-x0': `${x0}px`, '--inv-x1': `${x0 - fr.length * stride * k}px`, '--inv-steps': fr.length } : {}),
	} as CSSProperties;
	const layer = (front: boolean) => gear.filter((g) => g.front === front).map((g) => <GearImg key={`${g.src}|${g.left},${g.top}`} g={g} k={k} ox={u.x} oy={u.y} />);
	return (
		<div ref={ref} role="img" aria-label={alt} className="relative shrink-0" style={{ width: u.w * k, height: u.h * k }}>
			{layer(false)}
			<div className={`pixel-img absolute bg-no-repeat ${even ? 'inv-figure' : ''}`} style={style} />
			{layer(true)}
		</div>
	);
});

/** Một lớp đồ: ảnh đã thu nhỏ + nhuộm độ hiếm (canvas → data URL, dùng chung cache với texture trong game), phóng `k` lần. */
function GearImg({ g, k, ox, oy }: { g: FigureGearView; k: number; ox: number; oy: number }) {
	const [url, setUrl] = useState<string | null>(null);
	useEffect(() => {
		let alive = true;
		gearImageUrl(g.src, g.scale, g.rarity)
			.then((u) => alive && setUrl(u))
			.catch(() => {});
		return () => {
			alive = false;
		};
	}, [g.src, g.scale, g.rarity]);
	if (!url) return null;
	return (
		<img
			src={url}
			alt=""
			draggable={false}
			className="pixel-img pointer-events-none absolute max-w-none select-none"
			style={{ left: (g.left - ox) * k, top: (g.top - oy) * k, width: g.w * k, height: g.h * k, transform: g.flip ? 'scaleX(-1)' : undefined, transformOrigin: `${g.gripX * k}px 0` }}
		/>
	);
}

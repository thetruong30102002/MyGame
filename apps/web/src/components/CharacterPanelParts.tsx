'use client';

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';

/** Số kiểu Việt (dấu phẩy thập phân): ×1,24 · 1,75. */
const NUM = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 });
const NUM2 = new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtNum = (n: number): string => NUM.format(n);
/** Luôn 2 chữ số lẻ — cột hệ số sức mạnh các nhánh thẳng hàng nhau. */
export const fmtScale = (n: number): string => NUM2.format(n);

/**
 * Ảnh pixel phóng NGUYÊN lần kích thước gốc, lớn nhất còn vừa ô `box` (ảnh to hơn ô thì giữ 1×, không thu nhỏ lẻ —
 * thu 0,8× là rụng nét vẽ). Cỡ gốc chỉ biết sau khi tải nên trước đó ảnh ẩn trong ô cố định, bố cục không giật.
 * Ảnh lỗi (chưa thả file PixelLab) thì để ô trống — không thay bằng emoji.
 */
export function PixelImg(props: { src: string; alt: string; box: number; className?: string }) {
	// Đổi ảnh thì dựng lại từ đầu: cỡ gốc / cờ lỗi của ảnh cũ không được dính sang ảnh mới.
	return <PixelImgInner key={props.src} {...props} />;
}

function PixelImgInner({ src, alt, box, className = '' }: { src: string; alt: string; box: number; className?: string }) {
	const [size, setSize] = useState<{ w: number; h: number } | null>(null);
	const [broken, setBroken] = useState(false);
	const k = size ? Math.max(1, Math.floor(box / Math.max(size.w, size.h))) : 1;
	return (
		<span className={`flex shrink-0 items-center justify-center ${className}`} style={{ width: box, height: box }}>
			{broken ? (
				<span className="sr-only">{alt}</span>
			) : (
				<img
					src={src}
					alt={alt}
					draggable={false}
					className="pixel-img max-w-none"
					style={size ? { width: size.w * k, height: size.h * k } : { width: 0, height: 0, visibility: 'hidden' }}
					onLoad={(e) => setSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
					onError={() => setBroken(true)}
				/>
			)}
		</span>
	);
}

function gcd(a: number, b: number): number {
	return b ? gcd(b, a % b) : a;
}

type BlockInfo = { w: number; h: number; block: number };

const blockCache = new Map<string, Promise<BlockInfo>>();
/** Kết quả đã đo — mở lại bảng thì vẽ ngay đúng cỡ, không chớp qua ô trống chờ promise. */
const blockDone = new Map<string, BlockInfo>();

/**
 * Cỡ ảnh + kích thước một "điểm vẽ" gốc. Chân dung pipeline là ảnh gốc 32–48px phóng 3× (tranh vẽ tay cũ có tấm 2×,
 * 1×), nên phải đo mới biết phóng tiếp bao nhiêu thì vẫn đúng lưới: ƯCLN độ dài các dải màu liền nhau trên vài hàng.
 * Không đọc được điểm ảnh (ảnh khác nguồn) thì coi như 1× — vẫn đúng lưới, chỉ kém linh hoạt cỡ hiển thị.
 */
function measureBlock(src: string): Promise<BlockInfo> {
	let p = blockCache.get(src);
	if (p) return p;
	p = new Promise<BlockInfo>((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			const w = img.naturalWidth;
			const h = img.naturalHeight;
			let block = 1;
			try {
				const c = document.createElement('canvas');
				c.width = w;
				c.height = h;
				const ctx = c.getContext('2d', { willReadFrequently: true });
				if (ctx) {
					ctx.drawImage(img, 0, 0);
					const d = ctx.getImageData(0, 0, w, h).data;
					let g = 0;
					for (let y = 0; y < h; y += 5) {
						let run = 1;
						for (let x = 1; x <= w; x++) {
							const a = (y * w + x - 1) * 4;
							const b = (y * w + x) * 4;
							const same = x < w && d[a] === d[b] && d[a + 1] === d[b + 1] && d[a + 2] === d[b + 2] && d[a + 3] === d[b + 3];
							if (same) run++;
							else {
								g = gcd(g, run);
								run = 1;
							}
						}
					}
					if (g >= 1 && g <= 8 && w % g === 0 && h % g === 0) block = g;
				}
			} catch {
				block = 1;
			}
			const r = { w, h, block };
			blockDone.set(src, r);
			resolve(r);
		};
		img.onerror = () => reject(new Error(src));
		img.src = src;
	});
	blockCache.set(src, p);
	return p;
}

/** Cỡ file + điểm vẽ gốc của `src` (null khi đang đo hoặc đo hỏng) — cho chỗ tự cắt ảnh trong ô cố định (khung tên HUD). */
export function usePixelBlock(src: string): BlockInfo | null {
	const [, rerender] = useState(0);
	useEffect(() => {
		if (blockDone.has(src)) return undefined;
		let alive = true;
		measureBlock(src)
			.then(() => alive && rerender((n) => n + 1))
			.catch(() => {});
		return () => {
			alive = false;
		};
	}, [src]);
	return blockDone.get(src) ?? null;
}

/**
 * Chân dung trong ô đá: phóng nguyên lần điểm vẽ GỐC (không phải file) cho vừa `box` — ảnh 144px (48 gốc × 3) hiện
 * 96px = 2× gốc, vẫn sắc nét. Tranh nguyên người cũ (cao hơn rộng) thì cắt lấy phần đầu. Ô đá ôm sát ảnh đã phóng.
 */
export function PixelPortrait({ src, alt, box }: { src: string; alt: string; box: number }) {
	const [, rerender] = useState(0);
	const [failed, setFailed] = useState<string | null>(null);
	const cur = blockDone.get(src);
	useEffect(() => {
		if (blockDone.has(src)) return undefined;
		let alive = true;
		measureBlock(src)
			.then(() => alive && rerender((n) => n + 1))
			.catch(() => alive && setFailed(src));
		return () => {
			alive = false;
		};
	}, [src]);
	let w = box;
	let h = box;
	let body: ReactNode = null;
	// Ảnh hỏng: giữ ô đá trống đúng cỡ.
	if (failed !== src && cur) {
		const nw = cur.w / cur.block;
		const nh = cur.h / cur.block;
		const tall = nh > nw * 1.15;
		const m = Math.max(1, Math.floor(box / (tall ? nw : Math.max(nw, nh))));
		const dw = nw * m;
		const dh = nh * m;
		w = Math.min(box, dw);
		h = Math.min(box, tall ? w : dh);
		body = (
			<span className="relative block overflow-hidden" style={{ width: w, height: h }}>
				<img src={src} alt={alt} draggable={false} className="pixel-img absolute top-0 max-w-none" style={{ width: dw, height: dh, left: Math.floor((w - dw) / 2) }} />
			</span>
		);
	}
	return (
		<div className="ui-slot flex shrink-0 items-center justify-center" style={{ width: w + 26, height: h + 26 }}>
			{body}
		</div>
	);
}

/** Thanh chỉ số trong bảng (máu/phép/thể lực/EXP) — cùng kiểu `ui-bar` ở khung tên HUD. `fill`: màu ruột, vd `var(--color-hp)`. */
export function StatBar({ value, max, fill }: { value: number; max: number; fill: string }) {
	const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
	return (
		<div className="ui-bar mt-1 h-3 w-full">
			<div className="ui-bar-fill" style={{ width: `${pct}%`, '--fill': fill } as CSSProperties} />
		</div>
	);
}

export function SectionTitle({ children }: { children: ReactNode }) {
	return <h3 className="border-b-2 border-paper-line pb-1 font-display text-head font-extrabold text-ink-brown">{children}</h3>;
}

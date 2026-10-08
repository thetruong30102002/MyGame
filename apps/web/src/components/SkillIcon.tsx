'use client';

import { useEffect, useState } from 'react';
import { tempIcon } from '@/game/combat/tempArt';

interface Frame {
	x: number;
	y: number;
	w: number;
	h: number;
}

/**
 * Icon kỹ năng lấy thẳng từ atlas hiệu ứng → icon và hiệu ứng trong trận cùng một nét vẽ. Kỹ năng từ GĐ2 (mốc 3–8, Thổ)
 * chưa có hình riêng: icon tạm khai ở `tempArt.TEMP_ART` (tự đổi sang bản PixelLab khi atlas có).
 */
const ICON_FRAME: Record<string, string> = {
	aether_bolt: 'arcane_orb_0',
	fire_bolt: 'fire_orb_0',
	water_lance: 'water_wave_0',
	wind_blade: 'wind_spin_0',
	heal: 'sparkle_3',
	ice_shard: 'ice_shard_0',
	slash: 'slash_2',
	flame_slash: 'fire_flash_2',
	whirlwind: 'wind_burst_2',
	charge: 'dust_2',
	// Né (Space) không phải kỹ năng trong HERO_SKILLS nhưng ô của nó vẫn cần icon cùng nét với thanh skill.
	dodge: 'dust_2',
	// Chỉ số Chí mạng ở bảng Nhân vật (khung 56×57 — dùng `box={57}` mới ra đúng 1×).
	crit: 'crit_flash_2',
	// Chỉ số Né hoàn toàn (Bóng Mờ — Bắc Thần 9) ở bảng Nhân vật: icon TẠM là frame bóng mờ của atlas.
	evade: 'shadow_5',
};

let atlas: Promise<{ size: { w: number; h: number }; frames: Record<string, Frame> }> | null = null;

function loadAtlas() {
	atlas ??= fetch('/assets/vfx/vfx.json')
		.then((r) => r.json())
		.then((j: { meta: { size: { w: number; h: number } }; frames: Record<string, { frame: Frame }> }) => ({
			size: j.meta.size,
			frames: Object.fromEntries(Object.entries(j.frames).map(([k, v]) => [k, v.frame])),
		}));
	return atlas;
}

export function SkillIcon({ skillId, box = 36 }: { skillId: string; box?: number }) {
	const [data, setData] = useState<Awaited<ReturnType<typeof loadAtlas>> | null>(null);
	useEffect(() => {
		let alive = true;
		loadAtlas()
			.then((d) => alive && setData(d))
			.catch(() => {});
		return () => {
			alive = false;
		};
	}, []);
	const name = ICON_FRAME[skillId] ?? tempIcon(skillId, (id) => !!data?.frames[`vfx/${id}`]) ?? 'arcane_orb_0';
	// Số frame mỗi hiệu ứng theo bản PixelLab vẽ (không cố định) → frame chỉ định không còn thì lấy frame đầu.
	const f = data?.frames[`vfx/${name}`] ?? data?.frames[`vfx/${name.replace(/_\d+$/, '_0')}`];
	// Atlas chưa tải xong: giữ chỗ rỗng đúng cỡ ô để bố cục không nhảy.
	if (!data || !f) return <span className="block" style={{ width: box, height: box }} />;
	// Phóng NGUYÊN lần khi frame nhỏ hơn ô (giữ lưới pixel); frame to hơn ô thì thu đúng 1/2, 1/3… — ×0,8 hay ×0,59 thì
	// lấy mẫu `pixelated` rụng hàng điểm ảnh không đều, nét vẽ méo; chia chẵn thì rụng đều.
	const raw = Math.min(box / f.w, box / f.h);
	const k = raw >= 1 ? Math.floor(raw) : 1 / Math.ceil(1 / raw);
	return (
		<div
			className="pixel-img"
			style={{
				width: Math.round(f.w * k),
				height: Math.round(f.h * k),
				backgroundImage: 'url(/assets/vfx/vfx.png)',
				backgroundSize: `${data.size.w * k}px ${data.size.h * k}px`,
				backgroundPosition: `${-f.x * k}px ${-f.y * k}px`,
			}}
		/>
	);
}

/**
 * Ảnh PixelLab (bình, ba lô, sao…) đặt giữa ô `box` ở đúng NGUYÊN lần cỡ gốc, toạ độ làm tròn xuống số nguyên: căn
 * giữa bằng flex/translate hay rơi vào nửa pixel, trình duyệt nội suy lệch một hàng điểm ảnh làm nét vẽ nhoè.
 * Ảnh to hơn ô thì tràn ra viền ô (như món đồ đặt nổi trên khay) chứ không thu nhỏ lẻ tỉ lệ.
 * Phần tử cha phải `relative`; `box` là cỡ vùng nội dung (padding box) của nó.
 */
export function PixelIcon({ src, w, h, box, scale = 1, dim = false }: { src: string; w: number; h: number; box: number | [number, number]; scale?: number; dim?: boolean }) {
	const [bw, bh] = typeof box === 'number' ? [box, box] : box;
	const W = w * Math.max(1, Math.floor(scale));
	const H = h * Math.max(1, Math.floor(scale));
	return (
		<img
			src={src}
			alt=""
			width={W}
			height={H}
			draggable={false}
			className={`pixel-img pointer-events-none absolute max-w-none select-none ${dim ? 'opacity-40 grayscale' : ''}`}
			style={{ left: Math.floor((bw - W) / 2), top: Math.floor((bh - H) / 2), width: W, height: H }}
		/>
	);
}

/** Ổ khoá vẽ theo lưới 10×10 (shape-rendering crispEdges) — emoji 🔒 lệch hẳn tông khung gỗ/đá. `size` nên là bội của 10. */
export function LockGlyph({ size = 20 }: { size?: number }) {
	return (
		<svg width={size} height={size} viewBox="0 0 10 10" shapeRendering="crispEdges" aria-hidden className="drop-shadow-[0_1px_0_rgba(0,0,0,0.9)]">
			<rect x="3" y="1" width="4" height="1" fill="#b9b2a3" />
			<rect x="2" y="2" width="1" height="2" fill="#b9b2a3" />
			<rect x="7" y="2" width="1" height="2" fill="#8d877a" />
			<rect x="1" y="4" width="8" height="5" fill="#d9ad52" />
			<rect x="1" y="4" width="8" height="1" fill="#f3d58a" />
			<rect x="1" y="8" width="8" height="1" fill="#8a6326" />
			<rect x="4" y="5" width="2" height="3" fill="#3a2413" />
		</svg>
	);
}

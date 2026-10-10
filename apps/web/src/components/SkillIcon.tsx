'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { skillIconKey } from '@/game/combat/skillIconKeys';
import { tempIcon } from '@/game/combat/tempArt';
import { fitPx, fitScale, skillIconFit } from './iconFit';

interface Frame {
	x: number;
	y: number;
	w: number;
	h: number;
}

interface Atlas {
	size: { w: number; h: number };
	frames: Record<string, Frame>;
}

/**
 * Icon TẠM lấy thẳng từ atlas hiệu ứng (icon và hiệu ứng trong trận cùng một nét vẽ) — chỉ còn dùng khi atlas icon chiêu
 * riêng (`skill-icons`, xem `skillIconKeys.ts`) thiếu khoá. Kỹ năng không khai ở đây lấy icon tạm `tempArt.TEMP_ART`.
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

let vfxAtlas: Promise<Atlas> | null = null;

/** Atlas hiệu ứng (`assets/vfx`) — tải MỘT lần cho mọi icon tạm (`SkillIcon`, `TalentArt.AtlasFrame`). */
export function loadVfxAtlas(): Promise<Atlas> {
	vfxAtlas ??= fetch('/assets/vfx/vfx.json')
		.then((r) => r.json())
		.then((j: { meta: { size: { w: number; h: number } }; frames: Record<string, { frame: Frame }> }) => ({
			size: j.meta.size,
			frames: Object.fromEntries(Object.entries(j.frames).map(([k, v]) => [k, v.frame])),
		}));
	return vfxAtlas;
}

const SKILL_ICONS_PNG = '/assets/ui/skill-icons.png';
let iconAtlas: Promise<Atlas> | null = null;
let iconAtlasNow: Atlas | null = null;

/**
 * Atlas icon chiêu RIÊNG: `skill-icons.json` = `{ khoá: hộp }`, cỡ atlas đọc từ chính ảnh — chờ ảnh tải xong mới dùng nên
 * icon hiện ra là đủ hình, không chớp ô trống. Tải MỘT lần cho cả trang. Lỗi (chưa xuất atlas, 404) → atlas rỗng: mọi chỗ
 * rơi về icon tạm cũ.
 */
export function loadSkillIconAtlas(): Promise<Atlas> {
	iconAtlas ??= Promise.all([
		fetch('/assets/ui/skill-icons.json').then((r) => {
			if (!r.ok) throw new Error(`skill-icons.json ${r.status}`);
			return r.json() as Promise<Record<string, Frame>>;
		}),
		new Promise<{ w: number; h: number }>((ok, fail) => {
			const img = new Image();
			img.onload = () => ok({ w: img.naturalWidth, h: img.naturalHeight });
			img.onerror = fail;
			img.src = SKILL_ICONS_PNG;
		}),
	])
		.then(([frames, size]): Atlas => ({ size, frames }))
		.catch((): Atlas => ({ size: { w: 0, h: 0 }, frames: {} }))
		.then((a) => (iconAtlasNow = a));
	return iconAtlas;
}

/** Atlas icon chiêu nếu ĐÃ tải xong (null = đang tải / chưa gọi) — cho các hàm đồng bộ như `TalentArt.hasNodeIcon`. */
export const skillIconAtlasNow = (): Atlas | null => iconAtlasNow;

/** Đợi một atlas dùng chung; `enabled` = false thì không tải (atlas tạm chỉ tải khi thật sự cần rơi về). */
function useAtlas(load: () => Promise<Atlas>, enabled = true): Atlas | null {
	const [data, setData] = useState<Atlas | null>(null);
	useEffect(() => {
		if (!enabled) return;
		let alive = true;
		load()
			.then((d) => alive && setData(d))
			.catch(() => {});
		return () => {
			alive = false;
		};
	}, [load, enabled]);
	return data;
}

export { fitPx, fitScale };

/**
 * Một ô của atlas icon chiêu (bộ v2: ô 32×32 có lề trong suốt), cỡ theo `skillIconFit`: ô giao diện 32–55 → 1×, 56+ → 2×,
 * 28–31 vẫn 1× (lề trong suốt tràn ra), 14–27 → ½. Khung ngoài chiếm ≤ ô, ảnh đặt ở toạ độ nguyên bên trong.
 */
function IconSprite({ atlas, f, box, block }: { atlas: Atlas; f: Frame; box: number; block?: boolean }) {
	const s = skillIconFit(f.w, f.h, box);
	const outer = { position: 'relative' as const, width: s.outerW, height: s.outerH };
	const sprite = (
		<span
			className="pixel-img absolute block"
			style={{
				left: s.left,
				top: s.top,
				width: s.w,
				height: s.h,
				backgroundImage: `url(${SKILL_ICONS_PNG})`,
				backgroundSize: `${atlas.size.w * s.k}px ${atlas.size.h * s.k}px`,
				backgroundPosition: `${-f.x * s.k}px ${-f.y * s.k}px`,
			}}
		/>
	);
	return block ? (
		<span className="block" style={outer}>
			{sprite}
		</span>
	) : (
		<div style={outer}>{sprite}</div>
	);
}

const Blank = ({ box }: { box: number }) => <span className="block" style={{ width: box, height: box }} />;

/**
 * Icon theo KHOÁ của atlas icon chiêu (`spare:…`, `passive:…`, `future:…`); atlas thiếu khoá → `fallback` (đường icon tạm
 * cũ). Đang tải → giữ chỗ rỗng đúng cỡ ô (không chớp icon tạm rồi mới đổi).
 */
export function KeyedIcon({ iconKey, box, fallback }: { iconKey: string; box: number; fallback: ReactNode }) {
	const atlas = useAtlas(loadSkillIconAtlas);
	if (!atlas) return <Blank box={box} />;
	const f = atlas.frames[iconKey];
	return f ? <IconSprite atlas={atlas} f={f} box={box} block /> : <>{fallback}</>;
}

/**
 * Icon kỹ năng: ưu tiên hình riêng trong atlas icon chiêu (theo id kỹ năng, hoặc bí danh `SKILL_ICON_ALIAS` cho Né / Chí
 * mạng / Né hoàn toàn); chưa có thì icon TẠM từ atlas hiệu ứng như trước.
 */
export function SkillIcon({ skillId, box = 36 }: { skillId: string; box?: number }) {
	const icons = useAtlas(loadSkillIconAtlas);
	const own = icons?.frames[skillIconKey(skillId)];
	const data = useAtlas(loadVfxAtlas, !!icons && !own);
	if (icons && own) return <IconSprite atlas={icons} f={own} box={box} />;
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

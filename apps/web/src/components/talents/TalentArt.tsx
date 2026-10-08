'use client';

import { useEffect, useState } from 'react';
import { PASSIVE_TEMP, passiveTempKey } from '@/game/combat/passiveTempArt';
import type { BranchId, SwordStyleId } from '@/store/useGameStore';
import { SkillIcon } from '../SkillIcon';

interface Frame {
	x: number;
	y: number;
	w: number;
	h: number;
}

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

/**
 * Phóng NGUYÊN lần khi ảnh nhỏ hơn ô; to hơn ô thì thu đúng 1/2, 1/3… (cùng luật `SkillIcon`) — không bao giờ ×0,8. Cỡ thu
 * làm tròn XUỐNG nên ảnh 49px thu 1/2 = 24px vừa ô 24 (kiếm gỗ ở đầu nhánh Kiếm).
 */
export const fitScale = (w: number, h: number, box: number): number => {
	const raw = Math.min(box / w, box / h);
	if (raw >= 1) return Math.floor(raw);
	let n = 2;
	while (Math.floor(w / n) > box || Math.floor(h / n) > box) n += 1;
	return 1 / n;
};
const px = (n: number, k: number): number => (k >= 1 ? n * k : Math.floor(n * k));

/** Một frame atlas VFX theo TÊN frame (icon tạm của bị động — `PASSIVE_TEMP`); `SkillIcon` chỉ nhận id kỹ năng. */
export function AtlasFrame({ frame, box }: { frame: string; box: number }) {
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
	const f = data?.frames[`vfx/${frame}`];
	if (!data || !f) return <span className="block" style={{ width: box, height: box }} />;
	const k = fitScale(f.w, f.h, box);
	return (
		<span
			className="pixel-img block"
			style={{
				width: px(f.w, k),
				height: px(f.h, k),
				backgroundImage: 'url(/assets/vfx/vfx.png)',
				backgroundSize: `${data.size.w * k}px ${data.size.h * k}px`,
				backgroundPosition: `${-f.x * k}px ${-f.y * k}px`,
			}}
		/>
	);
}

/** Ảnh PixelLab cỡ gốc biết trước, đặt NGUYÊN lần hoặc thu đúng 1/n cho vừa ô. */
export function UiFit({ src, w, h, box }: { src: string; w: number; h: number; box: number }) {
	const k = fitScale(w, h, box);
	return <img src={src} alt="" draggable={false} className="pixel-img block max-w-none" style={{ width: px(w, k), height: px(h, k) }} />;
}

/** Icon đầu nhánh Kiếm: frame chém 49×89 thu 1/3 chỉ còn một vạch — dùng TẠM ảnh kiếm gỗ thu 1/2 (đặc tả cây 1.2). */
export const SWORD_HEAD_ICON = { src: '/assets/items/starter_sword.png', w: 49, h: 49 } as const;

export function BranchIcon({ branch, iconSkill, box }: { branch: BranchId; iconSkill: string | null; box: number }) {
	if (branch === 'sword') return <UiFit src={SWORD_HEAD_ICON.src} w={SWORD_HEAD_ICON.w} h={SWORD_HEAD_ICON.h} box={box} />;
	return iconSkill ? <SkillIcon skillId={iconSkill} box={box} /> : <span className="block" style={{ width: box, height: box }} />;
}

/**
 * Icon của một nút: kỹ năng chủ động / kiếm pháp = icon kỹ năng; bị động = icon tạm `PASSIVE_TEMP`; không có gì (mốc 10
 * "sắp có") = rỗng — bên gọi tự vẽ "…".
 */
export function NodeIcon({ skillId, branch, tier, style, box }: { skillId?: string; branch: BranchId; tier: number; style?: SwordStyleId; box: number }) {
	if (skillId) return <SkillIcon skillId={skillId} box={box} />;
	const temp = PASSIVE_TEMP[passiveTempKey(branch, tier, style)];
	if (!temp) return null;
	return 'vfx' in temp ? <AtlasFrame frame={temp.vfx} box={box} /> : <UiFit src={temp.ui} w={temp.w} h={temp.h} box={box} />;
}

/** Có icon để vẽ không (không thì ô hiện "…"). */
export const hasNodeIcon = (skillId: string | undefined, branch: BranchId, tier: number, style?: SwordStyleId): boolean => !!skillId || !!PASSIVE_TEMP[passiveTempKey(branch, tier, style)];

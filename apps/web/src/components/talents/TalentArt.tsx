'use client';

import { useEffect, useState } from 'react';
import { PASSIVE_TEMP, passiveTempKey } from '@/game/combat/passiveTempArt';
import { ENCHANT_EMPTY_KEY, nodeIconKey, STYLE_ICON_KEY, SWORD_HEAD_KEY } from '@/game/combat/skillIconKeys';
import type { BranchId, SwordStyleId } from '@/store/useGameStore';
import { fitPx, fitScale, KeyedIcon, loadVfxAtlas, SkillIcon, skillIconAtlasNow } from '../SkillIcon';

export { fitScale };

/** Một frame atlas VFX theo TÊN frame (icon tạm của bị động — `PASSIVE_TEMP`); `SkillIcon` chỉ nhận id kỹ năng. */
export function AtlasFrame({ frame, box }: { frame: string; box: number }) {
	const [data, setData] = useState<Awaited<ReturnType<typeof loadVfxAtlas>> | null>(null);
	useEffect(() => {
		let alive = true;
		loadVfxAtlas()
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
				width: fitPx(f.w, k),
				height: fitPx(f.h, k),
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
	return <img src={src} alt="" draggable={false} className="pixel-img block max-w-none" style={{ width: fitPx(w, k), height: fitPx(h, k) }} />;
}

/**
 * Icon đầu nhánh Kiếm khi atlas icon chiêu thiếu `SWORD_HEAD_KEY`: frame chém 49×89 thu 1/3 chỉ còn một vạch — dùng TẠM
 * ảnh kiếm gỗ thu 1/2 (đặc tả cây 1.2).
 */
export const SWORD_HEAD_ICON = { src: '/assets/items/starter_sword.png', w: 49, h: 49 } as const;

export function BranchIcon({ branch, iconSkill, box }: { branch: BranchId; iconSkill: string | null; box: number }) {
	if (branch === 'sword') return <KeyedIcon iconKey={SWORD_HEAD_KEY} box={box} fallback={<UiFit src={SWORD_HEAD_ICON.src} w={SWORD_HEAD_ICON.w} h={SWORD_HEAD_ICON.h} box={box} />} />;
	return iconSkill ? <SkillIcon skillId={iconSkill} box={box} /> : <span className="block" style={{ width: box, height: box }} />;
}

/** Biểu tượng lưu phái Kiếm (thẻ chọn lưu phái); atlas thiếu thì về icon kỹ năng mốc 3 của lưu phái như trước. */
export function StyleIcon({ style, fallbackSkill, box }: { style: SwordStyleId; fallbackSkill: string | null; box: number }) {
	return <KeyedIcon iconKey={STYLE_ICON_KEY[style]} box={box} fallback={fallbackSkill ? <SkillIcon skillId={fallbackSkill} box={box} /> : null} />;
}

/** Ô phủ phép đang trống; atlas thiếu thì về icon đầu nhánh Kiếm như trước. */
export function EnchantEmptyIcon({ box }: { box: number }) {
	return <KeyedIcon iconKey={ENCHANT_EMPTY_KEY} box={box} fallback={<BranchIcon branch="sword" iconSkill={null} box={box} />} />;
}

/**
 * Icon của một nút: kỹ năng chủ động / kiếm pháp = icon kỹ năng; bị động, tuyệt kỹ "sắp có", Kiếm chưa chọn lưu phái = icon
 * riêng theo `nodeIconKey`. Atlas thiếu khoá thì như trước: bị động = icon tạm `PASSIVE_TEMP`, còn lại "…".
 */
export function NodeIcon({ skillId, branch, tier, style, box }: { skillId?: string; branch: BranchId; tier: number; style?: SwordStyleId; box: number }) {
	if (skillId) return <SkillIcon skillId={skillId} box={box} />;
	const temp = PASSIVE_TEMP[passiveTempKey(branch, tier, style)];
	const fallback = !temp ? <span className="tt-dots">…</span> : 'vfx' in temp ? <AtlasFrame frame={temp.vfx} box={box} /> : <UiFit src={temp.ui} w={temp.w} h={temp.h} box={box} />;
	return <KeyedIcon iconKey={nodeIconKey(skillId, branch, tier, style)} box={box} fallback={fallback} />;
}

/**
 * Có icon để vẽ không (không thì ô hiện "…"). Atlas icon chiêu đang tải thì cứ coi là có — `NodeIcon` giữ chỗ rỗng rồi tự
 * về "…" nếu atlas thiếu khoá; tải xong (kể cả lỗi = atlas rỗng) thì trả đúng như cũ cộng các khoá atlas có.
 */
export const hasNodeIcon = (skillId: string | undefined, branch: BranchId, tier: number, style?: SwordStyleId): boolean => {
	if (skillId || PASSIVE_TEMP[passiveTempKey(branch, tier, style)]) return true;
	const atlas = skillIconAtlasNow();
	return !atlas || !!atlas.frames[nodeIconKey(skillId, branch, tier, style)];
};

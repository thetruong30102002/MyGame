/**
 * Cỡ hiện ảnh điểm ảnh trong ô giao diện — CHỈ nguyên lần hoặc 1/n (tách khỏi `SkillIcon.tsx` để test được, xem
 * `tests/skillIcons.test.ts`).
 */

/**
 * Phóng NGUYÊN lần khi ảnh nhỏ hơn ô; to hơn ô thì thu đúng 1/2, 1/3… — không bao giờ ×0,8 (lấy mẫu `pixelated` rụng hàng
 * điểm ảnh không đều, nét vẽ méo; chia chẵn thì rụng đều). Cỡ thu làm tròn XUỐNG nên ảnh 49px thu 1/2 = 24px vừa ô 24.
 */
export const fitScale = (w: number, h: number, box: number): number => {
	const raw = Math.min(box / w, box / h);
	if (raw >= 1) return Math.floor(raw);
	let n = 2;
	while (Math.floor(w / n) > box || Math.floor(h / n) > box) n += 1;
	return 1 / n;
};
export const fitPx = (n: number, k: number): number => (k >= 1 ? n * k : Math.floor(n * k));

/**
 * Lề trong suốt quanh hình trong một ô icon chiêu (bộ v2: ô 32×32, pipeline đặt hình ~22–28px vào GIỮA ô — xem
 * `packages/asset-pipeline/src/props/skillIcons.ts`).
 */
export const SKILL_ICON_PAD = 2;

export interface SkillIconFit {
	/** Tỉ lệ: nguyên lần (1, 2…) hoặc 1/n. */
	k: number;
	/** Cỡ ảnh đã phóng / thu. */
	w: number;
	h: number;
	/** Khung chiếm chỗ trong bố cục = min(ảnh, ô) — icon không làm ô cha phình ra. */
	outerW: number;
	outerH: number;
	/** Vị trí ảnh trong khung, NGUYÊN điểm ảnh (âm = lề trong suốt tràn ra ngoài khung). */
	left: number;
	top: number;
}

/**
 * Cỡ hiện một ô atlas icon chiêu trong ô giao diện `box`: chọn tỉ lệ theo PHẦN HÌNH (ô trừ lề trong suốt `SKILL_ICON_PAD`)
 * chứ không theo cả ô — ô 28–31 vẫn hiện icon 32 nguyên lần (chỉ lề trong suốt tràn ra ngoài), thay vì thu ½ còn 16px; ô
 * 56–83 phóng 2×; ô 14–27 thu ½ (16px). Ảnh đặt ở toạ độ nguyên trong khung chiếm chỗ ≤ ô.
 */
export function skillIconFit(w: number, h: number, box: number): SkillIconFit {
	const k = fitScale(Math.max(1, w - 2 * SKILL_ICON_PAD), Math.max(1, h - 2 * SKILL_ICON_PAD), box);
	const sw = fitPx(w, k);
	const sh = fitPx(h, k);
	const outerW = Math.min(sw, box);
	const outerH = Math.min(sh, box);
	return { k, w: sw, h: sh, outerW, outerH, left: Math.floor((outerW - sw) / 2), top: Math.floor((outerH - sh) / 2) };
}

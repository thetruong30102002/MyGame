import { STYLE_TIER, TREE, type Branch, type SwordStyle } from './talents';

/**
 * Khoá tra atlas ICON CHIÊU RIÊNG (bộ v2: PixelLab vẽ MỘT icon 32×32 mỗi khoá — `public/assets/ui/skill-icons.{png,json}`,
 * dựng bằng `npm run assets:skill-icons`; bảng khoá gốc `packages/asset-pipeline/sources/pixellab/skill-icons-v2/
 * skill_icons_v2.json`, cùng khoá với bộ v1 lưu trữ `skill-icons/skill_icons.json`). Cỡ hiện: `components/iconFit.skillIconFit`.
 * Atlas có khoá thì `SkillIcon` / `TalentArt` dùng hình riêng; thiếu khoá (ô vẽ hỏng bị pipeline bỏ, chưa xuất atlas) thì
 * rơi về icon TẠM cũ (`SkillIcon.ICON_FRAME`, `tempArt.TEMP_ART`, `passiveTempArt.PASSIVE_TEMP`).
 *
 * Dạng khoá: id kỹ năng của HERO_SKILLS · `passive:<nhánh>:<mốc>[:<lưu phái>]` · `future:<nhánh>:<mốc>[:<lưu phái>]` (tuyệt
 * kỹ "Sắp có") · `spare:<nhánh>:<n>` (biểu tượng dự phòng). Hai khoá dự phòng chưa có chỗ gắn: `spare:aether:2` (Tẩy điểm),
 * `spare:aether:3` (Phản ứng nguyên tố).
 */

/** Ô không phải kỹ năng nhưng gọi `SkillIcon` bằng tên riêng (ô Né của thanh kỹ năng, chỉ số ở bảng Nhân vật). */
export const SKILL_ICON_ALIAS: Readonly<Record<string, string>> = {
	// Né (Space) — vệt lượn bẻ ngang.
	dodge: 'spare:aether:1',
	// Chỉ số Chí mạng = icon bị động Mắt Tinh (Kiếm Thần 4: chí mạng +8%).
	crit: 'passive:sword:4:kiem_than',
	// Chỉ số Né hoàn toàn = icon bị động Bóng Mờ (Bắc Thần 9).
	evade: 'passive:sword:9:bac_than',
	// Tuyệt kỹ mốc 10 (chỉ phòng tập): icon bộ v2 vẽ sẵn cho nút "Sắp có" của cây.
	phoenix: 'future:fire:10',
	great_flood: 'future:water:10',
	heaven_wind: 'future:wind:10',
	ice_age: 'future:ice:10',
	mountain_god: 'future:earth:10',
	judgment: 'future:sword:10:kiem_than',
	still_heaven: 'future:sword:10:thuy_than',
	thousand_shadows: 'future:sword:10:bac_than',
};

/** Đầu nhánh Kiếm (thay ảnh kiếm gỗ `SWORD_HEAD_ICON`) — cũng là icon nút Kiếm mốc ≥ 3 khi CHƯA chọn lưu phái. */
export const SWORD_HEAD_KEY = 'spare:sword:1';
/** Biểu tượng ba lưu phái Kiếm (thẻ chọn lưu phái mốc 3). */
export const STYLE_ICON_KEY: Readonly<Record<SwordStyle, string>> = { kiem_than: 'spare:sword:2', thuy_than: 'spare:sword:3', bac_than: 'spare:sword:4' };
/** Ô phủ phép đang trống ("Chưa phủ phép"). */
export const ENCHANT_EMPTY_KEY = 'spare:sword:5';

export const skillIconKey = (skillId: string): string => SKILL_ICON_ALIAS[skillId] ?? skillId;

/**
 * Khoá icon của một nút cây Tiềm năng. Có kỹ năng → id kỹ năng; Kiếm mốc ≥ 3 chưa chọn lưu phái → đầu nhánh Kiếm; bị động →
 * `passive:…`; nút chủ động không có kỹ năng (tuyệt kỹ mốc 10 "Sắp có") → `future:…`. Lưu phái chỉ tính từ mốc 3.
 */
export function nodeIconKey(skillId: string | undefined, branch: string, tier: number, style?: string | null): string {
	if (skillId) return skillIconKey(skillId);
	const styled = branch === 'sword' && tier >= STYLE_TIER;
	if (styled && !style) return SWORD_HEAD_KEY;
	const tail = styled ? `${branch}:${tier}:${style}` : `${branch}:${tier}`;
	return TREE[branch as Branch]?.[tier - 1]?.kind === 'passive' ? `passive:${tail}` : `future:${tail}`;
}

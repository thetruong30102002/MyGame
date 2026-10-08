/**
 * Phím mở dần theo tuổi, đúng nhịp truyện "người lớn dạy thì phím mới có": 4 tuổi chỉ đi + nói chuyện,
 * 6 tuổi học song song kiếm của cha (J) và phép của mẹ (K, 1, 2) — từng phím còn khoá tới khi nhận quà /
 * học xong (`HERO_SKILLS.unlock`), 8 tuổi cha dạy né (Space) và mẹ đưa hũ mật (R).
 */
export function controlsForAge(age: number): { cast: boolean; dodge: boolean; potion: boolean; hud: 'minimal' | 'magic' | 'full' } {
	if (age < 6) return { cast: false, dodge: false, potion: false, hud: 'minimal' };
	if (age < 8) return { cast: true, dodge: false, potion: false, hud: 'magic' };
	return { cast: true, dodge: true, potion: true, hud: 'full' };
}

export function ageTitle(age: number): string {
	const words: Record<number, string> = { 4: 'Bốn tuổi', 6: 'Sáu tuổi', 8: 'Tám tuổi' };
	return age >= 16 ? 'Tám năm sau · Mười sáu tuổi' : (words[age] ?? `${age} tuổi`);
}

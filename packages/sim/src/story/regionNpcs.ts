import type { NpcDef } from './storyTypes.ts';

/**
 * NPC truyện các vùng (giữ sau khi bỏ cốt truyện cũ 13/11/2026 — chủ dự án: "Bỏ hết cũ đi, xoá luôn những cái k dùng"): người giao
 * việc đứng ở trạm vùng và người "chỉ nói" (chưa có chỗ đứng, sẽ đặt theo nhiệm vụ Phụ mới — docs/thiet-ke/he-nhiem-vu-bon-loai-2026-11.md).
 * Bram: thương nhân ở quảng trường Thistlewood (cửa hàng kim cương). Nhân vật không còn tuổi — chỉ còn cấp.
 */

export const BRAM: NpcDef = {
	name: 'Bram',
	title: 'Thương nhân lữ hành',
	sprite: 'npc_bram_001',
	at: { spot: 'plaza', dx: -110, dy: -40 },
	idle: ['Hàng mới về chưa kịp xếp. Ghé lại sau nhé — mà nhớ mang theo tiền đấy!', 'Thế giới này rộng lắm. Rộng hơn cái rừng Mossvale kia nhiều.'],
};

/** NPC chỉ để hiện tên + chân dung trong hộp thoại (không đứng ở map nào); hình PixelLab riêng vẽ 13/11. */
const voice = (name: string, title: string, sprite: string | null = null): NpcDef => ({ name, title, sprite, at: { spot: '__voice__' }, idle: [] });

/** Người giao việc đứng ở quảng trường trạm của vùng (lệch khỏi Bram / Sein / Sera / cột dịch chuyển). */
const elder = (region: string, name: string, title: string, sprite: string, idle: string[]): NpcDef => ({
	name,
	title,
	sprite,
	at: { spot: 'plaza', dx: 130, dy: 70 },
	region,
	idle,
});

export const REGION_NPCS: Record<string, NpcDef> = {
	nyra: voice('Nyra', 'Thầy thuốc đầm lầy', 'npc_lx_nyra_001'),
	odessa: voice('Odessa', 'Phù thuỷ đầm', 'npc_lx_odessa_001'),
	zahra: voice('Zahra', 'Thủ lĩnh phe nổi dậy', 'npc_sa_zahra_001'),
	hassim: voice('Hassim', 'Tể tướng Sahrin', 'npc_sa_hassim_001'),
	orrin: voice('Orrin', 'Pháp sư gió', 'npc_gh_orrin_001'),
	wenna: voice('Bà Wenna', 'Chủ cối xay', 'npc_gh_wenna_001'),
	kael: voice('Kael', 'Thợ săn Tuyết Phong', 'npc_tp_kael_001'),
	hilde: voice('Hilde', 'Nữ vương rèn Đe Đỏ', 'npc_dd_hilde_001'),
	durin: voice('Durin', 'Em trai nữ vương', 'npc_dd_durin_001'),
	maris: voice('Maris', 'Công chúa người cá', 'npc_sc_maris_001'),
	corvin: voice('Corvin', 'Thuyền trưởng Hải Âu Bạc', 'npc_sc_corvin_001'),

	ysolde: elder('swamp', 'Bà Ysolde', 'Trưởng làng Lau Xám', 'npc_ysolde_001', [
		'Sương hôm nay đặc. Đặc như hồi đập mới xây.',
		'Trà trong ấm còn. Uống đi rồi hẵng nói chuyện người Rowanmere.',
	]),
	amira: elder('desert', 'Nữ hoàng Amira', 'Ốc đảo Sahrin', 'npc_sa_amira_001', [
		'Nước trong giếng hoàng gia mỗi tuần thấp thêm một gang. Ta đếm từng gang.',
		'Ở Sahrin, khách là người được uống trước. Cậu đã uống chưa?',
	]),
	bjorn: elder('tundra', 'Bjorn', 'Thợ săn già Tuyết Phong', 'npc_tp_bjorn_001', [
		'Đọc gió trước, rồi mới đọc dấu chân. Ai dạy cậu thế? Hừm. Người đó biết việc.',
		'Bão chưa tan. Ở lại thêm một đêm cũng chẳng chết ai.',
	]),
	coral: elder('isles', 'Mẹ Coral', 'Bếp lửa làng chài San Hô', 'npc_sc_coral_001', [
		'Ăn đi rồi khóc. Đói thì khóc không ra hơi.',
		'Biển trong tới mức thấy đáy. Mà đáy toàn tàu, con ạ.',
	]),

};

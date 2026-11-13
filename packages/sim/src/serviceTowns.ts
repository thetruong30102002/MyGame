import type { NpcDef } from './story/storyTypes.ts';

/**
 * Nhà dịch vụ vào được (chủ dự án 12/11/2026: "mỗi vùng sẽ có style phòng rèn, ngân hàng, quán rượu style theo vùng"; duyệt ảnh ghép
 * thử 13/11 "ok lam di"): mỗi khu dân cư 7 nhà, bước vào cửa là sang map phòng riêng `svc_<phòng>` của vùng, NPC vùng đứng sau quầy.
 * Hình nhà / đồ GPT đợt 14–19 (Thistlewood bên trong dùng đợt 2 / 4 / 13), NPC PixelLab 13/11. Dùng chung bộ dựng map và máy chủ.
 */
export const SERVICE_ROOMS = ['qr', 'nh', 'vk', 'tb', 'lr', 'nc', 'hp'] as const;
export type ServiceRoom = (typeof SERVICE_ROOMS)[number];
export const SERVICE_ROOM_INFO: Record<ServiceRoom, { name: string; role: string; title: string }> = {
	qr: { name: 'Quán rượu', role: 'tavern', title: 'Chủ quán rượu' },
	nh: { name: 'Ngân hàng', role: 'bank', title: 'Chủ ngân hàng' },
	vk: { name: 'Tiệm vũ khí', role: 'weapon', title: 'Người bán vũ khí' },
	tb: { name: 'Tiệm trang bị', role: 'armor', title: 'Người bán trang bị' },
	lr: { name: 'Lò rèn', role: 'smith', title: 'Thợ rèn' },
	nc: { name: 'Xưởng nâng cấp', role: 'upgrade', title: 'Thợ nâng cấp' },
	hp: { name: 'Tiệm hồi phục', role: 'heal', title: 'Người bán hồi phục' },
};
/** Map phòng trong vùng: `svc_qr`… (id địa điểm và map không trùng map ngoài trời). */
export const serviceRoomMap = (room: ServiceRoom): string => `svc_${room}`;
export const isServiceRoomMap = (mapId: string): boolean => /^svc_[a-z]{2}$/.test(mapId);

/** Khu có nhà dịch vụ: mã hình (tl, lx…), vùng, map trạm, đợt GPT của nhà / đồ bên trong. */
export const SERVICE_TOWNS = [
	{ code: 'tl', region: 'human', hub: 'town', town: 'Thistlewood', batch: 'dot-14' },
	{ code: 'lx', region: 'swamp', hub: 'hub', town: 'Lau Xám', batch: 'dot-14' },
	{ code: 'sa', region: 'desert', hub: 'hub', town: 'Sahrin', batch: 'dot-15' },
	{ code: 'gh', region: 'highland', hub: 'hub', town: 'Cối Xay Gió', batch: 'dot-16' },
	{ code: 'tp', region: 'tundra', hub: 'hub', town: 'Tuyết Phong', batch: 'dot-17' },
	{ code: 'dd', region: 'volcano', hub: 'hub', town: 'Đe Đỏ', batch: 'dot-18' },
	{ code: 'sc', region: 'isles', hub: 'hub', town: 'San Hô', batch: 'dot-19' },
] as const;

/** Thistlewood: 4 người bán cũ (quảng trường, đã quen với Gia viên) chuyển vào quầy; 3 vai còn lại dùng NPC PixelLab mới. */
export const SERVICE_KEEPERS_TL: Partial<Record<ServiceRoom, string>> = { vk: 'village_weapon', tb: 'village_armor', lr: 'village_smith', hp: 'village_heal' };
/** Chỗ đứng NPC sau quầy trong phòng. */
export const serviceNpcSpot = (room: ServiceRoom): string => `svc_${room}_keeper`;

const IDLE: Record<string, string> = {
	tavern: 'Ngồi xuống đi, món nóng của quán giúp cậu vững tay cả buổi.',
	bank: 'Két ở đây chắc nhất vùng. Sổ gửi đồ sẽ mở khi hội buôn duyệt xong luật.',
	weapon: 'Chọn đúng món của nghề mình. Hàng mới về theo từng chuyến buôn.',
	armor: 'Một bộ áo tốt phải giúp người mặc trở về.',
	smith: 'Lò còn đỏ đấy. Công thức rèn sẽ mở cùng tuyến truyện mới.',
	upgrade: 'Đá cường hoá cần thời gian tinh luyện. Quay lại khi xưởng nhận việc.',
	heal: 'Đừng đợi kiệt sức mới nhớ mang thuốc.',
};

/** Tên riêng NPC quầy (chủ dự án 13/11/2026: "Tất cả npc sẽ có tên tiếng Anh") — theo chất vùng; chức danh vẫn tiếng Việt. */
export const KEEPER_NAMES: Record<string, Record<string, string>> = {"tl": {"tavern": "Bess", "bank": "Alden", "upgrade": "Quinn"}, "lx": {"tavern": "Marla", "bank": "Fenwick", "weapon": "Reed", "armor": "Willa", "smith": "Hollis", "upgrade": "Moss", "heal": "Fern"}, "sa": {"tavern": "Samira", "bank": "Rashid", "weapon": "Tariq", "armor": "Leila", "smith": "Karim", "upgrade": "Nadir", "heal": "Yasmin"}, "gh": {"tavern": "Greta", "bank": "Henrik", "weapon": "Lukas", "armor": "Ingrid", "smith": "Otto", "upgrade": "Felix", "heal": "Elsa"}, "tp": {"tavern": "Sigrid", "bank": "Halvard", "weapon": "Ulf", "armor": "Astrid", "smith": "Torvald", "upgrade": "Eira", "heal": "Solveig"}, "dd": {"tavern": "Dagna", "bank": "Brokk", "weapon": "Thrain", "armor": "Helga", "smith": "Gunnar", "upgrade": "Grimm", "heal": "Runa"}, "sc": {"tavern": "Marisol", "bank": "Cormac", "weapon": "Finn", "armor": "Nerys", "smith": "Brennan", "upgrade": "Pearl", "heal": "Delphine"}};

/** NPC đứng quầy các khu (trừ 4 người bán cũ của Thistlewood): khoá `village_<mã>_<vai>`. */
export const SERVICE_KEEPER_NPCS: Record<string, NpcDef> = Object.fromEntries(
	SERVICE_TOWNS.flatMap((t) =>
		SERVICE_ROOMS.filter((r) => !(t.code === 'tl' && SERVICE_KEEPERS_TL[r])).map((r) => {
			const info = SERVICE_ROOM_INFO[r];
			return [
				`village_${t.code}_${info.role}`,
				{
					name: KEEPER_NAMES[t.code]?.[info.role] ?? info.title,
					title: `${info.title} · ${t.town}`,
					sprite: `npc_${t.code}_${info.role}_001`,
					region: t.region,
					at: { spot: serviceNpcSpot(r) },
					ages: [16, 99],
					stationary: true,
					idle: [IDLE[info.role]!],
				} satisfies NpcDef,
			];
		}),
	),
);

/** Vai của NPC quầy (`village_lx_heal` → heal; người bán cũ Thistlewood theo khoá cũ). */
export function serviceRole(npc: string): string | null {
	const old: Record<string, string> = { village_weapon: 'weapon', village_armor: 'armor', village_smith: 'smith', village_heal: 'heal', village_food: 'tavern' };
	if (old[npc]) return old[npc]!;
	const m = /^village_[a-z]{2}_([a-z]+)$/.exec(npc);
	return m ? m[1]! : null;
}

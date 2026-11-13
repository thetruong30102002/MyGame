import type { NpcDef } from './story/storyTypes.ts';

/**
 * Hệ nhiệm vụ mới bốn loại (docs/thiet-ke/he-nhiem-vu-bon-loai-2026-11.md + bản sửa drama mục 1b; chủ dự án duyệt 13/11/2026 "Ok làm
 * đi"). Máy chủ là nguồn sự thật: nhận việc, đếm tiến độ từ sự kiện đã kiểm (nói chuyện / tới chỗ / hạ quái / Gia viên), trao thưởng
 * một lần theo `ref`. Đợt 1: Hồi I tuyến Chính (M01–M07), 2 chuỗi Phụ Thistlewood, 10 mẫu Hằng ngày, mẫu Thế giới báo động boss vùng.
 * Thưởng là SỐ THỬ (phần EXP của cấp hiện tại + xu), chờ duyệt cùng `progression-slower`. Chưa thay chuỗi truyện cũ (`story/`).
 */
export type Q2Kind = 'main' | 'side' | 'daily' | 'world';
export type Q2Life = 'harvest' | 'fish' | 'cook' | 'feed';
export type Q2Objective =
	| { kind: 'talk'; npc: string }
	| { kind: 'talkAll'; npcs: readonly string[] }
	| { kind: 'reach'; spot: string }
	| { kind: 'kill'; monster?: string; region?: string; count: number }
	| { kind: 'boss'; id: string }
	| { kind: Q2Life; count: number };
export interface Q2Step {
	id: string;
	/** Dòng mục tiêu trên ô theo dõi / tab Nhiệm vụ (`{n}` / `{total}` = tiến độ). */
	text: string;
	objective: Q2Objective;
	/** Câu NPC nói lúc bước bắt đầu / lúc xong bước. */
	start?: string;
	done?: string;
}
export interface Q2Def {
	id: string;
	kind: Q2Kind;
	title: string;
	summary: string;
	giver?: string;
	unlock: { minLevel?: number; after?: readonly string[]; farm?: boolean };
	steps: readonly Q2Step[];
	/** EXP = `expFrac` × EXP cần cho cấp hiện tại (máy chủ tính lúc trao), xu cố định. */
	reward: { expFrac: number; coins: number; unlockFarm?: boolean };
}

const talk = (npc: string): Q2Objective => ({ kind: 'talk', npc });
const reach = (spot: string): Q2Objective => ({ kind: 'reach', spot });

/** NPC truyện mới (hình PixelLab `npc_q2_*`, tên tiếng Anh) — đứng yên ở map đầu. */
export const Q2_NPCS: Record<string, NpcDef> = {
	q2_nell: { name: 'Nell', title: 'Bà chủ quán', sprite: 'npc_q2_nell_001', region: 'human', at: { spot: 'plaza', dx: -210, dy: -120 }, ages: [16, 99], stationary: true, idle: ['Ta vẫn làm thừa một phần bánh. Tay ta nhớ, đầu ta thì không.'] },
	q2_pip: { name: 'Pip', title: 'Cô bé ở chợ', sprite: 'npc_q2_pip_001', region: 'human', at: { spot: 'plaza', dx: 150, dy: -130 }, ages: [16, 99], stationary: true, idle: ['Em ghi tên mọi người vào sổ. Mai em quên thì còn hỏi lại được.'] },
	q2_gareth: { name: 'Gareth', title: 'Người hướng dẫn nghề', sprite: 'npc_q2_gareth_001', region: 'human', at: { spot: 'backyard', dx: 70, dy: 10 }, ages: [16, 99], stationary: true, idle: ['Nghề nào cũng bắt đầu bằng việc giữ được hơi thở.'] },
	q2_edda: { name: 'Edda', title: 'Người đưa thư', sprite: 'npc_q2_edda_001', region: 'human', at: { spot: 'plaza', dx: -270, dy: 150 }, ages: [16, 99], stationary: true, idle: ['Thư không người nhận vẫn là thư. Ta đưa nó tới khi có người nhận.'] },
	q2_tobin: { name: 'Tobin', title: 'Người gác đường nghĩa địa', sprite: 'npc_q2_tobin_001', region: 'human', at: { spot: 'south_gate_gy', dx: 70, dy: -50 }, ages: [16, 99], stationary: true, idle: ['Đường này ta gác ba mươi năm. Ta nhớ từng bia mộ.'] },
};

/** Người cố định map đầu phải gặp ở M03 (không mở Gia viên khi thiếu). */
export const Q2_FIRST_MAP_NPCS = ['village_armor', 'village_smith', 'village_weapon', 'village_food', 'village_heal', 'village_event', 'village_tl_tavern', 'village_tl_bank', 'village_tl_upgrade', 'q2_pip'] as const;

export const Q2_QUESTS: readonly Q2Def[] = [
	{
		id: 'q2_main_01', kind: 'main', title: 'Chỗ trống trong chợ', summary: 'Bà Nell nhờ mang phần bánh dư tới một quầy sát chợ — nhưng quầy ấy không còn ai.', giver: 'q2_nell', unlock: {},
		steps: [
			{ id: 'a', text: 'Nhận phần bánh từ bà Nell', objective: talk('q2_nell'), start: 'Mang hộ ta phần bánh này. Đừng hỏi vì sao ta làm thừa.' },
			{ id: 'b', text: 'Tới quầy trống ở quảng trường', objective: reach('plaza') },
			{ id: 'c', text: 'Hỏi Pip về người từng bán bánh ở đây', objective: talk('q2_pip'), done: 'Chỗ đó có chị em. Em vẫn còn nhớ tiếng chị gọi.' },
			{ id: 'd', text: 'Đem mẩu giấy của Pip về cho bà Nell', objective: talk('q2_nell'), done: 'Có người đã nướng bánh ở đây. Ta không nhớ làm cho ai — tay ta vẫn nhớ.' },
		],
		reward: { expFrac: 0.18, coins: 20 },
	},
	{
		id: 'q2_main_02', kind: 'main', title: 'Một nghề để trở về', summary: 'Gặp người hướng dẫn nghề, thử món đồ vừa tay trên hình nộm.', giver: 'q2_gareth', unlock: { after: ['q2_main_01'] },
		steps: [
			{ id: 'a', text: 'Gặp Gareth ở sân sau nhà Ashvale', objective: talk('q2_gareth'), start: 'Cậu đã chọn nghề. Giờ thử món đồ vừa tay trên hình nộm.' },
			{ id: 'b', text: 'Tập trên hình nộm ở sân sau', objective: reach('backyard') },
			{ id: 'c', text: 'Nói lại với Ren ở tiệm vũ khí', objective: talk('village_weapon'), done: 'Học cách giữ sức để về nhà đã; chiêu đẹp để sau.' },
		],
		reward: { expFrac: 0.18, coins: 20 },
	},
	{
		id: 'q2_main_03', kind: 'main', title: 'Những căn phòng còn sáng', summary: 'Bà Nell muốn nghe mỗi người ở chợ còn nhớ gì — không phải một danh sách đánh dấu.', giver: 'q2_nell', unlock: { after: ['q2_main_02'] },
		steps: [
			{ id: 'a', text: 'Nhận tờ danh sách từ bà Nell', objective: talk('q2_nell'), start: 'Ta muốn nghe mỗi người nhớ gì, không muốn một danh sách dấu tick.' },
			{ id: 'b', text: 'Hỏi chuyện mọi người cố định ở Thistlewood ({n}/{total})', objective: { kind: 'talkAll', npcs: Q2_FIRST_MAP_NPCS } },
			{ id: 'c', text: 'Kể lại với bà Nell', objective: talk('q2_nell'), done: 'Orin nói nợ một cái đĩa. Không nhớ tên người nhận không xoá món nợ.' },
		],
		reward: { expFrac: 0.25, coins: 25 },
	},
	{
		id: 'q2_main_04', kind: 'main', title: 'Ngày chợ bị xé', summary: 'Quái tràn qua lối cũ phía đông. Giữ lối, đưa người bị thương tới Lena.', giver: 'village_heal', unlock: { after: ['q2_main_03'], minLevel: 2 },
		steps: [
			{ id: 'a', text: 'Hạ nấm độc ở rừng Mossvale ({n}/{total})', objective: { kind: 'kill', monster: 'mob_mushroom_001', count: 6 }, start: 'Đỡ người ngã trước. Tấm biển gãy chưa chạy đi đâu.' },
			{ id: 'b', text: 'Đưa người bị thương tới Lena', objective: talk('village_heal') },
			{ id: 'c', text: 'Báo tin cho Iris', objective: talk('village_event'), done: 'Cái mực này cũng có ở sổ trạm. Không chỉ chợ mình gặp chuyện.' },
		],
		reward: { expFrac: 0.25, coins: 30 },
	},
	{
		id: 'q2_main_05', kind: 'main', title: 'Bàn giao khuôn viên', summary: 'Cậu đã biết người ở đây. Giờ cậu có một chỗ để trở về.', giver: 'village_event', unlock: { after: ['q2_main_04'], minLevel: 3 },
		steps: [
			{ id: 'a', text: 'Gặp Iris nhận giấy bàn giao', objective: talk('village_event') },
			{ id: 'b', text: 'Cảm ơn bà Nell', objective: talk('q2_nell'), done: 'Một chỗ để cậu trở về. Đừng để nó thành một cái tên chỉ có trên giấy.' },
		],
		reward: { expFrac: 0.2, coins: 20, unlockFarm: true },
	},
	{
		id: 'q2_main_06', kind: 'main', title: 'Mực dưới rêu', summary: 'Theo tấm biển gãy tới nghĩa địa. Có người sống đã ký lệnh cho cột mốc.', giver: 'q2_edda', unlock: { after: ['q2_main_05'], minLevel: 5 },
		steps: [
			{ id: 'a', text: 'Nhận việc từ Edda', objective: talk('q2_edda'), start: 'Lệnh điều khiển cột mốc nằm ở nghĩa địa. Chữ ký là người sống.' },
			{ id: 'b', text: 'Tới cổng nghĩa địa', objective: reach('south_gate_gy') },
			{ id: 'c', text: 'Hỏi Tobin, người gác đường', objective: talk('q2_tobin') },
			{ id: 'd', text: 'Dọn xác sống quanh khu mộ ({n}/{total})', objective: { kind: 'kill', monster: 'mob_zombie_001', count: 8 } },
			{ id: 'e', text: 'Hạ Quỷ vương rừng sâu', objective: { kind: 'boss', id: 'boss_demon_001' } },
			{ id: 'f', text: 'Mang lệnh cột mốc về cho Edda', objective: talk('q2_edda'), done: 'Quỷ vương đã gục, nhưng ai viết lệnh cho nó thức? …Tobin không còn nhận ra cậu nữa.' },
		],
		reward: { expFrac: 0.3, coins: 40 },
	},
	{
		id: 'q2_main_07', kind: 'main', title: 'Tám ngọn đèn', summary: 'Đủ cấp 10, tám ngọn đèn cho biết cậu nghe được dòng nguyên tố nào.', giver: 'q2_gareth', unlock: { after: ['q2_main_02'], minLevel: 10 },
		steps: [{ id: 'a', text: 'Gặp Gareth thử tám ngọn đèn', objective: talk('q2_gareth'), start: 'Tám ngọn đèn sáng như nhau. Đừng chọn người khác hộ mình.', done: 'Đèn cho biết cậu nghe dòng nào, không bảo cậu phải thành ai.' }],
		reward: { expFrac: 0.18, coins: 20 },
	},
	{
		id: 'q2_side_01', kind: 'side', title: 'Đĩa nợ chưa rửa', summary: 'Orin nợ một cái đĩa mà không nhớ nợ ai.', giver: 'village_smith', unlock: { after: ['q2_main_01'] },
		steps: [
			{ id: 'a', text: 'Nghe Orin kể về cái đĩa', objective: talk('village_smith') },
			{ id: 'b', text: 'Hỏi Maya về quầy bánh cũ', objective: talk('village_food') },
			{ id: 'c', text: 'Tìm cái đĩa khắc tên trong lò rèn', objective: reach('svc_lr_keeper') },
			{ id: 'd', text: 'Đặt lại cái đĩa vào quầy trống', objective: reach('plaza'), done: 'Orin: "Ta từng ăn ở đó. Giờ thì ta nhớ ra mình đã ăn."' },
		],
		reward: { expFrac: 0.08, coins: 15 },
	},
	{
		id: 'q2_side_02', kind: 'side', title: 'Áo cho người về muộn', summary: 'Ela còn một bộ áo may dở, số đo của một người chưa về.', giver: 'village_armor', unlock: { after: ['q2_main_01'] },
		steps: [
			{ id: 'a', text: 'Nghe Ela kể về bộ áo may dở', objective: talk('village_armor') },
			{ id: 'b', text: 'Hỏi Lena về những người chưa về', objective: talk('village_heal') },
			{ id: 'c', text: 'Mang áo tới nhà thờ làm trạm cứu hộ', objective: reach('church'), done: 'Ela treo bảng nhận đồ công khai — ai về muộn cũng có áo.' },
		],
		reward: { expFrac: 0.08, coins: 15 },
	},
];

/** Mẫu việc Hằng ngày: rổ bốc, khoảng cấp, cần Gia viên mở, mục tiêu. */
export interface Q2DailyTemplate { id: string; title: string; basket: 'combat' | 'errand' | 'life'; minLevel: number; maxLevel: number; farm?: boolean; objective: Q2Objective; text: string }
export const Q2_DAILY: readonly Q2DailyTemplate[] = [
	{ id: 'q2_daily_01', title: 'Giữ đường chợ', basket: 'combat', minLevel: 1, maxLevel: 9, objective: { kind: 'kill', count: 4 }, text: 'Hạ quái bất kỳ ({n}/{total})' },
	{ id: 'q2_daily_02', title: 'Gói hàng cho Maya', basket: 'errand', minLevel: 1, maxLevel: 9, objective: talk('village_food'), text: 'Giao gói hàng cho Maya' },
	{ id: 'q2_daily_03', title: 'Tuần đường săn', basket: 'combat', minLevel: 10, maxLevel: 29, objective: { kind: 'kill', count: 6 }, text: 'Hạ quái bất kỳ ({n}/{total})' },
	{ id: 'q2_daily_04', title: 'Kiện hàng qua trạm', basket: 'errand', minLevel: 10, maxLevel: 999, objective: talk('village_event'), text: 'Đưa kiện hàng cho Iris' },
	{ id: 'q2_daily_05', title: 'Hỗ trợ tuyến cứu hộ', basket: 'combat', minLevel: 30, maxLevel: 999, objective: { kind: 'kill', count: 10 }, text: 'Hạ quái bất kỳ ({n}/{total})' },
	{ id: 'q2_daily_06', title: 'Ba cây vừa chín', basket: 'life', minLevel: 1, maxLevel: 999, farm: true, objective: { kind: 'harvest', count: 3 }, text: 'Thu hoạch cây ở Gia viên ({n}/{total})' },
	{ id: 'q2_daily_07', title: 'Hai con cá thường', basket: 'life', minLevel: 1, maxLevel: 999, farm: true, objective: { kind: 'fish', count: 2 }, text: 'Câu cá ở hồ Gia viên ({n}/{total})' },
	{ id: 'q2_daily_08', title: 'Một bữa nóng', basket: 'life', minLevel: 1, maxLevel: 999, farm: true, objective: { kind: 'cook', count: 1 }, text: 'Nấu một món ở bếp lò' },
	{ id: 'q2_daily_09', title: 'Chăm đàn', basket: 'life', minLevel: 1, maxLevel: 999, farm: true, objective: { kind: 'feed', count: 1 }, text: 'Cho đàn vật nuôi ăn' },
	{ id: 'q2_daily_11', title: 'Thảo dược cho Lena', basket: 'errand', minLevel: 1, maxLevel: 999, objective: talk('village_heal'), text: 'Mang thảo dược tới Lena' },
	{ id: 'q2_daily_10', title: 'Hỏi thăm quán rượu', basket: 'errand', minLevel: 1, maxLevel: 999, objective: talk('village_tl_tavern'), text: 'Ghé quán rượu Thistlewood gặp Bess' },
];
export const Q2_DAILY_SLOTS = 4;
/** Thưởng mỗi việc ngày theo ô (phần EXP / xu) + thưởng đủ cả bộ. */
export const Q2_DAILY_REWARD = [{ expFrac: 0.03, coins: 10 }, { expFrac: 0.04, coins: 15 }, { expFrac: 0.05, coins: 20 }, { expFrac: 0.06, coins: 25 }] as const;
export const Q2_DAILY_BONUS = { expFrac: 0.08, coins: 40 } as const;
/** Thế giới: báo động boss vùng — góp = được tính công khi boss gục; phiên 30 phút. */
export const Q2_WORLD_BOSS = { id: 'q2_world_01', title: 'Báo động boss vùng', minutes: 30, reward: { expFrac: 0.1, coins: 50 } } as const;

export const q2Quest = (id: string): Q2Def | undefined => Q2_QUESTS.find((q) => q.id === id);
export const q2DateKey = (now: number): string => new Date(now + 7 * 3600_000).toISOString().slice(0, 10);
export const objectiveTotal = (o: Q2Objective): number => (o.kind === 'talkAll' ? o.npcs.length : 'count' in o ? o.count : 1);

/** Băm chuỗi ổn định 32 bit (FNV-1a) — bốc việc ngày tất định theo nhân vật + ngày + phiên bản bảng. */
export function hash32(s: string): number {
	let h = 0x811c9dc5;
	for (let i = 0; i < s.length; i++) {
		h ^= s.charCodeAt(i);
		h = Math.imul(h, 0x01000193) >>> 0;
	}
	return h >>> 0;
}

/** Bốn việc ngày: 1 chiến đấu, 1 việc vặt, 1 sinh hoạt (Gia viên đã mở, không thì việc vặt), 1 tự do — không trùng mẫu. */
export function pickDaily(character: string, dateKey: string, level: number, farmOpen: boolean, version = 1): string[] {
	const ok = Q2_DAILY.filter((t) => level >= t.minLevel && level <= t.maxLevel && (!t.farm || farmOpen));
	const order = (pool: readonly Q2DailyTemplate[], salt: string) => [...pool].sort((a, b) => hash32(`${character}|${dateKey}|${version}|${salt}|${a.id}`) - hash32(`${character}|${dateKey}|${version}|${salt}|${b.id}`));
	const out: string[] = [];
	const take = (pool: readonly Q2DailyTemplate[], salt: string) => {
		const t = order(pool.filter((x) => !out.includes(x.id)), salt)[0];
		if (t) out.push(t.id);
	};
	take(ok.filter((t) => t.basket === 'combat'), 'c');
	take(ok.filter((t) => t.basket === 'errand'), 'e');
	take(ok.filter((t) => t.basket === (farmOpen ? 'life' : 'errand')), 'l');
	while (out.length < Q2_DAILY_SLOTS) {
		const before = out.length;
		take(ok, 'f' + out.length);
		if (out.length === before) break;
	}
	return out;
}

/** Trạng thái nhiệm vụ mới của một nhân vật (máy chủ lưu bảng `quest2_states`). */
export interface Q2Progress { step: number; count: number; met?: string[] }
export interface Q2State {
	v: 2;
	active: Record<string, Q2Progress>;
	done: string[];
	daily: { date: string; slots: { tpl: string; count: number; done: boolean }[]; bonus: boolean } | null;
	tracked: string | null;
}
export const newQ2State = (): Q2State => ({ v: 2, active: {}, done: [], daily: null, tracked: null });

/** Việc Chính / Phụ mở được (đủ cấp, đã xong việc trước, chưa làm / chưa xong). */
export function q2Available(s: Q2State, level: number): Q2Def[] {
	return Q2_QUESTS.filter((q) => !s.done.includes(q.id) && !s.active[q.id] && (q.unlock.minLevel ?? 0) <= level && (q.unlock.after ?? []).every((a) => s.done.includes(a)));
}

/** Một sự kiện đã kiểm áp lên MỘT mục tiêu: trả số tăng (0 = không liên quan). `met`: người đã gặp với `talkAll`. */
export function objectiveHit(o: Q2Objective, ev: Q2Event, met: string[] | undefined): number {
	switch (o.kind) {
		case 'talk': return ev.kind === 'talk' && ev.npc === o.npc ? 1 : 0;
		case 'talkAll': return ev.kind === 'talk' && o.npcs.includes(ev.npc) && !(met ?? []).includes(ev.npc) ? 1 : 0;
		case 'reach': return ev.kind === 'reach' && ev.spot === o.spot ? 1 : 0;
		case 'kill': return ev.kind === 'kill' && (!o.monster || ev.monster === o.monster) && (!o.region || ev.region === o.region) ? 1 : 0;
		case 'boss': return ev.kind === 'kill' && ev.monster === o.id ? 1 : 0;
		default: return ev.kind === o.kind ? 1 : 0;
	}
}
export type Q2Event = { kind: 'talk'; npc: string } | { kind: 'reach'; spot: string } | { kind: 'kill'; monster: string; region?: string } | { kind: Q2Life };

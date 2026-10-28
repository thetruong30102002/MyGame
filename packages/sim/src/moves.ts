import type { ActionAnim } from '@havenlord/protocol';

/**
 * Động tác nhân vật người chơi (Mốc 1 kế hoạch vẽ — `docs/the-gioi-aether.md` mục Skill nhân vật). Mỗi skill gọi đúng động tác của
 * nó; atlas chưa vẽ động tác đó (hướng đó) thì game tự dùng động tác sẵn có của skill (`SkillDef.anim`: attack / cast) — có hình
 * PixelLab chỉ cần thêm animation trùng tên vào spec nhân vật (`packages/asset-pipeline/src/specs/player_hero_adult*.json`), không
 * sửa code. Tên chỉ gồm chữ thường a–z: khung trong atlas đặt tên `<động tác>_<hướng>_<số>`.
 */
export type Wield = 'melee' | 'magic';

export interface MoveDef {
	id: ActionAnim;
	name: string;
	/** Thế cầm sau động tác (kiếm / trượng); null = giữ thế trước đó (trúng đòn, uống bình…). */
	wield: Wield | null;
}

export const MOVES: readonly MoveDef[] = [
	{ id: 'attack', name: 'Đòn kiếm 1: vung ngang', wield: 'melee' },
	{ id: 'backslash', name: 'Đòn kiếm 2: vung ngược', wield: 'melee' },
	{ id: 'thrust', name: 'Đòn kiếm 3: đâm tới', wield: 'melee' },
	{ id: 'cast', name: 'Niệm phép (động tác sẵn có)', wield: 'magic' },
	{ id: 'throw', name: 'Vung tay phóng phép', wield: 'magic' },
	{ id: 'channel', name: 'Giơ trượng niệm', wield: 'magic' },
	{ id: 'push', name: 'Hai tay đẩy về trước', wield: 'magic' },
	{ id: 'skycall', name: 'Chỉ tay lên trời gọi', wield: 'magic' },
	{ id: 'stomp', name: 'Dậm chân / áp tay xuống đất', wield: 'magic' },
	{ id: 'charge', name: 'Dồn lực: giơ kiếm qua đầu', wield: 'melee' },
	{ id: 'smash', name: 'Bổ kiếm từ trên xuống đất', wield: 'melee' },
	{ id: 'lunge', name: 'Lướt tới đâm xuyên', wield: 'melee' },
	{ id: 'dodge', name: 'Lướt ngang', wield: null },
	{ id: 'block', name: 'Giữ thế: kiếm ngang trước ngực', wield: 'melee' },
	{ id: 'parry', name: 'Đỡ → phản: gạt kiếm rồi chém trả', wield: 'melee' },
	{ id: 'spin', name: 'Xoay một vòng chém quanh người', wield: 'melee' },
	{ id: 'flurry', name: 'Chuỗi 4 nhát nhanh', wield: 'melee' },
	{ id: 'wave', name: 'Vung kiếm phóng khí', wield: 'melee' },
	{ id: 'fling', name: 'Phóng kiếm + bắt kiếm quay về', wield: 'melee' },
	{ id: 'vanish', name: 'Ảnh bộ: tan thành bóng → hiện sau lưng', wield: 'melee' },
	{ id: 'ultimate', name: 'Tuyệt kỹ: lơ lửng, hai tay giơ cao niệm', wield: 'magic' },
	{ id: 'hit', name: 'Trúng đòn giật lùi', wield: null },
	{ id: 'death', name: 'Gục', wield: null },
	{ id: 'revive', name: 'Đứng dậy hồi sinh', wield: null },
	{ id: 'drink', name: 'Uống bình', wield: null },
];

const BY_ID = new Map(MOVES.map((m) => [m.id as string, m]));

export function moveDef(id: string): MoveDef | undefined {
	return BY_ID.get(id);
}

/** Chuỗi đòn kiếm thường (Trảm, giữ phím): bấm tiếp trong `COMBO_WINDOW` giây thì sang nhát kế, chậm hơn thì về nhát đầu. */
export const SLASH_COMBO: readonly ActionAnim[] = ['attack', 'backslash', 'thrust'];
export const COMBO_WINDOW = 0.75;

/** Skill → động tác riêng. Skill vắng ở đây dùng thẳng `SkillDef.anim`. Trảm đi theo `SLASH_COMBO`. */
export const SKILL_MOVE: Readonly<Record<string, ActionAnim>> = {
	frost_cleave: 'attack',
	imbue: 'charge',
	aether_bolt: 'throw',
	fire_bolt: 'throw',
	water_lance: 'throw',
	wind_blade: 'throw',
	ice_shard: 'throw',
	rock_throw: 'throw',
	gale_fan: 'throw',
	heal: 'channel',
	flame_ring: 'channel',
	cyclone: 'channel',
	frost_field: 'channel',
	ice_mirror: 'channel',
	tornado: 'channel',
	fire_blast: 'push',
	tidal_wave: 'push',
	fire_wall: 'push',
	meteor: 'skycall',
	call_rain: 'skycall',
	thunder_rain: 'skycall',
	ice_rain: 'skycall',
	rockslide: 'skycall',
	ice_spire: 'skycall',
	quake: 'stomp',
	stone_spikes: 'stomp',
	stone_wall: 'stomp',
	heavy_strike: 'charge',
	sunder_strike: 'smash',
	earth_rend: 'smash',
	pierce_rush: 'lunge',
	side_slash: 'dodge',
	gale_dash: 'dodge',
	calm_stance: 'block',
	flowing_counter: 'parry',
	backflow: 'parry',
	whirlpool: 'wave',
	gale_blade_dance: 'spin',
	chain_slash: 'flurry',
	blade_wave: 'wave',
	// Tuyệt kỹ mốc 10 (chỉ phòng tập) — mượn động tác sẵn có cùng thế cầm.
	phoenix: 'skycall',
	great_flood: 'push',
	heaven_wind: 'channel',
	ice_age: 'skycall',
	mountain_god: 'skycall',
	judgment: 'wave',
	still_heaven: 'smash',
	thousand_shadows: 'flurry',
	blaze_slash: 'wave',
	water_dragon_slash: 'wave',
	flying_sword: 'fling',
	shadow_step: 'vanish',
};

/** Thế cầm sau khung của động tác `anim` (tên animation trong atlas); không phải động tác ra đòn → undefined. */
export function wieldOf(anim: string | undefined): Wield | null | undefined {
	return anim ? BY_ID.get(anim)?.wield : undefined;
}

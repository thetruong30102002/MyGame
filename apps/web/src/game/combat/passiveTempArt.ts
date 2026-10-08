/**
 * ICON TẠM cho các mốc BỊ ĐỘNG trên cây Tiềm năng (đặc tả cây 08/10/2026, mục 1.2) — đặt cạnh `tempArt.TEMP_ART` theo cùng
 * luật "làm trước, có asset thì thay": bị động chưa có tranh PixelLab riêng nên mượn một frame atlas VFX (`assets/vfx`)
 * hoặc biểu tượng chỉ số có sẵn (`assets/ui/icon_*`, hiện thu đúng 1/2). Mọi chỗ mượn nằm ở bảng này để sau thay MỘT lần.
 *
 * Luật chọn: KHÔNG lặp lại icon nhánh (frame của kỹ năng mốc 1) và tránh trùng frame với kỹ năng chủ động cùng cột, để
 * người chơi không đọc nhầm bị động thành kỹ năng. Mốc 10 (tuyệt kỹ "Sắp có") không cần icon — ô hiện "…".
 *
 * Khoá: `<nhánh>:<mốc>` cho nhánh thường và Kiếm mốc 2; `<lưu phái>:<mốc>` cho bị động riêng của lưu phái Kiếm.
 */
export type PassiveTemp =
	/** Frame atlas VFX (tên frame không có tiền tố `vfx/`, vd 'flame_0'). */
	| { vfx: string }
	/** Ảnh PixelLab trong `public/assets/ui` + cỡ gốc (để thu đúng 1/2 khi ô nhỏ). */
	| { ui: string; w: number; h: number };

const UI_ATTACK = { ui: '/assets/ui/icon_attack.png', w: 48, h: 44 } as const;
const UI_DEFENSE = { ui: '/assets/ui/icon_defense.png', w: 48, h: 49 } as const;
const UI_HP = { ui: '/assets/ui/icon_hp.png', w: 43, h: 38 } as const;

export const PASSIVE_TEMP: Record<string, PassiveTemp> = {
	// ——— Kiếm (mốc 2 chung) + 3 lưu phái (mốc 4 / 7 / 9) ———
	'sword:2': { vfx: 'blood_hit_2' },
	'kiem_than:4': { vfx: 'crit_flash_2' },
	'kiem_than:7': UI_ATTACK,
	'kiem_than:9': UI_HP,
	'thuy_than:4': UI_DEFENSE,
	'thuy_than:7': { vfx: 'crit_flash_3' },
	'thuy_than:9': { vfx: 'water_ring_6' },
	'bac_than:4': { vfx: 'dust_2' },
	'bac_than:7': { vfx: 'wind_burst_5' },
	'bac_than:9': { vfx: 'shadow_5' },
	// ——— 5 nguyên tố (mốc 2 / 4 / 7 / 9) ———
	'fire:2': { vfx: 'flame_0' },
	'fire:4': { vfx: 'fire_flash_1' },
	'fire:7': { vfx: 'fire_burst_6' },
	'fire:9': { vfx: 'flame_3' },
	'water:2': { vfx: 'water_splash_0' },
	'water:4': UI_HP,
	'water:7': { vfx: 'sparkle_1' },
	'water:9': { vfx: 'water_wave_3' },
	'wind:2': { vfx: 'wind_burst_0' },
	'wind:4': { vfx: 'wind_burst_2' },
	'wind:7': { vfx: 'steam_1' },
	'wind:9': { vfx: 'steam_7' },
	'ice:2': { vfx: 'frost_0' },
	'ice:4': UI_DEFENSE,
	'ice:7': { vfx: 'frost_6' },
	'ice:9': { vfx: 'ice_burst_6' },
	'earth:2': { vfx: 'dust_5' },
	'earth:4': UI_DEFENSE,
	'earth:7': { vfx: 'dust_6' },
	'earth:9': UI_HP,
};

/** Khoá tra `PASSIVE_TEMP` của một mốc: bị động riêng của lưu phái Kiếm khoá theo lưu phái, còn lại theo nhánh. */
export function passiveTempKey(branch: string, tier: number, style?: string | null): string {
	return style ? `${style}:${tier}` : `${branch}:${tier}`;
}

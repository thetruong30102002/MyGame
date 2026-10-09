import { createImage, opaqueBounds, crop, type RGBAImage } from '../image/rgba.js';

/**
 * Hiệu ứng chiến đấu dựng từ ảnh tĩnh FreePixel `effects` (200×200, đã duyệt 02/10/2026).
 * Mỗi hiệu ứng thành một CHUỖI FRAME vẽ sẵn: bùng ra theo các cỡ khác nhau rồi tan rã bằng dither —
 * mép pixel luôn sắc ở mọi frame, không phải phóng/thu sprite lúc chạy (phóng lẻ là vỡ lưới pixel).
 */
export interface VfxDef {
	id: string;
	/** Ảnh tĩnh FreePixel dự phòng khi chưa có bản PixelLab. Hiệu ứng MỚI (hệ Băng…) chỉ có bản PixelLab: bỏ trống. */
	file?: string;
	/** Cạnh dài của frame lớn nhất (px). */
	size: number;
	/** Ép dẹt theo chiều dọc (hiệu ứng nằm trên mặt đất nhìn nghiêng): 0.5 = cao còn một nửa. */
	squashY?: number;
	kind: 'burst' | 'loop' | 'still';
	frames: number;
	/** Đã vẽ nhưng game CHƯA dùng → không đóng vào atlas (atlas giữ ≤ 4096 và nhẹ cho mọi người chơi). Nối vào game thì bỏ. */
	later?: true;
}

const E = (n: string): string => `effects/effects_particles_${n}.png`;

export const VFX: VfxDef[] = [
	{ id: 'fire_burst', file: E('0000_20260216_225830'), size: 64, kind: 'burst', frames: 9 },
	{ id: 'fire_flash', file: E('0017_20260216_230524'), size: 56, kind: 'burst', frames: 7 },
	{ id: 'fire_ring', file: E('0021_20260216_230648'), size: 132, squashY: 0.62, kind: 'burst', frames: 10 },
	{ id: 'fire_orb', file: E('0040_20260216_231506'), size: 24, kind: 'loop', frames: 4 },
	{ id: 'flame', file: E('0009_20260216_230213'), size: 30, kind: 'loop', frames: 4 },
	{ id: 'water_splash', file: E('0005_20260216_230047'), size: 52, kind: 'burst', frames: 8 },
	{ id: 'water_ring', file: E('0003_20260216_230000'), size: 72, squashY: 0.55, kind: 'burst', frames: 8 },
	{ id: 'water_wave', file: E('0027_20260216_230852'), size: 34, kind: 'loop', frames: 4 },
	{ id: 'wind_spin', file: E('0047_20260216_231740'), size: 40, kind: 'loop', frames: 4 },
	{ id: 'wind_burst', file: E('0047_20260216_231740'), size: 64, kind: 'burst', frames: 7 },
	{ id: 'frost', file: E('0013_20260216_230406'), size: 72, kind: 'burst', frames: 8 },
	{ id: 'steam', file: E('0016_20260216_230458'), size: 84, kind: 'burst', frames: 10 },
	{ id: 'arcane_burst', file: E('0018_20260216_230537'), size: 52, kind: 'burst', frames: 7 },
	{ id: 'arcane_orb', file: E('0018_20260216_230537'), size: 22, kind: 'loop', frames: 4 },
	{ id: 'sparkle', file: E('0007_20260216_230119'), size: 80, kind: 'burst', frames: 9 },
	{ id: 'crit_flash', file: E('0002_20260216_225933'), size: 60, kind: 'burst', frames: 6 },
	{ id: 'slash', file: E('0048_20260216_231759'), size: 92, kind: 'burst', frames: 6 },
	{ id: 'magic_circle', file: E('0024_20260216_230746'), size: 84, squashY: 0.5, kind: 'burst', frames: 8 },
	{ id: 'dark_ring', file: E('0030_20260216_231029'), size: 176, squashY: 0.55, kind: 'burst', frames: 10 },
	{ id: 'dark_ring_warn', file: E('0030_20260216_231029'), size: 168, squashY: 0.55, kind: 'still', frames: 1 },
	{ id: 'shadow', file: E('0025_20260216_230818'), size: 76, kind: 'burst', frames: 8 },
	{ id: 'dark_orb', file: E('0039_20260216_231444'), size: 26, kind: 'loop', frames: 4 },
	{ id: 'light_pillar', file: E('0006_20260216_230100'), size: 132, kind: 'burst', frames: 12 },
	{ id: 'dust', file: E('0004_20260216_230021'), size: 42, kind: 'burst', frames: 6 },
	{ id: 'blood_hit', file: E('0012_20260216_230335'), size: 44, kind: 'burst', frames: 6 },
	// Hệ Băng (07/10/2026): chỉ có bản PixelLab.
	{ id: 'ice_shard', size: 30, kind: 'loop', frames: 4 },
	{ id: 'ice_burst', size: 60, kind: 'burst', frames: 8 },
	// Skill lớn của cây nguyên tố (docs/ke-hoach-nguyen-to.md): vẽ khổ to bằng Pro Flash, ưu tiên ĐẸP hơn nhanh.
	{ id: 'ice_pillar', size: 160, kind: 'burst', frames: 10 },
	{ id: 'ice_rain', size: 128, kind: 'burst', frames: 8 },
	{ id: 'rain_cloud', size: 160, kind: 'loop', frames: 8 },
	{ id: 'lightning_strike', size: 160, kind: 'burst', frames: 8 },
	{ id: 'tornado', size: 160, kind: 'loop', frames: 8 },
	{ id: 'meteor', size: 160, kind: 'burst', frames: 10 },
	{ id: 'rock_spikes', size: 128, kind: 'burst', frames: 8 },
	// Hiệu ứng riêng từng skill / nội tại / phản ứng (09/10/2026, gói trả phí) — chỉ có bản PixelLab.
	{ id: 'rock_shot', size: 40, kind: 'loop', frames: 4 },
	{ id: 'rock_burst', size: 72, kind: 'burst', frames: 8 },
	{ id: 'fire_explosion', size: 128, kind: 'burst', frames: 10 },
	{ id: 'tidal_wave', size: 128, kind: 'burst', frames: 8 },
	{ id: 'wind_trail', size: 96, kind: 'burst', frames: 6 },
	{ id: 'frost_field', size: 160, squashY: 0.55, kind: 'burst', frames: 8 },
	{ id: 'quake_wave', size: 160, squashY: 0.55, kind: 'burst', frames: 8 },
	{ id: 'heavy_slash', size: 128, kind: 'burst', frames: 6 },
	{ id: 'pierce_slash', size: 128, kind: 'burst', frames: 6 },
	{ id: 'water_guard', size: 96, squashY: 0.55, kind: 'loop', frames: 6 },
	{ id: 'parry_flash', size: 64, kind: 'burst', frames: 6 },
	{ id: 'shadow_smoke', size: 80, kind: 'burst', frames: 8 },
	{ id: 'fire_slash', size: 128, kind: 'burst', frames: 8 },
	{ id: 'water_dragon', size: 160, kind: 'burst', frames: 8 },
	{ id: 'wind_blade_ring', size: 128, squashY: 0.6, kind: 'loop', frames: 6 },
	{ id: 'ice_slash', size: 96, kind: 'burst', frames: 6 },
	{ id: 'fire_wall', size: 128, kind: 'loop', frames: 6 },
	{ id: 'wind_blade', size: 48, kind: 'loop', frames: 4 },
	{ id: 'ice_dome', size: 96, kind: 'loop', frames: 6 },
	{ id: 'stone_wall', size: 128, kind: 'burst', frames: 8 },
	{ id: 'rockslide', size: 160, kind: 'burst', frames: 10 },
	{ id: 'armor_shatter', size: 64, kind: 'burst', frames: 6 },
	{ id: 'blade_wave', size: 64, kind: 'loop', frames: 4 },
	{ id: 'whirlpool', size: 128, squashY: 0.55, kind: 'loop', frames: 8 },
	{ id: 'flying_sword', size: 48, kind: 'loop', frames: 4 },
	{ id: 'gold_aura', size: 96, kind: 'burst', frames: 8 },
	{ id: 'red_aura', size: 96, kind: 'loop', frames: 6 },
	{ id: 'lake_ripple', size: 96, squashY: 0.55, kind: 'burst', frames: 8 },
	{ id: 'ember_burst', size: 96, kind: 'burst', frames: 8 },
	{ id: 'heal_drops', size: 64, kind: 'burst', frames: 8 },
	{ id: 'earth_aura', size: 96, squashY: 0.6, kind: 'burst', frames: 8 },
	{ id: 'mud_splash', size: 96, kind: 'burst', frames: 8 },
	{ id: 'lava_burst', size: 96, kind: 'burst', frames: 8 },
	{ id: 'sandstorm', size: 128, kind: 'burst', frames: 8 },
	{ id: 'ice_shatter', size: 96, kind: 'burst', frames: 8 },
	// Chiêu boss vùng 1–4 (09/10/2026) — chỉ có bản PixelLab.
	{ id: 'boss_hellfire', size: 160, kind: 'burst', frames: 10 },
	{ id: 'boss_fire_wave', size: 160, kind: 'burst', frames: 8, later: true },
	{ id: 'boss_curse_blast', size: 160, kind: 'burst', frames: 10 },
	{ id: 'boss_bone_rise', size: 128, kind: 'burst', frames: 8, later: true },
	{ id: 'boss_stone_slam', size: 128, kind: 'burst', frames: 8, later: true },
	{ id: 'boss_toxic_pool', size: 128, kind: 'burst', frames: 8, later: true },
	{ id: 'boss_hex', size: 128, kind: 'burst', frames: 8, later: true },
	{ id: 'boss_mud_geyser', size: 160, kind: 'burst', frames: 10, later: true },
	{ id: 'boss_venom_spray', size: 128, kind: 'burst', frames: 8, later: true },
	{ id: 'boss_ankh_curse', size: 128, kind: 'burst', frames: 10, later: true },
	{ id: 'boss_sand_eruption', size: 160, kind: 'burst', frames: 10, later: true },
	{ id: 'boss_quicksand', size: 160, squashY: 0.55, kind: 'loop', frames: 8, later: true },
	{ id: 'boss_storm_bolt', size: 128, kind: 'burst', frames: 8, later: true },
	{ id: 'boss_wind_spiral', size: 128, kind: 'burst', frames: 8, later: true },
	{ id: 'boss_wind_breath', size: 160, kind: 'burst', frames: 8, later: true },
	{ id: 'boss_gale_storm', size: 160, kind: 'loop', frames: 8, later: true },
	// Chiêu Phong Long (09/10/2026) — chỉ có bản PixelLab.
	{ id: 'dragon_wind_landing', size: 192, kind: 'burst', frames: 10, later: true },
	{ id: 'dragon_gale_push', size: 192, kind: 'burst', frames: 8, later: true },
	{ id: 'dragon_wind_blades', size: 160, kind: 'burst', frames: 10, later: true },
	// Tuyệt kỹ mốc 10 (09/10/2026) — vẽ trước, chưa dùng trong game (logic GĐ4).
	{ id: 'ult_judgment', size: 192, kind: 'burst', frames: 10, later: true },
	{ id: 'ult_still_lake', size: 160, kind: 'loop', frames: 8, later: true },
	{ id: 'ult_shadow_burst', size: 128, kind: 'burst', frames: 8, later: true },
	{ id: 'ult_phoenix', size: 192, kind: 'loop', frames: 8, later: true },
	{ id: 'ult_tsunami', size: 192, kind: 'burst', frames: 10, later: true },
	{ id: 'ult_tempest', size: 192, kind: 'loop', frames: 8, later: true },
	{ id: 'ult_ice_age', size: 192, kind: 'burst', frames: 10, later: true },
	// Vệt chém kiếm phủ phép từng hệ (09/10/2026) — `CombatSystem.slashFx`.
	{ id: 'slash_fire', size: 128, kind: 'burst', frames: 8 },
	{ id: 'slash_water', size: 128, kind: 'burst', frames: 8 },
	{ id: 'slash_wind', size: 128, kind: 'burst', frames: 8 },
	{ id: 'slash_ice', size: 128, kind: 'burst', frames: 8 },
	{ id: 'slash_earth', size: 128, kind: 'burst', frames: 8 },
];

/**
 * Lấy mẫu lại về cỡ bất kỳ: mỗi pixel đích nhận màu chiếm đa số trong vùng nguồn tương ứng (alpha theo
 * đa số). Không pha màu mới như nội suy song tuyến → kết quả vẫn là pixel art sạch.
 */
export function resampleMode(img: RGBAImage, w: number, h: number): RGBAImage {
	const out = createImage(w, h);
	const sx = img.width / w;
	const sy = img.height / h;
	for (let y = 0; y < h; y += 1) {
		for (let x = 0; x < w; x += 1) {
			const x0 = Math.floor(x * sx);
			const x1 = Math.max(x0 + 1, Math.floor((x + 1) * sx));
			const y0 = Math.floor(y * sy);
			const y1 = Math.max(y0 + 1, Math.floor((y + 1) * sy));
			const counts = new Map<number, number>();
			let opaque = 0;
			let total = 0;
			for (let yy = y0; yy < y1; yy += 1) {
				for (let xx = x0; xx < x1; xx += 1) {
					total += 1;
					const i = (yy * img.width + xx) * 4;
					if (img.data[i + 3]! < 128) continue;
					opaque += 1;
					const k = (img.data[i]! << 16) | (img.data[i + 1]! << 8) | img.data[i + 2]!;
					counts.set(k, (counts.get(k) ?? 0) + 1);
				}
			}
			if (opaque * 2 < total || !counts.size) continue;
			let best = 0;
			let bestN = -1;
			for (const [k, n] of counts) if (n > bestN) [best, bestN] = [k, n];
			out.data.set([(best >> 16) & 255, (best >> 8) & 255, best & 255, 255], (y * w + x) * 4);
		}
	}
	return out;
}

const BAYER8 = (() => {
	const m = [
		[0, 32, 8, 40, 2, 34, 10, 42],
		[48, 16, 56, 24, 50, 18, 58, 26],
		[12, 44, 4, 36, 14, 46, 6, 38],
		[60, 28, 52, 20, 62, 30, 54, 22],
		[3, 35, 11, 43, 1, 33, 9, 41],
		[51, 19, 59, 27, 49, 17, 57, 25],
		[15, 47, 7, 39, 13, 45, 5, 37],
		[63, 31, 55, 23, 61, 29, 53, 21],
	];
	return (x: number, y: number): number => m[y & 7]![x & 7]! / 64;
})();

/** Tan rã có trật tự: giữ pixel nào có ngưỡng Bayer ≥ `t` (t = 0 giữ hết, t = 1 xoá hết). */
function dissolve(img: RGBAImage, t: number, seedX = 0, seedY = 0): RGBAImage {
	const out = createImage(img.width, img.height);
	for (let y = 0; y < img.height; y += 1) {
		for (let x = 0; x < img.width; x += 1) {
			const i = (y * img.width + x) * 4;
			if (img.data[i + 3] === 0 || BAYER8(x + seedX, y + seedY) < t) continue;
			out.data.set(img.data.subarray(i, i + 4), i);
		}
	}
	return out;
}

function fitTo(src: RGBAImage, size: number, squashY = 1): RGBAImage {
	const b = opaqueBounds(src)!;
	const trimmed = crop(src, b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0);
	const k = size / Math.max(trimmed.width, trimmed.height);
	return resampleMode(trimmed, Math.max(1, Math.round(trimmed.width * k)), Math.max(1, Math.round(trimmed.height * k * squashY)));
}

/** Đặt ảnh vào giữa khung cố định (mọi frame cùng cỡ để neo giữa không bị trôi). */
function centered(img: RGBAImage, w: number, h: number): RGBAImage {
	const out = createImage(w, h);
	const ox = Math.floor((w - img.width) / 2);
	const oy = Math.floor((h - img.height) / 2);
	for (let y = 0; y < img.height; y += 1) {
		for (let x = 0; x < img.width; x += 1) {
			const i = (y * img.width + x) * 4;
			if (img.data[i + 3] === 0) continue;
			out.data.set(img.data.subarray(i, i + 4), ((y + oy) * w + x + ox) * 4);
		}
	}
	return out;
}

export function buildVfxFrames(def: VfxDef, src: RGBAImage): RGBAImage[] {
	const full = fitTo(src, def.size, def.squashY ?? 1);
	const W = full.width;
	const H = full.height;
	if (def.kind === 'still') return [centered(full, W, H)];
	if (def.kind === 'loop') {
		// Lấp lánh: cùng cỡ, mỗi frame "thủng" một ít pixel ở vị trí khác nhau.
		return Array.from({ length: def.frames }, (_, i) => centered(dissolve(full, 0.12, i * 3, i * 5), W, H));
	}
	// Burst: 35% số frame đầu bùng từ 40% → 100% cỡ, phần còn lại tan rã dần.
	const grow = Math.max(2, Math.round(def.frames * 0.35));
	const frames: RGBAImage[] = [];
	for (let i = 0; i < def.frames; i += 1) {
		if (i < grow) {
			const k = 0.4 + (0.6 * (i + 1)) / grow;
			frames.push(centered(fitTo(src, Math.round(def.size * k), def.squashY ?? 1), W, H));
		} else {
			const t = (i - grow + 1) / (def.frames - grow + 1);
			frames.push(centered(dissolve(full, t * 0.95), W, H));
		}
	}
	return frames;
}

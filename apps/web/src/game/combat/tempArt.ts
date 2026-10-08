import type { PendingVfxId, VfxId } from './Vfx';

/**
 * HÌNH TẠM — luật chủ dự án 07/10/2026: "làm trước, sau có asset thì thay vào". Kỹ năng/phản ứng chưa có hình PixelLab
 * riêng vẫn mở cho người chơi, dùng TẠM hình đã có trong atlas `assets/vfx` (nhuộm `tint`, phóng `scale`, xoay, ép dẹt).
 * MỌI chỗ dùng tạm nằm ở bảng này để sau thay một chỗ:
 * - `final`: id PixelLab sẽ thay hiệu ứng chính (đã khai ở `packages/asset-pipeline/src/vfx/buildVfx.ts`). Atlas có id đó
 *   thì CombatSystem TỰ dùng bản PixelLab (`finalLook`), không có thì phát các lớp `look`. null = chưa xếp lịch vẽ riêng.
 * - `icon`: frame atlas làm icon tạm (icon trong game vốn là frame của hiệu ứng). Có `final` trong atlas thì `SkillIcon`
 *   tự lấy frame của bản PixelLab.
 * - `todo`: thứ cần PixelLab vẽ để bỏ hàng này.
 * Không tự vẽ art bằng CSS/SVG/emoji/Graphics — chỉ biến tấu hình có sẵn.
 */
export interface ArtLayer {
	id: VfxId;
	tint?: number;
	/** Nhân NGUYÊN (giữ lưới pixel); `scaleX`/`scaleY` ép dẹt / kéo dài riêng từng trục. */
	scale?: number;
	scaleX?: number;
	scaleY?: number;
	/** Xoay thêm (radian) — vd −π/2 dựng mũi băng "hướng sang phải" thành cột đứng. */
	rot?: number;
	/** Xoay theo hướng đòn. */
	aim?: boolean;
	blend?: 'add';
	/**
	 * 'ground': dưới chân nhân vật. 'world': vật ĐỨNG LÂU trên mặt đất (khối đá Tường Đá, lửa Tường Lửa) — xếp chiều sâu chung
	 * với nhân vật theo chân vật (quái đứng trước tường không bị tường vẽ đè). Thiếu = đè lên mọi nhân vật (hiệu ứng thoáng qua).
	 */
	layer?: 'ground' | 'world';
	fps?: number;
	alpha?: number;
	/** Nhấc lên khỏi mặt đất (px). */
	lift?: number;
	/** Lệch ngang (px) — vd hai mũi băng nhỏ hai bên cột băng. */
	dx?: number;
	/** Lặp frame cho đủ chừng này giây (giữ hình lâu cho kịp đọc — cột băng). */
	hold?: number;
	/** Lặp suốt thời lượng của trạng thái đi kèm (thế đỡ, dồn lực, vùng bám người). */
	loop?: boolean;
	/** Phát MỘT lượt vừa khít thời lượng đi kèm (vòng báo co đúng hết cửa sổ đỡ / hết lúc dồn lực). */
	fit?: boolean;
	/**
	 * Phát một lượt rồi ĐỨNG ở frame cuối tới hết thời lượng đi kèm (tường đá / mây đứng yên thay vì lặp lại từ đầu —
	 * frame cuối của `steam` là một đám mây tròn đầy).
	 */
	stay?: boolean;
	/** Chỉ cho `shot`: đạn tự xoay (radian/giây) — Phi Kiếm xoay tít như lưỡi kiếm bay. Thiếu = theo hệ (gió / đá xoay). */
	spin?: number;
}

export interface TempArt {
	/** Tên hiển thị (để đọc bảng). */
	name: string;
	/** Icon tạm: frame atlas (vd 'fire_ring_3'); phản ứng không có icon. */
	icon?: string;
	/** Hiệu ứng chính — các lớp chồng nhau, vẽ theo THỨ TỰ khai (lớp sau đè lớp trước). Thế đỡ: hình lúc chặn/phản ở kẻ đánh. */
	look: ArtLayer[];
	/** Hình báo trước / trạng thái bám người: lúc dồn lực (Nhất Kích), suốt thế đỡ (Thế Tĩnh, Lưu Thủy Phản), bóng để lại (Ảnh Bộ). */
	charge?: ArtLayer[];
	/** Đạn bay (kỹ năng bắn / cầu bay tới điểm nổ / vật rơi từ trời). */
	shot?: ArtLayer;
	/** Hình phụ mỗi NHỊP của vùng tồn tại (giọt mưa bắn tung toé ở vài điểm ngẫu nhiên trong vùng mưa). */
	tick?: ArtLayer[];
	/** Bản PixelLab sẽ thay `look`. */
	final: PendingVfxId | null;
	/** Cách phát bản PixelLab khi đã có (nhấc, cỡ…). */
	finalLook?: Omit<ArtLayer, 'id'>;
	/**
	 * Bản PixelLab TỰ CÓ cảnh vật rơi (thiên thạch lao xuống, mũi băng cắm xuống): frame va chạm. Có bản đó thì bỏ vật rơi tạm
	 * (đạn "ma") và phát clip SỚM chừng ấy frame để frame va chạm trùng đúng lúc sát thương + rung. Ước lượng theo prompt —
	 * duyệt bản vẽ xong thì chỉnh số.
	 */
	finalImpact?: number;
	/** Cần PixelLab vẽ gì để bỏ hàng này. */
	todo: string;
}

const EARTH = 0xc9a46a;
const EARTH_DARK = 0x9a7650;
/** Mây giông: đám mây `steam` (trắng) nhuộm xám xanh. */
const STORM = 0x7c889c;
const ICE = 0xc4f1ff;
const STEEL = 0xf4f7ff;
const UP = -Math.PI / 2;

export const TEMP_ART: Record<string, TempArt> = {
	// ——— kỹ năng mốc 3 / mốc 5 ———
	flame_ring: {
		name: 'Vòng Lửa',
		icon: 'fire_ring_3',
		look: [{ id: 'fire_ring', layer: 'ground', blend: 'add', scale: 2 }, { id: 'fire_burst', blend: 'add', lift: 30 }],
		final: null,
		todo: 'icon Vòng Lửa; vòng lửa dùng lại fire_ring phóng ×2 (đạt) — chưa cần VFX riêng',
	},
	fire_blast: {
		name: 'Bộc Hoả',
		icon: 'fire_burst_3',
		shot: { id: 'fire_orb', scale: 2 },
		look: [
			{ id: 'fire_ring', layer: 'ground', blend: 'add', scale: 2 },
			{ id: 'fire_burst', blend: 'add', scale: 2, lift: 36 },
			{ id: 'fire_flash', blend: 'add', scale: 2, lift: 20 },
		],
		final: null,
		todo: 'icon Bộc Hoả + VFX nổ lớn khổ 128 (vẽ cùng đợt meteor)',
	},
	tidal_wave: {
		name: 'Sóng Dữ',
		icon: 'water_splash_3',
		look: [{ id: 'water_wave', scale: 3, aim: true, lift: 18 }, { id: 'water_splash', scale: 2, lift: 10 }],
		final: null,
		todo: 'icon Sóng Dữ + VFX sóng hình nón (chưa xếp lịch)',
	},
	cyclone: {
		name: 'Lốc Xoáy',
		icon: 'wind_burst_1',
		// Lượt B: một vòng gió phóng ×3 trông như chong chóng → xếp CHỒNG bốn tầng wind_spin từ hẹp (chân) lên rộng (đỉnh)
		// thành phễu lốc, mỗi tầng một nhịp quay (không quay đồng bộ), bụi cuốn ở chân + hơi gió mờ ở thân.
		look: [
			{ id: 'water_ring', layer: 'ground', tint: 0xbaf5cf, scale: 2, fps: 10, alpha: 0.55 },
			{ id: 'dust', layer: 'ground', tint: 0xd9e8c8, scale: 2, fps: 12, lift: 4 },
			{ id: 'wind_spin', lift: 18, fps: 20 },
			{ id: 'wind_spin', scaleX: 2, scaleY: 1, lift: 42, fps: 17, alpha: 0.9 },
			{ id: 'steam', tint: 0xd9e8c8, scale: 2, lift: 40, fps: 10, alpha: 0.5 },
			{ id: 'wind_spin', scaleX: 3, scaleY: 2, lift: 72, fps: 14, alpha: 0.85 },
			{ id: 'wind_spin', scaleX: 4, scaleY: 2, lift: 106, fps: 12, alpha: 0.7 },
		],
		final: 'tornado',
		finalLook: { lift: 70 },
		todo: 'icon Lốc Xoáy; VFX `tornado` đang xếp lịch (token 9) — phễu chồng wind_spin chỉ là tạm',
	},
	gale_dash: {
		name: 'Lướt Gió',
		icon: 'wind_burst_4',
		look: [{ id: 'slash', tint: 0xbaf5cf, aim: true, lift: 26 }, { id: 'wind_burst', lift: 20 }],
		final: null,
		todo: 'icon Lướt Gió + động tác lướt (3 hướng × 2 giới tính) + vệt gió riêng',
	},
	frost_field: {
		name: 'Băng Địa',
		icon: 'frost_2',
		look: [
			{ id: 'magic_circle', layer: 'ground', tint: 0xc4f1ff, scale: 3, fps: 12, alpha: 0.85 },
			{ id: 'frost', alpha: 0.8, lift: 18, fps: 10 },
		],
		final: null,
		todo: 'icon Băng Địa + VFX mặt băng phủ đất (chưa xếp lịch)',
	},
	ice_spire: {
		name: 'Băng Trụ',
		icon: 'ice_burst_3',
		// Lượt B: sương + băng vỡ từng phát SAU và đè lên mũi băng → che mất cột. Giờ: đế băng vỡ/sương nằm ở lớp ĐẤT (dưới
		// nhân vật), cột = ba mũi băng dựng đứng phát SAU CÙNG, giữ hình 0,8s. Mũi băng gần vuông (25×27) nên phóng ×4 đều
		// chỉ ra một cục pha lê: kéo dài theo trục mũi (`scaleX` — sau khi xoay thành trục đứng) ×5, ngang ×2 → cột 125×54.
		look: [
			{ id: 'frost', layer: 'ground', alpha: 0.7, lift: 4 },
			{ id: 'ice_burst', layer: 'ground', scale: 2, lift: 2 },
			{ id: 'ice_shard', scaleX: 3, scaleY: 1, rot: UP - 0.35, dx: -22, lift: 34, fps: 10, hold: 0.8 },
			{ id: 'ice_shard', scaleX: 3, scaleY: 1, rot: UP + 0.35, dx: 22, lift: 34, fps: 10, hold: 0.8 },
			{ id: 'ice_shard', scaleX: 5, scaleY: 2, rot: UP, lift: 62, fps: 10, hold: 0.8 },
		],
		final: 'ice_pillar',
		finalLook: { lift: 70 },
		todo: 'icon Băng Trụ; VFX `ice_pillar` đang xếp lịch (token 14) — cột ghép từ mũi băng chỉ là tạm',
	},
	// ——— nhánh Thổ ———
	rock_throw: {
		name: 'Đá Văng',
		icon: 'dust_1',
		shot: { id: 'arcane_orb', tint: 0xb8905a },
		look: [{ id: 'steam', tint: EARTH_DARK, lift: 6 }],
		final: null,
		todo: 'icon Đá Văng + đạn đá bay + vỡ đá (≈5 lượt, kế hoạch GĐ1)',
	},
	quake: {
		name: 'Địa Chấn',
		icon: 'dust_0',
		look: [
			{ id: 'water_ring', layer: 'ground', tint: EARTH_DARK, scale: 3, fps: 16 },
			{ id: 'steam', tint: EARTH, scale: 2, lift: 14 },
		],
		final: null,
		todo: 'icon Địa Chấn + sóng chấn mặt đất + động tác dậm đất',
	},
	stone_spikes: {
		name: 'Gai Đá',
		icon: 'dust_2',
		// Mũi băng nhuộm nâu ra màu rêu (thân xanh lơ × nâu) — dùng khói `steam` (trắng) kéo cao ×2 nhuộm nâu thành cột đá.
		look: [
			{ id: 'steam', tint: EARTH_DARK, scaleX: 1, scaleY: 2, lift: 30, fps: 20 },
			{ id: 'dust', tint: EARTH, lift: 6 },
		],
		final: 'rock_spikes',
		finalLook: { lift: 40 },
		todo: 'icon Gai Đá; VFX `rock_spikes` chờ lượt',
	},
	/** Đòn hệ Thổ trúng mục tiêu (mọi kỹ năng Thổ + kiếm phủ Thổ) — phát tại chỗ trúng trên thân. */
	earth_hit: {
		name: 'Trúng đòn Thổ',
		look: [{ id: 'dust', tint: EARTH, scale: 2 }],
		final: null,
		todo: 'VFX vỡ đá khi trúng',
	},
	// ——— Kiếm 3 lưu phái (lượt B). Chưa có động tác riêng: dùng animation attack sẵn có + dời sprite / alpha ———
	heavy_strike: {
		name: 'Nhất Kích',
		icon: 'slash_3',
		charge: [{ id: 'sparkle', tint: 0xfff0c0, blend: 'add', fit: true, lift: 34 }],
		look: [
			{ id: 'dust', layer: 'ground', scale: 2 },
			{ id: 'slash', tint: STEEL, scale: 2, aim: true, lift: 30, fps: 26 },
			{ id: 'crit_flash', blend: 'add', lift: 30, alpha: 0.8 },
		],
		final: null,
		todo: 'icon Nhất Kích + động tác dồn lực (giơ kiếm qua đầu — đang đứng idle + tia sáng tụ) + vệt chém nặng khổ lớn',
	},
	pierce_rush: {
		name: 'Đột Kích',
		icon: 'slash_4',
		look: [{ id: 'slash', tint: STEEL, aim: true, lift: 26, fps: 30 }, { id: 'dust', lift: 6 }],
		final: null,
		todo: 'icon Đột Kích + động tác lướt tới (đang trượt sprite idle) + vệt chém xuyên riêng',
	},
	calm_stance: {
		name: 'Thế Tĩnh',
		icon: 'water_ring_2',
		charge: [{ id: 'water_ring', layer: 'ground', tint: 0xd8f4ff, alpha: 0.85, fps: 12, loop: true }],
		look: [{ id: 'crit_flash', blend: 'add', tint: 0xd8f4ff }, { id: 'water_splash', tint: 0xeaf8ff }],
		final: null,
		todo: 'icon Thế Tĩnh + động tác giữ thế (đang đứng idle + vòng nước dưới chân, sprite nhuộm xanh nhạt) + hiệu ứng gạt đòn',
	},
	flowing_counter: {
		name: 'Lưu Thủy Phản',
		icon: 'water_splash_5',
		charge: [
			{ id: 'magic_circle', layer: 'ground', tint: 0x9fe8ff, scale: 2, fit: true, alpha: 0.95 },
			{ id: 'sparkle', tint: 0xbff4ff, blend: 'add', lift: 34 },
		],
		look: [{ id: 'water_splash', scale: 2, tint: 0xeaf8ff }, { id: 'crit_flash', blend: 'add', tint: 0xbff4ff, scale: 2 }],
		shot: { id: 'water_wave', tint: 0xeaf8ff },
		final: null,
		todo: 'icon Lưu Thủy Phản + động tác đỡ → phản (đang dùng attack sẵn có) + vòng báo cửa sổ đỡ riêng + đạn phản ngược',
	},
	side_slash: {
		name: 'Lướt Chém',
		icon: 'slash_1',
		look: [{ id: 'wind_burst', tint: 0xe8f0ff, lift: 20, alpha: 0.7 }, { id: 'dust', lift: 4 }],
		final: null,
		todo: 'icon Lướt Chém + động tác lướt ngang (3 hướng × 2 giới tính; đang trượt sprite + nhấp nháy i-frame)',
	},
	shadow_step: {
		name: 'Ảnh Bộ',
		icon: 'shadow_3',
		charge: [{ id: 'shadow', lift: 30, alpha: 0.9 }, { id: 'dust', lift: 6 }],
		look: [{ id: 'shadow', lift: 30, alpha: 0.8 }, { id: 'crit_flash', blend: 'add', lift: 30 }],
		final: null,
		todo: 'icon Ảnh Bộ + động tác ảnh bộ (tan thành bóng → hiện sau lưng; đang dịch tức thời + khói bóng)',
	},
	// ——— Kiếm pháp nguyên tố (Kiếm 5 + nguyên tố 5) ———
	blaze_slash: {
		name: 'Liệt Hoả Trảm',
		icon: 'fire_flash_4',
		look: [{ id: 'fire_flash', blend: 'add', scale: 2, aim: true, lift: 26 }, { id: 'flame', blend: 'add', lift: 18 }],
		final: null,
		todo: 'icon Liệt Hoả Trảm + VFX nhát chém lửa hình nón',
	},
	water_dragon_slash: {
		name: 'Thuỷ Long Trảm',
		icon: 'water_wave_2',
		look: [{ id: 'water_wave', scale: 2, aim: true, lift: 20 }, { id: 'water_splash', lift: 8 }],
		final: null,
		todo: 'icon Thuỷ Long Trảm + VFX rồng nước chạy theo nhát chém',
	},
	gale_blade_dance: {
		name: 'Phong Kiếm Cuồng Vũ',
		icon: 'wind_spin_2',
		look: [
			{ id: 'water_ring', layer: 'ground', tint: 0xbaf5cf, scale: 2, fps: 12, alpha: 0.55 },
			{ id: 'wind_spin', scale: 2, lift: 34, fps: 18, alpha: 0.8 },
		],
		final: null,
		todo: 'icon Phong Kiếm Cuồng Vũ + VFX vòng lưỡi gió xoay quanh người (đang: vòng gió + vệt chém xanh xoay mỗi nhịp) + động tác xoay kiếm',
	},
	frost_cleave: {
		name: 'Hàn Băng Trảm',
		icon: 'frost_4',
		look: [
			{ id: 'ice_burst', layer: 'ground', lift: 2 },
			{ id: 'slash', tint: 0xc4f1ff, scale: 2, aim: true, lift: 30, fps: 26 },
			{ id: 'frost', lift: 30, alpha: 0.8 },
		],
		final: null,
		todo: 'icon Hàn Băng Trảm + VFX nhát chém băng',
	},
	earth_rend: {
		name: 'Địa Liệt Trảm',
		icon: 'dust_4',
		look: [
			{ id: 'steam', tint: EARTH_DARK, scaleX: 1, scaleY: 2, lift: 30, fps: 20 },
			{ id: 'dust', tint: EARTH, lift: 6 },
		],
		final: 'rock_spikes',
		finalLook: { lift: 40 },
		todo: 'icon Địa Liệt Trảm; gai đá dùng chung `rock_spikes` (chờ lượt) + động tác bổ kiếm xuống đất',
	},
	// ——— GĐ3: mốc 6 / mốc 8 của 5 nguyên tố ———
	// Tường: `look` phát ở MỖI đoạn ~26px dọc tường; lớp `loop` / `stay` kéo suốt thời gian tường đứng, lớp thường = lúc trồi.
	fire_wall: {
		name: 'Tường Lửa',
		icon: 'flame_2',
		look: [
			{ id: 'fire_burst', blend: 'add', lift: 20, fps: 22 },
			{ id: 'flame', blend: 'add', scale: 2, lift: 28, fps: 10, loop: true, layer: 'world' },
		],
		final: null,
		todo: 'icon Tường Lửa + VFX tường lửa (dải lửa đứng lặp, khổ ~128×64) — đang xếp ngọn `flame` ×2 mỗi 26px',
	},
	meteor: {
		name: 'Thiên Thạch',
		icon: 'fire_burst_4',
		// Vật rơi: cầu lửa ×3 bay chéo từ trời xuống (đạn "ma" — không va chạm); vòng báo đỏ cam co đúng hết lúc rơi.
		shot: { id: 'fire_orb', scale: 3 },
		charge: [{ id: 'magic_circle', layer: 'ground', tint: 0xffa060, scale: 4, fit: true, alpha: 0.8 }],
		look: [
			{ id: 'fire_ring', layer: 'ground', blend: 'add', scale: 3 },
			{ id: 'dust', layer: 'ground', tint: 0x6a4a30, scale: 4, lift: 4 },
			{ id: 'fire_burst', blend: 'add', scale: 3, lift: 54 },
			{ id: 'fire_flash', blend: 'add', scale: 2, lift: 30 },
		],
		final: 'meteor',
		finalLook: { lift: 60 },
		finalImpact: 3,
		todo: 'icon Thiên Thạch; VFX `meteor` chờ lượt (khổ 160) — đang: cầu lửa ×3 rơi + vòng lửa ×3 + nổ ×3',
	},
	call_rain: {
		name: 'Gọi Mưa',
		icon: 'water_splash_2',
		// Mây = frame cuối của `steam` (đám mây tròn) nhuộm xám xanh, đứng yên suốt cơn mưa (×3 — ×4 thì khối pixel quá thô so
		// với nhân vật); vòng nước mờ ×4 khớp mép vùng bán kính 130. Lôi Vũ dùng chung hình này làm nền mây.
		// Mây treo cao 165 (đáy phần đục ≈ 120px trên tâm vùng) + hơi trong: đứng lâu (6s) đè lên nhân vật nên không được che
		// thân quái trong vùng mưa — cao 120 / đục 0,95 thì quái ở nửa bắc vùng bị che gần trọn.
		look: [
			{ id: 'water_ring', layer: 'ground', tint: 0x9fd8ff, scale: 4, fps: 8, alpha: 0.45 },
			{ id: 'steam', tint: STORM, scale: 3, lift: 165, fps: 14, stay: true, alpha: 0.75 },
		],
		tick: [{ id: 'water_splash', lift: 6, fps: 20, alpha: 0.9 }],
		final: 'rain_cloud',
		finalLook: { lift: 150, alpha: 0.85 },
		todo: 'icon Gọi Mưa; VFX `rain_cloud` đang xếp lịch (token 13) — đang: mây steam nhuộm xám + giọt (hạt) + bắn nước',
	},
	thunder_rain: {
		name: 'Lôi Vũ',
		icon: 'light_pillar_6',
		// Một tia sét = cột sáng `light_pillar` nhuộm trắng xanh (đứng trên chân mục tiêu) + chớp ở thân + nước bắn dưới chân.
		look: [
			{ id: 'light_pillar', tint: 0xd6ecff, blend: 'add', lift: 62, fps: 34 },
			{ id: 'arcane_burst', tint: 0xbfe4ff, blend: 'add', lift: 30, fps: 26 },
			{ id: 'water_splash', lift: 4, fps: 22 },
		],
		final: 'lightning_strike',
		finalLook: { lift: 70 },
		todo: 'icon Lôi Vũ; VFX `lightning_strike` đang xếp lịch (token 14) — đang: cột sáng nhuộm xanh; mây dùng chung Gọi Mưa',
	},
	gale_fan: {
		name: 'Phong Bạo',
		icon: 'wind_burst_3',
		shot: { id: 'wind_spin', tint: 0xd8fbe6 },
		look: [{ id: 'wind_burst', scale: 2, lift: 26, fps: 22 }],
		final: null,
		todo: 'icon Phong Bạo + lưỡi gió riêng (đang dùng lốc nhỏ wind_spin như Phong Nhận)',
	},
	tornado: {
		name: 'Vòi Rồng',
		icon: 'wind_spin_1',
		// Phễu Lốc Xoáy (lượt B) phóng to gần gấp đôi và cao hơn; hình bám theo vùng đang đi.
		look: [
			{ id: 'water_ring', layer: 'ground', tint: 0xbaf5cf, scale: 3, fps: 10, alpha: 0.5 },
			{ id: 'dust', layer: 'ground', tint: 0xd9e8c8, scale: 3, fps: 12, lift: 4 },
			{ id: 'wind_spin', scaleX: 2, scaleY: 1, lift: 22, fps: 22 },
			{ id: 'wind_spin', scaleX: 3, scaleY: 2, lift: 58, fps: 18, alpha: 0.9 },
			{ id: 'steam', tint: 0xd9e8c8, scale: 3, lift: 64, fps: 10, alpha: 0.45 },
			{ id: 'wind_spin', scaleX: 4, scaleY: 2, lift: 100, fps: 15, alpha: 0.85 },
			{ id: 'wind_spin', scaleX: 6, scaleY: 3, lift: 150, fps: 12, alpha: 0.7 },
		],
		final: 'tornado',
		finalLook: { scale: 2, lift: 140 },
		todo: 'icon Vòi Rồng; VFX `tornado` đang xếp lịch (token 9) — Vòi Rồng = bản phóng ×2 của Lốc Xoáy',
	},
	ice_mirror: {
		name: 'Gương Băng',
		icon: 'sparkle_4',
		// Khiên: vòng băng dưới chân + vụn băng lấp lánh bám người suốt 4s. Lúc phản: băng vỡ + loé tại chỗ đạn chạm khiên.
		charge: [
			{ id: 'water_ring', layer: 'ground', tint: 0xd2f6ff, fps: 10, alpha: 0.8, loop: true },
			{ id: 'sparkle', tint: ICE, lift: 34, fps: 10, alpha: 0.55, loop: true },
		],
		look: [{ id: 'ice_burst', fps: 24 }, { id: 'crit_flash', tint: ICE, blend: 'add', fps: 30, alpha: 0.85 }],
		shot: { id: 'ice_shard', tint: 0xe8fbff },
		final: null,
		todo: 'icon Gương Băng + VFX khiên băng (vòm băng trong suốt quanh người, lặp) + băng vỡ khi phản đạn',
	},
	ice_rain: {
		name: 'Mưa Băng',
		icon: 'ice_shard_2',
		// Mỗi mũi: mũi băng ×2 rơi thẳng (đạn "ma" xoay theo hướng bay) rồi vỡ; vòng báo phủ cả vùng suốt trận mưa.
		shot: { id: 'ice_shard', scale: 2 },
		charge: [{ id: 'magic_circle', layer: 'ground', tint: ICE, scale: 4, fit: true, alpha: 0.6 }],
		look: [{ id: 'ice_burst', lift: 10, fps: 24 }, { id: 'frost', lift: 18, fps: 16, alpha: 0.8 }],
		final: 'ice_rain',
		finalLook: { lift: 50 },
		finalImpact: 2,
		todo: 'icon Mưa Băng; VFX `ice_rain` chờ lượt — đang: mũi băng ×2 rơi + băng vỡ (bản PixelLab phát ở mỗi mũi thứ 3)',
	},
	stone_wall: {
		name: 'Tường Đá',
		icon: 'dust_3',
		// Khối đá = frame cuối của `steam` (đám tròn đầy) nhuộm nâu sẫm, kéo cao ×2, đứng yên suốt 7s; bụi đất lúc trồi. Khối đá
		// ở lớp 'world' (xếp chiều sâu chung với nhân vật): quái đứng trước tường vẽ đè lên tường, không bị tường che nửa thân.
		look: [
			{ id: 'dust', tint: EARTH, scale: 2, lift: 6, fps: 18 },
			{ id: 'steam', tint: EARTH_DARK, scaleX: 1, scaleY: 2, lift: 32, fps: 24, stay: true, layer: 'world' },
		],
		final: null,
		todo: 'icon Tường Đá + VFX tường đá (trồi → đứng → vỡ, khổ ~128×64) — đang: mây steam nhuộm nâu đứng thành khối đá',
	},
	rockslide: {
		name: 'Lở Đá',
		icon: 'steam_5',
		// Mỗi tảng: cầu phép nhuộm nâu ×2 (cùng hình viên Đá Văng) lăn từ trời xuống rồi vỡ thành bụi + khối đá.
		shot: { id: 'arcane_orb', tint: 0xb8905a, scale: 2 },
		charge: [{ id: 'magic_circle', layer: 'ground', tint: EARTH, scale: 4, fit: true, alpha: 0.6 }],
		look: [
			{ id: 'steam', tint: EARTH_DARK, scale: 2, lift: 24, fps: 20 },
			{ id: 'dust', tint: EARTH, scale: 2, lift: 6, fps: 18 },
		],
		final: null,
		todo: 'icon Lở Đá + VFX đá tảng rơi vỡ (chưa khai ở pipeline — chưa xếp lịch)',
	},
	// ——— GĐ3 lượt B: mốc 6 / 8 của 3 lưu phái Kiếm. Chưa có động tác riêng: attack sẵn có + vệt chém / nhuộm / xoay ———
	sunder_strike: {
		name: 'Phá Giáp',
		icon: 'crit_flash_4',
		// Nhát bổ: vệt chém ×2 nhuộm vàng đồng + máu bắn ×2 + bụi đất dưới chân (giáp vỡ). Chỗ quái vỡ giáp: chữ "Vỡ giáp!".
		look: [
			{ id: 'dust', layer: 'ground', tint: EARTH, scale: 2 },
			{ id: 'slash', tint: 0xffd9a0, scale: 2, aim: true, lift: 30, fps: 24 },
			{ id: 'blood_hit', scale: 2, lift: 30, fps: 22 },
		],
		final: null,
		todo: 'icon Phá Giáp + VFX giáp vỡ (mảnh giáp văng) + động tác bổ kiếm nặng từ trên xuống',
	},
	blade_wave: {
		name: 'Lưỡi Sóng',
		icon: 'slash_0',
		// Luồng kiếm = vệt chém ×2 bay theo hướng (đạn xoay theo hướng bay); có phủ phép thì nhuộm màu hệ. Gió kiếm ở mũi lúc vung.
		shot: { id: 'slash', tint: STEEL, scale: 2, aim: true },
		look: [{ id: 'wind_burst', tint: 0xe8f0ff, lift: 26, fps: 24, alpha: 0.8 }],
		final: null,
		todo: 'icon Lưỡi Sóng + VFX luồng kiếm bay (lưỡi liềm ánh bạc kéo vệt, lặp) + động tác vung kiếm phóng khí',
	},
	backflow: {
		name: 'Dòng Chảy Ngược',
		icon: 'water_wave_1',
		// Suốt lúc gạt: vòng nước dưới chân + sóng nước mờ quanh ngực (lặp). Mỗi viên gạt: vệt chém nước + nước bắn ở chỗ đạn.
		charge: [
			{ id: 'water_ring', layer: 'ground', tint: 0xbfe8ff, alpha: 0.8, fps: 12, loop: true },
			{ id: 'water_wave', tint: 0xeaf8ff, lift: 34, alpha: 0.55, fps: 10, loop: true },
		],
		look: [{ id: 'slash', tint: 0xeaf8ff, aim: true, fps: 30 }, { id: 'water_splash', tint: 0xeaf8ff, fps: 24 }],
		shot: { id: 'water_wave', tint: 0xeaf8ff },
		final: null,
		todo: 'icon Dòng Chảy Ngược + động tác gạt kiếm (đang dùng attack sẵn có theo hướng viên đạn) + VFX dòng nước cuốn đạn bay ngược',
	},
	whirlpool: {
		name: 'Xoáy Nước',
		icon: 'water_ring_4',
		// Bốn vệt chém quanh người (vẽ sẵn ở CombatSystem) + xoáy nước dưới chân ×3 + nước bắn ×2.
		look: [
			{ id: 'water_ring', layer: 'ground', tint: 0xbfe8ff, scale: 3, fps: 16 },
			{ id: 'water_splash', scale: 2, lift: 24, fps: 22 },
		],
		final: null,
		todo: 'icon Xoáy Nước + động tác xoay một vòng (3 hướng × 2 giới tính) + VFX xoáy nước quanh người',
	},
	/** Xoáy Nước tung ngay sau khi đỡ đòn: lớp loé thêm. */
	whirlpool_surge: {
		name: 'Xoáy Nước (sau khi đỡ)',
		look: [{ id: 'crit_flash', tint: 0xbff4ff, blend: 'add', scale: 2, lift: 30 }, { id: 'water_splash', tint: 0xeaf8ff, scale: 3, lift: 20, fps: 20 }],
		final: null,
		todo: 'VFX xoáy nước lớn (bản mạnh sau khi đỡ đòn)',
	},
	chain_slash: {
		name: 'Liên Hoàn',
		icon: 'blood_hit_4',
		// Mỗi nhát: vệt chém (CombatSystem, luân phiên trái/phải) + gió kiếm mờ phía trước.
		look: [{ id: 'wind_burst', tint: 0xe8f0ff, lift: 26, fps: 32, alpha: 0.6 }],
		final: null,
		todo: 'icon Liên Hoàn + động tác chuỗi 4 nhát (đang: attack sẵn có một lần + 4 vệt chém luân phiên)',
	},
	flying_sword: {
		name: 'Phi Kiếm',
		icon: 'wind_spin_3',
		// Kiếm bay = lốc nhỏ wind_spin nhuộm bạc xoay tít; loé ở tay lúc phóng và lúc bắt lại.
		shot: { id: 'wind_spin', tint: 0xe8eef8, spin: 22 },
		look: [{ id: 'crit_flash', tint: STEEL, blend: 'add', lift: 30, alpha: 0.7 }],
		final: null,
		todo: 'icon Phi Kiếm + đạn thanh kiếm xoay (8 góc) + động tác phóng / bắt kiếm',
	},
	// ——— bị động mốc 7 / 9 của 3 lưu phái Kiếm ———
	press_max: {
		name: 'Thế Áp Đảo (đủ 5 lần)',
		look: [{ id: 'crit_flash', tint: 0xffe28a, blend: 'add', lift: 34 }],
		final: null,
		todo: 'VFX khí thế bừng lên quanh người (vàng)',
	},
	rage_aura: {
		name: 'Bất Khuất (dưới 30% máu)',
		look: [{ id: 'fire_flash', tint: 0xff7070, blend: 'add', lift: 30, alpha: 0.6 }, { id: 'dust', layer: 'ground', tint: 0xb84a4a, alpha: 0.8 }],
		final: null,
		todo: 'VFX hào quang đỏ bám người khi máu thấp',
	},
	riposte: {
		name: 'Phản Đòn (né / đỡ đúng lúc)',
		look: [{ id: 'crit_flash', tint: 0xbff4ff, blend: 'add', scale: 2, lift: 30 }, { id: 'slash', tint: 0xeaf8ff, scale: 2, aim: true, lift: 30, fps: 30 }],
		// Né đúng lúc trước một viên đạn: đạn bị hất ngược thành vệt chém bay.
		shot: { id: 'slash', tint: 0xeaf8ff, aim: true },
		final: null,
		todo: 'VFX nhát phản chí mạng + động tác phản kiếm sau cú né',
	},
	lake_heal: {
		name: 'Mặt Hồ Phẳng (hồi khi phản đòn)',
		look: [{ id: 'water_ring', layer: 'ground', tint: 0xb4ffd6, fps: 16, alpha: 0.75 }, { id: 'sparkle', tint: 0xbff4ff, blend: 'add', lift: 34, fps: 18, alpha: 0.7 }],
		final: null,
		todo: 'VFX mặt hồ lặng sóng quanh chân (hồi máu)',
	},
	momentum: {
		name: 'Đà Lướt (chém nhanh sau né)',
		look: [{ id: 'wind_burst', tint: 0xe8f0ff, lift: 18, fps: 24, alpha: 0.7 }],
		final: null,
		todo: 'VFX vệt gió bạc bám kiếm',
	},
	blur_evade: {
		name: 'Bóng Mờ (né hoàn toàn)',
		look: [{ id: 'shadow', lift: 30, alpha: 0.6, fps: 22 }],
		final: null,
		todo: 'VFX bóng mờ tách khỏi người khi né (tàn ảnh) + icon chỉ số "Né hoàn toàn" ở bảng Nhân vật (đang mượn frame shadow_5 — `SkillIcon.ICON_FRAME.evade`)',
	},
	// ——— bị động mốc 7 / 9 có hình ———
	ember_burst: {
		name: 'Tro Tàn (nổ lan lửa)',
		look: [
			{ id: 'fire_ring', layer: 'ground', blend: 'add', fps: 20 },
			{ id: 'fire_burst', blend: 'add', lift: 30, fps: 22 },
			{ id: 'flame', blend: 'add', lift: 18, fps: 14 },
		],
		final: null,
		todo: 'VFX xác quái nổ tung lửa tro',
	},
	shatter_burst: {
		name: 'Vỡ Vụn (nổ vụn băng)',
		look: [{ id: 'ice_burst', scale: 2, lift: 30, fps: 22 }, { id: 'frost', lift: 30, fps: 18, alpha: 0.8 }],
		final: null,
		todo: 'VFX khối băng vỡ văng mảnh',
	},
	spring_heal: {
		name: 'Mạch Nguồn (hồi trong mưa)',
		look: [{ id: 'water_ring', layer: 'ground', tint: 0xb4ffd6, fps: 16, alpha: 0.7 }, { id: 'sparkle', tint: 0x9fffb0, blend: 'add', lift: 34, fps: 18, alpha: 0.7 }],
		final: null,
		todo: 'VFX hồi máu kiểu giọt nước xanh lá',
	},
	mountain_heal: {
		name: 'Núi Thiêng (hồi khi đứng yên)',
		look: [{ id: 'dust', layer: 'ground', tint: EARTH, fps: 12, alpha: 0.8 }, { id: 'sparkle', tint: 0xffe7a8, blend: 'add', lift: 34, fps: 16, alpha: 0.6 }],
		final: null,
		todo: 'VFX hào quang đá (nâu vàng) quanh chân',
	},
	eye_haste: {
		name: 'Mắt Bão (tăng tốc sau né)',
		look: [{ id: 'wind_burst', lift: 18, fps: 22, alpha: 0.8 }],
		final: null,
		todo: 'VFX vệt gió bám chân',
	},
	// ——— phản ứng Thổ (kế hoạch mục 2.5) — phát giữa thân mục tiêu ———
	react_mud: { name: 'Bùn Lầy', look: [{ id: 'water_splash', tint: 0x8a6a40, scale: 2 }, { id: 'water_ring', layer: 'ground', tint: 0x8a6a40, lift: -30 }], final: null, todo: 'VFX bùn bắn + vũng bùn' },
	react_lava: { name: 'Dung Nham', look: [{ id: 'fire_burst', tint: 0xff7a3a, blend: 'add', scale: 2 }, { id: 'flame', tint: 0xff5a1a, blend: 'add', scale: 2 }], final: null, todo: 'VFX dung nham' },
	react_sandstorm: { name: 'Bão Cát', look: [{ id: 'wind_burst', tint: 0xe2c27a, scale: 2 }, { id: 'steam', tint: 0xe2c27a }], final: null, todo: 'VFX lốc cát' },
	react_shatter: { name: 'Vỡ Vụn', look: [{ id: 'ice_burst', scale: 2 }, { id: 'crit_flash', tint: 0xc9f2ff, blend: 'add' }], final: null, todo: 'VFX băng vỡ vụn' },
};

/** Icon tạm của kỹ năng (frame atlas không có tiền tố `vfx/`), hoặc frame giữa của bản PixelLab nếu atlas đã có. */
export function tempIcon(skillId: string, atlasHas: (id: string) => boolean): string | null {
	const a = TEMP_ART[skillId];
	if (!a?.icon) return null;
	// Frame giữa của bản PixelLab (SkillIcon tự lùi về frame 0 nếu bản vẽ ít frame hơn).
	if (a.final && atlasHas(`${a.final}_0`)) return `${a.final}_3`;
	return a.icon;
}

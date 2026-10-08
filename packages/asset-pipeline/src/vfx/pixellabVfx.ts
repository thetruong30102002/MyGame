import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { blit, createImage, opaqueBounds, crop, readPng, type RGBAImage } from '../image/rgba.js';
import { resampleMode, type VfxDef } from './buildVfx.js';

/**
 * Hiệu ứng kỹ năng do PixelLab VẼ (lệnh `pixellab vfx`): khung đầu bằng `create_image_pixen` (mặc định, 1 lượt) hoặc
 * `create_image_pixflux`/`create_image_pro_flash`, chuyển động bằng `animate_image`. Code ở đây CHỈ nạp + đưa về cỡ
 * trong game (và đặt khung đầu vào giữa canvas), KHÔNG sinh thêm khung nào.
 * Thư mục mỗi hiệu ứng: `sources/pixellab/vfx/<id>/` gồm `first.png`, `frame_000.png`… và `meta.json` (ghi CUỐI
 * CÙNG — có meta nghĩa là đã tải đủ).
 */
export interface PixelLabVfxMeta {
	id: string;
	kind?: VfxDef['kind'];
	/** Cỡ khung PixelLab vẽ (px). */
	canvas: { w: number; h: number };
	first: {
		prompt: string | null;
		image: string;
		source: FirstSource;
		jobId?: string;
		/** Ảnh PixelLab trả về khi khung đầu được vẽ nhỏ rồi đặt vào giữa canvas (`image` là bản đã đặt). */
		drawn?: string;
	};
	action: string | null;
	/** Số khung PixelLab SINH RA (không tính ảnh đầu vào). */
	frameCount: number;
	/** `files[0]` là chính ảnh đầu vào (get_image của animate_image trả frame_count + 1 ảnh, ảnh 0 = đầu vào). */
	inputIncluded: boolean;
	files: string[];
	animateJobId?: string;
	createdAt: string;
	token?: number;
	/** Sửa tay khi duyệt: ép dùng/bỏ ảnh đầu vào (mặc định: burst giữ, loop bỏ). */
	useInput?: boolean;
	/** Sửa tay khi duyệt: đè `squashY` của VfxDef (vd 1 nếu PixelLab đã vẽ sẵn góc nghiêng mặt đất). */
	squashY?: number;
	/** Sửa tay khi duyệt: tên file khung bị LOẠI (PixelLab vẽ lạc một khung, vd Hoả Cầu biến thành cục tròn → nháy). */
	drop?: string[];
	/**
	 * Sửa tay khi duyệt: PixelLab "nướng" nền tối vào ảnh (vd cột sáng 132px phủ đục ~60% khung) → điểm ảnh có kênh
	 * sáng nhất < ngưỡng này thành trong suốt. Chỉ dùng cho hiệu ứng tự phát sáng (vẽ blend 'add').
	 */
	keyDark?: number;
}

export type PixelLabVfxLoad =
	| { status: 'none' }
	| { status: 'incomplete'; reason: string }
	| { status: 'ok'; frames: RGBAImage[]; meta: PixelLabVfxMeta; note: string };

/**
 * Mô tả gợi ý cho các hiệu ứng ưu tiên — mặc định của `pixellab vfx` khi không truyền `--first`/`--action`.
 * - Hiệu ứng game tô `tint` (Pixi NHÂN màu: `slash`, `magic_circle`, `arcane_orb` lúc niệm, `sparkle`, `light_pillar`
 *   — xem CombatSystem/Game) phải vẽ gam TRẮNG/rất nhạt: vàng × tint nước ra ô liu, tím × tint lửa ra tím mận.
 * - `slash`: game xoay sprite theo hướng đánh (`rotation = atan2(ny, nx)`) → sprite gốc là vệt DỌC, bụng quay sang
 *   phải (+x); chiều vung ngược do game lật dọc (`flipY`).
 * - `firstScale`: khung đầu của vụ nổ vẽ NHỎ rồi đặt vào giữa canvas đủ khổ — animate_image giữ nguyên khổ khung đầu,
 *   vẽ kín canvas thì chuyển động "bùng ra" bị xén phẳng ở mép.
 */
const STYLE = 'pixel art game effect, crisp dark outline, limited palette, transparent background, chibi RPG style, no character, no text';
/** Hiệu ứng vẽ blend 'add': viền tối cộng vào nền thì vô hình → bỏ viền; cấm nền/mặt đất vì PixelLab hay nướng nền tối vào ảnh. */
const GLOW = 'pixel art game effect, lineless, limited palette, isolated on a fully transparent background, no ground, no scenery, chibi RPG style, no character, no text';
export const PIXELLAB_VFX_PRESETS: Record<string, { first: string; action: string; frames: number; firstScale?: number }> = {
	slash: {
		first: `vertical crescent sword slash arc, convex side facing right, thick in the middle tapering to sharp tips at top and bottom, white and pale silver glow, ${STYLE}`,
		action: 'slash arc sweeps quickly from top to bottom, then thins out and fades away',
		frames: 6,
	},
	fire_orb: {
		first: `small round fireball, bright yellow core, orange and red flames around it, ${STYLE}`,
		action: 'fireball burning and pulsing, flames flickering around the core, seamless loop',
		frames: 4,
	},
	fire_burst: {
		first: `small fire explosion just starting, bright yellow-white core with orange flames, ${STYLE}`,
		action: 'fire explosion bursts outward into big flames, then breaks into embers and smoke and disappears',
		frames: 8,
		firstScale: 0.5,
	},
	water_wave: {
		first: `small water bolt, blue water droplet arrow with white foam highlight, pointing right, ${STYLE}`,
		action: 'water bolt ripples and churns while flying, foam trail wobbling, seamless loop',
		frames: 4,
	},
	water_splash: {
		first: `small water splash just starting, blue droplets with white foam, ${STYLE}`,
		action: 'water splash bursts outward into droplets and spray, then droplets fall and vanish',
		frames: 8,
		firstScale: 0.5,
	},
	wind_spin: {
		first: `small green-white wind blade, spinning crescent of air with speed lines, ${STYLE}`,
		action: 'wind blade spins rapidly, swirling air lines rotating, seamless loop',
		frames: 4,
	},
	wind_burst: {
		first: `small whirlwind gust just forming, pale green and white swirling air streaks, ${STYLE}`,
		action: 'whirlwind gust spins and expands outward, then streaks scatter and fade away',
		frames: 8,
		firstScale: 0.5,
	},
	arcane_orb: {
		first: `small glowing energy orb, white-hot core with a very pale lavender glow and tiny white sparkles, ${STYLE}`,
		action: 'magic orb pulses and glows, energy swirling inside, tiny sparkles orbiting, seamless loop',
		frames: 4,
	},
	arcane_burst: {
		first: `small violet magic explosion just starting, cyan sparks around a bright core, ${STYLE}`,
		action: 'magic energy bursts outward into a ring of sparks and runes, then fades into small particles',
		frames: 8,
		firstScale: 0.5,
	},
	sparkle: {
		first: `healing sparkle, white and very pale mint glowing plus-shaped sparkles and small stars, ${STYLE}`,
		action: 'healing sparkles appear, rise upward and twinkle, then fade away gently',
		frames: 8,
	},
	magic_circle: {
		first: `magic circle seen from directly above, white and pale silver glowing runes in two rings, flat on the ground, ${STYLE}`,
		action: 'magic circle lights up, runes glow brighter and rotate slowly, then the circle fades out',
		frames: 8,
	},
	light_pillar: {
		first: `tall vertical pillar of soft white light beam from the ground, ${STYLE}`,
		action: 'light pillar shoots up from the ground, glows brightly, then narrows and fades away',
		frames: 8,
	},
	fire_flash: {
		first: `small bright fire flash just starting, round blast of yellow-white light with orange flame tongues, ${GLOW}`,
		action: 'fire flash erupts outward in a quick bright blast, then breaks into small embers and fades away',
		frames: 8,
		firstScale: 0.5,
	},
	fire_ring: {
		first: `flat ring of fire seen from directly above, circular band of orange and yellow flames, empty transparent center, ${GLOW}`,
		action: 'ring of fire flares up, flames dance higher, then burn down into embers and fade away',
		frames: 8,
	},
	flame: {
		first: `small flickering flame, yellow core with orange and red tips, ${STYLE}`,
		action: 'flame flickers and dances in place, seamless loop',
		frames: 4,
	},
	water_ring: {
		first: `flat water ripple ring seen from directly above, thin blue circular wave with white foam, empty transparent center, ${STYLE}`,
		action: 'ripple ring expands outward and thins, then fades away',
		frames: 8,
	},
	dark_ring: {
		first: `flat dark magic ring seen from directly above, purple and violet glowing circle with small dark flames along the edge, empty transparent center, ${STYLE}`,
		action: 'dark ring flares up with purple flames, then dissolves into dark wisps and fades away',
		frames: 8,
	},
	shadow: {
		first: `small burst of dark purple shadow smoke, curling violet tendrils and wisps, ${STYLE}`,
		action: 'shadow tendrils lash outward and curl, then dissolve into smoke and fade away',
		frames: 8,
		firstScale: 0.5,
	},
	dark_orb: {
		first: `small dark shadow orb, deep purple-black core with a violet glow rim, ${STYLE}`,
		action: 'dark orb pulses, purple energy swirling around it, seamless loop',
		frames: 4,
	},
	dust: {
		first: `small puff of light brown dust cloud, ${STYLE}`,
		action: 'dust cloud puffs outward, settles and fades away',
		frames: 6,
		firstScale: 0.5,
	},
};

// Hệ Băng (07/10/2026): đạn băng + vụ nổ băng khi trúng — vẽ đúng màu băng, game không tô tint.
Object.assign(PIXELLAB_VFX_PRESETS, {
	ice_shard: {
		first: `small sharp ice crystal shard projectile, pale cyan and white ice with a bright core, pointing right, ${STYLE}`,
		action: 'ice shard glints and shimmers while flying, tiny frost sparkles around it, seamless loop',
		frames: 4,
	},
	ice_burst: {
		first: `small burst of ice crystals just starting, pale cyan and white jagged ice shards around a bright core, ${STYLE}`,
		action: 'ice crystals burst outward into sharp shards and frost mist, then shatter into sparkles and fade away',
		frames: 8,
		firstScale: 0.5,
	},
});

// Skill lớn của cây nguyên tố (07/10/2026 — người chơi muốn "hầm hố, đẹp, không cần nhanh"): khổ 128–160, Pro Flash.
// Vẽ đúng màu (game không tô tint). Hiệu ứng mặt đất vẽ góc nhìn chéo từ trên xuống như map, chân hiệu ứng ở đáy khung.
Object.assign(PIXELLAB_VFX_PRESETS, {
	ice_pillar: {
		first: `huge jagged pillar of glacier ice erupting from cracked frozen ground, tall translucent cyan and white crystal spikes, frost mist at the base, seen from a high three-quarter top-down angle, base at the bottom of the frame, ${STYLE}`,
		action: 'the ice pillar bursts up out of the cracking ground, frost mist blasts outward, it gleams, then cracks and shatters into falling ice shards that fade away',
		frames: 10,
	},
	ice_rain: {
		first: `cluster of long sharp icicles falling from the sky toward a frosty patch of ground, pale cyan and white ice with bright tips, three-quarter top-down view, ${STYLE}`,
		action: 'icicles plunge down and stab into the ground one after another, each impact bursts into frost and ice chips, then they shatter and fade away',
		frames: 8,
	},
	rain_cloud: {
		first: `dark blue-grey storm cloud with heavy rain streaks pouring down beneath it, small puddles splashing below, three-quarter top-down view, ${STYLE}`,
		action: 'the storm cloud churns and rolls while heavy rain keeps pouring down and splashing, seamless loop',
		frames: 8,
	},
	lightning_strike: {
		first: `huge jagged lightning bolt striking down from the top of the frame onto the ground, blinding white core with electric blue and violet edges, crackling sparks at the impact, ${GLOW}`,
		action: 'a lightning bolt crashes down from above, flashes blindingly bright, branches crackle outward with electric sparks at the impact point, then flickers and fades away',
		frames: 8,
	},
	tornado: {
		first: `tall swirling tornado funnel of pale green and white wind, leaves and dust spinning around it, narrow at the ground and wide at the top, three-quarter top-down view, ${STYLE}`,
		action: 'the tornado spins violently, wind bands whirl upward, leaves and dust orbit around the funnel, seamless loop',
		frames: 8,
	},
	meteor: {
		first: `blazing meteor of molten rock wrapped in orange and yellow flames streaking down diagonally from the top left toward the ground, long fiery trail, ${STYLE}`,
		action: 'the flaming meteor plunges down, slams into the ground and explodes into a huge fireball with flying rocks and embers, then smoke rises and fades',
		frames: 10,
	},
	rock_spikes: {
		first: `cluster of sharp brown stone spikes bursting out of cracked earth with flying dirt and pebbles, three-quarter top-down view, base at the bottom of the frame, ${STYLE}`,
		action: 'stone spikes thrust violently up out of the cracking ground, dirt and pebbles fly, then the spikes crumble back into rubble and dust that fades',
		frames: 8,
	},
});

/** Hiệu ứng KHÔNG vẽ riêng mà mượn khung PixelLab của hiệu ứng khác (`dark_ring_warn` = khung đầu của `dark_ring`). */
export const PIXELLAB_VFX_ALIAS: Record<string, string> = { dark_ring_warn: 'dark_ring' };

/** Khổ PixelLab mặc định cho một hiệu ứng: bội 4, 16–256, không nhỏ hơn cỡ trong game. */
export function defaultCanvas(def: VfxDef): number {
	return Math.min(256, Math.max(16, Math.ceil(def.size / 4) * 4));
}

/**
 * Lượt ước tính của animate_image, theo tổng số pixel. Mô tả công cụ ghi 2 mốc: 64×64×8 khung = 1, 128×128×16 = 4
 * → khớp 65536 pixel/lượt (làm tròn lên, tối thiểu 1) — cùng cách tính với `animateCost` của animate_character.
 */
export function animateImageCost(w: number, h: number, frames: number): number {
	return Math.max(1, Math.ceil((w * h * frames) / 65536));
}

/** Giới hạn animate_image: w × h × frame_count ≤ 524288. */
export const ANIMATE_PIXEL_LIMIT = 524288;

/** Công cụ vẽ khung đầu. pixen/pixflux: 1 lượt; pro_flash: ≈ 5–6 lượt (đo bằng `--dry` 07/10/2026). */
export type FirstModel = 'pixen' | 'pixflux' | 'pro_flash';
export type FirstSource = 'create_image_pixen' | 'create_image_pixflux' | 'create_image_pro_flash' | 'file';
export const FIRST_TOOL: Record<FirstModel, Exclude<FirstSource, 'file'>> = {
	pixen: 'create_image_pixen',
	pixflux: 'create_image_pixflux',
	pro_flash: 'create_image_pro_flash',
};
/** Giá cố định theo mô tả công cụ ("Cost: 1 generation"); pro_flash phải tra `get_pro_flash_capabilities`. */
export const FIRST_FIXED_COST: Partial<Record<FirstModel, number>> = { pixen: 1, pixflux: 1 };

/** Khổ hợp lệ của từng công cụ vẽ khung đầu (theo schema MCP) — sai thì trả câu lỗi, đúng thì `null`. */
export function firstCanvasError(model: FirstModel, w: number, h: number): string | null {
	if (!Number.isInteger(w) || !Number.isInteger(h) || w % 4 || h % 4) return `khung đầu ${w}×${h}: mỗi cạnh phải là số nguyên bội 4`;
	if (model === 'pixen') {
		if (w < 16 || h < 16 || w > 768 || h > 768 || w * h > 512 * 512) return `pixen: cạnh 16–768, diện tích ≤ 512×512 (đang ${w}×${h})`;
		if ((w < 32 || h < 32) && w !== h) return `pixen: dưới 32px thì khung phải vuông (đang ${w}×${h})`;
	} else if (model === 'pixflux') {
		if (w < 16 || h < 16 || w > 400 || h > 400 || w * h < 1024) return `pixflux: cạnh 16–400, diện tích ≥ 32×32 (đang ${w}×${h}) — khổ nhỏ hơn thì dùng --model pixen`;
	} else if (w < 16 || h < 16 || w > 256 || h > 256) return `pro_flash: cạnh 16–256 (đang ${w}×${h})`;
	return null;
}

/** Tham số gửi công cụ vẽ khung đầu — ba công cụ cùng nhận description/width/height/no_background. */
export function firstArgs(description: string, w: number, h: number): Record<string, unknown> {
	return { description, width: w, height: h, no_background: true };
}

/** Khổ VẼ khung đầu: `--first-size` nếu có, không thì canvas × `firstScale` của preset làm tròn bội 4 (≥ 16). */
export function drawnSize(canvas: number, firstScale?: number, firstSize?: number): number {
	if (firstSize !== undefined) return firstSize;
	if (!firstScale || firstScale >= 1) return canvas;
	return Math.max(16, Math.round((canvas * firstScale) / 4) * 4);
}

/** Đặt ảnh vào GIỮA một canvas trong suốt w×h (chỉ dời chỗ, không đổi pixel nào) — cho khung đầu vẽ nhỏ. */
export function padCenter(img: RGBAImage, w: number, h: number): RGBAImage {
	if (img.width > w || img.height > h) throw new Error(`ảnh ${img.width}×${img.height} lớn hơn canvas ${w}×${h}`);
	if (img.width === w && img.height === h) return img;
	const out = createImage(w, h);
	blit(out, img, Math.floor((w - img.width) / 2), Math.floor((h - img.height) / 2));
	return out;
}

/** Đọc phản hồi `get_balance`. Lượt thưởng ngày (`generations_today`) chỉ bị trừ khi `generations_remaining` về 0. */
export function parseBalance(text: string): { remaining: number; today: number; credits: number } | null {
	const num = (re: RegExp): number | null => {
		const m = re.exec(text);
		return m ? Number(m[1]) : null;
	};
	const remaining = num(/generations_remaining:\s*(-?\d+)/i);
	if (remaining === null) return null;
	return { remaining, today: num(/generations_today:\s*(\d+)/i) ?? 0, credits: num(/credits:\s*\$?\s*([\d.]+)/i) ?? 0 };
}

/** Lỗi mạng/máy chủ tạm thời khi CHỜ một job đã trả lượt: thử lại, đừng bỏ job. */
export function isTransientError(e: unknown): boolean {
	const s = e instanceof Error ? `${e.name}: ${e.message} ${String((e as { cause?: unknown }).cause ?? '')}` : String(e);
	return /fetch failed|network|socket|ECONNRESET|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN|ENOTFOUND|UND_ERR|aborted|timed? ?out|HTTP (?:408|425|429|5\d\d)|session/i.test(s) || isSessionError(e);
}

/** Phiên MCP hết hạn/không còn (máy chủ trả 400/404 cho chính endpoint MCP, hoặc lỗi JSON-RPC nhắc tới session). */
export function isSessionError(e: unknown): boolean {
	const s = e instanceof Error ? e.message : String(e);
	return /\] HTTP 40[04]\b|session/i.test(s);
}

/** Cờ của `pixellab vfx`. */
export interface VfxFlags {
	first?: string;
	action?: string;
	size?: number;
	firstSize?: number;
	frames?: number;
	firstImage?: string;
	model?: FirstModel;
	dry: boolean;
	force: boolean;
	firstOnly: boolean;
	redrawFirst: boolean;
}

/**
 * Đọc cờ. `--dry` thắng ở MỌI vị trí, và cờ cần giá trị không nhận token bắt đầu bằng `--`: `--first --dry`
 * (quên mô tả, hoặc biến shell rỗng bị Git Bash bỏ mất) phải là LỖI, không được thành lệnh thật với mô tả "--dry".
 */
export function parseVfxFlags(flags: string[]): VfxFlags {
	const opt: VfxFlags = { dry: flags.includes('--dry'), force: false, firstOnly: false, redrawFirst: false };
	for (let i = 0; i < flags.length; i += 1) {
		const f = flags[i]!;
		const value = (): string => {
			const v = flags[(i += 1)];
			if (v === undefined || v.startsWith('--') || !v.trim()) throw new Error(`Thiếu giá trị cho ${f}`);
			return v;
		};
		if (f === '--dry') continue;
		else if (f === '--force') opt.force = true;
		else if (f === '--first-only') opt.firstOnly = true;
		else if (f === '--redraw-first') opt.redrawFirst = true;
		else if (f === '--first') opt.first = value();
		else if (f === '--action') opt.action = value();
		else if (f === '--size') opt.size = Number(value());
		else if (f === '--first-size') opt.firstSize = Number(value());
		else if (f === '--frames') opt.frames = Number(value());
		else if (f === '--first-image') opt.firstImage = value();
		else if (f === '--model') {
			const m = value();
			if (m !== 'pixen' && m !== 'pixflux' && m !== 'pro_flash') throw new Error(`--model phải là pixen | pixflux | pro_flash (nhận "${m}")`);
			opt.model = m;
		} else throw new Error(`Không hiểu "${f}"`);
	}
	return opt;
}

/**
 * `pending.json` — job đã TRẢ LƯỢT nhưng chưa tải xong. Ghi ngay sau khi gửi, nên lệnh chết giữa chừng (mạng, quá
 * giờ chờ) thì chạy lại đúng lệnh đó chỉ CHỜ + TẢI job cũ, không gửi lệnh tốn lượt mới. Xoá khi đã ghi meta.json.
 */
export interface PendingVfx {
	id: string;
	model: FirstModel | 'file';
	first: string | null;
	firstJobId?: string;
	/** Token (số thứ tự) đã gửi job khung đầu — job thuộc tài khoản nào thì phải hỏi bằng tài khoản đó. */
	firstToken?: number;
	/** Đã ghi first.png (đã đặt vào giữa canvas nếu vẽ nhỏ). */
	firstDone: boolean;
	canvas: { w: number; h: number };
	drawn: { w: number; h: number };
	action?: string;
	frames?: number;
	animateJobId?: string;
	animateToken?: number;
	updatedAt: string;
}

/** Lấy job id trong phản hồi chữ của PixelLab (`job_id: <uuid>` hoặc uuid đầu tiên). */
export function extractJobId(text: string): string | null {
	const uuid = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
	return new RegExp(`job[_\\s-]?id["'\`:\\s=]*(${uuid})`, 'i').exec(text)?.[1] ?? new RegExp(uuid, 'i').exec(text)?.[0] ?? null;
}

/** Link ảnh .png trong chữ, đúng thứ tự xuất hiện, bỏ trùng. */
export function extractPngUrls(text: string): string[] {
	const out: string[] = [];
	for (const m of text.matchAll(/https?:\/\/[^\s"'<>()\]]+?\.png(?:\?[^\s"'<>()\]]*)?/gi)) if (!out.includes(m[0])) out.push(m[0]);
	return out;
}

/** Alpha cứng: ≥ 128 thành đặc hẳn, còn lại xoá sạch (cả màu) — viền mờ của ảnh AI không được nới khung bao. */
export function hardAlpha(img: RGBAImage): RGBAImage {
	const out = { width: img.width, height: img.height, data: new Uint8Array(img.data) };
	for (let i = 0; i < out.data.length; i += 4) {
		if (out.data[i + 3]! >= 128) out.data[i + 3] = 255;
		else out.data.fill(0, i, i + 4);
	}
	return out;
}

function hasOpaque(img: RGBAImage): boolean {
	for (let i = 3; i < img.data.length; i += 4) if (img.data[i]! >= 128) return true;
	return false;
}

/**
 * Chọn khung dùng trong game từ những ảnh PixelLab trả về.
 * - still: chỉ ảnh đầu.
 * - loop: BỎ ảnh đầu vào — chuyển động lặp của PixelLab quay về gần đúng ảnh đầu, giữ cả hai là khựng một nhịp ở mối nối.
 * - burst: GIỮ ảnh đầu vào — đó là khoảnh khắc mở màn (mô tả khung đầu là "vừa bắt đầu"), chuyển động nối tiếp nó.
 * `meta.useInput` đè lựa chọn trên khi duyệt bằng mắt thấy không hợp.
 */
export function selectPixelLabFrames<T>(def: VfxDef, meta: PixelLabVfxMeta, frames: T[]): T[] {
	if (def.kind === 'still') return frames.slice(0, 1);
	if (!meta.inputIncluded) return frames;
	const useInput = meta.useInput ?? def.kind === 'burst';
	return useInput ? frames : frames.slice(1);
}

/**
 * Đưa chuỗi khung PixelLab về cỡ trong game: cắt theo khung bao CHUNG của mọi khung (giữ chuyển động tương đối,
 * neo giữa không trôi), thu bằng `resampleMode` sao cho cạnh dài = `def.size`, ép dẹt `squashY`. Không phóng lẻ:
 * hình nhỏ hơn cỡ thì chỉ phóng NGUYÊN lần (hoặc giữ 1:1) để không vỡ lưới pixel. `resampleMode` luôn ra alpha
 * cứng 0/255. Khung trống ở CUỐI (vụ nổ đã tan hết) bị bỏ, còn tối thiểu 1 khung.
 */
export function fitPixelLabFrames(def: VfxDef, frames: RGBAImage[], squashY = def.squashY ?? 1): { frames: RGBAImage[]; scale: number } {
	const hard = frames.map(hardAlpha);
	let x0 = Infinity;
	let y0 = Infinity;
	let x1 = -Infinity;
	let y1 = -Infinity;
	for (const f of hard) {
		const b = opaqueBounds(f);
		if (!b) continue;
		x0 = Math.min(x0, b.x0);
		y0 = Math.min(y0, b.y0);
		x1 = Math.max(x1, b.x1);
		y1 = Math.max(y1, b.y1);
	}
	if (!Number.isFinite(x0)) throw new Error('mọi khung đều trong suốt');
	const uw = x1 - x0;
	const uh = y1 - y0;
	const longest = Math.max(uw, uh);
	const k = longest > def.size ? def.size / longest : Math.max(1, Math.floor(def.size / longest));
	const W = Math.max(1, Math.round(uw * k));
	const H = Math.max(1, Math.round(uh * k * squashY));
	const out = hard.map((f) => resampleMode(crop(f, x0, y0, uw, uh), W, H));
	while (out.length > 1 && !hasOpaque(out[out.length - 1]!)) out.pop();
	return { frames: out, scale: k };
}

/** Đọc thư mục PixelLab của một hiệu ứng: chưa có → `none`, thiếu/hỏng → `incomplete` (kèm lý do), đủ → khung đã đưa về cỡ game. */
export function keyOutDark(img: RGBAImage, threshold: number): void {
	const d = img.data;
	for (let i = 0; i < d.length; i += 4) if (Math.max(d[i]!, d[i + 1]!, d[i + 2]!) < threshold) d[i + 3] = 0;
}

export function loadPixelLabVfx(root: string, def: VfxDef): PixelLabVfxLoad {
	const src = PIXELLAB_VFX_ALIAS[def.id] ?? def.id;
	const dir = join(root, src);
	if (!existsSync(dir)) return { status: 'none' };
	const metaPath = join(dir, 'meta.json');
	if (!existsSync(metaPath)) {
		const pngs = readdirSync(dir).filter((f) => f.endsWith('.png')).length;
		return { status: 'incomplete', reason: `chưa có meta.json (${pngs} ảnh) — lệnh tải dở?` };
	}
	let meta: PixelLabVfxMeta;
	try {
		meta = JSON.parse(readFileSync(metaPath, 'utf8')) as PixelLabVfxMeta;
	} catch (e) {
		return { status: 'incomplete', reason: `meta.json hỏng: ${e instanceof Error ? e.message : String(e)}` };
	}
	if (meta.id !== src) return { status: 'incomplete', reason: `meta.json ghi id "${meta.id}"` };
	const want = meta.frameCount + (meta.inputIncluded ? 1 : 0);
	if (!Array.isArray(meta.files) || meta.files.length !== want) return { status: 'incomplete', reason: `cần ${want} ảnh, meta liệt kê ${meta.files?.length ?? 0}` };
	const missing = meta.files.filter((f) => !existsSync(join(dir, f)));
	if (missing.length) return { status: 'incomplete', reason: `thiếu ${missing.join(', ')}` };
	const raw = meta.files.map((f) => readPng(join(dir, f)));
	if (meta.keyDark) for (const f of raw) keyOutDark(f, meta.keyDark);
	// Khung bị loại khi duyệt: thay bằng null rồi lọc SAU bước chọn ảnh đầu vào, để `useInput`/loop vẫn tính đúng ảnh 0.
	const keep = meta.files.map((f) => !meta.drop?.includes(f));
	if (raw.some((f) => f.width !== raw[0]!.width || f.height !== raw[0]!.height)) return { status: 'incomplete', reason: 'các khung không cùng cỡ' };
	const picked = selectPixelLabFrames(def, meta, raw.map((f, i) => ({ f, i })))
		.filter((x) => keep[x.i])
		.map((x) => x.f);
	if (!picked.length || (def.kind !== 'still' && picked.length < 2)) return { status: 'incomplete', reason: `chỉ còn ${picked.length} khung sau khi chọn` };
	try {
		const { frames, scale } = fitPixelLabFrames(def, picked, meta.squashY ?? def.squashY ?? 1);
		const dropped = raw.length - picked.length;
		const note = `${frames.length} khung${dropped ? ` (bỏ ${dropped} ảnh: đầu vào/khung loại khi duyệt)` : ''}, ${raw[0]!.width}×${raw[0]!.height} → ${frames[0]!.width}×${frames[0]!.height}${scale < 1 ? '' : scale > 1 ? ` (phóng ×${scale})` : ' (giữ 1:1)'}`;
		return { status: 'ok', frames, meta, note };
	} catch (e) {
		return { status: 'incomplete', reason: e instanceof Error ? e.message : String(e) };
	}
}

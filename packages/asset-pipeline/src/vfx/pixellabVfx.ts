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

// Hiệu ứng RIÊNG từng skill / nội tại / phản ứng (09/10/2026, gói PixelLab trả phí — Mốc 1 `docs/the-gioi-aether.md`): khung
// đầu Pro Flash, vẽ đúng màu (game không tô tint). Hiệu ứng xoay theo hướng đòn (vệt chém, sóng, đạn) vẽ HƯỚNG SANG PHẢI (+x);
// hiệu ứng mặt đất vẽ nhìn từ trên xuống (pipeline ép dẹt bằng `squashY`).
Object.assign(PIXELLAB_VFX_PRESETS, {
	rock_shot: {
		first: `jagged chunk of brown rock flying to the right, small pebbles and a short dust trail behind it on the left, ${STYLE}`,
		action: 'the rock tumbles and spins while flying, dust trailing behind, seamless loop',
		frames: 4,
	},
	rock_burst: {
		first: `brown rock just starting to shatter on impact, cracked stone core with a few chips, ${STYLE}`,
		action: 'the rock smashes apart into flying stone chunks, pebbles and a cloud of dust, then the dust settles and fades away',
		frames: 8,
		firstScale: 0.5,
	},
	fire_explosion: {
		first: `big fire explosion just starting, blinding yellow-white core with thick orange and red flames and dark smoke edges, ${STYLE}`,
		action: 'a huge fireball explosion billows outward with roiling flames and flying embers, then turns into black smoke that rises and fades away',
		frames: 10,
		firstScale: 0.5,
	},
	tidal_wave: {
		first: `a big curling blue ocean wave rushing to the right, white foam crest, widening like a cone toward the right, spray droplets, ${STYLE}`,
		action: 'the wave surges forward to the right, curls over and crashes into foam and spray, then fades away',
		frames: 8,
	},
	wind_trail: {
		first: `long horizontal streak of pale green wind lines and a few spinning leaves, trailing behind toward the left, ${STYLE}`,
		action: 'the wind streak whooshes from left to right, leaves swirl along it, then it thins out and fades away',
		frames: 6,
	},
	frost_field: {
		first: `circular patch of frozen ground seen from directly above, cracked blue-white ice with sharp frost crystals around the rim, ${STYLE}`,
		action: 'frost spreads outward across the ground, ice crystals sparkle and grow, then the ice cracks and melts away',
		frames: 8,
		firstScale: 0.6,
	},
	quake_wave: {
		first: `circular ring of cracked earth seen from directly above, brown dirt chunks and dust bursting outward, ${STYLE}`,
		action: 'a shockwave ring bursts outward through the ground, cracks spread, dirt and rocks jump up, then the dust settles and fades away',
		frames: 8,
		firstScale: 0.5,
	},
	heavy_slash: {
		first: `huge thick vertical crescent sword slash arc, convex side facing right, blazing golden-white light with sparks, sharp tips at top and bottom, ${GLOW}`,
		action: 'the heavy slash arc slams down from top to bottom with a flash and sparks, then thins out and fades away',
		frames: 6,
	},
	pierce_slash: {
		first: `long straight horizontal piercing thrust streak of white-silver light pointing to the right with a sharp bright tip, ${GLOW}`,
		action: 'the piercing streak shoots forward to the right with a flash, then thins out and fades away',
		frames: 6,
	},
	water_guard: {
		first: `ring of clear blue water flowing in a circle seen from directly above, gentle splashes, empty center, ${STYLE}`,
		action: 'the water ring swirls around in a circle, ripples and droplets moving with it, seamless loop',
		frames: 6,
	},
	parry_flash: {
		first: `bright white and pale blue clash spark star of a sword deflection, sharp sparks flying outward, ${GLOW}`,
		action: 'the clash spark flashes brightly, sparks fly outward, then it shrinks and fades away',
		frames: 6,
		firstScale: 0.5,
	},
	shadow_smoke: {
		first: `puff of dark purple-black shadow smoke with wispy tendrils, ${STYLE}`,
		action: 'the shadow smoke puffs outward, wisps curl and swirl, then it dissolves and fades away',
		frames: 8,
		firstScale: 0.6,
	},
	fire_slash: {
		first: `wide fan-shaped cone of fire sweeping to the right, a crescent sword slash made of roaring orange and yellow flames with embers, ${STYLE}`,
		action: 'the fiery slash sweeps forward to the right spreading flames in a cone, embers scatter, then the flames die out',
		frames: 8,
	},
	water_dragon: {
		first: `a serpentine dragon made of flowing clear blue water charging to the right with open jaws, splashing spray behind it, ${STYLE}`,
		action: 'the water dragon surges forward to the right with its body rippling, jaws snapping, then it bursts into splashing water and fades away',
		frames: 8,
	},
	wind_blade_ring: {
		first: `ring of spinning pale green wind blades circling around an empty center, seen from above at an angle, ${STYLE}`,
		action: 'the wind blades spin rapidly around the circle, slicing the air, seamless loop',
		frames: 6,
	},
	ice_slash: {
		first: `vertical crescent sword slash arc made of ice, convex side facing right, pale cyan and white with frost shards breaking off, ${STYLE}`,
		action: 'the icy slash arc sweeps from top to bottom, frost shards scatter, then it shatters into sparkles and fades',
		frames: 6,
	},
	fire_wall: {
		first: `a wide wall of tall roaring flames standing in a horizontal row on the ground, side view, flames filling the lower part of the frame, ${STYLE}`,
		action: 'the wall of flames roars and flickers, tongues of fire licking upward, embers rising, seamless loop',
		frames: 6,
	},
	wind_blade: {
		first: `small sharp crescent blade of pale green wind flying to the right, thin wind streaks behind it, ${STYLE}`,
		action: 'the wind blade spins and whooshes forward, streaks fluttering, seamless loop',
		frames: 4,
	},
	ice_dome: {
		first: `translucent dome shield made of pale blue ice crystal panels around an empty center, glints of light, ${STYLE}`,
		action: 'the ice dome shimmers, light glints sweep across its crystal panels, frost sparkles drift, seamless loop',
		frames: 6,
	},
	stone_wall: {
		first: `a thick wall of rough brown stone blocks standing on cracked ground, side view, base at the bottom of the frame, ${STYLE}`,
		action: 'the stone wall rises up out of the cracking ground, rubble falling off, then it stands firm with dust settling',
		frames: 8,
	},
	rockslide: {
		first: `big brown boulders tumbling down from the top of the frame toward a patch of ground, dust and pebbles, ${STYLE}`,
		action: 'the boulders crash down onto the ground one after another, shattering into rubble and dust clouds, then the dust fades',
		frames: 10,
	},
	armor_shatter: {
		first: `steel armor plate cracking apart with bright sparks, ${STYLE}`,
		action: 'the armor plate shatters into flying metal shards and sparks, then the pieces fall and fade away',
		frames: 6,
		firstScale: 0.6,
	},
	blade_wave: {
		first: `glowing silver crescent sword wave flying to the right with a shimmering trail behind it, ${GLOW}`,
		action: 'the crescent sword wave glides forward shimmering, its trail rippling, seamless loop',
		frames: 4,
	},
	whirlpool: {
		first: `swirling whirlpool of deep blue water seen from directly above, white foam spiral arms around a dark center, ${STYLE}`,
		action: 'the whirlpool spins around its center, foam spiral arms turning, spray flying off, seamless loop',
		frames: 8,
	},
	flying_sword: {
		first: `a steel longsword with a glowing pale blue edge lying horizontally pointing to the right, faint light trail, ${STYLE}`,
		action: 'the sword glows and pulses with a faint trail shimmering behind it, seamless loop',
		frames: 4,
	},
	gold_aura: {
		first: `golden aura flames rising in a ring around an empty center, bright sparks, ${GLOW}`,
		action: 'the golden aura flares up powerfully, flames rising and sparks shooting up, then it settles and fades',
		frames: 8,
	},
	red_aura: {
		first: `crimson red aura flames flickering in a ring around an empty center, dark red sparks, ${GLOW}`,
		action: 'the crimson aura flickers and burns steadily, flames licking upward, seamless loop',
		frames: 6,
	},
	lake_ripple: {
		first: `calm circular ripples on clear blue water seen from directly above, gentle light reflections, ${STYLE}`,
		action: 'ripples spread outward in calm rings, light reflections shimmer, then the water stills and fades',
		frames: 8,
		firstScale: 0.6,
	},
	ember_burst: {
		first: `burst of glowing orange embers and grey ash just starting, ${STYLE}`,
		action: 'fiery embers and ash explode outward, sparks scatter and float, then they die out and fade away',
		frames: 8,
		firstScale: 0.5,
	},
	heal_drops: {
		first: `soft green healing water droplets and small sparkles, ${GLOW}`,
		action: 'green healing droplets and sparkles rise upward gently, glimmering, then fade away',
		frames: 8,
	},
	earth_aura: {
		first: `ring of golden-brown earth energy glowing on the ground seen from above at an angle, small pebbles floating up, ${STYLE}`,
		action: 'the earth energy ring glows brighter, pebbles float upward, then it dims and fades away',
		frames: 8,
	},
	mud_splash: {
		first: `thick brown mud splash just starting, ${STYLE}`,
		action: 'thick brown mud splashes outward in blobs and droplets, then forms a mud puddle that fades away',
		frames: 8,
		firstScale: 0.5,
	},
	lava_burst: {
		first: `bubbling molten lava just starting to erupt, glowing orange cracks in black rock, ${STYLE}`,
		action: 'molten lava erupts in glowing blobs and splashes, black crust cracks, then it cools and fades away',
		frames: 8,
		firstScale: 0.5,
	},
	sandstorm: {
		first: `small swirling sandstorm vortex of golden sand and dust, ${STYLE}`,
		action: 'the sand vortex whirls violently, sand grains and dust spiral around, then it scatters and fades away',
		frames: 8,
	},
	ice_shatter: {
		first: `solid block of ice just starting to crack, ${STYLE}`,
		action: 'the ice block shatters into many sharp crystal shards flying outward with frost mist, then they fade away',
		frames: 8,
		firstScale: 0.5,
	},
});

// Chiêu boss vùng 1–4 (09/10/2026, Mốc 1): mỗi boss một hình nổ riêng thay vòng tối dùng chung (`CombatSystem.BOSS_AOE_LOOK`),
// boss chúa thêm chiêu thứ hai. Vẽ đúng màu; chiêu xoay theo hướng (hơi thở, sóng lửa) vẽ HƯỚNG SANG PHẢI.
Object.assign(PIXELLAB_VFX_PRESETS, {
	boss_hellfire: {
		first: `a towering pillar of hellfire erupting straight up out of a cracked glowing crater in the ground, crimson and black flames with bright orange core, base at the bottom of the frame, ${STYLE}`,
		action: 'the hellfire pillar bursts up from the cracking ground, roars upward with swirling dark flames, then collapses into embers and black smoke that fades',
		frames: 10,
	},
	boss_fire_wave: {
		first: `a wide wave of dark red demonic fire rushing to the right along the ground, black smoke on top, embers, ${STYLE}`,
		action: 'the demonic fire wave surges forward to the right engulfing the ground, then burns out into smoke and embers',
		frames: 8,
	},
	boss_curse_blast: {
		first: `a glowing purple necromantic curse sigil circle on the ground with skull runes, violet light rising from it, base at the bottom of the frame, ${STYLE}`,
		action: 'the curse sigil glows brighter and erupts in a column of violet ghostly flames with wailing skull shapes, then fades into purple mist',
		frames: 10,
	},
	boss_bone_rise: {
		first: `skeletal hands and bones bursting up out of cracked dark earth, green ghostly glow, base at the bottom of the frame, ${STYLE}`,
		action: 'bony hands claw up out of the ground grabbing at the air, dirt flies, then they crumble back into the earth',
		frames: 8,
	},
	boss_stone_slam: {
		first: `heavy stone fist slamming the ground creating a crater with jagged rock shards flying up, grey dust, ${STYLE}`,
		action: 'the ground cracks from the stone slam, rock shards burst upward in a ring, then dust settles and fades',
		frames: 8,
		firstScale: 0.6,
	},
	boss_toxic_pool: {
		first: `big splash of bubbling toxic green poison slime landing on the ground, purple bubbles, ${STYLE}`,
		action: 'the toxic slime splashes outward into a bubbling poison puddle with rising green fumes, then it dries up and fades',
		frames: 8,
	},
	boss_hex: {
		first: `a glowing green witch hex rune circle with a ghostly skull in the middle, swirling green wisps, ${GLOW}`,
		action: 'the hex rune flares, the ghostly skull screams and bursts into green flames and wisps, then fades away',
		frames: 8,
	},
	boss_mud_geyser: {
		first: `a geyser of thick brown swamp mud erupting straight up from a bubbling mud pool, reeds and water spray, base at the bottom of the frame, ${STYLE}`,
		action: 'the mud geyser blasts upward and splashes down in heavy mud blobs all around, then sinks back into a bubbling pool that fades',
		frames: 10,
	},
	boss_venom_spray: {
		first: `a spray of glowing purple venom droplets splashing on the ground, sizzling poison, ${STYLE}`,
		action: 'venom splashes outward in sizzling purple droplets and fumes, then the puddles evaporate and fade',
		frames: 8,
		firstScale: 0.6,
	},
	boss_ankh_curse: {
		first: `a glowing turquoise ancient Egyptian ankh symbol rising over a swirl of golden sand, hieroglyph runes circling, ${STYLE}`,
		action: 'the turquoise ankh flares with power, sand swirls up in a spiral and explodes outward with glowing hieroglyphs, then settles and fades',
		frames: 10,
	},
	boss_sand_eruption: {
		first: `a massive eruption of golden sand bursting up from the desert floor, rocks and dust flying, base at the bottom of the frame, ${STYLE}`,
		action: 'the sand erupts violently upward in a huge plume, rocks fly out, then the sand pours back down and the dust drifts away',
		frames: 10,
	},
	boss_quicksand: {
		first: `a swirling quicksand vortex in golden desert sand seen from directly above, spiral grooves pulling inward, ${STYLE}`,
		action: 'the quicksand vortex spins and sucks sand into its center, grains sliding inward, seamless loop',
		frames: 8,
	},
	boss_storm_bolt: {
		first: `a crackling blue lightning bolt striking down with glowing storm feathers scattered around the impact, white sparks, ${GLOW}`,
		action: 'the lightning strikes down with a flash, charged feathers scatter outward crackling, then the sparks fizzle and fade',
		frames: 8,
	},
	boss_wind_spiral: {
		first: `a powerful spiral blast of white and teal wind swirling to the right with sharp wind blades, small leaves, ${STYLE}`,
		action: 'the wind spiral blasts forward to the right twisting violently, wind blades slice, then it disperses and fades',
		frames: 8,
	},
	boss_wind_breath: {
		first: `a wide cone of swirling jade-green dragon wind breath blowing to the right, white cloud streaks and wind blades, ${STYLE}`,
		action: 'the dragon wind breath roars forward to the right widening like a cone, cloud streaks whip, then it disperses and fades',
		frames: 8,
	},
	boss_gale_storm: {
		first: `a huge swirling storm cyclone of jade-green wind and white clouds with debris and leaves orbiting, narrow at the ground and wide at the top, ${STYLE}`,
		action: 'the storm cyclone spins violently, clouds and debris whirl around it, seamless loop',
		frames: 8,
	},
});

// Chiêu của Phong Long Tuyệt Vân (09/10/2026, Mốc 1): đáp xuống tạo lốc, bão gió đẩy ra mép vực, mưa lưỡi gió.
// Vẽ đúng màu; bão gió xoay theo hướng nên vẽ HƯỚNG SANG PHẢI.
Object.assign(PIXELLAB_VFX_PRESETS, {
	dragon_wind_landing: {
		first: `a huge ring of swirling jade and white wind shockwave bursting outward along the ground with a cyclone rising in the middle, cloud puffs and flying leaves, base at the bottom of the frame, ${STYLE}`,
		action: 'the wind shockwave explodes outward from the landing point while a cyclone spirals upward, clouds and leaves whirl, then it all disperses and fades',
		frames: 10,
	},
	dragon_gale_push: {
		first: `a massive sweeping gale of jade-green wind rushing to the right like a wall, white cloud streaks, leaves and pebbles carried in it, ${STYLE}`,
		action: 'the giant gale sweeps forward to the right with tremendous force, cloud streaks whipping, then it disperses and fades',
		frames: 8,
	},
	dragon_wind_blades: {
		first: `many crescent blades of glowing pale green wind raining down from the sky onto a patch of ground, small cuts in the earth, ${STYLE}`,
		action: 'the wind blades slash down onto the ground one after another, kicking up dust and leaves, then they fade away',
		frames: 10,
	},
});

// Tuyệt kỹ mốc 10 (09/10/2026, Mốc 1 — vẽ trước, logic làm ở GĐ4 `docs/ke-hoach-nguyen-to.md`): khổ 160–192, Pro Flash.
// Vẽ đúng màu; phượng hoàng / sóng thần bay ngang màn hình nên vẽ HƯỚNG SANG PHẢI.
Object.assign(PIXELLAB_VFX_PRESETS, {
	ult_judgment: {
		first: `hundreds of swords of radiant golden light raining down from the sky and stabbing into the ground, divine glow, base at the bottom of the frame, ${GLOW}`,
		action: 'the golden light swords rain down one after another and plunge into the ground in bursts of holy light, then they shatter into sparkles and fade',
		frames: 10,
	},
	ult_still_lake: {
		first: `a perfectly calm mirror-like circle of water with a translucent glowing reflective dome barrier above it, serene silver-blue light, empty center, ${STYLE}`,
		action: 'the mirror dome shimmers calmly, gentle ripples spread on the water surface, reflections glide across the barrier, seamless loop',
		frames: 8,
	},
	ult_shadow_burst: {
		first: `a burst of dark violet shadow afterimages and black smoke streaks exploding outward from an empty center, ${STYLE}`,
		action: 'shadow afterimages and smoke streaks burst outward in all directions, then they dissolve into darkness and fade',
		frames: 8,
		firstScale: 0.6,
	},
	ult_phoenix: {
		first: `a majestic phoenix made of living flames flying to the right with huge wings spread, long flowing tail of fire and embers trailing behind it on the left, ${STYLE}`,
		action: 'the fire phoenix flaps its burning wings powerfully while flying forward, flames streaming and embers scattering, seamless loop',
		frames: 8,
	},
	ult_tsunami: {
		first: `a colossal towering tsunami wave rushing to the right, dark deep blue water with huge white foam crest curling over, spray and debris, ${STYLE}`,
		action: 'the giant tsunami surges forward to the right, crests and crashes down in an enormous explosion of water and foam, then the water drains away and fades',
		frames: 10,
	},
	ult_tempest: {
		first: `a giant tempest storm vortex swirling around an empty center, jade wind bands, sharp wind blades, crackling lightning and storm clouds, ${STYLE}`,
		action: 'the tempest spins violently around its center, wind blades and lightning whirl through it, seamless loop',
		frames: 8,
	},
	ult_ice_age: {
		first: `a massive wave of ice spreading across the ground from the center, tall jagged ice crystals and frozen spikes erupting, freezing mist, seen from above at an angle, ${STYLE}`,
		action: 'the ice age wave spreads outward freezing the ground, huge ice spikes burst up everywhere, mist swirls, then the ice cracks and shatters into glittering shards that fade',
		frames: 10,
	},
});

// Vệt chém kiếm PHỦ PHÉP từng hệ (09/10/2026, chủ dự án: "đủ hiệu ứng chém khi bọc nguyên tố, thật hoành tráng"):
// thay vệt trắng nhuộm màu (`CombatSystem.slashFx`). Cùng quy ước `slash`: vệt DỌC, bụng lồi quay sang PHẢI (+x).
Object.assign(PIXELLAB_VFX_PRESETS, {
	slash_fire: {
		first: `huge vertical crescent sword slash arc made of roaring fire, convex side facing right, thick blazing core tapering to sharp tips at top and bottom, orange and yellow flames licking off its edge, embers and sparks flying, ${STYLE}`,
		action: 'the fiery slash arc sweeps from top to bottom in a blaze, flames roar along its edge and embers scatter, then it burns out into sparks and smoke',
		frames: 8,
	},
	slash_water: {
		first: `huge vertical crescent sword slash arc made of rushing clear blue water, convex side facing right, thick in the middle tapering to sharp tips, white foam crest and splashing droplets, ${STYLE}`,
		action: 'the water slash arc sweeps from top to bottom like a crashing wave, foam and droplets spray outward, then it splashes apart and fades',
		frames: 8,
	},
	slash_wind: {
		first: `huge vertical crescent sword slash arc made of swirling pale green wind, convex side facing right, layered wind streaks tapering to sharp tips, spinning leaves caught in it, ${STYLE}`,
		action: 'the wind slash arc whips from top to bottom with a gust, streaks spiral and leaves scatter, then it disperses and fades',
		frames: 8,
	},
	slash_ice: {
		first: `huge vertical crescent sword slash arc made of glittering ice, convex side facing right, thick translucent cyan crystal tapering to sharp tips, frost mist and ice shards breaking off, ${STYLE}`,
		action: 'the icy slash arc sweeps from top to bottom freezing the air, ice shards burst off and frost mist swirls, then it shatters into glittering sparkles',
		frames: 8,
	},
	slash_earth: {
		first: `huge vertical crescent sword slash arc made of jagged brown stone and dirt, convex side facing right, heavy rocky edge tapering to sharp tips, pebbles and dust flying off it, ${STYLE}`,
		action: 'the earthen slash arc slams from top to bottom with crushing weight, rocks and pebbles fly off and dust bursts, then it crumbles into dust that settles',
		frames: 8,
	},
});

// Mốc 2 (09/10/2026, workflow thiết kế): chiêu boss vùng 5–7 + chiêu Băng / Hoả / Thuỷ Long. Vẽ đúng màu; hiệu ứng có hướng
// vẽ HƯỚNG SANG PHẢI; hiệu ứng mặt đất nhìn từ trên xuống (`squashY`).
Object.assign(PIXELLAB_VFX_PRESETS, {
	boss_ice_embrace: {
		first: `two slender arms of translucent pale blue ice with long flowing frozen sleeves rising from frozen ground on the left and right and curving inward around an empty space like a mother's embrace, frost mist at the base, drifting snowflakes, base at the bottom of the frame, ${STYLE}`,
		action: 'the ice arms sweep inward and close together in a gentle tight embrace, frost crackles over them, then they crack and shatter into glittering shards that fade',
		frames: 10,
	},
	boss_avalanche: {
		first: `a huge mass of avalanche snow crashing straight down onto a spot from above, tumbling chunks of ice and rocks, white powder spray bursting outward to both sides, base at the bottom of the frame, ${STYLE}`,
		action: 'the avalanche snow slams down and bursts outward in all directions burying the spot, powder clouds billow up, then the snow settles and the mist fades',
		frames: 8,
	},
	boss_frost_roar: {
		first: `a ring of pale cyan frost shockwave expanding outward across the ground seen from directly above, empty center, jagged frost spikes along its rim, snowflakes and tiny ice shards caught in it, ${STYLE}`,
		action: 'the frost ring blasts outward with a second ring following, frost spikes jut up along the rims, then the rings thin out and fade',
		frames: 8,
		firstScale: 0.5,
	},
	boss_oblivion_mist: {
		first: `a swirling patch of freezing pale blue-white mist on the ground seen from directly above, faint translucent ghostly shapes of faces and hands frozen inside the fog, tiny glittering ice crystals, ${STYLE}`,
		action: 'the freezing mist swirls slowly round and round, ghostly shapes surface and sink back into the fog, ice crystals glitter, seamless loop',
		frames: 8,
	},
	boss_magma_fissure: {
		first: `a single long straight fissure of glowing molten lava splitting the ground and running to the right, seen from directly above, short magma jets spurting up along it, bronze rivets and basalt chips flying, ${STYLE}`,
		action: 'the lava fissure tears forward to the right, magma jets spurt along its length one after another, then it cools to a dark line and fades',
		frames: 8,
	},
	boss_lava_spit: {
		first: `a gushing arc of molten lava globs spat to the right, bright orange and yellow with dark crust, droplets and smoke trailing, ${STYLE}`,
		action: 'the lava stream gushes forward to the right in an arc, the globs burst into sizzling molten splashes and smoke in mid-air, then they cool and fade',
		frames: 8,
	},
	boss_ash_fall: {
		first: `a heavy downpour of grey ash flakes and dying orange embers splattering onto the ground in an uneven blotchy spray seen from directly above, several separate scattered ash heaps of different sizes, no ring and no circle, thin glowing red threads in the largest heaps, transparent around the splatter, ${STYLE}`,
		action: 'ash and embers pour down in uneven bursts and pile into scattered heaps, embers flare and turn grey, the red threads in the ash pulse, then the ash drifts away and fades',
		frames: 10,
	},
	boss_forge_sigil: {
		first: `a large glowing orange runic forge circle seen from directly above, an anvil glyph in the center, flickering flames along the ring, some runes guttering into grey ash laced with thin glowing red threads, empty transparent surroundings, ${GLOW}`,
		action: 'the forge sigil pulses with heat, flames run around the ring and sparks rise from the runes, the ashen runes flicker and their red threads pulse, seamless loop',
		frames: 8,
	},
	boss_coral_spikes: {
		first: `a cluster of jagged pink and white coral spikes bursting up out of cracked white sand with a pulse of glowing aqua water light and bubbles at the center, three-quarter top-down view, base at the bottom of the frame, ${STYLE}`,
		action: 'the coral spikes thrust up out of the sand while the aqua water light pulses outward with bubbles, then the spikes crumble back into sand and the light fades',
		frames: 8,
	},
	boss_ghost_lantern: {
		first: `a ring of sickly sea-green ghost fire flaring outward, wisps of sea mist and drifting spectral sparks, a faint ghostly lantern shape with a dim yellow flame at the center, ${GLOW}`,
		action: 'the dim yellow lantern flame flares and sends out a ring of sickly sea-green ghost fire and sea mist, wisps swirl, then it dims and fades away softly',
		frames: 8,
		firstScale: 0.5,
	},
	boss_tentacle_slam: {
		first: `a giant crimson-purple squid tentacle with a club-shaped suckered tip bursting straight up out of splashing dark sea water and broken ship planks, base at the bottom of the frame, ${STYLE}`,
		action: 'the huge tentacle erupts upward from the water, curls over and slams down with a big splash scattering planks and spray, then sinks back into the water and the foam fades',
		frames: 10,
	},
	boss_ink_flood: {
		first: `a wide flat splash of glossy thick black kraken ink pooled and splattered across wooden ship deck planks, seen from directly above, the planks running straight horizontally, a few cracks with dark sea water showing in the gaps, ink droplets around the rim, no rising tendrils, no smoke, nothing standing up, ${STYLE}`,
		action: 'the glossy black ink pool spreads outward and ripples, thick bubbles swell and pop on its surface, droplets splatter at the rim, then it slowly seeps away and fades, the ink stays black the whole time',
		frames: 10,
		firstScale: 0.6,
	},
	dragon_frost_breath: {
		first: `a wide cone of freezing pale blue frost dragon breath blowing to the right, swirling snow, sharp ice shards and glittering frost crystals inside it, ${STYLE}`,
		action: 'the frost breath roars forward to the right widening like a cone, ice shards fly and frost crystals glitter, then it disperses into cold mist and fades',
		frames: 8,
	},
	dragon_ice_pillar: {
		first: `a huge six-sided deep sapphire-blue ice crystal column with a white frost core, falling point-first straight down into the ground, a ring of white frost and snow spray at the impact point, base at the bottom of the frame, ${STYLE}`,
		action: 'the crystal column slams down point-first and stands in the ground, a frost ring bursts outward, then the column cracks and shatters into blue shards that fade into mist',
		frames: 10,
	},
	dragon_ice_lake_crack: {
		first: `a small star of thick chunky jagged crack lines spreading from a center point, seen from directly above, each crack 2-3 pixels wide with bright white and pale cyan edges and a dark blue water glint inside, high contrast solid unbroken lines, bold and readable at small size, no ice slab, transparent outside the cracks, ${STYLE}`,
		action: 'the cracks race outward in all directions, dark water wells up through them with small ripples, then the cracks frost over and fade',
		frames: 10,
		firstScale: 0.65,
	},
	dragon_fire_breath: {
		first: `a wide cone of roaring orange and golden dragon fire breath blowing to the right, white-hot core, black smoke curls and flying embers at the edges, ${STYLE}`,
		action: 'the fire breath roars forward to the right widening like a cone, flames churn and embers scatter, then it burns out into smoke and fades',
		frames: 8,
	},
	dragon_meteor: {
		first: `a falling blazing fire pearl, a round orb of white-hot molten gold wrapped in a spiral of crimson dragon flames, streaking down diagonally from the upper left with a short twisting flame tail, about to hit the ground, base at the bottom of the frame, ${STYLE}`,
		action: 'the fire pearl smashes into the ground and bursts into a ring of crimson and gold flames with molten droplets, leaving a glowing scorch mark that cools and fades',
		frames: 10,
	},
	dragon_lava_pool: {
		first: `an irregular round pool of glowing molten lava seen from directly above, uneven black rock crust rim, bubbling orange-yellow magma with a few dark crust plates, transparent outside the pool, ${STYLE}`,
		action: 'the lava pool bubbles and churns, crust plates drift and crack, bubbles pop with small sparks, seamless loop',
		frames: 8,
	},
	dragon_water_dive: {
		first: `an oval whirlpool of deep blue sea water seen from a low three-quarter side view at the bottom of the frame, a short stubby spiral of sea water just starting to rise from its center no taller than a third of the frame, foam and bubbles, no creature, no head, base at the bottom of the frame, ${STYLE}`,
		action: 'the spiral water column corkscrews upward out of the whirlpool, foam and droplets fly off the turning spiral, at the top the spray bursts open into the shape of two spread bat-like wings, then the whirlpool calms and fades',
		frames: 10,
	},
	dragon_tsunami: {
		first: `a long low wall of teal sea water surging to the right along the ground, a curling white foam lip, broken coral, seashells and splintered wooden ship planks tumbling in it, a faint glowing dragon-scale pattern on the water surface, ${STYLE}`,
		action: 'the low sea wall sweeps forward to the right along the ground, foam churning and planks tumbling, then it crashes flat, drains away and fades',
		frames: 10,
	},
	dragon_flood: {
		first: `an irregular round patch of shallow clear teal sea water seen from directly above, soft uneven wet edge, gentle ripples, a few bubbles and foam lines, transparent outside the patch, ${STYLE}`,
		action: 'the shallow flood water ripples and sloshes gently, foam lines drift, bubbles pop and reform, seamless loop',
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

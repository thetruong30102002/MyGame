import type { MobAct, MobCc, MobCcKey } from '@aether/protocol';
import { MOB_CC_KEYS } from '@aether/sim/mobs';
import { Container, Graphics, Sprite, Text, type Texture } from 'pixi.js';
import type { ActionName, Direction } from '../assets/AssetManifest';
import { ACTION_EPS, strikeClock, type ActionTiming, type StrikePlan } from '../entities/actionClock';
import type { Actor, Mover } from '../entities/Actor';
import type { StatBasis, StatKey } from '../equipment';
import { directionOf } from '../input/Keyboard';
import { regionBossMayWake, respawnDelay } from './bossRules';
import { fxTextures, type FxTextures } from './fxTextures';
import { Particles } from './Particles';
import {
	addSlow,
	aimVelocity,
	behindPoint,
	ccSeconds,
	clampTarget,
	COUNTER,
	dashPlan,
	EARTH,
	EARTH_ENCHANT,
	ENCHANT_FX,
	frostStack,
	GROUND_SQUASH,
	GUARD,
	guardOutcome,
	inArea,
	inCircle,
	knockDir,
	launchHeight,
	lifestealHeal,
	lineSegments,
	lowHp,
	missChance,
	moveFactor,
	armorDamage,
	BOSS_FREEZE_IMMUNE,
	canFreeze,
	detourSide,
	detourWaypoint,
	perfectTiming,
	pickAhead,
	pickBolts,
	pressBonus,
	pullStep,
	scatterPoints,
	SUNDER_TAKEN,
	thunderBolts,
	wallBetween,
	wallBlocks,
	wallClip,
	wallEnds,
	type Area,
	type GuardKind,
	type IncomingKind,
	type ReactionId,
	type WallSeg,
} from './skillRules';
import { cleanLevel, ENEMY_STATS, expForLevel, HERO_SKILLS, isGroundTarget, isSwordSkill, PATHS, type Element, type EnemyStats, type HeroPath, type SkillDef, type SkillHitFx } from './skills';
import {
	canEnchant,
	depthBonus,
	ENCHANT_EARTH_STUN_TIER,
	ENCHANT_SWAP_SECONDS,
	ENCHANT_UP_TIER,
	knowsSkill,
	MAX_LEVEL,
	PASSIVE,
	passiveEffects,
	REACTION_PAIR,
	reactionBonus,
	skillScale,
	type Branch,
	type EnchantId,
	type PassiveEffects,
	type SwordStyle,
	type Tiers,
} from './talents';
import { TEMP_ART, type ArtLayer } from './tempArt';
import type { Vfx, VfxId, VfxOptions } from './Vfx';

/**
 * Quái DÙNG CHUNG (M3.2): máy chủ giữ máu / sống-chết; `owned` = máy này chạy AI cho nó (báo vị trí lên máy chủ), không thì
 * nó là "con rối" đi theo vị trí máy chủ phát (`tx`/`ty`). Thiếu `net` = quái riêng của máy này như trước (tuổi thơ, nhiệm vụ,
 * boss cốt truyện, chơi một mình).
 */
export interface NetMob {
	id: string;
	owned: boolean;
	tx: number;
	ty: number;
	dir: Direction;
	anim: 'idle' | 'walk';
	/** Trạng thái lúc trúng nhát gần nhất (Tro Tàn / vụn băng khi máy chủ báo gục). */
	dying?: { burning: boolean; frozen: boolean };
	/** Lần xin làm chủ gần nhất (giây trận) — xin lại tối đa mỗi giây một lần. */
	askedAt?: number;
	/** Khống chế mà máy khác ĐÃ BIẾT (giây, trừ dần theo giờ) — chỉ gửi phần tăng thêm, nhận từ mạng cũng ghi vào nên không vọng lại. */
	ccSeen?: Partial<Record<MobCcKey, number>>;
	/** Cú đẩy đã gửi (so theo đối tượng — mỗi cú đẩy mới là một object mới). */
	pushSeen?: object | null;
}

export interface Fighter {
	actor: Actor;
	id: string;
	name: string;
	net?: NetMob;
	/** Boss (cốt truyện HOẶC vùng): thanh máu trên HUD, không theo bầy, không bị đẩy lùi, đóng băng nửa thời gian. */
	boss: boolean;
	/** Boss vùng (vùng quái `boss: true`): hồi sinh như quái, không báo cốt truyện — xem `bossRules.ts`. */
	regionBoss: boolean;
	stats: EnemyStats;
	hp: number;
	hpMax: number;
	home: { x: number; y: number; radius: number };
	attackTimer: number;
	/** Thời gian còn lại của động tác "lấy đà" trước khi đánh — người chơi nhìn thấy để né. */
	windup: number;
	/**
	 * Động tác đánh đang phát (atlas có `attack` cho hướng đó): `t` = giây game từ lúc bắt đầu vung, cùng dt với `windup`
	 * nên khung chạm hiện đúng frame đòn nổ. Kéo dài qua khung chạm tới hết pha thu thế. null = không có động tác.
	 */
	swing: { plan: StrikePlan; t: number } | null;
	engaged: boolean;
	burn: number;
	wet: number;
	chill: number;
	/** Lạnh sâu (giây, bị động Hàn Khí): đang lạnh thì chậm hơn lạnh thường. */
	frost: number;
	/** Đóng băng (giây): đứng im, không đánh, không vào thế. */
	freeze: number;
	/** Choáng (giây): như đóng băng nhưng không phải băng (Địa Chấn, kiếm phủ Thổ). */
	stun: number;
	/** Hất lên (giây còn lại / tổng): sprite bay khỏi mặt đất, không đánh được. */
	air: number;
	airTotal: number;
	/** Chậm nặng (giây) + tốc còn lại (Bùn Lầy). */
	slow: number;
	slowMult: number;
	/** Phá giáp (giây): giáp −50%, nhận thêm 15% (`skillRules.ARMOR_BREAK`). */
	armor: number;
	/** Vỡ giáp (giây, Phá Giáp đánh mục tiêu đang bị phá giáp): nhận thêm `skillRules.SUNDER_TAKEN` từ mọi nguồn. */
	sunder: number;
	/** Bão Cát (giây): đòn đánh trượt 40%. */
	miss: number;
	/** Gió Loạn (giây, bị động Phong 9): đòn đánh trượt 20% — Bão Cát đang dính thì lấy 40% (`skillRules.missChance`). */
	daze: number;
	/** Đang bị băng bọc khi có Vỡ Vụn (Băng 9) — frame thấy băng hết (tan, vỡ) thì nổ vụn băng. */
	iced: boolean;
	/** Kháng băng (giây, CHỈ boss — `skillRules.BOSS_FREEZE_IMMUNE`): băng vừa hết thì chưa đóng băng lại được. */
	freezeImmune: number;
	/** Băng đang bọc là do vụn băng đợt mấy gây ra (0 = đòn của người chơi) — tan thì vụn của nó là đợt kế (`PASSIVE.shardChain`). */
	iceDepth: number;
	/** Lửa đang cháy là của vụ nổ Tro Tàn đợt mấy (0 = lửa của người chơi) — chết lúc cháy thì nổ đợt kế (`PASSIVE.emberChain`). */
	emberDepth: number;
	/** Đang vòng qua tường tạm (đuổi người chơi mà tường chắn): tường, đầu tường đã chọn, giây bị kẹt (đụng tường bản đồ → đổi đầu). */
	route: { wall: WallSeg; dir: 1 | -1; stuck: number } | null;
	/** Bám bụi đất (giây) — đòn Thổ để lại, Thuỷ/Hoả/Phong vào sau ra phản ứng. */
	dust: number;
	/** Kiếm phủ Băng: số nhát liên tiếp đã trúng + lúc trúng gần nhất (giây trận) — đủ nhát thì đóng băng (`skillRules.frostStack`). */
	frostHits: { n: number; at: number };
	/** Cường độ cháy: 1 thường, 2 = Dung Nham (mỗi nhịp đốt gấp đôi). */
	burnPower: number;
	/** Bị đẩy: trượt theo vận tốc trong `t` giây (đi qua `mover` nên không xuyên tường). */
	push: { vx: number; vy: number; t: number } | null;
	flash: number;
	dead: boolean;
	deathT: number;
	respawnT: number;
	shownBar: number;
	attacks: number;
	aoeTimer: number;
	introduced: boolean;
}

type ShotKind = Element | 'arrow' | 'shadow';

interface Projectile {
	sprite: Sprite;
	glow: Sprite | null;
	frames: Texture[];
	ft: number;
	spin: number;
	x: number;
	y: number;
	vx: number;
	vy: number;
	life: number;
	team: 'player' | 'enemy';
	damage: number;
	element: ShotKind;
	pierce: boolean;
	/** Mục tiêu đã trúng (quái + hình nộm) — đạn xuyên không trúng lặp; Phi Kiếm làm mới khi quay về (mỗi chiều một lần). */
	hit: Set<object>;
	trail: Texture[];
	/** Chủ đạn đã chết: tan ở frame kế tiếp, không gây sát thương. */
	fizzle?: boolean;
	/** Khống chế khi trúng (Đá Văng đẩy lùi). */
	fx?: HitFx;
	/** Chỉ là hình (cầu Bộc Hoả bay tới điểm nổ): không va chạm, hết đường bay không nổ hiệu ứng trúng. */
	ghost?: boolean;
	/** Đạn quái bắn lúc dính Bão Cát mà trượt: chạm người chơi chỉ hiện "Trượt". */
	missed?: boolean;
	/** Độ cao bay so với mặt đất (px, đạn quái bắn từ ngực) — xét va tường theo CHÂN đường bay. */
	lift?: number;
	/** Kẻ bắn (đạn quái) — Gương Băng phản đạn bay về đúng nó. */
	owner?: Fighter | null;
	/** Nửa bề ngang trúng (px, đạn người chơi; thiếu = 20) — luồng kiếm (Lưỡi Sóng) rộng hơn mũi tên. */
	reach?: number;
	/** Cộng chí mạng khi trúng (nhát phản "đúng lúc" hất đạn ngược: chắc chắn chí mạng). */
	crit?: number;
	/** Phi Kiếm: hết tầm thì quay về tay người chơi ở tốc `speed`; `back` = đang bay về. */
	boomerang?: { back: boolean; speed: number };
	/** Đạn KIẾM (Lưỡi Sóng, Phi Kiếm, đạn gạt ngược): trúng lần đầu thì tính một nhát cho Thế Áp Đảo. */
	press?: boolean;
}

/**
 * Khống chế lên mục tiêu: của kỹ năng (`SkillHitFx` — kể cả phá giáp / vỡ giáp) + của phủ phép (`swingFx`: Thổ phá giáp /
 * choáng, Thuỷ hút máu, Phong đẩy lùi, và hai trường chỉ phủ phép có):
 * - `blast`: số thứ tự nhát chém được nổ (phủ Hoả mốc 7) — nổ một lần ở mục tiêu ĐẦU TIÊN trúng nhát đó (`blastArmed`).
 * - `frost`: số nhát liên tiếp cần để đóng băng (phủ Băng) — đếm trên từng mục tiêu (`Fighter.frostHits`).
 */
export type HitFx = SkillHitFx & { blast?: number; frost?: number };

/** Vùng tồn tại (Lốc Xoáy, Băng Địa): nhịp sát thương đếm bằng SỐ nhịp — không lệch vì cộng dồn số thực. */
interface Zone {
	skill: SkillDef;
	x: number;
	y: number;
	r: number;
	left: number;
	tickLeft: number;
	ticks: number;
	damage: number;
	pull: number;
	fx: HitFx | undefined;
	/** Bám theo người chơi (Phong Kiếm Cuồng Vũ) + góc xoay của vệt chém mỗi nhịp. */
	follow: boolean;
	spin: number;
	/** Vùng đi theo hướng nhắm (Vòi Rồng): vận tốc px/giây. */
	vx: number;
	vy: number;
	/** Mưa (Gọi Mưa): mỗi nhịp làm ướt, không sát thương. Sét (Lôi Vũ): mỗi nhịp sét đánh quái ướt. */
	rain: boolean;
	bolts: boolean;
	/** Lôi Vũ: số tia đã đánh từng mục tiêu — nhịp sau ưu tiên con ít bị đánh (sét rải khắp bầy ướt). */
	struck: Map<object, number>;
}

/**
 * Tường tạm (Tường Lửa, Tường Đá): chặn quái đi (`wallClip`; quái đang đuổi thì vòng qua đầu tường — `wallRoute`) + chặn đạn
 * quái (`wallBetween`); Tường Lửa đốt mỗi nhịp. KHÔNG chặn người chơi và đòn của người chơi — cố ý: tường là công cụ câu giờ
 * (quái phải đi vòng), không phải lô cốt để đứng sau bắn mãi.
 */
interface Wall extends WallSeg {
	skill: SkillDef;
	left: number;
	tickLeft: number;
	/** Sát thương mỗi nhịp đốt (Tường Lửa) — đã nhân hệ số lúc dựng. */
	damage: number;
	fx: HitFx | undefined;
}

/**
 * Khiên phản đạn: đạn quái tới gần trong `radius` (tính từ ngực) bị phản về kẻ bắn thành đạn `damage` hệ `element`.
 * Gương Băng (phép, mũi băng). `sword`: Dòng Chảy Ngược (Thủy Thần 6) — vung kiếm gạt đạn, tính là phản đòn (Mặt Hồ Phẳng,
 * Xoáy Nước), hệ = hệ đang phủ lên kiếm.
 */
export interface Ward {
	skillId: string;
	t: number;
	total: number;
	damage: number;
	radius: number;
	element: Element;
	sword: boolean;
}

/** Thế đỡ đang giữ (Thủy Thần): Thế Tĩnh / Lưu Thủy Phản — luật chặn / phản / giảm ở `skillRules.guardOutcome`. */
export interface Guard {
	kind: GuardKind;
	skillId: string;
	/** Giây còn lại / tổng (Lưu Thủy Phản: cửa sổ đỡ). */
	t: number;
	total: number;
	/** Sát thương nhát phản (đã nhân hệ số lúc vào thế) + hệ của nó (thép, hoặc hệ đang phủ lên kiếm). */
	damage: number;
	element: Element;
	/** Số đòn đã chặn / phản trong thế này. */
	blocks: number;
}

/** Đang dồn lực (Nhất Kích): hết giờ thì vào động tác như vừa bấm. Huỷ được (né, bị ngắt) — hoàn MP + hồi chiêu. */
interface Charging {
	t: number;
	skill: SkillDef;
	prevCooldown: number;
	mpPaid: number;
	begin: () => void;
}

interface Telegraph {
	ring: Sprite;
	g: Graphics;
	x: number;
	y: number;
	r: number;
	t: number;
	total: number;
	damage: number;
}

interface FloatText {
	text: Text;
	wx: number;
	wy: number;
	life: number;
	vy: number;
}

/** Kết quả một lần bấm kỹ năng (hook QA đọc được vì sao đòn không ra). */
export type CastResult = 'started' | 'buffered' | 'busy' | 'locked' | 'cooldown' | 'mp' | 'dead' | 'none';

/**
 * Đòn đang diễn: vào thế (khoá hướng, bước chậm lại) → khung chạm `releaseAt` (áp hiệu ứng) → thu thế (di chuyển,
 * né hoặc đòn kế cắt ngang được từ `cancelAt`). Cùng khuôn với `Fighter.windup` của quái.
 */
export interface PlayerAction {
	skill: SkillDef;
	index: number;
	/** Hướng ngắm đã khoá lúc bấm (vector đơn vị). */
	dx: number;
	dy: number;
	/** Điểm nhắm lúc bấm (toạ độ thế giới) — đòn vùng nhắm đặt ở đây, kẹp lại theo tầm lúc khung chạm. */
	tx: number;
	ty: number;
	dir: Direction;
	t: number;
	timing: ActionTiming;
	released: boolean;
	/** Để hoàn lại khi đòn bị huỷ TRƯỚC khung chạm. */
	prevCooldown: number;
	mpPaid: number;
}

/** Lệnh bấm trong lúc đang ra đòn/lăn né: chờ tối đa chừng này giây rồi tự tung (một lệnh, lệnh mới đè lệnh cũ). */
const BUFFER_TTL = 0.3;
/**
 * Giữ phím đánh liên tục: động tác xong sớm hơn hồi chiêu một chút (COOLDOWN_GAP + lượng tử frame) → đứng ở
 * frame cuối chờ đòn kế thay vì bật về dáng nền 1–2 frame (nháy chém → đứng → chém).
 */
const HOLD_LINGER = 0.08;
/** Phía tây là bản lật gương của phía đông: vệt chém lật theo. N/S/đông giữ một chiều cố định. */
const MIRRORED_DIRS: ReadonlySet<Direction> = new Set<Direction>(['W', 'SW', 'NW']);

export interface PlayerCombat {
	level: number;
	exp: number;
	hp: number;
	hpMax: number;
	mp: number;
	mpMax: number;
	stamina: number;
	staminaMax: number;
	atk: number;
	def: number;
	coins: number;
	potions: number;
	iframes: number;
	/**
	 * `element`: hệ của cú lướt chém (kiếm phủ nguyên tố); thiếu = thép. Lăn né có damage 0, không dùng tới. Lướt chém quái
	 * đi qua (Lướt Chém): `reach` = tầm chém quanh người khi lướt, `crit` cộng chí mạng, `fx` khống chế, `skillId` để phát hình.
	 */
	dash: {
		vx: number;
		vy: number;
		t: number;
		damage: number;
		hit: Set<object>;
		element?: Element;
		trail?: DashTrail;
		reach?: number;
		crit?: number;
		fx?: HitFx;
		skillId?: string;
	} | null;
	/** Thế đỡ đang giữ (Thủy Thần) — đứng im, né / bấm đòn khác thì thôi. */
	guard: Guard | null;
	/** Đang dồn lực trước khi vào động tác (Nhất Kích) — đứng im. */
	charging: Charging | null;
	/** Khiên phản đạn đang bật (Gương Băng). */
	ward: Ward | null;
	cooldowns: Map<string, number>;
	dead: boolean;
	respawnT: number;
	lastHurt: number;
	action: PlayerAction | null;
	buffered: { index: number; aim: { x: number; y: number }; ttl: number } | null;
	/** Bấm né đúng lúc khung chạm đang hiện: lăn ngay khi qua `cancelAt` (≤ 1 frame động tác). */
	pendingDodge: { x: number; y: number } | null;
}

/** Lướt Gió: vệt gió dọc đường lướt — lướt xong mới chém (từ điểm xuất phát tới điểm dừng THẬT, đụng tường thì ngắn lại). */
export interface DashTrail {
	skillId: string;
	fromX: number;
	fromY: number;
	damage: number;
	element: Element;
	half: number;
	fx: HitFx | undefined;
	/** Giây tới lần rắc hạt gió kế. */
	spark: number;
	/** Cộng chí mạng cho vệt chém (Đột Kích). */
	crit: number;
	/** Lướt Gió: rắc hạt gió + vòng gió dọc đường; lướt kiếm (Đột Kích): bụi + bóng mờ. */
	windy: boolean;
}

export interface CombatHooks {
	mover: Mover;
	shake(strength: number, seconds: number): void;
	toast(text: string, tone: 'info' | 'exp' | 'loot' | 'level' | 'warn'): void;
	enemyKilled(f: Fighter): void;
	/** Boss vừa thấy người chơi. true = thoại giới thiệu THẬT SỰ hiện (khi đó boss mới dời nhịp đánh để người chơi đọc). */
	bossNear(f: Fighter): boolean;
	playerRespawn(): { x: number; y: number };
	isUnlocked(skill: string): boolean;
	/** Trúng hình nộm tập (nhiệm vụ "practice"); `reaction` = phản ứng nguyên tố vừa tạo ra, nếu có. */
	practiceHit?(element: Element, reaction: ReactionId | null): void;
	/** Vừa tung đòn có động tác — Game gửi cho người chơi khác (máy họ tự quyết có hình để phát hay không). */
	onAction?(anim: ActionName, dir: Direction, skill: string): void;
	/** Động tác bị cắt TRƯỚC khi diễn hết (né, đi, bị ngắt): máy người khác dừng hình theo. */
	onActionEnd?(): void;
	/** Vừa lên cấp (gọi từng cấp một nếu lên nhiều cấp liền). Có hook thì Game tự báo — CombatSystem không toast nữa. */
	levelUp?(level: number): void;
	/** Quái dùng chung trúng đòn của MÁY NÀY (sát thương đã tính) — báo máy chủ trừ máu. */
	netHit?(f: Fighter, amount: number): void;
	/** Quái dùng chung vừa lao vào người chơi máy này — xin làm chủ. */
	netAggro?(f: Fighter): void;
	/** Quái dùng chung MÁY NÀY làm chủ vừa lấy đà / đánh / gọi vùng nổ — gửi máy khác (họ tự xét có trúng mình không). */
	netAct?(f: Fighter, act: MobAct): void;
	/** Khống chế trên quái dùng chung vừa tăng ở máy này — gửi chủ quái (AI) + máy khác (màu, phá giáp). */
	netCc?(f: Fighter, cc: MobCc): void;
	/** Vị trí người chơi khác cùng map (boss dùng chung nhắm vùng nổ vào bất kỳ ai, không chỉ người làm chủ nó). */
	others?(): readonly { x: number; y: number }[];
}

interface Dummy {
	x: number;
	y: number;
	flash: number;
	burn: number;
	wet: number;
	chill: number;
	frost: number;
	freeze: number;
	dust: number;
	slow: number;
	armor: number;
	sunder: number;
	miss: number;
	daze: number;
}

/**
 * Trạng thái nguyên tố trên mục tiêu (quái hay hình nộm). `boss`: khống chế (đóng băng, chậm nặng) chỉ nửa thời gian.
 * Trường thêm từ GĐ2 để tuỳ chọn — mục tiêu cũ/giả trong test không có vẫn chạy.
 */
interface Status {
	burn: number;
	wet: number;
	chill: number;
	freeze: number;
	frost?: number;
	boss?: boolean;
	dust?: number;
	slow?: number;
	slowMult?: number;
	armor?: number;
	sunder?: number;
	miss?: number;
	burnPower?: number;
	stun?: number;
	daze?: number;
	freezeImmune?: number;
	iceDepth?: number;
	emberDepth?: number;
}

const REACTION_COLOR: Record<ReactionId, number> = {
	steam: 0xdfe8ef,
	burst: 0xffa23d,
	chill: 0x9fe6ff,
	freeze: 0xd2f6ff,
	melt: 0xffc59a,
	mud: 0xc49a62,
	lava: 0xff7a3a,
	sandstorm: 0xf0d28a,
	shatter: 0xe6fbff,
};
/** Mã phản ứng: khai ở `skillRules` (luật thuần, máy chủ dùng chung) — giữ export ở đây cho chỗ import cũ. */
export type { ReactionId };
/** Phản ứng vừa ăn: chữ + màu, hình = hiệu ứng atlas (`vfx`) hoặc hình tạm (`art`, khoá `TEMP_ART`). */
type ReactionHit = { id: ReactionId; name: string; color: number; vfx?: VfxId; art?: string };
const ELEMENT_TINT: Record<Element, number> = { aether: 0xc9b6ff, fire: 0xffb35c, water: 0x8fd3ff, wind: 0xbaf5cf, healing: 0x9fffb0, steel: 0xffffff, ice: 0xc4f1ff, earth: 0xd9b47a };
const SHOT_VFX: Partial<Record<ShotKind, VfxId>> = { fire: 'fire_orb', water: 'water_wave', wind: 'wind_spin', aether: 'arcane_orb', ice: 'ice_shard', shadow: 'dark_orb' };
const IMPACT_VFX: Record<ShotKind, VfxId> = {
	fire: 'fire_burst',
	water: 'water_splash',
	wind: 'wind_burst',
	aether: 'arcane_burst',
	ice: 'ice_burst',
	steel: 'blood_hit',
	healing: 'sparkle',
	arrow: 'dust',
	shadow: 'shadow',
	// Thổ: thật ra phát hình tạm `TEMP_ART.earth_hit` (dust nhuộm nâu) — xem `impact()`.
	earth: 'dust',
};
const GLOWS = new Set<ShotKind>(['fire', 'aether', 'shadow', 'water', 'ice']);
/** Đạn vẽ "mũi hướng sang phải": xoay theo hướng bay. Còn lại (cầu lửa, cầu phép, lốc gió) tròn nên không xoay. */
const AIMED_SHOTS = new Set<ShotKind>(['water', 'arrow', 'ice']);
/** Đóng băng khi Băng trúng mục tiêu ướt (giây); boss chỉ bị một nửa — không để trận boss thành đứng chém bao cát. */
const FREEZE_SECONDS = 1.6;
const CRIT_CHANCE = 0.1;
const CRIT_MULT = 1.75;
/** Thời gian trạng thái gốc (giây) và hồi MP gốc (mỗi giây) — bị động mốc 2/4 nhân lên (`talents.PASSIVE`). */
const BURN_SECONDS = 3;
const WET_SECONDS = 4;
const CHILL_SECONDS = 2.5;
const MP_REGEN = 3.2;
/** Phủ phép Kiếm → hệ của nhát chém. */
const ENCHANT_ELEMENT: Record<EnchantId, Element> = { fire: 'fire', water: 'water', wind: 'wind', ice: 'ice', earth: 'earth' };
/** Đẩy lùi: trượt hết quãng trong chừng này giây. */
const PUSH_SECONDS = 0.16;
/** Vùng nổ của boss: bán kính, giây báo trước, hệ số sức đánh, tầm nhắm. */
const BOSS_AOE = { r: 84, seconds: 1.1, power: 1.8, range: 360 } as const;
/** Nhát chém nhắm người KHÁC (quái dùng chung): người chơi máy này phải đứng trong nón ±72° phía trước quái mới trúng. */
const MELEE_CONE_COS = 0.3;
/** Khống chế chỉ gửi khi dài hơn mức máy khác đã biết chừng này giây (tránh gửi vụn mỗi frame). */
const CC_SYNC_EPS = 0.05;
/** Bề ngang thân khi xét trúng vùng (px): quái thường / boss. */
const BODY_PAD = 14;
const BOSS_PAD = 24;
/** Thể lực mỗi lần lăn né (Nhẹ Như Gió nhân `PassiveEffects.dodgeCost`). */
const DODGE_STAMINA = 25;
/** Ảnh Bộ: đứng sau lưng mục tiêu chừng này px (boss to hơn: thêm 10). */
const BLINK_BEHIND = 34;
/** Lướt chém quái đi qua: tầm chém quanh người khi kỹ năng không ghi `width`. */
const DASH_REACH = 46;
/** Lăn né kéo dài chừng này giây (Mắt Bão: tăng tốc tính từ lúc lăn xong). */
const DODGE_TIME = 0.17;
/** Tường: nửa bề dày (px), dải đốt thêm ngoài mép (Tường Lửa — quái bị tường chặn đứng sát mép vẫn trong dải), bước đặt hình. */
const WALL_HALF = 10;
const WALL_BURN = 10;
const WALL_STEP = 26;
/** Mưa nhiều điểm / thiên thạch: vật rơi bắt đầu cao chừng này px trên điểm rơi. */
const FALL_HEIGHT = 150;
/** Đạn phản (Gương Băng, Dòng Chảy Ngược) bay tốc này. */
const REFLECT_SPEED = 440;
/** Phi Kiếm: bay về tối đa chừng này giây (người chơi chạy xa quá thì kiếm tan), tới gần tay chừng này px là bắt được. */
const BOOMERANG_BACK = 2.5;
const BOOMERANG_CATCH = 24;
/** Xoáy Nước tung ngay sau khi đỡ đòn: đẩy lùi xa hơn chừng này lần. */
const SURGE_KNOCK = 1.5;

/** Động tác nhanh hơn `k` lần (Đà Lướt): cả ba mốc + tốc khung co cùng hệ số — khung chạm vẫn khớp đúng frame. */
function quicken(t: ActionTiming, k: number): ActionTiming {
	return { ...t, fps: t.fps * k, releaseAt: t.releaseAt / k, cancelAt: t.cancelAt / k, dur: t.dur / k };
}

/** Một lớp hình (tạm hoặc PixelLab) → tuỳ chọn `Vfx.play`. `aim`: góc hướng đòn. */
function layerOptions(l: Omit<ArtLayer, 'id'>, aim: number): VfxOptions {
	return { tint: l.tint, scale: l.scale, scaleX: l.scaleX, scaleY: l.scaleY, rotation: (l.aim ? aim : 0) + (l.rot ?? 0), blend: l.blend, layer: l.layer, fps: l.fps, alpha: l.alpha, stay: l.stay };
}

/**
 * Gộp khống chế của kỹ năng với khống chế của phủ phép (nhát chém Thổ: phá giáp / choáng): trường nào cả hai cùng có thì lấy
 * số LỚN hơn (thời lượng, quãng đẩy) — phủ phép chỉ được cộng thêm, không được làm ngắn đi (Phá Giáp 6s + phủ Thổ 4s vẫn 6s).
 */
function mergeFx(a: HitFx | undefined, b: HitFx | undefined): HitFx | undefined {
	if (!a || !b) return a ?? b;
	const out: Record<string, number | undefined> = { ...a };
	for (const [k, v] of Object.entries(b) as [string, number | undefined][]) {
		const cur = out[k];
		out[k] = typeof cur === 'number' && typeof v === 'number' ? Math.max(cur, v) : (v ?? cur);
	}
	return out as HitFx;
}

/**
 * Chiến đấu thời gian thực của vertical slice (chạy ở client). Phase 11: server authoritative —
 * client chỉ gửi "dùng kỹ năng X hướng Y", server tính trúng/sát thương; lớp này khi đó chỉ còn
 * phần hiển thị (đạn, hiệu ứng, số sát thương) và dự đoán phía client.
 */
/** Tâm cột sáng (hồi máu, lên cấp) ở khoảng 62% chiều cao nhân vật. */
function pillar(a: Actor): number {
	return Math.round(a.height * 0.62);
}

export class CombatSystem {
	readonly fxLayer = new Container({ sortableChildren: true });
	readonly groundFx = new Container();
	readonly screenLayer = new Container();
	readonly particles = new Particles();
	readonly enemies: Fighter[] = [];
	player!: Actor;
	pc: PlayerCombat;
	skills: SkillDef[] = HERO_SKILLS;
	/** Con đường chọn năm 16 tuổi; null = tuổi thơ, cân bằng kiếm/phép. */
	path: HeroPath | null = null;
	/** Mốc tiềm năng từng nhánh (Game đẩy vào qua `setTalents`) + bị động đọc sẵn — không tính lại mỗi đòn. */
	private tiers: Tiers = {};
	/** Lưu phái Kiếm đã chọn (null = chưa tới mốc 3) — quyết kỹ năng lưu phái + bị động mốc 4. */
	private style: SwordStyle | null = null;
	private fx: PassiveEffects = passiveEffects({});
	/** Chỉ số cộng phẳng từ trang bị đang mặc (Game đẩy vào qua `setGear`); toàn 0 = y như trước khi có trang bị. */
	private gear: Record<StatKey, number> = { atk: 0, mag: 0, def: 0, hp: 0, mp: 0, crit: 0, move: 0 };
	/** Tâm Tĩnh: người chơi đứng yên được bao lâu (giây) + vị trí frame trước để biết có nhích không. */
	private stillT = 0;
	private readonly lastPos = { x: Infinity, y: Infinity };
	/** Phủ phép Kiếm đang CHỌN (có thể chưa đủ điều kiện — khi đó không có tác dụng) + mốc đổi được lần kế (giây trận). */
	private enchantPick: EnchantId | null = null;
	private enchantReadyAt = 0;
	/** Đồng hồ chiến đấu (giây) — mốc của mọi cooldown. */
	time = 0;
	/** Giây còn lại của hit-stop: Game làm chậm thế giới trong khoảng này cho đòn đánh có "lực". */
	hitStop = 0;
	/** Loé màn hình: màu + cường độ, Game vẽ lớp phủ. */
	screenFlash = { color: 0xffffff, alpha: 0 };
	/** Vị trí kỹ năng (index) đang GIỮ phím — Game cập nhật mỗi frame; đòn của phím đang giữ đứng chờ ở frame cuối. */
	readonly heldSkills = new Set<number>();
	private readonly tex: FxTextures = fxTextures();
	private readonly projectiles: Projectile[] = [];
	private readonly spritePool: Sprite[] = [];
	private readonly telegraphs: Telegraph[] = [];
	private readonly floats: FloatText[] = [];
	private readonly floatPool: Text[] = [];
	private readonly bars = new Graphics();
	private swing = 1;
	private readonly dummies: Dummy[] = [];
	/** Vùng đang tồn tại (Lốc Xoáy, Băng Địa, Gọi Mưa, Lôi Vũ, Vòi Rồng…). */
	private readonly zones: Zone[] = [];
	/** Tường đang đứng (Tường Lửa, Tường Đá). */
	private readonly walls: Wall[] = [];
	/** Mắt Bão: giây còn lại của lượt tăng tốc sau khi né. */
	private hasteT = 0;
	/** Đồng hồ hồi phục mỗi giây của bị động (Mạch Nguồn, Núi Thiêng). */
	private regenT = 0;
	/**
	 * Tro Tàn: độ sâu dây chuyền của vụ nổ ĐANG chạy (0 = không trong vụ nổ nào) — lửa nó đốt lên quái mang độ sâu này
	 * (`Fighter.emberDepth`), quái đó chết lúc cháy (kể cả vì nhịp cháy ở frame SAU) thì nổ đợt kế; quá `PASSIVE.emberChain` thì thôi.
	 */
	private emberChain = 0;
	/** Vỡ Vụn: đợt của vụ nổ vụn băng ĐANG chạy (0 = không) — băng nó gây mang đợt này (`Fighter.iceDepth`). */
	private shardDepth = 0;
	/** Mặt Hồ Phẳng: lần hồi gần nhất (giây trận) — cách nhau ít nhất `PASSIVE.lakeCooldown`. */
	private lakeAt = -99;
	/** Đòn hẹn giờ: vùng rơi xuống / cột trồi lên / gai trồi nối đuôi / vệt gió sau khi lướt. Chạy theo đồng hồ trận. */
	private readonly pending: { t: number; run: () => void }[] = [];
	/**
	 * Đếm nhát chém liên tiếp có phủ phép (Thổ: nhát thứ 3 choáng; Hoả mốc 7: nhát thứ 3 nổ) — quá `EARTH_ENCHANT.comboReset`
	 * giây không chém thì về 0. `seq` tăng mãi (không về 0): định danh nhát cho `HitFx.blast`.
	 */
	private combo = { n: 0, at: -99, seq: 0 };
	/** Nhát (`combo.seq`) đang chờ nổ của phủ Hoả — mục tiêu đầu tiên trúng nhát đó nổ rồi về 0 (nhát trượt hết thì bỏ). */
	private blastArmed = 0;
	// ——— GĐ3 lượt B: bị động lưu phái Kiếm mốc 7 / 9 ———
	/** Thế Áp Đảo: số nhát Kiếm trúng liên tiếp + lúc trúng gần nhất (giây trận). */
	private readonly press = { n: 0, at: -99 };
	/** Đà Lướt: số đòn Kiếm nhanh còn lại sau lần né gần nhất + hạn dùng (giây trận). */
	private momentum = { n: 0, until: -99 };
	/** Lần bấm né gần nhất (giây trận) + chỗ đứng lúc bấm — Phản Đòn xét "né đúng lúc" (`skillRules.COUNTER.perfect`). */
	private dodgeAt = -99;
	private readonly dodgeFrom = { x: 0, y: 0 };
	/** Lần đỡ / gạt / phản thành công gần nhất — Xoáy Nước mạnh hơn trong `COUNTER.after` giây sau đó (tung xong thì dùng hết). */
	private guardAt = -99;
	/** Bất Khuất frame trước có bật không — báo chữ một lần lúc vừa tụt dưới ngưỡng. */
	private rageOn = false;

	constructor(
		private readonly hooks: CombatHooks,
		saved: { level: number; exp: number; coins: number; potions: number },
		private readonly vfx: Vfx,
	) {
		const start = cleanLevel(saved.level, saved.exp, MAX_LEVEL);
		this.pc = {
			level: start.level,
			exp: start.exp,
			hp: 0,
			hpMax: 0,
			mp: 0,
			mpMax: 0,
			stamina: 100,
			staminaMax: 100,
			atk: 0,
			def: 0,
			coins: saved.coins,
			potions: saved.potions,
			iframes: 0,
			dash: null,
			cooldowns: new Map(),
			dead: false,
			respawnT: 0,
			lastHurt: -99,
			action: null,
			buffered: null,
			pendingDodge: null,
			guard: null,
			charging: null,
			ward: null,
		};
		this.applyLevel(true);
		this.groundFx.addChild(vfx.ground);
		this.fxLayer.addChild(this.particles.layer, vfx.top);
		this.screenLayer.addChild(this.bars);
	}

	setPlayer(actor: Actor): void {
		// Đổi sprite/lớn lên giữa đòn: huỷ trên actor CŨ (hoàn MP/hồi chiêu) trước khi gán actor mới.
		if (this.player) this.cancelAction(true);
		this.player = actor;
		this.applyLevel(false);
	}

	setPath(path: HeroPath | null): void {
		this.path = path;
		this.applyLevel(false);
	}

	/**
	 * Mốc tiềm năng mới (cộng/tẩy điểm, mở nhánh, đổi tuổi) + lưu phái Kiếm: chép lại để bản của Game sửa sau không lọt
	 * vào đây.
	 */
	setTalents(tiers: Tiers, style: SwordStyle | null = null): void {
		this.tiers = { ...tiers };
		this.style = style;
		const hpBefore = this.fx.hpMax;
		this.fx = passiveEffects(this.tiers, style);
		// Núi Thiêng (Thổ 9) đổi máu tối đa: tính lại ngay để HUD / bảng Nhân vật đọc đúng (không hồi đầy máu).
		if (this.fx.hpMax !== hpBefore) this.applyLevel(false);
	}

	/**
	 * Chỉ số trang bị đang mặc (mặc/tháo, nạp game): cộng phẳng TRƯỚC hệ số con đường và bị động — `atk` vào đòn Kiếm, `mag`
	 * vào đòn phép, `def`/`hp`/`mp` vào chỉ số gốc, `crit`/`move` theo điểm %. Không hồi máu (tháo đồ máu thì kẹp xuống).
	 */
	setGear(b: Partial<Record<StatKey, number>>): void {
		const g = this.gear;
		for (const k of Object.keys(g) as StatKey[]) g[k] = Number(b[k]) || 0;
		this.applyLevel(false);
	}

	/** Sức đánh gốc cho đòn Kiếm / đòn phép (ATK theo cấp + phần cộng của trang bị) — CHƯA nhân hệ số con đường. */
	private swordAtk(): number {
		return this.pc.atk + this.gear.atk;
	}

	private magicAtk(): number {
		return this.pc.atk + this.gear.mag;
	}

	/**
	 * Cách đổi chỉ số trang bị ra số trên bảng (`equipment.shownStat`): bảng Nhân vật / Kho đồ tính được "+N trang bị" và
	 * "27 → 33" khi so món mới — cùng công thức với `sheet`, không đoán.
	 */
	get gearBasis(): StatBasis {
		const p = PATHS[this.path ?? 'none'];
		const pc = this.pc;
		const k = this.rageMult();
		const lv = pc.level - 1;
		return {
			base: { atk: pc.atk, mag: pc.atk, def: pc.def - this.gear.def, hp: p.hp[0] + lv * p.hp[1], mp: p.mp[0] + lv * p.mp[1], crit: (CRIT_CHANCE + this.fx.crit) * 100, move: 0 },
			scale: { atk: p.sword * k, mag: p.magic * k, def: this.fx.defense, hp: this.fx.hpMax, mp: 1, crit: 1, move: 1 },
		};
	}

	/**
	 * Đầy máu + MP. Game gọi MỘT lần lúc vào game, SAU khi đã đặt con đường + mốc tiềm năng: bản lưu không cất máu, mà
	 * `setPath` / `setTalents` (Núi Thiêng) chỉ nâng máu tối đa chứ không hồi (đúng ý khi cộng mốc giữa trận) — gọi thiếu thì
	 * mỗi lần vào game là thiếu máu (vd 171/197).
	 */
	refill(): void {
		this.pc.hp = this.pc.hpMax;
		this.pc.mp = this.pc.mpMax;
	}

	/**
	 * Dời quái / NPC đang đi LANG THANG (`Actor.think`, chưa giao chiến): qua tường tạm trước rồi mới qua tường bản đồ — Game
	 * truyền cho `Actor.update` thay `mover` trần, để quái chưa giao chiến cũng không đi xuyên Tường Đá / Tường Lửa.
	 */
	readonly wanderMover: Mover = (pos, dx, dy) => {
		if (this.walls.length) {
			const f = this.enemies.find((e) => e.actor === pos);
			({ dx, dy } = wallClip(pos.x, pos.y, dx, dy, this.walls, f?.boss ? BOSS_PAD : BODY_PAD));
		}
		this.hooks.mover(pos, dx, dy);
	};

	/** Đã học kỹ năng chưa (mã cốt truyện + mốc nhánh + lưu phái) — `cast` chặn, HUD vẽ ổ khoá. */
	knows(skill: SkillDef): boolean {
		return knowsSkill(skill, this.tiers, (u) => this.hooks.isUnlocked(u), this.style);
	}

	/** Đang giữ thế / dồn lực: Game không cho đi (né thì vẫn được — né là lối thoát). */
	get rooted(): boolean {
		return !!this.pc.guard || !!this.pc.charging;
	}

	/** Thể lực mỗi lần né (Nhẹ Như Gió giảm). */
	get dodgeStamina(): number {
		return DODGE_STAMINA * this.fx.dodgeCost;
	}

	/** Hệ số tiềm năng đang áp cho kỹ năng (thưởng chiều sâu của nhánh; Tia Aether theo cấp) — HUD hiện, `release` nhân vào. */
	skillScaleOf(skill: SkillDef): number {
		return skillScale(this.tiers, skill.id, this.pc.level);
	}

	/**
	 * Hồi chiêu thật của kỹ năng sau bị động (Nhịp Chém cho đòn Kiếm, Thuận Gió cho mọi đòn; Đà Lướt — vừa né xong — cho vài
	 * đòn Kiếm kế, HUD thấy hồi chiêu ngắn lại đúng lúc đó).
	 */
	cooldownOf(skill: SkillDef): number {
		return skill.cooldown * (isSwordSkill(skill) ? this.fx.swordCooldown : 1) * this.fx.cooldown * (this.momentumLive(skill) ? 1 / PASSIVE.momentumSpeed : 1);
	}

	/** Đà Lướt (Bắc Thần 7) còn áp cho đòn Kiếm này không: còn lượt và chưa quá hạn sau cú né. */
	private momentumLive(skill: SkillDef): boolean {
		return this.fx.momentum && isSwordSkill(skill) && this.momentum.n > 0 && this.time <= this.momentum.until;
	}

	/** Bất Khuất (Kiếm Thần 9): đang dưới ngưỡng máu. */
	private get rageLive(): boolean {
		return this.fx.rage && lowHp(this.pc.hp, this.pc.hpMax, PASSIVE.rageHp);
	}

	/** Hệ số công của Bất Khuất (1 = không bật). */
	private rageMult(): number {
		return this.rageLive ? PASSIVE.rageAtk : 1;
	}

	/** Thế Áp Đảo (Kiếm Thần 7): số nhát Kiếm trúng liên tiếp đang tính (quá `pressWindow` giây không trúng thì về 0). */
	get pressStacks(): number {
		if (this.time - this.press.at > PASSIVE.pressWindow) this.press.n = 0;
		return this.fx.press ? this.press.n : 0;
	}

	/** Hệ số Thế Áp Đảo cho đòn `skill` (chỉ đòn Kiếm). */
	private pressMult(skill: SkillDef): number {
		return this.fx.press && isSwordSkill(skill) ? pressBonus(this.pressStacks, PASSIVE.pressStep, PASSIVE.pressMax) : 1;
	}

	/**
	 * Một nhát Kiếm vừa xong, trúng `hits` mục tiêu: có trúng → +1 lần (kẹp `pressMax`), hụt hẳn → về 0. Gọi ở mọi nhát chém
	 * (chém, chuỗi chém, xoay chém, vệt lướt chém, nhát phản) và lần trúng đầu của đạn kiếm.
	 */
	private pressLanded(hits: number): void {
		if (!this.fx.press) return;
		const pr = this.press;
		if (hits <= 0) {
			pr.n = 0;
			return;
		}
		const before = this.pressStacks;
		pr.n = Math.min(PASSIVE.pressMax, before + 1);
		pr.at = this.time;
		if (pr.n === PASSIVE.pressMax && before < pr.n && this.player) {
			const p = this.player;
			this.float(p.x, p.y - p.height - 22, 'Áp Đảo!', 0xffe28a, 13);
			this.playArt('press_max', p.x, p.y, 1, 0, undefined, { follow: p });
		}
	}

	/** Hệ đang phủ lên kiếm (undefined = thép) — nhát phản của cú né đúng lúc mang hệ này. */
	private enchantElement(): Element | undefined {
		const e = this.enchantment;
		return e ? ENCHANT_ELEMENT[e] : undefined;
	}

	/** Sát thương một đòn Kiếm không qua kỹ năng (nhát phản của cú né đúng lúc): ATK × uy lực × sức kiếm × thưởng chiều sâu Kiếm. */
	private swordDamage(power: number): number {
		return this.swordAtk() * power * PATHS[this.path ?? 'none'].sword * depthBonus(this.tiers.sword ?? 1) * this.rageMult();
	}

	/** Nhân tốc chạy/đi của người chơi (Thuận Gió, Nhẹ Như Gió; Mắt Bão vừa né xong) — Game đọc khi dời nhân vật. */
	get moveScale(): number {
		return this.fx.moveSpeed * (1 + this.gear.move / 100) * (this.hasteT > 0 ? this.fx.dodgeHaste : 1);
	}

	/** Kháng cháy (Hoả Thân, Hoả 9) — CHỈ LÀ CỜ: quái hiện chưa có đòn đốt người chơi; đòn gây cháy về sau đọc cờ này. */
	get fireResist(): boolean {
		return this.fx.fireResist;
	}

	/**
	 * Bảng chỉ số cho HUD: sức đánh kiếm / phép đã nhân hệ số con đường (chưa nhân mốc nhánh của từng kỹ năng) — Bất Khuất đang
	 * bật thì đã nhân công +20% (`rage`). `evade`: Bóng Mờ, tỉ lệ né hoàn toàn.
	 */
	get sheet(): { attack: number; magic: number; defense: number; critChance: number; critMult: number; evade: number; rage: boolean } {
		const p = PATHS[this.path ?? 'none'];
		const pc = this.pc;
		const k = this.rageMult();
		return {
			attack: Math.round(this.swordAtk() * p.sword * k),
			magic: Math.round(this.magicAtk() * p.magic * k),
			defense: Math.round(pc.def * this.fx.defense),
			critChance: CRIT_CHANCE + this.fx.crit + this.gear.crit / 100,
			critMult: CRIT_MULT,
			evade: this.fx.evade,
			rage: k > 1,
		};
	}

	/** Phủ phép đang CÓ TÁC DỤNG (đã chọn và còn đủ điều kiện), null = kiếm thép. */
	get enchantment(): EnchantId | null {
		const e = this.enchantPick;
		return e && canEnchant(this.tiers, e) ? e : null;
	}

	/** Giây còn lại tới lúc đổi phủ phép được (0 = đổi được ngay). */
	get enchantCooldown(): number {
		return Math.max(0, this.enchantReadyAt - this.time);
	}

	/**
	 * Chọn phủ phép (null = tắt). Mỗi lần ĐỔI bắt đầu hồi 10 giây; tắt thì luôn được (vẫn tính hồi — không tắt rồi bật
	 * hệ khác ngay). `locked`: chưa đủ Kiếm mốc 2 + nguyên tố mốc 5.
	 */
	setEnchant(e: EnchantId | null): 'ok' | 'same' | 'locked' | 'cooldown' {
		if (e === this.enchantment) return 'same';
		if (e !== null && !canEnchant(this.tiers, e)) return 'locked';
		if (e !== null && this.enchantCooldown > 0) return 'cooldown';
		this.enchantPick = e;
		this.enchantReadyAt = this.time + ENCHANT_SWAP_SECONDS;
		return 'ok';
	}

	/** Nạp phủ phép từ bản lưu: không tính hồi. */
	restoreEnchant(e: EnchantId | null): void {
		this.enchantPick = e;
	}

	/**
	 * Kiếm phủ phép: đòn kiếm mang hệ đó lên QUÁI — phản ứng, hiệu ứng trúng, màu vệt chém.
	 * undefined = đòn giữ hệ gốc của nó.
	 */
	private enchant(skill: SkillDef): Element | undefined {
		const e = this.enchantment;
		// Kiếm pháp nguyên tố đã mang hệ riêng: phủ phép không đè lên.
		return e && isSwordSkill(skill) && skill.element === 'steel' ? ENCHANT_ELEMENT[e] : undefined;
	}

	/**
	 * Hiệu ứng thêm của một NHÁT chém theo phủ phép (gọi một lần mỗi nhát, kể cả chém hụt — "nhát thứ 3" đếm nhát vung).
	 * Bảng 2.3 (số ở `skillRules.ENCHANT_FX`, mốc 7 = `ENCHANT_UP_TIER`):
	 * - Thổ: mọi nhát phá giáp; nhát thứ 3 liên tiếp choáng (từ mốc `ENCHANT_EARTH_STUN_TIER`; mốc 7 lâu hơn).
	 * - Hoả mốc 7: nhát thứ 3 liên tiếp nổ nhỏ (`blast`). Thuỷ: hút máu. Phong: đẩy lùi nhẹ (tầm chém ở `enchantReach`, lưỡi
	 *   gió ở `windBlade`). Băng: cộng dồn nhát → đóng băng (`frost`).
	 */
	private swingFx(enchant: Element | undefined): HitFx | undefined {
		if (!enchant || enchant === 'steel') return undefined;
		if (this.time - this.combo.at > EARTH_ENCHANT.comboReset) this.combo.n = 0;
		this.combo = { n: this.combo.n + 1, at: this.time, seq: this.combo.seq + 1 };
		const third = this.combo.n % EARTH_ENCHANT.every === 0;
		const up = (this.tiers[enchant as EnchantId] ?? 0) >= ENCHANT_UP_TIER;
		this.blastArmed = 0;
		switch (enchant) {
			case 'earth': {
				const stun = third && (this.tiers.earth ?? 0) >= ENCHANT_EARTH_STUN_TIER;
				return { armor: EARTH_ENCHANT.armor, ...(stun ? { stun: up ? EARTH_ENCHANT.stunUp : EARTH_ENCHANT.stun } : {}) };
			}
			case 'fire':
				if (!(third && up)) return undefined;
				this.blastArmed = this.combo.seq;
				return { blast: this.combo.seq };
			case 'water':
				return { drain: up ? ENCHANT_FX.water.drainUp : ENCHANT_FX.water.drain };
			case 'wind':
				return { knock: ENCHANT_FX.wind.knock };
			case 'ice':
				return { frost: up ? ENCHANT_FX.ice.stacksUp : ENCHANT_FX.ice.stacks };
			default:
				return undefined;
		}
	}

	/** Tầm chém nhân theo phủ phép (Phong: +25%) — chỉ đòn kiếm cận chiến (chém, xoay). */
	private enchantReach(enchant: Element | undefined): number {
		return enchant === 'wind' ? ENCHANT_FX.wind.reach : 1;
	}

	/** Phủ Phong mốc 7: nhát chém cận chiến bắn thêm một lưỡi gió theo hướng chém (không xuyên, không phủ phép thêm). */
	private windBlade(enchant: Element | undefined, x: number, y: number, dx: number, dy: number, damage: number): void {
		if (enchant !== 'wind' || (this.tiers.wind ?? 0) < ENCHANT_UP_TIER) return;
		const w = ENCHANT_FX.wind;
		const len = Math.hypot(dx, dy) || 1;
		const [ux, uy] = [dx / len, dy / len];
		this.fire({ x: x + ux * 22, y: y + uy * 22, vx: ux * w.bladeSpeed, vy: uy * w.bladeSpeed, life: w.bladeRange / w.bladeSpeed, team: 'player', damage: damage * w.bladePower, element: 'wind', pierce: false });
	}

	/** Phủ Hoả mốc 7: nổ nhỏ quanh mục tiêu đầu tiên trúng nhát được nổ (hệ Hoả, không khống chế). */
	private enchantBlast(x: number, y: number, base: number): void {
		const b = ENCHANT_FX.fire;
		this.playArt('ember_burst', x, y);
		this.hooks.shake(1.4, 0.1);
		this.strikeArea({ kind: 'circle', x, y, r: b.blastRadius }, base * b.blastPower, 'fire', undefined);
	}

	/** Khống chế của kỹ năng; phép Thổ nhân Đá Nặng (đẩy xa hơn, choáng/hất lâu hơn). */
	private hitFxOf(skill: SkillDef): HitFx | undefined {
		const h = skill.hit;
		if (!h) return undefined;
		const k = skill.element === 'earth' ? this.fx.earthCC : 1;
		return { ...h, knock: h.knock && h.knock * k, stun: h.stun && h.stun * k, launch: h.launch && h.launch * k };
	}

	/** Mạnh kiếm thì yếu phép và ngược lại (Hồi Phục không đổi — không để nhánh kiếm hết đường sống). */
	private pathScale(skill: SkillDef): number {
		if (skill.kind === 'heal') return 1;
		const p = PATHS[this.path ?? 'none'];
		return isSwordSkill(skill) ? p.sword : p.magic;
	}

	/**
	 * `regionBoss`: boss canh vùng (hồi sinh, không thuộc cốt truyện) — Game truyền cho vùng quái `boss: true`.
	 * `dormant` (giây): dựng ở trạng thái ĐÃ GỤC, còn chừng ấy giây mới thức — boss vùng bị hạ trước lần đổi map.
	 */
	addEnemy(
		actor: Actor,
		id: string,
		home: { x: number; y: number; radius: number },
		name: string,
		opts: { regionBoss?: boolean; dormant?: number; net?: NetMob } = {},
	): Fighter | null {
		const stats = ENEMY_STATS[id];
		if (!stats) return null;
		const regionBoss = !!opts.regionBoss;
		const f: Fighter = {
			actor,
			id,
			name,
			boss: regionBoss || id.startsWith('boss_'),
			regionBoss,
			stats,
			hp: stats.hp,
			hpMax: stats.hp,
			home,
			attackTimer: 1 + Math.random(),
			windup: 0,
			swing: null,
			engaged: false,
			burn: 0,
			wet: 0,
			chill: 0,
			frost: 0,
			freeze: 0,
			stun: 0,
			air: 0,
			airTotal: 0,
			slow: 0,
			slowMult: 1,
			armor: 0,
			sunder: 0,
			miss: 0,
			daze: 0,
			iced: false,
			freezeImmune: 0,
			iceDepth: 0,
			emberDepth: 0,
			route: null,
			dust: 0,
			frostHits: { n: 0, at: -99 },
			burnPower: 1,
			push: null,
			flash: 0,
			dead: false,
			deathT: 0,
			respawnT: 0,
			shownBar: 0,
			attacks: 0,
			aoeTimer: 6,
			introduced: false,
			...(opts.net ? { net: opts.net } : {}),
		};
		if (opts.dormant && opts.dormant > 0) {
			// deathT quá mốc mờ dần (0,7s) để không hiện thoáng một frame rồi mới tan.
			Object.assign(f, { dead: true, hp: 0, respawnT: opts.dormant, deathT: 1 });
			actor.root.alpha = 0;
			actor.wanderEnabled = false;
		}
		this.enemies.push(f);
		return f;
	}

	/** Mục tiêu gần nhất còn sống (quái hoặc hình nộm) trong `range` px — để tự ngắm khi không có chuột. */
	nearestTarget(x: number, y: number, range: number): { x: number; y: number } | null {
		let best: { x: number; y: number } | null = null;
		let bestD = range;
		for (const f of this.enemies) {
			if (f.dead) continue;
			const d = Math.hypot(f.actor.x - x, f.actor.y - y);
			if (d < bestD) [best, bestD] = [{ x: f.actor.x, y: f.actor.y }, d];
		}
		for (const t of this.dummies) {
			const d = Math.hypot(t.x - x, t.y - y);
			if (d < bestD) [best, bestD] = [{ x: t.x, y: t.y }, d];
		}
		return best;
	}

	/**
	 * Quái sống theo BẦY: cả bầy dùng chung một `home` (Game dựng một `home` cho mỗi vùng quái), nên một con thấy người
	 * chơi hoặc trúng đòn là cả bầy cùng lao vào — không đứng nhìn đồng loại bị đánh. Boss không thuộc bầy nào.
	 */
	private engage(f: Fighter): void {
		if (f.net && !f.engaged) this.hooks.netAggro?.(f);
		f.engaged = true;
		if (f.boss) return;
		for (const o of this.enemies) if (o !== f && !o.dead && !o.boss && o.home === f.home) o.engaged = true;
	}

	/**
	 * Dọn mọi thứ thuộc map cũ khi chuyển map: quái (trả actor để Game huỷ), hình nộm, đạn đang bay, vòng cảnh báo, vùng /
	 * tường / đòn hẹn giờ và MỌI hình đang phát (tường đá, mây mưa, phễu lốc… không được hiện tiếp ở toạ độ cũ trên map mới).
	 * Người chơi giữ nguyên (máu, MP, hồi chiêu đi theo sang map mới); khiên phản đạn tắt cùng hình của nó.
	 */
	clearWorld(): Actor[] {
		for (const f of this.enemies) this.endSwing(f);
		const actors = this.enemies.map((f) => f.actor);
		this.enemies.length = 0;
		this.dummies.length = 0;
		for (const t of this.telegraphs) {
			t.g.destroy();
			t.ring.destroy();
		}
		this.telegraphs.length = 0;
		this.zones.length = 0;
		this.walls.length = 0;
		this.pending.length = 0;
		this.pc.ward = null;
		this.vfx.clear();
		for (const pr of this.projectiles) {
			for (const s of [pr.sprite, pr.glow]) {
				if (!s) continue;
				s.visible = false;
				s.parent?.removeChild(s);
				this.spritePool.push(s);
			}
		}
		this.projectiles.length = 0;
		return actors;
	}

	/** Hình nộm tập: nhận đòn, hiện số và hiệu ứng, báo `practiceHit` — không chết, không đánh lại. */
	addDummy(x: number, y: number): void {
		this.dummies.push({ x, y, flash: 0, burn: 0, wet: 0, chill: 0, frost: 0, freeze: 0, dust: 0, slow: 0, armor: 0, sunder: 0, miss: 0, daze: 0 });
	}

	/**
	 * `reportAs`: hệ báo cho nhiệm vụ luyện tập. Kiếm phủ nguyên tố vẫn báo 'steel' — nhát chém vẫn là nhát chém,
	 * bài "luyện kiếm" của cha phải tính dù kiếm đang mang hệ gì.
	 */
	private hitDummy(d: Dummy, base: number, element: Element, reportAs: Element = element): void {
		d.flash = 0.1;
		const burning = d.burn > 0 ? this.fx.burning : 1;
		const vuln = this.vulnerability(d);
		const r = this.react(d, element, d.x, d.y);
		if (element === 'wind' && this.fx.gust) d.daze = Math.max(d.daze, PASSIVE.gustSeconds);
		this.float(d.x + (Math.random() - 0.5) * 12, d.y - 96, `${Math.round(base * (0.9 + Math.random() * 0.2) * r.mult * burning * vuln)}`, ELEMENT_TINT[element], 14);
		this.impact(element, d.x, d.y - 46);
		if (r.reaction) {
			this.playReaction(r.reaction, d.x, d.y - 50);
			this.float(d.x, d.y - 124, r.reaction.name, r.reaction.color, 14);
		}
		this.hitStop = Math.max(this.hitStop, r.reaction ? 0.06 : 0.03);
		this.hooks.practiceHit?.(reportAs, r.reaction?.id ?? null);
	}

	/** Trạng thái của hình nộm phai theo thời gian như quái (ướt 4s — "chậm là khô"), lửa cháy có hiệu ứng. */
	private updateDummies(dt: number): void {
		for (const d of this.dummies) {
			d.flash = Math.max(0, d.flash - dt);
			d.wet = Math.max(0, d.wet - dt);
			d.chill = Math.max(0, d.chill - dt);
			d.frost = Math.max(0, d.frost - dt);
			d.freeze = Math.max(0, d.freeze - dt);
			d.dust = Math.max(0, d.dust - dt);
			d.slow = Math.max(0, d.slow - dt);
			d.armor = Math.max(0, d.armor - dt);
			d.sunder = Math.max(0, d.sunder - dt);
			d.miss = Math.max(0, d.miss - dt);
			d.daze = Math.max(0, d.daze - dt);
			// Hình nộm không có sprite để tô màu: đóng băng thì toả bụi băng cho người chơi thấy phản ứng đã ăn.
			if (d.freeze > 0 && Math.random() < dt * 6) this.particles.spawn(d.x + (Math.random() - 0.5) * 22, d.y - 30 - Math.random() * 44, this.tex.spark.ice[0]!, 0, -12, 0.5);
			if (d.burn > 0) {
				d.burn = Math.max(0, d.burn - dt);
				if (Math.random() < dt * 5) this.vfx.play('flame', d.x + (Math.random() - 0.5) * 16, d.y - 50 - Math.random() * 30, { blend: 'add', fps: 14 });
			}
			if (d.wet > 0 && Math.random() < dt * 4) this.particles.spawn(d.x + (Math.random() - 0.5) * 18, d.y - 40 - Math.random() * 30, this.tex.spark.water[0]!, 0, 30, 0.4);
		}
	}

	// ———————————————————————————— hành động người chơi ————————————————————————————

	/** Đòn đang diễn của người chơi (null = rảnh). */
	get action(): PlayerAction | null {
		return this.pc.action;
	}

	/**
	 * BẤM kỹ năng: trừ MP + đặt hồi chiêu ngay (HUD giữ nguyên công thức), khoá hướng, bắt đầu động tác.
	 * Hiệu ứng (đạn, chém, hồi máu) áp ở khung chạm trong `update`. Atlas chưa có động tác cho hướng này thì
	 * đòn nổ ngay như trước — chỉ bỏ cú "giật" sprite (lunge) của người chơi.
	 * `repeat`: lệnh tự lặp do GIỮ phím (gọi mỗi frame) — im lặng, và không bao giờ đè lệnh bấm chủ động đang chờ.
	 */
	cast(index: number, aim: { x: number; y: number }, opts: { repeat?: boolean } = {}): CastResult {
		const skill = this.skills[index];
		const pc = this.pc;
		if (!skill) return 'none';
		if (pc.dead) return 'dead';
		if (!this.knows(skill)) {
			if (!opts.repeat) this.hooks.toast(`Chưa học “${skill.name}”`, 'warn');
			return 'locked';
		}
		if ((pc.cooldowns.get(skill.id) ?? 0) > this.time) return 'cooldown';
		if (pc.mp < skill.mpCost) {
			if (!opts.repeat) this.hooks.toast('Không đủ MP', 'warn');
			return 'mp';
		}
		const busy = pc.action;
		if ((busy && !this.pastCancel(busy)) || pc.dash || pc.charging) {
			if (opts.repeat && pc.buffered) return 'busy';
			pc.buffered = { index, aim: { x: aim.x, y: aim.y }, ttl: BUFFER_TTL };
			return 'buffered';
		}
		// Đang giữ thế: lệnh tự lặp (giữ J) không phá thế; BẤM một đòn khác thì thôi giữ thế để ra đòn đó.
		if (pc.guard) {
			if (opts.repeat) return 'busy';
			this.endGuard();
		}
		// Ảnh Bộ cần mục tiêu: không có thì không tung — không mất MP, không tính hồi chiêu.
		const blink = skill.kind === 'blink' ? this.blinkTarget(aim, skill) : null;
		if (skill.kind === 'blink' && !blink) {
			if (!opts.repeat) this.hooks.toast('Không có mục tiêu trong tầm', 'warn');
			return 'none';
		}
		// Đòn trước đang thu thế: đòn mới cắt ngang luôn.
		if (busy) this.endRecovery();
		pc.buffered = null;
		const prevCooldown = pc.cooldowns.get(skill.id) ?? 0;
		// Đà Lướt (vừa né xong): hồi chiêu (`cooldownOf` đã tính) + động tác nhanh hơn, dùng một lượt.
		const fast = this.momentumLive(skill);
		const cooldown = this.cooldownOf(skill);
		pc.mp -= skill.mpCost;
		pc.cooldowns.set(skill.id, this.time + cooldown);
		if (fast) this.momentum.n -= 1;

		const p = this.player;
		// Đòn nhắm ĐIỂM trên mặt đất: hướng tính từ chân (điểm chuột là điểm trên đất); đòn bắn/chém tính từ ngực như cũ.
		let dx = aim.x - p.x;
		let dy = aim.y - (isGroundTarget(skill) ? p.y : p.y - p.chest);
		if (blink) {
			// Ảnh Bộ: ra sau lưng mục tiêu NGAY lúc bấm, rồi quay lại chém nó (động tác vung diễn ở chỗ mới).
			this.blinkTo(blink, skill);
			[dx, dy] = [blink.x - p.x, blink.y - p.y];
		}
		const len = Math.hypot(dx, dy) || 1;
		dx /= len;
		dy /= len;
		const dir = directionOf(dx, dy);
		p.view.set(p.view.baseAnimation, dir);

		const begin = (): void => {
			if (skill.anim === 'cast') {
				// Vòng phép dưới chân hiện ngay lúc niệm (pha vào thế); quả cầu ở tay chờ tới khung đẩy tay.
				this.vfx.play('magic_circle', p.x, p.y, { layer: 'ground', tint: ELEMENT_TINT[skill.element], follow: p, fps: 24, alpha: 0.9 });
			}
			const action = { skill, index, dx, dy, tx: aim.x, ty: aim.y, dir, t: 0, released: false, prevCooldown, mpPaid: skill.mpCost };
			// Đà Lướt: dựng nhịp theo hồi chiêu THƯỜNG rồi co cả động tác ÷1,25 — vẫn vừa trong hồi chiêu đã rút, không co hai lần.
			const plain = skill.anim ? p.view.actionTiming(skill.anim, dir, fast ? cooldown * PASSIVE.momentumSpeed : cooldown) : null;
			const timing = plain && fast ? quicken(plain, PASSIVE.momentumSpeed) : plain;
			if (skill.anim && timing && p.view.playAction(skill.anim, dir, { timing, external: true })) pc.action = { ...action, timing };
			else this.release(action, false);
			if (skill.anim) this.hooks.onAction?.(skill.anim, dir, skill.id);
		};
		if (skill.charge) {
			// Dồn lực (Nhất Kích): đứng im, tia sáng tụ quanh người đúng bằng thời gian dồn — xong mới vào động tác vung.
			pc.charging = { t: skill.charge, skill, prevCooldown, mpPaid: skill.mpCost, begin };
			this.playArt(skill.id, p.x, p.y, dx, dy, undefined, { part: 'charge', follow: p, span: skill.charge });
			return 'started';
		}
		begin();
		return 'started';
	}

	/**
	 * Khung chạm: áp hiệu ứng của đòn. Gốc lấy theo vị trí HIỆN TẠI của người chơi (bị đẩy/dịch chuyển giữa
	 * chừng thì đòn ra từ chỗ mới), hướng giữ đúng hướng đã khoá lúc bấm, sát thương tính lúc này.
	 * `animated`: có động tác thật → vệt chém một chiều khớp chiều vung, không luân phiên.
	 */
	private release(a: { skill: SkillDef; dx: number; dy: number; dir: Direction; tx?: number; ty?: number }, animated: boolean): void {
		const { skill, dx, dy } = a;
		const pc = this.pc;
		const p = this.player;
		const ox = p.x;
		const oy = p.y - p.chest;
		const scale = this.skillScaleOf(skill);
		// Thế Áp Đảo (đòn Kiếm, cộng dồn theo nhát trúng liên tiếp) + Bất Khuất (dưới 30% máu) tính lúc khung chạm.
		const damage = (isSwordSkill(skill) ? this.swordAtk() : this.magicAtk()) * skill.power * this.pathScale(skill) * scale * this.pressMult(skill) * this.rageMult();
		const enchant = this.enchant(skill);
		const kind = skill.kind;

		if (skill.anim === 'cast' && kind !== 'zone' && kind !== 'pillar' && kind !== 'wall' && kind !== 'barrage') {
			this.vfx.play('arcane_orb', ox + dx * 16, oy + dy * 12, { tint: ELEMENT_TINT[skill.element], blend: 'add', fps: 20 });
		}
		// Kiếm pháp nguyên tố kiểu vùng / đường / nón: vẫn là một nhát VUNG kiếm — vệt chém mang màu hệ ở tay trước đã.
		if (skill.blade && kind !== 'melee') this.slashFx(ox, oy, dx, dy, skill.element, animated ? a.dir : null);

		if (kind === 'projectile') {
			// Gió Sắc (Phong mốc 2): chỉ phép Phong bay nhanh + xa hơn — cùng hệ số cho tốc và tầm nên thời gian bay giữ nguyên.
			const boost = skill.element === 'wind' ? this.fx.windShot : 1;
			const speed = (skill.speed ?? 400) * boost;
			// Đạn KIẾM (Lưỡi Sóng, Phi Kiếm): mang hệ phủ phép (hình nhuộm màu hệ), tính một nhát cho Thế Áp Đảo / phủ Thổ.
			const sword = isSwordSkill(skill);
			const el = enchant ?? skill.element;
			const look = TEMP_ART[skill.id]?.shot;
			const fx = sword ? mergeFx(this.hitFxOf(skill), this.swingFx(enchant)) : this.hitFxOf(skill);
			// Phong Bạo: `count` lưỡi toả quạt quanh hướng nhắm, cách nhau `spread` độ (một lưỡi = bắn thẳng như cũ).
			const n = Math.max(1, skill.count ?? 1);
			const step = ((skill.spread ?? 0) * Math.PI) / 180;
			const base = Math.atan2(dy, dx);
			for (let k = 0; k < n; k += 1) {
				const ang = base + (k - (n - 1) / 2) * step;
				const [ux, uy] = n === 1 ? [dx, dy] : [Math.cos(ang), Math.sin(ang)];
				this.fire({
					x: ox + ux * 18,
					y: oy + uy * 18,
					vx: ux * speed,
					vy: uy * speed,
					life: ((skill.range ?? 400) * boost) / speed,
					team: 'player',
					damage,
					element: el,
					pierce: !!skill.pierce,
					fx,
					look: enchant && look ? { ...look, tint: ELEMENT_TINT[enchant] } : look,
					reach: skill.width,
					crit: skill.crit,
					boomerang: skill.returns ? speed : undefined,
					press: sword,
				});
			}
			if (sword) this.slashFx(ox, oy, dx, dy, el, animated ? a.dir : null);
			if (n > 1 || sword) this.playArt(skill.id, p.x + dx * 24, p.y + dy * 16, dx, dy);
		} else if (kind === 'melee' || kind === 'blink') {
			// Ảnh Bộ: đã ra sau lưng mục tiêu lúc bấm (`cast`) — tới đây chém như một nhát thường, tầm `radius`.
			const el = enchant ?? skill.element;
			const base = this.hitFxOf(skill);
			const hx = mergeFx(base, this.swingFx(enchant));
			// Phủ Phong: tầm chém của kỹ năng +25% (phần nới thân 18px giữ nguyên).
			const reach = (kind === 'blink' ? (skill.radius ?? 72) : (skill.range ?? 70)) * this.enchantReach(enchant) + 18;
			this.slashFx(ox, oy, dx, dy, el, animated ? a.dir : null);
			if (TEMP_ART[skill.id]) this.playArt(skill.id, p.x + dx * (kind === 'blink' ? 26 : 46), p.y + dy * 30, dx, dy);
			this.pressLanded(this.sweep(ox, oy, dx, dy, reach, skill.arc, damage, el, hx, skill.crit ?? 0, skill.element));
			this.windBlade(enchant, ox, oy, dx, dy, damage);
			if (skill.charge || skill.crit || skill.hit?.armor) {
				// Nhát nặng / nhát ảnh / nhát phá giáp: rung + khựng mạnh hơn nhát Trảm thường.
				this.hooks.shake(skill.charge ? 3.2 : 2.2, 0.18);
				this.hitStop = Math.max(this.hitStop, 0.07);
			}
			// Liên Hoàn: các nhát sau nối đuôi cách `stagger` giây, ra từ chỗ người chơi ĐANG đứng, cùng hướng đã khoá; mỗi nhát
			// tính riêng (phủ phép, Thế Áp Đảo). Chưa có động tác chuỗi: vệt chém luân phiên trái / phải.
			for (let k = 1; k < (skill.count ?? 1); k += 1) {
				this.schedule(k * (skill.stagger ?? 0.1), () => {
					if (this.pc.dead) return;
					const q = this.player;
					const [qx, qy] = [q.x, q.y - q.chest];
					this.slashFx(qx, qy, dx, dy, el);
					this.playArt(skill.id, q.x + dx * 46, q.y + dy * 30, dx, dy);
					this.pressLanded(this.sweep(qx, qy, dx, dy, reach, skill.arc, damage, el, mergeFx(base, this.swingFx(enchant)), skill.crit ?? 0, skill.element));
					this.windBlade(enchant, qx, qy, dx, dy, damage);
				});
			}
		} else if (kind === 'guard') {
			// Thủy Thần: vào thế — nhát phản tính sát thương NGAY lúc này (hệ số, con đường, phủ phép đang chọn).
			const total = skill.duration ?? 1;
			pc.guard = { kind: skill.guard ?? 'stance', skillId: skill.id, t: total, total, damage, element: enchant ?? 'steel', blocks: 0 };
			this.playArt(skill.id, p.x, p.y, dx, dy, undefined, { part: 'charge', follow: p, span: total });
			this.float(p.x, p.y - p.height - 8, skill.guard === 'parry' ? 'Thế đỡ!' : 'Giữ thế', 0xbfeaff, 12);
		} else if (kind === 'spin') {
			// Xoáy Nước: xoay chém quanh mình, đẩy lùi. Vừa đỡ / gạt / phản thành công (trong `COUNTER.after` giây) thì uy lực
			// ×`afterGuard` + đẩy xa hơn — dùng hết cửa sổ đó (lần xoay sau phải đỡ đòn lại).
			const el = enchant ?? skill.element;
			const surge = !!skill.afterGuard && this.time - this.guardAt <= COUNTER.after;
			const base = this.hitFxOf(skill);
			const hx = mergeFx(surge && base ? { ...base, knock: (base.knock ?? 0) * SURGE_KNOCK } : base, this.swingFx(enchant));
			for (let k = 0; k < 4; k += 1) {
				const ang = (k / 4) * Math.PI * 2;
				this.vfx.play('slash', p.x + Math.cos(ang) * 34, p.y - 34 + Math.sin(ang) * 22, { rotation: ang + Math.PI / 2, tint: el === 'steel' ? 0xeaf8ff : ELEMENT_TINT[el], fps: 30 });
			}
			this.playArt(skill.id, p.x, p.y, dx, dy);
			if (surge) {
				this.guardAt = -99;
				this.playArt('whirlpool_surge', p.x, p.y, dx, dy);
				this.float(p.x, p.y - p.height - 8, `${skill.name}!`, 0x9fe8ff, 15);
				this.hooks.shake(2.6, 0.18);
				this.hitStop = Math.max(this.hitStop, 0.07);
			}
			this.pressLanded(this.strikeArea({ kind: 'circle', x: p.x, y: p.y, r: (skill.radius ?? 90) * this.enchantReach(enchant) }, damage * (surge ? (skill.afterGuard ?? 1) : 1), el, hx, 'steel'));
		} else if (kind === 'dash') {
			const plan = dashPlan(dx, dy, skill.range ?? 150, skill.speed ?? 640);
			const el = enchant ?? skill.element;
			const fx = mergeFx(this.hitFxOf(skill), this.swingFx(enchant));
			const windy = skill.element === 'wind';
			const trail: DashTrail | undefined = skill.trail
				? { skillId: skill.id, fromX: p.x, fromY: p.y, damage, element: el, half: skill.width ?? 30, fx, spark: 0, crit: skill.crit ?? 0, windy }
				: undefined;
			// Lướt có vệt (Lướt Gió, Đột Kích): lúc lướt không chém ai, vệt chém sau khi dừng. Lướt chém (Lướt Chém): chém quái đi qua.
			pc.dash = {
				...plan,
				damage: trail ? 0 : damage,
				hit: new Set(),
				element: el === 'steel' ? undefined : el,
				trail,
				reach: skill.width,
				crit: skill.crit,
				fx: trail ? undefined : fx,
				skillId: skill.id,
			};
			pc.iframes = Math.max(pc.iframes, skill.iframes ?? 0.3);
			this.vfx.play('dust', p.x, p.y - 8, { fps: 20 });
			if (windy && trail) this.vfx.play('wind_burst', p.x, p.y - 26, { fps: 22 });
			else if (!trail) this.playArt(skill.id, p.x, p.y, dx, dy);
		} else if (kind === 'ward') {
			// Gương Băng / Dòng Chảy Ngược: khiên bám người — đạn quái chạm khiên bị phản (`updateProjectiles`); uy lực đạn phản
			// tính lúc bật. Bản Kiếm (thép): đạn phản mang hệ đang phủ lên kiếm.
			const total = skill.duration ?? 4;
			const sword = isSwordSkill(skill);
			pc.ward = { skillId: skill.id, t: total, total, damage, radius: skill.radius ?? 46, element: sword ? (enchant ?? 'steel') : skill.element, sword };
			this.playArt(skill.id, p.x, p.y, dx, dy, undefined, { part: 'charge', follow: p, span: total });
			this.float(p.x, p.y - p.height - 8, skill.name, sword ? 0xbfe8ff : ELEMENT_TINT.ice, 12);
		} else if (kind === 'wall') {
			const at = clampTarget(p.x, p.y, a.tx ?? p.x + dx * (skill.aimDist ?? 110), a.ty ?? p.y + dy * (skill.aimDist ?? 110), skill.range ?? 0);
			this.addWall(skill, at.x, at.y, dx, dy, damage);
		} else if (kind === 'barrage') {
			const at = clampTarget(p.x, p.y, a.tx ?? p.x + dx * (skill.aimDist ?? 150), a.ty ?? p.y + dy * (skill.aimDist ?? 150), skill.range ?? 0);
			this.barrage(skill, at.x, at.y, dx, dy, damage);
		} else if (kind === 'heal') {
			const amount = Math.round(pc.hpMax * skill.power * scale);
			pc.hp = Math.min(pc.hpMax, pc.hp + amount);
			this.vfx.play('light_pillar', p.x, p.y - pillar(p), { tint: 0xb4ffc6, blend: 'add', follow: p, followOffset: { x: 0, y: -pillar(p) }, fps: 22 });
			this.vfx.play('sparkle', p.x, p.y - p.chest - 4, { tint: 0x9fffb0, blend: 'add', fps: 20 });
			this.float(p.x, p.y - p.height - 8, `+${amount}`, 0x5be38a, 15);
		} else if (kind === 'aoe_self') {
			this.playArt(skill.id, p.x, p.y, dx, dy);
			this.strikeArea({ kind: 'circle', x: p.x, y: p.y, r: skill.radius ?? 90 }, damage, skill.element, this.hitFxOf(skill));
			this.hooks.shake(skill.element === 'earth' ? 3.5 : 2, 0.22);
			if (skill.element === 'fire') this.flashScreen(0xffa040, 0.12);
		} else if (kind === 'cone') {
			const range = skill.range ?? 160;
			const half = skill.angle ?? 35;
			// Sóng nối đuôi từ gần ra xa (chỉ là hình); sát thương áp ngay cả nón — quái không kịp chạy khỏi một con sóng.
			for (let row = 0; row < 3; row += 1) {
				const dist = range * (0.28 + row * 0.3);
				const spread = row === 0 ? [0] : [-half * 0.55, half * 0.55];
				for (const deg of spread) {
					const ang = Math.atan2(dy, dx) + (deg * Math.PI) / 180;
					const cx = p.x + Math.cos(ang) * dist;
					const cy = p.y + Math.sin(ang) * dist;
					this.schedule(row * 0.06, () => this.playArt(skill.id, cx, cy, Math.cos(ang), Math.sin(ang)));
				}
			}
			const n = this.strikeArea({ kind: 'cone', x: p.x, y: p.y, dx, dy, range, half }, damage, skill.element, this.hitFxOf(skill));
			if (skill.blade) this.pressLanded(n);
			this.hooks.shake(1.6, 0.15);
		} else if (kind === 'line') {
			// Gai trồi nối đuôi theo hướng nhắm; một con quái chỉ trúng một lần dù đứng giữa hai đoạn.
			const step = 34;
			const segs = lineSegments(p.x + dx * 20, p.y + dy * 20, dx, dy, skill.range ?? 300, step);
			const hitSet = new Set<object>();
			// Bản PixelLab (khổ 128) to hơn một đoạn 34px nhiều: chỉ phát ở mỗi đoạn thứ 3.
			const final = this.finalReady(skill.id);
			const fx = this.hitFxOf(skill);
			for (const sg of segs) {
				this.schedule((skill.delay ?? 0) + sg.i * (skill.stagger ?? 0), () => {
					if (!final || sg.i % 3 === 0) this.playArt(skill.id, sg.cx, sg.cy, dx, dy);
					this.strikeArea({ kind: 'line', ax: sg.ax, ay: sg.ay, bx: sg.bx, by: sg.by, half: skill.width ?? 26 }, damage, skill.element, fx, skill.element, hitSet);
					if (sg.i % 3 === 0) this.hooks.shake(1.4, 0.08);
				});
			}
		} else if (kind === 'aoe_target' || kind === 'pillar' || kind === 'zone') {
			// Vùng bám người (Phong Kiếm Cuồng Vũ): đặt ngay dưới chân, đi theo người chơi.
			if (kind === 'zone' && skill.follow) return this.addZone(skill, p.x, p.y, damage, dx, dy, true);
			// Vòi Rồng: sinh ngay trước mặt rồi tự đi theo hướng nhắm (không nhắm điểm).
			if (kind === 'zone' && skill.move) return this.addZone(skill, p.x + dx * 40, p.y + dy * 40, damage, dx, dy);
			const at = clampTarget(p.x, p.y, a.tx ?? p.x + dx * (skill.aimDist ?? 150), a.ty ?? p.y + dy * (skill.aimDist ?? 150), skill.range ?? 0);
			if (kind === 'zone') return this.addZone(skill, at.x, at.y, damage, dx, dy);
			const r = skill.radius ?? 80;
			let delay = skill.delay ?? 0;
			if (skill.lob) {
				// Cầu bay tới điểm nhắm (chỉ là hình, không va chạm) — đường bay CHÍNH là độ trễ.
				const sx = ox + dx * 18;
				const sy = oy + dy * 18;
				delay = Math.max(0.12, Math.hypot(at.x - sx, at.y - sy) / skill.lob);
				this.fire({ x: sx, y: sy, vx: (at.x - sx) / delay, vy: (at.y - sy) / delay, life: delay, team: 'player', damage: 0, element: skill.element, pierce: false, ghost: true, look: TEMP_ART[skill.id]?.shot });
			}
			// Bản PixelLab tự có cảnh vật rơi (`finalImpact`): bỏ vật rơi tạm, phát clip sớm để frame va chạm trùng lúc nổ.
			const fallFinal = !!skill.fall && this.finalReady(skill.id);
			if (skill.fall && delay > 0) {
				// Thiên Thạch: vật rơi chéo từ trời (chỉ là hình) + vòng báo co đúng hết lúc rơi — người chơi thấy chỗ sắp nổ.
				const sx = at.x - 110;
				const sy = at.y - FALL_HEIGHT * 2;
				if (!fallFinal) this.fire({ x: sx, y: sy, vx: (at.x - sx) / delay, vy: (at.y - sy) / delay, life: delay, team: 'player', damage: 0, element: skill.element, pierce: false, ghost: true, look: TEMP_ART[skill.id]?.shot });
				this.playArt(skill.id, at.x, at.y, dx, dy, undefined, { part: 'charge', span: delay });
			}
			if (fallFinal) this.schedule(Math.max(0, delay - this.finalLead(skill.id)), () => this.playArt(skill.id, at.x, at.y, dx, dy));
			if (kind === 'pillar' && delay > 0) {
				// Vòng báo dưới đất trong lúc chờ trồi — người chơi thấy chỗ cột sắp lên.
				this.vfx.play('magic_circle', at.x, at.y, { layer: 'ground', tint: ELEMENT_TINT[skill.element], scale: 2, fps: 9 / delay, alpha: 0.75 });
			}
			const fx = this.hitFxOf(skill);
			this.schedule(delay, () => {
				if (!fallFinal) this.playArt(skill.id, at.x, at.y, dx, dy);
				this.strikeArea({ kind: 'circle', x: at.x, y: at.y, r }, damage, skill.element, fx);
				this.hooks.shake(skill.fall ? 5 : kind === 'pillar' ? 3 : 2.6, skill.fall ? 0.35 : 0.22);
				if (skill.element === 'fire') this.flashScreen(0xffa040, skill.fall ? 0.3 : 0.18);
				this.hitStop = Math.max(this.hitStop, 0.05);
			});
		}
	}

	// ———————————————————————————— kiểu đòn vùng (GĐ2) ————————————————————————————

	/** Hẹn chạy `run` sau `delay` giây trận (đứng yên khi thoại/thẻ mở như mọi thứ khác của trận). */
	private schedule(delay: number, run: () => void): void {
		this.pending.push({ t: delay, run });
	}

	private updatePending(dt: number): void {
		const due: (() => void)[] = [];
		for (let i = this.pending.length - 1; i >= 0; i -= 1) {
			const job = this.pending[i]!;
			job.t -= dt;
			if (job.t > 0) continue;
			due.push(job.run);
			this.pending.splice(i, 1);
		}
		// Đã duyệt ngược: đảo lại để đòn hẹn trước chạy trước (gai trồi đúng thứ tự gần → xa).
		for (const run of due.reverse()) run();
	}

	/** Atlas đã có bản PixelLab của hiệu ứng chính chưa (`TEMP_ART[key].final`). */
	private finalReady(key: string): boolean {
		const f = TEMP_ART[key]?.final;
		return !!f && this.vfx.frames(f).length > 0;
	}

	/** Bản PixelLab có cảnh vật rơi: từ lúc phát tới frame va chạm (`TempArt.finalImpact`) mất bao giây. */
	private finalLead(key: string): number {
		const art = TEMP_ART[key];
		return (art?.finalImpact ?? 0) / (art?.finalLook?.fps ?? 18);
	}

	/**
	 * Phát hình của kỹ năng / phản ứng tại (x, y) — y là CHÂN (mặt đất) hoặc điểm trúng: bản PixelLab nếu atlas đã có
	 * (`final`), không thì các lớp hình tạm (`TEMP_ART`). `duration`: lặp tới hết chừng ấy giây (vùng tồn tại).
	 * `o.part` = 'charge': các lớp báo trước / bám người (dồn lực, thế đỡ, bóng để lại). `o.follow`: neo theo vật đang đi.
	 * `o.span`: thời lượng đi kèm — lớp `loop` lặp suốt chừng đó, lớp `fit` phát một lượt vừa khít chừng đó.
	 */
	private playArt(key: string, x: number, y: number, dx = 1, dy = 0, duration?: number, o: { part?: 'look' | 'charge' | 'tick'; follow?: { x: number; y: number }; span?: number } = {}): void {
		const art = TEMP_ART[key];
		if (!art) return;
		const aim = Math.atan2(dy, dx);
		const part = o.part ?? 'look';
		const at = (l: Omit<ArtLayer, 'id'>): VfxOptions =>
			o.follow ? { follow: o.follow, followOffset: { x: l.dx ?? 0, y: -(l.lift ?? 0) } } : {};
		if (part === 'look' && art.final && this.finalReady(key)) {
			const l = art.finalLook ?? {};
			this.vfx.play(art.final, x + (l.dx ?? 0), y - (l.lift ?? 0), { ...layerOptions(l, aim), duration: duration ?? o.span, ...at(l), depthY: y });
			return;
		}
		for (const l of (part === 'charge' ? art.charge : part === 'tick' ? art.tick : art.look) ?? []) {
			// `depthY` = chân vật trên mặt đất: lớp 'world' xếp chiều sâu chung với nhân vật theo nó (lớp khác bỏ qua).
			const opts: VfxOptions = { ...layerOptions(l, aim), duration: duration ?? l.hold, ...at(l), depthY: y };
			// Lớp lặp / đứng yên kéo suốt thời lượng đi kèm (thế đỡ, khiên, tường); lớp thường chỉ phát một lượt (lúc trồi).
			if (o.span && (l.loop || l.stay)) opts.duration = o.span;
			// Vòng báo co đúng hết cửa sổ: tốc khung = số khung / thời lượng.
			if (o.span && l.fit) opts.fps = Math.max(1, this.vfx.frames(l.id).length) / o.span;
			this.vfx.play(l.id, x + (l.dx ?? 0), y - (l.lift ?? 0), opts);
		}
	}

	/**
	 * Đánh mọi quái + hình nộm trong vùng (xét theo CHÂN, nới bằng bề ngang thân). `hitSet` dùng chung giữa nhiều nhát của
	 * cùng một đòn (gai trồi nối đuôi) để mỗi mục tiêu chỉ trúng một lần. `flinch` = false: không giật lùi 10px mỗi lần
	 * trúng (nhịp của vùng tồn tại — giật ra ngoài mỗi nhịp là tự đẩy quái khỏi vùng). `crit`: cộng chí mạng. Trả số mục tiêu trúng.
	 */
	private strikeArea(area: Area, damage: number, element: Element, hx: HitFx | undefined, reportAs: Element = element, hitSet?: Set<object>, flinch = true, crit = 0): number {
		let n = 0;
		for (const f of this.enemies) {
			if (f.dead || hitSet?.has(f) || !inArea(area, f.actor.x, f.actor.y, f.boss ? BOSS_PAD : BODY_PAD)) continue;
			hitSet?.add(f);
			const k = flinch ? knockDir(area, f.actor.x, f.actor.y) : { x: 0, y: 0 };
			this.hit(f, damage, element, k.x, k.y, hx, crit);
			n += 1;
		}
		for (const d of this.dummies) {
			if (hitSet?.has(d) || !inArea(area, d.x, d.y, BODY_PAD)) continue;
			hitSet?.add(d);
			this.hitDummy(d, damage, element, reportAs);
			n += 1;
		}
		return n;
	}

	/**
	 * Dựng vùng tồn tại: hình lặp suốt thời gian, nhịp đầu ngay khung kế. `follow`: vùng đi theo người chơi. Vòi Rồng
	 * (`move`): vùng tự đi theo hướng (dx, dy), hình bám theo vùng. Lôi Vũ: nền mây dùng chung hình Gọi Mưa (`rain_cloud`).
	 */
	private addZone(skill: SkillDef, x: number, y: number, damage: number, dx: number, dy: number, follow = false): void {
		const duration = skill.duration ?? 2;
		const tick = skill.tick ?? 0.5;
		const move = follow ? 0 : (skill.move ?? 0);
		const z: Zone = {
			skill,
			x,
			y,
			r: skill.radius ?? 90,
			left: duration,
			tickLeft: 0,
			ticks: Math.max(1, Math.round(duration / tick)),
			damage,
			pull: skill.pull ?? 0,
			fx: this.hitFxOf(skill),
			follow,
			spin: Math.atan2(dy, dx),
			vx: dx * move,
			vy: dy * move,
			rain: !!skill.rain,
			bolts: !!skill.bolts,
			struck: new Map(),
		};
		this.zones.push(z);
		this.playArt(skill.bolts ? 'call_rain' : skill.id, x, y, dx, dy, duration, follow ? { follow: this.player } : move ? { follow: z } : {});
	}

	/**
	 * Dựng tường vuông góc hướng nhắm tại (x, y): chặn quái đi + đạn quái tới hết giờ. Hình đặt ở mỗi đoạn `WALL_STEP` dọc
	 * tường. Tường Đá (không có `tick`): đá trồi đánh một lần + hất quái đứng trên đường tâm sang hai bên.
	 */
	private addWall(skill: SkillDef, x: number, y: number, dx: number, dy: number, damage: number): void {
		const e = wallEnds(x, y, dx, dy, skill.width ?? 80);
		const duration = skill.duration ?? 5;
		const w: Wall = { ...e, half: WALL_HALF, skill, left: duration, tickLeft: 0, damage, fx: this.hitFxOf(skill) };
		this.walls.push(w);
		const len = Math.hypot(e.bx - e.ax, e.by - e.ay);
		for (const sg of lineSegments(e.ax, e.ay, e.bx - e.ax, e.by - e.ay, len, WALL_STEP)) this.playArt(skill.id, sg.cx, sg.cy, dx, dy, undefined, { span: duration });
		this.hooks.shake(skill.element === 'earth' ? 3 : 1.8, 0.2);
		if (skill.tick) return;
		// Đá trồi: quái đè lên tường bị đánh + hất ra phía nó đang đứng (vuông góc tường), ra khỏi dải chặn.
		const L = len || 1;
		const nx = -(e.by - e.ay) / L;
		const ny = (e.bx - e.ax) / L;
		const reach = WALL_HALF + WALL_BURN;
		for (const f of this.enemies) {
			const pad = f.boss ? BOSS_PAD : BODY_PAD;
			if (f.dead || !inArea({ kind: 'line', ...e, half: reach }, f.actor.x, f.actor.y, pad)) continue;
			const side = Math.sign((f.actor.x - e.ax) * nx + (f.actor.y - e.ay) * ny) || 1;
			this.hit(f, damage, skill.element, nx * side, ny * side, w.fx);
		}
		for (const d of this.dummies) if (inArea({ kind: 'line', ...e, half: reach }, d.x, d.y, BODY_PAD)) this.hitDummy(d, damage, skill.element);
	}

	/** Tường: Tường Lửa đốt quái trong dải sát tường mỗi nhịp (không giật lùi — quái bị chặn vẫn áp sát); hết giờ thì sụp. */
	private updateWalls(dt: number): void {
		for (let i = this.walls.length - 1; i >= 0; i -= 1) {
			const w = this.walls[i]!;
			w.left -= dt;
			const tick = w.skill.tick ?? 0;
			if (tick > 0 && w.left > 0) {
				w.tickLeft -= dt;
				if (w.tickLeft <= 0) {
					w.tickLeft += tick;
					this.strikeArea({ kind: 'line', ax: w.ax, ay: w.ay, bx: w.bx, by: w.by, half: w.half + WALL_BURN }, w.damage, w.skill.element, w.fx, w.skill.element, undefined, false);
				}
			}
			if (w.left > 0) continue;
			// Sụp: bụi dọc tường (tường đá) — tường lửa tự tắt theo hình lặp.
			if (w.skill.element === 'earth') {
				const len = Math.hypot(w.bx - w.ax, w.by - w.ay);
				for (const sg of lineSegments(w.ax, w.ay, w.bx - w.ax, w.by - w.ay, len, WALL_STEP * 2)) this.vfx.play('dust', sg.cx, sg.cy - 10, { tint: 0xc9a46a, scale: 2, fps: 16 });
			}
			this.walls.splice(i, 1);
		}
	}

	/**
	 * Đường vòng tường của quái đang đuổi tới (tx, ty): giữ tường + đầu tường đã chọn tới khi đường thẳng hết bị chắn (không
	 * đổi đầu giữa chừng → không lắc qua lại); tường đã sụp thì bỏ. null = không tường nào chắn.
	 */
	private wallRoute(f: Fighter, tx: number, ty: number, pad: number): Fighter['route'] {
		const a = f.actor;
		let r = f.route;
		if (r && (!this.walls.includes(r.wall as Wall) || !wallBlocks(a.x, a.y, tx, ty, r.wall, pad))) r = null;
		if (!r) {
			const w = this.walls.find((x) => wallBlocks(a.x, a.y, tx, ty, x, pad));
			if (w) r = { wall: w, dir: detourSide(a.x, a.y, tx, ty, w, pad), stuck: 0 };
		}
		f.route = r;
		return r;
	}

	/** Dời quái (đuổi, bị đẩy, bị hút, giật lùi) qua tường trước rồi mới qua `mover` (tường bản đồ) — không xuyên tường tạm. */
	private moveEnemy(f: Fighter, dx: number, dy: number): void {
		const a = f.actor;
		if (this.walls.length) ({ dx, dy } = wallClip(a.x, a.y, dx, dy, this.walls, f.boss ? BOSS_PAD : BODY_PAD));
		this.hooks.mover(a, dx, dy);
	}

	/**
	 * Mưa nhiều điểm (Mưa Băng, Lở Đá): `count` vật rơi rải trong `duration` giây ở các điểm `scatterPoints` quanh (x, y);
	 * mỗi vật rơi `delay` giây (đạn "ma" từ trên cao) rồi nổ bán kính `width` — một mục tiêu trúng được nhiều viên. Bản
	 * PixelLab (khổ 128) to hơn một viên nhiều: chỉ phát ở mỗi viên thứ 3.
	 */
	private barrage(skill: SkillDef, x: number, y: number, dx: number, dy: number, damage: number): void {
		const n = Math.max(1, skill.count ?? 10);
		const span = skill.duration ?? 1.5;
		const fall = Math.max(0.05, skill.delay ?? 0.3);
		const fx = this.hitFxOf(skill);
		const final = this.finalReady(skill.id);
		const shot = TEMP_ART[skill.id]?.shot;
		this.playArt(skill.id, x, y, dx, dy, undefined, { part: 'charge', span: span + fall });
		scatterPoints(n, skill.radius ?? 150).forEach((o, i) => {
			const px = x + o.x;
			const py = y + o.y;
			const t0 = (i * span) / n;
			// Viên phát bản PixelLab (mỗi viên thứ 3): clip tự có cảnh mũi băng cắm xuống — bỏ vật rơi tạm, phát sớm để frame
			// va chạm trùng lúc nổ. Các viên còn lại vẫn là vật rơi tạm (không có hình nổ riêng).
			const big = final && i % 3 === 0;
			if (big) this.schedule(Math.max(0, t0 + fall - this.finalLead(skill.id)), () => this.playArt(skill.id, px, py, dx, dy));
			else this.schedule(t0, () => this.fire({ x: px + 18, y: py - FALL_HEIGHT, vx: -18 / fall, vy: FALL_HEIGHT / fall, life: fall, team: 'player', damage: 0, element: skill.element, pierce: false, ghost: true, look: shot }));
			this.schedule(t0 + fall, () => {
				if (!final) this.playArt(skill.id, px, py, dx, dy);
				this.strikeArea({ kind: 'circle', x: px, y: py, r: skill.width ?? 50 }, damage, skill.element, fx);
				if (i % 3 === 0) this.hooks.shake(1.6, 0.1);
			});
		});
	}

	/** Vùng tồn tại: hút quái (không hút boss) + gây sát thương theo nhịp; hết giờ thì tan. */
	private updateZones(dt: number): void {
		for (let i = this.zones.length - 1; i >= 0; i -= 1) {
			const z = this.zones[i]!;
			z.left -= dt;
			z.tickLeft -= dt;
			if (z.follow) {
				z.x = this.player.x;
				z.y = this.player.y;
			} else if (z.vx || z.vy) {
				z.x += z.vx * dt;
				z.y += z.vy * dt;
			}
			if (z.rain && Math.random() < dt * 40) {
				// Giọt mưa: hạt nước có sẵn rơi thẳng từ chân mây xuống đất.
				const ang = Math.random() * Math.PI * 2;
				const rr = Math.sqrt(Math.random()) * z.r;
				this.particles.spawn(z.x + Math.cos(ang) * rr, z.y + Math.sin(ang) * rr * GROUND_SQUASH - 130, this.tex.spark.water[0]!, 0, 420, 0.31);
			}
			if (z.pull > 0) {
				for (const f of this.enemies) {
					if (f.dead || f.boss || !inArea({ kind: 'circle', x: z.x, y: z.y, r: z.r * 1.3 }, f.actor.x, f.actor.y, BODY_PAD)) continue;
					const st = pullStep(f.actor.x, f.actor.y, z.x, z.y, z.pull, dt);
					this.moveEnemy(f, st.dx, st.dy);
				}
			}
			if (z.tickLeft <= 0 && z.ticks > 0) {
				z.ticks -= 1;
				z.tickLeft += z.skill.tick ?? 0.5;
				if (z.rain) {
					this.rainTick(z);
					if (z.left <= 0) this.zones.splice(i, 1);
					continue;
				}
				if (z.bolts) {
					this.thunderVolley(z);
					if (z.left <= 0) this.zones.splice(i, 1);
					continue;
				}
				if (z.follow) {
					// Lưỡi gió xoay quanh người: hai vệt chém đối xứng, mỗi nhịp xoay thêm một góc.
					for (let k = 0; k < 2; k += 1) {
						const ang = z.spin + k * Math.PI;
						this.vfx.play('slash', z.x + Math.cos(ang) * z.r * 0.55, z.y - 30 + Math.sin(ang) * z.r * 0.35, { rotation: ang + Math.PI / 2, tint: ELEMENT_TINT[z.skill.element], fps: 30 });
					}
					z.spin += 1.15;
				}
				this.strikeArea({ kind: 'circle', x: z.x, y: z.y, r: z.r }, z.damage, z.skill.element, z.fx, z.skill.element, undefined, false);
			}
			if (z.left <= 0) this.zones.splice(i, 1);
		}
	}

	/** Gọi Mưa: làm ướt (đầy thời lượng ướt) mọi quái + hình nộm trong vùng — không sát thương, không gây phản ứng. */
	private rainTick(z: Zone): void {
		for (const f of this.enemies) if (!f.dead && inCircle(f.actor.x, f.actor.y, z.x, z.y, z.r, f.boss ? BOSS_PAD : BODY_PAD)) this.soak(f);
		for (const d of this.dummies) if (inCircle(d.x, d.y, z.x, z.y, z.r, BODY_PAD)) this.soak(d);
		for (let k = 0; k < 3; k += 1) {
			const ang = Math.random() * Math.PI * 2;
			const rr = Math.sqrt(Math.random()) * z.r;
			this.playArt(z.skill.id, z.x + Math.cos(ang) * rr, z.y + Math.sin(ang) * rr * GROUND_SQUASH, 1, 0, undefined, { part: 'tick' });
		}
	}

	private soak(t: Status): void {
		t.wet = Math.max(t.wet, WET_SECONDS * this.fx.wet);
	}

	/** Người chơi đang đứng trong mưa của chính mình (Mạch Nguồn). */
	private inOwnRain(): boolean {
		const p = this.player;
		return this.zones.some((z) => z.rain && inCircle(p.x, p.y, z.x, z.y, z.r));
	}

	/**
	 * Lôi Vũ — một nhịp sét: mỗi tia một mục tiêu trong vùng, quái ƯỚT trước (`skillRules.pickBolts`); mây đứng trong mưa
	 * của mình (tâm Lôi Vũ trong vùng Gọi Mưa) thì sét dày gấp đôi. Đòn hệ Thuỷ: giữ quái ướt cho nhịp sau, hút máu được.
	 */
	private thunderVolley(z: Zone): void {
		const inRain = this.zones.some((r) => r !== z && r.rain && inCircle(z.x, z.y, r.x, r.y, r.r));
		const cands: { x: number; y: number; wet: boolean; struck: number; f?: Fighter; d?: Dummy }[] = [
			...this.enemies.filter((f) => !f.dead && inCircle(f.actor.x, f.actor.y, z.x, z.y, z.r, f.boss ? BOSS_PAD : BODY_PAD)).map((f) => ({ x: f.actor.x, y: f.actor.y, wet: f.wet > 0, struck: z.struck.get(f) ?? 0, f })),
			...this.dummies.filter((d) => inCircle(d.x, d.y, z.x, z.y, z.r, BODY_PAD)).map((d) => ({ x: d.x, y: d.y, wet: d.wet > 0, struck: z.struck.get(d) ?? 0, d })),
		];
		const picks = pickBolts(cands, z.x, z.y, thunderBolts(inRain));
		for (const i of picks) {
			const c = cands[i]!;
			const who = (c.f ?? c.d)!;
			z.struck.set(who, c.struck + 1);
			this.playArt(z.skill.id, c.x, c.y);
			if (c.f) this.hit(c.f, z.damage, z.skill.element, 0, 0, z.fx);
			else if (c.d) this.hitDummy(c.d, z.damage, z.skill.element);
		}
		if (picks.length) {
			this.flashScreen(0xd6ecff, 0.14);
			this.hooks.shake(1.6, 0.12);
		}
	}

	/** Lướt Gió dừng: vệt gió dọc quãng đã lướt THẬT (đụng tường thì ngắn lại), chém sau một nhịp ngắn. */
	private trailStrike(t: DashTrail, toX: number, toY: number): void {
		const len = Math.hypot(toX - t.fromX, toY - t.fromY);
		if (len < 4) return;
		const dx = (toX - t.fromX) / len;
		const dy = (toY - t.fromY) / len;
		for (const sg of lineSegments(t.fromX, t.fromY, dx, dy, len, 42)) this.schedule(0.04 + sg.i * 0.02, () => this.playArt(t.skillId, sg.cx, sg.cy, dx, dy));
		this.schedule(0.1, () => {
			const n = this.strikeArea({ kind: 'line', ax: t.fromX, ay: t.fromY, bx: toX, by: toY, half: t.half }, t.damage, t.element, t.fx, t.element === 'wind' ? 'wind' : 'steel', undefined, true, t.crit);
			// Vệt lướt KIẾM (Đột Kích) là một nhát chém — Thế Áp Đảo đếm; Lướt Gió là phép.
			if (!t.windy) this.pressLanded(n);
			if (n > 0 && !t.windy) {
				this.hooks.shake(2, 0.14);
				this.hitStop = Math.max(this.hitStop, 0.06);
			}
		});
	}

	/**
	 * Một nhát chém hình quạt từ ngực (ox, oy) theo hướng (dx, dy): trúng mọi quái + hình nộm trong tầm `reach` và trong
	 * nửa góc `arc` độ (thiếu = cos 0,3 như Trảm cũ). `reportAs`: hệ báo cho nhiệm vụ luyện tập (nhát chém vẫn là 'steel').
	 * Trả số mục tiêu trúng (Thế Áp Đảo: hụt hẳn thì về 0).
	 */
	private sweep(ox: number, oy: number, dx: number, dy: number, reach: number, arc: number | undefined, damage: number, el: Element, hx: HitFx | undefined, crit: number, reportAs: Element): number {
		const cosMin = arc ? Math.cos((arc * Math.PI) / 180) : 0.3;
		let n = 0;
		for (const f of this.enemies) {
			if (f.dead) continue;
			const ex = f.actor.x - ox;
			const ey = f.actor.y - 30 - oy;
			const d = Math.hypot(ex, ey);
			if (d > reach || (ex * dx + ey * dy) / (d || 1) < cosMin) continue;
			this.hit(f, damage, el, dx, dy, hx, crit);
			n += 1;
		}
		for (const d of this.dummies) {
			const ex = d.x - ox;
			const ey = d.y - 30 - oy;
			const dd = Math.hypot(ex, ey);
			if (dd > reach || (ex * dx + ey * dy) / (dd || 1) < cosMin) continue;
			this.hitDummy(d, damage, el, reportAs);
			n += 1;
		}
		return n;
	}

	// ———————————————————————————— Kiếm lưu phái: thế đỡ, Ảnh Bộ ————————————————————————————

	/** Ảnh Bộ: mục tiêu gần hướng nhắm nhất trong tầm (quái còn sống hoặc hình nộm); null = không có. */
	private blinkTarget(aim: { x: number; y: number }, skill: SkillDef): { x: number; y: number; boss: boolean } | null {
		const p = this.player;
		const cands = [...this.enemies.filter((f) => !f.dead).map((f) => ({ x: f.actor.x, y: f.actor.y, boss: f.boss })), ...this.dummies.map((d) => ({ x: d.x, y: d.y, boss: false }))];
		const i = pickAhead(p.x, p.y, aim.x - p.x, aim.y - (p.y - p.chest), skill.range ?? 260, skill.angle ?? 60, cands);
		return i >= 0 ? cands[i]! : null;
	}

	/**
	 * Dịch ra sau lưng mục tiêu: từng bước nhỏ qua `mover` (đụng tường thì dừng, không xuyên tường), để lại bóng ở chỗ cũ,
	 * miễn thương ngắn. Chưa có động tác "ảnh bộ" — dịch tức thời (ghi ở `TEMP_ART.shadow_step`).
	 */
	private blinkTo(t: { x: number; y: number; boss: boolean }, skill: SkillDef): void {
		const p = this.player;
		this.playArt(skill.id, p.x, p.y, 1, 0, undefined, { part: 'charge' });
		const to = behindPoint(p.x, p.y, t.x, t.y, BLINK_BEHIND + (t.boss ? 10 : 0));
		const mx = to.x - p.x;
		const my = to.y - p.y;
		const steps = Math.max(1, Math.ceil(Math.hypot(mx, my) / 8));
		for (let i = 0; i < steps; i += 1) this.hooks.mover(p, mx / steps, my / steps);
		this.pc.iframes = Math.max(this.pc.iframes, skill.iframes ?? 0.3);
	}

	/** Thôi giữ thế (hết giờ, né, ra đòn khác, gục, bị ngắt): trả màu nhân vật. */
	private endGuard(): void {
		if (!this.pc.guard) return;
		this.pc.guard = null;
		if (this.player) this.player.view.sprite.tint = 0xffffff;
	}

	/**
	 * Đòn của quái sắp trúng người chơi. Thứ tự: né ĐÚNG LÚC (Phản Đòn — tự phản chí mạng) → đang miễn thương (không gì cả) →
	 * thế đỡ (Thủy Thần: hoá giải + phản, hoặc chỉ giảm — `skillRules.guardOutcome`) → Bóng Mờ (né hoàn toàn) → mất máu.
	 */
	private incoming(kind: IncomingKind, amount: number, from: Fighter | null = null, shot: Projectile | null = null): void {
		const pc = this.pc;
		if (pc.dead) return;
		// Phản Đòn (Thủy Thần 7): đòn chạm trong `COUNTER.perfect` giây sau khi bấm né → chém trả kẻ đánh / hất đạn ngược. Một
		// cú né chỉ phản một lần (bầy cùng đánh thì các đòn sau chỉ trượt vào i-frame như thường).
		if (this.perfectDodge() && ((kind === 'melee' && from && !from.dead) || (kind === 'shot' && shot))) {
			this.dodgeAt = -99;
			return this.riposte(from, shot);
		}
		if (pc.iframes > 0) return;
		const g = pc.guard;
		if (g) {
			const o = guardOutcome(g.kind, kind);
			if (o.counter) {
				g.blocks += 1;
				// Phản Đòn: đỡ ĐÚNG LÚC (Lưu Thủy Phản; Thế Tĩnh trong `COUNTER.perfect` giây đầu) → nhát phản chắc chắn chí mạng.
				const crit = this.fx.riposte && perfectTiming(g.kind, g.total - g.t) ? 1 : 0;
				if (o.ends) {
					this.endGuard();
					pc.iframes = Math.max(pc.iframes, GUARD.parryIframes);
				}
				return this.counter(g, from, shot, crit);
			}
			this.float(this.player.x, this.player.y - this.player.height - 26, 'Gạt', 0xbfeaff, 12);
			// Gạt đạn / đòn vùng bằng thế đỡ cũng là "đỡ đòn" (Xoáy Nước), dù không phản.
			this.guardAt = this.time;
			amount *= o.mult;
		}
		// Bóng Mờ (Bắc Thần 9): chỉ tung xúc xắc khi có bị động — không đụng chuỗi ngẫu nhiên của trận thường.
		if (this.fx.evade > 0 && Math.random() < this.fx.evade) return this.blurEvade();
		this.hurtPlayer(amount);
	}

	/** Phản Đòn: vừa bấm né (≤ `COUNTER.perfect` giây) — đòn chạm bây giờ là "né đúng lúc". */
	private perfectDodge(): boolean {
		return this.fx.riposte && perfectTiming('dodge', this.time - this.dodgeAt);
	}

	/**
	 * Nhát phản của thế đỡ: đòn cận chiến → chém trả kẻ đánh; đạn (chỉ Lưu Thủy Phản) → hất ngược về phía kẻ bắn. Sát thương =
	 * `Guard.damage` (đã tính lúc vào thế). `crit` = 1: đỡ đúng lúc (Phản Đòn).
	 */
	private counter(g: Guard, from: Fighter | null, shot: Projectile | null, crit = 0): void {
		const parry = g.kind === 'parry';
		this.counterStrike({ damage: g.damage, element: g.element, art: g.skillId, strong: parry, crit, label: parry ? 'Phản đòn!' : 'Chặn!' }, from, shot);
	}

	/**
	 * Phản Đòn — né đúng lúc (không có thế đỡ): tự chém trả kẻ đánh ×`PASSIVE.ripostePower` (sức kiếm × thưởng chiều sâu
	 * Kiếm; mang hệ đang phủ lên kiếm) hoặc hất đạn ngược về kẻ bắn — chắc chắn chí mạng.
	 */
	private riposte(from: Fighter | null, shot: Projectile | null): void {
		const p = this.player;
		this.float(p.x, p.y - p.height - 26, 'Né đúng lúc!', 0xbff4ff, 13);
		this.counterStrike({ damage: this.swordDamage(PASSIVE.ripostePower), element: this.enchantElement() ?? 'steel', art: 'riposte', strong: true, crit: 1, label: 'Phản đòn!' }, from, shot);
	}

	/**
	 * Một nhát phản (thế đỡ, né đúng lúc): đòn cận chiến → chém trả kẻ đánh (động tác attack sẵn có, không khoá người chơi);
	 * đạn → hất ngược thành đạn của người chơi bay về phía kẻ bắn. Xong thì tính là phản đòn thành công (`onCounter`).
	 */
	private counterStrike(o: { damage: number; element: Element; art: string; strong: boolean; crit: number; label: string }, from: Fighter | null, shot: Projectile | null): void {
		const p = this.player;
		this.float(p.x, p.y - p.height - 8, o.label, o.strong ? 0x9fe8ff : 0xd8f4ff, o.strong ? 16 : 13);
		if (o.crit >= 1) this.float(p.x, p.y - p.height - 44, 'Đúng lúc!', 0xffe28a, 12);
		this.hitStop = Math.max(this.hitStop, o.strong ? 0.12 : 0.06);
		this.hooks.shake(o.strong ? 3 : 1.6, 0.15);
		if (o.strong) this.flashScreen(0xbff4ff, 0.22);
		if (from && !from.dead) {
			const dx = from.actor.x - p.x;
			const dy = from.actor.y - p.y;
			this.swingAt(directionOf(dx, dy));
			this.slashFx(p.x, p.y - p.chest, dx, dy, o.element);
			this.playArt(o.art, from.actor.x, from.actor.y - from.actor.chest, dx, dy);
			this.hit(from, o.damage, o.element, dx, dy, undefined, o.crit);
		} else if (shot) {
			const sp = Math.hypot(shot.vx, shot.vy) || 1;
			this.swingAt(directionOf(-shot.vx, -shot.vy));
			this.playArt(o.art, shot.x, shot.y, -shot.vx, -shot.vy);
			this.fire({ x: shot.x, y: shot.y, vx: (-shot.vx / sp) * 420, vy: (-shot.vy / sp) * 420, life: 0.9, team: 'player', damage: o.damage, element: o.element, pierce: false, look: TEMP_ART[o.art]?.shot, crit: o.crit });
		}
		this.onCounter();
	}

	/**
	 * Phản đòn thành công (chặn-phản, đỡ-phản, gạt đạn của Dòng Chảy Ngược, né đúng lúc): mở cửa sổ Xoáy Nước; Mặt Hồ Phẳng
	 * (Thủy Thần 9) hồi máu.
	 */
	private onCounter(): void {
		this.guardAt = this.time;
		const pc = this.pc;
		const p = this.player;
		// Mặt Hồ Phẳng có hồi nội: loạt 3 viên đạn gạt cùng lúc / bầy chém dồn vào thế đỡ chỉ hồi một lần mỗi `lakeCooldown` giây.
		if (!this.fx.lake || pc.dead || !p || this.time - this.lakeAt < PASSIVE.lakeCooldown) return;
		this.lakeAt = this.time;
		this.playArt('lake_heal', p.x, p.y, 1, 0, undefined, { follow: p });
		const heal = Math.round(pc.hpMax * PASSIVE.lakeHeal);
		if (heal < 1 || pc.hp >= pc.hpMax) return;
		pc.hp = Math.min(pc.hpMax, pc.hp + heal);
		this.float(p.x - 12, p.y - p.height - 4, `+${heal}`, 0x5be38a, 12);
	}

	/** Bóng Mờ (Bắc Thần 9): đòn này bị né hoàn toàn — bóng mờ tách khỏi người. */
	private blurEvade(): void {
		const p = this.player;
		this.float(p.x, p.y - p.height - 8, 'Bóng Mờ', 0xd8dcff, 13);
		this.playArt('blur_evade', p.x, p.y);
	}

	/** Phát động tác vung (attack) theo hướng `dir` mà KHÔNG khoá người chơi (phản đòn); nhân vật đang vung thì thôi. */
	private swingAt(dir: Direction): void {
		const v = this.player.view;
		if (v.busy) return;
		const timing = v.actionTiming('attack', dir, 0.35);
		if (timing && v.playAction('attack', dir, { timing, external: false })) this.hooks.onAction?.('attack', dir, 'slash');
		else v.set(v.baseAnimation, dir);
	}

	/** Hình trúng đòn theo hệ (Thổ: hình tạm `earth_hit`). */
	private impact(element: ShotKind, x: number, y: number, alpha?: number): void {
		if (element === 'earth') return this.playArt('earth_hit', x, y);
		this.vfx.play(IMPACT_VFX[element], x, y, { fps: 26, alpha, blend: element === 'fire' || element === 'aether' ? 'add' : 'normal' });
	}

	/** Hình của phản ứng: hiệu ứng atlas có sẵn, hoặc hình tạm (`TEMP_ART.react_*`) của phản ứng Thổ. */
	private playReaction(r: { vfx?: VfxId; art?: string }, x: number, y: number): void {
		if (r.art) return this.playArt(r.art, x, y);
		if (r.vfx) this.vfx.play(r.vfx, x, y, { fps: 18, blend: r.vfx === 'fire_flash' ? 'add' : 'normal' });
	}

	/** Đồng hồ của đòn đang diễn + lệnh bấm chờ. Chạy theo dt của game (hit-stop làm khựng cả động tác). */
	private updateAction(dt: number): void {
		const pc = this.pc;
		const c = pc.charging;
		if (c) {
			// Dồn lực xong: vào động tác như vừa bấm (cùng frame — khung chạm có thể nổ ngay bên dưới).
			c.t -= dt;
			if (c.t <= 0) {
				pc.charging = null;
				c.begin();
			}
		}
		const a = pc.action;
		if (a) {
			a.t += dt;
			if (!a.released && a.t + ACTION_EPS >= a.timing.releaseAt) {
				a.released = true;
				this.release(a, true);
			}
			if (a.t + ACTION_EPS >= a.timing.dur) {
				if (this.lingers(a)) this.player.view.seekAction(a.timing.dur - 2 * ACTION_EPS);
				else {
					this.player.view.endAction();
					pc.action = null;
				}
			} else this.player.view.seekAction(a.t);
		}
		const dodge = pc.pendingDodge;
		if (dodge && (!pc.action || this.pastCancel(pc.action))) {
			pc.pendingDodge = null;
			this.dodge(dodge);
		}
		const b = pc.buffered;
		if (!b) return;
		b.ttl -= dt;
		const skill = this.skills[b.index];
		if (b.ttl <= 0 || !skill) {
			pc.buffered = null;
			return;
		}
		const cur = pc.action;
		if (pc.dash || pc.charging || (cur && !this.pastCancel(cur)) || (pc.cooldowns.get(skill.id) ?? 0) > this.time) return;
		pc.buffered = null;
		this.cast(b.index, b.aim);
	}

	/**
	 * Huỷ đòn đang diễn. `refund`: đòn chưa tới khung chạm thì trả lại MP + hồi chiêu (bị ngắt thì không mất
	 * lượt). Gọi khi gục ngã, đổi sprite, thoại/thẻ mở, dịch chuyển, né.
	 */
	cancelAction(refund: boolean): void {
		const pc = this.pc;
		const a = pc.action;
		if (a && !a.released && refund) {
			pc.mp = Math.min(pc.mpMax, pc.mp + a.mpPaid);
			pc.cooldowns.set(a.skill.id, a.prevCooldown);
		}
		if (a) this.stopAction(a);
		// Đang dồn lực = chưa vào động tác: huỷ thì hoàn lại như đòn chưa tới khung chạm.
		const c = pc.charging;
		if (c && refund) {
			pc.mp = Math.min(pc.mpMax, pc.mp + c.mpPaid);
			pc.cooldowns.set(c.skill.id, c.prevCooldown);
		}
		pc.charging = null;
		pc.buffered = null;
		pc.pendingDodge = null;
	}

	/** Ngắt đòn từ bên ngoài (Game: thoại mở, dịch chuyển, đổi tuổi) — luôn hoàn lại nếu chưa tới khung chạm; thôi giữ thế. */
	interrupt(): void {
		this.cancelAction(true);
		this.endGuard();
	}

	/**
	 * Đã qua mốc huỷ (khung chạm đã hiện trọn 1 frame) mà người chơi di chuyển/ra đòn mới: bỏ pha thu thế ngay —
	 * không "dính chân". Trước `cancelAt` thì không làm gì: cắt ở `released` là nhát chém chỉ lộ 1 frame render.
	 */
	endRecovery(): void {
		const a = this.pc.action;
		if (!a || !this.pastCancel(a)) return;
		this.stopAction(a);
	}

	/** Đòn đã qua mốc cho phép cắt ngang (đi, né, đòn kế). */
	private pastCancel(a: PlayerAction): boolean {
		return a.t + ACTION_EPS >= a.timing.cancelAt;
	}

	/**
	 * Động tác đã diễn hết nhưng phím của đòn vẫn giữ và hồi chiêu sắp hết → đứng ở frame cuối chờ đòn kế.
	 * Chặn tổng thời gian đứng (dur + HOLD_LINGER): hồi chiêu hết đúng frame này thì lệnh lặp ở frame KẾ mới tung,
	 * còn lệnh không tung được (vd hết MP) thì không đứng mãi.
	 */
	private lingers(a: PlayerAction): boolean {
		if (!this.heldSkills.has(a.index)) return false;
		const wait = (this.pc.cooldowns.get(a.skill.id) ?? 0) - this.time;
		return wait <= HOLD_LINGER && a.t < a.timing.dur + HOLD_LINGER;
	}

	/** Dừng hình + bỏ đòn; cắt khi động tác chưa diễn hết thì báo máy người khác dừng theo. */
	private stopAction(a: PlayerAction): void {
		this.player?.view.cancelAction();
		this.pc.action = null;
		if (a.t + ACTION_EPS < a.timing.dur) this.hooks.onActionEnd?.();
	}

	dodge(dir: { x: number; y: number }): void {
		const pc = this.pc;
		const cost = this.dodgeStamina;
		if (pc.dead || pc.dash || pc.stamina < cost) return;
		// Né là lối thoát: thôi giữ thế, bỏ dồn lực (hoàn lại MP + hồi chiêu).
		this.endGuard();
		if (pc.charging) this.cancelAction(true);
		// Né là lối thoát khỏi đòn của quái: huỷ pha vào thế (hoàn lại) hoặc bỏ pha thu thế. Đúng lúc khung chạm
		// đang hiện (released, chưa tới cancelAt) thì hẹn lăn ngay khi qua mốc — chậm tối đa 1 frame động tác.
		const a = pc.action;
		if (a && !a.released) this.cancelAction(true);
		else if (a && !this.pastCancel(a)) {
			pc.pendingDodge = { x: dir.x, y: dir.y };
			return;
		} else this.endRecovery();
		let { x, y } = dir;
		if (!x && !y) {
			const facing = { S: [0, 1], N: [0, -1], E: [1, 0], W: [-1, 0], SE: [1, 1], SW: [-1, 1], NE: [1, -1], NW: [-1, -1] }[this.player.view.direction]!;
			[x, y] = facing as [number, number];
		}
		const len = Math.hypot(x, y) || 1;
		pc.stamina -= cost;
		pc.iframes = 0.32;
		pc.dash = { vx: (x / len) * 560, vy: (y / len) * 560, t: DODGE_TIME, damage: 0, hit: new Set() };
		this.vfx.play('dust', this.player.x, this.player.y - 10, { fps: 22 });
		// Phản Đòn: mốc + chỗ đứng lúc bấm né — đòn quái chạm trong `COUNTER.perfect` giây sau đó là "né đúng lúc".
		this.dodgeAt = this.time;
		this.dodgeFrom.x = this.player.x;
		this.dodgeFrom.y = this.player.y;
		// Đà Lướt (Bắc Thần 7): vài đòn Kiếm kế (trong hạn) nhanh hơn.
		if (this.fx.momentum) {
			this.momentum = { n: PASSIVE.momentumHits, until: this.time + DODGE_TIME + PASSIVE.momentumSeconds };
			this.playArt('momentum', this.player.x, this.player.y, x, y, undefined, { follow: this.player });
		}
		// Mắt Bão (Phong 7): lăn xong thì chạy nhanh hơn một lúc.
		if (this.fx.dodgeHaste > 1) {
			this.hasteT = DODGE_TIME + PASSIVE.eyeSeconds;
			this.playArt('eye_haste', this.player.x, this.player.y, x, y, undefined, { follow: this.player });
		}
	}

	usePotion(): void {
		const pc = this.pc;
		if (pc.dead) return;
		if (pc.potions <= 0) return void this.hooks.toast('Hết bình hồi phục', 'warn');
		if (pc.hp >= pc.hpMax) return;
		pc.potions -= 1;
		const amount = Math.round(pc.hpMax * 0.5);
		pc.hp = Math.min(pc.hpMax, pc.hp + amount);
		this.float(this.player.x, this.player.y - this.player.height - 8, `+${amount}`, 0x5be38a, 15);
		this.vfx.play('sparkle', this.player.x, this.player.y - this.player.chest - 4, { tint: 0xff9fb0, blend: 'add', fps: 20 });
	}

	grantExp(amount: number): void {
		const pc = this.pc;
		// Cấp tối đa: không nhận thêm EXP (thanh EXP để đầy).
		if (pc.level >= MAX_LEVEL) return;
		pc.exp += amount;
		this.hooks.toast(`+${amount} EXP`, 'exp');
		while (pc.level < MAX_LEVEL && pc.exp >= expForLevel(pc.level)) {
			pc.exp -= expForLevel(pc.level);
			pc.level += 1;
			this.applyLevel(true);
			if (this.hooks.levelUp) this.hooks.levelUp(pc.level);
			else this.hooks.toast(`Lên cấp ${pc.level}!`, 'level');
			const p = this.player;
			this.vfx.play('light_pillar', p.x, p.y - pillar(p), { blend: 'add', follow: p, followOffset: { x: 0, y: -pillar(p) }, fps: 16 });
			this.vfx.play('sparkle', p.x, p.y - p.chest - 4, { blend: 'add', fps: 16 });
			this.vfx.play('magic_circle', p.x, p.y, { layer: 'ground', tint: 0xffe28a, follow: p, fps: 14 });
		}
		if (pc.level >= MAX_LEVEL) pc.exp = 0;
	}

	// ———————————————————————————— vòng lặp ————————————————————————————

	/**
	 * `frozen`: thoại/thẻ đang mở và người chơi bị khoá phím → dừng hẳn mô phỏng (quái không đánh, đạn
	 * không bay, hồi chiêu đứng yên), chỉ cho hiệu ứng đang dở chạy nốt để màn hình không đứng hình.
	 */
	update(dt: number, toScreen: (x: number, y: number) => { x: number; y: number }, zoom: number, frozen = false): void {
		if (frozen) {
			this.particles.update(dt);
			// Hình có thời lượng (tường, mây, khiên, vùng) đứng theo đồng hồ trận — chỉ hình phát một lượt chạy nốt.
			this.vfx.update(dt, true);
			this.screenFlash.alpha = Math.max(0, this.screenFlash.alpha - dt * 2.2);
			this.drawOverlays(dt, toScreen, zoom);
			return;
		}
		this.time += dt;
		const pc = this.pc;
		const p = this.player;

		if (pc.dead) {
			pc.respawnT -= dt;
			if (pc.respawnT <= 0) {
				const at = this.hooks.playerRespawn();
				Object.assign(p, at);
				pc.dead = false;
				pc.action = null;
				pc.buffered = null;
				pc.pendingDodge = null;
				pc.charging = null;
				pc.ward = null;
				this.endGuard();
				pc.hp = pc.hpMax;
				pc.mp = pc.mpMax;
				p.root.alpha = 1;
				this.vfx.play('light_pillar', p.x, p.y - pillar(p), { blend: 'add', follow: p, followOffset: { x: 0, y: -pillar(p) } });
				this.hooks.toast('Bạn tỉnh lại ở quảng trường Thistlewood', 'info');
			}
		} else {
			pc.mp = Math.min(pc.mpMax, pc.mp + MP_REGEN * dt);
			if (!pc.dash) pc.stamina = Math.min(pc.staminaMax, pc.stamina + 32 * dt);
			if (this.time - pc.lastHurt > 5) pc.hp = Math.min(pc.hpMax, pc.hp + 2 * dt);
			pc.iframes = Math.max(0, pc.iframes - dt);
			p.root.alpha = pc.iframes > 0 ? 0.6 + 0.4 * Math.sin(this.time * 40) : 1;
			// Tâm Tĩnh: đứng yên bao lâu (Game dời người chơi TRƯỚC `update` — so với vị trí frame trước là biết có nhích không).
			const moved = Math.abs(p.x - this.lastPos.x) + Math.abs(p.y - this.lastPos.y) > 0.01;
			this.stillT = moved ? 0 : this.stillT + dt;
			const g = pc.guard;
			if (g) {
				// Đang giữ thế: nhuộm nhân vật xanh nhạt (Lưu Thủy Phản nhấp nháy — cửa sổ đỡ đang mở).
				g.t -= dt;
				p.view.sprite.tint = g.kind === 'parry' ? (Math.floor(g.t * 16) % 2 ? 0x9fe8ff : 0xe4fbff) : 0xcfeeff;
				if (g.t <= 0) this.endGuard();
			}
			if (pc.ward) {
				pc.ward.t -= dt;
				if (pc.ward.t <= 0) pc.ward = null;
			}
			this.hasteT = Math.max(0, this.hasteT - dt);
			// Bất Khuất: vừa tụt dưới ngưỡng máu thì báo một lần (hào quang đỏ nhắc lại mỗi giây ở `passiveRegen`).
			const rage = this.rageLive;
			if (rage && !this.rageOn) {
				this.float(p.x, p.y - p.height - 22, 'Bất Khuất!', 0xff8a7a, 14);
				this.playArt('rage_aura', p.x, p.y, 1, 0, undefined, { follow: p });
			}
			this.rageOn = rage;
			this.regenT += dt;
			if (this.regenT >= 1) {
				this.regenT -= 1;
				this.passiveRegen();
			}
		}
		this.lastPos.x = p.x;
		this.lastPos.y = p.y;

		if (pc.dash) {
			const d = pc.dash;
			const step = Math.min(dt, d.t);
			this.hooks.mover(p, d.vx * step, d.vy * step);
			d.t -= step;
			const tr = d.trail;
			if (tr?.windy) {
				// Lướt Gió: rắc hạt gió + vệt xoáy nhỏ dọc đường (vệt chém thật đợi lướt xong).
				if (Math.random() < dt * 60) this.particles.spawn(p.x + (Math.random() - 0.5) * 16, p.y - 20 - Math.random() * 30, this.tex.spark.wind[Math.floor(Math.random() * 2)]!, -d.vx * 0.05, -d.vy * 0.05, 0.4);
				tr.spark -= step;
				if (tr.spark <= 0) {
					tr.spark = 0.06;
					this.vfx.play('wind_spin', p.x, p.y - 26, { fps: 24, alpha: 0.7 });
				}
			} else if (tr) {
				// Đột Kích: bụi cuốn dày dọc đường lướt (vệt chém thật đợi lướt xong).
				if (Math.random() < dt * 70) this.particles.spawn(p.x + (Math.random() - 0.5) * 12, p.y - 14 - Math.random() * 30, this.tex.spark.dust[0]!, -d.vx * 0.04, -d.vy * 0.04, 0.3);
			} else if (Math.random() < dt * 40) this.particles.spawn(p.x, p.y - 30, this.tex.spark.dust[0]!, 0, 0, 0.25);
			if (tr && d.t <= 0) this.trailStrike(tr, p.x, p.y);
			if (d.damage > 0) {
				const reach = d.reach ?? DASH_REACH;
				for (const f of this.enemies) {
					if (f.dead || d.hit.has(f) || Math.hypot(f.actor.x - p.x, f.actor.y - p.y) >= reach) continue;
					d.hit.add(f);
					this.hit(f, d.damage, d.element ?? 'steel', d.vx, d.vy, d.fx, d.crit ?? 0);
				}
				for (const dm of this.dummies) {
					if (d.hit.has(dm) || Math.hypot(dm.x - p.x, dm.y - p.y) >= reach) continue;
					d.hit.add(dm);
					this.hitDummy(dm, d.damage, d.element ?? 'steel', 'steel');
				}
				if (d.t <= 0) {
					this.slashFx(p.x, p.y - p.chest, d.vx, d.vy, d.element ?? 'steel');
					if (d.skillId) this.playArt(d.skillId, p.x, p.y, d.vx, d.vy);
					this.pressLanded(d.hit.size);
				}
			}
			if (d.t <= 0) pc.dash = null;
		}

		// Sau khối lăn né, trước quái: đòn bấm frame này (t = 0) → tới đây cộng dt, khung chạm và hiệu ứng cùng một frame.
		if (!pc.dead) this.updateAction(dt);
		this.updateEnemies(dt);
		this.updateDummies(dt);
		this.updateProjectiles(dt);
		this.updateZones(dt);
		this.updateWalls(dt);
		this.updatePending(dt);
		this.updateTelegraphs(dt);
		this.particles.update(dt);
		this.vfx.update(dt);
		this.screenFlash.alpha = Math.max(0, this.screenFlash.alpha - dt * 2.2);
		this.drawOverlays(dt, toScreen, zoom);
	}

	private updateEnemies(dt: number): void {
		const p = this.player;
		const pc = this.pc;
		for (const f of this.enemies) {
			const a = f.actor;
			f.flash = Math.max(0, f.flash - dt);
			// Nháy trắng báo đòn khi KHÔNG có động tác; có động tác thì chỉ nháy (nhạt hơn) trong đoạn dáng vung chưa tự báo được
			// (`cueUntil`: đứng chờ ở frame 0, hoặc vào thế chỉ có 1 frame).
			const cue = f.windup > 0 && (!f.swing || f.swing.t < f.swing.plan.cueUntil) && Math.floor(f.windup * 24) % 2 === 0;
			const winding = cue ? (f.swing ? 0xffecec : 0xffe0e0) : 0;
			a.view.sprite.tint = f.flash > 0 ? 0xff9a9a : winding || (f.freeze > 0 ? 0x7fcfff : f.stun > 0 ? 0xfff0a8 : f.chill > 0 ? 0xb8ecff : f.slow > 0 ? 0xd9b98a : 0xffffff);
			if (f.dead) {
				f.deathT += dt;
				a.root.alpha = Math.max(0, 1 - f.deathT / 0.7);
				a.root.y = Math.round(a.y + f.deathT * 14);
				if (respawnDelay(f) !== null && !f.net) {
					f.respawnT -= dt;
					// Boss vùng hết giờ mà người chơi còn đứng trong vùng canh thì chờ tiếp — không hiện ra sát cạnh rồi đánh ngay.
					const pd = pc.dead ? null : Math.hypot(p.x - f.home.x, p.y - f.home.y);
					if (f.respawnT <= 0 && regionBossMayWake(f, pd, f.home.radius + f.stats.aggro)) this.respawn(f);
				}
				continue;
			}
			if (f.burn > 0) {
				const before = Math.floor(f.burn / 0.5);
				f.burn -= dt;
				if (Math.floor(Math.max(0, f.burn) / 0.5) !== before) {
					// Dung Nham: cháy mạnh — mỗi nhịp đốt nhân `burnPower`, lửa đỏ sẫm hơn. Hoả Thân (Hoả 9) ×1,5; quái ướt
					// (Thuỷ Triều Dâng) / đang choáng (Trọng Lực) nhận thêm như mọi nguồn. Nhịp đốt giết quái = chết lúc đang cháy (Tro Tàn).
					// Đốt là sát thương phép: tính theo `magicAtk()` (ATK + Phép thuật của trang bị) như Tro Tàn / vụn băng.
					const lava = f.burnPower > 1;
					this.damage(f, Math.max(1, Math.round(this.magicAtk() * 0.18 * f.burnPower * this.fx.burnDamage * this.vulnerability(f))), lava ? 0xff6a2a : 0xffa23d, false, true);
					this.vfx.play('flame', a.x + (Math.random() - 0.5) * 18, a.y - a.chest + 6 - Math.random() * 24, { blend: 'add', fps: 14, tint: lava ? 0xff7a3a : undefined });
					if (f.dead) continue;
				}
				if (f.burn <= 0) f.burnPower = 1;
			}
			f.wet = Math.max(0, f.wet - dt);
			f.chill = Math.max(0, f.chill - dt);
			f.frost = Math.max(0, f.frost - dt);
			f.freezeImmune = Math.max(0, f.freezeImmune - dt);
			if (f.freeze > 0) {
				f.freeze = Math.max(0, f.freeze - dt);
				// Boss vừa tan băng: kháng băng một lúc (`skillRules.canFreeze`).
				if (f.freeze <= 0 && f.boss) f.freezeImmune = BOSS_FREEZE_IMMUNE;
			}
			// Vỡ Vụn (Băng 9): băng trên quái vừa hết (tan theo giờ, Tan Chảy, Vỡ Vụn của Thổ) → nổ vụn băng.
			if (f.iced && f.freeze <= 0) {
				f.iced = false;
				this.shatterBurst(f);
			}
			f.iced = f.freeze > 0 && this.fx.frozenTaken > 1;
			f.stun = Math.max(0, f.stun - dt);
			f.air = Math.max(0, f.air - dt);
			f.slow = Math.max(0, f.slow - dt);
			f.armor = Math.max(0, f.armor - dt);
			f.sunder = Math.max(0, f.sunder - dt);
			f.miss = Math.max(0, f.miss - dt);
			f.daze = Math.max(0, f.daze - dt);
			f.dust = Math.max(0, f.dust - dt);
			if (f.net) this.ccOut(f, f.net, dt);
			// Hất lên: sprite bay theo parabol, bóng đổ (thuộc `root`) vẫn nằm trên đất.
			const lift = launchHeight(f.air, f.airTotal);
			a.view.sprite.y = lift ? -lift : 0;
			if (f.push) {
				const step = Math.min(dt, f.push.t);
				this.moveEnemy(f, f.push.vx * step, f.push.vy * step);
				f.push.t -= step;
				if (f.push.t <= 0) f.push = null;
			}
			if (f.stun > 0 && Math.random() < dt * 8) this.particles.spawn(a.x + Math.cos(this.time * 9) * 12, a.y - a.height - 2 + Math.sin(this.time * 9) * 3, this.tex.spark.fire[0]!, 0, -6, 0.3);
			if (f.miss > 0 && Math.random() < dt * 10) this.particles.spawn(a.x + (Math.random() - 0.5) * 30, a.y - Math.random() * a.height, this.tex.spark.dust[Math.floor(Math.random() * 2)]!, 40, -10, 0.35);
			// Gió Loạn: gió xoáy quanh đầu (hạt gió có sẵn).
			if (f.daze > 0 && Math.random() < dt * 8) this.particles.spawn(a.x + Math.cos(this.time * 7) * 14, a.y - a.height + 4, this.tex.spark.wind[0]!, -Math.sin(this.time * 7) * 20, -8, 0.35);
			if (f.net && !f.net.owned) {
				this.puppet(f, dt);
				continue;
			}

			const dx = p.x - a.x;
			const dy = p.y - a.y;
			const dist = Math.hypot(dx, dy);
			const fromHome = Math.hypot(a.x - f.home.x, a.y - f.home.y);
			const leash = f.home.radius + f.stats.aggro * 1.6;
			if (!pc.dead && dist < f.stats.aggro && fromHome < leash && !f.engaged) this.engage(f);
			if (pc.dead || fromHome > leash) {
				f.engaged = false;
				f.windup = 0;
				this.endSwing(f);
			}
			if (f.boss && !f.introduced && dist < 300) {
				f.introduced = true;
				// Thoại giới thiệu vừa mở: đọc xong boss mới vào nhịp đánh, không tung đòn ngay khi thoại đóng.
				// Không có thoại (boss vùng đã chào trong phiên này) thì giữ nguyên nhịp — khoảng nghỉ chỉ dành cho lúc đọc.
				if (this.hooks.bossNear(f)) {
					f.attackTimer = Math.max(f.attackTimer, 1.5);
					f.aoeTimer = Math.max(f.aoeTimer, 6);
					f.windup = 0;
					this.endSwing(f);
				}
			}
			if (f.freeze > 0 || f.stun > 0 || f.air > 0) {
				// Đóng băng / choáng / đang bị hất: đứng im — không đi, không vào thế; đòn đang lấy đà bị cắt (khống chế đúng lúc là một cách "né").
				f.windup = 0;
				this.endSwing(f);
				a.wanderEnabled = false;
				a.view.set('idle', a.view.direction);
				continue;
			}
			a.wanderEnabled = !f.engaged;
			if (!f.engaged) continue;

			const enraged = f.boss && f.hp < f.hpMax / 2;
			// Lạnh / lạnh sâu / Bùn Lầy lấy mức chậm nhất; Thấm Sâu (Thuỷ 2) nhân thêm khi đang ướt.
			const speed = f.stats.speed * moveFactor(f, PASSIVE.frostSlow, this.fx.wetSlow) * (enraged ? 1.25 : 1);

			// Động tác đánh chạy theo CÙNG dt với đà (hit-stop khựng cả hai) — tới cuối pha thu thế thì tự về dáng nền.
			const sw = f.swing;
			if (sw) {
				sw.t += dt;
				a.view.seekAction(strikeClock(sw.plan, sw.t));
				if (!a.view.busy) f.swing = null;
			}

			// Đang lấy đà: đứng yên (nháy trắng nếu không có động tác); hết đà mới tung đòn — đủ ~0.3s cho người chơi né.
			if (f.windup > 0) {
				// Có động tác: đà đọc từ đồng hồ động tác (cùng dung sai với `strikeClock`) — đòn nổ đúng frame khung chạm hiện.
				if (f.swing) f.windup = f.swing.t + ACTION_EPS >= f.swing.plan.windup ? 0 : f.swing.plan.windup - f.swing.t;
				else f.windup -= dt;
				if (f.windup <= 0) {
					f.windup = 0;
					this.strike(f, dist);
				}
				continue;
			}
			// Khung chạm chưa hiện trọn 1 frame thì vẫn đứng (cắt sớm là nhát vung chỉ lộ 1 frame render).
			const rooted = !!f.swing && f.swing.t + ACTION_EPS < f.swing.plan.cancelAt;

			f.attackTimer -= dt;
			const keep = f.stats.ranged && !f.boss ? f.stats.reach * 0.7 : f.stats.reach * 0.8;
			// Tường tạm chắn đường tới người chơi: vòng qua đầu tường (`skillRules.detourWaypoint`) — kể cả quái đánh xa đã đủ
			// tầm (bắn vào tường vô ích), không đứng ép mặt tường chờ tường sụp.
			const pad = f.boss ? BOSS_PAD : BODY_PAD;
			const route = this.walls.length ? this.wallRoute(f, p.x, p.y, pad) : (f.route = null);
			if ((dist > keep || route) && !rooted) {
				// Phải đuổi theo: bỏ pha thu thế (như người chơi `endRecovery`), không trượt đi với dáng vung.
				this.endSwing(f);
				const before = { x: a.x, y: a.y };
				let [mx, my] = [(dx / dist) * speed * dt, (dy / dist) * speed * dt];
				if (route) {
					const wp = detourWaypoint(a.x, a.y, p.x, p.y, route.wall, pad, route.dir);
					const wl = Math.hypot(wp.x - a.x, wp.y - a.y);
					const step = Math.min(wl, speed * dt);
					[mx, my] = wl > 1e-6 ? [((wp.x - a.x) / wl) * step, ((wp.y - a.y) / wl) * step] : [0, 0];
				}
				this.moveEnemy(f, mx, my);
				const went = Math.hypot(a.x - before.x, a.y - before.y);
				if (route) {
					// Vướng tường BẢN ĐỒ trên đường vòng (đầu tường chôn vào vách): đổi sang đầu kia.
					route.stuck = went < Math.hypot(mx, my) * 0.2 ? route.stuck + dt : 0;
					if (route.stuck > 0.6) [route.dir, route.stuck] = [route.dir > 0 ? -1 : 1, 0];
				}
				a.view.set(went > 0.01 ? 'walk' : 'idle', directionOf(route ? mx : dx, route ? my : dy), speed / 78);
			} else a.view.set('idle', directionOf(dx, dy));
			// Tường chắn giữa: không lấy đà đánh (nhát chém / đạn chỉ vào tường) — đi vòng tiếp.
			const walled = this.walls.length > 0 && wallBetween(a.x, a.y, p.x, p.y, this.walls);

			if (f.boss) {
				f.aoeTimer -= dt;
				if (f.aoeTimer <= 0 && dist < BOSS_AOE.range) {
					f.aoeTimer = enraged ? 5 : 7;
					const t = this.aoeTarget(f);
					this.telegraph(t.x, t.y, BOSS_AOE.r, BOSS_AOE.seconds, f.stats.atk * BOSS_AOE.power);
					if (f.net?.owned) this.hooks.netAct?.(f, { k: 'aoe', x: Math.round(t.x), y: Math.round(t.y) });
				}
			}
			if (f.attackTimer <= 0 && dist <= f.stats.reach + 10 && !walled) {
				f.attackTimer = f.stats.attackCd * (enraged ? 0.8 : 1);
				f.attacks += 1;
				const ranged = f.stats.ranged && (!f.boss || f.attacks % 3 === 0);
				this.beginWindup(f, ranged ? 0.22 : f.boss ? 0.36 : 0.3, dx, dy);
			} else if (f.boss && f.stats.ranged && f.attackTimer <= 0 && dist < 300 && !walled) {
				f.attackTimer = f.stats.attackCd * 1.6;
				f.attacks = Math.ceil(f.attacks / 3) * 3;
				this.beginWindup(f, 0.3, dx, dy);
			}
		}
	}

	/**
	 * Bắt đầu lấy đà, quay mặt về người chơi. Atlas có `attack` cho hướng đó thì phát động tác với khung chạm khớp
	 * đúng lúc đòn nổ (`strikePlan`: đà không bao giờ ngắn hơn `seconds`); không có thì cách cũ — đứng nháy trắng.
	 */
	private beginWindup(f: Fighter, seconds: number, dx: number, dy: number): void {
		const a = f.actor;
		const dir = directionOf(dx, dy);
		this.endSwing(f);
		a.view.set('idle', dir);
		if (f.net?.owned) this.hooks.netAct?.(f, { k: 'wind', dir, s: seconds });
		const plan = a.view.strikePlan(dir, seconds);
		if (plan && a.view.playAction('attack', dir, { timing: plan.timing, external: true })) {
			f.swing = { plan, t: 0 };
			f.windup = plan.windup;
		} else f.windup = seconds;
	}

	/** Dừng động tác đánh (bị đóng băng, thoát leash, chết, hồi sinh, gỡ map, phải đuổi theo): hình về dáng nền ngay. */
	private endSwing(f: Fighter): void {
		if (!f.swing) return;
		f.swing = null;
		f.actor.view.cancelAction();
	}

	/** Tung đòn sau khi lấy đà: đánh xa thì bắn, cận chiến thì chỉ trúng nếu người chơi CHƯA né ra khỏi tầm. */
	private strike(f: Fighter, dist: number): void {
		const p = this.player;
		const a = f.actor;
		const nx = (p.x - a.x) / (dist || 1);
		const ny = (p.y - a.y) / (dist || 1);
		const ranged = f.stats.ranged && (!f.boss || f.attacks % 3 === 0);
		// Quái dùng chung: máy người khác diễn lại nhát này — ai đứng trong tầm nhát / đường đạn cũng ăn đòn (máy họ tự xét).
		if (f.net?.owned) this.hooks.netAct?.(f, { k: ranged ? 'shot' : 'melee', x: Math.round(a.x), y: Math.round(a.y), nx, ny });
		// Cú giật chỉ còn là phương án dự phòng khi atlas chưa có động tác đánh.
		if (!f.swing) a.lunge(nx, ny, ranged ? 3 : 10);
		if (ranged) return this.enemyShot(f, nx, ny);
		this.meleeAt(f, a.x, a.y, nx, ny, dist, false);
	}

	/**
	 * Nhát cận chiến của quái đứng ở (x, y) quay về (nx, ny), xét trên người chơi máy này (`dist` = khoảng cách tới người chơi).
	 * `cone`: nhát này nhắm người KHÁC (quái dùng chung, chủ ở máy khác) — phải đứng phía trước quái mới trúng.
	 */
	private meleeAt(f: Fighter, x: number, y: number, nx: number, ny: number, dist: number, cone: boolean): void {
		const p = this.player;
		this.vfx.play('slash', x + nx * 26, y - f.actor.chest + 2 + ny * 18, { rotation: Math.atan2(ny, nx), tint: f.boss ? 0xff6b8a : 0xffd0d0, fps: 30 });
		const reach = f.stats.reach + 16;
		const front = !cone || dist < 1 || ((p.x - x) * nx + (p.y - y) * ny) / dist >= MELEE_CONE_COS;
		// Đã lăn ra khỏi tầm: trượt — trừ khi vừa né ĐÚNG LÚC từ chỗ đứng trong tầm (Phản Đòn: đòn vẫn tính là nhắm trúng
		// chỗ vừa đứng → `incoming` phản).
		if ((dist > reach || !front) && !(this.perfectDodge() && Math.hypot(this.dodgeFrom.x - x, this.dodgeFrom.y - y) <= reach)) return;
		// Tường tạm chắn giữa: nhát chém vào tường.
		if (this.walls.length && wallBetween(x, y, p.x, p.y, this.walls)) return;
		// Bão Cát / Gió Loạn: đòn trượt (chỉ tung xúc xắc khi đang dính — không đụng chuỗi ngẫu nhiên của trận thường).
		const chance = missChance(f, EARTH.sandMiss, PASSIVE.gustMiss);
		if (chance > 0 && Math.random() < chance) this.missed();
		else this.incoming('melee', f.stats.atk, f);
	}

	/** Boss nhắm vùng nổ: quái riêng → người chơi; boss dùng chung → một người BẤT KỲ trong tầm (cả người chơi máy khác). */
	private aoeTarget(f: Fighter): { x: number; y: number } {
		const p = this.player;
		if (!f.net) return p;
		const a = f.actor;
		const near = [p, ...(this.hooks.others?.() ?? [])].filter((o) => Math.hypot(o.x - a.x, o.y - a.y) < BOSS_AOE.range);
		return near[Math.floor(Math.random() * near.length)] ?? p;
	}

	/** Đòn quái trượt (Bão Cát): chữ "Trượt" trên đầu người chơi — chỉ khi đòn đó lẽ ra đã trúng. */
	private missed(): void {
		const pc = this.pc;
		if (pc.dead || pc.iframes > 0) return;
		this.float(this.player.x, this.player.y - this.player.height - 8, 'Trượt', 0xf0d28a, 13);
	}

	private enemyShot(f: Fighter, nx: number, ny: number, ox = f.actor.x, oy = f.actor.y): void {
		const a = f.actor;
		const kind = f.stats.ranged!;
		const shots = f.boss ? [-0.28, 0, 0.28] : [0];
		for (const ang of shots) {
			const c = Math.cos(ang);
			const s = Math.sin(ang);
			const v = kind === 'arrow' ? 300 : 240;
			const chance = missChance(f, EARTH.sandMiss, PASSIVE.gustMiss);
			const missed = chance > 0 && Math.random() < chance;
			this.fire({ x: ox, y: oy - a.chest, vx: (nx * c - ny * s) * v, vy: (nx * s + ny * c) * v, life: 1.6, team: 'enemy', damage: f.stats.atk * (f.boss ? 0.9 : 1), element: kind, pierce: false, missed, lift: a.chest, owner: f });
		}
	}

	private hurtPlayer(amount: number): void {
		const pc = this.pc;
		if (pc.dead || pc.iframes > 0) return;
		// Tâm Tĩnh (Thủy Thần 4): đứng yên đủ lâu hoặc đang giữ thế thì nhận ít hơn.
		const calm = this.fx.calm < 1 && (pc.guard || this.stillT >= GUARD.still) ? this.fx.calm : 1;
		const dmg = Math.max(1, Math.round(amount * (0.9 + Math.random() * 0.2) * this.fx.damageTaken * calm - pc.def * this.fx.defense * 0.5));
		pc.hp -= dmg;
		pc.lastHurt = this.time;
		pc.iframes = 0.35;
		this.float(this.player.x, this.player.y - this.player.height - 8, `-${dmg}`, 0xff6b6b, 15);
		this.vfx.play('blood_hit', this.player.x, this.player.y - this.player.chest - 2, { fps: 24 });
		this.flashScreen(0xff2a2a, 0.18);
		this.hitStop = Math.max(this.hitStop, 0.05);
		this.hooks.shake(3, 0.2);
		if (pc.hp <= 0) {
			pc.hp = 0;
			pc.dead = true;
			pc.respawnT = 2.5;
			this.cancelAction(true);
			this.endGuard();
			pc.ward = null;
			this.press.n = 0;
			this.momentum.n = 0;
			this.player.root.alpha = 0.35;
			this.hooks.toast('Bạn đã gục ngã…', 'warn');
		}
	}

	/**
	 * Bắn một viên. `look`: hình riêng của kỹ năng (hình tạm `TEMP_ART[id].shot` — vd Đá Văng = cầu phép nhuộm nâu, Bộc Hoả
	 * = cầu lửa phóng ×2); thiếu thì theo hệ. `ghost`: chỉ là hình bay tới điểm nổ, không va chạm.
	 */
	private fire(o: {
		x: number;
		y: number;
		vx: number;
		vy: number;
		life: number;
		team: 'player' | 'enemy';
		damage: number;
		element: ShotKind;
		pierce: boolean;
		fx?: HitFx;
		look?: ArtLayer;
		ghost?: boolean;
		missed?: boolean;
		lift?: number;
		owner?: Fighter | null;
		reach?: number;
		crit?: number;
		/** Phi Kiếm: tốc bay về tay (có = đạn đi–về). */
		boomerang?: number;
		press?: boolean;
	}): void {
		const vfxId = o.look?.id ?? SHOT_VFX[o.element];
		const frames = vfxId ? this.vfx.frames(vfxId) : [];
		const size = Math.max(1, Math.round(o.look?.scale ?? 1));
		const sprite = this.spritePool.pop() ?? new Sprite();
		sprite.anchor.set(0.5);
		sprite.texture = frames[0] ?? (o.element === 'arrow' ? this.tex.arrow : this.tex.aether);
		sprite.visible = true;
		sprite.alpha = 1;
		sprite.tint = o.look?.tint ?? 0xffffff;
		sprite.blendMode = 'normal';
		sprite.scale.set(size);
		// Đạn có mũi (mũi nước, tên, mũi băng; luồng kiếm `look.aim`) xoay theo hướng bay.
		sprite.rotation = AIMED_SHOTS.has(o.element) || o.look?.aim ? Math.atan2(o.vy, o.vx) : 0;
		this.fxLayer.addChild(sprite);
		let glow: Sprite | null = null;
		if (GLOWS.has(o.element) && frames[0]) {
			// Quầng sáng kiểu pixel: chính frame đó phóng NGUYÊN 2×, cộng màu, mờ — không dùng gradient mềm.
			glow = this.spritePool.pop() ?? new Sprite();
			glow.anchor.set(0.5);
			glow.texture = frames[0];
			glow.visible = true;
			glow.scale.set(2 * size);
			glow.alpha = 0.32;
			glow.tint = o.look?.tint ?? 0xffffff;
			glow.blendMode = 'add';
			glow.rotation = sprite.rotation;
			this.fxLayer.addChild(glow);
		}
		const spark = this.tex.spark;
		// Đạn thép (luồng kiếm, kiếm bay): vệt hạt trắng bạc — mượn hạt băng (sáng nhất bảng).
		const trail =
			o.element === 'arrow' || o.element === 'earth' ? spark.dust : o.element === 'shadow' ? spark.shadow : o.element === 'steel' ? spark.ice : spark[o.element as keyof FxTextures['spark']] ?? spark.aether;
		this.projectiles.push({
			sprite,
			glow,
			frames,
			ft: 0,
			spin: o.look?.spin ?? (o.element === 'wind' || o.element === 'earth' ? 14 : 0),
			x: o.x,
			y: o.y,
			vx: o.vx,
			vy: o.vy,
			life: o.life,
			team: o.team,
			damage: o.damage,
			element: o.element,
			pierce: o.pierce,
			hit: new Set(),
			trail,
			fx: o.fx,
			ghost: o.ghost,
			missed: o.missed,
			lift: o.lift,
			owner: o.owner,
			reach: o.reach,
			crit: o.crit,
			boomerang: o.boomerang ? { back: false, speed: o.boomerang } : undefined,
			press: o.press,
		});
	}

	/** Đạn KIẾM trúng lần đầu: một nhát cho Thế Áp Đảo. */
	private shotLanded(pr: Projectile): void {
		if (!pr.press) return;
		pr.press = false;
		this.pressLanded(1);
	}

	private updateProjectiles(dt: number): void {
		for (let i = this.projectiles.length - 1; i >= 0; i -= 1) {
			const pr = this.projectiles[i]!;
			pr.life -= dt;
			// Phi Kiếm: hết tầm thì quay đầu bay về tay — lượt về trúng lại được mỗi quái một lần (bộ "đã trúng" mới).
			const bm = pr.boomerang;
			if (bm && !bm.back && pr.life <= 0 && !pr.fizzle) {
				bm.back = true;
				pr.hit = new Set();
				pr.life = BOOMERANG_BACK;
			}
			if (bm?.back) {
				const p = this.player;
				({ vx: pr.vx, vy: pr.vy } = aimVelocity(pr.x, pr.y, p.x, p.y - p.chest, bm.speed));
			}
			pr.x += pr.vx * dt;
			pr.y += pr.vy * dt;
			pr.ft += dt;
			if (pr.frames.length) pr.sprite.texture = pr.frames[Math.floor(pr.ft * 16) % pr.frames.length]!;
			if (pr.spin) pr.sprite.rotation += pr.spin * dt;
			pr.sprite.position.set(Math.round(pr.x), Math.round(pr.y));
			pr.sprite.zIndex = pr.y + 220;
			if (pr.glow) {
				pr.glow.texture = pr.sprite.texture;
				pr.glow.rotation = pr.sprite.rotation;
				pr.glow.position.copyFrom(pr.sprite.position);
				pr.glow.zIndex = pr.sprite.zIndex - 1;
			}
			if (Math.random() < dt * 34) this.particles.spawn(pr.x, pr.y, pr.trail[Math.floor(Math.random() * pr.trail.length)]!, -pr.vx * 0.08, -pr.vy * 0.08, 0.28);
			let gone = pr.life <= 0 || pr.fizzle;
			if (pr.ghost) {
				/* chỉ là hình: bay hết đường rồi tan, đòn nổ do lịch hẹn của kỹ năng */
			} else if (pr.team === 'player') {
				// `reach`: nửa bề ngang trúng (luồng kiếm rộng hơn mũi tên) — nới đều cả ngang lẫn dọc thân.
				const wide = Math.max(0, (pr.reach ?? 20) - 20);
				for (const d of this.dummies) {
					if (gone || pr.hit.has(d) || (!pr.pierce && pr.hit.size > 0) || Math.abs(d.x - pr.x) >= 18 + wide || pr.y <= d.y - 90 - wide || pr.y >= d.y + 4 + wide) continue;
					pr.hit.add(d);
					this.hitDummy(d, pr.damage, pr.element as Element);
					this.shotLanded(pr);
					if (!pr.pierce) gone = true;
				}
				for (const f of this.enemies) {
					if (gone) break;
					if (f.dead || pr.hit.has(f)) continue;
					if (Math.abs(f.actor.x - pr.x) < 20 + wide + (f.boss ? 10 : 0) && pr.y > f.actor.y - Math.round(f.actor.height * 0.96) - wide && pr.y < f.actor.y + 4 + wide) {
						pr.hit.add(f);
						this.hit(f, pr.damage, pr.element as Element, pr.vx, pr.vy, pr.fx, pr.crit ?? 0);
						this.shotLanded(pr);
						if (!pr.pierce) {
							gone = true;
							break;
						}
					}
				}
				// Phi Kiếm về tới tay: bắt lại (không nổ hiệu ứng trúng).
				const p = this.player;
				if (!gone && bm?.back && Math.hypot(pr.x - p.x, pr.y - (p.y - p.chest)) < BOOMERANG_CATCH) {
					gone = true;
					pr.ghost = true;
					this.playArt('flying_sword', p.x, p.y);
				}
			} else {
				const p = this.player;
				// Tường tạm chặn đạn quái: xét đoạn bay frame này theo CHÂN đường bay (đạn bay ở độ cao ngực).
				const lift = pr.lift ?? 0;
				if (!gone && this.walls.length && wallBetween(pr.x - pr.vx * dt, pr.y - pr.vy * dt + lift, pr.x, pr.y + lift, this.walls)) {
					this.impact(pr.element, pr.x, pr.y, 0.8);
					gone = true;
				}
				// Gương Băng: đạn chạm khiên (tính từ ngực) bị phản về kẻ bắn.
				const ward = this.pc.ward;
				if (!gone && ward && !this.pc.dead && Math.hypot(pr.x - p.x, pr.y - (p.y - p.chest)) < ward.radius) {
					this.reflect(pr, ward);
					gone = true;
				}
				if (!gone && Math.abs(p.x - pr.x) < 16 && pr.y > p.y - Math.round(p.height * 0.94) && pr.y < p.y + 4) {
					if (pr.missed) this.missed();
					else this.incoming('shot', pr.damage, null, pr);
					gone = true;
				}
			}
			if (gone) {
				if ((pr.life <= 0 || pr.fizzle) && !pr.ghost) this.impact(pr.element, pr.x, pr.y, 0.7);
				for (const s of [pr.sprite, pr.glow]) {
					if (!s) continue;
					s.visible = false;
					s.parent?.removeChild(s);
					this.spritePool.push(s);
				}
				this.projectiles[i] = this.projectiles[this.projectiles.length - 1]!;
				this.projectiles.pop();
			}
		}
	}

	/**
	 * Khiên phản đạn: đạn quái bay ngược về kẻ bắn (còn sống — không thì ngược hướng bay) thành đạn của người chơi. Gương
	 * Băng: mũi băng. Dòng Chảy Ngược (`w.sword`): vung kiếm gạt (động tác attack sẵn có về phía viên đạn), đạn mang hệ phủ
	 * phép, tính là phản đòn thành công (Mặt Hồ Phẳng, Xoáy Nước).
	 */
	private reflect(pr: Projectile, w: Ward): void {
		const o = pr.owner && !pr.owner.dead ? pr.owner : null;
		const v = o ? aimVelocity(pr.x, pr.y, o.actor.x, o.actor.y - o.actor.chest, REFLECT_SPEED) : aimVelocity(pr.x, pr.y, pr.x - pr.vx, pr.y - pr.vy, REFLECT_SPEED);
		this.playArt(w.skillId, pr.x, pr.y, v.vx, v.vy);
		this.hitStop = Math.max(this.hitStop, 0.04);
		const look = TEMP_ART[w.skillId]?.shot;
		if (w.sword) {
			const p = this.player;
			const [sx, sy] = [pr.x - p.x, pr.y - (p.y - p.chest)];
			this.swingAt(directionOf(sx, sy));
			this.slashFx(p.x, p.y - p.chest, sx, sy, w.element);
			this.float(pr.x, pr.y - 20, 'Gạt!', 0xbfe8ff, 13);
		} else this.float(pr.x, pr.y - 20, 'Phản!', ELEMENT_TINT.ice, 13);
		this.fire({
			x: pr.x,
			y: pr.y,
			vx: v.vx,
			vy: v.vy,
			life: 1.2,
			team: 'player',
			damage: w.damage,
			element: w.element,
			pierce: false,
			look: w.sword && w.element !== 'steel' && look ? { ...look, tint: ELEMENT_TINT[w.element] } : look,
			press: w.sword,
		});
		if (w.sword) this.onCounter();
	}

	/**
	 * Hệ số nhận thêm của mục tiêu theo trạng thái TRƯỚC nhát đánh (bị động GĐ3): đang ướt × Thuỷ Triều Dâng, đang đóng
	 * băng × Vỡ Vụn, đang choáng × Trọng Lực, đang vỡ giáp (Phá Giáp). Áp cho mọi nguồn sát thương của người chơi (đòn, nhịp
	 * cháy, Bùng Lửa).
	 */
	private vulnerability(t: Status): number {
		const wet = t.wet > 0 ? this.fx.wetTaken : 1;
		const frozen = t.freeze > 0 ? this.fx.frozenTaken : 1;
		const stunned = this.fx.gravity && (t.stun ?? 0) > 0 ? PASSIVE.gravityStunned : 1;
		// Vỡ giáp (Phá Giáp đánh mục tiêu đang bị phá giáp): nhận thêm từ mọi nguồn, nhân chồng lên phá giáp thường.
		const sunder = (t.sunder ?? 0) > 0 ? SUNDER_TAKEN : 1;
		return wet * frozen * stunned * sunder;
	}

	/** Sát thương của bị động (Tro Tàn, vụn băng): ATK × uy lực × sức phép của con đường × thưởng chiều sâu của nhánh. */
	private passiveDamage(power: number, branch: Branch): number {
		return this.magicAtk() * power * PATHS[this.path ?? 'none'].magic * depthBonus(this.tiers[branch] ?? 1);
	}

	/**
	 * Tro Tàn (Hoả 7): hẹn nổ lan lửa ở chỗ quái vừa chết. `from` = đợt của lửa đang cháy trên nó (`Fighter.emberDepth`: 0 =
	 * lửa của người chơi) — vụ nổ này là đợt kế, quá `PASSIVE.emberChain` thì thôi. Độ sâu đi theo LỬA trên quái chứ không
	 * theo lời gọi đang chạy: quái bén lửa từ vụ nổ rồi chết vì nhịp cháy ở frame sau vẫn đúng đợt (không đếm lại từ 1).
	 */
	private queueEmber(x: number, y: number, from: number): void {
		const depth = from + 1;
		if (depth > PASSIVE.emberChain) return;
		this.schedule(PASSIVE.emberDelay, () => this.emberBurst(x, y, depth));
	}

	private emberBurst(x: number, y: number, depth: number): void {
		this.playArt('ember_burst', x, y);
		this.flashScreen(0xff9040, 0.1);
		this.hooks.shake(1.8, 0.14);
		const prev = this.emberChain;
		this.emberChain = depth;
		try {
			this.strikeArea({ kind: 'circle', x, y, r: PASSIVE.emberRadius }, this.passiveDamage(PASSIVE.emberPower, 'fire'), 'fire', undefined);
		} finally {
			this.emberChain = prev;
		}
	}

	/**
	 * Vỡ Vụn (Băng 9): băng trên `f` vỡ — vụn băng (hệ Băng) trúng mọi quái quanh, không tính chính nó. `from` = đợt của băng
	 * vừa vỡ (`Fighter.iceDepth`); vụn là đợt kế: quá `PASSIVE.shardChain` thì quái ướt trúng vụn chỉ bị lạnh, không Đóng Băng
	 * (không thì Gọi Mưa làm ướt lại mỗi 0,5s + vụn của con này đóng băng con kia, con kia tan lại đóng băng con này — mãi).
	 */
	private shatterBurst(f: Fighter, from = f.iceDepth): void {
		const a = f.actor;
		f.iceDepth = 0;
		this.playArt('shatter_burst', a.x, a.y);
		this.float(a.x, a.y - a.height - 52, 'Vỡ băng!', REACTION_COLOR.freeze, 12);
		const prev = this.shardDepth;
		this.shardDepth = from + 1;
		try {
			this.strikeArea({ kind: 'circle', x: a.x, y: a.y, r: PASSIVE.shardRadius }, this.passiveDamage(PASSIVE.shardPower, 'ice'), 'ice', undefined, 'ice', new Set<object>([f]));
		} finally {
			this.shardDepth = prev;
		}
	}

	/** Hồi phục mỗi giây của bị động: Mạch Nguồn (đứng trong mưa của mình: máu + MP), Núi Thiêng (đứng yên: máu). */
	private passiveRegen(): void {
		const pc = this.pc;
		const p = this.player;
		if (pc.dead || !p) return;
		let hp = 0;
		if (this.fx.spring && this.inOwnRain()) {
			hp += pc.hpMax * PASSIVE.springHp;
			pc.mp = Math.min(pc.mpMax, pc.mp + PASSIVE.springMp);
			this.playArt('spring_heal', p.x, p.y, 1, 0, undefined, { follow: p });
		}
		if (this.fx.mountain && this.stillT >= PASSIVE.mountainStill) {
			hp += pc.hpMax * PASSIVE.mountainRegen;
			this.playArt('mountain_heal', p.x, p.y, 1, 0, undefined, { follow: p });
		}
		if (this.rageLive) this.playArt('rage_aura', p.x, p.y, 1, 0, undefined, { follow: p });
		const heal = Math.round(hp);
		if (heal < 1 || pc.hp >= pc.hpMax) return;
		pc.hp = Math.min(pc.hpMax, pc.hp + heal);
		this.float(p.x - 10, p.y - p.height - 4, `+${heal}`, 0x5be38a, 11);
	}

	/** Thưởng phản ứng: +5% mỗi mốc (trên mốc 1) của hệ yếu hơn trong cặp (`talents.reactionBonus`). */
	private reactionScale(id: ReactionId): number {
		const [a, b] = REACTION_PAIR[id];
		return reactionBonus(this.tiers, a, b);
	}

	/** Một phản ứng vừa ăn: hệ số đã nhân thưởng song hệ + thứ để hiện (chữ, màu, hiệu ứng). */
	private reaction(id: ReactionId, mult: number, name: string, vfx: VfxId | null, art?: string): { mult: number; reaction: ReactionHit } {
		return { mult: mult * this.reactionScale(id), reaction: { id, name, color: REACTION_COLOR[id], ...(vfx ? { vfx } : {}), ...(art ? { art } : {}) } };
	}

	/** Bùn Lầy (Thổ + Thuỷ): hết ướt + hết bụi, chậm nặng (boss nửa thời gian). */
	private mud(t: Status): { mult: number; reaction: ReactionHit } {
		t.wet = 0;
		t.dust = 0;
		t.slow = Math.max(t.slow ?? 0, ccSeconds(EARTH.mudSeconds, t.boss));
		t.slowMult = EARTH.mudSlow;
		return this.reaction('mud', EARTH.mudMult, 'Bùn Lầy!', null, 'react_mud');
	}

	/** Dung Nham (Thổ + Hoả): cháy lại từ đầu với cường độ ×2 + phá giáp. */
	private lava(t: Status): { mult: number; reaction: ReactionHit } {
		t.dust = 0;
		t.burn = BURN_SECONDS * this.fx.burn;
		t.emberDepth = this.emberChain;
		t.burnPower = EARTH.lavaBurn;
		t.armor = Math.max(t.armor ?? 0, EARTH.lavaArmor);
		return this.reaction('lava', EARTH.lavaMult, 'Dung Nham!', null, 'react_lava');
	}

	/**
	 * Đóng băng `t` chừng `seconds` (đã nhân Hàn Tâm; boss ½ thời lượng), lấy mức dài hơn nếu đang băng: boss đang băng / còn
	 * kháng băng thì không (`skillRules.canFreeze`). Băng mang đợt vụn băng đang nổ (`shardDepth`, 0 = đòn người chơi; đang
	 * băng sẵn thì giữ đợt nhỏ hơn). Trả true nếu đã đóng băng.
	 */
	private freezeTarget(t: Status, seconds: number): boolean {
		if (!canFreeze(t)) return false;
		t.iceDepth = t.freeze > 0 ? Math.min(t.iceDepth ?? 0, this.shardDepth) : this.shardDepth;
		t.freeze = Math.max(t.freeze, ccSeconds(seconds, t.boss));
		return true;
	}

	/** Phá băng ngay (Tan Chảy, Vỡ Vụn của Thổ): boss bắt đầu kháng băng như khi băng tự tan. */
	private thaw(t: Status): void {
		if (t.freeze > 0 && t.boss) t.freezeImmune = BOSS_FREEZE_IMMUNE;
		t.freeze = 0;
	}

	/**
	 * Phản ứng nguyên tố trên một mục tiêu có trạng thái (quái HAY hình nộm tập — dùng chung để cảnh
	 * luyện "Băng Giá" ở tuổi thơ hiện đúng chữ như ngoài trận). Trả hệ số sát thương + phản ứng.
	 * Thứ tự nhánh là luật chơi: lửa vào mục tiêu lạnh/đóng băng thì TAN trước khi xét hơi nước; Thổ vào mục tiêu đóng
	 * băng thì VỠ trước mọi thứ. Thổ (như Thuỷ, Hoả) để lại trạng thái — "bụi đất" — để hệ đánh SAU cũng gây phản ứng
	 * (Phong không để lại gì nên Bão Cát chỉ ra khi Phong đánh vào mục tiêu đang bám bụi).
	 */
	private react(t: Status, element: Element, x: number, y: number): { mult: number; reaction: ReactionHit | null } {
		const dusty = (t.dust ?? 0) > 0;
		if (element === 'earth') {
			if (t.freeze > 0) {
				this.thaw(t);
				t.chill = 0;
				t.frost = 0;
				return this.reaction('shatter', EARTH.shatterMult, 'Vỡ Vụn!', null, 'react_shatter');
			}
			if (t.burn > 0) return this.lava(t);
			if (t.wet > 0) return this.mud(t);
			t.dust = EARTH.dust;
		} else if (element === 'fire') {
			if (t.chill > 0 || t.freeze > 0) {
				t.chill = 0;
				this.thaw(t);
				return this.reaction('melt', 1.5, 'Tan Chảy!', 'steam');
			}
			if (t.wet > 0) {
				t.wet = 0;
				return this.reaction('steam', 1.4, 'Hơi Nước!', 'steam');
			}
			if (dusty) return this.lava(t);
			// Bén lửa mới thì cháy thường; đang cháy Dung Nham thì giữ cường độ tới khi tắt.
			if (!(t.burn > 0)) t.burnPower = 1;
			t.burn = BURN_SECONDS * this.fx.burn;
			// Lửa của vụ nổ Tro Tàn mang đợt của nó (0 = lửa của người chơi) — quái chết lúc cháy nổ đợt kế.
			t.emberDepth = this.emberChain;
		} else if (element === 'water') {
			const steaming = t.burn > 0;
			t.burn = 0;
			if (steaming) {
				t.wet = WET_SECONDS * this.fx.wet;
				return this.reaction('steam', 1.5, 'Hơi Nước!', 'steam');
			}
			if (dusty) return this.mud(t);
			t.wet = WET_SECONDS * this.fx.wet;
		} else if (element === 'wind') {
			if (t.burn > 0) {
				t.burn = 0;
				// Bùng Lửa là phản ứng phép: cộng Phép thuật của trang bị (`magicAtk`) như mọi bị động phép.
				this.flameBurst(x, y, this.magicAtk() * 1.2 * this.reactionScale('burst'));
				return { mult: 1, reaction: { id: 'burst', name: 'Bùng Lửa!', color: REACTION_COLOR.burst, vfx: 'fire_flash' } };
			}
			if (t.wet > 0) {
				t.wet = 0;
				t.chill = 3;
				return this.reaction('chill', 1.3, 'Băng Giá!', 'frost');
			}
			if (dusty) {
				t.dust = 0;
				t.miss = Math.max(t.miss ?? 0, EARTH.sandSeconds);
				return this.reaction('sandstorm', EARTH.sandMult, 'Bão Cát!', null, 'react_sandstorm');
			}
		} else if (element === 'ice') {
			if (t.burn > 0) {
				t.burn = 0;
				return this.reaction('melt', 1.6, 'Tan Chảy!', 'steam');
			}
			// Đóng Băng: boss đang băng / còn kháng băng thì không (`canFreeze`); vụn băng quá `PASSIVE.shardChain` đợt chỉ làm
			// lạnh — hai trường hợp đó rơi xuống làm lạnh bên dưới, quái vẫn ướt.
			if (t.wet > 0 && canFreeze(t) && this.shardDepth <= PASSIVE.shardChain) {
				t.wet = 0;
				this.freezeTarget(t, FREEZE_SECONDS * this.fx.freeze);
				return this.reaction('freeze', 1.3, 'Đóng Băng!', 'ice_burst');
			}
			const chill = CHILL_SECONDS * this.fx.chill;
			t.chill = Math.max(t.chill, chill);
			if (this.fx.frost) t.frost = Math.max(t.frost ?? 0, chill);
		}
		return { mult: 1, reaction: null };
	}

	/**
	 * Sát thương + phản ứng nguyên tố + khống chế (`hx`). Trạng thái mục tiêu quyết định phản ứng, không phải thứ tự phím.
	 * Khống chế áp SAU sát thương (mục tiêu chết thì thôi); boss: thời lượng một nửa, không bị đẩy.
	 */
	private hit(f: Fighter, base: number, element: Element, kx: number, ky: number, hx?: HitFx, critBonus = 0): void {
		const a = f.actor;
		// Tim Lò (Hoả mốc 4): xét cháy TRƯỚC phản ứng — gió vào mục tiêu cháy dập lửa (Bùng Lửa) nhưng nhát đó vẫn ăn thưởng.
		const burning = f.burn > 0 ? this.fx.burning : 1;
		// Hàn Băng Trảm: "đang lạnh" xét TRƯỚC phản ứng (Băng trúng thường sẽ làm lạnh lại — không tính là lạnh từ trước).
		const chilled = f.chill > 0;
		// Bị động GĐ3 (ướt / đóng băng / choáng) xét theo trạng thái TRƯỚC nhát này — Băng vào quái ướt vẫn ăn Thuỷ Triều Dâng.
		const vuln = this.vulnerability(f);
		// Phá Giáp: "đang bị phá giáp" xét TRƯỚC nhát này (Dung Nham của chính nhát này không tính) → vỡ giáp chồng lên.
		const broken = f.armor > 0;
		// Tro Tàn / Vỡ Vụn xét lúc trúng đòn: phản ứng của chính nhát kết liễu (Hơi Nước, Tan Chảy, Vỡ Vụn của Thổ…) xoá lửa /
		// băng TRƯỚC khi `kill` kịp đọc — chụp lại ở đây. Máu trước nhát: hút máu chỉ tính phần máu thật sự mất.
		const snap = { burning: f.burn > 0, frozen: f.freeze > 0 || f.iced };
		const hpBefore = Math.max(0, f.hp);
		const r = this.react(f, element, a.x, a.y);
		let dmg = base * (0.9 + Math.random() * 0.2) * r.mult * burning * vuln;
		const reaction = r.reaction;
		const crit = Math.random() < CRIT_CHANCE + this.fx.crit + this.gear.crit / 100 + critBonus;
		if (crit) dmg *= CRIT_MULT;
		// Phá giáp tính SAU phản ứng: Dung Nham phá giáp ăn ngay nhát gây ra nó.
		const final = armorDamage(dmg, f.stats.def, f.armor > 0);
		const len = Math.hypot(kx, ky) || 1;
		if (!f.boss) this.moveEnemy(f, (kx / len) * 10, (ky / len) * 10);
		a.lunge(kx / len, ky / len, f.boss ? 2 : 5);
		this.engage(f);
		this.damage(f, final, crit ? 0xffe066 : ELEMENT_TINT[element] ?? 0xffffff, crit, false, snap);
		// Huyết Thuỷ (đòn hệ Thuỷ) + hút máu riêng của kỹ năng (Thuỷ Long Trảm) + Bất Khuất (dưới 30% máu, mọi đòn) cộng dồn —
		// trên máu THẬT mất (nhát 600 vào quái còn 5 máu chỉ tính 5, không tính phần thừa).
		this.lifesteal(Math.min(final, hpBefore), (element === 'water' ? this.fx.lifesteal : 0) + (hx?.drain ?? 0) + (this.rageLive ? PASSIVE.rageDrain : 0));

		const ix = a.x + (Math.random() - 0.5) * 10;
		const iy = a.y - a.chest + (Math.random() - 0.5) * 12;
		this.impact(element, ix, iy);
		if (element === 'water') this.vfx.play('water_ring', a.x, a.y, { layer: 'ground', fps: 22 });
		if (crit) this.vfx.play('crit_flash', ix, iy, { blend: 'add', fps: 30 });
		if (reaction) {
			this.playReaction(reaction, a.x, a.y - a.chest - 4);
			this.float(a.x, a.y - a.height - 36, reaction.name, reaction.color, 14);
		}
		if (hx && !f.dead) this.control(f, hx, kx / len, ky / len, chilled, broken);
		if (!f.dead) {
			// Gió Loạn (Phong 9): đòn hệ Phong làm quái đánh trượt (đủ thời lượng cả với boss — là suy yếu, như Bão Cát).
			if (element === 'wind' && this.fx.gust) f.daze = Math.max(f.daze, PASSIVE.gustSeconds);
			// Trọng Lực (Thổ 7): đòn hệ Thổ làm chậm — không đè mức chậm mạnh hơn (Bùn Lầy); boss nửa thời gian như chậm nặng.
			if (element === 'earth' && this.fx.gravity) addSlow(f, ccSeconds(PASSIVE.gravitySeconds, f.boss), PASSIVE.gravitySlow);
		}
		this.hitStop = Math.max(this.hitStop, crit || reaction ? 0.07 : f.boss ? 0.03 : 0.035);
		if (f.boss || crit) this.hooks.shake(crit ? 2.5 : 1.2, 0.12);
		// Phủ Hoả mốc 7: nhát được nổ — mục tiêu đầu tiên trúng nó nổ (kể cả vừa chết), các mục tiêu sau của cùng nhát thì không.
		if (hx?.blast && hx.blast === this.blastArmed) {
			this.blastArmed = 0;
			this.enchantBlast(a.x, a.y, base);
		}
	}

	/**
	 * Khống chế lên quái: đẩy (không đẩy boss), choáng, hất, đóng băng — boss một nửa thời lượng; phá giáp + vỡ giáp (đủ thời
	 * lượng — là suy yếu). `broken`: mục tiêu đã bị phá giáp TRƯỚC nhát này (điều kiện vỡ giáp).
	 */
	private control(f: Fighter, hx: HitFx, nx: number, ny: number, chilled = false, broken = false): void {
		if (hx.knock && !f.boss) f.push = { vx: (nx * hx.knock) / PUSH_SECONDS, vy: (ny * hx.knock) / PUSH_SECONDS, t: PUSH_SECONDS };
		if (hx.stun) f.stun = Math.max(f.stun, ccSeconds(hx.stun, f.boss));
		if (hx.launch) {
			const air = ccSeconds(hx.launch, f.boss);
			if (air > f.air) [f.air, f.airTotal] = [air, air];
		}
		if (hx.freeze) this.freezeTarget(f, hx.freeze * this.fx.freeze);
		if (hx.freezeChilled && chilled && f.freeze <= 0 && this.freezeTarget(f, hx.freezeChilled * this.fx.freeze)) {
			this.vfx.play('ice_burst', f.actor.x, f.actor.y - f.actor.chest, { fps: 18 });
			this.float(f.actor.x, f.actor.y - f.actor.height - 36, 'Đóng Băng!', REACTION_COLOR.freeze, 14);
		}
		// Kiếm phủ Băng: cộng dồn nhát trên mục tiêu chưa băng (nhát này vừa Đóng Băng nhờ phản ứng thì không đếm).
		if (hx.frost && f.freeze <= 0) {
			const step = frostStack(f.frostHits, this.time, hx.frost);
			f.frostHits = { n: step.n, at: this.time };
			if (step.freeze && this.freezeTarget(f, ENCHANT_FX.ice.freeze * this.fx.freeze)) {
				this.vfx.play('ice_burst', f.actor.x, f.actor.y - f.actor.chest, { fps: 18 });
				this.float(f.actor.x, f.actor.y - f.actor.height - 36, 'Đóng Băng!', REACTION_COLOR.freeze, 14);
			}
		}
		if (hx.armor) {
			if (f.armor <= 0) this.float(f.actor.x, f.actor.y - f.actor.height - 52, 'Phá giáp', 0xd9b47a, 12);
			f.armor = Math.max(f.armor, hx.armor);
		}
		if (hx.sunder && broken) {
			if (f.sunder <= 0) this.float(f.actor.x, f.actor.y - f.actor.height - 68, 'Vỡ giáp!', 0xffb070, 13);
			f.sunder = Math.max(f.sunder, hx.sunder);
		}
		if (f.stun > 0 || f.freeze > 0 || f.air > 0) {
			f.windup = 0;
			this.endSwing(f);
		}
	}

	/** Hút máu (Huyết Thuỷ, Thuỷ Long Trảm): hồi `pct` sát thương THẬT đã gây — số xanh nhỏ trên đầu. */
	private lifesteal(damage: number, pct: number): void {
		const pc = this.pc;
		const heal = lifestealHeal(damage, pct);
		if (heal < 1 || pc.dead || pc.hp >= pc.hpMax) return;
		pc.hp = Math.min(pc.hpMax, pc.hp + heal);
		this.float(this.player.x + 10, this.player.y - this.player.height - 4, `+${heal}`, 0x5be38a, 11);
	}

	/**
	 * `fromBurn`: nhịp cháy — quái chết vì nó vẫn tính là "chết lúc đang cháy" (Tro Tàn) dù đồng hồ cháy vừa về 0. `snap`:
	 * trạng thái lúc TRÚNG đòn (trước phản ứng của chính nhát này) — xem `hit`.
	 */
	private damage(f: Fighter, amount: number, color: number, crit: boolean, fromBurn = false, snap?: { burning: boolean; frozen: boolean }): void {
		if (f.dead) return;
		f.flash = 0.09;
		f.shownBar = 3;
		this.float(f.actor.x + (Math.random() - 0.5) * 16, f.actor.y - f.actor.height - 12, `${amount}${crit ? '!' : ''}`, color, crit ? 20 : 14);
		if (f.net) {
			// Quái dùng chung: máy chủ trừ máu thật (`netSync`) và quyết lúc gục (`netKill`). Ở đây trừ tạm cho thanh máu phản hồi
			// ngay, giữ tối thiểu 1 — không tự gục (gục mà máy chủ chưa nhận là quái "chết" ở máy này còn sống ở máy khác).
			f.hp = Math.max(1, f.hp - amount);
			f.net.dying = snap ?? { burning: f.burn > 0, frozen: f.freeze > 0 };
			this.hooks.netHit?.(f, amount);
			return;
		}
		f.hp -= amount;
		if (f.hp <= 0) this.kill(f, fromBurn, snap);
	}

	private kill(f: Fighter, fromBurn = false, snap?: { burning: boolean; frozen: boolean }, rewarded = true): void {
		const a = f.actor;
		// Bị động GĐ3 đọc trạng thái lúc chết (trước khi xoá): chết lúc đang cháy → Tro Tàn; chết lúc đóng băng → vụn băng.
		// "Lúc chết" gồm cả lúc trúng nhát kết liễu: Thổ đập vỡ băng (Vỡ Vụn ×2,2) hay Thuỷ dập lửa (Hơi Nước) mà giết luôn thì
		// vẫn nổ — phản ứng đó xoá trạng thái trước khi tới đây.
		const burning = fromBurn || !!snap?.burning || f.burn > 0;
		const frozen = (!!snap?.frozen || f.freeze > 0 || f.iced) && this.fx.frozenTaken > 1;
		const [emberFrom, iceFrom] = [f.emberDepth, f.iceDepth];
		f.hp = 0;
		f.dead = true;
		f.deathT = 0;
		f.respawnT = respawnDelay(f) ?? 0;
		f.engaged = false;
		f.burn = 0;
		f.wet = 0;
		f.chill = 0;
		f.frost = 0;
		f.freeze = 0;
		Object.assign(f, { stun: 0, air: 0, airTotal: 0, slow: 0, slowMult: 1, armor: 0, sunder: 0, miss: 0, daze: 0, iced: false, dust: 0, burnPower: 1, push: null });
		Object.assign(f, { freezeImmune: 0, iceDepth: 0, emberDepth: 0, route: null, frostHits: { n: 0, at: -99 } });
		a.view.sprite.y = 0;
		if (frozen) this.shatterBurst(f, iceFrom);
		if (burning && this.fx.ember) this.queueEmber(a.x, a.y, emberFrom);
		f.flash = 0;
		f.windup = 0;
		this.endSwing(f);
		if (f.boss) {
			// Boss gục thì đòn đang chờ nổ / đạn đang bay của nó tan theo, không gây sát thương sau khi chết.
			// (Chỉ đánh dấu: kill() có thể chạy GIỮA vòng lặp đạn, xoá mảng tại chỗ là lệch chỉ số.)
			for (const t of this.telegraphs) {
				t.g.destroy();
				t.ring.destroy();
			}
			this.telegraphs.length = 0;
			for (const pr of this.projectiles) if (pr.team === 'enemy') pr.fizzle = true;
			this.vfx.play('dark_ring', a.x, a.y, { layer: 'ground', fps: 12 });
			this.vfx.play('shadow', a.x, a.y - a.chest - 4, { fps: 12 });
			this.vfx.play('light_pillar', a.x, a.y - pillar(a), { blend: 'add', fps: 12 });
			this.flashScreen(0xffffff, 0.5);
			this.hooks.shake(7, 0.7);
			this.hitStop = 0.25;
		} else {
			this.vfx.play('shadow', a.x, a.y - a.chest + 2, { fps: 20, alpha: 0.85 });
			this.vfx.play('dust', a.x, a.y - 10, { fps: 18 });
			this.hitStop = Math.max(this.hitStop, 0.06);
		}
		// Quái dùng chung gục mà máy này không được tính công (không đánh nó trong 30 giây gần nhất): chỉ phần hình.
		if (!rewarded) return;
		this.pc.coins += f.stats.coins;
		this.hooks.toast(`+${f.stats.coins} xu`, 'loot');
		this.grantExp(f.stats.exp);
		this.hooks.enemyKilled(f);
	}

	// ———————————————————————————— quái dùng chung (máy chủ quyết) ————————————————————————————

	/** Máu thật từ máy chủ sau một đòn. `foreign`: đòn của người khác → hiện số sát thương (đòn của mình đã hiện lúc đánh). */
	netSync(f: Fighter, hp: number, foreign?: number): void {
		if (f.dead) return;
		f.hp = Math.max(0, Math.min(f.hpMax, hp));
		if (foreign) {
			f.flash = 0.09;
			f.shownBar = 3;
			this.float(f.actor.x + (Math.random() - 0.5) * 16, f.actor.y - f.actor.height - 12, `${foreign}`, 0xd9d9d9, 12);
		}
	}

	/** Máy chủ báo quái gục. `rewarded`: máy này được tính công (EXP, xu, nhiệm vụ). */
	netKill(f: Fighter, rewarded: boolean): void {
		if (f.dead) return;
		const snap = f.net?.dying;
		this.kill(f, false, snap, rewarded);
	}

	/** Máy chủ báo quái sống lại ở (x, y). */
	netRespawn(f: Fighter, x: number, y: number): void {
		this.respawn(f);
		Object.assign(f.actor, { x, y });
		if (f.net) Object.assign(f.net, { tx: x, ty: y, dying: undefined });
		f.actor.sync();
	}

	/**
	 * Động tác đánh của quái dùng chung do CHỦ (máy khác) phát: con rối diễn lại, đòn xét trên người chơi MÁY NÀY — sát thương
	 * lấy từ chỉ số quái ở máy này, tin mạng chỉ mang vị trí / hướng.
	 */
	netAct(f: Fighter, act: MobAct): void {
		const n = f.net;
		if (!n || n.owned || f.dead) return;
		const a = f.actor;
		if (act.k === 'wind') {
			const dir = act.dir as Direction;
			a.view.cancelAction();
			const plan = a.view.strikePlan(dir, act.s);
			// Không có động tác đánh cho hướng đó: nháy trắng báo đòn như quái riêng (`windup` trừ dần trong `puppet`).
			if (!plan || !a.view.playAction('attack', dir, { timing: plan.timing, external: false })) f.windup = act.s;
			return;
		}
		if (act.k === 'aoe') return this.telegraph(act.x, act.y, BOSS_AOE.r, BOSS_AOE.seconds, f.stats.atk * BOSS_AOE.power);
		f.windup = 0;
		if (!a.view.busy) a.lunge(act.nx, act.ny, act.k === 'shot' ? 3 : 10);
		if (act.k === 'shot') return this.enemyShot(f, act.nx, act.ny, act.x, act.y);
		this.meleeAt(f, act.x, act.y, act.nx, act.ny, Math.hypot(this.player.x - act.x, this.player.y - act.y), true);
	}

	/**
	 * Khống chế máy khác gây ra trên quái dùng chung (máy chủ đã kẹp trần): chủ áp vào AI (đứng im, chậm, đánh trượt, bị đẩy),
	 * con rối thì đổi màu + ăn phá giáp / vỡ giáp cho đòn của máy này.
	 */
	netControl(f: Fighter, cc: MobCc): void {
		const n = f.net;
		if (!n || f.dead) return;
		const seen = (n.ccSeen ??= {});
		for (const k of MOB_CC_KEYS) {
			const v = cc[k];
			if (v === undefined) continue;
			seen[k] = Math.max(seen[k] ?? 0, v);
			if (k === 'slow') addSlow(f, v, cc.slowMult ?? f.slowMult);
			else if (k === 'freeze') {
				if (canFreeze(f)) f.freeze = Math.max(f.freeze, v);
			} else if (v > f[k]) {
				f[k] = v;
				if (k === 'air') f.airTotal = v;
			}
		}
		if (cc.push && n.owned && !f.boss) {
			f.push = { vx: cc.push[0], vy: cc.push[1], t: cc.push[2] };
			n.pushSeen = f.push;
		}
		if (f.stun > 0 || f.freeze > 0 || f.air > 0) {
			f.windup = 0;
			this.endSwing(f);
			if (!n.owned) f.actor.view.cancelAction();
		}
	}

	/**
	 * Khống chế trên quái dùng chung vừa TĂNG ở máy này (đòn của mình lên con rối, hoặc trên quái mình làm chủ) → gửi đi.
	 * `ccSeen` trừ dần theo giờ đúng như chính khống chế, nên chỉ phần dài thêm mới được gửi. Cú đẩy chỉ có nghĩa với chủ (AI
	 * di chuyển quái) nên chỉ gửi từ con rối.
	 */
	private ccOut(f: Fighter, n: NetMob, dt: number): void {
		if (!this.hooks.netCc) return;
		const seen = (n.ccSeen ??= {});
		let out: MobCc | null = null;
		for (const k of MOB_CC_KEYS) {
			const known = Math.max(0, (seen[k] ?? 0) - dt);
			seen[k] = known;
			if (f[k] <= known + CC_SYNC_EPS) continue;
			out ??= {};
			out[k] = Math.round(f[k] * 1000) / 1000;
			seen[k] = f[k];
			if (k === 'slow') out.slowMult = f.slowMult;
		}
		if (!n.owned && f.push && f.push !== n.pushSeen) {
			out ??= {};
			out.push = [Math.round(f.push.vx), Math.round(f.push.vy), Math.round(f.push.t * 1000) / 1000];
			n.pushSeen = f.push;
		}
		if (out) this.hooks.netCc(f, out);
	}

	/** Con rối (quái người khác làm chủ): trượt mượt tới vị trí máy chủ phát; lệch xa (vừa đổi chủ / hồi sinh) thì nhảy thẳng. */
	private puppet(f: Fighter, dt: number): void {
		const a = f.actor;
		const n = f.net!;
		if (f.windup > 0) f.windup = Math.max(0, f.windup - dt);
		const k = 1 - Math.exp(-12 * dt);
		a.x += (n.tx - a.x) * k;
		a.y += (n.ty - a.y) * k;
		if (Math.hypot(n.tx - a.x, n.ty - a.y) > 300) Object.assign(a, { x: n.tx, y: n.ty });
		a.wanderEnabled = false;
		a.view.set(n.anim, n.dir, f.stats.speed / 78);
		// Thanh máu boss trên HUD: con rối "đang giao chiến" khi đứng gần người chơi máy này.
		const p = this.player;
		f.engaged = !this.pc.dead && Math.hypot(p.x - a.x, p.y - a.y) < f.stats.aggro;
		// Người chơi máy này lọt vào tầm phát hiện: xin làm chủ — máy chủ chỉ đổi khi mình gần quái hơn chủ cũ, nên quái luôn
		// đuổi đánh người GẦN NHẤT (AI chỉ biết người chơi của máy đang chạy nó).
		if (f.engaged && this.time - (n.askedAt ?? -99) >= 1) {
			n.askedAt = this.time;
			this.hooks.netAggro?.(f);
		}
	}

	private respawn(f: Fighter): void {
		const a = Math.random() * Math.PI * 2;
		const r = Math.random() * f.home.radius * 0.7;
		Object.assign(f.actor, { x: f.home.x + Math.cos(a) * r, y: f.home.y + Math.sin(a) * r });
		f.dead = false;
		f.hp = f.hpMax;
		this.endSwing(f);
		// Sống lại như con mới sinh: không mang trạng thái ướt/lạnh/đang đánh từ kiếp trước (boss vùng: nhịp AoE từ đầu).
		Object.assign(f, { engaged: false, burn: 0, wet: 0, chill: 0, frost: 0, freeze: 0, flash: 0, windup: 0, attacks: 0, deathT: 0, shownBar: 0, attackTimer: 1 + Math.random(), aoeTimer: 6 });
		Object.assign(f, { stun: 0, air: 0, airTotal: 0, slow: 0, slowMult: 1, armor: 0, sunder: 0, miss: 0, daze: 0, iced: false, dust: 0, burnPower: 1, push: null });
		Object.assign(f, { freezeImmune: 0, iceDepth: 0, emberDepth: 0, route: null, frostHits: { n: 0, at: -99 } });
		f.actor.view.sprite.y = 0;
		f.actor.root.alpha = 1;
		f.actor.sync();
		this.vfx.play('dust', f.actor.x, f.actor.y - 10, { fps: 16 });
	}

	private flameBurst(x: number, y: number, damage: number): void {
		this.vfx.play('fire_ring', x, y, { layer: 'ground', blend: 'add', fps: 18 });
		this.vfx.play('fire_burst', x, y - 40, { blend: 'add', fps: 18 });
		this.flashScreen(0xffa040, 0.16);
		this.hooks.shake(2.2, 0.18);
		for (const f of this.enemies) if (!f.dead && Math.hypot(f.actor.x - x, (f.actor.y - y) * 1.4) < 86) this.damage(f, Math.round(damage * this.vulnerability(f)), 0xffa23d, false);
	}

	private telegraph(x: number, y: number, r: number, seconds: number, damage: number): void {
		const g = new Graphics();
		const ring = new Sprite(this.vfx.frames('dark_ring_warn')[0]);
		ring.anchor.set(0.5);
		ring.position.set(Math.round(x), Math.round(y));
		this.groundFx.addChild(g, ring);
		this.telegraphs.push({ ring, g, x, y, r, t: seconds, total: seconds, damage });
	}

	private updateTelegraphs(dt: number): void {
		for (let i = this.telegraphs.length - 1; i >= 0; i -= 1) {
			const t = this.telegraphs[i]!;
			t.t -= dt;
			const k = 1 - t.t / t.total;
			t.ring.alpha = 0.45 + 0.45 * Math.abs(Math.sin(k * Math.PI * (2 + k * 4)));
			t.g.clear();
			t.g.ellipse(t.x, t.y, t.r * k, t.r * 0.55 * k).fill({ color: 0xff2a4a, alpha: 0.22 });
			if (t.t <= 0) {
				this.vfx.play('dark_ring', t.x, t.y, { layer: 'ground', fps: 22 });
				this.vfx.play('shadow', t.x, t.y - 40, { fps: 18 });
				this.vfx.play('fire_burst', t.x, t.y - 30, { blend: 'add', fps: 20, tint: 0xff7aa0 });
				this.flashScreen(0xff3355, 0.28);
				this.hooks.shake(5, 0.35);
				this.hitStop = Math.max(this.hitStop, 0.08);
				const p = this.player;
				if (Math.hypot((p.x - t.x) / t.r, (p.y - t.y) / (t.r * 0.55)) < 1) this.incoming('area', t.damage);
				t.g.destroy();
				t.ring.destroy();
				this.telegraphs.splice(i, 1);
			}
		}
	}

	/**
	 * Vết chém lưỡi liềm. Không có động tác: đổi chiều mỗi nhát (trái/phải) cho chuỗi combo không lặp một kiểu.
	 * Có động tác (`animatedDir`): một chiều cố định khớp chiều vung — phía tây là bản lật gương của phía đông
	 * nên lật vệt theo; N/S không lật gương nên giữ một chiều. Pixi lật TRƯỚC rồi mới xoay: xoay 180° + lật Y mới là
	 * gương ngang (x, y) → (−x, y); xoay 180° + lật X ra (x, −y) — bụng vệt quay ngược về người đánh.
	 */
	private slashFx(x: number, y: number, dx: number, dy: number, element: Element, animatedDir: Direction | null = null): void {
		// Chiều vệt theo HƯỚNG đã khoá (dải frame đang phát), không theo dấu dx: ngắm gần thẳng đứng thì dx chỉ là nhiễu.
		if (animatedDir) this.swing = MIRRORED_DIRS.has(animatedDir) ? -1 : 1;
		else this.swing = -this.swing;
		const len = Math.hypot(dx, dy) || 1;
		const nx = dx / len;
		const ny = dy / len;
		const tint = element === 'fire' ? 0xffa64d : element === 'steel' ? 0xf4f7ff : ELEMENT_TINT[element];
		this.vfx.play('slash', x + nx * 40, y + ny * 28, { rotation: Math.atan2(ny, nx), flipY: this.swing < 0, tint, fps: 32, blend: element === 'fire' ? 'add' : 'normal' });
		if (element === 'fire') this.vfx.play('fire_flash', x + nx * 54, y + ny * 36, { blend: 'add', fps: 24 });
	}

	private flashScreen(color: number, alpha: number): void {
		if (alpha >= this.screenFlash.alpha) this.screenFlash = { color, alpha };
	}

	private float(wx: number, wy: number, text: string, color: number, size: number): void {
		const t = this.floatPool.pop() ?? new Text({ text: '', style: { fontFamily: 'system-ui, sans-serif', fontWeight: '800', stroke: { color: 0x0b0d12, width: 4 } } });
		t.text = text;
		t.style.fill = color;
		t.style.fontSize = Math.round(size * (window.devicePixelRatio || 1));
		t.anchor.set(0.5, 1);
		t.alpha = 1;
		t.visible = true;
		t.scale.set(1.35);
		if (!t.parent) this.screenLayer.addChild(t);
		this.floats.push({ text: t, wx, wy, life: 0.95, vy: -44 });
	}

	private drawOverlays(dt: number, toScreen: (x: number, y: number) => { x: number; y: number }, zoom: number): void {
		for (let i = this.floats.length - 1; i >= 0; i -= 1) {
			const f = this.floats[i]!;
			f.life -= dt;
			f.wy += f.vy * dt;
			f.vy *= 0.93;
			const s = toScreen(f.wx, f.wy);
			f.text.position.set(Math.round(s.x), Math.round(s.y));
			f.text.alpha = Math.min(1, f.life * 2.5);
			// Số bật to rồi co về — đọc được ngay cả khi nhiều số chồng lên nhau.
			f.text.scale.set(1 + Math.max(0, f.life - 0.75) * 1.6);
			if (f.life <= 0) {
				f.text.visible = false;
				this.floatPool.push(f.text);
				this.floats.splice(i, 1);
			}
		}
		const g = this.bars;
		g.clear();
		const unit = Math.max(1, Math.round(window.devicePixelRatio || 1));
		for (const f of this.enemies) {
			f.shownBar = Math.max(0, f.shownBar - dt);
			if (f.dead || f.boss || (f.shownBar <= 0 && !f.engaged)) continue;
			const s = toScreen(f.actor.x, f.actor.y - f.actor.height - 4);
			const w = 34 * unit * Math.max(1, zoom / 2);
			const h = 4 * unit;
			const x = Math.round(s.x - w / 2);
			const y = Math.round(s.y);
			g.rect(x - unit, y - unit, w + unit * 2, h + unit * 2).fill({ color: 0x0b0d12, alpha: 0.85 });
			g.rect(x, y, Math.round(w * (f.hp / f.hpMax)), h).fill({ color: f.freeze > 0 ? 0xc8f4ff : f.chill > 0 ? 0x7fd8ff : f.burn > 0 ? 0xff9f43 : 0xe5484d });
		}
	}

	private applyLevel(fill: boolean): void {
		const pc = this.pc;
		const lv = pc.level - 1;
		const p = PATHS[this.path ?? 'none'];
		// Núi Thiêng (Thổ 9): máu tối đa ×1,15 — HUD / bảng Nhân vật đọc thẳng `hpMax` nên tự đúng.
		// Trang bị cộng phẳng TRƯỚC hệ số (`setGear`); `atk`/`mag` của trang bị cộng lúc ra đòn (`swordAtk`/`magicAtk`).
		pc.hpMax = Math.round((p.hp[0] + lv * p.hp[1] + this.gear.hp) * this.fx.hpMax);
		pc.mpMax = p.mp[0] + lv * p.mp[1] + this.gear.mp;
		pc.atk = p.atk[0] + lv * p.atk[1];
		pc.def = p.def[0] + lv * p.def[1] + this.gear.def;
		if (fill || pc.hp > pc.hpMax || pc.hp === 0) pc.hp = pc.hpMax;
		if (fill || pc.mp > pc.mpMax || pc.mp === 0) pc.mp = pc.mpMax;
	}
}

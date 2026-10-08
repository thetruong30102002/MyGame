import { Assets, Container, Graphics, Sprite, Text, type Application, type Texture, type Ticker } from 'pixi.js';
import { cleanGearView, type GiftView, type PlayerView } from '@aether/protocol';
import type { OnlineSession } from '@/net/OnlineSession';
import { onlineStoryStorage } from '@/net/onlineStoryStorage';
import { useSession } from '@/store/useSession';
import { useSettings } from '@/store/useSettings';
import { useGameStore, type DialogueLine, type EquipSlotView, type GameRequest, type InventoryItem, type TalentsView } from '@/store/useGameStore';
import { loadCharacter, loadManifest, type AssetManifest, type CharacterManifestEntry, type Direction } from './assets/AssetManifest';
import { Camera } from './camera/Camera';
import { bossIntro, killOutcome, pickHudBoss, regionBossDormancy, regionBossDownText } from './combat/bossRules';
import { CombatSystem, type Fighter } from './combat/CombatSystem';
import { aheadPoint } from './combat/skillRules';
import { expForLevel, HERO_SKILLS, isGroundTarget, PATHS, type HeroPath } from './combat/skills';
import {
	assignSlot,
	BRANCH_LOCK_NOTE,
	BRANCH_NAME,
	BRANCHES,
	branchOpen,
	canEnchant,
	defaultLoadout,
	depthBonus,
	describeBuild,
	ENCHANT_ELEMENT_TIER,
	ENCHANT_SWORD_TIER,
	ENCHANTS,
	enchantDesc,
	knowsSkill,
	MAX_LEVEL,
	MAX_TIER,
	nextTierCost,
	normalizeLoadout,
	placeSkill,
	pointsForLevel,
	resetCost,
	SKILL_NODE,
	skillDesc,
	SLOT_CODES,
	SLOT_KEYS,
	spentPoints,
	STYLE_TIER,
	STYLE_TREE,
	SWORD_ART_TIER,
	SWORD_ARTS,
	SWORD_STYLE_INFO,
	SWORD_STYLES,
	TIER_COST,
	tierCap,
	TREE,
	treeOf,
	unspent,
	type EnchantId,
	type Loadout,
	type SwordStyle,
	type Tiers,
	type TreeNode,
} from './combat/talents';
import { Vfx, type VfxId } from './combat/Vfx';
import { createPixelApp, defaultZoom, fitCanvas } from './core/pixelApp';
import { Actor, type Mover, type WanderArea } from './entities/Actor';
import { WALK_SPEED_REFERENCE } from './entities/CharacterView';
import { AutoWalk } from './AutoWalk';
import { directionOf, Keyboard, type MoveIntent } from './input/Keyboard';
import { setVirtualAxis, virtualInput } from './input/virtualInput';
import { STORY } from './story/story';
import { ageTitle, controlsForAge } from './story/ages';
import { npcAnchor, resolveTarget, type ResolvedTarget } from './story/resolveTarget';
import { localStoryStorage, StoryDirector } from './story/StoryDirector';
import { persona, personalize, setPersona } from './story/persona';
import type { Line } from './story/storyTypes';
import { applyGearRequest, EQUIP_SLOTS, gearBonus, itemDef, SLOT_NAME, STAT_KEYS, stackStats, zeroStats, type EquipSlotId, type ItemStack, type Stats } from './equipment';
import { baseOfOutfit, decodeGear, defaultStance, encodeGear, figureGear, gearPieces, outfitSprite, type GearPiece } from './gearLayers';
import { GEAR_ART } from './gearArt';
import { buildCodex, npcKey } from './codex';
import { isSharedZone } from '@aether/sim/mobs';
import { CHRONICLER } from '@aether/sim/rewards';
import { buffMults, MERCHANT_NPCS, SHOP } from '@aether/sim/shop';
import type { MobView } from '@aether/protocol';
import { GIFT_ITEMS } from './items';
import { activeBuffs, giftText } from './rewards';
import { crossesExit, EDGE_DIR, exitGoal, type MapExit } from './world/exits';
import { MapWorld } from './world/MapWorld';
import { loadWorldIndex, type WorldIndex } from './world/WorldIndex';
import { NavGrid } from './world/NavGrid';

const RUN_SPEED = 150;
/**
 * Đang ra đòn (vào thế → khung chạm) mà vẫn giữ phím đi: bước chậm lại thay vì khoá chân cứng — giữ J vừa đi
 * vừa chém không thành nhịp khựng-đi-khựng. Qua mốc huỷ thì thu thế bị cắt, đi lại đủ tốc.
 */
const ACTION_MOVE_SCALE = 0.4;
/** Người chơi khác lệch quá chừng này (px) so với vị trí mới nhận: đang lăn né / lướt → dừng động tác ngay. */
const REMOTE_DASH_GAP = 24;
/** Mã phím → chỉ số ô trên thanh 10 ô (J, K, 1–8). Ô nào chứa kỹ năng gì do người chơi gán (`SaveData.loadout`). */
const SKILL_KEYS: Record<string, number> = Object.fromEntries(SLOT_CODES.map((code, i) => [code, i]));
/** Tên phủ phép (chip trên bảng Tiềm năng). */
const ENCHANT_LABEL: Record<EnchantId, string> = { fire: 'Kiếm Lửa', water: 'Kiếm Thuỷ', wind: 'Kiếm Phong', ice: 'Kiếm Băng', earth: 'Kiếm Thổ' };
/**
 * Giữ phím của ô J / ô K thì đánh liên tục theo nhịp hồi chiêu của kỹ năng đang gán ở ô đó. Phím số KHÔNG lặp để khỏi
 * xả MP ngoài ý muốn. Không muốn thì để mảng rỗng.
 */
const HOLD_REPEAT = ['KeyJ', 'KeyK'];
/** Vùng bấm trúng người chơi khác: nửa bề ngang thân (px thế giới) + phần nới lên trên đầu để bấm cả vào nhãn tên. */
const REMOTE_HIT_HALF_W = 18;
const REMOTE_HIT_LABEL = 24;
/** Thư viện ghi "đã gặp" khi quái / NPC đứng trong bán kính này quanh người chơi (px thế giới — gần một màn hình). */
const CODEX_SEE_RANGE = 320;
const FACING: Record<string, [number, number]> = { S: [0, 1], N: [0, -1], E: [1, 0], W: [-1, 0], SE: [1, 1], SW: [-1, 1], NE: [1, -1], NW: [-1, -1] };
/** Vật phẩm nhặt → đồ vật của vùng dùng làm hình. */
const PICKUP_PROP: Record<string, string> = { mushroom: 'mushroom_glow', herb: 'herb_silver', flower: 'wildflowers', stone: 'rock_gray' };
const ITEM_NAME: Record<string, string> = { mushroom: 'Nấm Ánh Lam', herb: 'Cỏ thuốc', flower: 'Hoa', stone: 'Đá' };

const LABEL_COLOR: Record<CharacterManifestEntry['role'], number> = {
	player: 0xffffff,
	npc: 0xe9c46a,
	monster: 0xfda4af,
	boss: 0xc4b5fd,
};

interface Npc {
	key: string;
	actor: Actor | null;
	/** NPC chưa có sprite: điểm tương tác phát sáng (vd gọi mẹ qua cửa nhà). */
	marker: Sprite | null;
	/** Vật thể làm hình cho NPC không có sprite (`NpcDef.prop` — vd bia đá cổ). */
	prop: Sprite | null;
	/** Quả cầu sáng nổi cao bao nhiêu trên chân (vật thể cao thì cầu nổi trên đỉnh vật). */
	markerLift: number;
	label: Text;
	x: number;
	y: number;
}

/** Người chơi khác: vẽ bằng Actor (không AI), trượt mượt tới vị trí mới nhất máy chủ gửi. */
interface Remote {
	view: PlayerView;
	actor: Actor | null;
	label: Text;
	tx: number;
	ty: number;
	loading: string;
}

/** Mũi tên chỉ hướng ở một lối sang map: vẽ trong thế giới (theo camera), chữ tên map ở lớp chữ màn hình. */
interface ExitMarker {
	exit: MapExit;
	arrow: Graphics;
	label: Text;
	x: number;
	y: number;
}

interface Pickup {
	item: string;
	sprite: Sprite;
	x: number;
	y: number;
	t: number;
	/** Đồ của người chơi để dưới đất vì túi đầy (`Game.dropItem`) — nhặt là vào túi, không tính nhiệm vụ. */
	loot?: { id: string; n: number };
}

type Interactable = { kind: 'npc'; npc: Npc } | { kind: 'pickup'; pickup: Pickup };

/** Vì sao dừng tự đi: người chơi tự điều khiển, tới nơi, không có đường, có thoại/thẻ, chết, đổi nhiệm vụ… */
type AutoWalkStop = 'manual' | 'arrived' | 'fail' | 'busy' | 'dead' | 'quest' | 'age' | 'teleport' | 'toggle' | 'enemy' | 'map';
const NO_INTENT: MoveIntent = { x: 0, y: 0, run: false };
/**
 * Địa điểm không hiện tên trên bản đồ (trừ khi đang là mục tiêu): chỗ rải vật phẩm, và điểm đến của lối sang map
 * (`*_entry`, `east_gate`) — bản đồ đã có nhãn "→ Tên map" của chính lối đó, hiện cả hai là trùng.
 */
const HIDDEN_LANDMARK = /^(forest_spot_|herb_spot_)|_entry$|^east_gate$/;
/** Nhãn "→ Tên map" lùi vào trong map chừng này (px thế giới) để chữ không bị mép bản đồ cắt. */
const EXIT_LABEL_INSET = 260;

/**
 * Vòng lặp client của vertical slice. Di chuyển/chiến đấu đang mô phỏng ở client; Phase 11 chuyển
 * `MoveIntent` + "dùng kỹ năng" lên server authoritative, client chỉ dự đoán + nội suy.
 */
export class Game {
	/** Instance còn sống (StrictMode ở dev dựng 2 cái, cái bị huỷ có thể xong init SAU cái thật). */
	private static readonly live = new Set<Game>();
	static get current(): Game | null {
		return [...Game.live].pop() ?? null;
	}

	private app!: Application;
	private keyboard!: Keyboard;
	private camera!: Camera;
	private world!: MapWorld;
	private worldIndex!: WorldIndex;
	/** Map đang đứng trong vùng (`town`, `mossvale`…); lưu lên máy chủ dạng `<vùng>/<map>`. */
	private mapId = 'town';
	/** Đang chuyển map: khoá điều khiển, màn tối dần rồi sáng lại. */
	private changing = false;
	private readonly fade = { alpha: 0, target: 0 };
	private readonly fadeLayer = new Graphics();
	private readonly exitLayer = new Container();
	private exitMarkers: ExitMarker[] = [];
	private manifest!: AssetManifest;
	private player!: Actor;
	private combat!: CombatSystem;
	private story!: StoryDirector;
	private readonly actors: Actor[] = [];
	private npcs: Npc[] = [];
	private readonly pickups: Pickup[] = [];
	private readonly labels = new Map<Actor, Text>();
	private readonly scene = new Container();
	private readonly entities = new Container({ sortableChildren: true });
	private readonly labelLayer = new Container();
	private readonly vfx = new Vfx();
	private readonly flashLayer = new Graphics();
	/** Boss CỐT TRUYỆN của map (đánh thức qua `awakenBoss`) — chặn đánh thức lần hai, là đích tự đi của nhiệm vụ boss. */
	private boss: Fighter | null = null;
	/** Boss VÙNG đang có trên map (vùng quái `boss: true`) → id + tên vùng (tên cho toast lúc hạ). Không đụng `this.boss`. */
	private readonly regionBosses = new Map<Fighter, { zone: string; name: string }>();
	/**
	 * Boss vùng đang nằm: khoá `vùng/map/id-vùng` → mốc thức dậy theo `combat.time`. Ghi lúc gỡ map (đồng hồ hồi sinh
	 * trong Fighter mất theo), đọc lại khi dựng vùng — ra cổng rồi vào lại không có boss mới đầy máu. Sống suốt phiên.
	 */
	private readonly regionBossWakeAt = new Map<string, number>();
	/** Tăng mỗi lần gỡ map: vùng quái tải xong SAU khi đã đổi map thì huỷ actor, không dựng lên map mới. */
	private mapToken = 0;
	/** Boss vùng đã chào người chơi trong phiên này (hồi sinh / quay lại map không chào lại). */
	private readonly seenBossIntro = new Set<string>();
	private hudTimer = 0;
	private saveTimer = 0;
	private area = '';
	private readonly mouse = { x: 0, y: 0, inside: false };
	private resizeObserver?: ResizeObserver;
	private destroyed = false;
	/** Frame trước UI có đang chặn input không — phím vừa đóng thoại không được lọt sang game. */
	private uiBusyPrev = true;
	private swapToken = 0;
	/** Tuổi đang HIỂN THỊ: chỉ đổi khi thẻ tuổi hiện lên, còn `story.state.age` đổi ngay lúc trả nhiệm vụ. */
	private shownAge = 0;
	private unsubscribe?: () => void;
	private readonly mover: Mover = (pos, dx, dy) => this.world.move(pos, dx, dy);
	private online: OnlineSession | null = null;
	private readonly remotes = new Map<string, Remote>();
	private moveTimer = 0;
	private lastSent = '';
	private wired = false;
	/** Lưới tìm đường dựng lười ở lần tự đi đầu tiên (~5ms). */
	private nav: NavGrid | null = null;
	private autoWalk: AutoWalk | null = null;
	/** Mốc lúc bắt đầu tự đi: bị đánh / thêm quái lao vào thì dừng. */
	private autoWalkStart = { hurt: 0, engaged: 0 };
	private questKey = '';
	private markerTick = 0;
	private lastMarkers = '';
	private lastAutoWalkView = '';
	private stickDowns = 0;
	/** Bảng tiềm năng / kho đồ đã ghi vào store lần trước (JSON) — không đổi thì không ghi, React khỏi vẽ lại. */
	private lastTalents = '';
	private lastInventory = '';
	private lastEquipment = '';
	private lastBasis: { key: string; value: { base: Stats; scale: Stats } } = { key: '', value: { base: zeroStats(), scale: zeroStats() } };
	/** Tổng chỉ số đồ đang mặc (tính lại mỗi lần mặc/tháo — `syncGear`), đẩy lên bảng cùng nhịp HUD. */
	private gearStats: Stats = zeroStats();
	/** Đồ GẮN đang mặc (có lớp vẽ) — áp lên actor người chơi sau mỗi lần dựng/đổi sprite, gửi cho người khác. */
	private gearPieces: GearPiece[] = [];
	/** Quái dùng chung của map đang đứng (M3.2) theo mã máy chủ. */
	private readonly netMobs = new Map<string, Fighter>();
	/** Đã xin máy chủ quái dùng chung cho map này chưa (gửi lại sau khi nối lại mạng). */
	private mobsWanted = false;
	/** Nhịp báo vị trí quái mình làm chủ (giây). */
	private mobPosT = 0;
	/** Nhịp quét "đã gặp" cho Thư viện (giây). */
	private codexT = 0;
	/** Đã đặt thế cầm mặc định cho người chơi chưa (một lần — sau đó thế cầm theo động tác). */
	private stanceSet = false;
	private lastGearSent = '';
	/** Món áo ở lần áp trước (null = chưa áp lần nào) — chỉ ĐỔI ÁO mới đổi sprite, không đè sprite chọn tay ở bảng Dev. */
	private outfitBody: string | null | undefined = null;
	/** Kỹ năng đã biết ở lần đồng bộ trước — kỹ năng MỚI học thì tự đặt vào thanh (ô nhà, không thì ô trống đầu). */
	private knownPrev: Set<string> | null = null;

	static async start(host: HTMLElement, signal?: AbortSignal, online: OnlineSession | null = null): Promise<Game> {
		const game = new Game();
		game.online = online;
		signal?.addEventListener('abort', () => game.destroy(), { once: true });
		try {
			await game.init(host);
		} catch (e) {
			game.destroy();
			throw e;
		}
		return game;
	}

	private async init(host: HTMLElement): Promise<void> {
		// Store sống qua các lượt vào game (về màn chọn nhân vật không reset nó): bảng / bản đồ lớn còn mở từ nhân vật trước
		// sẽ hiện đè màn chờ và khoá `canAct()` của lượt mới.
		useGameStore.setState({ status: 'loading', error: null, panel: null, mapOpen: false, playerSprite: null });
		// Nhân vật người chơi đóng vai chính; tiến độ truyện theo nhân vật (lưu máy chủ) hoặc theo trình duyệt (chơi đơn).
		const online = this.online;
		setPersona(online ? { name: online.character.name, gender: online.character.gender } : { name: 'Lior', gender: 'male' });
		StoryDirector.storage = online ? onlineStoryStorage(online) : localStoryStorage;
		StoryDirector.thaw();
		this.app = await createPixelApp(host);
		if (this.destroyed) return void this.app.destroy(true);
		this.keyboard = new Keyboard();

		// Map đã lưu (`human/mossvale`) nếu còn trong chỉ mục vùng; không thì map khởi đầu.
		this.worldIndex = await loadWorldIndex('human');
		useGameStore.setState({ mapNames: Object.fromEntries(Object.keys(this.worldIndex.data.maps).map((m) => [`${this.worldIndex.region}/${m}`, this.worldIndex.name(m)])) });
		const savedMap = online?.progress.map?.split('/')[1];
		this.mapId = savedMap && this.worldIndex.has(savedMap) ? savedMap : this.worldIndex.data.start;
		const [manifest, world] = await Promise.all([loadManifest(), MapWorld.load(this.worldIndex.region, this.mapId, this.entities), this.vfx.load()]);
		if (this.destroyed) return void world.destroy();
		this.manifest = manifest;
		const entries = buildCodex(this.worldIndex.data, STORY.npcs, (id) => !!manifest.characters[id]);
		useGameStore.setState({ codex: { entries, seen: [], kills: {}, region: this.worldIndex.region } });
		useGameStore.setState({ portraits: Object.fromEntries(Object.entries(manifest.characters).flatMap(([id, c]) => (c.portrait ? [[id, `/assets/${c.portrait}`]] : []))) });
		this.world = world;
		this.publishMapInfo();

		this.story = new StoryDirector(STORY, {
			dialogue: (lines) => useGameStore.getState().pushBeat({ kind: 'dialogue', lines: this.toDialogue(lines) }),
			reward: (r, title) => {
				const st = useGameStore.getState();
				st.toast(`Hoàn thành: ${title}`, 'level');
				if (r.coins) this.combat.pc.coins += r.coins;
				if (r.potions) {
					this.combat.pc.potions += r.potions;
					st.toast(`+${r.potions} Bình hồi phục`, 'loot');
				}
				if (r.unlockSkill) this.announceUnlock(r.unlockSkill);
				// Nhiệm vụ thưởng bằng thứ khác (mở nhánh Thổ) có thể 0 EXP — không hiện "+0 EXP".
				if (r.exp > 0) this.combat.grantExp(r.exp);
				this.persist();
			},
			questsChanged: () => {
				useGameStore.setState({ quests: this.story.questViews() });
				// Sang việc khác (nhận / xong / đổi nhiệm vụ) thì chỗ đang tự đi tới không còn đúng nữa.
				const st = this.story.state;
				const key = `${this.story.quest?.id}:${st.accepted}:${st.ready}`;
				if (key !== this.questKey) {
					this.questKey = key;
					this.cancelAutoWalk('quest');
				}
			},
			unlocked: (id) => {
				// Quà là đồ (kiếm gỗ, trượng tập) đã vào hành trang trong StoryDirector: cộng chỉ số + vẽ lại kho đồ.
				this.syncGear();
				this.announceUnlock(id);
			},
			itemOverflow: (id, n) => this.dropItem(id, n),
			pickups: (item, spots, remaining) => this.spawnPickups(item, spots, remaining),
			clearPickups: (item) => this.clearPickups(item),
			awakenBoss: () => void this.awakenBoss(),
			spawnZone: (id) => void this.spawnZone(id),
			questCompleted: (q) => {
				if (!q.onComplete) return;
				const s = this.world.spot(q.onComplete.spot);
				if (!s) return;
				const id = q.onComplete.vfx as VfxId;
				for (let i = 0; i < (q.onComplete.times ?? 1); i += 1) {
					setTimeout(() => this.vfx.play(id, s.x + (Math.random() - 0.5) * 140, s.y - 60 - Math.random() * 90, { fps: 10, blend: 'add' }), i * 260);
				}
			},
			// Dựng thế giới tuổi mới lúc THẺ hiện lên: thoại "after" của nhiệm vụ cũ vẫn diễn ra ở tuổi cũ.
			ageChanged: (age, lines) => useGameStore.getState().pushBeat({ kind: 'card', title: ageTitle(age), lines, onShow: () => void this.onAgeChanged(age) }),
			chapterEnd: () => setTimeout(() => useGameStore.setState({ scene: 'chapter-end' }), 1600),
		});
		this.combat = new CombatSystem(
			{
				mover: this.mover,
				shake: (s, t) => useSettings.getState().shake && this.camera?.shake(s, t),
				toast: (text, tone) => useGameStore.getState().toast(text, tone),
				enemyKilled: (f) => {
					const outcome = killOutcome(f);
					if (outcome === 'story-boss') {
						useGameStore.setState({ boss: null });
						this.story.bossDefeated(f.id);
					} else {
						// Boss vùng hồi sinh mãi: tính như một con quái cho nhiệm vụ "kill", không bao giờ chạm cốt truyện boss.
						if (outcome === 'region-boss') useGameStore.getState().toast(regionBossDownText(f.name, this.regionBosses.get(f)?.name ?? 'hang ổ'), 'info');
						this.story.monsterKilled(f.id);
					}
					this.persist();
				},
				bossNear: (f) => {
					const lines = bossIntro(f.id, f.regionBoss, this.seenBossIntro);
					if (!lines) return false;
					useGameStore.getState().pushBeat({ kind: 'dialogue', lines: lines.map((text) => ({ speaker: f.name, portrait: 'boss', text })) });
					return true;
				},
				playerRespawn: () => ({ ...this.world.data.spawn }),
				netHit: (f, amount) => f.net && this.online?.send({ t: 'mobHit', id: f.net.id, dmg: Math.round(amount) }),
				netAggro: (f) => f.net && !f.net.owned && this.online?.send({ t: 'mobAggro', id: f.net.id }),
				netAct: (f, act) => f.net && this.online?.send({ t: 'mobAct', id: f.net.id, act }),
				netCc: (f, cc) => f.net && this.online?.send({ t: 'mobCc', id: f.net.id, cc }),
				others: () => this.otherPositions(),
				isUnlocked: (s) => this.story.isUnlocked(s),
				practiceHit: (element, reaction) => this.story.practiced(element, reaction),
				// Gửi ngay (không chờ nhịp 10Hz) để người khác thấy động tác khớp lúc đạn bay ra.
				onAction: (anim, dir, skill) => this.online?.send({ t: 'action', anim, dir, skill }),
				onActionEnd: () => this.online?.send({ t: 'actionEnd' }),
				levelUp: (level) => {
					// Gợi ý phím P vô nghĩa trên điện thoại (không có bàn phím) — ở đó bảng mở bằng cách chạm khung tên.
					const keyHint = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches ? '' : ' (P)';
					useGameStore.getState().toast(`Lên cấp ${level}! Có thêm ${level % 5 === 0 ? '2 điểm tiềm năng (1 điểm thưởng mốc)' : '1 điểm tiềm năng'}${keyHint}`, 'level');
					this.persist();
				},
			},
			this.story.state.player,
			this.vfx,
		);

		this.shownAge = this.story.state.age;
		this.scene.addChild(world.ground.layer, world.decalLayer, this.combat.groundFx, this.entities, this.exitLayer, this.combat.fxLayer);
		// Hình đứng lâu trên mặt đất (khối đá Tường Đá, lửa Tường Lửa — lớp 'world') xếp chiều sâu chung với nhân vật.
		this.vfx.world = this.entities;
		this.app.stage.addChild(this.scene, this.labelLayer, this.combat.screenLayer, this.flashLayer, this.fadeLayer);
		for (const d of world.data.dummies ?? []) this.combat.addDummy(d.x, d.y);

		const playerId = this.playerSpriteFor(this.story.state.age);
		const saved = online && online.progress.x >= 0 ? { x: online.progress.x, y: online.progress.y } : null;
		const start = saved && !world.blocked(saved.x, saved.y, 11, 5) ? saved : this.story.state.age < 16 ? (world.spot('home') ?? world.data.spawn) : world.data.spawn;
		this.player = await this.spawn(playerId, start.x, start.y, 'S', null);
		if (this.destroyed) return;
		this.combat.setPlayer(this.player);
		this.publishPlayerSprite();
		this.combat.setPath(this.story.state.path ?? null);
		this.combat.restoreEnchant(this.story.state.enchant ?? null);
		this.syncTalents();
		this.syncGear();
		// Bản lưu không cất máu: vào game là đầy — SAU con đường + mốc tiềm năng + trang bị (Núi Thiêng nâng máu tối đa nhưng không hồi).
		this.combat.refill();
		this.syncPlayerChoices();
		this.buildExitMarkers();
		await this.spawnNpcs(this.story.state.age);
		if (this.destroyed) return;

		// Vùng quái theo tiến độ: tuổi thơ không có quái ở Khoảng trống; vùng "theo yêu cầu" do nhiệm vụ bật.
		await Promise.all(world.data.monsterZones.filter((z) => !z.onDemand && this.story.state.age >= (z.fromAge ?? 0)).map((z) => this.spawnZone(z.id)));
		if (this.destroyed) return;
		// Lưới tìm đường dựng luôn lúc còn màn chờ (~60ms trên máy tính vì kiểm từng cạnh) — để lúc bấm ô nhiệm vụ không khựng.
		this.nav ??= new NavGrid(world.width, world.height, (x, y, rx, ry) => world.blocked(x, y, rx, ry));

		const zoom = useGameStore.getState().zoom || defaultZoom(this.app.renderer.width, this.app.renderer.height);
		this.camera = new Camera(this.scene, zoom);
		this.camera.bounds = { w: world.width, h: world.height };
		this.camera.snapTo(start.x, start.y - Math.round(this.player.height / 2));
		world.ground.warm(start.x, start.y, 700);
		useGameStore.setState({ zoom });
		this.unsubscribe = useGameStore.subscribe((s, prev) => {
			if (s.zoom !== prev.zoom) this.camera.setZoom(s.zoom);
			if (s.playerId !== prev.playerId && s.playerId && s.playerId !== this.player.id) void this.swapPlayer(s.playerId);
			if (s.autoWalkRequest.seq !== prev.autoWalkRequest.seq) this.onAutoWalkRequest(s.autoWalkRequest.mode);
			if (s.gameRequest.seq !== prev.gameRequest.seq) this.onGameRequest(s.gameRequest);
		});
		this.story.restore();
		// Bản lưu đã 16 tuổi mà chưa chọn con đường (chơi từ trước khi có lựa chọn) → hỏi ngay.
		if (this.story.state.age >= 16 && !this.story.state.path) this.askPath();

		const canvas = this.app.canvas;
		canvas.addEventListener('pointermove', (e) => Object.assign(this.mouse, { x: e.offsetX, y: e.offsetY, inside: e.pointerType === 'mouse' }));
		canvas.addEventListener('pointerleave', () => {
			this.mouse.inside = false;
		});
		canvas.addEventListener('pointerdown', (e) => {
			if (e.button !== 0 && e.button !== 2) return;
			const dpr = window.devicePixelRatio || 1;
			// Nhấp / chạm trúng người chơi khác: mở menu (nhắn riêng, kết bạn, chặn) thay vì ra đòn — chưa có PvP nên đánh
			// vào người chơi vốn không làm gì.
			const other = this.remoteAt((e.offsetX * dpr - this.scene.x) / this.camera.zoom, (e.offsetY * dpr - this.scene.y) / this.camera.zoom);
			if (other && this.canAct()) {
				useSession.getState().setPersonMenu({ person: { id: other.view.id, name: other.view.name }, at: { x: e.clientX, y: e.clientY } });
				return;
			}
			if (!this.canAct() || !controlsForAge(this.shownAge).cast) return;
			// Chạm màn hình: đánh về đúng chỗ chạm; chuột: theo con trỏ. Chuột phải luôn là Tia Aether (K).
			const aim = e.pointerType !== 'mouse' ? { x: (e.offsetX * dpr - this.scene.x) / this.camera.zoom, y: (e.offsetY * dpr - this.scene.y) / this.camera.zoom } : this.aimPoint();
			this.combat.cast(e.button === 2 ? 1 : this.basicAttackFor(aim), aim);
		});
		canvas.addEventListener('contextmenu', (e) => e.preventDefault());

		this.resizeObserver = new ResizeObserver(() => fitCanvas(this.app, host));
		this.resizeObserver.observe(host);
		this.app.ticker.add((t) => this.update(t));
		if (!this.destroyed) Game.live.add(this);
		if (process.env.NODE_ENV !== 'production') installDevHook();
		this.goOnline();
		useGameStore.setState({ status: 'ready', scene: StoryDirector.introSeen() ? 'play' : 'intro' });
		if (this.story.refunded > 0) {
			// Bản lưu hệ cũ vừa được hoàn điểm (StoryDirector.migrate): báo MỘT lần rồi lưu — bản lưu mới mang `talentsV`.
			const n = this.story.refunded;
			this.story.refunded = 0;
			this.persist();
			setTimeout(() => useGameStore.getState().toast(`Hệ tiềm năng mới — ${n} điểm đã được hoàn lại, hãy cộng vào nguyên tố (P)`, 'level'), 1200);
		}
		if (this.story.styleMigrated) {
			// Bản lưu GĐ1 có Kiếm mốc 3–4 (trước khi có lưu phái) vừa được gán Kiếm Thần: báo MỘT lần rồi lưu.
			this.story.styleMigrated = false;
			this.persist();
			setTimeout(
				() => useGameStore.getState().toast(`Kiếm của bạn đã vào lưu phái ${SWORD_STYLE_INFO.kiem_than.name} (Mắt Tinh = chí mạng +8% như Kiếm Tâm cũ). Muốn chọn lưu phái khác: tẩy điểm ở bảng Tiềm năng (P)`, 'level'),
				1500,
			);
		}
		this.announceGranted();
		// Quà bù lúc nạp mà túi đầy + ô đã có đồ: StoryDirector chưa có người chơi để thả — giờ đã có, thả cạnh chân.
		for (const o of this.story.takeOverflow()) this.dropItem(o.id, o.n);
	}

	/**
	 * Bản lưu đã qua nhiệm vụ mới chèn phía trước (vd “Sợi tơ màu đất” mở Thổ) vừa được bù mã lúc nạp: đặt kỹ năng mốc 1
	 * lên thanh (lần đồng bộ đầu không coi là "vừa học") và báo một lần.
	 */
	private announceGranted(): void {
		const ids = this.story.granted;
		if (!ids.length) return;
		this.story.granted = [];
		for (const id of ids) {
			const skill = HERO_SKILLS.find((s) => s.unlock === id);
			const quest = STORY.quests.find((q) => q.reward.unlockSkill === id || q.onGive?.unlock === id);
			if (!skill || !quest || !this.knownSkills().includes(skill.id)) continue;
			this.story.setLoadout(placeSkill(this.loadout(), skill.id));
			setTimeout(() => useGameStore.getState().toast(`Bù phần thưởng “${quest.title}”: học ${skill.name} (${this.keyLabel(skill.id)})`, 'level'), 1800);
		}
		this.persist();
	}

	/**
	 * Sprite người chơi theo tuổi + giới tính: bản nữ đặt hậu tố `_f` (vd `player_lior_child_f`).
	 * Nhân vật chưa qua cổng chất lượng (không có trong manifest) thì bỏ qua.
	 */
	private playerSpriteFor(age: number): string {
		const female = persona().gender === 'female';
		const pick = (s: string) => (female && this.manifest.characters[`${s}_f`] ? `${s}_f` : s);
		const candidates = [...STORY.playerByAge]
			.sort((a, b) => b.minAge - a.minAge)
			.filter((p) => age >= p.minAge && this.manifest.characters[p.sprite])
			.map((p) => ({ ...p, sprite: pick(p.sprite) }));
		const chosen = useGameStore.getState().playerId;
		if (age >= 16 && chosen && this.manifest.characters[chosen] && !chosen.includes('child')) return chosen;
		const fallback = Object.entries(this.manifest.characters).find(([, c]) => c.role === 'player')?.[0];
		const id = candidates[0]?.sprite ?? fallback;
		if (!id) throw new Error('Manifest chưa có nhân vật người chơi nào qua cổng chất lượng');
		// Món áo đang mặc có bộ trang phục cho sprite này (và bộ đã có trong manifest) → dùng bộ; không thì sprite gốc.
		return outfitSprite(id, this.story.gear.equip.body?.id, (s) => !!this.manifest.characters[s]);
	}

	/**
	 * Chân dung người chơi = ảnh mặt pipeline cắt từ CHÍNH sprite đang dùng (đúng tuổi, đúng giới tính).
	 * Sprite cũ chưa có ảnh mặt thì dùng tranh vẽ tay cũ.
	 */
	private playerPortrait(): string {
		const own = this.manifest.characters[this.player.id]?.portrait;
		if (own) return `/assets/${own}`;
		const female = persona().gender === 'female';
		if (this.shownAge < 16) return female ? '/assets/portraits/hero-child-female.png' : '/assets/portraits/lior-child.png';
		return female ? '/assets/portraits/hero-female.png' : '/assets/portraits/lior.png';
	}

	/**
	 * Chạm/nhấp chuột trái: mục tiêu gần thì chém kiếm (J), xa thì Tia Aether (K). Chưa có đủ hai món
	 * (mới nhận một trong hai quà) thì dùng món đang có.
	 */
	private basicAttackFor(aim: { x: number; y: number }): number {
		const sword = this.story.isUnlocked('sword');
		const staff = this.story.isUnlocked('staff');
		if (!sword || !staff) return staff ? 1 : 0;
		const far = Math.hypot(aim.x - this.player.x, aim.y - (this.player.y - this.player.chest)) > 110;
		return far ? 1 : 0;
	}

	/** Thông báo vừa nhận quà (kiếm/trượng) hoặc học thêm kỹ năng, kèm phím dùng. */
	private announceUnlock(id: string): void {
		// Nhánh vừa mở là mốc 1 ngay: kỹ năng mốc 1 lên thanh (ô nhà), bảng tiềm năng cộng được luôn.
		this.syncTalents();
		const st = useGameStore.getState();
		const skill = this.combat.skills.find((s) => s.unlock === id);
		const gift = GIFT_ITEMS[id];
		if (gift) st.toast(`Nhận ${gift.name}${skill ? ` — ${skill.name} (${this.keyLabel(skill.id)})` : ''}`, 'loot');
		else if (skill) st.toast(`Học được kỹ năng mới: ${skill.name} (${this.keyLabel(skill.id)})`, 'level');
	}

	/** "phím 1" nếu kỹ năng đang ở trên thanh, không thì chỉ chỗ gán. */
	private keyLabel(skillId: string): string {
		const slot = (this.story.state.loadout ?? []).indexOf(skillId);
		return slot >= 0 ? `phím ${SLOT_KEYS[slot]}` : 'gán vào ô ở bảng Tiềm năng';
	}

	/** Ngã rẽ năm 16 tuổi: theo kiếm của cha hay phép của mẹ — mạnh bên này thì yếu bên kia. */
	private askPath(): void {
		const pick = (path: HeroPath): void => {
			this.story.choosePath(path);
			this.combat.setPath(path);
			this.syncTalents();
			useGameStore.getState().toast(`Con đường: ${PATHS[path].name}`, 'level');
			this.persist();
		};
		useGameStore.getState().pushBeat({
			kind: 'card',
			title: 'Ngã rẽ · Mười sáu tuổi',
			lines: [
				'Sáng hôm ấy, cha đặt thanh kiếm gỗ năm nào lên bàn. Mẹ đặt cây trượng tập bên cạnh.',
				'“Mười năm nay con học cả hai,” mẹ nói. “Nhưng một người chỉ có hai bàn tay, và một ngày chỉ có một buổi sáng.”',
				'Cha chỉ nói: “…Chọn đi. Chọn gì cha mẹ cũng mừng.”',
			],
			choices: [
				{ id: 'sword', label: 'Theo kiếm của cha · Kiếm sĩ', detail: `Kiếm +${Math.round((PATHS.sword.sword - 1) * 100)}% sát thương, máu và giáp dày · phép −${Math.round((1 - PATHS.sword.magic) * 100)}%, ít MP` },
				{ id: 'mage', label: 'Theo phép của mẹ · Pháp sư', detail: `Phép +${Math.round((PATHS.mage.magic - 1) * 100)}% sát thương, nhiều MP · kiếm −${Math.round((1 - PATHS.mage.sword) * 100)}%, máu mỏng` },
			],
			onChoose: (id) => pick(id as HeroPath),
		});
	}

	/** Danh sách đổi nhân vật trên bảng Dev: tuổi thơ chỉ có Lior bé; lớn lên chọn được build. */
	private syncPlayerChoices(): void {
		const adult = this.story.state.age >= 16;
		const players = Object.entries(this.manifest.characters)
			.filter(([id, c]) => c.role === 'player' && (adult ? !id.includes('child') : id.includes('child')))
			.map(([id, c]) => ({ id, name: c.displayName }));
		useGameStore.setState({ playerId: this.player.id, players });
	}

	/**
	 * Dựng thế giới cho mốc tuổi mới. Mỗi bước độc lập: một atlas tải hỏng (mạng chập chờn) không được
	 * chặn các bước sau, nhất là NPC — thiếu NPC là kẹt cốt truyện.
	 */
	private async onAgeChanged(age: number): Promise<void> {
		if (this.destroyed) return;
		this.cancelAutoWalk('age');
		this.shownAge = age;
		// Lớn lên thì các phép đã học hồi nhỏ chắc chắn có (phòng bản lưu cũ). Suối Lành (Hồi Phục cũ) học bằng mốc Thuỷ 3.
		// Qua `grantUnlock`: bản lưu thiếu kiếm gỗ / trượng tập thì có luôn món đồ (ô trống thì tự mặc).
		if (age >= 16) for (const s of ['sword', 'staff', 'fire', 'water', 'wind', 'ice']) this.story.grantUnlock(s);
		this.syncTalents();
		this.syncGear();
		if (age >= 16 && !this.story.state.path) this.askPath();
		const report = (what: string) => (e: unknown) => {
			console.error(`[age ${age}] ${what}`, e);
			useGameStore.getState().toast(`Không tải được ${what} — thử tải lại trang`, 'warn');
		};
		try {
			const id = this.playerSpriteFor(age);
			if (id !== this.player.id) await this.swapPlayer(id).catch(report('nhân vật'));
			if (this.destroyed) return;
			// Mỗi mốc tuổi bắt đầu ở nhà (cảnh vạch khắc trên khung cửa), không phải chỗ vừa làm nhiệm vụ cũ — đang ở
			// map khác (rừng) thì đưa về thị trấn trước.
			if (!this.world.spot('home')) {
				const town = this.worldIndex.mapOfSpot('home');
				if (town) await this.changeMap(town, 'home');
				if (this.destroyed) return;
			}
			const home = this.world.spot('home');
			this.combat.interrupt();
			if (home) Object.assign(this.player, { x: home.x, y: home.y });
			await this.spawnNpcs(age).catch(report('NPC'));
			if (this.destroyed) return;
			for (const z of this.world.data.monsterZones) if (!z.onDemand && age >= (z.fromAge ?? 0)) void this.spawnZone(z.id).catch(report('quái'));
			this.syncPlayerChoices();
		} finally {
			if (!this.destroyed) this.persist();
		}
	}

	private async spawn(id: string, x: number, y: number, facing: Direction, wander: WanderArea | null, speed?: number): Promise<Actor> {
		const textures = await loadCharacter(id);
		const actor = new Actor(id, textures, x, y, facing, wander, speed);
		this.actors.push(actor);
		this.entities.addChild(actor.root);
		const role = textures.entry.role;
		const label = this.makeLabel(role === 'player' ? persona().name : actor.displayName, LABEL_COLOR[role]);
		this.labels.set(actor, label);
		return actor;
	}

	private makeLabel(text: string, color: number): Text {
		const label = new Text({
			text,
			style: { fill: color, fontSize: Math.round(11 * (window.devicePixelRatio || 1)), fontFamily: 'Be Vietnam Pro, system-ui, sans-serif', fontWeight: '600', stroke: { color: 0x0b0d12, width: 3 } },
		});
		label.anchor.set(0.5, 1);
		this.labelLayer.addChild(label);
		return label;
	}

	private removeActor(a: Actor): void {
		// destroy (không chỉ gỡ khỏi cây) để giải phóng sprite; khung hình chạy theo Actor.update nên không còn treo trên Ticker. Không huỷ texture: atlas dùng chung.
		a.root.destroy({ children: true });
		this.labels.get(a)?.destroy();
		this.labels.delete(a);
		const i = this.actors.indexOf(a);
		if (i >= 0) this.actors.splice(i, 1);
	}

	/** Đổi nhiều lần liên tiếp (bảng Dev) thì chỉ lần CUỐI có hiệu lực; actor của các lần cũ bị huỷ. */
	private async swapPlayer(id: string): Promise<void> {
		const token = ++this.swapToken;
		const actor = await this.spawn(id, this.player.x, this.player.y, this.player.view.direction, null);
		if (this.destroyed || token !== this.swapToken) return this.removeActor(actor);
		// Đọc `old` SAU await: trong lúc chờ tải, người chơi có thể đã đi chỗ khác.
		const old = this.player;
		Object.assign(actor, { x: old.x, y: old.y });
		actor.view.set('idle', old.view.direction);
		actor.setGearStance(old.gearStance);
		actor.setGear(this.gearPieces);
		this.player = actor;
		this.combat.setPlayer(actor);
		this.removeActor(old);
		this.publishPlayerSprite();
	}

	/**
	 * Hình nhân vật giữa kho đồ: atlas của sprite ĐANG dùng (đúng tuổi, đúng giới tính) + các khung `idle_S` — bảng tự đo
	 * vùng có hình và phóng nguyên lần. Gọi sau mỗi lần dựng / đổi sprite người chơi.
	 */
	private publishPlayerSprite(): void {
		const id = this.player.id;
		const entry = this.manifest.characters[id];
		if (!entry) return;
		void loadCharacter(id)
			.then((tex) => {
				if (this.destroyed || this.player.id !== id) return;
				const list = tex.frames('idle', 'S');
				const frames = list.map((t) => ({ x: t.frame.x, y: t.frame.y, w: t.frame.width, h: t.frame.height }));
				// Lớp đồ gắn đặt theo neo của khung đứng đầu tiên — cùng luật với lớp đồ trong game.
				const info = list[0] ? tex.frameInfo(list[0]) : undefined;
				const gear = figureGear(this.gearPieces, info?.gear, info?.dir ?? 'S', 'idle', GEAR_ART, this.player.gearStance);
				useGameStore.setState({ playerSprite: { sheet: `/assets/${entry.atlas.replace(/\.json$/, '.png')}`, frames, gear } });
			})
			.catch(() => useGameStore.setState({ playerSprite: null }));
	}

	/** Dựng NPC theo tuổi hiện tại (mỗi mốc tuổi một dàn NPC khác: tuổi thơ có cha mẹ, lớn lên có người khác). */
	private async spawnNpcs(age: number): Promise<void> {
		for (const n of this.npcs) {
			if (n.actor) this.removeActor(n.actor);
			else n.label.destroy();
			n.marker?.destroy();
			n.prop?.destroy();
		}
		this.npcs = [];
		for (const [key, def] of Object.entries(STORY.npcs)) {
			if (age < def.ages[0] || age > def.ages[1]) continue;
			// Chỗ đứng nằm ở map khác (vd Aldric 8 tuổi ở bìa rừng) thì NPC đó không có mặt ở map này.
			const spot = this.world.spot(def.at.spot);
			if (!spot) continue;
			const x = spot.x + (def.at.dx ?? 0);
			const y = spot.y + (def.at.dy ?? 0);
			if (def.sprite && this.manifest.characters[def.sprite]) {
				const actor = await this.spawn(def.sprite, x, y, 'S', null);
				if (this.destroyed) return;
				const label = this.labels.get(actor)!;
				label.text = def.name;
				this.npcs.push({ key, actor, marker: null, prop: null, markerLift: 30, label, x, y });
			} else {
				// Vật thể làm hình (bia đá cổ…): đồ vật có sẵn trong atlas đồ vật của vùng, quả cầu sáng nổi trên đỉnh.
				const tex = def.prop ? this.world.propTexture(def.prop) : undefined;
				let prop: Sprite | null = null;
				if (tex) {
					prop = new Sprite(tex);
					prop.anchor.set(0.5, 1);
					prop.position.set(x, y);
					prop.zIndex = y;
					this.entities.addChild(prop);
				}
				const markerLift = prop ? Math.round(prop.height) + 12 : 30;
				const frames = this.vfx.frames('arcane_orb');
				const marker = new Sprite(frames[0] as Texture);
				marker.anchor.set(0.5);
				marker.blendMode = 'add';
				marker.position.set(x, y - markerLift);
				marker.zIndex = y + 1;
				this.entities.addChild(marker);
				this.npcs.push({ key, actor: null, marker, prop, markerLift, label: this.makeLabel(def.name, LABEL_COLOR.npc), x, y });
			}
		}
	}

	private readonly spawnedZones = new Set<string>();

	private async spawnZone(zoneId: string): Promise<void> {
		const z = this.world.data.monsterZones.find((m) => m.id === zoneId);
		if (!z || this.spawnedZones.has(zoneId)) return;
		this.spawnedZones.add(zoneId);
		// Chơi trực tuyến: khu thế giới người lớn là quái DÙNG CHUNG — máy chủ gửi danh sách (`mobs`), không tự dựng.
		if (this.online && isSharedZone(z)) {
			if (!this.mobsWanted) {
				this.mobsWanted = true;
				this.online.send({ t: 'mobSub', on: true });
			}
			return;
		}
		const token = this.mapToken;
		const pool = z.monsters.filter((id) => this.manifest.characters[id]);
		const home: WanderArea = { x: z.x, y: z.y, radius: z.radius };
		const jobs: Promise<unknown>[] = [];
		for (let i = 0; i < z.count && pool.length; i += 1) {
			const a = (i / z.count) * Math.PI * 2;
			const r = z.radius * (0.3 + (0.6 * ((i * 37) % 10)) / 10);
			const id = pool[i % pool.length]!;
			jobs.push(
				this.spawn(id, z.x + Math.cos(a) * r, z.y + Math.sin(a) * r, 'S', home, 40).then((actor) => {
					// Tải xong khi map đã đổi (hoặc game đã huỷ): actor thuộc map cũ — bỏ, không thành quái/boss của map mới.
					if (this.destroyed || token !== this.mapToken) return void this.removeActor(actor);
					// Vùng `boss: true`: boss VÙNG (thanh máu HUD, hồi sinh) — không gán `this.boss` để khỏi chặn boss cốt truyện.
					// Bị hạ trước lần rời map mà chưa tới giờ thức thì dựng ở trạng thái đã gục, đếm nốt thời gian còn lại.
					const dormant = z.boss ? regionBossDormancy(this.regionBossWakeAt.get(this.regionBossKey(zoneId)), this.combat.time) : 0;
					const f = this.combat.addEnemy(actor, id, home, actor.displayName, { regionBoss: !!z.boss, dormant });
					if (f && z.boss) this.regionBosses.set(f, { zone: zoneId, name: z.name });
					return f;
				}),
			);
		}
		const results = await Promise.allSettled(jobs);
		const failed = results.filter((r) => r.status === 'rejected');
		if (!failed.length) return;
		// Hỏng hết thì cho phép dựng lại vùng này lần sau; hỏng một phần thì giữ số quái đã có.
		// (Map đã đổi thì `spawnedZones` là của map mới — không đụng.)
		if (failed.length === results.length && token === this.mapToken) this.spawnedZones.delete(zoneId);
		throw (failed[0] as PromiseRejectedResult).reason;
	}

	private spawnPickups(item: string, spotIds: string[], remaining: number): void {
		if (remaining <= 0 || this.pickups.some((p) => p.item === item)) return;
		const tex = this.world.propTexture(PICKUP_PROP[item] ?? 'flower_blue');
		if (!tex) return;
		let left = remaining;
		for (const id of spotIds) {
			const s = this.world.spot(id);
			if (!s || this.world.blocked(s.x, s.y, 10, 6)) continue;
			if (left <= 0) break;
			left -= 1;
			const sprite = new Sprite(tex);
			sprite.anchor.set(0.5, 1);
			sprite.position.set(s.x, s.y);
			sprite.zIndex = s.y;
			this.entities.addChild(sprite);
			this.pickups.push({ item, sprite, x: s.x, y: s.y, t: Math.random() * 6 });
		}
	}

	private clearPickups(item: string): void {
		for (let i = this.pickups.length - 1; i >= 0; i -= 1) {
			const pk = this.pickups[i]!;
			if (pk.item !== item) continue;
			pk.sprite.destroy();
			this.pickups.splice(i, 1);
		}
	}

	private async awakenBoss(): Promise<void> {
		const b = this.world.data.boss;
		if (!b || this.boss || !this.manifest.characters[b.characterId]) return;
		const home = { x: b.x, y: b.y, radius: b.radius };
		const actor = await this.spawn(b.characterId, b.x, b.y, 'S', home, 26);
		if (this.destroyed || this.boss) return this.removeActor(actor);
		this.boss = this.combat.addEnemy(actor, b.characterId, home, actor.displayName);
		useGameStore.getState().toast('Đá phong ấn rung chuyển — ánh đỏ bùng lên…', 'warn');
	}

	/** Thoại dữ liệu → dòng hiển thị: tên, chân dung, kiểu chữ (độc thoại nghiêng, dẫn truyện). */
	private toDialogue(lines: Line[]): DialogueLine[] {
		return lines.map((l) => {
			const name = persona().name;
			const text = personalize(l.text);
			if (l.speaker === 'inner') return { speaker: `${name} (nghĩ thầm)`, portrait: 'lior', text, style: 'inner' as const };
			if (l.speaker === 'lior') return { speaker: name, portrait: 'lior', text, style: 'speech' as const };
			if (l.speaker === 'narrator') return { speaker: '', portrait: null, text, style: 'narrator' as const };
			const npc = STORY.npcs[l.speaker];
			return { speaker: npc ? `${npc.name} · ${npc.title}` : l.speaker, portrait: npc?.sprite && this.manifest.characters[npc.sprite] ? npc.sprite : null, text, style: 'speech' as const };
		});
	}

	private canAct(): boolean {
		const s = useGameStore.getState();
		// Bảng nhân vật/tiềm năng/kho đồ mở: nhân vật đứng yên như lúc đọc thoại (phím đang dành cho bảng).
		return s.scene === 'play' && !s.dialogue && !s.card && !s.panel && !this.changing;
	}

	private aimPoint(): { x: number; y: number } {
		const p = this.player;
		if (!this.mouse.inside) {
			// Không có chuột (bàn phím thuần hoặc màn cảm ứng): tự ngắm mục tiêu gần nhất trong tầm, không có thì bắn thẳng hướng mặt.
			const t = this.combat.nearestTarget(p.x, p.y, 420);
			if (t) return { x: t.x, y: t.y - 46 };
			const v = FACING[p.view.direction]!;
			return { x: p.x + v[0] * 100, y: p.y - p.chest + v[1] * 100 };
		}
		const dpr = window.devicePixelRatio || 1;
		return { x: (this.mouse.x * dpr - this.scene.x) / this.camera.zoom, y: (this.mouse.y * dpr - this.scene.y) / this.camera.zoom };
	}

	/**
	 * Điểm nhắm cho kỹ năng `index`: đòn nhắm ĐIỂM trên đất (vùng nhắm, cột trồi, vùng tồn tại) mà không có chuột (cảm
	 * ứng / chỉ bàn phím) thì đặt trước mặt theo hướng đang nhìn ở tầm mặc định của kỹ năng; còn lại như phép bắn.
	 */
	private aimFor(index: number): { x: number; y: number } {
		const s = this.combat.skills[index];
		if (!s || !isGroundTarget(s) || this.mouse.inside) return this.aimPoint();
		const p = this.player;
		const v = FACING[p.view.direction]!;
		return aheadPoint(p.x, p.y, v[0], v[1], s.aimDist ?? 150);
	}

	private nearestInteractable(): Interactable | null {
		const p = this.player;
		let best: Interactable | null = null;
		let bestD = 76;
		for (const n of this.npcs) {
			const d = Math.hypot(n.x - p.x, n.y - p.y);
			if (d < bestD) {
				bestD = d;
				best = { kind: 'npc', npc: n };
			}
		}
		for (const pk of this.pickups) {
			const d = Math.hypot(pk.x - p.x, pk.y - p.y);
			if (d < bestD) {
				bestD = d;
				best = { kind: 'pickup', pickup: pk };
			}
		}
		return best;
	}

	private interact(): void {
		const target = this.nearestInteractable();
		if (!target) return;
		if (target.kind === 'npc') {
			const n = target.npc;
			n.actor?.view.set('idle', directionOf(this.player.x - n.x, this.player.y - n.y));
			// Bia Danh Vọng: mở bảng thành tựu (máy chủ giữ tiến độ + kim cương). Chơi một mình thì chỉ đọc chữ trên bia.
			if (n.key === CHRONICLER.npc && this.online) return void useGameStore.getState().setPanel('glory');
			// Bram: quầy Cửa hàng kim cương (Bram không giao nhiệm vụ nào — có thì nhiệm vụ phải được ưu tiên trước quầy).
			if (MERCHANT_NPCS.includes(n.key) && this.online) return void useGameStore.getState().setPanel('shop');
			this.story.talk(n.key);
			return;
		}
		const pk = target.pickup;
		if (pk.loot) {
			// Đồ của mình để dưới đất lúc túi đầy: nhặt được bao nhiêu thì vào túi bấy nhiêu, phần còn lại nằm yên.
			const { id, n } = pk.loot;
			const left = this.grantItem(id, n, { drop: false });
			if (left >= n) return void useGameStore.getState().toast('Túi đầy', 'warn');
			pk.loot.n = left;
			useGameStore.getState().toast(`+${n - left} ${itemDef(id).name}`, 'loot');
			if (left > 0) return;
		}
		pk.sprite.destroy();
		this.pickups.splice(this.pickups.indexOf(pk), 1);
		this.vfx.play('sparkle', pk.x, pk.y - 20, { blend: 'add', fps: 22, tint: 0xbfe8ff });
		if (pk.loot) return;
		this.story.pickup(pk.item);
		useGameStore.getState().toast(`+1 ${ITEM_NAME[pk.item] ?? pk.item}`, 'loot');
	}

	private update(ticker: Ticker): void {
		const realDt = Math.min(ticker.deltaMS / 1000, 0.1);
		// Thoại/thẻ đang mở: chiến đấu đứng yên (quái không đánh người chơi đang bị khoá phím).
		const busy = !this.canAct();
		// Hit-stop: thế giới gần như đứng hình vài chục ms khi đòn trúng mạnh — cảm giác "nặng tay".
		const dt = !busy && this.combat.hitStop > 0 ? realDt * 0.08 : realDt;
		if (!busy) this.combat.hitStop = Math.max(0, this.combat.hitStop - realDt);
		const p = this.player;
		const presses = this.keyboard.drainPresses();
		// Phím vừa dùng để đóng thoại/thẻ (E, Space) không được lọt sang game ở frame kế: E sẽ mở lại
		// đúng đoạn thoại đó (lặp mãi), Space thành cú lăn né.
		if (busy || this.uiBusyPrev) presses.length = 0;
		// Thoại/thẻ vừa mở giữa lúc vung: huỷ đòn (hoàn MP/hồi chiêu nếu chưa tới khung chạm), không để nó nổ sau thoại.
		if (busy && !this.uiBusyPrev) this.combat.interrupt();
		this.uiBusyPrev = busy;
		const pc = this.combat.pc;
		const acting = !busy && !pc.dead;

		let intent = acting ? this.keyboard.intent() : NO_INTENT;
		// Tự đi tới chỗ làm nhiệm vụ: bơm hướng đi như phím/cần gạt TRƯỚC vòng phím bấm (Space né theo đúng hướng
		// đang đi), nên tốc độ, trượt trục, hoạt ảnh và gói vị trí gửi máy chủ y như người chơi tự đi.
		const stickTouched = virtualInput.stickActive || virtualInput.stickDowns !== this.stickDowns;
		let stepCap = Infinity;
		this.stickDowns = virtualInput.stickDowns;
		if (this.autoWalk) {
			if (busy || pc.dead) this.cancelAutoWalk(busy ? 'busy' : 'dead');
			else if (intent.x || intent.y || stickTouched) this.cancelAutoWalk('manual');
			else if (this.threatened()) this.cancelAutoWalk('enemy');
			else if (this.combat.rooted) {
				/* đang giữ thế / dồn lực: tạm đứng, không tính là kẹt đường */
			} else {
				const step = this.autoWalk.step(p, realDt);
				if (step.kind === 'move') {
					intent = { x: step.x, y: step.y, run: step.run };
					stepCap = step.maxDist;
				}
				else this.cancelAutoWalk(step.kind === 'done' ? 'arrived' : 'fail');
			}
		}
		const can = controlsForAge(this.shownAge);
		const held = this.combat.heldSkills;
		held.clear();
		if (acting && can.cast) {
			for (const code of HOLD_REPEAT) {
				const i = this.slotSkill(SKILL_KEYS[code]!);
				if (i >= 0 && this.keyboard.pressed(code)) held.add(i);
			}
		}
		if (acting) {
			for (const k of presses) {
				if (k in SKILL_KEYS) {
					if (!can.cast) continue;
					const i = this.slotSkill(SKILL_KEYS[k]!);
					if (i >= 0) this.combat.cast(i, this.aimFor(i));
					else useGameStore.getState().toast(`Ô ${SLOT_KEYS[SKILL_KEYS[k]!]} chưa gán kỹ năng — gán ở bảng Tiềm năng (P)`, 'info');
				} else if (k === 'Space') {
					if (can.dodge) this.combat.dodge(intent);
				} else if (k === 'KeyE') this.interact();
				else if (k === 'KeyR' && can.potion) this.combat.usePotion();
			}
			// Giữ phím: `cast` tự từ chối khi đang hồi chiêu/đang vung nên nhịp đánh đúng bằng hồi chiêu.
			if (can.cast) {
				for (const code of HOLD_REPEAT) {
					if (!this.keyboard.pressed(code) || presses.includes(code)) continue;
					const i = this.slotSkill(SKILL_KEYS[code]!);
					const skill = this.combat.skills[i];
					// Chưa học thì bỏ qua im lặng (không spam lời nhắc mỗi frame lúc giữ phím). `repeat`: không đè lệnh
					// bấm chủ động đang chờ trong hàng (bấm 1 giữa lúc giữ J thì Hoả Cầu vẫn ra).
					if (skill && this.combat.knows(skill)) this.combat.cast(i, this.aimFor(i), { repeat: true });
				}
			}
		}

		// Đi trong lúc ra đòn: chỉ cắt được từ mốc huỷ (khung chạm đã hiện trọn 1 frame — `endRecovery` tự kiểm);
		// trước mốc đó bước chậm lại. Bước chân của người chơi KHÔNG ăn hit-stop (realDt): hit-stop làm khựng
		// động tác, quái, đạn, hiệu ứng — còn đang đi mà mỗi nhát trúng lại đứng sững 35–70ms là thêm một cú giật.
		// Đang giữ thế / dồn lực (Kiếm lưu phái): đứng im — né (Space) mới thoát được.
		const moving = !pc.dash && !this.combat.rooted && (intent.x !== 0 || intent.y !== 0);
		if (moving) this.combat.endRecovery();
		const moveDt = moving ? realDt : dt;
		if (moving) {
			const len = Math.hypot(intent.x, intent.y);
			const running = intent.run && pc.stamina > 1;
			// Thuận Gió (Phong mốc 4) nhân tốc đi/chạy; nhịp bước theo cùng tỉ lệ nên chân không trượt.
			const speed = (running ? RUN_SPEED : WALK_SPEED_REFERENCE) * (this.combat.action ? ACTION_MOVE_SCALE : 1) * this.combat.moveScale;
			if (running) pc.stamina = Math.max(0, pc.stamina - 22 * moveDt);
			const dist = Math.min(speed * moveDt, stepCap);
			this.world.move(p, (intent.x / len) * dist, (intent.y / len) * dist);
			// Đang vung thì CharacterView chỉ ghi nhớ trạng thái nền này, hết động tác mới hiện.
			p.view.set(running ? 'run' : 'walk', directionOf(intent.x, intent.y), speed / WALK_SPEED_REFERENCE);
			// Bước vào dải lối sang map và đang đi VỀ PHÍA mép đó (đứng yên hay quay lại trong dải thì không chuyển).
			const exit = this.world.exitAt(p.x, p.y);
			if (exit && crossesExit(exit, p.x, p.y, intent.x, intent.y)) void this.changeMap(exit.to, exit.toSpot);
		} else if (!pc.dash) p.view.set('idle', p.view.direction);

		// Quái / NPC đi lang thang qua tường tạm (Tường Đá, Tường Lửa) trước rồi mới tới tường bản đồ — không đi xuyên.
		for (const a of this.actors) a.update(a === p ? moveDt : dt, a === p ? undefined : this.combat.wanderMover);
		const W = this.app.renderer.width;
		const H = this.app.renderer.height;
		this.camera.update(realDt, p.x, p.y - Math.round(p.height / 2), W, H);
		const z = this.camera.zoom;
		const toScreen = (x: number, y: number): { x: number; y: number } => ({ x: this.scene.x + x * z, y: this.scene.y + y * z });
		this.combat.update(dt, toScreen, z, busy);
		// CombatSystem tua động tác của người chơi SAU vòng Actor.update → đặt lại lớp đồ theo khung vừa tua (không trễ 1 khung).
		p.syncGear();
		const flash = this.combat.screenFlash;
		this.flashLayer.clear();
		if (flash.alpha > 0.01) this.flashLayer.rect(0, 0, W, H).fill({ color: flash.color, alpha: flash.alpha });
		const f = this.fade;
		f.alpha += Math.sign(f.target - f.alpha) * Math.min(Math.abs(f.target - f.alpha), realDt * 5);
		this.fadeLayer.clear();
		if (f.alpha > 0.01) this.fadeLayer.rect(0, 0, W, H).fill({ color: 0x05060a, alpha: f.alpha });
		this.updateExitMarkers(toScreen);
		this.world.ground.update(this.camera.view(W, H));
		this.world.updateOcclusion({ x: p.x, y: p.y, h: p.height + 4 });

		const reach = this.story.reachTarget();
		if (reach) {
			const s = this.world.spot(reach);
			if (s && Math.hypot(s.x - p.x, s.y - p.y) < s.r) this.story.reached(reach);
		}

		const orb = this.vfx.frames('arcane_orb');
		for (const n of this.npcs) {
			if (n.marker && orb.length) {
				n.marker.texture = orb[Math.floor(this.combat.time * 8) % orb.length]!;
				n.marker.y = Math.round(n.y - n.markerLift - Math.sin(this.combat.time * 3) * 3);
			}
		}
		for (const pk of this.pickups) {
			pk.t += dt;
			pk.sprite.y = Math.round(pk.y - Math.abs(Math.sin(pk.t * 2.4)) * 4);
		}
		for (const [a, label] of this.labels) {
			const s = toScreen(a.root.x, a.root.y - a.height - (a.wander ? 18 : 12));
			label.position.set(Math.round(s.x), Math.round(s.y));
			label.alpha = a.root.alpha;
		}
		for (const n of this.npcs) {
			if (n.actor) continue;
			const s = toScreen(n.x, n.y - n.markerLift - 26);
			n.label.position.set(Math.round(s.x), Math.round(s.y));
		}
		this.updateRemotes(realDt, dt, toScreen);
		this.mobPosT += realDt;
		if (this.mobPosT >= 0.1) {
			this.mobPosT = 0;
			this.sendMobPositions();
		}
		this.codexT += realDt;
		if (this.codexT >= 0.5) {
			this.codexT = 0;
			this.scanCodex();
		}
		this.sendMove(realDt);

		const area = this.world.areaAt(p.x, p.y);
		if (area !== this.area) {
			this.area = area;
			useGameStore.setState({ area, areaChangedAt: Date.now() });
		}
		this.hudTimer += realDt;
		if (this.hudTimer > 0.1) {
			this.hudTimer = 0;
			this.pushHud(ticker);
			this.pushAutoWalk();
			// Chấm trên bản đồ ~3 lần/giây là đủ — đỡ vẽ lại React.
			this.markerTick = (this.markerTick + 1) % 3;
			if (this.markerTick === 0) this.pushMarkers();
		}
		this.saveTimer += realDt;
		if (this.saveTimer > 5) {
			this.saveTimer = 0;
			this.persist();
		}
	}

	/** Nối thế giới trực tuyến: vẽ người chơi khác, nhận chat, bị đẩy ra khi nhân vật đăng nhập nơi khác. */
	private goOnline(): void {
		const o = this.online;
		if (!o) return;
		const chat = (line: Parameters<ReturnType<typeof useSession.getState>['pushChat']>[0]) => useSession.getState().pushChat(line);
		o.handlers = {
			status: (connected) => useSession.setState({ connected }),
			welcome: (players) => {
				for (const id of [...this.remotes.keys()]) this.removeRemote(id);
				for (const p of players) this.upsertRemote(p);
				// Máy chủ chỉ báo "vào map" cho người khác sau gói vị trí đầu tiên → gửi lại ngay.
				this.lastSent = '';
				// Đồ gắn gửi TRƯỚC gói vị trí đầu → đi kèm tin join. Nối lại sau rớt mạng thì máy chủ (có thể vừa khởi động lại) cũng có lại đồ.
				this.lastGearSent = '';
				this.sendGear();
				// Nối lại mạng: máy chủ đã bỏ đăng ký quái của kết nối cũ — xin lại (danh sách mới cập nhật quái đang có).
				if (this.mobsWanted) this.online?.send({ t: 'mobSub', on: true });
			},
			join: (p) => this.upsertRemote(p),
			leave: (id) => this.removeRemote(id),
			snapshot: (list) => {
				for (const p of list) {
					const r = this.remotes.get(p.id);
					if (!r) continue;
					Object.assign(r.view, p);
					r.tx = p.x;
					r.ty = p.y;
					r.label.text = `${r.view.name} · Lv${r.view.level}`;
					this.ensureRemoteSprite(r);
				}
			},
			// Người khác vung kiếm/niệm phép: chỉ phát động tác (hình), sát thương vẫn do máy người đó tính.
			action: (m) => {
				const r = this.remotes.get(m.id);
				const a = r?.actor;
				if (!r || !a) return;
				const dir = (FACING[m.dir] ? m.dir : a.view.direction) as Direction;
				r.view.dir = dir;
				// Cùng hồi chiêu với máy người gửi → cùng mốc (động tác dài hơn hồi chiêu bị co như nhau).
				const cooldown = HERO_SKILLS.find((s) => s.id === m.skill)?.cooldown ?? Infinity;
				const timing = a.view.actionTiming(m.anim, dir, cooldown);
				if (timing) a.view.playAction(m.anim, dir, { timing, external: false });
			},
			// Người kia né / đi / bị ngắt giữa động tác: dừng hình theo.
			actionEnd: (m) => this.remotes.get(m.id)?.actor?.view.cancelAction(),
			// Người kia đổi đồ gắn: chuẩn hoá lại ở máy mình (không tin dữ liệu mạng), vẽ lại lớp đồ.
			gear: (m) => {
				const r = this.remotes.get(m.id);
				if (!r) return;
				r.view.gear = cleanGearView(m.gear) ?? undefined;
				r.actor?.setGear(decodeGear(r.view.gear));
			},
			chat: (m) => chat({ name: m.name, text: m.text, self: m.from === o.character.id, fromId: m.from }),
			social: (state) => useSession.setState({ social: state }),
			mobs: (map, list) => {
				if (map !== `${this.worldIndex.region}/${this.mapId}`) return;
				for (const m of list) void this.upsertNetMob(m).catch((e) => console.error('[mobs]', e));
			},
			mobMove: (list) => {
				for (const [id, x, y, dir, anim] of list) {
					const f = this.netMobs.get(id);
					if (!f?.net || f.net.owned) continue;
					Object.assign(f.net, { tx: x, ty: y, dir: (FACING[dir] ? dir : f.net.dir) as Direction, anim: anim === 'walk' ? 'walk' : 'idle' });
				}
			},
			mobHp: (m) => {
				const f = this.netMobs.get(m.id);
				if (f) this.combat.netSync(f, m.hp, m.by === o.character.id ? undefined : m.dmg);
			},
			mobDie: (m) => {
				const f = this.netMobs.get(m.id);
				if (f) this.combat.netKill(f, m.credit.includes(o.character.id));
			},
			mobSpawn: (mob) => {
				const f = this.netMobs.get(mob.id);
				if (f?.net) {
					f.net.owned = mob.owner === o.character.id;
					this.combat.netRespawn(f, mob.x, mob.y);
				} else void this.upsertNetMob(mob).catch((e) => console.error('[mobs]', e));
			},
			mobOwner: (id, owner) => {
				const f = this.netMobs.get(id);
				if (!f?.net) return;
				f.net.owned = owner === o.character.id;
				Object.assign(f.net, { tx: f.actor.x, ty: f.actor.y });
			},
			// Quái người khác làm chủ vừa lấy đà / đánh / gọi vùng nổ: diễn lại, xét đòn trên người chơi máy này.
			mobAct: (id, act) => {
				const f = this.netMobs.get(id);
				if (f) this.combat.netAct(f, act);
			},
			mobCc: (id, cc) => {
				const f = this.netMobs.get(id);
				if (f) this.combat.netControl(f, cc);
			},
			whisper: (messages) => {
				for (const m of messages) {
					const out = m.from === o.character.id;
					chat(out ? { name: m.toName, text: m.text, self: true, whisper: 'out', fromId: m.to } : { name: m.fromName, text: m.text, self: false, whisper: 'in', fromId: m.from });
					if (!out) useSession.setState({ lastWhisper: { id: m.from, name: m.fromName } });
				}
			},
			system: (text) => chat({ name: '', text, self: false, system: true }),
			wallet: (diamonds) => useSession.setState({ diamonds }),
			daily: (daily) => useSession.setState({ daily }),
			goals: (goals) => useSession.setState({ goals }),
			gift: (m) => this.receiveGift(m.reason, m.title, m.gift),
			buffs: (list) => {
				useSession.setState({ buffs: { list, at: Date.now() } });
				this.applyBuffs();
			},
			bought: (item) => useGameStore.getState().toast(`Đã mua ${SHOP.find((x) => x.id === item)?.name ?? item}`, 'loot'),
			kicked: (reason) => {
				// Màn chọn nhân vật hiện lại lý do: toast trong game biến mất ngay khi game bị gỡ.
				void useSession.getState().leaveGame(reason);
			},
		};
		this.wired = true;
		o.connect();
	}

	private upsertRemote(p: PlayerView): void {
		const old = this.remotes.get(p.id);
		if (old) {
			Object.assign(old.view, p);
			old.tx = p.x;
			old.ty = p.y;
			this.ensureRemoteSprite(old);
			old.actor?.setGear(decodeGear(old.view.gear));
			return;
		}
		const r: Remote = { view: { ...p }, actor: null, label: this.makeLabel(`${p.name} · Lv${p.level}`, 0x9fd3ff), tx: p.x, ty: p.y, loading: '' };
		this.remotes.set(p.id, r);
		this.ensureRemoteSprite(r);
	}

	/** Đổi sprite khi người kia lớn lên (trẻ con → người lớn); sprite lạ không có trong manifest thì dùng bản mặc định. */
	private ensureRemoteSprite(r: Remote): void {
		const fallback = STORY.playerByAge[0]?.sprite ?? 'player_lior_child';
		// Bộ trang phục mà máy này chưa có atlas (bản game cũ hơn) → sprite gốc của bộ đó, rồi mới tới bản mặc định.
		const base = baseOfOutfit(r.view.sprite);
		const sprite = this.manifest.characters[r.view.sprite] ? r.view.sprite : base && this.manifest.characters[base] ? base : fallback;
		if (r.actor?.id === sprite || r.loading === sprite) return;
		r.loading = sprite;
		void loadCharacter(sprite).then((tex) => {
			if (this.destroyed || this.remotes.get(r.view.id) !== r || r.loading !== sprite) return;
			const a = new Actor(sprite, tex, r.actor?.x ?? r.tx, r.actor?.y ?? r.ty, (r.view.dir as Direction) || 'S', null);
			r.actor?.root.destroy({ children: true });
			r.actor = a;
			a.setGear(decodeGear(r.view.gear));
			this.entities.addChild(a.root);
		});
	}

	/**
	 * Một quái dùng chung từ máy chủ: đã có thì cập nhật (sau khi nối lại mạng), chưa có thì dựng actor + Fighter có `net`.
	 * Loại chưa có hình PixelLab (thiếu trong manifest) thì bỏ — y như khi tự dựng khu quái.
	 */
	private async upsertNetMob(m: MobView): Promise<void> {
		const me = this.online?.character.id;
		const old = this.netMobs.get(m.id);
		if (old?.net) {
			old.net.owned = m.owner === me;
			if (m.dead && !old.dead) this.combat.netKill(old, false);
			else if (!m.dead && old.dead) this.combat.netRespawn(old, m.x, m.y);
			else if (!m.dead) this.combat.netSync(old, m.hp);
			Object.assign(old.net, { tx: m.x, ty: m.y });
			return;
		}
		if (!this.manifest.characters[m.type]) return;
		const token = this.mapToken;
		const home: WanderArea = { x: m.home.x, y: m.home.y, radius: m.home.r };
		const actor = await this.spawn(m.type, m.x, m.y, 'S', home, 40);
		if (this.destroyed || token !== this.mapToken || this.netMobs.has(m.id)) return void this.removeActor(actor);
		const net = { id: m.id, owned: m.owner === me, tx: m.x, ty: m.y, dir: 'S' as Direction, anim: 'idle' as const };
		const f = this.combat.addEnemy(actor, m.type, home, actor.displayName, { regionBoss: m.boss, dormant: m.dead ? 1 : 0, net });
		if (!f) return void this.removeActor(actor);
		f.hp = m.dead ? 0 : m.hp;
		this.netMobs.set(m.id, f);
		const zone = this.world.data.monsterZones.find((z) => z.id === m.zone);
		if (m.boss) this.regionBosses.set(f, { zone: m.zone, name: zone?.name ?? actor.displayName });
	}

	/** Người chơi khác đang thấy trên map (đã có hình, còn hiện) — boss dùng chung chọn người để gọi vùng nổ. */
	private otherPositions(): { x: number; y: number }[] {
		const out: { x: number; y: number }[] = [];
		for (const r of this.remotes.values()) if (r.actor) out.push({ x: r.actor.x, y: r.actor.y });
		return out;
	}

	/** Báo máy chủ vị trí các quái mình làm chủ (còn sống) — 10 lần/giây, chỉ con có đổi. */
	private sendMobPositions(): void {
		const o = this.online;
		if (!o || !this.netMobs.size) return;
		const list: [string, number, number, string, string][] = [];
		for (const f of this.netMobs.values()) {
			const n = f.net;
			if (!n?.owned || f.dead) continue;
			const a = f.actor;
			const x = Math.round(a.x);
			const y = Math.round(a.y);
			const anim = a.view.animation === 'walk' ? 'walk' : 'idle';
			const dir = a.view.direction;
			if (x === n.tx && y === n.ty && anim === n.anim && dir === n.dir) continue;
			Object.assign(n, { tx: x, ty: y, anim, dir });
			list.push([n.id, x, y, dir, anim]);
		}
		if (list.length) o.send({ t: 'mobPos', list });
	}

	/**
	 * Thư viện: quái / NPC đứng trong tầm nhìn gần (`CODEX_SEE_RANGE`) lần đầu → thêm trang, báo một dòng, lưu. Quái bị hạ đã
	 * tính "đã gặp" ở `StoryDirector.monsterKilled`; ở đây chỉ cần đẩy tiến độ mới lên bảng.
	 */
	private scanCodex(): void {
		const p = this.player;
		if (!p) return;
		const fresh: string[] = [];
		const near = (x: number, y: number) => Math.hypot(x - p.x, y - p.y) <= CODEX_SEE_RANGE;
		for (const f of this.combat.enemies) if (!f.dead && near(f.actor.x, f.actor.y) && this.story.codexSee(f.id)) fresh.push(f.name);
		for (const n of this.npcs) {
			const def = STORY.npcs[n.key];
			if (def && near(n.x, n.y) && this.story.codexSee(npcKey(def.name))) fresh.push(def.name);
		}
		const c = this.story.codex;
		const shown = useGameStore.getState().codex;
		if (fresh.length) {
			useGameStore.getState().toast(`Thư viện có trang mới: ${fresh.join(', ')} (B)`, 'info');
			this.persist();
		}
		if (fresh.length || shown.seen.length !== c.seen.length || Object.keys(c.kills).some((k) => shown.kills[k] !== c.kills[k])) {
			useGameStore.setState({ codex: { ...shown, seen: [...c.seen], kills: { ...c.kills } } });
		}
	}

	/**
	 * Người chơi khác ở điểm thế giới (x, y): hộp thân (chân ± nửa bề ngang, lên tới đỉnh đầu) nới lên chỗ nhãn tên. Đang ẩn
	 * người chơi khác (Cài đặt) thì không ai cả. Nhiều người chồng nhau → người đứng TRƯỚC (y lớn hơn — vẽ sau).
	 */
	private remoteAt(x: number, y: number): Remote | null {
		if (!useSettings.getState().showOthers) return null;
		let best: Remote | null = null;
		for (const r of this.remotes.values()) {
			const a = r.actor;
			if (!a || Math.abs(x - a.x) > REMOTE_HIT_HALF_W || y > a.y + 6 || y < a.y - a.height - REMOTE_HIT_LABEL) continue;
			if (!best || a.y > best.actor!.y) best = r;
		}
		return best;
	}

	private removeRemote(id: string): void {
		const r = this.remotes.get(id);
		if (!r) return;
		r.actor?.root.destroy({ children: true });
		r.label.destroy();
		this.remotes.delete(id);
	}

	private updateRemotes(realDt: number, dt: number, toScreen: (x: number, y: number) => { x: number; y: number }): void {
		const k = 1 - Math.exp(-12 * realDt);
		// Cài đặt hiển thị: tắt người chơi khác thì vẫn cập nhật vị trí (bật lại không bị giật), chỉ ẩn hình + tên.
		const { showOthers, showOtherNames } = useSettings.getState();
		for (const r of this.remotes.values()) {
			const a = r.actor;
			r.label.visible = !!a && showOthers && showOtherNames;
			if (!a) continue;
			a.root.visible = showOthers;
			// Trượt mượt tới vị trí mới (máy chủ gửi 10 lần/giây); lệch quá xa (vừa dịch chuyển) thì nhảy thẳng.
			a.x += (r.tx - a.x) * k;
			a.y += (r.ty - a.y) * k;
			if (Math.hypot(r.tx - a.x, r.ty - a.y) > 300) Object.assign(a, { x: r.tx, y: r.ty });
			const anim = r.view.anim === 'walk' || r.view.anim === 'run' ? r.view.anim : 'idle';
			// Lưới an toàn khi tin `actionEnd` không tới (máy chủ bản cũ, rớt gói): người kia đang đi mà động tác
			// đã qua mốc huỷ → dừng như máy họ; lệch xa (lăn né, lướt) thì dừng ngay — không trượt trong tư thế vung.
			if (a.view.busy) {
				const gap = Math.hypot(r.tx - a.x, r.ty - a.y);
				if (gap > REMOTE_DASH_GAP || (anim !== 'idle' && a.view.actionCancellable)) a.view.endAction();
			}
			const dir = (FACING[r.view.dir] ? r.view.dir : 'S') as Direction;
			a.view.set(anim, dir, anim === 'run' ? RUN_SPEED / WALK_SPEED_REFERENCE : 1);
			a.update(dt);
			const s = toScreen(a.root.x, a.root.y - a.height - 12);
			r.label.position.set(Math.round(s.x), Math.round(s.y));
		}
	}

	/** Gửi vị trí của mình 10 lần/giây, chỉ khi có thay đổi. */
	private sendMove(realDt: number): void {
		const o = this.online;
		if (!o) return;
		this.moveTimer += realDt;
		if (this.moveTimer < 0.1) return;
		this.moveTimer = 0;
		const p = this.player;
		// Chỉ trạng thái nền (idle/walk/run): động tác ra đòn đi bằng tin `action` riêng, không lọt vào snapshot.
		const msg = { x: Math.round(p.x), y: Math.round(p.y), dir: p.view.direction, anim: p.view.baseAnimation, sprite: p.id };
		const key = `${msg.x},${msg.y},${msg.dir},${msg.anim},${msg.sprite}`;
		if (key === this.lastSent) return;
		this.lastSent = key;
		o.send({ t: 'move', ...msg });
	}

	/** Bình thời hạn còn hiệu lực → hệ số trong CombatSystem (gọi mỗi nhịp HUD: bình hết giờ ở máy này là thôi áp ngay). */
	private applyBuffs(): void {
		const m = buffMults(activeBuffs(useSession.getState().buffs, Date.now()));
		Object.assign(this.combat.potion, { exp: m.exp, dmg: m.dmg, guard: m.guard });
	}

	private pushHud(ticker: Ticker): void {
		this.applyBuffs();
		const pc = this.combat.pc;
		const now = performance.now();
		const tiers = this.story.talentTiers();
		const target = this.canAct() ? this.nearestInteractable() : null;
		// Vật thể (bia đá cổ) thì "Xem", người thì "Nói chuyện với".
		const npcVerb = (key: string) => (MERCHANT_NPCS.includes(key) && this.online ? 'Mua hàng của' : STORY.npcs[key]?.prop ? 'Xem' : 'Nói chuyện với');
		const hint = !target ? null : target.kind === 'npc' ? `${npcVerb(target.npc.key)} ${this.story.npcName(target.npc.key)}` : `Nhặt ${target.pickup.loot ? itemDef(target.pickup.item).name : (ITEM_NAME[target.pickup.item] ?? target.pickup.item)}`;
		useGameStore.setState({
			fps: Math.round(ticker.FPS),
			direction: this.player.view.direction,
			animation: this.player.view.animation,
			position: { x: Math.round(this.player.x), y: Math.round(this.player.y) },
			entityCount: this.actors.length,
			interactHint: hint,
			playerPortrait: this.playerPortrait(),
			hud: controlsForAge(this.shownAge).hud,
			stats: {
				name: this.shownAge < 16 ? `${persona().name} · ${this.shownAge} tuổi` : this.combat.path ? `${persona().name} · ${PATHS[this.combat.path].name}` : persona().name,
				level: pc.level,
				// Cấp tối đa: thanh EXP đầy (1/1), bảng Nhân vật ghi "Cấp tối đa".
				exp: pc.level >= MAX_LEVEL ? 1 : Math.floor(pc.exp),
				expNext: pc.level >= MAX_LEVEL ? 1 : expForLevel(pc.level),
				hp: Math.ceil(pc.hp),
				hpMax: pc.hpMax,
				mp: Math.floor(pc.mp),
				mpMax: pc.mpMax,
				stamina: Math.floor(pc.stamina),
				staminaMax: pc.staminaMax,
				coins: pc.coins,
				potions: pc.potions,
				...this.combat.sheet,
				dodgeStamina: round2(this.combat.dodgeStamina),
				path: this.combat.path ? PATHS[this.combat.path].name : '',
				age: this.shownAge,
				gear: this.gearStats,
				gearBasis: this.gearBasis(),
			},
			// Thanh kỹ năng = các ô ĐÃ GÁN theo thứ tự ô (ô trống không vẽ — thanh và cụm nút cảm ứng không phình vô ích).
			skills: this.loadout().flatMap((id, slot) => {
				const s = HERO_SKILLS.find((d) => d.id === id);
				if (!s) return [];
				const branch = SKILL_NODE[s.id]?.branch;
				return [
					{
						id: s.id,
						key: SLOT_KEYS[slot]!,
						code: SLOT_CODES[slot]!,
						slot,
						name: s.name,
						element: s.element,
						mpCost: s.mpCost,
						cooldown: round2(this.combat.cooldownOf(s)),
						readyAt: now + Math.max(0, (pc.cooldowns.get(s.id) ?? 0) - this.combat.time) * 1000,
						locked: !this.combat.knows(s),
						school: branch ?? 'aether',
						rank: branch ? (tiers[branch] ?? 0) : 0,
						maxRank: branch ? MAX_TIER : 0,
						scale: round2(this.combat.skillScaleOf(s)),
					},
				];
			}),
			boss: this.hudBoss(),
		});
		// Bảng tiềm năng + kho đồ hiếm khi đổi: so JSON với lần trước như chấm bản đồ — không đổi thì không ghi.
		const talents = this.talentsView(tiers);
		const talentsKey = JSON.stringify(talents);
		if (talentsKey !== this.lastTalents) {
			this.lastTalents = talentsKey;
			useGameStore.setState({ talents });
		}
		this.pushInventory();
	}

	/** Túi + búp bê: so JSON với lần trước — không đổi thì không ghi. Mặc/tháo gọi thẳng để bảng đổi ngay, không chờ nhịp HUD. */
	private pushInventory(): void {
		const inventory = this.inventoryView();
		const inventoryKey = JSON.stringify(inventory);
		if (inventoryKey !== this.lastInventory) {
			this.lastInventory = inventoryKey;
			useGameStore.setState({ inventory });
		}
		const equipment = this.equipmentView();
		const equipmentKey = JSON.stringify(equipment);
		if (equipmentKey !== this.lastEquipment) {
			this.lastEquipment = equipmentKey;
			useGameStore.setState({ equipment });
		}
	}

	/**
	 * Cách CombatSystem đổi phần cộng của trang bị ra số trên bảng — hệ số làm tròn 4 chữ số. Không đổi thì trả LẠI object
	 * cũ: bảng Kho đồ chọn trường này theo tham chiếu, khỏi vẽ lại mỗi nhịp HUD.
	 */
	private gearBasis(): { base: Stats; scale: Stats } {
		const b = this.combat.gearBasis;
		const r4 = (n: number) => Math.round(n * 10000) / 10000;
		const next = { base: b.base, scale: Object.fromEntries(STAT_KEYS.map((k) => [k, r4(b.scale[k])])) as Stats };
		const key = JSON.stringify(next);
		if (key !== this.lastBasis.key) this.lastBasis = { key, value: next };
		return this.lastBasis.value;
	}

	/** Bảng tiềm năng: cây 6 nhánh (kể cả nhánh chưa mở — hiện khoá để người chơi biết còn gì phía trước), phủ phép, thanh 10 ô. */
	private talentsView(tiers: Tiers): TalentsView {
		const level = this.combat.pc.level;
		const style = this.story.swordStyle;
		const build = describeBuild(tiers, style);
		const points = pointsForLevel(level);
		const isUnlocked = (id: string) => this.story.isUnlocked(id);
		const nodeView = (n: TreeNode, tier: number) => ({ tier: n.tier, kind: n.kind, name: n.name, desc: n.desc, ready: n.ready, reached: tier >= n.tier, cost: TIER_COST[n.tier] ?? 0, ...(n.skillId ? { skillId: n.skillId } : {}) });
		const branches = BRANCHES.map((b) => {
			const tier = tiers[b] ?? 0;
			const unlocked = branchOpen(b, isUnlocked);
			const first = TREE[b][0];
			return {
				branch: b,
				name: BRANCH_NAME[b],
				unlocked,
				lockNote: unlocked ? '' : (BRANCH_LOCK_NOTE[b] ?? 'Mở theo cốt truyện'),
				tier,
				maxTier: MAX_TIER,
				cap: tierCap(b),
				bonusPct: Math.round((depthBonus(tier) - 1) * 100),
				nextCost: nextTierCost(tiers, b),
				iconSkill: first?.ready && first.skillId ? first.skillId : null,
				nodes: treeOf(b, style).map((n) => nodeView(n, tier)),
				// Kiếm: 3 lưu phái từ mốc 3 — chưa chọn thì hiện cả ba để chọn; đã chọn thì hai lưu phái kia mờ.
				...(b === 'sword'
					? {
							style,
							styleTier: STYLE_TIER,
							styles: SWORD_STYLES.map((s) => ({ id: s, ...SWORD_STYLE_INFO[s], chosen: style === s, iconSkill: STYLE_TREE[s][0]?.skillId ?? null, nodes: STYLE_TREE[s].map((n) => nodeView(n, style === s ? tier : 0)) })),
						}
					: {}),
			};
		});
		// Kiếm pháp nguyên tố: hiện cả khi chưa đủ điều kiện (biết đường mà nuôi), kèm điều kiện + đã học chưa.
		const arts = (Object.entries(SWORD_ARTS) as [EnchantId, string][]).flatMap(([e, id]) => {
			const s = HERO_SKILLS.find((d) => d.id === id);
			if (!s) return [];
			const swordOk = (tiers.sword ?? 0) >= SWORD_ART_TIER;
			const elementOk = (tiers[e] ?? 0) >= SWORD_ART_TIER;
			return [
				{
					skillId: id,
					name: s.name,
					desc: skillDesc(id),
					element: e,
					elementName: BRANCH_NAME[e],
					need: `Kiếm mốc ${SWORD_ART_TIER} + ${BRANCH_NAME[e]} mốc ${SWORD_ART_TIER}`,
					swordOk,
					elementOk,
					learned: knowsSkill(s, tiers, isUnlocked, style),
				},
			];
		});
		const enchantOptions = ENCHANTS.map((e) => ({
			id: e,
			name: ENCHANT_LABEL[e],
			ok: canEnchant(tiers, e),
			need: `Kiếm mốc ${ENCHANT_SWORD_TIER} + ${BRANCH_NAME[e]} mốc ${ENCHANT_ELEMENT_TIER}`,
			desc: enchantDesc(e, tiers[e] ?? 0),
		}));
		const lo = this.loadout();
		return {
			points,
			spent: spentPoints(tiers),
			unspent: unspent(level, tiers),
			buildKind: build.kind,
			buildLabel: build.label,
			buildDetail: build.detail,
			branches,
			resetCost: resetCost(level),
			// Hồi chiêu làm tròn lên giây: trùng JSON thì store không ghi (bảng không vẽ lại mỗi frame).
			enchant: { current: this.combat.enchantment, cooldown: Math.ceil(this.combat.enchantCooldown), options: enchantOptions },
			loadout: lo.map((skillId, slot) => ({ slot, key: SLOT_KEYS[slot]!, skillId })),
			arts,
			learned: this.knownSkills().flatMap((id) => {
				const s = HERO_SKILLS.find((d) => d.id === id);
				return s ? [{ id: s.id, name: s.name, element: s.element }] : [];
			}),
		};
	}

	/** Một món (trong túi hoặc đang mặc) → dòng hiển thị. id lạ hiện "Vật phẩm lạ", ảnh rỗng. */
	private itemView(s: ItemStack, at: EquipSlotId | null): InventoryItem {
		const d = itemDef(s.id);
		const all = stackStats(s);
		const stats = Object.fromEntries(STAT_KEYS.filter((k) => all[k] !== 0).map((k) => [k, all[k]]));
		return {
			id: s.id,
			uid: s.uid,
			name: d.name,
			desc: d.desc,
			icon: d.icon,
			w: d.w,
			h: d.h,
			count: s.n ?? 1,
			kind: d.kind,
			...(d.equip ? { equipKind: d.equip } : {}),
			...(Object.keys(stats).length ? { stats } : {}),
			...(d.rarity ? { rarity: d.rarity } : {}),
			...(d.levelReq ? { levelReq: d.levelReq } : {}),
			...(d.bound ? { bound: true } : {}),
			...(d.effect ? { effect: d.effect } : {}),
			equippedAt: at,
		};
	}

	/**
	 * Túi đồ: đồ trong `gear.bag` (thứ tự túi) + chồng ẢO bình mật ong dựng từ `player.potions` (HUD, phím R, máy chủ đọc
	 * trường đó). Bình giữ cả khi hết (biết là có món đó) từ lúc dùng được — tám tuổi mẹ mới đưa hũ mật. Xu ở ví, không
	 * chiếm ô.
	 */
	private inventoryView(): InventoryItem[] {
		const pc = this.combat.pc;
		const bag = this.story.gear.bag.map((s) => this.itemView(s, null));
		const potionOk = controlsForAge(this.shownAge).potion;
		if (pc.potions > 0 || potionOk) bag.push({ ...this.itemView({ uid: 'potion', id: 'potion' }, null), count: pc.potions, usable: potionOk });
		return bag;
	}

	/** 10 ô búp bê theo thứ tự `EQUIP_SLOTS`. */
	private equipmentView(): EquipSlotView[] {
		const eq = this.story.gear.equip;
		return EQUIP_SLOTS.map((slot) => {
			const it = eq[slot];
			return { slot, name: SLOT_NAME[slot], item: it ? this.itemView(it, slot) : null };
		});
	}

	/** Đồ đang mặc → CombatSystem (cộng phẳng trước hệ số) + vẽ lại kho đồ. Gọi lúc nạp và sau mọi lần đổi trang bị. */
	private syncGear(): void {
		if (!this.combat || !this.story) return;
		this.gearStats = gearBonus(this.story.gear);
		this.combat.setGear(this.gearStats);
		this.pushInventory();
		this.applyPlayerGear();
	}

	/**
	 * Phần HÌNH của trang bị: lớp đồ gắn trên actor người chơi + hình giữa kho đồ, gửi cho người cùng map, và đổi sprite khi
	 * món áo có bộ trang phục riêng (`OUTFITS`). Chưa dựng người chơi (đang nạp) thì chỉ ghi nhớ — `init` gọi lại sau khi dựng.
	 */
	private applyPlayerGear(): void {
		const pieces = gearPieces(this.story.gear.equip);
		const changed = encodeGear(pieces).join('|') !== encodeGear(this.gearPieces).join('|');
		this.gearPieces = pieces;
		if (!this.player) return;
		// Thế cầm lần đầu theo con đường (Pháp sư cầm gậy); sau đó đổi theo động tác chém / niệm.
		if (!this.stanceSet) {
			this.player.setGearStance(defaultStance(this.story.state.path));
			this.stanceSet = true;
		}
		this.player.setGear(pieces);
		this.sendGear();
		if (changed) this.publishPlayerSprite();
		const body = this.story.gear.equip.body?.id;
		const bodyChanged = this.outfitBody !== null && body !== this.outfitBody;
		this.outfitBody = body;
		if (!bodyChanged) return;
		const want = this.playerSpriteFor(this.story.state.age);
		if (want !== this.player.id) void this.swapPlayer(want).catch((e) => console.error('[gear] đổi bộ trang phục', e));
	}

	/** Gửi đồ gắn đang mặc khi đổi (và sau mỗi `welcome` — `lastGearSent` được xoá). Máy chủ bản cũ bỏ qua tin này. */
	private sendGear(): void {
		const o = this.online;
		if (!o) return;
		const gear = encodeGear(this.gearPieces);
		const key = gear.join('|');
		if (key === this.lastGearSent) return;
		this.lastGearSent = key;
		o.send({ t: 'gear', gear });
	}

	/**
	 * Cửa vào DUY NHẤT để trao vật phẩm (quà cốt truyện, về sau rơi đồ / thưởng nhiệm vụ / mua). Bình mật ong và xu cộng
	 * vào `player` (HUD, phím R, máy chủ đọc hai trường đó); còn lại qua `StoryDirector.giveItem` — `autoEquip`: ô hợp
	 * trống thì mặc luôn. Túi đầy: phần dư để thành vật nhặt cạnh người chơi (trừ khi `drop: false`). Trả số món còn dư.
	 */
	grantItem(id: string, n = 1, opts: { autoEquip?: boolean; drop?: boolean } = {}): number {
		const pc = this.combat.pc;
		const k = Math.max(0, Math.floor(n));
		if (id === 'potion' || id === 'coins') {
			if (id === 'potion') pc.potions += k;
			else pc.coins += k;
			this.persist();
			return 0;
		}
		const r = this.story.giveItem(id, k, !!opts.autoEquip);
		this.syncGear();
		this.persist();
		if (r.overflow > 0 && opts.drop !== false) this.dropItem(id, r.overflow);
		return r.overflow;
	}

	/**
	 * Quà điểm danh / thành tựu từ máy chủ (K1): kim cương đã vào ví ở máy chủ (tin `wallet` đi kèm), xu + bình hồi phục còn ở
	 * bản lưu client (tới M3.3) nên cộng ở đây qua `grantItem` — lưu luôn.
	 */
	private receiveGift(reason: 'checkin' | 'goal', title: string, gift: GiftView): void {
		if (gift.coins > 0) this.grantItem('coins', gift.coins);
		if (gift.potions > 0) this.grantItem('potion', gift.potions);
		const text = giftText(gift);
		useGameStore.getState().toast(reason === 'goal' ? `Thành tựu: ${title}` : `${title}: ${text}`, reason === 'goal' ? 'level' : 'loot');
		if (reason === 'goal' && text) useGameStore.getState().toast(text, 'loot');
	}

	/**
	 * Túi đầy: để `n` món `id` thành vật nhặt cạnh chân người chơi (cơ chế pickups của nhiệm vụ). Hình là chính ảnh vật
	 * phẩm; tải hỏng thì dùng đồ vật mặc định của vùng. Như vật nhặt nhiệm vụ, nó mất khi rời map.
	 */
	private dropItem(id: string, n: number): void {
		useGameStore.getState().toast(`Túi đầy — ${itemDef(id).name} để dưới đất, dọn túi rồi nhặt (E)`, 'warn');
		const p = this.player;
		if (!p) return;
		const x = Math.round(p.x + 28);
		const y = Math.round(p.y + 6);
		const token = this.mapToken;
		const place = (tex: Texture | undefined): void => {
			if (!tex || this.destroyed || token !== this.mapToken) return;
			const sprite = new Sprite(tex);
			sprite.anchor.set(0.5, 1);
			sprite.position.set(x, y);
			sprite.zIndex = y;
			this.entities.addChild(sprite);
			this.pickups.push({ item: id, sprite, x, y, t: 0, loot: { id, n } });
		};
		const icon = itemDef(id).icon;
		if (!icon) return place(this.world.propTexture('flower_blue'));
		void Assets.load<Texture>(icon)
			.then(place)
			.catch(() => place(this.world.propTexture('flower_blue')));
	}

	/**
	 * Mặc / tháo theo yêu cầu của kho đồ: luật nằm ở hàm thuần `applyGearRequest` (có test), lỗi thì báo nguyên văn; được
	 * thì lưu + cộng chỉ số + vẽ lại. Yêu cầu không đổi gì (bấm trùng) thì im lặng.
	 */
	private onGearRequest(r: GameRequest): void {
		if (r.kind !== 'equip' && r.kind !== 'unequip') return;
		const st = useGameStore.getState();
		const out = applyGearRequest(this.story.gear, { kind: r.kind, uid: r.uid, equipSlot: r.equipSlot }, this.combat.pc.level, this.story.state.age);
		if (out === null) return;
		if (typeof out === 'string') return void st.toast(out, 'warn');
		this.story.setGear(out.g);
		this.syncGear();
		this.persist();
		if (out.text) st.toast(out.text, 'info');
	}

	/**
	 * Mốc tiềm năng (từ bản lưu + nhánh đã mở) → CombatSystem, rồi giữ thanh 10 ô hợp lệ. Gọi sau mọi thứ đổi được mốc:
	 * cộng/tẩy, mở nhánh, đổi tuổi.
	 */
	private syncTalents(): void {
		if (!this.combat || !this.story) return;
		const tiers = this.story.talentTiers();
		this.combat.setTalents(tiers, this.story.swordStyle);
		const st = this.story.state;
		// Phủ phép mất điều kiện (tẩy điểm…) thì bỏ hẳn lựa chọn — không để nó tự bật lại khi cộng lại điểm.
		if (st.enchant && !canEnchant(tiers, st.enchant)) st.enchant = null;
		this.combat.restoreEnchant(st.enchant ?? null);
		const known = this.knownSkills();
		let lo = normalizeLoadout(st.loadout, known) ?? defaultLoadout(known);
		// Kỹ năng vừa học (so với lần đồng bộ trước) tự lên thanh; kỹ năng người chơi tự gỡ khỏi thanh thì không gắn lại.
		if (this.knownPrev) for (const id of known) if (!this.knownPrev.has(id)) lo = placeSkill(lo, id);
		this.knownPrev = new Set(known);
		if (JSON.stringify(lo) !== JSON.stringify(st.loadout)) this.story.setLoadout(lo);
	}

	/** Kỹ năng đang biết (theo thứ tự `HERO_SKILLS`): mã cốt truyện + mốc nhánh đủ + đúng lưu phái Kiếm. */
	private knownSkills(): string[] {
		const tiers = this.story.talentTiers();
		const style = this.story.swordStyle;
		return HERO_SKILLS.filter((s) => knowsSkill(s, tiers, (id) => this.story.isUnlocked(id), style)).map((s) => s.id);
	}

	/** Thanh 10 ô hiện tại (đã kẹp ở `syncTalents`). */
	private loadout(): Loadout {
		const lo = this.story.state.loadout;
		return Array.isArray(lo) ? lo : [];
	}

	/** Chỉ số trong `HERO_SKILLS` của kỹ năng đang gán ở ô `slot`; −1 = ô trống. */
	private slotSkill(slot: number): number {
		const id = this.loadout()[slot];
		return id ? HERO_SKILLS.findIndex((s) => s.id === id) : -1;
	}

	/** Bảng nhân vật/tiềm năng/kho đồ xin game làm gì đó (`useGameStore.request`). */
	private onGameRequest(r: GameRequest): void {
		if (!this.combat || !this.story) return;
		const st = useGameStore.getState();
		const pc = this.combat.pc;
		if (r.kind === 'use_potion') {
			if (!controlsForAge(this.shownAge).potion) return void st.toast('Chưa tới lúc dùng bình mật ong', 'warn');
			return this.combat.usePotion();
		}
		if (r.kind === 'equip' || r.kind === 'unequip') return this.onGearRequest(r);
		if (r.kind === 'talent_add') {
			const branch = r.branch;
			if (!branch || !BRANCHES.includes(branch)) return;
			const tiers = this.story.talentTiers();
			const tier = tiers[branch] ?? 0;
			const name = BRANCH_NAME[branch];
			// Nút Học ghi kèm mốc đích: mốc hiện tại đã khác (cú bấm thứ hai của một lần nhấp đúp, nút còn nhãn cũ tới nhịp HUD
			// sau) thì bỏ qua lặng lẽ — không mua lố một mốc mà phải tẩy điểm (tốn xu) mới lấy lại được.
			if (r.tier !== undefined && r.tier !== tier + 1) return;
			if (tier < 1) return void st.toast(`Chưa mở nhánh ${name}`, 'warn');
			const cost = nextTierCost(tiers, branch);
			if (cost === null) return void st.toast(tier >= MAX_TIER ? `${name} đã đạt mốc tối đa` : `${name} mốc ${tier + 1} sắp có`, 'warn');
			if (unspent(pc.level, tiers) < cost) return void st.toast(`Cần ${cost} điểm để lên ${name} mốc ${tier + 1} — lên cấp để nhận thêm`, 'warn');
			// Kiếm lên mốc 3 lần đầu: phải kèm lưu phái (bảng Tiềm năng có ba nút chọn); đã có lưu phái thì bỏ qua.
			const picking = branch === 'sword' && tier === STYLE_TIER - 1 && !this.story.swordStyle;
			if (picking && (!r.style || !SWORD_STYLES.includes(r.style))) return void st.toast(`Kiếm mốc ${STYLE_TIER}: chọn một lưu phái ở bảng Tiềm năng`, 'warn');
			const before = new Set(this.knownSkills());
			if (!this.story.spendTalent(branch, pc.level, picking ? r.style : undefined)) return;
			this.syncTalents();
			this.persist();
			const node = treeOf(branch, this.story.swordStyle)[tier];
			// Kỹ năng vừa học đã tự lên ô trống (syncTalents) — báo luôn phím, hết ô thì chỉ chỗ gán.
			const learnt = node?.ready && node.skillId ? ` (${this.keyLabel(node.skillId)})` : '';
			const head = picking && r.style ? `Kiếm mốc ${tier + 1} — vào lưu phái ${SWORD_STYLE_INFO[r.style].name}` : `${name} lên mốc ${tier + 1}`;
			st.toast(`${head}${node?.ready ? ` — ${node.kind === 'active' ? 'học' : 'bị động'} “${node.name}”${learnt}` : ''}`, 'level');
			// Kiếm hoặc nguyên tố vừa chạm mốc 5: lĩnh ngộ kiếm pháp nguyên tố (có thể nhiều cái cùng lúc khi Kiếm lên mốc 5).
			for (const id of Object.values(SWORD_ARTS)) {
				const art = HERO_SKILLS.find((s) => s.id === id);
				if (art && !before.has(id) && this.knownSkills().includes(id)) st.toast(`Lĩnh ngộ kiếm pháp: ${art.name} (${this.keyLabel(id)})`, 'level');
			}
			return;
		}
		if (r.kind === 'set_slot') {
			const slot = r.slot ?? -1;
			if (slot < 0 || slot >= SLOT_KEYS.length) return;
			const id = r.skillId ?? null;
			if (id !== null && !this.knownSkills().includes(id)) return void st.toast('Chưa học kỹ năng này', 'warn');
			this.story.setLoadout(assignSlot(this.loadout(), slot, id));
			this.persist();
			return;
		}
		if (r.kind === 'set_enchant') {
			const e = r.enchant ?? null;
			if (e !== null && !ENCHANTS.includes(e)) return;
			const res = this.combat.setEnchant(e);
			if (res === 'locked') return void st.toast(`Cần Kiếm mốc ${ENCHANT_SWORD_TIER} và ${BRANCH_NAME[e!]} mốc ${ENCHANT_ELEMENT_TIER} để phủ phép`, 'warn');
			if (res === 'cooldown') return void st.toast(`Đổi phủ phép sau ${Math.ceil(this.combat.enchantCooldown)} giây nữa`, 'warn');
			if (res === 'same') return;
			this.story.setEnchant(e);
			this.persist();
			return void st.toast(e ? `Phủ phép: ${ENCHANT_LABEL[e]}` : 'Đã tắt phủ phép', 'info');
		}
		// talent_reset: xu nằm trong CombatSystem nên trừ ở đây; StoryDirector chỉ xoá điểm.
		const spent = spentPoints(this.story.talentTiers());
		if (spent <= 0) return void st.toast('Chưa cộng điểm nào để tẩy', 'info');
		const cost = resetCost(pc.level);
		if (pc.coins < cost) return void st.toast(`Cần ${cost} xu để tẩy điểm (đang có ${pc.coins})`, 'warn');
		pc.coins -= cost;
		this.story.resetTalents();
		this.syncTalents();
		this.persist();
		st.toast(cost ? `Đã tẩy ${spent} điểm tiềm năng (−${cost} xu)` : `Đã tẩy ${spent} điểm tiềm năng (miễn phí tới cấp 5)`, 'info');
	}

	/** Ảnh toàn cảnh + tên vùng/địa danh cho minimap và bản đồ lớn (một lần mỗi map). */
	private publishMapInfo(): void {
		const w = this.world;
		const mini = w.minimap;
		if (!mini) return useGameStore.setState({ mapInfo: null });
		// Tải sẵn ảnh để lần đầu mở bản đồ không nháy trắng.
		new Image().src = mini.url;
		useGameStore.setState({
			mapInfo: {
				url: mini.url,
				imgW: mini.width,
				imgH: mini.height,
				scale: mini.width / w.width,
				worldW: w.width,
				worldH: w.height,
				// Tên vùng đặt sát mép dưới/trên xen kẽ (giữa map là đường + địa danh dày đặc; vùng sông hẹp nằm giữa hai vùng lớn).
				areas: w.data.areas.map((a, i) => ({ name: a.name, x: (a.x0 + a.x1) / 2, y: i % 2 ? a.y0 + 70 : a.y1 - 110 })),
				landmarks: [
					...(w.data.spots ?? []).filter((s) => !HIDDEN_LANDMARK.test(s.id)).map((s) => ({ id: s.id, name: s.name, x: s.x, y: s.y })),
					...w.exits.map((e) => {
						const g = exitGoal(e, e.label);
						return { id: e.id, name: `→ ${e.label}`, x: Math.round(g.x - EDGE_DIR[e.edge].x * EXIT_LABEL_INSET), y: Math.round(g.y - EDGE_DIR[e.edge].y * 90) };
					}),
				],
			},
		});
	}

	/**
	 * Sang map khác qua một lối (hoặc về nhà khi lớn thêm tuổi): màn tối dần → gỡ map cũ cùng quái/NPC/vật phẩm của nó →
	 * nạp map mới, đứng ở `spotId` → dựng lại NPC, bầy quái, phần thế giới của nhiệm vụ đang làm → báo máy chủ → sáng
	 * lại. Đang tự đi thì đi tiếp trên map mới (mục tiêu cách nhiều map vẫn tới được).
	 */
	private async changeMap(mapId: string, spotId: string | null): Promise<void> {
		if (this.changing || this.destroyed || !this.worldIndex.has(mapId)) return;
		const resumeWalk = !!this.autoWalk;
		this.cancelAutoWalk('map');
		this.combat.interrupt();
		this.changing = true;
		this.fade.target = 1;
		try {
			// Chờ tối hẳn (~0,2s) song song với lúc tải map — không thấy cảnh nhảy.
			const [world] = await Promise.all([MapWorld.load(this.worldIndex.region, mapId, this.entities), new Promise((r) => setTimeout(r, 220))]);
			if (this.destroyed) return void world.destroy();
			this.clearMapEntities();
			this.world.destroy();
			this.world = world;
			this.mapId = mapId;
			this.scene.addChildAt(world.decalLayer, 0);
			this.scene.addChildAt(world.ground.layer, 0);
			for (const d of world.data.dummies ?? []) this.combat.addDummy(d.x, d.y);
			const at = (spotId && world.spot(spotId)) || world.data.spawn;
			const p = this.player;
			Object.assign(p, { x: at.x, y: at.y });
			this.nav = new NavGrid(world.width, world.height, (x, y, rx, ry) => world.blocked(x, y, rx, ry));
			this.camera.bounds = { w: world.width, h: world.height };
			this.camera.snapTo(at.x, at.y - Math.round(p.height / 2));
			world.ground.warm(at.x, at.y, 700);
			this.buildExitMarkers();
			this.publishMapInfo();
			this.area = '';
			// Máy chủ chuyển mình sang nhóm người chơi của map mới rồi gửi lại danh sách (`welcome`).
			for (const id of [...this.remotes.keys()]) this.removeRemote(id);
			this.online?.send({ t: 'map', map: `${this.worldIndex.region}/${mapId}` });
			this.lastSent = '';
			await this.spawnNpcs(this.shownAge);
			if (this.destroyed) return;
			for (const z of world.data.monsterZones) if (!z.onDemand && this.story.state.age >= (z.fromAge ?? 0)) void this.spawnZone(z.id).catch((e) => console.error('[map] quái', e));
			this.story.reapplyWorld();
			this.persist();
		} catch (e) {
			console.error('[map]', e);
			useGameStore.getState().toast('Không tải được vùng mới — thử lại', 'warn');
		} finally {
			this.changing = false;
			this.fade.target = 0;
		}
		if (resumeWalk && !this.destroyed) this.startAutoWalk();
	}

	private regionBossKey(zoneId: string): string {
		return `${this.worldIndex.region}/${this.mapId}/${zoneId}`;
	}

	/** Thanh máu boss trên HUD: boss cốt truyện đang đánh, không thì boss vùng đang giao chiến gần nhất. */
	private hudBoss(): { name: string; hp: number; hpMax: number } | null {
		const b = pickHudBoss(this.boss, [...this.regionBosses.keys()], this.player.x, this.player.y);
		return b ? { name: b.name, hp: Math.ceil(b.hp), hpMax: b.hpMax } : null;
	}

	/** Gỡ mọi thứ thuộc map cũ: quái, boss, hình nộm, đạn, vật phẩm nhặt. Người chơi giữ nguyên. */
	private clearMapEntities(): void {
		this.mapToken += 1;
		// Ghi mốc thức dậy của boss vùng đang nằm trước khi Fighter (và đồng hồ của nó) bị gỡ; còn sống thì xoá mốc cũ.
		for (const [f, { zone }] of this.regionBosses) {
			const key = this.regionBossKey(zone);
			if (f.dead) this.regionBossWakeAt.set(key, this.combat.time + Math.max(0, f.respawnT));
			else this.regionBossWakeAt.delete(key);
		}
		for (const a of this.combat.clearWorld()) this.removeActor(a);
		this.netMobs.clear();
		this.mobsWanted = false;
		this.boss = null;
		this.regionBosses.clear();
		useGameStore.setState({ boss: null });
		this.spawnedZones.clear();
		for (const pk of this.pickups) pk.sprite.destroy();
		this.pickups.length = 0;
	}

	/** Mũi tên chỉ hướng + tên map đích ở mỗi lối sang map (dựng lại mỗi lần đổi map). */
	private buildExitMarkers(): void {
		for (const m of this.exitMarkers) {
			m.arrow.destroy();
			m.label.destroy();
		}
		this.exitMarkers = this.world.exits.map((exit) => {
			const d = EDGE_DIR[exit.edge];
			// Lùi vào trong map 1,5 ô so với mép: mũi tên không dính sát khung màn hình khi camera chạm biên.
			const x = (exit.x0 + exit.x1) / 2 - d.x * 72;
			const y = (exit.y0 + exit.y1) / 2 - d.y * 72;
			const arrow = new Graphics();
			for (const off of [-9, 9]) arrow.poly([off - 9, -13, off + 9, 0, off - 9, 13, off - 3, 0]).fill(0xffd166).stroke({ color: 0x0b0d12, width: 3 });
			arrow.rotation = Math.atan2(d.y, d.x);
			arrow.position.set(x, y);
			this.exitLayer.addChild(arrow);
			return { exit, arrow, label: this.makeLabel(exit.label, 0xffd166), x, y };
		});
	}

	private updateExitMarkers(toScreen: (x: number, y: number) => { x: number; y: number }): void {
		const bob = Math.sin(this.combat.time * 4) * 6;
		for (const m of this.exitMarkers) {
			const d = EDGE_DIR[m.exit.edge];
			m.arrow.position.set(m.x + d.x * bob, m.y + d.y * bob);
			const s = toScreen(m.x, m.y - 26);
			m.label.position.set(Math.round(s.x), Math.round(s.y));
		}
	}

	/**
	 * Chỗ làm nhiệm vụ đang hiện → toạ độ + bán kính dừng (cùng hàm với test node). Mục tiêu nằm ở map KHÁC thì chỗ
	 * cần tới là lối sang map kế tiếp trên đường ngắn nhất — bước vào lối là sang map, tự đi đi tiếp trên map mới.
	 */
	private questGoal(): ResolvedTarget | null {
		const p = this.player;
		const w = this.world;
		const target = this.story.questTarget();
		const where = this.worldIndex.mapOfTarget(target, this.mapId, (key) => STORY.npcs[key]?.at.spot);
		if (where && where !== this.mapId) {
			const next = this.worldIndex.nextExit(this.mapId, where);
			const exit = next && w.exits.find((e) => e.id === next.id);
			return exit ? exitGoal(exit, this.worldIndex.name(where)) : null;
		}
		return resolveTarget(target, {
			spot: (id) => w.spot(id),
			npcPos: (key) => {
				const n = this.npcs.find((m) => m.key === key);
				if (n) return n.actor ? { x: n.actor.x, y: n.actor.y } : { x: n.x, y: n.y };
				const def = STORY.npcs[key];
				return def ? npcAnchor(def.at, w.spot(def.at.spot), w.data.spawn) : undefined;
			},
			npcName: (key) => this.story.npcName(key),
			pickups: this.pickups,
			zones: w.data.monsterZones.map((z) => ({ ...z, active: this.spawnedZones.has(z.id) })),
			dummies: w.data.dummies ?? [],
			boss: w.data.boss,
			bossPos: this.boss && !this.boss.dead ? { x: this.boss.actor.x, y: this.boss.actor.y } : null,
			player: { x: p.x, y: p.y },
		});
	}

	private engagedCount(): number {
		let n = 0;
		for (const e of this.combat.enemies) if (e.engaged && !e.dead) n += 1;
		return n;
	}

	/** Bị đánh, hoặc có thêm quái lao vào kể từ lúc bắt đầu tự đi. */
	private threatened(): boolean {
		return this.combat.pc.lastHurt !== this.autoWalkStart.hurt || this.engagedCount() > this.autoWalkStart.engaged;
	}

	/** Ô nhiệm vụ / nút "Đi tới" trên bản đồ: `toggle` bấm lại là dừng, `start` luôn đi (tìm đường lại). */
	private onAutoWalkRequest(mode: 'toggle' | 'start'): void {
		if (this.autoWalk && mode === 'toggle') return this.cancelAutoWalk('toggle');
		this.cancelAutoWalk('toggle');
		this.startAutoWalk();
	}

	private startAutoWalk(): void {
		const st = useGameStore.getState();
		if (!this.canAct() || this.combat.pc.dead) return;
		const target = this.questGoal();
		if (!target) return void st.toast('Nhiệm vụ này không cần đi đâu cả', 'info');
		this.nav ??= new NavGrid(this.world.width, this.world.height, (x, y, rx, ry) => this.world.blocked(x, y, rx, ry));
		const p = this.player;
		const walk = new AutoWalk(this.nav, () => this.questGoal(), target, { x: p.x, y: p.y });
		if (!walk.ok) return void st.toast('Không tìm được đường', 'warn');
		if (walk.partial) st.toast('Chỉ đi được tới gần chỗ đó', 'warn');
		this.autoWalk = walk;
		this.autoWalkStart = { hurt: this.combat.pc.lastHurt, engaged: this.engagedCount() };
		this.pushAutoWalk();
	}

	private cancelAutoWalk(reason: AutoWalkStop): void {
		const w = this.autoWalk;
		if (!w) return;
		this.autoWalk = null;
		this.pushAutoWalk();
		const p = this.player;
		// Tới hình nộm thì quay mặt vào nó: bấm chém là trúng ngay. Không tự nói chuyện — để người chơi bấm.
		if (reason === 'arrived' && w.target.face && p) p.view.set('idle', directionOf(w.target.face.x - p.x, w.target.face.y - p.y));
		if (reason === 'fail') useGameStore.getState().toast('Không tìm được đường', 'warn');
		if (reason === 'enemy') useGameStore.getState().toast('Có địch!', 'warn');
	}

	private pushAutoWalk(): void {
		const w = this.autoWalk;
		const view = w ? { label: w.target.label, path: w.path.map((q) => ({ x: Math.round(q.x), y: Math.round(q.y) })), target: { x: Math.round(w.target.x), y: Math.round(w.target.y) } } : null;
		const key = view ? JSON.stringify(view) : '';
		if (key === this.lastAutoWalkView) return;
		this.lastAutoWalkView = key;
		useGameStore.setState({ autoWalk: view });
	}

	/** Chấm trên minimap / bản đồ lớn: chỗ làm nhiệm vụ, NPC, người chơi khác — chỉ ghi khi có đổi. */
	private pushMarkers(): void {
		const goal = this.questGoal();
		const markers = {
			quest: goal ? { x: Math.round(goal.x), y: Math.round(goal.y), r: goal.r, label: goal.label } : null,
			npcs: this.npcs.map((n) => ({ key: n.key, name: this.story.npcName(n.key), x: Math.round(n.actor?.x ?? n.x), y: Math.round(n.actor?.y ?? n.y) })),
			remotes: [...this.remotes.values()]
				.filter((r) => r.actor)
				.slice(0, 30)
				.map((r) => ({ name: r.view.name, x: Math.round(r.actor!.x), y: Math.round(r.actor!.y) })),
		};
		const key = JSON.stringify(markers);
		if (key === this.lastMarkers) return;
		this.lastMarkers = key;
		useGameStore.setState({ mapMarkers: markers });
	}

	private persist(): void {
		if (!this.combat || !this.story) return;
		const pc = this.combat.pc;
		this.story.state.player = { level: pc.level, exp: Math.floor(pc.exp), coins: pc.coins, potions: pc.potions };
		const o = this.online;
		if (o && this.player) Object.assign(o.progress, { level: pc.level, exp: Math.floor(pc.exp), coins: pc.coins, potions: pc.potions, map: `${this.worldIndex.region}/${this.mapId}`, x: Math.round(this.player.x), y: Math.round(this.player.y) });
		this.story.save();
	}

	/** Dùng cho hook kiểm thử ở dev. */
	debug() {
		return {
			teleport: (x: number, y: number) => {
				this.cancelAutoWalk('teleport');
				this.combat.interrupt();
				Object.assign(this.player, { x, y });
			},
			teleportSpot: (id: string) => {
				const s = this.world.spot(id);
				if (!s) return;
				this.cancelAutoWalk('teleport');
				this.combat.interrupt();
				Object.assign(this.player, { x: s.x, y: s.y });
			},
			player: () => ({ x: Math.round(this.player.x), y: Math.round(this.player.y), sprite: this.player.id, map: this.mapId }),
			/** Sang map khác như đi qua lối (`goMap('mossvale', 'west_entry')`); trả Promise xong khi map mới đã dựng. */
			goMap: (id: string, spot: string | null = null) => this.changeMap(id, spot),
			exits: () => this.world.exits.map((e) => ({ id: e.id, to: e.to, x0: e.x0, y0: e.y0, x1: e.x1, y1: e.y1 })),
			blocked: (x: number, y: number) => this.world.blocked(x, y, 11, 5),
			combat: () => ({ level: this.combat.pc.level, hp: this.combat.pc.hp, mp: this.combat.pc.mp, enemies: this.combat.enemies.map((e) => ({ id: e.id, hp: Math.round(e.hp), dead: e.dead, x: Math.round(e.actor.x), y: Math.round(e.actor.y), net: e.net ? (e.net.owned ? 'own' : 'puppet') : null, freeze: round2(e.freeze) })) }),
			/** Có động tác thì đòn chỉ BẮT ĐẦU: `step(Math.ceil(action().releaseAt * 60) + 1)` rồi mới đọc `combat()`. */
			cast: (i: number, x: number, y: number) => this.combat.cast(i, { x, y }),
			action: () => {
				const a = this.combat.action;
				return a ? { skill: a.skill.id, t: a.t, releaseAt: a.timing.releaseAt, dur: a.timing.dur, released: a.released } : null;
			},
			talk: (key: string) => this.story.talk(key),
			/**
			 * Mở mã cốt truyện để thử (vd `unlock('earth')` = mở nhánh Thổ trước khi có nhiệm vụ tuổi 16). Chỉ có ở dev — người
			 * chơi thật nhận mã qua nhiệm vụ.
			 */
			unlock: (id: string) => {
				if (!this.story.grantUnlock(id)) return false;
				this.syncGear();
				this.announceUnlock(id);
				this.persist();
				return true;
			},
			/** Trang bị đang mặc + túi (bản sao) và tổng chỉ số cộng — kiểm kho đồ không cần mở bảng. */
			gear: () => ({ ...structuredClone(this.story.gear), bonus: { ...this.gearStats } }),
			/** Trao đồ như phần thưởng (`giveItem('sword', 1, true)`); trả số món còn dư (đã để dưới đất). */
			giveItem: (id: string, n = 1, autoEquip = false) => this.grantItem(id, n, { autoEquip }),
			/** Như bấm nút trên kho đồ: `equip(uid, 'off')` / `unequip('main')` — cùng đường request với UI. */
			equip: (uid: string, slot?: EquipSlotId) => useGameStore.getState().request('equip', { uid, ...(slot ? { equipSlot: slot } : {}) }),
			unequip: (slot: EquipSlotId) => useGameStore.getState().request('unequip', { equipSlot: slot }),
			/**
			 * Thử kỹ năng mốc cao KHÔNG đụng bản lưu: chỉ đặt mốc trong CombatSystem (vd `tryTiers({ fire: 9, ice: 9 })` rồi
			 * `cast(index, x, y)`). Lưu phái Kiếm: tham số thứ hai (`tryTiers({ sword: 9 }, 'thuy_than')` — mốc 6–9 của lưu phái:
			 * `skillIndex('whirlpool')`…). Mọi nhánh trần mốc 9 (GĐ3). Lần đồng bộ tiềm năng kế
			 * tiếp (cộng/tẩy điểm, đổi map tuổi) trả về mốc thật.
			 */
			tryTiers: (tiers: Tiers, style: SwordStyle | null = this.story.swordStyle) => this.combat.setTalents({ ...this.story.talentTiers(), ...tiers }, style),
			/** Chỉ số trong `HERO_SKILLS` của một kỹ năng (để `cast(skillIndex('shadow_step'), x, y)`). */
			skillIndex: (id: string) => HERO_SKILLS.findIndex((s) => s.id === id),
			/** Cộng EXP để thử cộng mốc (dev). */
			grantExp: (n: number) => {
				this.combat.grantExp(n);
				this.persist();
			},
			/** Như bấm ô nhiệm vụ (mặc định luôn bắt đầu; 'toggle' = đang đi thì dừng). */
			autoWalk: (mode: 'toggle' | 'start' = 'start') => this.onAutoWalkRequest(mode),
			autoWalkState: () => {
				const w = this.autoWalk;
				return w ? { label: w.target.label, target: { x: Math.round(w.target.x), y: Math.round(w.target.y) }, stop: w.target.stop, partial: w.partial, path: w.path.map((q) => ({ x: Math.round(q.x), y: Math.round(q.y) })) } : null;
			},
			questTarget: () => ({ target: this.story.questTarget(), goal: this.questGoal() }),
			/** Giả lập ngón tay trên cần gạt (x, y trong −1..1; 0,0 = nhấc tay). */
			stick: (x: number, y: number) => {
				setVirtualAxis(x, y);
				virtualInput.stickActive = x !== 0 || y !== 0;
			},
			interact: () => this.interact(),
			npcs: () => this.npcs.map((n) => ({ key: n.key, x: n.x, y: n.y, sprite: n.actor?.id ?? null })),
			remotes: () => [...this.remotes.values()].map((r) => ({ name: r.view.name, x: Math.round(r.actor?.x ?? -1), y: Math.round(r.actor?.y ?? -1), sprite: r.actor?.id ?? null, anim: r.view.anim })),
			pickups: () => this.pickups.map((p) => ({ item: p.item, x: p.x, y: p.y })),
			story: () => ({ ...this.story.state, quest: this.story.quest?.id }),
			ui: () => {
				const s = useGameStore.getState();
				return { scene: s.scene, dialogue: s.dialogue ? `${s.dialogue.index + 1}/${s.dialogue.lines.length}` : null, card: s.card?.title ?? null, beats: s.beats.length, shownAge: this.shownAge, hp: Math.round(this.combat.pc.hp) };
			},
			/** Đẩy vòng lặp đi `frames` frame 60Hz — kiểm thử được cả khi tab ẩn (rAF bị dừng). */
			step: (frames = 60) => {
				// Đồng hồ đơn điệu: lấy lại performance.now() mỗi lần gọi thì `step(1)` gọi liên tiếp có khung lùi sau `lastTime`
				// của ticker (lần trước đã đẩy nó lên +16,7ms) → bị bỏ, cả loạt chỉ tiến theo thời gian thật (~0).
				let t = Math.max(performance.now(), this.app.ticker.lastTime);
				for (let i = 0; i < frames; i += 1) {
					t += 1000 / 60;
					this.app.ticker.update(t);
				}
			},
		};
	}

	/** Gọi được nhiều lần, kể cả khi init còn dở (abort từ GameCanvas) hoặc init vừa lỗi. */
	destroy(): void {
		if (this.destroyed) return;
		// Chỉ lưu khi init đã xong: bản dựng dở chưa đọc save, ghi ra là đè mất tiến độ thật.
		if (Game.live.delete(this)) this.persist();
		this.destroyed = true;
		this.unsubscribe?.();
		this.resizeObserver?.disconnect();
		this.keyboard?.destroy();
		// Chỉ gỡ handler do CHÍNH bản này gắn: StrictMode dựng 2 bản, bản bị huỷ có thể huỷ SAU khi bản thật đã gắn.
		if (this.online && this.wired) this.online.handlers = {};
		this.remotes.clear();
		this.world?.ground.destroy();
		this.app?.destroy(true, { children: true });
	}
}

/** Hệ số hiển thị: 2 chữ số là đủ đọc, và giữ JSON so sánh ổn định giữa các lần ghi store. */
function round2(n: number): number {
	return Math.round(n * 100) / 100;
}

/** Chỉ ở dev: QA điều khiển game từ console — `__aether.teleport(x, y)`, `__aether.player()`. */
function installDevHook(): void {
	const w = window as unknown as { __aether?: unknown };
	if (w.__aether) return;
	w.__aether = new Proxy(
		{},
		{
			get: (_t, key: string) => {
				const api = Game.current?.debug() as Record<string, unknown> | undefined;
				return api?.[key];
			},
		},
	);
}

import type { CodexEntry } from '@/game/codex';
import { create } from 'zustand';
import type { EquipKind, EquipSlotId, ItemDef, Rarity, StatBasis, StatKey } from '@/game/equipment';
import type { FigureGearView } from '@/game/gearLayers';

export type GameStatus = 'booting' | 'loading' | 'ready' | 'error';

export interface PlayerStats {
	name: string;
	level: number;
	exp: number;
	expNext: number;
	hp: number;
	hpMax: number;
	mp: number;
	mpMax: number;
	stamina: number;
	staminaMax: number;
	coins: number;
	potions: number;
	/** Sức đánh kiếm = ATK × hệ số kiếm của con đường (chưa nhân bậc/chuyên tinh của từng kỹ năng). */
	attack: number;
	/** Phép thuật = ATK × hệ số phép của con đường. */
	magic: number;
	defense: number;
	/** Tỉ lệ chí mạng 0..1 và hệ số sát thương chí mạng. */
	critChance: number;
	critMult: number;
	/** Tỉ lệ né hoàn toàn một đòn 0..1 (Bóng Mờ — Bắc Thần 9; 0 = chưa có). */
	evade: number;
	/** Bất Khuất (Kiếm Thần 9) đang bật — dưới 30% máu: `attack`/`magic` đã gồm công +20%. */
	rage: boolean;
	/** Thể lực mỗi lần né (25; Nhẹ Như Gió của Bắc Thần giảm). */
	dodgeStamina: number;
	/** Tên con đường đã chọn năm 16 tuổi ('Kiếm sĩ' / 'Pháp sư'), '' khi chưa chọn. */
	path: string;
	age: number;
	/** Chỉ số cộng phẳng của đồ đang mặc (toàn 0 khi chỉ có đồ khởi đầu). */
	gear: Partial<Record<StatKey, number>>;
	/** Cách đổi phần cộng phẳng ra số trên bảng (`equipment.shownStat`) — "+N trang bị" và so sánh "27 → 33". */
	gearBasis: StatBasis;
}

/** Nguyên tố của kỹ năng (khớp `Element` ở game/combat/skills.ts). */
export type ElementId = 'aether' | 'fire' | 'water' | 'wind' | 'healing' | 'steel' | 'ice' | 'earth';

/** Nhánh của cây Nguyên tố (khớp `Branch` ở game/combat/talents.ts). */
export type BranchId = 'sword' | 'fire' | 'water' | 'wind' | 'ice' | 'earth';
/** Nguyên tố phủ lên kiếm được (khớp `EnchantId`). */
export type EnchantId = Exclude<BranchId, 'sword'>;
/** Nhánh của một kỹ năng trên thanh: nhánh cây, hoặc 'aether' (Tia Aether — bẩm sinh, ngoài cây). */
export type SchoolId = BranchId | 'aether';
/** Lưu phái Kiếm (khớp `SwordStyle` ở game/combat/talents.ts). */
export type SwordStyleId = 'kiem_than' | 'thuy_than' | 'bac_than';

/** Một ô trên thanh kỹ năng (chỉ các ô ĐÃ GÁN, theo thứ tự ô). */
export interface SkillSlot {
	id: string;
	/** Nhãn phím của ô ('J', 'K', '1'…'8') và mã phím (`KeyJ`, `Digit1`…) — nút cảm ứng bấm mã này. */
	key: string;
	code: string;
	/** Chỉ số ô 0..9. */
	slot: number;
	name: string;
	element: ElementId;
	mpCost: number;
	/** Hồi chiêu thật (đã trừ bị động). */
	cooldown: number;
	/** performance.now() lúc kỹ năng dùng lại được. */
	readyAt: number;
	locked: boolean;
	school: SchoolId;
	/** Mốc hiện tại của nhánh / mốc tối đa (Tia Aether: 0/0 — không thuộc cây). */
	rank: number;
	maxRank: number;
	/** Hệ số sức mạnh đang áp cho kỹ năng (thưởng chiều sâu của nhánh; Aether theo cấp). */
	scale: number;
}

/** Một mốc trên cây. */
export interface TalentNodeView {
	tier: number;
	kind: 'active' | 'passive';
	name: string;
	desc: string;
	/** Kỹ năng học ở mốc này (icon riêng). */
	skillId?: string;
	/** false = "Sắp có". */
	ready: boolean;
	/** Đã đạt mốc này. */
	reached: boolean;
	/** Giá lên mốc này từ mốc trước (mốc 1 = 0, miễn phí khi mở nhánh). */
	cost: number;
}

/** Một nhánh trên bảng Tiềm năng. */
export interface TalentBranchView {
	branch: BranchId;
	/** 'Kiếm', 'Hoả', 'Thuỷ'… */
	name: string;
	/** Đã mở (cốt truyện trao, không bị khoá cứng). */
	unlocked: boolean;
	/** Lý do khi chưa mở ("Mở theo cốt truyện", "Mở ở cốt truyện tuổi 16 — sắp có"). */
	lockNote: string;
	tier: number;
	maxTier: number;
	/** Mốc cao nhất đã hiện thực — không cộng vượt quá. */
	cap: number;
	/** Thưởng chiều sâu hiện tại (%). */
	bonusPct: number;
	/** Giá mốc kế tiếp; null = không lên được nữa (chưa mở / chạm trần). */
	nextCost: number | null;
	/** Icon nhánh = kỹ năng mốc 1 (icon tạm theo `tempArt.TEMP_ART` nếu chưa có hình PixelLab riêng). */
	iconSkill: string | null;
	/** Mốc 1–10 (Kiếm đã chọn lưu phái: mốc 3–10 của lưu phái đó). */
	nodes: TalentNodeView[];
	/** Chỉ nhánh Kiếm: lưu phái đang theo (null = chưa chọn), mốc chọn lưu phái, và cả ba lưu phái (mốc 3–10). */
	style?: SwordStyleId | null;
	styleTier?: number;
	styles?: SwordStyleView[];
}

/** Một lưu phái Kiếm trên bảng Tiềm năng. */
export interface SwordStyleView {
	id: SwordStyleId;
	/** "Kiếm Thần"… */
	name: string;
	/** Lối chơi một câu + phủ phép hợp. */
	play: string;
	enchants: string;
	chosen: boolean;
	/** Icon = kỹ năng mốc 3 của lưu phái. */
	iconSkill: string | null;
	nodes: TalentNodeView[];
}

/** Một kiếm pháp nguyên tố (Kiếm ≥ 5 + nguyên tố ≥ 5). */
export interface SwordArtView {
	skillId: string;
	name: string;
	desc: string;
	element: EnchantId;
	/** Tên nhánh nguyên tố ("Hoả"). */
	elementName: string;
	/** "Kiếm mốc 5 + Hoả mốc 5". */
	need: string;
	swordOk: boolean;
	elementOk: boolean;
	learned: boolean;
}

export interface EnchantView {
	/** Phủ phép đang có tác dụng. */
	current: EnchantId | null;
	/** Giây còn lại tới lúc đổi được. */
	cooldown: number;
	/** `desc`: phủ làm gì ở mốc nguyên tố hiện tại (`talents.enchantDesc`). */
	options: { id: EnchantId; name: string; ok: boolean; need: string; desc: string }[];
}

export interface TalentsView {
	/** Tổng điểm có tới cấp hiện tại / đã cộng / còn lại. */
	points: number;
	spent: number;
	unspent: number;
	buildKind: 'none' | 'focused' | 'hybrid' | 'spread';
	/** "Thuần Băng", "Kiếm – Phong", "Đa hệ"… */
	buildLabel: string;
	/** Một câu tóm thưởng đang có ("Băng mốc 4 (+12%)…"). */
	buildDetail: string;
	branches: TalentBranchView[];
	/** Tiền (xu) để tẩy điểm; 0 = miễn phí. */
	resetCost: number;
	enchant: EnchantView;
	/** Thanh 10 ô (J, K, 1–8) — id kỹ năng hoặc null. */
	loadout: { slot: number; key: string; skillId: string | null }[];
	/** Kiếm pháp nguyên tố (khu riêng trên bảng: điều kiện + đã học). */
	arts: SwordArtView[];
	/** Kỹ năng đã học, gán được vào ô (thứ tự `HERO_SKILLS`). */
	learned: { id: string; name: string; element: ElementId }[];
}

export interface InventoryItem {
	id: string;
	/** Mã riêng của món trong túi / trên người (`request('equip', { uid })`). Chồng ảo (bình mật ong) dùng 'potion'. */
	uid: string;
	name: string;
	/** Mô tả ngắn hiện khi chọn món. */
	desc: string;
	/** Ảnh PixelLab (đường dẫn tuyệt đối) ở cỡ gốc `w`×`h` — hiện đúng 1×. Ảnh lỗi / rỗng (vật phẩm lạ) thì ô trống + tên. */
	icon: string;
	w: number;
	h: number;
	count: number;
	kind: ItemDef['kind'];
	/** Có nút "Dùng" (vd bình mật ong). */
	usable?: boolean;
	equipKind?: EquipKind;
	/** Chỉ số (gốc + roll) của món — so sánh trên thẻ. */
	stats?: Partial<Record<StatKey, number>>;
	rarity?: Rarity;
	levelReq?: number;
	/** Kỷ vật: không bán, không vứt. */
	bound?: boolean;
	/** "Mở đòn Trảm (J)". */
	effect?: string;
	/** Ô đang mặc (null = trong túi). */
	equippedAt?: EquipSlotId | null;
}

/** Một ô trên búp bê kho đồ (10 ô, thứ tự `EQUIP_SLOTS`). */
export interface EquipSlotView {
	slot: EquipSlotId;
	/** "Vũ khí chính"… */
	name: string;
	item: InventoryItem | null;
}

/** Hình nhân vật giữa kho đồ: atlas sprite đang dùng + các khung `idle_S` (toạ độ trong atlas). */
export interface PlayerSpriteView {
	sheet: string;
	frames: { x: number; y: number; w: number; h: number }[];
	/** Lớp đồ gắn trên khung đứng nhìn trước (toạ độ khung) — `gearLayers.figureGear`. */
	gear?: FigureGearView[];
}

/**
 * Bảng đang mở (dừng điều khiển nhân vật như lúc đọc thoại). Chỉ một bảng một lúc, và không cùng lúc với bản đồ lớn.
 * Ngoài Hành trang (`ServiceWindow`): `glory` (bấm E ở Bia Danh Vọng), `shop` (bấm E ở Bram), `calendar` (icon lịch trên HUD).
 */
export type PanelId = 'character' | 'talents' | 'inventory' | 'codex' | 'friends' | 'settings' | 'glory' | 'shop' | 'calendar';

/**
 * Yêu cầu từ giao diện xuống game: mỗi lần tăng `seq`, Game nghe và thực hiện.
 * `talent_add`: lên 1 mốc ở `branch` (Kiếm lên mốc 3 lần đầu kèm `style` = lưu phái chọn) · `set_slot`: gán `skillId`
 * (null = bỏ trống) vào ô `slot` · `set_enchant`: chọn phủ phép `enchant` (null = tắt) · `equip` / `unequip`: mặc / tháo đồ
 * (UI không tự sửa state — Game kiểm, lưu rồi đẩy `inventory` + `equipment` + `stats` lại).
 */
export interface GameRequest {
	seq: number;
	kind: 'talent_add' | 'talent_reset' | 'use_potion' | 'set_slot' | 'set_enchant' | 'equip' | 'unequip';
	branch?: BranchId;
	style?: SwordStyleId;
	/**
	 * `talent_add` (tuỳ chọn): mốc ĐÍCH mà nút Học đang hiện. Mốc hiện tại + 1 khác số này thì Game bỏ qua — chống cú bấm
	 * thứ hai của một lần nhấp đúp mua lố mốc kế. Thiếu = học mốc kế như cũ.
	 */
	tier?: number;
	/** Ô KỸ NĂNG 0..9 của `set_slot` — ô trang bị dùng `equipSlot`, không dùng lại trường này. */
	slot?: number;
	skillId?: string | null;
	enchant?: EnchantId | null;
	/** `equip`: món trong túi (`uid`) mặc vào `equipSlot` (thiếu = ô hợp đầu tiên) · `unequip`: tháo ô `equipSlot` về túi. */
	uid?: string;
	equipSlot?: EquipSlotId;
	/** Dành cho mua / bán / vứt về sau. */
	itemId?: string;
}

export interface DialogueLine {
	speaker: string;
	/** Khoá sprite để dựng chân dung; null = không có chân dung (độc thoại, người dẫn truyện). */
	portrait: string | null;
	text: string;
	/** 'inner' = độc thoại nội tâm, hiển thị nghiêng. */
	style?: 'speech' | 'inner' | 'narrator';
}

export interface DialogueState {
	lines: DialogueLine[];
	index: number;
}

/** Một nhịp truyện trong hàng đợi: đoạn thoại hoặc thẻ chuyển cảnh toàn màn hình. */
/** `onShow` của thẻ chạy đúng lúc thẻ hiện lên (không phải lúc xếp hàng) — vd đổi mốc tuổi sau khi thoại cũ đã xong. */
/** `choices`: thẻ bắt CHỌN mới đi tiếp (ngã rẽ 16 tuổi) — `onChoose` nhận id lựa chọn. */
export interface CardChoice {
	id: string;
	label: string;
	detail: string;
}

export type StoryBeat =
	| { kind: 'dialogue'; lines: DialogueLine[] }
	| { kind: 'card'; title: string; lines: string[]; onShow?: () => void; choices?: CardChoice[]; onChoose?: (id: string) => void };

export interface QuestView {
	id: string;
	title: string;
	objective: string;
	done: boolean;
}

export type ToastTone = 'info' | 'exp' | 'loot' | 'level' | 'warn';

/** Ảnh toàn cảnh vùng (sinh từ dữ liệu map bởi pipeline) + thứ cố định để vẽ minimap / bản đồ lớn. */
export interface MapInfo {
	url: string;
	imgW: number;
	imgH: number;
	/** px ảnh / px thế giới (1/8). */
	scale: number;
	worldW: number;
	worldH: number;
	areas: { name: string; x: number; y: number }[];
	landmarks: { id: string; name: string; x: number; y: number }[];
}

export interface MapMarkers {
	/** Chỗ làm nhiệm vụ đang hiện (null: không có chỗ để tự đi tới). `r`: bán kính vùng (vùng quái, địa điểm). */
	quest: { x: number; y: number; r?: number; label: string } | null;
	npcs: { key: string; name: string; x: number; y: number }[];
	remotes: { name: string; x: number; y: number }[];
}

export interface AutoWalkView {
	label: string;
	/** Các điểm còn phải đi qua (đã kéo thẳng, chỉ vài điểm). */
	path: { x: number; y: number }[];
	target: { x: number; y: number };
}

interface GameState {
	status: GameStatus;
	error: string | null;
	fps: number;
	zoom: number;
	direction: string;
	animation: string;
	position: { x: number; y: number };
	entityCount: number;
	area: string;
	areaChangedAt: number;
	playerId: string;
	players: { id: string; name: string }[];
	stats: PlayerStats;
	skills: SkillSlot[];
	dialogue: DialogueState | null;
	card: { title: string; lines: string[]; choices?: CardChoice[]; onChoose?: (id: string) => void } | null;
	beats: StoryBeat[];
	quests: QuestView[];
	boss: { name: string; hp: number; hpMax: number } | null;
	toasts: { id: number; text: string; tone: ToastTone }[];
	scene: 'intro' | 'play' | 'chapter-end';
	interactHint: string | null;
	playerPortrait: string;
	/** id sprite → ảnh chân dung khung thoại (đường dẫn tuyệt đối). */
	portraits: Record<string, string>;
	/** Mức HUD theo tuổi: 3 tuổi chỉ còn nhiệm vụ, 5 tuổi thêm MP + phép, 7 tuổi đủ cả. */
	hud: 'minimal' | 'magic' | 'full';
	mapInfo: MapInfo | null;
	mapMarkers: MapMarkers;
	/** Đang tự đi tới chỗ làm nhiệm vụ. */
	autoWalk: AutoWalkView | null;
	/** Mỗi lần UI xin tự đi thì tăng `seq` — Game nghe thay đổi này. `start`: luôn bắt đầu; `toggle`: đang đi thì dừng. */
	autoWalkRequest: { seq: number; mode: 'toggle' | 'start' };
	requestAutoWalk: (mode?: 'toggle' | 'start') => void;
	/** Thư viện (sổ quái / boss / nhân vật — `game/codex.ts`): danh mục + tiến độ (đã gặp, đã hạ). */
	codex: { entries: CodexEntry[]; seen: string[]; kills: Record<string, number>; region: string };
	/** Tên hiển thị của map theo mã máy chủ `<vùng>/<map>` (bảng Bạn bè hiện bạn đang ở đâu). */
	mapNames: Record<string, string>;
	/** Bản đồ lớn đang mở (không dừng game). */
	mapOpen: boolean;
	setMapOpen: (open: boolean) => void;
	/** Bảng nhân vật / tiềm năng / kho đồ đang mở (null = không). Mở bảng thì đóng bản đồ và ngược lại. */
	panel: PanelId | null;
	setPanel: (panel: PanelId | null) => void;
	talents: TalentsView;
	/** Túi đồ (kể cả chồng ảo bình mật ong); đồ đang mặc nằm ở `equipment`. */
	inventory: InventoryItem[];
	equipment: EquipSlotView[];
	/** Atlas + khung của sprite người chơi đang dùng (null = chưa nạp). Đổi khi lớn lên / đổi giới tính. */
	playerSprite: PlayerSpriteView | null;
	gameRequest: GameRequest;
	request: (kind: GameRequest['kind'], payload?: Omit<GameRequest, 'seq' | 'kind'>) => void;
	setZoom: (zoom: number) => void;
	setPlayer: (id: string) => void;
	advanceDialogue: () => void;
	/** Xếp nhịp truyện vào hàng đợi; nhịp đầu tiên hiện ngay nếu đang trống. */
	pushBeat: (beat: StoryBeat) => void;
	/** Gọi khi một nhịp (thoại/thẻ) kết thúc → hiện nhịp kế tiếp. */
	nextBeat: () => void;
	toast: (text: string, tone?: ToastTone) => void;
	setScene: (scene: GameState['scene']) => void;
}

let toastId = 0;

/**
 * Cầu nối React HUD ↔ vòng lặp game. Game ghi bằng `useGameStore.setState` (có tiết lưu), không
 * ghi mỗi frame — re-render React 60 lần/giây là thứ phá FPS trước tiên.
 */
export const useGameStore = create<GameState>((set, get) => ({
	status: 'booting',
	error: null,
	fps: 0,
	zoom: 0,
	direction: 'S',
	animation: 'idle',
	position: { x: 0, y: 0 },
	entityCount: 0,
	area: '',
	areaChangedAt: 0,
	playerId: '',
	players: [],
	stats: { name: 'Lior', level: 1, exp: 0, expNext: 100, hp: 100, hpMax: 100, mp: 60, mpMax: 60, stamina: 100, staminaMax: 100, coins: 0, potions: 0, attack: 16, magic: 16, defense: 4, critChance: 0.1, critMult: 1.75, evade: 0, rage: false, dodgeStamina: 25, path: '', age: 0, gear: {}, gearBasis: { base: { atk: 0, mag: 0, def: 0, hp: 0, mp: 0, crit: 0, move: 0 }, scale: { atk: 1, mag: 1, def: 1, hp: 1, mp: 1, crit: 1, move: 1 } } },
	skills: [],
	dialogue: null,
	card: null,
	beats: [],
	quests: [],
	boss: null,
	toasts: [],
	scene: 'intro',
	interactHint: null,
	playerPortrait: '/assets/portraits/lior-child.png',
	portraits: {},
	hud: 'minimal',
	mapInfo: null,
	mapMarkers: { quest: null, npcs: [], remotes: [] },
	autoWalk: null,
	autoWalkRequest: { seq: 0, mode: 'toggle' },
	requestAutoWalk: (mode = 'toggle') => set({ autoWalkRequest: { seq: get().autoWalkRequest.seq + 1, mode } }),
	codex: { entries: [], seen: [], kills: {}, region: 'human' },
	mapNames: {},
	mapOpen: false,
	setMapOpen: (mapOpen) => set(mapOpen ? { mapOpen, panel: null } : { mapOpen }),
	panel: null,
	setPanel: (panel) => set(panel ? { panel, mapOpen: false } : { panel }),
	talents: {
		points: 0,
		spent: 0,
		unspent: 0,
		buildKind: 'none',
		buildLabel: 'Chưa có lối riêng',
		buildDetail: '',
		branches: [],
		resetCost: 0,
		enchant: { current: null, cooldown: 0, options: [] },
		loadout: [],
		arts: [],
		learned: [],
	},
	inventory: [],
	equipment: [],
	playerSprite: null,
	gameRequest: { seq: 0, kind: 'talent_add' },
	request: (kind, payload) => set({ gameRequest: { ...payload, seq: get().gameRequest.seq + 1, kind } }),
	setPlayer: (playerId) => set({ playerId }),
	setZoom: (zoom) => set({ zoom: Math.max(1, Math.min(8, Math.round(zoom))) }),
	advanceDialogue: () => {
		const d = get().dialogue;
		if (!d) return;
		if (d.index + 1 < d.lines.length) set({ dialogue: { ...d, index: d.index + 1 } });
		else get().nextBeat();
	},
	pushBeat: (beat) => {
		set({ beats: [...get().beats, beat] });
		if (!get().dialogue && !get().card) get().nextBeat();
	},
	nextBeat: () => {
		const [beat, ...rest] = get().beats;
		if (!beat) return set({ dialogue: null, card: null, beats: [] });
		set({
			beats: rest,
			dialogue: beat.kind === 'dialogue' ? { lines: beat.lines, index: 0 } : null,
			card: beat.kind === 'card' ? { title: beat.title, lines: beat.lines, choices: beat.choices, onChoose: beat.onChoose } : null,
		});
		if (beat.kind === 'card') beat.onShow?.();
	},
	toast: (text, tone = 'info') => {
		toastId += 1;
		const id = toastId;
		set({ toasts: [...get().toasts.slice(-4), { id, text, tone }] });
		setTimeout(() => set({ toasts: get().toasts.filter((t) => t.id !== id) }), 3200);
	},
	setScene: (scene) => set({ scene }),
}));

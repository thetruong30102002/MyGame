import type { ReactionId } from '../combat/CombatSystem';
import { cleanCodex, type CodexProgress } from '../codex';
import { addItem, autoSlot, cleanGear, emptyGear, ITEMS, mint, STORY_GIFTS, type EquipSlotId, type GearState } from '../equipment';
import type { Element, HeroPath } from '../combat/skills';
import {
	addTier,
	branchOpen,
	BRANCHES,
	ENCHANTS,
	pointsForLevel,
	pointsToTier,
	STYLE_TIER,
	SWORD_STYLES,
	tierCap,
	tiersFrom,
	type Branch,
	type EnchantId,
	type SwordStyle,
	type TalentSpent,
	type Tiers,
} from '../combat/talents';
import type { Line, QuestDef, QuestTarget, StoryData } from './storyTypes';

export interface SaveData {
	version: 2;
	index: number;
	accepted: boolean;
	ready: boolean;
	progress: number;
	completed: string[];
	unlocked: string[];
	age: number;
	player: { level: number; exp: number; coins: number; potions: number };
	/** Id nhiệm vụ đang ở `index` — để bản lưu vẫn đúng khi cốt truyện chèn thêm nhiệm vụ. */
	questId?: string;
	/** Con đường chọn năm 16 tuổi (mạnh kiếm yếu phép / mạnh phép yếu kiếm). */
	path?: HeroPath;
	/**
	 * Số MỐC ĐÃ MUA mỗi nhánh của cây Nguyên tố (mốc − 1; mốc suy từ đây + nhánh đã mở). Đặt ngoài `player` vì
	 * Game.persist ghi đè trọn object đó; thêm trường tuỳ chọn thay vì tăng `version` (tăng là mọi bản lưu bị bỏ).
	 * Thiếu `talentsV` = định dạng CŨ (điểm theo từng kỹ năng) → hoàn lại toàn bộ khi nạp.
	 */
	talents?: TalentSpent;
	/** Phiên bản định dạng `talents`: 2 = cây Nguyên tố (07/10/2026). */
	talentsV?: 2;
	/** Thanh 10 ô (J, K, 1–8): id kỹ năng hoặc null. Thiếu = Game dựng mặc định. */
	loadout?: (string | null)[];
	/** Phủ phép Kiếm đang chọn (null/thiếu = không phủ). */
	enchant?: EnchantId | null;
	/**
	 * Lưu phái Kiếm (chọn lần đầu lên Kiếm mốc 3; tẩy điểm thì xoá). Thiếu mà Kiếm ≥ mốc 3 = bản lưu GĐ1 (trần Kiếm mốc 4,
	 * mốc 4 = Kiếm Tâm chí mạng) → tự vào Kiếm Thần (`styleMigrated`).
	 */
	swordStyle?: SwordStyle;
	/**
	 * Túi + đồ đang mặc + bộ đếm uid. Đặt ở gốc (KHÔNG trong `player` — Game.persist ghi đè trọn object đó). Thiếu `gearV`
	 * = bản lưu trước khi có trang bị → dựng từ `unlocked` (kiếm gỗ vào ô Vũ khí chính, trượng tập vào ô Tay phụ).
	 */
	gear?: GearState;
	/** Phiên bản định dạng `gear` (08/10/2026). Thêm trường tuỳ chọn thay vì tăng `version` (tăng là mất mọi bản lưu). */
	gearV?: 1;
	/** Thư viện: mục đã gặp + số quái đã hạ theo loại (`game/codex.ts`). Thiếu = chưa gặp gì. */
	codex?: CodexProgress;
}

/** Định dạng `gear` hiện tại. */
export const GEAR_VERSION = 1;

/** Định dạng `talents` hiện tại — bản lưu khác số này là bản CŨ, phải hoàn điểm. */
export const TALENTS_VERSION = 2;

/**
 * Thứ tự nhiệm vụ của bản lưu cũ (chưa ghi `questId`) — trước khi chèn "Thanh kiếm gỗ" (06/10/2026).
 * Chỉ dùng để biết bản lưu cũ đang đứng ở nhiệm vụ nào.
 */
const LEGACY_ORDER = ['c4_silverdew', 'c4_dinner', 'c6_first_thread', 'c6_old_hat', 'c8_forest_edge', 'c8_snow', 'y1_mushrooms', 'y2_shadows', 'y3_demon'];

export interface StoryEvents {
	dialogue(lines: Line[]): void;
	/** `id`: nhiệm vụ vừa xong — chơi trực tuyến thì máy chủ trao thưởng theo id (M3.3a), không cộng số `r` ở máy này. */
	reward(r: QuestDef['reward'], title: string, id: string): void;
	questsChanged(): void;
	/** Sinh `remaining` vật phẩm nhặt (tải lại giữa chừng thì chỉ sinh phần còn thiếu). */
	pickups(item: string, spots: string[], remaining: number): void;
	/** Đã nhặt đủ: dọn các vật còn sót trên bản đồ. */
	clearPickups(item: string): void;
	awakenBoss(): void;
	spawnZone(zoneId: string): void;
	questCompleted(q: QuestDef): void;
	/** Vừa nhận quà / mở kỹ năng ngoài phần thưởng cuối nhiệm vụ (vd cha trao kiếm gỗ lúc giao việc). */
	unlocked(id: string): void;
	/** Quà là đồ mà túi đầy: `n` món chưa vào được hành trang — Game để thành vật nhặt dưới đất. */
	itemOverflow?(id: string, n: number): void;
	/** Sang mốc tuổi mới: hiện thẻ chuyển cảnh, đổi sprite người chơi, dựng lại NPC theo tuổi. */
	ageChanged(age: number, lines: string[]): void;
	chapterEnd(lines: string[]): void;
}

const SAVE_KEY = 'aether.save.v2';

/** Tổng điểm đã cộng trong định dạng cũ (`{ kỹ năng: điểm }`) — chỉ để báo người chơi đã hoàn bao nhiêu. */
function oldTalentPoints(raw: unknown): number {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return 0;
	return Object.values(raw as Record<string, unknown>).reduce<number>((a, v) => a + Math.max(0, Math.floor(Number(v) || 0)), 0);
}
const INTRO_KEY = 'aether.introSeen';

/** Nơi lưu tiến độ truyện: mặc định localStorage (chơi đơn, test); bản online thay bằng lưu lên máy chủ. */
export interface StoryStorage {
	load(): SaveData | null;
	save(data: SaveData): void;
	introSeen(): boolean;
	markIntroSeen(): void;
	/** Xoá tiến độ — chờ lưu xong rồi mới tải lại trang. */
	reset(): Promise<void>;
}

export const localStoryStorage: StoryStorage = {
	load() {
		try {
			const raw = localStorage.getItem(SAVE_KEY);
			const d = raw ? (JSON.parse(raw) as SaveData) : null;
			return d?.version === 2 ? d : null;
		} catch {
			return null;
		}
	},
	save(data) {
		try {
			localStorage.setItem(SAVE_KEY, JSON.stringify(data));
		} catch {
			/* chế độ ẩn danh / chặn storage: chơi tiếp được, chỉ không lưu */
		}
	},
	introSeen() {
		try {
			return localStorage.getItem(INTRO_KEY) === '1';
		} catch {
			return false;
		}
	},
	markIntroSeen() {
		try {
			localStorage.setItem(INTRO_KEY, '1');
		} catch {
			/* không lưu được thì lần sau xem lại lời tựa */
		}
	},
	async reset() {
		try {
			for (const k of [INTRO_KEY, SAVE_KEY, 'aether.save.v1']) localStorage.removeItem(k);
		} catch {
			/* trình duyệt chặn storage */
		}
	},
};

/**
 * Máy trạng thái cốt truyện chạy theo DỮ LIỆU (`StoryData`): nhiệm vụ nối tiếp nhau, mỗi cái có
 * người giao, mục tiêu, người nhận báo cáo, thoại trước/sau. Không biết gì về Pixi/React — game và UI
 * nghe qua `StoryEvents`. Phase 11: phát thưởng + xác nhận nhiệm vụ chuyển lên server.
 */
export class StoryDirector {
	/** Bật khi xoá tiến độ: bản Game cũ còn sống tới lúc trang tải lại, không được ghi đè bản lưu vừa xoá. */
	private static frozen = false;
	static storage: StoryStorage = localStoryStorage;
	state: SaveData;

	constructor(
		private readonly data: StoryData,
		private readonly events: StoryEvents,
	) {
		this.state = StoryDirector.load() ?? {
			version: 2,
			index: 0,
			accepted: false,
			ready: false,
			progress: 0,
			completed: [],
			unlocked: [],
			age: data.quests[0]?.age ?? 0,
			player: { level: 1, exp: 0, coins: 0, potions: 0 },
			talents: {},
			talentsV: TALENTS_VERSION,
			gear: emptyGear(),
			gearV: GEAR_VERSION,
		};
		this.migrate();
		this.state.codex = cleanCodex(this.state.codex);
	}

	/** Tiến độ Thư viện (luôn có sau constructor). */
	get codex(): CodexProgress {
		return (this.state.codex ??= { seen: [], kills: {} });
	}

	/** Đánh dấu đã gặp mục `id` của Thư viện. Trả true nếu là lần ĐẦU (để báo "Thư viện có trang mới"). */
	codexSee(id: string): boolean {
		const c = this.codex;
		if (c.seen.includes(id)) return false;
		c.seen.push(id);
		return true;
	}

	/**
	 * Bản lưu cũ khi cốt truyện đổi: tìm lại nhiệm vụ đang làm theo id (không theo số thứ tự), nhiệm vụ mới
	 * chèn vào TRƯỚC chỗ người chơi đang đứng thì coi như đã xong (không bắt chơi lùi), và bù mọi quà/kỹ năng
	 * của các nhiệm vụ đã xong — vd người đã qua 6 tuổi nhận luôn kiếm gỗ + trượng tập.
	 */
	private migrate(): void {
		const s = this.state;
		const ids = this.data.quests.map((q) => q.id);
		const current = s.questId ?? LEGACY_ORDER[s.index];
		const lastDone = Math.max(-1, ...s.completed.map((id) => ids.indexOf(id)));
		const found = current ? ids.indexOf(current) : -1;
		const index = found > lastDone ? found : lastDone + 1;
		if (index !== found) Object.assign(s, { accepted: false, ready: false, progress: 0 });
		for (const q of this.data.quests.slice(0, index)) if (!s.completed.includes(q.id)) s.completed.push(q.id);
		const fresh: string[] = [];
		for (const q of this.data.quests) {
			const grants = s.completed.includes(q.id) ? [q.reward.unlockSkill, q.onGive?.unlock] : q.id === ids[index] && s.accepted ? [q.onGive?.unlock] : [];
			for (const g of grants) {
				if (!g || s.unlocked.includes(g)) continue;
				s.unlocked.push(g);
				this.granted.push(g);
				fresh.push(g);
			}
		}
		this.migrateGear(fresh);
		s.index = index;
		s.questId = ids[index];
		if (s.talentsV !== TALENTS_VERSION) {
			// Bản lưu hệ cũ (điểm cộng vào từng kỹ năng): hoàn lại TOÀN BỘ một lần — đánh dấu phiên bản để không hoàn lặp.
			this.refunded = oldTalentPoints(s.talents);
			s.talents = {};
			s.talentsV = TALENTS_VERSION;
		} else s.talents = this.cleanTalents(s.talents, s.player?.level ?? 1);
		if (s.enchant !== undefined && s.enchant !== null && !ENCHANTS.includes(s.enchant)) s.enchant = null;
		this.migrateSwordStyle();
	}

	/**
	 * Trang bị của bản lưu. Thiếu `gearV` (hay `gear` hỏng hẳn) = bản lưu trước khi có trang bị → dựng từ `unlocked`: kiếm
	 * gỗ đã nhận vào ô Vũ khí chính, trượng tập vào ô Tay phụ — không mất đồ, không phải tự mặc lại. Có `gearV` thì chuẩn
	 * hoá (`cleanGear`), rồi trao nốt quà vừa được BÙ lúc nạp (`fresh`). Chạy lại không nhân đôi: lần sau đã có `gearV`.
	 */
	private migrateGear(fresh: string[]): void {
		const s = this.state;
		if (s.gearV !== GEAR_VERSION || !s.gear || typeof s.gear !== 'object') {
			let g = emptyGear();
			for (const [id, slot] of [['sword', 'main'], ['staff', 'off']] as const) {
				if (!this.isUnlocked(id)) continue;
				const m = mint(g, id);
				g = { ...m.g, equip: { ...m.g.equip, [slot]: m.stack } };
			}
			s.gear = g;
			s.gearV = GEAR_VERSION;
			return;
		}
		s.gear = cleanGear(s.gear);
		for (const id of fresh) {
			if (!STORY_GIFTS.includes(id)) continue;
			// Túi đầy + ô đã có đồ: mã quà đã vào `unlocked` (không bao giờ trao lại) nên KHÔNG được bỏ phần dư — giữ để Game
			// thả xuống đất khi đã có người chơi (`takeOverflow`), như quà trao lúc đang chơi.
			const r = this.giveItem(id, 1, true);
			if (r.overflow > 0) this.overflow.push({ id, n: r.overflow });
		}
	}

	/** Quà bù lúc nạp chưa vào được hành trang (túi đầy) — Game lấy MỘT lần sau khi dựng người chơi rồi thả xuống đất. */
	private overflow: { id: string; n: number }[] = [];

	takeOverflow(): { id: string; n: number }[] {
		const out = this.overflow;
		this.overflow = [];
		return out;
	}

	/** Túi + đồ đang mặc (luôn có sau `migrate`). */
	get gear(): GearState {
		return (this.state.gear ??= emptyGear());
	}

	/** Thay trang bị (Game đã kiểm bằng `equipItem` / `unequipItem`) rồi lưu ngay. */
	setGear(g: GearState): void {
		this.state.gear = g;
		this.save();
	}

	/**
	 * Cửa vào DUY NHẤT để thêm đồ vào hành trang (quà cốt truyện; về sau rơi đồ, thưởng nhiệm vụ, cửa hàng — đều qua
	 * `Game.grantItem`). `autoEquip`: đồ mặc được mà ô hợp đang trống thì mặc luôn, không thì bỏ vào túi. Không tự lưu (người
	 * gọi lưu một lần sau cả loạt). Trả ô đã mặc (null = vào túi) và số món không còn chỗ.
	 */
	giveItem(id: string, n = 1, autoEquip = false): { equipped: EquipSlotId | null; overflow: number } {
		let g = this.gear;
		const def = ITEMS[id];
		if (autoEquip && def?.kind === 'equip' && n >= 1) {
			const slot = autoSlot(def.equip, g.equip);
			if (slot && !g.equip[slot]) {
				const m = mint(g, id);
				g = { ...m.g, equip: { ...m.g.equip, [slot]: m.stack } };
				const rest = n > 1 ? addItem(g, id, n - 1) : { g, overflow: 0 };
				this.state.gear = rest.g;
				return { equipped: slot, overflow: rest.overflow };
			}
		}
		const r = addItem(g, id, n);
		this.state.gear = r.g;
		return { equipped: null, overflow: r.overflow };
	}

	/**
	 * Mở một mã cốt truyện (quà, kỹ năng). Mã là đồ tặng (kiếm gỗ, trượng tập) thì trao luôn món đồ — ô trống thì tự mặc;
	 * túi đầy thì báo `itemOverflow`. false = mã đã có từ trước (không trao lặp).
	 */
	grantUnlock(id: string): boolean {
		if (this.isUnlocked(id)) return false;
		this.state.unlocked.push(id);
		if (STORY_GIFTS.includes(id)) {
			const r = this.giveItem(id, 1, true);
			if (r.overflow > 0) this.events.itemOverflow?.(id, r.overflow);
		}
		return true;
	}

	/**
	 * Lưu phái Kiếm của bản lưu: mã lạ thì bỏ; Kiếm dưới mốc 3 thì không có lưu phái. Kiếm ≥ mốc 3 mà chưa có lưu phái =
	 * bản lưu GĐ1 (production: trần Kiếm mốc 4, mốc 4 = Kiếm Tâm +8% chí mạng) → gán Kiếm Thần (mốc 4 Mắt Tinh = đúng chí
	 * mạng cũ), Game báo một lần. Bản lưu bị lượt A kẹp về mốc 2 (chỉ ở dev) thì Kiếm < 3 — không làm gì.
	 */
	private migrateSwordStyle(): void {
		const s = this.state;
		if (s.swordStyle !== undefined && !SWORD_STYLES.includes(s.swordStyle)) delete s.swordStyle;
		const sword = this.talentTiers().sword ?? 0;
		if (sword < STYLE_TIER) {
			delete s.swordStyle;
			return;
		}
		if (!s.swordStyle) {
			s.swordStyle = 'kiem_than';
			this.styleMigrated = true;
		}
	}

	/**
	 * Số điểm vừa hoàn lại khi nạp bản lưu hệ cũ (0 = không hoàn gì). Game báo một lần rồi lưu — lần nạp sau bản lưu đã
	 * mang `talentsV` nên không hoàn nữa.
	 */
	refunded = 0;

	/** Bản lưu Kiếm mốc 3–4 chưa có lưu phái vừa được gán Kiếm Thần — Game báo một lần rồi lưu (lần sau đã có `swordStyle`). */
	styleMigrated = false;

	/**
	 * Mã cốt truyện vừa được BÙ lúc nạp (bản lưu đã qua nhiệm vụ mới chèn phía trước — vd “Sợi tơ màu đất” trao `earth`).
	 * Game báo một lần; mã đã nằm trong `unlocked` nên lần nạp sau không bù lại.
	 */
	granted: string[] = [];

	/**
	 * Kẹp mốc đã mua của bản lưu: máy chủ cất bản lưu nguyên khối không kiểm gì, nên đây là chốt chặn duy nhất.
	 * Bỏ nhánh lạ và nhánh chưa mở (trả điểm lại), mỗi nhánh không vượt mốc cao nhất đã hiện thực, tổng giá không quá số
	 * điểm của cấp hiện tại — thừa thì hạ mốc từ nhánh cuối theo thứ tự `BRANCHES`.
	 */
	private cleanTalents(raw: unknown, level: number): TalentSpent {
		const src = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
		const clean: TalentSpent = {};
		let left = pointsForLevel(level);
		for (const b of BRANCHES) {
			if (!branchOpen(b, (id) => this.isUnlocked(id))) continue;
			let tier = Math.min(tierCap(b), 1 + Math.max(0, Math.floor(Number(src[b]) || 0)));
			while (tier > 1 && pointsToTier(tier) > left) tier -= 1;
			if (tier <= 1) continue;
			clean[b] = tier - 1;
			left -= pointsToTier(tier);
		}
		return clean;
	}

	choosePath(path: HeroPath): void {
		this.state.path = path;
		this.save();
	}

	/** Mốc hiện tại của mọi nhánh (chưa mở = 0, vừa mở = 1). */
	talentTiers(): Tiers {
		return tiersFrom(this.state.talents ?? {}, (id) => this.isUnlocked(id));
	}

	/** Lưu phái Kiếm đang theo (null = chưa chọn — Kiếm dưới mốc 3). */
	get swordStyle(): SwordStyle | null {
		return this.state.swordStyle ?? null;
	}

	/**
	 * Lên 1 mốc ở nhánh: chỉ nhánh đã mở, chưa chạm trần đã hiện thực, đủ điểm ở cấp `level`. Lên được thì lưu ngay.
	 * Kiếm lên mốc 3 lần đầu PHẢI kèm lưu phái `style` (chọn một lần — đổi thì tẩy điểm); đã có lưu phái thì bỏ qua `style`.
	 */
	spendTalent(branch: Branch, level: number, style?: SwordStyle): boolean {
		if (!BRANCHES.includes(branch)) return false;
		const tiers = this.talentTiers();
		const picking = branch === 'sword' && (tiers.sword ?? 0) === STYLE_TIER - 1 && !this.state.swordStyle;
		if (picking && (!style || !SWORD_STYLES.includes(style))) return false;
		if (addTier(level, tiers, branch) === null) return false;
		const t = (this.state.talents ??= {});
		t[branch] = (t[branch] ?? 0) + 1;
		if (picking) this.state.swordStyle = style;
		this.save();
		return true;
	}

	/**
	 * Tẩy toàn bộ mốc đã mua (tiền xu do Game trừ — StoryDirector không giữ tiền). Phủ phép mất điều kiện nên tắt luôn;
	 * lưu phái Kiếm xoá (lên lại mốc 3 thì chọn lại — đây là cách duy nhất để đổi lưu phái).
	 */
	resetTalents(): void {
		this.state.talents = {};
		this.state.enchant = null;
		delete this.state.swordStyle;
		this.save();
	}

	/** Lưu thanh 10 ô (Game đã kẹp hợp lệ). */
	setLoadout(loadout: (string | null)[]): void {
		this.state.loadout = [...loadout];
		this.save();
	}

	setEnchant(e: EnchantId | null): void {
		this.state.enchant = e;
		this.save();
	}

	static load(): SaveData | null {
		return StoryDirector.storage.load();
	}

	/** Lời tựa đã xem hết chưa — tách khỏi bản lưu vì bản lưu tự động có thể ghi TRƯỚC khi xem xong. */
	static introSeen(): boolean {
		return StoryDirector.storage.introSeen();
	}

	static markIntroSeen(): void {
		if (!StoryDirector.frozen) StoryDirector.storage.markIntroSeen();
	}

	static reset(): Promise<void> {
		StoryDirector.frozen = true;
		return StoryDirector.storage.reset();
	}

	/** Vào game mới (đổi nhân vật): bỏ cờ "đang xoá" của lần trước. */
	static thaw(): void {
		StoryDirector.frozen = false;
	}

	get quest(): QuestDef | undefined {
		return this.data.quests[this.state.index];
	}

	get finished(): boolean {
		return this.state.index >= this.data.quests.length;
	}

	/** Dựng lại thế giới theo tiến độ đã lưu, và tự nhận nhiệm vụ không cần người giao. */
	restore(): void {
		const q = this.quest;
		if (q && this.state.accepted) this.applyOnGive(q);
		this.autoAccept();
		this.events.questsChanged();
	}

	/**
	 * Vừa sang map khác: dựng lại phần thế giới của nhiệm vụ đang làm (vật phẩm nhặt, vùng quái theo yêu cầu, boss).
	 * Game chỉ dựng những gì CÓ trên map đang đứng, nên phải gọi lại mỗi lần đổi map. Quà mở kỹ năng không trao lại.
	 */
	reapplyWorld(): void {
		const q = this.quest;
		if (q && this.state.accepted) this.applyOnGive(q);
	}

	npcName(key: string): string {
		return this.data.npcs[key]?.name ?? key;
	}

	questViews(): { id: string; title: string; objective: string; done: boolean }[] {
		const q = this.quest;
		if (!q) return [];
		const t = this.questTarget();
		let objective: string;
		if (t?.kind === 'npc' && t.role === 'giver') objective = `Nói chuyện với ${this.npcName(t.npc)}`;
		else if (t?.kind === 'npc' && t.role === 'turnIn') objective = `Báo lại cho ${this.npcName(t.npc)}`;
		else objective = q.objectiveText.replace('{n}', String(Math.min(this.state.progress, this.total(q)))).replace('{total}', String(this.total(q)));
		return [{ id: q.id, title: q.title, objective, done: false }];
	}

	/**
	 * Việc kế tiếp cần tới đâu — CHUNG nhánh với `questViews` (chữ trên ô nhiệm vụ và chỗ "tự đi" luôn khớp).
	 * null: không còn nhiệm vụ, hoặc đã xong và tự trả thưởng.
	 */
	questTarget(): QuestTarget | null {
		const q = this.quest;
		if (!q) return null;
		if (!this.state.accepted && q.giver) return { kind: 'npc', npc: q.giver, role: 'giver' };
		if (this.state.ready) return q.turnIn !== 'auto' ? { kind: 'npc', npc: q.turnIn, role: 'turnIn' } : null;
		const o = q.objective;
		switch (o.type) {
			case 'talk':
				return { kind: 'npc', npc: o.npc, role: 'talk' };
			case 'pickup':
				return { kind: 'pickup', item: o.item, spots: q.onGive?.pickups?.spots ?? [] };
			case 'kill':
				return { kind: 'kill', monster: o.monster, zone: q.onGive?.zone };
			case 'practice':
				return { kind: 'practice', dummy: o.dummy };
			case 'reach':
				return { kind: 'reach', spot: o.spot };
			case 'boss':
				return { kind: 'boss', id: o.id };
		}
	}

	/** Địa điểm mà nhiệm vụ "đi tới" đang chờ (Game kiểm khoảng cách mỗi frame). */
	reachTarget(): string | null {
		const q = this.quest;
		return q && this.state.accepted && !this.state.ready && q.objective.type === 'reach' ? q.objective.spot : null;
	}

	talk(npcKey: string): void {
		const q = this.quest;
		const npc = this.data.npcs[npcKey];
		if (!npc) return;
		if (q && !this.state.accepted && q.giver === npcKey) {
			this.accept(q);
			return this.save();
		}
		if (q && this.state.accepted && !this.state.ready && q.objective.type === 'talk' && q.objective.npc === npcKey) {
			this.state.ready = true;
			this.tryAutoComplete(q);
			if (q.turnIn === npcKey) this.complete(q);
			return this.save();
		}
		if (q && this.state.ready && q.turnIn === npcKey) {
			this.complete(q);
			return this.save();
		}
		if (q && this.state.accepted && q.giver === npcKey && q.progress?.length) return this.events.dialogue(q.progress);
		this.events.dialogue(npc.idle.map((text) => ({ speaker: npcKey, text })));
	}

	pickup(item: string): void {
		const q = this.quest;
		if (q?.objective.type === 'pickup' && q.objective.item === item) this.advance(q, 1);
	}

	monsterKilled(monsterId: string): void {
		const c = this.codex;
		c.kills[monsterId] = (c.kills[monsterId] ?? 0) + 1;
		if (!c.seen.includes(monsterId)) c.seen.push(monsterId);
		const q = this.quest;
		if (q?.objective.type === 'kill' && (!q.objective.monster || q.objective.monster === monsterId)) this.advance(q, 1);
	}

	practiced(element: Element, reaction: ReactionId | null = null): void {
		const q = this.quest;
		const o = q?.objective;
		if (o?.type === 'practice' && (!o.element || o.element === element) && (!o.reaction || o.reaction === reaction)) this.advance(q!, 1);
	}

	reached(spot: string): void {
		const q = this.quest;
		if (q?.objective.type === 'reach' && q.objective.spot === spot) this.advance(q, 1);
	}

	bossDefeated(id: string): void {
		const c = this.codex;
		c.kills[id] = (c.kills[id] ?? 0) + 1;
		if (!c.seen.includes(id)) c.seen.push(id);
		const q = this.quest;
		if (q?.objective.type === 'boss' && q.objective.id === id) this.advance(q, 1);
	}

	isUnlocked(skill: string): boolean {
		return this.state.unlocked.includes(skill);
	}

	save(): void {
		this.state.questId = this.quest?.id;
		if (!StoryDirector.frozen) StoryDirector.storage.save(this.state);
	}

	private total(q: QuestDef): number {
		const o = q.objective;
		return o.type === 'pickup' || o.type === 'kill' || o.type === 'practice' ? o.count : 1;
	}

	private accept(q: QuestDef): void {
		this.state.accepted = true;
		this.state.ready = false;
		this.state.progress = 0;
		if (q.before.length) this.events.dialogue(q.before);
		this.applyOnGive(q);
		this.events.questsChanged();
	}

	private applyOnGive(q: QuestDef): void {
		// Đã nhặt đủ (tải lại lúc đang đi báo cáo) thì không sinh lại vật phẩm nữa.
		if (q.onGive?.pickups && !this.state.ready) this.events.pickups(q.onGive.pickups.item, q.onGive.pickups.spots, this.total(q) - this.state.progress);
		if (q.onGive?.awakenBoss) this.events.awakenBoss();
		if (q.onGive?.zone) this.events.spawnZone(q.onGive.zone);
		const gift = q.onGive?.unlock;
		if (gift && this.grantUnlock(gift)) this.events.unlocked(gift);
	}

	private advance(q: QuestDef, by: number): void {
		if (!this.state.accepted || this.state.ready) return;
		this.state.progress += by;
		if (this.state.progress >= this.total(q)) {
			this.state.ready = true;
			if (q.objective.type === 'pickup') this.events.clearPickups(q.objective.item);
			if (q.onReady?.length) this.events.dialogue(q.onReady);
			this.tryAutoComplete(q);
		}
		this.events.questsChanged();
		this.save();
	}

	private tryAutoComplete(q: QuestDef): void {
		if (q.turnIn === 'auto') this.complete(q);
	}

	private complete(q: QuestDef): void {
		if (this.state.completed.includes(q.id)) return;
		this.state.completed.push(q.id);
		if (q.reward.unlockSkill) this.grantUnlock(q.reward.unlockSkill);
		this.events.reward(q.reward, q.title, q.id);
		if (q.after.length) this.events.dialogue(q.after);
		this.events.questCompleted(q);
		this.state.index += 1;
		this.state.accepted = false;
		this.state.ready = false;
		this.state.progress = 0;
		const next = this.quest;
		if (!next) {
			this.events.chapterEnd(this.data.ending);
		} else if (next.age !== this.state.age) {
			this.state.age = next.age;
			this.events.ageChanged(next.age, this.data.ageCards[next.age] ?? []);
		}
		this.autoAccept();
		this.events.questsChanged();
		this.save();
	}

	private autoAccept(): void {
		const q = this.quest;
		if (q && !q.giver && !this.state.accepted) this.accept(q);
	}
}

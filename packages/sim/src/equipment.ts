/**
 * Trang bị + túi đồ: THUẦN dữ liệu và hàm (không Pixi/React), test bằng `npx tsx tests/equipment.test.ts`.
 * Mọi hàm BẤT BIẾN — trả object mới, không sửa state đưa vào (UI và bản lưu cầm cùng một tham chiếu).
 * Bản lưu: `SaveData.gear` (StoryDirector) — mã ô, mã vật phẩm và tên trường đã lưu chỉ được THÊM, không đổi tên.
 */

export type EquipSlotId = 'head' | 'body' | 'hands' | 'legs' | 'feet' | 'neck' | 'main' | 'off' | 'ring1' | 'ring2';
export type EquipKind = 'head' | 'body' | 'hands' | 'legs' | 'feet' | 'neck' | 'weapon' | 'offhand' | 'ring';

/** Thứ tự = bố cục búp bê: 5 ô bên trái (theo thân người từ trên xuống) rồi 5 ô bên phải. */
export const EQUIP_SLOTS: readonly EquipSlotId[] = ['head', 'body', 'hands', 'legs', 'feet', 'neck', 'main', 'off', 'ring1', 'ring2'];

export const SLOT_KIND: Record<EquipSlotId, EquipKind> = {
	head: 'head',
	body: 'body',
	hands: 'hands',
	legs: 'legs',
	feet: 'feet',
	neck: 'neck',
	main: 'weapon',
	off: 'offhand',
	ring1: 'ring',
	ring2: 'ring',
};

export const SLOT_NAME: Record<EquipSlotId, string> = {
	head: 'Mũ',
	body: 'Áo',
	hands: 'Găng',
	legs: 'Quần',
	feet: 'Giày',
	neck: 'Dây chuyền',
	main: 'Vũ khí chính',
	off: 'Tay phụ',
	ring1: 'Nhẫn 1',
	ring2: 'Nhẫn 2',
};

/**
 * Nhãn ngắn của ô trang bị (EquipDoll in DƯỚI ô từ 09/10/2026 — không còn chữ trong lòng ô, không còn huy hiệu số góc): "Vũ khí"
 * thay "Vũ khí chính" cho vừa cột hẹp. Hai ô nhẫn KHÔNG dùng nhãn này — EquipDoll in đủ "Nhẫn 1" / "Nhẫn 2" từ `SLOT_NAME`.
 */
export const SLOT_SHORT: Record<EquipSlotId, string> = { ...SLOT_NAME, main: 'Vũ khí', ring1: 'Nhẫn', ring2: 'Nhẫn' };

/** Tên loại đồ (dòng phụ của thẻ vật phẩm). */
export const KIND_NAME: Record<EquipKind, string> = {
	head: 'Mũ',
	body: 'Áo',
	hands: 'Găng',
	legs: 'Quần',
	feet: 'Giày',
	neck: 'Dây chuyền',
	weapon: 'Vũ khí',
	offhand: 'Tay phụ',
	ring: 'Nhẫn',
};

/** Chỉ số trang bị cộng phẳng. `crit`, `move` tính theo điểm % (crit 2 = +2% chí mạng). */
export type StatKey = 'atk' | 'mag' | 'def' | 'hp' | 'mp' | 'crit' | 'move';
export const STAT_KEYS: readonly StatKey[] = ['atk', 'mag', 'def', 'hp', 'mp', 'crit', 'move'];
export const STAT_NAME: Record<StatKey, string> = { atk: 'Tấn công', mag: 'Phép thuật', def: 'Phòng thủ', hp: 'Máu tối đa', mp: 'Phép lực tối đa', crit: 'Chí mạng', move: 'Tốc chạy' };
/** Chỉ số hiện kèm dấu % trên bảng. */
export const STAT_PERCENT: ReadonlySet<StatKey> = new Set<StatKey>(['crit', 'move']);
export type Stats = Record<StatKey, number>;

export type Rarity = 'common' | 'fine' | 'rare' | 'epic' | 'legendary';
export const RARITY_NAME: Record<Rarity, string> = { common: 'Thường', fine: 'Tốt', rare: 'Hiếm', epic: 'Sử thi', legendary: 'Huyền thoại' };
/** Thứ bậc độ hiếm — chỉ số trong mảng là số gửi qua mạng (`GearView` '<id>:<bậc>'), chỉ được THÊM vào cuối. */
export const RARITY_ORDER: readonly Rarity[] = ['common', 'fine', 'rare', 'epic', 'legendary'];

export interface ItemDef {
	id: string;
	name: string;
	desc: string;
	/** Ảnh PixelLab (đường dẫn tuyệt đối) — hiện đúng 1× ở cỡ gốc `w`×`h`. */
	icon: string;
	w: number;
	h: number;
	kind: 'equip' | 'consumable' | 'currency' | 'material' | 'quest';
	equip?: EquipKind;
	stats?: Partial<Stats>;
	rarity?: Rarity;
	levelReq?: number;
	ageReq?: number;
	/** Kỷ vật: không bán, không vứt. */
	bound?: boolean;
	/** Tối đa mỗi chồng; thiếu = 1 (không chồng). */
	stack?: number;
	/** Giá mua; bán = floor(price / 4). */
	price?: number;
	/** Tác dụng một dòng ("Mở đòn Trảm (J)"). */
	effect?: string;
}

/**
 * Mọi vật phẩm. id ĐÃ LƯU chỉ được THÊM. Đồ khởi đầu có chỉ số 0 → cân bằng hiện tại không đổi khi có hệ trang bị.
 * Bình mật ong và xu KHÔNG nằm trong túi thật: HUD, phím R, tẩy điểm và máy chủ đang đọc `player.potions` / `player.coins`,
 * nên túi dựng chồng ẢO cho bình từ `player.potions`, còn xu hiện ở ví.
 */
export const ITEMS: Record<string, ItemDef> = {
	sword: {
		id: 'sword',
		name: 'Kiếm sắt của cha',
		desc: 'Thanh kiếm sắt cha rèn thay cho thanh kiếm gỗ năm nào. Lưỡi mài sáng bạc.',
		icon: '/assets/items/iron_sword.png',
		w: 49,
		h: 49,
		kind: 'equip',
		equip: 'weapon',
		rarity: 'common',
		bound: true,
		effect: 'Mở đòn Trảm (J)',
	},
	staff: {
		id: 'staff',
		name: 'Trượng gỗ của mẹ',
		desc: 'Trượng tập của mẹ hồi mười tuổi, đầu quấn sợi đồng.',
		icon: '/assets/items/starter_staff.png',
		w: 54,
		h: 54,
		kind: 'equip',
		equip: 'offhand',
		rarity: 'common',
		bound: true,
		effect: 'Mở Tia Aether (K)',
	},
	potion: {
		id: 'potion',
		name: 'Bình mật ong',
		desc: 'Mật ong nhà Ashvale. Uống hồi 50% máu (phím R).',
		icon: '/assets/ui/icon_potion.png',
		w: 35,
		h: 44,
		kind: 'consumable',
		stack: 99,
	},
	coins: {
		id: 'coins',
		name: 'Xu',
		desc: 'Tiền đồng rơi ra khi hạ quái và thưởng nhiệm vụ. Dùng để tẩy điểm tiềm năng.',
		icon: '/assets/ui/icon_coins.png',
		w: 44,
		h: 37,
		kind: 'currency',
	},
};

/** Mã cốt truyện trao KÈM một món đồ cùng id (cha trao kiếm gỗ = mở Trảm + có kiếm trong hành trang). */
export const STORY_GIFTS: readonly string[] = ['sword', 'staff'];

/** id không còn trong `ITEMS` (bản lưu của bản game mới hơn, dữ liệu đổi): GIỮ món đó, hiện tên này, không mặc được. */
export function itemDef(id: string): ItemDef {
	return ITEMS[id] ?? { id, name: 'Vật phẩm lạ', desc: 'Món đồ này không còn trong danh mục của bản game đang chạy.', icon: '', w: 0, h: 0, kind: 'material' };
}

export interface ItemStack {
	uid: string;
	id: string;
	/** Số lượng (chỉ đồ chồng được); thiếu = 1. */
	n?: number;
	/** Chỉ số ngẫu nhiên riêng của món này (về sau máy chủ roll). */
	roll?: Partial<Stats>;
}

export interface GearState {
	bag: ItemStack[];
	equip: Partial<Record<EquipSlotId, ItemStack>>;
	/** Bộ đếm sinh uid. */
	seq: number;
}

export const BAG_SIZE = 24;

/** uid của chồng ẢO bình mật ong mà `Game.inventoryView` gắn vào cuối túi (dựng từ `player.potions`) — không chiếm ô. */
export const VIRTUAL_POTION_UID = 'potion';

/**
 * Số ô túi THẬT đang dùng của danh sách túi hiển thị (bỏ chồng ảo bình mật ong) — cùng phép đếm với luật túi đầy của
 * `addItem` / `unequipItem` (`g.bag.length`), để con số "n/24 ô" không lệch với lúc bị báo "Túi đầy".
 */
export function bagUsed(items: readonly { uid?: string }[]): number {
	return items.filter((it) => it.uid !== VIRTUAL_POTION_UID).length;
}

export function zeroStats(): Stats {
	return { atk: 0, mag: 0, def: 0, hp: 0, mp: 0, crit: 0, move: 0 };
}

export function emptyGear(): GearState {
	return { bag: [], equip: {}, seq: 0 };
}

/**
 * Tạo một món mới (CHƯA bỏ vào túi). uid = 'i' + bộ đếm — KHÔNG dùng `crypto.randomUUID`: hàm đó chỉ có trong secure
 * context, mở dev từ điện thoại qua `http://192.168.x.x:3100` là hỏng; bộ đếm còn cho kết quả xác định, test được.
 */
export function mint(g: GearState, id: string, n?: number): { g: GearState; stack: ItemStack } {
	const seq = g.seq + 1;
	const stack: ItemStack = { uid: `i${seq}`, id, ...(n !== undefined && n !== 1 ? { n } : {}) };
	return { g: { ...g, seq }, stack };
}

/** Tổng chỉ số (gốc + roll) của mọi món đang mặc. id lạ không cộng gì. */
export function gearBonus(g: GearState): Stats {
	const out = zeroStats();
	for (const s of EQUIP_SLOTS) {
		const it = g.equip[s];
		if (!it) continue;
		const def = ITEMS[it.id];
		for (const k of STAT_KEYS) out[k] += (def?.stats?.[k] ?? 0) + (it.roll?.[k] ?? 0);
	}
	return out;
}

/** Chỉ số (gốc + roll) của MỘT món. */
export function stackStats(it: ItemStack | null | undefined): Stats {
	const out = zeroStats();
	if (!it) return out;
	const def = ITEMS[it.id];
	for (const k of STAT_KEYS) out[k] = (def?.stats?.[k] ?? 0) + (it.roll?.[k] ?? 0);
	return out;
}

/** Các ô nhận loại đồ này (nhẫn: cả hai ô). */
export function slotsFor(kind: EquipKind | undefined): EquipSlotId[] {
	return kind ? EQUIP_SLOTS.filter((s) => SLOT_KIND[s] === kind) : [];
}

/** Ô sẽ mặc khi không chỉ định: ô trống đầu tiên của loại đó, cả hai nhẫn đầy thì `ring1`. */
export function autoSlot(kind: EquipKind | undefined, equip: GearState['equip']): EquipSlotId | null {
	const slots = slotsFor(kind);
	return slots.find((s) => !equip[s]) ?? slots[0] ?? null;
}

/** true = mặc được; chuỗi = lý do (hiện nguyên văn ở nút / toast). */
export function canEquip(def: ItemDef, slot: EquipSlotId, level: number, age: number): true | string {
	if (def.kind !== 'equip' || !def.equip) return 'Món này không mặc được';
	if (SLOT_KIND[slot] !== def.equip) return `Không mặc vào ô ${SLOT_NAME[slot]} được`;
	if ((def.levelReq ?? 0) > level) return `Cần cấp ${def.levelReq}`;
	if ((def.ageReq ?? 0) > age) return `Cần ${def.ageReq} tuổi`;
	return true;
}

/**
 * Mặc món `uid` (đang trong túi) vào `slot` (thiếu = `autoSlot`). Ô đã có đồ thì ĐỔI CHỖ: món cũ về đúng vị trí của món
 * mới trong túi. Món đang mặc ở ô khác cùng loại (nhẫn 1 → nhẫn 2) thì đổi chỗ hai ô.
 */
export function equipItem(g: GearState, uid: string, slot: EquipSlotId | undefined, level: number, age: number): GearState | string {
	const i = g.bag.findIndex((s) => s.uid === uid);
	if (i < 0) {
		const from = EQUIP_SLOTS.find((s) => g.equip[s]?.uid === uid);
		if (!from) return 'Không tìm thấy món này trong túi';
		if (!slot || slot === from) return g;
		const it = g.equip[from]!;
		const ok = canEquip(itemDef(it.id), slot, level, age);
		if (ok !== true) return ok;
		const equip = { ...g.equip, [slot]: it };
		const other = g.equip[slot];
		if (other) equip[from] = other;
		else delete equip[from];
		return { ...g, equip };
	}
	const it = g.bag[i]!;
	const def = itemDef(it.id);
	const target = slot ?? autoSlot(def.equip, g.equip);
	if (!target) return 'Món này không mặc được';
	const ok = canEquip(def, target, level, age);
	if (ok !== true) return ok;
	const old = g.equip[target];
	const bag = [...g.bag];
	if (old) bag[i] = old;
	else bag.splice(i, 1);
	return { ...g, bag, equip: { ...g.equip, [target]: it } };
}

/** Tháo về CUỐI túi. Túi đầy thì từ chối ("Túi đầy") — state cũ giữ nguyên. */
export function unequipItem(g: GearState, slot: EquipSlotId): GearState | string {
	const it = g.equip[slot];
	if (!it) return 'Ô này đang trống';
	if (g.bag.length >= BAG_SIZE) return 'Túi đầy';
	const equip = { ...g.equip };
	delete equip[slot];
	return { ...g, bag: [...g.bag, it], equip };
}

/**
 * Phần LUẬT của một yêu cầu mặc / tháo từ kho đồ (`request('equip' | 'unequip')`, `Game.onGearRequest`) — tách thuần để
 * test được đường UI → Game. Trả state mới + câu báo; chuỗi = lý do từ chối (Game báo nguyên văn); null = không làm gì
 * (thiếu trường, mã ô lạ, hoặc không đổi gì — vd yêu cầu lặp của một cú bấm trùng mặc lại món đã mặc).
 */
export function applyGearRequest(g: GearState, r: { kind: 'equip' | 'unequip'; uid?: string; equipSlot?: string }, level: number, age: number): { g: GearState; text: string } | string | null {
	const slot = r.equipSlot as EquipSlotId | undefined;
	if (slot !== undefined && !EQUIP_SLOTS.includes(slot)) return null;
	if (r.kind === 'equip') {
		if (!r.uid) return null;
		const next = equipItem(g, r.uid, slot, level, age);
		if (typeof next === 'string') return next;
		if (next === g) return null;
		const at = EQUIP_SLOTS.find((s) => next.equip[s]?.uid === r.uid);
		const it = at ? next.equip[at] : undefined;
		return { g: next, text: it && at ? `Đã mặc ${itemDef(it.id).name} · ${SLOT_NAME[at]}` : '' };
	}
	if (!slot) return null;
	const it = g.equip[slot];
	const next = unequipItem(g, slot);
	if (typeof next === 'string') return next;
	return { g: next, text: it ? `Đã tháo ${itemDef(it.id).name} về túi` : '' };
}

/**
 * Bỏ `n` món `id` vào túi: đồ chồng được thì dồn vào chồng cũ (cùng id, không roll) tới `stack` rồi mới mở chồng mới; đồ
 * không chồng thì mỗi món một ô. Hết chỗ thì phần dư trả về `overflow` (Game để thành vật nhặt dưới đất).
 */
export function addItem(g: GearState, id: string, n = 1): { g: GearState; overflow: number } {
	const cap = Math.max(1, ITEMS[id]?.stack ?? 1);
	let left = Math.max(0, Math.floor(n));
	const bag = [...g.bag];
	if (cap > 1) {
		for (let i = 0; i < bag.length && left > 0; i += 1) {
			const s = bag[i]!;
			if (s.id !== id || s.roll) continue;
			const have = s.n ?? 1;
			const put = Math.min(left, cap - have);
			if (put <= 0) continue;
			bag[i] = { ...s, n: have + put };
			left -= put;
		}
	}
	let cur: GearState = { ...g, bag };
	while (left > 0 && cur.bag.length < BAG_SIZE) {
		const put = Math.min(left, cap);
		const m = mint(cur, id, put);
		cur = { ...m.g, bag: [...cur.bag, m.stack] };
		left -= put;
	}
	return { g: cur, overflow: left };
}

/** Một mục chồng đồ hợp lệ, hoặc null (bỏ). `n` kẹp theo `stack`; roll chỉ giữ số. */
function cleanStack(raw: unknown): ItemStack | null {
	if (!raw || typeof raw !== 'object') return null;
	const r = raw as Record<string, unknown>;
	if (typeof r.uid !== 'string' || !r.uid || typeof r.id !== 'string' || !r.id) return null;
	const out: ItemStack = { uid: r.uid, id: r.id };
	const def = ITEMS[r.id];
	const cap = def ? Math.max(1, def.stack ?? 1) : Infinity;
	const n = Math.floor(Number(r.n ?? 1));
	const kept = Math.min(cap, Number.isFinite(n) && n >= 1 ? n : 1);
	if (kept !== 1) out.n = kept;
	if (r.roll && typeof r.roll === 'object' && !Array.isArray(r.roll)) {
		const roll: Partial<Stats> = {};
		for (const k of STAT_KEYS) {
			const v = Number((r.roll as Record<string, unknown>)[k]);
			if (Number.isFinite(v) && v !== 0) roll[k] = v;
		}
		if (Object.keys(roll).length) out.roll = roll;
	}
	return out;
}

/**
 * Chuẩn hoá trang bị lúc nạp (máy chủ cất bản lưu nguyên khối không kiểm gì — đây là chốt chặn): bỏ mục hỏng (uid / id
 * không phải chuỗi), khử uid TRÙNG (giữ lần đầu, đồ đang mặc được xét trước), kẹp `n` theo `stack`, món nằm sai loại ô
 * (hay id lạ đang mặc) chuyển về túi. id lạ VẪN GIỮ — không bao giờ xoá đồ của người chơi. Túi vượt `BAG_SIZE` vẫn giữ
 * nguyên, chỉ chặn thêm đồ mới. `seq` không nhỏ hơn số lớn nhất trong các uid dạng `i<số>` (uid mới không trùng uid cũ).
 */
export function cleanGear(raw: unknown): GearState {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return emptyGear();
	const r = raw as Record<string, unknown>;
	const seen = new Set<string>();
	const equip: GearState['equip'] = {};
	const bag: ItemStack[] = [];
	const take = (v: unknown): ItemStack | null => {
		const s = cleanStack(v);
		if (!s || seen.has(s.uid)) return null;
		seen.add(s.uid);
		return s;
	};
	const rawEquip = r.equip && typeof r.equip === 'object' && !Array.isArray(r.equip) ? (r.equip as Record<string, unknown>) : {};
	const misplaced: ItemStack[] = [];
	for (const s of EQUIP_SLOTS) {
		const it = take(rawEquip[s]);
		if (!it) continue;
		const def = ITEMS[it.id];
		if (def?.kind === 'equip' && def.equip === SLOT_KIND[s]) equip[s] = it;
		else misplaced.push(it);
	}
	// Khoá ô lạ (bản game mới hơn thêm ô) → đồ về túi, không mất.
	for (const [k, v] of Object.entries(rawEquip)) {
		if ((EQUIP_SLOTS as readonly string[]).includes(k)) continue;
		const it = take(v);
		if (it) misplaced.push(it);
	}
	for (const v of Array.isArray(r.bag) ? r.bag : []) {
		const it = take(v);
		if (it) bag.push(it);
	}
	bag.push(...misplaced);
	let seq = Math.max(0, Math.floor(Number(r.seq) || 0));
	for (const uid of seen) {
		const m = /^i(\d+)$/.exec(uid);
		if (m) seq = Math.max(seq, Number(m[1]));
	}
	return { bag, equip, seq };
}

/**
 * Cách CombatSystem đổi chỉ số trang bị (cộng phẳng) ra con số trên bảng: hiện = round((base + cộng) × scale).
 * `base` là chỉ số KHÔNG có trang bị; `scale` là hệ số con đường / bị động áp SAU phần cộng phẳng.
 */
export interface StatBasis {
	base: Stats;
	scale: Stats;
}

export function shownStat(b: StatBasis, key: StatKey, flat: number): number {
	return Math.round((b.base[key] + flat) * b.scale[key]);
}

/** Một dòng so sánh trên thẻ vật phẩm: số trên bảng trước → sau khi mặc món mới (thay món cũ ở ô đích). */
export interface CompareRow {
	key: StatKey;
	before: number;
	after: number;
}

/**
 * So sánh mặc `next` thay cho `prev` (null = ô đang trống) với tổng cộng hiện tại `current`. Chỉ liệt kê chỉ số mà món
 * mới HOẶC món cũ có.
 */
export function compareGear(b: StatBasis, current: Partial<Stats>, next: ItemStack | null, prev: ItemStack | null): CompareRow[] {
	const a = stackStats(next);
	const o = stackStats(prev);
	return STAT_KEYS.filter((k) => a[k] !== 0 || o[k] !== 0).map((key) => {
		const cur = current[key] ?? 0;
		return { key, before: shownStat(b, key, cur), after: shownStat(b, key, cur - o[key] + a[key]) };
	});
}

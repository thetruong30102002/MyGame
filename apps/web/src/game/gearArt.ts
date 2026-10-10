import { MOVES } from '@aether/sim/moves';
import type { Direction, HeldAnimation, HeldArt, HeldBodyAction } from './assets/AssetManifest';

/**
 * BẢNG ẢNH ĐỒ MẶC LÊN NGƯỜI — CHỖ DUY NHẤT phải sửa khi PixelLab vẽ xong (thuần dữ liệu, test được).
 *
 * 1. Đồ GẮN (`GEAR_ART`): mỗi món 3 ảnh nhỏ — nhìn trước `S`, nhìn ngang `E` (quay mặt sang phải màn hình), nhìn sau `N`.
 *    Hướng tây lật gương ảnh `E`; chéo nam (SE/SW) dùng `S`, chéo bắc (NE/NW) dùng `N` (`gearLayers.viewFor`). Mỗi ảnh khai
 *    điểm `grip` (toạ độ pixel TRONG ảnh gốc): chỗ bàn tay nắm (vũ khí, tay phụ), mép dưới-giữa chỗ đội lên đầu (mũ), mép
 *    trên-giữa chỗ khoác lên vai (áo choàng). Code đặt `grip` trùng điểm neo tương ứng trên từng khung nhân vật.
 *    Ảnh vẽ ĐÚNG cỡ hiện trong game (1×) thì bỏ `scale`. Thiếu ảnh hướng nào thì dùng ảnh `S`.
 * 2. Vũ khí VẼ LIỀN THÂN (`held`, chủ dự án 10/10/2026 — "cầm kiếm tự gắn vào xấu"): kiếm / trượng KHÔNG dán ảnh vào tay ở bất
 *    kỳ động tác nào. PixelLab vẽ sẵn nhân vật cầm món đó: đứng / đi trên phiên bản cầm vũ khí (`idlesword`, `walkstaff`… —
 *    chọn bản theo thế cầm: `gearLayers.heldArt`), chém / niệm vốn vẽ trên phiên bản đó, động tác thân (trúng đòn, lướt, gục, đứng
 *    dậy, uống bình) có bản cầm riêng (`hitsword`, `drinkstaff`… — `heldAction`). Bản 16 tuổi cầm kiếm thép + trượng gỗ đầu pha lê
 *    xanh, bản bé cầm kiếm gỗ + trượng tập. Atlas chưa có bản cầm (máy cũ, chưa dựng, động tác chưa vẽ) thì diễn bản tay không,
 *    không lỗi.
 * 3. Bộ TRANG PHỤC (`OUTFITS`): món ÁO đang mặc → sprite nhân vật thay cho sprite gốc (mỗi bộ là một phiên bản nhân vật riêng
 *    do pipeline xuất, có đủ đi/chém/niệm). Khoá trong là sprite GỐC theo tuổi/giới tính; bộ chưa có sprite (chưa có trong
 *    manifest) thì giữ sprite gốc.
 *
 * Khung lớp dán (`views`, neo tay / đầu / vai) giữ cho mũ, áo choàng, tay phụ về sau.
 */

export type GearLayerSlot = 'head' | 'main' | 'off' | 'back';
export type GearArtView = 'S' | 'E' | 'N';

export interface GearViewArt {
	src: string;
	/** Cỡ ảnh gốc (px) — để dựng chỗ trong kho đồ trước khi ảnh tải xong. */
	w: number;
	h: number;
	/** Điểm nắm / đội / khoác, toạ độ pixel trong ảnh GỐC (trước `scale`). */
	grip: [number, number];
	/** Thu nhỏ NGUYÊN lần khi ảnh vẽ to hơn cỡ trong game (½ = lấy 1 pixel mỗi ô 2×2). Thiếu = 1. */
	scale?: 1 | 0.5;
	/** Lật ngang ảnh này (vd icon chéo cần chĩa mũi ra ngoài thân). Hướng tây lật THÊM một lần nữa. */
	flip?: boolean;
}

/** Loại vũ khí cầm tay để chọn thế cầm (`gearLayers.wieldedPieces`): kiếm = `melee`, gậy / trượng phép = `magic`. */
export type Wield = 'melee' | 'magic';

export interface GearArt {
	slot: GearLayerSlot;
	/**
	 * Vũ khí cầm tay: mỗi lúc chỉ cầm MỘT loại (chủ dự án 08/10/2026 — chém thì cầm kiếm, niệm phép thì cầm gậy, không cầm
	 * song song). Món không khai (khiên, mũ, áo choàng) luôn hiện.
	 */
	wield?: Wield;
	/**
	 * VẼ LIỀN THÂN: atlas người chơi có đứng / đi cầm sẵn món này (`idle` / `walk` + hậu tố, vd `idlesword`) — không bao giờ vẽ
	 * lớp dán (`views` bỏ trống). Vũ khí khác cùng loại về sau mà chưa có bản vẽ riêng thì khai `views` (lớp dán) thay vì `held`.
	 */
	held?: HeldArt;
	views: Partial<Record<GearArtView, GearViewArt>>;
	/** Đang mượn hình tạm (icon) — báo trong bàn giao, thay khi có art. */
	temp?: boolean;
}

export const GEAR_ART: Record<string, GearArt> = {
	// Kiếm gỗ của cha (ô vũ khí): bản bé cầm kiếm gỗ, bản 16 tuổi cầm kiếm thép — PixelLab vẽ liền tay (phiên bản Sword).
	sword: { slot: 'main', wield: 'melee', held: 'sword', views: {} },
	// Trượng gỗ của mẹ (ô tay phụ): bản bé cầm trượng tập, bản 16 tuổi trượng gỗ đầu pha lê xanh (phiên bản Staff).
	staff: { slot: 'off', wield: 'magic', held: 'staff', views: {} },
};

/**
 * Món áo → sprite bộ trang phục, theo sprite GỐC. Ví dụ khi pipeline đã xuất bộ giáp da:
 * `leather_armor: { player_hero_adult: 'player_hero_adult_leather', player_hero_adult_f: 'player_hero_adult_f_leather' }`.
 * Chưa có bộ nào được vẽ.
 */
export const OUTFITS: Record<string, Partial<Record<string, string>>> = {};

/**
 * Động tác mà atlas đã VẼ LIỀN vũ khí trong tay: lớp vũ khí dán ngoài (món chưa có bản vẽ liền thân) ẩn trong lúc diễn, không thì
 * hai thanh kiếm chồng nhau. Mọi động tác có thế cầm (`MoveDef.wield` kiếm / trượng) vẽ trên phiên bản nhân vật CẦM SẴN vũ khí
 * (PixelLab create_character_state). Ngày 09/10 từng thử vẽ lại TAY KHÔNG (`<động tác>-hand`, giữ trong nguồn làm lưu trữ) — chủ
 * dự án 10/10/2026 bỏ hướng đó: cầm vũ khí suốt. Động tác thân (trúng đòn, gục, uống bình, lướt né) vẫn hiện lớp đồ.
 */
export const BAKED_HELD: Partial<Record<string, readonly GearLayerSlot[]>> = Object.fromEntries(
	MOVES.filter((m) => m.wield).map((m) => [m.id, ['main', 'off'] as const]),
);

/** Tên animation đứng / đi cầm vũ khí vẽ liền thân trong atlas: `heldAnimation('walk', 'staff')` = `walkstaff`. */
export function heldAnimation(base: 'idle' | 'walk', held: HeldArt): HeldAnimation {
	return `${base}${held}`;
}

/**
 * Động tác THÂN có bản vẽ trên phiên bản cầm vũ khí: mọi động tác không đổi thế cầm (`MoveDef.wield` null — trúng đòn, lướt né,
 * gục, đứng dậy, uống bình; test `held` giữ khớp `MOVES`). Atlas thiếu bản cầm thì diễn bản tay không.
 */
export const HELD_BODY_ACTIONS: readonly HeldBodyAction[] = ['hit', 'dodge', 'death', 'revive', 'drink'];

export function isHeldBodyAction(anim: string): anim is HeldBodyAction {
	return (HELD_BODY_ACTIONS as readonly string[]).includes(anim);
}

/** Tên animation động tác thân cầm vũ khí trong atlas: `heldAction('hit', 'sword')` = `hitsword`, `heldAction('revive', 'staff')` = `revivestaff`. */
export function heldAction(anim: HeldBodyAction, held: HeldArt): HeldAnimation {
	return `${anim}${held}`;
}

/** Ngược của `heldAction`: `hitsword` → `hit`; tên khác → null (phòng duyệt nhân vật coi bản cầm là động tác một lần). */
export function heldActionBase(name: string): HeldBodyAction | null {
	for (const a of HELD_BODY_ACTIONS) {
		const rest = name.startsWith(a) ? name.slice(a.length) : '';
		if (rest && Object.values(GEAR_ART).some((g) => g.held === rest)) return a;
	}
	return null;
}

/** Hướng khung hình → ảnh dùng + có lật gương không (hướng tây = lật hướng đông). */
export const VIEW_OF: Record<Direction, { view: GearArtView; mirror: boolean }> = {
	S: { view: 'S', mirror: false },
	SE: { view: 'S', mirror: false },
	E: { view: 'E', mirror: false },
	NE: { view: 'N', mirror: false },
	N: { view: 'N', mirror: false },
	NW: { view: 'N', mirror: true },
	W: { view: 'E', mirror: true },
	SW: { view: 'S', mirror: true },
};

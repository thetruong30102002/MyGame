import type { Direction } from './assets/AssetManifest';

/**
 * BẢNG ẢNH ĐỒ MẶC LÊN NGƯỜI — CHỖ DUY NHẤT phải sửa khi PixelLab vẽ xong (thuần dữ liệu, test được).
 *
 * 1. Đồ GẮN (`GEAR_ART`): mỗi món 3 ảnh nhỏ — nhìn trước `S`, nhìn ngang `E` (quay mặt sang phải màn hình), nhìn sau `N`.
 *    Hướng tây lật gương ảnh `E`; chéo nam (SE/SW) dùng `S`, chéo bắc (NE/NW) dùng `N` (`gearLayers.viewFor`). Mỗi ảnh khai
 *    điểm `grip` (toạ độ pixel TRONG ảnh gốc): chỗ bàn tay nắm (vũ khí, tay phụ), mép dưới-giữa chỗ đội lên đầu (mũ), mép
 *    trên-giữa chỗ khoác lên vai (áo choàng). Code đặt `grip` trùng điểm neo tương ứng trên từng khung nhân vật.
 *    Ảnh vẽ ĐÚNG cỡ hiện trong game (1×) thì bỏ `scale`. Thiếu ảnh hướng nào thì dùng ảnh `S`.
 * 2. Bộ TRANG PHỤC (`OUTFITS`): món ÁO đang mặc → sprite nhân vật thay cho sprite gốc (mỗi bộ là một phiên bản nhân vật riêng
 *    do pipeline xuất, có đủ đi/chém/niệm). Khoá trong là sprite GỐC theo tuổi/giới tính; bộ chưa có sprite (chưa có trong
 *    manifest) thì giữ sprite gốc.
 *
 * TẠM (luật "làm trước, có asset thì thay"): kiếm gỗ / trượng tập mượn ICON túi đồ (vẽ chéo 45°, 49–54px) thu ½ — một ảnh
 * cho cả ba hướng. Có ảnh PixelLab thì thay `views`, xoá `temp`.
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
	views: Partial<Record<GearArtView, GearViewArt>>;
	/** Đang mượn hình tạm (icon) — báo trong bàn giao, thay khi có art. */
	temp?: boolean;
}

const SWORD_ICON = { src: '/assets/items/starter_sword.png', w: 49, h: 49, grip: [12, 37] as [number, number], scale: 0.5 as const };
const STAFF_ICON = { src: '/assets/items/starter_staff.png', w: 54, h: 54, grip: [16, 37] as [number, number], scale: 0.5 as const };

export const GEAR_ART: Record<string, GearArt> = {
	// Icon kiếm chĩa mũi lên-phải. Nhìn trước: tay cầm ở bên TRÁI màn hình → lật cho mũi chĩa ra ngoài.
	sword: { slot: 'main', wield: 'melee', temp: true, views: { S: { ...SWORD_ICON, flip: true }, E: SWORD_ICON, N: SWORD_ICON } },
	// Trượng cầm tay trái: nhìn trước nằm bên PHẢI màn hình (đầu trượng chĩa ra ngoài sẵn); nhìn sau nằm bên trái → lật.
	staff: { slot: 'off', wield: 'magic', temp: true, views: { S: STAFF_ICON, E: STAFF_ICON, N: { ...STAFF_ICON, flip: true } } },
};

/**
 * Món áo → sprite bộ trang phục, theo sprite GỐC. Ví dụ khi pipeline đã xuất bộ giáp da:
 * `leather_armor: { player_hero_adult: 'player_hero_adult_leather', player_hero_adult_f: 'player_hero_adult_f_leather' }`.
 * Chưa có bộ nào được vẽ.
 */
export const OUTFITS: Record<string, Partial<Record<string, string>>> = {};

/**
 * Động tác mà atlas đã VẼ LIỀN vũ khí trong tay (attack của người lớn cầm kiếm, cast cầm trượng — xem atlas): lớp đồ
 * cầm tay ẩn trong lúc diễn, không thì hai thanh kiếm chồng nhau. Vẽ lại động tác tay không thì bỏ khỏi bảng.
 */
export const BAKED_HELD: Partial<Record<string, readonly GearLayerSlot[]>> = {
	attack: ['main', 'off'],
	cast: ['main', 'off'],
};

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

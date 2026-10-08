import { ITEMS, STORY_GIFTS, type EquipSlotId, type ItemDef } from './equipment';

/**
 * Bảng ảnh + mô tả vật phẩm cho chỗ cũ (HUD, thanh kỹ năng, bảng Nhân vật). Nguồn duy nhất là `equipment.ITEMS` — ở đây
 * chỉ dựng lại theo dạng cũ. Ảnh do PixelLab vẽ: đồ ở `public/assets/items/<file>`, biểu tượng cắt từ tấm I1
 * (`npm run assets:ui` → public/assets/ui). Ảnh lỗi thì UI để ô trống + tên — KHÔNG thay bằng emoji.
 */
export interface GiftItem {
	name: string;
	icon: string;
}

/** Đồ tân thủ cha mẹ tặng (mã cốt truyện cùng id). Nhận đồ = mở kỹ năng cùng mã: kiếm gỗ mở Trảm (J), trượng mở Tia Aether (K). */
export const GIFT_ITEMS: Record<string, GiftItem> = Object.fromEntries(
	STORY_GIFTS.flatMap((id) => {
		const d = ITEMS[id];
		return d ? [[id, { name: d.name, icon: d.icon }]] : [];
	}),
);

/** Mô tả vật phẩm (mô tả + tác dụng gộp một câu như trước). */
export const ITEM_INFO: Record<string, { name: string; desc: string; icon: string; kind: ItemDef['kind'] }> = Object.fromEntries(
	Object.values(ITEMS).map((d) => [d.id, { name: d.name, desc: d.effect ? `${d.desc} ${d.effect}.` : d.desc, icon: d.icon, kind: d.kind }]),
);

/** Biểu tượng chỉ số (bảng nhân vật) — cùng tấm I1. */
export const STAT_ICON = {
	hp: '/assets/ui/icon_hp.png',
	mp: '/assets/ui/icon_mp.png',
	attack: '/assets/ui/icon_attack.png',
	magic: '/assets/ui/icon_magic.png',
	defense: '/assets/ui/icon_defense.png',
	star: '/assets/ui/icon_star.png',
	backpack: '/assets/ui/icon_backpack.png',
} as const;

/**
 * Bóng mờ cho ô trang bị TRỐNG trên búp bê kho đồ — CHỖ DUY NHẤT phải sửa khi có art.
 * Tấm `E1_equip` (3×3: mũ, áo, quần, giày, găng, khiên, nhẫn, dây chuyền, áo choàng) đang chờ PixelLab vẽ ở
 * `packages/asset-pipeline/sources/pixellab/sheets/E1_equip.png`. Cắt ra `public/assets/ui/equip_<tên>.png` xong thì điền
 * đường dẫn vào đây; UI tự đo cỡ gốc khi ảnh tải xong và đặt đúng 1× giữa lòng ô 32×31 (ảnh to hơn thì tràn ra viền đá,
 * không thu lẻ). `null` = chưa có art → ô hiện chữ tên ô (TẠM). Hai ô nhẫn dùng chung một hình. Tấm E1 không có hình vũ
 * khí (ô Vũ khí chính giữ chữ); "khiên" làm bóng cho Tay phụ; "áo choàng" chưa có ô.
 * Ví dụ khi có file: `head: '/assets/ui/equip_head.png'`.
 */
export const SLOT_SILHOUETTE: Record<EquipSlotId, string | null> = {
	head: null,
	body: null,
	hands: null,
	legs: null,
	feet: null,
	neck: null,
	main: null,
	off: null,
	ring1: null,
	ring2: null,
};

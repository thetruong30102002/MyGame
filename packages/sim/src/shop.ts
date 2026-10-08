/**
 * Cửa hàng kim cương (K1 — docs/ke-hoach-kim-cuong.md mục 2). Danh mục + giá ở ĐÂY là nguồn duy nhất: máy chủ đọc giá của
 * chính nó (không tin giá client gửi), client đọc để hiện. Giá: chủ dự án 08/10/2026 "đắt gấp đôi lên" so với bản tạm đầu (đặt
 * theo mốc 1 kim cương / ngày điểm danh) — bình rẻ nhất = 6 ngày điểm danh.
 *
 * Bình thời hạn: thời gian đếm theo GIỜ CHƠI ONLINE (tắt game không mất). Mỗi loại một bình hiệu lực, không cộng dồn hệ số:
 * - mua bình MẠNH hơn bình đang có → thay hẳn (thời gian tính lại từ bình mới);
 * - mua bình CÙNG mức → cộng thêm thời gian (tối đa `BUFF_MAX_MS`);
 * - mua bình YẾU hơn → máy chủ từ chối (khỏi phí kim cương).
 * Trước K4 (máy chủ tính sát thương / EXP) hiệu ứng áp ở client — chỉ PvE: EXP hạ quái, sát thương lên quái, sát thương nhận từ quái.
 */
import type { BuffKind } from '@aether/protocol';

export interface ShopItem {
	id: string;
	name: string;
	desc: string;
	/** Giá kim cương. */
	price: number;
	/** `mult`: exp = hệ số EXP; dmg = hệ số sát thương lên quái; guard = hệ số sát thương nhận từ quái. */
	buff: { kind: BuffKind; mult: number; minutes: number };
}

export const SHOP: readonly ShopItem[] = [
	{ id: 'exp2_30', name: 'Bình Kinh Nghiệm ×2', desc: 'EXP hạ quái ×2 trong 30 phút chơi.', price: 6, buff: { kind: 'exp', mult: 2, minutes: 30 } },
	{ id: 'exp2_60', name: 'Bình Kinh Nghiệm ×2 (lớn)', desc: 'EXP hạ quái ×2 trong 1 giờ chơi.', price: 10, buff: { kind: 'exp', mult: 2, minutes: 60 } },
	{ id: 'exp3_30', name: 'Bình Kinh Nghiệm ×3', desc: 'EXP hạ quái ×3 trong 30 phút chơi.', price: 10, buff: { kind: 'exp', mult: 3, minutes: 30 } },
	{ id: 'exp3_60', name: 'Bình Kinh Nghiệm ×3 (lớn)', desc: 'EXP hạ quái ×3 trong 1 giờ chơi.', price: 16, buff: { kind: 'exp', mult: 3, minutes: 60 } },
	{ id: 'dmg10', name: 'Bình Cuồng Lực', desc: 'Sát thương lên quái +10% trong 30 phút chơi.', price: 6, buff: { kind: 'dmg', mult: 1.1, minutes: 30 } },
	{ id: 'dmg20', name: 'Bình Cuồng Lực (mạnh)', desc: 'Sát thương lên quái +20% trong 30 phút chơi.', price: 12, buff: { kind: 'dmg', mult: 1.2, minutes: 30 } },
	{ id: 'guard10', name: 'Bình Hộ Thân', desc: 'Sát thương nhận từ quái −10% trong 30 phút chơi.', price: 6, buff: { kind: 'guard', mult: 0.9, minutes: 30 } },
	{ id: 'guard20', name: 'Bình Hộ Thân (mạnh)', desc: 'Sát thương nhận từ quái −20% trong 30 phút chơi.', price: 12, buff: { kind: 'guard', mult: 0.8, minutes: 30 } },
];

/** Một loại bình cộng dồn thời gian tối đa 5 giờ chơi. */
export const BUFF_MAX_MS = 5 * 3600_000;

/** Nhóm trên bảng Cửa hàng. */
export const BUFF_GROUP: Readonly<Record<BuffKind, string>> = { exp: 'Bình kinh nghiệm', dmg: 'Bình chiến đấu', guard: 'Bình chiến đấu' };

/** Độ mạnh để so (guard < 1 nên lấy độ lệch khỏi 1). */
export function buffPower(mult: number): number {
	return Math.round(Math.abs(mult - 1) * 1000);
}

/** Nhãn ngắn trên HUD: "EXP ×2", "Công +10%", "Thủ −20%". */
export function buffLabel(kind: BuffKind, mult: number): string {
	if (kind === 'exp') return `EXP ×${mult}`;
	const pct = Math.round(Math.abs(mult - 1) * 100);
	return kind === 'dmg' ? `Công +${pct}%` : `Thủ −${pct}%`;
}

/** Hệ số đang áp từ danh sách bình còn hiệu lực (thiếu loại nào = 1). */
export function buffMults(list: readonly { kind: BuffKind; mult: number }[]): Record<BuffKind, number> {
	const out: Record<BuffKind, number> = { exp: 1, dmg: 1, guard: 1 };
	for (const b of list) out[b.kind] = b.mult;
	return out;
}

/** "29:41" / "1:05:00" — thời gian còn lại (giây). */
export function fmtRemaining(seconds: number): string {
	const s = Math.max(0, Math.ceil(seconds));
	const h = Math.floor(s / 3600);
	const m = Math.floor((s % 3600) / 60);
	const ss = String(s % 60).padStart(2, '0');
	return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

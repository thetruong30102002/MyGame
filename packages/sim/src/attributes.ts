/**
 * Điểm THUỘC TÍNH cộng tay (chủ dự án 11/10/2026: "thể lực, HP, MP… các điểm ấy cũng nên cộng được — mai sau phát triển thêm lối build
 * khiên, cung, phép healer"; "cây tiềm năng chỉ còn 1 cột và cộng HP, MP, dame, phép, đỡ đòn…"). Mỗi cấp trên cấp 1 cho
 * `ATTR_PER_LEVEL` điểm (khác điểm tiềm năng: không dừng ở cấp 40), mỗi thuộc tính tăng MỘT chỉ số; dồn hết vào một thuộc tính thì
 * chỉ số đó tăng theo cấp gần gấp đôi. Lớp mới sau này (khiên đỡ đòn, cung, healer) thêm thuộc tính vào `ATTRS` — mã lưu chỉ được
 * THÊM, không đổi tên.
 * Lưu ở bản lưu truyện (`story.attrs`, cùng nhóm với tiềm năng — máy chủ giữ định dạng mới hơn, `keepNewerTalents`); mọi nơi đọc
 * đều kẹp lại theo cấp (`cleanAttrs`) nên bản lưu sửa tay không vượt được. Tẩy điểm bằng kim cương (`talents.resetDiamonds`).
 * Client C# chép 1-1 (`Core/Attributes.cs`), test vector `Tests~/vectors/attributes.json`.
 */

export type AttrId = 'vit' | 'spi' | 'str' | 'int' | 'def' | 'sta';
export const ATTRS: readonly AttrId[] = ['vit', 'spi', 'str', 'int', 'def', 'sta'];

/** Số cộng mỗi điểm. `str` / `int`: phần trăm sát thương kiếm / phép (0,004 = +0,4%). Gốc theo cấp: máu +12–16, MP +4–8, phòng thủ +1. */
export const ATTR_PER_POINT: Readonly<Record<AttrId, number>> = { vit: 5, spi: 2, str: 0.004, int: 0.004, def: 0.4, sta: 2 };

export const ATTR_INFO: Readonly<Record<AttrId, { name: string; desc: string }>> = {
	vit: { name: 'Sinh lực', desc: `+${ATTR_PER_POINT.vit} máu tối đa mỗi điểm.` },
	spi: { name: 'Linh lực', desc: `+${ATTR_PER_POINT.spi} MP tối đa mỗi điểm.` },
	str: { name: 'Sức mạnh', desc: `+${String(Math.round(ATTR_PER_POINT.str * 1000) / 10).replace('.', ',')}% sát thương đòn kiếm mỗi điểm.` },
	int: { name: 'Trí tuệ', desc: `+${String(Math.round(ATTR_PER_POINT.int * 1000) / 10).replace('.', ',')}% sát thương phép mỗi điểm (cả Tia Haven).` },
	def: { name: 'Đỡ đòn', desc: `+${String(ATTR_PER_POINT.def).replace('.', ',')} phòng thủ mỗi điểm (giảm sát thương nhận).` },
	sta: { name: 'Thể lực', desc: `+${ATTR_PER_POINT.sta} thể lực tối đa mỗi điểm (Kiếm sĩ lướt né tốn thể lực).` },
};

export const ATTR_PER_LEVEL = 3;

/**
 * Điểm tiềm năng DƯ đổi sang thuộc tính (chủ dự án 11/10/2026: "dư thì là cộng vào HP và MP, thể lực, phòng thủ") — Pháp sư chỉ có MỘT
 * nhánh nguyên tố nên cấp 40 dư ~22 điểm. Chỉ đổi được khi không còn nhánh nào cộng tiếp (client kiểm), mỗi điểm = `ATTR_FROM_TALENT`
 * điểm thuộc tính, và điểm đổi ra CHỈ vào `TALENT_ATTRS` (Sức mạnh / Trí tuệ chỉ lấy từ điểm theo cấp — không đẩy sát thương lên).
 * Số điểm đã đổi lưu ở `story.attrTalent` (cùng nhóm trường tiềm năng); tẩy điểm xoá luôn.
 */
export const ATTR_FROM_TALENT = 3;
export const TALENT_ATTRS: readonly AttrId[] = ['vit', 'spi', 'def', 'sta'];

export type Attrs = Partial<Record<AttrId, number>>;

/** Điểm thuộc tính theo cấp `level` (cấp 1 = 0). */
export function levelAttrPoints(level: number): number {
	return Math.max(0, Math.floor(Number(level) || 1) - 1) * ATTR_PER_LEVEL;
}

/** Kẹp số điểm tiềm năng đã đổi: số nguyên 0…`max` (lạ / vắng = 0). */
export function cleanConverted(v: unknown, max = Infinity): number {
	const n = Math.floor(Number(v));
	return Number.isFinite(n) ? Math.max(0, Math.min(max, n)) : 0;
}

/** Tổng điểm thuộc tính: theo cấp + `converted` điểm tiềm năng đã đổi × `ATTR_FROM_TALENT`. */
export function attrPoints(level: number, converted = 0): number {
	return levelAttrPoints(level) + cleanConverted(converted) * ATTR_FROM_TALENT;
}

export function attrSpent(a: Attrs): number {
	return ATTRS.reduce((s, k) => s + Math.max(0, Math.floor(a[k] ?? 0)), 0);
}

/** Điểm đang ở thuộc tính KHÔNG nhận điểm đổi (Sức mạnh, Trí tuệ) — không được vượt điểm theo cấp. */
function levelOnlySpent(a: Attrs): number {
	return ATTRS.filter((k) => !TALENT_ATTRS.includes(k)).reduce((s, k) => s + Math.max(0, Math.floor(a[k] ?? 0)), 0);
}

/** Bớt `over` điểm từ các khoá `keys`, từ khoá CUỐI lên. */
function trim(out: Attrs, keys: readonly AttrId[], over: number): void {
	for (let i = keys.length - 1; i >= 0 && over > 0; i -= 1) {
		const k = keys[i]!;
		const cut = Math.min(out[k] ?? 0, over);
		if (cut > 0) out[k] = (out[k] ?? 0) - cut;
		if (!out[k]) delete out[k];
		over -= cut;
	}
}

/**
 * Kẹp bản lưu: số nguyên ≥ 0, bỏ khoá lạ; Sức mạnh + Trí tuệ vượt điểm theo cấp thì bớt (Trí tuệ trước); tổng vượt điểm có (bản lưu sửa
 * tay / tụt cấp) thì bớt từ thuộc tính CUỐI danh sách lên.
 */
export function cleanAttrs(raw: unknown, level: number, converted = 0): Attrs {
	const src = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
	const out: Attrs = {};
	for (const k of ATTRS) {
		const v = Math.floor(Number(src[k]));
		if (Number.isFinite(v) && v > 0) out[k] = v;
	}
	trim(out, ATTRS.filter((k) => !TALENT_ATTRS.includes(k)), levelOnlySpent(out) - levelAttrPoints(level));
	trim(out, ATTRS, attrSpent(out) - attrPoints(level, converted));
	return out;
}

/** Cộng 1 điểm vào `k` nếu còn điểm — trả bản mới, hoặc null nếu hết điểm / khoá lạ / Sức mạnh–Trí tuệ đã hết phần điểm theo cấp. */
export function addAttr(a: Attrs, k: AttrId, level: number, converted = 0): Attrs | null {
	if (!ATTRS.includes(k) || attrSpent(a) >= attrPoints(level, converted)) return null;
	if (!TALENT_ATTRS.includes(k) && levelOnlySpent(a) >= levelAttrPoints(level)) return null;
	return { ...a, [k]: Math.max(0, Math.floor(a[k] ?? 0)) + 1 };
}

/** Phần cộng thêm từ thuộc tính (đã kẹp theo cấp + điểm đã đổi). */
export function attrBonus(raw: unknown, level: number, converted = 0): { hp: number; mp: number; def: number; stamina: number; sword: number; magic: number } {
	const a = cleanAttrs(raw, level, converted);
	return {
		hp: (a.vit ?? 0) * ATTR_PER_POINT.vit,
		mp: (a.spi ?? 0) * ATTR_PER_POINT.spi,
		def: (a.def ?? 0) * ATTR_PER_POINT.def,
		stamina: (a.sta ?? 0) * ATTR_PER_POINT.sta,
		sword: 1 + (a.str ?? 0) * ATTR_PER_POINT.str,
		magic: 1 + (a.int ?? 0) * ATTR_PER_POINT.int,
	};
}

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
	int: { name: 'Trí tuệ', desc: `+${String(Math.round(ATTR_PER_POINT.int * 1000) / 10).replace('.', ',')}% sát thương phép mỗi điểm (cả Tia Aether).` },
	def: { name: 'Đỡ đòn', desc: `+${String(ATTR_PER_POINT.def).replace('.', ',')} phòng thủ mỗi điểm (giảm sát thương nhận).` },
	sta: { name: 'Thể lực', desc: `+${ATTR_PER_POINT.sta} thể lực tối đa mỗi điểm (Kiếm sĩ lướt né tốn thể lực).` },
};

export const ATTR_PER_LEVEL = 3;

export type Attrs = Partial<Record<AttrId, number>>;

/** Tổng điểm thuộc tính của cấp `level` (cấp 1 = 0). */
export function attrPoints(level: number): number {
	return Math.max(0, Math.floor(Number(level) || 1) - 1) * ATTR_PER_LEVEL;
}

export function attrSpent(a: Attrs): number {
	return ATTRS.reduce((s, k) => s + Math.max(0, Math.floor(a[k] ?? 0)), 0);
}

/**
 * Kẹp bản lưu: số nguyên ≥ 0, bỏ khoá lạ; tổng vượt điểm của cấp (bản lưu sửa tay / tụt cấp) thì bớt từ chỉ số CUỐI danh sách lên.
 */
export function cleanAttrs(raw: unknown, level: number): Attrs {
	const src = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
	const out: Attrs = {};
	for (const k of ATTRS) {
		const v = Math.floor(Number(src[k]));
		if (Number.isFinite(v) && v > 0) out[k] = v;
	}
	let over = attrSpent(out) - attrPoints(level);
	for (let i = ATTRS.length - 1; i >= 0 && over > 0; i -= 1) {
		const k = ATTRS[i]!;
		const cut = Math.min(out[k] ?? 0, over);
		if (cut > 0) out[k] = (out[k] ?? 0) - cut;
		if (!out[k]) delete out[k];
		over -= cut;
	}
	return out;
}

/** Cộng 1 điểm vào `k` nếu còn điểm — trả bản mới, hoặc null nếu hết điểm / khoá lạ. */
export function addAttr(a: Attrs, k: AttrId, level: number): Attrs | null {
	if (!ATTRS.includes(k) || attrSpent(a) >= attrPoints(level)) return null;
	return { ...a, [k]: Math.max(0, Math.floor(a[k] ?? 0)) + 1 };
}

/** Phần cộng thêm từ thuộc tính (đã kẹp theo cấp). */
export function attrBonus(raw: unknown, level: number): { hp: number; mp: number; def: number; stamina: number; sword: number; magic: number } {
	const a = cleanAttrs(raw, level);
	return {
		hp: (a.vit ?? 0) * ATTR_PER_POINT.vit,
		mp: (a.spi ?? 0) * ATTR_PER_POINT.spi,
		def: (a.def ?? 0) * ATTR_PER_POINT.def,
		stamina: (a.sta ?? 0) * ATTR_PER_POINT.sta,
		sword: 1 + (a.str ?? 0) * ATTR_PER_POINT.str,
		magic: 1 + (a.int ?? 0) * ATTR_PER_POINT.int,
	};
}

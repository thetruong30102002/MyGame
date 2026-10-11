/**
 * Kế hoạch còn phải làm — trang "Kế hoạch" của bảng Tiềm năng, CHỈ quản trị thấy (chủ dự án 11/10/2026: "thống kê cho admin 1 trang còn
 * những điều phải làm, kế hoạch chi tiết… để quan sát tiến độ cần %, bao nhiêu lượt PixelLab"). Thuần dữ liệu, xuất sang Unity bằng
 * `export-sim-data`. CẬP NHẬT sau mỗi đợt việc lớn (cùng lúc với docs): `progress` là % ước lượng của người làm, `pixellab` là số lượt
 * PixelLab CÒN cần (theo `docs/pixellab-ke-hoach-ve.md` — bảng "Tổng lượt còn cần"), 0 = việc thuần code.
 */
export interface RoadmapItem {
	id: string;
	/** 'game': tính năng / nội dung (code + dữ liệu). 'art': hình PixelLab. */
	group: 'game' | 'art';
	name: string;
	/** Một câu: còn thiếu gì. */
	detail: string;
	/** 0–100. */
	progress: number;
	/** Lượt PixelLab còn cần (ước lượng). */
	pixellab: number;
	/** Tài liệu chi tiết. */
	doc: string;
}

/** Ngày cập nhật số liệu (dd/mm/yyyy). */
export const ROADMAP_UPDATED = '11/10/2026';

export const ROADMAP: readonly RoadmapItem[] = [
	{ id: 'talents_v4', group: 'game', name: 'Tiềm năng: 1 nguyên tố + lớp + thuộc tính', detail: 'Đã chạy, kể cả đổi điểm tiềm năng dư sang Máu / MP / Thể lực / Đỡ đòn; còn: cân lại số sau khi chơi thử.', progress: 90, pixellab: 0, doc: 'ke-hoach-nguyen-to.md §9' },
	{ id: 'region1', group: 'game', name: 'Vùng 1 — 12 map', detail: 'Đợt 1 xong; đợt 2 chờ tấm nền G1 / R1 / B1 + 5 món lẻ.', progress: 80, pixellab: 0, doc: 'ke-hoach-the-gioi.md §5.2' },
	{ id: 'region2_7', group: 'game', name: 'Vùng 2–7 — 74 map', detail: 'Dựng bằng bộ dựng chung, cây riêng từng vùng, thời tiết; còn đồ vật / NPC trạm thật.', progress: 85, pixellab: 0, doc: 'ke-hoach-the-gioi.md §5.3–5.6' },
	{ id: 'story', group: 'game', name: 'Cốt truyện 7 chương + 10 vị thần', detail: 'Nhiệm vụ đủ, thần / trưởng lão đang dùng hình tạm; còn thần kỹ (bán kim cương).', progress: 70, pixellab: 0, doc: 'cot-truyen-aether.md' },
	{ id: 'ult10', group: 'game', name: 'Tuyệt kỹ mốc 10 ở game thật', detail: 'Chạy ở phòng Thử chiêu; còn điều kiện mở (Long Châu) + người khác thấy tuyệt kỹ.', progress: 40, pixellab: 0, doc: 'ke-hoach-nguyen-to.md §7 GĐ4' },
	{ id: 'gear', group: 'game', name: 'Trang bị bản lớn', detail: 'Rơi đồ, độ hiếm, nhuộm theo bậc đã có; còn bộ dáng giáp + đồ dán theo điểm neo.', progress: 50, pixellab: 0, doc: 'pixellab-ke-hoach-ve.md' },
	{ id: 'diamond', group: 'game', name: 'Kim cương: thần kỹ, skin, tẩy điểm', detail: 'Ví, điểm danh, thành tựu, quầy bình, tẩy điểm đã có; còn thần kỹ + skin.', progress: 35, pixellab: 0, doc: 'ke-hoach-kim-cuong.md' },
	{ id: 'asset_protect', group: 'game', name: 'Bảo vệ tài nguyên (dấu ẩn, IL2CPP)', detail: 'Dấu ẩn hình nhân vật + sổ đăng ký + IL2CPP cả Windows lẫn Android đã có; còn tải hàng kim cương (thần kỹ, skin) theo quyền sở hữu.', progress: 75, pixellab: 0, doc: 'ban-quyen.md' },
	{ id: 'region8_10', group: 'game', name: 'Vùng 8–10 + 3 rồng + Long Huyệt', detail: 'Mới có thiết kế; chưa dựng map / quái / boss.', progress: 5, pixellab: 0, doc: 'ke-hoach-the-gioi.md' },
	{ id: 'home', group: 'game', name: 'Nhà riêng (xây nhà, trồng cây, chăn nuôi)', detail: 'Mới có kế hoạch.', progress: 0, pixellab: 0, doc: 'ke-hoach-nha-rieng.md' },
	{ id: 'new_elements', group: 'game', name: 'Nguyên tố Mộc · Bóng tối · Ánh sáng + 2–3 vùng', detail: 'Mới ghi chú: 3 nhánh 10 mốc, phản ứng nhóm mới, vùng Rừng Cổ Thụ / Thánh Địa / Vực Ám Ma.', progress: 0, pixellab: 0, doc: 'ke-hoach-nguyen-to.md §9' },
	{ id: 'new_classes', group: 'game', name: 'Lớp mới: Cung · Khiên · Healer', detail: 'Mới ghi chú: mỗi lớp một nhánh vũ khí + một nguyên tố kích hoạt có thời gian.', progress: 0, pixellab: 0, doc: 'ke-hoach-nguyen-to.md §9' },
	{ id: 'art_r1_7', group: 'art', name: 'Hoàn thiện hình vùng 1–7', detail: 'Hiệu ứng chiêu người chơi, sửa hình quái / boss lỗi, cây + đồ vật, NPC trạm.', progress: 0, pixellab: 1645, doc: 'pixellab-ke-hoach-ve.md' },
	{ id: 'art_boss', group: 'art', name: 'Chiêu boss vùng 1–7 + vùng báo riêng', detail: 'Thêm khung 40 hình, 25 chiêu hoành tráng, vùng báo trước chiêu cho 25 boss.', progress: 0, pixellab: 1530, doc: 'pixellab-ke-hoach-ve.md — Chiêu BOSS' },
	{ id: 'art_gods', group: 'art', name: 'Mười vị thần', detail: 'Nhân vật lớn + thần kỹ + chân dung + tượng; vùng 1–7 trước (~1.155).', progress: 0, pixellab: 1650, doc: 'pixellab-ke-hoach-ve.md — Mười vị thần' },
	{ id: 'art_r8_10', group: 'art', name: 'Vùng 8–10 + 3 rồng', detail: 'Map, 15 quái, 9 boss + chiêu, 3 rồng, NPC trạm, cây + đồ vật.', progress: 0, pixellab: 2505, doc: 'pixellab-ke-hoach-ve.md' },
	{ id: 'art_gear', group: 'art', name: 'Trang bị bản lớn', detail: '3 bộ giáp × 2 giới tính, đồ dán, hào quang, icon.', progress: 0, pixellab: 915, doc: 'pixellab-ke-hoach-ve.md' },
	{ id: 'art_misc', group: 'art', name: 'Nên có + dự phòng', detail: 'Kiểu tóc, chân dung Thư viện, Thần Long, skin, đồ cốt truyện, Long Huyệt, cột dịch chuyển, vẽ lại món hỏng.', progress: 0, pixellab: 2110, doc: 'pixellab-ke-hoach-ve.md' },
	{ id: 'art_new_elements', group: 'art', name: 'Nguyên tố mới + 3 vùng (ước lượng thô)', detail: '3 nhánh hiệu ứng chiêu (~600) + 3 vùng (~2.400) — chưa lên danh sách vẽ.', progress: 0, pixellab: 3000, doc: 'ke-hoach-the-gioi.md §5.7' },
];

/** % chung của phần game (trung bình các mục 'game'). */
export function roadmapProgress(items: readonly RoadmapItem[] = ROADMAP): number {
	const g = items.filter((x) => x.group === 'game');
	return g.length ? Math.round(g.reduce((s, x) => s + x.progress, 0) / g.length) : 0;
}

/** Tổng lượt PixelLab còn cần. */
export function roadmapPixellab(items: readonly RoadmapItem[] = ROADMAP): number {
	return items.reduce((s, x) => s + x.pixellab, 0);
}

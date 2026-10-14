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
export const ROADMAP_UPDATED = '14/10/2026';

export const ROADMAP: readonly RoadmapItem[] = [
	{ id: 'talents_v4', group: 'game', name: 'Tiềm năng: 1 nguyên tố + lớp + thuộc tính', detail: 'Đã chạy, kể cả đổi điểm tiềm năng dư sang Máu / MP / Thể lực / Đỡ đòn; tẩy điểm giờ đổi được lớp Kiếm sĩ ↔ Pháp sư (13/10); còn: cân lại số sau khi chơi thử.', progress: 92, pixellab: 0, doc: 'ke-hoach-nguyen-to.md §9' },
	{ id: 'region1', group: 'game', name: 'Vùng 1 — 12 map', detail: 'Đợt 1 xong; đợt 2 chờ tấm nền G1 / R1 / B1 + 5 món lẻ.', progress: 80, pixellab: 0, doc: 'ke-hoach-the-gioi.md §5.2' },
	{ id: 'region2_7', group: 'game', name: 'Vùng 2–7 — 74 map', detail: 'Dựng bằng bộ dựng chung, cây riêng từng vùng, thời tiết, đồ vật đợt 13/10; còn NPC trạm thật + map công trình.', progress: 88, pixellab: 0, doc: 'ke-hoach-the-gioi.md §5.3–5.6' },
	{ id: 'story', group: 'game', name: 'Cốt truyện 7 chương + 10 vị thần', detail: 'Nhiệm vụ đủ, thần / trưởng lão đang dùng hình tạm; còn thần kỹ (bán kim cương).', progress: 70, pixellab: 0, doc: 'cot-truyen-aether.md' },
	{ id: 'ult10', group: 'game', name: 'Tuyệt kỹ mốc 10 ở game thật', detail: 'Chạy ở phòng Thử chiêu; còn điều kiện mở (Long Châu) + người khác thấy tuyệt kỹ.', progress: 40, pixellab: 0, doc: 'ke-hoach-nguyen-to.md §7 GĐ4' },
	{ id: 'gear', group: 'game', name: 'Trang bị bản lớn', detail: 'Rơi đồ, độ hiếm, nhuộm theo bậc đã có. Chốt 14/10: giáp / áo CHỈ hiện trong kho; VŨ KHÍ hiện đúng từng món trên tay (vẽ liền thân); ngoại hình đổi bằng skin cải trang.', progress: 80, pixellab: 0, doc: 'the-gioi-aether.md — Trang bị' },
	{ id: 'diamond', group: 'game', name: 'Kim cương: thần kỹ, skin, tẩy điểm', detail: 'Ví, điểm danh, thành tựu, quầy bình, tẩy điểm đã có; còn thần kỹ + skin.', progress: 35, pixellab: 0, doc: 'ke-hoach-kim-cuong.md' },
	{ id: 'asset_protect', group: 'game', name: 'Bảo vệ tài nguyên (dấu ẩn, IL2CPP)', detail: 'Dấu ẩn hình nhân vật + sổ đăng ký + IL2CPP cả Windows lẫn Android đã có; còn tải hàng kim cương (thần kỹ, skin) theo quyền sở hữu.', progress: 75, pixellab: 0, doc: 'ban-quyen.md' },
	{ id: 'landing', group: 'game', name: 'Trang chủ game (tin tức + tải game)', detail: 'https://admin.tail024813.ts.net/game/ — tin tức theo nhãn, nút tải PC / zip / APK kèm số bản + dung lượng, trạng thái máy chủ, hướng dẫn cài (13/10). Tin mới: sửa apps/server/site/news.json.', progress: 100, pixellab: 0, doc: 'README.md' },
	{ id: 'beta_feedback', group: 'game', name: 'Bản beta: thông báo + góp ý', detail: 'Thông báo beta ở màn đăng nhập, Cài đặt → Góp ý gửi lên máy chủ, QTV đọc ở cùng tab.', progress: 100, pixellab: 0, doc: 'UnityGame/Assets/Aether/Client/UI/UI.md' },
	{ id: 'region8_10', group: 'game', name: 'Vùng 8–10 + 3 rồng + Long Huyệt', detail: 'Lịch 14/10: sau 4 vùng nguyên tố, mỗi ngày dựng 1 vùng (ngày 7–9) bằng hình mượn + tô màu TẠM, ngày 10 lên bản thật; hình riêng vẽ bằng gói 24$ sau.', progress: 5, pixellab: 0, doc: 'ke-hoach-the-gioi.md' },
	{ id: 'home', group: 'game', name: 'Nhà riêng (xây nhà, trồng cây, chăn nuôi)', detail: 'Mới có kế hoạch.', progress: 0, pixellab: 0, doc: 'ke-hoach-nha-rieng.md' },
	{ id: 'new_elements', group: 'game', name: 'Nguyên tố Mộc · Bóng tối · Ánh sáng', detail: 'Mới ghi chú: 3 nhánh 10 mốc, phản ứng nhóm mới, mỗi hệ một vị thần + nhiệm vụ mở nhánh.', progress: 0, pixellab: 0, doc: 'ke-hoach-nguyen-to.md §9' },
	{ id: 'new_maps', group: 'game', name: '4 map nguyên tố mới: Rừng Cổ Thụ · Thánh Địa Bình Minh · Vực Ám Ma · Lãnh địa Kiếm', detail: 'Chốt 14/10: mỗi hệ một VÙNG 12 map, vào bằng Cổng Nguyên Tố ở Thistlewood; cây đủ 48 loài, quái / đồ vật mượn tạm. Lịch: ngày 1 khung + cổng, ngày 2–5 mỗi ngày 1 vùng, ngày 6 lên bản thật.', progress: 15, pixellab: 0, doc: 'ke-hoach-the-gioi.md §5.7' },
	{ id: 'map_buildings', group: 'game', name: 'Map công trình: lâu đài, kim tự tháp, chiến địa', detail: 'Mỗi vùng ≥ 1 map đi vào bên trong (tường thành gạch đá, kim tự tháp, pháo đài + chiến địa). Có bộ nền thử kim tự tháp; còn bộ dựng map trong nhà + bộ tường (cần token trả phí).', progress: 5, pixellab: 0, doc: 'ke-hoach-the-gioi.md §5.8' },
	{ id: 'village', group: 'game', name: 'Làng đông đúc: thêm nhà + NPC', detail: 'Vùng 2–7 mỗi làng 11–16 nhà, xếp dãy dọc đường (13/10); còn dân thường đi lại / nói chuyện + nhà riêng từng vùng.', progress: 35, pixellab: 0, doc: 'ke-hoach-the-gioi.md §1.2' },
	{ id: 'waystones', group: 'game', name: 'Cột dịch chuyển ở mọi map', detail: '88 map đều có cột (14/10), bảng dịch chuyển làm lại: khung gỗ + ruột hiện đại, chọn vùng → thẻ map đã tới; còn cột phát sáng / vòng phép / hiệu ứng lúc đi.', progress: 75, pixellab: 0, doc: 'ke-hoach-the-gioi.md §5.4' },
	{ id: 'map_order', group: 'game', name: 'Xếp map có quy tắc (nhà, đồ vật, cây)', detail: 'Vùng 2–7: nhà thành dãy, đèn đều nhịp, cây / đá / hoa thành khóm cùng loài (13/10). Vùng 1 (14/10): cây / đá / bụi thành khóm, hàng cây dọc lối vào Thistlewood; còn trần tỉ lệ đồ trang trí.', progress: 90, pixellab: 0, doc: 'ke-hoach-the-gioi.md §5.4' },
	{ id: 'new_classes', group: 'game', name: 'Lớp mới: Cung · Khiên', detail: 'Mới ghi chú: mỗi lớp một nhánh vũ khí + một nguyên tố kích hoạt có thời gian. Bỏ lớp Healer (14/10) — thay bằng cây Hỗ trợ.', progress: 0, pixellab: 0, doc: 'ke-hoach-nguyen-to.md §9' },
	{ id: 'support_trees', group: 'game', name: 'Mỗi nguyên tố 2 cây: Sát thương + Hỗ trợ', detail: 'Mới ghi chú (14/10): cây Hỗ trợ riêng mỗi hệ (hồi máu, khiên, tăng sức cho mình + đồng đội); pháp sư chia điểm theo hướng buff, sát thương hoặc nửa nửa — thay lớp Healer.', progress: 0, pixellab: 0, doc: 'ke-hoach-nguyen-to.md §9' },
	{ id: 'art_r1_7', group: 'art', name: 'Hoàn thiện hình vùng 1–7', detail: 'Hiệu ứng chiêu người chơi, sửa hình quái / boss lỗi, cây + đồ vật, NPC trạm.', progress: 0, pixellab: 1645, doc: 'pixellab-ke-hoach-ve.md' },
	{ id: 'art_boss', group: 'art', name: 'Chiêu boss vùng 1–7 + vùng báo riêng', detail: 'Thêm khung 40 hình, 25 chiêu hoành tráng, vùng báo trước chiêu cho 25 boss.', progress: 0, pixellab: 1530, doc: 'pixellab-ke-hoach-ve.md — Chiêu BOSS' },
	{ id: 'art_gods', group: 'art', name: 'Mười vị thần', detail: 'Nhân vật lớn + thần kỹ + chân dung + tượng; vùng 1–7 trước (~1.155).', progress: 0, pixellab: 1650, doc: 'pixellab-ke-hoach-ve.md — Mười vị thần' },
	{ id: 'art_r8_10', group: 'art', name: 'Vùng 8–10 + 3 rồng', detail: 'Map, 15 quái, 9 boss + chiêu, 3 rồng, NPC trạm, cây + đồ vật.', progress: 0, pixellab: 2505, doc: 'pixellab-ke-hoach-ve.md' },
	{ id: 'art_gear', group: 'art', name: 'Skin cải trang (bán kim cương)', detail: 'Mỗi skin = 1 nhân vật PixelLab vẽ trọn (tóc, mặt, trang phục; bản kiếm + trượng + tay không), mỗi skin 1 giới tính, ~475 lượt. Ước 10 skin đầu; làm 1 skin thử trước (token trả phí).', progress: 0, pixellab: 4750, doc: 'the-gioi-aether.md — Việc kế tiếp 4' },
	{ id: 'art_weapons', group: 'art', name: 'Vũ khí hiện đúng từng món (vẽ liền thân)', detail: 'Chốt 14/10 (phương án B): mỗi kiếm / trượng có hình riêng trên mọi động tác cầm nó, ~200 lượt / vũ khí / ngoại hình / giới tính; NHÂN theo số skin. Ước 20 vũ khí × nhân vật gốc × 2 giới tính.', progress: 0, pixellab: 8000, doc: 'the-gioi-aether.md — Việc kế tiếp 4' },
	{ id: 'art_run', group: 'art', name: 'Hoạt ảnh chạy (giữ Shift)', detail: 'Người chơi 16 tuổi nam + nữ, tay không / cầm kiếm / cầm trượng, 8 hướng; hiện đang dùng động tác đi tua nhanh. Kéo theo mỗi vũ khí +~30, mỗi skin +~95 lượt.', progress: 0, pixellab: 190, doc: 'pixellab-ke-hoach-ve.md — Tổng lượt còn cần' },
	{ id: 'art_misc', group: 'art', name: 'Nên có + dự phòng', detail: 'Kiểu tóc, chân dung Thư viện, Thần Long, skin, đồ cốt truyện, Long Huyệt, cột dịch chuyển, vẽ lại món hỏng.', progress: 0, pixellab: 2110, doc: 'pixellab-ke-hoach-ve.md' },
	{ id: 'art_new_elements', group: 'art', name: 'Nguyên tố mới + 4 map (ước lượng thô)', detail: '3 nhánh hiệu ứng chiêu (~600) + quái / boss / thần / đồ vật 4 map (~2.100); cây 4 map đã xong 13/10.', progress: 10, pixellab: 2700, doc: 'ke-hoach-the-gioi.md §5.7' },
	{ id: 'art_trees', group: 'art', name: 'Cây 12 loài mỗi vùng', detail: '81 / 168 loài (4 map mới đủ; vùng 2–7 có 5 / vùng; vùng 1 có 3; vùng 8–10 chưa).', progress: 48, pixellab: 525, doc: 'pixellab-ke-hoach-ve.md — Cây cối' },
	{ id: 'art_props', group: 'art', name: 'Đồ vật + nhà các vùng (hàng s1–s5, gói 24$)', detail: 'Phiên s1 xong 13/10; còn s2–s5: 6 kiểu nhà làng, 3 nhà, 12 tấm mới (di tích, kim tự tháp, chiến địa, võ đường…).', progress: 25, pixellab: 125, doc: 'pixellab-ke-hoach-ve.md — Đồ vật các vùng' },
	{ id: 'art_map_buildings', group: 'art', name: 'Map công trình (bộ tường + nền + nội thất)', detail: '14 map × ~45 lượt; bộ tường cần token trả phí (Tier 1).', progress: 2, pixellab: 630, doc: 'ke-hoach-the-gioi.md §5.8' },
	{ id: 'art_village', group: 'art', name: 'Làng đông đúc (nhà + dân thường)', detail: 'Mỗi vùng ~6 kiểu nhà + 3 dáng dân thường tô màu thành 5–6 người.', progress: 0, pixellab: 790, doc: 'ke-hoach-the-gioi.md §1.2' },
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

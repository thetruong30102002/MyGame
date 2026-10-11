/**
 * Tranh lục địa + sơ đồ vùng — dữ liệu dùng chung (chuyển từ `apps/web/src/game/world/worldAtlas.ts` ngày 11/10/2026 để client Unity
 * đọc được và bản web xoá được). Toạ độ 0–1 theo ảnh `ui/world-continent.png` (khổ `CONTINENT_SIZE`). Unity: `Data/Sim/worldAtlas.json`.
 */

/** Khổ ảnh tranh lục địa mà mọi toạ độ dưới đây đo trên đó. */
export const CONTINENT_SIZE = { width: 688, height: 384 } as const;

export type Pt = readonly [number, number];

export interface ContinentPlace {
	/** Tâm vùng (0–1 theo ảnh): nhãn tên vùng + dấu "Bạn ở đây". */
	center: Pt;
	/**
	 * Đường bao vùng (0–1 theo ảnh, đa giác theo chiều kim đồng hồ): bắt rê / chạm, viền tô sáng, làm tối vùng chưa mở. Hai vùng
	 * kề nhau dùng CHUNG đỉnh ở đường ranh để không hở khe sáng giữa hai vùng tối.
	 */
	outline: readonly Pt[];
}

/**
 * 10 vùng trên tranh (bố cục cố định theo hướng — bảng mục 3.1): giữa Thistlewood, Tây Nam đầm lầy, Nam sa mạc, Đông Bắc cao
 * nguyên, Bắc lãnh nguyên, Đông núi lửa, Đông Nam quần đảo, Tây rừng nấm, Tây Bắc phế tích, góc Đông Bắc ngoài khơi Vực Hư Không.
 * Đo trên ảnh lưới 0,025 (10/10/2026): ranh là dãy núi / sông vẽ sẵn trong tranh.
 */
export const CONTINENT_PLACES: Readonly<Record<string, ContinentPlace>> = {
	human: {
		center: [0.485, 0.46],
		outline: [
			[0.335, 0.335],
			[0.4, 0.315],
			[0.5, 0.315],
			[0.56, 0.345],
			[0.6, 0.33],
			[0.615, 0.38],
			[0.625, 0.4],
			[0.625, 0.42],
			[0.62, 0.5],
			[0.625, 0.58],
			[0.61, 0.635],
			[0.6, 0.635],
			[0.55, 0.65],
			[0.5, 0.65],
			[0.44, 0.64],
			[0.39, 0.645],
			[0.355, 0.62],
			[0.34, 0.55],
			[0.335, 0.45],
			[0.33, 0.38],
		],
	},
	swamp: {
		center: [0.21, 0.765],
		outline: [
			[0.1, 0.595],
			[0.16, 0.6],
			[0.24, 0.6],
			[0.3, 0.585],
			[0.34, 0.55],
			[0.355, 0.62],
			[0.39, 0.645],
			[0.375, 0.7],
			[0.36, 0.75],
			[0.35, 0.8],
			[0.345, 0.86],
			[0.33, 0.92],
			[0.25, 0.945],
			[0.17, 0.94],
			[0.1, 0.905],
			[0.075, 0.85],
			[0.055, 0.76],
			[0.07, 0.68],
		],
	},
	desert: {
		center: [0.485, 0.8],
		outline: [
			[0.39, 0.645],
			[0.44, 0.64],
			[0.5, 0.65],
			[0.55, 0.65],
			[0.6, 0.635],
			[0.61, 0.635],
			[0.625, 0.7],
			[0.632, 0.78],
			[0.635, 0.85],
			[0.61, 0.91],
			[0.55, 0.97],
			[0.46, 0.98],
			[0.39, 0.95],
			[0.345, 0.9],
			[0.345, 0.86],
			[0.35, 0.8],
			[0.36, 0.75],
			[0.375, 0.7],
		],
	},
	highland: {
		center: [0.725, 0.215],
		outline: [
			[0.605, 0.18],
			[0.62, 0.1],
			[0.66, 0.06],
			[0.74, 0.045],
			[0.8, 0.06],
			[0.835, 0.12],
			[0.845, 0.25],
			[0.83, 0.35],
			[0.78, 0.38],
			[0.7, 0.395],
			[0.625, 0.4],
			[0.615, 0.38],
			[0.6, 0.33],
			[0.605, 0.26],
		],
	},
	tundra: {
		center: [0.445, 0.17],
		outline: [
			[0.285, 0.1],
			[0.31, 0.05],
			[0.4, 0.035],
			[0.5, 0.04],
			[0.56, 0.05],
			[0.59, 0.1],
			[0.605, 0.18],
			[0.605, 0.26],
			[0.6, 0.33],
			[0.56, 0.345],
			[0.5, 0.315],
			[0.4, 0.315],
			[0.335, 0.335],
			[0.3, 0.31],
			[0.285, 0.22],
		],
	},
	volcano: {
		center: [0.78, 0.52],
		outline: [
			[0.625, 0.4],
			[0.7, 0.395],
			[0.78, 0.38],
			[0.83, 0.35],
			[0.88, 0.345],
			[0.915, 0.39],
			[0.935, 0.45],
			[0.945, 0.55],
			[0.92, 0.63],
			[0.86, 0.66],
			[0.8, 0.685],
			[0.74, 0.69],
			[0.68, 0.67],
			[0.64, 0.645],
			[0.61, 0.635],
			[0.625, 0.58],
			[0.62, 0.5],
			[0.625, 0.42],
		],
	},
	isles: {
		center: [0.8, 0.82],
		outline: [
			[0.61, 0.635],
			[0.64, 0.645],
			[0.68, 0.67],
			[0.74, 0.69],
			[0.8, 0.685],
			[0.86, 0.66],
			[0.92, 0.65],
			[0.97, 0.72],
			[0.975, 0.88],
			[0.93, 0.96],
			[0.8, 0.975],
			[0.7, 0.955],
			[0.64, 0.91],
			[0.61, 0.91],
			[0.635, 0.85],
			[0.632, 0.78],
			[0.625, 0.7],
		],
	},
	fungal: {
		center: [0.175, 0.46],
		outline: [
			[0.075, 0.33],
			[0.17, 0.335],
			[0.25, 0.335],
			[0.3, 0.31],
			[0.335, 0.335],
			[0.33, 0.38],
			[0.335, 0.45],
			[0.34, 0.55],
			[0.3, 0.585],
			[0.24, 0.6],
			[0.16, 0.6],
			[0.1, 0.595],
			[0.06, 0.55],
			[0.045, 0.47],
			[0.055, 0.38],
		],
	},
	ruins: {
		center: [0.175, 0.21],
		outline: [
			[0.1, 0.12],
			[0.14, 0.08],
			[0.2, 0.07],
			[0.26, 0.08],
			[0.285, 0.1],
			[0.285, 0.22],
			[0.3, 0.31],
			[0.25, 0.335],
			[0.17, 0.335],
			[0.075, 0.33],
			[0.07, 0.2],
		],
	},
	void: {
		center: [0.915, 0.18],
		outline: [
			[0.845, 0.05],
			[0.9, 0.03],
			[0.965, 0.04],
			[0.99, 0.15],
			[0.97, 0.28],
			[0.91, 0.32],
			[0.855, 0.28],
			[0.845, 0.18],
		],
	},
};

/** Hộp bao (0–1) của đường bao vùng: [x0, y0, x1, y1]. */

export interface RegionLayout {
	/** Ô (cột, hàng) của từng map trên sơ đồ — bắc ở trên, đông bên phải; được dùng nửa ô (0.5) để tránh đường nối cắt nhau. */
	nodes: Readonly<Record<string, Pt>>;
}

/**
 * Sơ đồ vùng 1 (12 map — docs/thiet-ke/vung1-12-map.md mục Đồ thị lối). Lối thật không "phẳng" (Đá Phong Ấn và Luỹ cùng ở mép bắc
 * Mossvale, Đồi Xương lại ở đông Nghĩa địa) nên sơ đồ xếp lệch: Đồi Xương lên hàng trên, Luỹ sang cột 3 — mọi lối vẫn đúng hướng
 * (test). Map mới của vùng thêm vào đây; vùng chưa khai sơ đồ thì tầng Vùng xếp map theo hàng.
 */
export const REGION_LAYOUTS: Readonly<Record<string, RegionLayout>> = {
	human: {
		nodes: {
			gargoyle_cave: [0.5, 0],
			cliffs: [1, 1],
			bonehills: [2, 1],
			nameless: [0, 2],
			graveyard: [1, 2],
			shrine: [2, 2],
			oldfort: [3, 2],
			town: [1, 3],
			mossvale: [2, 3],
			riverflats: [1, 4],
			mossrift: [2, 4],
			rivergate: [1, 5],
		},
	},
};


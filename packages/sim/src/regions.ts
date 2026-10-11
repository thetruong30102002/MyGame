/**
 * Khung nhiều vùng (docs/ke-hoach-the-gioi.md mục 2 + 5): 10 vùng đất, mỗi vùng 12 map (chủ dự án chốt 10/10/2026 — 1 trạm + 10 map
 * săn + 1 thánh địa; vùng 1: docs/thiet-ke/vung1-12-map.md), một trạm (map không quái, có cột dịch chuyển), ~10 cấp, boss chúa ở
 * thánh địa cuối vùng. Luật THUẦN dùng chung web + máy chủ. Id map đầy đủ là `vùng/map`
 * (`human/town`) — map chỉ duy nhất TRONG một vùng.
 *
 * Mở vùng: đủ cấp tối thiểu của vùng + đã hạ boss chúa của vùng TRƯỚC (vùng chưa có boss chúa thì chỉ xét cấp). `ready: false` =
 * vùng chưa có map (đang xây) — cổng báo "đang xây dựng". Trước M3.3 cấp + boss đã hạ là số liệu client (bản lưu) nên chỉ client
 * kiểm cổng; máy chủ kiểm khi cấp / boss chuyển lên máy chủ.
 */

/** NPC dịch vụ của nơi ở trong vùng: bán hàng, thợ rèn, thợ may, thợ cắt tóc, cột dịch chuyển. */
export type ServiceKind = 'shop' | 'smith' | 'tailor' | 'barber' | 'waystone';

/**
 * Nơi ở của vùng (chủ dự án 08/10/2026: "mỗi vùng có một ngôi làng hoặc lâu đài, toà thành (chính trị) để còn liên quan đến các
 * nhiệm vụ"; "mua đồ ở các NPC ở các vùng nữa"). Chính là map trạm của vùng. `castle` = toà thành có chính trị (lãnh chúa / triều
 * đình, phe phái) — nguồn nhiệm vụ chính của vùng; `village` = làng. Tên vùng 2–10 là ĐỀ XUẤT, chủ dự án chốt lại.
 */
export interface Settlement {
	kind: 'village' | 'castle';
	name: string;
	/** Vai trò trong cốt truyện / nhiệm vụ của vùng. */
	role: string;
	/** NPC dịch vụ có (hoặc sẽ có) ở đây. */
	services: ServiceKind[];
}

export interface RegionDef {
	id: string;
	/** Thứ tự trên đường chơi (1 = vùng đầu). */
	order: number;
	name: string;
	/** Cấp khuyên dùng [vào, rời]. Vào cần ≥ cấp đầu. */
	levels: [number, number];
	/** Map trạm (làng / trại / cảng) — có cột dịch chuyển. */
	hub: string;
	/** Cột dịch chuyển đứng ở địa điểm `spot` của map trạm (+ lệch px). */
	waystone: { spot: string; dx: number; dy: number };
	/** Boss chúa (thánh địa cuối vùng): hạ xong thì mở vùng kế. null = chưa thiết kế. */
	chief: { id: string; name: string } | null;
	/** Nơi ở của vùng (= map trạm `hub`). */
	settlement: Settlement;
	/** Đã có map chơi được. */
	ready: boolean;
	/** Một câu giới thiệu trên màn chuyển vùng. */
	intro: string;
	/**
	 * Hệ của vùng (docs/ke-hoach-the-gioi.md mục 2): quái của vùng thiên về hệ `name`, yếu hệ `weak` — bản đồ tổng ghi trên thẻ vùng.
	 * Chỉ là chữ hiển thị; hệ số kháng / yếu thật khai theo từng loại quái (`ENEMY_STATS.resist`).
	 */
	element: { name: string; weak: string };
}

const W = { spot: 'waystone', dx: 0, dy: 0 };

/** Vùng chưa có map: tạo bản ghi gọn (trạm `hub`, cột dịch chuyển ở địa điểm `waystone`, chưa mở). */
const planned = (o: Pick<RegionDef, 'id' | 'order' | 'name' | 'levels' | 'chief' | 'settlement' | 'intro' | 'element'>): RegionDef => ({ ...o, hub: 'hub', waystone: W, ready: false });
/**
 * Vùng đã dựng map theo khung chung (`packages/asset-pipeline/src/maps/kit` — 10/10/2026, vùng 2–7): trạm `hub`, cột dịch chuyển ở
 * địa điểm `waystone` của trạm.
 */
const built = (o: Parameters<typeof planned>[0]): RegionDef => ({ ...planned(o), ready: true });

export const REGIONS: readonly RegionDef[] = [
	{
		id: 'human',
		order: 1,
		name: 'Thung lũng Thistlewood',
		levels: [1, 10],
		hub: 'town',
		// Thistlewood dựng trước khi có địa điểm `waystone`: cột đứng góc tây nam quảng trường.
		waystone: { spot: 'plaza', dx: -150, dy: 110 },
		chief: { id: 'boss_demon_001', name: 'Quỷ vương rừng sâu' },
		settlement: { kind: 'village', name: 'Thị trấn Thistlewood', role: 'Quê nhà của Lior: nhiệm vụ tuổi thơ và tuổi 16 bắt đầu ở đây.', services: ['shop', 'waystone'] },
		ready: true,
		intro: 'Đồng cỏ, rừng rêu và nghĩa địa cổ quanh thị trấn Thistlewood — nơi mọi chuyện bắt đầu.',
		element: { name: 'Bóng tối', weak: 'Hoả, Aether' },
	},
	built({
		id: 'swamp',
		order: 2,
		name: 'Đầm lầy Mù Sương',
		levels: [10, 20],
		chief: { id: 'boss_mud_hydra_001', name: 'Hydra bùn' },
		settlement: { kind: 'village', name: 'Làng nhà sàn Lau Xám', role: 'Dân đầm lầy sống trên nhà sàn, nhờ người lạ dẹp quái và tìm thuốc giải độc.', services: ['shop', 'smith', 'waystone'] },
		intro: 'Bùn, lau sậy và nhà sàn chìm trong sương xanh.',
		element: { name: 'Thuỷ / độc', weak: 'Thổ, Phong' },
	}),
	built({
		id: 'desert',
		order: 3,
		name: 'Sa mạc Hồng Cát',
		levels: [20, 30],
		chief: { id: 'boss_sandworm_001', name: 'Sâu cát khổng lồ' },
		settlement: {
			kind: 'castle',
			name: 'Thành ốc đảo Sahrin',
			role: 'Vương quốc sa mạc: các tộc tranh nguồn nước, triều đình giao nhiệm vụ.',
			services: ['shop', 'smith', 'tailor', 'barber', 'waystone'],
		},
		intro: 'Cồn cát đỏ, ốc đảo và phế tích đá đỏ.',
		element: { name: 'Thổ / Hoả', weak: 'Thuỷ, Băng' },
	}),
	built({
		id: 'highland',
		order: 4,
		name: 'Cao nguyên Gió Hú',
		levels: [30, 40],
		chief: { id: 'boss_wind_drake_001', name: 'Rồng gió' },
		settlement: { kind: 'village', name: 'Làng Cối Xay Gió', role: 'Làng trên cao nguyên, giữ đền thờ trên mây.', services: ['shop', 'smith', 'waystone'] },
		intro: 'Đồi cỏ cao, cối xay gió và đền thờ trên mây.',
		element: { name: 'Phong', weak: 'Thổ' },
	}),
	built({
		id: 'tundra',
		order: 5,
		name: 'Lãnh nguyên Băng Giá',
		levels: [40, 50],
		chief: { id: 'boss_ice_guardian_001', name: 'Vệ thần Ngai Băng' },
		settlement: { kind: 'village', name: 'Làng gỗ Tuyết Phong', role: 'Thợ săn và thợ mỏ băng sống qua mùa đông dài.', services: ['shop', 'smith', 'tailor', 'waystone'] },
		intro: 'Tuyết trắng, hồ băng và những làng gỗ.',
		element: { name: 'Băng', weak: 'Hoả' },
	}),
	built({
		id: 'volcano',
		order: 6,
		name: 'Núi lửa Hoả Sơn',
		levels: [50, 60],
		chief: { id: 'boss_fire_god_001', name: 'Hoả thần' },
		settlement: { kind: 'castle', name: 'Pháo đài người lùn Đe Đỏ', role: 'Hội đồng người lùn: rèn binh khí, đổi lấy nhiệm vụ trong lòng núi.', services: ['shop', 'smith', 'waystone'] },
		intro: 'Đá đen, sông dung nham và lò rèn người lùn.',
		element: { name: 'Hoả', weak: 'Thuỷ, Băng' },
	}),
	built({
		id: 'isles',
		order: 7,
		name: 'Quần đảo San Hô',
		levels: [60, 70],
		chief: { id: 'boss_kraken_001', name: 'Kraken' },
		settlement: { kind: 'village', name: 'Cảng chài San Hô', role: 'Làng chài và thương thuyền, tin đồn về tàu ma.', services: ['shop', 'tailor', 'barber', 'waystone'] },
		intro: 'Bãi cát, rạn san hô, làng chài và tàu đắm.',
		element: { name: 'Thuỷ', weak: 'Phong, Thổ' },
	}),
	planned({
		id: 'fungal',
		order: 8,
		name: 'Rừng Nấm Ngầm',
		levels: [70, 80],
		chief: null,
		settlement: { kind: 'village', name: 'Làng người nấm Ánh Tím', role: 'Tộc người nấm dưới lòng đất, chỉ tin người đã giúp họ.', services: ['shop', 'smith', 'waystone'] },
		intro: 'Hang ngầm, nấm khổng lồ phát sáng và mạch tinh thể.',
		element: { name: 'Thổ', weak: 'Phong' },
	}),
	planned({
		id: 'ruins',
		order: 9,
		name: 'Phế tích Aether',
		levels: [80, 90],
		chief: null,
		settlement: {
			kind: 'castle',
			name: 'Toà thành Aether cổ',
			role: 'Tàn dư triều đình pháp sư xưa — các phe tranh nhau di sản Aether.',
			services: ['shop', 'smith', 'tailor', 'barber', 'waystone'],
		},
		intro: 'Thành cổ đổ nát, cột ma pháp và máy móc cổ.',
		element: { name: 'Aether / thép (kháng phép)', weak: 'Kiếm' },
	}),
	planned({
		id: 'void',
		order: 10,
		name: 'Vực Hư Không',
		levels: [90, 100],
		chief: null,
		settlement: { kind: 'castle', name: 'Thành trì Hư Không', role: 'Tiền đồn cuối cùng trước Ma vương — liên quân các vùng đóng ở đây.', services: ['shop', 'smith', 'waystone'] },
		intro: 'Đảo trôi trên nền tím đen, khe nứt không gian.',
		element: { name: 'Bóng tối / hỗn hợp', weak: 'Aether, Hoả' },
	}),
];

/** Vùng đầu tiên — bản lưu không có / sai vùng thì về đây. */
export const START_REGION = 'human';

export function regionDef(id: string): RegionDef | undefined {
	return REGIONS.find((r) => r.id === id);
}

/** `human/town` → { region: 'human', map: 'town' }; thiếu tiền tố vùng (map trong cùng vùng) thì dùng `here`. */
export function splitMapKey(key: string, here: string): { region: string; map: string } {
	const i = key.indexOf('/');
	return i < 0 ? { region: here, map: key } : { region: key.slice(0, i), map: key.slice(i + 1) };
}

/** Những gì cổng vùng cần biết về người chơi. `bossKills`: số lần đã hạ theo id (Thư viện ở client). */
export interface GateCtx {
	level: number;
	bossKills: Readonly<Record<string, number>>;
}

/**
 * Điều kiện mở vùng `id` (cổng vùng + thẻ vùng trên bản đồ tổng): cấp tối thiểu + boss chúa của vùng TRƯỚC (`chief` null = vùng
 * trước chưa thiết kế boss chúa → chỉ xét cấp). null = vùng đầu (luôn mở) hoặc không có vùng này.
 */
export function regionNeeds(id: string): { level: number; chief: { id: string; name: string; region: string } | null } | null {
	const r = regionDef(id);
	if (!r || r.order === 1) return null;
	const prev = REGIONS.find((x) => x.order === r.order - 1);
	return { level: r.levels[0], chief: prev?.chief ? { ...prev.chief, region: prev.name } : null };
}

/** null = được vào vùng `id`; còn lại là câu giải thích vì sao chưa vào được. Vùng đầu luôn mở. */
export function regionGate(id: string, ctx: GateCtx): string | null {
	const r = regionDef(id);
	if (!r) return 'Không có vùng này.';
	if (!r.ready) return `${r.name} chưa mở — vùng đất này đang được xây dựng.`;
	const need = regionNeeds(id);
	if (!need) return null;
	if (ctx.level < need.level) return `Cần cấp ${need.level} để vào ${r.name} (bạn đang cấp ${ctx.level}).`;
	if (need.chief && !(ctx.bossKills[need.chief.id] ?? 0)) return `Hạ ${need.chief.name} ở ${need.chief.region} trước đã, rồi mới qua được ${r.name}.`;
	return null;
}

/** Map trạm có cột dịch chuyển của mọi vùng đã mở (id đầy đủ `vùng/map`). */
export function hubKeys(): string[] {
	return REGIONS.filter((r) => r.ready).map((r) => `${r.id}/${r.hub}`);
}

/** Giá xu một lần dịch chuyển (xu còn ở bản lưu client tới M3.3 — client trừ). */
export const WAYSTONE_COST = 20;

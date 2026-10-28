import type { KitRegionDef, KitTheme } from './kit.js';
import { HIGHLAND_REGION, SWAMP_REGION, VOLCANO_REGION } from './worldRegions.js';

/** Vùng 8–10: bố cục và cấp riêng, mượn hình đã có theo kế hoạch 5.7; chưa phải bộ art cuối. */
function lateRegion(base: KitRegionDef, region: string, level: number, names: readonly string[], prev: string, next?: string): KitRegionDef {
	const copy = structuredClone(base);
	const maps = copy.maps.filter((m) => m.role !== 'lair');
	const rename = new Map(maps.map((m, i) => [m.id, i === 0 ? 'hub' : i === 11 ? 'sanctum' : `h${i}`]));
	const theme = (t: KitTheme): KitTheme => ({ ...t, biome: region === 'fungal' ? 'swamp' : region === 'ruins' ? 'rocky' : 'deadland', water: 'none' });
	return {
		region, start: 'hub', levels: [level, level + 10],
		maps: maps.map((m, i) => ({ ...m, id: rename.get(m.id)!, name: names[i]!, seed: 20268000 + level * 100 + i, theme: theme(m.theme),
			zones: m.zones?.map((z) => ({ ...z, level: Math.min(level + 10, level + i - (z.level % 2)), name: `${names[i]} · bầy tuần tra` })),
			boss: m.boss ? { ...m.boss, name: `${names[i]} · kẻ canh giữ`, level: i === 11 ? level + 10 : level + i } : undefined,
		})),
		links: copy.links.filter(([a, , b]) => rename.has(a) && rename.has(b)).map(([a, e, b]) => [rename.get(a)!, e, rename.get(b)!]),
		labels: Object.fromEntries(maps.map((m, i) => [rename.get(m.id)!, `${names[i]}${i ? ` · cấp ${Math.min(level + i, level + 10)}` : ''}`])),
		cross: [
			{ map: 'hub', edge: 'E', to: prev, toSpot: prev === 'isles/wreckyard' ? 'wreckyard_gate' : 'h10_gate', label: 'Trở về vùng trước', spot: 'east_gate', spotName: 'Cổng vào vùng' },
			...(next ? [{ map: 'h10', edge: 'W' as const, to: `${next}/hub`, toSpot: 'east_gate', label: `Đường sang ${next === 'ruins' ? 'Phế tích Haven' : 'Vực Hư Không'}`, spot: 'h10_gate', spotName: 'Lối ra khỏi vùng' }] : []),
		],
	};
}

export const FUNGAL_REGION = lateRegion(SWAMP_REGION, 'fungal', 70, [
	'Làng người nấm Ánh Tím', 'Lối Rễ Ngầm', 'Bãi Bào Tử', 'Rừng Nấm Lam', 'Hồ Nước Rỉ', 'Mạch Thạch Anh', 'Vườn Nấm Cổ', 'Hẻm Địa Y', 'Hang Tinh Thể', 'Đường Hầm Cũ', 'Cổng Đá Ngầm', 'Thánh địa Mạch Đất',
], 'isles/wreckyard', 'ruins');

export const RUINS_REGION = lateRegion(HIGHLAND_REGION, 'ruins', 80, [
	'Toà thành Haven cổ', 'Đại Lộ Đổ Nát', 'Vườn Tượng Vỡ', 'Quảng Trường Rune', 'Khu Xưởng Cổ', 'Thư Viện Ngoài', 'Cầu Dẫn Năng Lượng', 'Trại Khảo Cổ', 'Tháp Đồng Hồ', 'Hành Lang Pháp Sư', 'Cổng Thành Cổ', 'Lõi Di Sản Haven',
], 'fungal/h10', 'void');

export const VOID_REGION = lateRegion(VOLCANO_REGION, 'void', 90, [
	'Thành trì Hư Không', 'Tiền Tuyến Liên Quân', 'Bãi Giáp Vỡ', 'Vành Đai Tro Tím', 'Trạm Tiếp Tế Cũ', 'Khe Nứt Câm Lặng', 'Đảo Đá Vỡ', 'Luỹ Cờ Tàn', 'Cầu Qua Vực', 'Đường Hành Quân Cuối', 'Cổng Hư Không', 'Tâm Vực Hỗn Mang',
], 'ruins/h10');

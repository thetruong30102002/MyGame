import { ELEMENT_TREES } from '../props/elemental.js';
import { attachBuilding } from './buildings.js';
import { buildKitMap, type KitRegionDef } from './kit.js';
import { FUNGAL_REGION, RUINS_REGION, VOID_REGION } from './lateRegions.js';
import type { Edge, MapData } from './human/common.js';
import type { PropMeta } from '../props/buildProps.js';

export const ELEMENT_NAMES = { wood: 'Rừng Cổ Thụ', light: 'Thánh Địa Bình Minh', dark: 'Vực Ám Ma' };
const names = {
	wood: ['Làng Rễ Ngàn Năm', 'Bãi Dương Xỉ', 'Lối Đa Rễ Phụ', 'Vườn Hoa Trắng', 'Rừng Sồi Rỗng', 'Suối Đom Đóm', 'Đồi Hồng Dại', 'Rừng Thông Đỏ', 'Thung Lũng Dây Leo', 'Cầu Thân Cây Đổ', 'Vườn Tinh Linh', 'Mầm Cây Thế Giới'],
	light: ['Trạm Bình Minh', 'Đại Lộ Bạch Quả', 'Vườn Ô Liu Bạc', 'Bờ Liễu Ánh Trăng', 'Vườn Táo Hoàng Kim', 'Lối Mộc Lan', 'Đồi Bách Trắng', 'Vườn Hoa Huệ', 'Sân Nguyệt Quế', 'Rừng Lông Vũ', 'Lối Cây Pha Lê', 'Thánh Địa Mầm Sáng'],
	dark: ['Trại Đèn Tím', 'Rừng Thân Xoắn', 'Hẻm Cây Xích', 'Bãi Gốc Nứt', 'Vườn Máu', 'Rừng Mắt Đêm', 'Lối Cây Xương', 'Thung Lũng Bóng Rủ', 'Rừng Ma Trắng', 'Đồi Gai Đen', 'Lối Hắc Diện', 'Điện Tím Vĩnh Dạ'],
};
const edges: Edge[] = ['N', 'E', 'S', 'W'];
const backEdges: Record<keyof typeof names, Edge> = { wood: 'S', light: 'E', dark: 'N' };
export const ELEMENT_REGIONS = Object.fromEntries(Object.entries(names).map(([key, labels]) => {
	const id = key as keyof typeof names;
	const base = structuredClone(id === 'wood' ? FUNGAL_REGION : id === 'light' ? RUINS_REGION : VOID_REGION);
	const level = id === 'wood' ? 20 : id === 'light' ? 30 : 40;
	const turn = (e: Edge): Edge => edges[(edges.indexOf(e) + edges.indexOf(backEdges[id]) - 1 + 4) % 4]!;
	const trees = ELEMENT_TREES[id].flatMap(t => [t, `${t}_flip`]);
	const def: KitRegionDef = {
		...base, region: id, levels: [level, level + 10],
		maps: base.maps.map((m, i) => ({ ...m, name: labels[i]!, seed: 202610170 + level * 100 + i,
			treeMain: i, theme: { ...m.theme, biome: id, trees, treeDensity: id === 'wood' ? 24 : 14, water: i > 0 && i % 3 === 0 ? 'ponds' : 'none', road: id === 'light' ? 'c' : 'd' },
			zones: m.zones?.map(z => ({ ...z, level: Math.min(level + 10, level + i), name: `${labels[i]} · bầy canh giữ` })),
			boss: m.boss ? { ...m.boss, level: Math.min(level + 10, level + i), name: `${labels[i]} · hộ vệ cổ` } : undefined,
		})),
		links: base.links.map(([a, e, b]) => [a, turn(e), b]),
		cross: [{ map: 'hub', edge: backEdges[id], to: 'human/element_gate', toSpot: `${id}_gate`, label: 'Cổng Nguyên Tố · Thistlewood', spot: 'entry', spotName: 'Cổng về Thistlewood' }],
		labels: Object.fromEntries(base.maps.map((m, i) => [m.id, labels[i]!])),
	};
	return [id, def];
})) as Record<keyof typeof names, KitRegionDef>;

/** Sân cổng phía tây thị trấn: ba nhánh độc lập, đi bộ qua cổng và quay về được. */
export function attachElementGate(maps: MapData[], meta: Record<string, PropMeta>): void {
	const shell = attachBuilding(maps, { id: 'element_gate', name: 'Cổng Nguyên Tố', from: 'town', rooms: ['Mộc', 'Ánh sáng', 'Bóng tối'], decor: [], level: 1 }, meta);
	const back = shell.exits[0]!;
	const theme = { ...RUINS_REGION.maps[0]!.theme, biome: 'meadow' as const, trees: [], rocks: [], flats: [], landmarks: ['rune_stone'], water: 'none' as const, sign: 'signpost' };
	const gate = buildKitMap({ id: 'element_gate', name: 'Sân Cổng Nguyên Tố', seed: 20261017, w: 48, h: 48, role: 'hub', theme, hub: { buildings: [], decor: ['rune_stone'], plaza: 'c' } }, [
		{ edge: back.edge, to: 'town', toSpot: back.toSpot, label: 'Thistlewood', spot: 'element_gate_entry', spotName: 'Lối về thị trấn' },
		...(['wood', 'light', 'dark'] as const).map(id => ({ edge: edges[(edges.indexOf(backEdges[id]) + 2) % 4]!, to: `${id}/hub`, toSpot: 'entry', label: `${ELEMENT_NAMES[id]} · cấp ${ELEMENT_REGIONS[id].levels[0]}`, spot: `${id}_gate`, spotName: ELEMENT_NAMES[id] })),
	], meta, []);
	for (const spot of gate.spots) if (spot.id === 'plaza') spot.id = 'element_plaza';
	maps.push(gate);
}

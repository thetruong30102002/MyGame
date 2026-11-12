import { ELEMENT_PROPS } from '../props/elemental.js';
import { GPT_REGION_PROPS, withGptArt } from '../props/gptArt.js';
import { ELEMENT_REGIONS, attachElementGate } from './elemental.js';
import { FUNGAL_REGION, RUINS_REGION, VOID_REGION } from './lateRegions.js';
import { attachBuilding, BUILDINGS } from './buildings.js';
import type { PropMeta } from '../props/buildProps.js';
import { HUMAN_KINGDOM_DECAL_SHEETS, HUMAN_KINGDOM_PROPS } from '../props/humanKingdom.js';
import { DESERT_PROPS, HIGHLAND_PROPS, ISLES_PROPS, SWAMP_PROPS, TUNDRA_PROPS, VOLCANO_PROPS } from '../props/worldRegions.js';
import { buildHumanRegion, validateRegion, worldIndex, type MapData, type WorldIndex } from './human/index.js';
import { buildKitRegion, type KitRegionDef } from './kit.js';
import { DESERT_REGION, HIGHLAND_REGION, ISLES_REGION, SWAMP_REGION, TUNDRA_REGION, VOLCANO_REGION } from './worldRegions.js';

/**
 * Vùng dựng được bằng lệnh `map <vùng>` (khung nhiều vùng — docs/ke-hoach-the-gioi.md mục 5.7): bộ đồ vật + tấm decal của vùng
 * và hàm dựng các map + chỉ mục `world.json`. Vùng mới: thêm thư mục `maps/<vùng>/` (cùng khung với `maps/human/`) + bộ đồ vật ở
 * `props/`, rồi khai ở đây. Id vùng trùng `@havenlord/sim/regions`.
 */
export interface RegionBuild {
	props: typeof HUMAN_KINGDOM_PROPS;
	decals: typeof HUMAN_KINGDOM_DECAL_SHEETS;
	build(meta: Record<string, PropMeta>, decalIds: string[]): { maps: MapData[]; index: WorldIndex };
}

/** Vùng dựng bằng bộ dựng chung `maps/kit` (vùng 2–7): bộ đồ vật riêng + tấm decal đồng cỏ (đầm lầy, cao nguyên). */
const kit = (def: KitRegionDef, props: RegionBuild['props'], decal = false): RegionBuild => ({
	props,
	decals: decal ? HUMAN_KINGDOM_DECAL_SHEETS.filter((d) => d.tag === 'd1') : [],
	build: (meta, decalIds) => buildKitRegion(def, meta, decalIds),
});

export const REGION_BUILDS: Record<string, RegionBuild> = {
	// Đợt GPT 12 (12/11/2026): 6 vùng mượn đồ vùng khác có thêm công trình biểu tượng + đồ vật riêng (`props/gptArt.ts`).
	wood: kit(withGptArt(ELEMENT_REGIONS.wood), [...ELEMENT_PROPS.wood, ...GPT_REGION_PROPS.wood!]),
	light: kit(withGptArt(ELEMENT_REGIONS.light), [...ELEMENT_PROPS.light, ...GPT_REGION_PROPS.light!]),
	dark: kit(withGptArt(ELEMENT_REGIONS.dark), [...ELEMENT_PROPS.dark, ...GPT_REGION_PROPS.dark!]),
	human: { props: HUMAN_KINGDOM_PROPS, decals: HUMAN_KINGDOM_DECAL_SHEETS, build: buildHumanRegion },
	swamp: kit(SWAMP_REGION, SWAMP_PROPS, true),
	desert: kit(DESERT_REGION, DESERT_PROPS),
	highland: kit(HIGHLAND_REGION, HIGHLAND_PROPS, true),
	tundra: kit(TUNDRA_REGION, TUNDRA_PROPS),
	volcano: kit(VOLCANO_REGION, VOLCANO_PROPS),
	isles: kit(ISLES_REGION, ISLES_PROPS),
	fungal: kit(withGptArt(FUNGAL_REGION), [...SWAMP_PROPS, ...GPT_REGION_PROPS.fungal!]),
	ruins: kit(withGptArt(RUINS_REGION), [...HIGHLAND_PROPS, ...GPT_REGION_PROPS.ruins!]),
	void: kit(withGptArt(VOID_REGION), [...VOLCANO_PROPS, ...GPT_REGION_PROPS.void!]),
};

export function regionBuild(id: string): RegionBuild {
	const r = REGION_BUILDS[id];
	if (!r) throw new Error(`Chưa có bộ dựng cho vùng "${id}" — các vùng dựng được: ${Object.keys(REGION_BUILDS).join(', ')}`);
	return {
		...r,
		build: (meta, decalIds) => {
			const result = r.build(meta, decalIds);
			if (id === 'human') attachElementGate(result.maps, meta);
			const spec = BUILDINGS[id];
			if (!spec) return result;
			result.maps.push(attachBuilding(result.maps, spec, meta));
			const firstLevel = Math.floor(spec.level / 10) * 10;
			const problems = validateRegion(result.maps, id === 'human' ? [1, 10] : [firstLevel, firstLevel + 10]);
			if (problems.length) throw new Error(problems.join('\n'));
			return { maps: result.maps, index: worldIndex(id, result.index.start, result.maps) };
		},
	};
}

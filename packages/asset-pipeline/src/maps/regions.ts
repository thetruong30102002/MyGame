import type { PropMeta } from '../props/buildProps.js';
import { HUMAN_KINGDOM_DECAL_SHEETS, HUMAN_KINGDOM_PROPS } from '../props/humanKingdom.js';
import { DESERT_PROPS, HIGHLAND_PROPS, ISLES_PROPS, SWAMP_PROPS, TUNDRA_PROPS, VOLCANO_PROPS } from '../props/worldRegions.js';
import { buildHumanRegion, type MapData, type WorldIndex } from './human/index.js';
import { buildKitRegion, type KitRegionDef } from './kit.js';
import { DESERT_REGION, HIGHLAND_REGION, ISLES_REGION, SWAMP_REGION, TUNDRA_REGION, VOLCANO_REGION } from './worldRegions.js';

/**
 * Vùng dựng được bằng lệnh `map <vùng>` (khung nhiều vùng — docs/ke-hoach-the-gioi.md mục 5.7): bộ đồ vật + tấm decal của vùng
 * và hàm dựng các map + chỉ mục `world.json`. Vùng mới: thêm thư mục `maps/<vùng>/` (cùng khung với `maps/human/`) + bộ đồ vật ở
 * `props/`, rồi khai ở đây. Id vùng trùng `@aether/sim/regions`.
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
	human: { props: HUMAN_KINGDOM_PROPS, decals: HUMAN_KINGDOM_DECAL_SHEETS, build: buildHumanRegion },
	swamp: kit(SWAMP_REGION, SWAMP_PROPS, true),
	desert: kit(DESERT_REGION, DESERT_PROPS),
	highland: kit(HIGHLAND_REGION, HIGHLAND_PROPS, true),
	tundra: kit(TUNDRA_REGION, TUNDRA_PROPS),
	volcano: kit(VOLCANO_REGION, VOLCANO_PROPS),
	isles: kit(ISLES_REGION, ISLES_PROPS),
};

export function regionBuild(id: string): RegionBuild {
	const r = REGION_BUILDS[id];
	if (!r) throw new Error(`Chưa có bộ dựng cho vùng "${id}" — các vùng dựng được: ${Object.keys(REGION_BUILDS).join(', ')}`);
	return r;
}

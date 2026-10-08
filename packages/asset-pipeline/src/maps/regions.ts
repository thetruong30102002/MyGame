import type { PropMeta } from '../props/buildProps.js';
import { HUMAN_KINGDOM_DECAL_SHEETS, HUMAN_KINGDOM_PROPS } from '../props/humanKingdom.js';
import { buildHumanRegion, type MapData, type WorldIndex } from './human/index.js';

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

export const REGION_BUILDS: Record<string, RegionBuild> = {
	human: { props: HUMAN_KINGDOM_PROPS, decals: HUMAN_KINGDOM_DECAL_SHEETS, build: buildHumanRegion },
};

export function regionBuild(id: string): RegionBuild {
	const r = REGION_BUILDS[id];
	if (!r) throw new Error(`Chưa có bộ dựng cho vùng "${id}" — các vùng dựng được: ${Object.keys(REGION_BUILDS).join(', ')}`);
	return r;
}

import type { PropMeta } from '../../props/buildProps.js';
import { buildKitMap } from '../kit.js';
import { TREES, type MapData } from './common.js';

/**
 * Đồng Cỏ Linh Cẩu — map săn mới vùng 1 (chủ dự án 05/11/2026: thêm quái + boss mới, "phân bổ quái các map cho hợp lý"): nấc cấp 4–6
 * giữa Bãi Bồi (nấm 1–4) và Vết Rạn / Đồi Xương (5–7). Lối DUY NHẤT ở mép đông về Bãi Bồi. CHỈ một loài chính — Linh cẩu đồng săn
 * theo bầy — cộng bầy quái sông Cua đá suối sát bờ suối; hang boss Cổ Thụ Nguyền Rủa (cấp 6). Dựng bằng bộ `kit` (suối, cầu, cây /
 * đá / tượng như các vùng sau) nhưng dùng đồ vật vùng 1.
 */
export const HYENAFIELD_SPOT = 'hf_east_entry';

export function buildHyenafield(meta: Record<string, PropMeta>, decalIds: string[]): MapData {
	return buildKitMap(
		{
			id: 'hyenafield',
			name: 'Đồng Cỏ Linh Cẩu',
			seed: 20261105,
			w: 48,
			h: 44,
			role: 'hunt',
			treeMain: 0,
			theme: {
				biome: 'meadow',
				fill: 'g',
				road: 'd',
				trees: [...TREES],
				treeDensity: 10,
				rocks: ['rock_mossy', 'rock_gray', 'boulder', 'stump'],
				rockDensity: 2,
				flats: ['wildflowers', 'bush', 'bush_flower', 'fern', 'reed_clump'],
				flatDensity: 4,
				landmarks: ['rune_stone', 'pillar_broken', 'stone_lantern', 'column_fallen', 'gargoyle_statue'],
				water: 'ponds',
				sign: 'signpost',
				decal: 'd1',
				riverMonster: 'mob_stream_crab_001',
			},
			zones: [
				{ name: 'Bãi linh cẩu đầu đồng', monster: 'mob_field_hyena_001', level: 4, count: 4 },
				{ name: 'Gò cỏ cao', monster: 'mob_field_hyena_001', level: 5, count: 5 },
				{ name: 'Bãi xương linh cẩu', monster: 'mob_field_hyena_001', level: 5, count: 5 },
				{ name: 'Hang ổ linh cẩu', monster: 'mob_field_hyena_001', level: 6, count: 5 },
			],
			boss: { name: 'Hang Cổ Thụ Nguyền Rủa', monster: 'boss_cursed_oak_001', level: 6, ring: ['stump', 'rock_mossy', 'tree_dead', 'dead_stump'], center: 'ruin_arch' },
		},
		[{ edge: 'E', to: 'riverflats', toSpot: 'west_entry_rf', label: 'Bãi Bồi Brightwater', spot: HYENAFIELD_SPOT, spotName: 'Đường về Bãi Bồi' }],
		meta,
		decalIds,
	);
}

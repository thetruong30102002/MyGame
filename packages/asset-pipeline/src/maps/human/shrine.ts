import type { PropMeta } from '../../props/buildProps.js';
import { decalsOf, Layout, TILE, TREES, px, type MapData } from './common.js';

/** Đá Phong Ấn: khoảng trống cổ phía bắc rừng Mossvale. Không có quái thường — chỉ Quỷ vương ngủ dưới đá phong ấn. */
export const SHRINE_W = 30;
export const SHRINE_H = 26;

export function buildShrine(meta: Record<string, PropMeta>, decalIds: string[], seed = 20261008): MapData {
	const L = new Layout(SHRINE_W, SHRINE_H, seed, meta, 'f');
	const seal = { x: 15, y: 10 };
	L.disc(seal.x, seal.y + 1, 9, 'g');
	L.rect(14, seal.y + 2, 15, SHRINE_H - 1, 'c');
	L.disc(seal.x, seal.y + 1, 3.2, 'c');

	L.place('seal_stone', px(seal.x), px(seal.y - 1) + 16, { force: true });
	for (const [x, y] of [
		[9, 8],
		[21, 8],
		[10, 15],
		[20, 15],
	] as const)
		L.place('pillar_broken', px(x), px(y), { force: true });
	L.place('rune_stone', px(12), px(5), { force: true });
	L.place('rune_stone', px(18), px(5), { force: true });
	for (const y of [18, 22]) {
		L.place('stone_lantern', px(12), px(y), { force: true });
		L.place('stone_lantern', px(17), px(y), { force: true });
	}
	L.place('signpost', px(17), px(24) + 10, { force: true });

	L.reserve(seal.x, seal.y + 1, 9.5);
	L.reserve(14.5, SHRINE_H - 1, 3);
	L.clumps(500, TREES, 7, 2.6, (id, x, y) => L.place(id, x, y, { canopy: true }));
	L.clumps(40, ['rock_mossy', 'fern', 'stump'], 3, 1.4, (id, x, y) => L.place(id, x, y));
	L.sprinkleDecals(decalsOf(decalIds, 'd1'), 380);

	return L.finish({
		id: 'shrine',
		name: 'Đá Phong Ấn',
		spawn: { x: px(14) + 24, y: px(22) },
		npcs: [],
		monsterZones: [],
		boss: { characterId: 'boss_demon_001', x: px(seal.x), y: px(seal.y + 2), radius: 3 * TILE },
		spots: [
			{ id: 'south_entry', name: 'Đường xuống rừng Mossvale', x: px(14) + 24, y: px(22), r: 60 },
			{ id: 'seal_stone', name: 'Đá phong ấn', x: px(seal.x), y: px(seal.y + 2), r: 120 },
		],
		dummies: [],
		areas: [{ name: 'Đá Phong Ấn', x0: 0, y0: 0, x1: SHRINE_W * TILE, y1: SHRINE_H * TILE }],
		exits: [{ id: 'to_mossvale', to: 'mossvale', toSpot: 'north_entry', edge: 'S', ...L.exitStrip('S', 12, 17), label: 'Rừng Mossvale' }],
	});
}

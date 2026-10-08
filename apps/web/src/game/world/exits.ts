import type { ResolvedTarget } from '../story/resolveTarget';

/** Lối sang map khác: dải 1 ô sát mép map (pipeline `maps/human/common.ts`). Thuần — test node dùng chung. */
export type Edge = 'N' | 'S' | 'E' | 'W';

export interface MapExit {
	id: string;
	to: string;
	toSpot: string;
	edge: Edge;
	x0: number;
	y0: number;
	x1: number;
	y1: number;
	label: string;
}

/** Hướng ra ngoài mép của một lối (đơn vị). */
export const EDGE_DIR: Record<Edge, { x: number; y: number }> = { N: { x: 0, y: -1 }, S: { x: 0, y: 1 }, E: { x: 1, y: 0 }, W: { x: -1, y: 0 } };

/**
 * Điểm cần tới để đi qua một lối: sát mép ngoài cùng của dải (bước vào dải theo hướng mép là sang map), giữa chiều
 * dài dải. Lùi 12px khỏi mép trái/phải và 6px khỏi mép trên/dưới vì hộp chân người chơi (11×5) không ra khỏi map được.
 */
export function exitGoal(e: MapExit, mapName: string): ResolvedTarget {
	const d = EDGE_DIR[e.edge];
	const cx = (e.x0 + e.x1) / 2;
	const cy = (e.y0 + e.y1) / 2;
	return {
		x: d.x > 0 ? e.x1 - 12 : d.x < 0 ? e.x0 + 12 : cx,
		y: d.y > 0 ? e.y1 - 6 : d.y < 0 ? e.y0 + 6 : cy,
		// Lưới tìm đường chỉ nhận ô có tâm cách đích ≤ bán kính dừng (tâm ô 24px gần nhất cách đích ~12px). Dải lối sâu
		// 48px nên người chơi luôn bước vào dải theo hướng mép — tức là đã sang map — trước khi "tới nơi".
		stop: 18,
		label: `Đi tới ${mapName}`,
	};
}

/** Bước vào dải lối và đang đi VỀ PHÍA mép đó thì sang map (đứng yên hay quay lại trong dải thì không). */
export function crossesExit(e: MapExit, x: number, y: number, dx: number, dy: number): boolean {
	if (x < e.x0 || x >= e.x1 || y < e.y0 || y >= e.y1) return false;
	const d = EDGE_DIR[e.edge];
	return dx * d.x + dy * d.y > 0;
}

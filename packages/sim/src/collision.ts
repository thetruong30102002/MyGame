/**
 * Va chạm THUẦN (không Pixi) của một vùng: nước theo ô + chân đồ vật chặn đường. `MapWorld` gọi lại đúng các
 * hàm này, test node (tìm đường, tự đi) cũng vậy — một nguồn duy nhất, không có bản sao lệch nhau.
 */

export interface CollisionMap {
	tileSize: number;
	width: number;
	height: number;
	terrain: string[];
	props: { id: string; x: number; y: number }[];
}

export interface PropFootprint {
	blocks: boolean;
	footprint: { x: number; y: number; w: number; h: number };
}

export interface Rect {
	x0: number;
	y0: number;
	x1: number;
	y1: number;
}

/** Ô băm không gian của các khối chặn (px). */
export const GRID = 96;

export type Solids = Map<string, Rect[]>;

export function addSolid(solids: Solids, r: Rect): void {
	for (let gy = Math.floor(r.y0 / GRID); gy <= Math.floor(r.y1 / GRID); gy += 1) {
		for (let gx = Math.floor(r.x0 / GRID); gx <= Math.floor(r.x1 / GRID); gx += 1) {
			const key = `${gx},${gy}`;
			const list = solids.get(key);
			if (list) list.push(r);
			else solids.set(key, [r]);
		}
	}
}

/** Khối chặn của mọi đồ vật có `blocks` (chân đồ vật, neo ở điểm chân giữa). */
export function buildSolids(data: CollisionMap, meta: Record<string, PropFootprint>): Solids {
	const solids: Solids = new Map();
	for (const p of data.props) {
		const m = meta[p.id];
		if (m?.blocks && m.footprint.w > 0) addSolid(solids, { x0: p.x + m.footprint.x, y0: p.y + m.footprint.y, x1: p.x + m.footprint.x + m.footprint.w, y1: p.y });
	}
	return solids;
}

/** Hộp chân (rộng 2·rx, cao 2·ry quanh điểm chân) có đè lên nước / đồ vật / mép map không. */
export function isBlocked(data: CollisionMap, solids: Solids, x: number, y: number, rx: number, ry: number): boolean {
	const box = { x0: x - rx, y0: y - ry, x1: x + rx, y1: y + ry };
	const t = data.tileSize;
	if (box.x0 < 0 || box.y0 < 0 || box.x1 > data.width * t || box.y1 > data.height * t) return true;
	for (let ty = Math.floor(box.y0 / t); ty <= Math.floor(box.y1 / t); ty += 1) {
		for (let tx = Math.floor(box.x0 / t); tx <= Math.floor(box.x1 / t); tx += 1) if (data.terrain[ty]?.[tx] === 'w') return true;
	}
	for (let gy = Math.floor(box.y0 / GRID); gy <= Math.floor(box.y1 / GRID); gy += 1) {
		for (let gx = Math.floor(box.x0 / GRID); gx <= Math.floor(box.x1 / GRID); gx += 1) {
			for (const r of solids.get(`${gx},${gy}`) ?? []) if (box.x0 < r.x1 && box.x1 > r.x0 && box.y0 < r.y1 && box.y1 > r.y0) return true;
		}
	}
	return false;
}

/** Di chuyển có trượt theo từng trục: kẹt trục X vẫn đi được trục Y (đi men theo tường). */
export function slideMove(blocked: (x: number, y: number, rx: number, ry: number) => boolean, pos: { x: number; y: number }, dx: number, dy: number, rx = 11, ry = 5): void {
	if (dx && !blocked(pos.x + dx, pos.y, rx, ry)) pos.x += dx;
	if (dy && !blocked(pos.x, pos.y + dy, rx, ry)) pos.y += dy;
}

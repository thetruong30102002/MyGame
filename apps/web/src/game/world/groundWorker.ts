import { renderGroundChunk, type TerrainGrid } from './groundShade';

/** Worker sinh pixel mặt đất ngoài luồng chính — luồng render không bao giờ phải chờ tính nhiễu. */
let map: TerrainGrid | null = null;

self.onmessage = (e: MessageEvent<{ type: 'init'; map: TerrainGrid } | { type: 'chunk'; key: string; ox: number; oy: number; w: number; h: number }>) => {
	const msg = e.data;
	if (msg.type === 'init') {
		map = msg.map;
		return;
	}
	if (!map) return;
	const pixels = renderGroundChunk(map, msg.ox, msg.oy, msg.w, msg.h);
	(self as unknown as Worker).postMessage({ key: msg.key, ox: msg.ox, oy: msg.oy, w: msg.w, h: msg.h, pixels }, [pixels.buffer]);
};

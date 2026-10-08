// Duyệt nhanh một nhân vật: 8 hướng đứng + chu kỳ đi, phóng to trên nền cỏ. Chạy: `npx tsx src/chargen/preview.ts`.
import { join } from 'node:path';
import { blit, createImage, fill, scaleNearest, writePng, type RGBAImage } from '../image/rgba.js';
import { humanoidFrame, M, materials, type HumanoidSpec } from './humanoid.js';
import { renderFrame } from './render.js';

const L = (pts: [number, number, number][], r0: number, r1: number, sway = false) => ({ pts, r0, r1, sway });

export const LIOR_CHILD: HumanoidSpec = {
	build: { hip: 15, neck: 28, headR: 13, shoulderW: 6.0, hipW: 3.0, upperArm: 6, foreArm: 5.5, ankle: 2.5 },
	limb: 1.4,
	colors: {
		skin: '#f4cfae',
		hair: '#9fadcc',
		eye: '#3f8fd6',
		top: '#4a7cc0',
		bottom: '#55433a',
		boots: '#6b4630',
		belt: '#7a5232',
		cape: '#2e3f78',
		metal: '#b8c2cc',
		wood: '#8a5a33',
		glow: '#9fe8ff',
		accent: '#e3bb63',
		trim: '#e3bb63',
	},
	hair: {
		cap: true,
		locks: [
			// Tóc mái dày rủ tới mí mắt, có một lọn rơi giữa hai mắt như mẫu chibi.
			L([[-0.5, 0.74, 0.55], [-0.56, 0.4, 0.92], [-0.62, 0.02, 0.97]], 0.28, 0.05),
			L([[-0.25, 0.8, 0.6], [-0.28, 0.44, 0.97], [-0.32, 0.0, 1.02]], 0.28, 0.05),
			L([[0.0, 0.82, 0.62], [0.02, 0.4, 1.0], [0.06, -0.12, 1.02]], 0.24, 0.04),
			L([[0.26, 0.8, 0.6], [0.3, 0.44, 0.97], [0.36, 0.0, 1.01]], 0.28, 0.05),
			L([[0.5, 0.74, 0.55], [0.57, 0.4, 0.92], [0.64, 0.02, 0.97]], 0.28, 0.05),
			// Tóc mai ôm má.
			L([[-0.86, 0.4, -0.05], [-1.02, -0.05, -0.02], [-0.98, -0.55, 0.02]], 0.22, 0.04),
			L([[0.86, 0.4, -0.05], [1.02, -0.05, -0.02], [0.98, -0.55, 0.02]], 0.22, 0.04),
			// Gai tóc dựng trên đỉnh và vuốt ra sau.
			L([[0, 0.85, 0.15], [0.05, 1.3, -0.05], [0.088, 1.476, -0.243]], 0.34, 0.04),
			L([[0.45, 0.8, 0.05], [0.85, 1.15, -0.1], [1.031, 1.232, -0.21]], 0.32, 0.04),
			L([[-0.45, 0.8, 0.05], [-0.9, 1.12, -0.05], [-1.093, 1.175, -0.16]], 0.32, 0.04),
			L([[0.15, 0.75, -0.45], [0.25, 1.2, -0.85], [0.277, 1.31, -1.098]], 0.34, 0.04, true),
			L([[-0.2, 0.55, -0.7], [-0.3, 0.85, -1.2], [-0.328, 0.878, -1.42]], 0.34, 0.04, true),
			L([[0.55, 0.3, -0.75], [0.95, 0.45, -1.2], [1.143, 0.395, -1.321]], 0.32, 0.04, true),
			L([[-0.55, 0.3, -0.75], [-1.0, 0.4, -1.15], [-1.193, 0.318, -1.244]], 0.32, 0.04, true),
			L([[0.85, 0.45, -0.25], [1.25, 0.55, -0.4], [1.399, 0.495, -0.483]], 0.28, 0.04),
			L([[-0.85, 0.45, -0.25], [-1.25, 0.52, -0.38], [-1.387, 0.454, -0.446]], 0.28, 0.04),
			L([[0, -0.15, -0.85], [0.05, -0.5, -1.05], [0.078, -0.693, -1.022]], 0.3, 0.05, true),
			L([[0.45, -0.1, -0.75], [0.6, -0.5, -0.9], [0.655, -0.665, -0.872]], 0.28, 0.05, true),
			L([[-0.45, -0.1, -0.75], [-0.62, -0.5, -0.88], [-0.675, -0.654, -0.847]], 0.28, 0.05, true),
		],
	},
	sleeves: 'long',
	bottom: 'pants',
	tunicSkirt: true,
	capelet: true,
	hoodDown: true,
	belt: true,
	cuffs: true,
	bootCuffs: true,
	blush: true,
	weapon: 'stick',
	trimmed: ['top', 'cape'],
};

export const YAW: Record<string, number> = { S: 0, SW: -Math.PI / 4, W: -Math.PI / 2, NW: (-3 * Math.PI) / 4, N: Math.PI, NE: (3 * Math.PI) / 4, E: Math.PI / 2, SE: Math.PI / 4 };
const SIZE = 96;
const FOOT = 90;
const PITCH = 0.34;

export function render(spec: HumanoidSpec, dir: string, motion: 'idle' | 'walk' | 'attack' | 'cast', frame: number, frames: number): RGBAImage {
	const f = humanoidFrame(spec, { motion, frame, frames });
	return renderFrame({
		width: SIZE,
		height: SIZE,
		footY: FOOT,
		yaw: YAW[dir]!,
		pitch: PITCH,
		parts: f.parts,
		materials: materials(spec),
		decals: f.decals,
		castShadows: [
			[M.hair, M.skin],
			[M.cape, M.top],
		],
		bound: { c: [0, f.height / 2, 0], r: f.height * 0.75 + 12 },
	});
}

if (process.argv[1]?.endsWith('preview.ts')) {
	const dirs = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'];
	const rows: RGBAImage[][] = [dirs.map((d) => render(LIOR_CHILD, d, 'idle', 0, 4))];
	for (const d of ['S', 'E', 'N', 'SW']) rows.push(Array.from({ length: 6 }, (_, i) => render(LIOR_CHILD, d, 'walk', i, 6)));
	const sheet = createImage(SIZE * 8, SIZE * rows.length);
	fill(sheet, [83, 128, 66, 255]);
	rows.forEach((r, y) => r.forEach((img, x) => blit(sheet, img, x * SIZE, y * SIZE)));
	const out = join(process.cwd(), 'reports/chargen');
	writePng(join(out, 'lior-sheet.png'), scaleNearest(sheet, 4));
	for (const d of dirs) {
		writePng(join(out, `frames/idle-${d}.png`), render(LIOR_CHILD, d, 'idle', 0, 4));
		for (let i = 0; i < 6; i += 1) writePng(join(out, `frames/walk-${d}-${i}.png`), render(LIOR_CHILD, d, 'walk', i, 6));
	}
	console.log('đã ghi reports/chargen/lior-sheet.png');
}

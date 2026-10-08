import { add, rotX, rotZ, type Vec3 } from './sdf.js';

/** Tỉ lệ cơ thể theo đơn vị pixel (1 đơn vị ≈ 1 pixel trên màn hình theo bề ngang). */
export interface Build {
	/** Chiều cao hông so với mặt đất. */
	hip: number;
	/** Đỉnh thân (gốc cổ). */
	neck: number;
	headR: number;
	shoulderW: number;
	hipW: number;
	upperArm: number;
	foreArm: number;
	/** Chân dài = hip - ankle, chia đôi đùi / cẳng chân. */
	ankle: number;
}

export interface Pose {
	hipC: Vec3;
	chest: Vec3;
	neck: Vec3;
	head: Vec3;
	/** [phải, trái] — bên phải nhân vật nằm phía -X. */
	hip: [Vec3, Vec3];
	knee: [Vec3, Vec3];
	ankle: [Vec3, Vec3];
	shoulder: [Vec3, Vec3];
	elbow: [Vec3, Vec3];
	hand: [Vec3, Vec3];
	/** Góc vạt áo choàng / tóc bị gió hất ra sau (radian). */
	sway: number;
	/** Pha bước chân 0–1, cho vật đi theo nhịp (đuôi, tai). */
	phase: number;
}

export type Motion = 'idle' | 'walk' | 'attack' | 'cast';

/** Hướng chi có góc `a` tính từ phương thẳng đứng, dương = hướng tới trước (+Z). */
const limb = (len: number, a: number): Vec3 => [0, -Math.cos(a) * len, Math.sin(a) * len];

/**
 * Tư thế theo động tác + chỉ số frame. Đi bộ: hông hạ thấp đúng bằng độ dang chân (chân trụ luôn chạm
 * đất) nên nhịp nhún lên xuống tự sinh ra, không phải đặt tay.
 */
export function pose(b: Build, motion: Motion, frame: number, frames: number): Pose {
	const thigh = (b.hip - b.ankle) / 2;
	const shin = thigh;
	const ph = frame / frames;
	const phi = ph * Math.PI * 2;
	let legA = [0, 0];
	let bend = [0.08, 0.08];
	let armA = [0.05, 0.05];
	let elbowBend = [0.25, 0.25];
	let armOut = [0.14, 0.14];
	let breathe = 0;
	let sway = 0.05;
	let lean = 0;

	if (motion === 'walk') {
		const A = 0.5;
		legA = [-A * Math.sin(phi), A * Math.sin(phi)];
		bend = [0.12 + 0.75 * Math.max(0, -Math.cos(phi)), 0.12 + 0.75 * Math.max(0, Math.cos(phi))];
		armA = [0.45 * Math.sin(phi), -0.45 * Math.sin(phi)];
		elbowBend = [0.3 + 0.35 * Math.max(0, Math.sin(phi)), 0.3 + 0.35 * Math.max(0, -Math.sin(phi))];
		sway = 0.28 + 0.06 * Math.cos(phi * 2);
		lean = 0.06;
	} else if (motion === 'idle') {
		breathe = [0, 0.5, 1, 0.5][frame % 4]!;
		armOut = [0.14 + breathe * 0.03, 0.14 + breathe * 0.03];
		sway = 0.05 + breathe * 0.03;
	} else if (motion === 'attack') {
		// Vung tay phải từ trên-sau chém xuống trước: 0 chuẩn bị, 1 giơ cao, 2 chém, 3 thu về.
		const k = [0, 1, 2, 3][frame % 4]!;
		armA = [[0.4, 2.6, -0.9, 0.2][k]!, [0.2, -0.3, 0.4, 0.1][k]!];
		elbowBend = [[0.6, 0.4, 0.1, 0.4][k]!, 0.4];
		legA = [[0, 0.1, 0.35, 0.15][k]!, [0, -0.1, -0.25, -0.1][k]!];
		lean = [0, -0.05, 0.18, 0.08][k]!;
		sway = [0.05, 0.1, 0.3, 0.15][k]!;
	} else {
		// Niệm phép: hai tay nâng dần ra trước, frame cuối giữ.
		const k = frame % 4;
		armA = [[0.3, 0.9, 1.4, 1.5][k]!, [0.2, 0.7, 1.2, 1.3][k]!];
		elbowBend = [[0.5, 0.4, 0.2, 0.15][k]!, [0.5, 0.4, 0.2, 0.15][k]!];
		armOut = [0.3, 0.3];
		sway = [0.08, 0.15, 0.22, 0.24][k]!;
	}

	const ankleOf = (s: number): Vec3 => {
		const k1 = limb(thigh, legA[s]!);
		const k2 = limb(shin, legA[s]! - bend[s]!);
		return [0, k1[1] + k2[1], k1[2] + k2[2]];
	};
	// Hạ hông để chân thấp hơn chạm đất.
	const drop = Math.max(...[0, 1].map((s) => thigh + shin + ankleOf(s)[1]));
	const hipY = b.hip - drop;
	const hipC: Vec3 = [0, hipY, 0];
	const hip: [Vec3, Vec3] = [add(hipC, [-b.hipW, 0, 0]), add(hipC, [b.hipW, 0, 0])];
	const knee = hip.map((h, s) => add(h, limb(thigh, legA[s]!))) as [Vec3, Vec3];
	const ankle = knee.map((k, s) => add(k, limb(shin, legA[s]! - bend[s]!))) as [Vec3, Vec3];

	const up = b.neck - b.hip - breathe * 0.6;
	const spine = rotX([0, up, 0], lean);
	const neck = add(hipC, spine);
	const chest = add(hipC, [spine[0] * 0.62, spine[1] * 0.62, spine[2] * 0.62]);
	const head = add(neck, rotX([0, b.headR * 0.92, 0], lean * 0.5));
	const shoulder: [Vec3, Vec3] = [add(neck, [-b.shoulderW, -2.2, 0]), add(neck, [b.shoulderW, -2.2, 0])];
	const elbow = shoulder.map((sh, s) => add(sh, rotZ(limb(b.upperArm, armA[s]!), (s === 0 ? -1 : 1) * armOut[s]!))) as [Vec3, Vec3];
	const hand = elbow.map((el, s) => add(el, rotZ(limb(b.foreArm, armA[s]! + elbowBend[s]!), (s === 0 ? -1 : 1) * armOut[s]! * 0.5))) as [Vec3, Vec3];
	return { hipC, chest, neck, head, hip, knee, ankle, shoulder, elbow, hand, sway, phase: ph };
}

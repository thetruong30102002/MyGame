import type { Decal, Material, RGB } from './render.js';
import { pose, type Build, type Motion, type Pose } from './rig.js';
import { add, box, capsule, cross, ellipsoid, halfSpace, intersect, lerp3, norm, rotX, roundCone, scale, sphere, subtract, type Part, type Sdf, type Vec3 } from './sdf.js';

/** Chỉ số vật liệu dùng chung cho mọi nhân vật người — bảng màu mỗi nhân vật điền theo đúng thứ tự này. */
export const M = { skin: 0, hair: 1, top: 2, bottom: 3, boots: 4, belt: 5, cape: 6, metal: 7, wood: 8, glow: 9, accent: 10, trim: 11 } as const;
type MatName = keyof typeof M;

/** Một lọn tóc: các điểm theo đơn vị bán kính đầu (gốc trên da đầu → ngọn), bán kính gốc/ngọn theo R. */
export interface Lock {
	pts: Vec3[];
	r0: number;
	r1: number;
	/** Lọn phía sau bị gió hất theo nhịp đi. */
	sway?: boolean;
}

export interface HumanoidSpec {
	build: Build;
	/** Hệ số độ dày tay chân. */
	limb: number;
	colors: Record<MatName, string> & { eye: string };
	hair: { cap: boolean; locks: Lock[] };
	sleeves: 'long' | 'short';
	bottom: 'pants' | 'robe';
	/** Vạt áo dài quá hông (áo chẽn). */
	tunicSkirt?: boolean;
	capelet?: boolean;
	cape?: boolean;
	hoodDown?: boolean;
	hat?: 'wizard' | 'helmet' | 'cap';
	weapon?: 'stick' | 'staff' | 'sword' | 'bow' | 'spear';
	belt?: boolean;
	collar?: boolean;
	cuffs?: boolean;
	bootCuffs?: boolean;
	blush?: boolean;
	/** Vật liệu có nẹp viền màu `trim` chạy quanh mép (áo khoác, áo choàng). */
	trimmed?: MatName[];
}

/** Dải 5 màu từ một màu gốc: tối ngả lạnh (tím–lam), sáng ngả ấm (vàng) — cách hoạ sĩ pixel đổi sắc theo bậc sáng. */
export function ramp(hex: string): Material['ramp'] {
	const [h, s, v] = toHsv(hex);
	const shift = (target: number, amount: number): number => {
		const d = ((target - h + 540) % 360) - 180;
		return (h + Math.sign(d) * Math.min(Math.abs(d), amount) + 360) % 360;
	};
	return [
		// Viền gần như đen (nhuốm sắc khối) — nét đậm kiểu chibi anime.
		fromHsv(shift(255, 28), Math.min(1, s * 0.5 + 0.35), Math.min(0.17, v * 0.22)),
		fromHsv(shift(250, 18), Math.min(1, s + 0.12), v * 0.6),
		fromHsv(shift(250, 10), Math.min(1, s + 0.06), v * 0.8),
		fromHsv(h, s, v),
		fromHsv(shift(55, 10), s * 0.6, Math.min(1, v * 1.15 + 0.1)),
	];
}

function toHsv(hex: string): [number, number, number] {
	const r = parseInt(hex.slice(1, 3), 16) / 255;
	const g = parseInt(hex.slice(3, 5), 16) / 255;
	const b = parseInt(hex.slice(5, 7), 16) / 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const d = max - min;
	let h = 0;
	if (d > 0) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
	return [(h * 60 + 360) % 360, max === 0 ? 0 : d / max, max];
}

function fromHsv(h: number, s: number, v: number): RGB {
	const f = (n: number): number => {
		const k = (n + h / 60) % 6;
		return Math.round((v - v * s * Math.max(0, Math.min(k, 4 - k, 1))) * 255);
	};
	return [f(5), f(3), f(1)];
}

export const hexRgb = (hex: string): RGB => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];

export function materials(spec: HumanoidSpec): Material[] {
	const order: MatName[] = ['skin', 'hair', 'top', 'bottom', 'boots', 'belt', 'cape', 'metal', 'wood', 'glow', 'accent', 'trim'];
	const t = ramp(spec.colors.trim);
	return order.map((k) => ({
		ramp: ramp(spec.colors[k]),
		shine: k === 'hair' || k === 'metal' || k === 'glow' || k === 'accent',
		shineAt: k === 'hair' ? 0.62 : undefined,
		shadeAt: k === 'hair' ? 0.22 : undefined,
		flat: k === 'glow',
		trim: spec.trimmed?.includes(k) ? ([t[3], t[2]] as const) : undefined,
	}));
}

type Put = (mat: number, d: Sdf, thin?: boolean, trim?: boolean) => void;

/** Khối 3D của nhân vật ở một tư thế. */
export function buildParts(spec: HumanoidSpec, p: Pose): { parts: Part[]; decals: Decal[] } {
	const b = spec.build;
	const k = spec.limb;
	const R = b.headR;
	const parts: Part[] = [];
	let group = 0;
	const put: Put = (mat, d, thin = false, trim = false) => {
		parts.push({ mat, d, thin, group, trim });
	};
	const robe = spec.bottom === 'robe';

	// Chân + ủng + bàn chân (áo choàng dài thì chỉ lộ cẳng dưới và bàn chân khi bước).
	for (let s = 0; s < 2; s += 1) {
		group = 4 + s;
		const bootTop = lerp3(p.knee[s]!, p.ankle[s]!, 0.3);
		if (!robe) put(M.bottom, roundCone(p.hip[s]!, p.knee[s]!, 2.6 * k, 2.25 * k));
		put(M.bottom, roundCone(p.knee[s]!, bootTop, 2.25 * k, 2.15 * k));
		put(M.boots, roundCone(bootTop, p.ankle[s]!, 2.35 * k, 2.05 * k));
		if (spec.bootCuffs) put(M.trim, ellipsoid(bootTop, [2.75 * k, 0.75 * k, 2.75 * k]));
		const a = p.ankle[s]!;
		put(M.boots, ellipsoid([a[0], Math.max(1.4 * k, a[1] - 1.2 * k), a[2] + 1.2 * k], [2.0 * k, 1.5 * k, 3.0 * k]));
	}

	group = 0;
	const torsoC = lerp3(p.hipC, p.neck, 0.58);
	const torsoR: Vec3 = [b.shoulderW - 0.4 * k, (p.neck[1] - p.hipC[1]) * 0.56, 3.5 * k];
	put(M.top, ellipsoid(torsoC, torsoR));
	put(robe || spec.tunicSkirt ? M.top : M.bottom, ellipsoid(add(p.hipC, [0, 1.2 * k, 0]), [b.hipW + 2.5 * k, 3 * k, 3.2 * k]));
	if (spec.tunicSkirt) {
		const hemZ = (p.knee[0][2] + p.knee[1][2]) * 0.3;
		// Vạt áo: dải nón cụt từ hông xuống gấu, cắt phẳng cả trên lẫn dưới (đầu tròn của nón sẽ trùm lên ngực).
		const hem = p.hipC[1] - 2.2 * k;
		const top = p.hipC[1] + 1.5 * k;
		const flare = roundCone([0, top + 6 * k, 0], [0, hem - 4 * k, hemZ], b.hipW + 1.6 * k, b.hipW + 3.8 * k);
		put(M.top, intersect(flare, (_x, y) => Math.max(hem - y, y - top)), false, true);
	}
	if (robe) {
		const hemZ = (p.ankle[0][2] + p.ankle[1][2]) * 0.35;
		put(M.bottom, roundCone(add(p.hipC, [0, 4 * k, 0]), [0, 2.6 * k, hemZ - 0.6], b.hipW + 2.4 * k, 6.8 * k));
	}
	if (spec.belt) {
		const by = p.hipC[1] + 2.4 * k;
		put(M.belt, intersect(ellipsoid(torsoC, scale(torsoR, 1.08)), (_x, y) => Math.abs(y - by) - 0.95 * k));
		put(M.accent, box([0, by, torsoR[2] * 0.98 + 0.4], [1, 0, 0], [0, 1, 0], [0, 0, 1], [1.3 * k, 1.1 * k, 0.6], 0.3));
	}
	for (let s = 0; s < 2; s += 1) put(M.top, sphere(p.shoulder[s]!, 2.4 * k));

	// Tay: cánh tay áo, cẳng tay, viền cổ tay, bàn tay.
	for (let s = 0; s < 2; s += 1) {
		group = 2 + s;
		put(M.top, roundCone(p.shoulder[s]!, p.elbow[s]!, 2.05 * k, 1.85 * k));
		put(spec.sleeves === 'long' ? M.top : M.skin, roundCone(p.elbow[s]!, p.hand[s]!, 1.85 * k, 1.6 * k));
		if (spec.cuffs) put(M.trim, sphere(lerp3(p.elbow[s]!, p.hand[s]!, 0.76), 1.9 * k));
		put(M.skin, sphere(p.hand[s]!, 1.75 * k));
	}

	group = 1;
	put(M.skin, capsule(p.neck, add(p.neck, [0, 2.5, 0]), 1.6 * k));
	if (spec.collar) put(M.trim, ellipsoid(add(p.neck, [0, -0.6 * k, 0.2 * k]), [3.0 * k, 1.3 * k, 2.8 * k]));
	const head = p.head;
	put(M.skin, ellipsoid(head, [R, R * 1.0, R * 0.95]));
	put(M.skin, sphere(add(head, [0, -0.3 * R, 0.93 * R]), 0.11 * R));

	group = 6;
	if (spec.capelet) {
		const c = add(p.neck, [0, -3.4 * k, -0.3 * k]);
		const shell = ellipsoid(c, [b.shoulderW + 2.3 * k, 4.6 * k, 4.4 * k]);
		const flare = rotX([0, -1, 0], p.sway * 0.6);
		put(M.cape, intersect(shell, halfSpace(add(p.neck, [0, -7.2 * k, 0]), flare)), false, true);
		put(M.accent, sphere(add(p.neck, [0, -1.8 * k, 3.7 * k]), 1.0 * k));
	}
	if (spec.cape) {
		const top = add(p.neck, [0, -1.6 * k, -3.2 * k]);
		const down = rotX([0, -1, 0], p.sway);
		const len = (p.neck[1] - p.hipC[1]) * 1.3;
		const u: Vec3 = [1, 0, 0];
		put(M.cape, box(add(top, scale(down, len / 2)), u, down, cross(u, down), [b.shoulderW + 0.8 * k, len / 2, 0.55], 0.4), true, true);
	}
	if (spec.hoodDown) put(M.cape, ellipsoid(add(p.neck, [0, 0.4 * k, -3.6 * k]), [4.0 * k, 3.0 * k, 2.6 * k]));

	group = 1;
	hair(spec, head, p, put);
	hat(spec, head, put);
	group = 7;
	weapon(spec, p, put);
	return { parts, decals: face(spec, head) };
}

/** Mắt, lông mày, miệng — vẽ tay từng pixel theo 3 góc nhìn (chính diện / ¾ / nghiêng). */
function face(spec: HumanoidSpec, head: Vec3): Decal[] {
	const R = spec.build.headR;
	const eye = ramp(spec.colors.eye);
	const hairR = ramp(spec.colors.hair);
	const skin = ramp(spec.colors.skin);
	const colors: Record<string, RGB> = {
		b: hairR[1],
		k: [43, 32, 52],
		w: [242, 240, 244],
		h: [255, 255, 255],
		d: eye[1],
		i: eye[3],
		I: eye[4],
		m: skin[1],
		p: [238, 150, 150],
	};
	const decals: Decal[] = [];
	// Mắt PHẢI của nhân vật (phía -X, bên trái màn hình khi nhìn thẳng); mắt trái lật gương, điểm sáng vẫn ở trên-trái.
	// Mắt chibi: mi trên đen dày, tròng 3×3 tối ở trên sáng dần xuống dưới, điểm sáng trắng góc trên-trái.
	const right = {
		front: ['kkkk', 'khdd', 'kdii', 'kiIi'],
		three: ['kkk', 'hdd', 'diI'],
		side: ['kk', 'hd', 'iI'],
	};
	const left = {
		front: ['kkkk', 'hddk', 'diik', 'iIik'],
		three: ['kkk', 'hdd', 'diI'],
		side: ['kk', 'hd', 'iI'],
	};
	for (const sx of [-1, 1]) {
		const pat = sx < 0 ? right : left;
		const n = norm([sx * 0.38, -0.22, 0.9]);
		decals.push({
			at: add(head, scale(n, R * 0.99)),
			normal: n,
			center: head,
			colors,
			onMat: M.skin,
			variants: [
				{ minFacing: 0.78, rows: pat.front, anchor: [sx < 0 ? 2 : 1, 2] },
				{ minFacing: 0.5, rows: pat.three, anchor: [1, 1] },
				{ minFacing: 0.18, rows: pat.side, anchor: [1, 1] },
			],
		});
		if (spec.blush) {
			const m = norm([sx * 0.55, -0.46, 0.7]);
			decals.push({ at: add(head, scale(m, R * 0.99)), normal: m, colors, onMat: M.skin, variants: [{ minFacing: 0.45, rows: ['pp'], anchor: [1, 0] }] });
		}
	}
	const mouth = norm([0, -0.6, 0.8]);
	decals.push({
		at: add(head, scale(mouth, R * 0.99)),
		normal: mouth,
		colors,
		onMat: M.skin,
		variants: [
			{ minFacing: 0.45, rows: ['m'], anchor: [0, 0] },
		],
	});
	return decals;
}

function hair(spec: HumanoidSpec, head: Vec3, p: Pose, put: Put): void {
	if (spec.hat === 'helmet') return;
	const R = spec.build.headR;
	const at = (v: Vec3, sway: boolean): Vec3 => add(head, scale(sway ? rotX(v, -p.sway * 0.35) : v, R));
	if (spec.hair.cap) {
		// Mũ tóc ôm đỉnh + gáy; khoét vùng mặt và nửa dưới–trước của đầu để nhìn nghiêng vẫn thấy má.
		const cap = ellipsoid(add(head, [0, 0.14 * R, -0.1 * R]), [R * 1.06, R * 1.0, R * 1.06]);
		const faceCut = ellipsoid(add(head, [0, -0.42 * R, 0.62 * R]), [R * 0.86, R * 0.76, R * 0.8]);
		const lowerFront: Sdf = (_x, y, z) => Math.max(y - (head[1] + 0.02 * R), -(z - (head[2] - 0.15 * R)));
		put(M.hair, subtract(subtract(cap, faceCut), lowerFront));
	}
	for (const lock of spec.hair.locks) {
		const pts = lock.pts.map((v) => at(v, !!lock.sway));
		for (let i = 0; i < pts.length - 1; i += 1) {
			const t0 = i / (pts.length - 1);
			const t1 = (i + 1) / (pts.length - 1);
			put(M.hair, roundCone(pts[i]!, pts[i + 1]!, (lock.r0 + (lock.r1 - lock.r0) * t0) * R, (lock.r0 + (lock.r1 - lock.r0) * t1) * R));
		}
	}
}

function hat(spec: HumanoidSpec, head: Vec3, put: Put): void {
	const R = spec.build.headR;
	if (spec.hat === 'wizard') {
		put(M.cape, ellipsoid(add(head, [0, 0.55 * R, 0]), [R * 1.75, R * 0.12, R * 1.75]), true);
		put(M.cape, roundCone(add(head, [0, 0.7 * R, 0]), add(head, [0, 2.4 * R, -0.9 * R]), R * 0.95, 0.6));
	} else if (spec.hat === 'helmet') {
		const shell = ellipsoid(add(head, [0, 0.08 * R, 0]), [R * 1.12, R * 1.08, R * 1.1]);
		const slit: Sdf = (x, y, z) => Math.max(Math.abs(y - head[1] + 0.05 * R) - 0.12 * R, -(z - head[2] - 0.2 * R), Math.abs(x - head[0]) - 0.6 * R);
		put(M.metal, subtract(shell, slit));
		put(M.accent, box(add(head, [0, 1.0 * R, -0.1 * R]), [1, 0, 0], [0, 1, 0], [0, 0, 1], [0.22 * R, 0.45 * R, 0.95 * R], 0.3));
	} else if (spec.hat === 'cap') {
		put(M.cape, intersect(ellipsoid(add(head, [0, 0.25 * R, -0.05 * R]), [R * 1.12, R * 0.95, R * 1.1]), halfSpace(add(head, [0, 0.2 * R, 0]), [0, 1, 0])));
		put(M.cape, ellipsoid(add(head, [0, 0.28 * R, 0.85 * R]), [R * 0.8, R * 0.12, R * 0.55]), true);
	}
}

function weapon(spec: HumanoidSpec, p: Pose, put: Put): void {
	const h = p.hand[0];
	const k = spec.limb;
	if (spec.weapon === 'stick') put(M.wood, capsule(add(h, [0, -5 * k, 0.8]), add(h, [-0.8, 15 * k, 2]), 0.8 * k));
	else if (spec.weapon === 'staff') {
		put(M.wood, capsule(add(h, [0, -18 * k, 0.4]), add(h, [-0.4, 16 * k, 1.2]), 0.95 * k));
		put(M.glow, sphere(add(h, [-0.45, 18 * k, 1.3]), 2.2 * k));
	} else if (spec.weapon === 'sword') {
		const dir = norm(rotX([0, -1, 0], -0.5));
		const u: Vec3 = [1, 0, 0];
		put(M.metal, box(add(h, scale(dir, 9 * k)), u, dir, cross(u, dir), [0.9 * k, 7.5 * k, 0.35 * k], 0.2), true);
		put(M.accent, box(add(h, scale(dir, 1.4 * k)), u, dir, cross(u, dir), [2.6 * k, 0.5 * k, 0.6 * k], 0.2));
	} else if (spec.weapon === 'spear') {
		put(M.wood, capsule(add(h, [0, -14 * k, 0]), add(h, [0, 20 * k, 1]), 0.8 * k));
		put(M.metal, roundCone(add(h, [0, 20 * k, 1]), add(h, [0, 25 * k, 1.2]), 1.4 * k, 0.2));
	} else if (spec.weapon === 'bow') {
		const l = p.hand[1];
		for (let i = 0; i < 6; i += 1) {
			const a0 = -1.1 + (i / 6) * 2.2;
			const a1 = -1.1 + ((i + 1) / 6) * 2.2;
			const pt = (a: number): Vec3 => add(l, [0, Math.sin(a) * 10 * k, Math.cos(a) * 3.2 * k - 2.6 * k]);
			put(M.wood, capsule(pt(a0), pt(a1), 0.7 * k));
		}
	}
}

export interface FrameRequest {
	motion: Motion;
	frame: number;
	frames: number;
}

export function humanoidFrame(spec: HumanoidSpec, req: FrameRequest): { parts: Part[]; decals: Decal[]; height: number } {
	const p = pose(spec.build, req.motion, req.frame, req.frames);
	const { parts, decals } = buildParts(spec, p);
	return { parts, decals, height: p.head[1] + spec.build.headR * 2.2 };
}

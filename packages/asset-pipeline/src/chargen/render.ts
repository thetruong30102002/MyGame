import { createImage, type RGBAImage } from '../image/rgba.js';
import { rotY, type Part, type Vec3 } from './sdf.js';

export type RGB = readonly [number, number, number];

/**
 * Vật liệu = một dải 5 màu: [viền, tối sâu, tối, gốc, sáng]. Pixel art vẽ tay chỉ dùng 3–4 bậc sáng
 * cho mỗi khối; mặt cong của SDF được LƯỢNG TỬ về đúng các bậc này nên không bao giờ ra dải màu mịn.
 */
export interface Material {
	ramp: readonly [RGB, RGB, RGB, RGB, RGB];
	/** Không đổ bóng (mắt, ngọc phát sáng): luôn tô màu gốc. */
	flat?: boolean;
	/** Bậc "sáng" chỉ dành cho vật liệu bóng (tóc, kim loại, ngọc); vải/da dừng ở màu gốc cho đỡ rối. */
	shine?: boolean;
	/** Ngưỡng (tích vô hướng pháp tuyến·hướng sáng) để lên bậc sáng — tóc anime cần vệt sáng rộng hơn kim loại. */
	shineAt?: number;
	/** Dưới ngưỡng này là bậc tối (mặc định -0.1); tóc đặt cao hơn để có nhiều mảng tối như tranh. */
	shadeAt?: number;
	/** Nẹp viền: mép các mảnh `trim` (giáp nền hoặc giáp vật liệu khác) tô màu này — [sáng, tối]. */
	trim?: readonly [RGB, RGB];
}

/** Chi tiết vẽ tay đặt lên mặt khối sau khi dựng (mắt, cúc áo): mẫu pixel neo vào một điểm 3D. */
export interface Decal {
	at: Vec3;
	/** Pháp tuyến bề mặt tại điểm (hệ toạ độ nhân vật) — quay đi quá thì không vẽ (mắt khuất sau đầu). */
	normal: Vec3;
	/**
	 * Mẫu theo độ "nhìn thẳng" của mặt khối (1 = đối diện camera): mắt nhìn chính diện vẽ to, nhìn chéo
	 * thì hẹp lại. Lấy mẫu ĐẦU TIÊN có `minFacing` ≤ độ nhìn thẳng; không mẫu nào khớp thì không vẽ.
	 */
	variants: { minFacing: number; rows: string[]; anchor: [number, number] }[];
	colors: Record<string, RGB>;
	/** Tâm khối mang chi tiết (tâm đầu): nhìn chéo thì mẫu lùi vào phía tâm, không dính viền ngoài. */
	center?: Vec3;
	/** Chỉ vẽ lên pixel thuộc vật liệu này (mắt chỉ nằm trên da mặt, không đè lên tóc mái). */
	onMat?: number;
}

export interface RenderInput {
	width: number;
	height: number;
	/** Toạ độ y (pixel) của mặt đất dưới chân nhân vật. */
	footY: number;
	/** Hướng quay người (radian, 0 = nhìn xuống màn hình / hướng S). */
	yaw: number;
	/** Góc nhìn từ trên xuống của camera (radian). */
	pitch: number;
	parts: Part[];
	materials: Material[];
	decals: Decal[];
	/** Cặp [vật liệu đổ bóng, vật liệu nhận bóng] — vd tóc đổ lên da. */
	castShadows?: [number, number][];
	/** Khối cầu bao (tâm, bán kính) để bỏ qua tia không chạm nhân vật. */
	bound: { c: Vec3; r: number };
}

/** Hướng sáng cố định theo màn hình: trên–trái–trước, khớp hướng sáng của đồ vật FreePixel. */
const LIGHT: Vec3 = (() => {
	const l: Vec3 = [-0.55, 0.78, 0.5];
	const n = Math.hypot(...l);
	return [l[0] / n, l[1] / n, l[2] / n];
})();

const EMPTY = -1;

/**
 * Dựng một frame: bắn một tia song song cho mỗi pixel (chiếu trực giao như game 2D), tìm mặt bằng
 * ray-march, lượng tử ánh sáng về bậc màu, rồi vẽ đường viền ngoài + viền trong ở chỗ khối trước che
 * khối sau. Kết quả là pixel art "sạch": mép cứng, không pixel bán trong suốt, bảng màu nhỏ.
 */
export function renderFrame(input: RenderInput): RGBAImage {
	const { width: w, height: h, parts, materials } = input;
	const cosP = Math.cos(input.pitch);
	const sinP = Math.sin(input.pitch);
	// Camera ở phía +Z, trên cao, nhìn chéo xuống: F = hướng tia, U = trục dọc màn hình, R = +X.
	const F: Vec3 = [0, -sinP, -cosP];
	const U: Vec3 = [0, cosP, -sinP];
	const cx = w / 2;
	const mat = new Int16Array(w * h).fill(EMPTY);
	const tone = new Uint8Array(w * h);
	const depth = new Float32Array(w * h).fill(Infinity);
	const thin = new Uint8Array(w * h);
	const grp = new Int16Array(w * h);
	const trimPx = new Uint8Array(w * h);
	const cosY = Math.cos(-input.yaw);
	const sinY = Math.sin(-input.yaw);
	const toModel = (x: number, y: number, z: number): Vec3 => [x * cosY + z * sinY, y, -x * sinY + z * cosY];
	const [bx, by, bz] = input.bound.c;
	const br = input.bound.r;

	const field = (x: number, y: number, z: number): number => {
		let d = Infinity;
		for (let i = 0; i < parts.length; i += 1) {
			const v = parts[i]!.d(x, y, z);
			if (v < d) d = v;
		}
		return d;
	};
	const nearest = (x: number, y: number, z: number): number => {
		let d = Infinity;
		let k = 0;
		for (let i = 0; i < parts.length; i += 1) {
			const v = parts[i]!.d(x, y, z);
			if (v < d) {
				d = v;
				k = i;
			}
		}
		return k;
	};

	for (let py = 0; py < h; py += 1) {
		for (let px = 0; px < w; px += 1) {
			// Tâm pixel trên mặt phẳng ảnh đi qua gốc chân nhân vật.
			const sx = px + 0.5 - cx;
			const sy = input.footY - (py + 0.5);
			const wx = sx;
			const wy = sy * U[1];
			const wz = sy * U[2];
			// Đưa tia về hệ toạ độ nhân vật (xoay ngược hướng quay người).
			const [ox, oy, oz] = toModel(wx - F[0] * 200, wy - F[1] * 200, wz - F[2] * 200);
			const [dx, dy, dz] = toModel(F[0], F[1], F[2]);
			// Cắt tia với khối cầu bao.
			const lx = ox - bx;
			const ly = oy - by;
			const lz = oz - bz;
			const b = lx * dx + ly * dy + lz * dz;
			const c = lx * lx + ly * ly + lz * lz - br * br;
			const disc = b * b - c;
			if (disc < 0) continue;
			let t = Math.max(0, -b - Math.sqrt(disc));
			const tEnd = -b + Math.sqrt(disc);
			let hit = false;
			for (let i = 0; i < 160 && t < tEnd; i += 1) {
				const v = field(ox + dx * t, oy + dy * t, oz + dz * t);
				if (v < 0.02) {
					hit = true;
					break;
				}
				t += Math.max(v * 0.9, 0.02);
			}
			if (!hit) continue;
			const hx = ox + dx * t;
			const hy = oy + dy * t;
			const hz = oz + dz * t;
			const k = nearest(hx, hy, hz);
			const part = parts[k]!;
			const e = 0.25;
			const nx = part.d(hx + e, hy, hz) - part.d(hx - e, hy, hz);
			const ny = part.d(hx, hy + e, hz) - part.d(hx, hy - e, hz);
			const nz = part.d(hx, hy, hz + e) - part.d(hx, hy, hz - e);
			const nl = Math.hypot(nx, ny, nz) || 1;
			const n = rotY([nx / nl, ny / nl, nz / nl], input.yaw);
			const l = n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2];
			const m = materials[part.mat]!;
			const i = py * w + px;
			mat[i] = part.mat;
			depth[i] = t;
			thin[i] = part.thin ? 1 : 0;
			grp[i] = part.group ?? 0;
			trimPx[i] = part.trim ? 1 : 0;
			tone[i] = m.flat ? 3 : l > (m.shineAt ?? 0.6) ? (m.shine ? 4 : 3) : l > (m.shadeAt ?? -0.1) ? 3 : l > -0.5 ? 2 : 1;
		}
	}

	cleanTones(mat, tone, w, h);
	// Bóng kiểu anime: khối có `castsOn` đổ bóng xuống 2px khối nhận ngay bên dưới (tóc mái → trán).
	for (const [caster, receiver] of input.castShadows ?? []) {
		for (let py = h - 1; py >= 2; py -= 1) {
			for (let px = 0; px < w; px += 1) {
				const i = py * w + px;
				if (mat[i] !== receiver || tone[i]! < 2) continue;
				if (mat[i - w] === caster || mat[i - 2 * w] === caster) tone[i] = 2;
			}
		}
	}

	const out = createImage(w, h);
	const put = (i: number, c: RGB): void => {
		out.data[i * 4] = c[0];
		out.data[i * 4 + 1] = c[1];
		out.data[i * 4 + 2] = c[2];
		out.data[i * 4 + 3] = 255;
	};
	const N4 = [
		[1, 0],
		[-1, 0],
		[0, 1],
		[0, -1],
	] as const;
	for (let py = 0; py < h; py += 1) {
		for (let px = 0; px < w; px += 1) {
			const i = py * w + px;
			if (mat[i] === EMPTY) continue;
			const m = materials[mat[i]!]!;
			// Viền trong: khối khác nằm TRƯỚC pixel này → nét tối tách hai khối. Khác bộ phận (tay trước thân) chỉ cần chênh
			// chút ít; cùng bộ phận cùng màu (các gai tóc) phải chênh nhiều, không thì tóc lổn nhổn vệt tối.
			let contour = false;
			let fold = false;
			for (const [ox, oy] of N4) {
				const qx = px + ox;
				const qy = py + oy;
				if (qx < 0 || qy < 0 || qx >= w || qy >= h) continue;
				const j = qy * w + qx;
				if (mat[j] === EMPTY || thin[j]) continue;
				if (grp[j] !== grp[i] ? depth[j]! < depth[i]! - 1.2 : mat[j] !== mat[i] && depth[j]! < depth[i]! - 2.5) contour = true;
				// Cùng bộ phận cùng màu nhưng chênh sâu (lọn tóc chồng lọn tóc, nếp áo): nét tối vừa, không đen.
				else if (mat[j] === mat[i] && depth[j]! < depth[i]! - 3) fold = true;
			}
			let trimmed = false;
			if (m.trim && trimPx[i] && !contour) {
				for (const [ox, oy] of N4) {
					const qx = px + ox;
					const qy = py + oy;
					const j = qx < 0 || qy < 0 || qx >= w || qy >= h ? -1 : qy * w + qx;
					if (j < 0 || mat[j] !== mat[i]) trimmed = true;
				}
			}
			put(i, contour ? m.ramp[0] : fold ? m.ramp[1] : trimmed ? m.trim![tone[i]! >= 3 ? 0 : 1] : m.ramp[tone[i]!]!);
		}
	}

	paintDecals(input, out, mat, depth, F, U, cx);

	// Viền ngoài 1px bao quanh hình, màu viền của khối gần camera nhất kề bên.
	const outline: [number, RGB][] = [];
	for (let py = 0; py < h; py += 1) {
		for (let px = 0; px < w; px += 1) {
			const i = py * w + px;
			if (mat[i] !== EMPTY) continue;
			let best = -1;
			for (const [ox, oy] of N4) {
				const qx = px + ox;
				const qy = py + oy;
				if (qx < 0 || qy < 0 || qx >= w || qy >= h) continue;
				const j = qy * w + qx;
				if (mat[j] !== EMPTY && (best < 0 || depth[j]! < depth[best]!)) best = j;
			}
			if (best >= 0) outline.push([i, materials[mat[best]!]!.ramp[0]]);
		}
	}
	for (const [i, c] of outline) put(i, c);
	return out;
}

/**
 * Bỏ "pixel mồ côi": một pixel khác bậc sáng với cả 4 pixel cùng vật liệu quanh nó là nhiễu của phép
 * lượng tử, hoạ sĩ không bao giờ đặt nó → đổi về bậc phổ biến nhất xung quanh.
 */
function cleanTones(mat: Int16Array, tone: Uint8Array, w: number, h: number): void {
	const copy = tone.slice();
	for (let y = 1; y < h - 1; y += 1) {
		for (let x = 1; x < w - 1; x += 1) {
			const i = y * w + x;
			if (mat[i] === EMPTY) continue;
			const counts = [0, 0, 0, 0, 0];
			let same = 0;
			let diff = 0;
			for (const j of [i - 1, i + 1, i - w, i + w]) {
				if (mat[j] !== mat[i]) continue;
				counts[copy[j]!]! += 1;
				if (copy[j] === copy[i]) same += 1;
				else diff += 1;
			}
			if (same === 0 && diff >= 3) tone[i] = counts.indexOf(Math.max(...counts));
		}
	}
}

function paintDecals(input: RenderInput, out: RGBAImage, mat: Int16Array, depth: Float32Array, F: Vec3, U: Vec3, cx: number): void {
	const w = input.width;
	for (const d of input.decals) {
		const n = rotY(d.normal, input.yaw);
		// Mặt hướng về camera khi pháp tuyến ngược chiều tia nhìn.
		const facing = -(n[0] * F[0] + n[1] * F[1] + n[2] * F[2]);
		const v = d.variants.find((x) => facing >= x.minFacing);
		if (!v) continue;
		const p = rotY(d.at, input.yaw);
		let sx = Math.floor(cx + p[0]);
		if (d.center && facing < 0.6) sx += Math.sign(rotY(d.center, input.yaw)[0] - p[0]) * (facing < 0.4 ? 2 : 1);
		const sy = Math.floor(input.footY - (p[0] * 0 + p[1] * U[1] + p[2] * U[2]));
		const t = p[0] * F[0] + p[1] * F[1] + p[2] * F[2] + 200;
		const ci = sy * w + sx;
		if (sx < 0 || sy < 0 || sx >= w || sy >= input.height) continue;
		// Bị khối khác che (tóc mái, tay) thì không vẽ. Mặt càng nghiêng thì độ sâu trong 1 pixel đổi càng nhanh → nới ngưỡng.
		if (mat[ci] === EMPTY || depth[ci]! < t - 2 - 4 * (1 - facing)) continue;
		v.rows.forEach((row, ry) => {
			[...row].forEach((ch, rx) => {
				const c = d.colors[ch];
				if (!c) return;
				const x = sx + rx - v.anchor[0];
				const y = sy + ry - v.anchor[1];
				if (x < 0 || y < 0 || x >= w || y >= input.height) return;
				const j = y * w + x;
				if (mat[j] === EMPTY || (d.onMat !== undefined && mat[j] !== d.onMat)) return;
				out.data[j * 4] = c[0];
				out.data[j * 4 + 1] = c[1];
				out.data[j * 4 + 2] = c[2];
				out.data[j * 4 + 3] = 255;
			});
		});
	}
}

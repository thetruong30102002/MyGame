/**
 * Hình khối 3D dạng hàm khoảng cách có dấu (SDF) để dựng "con rối" nhân vật. Mỗi hình trả về khoảng
 * cách từ điểm tới mặt (âm = bên trong). Viết thành closure trên số thô (không cấp phát vector) vì một
 * frame gọi hàm vài triệu lần.
 */
export type Vec3 = readonly [number, number, number];
export type Sdf = (x: number, y: number, z: number) => number;

export interface Part {
	/** Chỉ số vật liệu (màu) trong bảng của nhân vật. */
	mat: number;
	d: Sdf;
	/** Phần mỏng (vành mũ, cánh) không có đường viền trong với phần nằm sau nó. */
	thin?: boolean;
	/** Bộ phận (thân, đầu, từng tay, từng chân…): hai bộ phận khác nhau chồng lên nhau luôn có nét viền tách. */
	group?: number;
	/** Mảnh có nẹp viền (màu `trim` của vật liệu) chạy quanh mép giáp nền / giáp vật liệu khác. */
	trim?: boolean;
}

export function sphere(c: Vec3, r: number): Sdf {
	const [cx, cy, cz] = c;
	return (x, y, z) => Math.hypot(x - cx, y - cy, z - cz) - r;
}

/** Ellipsoid gần đúng (Inigo Quilez) — đủ chính xác cho việc tìm mặt bằng ray-march. */
export function ellipsoid(c: Vec3, r: Vec3): Sdf {
	const [cx, cy, cz] = c;
	const [rx, ry, rz] = r;
	return (x, y, z) => {
		const px = (x - cx) / rx;
		const py = (y - cy) / ry;
		const pz = (z - cz) / rz;
		const k0 = Math.hypot(px, py, pz);
		const k1 = Math.hypot(px / rx, py / ry, pz / rz);
		return k1 === 0 ? -Math.min(rx, ry, rz) : (k0 * (k0 - 1)) / k1;
	};
}

/** Ống bo tròn hai đầu, bán kính đổi tuyến tính từ `ra` (đầu a) tới `rb` (đầu b) — chân tay, thân, nón. */
export function roundCone(a: Vec3, b: Vec3, ra: number, rb: number): Sdf {
	const bax = b[0] - a[0];
	const bay = b[1] - a[1];
	const baz = b[2] - a[2];
	const l2 = bax * bax + bay * bay + baz * baz;
	if (l2 < 1e-6) return sphere(a, Math.max(ra, rb));
	const rr = ra - rb;
	const a2 = l2 - rr * rr;
	const il2 = 1 / l2;
	return (x, y, z) => {
		const pax = x - a[0];
		const pay = y - a[1];
		const paz = z - a[2];
		const py = pax * bax + pay * bay + paz * baz;
		const pz = py - l2;
		const qx = pax * l2 - bax * py;
		const qy = pay * l2 - bay * py;
		const qz = paz * l2 - baz * py;
		const x2 = qx * qx + qy * qy + qz * qz;
		const y2 = py * py * l2;
		const z2 = pz * pz * l2;
		const k = Math.sign(rr) * rr * rr * x2;
		if (Math.sign(pz) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - rb;
		if (Math.sign(py) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - ra;
		return (Math.sqrt(x2 * a2 * il2) + py * rr) * il2 - ra;
	};
}

export function capsule(a: Vec3, b: Vec3, r: number): Sdf {
	return roundCone(a, b, r, r);
}

/**
 * Hộp bo góc xoay tuỳ ý: `u`, `v`, `w` là 3 trục ĐƠN VỊ vuông góc của hộp, `half` nửa kích thước theo
 * từng trục. Dùng cho áo choàng, khiên, lưỡi kiếm dẹt.
 */
export function box(c: Vec3, u: Vec3, v: Vec3, w: Vec3, half: Vec3, round = 0): Sdf {
	return (x, y, z) => {
		const px = x - c[0];
		const py = y - c[1];
		const pz = z - c[2];
		const qx = Math.abs(px * u[0] + py * u[1] + pz * u[2]) - half[0] + round;
		const qy = Math.abs(px * v[0] + py * v[1] + pz * v[2]) - half[1] + round;
		const qz = Math.abs(px * w[0] + py * w[1] + pz * w[2]) - half[2] + round;
		const out = Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0));
		return out + Math.min(Math.max(qx, qy, qz), 0) - round;
	};
}

/** Phần của `a` nằm ngoài `b`. */
export function subtract(a: Sdf, b: Sdf): Sdf {
	return (x, y, z) => Math.max(a(x, y, z), -b(x, y, z));
}

export function intersect(a: Sdf, b: Sdf): Sdf {
	return (x, y, z) => Math.max(a(x, y, z), b(x, y, z));
}

/** Nửa không gian phía `n` của mặt phẳng qua `p` (n đơn vị) — dùng để cắt mái tóc, vành mũ. */
export function halfSpace(p: Vec3, n: Vec3): Sdf {
	return (x, y, z) => (x - p[0]) * n[0] + (y - p[1]) * n[1] + (z - p[2]) * n[2];
}

export const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const scale = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
export const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export function norm(a: Vec3): Vec3 {
	const l = Math.hypot(a[0], a[1], a[2]) || 1;
	return [a[0] / l, a[1] / l, a[2] / l];
}
export function cross(a: Vec3, b: Vec3): Vec3 {
	return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

/** Xoay vector quanh trục X (cúi/ngửa, đá chân tới/lui) — góc dương đưa +Y về phía +Z. */
export function rotX(v: Vec3, a: number): Vec3 {
	const c = Math.cos(a);
	const s = Math.sin(a);
	return [v[0], v[1] * c - v[2] * s, v[1] * s + v[2] * c];
}

/** Xoay quanh trục Y (quay người) — góc dương đưa +Z về phía +X. */
export function rotY(v: Vec3, a: number): Vec3 {
	const c = Math.cos(a);
	const s = Math.sin(a);
	return [v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c];
}

/** Xoay quanh trục Z (dang tay sang ngang) — góc dương đưa +Y về phía -X. */
export function rotZ(v: Vec3, a: number): Vec3 {
	const c = Math.cos(a);
	const s = Math.sin(a);
	return [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]];
}

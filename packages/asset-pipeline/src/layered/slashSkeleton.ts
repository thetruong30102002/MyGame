/**
 * Khung xương đòn chém cho animate_with_skeleton_v3: từ khung xương ảnh đứng (estimate-skeleton) + bảng tư thế chính
 * (`skeleton/slash-<hướng>.spec.json`: điểm nắm, hướng lưỡi, nghiêng người, bước chân từng khung) dựng đủ 18 khớp COCO-18 cho mỗi khung.
 * Khuỷu tay tính bằng IK hai đoạn theo đúng độ dài xương đo trên ảnh đứng — không kéo dài tay. Kèm điểm nắm / góc lưỡi từng khung để
 * đặt kiếm vẽ riêng (lớp vũ khí tách khỏi thân). Toạ độ trả về là tỉ lệ 0–1 của ảnh ĐÃ ĐỆM (pad) gửi lên PixelLab.
 */
import type { Keypoint } from '../pixellab/skeleton.js';
import type { Point } from './standard.js';

export interface SlashFrameSpec {
	/** Điểm nắm ghi thẳng toạ độ ảnh đứng, HOẶC `arm`: [góc tay phải tính từ vai (0 = trước mặt, 90 = lên trời), độ duỗi 0–1 của tầm với]. */
	grip?: Point;
	arm?: [number, number];
	/** Hướng chuôi giữa hai nắm tay (đặt tay trái dọc chuôi). */
	bladeDeg: number;
	/**
	 * Góc kiếm vẽ ra nếu khác bladeDeg — chỉnh lớp vũ khí mà không vẽ lại thân (hai nắm tay sát nhau nên chuôi xoay được). Chủ dự án 29/10:
	 * "kiếm cứ xoay ngang sang bên trái như múa quạt — vẽ thẳng lên rồi bổ xuống".
	 */
	weaponDeg?: number;
	lean: number;
	/**
	 * Đổ thân dọc ảnh (px, + = xuống): hướng S đổ người về người xem / N ra xa (chủ dự án 30/10: "chính diện cũng bước 1 chân lên mà đâm,
	 * xoài người lên trước ấy nhìn mới lực"). Chỉ thân trên, hông theo `hip`.
	 */
	leanY?: number;
	hip: Point;
	step: number;
	back: number;
	/** Dời bàn chân phải / trái dọc ảnh (px, + = xuống): bước chân về / ra xa người xem ở hướng S / N. */
	stepY?: number;
	backY?: number;
	/** Xoay vuông thân theo đường chém 0–1: vai trái (lệch trước vai phải khi nhìn ngang) kéo về sát vai phải để hai tay cùng duỗi thẳng. */
	square?: number;
	/**
	 * Tay duỗi thẳng CHĨA VỀ NGƯỜI XEM (hướng S bổ xuống): trên ảnh tay ngắn lại — khuỷu đặt thẳng hàng vai → cổ tay (không gập) và
	 * cổ tay / khuỷu có độ sâu gần người xem (giá trị = depth cổ tay, khuỷu lấy nửa đường từ 128).
	 */
	forward?: number;
	/** Hình chiếu lưỡi 0–1 (1 = nằm trong mặt tranh; nhỏ = mũi chĩa về người xem). */
	bladeLen?: number;
	/** Kiếm vẽ SAU thân / đầu (thủ thế kiếm trên vai, lưỡi ngả ra sau vai — hướng S). */
	behind?: boolean;
	/**
	 * Đặt tay bằng tay (toạ độ ảnh đứng, không IK) cho vũ khí MỘT TAY — khiên đeo tay phải nhìn sau lưng (chủ dự án 30/10, class Khiên): tay
	 * trái không vươn chéo qua lưng tới khiên mà thả bên sườn. `wristL` thay cổ tay trái dọc chuôi; `elbowR` / `elbowL` thay khuỷu IK;
	 * `depthR` / `depthL` độ sâu cổ tay (< 128 = chĩa ra xa người xem, khuỷu lấy nửa đường); `weaponAt` = chỗ đặt vũ khí (mặc định giữa hai
	 * cổ tay).
	 */
	wristL?: Point;
	elbowR?: Point;
	elbowL?: Point;
	depthR?: number;
	depthL?: number;
	weaponAt?: Point;
	/**
	 * Cung (class Cung, chủ dự án 30/10): `staveDeg` hướng nhánh trên thân cung trên ảnh (mặc định vuông góc hướng bắn `weaponDeg`);
	 * `string`: "hand" = dây kéo tới nắm tay phải, "rest" = dây thẳng (đã buông); `arrow`: mũi tên còn lắp trên dây.
	 */
	staveDeg?: number;
	string?: 'hand' | 'rest';
	arrow?: boolean;
}

export interface SlashSpec {
	direction: string;
	/** Đệm trong suốt [trái, phải, trên, dưới] quanh ảnh đứng — chỗ cho tay giơ cao / bước tới. */
	pad: [number, number, number, number];
	/** Khoảng cách tay trái dưới tay phải dọc chuôi (về phía chuôi). */
	handGapPx: number;
	/** Gối gập: `forward` (nhìn ngang — gối về phía trước, x lớn) hoặc `out` (nhìn chính diện — hai gối mở ra hai bên). Mặc định forward. */
	/** `outBack`: như `out` nhưng nhìn từ sau (tay / chân phải ở bên PHẢI ảnh) — gối trái mở về x nhỏ, phải về x lớn. */
	/**
	 * `depth`: gối gập THEO CHIỀU SÂU (bắt buộc cho đòn hướng thẳng N / S — luật 31/10): gối nằm trên đường thẳng hông → cổ chân, không
	 * bẻ ngang; chân bước về hướng đánh gập gối về phía đó (độ sâu), chân sau thẳng.
	 */
	knees?: 'forward' | 'out' | 'outBack' | 'depth';
	/**
	 * Thế chân đòn hướng thẳng (chủ dự án 31/10: "tấn công hướng chính diện chân đừng trùng xuống", "chỉ có tiến lên và thấp nhân vật
	 * xuống mà tấn công, ví dụ kiếm, thương"): `lunge` (cận chiến — kiếm, thương, khiên): chỉ hạ người khi bước một chân về hướng đánh,
	 * hạ hông ≤ độ bước + 1 px; `upright` (cung, trượng): đứng thẳng, hạ hông ≤ 1 px, bàn chân dời ≤ 2 px. `kneel` (CHỈ động tác gia viên
	 * — gieo hạt / thu hoạch, 06/11; không phải đòn đánh): ngồi thụp, gối vẫn `depth` (không bè hai bên), hạ hông ≤ 12 px, bàn chân dời ≤ 4 px.
	 */
	stance?: 'lunge' | 'upright' | 'kneel';
	frames: SlashFrameSpec[];
}

export interface SlashFrame {
	keypoints: Keypoint[];
	/** Điểm nắm (cổ tay phải) và hướng lưỡi, toạ độ pixel ảnh đã đệm. */
	grip: Point;
	bladeDeg: number;
	bladeLen?: number;
	behind?: boolean;
	bow?: { staveDeg?: number; string: 'hand' | 'rest'; arrow: boolean };
}

type Joints = Record<string, [number, number, number]>;

const dist = (a: readonly number[], b: readonly number[]): number => Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!);

/** Vai trái khi thân xoay vuông hẳn: sát vai phải, cao hơn 1px (nhìn ngang hai vai gần chồng lên nhau). */
const SQUARE_OFFSET = [1, -1] as const;

/** IK hai đoạn: khuỷu nằm phía DƯỚI đường vai → cổ tay (gối / khuỷu tự nhiên khi giơ kiếm). Xa quá tầm thì duỗi thẳng về phía cổ tay. */
export function solveElbow(shoulder: readonly number[], wrist: readonly number[], upper: number, lower: number, bendSign = 1): [number, number] {
	const d = Math.min(dist(shoulder, wrist), upper + lower - 1e-6);
	const ux = (wrist[0]! - shoulder[0]!) / (dist(shoulder, wrist) || 1);
	const uy = (wrist[1]! - shoulder[1]!) / (dist(shoulder, wrist) || 1);
	const a = (upper * upper - lower * lower + d * d) / (2 * d);
	const h = Math.sqrt(Math.max(0, upper * upper - a * a));
	const mx = shoulder[0]! + ux * a;
	const my = shoulder[1]! + uy * a;
	// Hai nghiệm vuông góc với trục vai–cổ tay; chọn nghiệm có y lớn hơn (thấp hơn) theo bendSign.
	const c1: [number, number] = [mx - uy * h, my + ux * h];
	const c2: [number, number] = [mx + uy * h, my - ux * h];
	return (c1[1] >= c2[1]) === bendSign > 0 ? c1 : c2;
}

/** Dời cổ tay về trong tầm với (giữ hướng) — bảng tư thế đặt xa quá thì báo lỗi để sửa bảng, không kéo dài tay im lặng. */
export function checkReach(shoulder: readonly number[], wrist: readonly number[], reach: number, label: string): void {
	if (dist(shoulder, wrist) > reach + 0.5) throw new Error(`${label}: cổ tay cách vai ${dist(shoulder, wrist).toFixed(1)}px > tầm với ${reach.toFixed(1)}px — sửa bảng tư thế`);
}

/**
 * Luật chân đòn hướng thẳng N / S (chủ dự án 31/10): không chùng chân bè ra hai bên như ngồi xổm — gối `depth`, khai `stance`; cận
 * chiến chỉ hạ người khi bước một chân về hướng đánh, đánh xa / phép đứng thẳng chân. Sai luật thì báo lỗi để sửa bảng tư thế.
 */
export function checkStraightStance(spec: SlashSpec): void {
	if (spec.direction !== 'north' && spec.direction !== 'south') return;
	const at = `bảng tư thế ${spec.direction}`;
	if (spec.knees !== 'depth') throw new Error(`${at}: đòn hướng thẳng phải gối "depth" (không bẻ gối ra hai bên — chủ dự án 31/10 "chân đừng trùng xuống")`);
	if (!spec.stance) throw new Error(`${at}: cần khai stance "lunge" (kiếm / thương / khiên) hoặc "upright" (cung / trượng)`);
	const toward = spec.direction === 'north' ? -1 : 1;
	spec.frames.forEach((f, i) => {
		const drop = f.hip[1];
		const step = Math.max(0, toward * (f.stepY ?? 0), toward * (f.backY ?? 0));
		if (spec.stance === 'upright' && (drop > 1 || Math.abs(f.stepY ?? 0) > 2 || Math.abs(f.backY ?? 0) > 2))
			throw new Error(`${at} khung ${i + 1}: thế đứng thẳng — hạ hông ${drop} px (≤ 1), bàn chân dời ≤ 2 px`);
		if (spec.stance === 'kneel' && (drop > 12 || Math.abs(f.stepY ?? 0) > 4 || Math.abs(f.backY ?? 0) > 4))
			throw new Error(`${at} khung ${i + 1}: thế ngồi thụp — hạ hông ${drop} px (≤ 12), bàn chân dời ≤ 4 px`);
		if (spec.stance === 'lunge' && drop > step + 1)
			throw new Error(`${at} khung ${i + 1}: hạ hông ${drop} px mà chỉ bước ${step} px về hướng đánh — chỉ hạ người khi bước chân lên (≤ bước + 1)`);
	});
}

export function buildSlash(spec: SlashSpec, rest: Keypoint[], size: [number, number]): SlashFrame[] {
	checkStraightStance(spec);
	const [pl, pr, pt, pb] = spec.pad;
	const W = size[0] + pl + pr;
	const H = size[1] + pt + pb;
	const r: Joints = {};
	// PixelLab chỉ nhận z_index nguyên (estimate-skeleton trả số lẻ như −3,5 — lỗi thật 29/10).
	for (const k of rest) r[k.label] = [k.x * size[0], k.y * size[1], Math.round(k.z_index)];
	const need = ['NECK', 'NOSE', 'RIGHT SHOULDER', 'RIGHT ELBOW', 'RIGHT ARM', 'LEFT SHOULDER', 'LEFT ELBOW', 'LEFT ARM', 'RIGHT HIP', 'RIGHT KNEE', 'RIGHT LEG', 'LEFT HIP', 'LEFT KNEE', 'LEFT LEG', 'RIGHT EYE', 'LEFT EYE', 'RIGHT EAR', 'LEFT EAR'];
	for (const n of need) if (!r[n]) throw new Error(`Khung xương ảnh đứng thiếu khớp ${n}`);
	const len = (a: string, b: string): number => dist(r[a]!, r[b]!);
	const upper = { R: len('RIGHT SHOULDER', 'RIGHT ELBOW'), L: len('LEFT SHOULDER', 'LEFT ELBOW') };
	const lower = { R: len('RIGHT ELBOW', 'RIGHT ARM'), L: len('LEFT ELBOW', 'LEFT ARM') };
	const thigh = { R: len('RIGHT HIP', 'RIGHT KNEE'), L: len('LEFT HIP', 'LEFT KNEE') };
	const shin = { R: len('RIGHT KNEE', 'RIGHT LEG'), L: len('LEFT KNEE', 'LEFT LEG') };
	const upperBody = ['NECK', 'NOSE', 'RIGHT EYE', 'LEFT EYE', 'RIGHT EAR', 'LEFT EAR', 'RIGHT SHOULDER', 'LEFT SHOULDER'];
	return spec.frames.map((f, i) => {
		const j: Joints = {};
		const at = `khung ${i + 1}`;
		// Thân trên: theo hông + nghiêng; hông: dời [dx, dy].
		for (const n of upperBody) j[n] = [r[n]![0] + f.hip[0] + f.lean, r[n]![1] + f.hip[1] + (f.leanY ?? 0), r[n]![2]];
		if (f.square) {
			const [rx, ry] = j['RIGHT SHOULDER']!;
			const [lx, ly, lz] = j['LEFT SHOULDER']!;
			j['LEFT SHOULDER'] = [lx + (rx + SQUARE_OFFSET[0] - lx) * f.square, ly + (ry + SQUARE_OFFSET[1] - ly) * f.square, lz];
		}
		for (const n of ['RIGHT HIP', 'LEFT HIP']) j[n] = [r[n]![0] + f.hip[0], r[n]![1] + f.hip[1], r[n]![2]];
		// Tay: hai nắm tay quanh điểm nắm (tâm chuôi), xem dưới.
		const rad = (f.bladeDeg * Math.PI) / 180;
		const sR = j['RIGHT SHOULDER']!;
		const reachR = upper.R + lower.R;
		// Vung thẳng tay (chủ dự án 29/10: "phải vung thẳng tay nhìn lực hơn"): góc + độ duỗi tính từ vai, duỗi 1 = tay thẳng hết tầm.
		if (f.arm && f.arm[1] > 1) throw new Error(`${at}: độ duỗi ${f.arm[1]} > 1 — tay không dài thêm được`);
		// `arm` đặt CỔ TAY PHẢI (duỗi 1 = tay phải thẳng hết tầm); tay trái nắm sát bên dọc chuôi (handGapPx), phía nào duỗi được hơn;
		// điểm nắm của kiếm = giữa hai nắm tay.
		let wristR: [number, number] = f.arm
			? [sR[0] + Math.cos((f.arm[0] * Math.PI) / 180) * f.arm[1] * reachR, sR[1] - Math.sin((f.arm[0] * Math.PI) / 180) * f.arm[1] * reachR]
			: f.grip ? [f.grip[0], f.grip[1]] : (() => { throw new Error(`${at}: cần grip hoặc arm`); })();
		const sL = j['LEFT SHOULDER']!;
		const reachL = upper.L + lower.L;
		const along = (k: number): [number, number] => [wristR[0] + Math.cos(rad) * k, wristR[1] - Math.sin(rad) * k];
		const options = [along(spec.handGapPx), along(-spec.handGapPx)];
		let wristL = f.wristL ? ([f.wristL[0], f.wristL[1]] as [number, number]) : options.reduce((best, w) => (Math.abs(reachL - Math.min(dist(sL, w), reachL + 9)) < Math.abs(reachL - Math.min(dist(sL, best), reachL + 9)) && dist(sL, w) <= reachL + 1.5 ? w : best));
		// Quá tầm 1–2px (vai lệch) → cổ tay trượt về phía vai, tay thẳng hết tầm.
		const clamp = (sh: readonly number[], w: [number, number], reach: number): [number, number] => {
			const d = dist(sh, w);
			return d <= reach ? w : [sh[0]! + ((w[0] - sh[0]!) * (reach - 1e-3)) / d, sh[1]! + ((w[1] - sh[1]!) * (reach - 1e-3)) / d];
		};
		checkReach(sR, wristR, reachR, `${at} tay phải`);
		wristR = clamp(sR, wristR, reachR);
		wristL = clamp(sL, wristL, reachL);
		const grip: Point = f.weaponAt ? [f.weaponAt[0], f.weaponAt[1]] : [(wristR[0] + wristL[0]) / 2, (wristR[1] + wristL[1]) / 2];
		j['RIGHT ARM'] = [...wristR, r['RIGHT ARM']![2]];
		j['LEFT ARM'] = [...wristL, r['LEFT ARM']![2]];
		const depth: Record<string, number> = {};
		if (f.forward) {
			// Tay chĩa về người xem: khuỷu thẳng hàng, không gập; độ sâu báo cho PixelLab đây là tay thẳng bị thu ngắn.
			for (const [side, sh, w, up, lo] of [['RIGHT', sR, wristR, upper.R, lower.R], ['LEFT', sL, wristL, upper.L, lower.L]] as const) {
				const t = up / (up + lo);
				j[`${side} ELBOW`] = [sh[0]! + (w[0] - sh[0]!) * t, sh[1]! + (w[1] - sh[1]!) * t, r[`${side} ELBOW`]![2]];
				depth[`${side} ARM`] = f.forward;
				depth[`${side} ELBOW`] = Math.round(128 + (f.forward - 128) / 2);
			}
		} else {
			j['RIGHT ELBOW'] = [...solveElbow(j['RIGHT SHOULDER']!, wristR, upper.R, lower.R), r['RIGHT ELBOW']![2]];
			j['LEFT ELBOW'] = [...solveElbow(j['LEFT SHOULDER']!, wristL, upper.L, lower.L), r['LEFT ELBOW']![2]];
		}
		// Tay đặt bằng tay (vũ khí một tay): khuỷu / độ sâu theo bảng tư thế.
		for (const [side, e, dep] of [['RIGHT', f.elbowR, f.depthR], ['LEFT', f.elbowL, f.depthL]] as const) {
			if (e) j[`${side} ELBOW`] = [e[0], e[1], r[`${side} ELBOW`]![2]];
			if (dep !== undefined) {
				depth[`${side} ARM`] = dep;
				depth[`${side} ELBOW`] = Math.round(128 + (dep - 128) / 2);
			}
		}
		// Chân: bàn chân trên đất (y giữ nguyên), phải bước tới step, trái lùi back; gối bằng IK, gập về phía trước.
		// Gối `depth` (đòn hướng thẳng): chân bước về hướng đánh nhiều hơn là chân trước.
		const toward = spec.direction === 'north' ? -1 : 1;
		const frontSide = toward * (f.stepY ?? 0) > toward * (f.backY ?? 0) ? 'RIGHT' : toward * (f.backY ?? 0) > toward * (f.stepY ?? 0) ? 'LEFT' : null;
		for (const [side, dx, dy] of [['RIGHT', f.step, f.stepY ?? 0], ['LEFT', f.back, f.backY ?? 0]] as const) {
			const s = side === 'RIGHT' ? 'R' : 'L';
			const ankle: [number, number] = [r[`${side} LEG`]![0] + dx, r[`${side} LEG`]![1] + dy];
			j[`${side} LEG`] = [...ankle, r[`${side} LEG`]![2]];
			const hip = j[`${side} HIP`]!;
			if (spec.knees === 'depth') {
				// Gối trên đường thẳng hông → cổ chân (tỉ lệ đùi / cẳng chân); chân co lại thì gối gập về hướng đánh theo độ sâu.
				const t = thigh[s] / (thigh[s] + shin[s]);
				j[`${side} KNEE`] = [hip[0] + (ankle[0] - hip[0]) * t, hip[1] + (ankle[1] - hip[1]) * t, r[`${side} KNEE`]![2]];
				const bent = dist(hip, ankle) < thigh[s] + shin[s] - 1;
				if (bent) depth[`${side} KNEE`] = 128 + toward * (side === frontSide ? 32 : 12);
				continue;
			}
			const knee = solveElbow(hip, ankle, thigh[s], shin[s], -1);
			// Nhìn ngang: nghiệm gối phía trước (x lớn hơn). Nhìn chính diện: gối mở ra ngoài (phải về x nhỏ, trái về x lớn).
			const alt = solveElbow(hip, ankle, thigh[s], shin[s], 1);
			const outward = (spec.knees === 'out' && side === 'RIGHT') || (spec.knees === 'outBack' && side === 'LEFT');
			j[`${side} KNEE`] = [...((knee[0] >= alt[0]) !== outward ? knee : alt), r[`${side} KNEE`]![2]];
		}
		const keypoints = need.map((label) => ({ label, x: (j[label]![0] + pl) / W, y: (j[label]![1] + pt) / H, z_index: j[label]![2], ...(depth[label] !== undefined ? { depth: depth[label] } : {}) }));
		// Điểm nắm làm tròn nguyên pixel: vũ khí chỉ dịch nguyên pixel (không nội suy).
		return { keypoints, grip: [Math.round(grip[0] + pl), Math.round(grip[1] + pt)] as Point, bladeDeg: f.weaponDeg ?? f.bladeDeg, ...(f.bladeLen !== undefined ? { bladeLen: f.bladeLen } : {}), ...(f.behind ? { behind: true } : {}), ...(f.string ? { bow: { ...(f.staveDeg !== undefined ? { staveDeg: f.staveDeg } : {}), string: f.string, arrow: !!f.arrow } } : {}) };
	});
}

/**
 * Lật BẢNG TƯ THẾ hướng S sang N cho đòn chĩa / bước DỌC TRỤC NHÌN (đâm, chủ dự án 30/10: "chính diện cũng bước 1 chân lên mà đâm"): ở S
 * bước / đổ người / tay đâm VỀ người xem (xuống ảnh), nhìn sau cùng đòn đó RA XA (lên ảnh). Ngang lật gương quanh tâm hông hai ảnh đứng;
 * dời dọc của thân / bàn chân (leanY, stepY, backY) đảo dấu và thu ngắn (`vScale`), hạ hông giữ nguyên; tay về người xem (forward) thành ra xa (256 − d); góc vũ
 * khí lật gương, lưỡi ngắn (< 0,6) đảo chiều dọc; kiếm trước / sau thân đảo. Nhãn khớp giữ nguyên (nhìn sau tay phải ở bên phải ảnh).
 */
export function mirrorSpecToNorth(spec: SlashSpec, hipS: number, hipN: number, vScale = 0.6): SlashSpec {
	// `vScale`: dời dọc ra xa thu ngắn (bước chân đi LÊN ảnh mà hông đang hạ thì gối gập ngang, trông như đá chân — dẫm 30/10 Thương N).
	const v = (n: number | undefined): number | undefined => (n === undefined ? undefined : Math.round(-n * vScale));
	const mx = (x: number): number => hipN + (hipS - x);
	const flip = (deg: number, len: number): number => {
		const m = deg >= 0 ? 180 - deg : -180 - deg;
		return len < 0.6 ? -m : m;
	};
	// Điểm nắm dọc: phần hạ hông giữ đi xuống; phần còn lại (đổ người / đâm về người xem) đảo thành đi lên (ra xa) quanh điểm nắm khung đầu.
	const y0 = spec.frames[0]?.grip?.[1] ?? 0;
	return {
		...spec,
		direction: 'north',
		...(spec.knees === 'out' ? { knees: 'outBack' as const } : {}),
		frames: spec.frames.map((f) => {
			const len = f.bladeLen ?? 1;
			return {
				...f,
				...(f.grip ? { grip: [mx(f.grip[0]), Math.round(y0 + f.hip[1] - (f.grip[1] - y0 - f.hip[1]) * vScale)] as Point } : {}),
				...(f.arm ? { arm: [180 - f.arm[0], f.arm[1]] as [number, number] } : {}),
				bladeDeg: flip(f.bladeDeg, len),
				...(f.weaponDeg !== undefined ? { weaponDeg: flip(f.weaponDeg, len) } : {}),
				lean: -f.lean,
				...(f.leanY !== undefined ? { leanY: v(f.leanY) } : {}),
				hip: [-f.hip[0], f.hip[1]] as Point,
				step: -f.step,
				back: -f.back,
				...(f.stepY !== undefined ? { stepY: v(f.stepY) } : {}),
				...(f.backY !== undefined ? { backY: v(f.backY) } : {}),
				...(f.forward !== undefined ? { forward: 256 - f.forward } : {}),
				behind: !f.behind,
			};
		}),
	};
}

/** Khung xương ảnh đứng đổi sang toạ độ ảnh đã đệm (first_frame_keypoints). */
export function padKeypoints(rest: Keypoint[], size: [number, number], pad: [number, number, number, number]): Keypoint[] {
	const [pl, pr, pt, pb] = pad;
	const W = size[0] + pl + pr;
	const H = size[1] + pt + pb;
	return rest.map((k) => ({ ...k, x: (k.x * size[0] + pl) / W, y: (k.y * size[1] + pt) / H, z_index: Math.round(k.z_index) }));
}

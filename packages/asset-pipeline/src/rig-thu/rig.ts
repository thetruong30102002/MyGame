// THỬ NGHIỆM nhân vật ghép mảnh có xương (chủ dự án 14/10/2026: "tách layer xây 1 nhân vật gốc rồi ghép đồ … làm thử đi").
// Cắt khung đứng S của người chơi 16 tuổi thành 7 mảnh (đầu, thân, 2 tay, 2 chân), quay quanh khớp kiểu pixel (lấy điểm gần nhất — đúng
// như Unity vẽ xương ở độ phân giải gốc), gắn kiếm rời vào tay, đổi màu bộ đồ theo lớp. Xuất dải khung + ảnh động để so với bản vẽ tay.
//   npx tsx src/rig-thu/rig.ts <thư mục ra>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createImage, crop, getPixel, readPng, scaleNearest, setPixel, writePng, type RGBA, type RGBAImage } from '../image/rgba.js';

const OUT = process.argv[2]!;
const ROOT = join(import.meta.dirname, '../../../../assets');
const atlas = readPng(join(ROOT, 'characters/player_hero_adult/player_hero_adult.png'));
const meta = JSON.parse(readFileSync(join(ROOT, 'characters/player_hero_adult/player_hero_adult.json'), 'utf8'));
const frameOf = (k: string): RGBAImage => {
	const f = meta.frames[`player_hero_adult/${k}`].frame;
	return crop(atlas, f.x, f.y, f.w, f.h);
};
const base = frameOf('idle_S_0');
const sword = readPng(join(ROOT, 'items/iron_sword.png'));

type PartId = 'legL' | 'legR' | 'torso' | 'head' | 'armL' | 'armR';
type Pt = { x: number; y: number };

/** Mảnh theo vị trí điểm ảnh trên khung gốc (soi bằng `ascii.ts`): đầu tới cằm y 49, hai tay hai bên, hai chân tách ở x 55/56 từ y 74. */
function partOf(x: number, y: number): PartId {
	if (y <= 49) return 'head';
	if (y >= 74) return x <= 55 ? 'legL' : 'legR';
	if (x <= 47 && y <= 76) return 'armL';
	if (x >= 63 && y <= 76) return 'armR';
	return 'torso';
}

const PIVOT: Record<PartId, Pt> = {
	head: { x: 55, y: 49 },
	torso: { x: 55, y: 73 },
	armL: { x: 46, y: 53 },
	armR: { x: 64, y: 53 },
	legL: { x: 51, y: 74 },
	legR: { x: 60, y: 74 },
};
/** Tay trái màn hình (tay phải nhân vật — nhìn từ trước) cầm kiếm: điểm nắm trên khung gốc. */
const HAND_L: Pt = { x: 44, y: 71 };

const parts = new Map<PartId, RGBAImage>();
for (const id of Object.keys(PIVOT) as PartId[]) parts.set(id, createImage(112, 112));
for (let y = 0; y < 112; y++)
	for (let x = 0; x < 112; x++) {
		const c = getPixel(base, x, y);
		if (c[3] > 0) setPixel(parts.get(partOf(x, y))!, x, y, c);
	}

/** Bộ đồ = đổi màu theo lớp: tông nâu của áo gile / quần (giữ da, tóc, viền) đổi sang màu khác — mỗi bộ một bảng màu, 0 lượt vẽ. */
type Outfit = { name: string; hue: number; sat: number; light: number } | null;
function recolor(c: RGBA, o: Outfit, part: PartId): RGBA {
	if (!o || part === 'head') return c;
	const [r, g, b, a] = c;
	const mx = Math.max(r, g, b);
	const mn = Math.min(r, g, b);
	const l = (mx + mn) / 2;
	// Chỉ đổi màu NÂU của vải (r > g > b, không quá sáng như áo trắng / da, không quá tối như viền).
	if (!(r > g && g >= b && r - b > 25 && l > 40 && l < 170)) return c;
	const t = (l / 255) * o.light;
	const [hr, hg, hb] = hsl(o.hue, o.sat, Math.min(0.85, t));
	return [hr, hg, hb, a];
}
function hsl(h: number, s: number, l: number): [number, number, number] {
	const k = (n: number) => (n + h / 30) % 12;
	const q = s * Math.min(l, 1 - l);
	const f = (n: number) => l - q * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
	return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

type Pose = Partial<Record<PartId, { rot?: number; dx?: number; dy?: number; lift?: number }>> & { sword?: number | null };

/** Đặt một ảnh đã quay `deg` độ quanh `pivot` (toạ độ ảnh nguồn) vào `at` trên khung đích — lấy điểm gần nhất (giữ lưới pixel). */
function stamp(dst: RGBAImage, src: RGBAImage, pivot: Pt, at: Pt, deg: number, map?: (c: RGBA) => RGBA): void {
	const a = (deg * Math.PI) / 180;
	const cos = Math.cos(a);
	const sin = Math.sin(a);
	for (let y = 0; y < dst.height; y++)
		for (let x = 0; x < dst.width; x++) {
			const ux = x - at.x;
			const uy = y - at.y;
			const sx = Math.round(pivot.x + ux * cos + uy * sin);
			const sy = Math.round(pivot.y - ux * sin + uy * cos);
			const c = getPixel(src, sx, sy);
			if (c[3] > 0) setPixel(dst, x, y, map ? map(c) : c);
		}
}

const rotPt = (p: Pt, pivot: Pt, deg: number): Pt => {
	const a = (deg * Math.PI) / 180;
	const dx = p.x - pivot.x;
	const dy = p.y - pivot.y;
	return { x: pivot.x + dx * Math.cos(a) - dy * Math.sin(a), y: pivot.y + dx * Math.sin(a) + dy * Math.cos(a) };
};

// Kiếm: chuôi ở góc dưới trái ảnh 49×49, mũi góc trên phải (đo trên ảnh). Góc lưỡi gốc ≈ −45°.
const SWORD_GRIP: Pt = { x: 10, y: 38 };
const SWORD_DEG = -45;

function render(p: Pose, outfit: Outfit): RGBAImage {
	const img = createImage(112, 112);
	const body = { dx: p.torso?.dx ?? 0, dy: p.torso?.dy ?? 0 };
	const put = (id: PartId, attach: Pt): void => {
		const q = p[id] ?? {};
		const piv = PIVOT[id];
		let src = parts.get(id)!;
		// Nhấc chân (nhìn từ trước): cắt bớt phần đùi để chân ngắn lại, bàn chân nâng lên.
		if (q.lift) {
			const s = createImage(112, 112);
			for (let y = 0; y < 112; y++) for (let x = 0; x < 112; x++) setPixel(s, x, y, getPixel(src, x, y >= piv.y + 6 ? y + q.lift : y));
			src = s;
		}
		stamp(img, src, piv, { x: attach.x + (q.dx ?? 0), y: attach.y + (q.dy ?? 0) }, q.rot ?? 0, (c) => recolor(c, outfit, id));
	};
	put('legL', PIVOT.legL);
	put('legR', PIVOT.legR);
	const tor = { x: PIVOT.torso.x + body.dx, y: PIVOT.torso.y + body.dy };
	stamp(img, parts.get('torso')!, PIVOT.torso, tor, p.torso?.rot ?? 0, (c) => recolor(c, outfit, 'torso'));
	const shoulder = (id: PartId): Pt => {
		const r = rotPt(PIVOT[id], PIVOT.torso, p.torso?.rot ?? 0);
		return { x: r.x + body.dx, y: r.y + body.dy };
	};
	put('armR', shoulder('armR'));
	put('head', shoulder('head'));
	// Kiếm vẽ TRƯỚC tay cầm (bàn tay che chuôi).
	if (p.sword !== null && p.sword !== undefined) {
		const armRot = p.armL?.rot ?? 0;
		const sh = shoulder('armL');
		const hand = rotPt({ x: HAND_L.x - PIVOT.armL.x + sh.x, y: HAND_L.y - PIVOT.armL.y + sh.y }, sh, armRot);
		stamp(img, sword, SWORD_GRIP, { x: Math.round(hand.x), y: Math.round(hand.y) }, armRot + p.sword - SWORD_DEG);
	}
	put('armL', shoulder('armL'));
	return img;
}

function strip(frames: RGBAImage[]): RGBAImage {
	const s = createImage(112 * frames.length, 112);
	frames.forEach((f, i) => {
		for (let y = 0; y < 112; y++) for (let x = 0; x < 112; x++) setPixel(s, i * 112 + x, y, getPixel(f, x, y));
	});
	return s;
}

// ——— động tác ———
const idle: Pose[] = [0, 1, 1, 0].map((b) => ({ torso: { dy: b }, armL: { rot: b * 2 }, armR: { rot: -b * 2 }, sword: 100 }));
const walk: Pose[] = Array.from({ length: 8 }, (_, i) => {
	const s = Math.sin((i / 8) * Math.PI * 2);
	const bob = Math.abs(Math.cos((i / 8) * Math.PI * 2)) > 0.7 ? 0 : 1;
	return {
		torso: { dy: bob },
		legL: { rot: s * 6, lift: s > 0.3 ? 2 : 0 },
		legR: { rot: -s * 6, lift: s < -0.3 ? 2 : 0 },
		armL: { rot: -s * 14 },
		armR: { rot: s * 14 },
		sword: 100,
	};
});
// Chém: giơ kiếm lên cao phía ngoài (vai trái màn hình) rồi quét ngang qua thân sang phải, thân vặn theo.
const SLASH: [number, number, number][] = [
	[0, 100, 0],
	[50, 60, -2],
	[120, 10, -4],
	[155, -10, -4],
	[70, -40, 2],
	[-35, -70, 5],
	[-60, -80, 4],
	[-20, 40, 1],
];
const slash: Pose[] = SLASH.map(([arm, sw, tw]) => ({ torso: { rot: tw * 0.6, dx: Math.sign(tw) }, armL: { rot: arm }, armR: { rot: -tw * 3 }, sword: sw }));

const OUTFITS: [string, Outfit][] = [
	['goc', null],
	['bo-xanh', { name: 'Bộ thợ săn xanh', hue: 200, sat: 0.45, light: 1.25 }],
	['bo-do', { name: 'Bộ hiệp sĩ đỏ', hue: 355, sat: 0.55, light: 1.2 }],
];
for (const [tag, o] of OUTFITS)
	for (const [name, poses] of [
		['idle', idle],
		['walk', walk],
		['slash', slash],
	] as const) {
		const frames = poses.map((p) => render(p, o));
		writePng(join(OUT, `rig-${name}-${tag}.png`), scaleNearest(strip(frames), 2));
		frames.forEach((f, i) => writePng(join(OUT, 'frames', `${name}-${tag}-${i}.png`), scaleNearest(f, 3)));
	}
console.log('xong');

// ——— xuất mảnh cho Unity (phòng Thử chiêu): mỗi bộ màu một thư mục, mỗi mảnh cắt sát khung + toạ độ khớp; kiếm thu ⅔ ———
const UNITY = join(import.meta.dirname, '../../../../UnityGame/Assets/Aether/Imported/Resources/RigThu');
function bbox(img: RGBAImage): { x0: number; y0: number; x1: number; y1: number } {
	let x0 = 999, y0 = 999, x1 = -1, y1 = -1;
	for (let y = 0; y < img.height; y++)
		for (let x = 0; x < img.width; x++)
			if (getPixel(img, x, y)[3] > 0) {
				x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
			}
	return { x0, y0, x1, y1 };
}
const rigJson: Record<string, unknown> = { anchor: { x: 56, y: 100 }, pivots: PIVOT, hand: HAND_L, parts: {} as Record<string, unknown> };
for (const [tag, o] of OUTFITS)
	for (const id of Object.keys(PIVOT) as PartId[]) {
		const src = parts.get(id)!;
		const b = bbox(src);
		const out = createImage(b.x1 - b.x0 + 1, b.y1 - b.y0 + 1);
		for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) { const c = getPixel(src, x, y); if (c[3] > 0) setPixel(out, x - b.x0, y - b.y0, recolor(c, o, id)); }
		writePng(join(UNITY, tag, `${id}.png`), out);
		(rigJson.parts as Record<string, unknown>)[id] = { x0: b.x0, y0: b.y0, w: out.width, h: out.height };
	}
// Kiếm: icon 49 px to hơn kiếm vẽ liền thân ~1,5 lần → thu ⅔ (lấy điểm gần nhất).
const SW = 33;
const small = createImage(SW, SW);
for (let y = 0; y < SW; y++) for (let x = 0; x < SW; x++) setPixel(small, x, y, getPixel(sword, Math.floor((x * 49) / SW), Math.floor((y * 49) / SW)));
writePng(join(UNITY, 'sword.png'), small);
rigJson.sword = { w: SW, h: SW, grip: { x: Math.round((SWORD_GRIP.x * SW) / 49), y: Math.round((SWORD_GRIP.y * SW) / 49) }, deg: SWORD_DEG };
rigJson.outfits = OUTFITS.map(([tag, o]) => ({ tag, name: o?.name ?? 'Bộ gốc' }));
rigJson.poses = { idle, walk, slash };
writeFileSync(join(UNITY, 'rig.json'), JSON.stringify(rigJson, null, '\t'));
console.log('mảnh Unity →', UNITY);

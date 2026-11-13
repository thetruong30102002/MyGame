// Nhà dịch vụ vào được (13/11/2026, chủ dự án duyệt ảnh ghép thử "ok lam di"): 7 nhà GPT ở trạm mỗi khu, cửa giữa mặt trước là lối
// sang map phòng `svc_<phòng>` (ô 32 px như phòng Gia viên: sàn vẽ bằng code + dải tường GPT nướng thành một ảnh nền, đồ GPT dựa
// tường / quầy / đồ sàn, NPC vùng đứng sau quầy ở địa điểm `svc_<phòng>_keeper`). Danh sách khu / phòng dùng chung `@havenlord/sim/serviceTowns`.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { SERVICE_ROOM_INFO, SERVICE_ROOMS, SERVICE_TOWNS, serviceNpcSpot, serviceRoomMap, type ServiceRoom } from '../../../sim/src/serviceTowns.ts';
import { blit, createImage, crop, readPng, type RGBAImage } from '../image/rgba.js';
import type { PropMeta } from '../props/buildProps.js';
import { GPT_ART_PREFIX } from '../props/gptArt.js';
import type { PropDef } from '../props/humanKingdom.js';
import type { KitRegionDef } from './kit.js';
import type { MapData } from './human/common.js';

export const SERVICE_BG_PREFIX = 'svcbg:';
const GPT_ROOT = 'packages/asset-pipeline/sources/gpt-review';
type Town = (typeof SERVICE_TOWNS)[number];

const HOUSE: Record<ServiceRoom, string> = { qr: 'quan_ruou', nh: 'ngan_hang', vk: 'vu_khi', tb: 'trang_bi', lr: 'lo_ren', nc: 'nang_cap', hp: 'hoi_phuc' };
/** Bố cục phòng: món dựa tường trái, phải, món quầy giữa (NPC đứng sau), món sàn (`vong_phap` nằm phẳng). */
const LAYOUT: Record<ServiceRoom, readonly [string, string, string, string]> = {
	qr: ['ke_ruou', 'dac_trung', 'quay_bar', 'ban_ghe'],
	nh: ['ket_sat', 'cua_ket', 'quay', 'ruong_vang'],
	vk: ['gia_kiem_thuong', 'gia_cung_truong', 'quay', 'gia_khien'],
	tb: ['gia_ao', 'ke_giay_gang', 'quay', 'gia_giap'],
	lr: ['gia_dung_cu', 'lo_ren', 'de_bua', 'thung_toi'],
	nc: ['ke_da', 'lo_tinh_luyen', 'ban_khac_rune', 'vong_phap'],
	hp: ['ke_thuoc', 'dac_trung', 'quay', 'noi_thuoc'],
};
/** Thistlewood: bên trong đã vẽ ở đợt 2 / 4 / 13 (tên cũ) — [tường, tường cửa sổ, 4 món theo LAYOUT]. */
const TL_OLD: Record<ServiceRoom, readonly string[]> = {
	qr: ['dot-2/tuong_go_ke', 'dot-2/tuong_go_cua_so', 'dot-2/ke_ruou', 'dot-2/lo_suoi_lon', 'dot-2/quay_bar', 'dot-2/ban_tron_ghe'],
	nh: ['dot-2/tuong_thach_cao', 'dot-2/tuong_thach_cao', 'dot-2/ket_sat', 'dot-2/cua_ket_lon', 'dot-2/quay_giao_dich', 'dot-2/chong_vang'],
	vk: ['dot-13/vk_tuong', 'dot-13/vk_tuong_cua_so', 'dot-13/vk_gia_thuong', 'dot-13/vk_gia_cung', 'dot-13/vk_quay', 'dot-13/vk_gia_khien'],
	tb: ['dot-13/tb_tuong', 'dot-13/tb_tuong_cua_so', 'dot-13/tb_gia_ao_choang', 'dot-13/tb_ke_giay_gang', 'dot-13/tb_quay', 'dot-13/tb_gia_giap_sat'],
	lr: ['dot-4/tuong_da_lo_ren', 'dot-4/tuong_da_lo_ren', 'dot-4/gia_vu_khi', 'dot-4/lo_ren', 'dot-4/de_bua', 'dot-4/thung_toi'],
	nc: ['dot-13/nc_tuong', 'dot-13/nc_tuong_cua_so', 'dot-13/nc_ke_da_cuong_hoa', 'dot-13/nc_lo_tinh_luyen', 'dot-13/nc_ban_khac_rune', 'dot-13/nc_vong_phap'],
	hp: ['dot-4/tuong_go_tiem_thuoc', 'dot-4/tuong_go_tiem_thuoc', 'dot-4/ke_thuoc', 'dot-4/gia_phoi_thao_duoc', 'dot-4/quay_hang', 'dot-4/noi_luyen_thuoc'],
};
/** Sàn theo khu: màu gốc + kiểu (ván gỗ / đá lát); lò rèn luôn lát đá. */
const FLOOR: Record<string, { rgb: [number, number, number]; kind: 'wood' | 'flag' }> = {
	tl: { rgb: [176, 124, 78], kind: 'wood' }, lx: { rgb: [118, 124, 98], kind: 'wood' }, sa: { rgb: [214, 176, 128], kind: 'flag' },
	gh: { rgb: [186, 136, 88], kind: 'wood' }, tp: { rgb: [150, 160, 172], kind: 'flag' }, dd: { rgb: [112, 84, 72], kind: 'flag' }, sc: { rgb: [200, 168, 124], kind: 'wood' },
};

const T = 32, COLS = 12, ROWS = 7, WALL = 128;
/** Toạ độ sàn (fx, fy tính từ góc trên trái mặt sàn) → px trong map (viền 1 ô trái, dải tường 4 ô trên). */
const X = (fx: number) => fx + T, Y = (fy: number) => fy + WALL;

export const serviceTown = (region: string): Town | undefined => SERVICE_TOWNS.find((t) => t.region === region);
const ref = (t: Town, room: ServiceRoom, k: number): string => {
	if (t.code === 'tl') return TL_OLD[room][k]!;
	const names = ['tuong', 'tuong_cua_so', ...LAYOUT[room]];
	return `${t.batch}/${t.code}_${room}_${names[k]}`;
};

/** Đồ vật của khu: 7 nhà, ảnh nền 7 phòng, đồ bên trong (id ngắn trong atlas vùng: `svc_house_qr`, `svc_qr_bg`, `svc_qr_quay_bar`…). */
export function serviceProps(region: string): PropDef[] {
	const t = serviceTown(region);
	if (!t) return [];
	const out: PropDef[] = [];
	for (const room of SERVICE_ROOMS) {
		out.push({ id: `svc_house_${room}`, path: `${GPT_ART_PREFIX}${t.batch}/${t.code}_nha_${HOUSE[room]}`, kind: 'building', footprint: { w: 0.86, h: 56 }, blocks: true });
		out.push({ id: `svc_${room}_bg`, path: `${SERVICE_BG_PREFIX}${t.code}/${room}`, kind: 'flower', footprint: { w: 0, h: 0 }, blocks: false });
		LAYOUT[room].forEach((name, i) => {
			const flat = name === 'vong_phap';
			const fp = i < 2 ? { w: 0.85, h: 16 } : i === 2 ? { w: 0.95, h: 22 } : { w: 0.8, h: 14 };
			out.push({ id: `svc_${room}_${name}`, path: `${GPT_ART_PREFIX}${ref(t, room, i + 2)}`, kind: flat ? 'flower' : 'decor', footprint: flat ? { w: 0, h: 0 } : fp, blocks: !flat });
		});
	}
	return out;
}

const gpt = (root: string, r: string): RGBAImage => {
	const [batch, id] = r.split('/');
	const file = join(root, GPT_ROOT, batch!, 'chuan-hoa', `${id}.png`);
	if (!existsSync(file)) throw new Error(`Thiếu ảnh GPT chuẩn hoá ${file}`);
	return readPng(file);
};

function shadeFloor(w: number, h: number, base: readonly [number, number, number], kind: 'wood' | 'flag'): RGBAImage {
	const img = createImage(w, h);
	for (let y = 0; y < h; y++)
		for (let x = 0; x < w; x++) {
			let k: number;
			if (kind === 'wood') {
				const j = Math.floor(y / T), row = Math.floor((y % T) / 8), y0 = row * 8, off = (row * 40 + (j % 4) * 56) % 96, gx = x + off;
				k = [1, 0.92, 1.06, 0.96, 1.02, 0.9][(Math.floor(gx / 96) + row * 2 + (j % 4) * 3) % 6]!;
				if (y % T === y0 + 7 || gx % 96 === 0) k = 0.55;
			} else {
				const sh = Math.floor(y / 16) % 2 ? 8 : 0, sx = (x + sh) % 16;
				k = [1, 0.94, 1.05, 0.97][(Math.floor((x + sh) / 16) + Math.floor(y / 16) * 3) % 4]!;
				if (y % 16 === 0 || sx === 0) k = 0.62;
			}
			img.data.set([Math.min(255, Math.round(base[0] * k)), Math.min(255, Math.round(base[1] * k)), Math.min(255, Math.round(base[2] * k)), 255], (y * w + x) * 4);
		}
	return img;
}

const fill = (img: RGBAImage, x0: number, y0: number, x1: number, y1: number, c: readonly [number, number, number]) => {
	for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) img.data.set([c[0], c[1], c[2], 255], (y * img.width + x) * 4);
};

/** Ảnh nền phòng `svcbg:<mã>/<phòng>`: dải tường 128 px (hai mảng xen kẽ, chồng 4 px chỗ nối, bóng chân tường) + sàn 12 × 7 ô + thảm cửa. */
export function serviceBackground(root: string, path: string): RGBAImage {
	const [code, room] = path.split('/') as [string, ServiceRoom];
	const t = SERVICE_TOWNS.find((x) => x.code === code);
	if (!t || !SERVICE_ROOMS.includes(room)) throw new Error(`Ảnh nền phòng dịch vụ sai: ${path}`);
	const W = COLS * T, H = WALL + ROWS * T;
	const f = FLOOR[code]!;
	const img = createImage(W, H);
	blit(img, shadeFloor(W, ROWS * T, f.rgb, room === 'lr' ? 'flag' : f.kind), 0, WALL);
	const walls = [gpt(root, ref(t, room, 0)), gpt(root, ref(t, room, 1))].map((w) => (w.height === WALL ? w : scaleTo(w, WALL)));
	for (let x = 0, k = 0; x < W; k++) {
		const w = walls[k % 2]!;
		blit(img, crop(w, 0, 0, Math.min(w.width, W - x), WALL), x, 0);
		x += w.width - 4;
	}
	fill(img, 0, WALL, W, WALL + 6, [24, 16, 10]);
	const mx = W / 2 - 26;
	fill(img, mx, H - 14, mx + 52, H, [40, 26, 18]);
	fill(img, mx + 2, H - 12, mx + 50, H - 2, [150, 64, 46]);
	for (let x = mx + 6; x < mx + 46; x += 6) fill(img, x, H - 10, x + 2, H - 4, [186, 120, 70]);
	return img;
}

/** Co / giãn theo chiều cao, lấy mẫu điểm gần nhất (mảng tường lệch vài px so với 128). */
function scaleTo(src: RGBAImage, h: number): RGBAImage {
	const w = Math.round((src.width * h) / src.height), out = createImage(w, h);
	for (let y = 0; y < h; y++)
		for (let x = 0; x < w; x++) {
			const sx = Math.min(src.width - 1, Math.floor((x * src.width) / w)), sy = Math.min(src.height - 1, Math.floor((y * src.height) / h));
			out.data.set(src.data.subarray((sy * src.width + sx) * 4, (sy * src.width + sx) * 4 + 4), (y * w + x) * 4);
		}
	return out;
}

/** Trạm khu dựng bằng bộ dựng chung: 7 nhà dịch vụ đứng ĐẦU hàng nhà (chỗ gần quảng trường nhất; bộ dựng bỏ chỗ có nước trước cửa). */
export function withServiceHouses(def: KitRegionDef): KitRegionDef {
	if (!serviceTown(def.region)) return def;
	const houses = SERVICE_ROOMS.map((r) => `svc_house_${r}`);
	// Trạm 44 × 36 ô không đủ chỗ cho 7 nhà lớn (~300 px) cạnh nhà cũ → nới trạm 56 × 46 ô (lối ra vẫn giữa các mép).
	return { ...def, maps: def.maps.map((m) => (m.hub ? { ...m, w: Math.max(m.w, 56), h: Math.max(m.h, 46), hub: { ...m.hub, buildings: [...houses, ...m.hub.buildings] } } : m)) };
}

/**
 * Gắn cửa 7 nhà ở map trạm + thêm 7 map phòng. Cửa: dải 56 × 42 px ngay dưới chân nhà (đi lên là vào), điểm `svc_<phòng>_out` đứng
 * trước cửa; dọn đồ vật / cây chắn lối trước cửa. Phòng: lối ra giữa cạnh dưới về đúng cửa nhà.
 */
export function attachServiceTown(maps: MapData[], region: string, meta: Record<string, PropMeta>): void {
	const t = serviceTown(region);
	if (!t) return;
	const hub = maps.find((m) => m.id === t.hub);
	if (!hub) throw new Error(`${region}: không có map trạm ${t.hub}`);
	for (const room of SERVICE_ROOMS) {
		const house = hub.props.find((p) => p.id === `svc_house_${room}`);
		if (!house) throw new Error(`${region}/${hub.id}: không đặt được nhà ${SERVICE_ROOM_INFO[room].name} (svc_house_${room})`);
		const { x, y } = house;
		// Lối trước cửa: bỏ đồ vật có chân trong dải rộng 104 px, sâu 110 px dưới chân nhà (cây, đèn, thùng…).
		hub.props = hub.props.filter((p) => p === house || !(Math.abs(p.x - x) < 52 + (meta[p.id]?.w ?? 0) / 3 && p.y > y - 4 && p.y < y + 110));
		const tile = [y + 16, y + 64].map((yy) => hub.terrain[Math.floor(yy / hub.tileSize)]?.[Math.floor(x / hub.tileSize)]).find((c) => !c || c === 'w' || c === '#') ?? 'g';
		if (tile !== 'g') throw new Error(`${region}/${hub.id}: trước cửa ${SERVICE_ROOM_INFO[room].name} không đi được (ô "${tile}")`);
		const mapId = serviceRoomMap(room);
		hub.spots.push({ id: `svc_${room}_out`, name: `Trước ${SERVICE_ROOM_INFO[room].name.toLowerCase()}`, x, y: y + 64, r: 40 });
		hub.exits.push({ id: `to_${mapId}`, to: mapId, toSpot: `svc_${room}_door`, edge: 'N', x0: x - 28, x1: x + 28, y0: y - 12, y1: y + 30, label: SERVICE_ROOM_INFO[room].name });
		maps.push(roomMap(t, room, hub, meta));
	}
}

function roomMap(t: Town, room: ServiceRoom, hub: MapData, meta: Record<string, PropMeta>): MapData {
	const W = COLS + 2, H = ROWS + 5, doorX = W / 2 - 1;
	const terrain = Array.from({ length: H }, (_, y) =>
		Array.from({ length: W }, (_, x) => {
			if (x >= 1 && x <= COLS && y >= 4 && y <= ROWS + 3) return 'b';
			if (y === H - 1 && (x === doorX || x === doorX + 1)) return 'b';
			return '#';
		}).join(''),
	);
	const [left, right, counter, floor] = LAYOUT[room];
	const id = (n: string) => `svc_${room}_${n}`;
	const props: MapData['props'] = [
		{ id: id(left), x: X(64), y: Y(22) },
		{ id: id(right), x: X(COLS * T - 70), y: Y(22) },
		{ id: id(counter), x: X((COLS * T) / 2), y: Y(104) },
	];
	const decals: MapData['decals'] = [{ id: id('bg'), x: X((COLS * T) / 2), y: Y(ROWS * T) }];
	if (floor === 'ban_ghe') props.push({ id: id(floor), x: X(80), y: Y(204) }, { id: id(floor), x: X(COLS * T - 90), y: Y(204) });
	else if (floor === 'vong_phap') decals.push({ id: id(floor), x: X(COLS * T - 90), y: Y(190) });
	else props.push({ id: id(floor), x: X(COLS * T - 80), y: Y(200) });
	for (const p of [...props, ...decals]) if (!meta[p.id]) throw new Error(`${t.region}/${serviceRoomMap(room)}: thiếu đồ ${p.id} trong atlas`);
	const mid = X((COLS * T) / 2);
	const door = { x: mid, y: Y(ROWS * T - 40) };
	return {
		id: serviceRoomMap(room),
		name: `${SERVICE_ROOM_INFO[room].name} ${t.town}`,
		biome: hub.biome,
		tileSize: T,
		width: W,
		height: H,
		seed: hub.seed + 500 + SERVICE_ROOMS.indexOf(room),
		terrain,
		props,
		decals,
		spawn: door,
		npcs: [],
		monsterZones: [],
		boss: null,
		areas: [],
		dummies: [],
		spots: [
			{ id: `svc_${room}_door`, name: 'Cửa ra', x: door.x, y: door.y, r: 40 },
			{ id: serviceNpcSpot(room), name: SERVICE_ROOM_INFO[room].title, x: mid, y: Y(72), r: 60 },
		],
		exits: [{ id: `to_${hub.id}_${room}`, to: hub.id, toSpot: `svc_${room}_out`, edge: 'S', x0: doorX * T, x1: (doorX + 2) * T, y0: (H - 1) * T, y1: H * T, label: t.town }],
	};
}

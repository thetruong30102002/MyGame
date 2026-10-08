/**
 * Điểm neo đồ gắn (mũ, vũ khí, tay phụ, áo choàng) tính THẲNG từ kênh alpha của một khung nhân vật. Hàm thuần, không
 * Node/DOM — nhận mọi ảnh dạng `{ width, height, data }` RGBA (RGBAImage của pipeline hay ImageData của trình duyệt).
 *
 * Vì sao tính ở pipeline (lúc đóng atlas) chứ không lúc chạy: atlas là ảnh TĨNH, neo không đổi giữa các lần chơi; tính một
 * lần rồi ghi vào JSON của atlas (`frames[...].gear`) thì client chỉ đọc số — không phải vẽ atlas lên canvas để quét điểm
 * ảnh (chậm trên điện thoại, và bị chặn khi atlas khác nguồn). Pixi bỏ qua trường lạ trong frame nên atlas cũ/mới đều tải
 * được như trước.
 *
 * Toạ độ: pixel NGUYÊN tính từ góc trên-trái của khung. "Trái/phải" là trái/phải MÀN HÌNH (người xem), không phải tay trái/
 * phải của nhân vật — chọn tay nào cầm vũ khí theo hướng là việc của client (`apps/web/src/game/gearLayers.ts`).
 */
export interface GearAnchors {
	/** Đỉnh đầu (hàng có hình trên cùng), x = tâm đầu. Mũ đặt đáy vào đây. */
	top: [number, number];
	/** Tâm đầu (giữa đỉnh đầu và cổ). */
	head: [number, number];
	/** Giữa hai vai (ngay dưới cổ). Áo choàng treo mép trên vào đây. */
	back: [number, number];
	/** Bàn tay phía TRÁI màn hình: đầu mút thấp nhất của mép trái vùng tay. */
	handL: [number, number];
	/** Bàn tay phía PHẢI màn hình. */
	handR: [number, number];
}

export interface AlphaImage {
	width: number;
	height: number;
	data: ArrayLike<number>;
}

/** Dải tìm hàng đầu "đặc" nhất: 0–32% chiều cao tính từ đỉnh (đầu chibi chiếm 27–37% trên của hình). */
const HEAD_SCAN = 0.32;
/** Cổ = hàng đầu tiên dưới hàng đầu đặc nhất mà SỐ điểm có hình tụt còn ≤ 78% số đó. */
const NECK_RATIO = 0.78;
/** Cổ phải nằm trong 22–50% chiều cao; ngoài dải này (dò hỏng) thì lấy 38%. */
const NECK_MIN = 0.22;
const NECK_MAX = 0.5;
const NECK_FALLBACK = 0.38;
/**
 * Dải tìm bàn tay: 58–70% chiều cao tính từ đỉnh. Đo trên atlas thật (idle): găng tay `player_hero_adult` ở 48–64%, bàn
 * tay `player_hero_adult_f` ở 56–67%. Hai mép bị loại có lý do:
 * - dưới 70%: vạt áo khoác loe rộng gần bằng tay (hero_adult hàng 64–66) — "đầu mút thấp nhất" rơi xuống vạt áo;
 * - trên 58%: đuôi tóc của bản nữ thò ra NGOÀI tay tới 56% (idle_S: cột 57 ở 37%, cột 49 ở 56%; mép tay cột 48) — bắt đầu sát vai thì "tay"
 *   là đuôi tóc. Cổ áo ở hướng ngang cũng thò hơn tay 1px.
 * Tay giơ cao (niệm phép, vung kiếm) nằm ngoài dải — động tác đó đã có vũ khí vẽ liền trong atlas, client ẩn lớp tay.
 */
const ARM_FROM = 0.58;
const ARM_TO = 0.7;

/**
 * Tính neo cho một khung. null = khung trống. Cách làm (đều chỉ dựa vào alpha):
 * 1. Mỗi hàng: cột trái nhất, phải nhất, SỐ điểm có hình, tổng x (để lấy trọng tâm).
 * 2. CỔ = hàng đầu tiên dưới hàng đầu đặc nhất (trong 32% trên) mà số điểm tụt còn ≤ 78%. Đếm điểm chứ không đo bề ngang:
 *    đuôi tóc mảnh nhưng thò xa làm bề ngang phình (bản nữ ra cổ ở ngực). Không lấy "hàng hẹp nhất": ở hướng nhìn ngang
 *    thân hẹp như cổ, hàng hẹp nhất rơi xuống thắt lưng (đã dẫm: idle_E ra cổ ở hàng 51 thay vì ~30).
 * 3. Tâm đầu x = TRỌNG TÂM các điểm trên cổ (đuôi tóc/dây buộc tóc chỉ kéo lệch ít), y = giữa đỉnh và cổ. Đỉnh đầu = hàng
 *    trên cùng có hình trong khoảng ±3px quanh tâm đầu (bỏ dây buộc tóc dựng lệch). Vai = 2 hàng dưới cổ, x = giữa thân.
 * 4. Tay = trong dải 58–70% chiều cao: cột trái nhất (tay trái màn hình) / phải nhất; hàng = hàng THẤP nhất còn chạm
 *    ĐÚNG cột đó — bàn tay là đầu mút dưới của cánh tay buông/vung ra.
 */
export function computeGearAnchors(img: AlphaImage): GearAnchors | null {
	const { width: W, height: H, data } = img;
	const minX = new Array<number>(H).fill(-1);
	const maxX = new Array<number>(H).fill(-1);
	const count = new Array<number>(H).fill(0);
	const sumX = new Array<number>(H).fill(0);
	const opaque = (x: number, y: number) => data[(y * W + x) * 4 + 3]! !== 0;
	let y0 = -1;
	let y1 = -1;
	for (let y = 0; y < H; y += 1) {
		for (let x = 0; x < W; x += 1) {
			if (!opaque(x, y)) continue;
			if (minX[y]! < 0) minX[y] = x;
			maxX[y] = x;
			count[y] = count[y]! + 1;
			sumX[y] = sumX[y]! + x;
		}
		if (minX[y]! >= 0) {
			if (y0 < 0) y0 = y;
			y1 = y;
		}
	}
	if (y0 < 0) return null;
	const h = y1 - y0 + 1;
	const at = (k: number) => Math.min(y1, y0 + Math.round(h * k));
	let dense = y0;
	for (let y = y0; y <= at(HEAD_SCAN); y += 1) if (count[y]! > count[dense]!) dense = y;
	let neck = -1;
	for (let y = dense + 1; y <= at(NECK_MAX); y += 1) {
		if (count[y]! > 0 && count[y]! <= count[dense]! * NECK_RATIO) {
			neck = y;
			break;
		}
	}
	if (neck < at(NECK_MIN)) neck = at(NECK_FALLBACK);

	let n = 0;
	let sx = 0;
	for (let y = y0; y < neck; y += 1) {
		n += count[y]!;
		sx += sumX[y]!;
	}
	const headX = n ? Math.round(sx / n) : Math.round((minX[neck]! + maxX[neck]!) / 2);
	let topY = y0;
	search: for (let y = y0; y < neck; y += 1) {
		for (let x = Math.max(0, headX - 3); x <= Math.min(W - 1, headX + 3); x += 1) {
			if (opaque(x, y)) {
				topY = y;
				break search;
			}
		}
	}
	const top: [number, number] = [headX, topY];
	const head: [number, number] = [headX, Math.round((topY + neck) / 2)];
	let sy = Math.min(y1, neck + 2);
	while (sy < y1 && minX[sy]! < 0) sy += 1;
	const back: [number, number] = [Math.round((minX[sy]! + maxX[sy]!) / 2), sy];

	const armFrom = Math.max(sy, at(ARM_FROM));
	const armTo = Math.max(armFrom, at(ARM_TO));
	let lx = W;
	let rx = -1;
	for (let y = armFrom; y <= armTo; y += 1) {
		if (minX[y]! < 0) continue;
		lx = Math.min(lx, minX[y]!);
		rx = Math.max(rx, maxX[y]!);
	}
	if (rx < 0) return { top, head, back, handL: [minX[sy]!, sy], handR: [maxX[sy]!, sy] };
	let ly = armFrom;
	let ry = armFrom;
	for (let y = armFrom; y <= armTo; y += 1) {
		if (minX[y]! === lx) ly = y;
		if (maxX[y]! === rx) ry = y;
	}
	return { top, head, back, handL: [lx, ly], handR: [rx, ry] };
}

/** Atlas JSON (dạng Pixi) — chỉ phần cần để gắn neo. */
interface AtlasJsonLike {
	frames: Record<string, { frame: { x: number; y: number; w: number; h: number }; gear?: GearAnchors }>;
}

/**
 * Ghi neo vào từng khung của atlas JSON (sửa tại chỗ, trả về số khung có neo). Ảnh atlas KHÔNG đổi — chỉ thêm trường
 * `gear` vào JSON. Dùng chung cho lúc đóng atlas (`buildCharacter`) và lệnh `anchors` (tính cho atlas đã xuất).
 */
export function annotateAtlas(json: AtlasJsonLike, sheet: AlphaImage): number {
	let n = 0;
	for (const f of Object.values(json.frames)) {
		const { x, y, w, h } = f.frame;
		const data = new Uint8Array(w * h * 4);
		for (let r = 0; r < h; r += 1) {
			const src = ((y + r) * sheet.width + x) * 4;
			for (let i = 0; i < w * 4; i += 1) data[r * w * 4 + i] = sheet.data[src + i]!;
		}
		const a = computeGearAnchors({ width: w, height: h, data });
		if (a) {
			f.gear = a;
			n += 1;
		} else delete f.gear;
	}
	return n;
}

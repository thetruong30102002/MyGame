import { alphaAt, colorKey, getPixel, opaqueBounds, type RGBAImage } from '../image/rgba.js';
import { eachFrame, findForeignClusters, type ForeignCluster } from '../normalize/cleanup.js';
import type { AnimationFrames } from '../normalize/PixelStyleNormalizer.js';
import { DIRECTIONS, type AnimationName, type Direction } from '../providers/types.js';

export type CheckStatus = 'pass' | 'fail' | 'manual';

export interface CheckResult {
	id: string;
	label: string;
	status: CheckStatus;
	detail: string;
}

export interface QualityReport {
	characterId: string;
	passed: boolean;
	checks: CheckResult[];
	foreignClusters: ForeignCluster[];
	stats: { frames: number; maxColorsPerFrame: number; microStepRatio: number };
}

export interface VisualReview {
	status: 'approved' | 'rejected';
	date: string;
	notes: string;
}

export interface QualityGateOptions {
	canvas: { width: number; height: number };
	requiredAnimations: Partial<Record<AnimationName, { minFrames: number; maxFrames: number }>>;
	/** Pixel art sạch hiếm khi cần quá số màu này trong một frame; ảnh AI bị nhoè thì vượt rất xa. */
	maxColorsPerFrame?: number;
	/** Kết quả duyệt bằng mắt (khai trong spec). Thiếu = chưa duyệt. */
	review?: VisualReview;
	/** Cụm "vật lạ" đã được người duyệt xác nhận là chi tiết thật (khai trong spec, bắt buộc có lý do). */
	allowForeign?: { animation: AnimationName; direction: Direction; frames?: number[]; reason: string }[];
	/** Bộ hướng bắt buộc (mặc định đủ 8). Bộ 4 hướng S/E/W/N: game tự dùng hướng gần nhất cho hướng chéo. */
	directions?: readonly Direction[];
	/** Hướng TẠM dùng ảnh tĩnh (chờ quota sinh animation) — miễn kiểm số frame, nhưng phải báo rõ trong report. */
	provisional?: readonly Direction[];
	/** Tỉ lệ lệch chiều cao cho phép giữa các frame cùng hướng (mặc định 0.08). Áo choàng dài tung khi bước cần rộng hơn. */
	maxHeightDrift?: number;
	/**
	 * Động tác CÓ vũ khí đã duyệt bằng mắt (kiếm thép, trượng): vũ khí mang màu không có trên thân và lưỡi kiếm có thể
	 * tách khỏi bàn tay → miễn phép kiểm "vật lạ" và "liền khối" cho các animation này. Idle/walk vẫn kiểm đủ.
	 */
	weaponAnims?: readonly AnimationName[];
}

/**
 * Cổng chất lượng — chạy SAU chuẩn hoá/dọn dẹp, trên đúng dữ liệu sẽ đóng vào atlas.
 * Mục "manual" (giải phẫu, chi thừa) máy không tự kết luận được: báo kèm contact sheet để người duyệt.
 */
export function runQualityGate(characterId: string, frames: AnimationFrames, opts: QualityGateOptions): QualityReport {
	const checks: CheckResult[] = [];
	const add = (id: string, label: string, ok: boolean, detail: string): void => {
		checks.push({ id, label, status: ok ? 'pass' : 'fail', detail });
	};

	const list: { img: RGBAImage; anim: AnimationName; dir: Direction; i: number }[] = [];
	eachFrame(frames, (img, anim, dir, i) => list.push({ img, anim, dir, i }));

	for (const [anim, range] of Object.entries(opts.requiredAnimations) as [AnimationName, { minFrames: number; maxFrames: number }][]) {
		const dirs = frames[anim] ?? {};
		const wanted = opts.directions ?? DIRECTIONS;
		const missing = wanted.filter((d) => !dirs[d]?.length);
		const real = wanted.filter((d) => !opts.provisional?.includes(d));
		const counts = real.map((d) => dirs[d]?.length ?? 0);
		const badCount = counts.filter((n) => n > 0 && (n < range.minFrames || n > range.maxFrames));
		const tmp = wanted.filter((d) => opts.provisional?.includes(d));
		add(
			`anim-${anim}`,
			`Animation ${anim}: đủ ${wanted.length} hướng, ${range.minFrames}–${range.maxFrames} frame`,
			missing.length === 0 && badCount.length === 0,
			missing.length ? `thiếu hướng ${missing.join(', ')}` : `${real.map((d) => `${d}:${dirs[d]?.length ?? 0}`).join(' ')}${tmp.length ? ` · TẠM ảnh tĩnh: ${tmp.join(', ')}` : ''}`,
		);
	}

	const empty = list.filter(({ img }) => opaqueBounds(img) === null);
	add(
		'no-empty-frames',
		'Không có frame rỗng (ô trống trong sheet nguồn)',
		empty.length === 0,
		empty.length ? `${empty.length} frame rỗng: ${empty.slice(0, 8).map((f) => `${f.anim}/${f.dir}#${f.i}`).join(', ')}` : 'mọi frame có hình',
	);

	const wrongSize = list.filter(({ img }) => img.width !== opts.canvas.width || img.height !== opts.canvas.height);
	add('dimensions', `Đúng kích thước ${opts.canvas.width}×${opts.canvas.height}`, wrongSize.length === 0, wrongSize.length ? `${wrongSize.length} frame sai cỡ` : 'mọi frame đúng cỡ');

	const dirtyBorder = list.filter(({ img }) => !borderTransparent(img));
	add('transparent-bg', 'Nền trong suốt (viền canvas rỗng)', dirtyBorder.length === 0, dirtyBorder.length ? `${dirtyBorder.length} frame chạm/lấn mép canvas` : 'mọi frame có viền rỗng');

	const semi = list.reduce((n, { img }) => n + countSemiAlpha(img), 0);
	add('crisp-alpha', 'Mép cứng: không có pixel bán trong suốt (không AA)', semi === 0, `${semi} pixel bán trong suốt`);

	const maxColors = Math.max(...list.map(({ img }) => uniqueColors(img)));
	const micro = list.reduce((n, { img }) => n + microStepRatio(img), 0) / Math.max(1, list.length);
	const colorLimit = opts.maxColorsPerFrame ?? 128;
	add('no-blur', 'Không nhoè: số màu/frame và tỉ lệ chuyển màu li ti', maxColors <= colorLimit && micro < 0.12, `tối đa ${maxColors} màu/frame (ngưỡng ${colorLimit}), micro-step ${(micro * 100).toFixed(1)}% (ngưỡng 12%)`);

	const heights = list.flatMap(({ img }) => {
		const b = opaqueBounds(img);
		return b ? [b.y1 - b.y0] : [];
	});
	const minH = Math.min(...heights);
	const maxH = Math.max(...heights);
	const ratioOk = minH >= opts.canvas.height * 0.45 && maxH <= opts.canvas.height * 0.95;
	add('silhouette-size', 'Silhouette đủ lớn để đọc được (45–95% chiều cao canvas)', ratioOk, `cao ${minH}–${maxH}px trên ${opts.canvas.height}px`);

	const fragments = list.filter(({ anim, img }) => !opts.weaponAnims?.includes(anim) && opaqueBounds(img) !== null && mainComponentShare(img) < 0.97);
	add('silhouette-solid', 'Silhouette liền khối (không mảnh rời)', fragments.length === 0, fragments.length ? fragments.slice(0, 6).map((f) => `${f.anim}/${f.dir}#${f.i}`).join(', ') : 'mọi frame liền khối');

	const drift: string[] = [];
	for (const [anim, dirs] of Object.entries(frames) as [AnimationName, Partial<Record<Direction, RGBAImage[]>>][]) {
		for (const [dir, imgs] of Object.entries(dirs) as [Direction, RGBAImage[]][]) {
			const hs = imgs.flatMap((img) => {
				const b = opaqueBounds(img);
				return b ? [b.y1 - b.y0] : [];
			});
			if (!hs.length) continue;
			const spread = Math.max(...hs) - Math.min(...hs);
			// Tương đối theo chiều cao: áo choàng/mũ lửa chuyển động làm hộp bao dao động tự nhiên.
			const limit = Math.max(6, Math.round(Math.max(...hs) * (opts.maxHeightDrift ?? 0.08)));
			if (spread > limit) drift.push(`${anim}/${dir} lệch ${spread}px (ngưỡng ${limit})`);
		}
	}
	add('proportions', `Tỉ lệ nhất quán giữa các frame cùng hướng (lệch cao ≤ ${Math.round((opts.maxHeightDrift ?? 0.08) * 100)}%)`, drift.length === 0, drift.length ? drift.join(', ') : 'ổn định');

	const foreignClusters = findForeignClusters(frames).filter(
		(c) => !opts.weaponAnims?.includes(c.animation) && !opts.allowForeign?.some((a) => a.animation === c.animation && a.direction === c.direction && (!a.frames || a.frames.includes(c.frame))),
	);
	add(
		'no-foreign-objects',
		'Không có vật/màu lạ chỉ xuất hiện ở vài frame (vũ khí ngẫu nhiên, đổi áo/tóc)',
		foreignClusters.length === 0,
		foreignClusters.length
			? foreignClusters.slice(0, 8).map((c) => `${c.animation}/${c.direction}#${c.frame} ${c.pixels}px ${c.colors.slice(0, 3).join(' ')}`).join('; ')
			: 'bảng màu nhất quán',
	);

	checks.push({
		id: 'anatomy',
		label: 'Duyệt bằng mắt: giải phẫu, vũ khí/trang phục/tóc không đổi giữa frame',
		status: opts.review ? (opts.review.status === 'approved' ? 'pass' : 'fail') : 'manual',
		detail: opts.review ? `${opts.review.date}: ${opts.review.notes}` : 'CHƯA DUYỆT — máy không kết luận được, xem contact sheet',
	});

	return {
		characterId,
		passed: checks.every((c) => c.status === 'pass'),
		checks,
		foreignClusters,
		stats: { frames: list.length, maxColorsPerFrame: maxColors, microStepRatio: micro },
	};
}

function borderTransparent(img: RGBAImage): boolean {
	for (let x = 0; x < img.width; x += 1) if (alphaAt(img, x, 0) || alphaAt(img, x, img.height - 1)) return false;
	for (let y = 0; y < img.height; y += 1) if (alphaAt(img, 0, y) || alphaAt(img, img.width - 1, y)) return false;
	return true;
}

function countSemiAlpha(img: RGBAImage): number {
	let n = 0;
	for (let i = 3; i < img.data.length; i += 4) if (img.data[i]! > 0 && img.data[i]! < 255) n += 1;
	return n;
}

function uniqueColors(img: RGBAImage): number {
	const s = new Set<number>();
	for (let y = 0; y < img.height; y += 1) for (let x = 0; x < img.width; x += 1) if (alphaAt(img, x, y)) s.add(colorKey(getPixel(img, x, y)));
	return s.size;
}

/**
 * Tỉ lệ cặp pixel kề nhau chênh màu RẤT nhỏ nhưng khác 0. Pixel art chuyển màu theo bậc rõ;
 * ảnh bị nội suy/nhoè sinh ra vô số bậc li ti.
 */
function microStepRatio(img: RGBAImage): number {
	let pairs = 0;
	let micro = 0;
	for (let y = 0; y < img.height; y += 1) {
		for (let x = 0; x < img.width - 1; x += 1) {
			if (!alphaAt(img, x, y) || !alphaAt(img, x + 1, y)) continue;
			const a = getPixel(img, x, y);
			const b = getPixel(img, x + 1, y);
			const d = Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
			pairs += 1;
			if (d > 0 && d <= 12) micro += 1;
		}
	}
	return pairs ? micro / pairs : 0;
}

function mainComponentShare(img: RGBAImage): number {
	const seen = new Uint8Array(img.width * img.height);
	let total = 0;
	let best = 0;
	for (let y = 0; y < img.height; y += 1) {
		for (let x = 0; x < img.width; x += 1) {
			if (!alphaAt(img, x, y) || seen[y * img.width + x]) continue;
			let size = 0;
			const stack: [number, number][] = [[x, y]];
			seen[y * img.width + x] = 1;
			while (stack.length) {
				const [cx, cy] = stack.pop()!;
				size += 1;
				for (let dy = -1; dy <= 1; dy += 1) {
					for (let dx = -1; dx <= 1; dx += 1) {
						const nx = cx + dx;
						const ny = cy + dy;
						if (nx < 0 || ny < 0 || nx >= img.width || ny >= img.height) continue;
						if (seen[ny * img.width + nx] || !alphaAt(img, nx, ny)) continue;
						seen[ny * img.width + nx] = 1;
						stack.push([nx, ny]);
					}
				}
			}
			total += size;
			best = Math.max(best, size);
		}
	}
	return total ? best / total : 0;
}

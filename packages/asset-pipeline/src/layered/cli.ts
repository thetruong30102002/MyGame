/**
 * Lệnh nhân vật ghép lớp (chuẩn: docs/thiet-ke/chuan-nhan-vat-ghep-lop.md):
 *   npx tsx src/layered/cli.ts plan <mẫu>                       kiểm bảng kế hoạch theo chuẩn, in prompt + lượt dự tính (0 lượt)
 *   npx tsx src/layered/cli.ts balance                          số dư token #1
 *   npx tsx src/layered/cli.ts run <mẫu> <chặng> <món> --yes    gửi một món lên PixelLab, chờ xong, tải gói, ghi sổ lượt thật
 *   npx tsx src/layered/cli.ts process <mẫu> A                  chuẩn hoá + đo cổ + tách 3 lớp + xuất trang soi (0 lượt)
 *   npx tsx src/layered/cli.ts process <mẫu> B                  bộ đồ: cắt theo neo thân trần, ghép đầu, mặc / tháo đồ, đi / chạy (0 lượt)
 *   npx tsx src/layered/cli.ts process <mẫu> C                  đòn chém: thân tay không + kiếm vẽ theo góc, tách đủ lớp, trang soi (0 lượt)
 *   npx tsx src/layered/cli.ts process <mẫu> D                  đổi đầu: đầu 2 lên thân bộ đồ đã cắt ở đứng / đi / chạy / chém (0 lượt)
 *   npx tsx src/layered/cli.ts process <mẫu> <chặng> <món sửa>   trang chọn bản của món edit_image_pixen (0 lượt)
 *   npx tsx src/layered/cli.ts estimate <mẫu> <món nhân vật> <hướng…>  đo khung xương ảnh xoay đứng (estimate-skeleton, 0,1 lượt / hướng)
 *   npx tsx src/layered/cli.ts skeleton <mẫu> <tên>             dựng khung xương đòn đánh từ skeleton/<tên>.spec.json (0 lượt)
 * Không có --yes thì `run` chỉ in việc sẽ làm. Lượt thật = số dư trước − sau; vượt ước tính > stopIfOverEstimatePct thì dừng chặng.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from '../env.js';
import { blit, cloneImage, createImage, encodePng, readPng, writePng, type RGBAImage } from '../image/rgba.js';
import { callWhenFree, waitCharacter, waitImages } from '../pixellab/jobs.js';
import { estimateSkeleton, type Keypoint } from '../pixellab/skeleton.js';
import { buildSlash, mirrorSpecToNorth, padKeypoints, type SlashSpec } from './slashSkeleton.js';
import { BASIC_BOW, BASIC_SHIELD, BASIC_SPEAR, BASIC_STAFF, BASIC_SWORD, BOW_BACK, drawWeapon, nearestAngle, SHIELD_BACK, SPEAR_BACK, STAFF_BACK, SWORD_BACK, type WeaponDesign } from './weapon.js';
import { extractJobId, padCenter } from '../vfx/pixellabVfx.js';
import { PixelLabMcp } from '../pixellab/mcp.js';
import { downloadPixelLab, PixelLabSource } from '../pixellab/source.js';
import { alignHead, binarizeAlpha, cellOffset, composeHead, cutHead, extractHead, footRoot, measureNeck, neckSeamHoles, placeInCell, shiftCut, unlikePixels, headTopAt, headMaskProtect, type HeadCut, type NeckMeasure } from './cut.js';
import { blockingStage, itemArgs, LAYERED_SOURCES, loadPlan, validatePlan, type PlanItem } from './plan.js';
import { atlasFrame, referenceInCell, townGroundPatch } from './reference.js';
import { writeReview, type ReviewClip, type ReviewFrame } from './review.js';
import { loadLayeredStandard, mirrorDir, mirrorImage, type DirId, type LayeredStandard, type Point } from './standard.js';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const REVIEW_ROOT = join(REPO, 'apps', 'server', 'site', 'media', 'layered');

interface JobRecord {
	item: string;
	tool: string;
	characterId: string;
	jobIds?: string[];
	rejected?: string;
	/** Ghi chú một phần hỏng (vd một hướng) đã vẽ lại ở món khác. */
	note?: string;
	estimate: number;
	actual: number | null;
	balanceBefore: number;
	balanceAfter: number | null;
	at: string;
}

const ledgerPath = (sample: string): string => join(LAYERED_SOURCES, sample, 'jobs.json');
const readLedger = (sample: string): JobRecord[] => (existsSync(ledgerPath(sample)) ? (JSON.parse(readFileSync(ledgerPath(sample), 'utf8')) as JobRecord[]) : []);
const writeLedger = (sample: string, jobs: JobRecord[]): void => writeFileSync(ledgerPath(sample), `${JSON.stringify(jobs, null, '\t')}\n`);

function rawToken(): string {
	const t = (loadEnv(REPO).PIXELLAB_TOKENS ?? '').split(',').map((s) => s.trim()).filter(Boolean)[0];
	if (!t) throw new Error('Thiếu PIXELLAB_TOKENS trong .env.local');
	return t;
}

const token = (): PixelLabMcp => new PixelLabMcp(rawToken());

const skeletonDir = (sample: string): string => join(LAYERED_SOURCES, sample, 'skeleton');
const rotationSkeletonPath = (sample: string, charItem: string): string => join(skeletonDir(sample), `rotation-${charItem}.json`);

/** Ảnh xoay đứng (đã tải) của một món nhân vật theo tên hướng PixelLab. */
function rotationImage(sample: string, charItem: string, pixellabDir: string, std: LayeredStandard): RGBAImage {
	const d = std.directions.find((x) => x.pixellab === pixellabDir);
	if (!d) throw new Error(`Hướng "${pixellabDir}" không có trong chuẩn`);
	const img = new PixelLabSource(join(LAYERED_SOURCES, sample, 'raw', charItem)).rotation(d.id);
	if (!img) throw new Error(`${charItem}: thiếu ảnh xoay ${pixellabDir}`);
	return img;
}

/** Đo khung xương ảnh xoay đứng (0,1 lượt / hướng) → skeleton/rotation-<món>.json, gộp với hướng đã đo. */
async function estimate(sample: string, charItem: string, dirs: string[], std: LayeredStandard): Promise<void> {
	const path = rotationSkeletonPath(sample, charItem);
	const out = (existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {}) as Record<string, unknown>;
	for (const d of dirs) {
		const img = rotationImage(sample, charItem, d, std);
		out[d] = { size: [img.width, img.height], keypoints: await estimateSkeleton(rawToken(), img) };
		console.log(`✔ ${charItem} ${d}: ${img.width}×${img.height}`);
	}
	mkdirSync(skeletonDir(sample), { recursive: true });
	writeFileSync(path, `${JSON.stringify(out, null, '\t')}\n`);
}

/** Khung xương đòn đánh đã dựng (skeleton/<tên>.json): cỡ ảnh đã đệm, khung xương ảnh đầu, các khung + điểm nắm / góc lưỡi. */
interface BuiltSkeleton {
	character: string;
	/** Ảnh khung đầu là ảnh sửa (raw/<món>/seed-<bản>.png) thay vì ảnh xoay của nhân vật. */
	firstImage?: string;
	direction: string;
	size: [number, number];
	pad: [number, number, number, number];
	first: ReturnType<typeof padKeypoints>;
	frames: ReturnType<typeof buildSlash>;
}

async function buildSkeleton(sample: string, name: string): Promise<void> {
	// `rest`: "<món sửa ảnh>#<bản>" — ảnh đầu là ẢNH SỬA (class mặc đồ trên thân nền G1, chặng R): đo khung xương ảnh đó một lần.
	const spec = JSON.parse(readFileSync(join(skeletonDir(sample), `${name}.spec.json`), 'utf8')) as SlashSpec & { character: string; rest?: string };
	type Rest = { size: [number, number]; keypoints: Parameters<typeof buildSlash>[1] };
	let rot: Rest | undefined;
	const [restItem, restSeed] = (spec.rest ?? '').split('#') as [string, string | undefined];
	if (spec.rest) {
		const cache = join(skeletonDir(sample), `rest-${restItem}-${restSeed}.json`);
		if (!existsSync(cache)) {
			const img = readPng(join(LAYERED_SOURCES, sample, 'raw', restItem, `seed-${restSeed}.png`));
			writeFileSync(cache, `${JSON.stringify({ size: [img.width, img.height], keypoints: await estimateSkeleton(rawToken(), img) })}\n`);
		}
		rot = JSON.parse(readFileSync(cache, 'utf8')) as Rest;
	} else rot = (JSON.parse(readFileSync(rotationSkeletonPath(sample, spec.character), 'utf8')) as Record<string, Rest>)[spec.direction];
	if (!rot) throw new Error(`Chưa đo khung xương ${spec.character} ${spec.direction} (lệnh estimate)`);
	const frames = buildSlash(spec, rot.keypoints, rot.size);
	const [pl, pr, pt, pb] = spec.pad;
	const built: BuiltSkeleton = { character: spec.character, ...(spec.rest ? { firstImage: `${restItem}/seed-${restSeed}.png` } : {}), direction: spec.direction, size: [rot.size[0] + pl + pr, rot.size[1] + pt + pb], pad: spec.pad, first: padKeypoints(rot.keypoints, rot.size, spec.pad), frames };
	// PixelLab từ chối cả job khi một khớp ra ngoài ảnh (06/11: nắm tay sát vai → IK đẩy khuỷu ra x 1,26) — chặn trước khi gửi.
	frames.forEach((f, i) => {
		const out = f.keypoints.find((k) => k.x < 0 || k.x > 1 || k.y < 0 || k.y > 1);
		if (out) throw new Error(`${name} khung ${i + 1}: khớp ${out.label} ra ngoài ảnh (${out.x.toFixed(2)}, ${out.y.toFixed(2)}) — sửa bảng tư thế`);
	});
	writeFileSync(join(skeletonDir(sample), `${name}.json`), `${JSON.stringify(built, null, '\t')}\n`);
	console.log(`✔ skeleton/${name}.json: ${frames.length} khung, ảnh ${built.size.join('×')}`);
}

/**
 * Chuyển khung xương động tác của thân NAM sang thân NỮ (bộ nữ một khuôn, chủ dự án 31/10): đo khung xương đứng của ảnh mặc đồ nữ
 * (estimate-skeleton 0,1 lượt, lưu `rest-<món>-<bản>.json`); mỗi khớp từng khung = khớp đứng nữ + (khớp khung nam − khớp đứng nam). Giữ
 * nhịp / tư thế đã duyệt của nam, vai hẹp / hông thon theo thân nữ. Điểm nắm dời theo cổ tay phải (cùng độ lệch đứng nữ − nam).
 */
async function transferSkeleton(sample: string, from: string, name: string, target: string): Promise<void> {
	const dir = skeletonDir(sample);
	const sk = JSON.parse(readFileSync(join(dir, `${from}.json`), 'utf8')) as BuiltSkeleton;
	const [item, seed] = target.split('#') as [string, string];
	const cache = join(dir, `rest-${item}-${seed}.json`);
	if (!existsSync(cache)) {
		const img = readPng(join(LAYERED_SOURCES, sample, 'raw', item, `seed-${seed}.png`));
		writeFileSync(cache, `${JSON.stringify({ size: [img.width, img.height], keypoints: await estimateSkeleton(rawToken(), img) })}\n`);
	}
	const rest = JSON.parse(readFileSync(cache, 'utf8')) as { size: [number, number]; keypoints: Keypoint[] };
	const [W, H] = sk.size;
	const [pl, , pt] = sk.pad;
	const fem = new Map(rest.keypoints.map((k) => [k.label, [k.x * rest.size[0] + pl, k.y * rest.size[1] + pt] as Point]));
	const male = new Map(sk.first.map((k) => [k.label, [k.x * W, k.y * H] as Point]));
	const delta = (label: string): Point => {
		const [f, m] = [fem.get(label), male.get(label)];
		if (!f || !m) throw new Error(`Thiếu khớp ${label} ở khung xương đứng nữ / nam`);
		return [f[0] - m[0], f[1] - m[1]];
	};
	const frames = sk.frames.map((f) => {
		const keypoints = f.keypoints.map((k) => {
			const [dx, dy] = delta(k.label);
			return { ...k, x: (k.x * W + dx) / W, y: (k.y * H + dy) / H };
		});
		const [gx, gy] = delta('RIGHT ARM');
		return { ...f, keypoints, ...(f.grip ? { grip: [Math.round(f.grip[0] + gx), Math.round(f.grip[1] + gy)] as Point } : {}) };
	});
	const out: BuiltSkeleton = { ...sk, character: item, firstImage: `${item}/seed-${seed}.png`, first: padKeypoints(rest.keypoints, rest.size, sk.pad), frames };
	writeFileSync(join(dir, `${name}.json`), `${JSON.stringify(out, null, '\t')}\n`);
	const shoulder = (m: Map<string, Point>): number => Math.abs(m.get('LEFT SHOULDER')![0] - m.get('RIGHT SHOULDER')![0]);
	console.log(`✔ skeleton/${name}.json: ${frames.length} khung chuyển từ ${from} (vai nam ${shoulder(male).toFixed(1)}px → nữ ${shoulder(fem).toFixed(1)}px), ảnh đầu ${item}#${seed}`);
}

/** Ảnh đầu cho animate_with_skeleton_v3: ảnh xoay đứng đệm trong suốt theo pad (không scale). */
function paddedRotation(sample: string, sk: BuiltSkeleton, std: LayeredStandard): RGBAImage {
	const img = sk.firstImage ? readPng(join(LAYERED_SOURCES, sample, 'raw', sk.firstImage)) : rotationImage(sample, sk.character, sk.direction, std);
	const out = createImage(sk.size[0], sk.size[1]);
	blit(out, img, sk.pad[0], sk.pad[2]);
	return out;
}

async function remaining(mcp: PixelLabMcp): Promise<number> {
	const text = await mcp.call('get_balance', {});
	const n = /generations_remaining:\s*(\d+)/.exec(text)?.[1];
	if (n === undefined) throw new Error(`Không đọc được số dư: ${text.slice(0, 200)}`);
	return Number(n);
}

function checkedPlan(sample: string, std: LayeredStandard) {
	const plan = loadPlan(sample);
	const errors = validatePlan(plan, std,{renderExistingOnly:['mould','export','process','share'].includes(process.argv[2]??'')});
	if (errors.length) throw new Error(`Bảng kế hoạch ${sample} sai chuẩn:\n- ${errors.join('\n- ')}`);
	return plan;
}

function printPlan(sample: string, std: LayeredStandard): void {
	const plan = checkedPlan(sample, std);
	console.log(`${plan.title} — đạt chuẩn v${std.version}`);
	for (const [id, stage] of Object.entries(plan.stages)) {
		const sum = stage.items.reduce((n, it) => n + it.estimate, 0);
		console.log(`\nChặng ${id} (${stage.round}): ${stage.goal}\n  dự tính ${sum} lượt, tối đa ${(sum * std.budget.rerollFactor).toFixed(1)} khi vẽ lại`);
		for (const it of stage.items) console.log(`  · ${it.id} — ${it.tool}, ~${it.estimate} lượt: ${it.purpose}\n    ${JSON.stringify(itemArgs(it, std))}`);
	}
}

async function run(sample: string, stageId: string, itemId: string, yes: boolean, std: LayeredStandard): Promise<void> {
	const plan = checkedPlan(sample, std);
	const stage = plan.stages[stageId];
	const item = stage?.items.find((i) => i.id === itemId);
	if (!stage || !item) throw new Error(`Không có món ${stageId}/${itemId}`);
	if (item.dropped) throw new Error(`${item.id} đã bỏ: ${item.dropped}`);
	const ledger = readLedger(sample);
	if (ledger.some((j) => j.item === item.id && j.actual !== null && !j.rejected)) throw new Error(`${item.id} đã vẽ (xem jobs.json) — muốn vẽ lại thì xoá dòng đó, có lý do`);
	const args = itemArgs(item, std);
	const rawDir = join(LAYERED_SOURCES, sample, 'raw');
	if (item.tool === 'create_character' && item.reference) {
		if (item.pick === null || item.pick === undefined) throw new Error(`${item.id}: chủ dự án chưa chọn bản từ ${item.reference} (điền "pick" là seed đã chọn trong plan.json)`);
		args.reference_image_base64 = encodePng(readPng(join(rawDir, item.reference, `seed-${item.pick}.png`))).toString('base64');
	}
	const charOf = (it: PlanItem): string => {
		const rec = ledger.find((j) => j.item === it.character && j.actual !== null);
		if (!rec) throw new Error(`${it.id} cần ${it.character} vẽ xong trước`);
		return rec.characterId;
	};
	if (item.tool === 'animate_character') args.character_id = charOf(item);
	const shown = { ...args, ...(args.reference_image_base64 ? { reference_image_base64: `<ảnh ${item.reference}/seed-${item.pick}.png>` } : {}) };
	console.log(`${item.id}: ${item.tool}, dự tính ~${item.estimate} lượt\n${JSON.stringify(shown, null, 2)}`);
	if (!yes) return void console.log('\n(chưa gửi — thêm --yes để tiêu lượt)');
	const gate = blockingStage(plan, stageId);
	if (gate) throw new Error(`Chặng ${gate} chưa được chủ dự án duyệt (plan.json stages.${gate}.approved) — chưa mở chặng ${stageId}`);

	const mcp = token();
	const before = await remaining(mcp);
	if (before < item.estimate * 2) throw new Error(`Số dư ${before} quá sát dự tính ${item.estimate} — dừng`);
	if (item.tool === 'edit_image_pixen') {
		// Sửa CHÍNH ảnh mẫu phong cách (giữ nét anime) — mỗi seed một bản; cạnh bội 4 theo yêu cầu công cụ (đệm trong suốt, không scale).
		let src: RGBAImage;
		if (item.sourceItem && (item.sourcePick === null || item.sourcePick === undefined)) throw new Error(`${item.id}: chủ dự án chưa chọn bản nguồn từ ${item.sourceItem} (điền "sourcePick" trong plan.json)`);
		if (item.sourceGuide) {
			// Khung hình học vũ khí (lệnh weapon-guides) — dựng lại mỗi lần chạy từ điểm gắn hiện hành.
			const [attack, view] = item.sourceGuide.split('/') as [string, string];
			src = weaponGuide(attack, view);
		} else if (item.sourceRotation) src = rotationImage(sample, item.sourceRotation.item, item.sourceRotation.dir, std);
		else if (item.sourceItem) src = readPng(join(rawDir, item.sourceItem, `seed-${item.sourcePick}.png`));
		else {
			const [charId, frame] = std.style.reference[item.source!].split('/') as [string, string];
			src = atlasFrame(charId, frame);
		}
		src = item.padTo ? padCenter(src, item.padTo[0], item.padTo[1]) : padCenter(src, Math.ceil(src.width / 4) * 4, Math.ceil(src.height / 4) * 4);
		writePng(join(rawDir, item.id, 'source.png'), src);
		const jobIds: string[] = [];
		for (const seed of item.seeds!) {
			const text = await callWhenFree(mcp, item.tool, { ...args, image_base64: encodePng(src).toString('base64'), seed });
			const jobId = extractJobId(text);
			if (!jobId) throw new Error(`Không đọc được job: ${text.slice(0, 300)}`);
			jobIds.push(jobId);
			const [img] = await waitImages(mcp, jobId, 1);
			writePng(join(rawDir, item.id, `seed-${seed}.png`), img!);
			console.log(`  ✔ bản seed ${seed} → raw/${item.id}/seed-${seed}.png`);
		}
		const after = await remaining(mcp);
		const rec: JobRecord = { item: item.id, tool: item.tool, characterId: '', jobIds, estimate: item.estimate, actual: before - after, balanceBefore: before, balanceAfter: after, at: new Date().toISOString() };
		writeLedger(sample, [...readLedger(sample).filter((j) => j.item !== item.id || j.rejected), rec]);
		console.log(`✔ ${item.id}: thật ${rec.actual} lượt (dự tính ${item.estimate}), còn ${after}`);
		if (((rec.actual! - item.estimate) / item.estimate) * 100 > std.budget.stopIfOverEstimatePct) throw new Error('DỪNG: vượt dự tính quá ngưỡng');
		return;
	}
	if (item.tool === 'inpaint_image_pro_flash') {
		// Vũ khí đeo lưng: vẽ trong hình khung (mặt nạ = khung nở 1px, trắng = vẽ), ảnh mẫu kiểu dáng là tranh đã chọn của hướng khác.
		const [attack, dir] = item.sourceGuide!.split('/') as [string, string];
		const guide = weaponGuide(attack, dir);
		const mask = createImage(guide.width, guide.height);
		for (let y = 0; y < guide.height; y += 1)
			for (let x = 0; x < guide.width; x += 1) {
				const near = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
					const [xx, yy] = [x + dx!, y + dy!];
					return xx >= 0 && yy >= 0 && xx < guide.width && yy < guide.height && guide.data[(yy * guide.width + xx) * 4 + 3] !== 0;
				});
				const v = near ? 255 : 0;
				mask.data.set([v, v, v, 255], (y * guide.width + x) * 4);
			}
		const [refItem, refSeed] = item.styleRef!.split('#') as [string, string];
		const ref = readPng(join(rawDir, refItem, `seed-${refSeed}.png`));
		const pair = createImage(ref.width + guide.width, Math.max(ref.height, guide.height));
		blit(pair, ref, 0, 0);
		blit(pair, guide, ref.width, 0);
		const outDir = join(rawDir, item.id);
		mkdirSync(outDir, { recursive: true });
		writePng(join(outDir, 'source.png'), guide);
		writePng(join(outDir, 'mask.png'), mask);
		const description = String(itemArgs(item, std).description ?? item.weapon);
		const jobIds: string[] = [];
		for (const seed of item.seeds!) {
			const text = await callWhenFree(mcp, item.tool, {
				description, image_base64: encodePng(guide).toString('base64'), mask_image_base64: encodePng(mask).toString('base64'), no_background: true, seed,
				// Ảnh ngữ cảnh phải CHỨA ảnh nguồn (bounding_box): ghép [kiếm mẫu | khung cần vẽ].
				context_image: { base64: encodePng(pair).toString('base64'), usage_description: 'the left item is the reference: draw exactly this same sword design, colors and pixel style' },
				bounding_box: { x: ref.width, y: 0, width: guide.width, height: guide.height },
			});
			const jobId = extractJobId(text);
			if (!jobId) throw new Error(`Không đọc được job: ${text.slice(0, 300)}`);
			jobIds.push(jobId);
			const [img] = await waitImages(mcp, jobId, 1);
			writePng(join(outDir, `seed-${seed}.png`), img!);
			console.log(`  ✔ bản seed ${seed} → raw/${item.id}/seed-${seed}.png`);
		}
		const after = await remaining(mcp);
		const rec: JobRecord = { item: item.id, tool: item.tool, characterId: '', jobIds, estimate: item.estimate, actual: before - after, balanceBefore: before, balanceAfter: after, at: new Date().toISOString() };
		writeLedger(sample, [...readLedger(sample).filter((j) => j.item !== item.id || j.rejected), rec]);
		console.log(`✔ ${item.id}: thật ${rec.actual} lượt (dự tính ${item.estimate}), còn ${after}`);
		if (((rec.actual! - item.estimate) / item.estimate) * 100 > std.budget.stopIfOverEstimatePct) throw new Error('DỪNG: vượt dự tính quá ngưỡng');
		return;
	}
	if (item.tool === 'animate_with_skeleton_v3') {
		const sk = JSON.parse(readFileSync(join(skeletonDir(sample), `${item.skeleton}.json`), 'utf8')) as BuiltSkeleton;
		if (sk.character !== item.character || sk.direction !== args.direction) throw new Error(`${item.id}: khung xương ${item.skeleton} dựng cho ${sk.character} ${sk.direction}, món cần ${item.character} ${String(args.direction)}`);
		const first = paddedRotation(sample, sk, std);
		const outDir = join(rawDir, item.id);
		mkdirSync(outDir, { recursive: true });
		writePng(join(outDir, 'first.png'), first);
		const text = await callWhenFree(mcp, item.tool, { ...args, first_frame_base64: encodePng(first).toString('base64'), first_frame_keypoints: sk.first, keypoints: sk.frames.map((f) => f.keypoints) });
		const jobId = extractJobId(text);
		if (!jobId) throw new Error(`PixelLab không nhận ${item.id}: ${text.slice(0, 400)}`);
		const rec: JobRecord = { item: item.id, tool: item.tool, characterId: '', jobIds: [jobId], estimate: item.estimate, actual: null, balanceBefore: before, balanceAfter: null, at: new Date().toISOString() };
		writeLedger(sample, [...readLedger(sample).filter((j) => j.item !== item.id || j.rejected), rec]);
		console.log(`  đã gửi → job ${jobId}; chờ PixelLab vẽ ${sk.frames.length} khung…`);
		const imgs = await waitImages(mcp, jobId, sk.frames.length);
		imgs.forEach((img, i) => writePng(join(outDir, `frame-${String(i).padStart(2, '0')}.png`), img));
		const after = await remaining(mcp);
		rec.balanceAfter = after;
		rec.actual = before - after;
		writeLedger(sample, [...readLedger(sample).filter((j) => j.item !== item.id || j.rejected), rec]);
		console.log(`✔ ${item.id}: thật ${rec.actual} lượt (dự tính ${item.estimate}), còn ${after}. Khung ở raw/${item.id}/ (${imgs[0]!.width}×${imgs[0]!.height})`);
		if (((rec.actual - item.estimate) / item.estimate) * 100 > std.budget.stopIfOverEstimatePct) throw new Error('DỪNG: vượt dự tính quá ngưỡng');
		return;
	}
	const text = await callWhenFree(mcp, item.tool, args);
	// Động tác: câu trả lời phải có job — PixelLab từ chối thì trả chữ, không ném lỗi (dẫm 28/10: tải gói cũ rồi ghi 0 lượt như đã xong).
	if (item.tool === 'animate_character') {
		const jobs = (text.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g) ?? []).filter((id) => id !== args.character_id);
		console.log(`  PixelLab: ${text.split(String.fromCharCode(10)).slice(0, 4).join(' | ').slice(0, 300)}`);
		if (!jobs.length) throw new Error(`PixelLab không nhận động tác ${item.id}: ${text.slice(0, 400)}`);
	}
	const characterId = item.tool === 'animate_character' ? String(args.character_id) : /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/.exec(text)?.[0];
	if (!characterId) throw new Error(`Không đọc được id nhân vật: ${text.slice(0, 400)}`);
	const rec: JobRecord = { item: item.id, tool: item.tool, characterId, estimate: item.estimate, actual: null, balanceBefore: before, balanceAfter: null, at: new Date().toISOString() };
	writeLedger(sample, [...ledger.filter((j) => j.item !== item.id || j.rejected), rec]);
	console.log(`  đã gửi → nhân vật ${characterId}; chờ PixelLab vẽ…`);
	await waitCharacter(mcp, characterId);
	const status = await mcp.call('get_character', { character_id: characterId });
	if (/status:\s*failed/i.test(status)) throw new Error(`PixelLab báo hỏng: ${status.split(/\r?\n/).slice(0, 6).join(' | ')}`);
	const rootId = item.tool === 'animate_character' ? item.character! : item.id;
	await downloadPixelLab(join(LAYERED_SOURCES, sample, 'raw'), rootId, characterId);
	const after = await remaining(mcp);
	rec.balanceAfter = after;
	rec.actual = before - after;
	writeLedger(sample, [...readLedger(sample).filter((j) => j.item !== item.id || j.rejected), rec]);
	const over = ((rec.actual - item.estimate) / item.estimate) * 100;
	console.log(`✔ ${item.id}: thật ${rec.actual} lượt (dự tính ${item.estimate}), còn ${after}. Gói ở raw/${rootId}/`);
	if (over > std.budget.stopIfOverEstimatePct) throw new Error(`DỪNG: vượt dự tính ${over.toFixed(0)}% (> ${std.budget.stopIfOverEstimatePct}%) — xem lại cách làm trước khi vẽ tiếp`);
}

const DRAWN: DirId[] = ['S', 'SE', 'E', 'NE', 'N'];
const ALL: DirId[] = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'];

/** Trang soi các bản sửa từ ảnh mẫu (món edit_image_pixen) để chủ dự án chọn một bản — đặt cạnh ảnh mẫu gốc. */
function processEdit(sample: string, stageId: string, itemId: string, std: LayeredStandard): void {
	const item = checkedPlan(sample, std).stages[stageId]?.items.find((i) => i.id === itemId && i.tool === 'edit_image_pixen');
	if (!item) throw new Error(`Không có món sửa ảnh ${stageId}/${itemId}`);
	const dir = join(LAYERED_SOURCES, sample, 'raw', item.id);
	const cell = (img: RGBAImage): RGBAImage => {
		binarizeAlpha(img);
		return placeInCell(img, cellOffset(img, std), std);
	};
	const frames: ReviewFrame[] = [
		{ body: cell(readPng(join(dir, 'source.png'))), head: null, neck: [0, 0], durationMs: 1200, issues: [item.sourceItem ? `ẢNH GỐC (${item.sourceItem} seed ${item.sourcePick})` : 'ẢNH MẪU GỐC (npc_silver_youth)'] },
		...item.seeds!.map((seed) => ({ body: cell(readPng(join(dir, `seed-${seed}.png`))), head: null, neck: [0, 0] as Point, durationMs: 1200, issues: [`Bản seed ${seed}`] })),
	];
	const slug = `${sample}-${itemId.toLowerCase()}`;
	const page = writeReview({
		id: slug,
		title: `${sample} · ${itemId} — chọn bản (${item.purpose})`,
		notes: ['Bấm "dừng" rồi bấm từng khung để so: khung 1 là ảnh gốc, các khung sau là các bản sửa.', 'Chọn bản giữ đúng mặt anime / tỷ lệ / nét, cổ không dài, không có khăn / cổ áo / giáp vai; tóc không chạm cổ hay vai.'],
		clips: [{ id: 'candidates', label: 'Ảnh mẫu → các bản sửa', dir: 'S', loop: true, frames }],
		mapTile: townGroundPatch(join(LAYERED_SOURCES, sample, 'processed', 'map.png')) ?? undefined,
	}, join(REVIEW_ROOT, slug), std);
	console.log(`✔ trang soi: ${page}\n  link: https://admin.tail024813.ts.net/site/media/layered/${slug}/index.html`);
}

/** Ba lớp tách từ một khung "thân gốc + tóc" (toạ độ ô) và phép kiểm. */
interface Layers {
	full: RGBAImage;
	body: RGBAImage;
	head: RGBAImage;
	hairBack: RGBAImage | null;
	neck: Point;
	/**
	 * Neo CẰM (cổ da thuộc thân): ngay trên đỉnh dải cổ đã chuyển sang thân, toạ độ ô. Ở khung thân = chỗ đáy cằm của đầu nào cũng phải đặt
	 * vào (thân chúi / xoay thì đỉnh cổ lệch neo cổ); ở đầu = đáy cằm của chính đầu đó. Thiếu (không thấy dải cổ) thì dùng neo cổ.
	 */
	chin?: Point;
	/** Hướng của khung (luật chuẩn điểm đặt đầu theo hướng: chính diện / nghiêng / sau lưng). */
	dir?: DirId;
	/** Đỉnh dải cổ đã chuyển sang thân (tâm, hàng ngay trên) — cổ của thân / của khuôn thân nền. */
	neckTop?: Point;
	/** Đầu vẽ trên khuôn thân nền chung (chặng P): đặt bằng cách khớp ĐỈNH CỔ khuôn với đỉnh cổ khung thân, không theo mặt. */
	byNeck?: boolean;
	/** Số đo cắt của khung (neo, đỉnh đầu, dải cổ) — bản mặc đồ dời theo khớp đầu. */
	cut: HeadCut;
	issues: string[];
	stats: Record<string, unknown>;
	/**
	 * TÓC DÀI dưới đường cổ (đầu nữ tóc dài — chủ dự án 31/10 chọn "cho phép tóc dài"): canvas `LONG_HAIR_CANVAS`, neo cổ ở
	 * `LONG_HAIR_ANCHOR` (góc trên trái = neo cổ của đầu − neo này), đi theo đầu từng khung. Nhìn trước / nghiêng tóc buông SAU vai → vẽ DƯỚI thân; nhìn sau tóc phủ
	 * lưng → vẽ TRÊN thân (`hairLongFront`).
	 */
	hairLong?: RGBAImage | null;
	hairLongFront?: boolean;
}

/**
 * Canvas lớp tóc dài: ±32px quanh neo cổ (tóc nhìn nghiêng buông sau lưng tới 24px sau cổ — canvas 48 lật sang W ra ngoài ô, dẫm 31/10),
 * 40px trên tới 72px dưới neo cổ (tóc tới hông).
 */
const LONG_HAIR_CANVAS: Point = [64, 112];
const LONG_HAIR_ANCHOR: Point = [32, 40];

/**
 * Tách tóc sau / thân / đầu theo số đo cổ; ghép lại phải trùng ảnh nguồn từng pixel (Q1), không hở cổ (Q5), không sót đầu trên thân (Q2).
 * Thước cổ (body.neckLengthRule) chỉ áp cho hướng S — nhìn từ sau tóc gáy che cổ nên cổ thấy được ngắn hơn, không phải lỗi.
 */
/**
 * Tách 3 lớp ảnh xoay "thân gốc + tóc" theo thân trọc cùng hướng: đo cổ từ vai lên quanh hàng cổ thân trọc; tóc che kín gáy (bob nhìn
 * ngang / từ sau, dẫm 29/10 đầu nữ 1) thì lấy neo đo trên thân trọc, dời theo độ lệch thân (khớp phần dưới cổ ±3px) — đầu sửa trên chính
 * thân trọc này. Nhìn từ sau: tóc rủ qua gáy còn ở thân chuyển sang lớp đầu.
 */
function splitHaired(cell: RGBAImage, baldCell: RGBAImage, nearY: number, d: DirId, std: LayeredStandard, notes?: string[], fixedNeck = false): Layers {
	let m: NeckMeasure;
	try {
		// Một khuôn (`fixedNeck`): ảnh sửa trên CHÍNH ảnh thân nền → cắt ở đúng đường cổ thân nền, không đo lại trên ảnh sửa (dẫm 31/10 đầu nữ:
		// tóc trắng / tóc dài che cổ / tai thú làm đo lệch tới 6px — đầu Nhân tộc nữ 3 hướng E cắt thiếu đoạn cổ, hở dải nền giữa cằm và cổ áo).
		if (fixedNeck) throw new Error('neo theo thân nền');
		m = measureNeck(cell, { nearY });
	} catch {
		// Thân nền trọc: đo "từ vai lên" quanh nearY; không thấy vai (thân nữ cỡ NPC hướng E — vai nghiêng hẹp, 05/11) thì lấy phép đo từ đỉnh
		// đầu xuống của chính thân nền (cùng ảnh nearY đã dùng).
		let bm: NeckMeasure;
		try {
			bm = measureNeck(baldCell, { nearY });
		} catch {
			bm = measureNeck(baldCell);
		}
		const [dx, dy] = torsoShift(baldCell, cell, bm.neck[1] + 3);
		const sh = shiftCut(bm, dx, dy);
		m = { ...bm, ...sh, headTopY: headTopAt(cell, sh.neck[0], sh.neck[1]) };
		if (!fixedNeck) notes?.push(`Hướng ${d}: tóc che kín cổ — neo lấy từ thân trọc cùng hướng, dời (${dx}, ${dy})px theo thân.`);
	}
	const l = splitLayers(cell, m, std, d);
	if (BACK_VIEW.includes(d)) {
		const moved = hairOverNape(l, cell, baldCell, torsoShift(baldCell, cell, m.neck[1] + 3), std);
		if (moved) notes?.push(`Hướng ${d}: ${moved} pixel tóc rủ qua gáy chuyển từ thân sang lớp đầu.`);
	}
	return l;
}

/** Mảng liền (4 hướng) lớn nhất các pixel thoả `ok` trên ảnh w×h; trả toạ độ. */
function largestComponent(d: Uint8Array | Uint8ClampedArray, w: number, h: number, ok: (i: number) => boolean): Point[] {
	const seen = new Uint8Array(w * h);
	let best: Point[] = [];
	for (let s0 = 0; s0 < w * h; s0 += 1) {
		if (seen[s0] || !ok(s0 * 4)) continue;
		const comp: Point[] = [];
		const stack = [s0];
		seen[s0] = 1;
		while (stack.length) {
			const k = stack.pop()!;
			const x = k % w;
			const y = (k - x) / w;
			comp.push([x, y]);
			for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]] as const) {
				if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
				const nk = ny * w + nx;
				if (!seen[nk] && ok(nk * 4)) {
					seen[nk] = 1;
					stack.push(nk);
				}
			}
		}
		if (comp.length > best.length) best = comp;
	}
	void d;
	return best;
}

/**
 * Da — mọi tộc cùng một màu da (chốt 28/10), bảng da thân nền đo 30/10: (246,197,154) … (148,85,64), đỏ − lục 44–76, lục − lam 21–46.
 * Dải hẹp để tóc vàng / bạch kim / tro (đỏ − lục < 30) và tóc cam / đỏ (đỏ − lục > 90, lam thấp) không bị nhận là da (dẫm 30/10: chân tóc
 * vàng của đầu Elf bị tưởng là cằm, đầu bay lệch khỏi cổ).
 */
const isSkin = (d: Uint8Array | Uint8ClampedArray, i: number): boolean => {
	if (!d[i + 3]) return false;
	const [r, g, b] = [d[i]!, d[i + 1]!, d[i + 2]!];
	// Da rất sáng (thân nữ cỡ NPC 05/11: (250, 211, 179) có r − g = 39) vẫn là da — trước đây bị tưởng là vải áo nên viền cằm tụt xuống cổ không bị
	// cắt, thành vệt đen ngang cổ.
	return r >= 140 && g >= 80 && b >= 55 && r - g >= (r >= 230 ? 30 : 40) && r - g <= 80 && g - b >= 15 && g - b <= 55;
};
const isDark = (d: Uint8Array | Uint8ClampedArray, i: number): boolean => d[i + 3] !== 0 && d[i]! + d[i + 1]! + d[i + 2]! < 200;

/**
 * Neo cằm trên lớp đầu (toạ độ canvas đầu) theo QUY CHUẨN ĐIỂM ĐẶT ĐẦU — dùng chung cho tách cổ (`neckToBody`) và đặt đầu một khuôn
 * theo cằm đầu trọc từng khung (`mouldBody`). `fallback`: điểm trả khi lớp đầu rỗng.
 */
function chinOf(head: RGBAImage, dir: DirId | undefined, fallback: Point): Point {
	const h = head.data;
	const [cw, ch] = [head.width, head.height];
	let opaque = 0;
	let skinN = 0;
	for (let i = 0; i < h.length; i += 4)
		if (h[i + 3]) {
			opaque += 1;
			if (isSkin(h, i)) skinN += 1;
		}
	// QUY CHUẨN ĐIỂM ĐẶT ĐẦU (chủ dự án 30/10: "đặt ra 1 quy chuẩn rồi đo từng đầu, tỉ lệ trái phải để không bị lệch, các hướng khác cũng
	// cần") — cùng một luật cho đầu gốc trong khung thân và mọi đầu khác, đo trên lớp đầu (đã bỏ cổ):
	// - chính diện (S): mảng da mặt lớn nhất — ngang = tâm mảng, dọc = đáy mảng trong ±8px quanh tâm;
	// - nghiêng / chéo trước (E, SE; W, SW lật): mảng da mặt — ngang = mép trước, dọc = đáy mảng trong 8px sau mép trước;
	// - sau lưng / chéo sau (N, NE, NW) hoặc không thấy mặt: khối đầu — ngang = tâm khối, dọc = đáy khối trong ±6px quanh tâm.
	const back = dir ? dir === 'N' || dir === 'NE' || dir === 'NW' : !opaque || skinN / opaque < 0.12;
	const side = dir === 'E' || dir === 'SE' || dir === 'W' || dir === 'SW';
	const faceFront = dir === 'W' || dir === 'SW' ? -1 : 1;
	let chin: Point = [fallback[0], fallback[1]];
	const face = back ? [] : largestComponent(h, cw, ch, (i) => isSkin(h, i));
	if (face.length) {
		const xs = face.map((p) => p[0]);
		const [minX, maxX] = [Math.min(...xs), Math.max(...xs)];
		if (side) {
			const refX = faceFront > 0 ? maxX : minX;
			const near = face.filter((p) => Math.abs(p[0] - refX) <= 8);
			chin = [refX, Math.max(...near.map((p) => p[1]))];
		} else {
			// Chính diện (chủ dự án 30/10: "đầu người bạc cổ hơi dài, mấy đầu hơi lệch sang trái góc chính diện"): đáy cằm = hàng thấp nhất mà
			// mảng da mặt còn rộng ≥ 6px (đường hàm — bỏ chóp cằm nhọn 1–2px làm hàm trông cao, cổ dài); tâm ngang = trung bình tâm 4 hàng
			// hàm cuối (không theo bề rộng cả mảng — tai / tóc mai một bên làm tâm lệch).
			const rows = new Map<number, number[]>();
			for (const [x, y] of face) rows.set(y, [...(rows.get(y) ?? []), x]);
			const jaw = [...rows.entries()].filter(([, xs]) => Math.max(...xs) - Math.min(...xs) + 1 >= 6).sort((a, b) => b[0] - a[0]);
			const cx = jaw.length
				? Math.round(jaw.slice(0, 4).reduce((sum, [, xs]) => sum + (Math.min(...xs) + Math.max(...xs)) / 2, 0) / jaw.slice(0, 4).length)
				: Math.round((minX + maxX) / 2);
			// Dọc (chủ dự án 30/10: đặt theo đường hàm thì "cổ bị ngắn luôn"): ĐÁY ĐẦU NGAY GIỮA MẶT — pixel thấp nhất của lớp đầu trong ±1px quanh
			// tâm (tính cả nét viền cằm) — đúng thứ mắt thấy, nên đầu nào cũng lộ cổ bằng đầu gốc.
			let bottom = -1;
			for (let hy = ch - 1; hy >= 0 && bottom < 0; hy -= 1)
				for (let hx = Math.max(0, cx - 1); hx <= Math.min(cw - 1, cx + 1); hx += 1) if (h[(hy * cw + hx) * 4 + 3]) bottom = hy;
			chin = [cx, bottom >= 0 ? bottom : Math.max(...face.map((p) => p[1]))];
		}
	} else {
		const pts: Point[] = [];
		for (let hy = 0; hy < ch; hy += 1) for (let hx = 0; hx < cw; hx += 1) if (h[(hy * cw + hx) * 4 + 3]) pts.push([hx, hy]);
		if (pts.length) {
			const xs = pts.map((p) => p[0]);
			const cx = Math.round((Math.min(...xs) + Math.max(...xs)) / 2);
			chin = [cx, Math.max(...pts.filter((p) => Math.abs(p[0] - cx) <= 6).map((p) => p[1]))];
		}
	}
	return chin;
}

/**
 * CỔ DA THUỘC THÂN, ĐẦU CẮT TỚI CẰM (chủ dự án 29/10 đồng ý "Ok"): cổ của thân cử động theo từng khung, đầu 8 hướng nào cũng đặt lên trên cằm
 * mà không hở / lệch (mọi tộc cùng màu da nên cổ thân hợp mọi đầu). Chuyển từ lớp đầu sang lớp thân: da dưới đường neo cổ, và dải da
 * giữa cổ từ neo đi lên còn hẹp (rộng ≥ 3px và không quá bề cổ + 2px) — tới hàng da nở ra là hàm / cằm thì dừng; viền tối sát hai mép
 * dải cổ đi theo. Tóc rủ qua gáy (không phải da) giữ ở lớp đầu. Hai lớp vẫn không chồng pixel, ghép lại vẫn trùng ảnh gốc.
 */
function neckToBody(l: Layers, std: LayeredStandard): number {
	const [ax, ay] = std.head.neckAnchor;
	const [cw, ch] = std.head.canvas;
	const h = l.head.data;
	const ox = l.neck[0] - ax;
	const oy = l.neck[1] - ay;
	let moved = 0;
	// Bản cổ CỦA CHÍNH ĐẦU này, vẽ DƯỚI thân (chung lớp tóc sau): thân có pixel thì che mất, chỉ lộ ở chỗ thân khuyết dưới hàm khi đội đầu khác
	// (hàm đầu gốc rộng hơn — dẫm 29/10 nhìn nghiêng hở khe cổ họng). Là cổ của đầu mới, không phải cổ da cũ; ở đầu gốc nằm khuất sau cổ thân.
	const under = l.hairBack ? cloneImage(l.hairBack) : createImage(cw, ch);
	const move = (hx: number, hy: number): void => {
		const hi = (hy * cw + hx) * 4;
		if (!h[hi + 3]) return;
		const x = hx + ox;
		const y = hy + oy;
		if (x < 0 || y < 0 || x >= l.body.width || y >= l.body.height) return;
		const bi = (y * l.body.width + x) * 4;
		// Thân trần + đầu: dải cổ có sẵn ở CẢ HAI lớp — thân đã có pixel thì chỉ xoá khỏi đầu (dẫm 30/10: mẩu cổ sót trong đầu làm lệch đáy cằm).
		if (!l.body.data[bi + 3]) l.body.data.set(h.subarray(hi, hi + 4), bi);
		if (!under.data[hi + 3]) under.data.set(h.subarray(hi, hi + 4), hi);
		h.fill(0, hi, hi + 4);
		moved += 1;
	};
	/** Dải da liền trên hàng hy gần tâm cổ nhất (±3px quanh tâm `cx` — cổ nghiêng khi thân chúi); trả [đầu, cuối] hoặc null. */
	const runAt = (hy: number, cx = ax): [number, number] | null => {
		let best: [number, number] | null = null;
		let bestD = Infinity;
		for (let x = 0; x < cw; x += 1) {
			if (!isSkin(h, (hy * cw + x) * 4)) continue;
			let e = x;
			while (e + 1 < cw && isSkin(h, (hy * cw + e + 1) * 4)) e += 1;
			const dist = cx < x ? x - cx : cx > e ? cx - e : 0;
			if (dist <= 3 && dist < bestD) [best, bestD] = [[x, e], dist];
			x = e;
		}
		return best;
	};
	const take = ([s, e]: [number, number], hy: number): void => {
		for (let x = s; x <= e; x += 1) move(x, hy);
		for (const x of [s - 1, e + 1]) if (x >= 0 && x < cw && isDark(h, (hy * cw + x) * 4)) move(x, hy);
	};
	// Dưới neo: MỌI da (và viền tối sát da) là cổ / vai / ngực — thuộc thân (dẫm 30/10: mẩu vai hai bên sót trong đầu làm dò cằm sai).
	// Bề cổ lấy theo dải da giữa cổ ở các hàng này.
	let neckW = 0;
	for (let hy = ay; hy < ch; hy += 1) {
		const r = runAt(hy);
		if (r) neckW = Math.max(neckW, r[1] - r[0] + 1);
		const skinXs: number[] = [];
		for (let hx = 0; hx < cw; hx += 1) if (isSkin(h, (hy * cw + hx) * 4)) skinXs.push(hx);
		for (const hx of skinXs) {
			for (const nx of [hx - 1, hx + 1]) if (nx >= 0 && nx < cw && isDark(h, (hy * cw + nx) * 4)) move(nx, hy);
			move(hx, hy);
		}
	}
	// Từ neo đi lên: còn là dải cổ hẹp thì chuyển, gặp hàm (nở ra) / tóc (hết da) thì dừng. Tâm cổ bám theo dải hàng dưới.
	let cx = ax;
	// Đỉnh cổ mặc định: hàng neo (mọi pixel từ neo xuống đã thuộc thân) → cằm ở hàng ngay trên neo.
	let top: [number, number] = [ax, ay - 1];
	for (let hy = ay - 1; hy >= ay - 8 && hy >= 0; hy -= 1) {
		const r = runAt(hy, cx);
		if (!r) break;
		const w = r[1] - r[0] + 1;
		if (w < 3 || (neckW && w > neckW + 2)) break;
		if (!neckW) neckW = w;
		take(r, hy);
		cx = Math.round((r[0] + r[1]) / 2);
		top = [cx, hy - 1];
	}
	// Viền cổ áo dưới gáy (nhìn từ sau — dẫm 30/10: cùng màu viền tóc nên lọt vào lớp đầu gốc, đội đầu khác thì thành khe ngang): dưới neo,
	// pixel tối nằm NGAY DƯỚI một pixel của thân thì thuộc thân. Viền đáy tóc nằm dưới pixel tóc nên vẫn ở đầu.
	for (let hy = ay; hy < ch; hy += 1)
		for (let hx = 0; hx < cw; hx += 1) {
			if (!isDark(h, (hy * cw + hx) * 4)) continue;
			const x = hx + ox;
			const y = hy + oy - 1;
			if (x >= 0 && y >= 0 && x < l.body.width && y < l.body.height && l.body.data[(y * l.body.width + x) * 4 + 3]) move(hx, hy);
		}
	// Neo cằm — CHUẨN ĐIỂM ĐẶT ĐẦU (chủ dự án 30/10: "đầu thằng cổ dài, cổ thấp, lệch trái, lệch phải — phải cùng quy chuẩn điểm đặt đầu"):
	// đo trên MẶT, không theo dải cổ (dải cổ mỗi đầu PixelLab vẽ dài / ngắn / lệch khác nhau). Đáy cằm = hàng thấp nhất còn ≥ 2 pixel da của
	// lớp đầu (sau khi bỏ cổ), tâm ngang = giữa các pixel da hàng đó. Nhìn từ sau (da < 12% lớp đầu — không thấy mặt): đỉnh gáy (đỉnh dải cổ).
	const chin = chinOf(l.head, l.dir, top);
	l.chin = [chin[0] + ox, chin[1] + oy];
	l.neckTop = [top[0] + ox, top[1] + oy];
	if (moved) l.hairBack = under;
	return moved;
}

/** Nhìn từ sau (N, NE, NW): tóc rủ dưới đường cổ nằm TRƯỚC lưng người xem — thuộc lớp đầu (vẽ trên thân), không phải tóc sau vai. */
const BACK_VIEW: DirId[] = ['N', 'NE', 'NW'];

function splitLayers(cell: RGBAImage, m: NeckMeasure, std: LayeredStandard, dir: DirId, protect?: (x: number, y: number) => boolean): Layers {
	const cut = cutHead(cell, m, protect);
	const ex = extractHead(cell, m, std, protect);
	if (BACK_VIEW.includes(dir) && ex.hairBack) {
		blit(ex.head, ex.hairBack, 0, 0);
		ex.hairBack = null;
	}
	const composed = composeHead(cut.body, ex.head, m.neck, std, ex.hairBack);
	const issues: string[] = [];
	if (cut.remnants.length) issues.push(`Q2: còn ${cut.remnants.length} pixel trên cổ không nối với đầu`);
	const [lo, hi] = std.body.neckLengthPx;
	if (dir === 'S' && (m.neckLength < lo || m.neckLength > hi)) issues.push(`Cổ dài ${m.neckLength}px — ngoài thước ${lo}–${hi}px`);
	if (Buffer.compare(Buffer.from(composed.data), Buffer.from(cell.data)) !== 0) issues.push('Q1: ghép lại 3 lớp KHÔNG trùng ảnh nguồn');
	// Chỉ tính khe do ghép tạo ra (nguồn có pixel mà bản ghép trống) — khe vẽ sẵn giữa lọn tóc và cổ không phải lỗi ghép.
	const holes = neckSeamHoles(composed, m.neck, m.spans?.[0]).filter(([x, y]) => cell.data[(y * cell.width + x) * 4 + 3] !== 0).length;
	if (holes > Number(std.qa.neckSeamHolesMax)) issues.push(`Q5: hở cổ ${holes} pixel`);
	const stats = { neck: m.neck, neckLength: m.neckLength, neckWidth: m.neckWidth, headWidth: m.headWidth, cheekWidth: m.cheekWidth, remnants: cut.remnants.length, hairBack: cut.hairBackCount };
	const out: Layers = { full: cell, body: cut.body, head: ex.head, hairBack: ex.hairBack, neck: m.neck, cut: m, dir, issues, stats };
	neckToBody(out, std);
	return out;
}

/**
 * Nhìn từ sau: tóc rủ qua gáy dưới đường cổ (trong dải cổ, nằm ở thân sau khi cắt) → lớp đầu. Pixel chuyển khi thân trọc cùng hướng
 * (dời theo thân) ở đó trống hoặc khác màu hẳn (> 60) VÀ màu giống màu tóc / đầu của chính lớp đầu — da gáy / vai không bị lấy.
 * Trả số pixel chuyển. Ghép lại vẫn trùng nguồn (chỉ đổi lớp chứa pixel).
 */
function hairOverNape(l: Layers, cell: RGBAImage, bald: RGBAImage, shift: [number, number], std: LayeredStandard): number {
	const [ax, ay] = std.head.neckAnchor;
	const [cw, ch] = std.head.canvas;
	const diff = (a: ArrayLike<number>, ia: number, b: ArrayLike<number>, ib: number): number => Math.abs(a[ia]! - b[ib]!) + Math.abs(a[ia + 1]! - b[ib + 1]!) + Math.abs(a[ia + 2]! - b[ib + 2]!);
	// Chỉ MÀU TÓC: màu lớp đầu không có trên thân gốc trọc (da, viền, dây áo). Bảng màu cả lớp đầu có cả da mặt → thân trong ảnh xoay lệch
	// thân trọc 1–2px thì mép da vai / dây bikini bị vớ theo (dẫm 29/10 đầu Ma tộc nữ nhìn từ sau: chấm da trên áo gi-lê).
	const baldColors: number[][] = [];
	const seen = new Set<number>();
	for (let i = 0; i < bald.data.length; i += 4)
		if (bald.data[i + 3]) {
			const k = (bald.data[i]! << 16) | (bald.data[i + 1]! << 8) | bald.data[i + 2]!;
			if (!seen.has(k)) seen.add(k), baldColors.push([bald.data[i]!, bald.data[i + 1]!, bald.data[i + 2]!]);
		}
	const hair: number[][] = [];
	const dark: number[][] = [];
	for (let i = 0; i < l.head.data.length; i += 4) {
		if (!l.head.data[i + 3]) continue;
		const c = [l.head.data[i]!, l.head.data[i + 1]!, l.head.data[i + 2]!];
		if (!baldColors.some((b) => diff(b, 0, c, 0) <= 24)) hair.push(c);
		else if (c[0]! + c[1]! + c[2]! < 150) dark.push(c);
	}
	const headAt = (x: number, y: number): number => ((y - l.neck[1] + ay) * cw + (x - l.neck[0] + ax)) * 4;
	// Sát TÓC trong lớp đầu (không tính da gáy — viền vai nằm sát da gáy, dẫm 29/10 đầu Ma tộc nam hướng N).
	const hairAt = (x: number, y: number): boolean => {
		const hx = x - l.neck[0] + ax;
		const hy = y - l.neck[1] + ay;
		if (hx < 0 || hy < 0 || hx >= cw || hy >= ch) return false;
		const hi = headAt(x, y);
		return l.head.data[hi + 3] !== 0 && hair.some((c) => diff(c, 0, l.head.data, hi) <= 24);
	};
	const move = (x: number, y: number): void => {
		const i = (y * cell.width + x) * 4;
		l.head.data.set(cell.data.subarray(i, i + 4), headAt(x, y));
		l.body.data.fill(0, i, i + 4);
	};
	const candidates: Array<[number, number, boolean]> = [];
	for (let y = l.neck[1]; y < Math.min(cell.height, l.neck[1] + ch - ay); y += 1)
		for (let x = Math.max(0, l.neck[0] - ax); x < Math.min(cell.width, l.neck[0] - ax + cw); x += 1) {
			const i = (y * cell.width + x) * 4;
			if (!l.body.data[i + 3]) continue;
			const bx = x - shift[0];
			const by = y - shift[1];
			const bi = (by * bald.width + bx) * 4;
			const baldHere = bx >= 0 && by >= 0 && bx < bald.width && by < bald.height && bald.data[bi + 3] !== 0;
			if (baldHere && diff(bald.data, bi, cell.data, i) <= 60) continue;
			if (hair.some((c) => diff(c, 0, cell.data, i) <= 24)) candidates.push([x, y, true]);
			else if (dark.some((c) => diff(c, 0, cell.data, i) <= 24)) candidates.push([x, y, false]);
		}
	let moved = 0;
	for (const [x, y, isHair] of candidates)
		if (isHair) {
			move(x, y);
			moved += 1;
		}
	// Viền tối của ngọn tóc: chỉ khi sát tóc đã ở lớp đầu (viền thân / dây áo đứng riêng thì giữ ở thân).
	// Xét kề theo lớp đầu TRƯỚC bước này — chuyển nối tiếp sẽ kéo cả cột viền thân xuống theo (dẫm 29/10 hướng N).
	const edge = candidates.filter(([x, y, isHair]) => !isHair && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => hairAt(x + dx!, y + dy!)));
	for (const [x, y] of edge) {
		move(x, y);
		moved += 1;
	}
	return moved;
}

/** Độ dời nguyên pixel (±r) để phần thân từ hàng `fromY` xuống của ảnh b trùng ảnh a nhiều pixel đặc nhất. */
function torsoShift(a: RGBAImage, b: RGBAImage, fromY: number, r = 3): [number, number] {
	let best: [number, number] = [0, 0];
	let bestN = -1;
	for (let dy = -r; dy <= r; dy += 1)
		for (let dx = -r; dx <= r; dx += 1) {
			let n = 0;
			for (let y = fromY; y < a.height; y += 1) {
				const yb = y + dy;
				if (yb < 0 || yb >= b.height) continue;
				for (let x = 0; x < a.width; x += 1) {
					const xb = x + dx;
					if (xb >= 0 && xb < b.width && a.data[(y * a.width + x) * 4 + 3] && b.data[(yb * b.width + xb) * 4 + 3]) n += 1;
				}
			}
			if (n > bestN) [bestN, best] = [n, [dx, dy]];
		}
	return best;
}

/** Lật một khung 3 lớp sang hướng tây: thân quanh tâm cột root, đầu / tóc sau quanh neo canvas đầu. */
function mirrorLayers(from: Layers, label: string, std: LayeredStandard): Layers {
	const ax = std.cell.root[0];
	const hx = std.head.neckAnchor[0];
	return {
		...from,
		full: mirrorImage(from.full, ax),
		body: mirrorImage(from.body, ax),
		head: mirrorImage(from.head, hx),
		hairBack: from.hairBack && mirrorImage(from.hairBack, hx),
		neck: [2 * ax - from.neck[0], from.neck[1]],
		...(from.chin ? { chin: [2 * ax - from.chin[0], from.chin[1]] as Point } : {}),
		...(from.dir ? { dir: mirrorDir(from.dir) } : {}),
		...(from.neckTop ? { neckTop: [2 * ax - from.neckTop[0], from.neckTop[1]] as Point } : {}),
		cut: {
			neck: [2 * ax - from.cut.neck[0], from.cut.neck[1]],
			headTopY: from.cut.headTopY,
			cx: 2 * ax - from.cut.cx,
			spans: from.cut.spans?.map(([a, b]) => [2 * ax - b, 2 * ax - a] as [number, number]),
		},
		issues: [label, ...from.issues],
	};
}

/**
 * Chặng A: nhân vật "thân gốc + đầu 1" — đo cổ (dò từ vai lên quanh hàng cổ của thân trọc cùng hướng), tách 3 lớp tóc sau / thân / đầu
 * cho ảnh xoay 8 hướng (5 vẽ + 3 lật) và khung đi S, xuất trang soi.
 */
function processA(sample: string, std: LayeredStandard, stageId = 'A'): void {
	const items = checkedPlan(sample, std).stages[stageId]!.items;
	const refOf = (it: PlanItem): PlanItem | undefined => items.find((x) => x.id === it.reference);
	const bald = items.find((i) => i.tool === 'create_character' && refOf(i)?.prompt !== 'headEdit');
	const haired = items.find((i) => i.tool === 'create_character' && refOf(i)?.prompt === 'headEdit');
	if (!bald || !haired) throw new Error(`Chặng ${stageId} cần cả nhân vật thân trọc lẫn nhân vật có tóc (create_character từ món headEdit)`);
	const baldSrc = new PixelLabSource(join(LAYERED_SOURCES, sample, 'raw', bald.id));
	const dir = join(LAYERED_SOURCES, sample, 'raw', haired.id);
	const src = new PixelLabSource(dir);
	const rotation = (from: PixelLabSource, d: DirId): RGBAImage => {
		const img = from.rotation(d);
		if (!img) throw new Error(`Thiếu ảnh xoay ${d}`);
		binarizeAlpha(img);
		return img;
	};
	const toCell = (img: RGBAImage): RGBAImage => placeInCell(img, cellOffset(img, std), std);
	const notes: string[] = [];
	const out: Record<string, unknown> = { sample, stage: 'A', standardVersion: std.version, source: haired.id, rotations: {}, walk: [] };

	// Ảnh xoay: mỗi hướng một offset (chân → root); neo xấp xỉ = hàng cổ thân trọc cùng hướng; hướng tây lật từ hướng đông đã tách.
	const cells: Partial<Record<DirId, Layers>> = {};
	for (const d of DRAWN) {
		const baldCell = toCell(rotation(baldSrc, d));
		const nearY = measureNeck(baldCell).neck[1];
		const cell = toCell(rotation(src, d));
		const l = splitHaired(cell, baldCell, nearY, d, std, notes);
		cells[d] = l;
		(out.rotations as Record<string, unknown>)[d] = { ...l.stats, baldNeckY: nearY };
		if (d === 'S') notes.push(`Hướng S: cổ dài ${String(l.stats.neckLength)}px (thước ${std.body.neckLengthPx.join('–')}), rộng đầu kể cả tóc ${String(l.stats.headWidth)}px, má ~${String(l.stats.cheekWidth)}px.`);
	}
	for (const d of ALL.filter((x) => !DRAWN.includes(x))) cells[d] = mirrorLayers(cells[mirrorDir(d)]!, `lật từ ${mirrorDir(d)}`, std);
	const layered = (l: Layers, ms: number, issues: string[]): ReviewFrame => ({ body: l.body, head: l.head, hairBack: l.hairBack, neck: l.neck, durationMs: ms, issues });
	const original = (l: Layers, ms: number, issues: string[]): ReviewFrame => ({ body: l.full, head: null, neck: l.neck, durationMs: ms, issues });
	const clips: ReviewClip[] = [
		{ id: 'rot', label: 'Ảnh xoay 8 hướng — GHÉP 3 LỚP (tắt "Lớp đầu" để soi thân đã cắt)', dir: ALL.join(' '), loop: true, frames: ALL.map((d) => layered(cells[d]!, 500, [d, ...cells[d]!.issues])) },
		{ id: 'rot-full', label: 'Ảnh xoay 8 hướng — ảnh gốc PixelLab (chưa tách)', dir: ALL.join(' '), loop: true, frames: ALL.map((d) => original(cells[d]!, 500, [d])) },
	];

	// Đi S: một offset cho cả clip (từ khung 0); mỗi khung khớp đầu ảnh xoay S rồi đo cổ (bareClip).
	const walkDef = std.animations.find((a) => a.id === 'walk')!;
	const walkCells = clipCells(src, dir, clipNames(sample, std, haired.id, 'walk', 'S'), 'S', std);
	if (walkCells.length) {
		const walk = bareClip(walkCells, cells.S!, std, 'S', 'walk');
		const ms = (i: number): number => walkDef.durationsMs[i % walkDef.durationsMs.length]!;
		walk.forEach((l, i) => (out.walk as unknown[]).push({ ...l.stats, foot: footRoot(l.full) }));
		clips.push(
			{ id: 'walk', label: 'Đi S — GHÉP 3 LỚP (đầu khung i cắt từ chính khung i)', dir: 'S', loop: true, frames: walk.map((l, i) => layered(l, ms(i), l.issues)) },
			{ id: 'walk-full', label: 'Đi S — ảnh gốc PixelLab', dir: 'S', loop: true, frames: walk.map((l, i) => original(l, ms(i), [])) },
		);
	} else notes.push('Chưa có khung đi S (món A2 chưa vẽ).');

	const issues = clips.flatMap((c) => c.frames.flatMap((f) => (f.issues ?? []).filter((s) => /^Q|Cổ dài/.test(s))));
	notes.unshift(issues.length ? `CÓ ${issues.length} cảnh báo QA — xem dưới từng khung.` : 'Không có cảnh báo QA tự động; cần duyệt bằng mắt: cổ có dài không, thân đã cắt có sạch không, nét so với NPC tóc trắng.');
	mkdirSync(join(LAYERED_SOURCES, sample, 'processed'), { recursive: true });
	writeFileSync(join(LAYERED_SOURCES, sample, 'processed', `${stageId}.json`), `${JSON.stringify(out, null, '\t')}\n`);
	const slug = `${sample}-${stageId.toLowerCase()}`;
	const reviewDir = join(REVIEW_ROOT, slug);
	const page = writeReview(
		{
			id: slug,
			title: stageId === 'A' ? 'Mẫu 1 · chặng A — thân gốc nam + đầu 1 tóc đen, tách 3 lớp tóc sau / thân / đầu' : `Mẫu 1 · chặng ${stageId} — ${checkedPlan(sample, std).stages[stageId]!.goal}`,
			notes,
			clips,
			reference: { label: 'npc_silver_youth (chuẩn độ nét)', image: referenceInCell('npc_silver_youth', std) },
			mapTile: townGroundPatch(join(LAYERED_SOURCES, sample, 'processed', 'map.png')) ?? undefined,
		},
		reviewDir,
		std,
	);
	console.log(`✔ trang soi: ${page}\n  link: https://admin.tail024813.ts.net/site/media/layered/${slug}/index.html`);
}

/** Nguồn của mẫu: nhân vật thân trọc, nhân vật có đầu (thân trần), nhân vật mặc đồ — nhận theo món tham chiếu, không theo id. */
/** Bộ ba nhân vật của một thân (trọc / có đầu / mặc đồ) — mặc định là bộ đầu tiên trong plan (thân nam chặng A–B). */
interface SourceIds {
	bald: string;
	bare: string;
	outfit: string;
}

/** Bộ ba nhân vật thân NỮ (chặng E–F). */
const FEMALE_SOURCES: SourceIds = { bald: 'E1-base-female-ref', bare: 'E3-head-f1-char', outfit: 'F1-outfit-f-char' };

function sampleSources(sample: string, std: LayeredStandard, ids?: SourceIds): { bald: PixelLabSource; bare: PixelLabSource; bareDir: string; bareId: string; outfit: PixelLabSource | null; outfitDir: string | null; outfitId: string | null } {
	const items = Object.values(checkedPlan(sample, std).stages).flatMap((st) => st.items);
	const refPrompt = (it: PlanItem): string | undefined => items.find((x) => x.id === it.reference)?.prompt;
	const cc = items.filter((i) => i.tool === 'create_character');
	const pickId = (id: string | undefined, fallback: PlanItem | undefined): PlanItem | undefined => (id ? cc.find((i) => i.id === id) : fallback);
	const bald = pickId(ids?.bald, cc.find((i) => refPrompt(i) !== 'headEdit' && refPrompt(i) !== 'outfitEdit'));
	const bare = pickId(ids?.bare, cc.find((i) => refPrompt(i) === 'headEdit'));
	const outfit = pickId(ids?.outfit, cc.find((i) => refPrompt(i) === 'outfitEdit'));
	if (!bald || !bare) throw new Error('Mẫu cần nhân vật thân trọc và nhân vật có đầu');
	const dir = (id: string): string => join(LAYERED_SOURCES, sample, 'raw', id);
	return {
		bald: new PixelLabSource(dir(bald.id)),
		bare: new PixelLabSource(dir(bare.id)),
		bareDir: dir(bare.id),
		bareId: bare.id,
		outfitId: outfit?.id ?? null,
		outfit: outfit && existsSync(dir(outfit.id)) ? new PixelLabSource(dir(outfit.id)) : null,
		outfitDir: outfit ? dir(outfit.id) : null,
	};
}

/**
 * Tên clip trong gói tải về cho (nhân vật, clip, hướng): theo animation_name của các món animate_character trong plan, MÓN SAU ĐƯỢC ƯU TIÊN
 * (món vẽ lại một hướng hỏng đặt tên riêng, vd walk-s-redo), cuối cùng là id clip.
 */
function clipNames(sample: string, std: LayeredStandard, charItem: string, anim: string, d: DirId): string[] {
	const pl = std.directions.find((x) => x.id === d)!.pixellab;
	const items = Object.values(checkedPlan(sample, std).stages).flatMap((st) => st.items);
	const names = items
		.filter((i) => i.tool === 'animate_character' && i.character === charItem && i.animation === anim && (i.args.directions as string[] | undefined)?.includes(pl))
		.map((i) => String(i.args.animation_name ?? anim))
		.reverse();
	return [...new Set([...names, anim])];
}

/** Khung của một clip (đã làm tròn alpha), đặt vào ô bằng MỘT offset theo khung 0. */
function clipCells(src: PixelLabSource, srcDir: string, names: string[], d: DirId, std: LayeredStandard): RGBAImage[] {
	const name = names.find((n) => src.animationFiles(n, d).length);
	if (!name) return [];
	const imgs = src.animationFiles(name, d).map((rel) => {
		const img = readPng(join(srcDir, rel));
		binarizeAlpha(img);
		return img;
	});
	if (!imgs.length) return [];
	const off = cellOffset(imgs[0]!, std);
	return imgs.map((img) => placeInCell(img, off, std));
}

/** Q7 (chân chạm đất lệch root) chỉ cho clip đứng / đi — khi chạy có khung cả hai chân rời đất, người nảy lên xuống. */
const groundedClip = (anim: string): boolean => anim === 'idle' || anim === 'walk';

/** Neo đo lệch neo khớp đầu quá mức này = dải cổ lẫn ngực / vai (không phải cổ) — dùng neo khớp đầu thay. */
const NECK_FALLBACK_PX = 2;

/** Khớp đầu ảnh xoay vào khung động tác dưới mức này = không tìm ra đầu. Đầu được vẽ lại từng khung (tóc nảy) nên chỉ trùng ~55–70%. */
const CLIP_HEAD_MATCH_MIN = 0.4;

/**
 * Clip thân trần: mỗi khung khớp đầu của ảnh xoay cùng hướng (±16px — chạy chồm tới trước và nảy tới ~10 hàng, đoán theo khung trước sẽ
 * trôi xuống ngực, dẫm 28/10) để biết đầu ở đâu, rồi đo cổ từ vai lên quanh đó.
 */
function bareClip(cells: RGBAImage[], rot: Layers, std: LayeredStandard, dir: DirId, anim: string, hints?: Point[]): Layers[] {
	return cells.map((cell, i) => {
		// Gợi ý dời đầu biết trước (khung vẽ theo khung xương: khớp NECK so với ảnh đứng) → dò tinh ±6 quanh đó; bóng đầu nới rộng hơn
		// vì đầu chúi / nghiêng theo thân lệch khỏi bóng đầu đứng (dẫm 29/10: cắt theo khuôn đầu đứng làm mất mũi / mặt khi chạy).
		const given = hints?.[i];
		const al = given
			? ((a) => ({ ...a, dx: a.dx + given[0], dy: a.dy + given[1] }))(alignHead(cell, rot.head, [rot.neck[0] + given[0], rot.neck[1] + given[1]], std, 6))
			: alignHead(cell, rot.head, rot.neck, std, 16);
		const hintNeck: Point = [rot.neck[0] + al.dx, rot.neck[1] + al.dy];
		// Đo không ra (vai che / tay vung ngang cổ khi chạy) hoặc trượt xuống ngực / vai (> NECK_FALLBACK_PX so với neo khớp đầu — dẫm 29/10
		// đi S nữ, cắt mất vai): dùng số đo ảnh xoay dời theo khớp.
		let m: NeckMeasure | null = null;
		try {
			m = measureNeck(cell, { nearY: hintNeck[1], cx: hintNeck[0] });
		} catch {
			m = null;
		}
		let fellBack = false;
		if (!m || Math.abs(m.neck[1] - hintNeck[1]) > NECK_FALLBACK_PX) {
			const sh = shiftCut(rot.cut, al.dx, al.dy);
			m = { ...(m ?? rot.cut), ...sh, headTopY: headTopAt(cell, sh.neck[0], sh.neck[1]) } as NeckMeasure;
			fellBack = true;
		}
		// Tay chạm đầu: chỉ pixel trong bóng đầu ảnh xoay (đặt theo neo đo, nới 2px) và giống màu đầu ở gần đó mới thuộc đầu.
		const l = splitLayers(cell, m, std, dir, headMaskProtect(rot.head, m.neck, std, given ? 5 : 2, cell));
		if (al.match < CLIP_HEAD_MATCH_MIN) l.issues.push(`Q-khớp: đầu khung chỉ trùng ${(al.match * 100).toFixed(0)}% đầu ảnh xoay`);
		// Q3: neo đo trên ảnh so với neo suy từ khớp đầu (đầu gần như cứng) — lệch > 1px là dải cổ lẫn lưng / tóc, phải soi.
		const hint: Point = [rot.neck[0] + al.dx, rot.neck[1] + al.dy];
		const drift = Math.abs(m.neck[1] - hint[1]);
		if (fellBack) l.issues.push(`neo đo trượt xa neo khớp đầu — dùng neo khớp đầu (hàng ${hint[1]})`);
		else if (drift > Number(std.qa.neckDriftMaxPx)) l.issues.push(`Q3: neo đo lệch neo khớp đầu ${drift}px (hàng ${m.neck[1]} so với ${hint[1]})`);
		const foot = footRoot(cell);
		if (groundedClip(anim) && Math.abs(foot[1] - std.cell.root[1]) > Number(std.qa.rootDriftMaxPx)) l.issues.push(`Q7: chân lệch root ${foot[1] - std.cell.root[1]}px`);
		return l;
	});
}

/**
 * Khung bộ đồ tách 3 lớp từ CHÍNH ảnh mặc đồ: khớp đầu thân trần (cùng hướng / cùng số khung) lên ảnh mặc đồ → neo bản mặc đồ = neo thân trần
 * + độ dịch (necklineRule — không đo lại cổ trên ảnh có cổ áo); cắt đầu (cả tóc rủ sát cổ) theo số đo đã dời, lớp đầu / tóc sau lấy từ chính
 * khung mặc đồ nên ghép lại trùng ảnh gốc PixelLab. Chủ dự án 29/10 chọn cách này cho chạy E: dán đầu khung thân trần lên thì lộ da tay sau.
 * Kiểm: khớp đầu, neo lệch, ghép lại trùng nguồn (Q1), sót đầu (Q2), hở cổ (Q5), cổ áo bị cắt theo đầu (Q8: pixel bỏ đi không giống màu đầu).
 */
/**
 * `limb`: vùng chắc chắn là tay theo khung xương (nắm tay quanh cổ tay) — luôn thuộc thân dù màu giống đầu (găng nâu áp tai). Chuẩn §6.4:
 * pixel tay nằm trong vùng đầu được giữ ở thân nhờ vùng bảo vệ dựng từ khung xương.
 */
function outfitLayers(cell: RGBAImage, base: Layers, std: LayeredStandard, anim = 'idle', mask?: Layers, limb?: (x: number, y: number) => boolean, hint?: Point): Layers {
	// Khuôn bảo vệ tay: đầu ảnh xoay đứng của bộ đồ (tay buông, đầu sạch) khớp lên khung. Đầu khung thân trần cùng số có thể dính tay da
	// sau gáy → tay áo bị cắt theo đầu (dẫm 29/10, chạy E khung 0–1). Có khuôn thì neo cắt dời theo khuôn (cùng bảng màu, cùng mốc với vùng
	// bảo vệ); neo dời theo thân trần lệch khuôn 1–2 hàng để sót da cổ / viền cằm trên thân (dẫm 29/10).
	// Gợi ý dời đầu biết trước (khung vẽ theo khung xương: khớp NECK của khung so với ảnh đứng) → chỉ dò tinh quanh đó.
	let ma = mask && (hint
		? ((a) => ({ ...a, dx: a.dx + hint[0], dy: a.dy + hint[1] }))(alignHead(cell, mask.head, [mask.neck[0] + hint[0], mask.neck[1] + hint[1]], std, 6))
		: alignHead(cell, mask.head, mask.neck, std, 16));
	// Thân tỷ lệ mới chạy chồm tới xa hơn ±16px (dẫm 29/10 chạy E chặng H: chỉ trùng 13–19%, lớp đầu lấy nhầm tóc gáy, mặt nằm lại thân):
	// khớp kém thì dò rộng ±24, lấy bản trùng nhiều hơn.
	if (mask && ma && !hint && ma.match < CLIP_HEAD_MATCH_MIN) {
		// Chạy: chân sau duỗi dài kéo điểm đặt ô lùi → đầu trước vị trí đứng > 24px. Ước lượng thô theo đỉnh tóc rồi khớp tinh ±12 quanh đó.
		const a = topCenter(cell, 0, 0);
		const b = topCenter(mask.head, mask.neck[0] - std.head.neckAnchor[0], mask.neck[1] - std.head.neckAnchor[1]);
		if (a && b) {
			const [cx, cy] = [Math.round(a[0] - b[0]), a[1] - b[1]];
			const fine = alignHead(cell, mask.head, [mask.neck[0] + cx, mask.neck[1] + cy], std, 12);
			if (fine.match > ma.match) ma = { ...fine, dx: fine.dx + cx, dy: fine.dy + cy };
		}
	}
	// Khuôn chính là đầu mẫu (chặng F / H): dùng luôn kết quả khớp ±16 — thân tỷ lệ mới chạy chồm tới ~10px, khớp ±8 kẹt ở mép (dẫm 29/10).
	const al = mask === base && ma ? ma : alignHead(cell, base.head, base.neck, std, 8);
	const shifted = mask && ma ? shiftCut(mask.cut, ma.dx, ma.dy) : shiftCut(base.cut, al.dx, al.dy);
	const m: HeadCut = { ...shifted, headTopY: headTopAt(cell, shifted.neck[0], shifted.neck[1]) };
	const maskNeck: Point = m.neck;
	const colorProtect = mask ? headMaskProtect(mask.head, maskNeck, std, hint ? 5 : 2, cell, 48, true) : headMaskProtect(base.head, m.neck, std, 2, cell);
	const protect = limb ? (x: number, y: number): boolean => (y < m.neck[1] && limb(x, y) && cell.data[(y * cell.width + x) * 4 + 3] !== 0) || colorProtect(x, y) : colorProtect;
	const cut = cutHead(cell, m, protect);
	const ex = extractHead(cell, m, std, protect);
	if (mask) {
		disjointNeck(cut.body, ex.head, m.neck, mask.head, maskNeck, std);
		floatingHair(cut.body, ex.head, m.neck, [mask.head, mask.hairBack], std);
	}
	const composed = composeHead(cut.body, ex.head, m.neck, std, ex.hairBack);
	const issues: string[] = [];
	const overlap = layerOverlap(cut.body, ex.head, m.neck, std);
	if (overlap) issues.push(`Q9: đầu và thân chồng nhau ${overlap} pixel`);
	if (Buffer.compare(Buffer.from(composed.data), Buffer.from(cell.data)) !== 0) issues.push('Q1: ghép lại 3 lớp KHÔNG trùng ảnh gốc PixelLab');
	// Khung động tác vẽ lại đầu từng khung (tóc nảy) nên chỉ trùng ~55% — đầu lấy từ chính khung, khớp chỉ để dời neo: dùng ngưỡng clip.
	if (al.match < (groundedClip(anim) && anim === 'idle' ? OUTFIT_HEAD_MATCH_MIN : CLIP_HEAD_MATCH_MIN)) issues.push(`Q-khớp: đầu bộ đồ chỉ trùng ${(al.match * 100).toFixed(0)}% đầu thân trần`);
	// Lệch so với thân trần là thật (bản vẽ khác, giày đế dày làm người cao hơn ~2px) — đầu đi theo neo bộ đồ nên chỉ ghi, không cảnh báo.
	if (Math.max(Math.abs(al.dx), Math.abs(al.dy)) > Number(std.qa.neckDriftMaxPx)) issues.push(`neo lệch thân trần (${al.dx}, ${al.dy})px`);
	if (cut.remnants.length) issues.push(`Q2: còn ${cut.remnants.length} pixel trên cổ không nối với đầu`);
	// Chỉ tính lỗ do ghép (ảnh mặc đồ vẽ liền có pixel mà bản ghép trống) — khe trước cổ giữa cằm và cổ áo có sẵn trong ảnh vẽ.
	const holes = neckSeamHoles(composed, m.neck, m.spans?.[0]).filter(([x, y]) => cell.data[(y * cell.width + x) * 4 + 3] !== 0).length;
	if (holes > Number(std.qa.neckSeamHolesMax)) issues.push(`Q5: hở cổ ${holes} pixel`);
	// Cổ áo chỉ có thể nhô sát đường cổ: xét pixel bỏ đi từ 2 hàng trên neo trở xuống (trên cao là màu đầu vẽ lại lệch nhẹ, không phải áo).
	// Có khuôn: xét chính lớp đầu cuối (sau khi tách dải cổ); không khuôn: xét phần cắt khỏi ảnh.
	const nearNeck = mask ? cloneImage(ex.head) : cloneImage(cut.removed);
	nearNeck.data.fill(0, 0, Math.max(0, (mask ? std.head.neckAnchor[1] : m.neck[1]) - 2) * nearNeck.width * 4);
	const collar = unlikePixels(nearNeck, [mask?.head ?? base.head, mask?.hairBack ?? base.hairBack]);
	if (collar > Number(std.qa.headForeignColorPxMax)) issues.push(`Q8: ${collar} pixel bỏ theo đầu không giống màu đầu (cổ áo trên đường cổ?)`);
	const foot = footRoot(cell);
	if (groundedClip(anim) && Math.abs(foot[1] - std.cell.root[1]) > Number(std.qa.rootDriftMaxPx)) issues.push(`Q7: chân lệch root ${foot[1] - std.cell.root[1]}px`);
	const stats = { neck: m.neck, baseNeck: base.neck, shift: [al.dx, al.dy], match: Number(al.match.toFixed(3)), remnants: cut.remnants.length, holes, collar };
	const out: Layers = { full: cell, body: cut.body, head: ex.head, hairBack: ex.hairBack, neck: m.neck, cut: m, dir: base.dir, issues, stats };
	neckToBody(out, std);
	return out;
}

/** Đỉnh ảnh (hàng đặc trên cùng) và tâm ngang của 8 hàng đặc đầu tiên, cộng độ dời (ox, oy) — ước lượng thô chỗ đầu. */
function topCenter(img: RGBAImage, ox: number, oy: number): [number, number] | null {
	let top = -1;
	let sx = 0;
	let n = 0;
	for (let y = 0; y < img.height; y += 1) {
		if (top >= 0 && y >= top + 8) break;
		for (let x = 0; x < img.width; x += 1)
			if (img.data[(y * img.width + x) * 4 + 3]) {
				if (top < 0) top = y;
				sx += x;
				n += 1;
			}
	}
	return n ? [sx / n + ox, top + oy] : null;
}

/**
 * Dải cổ dưới neo (bareNeckMaxPx hàng) của khung mặc đồ: pixel giống màu cổ da của đầu mẫu ở gần đó → chỉ thuộc đầu (bỏ khỏi thân); còn lại
 * (cổ áo) → chỉ thuộc thân (bỏ khỏi đầu). Hai lớp không chồng pixel nào.
 */
function disjointNeck(body: RGBAImage, head: RGBAImage, neck: Point, mold: RGBAImage, moldNeck: Point, std: LayeredStandard): void {
	const [ax, ay] = std.head.neckAnchor;
	const [cw, ch] = std.head.canvas;
	const like = (x: number, y: number): boolean => {
		const i = (y * body.width + x) * 4;
		for (let dy = -2; dy <= 2; dy += 1)
			for (let dx = -2; dx <= 2; dx += 1) {
				const hx = x - moldNeck[0] + ax + dx;
				const hy = y - moldNeck[1] + ay + dy;
				if (hx < 0 || hy < 0 || hx >= cw || hy >= ch) continue;
				const j = (hy * cw + hx) * 4;
				if (mold.data[j + 3] && Math.abs(mold.data[j]! - body.data[i]!) + Math.abs(mold.data[j + 1]! - body.data[i + 1]!) + Math.abs(mold.data[j + 2]! - body.data[i + 2]!) <= 48) return true;
			}
		return false;
	};
	for (let hy = ay; hy < ch; hy += 1)
		for (let hx = 0; hx < cw; hx += 1) {
			const j = (hy * cw + hx) * 4;
			if (!head.data[j + 3]) continue;
			const x = hx - ax + neck[0];
			const y = hy - ay + neck[1];
			const i = (y * body.width + x) * 4;
			if (body.data[i + 3] && like(x, y)) body.data.fill(0, i, i + 4);
			else head.data.fill(0, j, j + 4);
		}
}

/**
 * Mảng thân phía trên cổ KHÔNG nối (4 hướng) với thân dưới cổ mà ≥ FLOAT_HEAD_SHARE pixel giống màu khuôn đầu → lớp đầu: đuôi tóc hất xa
 * khi chạy (ngoài bề ngang đầu ±2 nên vùng đầu không gom — dẫm 29/10 bob nữ chạy E). Mảnh tay áo / găng khác màu đầu vẫn ở thân.
 */
function floatingHair(body: RGBAImage, head: RGBAImage, neck: Point, molds: Array<RGBAImage | null>, std: LayeredStandard): number {
	const [ax, ay] = std.head.neckAnchor;
	const [cw, ch] = std.head.canvas;
	const palette: number[][] = [];
	for (const m of molds) if (m) for (let i = 0; i < m.data.length; i += 4) if (m.data[i + 3]) palette.push([m.data[i]!, m.data[i + 1]!, m.data[i + 2]!]);
	const like = (i: number): boolean => palette.some((c) => Math.abs(c[0]! - body.data[i]!) + Math.abs(c[1]! - body.data[i + 1]!) + Math.abs(c[2]! - body.data[i + 2]!) <= 48);
	const w = body.width;
	const seen = new Uint8Array(w * body.height);
	let moved = 0;
	for (let y = 0; y < neck[1]; y += 1)
		for (let x = 0; x < w; x += 1) {
			const k = y * w + x;
			if (seen[k] || !body.data[k * 4 + 3]) continue;
			const comp: number[] = [];
			let grounded = false;
			const stack = [k];
			seen[k] = 1;
			while (stack.length) {
				const c = stack.pop()!;
				comp.push(c);
				const cx = c % w;
				const cy = Math.floor(c / w);
				if (cy >= neck[1]) grounded = true;
				for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]] as const) {
					if (nx < 0 || ny < 0 || nx >= w || ny >= body.height) continue;
					const n = ny * w + nx;
					if (!seen[n] && body.data[n * 4 + 3]) (seen[n] = 1), stack.push(n);
				}
			}
			if (grounded || comp.filter((c) => like(c * 4)).length < comp.length * FLOAT_HEAD_SHARE) continue;
			const fits = comp.every((c) => {
				const hx = (c % w) - neck[0] + ax;
				const hy = Math.floor(c / w) - neck[1] + ay;
				return hx >= 0 && hy >= 0 && hx < cw && hy < ch;
			});
			if (!fits) continue;
			for (const c of comp) {
				const hi = ((Math.floor(c / w) - neck[1] + ay) * cw + ((c % w) - neck[0] + ax)) * 4;
				head.data.set(body.data.subarray(c * 4, c * 4 + 4), hi);
				body.data.fill(0, c * 4, c * 4 + 4);
				moved += 1;
			}
		}
	return moved;
}

const FLOAT_HEAD_SHARE = 0.6;

/** Số pixel đặc ở CẢ lớp đầu (đặt tại neo) lẫn lớp thân — phải 0: đầu là đầu, thân là thân, không vẽ đè. */
function layerOverlap(body: RGBAImage, head: RGBAImage, neck: Point, std: LayeredStandard): number {
	const [ax, ay] = std.head.neckAnchor;
	let n = 0;
	for (let hy = 0; hy < head.height; hy += 1)
		for (let hx = 0; hx < head.width; hx += 1) {
			if (!head.data[(hy * head.width + hx) * 4 + 3]) continue;
			const x = hx - ax + neck[0];
			const y = hy - ay + neck[1];
			if (x >= 0 && y >= 0 && x < body.width && y < body.height && body.data[(y * body.width + x) * 4 + 3]) n += 1;
		}
	return n;
}

/** Khớp đầu dưới mức này = đầu bộ đồ khác đầu thân trần (PixelLab vẽ lại sai) — không ghép bừa. */
const OUTFIT_HEAD_MATCH_MIN = 0.6;

/**
 * Chặng B: bộ Kiếm sĩ + thân trần. Bộ đồ tách 3 lớp từ chính ảnh mặc đồ, neo theo khung thân trần; soi mặc / tháo đồ, ảnh xoay 8 hướng,
 * đi S/E/N (+W lật từ E) cho cả hai thân, chạy E. Xuất processed/B.json + trang soi.
 */
/** Clip đi / chạy theo hướng vẽ: thân trần 3 lớp và bộ đồ 3 lớp (đầu cắt từ chính khung mặc đồ) — dùng chung chặng B và D. */
function motionClips(sample: string, std: LayeredStandard, src: ReturnType<typeof sampleSources>, bareRot: Record<DirId, Layers>, outRot: Record<DirId, Layers>, notes: string[]): Array<{ anim: 'walk' | 'run'; d: DirId; bare: Layers[]; dressed: Layers[] | null }> {
	const out: Array<{ anim: 'walk' | 'run'; d: DirId; bare: Layers[]; dressed: Layers[] | null }> = [];
	for (const anim of ['walk', 'run'] as const)
		for (const d of DRAWN) {
			const bareCells = clipCells(src.bare, src.bareDir, clipNames(sample, std, src.bareId, anim, d), d, std);
			if (!bareCells.length) continue;
			const bare = bareClip(bareCells, bareRot[d], std, d, anim);
			const outCells = clipCells(src.outfit!, src.outfitDir!, clipNames(sample, std, src.outfitId!, anim, d), d, std);
			let dressed: Layers[] | null = null;
			if (outCells.length && outCells.length !== bare.length) notes.push(`${anim === 'walk' ? 'Đi' : 'Chạy'} ${d}: bộ đồ ${outCells.length} khung ≠ thân trần ${bare.length} khung — không ghép được`);
			else if (outCells.length) dressed = outCells.map((cell, i) => outfitLayers(cell, bare[i]!, std, anim, outRot[d]));
			out.push({ anim, d, bare, dressed });
		}
	return out;
}

/** Ảnh xoay 8 hướng tách 3 lớp: thân trần (đo cổ) và bộ đồ (cắt chặt hai lượt theo khuôn đầu cùng bảng màu bộ đồ). */
function rotationLayers(sample: string, std: LayeredStandard, ids?: SourceIds): { src: ReturnType<typeof sampleSources>; bareRot: Record<DirId, Layers>; outRot: Record<DirId, Layers> } {
	const src = sampleSources(sample, std, ids);
	if (!src.outfit || !src.outfitDir) throw new Error('Chưa có nhân vật mặc đồ (món create_character từ outfitEdit chưa vẽ)');
	const rot = (from: PixelLabSource, d: DirId): RGBAImage => {
		const img = from.rotation(d);
		if (!img) throw new Error(`Thiếu ảnh xoay ${d}`);
		binarizeAlpha(img);
		return placeInCell(img, cellOffset(img, std), std);
	};
	const bareRot: Partial<Record<DirId, Layers>> = {};
	const outRot: Partial<Record<DirId, Layers>> = {};
	for (const d of DRAWN) {
		const baldCell = rot(src.bald, d);
		bareRot[d] = splitHaired(rot(src.bare, d), baldCell, measureNeck(baldCell).neck[1], d, std);
		// Hai lượt: lượt 1 (khuôn đầu thân trần) cho đầu cùng bảng màu bộ đồ, lượt 2 cắt chặt theo khuôn đó — đầu / thân không chồng pixel.
		const dressed = rot(src.outfit!, d);
		try {
			outRot[d] = outfitLayers(dressed, bareRot[d]!, std, 'idle', outfitLayers(dressed, bareRot[d]!, std));
		} catch (e) {
			throw new Error(`Ảnh xoay bộ đồ ${d}: ${e instanceof Error ? e.message : String(e)}`);
		}
	}
	for (const d of ALL.filter((x) => !DRAWN.includes(x))) {
		bareRot[d] = mirrorLayers(bareRot[mirrorDir(d)]!, `lật từ ${mirrorDir(d)}`, std);
		outRot[d] = mirrorLayers(outRot[mirrorDir(d)]!, `lật từ ${mirrorDir(d)}`, std);
	}
	return { src, bareRot: bareRot as Record<DirId, Layers>, outRot: outRot as Record<DirId, Layers> };
}

function processB(sample: string, std: LayeredStandard): void {
	const { src, bareRot, outRot } = rotationLayers(sample, std);
	const out: Record<string, unknown> = { sample, stage: 'B', standardVersion: std.version, rotations: {}, clips: {} };
	for (const d of DRAWN) (out.rotations as Record<string, unknown>)[d] = outRot[d].stats;
	const layered = (l: Layers, ms: number, issues = l.issues): ReviewFrame => ({ body: l.body, head: l.head, hairBack: l.hairBack, neck: l.neck, durationMs: ms, issues });
	const original = (l: Layers, ms: number): ReviewFrame => ({ body: l.full, head: null, neck: l.neck, durationMs: ms, issues: [] });
	const clips: ReviewClip[] = [
		{ id: 'swap', label: 'MẶC / THÁO ĐỒ — cùng đầu 1, đổi lớp thân (S, E, N, W)', dir: 'S E N W', loop: true,
			frames: (['S', 'E', 'N', 'W'] as DirId[]).flatMap((d) => [layered(bareRot[d]!, 700, [`${d} thân trần`]), layered(outRot[d]!, 700, [`${d} bộ Kiếm sĩ`, ...outRot[d]!.issues])]) },
		{ id: 'outfit-rot', label: 'Bộ Kiếm sĩ 8 hướng — GHÉP 3 LỚP từ chính ảnh mặc đồ (tắt "Lớp đầu" để soi thân bộ đồ)', dir: ALL.join(' '), loop: true,
			frames: ALL.map((d) => layered(outRot[d]!, 500, [d, ...outRot[d]!.issues])) },
		{ id: 'outfit-rot-full', label: 'Bộ Kiếm sĩ 8 hướng — ảnh gốc PixelLab', dir: ALL.join(' '), loop: true, frames: ALL.map((d) => original(outRot[d]!, 500)) },
	];
	const notes: string[] = [];
	for (const { anim, d, bare, dressed } of motionClips(sample, std, src, bareRot, outRot, notes)) {
		const def = std.animations.find((a) => a.id === anim)!;
		const ms = (i: number): number => def.durationsMs[i % def.durationsMs.length]!;
		const label = anim === 'walk' ? 'Đi' : 'Chạy';
		{
			clips.push({ id: `${anim}-bare-${d}`, label: `${label} ${d} — thân trần 3 lớp`, dir: d, loop: true, frames: bare.map((l, i) => layered(l, ms(i))) });
			(out.clips as Record<string, unknown>)[`${anim}-bare-${d}`] = bare.map((l) => l.stats);
			if (!dressed) continue;
			clips.push(
				{ id: `${anim}-outfit-${d}`, label: `${label} ${d} — bộ Kiếm sĩ GHÉP 3 LỚP (đầu cắt từ chính khung mặc đồ)`, dir: d, loop: true, frames: dressed.map((l, i) => layered(l, ms(i))) },
				{ id: `${anim}-outfit-${d}-full`, label: `${label} ${d} — bộ Kiếm sĩ, ảnh gốc PixelLab`, dir: d, loop: true, frames: dressed.map((l, i) => original(l, ms(i))) },
			);
			(out.clips as Record<string, unknown>)[`${anim}-outfit-${d}`] = dressed.map((l) => l.stats);
			if (d === 'E')
				clips.push({ id: `${anim}-outfit-W`, label: `${label} W — lật từ E`, dir: 'W', loop: true, frames: dressed.map((l, i) => layered(mirrorLayers(l, 'lật từ E', std), ms(i))) });
		}
	}
	const issues = clips.flatMap((c) => c.frames.flatMap((f) => (f.issues ?? []).filter((x) => /^Q|Cổ dài/.test(x))));
	notes.unshift(
		issues.length ? `CÓ ${issues.length} cảnh báo QA — xem dưới từng khung.` : 'Không có cảnh báo QA tự động; duyệt bằng mắt: chỗ nối cổ khi mặc đồ, mặc / tháo đồ, đi / chạy ở 0,5× và 1×.',
		'Đầu trên thân bộ đồ cắt từ CHÍNH khung mặc đồ (chủ dự án 29/10 chọn ảnh gốc PixelLab cho chạy E — dán đầu khung thân trần lộ da tay sau). Đầu chỉ có tóc / mặt / cổ da, thân chỉ có áo / tay; không pixel nào ở cả hai lớp (Q9). Neo cổ dời theo khớp đầu ảnh xoay của chính bộ đồ.',
	);
	mkdirSync(join(LAYERED_SOURCES, sample, 'processed'), { recursive: true });
	writeFileSync(join(LAYERED_SOURCES, sample, 'processed', 'B.json'), `${JSON.stringify(out, null, '\t')}\n`);
	const slug = `${sample}-b`;
	const page = writeReview(
		{
			id: slug,
			title: 'Mẫu 1 · chặng B — bộ Kiếm sĩ cơ bản, mặc / tháo đồ, đi / chạy',
			notes,
			clips,
			reference: { label: 'npc_silver_youth (chuẩn độ nét)', image: referenceInCell('npc_silver_youth', std) },
			mapTile: townGroundPatch(join(LAYERED_SOURCES, sample, 'processed', 'map.png')) ?? undefined,
		},
		join(REVIEW_ROOT, slug),
		std,
	);
	console.log(`✔ trang soi: ${page}\n  link: https://admin.tail024813.ts.net/site/media/layered/${slug}/index.html`);
}

/** Một khung đòn đánh tách đủ lớp: tóc sau / thân / đầu / tay trước mặt (bodyFront) / vũ khí / ngón tay trên chuôi (handFront). */
interface AttackLayers extends Layers {
	bodyFront: RGBAImage;
	weapon: RGBAImage;
	handFront: RGBAImage;
	grip: Point;
	weaponAngleDeg: number;
	bladeDeg: number;
	bladeLen: number;
	weaponBehind: boolean;
}

const HAND_RADIUS_PX = 2.5;
/** Nắm tay theo khung xương: tâm cách cổ tay 1,5px dọc cẳng tay, bán kính 3px (găng bộ Kiếm sĩ ~6px kể cả viền). */
const FIST_REACH_PX = 1.5;
const FIST_RADIUS_PX = 3;
/** Tay áo quanh xương cánh tay (khung xương chém) — nửa bề ngang tay áo bộ Kiếm sĩ ~2–3px. */
const SLEEVE_RADIUS_PX = 2.5;
/** Găng da nâu bộ Kiếm sĩ (7b482c, 673a27, 512e20, viền 1f1114) có kênh đỏ ≤ 140; da mặt / bóng tai sáng hơn. */
const GLOVE_MAX_RED = 140;
const GLOVE_COLORS: ReadonlyArray<readonly [number, number, number]> = [[0x7b, 0x48, 0x2c], [0x67, 0x3a, 0x27], [0x51, 0x2e, 0x20], [0x1f, 0x11, 0x14]];

/**
 * Tách một khung chém (thân vẽ tay không): đầu / thân cắt chặt theo khuôn đầu ảnh xoay bộ đồ; phần thân nằm trong bóng đầu (tay giơ
 * ngang mặt, vác qua gáy) chuyển sang bodyFront (vẽ trên đầu — đổi đầu khác không che mất tay); kiếm góc vẽ sẵn gần nhất đặt chuôi tại
 * điểm nắm; pixel nắm tay (quanh hai cổ tay) mà kiếm đè lên chuyển sang handFront (vẽ trên kiếm). Mỗi pixel nguồn thuộc đúng một lớp.
 */
function attackLayers(cell: RGBAImage, rot: Layers, grip: Point, arms: Array<{ shoulder?: Point; elbow: Point; wrist: Point }>, bladeDeg: number, std: LayeredStandard, bladeLen = 1, behind = false, hint?: Point, limbFront = false, design: WeaponDesign = BASIC_SWORD, bow?: { staveDeg?: number; string: 'hand' | 'rest'; arrow: boolean }, preciseGrip=false): AttackLayers {
	// Nắm tay: tâm lùi FIST_REACH_PX từ cổ tay theo hướng cẳng tay (khuỷu → cổ tay).
	const fists = arms.map(({ elbow, wrist }) => {
		const len = Math.hypot(wrist[0] - elbow[0], wrist[1] - elbow[1]) || 1;
		return [wrist[0] + ((wrist[0] - elbow[0]) / len) * FIST_REACH_PX, wrist[1] + ((wrist[1] - elbow[1]) / len) * FIST_REACH_PX] as Point;
	});
	if(preciseGrip){
		// Khớp ARM là CỔ TAY, không phải tâm nắm tay. Trước đây chuôi dính cổ tay, hụt lòng bàn tay 1–2px.
		const firstArm=arms[0],secondArm=arms[1],firstFist=fists[0];
		if(!firstArm||!secondArm||!firstFist)throw new Error('Thiếu hai tay để đặt điểm nắm');
		const oneHand=Math.hypot(grip[0]-firstArm.wrist[0],grip[1]-firstArm.wrist[1])<2&&Math.hypot(grip[0]-secondArm.wrist[0],grip[1]-secondArm.wrist[1])>10;
		const use=oneHand?[firstFist]:fists;grip=[Math.round(use.reduce((n,p)=>n+p[0],0)/use.length),Math.round(use.reduce((n,p)=>n+p[1],0)/use.length)];
	}
	// Chỉ pixel NGẢ ẤM VÀ TỐI (đỏ ≥ xanh dương, đỏ ≤ GLOVE_MAX_RED: găng da nâu, viền găng) — tóc tối ngả xanh sau nắm tay và da mặt
	// sáng dưới nắm tay vẫn là đầu (dẫm 29/10 hướng S: vòng tròn nắm tay vớ cả mảng tóc, rồi cả mũi / má vào thân).
	const warm = (x: number, y: number): boolean => {
		const i = (y * cell.width + x) * 4;
		return cell.data[i]! >= cell.data[i + 2]! && cell.data[i]! <= GLOVE_MAX_RED;
	};
	// Tay áo dọc xương cánh tay (vai → khuỷu → cổ tay) mà KHÔNG cùng bảng màu đầu → thân. Tay giơ cao đi sau gáy (dẫm 29/10 chém E nữ
	// khung 6: mảng tay áo trắng ngà lọt vào lớp đầu); tóc / da mặt cùng bảng màu đầu nên vẫn ở đầu.
	const palette: Array<[number, number, number]> = [];
	const seen = new Set<number>();
	for (const layer of [rot.head, rot.hairBack])
		if (layer)
			for (let i = 0; i < layer.data.length; i += 4) {
				if (!layer.data[i + 3]) continue;
				const k = (layer.data[i]! << 16) | (layer.data[i + 1]! << 8) | layer.data[i + 2]!;
				if (!seen.has(k)) seen.add(k), palette.push([layer.data[i]!, layer.data[i + 1]!, layer.data[i + 2]!]);
			}
	const segDist = (px: number, py: number, a: Point, b: Point): number => {
		const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
		const t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / (dx * dx + dy * dy || 1)));
		return Math.hypot(px - a[0] - t * dx, py - a[1] - t * dy);
	};
	const sleeve = (x: number, y: number): boolean => {
		const near = arms.some(({ shoulder, elbow, wrist }) => (shoulder && segDist(x + 0.5, y + 0.5, shoulder, elbow) <= SLEEVE_RADIUS_PX) || segDist(x + 0.5, y + 0.5, elbow, wrist) <= SLEEVE_RADIUS_PX);
		if (!near) return false;
		const i = (y * cell.width + x) * 4;
		return !palette.some(([r, g, b]) => Math.abs(r - cell.data[i]!) + Math.abs(g - cell.data[i + 1]!) + Math.abs(b - cell.data[i + 2]!) <= 48);
	};
	// Găng chỉ khi màu gần bảng màu găng hơn bảng màu đầu — tóc nâu hạt dẻ đậm (đầu nữ 2) cũng "ấm và tối", nắm tay giơ sát đỉnh đầu thì
	// vớ cả tóc (dẫm 29/10 chém E nữ khung 6–7: mảng tóc sau gáy nằm lại thân).
	const nearest = (list: ReadonlyArray<readonly [number, number, number]>, i: number): number =>
		Math.min(...list.map(([r, g, b]) => Math.abs(r - cell.data[i]!) + Math.abs(g - cell.data[i + 1]!) + Math.abs(b - cell.data[i + 2]!)));
	const fist = (x: number, y: number): boolean => {
		if (!warm(x, y) || !fists.some(([fx, fy]) => Math.hypot(x + 0.5 - fx, y + 0.5 - fy) <= FIST_RADIUS_PX)) return false;
		const i = (y * cell.width + x) * 4;
		return !palette.length || nearest(GLOVE_COLORS, i) <= nearest(palette, i);
	};
	const limb = (x: number, y: number): boolean => fist(x, y) || sleeve(x, y);
	const wrists = arms.map((a) => a.wrist);
	const l = outfitLayers(cell, rot, std, 'slash', rot, limb, hint);
	const body = cloneImage(l.body);
	const bodyFront = createImage(cell.width, cell.height);
	const handFront = createImage(cell.width, cell.height);
	const [ax, ay] = std.head.neckAnchor;
	const al = alignHead(cell, rot.head, rot.neck, std, 16);
	const ox = rot.neck[0] + al.dx - ax;
	const oy = rot.neck[1] + al.dy - ay;
	const inHead = (x: number, y: number): boolean => {
		for (let dy = -1; dy <= 1; dy += 1)
			for (let dx = -1; dx <= 1; dx += 1) {
				const hx = x - ox + dx;
				const hy = y - oy + dy;
				if (hx >= 0 && hy >= 0 && hx < rot.head.width && hy < ay && rot.head.data[(hy * rot.head.width + hx) * 4 + 3]) return true;
			}
		return false;
	};
	const move = (from: RGBAImage, to: RGBAImage, i: number): void => {
		to.data.set(from.data.subarray(i, i + 4), i);
		from.data.fill(0, i, i + 4);
	};
	for (let y = 0; y < l.neck[1] && !limbFront; y += 1)
		for (let x = 0; x < cell.width; x += 1) {
			const i = (y * cell.width + x) * 4;
			if (body.data[i + 3] && inHead(x, y)) move(body, bodyFront, i);
		}
	// Một khuôn: thân mang đầu TRỌC (nhỏ hơn mọi đầu thật) → tay / găng giơ quanh đầu phải nằm TRÊN đầu thật, kể cả phần bị cắt vào lớp
	// đầu trọc (dẫm 30/10 chém E khung 5–9: tóc Elf che mất cẳng tay, chỉ còn nắm tay lơ lửng trước mặt). Nhận theo MÀU: lõi găng (nâu ấm)
	// và vải tay áo (kem) nối nhau ≥ 4 px, kèm viền tối ngả đỏ sát lõi. Sọ trọc (da, viền ngả lam, mắt) ở lại — đầu thật che. Viền sọ khung
	// động tác có khi vẽ ngả đỏ nên viền chỉ đi theo khi sát lõi, không tự thành cụm.
	let head = l.head;
	if (limbFront) {
		head = cloneImage(l.head);
		const [W, H] = [cell.width, cell.height];
		const [lox, loy] = [l.neck[0] - ax, l.neck[1] - ay];
		// Mỗi ô: nguồn (1 thân, 2 đầu) + chỉ số pixel trong lớp nguồn.
		const from = new Uint8Array(W * H);
		const at = new Int32Array(W * H);
		for (let y = 0; y < l.neck[1]; y += 1)
			for (let x = 0; x < W; x += 1) if (body.data[(y * W + x) * 4 + 3]) (from[y * W + x] = 1), (at[y * W + x] = (y * W + x) * 4);
		for (let hy = 0; hy < head.height; hy += 1)
			for (let hx = 0; hx < head.width; hx += 1) {
				const [x, y] = [hx + lox, hy + loy];
				const j = (hy * head.width + hx) * 4;
				if (x < 0 || y < 0 || x >= W || y >= H || !head.data[j + 3]) continue;
				(from[y * W + x] = 2), (at[y * W + x] = j);
			}
		const rgb = (k: number): [number, number, number, Uint8Array | Uint8ClampedArray] => {
			const src = from[k] === 1 ? body.data : head.data;
			const i = at[k]!;
			return [src[i]!, src[i + 1]!, src[i + 2]!, src];
		};
		// Chỉ quanh tay theo khung xương (nắm tay ≤ 6 px, xương tay ≤ 4,5 px): bóng sáng kem trên sọ, mắt / mày nâu, cổ áo gi-lê nâu sau gáy
		// cùng màu găng / vải nhưng xa tay (dẫm 30/10 chém S khung 9–10, chém E khung 9).
		const nearArm = (k: number): boolean => {
			const [px, py] = [(k % W) + 0.5, Math.floor(k / W) + 0.5];
			return (
				fists.some(([fx, fy]) => Math.hypot(px - fx, py - fy) <= 6) ||
				arms.some(({ shoulder, elbow, wrist }) => segDist(px, py, elbow, wrist) <= 4.5 || (shoulder !== undefined && segDist(px, py, shoulder, elbow) <= 4.5))
			);
		};
		const strong = (k: number): boolean => {
			if (!from[k] || !nearArm(k)) return false;
			const [r, g, b, src] = rgb(k);
			if (isSkin(src, at[k]!)) return false;
			const sum = r + g + b;
			return (r > b && r - g >= 25 && r < 150 && sum >= 130) || (r - g <= 20 && r >= 120 && g >= 110 && b >= 90 && g - b >= 8);
		};
		const edge = (k: number): boolean => {
			if (!from[k]) return false;
			const [r, g, b] = rgb(k);
			return r >= b + 5 && r > g && r + g + b < 200;
		};
		const seenL = new Uint8Array(W * H);
		const take = (k: number): void => {
			const [x, y] = [k % W, Math.floor(k / W)];
			const ci = (y * W + x) * 4;
			const src = from[k] === 1 ? body.data : head.data;
			const i = at[k]!;
			if (!bodyFront.data[ci + 3]) bodyFront.data.set(src.subarray(i, i + 4), ci);
			src.fill(0, i, i + 4);
			from[k] = 0;
		};
		for (let s0 = 0; s0 < W * H; s0 += 1) {
			if (seenL[s0] || !strong(s0)) continue;
			const comp = [s0];
			seenL[s0] = 1;
			for (let q = 0; q < comp.length; q += 1) {
				const [x, y] = [comp[q]! % W, Math.floor(comp[q]! / W)];
				for (let dy = -1; dy <= 1; dy += 1)
					for (let dx = -1; dx <= 1; dx += 1) {
						const [nx, ny] = [x + dx, y + dy];
						if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
						const k = ny * W + nx;
						if (!seenL[k] && strong(k)) (seenL[k] = 1), comp.push(k);
					}
			}
			if (comp.length < 4) continue;
			const rim: number[] = [];
			for (const k of comp) {
				const [x, y] = [k % W, Math.floor(k / W)];
				for (let dy = -1; dy <= 1; dy += 1)
					for (let dx = -1; dx <= 1; dx += 1) {
						const [nx, ny] = [x + dx, y + dy];
						if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
						const n = ny * W + nx;
						if (!seenL[n] && edge(n)) (seenL[n] = 1), rim.push(n);
					}
			}
			for (const k of [...comp, ...rim]) take(k);
		}
	}
	// Vẽ lại vector từng góc ở lưới native, không xoay/nội suy bitmap. Bỏ bước nhảy 22,5° của hai đòn đang sửa.
	const angle = preciseGrip?bladeDeg:nearestAngle(bladeDeg);
	// Cung: dây móc vào nắm tay phải của khung (tay kéo); thân cung vẽ cong theo đúng góc khung (không chọn 16 góc).
	const sprite = bow
		? drawWeapon(design, bladeDeg, bladeLen, behind, { staveDeg: bow.staveDeg, arrow: bow.arrow, nock: bow.string === 'hand' ? [Math.round(fists[0]![0] - grip[0]), Math.round(fists[0]![1] - grip[1])] : undefined })
		: drawWeapon(design, angle, bladeLen, behind);
	const weapon = createImage(cell.width, cell.height);
	blit(weapon, sprite.image, grip[0] - sprite.grip[0], grip[1] - sprite.grip[1]);
	for (let y = 0; y < cell.height; y += 1)
		for (let x = 0; x < cell.width; x += 1) {
			const i = (y * cell.width + x) * 4;
			// Kiếm sau thân: nắm tay đã nằm trước chuôi, không cần lớp ngón tay. Khiên: tay nắm quai SAU khiên, khiên che tay.
			if (behind || design.handsBehind || !weapon.data[i + 3] || !wrists.some(([wx, wy]) => Math.hypot(x + 0.5 - wx, y + 0.5 - wy) <= HAND_RADIUS_PX)) continue;
			if (body.data[i + 3]) move(body, handFront, i);
			else if (bodyFront.data[i + 3]) move(bodyFront, handFront, i);
		}
	return { ...l, head, body, bodyFront, weapon, handFront, grip, weaponAngleDeg: angle, bladeDeg, bladeLen, weaponBehind: behind };
}

/** Lật khung đòn đánh sang hướng tây: mọi lớp ô quanh tâm cột root, đầu quanh neo canvas đầu; góc lưỡi đối xứng qua trục đứng. */
function mirrorAttack(a: AttackLayers, std: LayeredStandard): AttackLayers {
	const axis = std.cell.root[0];
	const base = mirrorLayers(a, 'lật từ E', std);
	const flip = (deg: number): number => (deg >= 0 ? 180 - deg : -180 - deg);
	return { ...base, bodyFront: mirrorImage(a.bodyFront, axis), weapon: mirrorImage(a.weapon, axis), handFront: mirrorImage(a.handFront, axis), grip: [2 * axis - a.grip[0], a.grip[1]], weaponAngleDeg: flip(a.weaponAngleDeg), bladeDeg: flip(a.bladeDeg), bladeLen: a.bladeLen, weaponBehind: a.weaponBehind };
}

/** Khung chém đã tách lớp theo hướng vẽ (món animate_with_skeleton_v3 của chặng C đã tải) — dùng chung chặng C và D. */
function slashClips(sample: string, std: LayeredStandard, outRot: Record<DirId, Layers>, stageId = 'C', character?: string): Array<{ d: DirId; frames: AttackLayers[] }> {
	// Một chặng có thể có nhiều nhân vật (chặng K: bộ Kiếm sĩ đầu Ma tộc nam + nữ) — lọc theo nhân vật mặc đồ.
	const items = checkedPlan(sample, std).stages[stageId]?.items.filter((i) => i.tool === 'animate_with_skeleton_v3' && !i.follows && (!character || i.character === character)) ?? [];
	const out: Array<{ d: DirId; frames: AttackLayers[] }> = [];
	for (const item of items) {
		const dir = join(LAYERED_SOURCES, sample, 'raw', item.id);
		if (!existsSync(join(dir, 'frame-00.png'))) continue;
		const sk = JSON.parse(readFileSync(join(skeletonDir(sample), `${item.skeleton}.json`), 'utf8')) as BuiltSkeleton;
		const d = std.directions.find((x) => x.pixellab === sk.direction)!.id;
		const first = readPng(join(dir, 'first.png'));
		binarizeAlpha(first);
		const off = cellOffset(first, std);
		const toCell = ([x, y]: readonly number[]): Point => [x! + off[0], y! + off[1]];
		const frames = sk.frames.map((f, i) => {
			const img = readPng(join(dir, `frame-${String(i).padStart(2, '0')}.png`));
			binarizeAlpha(img);
			const kp = (label: string): Point => {
				const k = f.keypoints.find((p) => p.label === label)!;
				return toCell([k.x * sk.size[0], k.y * sk.size[1]]);
			};
			return attackLayers(placeInCell(img, off, std), outRot[d], toCell(f.grip), [{ shoulder: kp('RIGHT SHOULDER'), elbow: kp('RIGHT ELBOW'), wrist: kp('RIGHT ARM') }, { shoulder: kp('LEFT SHOULDER'), elbow: kp('LEFT ELBOW'), wrist: kp('LEFT ARM') }], f.bladeDeg, std, f.bladeLen ?? 1, f.behind ?? false);
		});
		// Món sau cùng hướng là bản vẽ lại (vd chém S chéo H6 thay bổ thẳng H5) — thay bản trước.
		const at = out.findIndex((x) => x.d === d);
		if (at >= 0) out.splice(at, 1);
		out.push({ d, frames });
	}
	return out;
}

/**
 * Chặng C: đòn chém bộ Kiếm sĩ — thân PixelLab vẽ tay không theo khung xương tự soạn, kiếm vẽ riêng theo góc, ghép theo điểm nắm từng khung.
 * Xuất processed/C.json (neo cổ, điểm nắm, góc vũ khí, lớp từng khung) + trang soi.
 */
function processC(sample: string, std: LayeredStandard): void {
	const { outRot } = rotationLayers(sample, std);
	const def = std.animations.find((a) => a.id === 'slash')!;
	const clips: ReviewClip[] = [];
	const out: Record<string, unknown> = { sample, stage: 'C', standardVersion: std.version, weapon: BASIC_SWORD.id, clips: {} };
	const view = (a: AttackLayers, i: number): ReviewFrame => ({
		body: a.body, head: a.head, hairBack: a.hairBack, bodyFront: a.bodyFront, weapon: a.weapon, handFront: a.handFront, neck: a.neck, durationMs: def.durationsMs[i]!,
		issues: [...(i + 1 === def.hitFrame ? ['★ khung chạm'] : []), `kiếm ${a.weaponAngleDeg}° (lưỡi ${a.bladeDeg}°)`, ...a.issues.filter((x) => /^Q/.test(x))],
	});
	for (const { d, frames } of slashClips(sample, std, outRot)) {
		(out.clips as Record<string, unknown>)[`slash-${d}`] = frames.map((a, i) => ({ neck: a.neck, grip: a.grip, weaponAngleDeg: a.weaponAngleDeg, weaponLayer: 'front', durationMs: def.durationsMs[i], event: i + 1 === def.hitFrame ? 'hit' : undefined, issues: a.issues }));
		clips.push(
			{ id: `slash-${d}`, label: `Chém ${d} — GHÉP ĐỦ LỚP: thân / đầu / tay trước mặt / kiếm / ngón tay (tắt "Lớp vũ khí", "Lớp đầu" để soi)`, dir: d, loop: true, frames: frames.map(view) },
			{ id: `slash-${d}-full`, label: `Chém ${d} — ảnh gốc PixelLab (tay không)`, dir: d, loop: true, frames: frames.map((a, i) => ({ body: a.full, head: null, neck: a.neck, durationMs: def.durationsMs[i]!, issues: [] })) },
		);
		if (d === 'E') {
			const west = frames.map((a) => mirrorAttack(a, std));
			(out.clips as Record<string, unknown>)['slash-W'] = west.map((a, i) => ({ neck: a.neck, grip: a.grip, weaponAngleDeg: a.weaponAngleDeg, weaponLayer: 'front', durationMs: def.durationsMs[i] }));
			clips.push({ id: 'slash-W', label: 'Chém W — lật từ E', dir: 'W', loop: true, frames: west.map(view) });
		}
	}
	if (!clips.length) throw new Error('Chưa có khung chém nào (chạy món animate_with_skeleton_v3 của chặng C trước)');
	const issues = clips.flatMap((c) => c.frames.flatMap((f) => (f.issues ?? []).filter((x) => /^Q/.test(x))));
	const notes = [
		issues.length ? `CÓ ${issues.length} cảnh báo QA — xem dưới từng khung.` : 'Không có cảnh báo QA tự động; duyệt bằng mắt ở 0,5× và 1×.',
		'Thân PixelLab vẽ TAY KHÔNG theo khung xương tự soạn (15 khung: lấy lực 1–6, tăng tốc 7–9, chạm 10–11, hồi thế 12–15); kiếm cơ bản vẽ riêng theo 16 góc, chuôi đặt đúng điểm nắm từng khung.',
		'Thứ tự lớp: tóc sau → thân → đầu → tay trước mặt (đoạn tay nằm trong bóng đầu) → kiếm → ngón tay trên chuôi. Mỗi pixel ảnh gốc thuộc đúng một lớp.',
	];
	mkdirSync(join(LAYERED_SOURCES, sample, 'processed'), { recursive: true });
	writeFileSync(join(LAYERED_SOURCES, sample, 'processed', 'C.json'), `${JSON.stringify(out, null, '\t')}\n`);
	const slug = `${sample}-c`;
	const page = writeReview(
		{ id: slug, title: 'Mẫu 1 · chặng C — đòn chém bộ Kiếm sĩ, kiếm tách lớp riêng', notes, clips, reference: { label: 'npc_silver_youth (chuẩn độ nét)', image: referenceInCell('npc_silver_youth', std) }, mapTile: townGroundPatch(join(LAYERED_SOURCES, sample, 'processed', 'map.png')) ?? undefined },
		join(REVIEW_ROOT, slug),
		std,
	);
	console.log(`✔ trang soi: ${page}\n  link: https://admin.tail024813.ts.net/site/media/layered/${slug}/index.html`);
}

/** Pixel xanh dương rõ (xanh > đỏ + 40, xanh > 120) trên lớp đầu — tóc / sừng / da / mắt nâu không có màu này. */
function blueEyePixels(head: RGBAImage): number {
	let n = 0;
	for (let i = 0; i < head.data.length; i += 4) if (head.data[i + 3] && head.data[i + 2]! > head.data[i]! + 40 && head.data[i + 2]! > 120) n += 1;
	return n;
}

/**
 * Chặng D: ĐỔI ĐẦU thật — đầu 2 (nhân vật thân gốc + đầu 2, món create_character từ headEdit của chặng D) tách 3 lớp từ ảnh xoay 8 hướng và
 * khung chạy E (đầu có khung riêng khi chạy), rồi đặt lên thân bộ Kiếm sĩ đã cắt ở đứng / đi / chạy / chém theo neo cổ từng khung. Thân,
 * tay trước mặt, kiếm, ngón tay giữ nguyên lớp của bộ đồ; chỉ lớp đầu (và tóc sau) đổi. Không vẽ lại thân / đòn nào.
 */
function processD(sample: string, std: LayeredStandard): void {
	const { src, bareRot, outRot } = rotationLayers(sample, std);
	const plan = checkedPlan(sample, std);
	const headItem = plan.stages.D?.items.find((i) => i.tool === 'create_character');
	if (!headItem) throw new Error('Chặng D chưa có món create_character của đầu 2');
	const headDir = join(LAYERED_SOURCES, sample, 'raw', headItem.id);
	const headSrc = new PixelLabSource(headDir);
	const rot = (from: PixelLabSource, d: DirId): RGBAImage => {
		const img = from.rotation(d);
		if (!img) throw new Error(`Thiếu ảnh xoay ${d}`);
		binarizeAlpha(img);
		return placeInCell(img, cellOffset(img, std), std);
	};
	// Đầu 2: tách trên ảnh thân gốc + đầu 2 (thân trần) như chặng A — đo cổ quanh hàng cổ thân trọc cùng hướng.
	const head2: Partial<Record<DirId, Layers>> = {};
	for (const d of DRAWN) {
		const nearY = measureNeck(rot(src.bald, d)).neck[1];
		const cell = rot(headSrc, d);
		head2[d] = splitLayers(cell, measureNeck(cell, { nearY }), std, d);
	}
	for (const d of ALL.filter((x) => !DRAWN.includes(x))) head2[d] = mirrorLayers(head2[mirrorDir(d)]!, `lật từ ${mirrorDir(d)}`, std);
	const runCells = clipCells(headSrc, headDir, clipNames(sample, std, headItem.id, 'run', 'E'), 'E', std);
	// Chỉ cần lớp ĐẦU của khung chạy: cắt chặt theo khuôn đầu 2 hướng E (khớp đầu ±16px) — không đo cổ từ vai lên (tay vung ngang ngực
	// làm mất vai, dẫm 29/10 trên bản skeleton-v3).
	const run2 = runCells.map((cell) => outfitLayers(cell, head2.E!, std, 'run', head2.E!));

	// Ghép: thân (và lớp trên đầu nếu có) của bộ đồ + đầu 2 tại neo cổ của khung bộ đồ. Q5: hở cổ do ghép (thân đã bỏ dải cổ da của đầu 1).
	// Q5: chỉ lỗ do ghép — chỗ ảnh gốc bộ đồ có pixel mà bản ghép đầu 2 trống (khe vẽ sẵn giữa cằm và cổ áo không tính).
	// Q10: mắt mọi đầu phải nâu (chủ dự án 28/10) — lớp đầu có pixel xanh dương rõ là khung PixelLab vẽ sai màu mắt.
	const check = (full: RGBAImage, body: RGBAImage, neck: Point, h: Layers): string[] => {
		const composed = composeHead(body, h.head, neck, std, h.hairBack);
		// Chỉ dải nối cổ (từ 1 hàng trên neo xuống): mép hàm / má đầu 1 rộng hơn đầu 2 thì chỗ đó lộ nền là đúng, không phải khe cổ.
		const holes = neckSeamHoles(composed, neck).filter(([x, y]) => y >= neck[1] - 1 && full.data[(y * full.width + x) * 4 + 3] !== 0).length;
		const blue = blueEyePixels(h.head);
		return [...(holes > Number(std.qa.neckSeamHolesMax) ? [`Q5: hở cổ ${holes} pixel`] : []), ...(blue ? [`Q10: ${blue} pixel mắt xanh (mắt phải nâu)`] : [])];
	};
	const swap = (l: Layers, h: Layers, ms: number, label: string[] = []): ReviewFrame => ({ body: l.body, head: h.head, hairBack: h.hairBack, neck: l.neck, durationMs: ms, issues: [...label, ...check(l.full, l.body, l.neck, h)] });
	const clips: ReviewClip[] = [
		{ id: 'swap-heads', label: 'ĐỔI ĐẦU — cùng thân bộ Kiếm sĩ, đầu 1 ↔ đầu 2 (S, E, N, W)', dir: 'S E N W', loop: true,
			frames: (['S', 'E', 'N', 'W'] as DirId[]).flatMap((d) => [swap(outRot[d], outRot[d], 700, [`${d} đầu 1`]), swap(outRot[d], head2[d]!, 700, [`${d} đầu 2`])]) },
		{ id: 'head2-rot', label: 'Đầu 2 trên bộ Kiếm sĩ — 8 hướng (tắt "Lớp đầu" để soi thân)', dir: ALL.join(' '), loop: true, frames: ALL.map((d) => swap(outRot[d], head2[d]!, 500, [d])) },
		{ id: 'head2-bare-rot', label: 'Đầu 2 — ảnh gốc PixelLab thân gốc + đầu 2 (nguồn tách đầu)', dir: ALL.join(' '), loop: true, frames: ALL.map((d) => ({ body: head2[d]!.full, head: null, neck: head2[d]!.neck, durationMs: 500, issues: [] })) },
	];
	const notes: string[] = [];
	for (const { anim, d, dressed } of motionClips(sample, std, src, bareRot, outRot, notes)) {
		if (!dressed) continue;
		const def = std.animations.find((a) => a.id === anim)!;
		const ms = (i: number): number => def.durationsMs[i % def.durationsMs.length]!;
		const label = anim === 'walk' ? 'Đi' : 'Chạy';
		// Chạy có khung đầu riêng (tóc / sừng nảy theo bước, cùng template); đi dùng đầu tĩnh theo hướng (chuẩn head.poses).
		const headAt = (i: number): Layers => (anim === 'run' && d === 'E' && run2.length === dressed.length ? run2[i]! : head2[d]!);
		clips.push({ id: `${anim}-${d}-head2`, label: `${label} ${d} — bộ Kiếm sĩ + đầu 2${anim === 'run' ? ' (khung đầu khi chạy)' : ' (đầu tĩnh)'}`, dir: d, loop: true, frames: dressed.map((l, i) => swap(l, headAt(i), ms(i))) });
		if (d === 'E') {
			const west = dressed.map((l) => mirrorLayers(l, 'lật từ E', std));
			const westHead = (i: number): Layers => (anim === 'run' && run2.length === dressed.length ? mirrorLayers(run2[i]!, 'lật từ E', std) : head2.W!);
			clips.push({ id: `${anim}-W-head2`, label: `${label} W — lật từ E, đầu 2`, dir: 'W', loop: true, frames: west.map((l, i) => swap(l, westHead(i), ms(i))) });
		}
	}
	const def = std.animations.find((a) => a.id === 'slash')!;
	for (const { d, frames } of slashClips(sample, std, outRot)) {
		const view = (a: AttackLayers, h: Layers, i: number): ReviewFrame => ({
			body: a.body, head: h.head, hairBack: h.hairBack, bodyFront: a.bodyFront, weapon: a.weapon, handFront: a.handFront, neck: a.neck, durationMs: def.durationsMs[i]!,
			issues: [...(i + 1 === def.hitFrame ? ['★ khung chạm'] : []), ...check(a.full, a.body, a.neck, h)],
		});
		clips.push({ id: `slash-${d}-head2`, label: `Chém ${d} — bộ Kiếm sĩ + kiếm + đầu 2 (đầu tĩnh theo hướng, tay trước mặt vẽ trên đầu)`, dir: d, loop: true, frames: frames.map((a, i) => view(a, head2[d]!, i)) });
		if (d === 'E') clips.push({ id: 'slash-W-head2', label: 'Chém W — lật từ E, đầu 2', dir: 'W', loop: true, frames: frames.map((a, i) => view(mirrorAttack(a, std), head2.W!, i)) });
	}
	const issues = clips.flatMap((c) => c.frames.flatMap((f) => (f.issues ?? []).filter((x) => /^Q/.test(x))));
	notes.unshift(
		issues.length ? `CÓ ${issues.length} cảnh báo QA — xem dưới từng khung.` : 'Không có cảnh báo QA tự động; duyệt bằng mắt: chỗ nối cổ, sừng / tóc với cổ áo và tay, đứng / đi / chạy / chém ở 0,5× và 1×.',
		'Thử ĐỔI ĐẦU thật: thân / bộ đồ / kiếm / đòn chém giữ nguyên lớp đã duyệt, chỉ thay lớp đầu bằng đầu 2 (Ma tộc, bản 4101) đặt tại neo cổ từng khung. Không vẽ lại thân.',
		'Đầu 2 tách từ nhân vật thân gốc + đầu 2 (8 hướng: vẽ 5, lật 3); chạy E dùng khung đầu khi chạy cùng template. Đi / chém dùng đầu tĩnh theo hướng.',
	);
	const slug = `${sample}-d`;
	const page = writeReview(
		{ id: slug, title: 'Mẫu 1 · chặng D — đổi đầu: đầu 2 Ma tộc trên bộ Kiếm sĩ (đứng / đi / chạy / chém)', notes, clips, reference: { label: 'npc_silver_youth (chuẩn độ nét)', image: referenceInCell('npc_silver_youth', std) }, mapTile: townGroundPatch(join(LAYERED_SOURCES, sample, 'processed', 'map.png')) ?? undefined },
		join(REVIEW_ROOT, slug),
		std,
	);
	console.log(`✔ trang soi: ${page}\n  link: https://admin.tail024813.ts.net/site/media/layered/${slug}/index.html`);
}

/** Một chặng bộ đồ trên một thân (F: nữ; H: nam tỷ lệ mới): bộ ba nhân vật nguồn + chữ trên trang soi. */
interface OutfitStage {
	stage: string;
	/** Tên trang soi / tệp processed (mặc định theo chặng) — chặng có hai nhân vật cần tên riêng. */
	slug?: string;
	ids: SourceIds;
	who: string;
	swapLabel: string;
	note: string;
	reference: string;
}

const FEMALE_STAGE: OutfitStage = {
	stage: 'F',
	ids: FEMALE_SOURCES,
	who: 'nữ',
	swapLabel: 'nữ, cùng đầu nữ 1',
	note: 'Bộ Kiếm sĩ nữ (bản 7303) trên thân gốc nữ + đầu nữ 1. Đi / chạy vẽ bằng skeleton-v3 (template co người nữ ~10%); đầu cắt từ chính khung mặc đồ, đầu / thân không chồng pixel.',
	reference: 'npc_silver_youth_f',
};

/** Thân NAM tỷ lệ người lớn (chặng G–H, ~4,8 đầu, cao ~106px). */
const TALL_MALE_STAGE: OutfitStage = {
	stage: 'H',
	ids: { bald: 'G1-tall-male-ref', bare: 'G3-tall-head1-char', outfit: 'H1-tall-outfit-char' },
	who: 'nam tỷ lệ mới',
	swapLabel: 'nam tỷ lệ mới, cùng đầu nam 1 (9933)',
	note: 'Bộ Kiếm sĩ (bản 1633) trên thân nam tỷ lệ mới 9404 + đầu nam 1 (9933). Đi / chạy / chém vẽ bằng skeleton-v3; bảng tư thế chém là bản nam đã duyệt quy đổi theo tầm tay mới. Đầu cắt từ chính khung mặc đồ, đầu / thân không chồng pixel.',
	reference: 'npc_silver_youth',
};

/** Thân NỮ tỷ lệ người lớn (chặng I): sửa từ thân nam 9404 — cùng chiều cao / cỡ đầu / neo cổ. */
const TALL_FEMALE_STAGE: OutfitStage = {
	stage: 'I',
	ids: { bald: 'I2-tall-female-ref', bare: 'I4-tall-head-f2-char', outfit: 'I6-tall-outfit-f-char' },
	who: 'nữ tỷ lệ mới',
	swapLabel: 'nữ tỷ lệ mới, cùng đầu nữ 2 (tóc tém 9866)',
	note: 'Bộ Kiếm sĩ nữ (bản 1722) trên thân nữ tỷ lệ mới 9722 (sửa từ thân nam 9404: cùng cao 106px, đầu 23px, neo cổ) + đầu nữ 2 tóc tém (9866). Đi / chạy / chém vẽ bằng skeleton-v3; chém E / S là bản con lắc / chéo một trục của nam quy đổi theo tầm tay nữ. Đầu cắt từ chính khung mặc đồ, đầu / thân không chồng pixel.',
	reference: 'npc_silver_youth_f',
};

/** Chặng K: bộ Kiếm sĩ đầu Ma tộc vẽ như đầu thường (chủ dự án 29/10: "hãy vẽ đầu ma tộc ghép như đầu thường") — mỗi giới một nhân vật. */
const DEMON_FEMALE_STAGE: OutfitStage = {
	stage: 'K',
	slug: 'k-nu',
	ids: { bald: 'I2-tall-female-ref', bare: 'J6-tall-head2f-char-redo', outfit: 'K1f-demon-outfit-f-char' },
	who: 'nữ đầu Ma tộc',
	swapLabel: 'nữ đầu Ma tộc (4511)',
	note: 'Bộ Kiếm sĩ nữ đầu Ma tộc (bản 1811, đầu 4511) vẽ NHƯ ĐẦU THƯỜNG: mặc đồ lên chính đầu Ma tộc → xoay → đi / chạy / chém bằng đúng bảng tư thế đã chốt; đầu cắt từ chính từng khung, đầu / thân không chồng pixel.',
	reference: 'npc_silver_youth_f',
};

const DEMON_MALE_STAGE: OutfitStage = {
	stage: 'K',
	slug: 'k-nam',
	ids: { bald: 'G1-tall-male-ref', bare: 'J1-tall-head2-char', outfit: 'K1m-demon-outfit-m-char' },
	who: 'nam đầu Ma tộc',
	swapLabel: 'nam đầu Ma tộc (4433)',
	note: 'Bộ Kiếm sĩ nam đầu Ma tộc (bản 1944, đầu 4433) vẽ NHƯ ĐẦU THƯỜNG: mặc đồ lên chính đầu Ma tộc → xoay → đi / chạy / chém bằng đúng bảng tư thế đã chốt; đầu cắt từ chính từng khung, đầu / thân không chồng pixel.',
	reference: 'npc_silver_youth',
};

/**
 * Chặng F (thân NỮ) / H (thân nam tỷ lệ mới) / I (thân nữ tỷ lệ mới) / K (bộ Kiếm sĩ đầu Ma tộc): bộ Kiếm sĩ — như chặng B nhưng đi / chạy chỉ có bản mặc đồ (skeleton-v3, không có clip thân trần E/N): mỗi khung
 * tách 3 lớp từ chính ảnh mặc đồ, khớp khuôn đầu ảnh xoay bộ đồ cùng hướng.
 */
function processF(sample: string, std: LayeredStandard, cfg: OutfitStage = FEMALE_STAGE): void {
	const { src, bareRot, outRot } = rotationLayers(sample, std, cfg.ids);
	const who = cfg.who;
	const layered = (l: Layers, ms: number, issues = l.issues): ReviewFrame => ({ body: l.body, head: l.head, hairBack: l.hairBack, neck: l.neck, durationMs: ms, issues });
	const original = (l: Layers, ms: number): ReviewFrame => ({ body: l.full, head: null, neck: l.neck, durationMs: ms, issues: [] });
	const clips: ReviewClip[] = [
		{ id: 'swap', label: `MẶC / THÁO ĐỒ — ${cfg.swapLabel}, đổi lớp thân (S, E, N, W)`, dir: 'S E N W', loop: true,
			frames: (['S', 'E', 'N', 'W'] as DirId[]).flatMap((d) => [layered(bareRot[d], 700, [`${d} thân nền`]), layered(outRot[d], 700, [`${d} bộ Kiếm sĩ`, ...outRot[d].issues])]) },
		{ id: 'outfit-rot', label: `Bộ Kiếm sĩ ${who} 8 hướng — GHÉP 3 LỚP (tắt "Lớp đầu" để soi thân bộ đồ)`, dir: ALL.join(' '), loop: true, frames: ALL.map((d) => layered(outRot[d], 500, [d, ...outRot[d].issues])) },
		{ id: 'outfit-rot-full', label: `Bộ Kiếm sĩ ${who} 8 hướng — ảnh gốc PixelLab`, dir: ALL.join(' '), loop: true, frames: ALL.map((d) => original(outRot[d], 500)) },
	];
	const out: Record<string, unknown> = { sample, stage: cfg.stage, standardVersion: std.version, rotations: Object.fromEntries(DRAWN.map((d) => [d, outRot[d].stats])), clips: {} };
	for (const anim of ['walk', 'run'] as const) {
		const def = std.animations.find((a) => a.id === anim)!;
		const ms = (i: number): number => def.durationsMs[i % def.durationsMs.length]!;
		const label = anim === 'walk' ? 'Đi' : 'Chạy';
		for (const d of DRAWN) {
			const cells = clipCells(src.outfit!, src.outfitDir!, clipNames(sample, std, src.outfitId!, anim, d), d, std);
			if (!cells.length) continue;
			const dressed = cells.map((cell, i) => {
				try {
					return outfitLayers(cell, outRot[d], std, anim, outRot[d]);
				} catch (e) {
					throw new Error(`${label} ${d} khung ${i + 1}: ${e instanceof Error ? e.message : String(e)}`);
				}
			});
			clips.push(
				{ id: `${anim}-outfit-${d}`, label: `${label} ${d} — bộ Kiếm sĩ ${who} GHÉP 3 LỚP`, dir: d, loop: true, frames: dressed.map((l, i) => layered(l, ms(i))) },
				{ id: `${anim}-outfit-${d}-full`, label: `${label} ${d} — bộ Kiếm sĩ ${who}, ảnh gốc PixelLab`, dir: d, loop: true, frames: dressed.map((l, i) => original(l, ms(i))) },
			);
			(out.clips as Record<string, unknown>)[`${anim}-outfit-${d}`] = dressed.map((l) => l.stats);
			if (d === 'E') clips.push({ id: `${anim}-outfit-W`, label: `${label} W — lật từ E`, dir: 'W', loop: true, frames: dressed.map((l, i) => layered(mirrorLayers(l, 'lật từ E', std), ms(i))) });
		}
	}
	const sdef = std.animations.find((a) => a.id === 'slash')!;
	const view = (a: AttackLayers, i: number): ReviewFrame => ({
		body: a.body, head: a.head, hairBack: a.hairBack, bodyFront: a.bodyFront, weapon: a.weapon, handFront: a.handFront, weaponBehind: a.weaponBehind, neck: a.neck, durationMs: sdef.durationsMs[i]!,
		issues: [...(i + 1 === sdef.hitFrame ? ['★ khung chạm'] : []), `kiếm ${a.weaponAngleDeg}°`, ...a.issues.filter((x) => /^Q/.test(x))],
	});
	for (const { d, frames } of slashClips(sample, std, outRot, cfg.stage, cfg.ids.outfit)) {
		clips.push(
			{ id: `slash-${d}`, label: `Chém ${d} — bộ Kiếm sĩ ${who} GHÉP ĐỦ LỚP (thân / đầu / tay trước mặt / kiếm / ngón tay)`, dir: d, loop: true, frames: frames.map(view) },
			{ id: `slash-${d}-full`, label: `Chém ${d} — ảnh gốc PixelLab (tay không)`, dir: d, loop: true, frames: frames.map((a, i) => ({ body: a.full, head: null, neck: a.neck, durationMs: sdef.durationsMs[i]!, issues: [] })) },
		);
		(out.clips as Record<string, unknown>)[`slash-${d}`] = frames.map((a, i) => ({ neck: a.neck, grip: a.grip, weaponAngleDeg: a.weaponAngleDeg, bladeLen: a.bladeLen, weaponLayer: a.weaponBehind ? 'back' : 'front', durationMs: sdef.durationsMs[i], event: i + 1 === sdef.hitFrame ? 'hit' : undefined }));
		if (d === 'E') clips.push({ id: 'slash-W', label: 'Chém W — lật từ E', dir: 'W', loop: true, frames: frames.map((a, i) => view(mirrorAttack(a, std), i)) });
	}
	const issues = clips.flatMap((c) => c.frames.flatMap((f) => (f.issues ?? []).filter((x) => /^Q|Cổ dài/.test(x))));
	const notes = [
		issues.length ? `CÓ ${issues.length} cảnh báo QA — xem dưới từng khung.` : 'Không có cảnh báo QA tự động; duyệt bằng mắt: mặc / tháo đồ, đi / chạy / chém ở 0,5× và 1×.',
		cfg.note,
	];
	mkdirSync(join(LAYERED_SOURCES, sample, 'processed'), { recursive: true });
	writeFileSync(join(LAYERED_SOURCES, sample, 'processed', `${cfg.slug ?? cfg.stage}.json`), `${JSON.stringify(out, null, '\t')}\n`);
	const slug = `${sample}-${(cfg.slug ?? cfg.stage).toLowerCase()}`;
	const page = writeReview(
		{ id: slug, title: `Mẫu 1 · chặng ${cfg.stage} — bộ Kiếm sĩ ${who}, mặc / tháo đồ, đi / chạy / chém`, notes, clips, reference: { label: `${cfg.reference} (chuẩn độ nét)`, image: referenceInCell(cfg.reference, std) }, mapTile: townGroundPatch(join(LAYERED_SOURCES, sample, 'processed', 'map.png')) ?? undefined },
		join(REVIEW_ROOT, slug),
		std,
	);
	console.log(`✔ trang soi: ${page}\n  link: https://admin.tail024813.ts.net/site/media/layered/${slug}/index.html`);
}

/** Hai thân tỷ lệ mới (đã duyệt H / I) với đầu gốc của từng thân — đầu chỉ dùng với thân CÙNG GIỚI (mỗi tộc 3 đầu nam + 3 đầu nữ). */
function tallBodies(sample: string, std: LayeredStandard) {
	return [
		{ key: 'm', gender: 'male' as const, who: 'nam', nativeHead: 'head1', nativeLabel: 'Nhân tộc nam 1 (tóc đen, 9933)', stage: TALL_MALE_STAGE, ...rotationLayers(sample, std, TALL_MALE_STAGE.ids) },
		{ key: 'f', gender: 'female' as const, who: 'nữ', nativeHead: 'headf2', nativeLabel: 'Nhân tộc nữ 2 (tóc tém, 9866)', stage: TALL_FEMALE_STAGE, ...rotationLayers(sample, std, TALL_FEMALE_STAGE.ids) },
	];
}

/** Đầu Ma tộc theo giới (chặng J): nhân vật thân gốc + đầu, tách trên thân gốc trọc cùng giới như chặng A. */
const DEMON_HEADS = {
	male: { id: 'head2', item: 'J1-tall-head2-char', label: 'Ma tộc nam (sừng, 4433)' },
	female: { id: 'head2f', item: 'J6-tall-head2f-char-redo', label: 'Ma tộc nữ (sừng, 4511)' },
} as const;

/** Lớp đầu 8 hướng (vẽ 5, lật 3) + khung đầu chạy E của một nhân vật thân gốc + đầu; null = món chưa vẽ. */
function headFromCharacter(sample: string, std: LayeredStandard, item: string, bald: PixelLabSource, notes?: string[]): { rot: Record<DirId, Layers>; run: Layers[]; follow: Record<string, Layers[]> } | null {
	const dir = join(LAYERED_SOURCES, sample, 'raw', item);
	if (!existsSync(join(dir, 'metadata.json'))) return null;
	const src = new PixelLabSource(dir);
	const rot = (from: PixelLabSource, d: DirId): RGBAImage => {
		const img = from.rotation(d);
		if (!img) throw new Error(`${item}: thiếu ảnh xoay ${d}`);
		binarizeAlpha(img);
		return placeInCell(img, cellOffset(img, std), std);
	};
	const out: Partial<Record<DirId, Layers>> = {};
	for (const d of DRAWN) {
		const baldCell = rot(bald, d);
		out[d] = splitHaired(rot(src, d), baldCell, measureNeck(baldCell).neck[1], d, std, notes);
	}
	for (const d of ALL.filter((x) => !DRAWN.includes(x))) out[d] = mirrorLayers(out[mirrorDir(d)]!, `lật từ ${mirrorDir(d)}`, std);
	// Khung vẽ THEO clip thân (món animate_with_skeleton_v3 có follows): đầu cắt từng khung, khớp tư thế thân — ưu tiên hơn chạy template.
	const follow: Record<string, Layers[]> = {};
	for (const it of Object.values(checkedPlan(sample, std).stages).flatMap((st) => st.items)) {
		if (it.tool !== 'animate_with_skeleton_v3' || it.character !== item || !it.follows) continue;
		const fdir = join(LAYERED_SOURCES, sample, 'raw', it.id);
		if (!existsSync(join(fdir, 'frame-00.png'))) continue;
		const sk = JSON.parse(readFileSync(join(skeletonDir(sample), `${it.skeleton}.json`), 'utf8')) as BuiltSkeleton;
		const d = std.directions.find((x) => x.pixellab === sk.direction)!.id;
		const first = readPng(join(fdir, 'first.png'));
		binarizeAlpha(first);
		const off = cellOffset(first, std);
		const kp = (f: Keypoint[]): Point => {
			const k = f.find((x) => x.label === 'NECK')!;
			return [k.x * sk.size[0], k.y * sk.size[1]];
		};
		const [rx, ry] = kp(sk.first);
		const cells = sk.frames.map((_, i) => {
			const img = readPng(join(fdir, `frame-${String(i).padStart(2, '0')}.png`));
			binarizeAlpha(img);
			return placeInCell(img, off, std);
		});
		// Khung vẽ theo khung xương là THÂN TRẦN: cắt theo đường cổ như clip thân trần (không theo khuôn đầu đứng — đầu chúi lệch khuôn).
		const hints = sk.frames.map((f): Point => {
			const [fx, fy] = kp(f.keypoints);
			return [Math.round(fx - rx), Math.round(fy - ry)];
		});
		// Khuôn đầu đứng dời theo gợi ý khung xương, nới rộng (đầu chúi / nghiêng lệch khuôn) — cắt theo đường cổ thì vớ cả tay sau vung
		// ngang gáy khi chạy (dẫm 29/10).
		follow[`${it.animation}_${d}`] = cells.map((cell, i) => {
			try {
				return outfitLayers(cell, out[d]!, std, String(it.animation), out[d]!, undefined, hints[i]);
			} catch (e) {
				throw new Error(`${it.id} khung ${i + 1}: ${e instanceof Error ? e.message : String(e)}`);
			}
		});
	}
	const run = follow.run_E ?? clipCells(src, dir, clipNames(sample, std, item, 'run', 'E'), 'E', std).map((cell) => outfitLayers(cell, out.E!, std, 'run', out.E!));
	return { rot: out as Record<DirId, Layers>, run, follow };
}

/**
 * Chỗ đặt neo cổ của lớp đầu h trên khung thân l (cổ da thuộc thân): đáy cằm của đầu trùng đỉnh cổ của khung — đầu = neo cằm thân trừ
 * (neo cằm − neo cổ) của chính đầu. Thiếu neo cằm thì đặt theo neo cổ như cũ. Dịch nguyên pixel, không co / phóng.
 */
function headAnchorOn(l: Layers, h: Layers): Point {
	// Đầu vẽ trên khuôn thân nền chung: đỉnh cổ khuôn (h.neckTop) trùng đỉnh cổ khung thân — mọi đầu chung khuôn nên chung một điểm đặt.
	if (h.byNeck && l.neckTop && h.neckTop) return [l.neckTop[0] - (h.neckTop[0] - h.neck[0]), l.neckTop[1] - (h.neckTop[1] - h.neck[1])];
	if (!l.chin || !h.chin) return l.neck;
	return [l.chin[0] - (h.chin[0] - h.neck[0]), l.chin[1] - (h.chin[1] - h.neck[1])];
}

/** Lỗ ở dải nối cổ khi đội đầu h lên khung thân l (chỉ chỗ ảnh gốc có pixel — như Q5). */
function seamHoles(l: Layers, h: Layers, std: LayeredStandard): number {
	const at = headAnchorOn(l, h);
	const composed = composeHead(l.body, h.head, at, std, h.hairBack);
	return neckSeamHoles(composed, at).filter(([x, y]) => y >= at[1] - 1 && l.full.data[(y * l.full.width + x) * 4 + 3] !== 0).length;
}

/**
 * Khung đầu chạy riêng của một đầu đổi chỉ dùng khi khớp cổ khung thân tốt hơn đầu tĩnh: đầu chạy vẽ từ nhân vật khác, dáng chạy lệch thân
 * (dẫm 29/10 đầu Ma tộc nữ: hở cổ tới 10 px khi chạy E).
 */
function runHeadsFit(dressed: Layers[], run: Layers[], still: Layers, std: LayeredStandard): boolean {
	if (!run.length || run.length !== dressed.length) return false;
	const total = (head: (i: number) => Layers): number => dressed.reduce((n, l, i) => n + seamHoles(l, head(i), std), 0);
	return total((i) => run[i]!) <= total(() => still);
}

/**
 * Chặng J: đổi đầu trên tỷ lệ mới — mỗi thân chỉ thử đầu CÙNG GIỚI: thân nam đầu nam 1 ↔ đầu Ma tộc nam, thân nữ đầu nữ 2 ↔ đầu Ma tộc nữ,
 * ở đứng / đi / chạy / chém. Thân / bộ đồ / kiếm giữ nguyên lớp đã duyệt, chỉ thay lớp đầu tại neo cổ từng khung — không vẽ lại thân.
 * (Ghép chéo đầu nam lên thân nữ bị chủ dự án loại 29/10: "mỗi tộc là 3 đầu nam 3 đầu nữ".)
 */
function processJ(sample: string, std: LayeredStandard): void {
	const notes: string[] = [];
	const bodies = tallBodies(sample, std).map((b) => ({ ...b, demon: headFromCharacter(sample, std, DEMON_HEADS[b.gender].item, b.src.bald, notes) }));
	// Q5: chỉ lỗ do ghép ở dải nối cổ; Q10: mắt mọi đầu phải nâu (như chặng D).
	const check = (full: RGBAImage, body: RGBAImage, neck: Point, h: Layers): string[] => {
		const composed = composeHead(body, h.head, neck, std, h.hairBack);
		const holes = neckSeamHoles(composed, neck).filter(([x, y]) => y >= neck[1] - 1 && full.data[(y * full.width + x) * 4 + 3] !== 0).length;
		const blue = blueEyePixels(h.head);
		return [...(holes > Number(std.qa.neckSeamHolesMax) ? [`Q5: hở cổ ${holes} pixel`] : []), ...(blue ? [`Q10: ${blue} pixel mắt xanh (mắt phải nâu)`] : [])];
	};
	const swap = (l: Layers, h: Layers, ms: number, label: string[] = []): ReviewFrame => ({ body: l.body, head: h.head, hairBack: h.hairBack, neck: l.neck, durationMs: ms, issues: [...label, ...check(l.full, l.body, l.neck, h)] });
	const clips: ReviewClip[] = [];
	const sdef = std.animations.find((a) => a.id === 'slash')!;
	for (const b of bodies) {
		const demon = b.demon;
		const demonLabel = DEMON_HEADS[b.gender].label;
		if (!demon) {
			notes.push(`Thân ${b.who}: chưa vẽ đầu ${demonLabel} (${DEMON_HEADS[b.gender].item}).`);
			continue;
		}
		const heads = [
			{ label: `đầu ${b.nativeLabel}`, rot: b.outRot },
			{ label: `đầu ${demonLabel}`, rot: demon.rot },
		];
		clips.push({ id: `swap-${b.key}`, label: `ĐỔI ĐẦU trên thân Kiếm sĩ ${b.who} — ${heads.map((h) => h.label).join(' ↔ ')} (S, E, N, W)`, dir: 'S E N W', loop: true,
			frames: (['S', 'E', 'N', 'W'] as DirId[]).flatMap((d) => heads.map((h) => swap(b.outRot[d], h.rot[d], 700, [`${d} ${h.label}`]))) });
		clips.push({ id: `demon-rot-${b.key}`, label: `Đầu ${demonLabel} trên thân Kiếm sĩ ${b.who} — 8 hướng (tắt "Lớp đầu" để soi thân)`, dir: ALL.join(' '), loop: true, frames: ALL.map((d) => swap(b.outRot[d], demon.rot[d], 500, [d])) });
		clips.push({ id: `demon-src-${b.key}`, label: `Đầu ${demonLabel} — ảnh gốc PixelLab thân gốc + đầu (nguồn tách đầu)`, dir: ALL.join(' '), loop: true, frames: ALL.map((d) => ({ body: demon.rot[d].full, head: null, neck: demon.rot[d].neck, durationMs: 500, issues: [] })) });
		for (const anim of ['walk', 'run'] as const) {
			const def = std.animations.find((a) => a.id === anim)!;
			const ms = (i: number): number => def.durationsMs[i % def.durationsMs.length]!;
			const label = anim === 'walk' ? 'Đi' : 'Chạy';
			for (const d of DRAWN) {
				const cells = clipCells(b.src.outfit!, b.src.outfitDir!, clipNames(sample, std, b.src.outfitId!, anim, d), d, std);
				if (!cells.length) continue;
				const dressed = cells.map((cell) => outfitLayers(cell, b.outRot[d], std, anim, b.outRot[d]));
				// Chạy E có khung đầu riêng (tóc / sừng nảy theo bước); còn lại đầu tĩnh theo hướng (chuẩn head.poses).
				// Ưu tiên đầu VẼ THEO khung xương clip thân (nhún / chúi / nghiêng theo thân — chủ dự án 29/10); không có thì khung chạy template
				// nếu khớp cổ hơn đầu tĩnh; cuối cùng đầu tĩnh theo hướng.
				const fol = demon.follow[`${anim}_${d}`]?.length === dressed.length ? demon.follow[`${anim}_${d}`]! : null;
				const withRun = !fol && anim === 'run' && d === 'E' && runHeadsFit(dressed, demon.run, demon.rot.E, std);
				if (!fol && anim === 'run' && d === 'E' && demon.run.length && !withRun) notes.push(`Thân ${b.who}: khung đầu chạy riêng của ${demonLabel} hở cổ nhiều hơn đầu tĩnh — chạy dùng đầu tĩnh theo hướng.`);
				// Có bản vẽ theo khung xương: hiện thêm bản đầu tĩnh để so, kèm tổng lỗ cổ hai cách.
				if (fol) {
					const holes = (h: (i: number) => Layers): number => dressed.reduce((n, l, i) => n + seamHoles(l, h(i), std), 0);
					notes.push(`Thân ${b.who} ${label.toLowerCase()} ${d}: đầu vẽ theo khung xương hở cổ tổng ${holes((i) => fol[i]!)} px, đầu tĩnh ${holes(() => demon.rot[d])} px.`);
					clips.push({ id: `${anim}-${d}-${b.key}-still`, label: `${label} ${d} — SO SÁNH: cùng thân + đầu ${demonLabel} TĨNH (cách cũ, đầu không cử động theo thân)`, dir: d, loop: true, frames: dressed.map((l, i) => swap(l, demon.rot[d], ms(i))) });
				}
				const headAt = (i: number): Layers => (fol ? fol[i]! : withRun ? demon.run[i]! : demon.rot[d]);
				const kind = fol ? ' (đầu VẼ THEO khung xương thân)' : withRun ? ' (khung đầu khi chạy)' : ' (đầu tĩnh)';
				clips.push({ id: `${anim}-${d}-${b.key}`, label: `${label} ${d} — thân Kiếm sĩ ${b.who} + đầu ${demonLabel}${kind}`, dir: d, loop: true, frames: dressed.map((l, i) => swap(l, headAt(i), ms(i))) });
				if (d === 'E') {
					const westHead = (i: number): Layers => (fol ? mirrorLayers(fol[i]!, 'lật từ E', std) : withRun ? mirrorLayers(demon.run[i]!, 'lật từ E', std) : demon.rot.W);
					clips.push({ id: `${anim}-W-${b.key}`, label: `${label} W — lật từ E, thân ${b.who} + đầu ${demonLabel}`, dir: 'W', loop: true, frames: dressed.map((l, i) => swap(mirrorLayers(l, 'lật từ E', std), westHead(i), ms(i))) });
				}
			}
		}
		for (const { d, frames } of slashClips(sample, std, b.outRot, b.stage.stage)) {
			const view = (a: AttackLayers, h: Layers, i: number): ReviewFrame => ({
				body: a.body, head: h.head, hairBack: h.hairBack, bodyFront: a.bodyFront, weapon: a.weapon, handFront: a.handFront, weaponBehind: a.weaponBehind, neck: a.neck, durationMs: sdef.durationsMs[i]!,
				issues: [...(i + 1 === sdef.hitFrame ? ['★ khung chạm'] : []), ...check(a.full, a.body, a.neck, h)],
			});
			clips.push({ id: `slash-${d}-${b.key}`, label: `Chém ${d} — thân Kiếm sĩ ${b.who} + kiếm + đầu ${demonLabel} (đầu tĩnh theo hướng)`, dir: d, loop: true, frames: frames.map((a, i) => view(a, demon.rot[d], i)) });
			if (d === 'E') clips.push({ id: `slash-W-${b.key}`, label: `Chém W — lật từ E, thân ${b.who} + đầu ${demonLabel}`, dir: 'W', loop: true, frames: frames.map((a, i) => view(mirrorAttack(a, std), demon.rot.W, i)) });
		}
	}
	const issues = clips.flatMap((c) => c.frames.flatMap((f) => (f.issues ?? []).filter((x) => /^Q/.test(x))));
	notes.unshift(
		issues.length ? `CÓ ${issues.length} cảnh báo QA — xem dưới từng khung.` : 'Không có cảnh báo QA tự động; duyệt bằng mắt: chỗ nối cổ, sừng / tóc với cổ áo và tay, đứng / đi / chạy / chém ở 0,5× và 1×.',
		'Thử ĐỔI ĐẦU trên tỷ lệ mới, mỗi thân chỉ đầu CÙNG GIỚI (mỗi tộc 3 đầu nam + 3 đầu nữ): thân nam đầu Nhân tộc nam 1 ↔ Ma tộc nam (4433), thân nữ đầu Nhân tộc nữ 2 ↔ Ma tộc nữ (4511). Thân / bộ đồ / kiếm / đòn chém (H, I) giữ nguyên lớp đã duyệt, chỉ thay lớp đầu tại neo cổ từng khung.',
		'Đầu Ma tộc tách từ nhân vật thân gốc + đầu cùng giới (8 hướng: vẽ 5, lật 3); chạy E dùng khung đầu khi chạy. Đi / chém dùng đầu tĩnh theo hướng.',
	);
	const slug = `${sample}-j`;
	const page = writeReview(
		{ id: slug, title: 'Mẫu 1 · chặng J — đổi đầu tỷ lệ mới: Nhân tộc ↔ Ma tộc trên bộ Kiếm sĩ nam / nữ (đầu cùng giới)', notes, clips, reference: { label: 'npc_silver_youth (chuẩn độ nét)', image: referenceInCell('npc_silver_youth', std) }, mapTile: townGroundPatch(join(LAYERED_SOURCES, sample, 'processed', 'map.png')) ?? undefined },
		join(REVIEW_ROOT, slug),
		std,
	);
	console.log(`✔ trang soi: ${page}\n  link: https://admin.tail024813.ts.net/site/media/layered/${slug}/index.html`);
}

/** Tấm ghép ô cùng cỡ (lưới cột cố định) — ảnh trống bỏ qua, ảnh trùng byte dùng chung một ô. */
class GridSheet {
	readonly cells: RGBAImage[] = [];
	private readonly seen = new Map<string, number>();
	constructor(readonly w: number, readonly h: number, readonly columns: number) {}
	add(img: RGBAImage | null | undefined): number {
		if (!img || !img.data.some((v, i) => i % 4 === 3 && v !== 0)) return -1;
		if (img.width !== this.w || img.height !== this.h) throw new Error(`Ô ${img.width}×${img.height} khác cỡ tấm ${this.w}×${this.h}`);
		const key = Buffer.from(img.data).toString('base64');
		const hit = this.seen.get(key);
		if (hit !== undefined) return hit;
		this.cells.push(img);
		this.seen.set(key, this.cells.length - 1);
		return this.cells.length - 1;
	}
	image(): RGBAImage {
		const rows = Math.max(1, Math.ceil(this.cells.length / this.columns));
		const out = createImage(this.w * Math.min(this.columns, Math.max(1, this.cells.length)), this.h * rows);
		this.cells.forEach((c, i) => blit(out, c, (i % this.columns) * this.w, Math.floor(i / this.columns) * this.h));
		return out;
	}
}

/**
 * Xuất mẫu ghép lớp tỷ lệ mới cho Unity (bước "ráp trong Unity" của mẫu thử): `assets/layered/<mẫu>/` gồm tấm ô thân mỗi thân
 * (`cells-<thân>.png`: thân / tay trước mặt / ngón tay / kiếm, cùng ô 160×160 root (80,144)), tấm đầu (`heads.png`: 48×48 neo cổ (24,40))
 * và `layered.json` (khung từng clip: chỉ số ô từng lớp, neo cổ, thời lượng, kiếm trước / sau, khung chạm). Đầu gốc của thân (cắt từ chính
 * khung) đi kèm từng khung; đầu khác dùng ảnh theo hướng hoặc khung riêng của clip (chạy E đầu 2). Không đổi pixel nào so với trang soi.
 */
function exportUnity(sample: string, std: LayeredStandard): void {
	// MỘT KHUÔN mỗi giới (chủ dự án 30/10 nam, 31/10 nữ): thân mỗi class = bộ đồ sửa trên thân nền trọc cùng giới; mọi đầu cùng giới sửa trên
	// cùng thân nền → đặt theo độ dời đầu trọc từng khung. Thân nữ thử cũ ('f' cách ghép đầu theo neo cằm) đã thay bằng khuôn nữ.
	const [cw, ch] = [std.cell.width, std.cell.height];
	const [hw, hh] = std.head.canvas;
	const heads = new GridSheet(hw, hh, 16);
	const hairs = new GridSheet(LONG_HAIR_CANVAS[0], LONG_HAIR_CANVAS[1], 16);
	type FrameOut = { body: number; front: number; hand: number; weapon: number; weaponBehind?: boolean; weaponMid?: number; neck: Point; chin: Point; ms: number; head: number; hairBack: number; event?: string; toolTip?: Point };
	const outBodies: Array<{ id: string; gender: string; mould?: string; nativeHead: string; sheet: string; clips: Record<string, FrameOut[]> }> = [];
	const outDir = join(REPO, 'assets', 'layered', sample);
	mkdirSync(outDir, { recursive: true });
	const headsOf: Record<BaseId, ReturnType<typeof mouldHeads>> = { male: mouldHeads(sample, std, 'male'), female: mouldHeads(sample, std, 'female'), npcMale: mouldHeads(sample, std, 'npcMale'), npcFemale: mouldHeads(sample, std, 'npcFemale') };
	const moulds = MOULDS.filter((m) => mouldReady(sample, std, m)).map((spec) => ({ spec, mould: mouldBody(sample, std, spec) }));
	for (const { spec, mould } of moulds) sealMould(mould, spec.heads ? mouldHeadsFor(sample, std, spec) : headsOf[spec.base], std, isNpc(spec.base));
	// Mốc neo chung mọi khuôn cùng thân nền (thân Kiếm sĩ đứng): chin khung = mốc + độ dời, chinOffset đầu = mốc − neo cổ đầu.
	const REF_KEY: Record<BaseId, string> = { male: 'm', female: 'f', npcMale: 'u', npcFemale: 'uf' };
	const refOf = (base: BaseId): Record<DirId, Layers> | null => moulds.find((m) => m.spec.base === base && m.spec.key === REF_KEY[base])?.mould.rest ?? null;
	// Khuôn cũ 4 hướng: hướng chéo lấy hướng kề; khuôn cỡ NPC đủ 8 hướng (5 vẽ + 3 lật).
	const NEAR4: Record<DirId, DirId> = { S: 'S', E: 'E', N: 'N', W: 'W', SE: 'E', SW: 'W', NE: 'N', NW: 'N' };
	const nearOf = (base: BaseId): Record<DirId, DirId> => (isNpc(base) ? (Object.fromEntries(ALL.map((d) => [d, d])) as Record<DirId, DirId>) : NEAR4);
	// Nhãn khuôn: đầu chỉ đội thân cùng khuôn (đầu cỡ NPC trên thân cũ cao ~106px sẽ lệch cỡ) — Unity `LayeredCharacterDef.Fits`.
	const MOULD_TAG: Partial<Record<BaseId, string>> = { npcMale: 'npc', npcFemale: 'npc' };
	const headId = (base: BaseId, id: string): string => (MOULD_TAG[base] ? `${MOULD_TAG[base]}-${id}` : id);
	for (const { spec, mould } of moulds) {
		const ref = refOf(spec.base);
		if (!ref) throw new Error(`Khuôn ${spec.key}: chưa có thân Kiếm sĩ ${BASES[spec.base].label.toLowerCase()} làm mốc neo`);
		const cells = new GridSheet(cw, ch, 16);
		const clips: Record<string, FrameOut[]> = {};
		const near = nearOf(spec.base);
		const frame = (fr: MouldFrame, d: DirId): FrameOut => {
			const a = fr.l as AttackLayers;
			const r = ref[d].neck;
			// Cỡ NPC: tấn công tạm dừng — vũ khí đeo lưng / khiên gắn tay ở lớp vũ khí mọi khung đứng / đi / chạy (`carryLayer`).
			const carry = isNpc(spec.base) && !a.weapon ? carryLayer(spec.attack, d, a.neck, fr.arm, std) : null;
			// Vũ khí đeo lưng không nằm sau thân thì vẽ trên cùng — ngoài tóc (chủ dự án 05/11).
			const weapon = carry ? carry.mid ?? carry.behind : a.weapon;
			const behind = carry ? !carry.mid && !!carry.behind : a.weaponBehind;
			const mid = null as RGBAImage | null;
			return {
				body: cells.add(a.body), front: a.bodyFront ? cells.add(a.bodyFront) : -1, hand: a.handFront ? cells.add(a.handFront) : -1, weapon: weapon ? cells.add(weapon) : -1, ...(behind ? { weaponBehind: true } : {}), ...(mid ? { weaponMid: cells.add(mid) } : {}),
				neck: a.neck, chin: [r[0] + fr.shift[0], r[1] + fr.shift[1]], ms: fr.ms, head: -1, hairBack: -1, ...(fr.hit ? { event: 'hit' } : {}),
			};
		};
		for (const d of ALL) clips[`idle_${d}`] = [frame(mould.clips[`idle_${near[d]}`]![0]!, near[d])];
		for (const [key, frames] of Object.entries(mould.clips)) if (!key.startsWith('idle_')) clips[key] = frames.map((fr) => {
			const out = frame(fr, key.split('_')[1] as DirId);
			// Cần câu liền thân: đầu cần là pixel cao nhất của lớp dụng cụ / thân đã tách đầu; chỉ xuất toạ độ, không sửa hình.
			if (spec.attack === 'farm' && key.startsWith('fish_')) {
				const layers = [fr.l.body, (fr.l as AttackLayers).bodyFront].filter(Boolean) as RGBAImage[];
				for (let y = 0; y < ch && !out.toolTip; y++) {
					let best = -1;
					for (let x = 0; x < cw; x++) if (layers.some(img => img.data[(y * cw + x) * 4 + 3]))
						if (best < 0 || Math.abs(x - fr.l.neck[0]) > Math.abs(best - fr.l.neck[0])) best = x;
					if (best >= 0) out.toolTip = [best, y];
				}
			}
			return out;
		});
		writePng(join(outDir, `cells-${spec.key}.png`), cells.image());
		// Giới thân xuất = giới đầu đội (bộ đồ ở nhà nam nữ chung: thân nam đội đầu nữ → thân "female" để Unity cho đầu nữ đội).
		outBodies.push({ id: spec.key, gender: BASES[spec.heads ?? spec.base].gender, ...(MOULD_TAG[spec.base] ? { mould: MOULD_TAG[spec.base] } : {}), nativeHead: 'bald', sheet: `cells-${spec.key}.png`, clips });
		console.log(`  thân ${spec.key} — ${spec.label} ${BASES[spec.base].label.toLowerCase()} (một khuôn): ${Object.keys(clips).length} clip, ${cells.cells.length} ô`);
	}
	// Đầu theo giới (đầu nam chỉ đội thân nam, đầu nữ chỉ thân nữ — Unity chặn ghép khác giới); tóc dài ở tấm hairs.png, cờ trước / sau thân.
	const outHeads: unknown[] = [];
	for (const base of Object.keys(BASES) as BaseId[]) {
		const ref = refOf(base);
		if (!ref) continue;
		const near = nearOf(base);
		for (const h of headsOf[base])
			outHeads.push({
				id: headId(base, h.id),
				gender: BASES[base].gender,
				...(MOULD_TAG[base] ? { mould: MOULD_TAG[base] } : {}),
				label: h.label,
				dirs: Object.fromEntries(
					ALL.map((d) => {
						const l = h.rot[near[d]];
						return [d, { head: heads.add(l.head), hairBack: heads.add(l.hairBack), ...(l.hairLong ? { hairLong: hairs.add(l.hairLong), ...(l.hairLongFront ? { hairLongFront: true } : {}) } : {}), chinOffset: [ref[near[d]].neck[0] - l.neck[0], ref[near[d]].neck[1] - l.neck[1]] }];
					}),
				),
				clips: {},
			});
	}
	writePng(join(outDir, 'heads.png'), heads.image());
	if (hairs.cells.length) writePng(join(outDir, 'hairs.png'), hairs.image());
	const manifest = {
		id: sample,
		standardVersion: std.version,
		animations: Object.fromEntries(std.animations.map((a) => [a.id, { hitFrame: a.hitFrame, segments: a.segments }])),
		pixelsPerUnit: 48,
		cell: { size: [std.cell.width, std.cell.height], root: std.cell.root, columns: 16 },
		head: { canvas: std.head.canvas, neckAnchor: std.head.neckAnchor, columns: 16, sheet: 'heads.png', ...(hairs.cells.length ? { long: { canvas: LONG_HAIR_CANVAS, neckAnchor: LONG_HAIR_ANCHOR, columns: 16, sheet: 'hairs.png' } } : {}) },
		bodies: outBodies,
		heads: outHeads,
	};
	writeFileSync(join(outDir, 'layered.json'), `${JSON.stringify(manifest)}\n`);
	console.log(`✔ xuất Unity: ${outDir} (${heads.cells.length} ô đầu, ${hairs.cells.length} ô tóc dài)`);
}

/**
 * Khung xương "vẽ theo" một clip thân đã duyệt (thân dùng chung cho nhiều đầu — chủ dự án 29/10: "1 bộ nam ghép được đủ 15 đầu nam"):
 * nhân vật đích (đầu khác, cùng bộ đồ) vẽ lại ĐÚNG tư thế từng khung của clip thân → đầu cắt ra khớp thân như đầu gốc.
 * - Đi / chạy (PixelLab tự sinh tư thế): đo khung xương từng khung của clip thân (0,1 lượt / khung), LƯU vào
 *   `skeleton/frames-<thân>-<clip>-<hướng>.json` để mọi đầu dùng lại không đo lại.
 * - Chém (khung xương tự soạn): lấy thẳng khung xương đã giao cho thân (`skeleton/<tên>.json` của món chém).
 * Toạ độ dời theo lệch hông giữa ảnh xoay đứng của hai nhân vật cùng hướng; ảnh xoay đích đệm ra cỡ khung động tác (không scale).
 */
async function buildFollow(sample: string, name: string, bodyItem: string, anim: string, dir: DirId, target: string, std: LayeredStandard, joints = false): Promise<void> {
	const pl = std.directions.find((x) => x.id === dir)!.pixellab;
	type Rest = { size: [number, number]; keypoints: Keypoint[] };
	// Đích dạng "<món sửa ảnh>#<bản>": khung đầu là ảnh sửa (thân mặc đồ sửa trên ảnh xoay thân nền) — đo khung xương ảnh đó một lần.
	const [targetItem, targetSeed] = target.split('#') as [string, string | undefined];
	const restOf = async (item: string): Promise<Rest> => {
		if (item === target && targetSeed) {
			const cache = join(skeletonDir(sample), `rest-${targetItem}-${targetSeed}.json`);
			if (!existsSync(cache)) {
				const img = readPng(join(LAYERED_SOURCES, sample, 'raw', targetItem, `seed-${targetSeed}.png`));
				writeFileSync(cache, `${JSON.stringify({ size: [img.width, img.height], keypoints: await estimateSkeleton(rawToken(), img) })}\n`);
			}
			return JSON.parse(readFileSync(cache, 'utf8')) as Rest;
		}
		const read = (): Record<string, Rest> => (existsSync(rotationSkeletonPath(sample, item)) ? JSON.parse(readFileSync(rotationSkeletonPath(sample, item), 'utf8')) : {});
		if (!read()[pl]) await estimate(sample, item, [pl], std);
		return read()[pl]!;
	};
	// Khung xương nguồn: { size, pad của ảnh xoay nguồn trong canvas, frames }.
	let source: { size: [number, number]; pad: [number, number]; frames: Keypoint[][]; extra?: Array<Omit<BuiltSkeleton['frames'][number], 'keypoints'>> };
	if (anim === 'slash') {
		const items = Object.values(checkedPlan(sample, std).stages).flatMap((st) => st.items).filter((i) => i.tool === 'animate_with_skeleton_v3' && !i.follows && i.character === bodyItem && i.animation === 'slash' && i.args.direction === pl);
		const item = items[items.length - 1];
		if (!item) throw new Error(`${bodyItem} chưa có món chém hướng ${dir}`);
		const sk = JSON.parse(readFileSync(join(skeletonDir(sample), `${item.skeleton}.json`), 'utf8')) as BuiltSkeleton;
		// Chém: mang theo điểm nắm / góc / độ dài lưỡi / lớp kiếm của bảng tư thế đã chốt (dời cùng khung xương) để ghép kiếm đúng chỗ.
		source = { size: sk.size, pad: [sk.pad[0], sk.pad[2]], frames: sk.frames.map((f) => f.keypoints), extra: sk.frames.map(({ keypoints: _k, ...rest }) => rest) };
		console.log(`  khung xương chém lấy từ skeleton/${item.skeleton}.json (${item.id})`);
	} else {
		const cache = join(skeletonDir(sample), `frames-${bodyItem}-${anim}-${dir}.json`);
		if (existsSync(cache)) source = JSON.parse(readFileSync(cache, 'utf8'));
		else {
			const srcDir = join(LAYERED_SOURCES, sample, 'raw', bodyItem);
			const src = new PixelLabSource(srcDir);
			const clip = clipNames(sample, std, bodyItem, anim, dir).find((n) => src.animationFiles(n, dir).length);
			if (!clip) throw new Error(`${bodyItem} chưa có clip ${anim} ${dir}`);
			const files = src.animationFiles(clip, dir);
			const probe = readPng(join(srcDir, files[0]!));
			const rest = await restOf(bodyItem);
			const frames: Keypoint[][] = [];
			for (const rel of files) {
				frames.push(await estimateSkeleton(rawToken(), readPng(join(srcDir, rel))));
				console.log(`  ✔ đo khung xương ${rel}`);
			}
			source = { size: [probe.width, probe.height], pad: [(probe.width - rest.size[0]) / 2, (probe.height - rest.size[1]) / 2], frames };
			writeFileSync(cache, `${JSON.stringify(source)}\n`);
		}
	}
	const srcRest = await restOf(bodyItem);
	const tgtRest = await restOf(target);
	const hips = (r: Rest): Point => {
		const h = r.keypoints.filter((k) => k.label === 'LEFT HIP' || k.label === 'RIGHT HIP');
		return [(h.reduce((n, k) => n + k.x, 0) / h.length) * r.size[0], (h.reduce((n, k) => n + k.y, 0) / h.length) * r.size[1]];
	};
	const [sx, sy] = hips(srcRest);
	const [tx, ty] = hips(tgtRest);
	const [W, H] = source.size;
	const [rw, rh] = tgtRest.size;
	if ((W - rw) % 2 || (H - rh) % 2 || W < rw || H < rh) throw new Error(`Khung ${W}×${H} không chứa giữa được ảnh xoay ${rw}×${rh}`);
	const pad: [number, number, number, number] = [(W - rw) / 2, (W - rw) / 2, (H - rh) / 2, (H - rh) / 2];
	const dx = tx + pad[0] - (sx + source.pad[0]);
	const dy = ty + pad[2] - (sy + source.pad[1]);
	const jointShift = (label: string): Point => {
		const [a, b] = [srcRest.keypoints.find((k) => k.label === label), tgtRest.keypoints.find((k) => k.label === label)];
		if (!a || !b) throw new Error(`Thiếu khớp ${label} ở khung xương đứng nguồn / đích`);
		return [b.x * rw + pad[0] - (a.x * srcRest.size[0] + source.pad[0]), b.y * rh + pad[2] - (a.y * srcRest.size[1] + source.pad[1])];
	};
	const frames: BuiltSkeleton['frames'] = source.frames.map((kp, i) => {
		const ex = source.extra?.[i];
		return {
			...(ex ?? { bladeDeg: 0 }),
			keypoints: kp.map((k) => {
				// `joints` (chặng U, 04/11): nguồn là thân khác cỡ chút (gói đi / chạy 03/11, ~70px) — mỗi khớp dời theo khớp đứng đích − khớp đứng
				// nguồn (như `transfer`), giữ nhịp bước mà đúng vai / hông / chân của thân đích; không thì dời cả khung theo tâm hông.
				const [jx, jy] = joints ? jointShift(k.label) : [dx, dy];
				return { ...k, x: (k.x * W + jx) / W, y: (k.y * H + jy) / H, z_index: Math.round(k.z_index) };
			}),
			grip: ex ? ([Math.round(ex.grip[0] + dx), Math.round(ex.grip[1] + dy)] as Point) : [0, 0],
		};
	});
	const built: BuiltSkeleton = { character: targetItem, ...(targetSeed ? { firstImage: `${targetItem}/seed-${targetSeed}.png` } : {}), direction: pl, size: [W, H], pad, first: padKeypoints(tgtRest.keypoints, [rw, rh], pad), frames };
	writeFileSync(join(skeletonDir(sample), `${name}.json`), `${JSON.stringify(built, null, '\t')}\n`);
	console.log(`✔ skeleton/${name}.json: ${frames.length} khung theo ${bodyItem} ${anim} ${dir} (dời ${dx.toFixed(1)}, ${dy.toFixed(1)}px)`);
}

/**
 * Chém N (chủ dự án 30/10: "thiếu hướng chém lên trên, lưng quay vào màn hình"): bộ H1 chưa có đòn chém N để vẽ theo — LẬT GƯƠNG khung
 * xương chém S đã duyệt (`from`, đã dời lên thân dùng chung) sang thân nhìn sau. Nhìn từ sau, tay phải nằm bên phải ảnh như ảnh S lật gương nên
 * giữ nhãn khớp; toạ độ lật quanh tâm hông ảnh S rồi dời về tâm hông ảnh N. Độ sâu khớp lấy theo ảnh N đứng (mặt / tai nằm sau đầu); tay
 * chĩa về người xem ở S thành chĩa ra xa (depth 256 − d). Lưỡi lật góc (180° − góc); lớp kiếm đảo: kiếm trước thân ở S thành sau thân ở N,
 * lưỡi ngả sau vai / đầu ở S thành trước đầu ở N.
 */
function mirrorFollow(sample: string, name: string, from: string, target: string, away = false): void {
	const src = JSON.parse(readFileSync(join(skeletonDir(sample), `${from}.json`), 'utf8')) as BuiltSkeleton;
	if (src.direction !== 'south') throw new Error(`${from}: chỉ lật được khung xương hướng S sang N`);
	const [targetItem, targetSeed] = target.split('#') as [string, string];
	const tgtRest = JSON.parse(readFileSync(join(skeletonDir(sample), `rest-${targetItem}-${targetSeed}.json`), 'utf8')) as { size: [number, number]; keypoints: Keypoint[] };
	const [W, H] = src.size;
	const [rw, rh] = tgtRest.size;
	const pad: [number, number, number, number] = [(W - rw) / 2, (W - rw) / 2, (H - rh) / 2, (H - rh) / 2];
	const first = padKeypoints(tgtRest.keypoints, [rw, rh], pad);
	const hips = (kp: Keypoint[]): Point => {
		const h = kp.filter((k) => k.label === 'LEFT HIP' || k.label === 'RIGHT HIP');
		return [(h.reduce((n, k) => n + k.x, 0) / h.length) * W, (h.reduce((n, k) => n + k.y, 0) / h.length) * H];
	};
	const [sx, sy] = hips(src.first);
	const [tx, ty] = hips(first);
	const z = new Map(first.map((k) => [k.label, k.z_index]));
	const mx = (x: number): number => tx + (sx - x);
	const frames: BuiltSkeleton['frames'] = src.frames.map((f) => ({
		...f,
		keypoints: f.keypoints.map((k) => ({
			...k,
			x: mx(k.x * W) / W,
			y: (k.y * H + ty - sy) / H,
			z_index: z.get(k.label) ?? k.z_index,
			...(k.depth !== undefined ? { depth: 256 - k.depth } : {}),
		})),
		grip: [Math.round(mx(f.grip[0])), Math.round(f.grip[1] + ty - sy)] as Point,
		// `away` (đòn đâm / niệm phép chĩa dọc trục nhìn): ở S vũ khí chĩa VỀ người xem nên hình chiếu đi XUỐNG ảnh; nhìn sau, cùng đòn đó chĩa
		// RA XA nên hình chiếu đi LÊN — khung lưỡi ngắn (bladeLen < 0,6) đảo chiều dọc. Đòn bổ xuống (kiếm) không dùng: mũi cuối đòn vẫn ở dưới.
		bladeDeg: ((deg: number): number => (away && (f.bladeLen ?? 1) < 0.6 ? -deg : deg))(f.bladeDeg >= 0 ? 180 - f.bladeDeg : -180 - f.bladeDeg),
		...(f.behind ? { behind: undefined } : { behind: true }),
	}));
	// Kiếm phía trước người (lớp kiếm sau thân): nhìn từ sau cẳng tay / bàn tay khuất sau thân. Lật nguyên thì cổ tay nằm giữa lưng → PixelLab
	// vẽ hai tay bắt chéo sau lưng (dẫm 30/10 lượt 1, khung 1–3 và 9–15). Khuỷu về hai bên sườn như ảnh đứng, cổ tay chỉ nhích vào trong / xuống
	// 3 px và chĩa ra xa người xem (depth 90) — thấy bắp tay hai bên, bàn tay khuất.
	const restAt = (label: string): Keypoint => first.find((k) => k.label === label)!;
	const shoulderY = ((restAt('LEFT SHOULDER').y + restAt('RIGHT SHOULDER').y) / 2) * H;
	for (const f of frames) {
		// Chỉ khung kiếm trước người VÀ điểm nắm dưới vai (thủ thấp / bổ xuống); đỉnh nhát chém tay còn giơ trên đầu.
		if (!f.behind || f.grip[1] < shoulderY) continue;
		f.keypoints = f.keypoints.map((k) => {
			const side = k.label.startsWith('LEFT') ? 'LEFT' : 'RIGHT';
			const inward = (restAt(`${side} SHOULDER`).x < restAt('NECK').x ? 3 : -3) / W;
			if (k.label.endsWith('ELBOW')) return { ...k, x: restAt(k.label).x, y: restAt(k.label).y, depth: 110 };
			if (k.label.endsWith(' ARM')) return { ...k, x: restAt(`${side} ELBOW`).x + inward, y: restAt(`${side} ELBOW`).y + 3 / H, depth: 90 };
			return k;
		});
	}
	const built: BuiltSkeleton = { character: targetItem, firstImage: `${targetItem}/seed-${targetSeed}.png`, direction: 'north', size: [W, H], pad, first, frames };
	writeFileSync(join(skeletonDir(sample), `${name}.json`), `${JSON.stringify(built, null, '	')}
`);
	console.log(`✔ skeleton/${name}.json: ${frames.length} khung lật từ ${from} (S → N)`);
}

/**
 * Đầu thẳng trong khung xương vẽ theo (chủ dự án 30/10, chạy S): bộ H1 chạy S cúi đầu (mũi / mắt sát cổ hơn lúc đứng 5–6 px) nên PixelLab vẽ
 * đầu trọc cúi, mặt tụt thấp — khuôn đầu trọc lúc đứng không cắt được, nửa mặt (mắt xanh) nằm lại thân và lộ dưới đầu thật. Đầu thật là ảnh
 * tĩnh không cúi được, nên giữ mũi / mắt / tai đúng khoảng cách tới cổ như ảnh đứng (`first`), chỉ đi theo cổ từng khung.
 */
function uprightHead(sample: string, name: string): void {
	const file = join(skeletonDir(sample), `${name}.json`);
	const sk = JSON.parse(readFileSync(file, 'utf8')) as BuiltSkeleton;
	const face = ['NOSE', 'LEFT EYE', 'RIGHT EYE', 'LEFT EAR', 'RIGHT EAR'];
	const at = (kp: Keypoint[], label: string): Keypoint => kp.find((k) => k.label === label)!;
	const n0 = at(sk.first, 'NECK');
	sk.frames = sk.frames.map((f) => {
		const n = at(f.keypoints, 'NECK');
		return { ...f, keypoints: f.keypoints.map((k) => (face.includes(k.label) ? { ...k, x: n.x + at(sk.first, k.label).x - n0.x, y: n.y + at(sk.first, k.label).y - n0.y } : k)) };
	});
	writeFileSync(file, `${JSON.stringify(sk, null, '	')}
`);
	console.log(`✔ skeleton/${name}.json: đầu thẳng như ảnh đứng ở ${sk.frames.length} khung`);
}

/**
 * Khung xương cho class khác cùng khuôn G1 (chặng R): mọi bộ đồ class sửa trên CÙNG ảnh xoay thân nền G1 nên tư thế đứng trùng thân Kiếm sĩ
 * từng pixel — dùng NGUYÊN khung xương đã dựng cho thân Kiếm sĩ (`from`), chỉ đổi ảnh đầu sang ảnh class (`target` = "<món>#<bản>").
 * Đo lại trên ảnh class thì sai: áo khoác dài che hông → hông đo cao hơn 3–4 px, cả khung xương bị kéo lên (dẫm 30/10, Pháp sư).
 */
function retargetSkeleton(sample: string, from: string, name: string, target: string): void {
	const sk = JSON.parse(readFileSync(join(skeletonDir(sample), `${from}.json`), 'utf8')) as BuiltSkeleton;
	const [item, seed] = target.split('#') as [string, string];
	if (!existsSync(join(LAYERED_SOURCES, sample, 'raw', item, `seed-${seed}.png`))) throw new Error(`Chưa có ảnh ${item}/seed-${seed}.png`);
	writeFileSync(join(skeletonDir(sample), `${name}.json`), `${JSON.stringify({ ...sk, character: item, firstImage: `${item}/seed-${seed}.png` }, null, '	')}
`);
	console.log(`✔ skeleton/${name}.json: khung xương ${from} (${sk.frames.length} khung), ảnh đầu ${item}#${seed}`);
}

/**
 * Đòn hướng N dựng từ bảng tư thế S (`mirrorSpecToNorth`) trên khung xương đứng N (`restN` = "<món>#<bản>"), ghi `<tên>.spec.json` +
 * `<tên>.json`. Khung vũ khí trước người và điểm nắm dưới vai: cẳng tay khuất sau thân (khuỷu về hai bên sườn — như `mirrorFollow`).
 */
async function northFromSouth(sample: string, fromSpec: string, name: string, restN: string): Promise<void> {
	const dir = skeletonDir(sample);
	const specS = JSON.parse(readFileSync(join(dir, `${fromSpec}.spec.json`), 'utf8')) as SlashSpec & { character: string; rest?: string; about?: string };
	const restOf = (ref: string): { size: [number, number]; keypoints: Keypoint[] } => {
		const [item, seed] = ref.split('#') as [string, string];
		return JSON.parse(readFileSync(join(dir, `rest-${item}-${seed}.json`), 'utf8'));
	};
	const hipX = (r: { size: [number, number]; keypoints: Keypoint[] }): number => {
		const h = r.keypoints.filter((k) => k.label === 'LEFT HIP' || k.label === 'RIGHT HIP');
		return (h.reduce((n, k) => n + k.x, 0) / h.length) * r.size[0];
	};
	const rs = restOf(specS.rest!);
	const rn = restOf(restN);
	const specN = { ...mirrorSpecToNorth(specS, hipX(rs), hipX(rn)), character: restN.split('#')[0]!, rest: restN, about: `Lật từ ${fromSpec}.spec.json (S → N, đòn dọc trục nhìn — cli north). ${specS.about ?? ''}` };
	writeFileSync(join(dir, `${name}.spec.json`), `${JSON.stringify(specN, null, '\t')}\n`);
	await buildSkeleton(sample, name);
	const built = JSON.parse(readFileSync(join(dir, `${name}.json`), 'utf8')) as BuiltSkeleton;
	const [W, H] = built.size;
	const restAt = (label: string): Keypoint => built.first.find((k) => k.label === label)!;
	const shoulderY = ((restAt('LEFT SHOULDER').y + restAt('RIGHT SHOULDER').y) / 2) * H;
	for (const f of built.frames) {
		if (!f.behind || f.grip[1] < shoulderY) continue;
		f.keypoints = f.keypoints.map((k) => {
			const side = k.label.startsWith('LEFT') ? 'LEFT' : 'RIGHT';
			const inward = (restAt(`${side} SHOULDER`).x < restAt('NECK').x ? 3 : -3) / W;
			if (k.label.endsWith('ELBOW')) return { ...k, x: restAt(k.label).x, y: k.y, depth: 110 };
			if (k.label.endsWith(' ARM')) return { ...k, x: restAt(`${side} ELBOW`).x + inward, y: k.y - 0, depth: 90 };
			return k;
		});
	}
	writeFileSync(join(dir, `${name}.json`), `${JSON.stringify(built, null, '\t')}\n`);
	console.log(`✔ skeleton/${name}: bảng tư thế N lật từ ${fromSpec} (đòn dọc trục nhìn), cẳng tay khuất sau thân ở khung vũ khí trước người`);
}

/** Động tác của thân dùng chung cần vẽ theo (mỗi đầu vẽ lại đúng các khung này). */
const SHARED_MOTIONS: Array<{ anim: string; dir: DirId }> = [
	{ anim: 'walk', dir: 'S' },
	{ anim: 'walk', dir: 'E' },
	{ anim: 'walk', dir: 'N' },
	{ anim: 'run', dir: 'E' },
	{ anim: 'slash', dir: 'E' },
	{ anim: 'slash', dir: 'S' },
];

/**
 * `share <mẫu> <chặng> <món thân> <món nhân vật đầu>`: dựng khung xương vẽ theo thân dùng chung cho mọi động tác (buildFollow) và thêm món
 * animate_with_skeleton_v3 (follows) vào chặng — nhân vật đầu (cùng bộ đồ cơ bản) vẽ lại đúng tư thế từng khung của thân.
 */
async function shareCmd(sample: string, stageId: string, bodyItem: string, target: string, std: LayeredStandard): Promise<void> {
	const planPath = join(LAYERED_SOURCES, sample, 'plan.json');
	const plan = JSON.parse(readFileSync(planPath, 'utf8')) as { stages: Record<string, { items: PlanItem[] }> };
	const all = Object.values(plan.stages).flatMap((st) => st.items);
	const tgt = all.find((i) => i.id === target && i.tool === 'create_character');
	if (!tgt) throw new Error(`${target} không phải món create_character`);
	const stage = plan.stages[stageId];
	if (!stage) throw new Error(`Không có chặng ${stageId}`);
	const female = /female/i.test(String(tgt.prompt));
	let seed = 6000 + all.filter((i) => i.follows).length * 7;
	for (const { anim, dir } of SHARED_MOTIONS) {
		const name = `fol-${target}-${anim}-${dir}`;
		if (!existsSync(join(skeletonDir(sample), `${name}.json`))) await buildFollow(sample, name, bodyItem, anim, dir, target, std);
		const id = `${stageId}-${target}-${anim}-${dir}`;
		if (all.some((i) => i.id === id)) continue;
		const frames = (JSON.parse(readFileSync(join(skeletonDir(sample), `${name}.json`), 'utf8')) as BuiltSkeleton).frames.length;
		stage.items.push({
			id,
			tool: 'animate_with_skeleton_v3',
			character: target,
			animation: anim,
			skeleton: name,
			follows: `${bodyItem}/${anim}`,
			prompt: female ? 'poseBodyFemale' : 'poseBody',
			hair: tgt.hair,
			raceFeatures: tgt.raceFeatures,
			outfit: tgt.outfit,
			args: { action: anim === 'slash' ? 'two-handed overhead chop with empty fists' : anim === 'run' ? 'running' : 'walking', direction: std.directions.find((x) => x.id === dir)!.pixellab, view: std.generation.view, no_background: true, template_id: 'mannequin', seed: (seed += 1) },
			estimate: frames === 15 ? 4 : 3,
			purpose: `Vẽ ${target} ${anim} ${dir} THEO đúng khung xương ${bodyItem} (thân dùng chung) — đầu cắt từng khung gắn lên thân ${bodyItem}`,
		} as PlanItem);
		console.log(`  + ${id}`);
	}
	writeFileSync(planPath, `${JSON.stringify(plan, null, '\t')}\n`);
}

/** 15 đầu nam trên bộ Kiếm sĩ nam H1 (chặng L): Ma tộc 1 (J1) + 13 đầu chặng L — nhân vật thân trần + đầu (xoay 8 hướng); món chưa vẽ bỏ qua. */
function maleSharedHeads(sample: string, std: LayeredStandard): Array<{ id: string; label: string; item: string }> {
	const plan = checkedPlan(sample, std);
	const L = plan.stages.L as (typeof plan.stages)[string] & { heads?: Record<string, { label: string }> };
	const out = [{ id: 'head2', label: 'Ma tộc nam 1 (sừng, 4433)', item: 'J1-tall-head2-char' }];
	for (const [hid, h] of Object.entries(L?.heads ?? {})) out.push({ id: hid, label: h.label, item: `L1-${hid}-bare` });
	return out.filter((h) => existsSync(join(LAYERED_SOURCES, sample, 'raw', h.item, 'metadata.json')));
}

/**
 * Chặng L — ĐÚNG KẾ HOẠCH (chủ dự án 29/10: "1 bộ đủ thao tác rồi ghép đầu"): MỘT bộ Kiếm sĩ nam (H1) đủ thao tác, mỗi đầu chỉ có 8 hướng
 * (tách từ nhân vật thân trần + đầu), đặt tại neo cổ từng khung thân — đầu chỉ dịch theo cổ. Cổ da thuộc thân, đầu cắt tới cằm (neckToBody).
 */
function processL(sample: string, std: LayeredStandard): void {
	const body = tallBodies(sample, std)[0]!;
	const notes: string[] = [];
	const heads: Array<{ id: string; label: string; rot: Record<DirId, Layers> | null }> = [{ id: body.nativeHead, label: 'Nhân tộc nam 1 (tóc đen, 9933) — đầu gốc', rot: null }];
	for (const h of maleSharedHeads(sample, std)) {
		try {
			const layers = headFromCharacter(sample, std, h.item, body.src.bald, notes);
			if (layers) heads.push({ id: h.id, label: h.label, rot: layers.rot });
		} catch (e) {
			notes.push(`Đầu ${h.label}: lỗi tách — ${e instanceof Error ? e.message : String(e)}`);
		}
	}
	const check = (l: Layers, h: Layers): string[] => {
		const holes = seamHoles(l, h, std);
		return holes > Number(std.qa.neckSeamHolesMax) ? [`Q5: hở cổ ${holes} pixel`] : [];
	};
	// Đầu gốc (rot null): đầu cắt từ chính khung; đầu khác: ảnh theo hướng của khung.
	const view = (l: Layers | AttackLayers, h: Layers | null, ms: number, label: string[] = []): ReviewFrame => {
		const a = l as AttackLayers;
		return {
			body: l.body, head: h ? h.head : l.head, hairBack: h ? h.hairBack : l.hairBack, bodyFront: a.bodyFront, weapon: a.weapon, handFront: a.handFront, weaponBehind: a.weaponBehind,
			neck: h ? headAnchorOn(l, h) : l.neck, durationMs: ms, issues: [...label, ...(h ? check(l, h) : [])],
		};
	};
	const clips: ReviewClip[] = [];
	for (const d of ['S', 'E', 'N', 'W', 'SE', 'NE'] as DirId[])
		clips.push({ id: `all-${d}`, label: `${heads.length} ĐẦU NAM trên cùng thân Kiếm sĩ nam — đứng ${d}`, dir: d, loop: true, frames: heads.map((h) => view(body.outRot[d], h.rot ? h.rot[d] : null, 500, [h.label])) });
	clips.push({ id: 'body-only', label: 'Thân Kiếm sĩ nam KHÔNG đầu (cổ da thuộc thân) — 8 hướng', dir: ALL.join(' '), loop: true, frames: ALL.map((d) => ({ body: body.outRot[d].body, head: null, neck: body.outRot[d].neck, durationMs: 500, issues: [d] })) });
	const motions: Array<{ key: string; d: DirId; label: string; frames: Array<Layers | AttackLayers>; ms: (i: number) => number; loop: boolean }> = [];
	for (const anim of ['walk', 'run'] as const) {
		const def = std.animations.find((a) => a.id === anim)!;
		const ms = (i: number): number => def.durationsMs[i % def.durationsMs.length]!;
		for (const d of DRAWN) {
			const cells = clipCells(body.src.outfit!, body.src.outfitDir!, clipNames(sample, std, body.src.outfitId!, anim, d), d, std);
			if (!cells.length) continue;
			const dressed = cells.map((cell) => outfitLayers(cell, body.outRot[d], std, anim, body.outRot[d]));
			const label = anim === 'walk' ? 'Đi' : 'Chạy';
			motions.push({ key: `${anim}_${d}`, d, label: `${label} ${d}`, frames: dressed, ms, loop: true });
			if (d === 'E') motions.push({ key: `${anim}_W`, d: 'W', label: `${label} W`, frames: dressed.map((l) => mirrorLayers(l, 'lật từ E', std)), ms, loop: true });
		}
	}
	const sdef = std.animations.find((a) => a.id === 'slash')!;
	for (const { d, frames } of slashClips(sample, std, body.outRot, body.stage.stage, body.stage.ids.outfit)) {
		const ms = (i: number): number => sdef.durationsMs[i]!;
		motions.push({ key: `slash_${d}`, d, label: `Chém ${d}`, frames, ms, loop: false });
		if (d === 'E') motions.push({ key: 'slash_W', d: 'W', label: 'Chém W', frames: frames.map((a) => mirrorAttack(a, std)), ms, loop: false });
	}
	for (const h of heads)
		for (const m of motions)
			clips.push({ id: `${h.id}-${m.key}`, label: `${m.label} — thân Kiếm sĩ nam + đầu ${h.label}`, dir: m.d, loop: m.loop, frames: m.frames.map((l, i) => view(l, h.rot ? h.rot[m.d] : null, m.ms(i))) });
	const issues = clips.flatMap((c) => c.frames.flatMap((f) => (f.issues ?? []).filter((x) => /^Q/.test(x))));
	notes.unshift(
		issues.length ? `CÓ ${issues.length} cảnh báo QA — xem dưới từng khung.` : 'Không có cảnh báo QA tự động; duyệt bằng mắt: chỗ nối cằm–cổ, sừng / tai / tóc với cổ áo và tay ở 0,5× và 1×.',
		`MỘT bộ Kiếm sĩ nam (H1) đủ thao tác dùng chung cho ${heads.length} đầu nam. Mỗi đầu chỉ có 8 hướng (vẽ 5, lật 3), đặt tại neo cổ từng khung — đầu chỉ dịch theo cổ. CỔ DA THUỘC THÂN, đầu cắt tới cằm (chủ dự án 29/10), nên cổ cử động theo thân và đầu nào cũng nối khít cằm.`,
	);
	const slug = `${sample}-l`;
	const page = writeReview(
		{ id: slug, title: 'Mẫu 1 · chặng L — một bộ Kiếm sĩ nam đội đủ 15 đầu nam (đầu 8 hướng, cổ thuộc thân)', notes, clips, reference: { label: 'npc_silver_youth (chuẩn độ nét)', image: referenceInCell('npc_silver_youth', std) }, mapTile: townGroundPatch(join(LAYERED_SOURCES, sample, 'processed', 'map.png')) ?? undefined },
		join(REVIEW_ROOT, slug),
		std,
	);
	console.log(`✔ trang soi: ${page}\n  link: https://admin.tail024813.ts.net/site/media/layered/${slug}/index.html`);
}


/** `chins <mẫu>`: in neo cổ / neo cằm / độ lệch cằm–cổ của thân Kiếm sĩ nam và từng đầu nam theo hướng (soi chuẩn điểm đặt đầu). */
function printChins(sample: string, std: LayeredStandard): void {
	const body = tallBodies(sample, std)[0]!;
	const fmt = (l: Layers): string => `cổ ${l.neck.join(',')} cằm ${l.chin?.join(',') ?? '-'} lệch ${l.chin ? `${l.chin[0] - l.neck[0]},${l.chin[1] - l.neck[1]}` : '-'} (${l.dir ?? '?'})`;
	for (const d of ['S', 'E', 'N'] as DirId[]) console.log(`thân ${d}: ${fmt(body.outRot[d])}`);
	for (const h of maleSharedHeads(sample, std)) {
		const layers = headFromCharacter(sample, std, h.item, body.src.bald);
		if (!layers) continue;
		console.log(`${h.id.padEnd(10)} ` + (['S', 'E', 'N'] as DirId[]).map((d) => `${d}: ${fmt(layers.rot[d])}`).join(' | '));
	}
}

/**
 * Đầu vẽ trên CÙNG ảnh thân nền trọc từng hướng (chặng P, chủ dự án 30/10 duyệt thử): mỗi hướng S / E / N một ảnh sửa của ảnh xoay G1, đặt vào ô
 * bằng ĐÚNG độ dời của ảnh G1 hướng đó; tách đầu theo đường cổ của thân nền; neo cằm lấy CHUNG từ thân nền (mọi đầu cùng mặt / cằm / cổ nên
 * cùng điểm đặt). W lật từ E. Thiếu ảnh chọn thì trả null.
 */
function headFromBaseEdits(sample: string, std: LayeredStandard, hid: string, picks: Partial<Record<DirId, number>>, baldItem: string): Record<DirId, Layers> | null {
	const bald = new PixelLabSource(join(LAYERED_SOURCES, sample, 'raw', baldItem));
	const out: Partial<Record<DirId, Layers>> = {};
	for (const d of ['S', 'E', 'N'] as DirId[]) {
		const seed = picks[d];
		const file = join(LAYERED_SOURCES, sample, 'raw', `P0-${hid}-${d}`, `seed-${seed}.png`);
		if (!seed || !existsSync(file)) return null;
		const baseImg = bald.rotation(d)!;
		binarizeAlpha(baseImg);
		const off = cellOffset(baseImg, std);
		const baseCell = placeInCell(baseImg, off, std);
		const img = readPng(file);
		binarizeAlpha(img);
		// Ảnh sửa có thể được đệm khác cỡ ảnh xoay: căn giữa về cỡ ảnh xoay rồi dời đúng như ảnh xoay.
		const fit = img.width === baseImg.width && img.height === baseImg.height ? img : padCenter(img, baseImg.width, baseImg.height);
		const cell = placeInCell(fit, off, std);
		const base = splitHaired(baseCell, baseCell, measureNeck(baseCell).neck[1], d, std);
		const l = splitHaired(cell, baseCell, measureNeck(baseCell).neck[1], d, std);
		// Đỉnh cổ chung của khuôn thân nền (cùng hướng): đầu nào sửa trên ảnh này cũng đặt như nhau — khớp đỉnh cổ khuôn với đỉnh cổ thân.
		if (base.neckTop) l.neckTop = [base.neckTop[0] + (l.neck[0] - base.neck[0]), base.neckTop[1] + (l.neck[1] - base.neck[1])];
		l.byNeck = true;
		out[d] = l;
	}
	out.W = mirrorLayers(out.E!, 'lật từ E', std);
	for (const [d, from] of [['SE', 'E'], ['SW', 'W'], ['NE', 'N'], ['NW', 'N']] as const) out[d] = out[from];
	return out as Record<DirId, Layers>;
}

/** Trang soi chặng P: thân Kiếm sĩ nam H1 + đầu gốc + bản CŨ (xoay nhân vật riêng) + bản MỚI (vẽ trên thân nền) của các đầu thử, 4 hướng + động tác. */
function processP(sample: string, std: LayeredStandard): void {
	const plan = checkedPlan(sample, std);
	const P = plan.stages.P as (typeof plan.stages)[string] & { heads?: Record<string, { label: string; picks?: Partial<Record<DirId, number>> }> };
	const body = tallBodies(sample, std)[0]!;
	const notes: string[] = [];
	const heads: Array<{ id: string; label: string; rot: Record<DirId, Layers> | null }> = [{ id: 'head1', label: 'Nhân tộc nam 1 — đầu gốc', rot: null }];
	for (const [hid, h] of Object.entries(P?.heads ?? {})) {
		const old = existsSync(join(LAYERED_SOURCES, sample, 'raw', `L1-${hid}-bare`, 'metadata.json')) ? headFromCharacter(sample, std, `L1-${hid}-bare`, body.src.bald) : null;
		if (old) heads.push({ id: `${hid}-cu`, label: `${h.label} — CŨ (xoay nhân vật riêng)`, rot: old.rot });
		const fresh = h.picks ? headFromBaseEdits(sample, std, hid, h.picks, 'G1-tall-male-ref') : null;
		if (fresh) heads.push({ id: `${hid}-moi`, label: `${h.label} — MỚI (vẽ trên thân nền)`, rot: fresh });
		else notes.push(`${h.label}: chưa chọn bản 3 hướng (stages.P.heads.${hid}.picks).`);
	}
	const view = (l: Layers | AttackLayers, h: Layers | null, ms: number, label: string[] = []): ReviewFrame => {
		const a = l as AttackLayers;
		return { body: l.body, head: h ? h.head : l.head, hairBack: h ? h.hairBack : l.hairBack, bodyFront: a.bodyFront, weapon: a.weapon, handFront: a.handFront, weaponBehind: a.weaponBehind, neck: h ? headAnchorOn(l, h) : l.neck, durationMs: ms, issues: label };
	};
	const clips: ReviewClip[] = [];
	for (const d of ['S', 'E', 'N', 'W'] as DirId[])
		clips.push({ id: `all-${d}`, label: `Đứng ${d} — đầu gốc / đầu thử bản cũ / bản mới`, dir: d, loop: true, frames: heads.map((h) => view(body.outRot[d], h.rot ? h.rot[d] : null, 700, [h.label])) });
	const motions: Array<{ key: string; d: DirId; label: string; frames: Array<Layers | AttackLayers>; ms: (i: number) => number; loop: boolean }> = [];
	for (const anim of ['walk', 'run'] as const) {
		const def = std.animations.find((a) => a.id === anim)!;
		const ms = (i: number): number => def.durationsMs[i % def.durationsMs.length]!;
		for (const d of ['S', 'E', 'N'] as DirId[]) {
			const cells = clipCells(body.src.outfit!, body.src.outfitDir!, clipNames(sample, std, body.src.outfitId!, anim, d), d, std);
			if (!cells.length) continue;
			const dressed = cells.map((cell) => outfitLayers(cell, body.outRot[d], std, anim, body.outRot[d]));
			motions.push({ key: `${anim}_${d}`, d, label: `${anim === 'walk' ? 'Đi' : 'Chạy'} ${d}`, frames: dressed, ms, loop: true });
		}
	}
	const sdef = std.animations.find((a) => a.id === 'slash')!;
	for (const { d, frames } of slashClips(sample, std, body.outRot, body.stage.stage, body.stage.ids.outfit)) motions.push({ key: `slash_${d}`, d, label: `Chém ${d}`, frames, ms: (i) => sdef.durationsMs[i]!, loop: false });
	for (const h of heads)
		for (const m of motions)
			clips.push({ id: `${h.id}-${m.key}`, label: `${m.label} — ${h.label}`, dir: m.d, loop: m.loop, frames: m.frames.map((l, i) => view(l, h.rot ? h.rot[m.d] : null, m.ms(i))) });
	notes.unshift('THỬ vẽ đầu trên CÙNG ảnh thân nền trọc từng hướng (S / E / N; W lật từ E): mọi đầu chung mặt / cằm / cổ nên chung điểm đặt. So bản cũ (xoay nhân vật riêng) với bản mới.');
	const slug = `${sample}-p`;
	const page = writeReview({ id: slug, title: 'Mẫu 1 · chặng P — thử đầu vẽ trên cùng thân nền (2 đầu)', notes, clips, reference: { label: 'npc_silver_youth (chuẩn độ nét)', image: referenceInCell('npc_silver_youth', std) }, mapTile: townGroundPatch(join(LAYERED_SOURCES, sample, 'processed', 'map.png')) ?? undefined }, join(REVIEW_ROOT, slug), std);
	console.log(`✔ trang soi: ${page}\n  link: https://admin.tail024813.ts.net/site/media/layered/${slug}/index.html`);
}

/** Ảnh sửa trên ảnh xoay G1 (món `item`, bản `seed`) đặt vào ô bằng đúng độ dời của ảnh G1 hướng `d` và tách lớp theo cổ của G1. */
function layersOnBase(sample: string, std: LayeredStandard, item: string, seed: number, d: DirId, baldItem = 'G1-tall-male-ref', prep?: (img: RGBAImage) => RGBAImage, fixedNeck = false): Layers {
	const baseImg = new PixelLabSource(join(LAYERED_SOURCES, sample, 'raw', baldItem)).rotation(d)!;
	binarizeAlpha(baseImg);
	const off = cellOffset(baseImg, std);
	const baseCell = placeInCell(baseImg, off, std);
	const raw = readPng(join(LAYERED_SOURCES, sample, 'raw', item, `seed-${seed}.png`));
	binarizeAlpha(raw);
	const img = prep ? prep(raw) : raw;
	const fit = img.width === baseImg.width && img.height === baseImg.height ? img : padCenter(img, baseImg.width, baseImg.height);
	return splitHaired(placeInCell(fit, off, std), baseCell, measureNeck(baseCell).neck[1], d, std, undefined, fixedNeck);
}

/**
 * Chặng Q — MỘT KHUÔN DUY NHẤT (chủ dự án 30/10): thân mặc đồ và mọi đầu đều là ảnh sửa trên CÙNG ảnh xoay thân nền G1 (PixelLab giữ nguyên
 * vị trí hình, chỉ vẽ lại màu / nét — đo: bóng vai / chân trùng 99–100%, lệch ≤ 1px). Ghép = đặt mỗi lớp đúng toạ độ của nó trên ảnh gốc;
 * không đo, không dời theo từng đầu.
 */
function processQ(sample: string, std: LayeredStandard): void {
	const plan = checkedPlan(sample, std);
	const Q = plan.stages.Q as (typeof plan.stages)[string] & { picks?: Record<string, number> };
	const P = plan.stages.P as (typeof plan.stages)[string] & { heads?: Record<string, { label: string; picks?: Partial<Record<DirId, number>> }> };
	const clips: ReviewClip[] = [];
	const notes: string[] = ['THỬ MỘT KHUÔN: thân mặc đồ đầu trọc và đầu Elf / Sói đều sửa trên cùng ảnh xoay G1 hướng E — mỗi lớp giữ đúng toạ độ trên ảnh gốc.'];
	const bodySeed = Q?.picks?.['Q0-outfit-bald-E'];
	if (!bodySeed) throw new Error('Chưa chọn bản thân mặc đồ (stages.Q.picks)');
	const body = layersOnBase(sample, std, 'Q0-outfit-bald-E', bodySeed, 'E');
	const frames: ReviewFrame[] = [{ body: body.body, head: body.head, hairBack: body.hairBack, neck: body.neck, durationMs: 800, issues: ['đầu trọc của chính thân'] }];
	for (const [hid, h] of Object.entries(P?.heads ?? {})) {
		const seed = h.picks?.E;
		if (!seed) continue;
		const head = layersOnBase(sample, std, `P0-${hid}-E`, seed, 'E');
		// Đặt đầu đúng chỗ của nó trên ảnh gốc: neo cổ của chính lớp đầu (cùng khuôn với thân).
		frames.push({ body: body.body, head: head.head, hairBack: head.hairBack, neck: head.neck, durationMs: 800, issues: [h.label, `neo cổ đầu ${head.neck.join(',')} / thân ${body.neck.join(',')}`] });
	}
	clips.push({ id: 'rest-E', label: 'Đứng E — thân mặc đồ (sửa trên G1) + đầu trọc / Elf / Sói (sửa trên G1), mỗi lớp đúng toạ độ ảnh gốc', dir: 'E', loop: true, frames });
	// Động tác vẽ từ chính ảnh thân đầu trọc: mỗi khung tìm đầu trọc (khuôn đầu trọc lúc đứng, gợi ý khớp NECK khung xương, dò tinh ±6),
	// đầu khác đặt dịch đúng bằng quãng đầu trọc đã dịch so với lúc đứng.
	for (const it of (Q?.items ?? []).filter((x) => x.tool === 'animate_with_skeleton_v3' && x.character === 'Q0-outfit-bald-E')) {
		const fdir = join(LAYERED_SOURCES, sample, 'raw', it.id);
		if (!existsSync(join(fdir, 'frame-00.png'))) continue;
		const sk = JSON.parse(readFileSync(join(skeletonDir(sample), `${it.skeleton}.json`), 'utf8')) as BuiltSkeleton;
		const first = readPng(join(fdir, 'first.png'));
		binarizeAlpha(first);
		const off = cellOffset(first, std);
		const neckOf = (f: Keypoint[]): Point => {
			const k = f.find((x) => x.label === 'NECK')!;
			return [k.x * sk.size[0], k.y * sk.size[1]];
		};
		const [rx, ry] = neckOf(sk.first);
		const def = std.animations.find((a) => a.id === it.animation)!;
		const motion = sk.frames.map((f, i) => {
			const img = readPng(join(fdir, `frame-${String(i).padStart(2, '0')}.png`));
			binarizeAlpha(img);
			const [fx, fy] = neckOf(f.keypoints);
			return outfitLayers(placeInCell(img, off, std), body, std, String(it.animation), body, undefined, [Math.round(fx - rx), Math.round(fy - ry)]);
		});
		const heads: Array<[string, Layers | null]> = [['đầu trọc của chính khung', null]];
		for (const [hid, h] of Object.entries(P?.heads ?? {})) if (h.picks?.E) heads.push([h.label, layersOnBase(sample, std, `P0-${hid}-E`, h.picks.E, 'E')]);
		for (const [label, head] of heads)
			clips.push({
				id: `${it.animation}-E-${label}`,
				label: `${it.animation === 'run' ? 'Chạy' : 'Đi'} E — thân vẽ từ ảnh đầu trọc + ${label}`,
				dir: 'E',
				loop: true,
				frames: motion.map((l, i) => {
					if (!head) return { body: l.body, head: l.head, hairBack: l.hairBack, neck: l.neck, durationMs: def.durationsMs[i % def.durationsMs.length]!, issues: [] };
					const at: Point = [head.neck[0] + (l.neck[0] - body.neck[0]), head.neck[1] + (l.neck[1] - body.neck[1])];
					return { body: l.body, head: head.head, hairBack: head.hairBack, neck: at, durationMs: def.durationsMs[i % def.durationsMs.length]!, issues: [`đầu trọc dời ${l.neck[0] - body.neck[0]},${l.neck[1] - body.neck[1]}`] };
				}),
			});
	}
	const slug = `${sample}-q`;
	const page = writeReview({ id: slug, title: 'Mẫu 1 · chặng Q — thử một khuôn duy nhất (hướng E)', notes, clips }, join(REVIEW_ROOT, slug), std);
	console.log(`✔ trang soi: ${page}\n  link: https://admin.tail024813.ts.net/site/media/layered/${slug}/index.html`);
}

/** Một khung thân của khuôn chung + độ dời đầu trọc so với lúc đứng (đầu khác đặt dời đúng bằng quãng này). */
interface MouldFrame {
	l: Layers | AttackLayers;
	shift: Point;
	ms: number;
	hit?: boolean;
	/** Vùng cổ / hàm đầu trọc đã bỏ khỏi thân (`neckOnly`) — đầu phải lấp kín (kiểm hở cổ). */
	removed?: Uint8Array;
	/** Thân của khung TRƯỚC khi cắt cổ — trả lại pixel mép cổ mà không đầu nào che được (`sealMould`). */
	orig?: RGBAImage;
	/** Cẳng tay TRÁI (khuỷu, cổ tay) toạ độ ô — khung xương PixelLab; khiên gắn tay (`carryLayer`). */
	arm?: { elbow: Point; wrist: Point };
}

/**
 * MỘT KHUÔN (chủ dự án 30/10 duyệt "Ok ngon rồi"): thân Kiếm sĩ dùng chung = ảnh mặc đồ sửa trên CHÍNH ảnh xoay thân nền trọc G1 từng hướng
 * S / E / N (đầu trọc), động tác vẽ từ chính các ảnh đó theo tư thế H1; W lật từ E. Mỗi khung: tìm đầu trọc (khuôn đầu trọc lúc đứng, gợi ý khớp
 * NECK khung xương, dò tinh ±6) → độ dời. Mọi đầu cũng sửa trên G1 nên đặt = toạ độ của nó trên ảnh gốc + độ dời đó. Không đo riêng đầu nào.
 */
/**
 * Khuôn class (thân dùng chung một khuôn G1): Kiếm sĩ (chặng Q) và các class nam còn lại (chặng R, chủ dự án 30/10: "làm gói nốt class
 * nam trượng, khiên, cung, thương"). Mỗi khuôn: tiền tố món mặc đồ S / E / N, đòn đánh và vũ khí vẽ riêng; mọi khuôn đội chung 15 đầu nam.
 */
interface MouldSpec {
	key: string;
	label: string;
	stage: string;
	prefix: string;
	attack: string;
	weapon: WeaponDesign;
	/** Khuôn nam (thân nền G1) hay nữ (thân nền thon T3). */
	base: BaseId;
	/**
	 * Bộ đầu đội thân này nếu khác giới thân (mặc định đầu cùng `base`). NGOẠI LỆ DUY NHẤT của luật đầu theo giới (chủ dự án 07/11: bộ đồ ở
	 * nhà Gia viên "dùng luôn bộ Nam cho đỡ tốn lượt, nam nữ chung") — đầu nữ đội thân Nông gia nam; giới xuất của thân = giới đầu.
	 */
	heads?: BaseId;
}

/**
 * Hai khuôn theo giới (đầu nam chỉ đội thân nam, đầu nữ chỉ đội thân nữ): thân nền trọc xoay (mọi bộ đồ / đầu sửa trên chính ảnh xoay đó),
 * chặng chứa đầu (`stages.<chặng>.heads`), đầu trọc mẫu = bộ Kiếm sĩ cùng giới lúc đứng (`baldPrefix` + hướng, bản chọn trong `picks`).
 */
const BASES = {
	male: { gender: 'male', label: 'NAM', rotation: 'G1-tall-male-ref', headStage: 'P', baldStage: 'Q', baldPrefix: 'Q0-outfit-bald-' },
	female: { gender: 'female', label: 'NỮ', rotation: 'T3-female-slim-ref', headStage: 'T', baldStage: 'T', baldPrefix: 'T4-outfit-f-' },
	// Cỡ NPC (chặng U, chủ dự án 04/11: "cùng kích thước với 2 npc tóc trắng, di chuyển 8 hướng") — thân nền nam 11505, cao ~72px.
	npcMale: { gender: 'male', label: 'NAM', rotation: 'U1-npc-male-base-ref', headStage: 'U', baldStage: 'U', baldPrefix: 'U2-sword-outfit-' },
	// Nữ cỡ NPC (04/11): thân nền 15707 (đầu nhỏ ~10% — chủ dự án "đầu nữ hơi to") xoay U13b; đầu nữ ở stages.U.headsFemale.
	npcFemale: { gender: 'female', label: 'NỮ', rotation: 'U13b-npc-female-base-ref', headStage: 'U', baldStage: 'U', baldPrefix: 'U15-sword-outfit-f-', headsKey: 'headsFemale' },
} as const;
/** Khuôn cỡ NPC 8 hướng (nam / nữ). */
const isNpc = (base: BaseId): boolean => base === 'npcMale' || base === 'npcFemale';
type BaseId = keyof typeof BASES;
/** Hướng VẼ của khuôn: cỡ NPC 5 hướng (8 hướng di chuyển), khuôn cũ 3 hướng (game 4 hướng, chốt 30/10). */
const mouldDraw = (base: BaseId): DirId[] => (isNpc(base) ? ['S', 'SE', 'E', 'NE', 'N'] : ['S', 'E', 'N']);
/** Hướng lật gương: W ← E, SW ← SE, NW ← NE (chỉ những hướng có nguồn trong khuôn). */
const MIRROR_OF: Array<[DirId, DirId]> = [['W', 'E'], ['SW', 'SE'], ['NW', 'NE']];
const mouldMirrors = (base: BaseId): Array<[DirId, DirId]> => MIRROR_OF.filter(([, from]) => mouldDraw(base).includes(from));
/** Mọi hướng hiển thị của khuôn (vẽ + lật). */
const mouldDirs = (base: BaseId): DirId[] => [...mouldDraw(base), ...mouldMirrors(base).map(([to]) => to)];
const MOULDS: MouldSpec[] = [
	{ key: 'm', label: 'Kiếm sĩ', stage: 'Q', prefix: 'Q0-outfit-bald-', attack: 'slash', weapon: BASIC_SWORD, base: 'male' },
	{ key: 'm-mage', label: 'Pháp sư', stage: 'R', prefix: 'R0-mage-outfit-', attack: 'cast', weapon: BASIC_STAFF, base: 'male' },
	{ key: 'm-lancer', label: 'Thương thủ', stage: 'R', prefix: 'R0-lancer-outfit-', attack: 'thrust', weapon: BASIC_SPEAR, base: 'male' },
	{ key: 'm-guard', label: 'Hộ vệ (Khiên)', stage: 'R', prefix: 'R0-guard-outfit-', attack: 'bash', weapon: BASIC_SHIELD, base: 'male' },
	{ key: 'm-archer', label: 'Cung thủ', stage: 'R', prefix: 'R0-archer-outfit-', attack: 'shoot', weapon: BASIC_BOW, base: 'male' },
	// Bộ NỮ (chặng T, chủ dự án 31/10): thân nền nữ thon T3; Kiếm sĩ nữ trước, các class nữ sau.
	{ key: 'f', label: 'Kiếm sĩ', stage: 'T', prefix: 'T4-outfit-f-', attack: 'slash', weapon: BASIC_SWORD, base: 'female' },
	// Cỡ NPC 8 hướng (chặng U, 04/11): Kiếm sĩ thiết kế mới; chỉ đứng / đi / chạy — tấn công tạm dừng (chốt 03/11).
	{ key: 'u', label: 'Kiếm sĩ cỡ NPC', stage: 'U', prefix: 'U2-sword-outfit-', attack: 'slash', weapon: BASIC_SWORD, base: 'npcMale' },
	{ key: 'u-mage', label: 'Pháp sư cỡ NPC', stage: 'U', prefix: 'U5-mage-outfit-', attack: 'cast', weapon: BASIC_STAFF, base: 'npcMale' },
	{ key: 'u-lancer', label: 'Thương thủ cỡ NPC', stage: 'U', prefix: 'U5-lancer-outfit-', attack: 'thrust', weapon: BASIC_SPEAR, base: 'npcMale' },
	{ key: 'u-guard', label: 'Khiên thủ cỡ NPC', stage: 'U', prefix: 'U5-guard-outfit-', attack: 'bash', weapon: BASIC_SHIELD, base: 'npcMale' },
	{ key: 'u-archer', label: 'Cung thủ cỡ NPC', stage: 'U', prefix: 'U5-archer-outfit-', attack: 'shoot', weapon: BASIC_BOW, base: 'npcMale' },
	{ key: 'uf', label: 'Kiếm sĩ cỡ NPC', stage: 'U', prefix: 'U15-sword-outfit-f-', attack: 'slash', weapon: BASIC_SWORD, base: 'npcFemale' },
	{ key: 'uf-mage', label: 'Pháp sư cỡ NPC', stage: 'U', prefix: 'U15-mage-outfit-f-', attack: 'cast', weapon: BASIC_STAFF, base: 'npcFemale' },
	{ key: 'uf-lancer', label: 'Thương thủ cỡ NPC', stage: 'U', prefix: 'U15-lancer-outfit-f-', attack: 'thrust', weapon: BASIC_SPEAR, base: 'npcFemale' },
	{ key: 'uf-guard', label: 'Khiên thủ cỡ NPC', stage: 'U', prefix: 'U15-guard-outfit-f-', attack: 'bash', weapon: BASIC_SHIELD, base: 'npcFemale' },
	{ key: 'uf-archer', label: 'Cung thủ cỡ NPC', stage: 'U', prefix: 'U15-archer-outfit-f-', attack: 'shoot', weapon: BASIC_BOW, base: 'npcFemale' },
	// Bộ shop 2 (06/11, chủ dự án chọn bản B: áo khoác đỏ thẫm khuy đồng, giáp vai thép một bên, ủng cao — xịn hơn bộ 1, không mũ).
	{ key: 'u-sword2', label: 'Kiếm sĩ bộ 2 cỡ NPC', stage: 'U', prefix: 'U22-sword2-outfit-', attack: 'slash', weapon: BASIC_SWORD, base: 'npcMale' },
	{ key: 'uf-sword2', label: 'Kiếm sĩ bộ 2 cỡ NPC', stage: 'U', prefix: 'U24-sword2-outfit-f-', attack: 'slash', weapon: BASIC_SWORD, base: 'npcFemale' },
	{ key: 'u-mage2', label: 'Pháp sư bộ 2 cỡ NPC', stage: 'U', prefix: 'U26-mage2-outfit-', attack: 'cast', weapon: BASIC_STAFF, base: 'npcMale' },
	{ key: 'uf-mage2', label: 'Pháp sư bộ 2 cỡ NPC', stage: 'U', prefix: 'U27-mage2-outfit-f-', attack: 'cast', weapon: BASIC_STAFF, base: 'npcFemale' },
	{ key: 'u-lancer2', label: 'Thương thủ bộ 2 cỡ NPC', stage: 'U', prefix: 'U26-lancer2-outfit-', attack: 'thrust', weapon: BASIC_SPEAR, base: 'npcMale' },
	{ key: 'uf-lancer2', label: 'Thương thủ bộ 2 cỡ NPC', stage: 'U', prefix: 'U27-lancer2-outfit-f-', attack: 'thrust', weapon: BASIC_SPEAR, base: 'npcFemale' },
	{ key: 'u-guard2', label: 'Khiên thủ bộ 2 cỡ NPC', stage: 'U', prefix: 'U26-guard2-outfit-', attack: 'bash', weapon: BASIC_SHIELD, base: 'npcMale' },
	{ key: 'uf-guard2', label: 'Khiên thủ bộ 2 cỡ NPC', stage: 'U', prefix: 'U27-guard2-outfit-f-', attack: 'bash', weapon: BASIC_SHIELD, base: 'npcFemale' },
	{ key: 'u-archer2', label: 'Cung thủ bộ 2 cỡ NPC', stage: 'U', prefix: 'U26-archer2-outfit-', attack: 'shoot', weapon: BASIC_BOW, base: 'npcMale' },
	{ key: 'uf-archer2', label: 'Cung thủ bộ 2 cỡ NPC', stage: 'U', prefix: 'U27-archer2-outfit-f-', attack: 'shoot', weapon: BASIC_BOW, base: 'npcFemale' },
	// Gói Gia viên (06/11, kế hoạch home): bộ đồ ở nhà Nông gia nam — động tác cuốc đất (clip `slash` vẽ theo bảng tư thế hoe-farmer1-*),
	// cái cuốc PixelLab vẽ LIỀN THÂN (chủ dự án chọn, cuốc rời vẽ không ra) nên `attack` khác clip → tách lớp như đi / chạy, không vũ khí rời.
	{ key: 'u-farmer1', label: 'Nông gia cỡ NPC', stage: 'U', prefix: 'U30-farmer1-outfit-', attack: 'farm', weapon: BASIC_SWORD, base: 'npcMale' },
	{ key: 'uf-farmer1', label: 'Nông gia cỡ NPC (nữ đội thân nam)', stage: 'U', prefix: 'U30-farmer1-outfit-', attack: 'farm', weapon: BASIC_SWORD, base: 'npcMale', heads: 'npcFemale' },
	// Bộ đồ ở nhà 2 Thợ vườn (07/11, chủ dự án chọn A): cùng thân nam, khung xương động tác chép nguyên bộ Nông gia (cli retarget).
	{ key: 'u-gardener', label: 'Thợ vườn cỡ NPC', stage: 'U', prefix: 'U41-gardener-outfit-', attack: 'farm', weapon: BASIC_SWORD, base: 'npcMale' },
	{ key: 'uf-gardener', label: 'Thợ vườn cỡ NPC (nữ đội thân nam)', stage: 'U', prefix: 'U41-gardener-outfit-', attack: 'farm', weapon: BASIC_SWORD, base: 'npcMale', heads: 'npcFemale' },
	// Thân nền tháo đồ cỡ NPC (06/11, chốt 28/10: nam quần đùi cởi trần, nữ bikini quai qua vai, chân trần): "bộ đồ" là CHÍNH ảnh xoay khuôn
	// U1 / U13b (U20-bare-*), đi / chạy vẽ theo cùng khung xương như các bộ class. Tháo áo VẪN đeo vũ khí class sau lưng (chủ dự án 06/11:
	// "khi tháo áo có hiện") → một thân nền cho mỗi class, cùng khung, khác lớp đeo lưng (`attack` / `weapon` như bộ class đó).
	...(['m', 'f'] as const).flatMap((g) =>
		([['', 'slash', BASIC_SWORD], ['-mage', 'cast', BASIC_STAFF], ['-lancer', 'thrust', BASIC_SPEAR], ['-guard', 'bash', BASIC_SHIELD], ['-archer', 'shoot', BASIC_BOW]] as const).map(
			([k, attack, weapon]): MouldSpec => ({ key: `${g === 'm' ? 'u' : 'uf'}-bare${k}`, label: `Thân nền ${g === 'm' ? 'nam' : 'nữ'} cỡ NPC`, stage: 'U', prefix: `U20-bare-${g}-`, attack, weapon, base: g === 'm' ? 'npcMale' : 'npcFemale' }),
		),
	),
];
const mouldSpec = (key = 'm'): MouldSpec => {
	const m = MOULDS.find((x) => x.key === key);
	if (!m) throw new Error(`Không có khuôn "${key}" (có: ${MOULDS.map((x) => x.key).join(', ')})`);
	return m;
};
/** Khuôn đã chọn đủ ảnh mặc đồ S / E / N. */
function mouldReady(sample: string, std: LayeredStandard, spec: MouldSpec): boolean {
	const st = checkedPlan(sample, std).stages[spec.stage] as { picks?: Record<string, number> } | undefined;
	return (['S', 'E', 'N'] as DirId[]).every((d) => st?.picks?.[`${spec.prefix}${d}`]);
}

function mouldBody(sample: string, std: LayeredStandard, spec: MouldSpec = MOULDS[0]!): { rest: Record<DirId, Layers>; clips: Record<string, MouldFrame[]> } {
	const plan = checkedPlan(sample, std);
	const Q = plan.stages[spec.stage] as (typeof plan.stages)[string] & { picks?: Record<string, number> };
	const rest: Partial<Record<DirId, Layers>> = {};
	const clips: Record<string, MouldFrame[]> = {};
	for (const d of mouldDraw(spec.base)) {
		const seed = Q?.picks?.[`${spec.prefix}${d}`];
		if (!seed) throw new Error(`Chưa chọn thân ${spec.label} mặc đồ hướng ${d} (stages.${spec.stage}.picks)`);
		const r = collarToBody(layersOnBase(sample, std, `${spec.prefix}${d}`, seed, d, BASES[spec.base].rotation, undefined, isNpc(spec.base)), baldHead(sample, std, d, spec.base), std);
		// Cỡ NPC nhìn trước / ngang: xoá vệt viền cằm tụt xuống cổ cả ở dáng đứng (05/11 Cung thủ nữ E).
		if (isNpc(spec.base) && frontNeck(d)) neckLine(r.body, r.neck, mouldNeckCut(std, d), true, -2);
		const cut = neckOnly(r.body, r.neck, mouldNeckCut(std, d));
		rest[d] = { ...r, body: cut.body };
		// Đứng cũng là một khung (bịt hở cổ như khung động tác — bộ đồ class khác cổ áo khác thân Kiếm sĩ).
		clips[`idle_${d}`] = [{ l: rest[d]!, removed: cut.removed, orig: r.body, shift: [0, 0], ms: 500 }];
	}
	for (const [to, from] of mouldMirrors(spec.base)) rest[to] = mirrorLayers(rest[from]!, `lật từ ${from}`, std);
	// Món đã bỏ theo luật mới (đòn hướng S — chủ dự án 30/10: đòn đánh chỉ bắc và ngang) không dựng.
	for (const it of (Q?.items ?? []).filter((x) => x.tool === 'animate_with_skeleton_v3' && String(x.character).startsWith(spec.prefix) && !x.dropped)) {
		const fdir = join(LAYERED_SOURCES, sample, 'raw', it.id);
		if (!existsSync(join(fdir, 'frame-00.png'))) continue;
		const sk = JSON.parse(readFileSync(join(skeletonDir(sample), `${it.skeleton}.json`), 'utf8')) as BuiltSkeleton;
		const d = std.directions.find((x) => x.pixellab === sk.direction)!.id;
		const first = readPng(join(fdir, 'first.png'));
		binarizeAlpha(first);
		const off = cellOffset(first, std);
		const toCell = ([x, y]: readonly number[]): Point => [Math.round(x! + off[0]), Math.round(y! + off[1])];
		const kpOf = (f: Keypoint[], label: string): Point => {
			const k = f.find((x) => x.label === label)!;
			return [k.x * sk.size[0], k.y * sk.size[1]];
		};
		const [rx, ry] = kpOf(sk.first, 'NECK');
		const armOf = (f: Keypoint[]): { elbow: Point; wrist: Point } => ({ elbow: toCell(kpOf(f, 'LEFT ELBOW')), wrist: toCell(kpOf(f, 'LEFT ARM')) });
		// Dáng đứng = ảnh mặc đồ, cũng là ảnh đầu (`first`) của khung xương động tác cùng hướng.
		const idle = clips[`idle_${d}`]?.[0];
		if (idle && !idle.arm) idle.arm = armOf(sk.first);
		const def = std.animations.find((a) => a.id === it.animation)!;
		const r = rest[d]!;
		const frames: MouldFrame[] = sk.frames.map((f, i) => {
			const img = readPng(join(fdir, `frame-${String(i).padStart(2, '0')}.png`));
			binarizeAlpha(img);
			const cell = placeInCell(img, off, std);
			const [fx, fy] = kpOf(f.keypoints, 'NECK');
			const hint: Point = [Math.round(fx - rx), Math.round(fy - ry)];
			const pose={angle:f.bladeDeg,length:f.bladeLen??1,behind:f.behind??false};
			const l =
				it.animation === spec.attack
					? attackLayers(cell, r, toCell(f.grip), [
							{ shoulder: toCell(kpOf(f.keypoints, 'RIGHT SHOULDER')), elbow: toCell(kpOf(f.keypoints, 'RIGHT ELBOW')), wrist: toCell(kpOf(f.keypoints, 'RIGHT ARM')) },
							{ shoulder: toCell(kpOf(f.keypoints, 'LEFT SHOULDER')), elbow: toCell(kpOf(f.keypoints, 'LEFT ELBOW')), wrist: toCell(kpOf(f.keypoints, 'LEFT ARM')) },
						], pose.angle, std, pose.length, pose.behind, hint, true, spec.weapon, f.bow,spec.attack==='slash'||spec.attack==='thrust')
					: ((): Layers => {
							try {
								// Gia viên: dụng cụ vẽ liền thân có thể chạy qua đầu (cần câu dựng đứng — 07/11 câu cá E khung 5 loang đầu theo cần ra
								// ngoài ảnh đầu) → pixel ngoài bóng đầu trọc (nới 3 px) luôn thuộc thân.
								const tool = spec.attack === 'farm' ? headMaskProtect(r.head, [r.neck[0] + hint[0], r.neck[1] + hint[1]], std, 3) : undefined;
								return outfitLayers(cell, r, std, String(it.animation), r, tool, hint);
							} catch (e) {
								throw new Error(`${it.id} khung ${i + 1}: ${(e as Error).message}`);
							}
						})();
			// Đầu đặt theo KHỐI SỌ đầu trọc của khung (khớp sọ), không bù theo cằm. Bản bù cằm (≤ 2 px) bỏ ngày 30/10: từ khi THÂN GIỮ CỔ, KHÔNG
			// GIỮ HÀM chỗ nối là giữa cổ (cổ của đầu ↔ cổ thân), không còn ở cằm; PixelLab vẽ cằm dài / ngắn 1–2 px trong khi sọ đứng yên nên bù cằm
			// chỉ dời đầu lệch khỏi thân — góc cổ áo khoác Pháp sư rơi lên da cổ cạnh cằm (đi S khung 3, chủ dự án "kiểm thử kĩ các khớp đầu").
			// Lỗi cổ chạy ngang trước đó sửa tận gốc bằng khung xương đầu thẳng (`upright`).
			const fix = [0, 0];
			const bh = baldHead(sample, std, d, spec.base);
			const lk = collarToBody(l, { ...bh, neck: [bh.neck[0] + l.neck[0] - r.neck[0], bh.neck[1] + l.neck[1] - r.neck[1]] }, std);
			const scrubbed = scrubBald(lk.body, l.neck, r.head, std);
			// Cỡ NPC: xoá vệt viền cằm đầu trọc PixelLab vẽ tụt xuống cổ ở khung nhún ngay trong ẢNH GỐC khung (cũng là nguồn trả pixel khi bịt cổ).
			if (isNpc(spec.base) && frontNeck(d)) neckLine(scrubbed, l.neck, mouldNeckCut(std, d), true, -2);
			const cutL = neckOnly(scrubbed, l.neck, mouldNeckCut(std, d));
			const lc: Layers & { bodyFront?: RGBAImage } = { ...l, body: cutL.body };
			// Động tác gia viên (cuốc vẽ liền thân): tay / cán cuốc giơ ngang đầu phải vẽ TRÊN đầu — mọi pixel thân cao hơn cổ ≥ 4 px tách sang
			// lớp trước mặt (ghép đầu thật 06/11: nắm tay + cán cuốc khung 4–8 bị tóc che mất). Nhìn sau lưng (N) tay / cán ở phía bên kia đầu
			// → giữ dưới đầu, tóc che đúng.
			if (spec.attack === 'farm' && d !== 'N' && d !== 'NE') lc.bodyFront = liftAboveNeck(lc.body, l.neck[1] - 4);
			const ms = (isNpc(spec.base) && def.durationsMsNpc) || def.durationsMs;
			const action = it.animation === spec.attack || (spec.attack === 'farm' && ['hoe', 'water', 'plant', 'fish'].includes(it.animation ?? ''));
			return { l: lc, arm: armOf(f.keypoints), removed: cutL.removed, orig: scrubbed, shift: [l.neck[0] - r.neck[0] + fix[0]!, l.neck[1] - r.neck[1] + fix[1]!] as Point, ms: ms[i % ms.length]!, hit: action && i + 1 === def.hitFrame };
		});
		clips[`${it.animation}_${d}`] = frames;
	}
	// Hướng tây lật từ hướng đông (đứng + mọi động tác): W ← E, SW ← SE, NW ← NE. Tên clip "<động tác>_<hướng>" — so đúng hậu tố hướng.
	for (const [to, from] of mouldMirrors(spec.base))
	for (const key of Object.keys(clips).filter((k) => k.split('_').pop() === from))
		clips[`${key.slice(0, -from.length)}${to}`] = clips[key]!.map((fr) => {
			const ax = std.cell.root[0];
			const front = (fr.l as { bodyFront?: RGBAImage }).bodyFront;
			// Lớp trước mặt của động tác không vũ khí rời (cuốc gia viên) lật cùng thân.
			const m = 'weapon' in fr.l ? mirrorAttack(fr.l as AttackLayers, std) : { ...mirrorLayers(fr.l, `lật từ ${from}`, std), ...(front ? { bodyFront: mirrorImage(front, ax) } : {}) };
			const W = m.body.width;
			const removed = fr.removed && new Uint8Array(fr.removed.length);
			if (removed && fr.removed) for (let k = 0; k < removed.length; k += 1) if (fr.removed[k]) { const x = 2 * ax - (k % W); if (x >= 0 && x < W) removed[Math.floor(k / W) * W + x] = 1; }
			const mx = ([x, y]: Point): Point => [2 * ax - x, y];
			return { ...fr, l: m, removed, orig: fr.orig && mirrorImage(fr.orig, ax), shift: [-fr.shift[0], fr.shift[1]] as Point, ...(fr.arm ? { arm: { elbow: mx(fr.arm.elbow), wrist: mx(fr.arm.wrist) } } : {}) };
		});
	return { rest: rest as Record<DirId, Layers>, clips };
}

/** Chuyển mọi pixel của `body` ở trên hàng `rowY` sang ảnh mới (lớp vẽ trên đầu); `body` mất các pixel đó. */
function liftAboveNeck(body: RGBAImage, rowY: number): RGBAImage {
	const out = createImage(body.width, body.height);
	for (let y = 0; y < Math.min(rowY, body.height); y += 1)
		for (let x = 0; x < body.width; x += 1) {
			const i = (y * body.width + x) * 4;
			if (!body.data[i + 3]) continue;
			for (let c = 0; c < 4; c += 1) (out.data[i + c] = body.data[i + c]!), (body.data[i + c] = 0);
		}
	return out;
}

/** Đầu sửa trên G1 (chặng P) cho 4 hướng S / E / N / W (W lật từ E); thiếu bản chọn → null. */
/** Hàng trên cùng có pixel và tâm ngang của `rows` hàng đầu tiên (khối đầu). */
function headTop(img: RGBAImage, rows: number): { top: number; cx: number } {
	let top = -1;
	for (let y = 0; y < img.height && top < 0; y += 1) for (let x = 0; x < img.width; x += 1) if (img.data[(y * img.width + x) * 4 + 3]) (top = y), (x = img.width);
	let [x0, x1] = [img.width, -1];
	for (let y = top; y < Math.min(img.height, top + rows); y += 1)
		for (let x = 0; x < img.width; x += 1) if (img.data[(y * img.width + x) * 4 + 3]) (x0 = Math.min(x0, x)), (x1 = Math.max(x1, x));
	return { top, cx: (x0 + x1) / 2 };
}

/**
 * Sừng nhìn sau lưng: PixelLab sửa ảnh gáy trọc không chịu thêm sừng (30/10, Ma tộc nam 1: 2 lượt, 4 bản đều mất sừng). Lấy pixel sừng
 * của bản chính diện (tối ngả lam / trung tính trong 16 hàng trên cùng — tóc và viền tóc ngả đỏ), lật gương quanh tâm đầu, dán lên bản nhìn
 * sau. Hai bản cùng sửa trên ảnh xoay G1 S / N nên đỉnh sọ / tâm đầu lấy từ G1 (không đo trên tóc).
 */
function hornsToBack(front: RGBAImage, gFront: RGBAImage, gBack: RGBAImage): (back: RGBAImage) => RGBAImage {
	return (back) => {
		const out = cloneImage(back);
		const f = headTop(front, 16).top;
		const [a, b] = [headTop(gFront, 10), headTop(gBack, 10)];
		const dy = b.top - a.top;
		for (let y = f; y < Math.min(front.height, f + 16); y += 1)
			for (let x = 0; x < front.width; x += 1) {
				const i = (y * front.width + x) * 4;
				if (!hornColor(front.data, i)) continue;
				const [nx, ny] = [Math.round(a.cx + b.cx - x), y + dy];
				if (nx < 0 || ny < 0 || nx >= out.width || ny >= out.height) continue;
				out.data.set(front.data.subarray(i, i + 4), (ny * out.width + nx) * 4);
			}
		return out;
	};
}

/** Màu sừng tối ngả lam / trung tính (tóc / viền tóc ngả đỏ không lẫn). */
const hornColor = (d: Uint8Array | Uint8ClampedArray, i: number): boolean => d[i + 3] !== 0 && d[i + 2]! >= d[i]! - 4 && d[i]! + d[i + 1]! + d[i + 2]! < 330;

/**
 * Sừng phía xa khi nhìn nghiêng: PixelLab chỉ vẽ một nét mảnh 1 px nên trông thiếu một sừng (chủ dự án 30/10: "thiếu 1 sừng kìa", Ma tộc
 * nam 1 hướng E / W). Chép pixel màu sừng của sừng gần trong `box` (toạ độ ảnh sửa), dời `by`, chỉ vẽ vào chỗ trống hoặc đè nét sừng mảnh
 * cũ — tóc / mặt giữ nguyên nên sừng xa nằm sau đầu.
 */
function farHorn(box: readonly [number, number, number, number], by: readonly [number, number]): (img: RGBAImage) => RGBAImage {
	return (img) => {
		const out = cloneImage(img);
		const [x0, y0, x1, y1] = box;
		for (let y = y0; y < y1; y += 1)
			for (let x = x0; x < x1; x += 1) {
				const i = (y * img.width + x) * 4;
				const [nx, ny] = [x + by[0], y + by[1]];
				if (!hornColor(img.data, i) || nx < 0 || ny < 0 || nx >= img.width || ny >= img.height) continue;
				const j = (ny * img.width + nx) * 4;
				if (!img.data[j + 3] || hornColor(img.data, j)) out.data.set(img.data.subarray(i, i + 4), j);
			}
		return out;
	};
}

/**
 * Sừng thiếu một bên ở ảnh chính diện (Ma tộc nam 3 sừng cừu: PixelLab chỉ vẽ sừng bên phải, bên trái tóc che — 2 bản đều vậy): lật gương
 * pixel sừng (nâu tối ấm + viền tối sát nó) trong `box` quanh cột `axis` (tâm sọ G1), vẽ đè lên tóc — sừng mọc ở thái dương nằm trước tóc.
 */
function mirrorHorn(box: readonly [number, number, number, number], axis: number): (img: RGBAImage) => RGBAImage {
	return (img) => {
		const out = cloneImage(img);
		const [x0, y0, x1, y1] = box;
		const at = (x: number, y: number): number => (y * img.width + x) * 4;
		const horn = (x: number, y: number): boolean => {
			const i = at(x, y);
			const [r, g, b] = [img.data[i]!, img.data[i + 1]!, img.data[i + 2]!];
			return img.data[i + 3] !== 0 && r > b + 6 && r < 120 && r + g + b < 300;
		};
		const dark = (x: number, y: number): boolean => isDark(img.data, at(x, y));
		for (let y = y0; y < y1; y += 1)
			for (let x = x0; x < x1; x += 1) {
				const rim = dark(x, y) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => horn(x + dx!, y + dy!));
				if (!horn(x, y) && !rim) continue;
				const nx = 2 * axis - x;
				if (nx >= 0 && nx < img.width) out.data.set(img.data.subarray(at(x, y), at(x, y) + 4), at(nx, y));
			}
		return out;
	};
}

interface MouldHeadFix {
	/** Lật gương sừng một bên sang bên kia ở hướng S (`mirrorHorn`). */
	mirrorHornS?: { box: [number, number, number, number]; axis: number };
	/** Bản chính diện lấy sừng dán sang bản nhìn sau (`hornsToBack`). */
	hornsFromS?: number;
	/** Dựng sừng xa hướng E (W lật theo): vùng sừng gần + độ dời (`farHorn`). */
	farHornE?: { box: [number, number, number, number]; by: [number, number] };
	/** Tiền tố món sửa đầu (mặc định `P0-<đầu>-`), hướng nối sau. */
	prefix?: string;
	/** Đầu tóc dài: tóc dưới đường cổ tách thành lớp `hairLong` (`longHair`). */
	long?: boolean;
}

function mouldHead(sample: string, std: LayeredStandard, hid: string, picks: Partial<Record<DirId, number>>, fix: MouldHeadFix = {}, base: BaseId = 'male'): Record<DirId, Layers> | null {
	const out: Partial<Record<DirId, Layers>> = {};
	const raw = (item: string, seed: number): RGBAImage => {
		const img = readPng(join(LAYERED_SOURCES, sample, 'raw', item, `seed-${seed}.png`));
		binarizeAlpha(img);
		return img;
	};
	const B = BASES[base];
	const g1 = new PixelLabSource(join(LAYERED_SOURCES, sample, 'raw', B.rotation));
	const item = (d: DirId): string => `${fix.prefix ?? `P0-${hid}-`}${d}`;
	for (const d of mouldDraw(base)) {
		const seed = picks[d];
		if (!seed || !existsSync(join(LAYERED_SOURCES, sample, 'raw', item(d), `seed-${seed}.png`))) return null;
		const prep =
			d === 'N' && fix.hornsFromS
				? hornsToBack(raw(item('S'), fix.hornsFromS), g1.rotation('S')!, g1.rotation('N')!)
				: d === 'E' && fix.farHornE
					? farHorn(fix.farHornE.box, fix.farHornE.by)
					: d === 'S' && fix.mirrorHornS
						? mirrorHorn(fix.mirrorHornS.box, fix.mirrorHornS.axis)
						: undefined;
		// Khuôn nữ: cắt ở đường cổ thân nền (khuôn nam đã soi từng đầu, neo đo trùng thân nền ±1px — giữ nguyên).
		// Cỡ NPC (chặng U, 04/11): cổ chỉ 1–2 hàng, dò "từ vai lên" trên ảnh sửa nhận nhầm vai / cổ áo (hướng N: vai rơi vào lớp đầu) → cắt
		// cố định như khuôn nữ.
		out[d] = layersOnBase(sample, std, item(d), seed, d, B.rotation, prep, base !== 'male');
		const bald = baldHead(sample, std, d, base);
		out[d] = ownNeck(out[d]!, bald.body, bald.neck, mouldNeckCut(std, d), std, isNpc(base));
		if (fix.long) {
			const baseImg = g1.rotation(d)!;
			binarizeAlpha(baseImg);
			out[d] = { ...out[d]!, hairLong: longHair(out[d]!, placeInCell(baseImg, cellOffset(baseImg, std), std), std, isNpc(base)), hairLongFront: d === 'N' || d === 'NE' };
		}
	}
	for (const [to, from] of mouldMirrors(base)) out[to] = mirrorLayers(out[from]!, `lật từ ${from}`, std);
	// Tóc dài lật theo hướng nguồn (W ← E, SW ← SE, NW ← NE); nhìn sau (N, NE, NW) tóc phủ lưng — trên thân (05/11: NE / NW tóc nằm dưới thân thì
	// kiếm đeo lưng đè lên tóc).
	if (fix.long) for (const [to, from] of mouldMirrors(base)) out[to] = { ...out[to]!, hairLong: out[from]!.hairLong ? mirrorImage(out[from]!.hairLong!, LONG_HAIR_ANCHOR[0]) : null, hairLongFront: !!out[from]!.hairLongFront };
	return out as Record<DirId, Layers>;
}

/**
 * Lớp TÓC DÀI của đầu sửa trên thân nền (chủ dự án 31/10 chọn "cho phép tóc dài"): tóc dưới đường cổ nằm ở phần THÂN của ảnh sửa đầu
 * (bị cắt ở neo cổ). So TỪNG VỊ TRÍ với thân nền trọc: pixel ảnh sửa ở chỗ thân nền trống, hoặc khác màu hẳn (> 48 — tóc phủ lưng nhìn
 * sau), là tóc. Lọc theo bảng màu thì hỏng: tóc nâu hạt dẻ trùng màu da tối của thân nền (dẫm 31/10: chỉ còn vài lọn tối, hướng E trống).
 * Chỉ giữ mảng (8 hướng) chạm đáy lớp đầu / dải ngay dưới neo cổ — bỏ chỗ PixelLab tô lại lặt vặt trên thân. Đặt vào canvas
 * `LONG_HAIR_CANVAS` cùng neo cổ.
 */
function longHair(l: Layers, baseCell: RGBAImage, std: LayeredStandard, npc = false): RGBAImage {
	const [ax, ay] = LONG_HAIR_ANCHOR;
	const [hax, hay] = std.head.neckAnchor;
	const out = createImage(LONG_HAIR_CANVAS[0], LONG_HAIR_CANVAS[1]);
	const { body } = l;
	const [W, H] = [body.width, body.height];
	const diff = (i: number): number => Math.abs(baseCell.data[i]! - body.data[i]!) + Math.abs(baseCell.data[i + 1]! - body.data[i + 1]!) + Math.abs(baseCell.data[i + 2]! - body.data[i + 2]!);
	const [ox, oy] = [l.neck[0] - ax, l.neck[1] - ay];
	const inCanvas = (x: number, y: number): boolean => x - ox >= 0 && y - oy >= 0 && x - ox < out.width && y - oy < out.height;
	const cand = new Uint8Array(W * H);
	for (let k = 0; k < W * H; k += 1) {
		const i = k * 4;
		const [x, y] = [k % W, Math.floor(k / W)];
		// Cỡ NPC (05/11, Ma tộc nữ 1 hướng N: PixelLab xê dịch chân trần ở ảnh sửa đầu → chân lọt vào lớp tóc dài, đè lên ủng của bộ đồ): bỏ điểm màu
		// da và mọi thứ dưới hông (tóc tới giữa lưng ≈ 32 hàng dưới neo cổ ở thân ~72px).
		if (npc && (isSkin(body.data, i) || y > l.neck[1] + 32)) continue;
		if (body.data[i + 3] && y >= l.neck[1] - 2 && inCanvas(x, y) && (!baseCell.data[i + 3] || diff(i) > 48)) cand[k] = 1;
	}
	// Da thân bị PixelLab xê dịch 1–2px (dẫm 31/10 tóc dài N: 16 pixel da sáng lưng dưới lọt vào tóc): pixel sáng mà thân nền trong ±3px có
	// đúng màu đó (≤ 6) là thân, không phải tóc. Không xét pixel tối — viền tóc nằm sát viền thân.
	const near = (k: number): boolean => {
		const i = k * 4;
		if (body.data[i]! + body.data[i + 1]! + body.data[i + 2]! < 300) return false;
		const [x, y] = [k % W, Math.floor(k / W)];
		for (let dy = -3; dy <= 3; dy += 1)
			for (let dx = -3; dx <= 3; dx += 1) {
				const [nx, ny] = [x + dx, y + dy];
				if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
				const j = (ny * W + nx) * 4;
				if (baseCell.data[j + 3] && Math.abs(baseCell.data[j]! - body.data[i]!) + Math.abs(baseCell.data[j + 1]! - body.data[i + 1]!) + Math.abs(baseCell.data[j + 2]! - body.data[i + 2]!) <= 6) return true;
			}
		return false;
	};
	for (let k = 0; k < W * H; k += 1) if (cand[k] && near(k)) cand[k] = 0;
	// Hạt giống: ứng viên tới đáy canvas đầu (+1), hoặc sát pixel lớp đầu / tóc sau (tóc nối từ đầu xuống). Đoạn tóc ngay dưới cổ có khi nằm
	// ở lớp tóc sau của canvas đầu (8 hàng dưới neo) → tóc dài bên dưới tưởng rời, bị bỏ (dẫm 31/10 Elf / Ma tộc nữ hướng S: còn 5–8 px).
	const layerAt = (img: RGBAImage | null, x: number, y: number): boolean => {
		const [hx, hy] = [x - l.neck[0] + hax, y - l.neck[1] + hay];
		return !!img && hx >= 0 && hy >= 0 && hx < img.width && hy < img.height && img.data[(hy * img.width + hx) * 4 + 3] !== 0;
	};
	const headAt = (x: number, y: number): boolean => layerAt(l.head, x, y) || layerAt(l.hairBack, x, y);
	const seedBottom = l.neck[1] + std.head.canvas[1] - hay + 1;
	const keep = new Uint8Array(W * H);
	const stack: number[] = [];
	for (let k = 0; k < W * H; k += 1) {
		if (!cand[k]) continue;
		const [x, y] = [k % W, Math.floor(k / W)];
		if (y <= seedBottom || headAt(x, y - 1) || headAt(x - 1, y) || headAt(x + 1, y)) (keep[k] = 1), stack.push(k);
	}
	while (stack.length) {
		const k = stack.pop()!;
		const [x, y] = [k % W, Math.floor(k / W)];
		for (let dy = -1; dy <= 1; dy += 1)
			for (let dx = -1; dx <= 1; dx += 1) {
				const [nx, ny] = [x + dx, y + dy];
				if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
				const n = ny * W + nx;
				if (cand[n] && !keep[n]) (keep[n] = 1), stack.push(n);
			}
	}
	for (let k = 0; k < W * H; k += 1) {
		if (!keep[k]) continue;
		const [hx, hy] = [(k % W) - ox, Math.floor(k / W) - oy];
		out.data.set(body.data.subarray(k * 4, k * 4 + 4), (hy * out.width + hx) * 4);
	}
	return out;
}

/**
 * Dọn mảnh đầu trọc sót trên thân (chủ dự án 30/10: "kiểm thử kĩ các khớp đầu của pháp sư"): PixelLab vẽ đầu trọc trong khung lệch khuôn
 * vài pixel nên mắt (lòng trắng, tròng xanh), má, viền mặt có khi không lọt vào lớp đầu mà nằm lại thân — đầu thật hẹp hơn thì lộ (đi S khung
 * 3: chấm tối cạnh miệng; Thương chạy N: viền sọ / tai thành đường cong quanh đầu). Trong bóng đầu trọc lúc đứng (theo neo cổ của khung,
 * nới 2 px), từ hàng neo − 2 lên: bỏ da và viền rất tối không sát vải; mắt chỉ bỏ trong RUỘT bóng (tròng xanh cùng màu vải áo khoác).
 * Giữ vải — cổ áo dựng, tay áo / găng giơ qua đầu (dẫm 30/10 Pháp sư: nới bóng mà bỏ cả vải thì mất cổ áo).
 */
function scrubBald(body: RGBAImage, neck: Point, baldHead: RGBAImage, std: LayeredStandard): RGBAImage {
	const out = cloneImage(body);
	const [ax, ay] = std.head.neckAnchor;
	const [ox, oy] = [neck[0] - ax, neck[1] - ay];
	const W = body.width;
	const inHead = (x: number, y: number, r: number, all: boolean): boolean => {
		let hit = false;
		for (let dy = -r; dy <= r; dy += 1)
			for (let dx = -r; dx <= r; dx += 1) {
				const [hx, hy] = [x - ox + dx, y - oy + dy];
				const on = hx >= 0 && hy >= 0 && hx < baldHead.width && hy < baldHead.height && baldHead.data[(hy * baldHead.width + hx) * 4 + 3] !== 0;
				if (all && !on) return false;
				if (on) hit = true;
			}
		return hit;
	};
	const at = (x: number, y: number): number => (y * W + x) * 4;
	const sum = (k: number): number => body.data[k]! + body.data[k + 1]! + body.data[k + 2]!;
	// Vải (cổ áo, tay áo, găng): không da, không viền rất tối — giữ.
	const cloth = (x: number, y: number): boolean => {
		if (x < 0 || y < 0 || x >= W || y >= body.height) return false;
		const k = at(x, y);
		return body.data[k + 3] !== 0 && !isSkin(body.data, k) && sum(k) >= 100;
	};
	for (let y = Math.max(0, oy - 2); y < Math.min(body.height, neck[1] - 1); y += 1)
		for (let x = Math.max(0, ox - 2); x < Math.min(W, ox + baldHead.width + 2); x += 1) {
			const i = at(x, y);
			if (!body.data[i + 3] || !inHead(x, y, 2, false)) continue;
			const [r, g, bl] = [body.data[i]!, body.data[i + 1]!, body.data[i + 2]!];
			// Da và viền rất tối không sát vải: sọ / tai / viền mặt trọc (dẫm 30/10 Thương chạy N: viền sọ, tai sót thành đường cong quanh đầu).
			const headish = isSkin(body.data, i) || (sum(i) < 100 && !(cloth(x + 1, y) || cloth(x - 1, y) || cloth(x, y + 1) || cloth(x, y - 1)));
			// Mắt (lòng trắng, tròng xanh) chỉ trong RUỘT bóng đầu — tròng xanh cùng màu vải áo khoác xanh đậm.
			const eye = inHead(x, y, 1, true) && ((r > 200 && g > 200 && bl > 200) || bl > r + 20);
			if (headish || eye) out.data.fill(0, i, i + 4);
		}
	return out;
}

/**
 * Cổ áo cao về thân (chủ dự án 30/10: "vẫn lỗi gãy hình, mất khúc áo, đầu tách quá k liền mạch"): bộ đồ class có cổ áo dựng (áo khoác Pháp
 * sư: vạt cổ lên sát hàm, cổ áo sau gáy cao tới tai) — phần cổ áo trên đường cổ bị cắt theo đầu trọc rồi bỏ cùng đầu trọc. Đầu trọc của khuôn
 * (thân Kiếm sĩ lúc đứng, không cổ áo) là mẫu: pixel lớp đầu KHÔNG phải da mà không có pixel mẫu trong ±1 px, hoặc khác màu mẫu quanh đó
 * hẳn (> 120 — vải áo xanh đè lên da gáy), là cổ áo → trả về thân. Da luôn ở đầu; pixel đầu trọc vẽ lệch mẫu (đầu nghiêng) về thân thì nằm
 * dưới đầu thật nên khuất.
 */
function collarToBody(l: Layers, template: Layers, std: LayeredStandard): Layers {
	const [ax, ay] = std.head.neckAnchor;
	const head = cloneImage(l.head);
	const body = cloneImage(l.body);
	const t = template.head;
	const [dx0, dy0] = [l.neck[0] - template.neck[0], l.neck[1] - template.neck[1]];
	let moved = 0;
	for (let hy = 0; hy < head.height; hy += 1)
		for (let hx = 0; hx < head.width; hx += 1) {
			const i = (hy * head.width + hx) * 4;
			if (!head.data[i + 3] || isSkin(head.data, i)) continue;
			let best = Infinity;
			for (let dy = -1; dy <= 1; dy += 1)
				for (let dx = -1; dx <= 1; dx += 1) {
					const [tx, ty] = [hx + dx0 + dx, hy + dy0 + dy];
					if (tx < 0 || ty < 0 || tx >= t.width || ty >= t.height) continue;
					const j = (ty * t.width + tx) * 4;
					if (!t.data[j + 3]) continue;
					best = Math.min(best, Math.abs(t.data[j]! - head.data[i]!) + Math.abs(t.data[j + 1]! - head.data[i + 1]!) + Math.abs(t.data[j + 2]! - head.data[i + 2]!));
				}
			if (best <= 120) continue;
			const [x, y] = [hx + l.neck[0] - ax, hy + l.neck[1] - ay];
			if (x >= 0 && y >= 0 && x < body.width && y < body.height && !body.data[(y * body.width + x) * 4 + 3]) body.data.set(head.data.subarray(i, i + 4), (y * body.width + x) * 4);
			head.data.fill(0, i, i + 4);
			moved += 1;
		}
	return moved ? { ...l, head, body } : l;
}

/** Số hàng dưới neo cổ bắt đầu giữ cổ thân (chuẩn `body.mouldNeckCut`, W theo E). */
const mouldNeckCut = (std: LayeredStandard, d: DirId): number => {
	// Chéo (8 hướng, chặng U): SE / SW nhìn trước như S, NE / NW nhìn sau như N — trừ khi chuẩn ghi riêng.
	const c = std.body.mouldNeckCut;
	if (d === 'SE' || d === 'SW') return c.SE ?? c.S;
	if (d === 'NE' || d === 'NW') return c.NE ?? c.N;
	return c[d === 'W' ? 'E' : (d as 'S' | 'E' | 'N')];
};

/** Lớp đầu trọc của thân dùng chung lúc đứng hướng `d` (ảnh mặc đồ Q0 sửa trên G1, CHƯA cắt cổ) — mốc cổ / hàm của thân. */
const baldCache = new Map<string, Layers>();
function baldHead(sample: string, std: LayeredStandard, d: DirId, base: BaseId = 'male'): Layers {
	const key = `${sample}/${base}/${d}`;
	if (!baldCache.has(key)) {
		const B = BASES[base];
		const st = checkedPlan(sample, std).stages[B.baldStage] as { picks?: Record<string, number> };
		const seed = st.picks?.[`${B.baldPrefix}${d}`];
		if (!seed) throw new Error(`Chưa chọn bộ Kiếm sĩ ${B.label.toLowerCase()} hướng ${d} (stages.${B.baldStage}.picks.${B.baldPrefix}${d}) — đầu trọc mẫu của khuôn`);
		baldCache.set(key, layersOnBase(sample, std, `${B.baldPrefix}${d}`, seed, d, B.rotation, undefined, isNpc(base)));
	}
	return baldCache.get(key)!;
}

/**
 * THÂN GIỮ CỔ, KHÔNG GIỮ HÀM (chủ dự án 30/10: "cắt là giữ lại cổ thôi giữ hàm làm gì", "ghi chuẩn vào thân giữ cổ k hàm"): thân dùng chung
 * vẽ cùng đầu trọc nên cổ thân còn GÓC VIỀN HÀM và BÓNG HÀM của đầu trọc (S: viền hàm hàng −1, bóng hàm 3 hàng dưới neo). Đầu nào đội
 * lên mà hàm lệch là lộ hai hàm chồng nhau (cấm ghép đè hai đầu). Bỏ khỏi thân mọi da + viền tối sát da quanh cổ (±10 px ngang, từ 14 hàng
 * trên neo) cho tới hàng neo + `body.mouldNeckCut[hướng]` — thân chỉ còn cổ trơn. Trả vùng đã bỏ (để đầu lấp bằng cổ của chính nó).
 */
function neckOnly(body: RGBAImage, neck: Point, cut: number): { body: RGBAImage; removed: Uint8Array } {
	const out = cloneImage(body);
	const removed = new Uint8Array(body.width * body.height);
	const [x0, x1] = [Math.max(0, neck[0] - 10), Math.min(body.width - 1, neck[0] + 10)];
	const [y0, y1] = [Math.max(0, neck[1] - 14), Math.min(body.height, neck[1] + cut)];
	const at = (x: number, y: number): number => (y * body.width + x) * 4;
	const skinAt = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < body.width && y < body.height && isSkin(body.data, at(x, y));
	// Vải áo (không da, không viền): màu xanh đậm áo khoác Pháp sư cũng "tối" (tổng < 200) — chỉ viền RẤT tối (tổng < 100) mới là viền cổ,
	// và viền nằm sát vải áo là viền CỔ ÁO → giữ (chủ dự án 30/10: "mất khúc áo" — vạt cổ áo dựng / cổ áo sau gáy bị cắt mất).
	const cloth = (x: number, y: number): boolean => {
		if (x < 0 || y < 0 || x >= body.width || y >= body.height) return false;
		const k = at(x, y);
		return body.data[k + 3] !== 0 && !isSkin(body.data, k) && body.data[k]! + body.data[k + 1]! + body.data[k + 2]! >= 100;
	};
	const outline = (k: number): boolean => body.data[k]! + body.data[k + 1]! + body.data[k + 2]! < 100;
	for (let y = y0; y < y1; y += 1)
		for (let x = x0; x <= x1; x += 1) {
			const i = at(x, y);
			if (!body.data[i + 3]) continue;
			const nearSkin = skinAt(x + 1, y) || skinAt(x - 1, y) || skinAt(x, y + 1) || skinAt(x, y - 1);
			const nearCloth = cloth(x + 1, y) || cloth(x - 1, y) || cloth(x, y + 1) || cloth(x, y - 1);
			if (isSkin(body.data, i) || (outline(i) && nearSkin && !nearCloth)) {
				out.data.fill(0, i, i + 4);
				removed[y * body.width + x] = 1;
			}
		}
	return { body: out, removed };
}

/**
 * VỆT ĐEN NGANG CỔ (05/11, bộ nữ cỡ NPC chạy S: PixelLab vẽ thừa nét viền cằm / cổ trên thân ở vài khung, nằm NGAY DƯỚI hàng cắt cổ —
 * đè lên cổ của đầu thành vòng tối như vòng cổ; bộ đo hở cổ không bắt vì không phải khe). Từ hàng `from` (mặc định hàng cắt) tới 5 hàng dưới
 * hàng cắt, quanh cột giữa cổ:
 * pixel viền rất tối (tổng < 100) có da ngay dưới (1–2 hàng) và phía trên là da / đã cắt / trong suốt, không sát vải áo → tô màu da bên dưới.
 * Trả số pixel đã sửa (`fix` = false: chỉ đếm — kiểm tự động).
 */
function neckLine(body: RGBAImage, neck: Point, cut: number, fix: boolean, from?: number): number {
	const W = body.width;
	const at = (x: number, y: number): number => (y * W + x) * 4;
	const inside = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < W && y < body.height;
	const skin = (x: number, y: number): boolean => inside(x, y) && body.data[at(x, y) + 3] !== 0 && isSkin(body.data, at(x, y));
	const empty = (x: number, y: number): boolean => !inside(x, y) || body.data[at(x, y) + 3] === 0;
	const dark = (x: number, y: number): boolean => inside(x, y) && body.data[at(x, y) + 3] !== 0 && body.data[at(x, y)]! + body.data[at(x, y) + 1]! + body.data[at(x, y) + 2]! < 100;
	const cloth = (x: number, y: number): boolean => inside(x, y) && body.data[at(x, y) + 3] !== 0 && !isSkin(body.data, at(x, y)) && !dark(x, y);
	let n = 0;
	for (let y = neck[1] + (from ?? cut); y < Math.min(body.height - 2, neck[1] + cut + 5); y += 1)
		for (let x = neck[0] - 4; x <= neck[0] + 4; x += 1) {
			if (!dark(x, y)) continue;
			const below = skin(x, y + 1) ? 1 : skin(x, y + 2) && dark(x, y + 1) ? 2 : 0;
			if (!below || !(skin(x, y - 1) || empty(x, y - 1))) continue;
			if (cloth(x - 1, y) || cloth(x + 1, y)) continue;
			n += 1;
			if (fix) for (let k = 0; k < below; k += 1) body.data.set(body.data.subarray(at(x, y + below), at(x, y + below) + 4), at(x, y + k));
		}
	return n;
}

/**
 * Cổ của CHÍNH đầu này lấp phần thân đã bỏ (`neckOnly`): lấy pixel ảnh sửa của đầu (cùng khuôn G1) trong vùng cổ / hàm đầu trọc đã bỏ khỏi
 * thân + 2 hàng cổ thân ngay dưới chỗ cắt (chồng mép), nới 1 px ngang; đặt vào lớp DƯỚI thân (hairBack) theo neo của đầu. Bóng dưới cằm vì
 * thế luôn khớp hàm của đầu đó; dưới chỗ cắt thân vẽ đè lên nên chỉ lộ phần cổ giữa cằm và chỗ cắt.
 */
function ownNeck(head: Layers, restBody: RGBAImage, restNeck: Point, cut: number, std: LayeredStandard, skinOnly = false): Layers {
	const { removed } = neckOnly(restBody, restNeck, cut);
	const W = restBody.width;
	const mask = new Uint8Array(removed);
	for (let y = restNeck[1] + cut; y < restNeck[1] + cut + 2; y += 1)
		for (let x = restNeck[0] - 10; x <= restNeck[0] + 10; x += 1) {
			const i = (y * W + x) * 4;
			if (x >= 0 && y >= 0 && x < W && y < restBody.height && (isSkin(restBody.data, i) || isDark(restBody.data, i))) mask[y * W + x] = 1;
		}
	const [ax, ay] = std.head.neckAnchor;
	const [cw, ch] = std.head.canvas;
	const back = head.hairBack ? cloneImage(head.hairBack) : createImage(cw, ch);
	const [ox, oy] = [head.neck[0] - ax, head.neck[1] - ay];
	for (let k = 0; k < mask.length; k += 1) {
		const mx = k % W;
		if (!mask[k] && !(mx > 0 && mask[k - 1]) && !(mx < W - 1 && mask[k + 1])) continue;
		const my = Math.floor(k / W);
		const si = (my * W + mx) * 4;
		const [hx, hy] = [mx - ox, my - oy];
		if (!head.full.data[si + 3] || hx < 0 || hy < 0 || hx >= cw || hy >= ch) continue;
		const di = (hy * cw + hx) * 4;
		// Cỡ NPC (05/11): nét tối nằm NGANG giữa hai bên da (quai bikini / viền cổ áo của ảnh sửa đầu) không đưa vào cổ của đầu — khung động tác có lỗ
		// cổ thân sâu hơn thì nét này lộ thành vệt đen ngang cổ (chạy S bộ nữ). Thay bằng da ngay trên; nét mép trái / phải cổ giữ nguyên.
		let src = si;
		if (skinOnly && isDark(head.full.data, si)) {
			const sk = (o: number): boolean => o >= 0 && o < head.full.data.length && head.full.data[o + 3] !== 0 && isSkin(head.full.data, o);
			if (sk(si - 4) && sk(si + 4)) {
				const up = si - W * 4;
				if (!sk(up)) continue;
				src = up;
			}
		}
		if (!back.data[di + 3]) back.data.set(head.full.data.subarray(src, src + 4), di);
	}
	return { ...head, hairBack: back };
}

/** Số pixel vùng đã bỏ khỏi thân của khung `fr` mà đầu `h` (lớp đầu + cổ của đầu) và lớp trước thân không che; `each` nhận từng pixel hở. */
function uncovered(fr: MouldFrame, h: Layers, std: LayeredStandard, each?: (k: number) => void, skinBack = false): number {
	if (!fr.removed) return 0;
	const [hax, hay] = std.head.neckAnchor;
	const at = (img: RGBAImage | null | undefined, x: number, y: number): boolean => !!img && x >= 0 && y >= 0 && x < img.width && y < img.height && img.data[(y * img.width + x) * 4 + 3] !== 0;
	const [nx, ny] = mouldAt(h, fr.shift);
	const a = fr.l as AttackLayers;
	const W = fr.l.body.width;
	let n = 0;
	for (let k = 0; k < fr.removed.length; k += 1) {
		if (!fr.removed[k]) continue;
		const [x, y] = [k % W, Math.floor(k / W)];
		const [hx, hy] = [x - (nx - hax), y - (ny - hay)];
		// `skinBack` (cỡ NPC nhìn trước / ngang, 05/11): lớp sau của đầu chỉ tính là che khi là DA cổ — tóc dài sau gáy lộ qua lỗ cổ thân thành vệt
		// tối ngang cổ (chạy S bộ nữ) chứ không phải che.
		const backOk = at(h.hairBack, hx, hy) && (!skinBack || isSkin(h.hairBack!.data, (hy * h.hairBack!.width + hx) * 4));
		if (at(h.head, hx, hy) || backOk || at(a.bodyFront, x, y) || at(a.handFront, x, y) || at(a.weapon, x, y)) continue;
		n += 1;
		each?.(k);
	}
	return n;
}

/**
 * LỖ KÍN quanh cổ ở ảnh ghép đầu `h` lên khung `fr` (chủ dự án 30/10: "nhớ check kĩ cổ"; dẫm 30/10 Thương đâm E: người đổ tới, cổ áo tụt
 * xuống, dải da cổ lộ ra giữa cằm và cổ áo bị tách theo ĐẦU TRỌC của khung rồi bỏ cùng đầu trọc — cổ của đầu thật lấy theo dáng đứng không
 * lấp tới → lỗ nền 3–4 px giữa cổ, chấm nền ở gáy; `uncovered` chỉ xét vùng `neckOnly` bỏ khỏi thân nên không thấy). Xét dải cổ từ 3 hàng
 * trên neo tới hàng cắt + 1, ±8 px ngang: pixel trống ở ảnh ghép mà có lớp kín cả hai bên ngang (≤ 3 px) và trên / dưới (≤ 4 px), hoặc là
 * KHE giữa hai lớp (sát trên và dưới ≤ 2 px, kín ít nhất một bên ngang) → trả
 * pixel ảnh gốc của khung ở đó (thân trước khi cắt, hoặc đầu trọc của khung): da cổ (mọi tộc chung một màu da nên hợp mọi đầu), viền /
 * vải cổ áo bị tách nhầm theo đầu trọc (dẫm 30/10 Thương đâm E khung 10, chạy E: chấm nền 1 px chỗ cổ gặp cổ áo). Chỉ lỗ KÍN trong dải
 * cổ nên không lộ hàm / má / sọ đầu trọc ra ngoài bóng đầu thật. `each` nhận vị trí + màu.
 */
function neckHoles(fr: MouldFrame, h: Layers, std: LayeredStandard, cut: number, each?: (k: number, rgba: Uint8Array | Uint8ClampedArray) => void): number {
	const [hax, hay] = std.head.neckAnchor;
	const a = fr.l as AttackLayers;
	const [W, H] = [fr.l.body.width, fr.l.body.height];
	const solid = new Uint8Array(W * H);
	for (const img of [fr.l.body, a.bodyFront, a.handFront, a.weapon])
		if (img) for (let k = 0; k < W * H; k += 1) if (img.data[k * 4 + 3]) solid[k] = 1;
	const [nx, ny] = mouldAt(h, fr.shift);
	for (const img of [h.head, h.hairBack])
		if (img)
			for (let hy = 0; hy < img.height; hy += 1)
				for (let hx = 0; hx < img.width; hx += 1) {
					const [x, y] = [hx + nx - hax, hy + ny - hay];
					if (x >= 0 && y >= 0 && x < W && y < H && img.data[(hy * img.width + hx) * 4 + 3]) solid[y * W + x] = 1;
				}
	const on = (x: number, y: number): boolean => x >= 0 && y >= 0 && x < W && y < H && solid[y * W + x] === 1;
	const near = (x: number, y: number, dx: number, dy: number, n: number): boolean => {
		for (let t = 1; t <= n; t += 1) if (on(x + dx * t, y + dy * t)) return true;
		return false;
	};
	// Ảnh gốc của khung: thân trước khi cắt cổ, chỗ trống thì lấy đầu trọc của khung (lớp đầu, rồi lớp sau đầu — dải cổ sau gáy).
	const [bx, by] = [fr.l.neck[0] - hax, fr.l.neck[1] - hay];
	const source = (x: number, y: number): { data: Uint8Array | Uint8ClampedArray; i: number } | null => {
		if (fr.orig && fr.orig.data[(y * W + x) * 4 + 3]) return { data: fr.orig.data, i: (y * W + x) * 4 };
		const [hx, hy] = [x - bx, y - by];
		for (const bald of [fr.l.head, fr.l.hairBack])
			if (bald && hx >= 0 && hy >= 0 && hx < bald.width && hy < bald.height && bald.data[(hy * bald.width + hx) * 4 + 3]) return { data: bald.data, i: (hy * bald.width + hx) * 4 };
		return null;
	};
	const [cx, cy] = fr.l.neck;
	let n = 0;
	for (let y = Math.max(0, cy - 3); y <= Math.min(H - 1, cy + cut + 1); y += 1)
		for (let x = Math.max(0, cx - 8); x <= Math.min(W - 1, cx + 8); x += 1) {
			if (solid[y * W + x]) continue;
			// Lỗ kín bốn phía, hoặc KHE giữa hai lớp (sát trên và dưới ≤ 2 px, kín ít nhất một bên ngang): rãnh 1 px khoét vào mép cổ khi cổ
			// của đầu hẹp hơn cổ đầu trọc (dẫm 30/10 Khiên N: rãnh 4 px ở mép phải gáy, hở ra ngoài nên không "kín bốn phía").
			const sides = [near(x, y, -1, 0, 3), near(x, y, 1, 0, 3)];
			const hole = sides[0] && sides[1] && near(x, y, 0, -1, 4) && near(x, y, 0, 1, 4);
			const slit = near(x, y, 0, -1, 2) && near(x, y, 0, 1, 2) && (sides[0] || sides[1]);
			if (!hole && !slit) continue;
			const src = source(x, y);
			if (!src) continue;
			n += 1;
			each?.(y * W + x, src.data.subarray(src.i, src.i + 4));
		}
	return n;
}

/**
 * CỔ ĐỨT (chủ dự án 31/10: "đầu tóc trắng lỗi cổ kìa", "bảo kiểm soát cổ kỹ vào rồi"): đầu đặt cao hơn cổ thân → cả bề ngang cổ trống, giữa
 * cằm và cổ áo hở một dải nền. `neckHoles` không bắt (không có lớp kẹp hai bên). Dò 3 cột giữa cổ (neo cổ của khung ± 1) từ 2 hàng trên neo
 * tới hàng cắt + 2 trên ảnh ghép đầu `h` (thân, lớp trước, vũ khí, đầu, tóc sau, tóc dài): đếm hàng trống cả 3 cột.
 */
function neckColumnGaps(fr: MouldFrame, h: Layers, std: LayeredStandard, cut: number): number {
	const [hax, hay] = std.head.neckAnchor;
	const a = fr.l as AttackLayers;
	const [W, H] = [fr.l.body.width, fr.l.body.height];
	const [nx, ny] = mouldAt(h, fr.shift);
	const on = (img: RGBAImage | null | undefined, x: number, y: number): boolean => !!img && x >= 0 && y >= 0 && x < img.width && y < img.height && img.data[(y * img.width + x) * 4 + 3] !== 0;
	const solid = (x: number, y: number): boolean =>
		[fr.l.body, a.bodyFront, a.handFront, a.weapon].some((img) => on(img, x, y)) ||
		on(h.head, x - nx + hax, y - ny + hay) ||
		on(h.hairBack, x - nx + hax, y - ny + hay) ||
		on(h.hairLong, x - nx + LONG_HAIR_ANCHOR[0], y - ny + LONG_HAIR_ANCHOR[1]);
	const [cx, cy] = fr.l.neck;
	let rows = 0;
	for (let y = Math.max(0, cy - 2); y <= Math.min(H - 1, cy + cut + 2); y += 1) if (![-1, 0, 1].some((dx) => cx + dx >= 0 && cx + dx < W && solid(cx + dx, y))) rows += 1;
	return rows;
}

/**
 * Bịt hở cổ ở khung động tác: cổ thân trong khung có khi lệch 1–2 px so với cổ của đầu (lấy từ ảnh đứng) nên vài pixel mép cổ đã bỏ không
 * được đầu che → hở nền. Pixel nào KHÔNG được MỌI đầu che thì trả lại thân (pixel mép / viền cổ của chính khung, không phải hàm — hàm nằm
 * trong vùng đầu nào cũng che). Thân dùng chung nên xét cùng lúc mọi đầu đang có.
 */
/** Cỡ NPC: hướng nhìn trước / ngang (gáy không quay về người xem) — cổ phải là da, tóc sau không được lộ qua lỗ cổ. */
const frontNeck = (d: DirId): boolean => !d.includes('N');
function sealMould(body: { clips: Record<string, MouldFrame[]> }, heads: Array<{ rot: Record<DirId, Layers> }>, std: LayeredStandard, npc = false): number {
	let restored = 0;
	for (const [key, frames] of Object.entries(body.clips)) {
		const d = key.split('_')[1] as DirId;
		for (const fr of frames) {
			if (!fr.removed || !fr.orig) continue;
			const back = new Set<number>();
			for (const h of heads) uncovered(fr, h.rot[d], std, (k) => back.add(k), npc && frontNeck(d));
			if (!back.size) continue;
			const b = cloneImage(fr.l.body);
			for (const k of back) {
				b.data.set(fr.orig.data.subarray(k * 4, k * 4 + 4), k * 4);
				fr.removed[k] = 0;
			}
			fr.l = { ...fr.l, body: b };
			restored += back.size;
		}
	}
	// Lỗ kín quanh cổ (`neckHoles`): trả pixel gốc của chính khung về thân — lặp tới khi hết: pixel vừa lấp cho đầu này có thể làm kín lỗ
	// bên cạnh của đầu khác (dẫm 30/10 Khiên N: 3 lượt chưa đủ, còn lỗ 4 px ở gáy). Chỉ lấp trong dải cổ, chỉ chỗ khung gốc có màu nên hữu hạn.
	for (const [key, frames] of Object.entries(body.clips)) {
		const d = key.split('_')[1] as DirId;
		const cut = mouldNeckCut(std, d);
		for (const fr of frames)
			for (let pass = 0; pass < 40; pass += 1) {
				const fill = new Map<number, Uint8Array>();
				for (const h of heads) neckHoles(fr, h.rot[d], std, cut, (k, rgba) => fill.set(k, Uint8Array.from(rgba)));
				if (!fill.size) break;
				const b = cloneImage(fr.l.body);
				for (const [k, rgba] of fill) b.data.set(rgba, k * 4);
				fr.l = { ...fr.l, body: b };
				restored += fill.size;
			}
	}
	return restored;
}

/**
 * VŨ KHÍ ĐEO LƯNG — QUY CHUẨN 3D (khuôn cỡ NPC; chủ dự án 04/11: "các vật phẩm đeo nhìn thật xíu từ 8 góc, hiện thấy thừa thừa, méo mó,
 * không có quy chuẩn"; "kiếm vẽ lộ cả kiếm, không có vỏ"). Mỗi vũ khí MỘT điểm gắn trên lưng trong không gian thân — toạ độ px so với neo cổ:
 * x sang PHẢI nhân vật, y lên trên, z ra SAU lưng — và một hướng (đơn vị). Mỗi hướng nhìn xoay thân quanh trục đứng (S 0°, SE 45°, E 90°,
 * NE 135°, N 180°): ngang màn = −x·cos − z·sin, sâu (về phía người xem) = x·sin − z·cos. Vũ khí dài vẽ theo hình chiếu (co trục khi chĩa
 * về / ra xa người xem — `drawWeapon` length, vẽ lại từ thiết kế, không co ảnh); cả vũ khí một lớp theo hướng nhìn: quay lưng (N, NE,
 * NW) và phần ló ra khi nhìn ngang → lớp vũ khí TRÊN CÙNG, ngoài tóc (chủ dự án 05/11: "nên để vũ khí ngoài tóc đi cho dễ"); mặt trước → sau thân. Hướng tây lật gương cả lớp như thân (dây đeo trên áo cũng lật).
 * Bám neo cổ từng khung nên nhún theo bước. Cùng một điểm gắn cho cả 8 hướng — không chỉnh tay từng hướng.
 */
type V3 = [number, number, number];
const YAW: Partial<Record<DirId, number>> = { S: 0, SE: 45, E: 90, NE: 135, N: 180 };
/**
 * Điểm gắn: kiếm chuôi trên vai TRÁI, lưỡi chéo xuống hông phải — trùng dây chéo lưng của áo (vai phải thì lưỡi cắt chéo dây thành chữ X);
 * Hướng đều chếch ~20° khỏi mặt lưng (z): phần DƯỚI chĩa ra sau — nhìn ngang vũ khí nằm chéo, chuôi / đầu ló trên vai sau gáy, phần dưới
 * ló ra sau lưng như quy ước tranh / game (chủ dự án 04/11: "nhân vật xoay ngang xem nguồn trên mạng để vũ khí ngang như nào vẽ cho giống";
 * bản nằm phẳng trên lưng nhìn ngang dựng đứng như cây gậy).
 * trượng / giáo / cung chéo lưng, đầu nhọn ló NGOÀI vai phải (nghiêng thấp — dựng đứng thì đầu trượng nằm ngang tai như khuyên tai); khiên giữa lưng.
 */
/**
 * `side`: nhìn ngang (E; W lật) — kiếm chỉ vẽ CHUÔI (u < `hilt`) ló từ bả vai; trượng / thương vẽ CẢ CÂY gần dựng đứng ngay sau mép lưng, sau
 * thân (`behind`): thấy đường cán dọc lưng, đầu nhô sau đầu, đuôi tới bắp chân (chủ dự án 05/11: "xấu nhất là hướng ngang của trượng và
 * thương" — bản chỉ ló đầu sau gáy trông như sừng / kẹp tóc) (chủ dự án 04/11: "ngang thì không nên hiện lưỡi kiếm lên trước, quay chuôi ra thôi"). `at` = điểm nắm so với neo cổ trên màn (px, y xuống), `deg` = hướng lưỡi (chúc vào thân).
 */
const BACK_MOUNT: Record<string, { design: WeaponDesign; at: V3; dir: V3; up?: V3; front?: { at: V3; dir: V3 }; side?: { at: Point; deg: number; hilt?: number; tipFrom?: number; stave?: number; behind?: boolean } }> = {
	// Kiếm (chủ dự án 04/11: "ngang thì không nên hiện lưỡi kiếm lên trước, quay chuôi ra thôi; chính diện kiếm cũng không hiện chuôi"):
	// chuôi ngả RA SAU gáy, lưỡi chúc vào thân (z âm) — nhìn ngang chỉ ló chuôi; điểm nắm ra mép vai trái, cao ngang cằm để chính diện ló chuôi.
	// `up`: điểm nắm của bản DỌC nhìn ngang (`carryLayer`; chủ dự án 05/11 "xoay ngang thì để vũ khí sau lưng song song với người") — kiếm
	// chuôi lên ló sau gáy, trượng / thương / cung đầu lên nhô trên đỉnh đầu; z = độ lùi ra sau lưng.
	slash: { design: SWORD_BACK, at: [-9, 1, 4], dir: [0.36, -0.88, -0.32], up: [5, 9, 9], side: { at: [-7, 5], deg: -45, hilt: 2.6 } },
	// `front` (S / SE; SW lật) — chủ dự án 05/11 "vũ khí khi đeo lỗi hết": nhìn trước trượng / thương dựng gần thẳng sau lưng, chỉ ló ĐẦU nhô cao
	// hơn đỉnh đầu (đặt chéo thì đầu trượng / tua thương nằm ngang tai như khuyên tai), đuôi giấu sau chân (không ló cạnh tay như đang cầm).
	cast: { design: STAFF_BACK, at: [-1, -12, 5], dir: [0.62, 0.7, -0.35], up: [4, -4, 9], front: { at: [4, -12, 5], dir: [0.5, 0.87, 0] }, side: { at: [-8, 14], deg: 100, behind: true } },
	thrust: { design: SPEAR_BACK, at: [-2, -13, 5], dir: [0.56, 0.75, -0.35], up: [4, -4, 9], front: { at: [7, -8, 5], dir: [0.55, 0.84, 0] }, side: { at: [-8, 12], deg: 100, behind: true } },
	// Cung nhìn ngang: thân cung chếch lên ra sau lưng, nằm DƯỚI thân — chỉ ló nửa trên ra sau lưng / qua vai.
	shoot: { design: BOW_BACK, at: [0, -11, 5], dir: [0.56, 0.75, -0.35], up: [7, -4, 9], side: { at: [-5, 6], deg: 30, stave: 118, behind: true } },
	bash: { design: SHIELD_BACK, at: [0, -11, 6], dir: [0, 0, 1] },
};
/** Điểm gắn theo hướng: nhìn trước (S, SE, SW) dùng `front` nếu có. */
const mountAt = (mount: (typeof BACK_MOUNT)[string], view: string): { at: V3; dir: V3 } => (mount.front && (view === 'S' || view === 'SE' || view === 'SW') ? mount.front : mount);
/** Vũ khí dài dựng DỌC (bản đeo lưng đồng nhất): kiếm chuôi lên (lưỡi chúc xuống), trượng / thương đầu lên; cung thân dọc, bụng cong ngang. */
const uprightSprite = (design: WeaponDesign): ReturnType<typeof drawWeapon> =>
	design.bow ? drawWeapon(design, 0, 1, false, { staveDeg: 90, arrow: false }) : drawWeapon(design, design.id.startsWith('sword') ? -90 : 90, 1);
/** Thiết kế chỉ phần chuôi (u < `hilt`). */
const hiltOf = (design: WeaponDesign, hilt: number): WeaponDesign => ({ ...design, id: `${design.id}-hilt`, parts: design.parts.filter((p) => p.u1 <= hilt) });
/** Ảnh vũ khí nhìn ngang (cung: cả cây, bụng cung hẹp vì nhìn gần cạnh). */
const sideSprite = (design: WeaponDesign, side: NonNullable<(typeof BACK_MOUNT)[string]['side']>): ReturnType<typeof drawWeapon> =>
	design.bow ? drawWeapon(design, side.deg, 0.4, false, { staveDeg: side.stave, arrow: false }) : drawWeapon(sideOf(design, side), side.deg);
/** Phần thấy được khi nhìn ngang: chuôi kiếm (u < hilt) hoặc đầu trượng / thương (u ≥ tipFrom, đoạn cán dưới bị thân che). */
const sideOf = (design: WeaponDesign, side: { hilt?: number; tipFrom?: number }): WeaponDesign =>
	side.hilt !== undefined ? hiltOf(design, side.hilt) : { ...design, id: `${design.id}-tip`, parts: design.parts.filter((p) => p.u0 >= (side.tipFrom ?? -Infinity)) };
/** Góc chiếu cũ v0 / v45 / v90 (đợt thử U7 04/11 — vũ khí phẳng chỉ phụ thuộc |cos góc xoay|); nay vẽ riêng từng hướng. */
const VIEW_YAW = { v0: 0, v45: 45, v90: 90 } as const;
/** Khung hình học (code dựng) của vũ khí dài ở một góc chiếu: ảnh canvas thiết kế, điểm nắm ở tâm — nguồn cho PixelLab vẽ lại. */
function weaponGuide(attack: string, view: string): RGBAImage {
	const mount = BACK_MOUNT[attack];
	// Theo hướng (chủ dự án 04/11 "phải vẽ đủ 8 hướng"): hướng tây = khung hướng đông lật (thân hướng tây là thân hướng đông lật, dây đeo lật
	// theo) — chỉ KHUNG lật; tranh PixelLab vẽ riêng từng hướng.
	if (view === 'up') return uprightSprite(mount!.design).image;
	const west = MIRROR_OF.find(([to]) => to === view)?.[1];
	if (west) {
		const g = weaponGuide(attack, west);
		return mirrorImage(g, g.width / 2);
	}
	const yaw = (YAW as Record<string, number | undefined>)[view] ?? VIEW_YAW[view as keyof typeof VIEW_YAW];
	if (!mount || yaw === undefined) throw new Error(`Không có khung vũ khí ${attack}/${view}`);
	if (view === 'E' && mount.side) return sideSprite(mount.design, mount.side).image;
	const D = project(mountAt(mount, view).dir, yaw);
	const deg = (Math.atan2(-D.sy, D.sx) * 180) / Math.PI;
	if (mount.design.shield) return drawWeapon(mount.design, (Math.atan2(D.depth, D.sx) * 180) / Math.PI, Math.max(0.3, Math.abs(D.depth)), D.depth < 0).image;
	if (mount.design.bow) {
		const bend = project([-mount.dir[1], mount.dir[0], 0], yaw);
		return drawWeapon(mount.design, (Math.atan2(-bend.sy, bend.sx) * 180) / Math.PI, Math.hypot(bend.sx, bend.sy), false, { staveDeg: deg, arrow: false }).image;
	}
	return drawWeapon(mount.design, deg, Math.max(0.2, Math.hypot(D.sx, D.sy))).image;
}
/**
 * Tranh PixelLab đã chọn cho một hướng (stages.U.picks `U10-<đòn>-<hướng>`: seed, hoặc tên hướng khác để dùng chung) — vẽ inpaint trong
 * hình khung theo MỘT kiếm mẫu (chủ dự án 04/11: "sao nhiều kiếm khác nhau thế, giữ 1 chuẩn thôi"). PixelLab giữ dáng nhưng có khi lệch chỗ vài px → căn lại
 * bằng phép dời nguyên pixel khớp nhiều nhất với khung hình học (điểm nắm về đúng tâm). null = chưa có → dùng khung code.
 */
const artCache = new Map<string, RGBAImage | null>();
function weaponArt(attack: string, view: string): RGBAImage | null {
	// Xem trước hình học bằng khung code (không dùng tranh đã vẽ theo khung cũ): WEAPON_GUIDES_ONLY=<đòn,…>.
	if ((process.env.WEAPON_GUIDES_ONLY ?? '').split(',').includes(attack)) return null;
	const key = `${attack}/${view}`;
	if (!artCache.has(key)) {
		const pick = (checkedPlan('mau-1', loadLayeredStandard()).stages.U as { picks?: Record<string, number | string> }).picks?.[`U10-${attack}-${view}`];
		const id = typeof pick === 'string' ? `U10-${attack}-${pick}` : `U10-${attack}-${view}`;
		const seed = typeof pick === 'string' ? (checkedPlan('mau-1', loadLayeredStandard()).stages.U as { picks?: Record<string, number> }).picks?.[id] : pick;
		const path = join(LAYERED_SOURCES, 'mau-1', 'raw', id, `seed-${seed}.png`);
		let img: RGBAImage | null = null;
		if (seed && existsSync(path)) {
			const raw = readPng(path);
			binarizeAlpha(raw);
			const guide = weaponGuide(attack, typeof pick === 'string' ? pick : view);
			const a = (im: RGBAImage, x: number, y: number): boolean => x >= 0 && y >= 0 && x < im.width && y < im.height && im.data[(y * im.width + x) * 4 + 3] !== 0;
			let best: [number, number, number] = [0, 0, -1];
			for (let dy = -12; dy <= 12; dy += 1)
				for (let dx = -12; dx <= 12; dx += 1) {
					let n = 0;
					for (let y = 0; y < guide.height; y += 1) for (let x = 0; x < guide.width; x += 1) if (a(guide, x, y) && a(raw, x + dx, y + dy)) n += 1;
					if (n > best[2]) best = [dx, dy, n];
				}
			img = createImage(raw.width, raw.height);
			blit(img, raw, -best[0], -best[1]);
		}
		artCache.set(key, img);
	}
	return artCache.get(key)!;
}
const project = (v: V3, yaw: number): { sx: number; sy: number; depth: number } => {
	const [c, s] = [Math.cos((yaw * Math.PI) / 180), Math.sin((yaw * Math.PI) / 180)];
	return { sx: -v[0] * c - v[2] * s, sy: -v[1], depth: v[0] * s - v[2] * c };
};
/**
 * ĐỒNG NHẤT (chủ dự án 05/11: "nên đồng nhất thôi — cung, thương, trượng, kiếm để sau lưng vẽ 1 hình đặt phía sau; sau lưng thì xoay chéo,
 * quay mặt về màn hình thì để xoay chéo dưới lớp ảnh nhân vật. Riêng khiên vẽ 1 mặt rồi luôn gắn tay"). Thay bản vẽ riêng 8 hướng (tranh U10 các hướng khác giữ làm nguồn, không dùng).
 * Vũ khí dài: MỘT tranh chéo lưng — bản nhìn sau lưng `U10-<đòn>-N`. Điểm gắn trên lưng chiếu theo hướng (`BACK_MOUNT.at`), tranh không
 * đổi: quay lưng (N, NE; NW lật) đè lên thân, lớp trên cùng; mặt trước (S, SE; SW lật) lật gương quanh điểm nắm và nằm DƯỚI thân.
 * Nhìn ngang (E; W lật) dùng tranh DỌC `U10-<đòn>-up` sau lưng, song song với người, dưới thân (chủ dự án 05/11: "mọi hướng chéo đúng nhưng
 * khi nhân vật xoay ngang thì để vũ khí sau lưng song song với người"; điểm gắn `BACK_MOUNT.up`). Hướng tây lật cả lớp từ hướng đông như thân.
 * Khiên: MỘT mặt (tranh `U10-bash-N`, mặt có núm) tâm ở cẳng tay trái theo khung xương từng khung; tay trái phía xa (SE, E, NE; tây lật)
 * nằm dưới thân, S / N đè lên thân.
 */
function carryLayer(attack: string, d: DirId, neck: Point, arm: MouldFrame['arm'], std: LayeredStandard): { behind: RGBAImage | null; mid: RGBAImage | null } | null {
	const from = MIRROR_OF.find(([to]) => to === d)?.[1];
	const ax = std.cell.root[0];
	if (from) {
		const mx = ([x, y]: Point): Point => [2 * ax - x, y];
		const m = carryLayer(attack, from, mx(neck), arm && { elbow: mx(arm.elbow), wrist: mx(arm.wrist) }, std);
		return m && { behind: m.behind && mirrorImage(m.behind, ax), mid: m.mid && mirrorImage(m.mid, ax) };
	}
	const mount = BACK_MOUNT[attack];
	const yaw = YAW[d];
	if (!mount || yaw === undefined) return null;
	const img = createImage(std.cell.width, std.cell.height);
	if (mount.design.shield) {
		if (!arm) throw new Error(`Khiên gắn tay: khung ${d} thiếu khung xương tay trái`);
		const face = weaponArt(attack, 'N') ?? weaponGuide(attack, 'N');
		const at: Point = [0.35 * arm.elbow[0] + 0.65 * arm.wrist[0], 0.35 * arm.elbow[1] + 0.65 * arm.wrist[1]];
		blit(img, face, Math.round(at[0] - face.width / 2), Math.round(at[1] - face.height / 2));
		return d === 'S' || d === 'N' ? { behind: null, mid: img } : { behind: img, mid: null };
	}
	const side = d === 'E' && !!mount.up;
	const N = project(mount.dir, 180);
	const deg = (x: number, y: number): number => (Math.atan2(-y, x) * 180) / Math.PI;
	const bend = project([-mount.dir[1], mount.dir[0], 0], 180);
	const sp = side
		? uprightSprite(mount.design)
		: mount.design.bow
			? drawWeapon(mount.design, deg(bend.sx, bend.sy), Math.hypot(bend.sx, bend.sy), false, { staveDeg: deg(N.sx, N.sy), arrow: false })
			: drawWeapon(mount.design, deg(N.sx, N.sy), Math.max(0.2, Math.hypot(N.sx, N.sy)));
	const art = weaponArt(attack, side ? 'up' : 'N') ?? sp.image;
	const back = d.includes('N');
	const P = project(side ? mount.up! : mount.at, yaw);
	const pic = back ? art : mirrorImage(art, sp.grip[0]);
	blit(img, pic, Math.round(neck[0] + P.sx - sp.grip[0]), Math.round(neck[1] + P.sy - sp.grip[1]));
	return back ? { behind: null, mid: img } : { behind: img, mid: null };
}

/** Neo cổ đặt đầu h trên khung thân: toạ độ của đầu trên ảnh gốc + độ dời đầu trọc của khung. */
const mouldAt = (h: Layers, shift: Point): Point => [h.neck[0] + shift[0], h.neck[1] + shift[1]];

/** Danh sách đầu nam một khuôn đã chọn đủ 3 hướng (chặng P). */
function mouldHeads(sample: string, std: LayeredStandard, base: BaseId = 'male'): Array<{ id: string; label: string; rot: Record<DirId, Layers> }> {
	const plan = checkedPlan(sample, std);
	type HeadDefs = Record<string, { label: string; picks?: Partial<Record<DirId, number>> } & MouldHeadFix>;
	const P = plan.stages[BASES[base].headStage] as (typeof plan.stages)[string] & Record<string, HeadDefs | undefined>;
	const key = ('headsKey' in BASES[base] ? (BASES[base] as { headsKey: string }).headsKey : 'heads');
	const out: Array<{ id: string; label: string; rot: Record<DirId, Layers> }> = [];
	for (const [hid, h] of Object.entries(P?.[key] ?? {})) {
		const rot = h.picks ? mouldHead(sample, std, hid, h.picks, h, base) : null;
		if (rot) out.push({ id: hid, label: h.label, rot });
	}
	return out;
}

/**
 * Đầu đội thân của khuôn. Đầu khác giới thân (`spec.heads`, bộ đồ ở nhà nam nữ chung): neo cổ mỗi đầu dời theo độ lệch cổ đầu trọc hai
 * thân nền từng hướng (thân nam − thân nữ; hướng lật đảo dấu ngang) — đầu ngồi đúng cổ thân nam như ngồi trên cổ thân nữ.
 */
function mouldHeadsFor(sample: string, std: LayeredStandard, spec: MouldSpec): ReturnType<typeof mouldHeads> {
	const hb = spec.heads ?? spec.base;
	const heads = mouldHeads(sample, std, hb);
	if (hb === spec.base) return heads;
	const delta = (d: DirId): Point => {
		const from = MIRROR_OF.find(([to]) => to === d)?.[1];
		const src = from ?? d;
		const [a, b] = [baldHead(sample, std, src, spec.base).neck, baldHead(sample, std, src, hb).neck];
		return from ? [-(a[0] - b[0]), a[1] - b[1]] : [a[0] - b[0], a[1] - b[1]];
	};
	return heads.map((h) => ({ ...h, rot: Object.fromEntries(Object.entries(h.rot).map(([d, l]) => { const [dx, dy] = delta(d as DirId); return [d, { ...l, neck: [l.neck[0] + dx, l.neck[1] + dy] as Point }]; })) as Record<DirId, Layers> }));
}

/** Trang soi một khuôn: thân Kiếm sĩ nam dùng chung + mọi đầu nam đã chọn, 4 hướng + đi / chạy / chém. */
function processMould(sample: string, std: LayeredStandard, key = 'm'): void {
	const spec = mouldSpec(key);
	const body = mouldBody(sample, std, spec);
	const heads = mouldHeadsFor(sample, std, spec);
	const sealed = sealMould(body, heads, std, isNpc(spec.base));
	const view = (fr: MouldFrame | { l: Layers; shift: Point; ms: number }, h: Layers | null, label: string[] = [], d?: DirId): ReviewFrame => {
		const a = fr.l as AttackLayers;
		// Cỡ NPC: tấn công tạm dừng, kiếm đeo sau lưng ở mọi khung đứng / đi / chạy.
		const carry = isNpc(spec.base) && d && !a.weapon ? carryLayer(spec.attack, d, fr.l.neck, 'arm' in fr ? fr.arm : undefined, std) : null;
		// Chủ dự án 05/11: "nên để vũ khí ngoài tóc đi cho dễ" — phần không nằm sau thân vẽ TRÊN CÙNG (đè tóc / đầu), không còn lớp giữa.
		if (carry) return { ...view(fr, h, label), weapon: carry.mid ?? carry.behind, weaponBehind: !carry.mid && !!carry.behind };
		return {
			body: fr.l.body, head: h ? h.head : fr.l.head, hairBack: h ? h.hairBack : fr.l.hairBack, hairLong: h?.hairLong ?? null, hairLongFront: h?.hairLongFront, hairLongAnchor: LONG_HAIR_ANCHOR, bodyFront: a.bodyFront, weapon: a.weapon, handFront: a.handFront, weaponBehind: a.weaponBehind,
			neck: h ? mouldAt(h, fr.shift) : fr.l.neck, durationMs: fr.ms, issues: label,
		};
	};
	const clips: ReviewClip[] = [];
	const dirs = mouldDirs(spec.base);
	for (const d of dirs)
		clips.push({ id: `all-${d}`, label: `${heads.length} ĐẦU ${BASES[spec.base].label} trên cùng thân ${spec.label} ${BASES[spec.base].label.toLowerCase()} (một khuôn) — đứng ${d}`, dir: d, loop: true, frames: heads.map((h) => view({ ...body.clips[`idle_${d}`]![0]!, ms: 600 }, h.rot[d], [h.label], d)) });
	clips.push({ id: 'body-bald', label: `Thân ${spec.label} dùng chung — đầu trọc của khuôn (${dirs.length} hướng)`, dir: dirs.join(' '), loop: true, frames: dirs.map((d) => view({ ...body.clips[`idle_${d}`]![0]!, ms: 600 }, null, [d])) });
	const keys = Object.keys(body.clips).filter((k) => !k.startsWith('idle_')).sort();
	const motionLabel = (k: string): string => (k.startsWith('walk') ? 'Đi' : k.startsWith('run') ? 'Chạy' : k.startsWith('cast') ? 'Niệm phép' : k.startsWith('thrust') ? 'Đâm' : k.startsWith('bash') ? 'Húc khiên' : k.startsWith('shoot') ? 'Bắn cung' : 'Chém');
	for (const key of keys)
		clips.push({ id: `bald-${key}`, label: `${key} — thân dùng chung, đầu trọc của khuôn (đối chiếu)`, dir: key.split('_')[1]!, loop: !key.startsWith(spec.attack), frames: body.clips[key]!.map((fr) => view(fr, null)) });
	for (const h of heads)
		for (const key of keys) {
			const d = key.split('_')[1] as DirId;
			const frames = body.clips[key]!;
			clips.push({ id: `${h.id}-${key}`, label: `${motionLabel(key)} ${d} — ${h.label}`, dir: d, loop: !key.startsWith(spec.attack), frames: frames.map((fr) => view(fr, h.rot[d], fr.hit ? ['★ khung chạm'] : [], d)) });
		}
	// Kiểm hở cổ (thân giữ cổ, không giữ hàm): mọi pixel cổ / hàm đầu trọc đã bỏ khỏi thân phải được lớp đầu / cổ của đầu / lớp trước thân che.
	const gaps: string[] = [];
	for (const h of heads)
		for (const key of Object.keys(body.clips).sort()) {
			const d = key.split('_')[1] as DirId;
			const parts = body.clips[key]!.map((fr) => [uncovered(fr, h.rot[d], std, undefined, isNpc(spec.base) && frontNeck(d)), neckHoles(fr, h.rot[d], std, mouldNeckCut(std, d)), neckColumnGaps(fr, h.rot[d], std, mouldNeckCut(std, d)), isNpc(spec.base) && frontNeck(d) ? neckLine(fr.l.body, fr.l.neck, mouldNeckCut(std, d), false) : 0]);
			const per = parts.map((p) => p.reduce((n, v) => n + v, 0));
			const worst = Math.max(0, ...per);
			// Tách loại: chưa che / lỗ kín / cổ đứt / vệt đen ngang cổ.
			const kinds = ['chưa che', 'lỗ kín', 'cổ đứt', 'vệt đen'].filter((_, i) => parts.some((p) => p[i]! > 0)).join(', ');
			if (worst) gaps.push(`${h.id} ${key}: ${per.filter(Boolean).length} khung hở, tối đa ${worst} px (${kinds})`);
		}
	console.log(`  bịt hở cổ: trả lại thân ${sealed} pixel mép cổ / da cổ lỗ kín (không phải đầu nào cũng che)`);
	console.log(gaps.length ? `Hở cổ (vùng bỏ khỏi thân không được đầu che):\n  ${gaps.join('\n  ')}` : '✔ hở cổ: 0 — mọi vùng cổ / hàm đầu trọc bỏ khỏi thân đều được đầu che');
	const notes = [
		`MỘT KHUÔN: thân ${spec.label} nam dùng chung (mặc đồ sửa trên ảnh xoay thân nền trọc G1 S / E / N, W lật từ E; động tác vẽ từ chính ảnh đó theo tư thế H1) và ${heads.length} đầu nam (sửa trên cùng ảnh G1). Đặt đầu = toạ độ trên ảnh gốc + độ dời đầu trọc của khung — không đo riêng đầu nào.`,
		`Động tác có: ${keys.join(', ') || 'chưa có'}.`,
		`Bản thử nhịp02/11: ${spec.attack==='slash'||spec.attack==='thrust'?'hai nhịp nối nhau,25 bước phát từ15 pose gốc (không phải25 hình mới)':'15 pose gốc với nhịp riêng theo class'}. Giữ nguyên pixel người và neo đầu/cổ,1 mốc hit gameplay. Nét/cảm giác vẫn chờ chủ dự án duyệt. Không dùng các bản vẽ GPT chưa khớp style.`,
	];
	// m → mot-khuon, m-x → mot-khuon-x; f → mot-khuon-nu, f-x → mot-khuon-nu-x.
	const [g, cls] = [spec.key.split('-')[0], spec.key.split('-').slice(1).join('-')];
	// u → mot-khuon-npc, u-x → mot-khuon-npc-x (cỡ NPC 8 hướng, chặng U).
	const slug = `${sample}-mot-khuon${g === 'f' ? '-nu' : g === 'u' ? '-npc' : g === 'uf' ? '-npc-nu' : ''}${cls ? `-${cls}` : ''}`;
	const page = writeReview({ id: slug, title: `Mẫu 1 — một khuôn: một bộ ${spec.label} nam đội mọi đầu nam`, notes, clips, reference: { label: 'npc_silver_youth (chuẩn độ nét)', image: referenceInCell('npc_silver_youth', std) }, mapTile: townGroundPatch(join(LAYERED_SOURCES, sample, 'processed', 'map.png')) ?? undefined }, join(REVIEW_ROOT, slug), std);
	console.log(`✔ trang soi: ${page}\n  link: https://admin.tail024813.ts.net/site/media/layered/${slug}/index.html`);
}

async function main(): Promise<void> {
	const [cmd, ...args] = process.argv.slice(2);
	const std = loadLayeredStandard();
	if (cmd === 'plan') return printPlan(args[0] ?? 'mau-1', std);
	if (cmd === 'balance') return void console.log(`Còn ${await remaining(token())} lượt (token #1)`);
	if (cmd === 'run') return run(args[0]!, args[1]!, args[2]!, args.includes('--yes'), std);
	if (cmd === 'process' && args[1] === 'A' && !args[2]) return processA(args[0]!, std);
	if (cmd === 'process' && args[1] === 'E' && !args[2]) return processA(args[0]!, std, 'E');
	if (cmd === 'process' && args[1] === 'G' && !args[2]) return processA(args[0]!, std, 'G');
	if (cmd === 'process' && args[1] === 'B' && !args[2]) return processB(args[0]!, std);
	if (cmd === 'process' && args[1] === 'C' && !args[2]) return processC(args[0]!, std);
	if (cmd === 'process' && args[1] === 'D' && !args[2]) return processD(args[0]!, std);
	if (cmd === 'process' && args[1] === 'F' && !args[2]) return processF(args[0]!, std);
	if (cmd === 'process' && args[1] === 'H' && !args[2]) return processF(args[0]!, std, TALL_MALE_STAGE);
	if (cmd === 'process' && args[1] === 'I' && !args[2]) return processF(args[0]!, std, TALL_FEMALE_STAGE);
	if (cmd === 'process' && args[1] === 'J' && !args[2]) return processJ(args[0]!, std);
	if (cmd === 'process' && args[1] === 'L' && !args[2]) return processL(args[0]!, std);
	if (cmd === 'process' && args[1] === 'P' && !args[2]) return processP(args[0]!, std);
	if (cmd === 'process' && args[1] === 'Q' && !args[2]) return processQ(args[0]!, std);
	if (cmd === 'mould' && args[0]) return processMould(args[0], std, args[1]);
	if (cmd === 'process' && args[1] === 'K' && !args[2]) {
		processF(args[0]!, std, DEMON_FEMALE_STAGE);
		return processF(args[0]!, std, DEMON_MALE_STAGE);
	}
	if (cmd === 'export' && args[0]) return exportUnity(args[0], std);
	if (cmd === 'weapon-guides' && args[0]) {
		// Xem trước khung hình học 8 hướng (không tiêu lượt): raw/_guides/<đòn>-<hướng>.png
		for (const v of ALL) writePng(join(LAYERED_SOURCES, 'mau-1', 'raw', '_guides', `${args[0]}-${v}.png`), weaponGuide(args[0], v));
		return void console.log(`✔ khung ${args[0]} 8 hướng → raw/_guides/`);
	}
	if (cmd === 'chins' && args[0]) return printChins(args[0], std);
	if (cmd === 'share' && args[3]) return shareCmd(args[0]!, args[1]!, args[2]!, args[3], std);
	if (cmd === 'follow' && args[5]) return buildFollow(args[0]!, args[1]!, args[2]!, args[3]!, args[4] as DirId, args[5], std, args.includes('--joints'));
	if (cmd === 'mirror' && args[3]) return mirrorFollow(args[0]!, args[1]!, args[2]!, args[3], args.includes('--away'));
	if (cmd === 'upright' && args[1]) return uprightHead(args[0]!, args[1]);
	if (cmd === 'retarget' && args[3]) return retargetSkeleton(args[0]!, args[1]!, args[2]!, args[3]);
	if (cmd === 'north' && args[3]) return northFromSouth(args[0]!, args[1]!, args[2]!, args[3]);
	if (cmd === 'transfer' && args[3]) return transferSkeleton(args[0]!, args[1]!, args[2]!, args[3]);
	if (cmd === 'process' && args[2]) return processEdit(args[0]!, args[1]!, args[2], std);
	if (cmd === 'estimate' && args.length >= 3) return estimate(args[0]!, args[1]!, args.slice(2), std);
	if (cmd === 'skeleton' && args[1]) return buildSkeleton(args[0]!, args[1]);
	throw new Error('Cách dùng: plan <mẫu> | balance | run <mẫu> <chặng> <món> [--yes] | process <mẫu> A|B|C|D|E|F|G|H|I|J|K|L|P | process <mẫu> <chặng> <món sửa ảnh> | export <mẫu> | mould <mẫu> [m|m-mage|m-lancer|m-guard|m-archer] | share <mẫu> <chặng> <món thân> <món nhân vật đầu> | follow <mẫu> <tên> <món thân> <clip> <hướng> <món nhân vật đích> | mirror <mẫu> <tên> <khung xương S> <món#bản N> [--away] | upright <mẫu> <khung xương> | retarget <mẫu> <khung xương nguồn> <tên mới> <món#bản> | north <mẫu> <bảng tư thế S> <tên N> <món#bản N> | transfer <mẫu> <khung xương nam> <tên mới> <món nữ#bản> | estimate <mẫu> <món nhân vật> <hướng…> | skeleton <mẫu> <tên>');
}

main().catch((e) => {
	console.error(e instanceof Error ? e.message : e);
	process.exitCode = 1;
});

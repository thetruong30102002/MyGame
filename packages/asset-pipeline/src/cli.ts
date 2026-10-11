import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { annotateAtlas } from './atlas/gearAnchors.js';
import { contactSheet, packAtlas } from './atlas/packAtlas.js';
import { describeSecret, loadEnv } from './env.js';
import { decodePng, readPng, writePng } from './image/rgba.js';
import { alignToIdle, eraseRegions, padToLargest, removeForeignObjects, removeThinProtrusions, type EraseRule, type ThinOptions } from './normalize/cleanup.js';
import { flatten, mapFrames, normalizeCharacter, type AnimationFrames } from './normalize/PixelStyleNormalizer.js';
import { applyPalette, buildPalette } from './normalize/palette.js';
import { applyRecolor, type RecolorRule } from './normalize/recolor.js';
import { FreePixelProvider } from './providers/FreePixelProvider.js';
import { PIXLER_LICENSE, PixlerProvider } from './providers/PixlerProvider.js';
import { flipX, MIRROR_OF, PixlerSession, reviewStrip } from './pixler/session.js';
import { SpriteLabProvider } from './providers/SpriteLabProvider.js';
import { downloadPixelLab, PixelLabSource, PL_DIR } from './pixellab/source.js';
import { PixelLabMcp, type McpToolResult } from './pixellab/mcp.js';
import { unzip } from './pixellab/zip.js';
import { DIRECTIONS, type AnimationName, type CharacterAssetProvider, type CharacterIdentity, type Direction } from './providers/types.js';
import { runQualityGate, type QualityGateOptions, type VisualReview } from './quality/QualityGate.js';
import type { WorldIndex } from './maps/human/index.js';
import { regionBuild } from './maps/regions.js';
import { renderOverview, writeMinimap } from './maps/overview.js';
import { addOutline, downscaleMode, extractDecals, loadFreePixelImage, packShelf, propIssues, propMeta, trim, type PropMeta } from './props/buildProps.js';
import { PIXELLAB_PREFIX } from './props/humanKingdom.js';
import { keyMagenta, loadSheetCell, parseSheetPath, sheetPreview } from './props/sheet.js';
import { buildSkillIcons, buildSkillIconsV2 } from './props/skillIcons.js';
import { filledSlice, measureHollow, UI_ASSETS, type NineSlice } from './props/uiAssets.js';
import { buildVfxFrames, VFX } from './vfx/buildVfx.js';
import {
	ANIMATE_PIXEL_LIMIT,
	animateImageCost,
	defaultCanvas,
	drawnSize,
	extractJobId,
	extractPngUrls,
	FIRST_FIXED_COST,
	FIRST_TOOL,
	firstArgs,
	firstCanvasError,
	isSessionError,
	isTransientError,
	loadPixelLabVfx,
	padCenter,
	parseBalance,
	parseVfxFlags,
	PIXELLAB_VFX_PRESETS,
	type FirstModel,
	type PendingVfx,
	type PixelLabVfxMeta,
} from './vfx/pixellabVfx.js';
import { blit, createImage, crop, fill, opaqueBounds, scaleNearest, type RGBAImage } from './image/rgba.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const CACHE = join(ROOT, '.asset-cache');
// Đầu ra pipeline (`assets/` ở gốc repo — máy chủ đọc map, Unity nhập hình). Dựng THỬ thì trỏ `AETHER_ASSETS` ra thư mục nháp: máy
// chủ thật đọc map từ đây ngay lúc chạy.
const WEB_ASSETS = process.env.AETHER_ASSETS ? resolve(process.env.AETHER_ASSETS) : join(ROOT, 'assets');
const REPORTS = join(ROOT, 'packages/asset-pipeline/reports');

interface CharacterSpec {
	identity: CharacterIdentity;
	displayName: string;
	role: 'player' | 'npc' | 'monster' | 'boss';
	provider: 'freepixel' | 'pixler' | 'spritelab' | 'pixellab';
	/** PixelLab: animation của game → tên animation trong gói tải về (`sources/pixellab/<id>/metadata.json`). */
	pixellab?: {
		/** Danh sách = thứ tự ưu tiên theo TỪNG hướng (vd ["walk-b", "walk"]: hướng nào có bản vẽ lại thì dùng bản đó). */
		animations: Partial<Record<AnimationName, string | string[]>>;
		mirrorWest?: boolean;
		/**
		 * Hướng có frame động tác bị LOẠI khi duyệt (vd mất ba lô) → coi như chưa có, dùng frame tạm từ ảnh xoay.
		 * Khoá là animation của game (loại mọi tên) hoặc tên PixelLab (`"attack-sword": ["E"]` → E rơi về tên kế).
		 */
		reject?: Partial<Record<string, Direction[]>>;
		/** Động tác = động tác khác phát NGƯỢC (vd `{ "revive": "death" }`: đứng dậy = gục quay ngược) — 0 lượt vẽ. */
		reverse?: Partial<Record<AnimationName, AnimationName>>;
		/** Khung bị LOẠI khi duyệt (PixelLab vẽ lạc): `{ "thrust": { "E": [2, 3] } }` — số thứ tự khung trong gói tải về. */
		drop?: Partial<Record<AnimationName, Partial<Record<Direction, number[]>>>>;
	};
	sourceRef?: string;
	prompt?: string;
	frameSize: { width: number; height: number };
	/** Cỡ ảnh yêu cầu Pixler sinh (khác canvas game: trẻ con sinh nhỏ hơn rồi đặt vào canvas chung). */
	generateSize?: { width: number; height: number };
	baselineY: number;
	/**
	 * `optional`: động tác một lần (attack, cast) — chưa vẽ thì KHÔNG có trong atlas (không dựng frame tạm),
	 * mỗi hướng qua cổng riêng (trượt chỉ bỏ hướng đó, không làm hỏng nhân vật). `durationMs`: độ dài cả động tác,
	 * fps suy theo số frame thật. `hitFrame`: frame tung đòn (sát thương/đạn ra ở đây), bỏ trống = game tự chọn.
	 */
	animations: Partial<Record<AnimationName, { fps: number; minFrames: number; maxFrames: number; optional?: boolean; durationMs?: number; hitFrame?: number }>>;
	/**
	 * `removeThin`: gỡ vật cầm tay mảnh (que, gậy) để thân tay không — vũ khí là lớp riêng. Toạ độ theo ẢNH NGUỒN.
	 * `keepThinIn`: animation THẬT SỰ cầm vũ khí, không gỡ (mặc định `["attack"]` — kiếm gỗ là chủ ý). `cast` là
	 * "empty hands" nên vẫn gỡ: PixelLab animate từ ảnh xoay còn que, không gỡ thì que hiện ra lúc niệm phép.
	 */
	cleanup?: { removeForeignObjects?: boolean; erase?: EraseRule[]; removeThin?: ThinOptions; keepThinIn?: AnimationName[]; alignToIdle?: boolean };
	recolor?: RecolorRule[];
	/** Ép mọi frame về một bảng màu chung `size` màu (ảnh sinh AI dùng 240–256 màu). */
	paletteLock?: { size: number };
	/** `weaponAnims`: động tác có vũ khí đã duyệt bằng mắt, kèm lý do (xem `QualityGateOptions.weaponAnims`). */
	quality?: {
		allowForeign?: QualityGateOptions['allowForeign'];
		maxHeightDrift?: number;
		weaponAnims?: { animations: AnimationName[]; reason: string };
		/** Ngưỡng lệch chiều cao RIÊNG cho động tác cố ý đổi dáng (ngồi thụp + lao, gục, nhảy) — chỉ cổng tầng 2 (động tác tuỳ chọn). */
		driftAnims?: Partial<Record<AnimationName, number>>;
		/** Tỉ lệ chiều cao bóng tối thiểu so với ô (mặc định 0,45) — quái nhỏ trong ô nới cho khung v3. */
		minSilhouette?: number;
	};
	review?: VisualReview;
	/** Bộ hướng của nhân vật (mặc định 8). */
	directions?: Direction[];
	/** Hướng tạm dùng ảnh tĩnh trong lúc chờ quota sinh animation. */
	provisional?: Direction[];
	notes?: string;
}

const PIXLER_SOURCES = join(ROOT, 'packages/asset-pipeline/sources/pixler');
const PIXELLAB_SOURCES = join(ROOT, 'packages/asset-pipeline/sources/pixellab');
const VFX_PIXELLAB_SOURCES = join(PIXELLAB_SOURCES, 'vfx');

function pixlerApi(): PixlerProvider {
	const env = loadEnv(ROOT);
	return new PixlerProvider(env.PIXELER_API_KEY, env.PIXELER_API_BASE);
}

function loadSpec(idOrPath: string): CharacterSpec {
	const p = idOrPath.endsWith('.json') ? resolve(idOrPath) : join(ROOT, 'packages/asset-pipeline/src/specs', `${idOrPath}.json`);
	return JSON.parse(readFileSync(p, 'utf8')) as CharacterSpec;
}

/** Animation tuỳ chọn (động tác một lần) của spec. */
function optionalAnims(spec: CharacterSpec): Set<AnimationName> {
	return new Set((Object.entries(spec.animations) as [AnimationName, { optional?: boolean }][]).filter(([, v]) => v.optional).map(([a]) => a));
}

/** Tách frame theo nhóm animation (không chép ảnh). */
function pickAnims(frames: AnimationFrames, keep: (anim: AnimationName) => boolean): AnimationFrames {
	return Object.fromEntries((Object.entries(frames) as [AnimationName, AnimationFrames[AnimationName]][]).filter(([a]) => keep(a)));
}

/** Frame thô theo spec. Pixler: CHỈ đọc từ đĩa (đã lưu ở các bước `pixler ...`), không gọi API ở đây. */
async function loadRawFrames(spec: CharacterSpec): Promise<{ raw: AnimationFrames; license: unknown; source: string }> {
	const optional = optionalAnims(spec);
	if (spec.provider === 'pixellab') {
		const anims = Object.keys(spec.animations) as AnimationName[];
		const src = new PixelLabSource(join(PIXELLAB_SOURCES, spec.identity.characterId));
		const map = spec.pixellab?.animations ?? {};
		const reverse = spec.pixellab?.reverse ?? {};
		const raw = src.frames(Object.fromEntries(anims.filter((a) => !reverse[a]).map((a) => [a, map[a] ?? a])), spec.provisional ?? [], spec.pixellab?.mirrorWest, spec.pixellab?.reject, optional);
		// Loại khung theo danh sách duyệt TRƯỚC khi lật phía tây / phát ngược — hướng tây là bản lật nên phải loại cùng số.
		for (const [anim, byDir] of Object.entries(spec.pixellab?.drop ?? {}) as [AnimationName, Partial<Record<Direction, number[]>>][]) {
			for (const [dir, idx] of Object.entries(byDir) as [Direction, number[]][]) {
				const mirror = ({ E: 'W', SE: 'SW', NE: 'NW' } as Partial<Record<Direction, Direction>>)[dir];
				for (const d of spec.pixellab?.mirrorWest && mirror ? [dir, mirror] : [dir]) {
					const list = raw[anim]?.[d];
					if (list) raw[anim]![d] = list.filter((_, i) => !idx.includes(i));
				}
			}
		}
		for (const [anim, from] of Object.entries(reverse) as [AnimationName, AnimationName][]) {
			const dirs = raw[from];
			if (dirs) raw[anim] = Object.fromEntries(Object.entries(dirs).map(([d, list]) => [d, [...(list ?? [])].reverse()]));
		}
		return {
			raw,
			license: { name: 'PixelLab Terms of Service', url: 'https://pixellab.ai/termsofservice', commercialUse: true, attributionRequired: false },
			source: `pixellab:${src.state.character.id}`,
		};
	}
	// Nguồn khác chưa có động tác một lần: bỏ hẳn animation tuỳ chọn, giữ nguyên hành vi cũ.
	const anims = (Object.keys(spec.animations) as AnimationName[]).filter((a) => !optional.has(a));
	if (spec.provider === 'pixler') {
		const session = new PixlerSession(PIXLER_SOURCES, spec.identity.characterId, pixlerApi());
		return { raw: session.frames(anims, spec.provisional), license: PIXLER_LICENSE, source: `pixler:${session.state.base?.jobId ?? '(chưa sinh)'}` };
	}
	const env = loadEnv(ROOT);
	const provider: CharacterAssetProvider = spec.provider === 'freepixel' ? new FreePixelProvider(join(CACHE, 'freepixel')) : new SpriteLabProvider(env.SPRITELAB_API_KEY);
	const raw: AnimationFrames = {};
	let license: unknown;
	for (const anim of anims) {
		const asset = await provider.generateAnimation({ identity: spec.identity, sourceRef: spec.sourceRef, animation: anim, directions: DIRECTIONS });
		raw[anim] = asset.frames;
		license = asset.license;
	}
	return { raw, license, source: `${provider.name}:${spec.sourceRef ?? ''}` };
}

async function buildCharacter(specPath: string): Promise<boolean> {
	const spec = loadSpec(specPath);
	const id = spec.identity.characterId;
	const loaded = await loadRawFrames(spec);
	const { license, source } = loaded;
	let raw = loaded.raw;
	console.log(`▶ ${id} ← ${source}`);
	const optional = optionalAnims(spec);
	const isBase = (a: AnimationName) => !optional.has(a);
	// Gỡ que TRƯỚC khi chuẩn hoá: que thò xuống dưới bàn chân sẽ làm sai đường chân (nhân vật lơ lửng).
	// Chỉ chừa animation cầm vũ khí thật (`keepThinIn`, mặc định attack — gỡ như que là mất kiếm gỗ).
	if (spec.cleanup?.removeThin) {
		const keep = new Set<AnimationName>(spec.cleanup.keepThinIn ?? ['attack']);
		const r = removeThinProtrusions(pickAnims(raw, (a) => !keep.has(a)), spec.cleanup.removeThin);
		raw = { ...r.frames, ...pickAnims(raw, (a) => keep.has(a)) };
		console.log(`  gỡ vật cầm tay mảnh: xoá ${r.removedPixels} px (chừa: ${[...keep].join(', ') || 'không'})`);
	}
	const padded = padToLargest(raw);
	if (padded.size) {
		raw = padded.frames;
		console.log(`  đệm mọi khung về ${padded.size.width}×${padded.size.height} (động tác v3 có canvas nới rộng)`);
	}
	if (spec.cleanup?.alignToIdle) {
		const r = alignToIdle(raw);
		raw = r.frames;
		const moved = Object.entries(r.shifts).filter(([, [dx, dy]]) => dx || dy);
		console.log(`  căn động tác theo ảnh đứng: ${moved.length ? moved.map(([k, [dx, dy]]) => `${k} (${dx},${dy})`).join(', ') : 'không lệch'}`);
	}

	const { frames: normalized, report: norm } = normalizeCharacter(raw, { canvas: spec.frameSize, baselineY: spec.baselineY });
	console.log(`  chuẩn hoá: scale gốc ×${norm.detectedScale}, baseline nguồn y=${norm.sourceBaseline}, offset (${norm.offset.x},${norm.offset.y}), sửa ${norm.semiAlphaFixed} px bán trong suốt`);

	const reportDir = join(REPORTS, id);
	mkdirSync(reportDir, { recursive: true });
	const before = runQualityGate(id, pickAnims(normalized, isBase), gateOptions(spec));
	writePng(join(reportDir, 'contact-0-source.png'), contactSheet(normalized));

	let cleaned = normalized;
	if (spec.cleanup?.removeForeignObjects) {
		const r = removeForeignObjects(normalized);
		cleaned = r.frames;
		console.log(`  dọn vật lạ: ${before.foreignClusters.length} cụm phát hiện, xoá ${r.removedPixels} px`);
	}
	if (spec.cleanup?.erase?.length) {
		const r = eraseRegions(cleaned, spec.cleanup.erase);
		cleaned = r.frames;
		console.log(`  xoá theo vùng đã duyệt: ${spec.cleanup.erase.length} luật, ${r.removedPixels} px`);
	}
	let final = spec.recolor?.length ? mapFrames(cleaned, (img) => applyRecolor(img, spec.recolor!)) : cleaned;
	if (spec.paletteLock) {
		const palette = buildPalette(flatten(final), spec.paletteLock.size);
		final = mapFrames(final, (img) => applyPalette(img, palette));
		console.log(`  khoá bảng màu: ${palette.length} màu dùng chung cho mọi frame`);
	}
	writePng(join(reportDir, 'contact-1-final.png'), contactSheet(final));

	// Tầng 1 (quyết định xuất hay gỡ, y như trước): CHỈ animation bắt buộc. Tầng 2: từng hướng của động tác
	// tuỳ chọn qua cổng riêng — trượt chỉ bỏ hướng đó, không bao giờ làm hỏng cả nhân vật.
	const report = runQualityGate(id, pickAnims(final, isBase), gateOptions(spec));
	const extra = gateOptional(id, final, spec);
	final = { ...pickAnims(final, isBase), ...extra.frames };
	// Không có động tác nào thì không thêm khoá: báo cáo của nhân vật chưa vẽ động tác giữ nguyên từng byte.
	const optionalReport = extra.results.length ? { optional: extra.results } : {};
	writeFileSync(join(reportDir, 'quality.json'), JSON.stringify({ before: summary(before), after: report, ...optionalReport }, null, '\t'));
	for (const c of report.checks) console.log(`  ${c.status === 'pass' ? '✔' : c.status === 'manual' ? '◎' : '✘'} ${c.label} — ${c.detail}`);

	if (!report.passed) {
		const pendingOnly = report.checks.every((c) => c.status === 'pass' || c.id === 'anatomy') && !spec.review;
		console.log(
			pendingOnly
				? `◎ ${id} qua cổng tự động, CHỜ DUYỆT BẰNG MẮT (thêm "review" vào spec) — chưa xuất. Xem ${reportDir}`
				: `✘ ${id} KHÔNG qua cổng chất lượng — không xuất vào game. Xem ${reportDir}`,
		);
		// Chờ duyệt thì GIỮ bản đang chạy trong game (bản cũ đã qua cổng): gỡ ra là quái/NPC biến mất
		// khỏi game suốt lúc chờ người duyệt. Chỉ hỏng thật mới gỡ.
		if (!pendingOnly) unpublish(id);
		return false;
	}

	const outDir = join(WEB_ASSETS, 'characters', id);
	const { image, json } = packAtlas(final, `${id}.png`, spec.baselineY, 2, `${id}/`);
	// Neo đồ gắn (đỉnh đầu, tâm đầu, vai, hai tay) cho TỪNG khung — chỉ người chơi mặc đồ nên chỉ tính cho role player.
	if (spec.role === 'player') console.log(`  neo đồ gắn: ${annotateAtlas(json, image)} khung`);
	writePng(join(outDir, `${id}.png`), image);
	writeFileSync(join(outDir, `${id}.json`), JSON.stringify(json));
	writeFileSync(join(outDir, 'quality.json'), JSON.stringify({ checks: report.checks, stats: report.stats, ...optionalReport }, null, '	'));
	const portrait = facePortrait(final);
	if (portrait) writePng(join(WEB_ASSETS, 'portraits', `${id}.png`), portrait);
	updateManifest(spec, license, bodyHeight(final, spec.baselineY), portrait ? `portraits/${id}.png` : null, final);
	console.log(`✔ ${id} → ${outDir} (atlas ${image.width}×${image.height})`);
	return true;
}

/**
 * Chân dung khung thoại: cắt vuông quanh đầu ở frame đứng hướng S, phóng 3 lần (giữ lưới pixel). Đầu chibi
 * chiếm ~55% trên của hình nên lấy tâm ngang theo phần đó, cạnh vuông ~2/3 chiều cao hình.
 */
function facePortrait(frames: AnimationFrames): RGBAImage | null {
	const img = frames.idle?.S?.[0];
	const b = img ? opaqueBounds(img) : null;
	if (!img || !b) return null;
	const h = b.y1 - b.y0;
	const headRows = Math.round(h * 0.55);
	let x0 = img.width;
	let x1 = 0;
	for (let y = b.y0; y < b.y0 + headRows; y += 1) {
		for (let x = 0; x < img.width; x += 1) {
			if (img.data[(y * img.width + x) * 4 + 3]! === 0) continue;
			x0 = Math.min(x0, x);
			x1 = Math.max(x1, x + 1);
		}
	}
	const side = Math.max(30, Math.min(48, Math.round(h * 0.66)));
	const left = Math.round((x0 + x1) / 2 - side / 2);
	const top = Math.max(0, b.y0 - 2);
	const square = createImage(side, side);
	blit(square, crop(img, Math.max(0, left), top, Math.min(side, img.width - Math.max(0, left)), Math.min(side, img.height - top)), Math.max(0, -left), 0);
	return scaleNearest(square, 3);
}

/** Chiều cao hình (chân → đỉnh đầu) lớn nhất trong các frame idle: game treo tên, tính tâm bắn phép theo số này. */
function bodyHeight(frames: AnimationFrames, baselineY: number): number {
	let top = baselineY;
	for (const imgs of Object.values(frames.idle ?? {})) for (const img of imgs ?? []) top = Math.min(top, opaqueBounds(img)?.y0 ?? top);
	return baselineY - top;
}

function gateOptions(spec: CharacterSpec): QualityGateOptions {
	return {
		canvas: spec.frameSize,
		allowForeign: spec.quality?.allowForeign,
		maxHeightDrift: spec.quality?.maxHeightDrift,
		minSilhouette: spec.quality?.minSilhouette,
		// Quái có hạt / khí bay quanh thân khai cả idle / walk ở đây (đã duyệt bằng mắt) — người chơi chỉ khai động tác vũ khí.
		weaponAnims: spec.quality?.weaponAnims?.animations,
		review: spec.review,
		directions: spec.directions,
		provisional: spec.provisional,
		requiredAnimations: Object.fromEntries(Object.entries(spec.animations).filter(([, v]) => !v.optional).map(([a, v]) => [a, { minFrames: v.minFrames, maxFrames: v.maxFrames }])),
	};
}

/**
 * Cổng tầng 2 cho động tác tuỳ chọn: mỗi (động tác, hướng) kiểm riêng cùng bộ idle làm mốc so màu/chiều cao.
 * Trượt thì bỏ hướng đó (game dùng phương án dự phòng). Hướng phía tây lật gương từ phía đông nên kiểm tự
 * khắc ra cùng kết quả (mọi phép kiểm đối xứng trái–phải). Duyệt bằng mắt KHÔNG tính ở đây: xem contact
 * sheet + CharacterLab rồi khai `pixellab.reject` / `hitFrame` trong spec.
 */
function gateOptional(id: string, frames: AnimationFrames, spec: CharacterSpec): { frames: AnimationFrames; results: { animation: AnimationName; direction: Direction; frames: number; passed: boolean; failed: string[] }[] } {
	const out: AnimationFrames = {};
	const results: { animation: AnimationName; direction: Direction; frames: number; passed: boolean; failed: string[] }[] = [];
	for (const anim of optionalAnims(spec)) {
		const dirs = frames[anim];
		const range = spec.animations[anim]!;
		if (!dirs) continue;
		const kept: Partial<Record<Direction, RGBAImage[]>> = {};
		for (const [dir, list] of Object.entries(dirs) as [Direction, RGBAImage[]][]) {
			const r = runQualityGate(id, { idle: frames.idle ?? {}, [anim]: { [dir]: list } }, {
				canvas: spec.frameSize,
				allowForeign: spec.quality?.allowForeign,
				maxHeightDrift: spec.quality?.driftAnims?.[anim] ?? spec.quality?.maxHeightDrift,
				minSilhouette: spec.quality?.minSilhouette,
				weaponAnims: spec.quality?.weaponAnims?.animations,
				directions: [dir],
				provisional: [],
				requiredAnimations: { [anim]: { minFrames: range.minFrames, maxFrames: range.maxFrames } },
			});
			const failed = r.checks.filter((c) => c.status === 'fail').map((c) => `${c.id}: ${c.detail}`);
			if (!failed.length) kept[dir] = list;
			results.push({ animation: anim, direction: dir, frames: list.length, passed: !failed.length, failed });
			console.log(failed.length ? `  ✘ loại ${anim}/${dir}: ${failed.join('; ')}` : `  ✔ ${anim}/${dir}: ${list.length} frame`);
		}
		if (Object.keys(kept).length) out[anim] = kept;
	}
	return { frames: out, results };
}

function summary(r: ReturnType<typeof runQualityGate>) {
	return { passed: r.passed, failed: r.checks.filter((c) => c.status === 'fail').map((c) => `${c.id}: ${c.detail}`) };
}

/** Gỡ bản đã xuất trước đó (nếu có) để thư mục game không giữ asset đã bị loại. */
function unpublish(id: string): void {
	const outDir = join(WEB_ASSETS, 'characters', id);
	if (existsSync(outDir)) rmSync(outDir, { recursive: true });
	const path = join(WEB_ASSETS, 'manifest.json');
	if (!existsSync(path)) return;
	const manifest = JSON.parse(readFileSync(path, 'utf8'));
	if (!manifest.characters[id]) return;
	delete manifest.characters[id];
	writeFileSync(path, `${JSON.stringify(manifest, null, '	')}
`);
	console.log(`  (đã gỡ bản xuất cũ của ${id})`);
}

/**
 * Thông số animation ghi vào manifest. idle/walk giữ `{ fps }` như cũ. Động tác tuỳ chọn chỉ ghi khi có frame:
 * `frames` = số frame thật (hướng nhiều nhất), `fps` suy từ `durationMs`, `directions` = hướng đã vẽ.
 */
function manifestAnimations(spec: CharacterSpec, frames: AnimationFrames): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	for (const [a, v] of Object.entries(spec.animations) as [AnimationName, CharacterSpec['animations'][AnimationName] & object][]) {
		if (!v.optional) {
			out[a] = { fps: v.fps };
			continue;
		}
		const dirs = DIRECTIONS.filter((d) => frames[a]?.[d]?.length);
		if (!dirs.length) continue;
		const n = Math.max(...dirs.map((d) => frames[a]![d]!.length));
		out[a] = { fps: v.durationMs ? Math.max(1, Math.round((n * 1000) / v.durationMs)) : v.fps, frames: n, hitFrame: v.hitFrame, loop: false, directions: dirs };
	}
	return out;
}

function updateManifest(spec: CharacterSpec, license: unknown, height: number, portrait: string | null, frames: AnimationFrames): void {
	const path = join(WEB_ASSETS, 'manifest.json');
	const manifest = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : { version: 1, characters: {} };
	const id = spec.identity.characterId;
	manifest.characters[id] = {
		displayName: spec.displayName,
		role: spec.role,
		identity: spec.identity,
		atlas: `characters/${id}/${id}.json`,
		frameSize: spec.frameSize,
		anchor: { x: 0.5, y: spec.baselineY / spec.frameSize.height },
		animations: manifestAnimations(spec, frames),
		source: { provider: spec.provider, ref: spec.sourceRef ?? null, license },
		notes: spec.notes ?? null,
		bodyHeight: height,
		portrait,
		directions: spec.directions ?? DIRECTIONS,
		provisional: spec.provisional ?? [],
	};
	writeFileSync(path, `${JSON.stringify(manifest, null, '\t')}\n`);
}

interface RegistryEntry {
	uuid: string;
	/** Số thứ tự token trong PIXELLAB_TOKENS — nhân vật chỉ animate được bằng tài khoản đã tạo ra nó. */
	token: number;
	/** Nhóm walk kiểu cũ — đọc như `groups.walk`. */
	walkGroup?: string;
	/** Nhóm animation PixelLab theo tên (`walk`, `cast`, `attack-sword`…): hướng vẽ thêm nối vào đúng nhóm. */
	groups?: Record<string, string>;
}

const PL_DIR_NAMES = Object.values(PL_DIR);

/** Lượt PixelLab ước tính cho MỘT hướng. v3 tính trên canvas sinh ra (hình nới ~1,375 lần mỗi chiều). */
function animateCost(o: { template?: string; mode?: string; frames: number }, size: { width: number; height: number }): number {
	// skeleton-v3 (beta): 2–4 lượt / hướng tuỳ số khung của mẫu (8 khung ≈ 3, theo trợ giúp PixelLab) — in mức TRẦN; máy chủ KHÔNG
	// trả dòng `cost` cho chế độ này (cả mẫu thường), nên tổng in ra là ước lượng.
	if (o.template) return o.mode === 'skeleton-v3' ? 4 : 1;
	// pixminimax tính theo thời gian sinh: 64–96px ≈ 1 lượt mỗi 8 khung (bảng giá trong mô tả công cụ).
	if (o.mode === 'pixminimax') return Math.max(1, Math.ceil(o.frames / 8));
	return Math.max(1, Math.ceil((size.width * 1.375 * (size.height * 1.375) * o.frames) / 65536));
}

/**
 * `pixellab animate <id> <anim> (--template <mẫu> [--mode skeleton-v3] [--action "..."] [--freedom N] | --mode v3|pixminimax --action "..." [--frames N])
 *   [--name <tên-PixelLab>] [--together] [--force] [--dry] [hướng…]`
 * `--template … --mode skeleton-v3`: cùng chuỗi tư thế của mẫu nhưng UỐN chính ảnh nhân vật thay vì vẽ lại từng khung — kiếm
 * giữ nguyên suốt chu kỳ (đo 10/10/2026: mẫu thường `walking-8-frames` làm mất kiếm / trượng ở hướng ngang); trượng MẢNH thì có
 * hướng vẫn bị uốn gãy / giấu sau lưng → vẽ lại hướng đó bằng v3 với mô tả chặt ("…the staff stays upright in every frame").
 * Vẽ động tác TỪNG hướng bằng đúng token sở hữu nhân vật (gói Free chạy 1 lệnh một lúc), chờ xong rồi gửi
 * hướng kế, cuối cùng tải lại gói. Mặc định `east south north` — phía tây lật gương, hướng chéo game lấy hướng kề.
 * Hướng đã có trong gói ĐÃ TẢI VỀ (đúng tên) thì bỏ qua — trừ khi `--force`: vẽ lại hướng xấu sau khi đã
 * `delete_animation` hướng đó trên PixelLab (gói trên máy vẫn còn bản cũ cho tới lần tải lại cuối lệnh này).
 * `--dry`: CHỈ đọc file, in bảng token → hướng → lượt, không gọi mạng.
 */
async function animate(id: string | undefined, rest: string[], tokens: string[], defaultDirs = ['east', 'south', 'north']): Promise<void> {
	const [anim, ...flags] = rest;
	const entry = readRegistry()[id ?? ''];
	if (!id || !entry) throw new Error(`Chưa có ${id} trong sources/pixellab/registry.json`);
	if (!anim) throw new Error('Thiếu tên động tác (vd cast, attack)');
	// `--dry` thắng ở mọi vị trí, và cờ cần giá trị không nuốt token `--…`: `--action --dry` là LỖI, không phải lệnh thật.
	const opt: { template?: string; mode?: string; action?: string; freedom?: number; frames: number; name: string; dry: boolean; force: boolean; together: boolean } = {
		frames: 6,
		name: anim,
		dry: flags.includes('--dry'),
		force: false,
		together: false,
	};
	const dirs: string[] = [];
	for (let i = 0; i < flags.length; i += 1) {
		const f = flags[i]!;
		const value = () => {
			const v = flags[(i += 1)];
			if (v === undefined || v.startsWith('--') || !v.trim()) throw new Error(`Thiếu giá trị cho ${f}`);
			return v;
		};
		if (f === '--dry') continue;
		else if (f === '--force') opt.force = true;
		else if (f === '--together') opt.together = true;
		else if (f === '--template') opt.template = value();
		else if (f === '--mode') opt.mode = value();
		else if (f === '--action') opt.action = value();
		else if (f === '--freedom') opt.freedom = Number(value());
		else if (f === '--frames') opt.frames = Number(value());
		else if (f === '--name') opt.name = value();
		else if (PL_DIR_NAMES.includes(f)) dirs.push(f);
		else throw new Error(`Không hiểu "${f}" (hướng hợp lệ: ${PL_DIR_NAMES.join(' ')})`);
	}
	if (!opt.template && opt.mode !== 'v3' && opt.mode !== 'pixminimax') throw new Error('Cần --template <mẫu> hoặc --mode v3|pixminimax --action "..."');
	if (opt.template && opt.mode && opt.mode !== 'skeleton-v3') throw new Error('--template chỉ đi kèm --mode skeleton-v3 (v3 / pixminimax dùng --action, không dùng mẫu)');
	// Number('8x') = NaN lọt mọi phép so sánh (NaN < 4 là false) → phải kiểm số nguyên tường minh.
	if (opt.mode === 'v3' && (!opt.action || !Number.isInteger(opt.frames) || opt.frames < 4 || opt.frames > 16 || opt.frames % 2)) throw new Error('v3 cần --action và --frames chẵn 4–16');
	// pixminimax: gói trả phí (Tier 1+), số khung bội của 4 tới 40.
	if (opt.mode === 'pixminimax' && (!opt.action || !Number.isInteger(opt.frames) || opt.frames < 4 || opt.frames > 40 || opt.frames % 4)) throw new Error('pixminimax cần --action và --frames bội 4 (4–40)');
	if (opt.freedom !== undefined && (!Number.isInteger(opt.freedom) || opt.freedom < 0 || opt.freedom > 900)) throw new Error('--freedom phải là số nguyên 0–900');
	if (opt.force && !dirs.length) throw new Error('--force cần ghi rõ hướng vẽ lại (vd south) — không vẽ lại cả bộ mặc định');

	// Gói đã tải: biết cỡ canvas thật và hướng nào đã có (đúng tên) — chưa tải thì coi như chưa có hướng nào.
	const dir = join(PIXELLAB_SOURCES, id);
	const src = existsSync(join(dir, 'metadata.json')) ? new PixelLabSource(dir) : null;
	const size = src?.state.character.size ?? loadSpec(id).frameSize;
	const has = (d: string) => !!src && src.animationFiles(opt.name, (Object.keys(PL_DIR) as Direction[]).find((k) => PL_DIR[k] === d)!).length > 0;
	const todo = (dirs.length ? dirs : defaultDirs).filter((d) => {
		if (!has(d)) return true;
		if (opt.force) {
			console.log(`  ${opt.name}/${d}: đã có trong gói tải về → VẼ LẠI (--force; nhớ delete_animation hướng đó trên PixelLab trước)`);
			return true;
		}
		console.log(`  ${opt.name}/${d}: đã có trong gói → bỏ qua (vẽ lại: delete_animation rồi thêm --force)`);
		return false;
	});
	const cost = animateCost(opt, size);
	const how = opt.template ? `template ${opt.template}${opt.mode ? ` · ${opt.mode}` : ''}` : `${opt.mode} ${opt.frames} frame`;
	console.log(`token #${entry.token} · ${id} · ${opt.name} (${how}, canvas ${size.width}×${size.height})`);
	for (const d of todo) console.log(`  #${entry.token} → ${d.padEnd(10)} ≈ ${cost} lượt`);
	console.log(`  Tổng ≈ ${cost * todo.length} lượt${opt.dry ? ' (--dry: không gửi gì)' : ''}`);
	if (opt.dry || !todo.length) return;

	const token = tokens[entry.token];
	if (!token) throw new Error(`Thiếu token #${entry.token} trong PIXELLAB_TOKENS`);
	const mcp = new PixelLabMcp(token);
	let group = entry.groups?.[opt.name] ?? (opt.name === 'walk' ? entry.walkGroup : undefined);
	/** Gửi một lô hướng; trả số hướng máy chủ NHẬN (dòng `cost: … (X/dir x K)`; không có dòng cost thì coi như nhận đủ). */
	const submit = async (batch: string[]): Promise<number> => {
		const body = {
			character_id: entry.uuid,
			directions: batch,
			animation_name: opt.name,
			...(opt.template
				? { template_animation_id: opt.template, ...(opt.mode ? { mode: opt.mode } : {}), ...(opt.action ? { action_description: opt.action } : {}), ...(opt.freedom !== undefined ? { ai_freedom: opt.freedom } : {}) }
				: // Bỏ frame tham chiếu (ảnh đứng) khỏi chuỗi: động tác một lần mà frame 0 đứng yên là chậm một nhịp.
					{ mode: opt.mode, action_description: opt.action, frame_count: opt.frames, keep_first_frame: false }),
		};
		let text: string;
		try {
			text = await callWhenFree(mcp, 'animate_character', { ...body, ...(group ? { animation_group_id: group } : {}) });
		} catch (e) {
			// Nhóm ghi trong registry mà máy chủ không có (lần gửi trước bị từ chối HẾT hướng nên nhóm không thành) → bỏ, gửi nhóm mới.
			if (!group || !/no animation group/i.test(String(e))) throw e;
			console.log(`  (nhóm ${group} không có trên máy chủ — bỏ khỏi registry, gửi thành nhóm mới)`);
			dropRegistryGroup(id, opt.name);
			group = undefined;
			text = await callWhenFree(mcp, 'animate_character', body);
		}
		const created = /group: ([0-9a-f-]{36})/.exec(text)?.[1];
		if (created && !group) {
			group = created;
			entry.groups = { ...entry.groups, [opt.name]: created };
			writeRegistry(id, entry);
		}
		const charged = /cost[^\n]*/i.exec(text)?.[0];
		console.log(`  ${id} ${opt.name}/${batch.join(',')} → ${mcp.label}${charged ? ` · ${charged}` : ''}`);
		await waitCharacter(mcp, entry.uuid);
		const accepted = /x\s*(\d+)\)/.exec(charged ?? '')?.[1];
		return accepted ? Math.min(batch.length, Number(accepted)) : batch.length;
	};
	const toDir = (pl: string) => (Object.keys(PL_DIR) as Direction[]).find((k) => PL_DIR[k] === pl)!;
	const present = (pl: string) => new PixelLabSource(dir).animationFiles(opt.name, toDir(pl)).length > 0;
	if (!opt.together) {
		for (const d of todo) await submit([d]);
		const files = await downloadPixelLab(PIXELLAB_SOURCES, id, entry.uuid);
		console.log(`✔ ${id}: ${opt.name} ${todo.join(', ')} · tải ${files.length} file`);
		return;
	}
	// `--together` (gói trả phí, nhiều ô lệnh) TỰ LÀNH (09/10/2026, đã dẫm ở Mốc 1): máy chủ có thể nhận THIẾU hướng khi gần hết
	// 10 ô mà không báo lỗi, và job còn xếp hàng không hiện trong get_character nên `waitCharacter` trả sớm → tải lại tới khi đủ số
	// hướng đã nhận, rồi gửi bù hướng còn thiếu vào CÙNG nhóm (không đẻ nhóm trùng tên), tối đa 3 vòng.
	let missing = todo;
	for (let round = 1; round <= 3 && missing.length; round += 1) {
		const accepted = await submit(missing);
		const want = missing.length - accepted;
		const deadline = Date.now() + 30 * 60 * 1000;
		for (;;) {
			await downloadPixelLab(PIXELLAB_SOURCES, id, entry.uuid);
			const left = missing.filter((d) => !present(d));
			if (left.length <= want || Date.now() > deadline) break;
			await sleep(45_000);
		}
		missing = missing.filter((d) => !present(d));
		if (missing.length) console.log(`  vòng ${round}: còn thiếu ${missing.join(', ')}${round < 3 ? ` → gửi bù vào nhóm ${group ?? '(mới)'}` : ''}`);
	}
	if (missing.length) {
		process.exitCode = 3;
		console.log(`✘ ${id}: ${opt.name} vẫn thiếu ${missing.join(', ')} sau 3 vòng`);
	} else console.log(`✔ ${id}: ${opt.name} ${todo.join(', ')} · đủ hướng`);
}

/** Bỏ một nhóm animation khỏi registry (`writeRegistry` gộp sâu `groups` nên không xoá được khoá bằng nó). */
function dropRegistryGroup(id: string, name: string): void {
	const reg = readRegistry();
	if (reg[id]?.groups) delete reg[id]!.groups![name];
	writeFileSync(join(PIXELLAB_SOURCES, 'registry.json'), `${JSON.stringify(reg, null, '\t')}\n`);
}

/**
 * `pixellab vfx <token#> <vfxId> [cờ…]` — PixelLab VẼ một hiệu ứng kỹ năng, code chỉ điều phối:
 * 1. Khung đầu: `create_image_pixen` (mặc định, 1 lượt; `--model pixflux|pro_flash`), nền trong suốt. Preset có
 *    `firstScale` (vụ nổ) thì vẽ NHỎ rồi đặt vào giữa canvas đủ khổ → `first.png` (ảnh PixelLab trả: `first_drawn.png`).
 *    Bỏ qua khi có `--first-image`, hoặc khi thư mục đã có `first.png` của lần trước (vẽ lại: `--redraw-first`).
 * 2. `animate_image` làm chuyển động → `frame_000.png`… (ảnh 0 = khung đầu) + `meta.json` ghi CUỐI.
 * - Trước khi gửi: đọc `get_balance` (miễn phí); token không đủ lượt thì DỪNG trước khi tiêu. `--first-only`: chỉ
 *   bước 1 (token chỉ đủ khung đầu) — bước 2 chạy lại đúng lệnh bằng token khác.
 * - Job đã gửi ghi vào `pending.json`: lệnh chết lúc chờ thì chạy lại đúng lệnh → chỉ chờ + tải job cũ, không gửi mới.
 * - `--force` (đã có meta): làm trong `<id>.new/`, xong hết mới đổi chỗ (bản cũ → `<id>.bak/`).
 * - `--dry`: chỉ in kế hoạch, lượt và số dư (tra cứu miễn phí), không gửi lệnh tốn lượt.
 */
async function pixellabVfx(rest: string[], tokens: string[]): Promise<void> {
	const [index, vfxId, ...flags] = rest;
	const usage =
		'Cách dùng: pixellab vfx <token#> <vfxId> [--model pixen|pixflux|pro_flash] [--first "..."] [--action "..."] [--size N] [--first-size N] [--frames N] [--first-image <png>] [--redraw-first] [--first-only] [--force] [--dry]';
	if (index === undefined || !vfxId) throw new Error(usage);
	const def = VFX.find((v) => v.id === vfxId);
	if (!def) throw new Error(`Không có hiệu ứng "${vfxId}" trong VFX (vfx/buildVfx.ts): ${VFX.map((v) => v.id).join(' ')}`);
	const opt = parseVfxFlags(flags);
	const tokenIndex = Number(index);
	const token = tokens[tokenIndex];
	const preset = PIXELLAB_VFX_PRESETS[def.id];
	const dir = join(VFX_PIXELLAB_SOURCES, def.id);
	const done = existsSync(join(dir, 'meta.json'));
	console.log(`token #${index} · vfx ${def.id} (${def.kind}, trong game ${def.size}px${def.squashY ? `, ép dẹt ${def.squashY}` : ''}) → ${dir}`);
	if (done && !opt.force) {
		console.log('  ĐÃ có bản PixelLab (meta.json) → không vẽ lại (thêm --force để vẽ đè)');
		return;
	}
	// Vẽ đè: làm trong thư mục riêng, bản cũ (đã trả lượt) chỉ bị thay khi bản mới đã đủ meta.
	const work = done ? `${dir}.new` : dir;
	if (work !== dir) console.log(`  --force: làm trong ${work}, đủ meta mới thay bản cũ (bản cũ → ${dir}.bak)`);
	const pendingPath = join(work, 'pending.json');
	const firstPath = join(work, 'first.png');
	const drawnPath = join(work, 'first_drawn.png');
	let pending = existsSync(pendingPath) ? (JSON.parse(readFileSync(pendingPath, 'utf8')) as PendingVfx) : null;
	if (pending && pending.id !== def.id) throw new Error(`${pendingPath} ghi id "${pending.id}"`);
	const firstJob = pending?.firstJobId && !pending.firstDone ? pending.firstJobId : null;
	const animJob = pending?.animateJobId ?? null;
	// Job đã trả lượt mà chưa tải: chạy lại chỉ được phép TẢI TIẾP — cờ đổi nội dung bước đó là mâu thuẫn.
	const clash = [
		...(firstJob || animJob ? ['--first', '--first-image', '--redraw-first', '--size', '--first-size', '--model'] : []),
		...(animJob ? ['--action', '--frames'] : []),
	].filter((f) => flags.includes(f));
	if (clash.length)
		throw new Error(`${pendingPath} còn job đã trả lượt (${firstJob ?? animJob}) — chạy lại KHÔNG kèm ${clash.join(' ')} để tải tiếp, hoặc xoá pending.json nếu chắc chắn bỏ job đó`);

	// ── Bước 1: khung đầu ──
	const model: FirstModel = (firstJob && pending!.model !== 'file' ? pending!.model : opt.model) ?? 'pixen';
	let firstFile: RGBAImage | null = null;
	let stage1: 'resume' | 'file' | 'reuse' | 'draw';
	if (firstJob) stage1 = 'resume';
	else if (animJob) {
		// Job chuyển động đang chờ được dựng TỪ first.png này — vẽ lại khung đầu lúc này là lệch cặp.
		if (!existsSync(firstPath)) throw new Error(`Thiếu ${firstPath} trong khi job chuyển động ${animJob} đang chờ — khôi phục first.png, hoặc xoá pending.json nếu bỏ job đó`);
		firstFile = readPng(firstPath);
		stage1 = 'reuse';
	} else if (opt.firstImage) {
		if (!existsSync(opt.firstImage)) throw new Error(`Không thấy ${opt.firstImage}`);
		firstFile = readPng(opt.firstImage);
		stage1 = 'file';
	} else if (existsSync(firstPath) && !opt.redrawFirst && (opt.first === undefined || opt.first === pending?.first)) {
		firstFile = readPng(firstPath);
		stage1 = 'reuse';
	} else stage1 = 'draw';
	let canvas: { w: number; h: number };
	let drawn: { w: number; h: number };
	const prompt = stage1 === 'resume' ? pending!.first : (opt.first ?? preset?.first ?? null);
	if (stage1 === 'resume') {
		canvas = pending!.canvas;
		drawn = pending!.drawn;
	} else if (firstFile) {
		canvas = { w: firstFile.width, h: firstFile.height };
		drawn = canvas;
	} else {
		const c = opt.size ?? defaultCanvas(def);
		if (!Number.isInteger(c) || c < 16 || c > 256 || c % 4) throw new Error('--size phải là bội 4 trong 16–256');
		const d = drawnSize(c, preset?.firstScale, opt.firstSize);
		if (!Number.isInteger(d) || d > c) throw new Error(`--first-size ${d} phải là số nguyên ≤ canvas ${c}`);
		const bad = firstCanvasError(model, d, d);
		if (bad) throw new Error(bad);
		if (!prompt) throw new Error(`Chưa có mô tả khung đầu mặc định cho ${def.id} — truyền --first "..." hoặc --first-image <png>`);
		canvas = { w: c, h: c };
		drawn = { w: d, h: d };
	}
	if (canvas.w > 256 || canvas.h > 256) throw new Error(`khung đầu ${canvas.w}×${canvas.h} vượt 256×256 của animate_image`);

	// ── Bước 2: chuyển động ──
	const animateStep = def.kind !== 'still';
	let stage2: 'none' | 'resume' | 'later' | 'submit' = 'none';
	let action: string | null = null;
	let frames = 0;
	if (animateStep && animJob) {
		stage2 = 'resume';
		action = pending!.action ?? null;
		frames = pending!.frames ?? 0;
	} else if (animateStep) {
		stage2 = opt.firstOnly ? 'later' : 'submit';
		action = opt.action ?? preset?.action ?? null;
		frames = opt.frames ?? preset?.frames ?? (def.kind === 'loop' ? 4 : 8);
		if (!action) throw new Error(`Chưa có mô tả chuyển động mặc định cho ${def.id} — truyền --action "..."`);
		// Number('8x') = NaN lọt mọi phép so sánh → kiểm số nguyên tường minh.
		if (!Number.isInteger(frames) || frames < 4 || frames > 16 || frames % 2) throw new Error('--frames phải là số chẵn 4–16');
		if (canvas.w * canvas.h * frames > ANIMATE_PIXEL_LIMIT)
			throw new Error(`${canvas.w}×${canvas.h}×${frames} khung vượt giới hạn ${ANIMATE_PIXEL_LIMIT} pixel của animate_image — giảm --frames hoặc --size`);
	}

	// ── Kế hoạch + lượt ──
	let firstCost: number | null = 0;
	if (stage1 === 'draw') {
		firstCost = FIRST_FIXED_COST[model] ?? null;
		// Bảng giá Pro Flash (`cost.total`, tạm tính) là tra cứu MIỄN PHÍ.
		if (firstCost === null && token)
			firstCost = await new PixelLabMcp(token)
				.call('get_pro_flash_capabilities', { operation: 'create', width: drawn.w, height: drawn.h })
				.then((t) => (JSON.parse(t) as { cost?: { total?: number } }).cost?.total ?? null)
				.catch(() => null);
		const pad = drawn.w !== canvas.w ? `, đặt vào giữa canvas ${canvas.w}×${canvas.h}` : '';
		console.log(`  Bước 1 ${FIRST_TOOL[model]} ${drawn.w}×${drawn.h}${pad}, nền trong suốt ≈ ${firstCost ?? '?'} lượt`);
		console.log(`         "${prompt}"`);
	} else if (stage1 === 'resume') console.log(`  Bước 1 TẢI TIẾP job ${firstJob} (token #${pending!.firstToken}, không tốn lượt)`);
	else if (stage1 === 'reuse') console.log(`  Bước 1 bỏ qua: dùng lại ${firstPath} (${canvas.w}×${canvas.h})${animJob ? '' : ' — vẽ lại thì thêm --redraw-first'}`);
	else console.log(`  Bước 1 bỏ qua: khung đầu = ${opt.firstImage} (${canvas.w}×${canvas.h})`);
	const animCost = stage2 === 'submit' ? animateImageCost(canvas.w, canvas.h, frames) : 0;
	if (stage2 === 'submit' || stage2 === 'later') {
		const later = stage2 === 'later' ? ' — HOÃN (--first-only)' : '';
		console.log(`  Bước 2 animate_image ${frames} khung (${canvas.w}×${canvas.h}×${frames} = ${canvas.w * canvas.h * frames} px) ≈ ${animateImageCost(canvas.w, canvas.h, frames)} lượt${later}`);
		console.log(`         "${action}"`);
	} else if (stage2 === 'resume') console.log(`  Bước 2 TẢI TIẾP job ${animJob} (token #${pending!.animateToken}, không tốn lượt)`);
	else console.log('  Bước 2 bỏ qua: hiệu ứng tĩnh chỉ cần khung đầu');
	// Không đọc được giá Pro Flash thì tính theo mức đã đo (5 lượt) để phép kiểm số dư không lạc quan.
	const firstNeed = firstCost ?? 5;
	const need = firstNeed + animCost;
	console.log(`  Tổng ≈ ${firstCost === null ? `? (ước ${firstNeed}) + ${animCost}` : need} lượt`);

	if (need > 0) {
		if (!token) {
			if (!opt.dry) throw new Error(`Thiếu token #${index} trong PIXELLAB_TOKENS`);
			console.log(`  (không có token #${index} — bỏ qua tra số dư)`);
		} else {
			const bal = await new PixelLabMcp(token)
				.call('get_balance')
				.then(parseBalance)
				.catch(() => null);
			let problem: string | null = null;
			if (!bal) problem = 'không đọc được số dư (get_balance) — không gửi lệnh tốn lượt khi chưa biết token còn đủ lượt';
			else {
				const avail = bal.remaining + bal.today;
				console.log(`  Số dư token #${index}: ${bal.remaining} lượt gói + ${bal.today} lượt thưởng ngày = ${avail}${bal.credits > 0 ? ` (+ $${bal.credits} credits)` : ''}`);
				if (bal.credits > 0) console.log('  (có credits trả tiền — không chặn theo lượt)');
				else if (firstNeed > avail) problem = `bước 1 cần ≈ ${firstNeed} lượt, token #${index} chỉ còn ${avail} — dùng token khác`;
				else if (need > avail)
					problem = `cả hai bước cần ≈ ${need} lượt, token #${index} chỉ còn ${avail} — chạy kèm --first-only (chỉ khung đầu), rồi chạy lại đúng lệnh bằng token khác cho bước 2 (khung đầu được dùng lại)`;
			}
			if (problem && !opt.dry) throw new Error(`Không gửi: ${problem}`);
			console.log(problem ? `  ✘ ${problem}` : '  ✔ đủ lượt');
		}
	}
	if (opt.dry) {
		console.log('  (--dry: không gửi gì)');
		return;
	}

	const mcps = new Map<number, PixelLabMcp>();
	const mcpFor = (i: number): PixelLabMcp => {
		const t = tokens[i];
		if (!t) throw new Error(`Thiếu token #${i} trong PIXELLAB_TOKENS (job dở thuộc tài khoản đó)`);
		if (!mcps.has(i)) mcps.set(i, new PixelLabMcp(t));
		return mcps.get(i)!;
	};
	const savePending = (p: PendingVfx): PendingVfx => {
		pending = { ...p, updatedAt: new Date().toISOString() };
		writeFileSync(pendingPath, `${JSON.stringify(pending, null, '\t')}\n`);
		return pending;
	};
	const resumeHint = (jobId: string) => `job ${jobId} đã ghi vào ${pendingPath}; chạy lại ĐÚNG lệnh này để tải tiếp (không gửi job mới, không tốn lượt)`;
	mkdirSync(work, { recursive: true });

	let firstImg: RGBAImage;
	if (stage1 === 'file' || stage1 === 'reuse') {
		firstImg = firstFile!;
		if (stage1 === 'file' && resolve(opt.firstImage!) !== resolve(firstPath)) writePng(firstPath, firstImg);
		if (stage1 === 'file' || !pending) {
			if (existsSync(drawnPath)) rmSync(drawnPath);
			savePending({ id: def.id, model: 'file', first: null, firstDone: true, canvas, drawn, updatedAt: '' });
		}
	} else {
		let jobId: string;
		let mcp: PixelLabMcp;
		if (stage1 === 'draw') {
			mcp = mcpFor(tokenIndex);
			const text = await callWhenFree(mcp, FIRST_TOOL[model], firstArgs(prompt!, drawn.w, drawn.h));
			const id = extractJobId(text);
			if (!id) throw new Error(`Không đọc được job id của ${FIRST_TOOL[model]}: ${text.slice(0, 300)}`);
			jobId = id;
			savePending({ id: def.id, model, first: prompt, firstJobId: jobId, firstToken: tokenIndex, firstDone: false, canvas, drawn, updatedAt: '' });
			console.log(`  khung đầu → job ${jobId} (${mcp.label})`);
		} else {
			jobId = firstJob!;
			mcp = mcpFor(pending!.firstToken ?? tokenIndex);
		}
		const got = (
			await waitImages(mcp, jobId, 1).catch((e: Error) => {
				throw new Error(`${e.message} — ${resumeHint(jobId)}`);
			})
		)[0]!;
		if (got.width !== canvas.w || got.height !== canvas.h) {
			writePng(drawnPath, got);
			firstImg = padCenter(got, canvas.w, canvas.h);
		} else {
			if (existsSync(drawnPath)) rmSync(drawnPath);
			firstImg = got;
		}
		writePng(firstPath, firstImg);
		savePending({ ...pending!, firstDone: true });
		console.log(`  ✔ ${firstPath} (${firstImg.width}×${firstImg.height}${got.width !== canvas.w ? `, vẽ ${got.width}×${got.height} rồi đặt vào giữa` : ''})`);
	}
	if (stage2 === 'later') {
		console.log(`✔ khung đầu đã lưu. Bước 2: chạy lại đúng lệnh (bỏ --first-only) bằng token còn ≥ ${animateImageCost(canvas.w, canvas.h, frames)} lượt — khung đầu được dùng lại, không vẽ lại.`);
		return;
	}

	let images: RGBAImage[] = [firstImg];
	let animateJobId: string | undefined;
	if (stage2 === 'submit' || stage2 === 'resume') {
		let mcp: PixelLabMcp;
		if (stage2 === 'submit') {
			mcp = mcpFor(tokenIndex);
			const keep = `khung đầu đã lưu (${firstPath}); chạy lại ĐÚNG lệnh này bằng token khác — khung đầu được dùng lại, không vẽ lại`;
			let text: string;
			try {
				text = await callWhenFree(mcp, 'animate_image', { first_frame_base64: readFileSync(firstPath).toString('base64'), action, frame_count: frames, no_background: true });
			} catch (e) {
				throw new Error(`${e instanceof Error ? e.message : String(e)} — ${keep}`);
			}
			const id = extractJobId(text);
			if (!id) throw new Error(`Không đọc được job id của animate_image: ${text.slice(0, 300)} — ${keep} (xem list_jobs trước: job có thể đã nhận)`);
			animateJobId = id;
			savePending({ ...pending!, action: action!, frames, animateJobId, animateToken: tokenIndex });
			console.log(`  chuyển động → job ${animateJobId} (${mcp.label})`);
		} else {
			animateJobId = animJob!;
			mcp = mcpFor(pending!.animateToken ?? tokenIndex);
		}
		const jobId = animateJobId;
		images = await waitImages(mcp, jobId, frames + 1, { w: firstImg.width, h: firstImg.height }).catch((e: Error) => {
			throw new Error(`${e.message} — ${resumeHint(jobId)}`);
		});
	}
	const p = pending!;
	// Khung cũ của lần trước (có thể nhiều hơn) bị xoá NGAY TRƯỚC khi ghi bộ mới — không xoá sớm hơn.
	for (const f of readdirSync(work)) if (/^frame_\d+\.png$/.test(f)) rmSync(join(work, f));
	const meta: PixelLabVfxMeta = {
		id: def.id,
		kind: def.kind,
		canvas: { w: firstImg.width, h: firstImg.height },
		first: {
			prompt: p.model === 'file' ? null : p.first,
			image: 'first.png',
			source: p.model === 'file' ? 'file' : FIRST_TOOL[p.model],
			...(p.firstJobId ? { jobId: p.firstJobId } : {}),
			...(p.model !== 'file' && existsSync(drawnPath) ? { drawn: 'first_drawn.png' } : {}),
		},
		action: animateStep ? action : null,
		frameCount: animateStep ? frames : 0,
		inputIncluded: true,
		files: images.map((img, i) => {
			const name = `frame_${String(i).padStart(3, '0')}.png`;
			writePng(join(work, name), img);
			return name;
		}),
		...(animateJobId ? { animateJobId } : {}),
		createdAt: new Date().toISOString(),
		token: p.animateToken ?? p.firstToken ?? tokenIndex,
	};
	writeFileSync(join(work, 'meta.json'), `${JSON.stringify(meta, null, '\t')}\n`);
	rmSync(pendingPath, { force: true });
	if (work !== dir) {
		const bak = `${dir}.bak`;
		rmSync(bak, { recursive: true, force: true });
		renameSync(dir, bak);
		renameSync(work, dir);
		console.log(`  bản cũ → ${bak}`);
	}
	console.log(`✔ vfx ${def.id}: ${meta.files.length} ảnh (ảnh 0 = khung đầu) → ${dir}. Chạy \`npm run assets:vfx\` để đưa vào atlas.`);
}

/**
 * Chờ job ảnh (create_image_* / animate_image) xong rồi lấy ĐÚNG `expected` ảnh theo thứ tự. get_image trả ảnh
 * nhúng (base64) và/hoặc link .png trong chữ, và có thể chỉ nhúng vài ảnh đầu của chuỗi dài → thiếu thì lấy từng
 * ảnh bằng tham số `index`. Job đã TRẢ LƯỢT nên lỗi mạng/5xx/phiên hết hạn chỉ là tạm: thử lại có giới hạn, phiên
 * hỏng thì khởi tạo lại. `size`: mọi ảnh phải đúng cỡ này (lọc link thừa, vd sheet ghép).
 */
async function waitImages(mcp: PixelLabMcp, jobId: string, expected: number, size?: { w: number; h: number }): Promise<RGBAImage[]> {
	const busy = /processing|pending|queued|in[ _]progress|not (yet )?(ready|complete|finished)|\d+\s*%/i;
	const fits = (im: RGBAImage) => !size || (im.width === size.w && im.height === size.h);
	let transient = 0;
	const retry = async <T,>(fn: () => Promise<T>): Promise<T> => {
		for (;;) {
			try {
				return await fn();
			} catch (e) {
				if (!isTransientError(e) || busy.test(String(e)) || transient >= 30) throw e;
				transient += 1;
				if (isSessionError(e)) mcp.resetSession();
				console.log(`  (lỗi tạm khi chờ job ${jobId}: ${String(e instanceof Error ? e.message : e).slice(0, 120)} — thử lại ${transient}/30)`);
				await sleep(15_000);
			}
		}
	};
	await sleep(10_000);
	const deadline = Date.now() + 3600 * 1000;
	while (Date.now() < deadline) {
		let res: McpToolResult;
		try {
			res = await retry(() => mcp.callFull('get_image', { job_id: jobId }));
		} catch (e) {
			if (!busy.test(String(e))) throw e;
			await sleep(15_000);
			continue;
		}
		const urls = extractPngUrls(res.text);
		if (!res.images.length && !urls.length) {
			if (/\b(failed|error|cancel+ed)\b/i.test(res.text) && !busy.test(res.text)) throw new Error(`[${mcp.label}] job ${jobId} hỏng: ${res.text.slice(0, 300)}`);
			await sleep(15_000);
			continue;
		}
		if (res.images.length >= expected) {
			const imgs = res.images.slice(0, expected).map((im) => decodePng(im.data));
			if (imgs.every(fits)) return imgs;
		}
		if (urls.length >= expected) {
			const all: RGBAImage[] = [];
			for (const u of urls) all.push(await retry(() => downloadPng(u)));
			const ok = all.filter(fits);
			if (ok.length >= expected) return ok.slice(0, expected);
		}
		const out: RGBAImage[] = [];
		for (let i = 0; i < expected; i += 1) {
			const one = await retry(() => mcp.callFull('get_image', { job_id: jobId, index: i }));
			const url = extractPngUrls(one.text)[0];
			let img: RGBAImage;
			if (one.images[0]) img = decodePng(one.images[0].data);
			else if (url) img = await retry(() => downloadPng(url));
			else throw new Error(`[${mcp.label}] job ${jobId}: không lấy được ảnh ${i}/${expected}: ${one.text.slice(0, 200)}`);
			if (!fits(img)) throw new Error(`[${mcp.label}] job ${jobId}: ảnh ${i} cỡ ${img.width}×${img.height}, cần ${size!.w}×${size!.h}`);
			out.push(img);
		}
		return out;
	}
	throw new Error(`[${mcp.label}] chờ job ${jobId} quá 1 giờ`);
}

async function downloadPng(url: string): Promise<RGBAImage> {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Tải ${url.split('?')[0]} lỗi HTTP ${res.status}`);
	return decodePng(Buffer.from(await res.arrayBuffer()));
}

function readRegistry(): Record<string, RegistryEntry> {
	return JSON.parse(readFileSync(join(PIXELLAB_SOURCES, 'registry.json'), 'utf8')) as Record<string, RegistryEntry>;
}

/**
 * Ghi MỘT mục: đọc bản mới nhất rồi mới ghi — nhiều chuỗi việc (mỗi tài khoản một chuỗi) chạy song song.
 * Gộp SÂU `groups`: hai lệnh animate cùng nhân vật chạy song song thì lệnh ghi sau không xoá nhóm lệnh kia vừa lưu.
 */
function writeRegistry(id: string, entry: RegistryEntry): void {
	const reg = readRegistry();
	const cur = reg[id];
	const groups = { ...cur?.groups, ...entry.groups };
	reg[id] = { ...cur, ...entry, ...(Object.keys(groups).length ? { groups } : {}) };
	writeFileSync(join(PIXELLAB_SOURCES, 'registry.json'), `${JSON.stringify(reg, null, '	')}
`);
}

/**
 * Chờ hết lệnh đang chạy của một tài khoản. Máy chủ trả về ngay khi có lệnh xong (hoặc khi hết thời gian
 * chờ của nó), nên lặp tới khi không còn lệnh nào — hàng đợi miễn phí có lúc mất trên 10 phút một nhân vật.
 */
async function waitJobs(mcp: PixelLabMcp): Promise<void> {
	// Lệnh vừa gửi có thể chưa kịp vào hàng đợi: đã gặp wait_for_jobs trả "No active jobs" ngay sau create,
	// rồi bước tải gói ăn lỗi 423 (đang vẽ dở). Nên chờ một nhịp, và chỉ tin là xong khi list_jobs cũng trống.
	await sleep(15_000);
	const deadline = Date.now() + 2 * 3600 * 1000;
	while (Date.now() < deadline) {
		const text = await mcp.call('wait_for_jobs', { timeout_seconds: 400 });
		if (!/no active jobs|\b0 still running/i.test(text)) continue;
		// Câu "no active jobs (nothing pending or processing)" cũng chứa chữ pending/processing — chỉ coi là còn
		// việc khi có DÒNG lệnh dạng "<uuid> processing 5%" (đã kẹt 12 phút vì so chữ trần).
		const jobs = await mcp.call('list_jobs');
		if (/no active jobs/i.test(jobs) || !/[0-9a-f-]{36}\s+(processing|queued|pending)/i.test(jobs)) return;
		await sleep(10_000);
	}
	throw new Error(`[${mcp.label}] chờ quá 2 giờ, lệnh vẫn chưa xong`);
}

/**
 * Chờ mọi animation của MỘT nhân vật vẽ xong. Animation còn xếp hàng KHÔNG hiện trong list_jobs/wait_for_jobs
 * (đã gặp: chờ trả về ngay, tải gói thiếu hẳn animation vừa gửi) mà chỉ hiện trong get_character dạng
 * "walk(south): 8% ~440s" → đọc thẳng dòng đó.
 */
async function waitCharacter(mcp: PixelLabMcp, uuid: string): Promise<void> {
	await sleep(15_000);
	const deadline = Date.now() + 2 * 3600 * 1000;
	while (Date.now() < deadline) {
		const text = await mcp.call('get_character', { character_id: uuid });
		if (!/^\s*[\w-]+\([\w-]+\):\s*\d+%/m.test(text) && !/status:\s*(pending|processing|queued)/i.test(text)) return;
		await sleep(20_000);
	}
	throw new Error(`[${mcp.label}] chờ nhân vật ${uuid} quá 2 giờ`);
}

/**
 * Hết ô lệnh thì máy chủ từ chối → chờ rồi gửi lại. Gói Free (1 ô) báo "job slots"; gói trả phí báo "Maximum 10 concurrent
 * background jobs", rồi từ tối 09/10/2026 đổi thành "rate limit exceeded (10/10 jobs)" — thiếu mẫu nào thì lệnh chạy hàng loạt
 * bị bỏ ngang (đã dẫm cả hai lần).
 */
async function callWhenFree(mcp: PixelLabMcp, tool: string, args: Record<string, unknown>): Promise<string> {
	for (let attempt = 0; ; attempt += 1) {
		try {
			return await mcp.call(tool, args);
		} catch (e) {
			// Lệnh đang chiếm ô có thể không hiện trong list_jobs (animation xếp hàng) → chờ theo nhịp cố định.
			// Gói trả phí chạy hàng loạt lệnh song song nên có thể chờ ô trống lâu — tối đa ~2 giờ.
			if (attempt >= 240 || !/job slots|concurrent background jobs|rate limit exceeded|\d+\/\d+ jobs/i.test(String(e))) throw e;
			if (attempt === 0) console.log(`  (${mcp.label} đang bận lệnh khác — chờ xong rồi gửi lại)`);
			await sleep(30_000);
		}
	}
}

function sleep(ms: number): Promise<void> {
	return new Promise((r) => setTimeout(r, ms));
}

async function catalog(): Promise<void> {
	const fp = new FreePixelProvider(join(CACHE, 'freepixel'));
	const entries = await fp.listCatalog();
	const byCat = new Map<string, number>();
	for (const e of entries) byCat.set(e.category, (byCat.get(e.category) ?? 0) + 1);
	console.log(`FreePixel: ${entries.length} nhân vật`, Object.fromEntries(byCat));
	writeFileSync(join(CACHE, 'freepixel', 'catalog.json'), JSON.stringify(entries, null, '\t'));
}

/**
 * Các bước Pixler — mỗi bước tốn quota nên chạy TỪNG BƯỚC, có duyệt giữa chừng:
 *   pixler quota
 *   pixler base <id> [count]          sinh ứng viên hướng S (1 lượt)
 *   pixler select <id> <index> "<lý do>"
 *   pixler direction <id> <DIR...>    sinh hướng từ ảnh S (1 lượt/hướng); W/SW/NW lật gương
 *   pixler animate <id> <anim> <DIR> [frames] [prompt Custom...] [--replace]   (1 lượt animate)
 */
async function pixler(args: string[]): Promise<void> {
	const [sub, id, ...rest] = args;
	const api = pixlerApi();
	if (sub === 'quota') {
		console.log(await api.quota());
		return;
	}
	if (!id) throw new Error('Thiếu characterId');
	const spec = loadSpec(id);
	const session = new PixlerSession(PIXLER_SOURCES, spec.identity.characterId, api);
	const review = join(REPORTS, spec.identity.characterId);
	if (sub === 'base') {
		if (!spec.prompt) throw new Error('Spec thiếu "prompt"');
		// Cỡ sinh có thể khác canvas game (trẻ con sinh nhỏ hơn rồi đặt vào canvas chung): `pixler base <id> <count> <w>x<h>`.
		const size = rest[1]?.match(/^(\d+)x(\d+)$/) ? { width: Number(rest[1].split('x')[0]), height: Number(rest[1].split('x')[1]) } : (spec.generateSize ?? spec.frameSize);
		const files = await session.base(spec.prompt, size, Number(rest[0] ?? 3));
		reviewStrip(files.map((f) => session.image(f)), 3, join(review, 'pixler-base.png'));
		console.log(`  ${files.length} ứng viên → ${session.dir}; ảnh duyệt ${join(review, 'pixler-base.png')}`);
	} else if (sub === 'select') {
		session.select(Number(rest[0]), rest.slice(1).join(' ') || 'không ghi lý do');
		console.log(`  đã chọn ứng viên #${rest[0]}`);
	} else if (sub === 'direction') {
		const hint = `${spec.identity.hair} hair, ${spec.identity.eyes} eyes, ${spec.identity.outfit}, ${spec.identity.weapon}`.replace(/_/g, ' ');
		const replace = rest.includes('--replace');
		const extraAt = rest.indexOf('--extra');
		const extra = extraAt >= 0 ? rest.slice(extraAt + 1).join(' ') : undefined;
		const dirs = (extraAt >= 0 ? rest.slice(0, extraAt) : rest).filter((r) => r !== '--replace') as Direction[];
		for (const d of dirs) {
			if (MIRROR_OF[d]) {
				console.log(`  ${d}: lật gương từ ${MIRROR_OF[d]}, bỏ qua`);
				continue;
			}
			console.log(`  ${d}: ${await session.direction(d, hint, { replace, extra })}`);
		}
		const have = DIRECTIONS.filter((d) => session.state.directions[d]);
		reviewStrip(have.map((d) => session.image(session.state.directions[d]!.file)), 3, join(review, 'pixler-directions.png'));
		console.log(`  có ${have.join(', ')}; ảnh duyệt ${join(review, 'pixler-directions.png')}`);
	} else if (sub === 'animate') {
		const replace = rest.includes('--replace');
		const [anim, dir, frames, ...custom] = rest.filter((r) => r !== '--replace') as [AnimationName, Direction, string | undefined, ...string[]];
		const files = await session.animate(anim, dir, Number(frames ?? 6), { replace, customPrompt: custom.join(' ') || undefined });
		reviewStrip(files.map((f) => session.image(f)), 3, join(review, `pixler-${anim}-${dir}.png`));
		console.log(`  ${anim}/${dir}: ${files.length} frame; ảnh duyệt ${join(review, `pixler-${anim}-${dir}.png`)}`);
	} else {
		throw new Error(`Không rõ lệnh pixler "${sub}"`);
	}
	const q = await api.quota();
	console.log(`  quota còn: ${q.remaining}/${q.total} lượt sinh, ${q.animationsRemaining}/${q.animationsTotal} lượt animate (reset ${q.resetAt})`);
}

/** Gói asset một vùng (`map [vùng]`, mặc định `human`): atlas đồ vật + decal + map JSON + ảnh xem trước + `world.json`. */
async function buildMap(region = 'human'): Promise<void> {
	const build = regionBuild(region);
	const cache = join(CACHE, 'freepixel', 'props');
	const outDir = join(WEB_ASSETS, 'maps', region);
	mkdirSync(outDir, { recursive: true });
	const sheetsDir = join(PIXELLAB_SOURCES, 'sheets');
	const items: { id: string; img: RGBAImage }[] = [];
	const meta: Record<string, PropMeta> = {};
	const cutBySheet = new Map<string, RGBAImage[]>();
	for (const def of build.props) {
		const plName = def.path.startsWith(PIXELLAB_PREFIX) ? def.path.slice(PIXELLAB_PREFIX.length) : null;
		const cell = parseSheetPath(def.path);
		let raw: RGBAImage;
		if (cell) {
			if (!existsSync(join(sheetsDir, `${cell.sheet}.png`))) {
				console.log(`  … ${def.id}: chưa có tấm ${cell.sheet} (lệnh \`pixellab image\`) — bỏ qua`);
				continue;
			}
			try {
				raw = loadSheetCell(sheetsDir, cell);
			} catch (e) {
				console.log(`  ✘ ${def.id}: ${e instanceof Error ? e.message : String(e)} — bỏ qua`);
				continue;
			}
			cutBySheet.set(cell.sheet, [...(cutBySheet.get(cell.sheet) ?? []), raw]);
		} else if (plName) {
			const file = join(PIXELLAB_SOURCES, 'objects', plName, `${plName}.png`);
			if (!existsSync(file)) {
				console.log(`  … ${def.id}: chưa có vật PixelLab ${plName} (lệnh \`pixellab object\`) — bỏ qua`);
				continue;
			}
			raw = readPng(file);
		} else raw = await loadFreePixelImage(cache, def.path);
		// Ô của tấm đã kiểm nền trong `loadSheetCell` (trên ô chưa cắt sát) — ở đây chỉ còn kiểm bán trong suốt.
		const issues = propIssues(raw).filter((i) => !cell || !i.startsWith('góc ảnh'));
		if (issues.length) {
			console.log(`  ✘ ${def.id}: ${issues.join('; ')} — bỏ qua`);
			continue;
		}
		if (def.recolor?.length) raw = applyRecolor(raw, def.recolor);
		if (def.flip) raw = flipX(raw);
		const trimmed = def.downscale ? trim(downscaleMode(raw, def.downscale)) : trim(raw);
		// PixelLab (ảnh rời lẫn tấm) đã có viền đen của chính nó; chỉ ảnh ngoài mới thêm viền tự động.
		const img = plName || cell ? trimmed : addOutline(trimmed);
		items.push({ id: def.id, img });
		meta[def.id] = propMeta(def, img);
	}
	mkdirSync(join(REPORTS, 'sheets'), { recursive: true });
	for (const [sheet, cells] of cutBySheet) writePng(join(REPORTS, 'sheets', `${sheet}.png`), scaleNearest(sheetPreview(cells, 3), 2));

	const decalIds: string[] = [];
	for (const { tag, sheet } of build.decals) {
		const file = join(sheetsDir, `${sheet}.png`);
		if (!existsSync(file)) {
			console.log(`  … decal ${tag}: chưa có tấm ${sheet} — map dùng tấm này không có decal`);
			continue;
		}
		const img = readPng(file);
		keyMagenta(img);
		extractDecals(img, 6, 40).forEach((d, i) => {
			const id = `${tag}_${isGrayish(d) ? 'pebble' : 'tuft'}_${i}`;
			items.push({ id, img: d });
			decalIds.push(id);
		});
	}
	const { image, frames } = packShelf(items, 2048);
	writePng(join(outDir, 'props.png'), image);
	const anchors = Object.fromEntries(
		Object.entries(frames).map(([id, f]) => [
			`${region}/${id}`,
			{ frame: f, rotated: false, trimmed: false, spriteSourceSize: { x: 0, y: 0, w: f.w, h: f.h }, sourceSize: { w: f.w, h: f.h }, anchor: { x: 0.5, y: 1 } },
		]),
	);
	writeFileSync(join(outDir, 'props.json'), JSON.stringify({ frames: anchors, meta: { app: '@aether/asset-pipeline', image: 'props.png', format: 'RGBA8888', size: { w: image.width, h: image.height }, scale: '1' } }));
	writeFileSync(join(outDir, 'props.meta.json'), JSON.stringify(meta, null, '	'));
	console.log(`  atlas đồ vật: ${Object.keys(meta).length} đồ vật + ${decalIds.length} decal → ${image.width}×${image.height}`);

	const { maps, index } = build.build(meta, decalIds);
	const byId = Object.fromEntries(items.map((it) => [it.id, it.img]));
	for (const map of maps) {
		writeFileSync(join(outDir, `${map.id}.json`), JSON.stringify(map));
		const zones = map.monsterZones.map((z) => `${z.id}×${z.count}`).join(', ') || 'không có quái';
		console.log(`  map ${map.id} (${map.name}): ${map.width}×${map.height} ô, ${map.props.length} đồ vật, ${map.decals.length} decal, lối → ${map.exits.map((e) => e.to).join(', ')}; ${zones}`);
		// Ảnh xem trước (màu phẳng theo địa hình + đồ vật thật), thu nhỏ 1/4 để duyệt bố cục; cùng hàm với minimap.
		writePng(join(REPORTS, region === 'human' ? `map-${map.id}-preview.png` : `map-${region}-${map.id}-preview.png`), renderOverview(map, byId, 4));
		writeMinimap(outDir, map.id, map, byId);
	}
	writeFileSync(join(outDir, 'world.json'), `${JSON.stringify(index, null, '	')}
`);
	console.log(`  chỉ mục thế giới: ${join(outDir, 'world.json')} · ảnh xem trước: ${join(REPORTS, 'map-<id>-preview.png')}`);
}

/**
 * Ảnh giao diện cổ (khung 9 mảnh, nút, dải tiêu đề, biểu tượng) cắt từ tấm PixelLab → `assets/ui/` + `ui.json`.
 * Tấm nào chưa vẽ thì bỏ qua món đó (web tự dùng khung CSS dự phòng).
 */
function buildUi(): void {
	const sheetsDir = join(PIXELLAB_SOURCES, 'sheets');
	const outDir = join(WEB_ASSETS, 'ui');
	mkdirSync(outDir, { recursive: true });
	const manifest: Record<string, { file: string; w: number; h: number; slice?: NineSlice }> = {};
	const cut: RGBAImage[] = [];
	for (const def of UI_ASSETS) {
		const cell = parseSheetPath(def.path);
		if (!cell || !existsSync(join(sheetsDir, `${cell.sheet}.png`))) {
			console.log(`  … ${def.id}: chưa có tấm ${cell?.sheet ?? def.path} — bỏ qua`);
			continue;
		}
		let img: RGBAImage;
		try {
			img = loadSheetCell(sheetsDir, cell);
		} catch (e) {
			console.log(`  ✘ ${def.id}: ${e instanceof Error ? e.message : String(e)} — bỏ qua`);
			continue;
		}
		let slice: NineSlice | undefined;
		if (def.nine === 'hollow') {
			const m = measureHollow(img);
			if (!m) {
				console.log(`  ✘ ${def.id}: khung không rỗng ruột (không đo được viền) — bỏ qua`);
				continue;
			}
			slice = m;
		} else if (def.nine === 'filled') slice = filledSlice(img, def.capX ?? 0.25, def.capY ?? 0.4);
		writePng(join(outDir, `${def.id}.png`), img);
		manifest[def.id] = { file: `${def.id}.png`, w: img.width, h: img.height, ...(slice ? { slice } : {}) };
		cut.push(img);
		console.log(`  ✔ ${def.id}: ${img.width}×${img.height}${slice ? ` · viền ${slice.top}/${slice.right}/${slice.bottom}/${slice.left}` : ''}`);
	}
	writeFileSync(join(outDir, 'ui.json'), `${JSON.stringify(manifest, null, '	')}
`);
	if (cut.length) writePng(join(REPORTS, 'ui-preview.png'), scaleNearest(sheetPreview(cut, 4), 2));
	console.log(`  ${Object.keys(manifest).length} ảnh giao diện → ${outDir}`);
}

/** Khổ tranh lục địa mà toạ độ 10 vùng (`packages/sim/src/worldAtlas.ts` — `CONTINENT_SIZE`) đo trên đó. */
const CONTINENT_SIZE = { w: 688, h: 384 };

/**
 * Tranh lục địa (bản đồ tổng phím M — docs/ke-hoach-the-gioi.md mục 3.1) → `ui/world-continent.png`. Chép NGUYÊN file (không nén
 * lại: web hiện nguyên lần 1× / 2×) sau khi kiểm đúng khổ của toạ độ vùng và ảnh kín (tranh vẽ cả biển, không có điểm trong suốt).
 * Vẽ lại tranh khác bố cục thì đo lại toạ độ ở `worldAtlas.ts`. Dựng thử: `AETHER_ASSETS=<thư mục nháp> npm run assets:world`.
 */
function buildWorld(): void {
	const src = join(PIXELLAB_SOURCES, 'world', 'continent.png');
	if (!existsSync(src)) throw new Error(`Thiếu tranh lục địa ${src}`);
	const buf = readFileSync(src);
	const img = decodePng(buf);
	if (img.width !== CONTINENT_SIZE.w || img.height !== CONTINENT_SIZE.h) {
		throw new Error(`Tranh lục địa ${img.width}×${img.height}, toạ độ vùng đo trên ${CONTINENT_SIZE.w}×${CONTINENT_SIZE.h} — đo lại worldAtlas.ts rồi sửa CONTINENT_SIZE`);
	}
	let clear = 0;
	for (let i = 3; i < img.data.length; i += 4) if (img.data[i]! < 255) clear += 1;
	if (clear) throw new Error(`Tranh lục địa có ${clear} điểm trong suốt — phải là ảnh kín`);
	const out = join(WEB_ASSETS, 'ui', 'world-continent.png');
	mkdirSync(dirname(out), { recursive: true });
	writeFileSync(out, buf);
	console.log(`  ✔ tranh lục địa ${img.width}×${img.height} (${Math.round(buf.length / 1024)} KB) → ${out}`);
}

/**
 * Atlas icon chiêu (`props/skillIcons.ts`) → CHỈ ghi `ui/skill-icons.png` + `ui/skill-icons.json` (không đụng ảnh giao diện
 * khác / `ui.json` như lệnh `ui`). Mặc định bộ v2: một ảnh 32×32 mỗi khoá ở `sources/pixellab/skill-icons-v2/`; `--v1` = bộ cũ
 * 10 tấm 3×3 ở `sources/pixellab/skill-icons/` (lưu trữ). Icon lỗi thì báo, bỏ icon đó — web tự rơi về icon tạm cũ.
 * Dựng thử: `AETHER_ASSETS=<thư mục nháp> npm run skill-icons -w @aether/asset-pipeline`.
 */
function buildSkillIconAtlas(args: string[]): void {
	const outDir = join(WEB_ASSETS, 'ui');
	const previewPath = join(REPORTS, 'skill-icons-preview.png');
	let r: { count: number; total: number; pitch: number; size: { w: number; h: number } };
	if (args.includes('--v1')) {
		const v1 = buildSkillIcons({ sourceDir: join(PIXELLAB_SOURCES, 'skill-icons'), outDir, previewPath });
		for (const i of v1.issues) console.log(`  ${i.dropped ? '✘' : '⚠'} ${i.key} (${i.sheet} ô ${i.index}): ${i.reason}${i.dropped ? ' — bỏ' : ''}`);
		r = v1;
	} else {
		const v2 = buildSkillIconsV2({ sourceDir: join(PIXELLAB_SOURCES, 'skill-icons-v2'), outDir, previewPath });
		for (const i of v2.issues) console.log(`  ${i.dropped ? '✘' : '⚠'} ${i.key} (${i.file}): ${i.reason}${i.dropped ? ' — bỏ' : ''}`);
		r = v2;
	}
	if (!r.count) {
		console.log('  ✘ không có icon nào dùng được — không ghi atlas');
		process.exitCode = 1;
		return;
	}
	console.log(`  ✔ ${r.count}/${r.total} icon · bước lưới ${r.pitch}px · atlas ${r.size.w}×${r.size.h} → ${join(outDir, 'skill-icons.{png,json}')}`);
	console.log(`  ảnh duyệt (thứ tự bảng khoá, icon bỏ để ô trống): ${previewPath}`);
}

/** Cụm decal gần như không có sắc (xám/nâu xám) → sỏi. */
function isGrayish(img: RGBAImage): boolean {
	let sat = 0;
	let n = 0;
	for (let i = 0; i < img.data.length; i += 4) {
		if (!img.data[i + 3]) continue;
		const r = img.data[i]!;
		const g = img.data[i + 1]!;
		const b = img.data[i + 2]!;
		sat += Math.max(r, g, b) - Math.min(r, g, b);
		n += 1;
	}
	return n > 0 && sat / n < 28;
}

/** Chỉ dựng lại ảnh minimap từ map + atlas ĐÃ xuất — không đụng <map>.json/props.* (khác lệnh `map`). */
function buildMapOverview(region = 'human'): void {
	const dir = join(WEB_ASSETS, 'maps', region);
	const index = JSON.parse(readFileSync(join(dir, 'world.json'), 'utf8')) as WorldIndex;
	for (const id of Object.keys(index.maps)) {
		const mini = writeMinimap(dir, id);
		console.log(`✔ minimap ${id}: ${mini.png} (${mini.width}×${mini.height}) + ${mini.json}`);
	}
}

/**
 * Atlas hiệu ứng chiến đấu: mỗi hiệu ứng một chuỗi frame, tên animation = id hiệu ứng, tên frame `<id>_<i>`.
 * Hiệu ứng nào có thư mục PixelLab ĐỦ khung (`sources/pixellab/vfx/<id>/`, lệnh `pixellab vfx`) thì dùng khung
 * PixelLab vẽ (số frame theo PixelLab); chưa có thì giữ khung cũ dựng từ ảnh tĩnh FreePixel như trước.
 */
async function buildVfx(): Promise<void> {
	const cache = join(CACHE, 'freepixel', 'props');
	const items: { id: string; img: RGBAImage }[] = [];
	const animations: Record<string, string[]> = {};
	const rows: RGBAImage[][] = [];
	// Atlas phụ `vfx-ult` (tuyệt kỹ mốc 10 — chỉ phòng tập tải): cùng cách đóng, chỉ khác tấm.
	const ultItems: { id: string; img: RGBAImage }[] = [];
	const ultAnimations: Record<string, string[]> = {};
	const byPixelLab: string[] = [];
	const legacy: string[] = [];
	for (const def of VFX) {
		// Vẽ sẵn nhưng game chưa dùng (tuyệt kỹ, chiêu rồng / boss của vùng chưa có map): để ngoài atlas — mọi người chơi đều
		// tải tấm atlas này, và cạnh atlas phải ≤ 4096. Nối vào game thì bỏ cờ `later`.
		if (def.later) {
			console.log(`  … ${def.id}: chưa dùng trong game (later) — để ngoài atlas`);
			continue;
		}
		const pl = loadPixelLabVfx(VFX_PIXELLAB_SOURCES, def);
		let frames: RGBAImage[];
		if (pl.status === 'ok') {
			frames = pl.frames;
			byPixelLab.push(def.id);
			console.log(`  ✔ ${def.id}: PixelLab — ${pl.note}`);
		} else {
			if (pl.status === 'incomplete') console.log(`  ⚠ ${def.id}: thư mục PixelLab chưa dùng được (${pl.reason}) → giữ bản cũ`);
			if (!def.file) {
				// Hiệu ứng chỉ có bản PixelLab mà chưa vẽ: bỏ khỏi atlas, game tự bỏ qua id thiếu khung.
				console.log(`  … ${def.id}: chưa có bản PixelLab (lệnh \`pixellab vfx\`) — bỏ qua`);
				continue;
			}
			const src = await loadFreePixelImage(cache, def.file);
			const issues = propIssues(src);
			if (issues.length) {
				console.log(`  ✘ ${def.id}: ${issues.join('; ')} — bỏ qua`);
				continue;
			}
			frames = buildVfxFrames(def, src);
			legacy.push(def.id);
		}
		const ult = def.atlas === 'ult';
		(ult ? ultAnimations : animations)[def.id] = frames.map((img, i) => {
			const id = `vfx/${def.id}_${i}`;
			(ult ? ultItems : items).push({ id, img });
			return id;
		});
		if (!ult) rows.push(frames);
	}
	const outDir = join(WEB_ASSETS, 'vfx');
	const writeAtlas = (name: string, list: { id: string; img: RGBAImage }[], anims: Record<string, string[]>): { w: number; h: number } => {
		const { image, frames } = packShelf(list, 2048);
		writePng(join(outDir, `${name}.png`), image);
		const json = {
			frames: Object.fromEntries(
				Object.entries(frames).map(([id, f]) => [
					id,
					{ frame: f, rotated: false, trimmed: false, spriteSourceSize: { x: 0, y: 0, w: f.w, h: f.h }, sourceSize: { w: f.w, h: f.h }, anchor: { x: 0.5, y: 0.5 } },
				]),
			),
			animations: anims,
			meta: { app: '@aether/asset-pipeline', image: `${name}.png`, format: 'RGBA8888', size: { w: image.width, h: image.height }, scale: '1' },
		};
		writeFileSync(join(outDir, `${name}.json`), JSON.stringify(json));
		return { w: image.width, h: image.height };
	};
	const main = writeAtlas('vfx', items, animations);
	console.log(`  atlas hiệu ứng: ${Object.keys(animations).length} hiệu ứng, ${items.length} frame → ${main.w}×${main.h}`);
	if (ultItems.length) {
		const u = writeAtlas('vfx-ult', ultItems, ultAnimations);
		console.log(`  atlas tuyệt kỹ (vfx-ult, chỉ phòng tập): ${Object.keys(ultAnimations).length} hiệu ứng, ${ultItems.length} frame → ${u.w}×${u.h}`);
	}
	console.log(`  PixelLab vẽ (${byPixelLab.length}): ${byPixelLab.join(', ') || '—'}`);
	console.log(`  còn bản cũ sinh từ ảnh tĩnh (${legacy.length}): ${legacy.join(', ') || '—'}`);

	// Ảnh duyệt: mỗi hàng một hiệu ứng, các frame xếp ngang trên nền tối.
	const S = 2;
	const cellW = Math.max(...rows.flat().map((f) => f.width)) * S + 6;
	const cellH = rows.map((r) => r[0]!.height * S + 6);
	const sheet = createImage(cellW * Math.max(...rows.map((r) => r.length)), cellH.reduce((a, b) => a + b, 0));
	fill(sheet, [16, 18, 26, 255]);
	let y = 0;
	rows.forEach((r, ri) => {
		r.forEach((f, fi) => {
			for (let py = 0; py < f.height * S; py += 1)
				for (let px = 0; px < f.width * S; px += 1) {
					const i = (Math.floor(py / S) * f.width + Math.floor(px / S)) * 4;
					if (f.data[i + 3]) sheet.data.set(f.data.subarray(i, i + 4), ((y + 3 + py) * sheet.width + fi * cellW + 3 + px) * 4);
				}
		});
		y += cellH[ri]!;
	});
	writePng(join(REPORTS, 'vfx-preview.png'), sheet);
	console.log(`  ảnh duyệt: ${join(REPORTS, 'vfx-preview.png')}`);
}

/**
 * `anchors [id...]`: ghi neo đồ gắn vào atlas ĐÃ XUẤT (mặc định mọi nhân vật role player trong manifest) mà KHÔNG dựng lại
 * atlas — ảnh PNG giữ nguyên từng byte, JSON chỉ thêm trường `gear` ở mỗi khung. Dùng khi đổi thuật toán neo hoặc với atlas
 * xuất trước khi có neo; dựng lại bằng `character` cũng tự ghi neo.
 */
function annotatePublished(ids: string[]): void {
	const manifest = JSON.parse(readFileSync(join(WEB_ASSETS, 'manifest.json'), 'utf8')) as { characters: Record<string, { role: string; atlas: string }> };
	const targets = ids.length ? ids : Object.entries(manifest.characters).filter(([, c]) => c.role === 'player').map(([id]) => id);
	for (const id of targets) {
		const entry = manifest.characters[id];
		if (!entry) {
			console.log(`✘ ${id}: không có trong manifest`);
			process.exitCode = 1;
			continue;
		}
		const jsonPath = join(WEB_ASSETS, entry.atlas);
		const json = JSON.parse(readFileSync(jsonPath, 'utf8')) as Parameters<typeof annotateAtlas>[0];
		const n = annotateAtlas(json, readPng(jsonPath.replace(/\.json$/, '.png')));
		writeFileSync(jsonPath, JSON.stringify(json));
		console.log(`✔ ${id}: neo đồ gắn cho ${n}/${Object.keys(json.frames).length} khung → ${entry.atlas}`);
	}
}

async function main(): Promise<void> {
	const [cmd, ...args] = process.argv.slice(2);
	const env = loadEnv(ROOT);
	console.log(`(Pixler key: ${describeSecret(env.PIXELER_API_KEY)}, SpriteLab key: ${describeSecret(env.SPRITELAB_API_KEY)})`);
	if (cmd === 'catalog') return catalog();
	if (cmd === 'character') {
		const targets = args.length ? args : ['player_lior_child'];
		let ok = true;
		for (const t of targets) {
			try {
				ok = (await buildCharacter(t)) && ok;
			} catch (e) {
				console.log(`✘ ${t}: ${e instanceof Error ? e.message : String(e)}`);
				ok = false;
			}
		}
		if (!ok) process.exitCode = 1;
		return;
	}
	if (cmd === 'pixler') return pixler(args);
	if (cmd === 'pixellab') {
		// `pixellab download <id-trong-game> <uuid-PixelLab>`: tải gói nhân vật (ảnh xoay + animation) về sources/pixellab/<id>/.
		const [sub, id, uuid] = args;
		const tokens = (loadEnv(ROOT).PIXELLAB_TOKENS ?? '').split(',').map((t) => t.trim()).filter(Boolean);
		if (sub === 'balances') {
			// Lượt còn lại của từng token (token đầu = tài khoản chính). Chỉ in 4 ký tự đầu của token.
			for (const [i, t] of tokens.entries()) {
				const mcp = new PixelLabMcp(t);
				console.log(`#${i} ${mcp.label}
${await mcp.call('get_balance').catch((e: Error) => e.message)}
`);
			}
			return;
		}
		if (sub === 'call') {
			// `pixellab call <số thứ tự token> <công cụ> <JSON tham số | @file.json>` — gọi công cụ MCP bằng token đã chọn.
			const [, index, tool, raw = '{}'] = args;
			const token = tokens[Number(index)];
			if (!token || !tool) throw new Error('Cách dùng: pixellab call <token#> <tool> <json|@file>');
			const json = raw.startsWith('@') ? readFileSync(raw.slice(1), 'utf8') : raw;
			console.log(await new PixelLabMcp(token).call(tool, JSON.parse(json) as Record<string, unknown>));
			return;
		}
		if (sub === 'animimg') {
			// `pixellab animimg <token#> <ảnh.png> <thư mục ra> --action "..." [--frames N]`: animate_image từ MỘT ẢNH bất
			// kỳ (không cần sở hữu nhân vật) → frame_000.png… (ảnh 0 = ảnh đầu vào). Dùng khi token chủ nhân vật bị khoá.
			const [, index, input, out, ...flags] = args;
			const token = tokens[Number(index)];
			const action = flags[flags.indexOf('--action') + 1];
			const frames = flags.includes('--frames') ? Number(flags[flags.indexOf('--frames') + 1]) : 8;
			if (!token || !input || !out || !flags.includes('--action') || !action) throw new Error('Cách dùng: pixellab animimg <token#> <ảnh.png> <thư mục ra> --action "..." [--frames N]');
			const img = readPng(input);
			console.log(`  animate_image ${img.width}×${img.height}×${frames} ≈ ${animateImageCost(img.width, img.height, frames)} lượt (token #${index})`);
			const mcp = new PixelLabMcp(token);
			const text = await callWhenFree(mcp, 'animate_image', { first_frame_base64: readFileSync(input).toString('base64'), action, frame_count: frames, no_background: true });
			const jobId = extractJobId(text);
			if (!jobId) throw new Error(`Không đọc được job id: ${text.slice(0, 300)}`);
			console.log(`  job ${jobId} (${mcp.label})`);
			const images = await waitImages(mcp, jobId, frames + 1, { w: img.width, h: img.height });
			mkdirSync(out, { recursive: true });
			images.forEach((im, i) => writePng(join(out, `frame_${String(i).padStart(3, '0')}.png`), im));
			writeFileSync(join(out, 'animimg.json'), `${JSON.stringify({ input, action, frames, jobId, token: Number(index), createdAt: new Date().toISOString() }, null, '\t')}\n`);
			console.log(`✔ ${images.length} ảnh → ${out}`);
			return;
		}
		if (sub === 'image') {
			// `pixellab image <token#> <ảnh ra.png> @args.json`: một ảnh create_image_pro_flash (args có thể kèm
			// `style_image_path` — file PNG đọc thành base64). Dùng vẽ TẤM nhiều đồ vật cùng style; `map`/`ui` cắt từng ô bằng props/sheet.ts.
			const [, index, out, src] = args;
			const token = tokens[Number(index)];
			if (!token || !out || !src?.startsWith('@')) throw new Error('Cách dùng: pixellab image <token#> <ảnh ra.png> @args.json');
			const raw = JSON.parse(readFileSync(src.slice(1), 'utf8')) as Record<string, unknown> & { style_image_path?: string; style_usage?: string };
			const { style_image_path: stylePath, style_usage: usage, ...call } = raw;
			if (stylePath) call.style_image = { base64: readFileSync(stylePath).toString('base64'), usage_description: usage ?? null };
			const mcp = new PixelLabMcp(token);
			const text = await callWhenFree(mcp, 'create_image_pro_flash', call);
			const jobId = extractJobId(text);
			if (!jobId) throw new Error(`Không đọc được job id: ${text.slice(0, 300)}`);
			console.log(`  job ${jobId} (${mcp.label})`);
			const [img] = await waitImages(mcp, jobId, 1);
			mkdirSync(dirname(out), { recursive: true });
			writePng(out, img!);
			writeFileSync(`${out}.json`, `${JSON.stringify({ ...call, style_image: stylePath ? { path: stylePath, usage_description: usage ?? null } : null, jobId, token: Number(index), createdAt: new Date().toISOString() }, null, '\t')}\n`);
			console.log(`✔ ${img!.width}×${img!.height} → ${out}`);
			return;
		}
		if (sub === 'pro') {
			// `pixellab pro <token#> <ảnh ra.png> @args.json`: một ảnh create_image_pro (Pro — đẹp nhất, 20–40 lượt, tới 688×384
			// khung 16:9 / 512×512). Dùng cho tranh lớn vẽ một lần (bản đồ lục địa). Trên 170px chỉ ra một ứng viên.
			const [, index, out, src] = args;
			const token = tokens[Number(index)];
			if (!token || !out || !src?.startsWith('@')) throw new Error('Cách dùng: pixellab pro <token#> <ảnh ra.png> @args.json');
			const call = JSON.parse(readFileSync(src.slice(1), 'utf8')) as Record<string, unknown>;
			const mcp = new PixelLabMcp(token);
			const text = await callWhenFree(mcp, 'create_image_pro', call);
			const jobId = extractJobId(text);
			if (!jobId) throw new Error(`Không đọc được job id: ${text.slice(0, 300)}`);
			console.log(`  job ${jobId} (${mcp.label})`);
			const [img] = await waitImages(mcp, jobId, 1);
			mkdirSync(dirname(out), { recursive: true });
			writePng(out, img!);
			writeFileSync(`${out}.json`, `${JSON.stringify({ tool: 'create_image_pro', ...call, jobId, token: Number(index), createdAt: new Date().toISOString() }, null, '	')}
`);
			console.log(`✔ ${img!.width}×${img!.height} → ${out}`);
			return;
		}
		if (sub === 'pixflux' || sub === 'pixen') {
			// `pixellab pixflux|pixen <token#> <ảnh ra.png> @args.json [--force]`: MỘT ảnh create_image_pixflux / create_image_pixen
			// (1 lượt — ảnh nhỏ sạch, vd icon chiêu 32×32 `sources/pixellab/skill-icons-v2/`). Tham số theo schema công cụ, thêm
			// `color_image_path` (pixflux: PNG bảng màu ÉP, chỉ đọc màu) và `init_image_path` (pixflux img2img) — đọc thành base64.
			// Ghi `<ảnh ra>.json` = tham số (đường dẫn thay base64) + job id. Job đã trả lượt ghi vào `<ảnh ra>.pending.json` trước
			// khi chờ: lệnh chết giữa chừng thì chạy lại đúng lệnh → chỉ tải tiếp, không gửi job mới. Ảnh ra đã có thì bỏ qua.
			const [, index, out, src, ...flags] = args;
			const token = tokens[Number(index)];
			if (!token || !out || !src?.startsWith('@')) throw new Error(`Cách dùng: pixellab ${sub} <token#> <ảnh ra.png> @args.json [--force]`);
			const pendingPath = `${out}.pending.json`;
			if (existsSync(out) && !flags.includes('--force') && !existsSync(pendingPath)) {
				console.log(`  … ${out} đã có — bỏ qua (--force để vẽ lại)`);
				return;
			}
			const raw = JSON.parse(readFileSync(src.slice(1), 'utf8')) as Record<string, unknown> & { color_image_path?: string; init_image_path?: string };
			const { color_image_path: palettePath, init_image_path: initPath, ...call } = raw;
			if (sub === 'pixen' && (palettePath || initPath)) throw new Error('pixen không nhận bảng màu ép / ảnh khởi đầu — dùng pixflux');
			const tool = `create_image_${sub}`;
			const mcp = new PixelLabMcp(token);
			let jobId = existsSync(pendingPath) ? (JSON.parse(readFileSync(pendingPath, 'utf8')) as { jobId: string }).jobId : null;
			if (jobId) console.log(`  TẢI TIẾP job ${jobId} (${pendingPath}, không tốn lượt)`);
			else {
				const body = { ...call };
				if (palettePath) body.color_image_base64 = readFileSync(palettePath).toString('base64');
				if (initPath) body.init_image_base64 = readFileSync(initPath).toString('base64');
				const text = await callWhenFree(mcp, tool, body);
				jobId = extractJobId(text);
				if (!jobId) throw new Error(`Không đọc được job id: ${text.slice(0, 300)}`);
				mkdirSync(dirname(out), { recursive: true });
				writeFileSync(pendingPath, `${JSON.stringify({ tool, jobId, token: Number(index) })}\n`);
				console.log(`  ${tool} (1 lượt) → job ${jobId} (${mcp.label})`);
			}
			const size = typeof call.width === 'number' && typeof call.height === 'number' ? { w: call.width, h: call.height } : undefined;
			const [img] = await waitImages(mcp, jobId, 1, size);
			writePng(out, img!);
			const meta = { tool, ...call, ...(palettePath ? { color_image_path: palettePath } : {}), ...(initPath ? { init_image_path: initPath } : {}), jobId, token: Number(index), createdAt: new Date().toISOString() };
			writeFileSync(`${out}.json`, `${JSON.stringify(meta, null, '\t')}\n`);
			rmSync(pendingPath, { force: true });
			console.log(`✔ ${img!.width}×${img!.height} → ${out}`);
			return;
		}
		if (sub === 'vfx') return pixellabVfx(args.slice(1), tokens);
		if (sub === 'animate') return animate(id, args.slice(2), tokens);
		if (sub === 'walk') {
			// Bí danh cũ: `pixellab walk <id> [--name walk-b] [hướng…]` = animate mẫu walking-8-frames, mặc định 5 hướng
			// gốc (3 hướng phía tây pipeline tự lật gương). `--name walk-b`: vẽ lại vài hướng hỏng thành animation
			// RIÊNG (không đè bản gốc); spec khai `"walk": ["walk-b", "walk"]` để hướng có bản vẽ lại dùng bản đó.
			return animate(id, ['walk', '--template', 'walking-8-frames', ...args.slice(2)], tokens, ['south', 'south-east', 'east', 'north-east', 'north']);
		}
		if (sub === 'waitchar') {
			// `pixellab waitchar <token#> <uuid>`: chờ nhân vật vừa tạo dựng xong cả 8 hướng (list_jobs không hiện việc này).
			// Hỏng (vd "heavy load") thì in lý do và thoát mã 2 để hàng đợi không tải/vẽ walk vào nhân vật hỏng.
			const [, index, charId] = args;
			const mcp = new PixelLabMcp(tokens[Number(index)]!);
			await waitCharacter(mcp, charId!);
			const text = await mcp.call('get_character', { character_id: charId });
			const failed = /status:\s*failed/i.test(text);
			const head = text.split(/\r?\n/).slice(0, 6).join(' | ');
			console.log(failed ? `HỎNG: ${head}` : `✔ nhân vật ${charId} đã xong`);
			if (failed) process.exitCode = 2;
			return;
		}
		if (sub === 'wait') {
			await waitJobs(new PixelLabMcp(tokens[Number(id)]!));
			return;
		}
		if (sub === 'object') {
			// `pixellab object <token#> <tên> <@args.json | object_id có sẵn>`: tạo đồ vật Pro Flash (hoặc chờ một
			// object đã gửi), chờ vẽ xong rồi tải về sources/pixellab/objects/<tên>/.
			const [, index, name, src] = args;
			const token = tokens[Number(index)];
			if (!token || !name || !src) throw new Error('Cách dùng: pixellab object <token#> <tên> <@args.json | object_id>');
			const mcp = new PixelLabMcp(token);
			let objectId = src;
			if (src.startsWith('@')) {
				const text = await callWhenFree(mcp, 'create_object_pro_flash', JSON.parse(readFileSync(src.slice(1), 'utf8')) as Record<string, unknown>);
				objectId = /"object_id":\s*"([0-9a-f-]{36})"/.exec(text)?.[1] ?? '';
				if (!objectId) throw new Error(`Không tạo được đồ vật ${name}: ${text.slice(0, 300)}`);
				console.log(`  ${name} → object ${objectId} (${mcp.label})`);
			}
			const deadline = Date.now() + 2 * 3600 * 1000;
			for (;;) {
				await sleep(20_000);
				const text = await mcp.call('get_object', { object_id: objectId });
				if (!/status:\s*(creating|pending|processing|queued)/i.test(text) && !/job_status:\s*(pending|processing)/i.test(text)) break;
				if (Date.now() > deadline) throw new Error(`Chờ đồ vật ${name} quá 2 giờ`);
			}
			const res = await fetch(`https://api.pixellab.ai/mcp/objects/${objectId}/download`);
			if (!res.ok) throw new Error(`Tải đồ vật ${name} lỗi HTTP ${res.status}`);
			const buf = Buffer.from(await res.arrayBuffer());
			const dir = join(PIXELLAB_SOURCES, 'objects', name);
			mkdirSync(dir, { recursive: true });
			// Một hướng thì tải về PNG, tám hướng thì ZIP (chữ ký "PK").
			if (buf.subarray(0, 2).toString('latin1') === 'PK') {
				for (const [file, data] of unzip(buf)) {
					mkdirSync(dirname(join(dir, file)), { recursive: true });
					writeFileSync(join(dir, file), data);
				}
			} else writeFileSync(join(dir, `${name}.png`), buf);
			writeFileSync(join(dir, 'pixellab.json'), `${JSON.stringify({ objectId, downloadedAt: new Date().toISOString() }, null, '\t')}\n`);
			console.log(`✔ đồ vật ${name} ← PixelLab ${objectId} → ${dir}`);
			return;
		}
		if (sub !== 'download' || !id || !uuid) throw new Error('Cách dùng: pixellab download <id> <uuid> | balances | call <token#> <tool> <json> | pixflux|pixen <token#> <ảnh ra.png> @args.json [--force] | animate <id> <anim> (--template <mẫu> | --mode v3 --action "...") [--name <tên>] [--dry] [hướng…] | walk <id> [hướng…] | wait <token#> | vfx <token#> <vfxId> [--model pixen|pixflux|pro_flash] [--first "..."] [--action "..."] [--size N] [--first-size N] [--frames N] [--first-image <png>] [--redraw-first] [--first-only] [--force] [--dry]');
		const files = await downloadPixelLab(PIXELLAB_SOURCES, id, uuid);
		console.log(`✔ ${id}: ${files.length} file ← PixelLab ${uuid}`);
		return;
	}
	if (cmd === 'map') return buildMap(args[0]);
	if (cmd === 'map-overview') return buildMapOverview(args[0]);
	if (cmd === 'vfx') return buildVfx();
	if (cmd === 'ui') return buildUi();
	if (cmd === 'world') return buildWorld();
	if (cmd === 'skill-icons') return buildSkillIconAtlas(args);
	if (cmd === 'anchors') return annotatePublished(args);
	console.log('Lệnh: catalog | character [specId...] | anchors [id...] | pixler <quota|base|select|direction|animate> ...');
}

main().catch((e) => {
	console.error(e instanceof Error ? e.message : e);
	process.exitCode = 1;
});

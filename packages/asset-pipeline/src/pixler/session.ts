import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { blit, createImage, crop, readPng, scaleNearest, writePng, type RGBAImage } from '../image/rgba.js';
import type { AnimationFrames } from '../normalize/PixelStyleNormalizer.js';
import type { PixlerAnimationPreset, PixlerProvider } from '../providers/PixlerProvider.js';
import { DIRECTIONS, type AnimationName, type Direction } from '../providers/types.js';

/**
 * Quy trình Pixler NHIỀU NGÀY: mỗi bước gọi API xong là ghi ngay job id + PNG vào
 * `sources/pixler/<id>/` (commit được — asset của mình), vì link CDN hết hạn và mỗi lượt sinh là
 * quota. Chạy lại một bước đã xong thì đọc từ đĩa, không gọi API lần hai.
 */
export interface PixlerState {
	characterId: string;
	base?: { jobId: string; prompt: string; files: string[]; selected: number | null; createdAt: string };
	directions: Partial<Record<Direction, { jobId: string; imageIndex: number; file: string; instruction: string }>>;
	animations: Partial<Record<AnimationName, Partial<Record<Direction, { jobId: string; preset: string; files: string[] }>>>>;
	log: { at: string; action: string; jobId: string; note?: string }[];
}

/** Hướng sinh thật bằng /edit; hướng còn lại lật gương từ hướng đối xứng. */
export const MIRROR_OF: Partial<Record<Direction, Direction>> = { W: 'E', SW: 'SE', NW: 'NE' };

const DIRECTION_INSTRUCTION: Record<Direction, string> = {
	S: 'facing the viewer, front view',
	SE: 'turned three-quarter to the right, facing down-right (south-east), three-quarter front view',
	E: 'turned to face right, full side profile view (east)',
	NE: 'turned away three-quarter to the right, facing up-right (north-east), three-quarter back view',
	N: 'turned around facing away from the viewer, full back view (north)',
	NW: '',
	W: '',
	SW: '',
};

const PRESET: Partial<Record<AnimationName, PixlerAnimationPreset>> = { idle: 'Idle', walk: 'Walk', run: 'Run', attack: 'Attack', cast: 'Cast', hit: 'Hurt', death: 'Death' };

export class PixlerSession {
	readonly dir: string;
	state: PixlerState;

	constructor(
		root: string,
		readonly characterId: string,
		private readonly api: PixlerProvider,
	) {
		this.dir = join(root, characterId);
		mkdirSync(this.dir, { recursive: true });
		const file = join(this.dir, 'state.json');
		this.state = existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as PixlerState) : { characterId, directions: {}, animations: {}, log: [] };
	}

	/** Bước 1: sinh ứng viên hướng S. Một lượt quota cho `count` ảnh. */
	async base(prompt: string, size: { width: number; height: number }, count: number): Promise<string[]> {
		if (this.state.base) {
			console.log(`  base đã có (job ${this.state.base.jobId}) — dùng lại, không sinh mới`);
			return this.state.base.files;
		}
		const job = await this.api.generate({ prompt, width: size.width, height: size.height, count });
		const files: string[] = [];
		for (const img of job.images ?? []) {
			const name = `base-${img.index}.png`;
			writeFileSync(join(this.dir, name), await this.api.downloadPng(job.id, img.index));
			files.push(name);
		}
		this.state.base = { jobId: job.id, prompt, files, selected: null, createdAt: new Date().toISOString() };
		this.note('generate', job.id, `${files.length} ứng viên ${size.width}×${size.height}`);
		return files;
	}

	select(index: number, reason: string): void {
		if (!this.state.base) throw new Error('Chưa có base — chạy bước base trước');
		if (!this.state.base.files[index]) throw new Error(`Không có ứng viên #${index}`);
		this.state.base.selected = index;
		this.state.directions.S = { jobId: this.state.base.jobId, imageIndex: index, file: this.state.base.files[index]!, instruction: 'base' };
		this.note('select', this.state.base.jobId, `#${index}: ${reason}`);
	}

	/** Bước 2: sinh hướng khác từ ảnh S đã chọn — mỗi hướng một lượt quota. */
	async direction(dir: Direction, identityHint: string, opts: { replace?: boolean; extra?: string } = {}): Promise<string> {
		const done = this.state.directions[dir];
		if (done && !opts.replace) return done.file;
		if (MIRROR_OF[dir]) throw new Error(`${dir} lấy bằng lật gương từ ${MIRROR_OF[dir]}, không sinh`);
		const s = this.state.directions.S;
		if (!s) throw new Error('Chưa chọn ảnh base hướng S');
		const instruction = `Same exact character (${identityHint}), same outfit, colors, staff and proportions, same size and pixel style, now ${DIRECTION_INSTRUCTION[dir]}. Full body, transparent background.${opts.extra ? ` ${opts.extra}` : ''}`;
		const job = await this.api.edit({ jobId: s.jobId, imageIndex: s.imageIndex, instruction });
		// Bản sinh lại giữ file cũ trên đĩa (đổi tên theo job) để còn so sánh.
		const file = done ? `dir-${dir}-${job.id.slice(4, 12)}.png` : `dir-${dir}.png`;
		writeFileSync(join(this.dir, file), await this.api.downloadPng(job.id, 0));
		this.state.directions[dir] = { jobId: job.id, imageIndex: 0, file, instruction };
		this.note('edit', job.id, `${dir}${done ? ` (thay ${done.jobId})` : ''}${opts.extra ? `: ${opts.extra}` : ''}`);
		return file;
	}

	/** Bước 3: animation cho một hướng — một lượt animate. */
	async animate(anim: AnimationName, dir: Direction, frameCount: number, opts: { customPrompt?: string; replace?: boolean } = {}): Promise<string[]> {
		const done = this.state.animations[anim]?.[dir];
		if (done && !opts.replace) return done.files;
		const preset = opts.customPrompt ? 'Custom' : PRESET[anim];
		if (!preset) throw new Error(`Pixler không có preset cho ${anim}`);
		const src = this.state.directions[dir];
		if (!src) throw new Error(`Chưa có ảnh hướng ${dir}`);
		const job = await this.api.animate({ jobId: src.jobId, imageIndex: src.imageIndex, preset, frameCount, customPrompt: opts.customPrompt?.slice(0, 120) });
		// Bản cũ giữ lại trên đĩa (đổi tên theo job) để còn so sánh, không ghi đè mất.
		const files: string[] = [];
		const tag = done ? `-${job.id.slice(4, 12)}` : '';
		for (const img of job.images ?? []) {
			const name = `${anim}-${dir}${tag}-${img.index}.png`;
			writeFileSync(join(this.dir, name), await this.api.downloadPng(job.id, img.index));
			files.push(name);
		}
		(this.state.animations[anim] ??= {})[dir] = { jobId: job.id, preset, files };
		this.note('animate', job.id, `${anim}/${dir} ${files.length} ảnh, preset ${preset}${opts.customPrompt ? `: ${opts.customPrompt}` : ''}${done ? ` (thay ${done.jobId})` : ''}`);
		return files;
	}

	image(file: string): RGBAImage {
		return readPng(join(this.dir, file));
	}

	/** Frame đã có trên đĩa, lật gương các hướng W/SW/NW. Hướng nào chưa có thì vắng — cổng chất lượng sẽ báo. */
	frames(animations: readonly AnimationName[], provisional: readonly Direction[] = []): AnimationFrames {
		const out: AnimationFrames = {};
		for (const anim of animations) {
			const dirs: Partial<Record<Direction, RGBAImage[]>> = {};
			for (const dir of DIRECTIONS) {
				const srcDir = MIRROR_OF[dir] ?? dir;
				const entry = this.state.animations[anim]?.[srcDir];
				let list: RGBAImage[] | null = entry ? entry.files.flatMap((f) => this.sliceStrip(this.image(f))) : null;
				if (!list && provisional.includes(dir) && this.state.directions[srcDir]) {
					list = stillFrames(this.image(this.state.directions[srcDir]!.file), anim);
				}
				if (!list) continue;
				dirs[dir] = MIRROR_OF[dir] ? list.map(flipX) : list;
			}
			out[anim] = dirs;
		}
		return out;
	}

	/** Pixler trả animation thành MỘT dải ngang (`sheet.frameCount` ô) — cắt theo bề ngang ảnh base. */
	sliceStrip(img: RGBAImage): RGBAImage[] {
		const s = this.state.directions.S;
		const fw = s ? this.image(s.file).width : img.width;
		if (img.width % fw !== 0) throw new Error(`Dải animation rộng ${img.width}px không chia hết cho bề ngang frame ${fw}px`);
		return Array.from({ length: img.width / fw }, (_, i) => crop(img, i * fw, 0, fw, img.height));
	}

	private note(action: string, jobId: string, note?: string): void {
		this.state.log.push({ at: new Date().toISOString(), action, jobId, note });
		writeFileSync(join(this.dir, 'state.json'), `${JSON.stringify(this.state, null, '\t')}\n`);
	}
}

/**
 * Frame TẠM từ một ảnh tĩnh khi hướng đó chưa có animation: idle = đứng yên, walk = nhún lên 1px theo
 * nhịp bước. Chỉ để chơi được trong lúc chờ quota; báo cáo chất lượng ghi rõ hướng nào đang tạm.
 */
function stillFrames(img: RGBAImage, anim: AnimationName): RGBAImage[] {
	if (anim !== 'walk') return [img];
	const up = createImage(img.width, img.height);
	up.data.set(img.data.subarray(img.width * 4), 0);
	return [img, up, img, up];
}

export function flipX(img: RGBAImage): RGBAImage {
	const out = createImage(img.width, img.height);
	for (let y = 0; y < img.height; y += 1) {
		for (let x = 0; x < img.width; x += 1) {
			const s = (y * img.width + x) * 4;
			const d = (y * img.width + (img.width - 1 - x)) * 4;
			out.data.set(img.data.subarray(s, s + 4), d);
		}
	}
	return out;
}

/** Ảnh duyệt: các ảnh đặt cạnh nhau trên nền caro, phóng `scale` lần. */
export function reviewStrip(images: RGBAImage[], scale: number, path: string): void {
	const w = Math.max(...images.map((i) => i.width)) * scale;
	const h = Math.max(...images.map((i) => i.height)) * scale;
	const gap = 8;
	const out = createImage(images.length * (w + gap) + gap, h + gap * 2);
	for (let y = 0; y < out.height; y += 1) {
		for (let x = 0; x < out.width; x += 1) {
			const dark = ((x >> 4) + (y >> 4)) % 2 === 0;
			out.data.set(dark ? [52, 56, 70, 255] : [64, 69, 86, 255], (y * out.width + x) * 4);
		}
	}
	images.forEach((img, i) => blit(out, scaleNearest(img, scale), gap + i * (w + gap), gap));
	writePng(path, out);
}


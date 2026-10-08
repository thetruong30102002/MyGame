import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { decodePng, type RGBAImage } from '../image/rgba.js';
import type { AnimationFrames } from '../normalize/PixelStyleNormalizer.js';
import { flipX } from '../pixler/session.js';
import { DIRECTIONS, type AnimationName, type Direction } from '../providers/types.js';
import { unzip } from './zip.js';

/** Tên hướng của PixelLab ↔ mã hướng của dự án. */
export const PL_DIR: Record<Direction, string> = {
	S: 'south',
	SW: 'south-west',
	W: 'west',
	NW: 'north-west',
	N: 'north',
	NE: 'north-east',
	E: 'east',
	SE: 'south-east',
};

/** Hướng phía tây lấy bằng lật gương hướng phía đông (khi chưa sinh riêng) — tiết kiệm 3/8 lượt animate. */
const MIRROR: Partial<Record<Direction, Direction>> = { W: 'E', SW: 'SE', NW: 'NE' };

interface Metadata {
	states: { character: { id: string; name: string; size: { width: number; height: number } }; folder: string; frames: { rotations: Record<string, string>; animations: Record<string, unknown> } }[];
}

/**
 * Tải trọn gói nhân vật PixelLab (ảnh xoay 8 hướng + mọi animation + metadata.json) về
 * `sources/pixellab/<id>/`. Link tải là link công khai của PixelLab, không cần token.
 */
export async function downloadPixelLab(root: string, localId: string, uuid: string): Promise<string[]> {
	const url = `https://api.pixellab.ai/mcp/characters/${uuid}/download`;
	let res = await fetch(url);
	// 423 = nhân vật còn đang vẽ dở → chờ rồi thử lại, tối đa ~30 phút.
	for (let i = 0; res.status === 423 && i < 60; i += 1) {
		await new Promise((r) => setTimeout(r, 30_000));
		res = await fetch(url);
	}
	if (!res.ok) throw new Error(`Tải gói PixelLab ${uuid} lỗi HTTP ${res.status}`);
	const files = unzip(Buffer.from(await res.arrayBuffer()));
	const dir = join(root, localId);
	for (const [name, data] of files) {
		const path = join(dir, name);
		mkdirSync(dirname(path), { recursive: true });
		writeFileSync(path, data);
	}
	writeFileSync(join(dir, 'pixellab.json'), `${JSON.stringify({ uuid, downloadedAt: new Date().toISOString() }, null, '\t')}\n`);
	return [...files.keys()];
}

/** Đọc gói đã tải: animation thật nếu có, không thì (với hướng được phép TẠM) dựng frame từ ảnh xoay. */
export class PixelLabSource {
	private readonly meta: Metadata;

	constructor(private readonly dir: string) {
		const path = join(dir, 'metadata.json');
		if (!existsSync(path)) throw new Error(`Chưa tải gói PixelLab: thiếu ${path} (chạy \`pixellab download\`)`);
		this.meta = JSON.parse(readFileSync(path, 'utf8')) as Metadata;
	}

	get state() {
		return this.meta.states[0]!;
	}

	rotation(dir: Direction): RGBAImage | null {
		const file = this.state.frames.rotations[PL_DIR[dir]];
		return file ? this.png(file) : null;
	}

	/**
	 * Danh sách file frame của một animation PixelLab theo hướng (chấp nhận vài dạng metadata). Gói tải về không có
	 * tên đó thì tìm ở `extra/<tên>/<hướng>/frame_*.png` — khung vẽ bằng `pixellab animimg` từ ảnh xoay (token chủ nhân
	 * vật bị khoá), để riêng ngoài gói nên tải lại gói không đè mất.
	 */
	animationFiles(name: string, dir: Direction): string[] {
		const anim = this.state.frames.animations[name] as unknown;
		if (!anim || typeof anim !== 'object') return this.extraFiles(name, dir);
		const byDir = (anim as Record<string, unknown>)[PL_DIR[dir]];
		if (Array.isArray(byDir)) return byDir.filter((f): f is string => typeof f === 'string');
		if (byDir && typeof byDir === 'object' && Array.isArray((byDir as { frames?: unknown }).frames)) return (byDir as { frames: string[] }).frames;
		return [];
	}

	animationNames(): string[] {
		const extra = join(this.dir, 'extra');
		const extras = existsSync(extra) ? readdirSync(extra).filter((n) => !(n in this.state.frames.animations)) : [];
		return [...Object.keys(this.state.frames.animations), ...extras];
	}

	private extraFiles(name: string, dir: Direction): string[] {
		const rel = `extra/${name}/${PL_DIR[dir]}`;
		const abs = join(this.dir, rel);
		if (!existsSync(abs)) return [];
		return readdirSync(abs)
			.filter((f) => /^frame_\d+\.png$/.test(f))
			.sort()
			.map((f) => `${rel}/${f}`);
	}

	/**
	 * `map`: animation của game → tên animation trong gói PixelLab (vd walk → "walk-6"); danh sách = thứ tự ưu tiên
	 * THEO TỪNG HƯỚNG. Hướng thiếu animation: lật gương từ phía đông nếu có, không thì dùng ảnh xoay làm frame TẠM
	 * khi hướng đó nằm trong `provisional`.
	 * `reject`: khoá là animation của game (loại mọi tên ở hướng đó) HOẶC tên PixelLab (vd `"attack-sword": ["E"]` —
	 * chỉ loại bản đó, hướng E rơi về tên kế như `attack-swing`).
	 * `optional` (động tác một lần: attack, cast…): KHÔNG BAO GIỜ dựng frame tạm — chỉ giữ hướng có frame thật
	 * hoặc lật gương thật; không có hướng nào thì không có key (game tự dùng phương án dự phòng).
	 */
	frames(
		map: Partial<Record<AnimationName, string | string[]>>,
		provisional: readonly Direction[],
		mirrorWest = false,
		reject: Partial<Record<string, Direction[]>> = {},
		optional: ReadonlySet<AnimationName> = new Set(),
	): AnimationFrames {
		const out: AnimationFrames = {};
		const size = this.state.character.size;
		for (const [anim, names] of Object.entries(map) as [AnimationName, string | string[]][]) {
			const isOptional = optional.has(anim);
			const nameList = Array.isArray(names) ? names : [names];
			const rejected = (name: string, dir: Direction) => !!reject[anim]?.includes(dir) || !!reject[name]?.includes(dir);
			// Frame của MỘT tên cho một hướng (lật gương nếu `from` khác `dir`); [] nếu bị loại, không có, hoặc khác cỡ.
			const take = (name: string, dir: Direction, from: Direction): RGBAImage[] => {
				if (rejected(name, from)) return [];
				const files = this.animationFiles(name, from);
				if (!files.length) return [];
				const list = files.map((f) => (from === dir ? this.png(f) : flipX(this.png(f))));
				// Chế độ v3 có thể trả canvas NỚI RỘNG (khác cỡ ảnh xoay): chưa có bước căn đầu–thân thì bỏ bản đó
				// và thử tên kế — một bản hỏng không được làm mất bản đối chứng hợp lệ của cùng hướng.
				if (isOptional && list.some((img) => img.width !== size.width || img.height !== size.height)) {
					console.log(`  ⚠ bỏ ${anim}/${dir} (${name}): khác cỡ ảnh xoay (${list[0]!.width}×${list[0]!.height} ≠ ${size.width}×${size.height}), chưa hỗ trợ`);
					return [];
				}
				return list;
			};
			// Tên đầu tiên cho ra frame HỢP LỆ thắng — bản vẽ lại một vài hướng đặt trước tên gốc.
			const firstValid = (dir: Direction, from: Direction): RGBAImage[] => {
				for (const n of nameList) {
					const list = take(n, dir, from);
					if (list.length) return list;
				}
				return [];
			};
			const dirs: Partial<Record<Direction, RGBAImage[]>> = {};
			const order = [...DIRECTIONS].sort((a, b) => (MIRROR[a] ? 1 : 0) - (MIRROR[b] ? 1 : 0));
			for (const dir of order) {
				const src = MIRROR[dir];
				// Nhân vật không đối xứng (tóc buộc lệch, kiếm đeo một bên): phía tây lật gương TOÀN BỘ từ phía
				// đông, kể cả ảnh đứng — không thì đứng và đi lệch bên nhau.
				if (mirrorWest && src) {
					const east = dirs[src];
					if (east) dirs[dir] = east.map(flipX);
					continue;
				}
				let list = firstValid(dir, dir);
				if (!list.length && src) list = firstValid(dir, src);
				if (!list.length && provisional.includes(dir) && !isOptional) {
					const still = this.rotation(dir);
					if (still) list = stillFrames(still, anim);
				}
				if (list.length) dirs[dir] = list;
			}
			if (!isOptional || Object.keys(dirs).length) out[anim] = dirs;
		}
		return out;
	}

	private png(file: string): RGBAImage {
		return decodePng(readFileSync(join(this.dir, file)));
	}
}

/** Frame tạm từ ảnh tĩnh: idle đứng yên, walk nhún 1px theo nhịp bước (cùng cách với nguồn Pixler). */
function stillFrames(img: RGBAImage, anim: AnimationName): RGBAImage[] {
	// Ảnh tĩnh đứng yên mà gắn nhãn "attack" thì game tưởng có động tác, khoá chân người chơi vô ích.
	if (anim !== 'idle' && anim !== 'walk' && anim !== 'run') throw new Error(`Không dựng frame tạm cho động tác "${anim}"`);
	if (anim !== 'walk') return [img, img, img, img];
	const up = { width: img.width, height: img.height, data: new Uint8Array(img.data.length) };
	up.data.set(img.data.subarray(img.width * 4), 0);
	return [img, up, img, up, img, up];
}

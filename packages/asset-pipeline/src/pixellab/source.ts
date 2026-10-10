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
	// Lỗi mạng / 5xx của PixelLab (đã gặp 502 giữa lúc chạy hàng loạt 09/10/2026) chỉ là tạm thời: thử lại thay vì làm hỏng cả lệnh
	// animate đã TRẢ lượt.
	const get = async (): Promise<Response> => {
		for (let i = 0; ; i += 1) {
			try {
				const r = await fetch(url);
				if (r.status < 500 || i >= 9) return r;
			} catch (e) {
				if (i >= 9) throw e;
			}
			await new Promise((r) => setTimeout(r, 20_000));
		}
	};
	let res = await get();
	// 423 = nhân vật còn đang vẽ dở → chờ rồi thử lại, tối đa ~30 phút.
	for (let i = 0; res.status === 423 && i < 60; i += 1) {
		await new Promise((r) => setTimeout(r, 30_000));
		res = await get();
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
		// Động tác cầm vũ khí vẽ trên PHIÊN BẢN cùng nhóm (Sword / Staff — create_character_state): gói tải về chứa mọi
		// phiên bản, ảnh xoay + đứng / đi vẫn lấy của phiên bản đầu (tay không).
		const anim = this.meta.states.map((s) => s.frames.animations[name] as unknown).find((a) => a && typeof a === 'object');
		if (!anim || typeof anim !== 'object') {
			const onDisk = this.folderFiles(name, dir);
			return onDisk.length ? onDisk : this.extraFiles(name, dir);
		}
		const byDir = (anim as Record<string, unknown>)[PL_DIR[dir]];
		if (Array.isArray(byDir)) return byDir.filter((f): f is string => typeof f === 'string');
		if (byDir && typeof byDir === 'object' && Array.isArray((byDir as { frames?: unknown }).frames)) return (byDir as { frames: string[] }).frames;
		return this.folderFiles(name, dir);
	}

	/**
	 * Hướng vẽ bù vào một NHÓM KHÁC cùng tên (lệnh `--together` bị nhận thiếu hướng rồi chạy lại): metadata chỉ liệt kê một nhóm
	 * cho mỗi tên, nhưng thư mục `<phiên bản>/animations/<tên>/<hướng>/` trên đĩa đã gộp mọi lần tải — lấy khung từ đó.
	 */
	private folderFiles(name: string, dir: Direction): string[] {
		for (const s of this.meta.states) {
			// Nhóm bù trùng tên bị PixelLab đổi thành `<tên>-<8 ký tự đầu id nhóm>` (đã gặp 09/10/2026: yeti `walk-69563cc4`) —
			// không nhận thì lệnh animate tưởng còn thiếu hướng và gửi vẽ lại mãi.
			const root = join(this.dir, s.folder, 'animations');
			const twins = existsSync(root) ? readdirSync(root).filter((n) => n.startsWith(`${name}-`) && /^[0-9a-f]{8}$/.test(n.slice(name.length + 1))) : [];
			for (const folder of [name, ...twins.sort()]) {
				const rel = `${s.folder}/animations/${folder}/${PL_DIR[dir]}`;
				const abs = join(this.dir, rel);
				if (!existsSync(abs)) continue;
				const files = readdirSync(abs)
					.filter((f) => /^frame_\d+\.png$/.test(f))
					.sort()
					.map((f) => `${rel}/${f}`);
				if (files.length) return files;
			}
		}
		return [];
	}

	animationNames(): string[] {
		const extra = join(this.dir, 'extra');
		const names = [...new Set(this.meta.states.flatMap((s) => Object.keys(s.frames.animations)))];
		const extras = existsSync(extra) ? readdirSync(extra).filter((n) => !names.includes(n)) : [];
		return [...names, ...extras];
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
				// Chế độ v3 trả canvas NỚI RỘNG, nhân vật nằm giữa (đo 09/10/2026: 80 → 108, lệch 14px mỗi bên) → nhận,
				// `padToLargest` đệm mọi khung về cùng khổ. Khung NHỎ hơn / lệch lẻ thì không biết đặt đâu → bỏ, thử tên kế.
				const odd = (img: RGBAImage) => img.width < size.width || img.height < size.height || (img.width - size.width) % 2 || (img.height - size.height) % 2;
				if (isOptional && list.some(odd)) {
					console.log(`  ⚠ bỏ ${anim}/${dir} (${name}): khổ ${list[0]!.width}×${list[0]!.height} không đặt được quanh ảnh xoay ${size.width}×${size.height}`);
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

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { crop, decodePng, readPng, type RGBAImage } from '../image/rgba.js';
import {
	DIRECTIONS,
	ProviderUnavailableError,
	type AnimationAsset,
	type AnimationGenerationInput,
	type AnimationName,
	type AssetLicense,
	type CharacterAsset,
	type CharacterAssetProvider,
	type CharacterGenerationInput,
	type Direction,
} from './types.js';

const SITE = 'https://freepixel.art';
const CDN = 'https://pub-8b7609252a6742d7b029292aaede7f7f.r2.dev/sorted/characters/spritesheets';
/** CDN trả 403 cho User-Agent mặc định của Node. */
const HEADERS = { 'User-Agent': 'Mozilla/5.0 (asset-pipeline; +https://freepixel.art/license/)' };

/** Lưới sheet của FreePixel: mỗi ô 128×128, hàng = hướng theo đúng thứ tự `DIRECTIONS`, cột = frame. */
export const FREEPIXEL_CELL = 128;

/** Tên animation của dự án → tên file trên CDN FreePixel. */
const ANIMATION_FILE: Partial<Record<AnimationName, string>> = {
	idle: 'idle',
	walk: 'walk',
	run: 'run',
};

export const FREEPIXEL_LICENSE: AssetLicense = {
	name: 'FreePixel Asset License',
	url: `${SITE}/license/`,
	commercialUse: true,
	attributionRequired: false,
	notes: 'Được dùng trong game thương mại, được sửa/recolor. CẤM phân phối lại file gốc dạng asset pack.',
};

export interface FreePixelCatalogEntry {
	slug: string;
	name: string;
	description: string;
	category: string;
	rarity: string;
	animationCount: number;
	previewUrl: string;
}

export class FreePixelProvider implements CharacterAssetProvider {
	readonly name = 'freepixel';

	constructor(private readonly cacheDir: string) {
		mkdirSync(cacheDir, { recursive: true });
	}

	/** Đọc danh mục từ trang /characters/ (site không có API — đây là trang HTML công khai). */
	async listCatalog(): Promise<FreePixelCatalogEntry[]> {
		const html = await this.fetchText(`${SITE}/characters/`, 'characters.html');
		const re =
			/<a class="character-card"[^>]*href="\/characters\/([^/]+)\/".*?background-image:url\(([^)]+)\).*?rarity-(\w+)".*?character-card-name">([^<]+)<.*?character-card-desc">([^<]*)<.*?category-badge">([^<]+)<.*?anim-badge">(\d+)/gs;
		const out: FreePixelCatalogEntry[] = [];
		for (const m of html.matchAll(re)) {
			out.push({
				slug: m[1]!,
				previewUrl: m[2]!,
				rarity: m[3]!,
				name: decodeEntities(m[4]!),
				description: decodeEntities(m[5]!),
				category: m[6]!,
				animationCount: Number(m[7]),
			});
		}
		return out;
	}

	/** Animation nào thật sự có file trên CDN (số trên thẻ catalog không nói là animation nào). */
	async probeAnimations(slug: string): Promise<AnimationName[]> {
		const found: AnimationName[] = [];
		for (const [anim, file] of Object.entries(ANIMATION_FILE) as [AnimationName, string][]) {
			const res = await fetchRetry(`${CDN}/${slug}/${file}.png`, { method: 'HEAD', headers: HEADERS });
			if (res.ok) found.push(anim);
		}
		return found;
	}

	async loadSheet(slug: string, animation: AnimationName): Promise<RGBAImage> {
		const file = ANIMATION_FILE[animation];
		if (!file) throw new ProviderUnavailableError(this.name, `FreePixel không có animation "${animation}"`);
		const cachePath = join(this.cacheDir, 'sheets', `${slug}.${file}.png`);
		if (existsSync(cachePath)) return readPng(cachePath);
		const res = await fetchRetry(`${CDN}/${slug}/${file}.png`, { headers: HEADERS });
		if (!res.ok) {
			throw new ProviderUnavailableError(this.name, `${slug}/${file}.png trả HTTP ${res.status}`);
		}
		const buf = Buffer.from(await res.arrayBuffer());
		mkdirSync(join(this.cacheDir, 'sheets'), { recursive: true });
		writeFileSync(cachePath, buf);
		return decodePng(buf);
	}

	/** Cắt sheet thành frame theo hướng. Sheet sai lưới thì báo lỗi, không đoán. */
	static sliceSheet(sheet: RGBAImage): Record<Direction, RGBAImage[]> {
		if (sheet.height !== FREEPIXEL_CELL * DIRECTIONS.length || sheet.width % FREEPIXEL_CELL !== 0) {
			throw new Error(`Sheet ${sheet.width}×${sheet.height} không khớp lưới ${FREEPIXEL_CELL}px × 8 hướng`);
		}
		const frameCount = sheet.width / FREEPIXEL_CELL;
		const out = {} as Record<Direction, RGBAImage[]>;
		DIRECTIONS.forEach((dir, row) => {
			out[dir] = Array.from({ length: frameCount }, (_, col) =>
				crop(sheet, col * FREEPIXEL_CELL, row * FREEPIXEL_CELL, FREEPIXEL_CELL, FREEPIXEL_CELL),
			);
		});
		return out;
	}

	async generateCharacter(input: CharacterGenerationInput): Promise<CharacterAsset> {
		const slug = requireSlug(input.sourceRef);
		const anims = await this.probeAnimations(slug);
		const anim = anims.includes('idle') ? 'idle' : anims[0];
		if (!anim) throw new ProviderUnavailableError(this.name, `${slug} không có sheet nào`);
		const frames = FreePixelProvider.sliceSheet(await this.loadSheet(slug, anim));
		const views: CharacterAsset['views'] = {};
		for (const dir of input.directions) views[dir] = frames[dir][0];
		return { identity: input.identity, provider: this.name, sourceRef: slug, views, license: FREEPIXEL_LICENSE };
	}

	async generateAnimation(input: AnimationGenerationInput): Promise<AnimationAsset> {
		const slug = requireSlug(input.sourceRef);
		const all = FreePixelProvider.sliceSheet(await this.loadSheet(slug, input.animation));
		const frames: AnimationAsset['frames'] = {};
		for (const dir of input.directions) frames[dir] = all[dir];
		return {
			identity: input.identity,
			provider: this.name,
			sourceRef: slug,
			animation: input.animation,
			frames,
			license: FREEPIXEL_LICENSE,
		};
	}

	private async fetchText(url: string, cacheName: string): Promise<string> {
		const cachePath = join(this.cacheDir, cacheName);
		if (existsSync(cachePath)) return readFileSync(cachePath, 'utf8');
		const res = await fetchRetry(url, { headers: HEADERS });
		if (!res.ok) throw new ProviderUnavailableError(this.name, `${url} trả HTTP ${res.status}`);
		const text = await res.text();
		writeFileSync(cachePath, text);
		return text;
	}
}

/** CDN đôi khi rớt kết nối giữa chừng (`fetch failed`) — thử lại có giãn cách, lỗi HTTP thật thì trả về luôn. */
async function fetchRetry(url: string, init: RequestInit, attempts = 4): Promise<Response> {
	for (let i = 1; ; i += 1) {
		try {
			return await fetch(url, init);
		} catch (e) {
			if (i >= attempts) throw new Error(`Tải ${url} thất bại sau ${attempts} lần: ${e instanceof Error ? e.message : e}`);
			await new Promise((r) => setTimeout(r, 600 * i));
		}
	}
}

function requireSlug(ref: string | undefined): string {
	if (!ref) throw new Error('FreePixelProvider cần `sourceRef` = slug nhân vật trên freepixel.art');
	return ref;
}

function decodeEntities(s: string): string {
	return s
		.replace(/&amp;/g, '&')
		.replace(/&#x27;|&#39;/g, "'")
		.replace(/&quot;/g, '"');
}

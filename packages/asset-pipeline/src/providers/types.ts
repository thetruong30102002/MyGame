import type { RGBAImage } from '../image/rgba.js';

/** Thứ tự hướng chuẩn của cả dự án — cũng là thứ tự hàng trong mọi sprite sheet xuất ra. */
export const DIRECTIONS = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'] as const;
export type Direction = (typeof DIRECTIONS)[number];

export const ANIMATIONS = ['idle', 'walk', 'run', 'attack', 'cast', 'hit', 'death', 'dodge', 'block'] as const;
export type AnimationName = (typeof ANIMATIONS)[number];

/** Danh tính nhân vật — mọi animation của cùng một characterId phải giữ đúng các thuộc tính này. */
export interface CharacterIdentity {
	characterId: string;
	hair: string;
	eyes: string;
	skin: string;
	outfit: string;
	weapon: string;
	palette: string;
}

export interface CharacterGenerationInput {
	identity: CharacterIdentity;
	/** Mô tả dùng cho provider sinh ảnh (Pixler...). Provider thư viện (FreePixel) bỏ qua. */
	prompt?: string;
	/** Mã asset nguồn ở provider thư viện, vd slug FreePixel `blue-wizard`. */
	sourceRef?: string;
	directions: readonly Direction[];
	frameSize: { width: number; height: number };
}

export interface AnimationGenerationInput {
	identity: CharacterIdentity;
	sourceRef?: string;
	/** Asset gốc đã sinh trước đó (provider sinh ảnh cần nó để giữ nhất quán). */
	base?: CharacterAsset;
	animation: AnimationName;
	directions: readonly Direction[];
	frameCount?: number;
}

/** Một hướng nhìn đứng yên — dùng làm tham chiếu nhận diện. */
export interface CharacterAsset {
	identity: CharacterIdentity;
	provider: string;
	sourceRef: string;
	views: Partial<Record<Direction, RGBAImage>>;
	license: AssetLicense;
	/** Mã job/ảnh phía provider, cần cho các lời gọi animate/edit tiếp theo. */
	providerRefs?: Partial<Record<Direction, string>>;
}

export interface AnimationAsset {
	identity: CharacterIdentity;
	provider: string;
	sourceRef: string;
	animation: AnimationName;
	frames: Partial<Record<Direction, RGBAImage[]>>;
	license: AssetLicense;
	/** Hướng nào là ảnh lật gương từ hướng khác (để báo cáo, không giấu). */
	mirroredFrom?: Partial<Record<Direction, Direction>>;
}

export interface AssetLicense {
	name: string;
	url: string;
	commercialUse: boolean;
	attributionRequired: boolean;
	notes?: string;
}

export interface CharacterAssetProvider {
	readonly name: string;
	generateCharacter(input: CharacterGenerationInput): Promise<CharacterAsset>;
	generateAnimation(input: AnimationGenerationInput): Promise<AnimationAsset>;
}

/** Provider chưa có API/MCP thật: báo rõ thay vì trả dữ liệu giả. */
export class ProviderUnavailableError extends Error {
	constructor(provider: string, reason: string) {
		super(`[${provider}] không khả dụng: ${reason}`);
		this.name = 'ProviderUnavailableError';
	}
}

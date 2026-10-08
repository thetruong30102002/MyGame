import {
	ProviderUnavailableError,
	type AnimationAsset,
	type AnimationGenerationInput,
	type CharacterAsset,
	type CharacterAssetProvider,
	type CharacterGenerationInput,
} from './types.js';

/**
 * Chỗ cắm SpriteLab. Lúc viết (01/10/2026) môi trường này KHÔNG có MCP SpriteLab và chưa có tài liệu
 * API công khai để đối chiếu, nên provider chỉ giữ chỗ trong interface: gọi là báo lỗi rõ ràng,
 * KHÔNG trả ảnh giả. Khi có API thật: hiện thực 2 hàm dưới, đọc khoá từ SPRITELAB_API_KEY.
 */
export class SpriteLabProvider implements CharacterAssetProvider {
	readonly name = 'spritelab';

	constructor(private readonly apiKey: string | undefined) {}

	async generateCharacter(_input: CharacterGenerationInput): Promise<CharacterAsset> {
		throw this.unavailable();
	}

	async generateAnimation(_input: AnimationGenerationInput): Promise<AnimationAsset> {
		throw this.unavailable();
	}

	private unavailable(): ProviderUnavailableError {
		return new ProviderUnavailableError(
			this.name,
			this.apiKey ? 'đã có SPRITELAB_API_KEY nhưng integration chưa được viết' : 'chưa có API/MCP và SPRITELAB_API_KEY',
		);
	}
}

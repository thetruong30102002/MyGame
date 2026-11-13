import { BRAM, REGION_NPCS } from './regionNpcs.ts';
import { SERVICE_NPCS } from './services.ts';
import type { StoryData } from './storyTypes.ts';

/**
 * NPC của thế giới (13/11/2026: bỏ toàn bộ cốt truyện cũ — tuổi thơ, 16 tuổi, chương thần 1–7, chuyển sinh; nhân vật không còn tuổi,
 * chỉ còn cấp). Nhiệm vụ nay ở hệ mới `quests2.ts`. Giữ: NPC dịch vụ (services.ts → village.ts, quầy các khu, NPC truyện mới), NPC
 * vùng (regionNpcs.ts), Bram.
 */
export const STORY: StoryData = {
	npcs: { bram: BRAM, ...SERVICE_NPCS, ...REGION_NPCS },
};

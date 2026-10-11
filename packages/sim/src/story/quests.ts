/**
 * Mọi nhiệm vụ cốt truyện (tuổi thơ + 16 tuổi + mạch chính vùng 1–7) theo id — máy chủ cấp thưởng nhiệm vụ theo bảng này (M3.3 — kinh tế ở máy chủ):
 * client báo "xong nhiệm vụ <id>", máy chủ tra phần thưởng ở đây (không tin số client gửi), mỗi nhiệm vụ trao một lần.
 */
import { CHAPTER_QUESTS } from './chapters.ts';
import { CHILDHOOD_QUESTS } from './childhood.ts';
import type { QuestDef } from './storyTypes.ts';
import { YOUTH_QUESTS } from './youth.ts';

export const QUESTS: readonly QuestDef[] = [...CHILDHOOD_QUESTS, ...YOUTH_QUESTS, ...CHAPTER_QUESTS];

export function questDef(id: string): QuestDef | undefined {
	return QUESTS.find((q) => q.id === id);
}

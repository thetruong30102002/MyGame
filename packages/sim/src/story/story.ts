import { CHILDHOOD_AGE_CARDS, CHILDHOOD_NPCS, CHILDHOOD_QUESTS, PARENT_NPCS_16, PROLOGUE, TIME_SKIP } from './childhood.ts';
import { CHAPTER_NPCS, CHAPTER_QUESTS, CHAPTERS_ENDING } from './chapters.ts';
import { SERVICE_NPCS } from './services.ts';
import type { StoryData } from './storyTypes.ts';
import { YOUTH_NPCS, YOUTH_QUESTS } from './youth.ts';

/**
 * Toàn bộ cốt truyện đang chơi được: tuổi thơ (childhood.ts) → tua nhanh → 16 tuổi (youth.ts) → mạch chính vùng 1 (thần) + vùng 2–7
 * (chapters.ts). NPC dịch vụ đứng chung (services.ts). Thẻ kết vùng 1 nay là thoại sau trận Quỷ vương (`y3_demon.after`).
 */
export const STORY: StoryData = {
	prologue: PROLOGUE,
	ageCards: { ...CHILDHOOD_AGE_CARDS, 16: TIME_SKIP },
	npcs: { ...CHILDHOOD_NPCS, ...YOUTH_NPCS, ...PARENT_NPCS_16, ...SERVICE_NPCS, ...CHAPTER_NPCS },
	quests: [...CHILDHOOD_QUESTS, ...YOUTH_QUESTS, ...CHAPTER_QUESTS],
	ending: CHAPTERS_ENDING,
	playerByAge: [
		{ minAge: 0, sprite: 'player_lior_child' },
		{ minAge: 16, sprite: 'player_hero_adult' },
	],
};

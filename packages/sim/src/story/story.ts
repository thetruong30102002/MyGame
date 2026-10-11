import { CHILDHOOD_AGE_CARDS, CHILDHOOD_NPCS, CHILDHOOD_QUESTS, PARENT_NPCS_16, PROLOGUE, TIME_SKIP } from './childhood.ts';
import { SERVICE_NPCS } from './services.ts';
import type { StoryData } from './storyTypes.ts';
import { YOUTH_ENDING, YOUTH_NPCS, YOUTH_QUESTS } from './youth.ts';

/** Toàn bộ cốt truyện đang chơi được: tuổi thơ (childhood.ts) → tua nhanh → 16 tuổi (youth.ts). NPC dịch vụ đứng chung (services.ts). */
export const STORY: StoryData = {
	prologue: PROLOGUE,
	ageCards: { ...CHILDHOOD_AGE_CARDS, 16: TIME_SKIP },
	npcs: { ...CHILDHOOD_NPCS, ...YOUTH_NPCS, ...PARENT_NPCS_16, ...SERVICE_NPCS },
	quests: [...CHILDHOOD_QUESTS, ...YOUTH_QUESTS],
	ending: YOUTH_ENDING,
	playerByAge: [
		{ minAge: 0, sprite: 'player_lior_child' },
		{ minAge: 16, sprite: 'player_hero_adult' },
	],
};

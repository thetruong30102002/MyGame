import type { SaveData, StoryStorage } from '@/game/story/StoryDirector';
import type { OnlineSession } from './OnlineSession';

/** Tiến độ truyện nằm trong tiến độ nhân vật trên máy chủ — mỗi nhân vật một mạch truyện riêng. */
export function onlineStoryStorage(s: OnlineSession): StoryStorage {
	return {
		load() {
			const d = s.progress.story as SaveData | null;
			return d && d.version === 2 ? d : null;
		},
		save(data) {
			s.progress.story = data;
			s.save();
		},
		introSeen: () => s.progress.introSeen,
		markIntroSeen() {
			s.progress.introSeen = true;
			s.save();
		},
		async reset() {
			Object.assign(s.progress, { story: null, introSeen: false, level: 1, exp: 0, coins: 0, potions: 0, x: -1, y: -1 });
			await s.flush();
		},
	};
}

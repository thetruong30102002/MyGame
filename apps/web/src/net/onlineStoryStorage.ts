import type { SaveData, StoryStorage } from '@/game/story/StoryDirector';
import type { OnlineSession } from './OnlineSession';

/** Tiến độ truyện nằm trong tiến độ nhân vật trên máy chủ — mỗi nhân vật một mạch truyện riêng. */
export function onlineStoryStorage(s: OnlineSession): StoryStorage {
	return {
		load() {
			const d = s.progress.story as SaveData | null;
			if (!d || d.version !== 2) return null;
			// Cấp do máy chủ giữ (M3.3a): bản sao trong bản lưu truyện có thể chậm hơn — StoryDirector kẹp / chuyển điểm tiềm năng
			// (`cleanTalents`, `migrateTalentsV2`) theo cấp THẬT, không thì chuyển bản lưu có thể hạ mốc oan. Ghi thẳng vào object
			// (không chép): StoryDirector giữ đúng object của `progress.story` như trước.
			const level = Number(s.progress.level);
			if (Number.isFinite(level) && level >= 1 && d.player) d.player.level = level;
			return d;
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

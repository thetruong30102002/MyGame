import type { ReactionId } from '../skillRules.ts';
import type { Element } from '../skills.ts';

/** Người nói: khoá NPC, 'lior' (nói thành tiếng), 'inner' (độc thoại nội tâm của Minh), 'narrator'. */
export interface Line {
	speaker: string;
	text: string;
}

export type Objective =
	| { type: 'talk'; npc: string }
	| { type: 'pickup'; item: string; count: number }
	| { type: 'kill'; monster?: string; count: number }
	| { type: 'reach'; spot: string }
	/** `reaction`: chỉ tính đòn tạo ra đúng phản ứng đó (vd 'chill' = Băng Giá ở "Tuyết cho mẹ"). */
	| { type: 'practice'; element?: Element; reaction?: ReactionId; count: number; dummy?: string }
	| { type: 'boss'; id: string };

/**
 * Nhiệm vụ đang chờ người chơi tới ĐÂU (chưa phải toạ độ — `resolveTarget` đổi ra điểm trên map). Cùng nhánh với
 * dòng chữ trên ô nhiệm vụ nên "tự đi" không bao giờ dẫn tới chỗ khác chỗ đang ghi.
 * `practice.dummy`: thiếu thì chọn hình nộm gần nhất.
 */
export type QuestTarget =
	| { kind: 'npc'; npc: string; role: 'giver' | 'turnIn' | 'talk' }
	| { kind: 'pickup'; item: string; spots: string[] }
	| { kind: 'kill'; monster?: string; zone?: string }
	| { kind: 'practice'; dummy?: string }
	| { kind: 'reach'; spot: string }
	| { kind: 'boss'; id: string };

export interface QuestDef {
	id: string;
	/** Tuổi của Lior khi làm nhiệm vụ — đổi mốc tuổi thì hiện thẻ chuyển cảnh và đổi sprite. */
	age: number;
	title: string;
	/** NPC giao việc; null = tự nhận ngay khi tới lượt. */
	giver: string | null;
	objective: Objective;
	/** Dòng mục tiêu hiện trên HUD; `{n}`/`{total}` được thay bằng tiến độ. */
	objectiveText: string;
	/**
	 * Bài luyện phép nguyên tố: dòng mục tiêu lúc người chơi CHƯA học đủ chiêu và bài đang nhận Tia Aether thay
	 * (`StoryDirector.aetherStandsIn` — chủ dự án 10/10/2026: phép nguyên tố học bằng điểm). Học đủ rồi thì về `objectiveText`.
	 */
	objectiveTextAether?: string;
	/** NPC để báo cáo khi xong; 'auto' = xong là tự trao thưởng. */
	turnIn: string | 'auto';
	reward: { exp: number; coins?: number; potions?: number; unlockSkill?: string };
	before: Line[];
	after: Line[];
	/** Độc thoại phát đúng lúc mục tiêu VỪA đủ (ngay sau khi nhặt/đánh xong), trước khi đi báo cáo. */
	onReady?: Line[];
	/** Câu nhắc khi nói với người giao việc lúc nhiệm vụ đang dở. */
	progress?: Line[];
	/**
	 * Thế giới đổi theo nhiệm vụ: sinh vật phẩm nhặt, đánh thức boss… `unlock`: quà/kỹ năng trao NGAY khi nhận
	 * việc (kiếm gỗ của cha, trượng tập của mẹ) để tập được luôn.
	 */
	onGive?: { pickups?: { item: string; spots: string[] }; awakenBoss?: boolean; zone?: string; unlock?: string };
	/** Hiệu ứng thế giới khi trả nhiệm vụ (vd tuyết rơi trên mái nhà ở "Tuyết cho mẹ"). */
	onComplete?: { vfx: string; spot: string; times?: number };
}

export interface NpcDef {
	name: string;
	title: string;
	/** Sprite trong manifest; null = chưa có sprite (nói chuyện qua cửa nhà / điểm tương tác). */
	sprite: string | null;
	/**
	 * Vật thể làm hình cho NPC không có sprite (id đồ vật trong atlas đồ vật của vùng, vd `rune_stone` = bia đá cổ ở Nghĩa
	 * địa): vẽ đồ vật đó + quả cầu sáng tương tác như thường. Atlas chưa có đồ vật đó thì chỉ còn quả cầu sáng.
	 */
	prop?: string;
	/** Đứng ở đâu: id địa điểm của map (+ lệch px). */
	at: { spot: string; dx?: number; dy?: number };
	/** Chỉ xuất hiện trong các khoảng tuổi này. */
	ages: [number, number];
	/** Vùng của chỗ đứng (`@aether/sim/regions`) — địa điểm chỉ duy nhất trong một vùng. Thiếu = vùng đầu (`human`). */
	region?: string;
	idle: string[];
}

export interface StoryData {
	prologue: string[];
	ageCards: Record<number, string[]>;
	npcs: Record<string, NpcDef>;
	quests: QuestDef[];
	ending: string[];
	/** Sprite người chơi theo tuổi (tuổi nhỏ nhất ≥ ngưỡng được chọn). */
	playerByAge: { minAge: number; sprite: string }[];
}

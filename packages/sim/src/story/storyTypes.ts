/**
 * Kiểu NPC của thế giới. Cốt truyện cũ (QuestDef, Line, Objective, tuổi) đã bỏ 13/11/2026 — nhiệm vụ ở `quests2.ts`, nhân vật không
 * còn tuổi, chỉ còn cấp.
 */
export interface NpcDef {
	/** NPC dịch vụ mới đứng yên, không cần bộ di chuyển. */
	stationary?: boolean;
	name: string;
	title: string;
	/** Sprite trong manifest; null = chưa có sprite (nói chuyện qua cửa nhà / điểm tương tác). */
	sprite: string | null;
	/**
	 * Vật thể làm hình cho NPC không có sprite (id đồ vật trong atlas đồ vật của vùng, vd `rune_stone` = cột dịch chuyển): vẽ đồ vật đó
	 * + quả cầu sáng tương tác như thường. Atlas chưa có đồ vật đó thì chỉ còn quả cầu sáng.
	 */
	prop?: string;
	/** Đứng ở đâu: id địa điểm của map (+ lệch px). */
	at: { spot: string; dx?: number; dy?: number };
	/** Vùng của chỗ đứng (`@havenlord/sim/regions`) — địa điểm chỉ duy nhất trong một vùng. Thiếu = vùng đầu (`human`). */
	region?: string;
	idle: string[];
}

export interface StoryData {
	npcs: Record<string, NpcDef>;
}

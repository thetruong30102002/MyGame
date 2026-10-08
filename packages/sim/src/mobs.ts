/**
 * Quái DÙNG CHUNG giữa người chơi (M3.2 — docs/ke-hoach-m3-may-chu-chien-dau.md). Luật thuần cho cả máy chủ (giữ sổ quái)
 * lẫn client (vẽ, chạy AI cho quái mình làm "chủ"):
 * - Khu nào dùng chung: khu thế giới người lớn (`fromAge` ≥ 16) không gắn nhiệm vụ (`onDemand`) — khu nhiệm vụ tuổi thơ và
 *   boss cốt truyện vẫn RIÊNG mỗi người vì cốt truyện mỗi người một khác.
 * - Chỗ sinh tất định theo thứ tự trong khu: máy chủ và client (chế độ một mình) ra đúng một toạ độ.
 */

export interface MonsterZoneDef {
	id: string;
	name?: string;
	x: number;
	y: number;
	radius: number;
	monsters: string[];
	count: number;
	fromAge?: number;
	onDemand?: boolean;
	boss?: boolean;
}

/** Tuổi cốt truyện của thế giới dùng chung (khu `fromAge` từ mốc này trở lên). */
export const SHARED_MIN_AGE = 16;

export function isSharedZone(z: Pick<MonsterZoneDef, 'fromAge' | 'onDemand'>): boolean {
	return !z.onDemand && (z.fromAge ?? 0) >= SHARED_MIN_AGE;
}

/** Mã quái dùng chung: `<vùng>/<map>:<khu>:<thứ tự>` — ổn định qua mỗi lần máy chủ khởi động (không phụ thuộc thứ tự nạp). */
export function mobId(map: string, zone: string, index: number): string {
	return `${map}:${zone}:${index}`;
}

/** Các điểm sinh của một khu: con thứ i trên vòng quanh tâm, bán kính lệch theo i (y như cách client dựng từ trước). */
export function zoneSpawnPoints(z: MonsterZoneDef): { index: number; type: string; x: number; y: number }[] {
	const out: { index: number; type: string; x: number; y: number }[] = [];
	if (!z.monsters.length) return out;
	for (let i = 0; i < z.count; i += 1) {
		const a = (i / z.count) * Math.PI * 2;
		const r = z.radius * (0.3 + (0.6 * ((i * 37) % 10)) / 10);
		out.push({ index: i, type: z.monsters[i % z.monsters.length]!, x: z.x + Math.cos(a) * r, y: z.y + Math.sin(a) * r });
	}
	return out;
}

/** Hạ quái thì ai được tính công: mọi người gây sát thương lên nó trong chừng này giây gần nhất (đánh chung cùng có phần). */
export const MOB_CREDIT_SECONDS = 30;
/** Người chơi phải đứng cách quái trong khoảng này mới được tính đòn trúng (tầm đòn xa nhất ~460 + vùng nổ + trễ mạng). */
export const MOB_HIT_RANGE = 900;
/** Quái không ai làm "chủ" (chủ rời map) đứng yên; người mới vào map nhận làm chủ. Đổi chủ khi người xin gần hơn chừng này px. */
export const MOB_OWNER_SWITCH = 60;

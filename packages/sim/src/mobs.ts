import type { MobAct, MobCc, MobCcKey } from '@aether/protocol';

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
	/** Chỉ sinh tới hết tuổi này (khu tuổi thơ dùng chung map với người lớn — Bãi Bồi, thiết kế 12 map vùng 1). Vắng = mãi mãi. */
	untilAge?: number;
	/** Cấp quái của khu → chỉ số qua `skills.enemyStatsAt`. Vắng = chỉ số gốc (`ENEMY_STATS`) — 6 map cũ giữ nguyên số. */
	level?: number;
	onDemand?: boolean;
	boss?: boolean;
}

/** Tuổi cốt truyện của thế giới dùng chung (khu `fromAge` từ mốc này trở lên). */
export const SHARED_MIN_AGE = 16;

export function isSharedZone(z: Pick<MonsterZoneDef, 'fromAge' | 'onDemand'>): boolean {
	return !z.onDemand && (z.fromAge ?? 0) >= SHARED_MIN_AGE;
}

/** Khu tuổi thơ (`fromAge` < 16, kể cả khu nhiệm vụ 8 tuổi): EXP từ quái ở đây bị chặn ở `CHILD_ZONE_LEVEL_CAP`. */
export function isChildZone(z: Pick<MonsterZoneDef, 'fromAge'>): boolean {
	return (z.fromAge ?? 0) < SHARED_MIN_AGE;
}

/**
 * EXP từ khu tuổi thơ không đưa nhân vật quá cấp này (thiết kế 12 map vùng 1, 10/10/2026): Bãi Bồi có bầy nấm cấp 1 cho trẻ 8 tuổi
 * cày được, chặn ở đây để giữ nhịp cấp đã cân tới Quỷ vương (boss.test: đường tối thiểu vừa qua mốc cấp 4). Client (chơi một mình)
 * và máy chủ (`privateKill`) cùng áp qua `economy.capExpGain`.
 */
export const CHILD_ZONE_LEVEL_CAP = 3;

/**
 * Khu tự có quái ở tuổi cốt truyện `age` (không tính khu nhiệm vụ `onDemand` — nhiệm vụ tự bật): từ `fromAge` tới hết `untilAge`.
 * Client gọi mỗi lần dựng map / sang tuổi mới — người 16+ không thấy bầy nấm tuổi thơ ở Bãi Bồi nữa.
 */
export function zoneLiveAt(z: Pick<MonsterZoneDef, 'fromAge' | 'untilAge' | 'onDemand'>, age: number): boolean {
	return !z.onDemand && age >= (z.fromAge ?? 0) && (z.untilAge === undefined || age <= z.untilAge);
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

// ———————————————————— M3.2b: quái đánh mọi người + khống chế dùng chung ————————————————————

/** Các khống chế / suy yếu đồng bộ giữa các máy. Không gồm ướt / cháy / bụi: đó là nguyên liệu phản ứng của RIÊNG người gây ra
 * (đồng bộ thì hai người cùng ăn một lần phản ứng, cháy thì nhịp đốt tính hai lần). */
export const MOB_CC_KEYS: readonly MobCcKey[] = ['freeze', 'stun', 'air', 'slow', 'chill', 'frost', 'armor', 'sunder', 'miss', 'daze'];

/** Trần giây của từng khống chế (cao hơn mức thật lớn nhất ~1,5–2 lần để chừa bị động nhân thời lượng). */
export const MOB_CC_CAP: Readonly<Record<MobCcKey, number>> = { freeze: 5, stun: 3, air: 1.5, slow: 8, chill: 8, frost: 8, armor: 10, sunder: 10, miss: 8, daze: 8 };

/** Cú đẩy: trần tốc (px/giây) + thời lượng (đẩy thật ~0,16 giây). */
export const MOB_PUSH_CAP = { speed: 2000, seconds: 0.3 };

/** Động tác đánh nổ cách vị trí quái máy chủ đang giữ tối đa bao nhiêu px: nhát / đạn tại thân quái; vùng nổ boss ở chỗ
 * người bị nhắm (boss nhắm trong 360px) — cộng bù quái đi trong ~0,1 giây giữa hai lần báo vị trí + trễ mạng. */
export const MOB_ACT_RANGE = { body: 160, aoe: 480 };

/** Lấy đà dài nhất chấp nhận (boss 0,36 giây; atlas có thể kéo dài theo số frame). */
export const MOB_WIND_MAX = 1.5;

/** Tám hướng hợp lệ của sprite. */
export const MOB_DIRS: readonly string[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const r3 = (v: number): number => Math.round(v * 1000) / 1000;

/** Chuẩn hoá khống chế nhận từ mạng: khoá lạ bỏ, số âm / NaN bỏ, kẹp trần. null = không còn gì. */
export function cleanMobCc(raw: unknown): MobCc | null {
	if (!raw || typeof raw !== 'object') return null;
	const o = raw as Record<string, unknown>;
	const out: MobCc = {};
	let any = false;
	for (const k of MOB_CC_KEYS) {
		const v = num(o[k]);
		if (v === null || v <= 0) continue;
		out[k] = r3(Math.min(MOB_CC_CAP[k], v));
		any = true;
	}
	const mult = num(o.slowMult);
	if (out.slow !== undefined) out.slowMult = r3(Math.min(1, Math.max(0.1, mult ?? 1)));
	const push = o.push;
	if (Array.isArray(push) && push.length === 3) {
		const [vx, vy, t] = [num(push[0]), num(push[1]), num(push[2])];
		if (vx !== null && vy !== null && t !== null && t > 0) {
			const speed = Math.hypot(vx, vy);
			const k = speed > MOB_PUSH_CAP.speed ? MOB_PUSH_CAP.speed / speed : 1;
			out.push = [Math.round(vx * k), Math.round(vy * k), r3(Math.min(MOB_PUSH_CAP.seconds, t))];
			any = true;
		}
	}
	return any ? out : null;
}

/** Chuẩn hoá động tác đánh nhận từ mạng (hình dạng + số hữu hạn + hướng chuẩn hoá). null = tin hỏng. */
export function cleanMobAct(raw: unknown): MobAct | null {
	if (!raw || typeof raw !== 'object') return null;
	const o = raw as Record<string, unknown>;
	if (o.k === 'wind') {
		const s = num(o.s);
		if (typeof o.dir !== 'string' || !MOB_DIRS.includes(o.dir) || s === null || s <= 0) return null;
		return { k: 'wind', dir: o.dir, s: r3(Math.min(MOB_WIND_MAX, s)) };
	}
	const x = num(o.x);
	const y = num(o.y);
	if (x === null || y === null) return null;
	if (o.k === 'aoe') return { k: 'aoe', x: Math.round(x), y: Math.round(y) };
	if (o.k !== 'melee' && o.k !== 'shot') return null;
	const nx = num(o.nx);
	const ny = num(o.ny);
	const len = nx === null || ny === null ? 0 : Math.hypot(nx, ny);
	if (len < 1e-6) return null;
	return { k: o.k, x: Math.round(x), y: Math.round(y), nx: r3(nx! / len), ny: r3(ny! / len) };
}

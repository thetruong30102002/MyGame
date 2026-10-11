import { inArea, lineSegments, scatterPoints, type Area } from './skillRules.ts';
import { HERO_SKILLS, isSwordSkill, PATHS, type HeroPath, type SkillDef } from './skills.ts';
import { attrBonus } from './attributes.ts';
import { BRANCHES, fitTiers, migrateBought, skillScale, talentPoints, tiersFrom, type TalentSpent, type Tiers } from './talents.ts';
import { REGIONS } from './regions.ts';

/**
 * PvP — người đánh người (chủ dự án 10/10/2026: "xây dựng là game pvp đó nha"). MÁY CHỦ tính trúng + sát thương từ chiêu, hướng,
 * điểm nhắm ĐÃ KIỂM (`actions.cleanCast`) và vị trí máy chủ đang giữ — không tin con số nào của máy khách. Máy bị đánh chỉ tự xét
 * miễn thương (né, i-frame) và thế đỡ. Luật mặc định (chờ chủ dự án chỉnh — docs/online-va-build.md "PvP"):
 * - Đánh nhau mọi nơi TRỪ map trạm (làng / thị trấn) của từng vùng.
 * - Sát thương người-đánh-người = `PVP_SCALE` × sát thương PvE cùng chiêu (trừ giáp người bị đánh); chí mạng như PvE; không phản
 *   ứng nguyên tố, không khống chế.
 * - Vừa vào map / hồi sinh: miễn PvP `PVP_SPAWN_SHIELD_MS`.
 * - Gục vì người khác: không mất gì, hồi sinh ở quảng trường như gục vì quái; cả map thấy dòng "A hạ gục B".
 */

export const PVP_SCALE = 0.4;
export const PVP_SPAWN_SHIELD_MS = 5000;
/** Người bị đánh báo gục: chỉ tính cho người đã đánh trúng mình trong chừng này ms. */
export const PVP_KILL_WINDOW_MS = 10_000;
export const PVP_CRIT_CHANCE = 0.1;
export const PVP_CRIT_MULT = 1.75;
/** Khung chạm trung bình của động tác ra đòn (giây từ lúc bấm) — máy chủ không biết atlas, lấy số chung. */
export const PVP_RELEASE = 0.15;
/** Nới vùng trúng (px) bù trễ mạng: vị trí máy chủ giữ trễ ~0,1s so với màn hình người đánh. */
export const PVP_PAD = 16;

const SKILLS: ReadonlyMap<string, SkillDef> = new Map(HERO_SKILLS.map((s) => [s.id, s]));

/** Map trạm của các vùng (`vùng/hub`) — vùng an toàn, không PvP. */
export const PVP_SAFE_MAPS: ReadonlySet<string> = new Set(REGIONS.map((r) => `${r.id}/${r.hub}`));

export const pvpAllowedOn = (map: string): boolean => !PVP_SAFE_MAPS.has(map);

/** Sức chiến đấu của một người chơi máy chủ suy từ tiến độ đã lưu: cấp (máy chủ giữ), con đường + mốc tiềm năng (kẹp theo điểm có). */
export interface PvpBuild {
	level: number;
	path: HeroPath | 'none';
	tiers: Tiers;
	/** Hệ số sát thương kiếm / phép từ điểm thuộc tính (`attributes.attrBonus`, đã kẹp theo cấp). Vắng = 1. */
	swordMult?: number;
	magicMult?: number;
	/** Phòng thủ cộng thêm từ thuộc tính Đỡ đòn. Vắng = 0. */
	defBonus?: number;
}

/** Dựng `PvpBuild` từ tiến độ: mốc đã mua kẹp theo điểm tiềm năng của cấp (+ thưởng) — bản lưu sửa tay không tăng sức đánh. */
export function pvpBuild(level: number, story: unknown, bonusPoints = 0): PvpBuild {
	const s = story && typeof story === 'object' ? (story as Record<string, unknown>) : {};
	const unlocked = new Set(Array.isArray(s.unlocked) ? s.unlocked.filter((x): x is string => typeof x === 'string') : []);
	const raw = s.talents && typeof s.talents === 'object' ? (s.talents as TalentSpent) : {};
	const bought: TalentSpent = {};
	for (const b of BRANCHES) {
		const v = Number(raw[b]);
		if (Number.isFinite(v) && v > 0) bought[b] = Math.floor(v);
	}
	const lv = Math.max(1, Math.floor(Number(level) || 1));
	const tiers = fitTiers(tiersFrom(migrateBought(bought, s.swordStyle), (id) => unlocked.has(id)), talentPoints(lv, bonusPoints));
	const path = s.path === 'sword' || s.path === 'mage' ? s.path : 'none';
	const a = attrBonus(s.attrs, lv);
	return { level: lv, path, tiers, swordMult: a.sword, magicMult: a.magic, defBonus: a.def };
}

const statAt = (pair: [number, number], level: number): number => pair[0] + (level - 1) * pair[1];

/** Sát thương PvP của `skill` từ `att` lên `def` — `rand()` ∈ [0, 1) (Math.random ở máy chủ, số cố định trong test). */
export function pvpDamage(skill: SkillDef, att: PvpBuild, def: PvpBuild, rand: () => number = Math.random): { dmg: number; crit: boolean } {
	const p = PATHS[att.path];
	const atk = statAt(p.atk, att.level);
	const sword = isSwordSkill(skill);
	const pathScale = (skill.kind === 'heal' ? 1 : sword ? p.sword : p.magic) * ((sword ? att.swordMult : att.magicMult) ?? 1);
	const raw = atk * skill.power * pathScale * skillScale(att.tiers, skill.id, att.level) * PVP_SCALE * (0.9 + rand() * 0.2);
	const crit = rand() < PVP_CRIT_CHANCE + (skill.crit ?? 0);
	const armor = statAt(PATHS[def.path].def, def.level) + (def.defBonus ?? 0);
	return { dmg: Math.max(1, Math.round(raw * (crit ? PVP_CRIT_MULT : 1) - armor * 0.5)), crit };
}

/**
 * Một lần xét trúng của chiêu: sau `delay` giây (tính từ lúc bấm) xét vùng `area` trên vị trí lúc đó. `first`: đạn không xuyên —
 * chỉ trúng người GẦN gốc nhất trong vùng. `scale`: phần sát thương của nhịp này (vùng tồn tại chia nhiều nhịp).
 */
export interface PvpStrike {
	delay: number;
	area: Area;
	first?: { x: number; y: number };
	scale: number;
	/** Vùng bám người tung (lưỡi gió quanh người): tâm vùng lấy theo vị trí người tung lúc xét. */
	follow?: boolean;
}

/**
 * Các lần xét trúng của chiêu `skillId` tung từ (x, y) — chân người tung — theo hướng ngắm (ax, ay) đơn vị, điểm nhắm (tx, ty) đã kẹp.
 * Hình học CHÉP từ `CombatSystem.release` của client (cùng tầm, bán kính, độ trễ); chiêu không gây sát thương (hồi máu, thế đỡ, khiên)
 * → rỗng. Chiêu lạ → rỗng.
 */
export function pvpStrikes(skillId: string, x: number, y: number, ax: number, ay: number, tx?: number, ty?: number): PvpStrike[] {
	const s = SKILLS.get(skillId);
	if (!s) return [];
	const t0 = PVP_RELEASE;
	const aimX = tx ?? x + ax * (s.aimDist ?? 150);
	const aimY = ty ?? y + ay * (s.aimDist ?? 150);
	switch (s.kind) {
		case 'melee':
		case 'blink': {
			const reach = (s.kind === 'blink' ? (s.radius ?? 72) : (s.range ?? 70)) + 18;
			const half = s.arc ?? (Math.acos(0.3) * 180) / Math.PI;
			const n = Math.max(1, s.count ?? 1);
			return Array.from({ length: n }, (_, k) => ({ delay: t0 + k * (s.stagger ?? 0.1), area: { kind: 'cone', x, y, dx: ax, dy: ay, range: reach, half }, scale: 1, follow: k > 0 }));
		}
		case 'spin':
		case 'aoe_self':
			// Xoáy Nước (`spin` có `range`): vòng xoáy tại chỗ nhắm.
			return [{ delay: t0, area: { kind: 'circle', x: s.range ? aimX : x, y: s.range ? aimY : y, r: s.radius ?? 90 }, scale: 1 }];
		case 'cone':
			return [{ delay: t0, area: { kind: 'cone', x, y, dx: ax, dy: ay, range: s.range ?? 160, half: s.angle ?? 35 }, scale: 1 }];
		case 'projectile': {
			const range = s.range ?? 400;
			const speed = s.speed ?? 400;
			const half = Math.max(20, s.width ?? 20);
			// Một lần xét cả đường bay; độ trễ theo nửa tầm (đạn trúng người đứng gần sớm hơn — máy chủ không mô phỏng từng khung).
			return [{ delay: t0 + range / 2 / speed, area: { kind: 'line', ax: x, ay: y, bx: x + ax * range, by: y + ay * range, half }, first: s.pierce ? undefined : { x, y }, scale: 1 }];
		}
		case 'line':
			return lineSegments(x + ax * 20, y + ay * 20, ax, ay, s.range ?? 300, 34).map((sg) => ({
				delay: t0 + (s.delay ?? 0) + sg.i * (s.stagger ?? 0),
				area: { kind: 'line', ax: sg.ax, ay: sg.ay, bx: sg.bx, by: sg.by, half: s.width ?? 26 },
				scale: 1 / Math.max(1, Math.ceil((s.range ?? 300) / 34)),
			}));
		case 'dash':
			return [{ delay: t0, area: { kind: 'line', ax: x, ay: y, bx: x + ax * (s.range ?? 150), by: y + ay * (s.range ?? 150), half: 30 }, scale: 1 }];
		case 'aoe_target':
		case 'pillar':
			return [{ delay: t0 + (s.delay ?? 0) + (s.lob ? Math.hypot(aimX - x, aimY - y) / s.lob : 0), area: { kind: 'circle', x: aimX, y: aimY, r: s.radius ?? 80 }, scale: 1 }];
		case 'zone':
		case 'wall':
		case 'summon': {
			if (s.rain) return [];
			const duration = s.duration ?? 2;
			const tick = s.tick ?? 0.5;
			const n = Math.max(1, Math.round(duration / tick));
			const follow = s.kind === 'zone' && !!s.follow;
			const cx = follow ? x : aimX;
			const cy = follow ? y : aimY;
			const part = s.kind === 'zone' ? 1 : s.kind === 'wall' ? 0.5 : 0.6;
			return Array.from({ length: n }, (_, k) => ({ delay: t0 + k * tick, area: { kind: 'circle', x: cx, y: cy, r: s.radius ?? 90 }, scale: part, follow }));
		}
		case 'barrage': {
			const n = Math.max(1, s.count ?? 10);
			const span = s.duration ?? 1.5;
			const fall = Math.max(0.05, s.delay ?? 0.3);
			return scatterPoints(n, s.radius ?? 150).map((o, i) => ({ delay: t0 + (i * span) / n + fall, area: { kind: 'circle', x: aimX + o.x, y: aimY + o.y, r: s.width ?? 50 }, scale: 1 }));
		}
		default:
			return [];
	}
}

/** Người ở (x, y) có trúng lần xét này không (nới `PVP_PAD` bù trễ mạng). */
export const pvpInStrike = (st: PvpStrike, x: number, y: number): boolean => inArea(st.area, x, y, PVP_PAD);

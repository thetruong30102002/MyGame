import type { QuestTarget } from './storyTypes';

/**
 * Đổi mục tiêu nhiệm vụ (`QuestTarget`) ra một điểm trên map + bán kính dừng. Thuần: Game đưa vào vị trí NPC,
 * vật phẩm, vùng quái… đang có; test node đưa dữ liệu dựng từ town.json — cùng một hàm.
 */

export interface Pos {
	x: number;
	y: number;
}

export interface TargetContext {
	spot(id: string): { x: number; y: number; r: number; name?: string } | undefined;
	/** Vị trí NPC (đang đứng trên map, hoặc chỗ đứng theo dữ liệu nếu chưa dựng). */
	npcPos(key: string): Pos | undefined;
	npcName?(key: string): string;
	pickups: { item: string; x: number; y: number }[];
	/**
	 * `active`: vùng đang có quái (đã dựng, hoặc dựng sẵn theo tuổi). `onDemand`: vùng chỉ một nhiệm vụ bật — đã
	 * dựng thì ở luôn tới hết phiên (quái hồi sinh), nên không được giành chỗ của nhiệm vụ diệt quái không ghi vùng.
	 */
	zones: { id: string; name: string; x: number; y: number; radius: number; monsters: string[]; active?: boolean; onDemand?: boolean }[];
	dummies: { id: string; x: number; y: number }[];
	/** Chỗ boss ngủ theo map; `bossPos` = boss đang đứng (đã đánh thức). */
	boss: Pos | null;
	bossPos?: Pos | null;
	player: Pos;
}

export interface ResolvedTarget extends Pos {
	/** Tới cách tâm ≤ stop là dừng. */
	stop: number;
	/** Tới nơi thì quay mặt về điểm này (hình nộm). */
	face?: Pos;
	label: string;
	/** Bán kính vùng để vẽ trên bản đồ (vùng quái, địa điểm "đi tới"). */
	r?: number;
	/** Mục tiêu đổi theo thời gian (vật phẩm nhặt dần, boss di chuyển) — bộ tự đi hỏi lại định kỳ. */
	dynamic?: boolean;
}

/** < 76px của `nearestInteractable`: tới nơi là hiện ngay gợi ý "Nói chuyện". */
export const STOP_NPC = 48;
export const STOP_PICKUP = 36;
/** Trảm tầm 74: đứng 50–64px quay mặt vào là chém trúng. */
export const STOP_DUMMY = 56;
/** Dưới 300px boss tự lên tiếng. */
export const STOP_BOSS = 280;

const ITEM_NAME: Record<string, string> = { mushroom: 'Nấm Ánh Lam', herb: 'Cỏ thuốc', flower: 'Hoa', stone: 'Đá' };

const dist = (a: Pos, b: Pos): number => Math.hypot(a.x - b.x, a.y - b.y);

function nearest<T extends Pos>(list: T[], from: Pos): T | undefined {
	let best: T | undefined;
	let bestD = Infinity;
	for (const it of list) {
		const d = dist(it, from);
		if (d < bestD) {
			bestD = d;
			best = it;
		}
	}
	return best;
}

/** Chỗ đứng của NPC theo dữ liệu truyện (giống `Game.spawnNpcs`): địa điểm + lệch px, thiếu địa điểm thì điểm hồi sinh. */
export function npcAnchor(at: { spot: string; dx?: number; dy?: number }, spot: Pos | undefined, spawn: Pos): Pos {
	const s = spot ?? spawn;
	return { x: s.x + (at.dx ?? 0), y: s.y + (at.dy ?? 0) };
}

export function resolveTarget(t: QuestTarget | null, ctx: TargetContext): ResolvedTarget | null {
	if (!t) return null;
	switch (t.kind) {
		case 'npc': {
			const p = ctx.npcPos(t.npc);
			return p ? { x: p.x, y: p.y, stop: STOP_NPC, label: ctx.npcName?.(t.npc) ?? t.npc } : null;
		}
		case 'pickup': {
			const label = ITEM_NAME[t.item] ?? t.item;
			const pk = nearest(ctx.pickups.filter((p) => p.item === t.item), ctx.player);
			if (pk) return { x: pk.x, y: pk.y, stop: STOP_PICKUP, label, dynamic: true };
			const s = t.spots.map((id) => ctx.spot(id)).find(Boolean);
			return s ? { x: s.x, y: s.y, stop: STOP_PICKUP, label, dynamic: true } : null;
		}
		case 'kill': {
			let z = t.zone ? ctx.zones.find((m) => m.id === t.zone) : undefined;
			if (!z) {
				const fits = ctx.zones.filter((m) => !t.monster || m.monsters.includes(t.monster));
				const active = fits.filter((m) => m.active);
				const standing = active.filter((m) => !m.onDemand);
				z = nearest(standing.length ? standing : active.length ? active : fits, ctx.player);
			}
			return z ? { x: z.x, y: z.y, stop: Math.min(z.radius * 0.5, 120), label: z.name, r: z.radius } : null;
		}
		case 'practice': {
			const d = (t.dummy && ctx.dummies.find((m) => m.id === t.dummy)) || nearest(ctx.dummies, ctx.player);
			return d ? { x: d.x, y: d.y, stop: STOP_DUMMY, face: { x: d.x, y: d.y }, label: 'Hình nộm luyện tập' } : null;
		}
		case 'reach': {
			const s = ctx.spot(t.spot);
			return s ? { x: s.x, y: s.y, stop: s.r * 0.6, label: s.name ?? t.spot, r: s.r } : null;
		}
		case 'boss': {
			const b = ctx.bossPos ?? ctx.boss;
			return b ? { x: b.x, y: b.y, stop: STOP_BOSS, label: 'Đá phong ấn', dynamic: !!ctx.bossPos } : null;
		}
	}
}

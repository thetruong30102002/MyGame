import { ENEMY_STATS } from './combat/skills';
import type { NpcDef } from './story/storyTypes';
import type { WorldIndexData } from './world/WorldIndex';

/**
 * Thư viện (sổ tay quái / boss / nhân vật — chủ dự án 08/10/2026). Luật THUẦN, test bằng node: dựng danh mục từ dữ liệu có
 * sẵn (chỉ số quái `ENEMY_STATS`, quái theo khu của từng map `world.json`, NPC của cốt truyện) + bảng tên / lời giới thiệu
 * bên dưới. Mục chưa gặp hiện "???" — tiến độ (đã gặp, đã hạ) lưu trong bản lưu truyện (`SaveData.codex`).
 */

export type CodexKind = 'monster' | 'boss' | 'npc';

export interface CodexPlace {
	/** Mã map trong vùng (`town`, `graveyard`…). */
	map: string;
	/** Khu trong map (hang ổ boss) — để trống = cả map. */
	zone?: string;
}

export interface CodexEntry {
	/** Khoá mục: id quái (`mob_zombie_001`) hoặc tên NPC đã chuẩn hoá (`npc:elin ashvale`). */
	id: string;
	kind: CodexKind;
	name: string;
	/** Danh hiệu (NPC — có thể nhiều, theo tuổi) hoặc loại quái. */
	titles: string[];
	lore: string;
	/** Sprite manifest để vẽ chân dung (null = chưa có hình PixelLab). */
	sprite: string | null;
	stats?: { hp: number; atk: number; def: number; speed: number; exp: number; coins: number; ranged: boolean };
	places: CodexPlace[];
	/** NPC: các khoảng tuổi gặp được. */
	ages?: [number, number][];
}

/** Tiến độ Thư viện trong bản lưu: mục đã gặp + số đã hạ theo id quái. */
export interface CodexProgress {
	seen: string[];
	kills: Record<string, number>;
}

export { MONSTER_INFO, NPC_LORE } from '@aether/sim/codex';
import { MONSTER_INFO, NPC_LORE } from '@aether/sim/codex';

const NPC_PREFIX = 'npc:';
export const npcKey = (name: string): string => `${NPC_PREFIX}${name.toLocaleLowerCase('vi')}`;

/**
 * Dựng danh mục. Quái / boss: mọi id có chỉ số (`ENEMY_STATS`), nơi ở = các map có khu chứa nó + map có nó làm boss. NPC: gộp
 * theo tên (mẹ lúc con 4 tuổi và lúc 16 tuổi là một người), nơi ở = map chứa địa điểm đứng (`at.spot`).
 */
export function buildCodex(world: WorldIndexData, npcs: Record<string, NpcDef>, hasSprite: (id: string) => boolean): CodexEntry[] {
	const out: CodexEntry[] = [];
	for (const [id, s] of Object.entries(ENEMY_STATS)) {
		const info = MONSTER_INFO[id];
		const boss = id.startsWith('boss_');
		const places: CodexPlace[] = [];
		for (const [map, m] of Object.entries(world.maps)) {
			for (const z of m.zones) if (z.monsters.includes(id)) places.push(boss ? { map, zone: z.id } : { map });
			if (m.boss === id) places.push({ map });
		}
		out.push({
			id,
			kind: boss ? 'boss' : 'monster',
			name: info?.name ?? id,
			titles: [info?.kind ?? (boss ? 'Boss' : 'Quái thường')],
			lore: info?.lore ?? '',
			sprite: hasSprite(id) ? id : null,
			stats: { hp: s.hp, atk: s.atk, def: s.def, speed: s.speed, exp: s.exp, coins: s.coins, ranged: !!s.ranged },
			places: dedupePlaces(places),
		});
	}
	const byName = new Map<string, CodexEntry>();
	for (const n of Object.values(npcs)) {
		const id = npcKey(n.name);
		let e = byName.get(id);
		if (!e) {
			e = { id, kind: 'npc', name: n.name, titles: [], lore: NPC_LORE[n.name] ?? '', sprite: null, places: [], ages: [] };
			byName.set(id, e);
			out.push(e);
		}
		if (!e.titles.includes(n.title)) e.titles.push(n.title);
		// Hình: sprite của tuổi lớn nhất (Aldric 16 tuổi thay cho Aldric bé) — NPC không sprite (bia đá) giữ null.
		if (n.sprite && hasSprite(n.sprite) && (!e.sprite || n.ages[0] >= Math.max(...e.ages!.map((a) => a[0])))) e.sprite = n.sprite;
		e.ages!.push(n.ages);
		const map = Object.entries(world.maps).find(([, m]) => m.spots.includes(n.at.spot))?.[0];
		if (map) e.places = dedupePlaces([...e.places, { map }]);
	}
	return out;
}

function dedupePlaces(list: CodexPlace[]): CodexPlace[] {
	const seen = new Set<string>();
	return list.filter((p) => {
		const k = `${p.map}|${p.zone ?? ''}`;
		if (seen.has(k)) return false;
		seen.add(k);
		return true;
	});
}

/** Bản lưu lạ / thiếu → tiến độ rỗng; chỉ nhận chuỗi / số nguyên không âm. */
export function cleanCodex(raw: unknown): CodexProgress {
	const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
	const seen = Array.isArray(o.seen) ? [...new Set(o.seen.filter((x): x is string => typeof x === 'string' && x.length <= 64))] : [];
	const kills: Record<string, number> = {};
	if (o.kills && typeof o.kills === 'object') {
		for (const [k, v] of Object.entries(o.kills as Record<string, unknown>)) if (typeof v === 'number' && Number.isFinite(v) && v > 0) kills[k] = Math.floor(v);
	}
	return { seen, kills };
}

export { agesText } from '@aether/sim/codex';

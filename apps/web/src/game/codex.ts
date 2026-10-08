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

/** Tên + lời giới thiệu quái / boss (dữ liệu tay — quái mới thêm vào `ENEMY_STATS` phải khai ở đây, test kiểm đủ). */
export const MONSTER_INFO: Record<string, { name: string; kind: string; lore: string }> = {
	mob_mushroom_001: {
		name: 'Nấm rừng',
		kind: 'Quái thường · rừng',
		lore: 'Mọc thành bầy ở rừng Mossvale. Co người lại là sắp lao tới — đừng lùi, bước ngang. Lửa đốt nó cháy âm ỉ, nước làm nó trương phềnh chậm chạp.',
	},
	mob_zombie_001: {
		name: 'Xác sống',
		kind: 'Quái thường · nghĩa địa',
		lore: 'Lang thang giữa các ô mộ Nghĩa địa Hoàng Hôn. Trâu và chậm, đánh rất đau nhưng chạy vòng được. Sợ lửa hơn sợ kiếm.',
	},
	mob_skeleton_archer_001: {
		name: 'Cung thủ xương',
		kind: 'Quái thường · đồi xương',
		lore: 'Đứng trên Đồi Xương Trắng bắn tên từ xa, ngoài tầm kiếm. Giòn — áp sát được là gãy vụn. Đá ném trúng thì loạng choạng.',
	},
	mob_gargoyle_001: {
		name: 'Gargoyle đá',
		kind: 'Quái thường · vách đá',
		lore: 'Tượng đá sống dậy canh Vách Gargoyle. Da đá giáp dày, lao nhanh. Phá giáp trước rồi hẵng chém, hoặc đóng băng cho nó đứng yên.',
	},
	boss_lich_001: {
		name: 'Vua Lich',
		kind: 'Boss vùng · hầm mộ',
		lore: 'Ngự trong hầm mộ dưới Nghĩa địa Hoàng Hôn, hạ xong vài phút sau lại trỗi dậy. Bắn cầu bóng tối, triệu xương lên từ đất. Đi chậm — giữ khoảng cách và né đòn báo trước.',
	},
	boss_demon_001: {
		name: 'Quỷ vương rừng sâu',
		kind: 'Boss cốt truyện · đá phong ấn',
		lore: 'Bị phong ấn dưới tảng đá cổ sâu trong rừng Mossvale, nơi sợi tơ đỏ rỉ ra từ khe đất. Nổi giận khi mất nửa máu. Đây là lời hứa thuở nhỏ của Lior và Aldric.',
	},
};

/** Lời giới thiệu NPC theo TÊN (một người xuất hiện ở nhiều tuổi với nhiều khoá NPC — gộp làm một mục). */
export const NPC_LORE: Record<string, string> = {
	'Elin Ashvale': 'Mẹ của Lior — pháp sư làng: phép chỉ đủ nhóm bếp, gọi mưa cho vườn rau. Nuôi ong sau nhà. Không hỏi con đang làm gì, chỉ đứng xem.',
	'Garrick Ashvale': 'Cha của Lior — lính gác cũ, kiếm sĩ ít lời. Thường ngồi mài kiếm ở đầu cầu sông Brightwater. "Con gọi, cha đến."',
	Mirelle: 'Nữ trị liệu của Thistlewood, pha thuốc ở nhà thờ. Không thấy sợi Aether, nhưng biết cách để không ai bị bỏng.',
	Bram: 'Thương nhân lữ hành dựng quầy ở quảng trường. Bán bình mật ong, đồ đi đường — và kể đủ chuyện về thế giới rộng hơn rừng Mossvale.',
	Aldric: 'Bạn thuở nhỏ của Lior, "hiệp sĩ tự phong" với thanh Kiếm Sấm Sét bằng gỗ. Lớn lên canh cổng bắc thật. Hai đứa từng ngoéo tay đi đánh Quỷ vương.',
	'Bia đá cổ': 'Tấm bia phủ rêu ở cổng nam Nghĩa địa Hoàng Hôn, khắc những dòng chữ đã mòn gần hết.',
	'Bia Danh Vọng': 'Tấm bia đá giữa quảng trường Thistlewood, khắc tên những người làm nên chuyện: săn quái, hạ boss, đi khắp các vùng, kết bạn. Đạt mục tiêu thì tới đây nhận kim cương.',
};

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

/** Gộp các khoảng tuổi của NPC thành chữ: "4–8 tuổi · từ 16 tuổi". */
export function agesText(ages: [number, number][]): string {
	return [...ages]
		.sort((a, b) => a[0] - b[0])
		.map(([a, b]) => (b >= 99 ? `từ ${a} tuổi` : a === b ? `${a} tuổi` : `${a}–${b} tuổi`))
		.filter((t, i, all) => all.indexOf(t) === i)
		.join(' · ');
}

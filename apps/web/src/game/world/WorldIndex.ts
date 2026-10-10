import type { QuestTarget } from '../story/storyTypes';

/**
 * Chỉ mục một vùng (`assets/maps/<vùng>/world.json`, pipeline sinh cùng các map): map nào có địa điểm / vùng quái /
 * hình nộm / boss nào, lối sang đâu. Dùng để dẫn đường nhiệm vụ XUYÊN map: mục tiêu ở map khác thì chỗ cần tới là
 * lối sang map kế tiếp trên đường đi ngắn nhất.
 */
export interface WorldIndexData {
	region: string;
	start: string;
	maps: Record<
		string,
		{
			name: string;
			width: number;
			height: number;
			exits: { id: string; to: string; x: number; y: number; label: string }[];
			spots: string[];
			/** `level`: cấp quái của khu (vắng = chỉ số gốc). */
			zones: { id: string; monsters: string[]; level?: number }[];
			dummies: string[];
			boss: string | null;
			/** Khoảng cấp quái của map [thấp, cao] (pipeline tính từ các khu) — map an toàn / map cũ chưa dựng lại thì vắng. */
			levels?: [number, number];
		}
	>;
}

export async function loadWorldIndex(region: string): Promise<WorldIndex> {
	const r = await fetch(`/assets/maps/${region}/world.json`);
	if (!r.ok) throw new Error(`Thiếu chỉ mục thế giới ${region} (HTTP ${r.status})`);
	return new WorldIndex((await r.json()) as WorldIndexData);
}

export class WorldIndex {
	constructor(readonly data: WorldIndexData) {}

	get region(): string {
		return this.data.region;
	}

	has(mapId: string): boolean {
		return mapId in this.data.maps;
	}

	name(mapId: string): string {
		return this.data.maps[mapId]?.name ?? mapId;
	}

	mapOfSpot(id: string): string | null {
		return this.find((m) => m.spots.includes(id));
	}

	mapOfZone(id: string): string | null {
		return this.find((m) => m.zones.some((z) => z.id === id));
	}

	mapOfDummy(id: string): string | null {
		return this.find((m) => m.dummies.includes(id));
	}

	mapOfBoss(id: string): string | null {
		return this.find((m) => m.boss === id);
	}

	/**
	 * Map chứa mục tiêu nhiệm vụ. `npcSpot`: địa điểm đứng của NPC theo dữ liệu truyện. Mục tiêu có nhiều map hợp lệ
	 * (diệt quái không ghi vùng, hình nộm không ghi tên) thì ưu tiên map đang đứng, rồi map gần nhất theo số lối.
	 * null = không xác định được (để Game giải trên map hiện tại như trước).
	 */
	mapOfTarget(t: QuestTarget | null, current: string, npcSpot: (key: string) => string | undefined): string | null {
		if (!t) return null;
		switch (t.kind) {
			case 'npc': {
				const spot = npcSpot(t.npc);
				return spot ? this.mapOfSpot(spot) : null;
			}
			case 'pickup':
				return t.spots.map((s) => this.mapOfSpot(s)).find(Boolean) ?? null;
			case 'kill':
				if (t.zone) return this.mapOfZone(t.zone);
				return this.nearest(current, (m) => m.zones.some((z) => !t.monster || z.monsters.includes(t.monster)));
			case 'practice':
				return t.dummy ? this.mapOfDummy(t.dummy) : this.nearest(current, (m) => m.dummies.length > 0);
			case 'reach':
				return this.mapOfSpot(t.spot);
			case 'boss':
				return this.mapOfBoss(t.id);
		}
	}

	/** Lối đầu tiên phải đi từ `from` để tới `to` (đường ít lần chuyển map nhất); null nếu đã ở đó hoặc không có đường. */
	nextExit(from: string, to: string): WorldIndexData['maps'][string]['exits'][number] | null {
		if (from === to) return null;
		const prev = new Map<string, { map: string; exit: WorldIndexData['maps'][string]['exits'][number] }>();
		const queue = [from];
		const seen = new Set([from]);
		while (queue.length) {
			const m = queue.shift()!;
			for (const e of this.data.maps[m]?.exits ?? []) {
				if (seen.has(e.to)) continue;
				seen.add(e.to);
				prev.set(e.to, { map: m, exit: e });
				if (e.to === to) {
					let step = prev.get(to)!;
					while (step.map !== from) step = prev.get(step.map)!;
					return step.exit;
				}
				queue.push(e.to);
			}
		}
		return null;
	}

	private find(test: (m: WorldIndexData['maps'][string]) => boolean): string | null {
		return Object.entries(this.data.maps).find(([, m]) => test(m))?.[0] ?? null;
	}

	/** Map thoả điều kiện gần `from` nhất theo số lần chuyển map (chính nó = 0). */
	private nearest(from: string, test: (m: WorldIndexData['maps'][string]) => boolean): string | null {
		const queue = [from];
		const seen = new Set([from]);
		while (queue.length) {
			const id = queue.shift()!;
			const m = this.data.maps[id];
			if (m && test(m)) return id;
			for (const e of m?.exits ?? []) {
				if (seen.has(e.to)) continue;
				seen.add(e.to);
				queue.push(e.to);
			}
		}
		return null;
	}
}

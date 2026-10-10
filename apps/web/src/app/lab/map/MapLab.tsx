'use client';

import { useEffect, useState } from 'react';
import { regionDef, splitMapKey } from '@aether/sim/regions';
import { WorldMap } from '@/components/WorldMap';
import type { MinimapInfo } from '@/game/world/MapWorld';
import type { WorldIndexData } from '@/game/world/WorldIndex';
import { useGameStore, type MapTab } from '@/store/useGameStore';
import { useSession } from '@/store/useSession';

/** Như `Game.HIDDEN_LANDMARK`: chỗ rải vật phẩm + điểm đến của lối không hiện tên trên bản đồ. */
const HIDDEN_LANDMARK = /^(forest_spot_|herb_spot_)|_entry$|^east_gate$/;

interface LabMap {
	name: string;
	width: number;
	height: number;
	tileSize: number;
	spawn: { x: number; y: number };
	areas: { name: string; x0: number; y0: number; x1: number; y1: number }[];
	spots?: { id: string; name: string; x: number; y: number; r: number }[];
	monsterZones: { id: string; name: string; x: number; y: number; radius: number }[];
}

/**
 * Phòng thử Bản đồ lớn (CHỈ dev): dựng màn phím M với map THẬT của vùng (ảnh toàn cảnh + `world.json` trong `/assets`, web thử
 * :3102 đọc thư mục nháp trước) và dữ liệu người chơi giả — chụp được cả ba tầng mà không cần đăng nhập / máy chủ / bản lưu.
 * Tham số: `?tab=area|region|world` · `?map=human/graveyard` (map đang đứng, mặc định trạm của vùng đầu) · `?level=12` ·
 * `?kills=boss_demon_001,boss_lich_001` (boss đã hạ — cổng vùng) · `?visited=town,mossvale|all|none` (map đã tới; vắng = như máy
 * chủ bản cũ, không làm mờ) · `?ready=swamp` (giả vùng đó đã có map → trạng thái "cần cấp + boss") · `?pick=swamp` (chọn sẵn
 * vùng trên tầng Thế giới — hiện thẻ) · `?quest=0` bỏ hàng nhiệm vụ của tầng Khu vực.
 */
export function MapLab() {
	const [error, setError] = useState<string | null>(null);
	useEffect(() => {
		const q = new URLSearchParams(location.search);
		const { region, map } = splitMapKey(q.get('map') ?? 'human/town', 'human');
		for (const id of (q.get('ready') ?? '').split(',').filter(Boolean)) {
			const r = regionDef(id);
			if (r) (r as { ready: boolean }).ready = true;
		}
		const base = `/assets/maps/${region}/`;
		let live = true;
		void Promise.all([
			fetch(`${base}${map}.json`).then((r) => r.json() as Promise<LabMap>),
			fetch(`${base}${map}.minimap.json`).then((r) => r.json() as Promise<MinimapInfo>),
			fetch(`${base}world.json`).then((r) => r.json() as Promise<WorldIndexData>),
		])
			.then(([m, mini, world]) => {
				if (!live) return;
				const W = m.width * m.tileSize;
				const H = m.height * m.tileSize;
				const visited = q.get('visited');
				const all = Object.keys(world.maps).map((id) => `${region}/${id}`);
				const zone = m.monsterZones[0];
				const tab = (['area', 'region', 'world'] as const).find((t) => t === q.get('tab')) ?? 'area';
				useSession.setState({
					visitedMaps: visited === null ? null : visited === 'all' ? all : visited === 'none' ? [] : visited.split(',').map((k) => (k.includes('/') ? k : `${region}/${k}`)),
				});
				useGameStore.setState({
					status: 'ready',
					scene: 'play',
					dialogue: null,
					card: null,
					panel: null,
					mapOpen: true,
					mapTab: tab as MapTab,
					position: { x: m.spawn.x, y: m.spawn.y },
					direction: 'S',
					stats: { ...useGameStore.getState().stats, level: Number(q.get('level') ?? 7) },
					codex: { entries: [], seen: [], kills: Object.fromEntries((q.get('kills') ?? '').split(',').filter(Boolean).map((id) => [id, 1])), region },
					mapNames: Object.fromEntries(Object.entries(world.maps).map(([id, x]) => [`${region}/${id}`, x.name])),
					quests: q.get('quest') === '0' ? [] : [{ id: 'lab', title: 'Dọn bầy quái gần đây', objective: zone ? `Hạ 6 con ở ${zone.name} rồi quay về báo tin.` : 'Đi một vòng quanh map.', done: false }],
					mapMarkers: { quest: zone ? { x: zone.x, y: zone.y, r: zone.radius, label: zone.name } : null, npcs: [], remotes: [] },
					mapInfo: {
						region,
						map,
						url: `${base}${mini.image}?v=${mini.version}`,
						imgW: mini.width,
						imgH: mini.height,
						scale: mini.width / W,
						worldW: W,
						worldH: H,
						areas: m.areas.map((a, i) => ({ name: a.name, x: (a.x0 + a.x1) / 2, y: i % 2 ? a.y0 + 70 : a.y1 - 110 })),
						landmarks: (m.spots ?? []).filter((s) => !HIDDEN_LANDMARK.test(s.id)).map((s) => ({ id: s.id, name: s.name, x: s.x, y: s.y })),
					},
				});
				// `?pick=`: chọn sẵn một vùng trên tầng Thế giới (focus nhãn vùng = chọn, như bấm Tab tới).
				const pick = q.get('pick');
				if (pick) {
					let tries = 0;
					const t = window.setInterval(() => {
						const el = document.querySelector<HTMLElement>(`[data-region="${CSS.escape(pick)}"]`);
						tries += 1;
						if (el) el.focus({ preventScroll: true });
						if (el || tries > 40) window.clearInterval(t);
					}, 100);
				}
			})
			.catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
		return () => {
			live = false;
		};
	}, []);

	return (
		<main className="relative h-dvh w-dvw touch-none overflow-hidden overscroll-none bg-[#2b3a2a]">
			{error && <p className="absolute left-3 top-3 text-parchment">Không dựng được phòng thử: {error}</p>}
			<WorldMap />
		</main>
	);
}

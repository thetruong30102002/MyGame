'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { regionDef } from '@aether/sim/regions';
import { MONSTER_INFO } from '@/game/codex';
import { regionGraph, regionName, regionStatus, statusText, type GraphNode } from '@/game/world/worldAtlas';
import type { WorldIndexData } from '@/game/world/WorldIndex';
import { useGameStore, type MapInfo } from '@/store/useGameStore';
import { useSession } from '@/store/useSession';
import type { MapRoom } from './WorldMap';

/** Dải tên vùng phía trên sơ đồ (cao + khoảng cách). */
const TITLE = 34;
/** Cỡ một ô của sơ đồ (css px): nhỏ nhất cho điện thoại (chữ 12px, tên 2 dòng), lớn nhất cho máy tính (có ảnh thu nhỏ của map). */
const CELL_MIN = { w: 82, h: 64 };
const CELL_MAX = { w: 172, h: 104 };
const CELL_RICH = { w: 184, h: 150 };
/** Đủ chỗ thì nút map có ảnh toàn cảnh thu nhỏ (minimap của pipeline) phía trên tên. */
const RICH_FROM = { w: 136, h: 124 };

const indexCache = new Map<string, Promise<WorldIndexData | null>>();

/** `world.json` của một vùng (tải một lần, lỗi thì lần sau tải lại); null = vùng không có chỉ mục. */
function loadIndex(region: string): Promise<WorldIndexData | null> {
	let p = indexCache.get(region);
	if (!p) {
		p = fetch(`/assets/maps/${region}/world.json`)
			.then((r) => (r.ok ? (r.json() as Promise<WorldIndexData>) : null))
			.catch(() => null);
		void p.then((d) => {
			if (!d) indexCache.delete(region);
		});
		indexCache.set(region, p);
	}
	return p;
}

/** undefined = đang tải · null = vùng chưa có map (đang xây dựng / tải lỗi). */
function useRegionIndex(region: string): WorldIndexData | null | undefined {
	const [got, setGot] = useState<{ region: string; data: WorldIndexData | null } | null>(null);
	useEffect(() => {
		let live = true;
		if (!regionDef(region)?.ready) setGot({ region, data: null });
		else void loadIndex(region).then((data) => live && setGot({ region, data }));
		return () => {
			live = false;
		};
	}, [region]);
	return got?.region === region ? got.data : undefined;
}

/** Xin máy chủ danh sách map đã tới (kèm tin `hubs`) — không dồn quá một lần mỗi 5 giây (máy chủ giới hạn nhóm tin này). */
let askedAt = 0;

/**
 * Dòng phụ của một nút map: trạm / boss chúa / khoảng cấp, và dòng boss (nút có ảnh: tên boss; nút nhỏ trên điện thoại: chữ
 * "Boss" — tên boss dài không vừa ô ~70px).
 */
function nodeMeta(n: GraphNode, chief: string | undefined, rich: boolean, small: boolean): { line: string; boss: string | null } {
	const zoneBoss = n.bosses.find((b) => b !== chief);
	if (n.hub) return { line: small ? 'Trạm' : 'Trạm · an toàn', boss: null };
	if (chief && n.bosses.includes(chief)) return { line: 'Boss chúa', boss: rich ? `Boss: ${MONSTER_INFO[chief]?.name ?? chief}` : null };
	const lv = n.levels ? (n.levels[0] === n.levels[1] ? `Cấp ${n.levels[0]}` : `Cấp ${n.levels[0]}–${n.levels[1]}`) : 'Không có quái';
	if (!zoneBoss) return { line: lv, boss: null };
	if (rich) return { line: lv, boss: `Boss: ${MONSTER_INFO[zoneBoss]?.name ?? zoneBoss}` };
	return small ? { line: lv, boss: 'Boss' } : { line: `${lv} · boss`, boss: null };
}

/**
 * Tầng **Vùng** của bản đồ lớn: sơ đồ các map của một vùng (`world.json` + ô khai tay `REGION_LAYOUTS`) — nút map (tên, khoảng
 * cấp, trạm / boss), đường nối theo lối thật, map đang đứng viền vàng + "Bạn ở đây", map chưa tới mờ đi (máy chủ trả danh sách map
 * đã tới kèm tin `hubs`; chơi đơn / máy chủ bản cũ thì không làm mờ). Lối sang vùng khác là nút cổng nét đứt (bấm → tầng Thế giới).
 * Màn nhỏ (điện thoại, màn ngang thấp) thì sơ đồ cuộn trong khung, mở ra đã căn giữa map đang đứng.
 */
export function RegionMap({ region, here, room, onGate }: { region: string; here: MapInfo; room: MapRoom; onGate: (region: string) => void }) {
	const data = useRegionIndex(region);
	const visited = useSession((s) => s.visitedMaps);
	const online = useSession((s) => s.online);
	const level = useGameStore((s) => s.stats.level);
	const kills = useGameStore((s) => s.codex.kills);
	const scroller = useRef<HTMLDivElement>(null);
	const def = regionDef(region);

	useEffect(() => {
		if (!online || Date.now() - askedAt < 5000) return;
		askedAt = Date.now();
		online.hubs();
	}, [online]);

	const graph = useMemo(() => (data ? regionGraph(data) : null), [data]);
	const viewH = room.h - TITLE;
	let cw = CELL_MIN.w;
	let ch = CELL_MIN.h;
	let rich = false;
	if (graph) {
		const fitW = Math.floor(room.w / graph.cols);
		const fitH = Math.floor(viewH / graph.rows);
		rich = fitW >= RICH_FROM.w && fitH >= RICH_FROM.h;
		const max = rich ? CELL_RICH : CELL_MAX;
		cw = Math.max(CELL_MIN.w, Math.min(max.w, fitW));
		ch = Math.max(CELL_MIN.h, Math.min(max.h, fitH));
	}
	const W = graph ? graph.cols * cw : 0;
	const H = graph ? graph.rows * ch : 0;
	const boxW = Math.min(W, room.w);
	const boxH = Math.min(H, viewH);
	// Ô hẹp (điện thoại): nút gần chạm nhau (khe 4px) để tên tiếng Anh dài nhất ("Thistlewood", "Brightwater") vẫn vừa một dòng.
	const small = cw < 100;
	const nodeW = cw - (rich ? 18 : small ? 4 : 8);
	const thumbH = Math.min(ch - 66, Math.round(nodeW * 0.56));
	const at = (col: number, row: number): { x: number; y: number } => ({ x: (col - (graph?.col0 ?? 0) + 0.5) * cw, y: (row - (graph?.row0 ?? 0) + 0.5) * ch });
	const isHere = region === here.region;
	const seen = visited ? new Set([...visited, `${here.region}/${here.map}`]) : null;
	const chief = def?.chief?.id;

	// Mở ra căn giữa map đang đứng (sơ đồ lớn hơn khung — điện thoại, màn ngang thấp). Chỉ căn lúc đổi vùng / đổi cỡ ô.
	useLayoutEffect(() => {
		const el = scroller.current;
		const me = graph?.nodes.find((n) => n.id === here.map);
		if (!el || !graph) return;
		const p = me && isHere ? at(me.col, me.row) : { x: W / 2, y: H / 2 };
		el.scrollLeft = Math.max(0, p.x - el.clientWidth / 2);
		el.scrollTop = Math.max(0, p.y - el.clientHeight / 2);
	}, [graph, cw, ch, isHere, here.map]);

	if (!def) return null;
	const visitedCount = graph && seen ? graph.nodes.filter((n) => seen.has(`${region}/${n.id}`)).length : null;

	return (
		<>
			<div className="mb-2 flex min-h-[26px] items-baseline gap-x-2 px-1" style={{ width: 0, minWidth: '100%' }}>
				<p className="min-w-0 truncate font-display text-label font-extrabold text-ink-brown">{def.name}</p>
				{/* Màn hẹp: bớt chữ phụ cho tên vùng khỏi bị cắt. */}
				<p className="shrink-0 text-note whitespace-nowrap text-ink-soft">
					<span className="max-[419px]:hidden">Vùng {def.order} · </span>cấp {def.levels[0]}–{def.levels[1]}
					{graph && <span className="max-[519px]:hidden"> · {graph.nodes.length} map</span>}
				</p>
				{visitedCount !== null && graph && (
					<p className="ml-auto shrink-0 text-note whitespace-nowrap text-ink-soft max-[459px]:hidden" title="Map viền nét đứt, chữ nhạt là map chưa tới">
						Đã tới {visitedCount}/{graph.nodes.length}
						<span className="max-[679px]:hidden"> · nét đứt = chưa tới</span>
					</p>
				)}
			</div>
			{data === undefined && <p className="ui-tray px-3 py-6 text-center text-body text-ink-soft" style={{ width: Math.min(room.w, 360) }}>Đang mở sơ đồ vùng…</p>}
			{data === null && (
				<div className="ui-tray flex flex-col items-center gap-2 px-4 py-6 text-center" style={{ width: Math.min(room.w, 380) }}>
					<p className="text-read font-extrabold">{def.ready ? 'Chưa tải được sơ đồ vùng này.' : 'Vùng đất này đang được xây dựng — chưa có map.'}</p>
					<p className="text-body text-ink-soft">{def.intro}</p>
					<button type="button" className="ui-chip mt-1" onClick={() => onGate(region)}>
						Xem trên Thế giới
					</button>
				</div>
			)}
			{graph && (
				<div
					ref={scroller}
					className="ui-tray relative shrink-0 self-center touch-pan-x touch-pan-y overflow-auto overscroll-contain [scrollbar-color:var(--color-paper-line)_transparent] [scrollbar-width:thin]"
					style={{ width: boxW, height: boxH }}
				>
					<div className="relative" style={{ width: W, height: H }}>
						<svg className="pointer-events-none absolute inset-0" width={W} height={H} aria-hidden="true">
							{graph.links.map(([a, b]) => {
								const na = graph.nodes.find((n) => n.id === a)!;
								const nb = graph.nodes.find((n) => n.id === b)!;
								const pa = at(na.col, na.row);
								const pb = at(nb.col, nb.row);
								return <line key={`${a}|${b}`} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke="#8a6440" strokeWidth={rich ? 5 : 4} strokeLinecap="round" />;
							})}
							{graph.gates.map((g) => {
								const from = graph.nodes.find((n) => n.id === g.from)!;
								const pa = at(from.col, from.row);
								const pb = at(g.col, g.row);
								return <line key={`${g.from}>${g.to}`} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke="#8a6440" strokeWidth={3} strokeDasharray="6 5" strokeLinecap="round" />;
							})}
						</svg>
						{graph.gates.map((g) => {
							const p = at(g.col, g.row);
							const st = regionStatus(g.region, here.region, { level, bossKills: kills });
							return (
								<button
									key={`${g.from}>${g.to}`}
									type="button"
									onClick={() => onGate(g.region)}
									title={`Xem ${regionName(g.region)} trên bản đồ Thế giới`}
									className="absolute -translate-x-1/2 -translate-y-1/2 rounded-[6px] border-2 border-dashed border-bark bg-paper px-1 py-1 text-center transition-[filter] hover:brightness-105"
									style={{ left: p.x, top: p.y, width: nodeW }}
								>
									<span className="block text-[12px] leading-[15px] font-extrabold text-ink-brown">→ {regionName(g.region)}</span>
									<span className={`block text-[12px] leading-[15px] font-bold ${st.kind === 'open' || st.kind === 'here' ? 'text-leaf' : 'text-berry'}`}>{statusText(st)}</span>
								</button>
							);
						})}
						{graph.nodes.map((n) => {
							const p = at(n.col, n.row);
							const me = isHere && n.id === here.map;
							const dim = !!seen && !seen.has(`${region}/${n.id}`);
							const meta = nodeMeta(n, chief, rich, small);
							return (
								<div key={n.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: p.x, top: p.y, width: nodeW }}>
									{/* Treo trên mép nút (chồng 4px lên viền) — không che dòng tên. */}
									{me && <span className="ui-tag absolute bottom-[calc(100%-4px)] left-1/2 z-[1] h-5 -translate-x-1/2 border-2 border-outline bg-gold whitespace-nowrap text-ink-brown">Bạn ở đây</span>}
									{/* Map chưa tới: nền vẫn ĐẶC (đường nối không lộ qua), chỉ viền nét đứt + chữ / ảnh nhạt đi. */}
									<div
										className={`flex flex-col overflow-hidden rounded-[6px] border-2 text-center ${
											me ? 'border-outline bg-honey shadow-[0_2px_0_var(--color-bark)] ring-[3px] ring-gold-hi' : dim ? 'border-dashed border-ink-faint bg-paper-sunk' : 'border-bark bg-paper-hi shadow-[0_2px_0_var(--color-bark)]'
										}`}
										title={dim ? `${n.name} — chưa tới` : n.name}
									>
										{rich && (
											<img
												src={`/assets/maps/${region}/${n.id}.minimap.png`}
												alt=""
												draggable={false}
												loading="lazy"
												className={`w-full max-w-none object-cover ${dim ? 'opacity-45 grayscale' : ''}`}
												style={{ height: thumbH }}
											/>
										)}
										<div className={rich ? 'px-1.5 py-1' : small ? 'px-0.5 py-0.5' : 'px-1 py-0.5'}>
											<p className={`line-clamp-2 font-extrabold ${dim ? 'text-ink-faint' : 'text-ink-brown'} ${rich ? 'text-[14px] leading-[17px]' : small ? 'text-[12px] leading-[15px] tracking-[-0.01em]' : 'text-[13px] leading-[16px]'}`}>{n.name}</p>
											<p className={`text-[12px] leading-[15px] font-bold ${dim ? 'text-ink-faint' : 'text-ink-soft'}`}>{meta.line}</p>
											{meta.boss && <p className={`truncate text-[12px] leading-[15px] font-bold ${dim ? 'text-ink-faint' : 'text-berry'}`}>{meta.boss}</p>}
										</div>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			)}
		</>
	);
}

'use client';

import { useGameStore, type MapInfo } from '@/store/useGameStore';
import { DIRECTION_DEG, PlayerArrow } from './Minimap';
import type { MapRoom } from './WorldMap';

/** Hàng nhiệm vụ dưới ảnh: tới ~74px khi mục tiêu dài 2 dòng (+ khoảng cách) — thiếu thì hàng lòi ra dưới viền gỗ. */
const QUEST_ROW = 82;

/**
 * Tâm nhãn tên khu kẹp vào trong ảnh: khu sát mép (bìa rừng phía tây…) có tâm gần mép, nhãn căn giữa sẽ lòi nửa chữ ra
 * ngoài khung (điện thoại thu nhỏ hay gặp). Bề ngang nhãn ước theo số ký tự (font hiển thị ~0,55em mỗi ký tự).
 */
function clampLabel(x: number, text: string, px: number, width: number): number {
	const half = (text.length * px * 0.55) / 2 + 4;
	return half * 2 >= width ? width / 2 : Math.min(width - half, Math.max(half, x));
}

/**
 * Tầng **Khu vực** của bản đồ lớn = bản đồ map đang đứng (như trước khi có ba tầng): ảnh toàn cảnh 1/8 của pipeline + tên khu,
 * địa danh, lối, NPC, người chơi khác, chỗ làm nhiệm vụ, đường tự đi, mũi tên của mình + hàng nhiệm vụ có nút Dẫn đường.
 */
export function AreaMap({ info, room, close }: { info: MapInfo; room: MapRoom; close: () => void }) {
	const pos = useGameStore((s) => s.position);
	const dir = useGameStore((s) => s.direction);
	const markers = useGameStore((s) => s.mapMarkers);
	const auto = useGameStore((s) => s.autoWalk);
	const quests = useGameStore((s) => s.quests);
	const name = useGameStore((s) => s.mapNames[`${info.region}/${info.map}`]);
	const requestAutoWalk = useGameStore((s) => s.requestAutoWalk);

	// Phóng ảnh 1/8 theo chỗ còn lại: ≥1 thì làm tròn xuống số nguyên + giữ nét pixel; <1 (điện thoại) thì thu mượt.
	const raw = Math.min(room.w / info.imgW, (room.h - QUEST_ROW) / info.imgH);
	const k = raw >= 1 ? Math.floor(raw) : Math.max(0.3, raw);
	const dw = Math.round(info.imgW * k);
	const dh = Math.round(info.imgH * k);
	const f = info.scale * k;
	const quest = quests.find((q) => !q.done);
	const q = markers.quest;
	const tiny = k < 1;

	return (
		<>
			<div className="relative shrink-0 self-center overflow-hidden rounded-[4px] ring-2 ring-bark" style={{ width: dw, height: dh }}>
				<img src={info.url} alt={`Bản đồ ${name ?? ''}`.trim()} draggable={false} className="absolute inset-0 h-full w-full max-w-none" style={{ imageRendering: k >= 1 ? 'pixelated' : 'auto' }} />
				<svg className="absolute inset-0" width={dw} height={dh} viewBox={`0 0 ${info.worldW} ${info.worldH}`} preserveAspectRatio="none">
					{q?.r && <circle cx={q.x} cy={q.y} r={q.r} fill="rgba(250,204,21,0.14)" stroke="rgba(250,204,21,0.6)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />}
					{auto && (
						<polyline
							points={[pos, ...auto.path].map((p) => `${p.x},${p.y}`).join(' ')}
							fill="none"
							stroke="#facc15"
							strokeWidth="2"
							strokeDasharray="5 4"
							strokeLinecap="round"
							vectorEffect="non-scaling-stroke"
						/>
					)}
				</svg>
				{info.areas.map((a) => (
					<span
						key={a.name}
						className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-display font-extrabold text-white text-outline ${tiny ? 'text-[12px]' : 'text-[16px]'}`}
						style={{ left: clampLabel(a.x * f, a.name, tiny ? 12 : 16, dw), top: a.y * f }}
					>
						{a.name}
					</span>
				))}
				{/* Bản đồ thu nhỏ (điện thoại): ẩn nhãn mốc và tên NPC thay vì ép chữ xuống dưới 12px. */}
				{!tiny &&
					info.landmarks.map((l) => (
						<span key={l.id} className="ui-tag pointer-events-none absolute h-5 -translate-x-1/2 -translate-y-1/2 bg-bark/85 text-parchment" style={{ left: l.x * f, top: l.y * f }}>
							{l.name}
						</span>
					))}
				{markers.npcs.map((n) => (
					<span key={n.key} className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-0.5" style={{ left: n.x * f, top: n.y * f }}>
						<span className="h-2 w-2 rounded-full bg-white ring-1 ring-outline" />
						{!tiny && <span className="whitespace-nowrap text-[12px] font-bold text-white text-outline">{n.name}</span>}
					</span>
				))}
				{markers.remotes.map((r, i) => (
					<span key={`${r.name}-${i}`} className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-0.5" style={{ left: r.x * f, top: r.y * f }}>
						<span className="h-2 w-2 rounded-full bg-sky ring-1 ring-outline" />
						{!tiny && <span className="whitespace-nowrap text-[12px] font-bold text-sky text-outline">{r.name}</span>}
					</span>
				))}
				{q && (
					<span className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={{ left: q.x * f, top: q.y * f }}>
						<span className="h-2.5 w-2.5 rounded-full bg-gold ring-2 ring-outline" />
						<span className="ui-tag mt-0.5 h-5 bg-gold text-ink-brown">{q.label}</span>
					</span>
				)}
				<span className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2" style={{ left: pos.x * f, top: pos.y * f }}>
					<PlayerArrow deg={DIRECTION_DEG[dir] ?? 90} size={tiny ? 14 : 18} />
				</span>
			</div>
			{quest && (
				// Bề ngang 0 + tối thiểu 100%: hàng nhiệm vụ theo bề ngang ảnh, chữ dài không kéo giãn khung (khung `w-fit`).
				<div className="ui-tray mt-2 flex items-center gap-2 px-3 py-2" style={{ width: 0, minWidth: '100%' }}>
					<div className="min-w-0 flex-1">
						<p className="truncate text-read font-extrabold">{quest.title}</p>
						<p className="line-clamp-2 text-body text-ink-soft">{quest.objective}</p>
					</div>
					{q && (
						<button
							type="button"
							onClick={() => {
								requestAutoWalk('start');
								close();
							}}
							className="ui-btn shrink-0"
						>
							Dẫn đường
						</button>
					)}
				</div>
			)}
		</>
	);
}

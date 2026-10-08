'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { SWORD_STYLE_INFO } from '@/game/combat/talents';
import type { BranchId, TalentsView } from '@/store/useGameStore';
import { LockGlyph } from '../SkillIcon';
import { BranchIcon, hasNodeIcon, NodeIcon } from './TalentArt';
import { KIND_LABEL, nodeAria, nodeInfo, type NodeInfo } from './talentInfo';
import { type EdgeKind, type LaidEdge, type LaidNode, type TreeLayout, type TreeParams } from './treeLayout';

/** Màu nét theo loại đoạn (bảng "Đường nối" của đặc tả). `--color-line-lit` chưa có trong globals.css → khai ở đây. */
const LINE = { bark: '#4a2e1c', lit: '#e9b949', amber: '#8a5a12', paper: '#c9a578' } as const;
/** Vẽ từ mờ tới sáng: đoạn sáng nằm trên cùng khi hai đoạn chạm nhau ở chỗ rẽ. */
const ORDER: EdgeKind[] = ['dim', 'off', 'soon', 'next', 'lit'];

function Edge({ e, head }: { e: LaidEdge; head: number }) {
	const c = { x1: e.x1, y1: e.y1 - head, x2: e.x2, y2: e.y2 - head };
	switch (e.kind) {
		case 'lit':
			return (
				<>
					<line {...c} stroke={LINE.bark} strokeWidth={6} strokeLinecap="square" />
					<line {...c} stroke={LINE.lit} strokeWidth={2} strokeLinecap="square" />
				</>
			);
		case 'next':
			return <line {...c} stroke={LINE.amber} strokeWidth={3} strokeDasharray="5 4" />;
		case 'soon':
			return <line {...c} stroke={LINE.paper} strokeWidth={3} strokeDasharray="2 4" />;
		case 'dim':
			return <line {...c} stroke={LINE.paper} strokeOpacity={0.45} strokeWidth={3} />;
		default:
			return <line {...c} stroke={LINE.paper} strokeWidth={3} />;
	}
}

/** Một dòng trạng thái ngắn cho tooltip / dòng phụ ("Học được · 3 điểm", "Thuộc Thủy Thần lưu — tẩy điểm để đổi"…). */
export function stateLine(i: NodeInfo, unspent: number): { text: string; tone: 'ok' | 'warn' | 'plain' } {
	switch (i.state) {
		case 'reached':
			return { text: i.kind === 'passive' ? 'Đã đạt' : 'Đã học', tone: 'ok' };
		case 'next':
			return { text: `Học được · ${i.cost} điểm`, tone: 'ok' };
		case 'next-poor':
			return { text: `Cần ${i.cost} điểm (bạn còn ${unspent})`, tone: 'warn' };
		case 'soon':
			return { text: 'Sắp có — mở ở bản sau', tone: 'plain' };
		case 'dim':
			return { text: `Thuộc ${i.styleName} lưu — tẩy điểm để đổi`, tone: 'warn' };
		case 'locked':
			return { text: i.lockNote || 'Nhánh chưa mở', tone: 'plain' };
		default:
			if (i.kind === 'art') return { text: 'Tự học khi đủ Kiếm 5 + hệ 5', tone: 'plain' };
			return i.route ? { text: `Còn ${i.route.keys.length} lần cộng · tổng ${i.route.total} điểm`, tone: 'plain' } : { text: '', tone: 'plain' };
	}
}

/** Nút đi tới theo phím mũi tên: gần nhất theo hướng, ưu tiên cùng cột/cùng hàng (trục phụ phạt gấp 3). */
function neighbour(nodes: LaidNode[], from: LaidNode, key: string): LaidNode | null {
	const dir = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[key];
	if (!dir) return null;
	let best: LaidNode | null = null;
	let score = Infinity;
	for (const n of nodes) {
		if (n === from) continue;
		const dx = n.x - from.x;
		const dy = n.y - from.y;
		const main = dx * dir[0]! + dy * dir[1]!;
		if (main <= 0) continue;
		const side = Math.abs(dir[0] ? dy : dx);
		const s = main + side * 3;
		if (s < score) {
			score = s;
			best = n;
		}
	}
	return best;
}

/**
 * Lưới cây Tiềm năng (khung CỔ ĐIỂN): dải đầu cột dính, thước mốc + dải nền mốc chẵn, đường nối SVG đơn sắc nằm dưới các
 * nút, nhãn lưu phái / dải kiếm pháp, 81 nút tuyệt đối. Bấm nút = CHỌN (không bao giờ tiêu điểm); bấm đầu cột = sang chế
 * độ Từng nhánh. Máy tính: khung cuộn dọc riêng; điện thoại: cả tab cuộn chung (đầu cột dính theo vùng cuộn của tab).
 */
export function TalentTreeGrid({
	t,
	L,
	p,
	scroll,
	fine,
	selected,
	route,
	onSelect,
	onHead,
}: {
	t: TalentsView;
	L: TreeLayout;
	p: TreeParams;
	/** true: khung cuộn riêng (máy tính, màn thấp); false: cả tab cuộn chung (điện thoại dọc). */
	scroll: boolean;
	/** Có chuột thật (hover + pointer fine): mới hiện tooltip khi rê. */
	fine: boolean;
	selected: string | null;
	/** Lộ trình tới nút đang chọn ở xa: tô bằng nét "next". */
	route: Set<string> | null;
	onSelect: (key: string | null) => void;
	onHead: (b: BranchId) => void;
}) {
	const scrollRef = useRef<HTMLDivElement>(null);
	const btns = useRef(new Map<string, HTMLButtonElement>());
	const [focusKey, setFocusKey] = useState<string | null>(null);
	const [tip, setTip] = useState<{ key: string; below: boolean } | null>(null);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
	useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

	const head = p.head;
	const bodyH = L.height - head;
	// Bộ co cho điện thoại hẹp (`fitPhoneTree`): cột < 36px — chip giá sát nút hơn, tên nhánh ở đầu cột nhỏ lại cho vừa cột.
	const tight = Math.min(p.swordCol, p.elemCol) < 36;
	const sword = t.branches.find((b) => b.branch === 'sword');
	// Có nhãn lưu phái (dải rẽ đủ cao): ngã ba chưa chọn thì giá nằm ở nhãn, chip giá trên ba nút mốc 3 sẽ đè lên nhãn.
	const forkLabels = p.forkBand >= 30;
	const forkOpen = forkLabels && !!sword?.styles?.length && !sword.style && sword.unlocked && sword.tier === (sword.styleTier ?? 3) - 1 && sword.nextCost !== null;
	const reached = useMemo(() => new Set(L.nodes.filter((n) => n.state === 'reached').map((n) => n.key)), [L]);
	const edges = useMemo(() => [...L.edges].sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind)), [L]);
	const routeEdges = useMemo(() => (route ? L.edges.filter((e) => route.has(e.to) && (route.has(e.from) || reached.has(e.from))) : []), [L, route, reached]);
	// Roving tabindex: một nút duy nhất nhận Tab — nút vừa đi tới bằng phím / vừa bấm, nút đang chọn, hoặc nấc kế đầu tiên.
	const tabKey = (focusKey && L.nodes.some((n) => n.key === focusKey) ? focusKey : null) ?? selected ?? L.nodes.find((n) => n.state === 'next')?.key ?? L.nodes[0]?.key;

	const showTip = (key: string): void => {
		if (!fine) return;
		if (timer.current) clearTimeout(timer.current);
		timer.current = setTimeout(() => {
			const n = L.nodes.find((x) => x.key === key);
			const sc = scrollRef.current;
			if (!n) return;
			// Nút ở nửa dưới vùng đang thấy → tooltip lên trên, khỏi bị mép khung cuộn cắt.
			const view = sc && scroll ? { top: sc.scrollTop, h: sc.clientHeight - head } : { top: 0, h: bodyH };
			setTip({ key, below: n.y - head - view.top < view.h / 2 });
		}, 150);
	};
	const hideTip = (): void => {
		if (timer.current) clearTimeout(timer.current);
		setTip(null);
	};

	const onKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
		const cur = L.nodes.find((n) => n.key === (document.activeElement as HTMLElement | null)?.dataset.key);
		if (!cur) return;
		const to = neighbour(L.nodes, cur, e.key);
		if (!to) return;
		e.preventDefault();
		setFocusKey(to.key);
		btns.current.get(to.key)?.focus();
	};

	// Chi tiết + icon của 81 nút chỉ dựng lại khi cây đổi (không theo mỗi lần rê chuột / đổi nút chọn).
	const infos = useMemo(() => new Map(L.nodes.map((n) => [n.key, nodeInfo(t, n.key)])), [L, t]);
	const tipInfo = tip ? (infos.get(tip.key) ?? null) : null;
	const tipNode = tip ? L.nodes.find((n) => n.key === tip.key) : null;
	const tipLeft = (n: LaidNode): number => {
		const right = n.x + n.size / 2 + 8;
		return Math.max(4, right + 210 <= L.width - 4 ? right : n.x - n.size / 2 - 218);
	};

	return (
		<div
			ref={scrollRef}
			data-tree-scroll
			className={`relative shrink-0 rounded-[8px] border-2 border-paper-line bg-paper ${tight ? 'tt-tight' : ''} ${scroll ? 'tt-scroll min-h-0 flex-1 touch-pan-y overflow-y-auto overflow-x-hidden overscroll-contain' : ''}`}
			style={{ width: scroll ? 'fit-content' : L.width + 4 }}
			onMouseLeave={hideTip}
		>
			{/* Dải đầu cột: dính trên cùng vùng cuộn (điện thoại: vùng cuộn của tab có lề trên 16px nên top −16). */}
			<div className="sticky z-[6] border-b-2 border-paper-line bg-paper-hi" style={{ top: scroll ? 0 : -16, height: head, width: L.width }}>
				<span className="absolute left-0 top-0 flex items-center justify-center text-[11px] font-extrabold text-ink-faint" style={{ width: p.ruler, height: head - 2, writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
					Mốc
				</span>
				{L.columns.map((c) => {
					const b = t.branches.find((x) => x.branch === c.branch);
					if (!b) return null;
					const group = c.branch === 'sword';
					const wide = p.head >= 50;
					return (
						<button
							key={c.branch}
							type="button"
							tabIndex={-1}
							onClick={() => onHead(c.branch)}
							title={b.unlocked ? `${b.name} · mốc ${b.tier}/${b.maxTier} — xem từng mốc` : b.lockNote}
							className={`absolute top-0 flex flex-col items-center justify-center gap-px text-center font-sans ${tight ? 'text-[10px] tracking-[-0.02em]' : 'text-[12px]'} font-extrabold leading-[14px] ${b.unlocked ? 'text-ink-brown' : 'text-ink-faint'} ${group ? 'border-r-2 border-dashed border-paper-line' : ''} hover:bg-paper-sunk/50`}
							style={{ left: c.x, width: c.w, height: head - 2 }}
						>
							<span className={`flex items-center justify-center ${b.unlocked ? '' : 'opacity-60 grayscale'}`} style={{ height: wide ? 26 : 20 }}>
								{b.unlocked ? <BranchIcon branch={c.branch} iconSkill={b.iconSkill} box={wide ? 24 : 18} /> : <LockGlyph size={wide ? 20 : 10} />}
							</span>
							<span className="whitespace-nowrap">
								{b.name}
								{b.unlocked && wide && <span className="text-amber"> {group ? `${b.tier}/${b.maxTier}` : b.tier}</span>}
							</span>
						</button>
					);
				})}
			</div>

			<div
				role="group"
				aria-label="Cây tiềm năng: 6 nhánh, mỗi nhánh 10 mốc"
				className="relative"
				style={{ width: L.width, height: bodyH }}
				onKeyDown={onKeyDown}
				onClick={(e) => {
					// Chạm chỗ trống của lưới = bỏ chọn (đóng sheet chi tiết trên điện thoại).
					if (e.target === e.currentTarget) onSelect(null);
				}}
			>
				{L.rows.map((y, tier) =>
					tier > 0 && tier % 2 === 0 ? <div key={`z${tier}`} className="pointer-events-none absolute inset-x-0 bg-[rgb(201_165_120/0.14)]" style={{ top: y - head - p.step / 2, height: p.step }} /> : null,
				)}
				{L.rows.map((y, tier) =>
					tier > 0 ? (
						<span key={`r${tier}`} className="pointer-events-none absolute left-0 flex items-center justify-center font-sans text-[12px] font-extrabold leading-none text-ink-faint tabular-nums" style={{ top: y - head - 8, width: p.ruler, height: 16 }}>
							{tier}
						</span>
					) : null,
				)}
				<svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width={L.width} height={bodyH} aria-hidden>
					{edges.map((e, i) => (
						<Edge key={i} e={e} head={head} />
					))}
					{routeEdges.map((e, i) => (
						<Edge key={`route${i}`} e={{ ...e, kind: 'next' }} head={head} />
					))}
				</svg>
				{forkLabels &&
					sword?.styles?.map((s, i) => {
						const [a, ...rest] = SWORD_STYLE_INFO[s.id].name.split(' ');
						return (
							<span key={s.id} className="tt-fork-label" data-on={s.chosen || undefined} data-off={(sword.style && !s.chosen) || undefined} style={{ left: L.styleX[i], top: L.forkLabelY - head }}>
								{a}
								<br />
								{rest.join(' ')}
								{forkOpen && <b className={t.unspent >= (sword.nextCost ?? 0) ? 'text-amber' : 'text-berry'}> {sword.nextCost}đ</b>}
							</span>
						);
					})}
				{p.artBand >= 30 && (
					<span className="tt-band-label" style={{ left: p.ruler + 6, top: L.artY - head }}>
						Kiếm pháp nguyên tố
						<br />
						cần Kiếm 5 + hệ 5 →
					</span>
				)}
				{L.nodes.map((n) => {
					const i = infos.get(n.key) ?? null;
					const skillId = i?.skillId;
					const icon = hasNodeIcon(skillId, n.branch, n.tier, n.style);
					const colW = n.branch === 'sword' && !n.art ? p.swordCol : p.elemCol;
					const box = n.shape === 'ult' ? n.size - 12 : n.shape === 'art' ? n.size - 6 : n.size - 8;
					const style = {
						left: n.x - n.size / 2,
						top: n.y - head - n.size / 2,
						width: n.size,
						height: n.size,
						// Vùng chạm phủ cả ô lưới (điện thoại: nút 28px, ô 36–38 × 34).
						'--hx': Math.max(0, Math.floor((colW - n.size) / 2)),
						'--hy': Math.max(0, Math.floor((p.step - n.size) / 2)),
						scrollMarginTop: head + 8,
						scrollMarginBottom: scroll ? 8 : 200,
					} as CSSProperties;
					return (
						<button
							key={n.key}
							ref={(el) => {
								if (el) btns.current.set(n.key, el);
								else btns.current.delete(n.key);
							}}
							type="button"
							data-key={n.key}
							data-shape={n.shape}
							data-state={n.state}
							data-route={route?.has(n.key) || undefined}
							className="tt-node"
							style={style}
							tabIndex={n.key === tabKey ? 0 : -1}
							aria-pressed={selected === n.key}
							aria-label={i ? nodeAria(i) : n.key}
							onClick={() => onSelect(selected === n.key ? null : n.key)}
							onFocus={() => setFocusKey(n.key)}
							onMouseEnter={() => showTip(n.key)}
							onMouseLeave={hideTip}
						>
							<span className="tt-ic">{icon ? <NodeIcon skillId={skillId} branch={n.branch} tier={n.tier} style={n.style} box={box} /> : <span className="tt-dots">…</span>}</span>
							{(n.state === 'next' || n.state === 'next-poor') && n.cost > 0 && !(forkLabels && n.style && !sword?.style && n.tier === (sword?.styleTier ?? 3)) && (
								<span className="tt-cost" data-poor={n.state === 'next-poor' || undefined}>
									{n.cost}đ
								</span>
							)}
						</button>
					);
				})}
				{tip && tipInfo && tipNode && (
					<div
						role="tooltip"
						className="pointer-events-none absolute z-20 w-[210px] rounded-[8px] border-2 border-bark bg-paper-hi px-2.5 py-2 text-[13px] leading-[19px] text-ink-soft shadow-[0_3px_0_rgb(26_17_10/0.45)]"
						style={{
							left: tipLeft(tipNode),
							...(tip.below ? { top: tipNode.y - head - tipNode.size / 2 } : { bottom: bodyH - (tipNode.y - head + tipNode.size / 2) }),
						}}
					>
						<p>
							<b className="text-ink-brown">{tipInfo.name}</b> · {tipInfo.kind === 'art' ? `Kiếm pháp ${tipInfo.branchName}` : `${tipInfo.styleName ?? tipInfo.branchName} mốc ${tipInfo.tier}`} · {KIND_LABEL[tipInfo.kind].toLowerCase()}
						</p>
						{tipInfo.brief && <p>{tipInfo.brief}</p>}
						{(() => {
							const s = stateLine(tipInfo, t.unspent);
							return s.text ? <p className={`font-extrabold ${s.tone === 'warn' ? 'text-berry' : s.tone === 'ok' ? 'text-leaf' : 'text-ink-faint'}`}>{s.text}</p> : null;
						})()}
					</div>
				)}
			</div>
		</div>
	);
}

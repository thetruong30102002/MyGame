'use client';

import { Fragment, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { BRANCHES, SWORD_STYLE_INFO, SWORD_STYLES } from '@/game/combat/talents';
import type { BranchId, EnchantId, SwordStyleId, TalentBranchView, TalentNodeView, TalentsView } from '@/store/useGameStore';
import { LockGlyph, SkillIcon } from '../SkillIcon';
import { BranchIcon, hasNodeIcon, NodeIcon, StyleIcon } from './TalentArt';
import { KIND_LABEL, skillBrief, skillSheet, statLine } from './talentInfo';
import { BRANCH_INK, SkillStats, TierPips } from './TalentParts';
import { artKey, edgeKind, learnableNow, nodeKey, nodeState, styleKey, type EdgeKind, type NodeState } from './treeLayout';

/** Nét theo loại đoạn như trên cây: đã học = liền màu mực của nhánh, nấc kế = đứt hổ phách, sắp có / xem trước = đứt giấy. */
function lineLook(kind: EdgeKind, color: string, dir: 'v' | 'h'): CSSProperties {
	const side = dir === 'v' ? 'borderLeft' : 'borderTop';
	const thick = dir === 'v' ? { width: 4, marginLeft: -2 } : { height: 4, marginTop: -2 };
	const thin = dir === 'v' ? { width: 3, marginLeft: -1 } : { height: 3, marginTop: -1 };
	if (kind === 'lit') return { ...thick, background: color };
	if (kind === 'next') return { [side]: '3px dashed var(--color-amber)', ...(dir === 'v' ? { marginLeft: -1 } : { marginTop: -1 }) };
	if (kind === 'soon') return { [side]: '3px dashed var(--color-paper-line)', ...(dir === 'v' ? { marginLeft: -1 } : { marginTop: -1 }) };
	return { ...thin, background: 'var(--color-paper-line)', opacity: kind === 'dim' ? 0.45 : 1 };
}

/** Đoạn dọc tuyệt đối ở `x` (px), từ `top` tới `bottom` (hoặc cao `height`) của khối cha `relative`. */
function VLine({ kind, color, x, top = 0, bottom, height }: { kind: EdgeKind | null; color: string; x: number; top?: number; bottom?: number; height?: number }) {
	if (!kind) return null;
	return <span aria-hidden className="pointer-events-none absolute" style={{ left: x, top, ...(height !== undefined ? { height } : { bottom: bottom ?? 0 }), ...lineLook(kind, color, 'v') }} />;
}

interface RowData {
	key: string;
	b: TalentBranchView;
	n: TalentNodeView;
	style?: SwordStyleId;
	state: NodeState;
	top: EdgeKind | null;
	bottom: EdgeKind | null;
	preview?: boolean;
}

function stateTag(r: RowData): ReactNode {
	if (r.state === 'reached') return <span className="ui-tag bg-leaf text-paper-hi">{r.n.kind === 'passive' ? 'Đã đạt' : 'Đã học'}</span>;
	if (r.state === 'next' || r.state === 'next-poor') return <span className="ui-tag bg-amber text-paper-hi">BƯỚC KẾ TIẾP</span>;
	if (r.state === 'soon') return <span className="ui-tag border-2 border-dashed border-paper-line text-ink-faint">Sắp có</span>;
	if (r.state === 'dim') return <span className="ui-tag bg-paper-sunk text-ink-faint">lưu phái khác</span>;
	return null;
}

/** Một mốc = một hàng: cột trái là đường dọc + nút, bên phải tên · loại · mô tả (số liệu ở hàng kế tiếp / hàng mở rộng). */
function TierRow({
	r,
	t,
	color,
	big,
	inlineLearn,
	expanded,
	onToggle,
	onLearn,
}: {
	r: RowData;
	t: TalentsView;
	color: string;
	big: boolean;
	inlineLearn: boolean;
	expanded: boolean;
	onToggle: () => void;
	onLearn: () => void;
}) {
	const { n, b, state } = r;
	const kind = n.tier >= 10 ? 'ult' : n.kind;
	const isNext = (state === 'next' || state === 'next-poor') && !r.preview;
	const sk = n.skillId && n.ready ? skillBrief(n.skillId) : null;
	const sheet = n.skillId && n.ready ? skillSheet(t, n.skillId, n.tier) : null;
	const brief = sk ? sk.brief || n.desc : n.desc;
	const size = big ? 44 : 36;
	const col = big ? 62 : 52;
	const lk = (k: EdgeKind | null): EdgeKind | null => (k && r.preview ? 'soon' : k);
	const icon = hasNodeIcon(n.skillId, b.branch, n.tier, r.style);
	return (
		<li
			data-row={r.key}
			data-next={isNext || undefined}
			aria-current={isNext ? 'step' : undefined}
			className={`relative grid gap-x-2 rounded-[8px] ${isNext ? 'bg-honey/60' : ''}`}
			style={{ gridTemplateColumns: `${col}px minmax(0,1fr)`, scrollMarginTop: big ? 8 : 88, scrollMarginBottom: big ? 8 : 96 }}
		>
			<div className="relative flex justify-center pt-2 pb-2">
				<VLine kind={lk(r.top)} color={color} x={col / 2} height={8} />
				<VLine kind={lk(r.bottom)} color={color} x={col / 2} top={8 + size} />
				<span
					className="tt-node"
					data-shape={kind === 'ult' ? 'ult' : kind === 'active' ? 'act' : 'pas'}
					data-state={r.preview && state !== 'soon' ? (isNext || state === 'next' ? 'next' : 'future') : state}
					style={{ position: 'relative', width: size, height: size, cursor: 'default', alignSelf: 'flex-start' }}
				>
					<span className="tt-ic">{icon ? <NodeIcon skillId={n.skillId} branch={b.branch} tier={n.tier} style={r.style} box={size - 12} /> : <span className="tt-dots">…</span>}</span>
				</span>
				<span style={{ left: Math.max(0, (col - size) / 2 - 7) }} className="pointer-events-none absolute top-0.5 z-[4] flex h-[18px] min-w-[18px] items-center justify-center rounded-[4px] border-2 border-outline bg-paper-hi px-0.5 text-[12px] font-extrabold leading-none text-ink-brown tabular-nums">
					{n.tier}
				</span>
			</div>
			<div className="min-w-0 py-1.5 pr-1">
				<button type="button" className="block w-full text-left" aria-expanded={expanded} onClick={onToggle}>
					<span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
						<b className={`font-display ${big ? 'text-[18px]' : 'text-[16px]'} leading-6 ${state === 'locked' || state === 'dim' ? 'text-ink-faint' : 'text-ink-brown'}`}>{n.name}</b>
						<span className="text-[12px] font-bold text-ink-soft">{KIND_LABEL[kind].toLowerCase()}</span>
						{stateTag(r)}
						{r.preview && <span className="ui-tag border-2 border-dashed border-amber text-amber">xem trước</span>}
						{!isNext && (state === 'future' || state === 'locked') && n.ready && n.cost > 0 && (
							<span className="ml-auto rounded-[4px] border-2 border-paper-line px-1 text-[12px] font-extrabold leading-[14px] text-ink-faint tabular-nums">{n.cost}đ</span>
						)}
					</span>
					<span className={`block text-note ${state === 'locked' || state === 'dim' ? 'text-ink-faint' : 'text-ink-soft'}`}>{brief}</span>
					{sheet && !(isNext || expanded) && <span className="block text-[12px] leading-4 text-ink-faint tabular-nums">{statLine(sheet)}</span>}
				</button>
				{sheet && (isNext || expanded) && (
					<div className="mt-1.5">
						<SkillStats sheet={sheet} compact={!big} />
						{!big && sheet.how.length > 0 && <p className="mt-1 text-[12px] leading-4 text-ink-soft">{[...sheet.how, ...sheet.effects].join(' · ')}</p>}
					</div>
				)}
				{isNext && inlineLearn && (
					<div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
						<button type="button" className="ui-btn" disabled={state !== 'next'} onClick={onLearn}>
							{state === 'next' ? `Học mốc ${n.tier} · ${n.cost}đ` : `Cần ${n.cost} điểm`}
						</button>
						<span className="text-note text-ink-soft">{state === 'next' ? `bạn còn ${t.unspent}` : 'Lên cấp để có thêm điểm'}</span>
					</div>
				)}
			</div>
		</li>
	);
}

/** Một nút thoi kiếm pháp nhỏ (không bấm trực tiếp — nằm trong nút của khối). */
function ArtDiamond({ skillId, state, size }: { skillId: string; state: NodeState; size: number }) {
	return (
		<span className="tt-node" data-shape="art" data-state={state} style={{ position: 'relative', width: size, height: size, cursor: 'inherit' }}>
			<span className="tt-ic">
				<SkillIcon skillId={skillId} box={size - 6} />
			</span>
		</span>
	);
}


/**
 * Chế độ "Từng nhánh" (đặc tả cây 1.4) — đường chính cho ngón tay: dải 6 nhánh, tiêu đề nhánh + thanh mốc, mỗi mốc một
 * hàng, ngã ba lưu phái (xem trước rồi mới chọn), khối Kiếm pháp nguyên tố sau mốc 5, và thanh "BƯỚC KẾ TIẾP" dính đáy trên
 * điện thoại dọc. `boxed`: danh sách cuộn trong khung riêng (máy tính / màn thấp) thay vì theo cả tab.
 */
export function TalentBranchList({
	t,
	branch,
	setBranch,
	phone,
	boxed,
	narrowTabs,
	rail = false,
	tools,
	onLearn,
	onChooseStyle,
}: {
	t: TalentsView;
	branch: BranchId;
	setBranch: (b: BranchId) => void;
	phone: boolean;
	boxed: boolean;
	narrowTabs: boolean;
	/** Màn thấp (xoay ngang): dải nhánh thành cột dọc bên trái, danh sách mốc chiếm trọn chiều cao còn lại. */
	rail?: boolean;
	/** Cụm Tẩy điểm + "?" (máy tính) — đặt bên phải tiêu đề nhánh. */
	tools?: ReactNode;
	/** `tier` = mốc đích nút đang hiện (Game bỏ qua khi mốc đã khác — chống nhấp đúp mua lố). */
	onLearn: (b: BranchId, tier?: number) => void;
	onChooseStyle: (s: SwordStyleId) => void;
}) {
	const b = t.branches.find((x) => x.branch === branch) ?? t.branches[0];
	const [expanded, setExpanded] = useState<string | null>(null);
	const [preview, setPreview] = useState<SwordStyleId>('kiem_than');
	const [confirm, setConfirm] = useState(false);
	const listRef = useRef<HTMLDivElement>(null);
	/**
	 * Chọn / Thôi gỡ hộp xác nhận cùng nút đang giữ focus, rồi tới nhịp HUD sau cả khối ngã ba đổi (đã theo lưu phái). Trong
	 * 1,5 giây, lần vẽ nào thấy focus rơi xuống body thì đưa về nút Học của hàng kế (hoặc nút / thẻ của ngã ba).
	 */
	const refocus = useRef(0);
	const tabRefs = useRef(new Map<BranchId, HTMLButtonElement>());
	/** Hàng cần cuộn tới sau lần vẽ kế (bấm thoi kiếm pháp → nhảy nhánh tới mốc 5). */
	const jumpKey = useRef<string | null>(null);
	const firstRun = useRef(true);
	const learnable = new Set(learnableNow(t).map((s) => s.branch));

	useEffect(() => {
		setExpanded(null);
		setConfirm(false);
	}, [branch]);
	// Esc khi hộp xác nhận lưu phái đang mở: chỉ đóng hộp, không đóng cả bảng (tab cha nhường vì thấy `data-esc-own`).
	useEffect(() => {
		if (!confirm) return undefined;
		const onKey = (e: globalThis.KeyboardEvent): void => {
			if (e.key !== 'Escape' || e.repeat) return;
			e.stopPropagation();
			refocus.current = performance.now() + 1500;
			setConfirm(false);
		};
		window.addEventListener('keydown', onKey, true);
		return () => window.removeEventListener('keydown', onKey, true);
	}, [confirm]);
	useEffect(() => {
		if (!refocus.current) return;
		if (performance.now() > refocus.current) {
			refocus.current = 0;
			return;
		}
		const a = document.activeElement;
		if (a && a !== document.body && !(a instanceof HTMLButtonElement && a.disabled)) return;
		const root = listRef.current;
		const el = root?.querySelector<HTMLElement>('[data-next] .ui-btn:not(:disabled)') ?? root?.querySelector<HTMLElement>('[data-fork-now] .ui-btn:not(:disabled)') ?? root?.querySelector<HTMLElement>('[data-fork-now] button[aria-pressed="true"]');
		el?.focus({ preventScroll: true });
	});
	// Đổi nhánh hoặc vừa học xong (mốc / lưu phái đổi) → cuộn hàng kế tiếp vào giữa. Lần đầu mở chế độ chỉ kéo vừa đủ thấy.
	useLayoutEffect(() => {
		const root = listRef.current;
		if (!root) return;
		const key = jumpKey.current;
		jumpKey.current = null;
		const el = key ? root.querySelector<HTMLElement>(`[data-row="${key}"]`) : (root.querySelector<HTMLElement>('[data-next]') ?? root.querySelector<HTMLElement>('[data-fork-now]'));
		el?.scrollIntoView({ block: firstRun.current ? 'nearest' : 'center' });
		firstRun.current = false;
	}, [branch, b?.tier, b?.style]);

	if (!b) return null;
	const color = BRANCH_INK[b.branch];
	const sword = b.branch === 'sword';
	const st = b.styleTier ?? 3;
	const col = phone ? 52 : 62;
	const cx = col / 2;
	const showStyle: SwordStyleId | null = sword ? (b.style ?? preview) : null;
	const styleView = sword ? b.styles?.find((s) => s.id === showStyle) : undefined;

	// Hàng: Kiếm = mốc 1–2 chung + mốc 3–10 của lưu phái đang theo (chưa chọn: lưu phái đang xem trước).
	const raw: { key: string; n: TalentNodeView; style?: SwordStyleId; preview?: boolean }[] = sword
		? [
				...b.nodes.filter((n) => n.tier < st).map((n) => ({ key: nodeKey('sword', n.tier), n })),
				...(styleView?.nodes ?? []).map((n) => ({ key: styleKey(styleView!.id, n.tier), n, style: styleView!.id, preview: !b.style })),
			]
		: b.nodes.map((n) => ({ key: nodeKey(b.branch, n.tier), n }));
	const states = raw.map((r) => nodeState(t, r.key));
	const rows: RowData[] = raw.map((r, i) => ({
		...r,
		b,
		state: states[i]!,
		top: i > 0 ? edgeKind(states[i - 1]!, states[i]!) : null,
		bottom: i < raw.length - 1 ? edgeKind(states[i]!, states[i + 1]!) : null,
	}));

	const nextRow = rows.find((r) => (r.state === 'next' || r.state === 'next-poor') && !r.preview);
	const forkNow = sword && !b.style && b.unlocked && b.tier === st - 1;
	const forkCost = b.nextCost ?? 0;
	const poor = t.unspent < (b.nextCost ?? 0);

	const onTabKey = (e: KeyboardEvent<HTMLDivElement>): void => {
		const fwd = e.key === 'ArrowRight' || (rail && e.key === 'ArrowDown');
		const back = e.key === 'ArrowLeft' || (rail && e.key === 'ArrowUp');
		if (!fwd && !back) return;
		e.preventDefault();
		const i = BRANCHES.indexOf(b.branch);
		const to = BRANCHES[(i + (fwd ? 1 : BRANCHES.length - 1)) % BRANCHES.length]!;
		setBranch(to);
		tabRefs.current.get(to)?.focus();
	};

	/** Nhảy sang nhánh khác, cuộn tới mốc `tier` (Kiếm: theo lưu phái đang theo, chưa chọn thì tới ngã ba). */
	const jump = (to: BranchId, tier: number): void => {
		const sw = t.branches.find((x) => x.branch === 'sword');
		jumpKey.current = to === 'sword' ? (sw?.style ? styleKey(sw.style, tier) : null) : nodeKey(to, tier);
		setBranch(to);
	};

	const tabs = (
		<div
			role="tablist"
			aria-label="Nhánh tiềm năng"
			aria-orientation={rail ? 'vertical' : 'horizontal'}
			onKeyDown={onTabKey}
			className={rail ? 'tt-scroll flex w-[112px] shrink-0 touch-pan-y flex-col gap-1 overflow-y-auto' : `flex gap-1 ${narrowTabs ? 'touch-pan-x overflow-x-auto pb-0.5 [scrollbar-width:none]' : ''}`}
		>
			{t.branches.map((x) => {
				const on = x.branch === b.branch;
				return (
					<button
						key={x.branch}
						ref={(el) => {
							if (el) tabRefs.current.set(x.branch, el);
							else tabRefs.current.delete(x.branch);
						}}
						type="button"
						role="tab"
						aria-selected={on}
						tabIndex={on ? 0 : -1}
						onClick={() => setBranch(x.branch)}
						title={x.unlocked ? `${x.name} · mốc ${x.tier}/${x.maxTier}` : x.lockNote}
						className={`relative flex rounded-[8px] border-2 leading-[14px] ${rail ? 'min-h-[34px] shrink-0 items-center gap-1.5 px-1.5' : `min-h-[52px] min-w-[48px] flex-col items-center justify-center px-0.5 py-1 ${on ? 'flex-[1.9]' : 'flex-1'}`} ${on ? 'border-bark bg-paper-hi shadow-[0_2px_0_var(--color-bark)]' : 'border-paper-line bg-paper-sunk'} ${x.unlocked ? 'text-ink-brown' : 'text-ink-faint'}`}
					>
						<span className={`flex h-6 items-center ${x.unlocked ? '' : 'opacity-60 grayscale'}`}>{x.unlocked ? <BranchIcon branch={x.branch} iconSkill={x.iconSkill} box={24} /> : <LockGlyph size={20} />}</span>
						<span className={`max-w-full truncate text-[12px] font-extrabold ${rail ? 'min-w-0 flex-1 text-left' : ''}`}>{x.name}</span>
						<span className="text-[12px] font-bold tabular-nums">{x.unlocked ? `${x.tier}/${x.maxTier}` : 'khoá'}</span>
						{learnable.has(x.branch) && <span className="tt-dot -right-1 -top-1" aria-label="có mốc học được ngay" />}
					</button>
				);
			})}
		</div>
	);

	const title = (
		<div className="flex items-start gap-2">
			<div className="flex min-w-0 flex-1 flex-col gap-1">
			<p className="flex flex-wrap items-baseline gap-x-2">
				<b className="font-display text-[20px] leading-7 text-ink-brown">{b.name}</b>
				<span className="text-note text-ink-soft tabular-nums">
					{b.unlocked ? (
						<>
							mốc {b.tier}/{b.maxTier} · <b className={b.bonusPct > 0 ? 'text-amber' : ''}>+{b.bonusPct}%</b> sức mạnh{sword && b.style ? ` · ${SWORD_STYLE_INFO[b.style].name}` : ''}
						</>
					) : (
						b.lockNote
					)}
				</span>
			</p>
			<div className="w-full max-w-[360px]">
				<TierPips tier={b.tier} cap={b.cap} branch={b.branch} locked={!b.unlocked} />
			</div>
			</div>
			{tools}
		</div>
	);

	// ——— Ngã ba lưu phái (Kiếm, giữa mốc 2 và 3) ———
	const shown = sword ? (b.style ?? preview) : null;
	const shownIdx = shown ? SWORD_STYLES.indexOf(shown) : 0;
	const two = rows.find((r) => r.n.tier === st - 1);
	const three = rows.find((r) => r.n.tier === st);
	const trunk: EdgeKind | null = two && three ? (b.style ? edgeKind(two.state, three.state) : forkNow ? 'next' : two.state === 'locked' ? 'dim' : 'off') : null;
	const pct = (i: number): string => `${((2 * i + 1) * 100) / 6}%`;
	const forkBlock =
		sword && b.styles?.length ? (
			<li key="fork" data-fork-now={forkNow || undefined} className="relative" style={{ scrollMarginTop: phone ? 88 : 8 }}>
				<div className="relative" style={{ paddingLeft: col }}>
					<VLine kind={trunk} color={color} x={cx} />
					<p className="py-1 text-note font-extrabold text-ink-brown">
						Mốc {st} — chọn MỘT lưu phái <span className="font-bold text-ink-faint">{b.style ? '(đổi = tẩy điểm)' : '(chạm để xem trước)'}</span>
					</p>
				</div>
				{/* Rẽ theo %: thanh ngang từ đường dọc → 3 nhánh xuống 1/6, 1/2, 5/6 bề ngang (không đo DOM). */}
				<div className="relative pt-3">
					<span aria-hidden className="pointer-events-none absolute top-0" style={{ left: cx, right: `${100 / 6}%`, ...lineLook(trunk === 'lit' || trunk === 'next' ? 'off' : (trunk ?? 'off'), color, 'h') }} />
					{trunk && (trunk === 'lit' || trunk === 'next') && (
						<span aria-hidden className="pointer-events-none absolute top-0" style={{ left: cx, width: `calc(${pct(shownIdx)} - ${cx}px)`, ...lineLook(trunk, color, 'h') }} />
					)}
					{SWORD_STYLES.map((s, i) => {
						const k: EdgeKind = s === shown && trunk ? trunk : b.style ? 'dim' : 'off';
						return <span key={s} aria-hidden className="pointer-events-none absolute top-0 h-3" style={{ left: pct(i), ...lineLook(k, color, 'v') }} />;
					})}
					<div className="grid grid-cols-3 gap-2">
						{b.styles.map((s) => {
							const chosen = s.chosen;
							const other = !!b.style && !chosen;
							const pv = !b.style && preview === s.id;
							const [lead, ...rest] = SWORD_STYLE_INFO[s.id].play.split(':');
							return (
								<button
									key={s.id}
									type="button"
									aria-pressed={chosen || pv}
									disabled={!!b.style}
									onClick={() => {
										setPreview(s.id);
										setConfirm(false);
									}}
									className={`flex min-w-0 flex-col items-center gap-0.5 rounded-[8px] border-2 px-1 py-1.5 text-center ${chosen ? 'border-[#8a4a0a] bg-honey' : pv ? 'border-amber bg-paper-hi shadow-[0_0_0_2px_var(--color-gold-hi)]' : 'border-paper-line bg-paper'} ${other ? 'opacity-50 grayscale' : ''}`}
								>
									<StyleIcon style={s.id} fallbackSkill={s.iconSkill} box={24} />
									<b className="font-display text-[14px] leading-[18px] text-ink-brown">{s.name}</b>
									<span className="line-clamp-3 text-[12px] leading-[15px] text-ink-soft">
										<b>{lead}</b>
										{rest.length ? `:${rest.join(':')}` : ''}
									</span>
									{chosen && <span className="ui-tag mt-0.5 h-5 bg-paper-hi text-ink-brown">Đang theo</span>}
									{other && <span className="text-[12px] font-bold leading-[14px] text-ink-faint">tẩy điểm để đổi</span>}
								</button>
							);
						})}
					</div>
				</div>
				{/* Từ thẻ đang theo / đang xem trước quay về đường dọc của các hàng bên dưới. */}
				<div className="relative h-3">
					<span aria-hidden className="pointer-events-none absolute top-0 bottom-0" style={{ left: pct(shownIdx), ...lineLook(trunk ?? 'off', color, 'v') }} />
					<span aria-hidden className="pointer-events-none absolute bottom-0" style={{ left: cx, width: `calc(${pct(shownIdx)} - ${cx}px)`, ...lineLook(trunk ?? 'off', color, 'h') }} />
				</div>
				{!b.style && (
					<div className="relative" style={{ paddingLeft: col }}>
						<VLine kind="soon" color={color} x={cx} />
						<div className="flex flex-col gap-1.5 rounded-[8px] border-2 border-paper-line bg-paper-hi px-2.5 py-2">
							<p className="text-note text-ink-soft">
								<b className="text-ink-brown">{SWORD_STYLE_INFO[preview].name} lưu</b> — {SWORD_STYLE_INFO[preview].play} {SWORD_STYLE_INFO[preview].enchants}
							</p>
							{confirm ? (
								<div data-esc-own className="flex flex-wrap items-center gap-2">
									<p className="w-full text-note font-extrabold text-ink-brown">
										Theo {SWORD_STYLE_INFO[preview].name} lưu? Tốn {forkCost} điểm, đổi sau phải tẩy điểm.
									</p>
									<button
										type="button"
										className="ui-chip"
										autoFocus
										onClick={() => {
											refocus.current = performance.now() + 1500;
											setConfirm(false);
											onChooseStyle(preview);
										}}
									>
										Chọn
									</button>
									<button
										type="button"
										className="ui-chip"
										onClick={() => {
											refocus.current = performance.now() + 1500;
											setConfirm(false);
										}}
									>
										Thôi
									</button>
								</div>
							) : forkNow ? (
								<div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
									<button type="button" className="ui-btn" disabled={t.unspent < forkCost} onClick={() => setConfirm(true)}>
										{t.unspent < forkCost ? `Cần ${forkCost} điểm` : `Chọn · ${forkCost} điểm`}
									</button>
									<span className="text-note text-ink-soft">{t.unspent < forkCost ? 'Lên cấp để có thêm điểm' : 'Chọn MỘT · đổi = tẩy điểm'}</span>
								</div>
							) : (
								<p className="text-note text-ink-faint">{b.unlocked ? `Cần Kiếm mốc ${st - 1} trước.` : b.lockNote}</p>
							)}
							<p>
								<span className="ui-tag border-2 border-dashed border-paper-line text-ink-soft">
									{SWORD_STYLE_INFO[preview].name} lưu · mốc {st}–10 · xem trước
								</span>
							</p>
						</div>
					</div>
				)}
			</li>
		) : null;

	// ——— Khối Kiếm pháp nguyên tố, nối ngang từ đường dọc sau mốc 5 ———
	const five = rows.find((r) => r.n.tier === 5);
	const ownArt = !sword ? t.arts.find((x) => x.element === (b.branch as EnchantId)) : undefined;
	const artLit = sword ? t.arts.some((a) => a.learned) : !!ownArt?.elementOk;
	const artsBlock = (
		<li key="arts" className="relative grid gap-x-2" style={{ gridTemplateColumns: `${col}px minmax(0,1fr)` }}>
			<div className="relative">
				<VLine kind={five?.bottom ? (five.preview ? 'soon' : five.bottom) : null} color={color} x={cx} />
				<span aria-hidden className="pointer-events-none absolute top-1/2" style={{ left: cx, right: -8, ...lineLook(artLit ? 'lit' : 'off', color, 'h') }} />
			</div>
			<div className="ui-paper my-1 px-2 py-1.5">
				<p className="font-display text-[15px] font-extrabold leading-5 text-ink-brown">Kiếm pháp nguyên tố</p>
				{sword ? (
					<>
						<p className="text-[12px] leading-4 text-ink-soft">
							Kiếm 5 ({b.tier >= 5 ? 'đủ' : `đang ${b.tier}`}) + hệ đó 5 → học đòn kiếm mang hệ, lưu phái nào cũng được.
						</p>
						<div className="mt-1.5 grid grid-cols-5 gap-1">
							{t.arts.map((a) => {
								const eb = t.branches.find((x) => x.branch === a.element);
								return (
									<button key={a.element} type="button" className="flex min-w-0 flex-col items-center gap-1 rounded-[6px] py-1 hover:bg-paper-sunk/60" onClick={() => jump(a.element, 5)} title={`${a.name} — ${a.need}`}>
										<span className="flex h-[34px] items-center">
											<ArtDiamond skillId={a.skillId} state={nodeState(t, artKey(a.element))} size={phone ? 22 : 24} />
										</span>
										<span className="text-[12px] font-extrabold leading-[14px] text-ink-brown">{a.elementName}</span>
										<span className={`text-[12px] font-bold leading-[14px] tabular-nums ${a.learned ? 'text-leaf' : 'text-ink-faint'}`}>{a.learned ? 'Đã học' : eb?.unlocked ? `${eb.tier}/5` : 'khoá'}</span>
									</button>
								);
							})}
						</div>
					</>
				) : ownArt ? (
					<button type="button" className="mt-1 flex w-full items-center gap-2.5 rounded-[6px] text-left hover:bg-paper-sunk/60" onClick={() => jump('sword', 5)}>
						<span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center">
							<ArtDiamond skillId={ownArt.skillId} state={nodeState(t, artKey(ownArt.element))} size={26} />
						</span>
						<span className="min-w-0">
							<b className="block font-display text-[15px] leading-5 text-ink-brown">{ownArt.name}</b>
							<span className="block text-[12px] leading-4 text-ink-soft">
								{ownArt.learned
									? 'Đã học'
									: `Cần ${ownArt.need} · Kiếm đang ${(() => {
											const sw = t.branches.find((x) => x.branch === 'sword');
											return sw?.unlocked ? `${sw.tier}/5` : 'khoá';
										})()}`}
							</span>
						</span>
					</button>
				) : null}
			</div>
		</li>
	);

	const list = (
		<ol className="flex flex-col">
			{rows.map((r) => (
				<Fragment key={r.key}>
					{sword && r.n.tier === st && forkBlock}
					<TierRow
						r={r}
						t={t}
						color={color}
						big={!phone}
						inlineLearn={!phone}
						expanded={expanded === r.key}
						onToggle={() => setExpanded(expanded === r.key ? null : r.key)}
						onLearn={() => {
							// Học xong thì nút này rời hàng (hàng kế mới có nút) — giữ focus cho phím Tab như sau hộp xác nhận.
							refocus.current = performance.now() + 1500;
							onLearn(b.branch, r.n.tier);
						}}
					/>
					{r.n.tier === 5 && artsBlock}
				</Fragment>
			))}
		</ol>
	);

	// Thanh "BƯỚC KẾ TIẾP" (điện thoại dọc): luôn thấy nút Học cao 44 dù đang cuộn tới đâu.
	const capped = b.unlocked && b.nextCost === null;
	const goNext = (): void => listRef.current?.querySelector<HTMLElement>(forkNow ? '[data-fork-now]' : '[data-next]')?.scrollIntoView({ block: 'center' });
	const nextBar = phone && (
		<div className="sticky -bottom-5 z-20 -mx-2 -mb-5 mt-2 flex items-center gap-2 border-t-2 border-bark bg-honey px-3 pt-2 pb-[max(8px,env(safe-area-inset-bottom))]">
			<button type="button" className="min-w-0 flex-1 text-left" onClick={goNext}>
				<span className="block text-[12px] font-extrabold uppercase leading-4 tracking-[0.04em] text-ink-soft">Bước kế tiếp</span>
				<b className="block truncate font-display text-[16px] leading-[22px] text-ink-brown">
					{!b.unlocked
						? `Nhánh chưa mở — ${b.lockNote}`
						: forkNow
							? `Mốc ${st} · chọn lưu phái`
							: capped
								? b.tier >= b.maxTier
									? 'Nhánh đã đầy'
									: `Mốc ${b.tier + 1} sắp có`
								: nextRow
									? `Mốc ${nextRow.n.tier} · ${nextRow.n.name}`
									: ''}
				</b>
				{b.unlocked && !capped && poor && <span className="block text-[12px] leading-4 text-ink-faint">Lên cấp để có thêm điểm</span>}
			</button>
			{b.unlocked && !capped && (
				<button
					type="button"
					className="ui-btn h-11 shrink-0"
					disabled={poor}
					onClick={() => {
						if (forkNow) {
							setConfirm(true);
							goNext();
						} else onLearn(b.branch, b.tier + 1);
					}}
				>
					{poor ? `Cần ${b.nextCost} điểm` : forkNow ? `Chọn · ${b.nextCost} điểm` : `Học · ${b.nextCost} điểm`}
				</button>
			)}
		</div>
	);

	if (rail) {
		return (
			<div className="flex min-h-0 flex-1 gap-2">
				{tabs}
				<div ref={listRef} className="tt-scroll min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain rounded-[8px] border-2 border-paper-line bg-paper px-1.5 py-1">
					{title}
					{list}
				</div>
			</div>
		);
	}
	if (boxed) {
		return (
			<div className="flex min-h-0 flex-1 flex-col gap-2">
				{tabs}
				{title}
				<div ref={listRef} className="tt-scroll min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain rounded-[8px] border-2 border-paper-line bg-paper px-1.5 py-1">
					{list}
				</div>
			</div>
		);
	}
	return (
		<div ref={listRef} className="flex flex-col gap-2">
			<div className="sticky -top-4 z-10 -mx-2 border-b-2 border-paper-line bg-paper px-2 pt-1 pb-1.5">{tabs}</div>
			{title}
			{list}
			{nextBar}
		</div>
	);
}

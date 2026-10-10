'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { DEPTH_BONUS, SWORD_ART_TIER, SWORD_STYLE_INFO, SWORD_STYLES } from '@/game/combat/talents';
import type { BranchId, SwordStyleId, TalentsView } from '@/store/useGameStore';
import { BranchIcon, hasNodeIcon, NodeIcon } from './TalentArt';
import { fmtNum, KIND_LABEL, nodeInfo, skillSheet, statLine, type NodeInfo } from './talentInfo';
import { BRANCH_FILL, KIND_TONE, SkillHow, SkillStats, StateTag, TierPips } from './TalentParts';
import { findNode, learnableNow, nextSteps, nodeKey, styleKey, type NextStep } from './treeLayout';

/** Icon trong ô đá 58×57 (vùng trong 32×31) — dùng chung cho cột bên và sheet. */
export function NodeSlot({ info }: { info: NodeInfo }) {
	const icon = hasNodeIcon(info.skillId, info.branch, info.tier, info.style);
	return (
		<div className={`ui-slot relative flex h-[57px] w-[58px] shrink-0 items-center justify-center ${info.state === 'locked' || info.state === 'dim' ? 'grayscale' : ''}`}>
			{icon ? <NodeIcon skillId={info.skillId} branch={info.branch} tier={info.tier} style={info.style} box={32} /> : <span className="text-[15px] font-extrabold text-parchment-dim">…</span>}
		</div>
	);
}

function StepIcon({ t, s, box }: { t: TalentsView; s: NextStep; box: number }) {
	if (s.fork) return <BranchIcon branch="sword" iconSkill={null} box={box} />;
	const f = findNode(t, s.key);
	return hasNodeIcon(f?.n.skillId, s.branch, s.tier, s.style) ? <NodeIcon skillId={f?.n.skillId} branch={s.branch} tier={s.tier} style={s.style} box={box} /> : <span style={{ width: box, height: box }} />;
}

const stepLabel = (t: TalentsView, s: NextStep): string => `${t.branches.find((b) => b.branch === s.branch)?.name ?? ''} ${s.tier}`;

/**
 * Chưa chọn nút nào: khối "HỌC ĐƯỢC NGAY" (nhánh chính của build lên trước, tối đa 5 dòng). Bấm dòng = chọn nút đó trên
 * cây. Điện thoại: chip cuộn ngang trong sheet. Máy tính: mỗi dòng ghi thêm loại mốc + một câu số liệu.
 */
export function LearnableList({ t, sheet, onSelect }: { t: TalentsView; sheet: boolean; onSelect: (key: string) => void }) {
	const now = learnableNow(t).slice(0, 5);
	const all = nextSteps(t);
	const rows = now.length ? now : all.slice(0, 5);
	const kicker = now.length ? 'Học được ngay' : all.length ? 'Mốc kế (chưa đủ điểm)' : 'Học được ngay';
	if (sheet) {
		return (
			<div>
				<p className="text-[12px] font-extrabold uppercase leading-4 tracking-[0.04em] text-ink-soft">{kicker}</p>
				{rows.length ? (
					<div className="-mx-3 mt-1.5 flex touch-pan-x gap-2 overflow-x-auto px-3 pb-1 [scrollbar-width:none]">
						{rows.map((s) => (
							<button key={s.key} type="button" className="ui-chip tt-chip-sm shrink-0 gap-1.5" onClick={() => onSelect(s.key)}>
								<StepIcon t={t} s={s} box={20} />
								<span>
									{stepLabel(t, s)} · {s.name}
								</span>
								<b className={`tabular-nums ${s.ok ? 'text-amber' : 'text-berry'}`}>{s.cost}đ</b>
							</button>
						))}
					</div>
				) : (
					<p className="text-note text-ink-soft">Mọi nhánh đã mở đều tới mốc cao nhất của bản này.</p>
				)}
				{!now.length && all.length > 0 && <p className="text-[12px] leading-4 text-ink-faint">Lên cấp để có thêm điểm.</p>}
			</div>
		);
	}
	return (
		<div className="flex flex-col gap-1">
			<p className="tt-kicker">{kicker}</p>
			{rows.length ? (
				<ul className="flex flex-col gap-1">
					{rows.map((s) => {
						const f = s.fork ? null : findNode(t, s.key);
						const kind = s.fork ? null : f && (f.n.tier >= 10 ? 'ult' : f.n.kind);
						const sk = f?.n.skillId ? skillSheet(t, f.n.skillId, s.tier) : null;
						return (
							<li key={s.key}>
								<button type="button" className="flex w-full items-center gap-2 rounded-[6px] border-2 border-paper-line bg-paper-hi px-1.5 py-1 text-left hover:border-bark" onClick={() => onSelect(s.key)}>
									<span className="flex h-7 w-7 shrink-0 items-center justify-center">
										<StepIcon t={t} s={s} box={26} />
									</span>
									<span className="min-w-0 flex-1 leading-[17px]">
										<span className="block truncate text-[12px] text-ink-soft">
											{stepLabel(t, s)}
											{kind ? ` · ${KIND_LABEL[kind].toLowerCase()}` : ' · ngã ba'}
										</span>
										<b className="block truncate font-display text-[15px] text-ink-brown">{s.fork ? 'Chọn lưu phái Kiếm' : s.name}</b>
										{sk && (
											<span className="block truncate text-[12px] text-ink-faint tabular-nums">
												{statLine(sk)}
											</span>
										)}
									</span>
									<span className={`shrink-0 rounded-[4px] border-2 px-1 text-[12px] font-extrabold leading-[16px] tabular-nums ${s.ok ? 'border-outline bg-gold text-ink-brown' : 'border-berry bg-[#f6d6c8] text-berry'}`}>{s.cost}đ</span>
								</button>
							</li>
						);
					})}
				</ul>
			) : (
				<p className="text-note text-ink-soft">Mọi nhánh đã mở đều tới mốc cao nhất của bản này — mốc 10 sắp có.</p>
			)}
			{!now.length && all.length > 0 && <p className="text-note text-ink-faint">Chưa đủ điểm cho mốc nào. Lên cấp để có thêm điểm.</p>}
		</div>
	);
}

/** Đi tới nút cần nuôi cho kiếm pháp: Kiếm mốc 5 (theo lưu phái đang theo; chưa chọn thì tới ngã ba / mốc 2). */
function swordTargetKey(t: TalentsView): { key: string; label: string } | null {
	const b = t.branches.find((x) => x.branch === 'sword');
	if (!b?.unlocked || b.tier >= 5) return null;
	if (b.style) return { key: styleKey(b.style, 5), label: 'Tới Kiếm mốc 5' };
	if (b.tier >= 2) return { key: styleKey('kiem_than', 3), label: 'Tới Kiếm mốc 3 (chọn lưu phái)' };
	return { key: nodeKey('sword', 2), label: 'Tới Kiếm mốc 2' };
}

/** Thẻ "Mốc kế": mốc tiếp theo trong cùng cột — tên, loại, giá, một câu, số liệu ngắn, thưởng chiều sâu khi đạt. */
function NextCard({ t, info, onSelect, compact }: { t: TalentsView; info: NodeInfo; onSelect: (key: string) => void; compact: boolean }) {
	const n = info.next;
	const nx = useMemo(() => (n && !('fork' in n) ? nodeInfo(t, n.key) : null), [t, n]);
	if (!n || info.kind === 'art') return null;
	if ('fork' in n) {
		return (
			<button type="button" className="tt-next-card" onClick={() => onSelect(styleKey(SWORD_STYLES[0]!, n.tier))}>
				<p className="tt-kicker">
					Mốc kế · {n.tier} · <span className="normal-case">{n.cost}đ</span>
				</p>
				<b className="block font-display text-[15px] leading-5 text-ink-brown">Chọn một lưu phái Kiếm</b>
				<span className="block text-[12px] leading-4 text-ink-soft">{SWORD_STYLES.map((s) => SWORD_STYLE_INFO[s].name).join(' · ')} — mốc 3–10 theo lưu phái chọn.</span>
			</button>
		);
	}
	if (!nx) return null;
	const sk = nx.skillId && nx.ready ? skillSheet(t, nx.skillId, nx.tier) : null;
	return (
		<button type="button" className="tt-next-card" onClick={() => onSelect(nx.key)}>
			<p className="tt-kicker">
				{/* `đ` giữ chữ thường: tt-kicker viết hoa cả dòng, "4Đ" đọc như ký hiệu khác. */}
				Mốc kế · {nx.tier} · {nx.ready ? <span className="normal-case">{nx.cost}đ</span> : 'sắp có'}
			</p>
			<span className="flex items-center gap-2">
				<span className={`flex h-7 w-7 shrink-0 items-center justify-center ${nx.ready ? '' : 'opacity-60 grayscale'}`}>{hasNodeIcon(nx.skillId, nx.branch, nx.tier, nx.style) ? <NodeIcon skillId={nx.skillId} branch={nx.branch} tier={nx.tier} style={nx.style} box={26} /> : '…'}</span>
				<span className="min-w-0 flex-1">
					<b className="block truncate font-display text-[15px] leading-5 text-ink-brown">{nx.name}</b>
					<span className="block text-[12px] leading-4 text-ink-soft">
						{KIND_LABEL[nx.kind].toLowerCase()} · +{nx.bonusAt}% sức mạnh {nx.branchName}
					</span>
				</span>
			</span>
			{!compact && nx.brief && <span className="mt-0.5 line-clamp-2 block text-[12px] leading-4 text-ink-soft">{nx.brief}</span>}
			{sk && (
				<span className="block truncate text-[12px] leading-4 text-ink-faint tabular-nums">
					{statLine(sk)}
				</span>
			)}
		</button>
	);
}

/**
 * Chi tiết một nút (đặc tả cây 1.3, làm lại 09/10/2026): kicker (nhánh · mốc · loại), ô đá + tên + nhãn trạng thái (+ ô đang
 * gán), mô tả, BẢNG SỐ LIỆU thật (MP · hồi chiêu sau bị động · uy lực + hệ số chiều sâu · hệ/kiểu · cách đánh · hiệu ứng),
 * thanh 10 mốc của nhánh với mốc đích, hộp "Mở luôn…", hành động theo trạng thái (Học · Theo lưu phái + xác nhận · "Còn N
 * lần cộng" · lý do khoá), và thẻ MỐC KẾ cho thấy lên tiếp được gì. `sheet`: bản gọn cho điện thoại (4 ô số một hàng, nút
 * Học cao 44, mô tả 2 dòng + Xem thêm).
 *
 * Cột bên: nút chính + hộp xác nhận DÍNH ĐÁY vùng cuộn — màn thấp (cột chỉ ~140px) và ngã ba (nội dung dài) không phải
 * tự cuộn mới thấy nút Học.
 */
export function TalentDetail({
	t,
	info,
	sheet,
	onSelect,
	onLearn,
	onChooseStyle,
	onAssign,
}: {
	t: TalentsView;
	info: NodeInfo;
	sheet: boolean;
	onSelect: (key: string | null) => void;
	/** `tier` = mốc đích nút đang hiện (Game bỏ qua khi mốc đã khác — chống nhấp đúp mua lố). */
	onLearn: (branch: BranchId, tier?: number) => void;
	onChooseStyle: (style: SwordStyleId) => void;
	onAssign: (skillId: string) => void;
}) {
	const [confirm, setConfirm] = useState(false);
	const [more, setMore] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);
	/**
	 * Học / Chọn / Thôi gỡ (hoặc tắt) chính nút đang giữ focus — hộp xác nhận biến mất, cây chuyển chọn sang mốc kế ở nhịp
	 * HUD sau. Trong 1,5 giây sau thao tác, lần vẽ nào thấy focus đã rơi xuống body thì đưa về nút chính của chi tiết (không
	 * có thì chính khối chi tiết) — phím Tab kế tiếp không nhảy ra HUD nằm dưới lớp phủ.
	 */
	const keepFocus = useRef(0);
	const holdFocus = (): void => {
		keepFocus.current = performance.now() + 1500;
	};
	// Đổi nút thì bỏ hộp xác nhận / thu mô tả của nút cũ.
	useEffect(() => {
		setConfirm(false);
		setMore(false);
	}, [info.key]);
	useEffect(() => {
		const until = keepFocus.current;
		const root = rootRef.current;
		if (!until || !root) return;
		if (performance.now() > until) {
			keepFocus.current = 0;
			return;
		}
		const a = document.activeElement;
		const primary = root.querySelector<HTMLElement>('[data-primary]:not(:disabled)');
		// Focus đang "đỗ tạm" ở chính khối chi tiết (lúc nút cũ vừa mất, nút mốc kế chưa hiện) cũng tính là chưa yên chỗ.
		const lost = !a || a === document.body || (a instanceof HTMLButtonElement && a.disabled) || (a === root && !!primary);
		if (!lost) {
			if (!root.contains(a)) keepFocus.current = 0;
			return;
		}
		(primary ?? root).focus({ preventScroll: true });
	});
	// Esc khi hộp xác nhận lưu phái đang mở: chỉ đóng hộp (như hộp tẩy điểm), không đóng cả bảng — tab cha thấy
	// `data-esc-own` thì nhường phím này cho hộp.
	useEffect(() => {
		if (!confirm) return undefined;
		const onKey = (e: KeyboardEvent): void => {
			if (e.key !== 'Escape' || e.repeat) return;
			e.stopPropagation();
			setConfirm(false);
			holdFocus();
		};
		window.addEventListener('keydown', onKey, true);
		return () => window.removeEventListener('keydown', onKey, true);
	}, [confirm]);

	const i = info;
	const fork = !!i.styleChoice;
	const short = i.route ? Math.max(0, i.route.total - t.unspent) : 0;
	const learnedSkill = !!i.skillId && t.learned.some((s) => s.id === i.skillId);
	const styleName = i.style ? SWORD_STYLE_INFO[i.style].name : '';
	const sk = useMemo(() => (i.skillId && i.ready ? skillSheet(t, i.skillId, i.tier) : null), [t, i.skillId, i.ready, i.tier]);
	const slotKey = i.skillId ? t.loadout.find((x) => x.skillId === i.skillId)?.key : undefined;
	const home = i.art ?? i.branch;
	const hb = t.branches.find((b) => b.branch === home);
	const where = i.kind === 'art' ? `Kiếm pháp · ${i.branchName}` : `${i.styleName ?? i.branchName} · mốc ${i.tier}`;
	const passive = i.kind === 'passive' || (i.kind === 'ult' && !i.skillId);

	const learnBtn = (): ReactNode => {
		if (i.state === 'next' && !fork)
			return (
				<button
					type="button"
					data-primary
					className={`ui-btn ${sheet ? 'h-11 shrink-0' : 'w-full'}`}
					onClick={() => {
						holdFocus();
						onLearn(i.branch, i.tier);
					}}
					aria-label={`Học ${i.branchName} mốc ${i.tier}: ${i.name} (${i.cost} điểm)`}
				>
					{sheet ? `Học · ${i.cost}đ` : `Học mốc ${i.tier} · ${i.cost} điểm`}
				</button>
			);
		// Ngã ba: nút ghi rõ THEO lưu phái nào (cả trên sheet điện thoại), rộng hết một hàng riêng.
		if (i.state === 'next' && fork)
			return confirm ? null : (
				<button type="button" data-primary className={`ui-btn w-full ${sheet ? 'h-11' : 'px-0 text-[14px]'}`} onClick={() => setConfirm(true)}>
					{`Theo ${styleName} · ${i.cost}đ`}
				</button>
			);
		if (i.state === 'next-poor')
			return (
				<button type="button" data-primary className={`ui-btn ${!sheet ? 'w-full' : fork ? 'h-11 w-full' : 'h-11 shrink-0'}`} disabled>
					{`Cần ${i.cost} điểm`}
				</button>
			);
		return null;
	};

	const styleSwitch = fork && (
		<div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Ba lưu phái Kiếm">
			{(['kiem_than', 'thuy_than', 'bac_than'] as SwordStyleId[]).map((s) => (
				<button key={s} type="button" className="ui-chip tt-chip-sm px-1!" aria-pressed={i.style === s} onClick={() => onSelect(styleKey(s, i.tier))}>
					{SWORD_STYLE_INFO[s].name}
				</button>
			))}
		</div>
	);

	const confirmBox = fork && confirm && (
		<div data-esc-own className="rounded-[8px] border-2 border-amber bg-honey px-2.5 py-2">
			<p className="text-note font-extrabold text-ink-brown">
				Theo {styleName} lưu? Tốn {i.cost} điểm, đổi sau phải tẩy điểm.
			</p>
			<div className="mt-1.5 flex gap-2">
				<button
					type="button"
					className="ui-chip tt-chip-sm"
					autoFocus
					onClick={() => {
						holdFocus();
						setConfirm(false);
						if (i.style) onChooseStyle(i.style);
					}}
				>
					Chọn
				</button>
				<button
					type="button"
					className="ui-chip tt-chip-sm"
					onClick={() => {
						holdFocus();
						setConfirm(false);
					}}
				>
					Thôi
				</button>
			</div>
		</div>
	);

	/** Điều kiện kiếm pháp: hai thanh mốc (Kiếm, nguyên tố) tới mốc 5. */
	const artNeed = (): ReactNode => {
		const a = i.artNeed;
		if (!a) return null;
		const sw = swordTargetKey(t);
		const rows: [BranchId, string, number, boolean][] = [
			['sword', 'Kiếm', a.swordTier, a.swordOk],
			[i.art!, a.elementName, a.elementTier, a.elementOk],
		];
		return (
			<div className="ui-tray flex flex-col gap-1.5 px-2.5 py-2">
				<p className="tt-kicker">{a.learned ? 'Đã lĩnh ngộ' : 'Điều kiện · tự học khi đủ, không tốn điểm'}</p>
				{rows.map(([b, name, tier, ok]) => (
					<div key={b} className="flex items-center gap-2">
						<span className="w-[52px] shrink-0 text-[12px] font-extrabold text-ink-brown">{name}</span>
						<span className="min-w-0 flex-1">
							<TierPips tier={tier} cap={10} branch={b} target={SWORD_ART_TIER} size="sm" />
						</span>
						<b className={`w-[54px] shrink-0 text-right text-[12px] tabular-nums ${ok ? 'text-leaf' : 'text-berry'}`}>{ok ? 'đủ' : `${tier}/${SWORD_ART_TIER}`}</b>
					</div>
				))}
				{i.state === 'locked' && <p className="text-note text-ink-faint">{i.lockNote}</p>}
				{!a.learned && i.state !== 'locked' && (
					<div className="flex flex-wrap gap-1.5">
						{!a.swordOk && sw && (
							<button type="button" className="ui-chip tt-chip-sm" onClick={() => onSelect(sw.key)}>
								{sw.label}
							</button>
						)}
						{!a.elementOk && i.art && (
							<button type="button" className="ui-chip tt-chip-sm" onClick={() => onSelect(nodeKey(i.art!, 5))}>
								Tới {a.elementName} mốc 5
							</button>
						)}
					</div>
				)}
			</div>
		);
	};

	const stateBlock = (): ReactNode => {
		if (i.kind === 'art') return artNeed();
		switch (i.state) {
			case 'reached':
				return learnedSkill && (i.kind === 'active' || i.kind === 'ult') ? (
					<p className="flex flex-wrap items-center gap-1.5 text-note text-ink-soft">
						{slotKey ? (
							<>
								Đang ở ô <kbd className="ui-key">{slotKey}</kbd>
							</>
						) : (
							'Chưa gán vào thanh kỹ năng.'
						)}
						<button type="button" className="ui-chip tt-chip-sm ml-auto" onClick={() => onAssign(i.skillId!)}>
							{slotKey ? 'Đổi ô…' : 'Gán vào ô…'}
						</button>
					</p>
				) : null;
			case 'next-poor':
				return <p className="text-note text-ink-faint">Lên cấp để có thêm điểm (bạn còn {t.unspent}).</p>;
			case 'future':
				return i.route ? (
					<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
						<p className="text-note font-bold text-ink-soft">
							Còn {i.route.keys.length} lần cộng · tổng {i.route.total} điểm{short > 0 ? ` (thiếu ${short})` : ''}
						</p>
						<button type="button" className="ui-chip tt-chip-sm" onClick={() => onSelect(i.route!.keys[0]!)}>
							Tới mốc kế
						</button>
					</div>
				) : null;
			case 'soon':
				return <p className="text-note text-ink-faint">Sắp có — mốc {i.tier} mở ở bản sau.</p>;
			case 'dim':
				return <p className="text-note font-extrabold text-berry">Thuộc {i.styleName} lưu — tẩy điểm để đổi.</p>;
			case 'locked':
				return (
					<p className="rounded-[6px] border-2 border-dashed border-paper-line px-2 py-1 text-note text-ink-soft">
						<b className="text-ink-brown">Nhánh chưa mở:</b> {i.lockNote || 'mở theo cốt truyện.'}
					</p>
				);
			default:
				return null;
		}
	};

	const opens = i.opens.length > 0 && (
		<div className="rounded-[6px] border-2 border-dashed border-gold bg-paper-hi px-2 py-1 text-note font-extrabold leading-[18px] text-amber">
			{i.opens.map((o) => (
				<p key={o}>Mở luôn {o}</p>
			))}
		</div>
	);

	/** Chiều sâu nhánh: thanh 10 mốc (mốc đích viền hổ phách) + thưởng hiện có → khi đạt mốc này. */
	const depth = i.kind !== 'art' && i.state !== 'locked' && i.state !== 'dim' && hb && (
		<div className="ui-tray flex flex-col gap-1 px-2.5 py-1.5">
			<p className="flex items-baseline gap-1.5 text-note text-ink-soft">
				<span className="tt-kicker">Chiều sâu {i.branchName}</span>
				<span className="ml-auto tabular-nums">
					mốc <b className="text-ink-brown">{hb.tier}</b>/{hb.maxTier}
				</span>
			</p>
			<TierPips tier={hb.tier} cap={hb.cap} branch={home} target={i.state === 'reached' ? 0 : i.tier} />
			<p className="text-[12px] leading-4 text-ink-soft">
				{i.tier <= 1 && i.state !== 'reached' ? (
					// Nhánh nguyên tố đã mở mà chưa học (mốc 0): mốc 1 là học kỹ năng đầu, chưa có thưởng chiều sâu.
					<>Mốc 1: học kỹ năng đầu của nhánh — từ mốc 2 mỗi mốc +{Math.round(DEPTH_BONUS * 100)}% sức mạnh {i.branchName}</>
				) : i.state === 'reached' || i.tier <= 1 ? (
					<>
						Mọi kỹ năng {i.branchName} đang <b className="text-ink-brown">+{i.bonusNow}%</b> sức mạnh
					</>
				) : (
					<>
						Lên mốc {i.tier}: mọi kỹ năng {i.branchName} <b className="text-ink-brown">+{i.bonusNow}% → +{i.bonusAt}%</b>
					</>
				)}
				{(i.state === 'next' || i.state === 'next-poor') && (
					<>
						{' '}
						· giá <b className="text-ink-brown">{i.cost}đ</b>, bạn còn {t.unspent}
					</>
				)}
			</p>
		</div>
	);

	const passiveBox = passive && i.brief && (
		<p className="rounded-[6px] border-2 border-paper-line bg-paper-hi px-2 py-1 text-note text-ink-brown" style={{ borderLeftWidth: 5, borderLeftColor: BRANCH_FILL[home] }}>
			<b>{i.kind === 'ult' ? 'Tuyệt kỹ' : 'Bị động'}:</b> {i.brief}
			{i.kind === 'passive' && <span className="block text-[12px] leading-4 text-ink-faint">Có tác dụng ngay khi đạt mốc, không chiếm ô kỹ năng.</span>}
		</p>
	);

	const btn = learnBtn();
	const header = (
		<div className="flex items-center gap-1.5">
			<span className="flex h-5 w-5 shrink-0 items-center justify-center">
				<BranchIcon branch={home} iconSkill={hb?.iconSkill ?? null} box={18} />
			</span>
			<p className="tt-kicker min-w-0 truncate">{where}</p>
			<span className={`ui-tag ml-auto h-5 shrink-0 px-1.5 text-[11px] ${KIND_TONE[i.kind]}`}>{KIND_LABEL[i.kind]}</span>
		</div>
	);
	const title = (
		<div className="flex min-w-0 items-center gap-2.5">
			<NodeSlot info={i} />
			<div className="min-w-0 flex-1">
				<h4 className={`font-display font-extrabold leading-6 text-ink-brown ${sheet ? 'line-clamp-2 text-[clamp(16px,5vw,19px)]' : 'text-[21px]'}`}>{i.name}</h4>
				<p className="mt-0.5 flex flex-wrap items-center gap-1">
					{!(sheet && !fork && (i.state === 'next' || i.state === 'next-poor')) && <StateTag state={i.state} kind={i.kind} cost={i.cost} unspent={t.unspent} />}
					{slotKey && (
						<span className="ui-tag h-[22px] border-2 border-outline bg-paper-hi px-1.5 text-ink-brown" title="Ô trên thanh kỹ năng">
							ô {slotKey}
						</span>
					)}
				</p>
			</div>
			{sheet && !fork && btn}
		</div>
	);

	if (sheet) {
		return (
			<div ref={rootRef} tabIndex={-1} className="flex flex-col gap-1.5 outline-none">
				{header}
				{title}
				{sk && !fork && <SkillStats sheet={sk} compact />}
				<div className="text-note text-ink-soft">
					{fork ? (
						<p>
							<b className="text-ink-brown">{styleName} lưu</b> — {i.styleChoice!.play} {i.styleChoice!.enchants}
						</p>
					) : (
						<p className={more ? '' : 'line-clamp-2'}>{i.brief}</p>
					)}
					{more && (
						<div className="mt-1 flex flex-col gap-1.5">
							{fork && <p>{i.brief}</p>}
							{sk && fork && <SkillStats sheet={sk} compact />}
							{sk && <SkillHow sheet={sk} />}
							{sk && (sk.cooldownBy.length > 0 || !!sk.powerNow) && (
								<p className="text-[12px] leading-4 text-ink-faint">
									{[sk.powerNow && `Uy lực ${sk.power} → ${sk.powerNow} (+${sk.depthPct}%, ${sk.depthFrom}).`, sk.cooldownBy.length > 0 && `Hồi gốc ${fmtNum(sk.cooldown)}s, đã tính ${sk.cooldownBy.join(', ')}.`].filter(Boolean).join(' ')}
								</p>
							)}
							{depth}
							<NextCard t={t} info={i} onSelect={onSelect} compact />
						</div>
					)}
					<button type="button" className="mt-0.5 min-h-7 font-extrabold text-amber" onClick={() => setMore((v) => !v)} aria-expanded={more}>
						{more ? 'Thu lại' : fork ? `Xem đòn ${i.name} + số liệu` : 'Xem số liệu + mốc kế'}
					</button>
				</div>
				{fork && (
					<>
						<p className="text-note font-extrabold text-ink-brown">Chọn MỘT trong ba · đổi sau phải tẩy điểm</p>
						{styleSwitch}
						{btn}
						{confirmBox}
					</>
				)}
				{opens}
				{!(fork && i.state === 'next') && stateBlock()}
			</div>
		);
	}

	return (
		<div ref={rootRef} tabIndex={-1} className="flex flex-col gap-2 outline-none">
			{header}
			{title}
			{fork && (
				<div className="flex flex-col gap-1.5 rounded-[8px] border-2 border-amber bg-paper-hi px-2.5 py-2">
					<p className="text-note text-ink-soft">
						<b className="text-ink-brown">{styleName} lưu:</b> {i.styleChoice!.play} {i.styleChoice!.enchants}
					</p>
					<p className="tt-kicker">Chọn MỘT trong ba · đổi sau phải tẩy điểm</p>
					{styleSwitch}
				</div>
			)}
			{i.brief && !passive && (
				<p className="text-note text-ink-soft">
					{fork && <b className="text-ink-brown">Đòn mốc {i.tier} — {i.name}: </b>}
					{i.brief}
				</p>
			)}
			{passiveBox}
			{sk && <SkillStats sheet={sk} />}
			{depth}
			{opens}
			{(btn || confirmBox) && (
				<div className="sticky bottom-0 z-[5] flex flex-col gap-2 bg-paper pt-1.5 pb-0.5">
					{btn}
					{confirmBox}
				</div>
			)}
			{!(fork && i.state === 'next') && stateBlock()}
			<NextCard t={t} info={i} onSelect={onSelect} compact={false} />
		</div>
	);
}

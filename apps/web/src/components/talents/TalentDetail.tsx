'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { SWORD_STYLE_INFO, SWORD_STYLES } from '@/game/combat/talents';
import type { BranchId, SwordStyleId, TalentsView } from '@/store/useGameStore';
import { BranchIcon, hasNodeIcon, NodeIcon } from './TalentArt';
import type { NodeInfo } from './talentInfo';
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
 * cây. Điện thoại: chip cuộn ngang trong sheet.
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
		<div className="flex flex-col gap-2">
			<p className="text-[12px] font-extrabold uppercase leading-4 tracking-[0.04em] text-ink-soft">{kicker}</p>
			{rows.length ? (
				<ul className="flex flex-col">
					{rows.map((s) => (
						<li key={s.key} className="border-b-2 border-paper-line last:border-b-0">
							<button type="button" className="flex w-full items-center gap-2 py-1.5 text-left hover:bg-paper-sunk/50" onClick={() => onSelect(s.key)}>
								<span className="flex h-6 w-6 shrink-0 items-center justify-center">
									<StepIcon t={t} s={s} box={24} />
								</span>
								<span className="min-w-0 flex-1 leading-[17px]">
									<span className="block text-[12px] text-ink-soft">{stepLabel(t, s)}</span>
									<b className="block truncate font-display text-[15px] text-ink-brown">{s.name}</b>
								</span>
								<span className={`rounded-[4px] border-2 px-1 text-[12px] font-extrabold leading-[14px] tabular-nums ${s.ok ? 'border-outline bg-gold text-ink-brown' : 'border-berry bg-[#f6d6c8] text-berry'}`}>{s.cost}đ</span>
							</button>
						</li>
					))}
				</ul>
			) : (
				<p className="text-note text-ink-soft">Mọi nhánh đã mở đều tới mốc cao nhất của bản này — mốc 10 sắp có.</p>
			)}
			{!now.length && all.length > 0 && <p className="text-note text-ink-faint">Chưa đủ điểm cho mốc nào. Lên cấp để có thêm điểm.</p>}
			<p className="text-note text-ink-soft">Bấm một nút trên cây để xem chi tiết. Mỗi nhánh lên từng mốc một, từ trên xuống.</p>
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

/**
 * Chi tiết một nút (đặc tả cây 1.3): kicker, ô đá + tên, mô tả, số liệu, khay giá + thưởng chiều sâu, hộp "Mở luôn…",
 * rồi hành động theo trạng thái: Học (nấc kế đủ điểm) · Theo lưu phái + xác nhận (ngã ba) · "Còn N lần cộng" (xa hơn nấc
 * kế) · lý do (khoá / sắp có / lưu phái khác). `sheet`: bản gọn cho điện thoại (nút Học cao 44, mô tả 2 dòng + Xem thêm).
 *
 * Cột bên: nút chính + hộp xác nhận DÍNH ĐÁY vùng cuộn — màn thấp (cột chỉ ~140px) và ngã ba (nội dung dài) không phải
 * tự cuộn mới thấy nút Học. Sheet: ở ngã ba, lối chơi của lưu phái là thứ để CHỌN nên đứng chỗ mô tả (mô tả + số liệu
 * của đòn mốc 3 sang "Xem đòn …"), nút "Theo <lưu phái>" một hàng riêng ghi rõ theo gì; kicker được xuống 2 dòng; nút
 * thường có dòng "Kế: …" như cột bên.
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
					{sheet ? `Học · ${i.cost}đ` : `Học mốc ${i.tier} · ${i.cost}đ`}
				</button>
			);
		// Ngã ba: nút ghi rõ THEO lưu phái nào (cả trên sheet điện thoại), rộng hết một hàng riêng.
		if (i.state === 'next' && fork)
			return confirm ? null : (
				<button type="button" data-primary className={`ui-btn w-full ${sheet ? 'h-11' : 'px-0 text-[13px] tracking-[-0.02em]'}`} onClick={() => setConfirm(true)}>
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

	const nextLine = (): ReactNode => {
		const n = i.next;
		if (!n || i.kind === 'art') return null;
		// Ngã ba: dẫn tới nút mốc 3 của lưu phái đầu (chi tiết ngã ba có đủ ba chip để đổi + lối chơi từng lưu phái).
		if ('fork' in n)
			return (
				<button type="button" className="text-left underline decoration-paper-line decoration-2 underline-offset-2 hover:text-ink-brown" onClick={() => onSelect(styleKey(SWORD_STYLES[0]!, n.tier))}>
					Kế: mốc {n.tier} · chọn lưu phái
				</button>
			);
		return (
			<button type="button" className="text-left underline decoration-paper-line decoration-2 underline-offset-2 hover:text-ink-brown" onClick={() => onSelect(n.key)}>
				Kế: mốc {n.tier} {n.name}
				{n.ready ? ` · ${n.cost}đ` : ' · sắp có'}
			</button>
		);
	};

	const styleSwitch = fork && (
		<div className="flex flex-wrap gap-1.5" role="group" aria-label="Ba lưu phái Kiếm">
			{(['kiem_than', 'thuy_than', 'bac_than'] as SwordStyleId[]).map((s) => (
				<button key={s} type="button" className="ui-chip tt-chip-sm" aria-pressed={i.style === s} onClick={() => onSelect(styleKey(s, i.tier))}>
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

	const stateBlock = (): ReactNode => {
		if (i.kind === 'art' && i.artNeed) {
			const a = i.artNeed;
			const sw = swordTargetKey(t);
			return (
				<>
					<p className="text-note text-ink-soft">
						{a.learned ? (
							<b className="text-leaf">Đã học.</b>
						) : (
							<>
								Kiếm mốc 5: <b className={a.swordOk ? 'text-leaf' : 'text-berry'}>{a.swordOk ? 'đủ' : `chưa (đang ${a.swordTier})`}</b> · {a.elementName} mốc 5:{' '}
								<b className={a.elementOk ? 'text-leaf' : 'text-berry'}>{a.elementOk ? 'đủ' : `chưa (đang ${a.elementTier})`}</b> · tự học khi đủ, lưu phái nào cũng học được.
							</>
						)}
					</p>
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
				</>
			);
		}
		switch (i.state) {
			case 'reached':
				return (
					<p className="flex flex-wrap items-center gap-1.5">
						<span className="ui-tag bg-leaf text-paper-hi">{i.kind === 'passive' ? 'Đã đạt' : 'Đã học'}</span>
						{learnedSkill && (i.kind === 'active' || i.kind === 'ult') && (
							<button type="button" className="ui-chip tt-chip-sm" onClick={() => onAssign(i.skillId!)}>
								Gán vào ô…
							</button>
						)}
					</p>
				);
			case 'next-poor':
				return <p className="text-note text-ink-faint">Lên cấp để có thêm điểm (bạn còn {t.unspent}).</p>;
			case 'future':
				return i.route ? (
					<div className="flex flex-col gap-1">
						<p className="text-note font-bold text-ink-soft">
							Còn {i.route.keys.length} lần cộng · tổng {i.route.total} điểm{short > 0 ? ` (thiếu ${short})` : ''}
						</p>
						<button type="button" className="ui-chip tt-chip-sm self-start" onClick={() => onSelect(i.route!.keys[0]!)}>
							Tới mốc kế
						</button>
					</div>
				) : null;
			case 'soon':
				return <p className="text-note text-ink-faint">Sắp có — mốc {i.tier} mở ở bản sau.</p>;
			case 'dim':
				return <p className="text-note font-extrabold text-berry">Thuộc {i.styleName} lưu — tẩy điểm để đổi.</p>;
			case 'locked':
				return <p className="text-note text-ink-faint">{i.lockNote || 'Nhánh chưa mở.'}</p>;
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

	const tray = i.kind !== 'art' && i.state !== 'locked' && i.state !== 'dim' && (
		<div className="ui-tray px-2.5 py-1.5 text-note leading-[18px] text-ink-soft">
			{(i.state === 'next' || i.state === 'next-poor') && (
				<p className="font-extrabold text-ink-brown">
					Giá {i.cost} điểm · bạn còn {t.unspent}
				</p>
			)}
			{i.state === 'reached' ? (
				<p>
					{i.branchName} đang +{i.bonusNow}% sức mạnh mọi kỹ năng
				</p>
			) : i.tier > 1 ? (
				<p>
					Lên mốc {i.tier}: +{i.bonusAt}% sức mạnh mọi kỹ năng {i.branchName} (đang +{i.bonusNow}%)
				</p>
			) : null}
		</div>
	);

	const btn = learnBtn();
	const next = (i.state === 'next' || i.state === 'reached') && nextLine();

	if (sheet) {
		return (
			<div ref={rootRef} tabIndex={-1} className="flex flex-col gap-1.5 outline-none">
				<div className="flex items-center gap-2.5">
					<NodeSlot info={i} />
					<div className="min-w-0 flex-1">
						<p className="line-clamp-2 text-[12px] font-extrabold uppercase leading-4 tracking-[0.04em] text-ink-soft">{i.kicker}</p>
						<p className="truncate font-display text-[19px] font-extrabold leading-6 text-ink-brown">{i.name}</p>
						{i.stat && <p className="truncate text-[12px] leading-4 text-ink-faint">{i.stat}</p>}
					</div>
					{!fork && btn}
				</div>
				<div className="text-note text-ink-soft">
					{fork ? (
						<p>
							<b className="text-ink-brown">{styleName} lưu</b> — {i.styleChoice!.play} {i.styleChoice!.enchants}
						</p>
					) : (
						<p className={more ? '' : 'line-clamp-2'}>{i.brief}</p>
					)}
					{fork && more && <p className="mt-0.5">{i.brief}</p>}
					{more && i.facts && <p className="text-[12px] leading-4 text-ink-faint">{i.facts}</p>}
					{(fork || i.brief.length > 70 || !!i.facts) && (
						<button type="button" className="font-extrabold text-amber" onClick={() => setMore((v) => !v)} aria-expanded={more}>
							{more ? 'Thu lại' : fork ? `Xem đòn ${i.name}` : 'Xem thêm'}
						</button>
					)}
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
				{next && !fork && <p className="text-note text-ink-faint">{next}</p>}
			</div>
		);
	}

	return (
		<div ref={rootRef} tabIndex={-1} className="flex flex-col gap-2 outline-none">
			<p className="text-[12px] font-extrabold uppercase leading-4 tracking-[0.04em] text-ink-soft">{i.kicker}</p>
			<div className="flex items-center gap-2.5">
				<NodeSlot info={i} />
				<h4 className="min-w-0 font-display text-[20px] font-extrabold leading-6 text-ink-brown">{i.name}</h4>
			</div>
			{i.brief && <p className="text-note text-ink-soft">{i.brief}</p>}
			{i.stat && <p className="text-[12px] leading-4 text-ink-faint">{i.stat}</p>}
			{fork && (
				<>
					<p className="text-note text-ink-soft">
						{i.styleChoice!.play} {i.styleChoice!.enchants}
					</p>
					<p className="text-note font-extrabold text-ink-brown">Chọn MỘT trong ba · đổi sau phải tẩy điểm</p>
					{styleSwitch}
				</>
			)}
			{tray}
			{opens}
			{(btn || confirmBox) && (
				<div className="sticky bottom-0 z-[5] flex flex-col gap-2 bg-paper pt-1.5 pb-0.5">
					{btn}
					{confirmBox}
				</div>
			)}
			{!(fork && i.state === 'next') && stateBlock()}
			{next && <p className="text-note text-ink-faint">{next}</p>}
		</div>
	);
}

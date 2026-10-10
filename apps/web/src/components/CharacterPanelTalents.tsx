'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { pointsToTier } from '@/game/combat/talents';
import { useGameStore, type BranchId, type SwordStyleId, type TalentsView } from '@/store/useGameStore';
import { fmtNum } from './CharacterPanelParts';
import { TalentBranchList } from './talents/TalentBranchList';
import { LearnableList, TalentDetail } from './talents/TalentDetail';
import { nodeInfo } from './talents/talentInfo';
import { TalentLoadoutView } from './talents/TalentLoadoutView';
import { TalentOverview } from './talents/TalentOverview';
import { BRANCH_FILL } from './talents/TalentParts';
import { TALENT_CSS } from './talents/talentStyles';
import { TalentTreeGrid } from './talents/TalentTreeGrid';
import { fitPhoneTree, layoutTree, nodeState, routeTo, styleKey, TREE_DESKTOP, TREE_FRAME, TREE_LOW, TREE_WIDE } from './talents/treeLayout';
import { useMediaQuery } from './useMediaQuery';

const RESET_HELP = 'Muốn chia lại? Tẩy điểm trả lại mọi điểm đã dùng. Miễn phí tới cấp 5, sau đó tốn 10 xu mỗi cấp.';

type Mode = 'tree' | 'branch' | 'loadout';
/** Chế độ xem nhớ theo trình duyệt (localStorage có thể bị chặn — chế độ ẩn danh, iframe: bọc try/catch). */
const MODE_KEY = 'aether.talentView';
function readMode(): Mode {
	try {
		const v = window.localStorage.getItem(MODE_KEY);
		return v === 'branch' || v === 'loadout' ? v : 'tree';
	} catch {
		return 'tree';
	}
}
function saveMode(m: Mode): void {
	try {
		window.localStorage.setItem(MODE_KEY, m);
	} catch {
		// Không lưu được thì lần sau mở lại về "Cây" — không sao.
	}
}

/** Thanh build: mỗi nhánh đã tiêu điểm là một khúc màu hệ (rộng theo điểm đã tiêu / tổng điểm), điểm chưa dùng là khúc sọc vàng. */
function BuildBar({ t, className = '' }: { t: TalentsView; className?: string }) {
	const total = Math.max(1, t.points, t.spent + Math.max(0, t.unspent));
	const segs = t.branches.filter((b) => b.unlocked && pointsToTier(b.tier, b.branch) > 0).map((b) => ({ b, pts: pointsToTier(b.tier, b.branch) }));
	let acc = 0;
	const label = [...segs.map((s) => `${s.b.name} ${s.pts} điểm`), t.unspent > 0 ? `${t.unspent} điểm chưa dùng` : ''].filter(Boolean).join(', ');
	return (
		<div className={`ui-bar tt-build h-3 w-full max-w-[260px] ${className}`} role="img" aria-label={`Điểm đã dùng: ${label || 'chưa dùng điểm nào'}`}>
			{segs.map((s) => {
				const w = (s.pts / total) * 100;
				const el = <i key={s.b.branch} title={`${s.b.name} ${s.pts} điểm`} style={{ left: `${acc}%`, width: `${w}%`, background: BRANCH_FILL[s.b.branch] }} />;
				acc += w;
				return el;
			})}
			{t.unspent > 0 && <i className="tt-unspent" title={`${t.unspent} điểm chưa dùng`} style={{ left: `${acc}%`, width: `${(t.unspent / total) * 100}%` }} />}
		</div>
	);
}

/** Chú giải dưới lưới — `width` = bề ngang khung lưới: chú giải xuống dòng chứ không nong cột lưới (cột chi tiết bị ép hẹp). */
function Legend({ width }: { width?: number }) {
	return (
		<p className="tt-legend flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] font-bold leading-[18px] text-ink-soft" style={width ? { maxWidth: width } : undefined} aria-hidden>
			<span>
				<i className="lg-act" />
				chủ động
			</span>
			<span>
				<i className="lg-pas" />
				bị động
			</span>
			<span>
				<i className="lg-art" />
				kiếm pháp
			</span>
			<span>
				<i className="lg-ult" />
				tuyệt kỹ
			</span>
			<span className="text-ink-faint">·</span>
			<span>
				<i className="lg-next" />
				học được ngay
			</span>
			<span>
				<i className="lg-future" />
				chưa tới
			</span>
			<span>
				<i className="lg-soon" />
				sắp có
			</span>
		</p>
	);
}

function RulesList() {
	return (
		<ul className="flex flex-col gap-1.5 text-body leading-snug text-ink-soft">
			<li>Mỗi lần lên cấp được 1 điểm, mỗi mốc 5 cấp thưởng thêm 1. Điểm cộng vào NHÁNH, không vào từng kỹ năng.</li>
			<li>
				Mỗi nhánh 10 mốc. Mở nhánh (theo cốt truyện) là <b className="text-ink-brown">được phép học</b>: phép đầu của nhánh nguyên tố (mốc 1) cũng tốn 1 điểm; riêng Kiếm có sẵn mốc 1 (Trảm) khi nhận kiếm. Giá mốc 2→10: 1 · 2 · 2 · 3 · 3 · 4 · 4 · 5 · 5 (đầy một nhánh: Kiếm 29 điểm, nguyên tố 30). Lên từng mốc một, từ trên xuống.
			</li>
			<li>
				<b className="text-ink-brown">Chiều sâu</b>: mỗi mốc trên mốc 1 cho +4% sức mạnh mọi kỹ năng của nhánh (mốc 10 = +36%).
			</li>
			<li>
				<b className="text-ink-brown">Kiếm</b>: mốc 1–2 chung; lần đầu lên mốc 3 thì chọn lưu phái (Kiếm Thần · Thủy Thần · Bắc Thần), mốc 3–10 theo lưu phái đó. Đổi lưu phái = tẩy điểm. Kiếm mốc 5 + một nguyên tố mốc 5 mở kiếm pháp nguyên tố (tự học, không tốn điểm).
			</li>
			<li>
				<b className="text-ink-brown">Phản ứng</b>: hai hệ gặp nhau (Thuỷ + Băng = Đóng Băng; Thổ + Thuỷ = Bùn Lầy, Thổ + Hoả = Dung Nham, Thổ + Phong = Bão Cát, Thổ đánh mục tiêu đóng băng = Vỡ Vụn…) mạnh thêm 5% mỗi mốc của hệ yếu hơn.
			</li>
			<li>Tia Aether là năng lực bẩm sinh, không thuộc cây: mạnh dần theo cấp.</li>
			<li>{RESET_HELP}</li>
		</ul>
	);
}

/**
 * Tab "Tiềm năng" (đặc tả cây 08/10/2026): dải đầu (điểm còn lại, lối tu luyện + thanh build, bộ chọn chế độ, tẩy điểm,
 * luật) và ba chế độ — Cây (lưới cột có đường nối + cột chi tiết / sheet), Từng nhánh (đường chính cho ngón tay), Gán ô ·
 * Phủ phép. Làm lại 09/10/2026: cột chi tiết có bảng số liệu thật (MP, hồi chiêu sau bị động, uy lực + chiều sâu, cách
 * đánh, hiệu ứng) + thẻ mốc kế; chưa chọn nút thì cột bên là tổng quan (học được ngay, 6 nhánh, phản ứng, phủ phép /
 * kiếm pháp) — điện thoại đặt tổng quan dưới lưới. Bấm nút trên cây chỉ CHỌN; điểm chỉ tiêu ở nút "Học" (cột bên, sheet, hàng kế tiếp, thanh đáy). Hợp đồng store
 * giữ nguyên: `talent_add {branch}` / `{branch:'sword', style}`, `talent_reset`, `set_slot`, `set_enchant`.
 */
export function CharacterTalentsTab({ touch }: { touch: boolean }) {
	const t = useGameStore((st) => st.talents);
	const coins = useGameStore((st) => st.stats.coins);
	const request = useGameStore((st) => st.request);

	const phone = useMediaQuery('(max-width: 639px)');
	const low = useMediaQuery('(max-height: 500px)');
	const narrow = useMediaQuery('(max-width: 743px)');
	const fine = useMediaQuery('(hover: hover) and (pointer: fine)');
	const tinyTabs = useMediaQuery('(max-width: 359px)');
	// Bảng Hành trang nở 1040px từ cửa sổ 1024px (lg) — đủ chỗ cho lưới 628px + cột chi tiết.
	const wide = useMediaQuery('(min-width: 1100px) and (min-height: 700px)');
	const portrait = phone && !low;
	const rootRef = useRef<HTMLDivElement>(null);
	// Điện thoại dọc: bề ngang lòng tab ĐO THẬT (máy 360 / 320px hẹp hơn lưới 311px) — chưa đo được thì dùng bộ chuẩn.
	const [paneW, setPaneW] = useState(0);
	useEffect(() => {
		const el = rootRef.current;
		if (!portrait || !el) return undefined;
		const ro = new ResizeObserver(() => setPaneW(el.clientWidth));
		ro.observe(el);
		return () => ro.disconnect();
	}, [portrait, t.branches.length > 0]);
	// Lưới 462px cần lòng tab ≥ 660 (cửa sổ ≥ 744px); hẹp hơn thì dùng bộ gọn 392px để còn chỗ cho cột chi tiết.
	const p = useMemo(() => (low ? TREE_LOW : portrait ? fitPhoneTree(paneW - TREE_FRAME) : narrow ? TREE_LOW : wide ? TREE_WIDE : TREE_DESKTOP), [low, portrait, narrow, wide, paneW]);

	const [mode, setModeRaw] = useState<Mode>(() => (typeof window === 'undefined' ? 'tree' : readMode()));
	const setMode = (m: Mode): void => {
		setModeRaw(m);
		saveMode(m);
		// Kỹ năng "đang cầm" từ chip "Gán vào ô…" chỉ dùng một lần.
		if (m !== 'loadout') setHeld(null);
	};
	const [selected, setSelectedRaw] = useState<string | null>(null);
	const [branch, setBranch] = useState<BranchId>(() => {
		// Mặc định ở chế độ Từng nhánh: nhánh chính của build (mốc cao nhất), không có thì Kiếm.
		const open = t.branches.filter((b) => b.unlocked).sort((a, b) => b.tier - a.tier);
		return open[0]?.branch ?? 'sword';
	});
	const [held, setHeld] = useState<string | null>(null);
	const [confirming, setConfirming] = useState(false);
	const [rulesOpen, setRulesOpen] = useState(false);
	const rulesRef = useRef<HTMLDivElement>(null);
	const asideRef = useRef<HTMLDivElement>(null);
	/** Vừa bấm Học: chờ store báo điểm đã tiêu để chuyển chọn sang mốc kế + cuộn tới. */
	const pending = useRef<{ key: string | null; spent: number; then?: string } | null>(null);
	const scrollWant = useRef<{ key: string | 'lowest-next'; block: ScrollLogicalPosition } | null>({ key: 'lowest-next', block: 'nearest' });

	const setSelected = (k: string | null): void => {
		setSelectedRaw(k);
		if (k) scrollWant.current = { key: k, block: 'nearest' };
	};

	// Đổi nút đang chọn → cột chi tiết về đầu (không giữ chỗ cuộn của nút cũ).
	useEffect(() => {
		asideRef.current?.scrollTo({ top: 0 });
	}, [selected]);

	// Đã tẩy xong (không còn điểm đã cộng) thì hộp xác nhận cũ không còn nghĩa.
	useEffect(() => {
		if (t.spent === 0) setConfirming(false);
	}, [t.spent]);

	// Hộp xác nhận tẩy điểm đóng (Tẩy hết / Thôi / Esc) gỡ luôn nút đang giữ focus → focus rơi về body. Đưa về chip "Tẩy
	// điểm"; vừa tẩy xong thì về chip "?" vì chip Tẩy điểm sắp bị tắt (`t.spent` về 0 ở nhịp HUD sau).
	const resetFocus = useRef<'reset' | 'rules' | null>(null);
	useEffect(() => {
		const want = resetFocus.current;
		if (confirming || !want) return;
		resetFocus.current = null;
		const root = rootRef.current;
		const chip = want === 'reset' ? root?.querySelector<HTMLButtonElement>('[data-reset-chip]:not(:disabled)') : null;
		(chip ?? root?.querySelector<HTMLButtonElement>('[data-rules-chip]'))?.focus();
	}, [confirming]);

	// Lưới (81 nút + ~78 đoạn) chỉ dựng lại khi NỘI DUNG cây đổi — store ghi `talents` mới cả khi chỉ giây hồi phủ phép đổi.
	const treeKey = JSON.stringify([t.branches, t.arts, t.unspent]);
	const L = useMemo(() => layoutTree(p, t), [p, treeKey]);
	const info = useMemo(() => (selected ? nodeInfo(t, selected) : null), [t, selected]);
	const route = useMemo(() => {
		if (!info || info.state !== 'future' || !selected) return null;
		const r = routeTo(t, selected);
		return r ? new Set(r.keys) : null;
	}, [info, selected, t]);

	// Học xong: nút vừa học thành "đã đạt" → chọn mốc kế trong cùng cột (đủ điểm thì bấm Học tiếp được ngay) và cuộn tới.
	useEffect(() => {
		const pd = pending.current;
		if (!pd || t.spent === pd.spent) return;
		pending.current = null;
		const k = pd.then ?? pd.key;
		if (!k) return;
		if (nodeState(t, k) === 'reached') {
			const nx = nodeInfo(t, k)?.next;
			setSelected(nx && !('fork' in nx) && nx.ready ? nx.key : k);
		} else setSelected(k);
	}, [t]);

	// Tự cuộn (chế độ Cây): mở tab → hàng có nút "học được" thấp nhất; chọn / vừa học → nút đang chọn.
	useEffect(() => {
		const want = scrollWant.current;
		if (!want || mode !== 'tree') return;
		scrollWant.current = null;
		let key = want.key;
		if (key === 'lowest-next') {
			const nx = L.nodes.filter((n) => n.state === 'next').sort((a, b) => b.y - a.y)[0];
			if (!nx) return;
			key = nx.key;
		}
		rootRef.current?.querySelector<HTMLElement>(`[data-key="${key}"]`)?.scrollIntoView({ block: want.block });
	});

	// Esc: đóng hộp luật / xác nhận / sheet chi tiết TRƯỚC, rồi mới tới lượt bảng (CharacterPanel nghe ở pha nổi bọt).
	useEffect(() => {
		const onKey = (e: KeyboardEvent): void => {
			if (e.key !== 'Escape') return;
			const st = useGameStore.getState();
			if (st.dialogue || st.card) return;
			// Hộp xác nhận lưu phái (chi tiết nút / Từng nhánh) tự nghe Esc và chỉ đóng chính nó.
			if (rootRef.current?.querySelector('[data-esc-own]')) return;
			if (rulesOpen) setRulesOpen(false);
			else if (confirming) {
				resetFocus.current = 'reset';
				setConfirming(false);
			}
			else if (portrait && mode === 'tree' && selected) setSelectedRaw(null);
			else return;
			e.stopPropagation();
		};
		window.addEventListener('keydown', onKey, true);
		return () => window.removeEventListener('keydown', onKey, true);
	}, [rulesOpen, confirming, portrait, mode, selected]);

	// Hộp luật (máy tính): bấm ra ngoài thì đóng.
	useEffect(() => {
		if (!rulesOpen || portrait) return undefined;
		const onDown = (e: PointerEvent): void => {
			if (rulesRef.current && !rulesRef.current.contains(e.target as Node)) setRulesOpen(false);
		};
		document.addEventListener('pointerdown', onDown);
		return () => document.removeEventListener('pointerdown', onDown);
	}, [rulesOpen, portrait]);

	/**
	 * Chống bấm trùng nút Học / Chọn lưu phái: Game xử lý ĐỒNG BỘ nhưng `talents` trên store chỉ đổi ở nhịp HUD sau, còn
	 * cây tự chuyển chọn sang mốc kế ở đúng chỗ nút cũ — cú thứ hai của một lần nhấp đúp sẽ mua lố một mốc (lấy lại phải
	 * tẩy điểm, tốn xu). Hai lớp: bỏ cú bấm trong 400ms sau cú trước, và gửi kèm mốc đích (`tier`) để Game từ chối khi mốc
	 * đã khác (nút còn nhãn cũ).
	 */
	const lastLearn = useRef(-Infinity);
	const tooSoon = (): boolean => {
		const now = performance.now();
		if (now - lastLearn.current < 400) return true;
		lastLearn.current = now;
		return false;
	};
	// Chỉ chế độ Cây theo dõi "vừa học" để chuyển nút chọn (Từng nhánh tự cuộn theo mốc nhánh).
	const learn = (b: BranchId, tier?: number): void => {
		if (tooSoon()) return;
		pending.current = mode === 'tree' ? { key: selected, spent: t.spent } : null;
		request('talent_add', { branch: b, ...(tier !== undefined ? { tier } : {}) });
	};
	const chooseStyle = (style: SwordStyleId): void => {
		if (tooSoon()) return;
		const st = t.branches.find((x) => x.branch === 'sword')?.styleTier ?? 3;
		pending.current = mode === 'tree' ? { key: selected, spent: t.spent, then: styleKey(style, st) } : null;
		request('talent_add', { branch: 'sword', style, tier: st });
	};
	const assign = (skillId: string): void => {
		setHeld(skillId);
		setMode('loadout');
	};
	const openBranch = (b: BranchId): void => {
		setBranch(b);
		setMode('branch');
	};

	const free = t.resetCost <= 0;
	const poor = !free && coins < t.resetCost;
	const cost = fmtNum(t.resetCost);
	const boxed = !portrait;

	const seg = (
		<div className={`tt-seg ${portrait ? 'w-full [&>*]:flex-1' : ''}`} role="group" aria-label="Chế độ xem">
			{(
				[
					['tree', portrait ? 'Toàn cây' : low ? 'Cây' : 'Cây', 'Cây tiềm năng'],
					['branch', low ? 'Nhánh' : 'Từng nhánh', 'Từng nhánh'],
					['loadout', portrait || low ? 'Gán ô' : 'Gán ô · Phủ phép', 'Gán ô · Phủ phép'],
				] as [Mode, string, string][]
			).map(([m, label, full]) => (
				<button key={m} type="button" className="ui-chip" aria-pressed={mode === m} aria-label={full} title={full} onClick={() => setMode(m)}>
					{label}
				</button>
			))}
		</div>
	);

	const resetChip = (
		<button type="button" data-reset-chip className="ui-chip tt-chip-sm tt-chip-tight shrink-0" title={poor ? `${RESET_HELP} Bạn mới có ${fmtNum(coins)} xu.` : RESET_HELP} disabled={t.spent === 0 || poor} onClick={() => setConfirming(true)}>
			{portrait || low ? 'Tẩy điểm' : free ? 'Tẩy điểm (miễn phí)' : `Tẩy điểm (${cost} xu)`}
		</button>
	);

	const rulesChip = (
		<button type="button" data-rules-chip className="ui-chip tt-chip-sm tt-chip-tight shrink-0 font-extrabold" aria-expanded={rulesOpen} aria-label="Cách cộng điểm" title="Cách cộng điểm" onClick={() => setRulesOpen((v) => !v)}>
			?
		</button>
	);

	const poorNote = poor && t.spent > 0 && (
		<p className="mb-1.5 text-note font-bold text-berry">
			Tẩy điểm cần {cost} xu — bạn mới có {fmtNum(coins)}.
		</p>
	);

	/**
	 * Tẩy điểm + "?" (luật) cho máy tính / màn thấp: hộp luật mở ngay cạnh chip — `up` khi cụm nằm ở đáy cột bên. Điện thoại
	 * dọc đặt hai chip ở dải đầu và luật là sheet dính đáy.
	 */
	const tools = (up: boolean): ReactNode => (
		<div ref={rulesRef} className="relative flex flex-wrap items-center justify-end gap-1.5">
			{resetChip}
			{rulesChip}
			{rulesOpen && !portrait && (
				<div className={`ui-paper absolute right-0 z-30 max-h-[min(420px,70vh)] w-[min(440px,calc(100vw-64px))] overflow-y-auto border-bark p-3 text-left shadow-[0_3px_0_rgb(26_17_10/0.45)] ${up ? 'bottom-full mb-2' : 'top-full mt-2'}`}>
					<div className="mb-1.5 flex items-center justify-between gap-2">
						<p className="font-display text-label font-extrabold">Cách cộng điểm</p>
						<button type="button" className="ui-chip tt-chip-sm" onClick={() => setRulesOpen(false)}>
							Đóng
						</button>
					</div>
					{poorNote}
					<RulesList />
				</div>
			)}
		</div>
	);

	const header: ReactNode = confirming ? (
		<div className="flex min-h-[46px] shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b-2 border-paper-line pb-2">
			<p className="min-w-[200px] flex-1 text-body font-bold text-berry">
				{free
					? `Trả lại ${t.spent} điểm? Kiếm về mốc 1, nhánh nguyên tố về chưa học (học lại mốc 1 bằng điểm), bỏ lưu phái Kiếm.`
					: `Trả lại ${t.spent} điểm và tốn ${cost} xu? Kiếm về mốc 1, nhánh nguyên tố về chưa học (học lại mốc 1 bằng điểm), bỏ lưu phái Kiếm.`}
			</p>
			<button
				type="button"
				className="ui-chip ui-chip-danger"
				disabled={poor}
				onClick={() => {
					request('talent_reset');
					resetFocus.current = 'rules';
					setConfirming(false);
					setSelectedRaw(null);
				}}
			>
				Tẩy hết
			</button>
			<button
				type="button"
				className="ui-chip"
				autoFocus
				onClick={() => {
					resetFocus.current = 'reset';
					setConfirming(false);
				}}
			>
				Thôi
			</button>
		</div>
	) : low && mode === 'tree' ? null : low ? (
		<div className="flex shrink-0 items-center gap-x-2 border-b-2 border-paper-line pb-1.5">
			<span className={`ui-tag h-7 shrink-0 border-2 border-outline px-2.5 text-[14px] tabular-nums ${t.unspent > 0 ? 'bg-gold text-ink-brown' : 'bg-paper-sunk text-ink-faint'}`}>{t.unspent} điểm</span>
			<span className="min-w-0 truncate text-[12px] text-ink-soft tabular-nums">
				đã dùng {t.spent}/{t.points}
			</span>
			<span className="ml-auto" />
			{seg}
			{tools(false)}
		</div>
	) : portrait ? (
		<div className="flex shrink-0 flex-col gap-2 border-b-2 border-paper-line pb-2">
			<div className="flex items-center gap-2">
				<span className={`ui-tag h-8 min-w-8 justify-center border-2 border-outline px-2 text-[20px] tabular-nums ${t.unspent > 0 ? 'bg-gold text-ink-brown' : 'bg-paper-sunk text-ink-faint'}`}>{t.unspent}</span>
				<div className="shrink-0 leading-4">
					<p className="font-display text-[15px] font-extrabold leading-[18px]">điểm còn lại</p>
					<p className="text-[12px] text-ink-soft tabular-nums">
						đã dùng {t.spent}/{t.points}
					</p>
				</div>
				{tinyTabs ? (
					<span className="flex-1" />
				) : (
					<div className="min-w-[40px] flex-1" title={`Lối tu luyện: ${t.buildLabel}`}>
						<BuildBar t={t} />
					</div>
				)}
				{resetChip}
				{rulesChip}
			</div>
			{tinyTabs && (
				// Màn < 360px: chip cảm ứng 44px không còn chỗ cho thanh build cùng hàng — xuống hàng riêng.
				<div title={`Lối tu luyện: ${t.buildLabel}`}>
					<BuildBar t={t} />
				</div>
			)}
			{seg}
		</div>
	) : (
		<div className="flex min-h-[46px] shrink-0 items-center gap-x-2.5 border-b-2 border-paper-line pb-2">
			<img src="/assets/ui/icon_star.png" width={45} height={42} alt="" draggable={false} className="pixel-img -my-1 shrink-0" />
			<span className={`text-[36px] font-extrabold leading-none tabular-nums ${t.unspent > 0 ? 'text-amber' : 'text-ink-faint'}`}>{t.unspent}</span>
			<div className="shrink-0 leading-[18px]">
				<p className="font-display text-label font-extrabold leading-5">điểm còn lại</p>
				<p className="text-note leading-4 text-ink-soft tabular-nums">
					đã dùng {t.spent} trên {t.points}
				</p>
			</div>
			<div className="flex min-w-0 flex-1 flex-col gap-0.5 border-l-2 border-paper-line pl-2.5" title={t.buildDetail}>
				<p className="flex min-w-0 items-baseline gap-1.5 leading-[18px]">
					<span className="tt-kicker shrink-0">Lối tu luyện</span>
					<b className="truncate font-display text-[16px] text-ink-brown">{t.buildLabel}</b>
				</p>
				<BuildBar t={t} className="max-w-[300px]!" />
				<p className="truncate text-[12px] leading-4 text-ink-soft">{t.buildDetail}</p>
			</div>
			{seg}
		</div>
	);

	const rules = rulesOpen && portrait && (
		<div className="sticky -bottom-5 z-30 -mx-2 -mb-5 max-h-[60vh] overflow-y-auto rounded-t-[14px] border-t-2 border-bark bg-paper-hi px-3 pt-2.5 pb-[max(14px,env(safe-area-inset-bottom))]">
			<div className="mb-1.5 flex items-center justify-between">
				<p className="font-display text-label font-extrabold">Cách cộng điểm</p>
				<button type="button" className="ui-chip tt-chip-sm" onClick={() => setRulesOpen(false)}>
					Đóng
				</button>
			</div>
			{poorNote}
			<RulesList />
		</div>
	);

	if (!t.branches.length) {
		return (
			<div ref={rootRef} data-touch={touch || undefined} className="flex flex-col gap-3">
				<style>{TALENT_CSS}</style>
				{header}
				<p className="text-body text-ink-soft">Bạn chưa mở nhánh nào. Cứ theo cốt truyện, nhánh sẽ tới.</p>
			</div>
		);
	}

	// Cột chi tiết (máy tính, màn thấp) / sheet dính đáy (điện thoại dọc).
	const detail = info ? (
		<TalentDetail t={t} info={info} sheet={portrait} onSelect={setSelected} onLearn={learn} onChooseStyle={chooseStyle} onAssign={assign} />
	) : portrait ? (
		<LearnableList t={t} sheet onSelect={setSelected} />
	) : (
		<>
			<LearnableList t={t} sheet={false} onSelect={setSelected} />
			<TalentOverview t={t} build={low} onSelect={setSelected} onLoadout={() => setMode('loadout')} />
		</>
	);

	let body: ReactNode;
	if (mode === 'tree') {
		const grid = <TalentTreeGrid t={t} L={L} p={p} scroll={!portrait} fine={fine} selected={selected} route={route} onSelect={setSelected} onHead={openBranch} />;
		body = portrait ? (
			<>
				{grid}
				<Legend />
				<div className="mt-1 rounded-[8px] border-2 border-paper-line bg-paper-hi/60 px-2.5 py-2">
					<TalentOverview t={t} build onSelect={setSelected} onLoadout={() => setMode('loadout')} />
				</div>
				<div className="tt-scroll sticky -bottom-5 z-20 -mx-2 -mb-5 mt-1 max-h-[72dvh] touch-pan-y overflow-y-auto overscroll-contain border-t-2 border-bark bg-paper-hi px-3 pt-2.5 pb-[max(14px,env(safe-area-inset-bottom))] shadow-[0_-3px_0_rgb(26_17_10/0.18)]">{detail}</div>
			</>
		) : (
			<div className="flex min-h-0 flex-1 gap-3">
				<div className="flex min-h-0 shrink-0 flex-col gap-1.5">
					{grid}
					{!low && <Legend width={L.width + TREE_FRAME} />}
				</div>
				<aside className="flex min-h-0 min-w-0 flex-1 flex-col gap-2" aria-label="Chi tiết mốc">
					{low && (
						<div className="flex shrink-0 flex-col gap-1.5 border-b-2 border-paper-line pb-1.5">
							<div className="flex items-center gap-1.5">
								<span className={`ui-tag h-7 shrink-0 border-2 border-outline px-2.5 text-[14px] tabular-nums ${t.unspent > 0 ? 'bg-gold text-ink-brown' : 'bg-paper-sunk text-ink-faint'}`} title={`Đã dùng ${t.spent} trên ${t.points}`}>
									{t.unspent} điểm
								</span>
								<span className="ml-auto" />
								{tools(false)}
							</div>
							{seg}
						</div>
					)}
					<div ref={asideRef} className="tt-scroll flex min-h-0 flex-1 touch-pan-y flex-col gap-3 overflow-y-auto overscroll-contain pr-0.5">
						{detail}
					</div>
					{!low && <div className="shrink-0 border-t-2 border-paper-line pt-2">{tools(true)}</div>}
				</aside>
			</div>
		);
	} else if (mode === 'branch') {
		body = (
			<TalentBranchList
				t={t}
				branch={branch}
				setBranch={setBranch}
				phone={portrait}
				boxed={boxed}
				narrowTabs={tinyTabs}
				rail={low}
				tools={boxed && !low ? tools(false) : null}
				onLearn={learn}
				onChooseStyle={chooseStyle}
			/>
		);
	} else {
		body = (
			<>
				{boxed && !low && tools(false)}
				<TalentLoadoutView t={t} touch={touch} wide={!phone && !low && !narrow} initialHeld={held} />
			</>
		);
	}

	const fill = boxed && mode !== 'loadout';
	return (
		<div ref={rootRef} data-touch={touch || undefined} className={`relative flex flex-col gap-2 ${fill ? 'h-full min-h-0' : ''}`}>
			<style>{TALENT_CSS}</style>
			{header}
			{rules}
			{body}
		</div>
	);
}


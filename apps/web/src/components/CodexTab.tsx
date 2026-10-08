'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { agesText, type CodexEntry, type CodexKind } from '@/game/codex';
import { useGameStore } from '@/store/useGameStore';
import { fmtNum, PixelPortrait } from './CharacterPanelParts';
import { useTouchDevice } from './TouchControls';

/**
 * Thẻ Thư viện (phím B) trong bảng Hành trang — cuốn sách cũ hai trang (chủ dự án 08/10/2026: "cuốn sổ lật lật cho sinh động, sách cũ đậm chất fantasy").
 * Trang trái: mục lục theo dải đánh dấu (Quái thường / Boss / Nhân vật); trang phải: chi tiết. Đổi mục → trang phải LẬT
 * (xoay quanh gáy sách nửa vòng, đổi nội dung, xoay nốt); đổi dải → trang trái lật. Mục chưa gặp: "???" nhưng vẫn có lời đồn
 * về nơi gặp. Điện thoại: một trang, mục lục ↔ chi tiết.
 * HÌNH TẠM: bìa / giấy dùng bộ khung gỗ + giấy UI sẵn có; cuốn sách vẽ PixelLab ở `docs/pixellab-ke-hoach-ve.md`.
 */

const TABS: { kind: CodexKind; label: string }[] = [
	{ kind: 'monster', label: 'Quái thường' },
	{ kind: 'boss', label: 'Boss' },
	{ kind: 'npc', label: 'Nhân vật' },
];

/** Nửa thời gian một lần lật (ms): xoay tới mép rồi đổi nội dung, xoay nốt nửa còn lại. */
const HALF_FLIP = 170;

/** Trang lật: `shown` là nội dung đang hiện, đổi `target` thì xoay nửa vòng, thay nội dung, xoay về. */
function useFlip<T>(target: T): { shown: T; style: CSSProperties } {
	const [shown, setShown] = useState(target);
	const [phase, setPhase] = useState<'idle' | 'out' | 'in'>('idle');
	useEffect(() => {
		if (Object.is(target, shown)) return undefined;
		setPhase('out');
		const a = setTimeout(() => {
			setShown(target);
			setPhase('in');
		}, HALF_FLIP);
		const b = setTimeout(() => setPhase('idle'), HALF_FLIP * 2);
		return () => {
			clearTimeout(a);
			clearTimeout(b);
		};
		// `shown` đọc trong lần chạy này là đủ — thêm vào phụ thuộc thì lật xong lại chạy lại.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [target]);
	const angle = phase === 'out' ? -88 : 0;
	return {
		shown,
		style: {
			transform: `rotateY(${angle}deg)`,
			transition: phase === 'in' ? `transform ${HALF_FLIP}ms ease-out` : phase === 'out' ? `transform ${HALF_FLIP}ms ease-in` : undefined,
			filter: phase === 'out' ? 'brightness(0.82)' : undefined,
		},
	};
}

export function CodexTab() {
	const codex = useGameStore((s) => s.codex);
	const mapNames = useGameStore((s) => s.mapNames);
	const portraits = useGameStore((s) => s.portraits);
	const touch = useTouchDevice();
	const [tab, setTab] = useState<CodexKind>('monster');
	const [pick, setPick] = useState<Record<CodexKind, string | null>>({ monster: null, boss: null, npc: null });
	/** Điện thoại: đang xem chi tiết (true) hay mục lục. */
	const [detail, setDetail] = useState(false);

	const list = useMemo(() => codex.entries.filter((e) => e.kind === tab), [codex.entries, tab]);
	const seen = useMemo(() => new Set(codex.seen), [codex.seen]);
	const current = list.find((e) => e.id === pick[tab]) ?? list[0] ?? null;
	const page = useFlip<CodexEntry | null>(current);
	const index = useFlip<CodexKind>(tab);

	useEffect(() => {
		const onKey = (e: KeyboardEvent): void => {
			const t = e.target;
			if ((t instanceof HTMLInputElement && t.type !== 'checkbox' && t.type !== 'range') || t instanceof HTMLTextAreaElement) return;
			if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
			if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
				const i = TABS.findIndex((x) => x.kind === tabRef.current);
				const next = TABS[(i + (e.code === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length]!;
				setTab(next.kind);
			} else if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
				e.preventDefault();
				const l = listRef.current;
				const i = Math.max(0, l.findIndex((x) => x.id === curRef.current?.id));
				const next = l[(i + (e.code === 'ArrowDown' ? 1 : l.length - 1)) % Math.max(1, l.length)];
				if (next) setPick((p) => ({ ...p, [tabRef.current]: next.id }));
			}
		};
		window.addEventListener('keydown', onKey, true);
		return () => window.removeEventListener('keydown', onKey, true);
	}, []);
	const tabRef = useRef(tab);
	const listRef = useRef(list);
	const curRef = useRef(current);
	tabRef.current = tab;
	listRef.current = list;
	curRef.current = current;

	const total = codex.entries.length;
	const found = codex.entries.filter((e) => seen.has(e.id)).length;
	const place = (map: string, zone?: string) => `${mapNames[`${codex.region}/${map}`] ?? map}${zone ? ' · hang ổ' : ''}`;

	const indexPage = (
		<div className="flex h-full flex-col" style={{ ...index.style, transformOrigin: 'right center' }}>
			<p className="text-center font-display text-label font-extrabold tracking-wide text-ink-brown">— Mục lục —</p>
			<ul className="mt-2 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-1 [scrollbar-width:thin]">
				{codex.entries
					.filter((e) => e.kind === index.shown)
					.map((e, i) => {
						const known = seen.has(e.id);
						const on = current?.id === e.id && index.shown === tab;
						return (
							<li key={e.id}>
								<button
									type="button"
									onClick={() => {
										setPick((p) => ({ ...p, [tab]: e.id }));
										setDetail(true);
									}}
									className={`flex w-full items-baseline gap-2 rounded-[4px] px-2 py-1 text-left font-display ${on ? 'bg-[#e9d3a4] text-ink-brown' : 'hover:bg-[#efdfbd]'}`}
								>
									<span className="w-6 shrink-0 text-right text-note text-ink-faint tabular-nums">{toRoman(i + 1)}.</span>
									<span className={`min-w-0 flex-1 truncate font-extrabold ${known ? 'text-ink-brown' : 'text-ink-faint italic'}`}>{known ? e.name : '? ? ?'}</span>
									{known && e.kind !== 'npc' && (codex.kills[e.id] ?? 0) > 0 && <span className="text-note text-ink-soft tabular-nums">×{fmtNum(codex.kills[e.id] ?? 0)}</span>}
								</button>
							</li>
						);
					})}
			</ul>
			<p className="mt-2 text-center text-note italic text-ink-soft">
				Đã ghi chép {found}/{total} trang
			</p>
		</div>
	);

	const e = page.shown;
	const known = !!e && seen.has(e.id);
	const detailPage = (
		<div className="flex h-full flex-col" style={{ ...page.style, transformOrigin: 'left center' }}>
			{!e ? (
				<p className="m-auto italic text-ink-soft">Trang trắng.</p>
			) : (
				<div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1 [scrollbar-width:thin]">
					<div className="flex items-center gap-3">
						<div className="flex h-[104px] w-[104px] shrink-0 items-center justify-center rounded-[6px] border-2 border-[#b9975e] bg-[#f3e4c2]">
							{known && e.sprite && portraits[e.sprite] ? (
								<PixelPortrait src={portraits[e.sprite]!} alt={e.name} box={92} />
							) : (
								<span className="px-2 text-center font-display text-[13px] italic text-ink-faint">{known ? 'Chân dung đang được vẽ' : '?'}</span>
							)}
						</div>
						<div className="min-w-0">
							<h3 className="font-display text-title leading-tight font-extrabold text-ink-brown">{known ? e.name : '? ? ?'}</h3>
							{known && e.titles.map((t) => <p key={t} className="text-note italic text-ink-soft">{t}</p>)}
							{known && e.ages && <p className="text-note text-ink-soft">Gặp được: {agesText(e.ages)}</p>}
						</div>
					</div>
					<Rule />
					{known ? <p className="font-display text-body leading-relaxed text-ink-brown first-letter:float-left first-letter:mr-1 first-letter:font-display first-letter:text-[34px] first-letter:leading-[30px] first-letter:font-extrabold first-letter:text-[#8a3b12]">{e.lore}</p> : <p className="italic text-ink-soft">Trang này còn trống. Hãy tận mắt gặp {e.kind === 'npc' ? 'người này' : 'sinh vật này'} để chép vào sổ.</p>}
					{known && e.stats && (
						<>
							<Rule />
							<dl className="grid grid-cols-1 gap-x-4 gap-y-1 text-body min-[480px]:grid-cols-2">
								<Stat k="Máu" v={fmtNum(e.stats.hp)} />
								<Stat k="Sức đánh" v={fmtNum(e.stats.atk)} />
								<Stat k="Giáp" v={fmtNum(e.stats.def)} />
								<Stat k="Tốc độ" v={fmtNum(e.stats.speed)} />
								<Stat k="Kiểu đánh" v={e.stats.ranged ? 'Đánh xa' : 'Cận chiến'} />
								<Stat k="Đã hạ" v={`${fmtNum(codex.kills[e.id] ?? 0)} lần`} />
								<Stat k="Kinh nghiệm" v={`${fmtNum(e.stats.exp)} EXP`} />
								<Stat k="Rơi ra" v={`${fmtNum(e.stats.coins)} xu`} />
							</dl>
						</>
					)}
					<Rule />
					<div>
						<p className="font-display text-label font-extrabold text-ink-brown">{known ? 'Nơi gặp' : 'Lời đồn về nơi gặp'}</p>
						<ul className="mt-1 list-inside list-disc text-body text-ink-brown">
							{e.places.map((p) => (
								<li key={`${p.map}|${p.zone ?? ''}`}>{place(p.map, p.zone)}</li>
							))}
						</ul>
					</div>
				</div>
			)}
		</div>
	);

	return (
		<div className="flex h-full min-h-[440px] flex-col select-none [@media(max-height:500px)]:min-h-0">
			<div className="flex items-end gap-1.5 px-1">
				{TABS.map((t) => (
					<button
						key={t.kind}
						type="button"
						aria-pressed={tab === t.kind}
						onClick={() => {
							setTab(t.kind);
							setDetail(false);
						}}
						className={`rounded-t-[6px] border-2 border-b-0 px-3 py-1 font-display text-note font-extrabold ${tab === t.kind ? 'translate-y-[2px] border-[#8a3b12] bg-[#a8451b] text-paper-hi' : 'border-[#6b4a2a] bg-[#5a3a20] text-[#e8d2a6] hover:bg-[#6b4a2a]'}`}
					>
						{t.label}
					</button>
				))}
				<p className="ml-auto hidden pb-1 font-display text-label font-extrabold text-ink-brown sm:block">Thư viện Aether</p>
			</div>
			<div className="relative flex min-h-0 flex-1 rounded-[6px] border-2 border-[#8a6a3c] bg-[#e7d3a8] p-1 shadow-[inset_0_0_24px_rgba(90,55,20,0.45)] [perspective:1400px]">
				<div className={`min-h-0 flex-1 rounded-l-[4px] bg-[#f2e3c0] p-3 sm:p-4 ${detail ? 'max-[639px]:hidden' : ''}`}>{indexPage}</div>
				<div className="pointer-events-none w-3 shrink-0 bg-[linear-gradient(90deg,rgba(80,48,18,0.05),rgba(80,48,18,0.35)_50%,rgba(80,48,18,0.05))] max-[639px]:hidden" />
				<div className={`min-h-0 flex-[1.25] rounded-r-[4px] bg-[#f2e3c0] p-3 sm:p-4 ${detail ? '' : 'max-[639px]:hidden'}`}>
					{detail && (
						<button type="button" className="ui-chip mb-2 sm:hidden" onClick={() => setDetail(false)}>
							← Mục lục
						</button>
					)}
					{detailPage}
				</div>
			</div>
			{!touch && <p className="pt-1 text-center text-note text-ink-soft">↑ ↓ lật trang · ← → đổi mục</p>}
		</div>
	);
}

function Rule() {
	return <div className="h-px w-full bg-[linear-gradient(90deg,transparent,#a07c45,transparent)]" />;
}

function Stat({ k, v }: { k: string; v: ReactNode }) {
	return (
		<div className="flex items-baseline justify-between gap-2 border-b border-dotted border-[#c8a875]">
			<dt className="text-ink-soft">{k}</dt>
			<dd className="font-extrabold text-ink-brown tabular-nums">{v}</dd>
		</div>
	);
}

function toRoman(n: number): string {
	const t: [number, string][] = [
		[10, 'X'],
		[9, 'IX'],
		[5, 'V'],
		[4, 'IV'],
		[1, 'I'],
	];
	let out = '';
	let x = n;
	for (const [v, s] of t)
		while (x >= v) {
			out += s;
			x -= v;
		}
	return out;
}

'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ADMIN_REASON_MAX, MAX_LEVEL, type AdminChange, type AdminCharacter, type AdminField, type AdminGrantRequest, type AdminLogEntry } from '@aether/protocol';
import { expForLevel } from '@aether/sim/skills';
import { adminApi, ApiError } from '@/net/api';
import { useSession } from '@/store/useSession';
import { Alert, Backdrop, TitleBanner } from '../AuthScreen';
import { AMOUNT_KEYS, AMOUNT_LABEL, changeText, draftPreview, draftToRequest, emptyDraft, fmt, groupLog, previewChanges, type AdminDraft, type AmountKey } from './adminPlan';

interface Icon {
	src: string;
	w: number;
	h: number;
}

/** Icon PixelLab có sẵn, hiện đúng 1× như kho đồ / HUD: xu, kim cương, bình mật ong, ngôi sao điểm tiềm năng. EXP không có icon. */
const ICONS: Partial<Record<AmountKey, Icon>> = {
	coins: { src: '/assets/ui/icon_coins.png', w: 44, h: 37 },
	diamonds: { src: '/assets/ui/icon_diamond.png', w: 44, h: 36 },
	potions: { src: '/assets/ui/icon_potion.png', w: 35, h: 44 },
	talentPoints: { src: '/assets/ui/icon_star.png', w: 45, h: 42 },
};

/** Số hiện có + trường xem trước của từng dòng cộng / trừ. */
const ROW: Record<AmountKey, { field: AdminField; current: (c: AdminCharacter) => number }> = {
	coins: { field: 'coins', current: (c) => c.coins },
	diamonds: { field: 'diamonds', current: (c) => c.diamonds },
	potions: { field: 'potions', current: (c) => c.potions },
	exp: { field: 'exp', current: (c) => c.exp },
	talentPoints: { field: 'bonusPoints', current: (c) => c.bonusPoints },
};

const INPUT =
	'min-w-0 rounded-[6px] border-2 border-paper-line bg-paper-hi px-3 py-2 text-[16px] leading-6 text-ink-brown tabular-nums outline-none transition-[border-color] placeholder:text-ink-faint focus:border-amber';
const TIME = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

/**
 * Bàn làm việc của quản trị: tìm nhân vật → chọn → thẻ số hiện tại → cộng / trừ từng loại (+ đặt cấp, lý do bắt buộc) → hộp xác nhận
 * tóm tắt (xem trước bằng đúng luật máy chủ) → kết quả + nhật ký gần đây. Máy tính: hai cột (tìm | nhân vật), điện thoại: một cột.
 */
export function AdminConsole({ token, username }: { token: string; username: string }) {
	const logout = useSession((s) => s.logout);
	const [q, setQ] = useState('');
	const [results, setResults] = useState<AdminCharacter[] | null>(null);
	const [searching, setSearching] = useState(false);
	const [searchError, setSearchError] = useState<string | null>(null);
	const [selected, setSelected] = useState<AdminCharacter | null>(null);
	const [log, setLog] = useState<AdminLogEntry[] | null>(null);
	const [logError, setLogError] = useState<string | null>(null);
	const editorRef = useRef<HTMLElement>(null);

	/** Lỗi API → câu báo; phiên hết hạn thì đăng xuất (trang về ô đăng nhập). */
	const fail = useCallback((e: unknown): string => {
		if (e instanceof ApiError && e.status === 401) void useSession.getState().logout();
		return e instanceof Error ? e.message : String(e);
	}, []);

	const search = useCallback(
		async (text: string) => {
			setSearching(true);
			setSearchError(null);
			try {
				const list = await adminApi.characters(token, text.trim());
				setResults(list);
				// Nhân vật đang chọn có trong kết quả mới → lấy số mới (online / offline, số vừa đổi trong game).
				setSelected((cur) => (cur ? (list.find((c) => c.id === cur.id) ?? cur) : cur));
			} catch (e) {
				setSearchError(fail(e));
			} finally {
				setSearching(false);
			}
		},
		[token, fail],
	);

	const loadLog = useCallback(async () => {
		setLogError(null);
		try {
			setLog(await adminApi.log(token, 60));
		} catch (e) {
			setLogError(fail(e));
		}
	}, [token, fail]);

	useEffect(() => {
		void search('');
		void loadLog();
	}, [search, loadLog]);

	const pick = (c: AdminCharacter): void => {
		setSelected(c);
		// Điện thoại: thẻ nhân vật nằm dưới danh sách — cuộn tới cho khỏi tưởng bấm không ăn.
		requestAnimationFrame(() => {
			if (matchMedia('(max-width: 767px)').matches) editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
		});
	};

	/** Số mới của một nhân vật → thẻ đang chọn + dòng của nó trong danh sách (danh sách giữ nguyên kết quả tìm). */
	const apply = (c: AdminCharacter): void => {
		setSelected(c);
		setResults((list) => list?.map((x) => (x.id === c.id ? c : x)) ?? list);
	};

	const updated = (c: AdminCharacter): void => {
		apply(c);
		void loadLog();
	};

	/** "Làm mới số": hỏi lại máy chủ riêng nhân vật đang chọn (online / offline, số vừa đổi trong game). */
	const refresh = async (c: AdminCharacter): Promise<void> => {
		try {
			const fresh = (await adminApi.characters(token, c.name)).find((x) => x.id === c.id);
			if (fresh) apply(fresh);
		} catch (e) {
			setSearchError(fail(e));
		}
	};

	return (
		<Backdrop>
			<div className="flex w-full max-w-5xl flex-col items-center">
				<TitleBanner size="md" text="Quản trị" />
				<div className="ui-frame w-full px-3 pb-4 pt-7 sm:px-4">
					<header className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b-2 border-paper-line pb-3">
						<p className="min-w-0 text-body text-ink-soft">
							Quản trị <b className="text-ink-brown">{username}</b> · cộng tiền, điểm cho nhân vật
						</p>
						<div className="flex shrink-0 gap-2">
							<Link href="/" className="ui-chip">
								Về game
							</Link>
							<button type="button" onClick={() => void logout()} className="ui-chip">
								Đăng xuất
							</button>
						</div>
					</header>

					<div className="grid gap-4 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
						<section aria-labelledby="admin-search-title" className="min-w-0">
							<h2 id="admin-search-title" className="mb-2 font-display text-head font-extrabold">
								Tìm nhân vật
							</h2>
							<form
								role="search"
								onSubmit={(e) => {
									e.preventDefault();
									void search(q);
								}}
								className="flex gap-2"
							>
								<input
									type="search"
									value={q}
									onChange={(e) => setQ(e.target.value)}
									placeholder="Tên nhân vật hoặc tài khoản"
									aria-label="Tên nhân vật hoặc tài khoản"
									maxLength={40}
									autoCapitalize="none"
									autoCorrect="off"
									spellCheck={false}
									enterKeyHint="search"
									className={`${INPUT} flex-1`}
								/>
								<button type="submit" disabled={searching} className="ui-btn shrink-0 px-3 text-[16px]">
									{searching ? 'Đang tìm…' : 'Tìm'}
								</button>
							</form>
							<p className="mt-1 text-note text-ink-soft">Để trống rồi bấm Tìm: các nhân vật chơi gần nhất.</p>
							{searchError && (
								<div className="mt-2">
									<Alert>{searchError}</Alert>
								</div>
							)}
							<ResultList results={results} selectedId={selected?.id ?? null} onPick={pick} />
						</section>

						<section ref={editorRef} aria-labelledby="admin-char-title" className="min-w-0 scroll-mt-4">
							<h2 id="admin-char-title" className="mb-2 font-display text-head font-extrabold">
								Nhân vật
							</h2>
							{selected ? (
								<CharacterEditor key={selected.id} token={token} c={selected} fail={fail} onUpdated={updated} onRefresh={() => void refresh(selected)} />
							) : (
								<p className="ui-tray px-3 py-6 text-center text-body text-ink-soft">Chọn một nhân vật trong danh sách để xem số hiện tại và cộng / trừ.</p>
							)}
						</section>
					</div>

					<LogSection log={log} error={logError} onReload={() => void loadLog()} />
				</div>
			</div>
		</Backdrop>
	);
}

function ResultList({ results, selectedId, onPick }: { results: AdminCharacter[] | null; selectedId: string | null; onPick: (c: AdminCharacter) => void }) {
	if (results === null) return <p className="mt-3 text-body text-ink-soft">Đang tải danh sách…</p>;
	if (!results.length) return <p className="ui-tray mt-3 px-3 py-4 text-center text-body text-ink-soft">Không thấy nhân vật nào khớp.</p>;
	return (
		<ul className="mt-3 grid max-h-[340px] gap-2 overflow-y-auto overscroll-contain pr-1 md:max-h-[560px]">
			{results.map((c) => {
				const on = c.id === selectedId;
				return (
					<li key={c.id}>
						<button
							type="button"
							aria-pressed={on}
							onClick={() => onPick(c)}
							className={`flex w-full items-center gap-2 rounded-[8px] border-2 px-3 py-2 text-left transition-colors ${on ? 'border-amber bg-honey' : 'border-paper-line bg-paper-hi hover:bg-[#fff8e8]'}`}
						>
							<span className="min-w-0 flex-1">
								<span className="block truncate font-display text-label font-extrabold leading-6">{c.name}</span>
								<span className="block truncate text-note text-ink-soft tabular-nums">
									{c.account} · Cấp {c.level} · {fmt(c.coins)} xu
								</span>
							</span>
							<OnlineTag online={c.online} short />
						</button>
					</li>
				);
			})}
		</ul>
	);
}

function OnlineTag({ online, short = false }: { online: boolean; short?: boolean }) {
	return <span className={`ui-tag shrink-0 border-2 ${online ? 'border-leaf bg-leaf text-paper-hi' : 'border-paper-line bg-paper-sunk text-ink-soft'}`}>{online ? (short ? 'Online' : 'Đang online') : 'Offline'}</span>;
}

function CharacterEditor({ token, c, fail, onUpdated, onRefresh }: { token: string; c: AdminCharacter; fail: (e: unknown) => string; onUpdated: (c: AdminCharacter) => void; onRefresh: () => void }) {
	const [draft, setDraft] = useState<AdminDraft>(emptyDraft);
	const [formError, setFormError] = useState<string | null>(null);
	const [confirm, setConfirm] = useState<{ req: AdminGrantRequest; changes: AdminChange[] } | null>(null);
	const [sending, setSending] = useState(false);
	const [done, setDone] = useState<{ name: string; changes: AdminChange[] } | null>(null);
	const live = draftPreview(c, draft);
	const after = (f: AdminField): number | undefined => live.find((x) => x.field === f)?.to;
	const levelAfter = after('level') ?? c.level;
	const expAfter = after('exp') ?? c.exp;
	const levelChanged = levelAfter !== c.level || expAfter !== c.exp;

	const setAmount = (k: AmountKey, patch: Partial<AdminDraft['amounts'][AmountKey]>): void => {
		setDraft((d) => ({ ...d, amounts: { ...d.amounts, [k]: { ...d.amounts[k], ...patch } } }));
		setDone(null);
	};

	const review = (e: React.FormEvent): void => {
		e.preventDefault();
		const r = draftToRequest(c.id, draft);
		if ('error' in r) return setFormError(r.error);
		setFormError(null);
		setConfirm({ req: r.req, changes: previewChanges(c, r.req) });
	};

	const send = async (): Promise<void> => {
		if (!confirm || sending) return;
		setSending(true);
		try {
			const res = await adminApi.grant(token, confirm.req);
			setDone({ name: res.character.name, changes: res.changes });
			setDraft(emptyDraft());
			setConfirm(null);
			onUpdated(res.character);
		} catch (e) {
			setConfirm(null);
			setFormError(fail(e));
		} finally {
			setSending(false);
		}
	};

	const expNext = expForLevel(c.level);
	const expPct = c.level >= MAX_LEVEL ? 100 : Math.max(0, Math.min(100, (c.exp / expNext) * 100));
	return (
		<div className="grid gap-3">
			<div className="ui-paper p-3">
				<div className="flex items-start gap-2">
					<div className="min-w-0 flex-1">
						<p className="font-display text-[22px] font-extrabold leading-7 break-words">{c.name}</p>
						<p className="text-note text-ink-soft">Tài khoản {c.account}</p>
					</div>
					<OnlineTag online={c.online} />
				</div>
				<dl className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-3">
					<StatTile icon={ICONS.coins} label="Xu" value={fmt(c.coins)} />
					<StatTile icon={ICONS.diamonds} label="Kim cương" value={fmt(c.diamonds)} />
					<StatTile icon={ICONS.potions} label="Bình hồi phục" value={fmt(c.potions)} />
					<StatTile icon={ICONS.talentPoints} label="Tiềm năng thưởng" value={fmt(c.bonusPoints)} />
					<div className="ui-tray col-span-2 flex flex-col justify-center gap-1 px-3 py-2 lg:col-span-2">
						<dt className="flex items-baseline justify-between gap-2 text-chip font-bold text-ink-soft">
							<span>
								Cấp <b className="text-label font-extrabold text-ink-brown tabular-nums">{c.level}</b>
							</span>
							<span className="tabular-nums">{c.level >= MAX_LEVEL ? 'Cấp tối đa' : `${fmt(c.exp)} / ${fmt(expNext)} EXP`}</span>
						</dt>
						<dd className="ui-bar h-3">
							<span className="ui-bar-fill" style={{ width: `${expPct}%`, '--fill': 'var(--color-exp)' } as CSSProperties} />
						</dd>
					</div>
				</dl>
				<div className="mt-2 flex flex-wrap items-center justify-between gap-2">
					<p className="text-note text-ink-soft">{c.online ? 'Đang online: cộng xong là nhận ngay trong game.' : 'Offline: thấy số mới ở lần vào game sau.'}</p>
					<button type="button" onClick={onRefresh} className="ui-chip">
						Làm mới số
					</button>
				</div>
			</div>

			{done && (
				<Alert tone="notice" onDismiss={() => setDone(null)}>
					{done.changes.length ? (
						<>
							Đã cập nhật <b>{done.name}</b>: {done.changes.map(changeText).join(' · ')}
						</>
					) : (
						<>Không có gì thay đổi (số đã ở mức thấp nhất / cao nhất).</>
					)}
				</Alert>
			)}

			<form onSubmit={review} noValidate className="grid gap-2">
				<p className="font-display text-label font-extrabold">Cộng / trừ</p>
				{AMOUNT_KEYS.map((k) => {
					const v = draft.amounts[k];
					const row = ROW[k];
					const to = k === 'exp' ? undefined : after(row.field);
					return (
						<div key={k} className="ui-tray flex flex-wrap items-center gap-x-2 gap-y-1.5 px-2 py-2">
							<span className="flex h-11 w-[46px] shrink-0 items-center justify-center">
								{ICONS[k] ? (
									<img src={ICONS[k]!.src} width={ICONS[k]!.w} height={ICONS[k]!.h} alt="" draggable={false} className="pixel-img max-w-none" />
								) : (
									<span className="ui-tag bg-exp text-paper-hi">EXP</span>
								)}
							</span>
							<span className="min-w-[9rem] flex-1">
								<span className="block text-body font-bold">{AMOUNT_LABEL[k]}</span>
								<span className="block text-note text-ink-soft tabular-nums">
									{k === 'exp' ? (
										levelChanged ? (
											<>
												Cấp {c.level} · {fmt(c.exp)} → <b className="text-ink-brown">Cấp {levelAfter} · {fmt(expAfter)}</b>
											</>
										) : (
											<>
												hiện có {fmt(c.exp)} (cấp {c.level})
											</>
										)
									) : (
										<>
											hiện có {fmt(row.current(c))}
											{to !== undefined && (
												<>
													{' '}
													→ <b className="text-ink-brown">{fmt(to)}</b>
												</>
											)}
										</>
									)}
								</span>
							</span>
							<span className="flex w-full gap-2 sm:w-auto">
								<button
									type="button"
									onClick={() => setAmount(k, { sign: v.sign > 0 ? -1 : 1 })}
									aria-label={`${AMOUNT_LABEL[k]}: đang ${v.sign > 0 ? 'cộng' : 'trừ'} — bấm để đổi`}
									className={`ui-chip min-w-[84px] shrink-0 ${v.sign > 0 ? 'text-leaf' : 'ui-chip-danger'}`}
								>
									{v.sign > 0 ? '+ Cộng' : '− Trừ'}
								</button>
								<input
									inputMode="numeric"
									value={v.text}
									onChange={(e) => setAmount(k, { text: e.target.value })}
									placeholder="0"
									aria-label={`Số ${AMOUNT_LABEL[k]} ${v.sign > 0 ? 'cộng' : 'trừ'}`}
									autoComplete="off"
									className={`${INPUT} w-full sm:w-32`}
								/>
							</span>
						</div>
					);
				})}
				<label className="ui-tray flex flex-wrap items-center gap-x-2 gap-y-1.5 px-2 py-2">
					<span className="ui-key ml-1 h-8 min-w-[38px] text-[13px]">Cấp</span>
					<span className="min-w-[9rem] flex-1">
						<span className="block text-body font-bold">Đặt cấp</span>
						<span className="block text-note text-ink-soft">1–{MAX_LEVEL} · EXP về 0 · để trống = giữ cấp</span>
					</span>
					<input
						inputMode="numeric"
						value={draft.setLevel}
						onChange={(e) => {
							setDraft((d) => ({ ...d, setLevel: e.target.value }));
							setDone(null);
						}}
						placeholder={String(c.level)}
						aria-label="Đặt cấp"
						autoComplete="off"
						className={`${INPUT} w-full sm:w-32`}
					/>
				</label>
				<label className="block">
					<span className="mb-1 block text-body font-bold">
						Lý do <span className="text-note font-semibold text-ink-soft">(bắt buộc — ghi vào nhật ký; người chơi thấy trong thông báo)</span>
					</span>
					<input
						type="text"
						value={draft.reason}
						onChange={(e) => setDraft((d) => ({ ...d, reason: e.target.value }))}
						maxLength={ADMIN_REASON_MAX}
						placeholder="vd: Quà sự kiện, bù lỗi mất đồ…"
						autoComplete="off"
						className={`${INPUT} w-full`}
					/>
				</label>
				{formError && <Alert>{formError}</Alert>}
				<div className="flex gap-2">
					<button type="submit" className="ui-btn flex-1 text-[16px]">
						Xem lại &amp; xác nhận
					</button>
					<button
						type="button"
						onClick={() => {
							setDraft(emptyDraft());
							setFormError(null);
						}}
						className="ui-chip min-h-[39px] shrink-0"
					>
						Xoá số
					</button>
				</div>
			</form>

			{confirm && (
				<ConfirmDialog busy={sending} canConfirm={confirm.changes.length > 0} onCancel={() => setConfirm(null)} onConfirm={() => void send()}>
					<p className="mb-2 text-body text-ink-soft">
						Nhân vật <b className="text-ink-brown">{c.name}</b> (tài khoản {c.account}) — {c.online ? 'đang online, nhận ngay' : 'offline, thấy ở lần vào game sau'}.
					</p>
					{confirm.changes.length ? (
						<ul className="ui-tray mb-2 grid gap-1 px-3 py-2 text-body tabular-nums">
							{confirm.changes.map((ch) => (
								<li key={ch.field}>{changeText(ch)}</li>
							))}
						</ul>
					) : (
						<Alert tone="notice">Không có gì thay đổi — số đã ở mức thấp nhất / cao nhất.</Alert>
					)}
					{confirm.req.setLevel !== undefined && <p className="text-note text-ink-soft">Đặt cấp {confirm.req.setLevel}: EXP về 0 rồi mới cộng / trừ EXP.</p>}
					<ClampNotes c={c} req={confirm.req} />
					<p className="mt-2 text-body">
						Lý do: <b>{confirm.req.reason}</b>
					</p>
				</ConfirmDialog>
			)}
		</div>
	);
}

/** Trừ nhiều hơn số đang có → về 0 (không âm): nói rõ trong hộp xác nhận. */
function ClampNotes({ c, req }: { c: AdminCharacter; req: AdminGrantRequest }) {
	const notes = (
		[
			['coins', c.coins],
			['diamonds', c.diamonds],
			['potions', c.potions],
			['talentPoints', c.bonusPoints],
		] as const
	).flatMap(([k, cur]) => ((req[k] ?? 0) < 0 && -(req[k] ?? 0) > cur ? [`${AMOUNT_LABEL[k]}: chỉ còn ${fmt(cur)} — trừ về 0`] : []));
	if (!notes.length) return null;
	return <p className="text-note text-berry">{notes.join(' · ')}.</p>;
}

function StatTile({ icon, label, value }: { icon?: Icon; label: string; value: string }) {
	return (
		<div className="ui-tray flex min-h-[56px] items-center gap-2 px-2 py-1.5">
			{icon && (
				<span className="flex w-[46px] shrink-0 justify-center">
					<img src={icon.src} width={icon.w} height={icon.h} alt="" draggable={false} className="pixel-img max-w-none" />
				</span>
			)}
			<div className="min-w-0">
				<dt className="text-chip font-bold leading-4 text-ink-soft">{label}</dt>
				<dd className="text-label font-extrabold tabular-nums">{value}</dd>
			</div>
		</div>
	);
}

function ConfirmDialog({ busy, canConfirm, onCancel, onConfirm, children }: { busy: boolean; canConfirm: boolean; onCancel: () => void; onConfirm: () => void; children: ReactNode }) {
	useEffect(() => {
		const onKey = (e: KeyboardEvent): void => {
			if (e.key === 'Escape' && !busy) onCancel();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [busy, onCancel]);
	return (
		<div
			className="fixed inset-0 z-50 flex overflow-y-auto bg-[rgb(10_6_4/0.7)] p-4"
			onClick={(e) => {
				if (e.target === e.currentTarget && !busy) onCancel();
			}}
		>
			<div role="dialog" aria-modal="true" aria-labelledby="admin-confirm-title" className="ui-frame m-auto w-full max-w-md px-4 pb-4 pt-3">
				<h2 id="admin-confirm-title" className="mb-2 font-display text-head font-extrabold">
					Xác nhận thay đổi
				</h2>
				{children}
				<div className="mt-4 flex gap-2">
					{/* Mặc định đứng ở Huỷ: lỡ Enter không ghi nhầm. */}
					<button type="button" autoFocus onClick={onCancel} disabled={busy} className="ui-chip min-h-[39px] flex-1">
						Huỷ
					</button>
					<button type="button" onClick={onConfirm} disabled={busy || !canConfirm} className="ui-btn flex-1 text-[16px]">
						{busy ? 'Đang ghi…' : 'Xác nhận'}
					</button>
				</div>
			</div>
		</div>
	);
}

function LogSection({ log, error, onReload }: { log: AdminLogEntry[] | null; error: string | null; onReload: () => void }) {
	const groups = log ? groupLog(log) : [];
	return (
		<section aria-labelledby="admin-log-title" className="mt-6 border-t-2 border-paper-line pt-3">
			<div className="mb-2 flex items-center justify-between gap-2">
				<h2 id="admin-log-title" className="font-display text-head font-extrabold">
					Nhật ký quản trị
				</h2>
				<button type="button" onClick={onReload} className="ui-chip">
					Tải lại
				</button>
			</div>
			{error && <Alert>{error}</Alert>}
			{log === null ? (
				!error && <p className="text-body text-ink-soft">Đang tải nhật ký…</p>
			) : groups.length === 0 ? (
				<p className="ui-tray px-3 py-4 text-center text-body text-ink-soft">Chưa có lần cộng / trừ nào.</p>
			) : (
				<>
					{/* Máy tính: bảng. */}
					<div className="hidden overflow-x-auto md:block">
						<table className="w-full border-collapse text-left text-body">
							<thead>
								<tr className="text-note text-ink-soft">
									<th className="px-2 py-1 font-bold">Lúc</th>
									<th className="px-2 py-1 font-bold">Quản trị</th>
									<th className="px-2 py-1 font-bold">Nhân vật</th>
									<th className="px-2 py-1 font-bold">Thay đổi</th>
									<th className="px-2 py-1 font-bold">Lý do</th>
								</tr>
							</thead>
							<tbody>
								{groups.map((g) => (
									<tr key={g.key} className="border-t-2 border-paper-line align-top">
										<td className="whitespace-nowrap px-2 py-1.5 tabular-nums text-ink-soft">{TIME.format(g.at)}</td>
										<td className="px-2 py-1.5">{g.admin}</td>
										<td className="px-2 py-1.5 font-bold">{g.characterName}</td>
										<td className="px-2 py-1.5 tabular-nums">
											{g.changes.map((ch) => (
												<span key={ch.field} className="block whitespace-nowrap">
													{changeText(ch)}
												</span>
											))}
										</td>
										<td className="px-2 py-1.5 break-words text-ink-soft">{g.reason}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					{/* Điện thoại: thẻ. */}
					<ul className="grid gap-2 md:hidden">
						{groups.map((g) => (
							<li key={g.key} className="ui-paper px-3 py-2">
								<p className="text-note text-ink-soft tabular-nums">
									{TIME.format(g.at)} · {g.admin} → <b className="text-ink-brown">{g.characterName}</b>
								</p>
								<ul className="my-1 text-body tabular-nums">
									{g.changes.map((ch) => (
										<li key={ch.field}>{changeText(ch)}</li>
									))}
								</ul>
								<p className="text-note break-words text-ink-soft">Lý do: {g.reason}</p>
							</li>
						))}
					</ul>
				</>
			)}
		</section>
	);
}

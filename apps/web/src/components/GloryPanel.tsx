'use client';

import { useEffect, useRef } from 'react';
import type { DailyView, GoalView } from '@aether/protocol';
import { CHECKIN_CYCLE, checkinGift, checkinSlot } from '@aether/sim/rewards';
import { fmtCount, goalGroups } from '@/game/rewards';
import { useGameStore } from '@/store/useGameStore';
import { useSession } from '@/store/useSession';
import { SectionTitle, StatBar } from './CharacterPanelParts';
import { Toasts } from './Hud';

/**
 * Bảng Bia Danh Vọng (K1 — docs/ke-hoach-kim-cuong.md): mở khi bấm E ở bia giữa quảng trường Thistlewood. Mọi số liệu do máy
 * chủ đẩy (`useSession.goals` / `daily` / `diamonds`) — bảng chỉ gửi ý định (xin tiến độ, nhận quà, điểm danh). Người chơi
 * đứng yên khi bảng mở (`canAct`), nên còn đứng cạnh bia — đúng điều kiện máy chủ kiểm lúc trao quà.
 * Lớp phủ z-15 như bảng Hành trang: Esc / chạm nền để đóng, tự đóng khi truyện chen vào.
 */
export function GloryPanel() {
	const panel = useGameStore((s) => s.panel);
	const setPanel = useGameStore((s) => s.setPanel);
	const story = useGameStore((s) => !!s.dialogue || !!s.card);
	const scene = useGameStore((s) => s.scene);
	const ready = useGameStore((s) => s.status === 'ready');
	const online = useSession((s) => s.online);
	const connected = useSession((s) => s.connected);
	const goals = useSession((s) => s.goals);
	const daily = useSession((s) => s.daily);
	const diamonds = useSession((s) => s.diamonds);
	const downOnBackdrop = useRef(false);
	const closeBtn = useRef<HTMLButtonElement>(null);
	const open = panel === 'glory';
	const visible = open && ready && scene === 'play' && !story;

	useEffect(() => {
		if (open && (story || scene !== 'play' || !ready)) setPanel(null);
	}, [open, story, scene, ready, setPanel]);

	// Mỗi lần mở: xin tiến độ mới (số quái hạ / map đã tới đổi liên tục, máy chủ không tự đẩy).
	useEffect(() => {
		if (!visible) return;
		online?.goals();
		closeBtn.current?.focus({ preventScroll: true });
	}, [visible, online]);

	useEffect(() => {
		if (!visible) return undefined;
		const onKey = (e: KeyboardEvent): void => {
			if (e.code === 'Escape') setPanel(null);
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [visible, setPanel]);

	if (!visible || !online) return null;
	const close = (): void => setPanel(null);

	return (
		<div
			className="pointer-events-auto absolute inset-0 z-[15] flex touch-none items-center justify-center bg-[#1a110a]/55 p-[max(6px,env(safe-area-inset-top))] sm:p-3"
			onPointerDown={(e) => {
				downOnBackdrop.current = e.target === e.currentTarget;
			}}
			onClick={(e) => {
				if (downOnBackdrop.current && e.target === e.currentTarget) close();
				downOnBackdrop.current = false;
			}}
			onContextMenu={(e) => e.preventDefault()}
		>
			<div role="dialog" aria-modal="true" aria-labelledby="glory-title" className="ui-frame relative flex h-full max-h-full w-full max-w-[720px] flex-col select-none sm:h-[min(100%,640px)]">
				<div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b-2 border-wood-edge px-1 pb-2">
					<h2 id="glory-title" className="font-display text-head font-extrabold leading-tight text-ink-brown sm:text-title">
						Bia Danh Vọng
					</h2>
					<span className="ml-auto shrink-0 text-label font-extrabold tabular-nums text-ink-brown">{diamonds ?? 0} kim cương</span>
					<button ref={closeBtn} type="button" aria-label="Đóng bảng" title="Esc" onClick={close} className="ui-chip shrink-0">
						Đóng
					</button>
					<p className="w-full text-note text-ink-soft">Đạt mục tiêu thì nhận kim cương ở đây. Máy chủ ghi tiến độ — chơi ở đâu cũng được tính.</p>
				</div>
				<div className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-2 pt-3 pb-5 text-body text-ink-brown [scrollbar-color:var(--color-paper-line)_transparent] [scrollbar-width:thin] sm:px-3">
					{daily && <DailySection daily={daily} connected={connected} onCheckin={() => online.checkin()} />}
					{!goals ? (
						<p className="mt-4 text-ink-soft">Đang đọc những dòng khắc trên bia…</p>
					) : (
						goalGroups().map((grp) => (
							<section key={grp.kind} className="mt-5 flex flex-col gap-1.5">
								<SectionTitle>{grp.group}</SectionTitle>
								<p className="text-note text-ink-soft">{grp.note}</p>
								{grp.goals.map((g) => (
									<GoalRow key={g.id} title={g.title} target={g.target} diamonds={g.diamonds} view={goals.find((v) => v.id === g.id)} connected={connected} onClaim={() => online.claimGoal(g.id)} />
								))}
							</section>
						))
					)}
				</div>
				<div className="pointer-events-none absolute inset-x-0 bottom-3 z-40 flex justify-center px-3">
					<Toasts max={2} center />
				</div>
			</div>
		</div>
	);
}

/** Điểm danh: chuỗi ngày + vòng quà 7 ngày (ô hôm nay viền vàng) + nút nhận. */
function DailySection({ daily, connected, onCheckin }: { daily: DailyView; connected: boolean; onCheckin: () => void }) {
	// Ô của lần điểm danh hôm nay: đã nhận = chuỗi hiện tại, chưa nhận = chuỗi + 1 (chuỗi đứt thì đã về 0).
	const today = checkinSlot(daily.done ? daily.streak : daily.streak + 1);
	return (
		<section className="flex flex-col gap-1.5">
			<SectionTitle>Điểm danh mỗi ngày</SectionTitle>
			<div className="flex flex-wrap items-center gap-2">
				<p className="text-note text-ink-soft">
					{daily.streak > 0 ? `Chuỗi ${daily.streak} ngày liên tiếp. ` : ''}Sang ngày mới lúc 0 giờ (giờ Việt Nam); bỏ một ngày là chuỗi về ngày 1.
				</p>
				{daily.done ? (
					<span className="ui-tag ml-auto bg-paper-sunk text-ink-soft">Hôm nay đã nhận</span>
				) : (
					<button type="button" className="ui-chip ml-auto" disabled={!connected} onClick={onCheckin}>
						Điểm danh
					</button>
				)}
			</div>
			<div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
				{Array.from({ length: CHECKIN_CYCLE }, (_, i) => {
					const day = i + 1;
					const g = checkinGift(day);
					const isToday = day === today;
					return (
						<div key={day} className={`ui-tray flex flex-col items-center px-1 py-1.5 text-center ${isToday ? 'outline-2 outline-amber' : ''}`}>
							<span className="font-display text-label font-extrabold">Ngày {day}</span>
							<span className="text-note font-extrabold text-[#1f5f8a]">+{g.diamonds} KC</span>
							<span className="text-note">{g.coins} xu</span>
							<span className="text-note">{g.potions} bình</span>
							{isToday && <span className="text-chip font-extrabold text-amber">{daily.done ? 'Đã nhận' : 'Hôm nay'}</span>}
						</div>
					);
				})}
			</div>
		</section>
	);
}

/** Một mục tiêu: tên + tiến độ, quà, nút Nhận (đạt mốc, chưa nhận) / "Đã nhận". */
function GoalRow({ title, target, diamonds, view, connected, onClaim }: { title: string; target: number; diamonds: number; view?: GoalView; connected: boolean; onClaim: () => void }) {
	const progress = view?.progress ?? 0;
	const claimed = !!view?.claimed;
	const reached = progress >= target;
	return (
		<div className="ui-tray flex flex-wrap items-center gap-x-3 gap-y-1 px-2.5 py-1.5">
			<div className="min-w-[160px] flex-1">
				<div className="flex flex-wrap items-baseline gap-x-2">
					<span className="font-extrabold">{title}</span>
					<span className="ml-auto text-note tabular-nums text-ink-soft">
						{fmtCount(Math.min(progress, target))} / {fmtCount(target)}
					</span>
				</div>
				<StatBar value={progress} max={target} fill={claimed ? 'var(--color-paper-line)' : 'var(--color-mana)'} />
			</div>
			<span className="text-note font-extrabold tabular-nums text-[#1f5f8a]">+{diamonds} KC</span>
			{claimed ? (
				<span className="ui-tag bg-paper-hi text-leaf">Đã nhận</span>
			) : (
				<button type="button" className="ui-chip" disabled={!reached || !connected} onClick={onClaim}>
					Nhận
				</button>
			)}
		</div>
	);
}

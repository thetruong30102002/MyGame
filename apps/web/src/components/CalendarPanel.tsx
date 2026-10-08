'use client';

import type { DailyView } from '@aether/protocol';
import { CHECKIN_CYCLE, checkinGift, checkinSlot } from '@aether/sim/rewards';
import { giftText, monthGrid } from '@/game/rewards';
import { useSession } from '@/store/useSession';
import { SectionTitle } from './CharacterPanelParts';
import { DiamondCount, ServiceWindow } from './ServiceWindow';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

/**
 * Điểm danh (K1): cửa sổ riêng mở bằng icon lịch trên HUD (chủ dự án 08/10/2026: "điểm danh cần có khung lịch, là một tab riêng
 * có icon hình cái lịch"). Khung lịch tháng theo giờ Việt Nam — ngày đã điểm danh tô vàng, hôm nay viền vàng — rồi vòng quà 7
 * ngày. Ngày / chuỗi / các ngày đã điểm danh đều do máy chủ gửi (`useSession.daily`).
 */
export function CalendarPanel() {
	const online = useSession((s) => s.online);
	const connected = useSession((s) => s.connected);
	const daily = useSession((s) => s.daily);
	const diamonds = useSession((s) => s.diamonds);
	if (!online || !daily) return null;
	const [y, m] = daily.day.split('-').map(Number) as [number, number];
	return (
		<ServiceWindow id="calendar" title="Điểm danh" subtitle="Mỗi ngày một lần — sang ngày mới lúc 0 giờ (giờ Việt Nam). Bỏ một ngày thì chuỗi quà về ngày 1." aside={<DiamondCount n={diamonds ?? 0} />}>
			<div className="flex flex-col gap-5">
				<div className="flex flex-wrap items-center gap-x-3 gap-y-2">
					<p className="font-display text-head font-extrabold">
						Tháng {m}/{y}
					</p>
					<span className="text-note text-ink-soft">{daily.streak > 0 ? `Chuỗi ${daily.streak} ngày liên tiếp` : 'Chưa có chuỗi'}</span>
					{daily.done ? (
						<span className="ui-tag ml-auto bg-paper-sunk text-ink-soft">Hôm nay đã điểm danh</span>
					) : (
						<button type="button" className="ui-btn ml-auto" disabled={!connected} onClick={() => online.checkin()}>
							Điểm danh
						</button>
					)}
				</div>
				{!daily.done && <p className="-mt-3 text-note text-ink-soft">Quà hôm nay: {giftText(daily.next)}</p>}
				<MonthGrid daily={daily} />
				<section className="flex flex-col gap-1.5">
					<SectionTitle>Quà theo chuỗi</SectionTitle>
					<CycleRow daily={daily} />
				</section>
			</div>
		</ServiceWindow>
	);
}

/** Khung lịch tháng: tuần bắt đầu thứ Hai; ngày đã điểm danh tô vàng, hôm nay viền vàng, ngày tới chữ nhạt. */
function MonthGrid({ daily }: { daily: DailyView }) {
	const checked = new Set(daily.month ?? []);
	return (
		<div className="ui-tray p-2">
			<div className="grid grid-cols-7 gap-1 text-center">
				{WEEKDAYS.map((w) => (
					<span key={w} className="text-chip font-extrabold text-ink-soft">
						{w}
					</span>
				))}
				{monthGrid(daily.day).map((c, i) => {
					if (!c) return <span key={`e${i}`} />;
					const done = checked.has(c.day);
					const today = c.day === daily.day;
					return (
						<div key={c.day} className={`flex h-11 flex-col items-center justify-center rounded-[6px] border-2 ${today ? 'border-amber' : 'border-transparent'} ${done ? 'bg-honey' : 'bg-paper-hi'}`}>
							<span className={`text-body font-extrabold tabular-nums ${c.day > daily.day ? 'text-ink-faint' : ''}`}>{c.date}</span>
							{done && <span className="text-chip font-extrabold leading-none text-leaf">Đã nhận</span>}
						</div>
					);
				})}
			</div>
		</div>
	);
}

/** Vòng quà 7 ngày: ô của lần điểm danh hôm nay viền vàng. */
function CycleRow({ daily }: { daily: DailyView }) {
	// Đã nhận = chuỗi hiện tại, chưa nhận = chuỗi + 1 (chuỗi đứt thì đã về 0).
	const today = checkinSlot(daily.done ? daily.streak : daily.streak + 1);
	return (
		<div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7">
			{Array.from({ length: CHECKIN_CYCLE }, (_, i) => {
				const day = i + 1;
				const g = checkinGift(day);
				const isToday = day === today;
				return (
					<div key={day} className={`ui-tray flex flex-col items-center px-1 py-1.5 text-center ${isToday ? 'outline-2 outline-amber' : ''}`}>
						<span className="font-display text-label font-extrabold">Ngày {day}</span>
						<span className="flex items-center gap-1 text-note font-extrabold">
							<img src="/assets/ui/icon_diamond.png" width={22} height={18} alt="" draggable={false} className="pixel-img max-w-none" />
							{g.diamonds}
						</span>
						<span className="text-note">{g.coins} xu</span>
						<span className="text-note">{g.potions} bình</span>
						{isToday && <span className="text-chip font-extrabold text-amber">{daily.done ? 'Đã nhận' : 'Hôm nay'}</span>}
					</div>
				);
			})}
		</div>
	);
}

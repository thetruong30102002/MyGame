'use client';

import { REGIONS, WAYSTONE_COST } from '@aether/sim/regions';
import { useGameStore } from '@/store/useGameStore';
import { useSession } from '@/store/useSession';
import { ServiceWindow } from './ServiceWindow';

/**
 * Cột dịch chuyển ở trạm (khung nhiều vùng — docs/ke-hoach-the-gioi.md mục 3): danh sách 10 vùng theo thứ tự đường chơi. Trạm đã
 * từng đặt chân tới (máy chủ ghi) thì dịch chuyển được, trả `WAYSTONE_COST` xu; vùng chưa mở ghi "đang xây dựng". Cổng vùng (cấp,
 * boss chúa vùng trước) Game kiểm lại lúc dịch chuyển.
 */
export function WaystonePanel() {
	const online = useSession((s) => s.online);
	const connected = useSession((s) => s.connected);
	const hubs = useSession((s) => s.hubs);
	const current = useSession((s) => s.online?.progress.map ?? '');
	const coins = useGameStore((s) => s.stats.coins);
	const request = useGameStore((s) => s.request);
	if (!online) return null;
	return (
		<ServiceWindow
			id="waystone"
			title="Cột dịch chuyển"
			subtitle={`Đã đặt chân tới trạm nào thì dịch chuyển về đó được — ${WAYSTONE_COST} xu một lần (đang có ${coins} xu).`}
			onOpen={() => online.hubs()}
		>
			<div className="flex flex-col gap-1.5">
				{REGIONS.map((r) => {
					const key = `${r.id}/${r.hub}`;
					const isHere = current === key;
					const been = !!hubs?.includes(key);
					return (
						<div key={r.id} className={`ui-tray flex flex-wrap items-center gap-x-3 gap-y-1 px-2.5 py-2 ${r.ready ? '' : 'opacity-60'}`}>
							<span className="w-6 shrink-0 text-center font-display text-label font-extrabold tabular-nums text-ink-soft">{r.order}</span>
							<div className="min-w-[160px] flex-1">
								<p className="font-extrabold">{r.settlement.name}</p>
								<p className="text-note text-ink-soft">
									{r.settlement.kind === 'castle' ? 'Toà thành' : 'Làng'} · {r.name} · cấp {r.levels[0]}–{r.levels[1]}
								</p>
							</div>
							{!r.ready ? (
								<span className="ui-tag bg-paper-sunk text-ink-soft">Đang xây dựng</span>
							) : isHere ? (
								<span className="ui-tag bg-paper-hi text-leaf">Bạn đang ở đây</span>
							) : !hubs ? (
								<span className="text-note text-ink-soft">Đang hỏi máy chủ…</span>
							) : !been ? (
								<span className="ui-tag bg-paper-sunk text-ink-soft">Chưa tới trạm</span>
							) : (
								<button type="button" className="ui-chip" disabled={!connected || coins < WAYSTONE_COST} onClick={() => request('teleport', { map: key })}>
									Dịch chuyển · {WAYSTONE_COST} xu
								</button>
							)}
						</div>
					);
				})}
			</div>
		</ServiceWindow>
	);
}

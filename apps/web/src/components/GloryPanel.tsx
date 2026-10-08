'use client';

import type { GoalView } from '@aether/protocol';
import { fmtCount, goalGroups } from '@/game/rewards';
import { useSession } from '@/store/useSession';
import { SectionTitle, StatBar } from './CharacterPanelParts';
import { DiamondCount, ServiceWindow } from './ServiceWindow';

/**
 * Bảng Bia Danh Vọng (K1 — docs/ke-hoach-kim-cuong.md): mở khi bấm E ở bia giữa quảng trường Thistlewood. Mọi số liệu do máy
 * chủ đẩy (`useSession.goals` / `diamonds`) — bảng chỉ gửi ý định (xin tiến độ, nhận quà). Người chơi đứng yên khi bảng mở,
 * nên còn đứng cạnh bia — đúng điều kiện máy chủ kiểm lúc trao quà.
 */
export function GloryPanel() {
	const online = useSession((s) => s.online);
	const connected = useSession((s) => s.connected);
	const goals = useSession((s) => s.goals);
	const diamonds = useSession((s) => s.diamonds);
	if (!online) return null;
	return (
		<ServiceWindow
			id="glory"
			title="Bia Danh Vọng"
			subtitle="Đạt mục tiêu thì nhận kim cương ở đây. Máy chủ ghi tiến độ — chơi ở đâu cũng được tính."
			aside={<DiamondCount n={diamonds ?? 0} />}
			// Mỗi lần mở: xin tiến độ mới (số quái hạ / map đã tới đổi liên tục, máy chủ không tự đẩy).
			onOpen={() => online.goals()}
		>
			{!goals ? (
				<p className="text-ink-soft">Đang đọc những dòng khắc trên bia…</p>
			) : (
				goalGroups().map((grp) => (
					<section key={grp.kind} className="mb-5 flex flex-col gap-1.5">
						<SectionTitle>{grp.group}</SectionTitle>
						<p className="text-note text-ink-soft">{grp.note}</p>
						{grp.goals.map((g) => (
							<GoalRow key={g.id} title={g.title} target={g.target} diamonds={g.diamonds} view={goals.find((v) => v.id === g.id)} connected={connected} onClaim={() => online.claimGoal(g.id)} />
						))}
					</section>
				))
			)}
		</ServiceWindow>
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
			<span className="text-note font-extrabold tabular-nums text-[#1f5f8a]">+{diamonds} kim cương</span>
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

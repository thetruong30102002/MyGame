'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/store/useSession';
import { useSettings, type Settings } from '@/store/useSettings';
import { LeaveButton } from './LeaveButton';

/**
 * Thẻ Cài đặt (phím O): âm thanh, hiển thị, tài khoản. Cài đặt lưu theo máy (`useSettings`), đổi là áp dụng ngay. "Đổi nhân
 * vật" / "Đăng xuất" chỉ nằm ở đây (chủ dự án 08/10/2026) — trước kia nút Đổi nhân vật nằm cạnh khung chat, dễ bấm nhầm.
 */
export function CharacterSettingsTab() {
	const s = useSettings();
	const username = useSession((st) => st.username);

	return (
		<div className="flex flex-col gap-5 text-body text-ink-brown">
			<Section title="Âm thanh">
				<p className="text-note text-ink-soft">Game chưa có âm thanh — cài đặt được lưu sẵn, có nhạc và tiếng hiệu ứng là dùng ngay.</p>
				<Toggle label="Tắt tiếng" on={s.muted} onChange={(muted) => s.set({ muted })} />
				<Slider label="Âm lượng chung" value={s.volume} disabled={s.muted} onChange={(volume) => s.set({ volume })} />
				<Slider label="Nhạc nền" value={s.music} disabled={s.muted} onChange={(music) => s.set({ music })} />
				<Slider label="Hiệu ứng" value={s.sfx} disabled={s.muted} onChange={(sfx) => s.set({ sfx })} />
			</Section>

			<Section title="Hiển thị">
				<Toggle label="Hiện người chơi khác" hint="Tắt cho đỡ rối khi map đông người" on={s.showOthers} onChange={(showOthers) => s.set({ showOthers })} />
				<Toggle label="Hiện tên người chơi khác" on={s.showOtherNames} disabled={!s.showOthers} onChange={(showOtherNames) => s.set({ showOtherNames })} />
				<Toggle label="Rung màn hình khi đánh" on={s.shake} onChange={(shake) => s.set({ shake })} />
				<div>
					<button type="button" className="ui-chip text-note max-[639px]:min-h-11" onClick={() => s.reset()}>
						Về mặc định
					</button>
				</div>
			</Section>

			<Section title="Tài khoản">
				{username && <p className="text-note text-ink-soft">Đang đăng nhập: {username}</p>}
				<div className="flex flex-wrap gap-2">
					<LeaveButton className="max-[639px]:min-h-11" />
					<LogoutButton />
				</div>
			</Section>
		</div>
	);
}

/** Đăng xuất từ trong game: LƯU CHẮC tiến độ rồi mới đăng xuất (đăng xuất trần đóng kết nối, gói lưu cuối có thể rơi). Bấm hai lần. */
function LogoutButton() {
	const [armed, setArmed] = useState(false);
	useEffect(() => {
		if (!armed) return undefined;
		const t = setTimeout(() => setArmed(false), 3000);
		return () => clearTimeout(t);
	}, [armed]);
	const run = async (): Promise<void> => {
		const st = useSession.getState();
		await st.leaveGame();
		await st.logout();
	};
	return (
		<button type="button" className={`ui-chip min-h-8 text-note max-[639px]:min-h-11 ${armed ? 'ui-chip-danger' : ''}`} onClick={() => (armed ? void run() : setArmed(true))} title="Lưu lại rồi đăng xuất (bấm 2 lần)">
			{armed ? 'Bấm lần nữa để đăng xuất' : 'Đăng xuất'}
		</button>
	);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<section className="flex flex-col gap-2">
			<h3 className="font-display text-label font-extrabold">{title}</h3>
			{children}
		</section>
	);
}

function Toggle({ label, hint, on, disabled, onChange }: { label: string; hint?: string; on: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
	return (
		<label className={`ui-tray flex cursor-pointer items-center gap-3 px-2.5 py-1.5 ${disabled ? 'opacity-50' : ''}`}>
			<input type="checkbox" className="h-4 w-4 accent-[#b5651d]" checked={on} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
			<span className="font-bold">{label}</span>
			{hint && <span className="text-note text-ink-soft">{hint}</span>}
		</label>
	);
}

function Slider({ label, value, disabled, onChange }: { label: string; value: number; disabled?: boolean; onChange: (v: number) => void }) {
	return (
		<label className={`ui-tray flex items-center gap-3 px-2.5 py-1.5 ${disabled ? 'opacity-50' : ''}`}>
			<span className="w-[120px] shrink-0 font-bold">{label}</span>
			<input
				type="range"
				min={0}
				max={100}
				step={5}
				value={Math.round(value * 100)}
				disabled={disabled}
				onChange={(e) => onChange(Number(e.target.value) / 100)}
				onKeyDownCapture={(e) => e.stopPropagation()}
				className="min-w-0 flex-1 accent-[#b5651d]"
			/>
			<span className="w-10 text-right text-note tabular-nums">{Math.round(value * 100)}%</span>
		</label>
	);
}

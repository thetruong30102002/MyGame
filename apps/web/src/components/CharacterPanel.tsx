'use client';

import { useEffect, useRef } from 'react';
import { useGameStore, type PanelId } from '@/store/useGameStore';
import { useSession } from '@/store/useSession';
import { CharacterFriendsTab } from './CharacterPanelFriends';
import { CharacterInventoryTab } from './CharacterPanelInventory';
import { CharacterSettingsTab } from './CharacterPanelSettings';
import { CodexTab } from './CodexTab';
import { CharacterStatsTab } from './CharacterPanelStats';
import { CharacterTalentsTab } from './CharacterPanelTalents';
import { Toasts } from './Hud';
import { useTouchDevice } from './TouchControls';
import { useMediaQuery } from './useMediaQuery';

/** Mỗi thẻ một icon PixelLab hiện đúng 1× (cỡ gốc trong public/assets/ui/ui.json) — tab bìa sổ có hình, đỡ phải đọc chữ. */
/** Thẻ chỉ có CHỮ (chủ dự án 08/10/2026: bỏ icon trái tim / ngôi sao / ba lô — mọi thẻ cùng một kiểu). */
const TABS: { id: PanelId; label: string; key: string; code: string }[] = [
	{ id: 'character', label: 'Nhân vật', key: 'C', code: 'KeyC' },
	{ id: 'talents', label: 'Tiềm năng', key: 'P', code: 'KeyP' },
	{ id: 'inventory', label: 'Kho đồ', key: 'I', code: 'KeyI' },
	{ id: 'codex', label: 'Thư viện', key: 'B', code: 'KeyB' },
	{ id: 'friends', label: 'Bạn bè', key: 'F', code: 'KeyF' },
	{ id: 'settings', label: 'Cài đặt', key: 'O', code: 'KeyO' },
];

/**
 * Phím C / P / I / B / F / O / Esc không được cướp phím khi đang GÕ CHỮ (chat, ô mời kết bạn). Ô tích / thanh kéo của thẻ Cài đặt
 * cũng là `<input>` nhưng không gõ chữ — coi là đang gõ thì Esc không đóng được bảng sau khi vừa bấm một ô tích.
 */
const NOT_TYPING = new Set(['checkbox', 'radio', 'range', 'button', 'submit', 'reset', 'color']);
const typingIn = (t: EventTarget | null): boolean => t instanceof HTMLTextAreaElement || (t instanceof HTMLInputElement && !NOT_TYPING.has(t.type));

/**
 * Bảng Hành trang (nhân vật / tiềm năng / kho đồ / thư viện / bạn bè / cài đặt) — một cửa sổ khung gỗ lòng giấy; hàng thẻ
 * MỀM (10/10/2026): rãnh giấy lõm bo tròn, thẻ đang mở là viên kem nổi nhẹ, phím tắt là viên chữ nhạt (`.ui-tabs` / `.ui-tab`).
 * Điện thoại < 640px: hàng thẻ là dải vuốt ngang trên hàng riêng, nút Đóng lên trên.
 * Phím C / P / I mở đúng thẻ (đang mở thẻ khác thì chuyển thẻ, bấm lại thẻ đang xem thì đóng), Esc đóng; cảm ứng (và
 * chuột) chạm vào khung tên ở HUD là mở thẻ Nhân vật, huy hiệu điểm tiềm năng mở thẳng thẻ Tiềm năng.
 * Lớp phủ z-15 như bản đồ lớn: trên chat và cần gạt, DƯỚI thoại/thẻ truyện z-20, và tự đóng khi truyện chen vào.
 * Đóng khi chạm nền chỉ tính cú chạm BẮT ĐẦU trên nền — đóng ở pointerdown thì cú click sinh sau touchend rơi xuống
 * HUD bên dưới (cùng lý do với WorldMap).
 */
export function CharacterPanel() {
	const panel = useGameStore((s) => s.panel);
	const setPanel = useGameStore((s) => s.setPanel);
	const story = useGameStore((s) => !!s.dialogue || !!s.card);
	const scene = useGameStore((s) => s.scene);
	// Store sống qua các lượt vào game: lúc đang nạp thế giới, stats / tiềm năng / kho đồ vẫn là của nhân vật trước.
	const ready = useGameStore((s) => s.status === 'ready');
	const unspent = useGameStore((s) => s.talents.unspent);
	const invites = useSession((s) => s.social.incoming.length);
	const downOnBackdrop = useRef(false);
	const activeTab = useRef<HTMLButtonElement>(null);
	const touch = useTouchDevice();
	// Điện thoại dọc hoặc xoay ngang (thấp): chân dung nhỏ lại cho đỡ cuộn. Màn thấp cũng giữ thẻ chung hàng với tiêu đề
	// (lớp `max-height:500px` bên dưới) — xuống hàng là mất thêm 50px của khoảng ~150–270px nội dung còn lại.
	const compact = useMediaQuery('(max-width: 639px), (max-height: 500px)');
	const visible = !!panel && ready && scene === 'play' && !story;
	// Bảng không thuộc Hành trang (Bia Danh Vọng, quầy Bram, lịch điểm danh) tự vẽ ở `ServiceWindow`.
	const mine = TABS.some((t) => t.id === panel);

	useEffect(() => {
		if (panel && (story || scene !== 'play' || !ready)) setPanel(null);
	}, [panel, story, scene, ready, setPanel]);

	// Đưa focus vào bảng: để nguyên trên nút HUD vừa bấm (nằm dưới lớp phủ) thì Enter / Space / Tab bấm nhầm thứ phía sau.
	useEffect(() => {
		if (!visible) return;
		activeTab.current?.focus({ preventScroll: true });
		// Điện thoại: hàng thẻ là dải vuốt ngang — thẻ đang chọn (mở bằng nút ngoài HUD, vd Cài đặt) phải lọt vào tầm nhìn.
		activeTab.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
	}, [visible, panel]);

	useEffect(() => {
		const onKey = (e: KeyboardEvent): void => {
			// Ctrl/⌘ + C / P / I là chép / in / nghiêng chữ của trình duyệt — không phải mở bảng.
			if (typingIn(e.target) || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
			const st = useGameStore.getState();
			if (st.dialogue || st.card || st.scene !== 'play' || st.status !== 'ready') return;
			const tab = TABS.find((t) => t.code === e.code);
			if (tab) st.setPanel(st.panel === tab.id ? null : tab.id);
			else if (e.code === 'Escape' && st.panel) st.setPanel(null);
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, []);

	if (!visible || !panel || !mine) return null;
	const active = TABS.find((t) => t.id === panel) ?? TABS[0]!;
	const close = (): void => setPanel(null);

	return (
		<div
			className="pointer-events-auto absolute inset-0 z-[15] flex touch-none items-center justify-center bg-[#1a110a]/55 pt-[max(6px,env(safe-area-inset-top))] pr-[max(6px,env(safe-area-inset-right))] pb-[max(6px,env(safe-area-inset-bottom))] pl-[max(6px,env(safe-area-inset-left))] sm:pt-[max(12px,env(safe-area-inset-top))] sm:pb-[max(12px,env(safe-area-inset-bottom))] [@media(max-height:500px)]:pt-[max(4px,env(safe-area-inset-top))] [@media(max-height:500px)]:pb-[max(4px,env(safe-area-inset-bottom))]"
			onPointerDown={(e) => {
				downOnBackdrop.current = e.target === e.currentTarget;
			}}
			onClick={(e) => {
				if (downOnBackdrop.current && e.target === e.currentTarget) close();
				downOnBackdrop.current = false;
			}}
			onContextMenu={(e) => e.preventDefault()}
		>
			<div role="dialog" aria-modal="true" aria-labelledby="character-panel-title" className="ui-frame relative flex h-full max-h-full w-full max-w-[720px] flex-col select-none sm:h-[min(100%,640px)] lg:max-w-[1040px] lg:h-[min(100%,780px)]">
				<h2 id="character-panel-title" className="sr-only">
					Hành trang · {active.label}
				</h2>
				<div className="ui-tabs flex-wrap px-1">
					<div role="tablist" aria-label="Thẻ hành trang" className="flex min-w-0 items-center gap-1 max-[639px]:order-last max-[639px]:w-full max-[639px]:touch-pan-x max-[639px]:overflow-x-auto max-[639px]:[scrollbar-width:none]">
						{TABS.map((t) => {
							const on = t.id === panel;
							return (
								<button
									key={t.id}
									ref={on ? activeTab : undefined}
									type="button"
									role="tab"
									aria-selected={on}
									onClick={() => setPanel(t.id)}
									className="ui-tab max-[639px]:shrink-0 max-[639px]:justify-center max-[639px]:px-3"
								>
									<span className="whitespace-nowrap leading-[1.45]">{t.label}</span>
									{/* Phím tắt: viên chữ nhạt viền mảnh (bỏ ô phím nâu đậm — chủ dự án 10/10/2026 chê khối tối "AI"). */}
									{!touch && <kbd className="ui-key h-[18px] min-w-[18px] border border-[rgb(122_85_52/0.3)] bg-transparent px-1 text-[11px] text-ink-faint max-[1023px]:hidden">{t.key}</kbd>}
									{t.id === 'friends' && invites > 0 && (
										<span
											className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-cream bg-[#b22911] px-1 font-sans text-[12px] font-extrabold leading-none text-paper-hi shadow-[0_1px_2px_rgb(74_46_28/0.3)]"
											aria-label={`${invites} lời mời kết bạn`}
										>
											{invites}
										</span>
									)}
									{t.id === 'talents' && unspent > 0 && (
										<span
											className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-cream bg-[#b22911] px-1 font-sans text-[12px] font-extrabold leading-none text-paper-hi shadow-[0_1px_2px_rgb(74_46_28/0.3)]"
											aria-label={`${unspent} điểm chưa cộng`}
										>
											{unspent}
										</span>
									)}
								</button>
							);
						})}
					</div>
					<button type="button" aria-label="Đóng bảng" title="Esc" onClick={close} className={`ui-chip ml-auto ${touch ? 'min-h-11' : ''}`}>
						Đóng
					</button>
				</div>
				{/* `main` chặn mọi cử chỉ chạm (touch-none) cho cần gạt — vùng cuộn phải tự xin lại cuộn dọc. Đổi thẻ thì dựng lại → về đầu trang. */}
				<div
					key={panel}
					role="tabpanel"
					className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain px-2 pt-4 pb-5 [scrollbar-color:var(--color-paper-line)_transparent] [scrollbar-width:thin] sm:px-3"
				>
					{panel === 'character' && <CharacterStatsTab compact={compact} touch={touch} />}
					{panel === 'talents' && <CharacterTalentsTab touch={touch} />}
					{panel === 'inventory' && <CharacterInventoryTab />}
					{panel === 'codex' && <CodexTab />}
					{panel === 'friends' && <CharacterFriendsTab />}
					{panel === 'settings' && <CharacterSettingsTab />}
				</div>
				{/* z-40: trên mọi lớp dính đáy của tab (cột chi tiết z-5, thanh "Bước kế tiếp" z-20, sheet điện thoại z-30) — thiếu nó thì báo "Học" / "Đã mặc" nằm khuất sau chính sheet vừa bấm. */}
				<div className="pointer-events-none absolute inset-x-0 bottom-3 z-40 flex justify-center px-3">
					<Toasts max={2} center />
				</div>
			</div>
		</div>
	);
}

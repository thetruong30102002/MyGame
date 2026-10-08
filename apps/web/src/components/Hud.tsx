'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { StoryDirector } from '@/game/story/StoryDirector';
import { BootScreen } from './BootScreen';
import { usePixelBlock } from './CharacterPanelParts';
import { ChatBox } from './ChatBox';
import { KEY_TIP } from './keyHints';
import { Minimap } from './Minimap';
import { SkillBar } from './SkillBar';
import { useTouchDevice } from './TouchControls';
import { useMediaQuery } from './useMediaQuery';
import { useGameStore, type PanelId } from '@/store/useGameStore';
import { buffLabel, fmtRemaining } from '@aether/sim/shop';
import { activeBuffs } from '@/game/rewards';
import { useSession } from '@/store/useSession';
import { useNow } from './useNow';

/**
 * Thanh máu/MP/thể lực/EXP: rãnh gỗ viền đen 2px, ruột màu phẳng lấy theo icon PixelLab (`--color-hp`…) qua biến `--fill`.
 * `size`: 'main' máy tính 16px, 'touch' thanh chính trên cảm ứng 14px, 'thin' thanh mảnh (thể lực / EXP).
 */
function Bar({ value, max, fill, label, size = 'main' }: { value: number; max: number; fill: string; label?: string; size?: 'main' | 'touch' | 'thin' }) {
	const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
	const h = size === 'thin' ? 'h-2.5' : size === 'touch' ? 'h-3.5' : 'h-4';
	return (
		<div className={`ui-bar w-full ${h}`}>
			<div className="ui-bar-fill" style={{ width: `${pct}%`, '--fill': fill } as CSSProperties} />
			{label && <span className="ui-bar-label tabular-nums">{label}</span>}
		</div>
	);
}

/** Bấm lại đúng bảng đang mở thì đóng — cùng cách phím C / P / I bật tắt. */
function togglePanel(id: PanelId): void {
	const st = useGameStore.getState();
	st.setPanel(st.panel === id ? null : id);
}

/**
 * Huy hiệu điểm tiềm năng chưa cộng — bấm mở thẳng bảng Tiềm năng. Máy tính: ngôi sao PixelLab 1× (45×42) treo góc
 * trên phải của CẢ khung tên, số viền đen ở giữa, nảy theo bậc. Cảm ứng: chấm đỏ phẳng trên góc chân dung.
 */
function TalentBadge({ unspent, touch }: { unspent: number; touch: boolean }) {
	const label = `Còn ${unspent} điểm tiềm năng, bấm để cộng (P)`;
	return (
		<button
			type="button"
			onClick={(e) => {
				// Cả khung tên bấm được (mở bảng Nhân vật): không chặn thì cú bấm nổi lên khung và đè sang bảng khác.
				e.stopPropagation();
				togglePanel('talents');
			}}
			aria-label={label}
			title={label}
			className={
				touch
					? 'absolute -left-2 -top-2 z-[1] flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-paper-hi bg-[#b22911] px-1 text-[12px] font-extrabold leading-none text-paper-hi before:absolute before:-inset-2'
					: 'absolute -right-3 -top-3 z-[1] h-[42px] w-[45px] animate-bob before:absolute before:-inset-1'
			}
		>
			{touch ? (
				unspent
			) : (
				<>
					<img src="/assets/ui/icon_star.png" width={45} height={42} alt="" draggable={false} className="pixel-img absolute inset-0" />
					<span className="relative flex h-full items-center justify-center pt-1 font-sans text-[14px] font-extrabold leading-none text-white text-outline">{unspent}</span>
				</>
			)}
		</button>
	);
}

/**
 * Chân dung trong lòng ô đá (`iw`×`ih` = ô trừ viền 13px): phóng NGUYÊN lần điểm vẽ gốc (ảnh pipeline là gốc 32–48px
 * ×3), chọn bội gần nhất để mặt lấp gần kín ô rồi cắt phần thừa — `object-cover` cũ ra ×1,68 / ×0,75 lẻ. Tranh vẽ tay cũ
 * (`legacy`, nguyên người) neo mép trên để giữ phần đầu.
 */
function HudPortrait({ src, alt, iw, ih, legacy }: { src: string; alt: string; iw: number; ih: number; legacy: boolean }) {
	const info = usePixelBlock(src);
	if (!info) return null;
	const nw = info.w / info.block;
	const nh = info.h / info.block;
	const m = Math.max(1, Math.round(Math.min(iw / nw, ih / nh)));
	const dw = nw * m;
	const dh = nh * m;
	return (
		<img
			src={src}
			alt={alt}
			draggable={false}
			className="pixel-img absolute max-w-none"
			style={{ width: dw, height: dh, left: Math.floor((iw - dw) / 2), top: legacy ? 0 : Math.floor((ih - dh) / 2) }}
		/>
	);
}

/**
 * Khung tên (gỗ phẳng). `compact` (điện thoại dọc, khung 208px): dòng 1 dành trọn cho tên; nhãn phụ (tuổi / con đường)
 * xuống dòng dưới — để chung dòng thì tên chỉ còn ~45px. Xu + kim cương KHÔNG hiện ở đây (chủ dự án 08/10/2026: "vàng nên hiển
 * thị trong kho, không cần view ngay bên ngoài") — xem ở Kho đồ. Không có hàng nút: bấm vào khung là mở bảng Nhân vật
 * (trong đó có tab Kho đồ / Tiềm năng). Vũ khí đã bỏ khỏi đây — ảnh 49–54px thu về 20px lẻ, mà Kho đồ đã có.
 * Chân dung nằm trong ô đá: máy tính 90×88 = đúng 2 lần mảnh giữa của slot.png nên viền đá không bị co giãn lẻ.
 */
function PlayerFrame({ touch, compact, slim = false }: { touch: boolean; compact: boolean; slim?: boolean }) {
	const s = useGameStore((st) => st.stats);
	const portrait = useGameStore((st) => st.playerPortrait);
	const hud = useGameStore((st) => st.hud);
	const unspent = useGameStore((st) => st.talents.unspent);
	// Tranh cũ là ảnh nguyên người khổ lớn, phải cắt lấy đầu; ảnh mặt của pipeline thì vừa khung sẵn.
	const legacy = /\/(lior|hero-female)\.png$/.test(portrait);
	const [name, ...rest] = s.name.split(' · ');
	const sub = rest.join(' · ');
	const badgeOnFrame = unspent > 0 && !touch;
	const nameEl = (
		<span
			className={`min-w-0 truncate text-left font-display leading-[1.45] font-extrabold text-parchment transition-colors [text-shadow:0_2px_0_var(--color-outline)] group-hover/frame:text-gold-hi ${touch ? 'text-[16px]' : 'text-[18px]'}`}
		>
			{name}
		</span>
	);
	// Điện thoại xoay ngang (`slim`): khung hẹp — bỏ nhãn con đường (đã có trong bảng Nhân vật) để tên không bị cắt.
	const subEl = sub && !slim ? <span className="ui-tag min-w-0 shrink truncate bg-gold/20 leading-[1.45] text-gold-hi">{sub}</span> : null;
	const bar = touch ? 'touch' : 'main';
	return (
		// Bấm vào bất kỳ chỗ nào trên khung (chân dung, tên, thanh máu) là mở bảng Nhân vật — trong đó có tab Kho đồ / Tiềm năng.
		<div
			onClick={() => togglePanel('character')}
			title={touch ? undefined : 'Mở hành trang (C)'}
			className={`group/frame ui-plank pointer-events-auto relative flex cursor-pointer items-center ${touch ? 'w-[208px] gap-2 p-2 [@media(max-height:500px)]:w-[260px] [@media(max-height:500px)]:p-1.5' : 'w-[316px] gap-3 p-2'}`}
		>
			<div className="relative shrink-0">
				<button type="button" aria-label="Mở hành trang (C)" className={`ui-slot relative block overflow-hidden ${touch ? 'h-[62px] w-[62px] [@media(max-height:500px)]:h-[52px] [@media(max-height:500px)]:w-[52px]' : 'h-[88px] w-[90px]'}`}>
					<HudPortrait key={portrait} src={portrait} alt={s.name} iw={touch ? 36 : 64} ih={touch ? 36 : 62} legacy={legacy} />
				</button>
				<span className="ui-key pointer-events-none absolute -bottom-2 -right-2 tabular-nums">Cấp {s.level}</span>
				{unspent > 0 && touch && <TalentBadge unspent={unspent} touch />}
			</div>
			<div className="flex min-w-0 flex-1 flex-col gap-1">
				{compact ? (
					<>
						{nameEl}
						{subEl && <div className="-mt-0.5 flex min-w-0 items-center gap-1.5">{subEl}</div>}
					</>
				) : (
					<div className={`flex min-w-0 items-center gap-1.5 ${badgeOnFrame ? 'pr-6' : ''}`}>
						{nameEl}
						{subEl}
					</div>
				)}
				{hud !== 'minimal' && <Bar value={s.hp} max={s.hpMax} fill="var(--color-hp)" label={`${s.hp} / ${s.hpMax}`} size={bar} />}
				{hud !== 'minimal' && <Bar value={s.mp} max={s.mpMax} fill="var(--color-mana)" label={`${s.mp} / ${s.mpMax}`} size={bar} />}
				{hud === 'full' && <Bar value={s.stamina} max={s.staminaMax} fill="var(--color-stamina)" size="thin" />}
				<Bar value={s.exp} max={s.expNext} fill="var(--color-exp)" size="thin" />
			</div>
			{badgeOnFrame && <TalentBadge unspent={unspent} touch={false} />}
		</div>
	);
}

/**
 * Icon lịch dưới khung tên (K1): mở cửa sổ Điểm danh có khung lịch. Chấm đỏ = hôm nay (giờ Việt Nam, máy chủ tính) chưa điểm
 * danh. Icon là hình TẠM vẽ tay (`public/assets/ui/icon_calendar.png`, 20×20 ×2) — có icon PixelLab thì thay file.
 */
function CalendarButton({ touch }: { touch: boolean }) {
	const online = useSession((st) => st.online);
	const daily = useSession((st) => st.daily);
	if (!online || !daily) return null;
	const label = daily.done ? 'Điểm danh — hôm nay đã nhận' : 'Điểm danh — hôm nay chưa nhận quà';
	return (
		<button
			type="button"
			onClick={() => togglePanel('calendar')}
			aria-label={label}
			title={label}
			className={`ui-plank pointer-events-auto relative flex items-center justify-center transition-[filter] before:absolute before:-inset-1 hover:brightness-110 ${touch ? 'h-12 w-12' : 'h-[52px] w-[52px]'}`}
		>
			<img src="/assets/ui/icon_calendar.png" width={40} height={40} alt="" draggable={false} className="pixel-img max-w-none" />
			{!daily.done && <span className="absolute -right-1.5 -top-1.5 h-4 w-4 animate-bob rounded-full border-2 border-paper-hi bg-[#b22911]" />}
		</button>
	);
}

/**
 * Bình kim cương đang dùng (K1): nhãn + đồng hồ đếm lùi giờ chơi (chưa có icon PixelLab — chữ trên thẻ gỗ). Chỉ để xem — mua
 * thêm ở quầy Bram. Không có bình thì không vẽ gì.
 */
function BuffChips({ touch }: { touch: boolean }) {
	const buffs = useSession((st) => st.buffs);
	const now = useNow(1000, !!buffs?.list.length);
	const list = activeBuffs(buffs, now);
	if (!list.length) return null;
	return (
		<div className="flex max-w-[256px] flex-wrap items-center gap-1.5">
			{list.map((b) => (
				<span
					key={b.kind}
					title="Bình đang dùng — mua thêm ở quầy Bram (quảng trường Thistlewood)"
					className={`ui-plank pointer-events-auto flex h-7 items-center gap-1.5 rounded-full px-2.5 font-extrabold tabular-nums text-parchment ${touch ? 'text-chip' : 'text-note'}`}
				>
					<span className="text-sky">{buffLabel(b.kind, b.mult)}</span>
					<span>{fmtRemaining(b.remaining)}</span>
				</span>
			))}
		</div>
	);
}

/**
 * Ô nhiệm vụ dưới bản đồ nhỏ — bấm là nhân vật TỰ ĐI tới chỗ làm việc đang ghi (người giao, chỗ nhặt, hình nộm,
 * vùng quái…); bấm lại để dừng. `chip`: điện thoại ngang thấp, thu thành một dòng. Đang tự đi: viền vàng + nhãn trời.
 */
function QuestTracker({ touch, chip }: { touch: boolean; chip: boolean }) {
	const quests = useGameStore((s) => s.quests);
	const goal = useGameStore((s) => s.mapMarkers.quest);
	const walking = useGameStore((s) => !!s.autoWalk);
	const story = useGameStore((s) => !!s.dialogue || !!s.card);
	const requestAutoWalk = useGameStore((s) => s.requestAutoWalk);
	const active = quests.filter((q) => !q.done);
	if (!active.length) return null;
	const canWalk = !story && (walking || !!goal);
	const onClick = (): void => requestAutoWalk('toggle');
	const ring = walking ? 'ring-2 ring-gold' : '';
	const tag = walking ? <span className="ui-tag ml-auto shrink-0 bg-sky text-ink-brown">Đang đi…</span> : goal ? <span className="ui-tag ml-auto shrink-0 bg-gold text-ink-brown">Tự đi</span> : null;
	const title = walking ? 'Bấm lần nữa để dừng' : goal ? 'Bấm để tự đi tới chỗ làm nhiệm vụ' : undefined;
	if (chip) {
		const q = active[0]!;
		return (
			<button
				type="button"
				disabled={!canWalk}
				onClick={onClick}
				title={walking ? title : `${q.title}: ${q.objective}`}
				className={`ui-plank pointer-events-auto relative flex h-8 max-w-[200px] items-center gap-1.5 rounded-full px-3 text-note text-parchment transition-[filter] before:absolute before:-inset-x-1 before:-inset-y-1.5 enabled:hover:brightness-110 disabled:cursor-default ${ring}`}
			>
				<span className="truncate leading-[1.45]">{walking ? 'Đang đi…' : q.objective}</span>
				{goal && !walking && <span className="ui-tag shrink-0 bg-gold text-ink-brown">Tự đi</span>}
			</button>
		);
	}
	return (
		<button
			type="button"
			disabled={!canWalk}
			onClick={onClick}
			title={title}
			className={`ui-plank pointer-events-auto relative block text-left transition-[filter] enabled:hover:brightness-110 disabled:cursor-default ${touch ? 'w-[min(160px,calc(100vw-232px))] p-2' : 'w-[260px] p-2.5'} ${ring}`}
		>
			<p className="mb-1 flex items-center gap-1.5 font-display text-label font-extrabold text-gold-hi">
				Nhiệm vụ
				{tag}
			</p>
			{active.map((q) => (
				<div key={q.id} className="mb-1.5 last:mb-0">
					<p className={`font-display text-[15px] leading-[22px] font-extrabold text-parchment ${touch ? 'truncate' : ''}`}>{q.title}</p>
					<p className={`text-note text-parchment-dim ${touch ? 'line-clamp-3' : ''}`}>{q.objective}</p>
				</div>
			))}
		</button>
	);
}

/**
 * Thanh máu boss: máy tính ở giữa trên (giữa bảng tên và cột bản đồ). Điện thoại dọc: trên cụm nút (cụm cao 272px +
 * lề 12px). Điện thoại ngang thấp: dải đáy giữa cần gạt (mép phải 156px) và cụm nút 4 cột (mép trái W − 284px) →
 * tâm W/2 − 64px, rộng tối đa phần trống còn lại.
 */
function BossBar({ touch }: { touch: boolean }) {
	const boss = useGameStore((s) => s.boss);
	if (!boss) return null;
	const place = touch
		? 'left-1/2 bottom-[calc(296px+env(safe-area-inset-bottom))] w-[calc(100vw-24px)] [@media(max-height:500px)]:bottom-3 [@media(max-height:500px)]:left-[calc(50%-64px)] [@media(max-height:500px)]:w-[min(230px,calc(100vw-456px))]'
		: 'left-1/2 top-4 w-[min(560px,max(240px,calc(100vw-752px)))]';
	return (
		<div className={`pointer-events-none absolute -translate-x-1/2 text-center ${place}`}>
			<p className="ui-banner h-[57px] max-w-full px-3 text-label">
				<span className="truncate leading-[1.45]">{boss.name}</span>
			</p>
			<div className="ui-plank -mt-2 p-1">
				<Bar value={boss.hp} max={boss.hpMax} fill="var(--color-hp)" label={`${boss.hp} / ${boss.hpMax}`} />
			</div>
		</div>
	);
}

/**
 * `center`: điện thoại ngang thấp — thông báo nằm giữa trên, giữa bảng tên và bản đồ nhỏ. Bảng nhân vật cũng dùng
 * (`center`) để báo kết quả cộng / tẩy điểm, uống thuốc ngay trong bảng — toast của HUD nằm dưới lớp phủ z-15.
 * Thông báo lên cấp nằm trên dải băng rôn giấy PixelLab, còn lại là thẻ gỗ phẳng.
 */
export function Toasts({ max, center = false }: { max: number; center?: boolean }) {
	const toasts = useGameStore((s) => s.toasts).slice(-max);
	const tone = { info: 'text-parchment', exp: 'text-[#e6d4ff]', loot: 'text-gold-hi', level: '', warn: 'text-[#ffb4a3]' } as const;
	return (
		<div className={`pointer-events-none flex flex-col gap-1 ${center ? 'items-center' : 'items-end'}`}>
			{toasts.map((t) =>
				t.tone === 'level' ? (
					<div key={t.id} className={`ui-banner h-[57px] max-w-[min(360px,calc(100vw-24px))] animate-pop px-2 ${center ? 'text-label' : 'text-head'}`}>
						<span className="truncate leading-[1.45]">{t.text}</span>
					</div>
				) : (
					<div
						key={t.id}
						className={`ui-plank max-w-[min(320px,calc(100vw-24px))] animate-pop font-extrabold ${center ? 'px-2 py-1 text-center text-note' : 'px-3 py-1 text-right text-body'} ${tone[t.tone]}`}
					>
						{t.text}
					</div>
				),
			)}
		</div>
	);
}

/** Bảng Dev chỉ hiện khi URL có `?dev` (cả máy tính lẫn điện thoại) — người chơi thường không cần thấy. */
function showDev(): boolean {
	return typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('dev');
}

function DebugPanel() {
	const [open, setOpen] = useState(false);
	const { fps, zoom, direction, animation, position, entityCount, playerId, players, setZoom, setPlayer } = useGameStore();
	const chip = 'rounded-[4px] border-2 border-outline bg-bark text-parchment hover:text-gold-hi';
	return (
		<div className="pointer-events-auto absolute bottom-3 right-3 text-note">
			{open ? (
				<div className="ui-plank w-64 p-3">
					<div className="mb-2 flex items-center justify-between">
						<span className="font-display text-label font-extrabold text-gold-hi">Dev</span>
						<button type="button" onClick={() => setOpen(false)} aria-label="Đóng bảng Dev" className="font-bold text-parchment-dim hover:text-gold-hi">
							Đóng
						</button>
					</div>
					<div className="grid grid-cols-[auto_1fr] gap-x-3 tabular-nums text-parchment">
						<span className="text-parchment-dim">FPS</span>
						<span className={fps >= 55 ? 'text-emerald-300' : fps >= 30 ? 'text-amber-300' : 'text-[#ffb4a3]'}>{fps || '—'}</span>
						<span className="text-parchment-dim">Hướng</span>
						<span>
							{direction} · {animation}
						</span>
						<span className="text-parchment-dim">Vị trí</span>
						<span>
							{position.x}, {position.y}
						</span>
						<span className="text-parchment-dim">Thực thể</span>
						<span>{entityCount}</span>
					</div>
					<div className="mt-2 flex flex-wrap gap-1.5">
						{players.map((p) => (
							<button key={p.id} type="button" onClick={() => setPlayer(p.id)} className={`px-2 py-0.5 ${chip} ${p.id === playerId ? 'text-gold-hi ring-1 ring-gold' : ''}`}>
								{p.name}
							</button>
						))}
					</div>
					<div className="mt-2 flex items-center gap-2">
						<span className="text-parchment-dim">Zoom</span>
						<button type="button" onClick={() => setZoom(zoom - 1)} className={`px-2 ${chip}`}>
							−
						</button>
						<span className="tabular-nums text-parchment">{zoom}×</span>
						<button type="button" onClick={() => setZoom(zoom + 1)} className={`px-2 ${chip}`}>
							+
						</button>
						<Link href="/lab" className="ml-auto font-bold text-gold-hi hover:underline">
							Lab
						</Link>
					</div>
					<button
						type="button"
						onClick={() => {
							if (!confirm('Xoá toàn bộ tiến độ và chơi lại từ lời tựa?')) return;
							void StoryDirector.reset().then(() => location.reload());
						}}
						className="ui-chip ui-chip-danger mt-2 w-full text-note"
					>
						Xoá tiến độ, chơi lại
					</button>
				</div>
			) : (
				<button type="button" onClick={() => setOpen(true)} className="ui-btn text-note tabular-nums">
					{fps || '—'} fps
				</button>
			)}
		</div>
	);
}

/** Cờ phiên: thẻ mẹo phím chỉ hiện ở lần đầu vào chế độ chơi của mỗi phiên trình duyệt. */
const KEY_TIP_FLAG = 'aether.keytip';
const KEY_TIP_MS = 45_000;

/**
 * Thẻ mẹo phím (máy tính) thay cho 2 dòng phím thường trực: hiện 45 giây sau lần đầu vào chế độ chơi của phiên.
 * State cục bộ, không động tới store; sessionStorage có thể bị chặn (chế độ riêng tư) nên bọc try/catch.
 */
function useKeyTip(active: boolean): boolean {
	const [show, setShow] = useState(false);
	useEffect(() => {
		if (!active) return undefined;
		try {
			if (sessionStorage.getItem(KEY_TIP_FLAG)) return undefined;
			sessionStorage.setItem(KEY_TIP_FLAG, '1');
		} catch {
			// Không đọc/ghi được thì vẫn hiện một lần cho lượt mount này.
		}
		setShow(true);
		const t = setTimeout(() => setShow(false), KEY_TIP_MS);
		return () => clearTimeout(t);
	}, [active]);
	return show && active;
}

/**
 * Ghi mép dưới của hai cột HUD trên (bảng tên + chat, bản đồ nhỏ + nhiệm vụ) vào biến CSS `--hud-clear-top` của
 * trang — băng rôn tên vùng trên điện thoại dọc neo ngay dưới đó thay vì đoán theo % chiều cao (rơi đè ô nhiệm vụ).
 */
function useClearTop(cols: RefObject<HTMLDivElement | null>[], active: boolean): void {
	useEffect(() => {
		if (!active) return undefined;
		const root = document.documentElement;
		const update = (): void => {
			const bottom = Math.max(0, ...cols.map((c) => c.current?.getBoundingClientRect().bottom ?? 0));
			root.style.setProperty('--hud-clear-top', `${Math.round(bottom)}px`);
		};
		const ro = new ResizeObserver(update);
		for (const c of cols) if (c.current) ro.observe(c.current);
		window.addEventListener('resize', update);
		update();
		return () => {
			ro.disconnect();
			window.removeEventListener('resize', update);
			root.style.removeProperty('--hud-clear-top');
		};
	}, [active]);
}

export function Hud() {
	const status = useGameStore((s) => s.status);
	const error = useGameStore((s) => s.error);
	const scene = useGameStore((s) => s.scene);
	const hint = useGameStore((s) => s.interactHint);
	const dialogue = useGameStore((s) => s.dialogue);
	const card = useGameStore((s) => s.card);
	const hudLevel = useGameStore((s) => s.hud);
	const touch = useTouchDevice();
	// Điện thoại xoay ngang: chiều cao rất chật (bản đồ 81px + chip nhiệm vụ phải xong trước cụm nút ở y≈152).
	const low = useMediaQuery('(max-height: 500px)') && touch;
	const leftCol = useRef<HTMLDivElement>(null);
	const rightCol = useRef<HTMLDivElement>(null);
	useClearTop([leftCol, rightCol], scene === 'play');
	const keyTip = useKeyTip(scene === 'play' && status === 'ready' && !touch);

	return (
		<div className="pointer-events-none absolute inset-0 select-none">
			{scene === 'play' && (
				<>
					{/* Hai cột xếp chồng thay cho toạ độ cứng: trái = bảng tên (+ chat trên màn cảm ứng), phải = bản đồ nhỏ → nhiệm vụ → thông báo. */}
					<div ref={leftCol} className="absolute left-[max(12px,env(safe-area-inset-left))] top-[max(12px,env(safe-area-inset-top))] flex flex-col items-start gap-2">
						<PlayerFrame touch={touch} compact={touch && !low} slim={low} />
						<div className="flex items-center gap-2">
							<CalendarButton touch={touch} />
							<BuffChips touch={touch} />
						</div>
						{touch && <ChatBox placement="stack" />}
					</div>
					<div className="absolute right-[max(12px,env(safe-area-inset-right))] top-[max(12px,env(safe-area-inset-top))] flex flex-col items-end gap-4">
						<div ref={rightCol} className="flex flex-col items-end gap-4">
							<Minimap touch={touch} low={low} />
							<QuestTracker touch={touch} chip={low} />
						</div>
						{!low && <Toasts max={5} />}
					</div>
					{low && (
						// Từ mép phải bảng tên (300px) tới trước bản đồ nhỏ (112px), sát mép trên: hai toast cỡ chữ xs xong ở y≈56, trên chip
						// nhiệm vụ (y ≥ 101) nên khỏi phải lùi tới mép chip — 667px ngang còn rộng ~207px thay vì ~127px.
						// Băng rôn tên vùng cũng nằm dải trên này: lúc nó hiện (3 giây) toast lùi xuống dưới nó (AreaBanner đặt biến).
						<div className="absolute left-[calc(max(12px,env(safe-area-inset-left))+312px)] right-[calc(max(12px,env(safe-area-inset-right))+124px)] top-[calc(max(12px,env(safe-area-inset-top))+var(--area-banner-clear,0px))] transition-[top] duration-300">
							<Toasts max={2} center />
						</div>
					)}
					<BossBar touch={touch} />
					{!dialogue && !card && !touch && (
						// z-[11]: tooltip của thanh kỹ năng phải nổi trên khung chat (z-10) khi rê chuột ô đầu/cuối.
						// w-max: neo `left-1/2` thì khối tuyệt đối chỉ được rộng nửa màn — cửa sổ < ~1170px là thanh 9 ô gãy hai hàng.
						<div className="absolute bottom-3 left-1/2 z-[11] flex w-max -translate-x-1/2 flex-col items-center gap-2">
							{hint && (
								<p className="ui-plank flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-body font-extrabold text-parchment">
									<kbd className="ui-key h-6 min-w-6 rounded-full text-[14px]">E</kbd>
									{hint}
								</p>
							)}
							{hudLevel !== 'minimal' && <SkillBar />}
							{keyTip && <p className="ui-plank animate-pop px-3 py-1.5 text-body text-parchment">{KEY_TIP[hudLevel]}</p>}
						</div>
					)}
					{showDev() && <DebugPanel />}
				</>
			)}
			{/* Cùng vỏ với màn chờ đăng nhập (nền phố đêm + dải tên + khung gỗ) — vào game không bị nhảy sang nền xanh phẳng; z-30 của nền che luôn khung chat. */}
			{status !== 'ready' && <BootScreen text={status === 'error' ? `Ối, có lỗi: ${error}` : 'Đang chuẩn bị thế giới…'} error={status === 'error'} />}
		</div>
	);
}

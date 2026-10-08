'use client';

import { useEffect, useRef, useState } from 'react';
import { CHAT_MAX } from '@aether/protocol';
import { useGameStore } from '@/store/useGameStore';
import { useSession, type ChatLine, type PersonRef } from '@/store/useSession';
import { useMediaQuery } from './useMediaQuery';

/** Tin cũ hơn chừng này (ms) thì mờ đi ở chat thu gọn — vẫn đọc được nhưng không giành mắt với màn chơi. */
const STALE_MS = 10_000;

/** Màu tin nhắn riêng — tím hồng, tách hẳn chat map (xanh / vàng) và thông báo hệ thống (cam nhạt). */
const WHISPER = 'text-[#f2a8ff]';

/**
 * `onPerson`: bấm tên người khác (chat map hoặc tin riêng) → menu Nhắn riêng / Kết bạn / Chặn. Không truyền (chat thu gọn,
 * không bấm được) thì tên là chữ thường.
 */
function ChatLines({ lines, onPerson }: { lines: ChatLine[]; onPerson?: (p: PersonRef, at: { x: number; y: number }) => void }) {
	return lines.map((m) => {
		if (m.system)
			return (
				<p key={m.id} className="italic text-[#f3c98b]">
					{m.text}
				</p>
			);
		const color = m.whisper ? WHISPER : m.self ? 'text-[#ffd27a]' : 'text-[#9fd3ff]';
		const label = m.whisper === 'out' ? `→ ${m.name}` : m.name;
		const id = m.fromId;
		const clickable = !!onPerson && !!id && (m.whisper === 'out' || !m.self);
		return (
			<p key={m.id} className={`break-words ${m.whisper ? WHISPER : ''}`}>
				{m.whisper && <span className="mr-1 text-[11px] font-extrabold uppercase opacity-80">Riêng</span>}
				{clickable ? (
					<button
						type="button"
						// Giữ focus ở ô nhập: mất focus là ô nhập đóng (onBlur) và menu biến theo danh sách chat.
						onMouseDown={(e) => e.preventDefault()}
						onClick={(e) => onPerson({ id: id!, name: m.name }, { x: e.clientX, y: e.clientY })}
						className={`font-extrabold underline-offset-2 hover:underline ${color}`}
					>
						{label}:
					</button>
				) : (
					<span className={`font-extrabold ${color}`}>{label}:</span>
				)}{' '}
				{m.text}
			</p>
		);
	});
}

/** Menu nhỏ khi bấm tên người chơi trong chat. Trạng thái bạn bè đọc từ máy chủ (`social`) để ẩn nút thừa. */
function PersonMenu({ person, at, onClose, onWhisper }: { person: PersonRef; at: { x: number; y: number }; onClose: () => void; onWhisper: (p: PersonRef) => void }) {
	const online = useSession((s) => s.online);
	const social = useSession((s) => s.social);
	const friend = social.friends.some((f) => f.id === person.id);
	const pending = social.outgoing.some((f) => f.id === person.id) || social.incoming.some((f) => f.id === person.id);
	const blocked = social.blocked.some((f) => f.id === person.id);
	const box = useRef<HTMLDivElement>(null);
	const act = (fn: () => void) => () => {
		fn();
		onClose();
	};
	// Bấm ra ngoài menu / Esc thì đóng (capture: Esc không lọt xuống game đóng bảng khác).
	useEffect(() => {
		const down = (e: PointerEvent): void => {
			if (!box.current?.contains(e.target as Node)) onClose();
		};
		const key = (e: KeyboardEvent): void => {
			if (e.code !== 'Escape') return;
			e.stopPropagation();
			onClose();
		};
		window.addEventListener('pointerdown', down, true);
		window.addEventListener('keydown', key, true);
		return () => {
			window.removeEventListener('pointerdown', down, true);
			window.removeEventListener('keydown', key, true);
		};
	}, [onClose]);
	const btn = 'ui-chip w-full justify-start text-note';
	return (
		<div
			ref={box}
			role="menu"
			className="ui-frame fixed z-40 flex w-[168px] flex-col gap-1 p-2"
			style={{ left: Math.min(at.x, window.innerWidth - 180), top: Math.max(8, at.y - 150) }}
			onMouseDown={(e) => e.preventDefault()}
		>
			<p className="truncate px-1 font-display text-label font-extrabold text-ink-brown">{person.name}</p>
			{!blocked && (
				<button type="button" className={btn} onClick={act(() => onWhisper(person))}>
					Nhắn riêng
				</button>
			)}
			{!friend && !pending && !blocked && (
				<button type="button" className={btn} onClick={act(() => online?.friendAdd({ id: person.id }))}>
					Kết bạn
				</button>
			)}
			<button type="button" className={btn} onClick={act(() => online?.block(person.id, !blocked))}>
				{blocked ? 'Bỏ chặn' : 'Chặn'}
			</button>
			<button type="button" className={`${btn} text-ink-soft`} onClick={onClose}>
				Đóng
			</button>
		</div>
	);
}

/**
 * Khung chat chung của bản đồ. Enter mở ô nhập; lúc đang gõ thì phím không lọt vào game (chặn ở pha
 * capture trước Keyboard của game). Esc đóng ô nhập.
 *
 * `placement`:
 * - `bottom` (máy tính): góc dưới trái như cũ, nâng lên trên SkillBar.
 * - `stack` (màn cảm ứng): nằm trong cột trái DƯỚI bảng tên, xa hẳn cần gạt. Mặc định thu gọn vài dòng mới nhất,
 *   không bắt chạm; bấm "Trò chuyện" mới mở rộng + ô nhập ở TRÊN danh sách để bàn phím ảo không che.
 */
export function ChatBox({ placement = 'bottom' }: { placement?: 'bottom' | 'stack' }) {
	const chat = useSession((s) => s.chat);
	const online = useSession((s) => s.online);
	const whisperTo = useSession((s) => s.whisperTo);
	const setWhisperTo = useSession((s) => s.setWhisperTo);
	const menu = useSession((s) => s.personMenu);
	const setMenu = useSession((s) => s.setPersonMenu);
	const connected = useSession((s) => s.connected);
	// Đang thoại / xem thẻ cảnh thì Enter là "đọc tiếp", không mở chat. Bảng nhân vật / bản đồ lớn đang mở thì Enter là
	// bấm nút đang focus trong bảng — mở chat lúc đó là ô nhập nằm khuất DƯỚI lớp phủ z-15 và nút không chạy.
	const story = useGameStore((s) => !!s.dialogue || !!s.card || s.scene !== 'play' || !!s.panel || s.mapOpen);
	const low = useMediaQuery('(max-height: 500px)');
	const [typing, setTyping] = useState(false);
	const [text, setText] = useState('');
	const [now, setNow] = useState(() => Date.now());
	const input = useRef<HTMLInputElement>(null);
	const list = useRef<HTMLDivElement>(null);
	const stack = placement === 'stack';

	useEffect(() => {
		const onKey = (e: KeyboardEvent): void => {
			if (!typing && !story && e.code === 'Enter' && !(e.target instanceof HTMLInputElement)) {
				e.preventDefault();
				setTyping(true);
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [typing, story]);

	useEffect(() => {
		if (typing) input.current?.focus();
	}, [typing]);

	// Chọn người để nhắn riêng (bảng Bạn bè, menu tên) → mở ô nhập luôn.
	useEffect(() => {
		if (whisperTo) setTyping(true);
	}, [whisperTo]);

	useEffect(() => {
		list.current?.scrollTo({ top: list.current.scrollHeight });
	}, [chat, typing]);

	// Chat thu gọn: nhịp 1 giây để tin vừa quá 10 giây kịp mờ đi.
	const collapsed = stack && !typing;
	useEffect(() => {
		if (!collapsed) return undefined;
		const t = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(t);
	}, [collapsed]);

	if (!online) return null;
	const system = (msg: string) => useSession.getState().pushChat({ name: '', text: msg, self: false, system: true });
	/**
	 * `/w <tên> <nội dung>` nhắn riêng (tên có khoảng trắng — máy chủ tự tách), `/r <nội dung>` trả lời người vừa nhắn mình;
	 * đang chọn người nhắn riêng (chip "→ Tên") thì mọi dòng gửi riêng cho người đó, ô nhập vẫn mở để nhắn tiếp.
	 */
	const send = (): void => {
		const t = text.trim();
		setText('');
		const cmd = /^\/(w|r)(?:\s+([\s\S]*))?$/i.exec(t);
		if (cmd) {
			const rest = (cmd[2] ?? '').trim();
			if (cmd[1]!.toLowerCase() === 'w') {
				if (rest) online.whisper({ line: rest });
				else system('Cách nhắn riêng: /w <tên nhân vật> <nội dung>');
			} else {
				const last = useSession.getState().lastWhisper;
				if (!last) system('Chưa có ai nhắn riêng cho bạn.');
				else if (rest) online.whisper({ to: last.id, text: rest });
				else setWhisperTo(last);
			}
		} else if (t && whisperTo) online.whisper({ to: whisperTo.id, text: t });
		else if (t) online.chat(t);
		if (!whisperTo || cmd) setTyping(false);
	};
	const stopTyping = (): void => {
		setTyping(false);
		setWhisperTo(null);
	};
	const pickPerson = (person: PersonRef, at: { x: number; y: number }): void => setMenu({ person, at });

	const field = typing ? (
		<input
			ref={input}
			value={text}
			maxLength={CHAT_MAX}
			onChange={(e) => setText(e.target.value)}
			onKeyDownCapture={(e) => {
				e.stopPropagation();
				if (e.key === 'Enter') send();
				if (e.key === 'Escape') stopTyping();
			}}
			onBlur={() => setTyping(false)}
			placeholder={whisperTo ? `Nhắn riêng cho ${whisperTo.name}…` : 'Viết gì đó rồi nhấn Enter… (/w tên để nhắn riêng)'}
			className="min-w-0 flex-1 rounded-[6px] border-2 border-paper-line bg-paper-hi px-2 py-1 text-body text-ink-brown outline-none placeholder:text-ink-faint focus:border-amber"
		/>
	) : null;
	const target = typing && whisperTo && (
		<button
			type="button"
			title="Thôi nhắn riêng"
			onMouseDown={(e) => e.preventDefault()}
			onClick={() => setWhisperTo(null)}
			className={`max-w-[40%] shrink-0 truncate rounded-[6px] bg-[#3b1f45] px-1.5 py-0.5 text-note font-extrabold ${WHISPER}`}
		>
			→ {whisperTo.name} ✕
		</button>
	);
	const menuEl = menu && <PersonMenu person={menu.person} at={menu.at} onClose={() => setMenu(null)} onWhisper={(p) => setWhisperTo(p)} />;
	const dot = <span className={`h-2 w-2 shrink-0 rounded-full ring-2 ring-paper-hi ${connected ? 'bg-leaf' : 'bg-berry'}`} title={connected ? 'Đang online' : 'Mất kết nối'} />;
	const empty = chat.length === 0 && <p className="text-parchment-dim">{connected ? 'Bạn đã tới Thistlewood.' : 'Đang tìm đường tới máy chủ…'}</p>;

	if (stack) {
		const recent = chat.slice(-(low ? 2 : 3));
		return (
			<div className={`relative z-10 text-[13px] leading-[20px] font-semibold ${low ? 'w-[300px]' : 'w-[208px]'}`}>
				<div className="pointer-events-auto flex items-center gap-1.5">
					{dot}
					{target}
					{field ?? (
						// Chip giấy 28px nhưng vùng chạm ~44px: giả-phần-tử nới lên 8px (vừa khe với bảng tên) và xuống 10px.
						<button type="button" onClick={() => setTyping(true)} className="ui-chip relative min-h-7 px-2 text-note before:absolute before:-inset-x-2 before:-top-2 before:-bottom-2.5">
							Trò chuyện
						</button>
					)}
				</div>
				{typing ? (
					<div ref={list} className="ui-dark pointer-events-auto mt-1 max-h-[128px] overflow-y-auto px-2 py-1 [scrollbar-width:thin] [@media(max-height:500px)]:max-h-[calc(100dvh-152px-164px)]">
						{empty}
						<ChatLines lines={chat} onPerson={pickPerson} />
					</div>
				) : (
					(recent.length > 0 || empty) && (
						// Không viền: max-h tính đúng 2–3 dòng 20px + py-0.5, thêm viền là dòng cuối bị xén.
						<div className={`ui-dark pointer-events-none mt-1 overflow-hidden px-2 py-0.5 ${low ? 'max-h-[44px]' : 'max-h-[64px]'}`}>
							{empty}
							{recent.map((m) => (
								<div key={m.id} className={`line-clamp-1 transition-opacity duration-700 ${now - m.at > STALE_MS ? 'opacity-40' : ''}`}>
									<ChatLines lines={[m]} />
								</div>
							))}
						</div>
					)
				)}
				{menuEl}
			</div>
		);
	}

	return (
		// Không chạm SkillBar ở giữa đáy (rộng tới 600px): mép phải chat = lề 12px + bề ngang, phải cách mép trái
		// SkillBar (W/2 − 300px) thêm 12px → bề ngang W/2 − 324px. Chạm sàn 240px (cửa sổ < 1128px) thì nâng lên trên cột
		// giữa: đáy 12 + khay kỹ năng 93 + khe 8 + thẻ mẹo 45 giây đầu ~35 ≈ 148 → 160px.
		// Cột giữa của Hud là `w-max` nên thanh kỹ năng luôn một hàng ở mọi cửa sổ ≥ 624px — không cần bậc nâng thứ hai.
		// Nền tối trong mờ (.ui-dark) chứ không dùng giấy sáng: khung chat ở đây suốt lúc chơi, che game càng ít càng tốt.
		<div className="pointer-events-auto absolute bottom-[132px] left-3 z-10 w-[min(80vw,360px,max(240px,calc(50vw-414px)))] max-[1128px]:bottom-[160px]">
			<div ref={list} className="ui-dark max-h-[176px] overflow-y-auto px-2 py-1 text-body font-semibold [scrollbar-width:thin]">
				{chat.length === 0 && <p className="text-parchment-dim">{connected ? 'Bạn đã tới Thistlewood. Nhấn Enter để chào mọi người.' : 'Đang tìm đường tới máy chủ…'}</p>}
				<ChatLines lines={chat} onPerson={pickPerson} />
			</div>
			<div className="mt-1 flex items-center gap-1.5">
				{dot}
				{target}
				{field ?? (
					<button type="button" onClick={() => setTyping(true)} className="ui-chip min-h-8 text-note">
						Nhắn tin (Enter)
					</button>
				)}
				{/* Đổi nhân vật / đăng xuất chỉ nằm trong Cài đặt; đang gõ thì nhường chỗ cho ô nhập (có chip "→ Tên" là chật). */}
				{!typing && (
					<>
						<button type="button" onClick={() => useGameStore.getState().setPanel('codex')} className="ui-chip ml-auto min-h-8 shrink-0 text-note" title="Sổ quái, boss, nhân vật và nơi gặp">
							Thư viện (B)
						</button>
						<button type="button" onClick={() => useGameStore.getState().setPanel('settings')} className="ui-chip min-h-8 shrink-0 text-note" title="Âm thanh, hiển thị, đổi nhân vật, đăng xuất">
							Cài đặt (O)
						</button>
					</>
				)}
			</div>
			{menuEl}
		</div>
	);
}

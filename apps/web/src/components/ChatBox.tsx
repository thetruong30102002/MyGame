'use client';

import { useEffect, useRef, useState } from 'react';
import { CHAT_MAX, WORLD_CHAT_DIAMONDS, WORLD_CHAT_GAP_MS } from '@aether/protocol';
import { useGameStore } from '@/store/useGameStore';
import { useSession, type ChatLine, type PersonRef } from '@/store/useSession';
import { CHAT_TABS, inConversation, inTab, routeLine, unread, unreadFrom, whisperPartners, type ChatTab, type WhisperPartner } from './chatTabs';
import { useMediaQuery } from './useMediaQuery';

/** Tin cũ hơn chừng này (ms) thì mờ đi ở chat thu gọn — vẫn đọc được nhưng không giành mắt với màn chơi. */
const STALE_MS = 10_000;

/** Màu tin nhắn riêng — tím hồng, tách hẳn chat map (xanh / vàng) và thông báo hệ thống (cam nhạt). */
const WHISPER = 'text-[#f2a8ff]';
/** Nhãn kênh Thế giới — xanh lá, để biết tin này cả server cùng đọc. */
const WORLD = 'text-[#8fe39a]';

/** Chữ khi thẻ đang xem chưa có tin nào. */
const EMPTY_TAB: Record<Exclude<ChatTab, 'all'>, string> = {
	map: 'Chưa có ai nói gì ở map này.',
	world: `Kênh Thế giới: mọi người đang online đều đọc được — ${WORLD_CHAT_DIAMONDS} kim cương mỗi tin, mỗi ${WORLD_CHAT_GAP_MS / 1000} giây một tin.`,
	whisper: 'Chưa có tin riêng. Gõ /w <tên> <nội dung>, hoặc bấm tên người chơi → Nhắn riêng.',
};

/** Chữ gợi ý trong ô nhập theo thẻ. */
const PLACEHOLDER: Record<ChatTab, string> = {
	all: 'Chat map, Enter để gửi… (/g Thế giới · /w tên nhắn riêng)',
	map: 'Chat với người cùng map…',
	world: `Chat kênh Thế giới (${WORLD_CHAT_DIAMONDS} kim cương / tin)…`,
	whisper: '/w <tên> <nội dung> · /r trả lời',
};

/**
 * Thẻ Riêng: tab theo TỪNG NGƯỜI đã nhắn / được nhắn (mới nhất trước) + "Tất cả tin riêng". Chọn người = chỉ xem cuộc trò chuyện
 * với họ và gõ là nhắn cho họ (chính là `whisperTo`). Số đỏ = tin của người đó chưa đọc. Dải vuốt ngang khi đông người.
 */
function PeopleRow({ people, active, counts, onPick }: { people: WhisperPartner[]; active: string | null; counts: Record<string, number>; onPick: (p: WhisperPartner | null) => void }) {
	const chip = (on: boolean) => `relative shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-chip font-extrabold ${on ? 'bg-[#3b1f45] text-[#f2a8ff] ring-1 ring-[#f2a8ff]' : 'bg-[#1a110a]/60 text-parchment-dim hover:text-parchment'}`;
	return (
		<div role="tablist" aria-label="Tin riêng theo người" className="pointer-events-auto mb-1 flex gap-1.5 overflow-x-auto pt-2 pr-2 [scrollbar-width:none]">
			<button type="button" role="tab" aria-selected={!active} onMouseDown={(e) => e.preventDefault()} onClick={() => onPick(null)} className={chip(!active)}>
				Tất cả tin riêng
			</button>
			{people.map((p) => {
				const on = p.id === active;
				const n = on ? 0 : (counts[p.id] ?? 0);
				return (
					<button key={p.id} type="button" role="tab" aria-selected={on} title={`Nhắn riêng với ${p.name}`} onMouseDown={(e) => e.preventDefault()} onClick={() => onPick(p)} className={chip(on)}>
						<span className="block max-w-[110px] truncate">{p.name}</span>
						{n > 0 && (
							<span className="absolute -right-1.5 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#b22911] px-1 text-[10px] leading-none text-paper-hi" aria-label={`${n} tin chưa đọc`}>
								{n > 99 ? '99+' : n}
							</span>
						)}
					</button>
				);
			})}
		</div>
	);
}

/**
 * Hàng thẻ kênh: số đỏ = tin của người khác chưa đọc ở thẻ đó. `onMouseDown` chặn mất focus — đang gõ mà bấm đổi thẻ thì ô nhập
 * không đóng.
 */
function TabRow({ tab, counts, onTab, small }: { tab: ChatTab; counts: Record<ChatTab, number>; onTab: (t: ChatTab) => void; small: boolean }) {
	return (
		<div role="tablist" aria-label="Kênh chat" className="pointer-events-auto mb-1 flex gap-1">
			{CHAT_TABS.map((t) => {
				const on = t.id === tab;
				const n = on ? 0 : counts[t.id];
				return (
					<button
						key={t.id}
						type="button"
						role="tab"
						aria-selected={on}
						onMouseDown={(e) => e.preventDefault()}
						onClick={() => onTab(t.id)}
						className={`relative whitespace-nowrap rounded-[5px] py-0.5 font-extrabold transition-colors ${small ? 'px-1.5 text-chip' : 'px-2 text-note'} ${on ? 'bg-paper-hi text-ink-brown' : 'bg-[#1a110a]/60 text-parchment-dim hover:text-parchment'}`}
					>
						{t.label}
						{n > 0 && (
							<span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#b22911] px-1 text-[10px] leading-none text-paper-hi" aria-label={`${n} tin chưa đọc`}>
								{n > 99 ? '99+' : n}
							</span>
						)}
					</button>
				);
			})}
		</div>
	);
}

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
				{m.ch === 'world' && <span className={`mr-1 text-[11px] font-extrabold uppercase ${WORLD}`}>Thế giới</span>}
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
	const diamonds = useSession((s) => s.diamonds);
	// Thẻ kênh đang xem + mốc đã đọc (id dòng chat cuối) của từng thẻ — đếm số tin chưa đọc.
	const [tab, setTab] = useState<ChatTab>('all');
	const [seen, setSeen] = useState<Record<ChatTab, number>>({ all: 0, map: 0, world: 0, whisper: 0 });
	/** Mốc đã đọc của từng cuộc trò chuyện riêng (id người → id dòng). */
	const [seenPeople, setSeenPeople] = useState<Record<string, number>>({});
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

	// Chọn người để nhắn riêng (bảng Bạn bè, menu tên) → mở ô nhập luôn, sang thẻ Riêng.
	useEffect(() => {
		if (!whisperTo) return;
		setTyping(true);
		setTab((t) => (t === 'all' ? t : 'whisper'));
	}, [whisperTo]);

	// Thẻ đang xem coi như đã đọc hết.
	const lastId = chat.at(-1)?.id ?? 0;
	useEffect(() => {
		setSeen((s) => (s[tab] === lastId ? s : { ...s, [tab]: lastId }));
	}, [tab, lastId]);
	// Đang xem cuộc trò chuyện với một người (thẻ Riêng + đã chọn người) → tin của người đó coi như đã đọc.
	const talkingTo = tab === 'whisper' ? (whisperTo?.id ?? null) : null;
	useEffect(() => {
		if (!talkingTo) return;
		setSeenPeople((s) => (s[talkingTo] === lastId ? s : { ...s, [talkingTo]: lastId }));
	}, [talkingTo, lastId]);

	useEffect(() => {
		list.current?.scrollTo({ top: list.current.scrollHeight });
	}, [chat, typing, tab]);

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
		else if (t) {
			const r = routeLine(t, tab);
			if ('hint' in r) system(r.hint);
			else if (r.ch === 'world' && diamonds !== null && diamonds < WORLD_CHAT_DIAMONDS) system(`Chat kênh Thế giới tốn ${WORLD_CHAT_DIAMONDS} kim cương mỗi tin — bạn đang có ${diamonds}.`);
			else online.chat(r.text, r.ch);
		}
		if (!whisperTo || cmd) setTyping(false);
	};
	/** Đổi thẻ: sang Map / Thế giới thì thôi nhắn riêng (dòng gõ tiếp theo đi đúng kênh của thẻ). */
	const pickTab = (t: ChatTab): void => {
		setTab(t);
		if (t === 'map' || t === 'world') setWhisperTo(null);
	};
	const shown = talkingTo ? chat.filter((m) => inConversation(m, talkingTo)) : chat.filter((m) => inTab(m, tab));
	// Người đang được chọn nhắn mà chưa có tin nào (vừa bấm "Nhắn riêng") vẫn có tab của mình.
	const people = whisperPartners(chat);
	if (whisperTo && !people.some((p) => p.id === whisperTo.id)) people.unshift({ ...whisperTo, last: Infinity });
	const peopleCounts = Object.fromEntries(people.map((p) => [p.id, unreadFrom(chat, p.id, seenPeople[p.id] ?? 0)]));
	const peopleRow = tab === 'whisper' && people.length > 0 && (
		<PeopleRow people={people} active={talkingTo} counts={peopleCounts} onPick={(p) => setWhisperTo(p ? { id: p.id, name: p.name } : null)} />
	);
	const counts = Object.fromEntries(CHAT_TABS.map((x) => [x.id, unread(chat, x.id, seen[x.id])])) as Record<ChatTab, number>;
	// Cột trái cảm ứng chỉ rộng 208px: thẻ nhỏ hơn cho đủ một hàng.
	const tabs = <TabRow tab={tab} counts={counts} onTab={pickTab} small={stack && !low} />;
	const emptyTab =
		tab !== 'all' && chat.length > 0 && !shown.some((m) => !m.system) && <p className="text-parchment-dim">{talkingTo ? `Chưa có tin với ${whisperTo?.name}. Gõ để nhắn riêng.` : EMPTY_TAB[tab]}</p>;
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
			placeholder={whisperTo ? `Nhắn riêng cho ${whisperTo.name}…` : PLACEHOLDER[tab]}
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
					<div className="mt-1">
						{tabs}
						{peopleRow}
						<div ref={list} className="ui-dark pointer-events-auto max-h-[128px] overflow-y-auto px-2 py-1 [scrollbar-width:thin] [@media(max-height:500px)]:max-h-[calc(100dvh-152px-164px-28px)]">
							{empty}
							{emptyTab}
							<ChatLines lines={shown} onPerson={pickPerson} />
						</div>
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
			{tabs}
			{peopleRow}
			<div ref={list} className="ui-dark max-h-[176px] overflow-y-auto px-2 py-1 text-body font-semibold [scrollbar-width:thin]">
				{chat.length === 0 && <p className="text-parchment-dim">{connected ? 'Bạn đã tới Thistlewood. Nhấn Enter để chào mọi người.' : 'Đang tìm đường tới máy chủ…'}</p>}
				{emptyTab}
				<ChatLines lines={shown} onPerson={pickPerson} />
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

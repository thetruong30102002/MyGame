'use client';

import { useState } from 'react';
import { MAX_FRIENDS, NAME_MAX, type SocialPerson } from '@aether/protocol';
import { useGameStore } from '@/store/useGameStore';
import { useSession } from '@/store/useSession';

/**
 * Thẻ Bạn bè (phím F) — docs/ke-hoach-xa-hoi.md X1. Mọi thao tác gửi ý định lên máy chủ; danh sách hiện theo trạng thái máy
 * chủ đẩy về (`useSession.social`), không tự sửa tại chỗ. Huỷ bạn / chặn hỏi lại một lần (bấm hai lần) cho khỏi lỡ tay.
 */
export function CharacterFriendsTab() {
	const online = useSession((s) => s.online);
	const social = useSession((s) => s.social);
	const connected = useSession((s) => s.connected);
	const mapNames = useGameStore((s) => s.mapNames);
	const setPanel = useGameStore((s) => s.setPanel);
	const [name, setName] = useState('');
	const [confirm, setConfirm] = useState<string | null>(null);

	if (!online) return <p className="text-body text-ink-soft">Bạn bè chỉ có khi chơi trực tuyến.</p>;

	const invite = (): void => {
		const n = name.trim();
		if (!n) return;
		online.friendAdd({ name: n });
		setName('');
	};
	const whisper = (p: SocialPerson): void => {
		setPanel(null);
		useSession.getState().setWhisperTo({ id: p.id, name: p.name });
	};
	/** Bấm lần đầu đổi nút thành "Chắc chưa?", bấm lần hai mới làm. */
	const twice = (key: string, run: () => void) => () => {
		if (confirm === key) {
			run();
			setConfirm(null);
		} else setConfirm(key);
	};
	const friends = [...social.friends].sort((a, b) => Number(b.online) - Number(a.online) || a.name.localeCompare(b.name, 'vi'));
	const onlineCount = friends.filter((f) => f.online).length;

	return (
		<div className="flex flex-col gap-4 text-body text-ink-brown">
			<form
				className="flex flex-wrap items-center gap-2"
				onSubmit={(e) => {
					e.preventDefault();
					invite();
				}}
			>
				<input
					value={name}
					maxLength={NAME_MAX}
					onChange={(e) => setName(e.target.value)}
					onKeyDownCapture={(e) => e.stopPropagation()}
					placeholder="Tên nhân vật muốn kết bạn"
					className="min-w-0 flex-1 rounded-[6px] border-2 border-paper-line bg-paper-hi px-2 py-1 outline-none placeholder:text-ink-faint focus:border-amber"
				/>
				<button type="submit" className="ui-chip" disabled={!name.trim() || !connected}>
					Mời kết bạn
				</button>
			</form>

			{social.incoming.length > 0 && (
				<Section title={`Lời mời kết bạn (${social.incoming.length})`}>
					{social.incoming.map((p) => (
						<Row key={p.id} p={p}>
							<button type="button" className="ui-chip" onClick={() => online.friendRespond(p.id, true)}>
								Đồng ý
							</button>
							<button type="button" className="ui-chip text-ink-soft" onClick={() => online.friendRespond(p.id, false)}>
								Từ chối
							</button>
						</Row>
					))}
				</Section>
			)}

			<Section title={`Bạn bè · ${onlineCount}/${friends.length} online (tối đa ${MAX_FRIENDS})`}>
				{friends.length === 0 && <p className="text-note text-ink-soft">Chưa có bạn nào. Mời theo tên ở trên, hoặc bấm tên người chơi trong khung chat.</p>}
				{friends.map((p) => (
					<Row key={p.id} p={p} where={p.online && p.map ? (mapNames[p.map] ?? p.map) : undefined}>
						<button type="button" className="ui-chip" onClick={() => whisper(p)}>
							Nhắn
						</button>
						<button type="button" className="ui-chip text-ink-soft" onClick={twice(`rm:${p.id}`, () => online.friendRemove(p.id))}>
							{confirm === `rm:${p.id}` ? 'Chắc huỷ?' : 'Huỷ bạn'}
						</button>
						<button type="button" className="ui-chip text-ink-soft" onClick={twice(`bl:${p.id}`, () => online.block(p.id, true))}>
							{confirm === `bl:${p.id}` ? 'Chắc chặn?' : 'Chặn'}
						</button>
					</Row>
				))}
			</Section>

			{social.outgoing.length > 0 && (
				<Section title="Đã mời, chờ trả lời">
					{social.outgoing.map((p) => (
						<Row key={p.id} p={p}>
							<button type="button" className="ui-chip text-ink-soft" onClick={() => online.friendRemove(p.id)}>
								Rút lời mời
							</button>
						</Row>
					))}
				</Section>
			)}

			{social.blocked.length > 0 && (
				<Section title="Đã chặn">
					<p className="text-note text-ink-soft">Người bị chặn không mời kết bạn, không nhắn riêng được cho bạn, và không biết mình bị chặn.</p>
					{social.blocked.map((p) => (
						<Row key={p.id} p={p} hideStatus>
							<button type="button" className="ui-chip" onClick={() => online.block(p.id, false)}>
								Bỏ chặn
							</button>
						</Row>
					))}
				</Section>
			)}
		</div>
	);
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<section className="flex flex-col gap-1.5">
			<h3 className="font-display text-label font-extrabold">{title}</h3>
			{children}
		</section>
	);
}

/** Một người: chấm online, tên, cấp, nơi đang đứng (chỉ bạn bè) + nút thao tác bên phải. */
function Row({ p, where, hideStatus, children }: { p: SocialPerson; where?: string; hideStatus?: boolean; children: React.ReactNode }) {
	return (
		<div className="ui-tray flex flex-wrap items-center gap-2 px-2.5 py-1.5">
			{!hideStatus && <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${p.online ? 'bg-leaf' : 'bg-ink-faint'}`} title={p.online ? 'Đang online' : 'Offline'} />}
			<span className="min-w-0 font-extrabold">{p.name}</span>
			<span className="text-note text-ink-soft tabular-nums">Lv {p.level}</span>
			{where && <span className="text-note text-ink-soft">· {where}</span>}
			<span className="ml-auto flex flex-wrap gap-1.5">{children}</span>
		</div>
	);
}

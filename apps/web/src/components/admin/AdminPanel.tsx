'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { validateUsername } from '@aether/protocol';
import { adminApi, ApiError } from '@/net/api';
import { useSession } from '@/store/useSession';
import { Alert, Backdrop, Field, TitleBanner } from '../AuthScreen';
import { BootScreen } from '../BootScreen';
import { AdminConsole } from './AdminConsole';

type Me = { state: 'idle' | 'loading' } | { state: 'ok'; admin: boolean; username: string } | { state: 'error'; message: string };

/**
 * Trang quản trị (/admin — chủ dự án 10/10/2026: "thêm 1 trang admin để cộng tiền, điểm cho nhân vật"). Dùng CHUNG phiên đăng nhập
 * của game (`useSession`: token ở localStorage, `NEXT_PUBLIC_SERVER_URL` — bản Funnel là `/game`): đã vào game thì mở là dùng được,
 * chưa thì đăng nhập ngay tại đây. Máy chủ quyết quyền (bảng `admins`) — không có quyền thì chỉ báo, không lộ gì. Không có lối vào từ
 * menu game: chỉ vào bằng đường dẫn.
 */
export function AdminPanel() {
	const token = useSession((s) => s.token);
	const screen = useSession((s) => s.screen);
	const [me, setMe] = useState<Me>({ state: 'idle' });
	const [retry, setRetry] = useState(0);

	useEffect(() => {
		void useSession.getState().boot();
	}, []);

	useEffect(() => {
		if (!token) return setMe({ state: 'idle' });
		let live = true;
		setMe({ state: 'loading' });
		adminApi.me(token).then(
			(r) => live && setMe({ state: 'ok', admin: r.admin, username: r.username }),
			(e: unknown) => {
				if (!live) return;
				// Phiên hết hạn: về ô đăng nhập (đăng xuất xoá token cũ — cùng chỗ lưu với game).
				if (e instanceof ApiError && e.status === 401) void useSession.getState().logout();
				else setMe({ state: 'error', message: e instanceof Error ? e.message : String(e) });
			},
		);
		return () => {
			live = false;
		};
	}, [token, retry]);

	if (screen === 'boot') return <BootScreen text="Đang kiểm tra phiên đăng nhập…" />;
	if (!token) return <AdminLogin />;
	if (me.state === 'error')
		return (
			<Gate>
				<Alert>{me.message}</Alert>
				<button type="button" onClick={() => setRetry((n) => n + 1)} className="ui-btn w-full text-[16px]">
					Thử lại
				</button>
			</Gate>
		);
	if (me.state !== 'ok') return <BootScreen text="Đang kiểm tra quyền quản trị…" />;
	if (!me.admin) return <NoPermission username={me.username} />;
	return <AdminConsole token={token} username={me.username} />;
}

/** Khung chung của các màn nhỏ (đăng nhập, không có quyền, lỗi): dải "Quản trị" + giấy, căn giữa trên nền phố đêm như màn vào game. */
function Gate({ children }: { children: React.ReactNode }) {
	return (
		<Backdrop>
			<div className="flex w-full max-w-sm flex-col items-center">
				<TitleBanner size="md" text="Quản trị" />
				<div className="ui-frame w-full px-4 pb-4 pt-8 sm:px-5">{children}</div>
			</div>
		</Backdrop>
	);
}

/** Chưa đăng nhập: ô đăng nhập bằng tài khoản game (cùng phiên — đăng nhập ở đây thì vào game cũng không phải đăng nhập lại). */
function AdminLogin() {
	const login = useSession((s) => s.login);
	const busy = useSession((s) => s.busy);
	const serverError = useSession((s) => s.error);
	const lastUsername = useSession((s) => s.username);
	const [username, setUsername] = useState(lastUsername);
	const [password, setPassword] = useState('');
	const [localError, setLocalError] = useState<string | null>(null);

	const submit = (e: React.FormEvent): void => {
		e.preventDefault();
		if (busy) return;
		const u = username.trim().toLowerCase();
		const err = validateUsername(u) ?? (password ? null : 'Bạn chưa gõ mật khẩu');
		setLocalError(err);
		if (!err) void login(u, password, false);
	};

	return (
		<Gate>
			<form onSubmit={submit} noValidate aria-busy={busy}>
				<p className="mb-3 text-body leading-relaxed text-ink-soft">Đăng nhập bằng tài khoản game. Chỉ tài khoản được cấp quyền quản trị mới dùng được trang này.</p>
				<Field label="Tên đăng nhập" name="username" value={username} onChange={setUsername} autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="next" />
				<Field label="Mật khẩu" name="password" type="password" value={password} onChange={setPassword} autoComplete="current-password" autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="go" />
				{(localError ?? serverError) && <Alert>{localError ?? serverError}</Alert>}
				<button type="submit" disabled={busy} className="ui-btn mt-1 w-full text-[16px]">
					{busy ? 'Đang đăng nhập…' : 'Đăng nhập'}
				</button>
				<Link href="/" className="mt-3 block text-center text-body font-bold text-amber underline underline-offset-2 hover:text-ink-brown">
					Về trang game
				</Link>
			</form>
		</Gate>
	);
}

function NoPermission({ username }: { username: string }) {
	const logout = useSession((s) => s.logout);
	return (
		<Gate>
			<p role="alert" className="mb-2 text-center font-display text-head font-extrabold text-berry">
				Tài khoản này không có quyền quản trị
			</p>
			<p className="mb-4 text-center text-body text-ink-soft">
				Đang đăng nhập: <b className="text-ink-brown">{username}</b>. Quyền quản trị do chủ máy chủ cấp.
			</p>
			<div className="flex gap-2">
				<button type="button" onClick={() => void logout()} className="ui-chip min-h-[39px] flex-1">
					Đổi tài khoản
				</button>
				<Link href="/" className="ui-btn flex-1 text-[16px]">
					Về game
				</Link>
			</div>
		</Gate>
	);
}

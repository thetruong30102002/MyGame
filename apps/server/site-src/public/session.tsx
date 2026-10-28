import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode, type FormEvent } from 'react';
import { ApiContext, cacheFor, json, type Api } from '../admin/api';
import { siteBase } from './router';
export interface Me {
    username: string;
    admin: boolean;
    characters: {
        id: string;
        name: string;
        level: number;
    }[];
}
const Session = createContext<{
    me?: Me;
    token: string;
    checking: boolean;
    need: (fn?: () => void) => void;
    logout: () => void;
}>(null!);
export const useSession = () => useContext(Session);
export function SessionProvider({ children }: {
    children: ReactNode;
}) {
    const [token, setToken] = useState(() => localStorage.getItem('aether.web.token') || ''), [me, setMe] = useState<Me>(), [checking, setChecking] = useState(!!token), [open, setOpen] = useState(false), [register, setRegister] = useState(false), [error, setError] = useState(''), [busy, setBusy] = useState(false), dialog = useRef<HTMLDialogElement>(null), after = useRef<(() => void) | undefined>(undefined);
    const api = useCallback<Api>(async (path, init = {}) => { const r = await fetch(siteBase + path, { ...init, headers: { ...init.headers, ...(token ? { Authorization: 'Bearer ' + token } : {}) } }); const data = await r.json(); if (!r.ok) {
        if (r.status === 401 && token) {
            localStorage.removeItem('aether.web.token');
            window.dispatchEvent(new Event('aether:session'));
        }
        throw Object.assign(Error(data.error || 'Không thực hiện được yêu cầu'), { status: r.status });
    } return data; }, [token]);
    useEffect(() => { const sync = () => { setToken(localStorage.getItem('aether.web.token') || ''); setMe(undefined); }; window.addEventListener('aether:session', sync); window.addEventListener('storage', sync); return () => { window.removeEventListener('aether:session', sync); window.removeEventListener('storage', sync); }; }, []);
    useEffect(() => { let active = true; setChecking(!!token); if (token)
        cacheFor(api).load<Me>('api/me').then(v => { if (active)
            setMe(v); }).catch(() => { }).finally(() => { if (active)
            setChecking(false); });
    else
        setMe(undefined); return () => { active = false; cacheFor(api).clear(); }; }, [token, api]);
    useEffect(() => { if (open)
        dialog.current?.showModal();
    else
        dialog.current?.close(); }, [open]);
    const need = (fn?: () => void) => { if (me) {
        fn?.();
        return;
    } after.current = fn; setError(''); setOpen(true); };
    const logout = () => { void api('api/logout', { method: 'POST' }).catch(() => { }); cacheFor(api).clear(); localStorage.removeItem('aether.web.token'); window.dispatchEvent(new Event('aether:session')); };
    async function submit(e: FormEvent<HTMLFormElement>) { e.preventDefault(); const f = new FormData(e.currentTarget); if (register && f.get('password') !== f.get('confirm')) {
        setError('Mật khẩu nhập lại chưa khớp');
        return;
    } setBusy(true); setError(''); try {
        const r = await fetch(siteBase + 'api/' + (register ? 'register' : 'login'), json('POST', { username: f.get('username'), password: f.get('password') })), d = await r.json();
        if (!r.ok)
            throw Error(d.error || 'Không đăng nhập được');
        localStorage.setItem('aether.web.token', d.token);
        window.dispatchEvent(new Event('aether:session'));
        setOpen(false);
        after.current?.();
        after.current = undefined;
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        setBusy(false);
    } }
    return <ApiContext value={api}><Session value={{ me, token, checking, need, logout }}>{children}<dialog ref={dialog} className="web-dialog" aria-label={register ? 'Tạo tài khoản' : 'Đăng nhập'} onCancel={() => setOpen(false)}><button className="web-close" aria-label="Đóng" onClick={() => setOpen(false)}>×</button><p className="portal-eyebrow">AETHER CHRONICLE</p><h2>{register ? 'Tạo tài khoản' : 'Đăng nhập'}</h2><p>Dùng chung tài khoản với game và trang quản trị.</p><form onSubmit={submit}><label>Tên đăng nhập<input name="username" autoComplete="username" required maxLength={20} autoCapitalize="none"/></label><label>Mật khẩu<input type="password" name="password" autoComplete={register ? 'new-password' : 'current-password'} required maxLength={72}/></label>{register && <label>Nhập lại mật khẩu<input name="confirm" type="password" autoComplete="new-password" required maxLength={72}/></label>}{error && <p className="web-error" role="alert">{error}</p>}<button className="btn btn-primary" disabled={busy}>{busy ? 'Đang xử lý…' : register ? 'Tạo tài khoản' : 'Đăng nhập'}</button><button type="button" className="btn btn-ghost" onClick={() => { setRegister(!register); setError(''); }}>{register ? 'Đã có tài khoản' : 'Tạo tài khoản mới'}</button></form></dialog></Session></ApiContext>;
}

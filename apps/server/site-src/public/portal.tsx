import { useCallback, useEffect, useMemo, useState, useRef, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { cacheFor, useApi } from '../admin/api';
import { Router, useRouter, parseRoute, siteBase, type Route } from './router';
import { SessionProvider, useSession } from './session';
import { Home, World, NewsPage, Forum, PostPage, FeedbackPage, Downloads } from './pages';
import icons from './icons.json';
import './redesign.css';
import '../design.css';
import '../classic.css';
import {Brand,AccountMenu,UiIcon} from '../ui';
const adminModule = () => import('../admin/main');
const Admin = lazy(adminModule);
const nav = [['', 'Trang chủ', 'home'], ['tin-tuc', 'Tin tức', 'news'], ['dien-dan', 'Diễn đàn', 'forum'], ['the-gioi', 'Thế giới', 'map'], ['gop-y', 'Góp ý', 'chat']] as const;
export function Icon({ name }: {
    name: string;
}) { return <svg className="i" aria-hidden="true"><use href={'#i-' + name}/></svg>; }
function Symbols() { return <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>{Object.entries(icons).map(([id, value]) => <symbol key={id} id={'i-' + id} viewBox="0 0 24 24" fill={value.filled ? 'currentColor' : 'none'} stroke={value.filled ? 'none' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: value.path }}/>)}</svg>; }
function Shell() {
    const { route } = useRouter(), { me, checking, need, logout } = useSession(), [seen, setSeen] = useState<Route[]>([route]), instance = useRef(crypto.randomUUID()), [account, setAccount] = useState(false), [identityRevision, setIdentityRevision] = useState(0), previousIdentity = useRef<string | undefined>(undefined);
    useEffect(() => { if (previousIdentity.current && previousIdentity.current !== me?.username)
        setIdentityRevision(v => v + 1); previousIdentity.current = me?.username; }, [me?.username]);
    const active = route.name === 'bai-viet' ? 'dien-dan' : route.name;
    const exists = seen.some(r => r.key === route.key), pages = exists ? seen : [...seen, route];
    useEffect(() => { setSeen(old => old.some(r => r.key === route.key) ? old : [...old, route]); setAccount(false); document.title = (route.name === 'admin' ? 'Quản trị' : nav.find(([id]) => id === active)?.[1] || 'Tải game') + ' — Aether Chronicle'; }, [route.key, active]);
    return <div className="web-app" data-app-instance={instance.current}><Symbols /><div hidden={route.name === 'admin'}><a href="#main" className="sr-only focus:not-sr-only">Bỏ qua tới nội dung</a><header className="web-header"><div className="classic-topline"><span>Nhập vai pixel online · Windows & Android</span><div className="web-account">{me?<AccountMenu username={me.username} admin={me.admin} onLogout={logout}/>:<button className="btn btn-ghost btn-sm" onClick={()=>need()} disabled={checking}>{checking?'Đang kết nối…':'Đăng nhập'}</button>}</div></div><div className="classic-masthead"><span className="classic-crest" aria-hidden="true">✦</span><Brand href={siteBase}/><span className="classic-crest" aria-hidden="true">✦</span></div><nav className="classic-nav" aria-label="Chính">{nav.map(([id,label])=><a key={id} href={siteBase+id} aria-current={active===id?'page':undefined}>{label}</a>)}<a href="tai-game" aria-current={route.name==='tai-game'?'page':undefined}>Tải game</a></nav></header><main id="main" className="web-main">{pages.filter(r => r.name !== 'admin').map(r => <div key={r.key + ':' + identityRevision} hidden={route.key !== r.key} data-route-active={route.key === r.key ? 'true' : 'false'}>{r.name === '' ? <Home /> : r.name === 'the-gioi' ? <World /> : r.name === 'tin-tuc' ? <NewsPage /> : r.name === 'dien-dan' ? <Forum initialSearch={r.search}/> : r.name === 'bai-viet' ? <PostPage id={new URLSearchParams(r.search).get('id') || ''}/> : r.name === 'gop-y' ? <FeedbackPage /> : <Downloads />}</div>)}</main><footer className="web-footer portal-shell"><Brand href={siteBase}/><p>Game nhập vai pixel online · Windows & Android</p><nav aria-label="Cuối trang"><a href="tai-game">Tải game</a><a href="dien-dan">Diễn đàn</a><a href="gop-y">Góp ý & báo lỗi</a></nav><small>© 2026 Aether Chronicle · Thế giới đang được hoàn thiện từng bước.</small></footer></div>{pages.some(r => r.name === 'admin') && <div className="admin-scope" hidden={route.name !== 'admin'} data-route-active={route.name === 'admin' ? 'true' : 'false'}><Suspense fallback={<div className="web-container"><h1>Quản trị</h1><p>Đang mở lần đầu…</p></div>}><Admin /></Suspense></div>}</div>;
}
function App() { const api = useApi(); const prefetch = useCallback((url: string) => { const r = parseRoute(url); if (!r)
    return; const cache = cacheFor(api); const keys = r.name === 'tin-tuc' ? ['api/news?limit=200'] : r.name === 'dien-dan' ? ['api/posts?limit=20&q=&category=&before=', 'api/posts/counts'] : r.name === 'the-gioi' ? ['site/roster.json'] : r.name === 'tai-game' ? ['api/client/version'] : r.name === '' ? ['api/news?limit=200', 'api/posts?limit=20&q=&category=&before=', 'api/client/version'] : r.name === 'bai-viet' ? ['api/posts/' + new URLSearchParams(r.search).get('id')] : []; if (r.name === 'admin')
    void adminModule(); keys.forEach(key => void cache.load(key).catch(() => { })); }, [api]); useEffect(() => { if (parseRoute(location.href)?.name === 'admin')
    return; const timer = setTimeout(() => ['tin-tuc', 'dien-dan', 'the-gioi', 'tai-game'].forEach(p => prefetch(siteBase + p)), 100); return () => clearTimeout(timer); }, [prefetch]); return <Router prefetch={prefetch}><Shell /></Router>; }
createRoot(document.getElementById('root')!).render(<SessionProvider><App /></SessionProvider>);

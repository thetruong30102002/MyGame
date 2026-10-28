import { useState, useEffect, useCallback, useDeferredValue, useTransition, useRef, useMemo, type FormEvent, type ReactNode } from 'react';
import { ApiContext, useApi, useLoad, cacheFor, json, type Api } from './api';
import { RosterGallery } from '../roster';
import type { readDevelopmentPlan } from '../../src/developmentPlan';
import type { WORLD_DESIGN } from '../../../../packages/sim/src/worldDesign';
import './studio.css';
import './classic-studio.css';
import {Brand,AccountMenu,UiIcon} from '../ui';
import {PlanView} from './planView';
type Plan = ReturnType<typeof readDevelopmentPlan> & {
    worldDesign: typeof WORLD_DESIGN;
};
type Character = {
    id: string;
    name: string;
    account: string;
    level: number;
    coins: number;
    diamonds: number;
    potions: number;
    bonusPoints: number;
    exp: number;
    online: boolean;
};
type Feedback = {
    id: number;
    username: string;
    characterName?: string;
    text: string;
    kind: string;
    status: string;
    reply?: string;
    at: number;
    build?: number;
    platform?: string;
};
type News = {
    id: number;
    tag: string;
    title: string;
    body: string[];
    date: string;
    archived?: boolean;
};
type Post = {
    id: number;
    title: string;
    body: string;
    author: string;
    comments: number;
    at: number;
};
type Comment = {
    id: number;
    body: string;
    author: string;
    at: number;
};
type Log = {
    id: number;
    admin: string;
    characterName: string;
    field: string;
    from: number;
    to: number;
    reason: string;
    at: number;
};
const tabs=[['plan','Kế hoạch'],['world','Thế giới'],['roster','Nhân vật & class'],['res','Tài nguyên'],['fb','Góp ý'],['news','Tin tức'],['posts','Diễn đàn'],['log','Nhật ký']] as const;
const tabIcons:Record<string,string>={plan:'plan',world:'world',roster:'roster',res:'res',fb:'chat',news:'news',posts:'forum',log:'log'};
const date = (n: number) => new Date(n).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
function Notice({ children }: {
    children: ReactNode;
}) { return <div className="ra-notice" role="status">{children}</div>; }
function Failure({ error }: {
    error?: string;
}) { return error ? <p className="ra-error" role="alert">{error}</p> : null; }
function Panel({ title, children }: {
    title?: string;
    children: ReactNode;
}) { return <section className="ra-panel">{title && <h2>{title}</h2>}{children}</section>; }
function ConfirmDialog({ text, cancel, confirm }: {
    text: string;
    cancel: () => void;
    confirm: () => void;
}) { const ref = useRef<HTMLDialogElement>(null); useEffect(() => { ref.current?.showModal(); }, []); return <dialog ref={ref} className="ra-confirm" onCancel={cancel}><Panel title="Xác nhận"><p>{text}</p><div className="ra-actions"><button autoFocus onClick={cancel}>Hủy</button><button className="primary" onClick={confirm}>Xác nhận</button></div></Panel></dialog>; }
function MutateButton({ children, work, confirmText, onDone }: {
    children: ReactNode;
    work: () => Promise<unknown>;
    confirmText?: string;
    onDone: () => void;
}) {
    const [busy, setBusy] = useState(false), [error, setError] = useState(''), [ask, setAsk] = useState(false);
    async function run() {
        setAsk(false);
        setBusy(true);
        setError('');
        try {
            await work();
            onDone();
        }
        catch (e) {
            setError((e as Error).message);
        }
        finally {
            setBusy(false);
        }
    }
    return <><button disabled={busy} onClick={() => confirmText ? setAsk(true) : void run()}>{busy ? 'Đang lưu…' : children}</button>{ask && <ConfirmDialog text={confirmText || ''} cancel={() => setAsk(false)} confirm={() => void run()}/>}<Failure error={error}/></>;
}
function WorldPage(){const {data:p,error}=useLoad<Plan>('api/admin/plan?view=dashboard');if(!p)return <Notice>{error||'Đang mở hồ sơ thế giới…'}</Notice>;return <><div className="ra-page-heading"><span className="ra-eyebrow">HỒ SƠ / THẾ GIỚI</span><h1>Những miền đất<br/>đang thành hình.</h1><p>Thiết kế, chính trị, địa lý và kiểm kê asset. Các nội dung mới vẫn đang ở giai đoạn phát triển.</p></div><WorldDesign design={p.worldDesign}/><Panel title="Kiểm kê 13 vùng"><div className="ra-table"><table><thead><tr><th>Vùng</th><th>Map</th><th>Trung tâm</th><th>Định hướng kiến trúc</th></tr></thead><tbody>{p.regions.map(r=><tr key={String(r.id)}><td>{String(r.name)}</td><td>{String(r.mapCount)}</td><td>{String(r.hubName)}</td><td>{String(r.architecture)}</td></tr>)}</tbody></table></div></Panel><Panel title="Kiểm kê boss"><details className="ra-task"><summary>Xem dữ liệu frame của {p.bosses.length} boss</summary><div className="ra-task-body"><pre>{JSON.stringify(p.bosses,null,2)}</pre></div></details></Panel></>}
function WorldDesign({ design: d }: {
    design: typeof WORLD_DESIGN;
}) {
    if (!d)
        return null;
    return <Panel title="Hướng thế giới mới"><p className="ra-muted">Bản thiết kế, chưa phải các map/NPC mới đã phát hành.</p><ul>{d.notes.map(n => <li key={n}>{n}</li>)}</ul><details className="ra-task"><summary>Bố trí vùng và Thiên Thành · sơ đồ thiết kế</summary><div className="ra-map"><svg viewBox="0 0 1000 650" role="img" aria-label="Sơ đồ 13 vùng và Thiên Thành, vị trí dự kiến"><path d="M200 420 Q80 200 220 120 T650 100 Q950 140 900 390 T550 570 Q250 600 200 420" fill="#1d3526" stroke="#4c654a"/>{d.layout.map(p => <g key={p.id} transform={'translate(' + p.x * 10 + ',' + p.y * 6 + ')'}><circle r={p.status === 'planned' ? 13 : 8} fill={p.color}/><text y={-16} textAnchor="middle" fill="#e1e5d5" fontSize="12">{p.shortName}</text></g>)}</svg></div><p className="ra-muted">Sơ đồ phục vụ bố trí trước khi vẽ tranh tổng. Chưa thay cổng hoặc mở map mới.</p></details><div className="ra-design-grid">{d.regions.map(r => <details className="ra-task" key={r.region}><summary>{d.layout.find(p => p.id === r.region)?.name || r.region}</summary><div className="ra-task-body"><h3>{r.government}</h3><p>{r.authority}</p><p>{r.tension}</p><p>{r.continuity}</p><small>Vị trí dữ liệu: {r.seatMap}</small><ul>{r.questHooks.map(q => <li key={q}>{q}</li>)}</ul></div></details>)}</div><details className="ra-task"><summary>Thiên Thành · Lịch sử khởi nguyên</summary><div className="ra-task-body"><p>{d.sky.deity.role}</p>{d.chapters.map(c => <article key={c.id}><h3>{c.order}. {c.title}</h3><p>{c.revelation}</p></article>)}</div></details><details className="ra-task"><summary>Phe phái và giao thương · {d.factions.length} tổ chức đề xuất</summary><div className="ra-design-grid">{d.factions.map(f => <article key={f.id} className="ra-task-body"><h3>{f.name}</h3><p>{f.goal}</p><small>{f.cost}</small></article>)}</div><ul>{d.relations.map(r => <li key={r.a + r.b}>{d.factions.find(f => f.id === r.a)?.name} ↔ {d.factions.find(f => f.id === r.b)?.name}: {r.reason}</li>)}</ul></details></Panel>;
}
function Resources() {
    const api = useApi(), [query, setQuery] = useState(''), q = useDeferredValue(query), { data, error, loading, reload } = useLoad<Character[]>('api/admin/characters?q=' + encodeURIComponent(q)), [selected, setSelected] = useState<Character>(), [draft, setDraft] = useState<Record<string, string>>({}), [result, setResult] = useState('');
    const fields = [['coins', 'Xu'], ['diamonds', 'Kim cương'], ['potions', 'Bình máu'], ['exp', 'Kinh nghiệm'], ['talentPoints', 'Điểm thiên phú'], ['setLevel', 'Đặt cấp']] as const;
    return <><Panel title="Tra cứu nhân vật"><input placeholder="Tên nhân vật hoặc tài khoản" aria-label="Tìm nhân vật" value={query} onChange={e => setQuery(e.target.value)}/><Failure error={error}/>{loading && <p role="status">Đang tìm…</p>}<div className="ra-table"><table><thead><tr><th>Nhân vật</th><th>Tài khoản</th><th>Cấp</th><th>Xu</th><th>KC</th><th>Trạng thái</th></tr></thead><tbody>{data?.map(c => <tr key={c.id} aria-selected={selected?.id === c.id}><td><button onClick={() => { setSelected(c); setDraft({}); setResult(''); }}>{c.name}</button></td><td>{c.account}</td><td>{c.level}</td><td>{c.coins}</td><td>{c.diamonds}</td><td>{c.online ? 'Online' : 'Offline'}</td></tr>)}</tbody></table></div>{data?.length === 0 && <Notice>Không tìm thấy nhân vật.</Notice>}</Panel>
 <Panel title={selected ? 'Cộng / trừ cho ' + selected.name : 'Chọn nhân vật để điều chỉnh'}>{selected && <><p className="ra-muted">Tài khoản {selected.account} · {selected.id}. Số âm để trừ, bỏ trống để giữ nguyên.</p><div className="ra-form-grid">{fields.map(([id, label]) => <label key={id}>{label}<input type="number" step="1" aria-label={label} value={draft[id] || ''} onChange={e => setDraft({ ...draft, [id]: e.target.value })}/></label>)}</div><label>Lý do<input value={draft.reason || ''} onChange={e => setDraft({ ...draft, reason: e.target.value })}/></label>{draft.reason?.trim() && fields.some(([id]) => draft[id]) && <MutateButton confirmText={'Điều chỉnh ' + selected.name + ' (' + selected.account + '): ' + fields.filter(([id]) => draft[id]).map(([id, label]) => label + ' ' + draft[id]).join(', ') + '. Lý do: ' + draft.reason} work={() => api('api/admin/grant', json('POST', { characterId: selected.id, ...Object.fromEntries(fields.filter(([id]) => draft[id]).map(([id]) => [id, Number(draft[id])])), reason: draft.reason }))} onDone={() => { setDraft({}); setResult('Đã ghi nhận thay đổi và nhật ký.'); reload(); }}>Xem xác nhận điều chỉnh</MutateButton>}{result && <Notice>{result}</Notice>}</>}</Panel></>;
}
function FeedbackPage() {
    const { data, error, reload } = useLoad<Feedback[]>('api/admin/feedback?limit=500'), [filter, setFilter] = useState(''), [query, setQuery] = useState(''), q = useDeferredValue(query.toLowerCase());
    return <Panel title="Hộp góp ý"><div className="ra-filters"><input aria-label="Tìm góp ý" placeholder="Tìm nội dung, người gửi…" value={query} onChange={e => setQuery(e.target.value)}/><select aria-label="Lọc góp ý" value={filter} onChange={e => setFilter(e.target.value)}><option value="">Mọi trạng thái</option><option value="moi">Mới</option><option value="da-xem">Đã xem</option><option value="da-xu-ly">Đã xử lý</option></select><button onClick={reload}>Tải lại</button></div><Failure error={error}/>{!data && <Notice>Đang tải…</Notice>}{data?.filter(f => (!filter || f.status === filter) && (!q || (f.text + ' ' + f.username).toLowerCase().includes(q))).map(f => <FeedbackEditor key={f.id} item={f} reload={reload}/>)}{data?.length === 0 && <Notice>Chưa có góp ý.</Notice>}</Panel>;
}
function FeedbackEditor({ item: f, reload }: {
    item: Feedback;
    reload: () => void;
}) { const api = useApi(), [status, setStatus] = useState(f.status), [reply, setReply] = useState(f.reply || ''); return <article className="ra-entry"><small>#{f.id} · {f.username} · {date(f.at)} · {f.platform || 'web'} / {f.build || '—'}</small><p className="ra-pre">{f.text}</p><div className="ra-actions"><select aria-label={'Trạng thái góp ý ' + f.id} value={status} onChange={e => setStatus(e.target.value)}><option value="moi">Mới</option><option value="da-xem">Đã xem</option><option value="da-xu-ly">Đã xử lý</option></select></div><label>Phản hồi<textarea maxLength={4000} value={reply} onChange={e => setReply(e.target.value)}/></label><MutateButton work={() => api('api/admin/feedback/' + f.id, json('PUT', { status, reply }))} onDone={reload}>Lưu phản hồi</MutateButton></article>; }
const emptyNews = { id: 0, title: '', tag: 'Thông báo', body: [''], date: '' };
function NewsPage() {
    const api = useApi(), { data, error, reload } = useLoad<News[]>('api/admin/news'), [edit, setEdit] = useState<News>(emptyNews), [saved, setSaved] = useState('');
    return <><Panel title={edit.id ? 'Sửa bản tin #' + edit.id : 'Đăng bản tin'}><label>Nhãn<select value={edit.tag} onChange={e => setEdit({ ...edit, tag: e.target.value })}>{['Thông báo', 'Cập nhật', 'Sự kiện'].map(t => <option key={t}>{t}</option>)}</select></label><label>Tiêu đề<input maxLength={120} value={edit.title} onChange={e => setEdit({ ...edit, title: e.target.value })}/></label><label>Nội dung · mỗi dòng một đoạn<textarea rows={7} value={edit.body.join('\n')} onChange={e => setEdit({ ...edit, body: e.target.value.split('\n') })}/></label><div className="ra-actions">{edit.title.trim() && edit.body.some(s => s.trim()) && <MutateButton confirmText={(edit.id ? 'Lưu thay đổi bản tin' : 'Đăng bản tin công khai') + ': ' + edit.title} work={() => api('api/admin/news' + (edit.id ? '/' + edit.id : ''), json(edit.id ? 'PUT' : 'POST', { tag: edit.tag, title: edit.title, body: edit.body.join('\n') }))} onDone={() => { setEdit(emptyNews); setSaved('Đã lưu bản tin.'); reload(); }}>Lưu bản tin</MutateButton>}<button onClick={() => { setEdit(emptyNews); setSaved(''); }}>Soạn mới</button></div>{saved && <Notice>{saved}</Notice>}</Panel><Panel title="Bản tin và lưu trữ"><Failure error={error}/>{!data && <Notice>Đang tải…</Notice>}{data?.map(n => <article key={n.id} className="ra-entry"><small>{n.date} · {n.tag} · {n.archived ? 'LƯU TRỮ' : 'ĐANG HIỂN THỊ'}</small><h3>{n.title}</h3><p>{n.body.join('\n')}</p><div className="ra-actions"><button onClick={() => { setEdit(n); setSaved(''); window.scrollTo({ top: 0, behavior: 'auto' }); }}>Sửa</button><MutateButton confirmText={(n.archived ? 'Hiện lại' : 'Lưu trữ') + ' bản tin “' + n.title + '”?'} work={() => api('api/admin/news/' + n.id + '/archive', json('PUT', { archived: !n.archived }))} onDone={reload}>{n.archived ? 'Hiện lại' : 'Lưu trữ'}</MutateButton><MutateButton confirmText={'Xóa vĩnh viễn bản tin “' + n.title + '”?'} work={() => api('api/admin/news/' + n.id, { method: 'DELETE' })} onDone={() => {
                if (edit.id === n.id)
                    setEdit(emptyNews);
                reload();
            }}>Xóa</MutateButton></div></article>)}</Panel></>;
}
function PostsPage() { const api = useApi(), [q, setQ] = useState(''), query = useDeferredValue(q), [category, setCategory] = useState(''), [before, setBefore] = useState<number[]>([]), { data, error, reload } = useLoad<Post[]>('api/posts?limit=20&q=' + encodeURIComponent(query) + '&category=' + category + '&before=' + (before.at(-1) || '')), [opened, setOpened] = useState<number>(); return <Panel title="Duyệt bài viết"><div className="ra-filters"><input aria-label="Tìm bài viết" value={q} onChange={e => { setQ(e.target.value); setBefore([]); }} placeholder="Tìm bài viết…"/><select aria-label="Chuyên mục" value={category} onChange={e => { setCategory(e.target.value); setBefore([]); }}>{[['', 'Mọi chuyên mục'], ['chung', 'Thảo luận chung'], ['to-doi', 'Tìm tổ đội'], ['hoi-dap', 'Hỏi đáp'], ['huong-dan', 'Hướng dẫn'], ['khoe', 'Khoe đồ']].map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select></div><Failure error={error}/>{!data && <Notice>Đang tải…</Notice>}{data?.map(p => <article key={p.id} className="ra-entry"><small>{p.author} · {date(p.at)} · {p.comments} bình luận</small><h3>{p.title}</h3><p className="ra-pre">{p.body}</p><div className="ra-actions"><button onClick={() => setOpened(opened === p.id ? undefined : p.id)}>Xem bình luận</button><MutateButton confirmText={'Ẩn bài viết “' + p.title + '” cùng bình luận khỏi trang cộng đồng?'} work={() => api('api/posts/' + p.id, { method: 'DELETE' })} onDone={reload}>Ẩn bài</MutateButton></div>{opened === p.id && <Comments id={p.id}/>}</article>)}{data?.length === 0 && <Notice>Không có bài viết.</Notice>}<div className="ra-actions"><button disabled={!before.length} onClick={() => setBefore(v => v.slice(0, -1))}>Trang trước</button><span>Trang {before.length + 1}</span><button disabled={!data || data.length < 20} onClick={() => setBefore(v => [...v, data!.at(-1)!.id])}>Trang sau</button></div></Panel>; }
function Comments({ id }: {
    id: number;
}) {
    const api = useApi(), { data, error, reload } = useLoad<{
        comments: Comment[];
    }>('api/posts/' + id);
    return <div className="ra-comments"><Failure error={error}/>{data?.comments.map(c => <article key={c.id}><small>{c.author} · {date(c.at)}</small><p>{c.body}</p><MutateButton confirmText={'Ẩn bình luận của ' + c.author + '?'} work={() => api('api/comments/' + c.id, { method: 'DELETE' })} onDone={reload}>Ẩn bình luận</MutateButton></article>)}{data?.comments.length === 0 && <p>Chưa có bình luận.</p>}</div>;
}
function LogPage() { const [id, setId] = useState(''), filter = useDeferredValue(id), { data, error, reload } = useLoad<Log[]>('api/admin/log?limit=200&characterId=' + encodeURIComponent(filter)); return <Panel title="Nhật ký điều chỉnh"><div className="ra-filters"><input placeholder="Lọc ID nhân vật" aria-label="ID nhân vật" value={id} onChange={e => setId(e.target.value)}/><button onClick={reload}>Tải lại</button></div><Failure error={error}/>{!data && <Notice>Đang tải…</Notice>}<div className="ra-table"><table><thead><tr>{['Thời điểm', 'Quản trị', 'Nhân vật', 'Thay đổi', 'Lý do'].map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{data?.map((l, i) => <tr key={l.id || i}><td>{date(l.at)}</td><td>{l.admin}</td><td>{l.characterName}</td><td>{l.field}: {l.from} → {l.to}</td><td>{l.reason}</td></tr>)}</tbody></table></div>{data?.length === 0 && <Notice>Chưa có điều chỉnh.</Notice>}</Panel>; }
function AccessFrame({children}:{children:ReactNode}){return <div className="ra-access"><aside><Brand href="./" admin/><div><span className="ra-eyebrow">PHÁT TRIỂN MỘT THẾ GIỚI</span><h1>HAVEN LORD<br/><span>STUDIO.</span></h1><p>Từ một điểm ảnh,<br/>đến những hành trình.</p></div><div className="ra-access-art"><img src="site/media/roster/player_staff_m01/S.png" width="336" height="336" alt="Tinh Vân — Pháp sư"/><span>HỒ SƠ LỮ HÀNH / 01</span></div></aside><div className="ra-access-form">{children}</div></div>}
export default function App() {
    const [token, setToken] = useState(() => localStorage.getItem('havenlord.web.token') || ''), [user, setUser] = useState<{
        username: string;
        admin: boolean;
    }>(), [authError, setAuthError] = useState(''), [checking, setChecking] = useState(!!token), [tab, setTab] = useState(() => tabs.some(([id]) => id === location.hash.slice(1)) ? location.hash.slice(1) : 'plan'), [visited, setVisited] = useState<string[]>([tab]), [pending, startTransition] = useTransition();
    const api = useCallback<Api>(async (path, init = {}) => {
        const r = await fetch(path, { ...init, headers: { ...init.headers, ...(token ? { Authorization: 'Bearer ' + token } : {}) } });
        const data = await r.json();
        if (!r.ok) {
            if (r.status === 401) {
                localStorage.removeItem('havenlord.web.token');
                window.dispatchEvent(new Event('havenlord:session'));
                setToken('');
                setUser(undefined);
            }
            if (r.status === 403)
                setUser(u => u ? { ...u, admin: false } : undefined);
            throw Error(data.error || data.message || 'Không thực hiện được yêu cầu');
        }
        return data;
    }, [token]);
    useEffect(() => { const sync = () => { const next = localStorage.getItem('havenlord.web.token') || ''; if (next !== token) {
        cacheFor(api).clear();
        setToken(next);
        setUser(undefined);
    } }; window.addEventListener('havenlord:session', sync); window.addEventListener('storage', sync); return () => { window.removeEventListener('havenlord:session', sync); window.removeEventListener('storage', sync); }; }, [token, api]);
    useEffect(() => { if (!user?.admin)
        return; ['api/admin/plan?view=dashboard', 'api/admin/characters?q=', 'api/admin/feedback?limit=500', 'api/admin/news', 'api/posts?limit=20&q=&category=&before=', 'api/admin/log?limit=200&characterId=', 'site/roster.json'].forEach(path => void cacheFor(api).load(path).catch(() => { })); }, [user?.admin, api]);
    useEffect(() => {
        if (!token) {
            setChecking(false);
            return;
        }
        const c = new AbortController();
        setChecking(true);
        api<{
            username: string;
            admin: boolean;
        }>('api/admin/me', { signal: c.signal }).then(value => { if (!c.signal.aborted)
            setUser(value); }).catch(e => {
            if (e.name !== 'AbortError')
                setAuthError(e.message);
        }).finally(() => {
            if (!c.signal.aborted)
                setChecking(false);
        });
        return () => c.abort();
    }, [token, api]);
    useEffect(() => {
        const change = () => {
            const next = location.hash.slice(1);
            if (tabs.some(([id]) => id === next))
                startTransition(() => { setTab(next); setVisited(v => v.includes(next) ? v : [...v, next]); });
        };
        window.addEventListener('hashchange', change); window.addEventListener('popstate',change);
        return () => {window.removeEventListener('hashchange', change);window.removeEventListener('popstate',change);};
    }, []);
    async function logout() {
        try {
            await api('api/logout', { method: 'POST' });
        }
        catch { }
        cacheFor(api).clear();
        localStorage.removeItem('havenlord.web.token');
        window.dispatchEvent(new Event('havenlord:session'));
        setToken('');
        setUser(undefined);
        setVisited(['plan']);
        setTab('plan');
    }
    async function login(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setChecking(true);
        setAuthError('');
        try {
            const r = await fetch('api/login', json('POST', Object.fromEntries(f)));
            const d = await r.json();
            if (!r.ok)
                throw Error(d.error || 'Đăng nhập thất bại');
            localStorage.setItem('havenlord.web.token', d.token);
            window.dispatchEvent(new Event('havenlord:session'));
            setToken(d.token);
        }
        catch (e) {
            setAuthError((e as Error).message);
            setChecking(false);
        }
    }
    const pages = useMemo<Record<string, ReactNode>>(() => ({ plan: <PlanView />, world:<WorldPage/>, roster: <Panel title="30 nhân vật · 5 class"><Notice>Mỗi class có 3 nam và 3 nữ. Tóc, trang phục và một vũ khí được vẽ liền nhân vật. Các nhân vật đời cũ dành cho NPC trong hướng phát triển mới.</Notice><RosterGallery /></Panel>, res: <Resources />, fb: <FeedbackPage />, news: <NewsPage />, posts: <PostsPage />, log: <LogPage /> }), []);
    if (!user)
        return <AccessFrame><Panel title="Cổng quản trị Aether"><p>Kế hoạch phát triển và vận hành thế giới.</p>{token ? <><Notice>{checking ? 'Đang xác minh phiên…' : authError || 'Chưa kết nối được máy chủ.'}</Notice>{!checking && <button onClick={() => void logout()}>Đổi tài khoản</button>}</> : <form onSubmit={login}><label>Tên đăng nhập<input name="username" autoComplete="username" required/></label><label>Mật khẩu<input name="password" type="password" autoComplete="current-password" required/></label><Failure error={authError}/><button className="primary" disabled={checking}>Đăng nhập</button></form>}<a href="./">← Về trang chủ</a></Panel></AccessFrame>;
    if (!user.admin)
        return <AccessFrame><Panel title="Không có quyền quản trị"><p>Tài khoản {user.username} chưa được cấp quyền.</p><button onClick={() => void logout()}>Đổi tài khoản</button><a href="./">Về trang chủ</a></Panel></AccessFrame>;
    return <ApiContext value={api}><div className="ra-layout"><aside className="ra-sidebar"><Brand href="./" admin/><span className="ra-sidebar-label">KHÔNG GIAN LÀM GAME</span><nav aria-label="Quản trị">{tabs.map(([id,label])=><a key={id} href={'#'+id} aria-current={tab===id?'page':undefined}><UiIcon name={tabIcons[id]!}/><span>{label}</span>{tab===id&&<span className="ra-nav-dot"/>}</a>)}</nav><div className="ra-sidebar-end"><span className="ra-sidebar-label">HAVEN LORD / STUDIO</span><p>Một nguồn kế hoạch.<br/>Từng bước thành thế giới.</p><a href="./">Mở cổng game<UiIcon name="external"/></a></div></aside><div className="ra-workspace"><header className="ra-topbar"><div className="ra-breadcrumb"><span>Aether Studio</span><UiIcon name="chevron"/><strong>{tabs.find(([id])=>id===tab)?.[1]}</strong></div><div className="ra-topbar-account"><span className="ra-environment">{['127.0.0.1','localhost'].includes(location.hostname)?'THỬ NGHIỆM':'VẬN HÀNH'}</span><AccountMenu username={user.username} admin onLogout={()=>void logout()}/></div></header><main className="ra-main" aria-busy={pending}>{visited.map(id=><div key={id} data-pane={id} hidden={tab!==id}>{pages[id]}</div>)}</main><footer className="ra-footer"><span>HAVEN LORD / STUDIO</span><span>Kế hoạch và nội dung được cập nhật theo từng phần hoàn thiện.</span></footer></div></div></ApiContext>;
}

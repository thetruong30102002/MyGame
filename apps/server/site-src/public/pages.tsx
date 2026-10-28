import { useState, useEffect, useLayoutEffect, useRef, useDeferredValue, type ReactNode, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { useApi, useLoad, cacheFor, json } from '../admin/api';
import { useSession } from './session';
import { useRouter } from './router';
import { RosterGallery } from '../roster';
import {HomeCover,WorldCover} from './cover';
import type { ClientVersion } from '../../src/clientUpdate';
import { POST_TITLE_MAX, POST_BODY_MAX, COMMENT_MAX, FEEDBACK_MAX } from '@aether/protocol';
import type { NewsItem, PostItem, CommentItem, MyFeedback } from '@aether/protocol';
const cats: Record<string, string> = { chung: 'Thảo luận chung', 'to-doi': 'Tìm tổ đội', 'hoi-dap': 'Hỏi đáp', 'huong-dan': 'Hướng dẫn', khoe: 'Khoe đồ' };
const statuses: Record<string, string> = { moi: 'Mới', 'da-xem': 'Đã xem', 'da-xu-ly': 'Đã xử lý' };
const date = (n: number) => new Date(n).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
const newsKey = 'api/news?limit=200', postsKey = 'api/posts?limit=20&q=&category=&before=';
export function Message({ error, loading, empty = false }: {
    error?: string;
    loading?: boolean;
    empty?: boolean;
}) { return <>{error && <p className="web-error" role="alert">{error}</p>}{loading && <p className="web-muted" role="status">Đang cập nhật…</p>}{empty && <p className="web-muted">Chưa có nội dung tại đây.</p>}</>; }
export function Section({ title, eyebrow, children }: {
    title: string;
    eyebrow?: string;
    children: ReactNode;
}) { return <section className="web-container"><header className="web-page-heading"><p className="ac-kicker">{eyebrow || 'AETHER CHRONICLE'}</p><h1>{title}</h1><span className="web-page-heading-mark" aria-hidden="true">↗</span></header>{children}</section>; }
// Khối văn bản do dự án soạn sẵn; dữ liệu người dùng luôn render bằng JSX, không chèn HTML.
function StaticContent({ html, slots }: {
    html: string;
    slots: Record<string, ReactNode>;
}) { const root = useRef<HTMLDivElement>(null), [targets, setTargets] = useState<Record<string, Element>>({}); useLayoutEffect(() => { const found: Record<string, Element> = {}; root.current?.querySelectorAll('[data-slot],#new-roster').forEach(el => { found[el.getAttribute('data-slot') || 'roster'] = el; }); setTargets(found); }, []); return <><div ref={root} dangerouslySetInnerHTML={{ __html: html }}/>{Object.entries(targets).map(([key, el]) => createPortal(slots[key], el, key))}</>; }
function PostCards({ compact = false }: {
    compact?: boolean;
}) { const { data, error, loading } = useLoad<PostItem[]>(postsKey); return <><Message error={error} loading={!data && loading}/>{data?.slice(0, compact ? 4 : 20).map(p => <a className="portal-post" href={'bai-viet?id=' + p.id} key={p.id}><strong>{p.title}</strong><small>{p.author} · {date(p.at)} · {p.comments} bình luận</small></a>)}{data?.length === 0 && <p className="web-muted">Quán trọ còn vắng. <a href="dien-dan#viet">Viết bài đầu tiên →</a></p>}</>; }
function NewsCards() { const { data, error, loading } = useLoad<NewsItem[]>(newsKey); return <><Message error={error} loading={!data && loading}/>{data?.slice(0, 3).map(n => <a key={n.id} className="portal-news-card" href={'tin-tuc#tin-' + n.id}><small>{n.tag} · {n.date}</small><h3>{n.title}</h3><p>{n.body.join(' · ')}</p></a>)}</>; }
export function Home(){return <HomeCover/>;}
export function World(){return <WorldCover/>;}
export function NewsPage() { const { data, error, loading, reload } = useLoad<NewsItem[]>(newsKey); return <Section title="Bản tin từ Aether" eyebrow="TIN TỨC & CẬP NHẬT"><p className="web-muted">Những phần đã hoàn thiện và bước tiếp theo của thế giới.</p><button className="btn btn-outline btn-sm" onClick={reload}>Làm mới bản tin</button><Message error={error} loading={!data && loading} empty={data?.length === 0}/>{data?.map(n => <article key={n.id} id={'tin-' + n.id} className="web-card web-news"><small>{n.tag} · {n.date}</small><h2>{n.title}</h2>{n.body.map((p, i) => <p key={i}>{p}</p>)}</article>)}</Section>; }
function CharacterSelect({ value, onChange }: {
    value: string;
    onChange: (v: string) => void;
}) { const { me } = useSession(); return <label>Đăng bằng nhân vật<select aria-label="Đăng bằng nhân vật" value={value} onChange={e => onChange(e.target.value)}><option value="">{me?.username || 'Tên tài khoản'}</option>{me?.characters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>; }
function Action({ label, confirm, work, done }: {
    label: string;
    confirm: string;
    work: () => Promise<unknown>;
    done: () => void;
}) { const [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(''), ref = useRef<HTMLDialogElement>(null); useEffect(() => { if (open)
    ref.current?.showModal();
else
    ref.current?.close(); }, [open]); async function run() { setBusy(true); setError(''); try {
    await work();
    setOpen(false);
    done();
}
catch (e) {
    setError((e as Error).message);
}
finally {
    setBusy(false);
} } return <><button className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>{label}</button><dialog ref={ref} className="web-dialog" onCancel={() => setOpen(false)} aria-label="Xác nhận"><h2>{label}</h2><p>{confirm}</p><Message error={error}/><div className="web-actions"><button className="btn" autoFocus onClick={() => setOpen(false)}>Hủy</button><button className="btn btn-primary" onClick={() => void run()} disabled={busy}>Xác nhận</button></div></dialog></>; }
export function Forum({ initialSearch }: {
    initialSearch: string;
}) {
    const api = useApi(), { me, need } = useSession(), { navigate } = useRouter(), [q, setQ] = useState(''), query = useDeferredValue(q), [category, setCategory] = useState(() => new URLSearchParams(initialSearch).get('c') || ''), [before, setBefore] = useState<number[]>([]), [title, setTitle] = useState(''), [body, setBody] = useState(''), [character, setCharacter] = useState(''), [postCat, setPostCat] = useState('chung'), [error, setError] = useState(''), [busy, setBusy] = useState(false);
    const key = 'api/posts?limit=20&q=' + encodeURIComponent(query) + '&category=' + category + '&before=' + (before.at(-1) || ''), { data, error: loadError, loading, reload } = useLoad<PostItem[]>(key), { data: counts } = useLoad<{
        total: number;
        categories: Record<string, number>;
    }>('api/posts/counts');
    async function submit(e: FormEvent) { e.preventDefault(); if (!me) {
        need();
        return;
    } setBusy(true); setError(''); try {
        const p = await api<PostItem>('api/posts', json('POST', { title, body, category: postCat, characterId: character || undefined }));
        cacheFor(api).invalidate('api/posts');
        cacheFor(api).set('api/posts/' + p.id, { post: p, comments: [] });
        setTitle('');
        setBody('');
        reload();
        navigate('bai-viet?id=' + p.id);
    }
    catch (e) {
        setError((e as Error).message);
    }
    finally {
        setBusy(false);
    } }
    return <Section title="Quán trọ lữ hành" eyebrow="DIỄN ĐÀN"><p className="web-muted">Tìm tổ đội, hỏi đường và kể chuyện cùng cộng đồng. {counts?.total || 0} bài viết.</p><div className="web-filters"><input aria-label="Tìm bài viết" placeholder="Tìm bài viết…" value={q} onChange={e => { setQ(e.target.value); setBefore([]); }}/><select aria-label="Chuyên mục" value={category} onChange={e => { setCategory(e.target.value); setBefore([]); }}><option value="">Mọi chuyên mục</option>{Object.entries(cats).map(([id, n]) => <option key={id} value={id}>{n} ({counts?.categories[id] || 0})</option>)}</select><a href="#viet" className="btn btn-primary">Viết bài</a></div><Message error={loadError} loading={!data && loading} empty={data?.length === 0}/><div className="web-posts">{data?.map(p => <a href={'bai-viet?id=' + p.id} key={p.id} className="web-card"><small>{p.author} · {date(p.at)} · {cats[p.category]}</small><h2>{p.title}</h2><p className="web-excerpt">{p.body}</p><small>{p.comments} bình luận{p.mine ? ' · Bài của bạn' : ''}</small></a>)}</div><div className="web-actions"><button className="btn btn-outline" disabled={!before.length} onClick={() => setBefore(a => a.slice(0, -1))}>Trang trước</button><span>Trang {before.length + 1}</span><button className="btn btn-outline" disabled={!data || data.length < 20} onClick={() => setBefore(a => [...a, data!.at(-1)!.id])}>Trang sau</button></div><div className="web-card" id="viet"><h2>Viết bài mới</h2><form onSubmit={submit}><CharacterSelect value={character} onChange={setCharacter}/><label>Chuyên mục bài mới<select value={postCat} onChange={e => setPostCat(e.target.value)}>{Object.entries(cats).map(([id, n]) => <option key={id} value={id}>{n}</option>)}</select></label><label>Tiêu đề<input aria-label="Tiêu đề bài viết" value={title} maxLength={POST_TITLE_MAX} minLength={3} required onChange={e => setTitle(e.target.value)}/></label><label>Nội dung<textarea aria-label="Nội dung bài viết" value={body} maxLength={POST_BODY_MAX} minLength={3} required rows={6} onChange={e => setBody(e.target.value)}/></label><Message error={error}/><button className="btn btn-primary" disabled={busy}>{busy ? 'Đang gửi…' : me ? 'Đăng bài' : 'Đăng nhập để đăng bài'}</button></form></div></Section>;
}
export function PostPage({ id }: {
    id: string;
}) {
    const api = useApi(), { me, need } = useSession(), { navigate } = useRouter(), { data, error, loading, reload } = useLoad<{
        post: PostItem;
        comments: CommentItem[];
    }>('api/posts/' + id), [body, setBody] = useState(''), [character, setCharacter] = useState(''), [sendError, setSendError] = useState(''), [busy, setBusy] = useState(false), [shared, setShared] = useState(false);
    async function submit(e: FormEvent) { e.preventDefault(); if (!me) {
        need();
        return;
    } setBusy(true); setSendError(''); try {
        const comment = await api<CommentItem>('api/posts/' + id + '/comments', json('POST', { body, characterId: character || undefined }));
        cacheFor(api).set('api/posts/' + id, { ...data, comments: [...(data?.comments || []), comment] });
        cacheFor(api).invalidate('api/posts?');
        setBody('');
    }
    catch (e) {
        setSendError((e as Error).message);
    }
    finally {
        setBusy(false);
    } }
    return <Section title={data?.post.title || 'Bài viết'} eyebrow="DIỄN ĐÀN"><a href="dien-dan" className="portal-link">← Về diễn đàn</a><Message error={error} loading={!data && loading}/>{data && <><article className="web-card"><small>{data.post.author} · {date(data.post.at)} · {cats[data.post.category]}</small><p className="web-pre">{data.post.body}</p><div className="web-actions"><button className="btn btn-outline btn-sm" onClick={() => void navigator.clipboard.writeText(location.href).then(() => setShared(true)).catch(() => setSendError('Không chép được link.'))}>{shared ? 'Đã chép link' : 'Chia sẻ'}</button>{(data.post.mine || me?.admin) && <Action label="Ẩn bài viết" confirm={'Ẩn “' + data.post.title + '” khỏi diễn đàn?'} work={() => api('api/posts/' + id, { method: 'DELETE' })} done={() => { cacheFor(api).invalidate('api/posts'); navigate('dien-dan'); }}/>}</div></article><h2>{data.comments.length} bình luận</h2>{data.comments.map(c => <article className="web-card web-comment" key={c.id}><small>{c.author} · {date(c.at)}</small><p className="web-pre">{c.body}</p>{(c.mine || me?.admin) && <Action label="Ẩn bình luận" confirm="Ẩn bình luận này khỏi bài viết?" work={() => api('api/comments/' + c.id, { method: 'DELETE' })} done={reload}/>}</article>)}<form className="web-card" onSubmit={submit}><h2>Viết bình luận</h2><CharacterSelect value={character} onChange={setCharacter}/><label>Nội dung bình luận<textarea value={body} rows={4} maxLength={COMMENT_MAX} required onChange={e => setBody(e.target.value)}/></label><Message error={sendError}/><button className="btn btn-primary" disabled={busy}>{busy ? 'Đang gửi…' : me ? 'Gửi bình luận' : 'Đăng nhập để bình luận'}</button></form></>}</Section>;
}
export function FeedbackPage() { const api = useApi(), { me, need } = useSession(), [kind, setKind] = useState('loi'), [text, setText] = useState(''), [character, setCharacter] = useState(''), [error, setError] = useState(''), [sent, setSent] = useState(false), [busy, setBusy] = useState(false); async function submit(e: FormEvent) { e.preventDefault(); if (!me) {
    need();
    return;
} setBusy(true); setError(''); try {
    await api('api/feedback', json('POST', { text, kind, characterId: character || undefined, platform: 'web' }));
    setText('');
    setSent(true);
    cacheFor(api).invalidate('api/feedback/mine');
    await cacheFor(api).load('api/feedback/mine');
}
catch (e) {
    setError((e as Error).message);
}
finally {
    setBusy(false);
} } return <Section title="Gửi lời về Aether" eyebrow="GÓP Ý & BÁO LỖI"><p className="web-muted">Chia sẻ lỗi, ý tưởng hoặc điều bạn muốn game làm tốt hơn.</p><form className="web-card" onSubmit={submit}><label>Loại góp ý<select value={kind} onChange={e => setKind(e.target.value)}><option value="loi">Báo lỗi</option><option value="y-tuong">Ý tưởng</option><option value="khac">Khác</option></select></label><CharacterSelect value={character} onChange={setCharacter}/><label>Nội dung góp ý<textarea value={text} minLength={3} maxLength={FEEDBACK_MAX} required rows={7} onChange={e => setText(e.target.value)}/></label><small>{text.length} / {FEEDBACK_MAX}</small><Message error={error}/>{sent && <p role="status">Đã gửi góp ý.</p>}<button className="btn btn-primary" disabled={busy}>{busy ? 'Đang gửi…' : me ? 'Gửi góp ý' : 'Đăng nhập để gửi góp ý'}</button></form><h2>Góp ý của bạn</h2>{me ? <MyFeedbackList /> : <button className="btn btn-outline" onClick={() => need()}>Đăng nhập để xem phản hồi</button>}</Section>; }
function MyFeedbackList() { const { data, error, loading, reload } = useLoad<MyFeedback[]>('api/feedback/mine'); return <><button className="btn btn-outline btn-sm" onClick={reload}>Làm mới phản hồi</button><Message error={error} loading={!data && loading} empty={data?.length === 0}/>{data?.map(f => <article key={f.id} className="web-card"><small>{statuses[f.status]} · {date(f.at)}</small><p className="web-pre">{f.text}</p>{f.reply && <blockquote><b>Đội làm game</b><p className="web-pre">{f.reply}</p></blockquote>}</article>)}</>; }
export function Downloads() { const { data: v, error, loading } = useLoad<ClientVersion>('api/client/version'), [os, setOs] = useState(/android/i.test(navigator.userAgent) ? 'android' : 'windows'); const files = v ? [['windows', 'PC · Bộ cài exe', v.windows], ['windows-zip', 'PC · Gói ZIP', v.windows?.zip], ['android', 'Android · APK', v.android]] as const : []; return <Section title="Bắt đầu hành trình" eyebrow="TẢI AETHER CHRONICLE"><p className="web-muted">Windows & Android · Miễn phí · Tài khoản dùng chung giữa các thiết bị.</p><Message error={error} loading={!v && loading}/>{v && <p className="portal-chip">Bản {v.version}</p>}<div className="web-downloads">{files.map(([id, label, file]) => file && <a href={'api/client/latest/' + id} className="web-card" key={id}><h2>{label}</h2><p>{(file.size / 1048576).toFixed(0)} MB · {file.file}</p><span className="portal-link">Tải trực tiếp →</span></a>)}</div>{v?.notes && <p className="web-muted">{v.notes}</p>}<div className="web-card"><h2>Hướng dẫn cài đặt</h2><div className="web-actions" role="tablist" aria-label="Hệ điều hành">{[['windows', 'Máy tính'], ['android', 'Android']].map(([id, n]) => <button key={id} className={'btn ' + (os === id ? 'btn-primary' : 'btn-ghost')} role="tab" aria-selected={os === id} onClick={() => setOs(id!)}>{n}</button>)}</div>{os === 'windows' ? <ol><li>Tải bộ cài Windows và mở file vừa tải để chọn thư mục cài.</li><li>Hoặc tải gói ZIP, giải nén và chạy Aether.exe.</li><li>Mở game, đăng nhập hoặc tạo tài khoản, rồi tạo nhân vật.</li><li>Game kiểm tra và cập nhật khi mở. Tài khoản lưu trên máy chủ.</li></ol> : <ol><li>Tải APK Android mới nhất và mở file trong thư mục Tải xuống.</li><li>Cho phép cài từ ứng dụng Tệp nếu thiết bị yêu cầu, rồi xác nhận cài.</li><li>Cài đè bản mới để cập nhật; đăng nhập lại tài khoản đang dùng.</li></ol>}</div><div id="sua-cap-nhat" className="web-card"><h2>Client Windows cũ bị kẹt cập nhật?</h2><p>Đóng game, tải và giải nén gói sửa vào đúng thư mục chứa Aether.exe và Aether_Data, rồi chạy repair-client.cmd. Xem README.txt trong gói để chọn đường dẫn cài đặt.</p><a className="btn btn-primary" href="api/client/file/Aether-Repair-Windows.zip">Tải gói Sửa cập nhật Windows</a><p className="web-muted">Nhân vật và trang bị vẫn lưu trên máy chủ.</p></div><div className="web-card"><h2>Câu hỏi thường gặp</h2>{[['Có mất nhân vật khi đổi máy?', 'Không. Đăng nhập cùng tài khoản để chơi tiếp trên PC hoặc điện thoại.'], ['Có phải tải lại mỗi khi cập nhật?', 'Windows mới hỗ trợ cập nhật khi mở game. Android cần xác nhận cài APK mới.'], ['Gặp lỗi khi cài hoặc khi chơi?', 'Gửi ở mục Góp ý trên web hoặc trong game để nhận phản hồi.']].map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div><details className="web-card"><summary>Mã SHA-256 của bản tải</summary>{files.map(([id, label, file]) => file && <div key={id}><b>{label}</b><code>{file.sha256}</code></div>)}</details></Section>; }

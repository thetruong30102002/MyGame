import { createContext, useContext, useLayoutEffect, useEffect, useState, useRef, startTransition, type ReactNode } from 'react';
export const siteBase = location.pathname === '/game' || location.pathname.startsWith('/game/') ? '/game/' : '/';
const routes = new Set(['', 'tin-tuc', 'dien-dan', 'bai-viet', 'gop-y', 'tai-game', 'the-gioi', 'admin']);
export function parseRoute(input: string) { const u = new URL(input, location.href); if (u.origin !== location.origin || !u.pathname.startsWith(siteBase))
    return null; let name = u.pathname.slice(siteBase.length).replace(/\/$/, ''); if (name === 'index.html')
    name = ''; if (!routes.has(name))
    return null; return { name, key: name === 'bai-viet' ? name + '?id=' + u.searchParams.get('id') : name, url: u.href, search: u.search, hash: u.hash }; }
export type Route = NonNullable<ReturnType<typeof parseRoute>>;
const RouterContext = createContext<{
    route: Route;
    navigate: (url: string, replace?: boolean) => void;
    prefetch: (url: string) => void;
}>(null!);
export const useRouter = () => useContext(RouterContext);
export function Router({ children, prefetch }: {
    children: ReactNode;
    prefetch: (url: string) => void;
}) {
    const [route, setRoute] = useState(() => parseRoute(location.href)!), current = useRef(route), scrolls = useRef(new Map<string, number>()), restoring = useRef(false), initial = useRef(true);
    const navigate = (url: string, replace = false) => { const next = parseRoute(url); if (!next)
        return; scrolls.current.set(current.current.url, scrollY); replace ? history.replaceState({}, '', next.url) : history.pushState({}, '', next.url); current.current = next; startTransition(() => setRoute(next)); };
    useEffect(() => { const pop = () => { const next = parseRoute(location.href); if (next) {
        scrolls.current.set(current.current.url, scrollY);
        current.current = next;
        restoring.current = true;
        startTransition(() => setRoute(next));
    } }; const old = history.scrollRestoration; history.scrollRestoration = 'manual'; window.addEventListener('popstate', pop); return () => { window.removeEventListener('popstate', pop); history.scrollRestoration = old; }; }, []);
    useEffect(() => { const click = (e: MouseEvent) => { if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return; const a = (e.target as Element).closest<HTMLAnchorElement>('a[href]'); if (!a || a.download || a.target && a.target !== '_self' || a.hasAttribute('data-native'))
        return; const next = parseRoute(a.href); if (!next)
        return; const old = new URL(current.current.url); if (next.name === 'admin' && parseRoute(location.href)?.name === 'admin' && next.hash)
        return; e.preventDefault(); navigate(next.url); }; const hover = (e: Event) => { const a = (e.target as Element).closest<HTMLAnchorElement>('a[href]'); if (a)
        prefetch(a.href); }; document.addEventListener('click', click); document.addEventListener('pointerover', hover, { passive: true }); document.addEventListener('focusin', hover); return () => { document.removeEventListener('click', click); document.removeEventListener('pointerover', hover); document.removeEventListener('focusin', hover); }; }, [prefetch]);
    useLayoutEffect(() => { window.dispatchEvent(new Event('aether:navigation')); if (initial.current) {
        initial.current = false;
        if (!route.hash)
            return;
    } const restore = restoring.current; restoring.current = false; const id = requestAnimationFrame(() => { if (restore) {
        scrollTo(0, scrolls.current.get(route.url) || 0);
        return;
    } const target = route.hash && document.getElementById(decodeURIComponent(route.hash.slice(1))); if (target)
        target.scrollIntoView({ block: 'start' });
    else
        scrollTo(0, 0); const h = document.querySelector<HTMLElement>('[data-route-active="true"] h1'); h?.setAttribute('tabindex', '-1'); h?.focus({ preventScroll: true }); }); return () => cancelAnimationFrame(id); }, [route.url]);
    return <RouterContext value={{ route, navigate, prefetch }}>{children}</RouterContext>;
}

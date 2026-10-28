import { createContext, useContext, useEffect, useCallback, useSyncExternalStore } from 'react';
import { QueryCache } from '../queryCache';
export type Api = <T = unknown>(path: string, init?: RequestInit) => Promise<T>;
export const ApiContext = createContext<Api>(async () => { throw Error('Chưa đăng nhập'); });
export function useApi() { return useContext(ApiContext); }
const caches = new WeakMap<Api, QueryCache>();
export function cacheFor(api: Api) { let cache = caches.get(api); if (!cache) {
    cache = new QueryCache((path, signal) => api(path, { signal }));
    caches.set(api, cache);
} return cache; }
export function useLoad<T>(path: string) {
    const api = useApi(), cache = cacheFor(api);
    const subscribe = useCallback((fn: () => void) => cache.subscribe(path, fn), [cache, path]);
    const snapshot = useCallback(() => cache.snapshot<T>(path), [cache, path]);
    const state = useSyncExternalStore(subscribe, snapshot);
    useEffect(() => { const timer = setTimeout(() => void cache.load(path).catch(() => { }), /[?&](q|characterId)=[^&]+/.test(path) ? 200 : 0); return () => clearTimeout(timer); }, [cache, path]);
    useEffect(() => { const fresh = () => { if (document.visibilityState === 'visible')
        void cache.load(path).catch(() => { }); }; window.addEventListener('focus', fresh); window.addEventListener('aether:navigation', fresh); return () => { window.removeEventListener('focus', fresh); window.removeEventListener('aether:navigation', fresh); }; }, [cache, path]);
    const reload = useCallback(() => { void cache.load(path, true).catch(() => { }); }, [cache, path]);
    return { ...state, reload };
}
export const json = (method: string, data: unknown): RequestInit => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });

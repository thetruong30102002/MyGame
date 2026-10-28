// Cache theo phiên ứng dụng. Yêu cầu trùng dùng chung promise, dữ liệu cũ vẫn hiện khi làm mới.
export interface QueryState<T = unknown> {
    data?: T;
    error: string;
    loading: boolean;
    updated: number;
}
type Entry = {
    state: QueryState;
    listeners: Set<() => void>;
    pending?: Promise<unknown>;
    controller?: AbortController;
    generation: number;
};
export class QueryCache {
    private entries = new Map<string, Entry>();
    constructor(private fetcher: (key: string, signal: AbortSignal) => Promise<unknown>, private ttl = 30000, private now = () => Date.now()) { }
    private entry(key: string) { let e = this.entries.get(key); if (!e) {
        e = { state: { error: '', loading: true, updated: 0 }, listeners: new Set(), generation: 0 };
        this.entries.set(key, e);
    } return e; }
    snapshot<T>(key: string) { return this.entry(key).state as QueryState<T>; }
    subscribe(key: string, listener: () => void) { const e = this.entry(key); e.listeners.add(listener); return () => { e.listeners.delete(listener); }; }
    private publish(e: Entry, state: QueryState) { e.state = state; e.listeners.forEach(fn => fn()); }
    load<T = unknown>(key: string, force = false): Promise<T> {
        const e = this.entry(key);
        if (e.pending && !force)
            return e.pending as Promise<T>;
        if (!force && e.state.data !== undefined && this.now() - e.state.updated < this.ttl)
            return Promise.resolve(e.state.data as T);
        e.controller?.abort();
        const controller = new AbortController(), generation = ++e.generation;
        e.controller = controller;
        this.publish(e, { ...e.state, error: '', loading: true });
        const pending = Promise.resolve().then(() => this.fetcher(key, controller.signal)).then(data => { if (generation === e.generation && !controller.signal.aborted)
            this.publish(e, { data, error: '', loading: false, updated: this.now() }); return data as T; }).catch(error => { if (generation === e.generation && !controller.signal.aborted)
            this.publish(e, { ...e.state, error: error.message || 'Không tải được dữ liệu', loading: false }); throw error; }).finally(() => { if (generation === e.generation)
            e.pending = undefined; });
        e.pending = pending;
        return pending;
    }
    set(key: string, data: unknown) { const e = this.entry(key); e.controller?.abort(); e.generation++; e.pending = undefined; this.publish(e, { data, error: '', loading: false, updated: this.now() }); }
    invalidate(prefix: string) { for (const [key, e] of this.entries)
        if (key.startsWith(prefix)) {
            e.controller?.abort();
            e.generation++;
            e.pending = undefined;
            this.publish(e, { ...e.state, updated: 0, loading: false });
            if (e.listeners.size)
                void this.load(key, true).catch(() => { });
        } }
    clear() { for (const e of this.entries.values()) {
        e.controller?.abort();
        e.generation++;
        e.pending = undefined;
        this.publish(e, { error: '', loading: false, updated: 0 });
    } this.entries.clear(); }
}

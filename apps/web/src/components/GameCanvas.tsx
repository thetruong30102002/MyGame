'use client';

import { useEffect, useRef } from 'react';
import { isStaleChunkError, reloadForStaleBuild } from '@/net/staleBuild';
import { useGameStore } from '@/store/useGameStore';
import { useSession } from '@/store/useSession';

export function GameCanvas() {
	const host = useRef<HTMLDivElement>(null);
	const online = useSession((s) => s.online);

	useEffect(() => {
		const ctrl = new AbortController();
		let game: { destroy(): void } | null = null;
		// Pixi đụng tới window/WebGL nên chỉ nạp ở client, sau khi mount. StrictMode huỷ bản đầu giữa lúc
		// init → `signal` cho Game dừng ngay, không chạy nốt init (dựng thế giới, đọc save) cho một bản "ma".
		import('@/game/Game')
			.then(({ Game }) => (ctrl.signal.aborted ? null : Game.start(host.current!, ctrl.signal, online)))
			.then((g) => {
				if (!g) return;
				if (ctrl.signal.aborted) g.destroy();
				else game = g;
			})
			.catch((e: unknown) => {
				if (ctrl.signal.aborted) return;
				if (isStaleChunkError(e) && reloadForStaleBuild()) return;
				useGameStore.setState({ status: 'error', error: e instanceof Error ? e.message : String(e) });
			});
		return () => {
			ctrl.abort();
			game?.destroy();
		};
	}, [online]);

	return <div ref={host} className="absolute inset-0 overflow-hidden" />;
}

/**
 * Tab mở từ TRƯỚC một lần deploy vẫn chạy JS của bản cũ; lúc vào game nó `import('@/game/Game')` theo tên chunk cũ —
 * chunk đó đã bị bản mới thay nên tải hỏng, game không dựng, WebSocket không bao giờ mở và người chơi chỉ thấy
 * "mất kết nối" (đã gặp 07/10/2026 sau lần deploy 17:57). Gặp đúng lỗi này thì tải lại trang một lần là về bản mới.
 */
const RELOAD_KEY = 'aether.staleBuildReloadAt';
/** Không tải lại lặp: lỗi thật (không phải do deploy) mà tái diễn trong khoảng này thì để màn lỗi hiện ra. */
const RELOAD_GAP_MS = 60_000;

export function isStaleChunkError(e: unknown): boolean {
	const msg = e instanceof Error ? `${e.name} ${e.message}` : String(e);
	return /ChunkLoadError|Failed to load chunk|Loading chunk|dynamically imported module|Importing a module script failed/i.test(msg);
}

/** true = đã gọi tải lại trang (người gọi dừng xử lý); false = vừa tải lại cách đây chưa lâu, để lỗi hiện ra. */
export function reloadForStaleBuild(): boolean {
	let last = 0;
	try {
		last = Number(sessionStorage.getItem(RELOAD_KEY)) || 0;
		if (Date.now() - last < RELOAD_GAP_MS) return false;
		sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
	} catch {
		/* chế độ ẩn danh chặn sessionStorage: vẫn tải lại, chấp nhận rủi ro lặp vì lỗi chunk hiếm */
	}
	location.reload();
	return true;
}

import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { SERVER_PORT } from '@havenlord/protocol';
import { AdminOps } from './adminOps.ts';
import { seedAdmin } from './adminSeed.ts';
import { Board } from './board.ts';
import { Store } from './db.ts';
import { dbPath } from './dbPath.ts';
import { createApi, stripMount } from './http.ts';
import { SITE_DIR } from './site.ts';
import { World } from './world.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT) || SERVER_PORT;
// Biến môi trường riêng của máy (mật khẩu quản trị tổng…), không commit.
const ENV_FILE = join(ROOT, '.env.local');
if (existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE);
const store = new Store(dbPath());
const seededAdmin = await seedAdmin(store);
if (seededAdmin) console.log(`Tài khoản quản trị tổng: ${seededAdmin}`);
const world = new World(store);
// Tin tức trang chủ giờ lưu CSDL: lần đầu (bảng rỗng) nạp tin cũ từ site/news.json.
const seeded = new Board(store).seedNews(join(SITE_DIR, 'news.json'));
if (seeded) console.log(`Đã nạp ${seeded} tin từ site/news.json vào CSDL`);
// Trang quản trị dùng chung thế giới đang chạy: nhân vật online nhận số mới ngay (bộ nhớ kinh tế + tin `eco` / `wallet`).
const api = createApi(store, new AdminOps(store, world));

const server = createServer((req, res) => void api(req, res));
const wss = new WebSocketServer({ noServer: true, maxPayload: 96 * 1024 });
wss.on('connection', (ws) => world.accept(ws));
// Tự xử lý nâng cấp WebSocket để nhận cả `/ws` lẫn `/game/ws` (đi qua Funnel).
server.on('upgrade', (req, socket, head) => {
	if (stripMount(new URL(req.url ?? '/', 'http://x').pathname) !== '/ws') return void socket.destroy();
	wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
});

// Nhịp tim: kết nối "chết" (tắt mạng đột ngột, không gửi close) bị dọn sau ~40 giây.
const alive = new WeakSet<object>();
wss.on('connection', (ws) => {
	alive.add(ws);
	ws.on('pong', () => alive.add(ws));
});
const heartbeat = setInterval(() => {
	for (const ws of wss.clients) {
		if (!alive.has(ws)) {
			ws.terminate();
			continue;
		}
		alive.delete(ws);
		ws.ping();
	}
}, 20_000);

server.listen(port, () => console.log(`Haven Lord server: http://localhost:${port}  (ws: /ws)`));

function shutdown(): void {
	clearInterval(heartbeat);
	world.stop();
	wss.close();
	server.close(() => process.exit(0));
	setTimeout(() => process.exit(0), 1500).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

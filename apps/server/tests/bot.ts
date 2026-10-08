// Người chơi máy (dev): đăng nhập tester2, đi vòng quanh một điểm và chat — để thử bằng mắt phần online.
// `npx tsx tests/bot.ts <x> <y> [giây]` khi máy chủ đang chạy.
import { WebSocket } from 'ws';
import type { CharacterInfo } from '@aether/protocol';

const BASE = 'http://localhost:3200';
const [cx, cy, secs] = [Number(process.argv[2] ?? 1000), Number(process.argv[3] ?? 1000), Number(process.argv[4] ?? 20)];
const pw = process.env.BOT_PW ?? '';
const post = async (path: string, body: unknown, token?: string) =>
	(await fetch(BASE + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) })).json();
let auth = await post('/api/login', { username: 'tester2', password: pw });
if (!auth.token) auth = await post('/api/register', { username: 'tester2', password: pw });
const token = auth.token as string;
let list = (await (await fetch(BASE + '/api/characters', { headers: { Authorization: `Bearer ${token}` } })).json()) as CharacterInfo[];
if (!list.length) list = [(await post('/api/characters', { name: 'Minh Khôi', gender: 'male' }, token)) as CharacterInfo];
const ws = new WebSocket(BASE.replace('http', 'ws') + '/ws');
ws.on('message', (m) => {
	const msg = JSON.parse(String(m));
	if (msg.t === 'chat') console.log(`[chat] ${msg.name}: ${msg.text}`);
	if (msg.t === 'welcome') console.log(`welcome, thấy ${msg.players.length} người`);
});
await new Promise((r) => ws.on('open', r));
ws.send(JSON.stringify({ t: 'hello', token, character: list[0]!.id }));
const t0 = Date.now();
let x = cx + 70;
let y = cy;
const timer = setInterval(() => {
	const t = (Date.now() - t0) / 1000;
	const nx = cx + Math.cos(t * 0.8) * 70;
	const ny = cy + Math.sin(t * 0.8) * 40;
	const dx = nx - x;
	const dy = ny - y;
	x = nx;
	y = ny;
	const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'E' : 'W') : dy > 0 ? 'S' : 'N';
	ws.send(JSON.stringify({ t: 'move', x, y, dir, anim: 'walk', sprite: 'player_lior_child' }));
	if (t > secs) {
		clearInterval(timer);
		ws.close();
	}
}, 100);
setTimeout(() => ws.send(JSON.stringify({ t: 'chat', text: `Chào ${process.argv[5] ?? 'bạn'}! Mình là Minh Khôi.` })), 1500);

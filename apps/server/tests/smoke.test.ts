// Thử khói máy chủ: đăng ký → tạo nhân vật → 2 người cùng vào map → thấy nhau di chuyển → chat → lưu.
// Chạy khi máy chủ THỬ đang bật: `npx tsx tests/smoke.test.ts` (mặc định http://localhost:3201, CSDL data/test.db).
// Mỗi lần chạy tạo 2 tài khoản t_an_*/t_binh_* — KHÔNG chạy vào máy chủ thật 3200 (đã dính 06/10/2026: 10
// tài khoản rác trong aether.db). Bắt buộc thì đặt ALLOW_PROD=1.
import { WebSocket } from 'ws';
import type { CharacterInfo, ServerMessage } from '@aether/protocol';

const BASE = process.env.SERVER ?? 'http://localhost:3201';
if (/:3200(?!\d)/.test(BASE) && process.env.ALLOW_PROD !== '1') {
	console.error(`✘ ${BASE} là máy chủ THẬT — smoke test sẽ tạo tài khoản rác. Chạy vào máy chủ thử (mặc định :3201) hoặc đặt ALLOW_PROD=1.`);
	process.exit(1);
}
const stamp = Date.now().toString(36);

async function api<T>(path: string, method: string, body?: unknown, token?: string): Promise<{ status: number; data: T }> {
	const r = await fetch(BASE + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
	return { status: r.status, data: (await r.json()) as T };
}

function check(ok: boolean, what: string): void {
	console.log(`${ok ? '✔' : '✘'} ${what}`);
	if (!ok) process.exitCode = 1;
}

async function player(tag: string, gender: 'male' | 'female') {
	const reg = await api<{ token: string }>('/api/register', 'POST', { username: `t_${tag}_${stamp}`, password: 'secret123' });
	check(reg.status === 200, `${tag}: đăng ký`);
	const ch = await api<CharacterInfo>('/api/characters', 'POST', { name: `${tag} ${stamp}`.slice(0, 16), gender }, reg.data.token);
	check(ch.status === 200 && ch.data.gender === gender, `${tag}: tạo nhân vật ${gender}`);
	const ws = new WebSocket(BASE.replace('http', 'ws') + '/ws');
	const inbox: ServerMessage[] = [];
	ws.on('message', (m) => inbox.push(JSON.parse(String(m)) as ServerMessage));
	await new Promise((r) => ws.on('open', r));
	ws.send(JSON.stringify({ t: 'hello', token: reg.data.token, character: ch.data.id }));
	return { token: reg.data.token, ch: ch.data, ws, inbox };
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const a = await player('An', 'male');
const b = await player('Binh', 'female');
await wait(200);
a.ws.send(JSON.stringify({ t: 'move', x: 1000, y: 1000, dir: 'S', anim: 'idle', sprite: 'player_lior_child' }));
b.ws.send(JSON.stringify({ t: 'move', x: 1040, y: 1000, dir: 'W', anim: 'idle', sprite: 'player_lior_child' }));
await wait(300);
check(b.inbox.some((m) => m.t === 'join' && m.player.id === a.ch.id), 'B thấy A vào map');
a.ws.send(JSON.stringify({ t: 'move', x: 1020, y: 1000, dir: 'E', anim: 'walk', sprite: 'player_lior_child' }));
await wait(300);
check(b.inbox.some((m) => m.t === 'snapshot' && m.players.some((p) => p.id === a.ch.id && p.x === 1020)), 'B nhận vị trí mới của A');
a.ws.send(JSON.stringify({ t: 'move', x: 5000, y: 5000, dir: 'E', anim: 'walk', sprite: 'player_lior_child' }));
await wait(300);
check(!b.inbox.some((m) => m.t === 'snapshot' && m.players.some((p) => p.x === 5000)), 'Máy chủ chặn dịch chuyển gian lận');
const actions = () => b.inbox.filter((m): m is Extract<ServerMessage, { t: 'action' }> => m.t === 'action');
a.ws.send(JSON.stringify({ t: 'action', anim: 'cast', dir: 'E', skill: 'aether_bolt' }));
await wait(200);
check(actions().some((m) => m.id === a.ch.id && m.anim === 'cast' && m.dir === 'E'), 'B thấy A vung tay niệm phép (action cast/E)');
check(!a.inbox.some((m) => m.t === 'action'), 'Không dội động tác về chính người gửi');
a.ws.send(JSON.stringify({ t: 'action', anim: 'dance', dir: 'E' }));
a.ws.send(JSON.stringify({ t: 'action', anim: 'attack', dir: 'XX' }));
await wait(200);
check(actions().length === 1, 'Máy chủ bỏ động tác lạ / hướng lạ');
a.ws.send(JSON.stringify({ t: 'actionEnd' }));
await wait(200);
check(b.inbox.some((m) => m.t === 'actionEnd' && m.id === a.ch.id), 'B nhận tin A dừng động tác giữa chừng (actionEnd)');
check(!a.inbox.some((m) => m.t === 'actionEnd') && actions().length === 1, 'actionEnd không dội về người gửi, không thành một cú vung');
await wait(1100);
for (let i = 0; i < 20; i += 1) a.ws.send(JSON.stringify({ t: 'action', anim: 'attack', dir: 'S' }));
await wait(300);
const burst = actions().length - 1;
check(burst >= 1 && burst <= 8, `Giới hạn nhịp động tác: gửi 20 tin, B nhận ${burst} (≤ 8)`);
// Chuyển map: người ở map cũ thấy mình rời đi, mình nhận danh sách người của map mới; khác map thì không thấy nhau.
const mark = b.inbox.length;
a.ws.send(JSON.stringify({ t: 'map', map: 'human/mossvale' }));
await wait(200);
check(b.inbox.slice(mark).some((m) => m.t === 'leave' && m.id === a.ch.id), 'B thấy A rời map (sang rừng)');
check(a.inbox.some((m) => m.t === 'welcome' && m.players.length === 0), 'A nhận danh sách người ở rừng (chưa có ai)');
a.ws.send(JSON.stringify({ t: 'move', x: 168, y: 1056, dir: 'E', anim: 'idle', sprite: 'player_lior_child' }));
await wait(300);
check(!b.inbox.slice(mark).some((m) => (m.t === 'join' && m.player.id === a.ch.id) || (m.t === 'snapshot' && m.players.some((p) => p.id === a.ch.id))), 'Khác map thì B không thấy A đi lại');
a.ws.send(JSON.stringify({ t: 'map', map: '../../etc' }));
a.ws.send(JSON.stringify({ t: 'map', map: 'human/town' }));
await wait(200);
a.ws.send(JSON.stringify({ t: 'move', x: 2232, y: 1272, dir: 'W', anim: 'idle', sprite: 'player_lior_child' }));
await wait(300);
check(b.inbox.slice(mark).some((m) => m.t === 'join' && m.player.id === a.ch.id && m.player.x === 2232), 'A về thị trấn: B thấy A vào lại (vị trí đầu ở map mới đặt tự do)');
// Đồ gắn: A mặc kiếm + trượng hiếm → B thấy ngay (tin gear); gói sai dạng bị bỏ.
const gearMark = b.inbox.length;
a.ws.send(JSON.stringify({ t: 'gear', gear: ['', 'sword', 'staff:2', ''] }));
a.ws.send(JSON.stringify({ t: 'gear', gear: ['', '<script>', '', '', '', ''] }));
await wait(200);
const gears = b.inbox.slice(gearMark).filter((m): m is Extract<ServerMessage, { t: 'gear' }> => m.t === 'gear');
check(gears.length === 1 && gears[0]!.id === a.ch.id && gears[0]!.gear.join('|') === '|sword|staff:2|', 'B thấy đồ gắn A vừa mặc (gói sai dạng bị bỏ)');
a.ws.send(JSON.stringify({ t: 'chat', text: '  xin   chào  ' }));
await wait(200);
check(b.inbox.some((m) => m.t === 'chat' && m.text === 'xin chào'), 'B nhận chat của A (đã gọn khoảng trắng)');
a.ws.send(JSON.stringify({ t: 'save', progress: { level: 3, exp: 42, coins: 7, potions: 1, map: 'human/town', x: 1020, y: 1000, story: { index: 2 }, introSeen: true } }));
await wait(200);
const list = await api<CharacterInfo[]>('/api/characters', 'GET', undefined, a.token);
check(list.data[0]?.progress.level === 3 && list.data[0]?.progress.introSeen === true, 'Tiến độ đã lưu trên máy chủ');
const put = await api(`/api/characters/${a.ch.id}/progress`, 'PUT', { progress: { level: 4, exp: 1, coins: 0, potions: 0, map: 'human/town', x: -1, y: -1, story: null, introSeen: false } }, a.token);
const after = await api<CharacterInfo[]>('/api/characters', 'GET', undefined, a.token);
check(put.status === 200 && after.data[0]?.progress.level === 4 && after.data[0]?.progress.story === null, 'Lưu chắc qua HTTP (xoá tiến độ)');
const foreign = await api(`/api/characters/${a.ch.id}/progress`, 'PUT', { progress: { level: 99 } }, b.token);
check(foreign.status === 404, 'Không ghi được tiến độ nhân vật của người khác');
const dup = await api('/api/characters', 'POST', { name: a.ch.name.toUpperCase(), gender: 'male' }, b.token);
check(dup.status === 409, 'Chặn trùng tên nhân vật (không phân biệt hoa thường)');
const bad = await api('/api/login', 'POST', { username: `t_An_${stamp}`, password: 'sai' });
check(bad.status === 401, 'Sai mật khẩu bị từ chối');
a.ws.close();
await wait(200);
check(b.inbox.some((m) => m.t === 'leave' && m.id === a.ch.id), 'B thấy A rời game');
b.ws.close();

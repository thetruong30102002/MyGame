// Thử đầu–cuối phần xã hội với máy chủ THỬ đang bật (mặc định :3201 — KHÔNG chạy vào máy chủ thật 3200): 2 tài khoản mới
// đăng ký, tạo nhân vật, vào game qua WebSocket thật, kết bạn, nhắn riêng online + offline.
// `PORT=3201 AETHER_DB=<file tạm> npx tsx src/main.ts` rồi `npx tsx tests/social-e2e.ts`.
import assert from 'node:assert/strict';
import { WebSocket } from 'ws';
import type { CharacterInfo, ServerMessage } from '@aether/protocol';

const BASE = process.env.SERVER ?? 'http://localhost:3201';
if (/:3200(?!\d)/.test(BASE)) throw new Error('Không chạy vào máy chủ thật :3200');
const tag = Date.now().toString(36).slice(-5);
const post = async (path: string, body: unknown, token?: string) =>
	(await fetch(BASE + path, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) })).json();

async function player(user: string, name: string) {
	const auth = (await post('/api/register', { username: `e2e_${user}_${tag}`, password: 'matkhau123' })) as { token: string };
	const ch = (await post('/api/characters', { name: `${name} ${tag}`, gender: 'female' }, auth.token)) as CharacterInfo;
	const inbox: ServerMessage[] = [];
	const ws = new WebSocket(BASE.replace('http', 'ws') + '/ws');
	ws.on('message', (m) => inbox.push(JSON.parse(String(m)) as ServerMessage));
	await new Promise((r) => ws.on('open', r));
	ws.send(JSON.stringify({ t: 'hello', token: auth.token, character: ch.id }));
	const wait = async <T extends ServerMessage['t']>(t: T, ok: (m: Extract<ServerMessage, { t: T }>) => boolean = () => true) => {
		for (let i = 0; i < 100; i += 1) {
			const m = inbox.find((x): x is Extract<ServerMessage, { t: T }> => x.t === t && ok(x as Extract<ServerMessage, { t: T }>));
			if (m) return m;
			await new Promise((r) => setTimeout(r, 30));
		}
		throw new Error(`${name}: không nhận được ${t}`);
	};
	await wait('social');
	return { ch, ws, inbox, wait, send: (m: unknown) => ws.send(JSON.stringify(m)), token: auth.token };
}

const a = await player('a', 'Hoa');
const b = await player('b', 'Lan Anh');
a.send({ t: 'friendAdd', name: b.ch.name.toUpperCase() });
await b.wait('social', (m) => m.state.incoming.some((p) => p.id === a.ch.id));
b.send({ t: 'friendRespond', id: a.ch.id, accept: true });
const af = await a.wait('social', (m) => m.state.friends.some((p) => p.id === b.ch.id));
assert.equal(af.state.friends[0]!.online, true);
console.log('  ✔ mời theo tên (khác hoa thường) → đồng ý → thành bạn, thấy online');

a.send({ t: 'whisper', line: `${b.ch.name} chào nhé` });
const got = await b.wait('whisper');
assert.deepEqual([got.messages[0]!.fromName, got.messages[0]!.text], [a.ch.name, 'chào nhé']);
console.log('  ✔ /w với tên có khoảng trắng: người nhận online nhận ngay');

b.ws.close();
await a.wait('social', (m) => m.state.friends.some((p) => p.id === b.ch.id && !p.online));
a.send({ t: 'whisper', to: b.ch.id, text: 'lúc bạn offline' });
await a.wait('system', (m) => m.text.includes('offline'));
const b2ws = new WebSocket(BASE.replace('http', 'ws') + '/ws');
const b2inbox: ServerMessage[] = [];
b2ws.on('message', (m) => b2inbox.push(JSON.parse(String(m)) as ServerMessage));
await new Promise((r) => b2ws.on('open', r));
b2ws.send(JSON.stringify({ t: 'hello', token: b.token, character: b.ch.id }));
for (let i = 0; i < 100 && !b2inbox.some((m) => m.t === 'whisper'); i += 1) await new Promise((r) => setTimeout(r, 30));
const late = b2inbox.find((m): m is Extract<ServerMessage, { t: 'whisper' }> => m.t === 'whisper');
assert.equal(late?.messages[0]?.text, 'lúc bạn offline');
console.log('  ✔ bạn offline thì cất tin, vào lại game nhận được; bạn kia thấy chuyển offline');

a.ws.close();
b2ws.close();
console.log('✔ social-e2e');

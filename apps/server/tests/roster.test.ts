// Máy chủ/DB chỉ ở bộ nhớ, không chạm tài khoản thật.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { test } from 'node:test';
import { WebSocket, WebSocketServer } from 'ws';
import { PLAYER_MODELS, type CharacterInfo, type ServerMessage } from '@havenlord/protocol';
import { Store } from '../src/db.ts';
import { createApi, newProgress } from '../src/http.ts';
import { World } from '../src/world.ts';

test('30 lựa chọn được kiểm tra, lưu cố định và truyền đúng model qua mạng', async () => {
	const store = new Store(':memory:');
	const world = new World(store);
	const server = createServer((req, res) => void create(req, res));
	const create = createApi(store);
	const sockets = new WebSocketServer({ server, path: '/ws' });
	sockets.on('connection', ws => world.accept(ws));
	server.listen(0, '127.0.0.1');await once(server, 'listening');
	const port = (server.address() as { port: number }).port;
	const base = `http://127.0.0.1:${port}`;
	const clients: WebSocket[] = [];
	const entries: { token: string; character: CharacterInfo }[] = [];
	const post = async (token: string, body: unknown) => {
		const response = await fetch(base + '/api/characters', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
		return { status: response.status, data: await response.json() as CharacterInfo };
	};
	try {
		assert.equal(PLAYER_MODELS.length, 30);assert.equal(new Set(PLAYER_MODELS.map(m => m.id)).size, 30);
		for (const role of ['sword', 'staff', 'bow', 'spear', 'shield'])
			for (const gender of ['male', 'female']) assert.equal(PLAYER_MODELS.filter(m => m.classId === role && m.gender === gender).length, 3);
		for (const [i, model] of PLAYER_MODELS.entries()) {
			const account = store.createAccount(`roster_${i}`, 'not-a-real-password-hash')!;
			const token = `test-roster-token-${i}`;store.createSession(token, account, 60_000);
			const good = { name: `Roster ${i}`, gender: model.gender, modelId: model.id, classId: model.classId };
			assert.equal((await post(token, { ...good, gender: model.gender === 'male' ? 'female' : 'male' })).status, 400);
			assert.equal((await post(token, { ...good, classId: 'unknown' })).status, 400);
			assert.equal((await post(token, { ...good, modelId: '../player_integrated' })).status, 400);
			const created = await post(token, good);assert.equal(created.status, 200);
			assert.equal(created.data.modelId, model.id);assert.equal(created.data.classId, model.classId);
			assert.equal((await post(token, { ...good, name: `Another ${i}` })).status, 400);
			store.saveProgress(created.data.id, { ...newProgress(), story: { modelId: 'player_integrated', classId: 'other' } });
			const read = store.character(created.data.id, account)!;
			assert.equal(read.modelId, model.id);assert.equal(read.classId, model.classId);
			entries.push({ token, character: read });
		}
		const listen = async (entry: typeof entries[number]) => {
			const socket = new WebSocket(`ws://127.0.0.1:${port}/ws`);clients.push(socket);
			const inbox: ServerMessage[] = [];socket.on('message', v => inbox.push(JSON.parse(String(v))));
			await once(socket, 'open');socket.send(JSON.stringify({ t: 'hello', token: entry.token, character: entry.character.id }));
			await waitFor(() => inbox.some(v => v.t === 'welcome'));
			return { socket, inbox };
		};
		const a = await listen(entries[0]!);const b = await listen(entries[17]!);
		// Client giả mạo sprite khác: server luôn phát ngoại hình đã chọn.
		a.socket.send(JSON.stringify({ t: 'move', x: 1000, y: 1000, dir: 'E', anim: 'walk', sprite: 'mob_slime_001' }));
		await waitFor(() => b.inbox.some(v => v.t === 'join' && v.player.id === entries[0]!.character.id));
		const joined = b.inbox.find(v => v.t === 'join' && v.player.id === entries[0]!.character.id);
		assert(joined?.t === 'join');assert.equal(joined.player.sprite, entries[0]!.character.modelId);
		console.log('PASS 30 identities; 90 rejected mismatches; immutable saves; authoritative remote sprite');
	} finally {
		for (const socket of clients) socket.terminate();
		world.stop();for (const socket of sockets.clients) socket.terminate();
		await new Promise<void>(resolve => sockets.close(() => resolve()));
		await new Promise<void>(resolve => server.close(() => resolve()));store.close();
	}
});

async function waitFor(check: () => boolean): Promise<void> {
	const until = Date.now() + 5000;
	while (!check()) { if (Date.now() > until) throw new Error('Không nhận được tin mạng đúng hạn');await new Promise(resolve => setTimeout(resolve, 25)); }
}

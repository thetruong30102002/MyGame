// Khu của map (13/11/2026): người khác khu không thấy nhau; đổi khu là rời khu cũ, tải lại map thì gặp người khu mới.
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import type { ServerMessage } from '@havenlord/protocol';
import { CHANNEL_SOFT_CAP } from '@havenlord/sim/channels';
import { Store } from '../src/db.ts';
import { newProgress } from '../src/http.ts';
import { World } from '../src/world.ts';

test('khu: xếp khu khi vào, khác khu không thấy nhau, đổi khu rồi báo lại map thì gặp', () => {
	const dir = mkdtempSync(join(tmpdir(), 'havenlord-ch-'));
	const store = new Store(join(dir, 'c.db'));
	const world = new World(store, () => []);
	try {
		const join1 = (name: string) => {
			const acc = store.createAccount(name, 'x')!;
			store.createSession('tok_' + name, acc, 3600_000);
			const ch = store.createCharacter(`00000000-0000-0000-0000-0000000000${name}`, acc, 'Khu ' + name, 'male', { ...newProgress(), map: 'swamp/hub', x: 100, y: 100 })!;
			const got: ServerMessage[] = [];
			let onMsg: ((raw: unknown) => void) | null = null;
			const ws = { OPEN: 1, readyState: 1, send: (raw: string) => void got.push(JSON.parse(raw) as ServerMessage), close: () => undefined, on: (ev: string, cb: (raw: unknown) => void) => void (ev === 'message' && (onMsg = cb)) };
			world.accept(ws as never);
			const push = (m: unknown) => onMsg!(JSON.stringify(m));
			push({ t: 'hello', token: 'tok_' + name, character: ch.id });
			push({ t: 'move', x: 100, y: 100, dir: 'S', anim: 'idle', sprite: 'player_hero_adult' });
			const channel = () => got.filter((m): m is Extract<ServerMessage, { t: 'channel' }> => m.t === 'channel').at(-1)!;
			return { id: ch.id, got, push, channel };
		};
		const a = join1('a1');
		assert.equal(a.channel().channel, 1);
		assert.equal(a.channel().counts.length, 5);
		const b = join1('b2');
		assert.equal(b.channel().channel, 1, 'khu 1 chưa đông thì vào khu 1');
		assert(a.got.some((m) => m.t === 'join' && m.player.id === b.id), 'cùng khu thấy nhau');
		b.push({ t: 'channel', channel: 2 });
		assert.equal(b.channel().channel, 2);
		assert(a.got.some((m) => m.t === 'leave' && m.id === b.id), 'đổi khu: người khu cũ thấy rời đi');
		b.push({ t: 'map', map: 'swamp/hub' });
		const welcome = b.got.filter((m) => m.t === 'welcome').at(-1) as Extract<ServerMessage, { t: 'welcome' }>;
		assert.equal(welcome.players.length, 0, 'khu 2 chưa có ai');
		const n = a.got.length;
		b.push({ t: 'move', x: 120, y: 100, dir: 'S', anim: 'idle', sprite: 'player_hero_adult' });
		assert(!a.got.slice(n).some((m) => m.t === 'join'), 'khác khu không thấy nhau');
		b.push({ t: 'channel', channel: 9 });
		assert.equal(b.channel().channel, 2, 'khu không có thì bỏ');
		assert(CHANNEL_SOFT_CAP > 2);
	} finally {
		world.stop();
		store.close();
		rmSync(dir, { recursive: true, force: true });
	}
});

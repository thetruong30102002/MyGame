// Chạy: npx tsx tests/social.test.ts — bạn bè, lời mời, chặn, chat riêng (docs/ke-hoach-xa-hoi.md X1 + X2). Dùng CSDL SQLite
// THẬT trong thư mục tạm (kiểm luôn câu SQL) + socket giả, không cần máy chủ đang chạy.
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MAX_FRIENDS, type ServerMessage, type SocialState } from '@aether/protocol';
import { Store } from '../src/db.ts';
import { newProgress } from '../src/http.ts';
import { World } from '../src/world.ts';

let passed = 0;
const test = (name: string, fn: () => void): void => {
	fn();
	passed += 1;
	console.log(`  ✔ ${name}`);
};
console.log('social (máy chủ)');

class FakeWs {
	readonly OPEN = 1;
	readyState = 1;
	inbox: ServerMessage[] = [];
	private onMessage: ((raw: unknown) => void) | null = null;
	private onClose: (() => void) | null = null;
	on(ev: string, cb: (raw: unknown) => void): void {
		if (ev === 'message') this.onMessage = cb;
		if (ev === 'close') this.onClose = cb as () => void;
	}
	send(raw: string): void {
		this.inbox.push(JSON.parse(raw) as ServerMessage);
	}
	close(): void {
		this.readyState = 3;
		this.onClose?.();
	}
	push(msg: unknown): void {
		this.onMessage?.(JSON.stringify(msg));
	}
	of<T extends ServerMessage['t']>(t: T): Extract<ServerMessage, { t: T }>[] {
		return this.inbox.filter((m): m is Extract<ServerMessage, { t: T }> => m.t === t);
	}
	get social(): SocialState {
		const s = this.of('social').at(-1);
		assert.ok(s, 'có tin social');
		return s.state;
	}
	get said(): string {
		return this.of('system').at(-1)?.text ?? '';
	}
}

const dir = mkdtempSync(join(tmpdir(), 'aether-social-'));
const store = new Store(join(dir, 'social.db'));
const world = new World(store);
const ids: Record<string, string> = {};
const tokens: Record<string, string> = {};
for (const [i, name] of ['An', 'Bình Minh', 'Cường', 'Dũng'].entries()) {
	const acc = store.createAccount(`user${i}`, 'x')!;
	tokens[name] = `tok${i}`;
	store.createSession(tokens[name], acc, 3600_000);
	ids[name] = store.createCharacter(`00000000-0000-0000-0000-00000000000${i}`, acc, name, 'male', { ...newProgress(), level: 10 + i })!.id;
}
const join_ = (name: string): FakeWs => {
	const ws = new FakeWs();
	world.accept(ws as never);
	ws.push({ t: 'hello', token: tokens[name], character: ids[name] });
	return ws;
};

try {
	const a = join_('An');
	const b = join_('Bình Minh');

	test('vào game: nhận trạng thái xã hội rỗng ngay sau welcome', () => {
		assert.equal(a.inbox[0]!.t, 'welcome');
		assert.deepEqual(a.social, { friends: [], incoming: [], outgoing: [], blocked: [] });
	});

	test('mời theo TÊN (không phân biệt hoa thường, có khoảng trắng): hai bên thấy lời mời, người nhận được báo', () => {
		a.push({ t: 'friendAdd', name: 'bình minh' });
		assert.deepEqual(a.social.outgoing.map((p) => p.name), ['Bình Minh']);
		assert.deepEqual(b.social.incoming.map((p) => [p.name, p.online, p.level]), [['An', true, 10]]);
		assert.equal(b.social.incoming[0]!.map, undefined, 'người lạ không thấy map đang đứng');
		assert.match(b.said, /An muốn kết bạn/);
		a.push({ t: 'friendAdd', name: 'Bình Minh' });
		assert.match(a.said, /Đã gửi lời mời .* rồi/);
		a.push({ t: 'friendAdd', name: 'Không Có Ai' });
		assert.match(a.said, /Không tìm thấy nhân vật tên "Không Có Ai"/);
		a.push({ t: 'friendAdd', id: ids.An });
		assert.match(a.said, /chính mình/);
	});

	test('đồng ý: thành bạn hai chiều, thấy online + map; lời mời biến mất', () => {
		b.push({ t: 'friendRespond', id: ids.An, accept: true });
		assert.deepEqual(a.social.friends.map((p) => [p.name, p.online, p.map]), [['Bình Minh', true, 'human/town']]);
		assert.deepEqual(b.social.friends.map((p) => p.name), ['An']);
		assert.equal(a.social.outgoing.length + b.social.incoming.length, 0);
		assert.match(a.said, /Bình Minh đã đồng ý/);
		assert.ok(store.areFriends(ids.An!, ids['Bình Minh']!) && store.areFriends(ids['Bình Minh']!, ids.An!));
	});

	test('bạn đổi map / rời game: bạn kia được cập nhật map / offline', () => {
		b.push({ t: 'map', map: 'human/graveyard' });
		assert.equal(a.social.friends[0]!.map, 'human/graveyard');
		b.close();
		assert.deepEqual([a.social.friends[0]!.online, a.social.friends[0]!.map], [false, undefined]);
	});

	test('chat riêng tới bạn OFFLINE: cất lại, người gửi được báo; vào game thì nhận đủ, đúng thứ tự', () => {
		a.push({ t: 'whisper', to: ids['Bình Minh'], text: '  chào   bạn ' });
		a.push({ t: 'whisper', line: 'Bình Minh mai đi săn nhé' });
		assert.deepEqual(a.of('whisper').map((m) => m.messages[0]!.text), ['chào bạn', 'mai đi săn nhé'], 'bản của người gửi (đã gom khoảng trắng)');
		assert.match(a.said, /đang offline/);
		const b2 = join_('Bình Minh');
		const got = b2.of('whisper');
		assert.equal(got.length, 1, 'một gói lúc vào game');
		assert.deepEqual(got[0]!.messages.map((m) => [m.fromName, m.text]), [['An', 'chào bạn'], ['An', 'mai đi săn nhé']]);
		assert.equal(store.takeWhispers(ids['Bình Minh']!, 1e12).length, 0, 'giao xong thì xoá khỏi hàng chờ');
		// Online: giao ngay cho cả hai.
		b2.push({ t: 'whisper', line: 'an ok luôn' });
		assert.equal(b2.of('whisper').at(-1)!.messages[0]!.text, 'ok luôn');
		assert.deepEqual([a.of('whisper').at(-1)!.messages[0]!.fromName, a.of('whisper').at(-1)!.messages[0]!.text], ['Bình Minh', 'ok luôn']);
		b2.push({ t: 'whisper', line: 'Không Ai cả' });
		assert.match(b2.said, /Không tìm thấy tên đó/);
		b2.close();
	});

	const c = join_('Cường');
	test('chặn: huỷ bạn + lời mời hai chiều; người bị chặn không mời / nhắn được và KHÔNG biết mình bị chặn', () => {
		c.push({ t: 'friendAdd', id: ids.An });
		a.push({ t: 'block', id: ids['Cường'], on: true });
		assert.deepEqual(a.social.blocked.map((p) => p.name), ['Cường']);
		assert.equal(a.social.incoming.length, 0, 'lời mời của người bị chặn bị xoá');
		c.push({ t: 'friendAdd', id: ids.An });
		assert.equal(c.said, 'Không gửi được lời mời tới An.');
		const before = a.of('whisper').length;
		c.push({ t: 'whisper', to: ids.An, text: 'alo' });
		assert.equal(c.said, 'Không gửi được tin nhắn tới An.');
		assert.equal(a.of('whisper').length, before, 'An không nhận gì');
		a.push({ t: 'whisper', to: ids['Cường'], text: 'x' });
		assert.match(a.said, /Bạn đang chặn Cường/);
		a.push({ t: 'block', id: ids['Cường'], on: false });
		assert.equal(a.social.blocked.length, 0);
	});

	test('mời chéo: người kia đã mời mình thì mời lại = đồng ý; rút lời mời; huỷ bạn không báo người kia', () => {
		c.push({ t: 'friendAdd', id: ids.An });
		a.push({ t: 'friendAdd', name: 'Cường' });
		assert.ok(a.social.friends.some((p) => p.name === 'Cường'));
		const saidBefore = c.of('system').length;
		a.push({ t: 'friendRemove', id: ids['Cường'] });
		assert.ok(!c.social.friends.some((p) => p.name === 'An'));
		assert.equal(c.of('system').length, saidBefore, 'không báo người bị huỷ bạn');
		a.push({ t: 'friendAdd', id: ids['Dũng'] });
		assert.equal(a.social.outgoing.length, 1, 'mời người offline vẫn được');
		a.push({ t: 'friendRemove', id: ids['Dũng'] });
		assert.equal(a.social.outgoing.length, 0, 'rút lại lời mời');
		c.push({ t: 'friendRespond', id: ids.An, accept: true });
		assert.ok(!c.social.friends.some((p) => p.name === 'An'), 'không có lời mời thì "đồng ý" không làm gì');
	});

	test(`trần ${MAX_FRIENDS} bạn + chặn spam thao tác`, () => {
		const d = join_('Dũng');
		for (let i = 0; i < 25; i += 1) d.push({ t: 'friendAdd', name: 'Ai Đó' });
		assert.match(d.said, /nhanh quá/);
	});

	test('xoá nhân vật: tình bạn / lời mời / tin chờ của nó tự xoá theo (khoá ngoại)', () => {
		store.addFriendship(ids.An!, ids['Dũng']!);
		store.queueWhisper(ids.An!, ids['Dũng']!, 'hi', Date.now(), 200);
		store.deleteCharacter(ids['Dũng']!, 4);
		assert.ok(!store.friendIds(ids.An!).includes(ids['Dũng']!));
	});
} finally {
	world.stop();
	store.close();
	rmSync(dir, { recursive: true, force: true });
}
console.log(`${passed} test qua`);

// Chạy: npx tsx tests/chat.test.ts — kênh chat (docs/ke-hoach-xa-hoi.md mục 2): chat map chỉ tới người cùng map, kênh Thế giới
// tới mọi người online (cả map khác), cần cấp ≥ 10 và 1 tin / 10 giây. CSDL SQLite THẬT trong thư mục tạm + socket giả.
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WORLD_CHAT_LEVEL, type ServerMessage } from '@aether/protocol';
import { Store } from '../src/db.ts';
import { newProgress } from '../src/http.ts';
import { World } from '../src/world.ts';

let passed = 0;
const test = (name: string, fn: () => void): void => {
	fn();
	passed += 1;
	console.log(`  ✔ ${name}`);
};
console.log('chat (máy chủ)');

class FakeWs {
	readonly OPEN = 1;
	readyState = 1;
	inbox: ServerMessage[] = [];
	private onMessage: ((raw: unknown) => void) | null = null;
	on(ev: string, cb: (raw: unknown) => void): void {
		if (ev === 'message') this.onMessage = cb;
	}
	send(raw: string): void {
		this.inbox.push(JSON.parse(raw) as ServerMessage);
	}
	close(): void {
		this.readyState = 3;
	}
	push(msg: unknown): void {
		this.onMessage?.(JSON.stringify(msg));
	}
	chats(): Extract<ServerMessage, { t: 'chat' }>[] {
		return this.inbox.filter((m): m is Extract<ServerMessage, { t: 'chat' }> => m.t === 'chat');
	}
	get said(): string {
		return this.inbox.filter((m): m is Extract<ServerMessage, { t: 'system' }> => m.t === 'system').at(-1)?.text ?? '';
	}
}

const dir = mkdtempSync(join(tmpdir(), 'aether-chat-'));
const store = new Store(join(dir, 'c.db'));
const world = new World(store, () => []);
const people: [string, number, string][] = [
	['Cao Thủ', WORLD_CHAT_LEVEL, 'human/town'],
	['Bạn Cùng Map', 3, 'human/town'],
	['Ở Rừng', 20, 'human/mossvale'],
	['Tân Thủ', WORLD_CHAT_LEVEL - 1, 'human/mossvale'],
];
const ws: FakeWs[] = people.map(([name, level, map], i) => {
	const acc = store.createAccount(`c${i}`, 'x')!;
	store.createSession(`tok${i}`, acc, 3600_000);
	const id = store.createCharacter(`00000000-0000-0000-0000-0000000000d${i}`, acc, name, 'male', { ...newProgress(), level, map })!.id;
	const w = new FakeWs();
	world.accept(w as never);
	w.push({ t: 'hello', token: `tok${i}`, character: id });
	return w;
});
const [pro, mate, forest, newbie] = ws as [FakeWs, FakeWs, FakeWs, FakeWs];

try {
	test('chat map (mặc định, client cũ không ghi kênh): chỉ người cùng map nhận, không gắn kênh', () => {
		pro.push({ t: 'chat', text: 'chào  cả   làng' });
		assert.deepEqual([pro.chats().length, mate.chats().length, forest.chats().length], [1, 1, 0]);
		assert.equal(mate.chats()[0]!.text, 'chào cả làng');
		assert.equal(mate.chats()[0]!.ch, undefined);
	});

	test('kênh Thế giới: mọi người online nhận, kể cả ở map khác và người chưa đủ cấp', () => {
		pro.push({ t: 'chat', text: 'ai đi săn Vua Lich không?', ch: 'world' });
		for (const w of ws) assert.deepEqual(w.chats().at(-1)!.ch, 'world');
		assert.equal(forest.chats().at(-1)!.name, 'Cao Thủ');
	});

	test('chưa đủ cấp 10: không gửi được kênh Thế giới (chat map vẫn được)', () => {
		const before = forest.chats().length;
		newbie.push({ t: 'chat', text: 'mua bán acc', ch: 'world' });
		assert.match(newbie.said, /từ cấp 10/);
		assert.equal(forest.chats().length, before, 'không ai nhận');
		newbie.push({ t: 'chat', text: 'chào rừng' });
		assert.equal(forest.chats().at(-1)!.text, 'chào rừng');
	});

	test('1 tin / 10 giây ở kênh Thế giới; chat map không bị ảnh hưởng', () => {
		const before = mate.chats().length;
		pro.push({ t: 'chat', text: 'tin thứ hai liền', ch: 'world' });
		assert.match(pro.said, /mỗi 10 giây một tin/);
		assert.equal(mate.chats().length, before);
		pro.push({ t: 'chat', text: 'chat map vẫn đi' });
		assert.equal(mate.chats().at(-1)!.text, 'chat map vẫn đi');
	});
} finally {
	world.stop();
	store.close();
	rmSync(dir, { recursive: true, force: true });
}

console.log(`${passed} test qua`);

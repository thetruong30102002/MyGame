// Chạy: npx tsx tests/chat.test.ts — kênh chat (docs/ke-hoach-xa-hoi.md mục 2): chat map chỉ tới người cùng map, kênh Thế giới
// tới mọi người online (cả map khác), cấp nào cũng được, 1 tin / 10 giây và 3 kim cương / tin. CSDL SQLite THẬT trong thư mục tạm + socket giả.
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WORLD_CHAT_DIAMONDS, type ServerMessage } from '@havenlord/protocol';
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
	['Cao Thủ', 10, 'human/town'],
	['Bạn Cùng Map', 3, 'human/town'],
	['Ở Rừng', 20, 'human/mossvale'],
	['Tân Thủ', 1, 'human/mossvale'],
];
const ids: string[] = [];
const ws: FakeWs[] = people.map(([name, level, map], i) => {
	const acc = store.createAccount(`c${i}`, 'x')!;
	store.createSession(`tok${i}`, acc, 3600_000);
	const id = store.createCharacter(`00000000-0000-0000-0000-0000000000d${i}`, acc, name, 'male', { ...newProgress(), level, map })!.id;
	ids.push(id);
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

	test('kênh Thế giới tốn 3 kim cương: chưa đủ thì không gửi, không ai nhận', () => {
		pro.push({ t: 'chat', text: 'chưa có tiền', ch: 'world' });
		assert.match(pro.said, /tốn 3 kim cương/);
		assert.equal(forest.chats().length, 0);
		store.addDiamonds(ids[0]!, 7, 'admin:thử');
	});

	test('kênh Thế giới: mọi người online nhận, kể cả ở map khác và người cấp thấp; trừ 3 kim cương + báo ví', () => {
		pro.push({ t: 'chat', text: 'ai đi săn Vua Lich không?', ch: 'world' });
		assert.equal(store.diamonds(ids[0]!), 7 - WORLD_CHAT_DIAMONDS);
		assert.equal(store.diamondLedger(ids[0]!, 1)[0]!.reason, 'chat:world');
		const wallet = pro.inbox.filter((m): m is Extract<ServerMessage, { t: 'wallet' }> => m.t === 'wallet').at(-1);
		assert.equal(wallet?.diamonds, 4, 'ví mới gửi về cho người chat');
		for (const w of ws) assert.deepEqual(w.chats().at(-1)!.ch, 'world');
		assert.equal(forest.chats().at(-1)!.name, 'Cao Thủ');
	});

	test('cấp nào cũng chat kênh Thế giới được (chủ dự án bỏ điều kiện cấp 10) — chỉ cần đủ kim cương', () => {
		newbie.push({ t: 'chat', text: 'tân thủ cấp 1 chào cả server', ch: 'world' });
		assert.match(newbie.said, /tốn 3 kim cương/, 'chưa có kim cương');
		store.addDiamonds(ids[3]!, 3, 'admin:thử');
		newbie.push({ t: 'chat', text: 'tân thủ cấp 1 chào cả server', ch: 'world' });
		assert.equal(mate.chats().at(-1)!.text, 'tân thủ cấp 1 chào cả server', 'người ở map khác nhận');
		assert.equal(store.diamonds(ids[3]!), 0);
		newbie.push({ t: 'chat', text: 'chào rừng' });
		assert.equal(forest.chats().at(-1)!.text, 'chào rừng', 'chat map vẫn như cũ');
	});

	test('1 tin / 10 giây ở kênh Thế giới; chat map không bị ảnh hưởng', () => {
		const before = mate.chats().length;
		pro.push({ t: 'chat', text: 'tin thứ hai liền', ch: 'world' });
		assert.match(pro.said, /mỗi 10 giây một tin/);
		assert.equal(store.diamonds(ids[0]!), 4, 'bị chặn vì nhịp: không trừ kim cương');
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

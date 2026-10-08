// Chạy: npx tsx tests/chattabs.test.ts — thẻ kênh của khung chat (docs/ke-hoach-xa-hoi.md mục 2): tin nào hiện ở thẻ nào, đếm tin
// chưa đọc, dòng gõ ở thẻ nào đi kênh nào.
import assert from 'node:assert/strict';
import { inTab, lineChannel, routeLine, unread } from '../src/components/chatTabs';
import type { ChatLine } from '../src/store/useSession';

const line = (id: number, o: Partial<ChatLine> = {}): ChatLine => ({ id, name: 'A', text: 'x', self: false, at: 0, ...o });
const lines: ChatLine[] = [
	line(1),
	line(2, { ch: 'world' }),
	line(3, { whisper: 'in' }),
	line(4, { system: true, name: '' }),
	line(5, { ch: 'world', self: true }),
	line(6, { ch: 'world' }),
];

assert.deepEqual(lines.map(lineChannel), ['map', 'world', 'whisper', 'system', 'world', 'world']);
assert.deepEqual(lines.filter((l) => inTab(l, 'world')).map((l) => l.id), [2, 4, 5, 6], 'thông báo hệ thống hiện ở mọi thẻ');
assert.deepEqual(lines.filter((l) => inTab(l, 'map')).map((l) => l.id), [1, 4], 'tin không ghi kênh = chat map');
assert.equal(lines.filter((l) => inTab(l, 'all')).length, 6);
assert.equal(unread(lines, 'world', 0), 2, 'không đếm tin của mình');
assert.equal(unread(lines, 'world', 2), 1, 'chỉ đếm tin mới hơn mốc đã xem');
assert.equal(unread(lines, 'whisper', 0), 1);
assert.equal(unread(lines, 'all', 0), 0);

assert.deepEqual(routeLine('chào', 'all'), { ch: 'map', text: 'chào' });
assert.deepEqual(routeLine('chào', 'world'), { ch: 'world', text: 'chào' });
assert.deepEqual(routeLine('/g  ai đi boss', 'map'), { ch: 'world', text: 'ai đi boss' }, '/g từ thẻ nào cũng lên Thế giới');
assert.ok('hint' in routeLine('/g', 'all'));
assert.ok('hint' in routeLine('chào', 'whisper'), 'thẻ Riêng chưa chọn người: nhắc cách nhắn');
assert.deepEqual(routeLine('/gg', 'all'), { ch: 'map', text: '/gg' }, 'chỉ đúng lệnh /g');

console.log('✔ chattabs.test: lọc tin theo thẻ, tin hệ thống ở mọi thẻ, đếm chưa đọc, gửi theo thẻ + /g');

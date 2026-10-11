// Chạy: npx tsx tests/focus.test.ts — luật chọn mục tiêu (`src/game/combat/focus.ts`): bấm trúng, gần nhất trong tầm, Tab xoay
// vòng gần → xa, tự bỏ khi chết / ra xa, điểm nhắm (đất = chân, bắn = giữa thân). Không cần trình duyệt.
import assert from 'node:assert/strict';
import { FOCUS_AUTO_RANGE, FOCUS_DROP_RANGE, focusAim, focusAt, focusCycle, focusKept, focusNearest, type FocusCandidate } from '../src/game/combat/focus';

const a = { n: 'a' };
const b = { n: 'b' };
const c = { n: 'c' };
const cands: FocusCandidate[] = [
	{ key: a, x: 100, y: 100, h: 60 },
	{ key: b, x: 300, y: 100, h: 60 },
	{ key: c, x: 120, y: 120, h: 60 },
];

// Bấm trúng: trong bề ngang thân, từ dưới chân một chút tới trên đầu; chồng nhau lấy con đứng trước (y lớn).
assert.equal(focusAt(cands, 300, 70), b);
assert.equal(focusAt(cands, 300, 20), null, 'trên đầu quá xa');
assert.equal(focusAt(cands, 200, 80), null, 'đất trống');
assert.equal(focusAt(cands, 110, 90), c, 'a và c chồng nhau → c (đứng trước)');

// Gần nhất trong tầm.
assert.equal(focusNearest(cands, 0, 100), a);
assert.equal(focusNearest(cands, 300 + FOCUS_AUTO_RANGE + 1, 100), null);

// Tab: gần → xa rồi quay vòng; mục tiêu cũ không còn trong tầm thì về cái gần nhất.
assert.equal(focusCycle(cands, null, 100, 100), a);
assert.equal(focusCycle(cands, a, 100, 100), c);
assert.equal(focusCycle(cands, c, 100, 100), b);
assert.equal(focusCycle(cands, b, 100, 100), a);
assert.equal(focusCycle([], a, 0, 0), null);

// Giữ mục tiêu: mất khỏi danh sách (chết) hoặc ra quá xa thì bỏ.
assert.equal(focusKept(cands, b, 100, 100)?.key, b);
assert.equal(focusKept(cands.filter((x) => x.key !== b), b, 100, 100), null);
assert.equal(focusKept(cands, b, 300 + FOCUS_DROP_RANGE + 1, 100), null);
assert.equal(focusKept(cands, null, 0, 0), null);

// Điểm nhắm.
assert.deepEqual(focusAim(cands[0]!, true), { x: 100, y: 100 });
assert.deepEqual(focusAim(cands[0]!, false), { x: 100, y: 70 });
assert.deepEqual(focusAim({ key: a, x: 0, y: 200, h: 120 }, false), { x: 0, y: 154 });

console.log('focus: ok');

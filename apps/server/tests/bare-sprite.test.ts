// Chạy: npx tsx tests/bare-sprite.test.ts — hình phát cho người khác (06/11/2026): luôn là mẫu đã chọn, trừ bản tháo áo CỦA CHÍNH mẫu đó
// (`<mẫu>_bare`, ô Áo trống → thân nền vẫn đeo vũ khí class). Không cho mượn hình mẫu khác / bản tháo áo của mẫu khác.
import assert from 'node:assert/strict';
import { bareOrModel } from '../src/world.ts';

const m = 'player_npc_human1_sword_m';
assert.equal(bareOrModel(m, m), m);
assert.equal(bareOrModel(m, `${m}_bare`), `${m}_bare`);
assert.equal(bareOrModel(m, 'player_npc_elf1_bow_f'), m, 'không mượn hình mẫu khác');
assert.equal(bareOrModel(m, 'player_npc_elf1_bow_f_bare'), m, 'không mượn bản tháo áo của mẫu khác');
assert.equal(bareOrModel(m, undefined), m);
assert.equal(bareOrModel(m, 42), m);
console.log('PASS bare-sprite: chỉ nhận mẫu đã chọn hoặc bản tháo áo của chính nó');

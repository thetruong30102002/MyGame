// Phần LUẬT THUẦN tách từ apps/web/tests/enchant.test.ts (11/10/2026, chuẩn bị xoá bản web): chỉ hàm của @aether/sim (+ bảng hình
// tạm `UnityGame/Tools~/data/tempArt.ts`). Phần chạy CombatSystem của web bỏ cùng bản web — client Unity có test C# + vector riêng.
// Chạy: npx tsx tests/enchant.test.ts (trong packages/sim) hoặc `npm test -w @aether/sim`.
// Chạy: npx tsx tests/enchant.test.ts — phủ phép Kiếm theo mốc nguyên tố (kế hoạch 2.3): phần THÊM ngoài việc đòn kiếm
// mang hệ — Hoả 7 nổ nhát 3, Thuỷ hút 3% / 6%, Phong tầm +25% + đẩy + lưỡi gió (7), Băng cộng dồn 3 / 2 nhát → đóng băng,
// Thổ 7 choáng lâu hơn. Phủ Thổ mốc 5 (phá giáp + nhát 3 choáng) ở tests/elements.test.ts.
import assert from 'node:assert/strict';
import { EARTH_ENCHANT, ENCHANT_FX, frostStack } from '../src/skillRules.ts';
import { ENCHANT_UP_TIER, enchantDesc } from '../src/talents.ts';

const near = (a: number, b: number, what: string, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${what}: ${a} ≠ ${b}`);

// 1) Luật thuần: cộng dồn băng + mô tả theo mốc.
{
	assert.equal(ENCHANT_UP_TIER, 7);
	let st = { n: 0, at: -99 };
	const step = (now: number, need: number) => {
		const r = frostStack(st, now, need);
		st = { n: r.n, at: now };
		return r.freeze;
	};
	assert.deepEqual([step(0, 3), step(1, 3), step(2, 3)], [false, false, true], 'mốc 5: nhát thứ 3 đóng băng');
	assert.equal(st.n, 0, 'đóng băng xong đếm lại');
	assert.deepEqual([step(10, 3), step(14, 3), step(15, 3), step(16, 3)], [false, false, false, true], 'cách quá 3s: đếm lại từ 1');
	assert.deepEqual([step(30, 2), step(31, 2)], [false, true], 'mốc 7: 2 nhát');
	assert.match(enchantDesc('fire', 5), /^Gây cháy\.$/);
	assert.match(enchantDesc('fire', 7), /Nhát thứ 3 liên tiếp nổ/);
	assert.match(enchantDesc('water', 5), /hút 3%/);
	assert.match(enchantDesc('water', 7), /hút 6%/);
	assert.match(enchantDesc('wind', 5), /\+25%/);
	assert.doesNotMatch(enchantDesc('wind', 5), /lưỡi gió/);
	assert.match(enchantDesc('wind', 7), /lưỡi gió/);
	assert.match(enchantDesc('ice', 5), /trúng 3 nhát/);
	assert.match(enchantDesc('ice', 7), /trúng 2 nhát/);
	assert.match(enchantDesc('earth', 5), /choáng 0,5 giây/);
	assert.match(enchantDesc('earth', 7), /choáng 0,9 giây/);
}

console.log('✔ enchant.test (sim): phần luật');

// Phần LUẬT THUẦN tách từ apps/web/tests/level.test.ts (11/10/2026, chuẩn bị xoá bản web): chỉ hàm của @havenlord/sim (+ bảng hình
// tạm `UnityGame/Tools~/data/tempArt.ts`). Phần chạy CombatSystem của web bỏ cùng bản web — client Unity có test C# + vector riêng.
// Chạy: npx tsx tests/level.test.ts (trong packages/sim) hoặc `npm test -w @havenlord/sim`.
// Chạy: npx tsx tests/level.test.ts — trần cấp 100 (chốt 08/10/2026): đường EXP (giữ nguyên tới cấp 10, mềm sau đó), điểm
// tiềm năng + Tia Aether dừng ở cấp 40, nạp bản lưu (kẹp cấp, EXP thừa), nhận EXP không vượt cấp 100.
import assert from 'node:assert/strict';
import { MAX_LEVEL } from '@havenlord/protocol';
import { baseExpForLevel, cleanLevel, EXP_CURVE_KNEE, EXP_PACE, expForLevel, expPace } from '../src/skills.ts';
import { aetherScale, pointsForLevel, TALENT_LEVEL_CAP } from '../src/talents.ts';

// 1) Đường EXP gốc: cấp ≤ 10 y như cũ; trên 10 tăng đều, không nổ số. EXP cần = gốc × nhịp `EXP_PACE` (11/10/2026 — "lên cấp quá
// nhanh"): cấp 1–5 không đổi (vùng 1 cân theo), 6–10 ×1,5, từ 11 ×2,5.
{
	for (let lv = 1; lv <= EXP_CURVE_KNEE; lv += 1) assert.equal(baseExpForLevel(lv), Math.round(100 * 1.5 ** (lv - 1)), `cấp ${lv} giữ đường gốc`);
	for (let lv = 1; lv <= 5; lv += 1) assert.equal(expForLevel(lv), baseExpForLevel(lv), `cấp ${lv} không đổi nhịp`);
	assert.equal(expPace(6), 1.5);
	assert.equal(expPace(11), 2.5);
	assert.equal(EXP_PACE[0]![0], 1);
	assert.equal(expForLevel(10), Math.round(3844 * 1.5));
	for (let lv = 2; lv < 100; lv += 1) assert.ok(expForLevel(lv) > expForLevel(lv - 1), `cấp ${lv} cần nhiều hơn cấp trước`);
	assert.ok(baseExpForLevel(11) / baseExpForLevel(10) < 1.5, 'qua cấp 10 dốc mềm hơn');
	assert.ok(expForLevel(99) > 3e6 && expForLevel(99) < 5e6, `cấp 99 ≈ 3,8 triệu (${expForLevel(99)})`);
	assert.ok(Number.isSafeInteger(expForLevel(MAX_LEVEL)));
}

// 2) Điểm tiềm năng + Tia Aether dừng ở cấp 40.
{
	assert.equal(TALENT_LEVEL_CAP, 40);
	assert.equal(pointsForLevel(41), pointsForLevel(40));
	assert.equal(pointsForLevel(100), 47);
	assert.ok(Math.abs(aetherScale(40) - 2.17) < 1e-9);
	assert.equal(aetherScale(100), aetherScale(40));
}

// 3) Nạp bản lưu: kẹp cấp 1–100; EXP thừa (bản lưu của đường cũ / sửa tay) giữ sát mốc lên cấp; cấp 100 thì EXP 0.
{
	assert.deepEqual(cleanLevel(5, 100, MAX_LEVEL), { level: 5, exp: 100 });
	assert.deepEqual(cleanLevel(12, 999_999, MAX_LEVEL), { level: 12, exp: expForLevel(12) - 1 }, 'không tự nhảy nhiều cấp');
	assert.deepEqual(cleanLevel(150, 5, MAX_LEVEL), { level: 100, exp: 0 });
	assert.deepEqual(cleanLevel(0, -5, MAX_LEVEL), { level: 1, exp: 0 });
	assert.deepEqual(cleanLevel(Number.NaN, Number.NaN, MAX_LEVEL), { level: 1, exp: 0 });
}

console.log('✔ level.test (sim): phần luật');

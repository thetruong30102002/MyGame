// Chạy: npx tsx tests/level.test.ts — trần cấp 100 (chốt 08/10/2026): đường EXP (giữ nguyên tới cấp 10, mềm sau đó), điểm
// tiềm năng + Tia Aether dừng ở cấp 40, nạp bản lưu (kẹp cấp, EXP thừa), nhận EXP không vượt cấp 100.
import assert from 'node:assert/strict';
import { MAX_LEVEL } from '@aether/protocol';
import { cleanLevel, EXP_CURVE_KNEE, expForLevel } from '../src/game/combat/skills';
import { aetherScale, pointsForLevel, TALENT_LEVEL_CAP } from '../src/game/combat/talents';

// 1) Đường EXP: cấp ≤ 10 y như cũ; trên 10 tăng đều, không nổ số; cấp 99 vừa phải.
{
	for (let lv = 1; lv <= EXP_CURVE_KNEE; lv += 1) assert.equal(expForLevel(lv), Math.round(100 * 1.5 ** (lv - 1)), `cấp ${lv} giữ đường cũ`);
	assert.equal(expForLevel(10), 3844);
	for (let lv = 2; lv < MAX_LEVEL; lv += 1) assert.ok(expForLevel(lv) > expForLevel(lv - 1), `cấp ${lv} cần nhiều hơn cấp trước`);
	assert.ok(expForLevel(11) / expForLevel(10) < 1.5, 'qua cấp 10 dốc mềm hơn');
	assert.ok(expForLevel(99) > 1e6 && expForLevel(99) < 2e6, `cấp 99 ≈ 1,5 triệu (${expForLevel(99)})`);
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

// 4) Trong trận: nhận EXP lên nhiều cấp một lần nhưng dừng đúng 100; ở 100 thì không nhận thêm.
{
	const fakeCtx = new Proxy({}, { get: () => () => undefined, set: () => true });
	class FakeCanvas {
		width = 1;
		height = 1;
		style = {};
		getContext() {
			return fakeCtx;
		}
	}
	Object.assign(globalThis, { HTMLCanvasElement: FakeCanvas, document: { createElement: () => new FakeCanvas() }, window: globalThis });
	const { Container, Texture } = await import('pixi.js');
	const { Actor } = await import('../src/game/entities/Actor');
	const { CombatSystem } = await import('../src/game/combat/CombatSystem');
	type Dir = import('../src/game/assets/AssetManifest').Direction;
	const DIRS: Dir[] = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'];
	const strip = (n: number) => Array.from({ length: n }, () => new Texture());
	const anims = { idle: Object.fromEntries(DIRS.map((d) => [d, strip(4)])) } as Record<string, Partial<Record<Dir, InstanceType<typeof Texture>[]>>>;
	const tex = {
		id: 'test',
		entry: { displayName: 'Thử', role: 'player', atlas: '', frameSize: { width: 64, height: 64 }, anchor: { x: 0.5, y: 0.9 }, animations: { idle: { fps: 6 } }, source: { provider: 'test', ref: null }, bodyHeight: 60 },
		frames: (anim: string, dir: Dir) => anims[anim]?.[dir] ?? anims.idle!.S!,
		has: (anim: string) => !!anims[anim],
		hasDir: () => false,
		actionFrames: () => null,
	} as never;
	const vfx = { ground: new Container(), top: new Container(), play: () => undefined, frames: () => [], update: () => undefined, clear: () => undefined };
	const ups: number[] = [];
	const hooks = { mover: () => undefined, shake: () => undefined, toast: () => undefined, enemyKilled: () => undefined, bossNear: () => false, playerRespawn: () => ({ x: 0, y: 0 }), isUnlocked: () => true, practiceHit: () => undefined, levelUp: (l: number) => void ups.push(l) };
	const combat = new CombatSystem(hooks as never, { level: 97, exp: 0, coins: 0, potions: 0 }, vfx as never);
	combat.setPlayer(new Actor('hero', tex, 0, 0, 'S', null));
	combat.grantExp(1e9);
	assert.deepEqual([combat.pc.level, combat.pc.exp, ups], [100, 0, [98, 99, 100]], 'dừng ở 100, EXP về 0');
	combat.grantExp(500);
	assert.deepEqual([combat.pc.level, combat.pc.exp], [100, 0], 'cấp 100 không nhận thêm EXP');
	const old = new CombatSystem(hooks as never, { level: 140, exp: 7, coins: 0, potions: 0 }, vfx as never);
	assert.deepEqual([old.pc.level, old.pc.exp], [100, 0], 'bản lưu quá trần → 100');
}

console.log('✔ level.test: đường EXP (cũ tới 10, mềm sau đó), điểm + Tia Aether dừng ở 40, nạp bản lưu kẹp cấp / EXP thừa, lên cấp dừng đúng 100');

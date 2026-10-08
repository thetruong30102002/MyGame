// Chạy: npx tsx tests/moves.test.ts — kiểm khung động tác riêng của skill (Mốc 1 kế hoạch vẽ): đủ tên, khớp pipeline / mạng, chưa có hình
// thì dùng động tác sẵn có, có hình thì phát đúng động tác (Trảm theo chuỗi 3 nhát).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

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
const { ACTION_ANIMS } = await import('@aether/protocol');
const { MOVES, SKILL_MOVE, SLASH_COMBO, COMBO_WINDOW, wieldOf } = await import('@aether/sim/moves');
const { HERO_SKILLS } = await import('../src/game/combat/skills');
const { stanceAfter } = await import('../src/game/gearLayers');
const { Actor } = await import('../src/game/entities/Actor');
const { CombatSystem } = await import('../src/game/combat/CombatSystem');
type Entry = import('../src/game/assets/AssetManifest').CharacterManifestEntry;
type Textures = import('../src/game/assets/AssetManifest').CharacterTextures;
type Dir = import('../src/game/assets/AssetManifest').Direction;

// 1) Dữ liệu: mỗi tên động tác có trong mạng (ACTION_ANIMS), pipeline (ANIMATIONS) và bảng MOVES; tên chỉ a–z (khung atlas).
{
	const ids = MOVES.map((m) => m.id as string);
	assert.deepEqual([...ids].sort(), [...ACTION_ANIMS].sort(), 'MOVES và ACTION_ANIMS cùng một danh sách');
	for (const id of ids) assert.match(id, /^[a-z]+$/, `${id}: tên khung atlas <động tác>_<hướng>_<số> chỉ đọc được chữ a–z`);
	const pipeline = readFileSync(new URL('../../../packages/asset-pipeline/src/providers/types.ts', import.meta.url), 'utf8');
	const list = /export const ANIMATIONS = \[([^\]]*)\]/.exec(pipeline)?.[1] ?? '';
	for (const id of ids) assert.ok(list.includes(`'${id}'`), `${id}: pipeline nhận được animation này (providers/types.ts ANIMATIONS)`);
	for (const s of HERO_SKILLS) {
		if (!s.anim || s.id === 'slash') continue;
		const move = SKILL_MOVE[s.id];
		assert.ok(move, `${s.name}: có động tác riêng trong SKILL_MOVE`);
		const w = wieldOf(move);
		// Động tác riêng giữ đúng thế cầm của động tác sẵn có (chém → kiếm, niệm → gậy); lướt ngang không đổi thế.
		if (w) assert.equal(w, s.anim === 'attack' ? 'melee' : 'magic', `${s.name}: ${move} cùng thế cầm với ${s.anim}`);
	}
	for (const id of Object.keys(SKILL_MOVE)) assert.ok(HERO_SKILLS.some((s) => s.id === id), `SKILL_MOVE.${id} là skill thật`);
	assert.equal(stanceAfter('thrust', 'magic'), 'melee', 'đâm tới → cầm kiếm');
	assert.equal(stanceAfter('skycall', 'melee'), 'magic', 'gọi trời → cầm gậy');
	assert.equal(stanceAfter('drink', 'magic'), 'magic', 'uống bình giữ thế cũ');
	assert.equal(stanceAfter('walk', 'melee'), 'melee');
}

// 2) Nhân vật giả: `extra` = động tác riêng đã vẽ (mọi hướng chính).
const DIRS: Dir[] = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'];
const strip = (n: number) => Array.from({ length: n }, () => new Texture());
function fakeTextures(extra: string[]): Textures {
	const anims: Record<string, Partial<Record<Dir, InstanceType<typeof Texture>[]>>> = {
		idle: Object.fromEntries(DIRS.map((d) => [d, strip(4)])),
		walk: Object.fromEntries(DIRS.map((d) => [d, strip(6)])),
	};
	const entry: Entry = {
		displayName: 'Thử',
		role: 'player',
		atlas: '',
		frameSize: { width: 64, height: 64 },
		anchor: { x: 0.5, y: 0.9 },
		animations: { idle: { fps: 6 }, walk: { fps: 10 } },
		source: { provider: 'test', ref: null },
		bodyHeight: 60,
	};
	for (const a of ['attack', 'cast', ...extra]) {
		anims[a] = { E: strip(6), W: strip(6), N: strip(6), S: strip(6) };
		(entry.animations as Record<string, unknown>)[a] = { fps: 20, frames: 6, loop: false, directions: ['E', 'W', 'N', 'S'] };
	}
	const actionFrames = (anim: string, dir: Dir) => anims[anim]?.[dir] ?? null;
	return {
		id: 'test',
		entry,
		frames: (anim, dir) => anims[anim]?.[dir] ?? anims.idle!.S!,
		has: (anim) => !!anims[anim],
		hasDir: (anim, dir) => actionFrames(anim, dir) !== null,
		actionFrames,
		frameInfo: () => undefined,
	};
}

function setup(extra: string[]) {
	const vfx = { ground: new Container(), top: new Container(), play: () => undefined, frames: () => [], update: () => undefined, clear: () => undefined };
	const sent: string[] = [];
	const combat = new CombatSystem(
		{
			mover: () => undefined,
			shake: () => undefined,
			toast: () => undefined,
			enemyKilled: () => undefined,
			bossNear: () => false,
			playerRespawn: () => ({ x: 0, y: 0 }),
			isUnlocked: () => true,
			practiceHit: () => undefined,
			onAction: (anim) => void sent.push(anim),
			onActionEnd: () => undefined,
		},
		{ level: 1, exp: 0, coins: 0, potions: 3 },
		vfx as never,
	);
	const p = new Actor('hero', fakeTextures(extra), 40, 100, 'S', null);
	combat.setPlayer(p);
	combat.addDummy(100, 100);
	const east = { x: 100, y: 100 - p.chest };
	const tick = (n = 1, dt = 1 / 60) => {
		for (let i = 0; i < n; i += 1) {
			p.update(dt);
			combat.update(dt, (x, y) => ({ x, y }), 2);
		}
	};
	const idx = (id: string) => HERO_SKILLS.findIndex((s) => s.id === id);
	const cast = (id: string) => {
		combat.pc.mp = combat.pc.mpMax;
		combat.pc.cooldowns.clear();
		const r = combat.cast(idx(id), east);
		tick(30); // động tác xong hẳn
		return r;
	};
	return { combat, p, sent, tick, cast };
}

// 3) Hôm nay: atlas chỉ có attack / cast → skill dùng động tác sẵn có, Trảm chém lặp `attack`.
{
	const { sent, cast } = setup([]);
	cast('slash');
	cast('slash');
	cast('fire_bolt');
	cast('aether_bolt');
	assert.deepEqual(sent, ['attack', 'attack', 'cast', 'cast'], 'chưa vẽ động tác riêng thì dùng động tác sẵn có');
}

// 4) Có hình PixelLab: Trảm đi chuỗi 3 nhát (bấm trong cửa sổ), quá cửa sổ thì về nhát đầu; Hoả Cầu vung tay phóng.
{
	const { sent, cast, tick } = setup(['backslash', 'thrust', 'throw']);
	for (let i = 0; i < 4; i += 1) cast('slash');
	assert.deepEqual(sent, [...SLASH_COMBO, 'attack'], 'chuỗi đòn kiếm vòng lại nhát đầu');
	sent.length = 0;
	tick(Math.ceil((COMBO_WINDOW + 0.2) * 60));
	cast('slash');
	assert.deepEqual(sent, ['attack'], 'dừng lâu thì về nhát đầu');
	sent.length = 0;
	cast('fire_bolt');
	cast('aether_bolt');
	assert.deepEqual(sent, ['throw', 'throw'], 'đã vẽ thì phát động tác riêng (vung tay phóng phép)');
}

// 5) Động tác phụ: uống bình / trúng đòn chỉ phát khi atlas đã vẽ.
{
	const a = setup([]);
	a.combat.pc.hp = 10;
	a.combat.usePotion();
	assert.deepEqual(a.sent, [], 'chưa vẽ drink thì không phát gì');
	const b = setup(['drink']);
	b.combat.pc.hp = 10;
	b.combat.usePotion();
	assert.deepEqual(b.sent, ['drink'], 'có drink thì uống bình có động tác');
	assert.ok(b.p.view.busy, 'đang phát động tác uống');
}

console.log('moves: ok');

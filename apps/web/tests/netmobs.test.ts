// Chạy: npx tsx tests/netmobs.test.ts — quái dùng chung phía client (M3.2): con rối đi theo vị trí máy chủ, không tự đánh,
// đòn trúng báo máy chủ (không tự gục), gục / thưởng theo máy chủ, xin làm chủ khi người chơi lại gần, làm chủ thì AI chạy.
import assert from 'node:assert/strict';

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
const { ENEMY_STATS } = await import('../src/game/combat/skills');
type Dir = import('../src/game/assets/AssetManifest').Direction;
type Fighter = import('../src/game/combat/CombatSystem').Fighter;

const DIRS: Dir[] = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'];
const strip = (n: number) => Array.from({ length: n }, () => new Texture());
const anims = { idle: Object.fromEntries(DIRS.map((d) => [d, strip(4)])), walk: Object.fromEntries(DIRS.map((d) => [d, strip(6)])) } as Record<string, Partial<Record<Dir, InstanceType<typeof Texture>[]>>>;
const tex = {
	id: 'test',
	entry: { displayName: 'Thử', role: 'player', atlas: '', frameSize: { width: 64, height: 64 }, anchor: { x: 0.5, y: 0.9 }, animations: { idle: { fps: 6 }, walk: { fps: 10 } }, source: { provider: 'test', ref: null }, bodyHeight: 60 },
	frames: (anim: string, dir: Dir) => anims[anim]?.[dir] ?? anims.idle!.S!,
	has: (anim: string) => !!anims[anim],
	hasDir: () => false,
	actionFrames: () => null,
} as never;

const hits: [string, number][] = [];
const aggro: string[] = [];
const killed: string[] = [];
const vfx = { ground: new Container(), top: new Container(), play: () => undefined, frames: () => [], update: () => undefined, clear: () => undefined };
const combat = new CombatSystem(
	{
		mover: (pos: { x: number; y: number }, dx: number, dy: number) => {
			pos.x += dx;
			pos.y += dy;
		},
		shake: () => undefined,
		toast: () => undefined,
		enemyKilled: (f: Fighter) => void killed.push(f.id),
		bossNear: () => false,
		playerRespawn: () => ({ x: 0, y: 0 }),
		isUnlocked: () => true,
		practiceHit: () => undefined,
		netHit: (f: Fighter, n: number) => void hits.push([f.net!.id, n]),
		netAggro: (f: Fighter) => void aggro.push(f.net!.id),
	} as never,
	{ level: 5, exp: 0, coins: 0, potions: 0 },
	vfx as never,
);
const p = new Actor('hero', tex, 40, 100, 'S', null);
combat.setPlayer(p);
combat.setTalents({ sword: 1 });
const tick = (n = 1, dt = 1 / 60) => {
	for (let i = 0; i < n; i += 1) {
		p.update(dt);
		combat.update(dt, (x, y) => ({ x, y }), 2);
	}
};
const mob = (id: string, x: number, owned: boolean): Fighter => {
	const home = { x, y: 100, radius: 60 };
	const net = { id, owned, tx: x, ty: 100, dir: 'S' as Dir, anim: 'idle' as const };
	return combat.addEnemy(new Actor('mob_zombie_001', tex, x, 100, 'W', home), 'mob_zombie_001', home, 'Xác sống', { net })!;
};
const near = (a: number, b: number, what: string, eps = 1) => assert.ok(Math.abs(a - b) <= eps, `${what}: ${a} ≠ ${b}`);

// 1) Con rối: đi theo vị trí máy chủ, không đánh người chơi đứng sát; người chơi lọt tầm thì xin làm chủ (mỗi giây ≤ 1 lần).
{
	const f = mob('g:a:0', 70, false);
	f.net!.tx = 120;
	tick(60);
	near(f.actor.x, 120, 'trượt tới vị trí máy chủ');
	const hp = combat.pc.hp;
	tick(240);
	assert.equal(combat.pc.hp, hp, 'con rối không tự đánh (AI ở máy chủ quái)');
	assert.ok(aggro.length >= 3 && aggro.length <= 5, `xin làm chủ ~mỗi giây (${aggro.length} lần / 4 giây)`);
}

// 2) Đòn trúng quái mạng: báo máy chủ, thanh máu trừ tạm nhưng KHÔNG tự gục; máy chủ báo máu thật / gục mới tính.
{
	const f = mob('g:a:1', 75, false);
	combat.pc.cooldowns.clear();
	assert.equal(combat.cast(0, { x: 100, y: 100 - p.chest }), 'started');
	assert.equal(hits.at(-1)?.[0], 'g:a:1', 'báo máy chủ đòn trúng');
	assert.ok(f.hp < f.hpMax && !f.dead);
	(f as { hp: number }).hp = 1;
	combat.pc.cooldowns.clear();
	combat.cast(0, { x: 100, y: 100 - p.chest });
	assert.equal(f.dead, false, 'trừ tạm về 1 máu, chờ máy chủ quyết');
	combat.netSync(f, 37);
	assert.equal(f.hp, 37, 'máu thật theo máy chủ');
	const coins = combat.pc.coins;
	combat.netKill(f, false);
	assert.ok(f.dead && combat.pc.coins === coins && !killed.includes('mob_zombie_001'), 'gục nhưng không được tính công: không xu / EXP / nhiệm vụ');
	tick(60 * 20);
	assert.equal(f.dead, true, 'không tự hồi sinh — chờ máy chủ');
	combat.netRespawn(f, 200, 120);
	assert.deepEqual([f.dead, f.hp, Math.round(f.actor.x), Math.round(f.actor.y)], [false, f.hpMax, 200, 120]);
	const g = mob('g:a:2', 75, false);
	combat.netKill(g, true);
	assert.equal(combat.pc.coins, coins + ENEMY_STATS.mob_zombie_001!.coins, 'được tính công: nhận xu');
	assert.deepEqual(killed, ['mob_zombie_001'], 'và tính nhiệm vụ');
}

// 3) Làm chủ: AI chạy như quái riêng (đuổi + đánh người chơi máy này).
{
	const f = mob('g:b:0', 190, true);
	const hp = combat.pc.hp;
	tick(60 * 8);
	assert.ok(Math.abs(f.actor.x - p.x) < 120, 'quái mình làm chủ đuổi tới');
	assert.ok(combat.pc.hp < hp || combat.pc.dead, 'và đánh người chơi');
}

console.log('✔ netmobs.test: con rối theo máy chủ + không tự đánh + xin làm chủ, đòn trúng báo máy chủ không tự gục, thưởng chỉ khi được tính công, làm chủ thì AI chạy');

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
type Act = import('@aether/protocol').MobAct;
type Cc = import('@aether/protocol').MobCc;
const acts: [string, Act][] = [];
const ccs: [string, Cc][] = [];
let others: { x: number; y: number }[] = [];
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
		netAct: (f: Fighter, act: Act) => void acts.push([f.net!.id, act]),
		netCc: (f: Fighter, cc: Cc) => void ccs.push([f.net!.id, cc]),
		others: () => others,
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
	const mine = acts.filter(([id]) => id === 'g:b:0').map(([, a]) => a.k);
	assert.ok(mine.includes('wind') && mine.includes('melee'), `phát động tác cho máy khác (${mine.join(',')})`);
	combat.netKill(f, false);
}

const revive = (x: number) => {
	Object.assign(combat.pc, { dead: false, iframes: 0, respawnT: 0 });
	combat.refill();
	Object.assign(p, { x, y: 100 });
	p.root.alpha = 1;
};

// 4) M3.2b: nhát của quái người khác làm chủ — xét trên người chơi máy này: trước mặt + trong tầm thì trúng, sau lưng /
// ngoài tầm thì không; vùng nổ boss chủ phát cũng nổ ở máy này.
{
	const f = mob('g:c:0', 300, false);
	revive(330);
	const hp = combat.pc.hp;
	combat.netAct(f, { k: 'melee', x: 300, y: 100, nx: 1, ny: 0 });
	assert.ok(combat.pc.hp < hp, 'đứng trước quái trong tầm: trúng');
	combat.pc.iframes = 0;
	const hp2 = combat.pc.hp;
	combat.netAct(f, { k: 'melee', x: 300, y: 100, nx: -1, ny: 0 });
	assert.equal(combat.pc.hp, hp2, 'sau lưng quái: không trúng');
	revive(600);
	const hp3 = combat.pc.hp;
	combat.netAct(f, { k: 'melee', x: 300, y: 100, nx: 1, ny: 0 });
	assert.equal(combat.pc.hp, hp3, 'ngoài tầm: không trúng');
	revive(330);
	combat.netAct(f, { k: 'aoe', x: 330, y: 100 });
	tick(80);
	assert.ok(combat.pc.hp < combat.pc.hpMax, 'vùng nổ boss dùng chung trúng người đứng trong');
	const archer = combat.addEnemy(new Actor('mob_skeleton_archer_001', tex, 100, 400, 'E', { x: 100, y: 400, radius: 40 }), 'mob_skeleton_archer_001', { x: 100, y: 400, radius: 40 }, 'Cung', {
		net: { id: 'g:c:1', owned: false, tx: 100, ty: 400, dir: 'E' as Dir, anim: 'idle' as const },
	})!;
	revive(260);
	p.y = 400;
	combat.netAct(archer, { k: 'shot', x: 100, y: 400, nx: 1, ny: 0 });
	tick(60);
	assert.ok(combat.pc.hp < combat.pc.hpMax, 'mũi tên của quái người khác làm chủ bay tới, trúng người chơi máy này');
	combat.netKill(archer, false);
	combat.netKill(f, false);
}

// 5) Khống chế đồng bộ: đòn của mình lên con rối → gửi phần TĂNG một lần (không gửi lại khi trừ dần); nhận từ mạng thì áp
// vào và không dội lại.
{
	const f = mob('g:d:0', 900, false);
	ccs.length = 0;
	f.stun = 1;
	tick(1);
	assert.equal(ccs.length, 1);
	near(ccs[0]![1].stun!, 1 - 1 / 60, 'gửi giây còn lại', 0.01);
	tick(30);
	assert.equal(ccs.length, 1, 'chỉ trừ dần: không gửi lại');
	combat.netControl(f, { stun: 2, armor: 4 });
	tick(5);
	assert.equal(ccs.length, 1, 'nhận từ mạng: không dội lại');
	assert.ok(f.stun > 1.9 && f.armor > 3.9, 'con rối nhận choáng + phá giáp');
	combat.netKill(f, false);
}

// 6) Làm chủ mà người khác đóng băng + đẩy quái: AI đứng im (không đánh), bị đẩy thật; tan băng thì đánh lại.
{
	const f = mob('g:e:0', 1520, true);
	revive(1500);
	combat.netControl(f, { freeze: 2, push: [300, 0, 0.16] });
	const x0 = f.actor.x;
	tick(20);
	near(f.actor.x, x0 + 48, 'bị đẩy theo cú đẩy máy khác gửi', 2);
	const hp = combat.pc.hp;
	tick(60);
	assert.ok(combat.pc.hp >= hp, 'đang đóng băng: không đánh');
	tick(60 * 4);
	assert.ok(combat.pc.hp < hp || combat.pc.dead, 'tan băng: đánh lại');
	combat.netKill(f, false);
}

// 7) Boss dùng chung mình làm chủ gọi vùng nổ vào người chơi KHÁC trong tầm (không chỉ người chơi máy này).
{
	const home = { x: 2600, y: 100, radius: 60 };
	const boss = combat.addEnemy(new Actor('boss_lich_001', tex, 2600, 100, 'W', home), 'boss_lich_001', home, 'Vua Lich', {
		regionBoss: true,
		net: { id: 'g:f:0', owned: true, tx: 2600, ty: 100, dir: 'S' as Dir, anim: 'idle' as const },
	})!;
	revive(2650);
	others = [{ x: 2700, y: 160 }];
	const rnd = Math.random;
	Math.random = () => 0.99;
	try {
		for (let i = 0; i < 60 * 9 && !acts.some(([id, a]) => id === 'g:f:0' && a.k === 'aoe'); i += 1) {
			combat.pc.iframes = 1e9;
			tick(1);
		}
	} finally {
		Math.random = rnd;
	}
	const aoe = acts.find(([id, a]) => id === 'g:f:0' && a.k === 'aoe')?.[1];
	assert.deepEqual(aoe, { k: 'aoe', x: 2700, y: 160 }, 'vùng nổ nhắm người chơi khác + phát cho máy khác');
	combat.netKill(boss, false);
}

// 8) K1: bình kim cương (áp ở client tới K4) — EXP hạ quái ×, sát thương lên quái ×.
{
	const rnd = Math.random;
	Math.random = () => 0.5;
	try {
		revive(40);
		combat.pc.level = 5;
		combat.pc.exp = 0;
		const exp = ENEMY_STATS.mob_zombie_001!.exp;
		Object.assign(combat.potion, { exp: 3, dmg: 1, guard: 1 });
		combat.netKill(mob('g:k:0', 75, false), true);
		assert.equal(combat.pc.exp, exp * 3, 'EXP hạ quái ×3');
		Object.assign(combat.potion, { exp: 1 });
		const hitWith = (dmg: number): number => {
			combat.potion.dmg = dmg;
			const f = mob(`g:k:${dmg}`, 75, false);
			combat.pc.cooldowns.clear();
			combat.cast(0, { x: 100, y: 100 - p.chest });
			tick(30);
			const n = hits.filter(([id]) => id === f.net!.id).reduce((a, [, x]) => a + x, 0);
			combat.netKill(f, false);
			return n;
		};
		const base = hitWith(1);
		const boosted = hitWith(1.2);
		assert.ok(base > 0 && Math.abs(boosted - Math.round(base * 1.2)) <= 1, `sát thương lên quái +20% (${base} → ${boosted})`);
		combat.potion.dmg = 1;
	} finally {
		Math.random = rnd;
	}
}

console.log(
	'✔ netmobs.test: con rối theo máy chủ + không tự đánh + xin làm chủ, đòn trúng báo máy chủ không tự gục, thưởng chỉ khi được tính công, làm chủ thì AI chạy + phát động tác; M3.2b: nhát / đạn / vùng nổ của chủ khác trúng người máy này, khống chế đồng bộ hai chiều, boss nhắm người khác; K1: bình EXP / sát thương',
);

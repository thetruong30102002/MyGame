// Chạy: npx tsx tests/economy.test.ts — kinh tế ở máy chủ phía client (M3.3a): có hook `reportKill` (chơi trực tuyến) thì hạ quái
// RIÊNG chỉ báo máy chủ, không tự cộng xu / EXP; hạ quái DÙNG CHUNG không báo (máy chủ tự tính công); số máy chủ gửi (`setEconomy`)
// lên cấp đúng từng cấp; uống bình báo máy chủ. Chơi một mình (không có hook) tự cộng như cũ.
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
const { ENEMY_STATS, expForLevel } = await import('../src/game/combat/skills');
type Dir = import('../src/game/assets/AssetManifest').Direction;

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
const vfx = { ground: new Container(), top: new Container(), play: () => undefined, frames: () => [], update: () => undefined, clear: () => undefined };

function make(online: boolean) {
	const reported: string[] = [];
	const levels: number[] = [];
	let potions = 0;
	const toasts: string[] = [];
	const combat = new CombatSystem(
		{
			mover: (pos: { x: number; y: number }, dx: number, dy: number) => {
				pos.x += dx;
				pos.y += dy;
			},
			shake: () => undefined,
			toast: (t: string) => void toasts.push(t),
			enemyKilled: () => undefined,
			bossNear: () => false,
			playerRespawn: () => ({ x: 0, y: 0 }),
			isUnlocked: () => true,
			levelUp: (lv: number) => void levels.push(lv),
			...(online ? { reportKill: (type: string) => void reported.push(type), potionUsed: () => void (potions += 1) } : {}),
		} as never,
		{ level: 1, exp: 0, coins: 10, potions: 2 },
		vfx as never,
	);
	const p = new Actor('hero', tex, 40, 100, 'S', null);
	combat.setPlayer(p);
	const mob = (id: string, net = false) => {
		const home = { x: 70, y: 100, radius: 60 };
		return combat.addEnemy(new Actor(id, tex, 70, 100, 'W', home), id, home, 'Quái', net ? { net: { id: `n:${id}`, owned: false, tx: 70, ty: 100, dir: 'S' as Dir, anim: 'idle' as const } } : {})!;
	};
	return { combat, reported, levels, toasts, potionsSent: () => potions, mob };
}

// Trực tuyến: quái riêng → báo; quái dùng chung → không báo; không tự cộng gì.
{
	const t = make(true);
	t.combat.netKill(t.mob('mob_mushroom_001'), true);
	t.combat.netKill(t.mob('mob_zombie_001', true), true);
	assert.deepEqual(t.reported, ['mob_mushroom_001'], 'chỉ báo quái riêng');
	assert.deepEqual([t.combat.pc.coins, t.combat.pc.exp, t.combat.pc.level], [10, 0, 1], 'không tự cộng xu / EXP');
	// Máy chủ gửi số thật: lên 2 cấp → diễn từng cấp, xu / EXP / bình theo máy chủ.
	t.combat.setEconomy({ level: 3, exp: 7, coins: 99, potions: 4 }, { exp: expForLevel(1) + expForLevel(2) + 7, coins: 89, potions: 0, reason: 'quest' });
	assert.deepEqual([t.combat.pc.level, t.combat.pc.exp, t.combat.pc.coins, t.combat.pc.potions], [3, 7, 99, 4]);
	assert.deepEqual(t.levels, [2, 3], 'lên từng cấp một (điểm tiềm năng, cột sáng)');
	assert.ok(t.toasts.some((x) => x.startsWith('+') && x.endsWith('EXP')), 'hiện +EXP theo máy chủ');
	assert.ok(!t.toasts.some((x) => x === '+89 xu'), 'xu nhiệm vụ đã báo ở thông báo hoàn thành — không báo đôi');
	// Uống bình: báo máy chủ.
	t.combat.pc.hp = 1;
	t.combat.usePotion();
	assert.deepEqual([t.potionsSent(), t.combat.pc.potions], [1, 3]);
}

// Chơi một mình (không có phiên trực tuyến): tự cộng như trước.
{
	const t = make(false);
	t.combat.netKill(t.mob('mob_mushroom_001'), true);
	const s = ENEMY_STATS.mob_mushroom_001!;
	assert.deepEqual([t.combat.pc.coins, t.combat.pc.exp], [10 + s.coins, s.exp]);
}

console.log('✔ economy.test (client): trực tuyến báo hạ quái riêng / uống bình, không tự cộng; nhận số máy chủ lên cấp từng cấp; chơi một mình tự cộng như cũ');

// Chạy: npx tsx tests/zonelevel.test.ts — luật thiết kế 12 map vùng 1 (10/10/2026, docs/thiet-ke/vung1-12-map.md) phía client:
// cấp quái theo khu (`enemyStatsAt` dùng chung với máy chủ — đúng bảng số mẫu), khu tuổi thơ có `untilAge`, EXP khu tuổi thơ không
// đưa nhân vật quá cấp 3, CombatSystem dựng quái theo cấp của khu + báo khu khi hạ quái riêng, nhiệm vụ "kill" chỉ đếm quái của
// `onGive.zone`. Không cần trình duyệt.
import assert from 'node:assert/strict';

// DOM tối thiểu cho Pixi (texture hiệu ứng vẽ bằng canvas lúc dựng CombatSystem); không render gì.
const fakeCtx = new Proxy({}, { get: () => () => undefined, set: () => true });
class FakeCanvas {
	width = 1;
	height = 1;
	style = {};
	getContext() {
		return fakeCtx;
	}
}
const store = new Map<string, string>();
Object.assign(globalThis, {
	HTMLCanvasElement: FakeCanvas,
	document: { createElement: () => new FakeCanvas() },
	window: globalThis,
	localStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k), clear: () => store.clear(), key: () => null, length: 0 },
});

const { Container, Texture } = await import('pixi.js');
const { Actor } = await import('../src/game/entities/Actor');
const { CombatSystem } = await import('../src/game/combat/CombatSystem');
const { ENEMY_BASE_LEVEL, ENEMY_STATS, enemyLevel, enemyStatsAt, expForLevel } = await import('../src/game/combat/skills');
const { capExpGain, addExp } = await import('@aether/sim/economy');
const { CHILD_ZONE_LEVEL_CAP, isChildZone, isSharedZone, zoneLiveAt } = await import('@aether/sim/mobs');
const { STORY } = await import('../src/game/story/story');
const { StoryDirector } = await import('../src/game/story/StoryDirector');
type Fighter = import('../src/game/combat/CombatSystem').Fighter;
type Textures = import('../src/game/assets/AssetManifest').CharacterTextures;

let passed = 0;
const test = (name: string, fn: () => void): void => {
	fn();
	passed += 1;
	console.log(`  ✔ ${name}`);
};
console.log('cấp quái theo khu + khu tuổi thơ (client)');

test('enemyStatsAt: khu không khai cấp / đúng cấp gốc → NGUYÊN object ENEMY_STATS (6 map cũ không đổi số nào)', () => {
	for (const [type, base] of Object.entries(ENEMY_STATS)) {
		assert.equal(enemyStatsAt(type), base, `${type}: thiếu level`);
		const lv = ENEMY_BASE_LEVEL[type];
		if (lv !== undefined) assert.equal(enemyStatsAt(type, lv), base, `${type}: đúng cấp gốc ${lv}`);
	}
	assert.equal(enemyStatsAt('khong_co', 5), undefined, 'loại lạ');
	assert.equal(enemyStatsAt('mob_mushroom_001', Number.NaN), ENEMY_STATS.mob_mushroom_001, 'cấp hỏng = chỉ số gốc');
});

test('enemyStatsAt: đúng bảng số mẫu của thiết kế (máu / công / giáp / EXP / xu), tốc + tầm + nhịp giữ nguyên', () => {
	const row = (type: string, level: number) => {
		const s = enemyStatsAt(type, level)!;
		return [s.hp, s.atk, s.def, s.exp, s.coins];
	};
	const table: [string, number, number[]][] = [
		['mob_mushroom_001', 1, [85, 6, 1, 15, 4]],
		['mob_mushroom_001', 3, [110, 8, 2, 19, 4]],
		['mob_mushroom_001', 4, [125, 8, 2, 21, 5]],
		['mob_mushroom_001', 5, [145, 9, 3, 24, 5]],
		['mob_mushroom_001', 6, [165, 10, 3, 27, 6]],
		['mob_zombie_001', 6, [425, 20, 5, 60, 12]],
		['mob_zombie_001', 7, [485, 22, 6, 67, 13]],
		['mob_skeleton_archer_001', 7, [300, 19, 4, 63, 13]],
		['mob_skeleton_archer_001', 8, [340, 21, 5, 70, 15]],
		['mob_cave_bat_001', 8, [330, 19, 2, 70, 14]],
		['mob_cave_bat_001', 9, [380, 21, 3, 78, 15]],
		['mob_gargoyle_001', 9, [585, 26, 10, 93, 17]],
		['mob_gargoyle_001', 10, [675, 28, 10, 104, 19]],
	];
	for (const [type, lv, want] of table) assert.deepEqual(row(type, lv), want, `${type} cấp ${lv}`);
	const base = ENEMY_STATS.mob_gargoyle_001!;
	const up = enemyStatsAt('mob_gargoyle_001', 10)!;
	assert.deepEqual([up.speed, up.aggro, up.reach, up.attackCd, up.ranged], [base.speed, base.aggro, base.reach, base.attackCd, base.ranged]);
	assert.equal(enemyStatsAt('mob_skeleton_archer_001', 8)!.ranged, 'arrow', 'cung xương cấp cao vẫn bắn xa');
});

test('enemyStatsAt: chênh cấp kẹp −3…+6 (không kéo một hình đi mãi); giáp không âm; số tăng dần theo cấp', () => {
	assert.deepEqual(enemyStatsAt('mob_mushroom_001', 30), enemyStatsAt('mob_mushroom_001', 8), 'quá +6 = +6');
	assert.deepEqual(enemyStatsAt('mob_gargoyle_001', 1), enemyStatsAt('mob_gargoyle_001', 3), 'dưới −3 = −3');
	assert.ok(enemyStatsAt('mob_mushroom_001', -5)!.def >= 0);
	for (let lv = 2; lv <= 8; lv += 1) {
		const [a, b] = [enemyStatsAt('mob_mushroom_001', lv - 1)!, enemyStatsAt('mob_mushroom_001', lv)!];
		assert.ok(b.hp > a.hp && b.exp > a.exp && b.atk >= a.atk && b.def >= a.def, `nấm cấp ${lv} mạnh hơn cấp ${lv - 1}`);
	}
});

test('enemyLevel (nhãn "Cấp N"): cấp của khu, không thì cấp gốc của loại; loại chưa ghi cấp → null', () => {
	assert.equal(enemyLevel('mob_mushroom_001', 5), 5);
	assert.equal(enemyLevel('mob_mushroom_001'), 2);
	assert.equal(enemyLevel('boss_stone_gargoyle_001'), 10, 'Gargoyle Đá cấp 10');
	assert.equal(enemyLevel('khong_co'), null);
	for (const id of Object.keys(ENEMY_STATS)) assert.ok(ENEMY_BASE_LEVEL[id], `${id}: có cấp gốc (nhãn tên + cấp theo khu)`);
});

test('zoneLiveAt: khu tuổi thơ (untilAge 15) chỉ có tới hết 15 tuổi; khu người lớn từ 16; khu nhiệm vụ để nhiệm vụ bật', () => {
	const child = { fromAge: 8, untilAge: 15 };
	assert.deepEqual([4, 6, 8, 15, 16, 30].map((a) => zoneLiveAt(child, a)), [false, false, true, true, false, false]);
	assert.deepEqual([8, 16].map((a) => zoneLiveAt({ fromAge: 16 }, a)), [false, true]);
	assert.equal(zoneLiveAt({}, 4), true, 'khu không ghi tuổi: luôn có');
	assert.equal(zoneLiveAt({ onDemand: true }, 8), false, 'khu theo nhiệm vụ không tự sinh');
	assert.ok(isChildZone(child) && isChildZone({ onDemand: true }) && !isChildZone({ fromAge: 16 }));
	assert.ok(!isSharedZone(child), 'khu tuổi thơ là quái RIÊNG (máy chủ trao EXP qua privateKill)');
});

test('capExpGain: EXP khu tuổi thơ dừng sát mốc cấp 4 — không đưa nhân vật quá cấp 3', () => {
	assert.equal(CHILD_ZONE_LEVEL_CAP, 3);
	assert.equal(capExpGain(1, 0, 15, 3), 15, 'xa trần: nhận đủ');
	const room = expForLevel(1) + expForLevel(2) + expForLevel(3) - 1;
	assert.equal(capExpGain(1, 0, 1e6, 3), room);
	const after = addExp(1, 0, capExpGain(1, 0, 1e6, 3));
	assert.deepEqual([after.level, after.exp], [3, expForLevel(3) - 1], 'đứng ở cấp 3, thanh thiếu 1');
	assert.equal(capExpGain(3, expForLevel(3) - 1, 50, 3), 0, 'đã chạm trần');
	assert.equal(capExpGain(5, 0, 50, 3), 0, 'đã quá cấp 3 (người lớn lỡ vào)');
	assert.equal(capExpGain(2, 10, -4, 3), 0, 'số âm');
});

// ———————————————————— CombatSystem: dựng quái theo cấp của khu ————————————————————

function fakeTextures(role = 'monster'): Textures {
	const idle = Array.from({ length: 4 }, () => new Texture());
	return {
		id: 'test',
		entry: { displayName: 'Thử', role, atlas: '', frameSize: { width: 64, height: 64 }, anchor: { x: 0.5, y: 0.9 }, animations: { idle: { fps: 6 } }, source: { provider: 'test', ref: null } },
		frames: () => idle,
		has: (anim: string) => anim === 'idle',
		hasDir: () => false,
		actionFrames: () => null,
	} as never;
}
const vfx = { ground: new Container(), top: new Container(), play: () => undefined, frames: () => [], update: () => undefined, clear: () => undefined };
const reported: [string, string | undefined][] = [];
const combatWith = (level: number, online: boolean) => {
	const c = new CombatSystem(
		{
			mover: () => undefined,
			shake: () => undefined,
			toast: () => undefined,
			enemyKilled: () => undefined,
			bossNear: () => false,
			playerRespawn: () => ({ x: 0, y: 0 }),
			isUnlocked: () => true,
			...(online ? { reportKill: (type: string, zone?: string) => void reported.push([type, zone]) } : {}),
		},
		{ level, exp: 0, coins: 0, potions: 0 },
		vfx as never,
	);
	c.setPlayer(new Actor('hero', fakeTextures('player'), -5000, -5000, 'S', null));
	return c;
};
const home = { x: 0, y: 0, radius: 40 };
const spawn = (c: InstanceType<typeof CombatSystem>, id: string, opts: { zone?: string; level?: number; child?: boolean } = {}) =>
	c.addEnemy(new Actor(id, fakeTextures(), 0, 0, 'S', home), id, home, id, opts)!;
const kill = (c: InstanceType<typeof CombatSystem>, f: Fighter) => (c as unknown as { kill(f: Fighter): void }).kill(f);

test('addEnemy: khu có cấp → máu / công / EXP theo enemyStatsAt; không cấp → đúng bảng gốc; nhãn cấp + khu ghi lên Fighter', () => {
	const c = combatWith(5, false);
	const rift = spawn(c, 'mob_mushroom_001', { zone: 'rv_heart', level: 6 });
	assert.deepEqual([rift.hp, rift.hpMax, rift.stats.atk, rift.level, rift.zone], [165, 165, 10, 6, 'rv_heart']);
	const old = spawn(c, 'mob_mushroom_001', { zone: 'mossvale_east' });
	assert.equal(old.stats, ENEMY_STATS.mob_mushroom_001, 'map cũ: nguyên bảng');
	assert.deepEqual([old.hpMax, old.level], [ENEMY_STATS.mob_mushroom_001!.hp, 2]);
	const boss = c.addEnemy(new Actor('boss_stone_gargoyle_001', fakeTextures('boss'), 0, 0, 'S', home), 'boss_stone_gargoyle_001', home, 'Gargoyle Đá', { regionBoss: true, zone: 'gc_hall' })!;
	assert.ok(boss.boss && boss.regionBoss && boss.hpMax === ENEMY_STATS.boss_stone_gargoyle_001!.hp && boss.level === 10);
});

test('chơi một mình: hạ quái khu cấp cao → EXP + xu theo cấp; khu tuổi thơ không đưa quá cấp 3', () => {
	const c = combatWith(5, false);
	const before = c.pc.exp;
	kill(c, spawn(c, 'mob_mushroom_001', { zone: 'rv_heart', level: 6 }));
	assert.equal(c.pc.exp - before, 27, 'nấm Vết Rạn cấp 6: 27 EXP');
	assert.equal(c.pc.coins, 6);

	const kid = combatWith(3, false);
	kid.pc.exp = expForLevel(3) - 5;
	kill(kid, spawn(kid, 'mob_mushroom_001', { zone: 'rf_orchard', level: 1, child: true }));
	assert.deepEqual([kid.pc.level, kid.pc.exp], [3, expForLevel(3) - 1], 'dừng sát mốc cấp 4');
	kill(kid, spawn(kid, 'mob_mushroom_001', { zone: 'rf_orchard', level: 1, child: true }));
	assert.deepEqual([kid.pc.level, kid.pc.exp, kid.pc.coins], [3, expForLevel(3) - 1, 8], 'đã chạm trần: chỉ còn xu');
	const young = combatWith(1, false);
	kill(young, spawn(young, 'mob_mushroom_001', { zone: 'rf_orchard', level: 1, child: true }));
	assert.equal(young.pc.exp, 15, 'dưới trần: nhận đủ (nấm cấp 1 = 15 EXP)');
});

test('trực tuyến: hạ quái RIÊNG báo máy chủ kèm khu (máy chủ trao theo cấp của khu); quái dùng chung không báo', () => {
	const c = combatWith(2, true);
	reported.length = 0;
	kill(c, spawn(c, 'mob_mushroom_001', { zone: 'rf_levee', level: 1, child: true }));
	kill(c, spawn(c, 'boss_demon_001'));
	const net = c.addEnemy(new Actor('mob_zombie_001', fakeTextures(), 0, 0, 'S', home), 'mob_zombie_001', home, 'x', {
		zone: 'nl_pit',
		level: 7,
		net: { id: 'human/nameless:nl_pit:0', owned: true, tx: 0, ty: 0, dir: 'S', anim: 'idle' },
	})!;
	assert.equal(net.hpMax, 485, 'quái dùng chung cũng nhân theo cấp (đòn của nó lên người chơi máy này)');
	c.netKill(net, true);
	assert.deepEqual(reported, [
		['mob_mushroom_001', 'rf_levee'],
		['boss_demon_001', undefined],
	]);
	assert.equal(c.pc.exp, 0, 'trực tuyến: client không tự cộng');
});

// ———————————————————— StoryDirector: nhiệm vụ "kill" chỉ đếm quái của onGive.zone ————————————————————

test('nhiệm vụ "kill" có onGive.zone chỉ đếm quái của khu đó (c8 bìa rừng, y2 Khoảng trống); Thư viện vẫn đếm mọi con', () => {
	const noop = { dialogue() {}, reward() {}, questsChanged() {}, pickups() {}, clearPickups() {}, awakenBoss() {}, spawnZone() {}, questCompleted() {}, unlocked() {}, ageChanged() {}, chapterEnd() {} };
	const at = (id: string) => {
		const d = new StoryDirector(STORY, noop);
		const q = STORY.quests.find((x) => x.id === id)!;
		Object.assign(d.state, { index: STORY.quests.indexOf(q), age: q.age, accepted: true, ready: false, progress: 0 });
		return { d, q };
	};
	const c8 = at('c8_forest_edge');
	assert.equal(c8.q.onGive?.zone, 'mossvale_edge');
	c8.d.monsterKilled('mob_mushroom_001', 'rf_orchard');
	c8.d.monsterKilled('mob_mushroom_001');
	assert.equal(c8.d.state.progress, 0, 'nấm Bãi Bồi / không rõ khu: không tính cho bìa rừng');
	c8.d.monsterKilled('mob_mushroom_001', 'mossvale_edge');
	assert.equal(c8.d.state.progress, 1);
	assert.equal(c8.d.codex.kills.mob_mushroom_001, 3, 'Thư viện đếm cả ba con');

	const y2 = at('y2_shadows');
	assert.equal(y2.q.onGive?.zone, 'mossvale_clearing');
	y2.d.monsterKilled('mob_zombie_001', 'gy_plot_sw');
	y2.d.monsterKilled('mob_mushroom_001', 'mossvale_east');
	assert.equal(y2.d.state.progress, 0, 'y2 không ghi loại quái nhưng vẫn chỉ đếm Khoảng trống');
	y2.d.monsterKilled('mob_mushroom_001', 'mossvale_clearing');
	assert.equal(y2.d.state.progress, 1);
});

console.log(`${passed} test qua`);

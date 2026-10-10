// Chạy: npx tsx tests/boss.test.ts — boss vùng (Vua Lich) vs boss cốt truyện (Quỷ vương) + cân chỉ số quái tuổi 16, không cần trình duyệt.
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
Object.assign(globalThis, { HTMLCanvasElement: FakeCanvas, document: { createElement: () => new FakeCanvas() }, window: globalThis });

const { Container, Texture } = await import('pixi.js');
const { Actor } = await import('../src/game/entities/Actor');
const { CombatSystem } = await import('../src/game/combat/CombatSystem');
const { ENEMY_STATS, PATHS, expForLevel } = await import('../src/game/combat/skills');
const { depthBonus } = await import('../src/game/combat/talents');
const { BOSS_INTRO, bossIntro, killOutcome, MONSTER_RESPAWN, pickHudBoss, REGION_BOSS_RESPAWN, regionBossDormancy, regionBossDownText, regionBossMayWake, respawnDelay } = await import(
	'../src/game/combat/bossRules'
);
const { CHILDHOOD_QUESTS } = await import('../src/game/story/childhood');
const { YOUTH_QUESTS } = await import('../src/game/story/youth');
type Fighter = import('../src/game/combat/CombatSystem').Fighter;
type Textures = import('../src/game/assets/AssetManifest').CharacterTextures;

// 1) Luật thuần: hồi sinh, báo cốt truyện, thoại.
{
	assert.equal(respawnDelay({ boss: false, regionBoss: false }), MONSTER_RESPAWN);
	assert.equal(respawnDelay({ boss: true, regionBoss: false }), null, 'boss cốt truyện không bao giờ sống lại');
	assert.equal(respawnDelay({ boss: true, regionBoss: true }), REGION_BOSS_RESPAWN, 'boss vùng hồi sinh');
	assert.ok(REGION_BOSS_RESPAWN >= 120 && REGION_BOSS_RESPAWN <= 300, 'boss vùng chờ vài phút');
	assert.equal(killOutcome({ boss: true, regionBoss: false }), 'story-boss');
	assert.equal(killOutcome({ boss: true, regionBoss: true }), 'region-boss', 'boss vùng không báo bossDefeated');
	assert.equal(killOutcome({ boss: false, regionBoss: false }), 'monster');

	const seen = new Set<string>();
	const lich = bossIntro('boss_lich_001', true, seen);
	assert.ok(lich && lich.length >= 2 && lich.length <= 3, 'Lich có 2–3 câu thoại riêng');
	assert.ok(!lich.some((l) => BOSS_INTRO.boss_demon_001!.includes(l)), 'không mượn thoại Quỷ vương');
	assert.equal(bossIntro('boss_lich_001', true, seen), null, 'boss vùng chỉ chào một lần mỗi phiên');
	assert.deepEqual(bossIntro('boss_demon_001', false, seen), BOSS_INTRO.boss_demon_001, 'Quỷ vương giữ thoại cũ');
	assert.deepEqual(bossIntro('boss_demon_001', false, seen), BOSS_INTRO.boss_demon_001, 'boss cốt truyện không bị chặn lặp');
	assert.equal(bossIntro('boss_khong_co_thoai', true, new Set()), null, 'boss không có thoại riêng thì im lặng');
	assert.equal(regionBossDownText('Vua Lich', 'Hầm mộ'), 'Vua Lich đã ngã — hầm mộ sẽ lại thức giấc sau ít phút…');

	const b = (x: number, engaged = true, dead = false) => ({ dead, engaged, actor: { x, y: 0 } });
	const story = b(500);
	const near = b(50);
	const far = b(300);
	assert.equal(pickHudBoss(story, [near, far], 0, 0), story, 'boss cốt truyện đang đánh luôn ưu tiên');
	assert.equal(pickHudBoss(b(0, false), [far, near], 0, 0), near, 'nhiều boss vùng: lấy con đang đánh gần nhất');
	assert.equal(pickHudBoss(null, [b(10, false), b(20, true, true)], 0, 0), null, 'không ai giao chiến → ẩn thanh');
}

// 2) Trong CombatSystem: boss vùng gục rồi thức giấc sau REGION_BOSS_RESPAWN; boss cốt truyện nằm luôn.
function fakeTextures(): Textures {
	const strip = (n: number) => Array.from({ length: n }, () => new Texture());
	const idle = strip(4);
	return {
		id: 'test',
		entry: { displayName: 'Thử', role: 'boss', atlas: '', frameSize: { width: 64, height: 64 }, anchor: { x: 0.5, y: 0.9 }, animations: { idle: { fps: 6 } }, source: { provider: 'test', ref: null } },
		frames: () => idle,
		has: (anim) => anim === 'idle',
		hasDir: () => false,
		actionFrames: () => null,
	};
}
{
	const killed: { id: string; regionBoss: boolean }[] = [];
	const vfx = { ground: new Container(), top: new Container(), play: () => undefined, frames: () => [], update: () => undefined, clear: () => undefined };
	const combat = new CombatSystem(
		{
			mover: () => undefined,
			shake: () => undefined,
			toast: () => undefined,
			enemyKilled: (f) => void killed.push({ id: f.id, regionBoss: f.regionBoss }),
			bossNear: () => false,
			playerRespawn: () => ({ x: 0, y: 0 }),
			isUnlocked: () => true,
		},
		{ level: 4, exp: 0, coins: 0, potions: 0 },
		vfx as never,
	);
	combat.setPlayer(new Actor('hero', fakeTextures(), -5000, -5000, 'S', null));
	const add = (id: string, regionBoss: boolean) => {
		const home = { x: 0, y: 0, radius: 40 };
		return combat.addEnemy(new Actor(id, fakeTextures(), 0, 0, 'S', home), id, home, id, { regionBoss })!;
	};
	const lich = add('boss_lich_001', true);
	const demon = add('boss_demon_001', false);
	assert.ok(lich.boss && lich.regionBoss, 'boss vùng vẫn là boss (thanh máu HUD, không theo bầy)');
	assert.ok(demon.boss && !demon.regionBoss);
	const kill = (combat as unknown as { kill(f: Fighter): void }).kill.bind(combat);
	kill(lich);
	kill(demon);
	assert.deepEqual(killed, [
		{ id: 'boss_lich_001', regionBoss: true },
		{ id: 'boss_demon_001', regionBoss: false },
	]);
	const tick = (seconds: number) => {
		for (let t = 0; t < seconds; t += 0.5) combat.update(0.5, (x, y) => ({ x, y }), 2);
	};
	tick(REGION_BOSS_RESPAWN - 2);
	assert.ok(lich.dead, 'chưa đủ giờ thì chưa sống lại');
	tick(4);
	assert.ok(!lich.dead && lich.hp === lich.hpMax, 'boss vùng thức giấc lại, đầy máu');
	assert.ok(demon.dead, 'boss cốt truyện không bao giờ sống lại');
}

// 2b) Boss vùng qua lần đổi map + lúc thức dậy (hàm thuần): mốc thức sống ngoài Fighter, người chơi đứng canh thì hoãn.
{
	assert.equal(regionBossDormancy(undefined, 50), 0, 'chưa từng hạ → dựng sống');
	assert.equal(regionBossDormancy(230, 50), 180, 'vừa hạ rồi ra vào map → còn nằm nguyên 180s');
	assert.equal(regionBossDormancy(230, 200), 30);
	assert.equal(regionBossDormancy(230, 400), 0, 'quá giờ → dựng sống');
	const region = { boss: true, regionBoss: true };
	assert.equal(regionBossMayWake(region, 100, 436), false, 'người chơi đứng trong vùng canh → hoãn');
	assert.equal(regionBossMayWake(region, 500, 436), true);
	assert.equal(regionBossMayWake(region, null, 436), true, 'người chơi đang gục → thức được');
	assert.equal(regionBossMayWake({ boss: false, regionBoss: false }, 0, 436), true, 'quái thường giữ nhịp cũ');
}

// 2c) Trong CombatSystem: dựng boss vùng ở trạng thái đang nằm, hoãn thức khi người chơi đứng canh, gặp lại không khựng.
{
	let introShown = false;
	const vfx = { ground: new Container(), top: new Container(), play: () => undefined, frames: () => [], update: () => undefined, clear: () => undefined };
	const combat = new CombatSystem(
		{
			mover: () => undefined,
			shake: () => undefined,
			toast: () => undefined,
			enemyKilled: () => undefined,
			bossNear: () => introShown,
			playerRespawn: () => ({ x: 0, y: 0 }),
			isUnlocked: () => true,
		},
		{ level: 4, exp: 0, coins: 0, potions: 0 },
		vfx as never,
	);
	const hero = new Actor('hero', fakeTextures(), -5000, -5000, 'S', null);
	combat.setPlayer(hero);
	const home = { x: 0, y: 0, radius: 96 };
	const tick = (seconds: number, dt = 0.5) => {
		for (let t = 0; t < seconds; t += dt) combat.update(dt, (x, y) => ({ x, y }), 2);
	};
	// Vào lại map khi Lich còn 30s mới thức: dựng ở trạng thái đã gục, vô hình, không hiện thanh máu.
	const lichActor = new Actor('boss_lich_001', fakeTextures(), 0, 0, 'S', home);
	const lich = combat.addEnemy(lichActor, 'boss_lich_001', home, 'Vua Lich', { regionBoss: true, dormant: 30 })!;
	assert.ok(lich.dead && lich.hp === 0 && lichActor.root.alpha === 0, 'chưa tới giờ thức → nằm, không hiện');
	assert.equal(pickHudBoss(null, [lich], 0, 0), null);
	tick(28);
	assert.ok(lich.dead, 'đếm nốt thời gian còn lại, chưa đủ thì chưa thức');
	// Người chơi đứng ngay hầm mộ lúc hết giờ: hoãn, không hiện ra sát cạnh.
	Object.assign(hero, { x: 40, y: 0 });
	tick(10);
	assert.ok(lich.dead, 'người chơi đứng trong vùng canh → hoãn thức');
	Object.assign(hero, { x: 2000, y: 0 });
	tick(1);
	assert.ok(!lich.dead && lich.hp === lich.hpMax && lichActor.root.alpha === 1, 'người chơi đi xa → thức dậy đầy máu');

	// Gặp lại boss vùng đã chào (bossNear trả false — không có thoại): giữ nguyên nhịp, không dời đòn đánh.
	const again = combat.addEnemy(new Actor('boss_lich_001', fakeTextures(), 1000, 0, 'S', { x: 1000, y: 0, radius: 96 }), 'boss_lich_001', { x: 1000, y: 0, radius: 96 }, 'Vua Lich', { regionBoss: true })!;
	Object.assign(hero, { x: 1100, y: 0 });
	again.attackTimer = 0.2;
	again.aoeTimer = 2;
	combat.update(1 / 60, (x, y) => ({ x, y }), 2);
	assert.ok(again.introduced, 'đã qua khối giới thiệu');
	assert.ok(again.attackTimer < 1.5 && again.aoeTimer < 6, `không có thoại thì không khựng (${again.attackTimer.toFixed(2)}s)`);
	// Có thoại thật (bossNear trả true): dời nhịp để người chơi đọc.
	introShown = true;
	const fresh = combat.addEnemy(new Actor('boss_lich_001', fakeTextures(), 3000, 0, 'S', { x: 3000, y: 0, radius: 96 }), 'boss_lich_001', { x: 3000, y: 0, radius: 96 }, 'Vua Lich', { regionBoss: true })!;
	Object.assign(hero, { x: 3100, y: 0 });
	fresh.attackTimer = 0.2;
	combat.update(1 / 60, (x, y) => ({ x, y }), 2);
	assert.ok(fresh.attackTimer >= 1.4, 'có thoại thì boss chờ người chơi đọc xong');
}

// 2d) Cuồng nộ theo % máu (cân độ khó 09/10/2026: máu boss ×2,2, nhịp `attackCd` ×0,9): ngưỡng vẫn là 50% của máu tối đa MỚI,
// cuồng nộ nhân nhịp đánh ×0,8 trên `attackCd` mới — đổi bảng chỉ số không làm lệch pha.
{
	const vfx = { ground: new Container(), top: new Container(), play: () => undefined, frames: () => [], update: () => undefined, clear: () => undefined };
	const combat = new CombatSystem(
		{
			mover: () => undefined,
			shake: () => undefined,
			toast: () => undefined,
			enemyKilled: () => undefined,
			bossNear: () => false,
			playerRespawn: () => ({ x: 0, y: 0 }),
			isUnlocked: () => true,
		},
		{ level: 4, exp: 0, coins: 0, potions: 0 },
		vfx as never,
	);
	combat.setPlayer(new Actor('hero', fakeTextures(), 3030, 0, 'S', null));
	const home = { x: 3000, y: 0, radius: 96 };
	const lich = combat.addEnemy(new Actor('boss_lich_001', fakeTextures(), 3000, 0, 'S', home), 'boss_lich_001', home, 'Vua Lich', { regionBoss: true })!;
	const cd = ENEMY_STATS.boss_lich_001!.attackCd;
	assert.equal(lich.hpMax, ENEMY_STATS.boss_lich_001!.hp, 'máu tối đa theo bảng mới');
	// Nhát kế tiếp được hẹn lại sau bao lâu khi boss còn `frac` máu (đứng sát người chơi, tới lượt đánh).
	const nextSwing = (frac: number): number => {
		Object.assign(lich, { introduced: true, hp: lich.hpMax * frac, attackTimer: 0.001, aoeTimer: 99, windup: 0 });
		combat.update(1 / 60, (x, y) => ({ x, y }), 2);
		return lich.attackTimer;
	};
	assert.ok(Math.abs(nextSwing(1) - cd) < 1e-9, `đầy máu: nhịp thường ${cd}s`);
	assert.ok(Math.abs(nextSwing(0.51) - cd) < 1e-9, 'trên 50% chưa cuồng nộ');
	assert.ok(Math.abs(nextSwing(0.49) - cd * 0.8) < 1e-9, `dưới 50% máu mới (${Math.round(lich.hpMax / 2)}): nhịp ×0,8`);
}

// 3) Cân chỉ số tuổi 16: ước cấp người chơi theo EXP cốt truyện, rồi so đòn quái với máu/giáp người chơi.
{
	const sum = (qs: { reward: { exp: number } }[]) => qs.reduce((a, q) => a + q.reward.exp, 0);
	const levelAt = (exp: number) => {
		let lv = 1;
		while (exp >= expForLevel(lv)) exp -= expForLevel(lv++);
		return lv;
	};
	const childhood = sum(CHILDHOOD_QUESTS) + 3 * ENEMY_STATS.mob_mushroom_001!.exp;
	assert.equal(levelAt(childhood), 2, 'vừa sang 16 tuổi: cấp 2');
	const youthPre = YOUTH_QUESTS.filter((q) => q.objective.type !== 'boss');
	const beforeDemon = childhood + sum(youthPre) + 5 * ENEMY_STATS.mob_mushroom_001!.exp;
	// Cân độ khó 09/10/2026: EXP nấm ×1,2 (14 → 17) đẩy đường tối thiểu qua mốc cấp 4 (trước chỉ thiếu 3 EXP) — vừa kịp cho
	// Quỷ vương máu ×2,2.
	assert.equal(levelAt(beforeDemon), 4, 'trước Quỷ vương: cấp 4 (vừa qua mốc)');
	assert.equal(levelAt(beforeDemon + sum(YOUTH_QUESTS.filter((q) => q.objective.type === 'boss')) + ENEMY_STATS.boss_demon_001!.exp), 5, 'sau Quỷ vương: cấp 5');

	const player = (path: keyof typeof PATHS, lv: number) => {
		const p = PATHS[path];
		return { hp: p.hp[0] + (lv - 1) * p.hp[1], def: p.def[0] + (lv - 1) * p.def[1] };
	};
	// Đòn nặng nhất có thể (×1,1) của quái lên người chơi — công thức `hurtPlayer`.
	const maxHit = (atk: number, def: number) => Math.max(1, Math.round(atk * 1.1 - def * 0.5));
	const lv4 = player('none', 4);
	const mageLv3 = player('mage', 3);
	const mush = maxHit(ENEMY_STATS.mob_mushroom_001!.atk, lv4.def);
	for (const id of ['mob_zombie_001', 'mob_gargoyle_001', 'mob_skeleton_archer_001']) {
		const s = ENEMY_STATS[id]!;
		const hit = maxHit(s.atk, lv4.def);
		assert.ok(hit >= 3 * mush, `${id}: đau hơn nấm rõ rệt (${hit} vs ${mush})`);
		assert.ok(hit / lv4.hp >= 0.06 && hit / lv4.hp <= 0.15, `${id}: 6–15% máu cấp 4 (${((hit / lv4.hp) * 100).toFixed(1)}%)`);
		assert.ok(maxHit(s.atk, mageLv3.def) / mageLv3.hp < 0.2, `${id}: Pháp sư cấp 3 không mất quá 20% một đòn`);
		// Trâu hơn nấm: nhát Trảm mốc 1 của người chơi cấp 4 cần ≥ 2 lần số nhát (cung xương giòn nhất nhưng bắn từ xa).
		const slash = (atk: number, def: number) => Math.max(1, atk * 1.25 * depthBonus(1) - def * 0.5);
		const atk4 = PATHS.none.atk[0] + 3 * PATHS.none.atk[1];
		const hits = (st: { hp: number; def: number }) => Math.ceil(st.hp / slash(atk4, st.def));
		assert.ok(hits(s) >= 2 * hits(ENEMY_STATS.mob_mushroom_001!), `${id}: trâu hơn nấm (${hits(s)} nhát)`);
	}
	const lichStats = ENEMY_STATS.boss_lich_001!;
	assert.equal(lichStats.ranged, 'shadow', 'Lich đánh xa hệ bóng tối');
	// Máu boss ×2,2 (09/10/2026): khoảng cũ 1100–1300 → 2420–2860; vẫn trâu hơn Quỷ vương.
	assert.ok(lichStats.hp >= 2420 && lichStats.hp <= 2860, `Lich máu ${lichStats.hp}`);
	assert.ok(lichStats.hp > ENEMY_STATS.boss_demon_001!.hp, 'Lich trâu hơn Quỷ vương');
	// Đòn nặng nhất của boss là vòng AoE (atk × 1,8): Pháp sư cấp 3 vẫn sống sót ≥ 2 vòng.
	assert.ok(maxHit(lichStats.atk * 1.8, mageLv3.def) * 2 < mageLv3.hp, 'Lich không one-shot (cả AoE)');

	// 3b) Hang Gargoyle (thiết kế 12 map vùng 1, 10/10/2026): dơi hang cấp 8–9 + Gargoyle Đá (boss khu cấp 10), đánh ở cấp 8–10.
	const gar = ENEMY_STATS.boss_stone_gargoyle_001!;
	assert.ok(!gar.ranged && !gar.resist, 'Gargoyle Đá: cận chiến + vòng nổ boss chung, không đánh xa, không kháng hệ (quái vùng 1)');
	assert.ok(gar.hp > lichStats.hp * 1.5 && gar.hp < lichStats.hp * 2, `trâu hơn Vua Lich ~1,7 lần (${gar.hp})`);
	assert.ok(gar.exp > lichStats.exp && gar.coins > lichStats.coins);
	const mageLv9 = player('mage', 9);
	assert.ok(maxHit(gar.atk * 1.8, mageLv9.def) * 2 < mageLv9.hp, 'Pháp sư cấp 9 chịu được hai vòng nổ');
	assert.ok(maxHit(gar.atk, mageLv9.def) / mageLv9.hp <= 0.2, `nhát vuốt ≤ 20% máu Pháp sư cấp 9 (${maxHit(gar.atk, mageLv9.def)}/${mageLv9.hp})`);
	const bat = ENEMY_STATS.mob_cave_bat_001!;
	const mageLv8 = player('mage', 8);
	assert.ok(!bat.ranged && bat.speed >= 78 && bat.attackCd <= 1, 'dơi: cận chiến, nhanh ngang người đi bộ, cắn dồn');
	assert.ok(maxHit(bat.atk, mageLv8.def) / mageLv8.hp < 0.12, 'một nhát dơi nhẹ — cả bầy dí vào mới nguy');
	assert.ok(bat.hp < ENEMY_STATS.mob_gargoyle_001!.hp && bat.def < ENEMY_STATS.mob_gargoyle_001!.def, 'dơi giòn hơn gargoyle');
	const garIntro = bossIntro('boss_stone_gargoyle_001', true, new Set());
	assert.ok(garIntro && garIntro.length === 3 && /ba trăm năm/i.test(garIntro[0]!), 'Gargoyle Đá có 3 câu thoại riêng (hé lộ đã có người tới trước)');
	assert.equal(respawnDelay({ boss: true, regionBoss: true }), REGION_BOSS_RESPAWN, 'boss khu hồi sinh theo giờ như Vua Lich');
}

console.log('✔ boss.test: boss vùng hồi sinh (cả qua đổi map, hoãn khi người chơi đứng canh), không đụng cốt truyện, chào một lần, HUD chọn đúng boss, cuồng nộ dưới 50% máu; cân chỉ số quái tuổi 16 + Vua Lich + Hang Gargoyle (dơi hang, Gargoyle Đá)');

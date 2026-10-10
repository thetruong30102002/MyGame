// Chạy: npx tsx tests/action.test.ts — kiểm động tác ra đòn (vào thế → khung chạm → thu thế) không cần trình duyệt.
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
const { timingFor, frameAt, strikePlan, strikeClock, enemyHitFrame, STRIKE_MAX_SPEEDUP, STRIKE_MAX_SLOWDOWN } = await import('../src/game/entities/actionClock');
const { Actor } = await import('../src/game/entities/Actor');
const { CombatSystem } = await import('../src/game/combat/CombatSystem');
type Entry = import('../src/game/assets/AssetManifest').CharacterManifestEntry;
type Textures = import('../src/game/assets/AssetManifest').CharacterTextures;
type Dir = import('../src/game/assets/AssetManifest').Direction;
type Fighter = import('../src/game/combat/CombatSystem').Fighter;

const near = (a: number, b: number, what: string) => assert.ok(Math.abs(a - b) < 1e-3, `${what}: ${a} ≠ ${b}`);

// 1) Số liệu thời gian theo bảng thiết kế (§1).
{
	const e = (anim: 'attack' | 'cast', fps: number, frames: number, hitFrame?: number) => ({ animations: { [anim]: { fps, frames, hitFrame, loop: false } } });
	let t = timingFor(e('attack', 17, 6), 'attack', 0.38)!;
	near(t.releaseAt, 2 / 17, 'attack n=6 releaseAt');
	near(t.cancelAt, 3 / 17, 'attack n=6 cancelAt');
	near(t.dur, 6 / 17, 'attack n=6 dur');
	t = timingFor(e('attack', 22, 8), 'attack', 0.38)!;
	// 8/22 = 0,364s > hồi chiêu 0,38 − 0,02 → co về 0,36s, khung chạm frame 3 ở 0,135s.
	near(t.releaseAt, 0.36 * (3 / 8), 'attack n=8 hitFrame 3 (đã co)');
	t = timingFor(e('cast', 20, 8), 'cast', 0.42)!;
	near(t.releaseAt, 0.15, 'cast n=8 releaseAt');
	near(t.dur, 0.4, 'cast n=8 dur');
	t = timingFor(e('cast', 15, 6), 'cast', 1)!;
	near(t.releaseAt, 2 / 15, 'cast n=6 hitFrame 2');
	// Spec khai dài hơn hồi chiêu → co cả ba mốc, động tác luôn xong trước lượt kế.
	t = timingFor(e('attack', 10, 8), 'attack', 0.38)!;
	near(t.dur, 0.36, 'co theo hồi chiêu');
	near(t.releaseAt, 0.36 * (3 / 8), 'releaseAt co cùng hệ số');
	assert.equal(timingFor({ animations: {} }, 'attack', 0.38), null, 'không có animation → null');
	t = timingFor(e('attack', 17, 6, 4), 'attack', Infinity)!;
	near(t.releaseAt, 4 / 17, 'hitFrame khai trong spec thắng mặc định');
	assert.equal(frameAt(t.releaseAt, t), 4, 'đúng mốc khung chạm thì đang hiện frame tung đòn');
	assert.equal(frameAt(99, t), 5, 'quá giờ thì đứng ở frame cuối');
}

// 2) Nhân vật giả: idle/walk đủ 8 hướng; attack/cast chỉ vẽ E (+ W lật gương) như kế hoạch vẽ ngày 1.
const DIRS: Dir[] = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'];
const strip = (n: number) => Array.from({ length: n }, () => new Texture());
function fakeTextures(withActions: boolean): Textures {
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
	if (withActions) {
		// N vẽ riêng (không lật gương) để kiểm chiều vệt chém theo hướng, không theo dấu dx.
		anims.attack = { E: strip(6), W: strip(6), N: strip(6) };
		anims.cast = { E: strip(8), W: strip(8) };
		entry.animations.attack = { fps: 17, frames: 6, loop: false, directions: ['E', 'W'] };
		entry.animations.cast = { fps: 20, frames: 8, loop: false, directions: ['E', 'W'] };
	}
	const near8: Record<Dir, Dir[]> = { S: ['S', 'SE', 'SW'], N: ['N', 'NE', 'NW'], E: ['E', 'SE', 'NE'], W: ['W', 'SW', 'NW'], SE: ['SE', 'E', 'S'], SW: ['SW', 'W', 'S'], NE: ['NE', 'E', 'N'], NW: ['NW', 'W', 'N'] };
	const actionFrames = (anim: string, dir: Dir) => near8[dir].map((d) => anims[anim]?.[d]).find((l) => l?.length) ?? null;
	return {
		id: 'test',
		entry,
		frames: (anim, dir) => anims[anim]?.[dir] ?? anims.idle!.S!,
		has: (anim) => !!anims[anim],
		hasDir: (anim, dir) => actionFrames(anim, dir) !== null,
		actionFrames,
	};
}

function setup(withActions: boolean) {
	const hits: string[] = [];
	const slashes: boolean[] = [];
	const vfx = {
		ground: new Container(),
		top: new Container(),
		play: (id: string, _x: number, _y: number, o?: { flipY?: boolean }) => void (id === 'slash' && slashes.push(!!o?.flipY)),
		frames: () => [],
		update: () => undefined, clear: () => undefined,
	};
	const sent: string[] = [];
	const ended = { n: 0 };
	const combat = new CombatSystem(
		{
			mover: () => undefined,
			shake: () => undefined,
			toast: () => undefined,
			enemyKilled: () => undefined,
			bossNear: () => false,
			playerRespawn: () => ({ x: 0, y: 0 }),
			isUnlocked: () => true,
			practiceHit: (el) => void hits.push(el),
			onAction: (anim, dir, skill) => void sent.push(`${anim}/${dir}/${skill}`),
			onActionEnd: () => void (ended.n += 1),
		},
		{ level: 1, exp: 0, coins: 0, potions: 0 },
		vfx as never,
	);
	const p = new Actor('hero', fakeTextures(withActions), 40, 100, 'S', null);
	combat.setPlayer(p);
	combat.addDummy(100, 100);
	// Luật 10/10/2026: phép mốc 1 của nguyên tố phải học bằng điểm (chưa nhận mốc nào chỉ có Trảm + Tia Aether) — test ra Hoả Cầu.
	combat.setTalents({ sword: 1, fire: 1, water: 1, wind: 1, ice: 1, earth: 1 });
	const east = { x: 100, y: 100 - p.chest };
	const south = { x: 40, y: 300 };
	// Thứ tự giống Game.update: actor (CharacterView) → combat.
	const tick = (dt = 1 / 60) => {
		p.update(dt);
		combat.update(dt, (x, y) => ({ x, y }), 2);
	};
	return { combat, p, hits, sent, ended, slashes, east, south, tick };
}

// 3) Hôm nay (atlas chưa có động tác): đòn nổ NGAY như cũ, nhưng không còn cú giật sprite.
{
	const { combat, p, hits, sent, east, tick } = setup(false);
	assert.equal(combat.cast(0, east), 'started');
	assert.equal(combat.action, null, 'không có động tác thì không có pha vào thế');
	assert.deepEqual(hits, ['steel'], 'Trảm trúng hình nộm ngay lúc bấm');
	assert.deepEqual(sent, ['attack/E/slash'], 'vẫn báo mạng — máy kia có hình thì tự phát');
	tick();
	assert.equal(p.root.x, Math.round(p.x), 'không còn lunge: sprite đứng đúng vị trí logic');
	assert.equal(p.root.y, Math.round(p.y));
}

// 4) Có động tác hướng E: vào thế → khung chạm đúng frame tung đòn → thu thế → về nền.
{
	const { combat, p, hits, east, tick } = setup(true);
	assert.equal(combat.cast(0, east), 'started');
	const a = combat.action!;
	assert.ok(a && !a.released, 'đang vào thế');
	assert.equal(p.view.animation, 'attack');
	assert.equal(p.view.sprite.currentFrame, 0);
	assert.deepEqual(hits, [], 'chưa tới khung chạm thì chưa trúng');
	let frames = 0;
	while (!a.released) {
		tick();
		frames += 1;
		assert.ok(frames < 60, 'phải tới khung chạm');
	}
	assert.equal(frames, Math.ceil(a.timing.releaseAt * 60), 'khung chạm rơi đúng frame game đầu tiên ≥ releaseAt');
	assert.deepEqual(hits, ['steel'], 'trúng đúng một lần ở khung chạm');
	assert.equal(p.view.sprite.currentFrame, 2, 'sprite đang ở frame tung đòn (hitFrame mặc định = round(6/3))');
	// Trong lúc vung, Game vẫn gọi set() mỗi frame: chỉ ghi nhớ trạng thái nền, không đè động tác.
	p.view.set('walk', 'W');
	assert.equal(p.view.animation, 'attack');
	assert.equal(p.view.baseAnimation, 'walk', 'gửi mạng trạng thái nền, không bao giờ "attack"');
	while (combat.action) tick();
	assert.equal(p.view.animation, 'walk', 'hết động tác thì về trạng thái nền đã ghi');
	assert.equal(p.view.direction, 'W');
	assert.deepEqual(hits, ['steel'], 'không trúng lần hai');
}

// 5) Hướng chưa vẽ (S): phương án dự phòng — nổ tức thì, không khoá.
{
	const { combat, p, south } = setup(true);
	assert.equal(combat.cast(1, south), 'started');
	assert.equal(combat.action, null);
	assert.equal(p.view.animation, 'idle');
}

// 6) Bị ngắt trước khung chạm: hoàn MP + hồi chiêu, đòn không nổ về sau.
{
	const { combat, east, tick } = setup(true);
	const mp = combat.pc.mp;
	assert.equal(combat.cast(2, east), 'started', 'Hoả Cầu');
	assert.equal(combat.pc.mp, mp - 6, 'trừ MP ngay lúc bấm');
	tick();
	combat.interrupt();
	assert.equal(combat.action, null);
	assert.equal(combat.pc.mp, mp, 'hoàn MP');
	assert.equal(combat.cast(2, east), 'started', 'hồi chiêu đã được trả lại');
}

// 7) Bấm đòn khác giữa lúc vào thế: xếp hàng, tự tung khi đòn trước qua mốc huỷ.
{
	const { combat, east, sent, tick } = setup(true);
	combat.cast(0, east);
	const first = combat.action!;
	assert.equal(combat.cast(1, east), 'buffered');
	assert.equal(combat.cast(0, east), 'cooldown', 'cùng đòn đang hồi chiêu thì không xếp hàng');
	let guard = 0;
	while (combat.action === first) {
		tick();
		assert.ok((guard += 1) < 60);
	}
	assert.ok(first.t >= first.timing.cancelAt, 'đòn kế chỉ tung khi đòn trước đã qua mốc huỷ');
	assert.equal(combat.action?.skill.id, 'aether_bolt', 'Tia Aether tự tung từ hàng chờ');
	assert.deepEqual(sent, ['attack/E/slash', 'cast/E/aether_bolt']);
}

// 8) Né giữa pha vào thế: huỷ có hoàn lại; qua khung chạm thì endRecovery bỏ pha thu thế.
{
	const { combat, east, tick } = setup(true);
	combat.cast(0, east);
	combat.dodge({ x: 0, y: 1 });
	assert.equal(combat.action, null, 'né huỷ đòn');
	assert.ok(combat.pc.dash, 'đang lăn');
	assert.equal(combat.cast(0, east), 'buffered', 'hồi chiêu đã trả lại; đang lăn thì xếp hàng');
	while (combat.pc.dash || combat.pc.buffered) tick();
	const a = combat.action!;
	while (!a.released) tick();
	combat.endRecovery();
	assert.equal(combat.action, a, 'khung chạm chưa hiện trọn 1 frame thì đi không cắt được');
	while (a.t + 1e-6 < a.timing.cancelAt) tick();
	combat.endRecovery();
	assert.equal(combat.action, null, 'qua mốc huỷ thì thu thế huỷ được bằng di chuyển');
}

// 9) Người chơi khác (external: false): CharacterView tự chạy đồng hồ theo dt rồi trở về nền.
{
	const { p } = setup(true);
	const timing = p.view.actionTiming('cast', 'E', Infinity)!;
	assert.ok(p.view.playAction('cast', 'E', { timing, external: false }));
	let n = 0;
	while (p.view.busy) {
		p.update(1 / 60);
		assert.ok((n += 1) < 60);
	}
	assert.equal(n, Math.ceil(timing.dur * 60));
	assert.equal(p.view.animation, 'idle');
	assert.equal(p.view.actionTiming('cast', 'S', Infinity), null, 'S chưa vẽ → không có động tác');
	assert.equal(p.view.actionTiming('cast', 'NE', Infinity)?.n, 8, 'NE lấy hướng kề E');
}

// Một frame theo đúng thứ tự Game.update: phím bấm → lặp do giữ phím (repeat) → (đi: endRecovery) → actor → combat.
type Setup = ReturnType<typeof setup>;
function frame(s: Setup, o: { press?: number; hold?: number; moving?: boolean } = {}) {
	s.combat.heldSkills.clear();
	if (o.hold !== undefined) s.combat.heldSkills.add(o.hold);
	if (o.press !== undefined) s.combat.cast(o.press, s.east);
	if (o.hold !== undefined) s.combat.cast(o.hold, s.east, { repeat: true });
	if (o.moving) s.combat.endRecovery();
	s.tick();
}

// 10) Giữ J, đan K rồi bấm 1 lúc K đang vào thế: lệnh lặp do giữ phím KHÔNG đè Hoả Cầu đang chờ.
{
	const s = setup(true);
	for (let f = 0; f < 15; f += 1) frame(s, { hold: 0 });
	frame(s, { hold: 0, press: 1 });
	assert.equal(s.combat.action?.skill.id, 'aether_bolt', 'K cắt pha thu thế của J');
	for (let f = 16; f < 24; f += 1) frame(s, { hold: 0 });
	const k = s.combat.action!;
	assert.ok(k.t + 1e-6 < k.timing.cancelAt, 'K chưa qua mốc huỷ → lệnh bấm phải xếp hàng');
	const mp = s.combat.pc.mp;
	frame(s, { hold: 0, press: 2 });
	assert.equal(s.combat.pc.buffered?.index, 2, 'giữ J không đè Hoả Cầu trong hàng chờ');
	for (let f = 0; f < 30; f += 1) frame(s, { hold: 0 });
	assert.ok(s.sent.includes('cast/E/fire_bolt'), `Hoả Cầu phải tung: ${s.sent.join(' ')}`);
	assert.ok(s.combat.pc.mp < mp, 'đã trừ MP của Hoả Cầu');
}

// 11) Giữ J đứng yên: giữa hai nhát đứng ở frame cuối chờ đòn kế, không bật về dáng nền (nháy chém → đứng → chém).
{
	const s = setup(true);
	const shown: string[] = [];
	for (let f = 0; f < 90; f += 1) {
		frame(s, { hold: 0 });
		shown.push(s.p.view.animation);
	}
	assert.ok(!shown.includes('idle'), `giữ phím mà vẫn hiện dáng nền: ${shown.join(',')}`);
	assert.equal(s.sent.filter((x) => x === 'attack/E/slash').length, 4, '90 frame / hồi chiêu 0,38s = 4 nhát');
	assert.equal(s.ended.n, 0, 'đòn diễn hết mới nối đòn kế → không gửi tin dừng');
	for (let f = 0; f < 30; f += 1) frame(s);
	assert.equal(s.p.view.animation, 'idle', 'nhả phím thì về nền');
}

// 12) Đang giữ phím đi: khung chạm vẫn hiện trọn 1 frame động tác (≥ 3 frame render ở 17fps/60Hz) rồi mới cắt.
{
	const s = setup(true);
	s.combat.cast(0, s.east);
	const hitFrame = Math.round(s.combat.action!.timing.releaseAt * s.combat.action!.timing.fps);
	let hitShown = 0;
	while (s.combat.action) {
		frame(s, { moving: true });
		if (s.p.view.animation === 'attack' && s.p.view.sprite.currentFrame === hitFrame) hitShown += 1;
	}
	assert.ok(hitShown >= 3, `khung chạm chỉ hiện ${hitShown} frame render`);
	assert.equal(s.ended.n, 1, 'cắt thu thế khi đang đi → báo máy người khác dừng hình');
}

// 13) Né đúng lúc khung chạm đang hiện: hẹn lăn ngay khi qua mốc huỷ (không cắt mất nhát chém, không nuốt phím).
{
	const s = setup(true);
	s.combat.cast(0, s.east);
	const a = s.combat.action!;
	while (!a.released) s.tick();
	s.combat.dodge({ x: 0, y: 1 });
	assert.equal(s.combat.action, a, 'chưa cắt ngay');
	assert.equal(s.combat.pc.dash, null);
	let guard = 0;
	while (!s.combat.pc.dash) {
		s.tick();
		assert.ok((guard += 1) < 10, 'phải lăn trong vòng 1 frame động tác');
	}
	assert.ok(a.t + 1e-6 >= a.timing.cancelAt, 'lăn đúng từ mốc huỷ');
	assert.equal(s.combat.action, null);
	// Né trước khung chạm: huỷ có hoàn lại và báo dừng hình.
	const s2 = setup(true);
	s2.combat.cast(0, s2.east);
	s2.tick();
	s2.combat.dodge({ x: 0, y: 1 });
	assert.equal(s2.ended.n, 1, 'né huỷ đòn → tin dừng');
}

// 14) Chiều vệt chém theo HƯỚNG đã khoá: ngắm lên trên lệch trái/phải 1px không làm vệt đổi chiều; phía tây lật.
{
	const s = setup(true);
	const at = (x: number, y: number) => {
		while (s.combat.action || (s.combat.pc.cooldowns.get('slash') ?? 0) > s.combat.time) s.tick();
		assert.equal(s.combat.cast(0, { x, y }), 'started');
		while (s.combat.action && !s.combat.action.released) s.tick();
	};
	const top = s.p.y - s.p.chest - 200;
	at(s.p.x - 1, top);
	at(s.p.x + 1, top);
	at(s.p.x - 200, s.p.y - s.p.chest);
	assert.deepEqual(s.slashes, [false, false, true], 'N giữ một chiều, W lật gương');

	// Pixi lật (scale) TRƯỚC rồi mới xoay: đánh sang tây = xoay π; cộng lật Y mới ra gương ngang của vệt phía đông
	// (bụng vệt vẫn quay về phía trước), còn lật X thì ra gương dọc — bụng vệt quay ngược về người đánh.
	const probe = new Container();
	const tip = { x: 10, y: 3 };
	probe.rotation = Math.PI;
	probe.scale.set(1, -1);
	probe.updateLocalTransform();
	const flippedY = probe.localTransform.apply(tip);
	assert.deepEqual([Math.round(flippedY.x), Math.round(flippedY.y)], [-10, 3], 'xoay π + lật Y = gương ngang');
	probe.scale.set(-1, 1);
	probe.updateLocalTransform();
	const flippedX = probe.localTransform.apply(tip);
	assert.deepEqual([Math.round(flippedX.x), Math.round(flippedX.y)], [10, -3], 'xoay π + lật X = gương dọc (sai)');
}

// 13) Nhịp đòn QUÁI (hàm thuần): khung chạm hiện đúng lúc hết đà, đà không bao giờ ngắn đi, thiếu attack → null.
{
	const e = (fps: number, frames: number, hitFrame?: number) => ({ animations: { attack: { fps, frames, hitFrame, loop: false } } });
	// Đà cận chiến 0,3s, vẽ 10fps khung chạm frame 2: pha vào thế chậm lại (2 frame trong 0,3s), thu thế đúng 10fps.
	let plan = strikePlan(e(10, 6, 2), 0.3)!;
	near(plan.windup, 0.3, 'mốc khung chạm == đà cũ');
	assert.equal(frameAt(strikeClock(plan, plan.windup), plan.timing), 2, 'hết đà đúng lúc hiện khung chạm');
	assert.equal(frameAt(strikeClock(plan, plan.windup - 1 / 60), plan.timing), 1, 'một frame game trước đó còn đang vào thế');
	assert.equal(frameAt(strikeClock(plan, 0), plan.timing), 0, 'bắt đầu từ frame 0');
	near(plan.cancelAt, 0.3 + 1 / 10, 'khung chạm hiện trọn 1 frame theo fps vẽ');
	near(plan.dur, 0.3 + 4 / 10, 'thu thế 4 frame còn lại đúng fps vẽ');
	near(strikeClock(plan, plan.windup + 0.25), 0.2 + 0.25, 'sau khung chạm chạy 1:1');
	const antic = 2 / plan.windup;
	assert.ok(antic > 1 && antic <= plan.timing.fps * STRIKE_MAX_SPEEDUP, `fps pha vào thế hợp lý (${antic.toFixed(2)})`);
	// Vẽ chậm hơn đà cho phép (4 frame ở 8fps = 0,5s, đà bắn chỉ 0,22s): giãn đà ra chứ KHÔNG để đòn nổ sớm.
	plan = strikePlan(e(8, 8, 4), 0.22)!;
	assert.ok(plan.windup >= 0.22, 'không bao giờ rút ngắn đà');
	near(plan.windup, 0.5 / STRIKE_MAX_SPEEDUP, 'vào thế phát nhanh tối đa ×2');
	assert.equal(frameAt(strikeClock(plan, plan.windup), plan.timing), 4);
	// hitFrame 0 / không khai: lấy frame mặc định ≥ 1 (phải có ít nhất 1 frame vào thế).
	plan = strikePlan(e(12, 6, 0), 0.3)!;
	assert.equal(Math.round(plan.timing.releaseAt * 12), 2, 'hitFrame 0 → round(6/3)');
	plan = strikePlan(e(12, 2), 0.3)!;
	assert.equal(Math.round(plan.timing.releaseAt * 12), 1, '2 frame: khung chạm frame 1');
	plan = strikePlan(e(12, 4, 9), 0.3)!;
	assert.equal(Math.round(plan.timing.releaseAt * 12), 3, 'hitFrame vượt số frame thì kẹp về frame cuối');
	assert.equal(strikePlan({ animations: {} }, 0.3), null, 'không có attack → null (cách cũ)');
	assert.equal(strikePlan(e(12, 1), 0.3), null, '1 frame thì không có gì để vung');
	assert.equal(strikePlan(e(12, 6), 0), null, 'không có đà');
	assert.equal(strikePlan(e(12, 6), 0.3, 1), null, 'hướng đang dùng chỉ có 1 frame');
}

// 13b) Attack 4 frame KHÔNG khai hitFrame (đúng kiểu PixelLab vẽ): vẫn có ≥ 2 frame vào thế, không chiếu chậm quá ×2
// rồi giật về nhịp gốc; phần đà dư đứng ở frame 0 kèm nháy báo đòn (`cueUntil`).
{
	const e = (fps: number, frames: number, hitFrame?: number) => ({ animations: { attack: { fps, frames, hitFrame, loop: false } } });
	assert.equal(enemyHitFrame(4), 2, 'n=4: khung chạm frame 2 (round(4/3) = 1 là quá sớm)');
	assert.equal(enemyHitFrame(3), 1);
	assert.equal(enemyHitFrame(2), 1);
	assert.equal(enemyHitFrame(6), 2);
	assert.equal(enemyHitFrame(8), 3);
	for (const windup of [0.3, 0.22, 0.36]) {
		const plan = strikePlan(e(12, 4), windup)!;
		near(plan.windup, windup, `đà ${windup}: mốc khung chạm == đà cũ`);
		assert.equal(Math.round(plan.timing.releaseAt * 12), 2, 'khung chạm frame 2');
		const seen = new Set<number>();
		for (let t = 0; t + 1e-9 < plan.windup; t += 1 / 60) seen.add(frameAt(strikeClock(plan, t), plan.timing));
		assert.deepEqual([...seen].sort(), [0, 1], `đà ${windup}: cả frame 0 lẫn 1 đều hiện trong lúc vào thế`);
		assert.equal(frameAt(strikeClock(plan, plan.windup), plan.timing), 2, 'hết đà đúng khung chạm');
		const slow = (plan.windup - plan.lead) / plan.timing.releaseAt;
		assert.ok(slow <= STRIKE_MAX_SLOWDOWN + 1e-9, `đà ${windup}: vào thế chậm tối đa ×${STRIKE_MAX_SLOWDOWN} (${slow.toFixed(2)})`);
		near(plan.cueUntil, plan.lead, 'nháy báo đòn chỉ trong đoạn đứng chờ');
		if (plan.lead > 0) assert.equal(strikeClock(plan, plan.lead / 2), 0, 'đoạn đứng chờ ở frame 0');
	}
	// Boss: đà 0,36s, vào thế 2/12s → kéo chậm 2,16 lần nếu không có lead.
	const boss = strikePlan(e(12, 4), 0.36)!;
	assert.ok(boss.lead > 0 && boss.cueUntil > 0, 'đà boss dài: có đoạn đứng chờ + nháy báo đòn');
	// Chỉ 1 frame vào thế (n = 3): dáng vung không báo được gì → nháy suốt đà.
	const three = strikePlan(e(12, 3), 0.3)!;
	near(three.cueUntil, three.windup, 'n=3: nháy báo đòn suốt đà');
	// hitFrame khai 1 tường minh với n=4: tôn trọng spec, nhưng vẫn nháy báo đòn suốt đà.
	const declared = strikePlan(e(12, 4, 1), 0.3)!;
	assert.equal(Math.round(declared.timing.releaseAt * 12), 1);
	near(declared.cueUntil, declared.windup, 'vào thế 1 frame → nháy suốt đà');
	// Đà ngắn hơn pha vào thế kéo chậm ×2: không có đoạn chờ, dáng vung tự báo hiệu.
	const quick = strikePlan(e(10, 6, 2), 0.3)!;
	assert.equal(quick.lead, 0);
	assert.equal(quick.cueUntil, 0);
}

// 14) Quái có động tác: vào thế quay về người chơi, đứng yên, khung chạm đúng frame đòn nổ, không giật; hết thì về nền.
function enemySetup(withActions: boolean, at: { x: number; y: number }) {
	const s = setup(withActions);
	const home = { x: at.x, y: at.y, radius: 40 };
	const actor = new Actor('mob_zombie_001', fakeTextures(withActions), at.x, at.y, 'S', home);
	const f = s.combat.addEnemy(actor, 'mob_zombie_001', home, 'Xác sống')!;
	f.attackTimer = 0;
	const step = (dt = 1 / 60) => {
		actor.update(dt);
		s.p.update(dt);
		s.combat.update(dt, (x, y) => ({ x, y }), 2);
	};
	return { ...s, f, actor, step };
}
{
	// Quái đứng phía đông người chơi → quay mặt W (atlas giả có attack W).
	const { combat, f, actor, step } = enemySetup(true, { x: 70, y: 100 });
	let n = 0;
	while (f.windup <= 0) {
		step();
		assert.ok((n += 1) < 30, 'quái phải vào thế');
	}
	assert.ok(f.swing, 'có attack hướng W → phát động tác');
	assert.equal(actor.view.animation, 'attack');
	assert.equal(actor.view.direction, 'W', 'quay về phía người chơi lúc bắt đầu vung');
	near(f.windup, 0.3, 'đà cận chiến giữ nguyên 0,3s');
	const pos = { x: actor.x, y: actor.y };
	const hp = combat.pc.hp;
	// Hit-stop: Game đưa dt nhỏ trong lúc khựng — xen kẽ dt lớn/nhỏ, khung chạm vẫn phải khớp đòn nổ.
	const dts = [1 / 60, 0.0013, 1 / 60, 1 / 60, 0.0013, 0.0013];
	let k = 0;
	let elapsed = 0;
	let cued = false;
	while (combat.pc.hp === hp) {
		const dt = dts[k % dts.length]!;
		k += 1;
		elapsed += dt;
		step(dt);
		assert.ok(k < 200, 'đòn phải nổ');
		if (combat.pc.hp === hp) assert.ok(actor.view.sprite.currentFrame < 2, 'chưa nổ thì chưa tới khung chạm');
		if (actor.view.sprite.tint === 0xffecec) {
			cued = true;
			assert.ok(f.swing && f.swing.t <= f.swing.plan.cueUntil + 1 / 60, 'nháy báo đòn chỉ trong đoạn đứng chờ ở frame 0');
		}
		assert.deepEqual({ x: actor.x, y: actor.y }, pos, 'đứng yên trong lúc vung');
	}
	assert.ok(elapsed + 1e-6 >= 0.3 && elapsed < 0.3 + 1 / 60, `đòn nổ đúng lúc hết đà (${elapsed.toFixed(4)}s)`);
	// 17fps, khung chạm frame 2 → vào thế 0,118s; đà 0,3s > ×2 nên có đoạn đứng chờ, đoạn đó nháy nhạt báo đòn.
	assert.ok(cued, 'đà dài hơn vào thế kéo chậm ×2: vẫn có nháy báo đòn trong đoạn đứng chờ');
	assert.equal(actor.view.sprite.currentFrame, 2, 'đòn nổ đúng frame khung chạm (hitFrame mặc định 2)');
	assert.equal((actor as unknown as { kick: { t: number } }).kick.t, 0, 'có động tác thì bỏ cú giật');
	assert.equal(actor.view.sprite.tint, 0xffffff, 'có động tác thì không nháy trắng');
	// Trong lúc phát, set() của AI chỉ đổi trạng thái nền.
	actor.view.set('walk', 'W');
	assert.equal(actor.view.animation, 'attack');
	for (let i = 0; i < 120 && f.swing; i += 1) step();
	assert.equal(f.swing, null, 'hết pha thu thế thì bỏ động tác');
	assert.notEqual(actor.view.animation, 'attack', 'không kẹt ở frame đánh');
}
{
	// Quái đứng phía bắc → quay mặt S, atlas giả KHÔNG có attack S: giữ y nguyên cách cũ (nháy trắng + giật).
	const { combat, f, actor, step } = enemySetup(true, { x: 40, y: 72 });
	let n = 0;
	let tinted = false;
	while (f.windup <= 0) {
		step();
		assert.ok((n += 1) < 30, 'quái phải vào thế');
	}
	assert.equal(f.swing, null, 'hướng chưa vẽ → không có động tác');
	near(f.windup, 0.3, 'đà cũ');
	const hp = combat.pc.hp;
	while (combat.pc.hp === hp) {
		step();
		tinted ||= actor.view.sprite.tint === 0xffe0e0;
		assert.ok((n += 1) < 60, 'đòn phải nổ');
	}
	assert.ok(tinted, 'không có động tác thì vẫn nháy trắng báo đòn');
	assert.ok((actor as unknown as { kick: { t: number } }).kick.t > 0, 'không có động tác thì vẫn giật (lunge)');
}
{
	// Huỷ đúng lúc: đóng băng, chết, hồi sinh, thoát leash, gỡ map — không bao giờ kẹt ở frame đánh.
	const start = () => {
		const s = enemySetup(true, { x: 70, y: 100 });
		while (!s.f.swing) s.step();
		s.step();
		return s;
	};
	let s = start();
	s.f.freeze = 1;
	s.step();
	assert.equal(s.f.swing, null, 'đóng băng cắt động tác');
	assert.equal(s.f.windup, 0);
	assert.notEqual(s.actor.view.animation, 'attack');
	s = start();
	(s.combat as unknown as { kill(f: Fighter): void }).kill(s.f);
	assert.equal(s.f.swing, null, 'chết thì bỏ động tác');
	assert.ok(!s.actor.view.busy);
	s = start();
	s.combat.pc.dead = true;
	s.combat.pc.respawnT = 99;
	s.step();
	assert.equal(s.f.swing, null, 'người chơi gục (rời giao chiến) thì bỏ động tác');
	assert.ok(!s.actor.view.busy && !s.f.engaged);
	s = start();
	s.combat.clearWorld();
	assert.equal(s.f.swing, null, 'gỡ map thì bỏ động tác');
	assert.ok(!s.actor.view.busy);
	s = start();
	(s.combat as unknown as { respawn(f: Fighter): void }).respawn(s.f);
	assert.equal(s.f.swing, null, 'hồi sinh thì bỏ động tác');
	assert.ok(!s.actor.view.busy);
}

console.log('✔ action.test: vào thế → khung chạm → thu thế, dự phòng, huỷ/hoàn lại, xếp hàng, né, người chơi khác, giữ phím, đi, chiều vệt chém; đòn quái: khung chạm = hết đà, dự phòng giật, huỷ đúng lúc');

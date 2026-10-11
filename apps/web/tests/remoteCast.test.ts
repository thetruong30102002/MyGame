// Chạy: npx tsx tests/remoteCast.test.ts — người chơi THẤY chiêu của nhau (chủ dự án 09/10/2026: "người này phải thấy skill
// của người kia chơi pvp mà"): phần chiêu của tin `action` (gói / chuẩn hoá / giải nghĩa — thuần) và `CombatSystem.echoCast`
// vẽ lại ĐÚNG hình như máy người tung, CHỈ HÌNH (không sát thương, không trừ máu / MP, không báo mạng).
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
const { ACTION_FX_FLAGS, cleanActionFx } = await import('@aether/protocol');
const { castFx, planRemoteCast } = await import('../src/game/combat/remoteCast');
const { HERO_SKILLS, isGroundTarget } = await import('../src/game/combat/skills');
const { SKILL_NODE, SWORD_ART_TIER } = await import('../src/game/combat/talents');
const { Actor } = await import('../src/game/entities/Actor');
const { CombatSystem } = await import('../src/game/combat/CombatSystem');
type Entry = import('../src/game/assets/AssetManifest').CharacterManifestEntry;
type Textures = import('../src/game/assets/AssetManifest').CharacterTextures;
type Dir = import('../src/game/assets/AssetManifest').Direction;
type SkillDef = import('../src/game/combat/skills').SkillDef;
type ActionFx = import('@aether/protocol').ActionFx;
type ActionName = import('../src/game/assets/AssetManifest').ActionName;
type Tiers = import('../src/game/combat/talents').Tiers;
type EnchantId = import('../src/game/combat/talents').EnchantId;

let passed = 0;
const test = (name: string, fn: () => void): void => {
	fn();
	passed += 1;
	console.log(`  ✔ ${name}`);
};
const skill = (id: string): SkillDef => HERO_SKILLS.find((s) => s.id === id)!;
const wire = (fx: ActionFx | undefined): unknown => JSON.parse(JSON.stringify(fx));

console.log('remoteCast (thấy chiêu của nhau)');

// ———————————————————————— 1) Phần thuần: gói ở máy người tung → mạng → giải nghĩa ở máy người xem ————————————————————————

const base = { dx: 1, dy: 0, x: 400, y: 400, tx: 550, ty: 400, enchant: null, cd: 99, sp: 1, boost: 1, windBladeTier: false, afterGuard: false };

test('cleanActionFx: hướng chuẩn hoá + làm tròn; hướng / điểm nhắm vô lý → bỏ cả phần chiêu; trường phụ sai chỉ bỏ trường đó', () => {
	assert.deepEqual(cleanActionFx({ ax: 3, ay: 4 }), { ax: 0.6, ay: 0.8 });
	for (const bad of [null, 'x', [1, 0], {}, { ax: 0, ay: 0 }, { ax: Number.NaN, ay: 1 }, { ax: '1', ay: 0 }, { ax: 1e9, ay: 0 }]) assert.equal(cleanActionFx(bad), null, JSON.stringify(bad));
	assert.equal(cleanActionFx({ ax: 1, ay: 0, tx: 1e9, ty: 5 }), null, 'điểm nhắm ngoài thế giới');
	assert.equal(cleanActionFx({ ax: 1, ay: 0, tx: -5, ty: 5 }), null, 'điểm nhắm âm');
	assert.equal(cleanActionFx({ ax: 1, ay: 0, tx: 100 }), null, 'chỉ có một toạ độ');
	assert.deepEqual(cleanActionFx({ ax: 1, ay: 0, tx: 10.4, ty: 20.6, el: 'Fire!', cd: -1, sp: 9, boost: 0.5, fl: 2.5, junk: 1 }), { ax: 1, ay: 0, tx: 10, ty: 21 });
	assert.deepEqual(cleanActionFx({ ax: 1, ay: 0, el: 'fire', cd: 0.3333, sp: 1.25, boost: 1.2, fl: 3 }), { ax: 1, ay: 0, el: 'fire', cd: 0.333, sp: 1.25, boost: 1.2, fl: 3 });
});

test('castFx: chỉ gửi trường có nghĩa với chiêu (điểm nhắm cho đòn đặt vùng, phủ phép cho đòn kiếm thép)', () => {
	assert.deepEqual(castFx(skill('aether_bolt'), { ...base, enchant: 'fire' }), { ax: 1, ay: 0 }, 'phép: không điểm nhắm, không phủ phép');
	assert.deepEqual(castFx(skill('slash'), { ...base, enchant: 'fire' }), { ax: 1, ay: 0, el: 'fire' });
	assert.equal(castFx(skill('frost_cleave'), { ...base, enchant: 'fire' }).el, undefined, 'kiếm pháp nguyên tố đã có hệ riêng');
	const m = castFx(skill('meteor'), { ...base, tx: 400 + 5000, ty: 400 });
	assert.deepEqual([m.tx, m.ty], [400 + skill('meteor').range!, 400], 'điểm nhắm kẹp theo tầm chiêu như khung chạm');
	const edge = castFx(skill('meteor'), { ...base, x: 10, y: 10, tx: -200, ty: -200 });
	assert.ok(edge.tx! >= 0 && edge.ty! >= 0, 'mép bản đồ: không gửi toạ độ âm (máy chủ sẽ bỏ cả phần chiêu)');
	assert.equal(castFx(skill('slash'), { ...base, cd: skill('slash').cooldown }).cd, undefined, 'hồi chiêu gốc thì không gửi');
	assert.equal(castFx(skill('slash'), { ...base, cd: 0.3, sp: 1.25 }).cd, 0.3);
	assert.equal(castFx(skill('wind_blade'), { ...base, boost: 1.2 }).boost, 1.2, 'Gió Sắc: đạn phép Phong');
	assert.equal(castFx(skill('fire_bolt'), { ...base, boost: 1.2 }).boost, undefined);
	assert.equal(castFx(skill('slash'), { ...base, enchant: 'wind', windBladeTier: true }).fl, ACTION_FX_FLAGS.windBlade);
	assert.equal(castFx(skill('slash'), { ...base, enchant: 'fire', windBladeTier: true }).fl, undefined, 'lưỡi gió chỉ khi phủ Phong');
	assert.equal(castFx(skill('whirlpool'), { ...base, afterGuard: true }).fl, ACTION_FX_FLAGS.surge);
	assert.equal(castFx(skill('slash'), { ...base, afterGuard: true }).fl, undefined);
});

test('planRemoteCast: khứ hồi qua JSON ra đúng chiêu; chiêu lạ / thiếu / hỏng phần chiêu → null (chỉ phát động tác)', () => {
	const c = planRemoteCast('slash', wire(castFx(skill('slash'), { ...base, dx: 0.6, dy: 0.8, enchant: 'wind', windBladeTier: true, cd: 0.3, sp: 1.25 })))!;
	assert.deepEqual([c.skill.id, c.dx, c.dy, c.enchant, c.windBlade, c.cooldown, c.speed, c.body, c.wait], ['slash', 0.6, 0.8, 'wind', true, 0.3, 1.25, true, 0]);
	assert.equal(planRemoteCast('dance', { ax: 1, ay: 0 }), null, 'chiêu lạ');
	assert.equal(planRemoteCast('slash', undefined), null, 'máy gửi bản cũ: không có phần chiêu');
	assert.equal(planRemoteCast('slash', { ax: 0, ay: 0 }), null);
	const odd = planRemoteCast('slash', { ax: 1, ay: 0, el: 'shadow', cd: 30 })!;
	assert.deepEqual([odd.enchant, odd.cooldown], [undefined, skill('slash').cooldown], 'hệ lạ bỏ; hồi chiêu dài hơn gốc là số bịa → gốc');
	assert.equal(planRemoteCast('fire_bolt', { ax: 1, ay: 0, el: 'fire' })!.enchant, undefined, 'phép không mang phủ phép');
	assert.equal(planRemoteCast('aether_bolt', { ax: 1, ay: 0, tx: 5, ty: 5 })!.tx, undefined, 'đạn không dùng điểm nhắm');
	assert.deepEqual([planRemoteCast('meteor', { ax: 1, ay: 0, tx: 700, ty: 400 })!.tx, planRemoteCast('meteor', { ax: 1, ay: 0 })!.tx], [700, undefined]);
	assert.equal(planRemoteCast('fire_bolt', { ax: 1, ay: 0, fl: ACTION_FX_FLAGS.windBlade })!.windBlade, false, 'cờ không hợp chiêu thì bỏ');
	assert.equal(planRemoteCast('whirlpool', { ax: 1, ay: 0, fl: ACTION_FX_FLAGS.surge })!.surge, true);
	assert.equal(planRemoteCast('heavy_strike', { ax: 1, ay: 0 })!.wait, skill('heavy_strike').charge, 'dồn lực: tin tới lúc bắt đầu dồn');
	assert.equal(planRemoteCast('calm_stance', { ax: 1, ay: 0 })!.body, false, 'giữ thế không vung thân');
	assert.equal(planRemoteCast('gale_dash', { ax: 1, ay: 0 })!.body, false, 'lướt không vung thân');
});

// ———————————————————————— 2) Trong trận: máy người tung và máy người xem vẽ CÙNG hình, cùng nhịp ————————————————————————

const DIRS: Dir[] = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'];
const strip = (n: number) => Array.from({ length: n }, () => new Texture());
/** Nhân vật giả: idle/walk đủ 8 hướng; attack/cast vẽ E + W (hướng S chưa vẽ → đòn nổ ngay, không vung). */
function fakeTextures(): Textures {
	const anims: Record<string, Partial<Record<Dir, InstanceType<typeof Texture>[]>>> = {
		idle: Object.fromEntries(DIRS.map((d) => [d, strip(4)])),
		walk: Object.fromEntries(DIRS.map((d) => [d, strip(6)])),
		attack: { E: strip(6), W: strip(6) },
		cast: { E: strip(8), W: strip(8) },
	};
	const entry: Entry = {
		displayName: 'Thử',
		role: 'player',
		atlas: '',
		frameSize: { width: 64, height: 64 },
		anchor: { x: 0.5, y: 0.9 },
		animations: { idle: { fps: 6 }, walk: { fps: 10 }, attack: { fps: 17, frames: 6, loop: false, directions: ['E', 'W'] }, cast: { fps: 20, frames: 8, loop: false, directions: ['E', 'W'] } },
		source: { provider: 'test', ref: null },
		bodyHeight: 60,
	};
	const near8: Record<Dir, Dir[]> = { S: ['S', 'SE', 'SW'], N: ['N', 'NE', 'NW'], E: ['E', 'SE', 'NE'], W: ['W', 'SW', 'NW'], SE: ['SE', 'E', 'S'], SW: ['SW', 'W', 'S'], NE: ['NE', 'E', 'N'], NW: ['NW', 'W', 'N'] };
	const actionFrames = (anim: string, dir: Dir) => near8[dir].map((d) => anims[anim]?.[d]).find((l) => l?.length) ?? null;
	return { id: 'test', entry, frames: (anim, dir) => anims[anim]?.[dir] ?? anims.idle!.S!, has: (anim) => !!anims[anim], hasDir: (anim, dir) => actionFrames(anim, dir) !== null, actionFrames };
}

interface Sent {
	anim: ActionName;
	dir: Dir;
	skill: string;
	fx?: ActionFx;
}

/** Một máy: CombatSystem + người chơi của máy đó; ghi mọi hình phát ra kèm số frame. */
function machine(x: number, y: number) {
	const clock = { f: 0 };
	const plays: string[] = [];
	const vfx = { ground: new Container(), top: new Container(), play: (id: string) => void plays.push(`${clock.f}:${id}`), frames: () => [], update: () => undefined, clear: () => undefined };
	const sent: Sent[] = [];
	const ended = { n: 0, hits: [] as boolean[] };
	const practice: string[] = [];
	const netHits: number[] = [];
	const combat = new CombatSystem(
		{
			mover: (pos, dx, dy) => {
				pos.x += dx;
				pos.y += dy;
			},
			shake: () => undefined,
			toast: () => undefined,
			enemyKilled: () => undefined,
			bossNear: () => false,
			playerRespawn: () => ({ x: 0, y: 0 }),
			isUnlocked: () => true,
			practiceHit: (el) => void practice.push(el),
			onAction: (anim, dir, s, fx) => void sent.push({ anim, dir, skill: s, fx }),
			onActionEnd: (hit) => {
				ended.n += 1;
				ended.hits.push(!!hit);
			},
			netHit: (_f, n) => void netHits.push(n),
		},
		{ level: 60, exp: 0, coins: 0, potions: 0 },
		vfx as never,
	);
	const p = new Actor('hero', fakeTextures(), x, y, 'S', null);
	combat.setPlayer(p);
	combat.refill();
	return { clock, plays, sent, ended, practice, netHits, combat, p };
}

/** Học đúng chiêu `s` (nhánh + mốc + lưu phái + nguyên tố của kiếm pháp) — mốc thấp nhất có thể, ít bị động lẫn vào hình. */
function learn(m: ReturnType<typeof machine>, s: SkillDef, extra: Tiers = {}): void {
	const node = SKILL_NODE[s.id];
	const tiers: Tiers = { ...extra };
	if (node) {
		tiers[node.branch] = Math.max(tiers[node.branch] ?? 0, node.tier, 1);
		if (node.art) tiers[node.art] = Math.max(tiers[node.art] ?? 0, SWORD_ART_TIER);
	}
	m.combat.setTalents(tiers, node?.style ?? null);
}

const DT = 1 / 60;
const FRAMES = 60 * 7;
const sorted = (l: string[]) => [...l].sort();
const ids = (l: string[]) => sorted(l.map((s) => s.split(':')[1]!));

/**
 * Máy A tung chiêu `s` về hướng `aimDir` (E: có động tác; S: atlas chưa vẽ → nổ ngay); tin `action` đi qua JSON tới máy B; máy B
 * vẽ lại trên nhân vật của A (vị trí theo đúng đường A đi — như ảnh chụp máy chủ). Trả hình của hai máy + trạng thái của B.
 */
function replay(s: SkillDef, o: { aimDir?: 'E' | 'S'; enchant?: EnchantId; extra?: Tiers } = {}) {
	const a = machine(400, 400);
	learn(a, s, o.extra);
	if (o.enchant) assert.equal(a.combat.setEnchant(o.enchant), 'ok');
	a.combat.pc.mp = 9999;
	const idx = a.combat.skills.indexOf(s);
	const far = o.aimDir === 'S' ? { x: a.p.x, y: a.p.y + 150 } : { x: a.p.x + 150, y: a.p.y };
	const aim = isGroundTarget(s) ? far : { x: far.x, y: far.y - a.p.chest };
	assert.equal(a.combat.cast(idx, aim), 'started', `${s.id}: máy A tung được`);
	const path: { x: number; y: number }[] = [];
	for (let i = 1; i <= FRAMES; i += 1) {
		a.clock.f = i;
		a.p.update(DT);
		a.combat.update(DT, (x, y) => ({ x, y }), 2);
		path.push({ x: a.p.x, y: a.p.y });
	}
	assert.equal(a.sent.length, 1, `${s.id}: máy A báo mạng đúng một tin`);
	const msg = a.sent[0]!;

	const b = machine(3000, 3000);
	const remote = new Actor('hero', fakeTextures(), 400, 400, 'S', null);
	const cast = planRemoteCast(msg.skill, wire(msg.fx));
	assert.ok(cast, `${s.id}: máy B giải được phần chiêu`);
	const before = { hp: b.combat.pc.hp, mp: b.combat.pc.mp };
	b.combat.echoCast(remote, msg.anim, msg.dir, cast);
	for (let i = 1; i <= FRAMES; i += 1) {
		b.clock.f = i;
		Object.assign(remote, path[i - 1]);
		b.combat.update(DT, (x, y) => ({ x, y }), 2);
		remote.update(DT);
	}
	assert.deepEqual([b.combat.pc.hp, b.combat.pc.mp, b.combat.action, b.sent.length, b.practice.length], [before.hp, before.mp, null, 0, 0], `${s.id}: máy B không mất máu / MP, không tự ra đòn, không báo mạng`);
	return { a, b, msg, remote };
}

// Tuyệt kỹ mốc 10 chỉ có ở phòng tập (không mạng, không ai thấy) — chưa vẽ lại cho người khác.
const ECHOED = HERO_SKILLS.filter((s) => s.kind !== 'blink' && !s.ult);

test(`${ECHOED.length} chiêu (trừ Ảnh Bộ — cần mục tiêu): máy người xem vẽ ĐÚNG bộ hình như máy người tung`, () => {
	for (const s of ECHOED) {
		const { a, b } = replay(s);
		assert.ok(a.plays.length > 0, `${s.id}: máy A có hình`);
		assert.deepEqual(ids(b.plays), ids(a.plays), `${s.id}: bộ hình khác nhau`);
	}
});

test('cùng nhịp: hình ra ĐÚNG frame như máy người tung (khung chạm theo hitFrame; lướt thì vệt cuối chờ nhân vật trượt tới)', () => {
	for (const s of ECHOED) {
		if (s.kind === 'dash') continue;
		const { a, b } = replay(s);
		assert.deepEqual(sorted(b.plays), sorted(a.plays), `${s.id}: lệch nhịp`);
	}
	// Có động tác: khung chạm KHÔNG ở frame 0 (vào thế trước) — hình chém ra cùng frame ở hai máy.
	const { a, b } = replay(skill('slash'));
	const at = (l: string[]) => l.find((x) => x.endsWith(':slash'));
	assert.ok(at(a.plays) && !at(a.plays)!.startsWith('0:'), 'máy A vào thế trước khi chém');
	assert.equal(at(b.plays), at(a.plays));
});

test('hướng atlas chưa vẽ (S): đòn nổ ngay ở cả hai máy, cùng bộ hình', () => {
	for (const id of ['slash', 'fire_bolt', 'meteor', 'tidal_wave']) {
		const { a, b } = replay(skill(id), { aimDir: 'S' });
		assert.deepEqual(sorted(b.plays), sorted(a.plays), id);
	}
});

test('phủ phép: vệt chém / đạn kiếm mang màu hệ, lưỡi gió (Phong mốc 7) bay theo nhát chém — y như máy người tung', () => {
	const fire = replay(skill('slash'), { enchant: 'fire', extra: { sword: 2, fire: 5 } });
	assert.equal(fire.msg.fx?.el, 'fire');
	assert.ok(ids(fire.b.plays).includes('fire_flash'), 'vệt chém phủ Hoả');
	assert.deepEqual(ids(fire.b.plays), ids(fire.a.plays));
	const wind = replay(skill('slash'), { enchant: 'wind', extra: { sword: 2, wind: 7 } });
	assert.equal(wind.msg.fx?.fl, ACTION_FX_FLAGS.windBlade);
	assert.ok(ids(wind.b.plays).includes('wind_burst'), 'lưỡi gió bay hết tầm rồi tan');
	assert.deepEqual(sorted(wind.b.plays), sorted(wind.a.plays));
	const wave = replay(skill('blade_wave'), { enchant: 'ice', extra: { sword: 5, ice: 5 } });
	assert.deepEqual(sorted(wave.b.plays), sorted(wave.a.plays), 'Lưỡi Sóng phủ Băng');
});

test('máy người tung: chiêu không vung (lướt, giữ thế) vẫn báo — kèm động tác riêng cho máy bản cũ; dồn lực báo lúc BẮT ĐẦU dồn, né thì tin dừng; cắt sau khung chạm thì tin dừng kèm `hit`', () => {
	const a = machine(400, 400);
	learn(a, skill('calm_stance'));
	a.combat.cast(a.combat.skills.indexOf(skill('calm_stance')), { x: 550, y: 400 - a.p.chest });
	assert.deepEqual([a.sent[0]?.anim, a.sent[0]?.skill, a.sent[0]?.fx?.ax], ['block', 'calm_stance', 1]);
	const h = machine(400, 400);
	learn(h, skill('heavy_strike'));
	h.combat.cast(h.combat.skills.indexOf(skill('heavy_strike')), { x: 550, y: 400 - h.p.chest });
	assert.equal(h.sent.length, 1, 'báo ngay lúc bắt đầu dồn lực');
	for (let i = 0; i < 60; i += 1) h.combat.update(DT, (x, y) => ({ x, y }), 2);
	assert.equal(h.sent.length, 1, 'dồn xong vào động tác: không báo lần hai');
	const d = machine(400, 400);
	learn(d, skill('heavy_strike'));
	d.combat.cast(d.combat.skills.indexOf(skill('heavy_strike')), { x: 550, y: 400 - d.p.chest });
	d.combat.dodge({ x: 0, y: 1 });
	assert.equal(d.ended.n, 1, 'né giữa lúc dồn → tin dừng (máy kia bỏ cú dồn)');
	assert.deepEqual(d.ended.hits, [false], 'cú dồn chưa nổ: tin dừng không kèm `hit`');
	// Đòn đã qua khung chạm rồi mới bị cắt (đi / đòn kế trong pha thu thế): tin dừng kèm `hit` — máy kia vẽ nốt nếu chưa kịp nổ.
	const w = machine(400, 400);
	learn(w, skill('slash'));
	w.combat.cast(w.combat.skills.indexOf(skill('slash')), { x: 550, y: 400 - w.p.chest });
	w.combat.cancelAction(true);
	assert.deepEqual(w.ended.hits, [false], 'cắt TRƯỚC khung chạm: không `hit`');
	w.combat.pc.cooldowns.clear();
	w.combat.cast(w.combat.skills.indexOf(skill('slash')), { x: 550, y: 400 - w.p.chest });
	for (let i = 0; i < 60 && !w.combat.action?.released; i += 1) w.combat.update(DT, (x, y) => ({ x, y }), 2);
	assert.ok(w.combat.action?.released, 'đã qua khung chạm, động tác chưa hết');
	w.combat.cancelAction(true);
	assert.deepEqual(w.ended.hits, [false, true], 'cắt SAU khung chạm: kèm `hit`');
});

test('tin dừng trước khung chạm: máy người xem không vẽ đòn đó; đòn mới tới khi đòn cũ chưa nổ / tin dừng kèm `hit` → đòn cũ nổ ngay', () => {
	const b = machine(3000, 3000);
	const r = new Actor('hero', fakeTextures(), 400, 400, 'S', null);
	const run = (n: number) => {
		for (let i = 0; i < n; i += 1) {
			b.combat.update(DT, (x, y) => ({ x, y }), 2);
			r.update(DT);
		}
	};
	b.combat.echoCast(r, 'attack', 'E', planRemoteCast('slash', { ax: 1, ay: 0 })!);
	assert.ok(r.view.busy, 'vung thân');
	run(1);
	b.combat.cancelEcho(r);
	r.view.cancelAction();
	run(60);
	assert.equal(b.plays.length, 0, 'đòn bị huỷ không có hình');
	b.combat.echoCast(r, 'attack', 'E', planRemoteCast('slash', { ax: 1, ay: 0 })!);
	b.combat.echoCast(r, 'cast', 'E', planRemoteCast('fire_bolt', { ax: 1, ay: 0 })!);
	assert.ok(ids(b.plays).includes('slash'), 'nhát chém chưa nổ được vẽ nốt ngay');
	// Tin dừng kèm `hit` (máy người tung đã nổ đòn, hai tin tới dồn): vẽ nốt ngay thay vì bỏ.
	b.combat.cancelEcho(r);
	r.view.cancelAction();
	run(150);
	b.plays.length = 0;
	b.combat.echoCast(r, 'cast', 'E', planRemoteCast('fire_bolt', { ax: 1, ay: 0 })!);
	assert.ok(!ids(b.plays).includes('arcane_orb'), 'chưa tới khung chạm');
	b.combat.cancelEcho(r, true);
	r.view.cancelAction();
	assert.ok(ids(b.plays).includes('arcane_orb'), 'quả cầu ở tay hiện ngay');
	const shots = b.plays.length;
	run(150);
	assert.ok(b.plays.length > shots, 'đạn đã bắn ra, bay rồi tan');
	// Thế đỡ: nhuộm nhân vật như thế đỡ của mình, hết giờ trả màu.
	b.combat.echoCast(r, 'block', 'E', planRemoteCast('calm_stance', { ax: 1, ay: 0 })!);
	run(1);
	assert.notEqual(r.view.sprite.tint, 0xffffff, 'đang giữ thế: nhuộm xanh');
	run(60 * 5);
	assert.equal(r.view.sprite.tint, 0xffffff, 'hết thế: trả màu');
});

test('đạn hình chạm quái DÙNG CHUNG thì tan + hình trúng, không trừ máu, không báo máy chủ; quái riêng thì bay xuyên', () => {
	const b = machine(3000, 3000);
	const r = new Actor('hero', fakeTextures(), 400, 400, 'S', null);
	// Quái đứng ngay trên đường bay (đạn bay ở tầm ngực người bắn): cao 60px, chân ở y 400 — ngực người bắn ở y ≈ 371.
	const home = { x: 520, y: 400, radius: 40 };
	const mob = (net: boolean) => b.combat.addEnemy(new Actor('mob_zombie_001', fakeTextures(), 520, 400, 'W', home), 'mob_zombie_001', home, 'Xác sống', net ? { net: { id: 'g:x:0', owned: false, tx: 520, ty: 400, dir: 'W', anim: 'idle' } } : {})!;
	const flight = (shared: boolean): number => {
		b.plays.length = 0;
		b.combat.clearWorld();
		const f = mob(shared);
		const hp = f.hp;
		b.combat.echoCast(r, 'cast', 'S', planRemoteCast('fire_bolt', { ax: 1, ay: 0 })!);
		let frames = 0;
		while (!b.plays.some((x) => x.endsWith('fire_burst')) && frames < 240) {
			b.clock.f = frames += 1;
			b.combat.update(DT, (x, y) => ({ x, y }), 2);
		}
		assert.equal(f.hp, hp, 'không trừ máu quái');
		return frames;
	};
	const stopped = flight(true);
	const through = flight(false);
	assert.ok(stopped < through, `chạm quái dùng chung tan sớm (${stopped} < ${through} frame)`);
	assert.equal(b.netHits.length, 0, 'không báo máy chủ đòn trúng');
});

console.log(`${passed} test qua`);

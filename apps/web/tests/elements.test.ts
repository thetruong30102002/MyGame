// Chạy: npx tsx tests/elements.test.ts — GĐ2 cây Nguyên tố (lượt A): kiểu đòn mới (vùng quanh mình, vùng nhắm, nón,
// đường thẳng, lướt, cột trồi, vùng tồn tại có hút), trạng thái mới (choáng, hất, phá giáp, trượt, chậm nặng, đẩy lùi;
// boss một nửa), 4 phản ứng Thổ, bị động Thấm Sâu / Huyết Thuỷ / Đá Nặng / Da Đá, phủ Thổ, trần mốc, bảng TEMP_ART.
// Mốc 6–9 (GĐ3) ở tests/tiers69.test.ts.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
	aheadPoint,
	armorDamage,
	attackMisses,
	ccSeconds,
	clampTarget,
	dashPlan,
	EARTH,
	EARTH_ENCHANT,
	GROUND_SQUASH,
	inArea,
	inCircle,
	inCone,
	inLine,
	knockDir,
	launchHeight,
	lifestealHeal,
	lineSegments,
	moveFactor,
	pullStep,
	segmentDistance,
} from '../src/game/combat/skillRules';
import { HERO_SKILLS, isGroundTarget, isSwordSkill, skillFacts, type SkillKind } from '../src/game/combat/skills';
import { knowsSkill, PASSIVE, REACTION_NAME, REACTION_PAIR, SKILL_NODE, tierCap, TREE, BRANCHES, type Branch } from '../src/game/combat/talents';
import { TEMP_ART, tempIcon } from '../src/game/combat/tempArt';

const near = (a: number, b: number, what: string, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${what}: ${a} ≠ ${b}`);
const idx = (id: string) => {
	const i = HERO_SKILLS.findIndex((s) => s.id === id);
	assert.ok(i >= 0, `có kỹ năng ${id}`);
	return i;
};

// 1) Hình học thuần của các kiểu đòn.
{
	// Vùng tròn trên mặt đất là elip dẹt dọc (0,62): 60px xuống dưới = 96,8 "đơn vị đất" < 100.
	assert.equal(GROUND_SQUASH, 0.62);
	assert.equal(inCircle(0, 60, 0, 0, 100), true);
	assert.equal(inCircle(0, 70, 0, 0, 100), false, 'theo chiều dọc vùng ngắn hơn');
	assert.equal(inCircle(100, 0, 0, 0, 100), true, 'mép ngang');
	assert.equal(inCircle(110, 0, 0, 0, 100, 14), true, 'nới bằng bề ngang thân');
	// Nón: hướng đông, dài 150, nửa góc 30°.
	assert.equal(inCone(100, 0, 0, 0, 1, 0, 150, 30), true);
	assert.equal(inCone(100, 70, 0, 0, 1, 0, 150, 30), false, '35° > 30°');
	assert.equal(inCone(100, 70, 0, 0, 1, 0, 150, 30, 14), true, 'thân chạm mép nón vẫn trúng');
	assert.equal(inCone(100, 100, 0, 0, 1, 0, 150, 30, 14), false, '45° ngoài nón');
	assert.equal(inCone(-50, 0, 0, 0, 1, 0, 150, 30, 14), false, 'sau lưng');
	assert.equal(inCone(160, 0, 0, 0, 1, 0, 150, 30), false, 'quá tầm');
	assert.equal(inCone(5, 5, 0, 0, 1, 0, 150, 30, 14), true, 'đè lên gốc');
	// Đường thẳng (đầu mút bo tròn).
	near(segmentDistance(50, 20, 0, 0, 100, 0), 20, 'khoảng cách tới đoạn');
	near(segmentDistance(130, 0, 0, 0, 100, 0), 30, 'quá đầu mút');
	assert.equal(inLine(50, 20, 0, 0, 100, 0, 26), true);
	assert.equal(inLine(50, 30, 0, 0, 100, 0, 26), false);
	assert.equal(inLine(50, 30, 0, 0, 100, 0, 26, 14), true);
	assert.equal(inLine(110, 0, 0, 0, 100, 0, 26), true, 'đầu mút bo tròn');
	assert.equal(inArea({ kind: 'line', ax: 0, ay: 0, bx: 100, by: 0, half: 26 }, 130, 0), false);
	assert.equal(inArea({ kind: 'cone', x: 0, y: 0, dx: 0, dy: 1, range: 100, half: 40 }, 0, 80), true);
	// Điểm nhắm kẹp theo tầm; không chuột thì đặt trước mặt.
	assert.deepEqual(clampTarget(0, 0, 300, 400, 250), { x: 150, y: 200 });
	assert.deepEqual(clampTarget(0, 0, 30, 40, 250), { x: 30, y: 40 }, 'trong tầm: giữ nguyên');
	const a = aheadPoint(10, 20, 1, 1, 100);
	near(a.x, 10 + 100 / Math.SQRT2, 'trước mặt (chéo) x');
	near(a.y, 20 + 100 / Math.SQRT2, 'trước mặt (chéo) y');
	// Gai trồi theo đoạn 34px.
	const segs = lineSegments(0, 0, 2, 0, 100, 34);
	assert.deepEqual(segs.map((s) => [s.ax, s.bx, s.cx]), [[0, 34, 17], [34, 68, 51], [68, 100, 84]]);
	// Lướt + hút.
	assert.deepEqual(dashPlan(3, 4, 200, 500), { vx: 300, vy: 400, t: 0.4 });
	assert.deepEqual(pullStep(0, 0, 10, 0, 90, 1), { dx: 10, dy: 0 }, 'không hút quá tâm');
	assert.deepEqual(pullStep(0, 0, 100, 0, 90, 0.5), { dx: 45, dy: 0 });
	// Hướng đẩy: ra xa tâm vùng / gốc nón; theo chiều đường thẳng.
	assert.deepEqual(knockDir({ kind: 'circle', x: 0, y: 0, r: 50 }, 0, 10), { x: 0, y: 1 });
	assert.deepEqual(knockDir({ kind: 'line', ax: 0, ay: 0, bx: 0, by: -50, half: 10 }, 5, -10), { x: 0, y: -1 });
	assert.deepEqual(knockDir({ kind: 'cone', x: 0, y: 0, dx: 1, dy: 0, range: 50, half: 30 }, 0, 0), { x: 1, y: 0 }, 'đè lên gốc: theo hướng nón');
}

// 2) Trạng thái thuần: boss nửa thời lượng, hất parabol, phá giáp, chậm, trượt, hút máu.
{
	assert.equal(ccSeconds(1.6, true), 0.8);
	assert.equal(ccSeconds(1.6, false), 1.6);
	assert.equal(launchHeight(0.25, 0.5), 26, 'đỉnh hất ở giữa');
	assert.deepEqual([launchHeight(0.5, 0.5), launchHeight(0, 0.5)], [0, 0], 'đầu/cuối nằm trên đất');
	assert.equal(armorDamage(40, 8, false), 36);
	assert.equal(armorDamage(40, 8, true), 44, 'phá giáp: giáp còn nửa + nhận thêm 15%');
	assert.equal(armorDamage(1, 50, true), 1, 'sàn 1');
	assert.equal(moveFactor({ chill: 1, wet: 0 }, 0.35, 1), 0.5, 'lạnh');
	assert.equal(moveFactor({ chill: 1, frost: 1, wet: 0 }, 0.35, 1), 0.35, 'lạnh sâu');
	assert.equal(moveFactor({ chill: 1, wet: 0, slow: 2, slowMult: EARTH.mudSlow }, 0.35, 1), 0.3, 'Bùn Lầy: lấy mức chậm nhất, không nhân chồng');
	near(moveFactor({ chill: 0, wet: 2 }, 0.35, PASSIVE.wetSlow), 0.9, 'Thấm Sâu');
	near(moveFactor({ chill: 1, wet: 2 }, 0.35, PASSIVE.wetSlow), 0.45, 'Thấm Sâu nhân thêm lên lạnh');
	assert.deepEqual([attackMisses(1, 0.4, 0.39), attackMisses(1, 0.4, 0.41), attackMisses(0, 0.4, 0)], [true, false, false]);
	assert.deepEqual([lifestealHeal(38, 0.05), lifestealHeal(9, 0.05), lifestealHeal(10, 0.05), lifestealHeal(100, 0)], [2, 0, 1, 0]);
}

// 3) Dữ liệu kỹ năng GĐ2: đủ 7 kiểu đòn mới, nhánh/mốc đúng bảng 3.2, phím mặc định, nhắm điểm, Lướt Gió không phải kiếm.
{
	const want: Record<string, [Branch, number, SkillKind]> = {
		flame_ring: ['fire', 3, 'aoe_self'],
		fire_blast: ['fire', 5, 'aoe_target'],
		tidal_wave: ['water', 5, 'cone'],
		cyclone: ['wind', 3, 'zone'],
		gale_dash: ['wind', 5, 'dash'],
		frost_field: ['ice', 3, 'zone'],
		ice_spire: ['ice', 5, 'pillar'],
		rock_throw: ['earth', 1, 'projectile'],
		quake: ['earth', 3, 'aoe_self'],
		stone_spikes: ['earth', 5, 'line'],
	};
	for (const [id, [branch, tier, kind]] of Object.entries(want)) {
		assert.deepEqual(SKILL_NODE[id], { branch, tier }, `${id}: nhánh + mốc`);
		assert.equal(HERO_SKILLS[idx(id)]!.kind, kind, `${id}: kiểu đòn`);
		assert.ok(idx(id) >= 7, `${id}: nối cuối, không lệch chỉ số 0–6`);
	}
	const kinds = new Set(HERO_SKILLS.map((s) => s.kind));
	for (const k of ['aoe_self', 'aoe_target', 'cone', 'line', 'dash', 'pillar', 'zone'] as SkillKind[]) assert.ok(kinds.has(k), `có kỹ năng kiểu ${k}`);
	assert.deepEqual(
		HERO_SKILLS.filter((s) => isGroundTarget(s)).map((s) => s.id),
		['fire_blast', 'cyclone', 'frost_field', 'ice_spire', 'fire_wall', 'meteor', 'call_rain', 'thunder_rain', 'ice_rain', 'stone_wall', 'rockslide'],
		'nhắm điểm trên đất (GĐ3: tường, thiên thạch, mưa, mây sét, mưa nhiều điểm — Vòi Rồng chỉ cần hướng)',
	);
	for (const s of HERO_SKILLS.filter((d) => isGroundTarget(d))) assert.ok((s.aimDist ?? 0) > 0 && (s.aimDist ?? 0) <= (s.range ?? 0), `${s.id}: tầm đặt mặc định (cảm ứng) trong tầm`);
	assert.equal(isSwordSkill(HERO_SKILLS[idx('gale_dash')]!), false, 'Lướt Gió là phép Phong, không ăn phủ phép/hệ số kiếm');
	assert.equal(HERO_SKILLS[idx('rock_throw')]!.unlock, 'earth');
	// Mốc 5 là kỹ năng đặc trưng: mạnh rõ hơn mốc 1 cùng nhánh (một phát), tốn MP hơn.
	for (const [b, t1] of [['fire', 'fire_bolt'], ['water', 'water_lance'], ['wind', 'wind_blade'], ['ice', 'ice_shard'], ['earth', 'rock_throw']] as const) {
		const five = HERO_SKILLS.find((s) => SKILL_NODE[s.id]?.branch === b && SKILL_NODE[s.id]?.tier === 5)!;
		const one = HERO_SKILLS[idx(t1)]!;
		assert.ok(five.power >= one.power * 1.3, `${b} mốc 5 (${five.name} ×${five.power}) mạnh hơn rõ mốc 1 (×${one.power})`);
		assert.ok(five.mpCost > one.mpCost, `${b} mốc 5 tốn MP hơn`);
	}
	assert.deepEqual(skillFacts(HERO_SKILLS[idx('flame_ring')]!), ['Vùng quanh mình, bán kính 110', 'đẩy lùi 50']);
	assert.match(skillFacts(HERO_SKILLS[idx('cyclone')]!)[0]!, /5 nhịp, hút quái/);
	// Mô tả nấc trên bảng Tiềm năng sinh từ số liệu kỹ năng.
	assert.match(TREE.ice[4]!.desc, /Băng Trụ|Cột băng/);
	assert.match(TREE.ice[4]!.desc, /24 MP/);
	assert.equal(TREE.earth[1]!.name, 'Đá Nặng');
	assert.equal(TREE.earth[3]!.name, 'Da Đá');
	// Trần GĐ3: mọi nhánh mốc 9 — 5 nguyên tố (lượt A) + Kiếm 3 lưu phái (lượt B, xem tests/swordstyles.test.ts).
	for (const b of BRANCHES) assert.equal(tierCap(b), 9, `${b}: trần`);
	const ok = () => true;
	assert.equal(knowsSkill(HERO_SKILLS[idx('flame_ring')]!, { fire: 2 }, ok), false);
	assert.equal(knowsSkill(HERO_SKILLS[idx('flame_ring')]!, { fire: 3 }, ok), true);
	assert.equal(knowsSkill(HERO_SKILLS[idx('fire_blast')]!, { fire: 4 }, ok), false);
	assert.equal(knowsSkill(HERO_SKILLS[idx('fire_blast')]!, { fire: 5 }, ok), true);
	assert.equal(knowsSkill(HERO_SKILLS[idx('rock_throw')]!, { earth: 1 }, (u) => u !== 'earth'), false, 'Đá Văng cần mã earth');
	assert.equal(knowsSkill(HERO_SKILLS[idx('quake')]!, { earth: 0 }, ok), false, 'nhánh chưa mở');
	assert.deepEqual(REACTION_PAIR.mud, ['earth', 'water']);
	assert.deepEqual([REACTION_NAME.mud, REACTION_NAME.lava, REACTION_NAME.sandstorm, REACTION_NAME.shatter], ['Bùn Lầy', 'Dung Nham', 'Bão Cát', 'Vỡ Vụn']);
}

// 4) TEMP_ART: mọi kỹ năng GĐ2 có hình tạm; mọi id trỏ tới hiệu ứng CÓ trong atlas; id PixelLab sẽ thay có trong pipeline.
{
	const atlas = JSON.parse(readFileSync(new URL('../public/assets/vfx/vfx.json', import.meta.url), 'utf8')) as { animations: Record<string, string[]>; frames: Record<string, unknown> };
	const pipeline = readFileSync(new URL('../../../packages/asset-pipeline/src/vfx/buildVfx.ts', import.meta.url), 'utf8');
	const pipelineIds = new Set([...pipeline.matchAll(/\{\s*id:\s*'([a-z_]+)'/g)].map((m) => m[1]!));
	assert.ok(pipelineIds.has('ice_pillar') && pipelineIds.has('rock_spikes'), 'đọc được danh sách id pipeline');
	for (const s of HERO_SKILLS.slice(7)) {
		const a = TEMP_ART[s.id];
		assert.ok(a, `${s.id}: có hàng TEMP_ART`);
		assert.ok(a.icon && atlas.frames[`vfx/${a.icon}`], `${s.id}: icon tạm ${a.icon} có trong atlas`);
		assert.equal(tempIcon(s.id, (id) => !!atlas.frames[`vfx/${id}`]), a.final && atlas.animations[a.final] ? `${a.final}_3` : a.icon, `${s.id}: icon dùng`);
	}
	for (const key of ['earth_hit', 'react_mud', 'react_lava', 'react_sandstorm', 'react_shatter']) assert.ok(TEMP_ART[key], `có hình tạm ${key}`);
	for (const [key, a] of Object.entries(TEMP_ART)) {
		for (const l of [...a.look, ...(a.charge ?? []), ...(a.shot ? [a.shot] : [])]) assert.ok(atlas.animations[l.id]?.length, `${key}: hình tạm "${l.id}" phải có trong atlas`);
		assert.ok(a.look.length > 0 && a.todo, `${key}: có hình + ghi chú cần vẽ gì`);
		for (const l of [...a.look, ...(a.charge ?? [])]) assert.ok(Number.isInteger(l.scale ?? 1) && Number.isInteger(l.scaleX ?? 1) && Number.isInteger(l.scaleY ?? 1), `${key}: phóng NGUYÊN lần (giữ lưới pixel)`);
		if (a.final) assert.ok(pipelineIds.has(a.final), `${key}: id PixelLab "${a.final}" đã khai ở pipeline`);
	}
	// Đúng các id đã xếp lịch ở kế hoạch 5b.
	assert.deepEqual([TEMP_ART.ice_spire!.final, TEMP_ART.cyclone!.final, TEMP_ART.stone_spikes!.final], ['ice_pillar', 'tornado', 'rock_spikes']);
	assert.equal(tempIcon('ice_spire', (id) => id === 'ice_pillar_0'), 'ice_pillar_3', 'atlas có bản PixelLab → icon tự đổi');
	assert.equal(tempIcon('fire_bolt', () => true), null, 'kỹ năng có hình riêng: không dùng icon tạm');
}

// 5) Trong trận.
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
type Textures = import('../src/game/assets/AssetManifest').CharacterTextures;
type Dir = import('../src/game/assets/AssetManifest').Direction;
type Fighter = import('../src/game/combat/CombatSystem').Fighter;
type Tiers = import('../src/game/combat/talents').Tiers;

const DIRS: Dir[] = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'];
const strip = (n: number) => Array.from({ length: n }, () => new Texture());
/** Nhân vật giả không có động tác ra đòn: đòn nổ ngay lúc bấm. */
function fakeTextures(): Textures {
	const anims = { idle: Object.fromEntries(DIRS.map((d) => [d, strip(4)])), walk: Object.fromEntries(DIRS.map((d) => [d, strip(6)])) } as Record<string, Partial<Record<Dir, InstanceType<typeof Texture>[]>>>;
	return {
		id: 'test',
		entry: { displayName: 'Thử', role: 'player', atlas: '', frameSize: { width: 64, height: 64 }, anchor: { x: 0.5, y: 0.9 }, animations: { idle: { fps: 6 }, walk: { fps: 10 } }, source: { provider: 'test', ref: null }, bodyHeight: 60 },
		frames: (anim, dir) => anims[anim]?.[dir] ?? anims.idle!.S!,
		has: (anim) => !!anims[anim],
		hasDir: () => false,
		actionFrames: () => null,
	};
}

type St = { burn: number; wet: number; chill: number; freeze: number; frost?: number; boss?: boolean; dust?: number; slow?: number; slowMult?: number; armor?: number; miss?: number; burnPower?: number };
interface Internals {
	dummies: { wet: number; dust: number; slow: number; miss: number; armor: number; freeze: number }[];
	projectiles: { damage: number; ghost?: boolean; x: number; y: number }[];
	pending: unknown[];
	zones: unknown[];
	react(t: St, element: string, x: number, y: number): { mult: number; reaction: { id: string } | null };
	hit(f: Fighter, base: number, element: string, kx: number, ky: number): void;
	hurtPlayer(amount: number): void;
	strike(f: Fighter, dist: number): void;
}

/** `have`: id hiệu ứng atlas "đã có" (giả lập PixelLab vẽ xong) — mặc định không có gì, mọi kỹ năng dùng hình tạm. */
function setup(o: { dummy?: boolean; tiers?: Tiers; have?: string[] } = {}) {
	const hits: string[] = [];
	const plays: { id: string; x: number; y: number; scale?: number; duration?: number }[] = [];
	const floats: string[] = [];
	const have = new Set(o.have ?? []);
	const vfx = {
		ground: new Container(),
		top: new Container(),
		play: (id: string, x: number, y: number, opt?: { scale?: number; duration?: number }) => void plays.push({ id, x, y, scale: opt?.scale, duration: opt?.duration }),
		frames: (id: string) => (have.has(id) ? [new Texture()] : []),
		update: () => undefined, clear: () => undefined,
	};
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
			practiceHit: (el, r) => void hits.push(`${el}:${r}`),
		},
		{ level: 1, exp: 0, coins: 0, potions: 0 },
		vfx as never,
	);
	const p = new Actor('hero', fakeTextures(), 40, 100, 'S', null);
	combat.setPlayer(p);
	if (o.tiers) combat.setTalents(o.tiers);
	if (o.dummy) combat.addDummy(200, 100);
	const inner = combat as unknown as Internals;
	// Bắt chữ nổi (Trượt, Phá giáp, +máu) — `float` là private, bọc lại để đọc.
	const c = combat as unknown as { float: (wx: number, wy: number, text: string, color: number, size: number) => void };
	const realFloat = c.float.bind(combat);
	c.float = (wx, wy, text, color, size) => {
		floats.push(text);
		realFloat(wx, wy, text, color, size);
	};
	const tick = (n = 1, dt = 1 / 60) => {
		for (let i = 0; i < n; i += 1) {
			p.update(dt);
			combat.update(dt, (x, y) => ({ x, y }), 2);
		}
	};
	const cast = (id: string, aim: { x: number; y: number }) => {
		combat.pc.mp = combat.pc.mpMax;
		combat.pc.cooldowns.clear();
		return combat.cast(idx(id), aim);
	};
	/** Quái đứng yên (choáng dài) để đo vùng trúng — khống chế không đổi phép xét trúng. */
	const enemy = (id: string, x: number, y = 100, hold = true): Fighter => {
		const home = { x, y, radius: 60 };
		const f = combat.addEnemy(new Actor(id, fakeTextures(), x, y, 'W', home), id, home, id)!;
		f.attackTimer = 99;
		if (hold) f.stun = 99;
		return f;
	};
	return { combat, p, hits, plays, floats, tick, inner, cast, enemy };
}
const full = (f: Fighter) => f.hp === f.hpMax;

// 5a) Vòng Lửa (aoe_self): trúng trong vùng elip quanh mình, đẩy quái RA NGOÀI, gây cháy; boss không bị đẩy.
{
	const s = setup({ tiers: { fire: 3 } });
	const inR = s.enemy('mob_zombie_001', 120);
	const below = s.enemy('mob_zombie_001', 40, 100 + 80);
	const far = s.enemy('mob_zombie_001', 200);
	const boss = s.enemy('boss_demon_001', 40, 140);
	assert.equal(s.cast('flame_ring', { x: 300, y: 100 }), 'started');
	assert.ok(!full(inR) && inR.burn > 0, 'trong vùng: trúng + cháy');
	assert.ok(full(below), 'ngay dưới 80px: ngoài elip (đất nhìn nghiêng)');
	assert.ok(full(far), 'ngoài bán kính');
	assert.ok(!full(boss) && boss.push === null, 'boss trúng nhưng không bị đẩy');
	assert.ok(inR.push && inR.push.vx > 0, 'đẩy ra xa tâm (về phía đông)');
	const x0 = inR.actor.x;
	s.tick(15);
	near(inR.actor.x - x0, 50, 'đẩy đúng 50px', 0.5);
	assert.ok(s.plays.some((x) => x.id === 'fire_ring' && x.scale === 2), 'hình tạm: fire_ring phóng ×2');
}

// 5b) Địa Chấn (aoe_self Thổ): choáng — quái đứng im không đánh; Đá Nặng ×1,5; boss một nửa. Đá Văng đẩy lùi.
{
	const s = setup({ tiers: { earth: 3 } });
	const f = s.enemy('mob_zombie_001', 90, 100, false);
	const b = s.enemy('boss_demon_001', 40, 150, false);
	f.attackTimer = 0;
	s.cast('quake', { x: 300, y: 100 });
	near(f.stun, 0.9 * PASSIVE.earthCC, 'choáng 0,9s × Đá Nặng');
	near(b.stun, (0.9 * PASSIVE.earthCC) / 2, 'boss choáng nửa thời gian');
	const at = f.actor.x;
	const hp = s.combat.pc.hp;
	s.tick(60);
	assert.equal(s.combat.pc.hp, hp, 'đang choáng thì không đánh');
	assert.equal(f.windup, 0);
	near(f.actor.x, at, 'đang choáng thì đứng im', 1e-9);
	let woke = false;
	for (let i = 0; i < 240 && !woke; i += 1) {
		s.tick();
		woke = f.windup > 0 || s.combat.pc.hp < hp;
	}
	assert.ok(woke && f.stun === 0, 'hết choáng thì đánh lại');

	const knock = (tiers: Tiers) => {
		const q = setup({ tiers });
		const e = q.enemy('mob_zombie_001', 140);
		q.cast('rock_throw', { x: 300, y: 100 - q.p.chest });
		for (let i = 0; e.push === null; i += 1) {
			assert.ok(i < 60, 'Đá Văng phải trúng');
			q.tick();
		}
		assert.ok(e.dust > 0, 'đòn Thổ để lại bụi đất');
		return e.push.vx * e.push.t;
	};
	near(knock({ earth: 1 }), 45, 'Đá Văng đẩy 45px');
	near(knock({ earth: 2 }), 45 * PASSIVE.earthCC, 'Đá Nặng: đẩy xa ×1,5');
}

// 5c) Bộc Hoả (aoe_target, cầu bay): điểm nhắm kẹp theo tầm, nổ SAU đường bay, không trúng quái dọc đường.
{
	const s = setup({ tiers: { fire: 5 } });
	const target = s.enemy('mob_zombie_001', 410, 104);
	const path = s.enemy('mob_zombie_001', 220);
	const self = s.enemy('mob_zombie_001', 70);
	s.cast('fire_blast', { x: 540, y: 100 });
	const orb = s.inner.projectiles.find((x) => x.ghost);
	assert.ok(orb && orb.damage === 0, 'cầu bay chỉ là hình');
	s.tick(18);
	assert.ok(full(target) && full(path), 'chưa nổ khi cầu còn bay');
	s.tick(42);
	assert.ok(!full(target) && target.burn > 0, 'nổ tại điểm nhắm (kẹp tầm 360 → x=400), đốt mục tiêu');
	assert.ok(full(path) && full(self), 'quái dọc đường / cạnh người chơi không trúng');
	assert.ok(s.plays.some((x) => x.id === 'fire_ring' && Math.abs(x.x - 400) < 1), 'vòng lửa nổ đúng điểm kẹp tầm');
}

// 5d) Băng Trụ (pillar): vòng báo → 0,5s sau trồi, hất lên rồi đóng băng; boss một nửa; atlas có ice_pillar thì tự dùng.
{
	const s = setup({ tiers: { ice: 5 } });
	const f = s.enemy('mob_zombie_001', 200, 100, false);
	const b = s.enemy('boss_demon_001', 230, 100, false);
	s.cast('ice_spire', { x: 200, y: 100 });
	assert.ok(s.plays.some((x) => x.id === 'magic_circle' && Math.abs(x.x - 200) < 1), 'vòng báo dưới đất');
	s.tick(24);
	assert.ok(full(f), 'chưa trồi (0,4s)');
	s.tick(8);
	assert.ok(!full(f), 'trồi sau 0,5s');
	assert.ok(f.air > 0.4 && f.airTotal === 0.5 && f.freeze > 1.3, `hất 0,5s + đóng băng 1,4s (air ${f.air}, freeze ${f.freeze})`);
	assert.ok(b.airTotal === 0.25 && b.freeze <= 0.7 && b.freeze > 0.6, 'boss: hất + đóng băng nửa thời gian');
	s.tick(10);
	assert.ok(f.actor.view.sprite.y < -10, `đang bay lên (sprite.y ${f.actor.view.sprite.y})`);
	s.tick(30);
	assert.equal(f.actor.view.sprite.y, 0, 'rơi xuống đất');
	assert.ok(s.plays.some((x) => x.id === 'ice_shard'), 'chưa có ice_pillar: dùng mũi băng dựng thành cột (hình tạm — xem swordstyles.test 3h)');

	const q = setup({ tiers: { ice: 5 }, have: ['ice_pillar'] });
	q.cast('ice_spire', { x: 200, y: 100 });
	q.tick(32);
	assert.ok(q.plays.some((x) => x.id === 'ice_pillar') && !q.plays.some((x) => x.id === 'ice_shard'), 'atlas có ice_pillar: tự dùng bản PixelLab');
}

// 5e) Sóng Dữ (cone): trúng + ướt + đẩy trong nón, không trúng bên sườn / sau lưng / quá tầm.
{
	const s = setup({ tiers: { water: 5 } });
	const front = s.enemy('mob_zombie_001', 140);
	const side = s.enemy('mob_zombie_001', 60, 160);
	const back = s.enemy('mob_zombie_001', 0);
	const far = s.enemy('mob_zombie_001', 300);
	s.cast('tidal_wave', { x: 300, y: 100 - s.p.chest });
	assert.ok(!full(front) && front.wet > 0 && front.push && front.push.vx > 0, 'trước mặt: trúng, ướt, bị đẩy');
	assert.ok(full(side) && full(back) && full(far), 'sườn / sau lưng / quá tầm: không trúng');
}

// 5f) Gai Đá (line): trồi nối đuôi gần → xa, mỗi quái trúng MỘT lần, hất lên; lệch khỏi đường thì không.
{
	const s = setup({ tiers: { earth: 5 } });
	const nearE = s.enemy('mob_zombie_001', 120);
	const farE = s.enemy('mob_zombie_001', 250, 104);
	const off = s.enemy('mob_zombie_001', 180, 170);
	s.cast('stone_spikes', { x: 400, y: 100 - s.p.chest });
	s.tick(9);
	assert.ok(!full(nearE) && full(farE), 'gai gần trồi trước');
	const hpNear = nearE.hp;
	s.tick(20);
	assert.ok(!full(farE), 'gai xa trồi sau');
	assert.equal(nearE.hp, hpNear, 'mỗi quái chỉ trúng một lần dù nằm giữa hai đoạn');
	assert.ok(full(off), 'lệch khỏi đường: không trúng');
	near(farE.airTotal, 0.4 * PASSIVE.earthCC, 'hất 0,4s × Đá Nặng');
	assert.equal(s.inner.pending.length, 0, 'hết lịch hẹn');
}

// 5g) Lướt Gió (dash): đi đúng quãng, không trúng đòn lúc lướt, vệt gió chém quái dọc đường SAU khi dừng.
{
	const s = setup({ tiers: { wind: 5 } });
	const a = s.enemy('mob_zombie_001', 130);
	const b = s.enemy('mob_zombie_001', 220, 104);
	const off = s.enemy('mob_zombie_001', 150, 190);
	const x0 = s.p.x;
	s.cast('gale_dash', { x: 400, y: 100 - s.p.chest });
	assert.ok(s.combat.pc.iframes >= 0.4, 'không trúng đòn 0,4s');
	s.tick(6);
	const hp = s.combat.pc.hp;
	s.inner.hurtPlayer(50);
	assert.equal(s.combat.pc.hp, hp, 'đang lướt: đòn không trúng');
	assert.ok(full(a) && full(b), 'chưa chém lúc đang lướt');
	s.tick(14);
	assert.equal(s.combat.pc.dash, null);
	near(s.p.x - x0, 210, 'lướt đúng 210px', 1);
	s.tick(12);
	assert.ok(!full(a) && !full(b), 'vệt gió chém mọi quái dọc đường');
	assert.ok(full(off), 'xa đường lướt: không trúng');
}

// 5h) Vùng tồn tại: Lốc Xoáy 5 nhịp + hút quái (không hút boss); Băng Địa làm lạnh, ướt thì Đóng Băng; hình lặp suốt vùng.
{
	const s = setup({ tiers: { wind: 3 }, dummy: true });
	const pulled = s.enemy('mob_zombie_001', 265, 112);
	const boss = s.enemy('boss_demon_001', 150, 100);
	const bx = boss.actor.x;
	s.cast('cyclone', { x: 200, y: 100 });
	assert.ok(s.plays.some((x) => x.id === 'wind_spin' && x.duration === 2.5), 'hình lốc lặp 2,5s');
	const d0 = Math.hypot(pulled.actor.x - 200, pulled.actor.y - 100);
	s.tick(60);
	assert.ok(Math.hypot(pulled.actor.x - 200, pulled.actor.y - 100) < d0 - 40, 'quái bị hút vào giữa');
	near(boss.actor.x, bx, 'boss không bị hút', 1e-9);
	s.tick(150);
	assert.equal(s.hits.filter((h) => h.startsWith('wind')).length, 5, 'đúng 5 nhịp trong 2,5s');
	assert.equal(s.inner.zones.length, 0, 'hết giờ: vùng tan');

	const q = setup({ tiers: { ice: 3 } });
	const wet = q.enemy('mob_zombie_001', 200, 100);
	const dry = q.enemy('mob_zombie_001', 230, 110);
	wet.wet = 5;
	q.cast('frost_field', { x: 210, y: 100 });
	q.tick(2);
	assert.ok(wet.freeze > 0 && dry.chill > 0, 'Băng Địa: ướt → Đóng Băng, khô → lạnh');
	const before = dry.actor.x;
	q.tick(40);
	near(dry.actor.x, before, 'nhịp của vùng không giật quái ra khỏi vùng', 1e-9);
}

// 5i) Trạng thái trong trận: chậm nặng (Bùn Lầy), Thấm Sâu, Bão Cát (trượt), phá giáp.
{
	const pace = (set: (f: Fighter) => void, tiers: Tiers = {}) => {
		const q = setup({ tiers });
		const f = q.enemy('mob_zombie_001', 400, 100, false);
		f.engaged = true;
		const x0 = f.actor.x;
		for (let i = 0; i < 30; i += 1) {
			set(f);
			q.tick();
		}
		return x0 - f.actor.x;
	};
	const base = pace(() => undefined);
	near(pace((f) => Object.assign(f, { slow: 5, slowMult: EARTH.mudSlow })) / base, EARTH.mudSlow, 'Bùn Lầy: còn 30% tốc', 1e-6);
	near(pace((f) => (f.wet = 5), { water: 2 }) / base, PASSIVE.wetSlow, 'Thấm Sâu: quái ướt còn 90% tốc', 1e-6);
	near(pace((f) => (f.wet = 5), { water: 1 }) / base, 1, 'chưa có Thấm Sâu: ướt không chậm', 1e-6);

	const rnd = Math.random;
	try {
		const s = setup();
		const f = s.enemy('mob_zombie_001', 70, 100, false);
		f.miss = 3;
		Math.random = () => 0.39;
		let hp = s.combat.pc.hp;
		s.inner.strike(f, 30);
		assert.equal(s.combat.pc.hp, hp, 'Bão Cát: đòn trượt');
		assert.ok(s.floats.includes('Trượt'));
		Math.random = () => 0.41;
		s.combat.pc.iframes = 0;
		hp = s.combat.pc.hp;
		s.inner.strike(f, 30);
		assert.ok(s.combat.pc.hp < hp, 'xúc xắc trên 40%: trúng');

		Math.random = () => 0.5;
		const g = s.enemy('mob_gargoyle_001', 300);
		const dmg = () => {
			const before = g.hp;
			s.inner.hit(g, 40, 'aether', 1, 0);
			return before - g.hp;
		};
		assert.equal(dmg(), armorDamage(40, 8, false));
		g.armor = 2;
		assert.equal(dmg(), armorDamage(40, 8, true), 'phá giáp: nhận thêm');
	} finally {
		Math.random = rnd;
	}
}

// 5j) Bốn phản ứng Thổ (gọi thẳng `react`) + thưởng +5%/mốc; Dung Nham cháy gấp đôi; hình nộm nhận "earth:mud".
{
	const s = setup();
	const t = (o: Partial<St> = {}): St => ({ burn: 0, wet: 0, chill: 0, freeze: 0, ...o });
	let st = t({ wet: 3 });
	let r = s.inner.react(st, 'earth', 0, 0);
	assert.deepEqual([r.reaction?.id, r.mult, st.wet, st.slow, st.slowMult], ['mud', EARTH.mudMult, 0, 3, 0.3], 'Thổ vào mục tiêu ướt: Bùn Lầy');
	st = t({ wet: 3, boss: true });
	s.inner.react(st, 'earth', 0, 0);
	assert.equal(st.slow, 1.5, 'boss: chậm nặng nửa thời gian');
	st = t({ dust: 2 });
	r = s.inner.react(st, 'water', 0, 0);
	assert.deepEqual([r.reaction?.id, st.dust, st.wet], ['mud', 0, 0], 'Thuỷ vào mục tiêu bám bụi: Bùn Lầy');
	st = t({ burn: 1 });
	r = s.inner.react(st, 'earth', 0, 0);
	assert.deepEqual([r.reaction?.id, r.mult, st.burnPower, st.armor, st.burn], ['lava', EARTH.lavaMult, 2, 4, 3], 'Thổ vào mục tiêu cháy: Dung Nham (cháy lại ×2 + phá giáp)');
	st = t({ dust: 2 });
	r = s.inner.react(st, 'fire', 0, 0);
	assert.deepEqual([r.reaction?.id, st.burnPower, st.dust], ['lava', 2, 0], 'Hoả vào mục tiêu bám bụi: Dung Nham');
	st = t({ dust: 2 });
	r = s.inner.react(st, 'wind', 0, 0);
	assert.deepEqual([r.reaction?.id, r.mult, st.miss, st.dust], ['sandstorm', EARTH.sandMult, 3, 0], 'Phong vào mục tiêu bám bụi: Bão Cát');
	st = t({ freeze: 1, chill: 2, frost: 2 });
	r = s.inner.react(st, 'earth', 0, 0);
	assert.deepEqual([r.reaction?.id, r.mult, st.freeze, st.chill], ['shatter', EARTH.shatterMult, 0, 0], 'Thổ vào mục tiêu đóng băng: Vỡ Vụn');
	st = t();
	r = s.inner.react(st, 'earth', 0, 0);
	assert.deepEqual([r.reaction, st.dust], [null, EARTH.dust], 'Thổ trúng thường: bám bụi 4s');
	st = t({ dust: 2 });
	r = s.inner.react(st, 'ice', 0, 0);
	assert.deepEqual([r.reaction, st.dust], [null, 2], 'Băng vào bụi: không phản ứng (Vỡ Vụn cần ĐANG đóng băng)');
	st = t({ dust: 2, burn: 1 });
	assert.equal(s.inner.react(st, 'fire', 0, 0).reaction?.id, 'lava', 'đang cháy + bụi: lửa mới vẫn thành Dung Nham');
	s.combat.setTalents({ earth: 4, water: 3 });
	near(s.inner.react(t({ wet: 2 }), 'earth', 0, 0).mult, EARTH.mudMult * 1.1, 'Bùn Lầy +5%/mốc của hệ yếu (Thuỷ 3)');

	// Dung Nham: mỗi nhịp đốt gấp đôi.
	const burnTick = (power: number) => {
		const q = setup();
		const f = q.enemy('mob_zombie_001', 300);
		Object.assign(f, { burn: 0.51, burnPower: power });
		const before = f.hp;
		q.tick(3);
		return before - f.hp;
	};
	assert.equal(burnTick(1), Math.round(16 * 0.18));
	assert.equal(burnTick(2), Math.round(16 * 0.18 * 2), 'Dung Nham: cháy mạnh');

	// Đường đạn thật: Thuỷ Tiễn rồi Đá Văng vào hình nộm → nhiệm vụ luyện nhận "earth:mud".
	const q = setup({ dummy: true, tiers: { earth: 1 } });
	const shoot = (id: string) => {
		const n = q.hits.length;
		q.cast(id, { x: 200, y: 100 - q.p.chest });
		for (let i = 0; q.hits.length === n; i += 1) {
			assert.ok(i < 120, `${id} phải trúng hình nộm`);
			q.tick();
		}
		return q.hits.at(-1);
	};
	assert.equal(shoot('water_lance'), 'water:null');
	assert.equal(shoot('rock_throw'), 'earth:mud');
	assert.equal(shoot('rock_throw'), 'earth:null');
	assert.equal(shoot('wind_blade'), 'wind:sandstorm');
	assert.ok(q.inner.dummies[0]!.miss > 0);
}

// 5k) Huyết Thuỷ (Thuỷ 4): đòn hệ Thuỷ hồi 5% sát thương THẬT, số xanh nhỏ; đòn hệ khác / chưa đạt mốc / đầy máu thì không.
{
	const rnd = Math.random;
	Math.random = () => 0.5;
	try {
		const s = setup({ tiers: { water: 4 } });
		const f = s.enemy('mob_zombie_001', 300);
		s.combat.pc.hp = 50;
		s.inner.hit(f, 40, 'water', 1, 0);
		const dealt = armorDamage(40, f.stats.def, false);
		assert.equal(s.combat.pc.hp, 50 + lifestealHeal(dealt, PASSIVE.lifesteal), `hút ${lifestealHeal(dealt, 0.05)} máu từ ${dealt} sát thương`);
		assert.ok(s.floats.includes(`+${lifestealHeal(dealt, 0.05)}`), 'số xanh nổi lên');
		s.inner.hit(f, 40, 'fire', 1, 0);
		assert.equal(s.combat.pc.hp, 52, 'đòn Lửa không hút');
		s.combat.pc.hp = s.combat.pc.hpMax;
		const n = s.floats.length;
		s.inner.hit(f, 40, 'water', 1, 0);
		assert.equal(s.floats.filter((x) => x.startsWith('+')).length, s.floats.slice(0, n).filter((x) => x.startsWith('+')).length, 'đầy máu: không hiện số hồi');
		const q = setup({ tiers: { water: 3 } });
		const g = q.enemy('mob_zombie_001', 300);
		q.combat.pc.hp = 50;
		q.inner.hit(g, 40, 'water', 1, 0);
		assert.equal(q.combat.pc.hp, 50, 'Thuỷ mốc 3: chưa có Huyết Thuỷ');
	} finally {
		Math.random = rnd;
	}
}

// 5l) Da Đá (Thổ 4): phòng thủ +15% (bảng chỉ số + sát thương nhận).
{
	const rnd = Math.random;
	Math.random = () => 0.5;
	try {
		const hurt = (tiers: Tiers) => {
			const s = setup({ tiers });
			s.combat.pc.def = 20;
			s.combat.pc.iframes = 0;
			const hp = (s.combat.pc.hp = s.combat.pc.hpMax);
			s.inner.hurtPlayer(40);
			return { taken: hp - s.combat.pc.hp, sheet: s.combat.sheet.defense };
		};
		assert.deepEqual(hurt({ earth: 3 }), { taken: 30, sheet: 20 });
		assert.deepEqual(hurt({ earth: 4 }), { taken: Math.round(40 - 20 * 1.15 * 0.5), sheet: 23 }, 'Da Đá');
	} finally {
		Math.random = rnd;
	}
}

// 5m) Phủ Thổ lên kiếm: nhát chém mang hệ Thổ + phá giáp; nhát thứ 3 liên tiếp choáng ngắn; ngưng chém 2s thì đếm lại.
{
	const s = setup({ tiers: { sword: 2, earth: 5 } });
	assert.equal(s.combat.setEnchant('earth'), 'ok');
	const f = s.enemy('mob_zombie_001', 75, 100, false);
	const slash = () => {
		s.combat.pc.cooldowns.clear();
		assert.equal(s.combat.cast(0, { x: 100, y: 100 - s.p.chest }), 'started');
	};
	slash();
	assert.ok(f.armor > 3.9 && f.dust > 0, 'nhát 1: phá giáp 4s + bám bụi (hệ Thổ)');
	assert.ok(s.floats.includes('Phá giáp'));
	assert.equal(f.stun, 0);
	slash();
	assert.equal(f.stun, 0, 'nhát 2: chưa choáng');
	slash();
	near(f.stun, EARTH_ENCHANT.stun, 'nhát 3: choáng ngắn');
	s.tick(60 * 3);
	slash();
	slash();
	assert.equal(f.stun, 0, 'ngưng quá 2s: đếm lại từ đầu');
}

// 5n) Chưa đạt mốc thì không tung được; đủ mốc thì được.
{
	const s = setup({ tiers: { fire: 2, ice: 4 } });
	assert.equal(s.cast('flame_ring', { x: 100, y: 100 }), 'locked');
	assert.equal(s.cast('ice_spire', { x: 100, y: 100 }), 'locked');
	s.combat.setTalents({ fire: 3, ice: 5 });
	assert.equal(s.cast('flame_ring', { x: 100, y: 100 }), 'started');
	assert.equal(s.cast('ice_spire', { x: 100, y: 100 }), 'started');
}

// 5o) Vfx: `duration` lặp frame suốt thời gian vùng tồn tại; `scaleX`/`scaleY` ép dẹt (nhân nguyên).
{
	const { Vfx } = await import('../src/game/combat/Vfx');
	const v = new Vfx();
	(v as unknown as { sheet: unknown }).sheet = { animations: { dust: strip(3) } };
	const live = () => (v as unknown as { playing: { sprite: { scale: { x: number; y: number } } }[] }).playing;
	v.play('dust', 0, 0, { fps: 10 });
	v.play('dust', 0, 0, { fps: 10, duration: 1, scaleX: 3, scaleY: 1.4 });
	assert.deepEqual([live()[1]!.sprite.scale.x, live()[1]!.sprite.scale.y], [3, 1], 'ép dẹt: nhân NGUYÊN từng trục');
	v.update(0.5);
	assert.equal(live().length, 1, 'một lượt 3 frame ở 10fps đã tắt, bản `duration` vẫn lặp');
	v.update(0.6);
	assert.equal(live().length, 0, 'hết `duration` thì tắt');
	assert.deepEqual(v.frames('ice_pillar'), [], 'id PixelLab chưa có trong atlas: rỗng → bên gọi dùng hình tạm');
}

console.log(
	'✔ elements.test: hình học vùng/nón/đường/lướt/hút, trạng thái (choáng, hất, phá giáp, trượt, chậm nặng, boss ½), 10 kỹ năng GĐ2 (mốc 3/5 + Thổ) chạy trong trận, 4 phản ứng Thổ, Thấm Sâu / Huyết Thuỷ / Đá Nặng / Da Đá, phủ Thổ (phá giáp + nhát 3 choáng), trần mốc (mọi nhánh 9), TEMP_ART trỏ đúng atlas + pipeline',
);

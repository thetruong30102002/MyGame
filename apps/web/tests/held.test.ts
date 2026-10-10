// Chạy: npx tsx tests/held.test.ts — vũ khí VẼ LIỀN THÂN (chủ dự án 10/10/2026: cầm kiếm / trượng suốt, không dán ảnh vào tay):
// đứng / đi chọn bản cầm theo đồ đang mặc + thế cầm (chém → kiếm, niệm → trượng), tháo vũ khí thì về tay không, atlas cũ chưa có
// bản cầm thì giữ tay không không lỗi; tên gửi qua mạng vẫn là idle / walk. Động tác thân (trúng đòn, lướt, gục, đứng dậy, uống
// bình) cũng diễn bản cầm (`hitsword`…) khi atlas có hướng đó, thiếu thì bản tay không.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// DOM tối thiểu cho Pixi (AnimatedSprite cần canvas lúc dựng); không render gì.
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

const { Texture } = await import('pixi.js');
const { MOVES } = await import('@aether/sim/moves');
const { Actor } = await import('../src/game/entities/Actor');
const { GEAR_ART, HELD_BODY_ACTIONS, heldAction, heldActionBase, heldAnimation, isHeldBodyAction } = await import('../src/game/gearArt');
const { HELD_ARTS } = await import('../src/game/assets/AssetManifest');
type Entry = import('../src/game/assets/AssetManifest').CharacterManifestEntry;
type Textures = import('../src/game/assets/AssetManifest').CharacterTextures;
type FrameInfo = import('../src/game/assets/AssetManifest').FrameInfo;
type Dir = import('../src/game/assets/AssetManifest').Direction;
type Piece = import('../src/game/gearLayers').GearPiece;

let passed = 0;
const test = (name: string, fn: () => void): void => {
	fn();
	passed += 1;
	console.log(`  ✔ ${name}`);
};
console.log('held (vũ khí vẽ liền thân)');

const DIRS: Dir[] = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'];
const SWORD: Piece = { slot: 'main', id: 'sword', rarity: 'common' };
const STAFF: Piece = { slot: 'off', id: 'staff', rarity: 'common' };

/**
 * Atlas giả: `held` = có bản đứng / đi cầm kiếm + cầm trượng (atlas mới) hay chưa (atlas cũ). Động tác thân tay không (trúng đòn,
 * gục, uống bình) luôn có; `body` = bản cầm vũ khí của động tác thân đã vẽ (tên atlas → hướng, 6 khung).
 */
function fakeTextures(held: boolean, body: Record<string, Dir[]> = {}): Textures {
	const info = new Map<InstanceType<typeof Texture>, FrameInfo>();
	const strip = (anim: string, dir: Dir, n: number) =>
		Array.from({ length: n }, () => {
			const t = new Texture();
			info.set(t, { anim, dir });
			return t;
		});
	const anims: Record<string, Partial<Record<Dir, InstanceType<typeof Texture>[]>>> = {};
	const add = (anim: string, n: number, dirs: Dir[] = DIRS) => (anims[anim] = Object.fromEntries(dirs.map((d) => [d, strip(anim, d, n)])));
	add('idle', 4);
	add('walk', 8);
	if (held) for (const h of HELD_ARTS) add(heldAnimation('idle', h), 4), add(heldAnimation('walk', h), 8);
	add('attack', 6, ['E', 'W', 'S', 'N']);
	add('cast', 6, ['E', 'W', 'S', 'N']);
	for (const a of ['hit', 'death', 'drink']) add(a, a === 'hit' ? 6 : 8, ['E', 'W', 'S', 'N']);
	for (const [a, dirs] of Object.entries(body)) add(a, a.startsWith('hit') ? 6 : 8, dirs);
	const entry: Entry = {
		displayName: 'Thử',
		role: 'player',
		atlas: '',
		frameSize: { width: 64, height: 64 },
		anchor: { x: 0.5, y: 0.9 },
		animations: {
			idle: { fps: 6 },
			walk: { fps: 10 },
			...(held ? { idlesword: { fps: 6 }, walksword: { fps: 10 }, idlestaff: { fps: 6 }, walkstaff: { fps: 10 } } : {}),
			attack: { fps: 20, frames: 6, loop: false, directions: ['E', 'W', 'S', 'N'] },
			cast: { fps: 20, frames: 6, loop: false, directions: ['E', 'W', 'S', 'N'] },
			hit: { fps: 14, frames: 6, loop: false, directions: ['E', 'W', 'S', 'N'] },
			death: { fps: 10, frames: 8, loop: false, directions: ['E', 'W', 'S', 'N'] },
			drink: { fps: 12, frames: 8, loop: false, directions: ['E', 'W', 'S', 'N'] },
		},
		source: { provider: 'test', ref: null },
		bodyHeight: 60,
	};
	const actionFrames = (anim: string, dir: Dir) => anims[anim]?.[dir] ?? null;
	return {
		id: 'test',
		entry,
		frames: (anim, dir) => anims[anim]?.[dir] ?? anims.idle!.S!,
		has: (anim) => !!anims[anim],
		hasDir: (anim, dir) => actionFrames(anim, dir) !== null,
		actionFrames,
		frameInfo: (tex) => info.get(tex as InstanceType<typeof Texture>),
	};
}

/** Diễn trọn một động tác (người chơi khác: đồng hồ tự chạy theo update). */
function play(a: InstanceType<typeof Actor>, anim: 'attack' | 'cast', dir: Dir): void {
	const timing = a.view.actionTiming(anim, dir, Infinity)!;
	assert.ok(a.view.playAction(anim, dir, { timing, external: false }));
	for (let i = 0; i < 60 && a.view.busy; i += 1) a.update(1 / 30);
	assert.equal(a.view.busy, false, `${anim} diễn xong`);
}

test('bảng đồ: kiếm / trượng vẽ liền thân, không còn ảnh dán; tên bản cầm chỉ a–z (khung atlas <động tác>_<hướng>_<số>)', () => {
	assert.equal(GEAR_ART.sword!.held, 'sword');
	assert.equal(GEAR_ART.staff!.held, 'staff');
	assert.deepEqual(GEAR_ART.sword!.views, {}, 'không dán icon kiếm vào tay');
	assert.deepEqual(GEAR_ART.staff!.views, {}, 'không dán icon trượng vào tay');
	assert.equal(GEAR_ART.sword!.temp, undefined, 'hết hình tạm');
	for (const h of HELD_ARTS) for (const b of ['idle', 'walk'] as const) assert.match(heldAnimation(b, h), /^[a-z]+$/);
	assert.equal(heldAnimation('walk', 'staff'), 'walkstaff');
});

test('chưa mặc vũ khí (bé 4 tuổi): đứng / đi tay không', () => {
	const a = new Actor('p', fakeTextures(true), 0, 0, 'S', null);
	assert.equal(a.view.animation, 'idle');
	a.view.set('walk', 'E');
	assert.equal(a.view.animation, 'walk');
	assert.equal(a.held, null);
});

test('mặc kiếm + trượng, thế kiếm (mặc định): đứng / đi cầm kiếm; tên gửi mạng vẫn idle / walk', () => {
	const a = new Actor('p', fakeTextures(true), 0, 0, 'S', null);
	a.setGear([SWORD, STAFF]);
	assert.equal(a.held, 'sword');
	assert.equal(a.view.animation, 'idlesword');
	assert.equal(a.view.baseAnimation, 'idle');
	a.view.set('walk', 'E');
	assert.equal(a.view.animation, 'walksword');
	assert.equal(a.view.baseAnimation, 'walk', 'máy khác nhận walk rồi tự chọn bản cầm');
	assert.equal(a.view.restingAnimation, 'idlesword', 'kho đồ vẽ hình đứng cầm kiếm');
});

test('Pháp sư (thế phép mặc định): cầm trượng; niệm → cầm trượng, chém → cầm kiếm (đổi sau khi động tác xong)', () => {
	const a = new Actor('p', fakeTextures(true), 0, 0, 'S', null);
	a.setGearStance('magic');
	a.setGear([SWORD, STAFF]);
	assert.equal(a.view.animation, 'idlestaff');
	a.view.set('walk', 'E');
	assert.equal(a.view.animation, 'walkstaff');
	play(a, 'attack', 'E');
	assert.equal(a.held, 'sword', 'vừa chém → thế kiếm');
	assert.equal(a.view.animation, 'walksword', 'hết động tác về nền đi, cầm kiếm');
	play(a, 'cast', 'E');
	assert.equal(a.view.animation, 'walkstaff', 'vừa niệm → cầm trượng');
	assert.equal(a.gearStance, 'magic');
});

test('thế không có món đúng → cầm món đang có; tháo vũ khí → về tay không (mặc gì hiện nấy)', () => {
	const a = new Actor('p', fakeTextures(true), 0, 0, 'S', null);
	a.setGearStance('magic');
	a.setGear([SWORD]);
	assert.equal(a.view.animation, 'idlesword', 'thế phép mà chỉ có kiếm');
	a.setGearStance('melee');
	a.setGear([STAFF]);
	assert.equal(a.view.animation, 'idlestaff', 'thế kiếm mà chỉ có trượng');
	a.setGear([]);
	assert.equal(a.view.animation, 'idle');
	assert.equal(a.held, null);
});

test('đổi bản cầm giữa chừng bước đi giữ nhịp chân (không giật về khung 0)', () => {
	const a = new Actor('p', fakeTextures(true), 0, 0, 'S', null);
	a.view.set('walk', 'E');
	for (let i = 0; i < 4; i += 1) a.update(1 / 30);
	const f = a.view.sprite.currentFrame;
	assert.ok(f > 0, 'đã bước vài khung');
	a.setGear([SWORD]);
	assert.equal(a.view.animation, 'walksword');
	assert.equal(a.view.sprite.currentFrame, f);
});

/** Diễn một động tác thân qua đúng đường game dùng (CombatSystem / tin `action` của người khác): tên gốc vào, trả tên đang HIỆN. */
function pose(a: InstanceType<typeof Actor>, anim: 'hit' | 'death' | 'drink' | 'dodge', dir: Dir): string | null {
	if (!a.view.hasAction(anim, dir)) return null;
	const timing = a.view.actionTiming(anim, dir, Infinity)!;
	assert.ok(a.view.playAction(anim, dir, { timing, external: false }));
	const shown = a.view.animation;
	for (let i = 0; i < 90 && a.view.busy; i += 1) a.update(1 / 30);
	assert.equal(a.view.busy, false, `${anim} diễn xong`);
	return shown;
}

test('động tác thân: danh sách = mọi động tác không đổi thế cầm (MOVES.wield null); tên bản cầm a–z, pipeline nhận được', () => {
	assert.deepEqual([...HELD_BODY_ACTIONS].sort(), MOVES.filter((m) => m.wield === null).map((m) => m.id).sort());
	const pipeline = readFileSync(new URL('../../../packages/asset-pipeline/src/providers/types.ts', import.meta.url), 'utf8');
	const list = /export const ANIMATIONS = \[([^\]]*)\]/.exec(pipeline)?.[1] ?? '';
	for (const b of HELD_BODY_ACTIONS) {
		for (const h of HELD_ARTS) {
			const name = heldAction(b, h);
			assert.match(name, /^[a-z]+$/);
			assert.ok(list.includes(`'${name}'`), `${name}: pipeline nhận được (providers/types.ts ANIMATIONS)`);
			assert.equal(heldActionBase(name), b);
		}
	}
	assert.equal(heldAction('revive', 'staff'), 'revivestaff');
	assert.equal(heldActionBase('hit'), null);
	assert.equal(heldActionBase('idlesword'), null, 'đứng cầm kiếm không phải động tác một lần');
	assert.equal(isHeldBodyAction('attack'), false, 'chém vốn vẽ cầm kiếm');
});

test('động tác thân khi cầm vũ khí: trúng đòn / gục / uống bình diễn bản cầm đúng món; tay không → bản tay không', () => {
	const body = { hitsword: DIRS, hitstaff: DIRS, deathsword: DIRS, drinkstaff: DIRS };
	const a = new Actor('p', fakeTextures(true, body), 0, 0, 'S', null);
	assert.equal(pose(a, 'hit', 'E'), 'hit', 'chưa mặc vũ khí: tay không');
	a.setGear([SWORD, STAFF]);
	assert.equal(pose(a, 'hit', 'E'), 'hitsword', 'thế kiếm → bản cầm kiếm');
	assert.equal(a.view.animation, 'idlesword', 'xong về nền đứng cầm kiếm');
	assert.equal(pose(a, 'death', 'S'), 'deathsword');
	assert.equal(pose(a, 'drink', 'N'), 'drink', 'chưa vẽ bản uống bình cầm kiếm → tay không');
	a.setGearStance('magic');
	assert.equal(pose(a, 'hit', 'W'), 'hitstaff', 'thế phép → bản cầm trượng');
	assert.equal(pose(a, 'drink', 'E'), 'drinkstaff');
	assert.equal(pose(a, 'death', 'E'), 'death', 'chưa vẽ gục cầm trượng → tay không');
	a.setGear([]);
	assert.equal(pose(a, 'hit', 'E'), 'hit', 'tháo vũ khí → tay không');
});

test('bản cầm thiếu hướng → hướng đó diễn tay không; thiếu hẳn (atlas cũ) → tay không, không lỗi; nhịp theo bản đang diễn', () => {
	const a = new Actor('p', fakeTextures(true, { hitsword: ['E', 'W'] }), 0, 0, 'S', null);
	a.setGear([SWORD]);
	assert.equal(pose(a, 'hit', 'E'), 'hitsword');
	assert.equal(pose(a, 'hit', 'S'), 'hit', 'hướng S chưa có bản cầm');
	assert.equal(pose(a, 'dodge', 'E'), null, 'động tác chưa vẽ cả hai bản: không diễn (game dùng phương án dự phòng)');
	// Manifest chưa khai bản cầm → lấy fps của bản tay không; số khung theo bản đang diễn.
	const t = a.view.actionTiming('hit', 'E', Infinity)!;
	assert.equal(t.fps, 14);
	assert.equal(t.n, 6);
	const old = new Actor('p', fakeTextures(false), 0, 0, 'S', null);
	old.setGear([SWORD, STAFF]);
	assert.equal(pose(old, 'death', 'N'), 'death', 'atlas cũ: tay không');
});

test('atlas cũ (chưa dựng bản cầm vũ khí): mặc kiếm vẫn đứng / đi tay không, không lỗi', () => {
	const a = new Actor('p', fakeTextures(false), 0, 0, 'S', null);
	a.setGear([SWORD, STAFF]);
	assert.equal(a.held, 'sword', 'luật chọn vẫn chạy');
	assert.equal(a.view.animation, 'idle', 'nhưng hiện bản tay không');
	a.view.set('walk', 'N');
	assert.equal(a.view.animation, 'walk');
	assert.equal(a.view.restingAnimation, 'idle');
});

console.log(`${passed} test qua`);

// Test vector nhóm "protocol" (packages/protocol/src/index.ts) sinh từ CHÍNH hàm TypeScript → Tests~/vectors/protocol.json.
// Test C#: Tests~/Aether.Core.Tests/ProtocolTests.cs (Aether.Net). Chạy ở gốc repo:
//   npx tsx UnityGame/Tools~/vectors-protocol.mts
// Gồm: hằng, validateName / validateUsername / validatePassword, cleanActionFx, cleanGearView, và MẪU TIN NHẮN mọi loại `t`
// (khai kiểu ClientMessage / ServerMessage nên sai khoá là tsc báo) — C# đọc rồi ghi lại phải ra đúng chuỗi JSON.stringify.
// Ký tự đặc biệt dựng bằng String.fromCodePoint (không viết thẳng vào mã nguồn cho khỏi lẫn).
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as P from '../../packages/protocol/src/index.ts';
import type { ClientMessage, ServerMessage } from '../../packages/protocol/src/index.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, '..', 'Tests~', 'vectors');
mkdirSync(OUT, { recursive: true });

const u = (...cps: number[]): string => String.fromCodePoint(...cps);
const NBSP = u(0xa0);
const BOM = u(0xfeff);
const NEL = u(0x85);
const LS = u(0x2028);
const IDEO = u(0x3000);
const MVS = u(0x180e);
const SCRIPT_A = u(0x1d49c); // 𝒜 — chữ ngoài BMP (cặp surrogate)
const EMOJI = u(0x1f600);
const LONE = String.fromCharCode(0xd800);

// ---- Hằng ---------------------------------------------------------------------------------------------------------
const constants = {
	SERVER_PORT: P.SERVER_PORT,
	SNAPSHOT_HZ: P.SNAPSHOT_HZ,
	CHAT_MAX: P.CHAT_MAX,
	WORLD_CHAT_GAP_MS: P.WORLD_CHAT_GAP_MS,
	WORLD_CHAT_DIAMONDS: P.WORLD_CHAT_DIAMONDS,
	MAX_LEVEL: P.MAX_LEVEL,
	NAME_MIN: P.NAME_MIN,
	NAME_MAX: P.NAME_MAX,
	MAX_CHARACTERS: P.MAX_CHARACTERS,
	ADMIN_LIMITS: P.ADMIN_LIMITS,
	ADMIN_REASON_MAX: P.ADMIN_REASON_MAX,
	ACTION_ANIMS: P.ACTION_ANIMS,
	DIRS8: P.DIRS8,
	ACTION_FX_FLAGS: P.ACTION_FX_FLAGS,
	WORLD_COORD_MAX: P.WORLD_COORD_MAX,
	GEAR_VIEW_SLOTS: P.GEAR_VIEW_SLOTS,
	GEAR_RARITY_LEVELS: P.GEAR_RARITY_LEVELS,
	MAX_FRIENDS: P.MAX_FRIENDS,
	FRIEND_REQUEST_TTL: P.FRIEND_REQUEST_TTL,
	WHISPER_TTL: P.WHISPER_TTL,
	WHISPER_KEEP: P.WHISPER_KEEP,
};

// ---- Tên / tài khoản / mật khẩu -----------------------------------------------------------------------------------
const names = [
	'', 'A', 'An', 'Anh', 'Nguyễn Văn A', '  Lan  ', 'A  B', 'A B', 'Ab ', ' Ab', 'abcdefghijklmnop', 'abcdefghijklmnopq', 'Ab_c', 'Ab-c', 'Ab.c',
	'123', u(0x661, 0x662, 0x663), `${u(0x216b)}ab`, `${u(0xbd)}ab`, 'ab\n', '\tab c\t', `${NBSP}ab c${NBSP}`, `${BOM}abc${BOM}`, `${NEL}abc${NEL}`,
	`${MVS}abc${MVS}`, `a${NBSP}b`, `Le${u(0x302)}x`, `${SCRIPT_A}bc`, `${SCRIPT_A}b`, `${EMOJI}abc`, `ab${EMOJI}`, `ab${LONE}c`, '日本語', '김철수',
	'Ωmega', `ab${LS}`, SCRIPT_A.repeat(8), SCRIPT_A.repeat(9), `A${IDEO}B`, `${IDEO}AB${IDEO}`, `${u(0x1c5)}ab`, `${u(0x2b0)}ab`, 'Trần  Thị', 'Lý Tiểu Long',
	'a b c d e f g h', 'Đ1 2', `ab${u(0x2003)}`, ' '.repeat(5), '\r\nabc\r\n', `ab${u(0x200b)}c`,
	'abc\n', `${IDEO}ABC${IDEO}`, `${LS}abc${u(0x2029)}`, `abc${u(0x2003)}`,
];
const validateName = names.map((input) => ({ input, out: P.validateName(input) }));
const validateUsername = ['abc', 'ab', 'a'.repeat(20), 'a'.repeat(21), 'Abc', 'abc_1', 'abc-1', 'abc\n', 'ăbc', '', '___', '0_0', 'ab c'].map((input) => ({
	input,
	out: P.validateUsername(input),
}));
const validatePassword = ['', '12345', '123456', 'x'.repeat(72), 'x'.repeat(73), EMOJI.repeat(3), EMOJI.repeat(36), `${EMOJI.repeat(36)}a`].map((input) => ({
	input,
	out: P.validatePassword(input),
}));

// ---- cleanActionFx ------------------------------------------------------------------------------------------------
// PRNG cố định (mulberry32) để bộ ngẫu nhiên không đổi giữa các lần chạy.
function rng(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
const base = { ax: 1, ay: 1 };
const fxInputs: unknown[] = [
	null, 0, 'x', true, [], [1, 2], {}, { ax: 1 }, { ax: 1, ay: 0 }, { ax: 0, ay: 0 }, { ax: 1e-7, ay: 0 }, { ax: 1e-6, ay: 0 }, { ax: 3, ay: 4 },
	{ ax: -0.3, ay: 0.7 }, { ax: '1', ay: 0 }, { ax: 1001, ay: 0 }, { ax: -1000, ay: 0 }, { ax: 1e20, ay: 0 }, { ax: 0.6, ay: 0.8 }, { ax: -1, ay: -0 },
	{ ...base, tx: 100.4, ty: 200.6 }, { ...base, tx: 100 }, { ...base, ty: 100 }, { ...base, tx: null, ty: 5 }, { ...base, tx: -1, ty: 5 },
	{ ...base, tx: 20000, ty: 0 }, { ...base, tx: 20001, ty: 0 }, { ...base, tx: 0.5, ty: 2.5 }, { ...base, tx: '5', ty: 5 },
	{ ...base, el: 'fire' }, { ...base, el: 'Fire' }, { ...base, el: 'firewater1' }, { ...base, el: 'abcdefgh' }, { ...base, el: 'abcdefghi' }, { ...base, el: 5 },
	{ ...base, el: '' }, { ...base, el: 'ice\n' },
	{ ...base, cd: 0.005 }, { ...base, cd: 0.01 }, { ...base, cd: 1.23456 }, { ...base, cd: 60 }, { ...base, cd: 61 }, { ...base, cd: '2' },
	{ ...base, sp: 0.9 }, { ...base, sp: 1 }, { ...base, sp: 2.5555 }, { ...base, sp: 3.0001 }, { ...base, boost: 1.5 }, { ...base, boost: 1.0005 },
	{ ...base, fl: 0 }, { ...base, fl: 1 }, { ...base, fl: 3 }, { ...base, fl: 2.5 }, { ...base, fl: 255 }, { ...base, fl: 256 }, { ...base, fl: -1 }, { ...base, fl: '1' },
	{ ax: 0.25, ay: -0.9, tx: 512.5, ty: 1024.49, el: 'water', cd: 4.5, sp: 1.25, boost: 2, fl: 2, extra: 'bỏ qua' },
	{ ax: 1, ay: 0, tx: 1, ty: 1, el: 'wind', cd: 0.38, sp: 3, boost: 3, fl: 1 },
];
const r = rng(20261010);
for (let i = 0; i < 400; i++) {
	const scale = [1e-5, 1e-3, 1, 7, 999][i % 5]!;
	fxInputs.push({ ax: (r() * 2 - 1) * scale, ay: (r() * 2 - 1) * scale, ...(i % 3 === 0 ? { tx: r() * 20000, ty: r() * 20000 } : {}), ...(i % 4 === 0 ? { cd: r() * 10, sp: 1 + r() * 2 } : {}) });
}
// Hướng có thành phần chuẩn hoá rơi đúng ranh giới làm tròn 3 số lẻ (x.xxx5).
for (let k = 0; k < 100; k++) {
	const c = (k * 10 + 5) / 10000; // 0.0005, 0.0015, …
	fxInputs.push({ ax: c, ay: Math.sqrt(1 - c * c) });
}
const cleanActionFx = fxInputs.map((input) => ({ input, out: P.cleanActionFx(input) }));

// ---- cleanGearView ------------------------------------------------------------------------------------------------
const gearInputs: unknown[] = [
	null, 'abc', {}, [], ['sword'], ['', 'sword', 'staff:2'], ['Sword', 'a b', 'x:9', 'y'.repeat(25)], ['y'.repeat(24)], ['a:4', 'b:5', 'c:', 'd:0'],
	['a', 'b', 'c', 'd'], ['a', 'b', 'c', 'd', 'e'], [1, null, true, ['x']], ['a\n'], ['abc:1:2'], [':1'], ['_'], ['ab:0', 'helm_02:3'], ['ăb'], [{ id: 'x' }],
];
const cleanGearView = gearInputs.map((input) => ({ input, out: P.cleanGearView(input) }));

// ---- Mẫu tin nhắn ---------------------------------------------------------------------------------------------------
const progress = { level: 12, exp: 3450, coins: 9800, potions: 7, map: 'human/town', x: 512.5, y: 300, story: { step: 3, flags: ['a', 'b'], when: '2026-10-10', nested: { v: 1.25 } }, introSeen: true, bonusPoints: 4 };
const fx = { ax: 0.707, ay: -0.707, tx: 640, ty: 480, el: 'fire', cd: 2.5, sp: 1.2, boost: 1.5, fl: 3 };
const player = { id: 'c1', name: 'Nguyễn Văn A', gender: 'male' as const, sprite: 'player_hero_adult', level: 12, x: 100, y: 200.5, dir: 'SE', anim: 'walk', gear: ['helm_01:2', '', 'shield', ''] };
const mob = { id: 'm1', type: 'slime', zone: 'z1', x: 300, y: 400, hp: 37.5, hpMax: 120, dead: false, owner: null, home: { x: 310, y: 390, r: 96 }, boss: false, level: 5 };
const person = { id: 'p1', name: 'Lan', level: 8, online: true, map: 'human/town' };

const clientMessages: ClientMessage[] = [
	{ t: 'hello', token: 'tok_ABC-123', character: '0f8fad5b-d9cb-469f-a165-70867728950e' },
	{ t: 'move', x: 512.25, y: 300, dir: 'NE', anim: 'run', sprite: 'player_hero_adult_leather' },
	{ t: 'move', x: 40, y: 60, dir: 'S', anim: 'idle', sprite: 'player_hero_adult', hp: 87, hpMax: 190 },
	{ t: 'chat', text: 'Xin chào "mọi người" \\ ok' },
	{ t: 'chat', text: 'Thế giới', ch: 'world' },
	{ t: 'action', anim: 'attack', dir: 'S' },
	{ t: 'action', anim: 'cast', dir: 'W', skill: 'fireball', fx },
	{ t: 'actionEnd' },
	{ t: 'actionEnd', hit: true },
	{ t: 'save', progress },
	{ t: 'save', progress: { level: 1, exp: 0, coins: 0, potions: 0, map: 'human/town', x: -1, y: -1, story: null, introSeen: false } },
	{ t: 'gear', gear: ['helm_01', '', 'shield:4', ''] },
	{ t: 'map', map: 'human/forest_1' },
	{ t: 'ping', at: 1760000000123 },
	{ t: 'friendAdd', id: 'p1' },
	{ t: 'friendAdd', name: 'Trần Thị B' },
	{ t: 'friendRespond', id: 'p1', accept: false },
	{ t: 'friendRemove', id: 'p1' },
	{ t: 'block', id: 'p2', on: true },
	{ t: 'whisper', to: 'p1', text: 'hi' },
	{ t: 'whisper', line: 'Trần Thị B chào bạn' },
	{ t: 'mobSub', on: true },
	{ t: 'mobPos', list: [['m1', 300, 400.5, 'S', 'walk'], ['m2', 0, 0, 'N', 'idle']] },
	{ t: 'mobHit', id: 'm1', dmg: 12.75 },
	{ t: 'mobAggro', id: 'm1' },
	{ t: 'mobAct', id: 'm1', act: { k: 'wind', dir: 'SW', s: 0.6 } },
	{ t: 'mobAct', id: 'm1', act: { k: 'melee', x: 10, y: 20, nx: 0.6, ny: -0.8 } },
	{ t: 'mobAct', id: 'm1', act: { k: 'shot', x: 10, y: 20, nx: 1, ny: 0 } },
	{ t: 'mobAct', id: 'm1', act: { k: 'aoe', x: 55, y: 66 } },
	{ t: 'mobCc', id: 'm1', cc: { freeze: 1.5, stun: 0.5, slow: 2, slowMult: 0.6, push: [120, -40, 0.25] } },
	{ t: 'mobCc', id: 'm1', cc: { air: 1, chill: 3, frost: 2, armor: 4, sunder: 5, miss: 1.1, daze: 0.9 } },
	{ t: 'checkin' },
	{ t: 'goals' },
	{ t: 'goalClaim', id: 'kill_100' },
	{ t: 'shopBuy', item: 'buff_exp_30' },
	{ t: 'resetBuild' },
	{ t: 'hubs' },
	{ t: 'kill', type: 'slime' },
	{ t: 'kill', type: 'slime', zone: 'z1' },
	{ t: 'quest', id: 'q_intro' },
	{ t: 'spend', reason: 'respec', amount: 500 },
	{ t: 'potion' },
	{ t: 'pvpDown', by: 'c-9' },
];

const serverMessages: ServerMessage[] = [
	{ t: 'welcome', you: 'c0', players: [player, { ...player, id: 'c2', gender: 'female', gear: undefined }] },
	{ t: 'welcome', you: 'c0', players: [] },
	{ t: 'join', player },
	{ t: 'leave', id: 'c1' },
	{ t: 'snapshot', players: [{ id: 'c1', x: 1, y: 2, dir: 'N', anim: 'idle', sprite: 's', level: 3 }] },
	{ t: 'chat', from: 'c1', name: 'An', text: 'chào', at: 1760000000000 },
	{ t: 'chat', from: 'c1', name: 'An', text: 'thế giới', at: 1760000000001, ch: 'world' },
	{ t: 'system', text: 'Bạn chat nhanh quá, chậm lại chút nhé' },
	{ t: 'action', id: 'c1', anim: 'thrust', dir: 'E' },
	{ t: 'action', id: 'c1', anim: 'cast', dir: 'E', skill: 'bolt', fx: { ax: 1, ay: 0 } },
	{ t: 'action', id: 'c1', anim: 'skycall', dir: 'N', skill: 'rain', fx },
	{ t: 'actionEnd', id: 'c1' },
	{ t: 'actionEnd', id: 'c1', hit: true },
	{ t: 'gear', id: 'c1', gear: ['', '', '', 'cape_red:1'] },
	{ t: 'pong', at: 1760000000123 },
	{ t: 'kicked', reason: 'Nhân vật vừa đăng nhập ở nơi khác' },
	{ t: 'social', state: { friends: [person], incoming: [{ id: 'p2', name: 'Bình', level: 3, online: false }], outgoing: [], blocked: [] } },
	{ t: 'whisper', messages: [{ from: 'p1', fromName: 'Lan', to: 'c0', toName: 'An', text: 'hi', at: 1760000000002 }] },
	{ t: 'mobs', map: 'human/forest_1', list: [mob, { ...mob, id: 'm2', owner: 'c1', boss: true, dead: true, level: undefined }] },
	{ t: 'mobMove', list: [['m1', 301, 402, 'SE', 'walk']] },
	{ t: 'mobHp', id: 'm1', hp: 25.5, by: 'c1', dmg: 12 },
	{ t: 'mobDie', id: 'm1', by: 'c1', credit: ['c1', 'c2'] },
	{ t: 'mobSpawn', mob },
	{ t: 'mobOwner', id: 'm1', owner: null },
	{ t: 'mobOwner', id: 'm1', owner: 'c2' },
	{ t: 'mobAct', id: 'm1', act: { k: 'aoe', x: 1, y: 2 } },
	{ t: 'mobCc', id: 'm1', cc: { stun: 1 } },
	{ t: 'wallet', diamonds: 42 },
	{ t: 'daily', daily: { day: '2026-10-10', done: false, streak: 3, next: { diamonds: 5, coins: 100, potions: 1 }, month: ['2026-10-08', '2026-10-09'] } },
	{ t: 'daily', daily: { day: '2026-10-10', done: true, streak: 0, next: { diamonds: 0, coins: 0, potions: 0 } } },
	{ t: 'goals', list: [{ id: 'kill_100', progress: 57, claimed: false }] },
	{ t: 'gift', reason: 'checkin', title: 'Điểm danh ngày 3', gift: { diamonds: 5, coins: 100, potions: 1 } },
	{ t: 'buffs', list: [{ kind: 'exp', mult: 1.5, remaining: 1799.5 }] },
	{ t: 'bought', item: 'buff_exp_30' },
	{ t: 'hubs', list: ['human/town'] },
	{ t: 'hubs', list: ['human/town'], maps: ['human/town', 'human/forest_1'] },
	{ t: 'eco', level: 13, exp: 120, coins: 9900, potions: 7 },
	{ t: 'pvpHit', from: 'c-1', to: 'c-2', skill: 'slash', dmg: 17, kx: 0.6, ky: -0.8 },
	{ t: 'pvpHit', from: 'c-1', to: 'c-2', skill: 'fire_bolt', dmg: 33, crit: true, kx: 1, ky: 0 },
	{ t: 'pvpKill', by: 'c-1', byName: 'An', to: 'c-2', toName: 'Bình' },
	{ t: 'eco', level: 13, exp: 120, coins: 9900, potions: 7, gain: { exp: 300, coins: 25, potions: 0, levels: 1, reason: 'kill', what: 'slime' }, bonusPoints: 4 },
];

// Danh sách `t` lấy thẳng từ mã nguồn protocol — mẫu phải phủ đủ, thiếu loại nào là script báo lỗi.
const src = readFileSync(join(HERE, '..', '..', 'packages', 'protocol', 'src', 'index.ts'), 'utf8');
const cStart = src.indexOf('export type ClientMessage =');
const sStart = src.indexOf('export type ServerMessage =');
const tagsOf = (s: string) => [...new Set([...s.matchAll(/\{ t: '(\w+)'/g)].map((m) => m[1]!))];
const clientTags = tagsOf(src.slice(cStart, sStart));
const serverTags = tagsOf(src.slice(sStart));
for (const [tags, msgs, side] of [[clientTags, clientMessages, 'client'], [serverTags, serverMessages, 'server']] as const) {
	const have = new Set<string>(msgs.map((m) => m.t));
	const missing = tags.filter((t) => !have.has(t));
	if (missing.length) throw new Error(`Mẫu tin ${side} thiếu loại: ${missing.join(', ')}`);
}

const out = {
	constants,
	validateName,
	validateUsername,
	validatePassword,
	cleanActionFx,
	cleanGearView,
	clientTags,
	serverTags,
	// Chuỗi JSON.stringify THẬT (không phải object) — C# phải ghi ra đúng chuỗi này.
	clientMessages: clientMessages.map((m) => JSON.stringify(m)),
	serverMessages: serverMessages.map((m) => JSON.stringify(m)),
};
writeFileSync(join(OUT, 'protocol.json'), `${JSON.stringify(out, null, '\t')}\n`);
console.log(
	`✔ vector → ${OUT}/protocol.json: ${validateName.length + validateUsername.length + validatePassword.length} kiểm tên · ${cleanActionFx.length} fx · ` +
		`${cleanGearView.length} đồ gắn · ${clientMessages.length}+${serverMessages.length} tin (${clientTags.length}+${serverTags.length} loại)`,
);

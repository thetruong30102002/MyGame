// Chạy: npx tsx tests/bonusPoints.test.ts — điểm tiềm năng THƯỞNG (trang quản trị cộng, máy chủ giữ ở `progress.bonusPoints`): cộng vào
// điểm theo cấp ở MỌI chỗ tính điểm — hàm thuần (`talentPoints`, `unspent`, `addTier`), bảng Tiềm năng (`buildTalentsView`),
// StoryDirector (kẹp bản lưu `cleanTalents`, chuyển định dạng `migrateTalentsV2`, cộng mốc, kẹp lại khi điểm giảm) qua đúng lớp lưu
// trực tuyến (`onlineStoryStorage`); nạp lại KHÔNG cắt mốc mua bằng điểm thưởng. Kèm phần thuần của trang /admin (`adminPlan`).
import assert from 'node:assert/strict';
import type { AdminCharacter, AdminLogEntry, CharacterProgress } from '@aether/protocol';
import { applyAdminEco } from '@aether/sim/economy';
import { changeText, draftPreview, draftToRequest, emptyDraft, groupLog, previewChanges, readDigits } from '../src/components/admin/adminPlan';
import { addTier, cleanBonusPoints, defaultLoadout, pointsForLevel, spentPoints, TALENT_BONUS_CAP, talentPoints, unspent, type Tiers } from '../src/game/combat/talents';
import { buildTalentsView, knownSkillIds } from '../src/game/talentsView';
import type { OnlineSession } from '../src/net/OnlineSession';
import { onlineStoryStorage } from '../src/net/onlineStoryStorage';

let passed = 0;
async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
	await fn();
	passed += 1;
	console.log(`  ✓ ${name}`);
}
console.log('bonusPoints (điểm tiềm năng thưởng)');

await test('hàm thuần: tổng điểm = theo cấp + thưởng (kẹp 0…trần, số lạ = 0); unspent / addTier tính cả thưởng', () => {
	assert.equal(talentPoints(4), pointsForLevel(4), 'không có thưởng = như cũ');
	assert.equal(talentPoints(4, 5), pointsForLevel(4) + 5);
	assert.equal(talentPoints(100, 10), 47 + 10, 'điểm thưởng không theo trần cấp 40');
	for (const [v, want] of [[-3, 0], ['7', 7], [2.9, 2], [Number.NaN, 0], [null, 0], [undefined, 0], [1e9, TALENT_BONUS_CAP]] as const) assert.equal(cleanBonusPoints(v), want, `cleanBonusPoints(${String(v)})`);
	const open = () => true;
	const t: Tiers = { sword: 1, fire: 0 };
	assert.equal(addTier(1, t, 'fire', open), null, 'cấp 1 = 0 điểm: không học được Hoả Cầu');
	assert.equal(addTier(1, t, 'fire', open, 3), 1, '… có 3 điểm thưởng thì học được');
	assert.equal(unspent(1, t, 3), 2);
	assert.equal(unspent(1, t), -1, 'quên cộng thưởng là âm điểm — mọi chỗ phải truyền thưởng');
});

await test('bảng Tiềm năng: tổng / còn lại / nút Học cộng cả điểm thưởng; vắng = như cũ', () => {
	const tiers: Tiers = { sword: 1, fire: 2, water: 0, wind: 0, ice: 0, earth: 0 };
	const isUnlocked = (id: string) => ['sword', 'fire', 'water'].includes(id);
	const make = (bonus?: number) => buildTalentsView({ tiers, level: 2, style: null, isUnlocked, enchant: null, enchantCooldown: 0, loadout: defaultLoadout(knownSkillIds(tiers, isUnlocked, null)), ...(bonus === undefined ? {} : { bonus }) });
	const plain = make();
	assert.deepEqual([plain.points, plain.spent, plain.unspent], [1, 2, -1], 'cấp 2 = 1 điểm, đã dùng 2 (Hoả 2) — chính là cảnh bị cắt khi quên thưởng');
	const withBonus = make(5);
	assert.deepEqual([withBonus.points, withBonus.spent, withBonus.unspent], [6, 2, 4]);
	assert.equal(withBonus.branches.find((b) => b.branch === 'water')!.nextCost, 1, 'Thuỷ học được (1 điểm)');
});

// ———— StoryDirector qua lớp lưu TRỰC TUYẾN thật (tiến độ phiên giả: progress + save) ————
const store = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
	getItem: (k: string) => store.get(k) ?? null,
	setItem: (k: string, v: string) => void store.set(k, v),
	removeItem: (k: string) => void store.delete(k),
	clear: () => store.clear(),
	key: () => null,
	length: 0,
};
const { STORY } = await import('../src/game/story/story');
const { StoryDirector, localStoryStorage } = await import('../src/game/story/StoryDirector');
const noop = { dialogue() {}, reward() {}, questsChanged() {}, pickups() {}, clearPickups() {}, awakenBoss() {}, spawnZone() {}, questCompleted() {}, unlocked() {}, ageChanged() {}, chapterEnd() {} };
const childhood = ['c4_silverdew', 'c4_dinner', 'c6_wooden_sword', 'c6_first_thread', 'c6_old_hat', 'c8_forest_edge', 'c8_snow'];

/** Phiên trực tuyến giả: tiến độ nhân vật như máy chủ gửi (cấp THẬT + điểm thưởng), lưu = ghi vào `progress.story`. */
function session(level: number, bonusPoints: number | undefined, talents: Record<string, number>, extra: Record<string, unknown> = {}) {
	const progress: CharacterProgress = {
		level,
		exp: 0,
		coins: 0,
		potions: 0,
		map: 'human/town',
		x: -1,
		y: -1,
		introSeen: true,
		...(bonusPoints === undefined ? {} : { bonusPoints }),
		story: { version: 2, index: 7, questId: 'y1_mushrooms', accepted: false, ready: false, progress: 0, completed: childhood, unlocked: ['sword', 'staff', 'fire', 'water', 'wind', 'heal'], age: 16, player: { level, exp: 0, coins: 0, potions: 0 }, talentsV: 3, talents, ...extra },
	};
	let saves = 0;
	const s = { progress, save: () => void (saves += 1), flush: async () => undefined } as unknown as OnlineSession;
	StoryDirector.storage = onlineStoryStorage(s);
	return { s, progress, saves: () => saves, director: () => new StoryDirector(STORY, noop) };
}

try {
	await test('nạp bản lưu có mốc mua bằng điểm thưởng: GIỮ NGUYÊN (cleanTalents cộng thưởng); không có thưởng thì bị kẹp như cũ', () => {
		// Cấp 4 = 3 điểm theo cấp + 5 thưởng = 8: Thuỷ 4 (6) + Hoả 2 (2).
		const want = { water: 4, fire: 2 };
		const on = session(4, 5, want);
		const d = on.director();
		assert.equal(d.bonusPoints, 5);
		assert.deepEqual(d.state.talents, want);
		assert.equal(unspent(4, d.talentTiers(), d.bonusPoints), 0);
		const off = session(4, undefined, want).director();
		assert.ok(spentPoints(off.talentTiers()) <= pointsForLevel(4), 'máy chủ bản cũ / chưa có thưởng: kẹp theo điểm của cấp');
		assert.notDeepEqual(off.state.talents, want);
	});

	await test('cộng mốc bằng điểm thưởng (spendTalent), lưu, rồi NẠP LẠI nhiều lần: không mất mốc nào', () => {
		const on = session(2, 6, {});
		let d = on.director();
		const before = on.saves();
		for (let i = 0; i < 4; i += 1) assert.equal(d.spendTalent('water', 2), true, `Thuỷ mốc ${i + 1} (cấp 2 = 1 điểm + 6 thưởng)`);
		assert.equal(d.spendTalent('water', 2), false, 'đã dùng 6 / 7: mốc 5 cần thêm 3');
		assert.ok(on.saves() > before, 'cộng xong là lưu');
		assert.deepEqual((on.progress.story as { talents: unknown }).talents, { water: 4 });
		for (let i = 0; i < 3; i += 1) {
			d = new StoryDirector(STORY, noop);
			assert.deepEqual([d.state.talents, d.talentTiers().water], [{ water: 4 }, 4], `nạp lại lần ${i + 1}`);
			d.save();
		}
	});

	await test('chuyển bản lưu định dạng 2 → 3 (migrateTalentsV2) tính cả thưởng: đủ điểm thì giữ nguyên mốc', () => {
		// Định dạng 2: Hoả 3, Thuỷ 1, Phong 1 (mốc − 1 = 2 / 0 / vắng) ở cấp 3 (2 điểm). Định dạng 3 cần 4 + 1 + 1 = 6 → thiếu 4; có 4
		// thưởng thì đủ (Băng được bù mã lúc nạp — không tính).
		const v2 = { talentsV: 2 };
		const kept = session(3, 4, { fire: 2, water: 0 }, v2).director();
		assert.deepEqual([kept.talentTiers().fire, kept.talentTiers().water, kept.talentsMigrated?.lowered], [3, 1, []]);
		const cut = session(3, 0, { fire: 2, water: 0 }, v2).director();
		assert.ok((cut.talentsMigrated?.lowered.length ?? 0) > 0, 'không thưởng: phải hạ mốc (chứng minh thưởng có tác dụng)');
	});

	await test('điểm GIẢM giữa lúc chơi (quản trị trừ thưởng): refitTalents kẹp lại mốc, bỏ lưu phái khi Kiếm tụt dưới mốc 3, lưu; không giảm thì không đụng', () => {
		const on = session(5, 10, { sword: 3, fire: 2 }, { swordStyle: 'bac_than' });
		const d = on.director();
		assert.deepEqual([d.talentTiers().sword, d.talentTiers().fire, d.swordStyle], [4, 2, 'bac_than'], 'Kiếm 4 (5) + Hoả 2 (2) với 5 + 10 điểm');
		assert.equal(d.refitTalents(5), false, 'đủ điểm: không đổi');
		on.progress.bonusPoints = 0;
		const saves = on.saves();
		assert.equal(d.refitTalents(5), true);
		assert.deepEqual([d.talentTiers().sword, d.talentTiers().fire, d.swordStyle], [4, 0, 'bac_than'], 'còn 5 điểm: giữ Kiếm 4 (nhánh trước), Hoả về chưa học');
		assert.ok(spentPoints(d.talentTiers()) <= pointsForLevel(5), 'không âm điểm');
		assert.ok(on.saves() > saves, 'đã lưu');
		const low = session(1, 6, { sword: 3 }, { swordStyle: 'kiem_than' });
		const d2 = low.director();
		assert.equal(d2.talentTiers().sword, 4);
		low.progress.bonusPoints = 1;
		assert.equal(d2.refitTalents(1), true);
		assert.deepEqual([d2.talentTiers().sword, d2.swordStyle], [2, null], 'Kiếm về mốc 2: bỏ lưu phái');
	});

	await test('chơi một mình (localStoryStorage, không máy chủ): điểm thưởng = 0', () => {
		StoryDirector.storage = localStoryStorage;
		store.set('aether.save.v2', JSON.stringify({ version: 2, index: 7, questId: 'y1_mushrooms', accepted: false, ready: false, progress: 0, completed: childhood, unlocked: ['sword', 'fire'], age: 16, player: { level: 3, exp: 0, coins: 0, potions: 0 }, talentsV: 3, talents: {} }));
		assert.equal(new StoryDirector(STORY, noop).bonusPoints, 0);
	});
} finally {
	StoryDirector.storage = localStoryStorage;
	store.clear();
}

// ———— Phần thuần của trang /admin ————
const hero: AdminCharacter = { id: '00000000-0000-0000-0000-0000000000a1', name: 'Ánh Dương', account: 'nguoi_choi', level: 10, exp: 400, coins: 300, potions: 2, diamonds: 5, bonusPoints: 1, online: true };

await test('trang /admin: biểu mẫu → yêu cầu (dấu cộng / trừ, số có dấu chấm nghìn, biên độ, đặt cấp, lý do bắt buộc)', () => {
	assert.deepEqual([readDigits(''), readDigits('1.000'), readDigits('12 345'), readDigits('-5'), readDigits('1e3')], [0, 1000, 12345, null, null]);
	const d = emptyDraft();
	assert.deepEqual(draftToRequest(hero.id, d), { error: 'Chưa nhập thay đổi nào' });
	d.amounts.coins = { sign: 1, text: '1.000' };
	d.amounts.diamonds = { sign: -1, text: '9' };
	assert.deepEqual(draftToRequest(hero.id, d), { error: 'Ghi lý do (bắt buộc — lưu vào nhật ký)' });
	d.reason = '  Quà   sự kiện ';
	assert.deepEqual(draftToRequest(hero.id, d), { req: { characterId: hero.id, reason: 'Quà sự kiện', coins: 1000, diamonds: -9 } });
	d.amounts.coins = { sign: 1, text: '1.000.001' };
	assert.match((draftToRequest(hero.id, d) as { error: string }).error, /Xu: mỗi lần cộng \/ trừ tối đa 1\.000\.000/);
	d.amounts.coins = { sign: 1, text: '' };
	d.setLevel = '101';
	assert.match((draftToRequest(hero.id, d) as { error: string }).error, /Đặt cấp/);
	d.setLevel = '20';
	assert.deepEqual(draftToRequest(hero.id, d), { req: { characterId: hero.id, reason: 'Quà sự kiện', diamonds: -9, setLevel: 20 } });
});

await test('trang /admin: xem trước = đúng luật máy chủ (applyAdminEco + kẹp không âm); chữ thay đổi; gộp nhật ký theo từng lần cộng', () => {
	const req = { characterId: hero.id, reason: 'x', coins: -500, diamonds: -9, setLevel: 12, exp: 30, talentPoints: 4 };
	const ch = previewChanges(hero, req);
	const eco = applyAdminEco(hero, req);
	assert.deepEqual(ch, [
		{ field: 'level', from: 10, to: eco.level },
		{ field: 'exp', from: 400, to: eco.exp },
		{ field: 'coins', from: 300, to: 0 },
		{ field: 'diamonds', from: 5, to: 0 },
		{ field: 'bonusPoints', from: 1, to: 5 },
	]);
	assert.equal(changeText({ field: 'coins', from: 1200, to: 2200 }), 'Xu 1.200 → 2.200 (+1.000)');
	assert.equal(changeText({ field: 'diamonds', from: 5, to: 0 }), 'Kim cương 5 → 0 (−5)');
	const d = emptyDraft();
	d.amounts.potions = { sign: 1, text: '5000' };
	assert.deepEqual(draftPreview(hero, d), [{ field: 'potions', from: 2, to: 999 }], 'đang gõ: số quá biên độ kẹp ở biên độ rồi kẹp trần bình');
	const row = (id: number, at: number, field: AdminLogEntry['field'], reason = 'Quà'): AdminLogEntry => ({ id, at, admin: 'quan_tri', characterId: hero.id, characterName: hero.name, field, from: 0, to: 1, reason });
	// Máy chủ trả mới nhất trước, mỗi trường một dòng (một lần cộng ghi theo thứ tự cấp → … → điểm thưởng).
	const groups = groupLog([row(5, 200, 'bonusPoints'), row(4, 200, 'coins'), row(3, 200, 'level'), row(2, 100, 'coins', 'Khác'), row(1, 100, 'coins')]);
	assert.deepEqual(
		groups.map((g) => [g.at, g.reason, g.changes.map((c) => c.field)]),
		[
			[200, 'Quà', ['level', 'coins', 'bonusPoints']],
			[100, 'Khác', ['coins']],
			[100, 'Quà', ['coins']],
		],
	);
});

console.log(`${passed} test qua`);

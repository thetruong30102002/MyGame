// Chạy: npx tsx tests/story.test.ts — kiểm dữ liệu cốt truyện khớp map thật, rồi tự chơi hết từ 3 tuổi tới boss.
import assert from 'node:assert/strict';
import { HERO_SKILLS } from '../src/game/combat/skills';

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
const { StoryDirector } = await import('../src/game/story/StoryDirector');
// Cả vùng: địa điểm/vùng quái/hình nộm/boss có thể nằm ở BẤT KỲ map nào (id duy nhất trên cả vùng — pipeline kiểm).
const region = await import('./region');
const regionMaps = Object.values(region.maps).map((m) => m.map);
const spots = new Set(regionMaps.flatMap((m) => m.spots.map((s) => s.id)));
const allZones = regionMaps.flatMap((m) => m.monsterZones);
const allDummies = regionMaps.flatMap((m) => m.dummies);
const problems: string[] = [];
const check = (ok: boolean, msg: string): void => {
	if (!ok) problems.push(msg);
};

// 1) Mọi tham chiếu phải trỏ tới thứ có thật.
for (const [key, npc] of Object.entries(STORY.npcs)) check(spots.has(npc.at.spot), `NPC ${key} đứng ở địa điểm không có: ${npc.at.spot}`);
// Mỗi map chỉ MỘT loại quái (chủ dự án chốt 07/10/2026), sống theo bầy. Vùng boss (1 con, thanh máu boss) đứng ngoài
// luật này — cùng cách `validateRegion` của pipeline và chú thích `MonsterZone.boss`.
for (const m of regionMaps) {
	const packs = m.monsterZones.filter((z) => !z.boss);
	const kinds = new Set(packs.flatMap((z) => z.monsters));
	check(kinds.size <= 1, `map ${m.id} có ${kinds.size} loại quái: ${[...kinds].join(', ')}`);
	for (const z of packs) check(z.count >= 3, `${m.id}/${z.id}: bầy chỉ ${z.count} con`);
	for (const z of m.monsterZones) if (z.boss) check(z.count === 1 && z.monsters.length === 1, `${m.id}/${z.id}: vùng boss phải đúng 1 con`);
}
const unlocks = new Set(HERO_SKILLS.map((s) => s.unlock).filter(Boolean));
for (const q of STORY.quests) {
	const present = (key: string): boolean => {
		const n = STORY.npcs[key];
		return !!n && q.age >= n.ages[0] && q.age <= n.ages[1];
	};
	if (q.giver) check(present(q.giver), `${q.id}: người giao ${q.giver} không có mặt ở tuổi ${q.age}`);
	if (q.turnIn !== 'auto') check(present(q.turnIn), `${q.id}: người nhận ${q.turnIn} không có mặt ở tuổi ${q.age}`);
	const o = q.objective;
	if (o.type === 'talk') check(present(o.npc), `${q.id}: cần nói với ${o.npc} nhưng không có mặt ở tuổi ${q.age}`);
	if (o.type === 'reach') check(spots.has(o.spot), `${q.id}: địa điểm ${o.spot} không có`);
	if (o.type === 'practice') check(o.dummy ? allDummies.some((d) => d.id === o.dummy) : allDummies.length > 0, `${q.id}: hình nộm ${o.dummy ?? '(bất kỳ)'} không có trên map nào`);
	if (o.type === 'pickup') {
		const ps = q.onGive?.pickups?.spots ?? [];
		check(ps.every((s) => spots.has(s)), `${q.id}: điểm nhặt không có: ${ps.filter((s) => !spots.has(s)).join(', ')}`);
		check(ps.length >= o.count, `${q.id}: chỉ ${ps.length} điểm nhặt cho ${o.count} vật`);
	}
	if (q.onGive?.zone) {
		const z = allZones.find((m) => m.id === q.onGive!.zone);
		check(!!z, `${q.id}: vùng quái ${q.onGive.zone} không có`);
		if (o.type === 'kill' && o.monster && z) check(z.monsters.includes(o.monster), `${q.id}: vùng ${z.id} không có ${o.monster}`);
	}
	if (o.type === 'boss') check(regionMaps.some((m) => m.boss?.characterId === o.id), `${q.id}: boss ${o.id} không có trên map nào`);
	if (q.reward.unlockSkill) check(unlocks.has(q.reward.unlockSkill), `${q.id}: mở kỹ năng không tồn tại "${q.reward.unlockSkill}"`);
	if (q.onGive?.unlock) check(unlocks.has(q.onGive.unlock), `${q.id}: quà mở kỹ năng không tồn tại "${q.onGive.unlock}"`);
	if (o.type === 'practice' && o.element) {
		// Kỹ năng dùng để luyện phải mở TRƯỚC: thưởng của nhiệm vụ trước, hoặc quà trao ngay lúc giao chính việc này
		// (kiếm gỗ của cha → luyện chém; trượng tập của mẹ → luyện Tia Aether).
		const need = HERO_SKILLS.find((s) => s.element === o.element)?.unlock;
		const idx = STORY.quests.indexOf(q);
		const opened = !need || q.onGive?.unlock === need || STORY.quests.slice(0, idx).some((p) => p.reward.unlockSkill === need || p.onGive?.unlock === need);
		check(opened, `${q.id}: luyện ${o.element} nhưng chưa nhiệm vụ nào trước đó mở "${need}"`);
	}
}
for (const age of new Set(STORY.quests.map((q) => q.age))) check(!!STORY.ageCards[age], `thiếu thẻ chuyển cảnh cho tuổi ${age}`);
assert.deepEqual(problems, [], `Dữ liệu cốt truyện lỗi:\n- ${problems.join('\n- ')}`);

// 2) Tự chơi hết: làm đúng việc mỗi nhiệm vụ đòi.
const log: string[] = [];
const ages: number[] = [];
let exp = 0;
let ended = false;
const d = new StoryDirector(STORY, {
	dialogue: (lines) => log.push(`  ${lines[0]?.speaker}: ${lines[0]?.text.slice(0, 60)}`),
	reward: (r, title) => {
		exp += r.exp;
		log.push(`✔ ${title} (+${r.exp} EXP${r.unlockSkill ? `, mở ${r.unlockSkill}` : ''})`);
	},
	questsChanged: () => {},
	pickups: () => {},
	clearPickups: () => {},
	awakenBoss: () => {},
	spawnZone: () => {},
	questCompleted: () => {},
	unlocked: (id) => log.push(`  🎁 nhận ${id}`),
	ageChanged: (age) => ages.push(age),
	chapterEnd: () => {
		ended = true;
	},
});
d.restore();
let targetCalls = 0;
for (let guard = 0; guard < 200 && !d.finished; guard += 1) {
	const q = d.quest!;
	d.questTarget();
	targetCalls += 1;
	if (!d.state.accepted && q.giver) {
		d.talk(q.giver);
		continue;
	}
	if (d.state.ready) {
		assert.notEqual(q.turnIn, 'auto', `${q.id} đã đủ mục tiêu mà không tự trả`);
		d.talk(q.turnIn);
		continue;
	}
	const o = q.objective;
	if (o.type === 'talk') d.talk(o.npc);
	else if (o.type === 'pickup') d.pickup(o.item);
	else if (o.type === 'kill') d.monsterKilled(o.monster ?? 'mob_mushroom_001');
	else if (o.type === 'practice') {
		if (o.reaction) {
			// Đòn đúng nguyên tố nhưng KHÔNG ra phản ứng (gió vào hình nộm khô) thì không được tính.
			const before = d.state.progress;
			d.practiced(o.element ?? 'aether', null);
			assert.equal(d.state.progress, before, `${q.id}: đòn không ra phản ứng ${o.reaction} vẫn được tính`);
		}
		d.practiced(o.element ?? 'aether', o.reaction ?? null);
	}
	else if (o.type === 'reach') d.reached(o.spot);
	else if (o.type === 'boss') d.bossDefeated(o.id);
}
console.log(log.join('\n'));
assert.ok(d.finished && ended, 'phải đi hết mọi nhiệm vụ và tới màn kết');
assert.equal(d.questTarget(), null, 'hết truyện thì không còn chỗ để tự đi tới');
assert.deepEqual(ages, [...new Set(STORY.quests.map((q) => q.age))].slice(1), 'phải qua đủ các mốc tuổi theo thứ tự');
for (const s of ['sword', 'staff', 'fire', 'water', 'wind', 'ice', 'earth']) assert.ok(d.isUnlocked(s), `phải có ${s}`);
// Thổ (GĐ2 lượt B): nhiệm vụ tuổi 16 ở Nghĩa địa Hoàng Hôn trao mã `earth` — bia đá cổ (vật thể, không phải người); ngay
// sau đó thử Đá Văng vào Ông Rơm sân sau (đòn hệ Thổ).
{
	const at = STORY.quests.findIndex((q) => q.reward.unlockSkill === 'earth');
	const q = STORY.quests[at]!;
	assert.deepEqual([q.id, q.age, q.objective.type, q.turnIn], ['y1b_grave_stele', 16, 'talk', 'gy_stele'], 'mở Thổ: nói với bia đá cổ');
	assert.equal(STORY.quests[at - 1]?.id, 'y1_mushrooms', 'nối ngay sau "Nấm Ánh Lam" (Mirelle nói tiếp)');
	assert.equal(q.giver, null, 'tự nhận — Mirelle dặn ngay trong buổi trả nấm');
	const stele = STORY.npcs.gy_stele!;
	assert.deepEqual([stele.sprite, stele.prop, stele.at.spot], [null, 'rune_stone', 'south_gate_gy'], 'không thêm nhân vật chưa có hình: vật thể có sẵn trong atlas đồ vật');
	assert.ok(region.atlas.frames['human/rune_stone'], 'đồ vật làm hình bia đá có trong atlas');
	assert.equal(region.spotAnywhere(stele.at.spot)?.mapId, 'graveyard', 'bia đá ở Nghĩa địa Hoàng Hôn');
	assert.ok(q.after.some((l) => l.speaker === 'inner') && q.after.some((l) => /sợi/.test(l.text) && /nâu|đất/.test(l.text)), 'độc thoại thấy sợi tơ màu đất');
	const next = STORY.quests[at + 1]!;
	assert.deepEqual([next.id, next.objective.type, (next.objective as { element?: string }).element], ['y1c_stone_dummy', 'practice', 'earth'], 'thử Đá Văng ngay sau khi mở Thổ');
	assert.equal(STORY.quests[at + 2]?.id, 'y2_shadows', 'rồi mới tới việc Aldric giao');
	// Chỗ đứng an toàn cho người chơi cấp 2–3: xa vùng lang thang + tầm phát hiện của mọi bầy xác sống, và xa hang Vua Lich.
	const gy = region.maps.graveyard!.map;
	const spot = gy.spots.find((s) => s.id === stele.at.spot)!;
	const sx = spot.x + (stele.at.dx ?? 0);
	const sy = spot.y + (stele.at.dy ?? 0);
	const { ENEMY_STATS } = await import('../src/game/combat/skills');
	for (const z of gy.monsterZones) {
		const aggro = Math.max(...z.monsters.map((m) => ENEMY_STATS[m]?.aggro ?? 0));
		const gap = Math.hypot(sx - z.x, sy - z.y) - z.radius - aggro;
		assert.ok(gap > 60, `bia đá cách vùng ${z.id} còn ${Math.round(gap)}px ngoài tầm phát hiện`);
	}
	assert.ok(!region.maps.graveyard!.blocked(sx, sy, 11, 5), 'chỗ bia đá không bị chặn');
}
// Hồi Phục nay là Suối Lành (Thuỷ mốc 3, học bằng điểm tiềm năng — cây Nguyên tố 07/10/2026): không nhiệm vụ nào trao nữa.
assert.ok(!STORY.quests.some((q) => q.reward.unlockSkill === 'heal' || q.onGive?.unlock === 'heal'), 'Suối Lành không mở bằng cốt truyện');
// Băng Tiễn là quà của "Tuyết cho mẹ" (tết nước + gió thành băng) — mở cuối tuổi thơ, trước chương 16 tuổi.
const iceAt = STORY.quests.findIndex((q) => q.reward.unlockSkill === 'ice');
assert.equal(STORY.quests[iceAt]?.id, 'c8_snow', 'Băng Tiễn phải mở ở c8_snow');
assert.ok(STORY.quests.findIndex((q) => q.reward.unlockSkill === 'water') < iceAt && STORY.quests.findIndex((q) => q.reward.unlockSkill === 'wind') < iceAt, 'Băng mở SAU khi đã có Thuỷ và Phong');
const swordAt = STORY.quests.findIndex((q) => q.onGive?.unlock === 'sword');
const staffAt = STORY.quests.findIndex((q) => q.onGive?.unlock === 'staff');
assert.ok(swordAt >= 0 && staffAt >= 0 && STORY.quests[swordAt]!.age === STORY.quests[staffAt]!.age, 'kiếm (cha) và trượng (mẹ) phải trao cùng một mốc tuổi — học song song');

// 3) Bản lưu cũ (trước khi chèn "Thanh kiếm gỗ", chưa ghi questId) vẫn đúng chỗ và được bù quà.
const legacy = (index: number, completed: string[], unlocked: string[], progress: number): void =>
	void store.set('aether.save.v2', JSON.stringify({ version: 2, index, accepted: true, ready: false, progress, completed, unlocked, age: 6, player: { level: 2, exp: 0, coins: 0, potions: 0 } }));
const noop = { dialogue() {}, reward() {}, questsChanged() {}, pickups() {}, clearPickups() {}, awakenBoss() {}, spawnZone() {}, questCompleted() {}, unlocked() {}, ageChanged() {}, chapterEnd() {} };
legacy(3, ['c4_silverdew', 'c4_dinner', 'c6_first_thread'], ['fire'], 1); // cũ: index 3 = "Mũ cũ. Đừng cháy."
let m = new StoryDirector(STORY, noop);
assert.equal(m.quest?.id, 'c6_old_hat', 'bản lưu cũ đang làm "Mũ cũ" phải ở lại đúng nhiệm vụ đó');
assert.ok(m.state.accepted && m.state.progress === 1, 'giữ nguyên tiến độ nhiệm vụ đang làm');
assert.ok(m.state.completed.includes('c6_wooden_sword'), 'nhiệm vụ mới chèn phía trước coi như đã xong');
for (const s of ['sword', 'staff', 'fire']) assert.ok(m.isUnlocked(s), `bản lưu cũ phải được bù ${s}`);
legacy(2, ['c4_silverdew', 'c4_dinner'], [], 2); // cũ: đang luyện Tia Aether — phải có trượng để luyện tiếp
m = new StoryDirector(STORY, noop);
assert.equal(m.quest?.id, 'c6_first_thread');
assert.ok(m.isUnlocked('staff') && !m.isUnlocked('sword'), 'đang làm "Sợi tơ đầu tiên" thì có trượng, chưa có kiếm');
// Bản lưu đã qua "Tuyết cho mẹ" từ trước khi có hệ Băng: được trao bù Băng Tiễn, và có ô điểm tiềm năng rỗng.
store.set('aether.save.v2', JSON.stringify({ version: 2, index: 7, questId: 'y1_mushrooms', accepted: false, ready: false, progress: 0, completed: ['c4_silverdew', 'c4_dinner', 'c6_wooden_sword', 'c6_first_thread', 'c6_old_hat', 'c8_forest_edge', 'c8_snow'], unlocked: ['sword', 'staff', 'fire', 'water', 'wind'], age: 16, player: { level: 3, exp: 0, coins: 0, potions: 0 } }));
m = new StoryDirector(STORY, noop);
assert.ok(m.isUnlocked('ice'), 'bản lưu đã qua c8_snow phải được bù Băng Tiễn');
assert.deepEqual(m.state.talents, {}, 'bản lưu cũ chưa có điểm tiềm năng → {}');
assert.equal(m.state.talentsV, 2, 'đánh dấu định dạng cây Nguyên tố');
assert.equal(m.refunded, 0, 'không có điểm cũ thì không có gì để hoàn');
assert.equal(m.talentTiers().ice, 1, 'Băng Tiễn trao bù là mốc 1 ngay');
// Bản lưu đã qua mốc truyện mở Thổ (đang ở Aldric / Quỷ vương / đã xong chương) — từ trước khi có nhiệm vụ: được tính là
// xong hai nhiệm vụ mới chèn và BÙ mã `earth` (lưới an toàn `migrate`), Game báo một lần qua `granted`. Đang làm "Nấm
// Ánh Lam" thì chưa — sẽ tự đi qua nhiệm vụ đó.
const youthDone = ['c4_silverdew', 'c4_dinner', 'c6_wooden_sword', 'c6_first_thread', 'c6_old_hat', 'c8_forest_edge', 'c8_snow', 'y1_mushrooms'];
const at16 = (extra: Record<string, unknown>) =>
	store.set('aether.save.v2', JSON.stringify({ version: 2, index: 8, accepted: true, ready: false, progress: 2, completed: youthDone, unlocked: ['sword', 'staff', 'fire', 'water', 'wind', 'ice'], age: 16, player: { level: 4, exp: 0, coins: 0, potions: 0 }, talentsV: 2, talents: {}, ...extra }));
at16({ questId: 'y2_shadows' });
m = new StoryDirector(STORY, noop);
assert.equal(m.quest?.id, 'y2_shadows', 'đang đánh ma vật Mossvale: vẫn đúng nhiệm vụ đó');
assert.ok(m.state.accepted && m.state.progress === 2, 'giữ tiến độ');
assert.ok(m.state.completed.includes('y1b_grave_stele') && m.state.completed.includes('y1c_stone_dummy'), 'hai nhiệm vụ chèn phía trước coi như xong');
assert.ok(m.isUnlocked('earth') && m.granted.includes('earth'), 'bù mã earth + báo một lần');
assert.equal(m.talentTiers().earth, 1, 'Thổ mốc 1 ngay (Đá Văng)');
m.save();
assert.deepEqual(new StoryDirector(STORY, noop).granted, [], 'nạp lại: không bù / báo lặp');
store.set('aether.save.v2', JSON.stringify({ version: 2, index: 10, accepted: false, ready: false, progress: 0, completed: [...youthDone, 'y2_shadows', 'y3_demon'], unlocked: ['sword', 'staff', 'fire', 'water', 'wind', 'ice'], age: 16, player: { level: 5, exp: 0, coins: 0, potions: 0 }, talentsV: 2, talents: {} }));
m = new StoryDirector(STORY, noop);
assert.ok(m.finished && m.isUnlocked('earth'), 'đã xong chương: vẫn được bù Thổ');
at16({ questId: 'y1_mushrooms', index: 7, completed: youthDone.slice(0, -1), progress: 1 });
m = new StoryDirector(STORY, noop);
assert.ok(m.quest?.id === 'y1_mushrooms' && !m.isUnlocked('earth') && m.granted.length === 0, 'đang hái nấm: chưa có Thổ, sẽ đi qua nhiệm vụ mở Thổ');
store.clear();
console.log(`\n✔ ${STORY.quests.length} nhiệm vụ, mốc tuổi ${[STORY.quests[0]!.age, ...ages].join(' → ')}, tổng ${exp} EXP, kiếm + trượng + đủ 5 nguyên tố (cả Băng; Thổ ở bia đá Nghĩa địa tuổi 16; Suối Lành học bằng mốc Thuỷ); bản lưu cũ chuyển đúng (cả bù Thổ); mọi tham chiếu khớp map`);

// 4) Ô nhiệm vụ bấm để tự đi: mục tiêu (`questTarget`) cùng nhánh với dòng chữ (`questViews`), mọi khoá có thật,
//    đổi ra toạ độ trong map và tới được bằng tìm đường thật.
{
	const { resolveTarget, npcAnchor, STOP_NPC } = await import('../src/game/story/resolveTarget');
	const { exitGoal } = await import('../src/game/world/exits');
	const town = region.maps.town!.map;
	const spotOf = (id: string) => town.spots.find((s) => s.id === id);
	const zones = new Set(allZones.map((z) => z.id));
	const dummies = new Set(allDummies.map((x) => x.id));
	/**
	 * Đi từ nhà (thị trấn) tới map `where` qua các lối: mỗi map trên đường phải đi được từ chỗ vừa tới đến lối kế tiếp.
	 * Trả chỗ đứng khi vừa vào `where` (hoặc nhà nếu ở ngay thị trấn).
	 */
	const travel = (where: string, tag: string): { x: number; y: number } | null => {
		let cur = 'town';
		let at: { x: number; y: number } = spotOf('home')!;
		for (let hops = 0; cur !== where; hops += 1) {
			const next = region.index.nextExit(cur, where);
			const exit = next && region.maps[cur]!.map.exits.find((e) => e.id === next.id);
			if (!exit || hops > 6) {
				issues.push(`${tag}: không có đường từ thị trấn tới map ${where}`);
				return null;
			}
			const path = region.maps[cur]!.nav().findPath(at, exitGoal(exit, exit.label));
			if (!path || path.partial) issues.push(`${tag}: ở ${cur} không đi tới được lối ${exit.id}`);
			at = region.arrivalFrom(cur, exit.to);
			cur = exit.to;
		}
		return at;
	};
	// Bản chép NGUYÊN VĂN `questViews` cũ (trước khi dùng chung `questTarget`) — chữ trên ô nhiệm vụ không được đổi.
	const legacyObjective = (dir: InstanceType<typeof StoryDirector>): string => {
		const q = dir.quest!;
		const o = q.objective;
		const total = o.type === 'pickup' || o.type === 'kill' || o.type === 'practice' ? o.count : 1;
		if (!dir.state.accepted && q.giver) return `Nói chuyện với ${dir.npcName(q.giver)}`;
		if (dir.state.ready && q.turnIn !== 'auto') return `Báo lại cho ${dir.npcName(q.turnIn)}`;
		return q.objectiveText.replace('{n}', String(Math.min(dir.state.progress, total))).replace('{total}', String(total));
	};
	const kindOf: Record<string, string> = { talk: 'npc', pickup: 'pickup', kill: 'kill', practice: 'practice', reach: 'reach', boss: 'boss' };
	const issues: string[] = [];
	let resolved = 0;
	for (const [index, q] of STORY.quests.entries()) {
		for (const phase of ['new', 'doing', 'ready'] as const) {
			const dir = new StoryDirector(STORY, noop);
			Object.assign(dir.state, { index, age: q.age, accepted: phase !== 'new', ready: phase === 'ready', progress: phase === 'doing' ? 1 : 0 });
			const t = dir.questTarget();
			const tag = `${q.id}/${phase}`;
			const view = dir.questViews()[0]!.objective;
			if (view !== legacyObjective(dir)) issues.push(`${tag}: chữ nhiệm vụ đổi "${legacyObjective(dir)}" → "${view}"`);
			let want: string | null;
			if (phase === 'new' && q.giver) want = `npc:giver:${q.giver}`;
			else if (phase === 'ready') want = q.turnIn === 'auto' ? null : `npc:turnIn:${q.turnIn}`;
			else want = q.objective.type === 'talk' ? `npc:talk:${q.objective.npc}` : kindOf[q.objective.type]!;
			const got = !t ? null : t.kind === 'npc' ? `npc:${t.role}:${t.npc}` : t.kind;
			if (got !== want) issues.push(`${tag}: mục tiêu ${got} ≠ ${want}`);
			if (!t) continue;
			// Khoá trỏ tới thứ có thật.
			const npc = t.kind === 'npc' ? STORY.npcs[t.npc] : undefined;
			if (t.kind === 'npc' && !npc) issues.push(`${tag}: NPC ${t.npc} không có`);
			if (t.kind === 'npc' && npc && (q.age < npc.ages[0] || q.age > npc.ages[1])) issues.push(`${tag}: NPC ${t.npc} không có mặt ở tuổi ${q.age}`);
			if (t.kind === 'pickup' && (!t.spots.length || t.spots.some((s) => !spots.has(s)))) issues.push(`${tag}: điểm nhặt sai ${t.spots.join(',')}`);
			if (t.kind === 'reach' && !spots.has(t.spot)) issues.push(`${tag}: địa điểm ${t.spot} không có`);
			if (t.kind === 'kill' && t.zone && !zones.has(t.zone)) issues.push(`${tag}: vùng ${t.zone} không có`);
			if (t.kind === 'practice' && t.dummy && !dummies.has(t.dummy)) issues.push(`${tag}: hình nộm ${t.dummy} không có`);
			// Map chứa mục tiêu, đi từ nhà (chỗ mỗi mốc tuổi bắt đầu) qua các lối tới đó, rồi đổi ra toạ độ và đi tới được.
			const where = region.index.mapOfTarget(t, 'town', (key) => STORY.npcs[key]?.at.spot);
			if (!where) {
				issues.push(`${tag}: không biết mục tiêu nằm ở map nào`);
				continue;
			}
			const player = travel(where, tag);
			if (!player) continue;
			const tm = region.maps[where]!;
			const W = tm.W;
			const H = tm.H;
			const nav = tm.nav();
			const r = resolveTarget(t, {
				spot: tm.spot,
				npcPos: (key) => {
					const n = STORY.npcs[key];
					return n ? npcAnchor(n.at, tm.spot(n.at.spot), tm.map.spawn) : undefined;
				},
				npcName: (key) => dir.npcName(key),
				pickups: [],
				zones: tm.map.monsterZones.map((z) => ({ ...z, active: (!z.onDemand && q.age >= (z.fromAge ?? 0)) || z.id === q.onGive?.zone })),
				dummies: tm.map.dummies,
				boss: tm.map.boss,
				player,
			});
			if (!r) {
				issues.push(`${tag}: không đổi được ra toạ độ`);
				continue;
			}
			if (r.x < 0 || r.y < 0 || r.x > W || r.y > H) issues.push(`${tag}: toạ độ ngoài map ${r.x},${r.y}`);
			if (t.kind === 'npc' && r.stop !== STOP_NPC) issues.push(`${tag}: bán kính dừng NPC ${r.stop}`);
			const path = nav.findPath(player, r);
			if (!path || path.partial) issues.push(`${tag}: không tìm ra đường tới ${r.label} (${r.x},${r.y})`);
			resolved += 1;
		}
	}
	// Nhiệm vụ không người giao (tự nhận) sau autoAccept phải ra đúng việc, không phải đi tìm NPC.
	for (const [id, kind] of [['c8_snow', 'practice'], ['y3_demon', 'boss']] as const) {
		const at = STORY.quests.findIndex((q) => q.id === id);
		const dir = new StoryDirector(STORY, noop);
		Object.assign(dir.state, { index: at, age: STORY.quests[at]!.age, accepted: false, ready: false, progress: 0 });
		dir.restore();
		if (dir.questTarget()?.kind !== kind) issues.push(`${id} sau khi tự nhận phải ra ${kind}, được ${dir.questTarget()?.kind}`);
	}
	// y2_shadows: chơi một mạch từ tuổi thơ thì bìa rừng (bật năm 8 tuổi, quái hồi sinh) VẪN đang dựng và gần lối vào
	// rừng hơn — vẫn phải ra Khoảng trống như chữ ghi (dữ liệu ghi vùng).
	const forest = region.maps.mossvale!;
	const allActive = forest.map.monsterZones.map((z) => ({ ...z, active: true }));
	const y2 = STORY.quests.find((q) => q.id === 'y2_shadows')!;
	const y2Dir = new StoryDirector(STORY, noop);
	Object.assign(y2Dir.state, { index: STORY.quests.indexOf(y2), age: y2.age, accepted: true, ready: false, progress: 0 });
	if (region.index.mapOfTarget(y2Dir.questTarget(), 'town', () => undefined) !== 'mossvale') issues.push('y2_shadows phải dẫn sang rừng Mossvale');
	for (const at of ['west_entry', 'forest_edge', 'north_entry']) {
		const shadows = resolveTarget(y2Dir.questTarget(), { spot: forest.spot, npcPos: () => undefined, pickups: [], zones: allActive, dummies: [], boss: null, player: forest.spot(at)! });
		const want = forest.map.monsterZones.find((z) => z.id === 'mossvale_clearing')!;
		if (shadows?.label !== 'Khoảng trống Mossvale' || shadows.stop !== Math.min(want.radius * 0.5, 120)) issues.push(`y2_shadows (đứng ở ${at}): chọn ${shadows?.label} dừng ${shadows?.stop}`);
	}
	// Luyện tập: hình nộm theo đúng chữ trên ô nhiệm vụ ("sân sau" / "bên sông"), đứng ở đâu cũng vậy.
	const dummyOfText = (text: string): string | null => (/sân sau/.test(text) ? 'dummy_backyard' : /bên sông/.test(text) ? 'dummy_riverside' : null);
	for (const [index, q] of STORY.quests.entries()) {
		if (q.objective.type !== 'practice') continue;
		if (!q.objective.dummy) issues.push(`${q.id}: nhiệm vụ luyện tập chưa ghi hình nộm`);
		const said = dummyOfText(q.objectiveText);
		if (said && q.objective.dummy !== said) issues.push(`${q.id}: chữ ghi ${said} nhưng dữ liệu là ${q.objective.dummy}`);
		const dir = new StoryDirector(STORY, noop);
		Object.assign(dir.state, { index, age: q.age, accepted: true, ready: false, progress: 0 });
		const want = town.dummies.find((x) => x.id === q.objective.dummy);
		for (const at of town.spots) {
			const r = resolveTarget(dir.questTarget(), { spot: spotOf, npcPos: () => undefined, pickups: [], zones: [], dummies: town.dummies, boss: null, player: at });
			if (!want || r?.x !== want.x || r.y !== want.y) issues.push(`${q.id} đứng ở ${at.id}: tới hình nộm ${r?.x},${r?.y} thay vì ${q.objective.dummy}`);
		}
	}
	// Luyện tập không ghi hình nộm: chọn hình nộm gần chỗ đứng nhất, quay mặt về nó.
	const near = resolveTarget({ kind: 'practice' }, { spot: spotOf, npcPos: () => undefined, pickups: [], zones: [], dummies: town.dummies, boss: null, player: spotOf('river_bank')! });
	if (near?.x !== town.dummies.find((x) => x.id === 'dummy_riverside')!.x || !near.face) issues.push('luyện tập ở bờ sông phải chọn hình nộm bờ sông và quay mặt về nó');
	// Vật phẩm đã rải: đi tới cái gần nhất còn lại.
	const pick = resolveTarget({ kind: 'pickup', item: 'herb', spots: ['herb_spot_1'] }, { spot: spotOf, npcPos: () => undefined, pickups: [{ item: 'herb', x: 100, y: 100 }, { item: 'herb', x: 500, y: 1100 }, { item: 'mushroom', x: 460, y: 1110 }], zones: [], dummies: [], boss: null, player: spotOf('home')! });
	if (pick?.x !== 500 || pick.stop !== 36) issues.push(`nhặt đồ phải tới cây cỏ gần nhất, được ${pick?.x},${pick?.y}`);
	assert.deepEqual(issues, [], `Mục tiêu tự đi lỗi:\n- ${issues.join('\n- ')}`);
	console.log(`✔ questTarget: ${STORY.quests.length} nhiệm vụ × 3 trạng thái, ${resolved} mục tiêu đổi ra toạ độ và tìm được đường; chữ nhiệm vụ không đổi; gọi ${targetCalls} lần trong lúc tự chơi`);
}

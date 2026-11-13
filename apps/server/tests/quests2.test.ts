// Nhiệm vụ mới (13/11/2026): máy chủ kiểm vị trí, đếm sự kiện, trao thưởng một lần, việc ngày tất định.
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import type { ServerMessage } from '@havenlord/protocol';
import { Q2_FIRST_MAP_NPCS } from '@havenlord/sim/quests2';
import { Store } from '../src/db.ts';
import { newProgress } from '../src/http.ts';
import { Quests2 } from '../src/quests2.ts';

test('nhiệm vụ mới: M01 qua nói chuyện / tới chỗ, M03 gặp đủ người, thưởng một lần, mở Gia viên ở M05, việc ngày', () => {
	const dir = mkdtempSync(join(tmpdir(), 'havenlord-q2-'));
	const store = new Store(join(dir, 'q.db'));
	try {
		const acc = store.createAccount('q2', 'x')!;
		const id = store.createCharacter('00000000-0000-0000-0000-0000000000q2', acc, 'Người thử', 'male', newProgress())!.id;
		let at = { map: 'human/town', x: 0, y: 0 };
		let level = 3;
		const rewards: string[] = [];
		const msgs: ServerMessage[] = [];
		let farmOpen = false;
		let now = Date.parse('2026-11-13T10:00:00+07:00');
		const q = new Quests2(store.quests2, {
			where: () => at, send: (_id, m) => void msgs.push(m), level: () => level, account: () => acc,
			farmOpen: () => farmOpen, unlockFarm: () => void (farmOpen = true), reward: (_id, _e, _c, ref) => void rewards.push(ref),
		}, resolve('../../assets/maps'), () => now);
		const go = (npc: string) => { at = q.npcPlace(npc)!; q.handle(id, { op: 'talk', npc }); };
		const state = () => store.quests2.read(id);
		q.handle(id, { op: 'get' });
		assert(state().active.q2_main_01, 'tự nhận M01');
		assert.equal(state().daily?.slots.length, 4);
		at = { map: 'human/town', x: 0, y: 0 };
		q.handle(id, { op: 'talk', npc: 'q2_nell' });
		assert(msgs.some((m) => m.t === 'system' && /gần/.test(m.text)), 'đứng xa: từ chối');
		go('q2_nell');
		go('q2_pip');
		assert.equal(state().active.q2_main_01!.step, 1, 'chưa tới quầy thì nói Pip không tính');
		at = q.npcPlace('q2_nell')!; at = { ...at, x: at.x + 210, y: at.y + 120 };
		q.handle(id, { op: 'reach', spot: 'plaza' });
		go('q2_pip');
		go('q2_nell');
		assert(state().done.includes('q2_main_01') && rewards.includes('q2:q2_main_01'));
		assert(state().active.q2_main_02, 'tự nhận M02');
		go('q2_gareth');
		at = q.npcPlace('q2_gareth')!; at = { ...at, x: at.x - 70 };
		q.handle(id, { op: 'reach', spot: 'backyard' });
		go('village_weapon');
		go('q2_nell');
		for (const n of Q2_FIRST_MAP_NPCS) go(n);
		go('q2_nell');
		assert(state().done.includes('q2_main_03'), 'M03 xong khi gặp đủ người');
		for (let i = 0; i < 6; i++) q.kill(id, 'mob_mushroom_001', 'human/mossvale');
		go('village_heal');
		go('village_event');
		assert(state().done.includes('q2_main_04'));
		go('village_event');
		go('q2_nell');
		assert(farmOpen, 'M05 mở Gia viên');
		const before = rewards.length;
		go('q2_nell');
		assert.equal(rewards.filter((r) => r === 'q2:q2_main_05').length, 1, 'không thưởng lại');
		// Việc ngày: đếm sự kiện, đủ bộ có thưởng thêm; sang ngày mới bốc lại.
		const d1 = state().daily!;
		now += 24 * 3600_000;
		q.handle(id, { op: 'get' });
		assert.notEqual(state().daily!.date, d1.date);
		assert(rewards.length >= before);
	} finally {
		store.close();
		rmSync(dir, { recursive: true, force: true });
	}
});

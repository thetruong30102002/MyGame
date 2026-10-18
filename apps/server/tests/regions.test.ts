// Chạy: npx tsx tests/regions.test.ts — khung nhiều vùng (docs/ke-hoach-the-gioi.md mục 5): danh sách vùng, id `vùng/map`, cổng
// vùng (cấp + boss chúa vùng trước, vùng chưa mở), trạm có cột dịch chuyển; máy chủ trả trạm đã từng tới. CSDL SQLite THẬT.
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { ServerMessage } from '@aether/protocol';
import { hubKeys, REGIONS, regionDef, regionGate, splitMapKey, START_REGION } from '@aether/sim/regions';
import { MERCHANTS } from '@aether/sim/shop';
import { elementMult } from '@aether/sim/skills';
import { Store } from '../src/db.ts';
import { newProgress } from '../src/http.ts';
import { World } from '../src/world.ts';

let passed = 0;
const test = (name: string, fn: () => void): void => {
	fn();
	passed += 1;
	console.log(`  ✔ ${name}`);
};
console.log('regions (máy chủ + luật dùng chung)');

const MAPS = process.env.AETHER_MAPS ?? join(import.meta.dirname, '../../../assets/maps');

test('10 vùng theo thứ tự, cấp liền nhau, mỗi vùng một nơi ở (làng / toà thành) có cột dịch chuyển + người bán', () => {
	assert.equal(REGIONS.length, 13);
	const main = REGIONS.filter(r => !r.branch);
	assert.deepEqual(main.map((r) => r.order), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
	assert.equal(new Set(REGIONS.map((r) => r.id)).size, 13);
	for (let i = 1; i < main.length; i += 1) assert.equal(main[i]!.levels[0], main[i - 1]!.levels[1], `${REGIONS[i]!.id}: cấp vào = cấp rời vùng trước`);
	for (const r of REGIONS) {
		assert.ok(['village', 'castle'].includes(r.settlement.kind), r.id);
		assert.ok(r.settlement.services.includes('waystone') && r.settlement.services.includes('shop'), `${r.id}: có cột + người bán`);
	}
	assert.equal(regionDef(START_REGION)?.ready, true);
});

test('vùng đã mở có đủ map trên đĩa: chỉ mục `world.json` + map trạm', () => {
	for (const r of REGIONS.filter((x) => x.ready)) {
		assert.ok(existsSync(join(MAPS, r.id, 'world.json')), `${r.id}/world.json`);
		assert.ok(existsSync(join(MAPS, r.id, `${r.hub}.json`)), `${r.id}/${r.hub}.json`);
	}
	for (const m of MERCHANTS) assert.ok(regionDef(splitMapKey(m.map, '').region)?.ready, `người bán ${m.npc} ở vùng đã mở`);
});

test('id map `vùng/map`: tách được; thiếu tiền tố thì là map cùng vùng', () => {
	assert.deepEqual(splitMapKey('swamp/hub', 'human'), { region: 'swamp', map: 'hub' });
	assert.deepEqual(splitMapKey('mossvale', 'human'), { region: 'human', map: 'mossvale' });
	// Vùng 2–7 dựng map 10/10/2026 (bộ dựng `packages/asset-pipeline/src/maps/kit`); vùng 8–10 còn đang xây.
	assert.deepEqual(hubKeys(), ['human/town', 'swamp/hub', 'desert/hub', 'highland/hub', 'tundra/hub', 'volcano/hub', 'isles/hub', 'fungal/hub', 'ruins/hub', 'void/hub', 'wood/hub', 'light/hub', 'dark/hub']);
});

test('cổng vùng: vùng đầu luôn mở; vùng chưa có map → đang xây; đủ map thì xét cấp + boss chúa vùng trước', () => {
	assert.equal(regionGate('human', { level: 1, bossKills: {} }), null);
	assert.equal(regionGate('fungal', { level: 99, bossKills: { boss_kraken_001: 1 } }), null);
	assert.match(regionGate('fungal', { level: 69, bossKills: { boss_kraken_001: 1 } })!, /Cần cấp 70/);
	assert.match(regionGate('nowhere', { level: 1, bossKills: {} })!, /Không có vùng/);
	// Thứ tự điều kiện: cấp trước, rồi boss chúa vùng trước.
	assert.match(regionGate('swamp', { level: 9, bossKills: { boss_demon_001: 1 } })!, /Cần cấp 10/);
	assert.match(regionGate('swamp', { level: 12, bossKills: {} })!, /Hạ Quỷ vương rừng sâu/);
	assert.equal(regionGate('swamp', { level: 12, bossKills: { boss_demon_001: 2 } }), null);
	assert.match(regionGate('desert', { level: 25, bossKills: { boss_demon_001: 1 } })!, /Hạ Hydra bùn/);
	assert.equal(regionGate('isles', { level: 60, bossKills: { boss_fire_god_001: 1 } }), null);
});

test('kháng / yếu hệ của quái: thiếu = ×1, có thì nhân, kẹp 0,25–3 (số nhập sai không thành bất tử)', () => {
	assert.equal(elementMult({}, 'fire'), 1);
	assert.equal(elementMult({ resist: { fire: 1.5, water: 0.5 } }, 'fire'), 1.5);
	assert.equal(elementMult({ resist: { fire: 1.5, water: 0.5 } }, 'water'), 0.5);
	assert.equal(elementMult({ resist: { ice: 0 } }, 'ice'), 0.25);
	assert.equal(elementMult({ resist: { earth: 50 } }, 'earth'), 3);
});

class FakeWs {
	readonly OPEN = 1;
	readyState = 1;
	inbox: ServerMessage[] = [];
	private onMessage: ((raw: unknown) => void) | null = null;
	on(ev: string, cb: (raw: unknown) => void): void {
		if (ev === 'message') this.onMessage = cb;
	}
	send(raw: string): void {
		this.inbox.push(JSON.parse(raw) as ServerMessage);
	}
	close(): void {
		this.readyState = 3;
	}
	push(msg: unknown): void {
		this.onMessage?.(JSON.stringify(msg));
	}
	last<T extends ServerMessage['t']>(t: T): Extract<ServerMessage, { t: T }> | undefined {
		return this.inbox.filter((m): m is Extract<ServerMessage, { t: T }> => m.t === t).at(-1);
	}
}

const dir = mkdtempSync(join(tmpdir(), 'aether-regions-'));
const store = new Store(join(dir, 'g.db'));
const world = new World(store, () => []);
try {
	test('máy chủ: trạm đã tới = map trạm của vùng đã mở mà người chơi từng đặt chân tới', () => {
		const acc = store.createAccount('g0', 'x')!;
		store.createSession('tok', acc, 3600_000);
		const id = store.createCharacter('00000000-0000-0000-0000-0000000000e0', acc, 'Lữ Khách', 'male', { ...newProgress(), map: 'human/mossvale' })!.id;
		const ws = new FakeWs();
		world.accept(ws as never);
		ws.push({ t: 'hello', token: 'tok', character: id });
		ws.push({ t: 'hubs' });
		assert.deepEqual(ws.last('hubs')!.list, ['human/mossvale'], 'vào game ở rừng: map rừng có cột dịch chuyển, chưa tới trạm nào');
		assert.deepEqual(ws.last('hubs')!.maps, ['human/mossvale'], 'kèm mọi map đã tới (bản đồ lớn làm mờ map chưa tới)');
		ws.push({ t: 'map', map: 'human/town' });
		ws.push({ t: 'hubs' });
		assert.deepEqual(ws.last('hubs')!.list, ['human/town', 'human/mossvale'], 'trạm đứng đầu, map khác theo thứ tự đã tới');
		assert.deepEqual(ws.last('hubs')!.maps, ['human/mossvale', 'human/town']);
		assert.deepEqual(store.visitedMaps(id), ['human/mossvale', 'human/town']);
	});
} finally {
	world.stop();
	store.close();
	rmSync(dir, { recursive: true, force: true });
}

console.log(`${passed} test qua`);

test('ba vùng nhánh chỉ kiểm cấp, không cần boss tuyến chính', () => {
 for (const id of ['wood','light','dark']) {
  const r = regionDef(id)!;
  assert.equal(regionGate(id, {level:r.levels[0],bossKills:{}}), null);
  assert.match(regionGate(id, {level:r.levels[0]-1,bossKills:{}})!, /Cần cấp/);
 }
});

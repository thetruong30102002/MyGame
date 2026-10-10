// Chạy: npx tsx tests/nav.test.ts — tìm đường + tự đi tới chỗ làm nhiệm vụ trên MỌI map thật của vùng, không cần
// trình duyệt.
import assert from 'node:assert/strict';
import { zoneSpawnPoints } from '@aether/sim/mobs';
import { slideMove, type Rect } from '../src/game/world/collision';
import { exitGoal } from '../src/game/world/exits';
import { NAV_CELL, type Point } from '../src/game/world/NavGrid';
import { AutoWalk } from '../src/game/AutoWalk';
import { npcAnchor, STOP_BOSS, STOP_DUMMY, STOP_NPC, type ResolvedTarget } from '../src/game/story/resolveTarget';
import { STORY } from '../src/game/story/story';
import { atlas, index, maps, meta, type LoadedMap } from './region';

/** Tự đi bằng chính phép đi trượt trục của game ở `fps` cho tới khi xong/hỏng (tối đa 3 phút). */
const simulate = (m: LoadedMap, from: Point, target: ResolvedTarget, fps: number): { result: string; pos: Point; frames: number } => {
	const pos = { x: from.x, y: from.y };
	const walker = new AutoWalk(m.nav(), () => target, target, pos);
	const dt = 1 / fps;
	for (let frames = 0; frames < fps * 180; frames += 1) {
		const step = walker.step(pos, dt);
		if (step.kind !== 'move') return { result: step.kind, pos, frames };
		// Như Game.update: bước không vượt quá waypoint (maxDist).
		const dist = Math.min((step.run ? 150 : 78) * dt, step.maxDist);
		slideMove(m.blocked, pos, step.x * dist, step.y * dist);
	}
	return { result: 'quá 3 phút', pos, frames: fps * 180 };
};

for (const [mapId, m] of Object.entries(maps)) {
	const { map, W, H, blocked } = m;
	const spot = (id: string) => {
		const s = m.spot(id);
		assert.ok(s, `${mapId}: thiếu địa điểm ${id}`);
		return s;
	};

	// 1) collision.ts phải y hệt va chạm cũ của MapWorld (bản chép nguyên văn trước khi tách, GRID 96).
	{
		// MapWorld chỉ dựng khối chặn cho đồ vật CÓ hình trong atlas — buildSolids không xét hình nên mọi đồ vật chặn phải có hình.
		for (const p of map.props) if (meta[p.id]?.blocks) assert.ok(atlas.frames[`human/${p.id}`], `${mapId}: đồ vật chặn ${p.id} thiếu hình trong atlas`);
		const legacy = new Map<string, Rect[]>();
		for (const p of map.props) {
			const f = meta[p.id];
			if (!f || !(f.blocks && f.footprint.w > 0)) continue;
			const r = { x0: p.x + f.footprint.x, y0: p.y + f.footprint.y, x1: p.x + f.footprint.x + f.footprint.w, y1: p.y };
			for (let gy = Math.floor(r.y0 / 96); gy <= Math.floor(r.y1 / 96); gy += 1) {
				for (let gx = Math.floor(r.x0 / 96); gx <= Math.floor(r.x1 / 96); gx += 1) {
					const key = `${gx},${gy}`;
					const list = legacy.get(key);
					if (list) list.push(r);
					else legacy.set(key, [r]);
				}
			}
		}
		const oldBlocked = (x: number, y: number, rx: number, ry: number): boolean => {
			const box = { x0: x - rx, y0: y - ry, x1: x + rx, y1: y + ry };
			if (box.x0 < 0 || box.y0 < 0 || box.x1 > W || box.y1 > H) return true;
			const t = map.tileSize;
			for (let ty = Math.floor(box.y0 / t); ty <= Math.floor(box.y1 / t); ty += 1) {
				for (let tx = Math.floor(box.x0 / t); tx <= Math.floor(box.x1 / t); tx += 1) if (map.terrain[ty]?.[tx] === 'w') return true;
			}
			for (let gy = Math.floor(box.y0 / 96); gy <= Math.floor(box.y1 / 96); gy += 1) {
				for (let gx = Math.floor(box.x0 / 96); gx <= Math.floor(box.x1 / 96); gx += 1) {
					for (const r of legacy.get(`${gx},${gy}`) ?? []) if (box.x0 < r.x1 && box.x1 > r.x0 && box.y0 < r.y1 && box.y1 > r.y0) return true;
				}
			}
			return false;
		};
		let samples = 0;
		for (const [rx, ry] of [
			[11, 5],
			[10, 6],
		] as const) {
			for (let y = -8; y <= H + 8; y += 6) {
				for (let x = -8; x <= W + 8; x += 6) {
					samples += 1;
					assert.equal(blocked(x, y, rx, ry), oldBlocked(x, y, rx, ry), `${mapId}: va chạm lệch tại ${x},${y} (${rx}×${ry})`);
				}
			}
		}
		console.log(`✔ ${mapId}: va chạm tách ra collision.ts khớp bản cũ trên ${samples} điểm`);
	}

	// 2) Lưới 24px: dựng nhanh, liền một khối theo CẠNH đã kiểm (mọi ô trống tới được từ điểm hồi sinh, trừ vài khe lẻ
	//    chỉ lọt khi không chừa lề — không bao giờ được chọn làm ô xuất phát).
	const t0 = performance.now();
	const nav = m.nav();
	const buildMs = performance.now() - t0;
	assert.equal(nav.cols * NAV_CELL, W);
	assert.equal(nav.rows * NAV_CELL, H);
	{
		const free = nav.walkable.reduce((a, b) => a + b, 0);
		const seen = new Uint8Array(nav.walkable.length);
		const queue = [nav.nearestWalkable(map.spawn.x, map.spawn.y)];
		seen[queue[0]!] = 1;
		let reached = 0;
		while (queue.length) {
			const cur = queue.pop()!;
			reached += 1;
			const cx = cur % nav.cols;
			const cy = Math.floor(cur / nav.cols);
			for (let d = 0; d < 8; d += 1) {
				const ni = nav.neighbor(cur, d);
				if (ni < 0) continue;
				// Cạnh nào cũng phải đi lọt bằng hộp chân thật — gốc cây vắt qua ranh giới hai ô (không chặn tâm ô nào) từng
				// làm lưới nối xuyên qua nó: 22 cạnh trên map thị trấn cũ, tự đi kẹt ở (2388,514).
				assert.ok(nav.visible(nav.center(cur), nav.center(ni), 0), `${mapId}: cạnh lưới ${cur}→${ni} đi xuyên vật chặn`);
				assert.equal(Math.max(Math.abs((ni % nav.cols) - cx), Math.abs(Math.floor(ni / nav.cols) - cy)), 1);
				if (seen[ni]) continue;
				seen[ni] = 1;
				queue.push(ni);
			}
		}
		// Ô trống ngoài mảng chính: KHE LẺ nếu bước chân thật lọt vào được (phải có ô xuất phát thuộc mảng chính, số ít), còn lại là
		// VÙNG KÍN chỉ để làm cảnh — lõi đá vách hang, bờ bên kia sông của Hẻm Cửa Sông (thiết kế 12 map vùng 1): người chơi không
		// bao giờ đứng ở đó nên không cần ô xuất phát.
		const walkIn = m.walkIn();
		const touchable = (i: number): boolean => {
			const c = nav.center(i);
			for (let y = c.y - NAV_CELL / 2; y < c.y + NAV_CELL / 2; y += 4) for (let x = c.x - NAV_CELL / 2; x < c.x + NAV_CELL / 2; x += 4) if (walkIn(x, y)) return true;
			return false;
		};
		const pockets: number[] = [];
		let sealed = 0;
		for (let i = 0; i < seen.length; i += 1) {
			if (!nav.walkable[i] || seen[i]) continue;
			if (touchable(i)) pockets.push(i);
			else sealed += 1;
		}
		// Rừng dày có nhiều khe giữa các gốc cây hơn thị trấn — ngưỡng theo tỉ lệ ô trống.
		const limit = Math.max(30, Math.round(free * 0.01));
		assert.ok(pockets.length <= limit, `${mapId}: lưới có ${pockets.length} ô trống bị cô lập khỏi điểm hồi sinh (ngưỡng ${limit})`);
		for (const i of pockets) {
			const c = nav.center(i);
			const st = nav.nearestWalkable(c.x, c.y);
			assert.ok(st >= 0 && seen[st], `${mapId}: đứng ở khe lẻ ${c.x},${c.y} không có ô xuất phát thuộc mảng chính`);
		}
		console.log(`✔ ${mapId}: lưới ${nav.cols}×${nav.rows} ô ${NAV_CELL}px dựng trong ${buildMs.toFixed(1)}ms, ${free} ô trống, ${reached} tới được từ điểm hồi sinh (${pockets.length} ô khe lẻ${sealed ? `, ${sealed} ô vùng kín làm cảnh` : ''}), mọi cạnh đi lọt hộp chân`);

		// 2b) Điểm sinh quái của mọi khu (quái đi bằng cùng hộp chân 11×5 với người chơi): đứng được và nằm trong vùng người chơi
		//     tới được — sinh trong chân đồ vật thì kẹt luôn (bước nào cũng còn đè chân), sinh trong vùng kín thì không ai đánh được.
		let points = 0;
		for (const z of map.monsterZones) {
			for (const p of zoneSpawnPoints(z)) {
				assert.ok(!blocked(p.x, p.y, 11, 5) && walkIn(p.x, p.y), `${mapId}: khu ${z.id} điểm sinh #${p.index} (${Math.round(p.x)},${Math.round(p.y)}) bị chặn / ngoài vùng tới được`);
				points += 1;
			}
		}
		if (points) console.log(`✔ ${mapId}: ${points} điểm sinh quái của ${map.monsterZones.length} khu đều đứng được, người chơi tới được`);
	}

	// 3) Tìm đường từ mọi chỗ xuất phát tới mọi đích người chơi có thể được dẫn tới TRÊN MAP NÀY — kể cả lối sang map.
	const goals: { name: string; target: ResolvedTarget }[] = [];
	for (const s of map.spots) goals.push({ name: `địa điểm ${s.id}`, target: { x: s.x, y: s.y, stop: s.r * 0.6, label: s.name } });
	for (const d of map.dummies) goals.push({ name: `hình nộm ${d.id}`, target: { x: d.x, y: d.y, stop: STOP_DUMMY, face: d, label: d.id } });
	for (const [key, n] of Object.entries(STORY.npcs)) {
		const s = map.spots.find((p) => p.id === n.at.spot);
		if (s) goals.push({ name: `NPC ${key}`, target: { ...npcAnchor(n.at, s, map.spawn), stop: STOP_NPC, label: key } });
	}
	if (map.boss) goals.push({ name: 'boss', target: { x: map.boss.x, y: map.boss.y, stop: STOP_BOSS, label: 'boss' } });
	for (const e of map.exits) goals.push({ name: `lối ${e.id}`, target: exitGoal(e, e.label) });
	const starts: { name: string; p: Point }[] = [{ name: 'spawn', p: map.spawn }, ...map.exits.map((e) => ({ name: `cạnh lối ${e.id}`, p: { x: (e.x0 + e.x1) / 2, y: (e.y0 + e.y1) / 2 } })).filter((s) => !blocked(s.p.x, s.p.y, 11, 5))];
	for (const id of ['home', 'plaza', 'seal_stone', 'mob_clearing']) {
		const s = m.spot(id);
		if (s) starts.push({ name: id, p: s });
	}

	// Làm nóng JIT một lượt cho số đo thời gian A* phản ánh lúc chạy thật trong game.
	for (let i = 0; i < 3; i += 1) nav.findPath(map.spawn, goals[goals.length - 1]!.target);
	let slowest = 0;
	let walks = 0;
	let walkFrames = 0;
	for (const st of starts) {
		for (const g of goals) {
			const t = performance.now();
			const path = nav.findPath(st.p, g.target);
			let ms = performance.now() - t;
			// Một mẫu lẻ vượt ngưỡng thường là GC / máy đang bận (simulate() ngay dưới sinh nhiều rác) chứ không phải A* chậm —
			// từng làm test đỏ chập chờn (10,66ms ở mossvale, các lượt khác ~7ms). Đo lại ĐÚNG lượt đó, lấy số nhỏ nhất: findPath
			// không cache kết quả nên A* chậm thật thì lần nào cũng chậm và vẫn đỏ.
			for (let k = 0; ms >= 10 && k < 3; k += 1) {
				const t2 = performance.now();
				nav.findPath(st.p, g.target);
				ms = Math.min(ms, performance.now() - t2);
			}
			slowest = Math.max(slowest, ms);
			assert.ok(path && !path.partial, `${mapId}: ${st.name} → ${g.name}: không tìm ra đường`);

			// 4) Bám đường bằng chính phép đi trượt trục của game, 60 fps: không kẹt, dừng trong bán kính.
			assert.ok(new AutoWalk(nav, () => g.target, g.target, st.p).ok, `${mapId}: ${st.name} → ${g.name}: bộ tự đi không có đường`);
			const { result, pos, frames } = simulate(m, st.p, g.target, 60);
			assert.equal(result, 'done', `${mapId}: ${st.name} → ${g.name}: tự đi kết thúc "${result}" ở ${Math.round(pos.x)},${Math.round(pos.y)}`);
			const d = Math.hypot(pos.x - g.target.x, pos.y - g.target.y);
			assert.ok(d <= g.target.stop, `${mapId}: ${st.name} → ${g.name}: dừng cách đích ${d.toFixed(1)} > ${g.target.stop}`);
			walks += 1;
			walkFrames += frames;
		}
	}
	assert.ok(slowest < 10, `${mapId}: A* chậm nhất ${slowest.toFixed(2)}ms ≥ 10ms`);
	console.log(`✔ ${mapId}: ${walks} lượt tìm đường + tự đi (${starts.length} điểm xuất phát × ${goals.length} đích) đều tới nơi, A* chậm nhất ${slowest.toFixed(2)}ms, trung bình ${(walkFrames / walks / 60).toFixed(1)}s mỗi lượt`);

	// 7) Điểm xuất phát BẤT KỲ (không phải tâm ô) × mọi đích, ở 60 fps và 10 fps (máy yếu: dt bị chặn 0,1s, chạy
	//    15px/frame — trước đây vượt waypoint rồi lắc qua lại mãi mà bộ dò kẹt không bắt được).
	{
		let seed = 20261007;
		const rnd = (): number => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
		// Chỉ điểm người chơi đứng tới được thật (vùng kín làm cảnh — lõi đá vách hang… — không ai đứng được nên không xét).
		const walkIn = m.walkIn();
		const anyPoint = (): Point => {
			for (;;) {
				const p = { x: rnd() * W, y: rnd() * H };
				if (!blocked(p.x, p.y, 11, 5) && walkIn(p.x, p.y) && nav.findPath(p, { x: map.spawn.x, y: map.spawn.y, stop: 40 })?.partial === false) return p;
			}
		};
		let n = 0;
		for (let k = 0; k < 24; k += 1) {
			const from = anyPoint();
			const target = goals[k % goals.length]!.target;
			const fps = k % 2 ? 10 : 60;
			const r = simulate(m, from, target, fps);
			assert.equal(r.result, 'done', `${mapId}: (${from.x.toFixed(0)},${from.y.toFixed(0)}) → ${target.label} (${target.x},${target.y}) ở ${fps} fps: "${r.result}" tại ${r.pos.x.toFixed(1)},${r.pos.y.toFixed(1)}`);
			n += 1;
		}
		console.log(`✔ ${mapId}: ${n} lượt tự đi từ điểm bất kỳ (60 fps và 10 fps) đều tới nơi`);
	}

}

// Phần riêng của thị trấn (chạy SAU khi mọi map đã qua phần chung).
{
	const m = maps.town!;
	const { map, blocked } = m;
	const nav = m.nav();
	const spot = (id: string) => {
		const s = m.spot(id);
		assert.ok(s, `town: thiếu địa điểm ${id}`);
		return s;
	};
	// 5) Đích đứng trên chỗ chặn (hình nộm) vẫn tới được trong bán kính dừng.
	{
		const dummy = map.dummies.find((d) => d.id === 'dummy_backyard')!;
		assert.ok(blocked(dummy.x, dummy.y, 11, 5), 'tâm hình nộm sân sau phải bị chặn (kiểm cho đúng ca khó)');
		const p = nav.findPath(map.spawn, { x: dummy.x, y: dummy.y, stop: STOP_DUMMY });
		const end = p!.points[p!.points.length - 1]!;
		assert.ok(!p!.partial && Math.hypot(end.x - dummy.x, end.y - dummy.y) <= STOP_DUMMY, 'điểm cuối phải trong 56px của hình nộm');
		assert.ok(!blocked(end.x, end.y, 11, 5), 'điểm cuối phải đứng được');
		// Xuất phát từ ô bị chặn (đứng sát hình nộm): vẫn tìm được đường đi.
		const out = nav.findPath(dummy, { ...spot('plaza'), stop: 60 });
		assert.ok(out && !out.partial, 'xuất phát trên ô chặn vẫn phải tìm ra đường');
		console.log('✔ town: đích bị chặn (hình nộm) và xuất phát trên ô chặn đều xử lý được');
	}
	// 6) Đích không tới được (giữa dòng sông, bán kính nhỏ): A* trả đường dở, bộ tự đi bỏ cuộc gọn — không lặp mãi.
	{
		const river = { x: 2232, y: 600, stop: 10, label: 'sông' };
		assert.ok(blocked(river.x, river.y, 11, 5), 'điểm thử phải nằm trên nước');
		const p = nav.findPath(spot('plaza'), river);
		assert.ok(p?.partial, 'đích giữa sông phải là đường dở');
		const pos = { ...spot('plaza') };
		const walker = new AutoWalk(nav, () => river, river, pos);
		let end = '';
		for (let f = 0; f < 60 * 120 && !end; f += 1) {
			const step = walker.step(pos, 1 / 60);
			if (step.kind !== 'move') end = step.kind;
			else slideMove(blocked, pos, (step.x * 78) / 60, (step.y * 78) / 60);
		}
		assert.equal(end, 'fail', 'đích không tới được thì phải báo thất bại');
		// Bị dịch chuyển giữa đường (hồi sinh / debug): tìm đường lại từ chỗ mới rồi vẫn tới nơi.
		const goal = { ...spot('church'), stop: 54, label: 'church' };
		const q = { ...spot('home') };
		const w2 = new AutoWalk(nav, () => goal, goal, q);
		for (let f = 0; f < 30; f += 1) {
			const s = w2.step(q, 1 / 60);
			if (s.kind === 'move') slideMove(blocked, q, (s.x * 78) / 60, (s.y * 78) / 60);
		}
		Object.assign(q, spot('bridge'));
		let done = '';
		for (let f = 0; f < 60 * 120 && !done; f += 1) {
			const s = w2.step(q, 1 / 60);
			if (s.kind !== 'move') done = s.kind;
			else slideMove(blocked, q, (s.x * 150) / 60, (s.y * 150) / 60);
		}
		assert.equal(done, 'done', 'dịch chuyển giữa đường thì tìm lại đường và vẫn tới nơi');
		console.log('✔ town: đích không tới được thì bỏ cuộc; bị dịch chuyển giữa đường thì tìm lại đường');
	}
	// Ca từng hỏng trên map gộp cũ, toạ độ còn nằm trong thị trấn: kẹt mép nhà (tâm ô sát tường 0px), lắc ở 10 fps.
	for (const [from, to, fps] of [
		[{ x: 420, y: 1452 }, { x: 516, y: 1932 }, 60],
		[{ x: 468, y: 876 }, { x: 1788, y: 1788 }, 10],
	] as const) {
		const r = simulate(m, from, { x: to.x, y: to.y, stop: 30, label: 'điểm thử' }, fps);
		assert.equal(r.result, 'done', `town: ca cũ (${from.x},${from.y}) → (${to.x},${to.y}) ở ${fps} fps: "${r.result}"`);
	}
}
// Đồ thị lối của vùng (dẫn đường nhiệm vụ đi theo `WorldIndex.nextExit` — lối khai trước được ưu tiên): town ↔ mossvale luôn MỘT
// bước (nhiệm vụ trẻ em không vòng qua Bãi Bồi). Vùng 12 map (thiết kế 10/10/2026) thì thêm số bước từ trạm đúng bản thiết kế.
{
	assert.equal(index.nextExit('town', 'mossvale')?.to, 'mossvale', 'town → mossvale đi thẳng lối đông');
	assert.equal(index.nextExit('mossvale', 'town')?.to, 'town', 'mossvale → town đi thẳng lối tây');
	if (index.data.maps.riverflats) {
		const hops = new Map<string, number>([['town', 0]]);
		const queue = ['town'];
		while (queue.length) {
			const id = queue.shift()!;
			for (const e of index.data.maps[id]!.exits) {
				if (e.to.includes('/') || hops.has(e.to)) continue;
				hops.set(e.to, hops.get(id)! + 1);
				queue.push(e.to);
			}
		}
		const byHops = (n: number) => [...hops].filter(([, h]) => h === n).map(([id]) => id).sort();
		assert.deepEqual(byHops(1), ['graveyard', 'mossvale', 'riverflats']);
		assert.deepEqual(byHops(2), ['bonehills', 'cliffs', 'mossrift', 'nameless', 'oldfort', 'rivergate', 'shrine']);
		assert.deepEqual(byHops(3), ['gargoyle_cave']);
		// Đường tắt: từ Luỹ về trạm qua rừng (2 lần chuyển map); từ gian boss Hang qua Đường hầm của Đoàn.
		assert.equal(index.nextExit('oldfort', 'town')?.to, 'mossvale');
		assert.equal(index.nextExit('gargoyle_cave', 'nameless')?.id, 'to_nameless_gc');
		console.log(`✔ đồ thị lối: town ↔ mossvale một bước; ${hops.size} map, xa nhất ${Math.max(...hops.values())} bước từ trạm`);
	} else console.log('✔ đồ thị lối: town ↔ mossvale một bước');
}
console.log('✔ nav.test');

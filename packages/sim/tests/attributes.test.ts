// Chạy: npx tsx tests/attributes.test.ts — điểm thuộc tính cộng tay (chủ dự án 11/10/2026): mỗi thuộc tính tăng MỘT chỉ số.
import assert from 'node:assert/strict';
import { addAttr, ATTR_FROM_TALENT, ATTR_INFO, ATTR_PER_LEVEL, ATTR_PER_POINT, attrBonus, attrPoints, ATTRS, attrSpent, cleanAttrs, cleanConverted, levelAttrPoints, TALENT_ATTRS } from '../src/attributes.ts';
import { pvpBuild } from '../src/pvp.ts';
import { PATHS } from '../src/skills.ts';

const near = (a: number, b: number, what: string) => assert.ok(Math.abs(a - b) < 1e-9, `${what}: ${a} ≠ ${b}`);

// 1) Điểm theo cấp: 3 điểm mỗi cấp trên cấp 1, không dừng ở cấp 40 như điểm tiềm năng.
{
	assert.deepEqual([...ATTRS], ['vit', 'spi', 'str', 'int', 'def', 'sta'], 'mã lưu chỉ được THÊM');
	assert.equal(ATTR_PER_LEVEL, 3);
	assert.deepEqual([0, 1, 2, 10, 40, 100].map((l) => attrPoints(l)), [0, 0, 3, 27, 117, 297]);
	for (const k of ATTRS) assert.ok(ATTR_INFO[k].name && ATTR_INFO[k].desc, `${k}: có tên + mô tả`);
	assert.deepEqual(ATTRS.map((k) => ATTR_INFO[k].name), ['Sinh lực', 'Linh lực', 'Sức mạnh', 'Trí tuệ', 'Đỡ đòn', 'Thể lực']);
	assert.match(ATTR_INFO.str.desc, /\+0,4% sát thương đòn kiếm/);
	assert.match(ATTR_INFO.def.desc, /\+0,4 phòng thủ/);
}

// 2) Cộng điểm, kẹp bản lưu (số lạ, âm, khoá lạ, vượt điểm của cấp — bớt từ thuộc tính CUỐI danh sách).
{
	assert.deepEqual(addAttr({}, 'vit', 2), { vit: 1 });
	assert.equal(addAttr({ vit: 3 }, 'spi', 2), null, 'cấp 2 có 3 điểm, đã tiêu hết');
	assert.equal(addAttr({}, 'bogus' as never, 40), null, 'khoá lạ');
	assert.equal(addAttr({}, 'vit', 1), null, 'cấp 1 chưa có điểm');
	assert.deepEqual(cleanAttrs({ vit: 2.7, spi: -1, bogus: 9, str: '3' }, 10), { vit: 2, str: 3 });
	assert.deepEqual(cleanAttrs({ vit: 2, str: 2, sta: 5 }, 3), { vit: 2, str: 2, sta: 2 }, 'cấp 3 = 6 điểm: Thể lực bớt 3');
	assert.deepEqual(cleanAttrs({ vit: 4, def: 4 }, 2), { vit: 3 }, 'bớt cạn thuộc tính cuối rồi tới thuộc tính trước');
	assert.deepEqual(cleanAttrs('rác', 10), {});
	assert.equal(attrSpent({ vit: 2, def: 3 }), 5);
}

// 3) Phần cộng: dồn hết một thuộc tính thì chỉ số đó tăng theo cấp cỡ gấp đôi gốc — không phá cân bằng.
{
	const b = attrBonus({ vit: 10, spi: 5, str: 20, int: 1, def: 5, sta: 3 }, 40);
	assert.deepEqual([b.hp, b.mp, b.stamina], [50, 10, 6]);
	near(b.def, 2, 'Đỡ đòn');
	near(b.sword, 1.08, 'Sức mạnh');
	near(b.magic, 1.004, 'Trí tuệ');
	const zero = attrBonus(undefined, 40);
	assert.deepEqual(zero, { hp: 0, mp: 0, def: 0, stamina: 0, sword: 1, magic: 1 });
	assert.deepEqual(attrBonus({ vit: 99 }, 2).hp, 3 * ATTR_PER_POINT.vit, 'kẹp theo cấp trước khi tính');
	const perLv = (k: 'vit' | 'spi' | 'def') => ATTR_PER_LEVEL * ATTR_PER_POINT[k];
	for (const p of ['sword', 'mage'] as const) {
		const path = PATHS[p];
		assert.ok(perLv('vit') <= path.hp[1] * 1.3, `${p}: dồn Sinh lực ≤ ~gấp đôi máu theo cấp`);
		assert.ok(perLv('spi') <= path.mp[1] * 1.6, `${p}: dồn Linh lực ≤ ~gấp đôi MP theo cấp`);
		assert.ok(perLv('def') <= path.def[1] * 1.3, `${p}: dồn Đỡ đòn ≤ ~gấp đôi phòng thủ theo cấp`);
	}
}

// 4) Điểm tiềm năng DƯ đổi sang thuộc tính (chủ dự án 11/10/2026: "dư thì cộng vào HP, MP, thể lực, phòng thủ"): 1 điểm = 3 điểm thuộc
//    tính, chỉ vào Sinh lực / Linh lực / Đỡ đòn / Thể lực; Sức mạnh + Trí tuệ vẫn chỉ lấy từ điểm theo cấp.
{
	assert.equal(ATTR_FROM_TALENT, 3);
	assert.deepEqual([...TALENT_ATTRS], ['vit', 'spi', 'def', 'sta']);
	assert.deepEqual([attrPoints(10), attrPoints(10, 2), levelAttrPoints(10)], [27, 33, 27]);
	assert.deepEqual([cleanConverted(-3), cleanConverted('4.7'), cleanConverted('x'), cleanConverted(99, 22)], [0, 4, 0, 22]);
	const full = { str: 27 };
	assert.equal(addAttr(full, 'str', 10, 5), null, 'Sức mạnh hết phần điểm theo cấp: điểm đổi không vào được');
	assert.equal(addAttr(full, 'int', 10, 5), null, 'Trí tuệ cũng vậy');
	assert.deepEqual(addAttr(full, 'vit', 10, 5), { str: 27, vit: 1 }, 'điểm đổi vào Sinh lực');
	assert.equal(addAttr({ str: 27, vit: 15 }, 'sta', 10, 5), null, '27 + 15 = 42 = 27 + 5×3: hết');
	assert.deepEqual(cleanAttrs({ str: 20, int: 20, vit: 10 }, 10, 5), { str: 20, int: 7, vit: 10 }, 'Sức mạnh + Trí tuệ kẹp về 27 (bớt Trí tuệ)');
	assert.deepEqual(cleanAttrs({ vit: 40 }, 10, 5), { vit: 40 }, '27 + 15 = 42 ≥ 40: giữ');
	assert.deepEqual(cleanAttrs({ vit: 40 }, 10, 0), { vit: 27 }, 'chưa đổi: kẹp về 27');
	assert.equal(attrBonus({ vit: 40 }, 10, 5).hp, 40 * ATTR_PER_POINT.vit);
	// Máy chủ (PvP): điểm đã đổi trừ khỏi cây, cộng vào thuộc tính; số đổi vượt điểm có thì kẹp.
	const story = { unlocked: ['staff', 'fire'], path: 'mage', talents: { fire: 9 }, attrs: { vit: 117 + 66 }, attrTalent: 22 };
	const b = pvpBuild(40, story);
	assert.equal(b.tiers.fire, 9, 'Hoả 9 (25 điểm) + 22 đã đổi = 47 điểm cấp 40');
	const over = pvpBuild(40, { ...story, attrTalent: 30 });
	assert.ok((over.tiers.fire ?? 0) < 9, 'đổi 30 thì cây chỉ còn 17 điểm — Hoả bị cắt');
}

console.log('✔ attributes.test (sim): phần luật');

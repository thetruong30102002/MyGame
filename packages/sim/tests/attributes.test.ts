// Chạy: npx tsx tests/attributes.test.ts — điểm thuộc tính cộng tay (chủ dự án 11/10/2026): mỗi thuộc tính tăng MỘT chỉ số.
import assert from 'node:assert/strict';
import { addAttr, ATTR_INFO, ATTR_PER_LEVEL, ATTR_PER_POINT, attrBonus, attrPoints, ATTRS, attrSpent, cleanAttrs } from '../src/attributes.ts';
import { PATHS } from '../src/skills.ts';

const near = (a: number, b: number, what: string) => assert.ok(Math.abs(a - b) < 1e-9, `${what}: ${a} ≠ ${b}`);

// 1) Điểm theo cấp: 3 điểm mỗi cấp trên cấp 1, không dừng ở cấp 40 như điểm tiềm năng.
{
	assert.deepEqual([...ATTRS], ['vit', 'spi', 'str', 'int', 'def', 'sta'], 'mã lưu chỉ được THÊM');
	assert.equal(ATTR_PER_LEVEL, 3);
	assert.deepEqual([0, 1, 2, 10, 40, 100].map(attrPoints), [0, 0, 3, 27, 117, 297]);
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

console.log('✔ attributes.test (sim): phần luật');

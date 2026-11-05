/**
 * Ảnh tab "Nhân vật & class" trang admin cho bộ cỡ NPC 8 hướng (chủ dự án 05/11 "sửa web admin" → cập nhật tab Nhân vật): mỗi mẫu 3 tấm
 * đứng / đi / chạy — hàng = 8 hướng, cột = khung — cắt nguyên pixel từ CHÍNH atlas game `assets/characters/player_npc_*` (không vẽ mới,
 * không co / phóng). Ghi `apps/server/site/media/roster-npc/<id>/<động tác>.webp` (WebP KHÔNG mất dữ liệu — bằng PNG từng pixel, nhẹ ~5 lần;
 * mã hoá bằng Pillow, cần `python` có Pillow) + `apps/server/site/roster-npc.json`. Trang công khai vẫn
 * dùng `site/roster.json` cũ tới khi phát bản game có bộ mới.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { readPng, writePng, createImage, crop, blit, opaqueBounds, type RGBAImage } from '../packages/asset-pipeline/src/image/rgba.js';

const CELL = 160;
// Khung cắt chung mọi mẫu trong ô 160 (gốc chân 80,144): đủ đầu trượng / mũi thương nhô trên đỉnh đầu và khiên ở tay.
const BOX = { x: 24, y: 24, w: 112, h: 128 };
const DIRS = ['S', 'SE', 'E', 'NE', 'N', 'NW', 'W', 'SW'];
const STATES = [
	['idle', 'Đứng'],
	['walk', 'Đi'],
	['run', 'Chạy'],
] as const;
const ROLES = [
	{ id: 'sword', name: 'Kiếm sĩ', weapon: 'Kiếm', description: 'Áo chẽn đỏ sẫm, dây chéo ngực, kiếm dài đeo chéo lưng — nhìn ngang dựng dọc sau lưng.' },
	{ id: 'staff', name: 'Pháp sư', weapon: 'Trượng', description: 'Áo choàng xanh viền vàng như NPC mẫu, trượng pha lê đeo chéo lưng.' },
	{ id: 'spear', name: 'Thương thủ', weapon: 'Thương', description: 'Giáp da vàng nâu, thương mũi thép tua đỏ cán gỗ nâu đeo chéo lưng.' },
	{ id: 'bow', name: 'Cung thủ', weapon: 'Cung', description: 'Áo da nâu, áo lót xanh rêu, cung gỗ đeo chéo lưng.' },
	{ id: 'shield', name: 'Hộ vệ', weapon: 'Khiên', description: 'Giáp thép nhẹ, khiên tròn một mặt luôn gắn cẳng tay trái.' },
];

// Trang Thế giới chỉ xem đại diện theo tộc (chủ dự án 05/11: "không cần cho xem hết các nhân vật, đại diện thôi, xem tộc hệ là được").
const RACES = [
	{ id: 'human', name: 'Nhân tộc', description: 'Người thường của Haven — đủ màu tóc, hợp mọi con đường.' },
	{ id: 'elf', name: 'Elf', description: 'Tai dài nhọn, nét mặt thanh, tóc sáng màu.' },
	{ id: 'demon', name: 'Ma tộc', description: 'Sừng nhỏ trên đầu, tóc rực hoặc sẫm màu.' },
	{ id: 'beast', name: 'Thú nhân', description: 'Đôi tai thú trên đầu, không có đuôi.' },
	{ id: 'dragon', name: 'Long tộc', description: 'Hình người, sừng nhỏ và vảy ở thái dương.' },
];
const catalog = JSON.parse(readFileSync('assets/player-roster/npc-v1/catalog.json', 'utf8')) as { characters: Array<{ id: string; displayName: string; classId: string; gender: string; raceId: string; raceLabel: string; variant: number }> };
const manifest = JSON.parse(readFileSync('assets/manifest.json', 'utf8'));
const out = 'apps/server/site/media/roster-npc';
rmSync(out, { recursive: true, force: true });
const characters: unknown[] = [];
let overflow = 0;
// Xếp theo tộc rồi số đầu (lưới admin / trang Thế giới: Nhân tộc 1–3, Elf 1–3, …).
const RACE_ORDER = RACES.map((r) => r.id);
const ordered = [...catalog.characters].sort((a, b) => RACE_ORDER.indexOf(a.raceId) - RACE_ORDER.indexOf(b.raceId) || a.variant - b.variant);
for (const c of ordered) {
	const base = join('assets/characters', c.id, c.id);
	const atlas = JSON.parse(readFileSync(base + '.json', 'utf8'));
	const sheet = readPng(base + '.png');
	const cellOf = (name: string): RGBAImage => {
		const f = atlas.frames[name];
		const im = createImage(CELL, CELL);
		blit(im, crop(sheet, f.frame.x, f.frame.y, f.frame.w, f.frame.h), f.spriteSourceSize.x, f.spriteSourceSize.y);
		const b = opaqueBounds(im)!;
		if (b.x0 < BOX.x || b.y0 < BOX.y || b.x1 > BOX.x + BOX.w || b.y1 > BOX.y + BOX.h) overflow += 1;
		return crop(im, BOX.x, BOX.y, BOX.w, BOX.h);
	};
	mkdirSync(join(out, c.id), { recursive: true });
	const sheets: Record<string, string> = {};
	for (const [state] of STATES) {
		const rows = DIRS.map((d) => (atlas.animations[`${state}_${d}`] as string[]).map(cellOf));
		const n = rows[0]!.length;
		const img = createImage(BOX.w * n, BOX.h * DIRS.length);
		rows.forEach((row, r) => row.forEach((cell, k) => blit(img, cell, k * BOX.w, r * BOX.h)));
		writePng(join(out, c.id, state + '.png'), img);
		// Ảnh đứng nhìn trước (trang chủ: banner + ô giới thiệu class).
		if (state === 'idle') writePng(join(out, c.id, 'S.png'), rows[0]![0]!);
		sheets[state] = `site/media/roster-npc/${c.id}/${state}.webp`;
	}
	characters.push({ id: c.id, name: c.displayName, role: c.classId, gender: c.gender, race: c.raceId, raceLabel: c.raceLabel, variant: c.variant, sheets });
}
// PNG → WebP lossless (kiểm bằng từng pixel rồi xoá PNG).
execFileSync('python', ['-c', `
import glob, os
from PIL import Image
for p in glob.glob(${JSON.stringify(out)} + '/*/*.png'):
    im = Image.open(p).convert('RGBA'); w = p[:-4] + '.webp'
    im.save(w, 'WEBP', lossless=True, method=6)
    assert Image.open(w).convert('RGBA').tobytes() == im.tobytes(), w
    os.remove(p)
`], { stdio: 'inherit' });
if (overflow) throw new Error(`${overflow} khung tràn khung cắt ${JSON.stringify(BOX)} — nới BOX`);
const first = manifest.characters[catalog.characters[0]!.id].animations;
const states = STATES.map(([id, label]) => ({ id, label, frames: first[id].frames, ms: Math.round(1000 / first[id].fps) }));
writeFileSync(
	'apps/server/site/roster-npc.json',
	JSON.stringify({ notice: 'Ảnh cắt nguyên pixel từ atlas game (bộ cỡ NPC 8 hướng, 05/11). Đòn đánh đang tạm dùng dáng đứng; vũ khí đeo lưng, khiên gắn tay.', cell: [BOX.w, BOX.h], directions: DIRS, states, roles: ROLES, races: RACES, characters }, null, 1) + '\n',
);
console.log(`Ảnh admin: ${characters.length} mẫu × ${STATES.length} động tác × 8 hướng → ${out}`);

// Chọn khung đã duyệt của một động tác vẽ bằng `pixellab animimg`:
//   tsx src/pixellab/pickExtra.ts <id> <tên>[:<tên đích>] <hướng PixelLab> <i,j,k…> ["ghi chú"]
// `attack-b-img:attack-img`: lấy từ bản vẽ thử `attack-b-img` nhưng cài vào tên `attack-img` mà spec đang đọc.
// Nguồn: sources/pixellab/<id>/extra-raw/<tên>/<hướng>/frame_XXX.png (ảnh 0 = ảnh xoay đầu vào).
// Đích:  sources/pixellab/<id>/extra/<tên>/<hướng>/frame_000.png… đánh số lại + pick.json (khung nào, vì sao).
// PixelLabSource đọc `extra/` như một animation thường (xem `animationFiles`).
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PL_SOURCES = join(dirname(fileURLToPath(import.meta.url)), '../../sources/pixellab');

const [id, names, dir, list, note] = process.argv.slice(2);
if (!id || !names || !dir || !list) throw new Error('Cách dùng: pickExtra.ts <id> <tên>[:<tên đích>] <hướng> <i,j,k…> ["ghi chú"]');
const [name, target = name] = names.split(':') as [string, string?];
const raw = join(PL_SOURCES, id, 'extra-raw', name, dir);
const out = join(PL_SOURCES, id, 'extra', target, dir);
const picks = list.split(',').map(Number);
const missing = picks.filter((i) => !Number.isInteger(i) || !existsSync(join(raw, `frame_${String(i).padStart(3, '0')}.png`)));
if (missing.length) throw new Error(`Không có khung ${missing.join(', ')} trong ${raw}`);
if (existsSync(out)) for (const f of readdirSync(out)) rmSync(join(out, f));
mkdirSync(out, { recursive: true });
picks.forEach((i, k) => copyFileSync(join(raw, `frame_${String(i).padStart(3, '0')}.png`), join(out, `frame_${String(k).padStart(3, '0')}.png`)));
writeFileSync(join(out, 'pick.json'), `${JSON.stringify({ from: `extra-raw/${name}/${dir}`, frames: picks, note: note ?? null }, null, '\t')}\n`);
console.log(`✔ ${id} ${name}/${dir}: khung ${picks.join(',')} → ${out}`);

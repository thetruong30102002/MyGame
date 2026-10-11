// Xuất dữ liệu HÌNH của client web (bảng hình tạm từng chiêu) sang JSON cho Unity — cùng ý export-sim-data: một nguồn sự thật
// trong lúc chuyển. Chạy: npx tsx UnityGame/Tools~/export-client-data.mts
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TEMP_ART } from './data/tempArt.ts';
import { STORY } from '../../packages/sim/src/story/story.ts';

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, '..', 'Assets', 'Aether', 'Data', 'Client');
mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'tempArt.json'), `${JSON.stringify({ TEMP_ART }, null, '\t')}\n`);
console.log(`tempArt.json: ${Object.keys(TEMP_ART).length} mục`);
// NPC theo điểm hẹn của map (cốt truyện + dịch vụ: cột dịch chuyển, Bia Danh Vọng, lữ khách) + hình người chơi theo tuổi.
writeFileSync(join(out, 'npcs.json'), `${JSON.stringify({ NPCS: STORY.npcs, PLAYER_BY_AGE: STORY.playerByAge }, null, '	')}
`);
console.log(`npcs.json: ${Object.keys(STORY.npcs).length} NPC`);

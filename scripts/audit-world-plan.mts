// Chụp hiện trạng dữ liệu vùng cho kế hoạch thế giới; không sửa tài nguyên game.
import { mkdirSync, writeFileSync } from 'node:fs';
import { REGIONS } from '../packages/sim/src/regions.ts';
mkdirSync('.aether-stage/world-renewal', { recursive: true });
writeFileSync('.aether-stage/world-renewal/regions.json', JSON.stringify(REGIONS, null, 2));

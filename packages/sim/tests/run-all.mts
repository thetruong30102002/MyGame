// Chạy lần lượt mọi tests/*.test.ts của @havenlord/sim trong một tiến trình (`npm test -w @havenlord/sim`). Test nào ném lỗi là dừng.
import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
for (const f of readdirSync(dir).filter((n) => n.endsWith('.test.ts')).sort()) await import(pathToFileURL(join(dir, f)).href);

// Xuất MỌI hằng số dữ liệu của packages/sim (chiêu, quái, cây tiềm năng, đồ, vùng, cửa hàng, nhiệm vụ…) ra JSON cho Unity đọc
// (Assets/Aether/Data/Sim/<module>.json). Bản TS vẫn là NGUỒN DUY NHẤT trong thời gian chuyển: sửa luật/dữ liệu ở sim rồi chạy lại:
//   npx tsx UnityGame/Tools~/export-sim-data.mts      (ở gốc repo)
// Hàm bị bỏ qua (luật viết lại bằng C#, đối chiếu bằng test vector — xem export-test-vectors.mts).
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SIM = join(ROOT, 'packages/sim/src');
const OUT = join(ROOT, 'UnityGame/Assets/Aether/Data/Sim');
mkdirSync(OUT, { recursive: true });

/**
 * Bỏ hàm, giữ dữ liệu thuần; Set → mảng, Map → object. `seen` chỉ giữ các object TỔ TIÊN (chặn vòng lặp): object dùng chung ở nhiều
 * chỗ (vd `W` — cột dịch chuyển của mọi vùng `planned` trong regions.ts) vẫn xuất đủ ở từng chỗ, không bị rơi mất từ lần thứ hai.
 */
function plain(v: unknown, seen = new WeakSet<object>()): unknown {
	if (typeof v === 'function' || typeof v === 'symbol') return undefined;
	if (v === null || typeof v !== 'object') return typeof v === 'number' && !Number.isFinite(v) ? String(v) : v;
	if (seen.has(v)) return undefined;
	seen.add(v);
	try {
		if (v instanceof Set) return [...v].map((x) => plain(x, seen));
		if (v instanceof Map) return Object.fromEntries([...v].map(([k, x]) => [String(k), plain(x, seen)]));
		if (Array.isArray(v)) return v.map((x) => plain(x, seen));
		const o: Record<string, unknown> = {};
		for (const [k, x] of Object.entries(v)) {
			const p = plain(x, seen);
			if (p !== undefined) o[k] = p;
		}
		return o;
	} finally {
		seen.delete(v);
	}
}

const files = [...readdirSync(SIM).map((f) => join(SIM, f)), ...readdirSync(join(SIM, 'story')).map((f) => join(SIM, 'story', f))].filter((f) => f.endsWith('.ts'));
let total = 0;
for (const f of files) {
	const mod = (await import(pathToFileURL(f).href)) as Record<string, unknown>;
	const data: Record<string, unknown> = {};
	for (const [name, value] of Object.entries(mod)) {
		const p = plain(value);
		if (p !== undefined) data[name] = p;
	}
	if (!Object.keys(data).length) continue;
	// "story/childhood.ts" → "story.childhood"
	const name = relative(SIM, f).split(/[\\/]/).join('.').replace(/\.ts$/, '');
	writeFileSync(join(OUT, `${name}.json`), `${JSON.stringify(data, null, '\t')}\n`);
	total += Object.keys(data).length;
	console.log(`  ${name}: ${Object.keys(data).length} hằng`);
}
console.log(`✔ ${total} hằng → ${OUT}`);

// Cập nhật RIÊNG phần `worldDesign.topology` (số map, cổng) trong kế hoạch admin sau khi dựng lại map — không đụng phần khác của kế hoạch.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { REGIONS } from '../packages/sim/src/regions.ts';
import { auditWorldConnections, type WorldLinkMap } from '../packages/sim/src/worldConnections.ts';

const root = resolve('.');
const maps: WorldLinkMap[] = [];
for (const r of REGIONS) {
	const folder = join(root, 'assets/maps', r.id);
	const index = JSON.parse(readFileSync(join(folder, 'world.json'), 'utf8'));
	for (const id of Object.keys(index.maps)) maps.push({ ...JSON.parse(readFileSync(join(folder, id + '.json'), 'utf8')), key: r.id + '/' + id });
}
const topology = auditWorldConnections(maps);
if (topology.errors.length || topology.unreachable.length) throw Error('Cổng thế giới chưa hợp lệ: ' + JSON.stringify({ errors: topology.errors, unreachable: topology.unreachable }));
const planPath = join(root, 'docs/ke-hoach-nang-cap-the-gioi.md');
const markdown = readFileSync(planPath, 'utf8');
const result = markdown.replace(/(<!-- havenlord-plan:start -->\s*```json\s*)([\s\S]*?)(\s*```\s*<!-- havenlord-plan:end -->)/, (_, a, body, b) => {
	const plan = JSON.parse(body);
	plan.worldDesign.topology = topology;
	return a + JSON.stringify(plan, null, 2) + b;
});
writeFileSync(planPath, result);
console.log(`topology: ${topology.mapCount} map, ${topology.connections.length} kết nối vùng`);

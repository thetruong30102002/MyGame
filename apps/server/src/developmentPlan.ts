// File kế hoạch là nguồn % duy nhất; API chỉ đọc và yêu cầu quyền admin.
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
export const PLAN_FILE = fileURLToPath(new URL('../../../docs/ke-hoach-nang-cap-the-gioi.md', import.meta.url));
export interface PlanStep { label: string; weight: number; done: boolean; evidence: string }
export interface PlanTask { id: string; group: string; name: string; detail: string; weight: number; phase: number; region: string | null; depends: string[]; steps: PlanStep[]; blocker?: string; requiresNewArt?: boolean; priority?: 1 | 2 | 3 }
export interface DevelopmentPlan {
	version: number; updated: string; title: string; scope: string; method: string; groups: string[]; tasks: PlanTask[];
	totals: { regions: number; maps: number; bosses: number; lowFrameBosses: number; renderedMinimaps: number };
	regions: Record<string, unknown>[]; bosses: Record<string, unknown>[];
}
export function taskProgress(t: PlanTask): number { return t.steps.reduce((n,s) => n + (s.done ? s.weight : 0), 0); }
export function planProgress(tasks: PlanTask[]): number {
	const weight = tasks.reduce((n,t) => n+t.weight,0);
	return weight ? Math.round(tasks.reduce((n,t) => n+taskProgress(t)*t.weight,0)/weight*10)/10 : 0;
}
export function parsePlan(markdown: string): DevelopmentPlan {
	// Dấu khối nhận cả tên cũ `aether-plan` (trước đổi tên dự án 28/10/2026) để file kế hoạch đọc được bằng máy chủ bản cũ lẫn mới.
	const block = markdown.match(/<!-- (?:havenlord|aether)-plan:start -->\s*```json\s*([\s\S]*?)\s*```\s*<!-- (?:havenlord|aether)-plan:end -->/);
	if (!block) throw new Error('Kế hoạch thiếu khối tiến độ');
	const p = JSON.parse(block[1]!) as DevelopmentPlan;
	if (p.version !== 1 || !Array.isArray(p.tasks) || !p.tasks.length || !Array.isArray(p.groups)) throw new Error('Kế hoạch sai định dạng');
	const ids = new Set<string>();
	for (const t of p.tasks) {
		if (!t.id || ids.has(t.id) || !p.groups.includes(t.group) || !Number.isFinite(t.weight) || t.weight <= 0 || !Array.isArray(t.steps) || !t.steps.length) throw new Error('Đầu việc không hợp lệ: '+t.id);
		ids.add(t.id);
		if (t.priority !== undefined && ![1,2,3].includes(t.priority)) throw new Error('Mức ưu tiên không hợp lệ: '+t.id);
		if (t.steps.some(s => !Number.isFinite(s.weight) || s.weight <= 0 || typeof s.done !== 'boolean' || (s.done && !s.evidence?.trim())) || t.steps.reduce((n,s) => n+s.weight,0) !== 100) throw new Error('Mốc tiến độ không hợp lệ: '+t.id);
	}
	for (const t of p.tasks) if (!Array.isArray(t.depends) || t.depends.some(id => !ids.has(id) || id === t.id)) throw new Error('Phụ thuộc không hợp lệ: '+t.id);
	return p;
}
export function readDevelopmentPlan() {
	const markdown = readFileSync(PLAN_FILE,'utf8');
	const plan = parsePlan(markdown);
	return {...plan, progress:planProgress(plan.tasks),
		groups:plan.groups.map(name => ({name,progress:planProgress(plan.tasks.filter(t=>t.group===name)),count:plan.tasks.filter(t=>t.group===name).length})),
		tasks:plan.tasks.map(t=>({...t,progress:taskProgress(t)})),markdown,
		modified:statSync(PLAN_FILE).mtime.toISOString(),filename:'ke-hoach-nang-cap-the-gioi.md'};
}

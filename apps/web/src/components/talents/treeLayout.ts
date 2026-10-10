/**
 * Bố cục cây Tiềm năng dạng lưới cột (đặc tả cây 08/10/2026, mục 1.2) — HÀM THUẦN: nhận `TalentsView` của store, trả nút
 * (toạ độ tâm + hình + trạng thái), đoạn nối và kích thước lưới. Không đụng DOM nên test bằng `npx tsx` được.
 *
 * Cột: thước mốc · nhóm Kiếm 3 cột (Kiếm Thần, Thủy Thần, Bắc Thần) · 5 nguyên tố theo `BRANCHES`. Kiếm mốc 1–2 nằm ở tâm
 * nhóm Kiếm rồi rẽ vuông góc xuống 3 lưu phái ở mốc 3. Kiếm pháp nguyên tố là 5 nút thoi trong dải giữa mốc 5 và 6, lệch
 * trái nửa cột nguyên tố (không đè đường dọc), nối bằng nhánh ngang ngắn.
 * Toạ độ tính cho CẢ lưới (gồm dải đầu cột cao `head` ở trên cùng); mọi số làm tròn nguyên để nét pixel không nhoè.
 */
import { BRANCHES, STYLE_TIER, SWORD_ART_TIER, SWORD_STYLES } from '../../game/combat/talents';
import type { BranchId, EnchantId, SwordStyleId, SwordStyleView, TalentBranchView, TalentNodeView, TalentsView } from '../../store/useGameStore';

export interface TreeParams {
	/** Bề ngang thước số mốc bên trái. */
	ruler: number;
	/** Bề ngang mỗi cột lưu phái Kiếm (×3) và mỗi cột nguyên tố (×5). */
	swordCol: number;
	elemCol: number;
	/** Khoảng cách tâm hai mốc liền nhau; cộng thêm `forkBand` trước mốc 3 (rẽ lưu phái) và `artBand` trước mốc 6 (kiếm pháp). */
	step: number;
	forkBand: number;
	artBand: number;
	/** Cao dải đầu cột (dính trên cùng khi cuộn). */
	head: number;
	/** Cỡ nút: chủ động (vuông) · bị động (tròn) · tuyệt kỹ mốc 10 · kiếm pháp (thoi, cạnh trước khi xoay). */
	act: number;
	pas: number;
	ult: number;
	art: number;
}

/** Máy tính: 20 | 3×64 | 5×50 = 462. */
/**
 * Màn rộng (bảng Hành trang 1040px, cửa sổ ≥ 1100 × 700 — 08/10/2026 chủ dự án chê cây "dính nhau, xấu"): 24 | 3×88 | 5×68
 * = 628. Nút to hơn ~20%, nhịp dọc 58 cho chip giá / nhãn lưu phái có chỗ thở, không đè lên nút hàng trên. Đầu cột 68: icon, tên,
 * mốc + thưởng chiều sâu và thanh tiến độ màu hệ (làm lại 09/10/2026).
 */
export const TREE_WIDE: TreeParams = { ruler: 24, swordCol: 88, elemCol: 68, step: 58, forkBand: 44, artBand: 40, head: 68, act: 46, pas: 38, ult: 50, art: 32 };
export const TREE_DESKTOP: TreeParams = { ruler: 20, swordCol: 64, elemCol: 50, step: 42, forkBand: 36, artBand: 34, head: 52, act: 38, pas: 30, ult: 40, art: 26 };
/**
 * Điện thoại dọc: 13 | 3×36 | 5×38 = 311. Lòng tab (nội dung) = bề ngang màn − 64 (lề lớp phủ 6 + viền khung 18 + lề tab
 * 8, mỗi bên): 311 ở 375px — còn khung lưới tự thêm viền 2px mỗi bên (`TREE_FRAME`), nên màn hẹp hơn dùng `fitPhoneTree`.
 */
export const TREE_PHONE: TreeParams = { ruler: 13, swordCol: 36, elemCol: 38, step: 34, forkBand: 12, artBand: 24, head: 40, act: 28, pas: 22, ult: 30, art: 20 };

/** Bề ngang viền khung lưới (2px mỗi bên) — khung ngoài = `width + TREE_FRAME`. */
export const TREE_FRAME = 4;
/** Cột hẹp nhất còn dựng được (màn 320px: lòng tab 256 − viền 4 = 252 → 12 + 8×30). */
const MIN_COL = 28;

/**
 * Điện thoại dọc: co bộ thông số cho VỪA `avail` (bề ngang dành cho lưới = lòng tab đo thật − `TREE_FRAME`). Tab cuộn dọc
 * và lớp phủ `touch-none` nên lưới tràn ngang là mất hẳn cột Thổ mà không vuốt ngang được (máy 360 / 320px). Đủ chỗ thì
 * trả đúng `TREE_PHONE`. Hẹp hơn: thước 12, cột đều nhau, nút co theo cột hẹp nhất (chừa ≥ 6px giữa hai nút kề nhau);
 * nhịp dọc giữ nguyên.
 */
export function fitPhoneTree(avail: number): TreeParams {
	const base = TREE_PHONE;
	if (!(avail > 0) || avail >= base.ruler + base.swordCol * 3 + base.elemCol * 5) return base;
	const ruler = 12;
	const col = Math.max(MIN_COL, Math.floor((avail - ruler) / 8));
	const swordCol = Math.min(base.swordCol, col);
	const elemCol = Math.min(base.elemCol, Math.max(col, Math.floor((avail - ruler - swordCol * 3) / 5)));
	// Cỡ nút CHẴN: nửa cỡ là số nguyên → nút đặt ở toạ độ nguyên, nét pixel không nhoè.
	const act = Math.min(base.act, 2 * Math.floor((Math.min(swordCol, elemCol) - 6) / 2));
	return { ...base, ruler, swordCol, elemCol, act, pas: act - 6, ult: act + 2, art: act - 8 };
}
/**
 * Màn thấp (điện thoại xoay ngang): 16 | 3×52 | 5×44 = 392. Dải rẽ lưu phái 32 / dải kiếm pháp 24 theo mock màn ngang
 * (`talents-landscape`) — đủ chỗ cho nhãn lưu phái 2 dòng, đặc tả ghi 20 / 26 thì nhãn đè lên nút mốc 3.
 */
export const TREE_LOW: TreeParams = { ruler: 16, swordCol: 52, elemCol: 44, step: 34, forkBand: 32, artBand: 24, head: 36, act: 30, pas: 24, ult: 32, art: 22 };

export type NodeState = 'reached' | 'next' | 'next-poor' | 'future' | 'soon' | 'dim' | 'locked';
export type NodeShape = 'act' | 'pas' | 'ult' | 'art';

export interface LaidNode {
	/** `sword:1` · `sword:kiem_than:5` · `fire:6` · `art:fire`. */
	key: string;
	branch: BranchId;
	style?: SwordStyleId;
	/** Kiếm pháp: nguyên tố của nó (nút thuộc nhánh Kiếm, mốc `SWORD_ART_TIER`). */
	art?: EnchantId;
	tier: number;
	x: number;
	y: number;
	/** Cạnh hộp nút (thoi: cạnh TRƯỚC khi xoay 45°). */
	size: number;
	shape: NodeShape;
	state: NodeState;
	/** Giá lên mốc này từ mốc trước (chip "3đ"); kiếm pháp = 0 (tự học, không mua). */
	cost: number;
}

export type EdgeKind = 'lit' | 'next' | 'off' | 'soon' | 'dim';

export interface LaidEdge {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
	kind: EdgeKind;
	/** Khoá nút hai đầu (tô lộ trình tới nút ở xa). */
	from: string;
	to: string;
}

export interface TreeColumn {
	/** 'sword' = cả nhóm Kiếm 3 cột. */
	branch: BranchId;
	x: number;
	w: number;
}

export interface TreeLayout {
	nodes: LaidNode[];
	edges: LaidEdge[];
	width: number;
	height: number;
	/** Tâm dọc của mốc 1..10 (chỉ số 0 bỏ trống). */
	rows: number[];
	/** Đường ngang rẽ lưu phái + tâm nhãn lưu phái + dải kiếm pháp. */
	forkY: number;
	forkLabelY: number;
	artY: number;
	/** Cột đầu (nhóm Kiếm + 5 nguyên tố) để vẽ dải đầu cột. */
	columns: TreeColumn[];
	/** x tâm từng lưu phái (thứ tự `SWORD_STYLES`) và tâm nhóm Kiếm mốc 1–2. */
	styleX: number[];
	swordX: number;
}

export const ELEMENTS: readonly EnchantId[] = BRANCHES.filter((b): b is EnchantId => b !== 'sword');
export const MAX_TREE_TIER = 10;

/** Khoá nút: dùng chung cho lưới, cột bên, danh sách "Học được ngay" và chế độ Từng nhánh. */
export const nodeKey = (branch: BranchId, tier: number): string => `${branch}:${tier}`;
export const styleKey = (style: SwordStyleId, tier: number): string => `sword:${style}:${tier}`;
export const artKey = (e: EnchantId): string => `art:${e}`;

export interface ParsedKey {
	branch: BranchId;
	tier: number;
	style?: SwordStyleId;
	art?: EnchantId;
}

export function parseKey(key: string): ParsedKey | null {
	const p = key.split(':');
	if (p[0] === 'art' && ELEMENTS.includes(p[1] as EnchantId)) return { branch: 'sword', tier: SWORD_ART_TIER, art: p[1] as EnchantId };
	if (p.length === 3 && p[0] === 'sword' && SWORD_STYLES.includes(p[1] as SwordStyleId)) return { branch: 'sword', style: p[1] as SwordStyleId, tier: Number(p[2]) };
	if (p.length === 2 && BRANCHES.includes(p[0] as BranchId)) return { branch: p[0] as BranchId, tier: Number(p[1]) };
	return null;
}

const styleTierOf = (b: TalentBranchView): number => b.styleTier ?? STYLE_TIER;

/** Trạng thái một mốc của nhánh thường (hoặc Kiếm mốc 1–2, hoặc mốc của lưu phái ĐANG THEO). */
function plainState(b: TalentBranchView, n: TalentNodeView, unspent: number): NodeState {
	if (!b.unlocked) return 'locked';
	if (!n.ready) return 'soon';
	if (n.tier <= b.tier) return 'reached';
	if (n.tier === b.tier + 1 && b.nextCost !== null) return unspent >= b.nextCost ? 'next' : 'next-poor';
	return 'future';
}

/**
 * Mốc 3–10 của một lưu phái: đã chọn lưu phái khác → mờ (dim). Chưa chọn và Kiếm đang ở mốc 2 → CẢ BA nút mốc 3 đều là
 * nấc kế (chọn một trong ba).
 */
function styleState(b: TalentBranchView, s: SwordStyleView, n: TalentNodeView, unspent: number): NodeState {
	if (!b.unlocked) return 'locked';
	if (b.style && !s.chosen) return 'dim';
	if (b.style) return plainState(b, n, unspent);
	if (!n.ready) return 'soon';
	if (n.tier === styleTierOf(b) && b.tier === styleTierOf(b) - 1 && b.nextCost !== null) return unspent >= b.nextCost ? 'next' : 'next-poor';
	return 'future';
}

/** Loại đoạn nối giữa hai nút liền nhau (a ở trên, b ở dưới). */
export function edgeKind(a: NodeState, b: NodeState): EdgeKind {
	if (a === 'dim' || b === 'dim' || a === 'locked' || b === 'locked') return 'dim';
	if (b === 'soon') return 'soon';
	if (a === 'reached' && b === 'reached') return 'lit';
	if (a === 'reached' && (b === 'next' || b === 'next-poor')) return 'next';
	return 'off';
}

const shapeOf = (n: TalentNodeView): NodeShape => (n.tier >= MAX_TREE_TIER ? 'ult' : n.kind === 'active' ? 'act' : 'pas');
const sizeOf = (p: TreeParams, s: NodeShape): number => p[s];

/** Nửa đường chéo của nút thoi (cạnh `art` xoay 45°) — phần nhô ra hai bên tâm. */
export const artHalfDiagonal = (p: TreeParams): number => Math.round(p.art / Math.SQRT2);

export function layoutTree(p: TreeParams, t: TalentsView): TreeLayout {
	const R = Math.round;
	const swordW = p.swordCol * 3;
	const width = p.ruler + swordW + p.elemCol * ELEMENTS.length;
	const swordX = R(p.ruler + p.swordCol * 1.5);
	const styleX = SWORD_STYLES.map((_, i) => R(p.ruler + p.swordCol * (i + 0.5)));
	const elemX = (j: number): number => R(p.ruler + swordW + p.elemCol * (j + 0.5));

	const rows: number[] = [0];
	rows[1] = R(p.head + 6 + p.act / 2);
	for (let tier = 2; tier <= MAX_TREE_TIER; tier += 1) rows[tier] = rows[tier - 1]! + p.step + (tier === 3 ? p.forkBand : 0) + (tier === 6 ? p.artBand : 0);
	const height = R(rows[MAX_TREE_TIER]! + p.ult / 2 + 16);
	const artY = R((rows[5]! + rows[6]!) / 2);

	const nodes: LaidNode[] = [];
	const edges: LaidEdge[] = [];
	const byKey = new Map<string, LaidNode>();
	const add = (n: LaidNode): LaidNode => {
		nodes.push(n);
		byKey.set(n.key, n);
		return n;
	};
	const top = (n: LaidNode): number => n.y - R(n.size / 2);
	const bottom = (n: LaidNode): number => n.y + R(n.size / 2);
	const vertical = (a: LaidNode, b: LaidNode): void => {
		edges.push({ x1: a.x, y1: bottom(a), x2: b.x, y2: top(b), kind: edgeKind(a.state, b.state), from: a.key, to: b.key });
	};
	const unspent = t.unspent;
	const branch = (id: BranchId): TalentBranchView | undefined => t.branches.find((b) => b.branch === id);

	// ——— Kiếm: mốc 1–2 ở tâm nhóm, rẽ 3 lưu phái từ mốc 3 ———
	const sword = branch('sword');
	let forkY = 0;
	let forkLabelY = 0;
	if (sword) {
		const st = styleTierOf(sword);
		const shared = sword.nodes
			.filter((n) => n.tier < st)
			.map((n) => {
				const shape = shapeOf(n);
				return add({ key: nodeKey('sword', n.tier), branch: 'sword', tier: n.tier, x: swordX, y: rows[n.tier]!, size: sizeOf(p, shape), shape, state: plainState(sword, n, unspent), cost: n.cost });
			});
		for (let i = 1; i < shared.length; i += 1) vertical(shared[i - 1]!, shared[i]!);
		const styles = sword.styles ?? [];
		const columns = styles.map((s) => {
			const i = Math.max(0, SWORD_STYLES.indexOf(s.id));
			return s.nodes.map((n) => {
				const shape = shapeOf(n);
				return add({ key: styleKey(s.id, n.tier), branch: 'sword', style: s.id, tier: n.tier, x: styleX[i]!, y: rows[n.tier]!, size: sizeOf(p, shape), shape, state: styleState(sword, s, n, unspent), cost: n.cost });
			});
		});
		const last = shared[shared.length - 1];
		const firsts = columns.map((c) => c[0]).filter((n): n is LaidNode => !!n);
		if (last && firsts.length) {
			const gapTop = bottom(last);
			const gapBottom = Math.min(...firsts.map(top));
			forkY = gapTop + Math.min(7, Math.floor((gapBottom - gapTop) / 2));
			forkLabelY = R((forkY + gapBottom) / 2);
			// Thân rẽ: theo lưu phái đang theo; chưa chọn thì theo nút mốc 3 đầu tiên (ba nút cùng trạng thái).
			const chosen = firsts.find((n) => n.style === sword.style) ?? firsts[0]!;
			edges.push({ x1: swordX, y1: gapTop, x2: swordX, y2: forkY, kind: edgeKind(last.state, chosen.state), from: last.key, to: chosen.key });
			for (const f of firsts) {
				const kind = edgeKind(last.state, f.state);
				if (f.x !== swordX) edges.push({ x1: swordX, y1: forkY, x2: f.x, y2: forkY, kind, from: last.key, to: f.key });
				edges.push({ x1: f.x, y1: forkY, x2: f.x, y2: top(f), kind, from: last.key, to: f.key });
			}
		}
		for (const c of columns) for (let i = 1; i < c.length; i += 1) vertical(c[i - 1]!, c[i]!);
	}

	// ——— 5 nguyên tố ———
	ELEMENTS.forEach((e, j) => {
		const b = branch(e);
		if (!b) return;
		const col = b.nodes.map((n) => {
			const shape = shapeOf(n);
			return add({ key: nodeKey(e, n.tier), branch: e, tier: n.tier, x: elemX(j), y: rows[n.tier]!, size: sizeOf(p, shape), shape, state: plainState(b, n, unspent), cost: n.cost });
		});
		for (let i = 1; i < col.length; i += 1) vertical(col[i - 1]!, col[i]!);
	});

	// ——— Kiếm pháp nguyên tố: thoi lệch trái nửa cột, nhánh ngang từ đường dọc của nguyên tố ———
	const half = artHalfDiagonal(p);
	ELEMENTS.forEach((e, j) => {
		const a = t.arts.find((x) => x.element === e);
		if (!a) return;
		const eb = branch(e);
		const state: NodeState = a.learned ? 'reached' : !eb?.unlocked || !sword?.unlocked ? 'locked' : 'future';
		const x = R(p.ruler + swordW + p.elemCol * j);
		const n = add({ key: artKey(e), branch: 'sword', art: e, tier: SWORD_ART_TIER, x, y: artY, size: p.art, shape: 'art', state, cost: 0 });
		const kind: EdgeKind = a.elementOk ? 'lit' : !eb?.unlocked ? 'dim' : 'off';
		edges.push({ x1: elemX(j), y1: artY, x2: x + half, y2: artY, kind, from: nodeKey(e, SWORD_ART_TIER), to: n.key });
	});

	const columns: TreeColumn[] = [{ branch: 'sword', x: p.ruler, w: swordW }, ...ELEMENTS.map((e, j) => ({ branch: e as BranchId, x: p.ruler + swordW + p.elemCol * j, w: p.elemCol }))];
	return { nodes, edges, width, height, rows, forkY, forkLabelY, artY, columns, styleX, swordX };
}

/** Trạng thái của MỘT nút theo khoá (không cần dựng cả lưới) — dùng cho chế độ Từng nhánh và cột chi tiết. */
export function nodeState(t: TalentsView, key: string): NodeState {
	const k = parseKey(key);
	if (!k) return 'locked';
	if (k.art) {
		const a = t.arts.find((x) => x.element === k.art);
		if (a?.learned) return 'reached';
		const eb = t.branches.find((x) => x.branch === k.art);
		const sword = t.branches.find((x) => x.branch === 'sword');
		return !eb?.unlocked || !sword?.unlocked ? 'locked' : 'future';
	}
	const f = findNode(t, key);
	if (!f) return 'locked';
	return f.s ? styleState(f.b, f.s, f.n, t.unspent) : plainState(f.b, f.n, t.unspent);
}

// ———————————————————————————— nấc kế / học được ngay ————————————————————————————

export interface NextStep {
	branch: BranchId;
	style?: SwordStyleId;
	tier: number;
	name: string;
	cost: number;
	/** Nút trên cây để chọn khi bấm dòng (ngã ba lưu phái: nút mốc 3 của lưu phái đầu). */
	key: string;
	/** Kiếm ở ngã ba: chưa chọn lưu phái, lên mốc 3 là chọn. */
	fork?: boolean;
	/** Đủ điểm học ngay. */
	ok: boolean;
	/** Mốc hiện tại của nhánh (nhánh chính của build lên trước). */
	at: number;
}

/**
 * Mọi nấc kế của các nhánh đã mở và chưa chạm trần — đủ điểm hay chưa. Sắp xếp: nhánh có mốc cao nhất trước (nhánh chính
 * của build), rồi giá tăng dần, rồi thứ tự `BRANCHES`.
 */
export function nextSteps(t: TalentsView): NextStep[] {
	const out: NextStep[] = [];
	for (const b of t.branches) {
		if (!b.unlocked || b.nextCost === null) continue;
		const tier = b.tier + 1;
		const ok = t.unspent >= b.nextCost;
		if (b.branch === 'sword' && b.styles?.length && !b.style && tier === styleTierOf(b)) {
			out.push({ branch: 'sword', tier, name: 'chọn lưu phái', cost: b.nextCost, key: styleKey(b.styles[0]!.id, tier), fork: true, ok, at: b.tier });
			continue;
		}
		const n = b.nodes.find((x) => x.tier === tier);
		if (!n || !n.ready) continue;
		const style = b.branch === 'sword' && b.style && tier >= styleTierOf(b) ? b.style : undefined;
		out.push({ branch: b.branch, ...(style ? { style } : {}), tier, name: n.name, cost: b.nextCost, key: style ? styleKey(style, tier) : nodeKey(b.branch, tier), ok, at: b.tier });
	}
	const order = (b: BranchId) => BRANCHES.indexOf(b);
	return out.sort((x, y) => y.at - x.at || x.cost - y.cost || order(x.branch) - order(y.branch));
}

/** Nấc kế ĐỦ ĐIỂM học ngay (khối "Học được ngay" ở cột bên / sheet điện thoại). */
export function learnableNow(t: TalentsView): NextStep[] {
	return nextSteps(t).filter((s) => s.ok);
}

// ———————————————————————————— tra một nút ————————————————————————————

export interface FoundNode {
	b: TalentBranchView;
	n: TalentNodeView;
	s?: SwordStyleView;
}

/** Tra nút của nhánh / lưu phái theo khoá (kiếm pháp không có ở đây — tra `t.arts`). */
export function findNode(t: TalentsView, key: string): FoundNode | null {
	const k = parseKey(key);
	if (!k || k.art) return null;
	const b = t.branches.find((x) => x.branch === k.branch);
	if (!b) return null;
	if (k.style) {
		const s = b.styles?.find((x) => x.id === k.style);
		const n = s?.nodes.find((x) => x.tier === k.tier);
		return s && n ? { b, n, s } : null;
	}
	const n = (b.styles?.length ? b.nodes.filter((x) => x.tier < styleTierOf(b)) : b.nodes).find((x) => x.tier === k.tier);
	return n ? { b, n } : null;
}

/**
 * Lộ trình tới một nút CHƯA đạt: các nút phải cộng lần lượt từ nấc kế tới nó (gồm nó), cùng tổng điểm. null khi nút đã đạt,
 * thuộc nhánh khoá, thuộc lưu phái không theo, hoặc là kiếm pháp (không mua). Nút "sắp có" vẫn có lộ trình (để biết xa
 * bao nhiêu) nhưng bên gọi không cho học.
 */
export function routeTo(t: TalentsView, key: string): { keys: string[]; total: number } | null {
	const f = findNode(t, key);
	if (!f) return null;
	const { b, n, s } = f;
	if (!b.unlocked || n.tier <= b.tier) return null;
	if (s && b.style && !s.chosen) return null;
	const keys: string[] = [];
	let total = 0;
	for (let tier = b.tier + 1; tier <= n.tier; tier += 1) {
		const node = s && tier >= styleTierOf(b) ? s.nodes.find((x) => x.tier === tier) : b.nodes.find((x) => x.tier === tier);
		if (!node) return null;
		keys.push(s && tier >= styleTierOf(b) ? styleKey(s.id, tier) : nodeKey(b.branch, tier));
		total += node.cost;
	}
	return { keys, total };
}

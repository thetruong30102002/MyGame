/**
 * Phòng thử Kho đồ — dữ liệu GIẢ cho thẻ Tiềm năng (CHỈ dev). Dựng `talents` của store bằng CHÍNH hàm thuần
 * `game/talentsView.buildTalentsView` mà Game dùng, và xử lý `talent_add` / `talent_reset` / `set_slot` / `set_enchant` bằng
 * các hàm thuần của `talents.ts` như Game làm — bấm Học, chọn lưu phái, tẩy điểm, gán ô, phủ phép đều chạy thật.
 *
 * Tham số (thêm vào `/lab/inventory?...`):
 * - `talents=demo` (giữa game: Kiếm Thần 5, Hoả 5 → có kiếm pháp + phủ Lửa, Phong / Băng đã mở chưa học, còn điểm) · `fork`
 *   (Kiếm 2, chưa chọn lưu phái) · `full` (cấp 40, Bắc Thần 9 + Băng 7 + Thuỷ 4 + Hoả 1, Phong / Thổ đã mở chưa học) · `new`
 *   (mới mở Kiếm + Hoả, chưa cộng điểm: Hoả mốc 0, nút "Học mốc 1 · 1 điểm").
 * - `tlevel=` đổi cấp của bộ dữ liệu (mặc định theo bộ) — quyết định số điểm có.
 * - `tab=talents` mở thẳng thẻ Tiềm năng (cũng nhận `character` / `inventory` / `codex` / `friends` / `settings`).
 * - `tview=tree|branch|loadout` chế độ xem của thẻ (ghi vào localStorage như khi người chơi bấm).
 * - `tsel=<khoá nút>` chọn sẵn một nút trên cây để chụp cột chi tiết (vd `fire:6`, `sword:kiem_than:8`, `art:water`,
 *   `sword:thuy_than:3` ở bộ `fork`) — bấm hộ nút đó sau khi bảng vẽ xong.
 * Ví dụ: `/lab/inventory?demo=1&talents=demo&tab=talents&tsel=fire:6`.
 */
import { HERO_SKILLS } from '@/game/combat/skills';
import {
	addTier,
	assignSlot,
	baseTier,
	BRANCH_NAME,
	BRANCH_UNLOCK,
	branchOpen,
	BRANCHES,
	canEnchant,
	defaultLoadout,
	ENCHANT_SWAP_SECONDS,
	ENCHANTS,
	nextTierCost,
	placeSkill,
	resetCost,
	spentPoints,
	STYLE_TIER,
	SWORD_ARTS,
	SWORD_STYLE_INFO,
	SWORD_STYLES,
	treeOf,
	unspent,
	type Branch,
	type EnchantId,
	type Loadout,
	type SwordStyle,
	type Tiers,
} from '@/game/combat/talents';
import { buildTalentsView, ENCHANT_LABEL, knownSkillIds } from '@/game/talentsView';
import { useGameStore, type PanelId } from '@/store/useGameStore';

interface Preset {
	level: number;
	tiers: Tiers;
	/** Nhánh ĐÃ MỞ (mã cốt truyện) — nhánh nguyên tố mở mà chưa học thì mốc 0 nhưng vẫn ở đây; ngoài danh sách = khoá. */
	open: Branch[];
	style: SwordStyle | null;
	enchant: EnchantId | null;
}

/** Bộ dữ liệu mẫu — tổng giá mốc không vượt điểm của cấp (luật 10/10/2026: nguyên tố mốc 1 = 1 điểm, Kiếm mốc 1 miễn phí). */
const PRESETS: Record<string, Preset> = {
	// Cấp 18 = 20 điểm: Kiếm 5 (8) + Hoả 5 (9) + Thuỷ 2 (2) = 19 → còn 1 (học được Phong Nhận hoặc Băng Tiễn).
	demo: { level: 18, tiers: { sword: 5, fire: 5, water: 2, wind: 0, ice: 0, earth: 0 }, open: ['sword', 'fire', 'water', 'wind', 'ice'], style: 'kiem_than', enchant: 'fire' },
	// Cấp 8 = 8 điểm: Kiếm 2 (1) + Hoả 2 (2) + Thuỷ 1 + Phong 1 = 5 → còn 3 (đủ chọn lưu phái, 2 điểm).
	fork: { level: 8, tiers: { sword: 2, fire: 2, water: 1, wind: 1, ice: 0, earth: 0 }, open: ['sword', 'fire', 'water', 'wind'], style: null, enchant: null },
	// Cấp 40 = 47 điểm: Kiếm 9 (24) + Băng 7 (16) + Thuỷ 4 (6) + Hoả 1 (1) = 47.
	full: { level: 40, tiers: { sword: 9, fire: 1, water: 4, wind: 0, ice: 7, earth: 0 }, open: ['sword', 'fire', 'water', 'wind', 'ice', 'earth'], style: 'bac_than', enchant: 'ice' },
	// Cấp 3 = 2 điểm, chưa cộng: Kiếm mốc 1 (Trảm có sẵn), Hoả đã mở ở mốc 0 — Hoả Cầu chưa lên thanh.
	new: { level: 3, tiers: { sword: 1, fire: 0, water: 0, wind: 0, ice: 0, earth: 0 }, open: ['sword', 'fire'], style: null, enchant: null },
};

const PANELS: PanelId[] = ['character', 'talents', 'inventory', 'codex', 'friends', 'settings'];
const MODE_KEY = 'aether.talentView';

/** Khởi động dữ liệu giả theo tham số URL. Trả hàm dọn (bỏ nghe yêu cầu, dừng đồng hồ phủ phép). */
export function startTalentsMock(q: URLSearchParams): () => void {
	const tab = q.get('tab') as PanelId | null;
	if (tab && PANELS.includes(tab)) useGameStore.getState().setPanel(tab);
	const view = q.get('tview');
	if (view === 'tree' || view === 'branch' || view === 'loadout') {
		try {
			window.localStorage.setItem(MODE_KEY, view);
		} catch {
			// Không ghi được (chế độ ẩn danh) thì thẻ mở ở chế độ mặc định.
		}
	}
	const preset = PRESETS[q.get('talents') ?? ''];
	if (!preset) return () => {};

	const level = Number(q.get('tlevel')) || preset.level;
	const tiers: Tiers = { ...preset.tiers };
	// Mã nhánh đã mở + `staff` (trượng tập của mẹ — Tia Aether bẩm sinh có trên thanh như người chơi thật).
	const open = new Set([...preset.open.map((b) => BRANCH_UNLOCK[b]), 'staff']);
	const isUnlocked = (id: string): boolean => open.has(id);
	let style = preset.style;
	let enchant: EnchantId | null = preset.enchant && canEnchant(tiers, preset.enchant) ? preset.enchant : null;
	let readyAt = 0;
	const known = (): string[] => knownSkillIds(tiers, isUnlocked, style);
	let loadout: Loadout = defaultLoadout(known());

	const publish = (): void => {
		const cooldown = Math.max(0, (readyAt - performance.now()) / 1000);
		useGameStore.setState({ talents: buildTalentsView({ tiers, level, style, isUnlocked, enchant, enchantCooldown: cooldown, loadout }) });
	};
	/** Kỹ năng mới học tự lên ô trống (như `Game.syncTalents`); kỹ năng mất (tẩy điểm) rời thanh. */
	const sync = (before: Set<string>): void => {
		const now = known();
		loadout = loadout.map((id) => (id && now.includes(id) ? id : null));
		for (const id of now) if (!before.has(id)) loadout = placeSkill(loadout, id);
		if (enchant && !canEnchant(tiers, enchant)) enchant = null;
	};
	publish();
	const timer = window.setInterval(() => readyAt > performance.now() - 1000 && publish(), 1000);

	const unsub = useGameStore.subscribe((s, prev) => {
		if (s.gameRequest.seq === prev.gameRequest.seq) return;
		const r = s.gameRequest;
		const toast = useGameStore.getState().toast;
		if (r.kind === 'talent_add') {
			const b = r.branch as Branch | undefined;
			if (!b || !BRANCHES.includes(b)) return;
			const tier = tiers[b] ?? 0;
			if (r.tier !== undefined && r.tier !== tier + 1) return;
			if (!branchOpen(b, isUnlocked)) return toast(`Chưa mở nhánh ${BRANCH_NAME[b]}`, 'warn');
			const cost = nextTierCost(tiers, b, isUnlocked);
			if (cost === null) return toast(`${BRANCH_NAME[b]} mốc ${tier + 1} sắp có`, 'warn');
			if (unspent(level, tiers) < cost) return toast(`Cần ${cost} điểm để lên ${BRANCH_NAME[b]} mốc ${tier + 1}`, 'warn');
			const picking = b === 'sword' && tier === STYLE_TIER - 1 && !style;
			if (picking && (!r.style || !SWORD_STYLES.includes(r.style))) return toast(`Kiếm mốc ${STYLE_TIER}: chọn một lưu phái`, 'warn');
			const before = new Set(known());
			if (picking) style = r.style!;
			addTier(level, tiers, b, isUnlocked);
			sync(before);
			const node = treeOf(b, style)[tier];
			toast(`${picking ? `Kiếm mốc ${tier + 1} — vào lưu phái ${SWORD_STYLE_INFO[style!].name}` : `${BRANCH_NAME[b]} lên mốc ${tier + 1}`}${node?.ready ? ` — ${node.kind === 'active' ? 'học' : 'bị động'} “${node.name}”` : ''}`, 'level');
			for (const id of Object.values(SWORD_ARTS)) if (!before.has(id) && known().includes(id)) toast(`Lĩnh ngộ kiếm pháp: ${HERO_SKILLS.find((x) => x.id === id)?.name ?? id}`, 'level');
			return publish();
		}
		if (r.kind === 'talent_reset') {
			const spent = spentPoints(tiers);
			if (spent <= 0) return toast('Chưa cộng điểm nào để tẩy', 'info');
			const before = new Set(known());
			// Như `StoryDirector.resetTalents`: nhánh đã mở về mốc có sẵn — Kiếm 1, nguyên tố 0 (mất cả kỹ năng mốc 1).
			for (const b of BRANCHES) if (branchOpen(b, isUnlocked)) tiers[b] = baseTier(b);
			style = null;
			sync(before);
			toast(`Đã tẩy ${spent} điểm tiềm năng (phòng thử: ${resetCost(level)} xu, không trừ)`, 'info');
			return publish();
		}
		if (r.kind === 'set_slot') {
			const slot = r.slot ?? -1;
			if (slot < 0 || slot >= loadout.length) return;
			loadout = assignSlot(loadout, slot, r.skillId ?? null);
			return publish();
		}
		if (r.kind === 'set_enchant') {
			const e = r.enchant ?? null;
			if (e !== null && (!ENCHANTS.includes(e) || !canEnchant(tiers, e))) return toast('Chưa đủ điều kiện phủ phép', 'warn');
			if (e === enchant) return;
			if (readyAt > performance.now()) return toast(`Đổi phủ phép sau ${Math.ceil((readyAt - performance.now()) / 1000)} giây nữa`, 'warn');
			enchant = e;
			readyAt = performance.now() + ENCHANT_SWAP_SECONDS * 1000;
			toast(e ? `Phủ phép: ${ENCHANT_LABEL[e]}` : 'Đã tắt phủ phép', 'info');
			return publish();
		}
	});

	// Chọn sẵn một nút (chụp cột chi tiết): chờ bảng vẽ xong rồi bấm hộ.
	const sel = q.get('tsel');
	let tries = 0;
	const pick = sel
		? window.setInterval(() => {
				const el = document.querySelector<HTMLElement>(`[data-key="${CSS.escape(sel)}"]`);
				tries += 1;
				if (el) el.click();
				if (el || tries > 40) window.clearInterval(pick);
			}, 100)
		: 0;

	return () => {
		unsub();
		window.clearInterval(timer);
		if (pick) window.clearInterval(pick);
	};
}

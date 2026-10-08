'use client';

import { useEffect, useState } from 'react';
import { CharacterPanel } from '@/components/CharacterPanel';
import { GameCanvas } from '@/components/GameCanvas';
import { Hud } from '@/components/Hud';
import { DialogueBox, StoryScenes } from '@/components/StoryUI';
import { PATHS } from '@/game/combat/skills';
import { EQUIP_SLOTS, equipItem, gearBonus, itemDef, ITEMS, mint, SLOT_NAME, STAT_KEYS, stackStats, unequipItem, type EquipSlotId, type GearState, type ItemStack, type StatBasis } from '@/game/equipment';
import { GEAR_ART } from '@/game/gearArt';
import { figureGear, gearPieces, type GearAnchors } from '@/game/gearLayers';
import { useGameStore, type InventoryItem } from '@/store/useGameStore';

/**
 * Phòng thử Kho đồ (CHỈ dev): dựng bảng Hành trang với dữ liệu giả, không cần đăng nhập / máy chủ / bản lưu. Yêu cầu
 * `equip` / `unequip` / `use_potion` xử lý bằng CHÍNH các hàm thuần của `game/equipment.ts` như Game làm.
 * Tham số: `?sprite=player_lior_child` (mặc định player_hero_adult) · `?demo=1` thêm đồ VÍ DỤ có chỉ số (hình tạm = ảnh
 * kiếm/trượng tân thủ) để xem bảng so sánh · `?level=14&path=sword|mage`.
 * `?game=1`: chạy GAME THẬT ở chế độ chơi đơn (bản lưu localStorage của trình duyệt, không đăng nhập, không đụng máy chủ)
 * — kiểm chuyển bản lưu cũ và đường Game ↔ kho đồ bằng `__aether.gear()` / `equip()` / `unequip()` / `giveItem()`.
 */
const DEMO: Record<string, (typeof ITEMS)[string]> = {
	lab_iron_sword: { id: 'lab_iron_sword', name: 'Kiếm sắt lính gác (ví dụ)', desc: 'Đồ ví dụ của phòng thử — hình tạm mượn ảnh kiếm gỗ.', icon: '/assets/items/starter_sword.png', w: 49, h: 49, kind: 'equip', equip: 'weapon', rarity: 'fine', levelReq: 10, stats: { atk: 6, crit: 2 } },
	lab_oak_staff: { id: 'lab_oak_staff', name: 'Trượng sồi (ví dụ)', desc: 'Đồ ví dụ của phòng thử — hình tạm mượn ảnh trượng tập.', icon: '/assets/items/starter_staff.png', w: 54, h: 54, kind: 'equip', equip: 'offhand', rarity: 'rare', stats: { mag: 4, mp: 10 } },
	lab_heavy_blade: { id: 'lab_heavy_blade', name: 'Đại kiếm (ví dụ)', desc: 'Đồ ví dụ — cần cấp cao.', icon: '/assets/items/starter_sword.png', w: 49, h: 49, kind: 'equip', equip: 'weapon', rarity: 'epic', levelReq: 30, stats: { atk: 15 } },
};

function view(s: ItemStack, at: EquipSlotId | null): InventoryItem {
	const d = itemDef(s.id);
	const all = stackStats(s);
	const stats = Object.fromEntries(STAT_KEYS.filter((k) => all[k] !== 0).map((k) => [k, all[k]]));
	return {
		id: s.id,
		uid: s.uid,
		name: d.name,
		desc: d.desc,
		icon: d.icon,
		w: d.w,
		h: d.h,
		count: s.n ?? 1,
		kind: d.kind,
		...(d.equip ? { equipKind: d.equip } : {}),
		...(Object.keys(stats).length ? { stats } : {}),
		...(d.rarity ? { rarity: d.rarity } : {}),
		...(d.levelReq ? { levelReq: d.levelReq } : {}),
		...(d.bound ? { bound: true } : {}),
		...(d.effect ? { effect: d.effect } : {}),
		equippedAt: at,
	};
}

export function InventoryLab() {
	const [real, setReal] = useState<boolean | null>(null);
	useEffect(() => setReal(new URLSearchParams(location.search).get('game') === '1'), []);
	if (real === null) return null;
	return real ? <RealGame /> : <MockPanel />;
}

function RealGame() {
	return (
		<main className="relative h-dvh w-dvw touch-none overflow-hidden overscroll-none">
			<GameCanvas />
			<Hud />
			<CharacterPanel />
			<DialogueBox />
			<StoryScenes />
		</main>
	);
}

function MockPanel() {
	useEffect(() => {
		const q = new URLSearchParams(location.search);
		const spriteId = q.get('sprite') ?? 'player_hero_adult';
		const level = Number(q.get('level') ?? 14);
		const pathId = (q.get('path') as 'sword' | 'mage' | null) ?? 'sword';
		const demo = q.get('demo') === '1';
		if (demo) {
			Object.assign(ITEMS, DEMO);
			// Đồ ví dụ mượn hình kiếm gỗ / trượng tập → mượn luôn lớp đồ gắn (xem nhuộm + viền theo độ hiếm trên người).
			Object.assign(GEAR_ART, { lab_iron_sword: GEAR_ART.sword, lab_heavy_blade: GEAR_ART.sword, lab_oak_staff: GEAR_ART.staff });
		}
		let gear: GearState = { bag: [], equip: {}, seq: 0 };
		for (const [id, slot] of [['sword', 'main'], ['staff', 'off']] as const) {
			const m = mint(gear, id);
			gear = { ...m.g, equip: { ...m.g.equip, [slot]: m.stack } };
		}
		if (demo) {
			for (const id of Object.keys(DEMO)) {
				const m = mint(gear, id);
				gear = { ...m.g, bag: [...m.g.bag, m.stack] };
			}
		}
		let potions = 3;
		let hp = 150;
		const p = PATHS[pathId];
		const lv = level - 1;
		const basis: StatBasis = {
			base: { atk: p.atk[0] + lv * p.atk[1], mag: p.atk[0] + lv * p.atk[1], def: p.def[0] + lv * p.def[1], hp: p.hp[0] + lv * p.hp[1], mp: p.mp[0] + lv * p.mp[1], crit: 10, move: 0 },
			scale: { atk: p.sword, mag: p.magic, def: 1, hp: 1, mp: 1, crit: 1, move: 1 },
		};
		// Hình giữa kho đồ: atlas + neo đồ gắn của khung đứng đầu (đọc từ JSON atlas) — dựng lại lớp đồ mỗi lần mặc/tháo.
		let figure: { sheet: string; frames: { x: number; y: number; w: number; h: number }[]; anchors?: GearAnchors } | null = null;
		const publishFigure = (): void => {
			if (figure) useGameStore.setState({ playerSprite: { sheet: figure.sheet, frames: figure.frames, gear: figureGear(gearPieces(gear.equip), figure.anchors, 'S') } });
		};
		const publish = (): void => {
			publishFigure();
			const g = gearBonus(gear);
			const shown = (k: keyof typeof g) => Math.round((basis.base[k] + g[k]) * basis.scale[k]);
			const hpMax = shown('hp');
			hp = Math.min(hp, hpMax);
			const st = useGameStore.getState();
			useGameStore.setState({
				inventory: [...gear.bag.map((s) => view(s, null)), { ...view({ uid: 'potion', id: 'potion' }, null), count: potions, usable: true }],
				equipment: EQUIP_SLOTS.map((slot) => ({ slot, name: SLOT_NAME[slot], item: gear.equip[slot] ? view(gear.equip[slot]!, slot) : null })),
				stats: { ...st.stats, name: `${spriteId.includes('_f') ? 'Ánh Dương' : 'Kiem Thu'} · ${p.name}`, level, hp, hpMax, mp: shown('mp'), mpMax: shown('mp'), coins: 180, potions, attack: shown('atk'), magic: shown('mag'), defense: shown('def'), critChance: shown('crit') / 100, path: p.name, age: spriteId.includes('child') ? 8 : 16, gear: g, gearBasis: basis },
			});
		};
		useGameStore.setState({ status: 'ready', scene: 'play', panel: 'inventory', dialogue: null, card: null });
		publish();
		void fetch('/assets/manifest.json')
			.then((r) => r.json())
			.then(async (m: { characters: Record<string, { atlas: string }> }) => {
				const atlas = m.characters[spriteId]?.atlas;
				if (!atlas) return;
				const j = (await fetch(`/assets/${atlas}`).then((r) => r.json())) as { frames: Record<string, { frame: { x: number; y: number; w: number; h: number }; gear?: GearAnchors }>; animations: Record<string, string[]> };
				const names = j.animations.idle_S ?? [];
				figure = { sheet: `/assets/${atlas.replace(/\.json$/, '.png')}`, frames: names.map((k) => j.frames[k]!.frame), anchors: names[0] ? j.frames[names[0]]?.gear : undefined };
				publishFigure();
			});
		return useGameStore.subscribe((s, prev) => {
			if (s.gameRequest.seq === prev.gameRequest.seq) return;
			const r = s.gameRequest;
			const toast = useGameStore.getState().toast;
			if (r.kind === 'use_potion') {
				if (potions > 0) {
					potions -= 1;
					hp = Infinity;
				}
				return publish();
			}
			if (r.kind !== 'equip' && r.kind !== 'unequip') return;
			const next = r.kind === 'equip' ? equipItem(gear, r.uid ?? '', r.equipSlot, level, 16) : unequipItem(gear, r.equipSlot!);
			if (typeof next === 'string') return toast(next, 'warn');
			gear = next;
			toast(r.kind === 'equip' ? 'Đã mặc' : 'Đã tháo về túi', 'info');
			publish();
		});
	}, []);

	return (
		<main className="relative h-dvh w-dvw overflow-hidden bg-[#2b3a2a]">
			<CharacterPanel />
		</main>
	);
}

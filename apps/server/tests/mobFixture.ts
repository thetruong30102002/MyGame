import type { MonsterZoneDef } from '@aether/sim/mobs';

/** Khu quái giả cho test sổ quái: 3 xác sống (dùng chung), 1 boss vùng (dùng chung), 1 khu nhiệm vụ (riêng — bị bỏ). */
export const MonsterZoneFixture: MonsterZoneDef[] = [
	{ id: 'gy_a', x: 400, y: 400, radius: 120, monsters: ['mob_zombie_001'], count: 3, fromAge: 16 },
	{ id: 'gy_crypt', x: 1200, y: 400, radius: 96, monsters: ['boss_lich_001'], count: 1, fromAge: 16, boss: true },
	{ id: 'gy_quest', x: 800, y: 800, radius: 96, monsters: ['mob_zombie_001'], count: 4, onDemand: true },
];

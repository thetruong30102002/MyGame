import { Container, Graphics, Sprite, Text, type Application, type Ticker } from 'pixi.js';
import { useGameStore } from '@/store/useGameStore';
import { useSettings } from '@/store/useSettings';
import { loadCharacter, loadManifest, type AssetManifest } from './assets/AssetManifest';
import { Camera } from './camera/Camera';
import { CombatSystem, type Fighter } from './combat/CombatSystem';
import { FocusMarker, focusAim, focusAt, focusCycle, focusKept, focusNearest, type FocusCandidate } from './combat/focus';
import { aheadPoint } from './combat/skillRules';
import { expForLevel, HERO_SKILLS, isGroundTarget, PATHS } from './combat/skills';
import { assignSlot, MAX_TIER, SKILL_NODE, SLOT_CODES, SLOT_KEYS, type Loadout } from './combat/talents';
import { Vfx } from './combat/Vfx';
import { createPixelApp, defaultZoom, fitCanvas } from './core/pixelApp';
import { Actor, type Mover } from './entities/Actor';
import { WALK_SPEED_REFERENCE } from './entities/CharacterView';
import { defaultStance, type GearPiece } from './gearLayers';
import { directionOf, Keyboard, type MoveIntent } from './input/Keyboard';
import { EMPTY_BUILD, LAB_COOLDOWN, LAB_LEVEL, labEnchant, labKnown, labLoadout, labTiers, type LabBuild } from './skillLabBuild';
import { MapWorld } from './world/MapWorld';

/**
 * Sân tập của trang Thử chiêu (`/thu-chieu`) — chơi KHÔNG cần đăng nhập, không máy chủ, không cốt truyện, không lưu gì: quảng
 * trường Thistlewood, nhân vật 16 tuổi cầm kiếm + trượng, ba hình nộm và quái gọi ra theo ý. Chiến đấu dùng CHÍNH `CombatSystem`
 * của game (cùng số liệu, hình chiêu, phản ứng nguyên tố) — bộ chiêu đổi tức thì theo lựa chọn ở bảng bên (`setBuild`).
 * Vòng điều khiển là bản rút gọn của `Game.update` (đi / chạy / né / chiêu / giữ J-K đánh liên tục).
 */

const RUN_SPEED = 150;
const ACTION_MOVE_SCALE = 0.4;
const HOLD_REPEAT = ['KeyJ', 'KeyK'];
const SKILL_KEYS: Record<string, number> = Object.fromEntries(SLOT_CODES.map((code, i) => [code, i]));
const FACING: Record<string, [number, number]> = { S: [0, 1], N: [0, -1], E: [1, 0], W: [-1, 0], SE: [1, 1], SW: [-1, 1], NE: [1, -1], NW: [-1, -1] };
const NO_INTENT: MoveIntent = { x: 0, y: 0, run: false };

/** Quảng trường đá giữa thị trấn: giữa bốn sạp hàng và giếng là khoảng trống rộng. */
const REGION = 'human';
const MAP = 'town';
const ARENA = { x: 1080, y: 1300 };
const PLAYER_START = { x: ARENA.x - 130, y: ARENA.y };
const DUMMIES = [
	{ x: ARENA.x + 110, y: ARENA.y - 100 },
	{ x: ARENA.x + 140, y: ARENA.y },
	{ x: ARENA.x + 110, y: ARENA.y + 100 },
];
/** Bầy quái gọi ra đứng quanh chỗ này (bên phải hình nộm), lang thang trong bán kính. */
const MOB_HOME = { x: ARENA.x + 60, y: ARENA.y, radius: 150 };

/** Quái gọi được ở sân tập (id trong manifest). */
export const LAB_MOBS: { id: string; name: string; count: number }[] = [
	{ id: 'mob_mushroom_001', name: 'Nấm rừng', count: 4 },
	{ id: 'mob_zombie_001', name: 'Xác sống', count: 3 },
	{ id: 'mob_skeleton_archer_001', name: 'Cung thủ xương', count: 3 },
	{ id: 'mob_gargoyle_001', name: 'Gargoyle đá', count: 2 },
	{ id: 'mob_cave_bat_001', name: 'Dơi hang', count: 4 },
	{ id: 'boss_lich_001', name: 'Vua Lich (boss)', count: 1 },
	{ id: 'boss_demon_001', name: 'Quỷ vương (boss)', count: 1 },
];

export interface LabOptions {
	/** MP luôn đầy. */
	infiniteMp: boolean;
	/** Máu luôn đầy (vẫn thấy số trúng đòn). */
	immortal: boolean;
}

const WEAPONS: GearPiece[] = [
	{ slot: 'main', id: 'sword', rarity: 'common' },
	{ slot: 'off', id: 'staff', rarity: 'common' },
];

export class SkillLab {
	private static readonly live = new Set<SkillLab>();
	/** Bản đang chạy — bảng bên gọi `setBuild` / `spawnMobs` qua đây. */
	static get current(): SkillLab | null {
		return [...SkillLab.live].pop() ?? null;
	}

	private app!: Application;
	private keyboard!: Keyboard;
	private camera!: Camera;
	private world!: MapWorld;
	private manifest!: AssetManifest;
	private player!: Actor;
	private combat!: CombatSystem;
	private readonly vfx = new Vfx();
	private readonly scene = new Container();
	private readonly entities = new Container({ sortableChildren: true });
	private readonly labelLayer = new Container();
	private readonly flashLayer = new Graphics();
	private readonly actors: Actor[] = [];
	private readonly labels = new Map<Actor, Text>();
	/** Mục tiêu đang chọn (`focus.ts`) — như game thật. */
	private focus: object | null = null;
	private readonly focusMarker = new FocusMarker();
	private resizeObserver?: ResizeObserver;
	private destroyed = false;
	private hudTimer = 0;
	private build: LabBuild = EMPTY_BUILD;
	private loadout: Loadout = labLoadout(EMPTY_BUILD);
	options: LabOptions = { infiniteMp: true, immortal: true };
	private readonly mover: Mover = (pos, dx, dy) => this.world.move(pos, dx, dy);
	/** Tăng mỗi lần dọn sân: quái tải xong SAU lần dọn thì bỏ. */
	private spawnToken = 0;

	static async start(host: HTMLElement, signal?: AbortSignal): Promise<SkillLab> {
		const lab = new SkillLab();
		signal?.addEventListener('abort', () => lab.destroy(), { once: true });
		try {
			await lab.init(host);
		} catch (e) {
			lab.destroy();
			throw e;
		}
		return lab;
	}

	private async init(host: HTMLElement): Promise<void> {
		useGameStore.setState({ status: 'loading', error: null, panel: null, mapOpen: false, dialogue: null, card: null, hud: 'full', boss: null });
		this.app = await createPixelApp(host);
		if (this.destroyed) return void this.app.destroy(true);
		this.keyboard = new Keyboard();
		const [manifest, world] = await Promise.all([loadManifest(), MapWorld.load(REGION, MAP, this.entities), this.vfx.load({ extra: ['/assets/vfx/vfx-ult.json'] })]);
		if (this.destroyed) return void world.destroy();
		this.manifest = manifest;
		this.world = world;

		this.combat = new CombatSystem(
			{
				mover: this.mover,
				shake: (s, t) => useSettings.getState().shake && this.camera?.shake(s, t),
				toast: (text, tone) => useGameStore.getState().toast(text, tone),
				enemyKilled: () => {},
				// Boss ở sân tập không dừng lại đọc thoại giới thiệu.
				bossNear: () => false,
				playerRespawn: () => ({ ...PLAYER_START }),
				isUnlocked: () => true,
				// Không cộng EXP / xu thật: sân tập không có kinh tế (hook có mặt = không tự cộng, và cũng không gửi đi đâu).
				reportKill: () => {},
				potionUsed: () => {},
				levelUp: () => {},
				// Tuyệt kỹ triệu hồi (Sơn Thần, Ngàn Bóng): actor dựng từ hình nhân vật có sẵn, chạy cùng vòng cập nhật như quái.
				spawnSummon: async (sprite, x, y) => {
					if (this.destroyed || !this.manifest.characters[sprite]) return null;
					const actor = await this.spawn(sprite, x, y, 'S', null, '');
					if (this.destroyed) return null;
					this.labels.get(actor)?.destroy();
					this.labels.delete(actor);
					return actor;
				},
				despawnSummon: (actor) => this.removeActor(actor),
			},
			{ level: LAB_LEVEL, exp: 0, coins: 0, potions: 99 },
			this.vfx,
		);
		// Phòng tập: mọi chiêu hồi tối đa 1 giây (tuyệt kỹ 40–50s ở game thật) — thử liên tục cho đã.
		this.combat.cooldownCap = LAB_COOLDOWN;
		this.scene.addChild(world.ground.layer, world.decalLayer, this.combat.groundFx, this.entities, this.focusMarker.layer, this.combat.fxLayer);
		this.vfx.world = this.entities;
		this.app.stage.addChild(this.scene, this.labelLayer, this.combat.screenLayer, this.flashLayer);
		this.addDummies();

		const heroId = manifest.characters.player_hero_adult ? 'player_hero_adult' : Object.entries(manifest.characters).find(([id, c]) => c.role === 'player' && !id.includes('child'))?.[0];
		if (!heroId) throw new Error('Manifest chưa có nhân vật người chơi');
		this.player = await this.spawn(heroId, PLAYER_START.x, PLAYER_START.y, 'E', null, 'Bạn');
		if (this.destroyed) return;
		this.combat.setPlayer(this.player);
		this.combat.setGear({});
		this.player.setGear(WEAPONS);
		this.applyBuild();
		this.combat.refill();

		const zoom = defaultZoom(this.app.renderer.width, this.app.renderer.height);
		this.camera = new Camera(this.scene, zoom);
		this.camera.bounds = { w: world.width, h: world.height };
		this.camera.snapTo(ARENA.x, ARENA.y - 40);
		world.ground.warm(ARENA.x, ARENA.y, 700);
		useGameStore.setState({ zoom });

		const canvas = this.app.canvas;
		canvas.addEventListener('pointerdown', (e) => {
			if (e.button !== 0 && e.button !== 2) return;
			const dpr = window.devicePixelRatio || 1;
			const wx = (e.offsetX * dpr - this.scene.x) / this.camera.zoom;
			const wy = (e.offsetY * dpr - this.scene.y) / this.camera.zoom;
			// Chuột / chạm chỉ để chọn mục tiêu (như game thật) — ra đòn bằng phím / nút chiêu.
			const hit = focusAt(this.combat.focusCandidates(), wx, wy);
			if (hit) this.focus = hit;
		});
		canvas.addEventListener('contextmenu', (e) => e.preventDefault());
		this.resizeObserver = new ResizeObserver(() => fitCanvas(this.app, host));
		this.resizeObserver.observe(host);
		this.app.ticker.add((t) => this.update(t));
		SkillLab.live.add(this);
		useGameStore.setState({ status: 'ready', scene: 'play' });
	}

	// ———————————————————————————— điều khiển từ bảng bên ————————————————————————————

	/** Đổi bộ chiêu: mốc nhánh, lưu phái, con đường, phủ phép; thanh 10 ô dựng lại theo bộ mới. */
	setBuild(b: LabBuild): void {
		this.build = b;
		if (!this.combat || !this.player) return;
		this.combat.cancelAction(true);
		this.applyBuild();
		this.combat.refill();
		this.pushHud();
	}

	/** Gán kỹ năng vào ô (đổi chỗ nếu kỹ năng đang ở ô khác) — `null` = bỏ trống ô. */
	setSlot(slot: number, skillId: string | null): void {
		if (skillId !== null && !labKnown(this.build).includes(skillId)) return;
		this.loadout = assignSlot(this.loadout, slot, skillId);
		this.pushHud();
	}

	get currentLoadout(): Loadout {
		return [...this.loadout];
	}

	/** Gọi một bầy quái cùng cấp sân tập ra quanh hình nộm. */
	async spawnMobs(id: string): Promise<void> {
		const def = LAB_MOBS.find((m) => m.id === id);
		if (!def || !this.manifest.characters[id] || this.destroyed) return;
		const token = this.spawnToken;
		const home = { ...MOB_HOME };
		await Promise.all(
			Array.from({ length: def.count }, async (_, i) => {
				const a = (i / def.count) * Math.PI * 2 + Math.random();
				const r = def.count > 1 ? home.radius * 0.5 : 0;
				const actor = await this.spawn(id, home.x + Math.cos(a) * r, home.y + Math.sin(a) * r * 0.6, 'W', home);
				if (this.destroyed || token !== this.spawnToken) return void this.removeActor(actor);
				const f = this.combat.addEnemy(actor, id, home, actor.displayName, { level: LAB_LEVEL });
				if (!f) return void this.removeActor(actor);
				this.labelEnemy(f);
			}),
		);
	}

	/** Dọn quái, đạn, vùng phép — hình nộm dựng lại sạch trạng thái. */
	clearArena(): void {
		this.spawnToken += 1;
		for (const a of this.combat.clearWorld()) this.removeActor(a);
		useGameStore.setState({ boss: null });
		this.addDummies();
	}

	/** Đưa nhân vật về chỗ đứng đầu, đầy máu / MP, hết hồi chiêu. */
	resetPlayer(): void {
		this.combat.cancelAction(true);
		this.player.x = PLAYER_START.x;
		this.player.y = PLAYER_START.y;
		this.combat.pc.cooldowns.clear();
		this.combat.refill();
	}

	// ———————————————————————————— nội bộ ————————————————————————————

	private applyBuild(): void {
		const b = this.build;
		this.combat.setPath(b.path);
		this.combat.setTalents(labTiers(b), b.style);
		this.combat.restoreEnchant(labEnchant(b));
		this.loadout = labLoadout(b);
		// Thế cầm lúc đứng theo con đường (Pháp sư cầm trượng); sau đó đổi theo động tác chém / niệm như trong game.
		this.player.setGearStance(defaultStance(b.path));
	}

	private addDummies(): void {
		const tex = this.world.propTexture('training_dummy');
		for (const d of DUMMIES) {
			this.combat.addDummy(d.x, d.y);
			if (!tex || this.entities.children.some((c) => c.label === `dummy:${d.x},${d.y}`)) continue;
			const s = new Sprite(tex);
			s.label = `dummy:${d.x},${d.y}`;
			s.anchor.set(0.5, 1);
			s.position.set(d.x, d.y);
			s.zIndex = d.y;
			this.entities.addChild(s);
		}
	}

	private async spawn(id: string, x: number, y: number, facing: 'S' | 'E' | 'W', wander: { x: number; y: number; radius: number } | null, label?: string): Promise<Actor> {
		const textures = await loadCharacter(id);
		const actor = new Actor(id, textures, x, y, facing, wander, wander ? 40 : undefined);
		this.actors.push(actor);
		this.entities.addChild(actor.root);
		const text = new Text({
			text: label ?? actor.displayName,
			style: { fill: wander ? 0xfda4af : 0xffffff, fontSize: Math.round(11 * (window.devicePixelRatio || 1)), fontFamily: 'Be Vietnam Pro, system-ui, sans-serif', fontWeight: '600', stroke: { color: 0x0b0d12, width: 3 } },
		});
		text.anchor.set(0.5, 1);
		this.labelLayer.addChild(text);
		this.labels.set(actor, text);
		return actor;
	}

	private labelEnemy(f: Fighter): void {
		const label = this.labels.get(f.actor);
		if (label && f.level !== null) label.text = `${f.name} · Cấp ${f.level}`;
	}

	private removeActor(a: Actor): void {
		a.root.destroy({ children: true });
		this.labels.get(a)?.destroy();
		this.labels.delete(a);
		const i = this.actors.indexOf(a);
		if (i >= 0) this.actors.splice(i, 1);
	}

	private slotSkill(slot: number): number {
		const id = this.loadout[slot];
		return id ? HERO_SKILLS.findIndex((s) => s.id === id) : -1;
	}

	private focusTarget(auto: boolean): FocusCandidate | null {
		const p = this.player;
		const cands = this.combat.focusCandidates();
		let c = focusKept(cands, this.focus, p.x, p.y);
		if (!c && auto) {
			const k = focusNearest(cands, p.x, p.y);
			c = cands.find((x) => x.key === k) ?? null;
		}
		this.focus = c?.key ?? null;
		return c;
	}

	/** Như `Game.aimFor`: nhắm mục tiêu đang chọn (chưa chọn thì tự chọn con gần nhất), không ai thì đánh thẳng hướng mặt. */
	private aimFor(index: number): { x: number; y: number } {
		const s = this.combat.skills[index];
		const ground = !!s && isGroundTarget(s);
		const t = this.focusTarget(true);
		if (t) return focusAim(t, ground);
		const p = this.player;
		const v = FACING[p.view.direction]!;
		if (ground) return aheadPoint(p.x, p.y, v[0], v[1], s?.aimDist ?? 150);
		return { x: p.x + v[0] * 100, y: p.y - p.chest + v[1] * 100 };
	}

	private update(ticker: Ticker): void {
		const realDt = Math.min(ticker.deltaMS / 1000, 0.1);
		const dt = this.combat.hitStop > 0 ? realDt * 0.08 : realDt;
		this.combat.hitStop = Math.max(0, this.combat.hitStop - realDt);
		const p = this.player;
		const pc = this.combat.pc;
		if (this.options.infiniteMp) pc.mp = pc.mpMax;
		if (this.options.immortal && !pc.dead) pc.hp = pc.hpMax;
		const presses = this.keyboard.drainPresses();
		const acting = !pc.dead;
		const intent = acting ? this.keyboard.intent() : NO_INTENT;

		const held = this.combat.heldSkills;
		held.clear();
		if (acting) {
			for (const code of HOLD_REPEAT) {
				const i = this.slotSkill(SKILL_KEYS[code]!);
				if (i >= 0 && this.keyboard.pressed(code)) held.add(i);
			}
			for (const k of presses) {
				if (k in SKILL_KEYS) {
					const i = this.slotSkill(SKILL_KEYS[k]!);
					if (i >= 0) this.combat.cast(i, this.aimFor(i));
					else useGameStore.getState().toast(`Ô ${SLOT_KEYS[SKILL_KEYS[k]!]} chưa gán chiêu — chọn chiêu ở bảng bên phải`, 'info');
				} else if (k === 'Space') this.combat.dodge(intent);
				else if (k === 'Tab') this.focus = focusCycle(this.combat.focusCandidates(), this.focusTarget(false)?.key ?? null, p.x, p.y);
				else if (k === 'Escape') this.focus = null;
				else if (k === 'KeyR') this.combat.usePotion();
			}
			for (const code of HOLD_REPEAT) {
				if (!this.keyboard.pressed(code) || presses.includes(code)) continue;
				const i = this.slotSkill(SKILL_KEYS[code]!);
				const skill = this.combat.skills[i];
				if (skill && this.combat.knows(skill)) this.combat.cast(i, this.aimFor(i), { repeat: true });
			}
		}

		const moving = !pc.dash && !this.combat.rooted && (intent.x !== 0 || intent.y !== 0);
		if (moving) this.combat.endRecovery();
		const moveDt = moving ? realDt : dt;
		if (moving) {
			const len = Math.hypot(intent.x, intent.y);
			const running = intent.run && pc.stamina > 1;
			const speed = (running ? RUN_SPEED : WALK_SPEED_REFERENCE) * (this.combat.action ? ACTION_MOVE_SCALE : 1) * this.combat.moveScale;
			if (running) pc.stamina = Math.max(0, pc.stamina - 22 * moveDt);
			const dist = speed * moveDt;
			this.world.move(p, (intent.x / len) * dist, (intent.y / len) * dist);
			p.view.set(running ? 'run' : 'walk', directionOf(intent.x, intent.y), speed / WALK_SPEED_REFERENCE);
		} else if (!pc.dash) p.view.set('idle', p.view.direction);

		for (const a of this.actors) a.update(a === p ? moveDt : dt, a === p ? undefined : this.combat.wanderMover);
		const W = this.app.renderer.width;
		const H = this.app.renderer.height;
		this.camera.update(realDt, p.x, p.y - Math.round(p.height / 2), W, H);
		const z = this.camera.zoom;
		const toScreen = (x: number, y: number): { x: number; y: number } => ({ x: this.scene.x + x * z, y: this.scene.y + y * z });
		this.combat.update(dt, toScreen, z, false);
		p.syncGear();
		const flash = this.combat.screenFlash;
		this.flashLayer.clear();
		if (flash.alpha > 0.01) this.flashLayer.rect(0, 0, W, H).fill({ color: flash.color, alpha: flash.alpha });
		this.focusMarker.update(realDt, this.focusTarget(false));
		this.world.ground.update(this.camera.view(W, H));
		this.world.updateOcclusion({ x: p.x, y: p.y, h: p.height + 4 });
		for (const [a, label] of this.labels) {
			const s = toScreen(a.root.x, a.root.y - a.height - (a.wander ? 18 : 12));
			label.position.set(Math.round(s.x), Math.round(s.y));
			label.alpha = a.root.alpha;
		}
		this.hudTimer += realDt;
		if (this.hudTimer > 0.1) {
			this.hudTimer = 0;
			this.pushHud();
		}
	}

	private pushHud(): void {
		if (!this.combat || !this.player) return;
		const pc = this.combat.pc;
		const now = performance.now();
		const tiers = labTiers(this.build);
		const boss = this.combat.enemies.find((f) => f.boss && !f.dead && f.engaged);
		useGameStore.setState({
			stats: {
				...useGameStore.getState().stats,
				name: this.build.path ? `Bạn · ${PATHS[this.build.path].name}` : 'Bạn',
				level: pc.level,
				exp: 0,
				expNext: expForLevel(pc.level),
				hp: Math.ceil(pc.hp),
				hpMax: pc.hpMax,
				mp: Math.floor(pc.mp),
				mpMax: pc.mpMax,
				stamina: Math.floor(pc.stamina),
				staminaMax: pc.staminaMax,
				coins: 0,
				potions: pc.potions,
				...this.combat.sheet,
				dodgeStamina: Math.round(this.combat.dodgeStamina * 100) / 100,
				path: this.build.path ? PATHS[this.build.path].name : '',
				age: 16,
			},
			skills: this.loadout.flatMap((id, slot) => {
				const s = HERO_SKILLS.find((d) => d.id === id);
				if (!s) return [];
				const branch = SKILL_NODE[s.id]?.branch;
				return [
					{
						id: s.id,
						key: SLOT_KEYS[slot]!,
						code: SLOT_CODES[slot]!,
						slot,
						name: s.name,
						element: s.element,
						mpCost: s.mpCost,
						cooldown: Math.round(this.combat.cooldownOf(s) * 100) / 100,
						// 0 = sẵn sàng (không gửi "sẵn sàng lúc này": nút giữ mốc cũ sẽ tưởng còn hồi — lớp tối dày dần sau khi đã hồi xong).
						readyAt: (pc.cooldowns.get(s.id) ?? 0) > this.combat.time ? now + ((pc.cooldowns.get(s.id) ?? 0) - this.combat.time) * 1000 : 0,
						locked: !this.combat.knows(s),
						school: branch ?? 'aether',
						rank: branch ? (tiers[branch] ?? 0) : 0,
						maxRank: branch ? MAX_TIER : 0,
						scale: Math.round(this.combat.skillScaleOf(s) * 100) / 100,
					},
				];
			}),
			boss: boss ? { name: boss.name, hp: Math.ceil(boss.hp), hpMax: boss.hpMax } : null,
		});
	}

	destroy(): void {
		if (this.destroyed) return;
		SkillLab.live.delete(this);
		this.destroyed = true;
		this.resizeObserver?.disconnect();
		this.keyboard?.destroy();
		this.world?.ground.destroy();
		this.app?.destroy(true, { children: true });
	}
}

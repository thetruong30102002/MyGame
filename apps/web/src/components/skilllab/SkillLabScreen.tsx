'use client';

import { useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { HERO_SKILLS, PATHS, type HeroPath } from '@/game/combat/skills';
import { BRANCH_NAME, ENCHANT_ELEMENT_TIER, ENCHANT_SWORD_TIER, ENCHANTS, SLOT_KEYS, SKILL_NODE, SWORD_STYLE_INFO, SWORD_STYLES, type EnchantId, type Loadout, type SwordStyle } from '@/game/combat/talents';
import { EMPTY_BUILD, LAB_COOLDOWN, LAB_LEVEL, labEnchant, labKnown, labPassives, toggleElement, type LabBuild } from '@/game/skillLabBuild';
import type { LabOptions, SkillLab } from '@/game/SkillLab';
import { isStaleChunkError, reloadForStaleBuild } from '@/net/staleBuild';
import { useGameStore } from '@/store/useGameStore';
import { Toasts } from '../Hud';
import { ELEMENT_STYLE, SkillBar } from '../SkillBar';
import { SkillIcon } from '../SkillIcon';
import { TouchControls, useTouchDevice } from '../TouchControls';
import { BootScreen } from '../BootScreen';
import { useMediaQuery } from '../useMediaQuery';

const SKILL_DEF = Object.fromEntries(HERO_SKILLS.map((s) => [s.id, s]));
/** Màu chip từng nguyên tố (khớp `ELEMENT_STYLE` của thanh kỹ năng). */
const ELEMENT_COLOR: Record<EnchantId, string> = { fire: ELEMENT_STYLE.fire.color, water: ELEMENT_STYLE.water.color, wind: ELEMENT_STYLE.wind.color, ice: ELEMENT_STYLE.ice.color, earth: ELEMENT_STYLE.earth.color };

/** Nút bảng bên nhả focus ngay sau khi bấm: Space là phím né — nút còn focus thì Space "bấm" lại nút đó. */
const blurAfter =
	(fn: () => void) =>
	(e: MouseEvent<HTMLButtonElement>): void => {
		fn();
		e.currentTarget.blur();
	};

/**
 * Trang Thử chiêu (`/thu-chieu`, lối vào ở màn đăng nhập): không cần tài khoản. Khung game bên trái là sân tập `SkillLab`
 * (quảng trường Thistlewood, hình nộm, quái gọi ra), bảng bên phải chọn lưu phái Kiếm / nguyên tố / con đường / phủ phép, xem
 * và gán chiêu vào thanh 10 ô. Không lưu gì — tải lại trang là về bộ trống.
 */
export function SkillLabScreen() {
	const host = useRef<HTMLDivElement>(null);
	const lab = useRef<SkillLab | null>(null);
	const status = useGameStore((s) => s.status);
	const error = useGameStore((s) => s.error);
	const touch = useTouchDevice();
	const wide = useMediaQuery('(min-width: 1100px)');
	const [open, setOpen] = useState(false);
	const [build, setBuildState] = useState<LabBuild>(EMPTY_BUILD);
	const [options, setOptionsState] = useState<LabOptions>({ infiniteMp: true, immortal: true });
	const [loadout, setLoadout] = useState<Loadout>([]);
	const [picked, setPicked] = useState<string | null>(null);
	const [mob, setMob] = useState('mob_mushroom_001');
	const [mobs, setMobs] = useState<{ id: string; name: string }[]>([]);

	useEffect(() => setOpen(wide), [wide]);

	useEffect(() => {
		const ctrl = new AbortController();
		let made: SkillLab | null = null;
		import('@/game/SkillLab')
			.then(({ SkillLab, LAB_MOBS }) => {
				setMobs(LAB_MOBS);
				return ctrl.signal.aborted ? null : SkillLab.start(host.current!, ctrl.signal);
			})
			.then((l) => {
				if (!l) return;
				if (ctrl.signal.aborted) return l.destroy();
				made = l;
				lab.current = l;
				setLoadout(l.currentLoadout);
			})
			.catch((e: unknown) => {
				if (ctrl.signal.aborted) return;
				if (isStaleChunkError(e) && reloadForStaleBuild()) return;
				useGameStore.setState({ status: 'error', error: e instanceof Error ? e.message : String(e) });
			});
		return () => {
			ctrl.abort();
			made?.destroy();
			lab.current = null;
		};
	}, []);

	// Bộ chọn mới nhất (ref): hai cú bấm trong cùng một nhịp vẽ không được đọc bản cũ của nhau.
	const buildRef = useRef(build);
	const update = (fn: (b: LabBuild) => LabBuild): void => setBuild(fn(buildRef.current));
	const setBuild = (b: LabBuild): void => {
		const next = { ...b, enchant: labEnchant(b) };
		buildRef.current = next;
		setBuildState(next);
		setPicked(null);
		lab.current?.setBuild(next);
		if (lab.current) setLoadout(lab.current.currentLoadout);
	};
	const setOption = (k: keyof LabOptions): void => {
		const next = { ...options, [k]: !options[k] };
		setOptionsState(next);
		if (lab.current) lab.current.options = next;
	};
	const assign = (slot: number): void => {
		if (!picked || !lab.current) return;
		lab.current.setSlot(slot, picked);
		setLoadout(lab.current.currentLoadout);
		setPicked(null);
	};

	const known = useMemo(() => labKnown(build), [build]);
	const passives = useMemo(() => labPassives(build), [build]);

	return (
		<main className="relative h-dvh w-dvw touch-none overflow-hidden overscroll-none bg-[#1d130b]">
			<div ref={host} className="absolute inset-0 overflow-hidden" />
			{status === 'ready' && (
				<div className="pointer-events-none absolute inset-0 select-none">
					<div className="pointer-events-auto absolute left-[max(12px,env(safe-area-inset-left))] top-[max(12px,env(safe-area-inset-top))] flex flex-col items-start gap-2">
						<a href="/" className="ui-plank rounded-full px-3 py-1 text-body font-extrabold text-parchment hover:brightness-110">
							← Về màn đăng nhập
						</a>
						<PlayerBars />
					</div>
					<div className="absolute top-[max(56px,env(safe-area-inset-top))] w-[min(420px,calc(100vw-24px))] -translate-x-1/2" style={{ left: open && wide ? 'calc((100vw - 392px) / 2)' : '50%' }}>
						<Toasts max={3} center />
					</div>
					{!touch && (
						<div className="absolute bottom-3 z-[11] flex w-max -translate-x-1/2 flex-col items-center gap-2" style={{ left: open && wide ? 'calc((100vw - 392px) / 2)' : '50%' }}>
							<SkillBar />
						</div>
					)}
				</div>
			)}
			{status === 'ready' && <TouchControls />}
			{status === 'ready' && (
				<button
					type="button"
					onClick={blurAfter(() => setOpen((v) => !v))}
					aria-expanded={open}
					className="ui-plank absolute right-[max(12px,env(safe-area-inset-right))] top-[max(12px,env(safe-area-inset-top))] z-20 rounded-full px-3 py-1 text-body font-extrabold text-parchment hover:brightness-110"
				>
					{open ? 'Ẩn bảng ✕' : 'Chọn chiêu ☰'}
				</button>
			)}
			{status === 'ready' && open && (
				<aside className="ui-frame absolute bottom-3 right-3 top-14 z-10 flex w-[min(380px,calc(100vw-24px))] flex-col overflow-hidden px-1 pb-1 pt-1 text-ink-brown">
					<div className="overflow-y-auto overscroll-contain px-2 pb-2">
						<h1 className="font-display text-head font-extrabold">Thử chiêu</h1>
						<p className="mb-3 text-note text-ink-soft">
							Sân tập không cần tài khoản, không lưu gì. Nhân vật cấp {LAB_LEVEL}, mọi nhánh đã chọn lên mốc 10 — có cả tuyệt kỹ (chỉ thử được ở đây, game thật chưa mở mốc 10). Mọi chiêu hồi tối đa {LAB_COOLDOWN} giây.
						</p>

						<Section title="Kiếm phái" note={build.style ? SWORD_STYLE_INFO[build.style].play : 'Chưa chọn: chỉ có Trảm (J). Chọn một lưu phái để thử bộ chiêu Kiếm.'}>
							<Chip pressed={!build.style} onClick={() => update((b) => ({ ...b, style: null }))}>
								Không
							</Chip>
							{SWORD_STYLES.map((s: SwordStyle) => (
								<Chip key={s} pressed={build.style === s} onClick={() => update((b) => ({ ...b, style: s }))}>
									{SWORD_STYLE_INFO[s].name}
								</Chip>
							))}
						</Section>

						<Section title="Nguyên tố" note="Chọn một hoặc nhiều — đánh hai hệ lên cùng mục tiêu để thấy phản ứng (Hoả + Thuỷ = Bốc Hơi…).">
							{ENCHANTS.map((e) => (
								<Chip key={e} pressed={build.elements.includes(e)} color={ELEMENT_COLOR[e]} onClick={() => update((b) => toggleElement(b, e))}>
									{BRANCH_NAME[e]}
								</Chip>
							))}
						</Section>

						{build.style && build.elements.length > 0 && (
							<Section title="Phủ phép kiếm" note={`Đòn Kiếm mang hệ đã chọn (cần Kiếm mốc ${ENCHANT_SWORD_TIER} + nguyên tố mốc ${ENCHANT_ELEMENT_TIER}). Có thêm kiếm pháp nguyên tố trong danh sách chiêu.`}>
								<Chip pressed={!build.enchant} onClick={() => update((b) => ({ ...b, enchant: null }))}>
									Tắt
								</Chip>
								{build.elements.map((e) => (
									<Chip key={e} pressed={build.enchant === e} color={ELEMENT_COLOR[e]} onClick={() => update((b) => ({ ...b, enchant: e }))}>
										{BRANCH_NAME[e]}
									</Chip>
								))}
							</Section>
						)}

						<Section title="Con đường" note={build.path ? `Kiếm ×${PATHS[build.path].sword} · phép ×${PATHS[build.path].magic}` : 'Không chọn: kiếm và phép cân bằng.'}>
							<Chip pressed={!build.path} onClick={() => update((b) => ({ ...b, path: null }))}>
								Không
							</Chip>
							{(['sword', 'mage'] as HeroPath[]).map((p) => (
								<Chip key={p} pressed={build.path === p} onClick={() => update((b) => ({ ...b, path: p }))}>
									{PATHS[p].name}
								</Chip>
							))}
						</Section>

						<Section title={`Chiêu đã học (${known.length})`} note={picked ? `Chọn phím cho “${SKILL_DEF[picked]?.name}”:` : 'Bấm một chiêu rồi chọn phím để gán vào thanh.'}>
							{picked && (
								<div className="mb-1 flex w-full flex-wrap gap-1">
									{SLOT_KEYS.map((k, i) => (
										<Chip key={k} onClick={() => assign(i)}>
											{k}
										</Chip>
									))}
									<Chip onClick={() => setPicked(null)}>Huỷ</Chip>
								</div>
							)}
							<ul className="flex w-full flex-col gap-1">
								{known.map((id) => {
									const s = SKILL_DEF[id]!;
									const slot = loadout.indexOf(id);
									const branch = SKILL_NODE[id]?.branch;
									const el = ELEMENT_STYLE[s.element] ?? ELEMENT_STYLE.aether;
									return (
										<li key={id}>
											<button
												type="button"
												aria-pressed={picked === id}
												onClick={blurAfter(() => setPicked(picked === id ? null : id))}
												className={`ui-paper flex w-full items-start gap-2 px-2 py-1.5 text-left hover:brightness-105 ${picked === id ? 'outline-2 outline-amber' : ''}`}
											>
												<span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-paper-sunk">
													<SkillIcon skillId={id} box={32} />
												</span>
												<span className="min-w-0 flex-1">
													<span className="flex items-center gap-1.5">
														<span className="font-display text-body font-extrabold">{s.name}</span>
														<span className="text-chip font-bold" style={{ color: el.ink }}>
															{branch ? BRANCH_NAME[branch] : 'Bẩm sinh'}
															{SKILL_NODE[id] ? ` · mốc ${SKILL_NODE[id]!.tier}` : ''}
														</span>
													</span>
													{s.desc && <span className="block text-note leading-snug text-ink-soft">{s.desc}</span>}
													<span className="block text-chip text-ink-faint">
														{s.mpCost ? `${s.mpCost} MP` : 'Không tốn MP'} · hồi {String(Math.min(s.cooldown, LAB_COOLDOWN)).replace('.', ',')} giây
														{s.cooldown > LAB_COOLDOWN ? ` (game thật ${String(s.cooldown).replace('.', ',')} giây)` : ''}
													</span>
												</span>
												<span className={`mt-0.5 flex h-6 min-w-6 items-center justify-center rounded-[5px] border-2 border-outline px-1 text-chip font-extrabold ${slot >= 0 ? '' : 'opacity-30'}`} style={{ background: slot >= 0 ? el.color : undefined }}>
													{slot >= 0 ? SLOT_KEYS[slot] : '—'}
												</span>
											</button>
										</li>
									);
								})}
							</ul>
						</Section>

						{passives.length > 0 && (
							<Section title="Bị động đang có">
								<ul className="flex w-full flex-col gap-1">
									{passives.map(({ branch, node }) => (
										<li key={`${branch}-${node.tier}`} className="text-note leading-snug">
											<span className="font-extrabold">{node.name}</span>
											<span className="text-ink-faint">
												{' '}
												({BRANCH_NAME[branch]} mốc {node.tier})
											</span>
											<span className="text-ink-soft"> — {node.desc}</span>
										</li>
									))}
								</ul>
							</Section>
						)}

						<Section title="Sân tập" note="Ba hình nộm đứng sẵn (hiện số sát thương và phản ứng). Gọi quái để thử khống chế, đẩy lùi, đóng băng.">
							<select value={mob} onChange={(e) => setMob(e.target.value)} className="ui-paper h-9 flex-1 px-2 text-body font-bold">
								{mobs.map((m) => (
									<option key={m.id} value={m.id}>
										{m.name}
									</option>
								))}
							</select>
							<Chip onClick={() => void lab.current?.spawnMobs(mob)}>Gọi quái</Chip>
							<Chip onClick={() => lab.current?.clearArena()}>Dọn sân</Chip>
							<Chip onClick={() => lab.current?.resetPlayer()}>Về chỗ cũ</Chip>
							<div className="mt-1 flex w-full flex-wrap gap-1">
								<Chip pressed={options.infiniteMp} onClick={() => setOption('infiniteMp')}>
									Vô hạn MP
								</Chip>
								<Chip pressed={options.immortal} onClick={() => setOption('immortal')}>
									Bất tử
								</Chip>
							</div>
						</Section>

						<Section title="Phím">
							<p className="text-note leading-snug text-ink-soft">
								WASD / mũi tên đi · Shift chạy · Space né · nhấp quái / hình nộm để chọn mục tiêu (mũi tên đỏ trên đầu), Tab đổi mục tiêu, Esc bỏ chọn · J, K, 1–8 dùng chiêu, tự nhắm vào mục tiêu (chưa chọn thì nhắm con gần nhất; giữ J / K đánh liên tục). Màn
								cảm ứng: chạm quái để chọn, nút vòng tròn ba mũi tên đổi mục tiêu, cần gạt + nút chiêu góc phải.
							</p>
						</Section>
					</div>
				</aside>
			)}
			{status !== 'ready' && <BootScreen text={status === 'error' ? `Ối, có lỗi: ${error}` : 'Đang dựng sân tập…'} error={status === 'error'} />}
		</main>
	);
}

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
	return (
		<section className="mb-3">
			<h2 className="mb-1 font-display text-label font-extrabold">{title}</h2>
			<div className="flex flex-wrap items-center gap-1">{children}</div>
			{note && <p className="mt-1 text-note leading-snug text-ink-soft">{note}</p>}
		</section>
	);
}

function Chip({ pressed, color, onClick, children }: { pressed?: boolean; color?: string; onClick: () => void; children: ReactNode }) {
	return (
		<button type="button" aria-pressed={pressed} onClick={blurAfter(onClick)} className="ui-chip gap-1.5 px-3 py-1 text-body font-bold">
			{color && <span className="h-2.5 w-2.5 rounded-full border border-outline" style={{ background: color }} />}
			{children}
		</button>
	);
}

/** Máu / MP / thể lực gọn ở góc trái (sân tập không có bảng tên đầy đủ của HUD). */
function PlayerBars() {
	const st = useGameStore((s) => s.stats);
	const bar = (v: number, max: number, color: string, label: string): ReactNode => (
		<div className="flex items-center gap-2">
			<span className="w-14 text-chip font-extrabold text-parchment">{label}</span>
			<div className="h-2.5 w-36 overflow-hidden rounded-full bg-black/50">
				<div className="h-full rounded-full" style={{ width: `${max ? Math.max(0, Math.min(1, v / max)) * 100 : 0}%`, background: color }} />
			</div>
			<span className="text-chip tabular-nums text-parchment">
				{v}/{max}
			</span>
		</div>
	);
	return (
		<div className="ui-plank flex flex-col gap-1 rounded-xl px-3 py-2">
			<p className="font-display text-body font-extrabold text-parchment">
				{st.name} · Cấp {st.level}
			</p>
			{bar(st.hp, st.hpMax, 'var(--color-hp)', 'Máu')}
			{bar(st.mp, st.mpMax, 'var(--color-mana)', 'MP')}
			{bar(st.stamina, st.staminaMax, 'var(--color-stamina)', 'Thể lực')}
		</div>
	);
}

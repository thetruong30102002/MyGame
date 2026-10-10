'use client';

import { useEffect, useState } from 'react';
import { MAX_CHARACTERS, NAME_MAX, validateName, type CharacterInfo, type Gender } from '@aether/protocol';
import { PATHS, type HeroPath } from '@/game/combat/skills';
import { useSession } from '@/store/useSession';
import { Alert, Backdrop, Field, TitleBanner } from './AuthScreen';

const GENDER_LABEL: Record<Gender, string> = { male: 'Nam', female: 'Nữ' };
/** Cạnh ô chân dung (px). 96 là bội nguyên của cả mặt trẻ (32) lẫn người lớn (48) — xem `portraitSide`. */
const CARD_BOX = 96;
const PREVIEW_BOX = 128;

// ---- Dữ liệu cho thẻ nhân vật -----------------------------------------------------------------

/** Phần cần đọc trong `progress.story` (StoryDirector.SaveData) — máy chủ lưu nguyên khối, không kiểm kiểu. */
function storyOf(c: CharacterInfo): { age: number | null; path: HeroPath | null } {
	const s = c.progress.story as { age?: unknown; path?: unknown } | null;
	return {
		age: s && typeof s.age === 'number' ? s.age : null,
		path: s && (s.path === 'sword' || s.path === 'mage') ? s.path : null,
	};
}

/** Tuổi khi còn nhỏ, con đường (Kiếm sĩ / Pháp sư) khi đã trưởng thành. */
function stageLabel(age: number | null, path: HeroPath | null): string {
	if (age === null) return 'Mới tạo';
	if (age < 16) return `${age} tuổi`;
	return path ? PATHS[path].name : 'Trưởng thành';
}

let portraitsCache: Record<string, string> | null = null;
let portraitsPromise: Promise<Record<string, string>> | null = null;

/** Chân dung từ manifest (id nhân vật → URL). `no-cache` như Game: pipeline xuất lại thì thấy ngay. */
function loadPortraits(): Promise<Record<string, string>> {
	portraitsPromise ??= fetch('/assets/manifest.json', { cache: 'no-cache' })
		.then((r) => {
			if (!r.ok) throw new Error(`manifest HTTP ${r.status}`);
			return r.json() as Promise<{ characters?: Record<string, { portrait?: string | null }> }>;
		})
		.then((m) => {
			portraitsCache = Object.fromEntries(Object.entries(m.characters ?? {}).flatMap(([id, c]) => (c.portrait ? [[id, `/assets/${c.portrait}`]] : [])));
			return portraitsCache;
		});
	portraitsPromise.catch(() => {
		portraitsPromise = null;
	});
	return portraitsPromise;
}

/** null = manifest đang tải (ô chân dung để trống, không chớp sang ảnh tạm rồi đổi). */
function usePortraits(): Record<string, string> | null {
	const [portraits, setPortraits] = useState(portraitsCache);
	useEffect(() => {
		if (portraits) return;
		let live = true;
		loadPortraits().then(
			(p) => live && setPortraits(p),
			// Không tải được manifest: dùng chân dung vẽ tay cũ, đừng để ô trống mãi.
			() => live && setPortraits({}),
		);
		return () => {
			live = false;
		};
	}, [portraits]);
	return portraits;
}

/**
 * Cùng luật với Game.playerSpriteFor / playerPortrait: dưới 16 tuổi là Lior bé, từ 16 là người lớn
 * (`STORY.playerByAge`), nữ dùng bản `_f` khi manifest có. Chưa có bản lưu = mới tạo = còn nhỏ.
 */
function portraitSrc(portraits: Record<string, string>, gender: Gender, age: number | null): string {
	const base = age !== null && age >= 16 ? 'player_hero_adult' : 'player_lior_child';
	const own = (gender === 'female' && portraits[`${base}_f`]) || portraits[base];
	return own ?? (gender === 'female' ? '/assets/portraits/hero-child-female.png' : '/assets/portraits/lior-child.png');
}

const worldCache = new Map<string, Promise<Record<string, string>>>();

/** Tên các bản đồ của một vùng (world.json): `town` → "Thistlewood". */
function loadMapNames(region: string): Promise<Record<string, string>> {
	let p = worldCache.get(region);
	if (!p) {
		p = fetch(`/assets/maps/${region}/world.json`)
			.then((r) => {
				if (!r.ok) throw new Error(`world.json HTTP ${r.status}`);
				return r.json() as Promise<{ maps?: Record<string, { name?: string }> }>;
			})
			.then((w) => Object.fromEntries(Object.entries(w.maps ?? {}).flatMap(([id, m]) => (m.name ? [[id, m.name]] : []))));
		p.catch(() => worldCache.delete(region));
		worldCache.set(region, p);
	}
	return p;
}

/** `progress.map` ("human/town") → tên hiển thị. Thiếu dữ liệu thì thẻ chỉ bỏ dòng bản đồ. */
function useMapNames(characters: CharacterInfo[]): Record<string, string> {
	const [names, setNames] = useState<Record<string, string>>({});
	// Vùng lấy từ dữ liệu người chơi gửi lên nên chỉ nhận tên an toàn trước khi ghép vào URL.
	const regions = [...new Set(characters.map((c) => (typeof c.progress.map === 'string' ? c.progress.map.split('/')[0] : '')))].filter((r): r is string => !!r && /^[a-z0-9_-]+$/.test(r)).join(',');
	useEffect(() => {
		if (!regions) return;
		let live = true;
		for (const region of regions.split(',')) {
			loadMapNames(region).then(
				(m) => live && setNames((prev) => ({ ...prev, ...Object.fromEntries(Object.entries(m).map(([id, n]) => [`${region}/${id}`, n])) })),
				() => undefined,
			);
		}
		return () => {
			live = false;
		};
	}, [regions]);
	return names;
}

// ---- Chân dung ---------------------------------------------------------------------------------

/** Chân dung pipeline là mặt cắt vuông phóng 3 lần (asset-pipeline `facePortrait`). */
const PORTRAIT_UPSCALE = 3;

/**
 * Cạnh hiển thị = cạnh GỐC × số nguyên gần `box` nhất (lệch vài px thì ô cắt bớt mép): 32×3 = 96, 33×3 = 99,
 * 48×2 = 96, 47×2 = 94. Phóng lẻ (vd 144 → 100) làm điểm ảnh to nhỏ không đều.
 */
function portraitSide(fileSide: number, box: number): number {
	const native = fileSide % PORTRAIT_UPSCALE === 0 ? fileSide / PORTRAIT_UPSCALE : fileSide;
	return native * Math.max(1, Math.round(box / native));
}

function Portrait({ src, box, alt }: { src: string | null; box: number; alt: string }) {
	const [loaded, setLoaded] = useState<{ src: string; side: number } | null>(null);
	const side = loaded?.src === src ? loaded.side : null;
	return (
		<div className="flex shrink-0 items-center justify-center overflow-hidden" style={{ width: box, height: box }}>
			{src && (
				<img
					key={src}
					src={src}
					alt={alt}
					draggable={false}
					onLoad={(e) => setLoaded({ src, side: portraitSide(e.currentTarget.naturalWidth, box) })}
					className="pixel-img max-w-none shrink-0"
					// Chưa biết cỡ gốc thì ẩn: hiện tạm ở cỡ ô là một khung hình phóng lẻ rồi giật sang cỡ đúng.
					style={side ? { width: side, height: side } : { width: box, height: box, opacity: 0 }}
				/>
			)}
		</div>
	);
}

// ---- Màn hình ----------------------------------------------------------------------------------

export function CharacterSelect() {
	const { characters, username, busy, error, notice, play, logout, createCharacter, deleteCharacter, clearNotice } = useSession();
	const [creating, setCreating] = useState(characters.length === 0);
	const [name, setName] = useState('');
	const [gender, setGender] = useState<Gender>('male');
	const [localError, setLocalError] = useState<string | null>(null);
	const [confirmId, setConfirmId] = useState<string | null>(null);
	const portraits = usePortraits();
	const mapNames = useMapNames(characters);
	// Xoá hết nhân vật thì không còn gì để chọn: mở thẳng form tạo.
	const showCreate = creating || characters.length === 0;

	useEffect(() => {
		if (!confirmId) return;
		const onKey = (e: KeyboardEvent): void => {
			if (e.key === 'Escape') setConfirmId(null);
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [confirmId]);

	const create = async (e: React.FormEvent): Promise<void> => {
		e.preventDefault();
		if (busy) return;
		// NFC như máy chủ: bộ gõ tách dấu (e + ◌́) mà không gộp lại thì đếm độ dài lệch với máy chủ.
		const n = name.normalize('NFC').trim().replace(/\s+/g, ' ');
		const err = validateName(n);
		setLocalError(err);
		if (err) return;
		if (await createCharacter(n, gender)) {
			setCreating(false);
			setName('');
		}
	};

	const remove = async (id: string): Promise<void> => {
		await deleteCharacter(id);
		setConfirmId(null);
	};

	const formError = localError ?? error;
	const freeSlots = MAX_CHARACTERS - characters.length;
	return (
		<Backdrop>
			<div className="flex w-full max-w-xl flex-col items-center">
				<TitleBanner size="md" text={showCreate ? 'Tạo nhân vật' : characters.length > 1 ? 'Chọn nhân vật' : 'Nhân vật của bạn'} />
				<div className="ui-frame w-full px-3 pb-4 pt-7 sm:px-4">
					<div className="mb-4 flex items-center justify-between gap-3 border-b-2 border-paper-line pb-3 text-body text-ink-soft">
						<p className="min-w-0 truncate leading-[1.45]">
							{username && (
								<>
									Xin chào, <b className="text-ink-brown">{username}</b>!
								</>
							)}
						</p>
						<button type="button" onClick={() => void logout()} disabled={busy} className="ui-chip shrink-0">
							Đăng xuất
						</button>
					</div>

					{notice && (
						<Alert tone="notice" onDismiss={clearNotice}>
							{notice}
						</Alert>
					)}

					{showCreate ? (
						<form onSubmit={(e) => void create(e)} noValidate aria-busy={busy} className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
							<div className="flex shrink-0 flex-col items-center gap-3">
								<div className="ui-slot">
									<Portrait src={portraits && portraitSrc(portraits, gender, null)} box={PREVIEW_BOX} alt={gender === 'female' ? 'Nhân vật nữ' : 'Nhân vật nam'} />
								</div>
								<div role="radiogroup" aria-label="Giới tính" className="grid w-full grid-cols-2 gap-2">
									{(['male', 'female'] as const).map((g) => (
										<button key={g} type="button" role="radio" aria-checked={gender === g} onClick={() => setGender(g)} className="ui-chip">
											{GENDER_LABEL[g]}
										</button>
									))}
								</div>
							</div>
							<div className="w-full min-w-0 flex-1">
								<Field
									label="Tên của bạn"
									hint={`3–${NAME_MAX} chữ, gõ có dấu thoải mái`}
									name="character-name"
									value={name}
									onChange={setName}
									maxLength={NAME_MAX}
									autoComplete="off"
									autoCapitalize="words"
									autoCorrect="off"
									spellCheck={false}
									enterKeyHint="done"
								/>
								<p className="mb-3 text-body leading-relaxed text-ink-soft">
									Bạn sẽ lớn lên ở thị trấn Thistlewood, giữa thế giới Aetheria. Ai gặp cũng gọi bạn bằng tên này. Chưa cần chọn nghề: kiếm hay phép, cứ đi rồi học dần. Mỗi tài khoản chỉ có một nhân vật.
								</p>
								{formError && <Alert>{formError}</Alert>}
								<div className="flex gap-2">
									<button type="submit" disabled={busy} className="ui-btn flex-1 text-[16px]">
										{busy ? 'Đang tạo…' : 'Tạo nhân vật'}
									</button>
									{characters.length > 0 && (
										<button type="button" onClick={() => (setCreating(false), setLocalError(null))} disabled={busy} className="ui-chip min-h-[39px]">
											Thôi
										</button>
									)}
								</div>
							</div>
						</form>
					) : (
						<>
							<ul className="grid gap-3">
								{characters.map((c) => {
									const { age, path } = storyOf(c);
									const mapName = mapNames[c.progress.map];
									const confirming = confirmId === c.id;
									return (
										<li key={c.id} className={`ui-paper grid grid-cols-[auto_1fr] gap-x-3 gap-y-3 p-3 ${confirming ? 'border-berry bg-[#f9e1d6]' : ''}`}>
											<div className="ui-slot relative shrink-0 self-start">
												<Portrait src={portraits && portraitSrc(portraits, c.gender, age)} box={CARD_BOX} alt="" />
												<span className="ui-key absolute -bottom-2 -right-2 tabular-nums">Cấp {c.progress.level}</span>
											</div>
											<div className="flex min-w-0 flex-col">
												<div className="flex min-w-0 items-start gap-2">
													<p className="min-w-0 flex-1 font-display text-[22px] leading-[28px] max-[400px]:text-[18px] max-[400px]:leading-[24px] font-extrabold break-words line-clamp-2">{c.name}</p>
													{!confirming && (
														<button
															type="button"
															onClick={() => setConfirmId(c.id)}
															disabled={busy}
															aria-label={`Xoá nhân vật ${c.name}`}
															className="relative mt-1.5 shrink-0 text-note font-bold text-ink-faint underline underline-offset-2 before:absolute before:-inset-3 hover:text-berry disabled:opacity-50"
														>
															Xoá
														</button>
													)}
												</div>
												<p className="text-body text-ink-soft">{[stageLabel(age, path), mapName].filter(Boolean).join(' · ')}</p>
											</div>
											{confirming ? (
												<div className="col-span-2 flex flex-wrap items-center gap-2">
													<p className="w-full text-body font-bold text-berry">Xoá hẳn {c.name}? Cả hành trình sẽ mất, không lấy lại được. Xoá xong mới tạo được nhân vật mới.</p>
													<button type="button" autoFocus onClick={() => setConfirmId(null)} disabled={busy} className="ui-chip">
														Giữ lại
													</button>
													<button type="button" onClick={() => void remove(c.id)} disabled={busy} className="ui-chip ui-chip-danger">
														{busy ? 'Đang xoá…' : 'Xoá hẳn'}
													</button>
												</div>
											) : (
												<button type="button" onClick={() => play(c)} disabled={busy} className="ui-btn col-span-2 w-full text-[16px]">
													Lên đường
												</button>
											)}
										</li>
									);
								})}
								{freeSlots > 0 && (
									<li className="ui-tray flex flex-col items-center justify-center gap-2 p-3">
										<p className="text-body font-bold text-ink-soft">Còn trống chỗ cho nhân vật</p>
										<button type="button" onClick={() => (setCreating(true), setConfirmId(null))} disabled={busy} className="ui-chip">
											Tạo thêm nhân vật
										</button>
									</li>
								)}
							</ul>
							{error && (
								<div className="mt-3">
									<Alert>{error}</Alert>
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</Backdrop>
	);
}

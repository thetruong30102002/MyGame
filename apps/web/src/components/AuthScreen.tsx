'use client';

import { useEffect, useState, type CSSProperties, type InputHTMLAttributes, type ReactNode } from 'react';
import { validatePassword, validateUsername } from '@aether/protocol';
import { useSession } from '@/store/useSession';
import { useViewport } from './useMediaQuery';

/** Màn đăng nhập / đăng ký tài khoản. Kiểm tra định dạng ngay ở client bằng đúng luật của máy chủ. */
export function AuthScreen() {
	const login = useSession((s) => s.login);
	const busy = useSession((s) => s.busy);
	const serverError = useSession((s) => s.error);
	// Tên đăng nhập lần trước (useSession giữ ở localStorage): đăng xuất / hết phiên xong chỉ phải gõ lại mật khẩu.
	const lastUsername = useSession((s) => s.username);
	const [mode, setMode] = useState<'login' | 'register'>('login');
	const [username, setUsername] = useState(lastUsername);
	const [password, setPassword] = useState('');
	const [confirm, setConfirm] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [localError, setLocalError] = useState<string | null>(null);

	const switchMode = (m: 'login' | 'register'): void => {
		setMode(m);
		setLocalError(null);
		// Lỗi máy chủ của chế độ kia ("Sai mật khẩu" khi đang ở thẻ Tạo tài khoản) chỉ gây rối.
		useSession.setState({ error: null });
	};

	const submit = (e: React.FormEvent): void => {
		e.preventDefault();
		if (busy) return;
		const u = username.trim().toLowerCase();
		// Luật độ dài mật khẩu chỉ áp khi ĐĂNG KÝ: đăng nhập để máy chủ tự đối chiếu (tài khoản seed tay có
		// thể có mật khẩu ngắn hơn luật), chặn ở đây là khoá người ta ngoài tài khoản của chính mình.
		const err =
			validateUsername(u) ??
			(mode === 'register' ? (validatePassword(password) ?? (password !== confirm ? 'Hai lần gõ mật khẩu chưa giống nhau' : null)) : password ? null : 'Bạn chưa gõ mật khẩu');
		setLocalError(err);
		if (!err) void login(u, password, mode === 'register');
	};

	const error = localError ?? serverError;
	const passwordType = showPassword ? 'text' : 'password';
	return (
		<Backdrop>
			<div className="flex w-full max-w-sm flex-col items-center">
				<TitleBanner />
				<form onSubmit={submit} noValidate aria-busy={busy} className="ui-frame w-full px-4 pb-4 pt-6 sm:px-5">
					<Subtitle />
					<div role="tablist" aria-label="Chọn việc cần làm" className="ui-tabs mb-4">
						{(['login', 'register'] as const).map((m) => (
							<button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => switchMode(m)} className="ui-tab flex-1 justify-center px-3">
								{m === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
							</button>
						))}
					</div>
					<Field label="Tên đăng nhập" name="username" value={username} onChange={setUsername} autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="next" />
					<Field
						label="Mật khẩu"
						name="password"
						value={password}
						onChange={setPassword}
						type={passwordType}
						autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
						autoCapitalize="none"
						autoCorrect="off"
						spellCheck={false}
						enterKeyHint={mode === 'login' ? 'go' : 'next'}
						trailing={<RevealToggle shown={showPassword} onToggle={() => setShowPassword((v) => !v)} />}
					/>
					{mode === 'register' && (
						<Field label="Nhập lại mật khẩu" name="confirm-password" value={confirm} onChange={setConfirm} type={passwordType} autoComplete="new-password" autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="go" />
					)}
					{error && <Alert>{error}</Alert>}
					<button type="submit" disabled={busy} className="ui-btn mt-1 w-full text-[16px]">
						{busy ? 'Đang mở cổng…' : mode === 'login' ? 'Vào thế giới' : 'Tạo tài khoản'}
					</button>
				</form>
			</div>
		</Backdrop>
	);
}

/** Nút hiện/ẩn mật khẩu nằm trong ô nhập. */
function RevealToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
	return (
		<button
			type="button"
			onClick={onToggle}
			// Giữ focus ở ô mật khẩu: trên điện thoại mất focus là bàn phím sập xuống giữa lúc đang gõ.
			onMouseDown={(e) => e.preventDefault()}
			aria-pressed={shown}
			aria-label={shown ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
			className="min-w-14 px-3 text-note font-extrabold text-amber transition-colors hover:text-ink-brown"
		>
			{shown ? 'Ẩn' : 'Hiện'}
		</button>
	);
}

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'className'> & {
	label: string;
	value: string;
	onChange: (v: string) => void;
	/** Phần tử nằm trong ô, sát mép phải (vd nút hiện mật khẩu). */
	trailing?: ReactNode;
	/** Dòng gợi ý nhỏ dưới ô. */
	hint?: string;
};

/**
 * Ô nhập giấy sáng, chữ 16px (dưới 16px Safari iOS tự phóng trang khi focus), line-height 1.5 để dấu Ẫ Ộ không bị xén.
 * Thuộc tính `<input>` khác (autoComplete, autoCapitalize…) truyền thẳng xuống.
 */
export function Field({ label, value, onChange, trailing, hint, type = 'text', ...rest }: FieldProps) {
	return (
		<label className="mb-3 block">
			<span className="mb-1 block text-body font-bold text-ink-brown">{label}</span>
			<span className="relative block">
				<input
					{...rest}
					type={type}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className={`w-full rounded-[6px] border-2 border-paper-line bg-paper-hi px-3 py-2.5 text-[16px] leading-6 text-ink-brown transition-[border-color] outline-none placeholder:text-ink-faint focus:border-amber ${trailing ? 'pr-16' : ''}`}
				/>
				{trailing && <span className="absolute inset-y-0 right-0 flex">{trailing}</span>}
			</span>
			{hint && <span className="mt-1 block text-note text-ink-soft">{hint}</span>}
		</label>
	);
}

/** Hộp báo trên nền giấy: `error` hồng đất viền đỏ, `notice` vàng mật (vd lý do bị đưa ra khỏi game). */
export function Alert({ tone = 'error', children, onDismiss }: { tone?: 'error' | 'notice'; children: ReactNode; onDismiss?: () => void }) {
	const look = tone === 'error' ? 'border-[#b22911] bg-[#f6d6c8] text-[#6e1a0e]' : 'border-[#a8792c] bg-[#f6e3a8] text-ink-brown';
	return (
		<div role={tone === 'error' ? 'alert' : 'status'} className={`mb-3 flex items-start gap-2 rounded-[6px] border-2 px-3 py-2 text-body ${look}`}>
			<p className="min-w-0 flex-1 py-px">{children}</p>
			{onDismiss && (
				<button type="button" onClick={onDismiss} aria-label="Đóng thông báo" className="-my-1 shrink-0 px-1 py-1 text-note font-bold text-ink-soft hover:text-ink-brown">
					Đóng
				</button>
			)}
		</div>
	);
}

/**
 * Tiêu đề trên dải cuộn giấy, đè lên mép trên khung bên dưới (lề âm). Cỡ `lg` cho tên game: `tracking` rộng để
 * thừa một khoảng sau chữ cuối nên lề trái cộng thêm đúng khoảng đó cho chữ nằm giữa cuộn. Cỡ `md` cho tên màn
 * (chữ dài, phải vừa điện thoại 360px).
 * Chiều cao ghim đúng NGUYÊN lần banner.png (57px): để chữ tự quyết thì dải giữa 9px của ảnh bị kéo ×2,9–3,8. `lg` vẽ
 * gấp đôi (114px, viền 48/40) — viền dày thêm 20px mỗi bên nên lề trong bớt đúng chừng đó, bề ngang vẫn như cũ.
 */
export function TitleBanner({ text = 'AETHER', size = 'lg' }: { text?: string; size?: 'lg' | 'md' }) {
	const lg = size === 'lg';
	// Giãn chữ chỉ còn ở logo; `.ui-banner` nay nằm trong @layer components nên lớp `tracking-*` đè được.
	const look = lg ? '-mb-9 pr-1 pl-[calc(0.25rem_+_0.28em)] text-[34px] tracking-[0.28em]' : '-mb-7 h-[57px] px-5 text-title tracking-[0.03em]';
	// Viền 2× của logo: `border-image-width` không có lớp tiện ích nên vẫn đặt inline.
	const style: CSSProperties | undefined = lg ? { height: 114, borderWidth: '48px 40px', borderImageWidth: '48px 40px' } : undefined;
	return (
		<h1 className={`ui-banner relative z-10 max-w-full ${look}`} style={style}>
			{text}
		</h1>
	);
}

export function Subtitle() {
	return <p className="mb-3 text-center font-display text-label font-bold text-ink-soft">Biên niên sử Aether</p>;
}

/**
 * Nền chung của đăng nhập / chọn nhân vật / màn chờ: phố Thistlewood về đêm dựng từ chính các đồ vật PixelLab
 * của bản đồ, nội dung cuộn trong một lớp riêng.
 *
 * Căn giữa bằng `m-auto` chứ không bằng items-center/justify-center: nội dung cao hơn màn (điện thoại xoay ngang,
 * bàn phím mở) thì lề tự về 0 và cuộn được tới tận mép trên — căn giữa bằng flex sẽ cắt mất phần đầu. Lớp cuộn là
 * scroll container riêng nên `touch-none` của <main> không chặn vuốt.
 */
export function Backdrop({ children }: { children: ReactNode }) {
	return (
		<div className="absolute inset-0 z-30 overflow-hidden" style={SKY}>
			<Scenery />
			<div className="absolute inset-0 flex flex-col overflow-y-auto overscroll-contain pt-[max(1rem,env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))]">
				<div className="m-auto flex w-full flex-col items-center">{children}</div>
			</div>
		</div>
	);
}

const SKY: CSSProperties = {
	background: [
		'radial-gradient(circle at 80% 14%, rgb(240 223 184 / 0.16), rgb(240 223 184 / 0.05) 4rem, transparent 9rem)',
		'radial-gradient(120% 45% at 50% 100%, rgb(233 150 70 / 0.16), transparent 70%)',
		'linear-gradient(180deg, #060508 0%, #110b08 55%, #1d130b 100%)',
	].join(','),
};

// ---- Khung cảnh ------------------------------------------------------------------------------

interface PropFrame {
	x: number;
	y: number;
	w: number;
	h: number;
}
interface PropAtlas {
	image: string;
	size: { w: number; h: number };
	frames: Record<string, PropFrame>;
}

const PROPS_BASE = '/assets/maps/human/';
/** Dãy phố quanh nhà thờ (giữa màn) — thứ tự cố định để lần nào mở game cũng cùng một khung cảnh. */
const STREET = ['tree_flip', 'house_farm', 'bush', 'lamp', 'house', 'stone_lantern', 'church', 'well', 'house_inn', 'lamp', 'bush_flower', 'house_forge', 'tree'];
/** Hai đầu phố: rào, cây, bụi lặp tới hết bề ngang màn. */
const EDGE_LEFT = ['fence', 'tree_autumn', 'bush', 'tree', 'fence', 'house_stone', 'tree_flip', 'rock_mossy'];
const EDGE_RIGHT = ['fence', 'tree', 'haybale', 'tree_autumn', 'house_store', 'fence', 'tree_flip', 'bush_flower'];
const FOREST = ['tree', 'tree_autumn', 'tree_flip', 'tree_autumn', 'tree'];
/** Số px (gốc) các đồ vật đè lên nhau — cây lấp chân nhà cho có chiều sâu. */
const OVERLAP = 12;
const FOREST_OVERLAP = 48;

let atlasCache: PropAtlas | null = null;
let atlasPromise: Promise<PropAtlas> | null = null;

/** Đọc props.json (atlas đóng gói lại mỗi lần build bản đồ, nên KHÔNG chép cứng toạ độ). */
function loadPropAtlas(): Promise<PropAtlas> {
	atlasPromise ??= fetch(`${PROPS_BASE}props.json`)
		.then((r) => {
			if (!r.ok) throw new Error(`props.json HTTP ${r.status}`);
			return r.json() as Promise<{ frames: Record<string, { frame: PropFrame }>; meta: { image: string; size: { w: number; h: number } } }>;
		})
		.then((j) => {
			const frames = Object.fromEntries(Object.entries(j.frames).map(([k, v]) => [k.slice(k.lastIndexOf('/') + 1), v.frame]));
			atlasCache = { image: j.meta.image, size: j.meta.size, frames };
			return atlasCache;
		});
	atlasPromise.catch(() => {
		atlasPromise = null;
	});
	return atlasPromise;
}

/** Lặp `pattern` tới khi đủ `minWidth` px gốc. Đồ vật không còn trong atlas thì bỏ qua thay vì vỡ màn. */
function fillRow(pattern: string[], minWidth: number, atlas: PropAtlas, overlap: number): string[] {
	const out: string[] = [];
	let width = 0;
	for (let i = 0; width < minWidth && i < 400; i += 1) {
		const name = pattern[i % pattern.length]!;
		const f = atlas.frames[name];
		if (!f) continue;
		out.push(name);
		width += f.w - overlap;
	}
	return out;
}

function rowWidth(names: string[], atlas: PropAtlas, overlap: number): number {
	return names.reduce((sum, n) => sum + (atlas.frames[n]?.w ?? 0) - overlap, 0);
}

/** Bầu sao: chấm 2px rải bằng box-shadow của một phần tử; hạt giống cố định nên trời lần nào cũng như nhau. */
function makeStars(count: number, seed: number): [string, string] {
	let s = seed;
	const rnd = (): number => (s = (s * 16807) % 2147483647) / 2147483647;
	const still: string[] = [];
	const twinkle: string[] = [];
	for (let i = 0; i < count; i += 1) {
		const dot = `${(rnd() * 100).toFixed(1)}vw ${(rnd() * 60).toFixed(1)}vh 0 0 rgb(240 223 184 / ${(0.25 + rnd() * 0.55).toFixed(2)})`;
		(i % 3 === 0 ? twinkle : still).push(dot);
	}
	return [still.join(','), twinkle.join(',')];
}
const [STARS_STILL, STARS_TWINKLE] = makeStars(54, 7);

function Scenery() {
	const { w, h } = useViewport();
	const [atlas, setAtlas] = useState(atlasCache);
	// Đã có sẵn từ màn trước (chờ → đăng nhập → chọn nhân vật) thì hiện ngay, không mờ dần lại mỗi lần đổi màn.
	const [fadeIn] = useState(atlasCache === null);
	useEffect(() => {
		if (atlas) return;
		let live = true;
		loadPropAtlas().then(
			(a) => live && setAtlas(a),
			() => undefined,
		);
		return () => {
			live = false;
		};
	}, [atlas]);

	// Phóng NGUYÊN lần theo chiều cao màn: 1080p giữ 1×, màn cao gấp đôi mới 2× — dãy phố luôn chiếm ~1/5 màn.
	const k = Math.max(1, Math.floor(h / 700));
	let street: string[] = [];
	let forest: string[] = [];
	if (atlas && w > 0) {
		const core = STREET.filter((n) => atlas.frames[n]);
		const side = Math.max(0, (w / k - rowWidth(core, atlas, OVERLAP)) / 2) + 160;
		street = [...fillRow(EDGE_LEFT, side, atlas, OVERLAP).reverse(), ...core, ...fillRow(EDGE_RIGHT, side, atlas, OVERLAP)];
		forest = fillRow(FOREST, w / k + 320, atlas, FOREST_OVERLAP);
	}
	// Màn thấp (điện thoại xoay ngang): hạ dãy phố xuống để mái nhà không lấn lên giữa màn.
	const sink = h < 560 ? -Math.round(60 * k) : 0;

	return (
		<div aria-hidden className="pointer-events-none absolute inset-0 select-none">
			<span className="absolute top-0 left-0 h-[2px] w-[2px]" style={{ boxShadow: STARS_STILL }} />
			<span className="absolute top-0 left-0 h-[2px] w-[2px] animate-pulse motion-reduce:animate-none" style={{ boxShadow: STARS_TWINKLE, animationDuration: '5s' }} />
			{atlas && street.length > 0 && (
				// Lớp bọc phải phủ kín màn: lúc chạy `fadein` (có transform) nó là khối chứa của hai dãy `absolute`.
				<div className={`absolute inset-0 ${fadeIn ? 'animate-[fadein_.9s_ease-out]' : ''}`}>
					<PropRow atlas={atlas} names={forest} k={k} overlap={FOREST_OVERLAP} style={{ bottom: sink + 58 * k, filter: 'brightness(0.24) saturate(0.6)' }} />
					<PropRow atlas={atlas} names={street} k={k} overlap={OVERLAP} style={{ bottom: sink, filter: 'brightness(0.46) saturate(0.8)' }} />
				</div>
			)}
			<div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/60 to-transparent" />
			<div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 45%, rgb(0 0 0 / 0.62) 100%)' }} />
		</div>
	);
}

/** Một dãy đồ vật cắt từ atlas, chân chạm cùng một đường, căn giữa màn (tràn hai bên bị cắt). */
function PropRow({ atlas, names, k, overlap, style }: { atlas: PropAtlas; names: string[]; k: number; overlap: number; style: CSSProperties }) {
	const sheet = `url(${PROPS_BASE}${atlas.image})`;
	const size = `${atlas.size.w * k}px ${atlas.size.h * k}px`;
	return (
		<div className="absolute inset-x-0 flex items-end justify-center" style={style}>
			{names.map((n, i) => {
				const f = atlas.frames[n]!;
				return (
					<div
						key={i}
						className="pixel-img shrink-0"
						style={{ width: f.w * k, height: f.h * k, marginLeft: i ? -overlap * k : 0, backgroundImage: sheet, backgroundSize: size, backgroundPosition: `${-f.x * k}px ${-f.y * k}px` }}
					/>
				);
			})}
		</div>
	);
}

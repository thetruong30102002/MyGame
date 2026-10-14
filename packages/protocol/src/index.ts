/**
 * Hợp đồng giữa máy chủ (`apps/server`) và client (`apps/web`): kiểu dữ liệu REST + tin nhắn WebSocket.
 * Chỉ có KIỂU và hằng số thuần — không import Node hay DOM, để cả hai phía dùng chung một file.
 */

export const SERVER_PORT = 3200;
/** Nhịp máy chủ gửi ảnh chụp vị trí người chơi (lần/giây). */
export const SNAPSHOT_HZ = 10;
export const CHAT_MAX = 200;
/**
 * Kênh chat (docs/ke-hoach-xa-hoi.md mục 2): `map` = người cùng map (mặc định — client / máy chủ bản cũ không ghi kênh), `world` =
 * mọi người đang online. Kênh Thế giới: mỗi người 1 tin / `WORLD_CHAT_GAP_MS` (chống quảng cáo) và mỗi tin tốn `WORLD_CHAT_DIAMONDS`
 * kim cương (chủ dự án 08/10/2026: "chat thế giới cần 3 kim cương", rồi "bỏ điều kiện cấp 10 đi" — không cần cấp).
 */
export type ChatChannel = 'map' | 'world';
export const WORLD_CHAT_GAP_MS = 10_000;
export const WORLD_CHAT_DIAMONDS = 3;
/** Cấp tối đa (chủ dự án chốt 08/10/2026: 10 vùng × ~10 cấp — docs/ke-hoach-the-gioi.md). Máy chủ kẹp cấp lưu lên theo số này. */
export const MAX_LEVEL = 100;

export type Gender = 'male' | 'female';

/** Tên nhân vật: 3–16 ký tự, chữ cái (có dấu tiếng Việt), số, khoảng trắng đơn ở giữa. */
export const NAME_RULE = /^[\p{L}\p{N}](?:[\p{L}\p{N}]| (?! ))*[\p{L}\p{N}]$/u;
export const NAME_MIN = 3;
export const NAME_MAX = 16;

export function validateName(name: string): string | null {
	const n = name.trim();
	if (n.length < NAME_MIN || n.length > NAME_MAX) return `Tên dài ${NAME_MIN}–${NAME_MAX} ký tự`;
	if (!NAME_RULE.test(n)) return 'Tên chỉ gồm chữ, số và khoảng trắng đơn';
	return null;
}

export function validateUsername(u: string): string | null {
	if (!/^[a-z0-9_]{3,20}$/.test(u)) return 'Tên đăng nhập 3–20 ký tự: chữ thường không dấu, số, gạch dưới';
	return null;
}

export function validatePassword(p: string): string | null {
	if (p.length < 6 || p.length > 72) return 'Mật khẩu dài 6–72 ký tự';
	return null;
}

/** Tiến độ một nhân vật — client gửi lên định kỳ, máy chủ lưu nguyên khối (chưa phải server authoritative). */
export interface CharacterProgress {
	level: number;
	exp: number;
	coins: number;
	potions: number;
	map: string;
	x: number;
	y: number;
	/** Trạng thái cốt truyện (StoryDirector.SaveData), máy chủ không đọc nội dung. */
	story: unknown;
	introSeen: boolean;
	/**
	 * Điểm tiềm năng THƯỞNG (trang quản trị cộng — 10/10/2026): MÁY CHỦ giữ như cấp / xu — gói `save` không ghi đè được
	 * (`Store.saveProgress` giữ số trong CSDL). Client cộng vào điểm theo cấp ở mọi chỗ tính điểm (`@aether/sim/talents`
	 * `talentPoints`). Vắng (bản lưu cũ, máy chủ bản cũ) = 0.
	 */
	bonusPoints?: number;
}

export interface CharacterInfo {
	id: string;
	name: string;
	gender: Gender;
	createdAt: number;
	progress: CharacterProgress;
}

// ---- REST -------------------------------------------------------------------------------------

export interface AuthRequest {
	username: string;
	password: string;
}
export interface AuthResponse {
	token: string;
	username: string;
}
export interface CreateCharacterRequest {
	name: string;
	gender: Gender;
}
export interface ApiError {
	error: string;
}
/** Mỗi tài khoản MỘT nhân vật (chủ dự án 09/10/2026). Tài khoản cũ đã có nhiều hơn vẫn chơi được, chỉ không tạo thêm. */
export const MAX_CHARACTERS = 1;

// ---- Quản trị: trang /admin cộng tiền, điểm cho nhân vật (chủ dự án 10/10/2026) ----------------------------------------
// Quyền theo TÀI KHOẢN (bảng `admins`, cấp bằng lệnh `apps/server/src/admin.ts`); API xác thực bằng phiên đăng nhập như mọi API khác.

/**
 * Biên độ MỖI lần cộng / trừ (máy chủ chặn — trang /admin kiểm trước cho đỡ gửi hỏng). Số dư không bao giờ âm: trừ quá số đang có
 * thì về 0. Đặt cấp: 1…`MAX_LEVEL`, EXP về 0.
 */
export const ADMIN_LIMITS = { coins: 1_000_000, diamonds: 100_000, potions: 999, exp: 10_000_000, talentPoints: 200 } as const;
/** Lý do bắt buộc (ghi vào nhật ký quản trị + nhật ký kinh tế), tối đa chừng này ký tự. */
export const ADMIN_REASON_MAX = 120;

/** Một nhân vật trong kết quả tìm của trang quản trị — nhân vật đang online thì số lấy từ bộ nhớ máy chủ (số đang chạy). */
export interface AdminCharacter {
	id: string;
	name: string;
	/** Tên tài khoản sở hữu. */
	account: string;
	level: number;
	exp: number;
	coins: number;
	potions: number;
	diamonds: number;
	/** Điểm tiềm năng thưởng (`CharacterProgress.bonusPoints`). */
	bonusPoints: number;
	online: boolean;
}

/** Trường quản trị đổi được (cột `field` của nhật ký quản trị). */
export type AdminField = 'coins' | 'diamonds' | 'potions' | 'level' | 'exp' | 'bonusPoints';

/**
 * `POST /api/admin/grant`: số CỘNG (âm = trừ) cho từng loại — vắng / 0 = không đổi. `setLevel`: đặt hẳn cấp (EXP về 0), áp TRƯỚC
 * phần cộng EXP. `talentPoints`: điểm tiềm năng thưởng. Áp trong một transaction, mỗi trường đổi một dòng nhật ký.
 */
export interface AdminGrantRequest {
	characterId: string;
	coins?: number;
	diamonds?: number;
	potions?: number;
	exp?: number;
	setLevel?: number;
	talentPoints?: number;
	reason: string;
}

/** Một trường vừa đổi (trước → sau). */
export interface AdminChange {
	field: AdminField;
	from: number;
	to: number;
}

/** Kết quả một lần cộng: số mới của nhân vật + các trường đã đổi (rỗng = không có gì đổi, vd trừ khi đã ở 0). */
export interface AdminGrantResult {
	character: AdminCharacter;
	changes: AdminChange[];
}

/** Một dòng nhật ký quản trị (mỗi trường đổi một dòng; các dòng cùng một lần cộng chung `at` + lý do). */
export interface AdminLogEntry extends AdminChange {
	id: number;
	at: number;
	/** Tên tài khoản quản trị. */
	admin: string;
	characterId: string;
	characterName: string;
	reason: string;
}

/** Góp ý bản beta (Cài đặt → Góp ý): độ dài chữ 3…`FEEDBACK_MAX` ký tự. */
export const FEEDBACK_MAX = 1000;

/** Loại góp ý (trang Góp ý trên web chọn; game chưa gửi → `khac`). */
export const FEEDBACK_KINDS = { loi: 'Báo lỗi', 'y-tuong': 'Ý tưởng', khac: 'Khác' } as const;
export type FeedbackKind = keyof typeof FEEDBACK_KINDS;
/** Trạng thái quản trị đặt cho góp ý — người gửi xem được ở trang Góp ý. */
export const FEEDBACK_STATUS = { moi: 'Mới', 'da-xem': 'Đã xem', 'da-xu-ly': 'Đã xử lý' } as const;
export type FeedbackStatus = keyof typeof FEEDBACK_STATUS;
export const FEEDBACK_REPLY_MAX = 1000;

export interface FeedbackRequest {
	text: string;
	kind?: FeedbackKind;
	/** Nhân vật đang chơi (nếu có) — máy chủ chỉ nhận khi thuộc đúng tài khoản. */
	characterId?: string;
	/** Bản client + nền tảng, để biết góp ý cho bản nào. */
	build?: number;
	platform?: string;
}

/** Một góp ý trong trang quản trị, mới nhất trước. */
export interface FeedbackEntry {
	id: number;
	at: number;
	username: string;
	characterName: string | null;
	text: string;
	build: number | null;
	platform: string | null;
	kind: FeedbackKind;
	status: FeedbackStatus;
	/** Lời quản trị trả lời (người gửi đọc ở trang Góp ý). */
	reply: string | null;
	replyAt: number | null;
	repliedBy: string | null;
}

/** `GET /api/feedback/mine`: góp ý của chính tài khoản, mới nhất trước. */
export interface MyFeedback {
	id: number;
	at: number;
	kind: FeedbackKind;
	text: string;
	status: FeedbackStatus;
	reply: string | null;
	replyAt: number | null;
}

/** `PUT /api/admin/feedback/:id`: đổi trạng thái và / hoặc trả lời (chuỗi rỗng = xoá lời trả lời). */
export interface FeedbackUpdate {
	status?: FeedbackStatus;
	reply?: string;
}

// ---- Trang chủ: tin tức (quản trị đăng) + bài viết cộng đồng (người chơi đăng, bình luận) ----------------------------------

export const NEWS_TAGS = ['Cập nhật', 'Thông báo', 'Sự kiện'] as const;
export type NewsTag = (typeof NEWS_TAGS)[number];
export const NEWS_TITLE_MAX = 120;
/** Tối đa số dòng (gạch đầu dòng) một tin, mỗi dòng tối đa `NEWS_LINE_MAX` ký tự. */
export const NEWS_LINES_MAX = 30;
export const NEWS_LINE_MAX = 400;

/** Một tin trên trang chủ, mới nhất trước. `date` dạng dd/mm/yyyy (giờ Việt Nam). */
export interface NewsItem {
	id: number;
	at: number;
	date: string;
	tag: NewsTag;
	title: string;
	body: string[];
	author: string;
}

/** `POST / PUT /api/admin/news`: nội dung là chữ nhiều dòng — mỗi dòng không rỗng thành một gạch đầu dòng. */
export interface NewsRequest {
	tag: NewsTag;
	title: string;
	body: string;
}

/** Chuyên mục diễn đàn (id cố định — lưu CSDL; tên hiện trên web). */
export const POST_CATEGORIES = { chung: 'Thảo luận chung', 'to-doi': 'Tìm tổ đội', 'hoi-dap': 'Hỏi đáp', 'huong-dan': 'Hướng dẫn', khoe: 'Khoe đồ' } as const;
export type PostCategory = keyof typeof POST_CATEGORIES;
export const POST_TITLE_MAX = 100;
export const POST_BODY_MAX = 2000;
export const COMMENT_MAX = 500;

/** Bài viết cộng đồng. `author`: tên nhân vật người đăng chọn (thuộc đúng tài khoản), không có nhân vật thì tên tài khoản. */
export interface PostItem {
	id: number;
	at: number;
	category: PostCategory;
	author: string;
	title: string;
	body: string;
	comments: number;
	/** Người đang xem là chủ bài (xoá được). */
	mine: boolean;
}

export interface CommentItem {
	id: number;
	at: number;
	author: string;
	body: string;
	mine: boolean;
}

export interface PostRequest {
	title: string;
	body: string;
	category?: PostCategory;
	characterId?: string;
}

export interface CommentRequest {
	body: string;
	characterId?: string;
}

/** `GET /api/me`: tài khoản đang đăng nhập + quyền quản trị + nhân vật (để chọn tên hiện khi đăng bài). */
export interface MeResponse {
	username: string;
	admin: boolean;
	characters: { id: string; name: string; level: number }[];
}

// ---- WebSocket --------------------------------------------------------------------------------

/**
 * Động tác một lần (không lặp) của người chơi: vung kiếm, niệm phép + các động tác riêng của skill (`packages/sim/src/moves.ts`).
 * Không bao giờ đi qua snapshot. Chỉ THÊM tên vào cuối; tên chỉ gồm a–z (khung atlas `<động tác>_<hướng>_<số>`).
 */
export const ACTION_ANIMS = [
	'attack', 'cast', 'backslash', 'thrust', 'throw', 'channel', 'push', 'skycall', 'stomp', 'charge', 'smash', 'lunge', 'dodge', 'block',
	'parry', 'spin', 'flurry', 'wave', 'fling', 'vanish', 'ultimate', 'hit', 'death', 'revive', 'drink',
] as const;
export type ActionAnim = (typeof ACTION_ANIMS)[number];
export const DIRS8 = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'] as const;

/**
 * Phần CHIÊU của tin `action` (tuỳ chọn — chủ dự án 09/10/2026: "người này phải thấy skill của người kia chơi pvp mà"): đủ để
 * máy người xem vẽ lại ĐÚNG hình của chiêu (đạn bay theo hướng ngắm, vệt chém mang hệ phủ phép, vùng / cột / tường ở điểm nhắm)
 * neo vào nhân vật người tung. CHỈ HÌNH — không có con số sát thương nào, máy nhận không trừ máu ai. Máy chủ / máy khách bản cũ
 * bỏ qua trường này (chỉ phát động tác thân như trước). Mã chiêu nằm ở `skill` của tin (máy chủ kiểm có trong bộ chiêu thật).
 */
export interface ActionFx {
	/** Hướng ngắm đã khoá lúc bấm (vector đơn vị, 3 số lẻ) — mịn hơn 8 hướng của `dir`: đạn bay đúng góc. */
	ax: number;
	ay: number;
	/** Điểm nhắm trên mặt đất (toạ độ thế giới, số nguyên) của đòn đặt vùng / cột / tường / mưa — máy chủ kẹp quanh người gửi. */
	tx?: number;
	ty?: number;
	/** Hệ đang phủ lên kiếm (`fire` / `water` / `wind` / `ice` / `earth`) — vệt chém + đạn kiếm mang màu hệ. */
	el?: string;
	/** Hồi chiêu THẬT (giây, sau bị động) đã dùng dựng nhịp động tác — máy người xem ra cùng khung chạm. */
	cd?: number;
	/** Động tác nhanh hơn chừng này lần (Đà Lướt). */
	sp?: number;
	/** Đạn phép bay nhanh + xa hơn chừng này lần (Gió Sắc). */
	boost?: number;
	/** Hình phụ theo trạng thái người tung (`ACTION_FX_FLAGS`, cộng bit). */
	fl?: number;
}

/** Bit của `ActionFx.fl`: lưỡi gió theo nhát chém (phủ Phong mốc 7), Xoáy Nước bùng (vừa đỡ đòn thành công). */
export const ACTION_FX_FLAGS = { windBlade: 1, surge: 2 } as const;
/** Toạ độ thế giới hợp lệ (cùng trần với gói vị trí của máy chủ). */
export const WORLD_COORD_MAX = 20000;

const fxNum = (v: unknown, lo: number, hi: number): number | undefined => (typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi ? v : undefined);
const round3 = (v: number): number => Math.round(v * 1000) / 1000;

/**
 * Chuẩn hoá phần chiêu nhận qua mạng (CẢ máy chủ lẫn máy khách — không tin dữ liệu mạng). null = bỏ cả phần chiêu: không phải
 * object, hướng ngắm không phải số hữu hạn / bằng 0, điểm nhắm vô lý (không hữu hạn, ngoài thế giới, chỉ có một toạ độ). Trường
 * phụ (`el`, `cd`, `sp`, `boost`, `fl`) sai dạng thì chỉ bỏ trường đó — máy nhận dùng số gốc của chiêu. Mã chiêu / hệ phủ phép có
 * thật không là việc của bên gọi (gói này không biết bộ chiêu — `@aether/sim`).
 */
export function cleanActionFx(raw: unknown): ActionFx | null {
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
	const r = raw as Record<string, unknown>;
	const ax = fxNum(r.ax, -1e3, 1e3);
	const ay = fxNum(r.ay, -1e3, 1e3);
	if (ax === undefined || ay === undefined) return null;
	const len = Math.hypot(ax, ay);
	if (len < 1e-6) return null;
	const out: ActionFx = { ax: round3(ax / len), ay: round3(ay / len) };
	if (r.tx !== undefined || r.ty !== undefined) {
		const tx = fxNum(r.tx, 0, WORLD_COORD_MAX);
		const ty = fxNum(r.ty, 0, WORLD_COORD_MAX);
		if (tx === undefined || ty === undefined) return null;
		out.tx = Math.round(tx);
		out.ty = Math.round(ty);
	}
	if (typeof r.el === 'string' && /^[a-z]{1,8}$/.test(r.el)) out.el = r.el;
	const cd = fxNum(r.cd, 0.01, 60);
	if (cd !== undefined) out.cd = round3(cd);
	const sp = fxNum(r.sp, 1, 3);
	if (sp !== undefined) out.sp = round3(sp);
	const boost = fxNum(r.boost, 1, 3);
	if (boost !== undefined) out.boost = round3(boost);
	const fl = fxNum(r.fl, 0, 255);
	if (fl !== undefined && Number.isInteger(fl) && fl > 0) out.fl = fl;
	return out;
}

/**
 * Đồ GẮN lên người đang mặc (vẽ thành lớp chồng lên sprite) — thứ tự ô CỐ ĐỊNH, chỉ được THÊM ô vào CUỐI. Bộ trang phục
 * (áo-quần-giày) không đi ở đây: nó đổi hẳn sprite nên đi qua trường `sprite`.
 */
export const GEAR_VIEW_SLOTS = ['head', 'main', 'off', 'back'] as const;
export type GearViewSlot = (typeof GEAR_VIEW_SLOTS)[number];
/** Số bậc độ hiếm (0 = thường … 4 = huyền thoại) — chữ số sau dấu `:` của một ô. */
export const GEAR_RARITY_LEVELS = 5;
/**
 * Mỗi ô: `''` (trống), `'<id>'` (độ hiếm thường) hoặc `'<id>:<bậc>'` — id chữ thường/số/gạch dưới tối đa 24 ký tự. Gọn
 * (vài chục byte cho cả bộ) và kiểm được bằng một biểu thức.
 */
export type GearView = string[];
const GEAR_PIECE = new RegExp(`^[a-z0-9_]{1,24}(?::[0-${GEAR_RARITY_LEVELS - 1}])?$`);

/**
 * Chuẩn hoá danh sách đồ gắn nhận qua mạng (dùng ở CẢ máy chủ lẫn client). null = không phải mảng hoặc nhiều ô hơn
 * `GEAR_VIEW_SLOTS` (bỏ cả gói). Ô sai dạng thành ô trống; thiếu ô thì đệm trống — luôn trả đúng số ô.
 * Bản cũ không gửi trường này → null → máy nhận coi như không mặc gì, không lỗi.
 */
export function cleanGearView(raw: unknown): GearView | null {
	if (!Array.isArray(raw) || raw.length > GEAR_VIEW_SLOTS.length) return null;
	return GEAR_VIEW_SLOTS.map((_, i) => {
		const v = raw[i];
		return typeof v === 'string' && GEAR_PIECE.test(v) ? v : '';
	});
}

// ---- Xã hội: bạn bè, chặn, chat riêng (docs/ke-hoach-xa-hoi.md) -------------------------------------

export const MAX_FRIENDS = 100;
/** Lời mời kết bạn chưa trả lời quá chừng này thì tự huỷ. */
export const FRIEND_REQUEST_TTL = 7 * 24 * 3600 * 1000;
/** Tin nhắn riêng gửi lúc người nhận offline: giữ chừng này rồi xoá; mỗi cặp người tối đa `WHISPER_KEEP` tin chờ. */
export const WHISPER_TTL = 30 * 24 * 3600 * 1000;
export const WHISPER_KEEP = 200;

/** Một người trong danh sách xã hội (bạn, lời mời, người bị chặn). `map` chỉ có khi là BẠN đang online. */
export interface SocialPerson {
	id: string;
	name: string;
	level: number;
	online: boolean;
	map?: string;
}

/** Toàn bộ trạng thái xã hội của mình — máy chủ gửi lại nguyên khối mỗi khi có thay đổi (danh sách nhỏ, ≤ 100 bạn). */
export interface SocialState {
	friends: SocialPerson[];
	/** Lời mời người khác gửi mình, chờ mình trả lời. */
	incoming: SocialPerson[];
	/** Lời mời mình đã gửi, chờ người kia. */
	outgoing: SocialPerson[];
	blocked: SocialPerson[];
}

/** Tin nhắn riêng. Máy chủ gửi cho CẢ người nhận lẫn người gửi (bản của người gửi để hiện "→ Tên"). */
export interface WhisperMessage {
	from: string;
	fromName: string;
	to: string;
	toName: string;
	text: string;
	at: number;
}

// ---- Quái dùng chung (M3.2 — luật ở `@aether/sim/mobs`) -----------------------------------------------------

/** Một con quái dùng chung như máy chủ giữ. `owner`: người chơi đang chạy AI cho nó (null = chưa ai, đứng yên). */
export interface MobView {
	id: string;
	type: string;
	zone: string;
	x: number;
	y: number;
	hp: number;
	hpMax: number;
	dead: boolean;
	owner: string | null;
	home: { x: number; y: number; r: number };
	boss: boolean;
	/**
	 * Cấp của khu (`MonsterZoneDef.level`) — máy chủ đã nhân chỉ số theo cấp này (`enemyStatsAt`), client nhân y hệt cho AI / đòn
	 * quái và hiện "Cấp N". Vắng = chỉ số gốc (khu không khai cấp, hoặc máy chủ bản cũ).
	 */
	level?: number;
}

/** Vị trí một quái: [id, x, y, hướng, động tác] — mảng cho gọn (gửi 10 lần/giây). */
export type MobMove = [string, number, number, string, string];

/**
 * Động tác đánh của quái, CHỦ quái phát cho mọi máy (M3.2b): mỗi máy tự xét đòn có trúng người chơi CỦA MÌNH không, sát thương
 * tính từ chỉ số quái ở máy nhận — không có con số nào trong tin để chủ quái gian đánh người khác.
 */
export type MobAct =
	/** Bắt đầu lấy đà `s` giây, quay về hướng `dir` — con rối phát động tác đánh. */
	| { k: 'wind'; dir: string; s: number }
	/** Nhát cận chiến nổ khi quái đứng ở (x, y), quay theo hướng (nx, ny). */
	| { k: 'melee'; x: number; y: number; nx: number; ny: number }
	/** Bắn (boss: 3 viên toả) từ (x, y) theo hướng (nx, ny). */
	| { k: 'shot'; x: number; y: number; nx: number; ny: number }
	/** Boss gọi vùng nổ ở (x, y). */
	| { k: 'aoe'; x: number; y: number };

// ---- Ví kim cương, điểm danh, thành tựu (K1 — luật ở `@aether/sim/rewards`) -----------------------------------------------

/** Một phần quà: kim cương vào ví ở MÁY CHỦ; xu + bình hồi phục client tự cộng vào tiến độ (tới M3.3). */
export interface GiftView {
	diamonds: number;
	coins: number;
	potions: number;
}

/**
 * Điểm danh hôm nay: `day` = ngày giờ Việt Nam, `streak` = chuỗi ngày liên tiếp tính tới lần gần nhất, `next` = quà kế, `month` =
 * các ngày đã điểm danh trong tháng của `day` (khung lịch). Máy chủ bản cũ không gửi `month`.
 */
export interface DailyView {
	day: string;
	done: boolean;
	streak: number;
	next: GiftView;
	month?: string[];
}

/** Tiến độ một thành tựu (tên / mốc / quà đọc từ `GOALS` dùng chung theo `id`). */
export interface GoalView {
	id: string;
	progress: number;
	claimed: boolean;
}

/** Phần vừa nhận trong một lần thay đổi kinh tế (M3.3a) — client hiện "+N EXP", "+N xu", lên cấp. */
export interface EcoGain {
	exp: number;
	coins: number;
	potions: number;
	/** Số cấp vừa lên. */
	levels: number;
	reason: 'kill' | 'quest' | 'boss' | 'checkin' | 'spend' | 'potion' | 'admin';
	/** Loại quái / tên nhiệm vụ / lý do tiêu. */
	what: string;
}

/** Loại bình thời hạn mua bằng kim cương (danh mục ở `@aether/sim/shop`). */
export type BuffKind = 'exp' | 'dmg' | 'guard';

/** Một bình đang hiệu lực: `remaining` = giây chơi online còn lại (máy chủ đếm, chỉ trừ lúc online). */
export interface BuffView {
	kind: BuffKind;
	mult: number;
	remaining: number;
}

/** Khống chế / suy yếu trên quái (danh sách khoá ở `@aether/sim/mobs` `MOB_CC_KEYS`). */
export type MobCcKey = 'freeze' | 'stun' | 'air' | 'slow' | 'chill' | 'frost' | 'armor' | 'sunder' | 'miss' | 'daze';

/** Giây còn lại của từng khống chế + mức chậm + cú đẩy [vx, vy, giây] — người gây ra gửi cho chủ quái (AI) và mọi máy khác. */
export type MobCc = Partial<Record<MobCcKey, number>> & { slowMult?: number; push?: [number, number, number] };

/** Trạng thái hiển thị của một người chơi khác: đủ để vẽ đúng sprite, hướng, động tác. */
export interface PlayerView {
	id: string;
	name: string;
	gender: Gender;
	/** Sprite theo tuổi trong cốt truyện (trẻ con / người lớn) — và theo bộ trang phục đang mặc (`player_hero_adult_leather`). */
	sprite: string;
	level: number;
	x: number;
	y: number;
	dir: string;
	anim: string;
	/** Đồ gắn đang mặc (`GearView`). Máy chủ bản cũ không có → thiếu trường = không vẽ lớp đồ. */
	gear?: GearView;
	/** Máu hiện tại / tối đa (máy người chơi báo kèm gói vị trí — để người khác vẽ thanh máu trong PvP). Vắng = client bản cũ. */
	hp?: number;
	hpMax?: number;
}

export type ClientMessage =
	/** Tin đầu tiên sau khi mở kết nối: xác thực bằng token phiên (không đặt token trên URL để khỏi lọt vào log). */
	| { t: 'hello'; token: string; character: string }
	| { t: 'move'; x: number; y: number; dir: string; anim: string; sprite: string; hp?: number; hpMax?: number }
	| { t: 'chat'; text: string; ch?: ChatChannel }
	/**
	 * Vừa tung đòn: máy khác chỉ phát động tác + hình của chiêu, không có sát thương. `fx` (tuỳ chọn): phần chiêu để vẽ lại hiệu
	 * ứng (`ActionFx`). Chiêu không có động tác thân (lướt, giữ thế) vẫn gửi — `anim` là động tác riêng của chiêu cho máy bản cũ,
	 * máy mới biết chiêu đó không vung (`SkillDef.anim` vắng) nên chỉ vẽ hình. Chiêu dồn lực (Nhất Kích) gửi lúc BẮT ĐẦU dồn.
	 */
	| { t: 'action'; anim: ActionAnim; dir: string; skill?: string; fx?: ActionFx }
	/**
	 * Động tác vừa gửi bị cắt trước khi diễn hết (né, đi, bị ngắt): máy khác dừng hình. Tin riêng — máy chủ bản cũ bỏ qua im lặng.
	 * `hit`: đòn đã qua khung chạm (hình của chiêu ĐÃ ra ở máy người tung, chỉ cắt pha thu thế) → máy người xem vẽ nốt chiêu chưa kịp
	 * nổ thay vì bỏ (hai tin tới dồn do trễ mạng). Vắng = cắt trước khung chạm, đòn không nổ.
	 */
	| { t: 'actionEnd'; hit?: boolean }
	| { t: 'save'; progress: CharacterProgress }
	/** Đồ gắn đang mặc vừa đổi (và gửi lại sau mỗi `welcome`). Tin riêng — máy chủ bản cũ bỏ qua im lặng. */
	| { t: 'gear'; gear: GearView }
	/** Vừa sang map khác (`<vùng>/<map>`): máy chủ chuyển mình sang nhóm người chơi của map đó, gửi lại `welcome`. */
	| { t: 'map'; map: string }
	| { t: 'ping'; at: number }
	/** Mời kết bạn — theo id (bấm tên) hoặc theo tên gõ tay. */
	| { t: 'friendAdd'; id?: string; name?: string }
	/** Trả lời lời mời của `id`. */
	| { t: 'friendRespond'; id: string; accept: boolean }
	/** Huỷ bạn với `id`, hoặc rút lại lời mời mình đã gửi cho `id`. */
	| { t: 'friendRemove'; id: string }
	/** Chặn / bỏ chặn `id` (chặn thì tự huỷ bạn + lời mời hai chiều). */
	| { t: 'block'; id: string; on: boolean }
	/** Chat riêng: tới `to` (id), HOẶC `line` = phần sau `/w ` (tên + nội dung — tên có thể chứa khoảng trắng, máy chủ tự tách). */
	| { t: 'whisper'; to?: string; text?: string; line?: string }
	/** Bật / tắt nhận quái dùng chung của map đang đứng (client ở thế giới người lớn mới bật). */
	| { t: 'mobSub'; on: boolean }
	/** Chủ quái báo vị trí các quái mình chạy AI. */
	| { t: 'mobPos'; list: MobMove[] }
	/** Đòn của mình trúng quái `id` (sát thương đã tính ở máy mình — máy chủ kiểm tầm / nhịp / trần rồi trừ máu). */
	| { t: 'mobHit'; id: string; dmg: number }
	/** Quái `id` vừa lao vào mình: xin làm chủ (máy chủ đổi chủ nếu mình gần nó hơn chủ cũ). */
	| { t: 'mobAggro'; id: string }
	/** Chủ quái `id` báo động tác đánh của nó (máy chủ chỉ nhận từ chủ, phát cho người khác). */
	| { t: 'mobAct'; id: string; act: MobAct }
	/** Mình vừa khống chế quái `id` (hoặc quái mình làm chủ đổi khống chế) — máy chủ phát cho người khác trong map. */
	| { t: 'mobCc'; id: string; cc: MobCc }
	/** Điểm danh hôm nay (máy chủ chặn lần thứ hai trong ngày). */
	| { t: 'checkin' }
	/** Xin tiến độ thành tựu. */
	| { t: 'goals' }
	/** Nhận quà thành tựu `id` (phải đứng cạnh Bia Danh Vọng). */
	| { t: 'goalClaim'; id: string }
	/** Mua món `item` ở Cửa hàng kim cương — giá theo danh mục CỦA MÁY CHỦ. */
	| { t: 'shopBuy'; item: string }
	/**
	 * Tẩy điểm tiềm năng + thuộc tính (đổi nguyên tố đã chọn): máy chủ trừ `resetDiamonds(cấp)` kim cương (`@aether/sim/talents`) rồi
	 * trả `wallet` + `bought` (item `reset_build`) — client xoá điểm khi nhận `bought`. Thiếu kim cương: tin `system`.
	 */
	| { t: 'resetBuild' }
	/** Xin danh sách trạm (map trạm của các vùng) đã từng đặt chân tới — cột dịch chuyển; trả kèm mọi map đã tới (bản đồ lớn). */
	| { t: 'hubs' }
	/**
	 * M3.3a — kinh tế ở máy chủ: vừa hạ quái RIÊNG loại `type` (quái dùng chung máy chủ tự tính, không báo). `zone`: khu riêng của
	 * con quái — máy chủ kiểm khu đó có trên map đang đứng, trao EXP / xu theo cấp của khu, chặn EXP khu tuổi thơ. Vắng (client bản
	 * cũ) = máy chủ chọn khu riêng cấp thấp nhất có loại đó.
	 */
	| { t: 'kill'; type: string; zone?: string }
	/** Vừa xong nhiệm vụ `id` — máy chủ trao thưởng theo dữ liệu truyện (một lần). */
	| { t: 'quest'; id: string }
	/** Tiêu `amount` xu (`reason`: tẩy điểm, dịch chuyển…). */
	| { t: 'spend'; reason: string; amount: number }
	/** Uống một bình hồi phục. */
	| { t: 'potion' }
	/** PvP: mình vừa gục vì người chơi `by` (máy chủ chỉ nhận khi `by` vừa đánh trúng mình — `@aether/sim/pvp`). */
	| { t: 'pvpDown'; by: string };

export type ServerMessage =
	| { t: 'welcome'; you: string; players: PlayerView[] }
	| { t: 'join'; player: PlayerView }
	| { t: 'leave'; id: string }
	/** Chỉ gồm người chơi có thay đổi kể từ ảnh chụp trước. */
	| { t: 'snapshot'; players: Pick<PlayerView, 'id' | 'x' | 'y' | 'dir' | 'anim' | 'sprite' | 'level' | 'hp' | 'hpMax'>[] }
	| { t: 'chat'; from: string; name: string; text: string; at: number; ch?: ChatChannel }
	| { t: 'system'; text: string }
	/** `fx` chỉ có khi mã chiêu có thật và phần chiêu hợp lệ (máy chủ đã chuẩn hoá + kẹp điểm nhắm quanh người gửi). */
	| { t: 'action'; id: string; anim: ActionAnim; dir: string; skill?: string; fx?: ActionFx }
	/** `hit` chỉ có khi đúng `true` (đòn đã qua khung chạm — xem tin `actionEnd` của máy khách). */
	| { t: 'actionEnd'; id: string; hit?: true }
	/** Người chơi `id` đổi đồ gắn. Client bản cũ không biết tin này → bỏ qua im lặng. */
	| { t: 'gear'; id: string; gear: GearView }
	| { t: 'pong'; at: number }
	/** Đóng kết nối có lý do (đăng nhập nơi khác, phiên hết hạn). */
	| { t: 'kicked'; reason: string }
	/** Trạng thái xã hội (gửi sau `welcome` đầu tiên và mỗi khi thay đổi). Client bản cũ bỏ qua. */
	| { t: 'social'; state: SocialState }
	/** Một hoặc nhiều tin nhắn riêng (lúc vào game: các tin nhận được khi đang offline). */
	| { t: 'whisper'; messages: WhisperMessage[] }
	/** Toàn bộ quái dùng chung của map (lúc bật nhận). */
	| { t: 'mobs'; map: string; list: MobView[] }
	| { t: 'mobMove'; list: MobMove[] }
	/** Máu quái sau một đòn (`by` = người đánh). */
	| { t: 'mobHp'; id: string; hp: number; by: string; dmg: number }
	/** Quái gục — `credit`: những người được tính công (nhận EXP, xu, nhiệm vụ). */
	| { t: 'mobDie'; id: string; by: string; credit: string[] }
	| { t: 'mobSpawn'; mob: MobView }
	| { t: 'mobOwner'; id: string; owner: string | null }
	| { t: 'mobAct'; id: string; act: MobAct }
	| { t: 'mobCc'; id: string; cc: MobCc }
	/** Số kim cương trong ví (sau `welcome` và sau mỗi lần đổi). */
	| { t: 'wallet'; diamonds: number }
	| { t: 'daily'; daily: DailyView }
	| { t: 'goals'; list: GoalView[] }
	/** Vừa nhận quà — kim cương đã vào ví; client cộng xu + bình hồi phục rồi lưu. */
	| { t: 'gift'; reason: 'checkin' | 'goal'; title: string; gift: GiftView }
	/** Bình đang hiệu lực (sau `welcome`, sau khi mua, khi một bình hết giờ). */
	| { t: 'buffs'; list: BuffView[] }
	/** Vừa mua xong món `item` (kim cương đã trừ — tin `wallet` + `buffs` đi kèm). */
	| { t: 'bought'; item: string }
	/**
	 * Trạm đã từng đặt chân tới (`vùng/map`) — máy chủ ghi lúc vào game / sang map. `maps`: MỌI map đã tới (bản đồ lớn làm mờ map
	 * chưa tới); client bản cũ bỏ qua trường này.
	 */
	| { t: 'hubs'; list: string[]; maps?: string[] }
	/**
	 * Cấp / EXP / xu / bình THẬT (máy chủ giữ — M3.3a): sau `welcome` và sau mỗi thay đổi; `gain` = phần vừa nhận / tiêu (quản trị:
	 * `reason: 'admin'`, `what` = lý do). `bonusPoints`: điểm tiềm năng thưởng — gửi lúc vào game và khi quản trị đổi; vắng = không đổi
	 * (client bản cũ bỏ qua trường này).
	 */
	| { t: 'eco'; level: number; exp: number; coins: number; potions: number; gain?: EcoGain; bonusPoints?: number }
	/**
	 * PvP: chiêu của `from` trúng `to` — MÁY CHỦ tính trúng + sát thương (`@aether/sim/pvp`). Gửi mọi người cùng map: máy `to` trừ máu
	 * (tự xét miễn thương / thế đỡ), máy khác chỉ vẽ số + hình trúng. (kx, ky): hướng đẩy (đơn vị) từ người đánh.
	 */
	| { t: 'pvpHit'; from: string; to: string; skill: string; dmg: number; crit?: true; kx: number; ky: number }
	/** PvP: `by` hạ gục `to` (dòng thông báo cho cả map). */
	| { t: 'pvpKill'; by: string; byName: string; to: string; toName: string };

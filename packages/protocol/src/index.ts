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
export const MAX_CHARACTERS = 4;

// ---- WebSocket --------------------------------------------------------------------------------

/** Động tác ra đòn một lần (không lặp): vung kiếm, vung tay niệm phép. Không bao giờ đi qua snapshot. */
export const ACTION_ANIMS = ['attack', 'cast'] as const;
export type ActionAnim = (typeof ACTION_ANIMS)[number];
export const DIRS8 = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'] as const;

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
}

export type ClientMessage =
	/** Tin đầu tiên sau khi mở kết nối: xác thực bằng token phiên (không đặt token trên URL để khỏi lọt vào log). */
	| { t: 'hello'; token: string; character: string }
	| { t: 'move'; x: number; y: number; dir: string; anim: string; sprite: string }
	| { t: 'chat'; text: string; ch?: ChatChannel }
	/** Vừa tung đòn: máy khác chỉ phát động tác (hình), không có sát thương. */
	| { t: 'action'; anim: ActionAnim; dir: string; skill?: string }
	/** Động tác vừa gửi bị cắt trước khi diễn hết (né, đi, bị ngắt): máy khác dừng hình. Tin riêng — máy chủ bản cũ bỏ qua im lặng. */
	| { t: 'actionEnd' }
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
	/** Xin danh sách trạm (map trạm của các vùng) đã từng đặt chân tới — cột dịch chuyển. */
	| { t: 'hubs' }
	/** M3.3a — kinh tế ở máy chủ: vừa hạ quái RIÊNG loại `type` (quái dùng chung máy chủ tự tính, không báo). */
	| { t: 'kill'; type: string }
	/** Vừa xong nhiệm vụ `id` — máy chủ trao thưởng theo dữ liệu truyện (một lần). */
	| { t: 'quest'; id: string }
	/** Tiêu `amount` xu (`reason`: tẩy điểm, dịch chuyển…). */
	| { t: 'spend'; reason: string; amount: number }
	/** Uống một bình hồi phục. */
	| { t: 'potion' };

export type ServerMessage =
	| { t: 'welcome'; you: string; players: PlayerView[] }
	| { t: 'join'; player: PlayerView }
	| { t: 'leave'; id: string }
	/** Chỉ gồm người chơi có thay đổi kể từ ảnh chụp trước. */
	| { t: 'snapshot'; players: Pick<PlayerView, 'id' | 'x' | 'y' | 'dir' | 'anim' | 'sprite' | 'level'>[] }
	| { t: 'chat'; from: string; name: string; text: string; at: number; ch?: ChatChannel }
	| { t: 'system'; text: string }
	| { t: 'action'; id: string; anim: ActionAnim; dir: string; skill?: string }
	| { t: 'actionEnd'; id: string }
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
	/** Trạm đã từng đặt chân tới (`vùng/map`) — máy chủ ghi lúc vào game / sang map. */
	| { t: 'hubs'; list: string[] }
	/** Cấp / EXP / xu / bình THẬT (máy chủ giữ — M3.3a): sau `welcome` và sau mỗi thay đổi; `gain` = phần vừa nhận / tiêu. */
	| { t: 'eco'; level: number; exp: number; coins: number; potions: number; gain?: EcoGain };

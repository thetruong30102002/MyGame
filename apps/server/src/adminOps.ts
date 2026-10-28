import { ADMIN_LIMITS, ADMIN_REASON_MAX, MAX_LEVEL, type AdminCharacter, type AdminGrantResult, type AdminLogEntry, type EcoGain, type ServerMessage } from '@havenlord/protocol';
import { applyAdminEco, cleanEco, totalExp, type Eco } from '@havenlord/sim/economy';
import type { AdminRow, Store } from './db.ts';
import type { Economy } from './economy.ts';

/** Lỗi trả về trang quản trị: mã HTTP + câu báo tiếng Việt (`http.ts` chuyển thành JSON `{ error }`). */
export class AdminError extends Error {
	constructor(
		readonly status: number,
		message: string,
	) {
		super(message);
	}
}

/** Phần thế giới trực tuyến mà trang quản trị cần (`World`): ai đang online, kinh tế trong bộ nhớ, gửi tin. */
export interface AdminWorld {
	readonly economy: Pick<Economy, 'current' | 'adminApplied'>;
	isOnline(id: string): boolean;
	notify(id: string, msg: ServerMessage): boolean;
}

/** Một yêu cầu cộng đã kiểm: số CỘNG có dấu (0 = không đổi), `setLevel` null = không đặt cấp. */
export interface GrantInput {
	characterId: string;
	coins: number;
	diamonds: number;
	potions: number;
	exp: number;
	talentPoints: number;
	setLevel: number | null;
	reason: string;
}

/** Số kết quả tìm tối đa mỗi lần. */
const SEARCH_LIMIT = 30;
const LOG_LIMIT = { fallback: 50, max: 200 };
const UUID = /^[0-9a-f-]{36}$/;
const NUM = new Intl.NumberFormat('vi-VN');

/**
 * Trang quản trị (/admin — chủ dự án 10/10/2026: "thêm 1 trang admin để cộng tiền, điểm cho nhân vật"): tìm nhân vật, cộng / trừ xu,
 * kim cương, bình hồi phục, EXP, đặt cấp, điểm tiềm năng thưởng; nhật ký. Phiên + quyền kiểm ở `http.ts`; ở đây kiểm DỮ LIỆU (số
 * nguyên, biên độ `ADMIN_LIMITS`, lý do bắt buộc) rồi ghi trong MỘT transaction (`Store.adminGrant`). Nhân vật đang online: kinh tế tính
 * từ bộ nhớ của `Economy` (số đang chạy) và nhận số mới ngay (`wallet` + `eco`) — không ghi thẳng CSDL rồi để bộ nhớ cũ ghi đè.
 * `world` vắng (test, chạy ngoài máy chủ) = coi như không ai online.
 */
export class AdminOps {
	constructor(
		private readonly store: Store,
		private readonly world: AdminWorld | null = null,
	) {}

	isAdmin(accountId: number): boolean {
		return this.store.isAdmin(accountId);
	}

	/** Tìm theo tên nhân vật / tên tài khoản (chứa chuỗi, không phân biệt hoa thường); rỗng = các nhân vật lưu gần nhất. */
	search(raw: unknown): AdminCharacter[] {
		const q = typeof raw === 'string' ? raw.slice(0, 40) : '';
		return this.store.adminSearch(q, SEARCH_LIMIT).map((r) => this.view(r));
	}

	character(id: string): AdminCharacter | null {
		const r = this.store.adminRow(id);
		return r ? this.view(r) : null;
	}

	/**
	 * Cộng / trừ cho một nhân vật. Kinh tế: đặt cấp → EXP có dấu → xu / bình (`applyAdminEco` — trang xem trước bằng đúng hàm này), kẹp
	 * không âm / không quá trần; kim cương trừ quá số dư thì về 0; điểm thưởng kẹp 0…trần. Trả số mới + các trường đã đổi.
	 */
	grant(admin: { id: number; username: string }, raw: unknown): AdminGrantResult {
		const req = parseGrant(raw);
		const row = this.store.adminRow(req.characterId);
		if (!row) throw new AdminError(404, 'Không tìm thấy nhân vật');
		const before = this.world ? this.world.economy.current(row.id) : rowEco(row);
		const after = applyAdminEco(before, req);
		const exp = totalExp(after.level, after.exp) - totalExp(before.level, before.exp);
		const changes = this.store.adminGrant(row.id, { admin, reason: req.reason, eco: { before, after, exp }, diamonds: req.diamonds, bonusPoints: req.talentPoints });
		// Ghi xong (transaction đã chốt) mới đụng bộ nhớ + gửi tin: ví trước, rồi `eco` mang lý do để client báo "Quản trị: …".
		if (changes.length && this.world?.isOnline(row.id)) {
			const diamonds = changes.find((c) => c.field === 'diamonds');
			if (diamonds) this.world.notify(row.id, { t: 'wallet', diamonds: diamonds.to });
			const gain: EcoGain = { exp, coins: after.coins - before.coins, potions: after.potions - before.potions, levels: Math.max(0, after.level - before.level), reason: 'admin', what: req.reason };
			this.world.economy.adminApplied(row.id, after, gain, this.store.bonusPoints(row.id));
		}
		return { character: this.character(row.id)!, changes };
	}

	/** Nhật ký quản trị mới nhất trước: `limit` mặc định 50 (tối đa 200), `characterId` để lọc một nhân vật. */
	log(rawLimit: unknown, rawCharacter?: unknown): AdminLogEntry[] {
		const n = Math.floor(Number(rawLimit));
		const limit = Number.isFinite(n) && n > 0 ? Math.min(LOG_LIMIT.max, n) : LOG_LIMIT.fallback;
		const character = typeof rawCharacter === 'string' && UUID.test(rawCharacter) ? rawCharacter : undefined;
		return this.store.adminLog(limit, character);
	}

	/** Số hiện tại: nhân vật đang online lấy bộ nhớ kinh tế (số đang chạy), không thì CSDL kẹp như lúc vào game. */
	private view(r: AdminRow): AdminCharacter {
		const online = this.world?.isOnline(r.id) ?? false;
		const e = online && this.world ? this.world.economy.current(r.id) : rowEco(r);
		return { id: r.id, name: r.name, account: r.account, level: e.level, exp: e.exp, coins: e.coins, potions: e.potions, diamonds: r.diamonds, bonusPoints: r.bonusPoints, online };
	}
}

function rowEco(r: AdminRow): Eco {
	return cleanEco({ level: r.level, exp: r.exp, coins: r.coins, potions: r.potions } as Partial<Eco>);
}

/**
 * Kiểm + chuẩn hoá yêu cầu cộng — không tin trang gửi gì: id nhân vật đúng dạng, mỗi loại là số nguyên trong biên độ `ADMIN_LIMITS`
 * (vắng / rỗng / 0 = không đổi), đặt cấp 1…`MAX_LEVEL`, lý do bắt buộc (bỏ ký tự điều khiển, gộp khoảng trắng), ít nhất một thay đổi.
 */
export function parseGrant(raw: unknown): GrantInput {
	const b = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
	const characterId = typeof b.characterId === 'string' ? b.characterId : '';
	if (!UUID.test(characterId)) throw new AdminError(400, 'Chưa chọn nhân vật');
	const amount = (key: keyof typeof ADMIN_LIMITS, label: string): number => {
		const v = b[key];
		if (v === undefined || v === null || v === '') return 0;
		const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v.trim()) : Number.NaN;
		if (!Number.isSafeInteger(n)) throw new AdminError(400, `${label}: phải là số nguyên`);
		if (Math.abs(n) > ADMIN_LIMITS[key]) throw new AdminError(400, `${label}: mỗi lần cộng / trừ tối đa ${NUM.format(ADMIN_LIMITS[key])}`);
		return n === 0 ? 0 : n;
	};
	const coins = amount('coins', 'Xu');
	const diamonds = amount('diamonds', 'Kim cương');
	const potions = amount('potions', 'Bình hồi phục');
	const exp = amount('exp', 'EXP');
	const talentPoints = amount('talentPoints', 'Điểm tiềm năng');
	let setLevel: number | null = null;
	if (b.setLevel !== undefined && b.setLevel !== null && b.setLevel !== '') {
		const n = typeof b.setLevel === 'number' || typeof b.setLevel === 'string' ? Number(b.setLevel) : Number.NaN;
		if (!Number.isInteger(n) || n < 1 || n > MAX_LEVEL) throw new AdminError(400, `Đặt cấp: số nguyên 1–${MAX_LEVEL}`);
		setLevel = n;
	}
	const reason =
		typeof b.reason === 'string'
			? b.reason
					.normalize('NFC')
					.replace(/[\u0000-\u001f\u007f]/g, ' ')
					.replace(/\s+/g, ' ')
					.trim()
			: '';
	if (!reason) throw new AdminError(400, 'Ghi lý do (bắt buộc — lưu vào nhật ký)');
	if (reason.length > ADMIN_REASON_MAX) throw new AdminError(400, `Lý do tối đa ${ADMIN_REASON_MAX} ký tự`);
	if (!coins && !diamonds && !potions && !exp && !talentPoints && setLevel === null) throw new AdminError(400, 'Chưa nhập thay đổi nào');
	return { characterId, coins, diamonds, potions, exp, talentPoints, setLevel, reason };
}

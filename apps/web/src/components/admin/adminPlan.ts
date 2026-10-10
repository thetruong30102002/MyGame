/**
 * Phần THUẦN của trang quản trị (/admin): biểu mẫu → yêu cầu gửi máy chủ, xem trước số trước → sau, gộp nhật ký. Không đụng React /
 * DOM — test node gọi thẳng. Luật kiểm như máy chủ (`apps/server/src/adminOps.ts` `parseGrant`): số nguyên trong biên độ
 * `ADMIN_LIMITS`, đặt cấp 1…`MAX_LEVEL`, lý do bắt buộc; xem trước dùng CHÍNH `applyAdminEco` mà máy chủ áp nên hộp xác nhận khớp kết
 * quả thật (máy chủ vẫn kiểm lại — trang chỉ đỡ gửi hỏng).
 */
import { ADMIN_LIMITS, ADMIN_REASON_MAX, MAX_LEVEL, type AdminChange, type AdminCharacter, type AdminField, type AdminGrantRequest, type AdminLogEntry } from '@aether/protocol';
import { applyAdminEco } from '@aether/sim/economy';
import { cleanBonusPoints } from '@aether/sim/talents';

/** Các loại cộng / trừ theo số (đặt cấp đi riêng). */
export type AmountKey = keyof typeof ADMIN_LIMITS;
export const AMOUNT_KEYS: readonly AmountKey[] = ['coins', 'diamonds', 'potions', 'exp', 'talentPoints'];

export const AMOUNT_LABEL: Record<AmountKey, string> = { coins: 'Xu', diamonds: 'Kim cương', potions: 'Bình hồi phục', exp: 'EXP', talentPoints: 'Điểm tiềm năng' };
export const FIELD_LABEL: Record<AdminField, string> = { coins: 'Xu', diamonds: 'Kim cương', potions: 'Bình hồi phục', level: 'Cấp', exp: 'EXP', bonusPoints: 'Điểm tiềm năng thưởng' };

/** Biểu mẫu: mỗi loại một ô số (chỉ chữ số — dấu đi riêng để bàn phím số của điện thoại không cần phím trừ), đặt cấp, lý do. */
export interface AdminDraft {
	amounts: Record<AmountKey, { sign: 1 | -1; text: string }>;
	setLevel: string;
	reason: string;
}

export function emptyDraft(): AdminDraft {
	const amounts = Object.fromEntries(AMOUNT_KEYS.map((k) => [k, { sign: 1, text: '' }])) as AdminDraft['amounts'];
	return { amounts, setLevel: '', reason: '' };
}

const NUM = new Intl.NumberFormat('vi-VN');
export const fmt = (n: number): string => NUM.format(n);

/** Số gõ tay → số nguyên không âm (bỏ dấu chấm / phẩy / khoảng trắng phân cách nghìn). '' = 0; sai dạng = null. */
export function readDigits(text: string): number | null {
	const t = text.replace(/[\s.,_]/g, '');
	if (!t) return 0;
	if (!/^\d{1,12}$/.test(t)) return null;
	return Number(t);
}

/** Lý do như máy chủ chuẩn hoá: bỏ ký tự điều khiển, gộp khoảng trắng. */
export function cleanReason(text: string): string {
	return text
		.normalize('NFC')
		.replace(/[\u0000-\u001f\u007f]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

/** Biểu mẫu → yêu cầu gửi máy chủ, hoặc câu báo lỗi đầu tiên (cùng luật với máy chủ). */
export function draftToRequest(characterId: string, d: AdminDraft): { req: AdminGrantRequest } | { error: string } {
	const req: AdminGrantRequest = { characterId, reason: cleanReason(d.reason) };
	for (const k of AMOUNT_KEYS) {
		const n = readDigits(d.amounts[k].text);
		if (n === null) return { error: `${AMOUNT_LABEL[k]}: chỉ gõ chữ số` };
		if (n > ADMIN_LIMITS[k]) return { error: `${AMOUNT_LABEL[k]}: mỗi lần cộng / trừ tối đa ${fmt(ADMIN_LIMITS[k])}` };
		if (n) req[k] = n * d.amounts[k].sign;
	}
	const lv = d.setLevel.trim();
	if (lv) {
		const n = readDigits(lv);
		if (n === null || n < 1 || n > MAX_LEVEL) return { error: `Đặt cấp: số 1–${MAX_LEVEL}` };
		req.setLevel = n;
	}
	if (!AMOUNT_KEYS.some((k) => req[k]) && req.setLevel === undefined) return { error: 'Chưa nhập thay đổi nào' };
	if (!req.reason) return { error: 'Ghi lý do (bắt buộc — lưu vào nhật ký)' };
	if (req.reason.length > ADMIN_REASON_MAX) return { error: `Lý do tối đa ${ADMIN_REASON_MAX} ký tự` };
	return { req };
}

/** Xem trước: các trường SẼ đổi (trước → sau) theo đúng luật máy chủ — kẹp không âm / không quá trần đã tính sẵn. */
export function previewChanges(c: AdminCharacter, req: AdminGrantRequest): AdminChange[] {
	const before = { level: c.level, exp: c.exp, coins: c.coins, potions: c.potions };
	const after = applyAdminEco(before, req);
	const out: AdminChange[] = [];
	for (const k of ['level', 'exp', 'coins', 'potions'] as const) if (after[k] !== before[k]) out.push({ field: k, from: before[k], to: after[k] });
	if (req.diamonds) {
		const to = Math.max(0, c.diamonds + req.diamonds);
		if (to !== c.diamonds) out.push({ field: 'diamonds', from: c.diamonds, to });
	}
	if (req.talentPoints) {
		const to = cleanBonusPoints(c.bonusPoints + req.talentPoints);
		if (to !== c.bonusPoints) out.push({ field: 'bonusPoints', from: c.bonusPoints, to });
	}
	return out;
}

/**
 * Xem trước NGAY khi đang gõ (chưa kiểm lý do, số sai dạng coi như 0, số quá biên độ kẹp ở biên độ) — mỗi dòng của biểu mẫu hiện
 * "hiện có … → …". Hộp xác nhận dùng bản chặt (`draftToRequest` + `previewChanges`).
 */
export function draftPreview(c: AdminCharacter, d: AdminDraft): AdminChange[] {
	const req: AdminGrantRequest = { characterId: c.id, reason: '' };
	for (const k of AMOUNT_KEYS) {
		const n = readDigits(d.amounts[k].text);
		if (n) req[k] = Math.min(n, ADMIN_LIMITS[k]) * d.amounts[k].sign;
	}
	const lv = readDigits(d.setLevel.trim());
	if (lv && lv >= 1 && lv <= MAX_LEVEL) req.setLevel = lv;
	return previewChanges(c, req);
}

/** "Xu 1.200 → 2.200 (+1.000)". */
export function changeText(c: AdminChange): string {
	const d = c.to - c.from;
	return `${FIELD_LABEL[c.field]} ${fmt(c.from)} → ${fmt(c.to)} (${d > 0 ? '+' : '−'}${fmt(Math.abs(d))})`;
}

/** Một lần cộng trong nhật ký (các dòng cùng lúc + quản trị + nhân vật + lý do gộp lại). */
export interface LogGroup {
	key: string;
	at: number;
	admin: string;
	characterName: string;
	reason: string;
	changes: AdminChange[];
}

/** Gộp nhật ký (máy chủ trả mỗi trường một dòng, mới nhất trước) theo từng lần cộng — giữ thứ tự mới nhất trước. */
export function groupLog(entries: AdminLogEntry[]): LogGroup[] {
	const out: LogGroup[] = [];
	for (const e of entries) {
		const key = `${e.at}|${e.admin}|${e.characterId}|${e.reason}`;
		const last = out.at(-1);
		const change = { field: e.field, from: e.from, to: e.to };
		if (last?.key === key) last.changes.unshift(change);
		else out.push({ key, at: e.at, admin: e.admin, characterName: e.characterName, reason: e.reason, changes: [change] });
	}
	return out;
}

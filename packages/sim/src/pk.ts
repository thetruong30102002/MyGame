/**
 * Đồ sát / truy nã / tiếng xấu (chủ dự án 13/11/2026: "khi ra ngoài vùng sẽ k phải thích đánh ai thì đánh, phải bật đồ sát", "đồ sát
 * là được đánh người, người đánh lại (đánh nhiều người sẽ bị truy nã, tiếng xấu)"; chốt phương án: người không bật vẫn bị đánh và được
 * đánh trả; 3 người vô tội / 30 phút → truy nã; tiếng xấu làm chết rơi nhiều xu / EXP hơn, NPC bán đắt / từ chối, tên đỏ + danh hiệu;
 * giảm dần theo thời gian online hoặc nộp xu chuộc tội). Máy chủ áp luật (`apps/server/src/pvp.ts`), client chỉ hiện. Số là SỐ THỬ.
 */

/** Bị đánh trước: được đánh trả đúng kẻ đó trong khoảng này (không cần bật đồ sát). */
export const PK_RETALIATE_MS = 60_000;
/** Vừa đánh người thì phải chờ chừng này mới tắt được đồ sát. */
export const PK_OFF_COOLDOWN_MS = 60_000;
/** Truy nã: hạ `PK_WANTED_KILLS` người vô tội trong `PK_WANTED_WINDOW_MS` → bị truy nã `PK_WANTED_MS`. */
export const PK_WANTED_KILLS = 3;
export const PK_WANTED_WINDOW_MS = 30 * 60_000;
export const PK_WANTED_MS = 30 * 60_000;
/** Điểm ác cộng mỗi lần hạ người vô tội; trần điểm ác. */
export const PK_INFAMY_PER_KILL = 5;
export const PK_INFAMY_CAP = 100;
/** Tự giảm 1 điểm ác mỗi chừng này thời gian online không hạ người vô tội. */
export const PK_DECAY_MS = 10 * 60_000;
/** Chuộc tội ở chỗ Lena (nhà thờ Thistlewood): xu mỗi điểm ác. */
export const PK_ATONE_COINS = 100;
export const PK_ATONE_NPC = 'village_heal';
/** Điểm ác từ mức này: người bán / người giao việc không tiếp. */
export const PK_REFUSE_AT = 50;

/** Hạ kẻ truy nã: tiền thưởng (máy chủ trả) theo cấp kẻ bị truy nã. */
export function pkBounty(level: number): number {
	return 200 + Math.max(1, Math.floor(level)) * 20;
}

/** Hệ số giá ở cửa hàng: +1% mỗi điểm ác (tối đa ×2). */
export function pkPriceMult(infamy: number): number {
	return 1 + Math.max(0, Math.min(PK_INFAMY_CAP, infamy)) / 100;
}

/** Phần xu / EXP (trong cấp hiện tại) mất khi gục: người thường 0, mỗi điểm ác +0,5% (tối đa 50%). */
export function pkDeathLoss(infamy: number): number {
	return Math.min(0.5, Math.max(0, infamy) * 0.005);
}

/** Danh hiệu xấu theo điểm ác (null = không có). */
export function pkTitle(infamy: number, wanted: boolean): string | null {
	if (wanted) return 'Kẻ bị truy nã';
	if (infamy >= PK_REFUSE_AT) return 'Đồ tể';
	if (infamy >= 20) return 'Sát nhân';
	if (infamy > 0) return 'Kẻ gây sự';
	return null;
}

/** Người chơi phía đối diện như máy chủ biết về họ. */
export interface PkSide {
	/** Đang bật đồ sát. */
	on: boolean;
	/** Đang bị truy nã. */
	wanted: boolean;
}

/**
 * `a` có được đánh `b` không: kẻ truy nã thì ai cũng đánh được; bật đồ sát thì đánh được mọi người; còn lại chỉ đánh trả kẻ vừa
 * đánh mình (`bHitAAt` = lúc `b` đánh trúng `a` gần nhất).
 */
export function pkCanHit(a: PkSide, b: PkSide, bHitAAt: number | undefined, now: number): boolean {
	if (b.wanted || a.on) return true;
	return bHitAAt !== undefined && now - bHitAAt <= PK_RETALIATE_MS;
}

/**
 * Nạn nhân có VÔ TỘI không (để tính điểm ác / truy nã cho kẻ hạ): không bật đồ sát, không bị truy nã và không đánh kẻ hạ mình trước
 * (`victimHitKillerAt` = lúc nạn nhân đánh trúng kẻ hạ gần nhất).
 */
export function pkInnocent(victim: PkSide, victimHitKillerAt: number | undefined, now: number): boolean {
	return !victim.on && !victim.wanted && !(victimHitKillerAt !== undefined && now - victimHitKillerAt <= PK_RETALIATE_MS);
}

/** Trạng thái lưu của một nhân vật (máy chủ, bảng `pk_states`). */
export interface PkRecord {
	infamy: number;
	wantedUntil: number;
	/** Lúc hạ người vô tội (trong cửa sổ truy nã). */
	kills: number[];
	/** Lần cuối điểm ác được tự giảm / tăng (mốc tính giảm dần). */
	decayAt: number;
}
export const newPkRecord = (now: number): PkRecord => ({ infamy: 0, wantedUntil: 0, kills: [], decayAt: now });

/** Hạ một người vô tội: +điểm ác, đủ số trong cửa sổ thì truy nã. Trả bản mới + có vừa bị truy nã không. */
export function pkOnInnocentKill(r: PkRecord, now: number): { r: PkRecord; nowWanted: boolean } {
	const kills = [...r.kills.filter((t) => now - t < PK_WANTED_WINDOW_MS), now];
	const was = r.wantedUntil > now;
	const wanted = kills.length >= PK_WANTED_KILLS;
	return {
		r: { infamy: Math.min(PK_INFAMY_CAP, r.infamy + PK_INFAMY_PER_KILL), wantedUntil: wanted ? now + PK_WANTED_MS : r.wantedUntil, kills, decayAt: now },
		nowWanted: wanted && !was,
	};
}

/** Tự giảm theo thời gian online: mỗi `PK_DECAY_MS` từ `decayAt` bớt 1 điểm. */
export function pkDecay(r: PkRecord, now: number): PkRecord {
	if (r.infamy <= 0) return { ...r, decayAt: now };
	const steps = Math.floor((now - r.decayAt) / PK_DECAY_MS);
	if (steps <= 0) return r;
	return { ...r, infamy: Math.max(0, r.infamy - steps), decayAt: r.decayAt + steps * PK_DECAY_MS };
}

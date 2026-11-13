/**
 * Ngân hàng (chủ dự án 13/11/2026: "ngân hàng có thể gửi xu, mua thỏi vàng (giá vàng, lãi suất thay đổi theo ngày có thể lãi lỗ)"):
 * mỗi tài khoản một sổ, gửi / rút xu ở chủ ngân hàng khu nào cũng được. Lãi gửi xu và giá thỏi vàng đổi theo NGÀY THẬT (giờ Việt
 * Nam), tính tất định từ số ngày — máy chủ và client ra cùng con số, không cần lưu bảng giá. Lãi gửi luôn ≥ 0 (gửi an toàn); thỏi
 * vàng là phần may rủi: mua giá cao hơn, bán giá thấp hơn giá ngày (chênh 2 % mỗi chiều), giá lên xuống ±5 % / ngày, kéo dần về
 * 1.000 xu, giữ trong 500–2.000 xu.
 */
export const BANK = {
	/** Ngày bắt đầu chuỗi giá (13/11/2026, giờ Việt Nam). */
	epochDay: 20770,
	goldBase: 1000,
	goldMin: 500,
	goldMax: 2000,
	/** Biên dao động giá mỗi ngày (±) và lực kéo về giá gốc. */
	goldSwing: 0.05,
	goldPull: 0.08,
	/** Mua cao hơn / bán thấp hơn giá ngày. */
	spread: 0.02,
	/** Lãi gửi mỗi ngày: 0,02 % – 0,12 % (≈ 2 % / tháng), chỉ tính trên tối đa `interestCap` xu. */
	rateMin: 0.0002,
	rateMax: 0.0012,
	interestCap: 200_000,
	maxDeposit: 10_000_000,
	maxBars: 9_999,
} as const;

export interface BankState {
	coins: number;
	bars: number;
	/** Ngày (theo `bankDay`) đã cộng lãi tới. */
	day: number;
}

export const bankDay = (now: number): number => Math.floor((now + 7 * 3600_000) / 86_400_000);

/** Số ngẫu nhiên tất định 0–1 theo ngày + kênh (mulberry32 trên hạt trộn). */
function dayRand(day: number, channel: number): number {
	let t = (Math.imul(day ^ 0x9e3779b9, 0x85ebca6b) + channel * 0x27d4eb2d) >>> 0;
	t = (t + 0x6d2b79f5) >>> 0;
	t = Math.imul(t ^ (t >>> 15), t | 1);
	t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
	return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

const prices: number[] = [BANK.goldBase];
/** Giá thỏi vàng của ngày (xu, số nguyên); trước ngày gốc = giá gốc. */
export function goldPrice(day: number): number {
	const k = day - BANK.epochDay;
	if (k <= 0) return BANK.goldBase;
	while (prices.length <= k) {
		const prev = prices[prices.length - 1]!;
		const swing = (dayRand(BANK.epochDay + prices.length, 1) * 2 - 1) * BANK.goldSwing;
		const pull = ((BANK.goldBase - prev) / BANK.goldBase) * BANK.goldPull;
		prices.push(Math.round(Math.min(BANK.goldMax, Math.max(BANK.goldMin, prev * (1 + swing + pull)))));
	}
	return prices[k]!;
}

/** Lãi gửi xu của ngày (tỉ lệ / ngày). */
export const depositRate = (day: number): number => BANK.rateMin + (BANK.rateMax - BANK.rateMin) * dayRand(day, 2);

/** Giá mua / bán một thỏi trong ngày. */
export const goldBuy = (day: number): number => Math.ceil(goldPrice(day) * (1 + BANK.spread));
export const goldSell = (day: number): number => Math.floor(goldPrice(day) * (1 - BANK.spread));

/** Cộng lãi các ngày đã qua (mỗi ngày trọn một lần, theo lãi của chính ngày đó) — trả sổ mới, không sửa sổ cũ. */
export function accrue(b: BankState | undefined, now: number): BankState {
	const today = bankDay(now);
	if (!b) return { coins: 0, bars: 0, day: today };
	let coins = b.coins;
	for (let d = Math.max(b.day, today - 366); d < today; d++) coins += Math.floor(Math.min(coins, BANK.interestCap) * depositRate(d));
	return { coins: Math.min(BANK.maxDeposit, coins), bars: b.bars, day: Math.max(b.day, today) };
}

/** Bảng giá hôm nay + 7 ngày gần nhất cho quầy ngân hàng. */
export function bankQuote(now: number): { day: number; rate: number; price: number; buy: number; sell: number; history: number[] } {
	const day = bankDay(now);
	return { day, rate: depositRate(day), price: goldPrice(day), buy: goldBuy(day), sell: goldSell(day), history: Array.from({ length: 7 }, (_, i) => goldPrice(day - 6 + i)) };
}

export type BankOp = 'deposit' | 'withdraw' | 'buyGold' | 'sellGold';

/** Một thao tác ở quầy: trả sổ mới + số xu trong túi mới, hoặc lỗi tiếng Việt. */
export function bankApply(b: BankState | undefined, pocket: number, op: BankOp, amount: number, now: number): { bank: BankState; pocket: number } | { error: string } {
	if (!Number.isInteger(amount) || amount <= 0) return { error: 'Số lượng không hợp lệ' };
	const s = accrue(b, now);
	const day = bankDay(now);
	if (op === 'deposit') {
		if (amount > pocket) return { error: 'Không đủ xu trong túi' };
		if (s.coins + amount > BANK.maxDeposit) return { error: `Sổ gửi tối đa ${BANK.maxDeposit.toLocaleString('vi-VN')} xu` };
		return { bank: { ...s, coins: s.coins + amount }, pocket: pocket - amount };
	}
	if (op === 'withdraw') {
		if (amount > s.coins) return { error: 'Sổ gửi không đủ xu' };
		return { bank: { ...s, coins: s.coins - amount }, pocket: pocket + amount };
	}
	if (op === 'buyGold') {
		const cost = goldBuy(day) * amount;
		if (cost > pocket) return { error: 'Không đủ xu trong túi' };
		if (s.bars + amount > BANK.maxBars) return { error: `Giữ tối đa ${BANK.maxBars} thỏi` };
		return { bank: { ...s, bars: s.bars + amount }, pocket: pocket - cost };
	}
	if (op === 'sellGold') {
		if (amount > s.bars) return { error: 'Không đủ thỏi vàng' };
		return { bank: { ...s, bars: s.bars - amount }, pocket: pocket + goldSell(day) * amount };
	}
	return { error: 'Thao tác không có' };
}

/**
 * Trò chơi nhỏ Gia viên — luật dùng chung máy chủ / client (client Unity chép đúng từng phép tính trong `Client/Minigames.cs`).
 *
 * Câu cá (chủ dự án 12/11: "Câu cá cũng phải căn cần kéo thả dây lết cá mệt như câu thật"): sau khi cá mắc câu là một trận kéo, mỗi nhịp
 * 50 ms. GIỮ = thu dây (lực căng tăng, cá lại gần); THẢ = nhả dây (lực căng giảm, cá lết ra xa). Cá giãy từng đợt ngẫu nhiên (hạt giống
 * máy chủ), giãy càng lâu càng mệt (sức kéo giảm). Căng ≥ 100 → đứt dây; cá ra ≥ 100 → sổng; kéo cá về 0 → bắt được. Client gửi các nhịp
 * đổi giữ / thả, máy chủ chạy lại đúng hàm này để xác nhận — không tin kết quả client tự báo.
 *
 * Nấu ăn (chủ dự án 12/11: "Nấu ăn phải nhìn độc đáo căn chín, tái, cháy"): độ chín = thời gian máy chủ đo từ lúc bắt đầu tới lúc nhấc ÷
 * thời gian món; tái < 0,55 ≤ chín < 0,8 ≤ chín kỹ < 1 ≤ cháy.
 */
export const FISH_TICK_MS = 50;
export const FISH_MAX_TICKS = 900; // 45 giây
export const FISH_START = { tension: 20, distance: 45, stamina: 100 } as const;

/** Bộ sinh số ngẫu nhiên mulberry32 — phép tính số nguyên 32 bit, chép được y hệt sang C#. */
export function rng32(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1) >>> 0;
		t = (t ^ (t + Math.imul(t ^ (t >>> 7), t | 61))) >>> 0;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export interface FishFrame { tension: number; distance: number; stamina: number; pull: number; hold: boolean }
export type FishResult = 'caught' | 'snap' | 'escape' | 'open';

/** Một nhịp trận kéo (trạng thái được sửa tại chỗ). */
export function fishStep(st: { tension: number; distance: number; stamina: number; burst: number }, rand: () => number, power: number, hold: boolean): number {
	if (st.burst <= 0 && rand() < 0.045) st.burst = 10 + Math.floor(rand() * 22);
	const raw = st.burst > 0 ? power * 1.6 : power * 0.55;
	if (st.burst > 0) st.burst -= 1;
	const pull = raw * (0.35 + 0.65 * (st.stamina / 100));
	if (hold) {
		st.tension += 1.5 + pull * 2.1;
		st.distance -= Math.max(0.15, 1.15 - pull * 0.45);
		st.stamina -= 0.15 + pull * 0.4;
	} else {
		st.tension -= 3.2;
		st.distance += pull * 0.55;
		st.stamina -= 0.08;
	}
	if (st.tension < 0) st.tension = 0;
	if (st.stamina < 0) st.stamina = 0;
	return pull;
}

/** Chạy lại trận kéo từ hạt giống + các nhịp đổi giữ / thả (tăng dần). Trả kết quả và nhịp kết thúc. */
export function fishFight(seed: number, power: number, toggles: readonly number[], maxTicks = FISH_MAX_TICKS): { result: FishResult; tick: number } {
	const rand = rng32(seed);
	const st = { tension: FISH_START.tension, distance: FISH_START.distance, stamina: FISH_START.stamina, burst: 0 };
	let hold = false, k = 0;
	for (let tick = 0; tick < maxTicks; tick += 1) {
		while (k < toggles.length && toggles[k]! <= tick) { hold = !hold; k += 1; }
		fishStep(st, rand, power, hold);
		if (st.tension >= 100) return { result: 'snap', tick };
		if (st.distance >= 100) return { result: 'escape', tick };
		if (st.distance <= 0) return { result: 'caught', tick };
	}
	return { result: 'open', tick: maxTicks };
}

/** Sức cá theo độ hiếm (trọng số càng nhỏ càng hiếm → càng khoẻ). */
export function fishPower(weight: number): number {
	return weight >= 20 ? 0.8 : weight >= 10 ? 1 : weight >= 3 ? 1.2 : 1.45;
}

export type CookQuality = 'raw' | 'perfect' | 'well' | 'burnt';
export const COOK_QUALITY: Record<CookQuality, { name: string; buff: number; sell: number }> = {
	raw: { name: 'Tái', buff: 0.5, sell: 0.5 },
	perfect: { name: 'Chín', buff: 1, sell: 1 },
	well: { name: 'Chín kỹ', buff: 0.7, sell: 0.8 },
	burnt: { name: 'Cháy', buff: 0, sell: 0.1 },
};
export function cookQuality(elapsedMs: number, cookMs: number): CookQuality {
	const d = elapsedMs / cookMs;
	return d < 0.55 ? 'raw' : d < 0.8 ? 'perfect' : d < 1 ? 'well' : 'burnt';
}

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BANK, accrue, bankApply, bankDay, bankQuote, goldBuy, goldPrice, goldSell } from '../src/bank.ts';

const now = Date.parse('2026-11-13T12:00:00+07:00');
test('ngày gốc 13/11/2026, giá vàng tất định trong khung và có lên có xuống', () => {
	assert.equal(bankDay(now), BANK.epochDay);
	assert.equal(goldPrice(BANK.epochDay), BANK.goldBase);
	const ps = Array.from({ length: 400 }, (_, i) => goldPrice(BANK.epochDay + i));
	assert(ps.every((p) => Number.isInteger(p) && p >= BANK.goldMin && p <= BANK.goldMax));
	assert(ps.some((p, i) => i > 0 && p > ps[i - 1]!) && ps.some((p, i) => i > 0 && p < ps[i - 1]!));
	assert.equal(goldPrice(BANK.epochDay + 77), ps[77]);
	assert.equal(bankQuote(now + 5 * 86_400_000).history.length, 7);
});
test('gửi / rút xu, lãi cộng theo ngày, chỉ tính trên phần tối đa', () => {
	const r = bankApply(undefined, 5000, 'deposit', 3000, now);
	assert(!('error' in r));
	assert.equal(r.pocket, 2000);
	assert.equal(accrue(r.bank, now).coins, 3000, 'cùng ngày chưa có lãi');
	const later = accrue(r.bank, now + 10 * 86_400_000);
	assert(later.coins > 3000 && later.coins < 3000 * 1.02);
	const big = accrue({ coins: 1_000_000, bars: 0, day: BANK.epochDay }, now + 86_400_000).coins - 1_000_000;
	assert(big <= Math.ceil(BANK.interestCap * BANK.rateMax));
	assert('error' in bankApply(r.bank, 0, 'withdraw', 4000, now));
	assert('error' in bankApply(undefined, 100, 'deposit', 200, now));
	assert('error' in bankApply(undefined, 100, 'deposit', 1.5, now));
});
test('mua cao bán thấp: mua rồi bán ngay cùng ngày luôn lỗ', () => {
	const day = bankDay(now);
	const r = bankApply(undefined, 100_000, 'buyGold', 10, now);
	assert(!('error' in r));
	assert.equal(r.pocket, 100_000 - goldBuy(day) * 10);
	const back = bankApply(r.bank, r.pocket, 'sellGold', 10, now);
	assert(!('error' in back) && back.pocket < 100_000 && back.pocket === r.pocket + goldSell(day) * 10);
	assert('error' in bankApply(r.bank, 0, 'sellGold', 11, now));
});

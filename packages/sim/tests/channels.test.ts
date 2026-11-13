import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CHANNEL_COUNT, CHANNEL_SOFT_CAP, baseMap, channelOf, instanceKey, pickChannel } from '../src/channels.ts';

test('khoá bản map theo khu; Gia viên không chia khu', () => {
	assert.equal(instanceKey('swamp/hub', 3), 'swamp/hub#3');
	assert.equal(instanceKey('home/12', 3), 'home/12#1');
	assert.equal(baseMap('swamp/hub#3'), 'swamp/hub');
	assert.equal(channelOf('swamp/hub#3'), 3);
});
test('giữ khu đang đứng nếu chưa đông, đông thì sang khu vắng nhất', () => {
	const counts = Array.from({ length: CHANNEL_COUNT }, () => 0);
	assert.equal(pickChannel(counts, 2), 2);
	counts[1] = CHANNEL_SOFT_CAP;
	counts[0] = 3;
	assert.equal(pickChannel(counts, 2), 3);
	assert.equal(pickChannel(counts, 99), CHANNEL_COUNT);
	assert.equal(pickChannel(counts, 0), 1);
});

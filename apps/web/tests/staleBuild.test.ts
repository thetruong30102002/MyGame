// Chạy: npx tsx tests/staleBuild.test.ts — nhận ra lỗi tải chunk của tab mở từ trước lần deploy (net/staleBuild.ts).
import assert from 'node:assert/strict';
import { isStaleChunkError } from '../src/net/staleBuild';

const chunk = new Error('Failed to load chunk /_next/static/chunks/0abc.js from module 1234');
chunk.name = 'ChunkLoadError';
assert.equal(isStaleChunkError(chunk), true, 'lỗi chunk của Turbopack');
assert.equal(isStaleChunkError(new TypeError('Failed to fetch dynamically imported module: https://x/_next/a.js')), true, 'lỗi import() của Chrome');
assert.equal(isStaleChunkError(new TypeError('Importing a module script failed.')), true, 'lỗi import() của Safari');
assert.equal(isStaleChunkError(new Error('Không tải được bản đồ human/town')), false, 'lỗi thật của game không bị coi là bản cũ');
assert.equal(isStaleChunkError('WebGL không khả dụng'), false);
console.log('✔ staleBuild');

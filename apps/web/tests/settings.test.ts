// Chạy: npx tsx tests/settings.test.ts — cài đặt theo máy (âm thanh, hiển thị): bản lưu hỏng / sửa tay / thiếu trường không
// làm vỡ game, số kẹp 0–1, sai kiểu thì về mặc định.
import assert from 'node:assert/strict';
import { cleanSettings, DEFAULT_SETTINGS } from '../src/store/useSettings';

assert.deepEqual(cleanSettings(null), DEFAULT_SETTINGS, 'không có bản lưu');
assert.deepEqual(cleanSettings('rác'), DEFAULT_SETTINGS);
assert.deepEqual(cleanSettings({ volume: 3, music: -1, sfx: Number.NaN }), { ...DEFAULT_SETTINGS, volume: 1, music: 0 }, 'kẹp 0–1, NaN về mặc định');
assert.deepEqual(cleanSettings({ showOthers: 'false', shake: false, muted: 1 }), { ...DEFAULT_SETTINGS, shake: false }, 'chỉ nhận boolean thật');
assert.deepEqual(cleanSettings({ ...DEFAULT_SETTINGS, showOtherNames: false, extra: 1 }), { ...DEFAULT_SETTINGS, showOtherNames: false }, 'bỏ trường lạ');
console.log('✔ settings.test: bản lưu hỏng / sai kiểu / thiếu trường → mặc định, số kẹp 0–1');

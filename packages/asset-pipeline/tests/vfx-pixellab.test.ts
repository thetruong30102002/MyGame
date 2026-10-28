/**
 * Kiểm phần ĐÈ KHUNG PixelLab vào atlas hiệu ứng — không cần mạng, không đụng atlas thật.
 * Ảnh giả được vẽ trong thư mục tạm của hệ điều hành và xoá sau khi chạy.
 * Chạy: cd packages/asset-pipeline && npx tsx tests/vfx-pixellab.test.ts
 */
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createImage, writePng, type RGBAImage } from '../src/image/rgba.js';
import { parseToolContent } from '../src/pixellab/mcp.js';
import { VFX, type VfxDef } from '../src/vfx/buildVfx.js';
import {
	animateImageCost,
	defaultCanvas,
	drawnSize,
	extractJobId,
	extractPngUrls,
	firstCanvasError,
	isSessionError,
	isTransientError,
	loadPixelLabVfx,
	padCenter,
	parseBalance,
	parseVfxFlags,
	PIXELLAB_VFX_PRESETS,
	type PixelLabVfxMeta,
} from '../src/vfx/pixellabVfx.js';

const root = mkdtempSync(join(tmpdir(), 'havenlord-vfx-test-'));
let passed = 0;
function test(name: string, fn: () => void): void {
	fn();
	passed += 1;
	console.log(`  ✔ ${name}`);
}
const def = (id: string): VfxDef => {
	const d = VFX.find((v) => v.id === id);
	if (!d) throw new Error(`thiếu VfxDef ${id}`);
	return d;
};

/** Hình tròn đặc màu cam bán kính r ở tâm (cx, cy), thêm một vòng viền mờ alpha 60 (không được tính vào khung bao). */
function disc(size: number, r: number, cx = size / 2, cy = size / 2): RGBAImage {
	const img = createImage(size, size);
	for (let y = 0; y < size; y += 1)
		for (let x = 0; x < size; x += 1) {
			const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
			if (d <= r) img.data.set([240, 120, 20, 255], (y * size + x) * 4);
			else if (d <= r + 3) img.data.set([255, 200, 120, 60], (y * size + x) * 4);
		}
	return img;
}

function writeSet(id: string, imgs: RGBAImage[], extra: Partial<PixelLabVfxMeta> = {}): void {
	const dir = join(root, id);
	mkdirSync(dir, { recursive: true });
	const files = imgs.map((img, i) => {
		const name = `frame_${String(i).padStart(3, '0')}.png`;
		writePng(join(dir, name), img);
		return name;
	});
	const meta: PixelLabVfxMeta = {
		id,
		canvas: { w: imgs[0]!.width, h: imgs[0]!.height },
		first: { prompt: 'thử', image: 'first.png', source: 'file' },
		action: 'thử',
		frameCount: imgs.length - 1,
		inputIncluded: true,
		files,
		createdAt: new Date(0).toISOString(),
		...extra,
	};
	writeFileSync(join(dir, 'meta.json'), JSON.stringify(meta));
}

function alphaValues(img: RGBAImage): Set<number> {
	const s = new Set<number>();
	for (let i = 3; i < img.data.length; i += 4) s.add(img.data[i]!);
	return s;
}

try {
	console.log('vfx-pixellab');

	test('chưa có thư mục → none (giữ khung cũ)', () => {
		assert.equal(loadPixelLabVfx(root, def('slash')).status, 'none');
	});

	test('loop: bỏ ảnh đầu vào, thu về đúng size, alpha cứng, viền mờ không nới khung', () => {
		// fire_orb: loop, size 24. PixelLab 48×48: ảnh 0 = đầu vào, 4 khung sinh ra phập phồng bán kính 14–18.
		writeSet('fire_orb', [disc(48, 16), disc(48, 14), disc(48, 16), disc(48, 18), disc(48, 16)]);
		const r = loadPixelLabVfx(root, def('fire_orb'));
		assert.equal(r.status, 'ok');
		if (r.status !== 'ok') return;
		assert.equal(r.frames.length, 4, 'loop bỏ ảnh 0');
		for (const f of r.frames) {
			assert.equal(f.width, r.frames[0]!.width, 'mọi khung cùng cỡ');
			assert.equal(f.height, r.frames[0]!.height);
			assert.deepEqual([...alphaValues(f)].sort((a, b) => a - b), [0, 255], 'alpha chỉ 0/255');
		}
		// Khung bao chung = hình tròn lớn nhất (r 18 → 36px) → thu về cạnh dài 24.
		assert.equal(Math.max(r.frames[0]!.width, r.frames[0]!.height), 24);
	});

	test('burst: giữ ảnh đầu vào, bỏ khung trống ở cuối', () => {
		writeSet('fire_burst', [disc(64, 6), disc(64, 14), disc(64, 22), disc(64, 28), disc(64, 20), createImage(64, 64), createImage(64, 64)]);
		const r = loadPixelLabVfx(root, def('fire_burst'));
		assert.equal(r.status, 'ok');
		if (r.status !== 'ok') return;
		assert.equal(r.frames.length, 5, '7 ảnh − 2 khung trống cuối');
		// fire_burst size 64; khung bao chung r 28 → 56px ≤ 64 → giữ 1:1 (không phóng lẻ).
		assert.equal(r.frames[0]!.width, 56);
	});

	test('meta.useInput đè lựa chọn mặc định', () => {
		writeSet('arcane_orb', [disc(32, 10), disc(32, 9), disc(32, 10), disc(32, 11), disc(32, 10)], { useInput: true });
		const r = loadPixelLabVfx(root, def('arcane_orb'));
		assert.equal(r.status === 'ok' && r.frames.length, 5);
	});

	test('hiệu ứng mặt đất giữ squashY', () => {
		// magic_circle: size 84, squashY 0.5. Hình tròn r 50 → 100px → thu về 84 rồi ép cao còn một nửa.
		writeSet('magic_circle', [disc(128, 50), disc(128, 50), disc(128, 46), disc(128, 40), disc(128, 30)]);
		const r = loadPixelLabVfx(root, def('magic_circle'));
		assert.equal(r.status, 'ok');
		if (r.status !== 'ok') return;
		assert.equal(r.frames[0]!.width, 84);
		assert.equal(r.frames[0]!.height, 42);
	});

	test('hình nhỏ hơn size chỉ phóng NGUYÊN lần', () => {
		// arcane_burst size 52; khung bao r 6 → 12px → ×4 = 48 (không phóng lẻ lên 52).
		writeSet('arcane_burst', [disc(32, 3), disc(32, 6), disc(32, 4)]);
		const r = loadPixelLabVfx(root, def('arcane_burst'));
		assert.equal(r.status === 'ok' && r.frames[0]!.width, 48);
	});

	test('still chỉ lấy ảnh đầu, mượn thư mục của hiệu ứng gốc (dark_ring_warn → dark_ring)', () => {
		writeSet('dark_ring', [disc(64, 30), disc(64, 20), disc(64, 10)], { frameCount: 2 });
		const r = loadPixelLabVfx(root, def('dark_ring_warn'));
		assert.equal(r.status === 'ok' && r.frames.length, 1);
		assert.equal(loadPixelLabVfx(root, def('dark_ring')).status, 'ok');
	});

	test('meta.drop bỏ đúng khung khi duyệt, không đụng lựa chọn ảnh 0', () => {
		writeSet('fire_burst', [disc(64, 8), disc(64, 12), disc(64, 30), disc(64, 14)], { frameCount: 3, drop: ['frame_002.png'] });
		const r = loadPixelLabVfx(root, def('fire_burst'));
		assert.equal(r.status === 'ok' && r.frames.length, 3);
	});

	test('meta.keyDark xoá nền tối bị nướng vào ảnh', () => {
		const baked = (r: number): RGBAImage => {
			const img = disc(64, r);
			for (let i = 0; i < img.data.length; i += 4) if (!img.data[i + 3]) img.data.set([30, 28, 40, 255], i);
			return img;
		};
		writeSet('light_pillar', [baked(10), baked(14), baked(12)], { frameCount: 2 });
		const full = loadPixelLabVfx(root, def('light_pillar'));
		writeSet('light_pillar', [baked(10), baked(14), baked(12)], { frameCount: 2, keyDark: 112 });
		const keyed = loadPixelLabVfx(root, def('light_pillar'));
		assert.ok(full.status === 'ok' && keyed.status === 'ok');
		// Nền đục kín khung → khung bao = cả 64px; tách nền xong chỉ còn đĩa (bán kính 14 → ~28px).
		assert.ok(full.status === 'ok' && keyed.status === 'ok' && keyed.frames[0]!.width < full.frames[0]!.width);
	});

	test('thư mục dở dang → incomplete (giữ khung cũ, không vỡ)', () => {
		mkdirSync(join(root, 'wind_spin'), { recursive: true });
		writePng(join(root, 'wind_spin', 'first.png'), disc(40, 10));
		const noMeta = loadPixelLabVfx(root, def('wind_spin'));
		assert.equal(noMeta.status, 'incomplete');
		writeSet('water_wave', [disc(36, 10), disc(36, 11), disc(36, 12)], { frameCount: 4 });
		const short = loadPixelLabVfx(root, def('water_wave'));
		assert.equal(short.status, 'incomplete');
		writeSet('sparkle', [createImage(80, 80), createImage(80, 80), createImage(80, 80)]);
		assert.equal(loadPixelLabVfx(root, def('sparkle')).status, 'incomplete', 'mọi khung trong suốt');
		writeSet('slash', [disc(92, 30), disc(92, 30), disc(92, 30)], { id: 'fire_orb' });
		assert.equal(loadPixelLabVfx(root, def('slash')).status, 'incomplete', 'meta ghi nhầm id');
	});

	test('đọc job id, link png, ảnh nhúng trong phản hồi MCP', () => {
		assert.equal(extractJobId('Job queued. job_id: 1b2c3d4e-0000-4000-8000-123456789abc (poll get_image)'), '1b2c3d4e-0000-4000-8000-123456789abc');
		assert.equal(extractJobId('{"job_id": "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee"}'), 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee');
		assert.equal(extractJobId('không có gì'), null);
		const urls = extractPngUrls('frame 0: https://x.test/a/0.png\nframe 1: https://x.test/a/1.png?sig=1 lại https://x.test/a/0.png (zip: https://x.test/a.zip)');
		assert.deepEqual(urls, ['https://x.test/a/0.png', 'https://x.test/a/1.png?sig=1']);
		const parsed = parseToolContent([
			{ type: 'text', text: 'xong' },
			{ type: 'image', data: Buffer.from('A').toString('base64'), mimeType: 'image/png' },
			{ type: 'text', text: 'hai' },
			{ type: 'image', data: Buffer.from('B').toString('base64') },
		]);
		assert.equal(parsed.text, 'xong\nhai');
		assert.deepEqual(parsed.images.map((i) => i.data.toString()), ['A', 'B']);
	});

	test('ước tính lượt animate_image', () => {
		assert.equal(animateImageCost(64, 64, 8), 1);
		assert.equal(animateImageCost(128, 128, 16), 4);
		assert.equal(animateImageCost(132, 132, 8), 3);
		assert.equal(animateImageCost(24, 24, 4), 1);
	});

	test('cờ: --dry thắng mọi vị trí, cờ cần giá trị không nuốt "--…"', () => {
		assert.throws(() => parseVfxFlags(['--first', '--dry']), /Thiếu giá trị cho --first/);
		assert.throws(() => parseVfxFlags(['--action', '--dry']), /Thiếu giá trị cho --action/);
		assert.throws(() => parseVfxFlags(['--first', '  ']), /Thiếu giá trị/);
		assert.throws(() => parseVfxFlags(['--first']), /Thiếu giá trị/);
		assert.throws(() => parseVfxFlags(['--model', 'pro']), /--model phải là/);
		assert.equal(parseVfxFlags(['--first', 'x', '--dry']).dry, true);
		assert.equal(parseVfxFlags(['--dry', '--first', 'x']).first, 'x');
		const o = parseVfxFlags(['--model', 'pro_flash', '--first-only', '--first-size', '32', '--redraw-first']);
		assert.deepEqual([o.model, o.firstOnly, o.firstSize, o.redrawFirst, o.dry], ['pro_flash', true, 32, true, false]);
	});

	test('số dư get_balance (đúng định dạng đọc được ngày 07/10/2026)', () => {
		const text = ['credits: $0.00', 'generations_remaining: 0', 'generations_used: 72', 'generations_total: 40', 'subscription: trial', 'generations_today: 5', 'note: ...'].join('\n');
		assert.deepEqual(parseBalance(text), { remaining: 0, today: 5, credits: 0 });
		assert.deepEqual(parseBalance('credits: $1.50\ngenerations_remaining: 12'), { remaining: 12, today: 0, credits: 1.5 });
		assert.equal(parseBalance('HTTP 500'), null);
	});

	test('khổ khung đầu theo từng công cụ, vẽ nhỏ rồi đặt vào giữa', () => {
		assert.equal(firstCanvasError('pixen', 24, 24), null);
		assert.match(firstCanvasError('pixen', 24, 28) ?? '', /vuông/);
		assert.match(firstCanvasError('pixflux', 24, 24) ?? '', /32×32/);
		assert.equal(firstCanvasError('pixflux', 32, 32), null);
		assert.match(firstCanvasError('pro_flash', 260, 260) ?? '', /16–256/);
		assert.match(firstCanvasError('pixen', 30, 30) ?? '', /bội 4/);
		assert.equal(drawnSize(64, 0.5), 32);
		assert.equal(drawnSize(52, 0.5), 28);
		assert.equal(drawnSize(24, 0.5), 16);
		assert.equal(drawnSize(92), 92);
		assert.equal(drawnSize(64, 0.5, 40), 40);
		for (const [id, pr] of Object.entries(PIXELLAB_VFX_PRESETS)) {
			const c = defaultCanvas(def(id));
			const d = drawnSize(c, pr.firstScale);
			assert.equal(firstCanvasError('pixen', d, d), null, `${id}: khung đầu ${d} hợp lệ với pixen`);
		}
		const small = disc(32, 10);
		const padded = padCenter(small, 64, 64);
		assert.deepEqual([padded.width, padded.height], [64, 64]);
		const at = (img: RGBAImage, x: number, y: number) => Array.from(img.data.subarray((y * img.width + x) * 4, (y * img.width + x) * 4 + 4));
		assert.deepEqual(at(padded, 16 + 16, 16 + 16), at(small, 16, 16), 'tâm ảnh nhỏ nằm ở tâm canvas');
		assert.deepEqual(at(padded, 2, 2), [0, 0, 0, 0], 'phần đệm trong suốt');
		assert.throws(() => padCenter(disc(80, 10), 64, 64), /lớn hơn canvas/);
	});

	test('lỗi tạm khi chờ job: thử lại; lỗi thật: ném ra', () => {
		assert.equal(isTransientError(new TypeError('fetch failed')), true);
		assert.equal(isTransientError(new Error('[dc03…] HTTP 502: Bad Gateway')), true);
		assert.equal(isTransientError(new Error('Tải https://x.test/a.png lỗi HTTP 503')), true);
		assert.equal(isSessionError(new Error('[dc03…] HTTP 404: session not found')), true);
		assert.equal(isSessionError(new Error('[dc03…] HTTP 400: Bad Request')), true);
		assert.equal(isSessionError(new Error('Tải https://x.test/a.png lỗi HTTP 404')), false, 'link ảnh 404 không phải lỗi phiên');
		assert.equal(isTransientError(new Error('[dc03…] get_image: job failed: invalid prompt')), false);
		assert.equal(isTransientError(new Error('[dc03…] animate_image: not enough generations')), false);
	});

	test('preset: vệt chém DỌC, hiệu ứng bị tint vẽ gam trắng', () => {
		assert.match(PIXELLAB_VFX_PRESETS.slash!.first, /vertical/);
		assert.match(PIXELLAB_VFX_PRESETS.slash!.action, /top to bottom/);
		assert.doesNotMatch(PIXELLAB_VFX_PRESETS.slash!.action, /left to right/);
		for (const id of ['slash', 'magic_circle', 'arcane_orb', 'sparkle', 'light_pillar']) {
			const first = PIXELLAB_VFX_PRESETS[id]!.first;
			assert.match(first, /white/, `${id} bị game tô tint → phải vẽ gam trắng`);
			assert.doesNotMatch(first, /golden|violet and cyan|green-white|white-cyan|white-gold/, `${id} không được vẽ màu bão hoà`);
		}
	});

	console.log(`${passed} test đạt`);
} finally {
	rmSync(root, { recursive: true, force: true });
}

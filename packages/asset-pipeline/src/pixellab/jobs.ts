/**
 * Chờ / gửi lại lệnh PixelLab — dùng chung CLI và công cụ nhân vật ghép lớp (src/layered). Tách nguyên văn khỏi cli.ts 28/10/2026.
 */
import { decodePng, type RGBAImage } from '../image/rgba.js';
import { extractPngUrls, isSessionError, isTransientError } from '../vfx/pixellabVfx.js';
import type { McpToolResult, PixelLabMcp } from './mcp.js';

/**
 * Chờ hết lệnh đang chạy của một tài khoản. Máy chủ trả về ngay khi có lệnh xong (hoặc khi hết thời gian
 * chờ của nó), nên lặp tới khi không còn lệnh nào — hàng đợi miễn phí có lúc mất trên 10 phút một nhân vật.
 */
export async function waitJobs(mcp: PixelLabMcp): Promise<void> {
	// Lệnh vừa gửi có thể chưa kịp vào hàng đợi: đã gặp wait_for_jobs trả "No active jobs" ngay sau create,
	// rồi bước tải gói ăn lỗi 423 (đang vẽ dở). Nên chờ một nhịp, và chỉ tin là xong khi list_jobs cũng trống.
	await sleep(15_000);
	const deadline = Date.now() + 2 * 3600 * 1000;
	while (Date.now() < deadline) {
		const text = await mcp.call('wait_for_jobs', { timeout_seconds: 400 });
		if (!/no active jobs|\b0 still running/i.test(text)) continue;
		// Câu "no active jobs (nothing pending or processing)" cũng chứa chữ pending/processing — chỉ coi là còn
		// việc khi có DÒNG lệnh dạng "<uuid> processing 5%" (đã kẹt 12 phút vì so chữ trần).
		const jobs = await mcp.call('list_jobs');
		if (/no active jobs/i.test(jobs) || !/[0-9a-f-]{36}\s+(processing|queued|pending)/i.test(jobs)) return;
		await sleep(10_000);
	}
	throw new Error(`[${mcp.label}] chờ quá 2 giờ, lệnh vẫn chưa xong`);
}

/**
 * Chờ mọi animation của MỘT nhân vật vẽ xong. Animation còn xếp hàng KHÔNG hiện trong list_jobs/wait_for_jobs
 * (đã gặp: chờ trả về ngay, tải gói thiếu hẳn animation vừa gửi) mà chỉ hiện trong get_character dạng
 * "walk(south): 8% ~440s" → đọc thẳng dòng đó.
 */
export async function waitCharacter(mcp: PixelLabMcp, uuid: string): Promise<void> {
	await sleep(15_000);
	const deadline = Date.now() + 2 * 3600 * 1000;
	while (Date.now() < deadline) {
		const text = await mcp.call('get_character', { character_id: uuid });
		if (!/^\s*[\w-]+\([\w-]+\):\s*\d+%/m.test(text) && !/status:\s*(pending|processing|queued)/i.test(text)) return;
		await sleep(20_000);
	}
	throw new Error(`[${mcp.label}] chờ nhân vật ${uuid} quá 2 giờ`);
}

/**
 * Hết ô lệnh thì máy chủ từ chối → chờ rồi gửi lại. Gói Free (1 ô) báo "job slots"; gói trả phí báo "Maximum 10 concurrent
 * background jobs", rồi từ tối 09/10/2026 đổi thành "rate limit exceeded (10/10 jobs)" — thiếu mẫu nào thì lệnh chạy hàng loạt
 * bị bỏ ngang (đã dẫm cả hai lần).
 */
export async function callWhenFree(mcp: PixelLabMcp, tool: string, args: Record<string, unknown>): Promise<string> {
	for (let attempt = 0; ; attempt += 1) {
		try {
			return await mcp.call(tool, args);
		} catch (e) {
			// Lệnh đang chiếm ô có thể không hiện trong list_jobs (animation xếp hàng) → chờ theo nhịp cố định.
			// Gói trả phí chạy hàng loạt lệnh song song nên có thể chờ ô trống lâu — tối đa ~2 giờ.
			if (attempt >= 240 || !/job slots|concurrent background jobs|rate limit exceeded|\d+\/\d+ jobs/i.test(String(e))) throw e;
			if (attempt === 0) console.log(`  (${mcp.label} đang bận lệnh khác — chờ xong rồi gửi lại)`);
			await sleep(30_000);
		}
	}
}

export function sleep(ms: number): Promise<void> {
	return new Promise((r) => setTimeout(r, ms));
}

/**
 * Chờ job ảnh (create_image_* / animate_image) xong rồi lấy ĐÚNG `expected` ảnh theo thứ tự. get_image trả ảnh
 * nhúng (base64) và/hoặc link .png trong chữ, và có thể chỉ nhúng vài ảnh đầu của chuỗi dài → thiếu thì lấy từng
 * ảnh bằng tham số `index`. Job đã TRẢ LƯỢT nên lỗi mạng/5xx/phiên hết hạn chỉ là tạm: thử lại có giới hạn, phiên
 * hỏng thì khởi tạo lại. `size`: mọi ảnh phải đúng cỡ này (lọc link thừa, vd sheet ghép).
 */
export async function waitImages(mcp: PixelLabMcp, jobId: string, expected: number, size?: { w: number; h: number }): Promise<RGBAImage[]> {
	const busy = /processing|pending|queued|in[ _]progress|not (yet )?(ready|complete|finished)|\d+\s*%/i;
	const fits = (im: RGBAImage) => !size || (im.width === size.w && im.height === size.h);
	let transient = 0;
	const retry = async <T,>(fn: () => Promise<T>): Promise<T> => {
		for (;;) {
			try {
				return await fn();
			} catch (e) {
				if (!isTransientError(e) || busy.test(String(e)) || transient >= 30) throw e;
				transient += 1;
				if (isSessionError(e)) mcp.resetSession();
				console.log(`  (lỗi tạm khi chờ job ${jobId}: ${String(e instanceof Error ? e.message : e).slice(0, 120)} — thử lại ${transient}/30)`);
				await sleep(15_000);
			}
		}
	};
	await sleep(10_000);
	const deadline = Date.now() + 3600 * 1000;
	while (Date.now() < deadline) {
		let res: McpToolResult;
		try {
			res = await retry(() => mcp.callFull('get_image', { job_id: jobId }));
		} catch (e) {
			if (!busy.test(String(e))) throw e;
			await sleep(15_000);
			continue;
		}
		const urls = extractPngUrls(res.text);
		if (!res.images.length && !urls.length) {
			if (/\b(failed|error|cancel+ed)\b/i.test(res.text) && !busy.test(res.text)) throw new Error(`[${mcp.label}] job ${jobId} hỏng: ${res.text.slice(0, 300)}`);
			await sleep(15_000);
			continue;
		}
		if (res.images.length >= expected) {
			const imgs = res.images.slice(0, expected).map((im) => decodePng(im.data));
			if (imgs.every(fits)) return imgs;
		}
		if (urls.length >= expected) {
			const all: RGBAImage[] = [];
			for (const u of urls) all.push(await retry(() => downloadPng(u)));
			const ok = all.filter(fits);
			if (ok.length >= expected) return ok.slice(0, expected);
		}
		const out: RGBAImage[] = [];
		for (let i = 0; i < expected; i += 1) {
			const one = await retry(() => mcp.callFull('get_image', { job_id: jobId, index: i }));
			const url = extractPngUrls(one.text)[0];
			let img: RGBAImage;
			if (one.images[0]) img = decodePng(one.images[0].data);
			else if (url) img = await retry(() => downloadPng(url));
			else throw new Error(`[${mcp.label}] job ${jobId}: không lấy được ảnh ${i}/${expected}: ${one.text.slice(0, 200)}`);
			if (!fits(img)) throw new Error(`[${mcp.label}] job ${jobId}: ảnh ${i} cỡ ${img.width}×${img.height}, cần ${size!.w}×${size!.h}`);
			out.push(img);
		}
		return out;
	}
	throw new Error(`[${mcp.label}] chờ job ${jobId} quá 1 giờ`);
}

export async function downloadPng(url: string): Promise<RGBAImage> {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Tải ${url.split('?')[0]} lỗi HTTP ${res.status}`);
	return decodePng(Buffer.from(await res.arrayBuffer()));
}

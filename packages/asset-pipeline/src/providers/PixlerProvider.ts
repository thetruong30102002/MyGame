import { decodePng } from '../image/rgba.js';
import type { AssetLicense } from './types.js';

/**
 * Client REST của Pixler (pixler.dev): POST /generate, /edit, /animate; GET /jobs/{id}, /quota.
 * Mọi lời gọi POST tốn quota (gói Common: 5 lượt sinh + 2 lượt animate/ngày), nên quy trình nhiều
 * ngày nằm ở `pixler/session.ts` — lưu job id + ảnh tải về để không bao giờ phải sinh lại.
 */
export const PIXLER_LICENSE: AssetLicense = {
	name: 'Pixler Terms',
	url: 'https://pixler.dev/',
	commercialUse: true,
	attributionRequired: false,
	notes: 'Asset do tài khoản sinh ra thuộc sở hữu người dùng, dùng thương mại không cần ghi công.',
};

export type PixlerAnimationPreset = 'Idle' | 'Walk' | 'Run' | 'Jump' | 'Attack' | 'Cast' | 'Hurt' | 'Death' | 'Crouch' | 'Float' | 'Turnaround' | 'Custom';

export interface PixlerJob {
	id: string;
	type?: 'Generation' | 'Animation';
	status: 'Queued' | 'Running' | 'Processing' | 'Completed' | 'Failed';
	width?: number;
	height?: number;
	images?: { index: number; url?: string }[];
	sheet?: unknown;
	error?: string | null;
}

export interface PixlerQuota {
	remaining: number;
	total: number;
	type: string;
	resetAt: string;
	animationsRemaining: number;
	animationsTotal: number;
}

export class PixlerProvider {
	readonly name = 'pixler';

	constructor(
		private readonly apiKey: string | undefined,
		private readonly baseUrl = 'https://api.pixler.dev/api/v1',
	) {}

	quota(): Promise<PixlerQuota> {
		return this.request('GET', '/quota') as Promise<PixlerQuota>;
	}

	generate(body: { prompt: string; width: number; height: number; count: number; type?: 'Sprite' | 'Item' | 'Tile' | 'Background'; transparent?: boolean; maxColors?: number }): Promise<PixlerJob> {
		return this.runJob('/generate', { type: 'Sprite', transparent: true, ...body, prompt: body.prompt.slice(0, 300) });
	}

	edit(body: { jobId: string; imageIndex: number; instruction: string }): Promise<PixlerJob> {
		return this.runJob('/edit', { ...body, instruction: body.instruction.slice(0, 400) });
	}

	animate(body: { jobId: string; imageIndex: number; preset: PixlerAnimationPreset; frameCount: number; customPrompt?: string }): Promise<PixlerJob> {
		return this.runJob('/animate', body);
	}

	job(id: string): Promise<PixlerJob> {
		return this.request('GET', `/jobs/${id}`) as Promise<PixlerJob>;
	}

	/** PNG gốc của một ảnh trong job (link CDN hết hạn nên luôn tải qua API rồi lưu đĩa). */
	async downloadPng(jobId: string, index: number): Promise<Buffer> {
		const res = await fetch(`${this.baseUrl}/jobs/${jobId}/images/${index}`, { headers: this.headers() });
		if (!res.ok) throw new Error(`Pixler tải ảnh ${jobId}#${index} lỗi HTTP ${res.status}`);
		const buf = Buffer.from(await res.arrayBuffer());
		decodePng(buf);
		return buf;
	}

	private async runJob(path: string, body: unknown): Promise<PixlerJob> {
		const created = (await this.request('POST', path, body)) as PixlerJob;
		const deadline = Date.now() + 6 * 60_000;
		for (;;) {
			const job = await this.job(created.id);
			if (job.status === 'Completed') return job;
			if (job.status === 'Failed') throw new Error(`Pixler job ${job.id} thất bại: ${job.error ?? 'không rõ'}`);
			if (Date.now() > deadline) throw new Error(`Pixler job ${job.id} quá 6 phút — chạy lại lệnh sẽ lấy tiếp theo job id đã lưu`);
			await sleep(1500);
		}
	}

	private async request(method: 'GET' | 'POST', path: string, body?: unknown): Promise<unknown> {
		for (let attempt = 0; ; attempt += 1) {
			const res = await fetch(`${this.baseUrl}${path}`, {
				method,
				headers: { ...this.headers(), 'Content-Type': 'application/json' },
				body: body === undefined ? undefined : JSON.stringify(body),
			});
			if (res.ok) return res.json();
			const err = (await res.json().catch(() => ({}))) as { code?: string; title?: string; detail?: string };
			// 429 concurrency/queue thì chờ rồi thử lại; hết quota thì dừng hẳn (thử lại vẫn tốn lượt nếu lọt).
			const retryable = res.status === 503 || (res.status === 429 && err.code !== 'quota_exceeded');
			if (retryable && attempt < 5) {
				await sleep(Number(res.headers.get('Retry-After') ?? 3) * 1000);
				continue;
			}
			throw new Error(`Pixler ${method} ${path} → HTTP ${res.status} ${err.code ?? ''} ${err.title ?? ''} ${err.detail ?? ''}`.trim());
		}
	}

	private headers(): Record<string, string> {
		if (!this.apiKey) throw new Error('[pixler] thiếu PIXELER_API_KEY trong .env.local');
		return { Authorization: `Bearer ${this.apiKey}` };
	}
}

function sleep(ms: number): Promise<void> {
	return new Promise((r) => setTimeout(r, ms));
}

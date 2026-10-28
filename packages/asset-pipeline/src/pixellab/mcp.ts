/**
 * Gọi công cụ của máy chủ MCP PixelLab trực tiếp qua HTTP (JSON-RPC, "streamable HTTP"), chọn được
 * token cho từng lệnh — để dùng lượt của nhiều tài khoản mà không phải sửa cấu hình MCP của Claude.
 * Token không bao giờ được in ra; log chỉ dùng 4 ký tự đầu.
 */
const ENDPOINT = 'https://api.pixellab.ai/mcp';

export function tokenLabel(token: string): string {
	return `${token.slice(0, 4)}…`;
}

interface McpContent {
	type: string;
	text?: string;
	data?: string;
	mimeType?: string;
	resource?: { blob?: string; mimeType?: string; text?: string };
}

export interface McpImage {
	data: Buffer;
	mimeType: string;
}

export interface McpToolResult {
	text: string;
	images: McpImage[];
}

/** Tách phần chữ và ảnh nhúng (`image` base64, hoặc `resource` có `blob` ảnh) khỏi content của một kết quả. */
export function parseToolContent(content: McpContent[]): McpToolResult {
	const text = content
		.filter((c) => c.type === 'text')
		.map((c) => c.text ?? '')
		.join('\n');
	const images: McpImage[] = [];
	for (const c of content) {
		if (c.type === 'image' && c.data) images.push({ data: Buffer.from(c.data, 'base64'), mimeType: c.mimeType ?? 'image/png' });
		else if (c.type === 'resource' && c.resource?.blob && (c.resource.mimeType ?? '').startsWith('image/'))
			images.push({ data: Buffer.from(c.resource.blob, 'base64'), mimeType: c.resource.mimeType! });
	}
	return { text, images };
}

export class PixelLabMcp {
	private session: string | null = null;
	private seq = 0;

	constructor(private readonly token: string) {}

	get label(): string {
		return tokenLabel(this.token);
	}

	/** Bỏ phiên hiện tại — lần gọi sau tự `initialize` lại (phiên hết hạn giữa lúc chờ job dài). */
	resetSession(): void {
		this.session = null;
	}

	/** Gọi một công cụ; trả về phần chữ của kết quả (ảnh nhúng bị bỏ qua). Lỗi công cụ thì ném lỗi. */
	async call(tool: string, args: Record<string, unknown> = {}): Promise<string> {
		return (await this.callFull(tool, args)).text;
	}

	/**
	 * Như `call` nhưng trả thêm ẢNH NHÚNG (content `type: 'image'`, base64) theo đúng thứ tự máy chủ gửi —
	 * `get_image` trả ảnh kiểu này bên cạnh link tải. Lỗi công cụ vẫn ném lỗi y như `call`.
	 */
	async callFull(tool: string, args: Record<string, unknown> = {}): Promise<McpToolResult> {
		if (!this.session) await this.initialize();
		const res = await this.rpc('tools/call', { name: tool, arguments: args });
		const result = res as { content?: McpContent[]; isError?: boolean };
		const parsed = parseToolContent(result.content ?? []);
		if (result.isError) throw new Error(`[${this.label}] ${tool}: ${parsed.text}`);
		return parsed;
	}

	private async initialize(): Promise<void> {
		await this.rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'havenlord-asset-pipeline', version: '0.1.0' } });
		await this.post({ jsonrpc: '2.0', method: 'notifications/initialized' });
	}

	private async rpc(method: string, params: unknown): Promise<unknown> {
		this.seq += 1;
		const body = await this.post({ jsonrpc: '2.0', id: this.seq, method, params });
		const msg = parseMessage(body);
		if (msg.error) throw new Error(`[${this.label}] ${method}: ${msg.error.message ?? JSON.stringify(msg.error)}`);
		return msg.result;
	}

	private async post(payload: unknown): Promise<string> {
		const res = await fetch(ENDPOINT, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${this.token}`,
				'Content-Type': 'application/json',
				Accept: 'application/json, text/event-stream',
				...(this.session ? { 'Mcp-Session-Id': this.session } : {}),
			},
			body: JSON.stringify(payload),
		});
		const sid = res.headers.get('mcp-session-id');
		if (sid) this.session = sid;
		const text = await res.text();
		if (!res.ok && res.status !== 202) throw new Error(`[${this.label}] HTTP ${res.status}: ${text.slice(0, 300)}`);
		return text;
	}
}

/** Kết quả có thể là JSON thuần hoặc luồng SSE (`data: {...}`) — lấy tin JSON-RPC cuối cùng có id. */
function parseMessage(body: string): { result?: unknown; error?: { message?: string } } {
	const trimmed = body.trim();
	if (trimmed.startsWith('{')) return JSON.parse(trimmed) as { result?: unknown };
	const datas = trimmed
		.split(/\r?\n/)
		.filter((l) => l.startsWith('data:'))
		.map((l) => l.slice(5).trim())
		.filter(Boolean);
	for (let i = datas.length - 1; i >= 0; i -= 1) {
		const m = JSON.parse(datas[i]!) as { id?: number; result?: unknown; error?: { message?: string } };
		if (m.id !== undefined) return m;
	}
	throw new Error(`Phản hồi MCP không đọc được: ${trimmed.slice(0, 200)}`);
}

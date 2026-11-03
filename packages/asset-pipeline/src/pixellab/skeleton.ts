/**
 * Khung xương PixelLab (COCO-18) cho animate_with_skeleton_v3: đo khung xương của một ảnh bằng `POST /v2/estimate-skeleton`
 * (0,1 lượt / ảnh, cùng token với MCP). Toạ độ trả về là tỉ lệ 0–1 của ảnh gửi lên.
 */
import { encodePng, type RGBAImage } from '../image/rgba.js';

export interface Keypoint {
	label: string;
	x: number;
	y: number;
	z_index: number;
	/** Độ sâu 0–255 (~128 = giữa thân, lớn hơn = gần người xem); bỏ trống thì PixelLab lấy theo thân mẫu của hướng. */
	depth?: number;
}

const ENDPOINT = 'https://api.pixellab.ai/v2/estimate-skeleton';

export async function estimateSkeleton(token: string, img: RGBAImage): Promise<Keypoint[]> {
	const res = await fetch(ENDPOINT, {
		method: 'POST',
		headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
		body: JSON.stringify({ image: { type: 'base64', base64: encodePng(img).toString('base64') } }),
	});
	const text = await res.text();
	if (!res.ok) throw new Error(`estimate-skeleton HTTP ${res.status}: ${text.slice(0, 300)}`);
	const body = JSON.parse(text) as { keypoints?: Keypoint[] };
	if (!body.keypoints?.length) throw new Error(`estimate-skeleton không trả khung xương: ${text.slice(0, 300)}`);
	return body.keypoints.map((k) => ({ label: k.label, x: k.x, y: k.y, z_index: k.z_index ?? 0 }));
}

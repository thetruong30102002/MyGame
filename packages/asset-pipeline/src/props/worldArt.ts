// Chuẩn nhà mới lấy người chơi PixelLab làm thước. Không đổi cỡ nhà cũ bằng code.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { opaqueBounds, readPng, type RGBAImage } from '../image/rgba.js';

export const WORLD_ART_PREFIX = 'worldart:';
export const WORLD_ART_RULER = Object.freeze({ characterId: 'player_hero_adult', bodyHeight: 75, pixelsPerUnit: 48 });
export interface PixelRect { x: number; y: number; w: number; h: number }
export const THISTLEWOOD_INN = Object.freeze({
	id: 'town_inn_grand_v1', sourceId: 'thistlewood/inn-grand-v1', width: 336, height: 440,
	// Cửa và điểm đặt đều tính từ ảnh đã cắt sát, không từ canvas có lề.
	door: { x: 140, y: 316, w: 56, h: 104 } as PixelRect,
	footprint: { x: -156, y: -80, w: 312, h: 80 } as PixelRect,
	placement: { x: 1704, y: 504 }, auxiliaryInn: { x: 1752, y: 936 },
});
export interface WorldArtProof {
	version: 1; image: string; sha256: string; nativePixelScale: 1;
	artReviewed: boolean; reviewEvidence: string; ruler: typeof WORLD_ART_RULER;
	door: PixelRect; footprint: PixelRect;
}

/** Cổng cho nhà mẫu mới. File thiếu thì chờ vẽ; file có nhưng sai phải chặn build. */
export function worldArtIssues(img: RGBAImage, proof: WorldArtProof): string[] {
	const errors: string[] = [];
	const b = opaqueBounds(img);
	if (!b) return ['Ảnh rỗng'];
	const w = b.x1 - b.x0, h = b.y1 - b.y0;
	if (w !== THISTLEWOOD_INN.width || h !== THISTLEWOOD_INN.height) errors.push(`Khổ native đã cắt sát phải là 336×440, hiện ${w}×${h}`);
	if (proof.version !== 1 || proof.nativePixelScale !== 1) errors.push('Chỉ nhận lưới native 1×, không nhận phóng ảnh nhà cũ');
	if (proof.ruler?.characterId !== WORLD_ART_RULER.characterId || proof.ruler?.bodyHeight !== 75 || proof.ruler?.pixelsPerUnit !== 48) errors.push('Sai thước nhân vật 75px / PPU 48');
	if (!proof.artReviewed || !proof.reviewEvidence?.trim()) errors.push('Chưa có bằng chứng duyệt mỹ thuật ở 1×/2×');
	let semi = 0;
	const palette = new Set<string>();
	for (let i = 0; i < img.data.length; i += 4) {
		const a = img.data[i + 3]!;
		if (a > 0 && a < 255) semi++;
		if (a) palette.add(`${img.data[i]},${img.data[i+1]},${img.data[i+2]}`);
	}
	if (semi) errors.push(`${semi} pixel alpha mềm; cần mép cứng`);
	if (palette.size > 96) errors.push(`Có ${palette.size} màu; giới hạn mẫu nhà là 96 màu, không dùng làm mờ để giảm nhiễu`);
	if (b.x0 < 2 || b.y0 < 2 || b.x1 > img.width - 2 || b.y1 > img.height - 2) errors.push('Cần ít nhất 2px lề trong suốt quanh sprite nguồn');
	const d = proof.door;
	if (!d || ![d.x,d.y,d.w,d.h].every(Number.isInteger) || d.w < 48 || d.w > 64 || d.h < 100 || d.h > 112 || d.x < 0 || d.y < 0 || d.x+d.w > w || d.y+d.h > h)
		errors.push('Cửa phải rộng 48–64px, cao 100–112px và nằm trong sprite');
	else if (Math.abs(d.x+d.w/2-w/2) > 8 || h-(d.y+d.h) < 8 || h-(d.y+d.h) > 28)
		errors.push('Cửa phải ở giữa mặt tiền, ngưỡng cách chân neo 8–28px');
	const f = proof.footprint;
	if (!f || ![f.x,f.y,f.w,f.h].every(Number.isInteger) || f.w !== 312 || f.h !== 80 || f.x !== -156 || f.y !== -80)
		errors.push('Footprint nhà mẫu phải là (-156,-80,312,80), neo chân giữa đáy');
	return errors;
}

export function loadWorldArt(sourceRoot: string, sourceId: string): { image: RGBAImage; proof: WorldArtProof } | null {
	if (sourceId !== THISTLEWOOD_INN.sourceId) throw new Error('Chưa có chuẩn mỹ thuật cho ' + sourceId);
	const folder = join(sourceRoot, sourceId), path = join(folder, 'asset.json');
	if (!existsSync(path)) return null;
	const proof = JSON.parse(readFileSync(path, 'utf8')) as WorldArtProof;
	if (proof.image !== 'image.png') throw new Error('Nhà mẫu chỉ đọc image.png trong thư mục nguồn');
	const bytes = readFileSync(join(folder, proof.image));
	if (createHash('sha256').update(bytes).digest('hex') !== proof.sha256) throw new Error('Hash ảnh nhà mới không khớp bản đã duyệt');
	const image = readPng(join(folder, proof.image));
	const errors = worldArtIssues(image, proof);
	if (errors.length) throw new Error(`${sourceId}: ${errors.join('; ')}`);
	return { image, proof };
}

/**
 * Ảnh đối chiếu cho trang soi: khung NPC chuẩn độ nét (npc_silver_youth…) lấy từ atlas đã xuất, đặt vào ô chuẩn theo chân; mảng nền
 * map thật (mặt đất đã nướng của Unity) để soi nhân vật trên nền game.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { crop, readPng, writePng, type RGBAImage } from '../image/rgba.js';
import { cellOffset, placeInCell } from './cut.js';
import type { LayeredStandard } from './standard.js';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');

/** Một khung trong atlas nhân vật `assets/characters/<id>/` (tên khung kiểu `<id>/idle_S_0`). */
export function atlasFrame(id: string, frame: string): RGBAImage {
	const dir = join(REPO, 'assets', 'characters', id);
	const json = JSON.parse(readFileSync(join(dir, `${id}.json`), 'utf8')) as { frames: Record<string, { frame: { x: number; y: number; w: number; h: number } }> };
	const f = json.frames[`${id}/${frame}`];
	if (!f) throw new Error(`Không có khung ${id}/${frame}`);
	return crop(readPng(join(dir, `${id}.png`)), f.frame.x, f.frame.y, f.frame.w, f.frame.h);
}

/** Khung NPC chuẩn đặt vào ô chuẩn (chân → root), cùng PPU 48 — so độ nét trực tiếp. */
export function referenceInCell(id: string, std: Pick<LayeredStandard, 'cell'>, frame = 'idle_S_0'): RGBAImage {
	const img = atlasFrame(id, frame);
	return placeInCell(img, cellOffset(img, std), std);
}

/**
 * Mảng nền map thật 128×128 (thị trấn Thistlewood) cắt từ mặt đất Unity đã nướng — ghi ra `out`. Không có (máy chưa nhập Unity) thì trả
 * null, trang soi dùng nền ô cờ.
 */
export function townGroundPatch(out: string, size = 128): string | null {
	const src = join(REPO, 'UnityGame', 'Assets', 'HavenLord', 'Imported', 'Maps', 'human', 'town', 'Ground', 'ground_1_1.png');
	if (!existsSync(src)) return null;
	const img = readPng(src);
	writePng(out, crop(img, Math.floor((img.width - size) / 2), Math.floor((img.height - size) / 2), size, size));
	return out;
}

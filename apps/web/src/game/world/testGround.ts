import { Texture } from 'pixi.js';

/**
 * Nền cỏ TẠM cho sân thử nhân vật (chưa phải map — map thật là Phase 5). Sinh bằng nhiễu có hạt
 * giống cố định nên lần nào cũng giống nhau; ô 48px khớp kích thước tile dự kiến của map.
 */
export function createTestGroundTexture(tile = 48, tilesPerSide = 4): Texture {
	const size = tile * tilesPerSide;
	const canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext('2d')!;
	const palette = ['#2f4a2c', '#34522f', '#3a5a33', '#41633a', '#2a4227'];
	let seed = 1337;
	const rand = (): number => {
		seed = (seed * 1664525 + 1013904223) >>> 0;
		return seed / 0xffffffff;
	};
	ctx.fillStyle = palette[1]!;
	ctx.fillRect(0, 0, size, size);
	for (let i = 0; i < size * size * 0.18; i += 1) {
		ctx.fillStyle = palette[Math.floor(rand() * palette.length)]!;
		ctx.fillRect(Math.floor(rand() * size), Math.floor(rand() * size), 1, 1 + Math.floor(rand() * 2));
	}
	for (let i = 0; i < 26; i += 1) {
		const x = Math.floor(rand() * size);
		const y = Math.floor(rand() * size);
		ctx.fillStyle = '#4d7443';
		ctx.fillRect(x, y, 1, 3);
		ctx.fillRect(x + 2, y + 1, 1, 2);
		ctx.fillStyle = '#5c8a4f';
		ctx.fillRect(x + 1, y - 1, 1, 3);
	}
	for (let i = 0; i < 6; i += 1) {
		const x = Math.floor(rand() * (size - 2));
		const y = Math.floor(rand() * (size - 2));
		ctx.fillStyle = rand() > 0.5 ? '#e9e3c8' : '#c9a3e8';
		ctx.fillRect(x, y, 2, 2);
		ctx.fillStyle = '#e9c46a';
		ctx.fillRect(x, y, 1, 1);
	}
	ctx.strokeStyle = 'rgba(0,0,0,0.06)';
	for (let i = 0; i <= tilesPerSide; i += 1) {
		ctx.fillStyle = 'rgba(0,0,0,0.07)';
		ctx.fillRect(i * tile, 0, 1, size);
		ctx.fillRect(0, i * tile, size, 1);
	}
	const texture = Texture.from(canvas);
	texture.source.scaleMode = 'nearest';
	return texture;
}

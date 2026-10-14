// Bản đồ chữ của một khung: mỗi điểm ảnh một ký tự theo nhóm màu (soi ranh giới mảnh).
import { getPixel, readPng } from '../image/rgba.js';
const img = readPng(process.argv[2]!);
const [x0, x1, y0, y1] = (process.argv[3] ?? '38,74,24,99').split(',').map(Number) as [number, number, number, number];
let head = '    ';
for (let x = x0; x <= x1; x++) head += x % 10 === 0 ? '|' : String(x % 10);
console.log(head);
for (let y = y0; y <= y1; y++) {
	let s = String(y).padStart(3) + ' ';
	for (let x = x0; x <= x1; x++) {
		const [r, g, b, a] = getPixel(img, x, y); const c = { r, g, b, a };
		if (c.a < 128) { s += '.'; continue; }
		const l = (c.r + c.g + c.b) / 3;
		// d tối/viền · s da · h tóc nâu sáng · w áo trắng · g khăn xanh · b nâu
		if (l < 50) s += '#';
		else if (c.r > 200 && c.g > 160 && c.b > 120 && c.r - c.b < 80) s += 's';
		else if (c.g > c.r && c.g > c.b) s += 'g';
		else if (l > 190) s += 'w';
		else if (c.r - c.b > 60 && l > 110) s += 'h';
		else s += 'b';
	}
	console.log(s);
}

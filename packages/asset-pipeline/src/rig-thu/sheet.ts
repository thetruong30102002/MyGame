// Ghép các ảnh chụp AutoTest (`rig-NN.png`) thành một tấm: cắt vùng quanh nhân vật ghép mảnh, phóng ×3.
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { createImage, crop, getPixel, readPng, scaleNearest, setPixel, writePng } from '../image/rgba.js';
const [dir, out, x, y, w, h] = [process.argv[2]!, process.argv[3]!, ...process.argv.slice(4).map(Number)] as [string, string, number, number, number, number];
const files = readdirSync(dir).filter((f) => /^rig-\d+\.png$/.test(f)).sort();
const cols = 9;
const sheet = createImage(cols * w, Math.ceil(files.length / cols) * h);
files.forEach((f, i) => {
	const c = crop(readPng(join(dir, f)), x, y, w, h);
	for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) setPixel(sheet, (i % cols) * w + xx, Math.floor(i / cols) * h + yy, getPixel(c, xx, yy));
});
writePng(out, scaleNearest(sheet, 3));
console.log(files.length, 'ảnh');

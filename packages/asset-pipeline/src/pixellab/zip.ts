import { inflateRawSync } from 'node:zlib';

/**
 * Giải nén ZIP tối giản (chỉ đọc, phương thức "stored" và "deflate") — đủ cho gói nhân vật PixelLab,
 * khỏi kéo thêm thư viện. Đọc từ thư mục trung tâm (central directory) nên không phụ thuộc data descriptor.
 */
export function unzip(buf: Buffer): Map<string, Buffer> {
	const out = new Map<string, Buffer>();
	// Bản ghi "end of central directory" nằm trong 64 KiB cuối file (tính cả phần chú thích).
	let eocd = -1;
	for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i -= 1) {
		if (buf.readUInt32LE(i) === 0x06054b50) {
			eocd = i;
			break;
		}
	}
	if (eocd < 0) throw new Error('Không phải file ZIP (thiếu end of central directory)');
	const count = buf.readUInt16LE(eocd + 10);
	let p = buf.readUInt32LE(eocd + 16);
	for (let n = 0; n < count; n += 1) {
		if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('ZIP hỏng: sai chữ ký central directory');
		const method = buf.readUInt16LE(p + 10);
		const compSize = buf.readUInt32LE(p + 20);
		const nameLen = buf.readUInt16LE(p + 28);
		const extraLen = buf.readUInt16LE(p + 30);
		const commentLen = buf.readUInt16LE(p + 32);
		const local = buf.readUInt32LE(p + 42);
		const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
		p += 46 + nameLen + extraLen + commentLen;
		if (name.endsWith('/')) continue;
		// Dữ liệu nằm sau local header (độ dài tên/extra ở local header có thể khác central directory).
		const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
		const raw = buf.subarray(start, start + compSize);
		if (method === 0) out.set(name, Buffer.from(raw));
		else if (method === 8) out.set(name, inflateRawSync(raw));
		else throw new Error(`ZIP: phương thức nén ${method} chưa hỗ trợ (${name})`);
	}
	return out;
}

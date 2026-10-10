// Quản trị: cấp / thu quyền vào trang /admin (cộng xu, kim cương, bình, EXP / cấp, điểm tiềm năng cho nhân vật) — theo TÀI KHOẢN.
//   npx tsx src/admin.ts add <tên tài khoản>      → cấp quyền
//   npx tsx src/admin.ts remove <tên tài khoản>   → thu quyền
//   npx tsx src/admin.ts list                     → các tài khoản đang có quyền
// Mặc định KHÔNG ai có quyền. CSDL theo AETHER_DB (mặc định data/aether.db — máy chủ THẬT; thử thì AETHER_DB=data/test.db). Chạy được
// khi máy chủ đang bật (SQLite WAL); máy chủ đọc bảng `admins` ở mỗi lần gọi API nên cấp / thu có hiệu lực ngay, không cần khởi động lại.
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Store } from './db.ts';

const [cmd, rawName] = process.argv.slice(2);
if (cmd !== 'list' && !((cmd === 'add' || cmd === 'remove') && rawName)) {
	console.error('Cách dùng: npx tsx src/admin.ts add|remove <tên tài khoản>   ·   npx tsx src/admin.ts list');
	process.exit(1);
}
const store = new Store(process.env.AETHER_DB ?? join(dirname(fileURLToPath(import.meta.url)), '..', 'data/aether.db'));
try {
	if (cmd === 'list') {
		const list = store.admins();
		if (!list.length) console.log('Chưa có tài khoản quản trị nào.');
		for (const a of list) console.log(`${a.username}  (cấp quyền ${new Date(a.grantedAt).toISOString()})`);
	} else {
		// Tên đăng nhập luôn là chữ thường (luật đăng ký) — gõ hoa vẫn nhận.
		const username = rawName!.trim().toLowerCase();
		const on = cmd === 'add';
		const changed = store.setAdmin(username, on);
		if (changed === null) {
			console.error(`Không có tài khoản "${username}"`);
			process.exitCode = 1;
		} else if (!changed) console.log(on ? `${username} đã là quản trị từ trước.` : `${username} vốn không phải quản trị.`);
		else console.log(on ? `Đã cấp quyền quản trị cho ${username} — mở /admin, đăng nhập bằng tài khoản này.` : `Đã thu quyền quản trị của ${username}.`);
	}
} catch (e) {
	console.error(e instanceof Error ? e.message : e);
	process.exitCode = 1;
} finally {
	store.close();
}

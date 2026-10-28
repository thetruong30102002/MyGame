import { validateUsername } from '@havenlord/protocol';
import { hashPassword } from './auth.js';
import { Store } from './db.js';
import { dbPath } from './dbPath.js';

/**
 * Tạo tài khoản thẳng trong CSDL (có rồi thì đặt lại mật khẩu), BỎ QUA luật độ dài mật khẩu của form đăng
 * ký — để chủ dự án có tài khoản thử dễ nhớ. Đăng nhập không kiểm độ dài nên vẫn vào được bình thường.
 * Chạy được khi máy chủ đang chạy (SQLite WAL cho nhiều tiến trình cùng mở).
 *
 *   npx tsx src/seed.ts <tên-đăng-nhập> <mật-khẩu>            # CSDL thật data/havenlord.db
 *   HAVENLORD_DB=./data/test.db npx tsx src/seed.ts <...> <...>  # CSDL thử
 */
const [username = '', password = ''] = process.argv.slice(2).map((s) => s.trim());
const err = validateUsername(username.toLowerCase()) ?? (password ? null : 'Thiếu mật khẩu');
if (err) {
	console.error(`✘ ${err}\nCách dùng: npx tsx src/seed.ts <tên-đăng-nhập> <mật-khẩu>`);
	process.exit(1);
}
const file = dbPath();
const store = new Store(file);
const u = username.toLowerCase();
const hash = await hashPassword(password);
if (store.createAccount(u, hash) !== null) console.log(`✔ đã tạo tài khoản "${u}" trong ${file}`);
else if (store.setPassword(u, hash)) console.log(`✔ "${u}" đã có — đặt lại mật khẩu, đăng xuất các phiên cũ (${file})`);
else throw new Error(`Không tạo được tài khoản "${u}"`);

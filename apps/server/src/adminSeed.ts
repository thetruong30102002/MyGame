// Tài khoản quản trị tổng tạo sẵn (chủ dự án 28/10/2026): lúc máy chủ khởi động, CSDL chưa có tài khoản đó thì tạo rồi cấp quyền quản trị.
// Mật khẩu KHÔNG để trong repo (repo GitHub công khai): đặt HAVENLORD_ADMIN_PASS, hoặc ghi vào apps/server/.env.local (đã gitignore, máy chủ tự
// nạp). Tên mặc định `admin`, đổi bằng HAVENLORD_ADMIN_USER. Tài khoản có sẵn thì chỉ đảm bảo còn quyền, không ghi đè mật khẩu đã đổi.
import { validatePassword, validateUsername } from '@havenlord/protocol';
import { hashPassword } from './auth.ts';
import type { Store } from './db.ts';

export async function seedAdmin(store: Store): Promise<string | null> {
	const user = (process.env.HAVENLORD_ADMIN_USER || 'admin').trim().toLowerCase();
	const pass = process.env.HAVENLORD_ADMIN_PASS ?? '';
	if (!pass) return null;
	const err = validateUsername(user) ?? validatePassword(pass);
	if (err) {
		console.warn('Bỏ qua tạo tài khoản quản trị tổng: ' + err);
		return null;
	}
	if (!store.account(user) && store.createAccount(user, await hashPassword(pass)) === null) return null;
	store.setAdmin(user, true);
	return user;
}

import type { Metadata } from 'next';
import { AdminPanel } from '@/components/admin/AdminPanel';

// Trang quản trị: không có lối vào từ menu game (chỉ vào bằng đường dẫn), không cho máy tìm kiếm ghi nhận.
export const metadata: Metadata = {
	title: 'Quản trị — Aether Chronicle',
	robots: { index: false, follow: false },
};

/** /admin — cộng tiền, điểm cho nhân vật (chủ dự án 10/10/2026). Quyền do máy chủ kiểm (bảng `admins`, lệnh `apps/server/src/admin.ts`). */
export default function AdminPage() {
	return (
		<main className="relative h-dvh w-dvw overflow-hidden">
			<AdminPanel />
		</main>
	);
}

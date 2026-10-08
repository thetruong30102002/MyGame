import type { NextConfig } from 'next';
import { networkInterfaces } from 'node:os';

/**
 * Next 16 ở chế độ dev CHẶN tài nguyên `/_next/*` khi trang mở bằng host khác localhost — điện thoại
 * mở qua IP mạng LAN sẽ chỉ thấy màn chờ (đã gặp 02/10/2026). Cho phép mọi IP của chính máy này.
 */
const lanHosts = Object.values(networkInterfaces())
	.flat()
	.filter((n) => n && n.family === 'IPv4' && !n.internal)
	.map((n) => n!.address);

// Git Bash đổi giá trị "/game" thành "C:/Program Files/Git/game" khi chạy lệnh Windows: build vẫn "thành
// công" nhưng mọi lời gọi máy chủ game hỏng. Chặn ngay lúc build — dùng `npm run build:funnel`.
const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? '';
if (/^[A-Za-z]:[\\/]/.test(serverUrl)) {
	throw new Error(`NEXT_PUBLIC_SERVER_URL bị shell đổi thành đường dẫn Windows: "${serverUrl}". Build bằng \`npm run build:funnel\`.`);
}

// Bản triển khai build/chạy ở thư mục RIÊNG (`build:funnel`/`start:funnel` đặt biến này): `next build` để kiểm tra ghi đè
// `.next` và làm `next start` đang phục vụ Funnel tự thoát giữa chừng (đã dẫm 07/10/2026 — trang 8443 sập khi build thử).
const distDir = process.env.AETHER_DIST_DIR || '.next';

const config: NextConfig = {
	reactStrictMode: true,
	distDir,
	// Gói giao thức dùng chung với máy chủ để ở dạng TS gốc (không build riêng) → Next tự biên dịch.
	transpilePackages: ['@aether/protocol', '@aether/sim'],
	allowedDevOrigins: [...lanHosts, '*.local', '*.ts.net'],
	// Nút tròn chữ N góc dưới trái đè lên khay kỹ năng/chat khi chơi thử trên dev.
	devIndicators: false,
};

export default config;

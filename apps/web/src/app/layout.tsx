import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
	title: 'Aether Chronicle',
	description: 'Anime pixel-art fantasy online RPG — vertical slice',
};

export const viewport: Viewport = {
	width: 'device-width',
	initialScale: 1,
	// Chạm hai lần / chụm ngón là zoom cả trang → phá điều khiển cảm ứng; game tự có zoom riêng.
	maximumScale: 1,
	userScalable: false,
	viewportFit: 'cover',
	themeColor: '#0f121a',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="vi">
			<head>
				{/* eslint-disable-next-line @next/next/no-page-custom-font */}
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link href="https://fonts.googleapis.com/css2?family=Alegreya:wght@700;800&family=Nunito:ital,wght@0,600;0,700;0,800;1,700&subset=vietnamese&display=swap" rel="stylesheet" />
			</head>
			<body>{children}</body>
		</html>
	);
}

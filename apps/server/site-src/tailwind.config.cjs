// CSS trang chủ + trang quản trị (site/*.html): Tailwind + daisyUI, build ra site/app.css (chỉ gồm class đang dùng).
// Sửa giao diện xong chạy: npm run build:site -w @aether/server
const path = require('node:path');

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [path.join(__dirname, '../site/*.html')],
	theme: {
		extend: {
			fontFamily: { sans: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'] },
			colors: { fire: '#ff6b3d', water: '#3aa0ff', wind: '#4fd18b', ice: '#8fe3ff', earth: '#c99a5b', gold: '#ffc93c' },
		},
	},
	plugins: [require('daisyui')],
	daisyui: {
		logs: false,
		themes: [
			{
				// Đêm Aether: vàng kim trên nền xanh đêm, hợp ảnh pixel + bản đồ lục địa.
				aether: {
					primary: '#ffc93c',
					'primary-content': '#2a1606',
					secondary: '#2f9bd6',
					accent: '#b48cff',
					neutral: '#1b2c42',
					'neutral-content': '#dfe8f3',
					'base-100': '#122236',
					'base-200': '#0d1a2a',
					'base-300': '#08121e',
					'base-content': '#e4ecf5',
					info: '#3aa0ff',
					success: '#40c057',
					warning: '#ffb21e',
					error: '#ff5a3c',
					'--rounded-box': '1rem',
					'--rounded-btn': '0.7rem',
					'--rounded-badge': '0.6rem',
					'--tab-radius': '0.6rem',
				},
			},
		],
	},
};

// CSS trang web (site/*.html + site/common.js): Tailwind + daisyUI, build ra site/app.css (chỉ gồm class đang dùng).
// Sửa giao diện xong chạy: npm run build:site -w @aether/server
const path = require('node:path');

/**
 * Đọc class: tách theo khoảng trắng / dấu nháy như thường, rồi tách thêm theo dấu chấm không đứng trước chữ số — để class viết kiểu
 * h('span.inline-flex.gap-1.5', …) trong JS cũng được nhận ('gap-1.5' giữ nguyên).
 */
const extract = (content) => {
	const out = new Set();
	for (const tok of content.match(/[^\s"'`<>]+/g) || []) {
		out.add(tok);
		for (const part of tok.split(/\.(?!\d)/)) if (part) out.add(part);
	}
	return [...out];
};

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: {
		files: [path.join(__dirname, '../site/*.html'), path.join(__dirname, '../site/*.js')],
		extract: { html: extract, js: extract },
	},
	theme: {
		extend: {
			fontFamily: { sans: ['"Be Vietnam Pro"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'] },
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

// CSS trang web (site/*.html + site/common.js): Tailwind + daisyUI, build ra site/app.css (chỉ gồm class đang dùng).
// Sửa giao diện xong chạy: npm run build:site -w @havenlord/server
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
		// HAVENLORD_SITE_DIR: build cho thư mục site khác (xem thử) — site-src/build.mjs đặt.
		files: [...['*.html', '*.js'].map((f) => path.join(process.env.HAVENLORD_SITE_DIR || path.join(__dirname, '../site'), f)),path.join(__dirname,'**/*.{tsx,html}')],
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
				// Đêm Haven: vàng kim trên nền xanh đêm, hợp ảnh pixel + bản đồ lục địa.
				havenlord: {
					primary: '#e7c581',
					'primary-content': '#2a1606',
					secondary: '#2f9bd6',
					accent: '#b48cff',
					neutral: '#263832',
					'neutral-content': '#dfe8f3',
					'base-100': '#172721',
					'base-200': '#0f1b17',
					'base-300': '#0a1310',
					'base-content': '#ede9de',
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

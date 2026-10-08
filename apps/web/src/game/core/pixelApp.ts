import { Application, CullerPlugin, extensions, TextureStyle } from 'pixi.js';

// Bỏ qua vẽ sprite nằm ngoài màn hình (đồ vật/decal đặt `cullable`) — map lớn vẫn nhẹ.
extensions.add(CullerPlugin);

/**
 * Ứng dụng Pixi cho pixel art: KHÔNG nội suy texture, KHÔNG khử răng cưa, và vẽ theo PIXEL THIẾT BỊ.
 *
 * Vì sao `resolution: 1` + tự đặt kích thước canvas theo devicePixelRatio thay vì `autoDensity`:
 * màn Windows hay để DPR lẻ (1.25, 1.5). Để Pixi nhân DPR vào thì một texel = 1,25 px thiết bị →
 * cột pixel to nhỏ không đều. Ở đây zoom là số NGUYÊN tính trên pixel thiết bị nên mọi texel
 * luôn phủ đúng zoom×zoom pixel thật.
 */
export async function createPixelApp(host: HTMLElement): Promise<Application> {
	TextureStyle.defaultOptions.scaleMode = 'nearest';
	const app = new Application();
	await app.init({
		width: deviceSize(host).width,
		height: deviceSize(host).height,
		resolution: 1,
		autoDensity: false,
		antialias: false,
		roundPixels: true,
		background: '#121722',
		preference: 'webgl',
		powerPreference: 'high-performance',
	});
	app.canvas.classList.add('pixel-canvas');
	fitCanvas(app, host);
	host.appendChild(app.canvas);
	return app;
}

export function deviceSize(host: HTMLElement): { width: number; height: number; dpr: number } {
	const dpr = window.devicePixelRatio || 1;
	return {
		width: Math.max(1, Math.floor(host.clientWidth * dpr)),
		height: Math.max(1, Math.floor(host.clientHeight * dpr)),
		dpr,
	};
}

export function fitCanvas(app: Application, host: HTMLElement): void {
	const { width, height, dpr } = deviceSize(host);
	app.renderer.resize(width, height);
	app.canvas.style.width = `${width / dpr}px`;
	app.canvas.style.height = `${height / dpr}px`;
}

/**
 * Zoom mặc định theo CẠNH NGẮN của màn (pixel thiết bị), luôn là số nguyên: desktop 1080p → 2×,
 * điện thoại 1170×2532 → 2× ở cả dọc lẫn ngang. Tính theo chiều cao thì điện thoại dọc ra 5× và
 * chỉ còn thấy chưa tới 5 ô bề ngang.
 */
export function defaultZoom(deviceWidth: number, deviceHeight: number): number {
	return Math.max(1, Math.min(6, Math.round(Math.min(deviceWidth, deviceHeight) / 540)));
}

'use client';

import { Backdrop, TitleBanner } from './AuthScreen';

/**
 * Màn chờ lúc mở game (kiểm phiên đăng nhập) và lúc nạp thế giới (Hud): cùng nền + dải tên với màn đăng nhập / chọn
 * nhân vật để đổi màn không bị giật. Ngôi sao PixelLab 1× nảy theo bậc; `error`: sao đứng yên — lỗi thì không còn gì
 * đang chạy để chờ.
 */
export function BootScreen({ text = 'Đang mở cổng vào Aetheria…', error = false }: { text?: string; error?: boolean }) {
	return (
		<Backdrop>
			<div className="flex flex-col items-center">
				<TitleBanner />
				<div role="status" aria-live="polite" className="ui-frame flex min-w-[240px] flex-col items-center gap-2 px-6 pt-7 pb-4">
					<img src="/assets/ui/icon_star.png" width={45} height={42} alt="" draggable={false} className={`pixel-img ${error ? '' : 'animate-bob'}`} />
					<p className={`max-w-[min(420px,calc(100vw-80px))] text-center font-display text-head font-extrabold ${error ? 'text-berry' : 'text-ink-brown'}`}>{text}</p>
					{/* Lỗi thường gặp nhất là tab mở từ trước lần cập nhật game: tải lại trang là về bản mới. */}
					{error && (
						<button type="button" onClick={() => location.reload()} className="ui-btn mt-1 px-5 text-[16px]">
							Tải lại trang
						</button>
					)}
				</div>
			</div>
		</Backdrop>
	);
}

'use client';

import { useEffect, useState } from 'react';

/** Theo dõi một media query (vd `(max-height: 500px)` = điện thoại xoay ngang). Lúc render phía máy chủ trả false. */
export function useMediaQuery(query: string): boolean {
	const [match, setMatch] = useState(false);
	useEffect(() => {
		const mq = window.matchMedia(query);
		const update = (): void => setMatch(mq.matches);
		update();
		mq.addEventListener('change', update);
		return () => mq.removeEventListener('change', update);
	}, [query]);
	return match;
}

/** Kích thước cửa sổ (css px), cập nhật khi xoay/đổi cỡ. */
export function useViewport(): { w: number; h: number } {
	const [size, setSize] = useState({ w: 0, h: 0 });
	useEffect(() => {
		const update = (): void => setSize({ w: window.innerWidth, h: window.innerHeight });
		update();
		window.addEventListener('resize', update);
		return () => window.removeEventListener('resize', update);
	}, []);
	return size;
}

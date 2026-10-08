'use client';

import { useEffect, useState } from 'react';

/** Date.now() làm mới mỗi `ms` (đồng hồ đếm lùi của bình) — chỉ chạy khi `active`. */
export function useNow(ms: number, active = true): number {
	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		if (!active) return undefined;
		setNow(Date.now());
		const t = setInterval(() => setNow(Date.now()), ms);
		return () => clearInterval(t);
	}, [ms, active]);
	return now;
}

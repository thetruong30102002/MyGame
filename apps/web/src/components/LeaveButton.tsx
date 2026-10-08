'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/store/useSession';

/** Bấm lần đầu chỉ "lên cò", trong chừng này (ms) bấm lần nữa mới thoát. */
const ARM_MS = 3000;

/**
 * Nút lưu và về màn chọn nhân vật — phải bấm HAI lần: thoát là đóng kết nối, rời thế giới, vào lại phải nạp lại map,
 * mà nút này hay nằm cạnh nút bấm nhiều (nút Đóng của bản đồ, ô kỹ năng) nên chạm trượt một lần không được tính.
 * Nhãn "Đổi nhân vật" chứ không "Nhân vật": trùng tên bảng Nhân vật (phím C) thì người tìm chỉ số bấm nhầm sang nút thoát.
 */
export function LeaveButton({ className = '' }: { className?: string }) {
	const leaveGame = useSession((s) => s.leaveGame);
	const [armed, setArmed] = useState(false);

	useEffect(() => {
		if (!armed) return undefined;
		const t = setTimeout(() => setArmed(false), ARM_MS);
		return () => clearTimeout(t);
	}, [armed]);

	return (
		<button
			type="button"
			onClick={() => (armed ? void leaveGame() : setArmed(true))}
			// Hành động phụ nên là chip giấy; lên cò thì đổi sang chip cảnh báo đỏ (`.ui-chip-danger` giữ màu cả khi hover dính
			// lại sau cú chạm trên cảm ứng).
			className={`ui-chip min-h-8 text-note ${armed ? 'ui-chip-danger' : ''} ${className}`}
			title="Lưu lại rồi về màn chọn nhân vật (bấm 2 lần)"
		>
			{armed ? 'Bấm lần nữa để rời' : 'Đổi nhân vật'}
		</button>
	);
}

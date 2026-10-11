/**
 * Bảng phím theo mức HUD. KEY_HINT: danh sách đầy đủ (bảng Nhân vật → mục "Phím tắt"); KEY_TIP: một câu mẹo ngắn
 * hiện ở thẻ mẹo 45 giây đầu phiên trên máy tính (thay cho 2 dòng phím thường trực dưới thanh kỹ năng).
 */
export const KEY_HINT: Record<'minimal' | 'magic' | 'full', string[]> = {
	minimal: ['WASD đi · Shift chạy · E nói chuyện / nhặt đồ · M bản đồ', 'C nhân vật · P tiềm năng · I kho đồ'],
	magic: ['WASD đi · J chém kiếm · K Tia Aether · nhấp quái để chọn (mũi tên đỏ), chiêu tự nhắm vào nó · Tab đổi mục tiêu', '1–2 phép (học bằng điểm ở P) · E nói chuyện · M bản đồ · C nhân vật · P tiềm năng · I kho đồ'],
	full: ['WASD di chuyển · Shift chạy · J chém · K Tia Aether · nhấp quái / Tab chọn mục tiêu, Esc bỏ chọn', '1–8 kỹ năng (gán ở Tiềm năng) · Space né · R uống thuốc · M bản đồ · C nhân vật · P tiềm năng · I kho đồ'],
};

export const KEY_TIP: Record<'minimal' | 'magic' | 'full', string> = {
	minimal: 'Mẹo: E nói chuyện · M xem bản đồ · C mở hành trang',
	magic: 'Mẹo: J chém · K Tia Aether · C mở hành trang',
	full: 'Mẹo: nhấp quái hoặc Tab để chọn mục tiêu — J, K, 1–8 tự nhắm vào nó · Space né · R uống thuốc',
};

import { CHRONICLER } from '@aether/sim/rewards';
import type { NpcDef } from './storyTypes';

/**
 * NPC DỊCH VỤ (không thuộc cốt truyện): đứng cố định, bấm E mở bảng riêng thay cho thoại (docs/pixellab-ke-hoach-ve.md mục
 * NPC dịch vụ). Dùng chung cơ chế NPC của cốt truyện để có hình, nhãn tên, chấm trên bản đồ, trang Thư viện.
 */
export const SERVICE_NPCS: Record<string, NpcDef> = {
	/**
	 * Bia Danh Vọng (K1 — docs/ke-hoach-kim-cuong.md): nhận quà thành tựu. Chỗ đứng lấy từ `CHRONICLER` dùng chung với máy chủ —
	 * máy chủ chỉ trao quà khi người chơi đứng gần đúng chỗ này. Hình TẠM là đồ vật `rune_stone` có sẵn (như bia đá cổ ở Nghĩa
	 * địa); có bia do PixelLab vẽ thì đổi `prop`. Có ở mọi tuổi (thám hiểm / bạn bè đếm từ nhỏ).
	 */
	[CHRONICLER.npc]: {
		name: 'Bia Danh Vọng',
		title: 'Quảng trường Thistlewood',
		sprite: null,
		prop: 'rune_stone',
		at: { spot: CHRONICLER.spot, dx: CHRONICLER.dx, dy: CHRONICLER.dy },
		ages: [0, 99],
		idle: ['«Tên những người làm nên chuyện được khắc ở đây.»', '«Chỉ người chơi trực tuyến mới được ghi danh.»'],
	},
};

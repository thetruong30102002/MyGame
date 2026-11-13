import { REGIONS } from '../regions.ts';
import { CHRONICLER } from '../rewards.ts';
import type { NpcDef } from './storyTypes.ts';
import { VILLAGE_NPCS } from '../village.ts';

/**
 * NPC DỊCH VỤ (không thuộc cốt truyện): đứng cố định, bấm E mở bảng riêng thay cho thoại (docs/pixellab-ke-hoach-ve.md mục
 * NPC dịch vụ). Dùng chung cơ chế NPC của cốt truyện để có hình, nhãn tên, chấm trên bản đồ, trang Thư viện.
 */
/** Khoá NPC cột dịch chuyển của vùng `region`. */
export const waystoneKey = (region: string): string => `waystone_${region}`;
export const isWaystone = (key: string): boolean => key.startsWith('waystone_');

/**
 * Cột dịch chuyển ở trạm của MỌI vùng đã mở (khung nhiều vùng — docs/ke-hoach-the-gioi.md mục 3): bấm E mở bảng các trạm đã tới.
 * Chỗ đứng lấy từ `REGIONS[].waystone` dùng chung. Hình THỐNG NHẤT mọi vùng = đồ vật `rune_stone` (chủ dự án chọn 11/10/2026: "cần thống
 * nhất 1 đá dịch chuyển") — có trong bộ đồ vật của cả 7 vùng; bộ dựng map không đặt đá trang trí trùng chỗ nữa.
 */
const WAYSTONES: Record<string, NpcDef> = Object.fromEntries(
	REGIONS.filter((r) => r.ready).map((r) => [
		waystoneKey(r.id),
		{
			name: 'Cột dịch chuyển',
			title: r.name,
			sprite: null,
			prop: 'rune_stone',
			at: { spot: r.waystone.spot, dx: r.waystone.dx, dy: r.waystone.dy },
			region: r.id,
			idle: ['«Những trạm bạn từng đặt chân tới đều nối với nhau qua cột đá này.»'],
		} satisfies NpcDef,
	]),
);

export const SERVICE_NPCS: Record<string, NpcDef> = {
	...VILLAGE_NPCS,
	...WAYSTONES,
	barber_mira: {
		name: 'Mira', title: 'Thợ làm tóc', sprite: 'npc_silver_youth_f',
		at: { spot: 'plaza', dx: 76, dy: 96 }, region: 'human',
		idle: ['Ngồi xuống nào. Cậu muốn đổi kiểu tóc chứ?'],
	},
	/**
	 * Bia Danh Vọng (K1 — docs/ke-hoach-kim-cuong.md): nhận quà thành tựu. Chỗ đứng lấy từ `CHRONICLER` dùng chung với máy chủ —
	 * máy chủ chỉ trao quà khi người chơi đứng gần đúng chỗ này. Hình TẠM là đồ vật `rune_tablet` (phiến đá khắc chữ) — KHÔNG
	 * dùng `rune_stone` nữa vì đó là cột dịch chuyển (11/10/2026); có bia do PixelLab vẽ thì đổi `prop`.
	 */
	[CHRONICLER.npc]: {
		name: 'Bia Danh Vọng',
		title: 'Quảng trường Thistlewood',
		sprite: null,
		prop: 'rune_tablet',
		at: { spot: CHRONICLER.spot, dx: CHRONICLER.dx, dy: CHRONICLER.dy },
		// Chỉ ở Thistlewood: trạm các vùng khác cũng có địa điểm `plaza` nên thiếu dòng này là bia hiện ở mọi trạm (đã gặp 11/10/2026).
		region: CHRONICLER.map.split('/')[0],
		idle: ['«Tên những người làm nên chuyện được khắc ở đây.»', '«Chỉ người chơi trực tuyến mới được ghi danh.»'],
	},
	/**
	 * Cặp anh em lữ hành tóc bạc (chủ dự án 09/10/2026): hình nhân vật người chơi CŨ, nay người chơi có hình mới nên hai bộ tóc
	 * bạc thành NPC trò chuyện ở quảng trường, đi khắp lục địa.
	 */
	traveler_sein: {
		name: 'Sein',
		title: 'Lữ khách tóc bạc',
		sprite: 'npc_silver_youth',
		at: { spot: 'plaza', dx: -36, dy: 96 },
		idle: ['Lại gặp nhau rồi! Bọn ta vừa từ cao nguyên Gió Hú về — gió trên đó thổi bay cả mũ.', 'Đi đâu cũng nhớ ghé cột dịch chuyển, đỡ mỏi chân lắm.'],
	},
	traveler_sera: {
		name: 'Sera',
		title: 'Nữ lữ khách tóc bạc',
		sprite: 'npc_silver_youth_f',
		at: { spot: 'plaza', dx: 8, dy: 96 },
		idle: ['Anh Sein cứ đòi đi săn rồng phương Đông. Ta thì chỉ muốn vẽ lại bản đồ lục địa.', 'Đầm lầy Mù Sương có ếch độc to bằng cái thúng, cẩn thận đấy.'],
	},
};

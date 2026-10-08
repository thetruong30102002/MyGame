/**
 * Luật nhấp đúp ô búp bê (máy có chuột) — HÀM THUẦN, không React, test bằng `npx tsx tests/equipment.test.ts`.
 *
 * Một cú nhấp đúp sinh `click` (detail 1) → `click` (detail 2) → `dblclick`. Cú đầu vào ô ĐANG SÁNG là MẶC món đang cầm,
 * và Game xử lý đồng bộ nên tới `dblclick` ô đã chứa chính món vừa mặc — tháo theo nội dung ô lúc đó là mặc xong tháo
 * ngay (đã dẫm: nhấp đúp ô Vũ khí chính đang sáng → ô trống, cả hai kiếm về túi). Vì vậy nhấp đúp chỉ tháo món ĐÃ nằm ở
 * ô từ trước cú nhấp đầu, và cú nhấp đầu không phải cú mặc.
 */
import type { EquipSlotId } from '../../game/equipment';

export interface FirstClick {
	slot: EquipSlotId;
	/** uid món trong ô lúc cú nhấp đầu (null = ô trống). */
	uid: string | null;
	/** Ô đang sáng (cú nhấp đầu = mặc món đang cầm vào đây). */
	target: boolean;
}

/** true = `dblclick` trên ô `slot` (đang chứa `uid`) được tháo món đó. */
export function dollDoubleUnequips(first: FirstClick | null, slot: EquipSlotId, uid: string | null): boolean {
	if (!first || !uid) return false;
	return first.slot === slot && !first.target && first.uid === uid;
}

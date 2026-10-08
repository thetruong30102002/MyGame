'use client';

import { useState } from 'react';
import type { BuffKind } from '@aether/protocol';
import { BUFF_GROUP, buffLabel, buffPower, fmtRemaining, SHOP, type ShopItem } from '@aether/sim/shop';
import { activeBuffs } from '@/game/rewards';
import { useSession } from '@/store/useSession';
import { SectionTitle } from './CharacterPanelParts';
import { useNow } from './useNow';

/**
 * Thẻ Cửa hàng (phím H) — Cửa hàng kim cương K1 (docs/ke-hoach-kim-cuong.md). Giá / số dư / bình đang có đều theo máy chủ; bảng
 * chỉ gửi ý định mua. Mua hỏi lại một lần (bấm hai lần) vì tiêu kim cương. Bình yếu hơn bình đang chạy thì khoá nút — máy chủ
 * cũng từ chối, khỏi phí.
 */
export function CharacterShopTab() {
	const online = useSession((s) => s.online);
	const connected = useSession((s) => s.connected);
	const diamonds = useSession((s) => s.diamonds);
	const buffs = useSession((s) => s.buffs);
	const now = useNow(1000);
	const [confirm, setConfirm] = useState<string | null>(null);

	if (!online || diamonds === null) return <p className="text-body text-ink-soft">Cửa hàng kim cương chỉ có khi chơi trực tuyến.</p>;
	const active = activeBuffs(buffs, now);
	const groups = [...new Set(SHOP.map((x) => BUFF_GROUP[x.buff.kind]))];

	return (
		<div className="flex flex-col gap-5 text-body text-ink-brown">
			<div className="ui-tray flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2">
				<span className="font-display text-head font-extrabold tabular-nums">{diamonds} kim cương</span>
				<p className="w-full text-note text-ink-soft sm:w-auto sm:flex-1">
					Nhận từ điểm danh mỗi ngày và Bia Danh Vọng ở quảng trường Thistlewood. Không trao đổi giữa người chơi. Thời gian bình chỉ
					trôi khi đang chơi.
				</p>
			</div>

			{active.length > 0 && (
				<section className="flex flex-col gap-1.5">
					<SectionTitle>Đang dùng</SectionTitle>
					{active.map((b) => (
						<div key={b.kind} className="ui-tray flex items-center gap-2 px-2.5 py-1.5">
							<span className="font-extrabold">{buffLabel(b.kind, b.mult)}</span>
							<span className="ml-auto tabular-nums text-ink-soft">còn {fmtRemaining(b.remaining)}</span>
						</div>
					))}
				</section>
			)}

			{groups.map((group) => (
				<section key={group} className="flex flex-col gap-1.5">
					<SectionTitle>{group}</SectionTitle>
					{SHOP.filter((x) => BUFF_GROUP[x.buff.kind] === group).map((item) => (
						<ItemRow
							key={item.id}
							item={item}
							state={buyState(item, diamonds, active.find((b) => b.kind === item.buff.kind))}
							confirming={confirm === item.id}
							disabled={!connected}
							onClick={() => {
								if (confirm !== item.id) return setConfirm(item.id);
								online.shopBuy(item.id);
								setConfirm(null);
							}}
						/>
					))}
				</section>
			))}
			<p className="text-note text-ink-soft">
				Mỗi loại một bình: mua thêm bình cùng mức là cộng giờ (tối đa 5 giờ), bình mạnh hơn thì thay bình đang dùng. Bình chỉ có tác dụng
				khi đánh quái.
			</p>
		</div>
	);
}

type BuyState = 'ok' | 'poor' | 'weaker';

function buyState(item: ShopItem, diamonds: number, cur: { kind: BuffKind; mult: number } | undefined): BuyState {
	if (cur && buffPower(cur.mult) > buffPower(item.buff.mult)) return 'weaker';
	return diamonds < item.price ? 'poor' : 'ok';
}

function ItemRow({ item, state, confirming, disabled, onClick }: { item: ShopItem; state: BuyState; confirming: boolean; disabled: boolean; onClick: () => void }) {
	return (
		<div className="ui-tray flex flex-wrap items-center gap-x-3 gap-y-1 px-2.5 py-2">
			<div className="min-w-[180px] flex-1">
				<p className="font-extrabold">{item.name}</p>
				<p className="text-note text-ink-soft">{item.desc}</p>
			</div>
			<span className="text-label font-extrabold tabular-nums text-[#1f5f8a]">{item.price} KC</span>
			<button type="button" className="ui-chip min-w-[96px]" disabled={disabled || state !== 'ok'} onClick={onClick} title={state === 'weaker' ? 'Đang dùng bình mạnh hơn cùng loại' : undefined}>
				{state === 'poor' ? 'Thiếu KC' : state === 'weaker' ? 'Đang có bình mạnh hơn' : confirming ? 'Chắc mua?' : 'Mua'}
			</button>
		</div>
	);
}

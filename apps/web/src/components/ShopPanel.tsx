'use client';

import { useState, type CSSProperties } from 'react';
import type { BuffKind } from '@aether/protocol';
import { BUFF_GROUP, buffLabel, buffPower, fmtRemaining, SHOP, type ShopItem } from '@aether/sim/shop';
import { activeBuffs } from '@/game/rewards';
import { useGameStore } from '@/store/useGameStore';
import { useSession } from '@/store/useSession';
import { DiamondCount, ServiceWindow } from './ServiceWindow';
import { useNow } from './useNow';

/**
 * HÌNH TẠM của từng loại bình trên kệ: icon bình hồi phục PixelLab có sẵn (`icon_potion.png`, cam) đổi sắc theo loại — tím = kinh
 * nghiệm, đỏ = Cuồng Lực, xanh = Hộ Thân (luật hình tạm: chỉ biến tấu hình có sẵn). Có icon PixelLab riêng từng bình thì thay ở
 * đây (docs/pixellab-ke-hoach-ve.md — danh sách NHẸ).
 */
const POTION_ICON = { src: '/assets/ui/icon_potion.png', w: 35, h: 44 };
const POTION_TINT: Record<BuffKind, string> = { exp: 'hue-rotate(235deg) saturate(1.1)', dmg: 'hue-rotate(325deg) saturate(1.3)', guard: 'hue-rotate(165deg)' };

function PotionIcon({ kind, scale = 1 }: { kind: BuffKind; scale?: 1 | 2 }) {
	return (
		<img
			src={POTION_ICON.src}
			width={POTION_ICON.w * scale}
			height={POTION_ICON.h * scale}
			alt=""
			draggable={false}
			className="pixel-img max-w-none"
			style={{ filter: POTION_TINT[kind] } as CSSProperties}
		/>
	);
}

/** Nhãn góc trên ô kệ: "×2", "+10%", "−20%". */
function badge(item: ShopItem): string {
	const { kind, mult } = item.buff;
	if (kind === 'exp') return `×${mult}`;
	const pct = Math.round(Math.abs(mult - 1) * 100);
	return kind === 'dmg' ? `+${pct}%` : `−${pct}%`;
}

type BuyState = 'ok' | 'poor' | 'weaker';

function buyState(item: ShopItem, diamonds: number, cur: { kind: BuffKind; mult: number } | undefined): BuyState {
	if (cur && buffPower(cur.mult) > buffPower(item.buff.mult)) return 'weaker';
	return diamonds < item.price ? 'poor' : 'ok';
}

/**
 * Quầy của người bán hàng (K1 — docs/ke-hoach-kim-cuong.md): gian hàng có KỆ (chủ dự án 08/10/2026: "shop sơ sài, phải gian hàng —
 * chờ PixelLab render xong thì update vào kệ, cứ dọc dọc toàn chữ thì không giống game"). Món bày thành ô trên từng tầng kệ gỗ theo
 * nhóm; chọn một món thì thẻ bên cạnh (dưới, trên điện thoại) hiện chi tiết + nút mua. Hình gian hàng / icon từng bình là TẠM — chờ
 * PixelLab (danh sách NHẸ ở docs/pixellab-ke-hoach-ve.md). Giá / số dư / bình đang có đều theo máy chủ; máy chủ chỉ bán khi đứng
 * cạnh người bán. Mua hỏi lại một lần (bấm hai lần) vì tiêu kim cương.
 */
export function ShopPanel() {
	const online = useSession((s) => s.online);
	const connected = useSession((s) => s.connected);
	const diamonds = useSession((s) => s.diamonds);
	const buffs = useSession((s) => s.buffs);
	const seller = useGameStore((s) => s.panelNpc);
	const [pick, setPick] = useState<string>(SHOP[0]!.id);
	const [confirm, setConfirm] = useState(false);
	const now = useNow(1000, !!buffs?.list.length);
	if (!online || diamonds === null) return null;
	const active = activeBuffs(buffs, now);
	const groups = [...new Set(SHOP.map((x) => BUFF_GROUP[x.buff.kind]))];
	const item = SHOP.find((x) => x.id === pick) ?? SHOP[0]!;
	const cur = active.find((b) => b.kind === item.buff.kind);
	const state = buyState(item, diamonds, cur);
	const choose = (id: string): void => {
		setPick(id);
		setConfirm(false);
	};

	return (
		<ServiceWindow
			id="shop"
			title={`Quầy của ${seller ?? 'thương nhân'}`}
			subtitle="«Hàng xịn từ phương xa — chỉ nhận kim cương!» Kim cương có từ điểm danh và Bia Danh Vọng."
			aside={<DiamondCount n={diamonds} />}
			onOpen={() => setConfirm(false)}
		>
			{active.length > 0 && (
				<div className="mb-3 flex flex-wrap items-center gap-1.5">
					<span className="text-note font-extrabold text-ink-soft">Đang dùng:</span>
					{active.map((b) => (
						<span key={b.kind} className="ui-tag gap-1 bg-paper-sunk tabular-nums text-ink-brown">
							{buffLabel(b.kind, b.mult)} · {fmtRemaining(b.remaining)}
						</span>
					))}
				</div>
			)}
			<div className="flex flex-col gap-4 sm:flex-row sm:items-start">
				{/* Gian hàng: mỗi nhóm một tầng kệ — hàng ô + tấm ván gỗ bên dưới. */}
				<div className="ui-tray flex min-w-0 flex-1 flex-col gap-5 px-3 pt-3 pb-4">
					{groups.map((group) => (
						<section key={group} aria-label={group}>
							<p className="mb-1 font-display text-label font-extrabold text-ink-soft">{group}</p>
							<div className="flex flex-wrap gap-x-2 gap-y-4 px-1 sm:gap-x-3">
								{SHOP.filter((x) => BUFF_GROUP[x.buff.kind] === group).map((x) => {
									const st = buyState(x, diamonds, active.find((b) => b.kind === x.buff.kind));
									const on = x.id === item.id;
									return (
										<button
											key={x.id}
											type="button"
											onClick={() => choose(x.id)}
											aria-pressed={on}
											title={x.name}
											className={`group/shelf relative flex w-[64px] flex-col sm:w-[72px] items-center gap-1 rounded-[8px] pt-1 transition-transform hover:-translate-y-0.5 ${on ? 'bg-honey/70 ring-2 ring-amber' : ''} ${st === 'ok' ? '' : 'opacity-60'}`}
										>
											<span className="ui-slot relative flex h-[57px] w-[58px] items-center justify-center">
												<PotionIcon kind={x.buff.kind} />
											</span>
											<span className="ui-tag absolute -right-1 top-0 h-[18px] bg-ink-brown px-1.5 text-[11px] text-paper-hi">{badge(x)}</span>
											<span className="flex items-center gap-0.5 text-note font-extrabold tabular-nums">
												<img src="/assets/ui/icon_diamond.png" width={22} height={18} alt="" draggable={false} className="pixel-img max-w-none" />
												{x.price}
											</span>
										</button>
									);
								})}
							</div>
							{/* Ván kệ (màu gỗ của bộ khung UI) — có tấm gian hàng PixelLab thì thay bằng ảnh kệ. */}
							<div className="mt-1 h-3 rounded-[3px] border-2 border-outline bg-wood-edge shadow-[0_3px_0_rgb(42_22_12/0.35)]" />
						</section>
					))}
				</div>

				{/* Thẻ chi tiết món đang chọn — điện thoại: dải gọn dính đáy (icon 1× bên trái) để nút Mua luôn trong tầm. */}
				<div className="ui-paper z-10 flex flex-col items-center gap-2 p-3 text-center max-sm:sticky max-sm:-bottom-5 max-sm:grid max-sm:grid-cols-[auto_1fr] max-sm:items-center max-sm:gap-x-3 max-sm:gap-y-1 max-sm:p-2 max-sm:text-left max-sm:shadow-[0_-4px_0_rgb(42_22_12/0.15)] sm:sticky sm:top-0 sm:w-[260px]">
					<span className="ui-slot hidden h-[110px] w-[110px] items-center justify-center sm:flex">
						<PotionIcon kind={item.buff.kind} scale={2} />
					</span>
					<span className="ui-slot flex h-[57px] w-[58px] items-center justify-center max-sm:row-span-2 sm:hidden">
						<PotionIcon kind={item.buff.kind} />
					</span>
					<p className="font-display text-head font-extrabold leading-tight max-sm:text-label">{item.name}</p>
					<p className="text-note text-ink-soft">{item.desc}</p>
					<p className="text-note max-sm:hidden">
						Thời hạn: <b>{item.buff.minutes >= 60 ? `${item.buff.minutes / 60} giờ` : `${item.buff.minutes} phút`} chơi</b>
					</p>
					{cur && (
						<p className="text-note text-ink-soft max-sm:col-span-2">
							Đang dùng {buffLabel(cur.kind, cur.mult)} — còn {fmtRemaining(cur.remaining)}.{' '}
							{state === 'weaker' ? 'Bình này yếu hơn, đợi hết giờ đã.' : buffPower(cur.mult) === buffPower(item.buff.mult) ? 'Mua thêm là cộng giờ.' : 'Mua là thay bình đang dùng.'}
						</p>
					)}
					<button
						type="button"
						className="ui-btn mt-1 w-full max-sm:col-span-2"
						disabled={!connected || state !== 'ok'}
						onClick={() => {
							if (!confirm) return setConfirm(true);
							online.shopBuy(item.id);
							setConfirm(false);
						}}
					>
						{state === 'poor' ? (
							'Thiếu kim cương'
						) : state === 'weaker' ? (
							'Đang có bình mạnh hơn'
						) : confirm ? (
							'Chắc mua?'
						) : (
							<>
								Mua · <img src="/assets/ui/icon_diamond.png" width={22} height={18} alt="" draggable={false} className="pixel-img max-w-none" /> {item.price}
							</>
						)}
					</button>
					<p className="text-chip text-ink-faint max-sm:hidden">Thời gian chỉ trôi khi đang chơi. Bình chỉ có tác dụng khi đánh quái.</p>
				</div>
			</div>
		</ServiceWindow>
	);
}

'use client';

import { shownStat, STAT_NAME, STAT_PERCENT, type StatBasis, type StatKey } from '@/game/equipment';
import { StatGroupTitle } from '../CharacterPanelParts';
import { fmtShown, signedStat, type CompareLine, type InvMode } from './invShared';

/**
 * Đủ 7 chỉ số trang bị cộng được (`STAT_KEYS`), chia ba nhóm như thẻ Nhân vật. Chỉ CHỮ — chủ dự án 10/10/2026 bỏ icon chỉ
 * số khỏi cửa sổ nhân vật (chỉ giữ icon xu / kim cương).
 */
const GROUPS: { title: string; keys: StatKey[] }[] = [
	{ title: 'Sinh lực', keys: ['hp', 'mp'] },
	{ title: 'Chiến đấu', keys: ['atk', 'mag', 'def'] },
	{ title: 'Phụ', keys: ['crit', 'move'] },
];
/** Nhãn như `STAT_NAME`, riêng Phép lực bỏ "tối đa" (giữ chữ cũ của bảng) — đủ chỗ cho "gốc · đồ" cùng dòng trên điện thoại. */
const LABEL: Record<StatKey, string> = { ...STAT_NAME, mp: 'Phép lực' };
/** Lòng thẻ rộng (≥ 24rem): tên nhóm thành cột trái trải đúng số dòng của nhóm — viết đủ tên lớp cho Tailwind quét. */
const RAIL_SPAN: Record<number, string> = { 2: '@min-[24rem]:row-span-2', 3: '@min-[24rem]:row-span-3' };

const tone = (n: number): string => (n > 0 ? 'text-leaf' : n < 0 ? 'text-berry' : 'text-ink-faint');
/** "+0" / "+0%" khi không đổi (signedStat để trần "0"). */
const plus = (n: number, key: StatKey): string => (n === 0 ? `+0${STAT_PERCENT.has(key) ? '%' : ''}` : signedStat(n, key));

export interface StatSheetProps {
	mode: InvMode;
	stats: { gear: Partial<Record<StatKey, number>>; gearBasis: StatBasis };
	/** Đang chọn một món trang bị trong túi: dòng so sánh "trước → sau" (chỉ các chỉ số món mới / món cũ có). */
	cmp: CompareLine[] | null;
	/** Tên + màu độ hiếm của món đang so — tiêu đề "Chỉ số · nếu mặc …". */
	cmpName: { name: string; color: string } | null;
}

/** Số trên bảng của một chỉ số: tổng (gốc + đồ), phần gốc (không mặc gì) và phần trang bị góp. */
function parts(b: StatBasis, gear: Partial<Record<StatKey, number>>, key: StatKey) {
	const total = shownStat(b, key, gear[key] ?? 0);
	const base = shownStat(b, key, 0);
	return { total, base, part: total - base };
}

/** Chú thích khi rê chuột: cách ra con số (gốc = cấp, con đường, tiềm năng; đồ = phần trang bị đang mặc góp). */
const why = (key: StatKey, base: number, part: number): string => `${STAT_NAME[key]}: gốc ${fmtShown(key, base)} (cấp, con đường, tiềm năng) ${plus(part, key)} từ trang bị`;

/**
 * Bảng chỉ số dưới búp bê: ba nhóm Sinh lực · Chiến đấu · Phụ, mỗi chỉ số một dòng "nhãn · gốc N · đồ +N · SỐ" — nhãn nhỏ
 * nhạt bên trái, số to đậm thẳng cột bên phải. Đang chọn món trong túi thì dòng bị ảnh hưởng đổi thành "140 → 149" +
 * "+9 nếu mặc" trên nền mật ong. Số tính bằng CHÍNH công thức của CombatSystem (`shownStat`) — không có chỉ số "lực
 * chiến" tổng vì game chưa có công thức. Màn thấp: một dòng chữ gói gọn cả 7 chỉ số.
 */
export function StatSheet({ mode, stats, cmp, cmpName }: StatSheetProps) {
	const b = stats.gearBasis;
	const lineOf = (key: StatKey) => cmp?.find((l) => l.key === key) ?? null;

	if (mode === 'low') {
		return (
			<p className="mt-1.5 flex flex-wrap gap-x-3 text-note text-ink-soft">
				{GROUPS.flatMap((g) => g.keys).map((key) => {
					const line = lineOf(key);
					const p = parts(b, stats.gear, key);
					return (
						<span key={key} className="whitespace-nowrap" title={why(key, p.base, p.part)}>
							{LABEL[key]}{' '}
							{line ? (
								<b className="text-ink-brown tabular-nums">
									{fmtShown(key, line.before)} → <span className={tone(line.after - line.before)}>{fmtShown(key, line.after)}</span>
								</b>
							) : (
								<>
									<b className="text-ink-brown tabular-nums">{fmtShown(key, p.total)}</b>
									{key !== 'move' && <em className={`ml-0.5 text-[12px] not-italic ${tone(p.part)}`}>{plus(p.part, key)}</em>}
								</>
							)}
						</span>
					);
				})}
			</p>
		);
	}

	return (
		<section aria-label="Chỉ số nhân vật" className="mt-3">
			<div className="mb-1.5 flex min-w-0 items-baseline gap-2">
				<h3 className="shrink-0 font-display text-[18px] leading-[1.3] font-extrabold">Chỉ số</h3>
				<span className="min-w-0 truncate text-note text-ink-soft">
					{cmpName ? (
						<>
							nếu mặc <b style={{ color: cmpName.color }}>{cmpName.name}</b>
						</>
					) : (
						'gốc + trang bị đang mặc'
					)}
				</span>
			</div>
			{/*
			 * `@container` đo lòng thẻ. ≥ 24rem (cột trái máy tính rộng): tên nhóm là cột riêng bên trái, bảng thấp vừa màn khỏi
			 * cuộn. ≥ 18rem: tên nhóm là dòng tiêu đề, mỗi chỉ số một dòng "nhãn … gốc · đồ │ SỐ". Hẹp hơn (điện thoại 320):
			 * "gốc · đồ" xuống dưới nhãn. Mọi dòng là subgrid của CÙNG một lưới nên cột số thẳng hàng từ trên xuống dưới; số lớn
			 * (cuối game, "1.714 → 1.854") không vừa một dòng thì riêng "gốc · đồ" của dòng đó xuống dưới nhãn, không cắt chữ.
			 */}
			<div className="ui-paper @container px-2 py-1">
				<div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-2.5 @min-[24rem]:grid-cols-[auto_minmax(0,1fr)_auto]">
					{GROUPS.map((g, gi) => (
						<div key={g.title} className={`col-span-full grid grid-cols-subgrid ${gi ? 'mt-1.5 @min-[24rem]:mt-1 @min-[24rem]:border-t @min-[24rem]:border-paper-line @min-[24rem]:pt-0.5' : ''}`}>
							<StatGroupTitle className={`col-span-full @min-[24rem]:self-center @min-[24rem]:after:hidden @min-[24rem]:[grid-column:1] ${RAIL_SPAN[g.keys.length] ?? ''}`}>{g.title}</StatGroupTitle>
							{g.keys.map((key) => {
								const line = lineOf(key);
								const p = parts(b, stats.gear, key);
								const delta = line ? line.after - line.before : 0;
								return (
									<div
										key={key}
										title={why(key, p.base, p.part)}
										className={`col-span-full grid grid-cols-subgrid items-baseline rounded-[5px] px-1.5 pb-1 @min-[18rem]:pb-0 @min-[24rem]:[grid-column:2/-1] ${line && delta ? 'bg-honey' : ''}`}
									>
										{/* Nhãn trái, "gốc · đồ" sát cột số; không đủ chỗ thì "gốc · đồ" một mình một dòng — `justify-between` đẩy về trái. */}
										<span className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-2">
											<span className="text-[13px] leading-[22px] font-bold text-ink-soft">{LABEL[key]}</span>
											<span className={`-mt-0.5 basis-full text-[12px] leading-4 font-bold tabular-nums @min-[18rem]:mt-0 @min-[18rem]:basis-auto @min-[18rem]:whitespace-nowrap ${line ? tone(delta) : 'text-ink-faint'}`}>
												{line ? (
													delta ? (
														`${signedStat(delta, key)} nếu mặc`
													) : (
														'không đổi'
													)
												) : key === 'move' ? (
													'từ trang bị'
												) : (
													<>
														gốc {fmtShown(key, p.base)} · đồ <span className={tone(p.part)}>{plus(p.part, key)}</span>
													</>
												)}
											</span>
										</span>
										<b className="text-right text-[17px] leading-[22px] font-extrabold whitespace-nowrap text-ink-brown tabular-nums">
											{line ? (
												<>
													{fmtShown(key, line.before)} → <span className={tone(delta)}>{fmtShown(key, line.after)}</span>
												</>
											) : (
												fmtShown(key, p.total)
											)}
										</b>
									</div>
								);
							})}
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

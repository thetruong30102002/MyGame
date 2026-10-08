import { COUNTER, GUARD, SUNDER_TAKEN, THUNDER } from './skillRules.ts';

export type Element = 'aether' | 'fire' | 'water' | 'wind' | 'healing' | 'steel' | 'ice' | 'earth';

/**
 * Kiểu đòn (CombatSystem áp theo kiểu, số liệu nằm ở `SkillDef`):
 * - `projectile`: đạn bay thẳng · `melee`: chém trước mặt · `spin`: chém vòng · `heal`: hồi máu.
 * - `aoe_self`: vùng quanh mình (`radius`).
 * - `aoe_target`: vùng tại điểm nhắm (`range` = tầm đặt, `radius`); `lob` = cầu bay tới rồi mới nổ (độ trễ = đường bay).
 * - `cone`: hình nón trước mặt (`range`, `angle` = nửa góc mở, độ).
 * - `line`: đường thẳng trồi lên dần (`range` = dài, `width` = nửa bề ngang, `delay` = trễ đoạn đầu, `stagger` = trễ mỗi đoạn).
 * - `dash`: lướt (`range`, `speed`, `iframes`); `trail` = để lại vệt chém dọc đường lướt (`width` = nửa bề ngang vệt).
 * - `pillar`: cột/vật trồi tại điểm nhắm sau `delay` (có vòng báo dưới đất).
 * - `zone`: vùng tồn tại `duration` giây tại điểm nhắm, gây sát thương mỗi `tick` giây (`power` là MỖI nhịp), hút `pull` px/giây;
 *   `follow` = vùng bám theo người chơi (Phong Kiếm Cuồng Vũ) — không nhắm điểm.
 * - `guard`: giữ thế đỡ `duration` giây (`guard`: 'stance' Thế Tĩnh / 'parry' Lưu Thủy Phản), `power` = uy lực nhát PHẢN đòn.
 *   Luật chặn / phản / giảm ở `skillRules.guardOutcome`.
 * - `blink`: ra sau lưng mục tiêu gần hướng nhắm nhất (`range` = tầm tìm, `angle` = nửa góc nón tìm) rồi chém (`radius` =
 *   tầm nhát chém, `arc` = nửa góc chém) — Ảnh Bộ.
 * GĐ3 (mốc 6–9):
 * - `projectile` + `count`/`spread`: nhiều lưỡi toả quạt (Phong Bạo). `aoe_target` + `fall`: rơi từ trời sau `delay` (Thiên Thạch).
 * - `zone` + `rain`: mưa — không sát thương, mỗi nhịp làm ướt (Gọi Mưa); + `bolts`: mỗi nhịp sét đánh quái ướt
 *   (`skillRules.pickBolts`, Lôi Vũ); + `move`: vùng đi theo hướng nhắm với tốc này (Vòi Rồng).
 * - `wall`: tường tạm tại điểm nhắm, vuông góc hướng nhắm (`width` = nửa chiều dài, `duration`): chặn quái đi + chặn đạn quái;
 *   có `tick` = đốt quái áp sát mỗi nhịp (`power` mỗi nhịp — Tường Lửa), không có = đá trồi gây `power` một lần (Tường Đá).
 * - `ward`: khiên quanh mình `duration` giây, bán kính `radius`: đạn quái chạm khiên bị phản về kẻ bắn (`power` = uy lực đạn phản).
 * - `barrage`: mưa nhiều điểm — `count` viên rơi rải trong `duration` giây khắp vùng `radius` tại điểm nhắm, mỗi viên rơi mất
 *   `delay` giây và nổ bán kính `width` (Mưa Băng, Lở Đá; điểm rơi `skillRules.scatterPoints`).
 * GĐ3 lượt B (Kiếm 3 lưu phái mốc 6/8 — đòn thép, ăn phủ phép):
 * - `melee` + `count`/`stagger`: chuỗi `count` nhát chém nối nhau cách `stagger` giây (Liên Hoàn).
 * - `projectile` hệ thép: luồng kiếm bay (Lưỡi Sóng; `width` = nửa bề ngang trúng); + `returns`: kiếm bay đi hết tầm rồi bay
 *   về tay, mỗi chiều trúng mỗi quái tối đa một lần (Phi Kiếm).
 * - `ward` hệ thép: gạt đạn — đạn quái tới gần bị chém bay ngược về kẻ bắn (Dòng Chảy Ngược; Gương Băng là bản phép).
 * - `spin`: xoay chém quanh mình bán kính `radius`; `afterGuard` = nhân uy lực khi tung ngay sau khi đỡ đòn (Xoáy Nước).
 */
export type SkillKind = 'projectile' | 'melee' | 'spin' | 'dash' | 'heal' | 'aoe_self' | 'aoe_target' | 'cone' | 'line' | 'pillar' | 'zone' | 'guard' | 'blink' | 'wall' | 'ward' | 'barrage';

/** Hiệu ứng khống chế đòn gây ra cho MỖI mục tiêu trúng (boss: thời lượng một nửa, không bị đẩy/hút — `skillRules`). */
export interface SkillHitFx {
	/** Đẩy lùi (px) — ra xa tâm vùng, hoặc theo hướng đòn (nón, đường, đạn). */
	knock?: number;
	/** Choáng (giây): đứng im, không đánh. */
	stun?: number;
	/** Hất lên (giây): bay khỏi mặt đất, không đánh được. */
	launch?: number;
	/** Đóng băng thẳng (giây). */
	freeze?: number;
	/** Đóng băng (giây) chỉ khi mục tiêu ĐANG LẠNH lúc trúng đòn (Hàn Băng Trảm; ướt thì đã Đóng Băng nhờ phản ứng). */
	freezeChilled?: number;
	/** Hút máu: hồi phần này của sát thương THẬT đã gây (cộng với Huyết Thuỷ nếu đòn hệ Thuỷ). */
	drain?: number;
	/** Phá giáp (giây): giáp −50% + nhận thêm 15% (`skillRules.ARMOR_BREAK`) — Phá Giáp, kiếm phủ Thổ. */
	armor?: number;
	/**
	 * Vỡ giáp (giây) — chỉ khi mục tiêu ĐANG bị phá giáp lúc trúng đòn ("phá giáp chồng phá giáp"): nhận thêm
	 * `skillRules.SUNDER_TAKEN` nữa từ mọi nguồn.
	 */
	sunder?: number;
}

export interface SkillDef {
	id: string;
	/** Phím MẶC ĐỊNH (ô nhà, `talents.HOME_SLOT`) — chỉ kỹ năng có từ trước thanh 10 ô; kỹ năng mới vào ô trống đầu tiên. */
	key?: string;
	name: string;
	element: Element;
	mpCost: number;
	cooldown: number;
	/** Hệ số sát thương theo ATK (`zone`: mỗi nhịp; `heal`: phần máu tối đa). */
	power: number;
	kind: SkillKind;
	speed?: number;
	/** Tầm: đạn bay xa / chém tới / độ dài đường / tầm đặt vùng nhắm / quãng lướt. */
	range?: number;
	pierce?: boolean;
	/** Bán kính vùng (px, đo trên mặt đất — elip dẹt theo `skillRules.GROUND_SQUASH`). */
	radius?: number;
	/** Nửa góc mở của nón (độ). */
	angle?: number;
	/** Nửa bề ngang của đường thẳng / vệt lướt / luồng kiếm bay (`projectile` hệ thép — thiếu = 20) (px). */
	width?: number;
	/** Độ trễ trước khi đòn rơi xuống / trồi lên (giây). */
	delay?: number;
	/** `line`: trễ thêm mỗi đoạn (giây) — gai trồi nối đuôi nhau. `melee` nhiều nhát: giây giữa hai nhát chém. */
	stagger?: number;
	/** `zone`: thời gian tồn tại + nhịp gây sát thương (giây) + lực hút (px/giây, 0 = không hút). */
	duration?: number;
	tick?: number;
	pull?: number;
	/** `dash`: giây không trúng đòn. */
	iframes?: number;
	/** `dash`: để lại vệt chém dọc đường lướt (sát thương tính theo `power`). Không có vệt = chém quái đi qua (`width` = tầm). */
	trail?: boolean;
	/** `melee` / `blink`: nửa góc chém (độ). Thiếu = 72,5° (cos 0,3 — Trảm). */
	arc?: number;
	/** Dồn lực (giây) trước khi vào động tác: đứng im, có hình báo; né được (hoàn MP + hồi chiêu). */
	charge?: number;
	/** Cộng vào tỉ lệ chí mạng của đòn này (1 = chắc chắn chí mạng). */
	crit?: number;
	/** `guard`: kiểu thế đỡ. */
	guard?: 'stance' | 'parry';
	/** `zone`: vùng bám theo người chơi thay vì đặt ở điểm nhắm. */
	follow?: boolean;
	/**
	 * Đòn KIẾM mang hệ (Kiếm pháp nguyên tố): tính theo sức đánh kiếm của con đường + Nhịp Chém như đòn Kiếm, nhưng giữ
	 * nguyên hệ của nó (không ăn phủ phép).
	 */
	blade?: boolean;
	/** `aoe_target`: cầu bay tới điểm nhắm với tốc này rồi mới nổ. */
	lob?: number;
	/** `aoe_target`: rơi từ trời xuống điểm nhắm sau `delay` giây (có vòng báo) — Thiên Thạch. */
	fall?: boolean;
	/** `projectile`: số lưỡi toả quạt; `barrage`: số viên rơi; `melee`: số nhát chém nối nhau (Liên Hoàn). */
	count?: number;
	/** `projectile` nhiều lưỡi: góc giữa hai lưỡi kề nhau (độ). */
	spread?: number;
	/** `zone`: mưa — không gây sát thương, mỗi nhịp làm ướt mọi mục tiêu trong vùng (Gọi Mưa). */
	rain?: boolean;
	/** `zone`: mỗi nhịp sét đánh quái ướt trong vùng (Lôi Vũ) — số tia `skillRules.THUNDER`. */
	bolts?: boolean;
	/** `zone`: vùng đi theo hướng nhắm với tốc này (px/giây) thay vì đứng yên (Vòi Rồng). */
	move?: number;
	/** `projectile`: bay hết tầm rồi bay về tay người chơi; mỗi chiều trúng mỗi mục tiêu tối đa một lần (Phi Kiếm). */
	returns?: boolean;
	/** `spin`: tung trong `skillRules.COUNTER.after` giây sau một lần đỡ / gạt / phản thành công thì uy lực ×chừng này (Xoáy Nước). */
	afterGuard?: number;
	/** Vùng nhắm khi KHÔNG có chuột (cảm ứng / chỉ bàn phím): đặt trước mặt theo hướng đang nhìn ở khoảng cách này. */
	aimDist?: number;
	/** Khống chế lên mục tiêu trúng đòn. */
	hit?: SkillHitFx;
	/** Kỹ năng khoá tới khi nhiệm vụ mở (`StoryDirector.isUnlocked`). */
	unlock?: string;
	/** Động tác của nhân vật khi tung đòn: `attack` vung kiếm, `cast` vung tay niệm phép. Thiếu = đòn nổ ngay. */
	anim?: 'attack' | 'cast';
	/** Một câu mô tả cho tooltip / bảng Tiềm năng (số liệu do `skillFacts` sinh từ chính các trường trên). */
	desc?: string;
}

/**
 * Bộ kỹ năng của nhân vật chính. Cha là kiếm sĩ, mẹ là pháp sư → từ 6 tuổi học SONG SONG: Trảm bằng kiếm gỗ cha tặng
 * (`sword`), Tia Aether bằng trượng tập mẹ tặng (`staff`), các phép nguyên tố mốc 1, Suối Lành (Thuỷ mốc 3 — học bằng
 * điểm tiềm năng, không có `unlock`), Băng Tiễn (8 tuổi, tết nước + gió thành băng). Nhánh + mốc học của từng kỹ năng ở
 * `talents.TREE`; `key` chỉ là phím MẶC ĐỊNH (thanh 10 ô gán tự do — `talents.HOME_SLOT`). Mười sáu tuổi chọn con đường
 * (`PATHS`) — không khoá kỹ năng nào, chỉ đổi mạnh/yếu.
 *
 * Từ chỉ số 7 (GĐ2, 07/10/2026): mốc 3 + mốc 5 của Hoả/Thuỷ/Phong/Băng và nhánh Thổ. Chưa có hình PixelLab riêng — dùng
 * TẠM hình có sẵn, ghi ở `tempArt.TEMP_ART` (có bản PixelLab thì `Vfx` tự dùng).
 * Số liệu so với mốc 1: mốc 3 = đòn vùng ~1,1–1,3× một phát mốc 1 nhưng trúng cả nhóm, hồi 6–9s; mốc 5 = kỹ năng đặc
 * trưng ~1,7–1,9× một phát mốc 1 + khống chế, MP 16–24.
 * Từ chỉ số 17 (lượt B): mốc 3 / 5 của 3 lưu phái Kiếm (đòn thép — ăn phủ phép) và 5 kiếm pháp nguyên tố (`blade`).
 * Từ chỉ số 28 (GĐ3 lượt A): mốc 6 / 8 của 5 nguyên tố. Từ chỉ số 38 (GĐ3 lượt B): mốc 6 / 8 của 3 lưu phái Kiếm.
 */
export const HERO_SKILLS: SkillDef[] = [
	{ id: 'slash', key: 'J', name: 'Trảm', element: 'steel', mpCost: 0, cooldown: 0.38, power: 1.25, kind: 'melee', range: 74, unlock: 'sword', anim: 'attack', desc: 'Nhát chém cơ bản, giữ phím để chém liên tục.' },
	{ id: 'aether_bolt', key: 'K', name: 'Tia Aether', element: 'aether', mpCost: 0, cooldown: 0.42, power: 1, kind: 'projectile', speed: 420, range: 380, unlock: 'staff', anim: 'cast', desc: 'Năng lực bẩm sinh: tia sáng bắn thẳng.' },
	{ id: 'fire_bolt', key: '1', name: 'Hoả Cầu', element: 'fire', mpCost: 6, cooldown: 1, power: 1.4, kind: 'projectile', speed: 360, range: 400, unlock: 'fire', anim: 'cast', desc: 'Cầu lửa, gây cháy.' },
	{ id: 'water_lance', key: '2', name: 'Thuỷ Tiễn', element: 'water', mpCost: 8, cooldown: 1.6, power: 1.3, kind: 'projectile', speed: 460, range: 420, unlock: 'water', anim: 'cast', desc: 'Mũi nước, làm ướt.' },
	{ id: 'wind_blade', key: '3', name: 'Phong Nhận', element: 'wind', mpCost: 10, cooldown: 2.4, power: 1.1, kind: 'projectile', speed: 520, range: 460, pierce: true, unlock: 'wind', anim: 'cast', desc: 'Lưỡi gió bay xuyên mục tiêu.' },
	// Suối Lành (Hồi Phục cũ): Thuỷ mốc 3. Giữ id `heal` — icon, bản lưu thanh kỹ năng và máy người khác tra theo id.
	{ id: 'heal', key: '4', name: 'Suối Lành', element: 'healing', mpCost: 15, cooldown: 6, power: 0.35, kind: 'heal', anim: 'cast', desc: 'Hồi máu, mạnh theo mốc Thuỷ.' },
	// Nối CUỐI (chỉ số 6): CombatSystem.cast và test tra kỹ năng theo chỉ số — chèn giữa là lệch hết.
	{ id: 'ice_shard', key: '5', name: 'Băng Tiễn', element: 'ice', mpCost: 9, cooldown: 1.8, power: 1.35, kind: 'projectile', speed: 440, range: 420, unlock: 'ice', anim: 'cast', desc: 'Mũi băng làm lạnh; trúng mục tiêu ướt thì Đóng Băng.' },
	// ——— GĐ2: luôn nối CUỐI (chỉ số 7+) ———
	// Hoả 3: nổ quanh mình, đẩy quái ra (cứu nguy khi bị vây) + gây cháy cả vòng.
	{ id: 'flame_ring', name: 'Vòng Lửa', element: 'fire', mpCost: 14, cooldown: 6, power: 1.5, kind: 'aoe_self', radius: 110, hit: { knock: 50 }, anim: 'cast', desc: 'Nổ vòng lửa quanh mình, đẩy quái ra và gây cháy.' },
	// Hoả 5 ★: cầu lửa lớn bay tới điểm nhắm rồi nổ lan — 2,4× (≈1,7 phát Hoả Cầu) lên CẢ nhóm.
	{ id: 'fire_blast', name: 'Bộc Hoả', element: 'fire', mpCost: 22, cooldown: 7, power: 2.4, kind: 'aoe_target', range: 360, radius: 100, lob: 520, aimDist: 200, anim: 'cast', desc: 'Cầu lửa lớn bay tới chỗ nhắm rồi nổ lan, đốt cả nhóm.' },
	// Thuỷ 5 ★: sóng hình nón đẩy lùi cả nhóm, làm ướt hết (mồi cho Băng/Phong/Thổ).
	{ id: 'tidal_wave', name: 'Sóng Dữ', element: 'water', mpCost: 20, cooldown: 6, power: 1.9, kind: 'cone', range: 190, angle: 40, hit: { knock: 80 }, anim: 'cast', desc: 'Sóng hình nón đẩy lùi cả nhóm, làm ướt hết.' },
	// Phong 3: lốc nhỏ tại điểm nhắm, 5 nhịp × 0,32 = 1,6× trong 2,5s, cuốn quái vào giữa.
	{ id: 'cyclone', name: 'Lốc Xoáy', element: 'wind', mpCost: 16, cooldown: 8, power: 0.32, kind: 'zone', range: 260, radius: 95, duration: 2.5, tick: 0.5, pull: 90, aimDist: 150, anim: 'cast', desc: 'Lốc nhỏ tại chỗ nhắm, cuốn quái vào giữa và chém liên tục.' },
	// Phong 5 ★: lướt xa không trúng đòn, vệt gió dọc đường lướt chém mọi quái đi qua.
	{ id: 'gale_dash', name: 'Lướt Gió', element: 'wind', mpCost: 16, cooldown: 5, power: 1.8, kind: 'dash', range: 210, speed: 720, iframes: 0.4, trail: true, width: 34, desc: 'Lướt xa, không trúng đòn lúc lướt; để lại lưỡi gió chém mọi quái dọc đường.' },
	// Băng 3: mặt băng 4s tại điểm nhắm, 8 nhịp × 0,22 = 1,76×, mỗi nhịp làm lạnh (ướt thì Đóng Băng).
	{ id: 'frost_field', name: 'Băng Địa', element: 'ice', mpCost: 15, cooldown: 9, power: 0.22, kind: 'zone', range: 260, radius: 105, duration: 4, tick: 0.5, pull: 0, aimDist: 150, anim: 'cast', desc: 'Phủ băng mặt đất tại chỗ nhắm: quái trong vùng bị lạnh và chậm.' },
	// Băng 5 ★: cột băng trồi sau 0,5s (có vòng báo), hất lên rồi đóng băng.
	{ id: 'ice_spire', name: 'Băng Trụ', element: 'ice', mpCost: 24, cooldown: 9, power: 2.6, kind: 'pillar', range: 300, radius: 75, delay: 0.5, hit: { launch: 0.5, freeze: 1.4 }, aimDist: 170, anim: 'cast', desc: 'Cột băng khổng lồ trồi lên tại chỗ nhắm, hất quái lên rồi đóng băng.' },
	// Thổ 1: mở bằng mã `earth` (nhiệm vụ tuổi 16 — lượt B). Như Thuỷ Tiễn nhưng đẩy lùi.
	{ id: 'rock_throw', name: 'Đá Văng', element: 'earth', mpCost: 8, cooldown: 1.6, power: 1.35, kind: 'projectile', speed: 380, range: 380, hit: { knock: 45 }, unlock: 'earth', anim: 'cast', desc: 'Ném đá, đẩy lùi.' },
	// Thổ 3: dậm đất quanh mình, choáng nhẹ.
	{ id: 'quake', name: 'Địa Chấn', element: 'earth', mpCost: 14, cooldown: 7, power: 1.3, kind: 'aoe_self', radius: 105, hit: { stun: 0.9 }, anim: 'cast', desc: 'Dậm đất, choáng nhẹ quái quanh mình.' },
	// Thổ 5 ★: gai đá trồi nối đuôi theo đường thẳng, hất quái lên.
	{ id: 'stone_spikes', name: 'Gai Đá', element: 'earth', mpCost: 22, cooldown: 7, power: 2.3, kind: 'line', range: 320, width: 28, delay: 0.08, stagger: 0.025, hit: { launch: 0.4 }, anim: 'cast', desc: 'Gai đá trồi theo đường thẳng, hất quái lên.' },
	// ——— GĐ2 lượt B: Kiếm 3 lưu phái (mốc 3 / 5 — nhánh + lưu phái ở `talents.STYLE_TREE`). Luôn nối CUỐI ———
	// Kiếm Thần 3: dồn lực 0,3s rồi bổ một nhát ×2,8 (≈2,2 nhát Trảm), nửa góc 60°, đẩy lùi, +15% chí mạng.
	{ id: 'heavy_strike', name: 'Nhất Kích', element: 'steel', mpCost: 8, cooldown: 4.5, power: 2.8, kind: 'melee', range: 96, arc: 60, charge: 0.3, crit: 0.15, hit: { knock: 55 }, anim: 'attack', desc: 'Dồn lực một nhịp rồi bổ một nhát nặng: trúng cả hàng trước mặt, đẩy lùi, dễ chí mạng.' },
	// Kiếm Thần 5 ★: lướt 220px rồi vệt chém xuyên mọi quái dọc đường (khuôn vệt của Lướt Gió nhưng là thép — ăn phủ phép).
	{ id: 'pierce_rush', name: 'Đột Kích', element: 'steel', mpCost: 14, cooldown: 6, power: 2.4, kind: 'dash', range: 220, speed: 780, iframes: 0.15, trail: true, width: 40, crit: 0.1, desc: 'Lướt thẳng tới rồi chém xuyên mọi quái dọc đường lướt.' },
	// Thủy Thần 3: giữ thế 1,5s — cận chiến đánh vào bị chặn + phản ×1,4; đạn / đòn vùng chỉ còn 40%.
	{ id: 'calm_stance', name: 'Thế Tĩnh', element: 'steel', mpCost: 8, cooldown: 6, power: 1.4, kind: 'guard', guard: 'stance', duration: 1.5, desc: 'Đứng yên giữ thế: đòn cận chiến đánh vào bị chặn và phản lại; đạn và đòn vùng giảm sát thương. Né hoặc bấm đòn khác để thôi giữ thế.' },
	// Thủy Thần 5 ★: cửa sổ đỡ 0,6s (vòng báo co đúng hết cửa sổ) — hoá giải MỘT đòn (cả đạn) rồi phản ×2,8 = gấp đôi Thế Tĩnh.
	{ id: 'flowing_counter', name: 'Lưu Thủy Phản', element: 'steel', mpCost: 12, cooldown: 7, power: 2.8, kind: 'guard', guard: 'parry', duration: 0.6, desc: 'Mở thế đỡ một nhịp ngắn (vòng sáng dưới chân): đòn đầu tiên đánh vào — kể cả đạn — bị hoá giải và phản công gấp đôi.' },
	// Bắc Thần 3: lướt ngắn chém quái đi qua; không trúng đòn suốt quãng lướt (0,18s) và thêm chút dư.
	{ id: 'side_slash', name: 'Lướt Chém', element: 'steel', mpCost: 6, cooldown: 3, power: 1.6, kind: 'dash', range: 140, speed: 760, iframes: 0.3, width: 44, desc: 'Lướt ngang qua quái, chém mọi con đi qua; lúc lướt không trúng đòn.' },
	// Bắc Thần 5 ★: ra sau lưng mục tiêu gần hướng nhắm nhất (tầm 260, nón ±60°) rồi chém — chắc chắn chí mạng (×2 × 1,75).
	{ id: 'shadow_step', name: 'Ảnh Bộ', element: 'steel', mpCost: 14, cooldown: 6, power: 2, kind: 'blink', range: 260, angle: 60, radius: 72, arc: 70, iframes: 0.35, crit: 1, anim: 'attack', desc: 'Lướt bóng ra sau lưng mục tiêu gần hướng nhắm nhất rồi chém — chắc chắn chí mạng.' },
	// ——— Kiếm pháp nguyên tố: Kiếm ≥ mốc 5 + nguyên tố ≥ mốc 5, mọi lưu phái (`talents.SWORD_ARTS`) ———
	{ id: 'blaze_slash', name: 'Liệt Hoả Trảm', element: 'fire', blade: true, mpCost: 18, cooldown: 7, power: 2.6, kind: 'cone', range: 150, angle: 45, hit: { knock: 30 }, anim: 'attack', desc: 'Nhát chém quét hình nón bùng lửa, đốt cháy cả nhóm.' },
	{ id: 'water_dragon_slash', name: 'Thuỷ Long Trảm', element: 'water', blade: true, mpCost: 18, cooldown: 7, power: 2.4, kind: 'line', range: 260, width: 30, delay: 0.05, stagger: 0.018, hit: { knock: 40, drain: 0.15 }, anim: 'attack', desc: 'Nhát chém phóng sóng nước dọc đường thẳng: làm ướt, đẩy lùi và hút máu.' },
	{ id: 'gale_blade_dance', name: 'Phong Kiếm Cuồng Vũ', element: 'wind', blade: true, mpCost: 20, cooldown: 9, power: 0.36, kind: 'zone', follow: true, radius: 100, duration: 2.4, tick: 0.3, pull: 0, anim: 'attack', desc: 'Chuỗi lưỡi gió xoay quanh mình 2,4 giây, chém liên tục mọi quái áp sát.' },
	{ id: 'frost_cleave', name: 'Hàn Băng Trảm', element: 'ice', blade: true, mpCost: 18, cooldown: 7, power: 2.6, kind: 'melee', range: 104, arc: 70, hit: { freezeChilled: 1.6 }, anim: 'attack', desc: 'Nhát chém băng rộng: mục tiêu ướt hoặc đang lạnh bị đóng băng.' },
	{ id: 'earth_rend', name: 'Địa Liệt Trảm', element: 'earth', blade: true, mpCost: 18, cooldown: 8, power: 2.5, kind: 'line', range: 280, width: 28, delay: 0.12, stagger: 0.022, hit: { stun: 0.8 }, anim: 'attack', desc: 'Bổ kiếm xuống đất: gai đá trồi theo đường thẳng, choáng mọi quái trúng.' },
	// ——— GĐ3: mốc 6 (phòng thủ / điều khiển) + mốc 8 (chủ động mạnh) của 5 nguyên tố (bảng 3.2). Luôn nối CUỐI (chỉ số 28+) ———
	// Mốc 6: uy lực một mục tiêu ngang mốc 3–5 nhưng thiên về khống chế/chặn, MP 16–18, hồi 7–12s. Mốc 8: tổng uy lực trên mỗi
	// mục tiêu 2,3–3,6 trên VÙNG LỚN (bán kính 150–170), MP 30–34, hồi 14–15s — mạnh rõ hơn mốc 5 nhưng không xả liên tục.
	// Hoả 6: tường lửa 160px đứng 5s — 10 nhịp × 0,25 (2,5 nếu áp sát cả lúc) + cháy liên tục; chặn đường + đạn.
	{ id: 'fire_wall', name: 'Tường Lửa', element: 'fire', mpCost: 18, cooldown: 10, power: 0.25, kind: 'wall', range: 240, width: 80, duration: 5, tick: 0.5, aimDist: 110, anim: 'cast', desc: 'Dựng tường lửa chắn ngang chỗ nhắm: quái không đi xuyên qua, đạn quái bị chặn; quái áp sát tường bị đốt.' },
	// Hoả 8: thiên thạch rơi sau 0,8s (vòng báo), ×3,6 (1,5 lần Bộc Hoả) lên vùng bán kính 150, đẩy văng + cháy.
	{ id: 'meteor', name: 'Thiên Thạch', element: 'fire', mpCost: 34, cooldown: 15, power: 3.6, kind: 'aoe_target', fall: true, delay: 0.8, range: 380, radius: 150, hit: { knock: 60 }, aimDist: 220, anim: 'cast', desc: 'Gọi thiên thạch rực lửa rơi xuống chỗ nhắm, nổ cả một vùng lớn và đốt cháy.' },
	// Thuỷ 6: mưa 6s — không sát thương, giữ quái ướt suốt (mồi Lôi Vũ / Đóng Băng hàng loạt; đứng trong mưa: Mạch Nguồn).
	{ id: 'call_rain', name: 'Gọi Mưa', element: 'water', mpCost: 16, cooldown: 12, power: 0, kind: 'zone', rain: true, range: 280, radius: 130, duration: 6, tick: 0.5, pull: 0, aimDist: 160, anim: 'cast', desc: 'Gọi mây giông trút mưa một vùng: quái trong vùng ướt liên tục (mồi cho Băng và Lôi Vũ).' },
	// Thuỷ 8: mây sét 3s, 6 nhịp × 2 tia (4 trong mưa) × 0,6 — một quái ướt ăn 3,6; cả bầy ướt mỗi con 3,6.
	{ id: 'thunder_rain', name: 'Lôi Vũ', element: 'water', mpCost: 30, cooldown: 14, power: 0.6, kind: 'zone', bolts: true, range: 320, radius: 170, duration: 3, tick: 0.5, pull: 0, aimDist: 180, anim: 'cast', desc: 'Mây giông phóng sét xuống quái trong vùng, ưu tiên quái đang ướt; mây đứng trong mưa của chính mình thì sét dày gấp đôi.' },
	// Phong 6: 3 lưỡi toả quạt 36°, xuyên, đẩy 55 — áp sát trúng cả ba (3,6), xa thì toả ra quét cả hàng.
	{ id: 'gale_fan', name: 'Phong Bạo', element: 'wind', mpCost: 18, cooldown: 7, power: 1.2, kind: 'projectile', count: 3, spread: 18, speed: 500, range: 300, pierce: true, hit: { knock: 55 }, anim: 'cast', desc: 'Ba lưỡi gió toả hình quạt, xuyên mục tiêu, đẩy lùi.' },
	// Phong 8: lốc đi 385px theo hướng nhắm trong 3,5s, hút 170px/s (> tốc đi 110 → cuốn quái theo), 10 nhịp × 0,34.
	{ id: 'tornado', name: 'Vòi Rồng', element: 'wind', mpCost: 30, cooldown: 14, power: 0.34, kind: 'zone', move: 110, radius: 80, duration: 3.5, tick: 0.35, pull: 170, anim: 'cast', desc: 'Lốc khổng lồ đi theo hướng nhắm, cuốn quái theo và chém liên tục.' },
	// Băng 6: khiên 4s — đạn quái chạm khiên bay ngược về kẻ bắn thành mũi băng ×1,6 (làm lạnh; ướt thì Đóng Băng).
	{ id: 'ice_mirror', name: 'Gương Băng', element: 'ice', mpCost: 16, cooldown: 12, power: 1.6, kind: 'ward', duration: 4, radius: 46, anim: 'cast', desc: 'Khiên băng quanh mình 4 giây: đạn quái chạm khiên bị phản ngược về kẻ bắn thành mũi băng.' },
	// Băng 8: 20 mũi băng rơi rải 1,8s khắp vùng 150, mỗi mũi ×0,9 bán kính 48 — một quái ăn ~3,4 mũi (≈3,1) + Đóng Băng hàng loạt.
	{ id: 'ice_rain', name: 'Mưa Băng', element: 'ice', mpCost: 32, cooldown: 15, power: 0.9, kind: 'barrage', range: 320, radius: 150, count: 20, duration: 1.8, width: 48, delay: 0.3, aimDist: 180, anim: 'cast', desc: 'Mũi băng to rơi rải khắp một vùng: mỗi mũi làm lạnh, mục tiêu ướt thì Đóng Băng.' },
	// Thổ 6: tường đá 200px đứng 7s; đá trồi ×1,1 + hất quái đứng trên đường tâm sang hai bên.
	{ id: 'stone_wall', name: 'Tường Đá', element: 'earth', mpCost: 18, cooldown: 12, power: 1.1, kind: 'wall', range: 220, width: 100, duration: 7, hit: { knock: 40 }, aimDist: 100, anim: 'cast', desc: 'Dựng tường đá chắn ngang chỗ nhắm: chặn đường và chặn đạn quái; đá trồi hất quái đứng trên đó sang hai bên.' },
	// Thổ 8: 12 tảng rơi rải 1,5s khắp vùng 160, mỗi tảng ×1,2 bán kính 58 + choáng 0,5s — một quái ăn ~2,4 tảng (≈2,9).
	{ id: 'rockslide', name: 'Lở Đá', element: 'earth', mpCost: 32, cooldown: 15, power: 1.2, kind: 'barrage', range: 320, radius: 160, count: 12, duration: 1.5, width: 58, delay: 0.35, hit: { stun: 0.5 }, aimDist: 180, anim: 'cast', desc: 'Đá tảng rơi rải khắp một vùng rộng: mỗi tảng choáng ngắn quái trúng.' },
	// ——— GĐ3 lượt B: mốc 6 / 8 của 3 lưu phái Kiếm (bảng 3.1). Đòn thép (ăn phủ phép, Nhịp Chém, hệ số kiếm). Nối CUỐI (chỉ số 38+) ———
	// Mốc 6: một mục tiêu ngang mốc 3–5 của lưu phái nhưng thêm điều khiển / phòng thủ, MP 10, hồi 5–9s. Mốc 8: đòn mạnh nhất
	// tới giờ của lưu phái (một mục tiêu ≥ mốc 5), MP 14–18, hồi 8s.
	// Kiếm Thần 6: nhát nặng ×2,4 + phá giáp 6s (trạng thái chung: giáp −50%, nhận +15%); mục tiêu ĐANG bị phá giáp (Dung Nham,
	// kiếm phủ Thổ…) thì vỡ giáp thêm: nhận ×1,15 nữa — "phá giáp chồng phá giáp" (bảng 2.7). Hồi 6s (÷1,1 Nhịp Chém = 5,45s)
	// NGẮN HƠN phá giáp 6s: tung lại ngay khi hết hồi chiêu thì lần trước vẫn còn → tự vỡ giáp được (hồi 7s = 6,36s thì không).
	{ id: 'sunder_strike', name: 'Phá Giáp', element: 'steel', mpCost: 10, cooldown: 6, power: 2.4, kind: 'melee', range: 92, arc: 60, hit: { armor: 6, sunder: 6, knock: 25 }, anim: 'attack', desc: 'Bổ một nhát nặng làm vỡ giáp: quái trúng chịu đòn nặng hơn một lúc; quái đang bị phá giáp thì vỡ giáp thêm.' },
	// Kiếm Thần 8: luồng kiếm bay 440px, xuyên mọi quái, ×3,0 (1,25 lần Đột Kích) — đòn xa của lối tấn công.
	{ id: 'blade_wave', name: 'Lưỡi Sóng', element: 'steel', mpCost: 18, cooldown: 8, power: 3, kind: 'projectile', speed: 560, range: 440, width: 30, pierce: true, anim: 'attack', desc: 'Vung kiếm phóng một luồng kiếm bay xa, xuyên mọi quái trên đường.' },
	// Thủy Thần 6: gạt đạn 2,5s — đạn quái tới gần bị chém bay ngược về kẻ bắn ×2,0 (khuôn khiên của Gương Băng, bản kiếm).
	{ id: 'backflow', name: 'Dòng Chảy Ngược', element: 'steel', mpCost: 10, cooldown: 8, power: 2, kind: 'ward', duration: 2.5, radius: 56, anim: 'attack', desc: 'Giữ kiếm gạt đạn một lúc: đạn quái bay tới gần bị chém bay ngược về kẻ bắn.' },
	// Thủy Thần 8: xoay chém quanh mình ×1,9, đẩy lùi; vừa đỡ / gạt / phản đòn (trong 2,5s) thì ×1,8 (≈3,4) và đẩy xa hơn.
	{ id: 'whirlpool', name: 'Xoáy Nước', element: 'steel', mpCost: 14, cooldown: 8, power: 1.9, kind: 'spin', radius: 110, afterGuard: 1.8, hit: { knock: 60 }, anim: 'attack', desc: 'Xoay kiếm chém một vòng, đẩy lùi quái quanh mình; tung ngay sau khi đỡ đòn thì mạnh hơn hẳn.' },
	// Bắc Thần 6: chuỗi 4 nhát ×0,8 cách nhau 0,09s (3,2 một mục tiêu) — mỗi nhát tính riêng (phủ Thổ: nhát thứ 3 choáng).
	{ id: 'chain_slash', name: 'Liên Hoàn', element: 'steel', mpCost: 10, cooldown: 5, power: 0.8, kind: 'melee', range: 80, arc: 65, count: 4, stagger: 0.09, anim: 'attack', desc: 'Chuỗi bốn nhát chém thật nhanh về phía trước.' },
	// Bắc Thần 8: kiếm bay 320px xuyên hàng quái rồi bay về tay; ×1,8 mỗi lượt (đứng giữa đường: 3,6 cả đi lẫn về).
	{ id: 'flying_sword', name: 'Phi Kiếm', element: 'steel', mpCost: 18, cooldown: 8, power: 1.8, kind: 'projectile', speed: 640, range: 320, width: 26, pierce: true, returns: true, anim: 'attack', desc: 'Phóng kiếm bay xuyên hàng quái rồi bay về tay — quái trên đường trúng cả lúc đi lẫn lúc về.' },
];

export type HeroPath = 'sword' | 'mage';

/**
 * Kỹ năng thuộc nhánh kiếm (còn lại — trừ Hồi Phục — là phép). Lướt (`dash`) KHÔNG tự tính là kiếm: Lướt Gió là phép
 * Phong — đòn lướt của Kiếm (Đột Kích, Lướt Chém) mang hệ `steel`. Kiếm pháp nguyên tố (`blade`) cũng là đòn kiếm.
 */
export function isSwordSkill(s: SkillDef): boolean {
	return s.element === 'steel' || s.kind === 'melee' || s.kind === 'spin' || !!s.blade;
}

/** Kiểu đòn cần ĐIỂM nhắm trên mặt đất (không chỉ hướng): không có chuột thì đặt trước mặt ở `aimDist`. Vòi Rồng (`move`) chỉ cần hướng. */
export function isGroundTarget(s: Pick<SkillDef, 'kind' | 'follow' | 'move'>): boolean {
	return s.kind === 'aoe_target' || s.kind === 'pillar' || s.kind === 'wall' || s.kind === 'barrage' || (s.kind === 'zone' && !s.follow && !s.move);
}

const num = (n: number) => String(Number(n.toFixed(2))).replace('.', ',');

/** Kiểu đòn + khống chế thành chữ cho tooltip / bảng Tiềm năng ("Vùng quanh mình · bán kính 110 · đẩy lùi 50"). */
export function skillFacts(s: SkillDef): string[] {
	const out: string[] = [];
	switch (s.kind) {
		case 'aoe_self':
			out.push(`Vùng quanh mình, bán kính ${s.radius}`);
			break;
		case 'aoe_target':
			out.push(s.fall ? `Rơi từ trời xuống chỗ nhắm (tầm ${s.range}) sau ${num(s.delay ?? 0)}s, bán kính ${s.radius}` : `Vùng tại chỗ nhắm (tầm ${s.range}), bán kính ${s.radius}`);
			break;
		case 'pillar':
			out.push(`Trồi tại chỗ nhắm (tầm ${s.range}) sau ${num(s.delay ?? 0)}s, bán kính ${s.radius}`);
			break;
		case 'cone':
			out.push(`Hình nón ${(s.angle ?? 0) * 2}°, dài ${s.range}`);
			break;
		case 'line':
			out.push(`Đường thẳng dài ${s.range}, rộng ${(s.width ?? 0) * 2}`);
			break;
		case 'dash':
			out.push(`Lướt ${s.range}, không trúng đòn ${num(s.iframes ?? 0)}s${s.trail ? ', vệt chém dọc đường' : s.power > 0 ? ', chém quái đi qua' : ''}`);
			break;
		case 'zone': {
			const ticks = Math.round((s.duration ?? 0) / (s.tick ?? 1));
			const dur = num(s.duration ?? 0);
			if (s.rain) out.push(`Mưa ${dur}s tại chỗ nhắm (tầm ${s.range}), bán kính ${s.radius}: quái trong vùng ướt liên tục`);
			else if (s.bolts) out.push(`Mây giông ${dur}s tại chỗ nhắm (tầm ${s.range}), bán kính ${s.radius}, ${ticks} nhịp × ${THUNDER.bolts} tia sét (${THUNDER.rainBolts} nếu mây trong mưa của mình), ưu tiên quái ướt`);
			else if (s.move) out.push(`Lốc đi theo hướng nhắm ${Math.round(s.move * (s.duration ?? 0))}px trong ${dur}s, bán kính ${s.radius}, ${ticks} nhịp, cuốn quái theo`);
			else out.push(`${s.follow ? 'Quanh mình' : 'Vùng'} ${dur}s${s.follow ? '' : ' tại chỗ nhắm'}, bán kính ${s.radius}, ${ticks} nhịp${s.pull ? ', hút quái' : ''}`);
			break;
		}
		case 'wall':
			out.push(`Tường dài ${(s.width ?? 0) * 2} tại chỗ nhắm (tầm ${s.range}), đứng ${num(s.duration ?? 0)}s: chặn quái đi qua + chặn đạn quái${s.tick ? ', đốt quái áp sát' : ''}`);
			break;
		case 'ward':
			out.push(
				s.element === 'steel'
					? `Gạt đạn ${num(s.duration ?? 0)}s: đạn quái bay tới gần bị chém bay ngược về kẻ bắn`
					: `Khiên ${num(s.duration ?? 0)}s quanh mình: phản đạn quái về kẻ bắn`,
			);
			break;
		case 'spin':
			out.push(`Xoay chém quanh mình, bán kính ${s.radius}`);
			// "mạnh thêm" chứ không "uy lực": cuối dòng đã có "uy lực ×1,9" của nhát thường — hai chữ "uy lực" đọc như mâu thuẫn.
			if (s.afterGuard) out.push(`vừa đỡ / gạt / phản đòn (trong ${num(COUNTER.after)}s): mạnh thêm ×${num(s.afterGuard)}`);
			break;
		case 'barrage':
			out.push(`${s.count} viên rơi rải trong ${num(s.duration ?? 0)}s khắp vùng bán kính ${s.radius} tại chỗ nhắm (tầm ${s.range}), mỗi viên bán kính ${s.width}`);
			break;
		case 'melee':
			// Trảm giữ tooltip cũ (không ghi gì): chỉ đòn chém có góc / dồn lực / nhiều nhát riêng mới cần nói.
			if ((s.count ?? 1) > 1) out.push(`Chuỗi ${s.count} nhát chém, tầm ${s.range}${s.arc ? `, góc ${s.arc * 2}°` : ''}`);
			else if (s.arc || s.charge) out.push(`Chém trước mặt, tầm ${s.range}${s.arc ? `, góc ${s.arc * 2}°` : ''}${s.charge ? `, dồn lực ${num(s.charge)}s` : ''}`);
			break;
		case 'guard':
			out.push(
				s.guard === 'parry'
					? `Cửa sổ đỡ ${num(s.duration ?? 0)}s: hoá giải một đòn (cả đạn) rồi phản`
					: `Giữ thế ${num(s.duration ?? 0)}s: chặn + phản đòn cận chiến, đạn/đòn vùng còn ${Math.round(GUARD.shot * 100)}%`,
			);
			break;
		case 'blink':
			out.push(`Ra sau lưng mục tiêu trong tầm ${s.range} rồi chém`);
			break;
		case 'projectile':
			if ((s.count ?? 1) > 1) out.push(`${s.count} lưỡi toả quạt ${(s.spread ?? 0) * ((s.count ?? 1) - 1)}°, bắn xa ${s.range}${s.pierce ? ', xuyên mục tiêu' : ''}`);
			else if (s.returns) out.push(`Phóng kiếm bay xa ${s.range}, xuyên mục tiêu rồi bay về tay (mỗi chiều trúng mỗi quái một lần)`);
			else if (s.element === 'steel') out.push(`Luồng kiếm bay xa ${s.range}${s.pierce ? ', xuyên mục tiêu' : ''}`);
			else out.push(`Bắn xa ${s.range}${s.pierce ? ', xuyên mục tiêu' : ''}`);
			break;
		default:
			break;
	}
	const h = s.hit;
	if (h?.knock) out.push(`đẩy lùi ${h.knock}`);
	if (h?.stun) out.push(`choáng ${num(h.stun)}s`);
	if (h?.launch) out.push(`hất ${num(h.launch)}s`);
	if (h?.freeze) out.push(`đóng băng ${num(h.freeze)}s`);
	if (h?.freezeChilled) out.push(`đóng băng ${num(h.freezeChilled)}s mục tiêu ướt/lạnh`);
	if (h?.drain) out.push(`hút máu ${Math.round(h.drain * 100)}%`);
	if (h?.armor) out.push(`phá giáp ${num(h.armor)}s`);
	if (h?.sunder) out.push(`quái đang bị phá giáp: vỡ giáp ${num(h.sunder)}s (nhận thêm ${Math.round((SUNDER_TAKEN - 1) * 100)}%)`);
	if (s.crit) out.push(s.crit >= 1 ? 'chắc chắn chí mạng' : `+${Math.round(s.crit * 100)}% chí mạng`);
	return out;
}

/** Uy lực ghi trên bảng Tiềm năng theo kiểu đòn ("uy lực ×0,25 mỗi nhịp đốt", "hồi 35% máu tối đa"…). */
export function powerText(s: SkillDef): string {
	const p = num(s.power);
	switch (s.kind) {
		case 'heal':
			return `hồi ${Math.round(s.power * 100)}% máu tối đa`;
		case 'guard':
			return `phản đòn ×${p}`;
		case 'ward':
			return `đạn phản ×${p}`;
		case 'zone':
			return s.rain ? 'không gây sát thương' : s.bolts ? `uy lực ×${p} mỗi tia sét` : `uy lực ×${p} mỗi nhịp`;
		case 'wall':
			return s.tick ? `uy lực ×${p} mỗi nhịp đốt` : `uy lực ×${p} lúc đá trồi`;
		case 'barrage':
			return `uy lực ×${p} mỗi viên`;
		case 'projectile':
			return (s.count ?? 1) > 1 ? `uy lực ×${p} mỗi lưỡi` : s.returns ? `uy lực ×${p} mỗi lượt (đi + về)` : `uy lực ×${p}`;
		case 'melee':
			return (s.count ?? 1) > 1 ? `uy lực ×${p} mỗi nhát` : `uy lực ×${p}`;
		default:
			return `uy lực ×${p}`;
	}
}

/** Ước lượng sát thương cho tooltip thanh kỹ năng — `hit` = sát thương MỘT đòn / nhịp / tia / viên ở chỉ số hiện tại. */
export function estimateText(s: SkillDef, hit: number): string {
	const ticks = Math.round((s.duration ?? 0) / (s.tick ?? 1));
	switch (s.kind) {
		case 'zone':
			return s.rain ? 'làm ướt, không gây sát thương' : s.bolts ? `≈ ${hit} mỗi tia × ${ticks} nhịp` : `≈ ${hit} mỗi nhịp × ${ticks}`;
		case 'guard':
			return `phản đòn ≈ ${hit}`;
		case 'ward':
			return `đạn phản ≈ ${hit}`;
		case 'wall':
			return s.tick ? `≈ ${hit} mỗi nhịp đốt × ${ticks}` : `≈ ${hit} lúc đá trồi`;
		case 'barrage':
			return `≈ ${hit} mỗi viên × ${s.count}`;
		case 'melee':
			return (s.count ?? 1) > 1 ? `≈ ${hit} mỗi nhát × ${s.count}` : `≈ ${hit} sát thương`;
		case 'spin':
			return s.afterGuard ? `≈ ${hit} sát thương (vừa đỡ đòn: ≈ ${Math.round(hit * s.afterGuard)})` : `≈ ${hit} sát thương`;
		default:
			return (s.count ?? 1) > 1 ? `≈ ${hit} mỗi lưỡi × ${s.count}` : s.returns ? `≈ ${hit} mỗi lượt × 2 (đi + về)` : `≈ ${hit} sát thương`;
	}
}

/**
 * Con đường chọn năm 16 tuổi: mạnh kiếm thì yếu phép, mạnh phép thì yếu kiếm (chủ dự án, 06/10/2026).
 * Chưa chọn (tuổi thơ) = cân bằng. `hp/mp/atk/def`: gốc + mỗi cấp.
 */
export const PATHS: Record<HeroPath | 'none', { name: string; sword: number; magic: number; hp: [number, number]; mp: [number, number]; atk: [number, number]; def: [number, number] }> = {
	none: { name: '', sword: 1, magic: 1, hp: [115, 14], mp: [60, 6], atk: [16, 3], def: [4, 1] },
	sword: { name: 'Kiếm sĩ', sword: 1.35, magic: 0.65, hp: [130, 16], mp: [45, 4], atk: [17, 3], def: [6, 1] },
	mage: { name: 'Pháp sư', sword: 0.65, magic: 1.35, hp: [100, 12], mp: [70, 8], atk: [15, 3], def: [3, 1] },
};

export interface EnemyStats {
	hp: number;
	atk: number;
	def: number;
	speed: number;
	aggro: number;
	reach: number;
	attackCd: number;
	ranged?: 'arrow' | 'shadow';
	exp: number;
	coins: number;
}

/**
 * Chỉ số theo nhân vật. Nấm rừng cân cho người chơi cấp 1–2 (8 tuổi). Quái từ 16 tuổi (Nghĩa địa, Vách Gargoyle,
 * Đồi Xương) cân cho cấp 3–5: tới đó người chơi đã có ~180 EXP tuổi thơ + 480 EXP nhiệm vụ tuổi 16 + EXP diệt quái
 * (≈ cấp 2–3 lúc vừa sang 16 tuổi, cấp 3–4 sau hai nhiệm vụ đầu, cấp 5 sau Quỷ vương). Mục tiêu: một đòn của quái 16+ ăn ~8–15% máu người
 * chơi cấp 4 (nấm chỉ ~2%), cả bầy dí vào mới nguy; không đòn thường nào quá ~20% máu kể cả Pháp sư cấp 3.
 */
export const ENEMY_STATS: Record<string, EnemyStats> = {
	mob_mushroom_001: { hp: 60, atk: 7, def: 1, speed: 46, aggro: 170, reach: 34, attackCd: 1.4, exp: 14, coins: 3 },
	// Xác sống: trâu, chậm — đánh đau nhưng chạy vòng được.
	mob_zombie_001: { hp: 200, atk: 17, def: 4, speed: 38, aggro: 190, reach: 36, attackCd: 1.7, exp: 40, coins: 8 },
	// Gargoyle: da đá (giáp cao), nhanh — khó nhất trong ba loại.
	mob_gargoyle_001: { hp: 240, atk: 20, def: 8, speed: 58, aggro: 210, reach: 38, attackCd: 1.5, exp: 55, coins: 11 },
	// Cung xương: giòn nhưng bắn từ xa, đứng ngoài tầm kiếm.
	mob_skeleton_archer_001: { hp: 140, atk: 16, def: 3, speed: 44, aggro: 290, reach: 240, attackCd: 2, ranged: 'arrow', exp: 42, coins: 9 },
	boss_demon_001: { hp: 950, atk: 20, def: 6, speed: 64, aggro: 330, reach: 46, attackCd: 1.3, ranged: 'shadow', exp: 300, coins: 120 },
	// Vua Lich (boss vùng hầm mộ Nghĩa địa, hồi sinh ~3 phút): trâu hơn Quỷ vương, đi chậm, đạn bóng tối đau hơn một chút.
	boss_lich_001: { hp: 1200, atk: 22, def: 7, speed: 52, aggro: 340, reach: 48, attackCd: 1.4, ranged: 'shadow', exp: 360, coins: 140 },
};

/**
 * Cấp + EXP từ bản lưu: cấp kẹp 1–`maxLevel`; EXP không vượt mức cần của cấp đó (bản lưu của đường EXP cũ có thể "thừa" EXP
 * với đường mới — giữ ở sát mốc lên cấp, không tự nhảy nhiều cấp, không ai tụt cấp); cấp tối đa thì EXP = 0.
 */
export function cleanLevel(level: number, exp: number, maxLevel: number): { level: number; exp: number } {
	const lv = Math.min(maxLevel, Math.max(1, Math.floor(Number(level) || 1)));
	if (lv >= maxLevel) return { level: lv, exp: 0 };
	return { level: lv, exp: Math.min(expForLevel(lv) - 1, Math.max(0, Math.floor(Number(exp) || 0))) };
}

/** Tới cấp này giữ đường EXP cũ (×1,5 mỗi cấp) — vùng 1 cân theo nó, bản lưu cũ không bị xáo tiến độ. */
export const EXP_CURVE_KNEE = 10;
/**
 * EXP để lên từ cấp `level` lên cấp kế. Cấp ≤ 10: `100 × 1,5^(cấp−1)` như cũ (cấp 10 = 3.844). Trên 10: đường mềm
 * `3.844 × (cấp/10)^2,6` (cấp 20 ≈ 23.300, cấp 50 ≈ 252.000, cấp 99 ≈ 1,5 triệu) — đường cũ tới cấp 100 là ~10^19, không dùng
 * được. Quái mỗi vùng sau cho EXP cao hơn nên số quái phải hạ mỗi cấp vẫn tương đương.
 */
export function expForLevel(level: number): number {
	const lv = Math.max(1, Math.floor(level));
	if (lv <= EXP_CURVE_KNEE) return Math.round(100 * 1.5 ** (lv - 1));
	return Math.round(100 * 1.5 ** (EXP_CURVE_KNEE - 1) * (lv / EXP_CURVE_KNEE) ** 2.6);
}

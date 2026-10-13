import { expForLevel } from '../skills.ts';
import type { Line, NpcDef, QuestDef } from './storyTypes.ts';

/**
 * Mạch chính vùng 1 (thần) + vùng 2–7 (chủ dự án 11/10/2026: "update nhiệm vụ, cốt truyện… mỗi vùng sẽ có 1 vị thần"). Bám bản nháp
 * `docs/cot-truyen-aether.md` (chương 2–7, map + boss trùng tên map thật) nhưng CHỈ mạch chính: các lựa chọn rẽ nhánh, ai sống ai chết
 * và nhiệm vụ phụ còn chờ chủ dự án duyệt (mục "Cần duyệt") nên lời thoại để ngỏ ở những chỗ đó. Mỗi vùng 8 nhiệm vụ: tới trạm gặp
 * người giao việc → 3 bầy quái theo map (30 con mỗi bầy — chủ dự án 11/10/2026: "cần tăng số quái cần farm nhiệm vụ"; mỗi bầy một mảnh chuyện) → 2 boss khu → boss chúa → gặp THẦN của vùng ở thánh địa
 * (`docs/cot-truyen-aether.md` mục "Mười vị thần đất": thần không chỉ đường, chỉ tỉnh khi boss chúa gục, trao giao kèo có giá).
 * Hình tạm: người giao việc mượn sprite NPC vùng 1, thần là tượng đá có sẵn của vùng — kế hoạch vẽ ghi ở `docs/pixellab-ke-hoach-ve.md`.
 * Người chỉ NÓI (Nyra, Zahra, Kael…) khai NPC không chỗ đứng (`at.spot` không map nào có) để hộp thoại có tên.
 */

const L = (speaker: string, text: string): Line => ({ speaker, text });

/** EXP thưởng = phần của một cấp tại cấp đó (theo đường cong `expForLevel`) — giữ nhịp ~2 cấp / vùng từ nhiệm vụ. */
const xp = (level: number, part: number): number => Math.round(expForLevel(level) * part);

/** NPC chỉ để hiện tên trong hộp thoại (không đứng ở map nào). */
const voice = (name: string, title: string): NpcDef => ({ name, title, sprite: null, at: { spot: '__voice__' }, ages: [99, 99], idle: [] });

/** Người giao việc đứng ở quảng trường trạm của vùng (lệch khỏi Bram / Sein / Sera / cột dịch chuyển). */
const elder = (region: string, name: string, title: string, sprite: string, idle: string[]): NpcDef => ({
	name,
	title,
	sprite,
	at: { spot: 'plaza', dx: 130, dy: 70 },
	ages: [16, 99],
	region,
	idle,
});

/** Thần của vùng: tượng đá (hình tạm) đứng phía nam sân boss chúa trong thánh địa. */
const god = (region: string, name: string, title: string, prop: string, spot: string, idle: string[]): NpcDef => ({
	name,
	title,
	sprite: null,
	prop,
	at: { spot, dy: 120 },
	ages: [16, 99],
	region,
	idle,
});

export const CHAPTER_NPCS: Record<string, NpcDef> = {
	nyra: voice('Nyra', 'Thầy thuốc đầm lầy'),
	odessa: voice('Odessa', 'Phù thuỷ đầm'),
	zahra: voice('Zahra', 'Thủ lĩnh phe nổi dậy'),
	hassim: voice('Hassim', 'Tể tướng Sahrin'),
	orrin: voice('Orrin', 'Pháp sư gió'),
	wenna: voice('Bà Wenna', 'Chủ cối xay'),
	kael: voice('Kael', 'Thợ săn Tuyết Phong'),
	hilde: voice('Hilde', 'Nữ vương rèn Đe Đỏ'),
	durin: voice('Durin', 'Em trai nữ vương'),
	grey_man: voice('Người áo xám', '???'),
	maris: voice('Maris', 'Công chúa người cá'),
	corvin: voice('Corvin', 'Thuyền trưởng Hải Âu Bạc'),

	ysolde: elder('swamp', 'Bà Ysolde', 'Trưởng làng Lau Xám', 'npc_ysolde_001', [
		'Sương hôm nay đặc. Đặc như hồi đập mới xây.',
		'Trà trong ấm còn. Uống đi rồi hẵng nói chuyện người Rowanmere.',
	]),
	amira: elder('desert', 'Nữ hoàng Amira', 'Ốc đảo Sahrin', 'npc_elin_001', [
		'Nước trong giếng hoàng gia mỗi tuần thấp thêm một gang. Ta đếm từng gang.',
		'Ở Sahrin, khách là người được uống trước. Cậu đã uống chưa?',
	]),
	aldric_hl: elder('highland', 'Aldric', 'Hiệp sĩ Đoàn · Cao nguyên', 'npc_aldric_001', [
		'Huy hiệu bảy vòng nặng hơn tớ tưởng. Mà cũng có thể là tớ nhẹ đi.',
		'Lời ngoéo tay năm tám tuổi vẫn còn nhé, Lior.',
	]),
	bjorn: elder('tundra', 'Bjorn', 'Thợ săn già Tuyết Phong', 'npc_garrick_001', [
		'Đọc gió trước, rồi mới đọc dấu chân. Ai dạy cậu thế? Hừm. Người đó biết việc.',
		'Bão chưa tan. Ở lại thêm một đêm cũng chẳng chết ai.',
	]),
	mirelle_forge: elder('volcano', 'Mirelle', 'Thầy thuốc · trạm thương binh Đe Đỏ', 'npc_mirelle_001', [
		'Ở đây ta băng cho cả lính hai phe. Máu thì cùng một màu, Lior.',
		'Đừng khoe vội. Câu đó ta nói từ hồi con sáu tuổi, giờ vẫn đúng.',
	]),
	coral: elder('isles', 'Mẹ Coral', 'Bếp lửa làng chài San Hô', 'npc_elin_001', [
		'Ăn đi rồi khóc. Đói thì khóc không ra hơi.',
		'Biển trong tới mức thấy đáy. Mà đáy toàn tàu, con ạ.',
	]),

	god_nereth: god('swamp', 'Thuỷ Thần Nereth', 'Rắn trắng giữ dòng nước ngầm', 'serpent_head', 'hydralake_lair', [
		'«…nước nhớ mọi thứ chảy qua nó.»',
	]),
	god_sahra: god('desert', 'Thái Dương Thần Sahra', 'Chim ưng lửa mặt trời', 'sphinx', 'devourpit_lair', ['«Dưới nắng, bóng của ngươi không biết nói dối.»']),
	god_aeolin: god('highland', 'Phong Thần Aeolin', 'Đại bàng bốn cánh gió', 'bird_statue', 'cloudtemple_lair', ['«Gió không giữ lời hứa. Gió mang lời hứa đi.»']),
	god_hjalma: god('tundra', 'Băng Thần Hjalma', 'Sói mẹ của mùa đông', 'dragon_relief', 'icethrone_lair', ['«Quên cũng là một cách giữ ấm.»']),
	god_ignar: god('volcano', 'Lò Thần Ignar', 'Người thợ rèn lửa đầu tiên', 'forge_altar', 'volcanocore_lair', ['«Lửa trong lò, lửa trong lòng. Đừng để cái nào tắt.»']),
	god_thalassa: god('isles', 'Hải Mẫu Thalassa', 'Cá voi mang rạn san hô', 'giant_clam', 'krakenabyss_lair', ['«Biển trả lại mọi thứ. Chỉ là không theo thứ tự ngươi muốn.»']),
};

/** Một nhiệm vụ hạ quái / boss (đếm theo loại quái, ở bất cứ đâu). */
const hunt = (
	id: string,
	title: string,
	monster: string,
	count: number,
	objectiveText: string,
	o: { giver?: string | null; turnIn?: string; level: number; part: number; coins?: number; potions?: number; before: Line[]; after: Line[]; onReady?: Line[]; progress?: Line[] },
): QuestDef => ({
	id,
	age: 16,
	title,
	giver: o.giver ?? null,
	objective: { type: 'kill', monster, count },
	objectiveText: count > 1 ? `${objectiveText} ({n}/{total})` : objectiveText,
	turnIn: o.turnIn ?? 'auto',
	reward: { exp: xp(o.level, o.part), ...(o.coins ? { coins: o.coins } : {}), ...(o.potions ? { potions: o.potions } : {}) },
	before: o.before,
	after: o.after,
	...(o.onReady ? { onReady: o.onReady } : {}),
	...(o.progress ? { progress: o.progress } : {}),
});

const talk = (id: string, title: string, npc: string, objectiveText: string, o: { level: number; part: number; coins?: number; potions?: number; before: Line[]; after: Line[] }): QuestDef => ({
	id,
	age: 16,
	title,
	giver: null,
	objective: { type: 'talk', npc },
	objectiveText,
	turnIn: npc,
	reward: { exp: xp(o.level, o.part), ...(o.coins ? { coins: o.coins } : {}), ...(o.potions ? { potions: o.potions } : {}) },
	before: o.before,
	after: o.after,
});

// ———————————————————————————— Vùng 1 · thần Verdea (sau Quỷ vương) ————————————————————————————

const CH1: QuestDef[] = [
	talk('c1_verdea', 'Bàn thờ dưới rêu', 'gy_stele', 'Về bia đá cổ ở Nghĩa địa Hoàng Hôn', {
		level: 8,
		part: 0.4,
		potions: 2,
		before: [
			L('inner', 'Quỷ vương tan rồi, mà sợi đất dưới chân tôi vẫn kéo về một hướng: phía bắc, nơi tấm bia đá cổ đứng giữa nghĩa địa.'),
			L('inner', 'Lần trước tôi đặt tay lên đó, có ai đó siết lại. Lần này tôi muốn biết là ai.'),
		],
		after: [
			L('narrator', '(Rêu trên bia bong ra từng mảng. Dưới lớp rêu là hình khắc một người đàn bà tóc cỏ, váy kết bằng tổ ong. Đàn ong từ đâu bay tới, đậu kín vai tôi mà không đốt.)'),
			L('narrator', '(Một giọng nói không phát ra từ đâu cả, chỉ vang lên trong đất dưới chân.)'),
			L('inner', '«Ta là Verdea. Ba trăm năm người ta khắc ta lên đá rồi quên. Con quỷ kia giật sợi của ta để thức, nên người chết không nằm yên.»'),
			L('inner', '«Ta không bảo ngươi đi đâu. Ta chỉ hỏi: ngươi có về thắp hương cho người đã khuất mỗi mùa gặt không? Quên một mùa, ong bỏ vườn mẹ ngươi.»'),
			L('lior', 'Con hứa. Kiếp trước con lỡ hẹn với mộ ông nội cả chục năm. Kiếp này thì không.'),
			L('narrator', '(Đàn ong bay lên thành một vòng sáng rồi tan vào bia. Gặp Mẫu Thần Verdea — thần kỹ "Rễ Mẹ" sẽ mở bán ở cửa hàng kim cương.)'),
			L('inner', 'Phía tây, qua Hẻm Cửa Sông, sợi đỏ vẫn còn rỉ ra từ một vùng đầm lầy. Đồng xu của bác Bram nóng lên mỗi lần tôi nhìn về hướng đó.'),
		],
	}),
];

// ———————————————————————————— Vùng 2 · Đầm lầy Mù Sương (cấp 10–20) ————————————————————————————

const CH2: QuestDef[] = [
	talk('c2_arrive', 'Những người chết đuối dưới đập', 'ysolde', 'Sang Làng nhà sàn Lau Xám (qua Hẻm Cửa Sông, mép tây vùng 1) gặp bà Ysolde', {
		level: 10,
		part: 0.08,
		before: [
			L('inner', 'Sương ở đây có vị. Tôi nếm thấy sắt và lá mục.'),
			L('inner', 'Người lái thuyền không nói một lời từ lúc nghe giọng Rowanmere của tôi. Những thân cây chết đứng thành hàng hai bên kênh, như một hàng rào ai cắm rồi quên.'),
		],
		after: [
			L('ysolde', 'Người Rowanmere. Lâu lắm rồi mới có người Rowanmere dám bước lên nhà sàn này.'),
			L('ysolde', 'Chân cậu sưng rồi kìa. Rắn nước cắn ở bến phải không? Nyra, xem cho nó.'),
			L('nyra', 'Thuốc này đắng như sự thật. Uống hết, đừng nhăn mặt, tôi không có thời gian dỗ người Rowanmere.'),
			L('inner', 'Đắng thật. Nhưng sợi xanh lục quanh vết cắn thẳng lại ngay, như ai vuốt một mớ tóc rối.'),
			L('ysolde', 'Muốn ở lại thì làm việc. Ếch độc tràn lên bãi lau, nước mỗi năm một dâng. Đi đi, rồi về đây uống trà.'),
		],
	}),
	hunt('c2_frogs', 'Cột mốc khắc hươu', 'mob_poison_frog_001', 30, 'Hạ ếch độc ở Bãi Lau Sậy', {
		giver: 'ysolde',
		turnIn: 'ysolde',
		level: 11,
		part: 0.2,
		coins: 120,
		before: [
			L('ysolde', 'Bãi Lau Sậy ở ngay phía nam làng. Ếch độc đẻ khắp nơi từ khi nước dâng. Diệt bớt cho dân còn ra cắt lau.'),
			L('ysolde', 'Giữa lau có mấy cột mốc gỗ cũ. Đừng đốt. Đó là thứ duy nhất còn lại của đội đắp đập.'),
		],
		progress: [L('ysolde', 'Ếch vẫn kêu ngoài bãi. Tai già này đếm được.')],
		onReady: [
			L('narrator', '(Cột mốc gỗ mục gần hết, chỉ còn một hình khắc rõ: một con hươu đang ngoảnh lại.)'),
			L('inner', 'Con hươu này tôi thấy mỗi sáng suốt mười sáu năm. Trên khung cửa nhà tôi, cạnh những vạch cha khắc chiều cao của tôi.'),
		],
		after: [
			L('ysolde', 'Dấu con hươu à? Thợ săn nào chẳng khắc dấu của mình.'),
			L('father_garrick', '…Ừ. Dấu thợ săn. Ai cũng khắc vậy.'),
			L('inner', 'Cha tới từ lúc nào, tôi không biết. Cha nói dối. Sợi chỉ nối cha với cái cột mốc ngoài kia rung lên như dây đàn bị ai gảy.'),
			L('ysolde', '(Bà nhìn cha tôi rất lâu, rồi rót cho ông chén trà cuối cùng còn trong ấm.)'),
		],
	}),
	hunt('c2_roofs', 'Đèn cho mái nhà chìm', 'mob_glow_mushroom_001', 30, 'Dọn nấm phát quang ở Rừng Ngập Nấm', {
		level: 12,
		part: 0.22,
		before: [
			L('nyra', 'Đi với tôi một đoạn. Không phải vì tôi tin cậu. Vì nấm ở đó cắn người, mà cậu thì cắn lại được.'),
			L('inner', 'Nấm phát quang mọc trên những mái nhà nhô lên khỏi mặt nước. Cả một ngôi làng nằm dưới chân chúng tôi.'),
		],
		after: [
			L('nyra', 'Mái nhà kia là nhà tôi. Năm tôi bốn tuổi, đập vỡ. Mẹ ôm tôi trèo lên cây. Cha tôi quay lại cứu con bò.'),
			L('nyra', 'Con bò sống. Cha tôi thì không. Buồn cười không?'),
			L('inner', 'Không buồn cười. Phía sau tôi, cha đứng im, tay siết cán dao đến trắng khớp. Tôi không dám quay lại nhìn mặt cha.'),
			L('narrator', '(Nyra cắm một cây nấm phát quang lên mái nhà, làm đèn cho mộ.)'),
		],
	}),
	hunt('c2_journal', 'Chữ ký "Đ."', 'mob_water_snake_001', 30, 'Hạ rắn nước quanh xác thuyền ở Đầm Rắn Nước', {
		turnIn: 'ysolde',
		level: 13,
		part: 0.22,
		coins: 150,
		before: [L('inner', 'Rắn nước tụ quanh một xác thuyền lớn mắc cạn giữa đầm. Trên mạn thuyền vẫn còn vết sơn của đội đắp đập.')],
		onReady: [
			L('narrator', '(Trong hòm thuyền có một cuốn nhật ký ngấm nước. Trang gần cuối: "Trinh sát G. dẫn lối an toàn qua đầm. Làng phía dưới đã được báo.")'),
			L('inner', 'Làng chưa từng được báo. Nyra kể rồi.'),
			L('narrator', '(Trang cuối có một chữ ký khác, nét lạ, viết bằng thứ chữ tôi chưa thấy ở thế giới này: "Đ.")'),
			L('inner', 'Không phải chữ của thế giới này. Là chữ của thế giới cũ. Chữ của tôi.'),
		],
		after: [
			L('ysolde', 'Trinh sát G… Ta biết từ lâu rồi, cậu bé. Ấm trà của ta có khắc con hươu dưới đáy. Một đêm trước khi đập xây xong, có người uống trà trong nhà ta.'),
			L('ysolde', 'Ta không đòi ai quỳ. Ta chỉ muốn người đó nói ra một lần, trước mặt đứa con gái mất cha.'),
			L('inner', '"Để sau" là câu cả đời trước tôi hay nói nhất. Nhìn cha lúc này, tôi biết nó là câu của ai.'),
		],
	}),
	hunt('c2_mother_frog', 'Cửa cống Kênh Đỉa', 'boss_mother_frog_001', 1, 'Mở cống: hạ Mẹ Ếch ở Kênh Đỉa', {
		level: 16,
		part: 0.35,
		potions: 2,
		before: [
			L('nyra', 'Kênh Đỉa do Đoàn đào để dẫn nước về Mối. Mẹ Ếch đẻ trứng ngay trong cống, ai lại gần là nó phun độc.'),
			L('nyra', 'Nó chỉ giữ trứng thôi. Nhưng cống không mở thì nước không rút, làng tôi chìm thêm một tấc mỗi mùa.'),
		],
		after: [
			L('narrator', '(Cửa cống kẽo kẹt mở ra. Nước bùn chảy xiết về phía Hồ Hydra.)'),
			L('nyra', 'Cậu dời mấy ổ trứng ra mép đầm trước khi đánh. Tôi thấy rồi.'),
			L('nyra', '…Người Rowanmere mà cũng biết thương con ếch.'),
		],
	}),
	hunt('c2_witch', 'Kẻ khắc hươu', 'boss_swamp_witch_001', 1, 'Vượt sương, gặp Phù thuỷ đầm ở Vực Sương Xanh', {
		level: 20,
		part: 0.35,
		coins: 300,
		before: [
			L('inner', 'Sương ở Vực Sương Xanh dày tới mức tôi không thấy tay mình. Nhưng sợi Aether thì vẫn thấy. Tôi đi theo sợi.'),
			L('odessa', 'Người Rowanmere. Và… kẻ khắc hươu. Hai mươi năm, cuối cùng mi cũng dám bước vào sương của ta.'),
			L('father_garrick', 'Odessa. Tôi—'),
			L('odessa', 'Im! Mi nói câu đó muộn hai mươi năm rồi.'),
		],
		after: [
			L('odessa', 'Ta giữ sương để quái không vào làng. Ta nuôi Hydra để một ngày trả thù Rowanmere. Hai việc đó ta làm bằng cùng một đôi tay.'),
			L('odessa', 'Ngươi thắng. Vậy xin ngươi một điều: đừng để con bé đi theo người Rowanmere.'),
			L('nyra', 'Mẹ…'),
			L('inner', 'Cha bước lên một bước, rồi đứng lại. Chuyện này chưa xong. Nó chỉ vừa bắt đầu.'),
		],
	}),
	hunt('c2_hydra', 'Hồ Hydra', 'boss_mud_hydra_001', 1, 'Hạ Hydra bùn ở Hồ Hydra', {
		level: 20,
		part: 0.55,
		potions: 3,
		before: [
			L('inner', 'Hydra bùn lớn lên từ xác làng cũ dưới đáy hồ và từ hai mươi năm oán hận. Đầu nào bị chém cũng mọc lại.'),
			L('inner', 'Nhưng mỗi cái cổ đều có một sợi bùn nối về cửa cống. Cắt sợi trước, chém cổ sau.'),
		],
		after: [
			L('narrator', '(Hydra đổ sập. Mặt hồ rút xuống từng gang, để lộ những mái nhà phủ bùn của làng cũ.)'),
			L('narrator', '(Giữa sân bùn, một cái đầu rắn bằng đá trắng nhô lên, mắt khảm đá xanh ngọc. Sợi nước quanh nó đang chảy ngược.)'),
		],
	}),
	talk('c2_nereth', 'Thuỷ Thần Nereth', 'god_nereth', 'Tới tượng đầu rắn trắng ở Hồ Hydra', {
		level: 20,
		part: 0.4,
		coins: 500,
		before: [L('inner', 'Con đập chặn dòng nước ngầm. Hydra mọc lên từ chỗ dòng nước ấy mục ra. Vậy thì ai là chủ của dòng nước?')],
		after: [
			L('narrator', '(Tượng đá nứt dọc. Từ khe nứt, một con rắn trắng dài như con kênh trườn ra, vảy trong như sương, sừng mọc như lau sậy.)'),
			L('inner', '«Ta là Nereth. Đập của người Rowanmere chặn mạch máu của ta. Phần thân bị chặn mục ra thành con quái ngươi vừa giết.»'),
			L('inner', '«Ta không dẫn đường cho ai. Ta chỉ đổi: ta cho ngươi đi xuyên sương không bao giờ lạc. Đổi lại, mỗi lần đứng trong nước, ngươi sẽ nghe người chết đuối gọi.»'),
			L('lior', 'Con nhận. Họ đáng được có người nghe.'),
			L('narrator', '(Gặp Thuỷ Thần Nereth — thần kỹ "Sương Thuỷ Mạch" sẽ mở bán ở cửa hàng kim cương.)'),
			L('nyra', 'Tôi đi với cậu. Đừng hiểu lầm. Tôi muốn tận mắt thấy người Rowanmere trả nợ.'),
			L('narrator', '(Một con chim ưng của Đoàn thả xuống mảnh giấy có ấn đỏ: "Hiệp sĩ Aldric được phong tước. Lần sau gặp, chúng ta sẽ bàn về đồng xu.")'),
			L('inner', 'Lối tây của Vực Sương Xanh dẫn ra một biển cát đỏ. Sa mạc Hồng Cát.'),
		],
	}),
];

// ———————————————————————————— Vùng 3 · Sa mạc Hồng Cát (cấp 20–30) ————————————————————————————

const CH3: QuestDef[] = [
	talk('c3_arrive', 'Nước của nữ hoàng', 'amira', 'Sang Thành ốc đảo Sahrin (lối tây Vực Sương Xanh) yết kiến nữ hoàng Amira', {
		level: 20,
		part: 0.08,
		before: [
			L('inner', 'Ốc đảo Sahrin hiện ra như một chiếc khiên xanh giữa biển cát đỏ.'),
			L('inner', 'Bác Bram kéo khăn che mặt lên tới tận mắt. Chuyện chưa từng thấy. Ở cổng thành, lính gác đọc tên bác trong sổ, rồi đọc lại lần nữa.'),
		],
		after: [
			L('amira', 'Những người đã giết Quỷ vương. Sahrin mở tiệc đón các người, dù giếng hoàng gia mỗi tuần thấp thêm một gang.'),
			L('amira', 'Còn người thương nhân đi cùng các người… Bram. Mười lăm năm trước, đêm mẹ ông bị xử, ông đã ở đâu?'),
			L('bram', '(Bác không trả lời nữ hoàng. Lúc tiệc tan, bác nói nhỏ với tôi một câu duy nhất.) Đừng tìm Zahra.'),
			L('amira', 'Đoàn buôn nước của triều đình bị cướp ba lần trong tháng. Ta cần người đi hộ tống. Người không sợ bọ cạp.'),
		],
	}),
	hunt('c3_caravan', 'Kẻ cướp chia nước', 'mob_scorpion_001', 30, 'Hộ tống đoàn buôn nước: hạ bọ cạp ở Cồn Cát Đỏ', {
		giver: 'amira',
		turnIn: 'amira',
		level: 21,
		part: 0.2,
		coins: 300,
		before: [L('amira', 'Cồn Cát Đỏ ở ngay phía nam thành. Bọ cạp đào hang dưới đường xe. Giữ cho đoàn nước qua được.')],
		progress: [L('amira', 'Đoàn nước còn kẹt ở cồn cát. Bọ cạp không biết thương xe nước đâu.')],
		onReady: [
			L('narrator', '(Đoàn xe vừa qua cồn thì một toán người bịt mặt lao ra. Họ không đánh ai. Họ khiêng hai thùng nước đi, chia cho dân nghèo ngoài thành, từng gáo một.)'),
			L('narrator', '(Người cầm đầu là một phụ nữ đeo mặt nạ. Cô nhìn bác Bram rất lâu, rồi biến mất sau cồn cát.)'),
		],
		after: [
			L('amira', 'Mất hai thùng. Ta nghe rồi. Họ chia nước cho dân ngoài thành.'),
			L('amira', 'Ngươi biết điều tệ nhất là gì không? Ta không chắc họ sai.'),
		],
	}),
	hunt('c3_tombs', 'Cái tên bị đục', 'mob_mummy_001', 30, 'Hạ xác ướp canh Lăng Mộ Cát', {
		level: 23,
		part: 0.22,
		before: [L('inner', 'Lăng Mộ Cát là nơi chôn các vị vua đã ký Giao Ước. Xác ướp vẫn canh từng bậc thềm, ba trăm năm không ngủ.')],
		after: [
			L('narrator', '(Tường lăng khắc lời hứa: "Sahrin được một ghế trong hội đồng Bảy Mối." Ngay chỗ tên Sahrin là một vết đục.)'),
			L('inner', 'Tôi chạm vào vết đục. Sợi Aether quanh đó vẫn nhớ hình con chữ, như vết lõm trên gối còn nhớ đầu người.'),
			L('inner', 'Vết đục còn mới hơn phần đá xung quanh. Ai đó đã xoá Sahrin khỏi Giao Ước. Không phải ba trăm năm trước. Mới đây thôi.'),
		],
	}),
	hunt('c3_vultures', 'Cỗ máy "v2.1"', 'mob_vulture_001', 30, 'Đuổi kền kền ở Vách Kền Kền', {
		turnIn: 'amira',
		level: 24,
		part: 0.22,
		coins: 350,
		before: [L('inner', 'Kền kền lượn thành vòng trên Vách Kền Kền. Dưới đáy vòng tròn là một đội lính của nữ hoàng.')],
		onReady: [
			L('narrator', '(Trong túi đội trưởng có một bức thư mang ấn tể tướng Hassim, ra lệnh đưa đội đi vào chỗ không có nước.)'),
			L('narrator', '(Cạnh xác lính là một cỗ máy khoan bằng sắt, đinh tán thẳng hàng. Trên vỏ máy khắc: "v2.1".)'),
			L('inner', 'v2.1. Số phiên bản. Ở thế giới này không ai đánh số phiên bản. Trừ người từng viết phần mềm.'),
		],
		after: [
			L('amira', 'Hassim. Người ta tin như tin cái giếng.'),
			L('hassim', '(Ở cuối hành lang, tể tướng mỉm cười với tôi, rồi quay đi. Nụ cười của người đã tính trước nước đi tiếp theo.)'),
			L('amira', 'Ta không bắt được hắn khi chưa có bản Giao Ước gốc. Nó nằm trong Đền Vùi Cát, có người canh từ ba trăm năm.'),
		],
	}),
	hunt('c3_scorpion_queen', 'Em gái Bram', 'boss_scorpion_queen_001', 1, 'Tìm hang phe nổi dậy: đối mặt Bọ cạp chúa ở Hẻm Rắn', {
		level: 27,
		part: 0.35,
		potions: 2,
		before: [
			L('inner', 'Dấu xe nước dẫn về Hẻm Rắn. Ở đó có một cái giếng bí mật, và một con bọ cạp to như căn nhà nằm canh miệng giếng.'),
			L('zahra', 'Nó là thú cưỡi cũ của hoàng gia. Bị bỏ đói từ ngày triều đình bán nước. Đừng thương nó quá, nó ăn người đấy.'),
		],
		after: [
			L('narrator', '(Người phụ nữ đeo mặt nạ tháo mặt nạ ra. Đôi mắt giống hệt bác Bram.)'),
			L('zahra', 'Tôi là Zahra. Em gái của người đàn ông đang trốn sau lưng cậu.'),
			L('zahra', 'Anh ấy về muộn mười lăm năm. Đừng bắt tôi phải mừng.'),
			L('bram', '…Zahra.'),
		],
	}),
	hunt('c3_pharaoh', 'Bản Giao Ước gốc', 'boss_pharaoh_001', 1, 'Vào Đền Vùi Cát: hạ Pharaoh xác ướp', {
		level: 30,
		part: 0.35,
		coins: 600,
		before: [L('inner', 'Pharaoh là vị vua Sahrin đầu tiên ký vào Giao Ước. Người ta trói hồn ông ba trăm năm để giữ bản gốc.')],
		after: [
			L('narrator', '(Xác ướp đổ xuống như một chiếc áo rỗng. Trong lòng tay ông là một cuộn giấy da đã ố vàng: bản Giao Ước gốc, tên Sahrin còn nguyên.)'),
			L('inner', 'Ba trăm năm giữ một tờ giấy. Kiếp trước tôi còn không giữ nổi một lời hẹn ăn tối.'),
		],
	}),
	hunt('c3_sandworm', 'Hố Cát Nuốt', 'boss_sandworm_001', 1, 'Hạ Sâu cát khổng lồ ở Hố Cát Nuốt', {
		level: 30,
		part: 0.55,
		potions: 3,
		before: [
			L('inner', 'Hassim mở cống ngầm hút cạn ốc đảo. Cả thành rung lên. Sâu cát khổng lồ trồi lên từ Hố Cát Nuốt.'),
			L('inner', 'Bác Bram bị treo làm mồi trên miệng hố. Tôi không có thời gian để nói "để sau".'),
		],
		after: [
			L('narrator', '(Con sâu sụp xuống, kéo theo nửa miệng hố. Tôi kịp cắt dây cho bác Bram.)'),
			L('narrator', '(Dưới đáy hố, cát chảy thành hình một con nhân sư bằng đá, nửa thân còn vùi. Quanh nó, nắng đọng lại như mật.)'),
		],
	}),
	talk('c3_sahra', 'Thái Dương Thần Sahra', 'god_sahra', 'Tới tượng nhân sư dưới đáy Hố Cát Nuốt', {
		level: 30,
		part: 0.4,
		coins: 800,
		before: [L('inner', 'Sâu cát nuốt ánh sáng của cả sa mạc. Giờ nó chết rồi, ánh sáng ấy đi đâu?')],
		after: [
			L('narrator', '(Tượng nhân sư nứt ra. Một con chim ưng lửa bay lên, sải cánh rộng như cổng thành, lông vàng đỏ như cát lúc hoàng hôn.)'),
			L('inner', '«Ta là Sahra. Người ta đục tên Sahrin khỏi Giao Ước, rồi chôn ta dưới cát để không ai đọc lại được.»'),
			L('inner', '«Ta cho ngươi thấy mọi chữ đã bị đục. Đổi lại, ngươi không bao giờ được nói dối dưới nắng. Nói dối, bóng của ngươi sẽ bỏ đi.»'),
			L('lior', 'Con nhận. Kiếp trước con nói dối nhiều nhất bằng hai chữ "con bận".'),
			L('narrator', '(Gặp Thái Dương Thần Sahra — thần kỹ "Mặt Trời Rực" sẽ mở bán ở cửa hàng kim cương.)'),
			L('zahra', '(Ở sân thành, Zahra không tha thứ cho anh trai. Nhưng cô ném cho bác chiếc khăn của mẹ.)'),
			L('inner', 'Hassim trốn lên cao nguyên, mang theo cỗ máy hút nước. Lối tây của Đền Vùi Cát dẫn lên những ngọn đồi lộng gió.'),
		],
	}),
];

// ———————————————————————————— Vùng 4 · Cao nguyên Gió Hú (cấp 30–40) ————————————————————————————

const CH4: QuestDef[] = [
	talk('c4_arrive', 'Bạn cũ, cờ mới', 'aldric_hl', 'Lên Làng Cối Xay Gió (lối tây Đền Vùi Cát) tìm Aldric', {
		level: 30,
		part: 0.08,
		before: [
			L('inner', 'Trên cao nguyên, gió phải gào. Ở đây gió chỉ thì thào. Cánh cối xay đứng im như những cánh tay giơ lên đầu hàng.'),
			L('inner', 'Giữa đồng cỏ là ngọn tháp sắt đầu tiên tôi thấy ở thế giới này. Đinh tán thẳng hàng. Ốc vít lục giác.'),
		],
		after: [
			L('aldric_hl', 'Lior! Thằng quỷ này, cậu giết được Quỷ vương thật à?! Lại đây!'),
			L('aldric_hl', '(Cậu ôm chầm lấy tôi, rồi khựng lại khi thấy Nyra.) …Phù thuỷ đầm?'),
			L('nyra', 'Thầy thuốc. Nếu anh bị sói cắn thì sẽ biết khác nhau thế nào.'),
			L('wenna', '(Bà chủ cối xay dúi vào tay tôi túi bột mì cuối cùng, nói nhỏ khi Aldric quay đi.) Gió cạn từ ngày có cái tháp ấy. Đừng nói với hiệp sĩ là tôi nói.'),
		],
	}),
	hunt('c4_wolves', 'Lưng tựa lưng', 'mob_wind_wolf_001', 30, 'Cùng Aldric hạ sói gió ở Đồi Cỏ Cao', {
		giver: 'aldric_hl',
		turnIn: 'aldric_hl',
		level: 31,
		part: 0.2,
		coins: 450,
		before: [
			L('aldric_hl', 'Sói gió hoá điên từ khi gió yếu đi. Đồi Cỏ Cao ở phía nam làng. Như hồi tám tuổi nhé: cậu đứng sau, tớ đứng trước.'),
			L('aldric_hl', 'À không. Lần này cậu đứng trước. Cậu mạnh hơn tớ rồi.'),
		],
		progress: [L('aldric_hl', 'Còn sói trên đồi. Tớ nghe tiếng tru từ đây.')],
		after: [
			L('aldric_hl', 'Đánh lưng tựa lưng vẫn ăn ý nhỉ. Như hồi diệt "rồng" ở bìa rừng.'),
			L('aldric_hl', 'Lời ngoéo tay vẫn còn đó, Lior. Tớ vẫn đang đi đánh Quỷ vương thật đây. Chỉ là… dạo này tớ không chắc ai là Quỷ vương nữa.'),
		],
	}),
	hunt('c4_fairies', 'Chuyện của tiên già', 'mob_wind_fairy_001', 30, 'Ru ngủ tiên gió hoá điên ở Thung Lũng Tiên', {
		level: 33,
		part: 0.22,
		before: [L('inner', 'Tiên gió mất nhà vì gió cạn. Chúng hoá điên, quay như lá khô trong cơn lốc. Đánh cho chúng ngất đi là cách duy nhất để chúng ngủ.')],
		after: [
			L('narrator', '(Một tiên già, ánh sáng mờ như đom đóm cuối mùa, đậu lên vai tôi.)'),
			L('inner', '«Ba trăm năm trước có một pháp sư Lumeria tên Ostrin buộc Mối Phong. Khi đó ta còn là một đốm sáng. Tuyệt Vân, con rồng gió, giữ Mối từ đó tới giờ.»'),
			L('inner', '«Gió bây giờ không còn đi lối của Tuyệt Vân. Gió đi vào những cái tháp sắt.»'),
		],
	}),
	hunt('c4_floatstones', 'Bản vẽ của Kiến Trúc Sư', 'mob_flying_rock_001', 30, 'Hạ đá bay rơi xuống ở Bãi Đá Bay', {
		turnIn: 'aldric_hl',
		level: 34,
		part: 0.22,
		coins: 500,
		before: [L('inner', 'Gió yếu thì đá bay rơi. Nửa làng ven Bãi Đá Bay đã bị đè sập.')],
		onReady: [
			L('narrator', '(Sau tảng đá cuối cùng, tôi thấy Hassim đang lắp cỗ máy Sahrin vào chân tháp sắt. Hắn bỏ chạy, đánh rơi một cuộn bản vẽ.)'),
			L('narrator', '(Bản vẽ lắp ráp ghi người thiết kế: "Kiến Trúc Sư". Bên dưới, ô nghiệm thu có chữ ký: "Hiệp sĩ Aldric".)'),
		],
		after: [
			L('aldric_hl', 'Tớ… ký lệnh nghiệm thu. Đoàn bảo đó là tháp đo gió. Tớ không đọc kỹ.'),
			L('aldric_hl', 'Tớ không đọc kỹ, Lior. Hiệp sĩ mà không đọc kỹ.'),
			L('inner', 'Kiếp trước tôi cũng từng ký những thứ mình không đọc kỹ, vì sếp bảo "cứ ký đi, để sau tính". Tôi biết cảm giác đó. Tôi không nói ra.'),
		],
	}),
	hunt('c4_eagle', 'Ba quả trứng', 'boss_storm_eagle_001', 1, 'Leo Vách Chim Ưng: đối mặt Đại bàng bão', {
		level: 37,
		part: 0.35,
		potions: 2,
		before: [
			L('aldric_hl', 'Lệnh của Đoàn: giết đại bàng bão làm tổ trên tháp thu gió. Tớ đi với cậu tới chân vách.'),
			L('inner', 'Trên đỉnh vách, trong tổ có ba quả trứng. Đại bàng không làm tổ trên tháp vì muốn phá tháp. Nó làm tổ ở đó vì đó là chỗ duy nhất còn gió.'),
		],
		after: [
			L('narrator', '(Đại bàng bão bay vút lên mây. Ba quả trứng vẫn nằm yên trong tổ.)'),
			L('inner', 'Tôi không báo cáo với Đoàn về ba quả trứng. Aldric cũng không hỏi.'),
		],
	}),
	hunt('c4_orrin', 'Người dựng tháp', 'boss_wind_mage_001', 1, 'Gặp Pháp sư gió ở Đàn Tế Gió (Cổng Mây)', {
		level: 40,
		part: 0.35,
		coins: 900,
		before: [
			L('orrin', 'Ta là Orrin. Chính tay ta dựng những ngọn tháp ấy cho Đoàn, theo bản vẽ của Kiến Trúc Sư.'),
			L('orrin', 'Hắn nói như ra lệnh cho cả cơn gió. Ta nghe theo. Giờ ta muốn phá chúng, và Đoàn gửi một hiệp sĩ tới bắt ta.'),
			L('aldric_hl', 'Lệnh là lệnh, ông già. Lior, tránh ra.'),
		],
		after: [
			L('orrin', 'Ngươi đánh để ta còn sống mà phá tháp, hay để hiệp sĩ kia khỏi phải bắt ta? Thôi được. Kết quả như nhau.'),
			L('aldric_hl', '(Aldric tra kiếm vào vỏ.) Tớ sẽ báo là ông ta chạy mất. Lần đầu tiên tớ nói dối Đoàn.'),
		],
	}),
	hunt('c4_drake', 'Đền Trên Mây', 'boss_wind_drake_001', 1, 'Hạ Rồng gió ở Đền Trên Mây', {
		level: 40,
		part: 0.55,
		potions: 3,
		before: [L('inner', 'Rồng gió là con của Tuyệt Vân. Mối Phong bị hút, nó điên lên vì đói gió. Nó không ác. Nó chỉ đói.')],
		after: [
			L('narrator', '(Rồng gió đổ xuống thềm đền. Gió từ đâu kéo về, cuốn mây quanh một bức tượng chim đá bốn cánh ở cuối sân.)'),
		],
	}),
	talk('c4_aeolin', 'Phong Thần Aeolin', 'god_aeolin', 'Tới tượng chim bốn cánh ở Đền Trên Mây', {
		level: 40,
		part: 0.4,
		coins: 1200,
		before: [L('inner', 'Gió cuốn quanh bức tượng thành bốn luồng khác màu. Như thể nó đang thở.')],
		after: [
			L('narrator', '(Bức tượng tan thành mây. Một con đại bàng trắng bốn cánh sải ra, mỗi cánh là một luồng gió khác màu, đuôi kéo thành mây.)'),
			L('inner', '«Ta là Aeolin. Những cái tháp sắt hút gió của ta. Con rồng ngươi vừa hạ chỉ là đứa trẻ đói.»'),
			L('inner', '«Ta cho ngươi đôi giày gió. Đổi lại, ngươi thả một lời hứa đang giữ trong lòng. Gió không giữ lời hứa. Gió mang lời hứa đi.»'),
			L('inner', 'Lời ngoéo tay với Aldric nhẹ đi một nửa. Tôi vẫn nhớ, chỉ là không còn nặng như trước.'),
			L('narrator', '(Gặp Phong Thần Aeolin — thần kỹ "Cánh Bão" sẽ mở bán ở cửa hàng kim cương.)'),
			L('narrator', '(Một bức thư đến chậm ba tuần. Nét chữ nguệch ngoạc của cha, lá thư đầu tiên trong đời ông: "Mẹ ốm. Con đừng lo. Cha khắc thêm một vạch.")'),
			L('inner', 'Lối tây của Cổng Mây dẫn xuống một vùng trắng xoá. Lãnh nguyên Băng Giá. Cột dịch chuyển ở đó có thể đưa tôi về Thistlewood.'),
		],
	}),
];

// ———————————————————————————— Vùng 5 · Lãnh nguyên Băng Giá (cấp 40–50) ————————————————————————————

const CH5: QuestDef[] = [
	talk('c5_arrive', 'Bức thư đến muộn', 'bjorn', 'Xuống Làng gỗ Tuyết Phong (lối tây Cổng Mây) gặp thợ săn Bjorn', {
		level: 40,
		part: 0.08,
		before: [
			L('inner', 'Cột dịch chuyển ở làng Tuyết Phong phủ băng dày một gang tay. Tôi cạo băng bằng chuôi dao, và chữ "Thistlewood" hiện ra, sáng lên như đang gọi.'),
			L('inner', 'Thư của cha nằm trong túi áo. "Mẹ ốm. Con đừng lo." Kiếp trước tôi cũng từng nhận một tin như thế. Tôi đã nói "để sau".'),
		],
		after: [
			L('bjorn', 'Bão băng chặn hết lối ra. Trưởng làng lên hồ ba ngày chưa về. Cậu tới đúng lúc, hay sai lúc, tuỳ cậu.'),
			L('bjorn', 'Có lá thư găm trên tường quán trọ, ghi tên cậu. Không ai trong làng đọc được thứ chữ ấy.'),
			L('narrator', '(Lá thư viết bằng chữ quốc ngữ, nét gọn gàng như in: "Chào đồng hương. Cậu đi chậm hơn tôi tưởng. — Đ.")'),
			L('inner', 'Tôi đứng trước cột dịch chuyển rất lâu. Rồi tôi quay lại hỏi Bjorn: "Cần dẫn đường lên hồ phải không?"'),
		],
	}),
	hunt('c5_wolves', 'Đọc gió trước', 'mob_snow_wolf_001', 30, 'Cùng Kael hạ sói tuyết ở Rừng Thông Tuyết', {
		giver: 'bjorn',
		turnIn: 'bjorn',
		level: 41,
		part: 0.2,
		coins: 600,
		before: [
			L('bjorn', 'Sói tuyết săn theo bầy, chặn đường lên hồ. Thằng Kael đòi đi một mình. Nó mười bốn tuổi, cha nó mất trong trận bão.'),
			L('kael', 'Tôi không cần ai đi cùng. Đọc gió trước, rồi mới đọc dấu chân. Cha tôi dạy thế.'),
			L('inner', 'Cha tôi cũng dạy đúng câu đó. Có lẽ mọi người cha đi săn trên đời đều dạy con câu đó.'),
		],
		progress: [L('bjorn', 'Sói còn tru trong rừng thông. Giữ thằng Kael đừng để nó liều.')],
		after: [
			L('kael', 'Anh lăn né kiểu gì vậy? Dạy tôi đi. Không phải vì tôi cần. Vì… tôi muốn biết.'),
			L('bjorn', 'Lần đầu tiên từ trận bão, thằng bé chịu nhờ một người. Cảm ơn cậu.'),
		],
	}),
	hunt('c5_wisps', 'Người mẹ dưới mặt hồ', 'mob_ice_wisp_001', 30, 'Hạ tinh linh băng ở Hồ Sương Giá', {
		level: 43,
		part: 0.22,
		before: [L('inner', 'Tinh linh băng bay quanh Hồ Sương Giá như đàn đom đóm lạnh. Ở giữa hồ, tôi thấy sợi Aether của một con người, đông cứng.')],
		after: [
			L('kael', 'Trưởng làng kể, có một người mẹ trong làng tự đóng băng mình để giữ mặt hồ khỏi vỡ. Từ đó bà thành Nữ hoàng băng.'),
			L('kael', 'Bà không còn nhận ra con gái mình nữa. Con gái bà ngày nào cũng ra bờ hồ đứng.'),
			L('inner', 'Mẹ tôi đang ốm. Tôi đang ở đây. Tôi nhìn cô gái đứng ở bờ hồ, và không dám nghĩ tiếp.'),
		],
	}),
	hunt('c5_ship', 'Hải Âu Bạc', 'mob_war_penguin_001', 30, 'Dẹp chim cánh cụt chiến quanh tàu kẹt băng ở Bờ Biển Băng', {
		turnIn: 'bjorn',
		level: 44,
		part: 0.22,
		coins: 700,
		before: [L('inner', 'Một con tàu băng của Đoàn bị kẹt ở Bờ Biển Băng. Chim cánh cụt chiến giữ bãi như giữ thành.')],
		onReady: [
			L('narrator', '(Bác Bram đọc tên khắc trên thân tàu và bỗng im bặt. Ai đó đã sơn lại tên mới, nhưng vết khắc cũ vẫn còn: "Hải Âu Bạc".)'),
			L('bram', 'Tàu của cha ta.'),
			L('narrator', '(Trong hòm tàu có một tấm hải đồ đánh dấu Quần đảo San Hô, và một hòm Long Châu niêm ấn Đoàn.)'),
		],
		after: [
			L('bjorn', 'Bram im lặng từ chiều tới giờ. Đàn ông đi biển mà im lặng thì có chuyện.'),
			L('bjorn', 'Bão sắp tan. Đường lên Hồ Băng mở rồi. Nữ hoàng băng ở đó.'),
		],
	}),
	hunt('c5_ice_queen', 'Để bà được tan', 'boss_ice_queen_001', 1, 'Lên Hồ Băng: giải thoát Nữ hoàng băng', {
		level: 47,
		part: 0.35,
		potions: 2,
		before: [L('inner', 'Hạ bà không phải để thắng. Hạ bà là để bà được tan ra, và nghỉ.')],
		after: [
			L('narrator', '(Nữ hoàng băng tan thành nước, chảy về phía bờ hồ, nơi con gái bà đang đứng. Mặt hồ không vỡ.)'),
			L('inner', 'Có những người ở lại bằng cách đông cứng mình. Tôi không muốn mẹ tôi phải như thế. Tôi không muốn mình phải như thế.'),
		],
	}),
	hunt('c5_yeti', 'Đàn con sau đèo', 'boss_yeti_001', 1, 'Qua đèo: đối mặt Yeti', {
		level: 48,
		part: 0.35,
		coins: 1100,
		before: [
			L('inner', 'Yeti chặn đèo vì đàn con ở phía sau. Nyra và tôi cãi nhau lần đầu.'),
			L('nyra', 'Cậu lúc nào cũng muốn cứu hết. Có ai cứu được hết đâu.'),
			L('lior', 'Còn hơn là không cứu ai.'),
			L('inner', 'Câu đó tôi nói ra rồi mới thấy nó là câu Kiến Trúc Sư cũng sẽ nói. Tôi hối hận ngay. Nhưng nói rồi.'),
		],
		after: [
			L('narrator', '(Yeti lùi về sau, che đàn con bằng thân mình. Đèo mở.)'),
			L('nyra', '…Xin lỗi. Tôi mệt.'),
			L('lior', 'Tớ cũng xin lỗi. Tớ cũng mệt.'),
		],
	}),
	hunt('c5_guardian', 'Ngai Băng', 'boss_ice_guardian_001', 1, 'Hạ Vệ thần Ngai Băng', {
		level: 50,
		part: 0.55,
		potions: 3,
		before: [L('inner', 'Vệ thần Ngai Băng ngồi đè lên một thứ gì đó. Sợi Aether dưới ngai không phải của nó. Nó là xiềng xích được đúc thành người.')],
		after: [
			L('narrator', '(Vệ thần vỡ thành trăm mảnh băng. Dưới ngai, một phù điêu hình sói khổng lồ bắt đầu thở ra hơi lạnh.)'),
		],
	}),
	talk('c5_hjalma', 'Băng Thần Hjalma', 'god_hjalma', 'Tới phù điêu sói dưới Ngai Băng', {
		level: 50,
		part: 0.4,
		coins: 1500,
		before: [L('inner', 'Mùa đông ở đây không bao giờ hết, vì có kẻ ngồi đè lên mẹ của mùa đông.')],
		after: [
			L('narrator', '(Phù điêu nứt. Một con sói cái khổng lồ lông tuyết đứng dậy, trên lưng là cả một cánh rừng thông nhỏ.)'),
			L('inner', '«Ta là Hjalma. Giao Ước đúc xiềng xích thành người, đặt lên lưng ta để giữ mùa đông mãi mãi.»'),
			L('inner', '«Ta dạy ngươi quên một nỗi đau cho nhẹ lòng. Đổi lại, ngươi quên luôn một kỷ niệm đẹp đi kèm nó. Ngươi chọn đi.»'),
			L('inner', 'Tôi nghĩ tới cái đêm văn phòng sáng đèn ở thế giới cũ. Đi kèm nó là tiếng mẹ gọi "về ăn cơm đi con" qua điện thoại. Tôi không chọn được. Tôi xin giữ cả hai.'),
			L('inner', '«Ngươi giữ cả hai. Vậy ngươi lạnh hơn người khác một chút, mãi mãi. Thế cũng được.»'),
			L('narrator', '(Gặp Băng Thần Hjalma — thần kỹ "Đông Chí" sẽ mở bán ở cửa hàng kim cương.)'),
			L('narrator', '(Tin từ phương nam: người lùn Đe Đỏ từ chối rèn vũ khí cho Đoàn. Đoàn tuyên chiến. Người dẫn đội tiên phong là Aldric. Mirelle gửi thư: "Ở đây cần thầy thuốc.")'),
			L('inner', 'Lối tây của Thung Băng Lặng dẫn xuống một vùng đá đen bốc khói: Núi lửa Hoả Sơn.'),
		],
	}),
];

// ———————————————————————————— Vùng 6 · Núi lửa Hoả Sơn (cấp 50–60) ————————————————————————————

const CH6: QuestDef[] = [
	talk('c6_arrive', 'Lửa trong lò, lửa trong lòng', 'mirelle_forge', 'Tới Pháo đài Đe Đỏ (lối tây Thung Băng Lặng) tìm Mirelle ở trạm thương binh', {
		level: 50,
		part: 0.08,
		before: [
			L('inner', 'Pháo đài Đe Đỏ nằm trong lòng núi như hòn than trong lòng bàn tay. Tiếng búa không ngừng, kể cả lúc quân Đoàn đã cắm trại dưới chân núi.'),
			L('hilde', '(Trên tường thành, một người lùn râu bạc hét xuống.) Rèn cho chúng mày thì chúng mày rèn cho ai?'),
		],
		after: [
			L('mirelle_forge', 'Lior. Ta tưởng con còn đang ở cao nguyên.'),
			L('mirelle_forge', 'Ở đây ta băng cho cả lính hai phe. Nữ vương Hilde muốn đóng cổng giữ trung lập. Em trai bà, Durin, muốn rèn vũ khí cho Đoàn để đổi lấy lửa của Mối Hoả.'),
			L('mirelle_forge', 'Còn một người đàn ông áo xám đứng cạnh Durin. Hắn nhìn con như nhìn… ta không biết tả thế nào. Như nhìn một dòng chữ viết sai.'),
		],
	}),
	hunt('c6_lizards', 'Cổng phụ trong đêm', 'mob_lava_lizard_001', 30, 'Hạ thằn lằn lửa ở Bãi Đá Đen', {
		giver: 'mirelle_forge',
		turnIn: 'mirelle_forge',
		level: 51,
		part: 0.2,
		coins: 800,
		before: [L('mirelle_forge', 'Thằn lằn lửa chui lên từ khe đá ở Bãi Đá Đen, cắn cả lính gác. Dọn bớt đi, ta hết băng rồi.')],
		progress: [L('mirelle_forge', 'Vẫn có lính bị bỏng mang về. Bãi Đá Đen chưa yên.')],
		onReady: [
			L('narrator', '(Đêm xuống. Tôi thấy Durin mở cổng phụ của pháo đài. Ngoài cổng, người áo xám đứng chờ.)'),
			L('grey_man', '(Hắn nói khẽ, bằng tiếng Việt.) Cậu chậm quá.'),
			L('narrator', '(Rồi hắn biến mất, như một dòng lệnh bị xoá.)'),
		],
		after: [
			L('mirelle_forge', 'Người áo xám nói thứ tiếng gì với con? …Con không cần kể. Mặt con kể rồi.'),
			L('mirelle_forge', 'Ta không hiểu chuyện của con. Ta chỉ biết băng bó. Nhưng con cứ về đây, lúc nào cũng được.'),
		],
	}),
	hunt('c6_bats', 'Tấm bản đồ của cha', 'mob_fire_bat_001', 30, 'Hạ dơi lửa ở Hang Dơi Lửa', {
		level: 53,
		part: 0.22,
		before: [L('nyra', 'Trong hang có rêu lửa trị bỏng. Đi với tôi. Mà… cho tôi mượn túi của cậu, túi tôi hết chỗ.')],
		after: [
			L('narrator', '(Nyra lấy thuốc trong túi tôi và chạm phải tấm bản đồ cha vẽ: dấu con hươu, đường mòn qua đầm cũ.)'),
			L('nyra', 'Dấu con hươu. Đường mòn qua làng tôi.'),
			L('nyra', 'Tôi cần đi một mình một lúc. Đừng theo.'),
			L('inner', 'Tôi không theo. Lần này tôi không nói "để sau". Tôi nói "tớ ở đây". Rồi tôi đứng đó, chờ.'),
		],
	}),
	hunt('c6_forge', 'Thanh kiếm sấm sét', 'mob_fire_spirit_001', 30, 'Hạ lửa tinh linh ở Lò Rèn Bỏ Hoang', {
		turnIn: 'mirelle_forge',
		level: 54,
		part: 0.22,
		coins: 900,
		before: [L('inner', 'Lửa tinh linh giữ một lò rèn bỏ hoang. Lò đã tắt từ lâu, nhưng lửa vẫn ở lại, như người không chịu về.')],
		onReady: [
			L('narrator', '(Trên đe còn nằm một thanh kiếm. Lưỡi kiếm có vân sấm sét, đúng hình thanh kiếm gỗ Aldric khắc hồi tám tuổi, cái hồi cậu đòi đi diệt rồng.)'),
			L('inner', 'Tôi mang nó theo. Một ngày nào đó tôi sẽ trả nó cho đúng người.'),
		],
		after: [
			L('mirelle_forge', 'Kiếm đẹp. Kiếm đẹp thì hay làm người ta chết. Giữ cho kỹ.'),
			L('mirelle_forge', 'Đội tiên phong của Aldric đang ở Sông Dung Nham. Ta nghe nói golem cổ thức dậy rồi.'),
		],
	}),
	hunt('c6_golem', 'Tên những người thợ', 'boss_ancient_lava_golem_001', 1, 'Hạ Golem dung nham cổ ở Sông Dung Nham', {
		level: 57,
		part: 0.35,
		potions: 2,
		before: [L('inner', 'Golem dung nham cổ do người lùn rèn từ thời Giao Ước để canh Mối. Trên lưng nó khắc tên những người thợ đã hiến sức.')],
		after: [
			L('narrator', '(Golem gục. Lõi của nó còn ấm. Trong danh sách tên khắc trên lưng, có tên tổ tiên của nữ vương Hilde.)'),
			L('hilde', 'Mang lõi về cho ta. Tổ tiên ta đã nằm trong cái xác ấy ba trăm năm. Đủ rồi.'),
		],
	}),
	hunt('c6_salamander', 'Lệnh bỏ rơi', 'boss_salamander_001', 1, 'Cứu đội tiên phong: hạ Salamander ở Vành Miệng Núi', {
		level: 60,
		part: 0.35,
		coins: 1400,
		before: [
			L('inner', 'Đội tiên phong của Aldric bị dung nham vây ở Vành Miệng Núi. Lệnh từ trên: rút lui, để họ làm mồi.'),
			L('aldric', 'Lior?! Đoàn bảo không ai đến. Sao cậu lại—'),
			L('lior', 'Cậu gọi, tớ đến. Cha tớ dạy thế.'),
		],
		after: [
			L('aldric', 'Lần đầu tớ nghe tận tai lệnh bỏ rơi chính đội mình. Tớ còn tưởng mình nghe nhầm.'),
			L('aldric', '…Cảm ơn. Tớ nợ cậu. Lần này không phải lời ngoéo tay. Là nợ thật.'),
		],
	}),
	hunt('c6_fire_god', 'Lõi Núi Lửa', 'boss_fire_god_001', 1, 'Hạ "Hoả thần" ở Lõi Núi Lửa', {
		level: 60,
		part: 0.55,
		potions: 3,
		before: [L('inner', 'Người lùn gọi nó là Hoả thần. Nhưng sợi Aether của nó rách nát, quay cuồng. Một vị thần không có sợi rách như thế. Đây là ngọn lửa đã hoá điên.')],
		after: [
			L('narrator', '(Ngọn lửa điên co lại, chui vào một bệ lò rèn đá ở giữa sân. Bệ lò đỏ rực lên, như có ai vừa thổi bễ.)'),
		],
	}),
	talk('c6_ignar', 'Lò Thần Ignar', 'god_ignar', 'Tới bệ lò rèn đá trong Lõi Núi Lửa', {
		level: 60,
		part: 0.4,
		coins: 1800,
		before: [L('inner', 'Lửa đã về lò. Vậy chủ của lò ở đâu?')],
		after: [
			L('narrator', '(Từ bệ lò, một người thợ rèn khổng lồ thân nham thạch đứng dậy. Râu là ngọn lửa, búa là một khối dung nham đông đặc, ngực có lò than đỏ rực.)'),
			L('inner', '«Ta là Ignar. Thứ ngươi vừa đánh là lửa lò của ta, hoá điên khi Mối Hoả bị hút. Ngươi trả lửa về lò. Ta nợ ngươi một nhát búa.»'),
			L('inner', '«Ta rèn lại một món đồ của ngươi thành đồ thần. Đổi lại, một phần hơi ấm trong tay ngươi ở lại trong lò. Tay ngươi sẽ lạnh mãi về sau.»'),
			L('lior', 'Tay con lạnh từ kiếp trước rồi. Con nhận.'),
			L('narrator', '(Gặp Lò Thần Ignar — thần kỹ "Búa Lò Thần" sẽ mở bán ở cửa hàng kim cương.)'),
			L('bram', '(Bác Bram nhận một mẩu giấy từ một thuỷ thủ qua đường.) "Hải Âu Bạc đã chìm ở San Hô. Người ta vẫn thấy đèn trên boong mỗi đêm." …Zahra đã lên đường tới đó trước.'),
			L('inner', 'Lối tây của Vành Miệng Núi dẫn ra biển. Quần đảo San Hô.'),
		],
	}),
];

// ———————————————————————————— Vùng 7 · Quần đảo San Hô (cấp 60–70) ————————————————————————————

const CH7: QuestDef[] = [
	talk('c7_arrive', 'Con tàu của cha', 'coral', 'Tới Cảng chài San Hô (lối tây Vành Miệng Núi) ngồi bên bếp lửa của mẹ Coral', {
		level: 60,
		part: 0.08,
		before: [
			L('inner', 'Biển ở San Hô trong đến mức nhìn thấy đáy, và dưới đáy là những con tàu.'),
			L('inner', 'Bác Bram đứng ở mũi thuyền chài suốt chặng đường, tay nắm chiếc khăn của mẹ bác.'),
		],
		after: [
			L('bram', 'Cha ta là thuyền trưởng Corvin. Đồng xu ta cho cậu hồi tám tuổi là của mẹ ta, người đã giữ hình dạng thật của mối nối.'),
			L('bram', 'Ta chưa từng kể với ai. Ta kể với cậu vì… ta không muốn về muộn thêm lần nào nữa.'),
			L('coral', '(Mẹ Coral nghe xong, đặt thêm một con cá lên than.) Ăn đi rồi khóc.'),
			L('coral', 'Có một phụ nữ Sahrin thuê thuyền ra Bãi Tàu Đắm từ hai hôm trước. Cua chiếm bãi ngoài kia rồi, ra đó phải mở đường.'),
		],
	}),
	hunt('c7_crabs', 'Mảnh đá ấn khắc "v3.0"', 'mob_beach_crab_001', 30, 'Hạ cua chiếm Bãi Cát Trắng', {
		giver: 'coral',
		turnIn: 'coral',
		level: 61,
		part: 0.2,
		coins: 1000,
		before: [L('coral', 'Bãi Cát Trắng ở phía nam cảng. Trẻ con ra nhặt đá ấn trôi dạt để bán cho thương lái, mà cua thì to bằng cái thúng. Dọn giúp ta.')],
		progress: [L('coral', 'Lũ trẻ vẫn chưa dám ra bãi. Còn cua.')],
		onReady: [
			L('narrator', '(Một đứa bé chìa ra hai mảnh đá ấn vỡ, đòi mười xu một mảnh. Tôi trả đủ. Không cướp của trẻ con.)'),
			L('narrator', '(Mảnh thứ nhất khắc tên "Corvin". Mảnh thứ hai khắc "v3.0".)'),
			L('inner', 'v2.1 ở sa mạc. v3.0 ở biển. Hắn đã nâng cấp.'),
		],
		after: [
			L('coral', 'Mua của bọn nhỏ hả? Tốt. Ở đây người ta nhớ ai trả tiền, ai cướp.'),
			L('bram', '(Bác cầm mảnh đá khắc tên cha rất lâu.) Ông ấy đã ở đây.'),
		],
	}),
	hunt('c7_pirates', 'Chuyến hàng cuối', 'mob_pirate_001', 30, 'Hạ cướp biển ở Vịnh Cướp Biển', {
		level: 63,
		part: 0.22,
		before: [L('inner', 'Cướp biển ở Vịnh Cướp Biển là thuỷ thủ cũ của Corvin. Họ không tin ai, trừ người đánh thắng họ.')],
		after: [
			L('narrator', '(Thuyền phó già nằm trên cát, cười ra máu.)'),
			L('narrator', '(Ông kể chuyến hàng cuối của Hải Âu Bạc: Corvin bán vị trí làng người cá cho Đoàn, đổi lấy tự do cho cả thuyền.)'),
			L('narrator', '(Người mua là một người áo xám, trả bằng thứ vàng chưa ai từng thấy.)'),
			L('bram', '…Cha ta bán cả một làng để cứu một con thuyền.'),
		],
	}),
	hunt('c7_merfolk', 'Không giết ai', 'mob_coral_merfolk_001', 30, 'Đánh ngất người cá canh Phá Người Cá', {
		turnIn: 'coral',
		level: 64,
		part: 0.22,
		coins: 1200,
		before: [
			L('inner', 'Người cá căm hận đất liền, và họ có lý do. Tôi đánh cho ngất, không giết ai.'),
			L('nyra', 'Đánh ngất thì khó hơn đánh chết nhiều. Cậu chọn việc khó thật đấy.'),
		],
		onReady: [
			L('maris', 'Người đất liền mà biết đánh nhẹ tay. Lạ thật. Ta là Maris.'),
			L('maris', 'Ta giữ một tù binh: thuỷ thủ của Hải Âu Bạc, sống sót nhờ ăn tảo mười năm. Hắn bảo sáng nay có một phụ nữ Sahrin đi ngang qua đây. Một mình.'),
		],
		after: [
			L('coral', 'Maris nói chuyện với cậu à? Ba mươi năm nay người cá chưa nói với người đất liền câu nào.'),
			L('coral', 'Zahra đi về phía Bãi Tàu Đắm. Đèn trên boong Hải Âu Bạc vẫn sáng mỗi đêm. Đi đi.'),
		],
	}),
	hunt('c7_crab_king', 'Mảnh Mối Thuỷ', 'boss_crab_king_001', 1, 'Hạ Cua chúa ở Rạn San Hô', {
		level: 67,
		part: 0.35,
		potions: 2,
		before: [L('inner', 'Cua chúa ôm một mảnh Mối Thuỷ vỡ như ôm con. Sứa phát sáng bơi quanh nó thành vòng.')],
		after: [
			L('narrator', '(Mảnh Mối Thuỷ rơi xuống cát, vẫn còn sáng. Sợi nước quanh nó chảy về phía Vực Kraken, như bị ai kéo.)'),
		],
	}),
	hunt('c7_ghost_captain', 'Thuyền trưởng ma', 'boss_ghost_captain_001', 1, 'Lên Bãi Tàu Đắm: gặp Thuyền trưởng ma', {
		level: 70,
		part: 0.35,
		coins: 2000,
		before: [
			L('inner', 'Đèn trên boong Hải Âu Bạc vẫn sáng. Thuyền trưởng ma đứng ở mũi tàu, chờ.'),
			L('corvin', 'Bram. Con về muộn quá.'),
			L('bram', 'Cha mới là người về muộn. Muộn ba mươi năm.'),
		],
		after: [
			L('corvin', '(Hồn ma mờ dần.) Ta bán một làng để cứu một thuyền. Đừng giống ta, con trai. Đừng chọn kiểu đó.'),
			L('narrator', '(Dưới khoang, Zahra ôm hòm đá ấn của Sahrin. Bác Bram gọi tên em lần đầu sau mười lăm năm. Cô quay lại, và cười.)'),
			L('zahra', 'Anh về rồi à. Muộn, nhưng về.'),
		],
	}),
	hunt('c7_kraken', 'Vực Kraken', 'boss_kraken_001', 1, 'Hạ Kraken ở Vực Kraken', {
		level: 70,
		part: 0.55,
		potions: 3,
		before: [
			L('inner', 'Cái bẫy của Kiến Trúc Sư sập xuống. Kraken kéo xác Hải Âu Bạc xuống vực.'),
			L('zahra', 'Anh về muộn mười lăm năm. Lần này anh về trước đi. Em giữ tàu.'),
		],
		after: [
			L('narrator', '(Kraken buông xác tàu. Nước lặng dần. Bác Bram nhìn xuống vực rất lâu.)'),
			L('bram', 'Em ta bơi giỏi hơn ta. Từ bé đã vậy.'),
			L('narrator', '(Dưới đáy vực, một con trai khổng lồ khép miệng, quanh nó san hô sáng lên từng đợt như nhịp thở.)'),
		],
	}),
	talk('c7_thalassa', 'Hải Mẫu Thalassa', 'god_thalassa', 'Tới con trai khổng lồ dưới đáy Vực Kraken', {
		level: 70,
		part: 0.4,
		coins: 2500,
		before: [L('inner', 'Kraken cuộn quanh một thứ gì đó suốt ba trăm năm. Giờ nó buông rồi.')],
		after: [
			L('narrator', '(Con trai khổng lồ mở ra. Từ trong đó, một con cá voi khổng lồ nổi lên, lưng mọc rạn san hô và cả một làng chài nhỏ đã chìm. Mắt nó dịu như mặt biển lặng.)'),
			L('inner', '«Ta là Thalassa. Con quái kia hút sức ta qua từng xúc tu, để mảnh Mối Thuỷ không bao giờ lành.»'),
			L('inner', '«Biển trả lại mọi thứ. Chỉ là không theo thứ tự ngươi muốn. Những người biển đã giữ, ta giữ cho tới ngày nút thắt được tháo.»'),
			L('bram', '(Bác Bram quỳ xuống mép nước.) Vậy là còn hy vọng.'),
			L('narrator', '(Gặp Hải Mẫu Thalassa — thần kỹ "Triều Dâng" sẽ mở bán ở cửa hàng kim cương.)'),
			L('narrator', '(Bác Bram ở lại San Hô thêm một tuần, rồi lại lên đường bán hàng, vì "người ta vẫn cần muối".)'),
			L('narrator', '(Tin dữ: Aldric bị Vua người nấm bắt làm con tin dưới Rừng Nấm Ngầm. Đoàn không đến cứu.)'),
			L('inner', 'Rừng Nấm Ngầm đang được dựng. Lần này tôi biết mình sẽ đi ngay. Chỉ cần đường mở.'),
		],
	}),
];

export const CHAPTER_QUESTS: QuestDef[] = [...CH1, ...CH2, ...CH3, ...CH4, ...CH5, ...CH6, ...CH7];

/** Thẻ khép lại phần đã chơi được (StoryDirector hiện sau nhiệm vụ cuối cùng): vùng 8–10 đang dựng. */
export const CHAPTERS_ENDING: string[] = [
	'Bảy vùng đất. Sáu vị thần đã tỉnh, cộng một vị thần đồng cỏ ở quê nhà.',
	'Trên mu bàn tay tôi, nút thắt hằn sâu thêm một vòng sau mỗi lần một Mối được tháo lỏng.',
	'Dưới lòng đất, Rừng Nấm Ngầm đang chờ. Và ở đâu đó, một người áo xám vẫn đang đếm từng bước chân tôi.',
	'(Hết phần đang có. Vùng 8–10 đang được xây dựng.)',
];

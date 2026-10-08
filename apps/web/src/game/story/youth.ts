import type { NpcDef, QuestDef } from './storyTypes';

/**
 * Chương 16 tuổi (nối sau phần tuổi thơ): nấm Ánh Lam → bia đá Nghĩa địa (mở Thổ) → Ông Rơm thử Đá Văng → ma vật
 * Mossvale → Quỷ vương. Thoại giữ từ bản Chương 0 trước đây, chỉ đổi sang định dạng dữ liệu của StoryDirector.
 * Viết tay (không sinh từ JSON thiết kế như `childhood.ts`).
 */
export const YOUTH_NPCS: Record<string, NpcDef> = {
	bram: {
		name: 'Bram',
		title: 'Thương nhân lữ hành',
		sprite: 'npc_bram_001',
		at: { spot: 'plaza', dx: -110, dy: -40 },
		ages: [16, 99],
		idle: [
			'Hàng mới về chưa kịp xếp. Ghé lại sau nhé — mà nhớ mang theo tiền đấy!',
			'Đồng xu ta cho cậu hồi tám tuổi… cậu vẫn giữ chứ? Thế giới này rộng lắm, Lior. Rộng hơn cái rừng Mossvale kia nhiều.',
		],
	},
	aldric: {
		name: 'Aldric',
		title: 'Cận vệ cổng bắc',
		sprite: 'npc_aldric_001',
		at: { spot: 'north_gate', dy: 40 },
		ages: [16, 99],
		idle: ['Một ngày nào đó tớ sẽ thành hiệp sĩ hoàng gia. Còn giờ thì… tớ gác cổng. Hừm.'],
	},
	mirelle: {
		name: 'Mirelle',
		title: 'Nữ trị liệu',
		sprite: 'npc_mirelle_001',
		at: { spot: 'church', dx: 30 },
		ages: [16, 99],
		idle: ['Ta đang pha thuốc. Nếu bị thương, cứ quay về đây.'],
	},
	/**
	 * Bia đá cổ ở đầu lối vào Nghĩa địa Hoàng Hôn — nơi Lior thấy "sợi tơ màu đất" (nhiệm vụ mở Thổ). Không phải người:
	 * không có sprite, hình TẠM là đồ vật `rune_stone` (đá rêu khắc vòng xoáy) có sẵn trong atlas đồ vật — có bia mộ cổ do
	 * PixelLab vẽ thì đổi `prop`. Đứng trên đường đất từ cổng nam vào, trước các khu mộ: cách vùng lang thang của hai bầy
	 * xác sống gần nhất ≥ 330px (tầm phát hiện 190px) và rất xa hầm mộ của Vua Lich — người chơi cấp 2–3 tới được an toàn.
	 */
	gy_stele: {
		name: 'Bia đá cổ',
		title: 'Nghĩa địa Hoàng Hôn',
		sprite: null,
		prop: 'rune_stone',
		at: { spot: 'south_gate_gy', dx: 24, dy: -288 },
		ages: [16, 99],
		idle: ['«…người nằm đây đã về với đất. Đất giữ lời thay cho họ.»', '«Ai còn nhớ, xin ghé qua.»'],
	},
};

export const YOUTH_QUESTS: QuestDef[] = [
	{
		id: 'y1_mushrooms',
		age: 16,
		title: 'Nấm Ánh Lam',
		giver: 'mirelle',
		objective: { type: 'pickup', item: 'mushroom', count: 3 },
		objectiveText: 'Hái nấm phát sáng ở rừng Mossvale ({n}/{total})',
		turnIn: 'mirelle',
		// Hồi Phục nay là Suối Lành (Thuỷ mốc 3, học bằng điểm tiềm năng) — Mirelle chỉ cách, không trao kỹ năng.
		reward: { exp: 60, potions: 2 },
		before: [
			{ speaker: 'mirelle', text: 'Lior. Từ hồi con mang hũ mật ong sang làm sôi cả lọ thuốc của ta, tới giờ đã mười năm. Vẫn nhớ lời ta dặn chứ: đừng khoe vội.' },
			{ speaker: 'mirelle', text: 'Thuốc trị thương trong làng sắp hết. Trong rừng Mossvale, bên kia sông, có loại nấm phát ánh xanh lam.' },
			{ speaker: 'mirelle', text: 'Mang về cho ta ba cây. Và cẩn thận — dạo này ma vật không còn hiền như trước.' },
		],
		progress: [{ speaker: 'mirelle', text: 'Nấm Ánh Lam mọc dưới bóng cây lớn trong rừng, bên kia sông. Ánh xanh lam rất dễ nhận ra.' }],
		after: [
			{ speaker: 'mirelle', text: 'Đủ ba cây, lại còn tươi nữa. Giỏi lắm.' },
			{ speaker: 'mirelle', text: 'Giờ thì nhìn vào sợi Aether quanh vết thương — đừng kéo, hãy vuốt cho chúng thẳng lại. Như vậy.' },
			{ speaker: 'mirelle', text: 'Phép này cần dòng nước trong tay con đủ sâu. Luyện Thuỷ thêm đi, tới lúc tự khắc vuốt được.' },
			{ speaker: 'narrator', text: '(Suối Lành — phép hồi máu — học được khi nhánh Thuỷ đạt mốc 3. Cộng điểm ở bảng Tiềm năng.)' },
			// Câu "Aldric đang tìm con" chuyển sang cuối "Đá cho Ông Rơm" (mẹ nhắc) — Mirelle còn nhờ việc ở Nghĩa địa.
			{ speaker: 'mirelle', text: 'Cầm lấy hai bình thuốc này.' },
		],
		onGive: { pickups: { item: 'mushroom', spots: ['forest_spot_1', 'forest_spot_2', 'forest_spot_3', 'forest_spot_4', 'forest_spot_5', 'forest_spot_6'] } },
	},
	{
		// Mở nhánh Thổ (kế hoạch nguyên tố mục 2.1): tự nhận ngay sau "Nấm Ánh Lam" — Mirelle nói tiếp trong cùng buổi.
		// Bản lưu đã qua chỗ này (đang ở y2/y3 hoặc xong chương) được StoryDirector.migrate tính là xong + bù mã `earth`.
		id: 'y1b_grave_stele',
		age: 16,
		title: 'Sợi tơ màu đất',
		giver: null,
		objective: { type: 'talk', npc: 'gy_stele' },
		objectiveText: 'Tới xem bia đá cổ ở Nghĩa địa Hoàng Hôn (qua cổng bắc)',
		turnIn: 'gy_stele',
		// Không EXP: phần thưởng là cả nhánh Thổ. Giữ nhịp cấp đã cân (boss.test: trước Quỷ vương cấp 3, sát cấp 4 — thêm
		// dù chỉ 3 EXP là sang cấp 4).
		reward: { exp: 0, unlockSkill: 'earth' },
		before: [
			{ speaker: 'mirelle', text: 'Còn một chuyện nữa, Lior. Chuyện này ta không nhờ được ai khác.' },
			{ speaker: 'mirelle', text: 'Qua cổng bắc là Nghĩa địa Hoàng Hôn. Mấy tuần nay mộ ở đó nứt từ bên dưới lên, và người nằm dưới ấy… không chịu nằm yên nữa.' },
			{ speaker: 'mirelle', text: 'Ngay đầu lối vào có một tấm bia đá, cổ hơn cả nhà thờ này. Người xưa dặn: bia còn đứng thì đất còn giữ được người đã khuất.' },
			{ speaker: 'mirelle', text: 'Ta nhìn nó chỉ thấy đá với rêu. Con thì nhìn được thứ khác. Tới xem giúp ta — đứng ở đầu lối vào thôi, đừng đi sâu vào các khu mộ.' },
			{ speaker: 'inner', text: 'Đất nghĩa địa thì có gì để nhìn? Nhưng hồi bốn tuổi, tôi cũng từng nghĩ cỏ thì có gì để nhìn.' },
		],
		after: [
			{ speaker: 'narrator', text: '(Tấm bia cao ngang vai, rêu phủ kín chân. Những vòng xoáy khắc trên mặt đá đã mòn gần hết, như thể nó mọc lên từ đất chứ không phải do ai dựng.)' },
			{ speaker: 'inner', text: 'Lửa có sợi cam, nước có sợi lam, gió có sợi lục. Mười sáu năm nay tôi vẫn nghĩ đất là thứ duy nhất không có sợi nào.' },
			{ speaker: 'inner', text: 'Hoá ra có. Chỉ là chúng không trôi trong không khí. Chúng chạy dưới chân tôi, màu nâu sẫm, chậm và dày như rễ cây — và tất cả đều quấn quanh chân tấm bia này.' },
			{ speaker: 'inner', text: 'Vài sợi đã bị giật lỏng, đầu sợi lơ lửng như dây cáp ai rút vội khỏi máy. Thảo nào người nằm dưới kia không ngủ yên.' },
			{ speaker: 'inner', text: 'Kiếp trước, giỗ ông nội năm nào tôi cũng hẹn “năm sau con về”. Tới cuối cùng, tôi vẫn không biết mộ ông nằm ở hàng thứ mấy.' },
			{ speaker: 'narrator', text: '(Tôi đặt tay lên mặt đá. Sợi đất không xoắn theo ngón tay như sợi lửa, cũng không chảy theo tay như sợi nước. Nó không chiều ai cả. Nó chỉ chờ xem người chạm vào có chịu đứng yên không.)' },
			{ speaker: 'inner', text: 'Tôi đứng yên. Lâu tới mức quên cả đếm. Rồi dưới lòng bàn tay, một sợi nâu khẽ siết lại — như có ai vừa nắm lấy tay tôi.' },
			{ speaker: 'narrator', text: '(Một hòn đá nhỏ dưới chân bia tự lăn tới mũi giày tôi. Mở nhánh Thổ — Đá Văng: ném đá, đẩy lùi. Cộng điểm Thổ ở bảng Tiềm năng (P).)' },
		],
	},
	{
		// Thử ngay kỹ năng vừa có ở chỗ an toàn (khuôn "nhận quà rồi luyện" của tuổi thơ) — không bắt đánh bầy xác sống
		// cấp 3–5 khi người chơi mới cấp 2–3. Mẹ nhận báo cáo, nhắc sang Aldric (câu cũ của Mirelle).
		id: 'y1c_stone_dummy',
		age: 16,
		title: 'Đá cho Ông Rơm',
		giver: null,
		objective: { type: 'practice', element: 'earth', count: 3, dummy: 'dummy_backyard' },
		objectiveText: 'Về sân sau thử Đá Văng vào Ông Rơm ({n}/{total})',
		turnIn: 'elin',
		// Như trên: không EXP (giữ nhịp cấp) — mẹ dúi thêm một hũ mật.
		reward: { exp: 0, potions: 1 },
		before: [
			{ speaker: 'inner', text: 'Học được phép mới mà tung bừa giữa nghĩa địa thì không phải ý hay. Phải thử ở chỗ an toàn trước đã.' },
			{ speaker: 'inner', text: 'Ông Rơm ở sân sau nhà tôi đã sống sót qua lửa, nước, gió và băng. Thêm vài hòn đá chắc cũng không sao.' },
		],
		onReady: [
			{ speaker: 'inner', text: 'Phát đầu lăn lông lốc dưới đất. Phát thứ hai bay lệch, trúng ngay chậu húng quế của mẹ. Phát thứ ba trúng bụng, Ông Rơm ngả hẳn về sau rồi mới bật dậy.' },
		],
		after: [
			{ speaker: 'elin', text: 'Mẹ còn tưởng có đứa nào ném đá vào nhà mình. Chậu húng quế thì con tự trồng lại nhé.' },
			{ speaker: 'elin', text: '…Đá à? Bao năm nay mẹ chỉ biết nhóm bếp với gọi mưa. Đất thì mẹ chưa chạm được bao giờ.' },
			{ speaker: 'elin', text: 'Nó nặng lắm, phải không? Thứ gì giữ được người ta đứng vững thì bao giờ cũng nặng.' },
			{ speaker: 'inner', text: 'Mẹ không hỏi tôi đã thấy gì ở nghĩa địa. Mẹ chỉ phủi bụi đất trên tay áo tôi, như hồi tôi bốn tuổi.' },
			{ speaker: 'elin', text: 'Cầm thêm hũ mật này. Aldric chạy qua đây ba lần rồi đấy, hỏi con đi đâu. Ra cổng bắc đi — và về trước bữa tối.' },
		],
	},
	{
		id: 'y2_shadows',
		age: 16,
		title: 'Bóng đen trong rừng',
		giver: 'aldric',
		objective: { type: 'kill', count: 5 },
		objectiveText: 'Hạ ma vật ở Khoảng trống Mossvale ({n}/{total})',
		turnIn: 'aldric',
		reward: { exp: 120, coins: 50 },
		// Ghi rõ vùng: bìa rừng (bật từ năm 8 tuổi) vẫn còn quái hồi sinh nếu chơi một mạch, mà nó gần cổng bắc hơn.
		onGive: { zone: 'mossvale_clearing' },
		before: [
			{ speaker: 'aldric', text: 'Lior! Đêm qua lính tuần thấy ánh đỏ trong rừng Mossvale. Ma vật đang tụ lại ở khoảng trống phía đông sông.' },
			{ speaker: 'aldric', text: 'Lính trong thị trấn không đủ người. Hạ năm con thôi, cho chúng biết nơi này có người canh.' },
			{ speaker: 'aldric', text: 'Lời ngoéo tay năm tám tuổi vẫn còn nhé. Quỷ thật đấy, không phải nấm đâu.' },
			{ speaker: 'aldric', text: 'Cẩn thận đấy — tớ không muốn phải báo tin xấu cho cha mẹ cậu.' },
		],
		progress: [{ speaker: 'aldric', text: 'Vẫn còn ma vật ở khoảng trống. Tớ mà không phải gác cổng thì đã đi cùng cậu rồi.' }],
		after: [
			{ speaker: 'aldric', text: 'Năm con thật à?! Cậu… cậu dùng phép kiểu gì vậy?' },
			{ speaker: 'aldric', text: 'Nhưng có chuyện lạ: ánh đỏ đang mạnh lên ở phía bắc rừng, nơi có tảng đá phong ấn cổ.' },
			{ speaker: 'aldric', text: 'Người già bảo dưới đó nhốt một con quỷ từ thời Chiến tranh Ấn Ký. Lior, chỉ cậu mới tới đó kịp.' },
		],
	},
	{
		id: 'y3_demon',
		age: 16,
		title: 'Ác quỷ thức giấc',
		giver: null,
		objective: { type: 'boss', id: 'boss_demon_001' },
		objectiveText: 'Tiêu diệt Quỷ vương ở phía bắc rừng Mossvale',
		turnIn: 'auto',
		reward: { exp: 300 },
		before: [{ speaker: 'inner', text: 'Sợi đỏ giờ dày như sợi thừng, rỉ ra từ dưới tảng đá phong ấn phía bắc khoảng trống. Việc cần làm thì làm ngay. Chân tôi không còn ngắn nữa.' }],
		after: [],
		onGive: { awakenBoss: true },
	},
];

/** Mầm bí ẩn gắn vào VẬT (nút thắt trên tay, đồng xu của Bram) chứ không phải một giọng nói/ý chí — xem docs/story.md. */
export const YOUTH_ENDING: string[] = [
	'Con quỷ tan thành tro dưới ánh trăng. Sợi đỏ phía bắc rừng đứt phựt, như dây đàn lên quá tay.',
	'Trên mu bàn tay tôi hằn lên một ký hiệu lạ: một nút thắt. Đúng hình nút thắt trên đồng xu cũ của bác Bram.',
	'Trong túi áo, đồng xu nóng ran, rồi nguội dần theo nhịp tim tôi.',
	'Về tới đầu cầu, tôi thấy một bóng người cầm đèn đứng chờ. Là cha. Tôi gọi trước khi cha kịp gọi.',
];

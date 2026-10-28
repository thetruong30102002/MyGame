/**
 * Thư viện — dữ liệu tay dùng chung (chuyển từ `apps/web/src/game/codex.ts` ngày 11/10/2026 để client Unity đọc được và bản web
 * xoá được): tên + loại + lời giới thiệu từng quái / boss, lời giới thiệu NPC theo TÊN. Quái mới thêm vào `ENEMY_STATS` phải khai
 * ở đây (test `codex.test` kiểm đủ). Unity: `Data/Sim/codex.json` (Tools~/export-sim-data.mts).
 */

/** Tên + lời giới thiệu quái / boss (dữ liệu tay — quái mới thêm vào `ENEMY_STATS` phải khai ở đây, test kiểm đủ). */
export const MONSTER_INFO: Record<string, { name: string; kind: string; lore: string }> = {
	mob_mushroom_001: {
		name: 'Nấm rừng',
		kind: 'Quái thường · rừng',
		lore: 'Mọc thành bầy ở rừng Mossvale; bào tử theo sông trôi xuống Bãi Bồi Brightwater. Ở Vết Rạn Mossvale chúng nhiễm sợi đỏ, mạnh hơn hẳn mà vẫn giòn. Co người lại là sắp lao tới — đừng lùi, bước ngang. Lửa đốt nó cháy âm ỉ, nước làm nó trương phềnh chậm chạp.',
	},
	mob_zombie_001: {
		name: 'Xác sống',
		kind: 'Quái thường · nghĩa địa',
		lore: 'Lang thang giữa các ô mộ Nghĩa địa Hoàng Hôn. Ở Mộ Vô Danh ngoài hàng rào, nơi người chết không bia không tên, chúng trỗi dậy trước và dữ hơn. Trâu và chậm, đánh rất đau nhưng chạy vòng được. Sợ lửa hơn sợ kiếm.',
	},
	mob_skeleton_archer_001: {
		name: 'Cung thủ xương',
		kind: 'Quái thường · đồi xương',
		lore: 'Đứng trên Đồi Xương Trắng bắn tên từ xa, ngoài tầm kiếm; trên tường Luỹ Hiệp Sĩ Cũ cả bầy cùng bắn. Giòn — áp sát được là gãy vụn. Đá ném trúng thì loạng choạng.',
	},
	mob_gargoyle_001: {
		name: 'Gargoyle đá',
		kind: 'Quái thường · vách đá',
		lore: 'Tượng đá sống dậy canh Vách Gargoyle và Cổng Đá ở Hẻm Cửa Sông — quay mặt vào thung lũng, canh người đi ra. Da đá giáp dày, lao nhanh. Phá giáp trước rồi hẵng chém, hoặc đóng băng cho nó đứng yên.',
	},
	boss_lich_001: {
		name: 'Vua Lich',
		kind: 'Boss vùng · hầm mộ',
		lore: 'Ngự trong hầm mộ dưới Nghĩa địa Hoàng Hôn, hạ xong vài phút sau lại trỗi dậy. Bắn cầu bóng tối, triệu xương lên từ đất. Đi chậm — giữ khoảng cách và né đòn báo trước.',
	},
	mob_cave_bat_001: {
		name: 'Dơi hang',
		kind: 'Quái thường · hang',
		lore: 'Làm tổ trên hàng tượng trong Hang Gargoyle. Sà xuống cắn rồi vọt lên trần, nhanh ngang người đi bộ nên chạy không thoát. Giòn — mấy nhát là rụng. Lửa làm cả bầy hoảng loạn.',
	},
	boss_stone_gargoyle_001: {
		name: 'Gargoyle Đá',
		kind: 'Boss vùng · hang gargoyle',
		lore: 'Tượng canh Đoàn Ấn Ký đặt từ ba trăm năm trước để giữ Gian Đá Ghi Tên trong Hang Gargoyle; hạ xong vài phút sau lại đứng dậy. Nện hai vuốt làm nứt sàn — thấy vòng nứt dưới chân thì bước ra ngoài rồi hẵng đánh.',
	},
	boss_demon_001: {
		name: 'Quỷ vương rừng sâu',
		kind: 'Boss cốt truyện · đá phong ấn',
		lore: 'Bị phong ấn dưới tảng đá cổ sâu trong rừng Mossvale, nơi sợi tơ đỏ rỉ ra từ khe đất. Nổi giận khi mất nửa máu. Đây là lời hứa thuở nhỏ của Lior và Aldric.',
	},
	// Vùng 2–7 + 4 rồng nguyên tố (dựng 10/10/2026 — chỉ số trong `WORLD_ROSTER` của @havenlord/sim/skills).
	mob_poison_frog_001: {
		name: 'Ếch độc',
		kind: 'Quái thường · Bãi Lau Sậy',
		lore: 'Nấp giữa lau sậy Đầm lầy Mù Sương, phồng họng là sắp nhảy xổ tới. Da trơn nhờn nên nước gần như vô dụng; đá và gió đánh nó đau hơn hẳn.',
	},
	mob_swamp_leech_001: {
		name: 'Đỉa đầm',
		kind: 'Quái thường · Kênh Đỉa',
		lore: 'Bò chậm dưới lớp bùn Kênh Đỉa nhưng bám vào là cắn rất đau. Giữ khoảng cách rồi đánh — đá ném và lưỡi gió làm nó co rúm lại.',
	},
	mob_glow_mushroom_001: {
		name: 'Nấm phát quang',
		kind: 'Quái thường · Rừng Ngập Nấm',
		lore: 'Họ hàng của nấm rừng Mossvale, mọc trong bóng tối Rừng Ngập Nấm và phóng bào tử sáng từ xa. Áp sát là xong; đừng đứng yên trước làn bào tử.',
	},
	mob_water_snake_001: {
		name: 'Rắn nước',
		kind: 'Quái thường · Đầm Rắn Nước',
		lore: 'Lướt trên mặt đầm nhanh hơn người chạy, cắn xong lại lùi ra. Đánh lúc nó vừa lao tới; thuỷ thuật chẳng làm gì được loài sống dưới nước.',
	},
	mob_mud_merfolk_001: {
		name: 'Người cá bùn',
		kind: 'Quái thường · Vực Sương Xanh',
		lore: 'Đứng trong sương Vực Sương Xanh phóng giáo bùn từ xa. Lẩn vào sương là khó thấy — lần theo tiếng giáo bay mà áp sát.',
	},
	boss_mother_frog_001: {
		name: 'Mẹ Ếch',
		kind: 'Boss khu · Ổ Mẹ Ếch',
		lore: 'Con ếch độc to bằng cái chòi, canh ổ trứng giữa Kênh Đỉa. Mỗi cú nhảy nện xuống đất làm cả vùng rung — thấy nó phồng mình thì chạy ra xa rồi hẵng quay lại đánh.',
	},
	boss_swamp_witch_001: {
		name: 'Phù thuỷ đầm',
		kind: 'Boss khu · Vực Sương Xanh',
		lore: 'Mụ phù thuỷ sống trong sương xanh, gọi phép độc từ xa và không bao giờ đứng gần. Đuổi theo mà đánh; gió và đá phá được lớp sương bùn của mụ.',
	},
	boss_mud_hydra_001: {
		name: 'Hydra bùn',
		kind: 'Boss chúa vùng · Hồ Hydra',
		lore: 'Chúa tể Đầm lầy Mù Sương, nhiều đầu ngóc lên từ Hồ Hydra, phun bùn độc khắp mặt hồ. Hạ được nó thì đường sang Sa mạc Hồng Cát mới mở.',
	},
	mob_scorpion_001: {
		name: 'Bọ cạp',
		kind: 'Quái thường · Cồn Cát Đỏ',
		lore: 'Vùi mình dưới cát đỏ, chỉ lộ đuôi. Kẹp và chích đều đau nhưng thân giáp chịu nước kém — dội nước hoặc băng là nó chậm hẳn.',
	},
	mob_sand_snake_001: {
		name: 'Rắn cát',
		kind: 'Quái thường · Hẻm Rắn',
		lore: 'Trườn dưới cát rồi trồi lên ngay chân người qua đường ở Hẻm Rắn. Nhanh mà giòn; lửa và đá gần như không xi nhê với loài sống trong cát nóng.',
	},
	mob_mummy_001: {
		name: 'Xác ướp',
		kind: 'Quái thường · Lăng Mộ Cát',
		lore: 'Lê bước trong các hành lang Lăng Mộ Cát, quấn vải dày nên rất trâu. Chậm — chạy vòng mà đánh, nước và băng thấm qua lớp vải tốt hơn lửa.',
	},
	mob_vulture_001: {
		name: 'Kền kền',
		kind: 'Quái thường · Vách Kền Kền',
		lore: 'Lượn trên Vách Kền Kền rồi bổ nhào xuống kẻ đứng một mình. Lao nhanh, rút nhanh; đứng chờ nó sà xuống rồi chém.',
	},
	mob_sand_spirit_001: {
		name: 'Linh hồn cát',
		kind: 'Quái thường · Phế tích Đá Đỏ',
		lore: 'Hồn cát lởn vởn trong Phế tích Đá Đỏ, bắn lốc cát từ xa. Không sợ lửa, sợ nước — ướt là tan thành bùn.',
	},
	boss_scorpion_queen_001: {
		name: 'Bọ cạp chúa',
		kind: 'Boss khu · Hẻm Rắn',
		lore: 'Mẹ của mọi con bọ cạp Cồn Cát Đỏ, càng to bằng cánh cửa. Nện đuôi xuống đất thành vòng chấn — thấy nó giương đuôi thì lùi ra.',
	},
	boss_pharaoh_001: {
		name: 'Pharaoh xác ướp',
		kind: 'Boss khu · Phế tích Đá Đỏ',
		lore: 'Vị vua cổ thức dậy giữa Phế tích Đá Đỏ, gọi lời nguyền cát từ xa. Áp sát và giữ chân — băng và nước làm phép của hắn chậm lại.',
	},
	boss_sandworm_001: {
		name: 'Sâu cát khổng lồ',
		kind: 'Boss chúa vùng · Hố Cát Nuốt',
		lore: 'Chúa tể Sa mạc Hồng Cát, nuốt cả đoàn lạc đà ở Hố Cát Nuốt. Chui xuống rồi trồi lên dưới chân — cát rung là phải chạy. Hạ được nó thì lên được Cao nguyên Gió Hú.',
	},
	mob_wind_wolf_001: {
		name: 'Sói gió',
		kind: 'Quái thường · Đồi Cỏ Cao',
		lore: 'Chạy theo bầy trên Đồi Cỏ Cao, nhanh như gió thổi qua cỏ. Lưỡi gió trượt qua lông nó; đá và kiếm thì không.',
	},
	mob_hawk_001: {
		name: 'Chim ưng',
		kind: 'Quái thường · Vách Chim Ưng',
		lore: 'Làm tổ trên Vách Chim Ưng, bổ nhào xuống rồi vút lên ngay. Chờ nó sà thấp mà đánh; đá ném hạ nó nhanh nhất.',
	},
	mob_wind_fairy_001: {
		name: 'Tiên gió',
		kind: 'Quái thường · Thung Lũng Tiên',
		lore: 'Bay lượn trong Thung Lũng Tiên, phóng phép gió từ xa rồi né đi. Không ham đánh gần — đuổi theo và đừng dùng gió với nó.',
	},
	mob_flying_rock_001: {
		name: 'Đá bay',
		kind: 'Quái thường · Bãi Đá Bay',
		lore: 'Tảng đá có hồn trôi lơ lửng trên Bãi Đá Bay. Cứng và chậm, đâm vào rất đau; đánh từ bên hông, thổ thuật làm nó nứt toác.',
	},
	mob_wind_goblin_001: {
		name: 'Yêu tinh gió',
		kind: 'Quái thường · Đường Lên Đền Mây',
		lore: 'Chặn Đường Lên Đền Mây, bắn tên gió từ trên dốc. Giòn — leo tới được là xong.',
	},
	boss_storm_eagle_001: {
		name: 'Đại bàng bão',
		kind: 'Boss khu · Vách Chim Ưng',
		lore: 'Con chim ưng to nhất cao nguyên, sải cánh cuốn cả gió bão. Lao tới rất nhanh rồi vòng lại — đứng vững, đánh đúng lúc nó sà xuống.',
	},
	boss_wind_mage_001: {
		name: 'Pháp sư gió',
		kind: 'Boss khu · Đường Lên Đền Mây',
		lore: 'Kẻ canh đường lên Đền Trên Mây, gọi lốc xoáy từ xa. Áp sát nhanh; phép gió của mình chỉ như gió thoảng với hắn.',
	},
	boss_wind_drake_001: {
		name: 'Rồng gió',
		kind: 'Boss chúa vùng · Đền Trên Mây',
		lore: 'Chúa tể Cao nguyên Gió Hú, cuộn mình quanh Đền Trên Mây. Thở ra bão gió quét cả vùng — tránh luồng gió rồi đánh vào sườn. Hạ được nó thì đường lên Lãnh nguyên Băng Giá mới mở.',
	},
	dragon_wind_001: {
		name: 'Phong Long',
		kind: 'Rồng nguyên tố · Long Huyệt Tuyệt Vân',
		lore: 'Một trong năm rồng nguyên tố, ngủ trong Long Huyệt Tuyệt Vân trên đỉnh mây. Mạnh gấp nhiều lần chúa vùng — rủ cả nhóm, mang đá và kiếm, đừng mang gió.',
	},
	mob_snow_wolf_001: {
		name: 'Sói tuyết',
		kind: 'Quái thường · Rừng Thông Tuyết',
		lore: 'Săn theo bầy giữa Rừng Thông Tuyết, lông trắng lẫn vào tuyết. Nhanh và dai; lửa làm cả bầy chùn lại.',
	},
	mob_ice_wisp_001: {
		name: 'Tinh linh băng',
		kind: 'Quái thường · Hồ Băng',
		lore: 'Đốm sáng lạnh lơ lửng trên Hồ Băng, bắn mũi băng từ xa. Băng thuật vô dụng với nó; một ngọn lửa là tan.',
	},
	mob_snowman_001: {
		name: 'Người tuyết',
		kind: 'Quái thường · Đèo Người Tuyết',
		lore: 'To xác, chậm chạp, vung tay là đánh văng người. Chạy vòng mà đánh — lửa làm nó chảy nhão.',
	},
	mob_war_penguin_001: {
		name: 'Chim cánh cụt chiến',
		kind: 'Quái thường · Bờ Biển Băng',
		lore: 'Cả bầy trượt bụng trên Bờ Biển Băng lao vào kẻ lạ. Trông buồn cười nhưng mỏ rất cứng; lửa đánh chúng đau nhất.',
	},
	mob_ice_bear_001: {
		name: 'Gấu băng',
		kind: 'Quái thường · Hang Gấu',
		lore: 'Chủ nhân Hang Gấu, lông dày như giáp. Rất trâu — đốt cháy rồi đánh dần, đừng đứng đỡ cú tát của nó.',
	},
	boss_ice_queen_001: {
		name: 'Nữ hoàng băng',
		kind: 'Boss khu · Hồ Băng',
		lore: 'Ngự giữa Hồ Băng, gọi bão tuyết từ xa và đóng băng kẻ đứng yên. Luôn di chuyển; lửa phá được lớp giáp băng của bà.',
	},
	boss_yeti_001: {
		name: 'Yeti',
		kind: 'Boss khu · Đèo Người Tuyết',
		lore: 'Người tuyết khổng lồ canh Đèo Người Tuyết, nện đất làm tuyết lở. Thấy nó giơ hai tay thì lùi ra — rồi quay lại đốt.',
	},
	boss_ice_guardian_001: {
		name: 'Vệ thần Ngai Băng',
		kind: 'Boss chúa vùng · Ngai Băng',
		lore: 'Chúa tể Lãnh nguyên Băng Giá, khối băng sống canh Ngai Băng từ ngàn năm. Giáp băng cực dày, băng thuật vô dụng — mang lửa tới. Hạ được nó thì đường sang Núi lửa Hoả Sơn mới mở.',
	},
	dragon_ice_001: {
		name: 'Băng Long',
		kind: 'Rồng nguyên tố · Long Huyệt Hàn Sương',
		lore: 'Rồng nguyên tố ngủ trong Long Huyệt Hàn Sương dưới lớp băng vĩnh cửu. Hơi thở đóng băng cả vùng — rủ cả nhóm, mang lửa.',
	},
	mob_lava_lizard_001: {
		name: 'Thằn lằn lửa',
		kind: 'Quái thường · Bãi Đá Đen',
		lore: 'Phơi mình trên Bãi Đá Đen nóng rẫy. Lửa chỉ làm nó khoái; dội nước hoặc băng là nó nguội cứng lại.',
	},
	mob_lava_golem_001: {
		name: 'Golem dung nham',
		kind: 'Quái thường · Sông Dung Nham',
		lore: 'Đá nóng chảy kết thành người, lội dọc Sông Dung Nham. Cực trâu, chậm — nước làm vỏ nó nứt.',
	},
	mob_fire_bat_001: {
		name: 'Dơi lửa',
		kind: 'Quái thường · Hang Dơi Lửa',
		lore: 'Bay thành đàn trong Hang Dơi Lửa, lao vào rồi vút đi. Giòn — một nhát là rơi; đừng phí lửa vào chúng.',
	},
	mob_fire_spirit_001: {
		name: 'Tinh linh lửa',
		kind: 'Quái thường · Lò Rèn Bỏ Hoang',
		lore: 'Đốm lửa có hồn trú trong Lò Rèn Bỏ Hoang, phóng cầu lửa từ xa. Nước dập tắt nó nhanh nhất.',
	},
	mob_fire_demon_001: {
		name: 'Quỷ lửa',
		kind: 'Quái thường · Miệng Núi',
		lore: 'Bò lên từ Miệng Núi, vung vuốt rực lửa đánh rất đau. Giữ khoảng cách, dội nước và băng.',
	},
	boss_ancient_lava_golem_001: {
		name: 'Golem dung nham cổ',
		kind: 'Boss khu · Sông Dung Nham',
		lore: 'Golem dung nham đầu tiên, to như ngọn đồi, canh khúc sông nóng nhất. Mỗi bước để lại vũng dung nham — đừng đứng sau lưng nó.',
	},
	boss_salamander_001: {
		name: 'Salamander',
		kind: 'Boss khu · Miệng Núi',
		lore: 'Thằn lằn lửa khổng lồ sống trong Miệng Núi, phun lửa từ xa. Băng và nước làm nó chậm lại; lửa thì vô dụng.',
	},
	boss_fire_god_001: {
		name: 'Hoả thần',
		kind: 'Boss chúa vùng · Lõi Núi Lửa',
		lore: 'Chúa tể Núi lửa Hoả Sơn, ngồi giữa Lõi Núi Lửa. Gọi mưa lửa khắp vùng — đọc vòng báo dưới chân, mang nước và băng. Hạ được hắn thì đường ra Quần đảo San Hô mới mở.',
	},
	dragon_fire_001: {
		name: 'Hoả Long',
		kind: 'Rồng nguyên tố · Long Huyệt Viêm Đế',
		lore: 'Rồng nguyên tố ngủ trong Long Huyệt Viêm Đế sâu dưới dung nham. Hơi thở thiêu rụi cả vùng — rủ cả nhóm, mang nước và băng.',
	},
	mob_beach_crab_001: {
		name: 'Cua',
		kind: 'Quái thường · Bãi Cát Trắng',
		lore: 'Bò ngang trên Bãi Cát Trắng, mai cứng như khiên. Đánh từ bên hông; gió và đá lật mai nó dễ hơn nước.',
	},
	mob_reef_jellyfish_001: {
		name: 'Sứa',
		kind: 'Quái thường · Rạn San Hô',
		lore: 'Trôi lờ đờ quanh Rạn San Hô, phóng tia điện từ xa. Nước chẳng làm gì nó; gió thổi bay cả đám.',
	},
	mob_pirate_001: {
		name: 'Cướp biển',
		kind: 'Quái thường · Đảo Cướp Biển',
		lore: 'Băng cướp chiếm Đảo Cướp Biển, chém bằng mã tấu cong. Đánh theo bầy — đừng để bị vây.',
	},
	mob_coral_merfolk_001: {
		name: 'Người cá',
		kind: 'Quái thường · Đầm Người Cá',
		lore: 'Phóng giáo san hô từ Đầm Người Cá. Họ hàng xa của người cá bùn đầm lầy; lên bờ thì giòn, gió và đá hạ nhanh.',
	},
	mob_wreck_octopus_001: {
		name: 'Bạch tuộc',
		kind: 'Quái thường · Bãi Tàu Đắm',
		lore: 'Trú trong xác tàu Bãi Tàu Đắm, vung xúc tu đánh rất đau. Đứng ngoài tầm xúc tu mà đánh.',
	},
	boss_crab_king_001: {
		name: 'Cua chúa',
		kind: 'Boss khu · Rạn San Hô',
		lore: 'Con cua to nhất quần đảo, mai phủ san hô. Kẹp một cái là văng — đánh vào sườn, đá làm mai nó nứt.',
	},
	boss_ghost_captain_001: {
		name: 'Thuyền trưởng ma',
		kind: 'Boss khu · Bãi Tàu Đắm',
		lore: 'Hồn thuyền trưởng con tàu đắm, gọi lời nguyền biển từ xa. Áp sát; gió thổi tan sương ma quanh hắn.',
	},
	boss_kraken_001: {
		name: 'Kraken',
		kind: 'Boss chúa vùng · Vực Kraken',
		lore: 'Chúa tể Quần đảo San Hô, quái vật biển sâu dưới Vực Kraken. Xúc tu trồi lên khắp mặt nước — tránh vòng báo, mang gió và đá.',
	},
	dragon_water_001: {
		name: 'Thuỷ Long',
		kind: 'Rồng nguyên tố · Long Huyệt Thương Hải',
		lore: 'Rồng nguyên tố ngủ trong Long Huyệt Thương Hải dưới đáy biển. Sóng của nó cuốn cả nhóm — mang gió và đá, đừng mang nước.',
	},
};

/** Lời giới thiệu NPC theo TÊN (một người xuất hiện ở nhiều tuổi với nhiều khoá NPC — gộp làm một mục). */
export const NPC_LORE: Record<string, string> = {
	'Elin Ashvale': 'Mẹ của Lior — pháp sư làng: phép chỉ đủ nhóm bếp, gọi mưa cho vườn rau. Nuôi ong sau nhà. Không hỏi con đang làm gì, chỉ đứng xem.',
	'Garrick Ashvale': 'Cha của Lior — lính gác cũ, kiếm sĩ ít lời. Thường ngồi mài kiếm ở đầu cầu sông Brightwater. "Con gọi, cha đến."',
	Mirelle: 'Nữ trị liệu của Thistlewood, pha thuốc ở nhà thờ. Không thấy sợi Haven, nhưng biết cách để không ai bị bỏng.',
	Bram: 'Thương nhân lữ hành dựng quầy ở quảng trường. Bán bình mật ong, đồ đi đường — và kể đủ chuyện về thế giới rộng hơn rừng Mossvale.',
	Aldric: 'Bạn thuở nhỏ của Lior, "hiệp sĩ tự phong" với thanh Kiếm Sấm Sét bằng gỗ. Lớn lên canh cổng bắc thật. Hai đứa từng ngoéo tay đi đánh Quỷ vương.',
	'Bia đá cổ': 'Tấm bia phủ rêu ở cổng nam Nghĩa địa Hoàng Hôn, khắc những dòng chữ đã mòn gần hết.',
	'Cột dịch chuyển': 'Cột đá cổ ở trạm của mỗi vùng. Đã đặt chân tới trạm nào thì từ cột này dịch chuyển về đó được, trả ít xu.',
	'Bia Danh Vọng': 'Tấm bia đá giữa quảng trường Thistlewood, khắc tên những người làm nên chuyện: săn quái, hạ boss, đi khắp các vùng, kết bạn. Đạt mục tiêu thì tới đây nhận kim cương.',
	Sein: 'Lữ khách tóc bạc, anh của Sera. Thuở nhỏ theo đoàn buôn của cha ghé chợ Thistlewood; mười sáu tuổi tự đi khắp lục địa, mơ một ngày săn được rồng phương Đông.',
	Sera: 'Lữ khách tóc bạc, em của Sein. Mang theo cuốn sổ vẽ, đi tới đâu ghi lại bản đồ tới đó — muốn tự tay vẽ trọn lục địa Haven.',
};


/** Gộp các khoảng tuổi của NPC thành chữ: "4–8 tuổi · từ 16 tuổi". */
export function agesText(ages: [number, number][]): string {
	return [...ages]
		.sort((a, b) => a[0] - b[0])
		.map(([a, b]) => (b >= 99 ? `từ ${a} tuổi` : a === b ? `${a} tuổi` : `${a}–${b} tuổi`))
		.filter((t, i, all) => all.indexOf(t) === i)
		.join(' · ');
}

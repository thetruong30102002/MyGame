# Vùng 1 Thistlewood — 12 map (thiết kế chốt 10/10/2026)

> Chủ dự án 10/10/2026: mỗi vùng 12 map, làm vùng 1 trước. Sinh từ workflow 3 phương án + 3 giám khảo + tổng hợp. Dữ liệu đầy đủ: vung1-12-map.json.

## Ý tưởng

THIẾT KẾ CUỐI: VÙNG 1 CÓ 12 MAP.
Nền là Phương án 2, có tổng điểm cao nhất (P2 = 7,6 + 7,9 + 7,6 = 23,1; P3 = 23,05; P1 = 22,6). Ghép thêm ý hay của P1 và P3, đồng thời sửa mọi lỗi giám khảo đã nêu.

Gồm 12 map: 1 trạm (Thistlewood), 1 thánh địa (Đá Phong Ấn) và 10 map săn. Trong 10 map săn có 1 map tuổi thơ dùng chung với người lớn (Bãi Bồi) và 2 map có boss khu (Nghĩa địa có Vua Lich, Hang Gargoyle có Gargoyle Đá).

ĐỊA LÝ
Bám theo trục sông Brightwater, chảy từ thị trấn xuống phía nam:
- Thistlewood → Bãi Bồi → Hẻm Cửa Sông. Đến Hẻm, sông bẻ sang TÂY NAM, rời thung lũng và đổ vào Đầm lầy Mù Sương (vùng 2, đúng hướng trên tranh lục địa).
- Sợi đỏ chạy về ĐÔNG NAM Mossvale, tới Vết Rạn (đúng câu "ra khỏi bản đồ của cha" trong Chương 1), rồi theo sông xuống Hẻm và sang đầm. Cách xếp này khớp được cả cốt truyện lẫn tranh lục địa.
- Phía bắc: Nghĩa địa có thêm Mộ Vô Danh ở mép tây. Vách Gargoyle dẫn lên Hang Gargoyle. Đồi Xương dẫn sang Luỹ Hiệp Sĩ Cũ.

BA VÒNG ĐI ĐƯỢC (ý của P1, mọi lối đều nối đúng mép đối diện: S↔N, E↔W)
- NAM: town → Mossvale → Vết Rạn → Bãi Bồi → town.
- BẮC: Nghĩa địa → Vách → Hang → Mộ Vô Danh → Nghĩa địa. Lối từ Hang sang Mộ Vô Danh là "Đường hầm của Đoàn", mở ngay cạnh gian boss nên hạ boss xong khỏi phải đi ngược cả hang.
- ĐÔNG: town → Nghĩa địa → Đồi Xương → Luỹ → Mossvale → town.
Chỉ còn 2 map cụt: Đá Phong Ấn (thánh địa) và Hẻm Cửa Sông (cửa sang vùng 2).

QUÁI
Mỗi map săn đúng MỘT loại quái thường, sinh theo bầy 3–6 con, mỗi map 4–5 bầy.
- Nấm có ở 3 map: Mossvale cấp 1–3, Bãi Bồi cấp 1 (khu trẻ em) và cấp 3–4, Vết Rạn cấp 5–6 với bầy nấm 'nhiễm sợi đỏ' đông 5–6 con.
- Xác sống có ở 2 map: Nghĩa địa, Mộ Vô Danh cấp 6–7.
- Cung xương có ở 2 map: Đồi Xương, Luỹ Hiệp Sĩ cấp 7–8.
- Gargoyle có ở 2 map: Vách, Hẻm Cửa Sông cấp 9–10.
- Hang Gargoyle dùng Dơi hang (mob_cave_bat_001), cấp 8–9. Hình dơi ĐÃ VẼ đủ idle/walk/attack/death trong sources (đã kiểm từng thư mục), đúng con 'Dơi hang' mà kế hoạch thế giới định cho Hang ('5 loại quái/vùng'). Đây là phương án 'đề xuất quái mới' với 0 lượt vẽ, CẦN CHỦ DỰ ÁN DUYỆT. Nếu không duyệt thì Hang dùng gargoyle cấp 8–9; gargoyle khi đó có ở 3 map, vẫn đúng luật.
Boss: Vua Lich (giữ nguyên), Gargoyle Đá (boss khu mới, đã có hình), Quỷ vương (boss chúa, giữ nguyên).

Gargoyle Đá theo đúng Chương 1 (sửa lệch truyện của P1): là tượng canh Đoàn Ấn Ký đặt từ ba trăm năm trước để giữ Gian Đá Ghi Tên. Cạnh đó là chỗ đặt 'cỗ máy đo bằng đồng còn ấm'. Đường hầm sau gian giải thích luôn vì sao có người vừa ở đây mà không phải đi qua lũ dơi.

CẤP QUÁI THEO KHU (gom từ P1 và P3)
- Thêm trường `level` cho khu quái và hàm chung `enemyStatsAt` đặt trong packages/sim, máy chủ và client cùng dùng.
- Khu không khai level thì giữ nguyên chỉ số cũ, nên 6 map cũ không đổi số nào.

ĐƯỜNG CẤP SAU QUỶ VƯƠNG (khoảng cấp 5)
Vách / Vết Rạn (5–6) → Mộ Vô Danh (6–7) → Luỹ (7–8) → Hang (8–9, Gargoyle Đá cấp 10) → Hẻm Cửa Sông (9–10) → vùng 2.

ĐỒ VẬT
Chỉ dùng đồ vật vùng 1. Gồm 36 món đã có trong atlas; bộ G1/R1/B1 cùng 5 món lẻ đã khai trong humanKingdom.ts nhưng đang chờ vẽ; và 16 id mới cắt từ hai tấm hang CV1/CV2. Hai tấm hang ĐÃ VẼ, cùng ảnh mẫu N1 nên cùng một nét.
- 0 lượt PixelLab bắt buộc. Có 1 tấm tuỳ chọn.
- KHÔNG dùng mushroom_glow / herb_silver làm cảnh, vì đó là hình vật phẩm nhặt (PICKUP_PROP).
- KHÔNG dùng lại nhà độc bản của thị trấn.

LUẬT MỚI CHỐNG KẸT QUÁI
Tâm mỗi bầy phải cách ô nước gần nhất ít nhất 6 ô. Lý do: quái đuổi theo đường thẳng (CombatSystem chỉ đi vòng tường tạm), nên quái đứng sau nước sẽ kẹt bên bờ cho người chơi bắn tỉa. Ý đánh trên cồn / qua sông của P1 và P3 vì thế bị bỏ.

SỬA LỖ HỔNG NHIỆM VỤ VÀ CÂN BẰNG (P1 phát hiện)
- StoryDirector chỉ đếm quái đã hạ trong khu `onGive.zone`. Hiện y2_shadows đếm MỌI con quái, còn c8_forest_edge đếm mọi con nấm.
- Khu tuổi thơ có thêm `untilAge`.
- EXP từ khu tuổi thơ không đưa nhân vật quá cấp 3.

Mỗi map mới có một điểm bí mật không có đường mòn dẫn tới (ý của P1).

## Đồ thị lối

12 map, 14 cạnh trong vùng (28 lối, cạnh nào cũng hai chiều và nối đúng mép đối diện) cộng 1 lối sang vùng 2. Lối MỚI khai ở CUỐI mảng exits vì maps.test dùng exits[0].

SƠ ĐỒ (không đúng tỉ lệ):

                 [gargoyle_cave ★Gargoyle Đá]
                   | S trước      \ S sau (Đường hầm của Đoàn)
               [cliffs]            \
                   |                \
 [nameless] ── [graveyard ★Lich] ── [bonehills] ── [oldfort]
   (N ← hầm)       |                                 | S
                [town] ────────── [mossvale] ────────┘ (mép N, phần đông)
                   |                 |  \ N (giữa)
             [riverflats] ─────── [mossrift]  [shrine ★Quỷ vương]
                   |
             [rivergate] ──W──▶ swamp/hub (vùng 2, cổng khoá)

GIỮ NGUYÊN 5 cạnh:
- town N (20–24) ↔ graveyard S
- town E (23–29) ↔ mossvale W
- mossvale N (20–26) ↔ shrine S
- graveyard N (15–18) ↔ cliffs S
- graveyard E (19–22) ↔ bonehills W

MỚI 9 cạnh (mép nguồn + khoảng ô → map đích#điểm đến):
1. town S (20–24) → riverflats#north_entry_rf · riverflats N (20–24) → town#south_road
2. riverflats E (12–17, qua cầu gỗ hàng 14–15) → mossrift#west_entry_rv · mossrift W (26–31) → riverflats#east_entry_rf
3. mossvale S (32–37) → mossrift#north_entry_rv · mossrift N (20–25) → mossvale#south_entry_mv
4. riverflats S (20–24) → rivergate#north_entry_vg · rivergate N (19–24) → riverflats#south_entry_rf. Hai đầu sông khớp nhau ở cột 30–32.
5. graveyard W (18–23) → nameless#east_entry_nl · nameless E (17–22) → graveyard#west_gate_gy
6. bonehills E (11–16) → oldfort#west_entry_of · oldfort W (11–16) → bonehills#east_gate_bh
7. cliffs N (23–28, khe sau quảng trường phế tích) → gargoyle_cave#south_entry_gc · gargoyle_cave S (28–33) → cliffs#north_entry_cl
8. gargoyle_cave S phần tây (3–7, Đường hầm của Đoàn) → nameless#north_entry_nl · nameless N (30–34) → gargoyle_cave#tunnel_gc
9. mossvale N phần đông (38–43) → oldfort#south_entry_of · oldfort S (6–11) → mossvale#northeast_entry_mv

SANG VÙNG KHÁC
rivergate W (31–35) → swamp/hub#east_gate.
- Khai ngay bây giờ, validateRegion chỉ kiểm dạng id.
- regionGate có sẵn chặn lối này: cần cấp ≥ 10 và đã hạ boss_demon_001. Vùng 2 chưa có map thì cổng báo 'đang xây dựng'.
- Khi dựng vùng 2: hub phải có địa điểm east_gate và lối quay về 'human/rivergate', điểm đến 'swamp_gate_vg'. crossRegionExits sẽ kiểm chéo.

VÒNG ĐI ĐƯỢC
- NAM: town–mossvale–mossrift–riverflats–town
- BẮC: graveyard–cliffs–gargoyle_cave–nameless–graveyard
- ĐÔNG: town–graveyard–bonehills–oldfort–mossvale–town
Map cụt: shrine (thánh địa) và rivergate (cửa vùng 2). Mép tây của town để trống cho sau: không mở lối ngay sân sau nhà Ashvale, chỗ trẻ 4–6 tuổi tập kiếm và phép.

SỐ BƯỚC TỪ TRẠM
- 1 bước: graveyard, mossvale, riverflats
- 2 bước: cliffs, bonehills, nameless, shrine, mossrift, oldfort (qua mossvale), rivergate
- 3 bước: gargoyle_cave
Đường tắt về trạm:
- Từ Luỹ: oldfort → mossvale → town, 2 lần chuyển map thay vì 3.
- Từ gian boss: hầm sang Mộ Vô Danh → Nghĩa địa → town, khỏi đi ngược ~35 ô qua cả hang.
Nhiệm vụ trẻ em town ↔ mossvale vẫn đi thẳng 1 bước, dẫn đường không vòng qua Bãi Bồi.

## Từng map

### Thistlewood (town) — có sẵn · hub

- Địa hình: meadow · cỡ 50×52 (giữ) · cấp — (an toàn) · từ 4 tuổi
- Quái: — — Không có quái.
- Boss: —
- Lối: E → mossvale#west_entry · 'Rừng Mossvale' (giữ, exits[0]); N → graveyard#south_gate_gy · 'Nghĩa địa Hoàng Hôn' (giữ); S → riverflats#north_entry_rf · exitStrip('S', 20, 24) · 'Bãi Bồi Brightwater' (MỚI, khai CUỐI mảng)
- Địa điểm: home, backyard, plaza, church, north_gate, north_road, river_bank, bridge, east_gate, herb_spot_1..4 (giữ); south_road (MỚI) 'Đường xuống Bãi Bồi' px(22), px(49), r 60

GIỮ NGUYÊN nhà, quảng trường, chợ, hình nộm, cột dịch chuyển và toạ độ mọi địa điểm. Chỉ thêm 4 thứ:
1. Vòng đường Bắc–Nam (x 21–23) đổi `y < TOWN_H - 2` thành `y < TOWN_H`, cho đường chạm mép dưới.
2. L.place('signpost', px(25), px(49)+10, {force: true}).
3. L.reserve(22, 50.5, 3).
4. Địa điểm south_road và lối S.
Sông giữ nguyên: riverX(51) = 45, nên sông ra mép dưới đúng cột 45–47. Bãi Bồi nhận sông đúng ở cột đó.
Dãy rand KHÔNG lệch: ba lượt scatter đều gọi pick mỗi lần, decal cũng gọi pick cả trên ô 'd'. Kết quả chỉ mất vài cây/bụi và đổi loại decal trên 6 ô đường mới.
Trang trại tây nam (fence ở y 46, x 3–11) và đèn ở x 20 không bị đụng.

### Rừng Mossvale (mossvale) — có sẵn · hunt

- Địa hình: meadow (nền f) · cỡ 48×44 (giữ) · cấp 1–3 (chỉ số gốc, không khai level) · từ 8 tuổi
- Quái: mob_mushroom_001 — Giữ nguyên 5 khu:
- mossvale_edge 3 con (onDemand, c8)
- mossvale_clearing 5 con (y2_shadows)
- mossvale_east 4, mossvale_south 4, mossvale_north 4 (fromAge 16)
- Boss: —
- Lối: W → town#east_gate (giữ); N (20–26) → shrine#south_entry (giữ); S → mossrift#north_entry_rv · exitStrip('S', 32, 37) · 'Vết Rạn Mossvale · cấp 5+' (MỚI); N (38–43) → oldfort#south_entry_of · exitStrip('N', 38, 43) · 'Luỹ Hiệp Sĩ Cũ · cấp 7+' (MỚI)
- Địa điểm: west_entry, north_entry, forest_edge, mob_clearing, forest_spot_1..6 (giữ); south_entry_mv (MỚI) 'Đường xuống Vết Rạn' px(34)+24, px(41), r 60; northeast_entry_mv (MỚI) 'Đường lên Luỹ Hiệp Sĩ' px(40)+24, px(3), r 60

Giữ rừng, 5 khoảng trống, 6 điểm nhặt nấm và Khoảng trống của y2.
Thêm 2 đường mòn, đặt CÙNG NHÓM path đầu hàm (trước khi khoét khoảng trống):
- Đường theo sợi đỏ về đông nam: L.path([[30,35],[34,35],[34,43]]), từ Khoảng trống chính xuống mép nam.
- Đường lên sống núi: L.path([[40,9],[40,0]]), từ Bãi nấm phía đông lên mép bắc.
Thêm L.reserve(35, 42.5, 3) và L.reserve(40.5, 1, 3); signpost px(37), px(41)+10 và px(37), px(2)+10 (force).
Ghi chú dãy rand: hai đường cắt qua khoảng 7 ô 'g' của hai khoảng trống. Lượt GROUND_PLANTS chỉ gọi pick trên ô 'g', nên bụi cỏ và decal phía sau xáo lại. Hai lượt cây/đá đầu giữ nguyên, trừ ô nằm trên đường. Khu quái, địa điểm và lối cũ không đổi.
Điểm đến từ Luỹ cách tâm Bãi nấm đông khoảng 10 ô. Nấm cấp thấp, không nguy hiểm.

### Đá Phong Ấn (shrine) — có sẵn · sanctum

- Địa hình: meadow (nền f) · cỡ 30×26 (giữ) · cấp Quỷ vương 5 (cốt truyện, đã cân) · từ 16 tuổi
- Quái: — (chỉ boss chúa) — Không có bầy.
- Boss: boss_demon_001 — Quỷ vương rừng sâu (boss chúa, y3_demon). Hạ nó là một trong hai điều kiện mở cổng vùng 2 ở Hẻm Cửa Sông.
- Lối: S → mossvale#north_entry (giữ)
- Địa điểm: south_entry, seal_stone (giữ)

KHÔNG ĐỔI byte nào. Vẫn là thánh địa cụt cuối nhánh rừng. Chương 1 mục 7 (Aldric ngồi cạnh tảng đá đã nguội) dùng lại seal_stone.

### Nghĩa địa Hoàng Hôn (graveyard) — có sẵn · hunt

- Địa hình: deadland · cỡ 46×42 (giữ) · cấp 3–5 (gốc 4) · Vua Lich ~6 · từ 16 tuổi
- Quái: mob_zombie_001 — Giữ nguyên 4 khu mộ: gy_plot_sw 5, gy_plot_se 5, gy_plot_nw 4, gy_plot_ne 4.
- Boss: boss_lich_001 — khu gy_crypt (giữ, hồi sinh như cũ)
- Lối: S → town#north_road (giữ); N → cliffs#south_entry_cl (giữ); E → bonehills#west_entry_bh (giữ); W → nameless#east_entry_nl · exitStrip('W', 18, 23) · 'Mộ Vô Danh · cấp 6+' (MỚI)
- Địa điểm: south_gate_gy, north_gate_gy, east_gate_gy, crypt (giữ); west_gate_gy (MỚI) 'Đường sang Mộ Vô Danh' px(3), px(20)+24, r 60

Giữ hầm mộ, 4 khu mộ, rào sắt, đèn ma, và bia đá cổ gy_stele (đứng ở south_gate_gy, lệch −288px).
Thêm 4 thứ:
1. Đường tây L.path([[21,20],[0,20]]), đặt CÙNG NHÓM path đầu hàm, TRƯỚC các đĩa 'f' (đĩa chỉ đè cỏ nên đường giữ nguyên). Đường chạy ở hàng 20–21, đối xứng nhánh đông, lọt giữa khu mộ tây bắc (y 4–15) và tây nam (y 24–35).
2. L.reserve(1, 20.5, 3).
3. signpost px(2), px(18)+10 và ghost_lantern px(10), px(18) (force). Đèn ma tự hiện khi tấm G1 vẽ xong.
4. Địa điểm west_gate_gy và lối W.
Dãy rand không lệch, vì vòng bia mộ gọi rand theo ô và scatter gọi pick mọi lần.

### Đồi Xương Trắng (bonehills) — có sẵn · hunt

- Địa hình: deadland · cỡ 44×40 (giữ) · cấp 4–6 (gốc 5) · từ 16 tuổi
- Quái: mob_skeleton_archer_001 — Giữ nguyên 5 bãi × 3 con: bh_north_west, bh_north, bh_east, bh_south, bh_far_east.
- Boss: —
- Lối: W → graveyard#east_gate_gy (giữ); E → oldfort#west_entry_of · exitStrip('E', 11, 16) · 'Luỹ Hiệp Sĩ Cũ · cấp 7+' (MỚI)
- Địa điểm: west_entry_bh (giữ); east_gate_bh (MỚI) 'Đường sang Luỹ Hiệp Sĩ' px(41), px(13)+24, r 60

Giữ các bãi xương, cờ trận, rào chông.
Đường đang tắt ở [38,13], nối tiếp L.path([[38,13],[43,13]]) ra mép đông: dấu chân đội hiệp sĩ dẫn về luỹ của họ.
Thêm L.reserve(42.5, 13.5, 3), signpost px(41), px(11)+10 (force), địa điểm east_gate_bh và lối E.
Bãi bh_far_east (39,7) cách đường mới 6–7 ô, không bị đè. Dãy rand không lệch.

### Vách Gargoyle (cliffs) — có sẵn · hunt

- Địa hình: rocky · cỡ 44×40 (giữ) · cấp 5–7 (gốc 6) · từ 16 tuổi
- Quái: mob_gargoyle_001 — Giữ nguyên 5 gờ × 4 con: cl_west, cl_east, cl_sw, cl_se, cl_plaza.
- Boss: —
- Lối: S → graveyard#north_gate_gy (giữ); N → gargoyle_cave#south_entry_gc · exitStrip('N', 23, 28) · 'Hang Gargoyle · cấp 8+' (MỚI)
- Địa điểm: south_entry_cl, ruin_plaza (giữ); north_entry_cl (MỚI) 'Miệng Hang Gargoyle' px(25)+24, px(3), r 60

Mở miệng hang NGAY SAU quảng trường phế tích. Đúng Chương 1 mục 5: gargoyle bay về hang 'như đàn chim về tổ'. Muốn vào hang phải đi qua bầy cl_plaza, như qua lính canh cổng.
1. Vòng đặt hàng vách trên cùng: thêm `if (x === 22 || x === 26) continue;`.
2. L.path([[25,8],[25,0]], 2, 'c') ở cột 25–26, né rune_tablet (23,7) và tượng (27,9).
3. Hai brazier đặt ép ở px(23), px(4) và px(28), px(4) (tự hiện khi có R1).
4. L.reserve(25.5, 1, 3), địa điểm north_entry_cl và lối N.
Các lệnh đặt ép không gọi rand, nên dãy rand không lệch.

### Bãi Bồi Brightwater (riverflats) — MỚI · childhood

- Địa hình: meadow · cỡ 50×42 (2400×2016 px) · cấp Cấp 1 (khu 8 tuổi) · cấp 3–4 (khu 16+) · từ 8 tuổi
- Quái: mob_mushroom_001 — 4 bầy nấm.
Hai bầy tuổi thơ là khu RIÊNG, fromAge 8, untilAge 15, level 1 (máy chủ trao EXP qua privateKill):
- rf_orchard 'Vườn táo bỏ hoang' (9,8) r3: 3 con
- rf_levee 'Bãi cỏ ven đê' (12,36) r3: 3 con
Hai bầy 16+ là khu DÙNG CHUNG:
- rf_oldbed 'Lòng sông cũ' (26,22) r3.5: 4 con, level 3
- rf_east_bank 'Bờ đông' (44,30) r3: 4 con, level 4. Đi qua cầu hàng 14 mới tới.
Khoảng cách tới nước (đã đo): mọi tâm bầy cách nước ≥ 9 ô.
Khoảng cách từ điểm đến: north_entry_rf cách bầy gần nhất 14 ô; south_entry_rf cách 10 ô.
- Boss: —
- Lối: N → town#south_road · exitStrip('N', 20, 24) · 'Thistlewood'; E → mossrift#west_entry_rv · exitStrip('E', 12, 17) · 'Vết Rạn Mossvale · cấp 5+'; S → rivergate#north_entry_vg · exitStrip('S', 20, 24) · 'Hẻm Cửa Sông · cấp 9+ · đường sang vùng 2'
- Địa điểm: north_entry_rf 'Đường về Thistlewood' px(22)+24, px(2), r 60; south_entry_rf 'Đường xuống Hẻm Cửa Sông' px(22), px(39), r 60; east_entry_rf 'Cầu sang Vết Rạn' px(47), px(14)+24, r 60; old_landing 'Bến sông cũ' px(28), px(18), r 80; new_landing 'Bến sông' px(32), px(24)+24, r 100 (chỗ bảng lựa chọn Bến sông của Chương 1); low_well 'Giếng phía thấp' px(17), px(26)+40, r 60; rf_herb_1..4 'Bãi Sương Bạc' (5,30) (16,40) (18,18) (46,38), r 40 (điểm nhặt cho nhiệm vụ sau); willow_isle 'Đảo Liễu' — BÍ MẬT, px(7), px(21), r 50

Bãi bồi hạ lưu, ngay phía nam thị trấn. Bào tử nấm từ Mossvale theo sông trôi xuống mọc ở đây. new Layout(50, 42, 20261201, meta, 'g').

SÔNG
'w' rộng 3, riverX(y) = 45 − round(0,4y) + round(sin(y/5)·1,2).
- y = 0 → cột 45–47, khớp town.
- y = 41 → cột 30–32, khớp rivergate.

ĐƯỜNG
- Đường đất 'd' cột 21–23 chạy suốt bắc–nam, nối đường của town xuống Hẻm.
- Đường ngang hàng 14–15 từ x 24 ra mép đông. Ô 'w' trên đường đặt 'b' (chép cách town dựng cầu), ra cầu ở cột 39–41.
- Lòng sông cũ: L.path([[33,3],[27,10],[26,18],[29,26],[31,31]], 2, 'd'), là dấu sông từng đổi dòng.

BẾN
- Bến cũ đứng trên bùn khô: L.rect(27,17,28,19,'b').
- Bến mới chìa ra dòng nước: L.rect(32,24,34,25,'b').
- Quanh bến mới: crate ×3, barrel ×2, wheelbarrow, bench, lamp ×2 (force, allowRoad).
- Giếng phía thấp: well ở px(17), px(26).

VƯỜN TÁO LỤT (tây bắc)
- Lưới tree / tree_autumn (force), x 4–14 bước 3, y 3–11 bước 3.
- Hàng y 13 chỉ còn stump.
- fence ×5 dọc y 16, haybale ×2.

BÍ MẬT ĐẢO LIỄU
- Hồ L.disc(7,21,4,'w') với đảo L.disc(7,21,1.6,'g').
- Ba ô đá kê 'c' ở (9..11, 21) nối bờ đông với đảo.
- Trên đảo: tree_autumn, rock_mossy, fern, wildflowers.
- Hàng tree bao quanh hồ (force), chừa đúng 1 khe, không có đường mòn.

RẢI
- TREES 80 lần, chỉ ở x < 18 hoặc x > 42 và cách nước ≥ 2 ô.
- GROUND_PLANTS 60 lần.
- [rock_mossy, rock_gray, fern, bush] 40 lần ở ô kề nước.
- signpost ở 3 lối.
- Reserve quanh 3 lối, 2 bến và 4 bầy.
- Decal d1 ×1300.
KHÔNG đặt mushroom_glow / herb_silver.
Mọi đồ vật đều ĐÃ CÓ trong atlas, nên dựng được ngay.

### Vết Rạn Mossvale (mossrift) — MỚI · hunt

- Địa hình: deadland (nền f) · cỡ 46×42 (2208×2016 px) · cấp 5–6 · từ 16 tuổi
- Quái: mob_mushroom_001 (nấm nhiễm sợi đỏ) — 5 bầy dùng chung. Bầy đông hơn Mossvale vì nấm giòn, hạ nhanh: EXP theo thời gian hạ ngang xác sống cùng cấp.
- rv_ring_nw 'Vòng nấm tây bắc' (11,9) r3.5: 5 con, cấp 5
- rv_ring_ne 'Vòng nấm đông bắc' (35,10) r3.5: 5 con, cấp 5
- rv_ring_sw 'Vòng nấm tây nam' (11,32) r3.5: 5 con, cấp 5
- rv_ring_se 'Vòng nấm đông nam' (36,32) r3.5: 5 con, cấp 6
- rv_heart 'Tâm vết rạn' (23,23) r4: 6 con, cấp 6
Điểm đến cách bầy gần nhất: 13 ô (lối bắc), 9,8 ô (lối tây).
- Boss: —
- Lối: N → mossvale#south_entry_mv · exitStrip('N', 20, 25) · 'Rừng Mossvale'; W → riverflats#east_entry_rf · exitStrip('W', 26, 31) · 'Bãi Bồi Brightwater'
- Địa điểm: north_entry_rv 'Đường về rừng Mossvale' px(22)+24, px(2), r 60; west_entry_rv 'Đường xuống Bãi Bồi' px(2), px(28)+24, r 60; rift_heart 'Tâm vết rạn' px(23), px(21), r 150; ward_ring 'Vòng cột trấn' px(23), px(16), r 90; red_thread_1/2/3 'Vòng sợi đỏ' tại (11,9) (35,10) (36,32), r 90. Dùng cho Chương 1 mục 2: 'hạ nấm trong 3 vòng sợi đỏ'.; green_hollow 'Hốc rừng còn xanh' — BÍ MẬT, px(42), px(4), r 50

Rừng bị rút cạn phía nam Mossvale. Đây là vết rạn Quỷ vương từng canh, nơi máy đo của Kiến Trúc Sư hút cạn. new Layout(46, 42, 20261202, meta, 'f').

ĐƯỜNG MÒN 'd' rộng 2
- [[22,0],[22,9],[23,15]] từ mép bắc.
- [[0,28],[8,28],[12,31]] về mép tây.

TÂM VẾT RẠN (23,21)
- L.disc r7 'g', rồi L.disc r2.5 'c' (đá vụn).
- 4 vết nứt 'd' rộng 1 toả ra 4 vòng nấm, cũng là lối đi: [[23,21],[17,15],[11,9]], [[23,21],[29,15],[35,10]], [[23,21],[30,27],[36,32]], [[23,21],[16,27],[11,32]].
- 4 khoảng trống 'g' r4.5 cho 4 vòng nấm.

ĐỒ VẬT
- Vòng cột trấn, cùng bộ S1 với Đá Phong Ấn: pillar_broken ×6 ở bán kính 5 ô (cách nhau 60°), rune_stone (20,16) và (27,16), stone_lantern (21,27) và (26,27).
- Mỗi vòng nấm: cave_mushrooms (CV1, không chặn) ×8, xếp tròn bán kính 3,5 ô.
- Rừng úa từ ngoài vào trong, scatter 1000 lần (canopy) theo khoảng cách d tới tâm: d > 17 dùng TREES, 11 < d ≤ 17 dùng tree_autumn, d ≤ 11 không trồng cây.
- Gần tâm (d ≤ 13): [stump, rock_gray, rock_mossy] 50 lần. Ở rìa: [fern, bush, rock_mossy] 80 lần.
- Bí mật Hốc rừng còn xanh: disc(42,4,2,'g') kín trong rừng. Bên trong bush_flower ×2, wildflowers ×3, chừa 1 khe giữa các gốc cây.
- signpost ở 2 lối. Decal d2 ×1300.
Mọi món đều đã có trong atlas, riêng cave_mushrooms lấy từ CV1 (đã vẽ, chỉ cần khai). Dựng được ngay.

### Mộ Vô Danh (nameless) — MỚI · hunt

- Địa hình: deadland · cỡ 44×40 (2112×1920 px) · cấp 6–7 · từ 16 tuổi
- Quái: mob_zombie_001 — 5 bầy dùng chung:
- nl_trench_1 'Hào mộ bắc' (13,7) r3: 5 con, cấp 6
- nl_trench_2 'Hào mộ giữa bắc' (24,13) r3: 5 con, cấp 6
- nl_trench_3 'Hào mộ giữa nam' (24,27) r3: 5 con, cấp 7
- nl_trench_4 'Hào mộ nam' (12,33) r3: 5 con, cấp 7
- nl_pit 'Hố chôn chung' (8,20) r3: 6 con, cấp 7
Điểm đến cách bầy gần nhất: 18 ô (lối đông), 13,6 ô (lối hầm bắc). Vườn bà goá cách bầy gần nhất 14,8 ô.
- Boss: —
- Lối: E → graveyard#west_gate_gy · exitStrip('E', 17, 22) · 'Nghĩa địa Hoàng Hôn'; N → gargoyle_cave#tunnel_gc · exitStrip('N', 30, 34) · 'Đường hầm của Đoàn · Hang Gargoyle · cấp 9+'
- Địa điểm: east_entry_nl 'Đường về Nghĩa địa' px(41), px(19)+24, r 60; north_entry_nl 'Miệng đường hầm' px(32)+24, px(2), r 60; mass_pit 'Hố chôn chung' px(8), px(20), r 130; lit_lantern 'Ngọn đèn lén thắp' px(35), px(35), r 70; widow_garden 'Vườn nhà bà goá' px(39), px(33), r 90 (nhiệm vụ phụ 'Hàng của người đi xa' của Bram: 'bà goá ở rìa nghĩa địa'); soldier_grave 'Mộ người lính không tên' — BÍ MẬT, px(3), px(3), r 50

Bãi chôn ngoài hàng rào Nghĩa địa. Người thua Chiến tranh Ấn Ký nằm đây, không bia, không tên, nên sợi đất lỏng nhất và người chết ở đây trỗi dậy trước. Map này đối lập với Gian Đá Ghi Tên trong Hang và nối câu 'bia còn đứng thì đất còn giữ được người đã khuất' của y1b. new Layout(44, 40, 20261203, meta, 'g').

ĐỊA HÌNH
- 4 hào đất xới, L.rect 'f': T1 x5–22 y6–8; T2 x16–33 y12–14; T3 x16–33 y26–28; T4 x5–22 y32–34.
- Đường đất 'd' rộng 2, vẽ SAU các hào:
  - Trục chính [[43,19],[12,19],[9,20]] từ cổng đông tới hố.
  - Nhánh bắc [[32,19],[32,0]] lên miệng hầm.
  - Nhánh [[38,20],[38,30]] rộng 1, xuống vườn bà goá.
- Hố chôn chung L.disc(8,20,3,'d').

ĐỒ VẬT
- Rào nghĩa địa nhìn từ phía ngoài: iron_fence ép đặt dọc x = 40, mỗi 1,5 ô từ y 1 tới y 38. Chừa hàng 17–22 làm cổng, bỏ ngẫu nhiên khoảng 25% cho ra rào gãy.
- Mỗi hào: grave_mound mỗi 2 ô dọc giữa hào (bỏ 20%), KHÔNG có bia.
- Miệng hố: coffin ×4, skull_pile ×3.
- Ngọn đèn lén thắp (34–37, 34–37): tomb_broken ×3 khắc tay, cạnh stone_lantern (37,36).
- Vườn bà goá (x 37–42, y 30–35): fence ×6 quây vườn, planter ×2, bench, lamp ×2, wheelbarrow. Có lều thì thêm small_hut (tuỳ chọn).
- Miệng hầm (mép bắc, x 30–34): cave_boulder ×2 + wall_torch ×2 hai bên đường.
- Bí mật mộ người lính: vòng kín bằng dead_bush / rock_gray, chừa 1 khe. Bên trong tomb_cross + broken_sword + war_banner rách.

RẢI
- [tree_dead, tree_dead_flip] 60 lần (canopy).
- [dead_bush, pale_rocks, skull_pile, rock_gray, stump] 90 lần.
- signpost ở 2 lối. Decal d2 ×1200.

Phụ thuộc G1 / B1 / tree_dead đang chờ vẽ. Thiếu hình thì Layout bỏ trống. Vườn bà goá, đèn và miệng hầm đã có hình. Dựng ở ĐỢT 2.
> Ghi chú 10/10/2026: G1 / B1 / tree_dead ĐÃ VẼ, dựng lại 79 → 206 đồ vật (bản thử `.havenlord-stage/assets`, chờ lên game) — mục Hình cần vẽ.

### Luỹ Hiệp Sĩ Cũ (oldfort) — MỚI · hunt

- Địa hình: rocky · cỡ 48×40 (2304×1920 px) · cấp 7–8 · từ 16 tuổi
- Quái: mob_skeleton_archer_001 — 5 bầy dùng chung, bầy nhỏ vì cả bầy cùng bắn đã rất rát:
- of_gate 'Cổng luỹ' (14,16) r3: 3 con, cấp 7
- of_rampart_n 'Tường bắc' (28,9) r3: 4 con, cấp 7
- of_keep 'Sân chính' (28,19) r4: 4 con, cấp 8
- of_rampart_s 'Tường nam' (28,29) r3: 4 con, cấp 8
- of_tower_e 'Tháp canh đông' (43,19) r3: 3 con, cấp 8
Điểm đến cách bầy gần nhất: 12,4 ô (lối tây), 21,8 ô (lối nam).
- Boss: —
- Lối: W → bonehills#east_gate_bh · exitStrip('W', 11, 16) · 'Đồi Xương Trắng'; S → mossvale#northeast_entry_mv · exitStrip('S', 6, 11) · 'Rừng Mossvale · lối tắt về Thistlewood'
- Địa điểm: west_entry_of 'Đường về Đồi Xương' px(2), px(13)+24, r 60; south_entry_of 'Đường xuống rừng Mossvale' px(8)+24, px(37), r 60; fort_keep 'Sân chính luỹ' px(28), px(19), r 150 (chỗ cho một trong '3 thẻ tên'); east_watch 'Tháp canh đông' px(43), px(19), r 90; seal_view 'Mỏm nhìn Đá Phong Ấn' — BÍ MẬT, px(45), px(3), r 50

Luỹ đá của đội hiệp sĩ Đoàn Ấn Ký trên sống núi phía đông Đồi Xương. Rào chông và tháp đều quay về phía ĐÔNG, tức phía vết rạn: họ chết khi rút về giữ thung lũng, đúng Chương 1 mục 4. new Layout(48, 40, 20261204, meta, 'g').

ĐỊA HÌNH
- Đường 'd' rộng 2 [[0,13],[17,13]] tới cổng tây.
- Đường tuần tra ngoài luỹ [[8,15],[8,39]] xuống mép nam.
- Sân trong L.rect(19,8,37,30,'c'), cộng 10 đĩa 'g' r1–2 ngẫu nhiên cho ra đá lát vỡ.
- 4 đĩa 'f' loang bên ngoài luỹ.

ĐỒ VẬT
- Tường luỹ: ruin_wall ép đặt mỗi 1,6 ô quanh chữ nhật x 17–39, y 6–32.
  - Chừa cổng tây ở hàng 12–15, đặt ruin_arch px(17), px(15), đi xuyên được.
  - Chừa cửa ngách đông ở hàng 18–20.
  - Bỏ khoảng 15% cho ra khe vỡ.
- 4 tháp góc (17,6) (39,6) (17,32) (39,32), mỗi tháp stone_stairs + brazier + rock_outcrop.
- Sân chính: rune_tablet (28,16) khắc huy hiệu bảy vòng; war_banner ×4; column_fallen ×3.
- Ngoài tường ĐÔNG: spike_barricade mỗi 2 hàng dọc x = 43 (y 8–30, chừa 18–20). broken_sword ×25 và bone_pile ×15 rải trên x 41–47.
- Bí mật mỏm nhìn Đá Phong Ấn: vòng rock_outcrop / pale_rocks kín, khe 1 ô ở (43,6). Bên trong stone_lantern + rune_stone.

RẢI
- [tree_pine_dry, tree_pine_dry_flip] 40 lần (canopy).
- [boulder, rock_outcrop, pale_rocks, rock_spire, rock_gray] 80 lần ngoài luỹ.
- signpost ở 2 lối. Decal d2 ×900.

Phụ thuộc nặng R1 / B1 / ruin_arch / tree_pine_dry đang chờ vẽ. Dựng ở ĐỢT 2, sau khi chạy queue.sh.
> Ghi chú 10/10/2026: R1 / B1 / ruin_arch / tree_pine_dry ĐÃ VẼ, dựng lại 15 → 190 đồ vật (tường luỹ, vòm cổng tây, 4 tháp góc, rào
> chông, thông khô) — bản thử, chờ lên game. Sân trong để thoáng đúng thiết kế (bãi bắn của cung thủ xương).

### Hang Gargoyle (gargoyle_cave) — MỚI · boss_lair

- Địa hình: rocky (tuỳ chọn bảng màu 'cave', chỉ là code) · cỡ 44×40 (2112×1920 px) · cấp 8–9 · Gargoyle Đá cấp 10 · từ 16 tuổi
- Quái: mob_cave_bat_001 (đã vẽ đủ 4 động tác, cần chủ dự án duyệt; dự phòng: mob_gargoyle_001 cấp 8–9) — 4 bầy dơi dùng chung, mỗi bầy 5 con. Sảnh cửa không có quái.
- gc_roost_e 'Tổ dơi đông' (34,24) r3.5: cấp 8
- gc_pool 'Hồ ngầm' (33,7) r3: cấp 8 (cách hồ 7,5 ô)
- gc_crystal 'Vòm pha lê' (10,6) r3: cấp 9
- gc_statues 'Hành lang tượng' (10,17) r3: cấp 9 (dơi đậu lẫn trên hàng tượng)
Cộng khu boss gc_hall.
Điểm đến cách bầy / boss gần nhất: 13 ô (cửa trước), 11 ô tới boss (cửa hầm). Cả hai đều ngoài tầm aggro 320px của boss.
- Boss: boss_stone_gargoyle_001 — Gargoyle Đá, boss khu.
- Khu gc_hall ở px(14), px(30), radius 2×48, count 1, boss: true, fromAge 16.
- Hồi sinh theo giờ như Vua Lich.
- Tượng canh do Đoàn đặt ba trăm năm trước để giữ Gian Đá Ghi Tên. Hạ nó thì danh sách mở ra.
- Lối: S (28–33) → cliffs#north_entry_cl · exitStrip('S', 28, 33) · 'Vách Gargoyle'; S (3–7) → nameless#north_entry_nl · exitStrip('S', 3, 7) · 'Đường hầm của Đoàn · Mộ Vô Danh'
- Địa điểm: south_entry_gc 'Cửa hang' px(30)+24, px(37), r 60; tunnel_gc 'Đường hầm của Đoàn' px(5)+24, px(37), r 60; name_hall 'Gian Đá Ghi Tên' px(14), px(29), r 150 (Chương 1 mục 6: danh sách có tên bà ngoại của mẹ); brass_meter_spot 'Cỗ máy đo bằng đồng' px(17), px(27)+20, r 50; cave_pool 'Hồ ngầm' px(28), px(9), r 90; glow_grotto 'Hốc nấm sáng' — BÍ MẬT, px(18), px(15), r 50

Hang hình chữ U. Vào ở góc đông nam, đi lên chân đông, vòng qua phía bắc, xuống chân tây, tới gian boss ở tây nam. Đường hầm của Đoàn mở ngay dưới gian boss. new Layout(44, 40, 20261205, meta, 'f'): nền 'f' là khối đá.

KHOÉT SẢNH 'g' VÀ ĐƯỜNG 'd'
1. Sảnh cửa: disc(31,35,4.5), đường rộng 3 [[30,39],[30,31]].
2. Lên tổ đông: [[31,31],[31,28],[34,28]] tới disc(34,24,4.5).
3. Lên bắc: [[34,20],[34,13]] tới sảnh Hồ ngầm disc(30,8,6), trong có hồ L.disc(23,9,2.5,'w').
4. Hành lang bắc: [[26,4],[12,4]] rộng 3, đi phía bắc hồ, tới Vòm pha lê disc(10,6,4.5).
5. Chân tây: Hành lang tượng [[9,10],[9,24]] rộng 3, lát 'c'.
6. Vào gian: [[9,24],[11,26]].
7. Gian Đá Ghi Tên: disc(14,29,5.5) + disc(14,29,4,'c').
8. Đường hầm của Đoàn: [[11,33],[5,35],[5,39]] rộng 2.

SUỐI NGẦM (ý của P3)
L.path([[23,11],[22,20],[23,30],[22,39]], 2, 'w') từ hồ chảy tới mép nam. Suối chặn thật, tách hai chân chữ U, nên không đi tắt xuyên đá giữa hai chân. Mọi bầy cách suối ≥ 7,5 ô.

ĐỒ VẬT
CV1/CV2 đã vẽ, chỉ cần khai id.
- Vòm pha lê: crystal_blue ×6, crystal_purple ×3.
- Hồ ngầm: cave_puddle ×3, hanging_moss ×4.
- Tổ dơi đông: bat_bones ×6, hanging_moss ×3.
- Hành lang tượng: gargoyle_idol mỗi 2 ô ở x 7 và x 12, y 11–23.
- Gian Đá Ghi Tên:
  - stone_altar ở (14,27).
  - rune_stone ×5 xếp nửa vòng bán kính 4,5 phía bắc tế đàn: danh sách 'những người hiến sức'.
  - gargoyle_idol ×6 quanh vành r5, chừa 2 lối vào.
  - wall_torch ×4, skull_candles ×2.
  - Chỗ đặt brass_meter (tuỳ chọn) ở (17,27).
- Đường hầm: broken_beam ×3, mine_cart, iron_chain, wall_torch ×2.
- Bí mật Hốc nấm sáng: khe rộng 1 [[17,6],[17,13]] tới disc(18,15,2.5,'g'). hanging_moss (không chặn) che miệng khe. Bên trong cave_mushrooms ×4, crystal_purple ×2. KHÔNG dùng mushroom_glow.

VÁCH HANG
- Scatter 1600 lần, CHỈ trên ô 'f': [stalagmite, cave_boulder, rock_pillar, rock_gray, rock_mossy]. boulder / rock_outcrop / rock_spire của R1 tự thêm khi có hình.
- wall_torch mỗi khoảng 6 ô, đặt trên ô 'f' kề lối.
- Decal: chỉ sỏi d2 trên 'd', ×700.
Dựng được ngay bằng CV1/CV2 + N1 + S1.

### Hẻm Cửa Sông (rivergate) — MỚI · hunt

- Địa hình: rocky · cỡ 40×44 (1920×2112 px) · cấp 9–10 · từ 16 tuổi
- Quái: mob_gargoyle_001 — 5 bầy dùng chung, đều ở bờ tây/bắc. Bờ bên kia sông là vách, không có bầy, nên không có quái kẹt bên kia nước.
- vg_ledge_n 'Gờ đá đầu hẻm' (9,8) r3.5: 4 con, cấp 9
- vg_altar 'Bệ tượng canh' (18,13) r3: 4 con, cấp 9
- vg_shelf_w 'Bệ đá phía tây' (8,22) r3: 4 con, cấp 9
- vg_gate 'Cổng Đá' (21,24) r3.5: 5 con, cấp 10. Đứng ngay sau vòm, chặn đường.
- vg_mouth 'Cửa hẻm' (14,30) r3: 5 con, cấp 10
Mọi bầy cách nước ≥ 7 ô. Điểm đến cách bầy gần nhất: 13,4 ô (lối bắc), 12,4 ô (lối tây).
- Boss: —
- Lối: N → riverflats#south_entry_rf · exitStrip('N', 19, 24) · 'Bãi Bồi Brightwater'; W → swamp/hub#east_gate · exitStrip('W', 31, 35) · 'Đầm lầy Mù Sương · vùng 2 · cần cấp 10 + đã hạ Quỷ vương' (lối khác vùng, regionGate chặn)
- Địa điểm: north_entry_vg 'Đường về Bãi Bồi' px(21)+24, px(2), r 60; stone_gate 'Cổng Đá Ấn Ký' px(21)+24, px(21), r 110; swamp_gate_vg 'Lối ra khỏi thung lũng' px(2), px(33)+24, r 60 (điểm đến khi từ vùng 2 quay về); gorge_lookout 'Mỏm đá nhìn về đầm' — BÍ MẬT, px(3), px(26), r 50

Hẻm đá nơi sông Brightwater rời thung lũng. Đoàn Ấn Ký xây cổng chắn ở đây, tượng canh quay mặt VÀO thung lũng: họ không canh kẻ đi vào mà canh người mang nút đi ra. Rời quê là phải qua đây; Chương 2 Lior theo sợi đỏ dọc lòng sông vào đầm. new Layout(40, 44, 20261206, meta, 'g').

ĐỊA HÌNH
- Sông 'w' rộng 3, riverX(y) = 30 + round(sin(y/6)·1,5), từ y 0 tới y 36. Vào mép bắc ở cột 30–32, khớp Bãi Bồi.
- Khúc bẻ TÂY NAM: L.disc(31,37,2.5,'w') + L.rect(0,37,32,39,'w'). Sông ra mép tây ở hàng 37–39.
- Bờ đông (x ≥ 33, y < 36) và dải phía nam sông (y ≥ 40): nền 'f' phủ đá, không đi tới được, chỉ để làm cảnh.
- Đường lát đá cổ 'c' rộng 2: [[21,0],[21,33],[0,33]] dọc bờ tây rồi theo bờ bắc khúc bẻ ra lối tây.
- Vách tây x 0–3 là 'f', chừa cửa ra ở hàng 31–35.

CỔNG ĐÁ ẤN KÝ (hàng 20)
- ruin_arch ở px(21)+24, px(21), đặt trên đường, đi xuyên được.
- ruin_wall ép đặt mỗi 1,5 ô từ x 4 tới x 19 và từ x 24 tới x 28, chừa khe vỡ ở x ≈ 7.
- Hai bên vòm: gargoyle_idol (CV2) ở (19,20) và (24,20) quay mặt về bắc; pillar_broken ×2; stone_lantern ×2; rune_stone (17,19) khắc huy hiệu bảy vòng tròn.
- Không có R1 thì tường chưa hiện, nhưng cổng vẫn đứng nhờ S1 + CV2.

VÁCH HẺM
- cliff_rock / cliff_rock_flip ép đặt ở x = 1 mỗi 5 hàng (trừ hàng 31–35) và dọc bờ đông x = 37.
- Thêm 260 lần [cave_boulder, rock_pillar, rock_gray, rock_mossy, stump] trên ô 'f'. boulder / rock_outcrop / rock_spire tự thêm khi có R1.

ĐỒ VẬT KHÁC
- Lối tây: column_fallen ×2, signpost 'Đầm lầy Mù Sương'.
- Bờ sông: fern, bush.
- Bí mật mỏm đá: hốc trong vách tây, khe 1 ô, bên trong stone_lantern + rune_stone.
- Decal d2 ×700.
Phần chính đã có hình (S1, CV1/CV2, N1). Dựng ở ĐỢT 1, vách và tường đổ đầy dần khi có cliff_rock / R1.
> Ghi chú 10/10/2026: cliff_rock / ruin_arch / R1 ĐÃ VẼ — vách đá dọc hai bờ, Cổng Đá có vòm + tường đổ (khe vỡ x ≈ 7–8 vẫn mở),
> 222 → 245 đồ vật (bản thử, chờ lên game).

## Sửa map cũ

- town.ts: đường Bắc–Nam chạy tới mép dưới (`y < TOWN_H`). Thêm signpost px(25), px(49)+10 (force), L.reserve(22, 50.5, 3), địa điểm south_road và lối to_riverflats (S 20–24), khai CUỐI mảng exits. Không dời nhà / NPC / hình nộm / địa điểm nào. Mép tây giữ nguyên.
- mossvale.ts: thêm L.path([[30,35],[34,35],[34,43]]) và L.path([[40,9],[40,0]]) trong nhóm path đầu hàm; L.reserve(35, 42.5, 3) và L.reserve(40.5, 1, 3); 2 signpost; địa điểm south_entry_mv và northeast_entry_mv; lối to_mossrift (S 32–37) và to_oldfort (N 38–43), khai cuối mảng. 5 khu quái, forest_spot_1..6, forest_edge, mob_clearing giữ nguyên.
- graveyard.ts: thêm L.path([[21,20],[0,20]]) trước các đĩa 'f'; L.reserve(1, 20.5, 3); signpost px(2), px(18)+10 và ghost_lantern px(10), px(18) (force); địa điểm west_gate_gy; lối to_nameless (W 18–23). Hầm mộ, Vua Lich và bia gy_stele giữ nguyên.
- bonehills.ts: nối L.path([[38,13],[43,13]]); L.reserve(42.5, 13.5, 3); signpost px(41), px(11)+10; địa điểm east_gate_bh; lối to_oldfort (E 11–16).
- cliffs.ts: hàng vách trên cùng bỏ tảng ở x = 22 và x = 26; L.path([[25,8],[25,0]], 2, 'c'); brazier ở (23,4) và (28,4) (force); L.reserve(25.5, 1, 3); địa điểm north_entry_cl; lối to_cave (N 23–28) → gargoyle_cave#south_entry_gc.
- shrine.ts: KHÔNG đổi.
- Kết quả dựng lại 5 map cũ (diff JSON): town, graveyard, bonehills, cliffs chỉ được mất vài đồ vật trên ô đường mới và có thêm lối / địa điểm / signpost. Riêng mossvale có thêm xáo bụi cỏ (lượt GROUND_PLANTS) và decal, vì đường mới đè lên ô 'g' của khoảng trống. Toạ độ địa điểm, khu quái và lối cũ KHÔNG đổi, nên bản lưu, nhiệm vụ c4–c8 / y1–y3 và vị trí NPC không lệch. Diff ngoài phạm vi này là bất thường.
- Không xoá, không đổi tên id nào đang dùng. Vẫn giữ: home, backyard, plaza, church, north_gate, north_road, river_bank, bridge, east_gate, herb_spot_1..4, west_entry, north_entry, forest_edge, mob_clearing, forest_spot_1..6, south_entry, seal_stone, south_gate_gy, north_gate_gy, east_gate_gy, crypt, west_entry_bh, south_entry_cl, ruin_plaza, mossvale_edge, mossvale_clearing, mossvale_east/south/north, gy_plot_*, gy_crypt, bh_*, cl_*, dummy_backyard, dummy_riverside. Mọi id địa điểm / khu mới đều có hậu tố riêng (_rf, _rv, _nl, _of, _gc, _vg) hoặc tên mới, không trùng id cũ (đã đối chiếu).
- maps/human/index.ts: import 6 builder mới (riverflats, mossrift, nameless, oldfort, gargoyle_cave, rivergate), seed 20261201–20261206. WorldIndex: zones thêm `level`; mỗi map thêm `levels: [min, max]`.
- maps/human/common.ts: MonsterZone thêm `level?: number` và `untilAge?: number`. Biome thêm 'cave' (tuỳ chọn).
- validateRegion thêm 3 luật:
(1) `level` của khu nằm trong khoảng cấp của vùng (human: 1–10).
(2) Tâm khu quái (không phải boss) cách ô 'w' gần nhất ≥ 6 ô, để quái không kẹt bên kia nước.
(3) Khu có fromAge < 16 phải có untilAge ≤ 15.
- props/humanKingdom.ts: khai 2 tấm ĐÃ VẼ (sources/pixellab/sheets, lưới 3×3, ảnh mẫu N1):
- CV1_cave_nature: #0 stalagmite (rock, chặn), #1 crystal_blue (rock), #2 cave_boulder (rock), #3 cave_mushrooms (flower, không chặn), #4 cave_puddle (flower), #5 hanging_moss (flower), #6 rock_pillar (rock), #7 bat_bones (flower), #8 crystal_purple (rock).
- CV2_cave_props: #0 wall_torch (decor), #1 mine_cart (decor), #2 broken_beam (rock), #3 gargoyle_idol (rock), #4 iron_chain (flower), #7 stone_altar (building), #8 skull_candles (flower).
- BỎ CV2 #5 (thùng gỗ, trùng crate) và #6 (biển hang, trùng signpost).
Tổng 16 id.
- packages/asset-pipeline/tests/maps.test.ts:
- Đổi '6 map' thành 12 map.
- Kỳ vọng lối: town ['graveyard','mossvale','riverflats']; mossvale ['mossrift','oldfort','shrine','town']; graveyard ['bonehills','cliffs','nameless','town']; bonehills ['graveyard','oldfort']; cliffs ['gargoyle_cave','graveyard'].
- Thêm kiểm: gargoyle_cave có 1 khu boss count 1; crossRegionExits('human') = [{ from: 'human/rivergate', to: 'swamp/hub', toSpot: 'east_gate' }].
- Thêm ca sai cho 3 luật mới.
- apps/web/tests/nav.test.ts: kiểm lại đường dẫn nhiệm vụ, town ↔ mossvale vẫn 1 bước.
- apps/web/src/game/codex.ts MONSTER_INFO: thêm mob_cave_bat_001 và boss_stone_gargoyle_001 (codex test bắt buộc). Sửa lore 'nơi gặp' của 4 quái cũ: nấm thêm Bãi Bồi / Vết Rạn; xác sống thêm Mộ Vô Danh; cung xương thêm Luỹ Hiệp Sĩ; gargoyle thêm Hẻm Cửa Sông.
- Tài liệu:
- docs/ke-hoach-the-gioi.md mục 1: khung vùng 7 → 12 map = 1 trạm + 10 săn (1 map tuổi thơ, 2 map có boss khu) + 1 thánh địa; tổng ~120 map.
- docs/tools/the-gioi-haven.py: vùng 1 có 12 dòng; Hang Gargoyle ghi 'Dơi hang · đã vẽ'.
- docs/tools/sketch.py: 12 nút, 14 cạnh. Chạy lại để sinh .md / .html và docs/phac-thao-map/vung-1.svg.
- packages/sim/src/regions.ts: chú thích '~7 map' sửa thành 12.

## Hình cần vẽ

> **Cập nhật 10/10/2026 — ĐỢT 2 xong**: nợ cũ đã vẽ hết bằng token #1, 48 lượt, không vẽ lại món nào: 3 tấm `sheets/G1_graveyard`,
> `R1_ruins`, `B1_bonehills` (6 lượt / tấm, ảnh mẫu N1, đúng thứ tự ô đã khai) + 5 món `objects/tree_dead`, `tree_pine_dry`, `crypt`,
> `cliff_rock`, `ruin_arch` (6 lượt / món, đề bài `objects/<món>/args.json`). Dựng lại map vùng 1 không phải sửa code; Nghĩa địa,
> Đồi Xương, Vách, Mộ Vô Danh, Luỹ, Hẻm Cửa Sông hết trống. Bản thử `.havenlord-stage/assets`, chờ lên game. Còn tuỳ chọn: tấm C1_chapter1.
>
> **Cập nhật 10/10/2026 — tấm C1_chapter1 ĐÃ VẼ** (6 lượt token #1, đề bài `sheets/C1_chapter1.png.json`): 192×192 lưới **2 cột × 3
> hàng** (ô rộng 96×64 cho lều / thuyền) thay vì 3×2 — 6 id khai ở `humanKingdom.ts`: `small_hut` (lều gỗ 81×43), `rowboat` (đi xuyên,
> nằm trên nước), `brass_meter`, `beehive`, `reed_clump` (đi xuyên), `mooring_post`. Đặt: cỗ máy đo ngay `brass_meter_spot` (Gian Đá
> Ghi Tên); lều ở góc đông vườn bà goá (giữa hàng chậu cây và ghế / xe cút kít); thuyền neo trên mặt nước cạnh đầu Bến sông + cọc
> buộc ở góc bến; lau sậy rải sát mép nước Bãi Bồi (9) và bờ tây Hẻm Cửa Sông (8) — rải SAU decal; BA thùng ong ở bãi trống phía
> tây nhà Ashvale (Thistlewood, trên sân sau), ép đặt sau mọi món cũ. Diff JSON 12 map: chỉ THÊM 23 đồ vật (town 3, riverflats 11,
> rivergate 8, nameless 1, gargoyle_cave 1), không mất món nào, địa điểm / khu quái / lối / địa hình / decal / world.json không đổi.
> Ảnh xem trước: `packages/asset-pipeline/reports/map-preview/c1-*.png`.

- BẮT BUỘC: 0 lượt PixelLab mới cho cả 12 map.
- ĐÃ VẼ, chỉ cần nạp (0 lượt):
- Tấm CV1_cave_nature + CV2_cave_props: khai 16 id vào humanKingdom.ts.
- mob_cave_bat_001 (Dơi hang) và boss_stone_gargoyle_001 (Gargoyle Đá): sources/pixellab đã có đủ idle / walk / attack / death (đã kiểm từng thư mục animations). Chạy pipeline dựng atlas vào apps/web/public/assets/characters (manifest hiện chỉ có mob_gargoyle_001).
- VFX boss_stone_slam: đổi `later: true` thành false ở packages/asset-pipeline/src/vfx/buildVfx.ts:102. Hình đã map sẵn ở CombatSystem.ts:658.
- NỢ CŨ, đã khai trong humanKingdom.ts nhưng CHƯA VẼ. Không phải yêu cầu mới; thiếu thì cả map cũ lẫn mới đều trống:
- 3 tấm G1_graveyard, R1_ruins, B1_bonehills: đang có trong pending/queue.sh.
- 5 đồ vật lẻ tree_dead, crypt, tree_pine_dry, cliff_rock, ruin_arch: CHƯA có đề bài và chưa vào hàng đợi. Cần thêm vào queue.sh: Pro Flash nhìn chính diện, ảnh mẫu tree_oak_front / N1, khoảng 4–6 lượt mỗi món.
- Atlas hiện chỉ có 36 món, nên Nghĩa địa / Đồi Xương / Vách gần như trống.
- Map mới phụ thuộc bộ này: Mộ Vô Danh (G1, tree_dead) và Luỹ Hiệp Sĩ (R1, B1, ruin_arch, tree_pine_dry) dựng ở ĐỢT 2. Hẻm Cửa Sông và khe hang ở Vách đẹp hơn khi có cliff_rock / ruin_arch / R1, nhưng dựng được ngay.
- TUỲ CHỌN (không bắt buộc): MỘT tấm Pro Flash 'C1_chapter1', lưới 3×2, ảnh mẫu N1, khoảng 6–8 lượt cả tấm. (ĐÃ VẼ 10/10/2026, lưới 2×3 ô rộng, 6 lượt — xem cập nhật đầu mục.) Gồm:
- brass_meter: cỗ máy đo Haven bằng đồng cắm xuống đất, kim và bánh răng, ám khói. Đặt ở Gian Đá Ghi Tên.
- beehive: thùng ong nhà Ashvale, cho cảnh 'kiểm ba thùng ong' của Chương 1.
- small_hut: lều gỗ nhỏ của bà goá ở Mộ Vô Danh, để khỏi dùng lại nhà độc bản của thị trấn.
- rowboat: thuyền gỗ neo ở Bến sông.
- reed_clump: bụi lau sậy không chặn, cho bờ sông Bãi Bồi và Hẻm.
- mooring_post: cọc buộc thuyền.
Không có tấm này thì mọi map vẫn dựng và chơi đủ: địa điểm và thoại vẫn chạy, chỗ đặt bỏ trống.

## Thay đổi luật / dữ liệu (sim, máy chủ, client)

- Cấp quái theo khu (gom từ P1 và P3), đặt trong packages/sim/src/skills.ts để máy chủ và client dùng chung:
- ENEMY_BASE_LEVEL = { mob_mushroom_001: 2, mob_zombie_001: 4, mob_skeleton_archer_001: 5, mob_gargoyle_001: 6, mob_cave_bat_001: 8 }.
- Hàm thuần `enemyStatsAt(type, level?)`. Thiếu level thì trả nguyên ENEMY_STATS, nên 6 map cũ không đổi số nào.
- Có level thì lấy Δ = level − cấp gốc, kẹp −3…+6: hp × 1,15^Δ (làm tròn 5), atk × 1,09^Δ, def + Math.round(0,5Δ) (không âm), exp × 1,12^Δ, xu × 1,1^Δ. Tốc độ, tầm phát hiện, tầm đánh, nhịp đánh giữ nguyên.
- MonsterZoneDef (packages/sim/src/mobs.ts) và kiểu monsterZones ở apps/web MapWorld thêm `level?` và `untilAge?`.
- Số mẫu (hp / công / giáp / EXP / xu):
- Nấm: L1 85 / 6 / 1 / 15 / 4; L3 110 / 8 / 2 / 19 / 4; L4 125 / 8 / 2 / 21 / 5; L5 145 / 9 / 3 / 24 / 5; L6 165 / 10 / 3 / 27 / 6.
- Xác sống: L6 425 / 20 / 5 / 60 / 12; L7 485 / 22 / 6 / 67 / 13.
- Cung xương: L7 300 / 19 / 4 / 63 / 13; L8 340 / 21 / 5 / 70 / 15.
- Dơi hang: L8 330 / 19 / 2 / 70 / 14; L9 380 / 21 / 3 / 78 / 15.
- Gargoyle: L9 585 / 26 / 10 / 93 / 17; L10 675 / 28 / 10 / 104 / 19.
Số con phải hạ mỗi cấp (theo expForLevel): 6→7 khoảng 13 xác sống; 7→8 khoảng 18 cung; 8→9 khoảng 24 dơi; 9→10 khoảng 25–28 gargoyle.
Nấm cấp cao giòn hơn nên ít EXP mỗi con, nhưng hạ nhanh hơn khoảng 2,5 lần, nên EXP theo thời gian ngang xác sống cùng cấp. Vì vậy bầy ở Vết Rạn đông 5–6 con.
- ENEMY_STATS thêm:
- mob_cave_bat_001: { hp 330, atk 19, def 2, speed 78, aggro 240, reach 30, attackCd 1.0, exp 70, coins 14 }. Nhanh hơn người chơi nên không thả diều được; giòn; cắn dồn.
- boss_stone_gargoyle_001: { hp 4600, atk 36, def 12, speed 48, aggro 320, reach 56, attackCd 1.4, exp 800, coins 290 }. Đánh cận chiến + vòng nổ BOSS_AOE chung (hình boss_stone_slam). KHÔNG có ranged, KHÔNG đặt resist, giữ chính sách 'quái vùng 1 chưa đặt resist'.
- Số của boss lấy theo Vua Lich nâng từ cấp 6 lên 10 bằng cùng công thức. Ước Kiếm sĩ cấp 10 đứng đánh khoảng 18–20 giây (Lich 10,4 giây). Ghi thêm một dòng vào bảng thời gian hạ trên ENEMY_STATS, cân lại bằng boss.test.
- Máy chủ:
- apps/server/src/mobs.ts ensure(): `stats = enemyStatsAt(type, z.level)`, lưu level lên con quái.
- economy.sharedKill: nhận EXP / xu từ chỉ số ĐÃ nhân lấy thẳng trên con quái (MobRegistry truyền mob.stats), không tra lại ENEMY_STATS.
- privateKill: nhận thêm zone id từ client, kiểm khu riêng đó trên map đang đứng, trao EXP theo zone.level.
- @havenlord/protocol MobView: thêm `level`.
- Có test máy chủ cho khu có level.
- Client:
- Game.spawnZone và đường quái mạng (tìm khu theo m.zone) truyền level vào CombatSystem.addEnemy (thêm opts.level).
- Không sinh khu có untilAge < tuổi hiện tại.
- Nhãn tên quái hiện 'Cấp N', vì một hình dùng ở nhiều cấp.
- Mũi tên lối ghi sẵn 'cấp N+' trong `label`, không phải sửa code.
- Sửa đếm kill của StoryDirector (P1 phát hiện):
- monsterKilled(monsterId, zoneId). Sự kiện hạ quái mang theo id khu.
- Nhiệm vụ kill có onGive.zone thì CHỈ đếm quái của khu đó. Hiện y2_shadows (không ghi loại quái) đếm MỌI con, còn c8_forest_edge đếm mọi con nấm. Không sửa thì khu nấm 8 tuổi ở Bãi Bồi làm xong c8 ngay ngoài bìa rừng.
- Chặn trẻ em cày EXP:
- Khu tuổi thơ có untilAge 15, nên người 16+ không thấy bầy cấp 1.
- Thêm hằng `CHILD_ZONE_LEVEL_CAP = 3` trong packages/sim: EXP từ khu có fromAge < 16 không đưa nhân vật quá cấp 3. Client và privateKill của máy chủ cùng áp.
- Mục đích: giữ nhịp cấp đã cân tới Quỷ vương (boss.test: đường tối thiểu vừa qua mốc cấp 4).
- packages/sim/src/bossRules.ts BOSS_INTRO thêm boss_stone_gargoyle_001:
['Ba trăm năm canh giữ… và hôm nay đã có kẻ thứ hai tìm tới.', 'Tên khắc trên đá không dành cho mắt ngươi.', 'Đứng yên. Gian này còn chỗ cho thêm một pho tượng.']
Câu đầu hé lộ đã có người tới trước, tức người dùng cỗ máy đo đi qua đường hầm. Hồi sinh theo giờ tự có nhờ khu boss: true + fromAge 16 (isSharedZone).
- codex.ts MONSTER_INFO:
- mob_cave_bat_001 'Dơi hang' · Quái thường · Hang Gargoyle: làm tổ trên hàng tượng, sà xuống cắn rồi vọt lên trần, nhanh và giòn, lửa làm cả bầy hoảng.
- boss_stone_gargoyle_001 'Gargoyle Đá' · Boss khu · Hang Gargoyle: tượng canh Đoàn đặt ba trăm năm trước giữ Gian Đá Ghi Tên; nện hai vuốt làm nứt sàn, đứng ngoài vòng nứt mà đánh.
- Cổng vùng: KHÔNG sửa regions.ts / regionGate, vì đã đòi cấp 10 + hạ boss_demon_001. Lối rivergate W → 'swamp/hub' (điểm đến 'east_gate') qua được validateRegion. Khi dựng vùng 2: hub phải có địa điểm east_gate và lối về 'human/rivergate' với điểm đến 'swamp_gate_vg'.
- packages/sim/src/rewards.ts: mốc maps_70 đổi thành maps_120 (10 vùng × 12). Tuỳ chọn thêm mốc 'Đi khắp Thung lũng Thistlewood' (12 map). maps_5 / maps_10 nay đạt được ngay trong vùng 1.
- Tuỳ chọn (chỉ code, 0 hình): biome 'cave' cho Hang. Thêm vào Biome (common.ts), BIOME_RGB (maps/overview.ts), PALETTES + terrainColor (apps/web groundShade.ts): g = nền hang hsv(30, 0.14, 0.30); f = khối đá hsv(225, 0.12, 0.13). Chưa làm thì Hang dùng rocky.

## Rủi ro

- Dơi hang là loại quái thứ 5. Đề bài nói vùng 1 chỉ có 4 loại có hình, nhưng repo thật đã có mob_cave_bat_001 vẽ đủ idle / walk / attack / death, đúng 'Dơi hang' trong kế hoạch thế giới. CẦN CHỦ DỰ ÁN DUYỆT. (10/10/2026: chủ dự án ĐÃ DUYỆT — giữ Dơi hang ở Hang, lối sang vùng 2 qua Hẻm Cửa Sông, giữ Đường hầm của Đoàn.) Không duyệt thì Hang dùng mob_gargoyle_001 cấp 8–9; gargoyle khi đó có ở 3 map, vẫn đúng luật.
- Nợ hình vùng 1 (ĐÃ GIẢI QUYẾT 10/10/2026 — ĐỢT 2 đã vẽ + dựng, xem mục Hình cần vẽ): G1 / R1 / B1 nằm trong hàng đợi; tree_dead, crypt, tree_pine_dry, cliff_rock, ruin_arch còn chưa có đề bài. Mộ Vô Danh và Luỹ Hiệp Sĩ sẽ trống như Nghĩa địa / Đồi Xương hiện nay. Thứ tự dựng đề xuất:
- ĐỢT 1, làm ngay: sửa 5 map cũ, Bãi Bồi, Vết Rạn, Hang (CV1/CV2), Hẻm Cửa Sông (S1 + CV2).
- ĐỢT 2: chạy queue.sh, thêm 5 món lẻ vào hàng đợi, rồi dựng Mộ Vô Danh và Luỹ.
- Cấp chênh giữa hai map kề nhau:
- Bãi Bồi (1–4) ↔ Hẻm Cửa Sông (9–10).
- Mossvale (1–3) ↔ Luỹ (7–8).
- Mộ Vô Danh (6–7) ↔ cửa hầm vào thẳng gian boss cấp 10.
Đã giảm bằng ba cách: nhãn lối ghi 'cấp N+'; mọi điểm đến cách bầy gần nhất ≥ 10 ô; điểm đến từ hầm cách boss 11 ô, ngoài tầm aggro. Khu 16+ không sinh cho trẻ em. Vẫn nên thử thật với nhân vật cấp 3.
- Đường hầm của Đoàn cho phép bỏ qua cả hang để vào thẳng gian boss từ Mộ Vô Danh. Đây là chủ ý (lối thoát sau boss + cốt truyện 'có người vừa dùng máy đo'), nhưng biến Gargoyle Đá thành boss cày rất tiện. Theo dõi nhịp hồi sinh; nếu cần thì tăng thời gian hồi.
- Quái đuổi theo đường thẳng, chỉ đi vòng tường tạm. Luật 'tâm bầy cách nước ≥ 6 ô' chặn được kẹt bên kia nước. Vách hang và vách hẻm phần lớn vẫn là đồ vật chặn rải dày trên ô 'f', nên còn khe lách được như rừng Mossvale. Riêng suối ngầm tách cứng hai chân chữ U của Hang. Cần đi thử và soi minimap.
- Mossvale không còn 'giữ nguyên byte': hai đường mới đè lên ô 'g' của khoảng trống, nên lượt GROUND_PLANTS và decal phía sau xáo lại. Khu quái, địa điểm và lối giữ nguyên. Diff JSON phải được kiểm tay.
- Sửa đếm kill theo onGive.zone làm y2_shadows chặt hơn: bản lưu đang đếm dở ngoài Khoảng trống Mossvale sẽ không được tính tiếp, số đã đếm thì giữ. Phải kiểm bản lưu đang chạy dở nhiệm vụ này.
- Cấp theo khu đụng cả máy chủ (mobs.ts, economy.ts sharedKill / privateKill, protocol MobView) lẫn client. Chỉ một phía nhân chỉ số là lệch máu / EXP. Vì vậy enemyStatsAt phải đặt ở packages/sim và có test hai phía.
- Một hình dùng ở 2–3 cấp nên người chơi khó phân biệt bầy mạnh với bầy yếu; nhãn 'Cấp N' là bắt buộc. Nấm cấp 5–6 ở Vết Rạn có thể trông như quái tân thủ. Lý do truyện là nấm nhiễm sợi đỏ; không dùng bản đổi màu (luật dự án). Thư viện vẫn một trang mỗi loại.
- Tải máy chủ: quái dùng chung tăng khoảng 120 con (Bãi Bồi 8, Vết Rạn 26, Mộ Vô Danh 26, Luỹ 18, Hang 20 + boss, Hẻm 22). Sổ quái chỉ dựng map khi có người vào, nhưng vẫn nên đo khi đông người.
- Vùng 2 chưa có map nên lối Hẻm → swamp/hub báo 'đang xây dựng'. Đó là hành vi đúng, nhưng người cấp 10 đã hạ Quỷ vương sẽ chạm trần nội dung ở đây. Hướng ra vùng 2 (tây nam qua Hẻm) khác bản phác thảo cũ đặt ở Đá Phong Ấn, cần chủ dự án duyệt.
- Mộ Vô Danh có NPC dân thường (bà goá) đứng trong map có xác sống. Vườn cách bầy gần nhất 14,8 ô là đủ an toàn, nhưng khi viết nhiệm vụ phụ phải đặt NPC đúng điểm widow_garden. Chưa vẽ small_hut thì vườn không có nhà. (10/10/2026: đã có lều `small_hut` từ tấm C1 — lều thấp 81×43, thấp hơn nhân vật, đọc như lều nhỏ / chái gỗ; muốn nhà to hơn thì vẽ món lẻ Pro Flash ~160×192.)

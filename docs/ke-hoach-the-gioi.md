# Kế hoạch thế giới: 10 vùng đất × 12 map (khung chốt 08/10/2026; 12 map / vùng chốt 10/10/2026)

> Danh sách chi tiết từng vùng / map / quái / boss / rồng + trang bị + ngân sách PixelLab (một gói 24$) + bàn giao cho agent sau:
> **`docs/the-gioi-aether.md`** (sinh từ `docs/tools/the-gioi-aether.py`, kèm trang HTML `docs/the-gioi-aether.html`).

Chủ dự án 08/10/2026: thế giới có **khoảng 10 vùng đất** (băng, sa mạc, đầm lầy…). Các map đang có tính là **vùng 1**. Mỗi
vùng **khoảng 3 boss** và **khoảng 7 map con** → **~70 map**. **Chủ dự án 10/10/2026: mỗi vùng 12 map, làm vùng 1 trước** → cả thế
giới **~120 map** (thiết kế vùng 1: `docs/thiet-ke/vung1-12-map.md`, dữ liệu `docs/thiet-ke/vung1-12-map.json`). Luật thế giới đã
chốt từ trước vẫn giữ:

- Mỗi khu săn **chỉ MỘT loại quái**, sinh theo **bầy**.
- Trong một vùng: đi tới mép map thì nạp map kế, có **mũi tên chỉ hướng** ở lối sang (đang chạy).
- Mỗi vùng **một style đồng nhất**: một bộ nền, một loại cây chính, nhà/đồ vật cùng nét PixelLab, không trộn nguồn hình.

## 1. Khung một vùng (12 map — chốt 10/10/2026, trước là 7)

| Map | Số lượng | Nội dung |
|---|---|---|
| **Trạm** (làng / trại / cảng) | 1 | Không quái. NPC nhiệm vụ, thương nhân, thợ rèn / thợ may / thợ cắt tóc (vùng lớn), điểm hồi sinh, **cột dịch chuyển** |
| **Map săn** | 10 | Mỗi map 1 loại quái theo bầy (4–5 bầy 3–6 con). 2 trong 10 map có **hang ổ boss khu** (như Vua Lich ở hầm mộ Nghĩa địa). Vùng 1 có thêm 1 map **tuổi thơ dùng chung** với người lớn (Bãi Bồi: khu riêng cấp 1 cho 8–15 tuổi + khu 16+) |
| **Thánh địa boss chúa** | 1 | Map nhỏ, cuối vùng, chỉ có boss chúa (như Đá Phong Ấn của Quỷ vương). Hạ boss chúa thì mở lối sang vùng kế |

→ **3 boss / vùng** = 2 boss khu (hồi sinh theo giờ, như `regionBoss` hiện tại) + 1 boss chúa (cốt truyện, có chiêu riêng xịn).
→ **5 loại quái thường / vùng** → cả thế giới ~**50 loại quái + 30 boss**, cộng **7 rồng** là boss THÊM (mục 2.1). Một loại quái
dùng ở 2–3 map với **cấp theo khu** (`MonsterZone.level` → `enemyStatsAt` ở `packages/sim/src/skills.ts`, máy chủ và client dùng
chung; nhãn tên quái hiện "Cấp N").

Bố cục trong vùng (vùng 1 làm mẫu — `docs/thiet-ke/vung1-12-map.md` mục Đồ thị lối): trạm ở giữa, các map săn nối thành **vòng
đi được** (mọi lối nối đúng mép đối diện, lối mới của map cũ khai ở CUỐI mảng `exits`), chỉ còn thánh địa và map cửa sang vùng kế
là cụt. Luật mới: tâm bầy cách nước ≥ 6 ô (quái đuổi thẳng — đứng sau nước là kẹt bên bờ), khu tuổi thơ có `untilAge` (EXP khu
tuổi thơ không đưa nhân vật quá cấp 3 — `CHILD_ZONE_LEVEL_CAP`), nhiệm vụ "kill" có `onGive.zone` chỉ đếm quái của khu đó.

## 1.1 Nơi ở của mỗi vùng: làng hoặc toà thành (chủ dự án 08/10/2026)

Chủ dự án: "mỗi vùng sẽ có một ngôi làng hoặc lâu đài, toà thành (chính trị) để còn liên quan đến các nhiệm vụ" + "mua đồ ở các
NPC ở các vùng nữa". Nơi ở chính là map **Trạm** của vùng (bảng mục 1):

- **Làng** (`village`): dân thường nhờ việc, nhiệm vụ nhỏ của vùng. **Toà thành** (`castle`): lãnh chúa / triều đình / hội đồng —
  có chính trị, phe phái, là nguồn nhiệm vụ chính (cốt truyện vùng) và nơi mở thưởng lớn.
- NPC dịch vụ của nơi ở: **người bán hàng** (luôn có), thợ rèn / thợ may / thợ cắt tóc (vùng lớn), **cột dịch chuyển** (luôn có).
  Máy chủ cho mua ở bất kỳ người bán nào trong `MERCHANTS` (`packages/sim/src/shop.ts`) khi đứng cạnh — vùng mới có nơi ở thì
  thêm người bán của nơi đó.
- Danh sách nơi ở (TÊN ĐỀ XUẤT, chủ dự án chốt lại) nằm ở `packages/sim/src/regions.ts` (`settlement`):

| # | Vùng | Nơi ở | Loại | Vai trò |
|---|---|---|---|---|
| 1 | Thung lũng Thistlewood | Thị trấn Thistlewood | làng | quê nhà của Lior — nhiệm vụ tuổi thơ / tuổi 16 |
| 2 | Đầm lầy Mù Sương | Làng nhà sàn Lau Xám | làng | dân đầm lầy nhờ dẹp quái, tìm thuốc giải độc |
| 3 | Sa mạc Hồng Cát | Thành ốc đảo Sahrin | toà thành | vương quốc sa mạc, các tộc tranh nguồn nước |
| 4 | Cao nguyên Gió Hú | Làng Cối Xay Gió | làng | giữ đền thờ trên mây |
| 5 | Lãnh nguyên Băng Giá | Làng gỗ Tuyết Phong | làng | thợ săn, thợ mỏ băng |
| 6 | Núi lửa Hoả Sơn | Pháo đài người lùn Đe Đỏ | toà thành | hội đồng người lùn, rèn binh khí |
| 7 | Quần đảo San Hô | Cảng chài San Hô | làng | làng chài, thương thuyền, tin đồn tàu ma |
| 8 | Rừng Nấm Ngầm | Làng người nấm Ánh Tím | làng | tộc người nấm dưới lòng đất |
| 9 | Phế tích Aether | Toà thành Aether cổ | toà thành | tàn dư triều đình pháp sư, phe phái tranh di sản |
| 10 | Vực Hư Không | Thành trì Hư Không | toà thành | tiền đồn cuối, liên quân các vùng |

## 2. Mười vùng đất (đề xuất — chủ dự án duyệt tên, thứ tự, chủ đề)

Trần cấp **100** (chốt 08/10/2026) → mỗi vùng ≈ 10 cấp: vùng 1 cấp 1–10, vùng 2 cấp 10–20 … vùng 10 cấp 90–100. Mỗi vùng thiên về
một hệ để cây Nguyên tố có ý nghĩa: quái **kháng** hệ của vùng, **yếu** hệ khắc chế, và vùng là nơi rơi đồ của hệ đó.

| # | Vùng | Địa hình / style | Hệ của vùng (quái yếu) | Quái thường (gợi ý) | Boss (2 khu + chúa) |
|---|---|---|---|---|---|
| 1 | **Thung lũng Thistlewood** (đang có) | đồng cỏ, rừng rêu, nghĩa địa, vách đá | Bóng tối (yếu Hoả/Aether) | nấm, zombie, xương cung, gargoyle, + 1 | Vua Lich · **Gargoyle Đá** (mới) · Quỷ vương rừng sâu (chúa) |
| 2 | **Đầm lầy Mù Sương** | bùn, lau sậy, nhà sàn, sương xanh | Thuỷ / độc (yếu Thổ, Phong) | ếch độc, đỉa, người cá bùn, nấm phát quang, rắn nước | Mẹ Ếch · Phù thuỷ đầm · **Hydra bùn** |
| 3 | **Sa mạc Hồng Cát** | cồn cát, ốc đảo, phế tích đá đỏ | Thổ / Hoả (yếu Thuỷ, Băng) | bọ cạp, rắn cát, xác ướp, kền kền, linh hồn cát | Bọ cạp chúa · Pharaoh xác ướp · **Sâu cát khổng lồ** |
| 4 | **Cao nguyên Gió Hú** | đồi cỏ cao, cối xay gió, đền trên mây | Phong (yếu Thổ) | sói gió, chim ưng, tiên gió, đá bay, yêu tinh gió | Đại bàng bão · Pháp sư gió · **Rồng gió** |
| 5 | **Lãnh nguyên Băng Giá** | tuyết, hồ băng, làng gỗ, hang băng | Băng (yếu Hoả) | sói tuyết, người tuyết, tinh linh băng, chim cánh cụt chiến, gấu băng | Yeti · Nữ hoàng băng · **Băng long** |
| 6 | **Núi lửa Hoả Sơn** | đá đen, sông dung nham, lò rèn người lùn | Hoả (yếu Thuỷ, Băng) | thằn lằn lửa, tinh linh lửa, golem dung nham, dơi lửa, quỷ lửa | Golem dung nham · Salamander · **Hoả thần** |
| 7 | **Quần đảo San Hô** | bãi cát, rạn san hô, làng chài, tàu đắm | Thuỷ (yếu Phong, Thổ) | cua, cướp biển, sứa, người cá, bạch tuộc | Thuyền trưởng ma · Cua chúa · **Kraken** |
| 8 | **Rừng Nấm Ngầm** | hang ngầm, nấm khổng lồ phát quang, mạch tinh thể | Thổ (yếu Phong) | nhện hang, người nấm, sâu tinh thể, dơi, golem đá | Nhện chúa · Vua người nấm · **Rồng đất** |
| 9 | **Phế tích Aether** | thành cổ đổ nát, cột ma pháp, máy móc cổ | Aether / thép (kháng phép, yếu Kiếm) | hiệp sĩ ma, vệ binh máy, sách bay, pháp sư mất trí, gargoyle cổ | Hiệp sĩ đầu lâu · Cỗ máy canh giữ · **Đại pháp sư sa đoạ** |
| 10 | **Vực Hư Không** | đảo trôi, nền tím đen, khe nứt không gian | Bóng tối / hỗn hợp | quỷ hư không, mắt bay, bóng người, ác linh, ma sói | Hiệp sĩ hư không · Mẹ quỷ · **Ma vương** (trùm cuối cốt truyện) |

Vùng 1 (10/10/2026): **12 map** theo thiết kế chốt — 6 map cũ + Bãi Bồi Brightwater, Vết Rạn Mossvale, Mộ Vô Danh, Luỹ Hiệp Sĩ
Cũ, **Hang Gargoyle** (boss khu Gargoyle Đá + Dơi hang `mob_cave_bat_001` là loại quái thường thứ 5 — CHỜ CHỦ DỰ ÁN DUYỆT, không
duyệt thì Hang dùng gargoyle cấp 8–9) và Hẻm Cửa Sông (lối sang vùng 2). Trạng thái ĐỢT 1 / ĐỢT 2 ở mục 5.2.

## 2.1 Bảy Rồng Nguyên Tố (chủ dự án 08/10/2026: "có đủ 7 con rồng nguyên tố, sắp xếp hợp lý")

Bảy rồng = 5 nguyên tố của cây (Hoả · Thuỷ · Phong · Băng · Thổ) + **Aether** (năng lực bẩm sinh của nhân vật chính) + **Hắc ám /
Hư Không** (hệ của quái và Ma vương). Rồng là **boss THÊM** (chủ dự án 08/10/2026: "đấy là các con boss thêm, mỗi khu vực 3 boss
thì giữ nguyên") — vùng 4–10 mỗi vùng có thêm một rồng NGOÀI 3 boss ở bảng mục 2. Rồng đặt ở vùng **có cùng hệ** để cảnh,
quái và rồng ăn khớp; thứ tự gặp tăng dần theo cấp. Vùng 1–3 không có rồng (người chơi chưa đủ mạnh; boss chúa vùng 2–3 là Hydra
bùn, Sâu cát khổng lồ — "họ hàng của rồng", báo trước).

| Rồng | Tên riêng (đề xuất) | Vùng · Long Huyệt | Cấp | Hệ — khắc / yếu | Nét riêng (chiêu chính) |
|---|---|---|---|---|---|
| **Phong Long** | Tuyệt Vân | 4 Cao nguyên Gió Hú · đỉnh đền mây | ~40 | Phong — yếu Thổ | bay vòng trên cao, đáp xuống tạo lốc; bão gió đẩy người chơi ra mép vực |
| **Băng Long** | Hàn Sương | 5 Lãnh nguyên Băng Giá · hang băng dưới hồ đóng băng | ~50 | Băng — yếu Hoả | hơi thở băng (làm chậm → đóng băng), mưa trụ băng, mặt hồ nứt |
| **Hoả Long** | Viêm Đế | 6 Núi lửa Hoả Sơn · miệng núi lửa | ~60 | Hoả — yếu Thuỷ, Băng | phun lửa theo nón, mưa thiên thạch, dung nham dâng theo nhịp |
| **Thuỷ Long** | Thương Hải | 7 Quần đảo San Hô · xoáy nước giữa rạn san hô | ~70 | Thuỷ — yếu Phong, Thổ | lặn / trồi chỗ khác, sóng thần quét ngang, làm ướt cả sân (mời phản ứng Băng / Lôi) |
| **Địa Long** | Thạch Cốt | 8 Rừng Nấm Ngầm · đáy hang tinh thể | ~80 | Thổ — yếu Phong | đào đất trồi lên dưới chân, gai đá theo đường thẳng, giáp đá phải phá |
| **Quang Long** | Thiên Huy | 9 Phế tích Aether · tháp ma pháp đổ nát | ~90 | Aether — kháng phép, yếu Kiếm | tia sáng quét, khiên phản phép (phải đổi sang Kiếm), nhân bản ảnh rồng |
| **Hắc Long** | Vô Tận | 10 Vực Hư Không · khe nứt trước cổng thành Ma vương | ~95 | Hắc ám — yếu Aether, Hoả | hố hư không hút người chơi, bóng rồng tách làm ba, tắt sáng một nửa màn |

Bố trí:
- Mỗi rồng ở một **map nhỏ riêng "Long Huyệt"** (map phụ, đi vào từ một map của vùng như cột trên; KHÔNG tính vào 12 map của
  vùng) — sân đủ rộng cho đông người đánh rồng, không lẫn quái thường. Cả thế giới: 30 boss của các vùng + 7 rồng.
- **Đủ cấp mới được vào Long Huyệt** (chủ dự án 08/10/2026: "đủ cấp mới được vào, đủ level để mở chiêu cuối ấy"): cổng Long
  Huyệt đòi **cấp mở chiêu cuối (mốc 10)** — chưa dùng được tuyệt kỹ thì chưa được tranh Long Châu. Hiện mốc 10 chỉ tính theo
  điểm (29 điểm ⇒ sớm nhất **cấp 25** nếu dồn hết một nhánh), con số đó thấp hơn mọi con rồng (~40–95) nên cổng gần như vô nghĩa.
  **Đề xuất**: một hằng `ULTIMATE_LEVEL = 40` (= `TALENT_LEVEL_CAP`, lúc đủ 47 điểm) dùng chung cho cả hai: mốc 10 cần **cấp 40 +
  Long Châu** của hệ, Long Huyệt cần **cấp 40**. Rồng đầu tiên (Phong Long) cũng ~40 nên khớp; rồng sau đã tự có cổng theo vùng
  (phải qua boss chúa vùng trước mới tới). Hiện chưa nhánh nào có mốc 10 (trần đang là mốc 9) nên thêm điều kiện cấp không làm
  ai mất kỹ năng đang có.
- Rồng **không chặn cốt truyện**: mở vùng kế vẫn là hạ boss chúa (như Quỷ vương hiện tại). Rồng là mục tiêu tuỳ chọn, khó, để
  tranh Long Châu.
- **Trùng tên phải lưu ý**: boss chúa vùng 4 / 5 / 8 sẵn tên **Rồng gió / Băng long / Rồng đất** — giữ nguyên theo bảng. Đề xuất
  cốt truyện coi chúng là rồng thường (con cháu canh cửa Long Huyệt), còn Phong / Băng / Địa Long là rồng nguyên tố cổ đại; muốn đỡ
  nhầm thì đổi tên ba boss chúa đó (mục 7).

**Cơ chế — ĐÃ CHỐT 08/10/2026** (chủ dự án: "đúng đấy, nên làm thế" — giữ nguyên cả bốn điểm, tên riêng giữ như bảng):
- **Boss thế giới dùng chung** (nối M3.2 quái dùng chung): mọi người trong Long Huyệt đánh chung một con rồng, hồi sinh theo giờ
  (~1–2 giờ, có thông báo toàn máy chủ khi rồng thức), ai góp đòn đều được tính công (EXP, xu, top sát thương — mục 2.2).
- **Long Châu** — **CHỈ người DỨT ĐIỂM (đòn cuối) mới có** (chủ dự án 08/10/2026: "phải dứt điểm mới có thể có Long Châu"): mỗi
  rồng rơi một viên Long Châu hệ của nó cho người kết liễu. Long Châu của 5 hệ cây là **điều kiện mở tuyệt kỹ mốc 10** của hệ đó (GĐ4: Phượng Hoàng cần Long Châu Hoả…) — tuyệt kỹ có ý nghĩa cốt truyện thay vì chỉ cộng điểm.
- **Đủ 7 Long Châu** → về Thistlewood triệu hồi **Thần Long**, chọn MỘT điều ước (mỗi nhân vật một lần): rồng con thú cưng / thú
  cưỡi rồng, bộ skin "Long Kỵ Sĩ", danh hiệu "Người Gom Bảy Châu", hoặc một lượng kim cương. Có thêm vào **NPC Thành tựu** (hạ đủ
  7 rồng) và trang **Thư viện** riêng cho rồng.
- **Hình**: rồng là sprite cỡ lớn (192–256px) + nhiều chiêu → token TRẢ PHÍ, ước ~250 lượt / rồng (nhân vật + 4 hướng + động tác
  + 3–4 chiêu) ≈ **1.750 lượt** cho cả bảy — vẽ theo thứ tự mở vùng, không vẽ trước.

## 2.2 Săn boss — định nghĩa + chia phần thưởng (chủ dự án 08/10/2026: "tranh nhau boss, định nghĩa săn boss")

**Boss săn được** = boss DÙNG CHUNG trên thế giới: boss khu (2 / vùng) + **7 rồng** (mục 2.1) — chạy trên sổ quái của máy chủ
(M3.2). Boss chúa là boss cốt truyện (mỗi người tự hạ để mở vùng kế, như Quỷ vương vùng 1) — không thuộc diện săn.

**Vòng đời một boss**: ngủ → **thức** (hết giờ hồi sinh; thông báo cả máy chủ với rồng / cả vùng với boss khu; Thư viện + bản đồ
tổng hiện đồng hồ) → giao chiến → **cuồng nộ** khi còn 25% máu (đánh mạnh hơn, chiêu riêng) → **gục** → ngủ lại (boss khu ~15–30
phút, rồng ~1–2 giờ).

**Ai được gì khi gục** (máy chủ tính — client không quyết):

| Hạng | Điều kiện | Phần thưởng |
|---|---|---|
| **Tham gia** | gây ≥ 1% máu tối đa của boss trong 60 giây gần nhất | EXP + xu chia theo % sát thương; lần hạ ĐẦU TIÊN: ghi vào Thư viện + NPC Thành tựu — ai góp đủ cũng nhận, không phải tranh |
| **Top sát thương** | 3 người gây nhiều sát thương nhất | thêm một rương vật liệu hiếm |
| **Kết liễu** (đòn cuối) | người gây đòn làm boss về 0 — máy chủ xác định theo thứ tự đòn tới (đã có: `mobDie.by`) | **Long Châu** (rồng — CHỈ người kết liễu) + **Rương Kết Liễu**: tỉ lệ cao ra trang bị hiếm của boss + mảnh skin / rồng con + chút kim cương; danh hiệu "Kẻ Kết Liễu <boss>" (lần đầu); ghi vào **bảng Săn Boss** |

- **Long Châu phải TRANH (chốt 08/10/2026)**. Rồng không chặn cốt truyện nên người mới vẫn đi tiếp được, còn tuyệt kỹ mốc 10
  (cần Long Châu) và Thần Long là phần thưởng của người dứt điểm được rồng. Đòn Kết Liễu (mục 2.8 của
  `ke-hoach-nguyen-to.md`) vì vậy là kỹ năng then chốt của săn rồng: giữ nó chờ đúng lúc rồng dưới 25% máu.
- **Cần chốt thêm** (mục 7): (a) người dứt điểm đã có viên Long Châu đó rồi thì sao — vẫn nhận (thêm một viên dư)
  hay viên đó thuộc về ai khác? (b) một con rồng mỗi 1–2 giờ cho cả máy chủ thì khi đông người, Long Châu rất hiếm — có tách
  "kênh" (mỗi kênh một con rồng) hoặc rút giờ hồi sinh không?
- **Tổ đội**: người kết liễu trong tổ đội → mỗi thành viên có mặt cũng nhận một Rương Kết Liễu nhỏ hơn (khuyến khích đi nhóm).
- **Chống "lách"**: máu boss tăng theo số người đang đánh (căn bậc hai — đông người vẫn nhanh hơn nhưng không áp đảo); đòn kết
  liễu chỉ tính khi người đó đã góp ≥ 1% máu (không đứng ngoài chờ đánh nhát cuối); kiểm tầm / nhịp đòn như quái thường.
- **Bảng Săn Boss** (thẻ trong Thư viện): số lần kết liễu, top sát thương theo tuần, boss nào sắp thức.
- Phụ thuộc: sổ quái máy chủ (M3.2 — đã có `credit` + `by`), máy chủ nắm sát thương / phần thưởng (M3.3) để rương không bị gian lận.

## 3. Đi lại giữa các vùng + bản đồ tổng

- **Trong vùng**: như hiện tại (đi tới mép, mũi tên chỉ lối).
- **Sang vùng khác** (địa hình khác hẳn): lối ra ở thánh địa hoặc ở map săn cuối dẫn tới **"Cổng vùng"**: màn chuyển vùng
  có tên + tranh vùng mới, nạp `maps/<vùng mới>/world.json`, xuất hiện ở trạm của vùng mới. Vùng chưa mở (chưa hạ boss chúa
  vùng trước / thiếu cấp) thì cổng báo điều kiện và không cho qua.
- **Cột dịch chuyển ở mỗi trạm**: đã tới trạm nào thì dịch chuyển về đó được (tốn ít xu) — 10 vùng mà phải đi bộ lại thì
  chán.
- **Bản đồ tổng (phím M / nút trên HUD)**: một tranh lục địa vẽ tay kiểu pixel (PixelLab, token trả phí), 10 vùng đặt
  trên đó. Vùng chưa tới thì phủ sương; vùng đã tới hiện tên + cấp khuyên dùng; bấm vào vùng thì xem 12 map con (dùng
  minimap đang có) + vị trí boss đã gặp. Tranh vẽ một lần cho cả lục địa ngay từ đầu (để vị trí 10 vùng cố định), vùng
  chưa làm thì để sương.
- **ĐÃ LÀM 10/10/2026 (chủ dự án: "cần cải tiến màn xem map để xem được map tổng")** — màn phím M (hoặc chạm bản đồ nhỏ) có
  **3 tầng**, chuyển bằng 3 thẻ ở đầu khung (cùng kiểu thẻ Hành trang); mở lần đầu là Khu vực như cũ, sau đó nhớ tầng đã chọn tới
  khi tải lại trang (`mapTab` của store):
  - **Khu vực** = bản đồ map đang đứng như trước (`WorldMapArea.tsx`).
  - **Vùng** = sơ đồ các map của vùng (`WorldMapRegion.tsx`): nút map (tên, khoảng cấp, trạm / boss chúa / boss khu), đường nối
    theo lối thật của `world.json`, map đang đứng viền vàng + "Bạn ở đây", map CHƯA TỚI viền nét đứt + chữ nhạt (máy chủ trả mọi
    map đã tới kèm tin `hubs` — trường `maps` mới, tuỳ chọn; máy chủ bản cũ / chơi đơn thì không làm mờ), cổng sang vùng khác là
    nút nét đứt ghi trạng thái cổng (bấm → tầng Thế giới chọn sẵn vùng đó). Màn rộng: nút có ảnh minimap thu nhỏ; điện thoại / màn
    thấp: nút chữ, sơ đồ cuộn trong khung, mở ra căn giữa map đang đứng.
  - **Thế giới** = tranh lục địa (`WorldMapWorld.tsx`) — xem mục 3.1.
  Phần "vị trí boss đã gặp" trên tầng Vùng chưa làm (nút map mới ghi boss có ở map nào).
- Máy chủ game: id map hiện là `mapId` trong một vùng → đổi thành `vùng/map` (vd `human/town`) để ~120 map không trùng tên;
  bản lưu cũ tự thêm tiền tố `human/`.

### 3.1 Tranh lục địa — VẼ TRƯỚC (chủ dự án 08/10/2026: "vẽ trước cái map tổng xong rồi sẽ làm map dần dần")

Vẽ MỘT lần bằng `create_image_pro` khổ **688×384** (16:9, tối đa của công cụ, 20–40 lượt), không chữ/nhãn — tên vùng, sương,
đường đi vẽ bằng code đè lên. Lệnh: `npm run assets:pixellab -- pro <token#> sources/pixellab/world/continent.png @args.json`
(args lưu cạnh ảnh ở `continent.png.json`). Bố cục cố định theo hướng (đề bài gửi PixelLab đặt đúng như vậy):

| Vị trí trên tranh | Vùng |
|---|---|
| Giữa | 1 Thung lũng Thistlewood |
| Tây Nam | 2 Đầm lầy Mù Sương |
| Nam | 3 Sa mạc Hồng Cát |
| Đông Bắc | 4 Cao nguyên Gió Hú |
| Bắc | 5 Lãnh nguyên Băng Giá |
| Đông | 6 Núi lửa Hoả Sơn |
| Đông Nam (đảo) | 7 Quần đảo San Hô |
| Tây | 8 Rừng Nấm Ngầm |
| Tây Bắc | 9 Phế tích Aether |
| Góc Đông Bắc ngoài khơi (đảo trôi) | 10 Vực Hư Không |

Vẽ xong: duyệt bằng mắt (đủ 10 vùng, đúng hướng, không chữ), rồi khai toạ độ tâm + vùng bao từng vùng (tỉ lệ 0–1 theo ảnh)
trong dữ liệu bản đồ tổng → làm UI phím M (mục 3). ~~Hiện xếp hàng chờ vì PixelLab đang khoá lượt miễn phí~~ — ĐÃ VẼ 09/10/2026
(token #1, `continent.png` + đề bài `continent.png.json`, đúng bố cục bảng trên).

**ĐÃ NỐI vào game 10/10/2026 (tầng Thế giới của màn phím M — dựng vào bản thử, CHƯA lên bản thật):**

- **Ảnh vào web**: `npm run assets:world` (pipeline, lệnh `world`) kiểm khổ 688×384 + ảnh kín rồi chép NGUYÊN file sang
  `assets/ui/world-continent.png` (tên file mới). Dựng thử: `AETHER_WEB_ASSETS=D:/nttrg/pixel/.aether-stage/assets npm run
  assets:world` (đường dẫn TUYỆT ĐỐI — lệnh chạy trong thư mục gói pipeline, đường dẫn tương đối sẽ ghi lạc vào đó). Triển khai =
  chép `.aether-stage/assets/ui/world-continent.png` sang `apps/web/public/assets/ui/` (hoặc chạy lệnh không đặt biến).
- **Toạ độ 10 vùng**: `apps/web/src/game/world/worldAtlas.ts` — `CONTINENT_PLACES[vùng] = { center, outline }`, tỉ lệ 0–1 theo
  ảnh: `center` = tâm (nhãn tên + cấp, dấu "Bạn ở đây"), `outline` = đường bao (đa giác theo chiều kim đồng hồ; hai vùng kề nhau
  DÙNG CHUNG đỉnh ở đường ranh) dùng để bắt rê / chạm, viền tô sáng và làm tối vùng chưa mở. Đo trên ảnh lưới 0,025 (ranh = dãy núi
  / sông vẽ sẵn trong tranh). Vẽ lại tranh khác bố cục thì đo lại ở đây; test `apps/web/tests/worldmap.test.ts` kiểm đủ 10 vùng
  khớp `regions.ts`, trong 0–1, đúng hướng bảng trên, tâm nằm trong đường bao của chính vùng đó và không lọt vùng khác, các đường
  bao không chồng nhau, ảnh trong web giống từng byte ảnh nguồn. Hệ của vùng (thẻ vùng ghi "Nguyên tố") khai ở `regions.ts`
  (`element`), điều kiện cổng dạng cấu trúc `regionNeeds` (cổng vùng `regionGate` dùng chung).
- **Hiển thị**: tranh hiện nguyên lần — 2× khi cả tranh lẫn thẻ vùng vừa màn (≈ màn 1920×1080 trở lên), không thì 1×; thiếu chỗ
  (điện thoại) thì cuộn trong khung, mở ra căn giữa vùng đang đứng; `image-rendering: pixelated`. Đè lên bằng GIAO DIỆN (không vẽ
  art): nhãn chữ tên + cấp trên nền sẫm trong mờ, "Bạn ở đây", viền vàng vùng đang ở / đang rê, vùng chưa mở làm tối nhẹ bằng một
  bản sao ảnh cắt theo đường bao (`clip-path: path()` gộp mọi vùng thành một đường — không lộ khe) + lọc màu: đang xây dựng tối hơn
  vùng đã có map mà cổng còn đóng. Rê / chạm vùng → thẻ nhỏ: tên, thứ tự + cấp, nguyên tố + hệ quái yếu, nơi ở + một câu giới
  thiệu, trạng thái (Bạn đang ở đây / Đã mở / Cần cấp 10 + hạ Quỷ vương rừng sâu / Đang xây dựng). Thẻ nằm dưới tranh khi dư chỗ
  (máy tính, điện thoại dọc — chưa rê vùng nào thì là thẻ vùng đang đứng), màn ngang thấp thì đè lên góc tranh xa vùng đang xem.
  Chuột: bấm vùng đang mở → tầng Vùng của vùng đó; cảm ứng: chạm lần đầu chọn, chạm lại (hoặc nút "Xem các map") mới sang.
- **Phòng thử** (chỉ dev): `/lab/map?tab=area|region|world&map=human/graveyard&level=12&kills=boss_demon_001&visited=town,mossvale&ready=swamp&pick=swamp`
  — dữ liệu người chơi giả, map + ảnh thật, không cần đăng nhập.

## 4. Hình cho mỗi vùng (PixelLab) + chi phí lượt

| Hạng mục / vùng | Cách vẽ | Token | Lượt ước tính |
|---|---|---|---|
| Nền đất + đường (bảng màu, nhiễu) | code (`groundShade`) — đổi bảng màu theo vùng | — | 0 |
| Đồ vật / cây / đá / nhà của vùng | 4–5 tấm Pro Flash 3×3 cùng ảnh mẫu style | miễn phí | ~30 |
| Trạm (nhà chính diện viền đen, quầy, cột dịch chuyển) | 2 tấm | miễn phí | ~12 |
| 5 quái thường (tạo + 8 hướng + đi + đánh + chết) | nhân vật PixelLab + `animimg` | miễn phí | ~5 × 40 = 200 |
| 3 boss (nhân vật lớn + động tác) | nhân vật Pro, khổ lớn | **trả phí** | ~3 × 60 = 180 |
| Chiêu boss (2–4 chiêu/boss, mỗi chiêu 12–16 khung) | Pro Flash + `animate_image` | **trả phí** | ~3 × 120 = 360 |
| Tranh vùng (màn chuyển vùng) + minimap | Pro Flash | trả phí | ~15 |
| **Cộng một vùng** | | | **~240 miễn phí + ~550 trả phí** |

→ **Đã chốt lại 08/10/2026** (chủ dự án: "tập trung vào nhân vật của người dùng và boss"): boss vẽ đủ như bảng trên, quái thường cắt còn 3
loại mới + 2 bản đổi màu mỗi vùng → mỗi vùng mới ~650 lượt — phân bổ đầy đủ ở `docs/pixellab-ke-hoach-ve.md` mục Phân bổ lượt.
Ước tính cũ (vẽ riêng tất cả): → 9 vùng mới ≈ **2.200 lượt miễn phí** (15 token × 5 lượt/đêm ≈ 75/ngày → ~1 tháng rải đều) + **~5.000 lượt trả phí**
(Tier 1 = 2.000/tháng → **~2,5 tháng** chỉ riêng boss/chiêu boss, chưa kể skill người chơi và trang phục ở
`docs/pixellab-ke-hoach-ve.md`). Vì vậy **làm từng vùng một**, không vẽ dàn trải: vùng nào xong hình thì mở vùng đó.
Logic vẫn theo luật "làm trước, có hình thì thay": vùng có thể chạy trước bằng quái/boss mượn hình vùng cũ nhuộm màu,
ghi rõ chỗ nào đang tạm.

## 5. Phần code dùng chung (làm một lần, trước vùng 2)

1. **Nhiều vùng**: id map `vùng/map`, `WorldIndex` nạp nhiều `world.json`, lối ra khác vùng (`exits.to = 'swamp/hub'`), máy
   chủ chấp nhận id mới + chuyển bản lưu.
2. **Cổng vùng + điều kiện mở** (boss chúa vùng trước, cấp tối thiểu) + màn chuyển vùng.
3. **Cột dịch chuyển** ở trạm + danh sách trạm đã tới (lưu ở máy chủ).
4. **Bản đồ tổng** (UI): tranh lục địa + sương + bấm vùng xem map con — ĐÃ LÀM 10/10/2026 (mục 3, 3.1: màn phím M ba tầng).
5. **Kháng / yếu hệ của quái** (`ENEMY_STATS.resist`): nhân sát thương theo hệ — để mỗi vùng có lý do đổi build/phủ phép.
6. **Bảng cấp vùng**: cấp quái, exp, xu, bảng rơi đồ theo vùng (nối với kế hoạch đồ đạc/kinh tế).
7. **Công cụ dựng map vùng mới** trong pipeline: khung 12 map + bộ đồ vật của vùng → map JSON + minimap (pipeline `map` đang
   dựng vùng `human`, cần tham số hoá theo vùng).

## 5.1 Khung nhiều vùng — ĐÃ LÀM phần lớn T0b (08/10/2026)

- **Danh sách 10 vùng dùng chung** `packages/sim/src/regions.ts`: tên, thứ tự, cấp, trạm, chỗ đứng cột dịch chuyển, boss chúa, nơi ở,
  `ready` (đã có map). Hiện chỉ vùng 1 `ready`.
- **Id map `vùng/map`** ở mọi chỗ (bản lưu, máy chủ, quái dùng chung, thành tựu thám hiểm — đã như vậy từ trước). Lối ra có thể trỏ
  sang vùng khác (`exits.to = 'swamp/hub'`); vào game nạp đúng vùng của bản lưu (vùng chưa mở / hỏng → vùng đầu).
- **Cổng vùng** (`regionGate`): vùng chưa có map → "đang xây dựng"; đủ map thì cần cấp ≥ cấp đầu của vùng + đã hạ boss chúa vùng
  trước (đếm từ Thư viện ở client — cả boss cốt truyện). Bước vào lối khi cổng đóng: bị đẩy lùi + báo. Qua cổng: **màn chuyển vùng**
  (tên vùng, cấp khuyên dùng, một câu giới thiệu — tranh vùng PixelLab vẽ sau). Trước M3.3 cổng chỉ kiểm ở client.
- **Cột dịch chuyển** ở trạm của mọi vùng đã mở (NPC dịch vụ, hình TẠM `stone_lantern`; Thistlewood: góc tây nam quảng trường): bảng
  10 vùng theo thứ tự, trạm đã từng đặt chân tới (máy chủ trả `hubs` từ bảng `visited_maps`) thì dịch chuyển được, 20 xu / lần.
- **NPC theo vùng**: `NpcDef.region` (thiếu = vùng đầu) — địa điểm trùng tên ở trạm vùng khác không kéo NPC cốt truyện vùng 1 sang.
- **Kháng / yếu hệ** của quái: `ENEMY_STATS.resist` (hệ số theo hệ, kẹp 0,25–3) nhân vào đòn trúng + nhịp cháy. Quái vùng 1 CHƯA đặt
  (giữ cân bằng hiện tại) — quái vùng mới khai theo hệ của vùng (mục 2).
- **Cân độ khó vùng 1 (09/10/2026)** — chủ dự án: "tăng máu quái cho khó hơn, boss cũng mạnh hơn": quái thường MÁU ×1,6 + EXP / xu
  ×1,2; boss MÁU ×2,2, CÔNG ×1,25, nhịp đánh `attackCd` ×0,9 + EXP / xu ×1,4 (`ENEMY_STATS` — bảng thời gian hạ cũ → mới ghi ngay
  trên bảng; máy chủ đọc chung bảng, không có trần sát thương theo máu quái). Quái / boss vùng mới cân từ mức này.
- **Pipeline**: `npm run assets:map -- <vùng>` (mặc định `human`); vùng mới khai ở `packages/asset-pipeline/src/maps/regions.ts`. Lối
  sang vùng khác không bắt map đích trong vùng này (kiểm chéo khi dựng vùng kia — `crossRegionExits`). Dựng lại vùng 1 trước 10/10/2026:
  không đổi byte nào; từ bản 12 map, 5 map cũ chỉ đổi đúng phần thiết kế cho phép (mục 5.2).
- Thử thật (máy chủ thử + vùng THỬ tạm chép từ Đá Phong Ấn, xoá sau khi thử): cổng báo "đang xây dựng", sang vùng thử có màn chuyển
  vùng + minimap / tên khu / lối đúng vùng, quay lại vùng 1, cột dịch chuyển mở bảng. Test: `apps/server/tests/regions.test.ts`,
  `packages/asset-pipeline/tests/maps.test.ts`.
- **Chưa làm**: ~~bản đồ tổng~~ (đã làm 10/10/2026 — mục 3.1), bảng cấp / rơi đồ theo vùng (mục 5.6 — làm cùng vùng 2), dẫn đường nhiệm
  vụ XUYÊN vùng (tìm đường hiện trong một vùng; nhiệm vụ mới chỉ có ở vùng 1).

## 5.2 Vùng 1 — 12 map (thiết kế chốt 10/10/2026) — Tiến độ

Thiết kế: `docs/thiet-ke/vung1-12-map.md` (+ `.json`). 12 map, 14 cạnh trong vùng + 1 lối sang vùng 2 (Hẻm Cửa Sông → `swamp/hub`
điểm đến `east_gate`; khi dựng vùng 2: hub phải có địa điểm `east_gate` + lối về `human/rivergate` điểm đến `swamp_gate_vg`).

**ĐỢT 1 — ĐÃ DỰNG + LÊN BẢN THẬT 10/10/2026** (12 map đang chạy trên Funnel; bản thử `.aether-stage/assets`, máy chủ thử
:3201 chạy với `AETHER_MAPS=.aether-stage/assets/maps`):
- Luật / dữ liệu: cấp quái theo khu (`MonsterZone.level` → `enemyStatsAt` + `ENEMY_BASE_LEVEL` ở `packages/sim/src/skills.ts`; khu
  không khai cấp giữ nguyên `ENEMY_STATS` nên 6 map cũ không đổi số nào). Máy chủ: sổ quái nhân chỉ số theo cấp, `sharedKill` trao
  EXP / xu theo chính con quái, `privateKill` nhận id khu + kiểm khu riêng đó trên map đang đứng, `MobView.level`. Client: sinh quái
  theo cấp, nhãn tên "Cấp N", không sinh khu đã quá `untilAge`. Khu tuổi thơ (`fromAge` < 16) có `untilAge` ≤ 15; EXP từ khu tuổi
  thơ không đưa nhân vật quá cấp 3 (`CHILD_ZONE_LEVEL_CAP`, cả client lẫn máy chủ). Nhiệm vụ "kill" có `onGive.zone` chỉ đếm quái
  của khu đó (y2_shadows, c8_forest_edge). Mốc thành tựu `maps_70` → `maps_120`.
- Quái / boss mới: Dơi hang `mob_cave_bat_001` (Hang, cấp 8–9) + boss khu Gargoyle Đá `boss_stone_gargoyle_001` (cấp 10, hồi sinh theo
  giờ, vòng nổ `boss_stone_slam`): chỉ số, Thư viện, 3 câu thoại, atlas (duyệt bằng mắt 10/10/2026 — dơi bỏ động tác đánh hướng bắc
  vì lỗi hình; Gargoyle Đá đi hướng bắc cánh sẫm hơn, tạm giữ), VFX vào atlas.
- Map: 5 map cũ chỉ thêm lối (khai CUỐI mảng `exits`) / địa điểm / biển / đường (so JSON trước–sau: địa điểm, khu quái, lối cũ
  KHÔNG đổi; Mossvale xáo lại vài bụi cây + decal sau đường mới đúng như thiết kế dự báo; Vách lát khe lên hang sau khi rải decal để
  decal không lệch). Bãi Bồi Brightwater, Vết Rạn Mossvale, Hang Gargoyle (tấm CV1 / CV2), Hẻm Cửa Sông dựng đủ bằng hình đã có.
- Pipeline (`validateRegion`): cấp khu nằm trong khoảng cấp vùng; tâm bầy quái thường cách nước ≥ 6 ô; khu tuổi thơ tự sinh phải có
  `untilAge` ≤ 15; lối hai chiều ở hai mép đối diện. `world.json`: `level` từng khu + `levels` [thấp, cao] của map.
- Test: `packages/asset-pipeline/tests/maps.test.ts` (12 map, luật mới), `apps/web/tests/nav.test.ts` (vùng kín làm cảnh — lõi đá
  hang, bờ bên kia sông — không tính khe lẻ; điểm sinh quái đứng được; số bước từ trạm đúng thiết kế), `zonelevel.test.ts`,
  `apps/server/tests/economy.test.ts`. Kiểm map nháp: `AETHER_WEB_ASSETS=<thư mục nháp> npx tsx tests/<tên>.test.ts` (apps/web).

**ĐỢT 2 — ĐÃ VẼ + DỰNG VÀO BẢN THỬ 10/10/2026, CHƯA lên Funnel**: vẽ nợ hình vùng 1 bằng token #1 — 48 lượt (3 tấm 3×3 ×
6 + 5 món lẻ × 6), không vẽ lại món nào:
- Tấm `sheets/G1_graveyard.png` (bia tròn, bia chữ thập, bia vỡ, gò mộ, rào sắt, đống sọ, quan tài, đèn ma, bụi chết),
  `R1_ruins.png` (tường đổ, tượng gargoyle, tảng đá, bậc đá, cột đổ, chậu lửa, mỏm đá, chóp đá, bia khắc rune), `B1_bonehills.png`
  (xương sườn thú, sọ thú có sừng, đống xương, gốc cây chết, đá bạc màu, cờ trận, kiếm gãy, rào chông, cột tô-tem sọ) — đúng thứ tự
  ô `props/humanKingdom.ts` khai sẵn (đã soi từng ô). Công thức như CV1 / CV2: ảnh mẫu `N1_nature.png`, `color_palette: false`,
  "each small and centered in its own cell", nền magenta. Đề bài: `sources/pixellab/sheets/<tấm>.png.json`.
- 5 đồ vật Pro Flash nhìn chính diện (`pixellab object`, 1 hướng): `tree_dead`, `tree_pine_dry` (160×192, ảnh mẫu cây sồi
  `style/tree_ref.png`), `crypt`, `cliff_rock`, `ruin_arch` (192×192, ảnh mẫu `objects/house_stone`). Đề bài
  `sources/pixellab/objects/<món>/args.json` (`style_image_path` → đổi thành base64 trước khi gửi: lệnh `object` gửi JSON nguyên văn).
- Cắt sạch, cỡ hợp với nhân vật (bia ~41×42, rào sắt 58 rộng → khe giữa các đoạn 14px; tường đổ 59 rộng → khe ~21px < hộp chân 22px
  nên tường luỹ / cổng đá vẫn kín; cây chết 122×149 ≈ cây sồi; hầm mộ 150×176; vách đá 178×158; vòm đá 148×143 đi xuyên được).
- Dựng lại `AETHER_WEB_ASSETS=.aether-stage/assets npm run assets:map -- human` (KHÔNG sửa code): atlas 87 đồ vật + 33 decal;
  Nghĩa địa 4 → 278 đồ vật, Đồi Xương 2 → 164, Vách 12 → 143, Mộ Vô Danh 79 → 206, Luỹ 15 → 190, Hẻm Cửa Sông 222 → 245; Hang
  Gargoyle xáo đồ trang trí (đá R1 có hình nên nhánh dự phòng không rút thêm số ngẫu nhiên) — địa hình / địa điểm / khu quái / lối
  của cả 12 map KHÔNG đổi (`world.json` y nguyên; town, mossvale, shrine, riverflats, mossrift giống từng byte). `validateRegion`,
  `nav.test` (mọi điểm sinh quái đứng được, mọi địa điểm / lối tới được), `codex` / `zonelevel`, `maps.test`, test máy chủ đều đạt.
- Máy chủ game chỉ đọc khu quái / địa điểm / boss của file map (không dùng đồ vật) → lên Funnel ĐỢT 2 KHÔNG cần khởi động lại máy
  chủ: chép `.aether-stage/assets/maps/human/` (props.png / .json / .meta.json, 12 `<map>.json` + `.minimap.png` / `.minimap.json`,
  `world.json`) sang `apps/web/public/assets/maps/human/` (hoặc dựng lại vào public). Người lưu vị trí trong chân đồ vật mới thì
  vào lại ở điểm hồi sinh của map (`Game` bỏ vị trí đã lưu bị chặn).

**Chủ dự án đã duyệt 10/10/2026** ("map thì cứ làm thôi"): giữ Dơi hang ở Hang Gargoyle, lối sang vùng 2 qua Hẻm Cửa Sông, giữ
Đường hầm của Đoàn vào thẳng gian boss (boss cày tiện — theo dõi nhịp hồi sinh Gargoyle Đá).

## 5.3 Vùng 2–7 — 74 map dựng bằng bộ dựng chung (10/10/2026 — chủ dự án: "làm hết các vùng luôn đi")

Hình (Mốc 1 + 2) đã vẽ hết nên dựng luôn 6 vùng theo khung 12 map + Long Huyệt cho 4 vùng có rồng (vùng 4–7): **74 map**.
- **Bộ dựng chung** `packages/asset-pipeline/src/maps/kit.ts`: mỗi map một đặc tả gọn (chủ đề, bầy quái, hang ổ, trạm) → đường uốn
  lượn từ mỗi lối vào ngã ba, bãi trống cho từng bầy (cách nước ≥ 7 ô), ao / hồ / bờ biển né đường và bãi, cây viền mép, đồ điểm
  xuyết quanh bãi, trạm có quảng trường + nhà + cột dịch chuyển (địa điểm `waystone`), thánh địa / Long Huyệt có sân + vòng cột +
  hào nước (đầm, dung nham, hồ băng, biển). Hạt giống cố định. Luật kiểm của vùng 1 (`validateRegion`) chạy cho mọi vùng.
- **Đặc tả 6 vùng** `packages/asset-pipeline/src/maps/worldRegions.ts` — đồ thị lối CHUẨN (sơ đồ ở đầu file): trạm ↔ vùng trước
  (mép đông), h1…h10 theo đường cấp (mỗi map ~1 cấp, h5 và h7 vòng về trạm), thánh địa sau h10, Long Huyệt cạnh h9, h10 ra mép
  tây sang trạm vùng kế. 5 loại quái / vùng, mỗi loại ở 2 map cách 5 cấp; boss khu ở h7 + h10 (vùng 5: h7 + h8 — Yeti ở Đèo Người
  Tuyết). Boss chúa: Hydra bùn, Sâu cát khổng lồ, Rồng gió, **Vệ thần Ngai Băng** (`boss_ice_guardian_001` — bảng cũ ghi "Băng long",
  đổi để Băng Long `dragon_ice_001` ở riêng Long Huyệt như mục 2.1), Hoả thần, Kraken.
- **Đồ vật** `packages/asset-pipeline/src/props/worldRegions.ts`: 18 tấm 3×3 (SW / DS / HL / IC / VL / CR, bản `_r2` nếu có) + 24
  công trình / cây; mượn biển chỉ đường + đá rune của vùng 1. Nền: 6 bảng màu mới (`Biome`: swamp, desert, highland, snow,
  volcanic — nước là dung nham, beach) ở `GroundShader` Unity + màu phẳng minimap `maps/overview.ts`.
- **Chỉ số** `packages/sim/src/skills.ts` (`WORLD_ROSTER`): sinh theo cấp gốc + kiểu đánh (thường / trâu / nhanh / giáp / cung /
  phép), cân theo đà tăng người chơi; kháng / yếu hệ theo vùng; boss khu ×6 máu, boss chúa ×8, rồng ×20.
- **Mở vùng** (`regions.ts`): 6 vùng `ready`, cổng = cấp vào vùng + đã hạ boss chúa vùng trước (Unity đếm ở `story.codex.kills`).
- **Kiểm**: `apps/server/tests/worldmaps.test.ts` — đi bằng chân thật tới mọi điểm sinh quái / lối / sân boss, lối xuyên vùng hai
  chiều đúng mép, mọi loại quái có chỉ số + kháng hệ.
- Chưa có: NPC dịch vụ ở 6 trạm (chưa vẽ), nhiệm vụ / cốt truyện vùng 2–7. (Chiêu riêng của boss / rồng: ĐÃ LÀM 11/10/2026 —
  `UnityGame/Assets/Aether/Client/Combat/CombatSystem.Bosses.cs`; dịch chuyển giữa các trạm: cột dịch chuyển + quản trị đã có.)

## 5.4 Làm đẹp map: đồ vật lặp lại, quái thưa, xếp có trật tự — ĐÃ LÀM phần 0 lượt cho vùng 2–7 (11/10/2026)

Chủ dự án: "các đồ vật ở map đang khác nhiều cái giống nhau và lặp lại cần thêm quái, đồ vật xếp có trật tự".

**Hiện trạng — đo trên `assets/maps` ngày 11/10/2026** (đồ vật = mục `props` của map, không tính decal mặt đất):

| Vùng | Map | Đồ vật | Số loại | 3 loại nhiều nhất chiếm | Quái thường / map (TB) |
|---|---|---|---|---|---|
| Thistlewood (human) | 12 | 3.701 | 91 | 24% — đá xám 309, cây 292, cây lật 277 | 16,6 |
| Đầm lầy (swamp) | 12 | 4.026 | 49 | **36%** — 3 kiểu cây bách 558 / 519 / 376 | 14,2 |
| Sa mạc (desert) | 12 | 3.077 | 55 | 25% — cọ 349, đá đỏ 205, cây chết 201 | 14,2 |
| Cao nguyên (highland) | 13 | 4.118 | 56 | 21% — cỏ cao 345, thông gió 317, hoa 194 | 13,1 |
| Lãnh nguyên (tundra) | 13 | 3.750 | 41 | **35%** — thông tuyết 565, đụn tuyết 429, thông băng lật 317 | 13,1 |
| Núi lửa (volcano) | 13 | 3.337 | 45 | 30% — cây tro 505, bazan 264, cây cháy 246 | 13,1 |
| Quần đảo (isles) | 13 | 2.974 | 42 | 30% — 3 kiểu cọ 438 / 229 / 223 | 13,1 |

- **Đồ vật ít loại và lặp**: mỗi vùng chỉ 41–56 loại (vùng 1: 91), 3 loại phổ biến nhất chiếm 21–36% — đi đâu cũng gặp cùng một cây.
  Bản lật (`_flip`) vẫn nhận ra là một cây. Nguyên nhân: `kit.ts` rải đồ theo nhiễu từ một bảng ngắn mỗi chủ đề, không giới hạn tỉ lệ.
- **Xếp ngẫu nhiên, không có bố cục**: cây viền mép + "đồ điểm xuyết quanh bãi" rải đều — không có hàng cây dọc đường, rặng / lùm có
  mép rõ, góc làng, điểm nhấn để nhớ đường. Map nào cũng na ná nhau.
- **Quái thưa**: 13–17 con / map rộng 46–52 × 38–44 ô; mỗi map săn đúng **1 loại quái** (luật "1 loại quái / bầy" giữ, nhưng cả map chỉ
  một bầy loại đó). Đi một vòng ít gặp quái, săn chán.

**Hướng làm — theo thứ tự ít tốn lượt vẽ nhất** (luật vẽ: dùng / tô màu lại art có sẵn trước, cái gì phải vẽ mới thì gửi phiếu duyệt
cho chủ dự án trước — `docs/pixellab-ke-hoach-ve.md`):
1. **Xếp có trật tự** (chỉ code `packages/asset-pipeline/src/maps/kit.ts`, 0 lượt): hàng cây / cột đèn / hàng rào đều nhịp dọc đường
   chính; rừng thành RẶNG và LÙM có mép rõ (không rải lấm tấm khắp nơi) chừa lối mòn; mỗi map 1–2 **điểm nhấn** (tàn tích, cây cổ thụ,
   tượng, xác thuyền…) ở chỗ dễ thấy để nhớ đường; bãi quái có viền đá / bụi rõ; góc làng / trạm theo lưới nhà + sân. Khoảng cách tối
   thiểu giữa hai đồ CÙNG loại.
2. **Trộn đồ vật cho đều** (0 lượt): trần tỉ lệ mỗi loại (vd không loại nào quá 10–12% đồ của map), mượn đồ hợp chủ đề của vùng bên cạnh,
   thêm decal mặt đất nhỏ (sỏi, cỏ, lá rụng) lấp chỗ trống thay vì thêm cây.
3. **Biến thể bằng tô màu lại** (0 lượt — script đổi màu art có sẵn như luật biến thể): cây / đá / bụi thêm 2–3 tông theo khu (mép rừng
   sẫm, bãi trống nhạt, gần nước xanh hơn), cỡ nhỏ / to.
4. **Thêm quái** (dữ liệu `worldRegions.ts` + `WORLD_ROSTER`): map săn 20–28 con; thêm 1 bầy PHỤ khác loại (loại của map kề, cấp thấp
   hơn 1–2) — mỗi bầy vẫn 1 loại; vài con **tinh anh** hiếm (nhiều máu, thưởng hơn) ở góc xa. Cân lại EXP / xu theo mật độ mới, giữ nhịp
   lên cấp ~1 cấp / map săn. Máy chủ chia quái dùng chung theo khu — kiểm tải khi tăng số con.
5. **Vẽ đồ vật mới bằng PixelLab** chỉ khi 1–4 chưa đủ: lập danh sách theo vùng (ưu tiên Đầm lầy + Lãnh nguyên — lặp nặng nhất), gửi
   phiếu duyệt + ước lượt trước khi vẽ.

**Đá / cột dịch chuyển cần vẽ đẹp hơn** (chủ dự án 11/10/2026: "cần note lại thay đổi đá dịch chuyển cần render cho đẹp hơn").
ĐÃ THỐNG NHẤT hình (11/10/2026, chủ dự án chọn): mọi vùng dùng đúng một đồ vật `rune_stone` làm NPC cột dịch chuyển
(`packages/sim/src/story/services.ts`); bộ dựng map thôi đặt đá trang trí riêng mỗi vùng chồng lên chỗ đó (trước: `wind_rune`,
`ice_waystone`, `rune_pillar`… mỗi vùng một kiểu); Bia Danh Vọng đổi sang `rune_tablet` và chỉ đứng ở Thistlewood. Còn lại: cột vẫn
không phát sáng, không hiệu ứng, cỡ như hòn đá thường nên người chơi khó nhận ra đó là chỗ dịch chuyển. Hướng làm (cùng thứ tự ít tốn lượt):
- Unity, 0 lượt: vòng phép dưới chân (`magic_circle` đã có) xoay chậm + ánh sáng phụ (`VfxGlow`) nhấp nháy theo màu vùng, hạt bay lên,
  nhãn "Cột dịch chuyển" nổi khi lại gần, hiệu ứng lúc dịch chuyển đi / đến (loé sáng + vòng nổ); phóng to cột so với đá thường.
- Pipeline, 0 lượt: sân đá lát quanh cột (bệ + bậc), không đặt đồ khác sát cột.
- PixelLab (phiếu duyệt trước): MỘT cột dịch chuyển riêng có hoạt ảnh (tinh thể / rune xoay, 6–8 khung), tô màu lại theo từng vùng
  thay vì vẽ 7 cái (luật biến thể = tô màu lại).

**Nghiệm thu (đo lại bằng cùng phép đếm trên `assets/maps`)**: 3 loại nhiều nhất ≤ 15% đồ vật mỗi vùng; ≥ 60 loại đồ / vùng; quái thường
≥ 20 con / map săn và ≥ 2 loại / map săn; ảnh trước / sau từng vùng cho chủ dự án duyệt (Unity AutoTest `-aetherTour` hiện chụp trạm / map săn / sân boss vùng 2–7 — mở rộng ra mọi map của 7 vùng khi làm).
Luật kiểm `validateRegion` + `apps/server/tests/worldmaps.test.ts` (đi bộ tới mọi điểm sinh quái / lối) phải còn qua sau khi xếp lại.

**Đã làm 11/10/2026 (vùng 2–7, 0 lượt)**: bố cục (đường, bãi, lối, địa điểm) GIỮ NGUYÊN — đã so 72 map, 0 lệch — nên máy chủ / bản
cũ không lệch toạ độ. (1) Quái mỗi bầy tăng → map săn 24–28 con (map có hang ổ 21–24 + boss; trước 15–20), chỉ tăng `count`, không thêm
bãi. (2) Hàng cây loài chủ đạo đều nhịp dọc đường (cách mép đường 2 ô, ~4 ô một cây) ở map nền trống (`kit.ts`). Còn lại: bầy phụ khác
loại + quái tinh anh (cần nới luật "một loại / map" của `validateRegion` — chờ chủ dự án), trần tỉ lệ đồ trang trí, vùng 1 (map viết tay).

## 5.5 Thời tiết theo vùng — ĐÃ LÀM (11/10/2026)

Chủ dự án: "mỗi vùng phủ thêm tí hiệu ứng như phủ tuyết… tuyết rơi, gió sa mạc cát bay, rơm sa mạc lăn lăn, đặc trưng mỗi vùng".
`UnityGame/Assets/Aether/Client/Weather.cs`, chọn theo `biome` của map, 0 lượt vẽ (hạt pixel sinh trong code; cỏ khô lăn dùng
`tumbleweed_d` có sẵn của sa mạc). Tắt được ở Cài đặt → "Hiệu ứng thời tiết"; điện thoại bớt 40% hạt.

| Biome (vùng) | Hiệu ứng |
|---|---|
| Snow (Lãnh nguyên) | tuyết rơi 3 cỡ (gần to rơi nhanh), phủ lạnh nhẹ |
| Desert (Sa mạc) | vệt cát + luồng cát theo cơn gió lên xuống, bụi, cỏ khô lăn nảy qua màn, phủ vàng nhẹ |
| Volcanic (Núi lửa) | tro bay xuống, tàn lửa bốc lên nhấp nháy, phủ đỏ nhẹ |
| Swamp (Đầm lầy) | đom đóm chớp, sương trôi, phủ xanh nhẹ |
| Highland (Cao nguyên) | lá bay theo gió, phấn hoa |
| Beach (Quần đảo) | lấp lánh, bụi cát nhẹ |
| Meadow / Deadland / Rocky (vùng 1) | phấn hoa + lá / sương + tro / bụi |

Kiểm: Unity AutoTest `-aetherWeather` chụp trạm (đứng cạnh cột dịch chuyển) + một map săn mỗi vùng, rồi tắt thử.

## 5.6 Cây cối: mỗi vùng một kiểu riêng, mỗi map một loại cây — ĐÃ LÀM phần 0 lượt (11/10/2026)

**Kết quả** (`docs/tools/dem-cay.py`): loài dùng chung nhiều vùng **9 → 0** (bản tô màu lại: `dead_mossy` Đầm lầy, `dead_bleached` Sa
mạc, `hl_oak` / `hl_maple` Cao nguyên, `ash_tree_ember` Núi lửa, `palm_tropic` + `beach_bush` Quần đảo — `props/worldRegions.ts`);
loài chủ đạo mỗi map (trừ trạm, vùng 2–7) trung vị **41% → 73%**, map đạt ≥ 60%: **8 → 58 / 70** (`KitMapSpec.treeMain`: map săn thứ
i lấy loài thứ i quay vòng, ~2/3 cây + 2 loài điểm xuyết). Vẽ thêm loài mới (24 cây vùng 2–7) vẫn theo phiếu duyệt.

Chủ dự án: "cần thống nhất cây của từng vùng chứ thấy cứ giống nhau quá. Nên mỗi vùng 1 style riêng và đa dạng cây cối, mỗi map 1
loại cây". Đo hiện trạng bằng `python -I -X utf8 docs/tools/dem-cay.py` (11/10/2026, 87 map có cây, bản lật `_flip` tính chung loài):

- **Map trong cùng vùng giống hệt nhau**: map nào của vùng cũng rải đúng 3–4 loài với cùng tỉ lệ (VD mọi map Núi lửa là `ash_tree` +
  `charred_tree` + `ash_tree_cold`; mọi map Quần đảo là 4 kiểu cọ). Loài chủ đạo mỗi map chỉ chiếm trung vị **42%** (thấp nhất 18%) —
  không map nào có "gương mặt" riêng.
- **Vùng ít loài**: Núi lửa 3 · Sa mạc 5 · Quần đảo 5 · Lãnh nguyên 6 · vùng 1 7 · Đầm lầy 9 · Cao nguyên 10.
- **Loài dùng chung nhiều vùng** (nên đi sang vùng khác thấy cây quen): `palm` / `palm_dry` (Sa mạc + Quần đảo), `tree` / `tree_autumn`
  / `tree_pine_dry` / `bush_flower` (vùng 1 + Cao nguyên), `tree_dead` (vùng 1 + Sa mạc + Đầm lầy), `bush` (4 vùng), `dead_bush`.

Hướng làm:
1. **Mỗi vùng một bộ cây riêng, cùng một dáng + bảng màu** (style vùng): không loài nào dùng ở 2 vùng. Loài đang dùng chung thì vùng
   nào "chủ" giữ, vùng kia đổi sang bản **tô màu lại** theo bảng màu vùng (luật biến thể = tô màu lại, 0 lượt) — VD cọ Quần đảo xanh
   tươi / cọ Sa mạc khô vàng, cây chết Đầm lầy rêu xám-xanh / Sa mạc bạc trắng.
2. **Mỗi map một loài chủ đạo ≥ 60% số cây** + 1–2 loài điểm xuyết, và hai map kề nhau KHÔNG cùng loài chủ đạo — đặt ở khai báo map
   (`packages/asset-pipeline/src/maps/worldRegions.ts`, thêm trường kiểu `trees: { main, accents }`; bộ dựng `kit.ts` rải theo đó thay
   cho danh sách chung của vùng). Map vùng 1 (dựng tay) chỉnh danh sách đồ vật từng map.
3. **Đủ loài để chia**: mỗi vùng cần ≥ 5–6 loài (đủ cho các map săn + trạm + thánh địa). Thiếu thì theo thứ tự ít tốn lượt: tô màu lại
   / lật / ghép tán–thân từ cây có sẵn của chính vùng → chỉ khi vẫn thiếu mới vẽ PixelLab, **gửi phiếu duyệt trước** (bảng cây dự kiến
   từng vùng + số lượt), vẽ khung đầu cho duyệt rồi mới vẽ tiếp.
4. Đi cùng mục 5.4 (đồ vật lặp lại / xếp có trật tự): cây là phần lớn đồ vật nên làm chung một lượt dựng lại map.

**Nghiệm thu (đo lại bằng `docs/tools/dem-cay.py`)**: dòng "loài dùng chung nhiều vùng" = **không có**; mọi map săn có loài chủ đạo
≥ 60%; hai map nối nhau khác loài chủ đạo; ảnh trước / sau mỗi vùng (AutoTest `-aetherTour` / `-aetherWeather`) cho chủ dự án duyệt;
`validateRegion` + `apps/server/tests/worldmaps.test.ts` vẫn qua (cây không chặn lối / điểm sinh quái).

## 6. Thứ tự triển khai

| Bước | Nội dung | Phụ thuộc hình |
|---|---|---|
| T0a | **Tranh lục địa** (mục 3.1) + UI bản đồ tổng (phím M, sương phủ vùng chưa làm) — ✔ tranh vẽ 09/10, màn M ba tầng 10/10/2026 (bản thử) | tranh lục địa (1 lần) |
| T0b | Phần code dùng chung còn lại (mục 5) | — |
| T1 | Hoàn thiện vùng 1 lên **12 map** (thiết kế 10/10/2026): ĐỢT 1 đã dựng 10/10/2026 (mục 5.2); ĐỢT 2 chờ tấm G1 / R1 / B1 + 5 món lẻ | 0 lượt bắt buộc (hình đã vẽ) + nợ G1 / R1 / B1 |
| T2 | Vùng 2 Đầm lầy Mù Sương (gần nhất về cấp, khác hẳn vùng 1 về màu) | ~240 + ~550 |
| T3… | Mỗi vùng tiếp theo một lượt, theo thứ tự cấp ở bảng mục 2 | như trên |

Đi song song với kế hoạch đồ đạc / kinh tế (xu + túi đồ kiểm ở máy chủ, rơi đồ theo vùng) — mỗi vùng mới cần bảng rơi đồ riêng.

Nhà riêng (xây nhà, trồng cây, chăn nuôi, nghề phụ) xen kẽ với các vùng — kế hoạch + thứ tự tổng: `docs/ke-hoach-nha-rieng.md`.

## 6.1 Thư viện (sổ quái / boss / nhân vật) — ĐÃ LÀM bản đầu (08/10/2026)

Chủ dự án: "thư viện quái, boss, NPC các nhân vật trong game, vị trí" + "cuốn sổ lật lật cho sinh động, sách cũ đậm chất fantasy".
Phím **B** / nút "Thư viện (B)" — cuốn sách hai trang: mục lục theo dải (Quái thường · Boss · Nhân vật, số La Mã), trang chi tiết
LẬT quanh gáy khi đổi mục (trang trái lật khi đổi dải): chân dung, danh hiệu, lời giới thiệu (chữ cái đầu to kiểu sách cổ), chỉ
số quái + số đã hạ, nơi gặp (map + hang ổ). Chưa gặp: "???" kèm **lời đồn về nơi gặp**. "Đã gặp" = quái / NPC trong ~320px quanh
người chơi hoặc đã hạ — báo "Thư viện có trang mới". Dữ liệu: `game/codex.ts` (dựng từ `ENEMY_STATS` + `world.json` + NPC cốt
truyện; NPC gộp theo người qua các tuổi; tên + lời giới thiệu viết tay — quái mới phải khai `MONSTER_INFO`, test kiểm), tiến độ
trong bản lưu (`SaveData.codex`). Mỗi vùng mới tự có trang mới. **Hình tạm**: bìa / giấy dùng khung UI sẵn có — cuốn sách da cũ
vẽ PixelLab (danh sách NHẸ). Test `tests/codex.test.ts`.

## 7. Câu hỏi cần chủ dự án chốt

0. ~~Bảy rồng~~ — **ĐÃ CHỐT 08/10/2026**: rồng là boss THÊM ở vùng 4–10 (3 boss mỗi vùng giữ nguyên), boss thế giới dùng chung hồi sinh theo giờ; Long Châu CHỈ cho người dứt điểm, mở tuyệt kỹ mốc 10 của hệ; đủ 7
   châu triệu hồi Thần Long chọn một điều ước (rồng con thú cưng / thú cưỡi rồng / skin Long Kỵ Sĩ / danh hiệu / kim cương);
   giữ tên riêng; rồng là boss THÊM, 3 boss mỗi vùng giữ nguyên; đủ cấp mở chiêu cuối mới vào được Long Huyệt. Còn mở: thời gian
   hồi sinh cụ thể (đề xuất 1–2 giờ), lượng kim cương của điều ước, và:
   - cấp vào Long Huyệt = **40** (đề xuất, kèm mốc 10 cần cấp 40) hay giữ **25** (cấp sớm nhất đủ điểm mốc 10)?
   - boss chúa vùng 4 / 5 / 8 tên **Rồng gió / Băng long / Rồng đất** trùng ý với Phong / Băng / Địa Long — giữ (coi là rồng
     thường canh cửa) hay đổi tên?
   - người dứt điểm đã có viên Long Châu đó: vẫn nhận (thêm một viên dư) hay rơi cho người khác? Đông người thì có tách "kênh" (mỗi
     kênh một con rồng) hoặc rút giờ hồi sinh không (mục 2.2)?

1. ~~Trần cấp~~ — **ĐÃ CHỐT + ĐÃ LÀM 08/10/2026: trần 100** (≈10 cấp / vùng). Đã code: `MAX_LEVEL` 100 ở `@aether/protocol` (máy chủ
   kẹp theo), `TALENT_LEVEL_CAP` 40, `expForLevel` cũ tới cấp 10 rồi `3.844 × (cấp/10)^2,6`, Tia Aether kẹp ở 40, `cleanLevel` khi
   nạp bản lưu (EXP thừa giữ sát mốc, không nhảy cấp), thanh EXP đầy + "Cấp tối đa". Test `tests/level.test.ts`. Ghi chú gốc:
   - `talents.MAX_LEVEL` 40 → 100 và **ép trần thật** (hiện chỉ là hằng, chưa chỗ nào chặn).
   - `pointsForLevel` **dừng ở cấp 40** (`min(level, 40)`): cây Nguyên tố thiết kế cho đúng số điểm cấp 40, không thì cấp 100
     có ~119 điểm → master 3–4 nhánh, phá luật "1 master + nhánh phụ".
   - Đường EXP mới: `expForLevel` hiện là `100 × 1,5^(cấp−1)` (cấp 40 ≈ 7,4 × 10⁸, cấp 100 ≈ 10¹⁹ — không dùng được) → đổi
     sang dạng đa thức theo bảng cấp vùng; quy đổi exp của bản lưu cũ theo % cấp hiện tại để không ai tụt cấp.
   - Cấp 41–100: tăng chỉ số gốc (máu, công, thủ), mở đồ bậc cao theo vùng; Tia Aether mạnh theo cấp thì kẹp hệ số ở cấp 40
     hoặc giảm dốc — cân lại cùng lúc.
2. Tên + thứ tự 10 vùng ở mục 2 có giữ không, có vùng nào muốn thay (vd rừng tre phương Đông, thành phố trên mây)?
3. Bản đồ tổng: một lục địa liền hay nhiều đảo / châu lục?

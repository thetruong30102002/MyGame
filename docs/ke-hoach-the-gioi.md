# Kế hoạch thế giới: 10 vùng đất × 7 map (chốt khung 08/10/2026)

Chủ dự án 08/10/2026: thế giới có **khoảng 10 vùng đất** (băng, sa mạc, đầm lầy…). Các map đang có tính là **vùng 1**. Mỗi
vùng **khoảng 3 boss** và **khoảng 7 map con** → **~70 map**. Luật thế giới đã chốt từ trước vẫn giữ:

- Mỗi khu săn **chỉ MỘT loại quái**, sinh theo **bầy**.
- Trong một vùng: đi tới mép map thì nạp map kế, có **mũi tên chỉ hướng** ở lối sang (đang chạy).
- Mỗi vùng **một style đồng nhất**: một bộ nền, một loại cây chính, nhà/đồ vật cùng nét PixelLab, không trộn nguồn hình.

## 1. Khung một vùng (7 map)

| Map | Số lượng | Nội dung |
|---|---|---|
| **Trạm** (làng / trại / cảng) | 1 | Không quái. NPC nhiệm vụ, thương nhân, thợ rèn / thợ may / thợ cắt tóc (vùng lớn), điểm hồi sinh, **cột dịch chuyển** |
| **Map săn** | 5 | Mỗi map 1 loại quái theo bầy (5 khu bầy như map hiện tại). 2 trong 5 map có **hang ổ boss khu** ở góc (như Vua Lich ở hầm mộ Nghĩa địa) |
| **Thánh địa boss chúa** | 1 | Map nhỏ, cuối vùng, chỉ có boss chúa (như Đá Phong Ấn của Quỷ vương). Hạ boss chúa thì mở lối sang vùng kế |

→ **3 boss / vùng** = 2 boss khu (hồi sinh theo giờ, như `regionBoss` hiện tại) + 1 boss chúa (cốt truyện, có chiêu riêng xịn).
→ **5 loại quái thường / vùng** → cả thế giới ~**50 loại quái + 30 boss**, cộng **7 rồng** là boss THÊM (mục 2.1).

Bố cục trong vùng: trạm ở đầu, map săn xếp thành cây 2 nhánh (giống vùng 1: Thistlewood → Mossvale → Đá Phong Ấn, và
Thistlewood → Nghĩa địa → Đồi Xương / Vách Gargoyle), thánh địa ở cuối nhánh khó nhất.

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

Vùng 1 hiện có 6 map, 2 boss, 4 loại quái thường + boss. Muốn đủ khung thì thêm **1 map săn** (gợi ý: **Hang Gargoyle**
nối Vách Gargoyle, có boss khu Gargoyle Đá) và **1 loại quái thường**.

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
- Mỗi rồng ở một **map nhỏ riêng "Long Huyệt"** (map phụ, đi vào từ một map của vùng như cột trên; KHÔNG tính vào ~7 map của
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
  trên đó. Vùng chưa tới thì phủ sương; vùng đã tới hiện tên + cấp khuyên dùng; bấm vào vùng thì xem 7 map con (dùng
  minimap đang có) + vị trí boss đã gặp. Tranh vẽ một lần cho cả lục địa ngay từ đầu (để vị trí 10 vùng cố định), vùng
  chưa làm thì để sương.
- Máy chủ game: id map hiện là `mapId` trong một vùng → đổi thành `vùng/map` (vd `human/town`) để 70 map không trùng tên;
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
trong dữ liệu bản đồ tổng → làm UI phím M (mục 3). Hiện xếp hàng chờ vì PixelLab đang khoá lượt miễn phí; có token trả
phí thì vẽ bằng token đó.

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

→ 9 vùng mới ≈ **2.200 lượt miễn phí** (15 token × 5 lượt/đêm ≈ 75/ngày → ~1 tháng rải đều) + **~5.000 lượt trả phí**
(Tier 1 = 2.000/tháng → **~2,5 tháng** chỉ riêng boss/chiêu boss, chưa kể skill người chơi và trang phục ở
`docs/pixellab-ke-hoach-ve.md`). Vì vậy **làm từng vùng một**, không vẽ dàn trải: vùng nào xong hình thì mở vùng đó.
Logic vẫn theo luật "làm trước, có hình thì thay": vùng có thể chạy trước bằng quái/boss mượn hình vùng cũ nhuộm màu,
ghi rõ chỗ nào đang tạm.

## 5. Phần code dùng chung (làm một lần, trước vùng 2)

1. **Nhiều vùng**: id map `vùng/map`, `WorldIndex` nạp nhiều `world.json`, lối ra khác vùng (`exits.to = 'swamp/hub'`), máy
   chủ chấp nhận id mới + chuyển bản lưu.
2. **Cổng vùng + điều kiện mở** (boss chúa vùng trước, cấp tối thiểu) + màn chuyển vùng.
3. **Cột dịch chuyển** ở trạm + danh sách trạm đã tới (lưu ở máy chủ).
4. **Bản đồ tổng** (UI): tranh lục địa + sương + bấm vùng xem map con.
5. **Kháng / yếu hệ của quái** (`ENEMY_STATS.resist`): nhân sát thương theo hệ — để mỗi vùng có lý do đổi build/phủ phép.
6. **Bảng cấp vùng**: cấp quái, exp, xu, bảng rơi đồ theo vùng (nối với kế hoạch đồ đạc/kinh tế).
7. **Công cụ dựng map vùng mới** trong pipeline: khung 7 map + bộ đồ vật của vùng → map JSON + minimap (pipeline `map` đang
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
- **Pipeline**: `npm run assets:map -- <vùng>` (mặc định `human`); vùng mới khai ở `packages/asset-pipeline/src/maps/regions.ts`. Lối
  sang vùng khác không bắt map đích trong vùng này (kiểm chéo khi dựng vùng kia — `crossRegionExits`). Dựng lại vùng 1: không đổi byte nào.
- Thử thật (máy chủ thử + vùng THỬ tạm chép từ Đá Phong Ấn, xoá sau khi thử): cổng báo "đang xây dựng", sang vùng thử có màn chuyển
  vùng + minimap / tên khu / lối đúng vùng, quay lại vùng 1, cột dịch chuyển mở bảng. Test: `apps/server/tests/regions.test.ts`,
  `packages/asset-pipeline/tests/maps.test.ts`.
- **Chưa làm**: bản đồ tổng (chờ tranh lục địa PixelLab), bảng cấp / rơi đồ theo vùng (mục 5.6 — làm cùng vùng 2), dẫn đường nhiệm
  vụ XUYÊN vùng (tìm đường hiện trong một vùng; nhiệm vụ mới chỉ có ở vùng 1).

## 6. Thứ tự triển khai

| Bước | Nội dung | Phụ thuộc hình |
|---|---|---|
| T0a | **Tranh lục địa** (mục 3.1) + UI bản đồ tổng (phím M, sương phủ vùng chưa làm) — làm ĐẦU TIÊN | tranh lục địa (1 lần) |
| T0b | Phần code dùng chung còn lại (mục 5) | — |
| T1 | Hoàn thiện vùng 1: thêm Hang Gargoyle + boss Gargoyle Đá + 1 loại quái → đủ 7 map, 3 boss | ~40 lượt miễn phí + boss |
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

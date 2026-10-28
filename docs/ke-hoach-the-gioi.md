# Kế hoạch thế giới: 10 vùng đất × 12 map (khung chốt 08/10/2026; 12 map / vùng chốt 10/10/2026)

> **26/10/2026 — kế hoạch tổng mới:** xem [Tái thiết thế giới](ke-hoach-nang-cap-the-gioi.md), nguồn tiến độ duy nhất cho web Admin → Kế hoạch phát triển.
> Đã kiểm kê 13 vùng / 174 map / 25 boss. Vẽ lại các trung tâm, bộ cảnh riêng, thêm quái/boss, chính trị và lâu đài trên không có vị thần hé lộ tri thức/khởi nguyên. Các số lượng/ngân sách bên dưới thuộc khung cũ, không phải tiến độ vẽ lại đợt mới.

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

## 1.2 Làng / toà thành đông đúc hơn: thêm nhà + NPC — GHI CHÚ (13/10/2026, chưa làm)

Chủ dự án 13/10/2026: "ở làng nơi dân sinh sống mỗi vùng cần thêm nhiều nhà và npc nữa".

**Hiện trạng (đếm trên map trạm 13/10/2026)**: vùng 2–7 mỗi trạm chỉ có **5–8 nhà, 1–5 loại** (Băng giá 5 nhà cùng một loại), và
**3 NPC** (cột dịch chuyển, trưởng làng / người đứng đầu, vị thần vùng). Không có người bán, thợ rèn hay dân thường. Vùng 1
Thistlewood khá hơn (11 nhà / 9 loại, nhiều NPC cốt truyện).

**Mục tiêu mỗi trạm**

| | Làng | Toà thành (Sahrin, Đe Đỏ, Aether cổ, Hư Không) |
|---|---|---|
| Nhà / công trình | **≥ 12–15 nhà, ≥ 6 loại** (nhà ở, nhà người đứng đầu, quán trọ, tiệm, xưởng / lò rèn, kho, chuồng / giàn phơi theo nghề của vùng) | ≥ 20 công trình: tường thành + cổng (bộ tường mục 5.8), cung / dinh, chợ, doanh trại, nhà dân |
| NPC dịch vụ | người bán, thợ rèn, thầy thuốc / quán trọ, cột dịch chuyển | thêm thợ may / thợ cắt tóc, quan, lính gác cổng |
| NPC nhiệm vụ | người đứng đầu + 2–3 người giao việc (đã có cốt truyện chương 2–7: Nyra, Pell, Hassim, Zahra, Hilde, Durin, Maris…) | vua / hội đồng + phe phái |
| Dân thường | **5–6 người**: trẻ con, người già, nông / ngư dân theo nghề vùng, người đi chợ, lính tuần; mỗi người 2–3 câu nói `idle` | 8–10 người |

Tổng mỗi làng **≈ 12–14 NPC** (hiện 3), toà thành ≈ 18–20.

**Cách làm**
- **Nhà**: Pro Flash ảnh rời nhìn thẳng như các nhà đã duyệt (`objects/<vùng>_*`), ~6 lượt / loại. Mỗi vùng thêm **~6 loại nhà** (≈ 36
  lượt). Nhà cùng loại đặt nhiều chỗ thì lật gương / đổi màu mái (0 lượt). Đồ làng nhỏ (hàng rào, giếng, chum, giàn phơi…) đã có
  trong các tấm `*5` của kế hoạch cây cối + đồ vật.
- **NPC** (vẽ bằng token TRẢ PHÍ, vì nhân vật chỉ làm thêm động tác được bằng token đã tạo ra nó):
  - NPC dịch vụ / nhiệm vụ: nhân vật riêng như Ysolde (ảnh xoay 8 hướng + đứng thở ≈ 14 lượt).
  - Dân thường: mỗi vùng 3 dáng gốc (ảnh xoay + đứng thở ≈ 14 lượt / dáng), tô màu lại áo / tóc thành 5–6 người (0 lượt). Muốn dân
    **đi lại** trong làng thì thêm động tác đi (+8 lượt / dáng).
  - Ước mỗi vùng: 4 NPC dịch vụ đã có trong kế hoạch NPC trạm (dòng "NPC trạm" ở `docs/the-gioi-aether.md`) + 3 dáng dân thường ≈ 45 lượt.
- **Code (0 lượt)**: bộ dựng `kit.ts` mở rộng khu trạm (đường làng, khoảnh vườn, hàng rào quanh nhà, quảng trường giữa); NPC dân
  thường đứng / đi quanh một điểm, nói câu `idle` khi người chơi lại gần (cơ chế NPC + nút "E" đang có). Khai NPC ở
  `packages/sim/src/story/` như các NPC vùng hiện có.
- **Lượt ước (vùng 2–10)**: nhà ~36 + dân thường ~45 ≈ **~80 lượt / vùng → ~730 lượt** cho 9 vùng, chưa gồm NPC dịch vụ / nhiệm vụ đã có
  trong kế hoạch. Vùng 1 thêm ~3 loại nhà + 3 dáng dân (~60).
- **Thứ tự**: vùng 2 Lau Xám trước (vùng kế tiếp của người chơi), rồi lần lượt theo cấp.

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

**Cột dịch chuyển ở MỌI map — ĐÃ LÀM 14/10/2026** (chủ dự án: "thêm các đá dịch chuyển ở các map con nữa. thiết kế lại UI danh sách
map tele vẫn chỉ nên để khung gỗ còn bên trong ruột là UI hiện đại dễ nhìn"): 88 map đều có địa điểm `waystone` (`Layout.finish` tự tìm
chỗ trống gần điểm vào — không đổi bố cục; trạm giữ chỗ cũ; luật "id địa điểm không trùng" chừa riêng id này) nên NPC cột của vùng hiện
ở mọi map. Máy chủ `hubs` trả MỌI map có cột đã tới (trạm đứng đầu — client cũ vẫn chạy). Bảng dịch chuyển (`Panels.Services.cs`):
khung gỗ + băng-rôn giữ nguyên, ruột là tấm nền xám đá phẳng — cột trái 10 vùng (số map đã tới / có cột, chấm xanh = vùng đang đứng),
phải là thẻ map 3 cột (Trạm / Boss / cấp, "Bạn đang ở đây", "Chưa tới", nút Dịch chuyển; bấm cả thẻ), phí + số xu góc phải.

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
loại + quái tinh anh (cần nới luật "một loại / map" của `validateRegion` — chờ chủ dự án), trần tỉ lệ đồ trang trí.

**Vùng 1 (14/10/2026, 0 lượt)**: 12 map dựng tay đổi rải lốm đốm → rải theo KHÓM cùng loài (`Layout.clumps` — chung với bộ dựng
vùng 2–7): cây 5–7 / khóm, đá / xương / bia 2–3, bụi hoa 3–4; Thistlewood thêm hàng cây hai bên đường Bắc–Nam (4 ô một cây). Giữ nguyên:
đường, bãi, lối, địa điểm, vườn táo Bãi Bồi, rừng úa theo vòng của Vết Rạn, đá lấp vách Hang Gargoyle / Hẻm Cửa Sông. Đã kiểm đi
bằng chân tới mọi điểm đến / lối / điểm sinh quái của 12 map.

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
3. **Đủ loài để chia**: mỗi vùng cần **12 loài vẽ riêng** (chủ dự án 13/10/2026: "mỗi vùng phải 12 loại cây", áp cho mọi vùng kể cả
   4 map nguyên tố mới; trước là ≥ 5–6 loài). Bản tô màu / lật không tính vào 12. Bảng hiện có / còn thiếu và thứ tự vẽ ở
   `docs/pixellab-ke-hoach-ve.md`, mục "Cây cối: 12 loài mỗi vùng".
4. Đi cùng mục 5.4 (đồ vật lặp lại / xếp có trật tự): cây là phần lớn đồ vật nên làm chung một lượt dựng lại map.

**Nghiệm thu (đo lại bằng `docs/tools/dem-cay.py`)**: dòng "loài dùng chung nhiều vùng" = **không có**; mọi map săn có loài chủ đạo
≥ 60%; hai map nối nhau khác loài chủ đạo; ảnh trước / sau mỗi vùng (AutoTest `-aetherTour` / `-aetherWeather`) cho chủ dự án duyệt;
`validateRegion` + `apps/server/tests/worldmaps.test.ts` vẫn qua (cây không chặn lối / điểm sinh quái).

## 5.7 Map cho nguyên tố mới — GHI CHÚ (11/10/2026, chưa làm)

Chủ dự án 11/10/2026: sau này thêm nguyên tố **Mộc**, **Bóng tối** (Ám ma pháp) và **Ánh sáng** — "khả năng sẽ có thêm ít nhất là 2
map mới liên quan đến ánh sáng và bóng tối, mộc nữa". Mỗi hệ cần một nơi mở nhánh (nhiệm vụ + vị thần như các vùng hiện có) và một vùng
mang đúng chất hệ đó:

| Hệ | Vùng gợi ý | Chất riêng (cây, thời tiết, quái) |
|---|---|---|
| Mộc | Rừng Cổ Thụ | cây khổng lồ, dây leo, đom đóm; quái cây / tinh linh rừng |
| Ánh sáng | Thánh Địa Bình Minh | đền trắng, cột đá, tia nắng xiên; quái thánh vệ / thiên thần đá |
| Bóng tối | Vực Ám Ma | đất đen, sương tím, cây chết; quái bóng ma / ác linh |
| Kiếm | Lãnh địa Kiếm (thêm 13/10/2026) | võ đường cổ giữa rừng **phong lá đỏ / vàng**, lá rơi bay theo gió, kiếm cắm khắp nơi; quái kiếm hồn / giáp rỗng |

Chủ dự án 13/10/2026: thêm **Lãnh địa Kiếm**, và **ưu tiên vẽ cây cho 4 map này trước** (mỗi map 12 loài, danh sách ở
`docs/pixellab-ke-hoach-ve.md` mục "Cây cối: 12 loài mỗi vùng").

Dựng bằng bộ dựng chung (`packages/asset-pipeline/src/maps/kit.ts`) như vùng 2–7, theo luật mục 5.4–5.6 (mỗi vùng một bộ cây riêng,
mỗi map một loài chủ đạo, thời tiết theo vùng). Hình mới (thần, quái, tấm nền) phải qua phiếu duyệt PixelLab. Luật nguyên tố đi kèm:
`docs/ke-hoach-nguyen-to.md` mục 9.

**LỊCH DỰNG — chốt 14/10/2026** (chủ dự án: "Vùng đủ 12 map", "Cổng ở Thistlewood", làm trong lúc chờ nạp lượt PixelLab 09/11,
"mỗi ngày làm một xíu"; kèm vùng 8–10 đang khoá: "còn mấy map trước vẫn bị khóa chưa xây đâu nấm, phế tích"). 0 lượt PixelLab: cây
4 vùng nguyên tố đã có (48 loài); đá / đồ vật / quái / boss MƯỢN của vùng khác hoặc tô màu lại, ghi rõ TẠM, có hình riêng thì thay.

| Ngày | Việc |
|---|---|
| 1 | Khung **vùng nhánh**: 4 vùng nguyên tố trong `packages/sim/src/regions.ts` không nằm trên đường chính (điều kiện mở riêng: cấp, không cần boss chúa vùng trước); **Cổng Nguyên Tố** ở quảng trường Thistlewood (NPC dịch vụ, bảng chọn 4 vùng + điều kiện, giống cột dịch chuyển); 4 bảng màu mặt đất mới (`groundShade` + Unity `GroundShader`) |
| 2 | **Rừng Cổ Thụ (Mộc)**: chủ đề map (12 loài cây đã vẽ), 12 map theo khung chuẩn, 5 loại quái + 2 boss khu + boss chúa MƯỢN tạm; dựng + test đi bộ |
| 3 | **Thánh Địa Bình Minh (Ánh sáng)** — như ngày 2 |
| 4 | **Vực Ám Ma (Bóng tối)** — như ngày 2 |
| 5 | **Lãnh địa Kiếm** — như ngày 2 (cây phong đỏ / vàng) |
| 6 | Build + thử ở máy chủ thử (AutoTest chụp từng vùng) → chủ dự án duyệt → lên bản thật |
| 7–9 | **Vùng 8 Rừng Nấm Ngầm · 9 Phế tích Aether · 10 Vực Hư Không**, mỗi ngày một vùng: chưa có cây / quái riêng → mượn + tô màu lại TẠM theo chất vùng |
| 10 | Build + thử + lên bản thật vùng 8–10 |

**Cần chốt khi làm ngày 1**: cấp mở của từng vùng nguyên tố (đề xuất: theo cấp mốc mở nhánh nguyên tố đó); vùng nguyên tố có
lối ra sang vùng nào hay cụt (đề xuất: cụt, về bằng cổng / cột dịch chuyển). Thần + nhiệm vụ mở hệ + quái / đồ vật riêng: vẽ bằng gói
24$ sau (`pixellab-ke-hoach-ve.md`).

## 5.8 Map công trình: đi VÀO lâu đài, kim tự tháp, chiến địa — GHI CHÚ (13/10/2026, chưa làm)

Chủ dự án 13/10/2026: "cần thêm kế hoạch các nơi cũ, không chỉ là các map vùng… thiếu mất vào lâu đài hay vào chiến địa… thấy map hơi
nhạt nhoà, toàn địa hình với cây. Lâu đài là như kiểu gạch đá, tường thành" + "ví dụ map sa mạc là đi vào kim tự tháp".

**Vấn đề**: 12 map mỗi vùng đều là ngoài trời (nền + cây + đá rải), kể cả các "toà thành" chỉ là nhà rời đặt trên cỏ. Chưa có tường
thành nối liền, sàn lát đá, hành lang, phòng. Luỹ Hiệp Sĩ Cũ (vùng 1) là luỹ ghép từ mảnh tường đổ và tháp rời.

**Mỗi vùng (kể cả 4 map nguyên tố mới) có ít nhất 1 map công trình** để đi vào bên trong, ưu tiên gắn với cốt truyện / boss sẵn có:

| Vùng | Map công trình đề xuất | Kiểu | Gắn với |
|---|---|---|---|
| 1 · Thistlewood | **Lâu đài Rowanmere**: tường thành gạch đá, sân trong, tháp canh, đại sảnh. Luỹ Hiệp Sĩ Cũ dựng lại bằng bộ tường thật | lâu đài + chiến địa nhỏ | Đoàn Ấn Ký, Aldric |
| 2 · Đầm lầy | **Thân đập đá của Đoàn**: cống ngầm, phòng máy cửa xả, làng Lau Xám cũ chìm dưới đập | công trình ngầm | con đập nhấn chìm làng (chương 2) |
| 3 · Sa mạc | **Kim tự tháp**: hành lang sa thạch, bẫy cát, phòng mộ có tranh khắc, phòng boss | hầm mộ | `boss_pharaoh_001`, `mob_mummy_001` |
| 4 · Cao nguyên | **Đền Gió trên mây**: sân đá, hành lang cột, chuông gió, cầu treo giữa các đỉnh | đền | đền thờ trên mây của làng Cối Xay Gió |
| 5 · Băng giá | **Cung Ngai Băng**: tường băng trong suốt, sảnh ngai | cung điện | `boss_ice_guardian_001`, `boss_ice_queen_001` |
| 6 · Núi lửa | **Pháo đài Đe Đỏ**: tường thành đá đen, cổng sắt, lò rèn trong lòng núi; **chiến địa** ngoài chân tường lúc quân Đoàn vây thành | toà thành + chiến địa | chương vây pháo đài (Hilde / Durin) |
| 7 · Quần đảo | **Tàu ma đắm / hang hải tặc**: boong, khoang tàu, hang đá có kho báu | tàu + hang | `boss_ghost_captain_001`, `mob_pirate_001` |
| 8 · Rừng nấm | **Thành phố nấm ngầm**: hang đá, nhà nấm, đường hầm phát sáng | thành ngầm | làng người nấm Ánh Tím |
| 9 · Phế tích Aether | **Toà thành Aether cổ**: tường pháp sư, thư viện, xưởng máy | toà thành | ba phe tranh di sản |
| 10 · Hư Không | **Thành trì Hư Không**: tường thành liên quân + **chiến địa** trước cổng | toà thành + chiến địa | trận cuối của liên quân |
| Mộc / Ánh sáng / Bóng tối / Kiếm | lòng cây thế giới · thánh đường trắng · ngục tối · **võ đường giữa rừng phong** | — | 4 map nguyên tố mới (5.7) |

**Chiến địa** (vùng 1, 6, 10): bãi trận ngoài tường thành có rào chông, xe công thành, lều trại, cờ hai phe, xác giáp vỡ, hố
cháy. Quái theo bầy đông hơn map thường, có thể dùng cho sự kiện thủ thành sau này.

**Cách làm**
- **Hình (PixelLab)**, ước mỗi map công trình khoảng 45 lượt. Bộ nền và tấm đồ vật làm được bằng token trial; bộ tường thì không:
  - bộ công trình `create_building_kit` kiểu `square_topdown`: sàn, tường, góc trong / ngoài, cột, cổng, cầu thang (10–25 lượt). **Cần token
    Tier 1 trở lên** (gói trial bị từ chối, thử 13/10/2026);
  - bộ nền `create_topdown_tileset` chuyển cỏ / cát / tuyết sang sàn lát (3–4 lượt);
  - 2 tấm đồ vật nội thất 3×3 (~16 lượt: đuốc tường, bàn thờ, quan tài, giá vũ khí, cờ…).

  Tổng 14 map ≈ **~630 lượt**. Đã có: bộ nền cát → sàn lát sa thạch cho kim tự tháp (13/10/2026). Bộ tường dùng lại được giữa các vùng cùng chất liệu (tô màu lại, 0 lượt), nên thực tế ít hơn.
- **Code (0 lượt)**:
  - bộ dựng `kit.ts` thêm kiểu map **trong nhà**: lưới phòng + hành lang, ghép tường liền theo ô (chọn mảnh góc / thẳng theo ô kề), tối hơn và có đèn đuốc;
  - map ngoài trời thêm **cửa vào** (cổng thành, cửa kim tự tháp) là một lối nối sang map công trình, như các lối giữa map hiện có.
- **Chỗ của map công trình**: thay hang ổ boss chúa (map thứ 12) khi hợp chủ đề (kim tự tháp, cung Ngai Băng, tàu ma), còn lại
  là map thứ 13 của vùng. **Chủ dự án chốt.**
- **Thứ tự đề xuất**:
  1. Thử 1 map: kim tự tháp vùng 3 (đúng ví dụ của chủ dự án), chốt cách ghép tường + cửa vào;
  2. Lâu đài Rowanmere vùng 1 (khu người chơi mới, ai cũng thấy);
  3. Pháo đài Đe Đỏ + chiến địa;
  4. các vùng còn lại.

## 5.9 Đợt map và công trình 17/10/2026

Ưu tiên mới của chủ dự án: hoàn thiện map, công trình và nội dung vùng trước túi đồ máy chủ. Không làm lại hình nhân vật.

- Đã dựng vùng 8 Rừng Nấm Ngầm, 9 Phế tích Aether, 10 Vực Hư Không: mỗi vùng 1 trạm, 10 map săn và 1 thánh địa. Đường xuyên vùng nối từ Bãi Tàu Đắm của Quần đảo tới Hư Không; vùng cuối không có lối dẫn ra vùng không tồn tại. Cấp lần lượt 70–80, 80–90, 90–100.
- Ba vùng này dùng TẠM bộ cây, đồ vật, quái và boss của Đầm lầy / Cao nguyên / Núi lửa, với biome, tên địa điểm, hạt giống và cấp riêng. **Chưa có quái/boss riêng, ba rồng mới, Long Huyệt hoặc nhiệm vụ truyện hoàn chỉnh.** Boss chúa riêng của vùng 8–10 vẫn chưa định danh (`chief: null`); sau cổng vùng 8 yêu cầu Kraken, cổng vùng 9–10 kiểm cấp như thiết kế cũ.
- Bộ dựng `maps/buildings.ts` thêm 10 công trình. Mỗi nơi có ba phòng được đặt tên, hành lang, tường gạch chặn chân, cột dịch chuyển và lối về. Sơ đồ các phòng khác nhau; tàu ma có sàn gỗ. Rowanmere là khu an toàn, các công trình khác có ba bầy quái, mỗi bầy sáu con cùng loại, cấp theo vùng.

| Vùng | Công trình | Vào từ |
|---|---|---|
| human | Lâu đài Rowanmere | Luỹ Hiệp Sĩ Cũ (`oldfort`) |
| swamp | Thân đập đá của Đoàn | `leechcanal` |
| desert | Kim tự tháp Sa Thạch | Mộ Đạo Sâu (`deeptombs`) |
| highland | Nội điện Đền Gió | `cloudpath` |
| tundra | Cung Ngai Băng | `snowmanpass` |
| volcano | Pháo đài Đe Đỏ | `oldforge` |
| isles | Khoang tàu ma | Vịnh Cướp Biển (`piratecove`) |
| fungal | Thành phố nấm ngầm | Hẻm Địa Y (`h7`) |
| ruins | Thư viện thành Aether | Trại Khảo Cổ (`h7`) |
| void | Nội thành Hư Không | Luỹ Cờ Tàn (`h7`) |

Tổng cộng **134 map cho 10 vùng chính**. Bộ dựng giữ nguyên các địa điểm và bầy quái cũ; mở hành lang tới lối công trình, bắc cầu nếu cắt qua nước và dọn chân đồ vật chắn hành lang. Tường mới dùng ký tự `#`: TS và C# cùng kiểm va chạm; Unity tô gạch có mạch vữa, minimap dùng nền tối; thời tiết ngoài trời tắt trong công trình. Chưa dùng bộ building-kit PixelLab hoặc tiêu lượt vẽ mới.

Kiểm tra: `npm run typecheck`, `npm test`, `npx tsx apps/server/tests/worldmaps.test.ts`, `npx tsx apps/server/tests/regions.test.ts`. Test công trình kiểm cả đường đi với hộp chân thật, điểm vào, phòng, cột dịch chuyển và tường; bộ worldmaps kiểm mọi điểm sinh quái và lối xuyên vùng. Có thể đặt `AETHER_MAPS` để kiểm thư mục bản nháp trước khi thay dữ liệu project.

Còn làm tiếp: bốn vùng nguyên tố và Cổng Nguyên Tố (§5.7), bộ hình công trình riêng và chiến địa ngoài thành, NPC/thoại/nhiệm vụ cho công trình, ba rồng vùng cuối, cân nhịp chiến đấu thực tế và duyệt hình trong game. Đợt này cập nhật dữ liệu project; chưa phát EXE/APK hoặc khởi động lại máy chủ thật.

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

## 5.10 Ba vùng Mộc · Ánh sáng · Bóng tối (17/10/2026)

Đã dựng bằng 36 ảnh cây PixelLab có sẵn trong `sources/pixellab/objects/`: mỗi vùng dùng đủ 12 loài, mỗi map có loài chủ đạo theo tên khu. Không sinh thêm ảnh nhân vật.

| Vùng | Cấp tạm | Map ngoài trời | Công trình đi vào được |
|---|---|---|---|
| Rừng Cổ Thụ (`wood`) | 20–30 | 12 | Lòng Cây Thế Giới |
| Thánh Địa Bình Minh (`light`) | 30–40 | 12 | Thánh Đường Trắng |
| Vực Ám Ma (`dark`) | 40–50 | 12 | Ngục Vĩnh Dạ |

- Vùng nhánh độc lập: điều kiện chỉ là cấp, không cần boss tuyến chính. Luật TypeScript và C# cùng đọc trường `branch`.
- Lối vào: phía **tây Thistlewood → Sân Cổng Nguyên Tố**. Sân có ba lối đi bộ, đi/về hai chiều, biển chỉ tên và cấp. Đây là sân cổng đi bộ; NPC chọn vùng bằng hội thoại trong kế hoạch vẫn chưa làm.
- Có trạm nghỉ, cột dịch chuyển, người bán tự sinh theo vùng, 10 map săn, thánh địa, công trình ba phòng. Màn bản đồ lục địa có nút xem từng vùng nhánh.
- Nền Mộc xanh rêu, Ánh sáng ngà vàng, Bóng tối tím than; Unity có đom đóm/lá, bụi sáng, sương tím tương ứng. Trong công trình tắt thời tiết.
- Nhà, đá, đồ trang trí, quái và boss đang **mượn tạm** từ đầm lầy/cao nguyên/núi lửa. Hệ số chiến đấu vẫn theo loài gốc; chưa thêm nguyên tố chiến đấu, thần hoặc nhiệm vụ mở hệ. Lãnh địa Kiếm chưa dựng trong đợt này.
- Tổng cộng thêm 40 map (36 ngoài trời + 3 công trình + sân cổng), project có 174 map. Mã dựng ở `maps/elemental.ts`, bộ cây ở `props/elemental.ts`; tái sinh bằng `npm run assets:map -- wood` (tương tự `light`, `dark`, `human`).
- Kiểm tra: typecheck, npm test, 16 bài cây/công trình, đường đi bằng hộp chân thật đến điểm đến/bãi quái/lối ra và cổng hai chiều; kiểm điều kiện cấp vùng nhánh. Đã xuất dữ liệu sim và vector đối chiếu C#; máy hiện không có .NET SDK để chạy bộ NUnit.
- Chưa phát hành EXE/APK mới hoặc khởi động lại server thật cho đợt ba vùng này; bản Windows trước đó chưa chứa các map này.

Unity ImportAllBatch đã hoàn tất, thoát mã 0, không có cảnh báo; các map và bộ cây mới đã vào tài nguyên Unity.

## 5.11 Mê cung săn kho báu — bổ sung 26/10/2026

**Chủ dự án đã chốt:** bổ sung **các mê cung** để người chơi vào khám phá, kiếm **châu báu, vàng và đồ trang trí nhà**. Mê cung là nguồn kiếm các vật phẩm trang trí / sưu tầm, nối với khuôn viên riêng và chợ giao thương. **Trạng thái: đã ghi kế hoạch, chưa triển khai map hoặc gameplay.**

### Vòng chơi và phần thưởng

**Vào mê cung → tìm đường / khám phá → tìm kho báu → nhận phần thưởng → đem về trưng bày trong nhà hoặc bán ở chợ khi vật phẩm được phép trao đổi.**

| Phần thưởng đã chốt | Công dụng / việc cần thiết kế |
|---|---|
| Châu báu | Vật phẩm giá trị để sưu tầm, trưng bày hoặc buôn bán theo công dụng từng món; cần thiết kế danh mục và độ hiếm |
| Vàng | Phần thưởng kinh tế trong game; cần thống nhất với hệ tiền hiện có và cân theo độ khó |
| Đồ trang trí nhà | Người chơi mang về kho nội thất, đặt trong nhà / khuôn viên; có thể bán ở chợ nếu món đó được phép trao đổi |

- Có nhiều mê cung với chủ đề và bộ phần thưởng riêng để việc khám phá tạo ra các bộ đồ sưu tầm / trang trí khác nhau. Số mê cung, tên, chủ đề và danh sách vật phẩm chưa chốt.
- **Mê cung là một nguồn đồ trang trí nhà được xác nhận**, không mặc nhiên là nguồn duy nhất của mọi món nội thất. Ghi rõ mê cung xuất xứ trên vật phẩm / thông tin nguồn kiếm khi thiết kế danh mục.
- Cách nhận đề xuất: mở rương, tìm phòng kho báu hoặc thu hồi cổ vật có tương tác nhận đồ. Ví dụ vật trang trí: tượng nhỏ, bình cổ, tranh, đèn, đồ trưng bày; đây là ví dụ để thiết kế, chưa phải danh mục vật phẩm đã duyệt.
- Đồ kiếm được cần tồn tại như vật phẩm có quyền sở hữu để đem về đặt hoặc giao thương, không chỉ là hình trang trí của map. Quy tắc vật nào có thể nhặt / nhận phải thể hiện rõ cho người chơi.
- Châu báu / đồ lưu niệm được phép trao đổi đi vào nhóm hàng sưu tầm của chợ; nội thất đi vào nhóm Trang trí nhà. Vàng ghi vào số dư theo luật tiền tệ máy chủ.

### Phần còn cần thiết kế

- Bố cục mê cung, ngã rẽ, phòng bí mật, lối vào / lối ra và cách quay về.
- Cấp yêu cầu, độ khó, quái / bẫy / câu đố / boss nếu có; đi một mình hay cùng nhóm, map chung hay phiên riêng.
- Điều kiện mở rương / nhận thưởng, chia phần thưởng khi có nhiều người, bảng rơi, số lượng vàng, lượt vào / hồi rương nếu có. Chưa tự áp luật tranh boss hoặc Long Châu của Long Huyệt lên kho báu mê cung.
- Vật phẩm có thể bán, món ràng buộc nếu cần, cách trưng bày và bộ sưu tầm theo từng mê cung; hình map, rương, cổ vật và nội thất.
- Máy chủ kiểm quyền nhận kho báu, trạng thái rương / lần khám phá và cấp phần thưởng nhất quán; lưu kết quả để kết nối lại hoặc gửi yêu cầu trùng không nhận hai lần cùng phần thưởng. Tích hợp kho đồ, số dư tiền, nhà riêng và chợ.

### Tiến độ

- Đã thêm yêu cầu mê cung và 3 nhóm phần thưởng vào kế hoạch thế giới / roadmap.
- Đã nối nguồn đồ mê cung với nhà riêng (`docs/ke-hoach-nha-rieng.md` mục 2.8) và chợ (`docs/ke-hoach-xa-hoi.md` mục 3.1).
- Chưa dựng mê cung, vẽ bộ vật phẩm, triển khai nhận thưởng hoặc thay đổi dữ liệu người chơi.

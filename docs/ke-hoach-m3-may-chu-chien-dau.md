# Kế hoạch M3: máy chủ nắm chiến đấu + kinh tế (soạn 08/10/2026, chủ dự án DUYỆT 08/10/2026 — đang làm)

## 1. Vì sao cần

Hiện mọi thứ do máy người chơi quyết: `CombatSystem` (client, ~3.300 dòng) tự tính quái, sát thương, EXP, xu, rơi đồ; máy
chủ chỉ lưu nguyên khối tiến độ client gửi lên (`CharacterProgress` + `story`). Hệ quả:

- Sửa bản lưu / gửi gói `save` giả là có xu, cấp, đồ tuỳ ý → **không làm được cửa hàng, giao dịch (X3), chợ, nhà riêng bán
  nông sản** một cách công bằng — mọi thứ đổi ra xu đều bị phá.
- Mỗi người thấy bầy quái RIÊNG của mình (quái không dùng chung) → không có **tổ đội** (X4) đúng nghĩa.

## 2. Mục tiêu

Máy chủ là nguồn sự thật cho: **quái** (vị trí, máu, trạng thái, hồi sinh), **sát thương**, **EXP / cấp**, **xu**, **túi đồ +
trang bị**, **rơi đồ**. Client gửi Ý ĐỊNH (đi, dùng kỹ năng X hướng Y, nhặt đồ, mặc đồ) và vẽ theo trạng thái máy chủ, có dự đoán
phía client để không thấy trễ.

## 3. Cách làm — tách lõi mô phỏng dùng chung

1. **`packages/sim`** (mới): lõi THUẦN không Pixi/DOM — luật đòn (`skillRules`), dữ liệu kỹ năng (`skills`), cây (`talents`),
   phản ứng nguyên tố, chỉ số quái, AI quái, va chạm map (NavGrid đọc từ map JSON). Phần lớn đã thuần sẵn (đang test bằng
   node), việc chính là tách phần hình (`Vfx`, `Particles`, `Actor`, sprite) khỏi `CombatSystem` qua một lớp "sự kiện"
   (`hit`, `reaction`, `kill`, `drop`…) mà client dùng để vẽ.
2. **Máy chủ chạy sim theo map**: mỗi map có người → một vòng mô phỏng 20 nhịp/giây (quái + đạn + vùng). Map trống thì ngủ.
3. **Giao thức**: client gửi `cast {skill, aim}`, `dodge`, `pickup {id}`, `equip/unequip`, `use_potion`; máy chủ gửi ảnh chụp
   quái (vị trí / máu / trạng thái theo vùng nhìn), sự kiện đòn, tiến độ (EXP, xu, túi đồ) đã tính.
4. **Dự đoán phía client**: đòn của chính mình hiện vệt chém / số sát thương DỰ ĐOÁN ngay (như bây giờ), máy chủ xác nhận
   hoặc sửa (máu quái nhảy về số thật). Di chuyển giữ như hiện tại (máy chủ đã chặn quá tốc).
5. **Kinh tế ở máy chủ**: `coins`, túi đồ, trang bị thành bảng riêng trong CSDL (không còn nằm trong blob `story`); mọi thay
   đổi qua một hàm `ledger` ghi nhật ký (nguồn: quái / nhiệm vụ / cửa hàng / giao dịch) — làm nền cho X3 giao dịch.
6. **Cốt truyện**: phần thưởng nhiệm vụ (xu, đồ, EXP) chuyển sang máy chủ cấp khi nhiệm vụ hoàn thành; diễn biến hội thoại
   vẫn ở client.

## 4. Giai đoạn

| GĐ | Nội dung | Kết quả thấy được |
|---|---|---|
| **M3.1** | Tách `packages/sim` (không đổi hành vi — mọi test hiện có vẫn qua), client chạy sim qua lớp sự kiện | Không đổi gì với người chơi; nền cho bước sau |
| **M3.2** | Máy chủ chạy quái dùng chung theo map, client vẽ quái theo máy chủ; sát thương máy chủ tính | Hai người cùng đánh một con quái, thấy cùng thanh máu |
| **M3.3** | EXP / cấp / xu / rơi đồ / túi đồ / trang bị ở máy chủ + nhật ký kinh tế; chuyển bản lưu cũ (blob → bảng) | Sửa bản lưu không còn ra xu / đồ |
| **M3.4** | Tổ đội (X4): chia EXP / rơi đồ, thấy máu đồng đội | Đánh cùng nhau có lợi |

Rủi ro chính: `CombatSystem` đan xen hình và luật (gọi thẳng `vfx.play`, `float`, `shake` giữa luật) — M3.1 là bước tốn công
nhất; độ trễ mạng với đòn cận chiến (cần dự đoán tốt); tải máy chủ khi nhiều map có người (sim nhẹ, nhưng cần đo).

## Tiến độ

- **M3.1a — ĐÃ LÀM (08/10/2026)**: gói `packages/sim` (`@aether/sim/<module>`) chứa luật thuần dùng chung — `skillRules`,
  `skills`, `talents`, `bossRules`, `equipment` (chuyển nguyên file; web giữ file cũ dạng `export * from '@aether/sim/…'` nên
  không import nào phải đổi). `ReactionId` chuyển từ `CombatSystem` sang `skillRules`. Máy chủ (NodeNext) đọc được gói: import
  tương đối trong gói ghi đuôi `.ts`; web bật `allowImportingTsExtensions` + `transpilePackages`. Mọi test cũ qua, Next build qua.
- **M3.1b — ĐÃ LÀM (08/10/2026)**: `collision` + `NavGrid` chuyển sang `sim` (máy chủ dựng va chạm / tìm đường từ map JSON).
- **M3.2a — ĐÃ LÀM (08/10/2026): quái dùng chung.** Cách làm khác bản thảo ở mục 3 (chép AI sang máy chủ = viết lại ~3.300 dòng):
  - **Máy chủ giữ "sổ quái" theo map** (`apps/server/src/mobs.ts`): khu nào dùng chung = khu thế giới người lớn (`fromAge` ≥ 16,
    không `onDemand` — `@aether/sim/mobs`); chỗ sinh tất định (cùng công thức client); máu, sống / chết, hồi sinh (14 giây /
    boss vùng 3 phút), **ai được tính công** (mọi người gây sát thương trong 30 giây), **đếm số lần hạ** vào bảng `kill_counts`
    (nền cho NPC Thành tựu phát kim cương).
  - **Một người chơi làm "chủ" mỗi con** và chạy AI sẵn có của client, báo vị trí 10 lần/giây; người khác thấy con rối đi theo.
    Người chơi lọt tầm phát hiện con rối thì xin làm chủ — máy chủ đổi khi người đó GẦN quái hơn chủ cũ ⇒ quái luôn đuổi người
    gần nhất. Chủ rời map → chuyển cho người gần nhất, map vắng → để trống, người vào sau nhận.
  - **Đòn trúng do client báo** (`mobHit`), máy chủ kiểm: quái còn sống, số dương, người đánh đứng trong 900px, ≤ 40 đòn/giây;
    trừ máu thật rồi phát cả map (số sát thương của người khác hiện màu xám). Client không tự cho quái gục — chờ `mobDie`; chỉ
    người được tính công mới nhận xu / EXP / tiến độ nhiệm vụ.
  - Khu nhiệm vụ tuổi thơ, boss cốt truyện, chơi một mình: vẫn quái RIÊNG như cũ.
  - Test: `apps/server/tests/mobs.test.ts` (8 ca, gồm qua `World` + CSDL thật), `apps/web/tests/netmobs.test.ts`; thử thật trên
    máy chủ thử với trình duyệt + bot người chơi thứ hai: số sát thương của bot hiện trên nấm, đánh chung → "công: 2 người",
    người được tính công nhận xu.
- **M3.2b — ĐÃ LÀM (08/10/2026): quái đánh mọi người + khống chế dùng chung.**
  - **Động tác đánh** (`mobAct`): chủ quái phát lấy đà (`wind`), nhát cận chiến (`melee`), bắn (`shot`), vùng nổ boss (`aoe`) —
    máy chủ CHỈ nhận từ chủ con đó, kiểm nổ gần chỗ quái (thân 160px / vùng nổ 480px), chuẩn hoá hướng, phát cho người khác.
    Mỗi máy tự xét người chơi CỦA MÌNH: nhát chém trúng khi đứng trong tầm + trong nón ±72° phía trước quái (né đúng lúc vẫn
    phản được), đạn bay thật trên máy mình, vùng nổ nổ thật. **Tin không mang con số sát thương** — máy nhận tính từ chỉ số
    quái của mình, nên chủ quái sửa client cũng không đánh mạnh người khác được. Con rối diễn động tác đánh như quái thật.
  - **Boss dùng chung nhắm vùng nổ vào bất kỳ ai** trong 360px (cả người chơi máy khác), không chỉ người làm chủ.
  - **Khống chế** (`mobCc`): khi khống chế trên quái dùng chung TĂNG ở máy nào (đòn của mình lên con rối, hay quái mình làm chủ)
    thì máy đó gửi phần tăng; máy chủ kiểm người gửi đứng trong 900px, kẹp trần (`@aether/sim/mobs` `MOB_CC_CAP`, cú đẩy ≤ 2000px/s
    · 0,3 giây) rồi phát cho mọi người khác. Chủ áp vào AI (đóng băng / choáng / hất thì đứng im, chậm, đánh trượt, bị đẩy thật);
    máy khác thấy màu + ăn phá giáp / vỡ giáp cho đòn của mình. Đồng bộ: đóng băng, choáng, hất, chậm, lạnh, lạnh sâu, phá giáp,
    vỡ giáp, Bão Cát, Gió Loạn. **Không** đồng bộ ướt / cháy / bụi đất: đó là nguyên liệu phản ứng của riêng người gây ra
    (đồng bộ thì hai người cùng ăn một lần phản ứng, cháy thì nhịp đốt tính hai lần). Máy nhận ghi mức đã biết nên không dội lại.
  - Test: `apps/server/tests/mobs.test.ts` (+2 ca), `apps/web/tests/netmobs.test.ts` (+4 khối: nhát / đạn / vùng nổ của chủ
    khác, khống chế hai chiều không dội, chủ bị đóng băng + đẩy, boss nhắm người khác). Thử thật trên máy chủ thử (trình duyệt làm
    chủ 17 con nấm + bot đứng sát): bot nhận 54 nhát (48 trúng, 6 trượt vì đứng sau lưng / ngoài tầm), bot đóng băng quái → ở
    trình duyệt quái đứng im đúng ~3 giây mỗi lần, trình duyệt không gửi lại tin nào (0 tin dội).
  - Giới hạn còn lại: phá băng sớm (Tan Chảy, Vỡ Vụn của Thổ) chỉ xảy ra ở máy người đánh — máy khác còn băng tới hết giờ; người
    có Vỡ Vụn (Băng 9) thấy băng do người khác gây ra tan cũng nổ vụn băng của mình (coi như phần thưởng đánh chung).
- **M3.3a — ĐÃ LÀM (08/10/2026): cấp / EXP / xu / bình hồi phục ở máy chủ.**
  - **Máy chủ là nguồn sự thật** (`apps/server/src/economy.ts`, luật thuần `@aether/sim/economy`): gói `save` / PUT tiến độ của client
    KHÔNG ghi đè được bốn số này (`Store.saveProgress` giữ nguyên trong CSDL). Vào game và mỗi lần đổi máy chủ gửi `eco` (số thật + phần
    vừa nhận); client vẽ theo (`CombatSystem.setEconomy` — lên cấp diễn từng cấp như trước). Bản lưu cũ: số client tự ghi trước đó được
    nhận một lần làm số khởi đầu (kẹp khoảng hợp lệ).
  - **Nguồn**: quái DÙNG CHUNG — máy chủ tự trao lúc tính công (× bình EXP đang dùng → phần EXP của K4 đã ở máy chủ); quái RIÊNG (khu
    tuổi thơ / nhiệm vụ / boss cốt truyện) — client báo `kill`, máy chủ chỉ nhận loại có trong khu riêng (hoặc là boss) của map đang
    đứng, mỗi loại tối đa SỐ CON có thật trên map trong một nhịp hồi sinh 14 giây, boss cốt truyện một lần; **nhiệm vụ** — client báo
    `quest <id>`, máy chủ thưởng theo dữ liệu truyện của chính nó (dữ liệu truyện chuyển sang `packages/sim/src/story/`), mỗi nhiệm vụ
    một lần; **quà điểm danh** — máy chủ cộng thẳng.
  - **Tiêu**: tẩy điểm, dịch chuyển (`spend`), uống bình (`potion`) — client làm ngay, máy chủ trừ; thiếu thì không trừ và gửi lại số
    thật. **Nhật ký** `eco_ledger` (mọi thay đổi trừ hạ quái thường — đã đếm ở `kill_counts`); `ref` duy nhất chặn trao lặp.
  - Chơi một mình (không phiên trực tuyến — trang lab) vẫn tự cộng như cũ.
  - Test: `apps/server/tests/economy.test.ts` (11 ca), `apps/web/tests/economy.test.ts`; thử thật: client tự cộng 1 triệu EXP (lên cấp
    35 ở máy mình) → tải lại trang về đúng cấp máy chủ; trả nhiệm vụ thật → máy chủ trao EXP qua `eco`.
  - Hệ quả: mốc cấp của cổng vùng, giá dịch chuyển, xu tẩy điểm giờ theo số máy chủ (cổng vùng vẫn kiểm ở client, nhưng cấp đã thật).
    "Xoá tiến độ, chơi lại" (bảng Dev) không còn đặt lại cấp / xu ở máy chủ.
- **Còn thiếu (M3.3b+)**: túi đồ + trang bị ở máy chủ (đồ mới chỉ có quà cốt truyện — chưa có rơi đồ / mua đồ bằng xu); rơi đồ; kiểm
  sát thương theo chỉ số người chơi; máu người chơi vẫn ở client; hiệu ứng bình chiến đấu vẫn ở client.

## 5. Trước khi có M3 (đã / có thể làm)

- Máy chủ kẹp cấp 1–100 (08/10/2026), kẹp xu / EXP trong khoảng hợp lệ (`cleanProgress`).
- Có thể thêm **ghi nhận bất thường** (cấp / xu nhảy vọt giữa hai lần lưu) vào bảng để quản trị xem — không chặn, tránh phạt
  nhầm người chơi thật.

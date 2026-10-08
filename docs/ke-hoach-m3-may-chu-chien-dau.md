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
- **Còn thiếu (M3.2b)**: (1) quái chỉ đánh người chơi của máy làm chủ — người khác đứng sát nhưng không gần bằng chủ thì không bị
  đánh; (2) khống chế (đóng băng, choáng, đẩy lùi, chậm) do người KHÔNG làm chủ gây ra chỉ hiện ở máy họ, AI ở máy chủ quái
  không biết — cần gửi kèm hiệu ứng trong `mobHit` để chủ áp; (3) kiểm sát thương theo chỉ số người chơi (M3.3, khi cấp /
  trang bị ở máy chủ); (4) phần thưởng vẫn cộng ở client (M3.3).

## 5. Trước khi có M3 (đã / có thể làm)

- Máy chủ kẹp cấp 1–100 (08/10/2026), kẹp xu / EXP trong khoảng hợp lệ (`cleanProgress`).
- Có thể thêm **ghi nhận bất thường** (cấp / xu nhảy vọt giữa hai lần lưu) vào bảng để quản trị xem — không chặn, tránh phạt
  nhầm người chơi thật.

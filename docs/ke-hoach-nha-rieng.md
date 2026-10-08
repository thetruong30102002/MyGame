# Kế hoạch: Nhà riêng — xây nhà, trồng cây, chăn nuôi (thêm 08/10/2026)

Chủ dự án 08/10/2026: thêm **xây nhà riêng, trồng cây, chăn nuôi, …** vào kế hoạch. Đây là vòng chơi THỨ HAI bên cạnh đánh
quái: lúc không cày thì về nhà chăm vườn, và sản phẩm nhà làm ra quay lại phục vụ đánh quái (đồ ăn buff, bình máu, nguyên
liệu rèn) + bán lấy xu. Nối với 10 vùng (`docs/ke-hoach-the-gioi.md`): mỗi vùng mang về hạt giống / con giống / nguyên liệu riêng.

## 1. Mảnh đất riêng ở đâu

| Cách | Ưu | Nhược |
|---|---|---|
| **Map riêng mỗi người (instance)** — "Trang trại" mở từ trạm vùng 1 | không tranh chỗ, không bị phá, 1 người 1 map nên máy chủ nhẹ, đẹp được theo ý | phải dựng cơ chế map riêng + thăm nhà |
| Lô đất chung trên map thế giới | thấy nhà nhau ngay | 70 map không đủ chỗ cho nhiều người, người bỏ game để lại nhà hoang, tranh lô |

**CHỐT 08/10/2026 (chủ dự án): mỗi người một map nhà riêng.** "Nhà riêng chỉ user nào tự vào được user nhà đó, có thể có tính
năng xem nhà người khác chứ không thao tác được."

- **Chủ nhà**: vào bằng cổng "Về nhà" ở trạm vùng 1 (Thistlewood) hoặc nút "Về nhà" trên HUD (có thời gian hồi để không thành
  cách thoát trận). Chỉ chủ nhà được THAO TÁC: xây, đặt / cất đồ, gieo, tưới, thu, cho ăn, mở kho.
- **Người xem** (chế độ "Xem nhà") — **CHỈ BẠN BÈ** (chốt 08/10/2026; kết bạn ở `docs/ke-hoach-xa-hoi.md`): mở từ bảng Bạn bè
  hoặc bấm tên người chơi → nút "Xem nhà" (người lạ không có nút). Huỷ bạn lúc đang xem thì bị đưa ra. Vào map nhà đó ở chế độ **chỉ xem**: đi lại, nhìn vườn, chuồng, đồ trang trí, điểm đẹp; MỌI thao tác bị tắt (không
  có nút E, không mở kho, không nhặt). Thoát thì về đúng chỗ đang đứng trước khi xem.
- **Máy chủ kiểm quyền**: mọi lệnh thay đổi trang trại chỉ nhận từ chủ nhà (so tài khoản đăng nhập với chủ map); người xem chỉ
  nhận ẢNH CHỤP trạng thái (đọc), không có đường gửi lệnh ghi — giao diện tắt nút chỉ là phụ, chặn thật ở máy chủ.
- **Chủ nhà đang ở nhà thì THẤY người xem** (chốt 08/10/2026): hình nhân vật người xem **mờ** (trong suốt ~50%) kèm tên; người
  xem cũng thấy chủ nhà bình thường. Người xem không đánh nhau, không va chạm / chặn đường chủ nhà; chat qua chat riêng.
- Đất ban đầu nhỏ (một ngôi nhà gỗ + 6 ô vườn + 1 chuồng nhỏ); **mở rộng đất** bằng xu + nguyên liệu, theo cấp nhà.
- Nhà có **cấp** (1 → 5): cấp càng cao càng nhiều ô vườn, chuồng to hơn, mở thêm xưởng (bếp, lò rèn, khung cửi), kho lớn hơn.
- Trang trại ở ngoài vùng chiến đấu: không quái, không mất máu.

## 2. Các hệ trong nhà

### 2.1 Xây dựng + trang trí

- Lưới đặt đồ (theo ô 32px như map): chọn món trong "túi đồ nội thất", đặt / xoay / cất. Không đặt chồng, không chặn lối vào nhà.
- Công trình chức năng: **nhà chính** (cấp nhà), **kho** (thêm ô chứa ngoài túi đồ), **chuồng** (gà / bò / cừu…), **bếp**,
  **lò rèn nhỏ**, **khung cửi**, **giếng** (tưới cả vườn), **bù nhìn** (tăng sản lượng).
- Đồ trang trí (hàng rào, đèn, hoa, tượng, cờ…) — chỉ để đẹp, mua ở thợ mộc / rơi ở boss / sự kiện. Có "điểm đẹp" của trang
  trại để khoe khi người khác vào xem (về sau có thể xếp hạng).
- Xây công trình chức năng tốn **gỗ, đá, sắt** — lấy từ khai thác ở các vùng (chặt cây, đập đá: nút E ở điểm khai thác trên
  map săn, hồi sau vài phút) + rơi từ quái.

### 2.2 Trồng trọt

- Ô vườn: **cuốc → gieo → tưới → chờ → thu**. Cây lớn theo **giờ thật của máy chủ** (offline vẫn lớn), 4 giai đoạn hình.
- Không tưới thì lớn chậm (không chết — tránh phạt người chơi bận); bù nhìn / phân bón tăng sản lượng.
- **Hạt giống theo vùng**: vùng 1 lúa mì, cà rốt, khoai, dâu; Đầm lầy lúa nước, nấm; Sa mạc xương rồng quả, chà là; Băng
  dâu tuyết; Núi lửa ớt lửa; San Hô dừa, rong biển; Rừng Nấm nấm phát quang… → muốn trồng đủ thì phải đi đủ vùng.
- Thời gian lớn từ 5 phút (cây rẻ) tới 8 giờ (cây quý) — vào lại game là có thứ để thu.

### 2.3 Chăn nuôi

- Con giống mua ở NPC hoặc **thuần phục** quái hiền ở vùng (gà rừng, cừu núi, bò sa mạc… — tỉ lệ nhỏ khi hạ, cần thức ăn).
- Cho ăn (cỏ khô, ngũ cốc từ vườn) → mỗi ngày ra sản phẩm: trứng, sữa, len, mật ong (tổ ong). Vuốt ve tăng **thân thiết**
  → sản phẩm tốt hơn. Bỏ đói thì ngừng ra sản phẩm (không chết).
- Con vật đi lại trong chuồng (AI đi lang thang như NPC có sẵn).
- Về sau: **thú cưng / thú cưỡi** từ chăn nuôi (đi theo người chơi; thú cưỡi tăng tốc chạy ngoài trận).

### 2.4 Nghề phụ dùng sản phẩm nhà (gợi ý — "…" của chủ dự án)

| Nghề | Đầu vào | Đầu ra |
|---|---|---|
| **Nấu ăn** (bếp) | lúa, rau, trứng, sữa, thịt từ quái, cá | món ăn buff tạm (máu tối đa, hồi MP, kháng hệ của vùng sắp vào) |
| **Câu cá** (hồ trong nhà + sông/biển các vùng) | cần câu, mồi | cá theo vùng → nấu ăn / bán |
| **Pha chế** | thảo dược (vườn + hái ngoài map — đã có Cỏ thuốc, Nấm Ánh Lam) | bình máu / MP, thuốc kháng hệ |
| **Rèn / may** (lò rèn, khung cửi) | quặng, len, da | trang bị, nâng cấp đồ (nối với thợ rèn / thợ may của NPC dịch vụ) |

## 3. Nối với phần còn lại của game

- **Bắt buộc làm SAU kế hoạch đồ đạc / kinh tế** (xu + túi đồ kiểm ở máy chủ): nông sản bán được ra xu và nấu ra đồ buff, nên
  để ở client là gian lận ngay. Trạng thái trang trại (ô vườn, giờ gieo, con vật, đồ đã đặt) lưu ở **máy chủ**; cây lớn tính
  từ dấu thời gian máy chủ, client chỉ hiển thị.
- **Cân kinh tế**: tiền từ trang trại không được vượt tiền đánh quái cùng thời gian chơi (giới hạn ô vườn theo cấp nhà, cây quý
  lâu lớn) — trang trại là nguồn ĐỒ DÙNG (buff, nguyên liệu) nhiều hơn là nguồn xu.
- **Cấp người chơi không đổi** khi làm nông (không exp) — tránh cày cấp bằng cách trồng cây; có "cấp nghề" riêng cho từng nghề.
- Xem nhà người khác: chỉ bạn bè, chỉ đọc (mục 1) → **cần X1 kết bạn** (`docs/ke-hoach-xa-hoi.md`) trước N1.

## 4. Hình (PixelLab) + chi phí lượt

Map trang trại cùng style vùng 1 (nhà chính diện viền đen, cây lá như Thistlewood) — dùng chung bộ đồ vật vùng 1 cho nền.

| Hạng mục | Cách vẽ | Token | Lượt |
|---|---|---|---|
| Nhà chính 5 cấp + kho, chuồng, bếp, lò rèn, khung cửi, giếng | tấm Pro Flash 3×3 (hoặc `create_building_kit`) | miễn phí | ~5 tấm × 6 = 30 |
| Cây trồng: mỗi cây 4 giai đoạn + nông sản | 2 cây / tấm 3×3 (4 + 4 + 1 icon) | miễn phí | ~12 cây → 6 tấm × 6 = 36 |
| Con vật (gà, bò, cừu, ong, + thú vùng): đứng, đi, ăn | nhân vật nhỏ PixelLab + `animimg` | miễn phí | ~6 × 25 = 150 |
| Đồ trang trí, nội thất | tấm 3×3 | miễn phí | ~6 tấm × 6 = 36 |
| Động tác người chơi: cuốc, tưới, gieo, câu cá, cho ăn | animate trên nhân vật chính (4 nhân vật) | **trả phí** | ~5 × 4 × 15 = 300 |
| Icon nguyên liệu / món ăn | tấm icon 3×3 | miễn phí | ~4 tấm × 6 = 24 |

≈ **280 lượt miễn phí** (~4 ngày lượt thưởng) + **~300 lượt trả phí** (động tác làm nông của 4 nhân vật). Động tác chưa có thì
tạm dùng động tác `attack` / `cast` sẵn có (luật "làm trước, có hình thì thay").

## 5. Giai đoạn

| GĐ | Nội dung | Kết quả |
|---|---|---|
| **N1** | Map nhà riêng (instance, chỉ chủ vào thao tác) + cổng / nút về nhà + lưu trạng thái ở máy chủ + đặt / cất đồ trang trí + kho + **chế độ Xem nhà** (chỉ đọc, máy chủ chặn ghi) | Có nhà, bày đồ, người khác vào ngắm được |
| **N2** | Trồng trọt (cuốc, gieo, tưới, lớn theo giờ máy chủ, thu) + hạt giống vùng 1 + bán nông sản | Vòng chơi trồng — thu — bán |
| **N3** | Chăn nuôi (mua con giống, cho ăn, sản phẩm mỗi ngày, thân thiết) | Gà, bò, cừu |
| **N4** | Nấu ăn + pha chế (buff đi đánh quái) + câu cá | Sản phẩm nhà phục vụ đánh quái |
| **N5** | Nâng cấp nhà 1 → 5, xây công trình bằng gỗ / đá / sắt, khai thác ở các vùng | Mở rộng dài hạn |
| **N6** | Điểm đẹp + bảng xếp hạng nhà đẹp, thú cưng / thú cưỡi | Khoe + xã hội |

Mỗi vùng mới (`docs/ke-hoach-the-gioi.md`) mang thêm: hạt giống, con giống, cá, nguyên liệu của vùng đó.

## 6. Thứ tự tổng (bản cũ — bản mới nhất ở mục 6 của `docs/ke-hoach-xa-hoi.md`)

1. Đồ đạc / kinh tế, kiểm ở máy chủ (đang đề xuất làm tiếp) — nền cho mọi thứ dưới.
2. Thế giới T0: tranh lục địa (đang chờ PixelLab) + UI bản đồ tổng + khung nhiều vùng + trần cấp 100.
3. Hoàn thiện vùng 1 (T1) → **Nhà riêng N1–N2** (vùng 1 đủ hạt giống) → vùng 2 → N3 → vùng 3 … xen kẽ, để mỗi đợt
   cập nhật có cả vùng mới lẫn thứ mới ở nhà.

## 7. Câu hỏi cần chủ dự án chốt

1. ~~Map riêng hay lô chung~~ — **chốt: map riêng, chỉ chủ thao tác, người khác chỉ xem** (mục 1).
   **Chốt thêm**: chỉ bạn bè được xem; chủ nhà thấy người xem dạng hình mờ + tên.
2. "…" còn muốn thêm nghề nào: câu cá, nấu ăn, pha chế, rèn, may (đã gợi ý) — hay khác (khai mỏ, săn bắn, nuôi thú cưỡi…)?
3. Có cho **bán nông sản giữa người chơi** (chợ / giao dịch) không? Có thì cần hệ giao dịch + chống lừa đảo riêng.

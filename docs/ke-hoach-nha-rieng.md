# Kế hoạch: Khuôn viên riêng, nhà cửa, sản xuất và hồ câu cùng bạn bè

> **Bổ sung đã chốt 26/10/2026:** mỗi user có **một khuôn viên riêng**, gồm nhà ở và không gian trồng trọt; thu hoạch thực phẩm, nguyên liệu và nhiên liệu để **chế tạo vật phẩm tiêu hao, nấu ăn**. Chủ nhà được chỉnh sửa nhà cửa, sắp xếp và trang trí; **bạn bè vào tham quan**. Thêm **một map hồ cá dùng chung để câu cá cùng bạn bè**, ngoài khuôn viên riêng. Đây là kế hoạch phát triển, chưa triển khai gameplay.

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

**Làm rõ 26/10/2026:** khuôn viên gắn với **tài khoản user**, mỗi user một khuôn viên; đăng nhập lại hoặc thay ngoại hình / class không tạo thêm khuôn viên. Nhà, vườn, công trình và cách bày trí đều lưu lại trong khuôn viên đó.

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

- **Chỉnh sửa nhà cửa (chốt 26/10):** chủ nhà có chế độ chỉnh nhà / khuôn viên để bố trí công trình, sắp xếp nội thất và đồ trang trí. Phác thảo thao tác: chọn → xem trước vị trí / hướng → xác nhận đặt; có thể di chuyển, xoay hoặc cất món đã sở hữu. Không mất món khi chỉ đổi vị trí.
- Lưới đặt đồ (theo ô 32px như map): chọn món trong "túi đồ nội thất", đặt / xoay / cất. Không đặt chồng, không chặn lối vào nhà.
- Công trình chức năng: **nhà chính** (cấp nhà), **kho** (thêm ô chứa ngoài túi đồ), **chuồng** (gà / bò / cừu…), **bếp**,
  **lò rèn nhỏ**, **khung cửi**, **giếng** (tưới cả vườn), **bù nhìn** (tăng sản lượng).
- Đồ trang trí (hàng rào, đèn, hoa, tượng, cờ…) — chỉ để đẹp, mua ở thợ mộc / rơi ở boss / sự kiện. Có "điểm đẹp" của trang
  trại để khoe khi người khác vào xem (về sau có thể xếp hạng).
- Xây công trình chức năng tốn **gỗ, đá, sắt** — lấy từ khai thác ở các vùng (chặt cây, đập đá: nút E ở điểm khai thác trên
  map săn, hồi sau vài phút) + rơi từ quái.

### 2.1b Bên trong nhà — các phòng (chốt 28/10/2026)

Nhà có **bên ngoài** (khuôn viên, sân vườn, công trình) và **bên trong** (vào cửa nhà chính sang map trong nhà). Bên trong chia phòng, mở thêm theo cấp nhà; chủ nhà đặt / xoay / cất nội thất và đồ trang trí từng phòng như ngoài sân; bạn bè vào xem được cả trong nhà, không thao tác.

| Cấp nhà | Phòng mở thêm |
|---|---|
| 1 | Phòng khách kiêm phòng ngủ |
| 2 | Bếp |
| 3 | Phòng ngủ riêng, kho |
| 4 | Phòng trưng bày (châu báu, đồ mê cung) |
| 5 | Tầng 2 hoặc sân thượng |

- Tường / sàn / cửa / cửa sổ / cầu thang theo 3 phong cách (gỗ, đá, sang); khung phòng do code ghép từ bộ tường – sàn, không vẽ nguyên phòng.
- Nội thất theo phòng (giường, tủ, bàn ghế, sofa, lò sưởi, kệ sách, bếp lò, tủ kính, bệ tượng…) và đồ treo tường / đồ nhỏ (tranh, đồng hồ, cờ, bình hoa, nến, chậu cây, thảm). Món xoay được vẽ thêm hướng, không xoay ảnh pixel bằng code.
- Động tác trong nhà (ngồi ghế, nằm giường) là tuỳ chọn, vẽ trên thân nền + bộ đồ làm vườn chung như động tác sinh hoạt.
- Ánh sáng ngày / đêm trong nhà làm bằng code.

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

### 2.4 Sản xuất: thực phẩm, nhiên liệu, chế tạo và nấu ăn

**Chốt 26/10/2026:** sản phẩm từ trồng trọt / thu hoạch phục vụ nấu ăn và chế tạo vật phẩm tiêu hao. Cần có cả nhóm **thực phẩm, nguyên liệu chế tạo và nhiên liệu**. Ví dụ nguyên liệu / công thức dưới đây là phác thảo, chưa chốt sản lượng, thời gian và giá thành.

Vòng chơi: **trồng / thu thập → thu hoạch → cất kho → chế biến nguyên liệu / nhiên liệu → nấu ăn hoặc chế tạo → dùng vật phẩm trong chuyến phiêu lưu**. Cá câu được nối vào cùng kho nguyên liệu và hệ công thức.

| Nhóm sản phẩm | Ví dụ đề xuất | Công dụng |
|---|---|---|
| Thực phẩm | Rau, củ, ngũ cốc, trái cây; cá từ hồ câu | Nấu món ăn, chế biến thực phẩm |
| Thảo dược / vật liệu | Cây thuốc, sợi thực vật, hạt giống | Pha thuốc, chế tạo đồ tiêu hao, tái gieo trồng |
| Nhiên liệu | Gỗ / củi từ cây lấy gỗ; phụ phẩm khô; than chế biến từ gỗ | Cấp nhiên liệu cho công thức cần bếp / lò |

Nhiên liệu là đầu vào tiêu hao của những công thức có yêu cầu đốt; không mặc nhiên cho mọi món chế tạo đều cần nhiên liệu. Phải phân biệt nguyên liệu trực tiếp thu hoạch với sản phẩm cần chế biến tiếp, như gỗ thành than.

| Nghề | Đầu vào | Đầu ra |
|---|---|---|
| **Nấu ăn** (bếp) | Nông sản, cá, sản phẩm chăn nuôi; nhiên liệu theo công thức | Món ăn tiêu hao, hồi phục / buff tạm; thông số chờ cân |
| **Câu cá cùng bạn bè** (map hồ cá chung, mục 2.5) | Cần câu, mồi theo luật được duyệt sau | Cá → kho nguyên liệu → nấu ăn / công thức; bán cá theo luật kinh tế được chốt |
| **Pha chế / chế tạo đồ tiêu hao** | Thảo dược, nguyên liệu thu hoạch, vật liệu phụ; nhiên liệu nếu công thức yêu cầu | Bình hồi phục, thuốc hỗ trợ, đồ tiêu hao phục vụ phiêu lưu; danh sách cụ thể chờ thiết kế |
| **Rèn / may** (lò rèn, khung cửi) | quặng, len, da | trang bị, nâng cấp đồ (nối với thợ rèn / thợ may của NPC dịch vụ) |

### 2.5 Map hồ cá — câu cá cùng bạn bè

**Đã chốt 26/10/2026:** có một map hồ cá cho nhiều người vào câu cùng bạn bè. Đây là không gian sinh hoạt chung; người chơi phải nhìn thấy nhau và động tác câu, không phải mỗi người mở một bản hồ riêng.

- Hồ có bờ / cầu gỗ và các vị trí đứng câu; cho phép đi lại, chọn chỗ câu và trò chuyện với bạn bè qua hệ chat hiện có.
- Luồng đề xuất: vào hồ → gặp bạn ở cùng map / phiên → chọn vị trí → thả câu → chờ cá cắn → kéo cá → nhận cá vào túi nguyên liệu. Hành động có thể hủy để di chuyển hoặc rời hồ.
- Mỗi lượt câu và cá nhận thuộc về người câu; không đưa cá của người khác vào túi của mình. Đề xuất tài nguyên câu độc lập để bạn bè có thể câu cạnh nhau; giới hạn lượt và bảng cá chờ cân kinh tế.
- Cần đường đi để bạn bè tới đúng cùng hồ / phiên nếu map được chia phiên khi đông. Sức chứa, cách ghép phiên, lời mời và vị trí cổng vào chưa chốt.
- Chủ máy chủ quyết định thời điểm cá cắn, kết quả, số lượng cá và tiêu hao mồi; chống nhận thưởng lặp lại khi mất kết nối / gửi trùng yêu cầu.
- Ao cá trong khuôn viên riêng hoặc câu sông / biển là mở rộng về sau; map hồ chung là phần cần làm theo yêu cầu lần này.

### 2.6 Bạn bè tham quan khuôn viên

**Xác nhận lại 26/10/2026:** bạn bè vào khuôn viên để xem nhà, vườn và trang trí; chủ nhà thấy khách và khách thấy chủ nhà khi cùng ở đó. Giữ quyền chỉ chủ nhà được sửa / thu hoạch theo mục 1.

- Bạn bè được đi lại và xem khuôn viên, không thu hoạch hộ, lấy thực phẩm / nhiên liệu, dùng nguyên liệu, mở kho hoặc di chuyển nội thất của chủ nhà.
- Quyền truy cập và các thay đổi quan hệ bạn bè phải được máy chủ kiểm tra. Mở quyền cùng xây / cùng sản xuất cần yêu cầu mới, chưa nằm trong chế độ tham quan.
- Thăm nhà và câu cá là hai luồng liên kết từ bảng Bạn bè; chi tiết nút mời / tham gia là đề xuất giao diện để thiết kế sau.

### 2.7 Chợ giao thương — đầu ra cho sản phẩm khuôn viên

**Chủ dự án chốt 26/10/2026:** có chợ để người chơi buôn bán **lúa mì, cây giống, cá, đồ lưu niệm và đồ trang trí nhà**. Kế hoạch chi tiết ở `docs/ke-hoach-xa-hoi.md` mục 3.1.

- Vòng chơi bổ sung: trồng / câu cá / thu thập → dùng cho nấu ăn / chế tạo hoặc đưa hàng đủ điều kiện ra chợ → mua giống và đồ trang trí để phát triển khuôn viên.
- Giống mua ở chợ dùng để trồng; lúa mì / cá mua về dùng chung hệ nguyên liệu; lưu niệm / đồ trang trí thuộc sở hữu người mua và được trưng bày khi vật phẩm hỗ trợ đặt trong nhà.
- Đồ đang đặt trong nhà phải cất về kho trước khi bán. Mua / bán không tạo bản sao đồ, không trao quyền lấy tài sản trong nhà người khác.
- Vị trí chợ, hình thức quầy / niêm yết, bán offline, đấu giá, giá / tiền tệ / phí và nguồn đồ lưu niệm chưa chốt; việc có chợ và 5 nhóm hàng trên đã chốt.

### 2.8 Nguồn đồ trang trí: khám phá mê cung

**Chốt 26/10/2026:** người chơi vào các mê cung để kiếm **châu báu, vàng và đồ trang trí nhà**. Mê cung là nguồn vật phẩm trang trí / sưu tầm mang về khuôn viên; xem kế hoạch thế giới mục 5.11 trong `docs/ke-hoach-the-gioi.md`.

- Đồ trang trí nhận từ mê cung đưa vào kho nội thất của user, có thể đặt / xoay / cất như đồ đã sở hữu khác. Châu báu hoặc cổ vật có công dụng trưng bày được dùng làm đồ sưu tầm trong nhà.
- Bạn bè tham quan nhìn thấy các món đã bày. Có thể ghi xuất xứ mê cung trong thẻ vật phẩm để người chơi biết nơi kiếm món đó.
- Món được phép giao thương có thể mang ra chợ; đồ đã đặt phải cất về kho trước khi bán. Không tạo bản sao giữa phần thưởng mê cung, kho, nhà và hàng chào bán.
- Danh mục / độ hiếm, mê cung xuất xứ, luật rơi, quyền giao thương và giá trị của từng món còn cần thiết kế. Yêu cầu có mê cung và nguồn đồ trang trí từ đó đã được chốt.

## 3. Nối với phần còn lại của game

- **Bắt buộc làm SAU kế hoạch đồ đạc / kinh tế** (xu + túi đồ kiểm ở máy chủ): nông sản bán được ra xu và nấu ra đồ buff, nên
  để ở client là gian lận ngay. Trạng thái trang trại (ô vườn, giờ gieo, con vật, đồ đã đặt) lưu ở **máy chủ**; cây lớn tính
  từ dấu thời gian máy chủ, client chỉ hiển thị.
- **Cân kinh tế**: tiền từ trang trại không được vượt tiền đánh quái cùng thời gian chơi (giới hạn ô vườn theo cấp nhà, cây quý
  lâu lớn) — trang trại là nguồn ĐỒ DÙNG (buff, nguyên liệu) nhiều hơn là nguồn xu.
- **Cấp người chơi không đổi** khi làm nông (không exp) — tránh cày cấp bằng cách trồng cây; có "cấp nghề" riêng cho từng nghề.
- Xem nhà người khác: chỉ bạn bè, chỉ đọc (mục 1) → **cần X1 kết bạn** (`docs/ke-hoach-xa-hoi.md`) trước N1.
- Mỗi khuôn viên có chủ sở hữu ở tài khoản; lưu nhà / vật trang trí / kho / cây trồng và tiến trình sản xuất ở máy chủ. Thu hoạch, chế tạo và nấu ăn phải trừ đầu vào / nhiên liệu rồi cộng đầu ra trong một giao dịch, chặn nhận trùng hoặc tiêu nguyên liệu âm.
- Đề xuất công thức gồm đầu vào, số lượng, công trình yêu cầu, nhiên liệu nếu có, thời gian và đầu ra. Danh mục công thức / món ăn / cá, giới hạn buff và sản lượng là bước thiết kế tiếp, chưa chốt trong ghi chú này.

## 4. Hình (PixelLab) + chi phí lượt

### 4.1 Dự toán mới 28/10/2026 (thay bảng 08/10 bên dưới)

Mọi lượt là lượt **trả phí** (PixelLab khoá lượt miễn phí từ 10/10). Đơn giá: tấm đồ vật 3×3 ~6 lượt, công trình ~10, vật nuôi ~40, động tác người 8 hướng ~3 lượt/hướng; đã cộng ~30% vẽ lại. Số món là giả định để dự tính, chốt danh mục thì tính lại.

**Động tác sinh hoạt** (cuốc, tưới, gieo, câu cá, cho ăn) chỉ vẽ trên **thân nền nam / nữ + một bộ đồ làm vườn chung**: lúc làm việc nhà nhân vật tự hiện bộ này (đầu vẫn là đầu người chơi). Không vẽ trên từng bộ class (sẽ thêm ~37.000 lượt).

| Hạng mục | Giả định | Lượt |
|---|---|---|
| Công trình ngoài: nhà chính 5 cấp, kho, chuồng, bếp, lò rèn, khung cửi, giếng, bù nhìn | ~12 công trình | ~120 |
| Nền khuôn viên (đất, lối đi, vườn) | | ~50 |
| Đồ trang trí sân vườn (hàng rào, đèn, hoa, tượng, cờ, ghế đá, đài phun nước) | ~50 món | ~50 |
| Trong nhà: tường / sàn / cửa / cửa sổ / cầu thang | 3 phong cách | ~80 |
| Nội thất theo phòng | ~140 món | ~120 |
| Đồ treo tường, đồ nhỏ | ~50 món | ~50 |
| Thêm hướng xoay cho đồ xoay được | ~60 món × 2 hướng | ~105 |
| Động tác trong nhà ngồi / nằm (tuỳ chọn) | thân nền + bộ làm vườn | ~50 |
| **Cộng nhà (ngoài + trong)** | | **~625** |
| Động tác cuốc, tưới, gieo, cho ăn | 2 thân × 4 động tác × 8 hướng | ~500 |
| Cây trồng 4 giai đoạn + icon nông sản | ~30 cây (~3 / vùng) | ~90 |
| Vật nuôi (gà, bò, cừu, ong + thú vùng): đứng, đi, ăn | ~6 loài | ~240 |
| Icon nguyên liệu, món ăn, nhiên liệu | ~60 icon | ~40 |
| **Cộng trồng trọt / chăn nuôi / chế tạo** | | **~870** |
| Hồ câu chung: bờ, cầu gỗ, chỗ câu, hiệu ứng nước | | ~60 |
| Cá, cần câu, phao, mồi | ~30 loại cá | ~40 |
| Động tác câu cá | 2 thân × 8 hướng | ~125 |
| **Cộng hồ câu** | | **~225** |
| Quầy chợ | | ~30 |
| Mê cung: nền, đồ vật, rương, đồ trang trí sưu tầm | ~6 kiểu mê cung | ~300 |
| **Tổng nhóm nhà riêng** | | **~2.050** |

Ghép cùng tháng với phiên 1 nhân vật (~2.700) được ~4.750, sát trần gói 5.000 → dời mê cung (~300) sang tháng sau để chừa ~500 lượt dự phòng.

### 4.2 Dự toán lịch sử 08/10 (không dùng)

**Lưu ý 26/10/2026:** bảng chi phí dưới đây là ước lượng lịch sử 08/10, chưa bao gồm hồ câu chung và danh mục nhân vật hiện nay; không dùng làm dự toán mới. Cần bổ sung hình hồ / cầu câu, cá / cần câu / phao, nhiên liệu, công trình chế biến và động tác sinh hoạt. Các động tác phải theo ngoại hình vẽ liền, đúng tỉ lệ và độ nét của bộ nhân vật đang dùng; không mặc nhiên coi 4 nhân vật cũ là toàn bộ phạm vi.

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
| **N4** | Kho nguyên liệu / nhiên liệu + công thức chế biến, chế tạo đồ tiêu hao và nấu ăn | Thu hoạch → chế biến → đồ dùng phục vụ phiêu lưu |
| **N4b** | Map hồ cá chung + câu cá đồng thời + thấy bạn bè / động tác câu + cá vào túi nguyên liệu | Có chỗ câu cá và sinh hoạt cùng bạn bè |
| **N4c / X3b** | Nối lúa mì, cây giống, cá, lưu niệm và đồ trang trí với chợ giao thương | Có vòng sản xuất / thu thập → mua bán → phát triển khuôn viên |
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
2. **Chốt 26/10/2026:** trồng trọt, thu thực phẩm / nguyên liệu / nhiên liệu, chế tạo vật phẩm tiêu hao, nấu ăn, chỉnh sửa / trang trí nhà và câu cá ở hồ chung với bạn bè. Cần thiết kế tiếp loại cây, cá, nhiên liệu, công thức, thời gian và sản lượng; nghề bổ sung ngoài phạm vi này chưa chốt.
3. **Đã chốt 26/10/2026:** chợ giữa người chơi buôn bán lúa mì, cây giống, cá, lưu niệm, trang trí nhà. Cần hoàn thiện hình thức chợ và luật kinh tế; xem mục 2.7 và `docs/ke-hoach-xa-hoi.md` mục 3.1.

## 8. Tiến độ cập nhật 26/10/2026

- Đã bổ sung yêu cầu mỗi user một khuôn viên riêng, nhà / vườn / trang trí lưu theo tài khoản.
- Đã ghi vòng trồng trọt, thu hoạch thực phẩm / nhiên liệu, chế biến, chế tạo vật phẩm tiêu hao và nấu ăn.
- Đã ghi map hồ cá chung để câu cùng bạn bè và nối cá vào hệ nguyên liệu.
- Đã xác nhận bạn bè vào tham quan nhà / khuôn viên, giữ quyền chỉnh sửa / lấy tài sản cho chủ nhà.
- Đã bổ sung chợ giao thương và 5 nhóm hàng: lúa mì, cây giống, cá, lưu niệm, trang trí nhà; nối với kho và quyền sở hữu ở máy chủ.
- Đã bổ sung mê cung là nguồn kiếm châu báu, vàng và đồ trang trí; đồ mang về nhà trưng bày hoặc đưa ra chợ nếu được phép trao đổi.
- Đã cập nhật danh sách việc phát triển; chưa hiện thực map, dữ liệu hay gameplay, chưa thay đổi DB người chơi.
- 28/10/2026: thêm bên trong nhà (phòng mở theo cấp nhà, nội thất / trang trí từng phòng, đồ xoay được) và dự toán lượt PixelLab mới ~2.050 lượt (mục 4.1); động tác sinh hoạt chỉ vẽ trên thân nền + bộ đồ làm vườn chung.

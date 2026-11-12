# Kế hoạch: Khuôn viên riêng, nhà cửa, sản xuất và hồ câu cùng bạn bè

> **Chốt bổ sung 08/11/2026 — điều kiện mở Gia viên:** chỉ mở sau khi hoàn thành tuyến làm quen **toàn bộ NPC cố định map đầu Thistlewood**, gồm NPC truyện và NPC dịch vụ. Máy chủ lưu xác nhận từng bước và cờ mở theo tài khoản; chặn cổng / HUD / lệnh gọi thẳng khi chưa đạt. NPC sự kiện có hội thoại giới thiệu thường trực, không bắt chờ sự kiện đang mở. Bảo toàn nhà / cây / vật phẩm và tài khoản cũ, không reset DB. Điều kiện này áp dụng cả gói nhỏ mục 9. Chi tiết: [kế hoạch cốt truyện, NPC và nhịp cấp mới](thiet-ke/tai-thiet-cot-truyen-npc-2026-11.md). Chưa triển khai gameplay hoặc nghiệm thu điều kiện mới.

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

## 9. Gói Gia viên đợt 06/11/2026 (bản nhỏ trước đợt nạp lượt 28/11)

Chủ dự án 06/11/2026: tham khảo cách chơi dòng game nông trại (Stardew Valley — chỉ lấy vòng chơi, không chép nội dung / hình / tên),
"làm bộ đồ kiểu mặc ở nhà… sẽ làm các thao tác liên quan đến gia viên", "tổng 4 bộ", "ghép vào kế hoạch làm gia viên". Giữ mọi chốt
mục 1–2 (map riêng mỗi tài khoản, chỉ chủ thao tác, bạn bè xem). Ngân sách ~685 lượt PixelLab (kế hoạch `home`, `pixellab-budget-1128`).
**Chủ dự án duyệt 06/11/2026 ("Ok ổn r").** Vẽ theo thứ tự: thử bộ Nông gia nam + cuốc đất trước, đạt mới làm tiếp.

### 9.1 Khuôn viên (map riêng `home/<tài khoản>`)

**Điều kiện mở, chốt 08/11/2026:** hoàn thành tuyến làm quen toàn bộ NPC cố định ở map đầu Thistlewood rồi mới được vào / thao tác Gia viên. Máy chủ xác minh và lưu quyền theo tài khoản; không chỉ kiểm cấp hoặc ẩn nút trên client. NPC sự kiện có thoại giới thiệu kể cả khi không chạy sự kiện. Xem điều kiện và cách chuyển tài khoản cũ tại `thiet-ke/tai-thiet-cot-truyen-npc-2026-11.md` mục 3.

Vào từ cổng "Về nhà" ở rìa tây Thistlewood (hoặc nút HUD, hồi 5 phút). Map nhỏ ~28 × 22 ô, giữ style map cũ (nền gọn, cụm cảnh):

```
  rừng viền ─────────────────────────────────────────
  │   cây ăn quả (sau)        ┌───────┐   giếng       │
  │                           │ NHÀ   │               │
  │   ┌─ rào ───────────┐     │ (cửa) │   hộp gửi     │
  │   │ ruộng 3 × 4 ô   │     └───┬───┘   hàng (bán)  │
  │   │ (mở rộng theo    │  lối đá │                   │
  │   │  cấp nhà)       │ ───────┴──────── cổng ra ─→ Thistlewood
  │   └─────────────────┘   bù nhìn   ghế · đèn       │
  │   HỒ CÂU (cầu gỗ ngắn)    thùng gỗ · củi          │
  ───────────────────────────────────────────────────
```

- Nhà: dùng lại `house_farm` sẵn có (không vẽ nhà mới đợt này). Ruộng ban đầu 12 ô (3 × 4), mở thêm theo cấp nhà (sau).
- Không quái, không mất máu. Đêm (GameClock) đèn / cửa sổ nhà sáng như map thường.

### 9.2 Trồng trọt

- Vòng chơi: **cuốc → gieo → tưới → chờ → thu** (mục 2.2). Máy chủ giữ giờ gieo / tưới: cây lớn theo giờ thật, offline vẫn lớn;
  không tưới thì lớn chậm ×0,5, không chết. 4 giai đoạn hình mỗi cây.
- 6 cây vùng 1 (hạt bán ở tiệm Thistlewood): lúa mì (5 phút), cà rốt (15 phút), khoai (30 phút), dâu (1 giờ), bí ngô Haven (3 giờ),
  cỏ bạc (thảo dược, 8 giờ). Hạt các vùng sau (mục 2.2) để đợt sau.
- Đầu ra: bán ở hộp gửi hàng / chợ; **nấu 4 món tăng sức chiến đấu** ở bếp trong nhà — Bánh mì lúa mì (hồi máu), Súp cà rốt (hồi MP),
  Khoai nướng (+giáp 10 phút), Bánh dâu cỏ bạc (+sát thương 10 phút). Số cụ thể cân bằng sau, máy chủ xác minh công thức.
- Đồ hái lượm vùng 1 (nấm, quả rừng, thảo dược) mọc lại mỗi ngày Haven trên map săn — dùng lại đồ vật sẵn có, không tốn lượt.
- **Hình đã vẽ 07/11** (27 lượt, tấm Pro Flash cùng ảnh mẫu `N1_nature`, nền magenta): `sources/pixellab/sheets/F1_crops.png` (lúa mì,
  cà rốt × 4 giai đoạn, lưới 4×2), `F2_crops.png` (khoai, dâu, bí ngô Haven có vân xoáy lam, cỏ bạc nụ lam phát sáng — lưới 4×4),
  `F3_crop_icons.png` (6 nông sản + 6 túi hạt — lưới 4×3). Mỗi cây có ụ đất nhỏ dưới gốc; chưa nhập vào game.

### 9.3 Bộ đồ ở nhà — NAM NỮ CHUNG (chốt 07/11/2026) — NGHIÊM CẤM ÁO ĐỘI MŨ

Chỉ các bộ này có thao tác vườn; mặc ở khuôn viên (tủ quần áo trong nhà), ra ngoài tự về bộ class. Đứng / đi / chạy 8 hướng như bộ
class; thao tác vườn vẽ **E + N** (W lật từ E, đánh về nam dùng clip ngang như đòn đánh — chủ dự án 06/11: "cuốc đất 4 hướng đủ r"):
**cuốc đất, tưới nước, cúi gieo / thu hoạch, câu cá** (bê đồ: sau).

Chủ dự án 07/11 (xem bộ nữ váy yếm + tạp dề: "nhìn như làm bếp í, dùng luôn bộ Nam cho đỡ tốn lượt, nam nữ chung"): mỗi bộ vẽ MỘT lần trên
thân nam cỡ NPC, đầu nữ đội chung thân đó (khuôn `uf-farmer1`… — ngoại lệ duy nhất của luật đầu theo giới, chỉ cho bộ đồ ở nhà). Còn **2 bộ**:

| Bộ | Thiết kế (dùng chung nam nữ) | Tình trạng |
|---|---|---|
| 1 · Nông gia | áo sơ mi vải lanh xắn tay, quần yếm vải bò, khăn quàng cổ đỏ, găng tay da, ủng cao su xanh | xong 07/11: đồ 5 hướng, đứng / đi / chạy 8 hướng, cuốc / tưới / gieo-thu hoạch / câu cá E + N; đầu nữ đội chung (0 lượt); ~108 lượt kể cả vẽ lại |
| 2 · Thợ vườn | áo vải nâu xắn tay, gi-lê da tối, tạp dề da ngắn nhiều túi, găng tay xanh, quần kaki, ủng ngắn (chủ dự án chọn A 07/11) | xong 07/11: đồ 5 hướng, đứng / đi / chạy 8 hướng, cuốc / tưới / gieo-thu hoạch / câu cá E + N (khung xương chép bộ 1); đầu nữ đội chung; ~76 lượt |

Bài học bộ 1: dụng cụ vẽ LIỀN THÂN (PixelLab vẽ cuốc rời không ra); nhìn sau lưng (N) dụng cụ trước bụng khuất → cầm / xách bên hông phải
(tưới, câu); PixelLab hay tự thêm ụ đất / mầm / dây câu → xoá bằng code (gốc giữ ở `orig/`).

### 9.4 Nội thất nhà mẫu (1 phòng, cấp 1)

Sàn gỗ + tường gỗ đá (code dựng ô, PixelLab vẽ 1 tấm nền); ~18 món theo 3 tấm lưới: giường, bàn, 2 ghế, bếp lò, rương kho, tủ quần áo
(đổi bộ đồ ở nhà), kệ sách, thảm, đèn bàn, cửa sổ, chậu cây, đồng hồ, tranh treo, lò sưởi, giá phơi, thùng gạo, bình hoa.

**Hình đã vẽ 07/11** (18 lượt, tấm Pro Flash nền magenta, ảnh mẫu `N1_nature`): `sources/pixellab/sheets/I1_interior.png` (lưới 4×3: giường
chăn chắp vá, bàn ăn, ghế, bếp lò gang + ấm, rương đai sắt, tủ quần áo 2 cánh, kệ sách, lò sưởi đá có lửa, thảm tròn, đèn bàn, đồng hồ
treo, tranh phong cảnh) + `I2_interior.png` (lưới 3×2: cửa sổ rèm, chậu cây, giá phơi thảo dược, thùng gạo, bình hoa sứ, ghế bành).
Đồ sân vườn `F4_farm_props.png` (9 lượt, lưới 4×2): rào, cổng, hộp gửi hàng, bù nhìn (mũ rơm — đồ trang trí, tạm giữ), thùng nước,
giá dụng cụ; 2 ô đất xới khô / ướt chỉ làm tham khảo màu — ô ruộng xới + tưới ướt dựng bằng code khớp lưới 32 px (07/11). Chưa nhập game.

### 9.5 Phong ấn hang boss (mẫu ở Hang Gargoyle) — TÁCH khỏi gói Gia viên (07/11: "Đấy là các map bên ngoài"; làm cùng map / boss, mục boss-seal-quest)

Cửa hang boss Gargoyle Đá có **bệ ấn**: cần 3 **Mảnh ấn đá**. Mảnh chỉ rớt khi đang nhận nhiệm vụ "Giải ấn hang Gargoyle", tỉ lệ ~20%
từ Gargoyle thường (boss nhỏ 100%). Đủ 3 mảnh → đặt vào bệ → ấn vỡ (hiệu ứng) → mở lối vào sân boss cho người đó. Máy chủ giữ rớt /
kho / mở ấn. Hình: bệ ấn (2 trạng thái), mảnh ấn (icon), hiệu ứng vỡ ấn — ~20 lượt. Đạt thì nhân ra các hang boss khác.

### 9.6 Hồ câu cá trong khuôn viên

Chủ dự án 06/11/2026: "nhớ có cả 1 hồ câu cá". Hồ nhỏ góc nam khuôn viên (nước + cầu gỗ ngắn dùng lại đồ sẵn có, `WaterMotion` cho nước
động). Bấm ở mép nước / đầu cầu → **quăng cần → chờ phao giật (ngẫu nhiên 3–12 giây) → bấm đúng lúc để kéo** (trễ thì cá chạy). Máy chủ
chọn cá theo bảng tỉ lệ + giờ trong ngày (GameClock: có loài chỉ cắn ban đêm), xác minh lượt câu. 8 loài cá hồ vùng 1 (cá diếc, cá
chép, cá rô, lươn đồng, tôm càng, cá chép vàng hiếm, cá trê đêm, cá Haven lấp lánh hiếm) → bán / nấu (thêm 1 món: Cá nướng muối, +hồi máu
theo thời gian). Hồ câu chung với bạn bè (kế hoạch `fishing`) để sau, dùng lại cùng luật câu.
Hình: thao tác câu (quăng + giữ cần + kéo) trên 4 bộ đồ ở nhà, hướng E + N (W lật, nam dùng clip ngang); cần + phao (hiệu ứng nhỏ); icon 8 cá (1 tấm lưới).
**Hình đã vẽ 07/11:** thao tác câu cá có trong 2 bộ đồ ở nhà (mục 9.3); icon 8 cá `sources/pixellab/sheets/F5_fish_icons.png` (9 lượt, lưới 4×2 — PixelLab chừa dải trắng mép trái làm lệch lưới, xếp lại bằng code; bản gốc `F5_fish_icons.orig.png`). Cần + dây + phao là hiệu ứng game (code). Chưa nhập game.

### 9.7 Lượt dự tính

Bộ đồ ở nhà 4 × (đồ 5 hướng ~10 + đi / chạy ~45 + 3 thao tác × 3 hướng ~45) ≈ 400 · cây + hạt + icon ~40 · đồ sân vườn ~20 ·
nội thất ~30 · phong ấn ~20 · câu cá (thao tác câu 4 bộ × 3 hướng ~50 + cần / phao ~5 + icon cá ~10) ~65 · dự phòng ×1,3 ~110 →
**~685 lượt** (bản 06/11).

Tính lại 07/11 (2 bộ nam nữ chung, thao tác E + N, câu cá gộp vào bộ đồ): bộ 1 đã tiêu ~108 (kể cả vẽ lại) · bộ 2 ~70 · cây + hạt + icon
~40 · đồ sân vườn ~20 · nội thất ~30 · icon cá ~10 · dự phòng ~40 → **~320 lượt** (phong ấn ~20 tách ra 07/11); phần dư (~340 so với bản 06/11) trả về
quỹ chung (quái thường thêm / dự phòng / bộ shop 3).

### 9.8 Mở rộng Gia viên (chủ dự án 11/11/2026: "tạm dừng bộ 3 thay vào đó vẽ thêm cho gia viên thêm cây… tính năng hoành tráng hơn"; duyệt "Có làm thú cưng, giữ hết, nhảy 8 hướng")

Bộ shop 3 TẠM DỪNG; lượt dồn sang (vẽ bằng tấm Pro Flash cùng ảnh mẫu `N1_nature`, nền magenta như đợt 07/11):

| Nhóm | Nội dung | Lượt |
|---|---|---|
| 12 cây mới | lúa nước, ngô, cà chua, dưa hấu, nho giàn, ớt, chè, hướng dương + 4 cây phép Haven: nấm sáng, hoa trăng (nở đêm), quả sao, lúa vàng hiếm — 4 giai đoạn + icon + túi hạt | ~45 |
| Cây ăn quả | táo, cam, đào Haven — cây non / lớn / ra quả, thu nhiều lần | ~18 |
| Chăn nuôi | gà, bò, cừu, ong — đứng / đi 4 hướng, cho ăn, sản phẩm (trứng, sữa, len, mật) + chuồng gà, chuồng bò, tổ ong | ~100 |
| Máy chế biến | lò nướng bánh, hũ muối dưa, máy ép, thùng ủ rượu, cối xay bột, lò sấy + icon thành phẩm | ~18 |
| Công trình nâng cấp | nhà kính, giếng, cối xay gió, nhà kho, ao cá lớn, cổng vườn — mỗi món 2 cấp | ~27 |
| Trang trí | đèn lồng, đường lát đá, hàng rào đá, bồn hoa, đài phun nước, xích đu, chuông gió, tượng nhỏ | ~18 |
| Thú cưng | chó / mèo đi theo chủ, nằm ngủ ở khuôn viên | ~40 |

Tổng ~265 lượt. Chia lại 1.319 lượt (11/11): mở rộng Gia viên ~265 · NHẢY nhân vật 8 hướng (24 thân: bộ class 1 + shop 2 × 5 nghề × nam / nữ, thân tháo đồ nam / nữ, 2 bộ ở nhà; nhảy theo hướng đang đi, chỉ di chuyển, không né đòn / không qua vật cản; quái KHÔNG nhảy) ~375 · quái thường 7 vùng ~500 · dự phòng ~180. Code cách chơi (máy chủ giữ cây / vật nuôi / máy; giao diện) làm sau, 0 lượt.

**Tiến độ 11/11** (81 lượt, còn 1.238): 12 cây mới `F6_crops` / `F7_crops` / `F8_crops` (lưới 4×4; F8 PixelLab vẽ khung trắng + thu nhỏ — xoá khung, xếp lại lưới, gốc `F8_crops.orig.png`); icon nông sản + táo / cam / đào / hũ mật `F9_produce_icons`; túi hạt + 3 cây giống + bình tưới `F10_seed_icons`; cây ăn quả 3 loại × 3 giai đoạn `T1_fruit_trees` (lưới 3×3); máy chế biến + thành phẩm `M1_machines` (4×3); công trình 2 cấp `B1_farm_buildings` (4×3: nhà kính, giếng, cối xay gió, nhà kho, bến câu, cổng vườn — cỡ ~55 px, nhỏ so với nhà trong game: khi nhập nếu cần to hơn thì vẽ lại tấm 2×2 ô 128 px, ~27 lượt); trang trí `D3_yard_decor` (4×2). Còn: chăn nuôi (gà, bò, cừu, ong — thử 1 con trước), thú cưng (chó, mèo), nhảy nhân vật.

**Tiến độ 11/11 (2)** — chăn nuôi + thú cưng (~54 lượt, rẻ hơn dự tính ~140; còn ~1.184): nhân vật PixelLab 4 hướng (S / E / N / W) trong `sources/pixellab/` + `registry.json`: bò `farm_cow_001` (khuôn ngựa), cừu `farm_sheep_001` (khuôn chó) — đi + đứng ăn cỏ; gà `farm_chicken_001` (vẽ ảnh nhìn thẳng `farm_chicken_src/south2.png` rồi v3 xoay 4 hướng — khuôn 4 chân không có chim) — đi + mổ thóc; chó `pet_dog_001`, mèo `pet_cat_001` — đi, ngồi (chó vẫy đuôi / mèo liếm chân), ngủ (phát một lần giữ khung cuối; mèo S / E vẽ lại `sleep-b` vì bản đầu không nằm xuống). Động tác vẽ S / E / N, W lật. Ong: không vẽ con — đàn ong quanh tổ là hiệu ứng code. Chuồng: `B2_animal_buildings` (3×2: chuồng gà, chuồng bò, tổ ong, máng cỏ, giỏ trứng, bình sữa). Còn: NHẢY nhân vật 8 hướng (thử Kiếm sĩ nam trước).

**11/11 — BỎ NHẢY** (chủ dự án: "Thôi dừng bỏ nhảy"): đã tốn 30 lượt (mẫu chạy-nhảy thân trần 5 — chủ dự án sửa "chỉ cần nhảy lên trên thôi", mẫu nhảy tại chỗ 5, đo khung xương ~8, thử Kiếm sĩ nam 4 hướng 12); nguồn giữ, không xuất. Phần ~375 lượt dành cho nhảy trả về quỹ chung. Còn 1.154 lượt.

### 9.9 Thú cưng quay kim cương (chủ dự án 11/11: "thêm cho tôi vật nuôi, để có thể quay mèo, chó bằng kc kiểu gacha nhiều loài"; duyệt "ok")

22 loài (2 đã vẽ: mèo mướp cam `pet_cat_001`, chó vàng `pet_dog_001`), mỗi con đi / ngồi / ngủ 4 hướng (~10 lượt / con):
- Thường (8): mèo mướp cam, mèo mun, mèo trắng, mèo xám · chó vàng, chó mực, chó đốm, chó Corgi.
- Hiếm (6): mèo tam thể, mèo Xiêm, mèo Ba Tư lông dài · chó Husky, chó Shiba, chó Poodle xù.
- Sử thi (4): mèo mắt hai màu, mèo trắng nơ hoàng gia · chó Samoyed bông tuyết, chó săn Haven lông bạc.
- Huyền thoại (4): mèo linh hồn lam phát sáng, mèo lửa · sói trăng con, chó thần mây.
Hiệu ứng độ hiếm (viền / đốm sáng) bằng code. Tấm phụ: máy quay, trứng / hộp quà, khung thẻ theo độ hiếm (~9 lượt).
Luật quay (máy chủ quay + giữ kết quả, tỉ lệ hiện công khai): 1 lượt ~100 kim cương; 10 lượt giảm giá và chắc chắn ≥ 1 Hiếm; tỉ lệ Thường 70% · Hiếm 22% · Sử thi 7% · Huyền thoại 1%; quay 80 lần chưa ra Huyền thoại thì lần sau chắc chắn ra; trùng → mảnh, gom mảnh đổi con muốn. Thú cưng CHỈ LÀM ĐẸP (đi theo chủ, ngủ ở khuôn viên, khoe bạn) — không tăng chỉ số.
~210 lượt; thử 2 con (1 Hiếm + 1 Huyền thoại) trước khi vẽ hàng loạt.

Tiến độ 11/11: đổi sang PixelLab Pro Flash 64px theo chủ dự án ("Nhìn xịn hơn chứ" → "Ok"); thử sói trăng con (`pet_moonwolf_002`) đạt rồi vẽ 21 con còn lại (`pet2_*`). Đủ 22 con, mỗi con đi / ngồi / ngủ hướng S, E, N (W lật từ E) — 63 clip lô cuối không lỗi. Hai con cũ dạng thường (`pet_cat_001`, `pet_dog_001`) giữ làm tư liệu, không dùng trong gacha. Tấm phụ xong (18 lượt): `P1_pet_gacha` (máy quay, trứng 4 độ hiếm, hộp quà, ổ nằm, bát ăn), `P2_pet_cards` (khung thẻ + huy hiệu 1–4 sao). Còn: hiệu ứng độ hiếm và luật quay (code), đưa vào game. Lượt PixelLab còn 783 (làm mới 28/11).

**CHỐT 12/11 — THÚ CƯNG CHỈ ĐI LẠI TỰ DO TRONG GIA VIÊN** (chủ dự án: "Thú cưng chỉ là con vật di chuyển tự do ở gia viên và trong nhà."): thú cưng KHÔNG đi theo chủ ra map ngoài; con đã có (qua gacha) tự đi lang thang / đứng / ngủ ở khuôn viên và các phòng trong nhà của chủ, bạn bè ghé thăm thấy được. Bỏ ý "đi theo chủ" ở trên. Gacha giữ nguyên luật (kim cương, bảo đảm, mảnh trùng). 0%.

### 9.10 Cây theo vùng (chủ dự án 11/11: "Ok thêm đi")

Gia viên vẫn một map / user; "theo vùng" là nơi lấy hạt (mua / nhặt ở vùng đó, mang về trồng) — lý do đi đủ vùng. Đã có: Thistlewood 11 cây, Đầm lầy lúa nước, Cao nguyên chè, Núi lửa ớt. Thêm 8 cây cho vùng còn trống:
Sa mạc xương rồng quả + chà là (cây ăn quả) · Băng giá dâu tuyết + củ cải tuyết · San Hô dứa + dừa (cây ăn quả) · Đầm lầy sen hồng (mọc trong vũng nước) · Núi lửa dưa lửa.
**Đã vẽ 11/11** (4 tấm, ~36 lượt): `F11_crops` (xương rồng quả, dâu tuyết, củ cải tuyết, dưa lửa × 4 giai đoạn; PixelLab vẽ khung trắng + thu nhỏ — xếp lại theo mảng hình, gốc `F11_crops.orig.png`), `F12_crops_icons` (dứa, sen × 4 giai đoạn + 8 icon nông sản), `T2_fruit_trees` (chà là, dừa × 3 giai đoạn), `F13_seed_icons` (8 túi hạt, 2 cây giống chậu, bao phân bón, vòi phun tưới). Chưa nhập vào game.

### 9.11 Chế biến món ăn + sưu tầm cá hiếm (chủ dự án 11/11: "Các cây thu hoạch, chăn nuôi lấy thịt để phục vụ chế biến đồ ăn cá cũng vậy nhưng có thể sưu tầm cá trong bể tại gia viên (sưu tầm cá hiếm)")

- Nông sản, thịt từ chăn nuôi và cá đều là nguyên liệu nấu món ăn (mục 2.4).
- Chăn nuôi lấy thịt (đề xuất, chờ duyệt): con đủ lớn có thể **xuất chuồng** đổi thịt (con đó rời chuồng, mua / nuôi con giống mới); trước đó vẫn ra trứng / sữa / len hằng ngày. Thú cưng (mục 9.9) không bao giờ lấy thịt.
- Cá: MỌI loài cá (kể cả cá hiếm) đều nấu được (chủ dự án 11/11: "Cá cũng có thể để nấu mà"); riêng **cá hiếm thì người chơi chọn: đem nấu hoặc thả vào bể cá ở Gia viên để sưu tầm**. Đề xuất: bể đặt trong nhà / sân, nâng cấp tăng số ô; cá bơi trong bể bằng code (dùng icon cá nhìn ngang, lật khi đổi hướng, nhấp nhô); sổ sưu tầm cá ghi loài đã bắt / đã thả, thưởng khi đủ bộ; bạn bè tham quan thấy bể.
- **Đã vẽ 11/11** (duyệt "Ok vẽ đi", 4 tấm ~36 lượt): `K1_meat_dishes` (thịt gà, bò, cừu, phi lê cá + 8 món: gà quay, bò hầm, xiên cừu, cá nướng, súp cá, cơm dứa, súp bí, bánh dâu); `F14_rare_fish` + `F15_rare_fish` — 16 cá hiếm: Đầm lầy cá đèn lồng, chó độc tím · Sa mạc chép vàng ốc đảo, cá ngọc lam · Cao nguyên hồi cánh lông, koi mây · Băng giá hồi pha lê, chó băng · Núi lửa cá dung nham, betta lửa · San Hô vẹt cầu vồng, cá ngựa ngọc trai · Thistlewood chép trăng · Rừng Nấm cá hang đốm sáng · huyền thoại: rồng koi Haven, ngân long cổ văn; `A1_aquariums` (bình cá, bể khung gỗ, bể khung vàng, hồ đá ngoài sân + rong, san hô, rương báu, lâu đài trang trí). Chưa nhập vào game.

**Cá thường theo vùng (chủ dự án 11/11: "Cá theo vùng là 1 chuyện phải đa dạng cá bình thường nữa")** — đã vẽ 4 tấm (~36 lượt): `F16_fish` Đầm lầy cá lóc, cá rô đồng, cá thòi lòi, cá láng mõm dài · Sa mạc cá rô phi, cá sóc lam, cá đốm cát, cá chạch ốc đảo; `F17_fish` Cao nguyên cá hồi vân, cá vây buồm, cá suối bạc, cá chạch đá · Băng giá cá hồi bụng đỏ, cá trích, cá tuyết, cá ốt-me băng; `F18_fish` Núi lửa chép tro đỏ, bống lưu huỳnh, trê đá huyền, rô than · San Hô cá hề, cá thu, cá hồng, cá đuôi gai vàng; `F19_fish` Rừng Nấm cá hang mù, cá đốm nấm, cá hang tí hon, tôm hang · biển chung cá bơn, cá tráp, cá vược, mực. Cộng 8 cá Thistlewood (`F5`) + 16 cá hiếm → **56 loài**, cắt riêng từng con ở `sources/pixellab/fish/still/` (64 px nền trong, nhìn ngang quay phải).

**Bể cá (chủ dự án 11/11):** "xem được những con cá đang bơi, phải bỏ tiền chọn bể, bể thả được số lượng cá 5, 8, 10, 15… tầm 10 bể"; "bấm vào xem bể sẽ ra màn full thấy cá đang bơi để ngắm và bạn bè vào xem"; "Cá phải có hoạt ảnh bơi"; "trong bể trang trí đẹp theo giá bể — san hô, đá, sỏi, rong biển…".
- ~10 bể mua bằng tiền, sức chứa tăng dần (đề xuất 5 · 8 · 10 · 15 · 20 · 25 · 30 · 40 · 50 · 60 con; giá chờ cân kinh tế). Bể đặt trong nhà / sân như đồ nội thất.
- Bấm vào bể → màn toàn màn hình: cá đang bơi qua lại (hoạt ảnh bơi + code di chuyển, lật trái / phải, nhấp nhô, bong bóng, tia sáng). Bạn bè tham quan bấm xem được (chỉ xem).
- Trang trí trong bể theo giá: bể rẻ đáy sỏi + vài cọng rong; bể đắt thêm đá, san hô, vỏ sò, gỗ trôi, rương báu, lâu đài, pha lê phát sáng. Nền bể ghép bằng code từ các mảnh trang trí cùng tỉ lệ điểm ảnh với cá (Pro Flash tối đa 256 px, không vẽ được nền toàn màn hình một tấm).
- Hoạt ảnh bơi: `animate_image` 8 khung từ ảnh cá đứng yên, ~1 lượt / con, chỉ vẽ quay phải (trái lật). Thử 2 con 11/11 (cá hồi vân `F17_01`, rồng koi `F15_07`) ở `sources/pixellab/fish/swim/`.
- **Đã vẽ 11/11** (duyệt "vẽ đi"): 6 bể mới `A2_aquariums` → đủ 10 bậc (đề xuất sức chứa): bình cá tròn 5 · bể kính viền gỗ thông 8 · bể khung gỗ 10 · bể trụ tròn 15 · hồ đá ngoài sân 20 · bể đôi tủ gỗ óc chó 25 · bể tường khung cẩm thạch 30 · hồ koi cầu đá đèn lồng 40 · bể khung vàng 50 · vòm pha lê Haven chân vàng 60 (4 bể cũ ở `A1_aquariums`); trang trí trong bể `A3_tank_decor` (sỏi màu, cát trắng, đá cuội, vòm đá, đá rêu, gỗ trôi, rong xanh, rong đỏ, tảo bẹ, cỏ biển, dương xỉ nước, bóng rêu) + `A4_tank_decor` (san hô nhánh, san hô quạt, san hô não, san hô ống, hải quỳ, sò điệp, ốc xoắn, sao biển, trai ngọc, bình gốm chìm, pha lê Haven, xác tàu nhỏ; PixelLab vẽ khung trắng — xếp lại, gốc `.orig.png`). Hoạt ảnh bơi **xong đủ 56 / 56 con** (8 khung + ảnh gốc, `sources/pixellab/fish/swim/<id>/`; cá ngựa, tôm, mực, tôm hùm đất, lươn có câu lệnh động tác riêng). Cảnh bể ghép thử toàn màn (nền nước dải màu + tia sáng + cát dựng bằng code, trang trí A3/A4, 12 cá bơi qua lại lật hướng, nhấp nhô, bong bóng) đã gửi chủ dự án — chờ duyệt. Lượt PixelLab còn 554,6 (11/11).

- **CHỐT 12/11 — BỂ CÁ LÀ ĐỒ TRANG TRÍ TRONG NHÀ** (chủ dự án: "Bể cá cũng là trang trí trong nhà nhé"): bể sưu tầm cá hiếm đặt trong nhà như một món nội thất (kho đồ tự chọn, đặt nhà nào cũng được), không đặt ở khuôn viên; cá bơi bằng code từ icon cá hiếm. Chưa có hình bể (đưa vào đề bài GPT đồ vật tĩnh đợt sau: bể kính khung gỗ nhỏ / vừa / lớn, nhìn chính diện hơi nghiêng, bể rỗng có nước + sỏi + rong để code thả cá vào). 0%.

### 9.12 GPT vẽ hình tĩnh cỡ lớn + nhà vào được bên trong (chủ dự án 11/11)

- Chủ dự án dùng Codex (gói GPT Plus, công cụ vẽ ảnh tích hợp) vẽ HÌNH TĨNH; nhân vật / thú / hoạt ảnh vẫn chỉ PixelLab (chốt 02/11). Ảnh GPT là giả pixel (hàng chục nghìn màu, rìa alpha mờ) → chuẩn hoá bằng `scripts/gpt-normalize.py --height <cao trong game>` (tách nền magenta, giảm ≤ 32 màu, thu về lưới bằng màu chiếm nhiều nhất mỗi khối, alpha nhị phân) + tấm so cạnh đồ thật trong atlas.
- **Đợt 1** (`sources/gpt-review/DE-BAI-DOT-1.md`, ảnh `dot-1/`, bản chuẩn hoá `dot-1/chuan-hoa/`): 6 công trình Gia viên (nhà chính, nhà kho, nhà kính, cối xay gió, chuồng gà, giếng — thay bản PixelLab ~55 px), 7 công trình biểu tượng vùng cao 260–300 px (tòa thị chính Thistlewood, đại sảnh nhà sàn, cung điện ốc đảo, đại cối xay, đại sảnh gỗ, đại lò rèn, hải đăng), 4 cây lớn, 1 tranh màn tải. Chuẩn hoá đạt 28–33 màu, đứng cạnh nhà thật đồng bộ — CHỜ chủ dự án duyệt, chưa nhập game.
- **Nhà vào được** ("những nhà như quán rượu sẽ vào được bên trong"; "quán rượu, ngân hàng, nhà ở riêng ở Gia viên thì bên trong là map nền gỗ, cột nhà…"): cửa nhà là cổng chuyển sang map trong nhà nhỏ, cửa ra đưa về đúng trước cửa. Map trong nhà ghép bằng code: sàn ô lặp (gỗ ván / đá lát / cẩm thạch — Claude làm), mảng tường chính diện hai mép là cột để ghép liền, cột, cầu thang, đồ nội thất. Hiện `assets/home/maps/house.json` mới dùng tạm ô đá / gỗ của bộ ô map ngoài, chưa nối cửa.
- **Đợt 2** (`DE-BAI-DOT-2.md`, 22 món): 4 mảng tường (gỗ cửa sổ, gỗ kệ, vôi khung gỗ, đá vòm ngân hàng), cột gỗ, cột cẩm thạch, cầu thang, cửa ra; quán rượu (quầy bar, kệ rượu, thùng rượu, bàn tròn + ghế đẩu, lò sưởi lớn, đèn chùm bánh xe, sân khấu nhỏ); ngân hàng (quầy giao dịch, cửa két lớn, két sắt, bàn làm việc, cột dây chắn, chồng vàng, đèn chùm vàng). **Codex vẽ xong 11/11** (22 món, cửa ra và bàn tròn có thêm bản `-v2`); Claude chuẩn hoá `--height` theo đề bài → `dot-2/chuan-hoa/` (26–32 màu). Ghép thử 3 phòng quán rượu 22×10 ô, ngân hàng 22×10 ô, nhà ở 16×9 ô: sàn ô 32 px dựng bằng code (ván gỗ dài 96 px mạch lệch, cẩm thạch ô bàn cờ), tường GPT ghép liền chỗ nối cột, đồ đứng sàn xếp theo chân, đèn chùm treo sát trần, lối ra = khoảng hở giữa cạnh dưới + thảm chùi chân; NPC tóc trắng làm thước. Chưa đạt: cửa ra (`cua_ra_go`, cả 2 bản) giống tủ áo — đề xuất bỏ, dùng lối ra cạnh dưới; ghế ở bàn tròn có tựa chứ không phải ghế đẩu (vẫn dùng được). **Chủ dự án duyệt 11/11 ("Ok ổn rồi")** — lối ra dùng khoảng hở cạnh dưới, bỏ `cua_ra_go`.
- **Đợt 3** (`DE-BAI-DOT-3.md`, 22 món, ra `dot-3/`): nội thất nhà ở Gia viên — 2 mảng tường (vôi khung gỗ có cửa sổ, tường bếp ốp gạch); bếp phục vụ nấu ăn (bếp lò củi, quầy sơ chế, bồn rửa bơm tay, chạn bát, kệ gia vị, lò nướng bánh, tủ đá, bàn ăn dài, thùng rau củ); phòng ngủ (giường đôi, tủ đầu giường, bàn trang điểm, tủ ngăn kéo, thảm lớn); phòng khách (sofa, bàn trà, đồng hồ quả lắc, chậu cây lớn, tủ kính trưng bày); bảng nhiệm vụ quán rượu. Mỗi lần vẽ gửi kèm ảnh mẫu đồ nhà Gia viên + một ảnh đợt 2 đã duyệt; thêm 7 ảnh mẫu `mau-tham-chieu/home_{stove,bed,rug,chest,potted_plant,wall_clock,armchair}_x4.png`. **Codex vẽ xong 11/11** (22 món; bàn trang điểm, tủ ngăn kéo, chậu cây lớn, tủ kính lề 3–5 % sau 3 lượt nhưng không mất nét) → chuẩn hoá `dot-3/chuan-hoa/` (27–31 màu).
- **Nhà ở đủ phòng, MỖI PHÒNG MỘT MAP** (chủ dự án 11/11: "nhà thì phải có đủ phòng chứ phòng ngủ, bếp, khách"; "Mỗi phòng là 1 map chứ nhìn mới đúng"; "Phòng ngủ nên để trên tầng"): phòng khách 18×9 ô là phòng vào nhà — lối ra vườn cạnh dưới, cửa cạnh trái sang **bếp** (14×9, sàn đá lát, tường ốp gạch: chạn bát, bếp lò củi, kệ gia vị treo, bồn rửa, lò nướng bánh, tủ đá, quầy sơ chế, thùng rau, thùng gạo, thùng nước, bàn ăn dài — điểm nấu ăn), **cầu thang** góc phải lên **phòng ngủ tầng 2** (14×9: giường đôi đầu áp tường thân nằm trên sàn + 2 tủ đầu giường, bàn trang điểm, tủ áo, tủ ngăn kéo, thảm, rương cuối giường; lỗ cầu thang xuống — bản code tạm, đợt 4 vẽ lại). Đồ đặt theo thực tế (chủ dự án: giường "dính sát tường", ghế "xoay linh tinh"): sofa tựa lưng vào tường nhìn ra phòng, bàn trà + thảm trước sofa, bỏ ghế bành xoay ngang. Cửa sang phòng = khoảng hở 2 ô ở cạnh bên + thảm chùi chân; bước vào → chuyển map, đứng ở cửa / chân cầu thang tương ứng. **Quán rượu**: bỏ 2 cột gỗ ("trông hơi xấu"), 5 bàn tròn, bảng nhiệm vụ; thêm khách ("nên có vài npc ngồi đứng cho sinh động") — ảnh thử dùng NPC có sẵn: 5 người ngồi (ghép tạm nửa trên sau bàn), 5 đứng (quầy, bảng nhiệm vụ, lò sưởi, sân khấu). Khách ngồi thật: chủ dự án cho **GPT vẽ NPC khách MỚI ngồi ghế đẩu, ảnh tĩnh** (ngoại lệ chốt 02/11, không hoạt ảnh, không nhân vật người chơi) — đợt 4 món 23–34. Ảnh ghép thử chờ duyệt.
- **Đợt 4** (`DE-BAI-DOT-4.md`, 34 món, ra `dot-4/`): lỗ cầu thang xuống; lò rèn (tường đá treo dụng cụ, lò rèn, đe + búa, thùng tôi, giá vũ khí, giá giáp không mũ + khiên, bàn mài); tiệm tạp hoá (tường kệ hàng, quầy cân, kệ hàng cao, bao + thùng hàng, kệ rau quả, giá vải, thùng nhỏ); tiệm thuốc (tường xanh cửa sổ kính màu, nồi luyện, kệ bình thuốc, bàn giả kim, tủ ngăn kéo thảo dược, giá phơi, chậu cây phát sáng); bàn tròn không ghế + ghế đẩu; 10 khách mới ngồi ghế đẩu (7 nhìn phải — lật thành nhìn trái, 3 nhìn trước). Ảnh mẫu NPC 4× thêm ở `mau-tham-chieu/npc_*_x4.png`. **Codex vẽ xong 11/11** (34 món; kệ hàng, kệ thuốc, bàn giả kim, chậu cây phát sáng lề 2–5 % sau 3 lượt nhưng không mất nét) → chuẩn hoá `dot-4/chuan-hoa/` (24–33 màu; khách ngồi cao 60–64 px, khớp NPC đứng ~74 px). Ghép thử: quán rượu 5 bàn tròn mới, 10 khách GPT ngồi ghế đẩu (nhìn phải / lật trái / nhìn trước sau bàn), nhạc công ngồi đàn trên sân khấu, 5 NPC cũ đứng (quầy, bảng nhiệm vụ, lò sưởi); phòng ngủ thay lỗ cầu thang code bằng bản GPT; 3 tiệm 16×9 ô có chủ tiệm + khách (lò rèn — Garrick bên đe; tạp hoá — Bram sau quầy; tiệm thuốc — Ysolde bên nồi luyện). Chờ chủ dự án duyệt.
- **12/11 — khách ngồi GPT bị loại** (chủ dự án: "Npc gpt vẽ khác với pixelab quá … nhờ pixelab"): khách ngồi vẽ lại bằng PixelLab (sheet Pro Flash 4×2 có ảnh mẫu style NPC `sheets/S0_npc_style_ref.png`, thử 1 sheet `S1_seated_npcs` ~9 lượt trước khi làm tiếp); ngoại lệ GPT vẽ NPC hết hiệu lực — GPT chỉ vẽ đồ vật.
- **12/11 — khách ngồi PixelLab:** `S1_seated_npcs` (8 khách) đạt style nhưng to quá và cô tai mèo có đuôi → vẽ lại `S2_seated_npcs_small` (4×3, 12 khách ngồi ghế đẩu, cao ~52–63 px so với NPC đứng 75 px; 9 nghiêng nhìn phải, 3 chính diện; không đồ đội đầu, thú nhân không đuôi). Cắt ra `sources/pixellab/seated/still/S2_01…12.png` (đáy sheet có vạch xám 1 px phải xoá trước khi cắt). Ghép thử quán rượu thay đủ 10 khách GPT + thêm bà lão đan len, học giả đeo kính. Chờ chủ dự án duyệt; chưa đưa vào game.
- **Đợt 5** (`DE-BAI-DOT-5.md`, 22 món, ra `dot-5/`, chỉ đồ vật): nhà trọ (tường giấy dán sọc, quầy lễ tân, bảng chìa khoá, giường đơn, bình phong, giá chậu rửa mặt, rương hành lý, ghế đọc sách); đền Haven (tường kính màu, bàn thờ pha lê, ghế băng nhìn từ sau, chân nến, bình hoa, kệ nến cầu nguyện, bục giảng, thảm đỏ dài — không tượng người); phòng tắm nhà ở (tường ốp gạch xanh bạc hà, bồn tắm gỗ, tủ gương rửa mặt, kệ khăn, giỏ đồ giặt, chậu dương xỉ treo). **Codex vẽ xong 12/11** (22 món đều đạt, lề ≥ 5 %; bồn tắm bỏ vịt đồ chơi theo luật cấm thú). Chưa chuẩn hoá / ghép thử.
- **Đợt 6** (`DE-BAI-DOT-6.md`, 24 món, ra `dot-6/`, chỉ đồ vật): bên trong công trình Gia viên — nhà kho (tường ván thô, kệ kho lớn, chồng bao tải, giá nông cụ, thùng gỗ chồng, cân bàn); nhà kính (tường kính khung trắng, luống nâng cao, bàn ươm, giàn dây leo, giá chậu bậc thang, thùng hứng nước mưa); chuồng trại không vẽ con vật (tường chuồng, vách ngăn ô chuồng, máng ăn, đụn rơm, ổ đẻ gà, xô sữa + ghế); xưởng dệt (tường xưởng, khung cửi, guồng quay sợi, kệ cuộn len, bàn cắt may, giỏ lông cừu). **Codex vẽ xong 12/11** (24 món đạt) → chuẩn hoá `dot-6/chuan-hoa/` (26–33 màu). Ghép thử 4 phòng 14–16 × 8 ô (nhà kho, nhà kính sàn đá, chuồng có bò / cừu / gà PixelLab sau vách ngăn, xưởng dệt). Còn lệch: gà PixelLab cùng cỡ khung với bò nên gà to hơn bò — cần hệ số cỡ theo loài khi đưa vào game. Chờ chủ dự án duyệt.
- **Đợt 7** (`DE-BAI-DOT-7.md`, 20 món, ra `dot-7/`; chủ dự án 12/11: "Chăn nuôi thì phải có cả chuồng ngoài trời bên ngoài nhà nữa chứ"): bãi quây bò / cừu (đoạn rào gỗ ghép liền, cột góc, cổng rào đôi, máng nước đá, giá cỏ khô có mái, lán che nắng, cuộn rơm, cột gãi + đá muối), chuồng cừu, sân gà (đoạn rào lưới ghép liền, cổng, máng thóc, ổ tắm cát), chuồng gà cấp 2, tổ ong gỗ + tổ ong rơm + bồn hoa cho ong, chuồng bò cấp 2 có silo, xe thùng sữa, xe cút kít rơm. Rào dọc dựng bằng code từ cột + thanh ngang. Không vẽ con vật / ong. Cùng đợt: 8 nhà cỡ lớn (món 21–28, xem dòng dưới). Chờ Codex vẽ.
- **Đề xuất 12/11 — nhà Gia viên mua được, mỗi nhà một nền, style khác nhau** (chủ dự án: "có nên vẽ nhiều nhà (mua được) nhà to hơn bình thường ngoại cỡ…", "Mỗi nhà sẽ có 1 nền, style khác nhau"): chủ dự án thêm "Tiện vẽ các ngoại hình nhà to gấp 3 lần nhà cũ", "Dài hơn cao hơn" → gộp vào đợt 7 món 21–28: 8 nhà mỗi nhà vẽ liền một nền sân riêng đúng style — trang trại gỗ đồng quê, nhà đá vùng cao có tháp, nhà gạch đỏ ba tầng, nhà sàn đầm lầy, nhà mái vòm sa mạc, nhà gỗ tuyết tùng, biệt thự Haven, dinh thự lâu đài nhỏ; cỡ dài ~3 lần nhà cũ (520–560 px), cao ~2 lần (380–420 px) — nhà cũ 186 × 210. Chưa chốt: giá / cách mua. 0%.
- **Nội thất riêng từng nhà cỡ lớn** (chủ dự án 12/11: "Và cả khi vào bên trong nền cũng phải khác nhau, nhà đắt nhìn càng xịn xò hơn"): xếp 8 nhà theo giá — 1 đồng quê · 2 đá vùng cao · 3 gỗ tuyết tùng · 4 nhà sàn đầm lầy · 5 mái vòm sa mạc · 6 gạch đỏ ba tầng · 7 dinh thự lâu đài · 8 biệt thự Haven; mỗi nhà 8 món GPT (tường trơn + tường cửa sổ, giường, sofa, lò sưởi, đèn, thảm lớn, món đặc trưng), bậc càng cao vật liệu càng quý; sàn riêng từng nhà dựng bằng code (ván mật ong / đá phiến / tuyết tùng / tre / gạch men hoa văn / gỗ xương cá / đá lát + thảm đỏ / cẩm thạch viền vàng + ô pha lê); bếp + phòng tắm dùng chung đồ đợt 3 / 5, chỉ đổi tường + sàn. **Đợt 8** (`DE-BAI-DOT-8.md`, bậc 1–4, 32 món) và **đợt 9** (`DE-BAI-DOT-9.md`, bậc 5–8, 32 món): Codex vẽ xong 12/11, cả 64 món đạt, chuẩn hoá ở `dot-8/chuan-hoa`, `dot-9/chuan-hoa` (tường 128 px, mỗi cặp tường cùng nhà cao bằng nhau, ghép liền). Ghép thử 8 phòng (sàn code: ván / đá phiến / tuyết tùng / tre / đá cát / gỗ xương cá / đá hoa đỏ–kem / cẩm thạch viền vàng) — bậc cao nhìn xịn hơn rõ; nhà bậc 6 "gạch đỏ" bên trong là giấy dán tường xanh kiểu Victoria. Chờ chủ dự án duyệt; chưa đưa vào game. 0%.
- **12/11 — đợt 7 Codex vẽ xong** (28 món đạt) → chuẩn hoá `dot-7/chuan-hoa/`: đồ chăn nuôi 24–211 px, 8 nhà lớn 536–675 × 380–420 px (nhà cũ 186 × 210), ảnh xếp nhà gửi chủ dự án. Chưa ghép bãi quây.
- **Đợt 10** (`DE-BAI-DOT-10.md`, 16 món; chủ dự án 12/11: "chuồng trong nhà hay ngoài trời cần phải có đủ các hướng chứ bao quanh chứ không phải mỗi một cái rào hướng chính diện, cần vẽ thêm các nhà lớn nữa"): rào CHẠY DỌC màn hình + cổng cạnh bên cho rào gỗ, rào lưới sân gà, vách ô chuồng trong nhà, cột góc (cạnh sau dùng lại đoạn chính diện) → bãi quây kín 4 phía; 8 nhà lớn mới: nhà cây Elf, nhà nấm khổng lồ, dinh gỗ phương Đông, nhà thuyền trưởng ven biển, sảnh rèn người lùn, lâu đài băng, trang trại cối xay hoa, lâu kính vườn hoa (bậc giá + nội thất riêng của 8 nhà này: chưa xếp). Codex vẽ xong 12/11, chuẩn hoá ở `dot-10/chuan-hoa`: 8 nhà đạt (526–626 × 400–420, ngang hàng nhà đợt 7). Rào dọc GPT vẽ rất mảnh (9–12 px) và đầu cắt chưa khớp từng pixel — ghép thử thì nối bằng code: hàng ngang căn tâm cột đầu, hàng sau lặp rồi cắt đúng bề ngang, cột góc che mối; cạnh bên chồng thêm cột thật cắt từ rào ngang mỗi 40 px nhìn mới kín và chắc. Ghép thử bãi bò / cừu, sân gà, ô chuồng trong nhà kín 4 phía. Thú PixelLab lệch cỡ (bò gốc ~50 px dài, gà cao hơn bò; chủ dự án 12/11: "Chuồng to thế thú thì bé") — ảnh thử phóng bò ×2, cừu ×1,5, gà ×0,6 theo người cao ~75 px; trong game cần đặt tỷ lệ riêng từng con hoặc vẽ lại cỡ đúng. Chủ dự án 12/11 chê bản đầu "chuồng rào đang đặt dính nhau, khay thức ăn gà dính vào rào, quá xấu" → luật xếp: mọi đồ / con vật trong bãi cách rào ≥ 8 px (không đè rào sau, không lấn cạnh bên, chân không khuất sau rào trước), bộ ghép thử tự kiểm và dừng khi vi phạm; sân gà tối thiểu 3 đoạn ngang × 2 đoạn dọc (chuồng gà cao 140 px), ô chuồng trong nhà tối thiểu 2 đoạn vách. Khi đưa vào game, chỗ đặt chuồng / máng / đồ trang trí trong bãi phải theo cùng luật. Chủ dự án 12/11 "Vật nuôi đang ổn rồi": CHỐT cỡ thú bằng tỷ lệ code (bò ×2, cừu ×1,5, gà ×0,6 so với khung PixelLab gốc), không vẽ lại. 0%.
- **Đợt 11** (`DE-BAI-DOT-11.md`, 64 món): nội thất riêng 8 nhà mới đợt 10 (mã nk, cx, bh, ct, pd, ln, lk, lb — 8 món / nhà như đợt 8 / 9), gửi kèm món cùng loại của nhà cũ gần bậc làm chuẩn độ xịn. Thang giá chung 16 nhà (đề xuất 12/11, chủ dự án đổi được): 1 đồng quê · 2 nấm khổng lồ · 3 đá vùng cao · 4 cối xay hoa · 5 gỗ tuyết tùng · 6 nhà sàn · 7 thuyền trưởng ven biển · 8 sa mạc · 9 nhà cây Elf · 10 gạch đỏ · 11 dinh phương Đông · 12 sảnh rèn người lùn · 13 lâu đài · 14 lâu kính vườn hoa · 15 lâu đài băng · 16 biệt thự Haven. Codex vẽ xong 12/11, cả 64 món đạt, chuẩn hoá ở `dot-11/chuan-hoa`; ghép thử 16 phòng theo thang giá. 0%.
- **CHỐT 12/11 — ĐỒ NỘI THẤT TỰ CHỌN** (chủ dự án: "có thể chọn đồ trong nhà tuỳ chọn nhé không theo luật nhà nào phải đồ vật í đâu"): 16 bộ nội thất (128 món đợt 8 / 9 / 11) là MỘT kho đồ chung — người chơi đặt bất kỳ giường / sofa / lò sưởi / đèn / thảm / món đặc trưng nào vào bất kỳ nhà nào. Nhà chỉ quyết tường + sàn mặc định (và bộ đồ đặt sẵn lúc mua); không khoá đồ theo nhà. Giá / cách mở từng món chưa chốt. Ảnh thử: nhà Đồng quê đặt đồ của nấm, thuyền trưởng, cối xay, phương Đông, lâu kính, nhà cây. Luật đèn treo (chủ dự án 12/11: "Đèn phải lên trần nhà chứ sao lơ lửng thế"): góc nhìn không thấy trần nên đèn KHÔNG đặt giữa sàn; móc vào dầm / gờ trần ở mép trên tường sau, xích vẽ bằng code từ gờ xuống, đèn treo trước mảng tường (lớp sau đồ trên sàn); ưu tiên chỗ nối hai mảng tường (cột trơn), tránh đè lò sưởi / cửa sổ / góc phòng. Ô đặt đèn trong game chỉ là dải gờ trần, không phải ô sàn. 0%.
- **Đợt 12** (`DE-BAI-DOT-12.md`, 54 món; chủ dự án 12/11: "Để nhờ gpt sang vẽ vật tĩnh map các vùng"): rà atlas `assets/maps/<vùng>/props` thấy 6 vùng mượn nguyên bộ đồ vùng khác (Rừng Nấm ← Đầm lầy; Phế tích Haven, Thánh Địa Bình Minh ← Cao nguyên; Vực Hư Không, Vực Ám Ma ← Núi lửa; Rừng Cổ Thụ ← Đầm lầy) → mỗi vùng 1 công trình biểu tượng ~280 px + 8 đồ vật đúng chất vùng, GIỮ STYLE MAP CŨ (chốt 05/11), ảnh mẫu thêm 6 cây riêng của Rừng Cổ Thụ / Ám Ma / Bình Minh phóng 4× trong `mau-tham-chieu/`. **Codex đã vẽ đủ 54 / 54 (12/11)**, chuẩn hoá vào `dot-12/chuan-hoa/` (công trình cao 280 px, rộng 230–328; đồ 28–96 px). Ghép thử từng vùng trên nền đất vùng cạnh cây map cũ của chính vùng + NPC làm thước: đúng chất vùng, không người / chữ, đồ cách nhau ≥ 8 px. Chờ chủ dự án duyệt. 0%.
- **CHỐT 12/11 — NHÀ VÀO ĐƯỢC MỖI VÙNG MỘT KIỂU** (chủ dự án: "Các phần như ngân hàng, quán rượu mỗi vùng phải khác nhau nhé"): quán rượu, ngân hàng và các tiệm (tạp hoá, lò rèn, may, cắt tóc) ở 13 khu dân cư (Thistlewood, Lau Xám, Sahrin, Cối Xay Gió, Tuyết Phong, Đe Đỏ, Cảng chài San Hô, Ánh Tím, Toà thành Haven cổ, Thành trì Hư Không, Rừng Cổ Thụ, Bình Minh, Ám Ma) KHÔNG dùng chung một bộ bên trong: mỗi vùng có cặp tường + sàn + món chủ đạo riêng (quầy bar, kệ rượu, lò sưởi / quầy giao dịch, cửa két…) theo chất vùng; đồ nhỏ trung tính (ghế đẩu, thùng, bàn tròn) dùng chung được. Bộ đợt 2–5 (Thistlewood) là bộ của vùng 1. Đề bài các vùng còn lại: làm sau đợt 12, chia theo vùng. 0%.
- **CHỐT 12/11 — TIỆM VŨ KHÍ / TRANG BỊ / NÂNG CẤP LÀ PHÒNG VÀO ĐƯỢC** (chủ dự án: "Shop trang bị, vũ khí, nâng cấp cũng cần một map riêng phải vào trong phòng"): mỗi tiệm một map trong nhà (sàn code, lối ra cạnh dưới), chủ tiệm NPC đứng sau quầy; theo chốt mỗi vùng một kiểu. Game chưa có tính năng nâng cấp — xưởng nâng cấp tách khỏi lò rèn (lò rèn: rèn / sửa; xưởng: khắc rune, đe phép, lò tinh luyện pha lê, vòng phép cường hoá), chủ dự án gộp lại được. **Đợt 13** (`DE-BAI-DOT-13.md`, 24 món, bộ Thistlewood): tiệm vũ khí `vk_` (2 tường, quầy kính, giá kiếm, giá thương, giá cung tên, chum trượng, giá khiên — đủ 5 class), tiệm trang bị `tb_` (2 tường, quầy, giá giáp sắt, giá giáp da — khung chữ T không đầu, giá áo choàng không mũ trùm, kệ giày găng, tủ trang sức), xưởng nâng cấp `nc_` (2 tường rune, bàn khắc rune, đe phép, lò tinh luyện, kệ đá cường hoá, vòng phép, bồn tôi phép). Cấm mũ / mũ giáp / mũ trùm kể cả bày trên giá. **Codex đã vẽ đủ 24 / 24 (12/11)**, chuẩn hoá vào `dot-13/chuan-hoa/`; hai mảng tường mỗi tiệm cùng khổ, ghép liền. Ghép thử 3 phòng 14 × 8 ô (sàn đá xám / gỗ / đá sẫm vẽ bằng code), chủ tiệm PixelLab sau quầy (tạm mượn Garrick, Mirelle, Ysolde — chờ NPC vùng mới), giá kệ dựa tường cách nhau ≥ 8 px. Bộ này là của Thistlewood; 12 khu còn lại mỗi khu một bộ tiệm vũ khí / trang bị / xưởng nâng cấp / lò rèn / quán rượu / ngân hàng riêng theo chất vùng (chủ dự án 12/11: "mỗi vùng sẽ có style phòng rèn, ngân hàng, quán rượu style theo vùng", "Các phòng mỗi vùng sẽ theo style của vùng"). Chờ duyệt. 0%.
- Chưa chốt: ngân hàng dùng làm gì trong lối chơi (game chưa có tính năng ngân hàng); quán rượu có dịch vụ gì.
- **CHỐT 12/11 — NPC MỖI VÙNG KHÁC NHAU, VẼ BẰNG PIXELLAB** (chủ dự án: "Mỗi vùng cần các npc khác nhau mà cần vẽ đấy pixelab"): hiện cả game chỉ có 8 tạo hình NPC dùng lặp (Elin, Garrick, Mirelle, Aldric, Bram, Ysolde, hai NPC tóc trắng); vùng 2–13 mượn lại, 11 NPC truyện chỉ có giọng. NPC mới vẽ bằng PixelLab (không GPT), cùng nét hai NPC tóc trắng, khung 80×88, đứng thở 8 hướng (chủ tiệm đứng sau quầy không cần đi), không đội mũ. Đề xuất 7 NPC / khu: bán vũ khí, bán trang bị, thợ rèn, thợ nâng cấp, chủ quán rượu (kiêm đồ ăn buff), chủ ngân hàng, bán hồi phục — dân theo vùng: Lau Xám dân đầm nhà sàn · Sahrin người sa mạc áo vải dài · Cối Xay Gió dân cao nguyên · Tuyết Phong thợ săn áo lông · Đe Đỏ người lùn · San Hô dân chài / thuỷ thủ · Ánh Tím người nấm · Haven cổ pháp sư triều cũ · Hư Không lính liên quân · Cổ Thụ Elf rừng · Bình Minh tu sĩ áo trắng vàng · Ám Ma người áo đen ánh tím. Thistlewood giữ 5 NPC dịch vụ đang có, thêm chủ quán rượu, chủ ngân hàng, thợ nâng cấp. Tổng 87 NPC + NPC truyện có giọng (Nyra, Odessa, Zahra, Hassim, Orrin, Wenna, Kael, Hilde, Durin, Maris, Corvin). ~14 lượt / NPC ≈ 1.200, cộng 30% vẽ lại ≈ 1.600 lượt. Thử 2 mẫu trước (đề xuất chủ quán rượu Lau Xám + thợ rèn người lùn Đe Đỏ), đặt sau quầy cạnh nhân vật thật, duyệt rồi mới vẽ hàng loạt. 0%.
- **Đợt 14–25 — NHÀ DỊCH VỤ + NỘI THẤT 7 PHÒNG MỖI VÙNG** (chủ dự án 12/11: "Giờ tiện cho promt các nhà ở vùng trung tâm các vùng, đồ vật trong phòng các vùng đi để nhờ gpt"): mỗi khu dân cư 7 nhà dịch vụ bên ngoài (quán rượu, ngân hàng, tiệm vũ khí, tiệm trang bị, lò rèn, xưởng nâng cấp, tiệm hồi phục — cùng bộ vật liệu, quán rượu / ngân hàng to nhất, cửa chính giữa mặt trước) + 7 phòng bên trong, mỗi phòng 2 mảng tường ghép liền + 4 món chủ đạo theo chất vùng (quầy bar / kệ rượu / món chủ đạo quán / bàn ghế; quầy giao dịch / cửa két / rương vàng / két sắt; quầy / giá kiếm + thương / giá cung + trượng / giá khiên; quầy / giá giáp chữ T / giá áo choàng / kệ giày găng; lò rèn / đe / thùng tôi / giá dụng cụ; bàn khắc rune / lò tinh luyện / vòng phép / kệ đá; quầy / kệ thuốc / nồi điều chế / món chủ đạo tiệm). Đợt 14: Thistlewood 7 nhà ngoài + Lau Xám (56 món); 15 Sahrin · 16 Cối Xay Gió · 17 Tuyết Phong · 18 Đe Đỏ · 19 San Hô · 20 Ánh Tím · 21 Haven cổ · 22 Hư Không · 23 Rừng Cổ Thụ · 24 Bình Minh · 25 Ám Ma (49 món / đợt). Tổng 595 món, mã `<vùng>_nha_*` và `<vùng>_<phòng>_*` (vùng: tl lx sa gh tp dd sc at hc th rc bm vm; phòng: qr nh vk tb lr nc hp). Bộ Thistlewood bên trong (đợt 2–5, 13) chỉ làm mẫu khổ / góc nhìn, không chép vật liệu. Chờ Codex vẽ. 0%.
- **12/11 — ĐƯA HÌNH GPT VÀO GAME (bước 1)** (chủ dự án: "giờ bạn thêm các cái đã vẽ vào game đi", "Tập trung build xong gia viên trước"):
  - **Đồ vùng đợt 12:** pipeline nhận nguồn `gptart:<đợt>/<id>` (`packages/asset-pipeline/src/props/gptArt.ts`, ảnh `chuan-hoa/`, đệm 2 px trong suốt); 6 vùng Ánh Tím / Haven cổ / Hư Không / Cổ Thụ / Bình Minh / Ám Ma có công trình biểu tượng đứng đầu hàng nhà của trạm (giữ trống quanh thân để cây không che mặt tiền) + 8 đồ rải ở sân trạm và quanh bãi quái mọi map. Dựng lại `assets/maps/<6 vùng>`; `worldmaps.test` qua 4/4. Nhà ở trạm 6 vùng này vẫn MƯỢN nhà vùng khác (nhà sàn, cối xay, chuồng đỏ…) cho tới khi có nhà dịch vụ đợt 14–25.
  - **Gia viên** (`scripts/export-home-maps.mts`): khuôn viên mở rộng 48 × 32 ô — nửa tây: nhà chính, giếng, nhà kính GPT đợt 1 + rào gỗ đợt 7 quanh ruộng (giữ toạ độ cửa nhà, ruộng, hộp gửi hàng); nửa đông: **khu chăn nuôi** (chủ dự án 12/11: "Ở ngoài nhà sắp xếp k đúng lắm còn nơi chuồng gà, chuồng heo") — bãi quây bò / cừu và sân gà kín 4 phía dựng lớp rào bằng `scripts/build-home-pens.py` (đúng cách ghép bản thử đã duyệt: hàng sau / cạnh bên rào dọc + cột thật / hàng trước có cổng; lớp rào chặn đi qua), bò / cừu / gà PixelLab đứng tĩnh theo tỉ lệ chốt (×2 / ×1,5 / ×0,6), máng nước, giá cỏ khô, chuồng gà lớn, máng thóc, ổ tắm cát; ngoài bãi: chuồng bò lớn có silo, xe sữa, cuộn rơm, cột gãi, 3 tổ ong cạnh bồn hoa. **Chưa có heo** (chưa vẽ con heo PixelLab + chuồng heo GPT) — cần duyệt thêm vào đợt vẽ sau. Con vật đi lại / cho ăn / sản phẩm: code sau.
  - **Nhà 3 phòng, mỗi phòng một map** (chủ dự án 12/11: "Nhà là đủ phòng mà chứ không phải tất cả trong 1 phòng"; đúng chốt 11/11 và bố cục ảnh ghép thử): phòng khách 18 × 9 (`home/<tk>_inside`, lối ra vườn cạnh dưới, cửa trái sang bếp, cầu thang gỗ góc phải lên tầng), bếp 14 × 9 (`_kitchen`, sàn đá lát, tường ốp gạch, điểm nấu ăn), phòng ngủ tầng 2 14 × 9 (`_bedroom`, lỗ cầu thang xuống, tủ quần áo đổi bộ đồ ở nhà). Sàn vẽ bằng code + dải tường GPT + thảm chùi chân ở cửa nướng vào nền (decal); đồ GPT đợt 2 / 3 / 4 + đồ PixelLab Gia viên đúng vị trí ảnh ghép thử. Máy chủ: thao tác `go` sang phòng chỉ khi đứng đúng cửa / cầu thang (`FARM_ROOMS`), ra vườn chỉ từ phòng khách, đổi đồ chỉ ở tủ phòng ngủ; gửi kèm điểm đến để bước qua cửa đứng đúng chỗ. `farm.test` phủ đi bếp / phòng ngủ / đổi đồ / chặn sai cửa.
  - **CHỐT 12/11 — HỒ CÂU LÀ MAP RIÊNG DÙNG CHUNG** (chủ dự án: "Hồ câu cá là một map bên cạnh nhé k chung map với gia viên cá nhân", "Vì câu cá có thể câu cùng bạn bè"): bỏ hồ khỏi khuôn viên; map `home/pond` một bản cho mọi người đã mở Gia viên (người cùng map thấy nhau), vào bằng cổng mép nam khuôn viên (240, 640), về bằng cổng bờ tây (96, 352). Hồ phía đông (động tác câu vẽ hướng E), 5 chỗ câu dọc bờ + đầu cầu gỗ (`FARM_LAYOUT.pondSpots`); máy chủ chặn câu ngoài hồ / ngoài chỗ câu, rời hồ huỷ lượt câu đang dở. `farm.test` qua. Mời bạn / phòng hồ riêng theo nhóm: để sau.
  - Chưa: chạy AutoTest Gia viên trên máy chủ thử 3201, build bản chơi; chuồng / bãi quây có con vật, nhà Gia viên mua được (đợt 7 / 10) và nội thất 16 nhà; tiệm / quán rượu / ngân hàng vào được. 0%.
  - **12/11 — Quản gia + ruộng mở rộng + bể cá** (chủ dự án: "1 npc ở gia viên để mua đồ đạc: mua nhà, mua đồ vật, mua bể cá", "chỗ trồng cây gia viên nữa cần rộng còn mở ô đất nữa", "Bể cá nữa nhé"): NPC Quản gia (`village_steward`, đứng ở khuôn viên) mở cửa hàng Gia viên — mở thêm 4 ô ruộng (giá thử 150 xu, +50 mỗi lần), bể cá trong nhà (giá thử 500 xu); nhà và đồ vật hiện "sắp mở" (chờ chốt giá + cách đặt đồ). Ruộng 8 × 6 = 48 ô ở góc tây nam khuôn viên, mở sẵn 12 ô, ô chưa mở vẽ mờ. Bể cá phòng khách (hình tạm vẽ bằng code, thay bằng hình GPT khi có): thả tối đa 6 con cá từ kho, cá bơi qua lại, lấy lại được, cá trong bể không bị bán. Máy chủ giữ mua / thả / lấy (`farm.test` phủ). **Hình Quản gia đang MƯỢN Bram** — chủ dự án 12/11: "Npc cần đa dạng lên cứ dùng 1 người thế" → vẽ Quản gia riêng bằng PixelLab (Pro, ảnh NPC tóc trắng làm chuẩn nét, không đội mũ, ~14 lượt); tài khoản thử trong phiên bị khoá lượt miễn phí, cần dùng token trả phí #1. 0%.
  - **12/11 — Thú cưng vào game** (kế hoạch 9.9 + chốt "chỉ đi lại tự do ở Gia viên"): xuất 22 thú (đứng + đi hướng S / E / N, W lật, chéo dùng ảnh xoay) qua `scripts/write-pet-specs.py`; bộ xuất thêm bước dọn "đảo rời" (`removeIslands`) vì PixelLab vẽ vệt hiệu ứng lơ lửng trên đầu ở vài khung (vệt không có tác dụng gì, là lỗi tự thêm). Máy chủ quay gacha (100 KC / 1 lượt, 900 KC / 10 lượt chắc chắn ≥ 1 Hiếm, 80 lượt chắc chắn Huyền thoại, trùng → mảnh 1 / 3 / 8 / 20, đổi mảnh 30 / 60 / 120 / 300 — giá thử), trừ kim cương + ghi sổ cùng giao dịch trạng thái Gia viên. Tối đa 6 con thả đi lang thang ở khuôn viên và 3 phòng (không có ở hồ câu chung). Bảng quay mở từ cửa hàng Quản gia. Ngủ / ngồi: thêm sau (bộ xuất chưa có động tác ngủ). 0%.
  - **CHỐT 12/11 — HAI VAI NPC GIA VIÊN + BÀY TRÍ** (chủ dự án: "Quản gia chỉ là người để mở bảng chọn các đồ vật trong nhà sắp xếp như bếp, giường, ghế, bể cá… còn bên ngoài là 1 npc mới bán bể cá, nhà, quay thú cưng, mở ô ruộng, hạt giống"): **Cô Lựu** (`npc_homeshop_001`, khuôn viên) bán hạt giống, mở ô ruộng, bể cá, quay thú cưng, nhà / đồ vật (sắp mở); **Bác Tôn — Quản gia** (`npc_steward_001`, phòng khách) mở bảng bày trí. Hai NPC vẽ mới bằng PixelLab Pro (token #0, 20 lượt, ảnh NPC tóc trắng làm chuẩn nét, không mũ), cao 73–74 px như NPC mẫu. **Quy định NPC đứng yên** (chủ dự án: "Quy định các npc là đứng yên", "K cần hướng xay") — NPC sau chỉ vẽ ảnh nhìn thẳng. Bày trí: đồ trong 3 phòng là đồ theo dữ liệu người chơi (máy chủ giữ), bố cục ảnh ghép thử là mặc định; cất vào kho / đặt từ kho ngay trước chỗ đứng, máy chủ chặn ngoài sàn, chồng đồ, chắn cửa / cầu thang; bể cá mua về vào kho, đặt phòng nào cũng được, cá bơi theo chỗ đặt. Danh mục + mặc định sinh tự động `packages/sim/src/farmDecor.generated.ts`. Cầu thang, lỗ cầu thang, tủ quần áo giữ cố định. **Cầu thang theo nhà** (chủ dự án: "Cầu thang cũng nên đổi được… theo style nhà", "Hoặc cầu thang sẽ theo nhà"): cầu thang là phần của kiểu nhà như tường + sàn — mỗi nhà mua được có cầu thang đúng vật liệu, vẽ khi mở bán nhà. 0%.
  - **12/11 — Cầu thang theo nhà, 16 kiểu** (chủ dự án: "Vẽ thang đi"): PixelLab Pro Flash 4 tấm 2 × 2 (`sources/pixellab/sheets/ST1…ST4_stairs.png`, ~36 lượt token #0, ảnh mẫu = cầu thang gỗ GPT đợt 2) → cắt, tách nền, xoá vệt xanh mép tấm, giữ khối liền: `sources/home-stairs/cau_thang_<mã nhà>.png` (dq, nk, dv, cx, tt, ns, bh, sm, ct, gd, pd, ln, ld, lk, lb, hv), cỡ 84–102 × 95–109 px, cùng dáng 6 bậc đi lên trái → phải, tay vịn + 2 trụ. Gắn vào phòng khách khi mở bán nhà (mỗi nhà: tường + sàn + cầu thang riêng). 0%.
  - **12/11 — 12 cây mới vào game** (kế hoạch 9.8): lúa nước, ngô, cà chua, dưa hấu, nho, ớt, chè, hướng dương, nấm sáng, hoa trăng, quả sao, lúa vàng — 4 giai đoạn (F6 / F7 / F8), icon nông sản (F9), túi hạt (F10); `HOME_CROPS_2` trong `props/homeAssets.ts`, `FARM_CROPS` thêm 12 cây (thời gian / giá thử, chưa cân bằng). Hạt mua ở Cô Lựu hoặc quầy Bram; mở Gia viên vẫn chỉ tặng hạt 6 cây đầu. Bảng chọn hạt 4 cột. 0%.
  - **12/11 — Cây ăn quả + máy chế biến vào game** (kế hoạch 9.8, hình T1 / M1 / F9 / F10): 4 chỗ vườn cây ở khuôn viên (sim `FARM_TREE_SPOTS`), cây giống táo / cam / đào Haven mua ở Cô Lựu, cây non → lớn → có quả, hái nhiều lần (3 quả / lần). 6 máy (cối xay bột, lò nướng bánh, hũ muối dưa, máy ép quả, thùng ủ rượu, giá sấy) mua ở Cô Lựu, đứng ở góc chế biến khuôn viên (`FARM_MACHINE_SPOTS`); bỏ nguyên liệu trong kho → chờ → lấy thành phẩm; quả + thành phẩm bán ở hộp gửi hàng. Giá / thời gian / công thức thử. Cây và máy vẽ lúc chạy theo dữ liệu người chơi, có va chạm. Hũ mật ong: icon có, chưa có tổ ong ra mật (code chăn nuôi sau). 0%.
  - **CHỐT 12/11 — CÂU CÁ CHỈ 1 MAP: HỒ RIÊNG SAU GIA VIÊN, BẠN BÈ GHÉ CÂU CHUNG ≤ 6 NGƯỜI** (chủ dự án: "Câu cá chỉ có 1 map thôi sau gia viên và bạn bè có thể vào hồ nhà nhau câu cá chung với bạn bè tối đa 6 người trong một hồ"; thay bản hồ chung `home/pond`): mỗi nhà một hồ `home/<tài khoản>_pond`, chủ vào qua cổng mép nam khuôn viên; bạn bè bấm "Câu cá" ở bảng Bạn bè để sang hồ nhà bạn (máy chủ kiểm là bạn, bạn đã mở Gia viên, hồ còn chỗ — tối đa 6 người kể cả chủ). 6 chỗ câu dọc bờ + đầu cầu; ai câu thì lượt câu / cá vào kho người đó. Ra cổng hồ là về Gia viên của mình. Không làm chỗ câu ở các vùng. 0%.

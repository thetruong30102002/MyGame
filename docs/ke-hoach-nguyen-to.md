# Kế hoạch: cây Nguyên tố + Kiếm phủ phép (thay hệ "cộng điểm vào từng skill")

> **Chốt mới 26/10/2026 — ưu tiên mục 10:** 8 nguyên tố được thiên phú phát hiện ở **cấp 10**, random đồng đều **1/8 = 12,5% mỗi hệ**, mỗi user chỉ có **1 nguyên tố**. Cần thiết kế bộ chiêu cho **Kiếm, Khiên, Thương, Cung**; **Pháp sư chờ chủ dự án thử lại rồi thống kê chiêu giữ lại**. Đây là ghi chú phát triển, chưa hiện thực luật mới. Các mô tả tự chọn hệ / đổi hệ / mở hệ bằng nhiệm vụ ở mục cũ là lịch sử, cần cập nhật theo mục 10 khi triển khai.

> **10/10/2026 — sẽ BỎ chiêu dạng tường** (chủ dự án: "bỏ các skill tường đi cho các hiệu ứng xịn nhiều animation đi"): Tường Lửa (Hoả 6) → Hoả Long Phún, Tường Đá (Thổ 6) → Cự Thạch Lăn; làm cùng đợt vẽ lại hiệu ứng chiêu người chơi — chi tiết + lượt ước ở `docs/pixellab-ke-hoach-ve.md` mục "Hiệu ứng chiêu NGƯỜI CHƠI".

Trạng thái: **ĐÃ CHỐT HƯỚNG** (07/10/2026 — chủ dự án: "làm theo ý bạn", thêm: thanh 10 ô, chỉ master được 1 nhánh). Đã thay
phần "điểm tiềm năng cộng vào kỹ năng" ở `docs/tiem-nang-va-giao-dien.md`. **GĐ1 + GĐ1.5 + GĐ2 (lượt A + B) + GĐ3 (lượt A: mốc 6–9
của 5 nguyên tố, lượt B: mốc 6–9 của 3 lưu phái Kiếm — mọi nhánh tới mốc 9) ĐÃ LÀM (07/10/2026)**, sửa 16 lỗi sau review (08/10/2026) — xem mục 7.
**10/10/2026 (chủ dự án):** mở nhánh chỉ là ĐƯỢC PHÉP học — mốc 1 nguyên tố (phép đầu) tốn **1 điểm**, Kiếm giữ mốc 1 miễn phí; bài tập
phép tuổi thơ nhận Tia Aether khi chưa học — mục 7 "Mốc 1 nguyên tố học bằng điểm".

## 1. Ý người chơi (nguyên văn rút gọn)

- Điểm tiềm năng **cộng vào NGUYÊN TỐ**, không cộng vào từng skill (Hoả Cầu, Băng Tiễn…).
- Mỗi nguyên tố chia **10 mốc**; nâng đủ một mốc thì **học được 1 skill** của nguyên tố đó.
- **Kiếm tính như một nguyên tố**: cũng 10 mốc, 10 skill riêng.
- Có **kết hợp phép vào kiếm** để tăng hiệu ứng đòn chém (Kiếm + 1 nguyên tố).
- Người chơi **tự chọn lối build**.
- Nguyên tố: **Hoả, Thuỷ, Phong, Băng, Thổ** (Thổ là mới) — cộng Kiếm là **6 nhánh**.

## 2. Khung hệ thống

### 2.1 Nhánh, mốc, điểm

| Khái niệm | Đề xuất |
|---|---|
| Nhánh | Kiếm · Hoả · Thuỷ · Phong · Băng · Thổ (6 nhánh × 10 mốc = 60 mốc) |
| Mở nhánh | Cốt truyện trao (như bây giờ): Kiếm = kiếm gỗ của cha (6 tuổi), Hoả/Thuỷ 6 tuổi, Phong/Băng 8 tuổi, **Thổ: nhiệm vụ mới ở 16 tuổi**. Mở nhánh = **được phép học** (chủ dự án 10/10/2026): nhánh nguyên tố vừa mở ở **mốc 0**, mốc 1 (phép đầu — Hoả Cầu, Thuỷ Tiễn…) mua **1 điểm**; riêng **Kiếm có sẵn mốc 1** (Trảm) khi nhận kiếm gỗ. Trước 10/10 mở nhánh là có mốc 1 miễn phí. |
| Điểm nhận | Giữ công thức hiện tại: 1 điểm/cấp + 1 điểm thưởng mỗi 5 cấp. **Cấp tối đa 40 → 47 điểm** |
| Giá mốc | Mốc 1: nguyên tố **1**, Kiếm 0 · mốc 2→10: **1 · 2 · 2 · 3 · 3 · 4 · 4 · 5 · 5** → max một nhánh: **Kiếm 29, nguyên tố 30** (`TIER_COST`, `tierCost`) |
| Hệ quả ở cấp 40 | **Chỉ master được 1 nhánh** (29–30). Còn **17–18 điểm ≈ 60% một nhánh nữa**: một nguyên tố phụ tới mốc 7 (16), hoặc master Kiếm + hai nguyên tố mốc 5 (9 + 9), master nguyên tố + Kiếm 5 + nguyên tố 5 (8 + 9) (xem 2.4). Nâng cấp tối đa về sau thì tăng giá mốc theo, giữ đúng tỉ lệ "1 master + ~60%". |
| Thưởng chiều sâu | Mỗi mốc đạt được: **+4% sức mạnh mọi skill của nhánh đó** (mốc 10 = +36%). Thay cho `rankPower` theo từng skill. |
| Phạt tạp nham | **Bỏ** hệ số −15% hiện tại: rải điểm thì tự yếu vì không chạm mốc cao (không có skill mạnh, không có bị động lớn). Đơn giản, dễ hiểu hơn. |
| Tẩy điểm | Giữ luật cũ: miễn phí tới cấp 5, sau đó 10 xu × cấp. |

Giá mốc tăng dần vì skill mốc cao mạnh hơn hẳn; giá phẳng (1 điểm/mốc) thì người chơi max được 5 nhánh — không còn build.

Điểm tích luỹ để tới mốc (`pointsToTier`): Kiếm m2 = 1 · m3 = 3 · m4 = 5 · m5 = 8 · m6 = 11 · m7 = 15 · m8 = 19 · m9 = 24 · m10 = 29;
nguyên tố cộng thêm 1 điểm mốc 1: m1 = 1 · m2 = 2 · m3 = 4 · m5 = 9 · m7 = 16 · m9 = 25 · m10 = 30.

### 2.2 Mỗi nhánh 10 mốc: 6 chủ động + 4 bị động

| Mốc | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|
| Loại | Chủ động (đòn cơ bản) | Bị động | Chủ động (vùng) | Bị động | **Chủ động đặc trưng** + mở kết hợp | Chủ động (phòng thủ/điều khiển) | Bị động | Chủ động mạnh | Bị động | **Tuyệt kỹ** |

Lý do 4 bị động: thanh kỹ năng không chứa nổi 60 skill (xem 2.4), và bị động là thứ khiến **dồn sâu** đáng giá.

### 2.3 Kiếm phủ phép (Kiếm + 1 nguyên tố)

- **Điều kiện:** Kiếm ≥ mốc 2 và nguyên tố đó ≥ **mốc 5**. Mỗi lúc chỉ phủ **một** nguyên tố; đổi phủ có **hồi 10 giây**.
- **Chặn lối "master Kiếm + rải mỗi nguyên tố 1 ít để lấy đủ hiệu ứng"**: nếu phủ phép chỉ cần mốc 2 (1 điểm) thì master Kiếm
  còn 18 điểm, rải đủ 5 nguyên tố mốc 2 là có cả 5 kiểu phủ, đổi qua lại để tự gây phản ứng. Đòi **mốc 5** (9 điểm/nguyên tố, tính cả mốc 1)
  thì 18 điểm chỉ phủ được **tối đa 2 nguyên tố**: "Kiếm + 1–2 hệ" là một lối build, không phải lấy hết. Hồi 10 giây khi đổi
  phủ để không chém Lửa rồi đổi ngay sang Băng tự ăn Tan Chảy liên tục.
- **Phủ phép:** mọi đòn của nhánh Kiếm mang hiệu ứng nguyên tố, mạnh dần theo mốc của nguyên tố:

| Phủ | Hiệu ứng lên nhát chém (từ mốc 5) | Mốc 7 nguyên tố | Mốc 10 nguyên tố |
|---|---|---|---|
| Hoả | Gây cháy | Nhát thứ 3 nổ nhỏ | Vệt lửa trên đất sau mỗi nhát |
| Thuỷ | Làm ướt + hồi máu 3% sát thương | Hồi 6% | Nhát chém bắn sóng nước ngắn |
| Phong | Tầm chém +25%, đẩy lùi nhẹ | Lưỡi gió bay ra theo nhát chém | Xuyên mục tiêu |
| Băng | Làm chậm, cộng dồn 3 lần → đóng băng | Đóng băng nhanh hơn | Vỡ băng: đánh mục tiêu đóng băng gây thêm sát thương |
| Thổ | Phá giáp (−phòng thủ) | Nhát thứ 3 choáng ngắn | Sóng chấn theo nhát chém |

- **Kiếm pháp nguyên tố** (skill kết hợp riêng, 1 cho mỗi nguyên tố): mở khi **Kiếm ≥ 5 và nguyên tố đó ≥ 5** —
  Liệt Hoả Trảm · Thuỷ Long Trảm · Phong Kiếm Cuồng Vũ · Hàn Băng Trảm · Địa Liệt Trảm.
- Đòn kiếm có hệ vẫn **gây phản ứng** như phép (đang chạy sẵn: "Kiếm Băng" đánh mục tiêu ướt → Đóng Băng).

### 2.4 Thanh kỹ năng = chọn bộ skill mang theo

- 60 mốc thì tối đa 36 skill chủ động — không thể gán cứng phím cho từng skill như bây giờ (J, K, 1–5).
- **10 ô, gán tự do**: phím **J, K, 1–8**. Mặc định J = Trảm, K = Tia Aether, nhưng ô nào cũng đổi được. **Space** né,
  **R** bình máu như cũ (không tính vào 10 ô). Bảng Tiềm năng thêm phần "Gán vào ô" (bấm skill rồi bấm ô; điện thoại cũng làm được).
- Bị động không chiếm ô.
- **Cân với 10 ô** (build đủ điểm ở cấp 40):

  | Nguồn skill chủ động | Số skill |
  |---|---|
  | Nhánh master (mốc 1, 3, 5, 6, 8, 10) | 6 |
  | Nhánh phụ tới mốc 7 (mốc 1, 3, 5, 6) | 4 |
  | Tia Aether | 1 |
  | Mốc 1 (1 điểm) của các nhánh nguyên tố khác đã học | 0–4 |
  | **Tổng** | **11–15 → phải chọn 10** |

  Max được 2 nhánh cũng vô ích: 2 × 6 chủ động + Aether = 13 skill mạnh mà chỉ có 10 ô — điểm dồn vào mốc 8/10 của nhánh
  thứ hai sẽ thành skill không mang theo được. Vì vậy trần điểm đặt ở **1 master + ~60%**, phần dư đi vào bị động và độ
  mạnh của nhánh phụ chứ không đẻ thêm skill thừa.
  Vậy 10 ô vừa đủ để người chơi phải bỏ bớt vài skill yếu, nhưng không bao giờ thiếu ô cho skill chính. Ít hơn (8 ô) thì
  nhánh phụ gần như không có chỗ; nhiều hơn (12 ô) thì mọi thứ đều mang theo được, chọn lựa mất ý nghĩa.
- **Sức mạnh** (thưởng chiều sâu +4%/mốc): nhánh master **+36%**; nhánh phụ mốc 7 **+24%**; hai nhánh phụ mốc 5 **+16%** mỗi
  nhánh; mốc 1 **+0%**. Skill master vừa mạnh nhất vừa có bị động mốc 7/9 — là lõi của build, nhánh phụ là gia vị.

### 2.5 Hai nguyên tố (phản ứng)

Giữ 5 phản ứng đang có, thêm 4 phản ứng của Thổ:

| Cặp | Phản ứng | Hiệu ứng |
|---|---|---|
| Hoả + Thuỷ | Hơi Nước (có) | |
| Hoả + Phong | Bùng Lửa (có) | |
| Thuỷ + Phong | Băng Giá (có) | |
| Băng + Thuỷ | Đóng Băng (có) | |
| Băng + Hoả | Tan Chảy (có) | |
| **Thổ + Thuỷ** | **Bùn Lầy** | Chậm nặng 3s |
| **Thổ + Hoả** | **Dung Nham** | Cháy mạnh + phá giáp |
| **Thổ + Phong** | **Bão Cát** | Quái đánh trượt 40% trong 3s |
| **Thổ + Băng** | **Vỡ Vụn** | Mục tiêu đang đóng băng nhận sát thương lớn, hết đóng băng |

Thưởng song hệ hiện tại (+6%/điểm của hệ yếu hơn vào phản ứng) đổi thành **+5% mỗi MỐC** của hệ yếu hơn. Skill hợp nhất
hai hệ (vd Thuỷ + Phong = "Bão Tuyết") để **giai đoạn sau** — 10 cặp là 10 skill nữa.

### 2.6 Aether và Hồi Phục

- **Tia Aether**: năng lực bẩm sinh của nhân vật chính (nhìn thấy sợi tơ) — **không thuộc cây**, luôn có ở phím K, mạnh dần
  theo cấp. Không thì người chơi thuần Kiếm sẽ không có đòn xa nào.
- **Hồi Phục**: chuyển vào **Thuỷ mốc 3** ("Suối Lành"). Hệ quả: build không có Thuỷ chỉ hồi máu bằng bình mật ong.

### 2.7 Hướng phát triển Kiếm: mở rộng thành 3 lưu phái (người chơi chốt 07/10/2026)

Kiếm vẫn là **một nhánh** (một bộ điểm, chung giá mốc và luật "chỉ master 1 nhánh"), nhưng **tách 3 lưu phái** từ mốc 3:

| Lưu phái | Lối chơi | Hợp phủ phép |
|---|---|---|
| **Kiếm Thần** | Tấn công: nhát nặng, chí mạng, cộng dồn sát thương, đòn xa | Hoả (dồn sát thương), Thổ (phá giáp chồng phá giáp) |
| **Thủy Thần** | Tĩnh, đỡ và **phản đòn**, gạt đạn, hồi máu khi phản | Thuỷ (phản đòn kèm hút máu → lối "bất tử"), Băng (phản đòn làm chậm) |
| **Bắc Thần** | Nhanh nhẹn: lướt, ra sau lưng, chuỗi chém nhanh, né hoàn toàn | Phong (lướt để lại lưỡi gió), Băng (chém nhanh cộng dồn đóng băng) |

- **Mốc 1–2 chung** (Trảm, Nhịp Chém). Lần đầu cộng lên **mốc 3** thì chọn lưu phái; mốc 3–10 là 8 skill riêng của lưu phái.
- **Đổi lưu phái = tẩy điểm** (luật tẩy điểm hiện có). Không giữ song song hai lưu phái.
- Số build có bản sắc: 156 → **208** (Kiếm master thành 3 lối khác hẳn nhau).
- Về sau có thể mở rộng **lưu phái cho các nguyên tố** theo cùng khuôn — chưa làm, chỉ ghi hướng.
- Art: Kiếm từ 8 thành **24 skill riêng** — cần thêm icon + động tác (lướt, giữ thế đỡ, phân thân, phóng kiếm). Xếp ở mục 7.

### 2.8 Đòn Kết Liễu — mốc 9 mỗi nhánh (chủ dự án 08/10/2026)

"Mỗi hệ trước skill cuối sẽ có một skill mạnh, hồi chiêu lâu, để chí mạng dứt điểm, tranh nhau boss." Mốc 9 của mọi nhánh (5 nguyên
tố + 3 lưu phái Kiếm) nay cho **cả bị động cũ + một Đòn Kết Liễu** (mốc 9 vốn đắt nhất: 5 điểm). Với 47 điểm ở cấp 40 chỉ nhánh
MASTER chạm mốc 9 (24 điểm tới mốc 9, nhánh phụ ~mốc 7) ⇒ **mỗi build đúng một Đòn Kết Liễu** — không gom được nhiều cái.

Luật chung (số đề xuất, cân lại khi làm):
- Uy lực ×5,5 sức đánh của nhánh, **một mục tiêu**, hồi chiêu **90 giây** (không hồi nhanh hơn bằng bất kỳ hiệu ứng nào).
- **Dồn lực 0,5 giây** có hiệu ứng tụ sáng nhìn thấy được (người khác thấy mình sắp kết liễu — tranh nhau bằng nhịp, không bằng may).
- **Kết liễu**: mục tiêu còn dưới 25% máu → ×1,5 nữa và **chắc chắn chí mạng**. Trên 25% máu chỉ là một đòn mạnh thường —
  tung sớm là phí 90 giây.
- Không khống chế (choáng, đóng băng…) lên boss — chỉ sát thương, tránh khoá boss.
- Tính là đòn của hệ đó (gây phản ứng, ăn thưởng chiều sâu như mọi kỹ năng của nhánh).

| Nhánh | Đòn Kết Liễu (tên đề xuất) | Nét riêng |
|---|---|---|
| Hoả | **Liệt Diễm Phá** | tụ cầu lửa trên tay rồi phóng thẳng, nổ thành cột lửa trên mục tiêu |
| Thuỷ | **Hải Triều Kích** | mũi giáo nước khổng lồ; mục tiêu đang ướt → thêm ×1,2 |
| Phong | **Phong Thần Nhất Tiễn** | một mũi tên gió xuyên thẳng, bay rất nhanh (khó hụt khi boss di chuyển) |
| Băng | **Băng Phách Đoạt Mệnh** | thương băng; mục tiêu đang đóng băng → coi như dưới 25% máu (chắc chí mạng) |
| Thổ | **Thái Sơn Áp Đỉnh** | khối núi rơi xuống mục tiêu; đang bị phá giáp → thêm ×1,2 |
| Kiếm Thần | **Nhất Kiếm Đoạn Hồn** | lướt tới chém một nhát xuyên người, vệt kiếm đứng lại nửa giây |
| Thủy Thần | **Hồi Ba Trảm** | chỉ tung được trong 3 giây sau một lần đỡ / phản thành công — phần thưởng cho lối chơi phản đòn |
| Bắc Thần | **Ảnh Sát** | biến ra sau lưng mục tiêu rồi đâm; ra sau lưng thì không thể bị gạt / né |

**Long Châu chỉ rơi cho người dứt điểm rồng** (chốt 08/10/2026) — mà Long Châu mở tuyệt kỹ mốc 10 của hệ ⇒ Đòn Kết Liễu là
cửa vào tuyệt kỹ. Long Huyệt (sân rồng) chỉ cho vào khi đủ cấp mở chiêu cuối — đề xuất mốc 10 cần **cấp 40 + Long Châu**
(`docs/ke-hoach-the-gioi.md` mục 2.1).

Hình: mỗi đòn 1 hiệu ứng dồn lực + 1 hiệu ứng trúng lớn → token trả phí (`docs/pixellab-ke-hoach-ve.md`, nhóm skill lớn); làm trước
bằng hình tạm như mọi skill. Săn boss + chia phần thưởng (ai được gì khi tranh nhau): `docs/ke-hoach-the-gioi.md` mục 2.2.

## 3. Danh sách skill (ĐÃ DUYỆT 07/10/2026)

Mỗi nhánh: chủ động ở mốc 1, 3, 5, 6, 8, 10 · bị động ở mốc 2, 4, 7, 9. ★ = skill đặc trưng (mở phủ phép / kiếm pháp nguyên tố),
✦ = tuyệt kỹ (hồi chiêu dài). Bị động theo ý người chơi: phần lớn là **tăng hiệu ứng** — lợi cho bản thân (hút máu, hồi phục,
giáp) hoặc hại cho địch (cháy, làm chậm, thời gian đóng băng, đánh trượt).

### 3.1 Kiếm — 3 lưu phái (xem 2.7)

Phần chung: **1 Trảm** (chủ động, chém cận chiến) · **2 Nhịp Chém** (bị động, tốc chém +10%). Từ mốc 3 theo lưu phái đã chọn:

| Mốc | ⚔️ Kiếm Thần lưu — tấn công | 🌊 Thủy Thần lưu — tĩnh, phản đòn | 🌬️ Bắc Thần lưu — nhanh nhẹn |
|---|---|---|---|
| 3 C | **Nhất Kích** — dồn lực một nhát chém nặng | **Thế Tĩnh** — giữ thế 1,5s, đòn cận chiến đánh vào bị chặn và phản lại | **Lướt Chém** — lướt ngang chém, lúc lướt không trúng đòn |
| 4 B | **Mắt Tinh** — chí mạng +8% | **Tâm Tĩnh** — đứng yên/giữ thế: nhận sát thương −15% | **Nhẹ Như Gió** — tốc chạy +10%, né tốn ít thể lực hơn 30% |
| 5 C ★ | **Đột Kích** — lướt tới chém xuyên hàng quái | **Lưu Thủy Phản** — đỡ một đòn rồi phản công gấp đôi | **Ảnh Bộ** — lướt ra sau lưng mục tiêu chém, chắc chắn chí mạng |
| 6 C | **Phá Giáp** — đòn nặng, địch −30% phòng thủ 6s | **Dòng Chảy Ngược** — gạt đạn bay ngược về kẻ bắn | **Liên Hoàn** — chuỗi 4 nhát chém thật nhanh |
| 7 B | **Thế Áp Đảo** — mỗi nhát trúng liên tiếp +5% sát thương (tối đa 5 lần) | **Phản Đòn** — né/đỡ đúng lúc: nhát phản công chắc chắn chí mạng | **Đà Lướt** — né xong 3 nhát chém kế nhanh hơn 25% |
| 8 C | **Lưỡi Sóng** — luồng kiếm bay xa, xuyên mục tiêu | **Xoáy Nước** — cuộn xoáy nước chém tại chỗ nhắm, đẩy lùi; vừa đỡ đòn thì mạnh hơn | **Phi Kiếm** — phóng kiếm bay xuyên hàng quái rồi bay về tay |
| 9 B | **Bất Khuất** — dưới 30% máu: +20% công, hút máu 5% | **Mặt Hồ Phẳng** — mỗi lần phản đòn thành công hồi 5% máu | **Bóng Mờ** — 15% né hoàn toàn một đòn |
| 10 C ✦ | **Phán Quyết** — ngàn thanh kiếm ánh sáng cắm xuống cả vùng *(sẽ đổi: **Đoạn Thiên Trảm** — lướt tới bổ một nhát khổng lồ, kết liễu)* | **Thiên Tĩnh** — chỗ nhắm lặng như mặt hồ: quái đứng sững rồi trúng một nhát chém cực nặng *(sẽ đổi: **Bạt Kiếm Thiên Tĩnh** — tra kiếm chặn đòn rồi rút kiếm chém loé, kết liễu)* | **Ngàn Bóng** — 3 bóng phân thân lao tới chỗ nhắm chém liên tục 6s *(sẽ đổi: **Vô Ảnh Liên Trảm** — 8 nhát lướt chém + nhát bổ cuối, kết liễu)* |

### 3.2 Năm nguyên tố

| Mốc | 🔥 Hoả | 💧 Thuỷ | 🌪️ Phong | ❄️ Băng | 🪨 Thổ |
|---|---|---|---|---|---|
| 1 C | **Hoả Cầu** — cầu lửa, gây cháy | **Thuỷ Tiễn** — mũi nước, làm ướt | **Phong Nhận** — lưỡi gió bay xuyên | **Băng Tiễn** — mũi băng; trúng mục tiêu ướt thì Đóng Băng | **Đá Văng** — ném đá, đẩy lùi |
| 2 B | **Mồi Lửa** — cháy lâu hơn 50% | **Thấm Sâu** — ướt lâu hơn 50%, quái đang ướt chậm 10% | **Gió Sắc** — phép Phong bay nhanh/xa +20% | **Hàn Khí** — làm chậm lâu và mạnh hơn | **Đá Nặng** — phép Thổ đẩy lùi xa, choáng lâu hơn |
| 3 C | **Vòng Lửa** — nổ vòng lửa quanh mình, đẩy quái | **Suối Lành** — hồi máu *(Hồi Phục cũ)* | **Lốc Xoáy** — lốc nhỏ cuốn quái vào giữa | **Băng Địa** — mặt đất phủ băng làm chậm | **Địa Chấn** — dậm đất, choáng nhẹ quanh mình |
| 4 B | **Tim Lò** — +20% sát thương vào mục tiêu đang cháy | **Huyết Thuỷ** — hút máu: đòn Thuỷ hồi 5% sát thương gây ra | **Thuận Gió** — hồi chiêu −10%, tốc chạy +10% | **Giáp Sương** — nhận sát thương −10% | **Da Đá** — phòng thủ +15%, không bị đẩy lùi |
| 5 C ★ | **Bộc Hoả** — cầu lửa lớn nổ lan, đốt cả nhóm | **Sóng Dữ** — sóng hình nón đẩy lùi cả nhóm, làm ướt hết | **Lướt Gió** — lướt xa không trúng đòn, để lại lưỡi gió | **Băng Trụ** — cột băng khổng lồ trồi lên, hất và đóng băng | **Gai Đá** — gai đá trồi theo đường thẳng |
| 6 C | **Tường Lửa** — tường lửa chắn đường, quái đi qua bị cháy | **Gọi Mưa** — mây giông trút mưa một vùng, quái trong vùng ướt liên tục | **Phong Bạo** — 3 lưỡi gió toả quạt, đẩy lùi | **Gương Băng** — khiên băng phản đạn 4s | **Tường Đá** — tường đá chắn đạn |
| 7 B | **Tro Tàn** — quái chết lúc đang cháy nổ lan lửa sang quái gần | **Mạch Nguồn** — đứng trong mưa của mình mỗi giây hồi máu + MP | **Mắt Bão** — né tốn ít thể lực 50%, né xong +15% tốc chạy 2s | **Hàn Tâm** — thời gian đóng băng +50% | **Trọng Lực** — đòn Thổ làm chậm 20%; quái đang choáng nhận thêm 20% |
| 8 C | **Thiên Thạch** — thiên thạch rực lửa rơi, nổ vùng lớn | **Lôi Vũ** — sét từ mây đánh từng quái đang ướt | **Vòi Rồng** — lốc khổng lồ đi theo hướng nhắm, cuốn quái | **Mưa Băng** — mũi băng to rơi xuống cả vùng | **Lở Đá** — đá tảng rơi vùng rộng |
| 9 B | **Hoả Thân** — sát thương thiêu đốt +50%, kháng cháy | **Thuỷ Triều Dâng** — hút máu lên 12%; quái ướt nhận thêm 15% từ mọi nguồn | **Gió Loạn** — quái trúng đòn Phong đánh trượt 20% trong 3s | **Vỡ Vụn** — đánh quái đóng băng +40%, băng vỡ nổ vụn trúng quái quanh | **Núi Thiêng** — máu tối đa +15%, đứng yên thì hồi máu |
| 10 C ✦ | **Phượng Hoàng** — phượng lửa bay xuyên màn hình *(sẽ đổi: **Hoả Ngục** — vụ nổ hoả lớn)* | **Đại Hồng Thuỷ** — sóng thần quét ngang màn hình *(sẽ đổi: **Thiên Lôi Đại Vũ** — mưa + sét cả vùng to)* | **Thiên Phong** — bão giáng xuống chỗ nhắm 6s, hút và chém quái *(sẽ đổi: **Chân Không Bạo** — hút vào rồi nổ gió diện rộng)* | **Kỷ Băng Hà** — khối băng rơi xuống chỗ nhắm, nổ băng đóng băng cả vùng | **Sơn Thần** — người khổng lồ đá chiến đấu cùng 10s *(sẽ đổi: **Địa Long Toản** — phóng mũi khoan đá)* |

Kiếm pháp nguyên tố (Kiếm ≥ 5 và nguyên tố ≥ 5, mọi lưu phái): Liệt Hoả Trảm · Thuỷ Long Trảm · Phong Kiếm Cuồng Vũ · Hàn Băng Trảm · Địa Liệt Trảm.

## 4. Ví dụ build ở cấp 40 (47 điểm — tối đa)

| Build | Phân điểm | Chơi thế nào |
|---|---|---|
| Bắc Thần thuần | Kiếm 10 Bắc Thần (29) + Phong 7 (15) + 3 điểm lẻ | Lướt liên tục, Ảnh Bộ chí mạng, Ngàn Bóng |
| Thủy Thần bất tử | Kiếm 10 Thủy Thần (29) + Thuỷ 7 (15) + 3 lẻ | Phủ Thuỷ: phản đòn kèm hút máu, Mặt Hồ Phẳng, Thiên Tĩnh |
| Kiếm Thần Băng | Kiếm 10 Kiếm Thần (29) + Băng 7 (15) + 3 điểm lẻ | Phủ Băng: chém làm chậm → đóng băng → Hàn Băng Trảm, Phán Quyết |
| Pháp sư Thuỷ–Phong | Thuỷ 10 (29) + Phong 5 (8) + Băng 5 (8) + 2 lẻ | Gọi Mưa → Lôi Vũ, Lốc Xoáy gom quái, đứng trong mưa hồi máu |
| Pháp sư Hoả | Hoả 10 (29) + Thổ 7 (15) + 3 lẻ | Sát thương vùng, Dung Nham phá giáp |
| Tạp nham (để so) | 5 nhánh × mốc 4–5 | Nhiều skill vặt, không bị động lớn, không tuyệt kỹ → yếu rõ |

## 5. Hình ảnh cần PixelLab vẽ (ước lượng lượt)

| Hạng mục | Số lượng | Cách vẽ rẻ | Lượt ước |
|---|---|---|---|
| Icon skill + bị động | ~76 (60 + 16 của 2 lưu phái Kiếm thêm, + 5 kiếm pháp) | Tấm 3×3 icon cùng nét (như I1) rồi cắt | ~8 tấm × 6 ≈ **48** |
| VFX skill chủ động | 31 skill mới | Dùng lại + nhuộm màu atlas đang có cho skill thường; vẽ mới cho mốc 5/10 và Thổ | ~15 hiệu ứng mới × 2–5 ≈ **50** |
| Động tác nhân vật | lướt (Đột Kích), xoay (Xoáy Kiếm), dậm đất | `animimg` từ ảnh xoay, 3 hướng × 2 giới tính | ~18–36 |
| Sơn Thần (triệu hồi) | 1 nhân vật | Pro Flash | ~10 |

Tổng ~130–150 lượt ≈ 2–3 tuần lượt miễn phí của các token → **phải chia giai đoạn** (mục 7).
**Luật mới (chủ dự án, 07/10/2026): "làm trước, sau có asset thì thay vào".** Skill chưa có hình PixelLab riêng vẫn làm và mở
cho người chơi, dùng TẠM hình PixelLab đã có (VFX atlas nhuộm màu/phóng to, icon nhánh…); danh sách chỗ dùng tạm ghi ở bảng
`TEMP_ART` trong code để khi có bản PixelLab thì thay. Vẫn không tự vẽ art bằng CSS/SVG/emoji.

## 5b. Hiệu ứng "hầm hố" (người chơi dặn 07/10/2026: đẹp quan trọng hơn nhanh)

Skill lớn vẽ bằng **Pro Flash khổ 128–160px** (khung đầu) + `animate_image` 8–10 khung, mỗi cái ~8–10 lượt; duyệt bằng mắt,
xấu thì vẽ lại. Đã khai trong pipeline (`vfx/buildVfx.ts` + `vfx/pixellabVfx.ts`) và xếp lịch vẽ:

| Hiệu ứng | Dùng cho | Trạng thái |
|---|---|---|
| `ice_pillar` | Băng Trụ (Băng 5) | đang xếp lịch (token 14) |
| `lightning_strike` | Lôi Vũ (Thuỷ 8) | đang xếp lịch (token 14) |
| `tornado` | Lốc Xoáy (Phong 3) / Vòi Rồng (Phong 8, phóng to) | đang xếp lịch (token 9) |
| `rain_cloud` | Gọi Mưa (Thuỷ 6) + nền mây của Lôi Vũ | đang xếp lịch (token 13) |
| `ice_rain` | Mưa Băng (Băng 8) | chờ lượt |
| `meteor` | Thiên Thạch (Hoả 8) | chờ lượt |
| `rock_spikes` | Gai Đá (Thổ 5) | chờ lượt |
| (sau) | Kỷ Băng Hà, Phượng Hoàng, Phán Quyết / Thiên Tĩnh / Ngàn Bóng, Đại Hồng Thuỷ, Sơn Thần — tuyệt kỹ mốc 10 | GĐ4 |

Combo đúng ý người chơi: **Gọi Mưa → Lôi Vũ** (mưa làm ướt cả vùng, sét ưu tiên đánh quái ướt); **Gọi Mưa → Mưa Băng / Băng Trụ**
(ướt + băng = Đóng Băng hàng loạt).

## 6. Thay đổi kỹ thuật

- **Dữ liệu skill hoá:** `skills.ts` thành bảng dữ liệu (nhánh, mốc, loại, số liệu). `CombatSystem` cần thêm các **kiểu đòn mới**:
  vùng quanh mình, vùng tại điểm nhắm, đường thẳng, lướt/dịch chuyển, khiên/bùa, tường (vật cản tạm), hút, vùng tồn tại
  (bão tuyết, tường lửa), triệu hồi. Trạng thái mới: choáng, phá giáp, đánh trượt, chậm nặng.
- **Bị động:** một lớp "chỉ số dẫn xuất" tính từ mốc (tốc đánh, chí mạng, phòng thủ, hồi MP…) — HUD/bảng Nhân vật đọc ra.
- **`talents.ts`:** đổi từ "bậc theo skill" sang "mốc theo nhánh" + bảng giá mốc + danh sách skill đã học + phủ phép đang chọn.
- **Bản lưu:** `SaveData.talents` cũ (điểm theo skill) → **hoàn lại toàn bộ điểm** khi nạp (tẩy điểm miễn phí một lần) + toast
  báo "Hệ tiềm năng mới — hãy cộng lại điểm". Thêm `loadout` (6 ô) và `enchant`.
- **Giao diện:** bảng Tiềm năng thành **6 cây dọc** (mỗi cây 10 nấc, nấc đã học sáng, nấc kế tiếp hiện giá), chọn phủ phép,
  phần gán skill vào ô; thanh kỹ năng đọc theo `loadout`.
- **Cốt truyện:** thêm nhiệm vụ mở **Thổ** ở tuổi 16 (vd người gác mỏ đá / hầm mộ Nghĩa địa — đất của người chết).
- **Máy chủ:** không đổi (lưu `story` dạng blob).

## 7. Giai đoạn triển khai

| GĐ | Nội dung | Art cần | Kết quả người chơi thấy |
|---|---|---|---|
| **1** ✔ | Khung mới: cây 6 nhánh, giá mốc, thưởng chiều sâu, bản lưu mới + hoàn điểm, thanh 10 ô + gán skill, bảng cây mới. Mốc 1 (5 skill có sẵn + Đá Văng) và **mốc 2, 4 (bị động, không cần VFX)**. Phủ phép Kiếm (cần nguyên tố mốc 5 — tới GĐ2 mới có skill mốc 5 nhưng phủ phép chạy được ngay). Nhiệm vụ mở Thổ. | Icon Đá Văng + 12 icon bị động + VFX đá (~1 tấm icon ×2, ~5 lượt VFX) | Cộng điểm vào nguyên tố, chọn phủ phép, build bắt đầu khác nhau |
| **1.5** ✔ | Kiếm 3 lưu phái: chọn lưu phái ở mốc 3 (lưu `swordStyle`), bị động mốc 4 theo lưu phái (Mắt Tinh / Tâm Tĩnh / Nhẹ Như Gió); Bộ Pháp → Nhịp Chém; Thuỷ mốc 2 thêm làm chậm 10%; Thuỷ mốc 4 Dòng Chảy → **Huyết Thuỷ** (hút máu) | Không | Chọn lưu phái Kiếm, Thuỷ hút máu |
| **2** ✔ | Mốc 3 và 5 của 6 nhánh (Kiếm: 3 lưu phái × 2 = 6 skill) + 4 phản ứng Thổ + Kiếm pháp nguyên tố (5) — hình TẠM, chờ PixelLab | ~17 icon, ~8 VFX, động tác lướt/xoay | Đủ bộ để đánh vùng mới tuổi 16 |
| **3** ✔ | Mốc 6–9 (16 chủ động + 16 bị động: 5 nguyên tố × 2 + 3 lưu phái Kiếm × 2) — lượt A ✔ 5 nguyên tố; lượt B ✔ Kiếm 3 lưu phái | ~32 icon, ~8 VFX | Build trung cấp |
| **4** | Mốc 10 (6 tuyệt kỹ) + skill hợp nhất 2 hệ (10) | VFX lớn, Sơn Thần | Mục tiêu dài hạn |

Mỗi giai đoạn có test thuần (giá mốc, hoàn điểm, phủ phép, phản ứng mới) như `tests/talents.test.ts` hiện tại.

### GĐ1 — ĐÃ LÀM (07/10/2026)

Đã có: cây 6 nhánh × 10 mốc (dữ liệu `talents.TREE`, mốc chưa làm hiện "Sắp có", không cộng vượt mốc cao nhất đã hiện
thực = mốc 4), giá mốc, thưởng chiều sâu +4%/mốc, phản ứng +5%/mốc, bỏ phạt tạp nham, Tia Aether theo cấp, **Suối Lành =
Thuỷ mốc 3**, **bị động mốc 2 + 4** của Kiếm/Hoả/Thuỷ/Phong/Băng (số liệu `talents.PASSIVE`), phủ phép Kiếm (logic + chỗ
chọn; chưa ai đạt vì cần nguyên tố mốc 5), thanh 10 ô gán tự do (bàn phím + cảm ứng), bản lưu mới (`talentsV`, `loadout`,
`enchant`) + hoàn điểm bản lưu cũ một lần, bảng Tiềm năng dạng cây.

Hoãn sang GĐ2 (khác bảng trên): **Thổ** — có trên cây nhưng khoá ("Mở ở cốt truyện tuổi 16 — sắp có"); chưa viết nhiệm vụ,
chưa có Đá Văng vì chưa có hình PixelLab (icon/VFX) — luật dự án: code không tự vẽ. Icon bị động dùng tạm icon kỹ năng
mốc 1 của nhánh + dấu "BĐ" tới khi có tấm icon PixelLab.

### GĐ2 lượt A — ĐÃ LÀM (07/10/2026)

Theo luật mới "làm trước, có asset thì thay": mọi hình chưa có bản PixelLab dùng TẠM hình atlas có sẵn, gom ở **một bảng**
`apps/web/src/game/combat/tempArt.ts` (`TEMP_ART`: kỹ năng/phản ứng → các lớp hình tạm → id PixelLab sẽ thay → cần vẽ gì).
Atlas có id PixelLab (`ice_pillar`, `tornado`, `rock_spikes`…) thì CombatSystem + icon TỰ dùng bản đó, không sửa code.

- **Khung kiểu đòn** (dữ liệu trong `skills.ts`, luật thuần `skillRules.ts`): `aoe_self` · `aoe_target` (có `lob` = cầu bay
  tới rồi nổ) · `cone` · `line` (gai trồi nối đuôi) · `dash` (i-frame, `trail` = vệt chém dọc đường lướt) · `pillar` (vòng
  báo → trồi) · `zone` (tồn tại, nhịp, hút). Vùng mặt đất là elip dẹt 0,62. Đòn nhắm điểm: chuột = điểm con trỏ (kẹp theo
  tầm); cảm ứng / chỉ bàn phím = trước mặt theo hướng nhìn ở `aimDist`.
- **Trạng thái mới trên quái**: choáng, hất (sprite bay parabol), phá giáp (giáp −50% + nhận +15%), trượt (Bão Cát 40%),
  chậm nặng (lấy mức chậm nhất, không nhân chồng), đẩy lùi (trượt qua `mover`, không xuyên tường). Boss: khống chế ½ thời
  lượng, không bị đẩy/hút; phá giáp + trượt đủ thời lượng (là suy yếu, không phải khống chế).
- **Skill mốc 3 / 5**: Vòng Lửa, Bộc Hoả · (Suối Lành), Sóng Dữ · Lốc Xoáy, Lướt Gió · Băng Địa, Băng Trụ. **Thổ**: Đá Văng
  (1), Đá Nặng (2), Địa Chấn (3), Da Đá (4), Gai Đá (5). Trần cộng điểm: 5 nguyên tố → **mốc 5**; **Kiếm giữ mốc 2** tới khi
  có 3 lưu phái (mốc 3 = chọn lưu phái — lượt B), nên Kiếm Tâm/Mắt Tinh mốc 4 tạm chưa đạt được.
- **Thổ** bỏ khoá cứng: mở khi cốt truyện trao mã `earth` (lượt B viết nhiệm vụ). Tới lúc đó chỉ mở bằng lệnh dev
  `__aether.unlock('earth')`; lưới an toàn tuổi 16 KHÔNG trao Thổ. Thử skill mốc cao không đụng bản lưu: `__aether.tryTiers({ fire: 5 })`.
- **4 phản ứng Thổ** (`skillRules.EARTH`): đòn Thổ để lại "bụi đất" 4s để hệ đánh sau cũng gây phản ứng. Bùn Lầy (×1,2,
  chậm còn 30% 3s), Dung Nham (×1,3, cháy lại ×2 sát thương mỗi nhịp + phá giáp 4s), Bão Cát (×1,15, quái trượt 40% 3s),
  Vỡ Vụn (Thổ đánh mục tiêu ĐANG đóng băng: ×2,2, hết đóng băng). Thưởng +5%/mốc hệ yếu như cũ.
- **GĐ1.5 phần bị động**: Thấm Sâu (Thuỷ 2, + quái ướt chậm 10%), Huyết Thuỷ (Thuỷ 4, đòn Thuỷ hút 5% máu, số xanh nhỏ —
  thay Dòng Chảy hồi MP), Nhịp Chém (Kiếm 2, giữ số). Phần lưu phái Kiếm để lượt B.
- **Phủ Thổ**: mọi nhát chém phá giáp 4s; nhát thứ 3 liên tiếp choáng 0,5s (bảng 2.3 ghi mốc 7 — GĐ2 trần mốc 5 nên kéo về
  mốc 5, hằng `ENCHANT_EARTH_STUN_TIER`).
- Test: `tests/elements.test.ts` (hình học, trạng thái, 10 skill trong trận, 4 phản ứng, bị động, phủ Thổ, TEMP_ART trỏ đúng
  atlas + pipeline) + cập nhật `talents.test.ts`.

Còn lại cho **lượt B**: 3 lưu phái Kiếm (mốc 3–5), Kiếm pháp nguyên tố (5), nhiệm vụ mở Thổ tuổi 16 — ĐÃ LÀM, xem dưới.

### GĐ2 lượt B — ĐÃ LÀM (07/10/2026)

**Kiếm 3 lưu phái** (`talents.STYLE_TREE`, `SWORD_STYLE_INFO`; lưu `SaveData.swordStyle`). Mốc 1–2 chung; lần đầu lên mốc 3 phải
chọn lưu phái — `StoryDirector.spendTalent(branch, level, style)` từ chối mốc 3 thiếu lưu phái, bảng Tiềm năng có 3 hàng lưu phái
(lối chơi + phủ phép hợp + mốc 3–10, nút "Chọn"); đã chọn thì lưu phái đó sáng, hai cái kia mờ + "Tẩy điểm để đổi lưu phái".
Tẩy điểm xoá `swordStyle`. Trần Kiếm lên **mốc 5**; mốc 6–10 của từng lưu phái "Sắp có" đúng bảng 3.1. Kỹ năng lưu phái chỉ học
được khi đúng lưu phái (`knowsSkill(…, style)`), bị động mốc 4 theo lưu phái (`passiveEffects(tiers, style)`).

| Lưu phái | Mốc 3 | Mốc 4 (bị động) | Mốc 5 ★ |
|---|---|---|---|
| Kiếm Thần | **Nhất Kích** — dồn lực 0,3s (đứng im, tia sáng tụ; né được → hoàn MP + hồi chiêu) rồi chém ×2,8, tầm 96, góc 120°, đẩy 55, +15% chí mạng · 8 MP · hồi 4,5s | **Mắt Tinh** chí mạng +8% (= Kiếm Tâm GĐ1) | **Đột Kích** — lướt 220 (miễn thương 0,15s) rồi vệt chém xuyên mọi quái dọc đường ×2,4, rộng 80, +10% chí mạng · 14 MP · hồi 6s |
| Thủy Thần | **Thế Tĩnh** — giữ thế 1,5s: cận chiến bị CHẶN + PHẢN ×1,4 (mỗi đòn), đạn / đòn vùng còn 40% · 8 MP · hồi 6s | **Tâm Tĩnh** đứng yên ≥ 0,3s hoặc đang giữ thế: nhận −15% | **Lưu Thủy Phản** — cửa sổ đỡ 0,6s (vòng báo co đúng hết cửa sổ + nhân vật nhấp nháy xanh + chữ "Thế đỡ!"): hoá giải MỘT đòn (cả đạn — hất ngược về kẻ bắn) rồi phản ×2,8 = gấp đôi Thế Tĩnh, miễn thương 0,4s · 12 MP · hồi 7s |
| Bắc Thần | **Lướt Chém** — lướt 140 chém mọi quái đi qua (tầm 44) ×1,6, miễn thương 0,3s (phủ hết quãng lướt 0,18s) · 6 MP · hồi 3s | **Nhẹ Như Gió** tốc chạy +10% (nhân chồng Thuận Gió), né tốn 17,5 thay 25 thể lực | **Ảnh Bộ** — ra sau lưng mục tiêu gần hướng nhắm nhất (tầm 260, nón ±60°, cách lưng 34px / boss 44px, đi từng bước qua `mover` nên không xuyên tường) rồi chém ×2, chắc chắn chí mạng (×1,75), miễn thương 0,35s · 14 MP · hồi 6s; không có mục tiêu thì không tung (không mất MP) |

- **Cơ chế đỡ / phản** (`skillRules.guardOutcome` + `CombatSystem.incoming`): mọi đòn quái vào người chơi (chém — `strike`, đạn —
  va chạm đạn, đòn vùng — vòng báo của boss) đi qua `incoming`. Đang giữ thế: Thế Tĩnh chặn + phản mọi đòn cận chiến (không tan),
  đạn / đòn vùng chỉ giảm (×0,4); Lưu Thủy Phản hoá giải đòn đầu tiên (chém hoặc đạn) rồi tan; đòn vùng chỉ giảm. Nhát phản tính
  sát thương lúc vào thế (hệ số, con đường, **phủ phép** → phủ Thuỷ phản kèm hút máu), phát động tác attack sẵn có không khoá
  người chơi. Đang giữ thế / dồn lực thì đứng im (`combat.rooted`); né, bấm đòn khác (không tính giữ phím lặp), bị ngắt, gục → thôi.
- **Chuyển bản lưu**: Kiếm ≥ mốc 3 mà thiếu `swordStyle` (bản lưu production GĐ1, trần Kiếm mốc 4) → tự gán **Kiếm Thần**
  (`StoryDirector.styleMigrated`), Game toast một lần rồi lưu. Bản lưu dev bị lượt A kẹp về mốc 2 thì không gán. Mã lạ bỏ; Kiếm
  dưới mốc 3 thì không giữ lưu phái.
- **Kiếm pháp nguyên tố** (`talents.SWORD_ARTS`, Kiếm ≥ 5 + nguyên tố ≥ 5, mọi lưu phái): đòn kiếm mang hệ (`blade` — hệ số con
  đường KIẾM, Nhịp Chém; KHÔNG ăn phủ phép), thưởng chiều sâu theo nhánh yếu hơn. Khu riêng trên bảng Tiềm năng (điều kiện, đủ/chưa
  từng nhánh, đã học); học xong tự lên ô trống + toast "Lĩnh ngộ kiếm pháp".

  | Kiếm pháp | Kiểu | Số liệu |
  |---|---|---|
  | Liệt Hoả Trảm | nón 90°, dài 150 | ×2,6, đẩy 30, gây cháy · 18 MP · hồi 7s |
  | Thuỷ Long Trảm | đường thẳng 260, rộng 60 | ×2,4, đẩy 40, làm ướt, **hút máu 15%** (cộng Huyết Thuỷ) · 18 MP · hồi 7s |
  | Phong Kiếm Cuồng Vũ | vùng **bám người** bán kính 100, 2,4s, 8 nhịp | ×0,36/nhịp (2,9 tổng), lưỡi gió xoay quanh mỗi nhịp · 20 MP · hồi 9s |
  | Hàn Băng Trảm | chém tầm 104, góc 140° | ×2,6, mục tiêu **đang lạnh** → đóng băng 1,6s (ướt → Đóng Băng như cũ) · 18 MP · hồi 7s |
  | Địa Liệt Trảm | gai đá theo đường 280 | ×2,5, choáng 0,8s (× Đá Nặng), bụi đất · 18 MP · hồi 8s |

- **Nhiệm vụ mở Thổ** (`youth.ts`, viết tay): `y1b_grave_stele` "Sợi tơ màu đất" tự nhận ngay sau "Nấm Ánh Lam" — Mirelle nhờ xem
  tấm bia đá cổ ở đầu lối vào Nghĩa địa Hoàng Hôn (mộ nứt, người chết không nằm yên); nói với bia đá (`gy_stele`: không sprite,
  hình là đồ vật `rune_stone` có sẵn + quả cầu sáng, đứng trên đường đất từ cổng nam, cách tầm phát hiện của bầy xác sống gần nhất
  ≥ 147px, xa hang Vua Lich) → độc thoại thấy sợi màu nâu chạy dưới chân như rễ cây, vài sợi bị giật lỏng "như dây cáp rút vội
  khỏi máy", nhớ kiếp trước chưa từng về giỗ ông, đứng yên chờ sợi đất "nắm tay" → thưởng **`unlockSkill: 'earth'`** (Đá Văng).
  Rồi `y1c_stone_dummy` "Đá cho Ông Rơm": thử Đá Văng 3 lần vào hình nộm sân sau, mẹ nhận báo (+1 bình) và nhắc sang Aldric. Hai
  nhiệm vụ **0 EXP** (thưởng là nhánh Thổ + bình) để giữ nhịp cấp đã cân (boss.test: trước Quỷ vương cấp 3 sát cấp 4 — từ
  09/10/2026 EXP nấm ×1,2 nên vừa qua mốc cấp 4). Bản lưu đã qua chỗ này được `migrate` tính là xong + bù `earth` (`StoryDirector.granted` → Game đặt Đá Văng lên ô + toast một lần).
  `Game` thêm `NpcDef.prop` (vật thể làm hình) và gợi ý "Xem …" thay "Nói chuyện với …" cho vật thể.
- **Hình tạm làm lại**: Băng Trụ — sương / băng vỡ chuyển xuống lớp đất, cột = 3 mũi băng kéo dài theo trục (giữa 125×54, hai bên
  nghiêng) phát sau cùng, giữ 0,8s; Lốc Xoáy — phễu 4 tầng `wind_spin` hẹp → rộng, mỗi tầng một nhịp quay + bụi cuốn chân + hơi gió.
  Vẫn tự dùng `ice_pillar` / `tornado` khi atlas có.
- **TEMP_ART** thêm 11 hàng (6 kỹ năng lưu phái + 5 kiếm pháp; trường mới `charge` = hình dồn lực / thế đỡ / bóng để lại, lớp có
  `dx`, `hold`, `loop`, `fit`). Động tác chưa có (dồn lực, giữ thế, lướt, ảnh bộ, xoay kiếm) ghi ở cột `todo` — đang dùng attack sẵn
  có + dời sprite / nhuộm / alpha. Địa Liệt Trảm tự dùng `rock_spikes` khi có.
- Lệnh dev: `__aether.tryTiers({ sword: 5, water: 5 }, 'thuy_than')`, `__aether.skillIndex('shadow_step')`.
- Test: `tests/swordstyles.test.ts` (mới — luật thuần, đỡ/phản, Tâm Tĩnh, i-frame, Nhẹ Như Gió, Ảnh Bộ, dồn lực, Đột Kích, 5 kiếm
  pháp, hình Băng Trụ / Lốc Xoáy), `talents.test.ts` (chọn / tẩy / chuyển lưu phái, kiếm pháp), `story.test.ts` (nhiệm vụ Thổ,
  chỗ đứng an toàn, bù `earth`), `elements.test.ts` (trần mốc 5).

Còn lại: GĐ3 (mốc 6–9), GĐ4 (tuyệt kỹ + hợp nhất 2 hệ); art PixelLab cho mọi hàng `TEMP_ART`.

### GĐ3 lượt A — ĐÃ LÀM (07/10/2026): mốc 6–9 của 5 nguyên tố

Trần cộng điểm: 5 nguyên tố → **mốc 9** (mốc 10 tuyệt kỹ — GĐ4); **Kiếm giữ mốc 5** (mốc 6+ của 3 lưu phái là lượt B). Số liệu ở
`skills.ts` (chỉ số 28–37, nối cuối) + `talents.PASSIVE`; mô tả nấc / tooltip sinh từ số liệu (`skills.powerText`, `estimateText`).
Kỹ năng học xong tự lên ô trống của thanh 10 ô như cũ.

| Kỹ năng | Kiểu | Số liệu (uy lực × ATK × hệ số phép × thưởng chiều sâu) |
|---|---|---|
| Hoả 6 · Tường Lửa | `wall` + `tick` | tường dài 160 tại chỗ nhắm (tầm 240), vuông góc hướng nhắm, đứng 5s; chặn quái + đạn quái; quái áp sát bị đốt 10 nhịp × 0,25 (+ cháy) · 18 MP · hồi 10s |
| Hoả 8 · Thiên Thạch | `aoe_target` + `fall` | rơi sau 0,8s (vòng báo + cầu lửa rơi chéo), bán kính 150, ×3,6, đẩy 60, cháy · 34 MP · hồi 15s |
| Thuỷ 6 · Gọi Mưa | `zone` + `rain` | mưa 6s, bán kính 130 (tầm 280): mỗi 0,5s làm ướt đầy mọi quái trong vùng, không sát thương, không phản ứng · 16 MP · hồi 12s |
| Thuỷ 8 · Lôi Vũ | `zone` + `bolts` | mây sét 3s, bán kính 170 (tầm 320), 6 nhịp × 2 tia (**4 tia nếu tâm mây nằm trong Gọi Mưa của mình**) × 0,6; mỗi quái tối đa 1 tia / nhịp, chọn quái **ít bị mây này đánh trước** → cùng số lần thì **quái ướt trước** → gần tâm trước (sửa sau review: trước đây CHỈ đánh quái ướt nên dùng một mình lên bầy khô thì 6 nhịp dồn vào một con) · 30 MP · hồi 14s |
| Phong 6 · Phong Bạo | `projectile` + `count` | 3 lưỡi toả quạt 36°, xa 300, xuyên, ×1,2 mỗi lưỡi, đẩy 55 · 18 MP · hồi 7s |
| Phong 8 · Vòi Rồng | `zone` + `move` | lốc bán kính 80 sinh trước mặt, đi theo hướng nhắm 110px/s × 3,5s (385px), hút 170px/s (cuốn quái theo, không cuốn boss), 10 nhịp × 0,34 · 30 MP · hồi 14s |
| Băng 6 · Gương Băng | `ward` | khiên 4s, bán kính 46 quanh ngực: đạn quái chạm khiên bay ngược về kẻ bắn thành mũi băng ×1,6 (làm lạnh) · 16 MP · hồi 12s |
| Băng 8 · Mưa Băng | `barrage` | 20 mũi rơi rải 1,8s khắp vùng 150 (tầm 320), mỗi mũi rơi 0,3s, nổ bán kính 48, ×0,9 (một quái ăn ~3,4 mũi) · 32 MP · hồi 15s |
| Thổ 6 · Tường Đá | `wall` | tường dài 200 (tầm 220), đứng 7s; chặn quái + đạn; đá trồi ×1,1 + hất 40 (× Đá Nặng) quái đứng trên tường sang hai bên · 18 MP · hồi 12s |
| Thổ 8 · Lở Đá | `barrage` | 12 tảng rơi rải 1,5s khắp vùng 160, mỗi tảng nổ bán kính 58, ×1,2 + choáng 0,5s (× Đá Nặng) · 32 MP · hồi 15s |

| Bị động | Hiệu ứng |
|---|---|
| Hoả 7 · Tro Tàn | quái chết lúc đang cháy (kể cả chết vì nhịp cháy, kể cả nhát kết liễu dập lửa — Hơi Nước / Tan Chảy / Bùng Lửa) → sau 0,12s nổ lửa bán kính 85, ×1 sức phép × thưởng Hoả; lửa của vụ nổ mang đợt của nó (`Fighter.emberDepth`), quái bén lửa đó chết (ngay hay vì nhịp cháy về sau) thì nổ đợt kế — **tối đa 4 đợt** dây chuyền |
| Hoả 9 · Hoả Thân | nhịp cháy (cả Dung Nham) ×1,5; **kháng cháy chỉ là cờ** (`PassiveEffects.fireResist`, `CombatSystem.fireResist`) — quái hiện chưa đốt được người chơi |
| Thuỷ 7 · Mạch Nguồn | đứng trong Gọi Mưa của mình: mỗi giây +3% máu tối đa + 4 MP |
| Thuỷ 9 · Thuỷ Triều Dâng | hút máu đòn Thuỷ 12% (thay 5% Huyết Thuỷ); quái đang ướt nhận ×1,15 từ mọi nguồn (đòn, nhịp cháy, Bùng Lửa) |
| Phong 7 · Mắt Bão | né tốn ×0,5 thể lực (có cả Nhẹ Như Gió: lấy mức rẻ hơn = ×0,5, **không nhân chồng**); né xong tốc chạy ×1,15 trong 2s |
| Phong 9 · Gió Loạn | đòn hệ Phong (cả kiếm phủ Phong): quái đánh trượt 20% trong 3s (boss đủ thời gian); dính cả Bão Cát thì lấy 40% |
| Băng 7 · Hàn Tâm | đóng băng ×1,5 (phản ứng Đóng Băng, Băng Trụ, Hàn Băng Trảm; boss vẫn ½) |
| Băng 9 · Vỡ Vụn | đánh quái đang đóng băng ×1,4; khi băng trên quái **tan / vỡ** (hết giờ, Tan Chảy, Vỡ Vụn của Thổ, quái chết — kể cả khi chính nhát phá băng là nhát kết liễu) thì nổ vụn băng bán kính 80, ×0,6 sức phép, hệ Băng (ướt → Đóng Băng tiếp, nhưng **lan tối đa 1 đợt**: quái bị vụn băng đóng băng thì vụn của nó chỉ làm lạnh — `PASSIVE.shardChain`) |
| Thổ 7 · Trọng Lực | đòn hệ Thổ làm chậm còn 80% 2s (không đè Bùn Lầy; boss ½); quái đang choáng nhận ×1,2 từ mọi đòn |
| Thổ 9 · Núi Thiêng | máu tối đa ×1,15 (`applyLevel` — HUD / bảng Nhân vật đọc thẳng `hpMax`; cộng mốc không hồi đầy); đứng yên ≥ 1s: mỗi giây +2% máu tối đa |

- **Cơ chế mới** (`skillRules` thuần + `CombatSystem`): tường tạm (`wallEnds` vuông góc hướng nhắm TRÊN MẶT ĐẤT, `wallClip` —
  bước đi của quái lấn vào dải tường thì bỏ phần vuông góc (chỉ là va chạm: tự nó KHÔNG đưa quái vòng tường), đường vòng
  `wallBlocks` + `detourSide` + `detourWaypoint` — quái đang đuổi bị tường chắn thì đi tới góc đầu tường phía mình rồi góc phía
  người chơi (sửa sau review), `wallBetween` — đạn quái xét theo chân đường bay, nhát chém của quái qua tường không trúng, tường
  chắn thì quái không lấy đà đánh). Mọi dời quái (đuổi, đẩy, hút, giật lùi, cả đi lang thang — `wanderMover`) qua tường tạm.
  Tường KHÔNG chặn người chơi và đạn của người chơi — **cố ý**: tường là công cụ câu giờ (quái phải đi vòng ~3–5s), không phải
  lô cốt. Khiên phản đạn (`PlayerCombat.ward`; đạn quái mang `owner` + `lift`). Vùng
  mưa "của mình" (`Zone.rain`) — Mạch Nguồn và Lôi Vũ đọc. Sét chọn quái ướt (`pickBolts`, `Zone.struck`). Vùng đi theo hướng
  (`Zone.vx/vy`, hình bám vùng). Mưa nhiều điểm (`barrage` + `scatterPoints` cố định, vật rơi là đạn "ma"). Nổ dây chuyền
  (`queueEmber` + độ sâu `emberChain`). Trạng thái mới trên quái: `daze` (Gió Loạn), `iced` (Vỡ Vụn).
- **TEMP_ART** thêm 15 hàng: 10 kỹ năng + `ember_burst`, `shatter_burst`, `spring_heal`, `mountain_heal`, `eye_haste`. Trường mới:
  lớp `stay` (phát một lượt rồi đứng ở frame cuối — `Vfx` hỗ trợ), phần `tick` (hình mỗi nhịp). Mây = frame cuối của `steam` nhuộm
  xám; khối đá = `steam` nhuộm nâu kéo cao; tia sét = `light_pillar` nhuộm xanh; Vòi Rồng = phễu Lốc Xoáy phóng to. Tự dùng bản
  PixelLab khi atlas có: `meteor`, `rain_cloud` (Gọi Mưa + nền mây Lôi Vũ), `lightning_strike`, `tornado` (×2), `ice_rain` (mỗi mũi thứ 3).
- **Chưa làm** (ghi để lượt sau): hiệu ứng phủ phép theo mốc 7 / mốc 10 nguyên tố (bảng 2.3) — `ENCHANT_EARTH_STUN_TIER` giữ mốc 5.
- Test: `tests/tiers69.test.ts` (mới) + cập nhật trần ở `elements.test.ts`, `talents.test.ts`.

### GĐ3 lượt B — ĐÃ LÀM (07/10/2026): mốc 6–9 của 3 lưu phái Kiếm

Trần cộng điểm: **mọi nhánh mốc 9** (`tierCap` = 9 cho cả Kiếm — ba lưu phái đều đủ mốc 3–9 nên nấc gộp `styleCombined` sáng); mốc 10
(tuyệt kỹ) vẫn "Sắp có" — GĐ4. Số liệu ở `skills.ts` (chỉ số 38–43, nối cuối) + `talents.PASSIVE`; mô tả nấc / tooltip sinh từ số
liệu như lượt A. Mọi kỹ năng là **đòn thép** (ăn phủ phép, Nhịp Chém, hệ số kiếm của con đường), động tác `attack` sẵn có.

| Kỹ năng | Kiểu | Số liệu (uy lực × sức kiếm × thưởng chiều sâu) |
|---|---|---|
| Kiếm Thần 6 · Phá Giáp | `melee` + `hit.armor/sunder` | chém tầm 92, góc 120°, ×2,4, đẩy 25, **phá giáp 6s** (phủ Thổ không làm ngắn đi); quái ĐANG bị phá giáp → **vỡ giáp** 6s (nhận thêm ×1,15) · 10 MP · hồi **6s** (÷1,1 = 5,45s < 6s: tung lại đúng lúc hết hồi chiêu là tự vỡ giáp — sửa sau review, trước đây hồi 7s) |
| Kiếm Thần 8 · Lưỡi Sóng | `projectile` thép | luồng kiếm bay 440, xuyên, nửa bề ngang trúng 30 (đạn thường 20), ×3,0; phủ phép thì mang hệ (hình nhuộm màu hệ) · 18 MP · hồi 8s |
| Thủy Thần 6 · Dòng Chảy Ngược | `ward` thép | gạt đạn 2,5s, bán kính 56: đạn quái chạm vào bị chém bay ngược về kẻ bắn ×2,0 (mang hệ phủ phép); không đứng im · 10 MP · hồi 8s |
| Thủy Thần 8 · Xoáy Nước | `spin` + `range` + `afterGuard` | xoáy chém tại chỗ nhắm (tầm 300; trước 11/10/2026: quanh mình) bán kính 110, ×1,9, đẩy 60; trong 2,5s sau một lần đỡ / gạt / phản: ×1,8 (≈3,4) + đẩy ×1,5, dùng hết cửa sổ · 14 MP · hồi 8s |
| Bắc Thần 6 · Liên Hoàn | `melee` + `count` | 4 nhát cách 0,09s (xong trong 0,27s), tầm 80, góc 130°, ×0,8 mỗi nhát (3,2) — mỗi nhát tính riêng (phủ Thổ: nhát 3 choáng) · 10 MP · hồi 5s |
| Bắc Thần 8 · Phi Kiếm | `projectile` + `returns` | kiếm bay 320, xuyên, rồi bay VỀ TAY (đuổi theo người chơi, bắt lại trong 24px, tối đa 2,5s); ×1,8 mỗi lượt — mỗi chiều trúng mỗi quái đúng một lần · 18 MP · hồi 8s |

| Bị động | Hiệu ứng |
|---|---|
| Kiếm Thần 7 · Thế Áp Đảo | mỗi NHÁT Kiếm trúng liên tiếp +5% sát thương mọi đòn Kiếm (kể cả kiếm pháp; phép thì không), tối đa 5 lần (+25%). "Nhát" = chém / chuỗi chém / xoay chém / vệt lướt chém / đạn kiếm trúng lần đầu. Một nhát chém hụt hẳn hoặc 3 giây không trúng → về 0. Đủ 5 lần: chữ "Áp Đảo!" |
| Kiếm Thần 9 · Bất Khuất | máu dưới 30%: mọi đòn ×1,2 + hút máu 5% mọi sát thương gây ra (cộng Huyết Thuỷ…); xét lúc khung chạm. Bảng Nhân vật: Tấn công / Phép thuật hiện số đã cộng + ghi chú "Bất Khuất" |
| Thủy Thần 7 · Phản Đòn | **né đúng lúc** = đòn quái chạm trong **0,12s** sau khi bấm né (`skillRules.COUNTER.perfect`; sửa sau review từ 0,3s — 0,3s ≈ đà đánh 0,3s ≈ i-frame 0,32s nên cú né nào gặp đòn cũng "đúng lúc"; trúng ngoài cửa sổ mà còn i-frame thì vẫn không mất máu, chỉ không phản); lăn ra khỏi tầm vẫn tính nếu chỗ vừa đứng còn trong tầm; mỗi cú né phản MỘT lần → tự chém trả kẻ đánh ×1,6 sức kiếm (mang hệ phủ phép) hoặc hất đạn ngược về kẻ bắn — **chắc chắn chí mạng**. **Đỡ đúng lúc**: Lưu Thủy Phản (cả cửa sổ 0,6s vốn ngắn), Thế Tĩnh trong 0,12s đầu → nhát phản chắc chắn chí mạng |
| Thủy Thần 9 · Mặt Hồ Phẳng | mỗi lần phản đòn thành công (chặn-phản Thế Tĩnh, đỡ-phản Lưu Thủy Phản, gạt đạn Dòng Chảy Ngược, né đúng lúc) hồi 5% máu tối đa — **hồi nội 1s** (`PASSIVE.lakeCooldown`, sửa sau review: loạt 3 viên của boss gạt cùng lúc / bầy chém dồn vào thế đỡ chỉ hồi một lần) |
| Bắc Thần 7 · Đà Lướt | né xong, 3 đòn Kiếm kế (trong 3s sau cú lăn) nhanh hơn 25%: hồi chiêu ÷1,25 (HUD thấy hồi chiêu ngắn lại đúng lúc đó) + động tác ÷1,25 |
| Bắc Thần 9 · Bóng Mờ | mỗi đòn đánh vào (chém, đạn, đòn vùng) 15% bị né hoàn toàn — xét SAU thế đỡ (đòn đã bị gạt còn 40% vẫn có thể né nốt); chỉ tung xúc xắc khi có bị động. Bảng Nhân vật thêm ô "Né hoàn toàn 15%" |

- **Phá Giáp khác bảng 3.1** ("địch −30% phòng thủ"): giáp quái chỉ 1–8 nên trừ % giáp gần như không thấy — dùng lại trạng thái
  **phá giáp chung** của GĐ2 (giáp −50% + nhận +15%) trong 6s. Thêm **vỡ giáp** (`Fighter.sunder`, `skillRules.SUNDER_TAKEN`) khi đánh
  quái đang bị phá giáp (Dung Nham, kiếm phủ Thổ, Phá Giáp trước) = "phá giáp chồng phá giáp" của bảng 2.7: nhận ×1,15 nữa từ mọi
  nguồn (tổng ≈ ×1,32). "Đang bị phá giáp" xét TRƯỚC nhát Phá Giáp.
- **Xoáy Nước** chọn "tung được mọi lúc nhưng mạnh hơn sau khi đỡ" (cửa sổ `COUNTER.after` = 2,5s, mở bởi chặn/đỡ/né đúng lúc/gạt
  đạn của Dòng Chảy Ngược và cả cú "Gạt" giảm sát thương của thế đỡ). Kiểu `spin` cũ (không kỹ năng nào dùng) viết lại.
- **Cơ chế mới**: `skillRules` thêm `COUNTER` + `perfectTiming` (đúng lúc), `pressBonus`, `lowHp`, `SUNDER_TAKEN`. `CombatSystem.incoming`
  xếp lại thứ tự: né đúng lúc → i-frame → thế đỡ → Bóng Mờ → mất máu; nhát phản dùng chung `counterStrike` + `onCounter` (Mặt Hồ
  Phẳng, cửa sổ Xoáy Nước). Khiên `Ward` thêm `element` + `sword` (Gương Băng là bản phép). Đạn thêm `reach` (bề ngang trúng), `crit`,
  `boomerang` (đi–về), `press` (đạn kiếm tính nhát); đạn người chơi nhớ cả hình nộm đã trúng — **đạn xuyên (Phong Nhận…) nay đi xuyên
  hình nộm** thay vì tan ở đó. `sweep` trả số mục tiêu trúng.
- **TEMP_ART** thêm 13 hàng: 6 kỹ năng + `whirlpool_surge` (Xoáy Nước sau khi đỡ) + 6 hình bị động (`press_max`, `rage_aura`, `riposte`,
  `lake_heal`, `momentum`, `blur_evade`). Lớp `shot` có thêm `spin` (Phi Kiếm = lốc `wind_spin` nhuộm bạc xoay tít); Lưỡi Sóng = vệt chém
  `slash` ×2 bay theo hướng. Icon chỉ số "Né hoàn toàn" mượn frame `shadow_5` (`SkillIcon.ICON_FRAME.evade`). Pipeline chưa có id
  PixelLab nào cho Kiếm → `final: null`, cột `todo` ghi động tác cần vẽ (bổ kiếm nặng, gạt kiếm, xoay một vòng, chuỗi 4 nhát, phóng /
  bắt kiếm, tàn ảnh).
- **Bản lưu**: không đổi định dạng. `cleanTalents` kẹp theo `tierCap` nên bản lưu GĐ2 (Kiếm ≤ mốc 5) nạp nguyên vẹn (mốc, lưu phái,
  thanh 10 ô) và cộng tiếp được mốc 6–9; số mốc vượt trần kẹp ở 9; Kiếm ≥ 3 thiếu lưu phái vẫn → Kiếm Thần như luật GĐ1.
- Đã xem trong game (localhost:3100, nhân vật thử, `__aether.tryTiers({ sword: 9 }, …)`): Dòng Chảy Ngược gạt đạn cung xương về
  giết chúng, Xoáy Nước sau khi gạt đánh ×1,8, Mặt Hồ Phẳng hồi máu, Lưỡi Sóng (vệt chém trắng lớn bay) giết cung xương một đòn,
  Phi Kiếm trúng lượt đi rồi lượt về, Liên Hoàn 4 nhát; bảng Tiềm năng hiện nấc 3–9 sáng, nấc 10 viền đứt.
- Test: `tests/swordtiers69.test.ts` (mới — luật thuần, dữ liệu / mô tả, 6 kỹ năng chạy thật, 6 bị động, cửa sổ né / đỡ đúng lúc,
  Bóng Mờ đo tỉ lệ bằng chuỗi ngẫu nhiên có hạt giống, Phi Kiếm đi–về không trúng lặp, Thế Áp Đảo cộng dồn / về 0) + cập nhật trần ở
  `talents.test.ts` (kèm bản lưu GĐ2 nạp được + cộng tiếp mốc 6–9), `elements.test.ts`, `tiers69.test.ts`.
- **Còn treo**: hiệu ứng phủ phép theo mốc 10 nguyên tố (bảng 2.3 — mốc 7 đã làm 08/10/2026); tuyệt kỹ mốc 10 (GĐ4); art PixelLab cho mọi
  hàng `TEMP_ART`.

### GĐ3 — sửa sau review (08/10/2026)

Review GĐ3 (lượt A + B) xác nhận 16 lỗi (gộp trùng); đã sửa hết, số liệu bảng trên đã cập nhật. Test: `tiers69.test.ts`,
`swordtiers69.test.ts` thêm ca cho từng lỗi (mỗi ca đều fail với code cũ).

| Lỗi | Sửa |
|---|---|
| Quái đuổi người chơi đứng sau GIỮA tường trượt về chỗ đối diện rồi đứng im suốt 7s (Tường Đá) / 5s (Tường Lửa): không đánh được, đạn bị chặn, còn người chơi chém / bắn xuyên tường — "miễn nhiễm" 58–65% thời gian | Đường vòng: tường chắn đường thẳng (`wallBlocks`) → chọn đầu tường ngắn hơn (`detourSide`, nhớ trên `Fighter.route` tới khi hết bị chắn), đi tới góc phía mình rồi góc phía người chơi (`detourWaypoint`); vướng tường bản đồ 0,6s thì đổi đầu. Tường chắn thì không lấy đà đánh (kể cả quái đánh xa đã đủ tầm — đi vòng chứ không bắn vào tường). Quái đi lang thang qua `wanderMover`. Đo: 4 chỗ xuất phát của review đều sang được phía người chơi trong < 6s, không lần nào cắt đường tâm tường |
| Gọi Mưa + Băng Địa: boss đóng băng liên tục ~4,3s (mưa ướt lại mỗi 0,5s, nhịp Băng đặt lại 0,8s băng) | Boss **kháng băng** (`skillRules.canFreeze`, `BOSS_FREEZE_IMMUNE` = 3s): đang băng thì không gia hạn, tan (hết giờ / Tan Chảy / Vỡ Vụn của Thổ) thì miễn 3s. Đo: 0,8s / 4,5s; quái thường cùng chỗ vẫn bị khoá > 3,5s |
| Vỡ Vụn + Gọi Mưa: vụn băng đóng băng lẫn nhau mãi (một Băng Tiễn khoá bầy 4 con trung bình 4,8–6,6s / 12s) | `PASSIVE.shardChain` = 1: băng do vụn gây mang đợt (`Fighter.iceDepth`), vụn đợt 2 chỉ làm lạnh. Đo: mỗi con đúng một lần 2,4s, 4 lần "Đóng Băng!" |
| Tro Tàn / Vỡ Vụn không nổ khi chính nhát kết liễu xoá lửa / băng (Thổ đập vỡ băng, Hơi Nước…) | `hit` chụp trạng thái (cháy / đóng băng) TRƯỚC phản ứng, `kill` dùng bản chụp |
| Tro Tàn: trần 4 đợt không giữ khi quái chết vì nhịp cháy ở frame sau (độ sâu đếm lại từ 1 → cháy lan hết hàng) | Độ sâu đi theo LỬA trên quái (`Fighter.emberDepth`). Đo (cấp 21, 10 quái cách 70px): 5 chết, 4 vụ nổ |
| Phá Giáp + kiếm phủ Thổ: phá giáp 4s thay 6s (`mergeFx` để phủ phép đè) | `mergeFx` lấy số lớn hơn ở trường trùng |
| Phá Giáp không tự vỡ giáp (hồi 7 ÷ 1,1 = 6,36s > phá giáp 6s) | Hồi 6s (= 5,45s) |
| Hút máu tính cả phần sát thương thừa (quái 5 máu, đòn 600 → hồi 72) | Hút trên `min(sát thương, máu trước đòn)` |
| Nhẹ Như Gió × Mắt Bão nhân chồng (8,75 thể lực / cú né, i-frame phủ ~79%) | Lấy mức rẻ hơn: 12,5 |
| Thủy Thần 9 + Phong 7 bấm né liên tục (không canh nhịp) gần như bất tử nhờ Phản Đòn + Mặt Hồ | Cửa sổ né / đỡ đúng lúc 0,3 → **0,12s**; Mặt Hồ hồi nội 1s. Đo lại (mô phỏng của review, 40s giữa 6 quái): nhát phản "đúng lúc" 35–48 → 13–20; Thủy Thần 9 không Phong: 1/5 → 2/5 lượt gục, máu thấp nhất của lượt sống 60–203 → 40–126 |
| Lôi Vũ dùng một mình lên bầy khô: 6 nhịp vào MỘT con | Chọn mục tiêu: ít bị đánh trước → ướt trước → gần tâm (bảng trên) |
| Đổi map: tường / mây / lốc còn hiện ở toạ độ cũ trên map mới | `Vfx.clear()` trong `CombatSystem.clearWorld()` (khiên phản đạn tắt cùng) |
| Mở bảng P / thoại giữa trận: hình tường / mây / khiên chạy hết giờ trong khi logic đứng → tường tàng hình | `Vfx.update(dt, holdTimed)`: trận đứng thì hình có thời lượng đứng theo |
| Có Núi Thiêng thì vào game không đầy máu (171/197) — cả con đường Kiếm cũng thiếu (171/194) | `CombatSystem.refill()`, `Game.boot` gọi sau `setPath` + `syncTalents`. Cộng mốc giữa trận vẫn không hồi đầy |
| Khối đá Tường Đá vẽ đè lên quái đứng TRƯỚC tường; mây Gọi Mưa che quái nửa bắc vùng mưa | Lớp hình `world` (`Vfx.world` = container thực thể, xếp theo chân vật): khối đá + lửa tường xếp chiều sâu chung với nhân vật. Mây treo 165 (đáy phần đục ≈ 120px trên tâm), alpha 0,75 |
| Khi PixelLab có `meteor` / `ice_rain` (clip tự có cảnh vật rơi): vật rơi hiện hai lần, nổ trễ sau sát thương | `TempArt.finalImpact` (frame va chạm — ước lượng theo prompt, duyệt bản vẽ thì chỉnh): có bản PixelLab thì bỏ vật rơi tạm, phát clip sớm cho frame va chạm trùng lúc nổ |

**Còn để chủ dự án quyết** (không thuộc lỗi đã xác nhận, ghi lại kèm số đo): bấm né liên tục với Mắt Bão (12,5 thể lực, ~0,56s
một cú) tự nó đã gần như miễn đòn cận chiến khi nhảy qua lại giữa bầy — mô phỏng của review sau khi sửa: Kiếm 6 (không có bị động
Thủy Thần) + Phong 7 giữa 6 quái 40s chỉ trúng 1–2 đòn, y như Thủy Thần 9 + Phong 7. Nguyên nhân là thể lực hồi ngay sau cú lăn (32/s,
không có trễ). Muốn chặn thì thêm trễ hồi thể lực sau khi né (vd 0,4s) — đụng tới cảm giác né của MỌI build nên chưa làm.

### Phủ phép theo mốc nguyên tố — ĐÃ LÀM (08/10/2026): cột mốc 5 + mốc 7 của bảng 2.3

Trước lượt này kiếm phủ phép chỉ MANG HỆ (cháy, ướt, lạnh như phép) + phần riêng của Thổ; cột "mốc 5" của Thuỷ/Phong/Băng chưa
có. Nay đủ cột mốc 5 và mốc 7 (`talents.ENCHANT_UP_TIER = 7`); số ở `skillRules.ENCHANT_FX` / `EARTH_ENCHANT`, logic ở
`CombatSystem.swingFx` (gọi một lần mỗi nhát vung, bộ đếm nhát chung cho mọi hệ):

| Phủ | Mốc 5 | Mốc 7 |
|---|---|---|
| Hoả | gây cháy (hệ) | nhát thứ 3 liên tiếp nổ nhỏ r 56 quanh mục tiêu ĐẦU TIÊN trúng nhát đó, ×0,6 sát thương nhát (một vụ nổ mỗi nhát dù trúng nhiều quái) |
| Thuỷ | làm ướt + hút 3% sát thương thật (cộng Huyết Thuỷ) | hút 6% |
| Phong | tầm chém kỹ năng ×1,25 (Trảm 74 → 92,5; cả Xoáy Nước), đẩy lùi 14px | mỗi nhát cận chiến (cả từng nhát Liên Hoàn) bắn một lưỡi gió ×0,5, bay 210px, không xuyên |
| Băng | làm chậm; trúng 3 nhát liên tiếp (cách nhau ≤ 3s) → đóng băng 1s (× Hàn Tâm; boss theo luật đóng băng) | 2 nhát |
| Thổ | phá giáp 4s, nhát 3 choáng 0,5s (như GĐ2) | choáng 0,9s |

- Giao diện: mỗi lựa chọn phủ phép hiện mô tả theo mốc hiện tại (`talents.enchantDesc`); nấc mốc 7 của nguyên tố (khi kiếm đang
  phủ được hệ đó) báo "Mở luôn phủ phép … mạnh hơn: …".
- **Hình TẠM** (thay khi PixelLab vẽ — danh sách NẶNG ở `docs/pixellab-ke-hoach-ve.md`): vụ nổ Hoả mượn `ember_burst` (Tro Tàn),
  lưỡi gió dùng đạn hệ Phong chung.
- Mốc 10 (vệt lửa, sóng nước, xuyên mục tiêu, vỡ băng, sóng chấn) — GĐ4 cùng tuyệt kỹ.
- Test: `tests/enchant.test.ts` (mới).

### Mốc 1 nguyên tố học bằng điểm — ĐÃ LÀM (10/10/2026)

Chủ dự án: "sẽ không được free skill nguyên tố đầu tiên đâu, phải dùng điểm để học"; gỡ kẹt cốt truyện: "Bài tập phép lúc nhỏ chấp
nhận Tia Aether (phép cơ bản) thay vì đúng chiêu đó; chiêu nguyên tố để người chơi tự học khi có điểm. Truyện vẫn kể như cũ."

- **Luật** (`packages/sim/src/talents.ts`): `TIER_COST[1]` = 1; `FREE_FIRST_TIER` = Kiếm (Trảm = đòn J, nhận kiếm gỗ là chém
  được); `baseTier(b)` = mốc lúc vừa mở (Kiếm 1, nguyên tố 0); `tierCost(b, t)`, `pointsToTier(t, b)` theo nhánh. "Nhánh đã mở, mốc
  0" khác "nhánh chưa mở" ở mã cốt truyện (`branchOpen`), không ở số mốc → `nextTierCost(tiers, b, isUnlocked)` /
  `addTier(level, tiers, b, isUnlocked)` nhận thêm `isUnlocked`. `knowsSkill`: chỉ kỹ năng ở mốc ≤ `baseTier` (Trảm) cần mỗi mã cốt
  truyện; Hoả Cầu / Thuỷ Tiễn / Phong Nhận / Băng Tiễn / Đá Văng cần nhánh ≥ mốc 1.
- **Giao diện**: nhánh nguyên tố mở mà chưa học hiện `mốc 0/10`, nút mốc 1 "Học mốc 1 · 1 điểm" (cột chi tiết, "Học được ngay",
  chip giá trên cây, thước giá có mốc 1); thanh 10 ô chỉ nhận kỹ năng đã học (học xong mới tự lên ô nhà); mở nhánh báo "Mở nhánh
  Hoả — học Hoả Cầu ở bảng Tiềm năng (P), 1 điểm"; tẩy điểm: Kiếm về mốc 1, nguyên tố về chưa học. Phản ứng song hệ ở bảng chỉ liệt
  kê khi cả hai hệ đã học.
- **Bản lưu** (`StoryDirector`, `talentsV` 2 → **3**): định dạng 3 lưu số mốc ĐÃ TRẢ ĐIỂM (Kiếm = mốc − 1, nguyên tố = mốc). Chuyển
  bản 2 (`migrateTalentsV2`): giữ NGUYÊN mọi mốc nếu điểm của cấp đủ trả thêm 1 điểm mốc 1 cho mỗi nhánh nguyên tố đã mở; thiếu thì
  `fitTiers` — nhánh sâu nhất giữ trước (bằng mốc: nhánh mở trước), mỗi nhánh giữ mốc cao nhất ≤ mốc cũ mà điểm còn lại trả nổi;
  nhánh chỉ có mốc 1 (chưa từng cộng điểm) mất trước, về mốc 0 (nhánh vẫn mở). Không bao giờ âm điểm, điểm lẻ để người chơi tự
  cộng. Nhánh vừa được bù mã ngay lần nạp đó (vd Thổ) tính từ mốc 0. Có trừ điểm / hạ mốc thì Game báo MỘT lần: banner "Luật
  tiềm năng mới" + thông báo chi tiết (`talentsMigrationText`, để 9 giây — banner một dòng cắt chữ dài; `toast` nhận thêm thời
  gian hiện). Trực tuyến: cấp dùng để chuyển là cấp máy chủ giữ (`onlineStoryStorage`). Bản lưu cũ có Thổ được bù lúc nạp: báo
  "Mở nhánh Thổ" + chỗ học thay cho "học Đá Văng (phím …)" (Đá Văng chưa học thì chưa lên thanh).
- **Cốt truyện**: bài luyện có hệ nhận thêm Tia Aether khi chưa học đủ chiêu (`StoryDirector.aetherStandsIn`): bài một hệ (Mũ cũ →
  Hoả, Đá cho Ông Rơm → Thổ) = chưa học mốc 1 nhánh đó; bài phản ứng (Tuyết cho mẹ → Băng Giá) = chưa học mốc 1 của MỘT trong hai
  nhánh (Thuỷ / Phong) — bắn Tia Aether thay cả bài. Học đủ rồi thì phải làm đúng bài. Ô nhiệm vụ đổi chữ theo mốc
  (`QuestDef.objectiveTextAether`, `StoryDirector.objectiveLine`): chưa học → "Tung Tia Aether vào Ông Rơm…", học rồi → chữ gốc
  "Tung Hoả Cầu…" (Game dựng lại ô nhiệm vụ mỗi lần `syncTalents`); lời dẫn ghi "học … ở bảng Tiềm năng (P) khi có điểm — chưa học
  thì tung Tia Aether (K)" (sửa ở `docs/story-childhood.design.json` rồi sinh lại `childhood.ts` — `buildChildhood.py` đọc thêm
  `objectiveTextAether`; `youth.ts` sửa tay); thoại / độc thoại giữ nguyên. Không quái / vật nào chỉ phá được bằng nguyên tố (vùng
  1 không đặt `resist`, `elementMult` kẹp ≥ 0,25).
- Máy chủ không đổi: không kiểm chiêu người chơi đã học (`actions.cleanCast` chỉ kiểm mã chiêu có thật).
- Test: `talents.test.ts` (giá mốc theo nhánh, `fitTiers`, học mốc 1, chuyển bản lưu 2 → 3: mới mở Hoả / Hoả 5 + Thuỷ 1 / đã tiêu
  hết điểm / giữ lưu phái / nạp lại không chuyển lặp), `story.test.ts` (đi hết truyện với 0 điểm, Tia Aether thay đúng 3 bài,
  học rồi phải làm đúng bài, bỏ điểm sai nhánh vẫn qua), `talentsView.test.ts`, `talentTree.test.ts` (nhánh mở ở mốc 0); test
  chiến đấu dựng CombatSystem với mốc 1 mọi nhánh (chưa nhận mốc nào chỉ còn Trảm + Tia Aether).
- **Ảnh hưởng cân bằng**: đường tối thiểu tới Quỷ vương (cấp 4 = 3 điểm) nay chỉ đủ Hoả mốc 2 (Hoả Cầu + Mồi Lửa) dư 1 điểm,
  không còn Hoả mốc 3 (Vòng Lửa) như trước; người chơi 0 điểm vẫn có Trảm + Tia Aether. `boss.test` chỉ cân chỉ số nên vẫn qua —
  cần chơi thử lại trận Quỷ vương với Pháp sư cấp 4.

### GĐ4 tuyệt kỹ mốc 10 — CHỈ Ở PHÒNG TẬP (10/10/2026)

Chủ dự án: "mở skill 10 ở phòng tập thôi". Game thật vẫn dừng ở mốc 9 (nút mốc 10 gắn kỹ năng nhưng `ready: false` → `tierCap` = 9,
bảng Tiềm năng vẫn "Sắp có"); trang Thử chiêu `/thu-chieu` đặt thẳng mốc 10 (`skillLabBuild.labTiers`). Điều kiện mở ở game thật
(cấp 40 + Long Châu, mục 2.1) chưa làm.

- **8 tuyệt kỹ** (`packages/sim/src/skills.ts`, chỉ số 44–51, cờ `ult`): Phượng Hoàng (đạn xuyên khổng lồ 900px, hình
  `ult_phoenix` lật dọc khi bay sang trái — `ArtLayer.upright`), Đại Hồng Thuỷ (`CombatSystem.flood`: 6 nhịp nón dài dần, mỗi quái
  trúng một lần, đẩy 160, sóng thần `ult_tsunami` ×2), Thiên Phong (vùng bám người 6s, hút + chém, `ult_tempest`), Kỷ Băng Hà (vùng
  quanh mình bán kính 240, đóng băng 3s, `ult_ice_age`) — *bản gốc 10/10/2026; 11/10/2026 đổi sang đánh vào mục tiêu, xem mục
  "Tuyệt kỹ đánh vào mục tiêu" ngay dưới*, Sơn Thần (kiểu mới `summon`: người khổng lồ đá 10s tự đi tới mục tiêu gần
  nhất, dậm choáng theo nhịp — MƯỢN hình Gargoyle Đá nhuộm màu đất), Phán Quyết (mưa 28 kiếm sáng, `ult_judgment` giữa vùng), Thiên
  Tĩnh (thế đỡ mới `still` — `skillRules.guardOutcome`: hoá giải + phản MỌI đòn kể cả đạn / đòn vùng 5s, nhát phản cộng đúng sát
  thương vừa hoá giải, `ult_still_lake`), Ngàn Bóng (`summon`: 3 bản sao nhân vật nhuộm tím, mỗi nhịp lướt ra sau lưng một mục
  tiêu quanh người chơi rồi chém, 6s). Hồi chiêu 40–50s, MP 45–60 (phòng tập có công tắc "Bỏ hồi chiêu").
- **Tuyệt kỹ đánh vào mục tiêu** (11/10/2026 — chủ dự án: "các skill quanh bản thân chỉ nên là các skill trước, vì săn boss mà
  chiêu cuối và gần cuối cần vào dame mục tiêu"). Mốc 8 và mốc 10 không còn chiêu nào đánh quanh mình; chiêu quanh mình (Vòng Lửa,
  Xoáy Kiếm…) chỉ còn ở mốc thấp. Nhắm theo mục tiêu đang chọn (tự chọn con gần nhất), không ai thì trước mặt ở `aimDist`.

  | Chiêu | Trước | Sau |
  |---|---|---|
  | Thiên Phong (Phong 10) | `zone` bám người, bán kính 170 | `zone` tại chỗ nhắm (tầm 380), bán kính 190; 3 cột lốc quay quanh TÂM BÃO; mỗi nhịp lưỡi gió loé trong bão |
  | Kỷ Băng Hà (Băng 10) | `aoe_self` bán kính 240, ×3,2 | `aoe_target` rơi xuống chỗ nhắm sau 0,7s (tầm 400, như Thiên Thạch: mũi băng lớn rơi + vòng báo), bán kính 210, ×4,4, đóng băng 3s |
  | Thiên Tĩnh (Thủy Thần 10) | thế đỡ `still` 5s, phản mọi đòn | `aoe_target` tại chỗ nhắm (tầm 360) sau 0,45s: mặt hồ `ult_still_lake` hiện ở đó rồi một nhát chém ×4,8, choáng 1,5s, bán kính 170 |
  | Ngàn Bóng (Bắc Thần 10) | 3 bóng quanh mình (aimDist 60) | 3 bóng tại chỗ nhắm (tầm 360, aimDist 200), bán kính 90; mỗi nhịp vệt chém tím ở điểm ngẫu nhiên trong vùng |
  | Xoáy Nước (Thủy Thần 8) | `spin` quanh mình | `spin` + `range: 300`: xoáy cuộn tại chỗ nhắm, giữ nguyên `afterGuard` ×1,8 |

  Phượng Hoàng, Đại Hồng Thuỷ, Sơn Thần, Phán Quyết và các chiêu mốc 8 khác vốn đã nhắm vào địch — giữ nguyên.
  **Kế hoạch tiếp (11/10/2026)**: đổi hẳn 4 tuyệt kỹ Hoả / Thổ / Thuỷ / Phong sang Hoả Ngục, Địa Long Toản, Thiên Lôi Đại Vũ, Chân
  Không Bạo — chuẩn "mạnh như Kỷ Băng Hà" (một mục tiêu ≈ ×4,5–5 + một khống chế, một cú nổ chính 192 px × 10–12 khung). Luật, số
  liệu, hình cần vẽ (~106 lượt): `docs/pixellab-ke-hoach-ve.md` mục "Đổi 4 tuyệt kỹ mốc 10".
  Phái Kiếm (cùng ngày — "các chiêu của phái kiếm nên thuần vật lý và cũng có sát thương kết liễu mạnh"): đổi cả 3 tuyệt kỹ Kiếm
  sang đòn thép thuần (Đoạn Thiên Trảm, Bạt Kiếm Thiên Tĩnh, Vô Ảnh Liên Trảm) — mục "Đổi 3 tuyệt kỹ Kiếm" (~40 lượt).
  **Luật chung mọi nhánh** ("không nguyên tố hay kiếm thì cũng để kết liễu boss, tranh nhau kết liễu mới gọi là săn boss"; "phải có
  thời gian niệm"): tuyệt kỹ là đòn KẾT LIỄU — mục tiêu dưới 30% máu lúc đòn chạm: mốc 8 ×1,5, mốc 10 ×2 (quái thường dưới 15% chết
  luôn); niệm 3s mọi tuyệt kỹ (phép lẫn Kiếm — "niệm là 3s"), sát thương là MỘT đòn tổng lúc chạm (không nhịp / không vùng
  tồn tại — "một dame tổng chứ không phải dame theo thời gian"), cả map thấy thanh niệm, né / bị khống chế thì mất niệm; boss: người ra đòn cuối
  ĂN HẾT (EXP, xu, tính hạ boss cho cổng vùng, rơi đồ), người đánh hộ không được gì ("kết liễu là được hết, còn lại không được gì"). Chi tiết: mục "Tuyệt kỹ = đòn KẾT LIỄU boss" ở `docs/pixellab-ke-hoach-ve.md`. Thế đỡ `still`
  vẫn còn trong `skillRules.guardOutcome` (test giữ) nhưng không chiêu nào dùng. Kiểm bằng phòng Thử chiêu Unity
  (`-aetherLab [-aetherLabStyle thuy_than|bac_than]`): đứng cách quái 260px, cả 6 tuyệt kỹ + Xoáy Nước đều trúng và hạ mục tiêu.
- **Hình**: 7 hình `ult_*` (vẽ 09/10/2026) đóng ở atlas RIÊNG `assets/vfx/vfx-ult.{png,json}` (`buildVfx.ts` cờ `atlas: 'ult'`,
  1987×953, 1,6 MB) — chỉ phòng tập tải (`Vfx.load({ extra })`), atlas chính không đổi một byte. Icon: bộ v2 khoá `future:<nhánh>:10`.
  Vật triệu hồi: hook `CombatHooks.spawnSummon` / `despawnSummon` (phòng tập dựng actor; game thật chưa nối).
- **Chưa có**: hình Sơn Thần riêng (người khổng lồ đá đứng / đi / dậm đất — vẽ lại bằng v3), người chơi khác thấy tuyệt kỹ (lọc khỏi
  `remoteCast` — phòng tập không có mạng), điều kiện mở ở game thật.
- Test: `skilllab.test.ts` (mốc 10 chỉ ở phòng tập, mỗi nhánh / lưu phái một tuyệt kỹ, Thiên Tĩnh phản mọi đòn), các test cũ khoá
  danh sách cây / chỉ số đã nới cho tuyệt kỹ.

## 8. Đã chốt (07/10/2026)

Chủ dự án giao quyết theo đề xuất, góp thêm: thanh kỹ năng **10 ô** và chỉ master được **1 nhánh**.

1. Giá mốc 1·2·2·3·3·4·4·5·5 (29 điểm/nhánh); **cấp tối đa 40 = 47 điểm** → 1 nhánh master + ~62% nhánh nữa. *(10/10/2026: mốc 1
   nguyên tố thêm 1 điểm — nguyên tố 30/nhánh, xem mục 7 "Mốc 1 nguyên tố học bằng điểm".)*
2. Mỗi nhánh 6 chủ động + 4 bị động.
3. Tia Aether là năng lực bẩm sinh, ngoài cây; Hồi Phục thành Thuỷ mốc 3 ("Suối Lành").
4. **10 ô gán tự do** (J, K, 1–8); Space né, R bình máu riêng.
5. Phủ phép: cần nguyên tố ≥ **mốc 5** (tối đa phủ được 2 nguyên tố trong một build), một nguyên tố mỗi lúc, đổi có hồi 10 giây.
8. **Bị động mốc 2 chỉ tăng chính nguyên tố đó** (rải 1 điểm để "nhặt" bị động chẳng được gì cho build khác); bị động chung (tốc chạy, phòng thủ, hồi chiêu, MP) nằm từ **mốc 4** (5 điểm) trở lên.
6. Bỏ phạt tạp nham −15%; rải điểm tự yếu vì không có mốc cao.
7. Thổ mở bằng một nhiệm vụ tuổi 16 ở Nghĩa địa.
9. **Bảng skill mục 3 đã duyệt**; tuyệt kỹ Kiếm "Vạn Kiếm Quy Tông" (nghe kiếm hiệp) → **Phán Quyết**; Bộ Pháp → Nhịp Chém, Kiếm Tâm → Mắt Tinh, Kiếm Khí → Lưỡi Sóng.
10. **Kiếm 3 lưu phái** Kiếm Thần / Thủy Thần / Bắc Thần, chọn ở mốc 3 (mục 2.7).

## 9. Một nguyên tố, lớp chọn vũ khí, điểm thuộc tính — ĐANG LÀM (11/10/2026)

Chủ dự án 11/10/2026:

- "chỉ cho chọn 1 phép nguyên tố thôi — lúc cộng tiềm năng sẽ được chọn"
- "Kiếm thì học skill tuỳ, không cần chọn phái — tự do build"
- "bọc nguyên tố vào kiếm là skill kích hoạt có thời gian"
- "chọn Kiếm sĩ hay Pháp sư thì chỉ còn lại 1 là kiếm, 2 là trượng"
- "cây tiềm năng chỉ còn lại 1 cột và cộng HP, MP, dame, phép, đỡ đòn…"

**Luật (code `packages/sim/src/talents.ts` + `attributes.ts`):**

1. **Một nguyên tố mỗi nhân vật.**
   - Khoá ở điểm đầu tiên cộng vào nhánh nguyên tố (`chosenElement`); 4 nhánh còn lại khoá.
   - Đổi nguyên tố = tẩy điểm bằng **kim cương** (`resetDiamonds`: miễn phí tới cấp 5, sau đó 40 kim cương).
   - Phản ứng nguyên tố thành lối đánh **NHÓM**: hai người khác hệ đánh cùng một con. Bỏ các nhiệm vụ bắt một người tự gây phản ứng.
2. **Ba lưu phái Kiếm là ba nhánh riêng.**
   - Kiếm chỉ còn 2 mốc: Trảm và Nhịp Chém.
   - Kiếm Thần / Thủy Thần / Bắc Thần mỗi phái 8 mốc. Mốc phái t ứng với mốc Kiếm cũ t + 2: cùng giá, cùng thưởng chiều sâu.
   - Cần Kiếm mốc 2 mới vào phái; cộng tự do vào phái nào cũng được.
   - Bản lưu cũ chuyển bằng `migrateBought`: Kiếm cũ mốc n cùng `swordStyle` thành Kiếm 2 + phái n − 2, giữ nguyên số điểm.
3. **Bọc Nguyên Tố là kỹ năng kích hoạt (`imbue`).**
   - Cần Kiếm 2 + nguyên tố đã chọn ≥ mốc 3.
   - Thời gian bọc: 10 giây + 1 giây mỗi mốc nguyên tố, tối đa 20 giây.
   - Kiếm pháp nguyên tố cần nguyên tố ≥ 5 + một phái ≥ 3, và chỉ ra đòn được khi đang bọc.
4. **Lớp chọn vũ khí** (`pathAllowsBranch` / `pathAllowsSkill`).
   - **Kiếm sĩ**: chỉ đòn kiếm (Trảm, phái, kiếm pháp, Bọc Nguyên Tố). Nguyên tố chỉ để bọc kiếm, không tung phép. Space lướt né.
   - **Pháp sư**: chỉ trượng (Tia Aether + phép của nguyên tố đã chọn). Không có Kiếm / phái, không lướt né.
   - Tuổi thơ (chưa chọn lớp) học được cả hai.
5. **Bảng Tiềm năng còn MỘT cột nguyên tố** (cột đã chọn; trước khi chọn thì hiện 5 cột để chọn).
   - Kiếm sĩ có thêm cột Kiếm + 3 phái.
   - Bên cạnh là **điểm thuộc tính**: 3 điểm mỗi cấp, không dừng ở cấp 40. Mỗi thuộc tính tăng MỘT chỉ số:

     | Thuộc tính | Chỉ số tăng |
     |---|---|
     | Sinh lực | máu |
     | Linh lực | MP |
     | Sức mạnh | sát thương kiếm |
     | Trí tuệ | sát thương phép |
     | Đỡ đòn | phòng thủ |
     | Thể lực | thể lực |

   - Dồn hết vào một thuộc tính thì chỉ số đó tăng theo cấp cỡ gấp đôi gốc.

**Ghi chú phát triển sau (chưa làm):**

- **Ba nguyên tố mới**: **Mộc**, **Bóng tối** (Ám ma pháp), **Ánh sáng**. Mỗi hệ là một nhánh 10 mốc như 5 hệ hiện có.
  - Thêm vào `ELEMENTS` / `Branch`. Mã lưu chỉ được THÊM.
  - Thêm phản ứng với các hệ cũ (`REACTION_PAIR`) — vẫn là lối đánh nhóm.
  - Mỗi hệ một nhiệm vụ / nơi mở như Thổ.
  - Kéo theo **ít nhất 2–3 map / vùng mới**: Rừng cổ thụ cho Mộc, Thánh địa ánh sáng, Vực bóng tối. Ghi ở `docs/ke-hoach-the-gioi.md` mục 5.7.
- **Mỗi nguyên tố có HAI cây: Sát thương + Hỗ trợ** — GHI CHÚ 14/10/2026, chưa làm (chủ dự án: "khi chọn 1 nguyên tố sẽ có 2 cây skill
  1 bên là buff (mỗi nguyên tố 1 cây) cho người dùng theo pháp sư có thể chọn theo hướng buff hoặc sát thương hoặc nửa này nửa kia. thay vì
  phải thêm 1 class healer").
  - Chọn một nguyên tố là mở cả hai cây của hệ đó: **cây Sát thương** (nhánh 10 mốc hiện có) và **cây Hỗ trợ** mới (hồi máu, khiên,
    tăng sức đánh / tốc chạy / kháng cho mình và đồng đội, giải hiệu ứng xấu) — mỗi nguyên tố một cây Hỗ trợ RIÊNG mang chất của hệ
    (VD Thuỷ hồi máu + giải độc, Hoả tăng sát thương, Phong tăng tốc / né, Băng khiên + làm chậm kẻ đánh mình, Thổ khiên đá + giảm sát thương).
  - Điểm tiềm năng dùng chung hai cây: dồn hết một bên (thuần sát thương / thuần hỗ trợ) hoặc chia nửa này nửa kia. Đủ điểm cho cả hai
    lên mốc cao là không được — phải chọn hướng.
  - Áp cho Pháp sư trước (lớp đi theo nguyên tố). Kiếm sĩ dùng phủ phép như cũ — cân nhắc sau.
  - Việc kéo theo: `packages/sim/src/talents` thêm nhánh Hỗ trợ cho mỗi hệ (mã lưu chỉ được THÊM); chiêu nhắm đồng đội (chọn mục
    tiêu là người chơi, vùng ảnh hưởng quanh mình); máy chủ kiểm hiệu ứng lên người khác trong PvE nhóm / PvP; bảng Tiềm năng hiện hai
    cây cạnh nhau; hiệu ứng chiêu hỗ trợ (PixelLab — phiếu duyệt trước).
  - **Thay cho lớp Healer** — bỏ hẳn kế hoạch thêm lớp Healer (mục dưới).
- **Lớp mới** (Cung, Khiên đỡ đòn): mỗi lớp là một `PathId` mới. ~~Healer~~ — bỏ 14/10/2026, thay bằng cây Hỗ trợ của nguyên tố (mục trên).
  - Có nhánh vũ khí riêng.
  - Có MỘT nguyên tố đi kèm, kích hoạt có thời gian, giống Bọc Nguyên Tố.
  - Thêm thuộc tính riêng nếu cần (VD Khéo léo cho cung). Mỗi thuộc tính vẫn chỉ tăng một chỉ số.
- **Điểm tiềm năng dư — ĐÃ CHỐT 11/10/2026** (chủ dự án: "dư thì là cộng vào HP và MP, thể lực, phòng thủ").
  - Pháp sư chỉ có một nhánh nguyên tố (trần mốc 9 = 25 điểm), nên cấp 40 dư ~22 điểm.
  - Khi KHÔNG còn nhánh nào cộng tiếp, nút "Đổi 1 điểm tiềm năng dư → 3 điểm" hiện ở cột Thuộc tính. Áp cho mọi lớp.
  - Điểm đổi ra chỉ vào Sinh lực / Linh lực / Đỡ đòn / Thể lực (`TALENT_ATTRS`). Sức mạnh / Trí tuệ chỉ lấy điểm theo cấp.
  - Số đã đổi lưu `story.attrTalent`. PvP máy chủ trừ khỏi điểm cây, cộng vào thuộc tính. Tẩy điểm xoá luôn.
  - Lưu ý: khi mốc 10 (tuyệt kỹ) mở ở game thật, điểm đã đổi không tự quay về — người chơi tẩy điểm nếu muốn lấy lại.

## 10. Thiên phú cấp 10 và thiết kế chiêu theo class — chốt 26/10/2026

**Trạng thái: đã ghi yêu cầu phát triển; chưa triển khai vào game.** Yêu cầu này cập nhật cách nhận nguyên tố ở mục 9. Mốc **cấp nhân vật 10** ở đây khác với **mốc 10 của cây kỹ năng**.

### 10.1 Luật nguyên tố đã chốt

Khi người dùng đạt **level 10**, thiên phú phát hiện **một nguyên tố ngẫu nhiên** trong danh sách sau:

| Nguyên tố | Xác suất mỗi lần phát hiện thiên phú |
|---|---|
| Bóng tối | 1/8 = 12,5% |
| Ánh sáng | 1/8 = 12,5% |
| Mộc | 1/8 = 12,5% |
| Thủy | 1/8 = 12,5% |
| Hỏa | 1/8 = 12,5% |
| Thổ | 1/8 = 12,5% |
| Phong | 1/8 = 12,5% |
| Băng | 1/8 = 12,5% |

- **Tổng cộng 8 nguyên tố; mỗi user chỉ có 1 nguyên tố.** Kiếm / Khiên / Thương / Cung / Pháp sư là class, không thêm vào danh sách random nguyên tố.
- Trước cấp 10, thiên phú nguyên tố **chưa được phát hiện**.
- Random có trọng số bằng nhau cho cả 8 hệ; mỗi user có xác suất như nhau. Đồng đều về xác suất không có nghĩa cưỡng ép số người thuộc từng hệ phải bằng nhau.
- Cách tự chọn hệ khi cộng điểm đầu tiên và các ghi chú nhiệm vụ mở thêm hệ trước đây cần thay theo cơ chế phát hiện thiên phú này. Tẩy điểm không được mặc nhiên coi là quyền tự chọn hoặc random lại nguyên tố; tính năng đổi hệ chưa được chốt trong yêu cầu mới.

### 10.2 Phạm vi thiết kế chiêu — làm rõ theo chủ dự án 26/10/2026

**Cấu trúc đã chốt:** mỗi bộ có **10 chiêu = 7 chủ động + 3 bị động**.

> **Chủ dự án đã xác nhận tổng đúng 140 chiêu:** 3 phái Kiếm ×10 + Khiên / Thương / Cung ×10 +8 hệ Pháp sư ×10 =140 (98 chủ động +42 bị động). Hiệu ứng / nội tại nguyên tố không tính thêm chiêu riêng. Xác nhận này chốt số lượng đã còn để đề xuất trong các ghi chú trước; tên, tác dụng và cách học / đổi phái vẫn chờ duyệt.

- **Bổ sung của chủ dự án:** Kiếm có3 phái **Thủy Thần / Kiếm Thần / Bắc Thần**, tham khảo *Thất Nghiệp Chuyển Sinh* để thiết kế và vẽ chiêu. Bản chữ và nguồn nguyên tác ở [phác thảo ba phái kiếm](phac-thao-ba-phai-kiem.md). Đề xuất mỗi phái10 chiêu (7 chủ động +3 bị động); cách học phái, chia chiêu chung / riêng và đổi phái chờ chốt.
- **Khiên / Thương / Cung:** mỗi class có một bộ10 chiêu riêng. **Kiếm:** thiết kế theo ba phái ở trên. Nguyên tố nhận ở cấp10 bổ sung hiệu ứng và nội tại tương ứng; không tạo8 bộ10 chiêu riêng cho từng class vũ khí.
- **Pháp sư:** bộ chiêu đi theo nguyên tố. Mỗi nguyên tố có 10 chiêu, gồm 7 chủ động và 3 bị động; 8 nguyên tố thành **80 chiêu thiết kế**. Mỗi pháp sư dùng bộ của nguyên tố duy nhất mình nhận được.
- **Cập nhật cách đếm sau khi bổ sung ba phái kiếm:** đề xuất3 phái ×10 +3 class vũ khí ×10 +8 nguyên tố Pháp sư ×10 = **140 chiêu**, gồm98 chủ động +42 bị động nếu mỗi phái đủ10. Tổng120 ở bản trước tính Kiếm chỉ một bộ, đã được thay bằng đề xuất phân bổ theo3 phái; cần chốt chiêu chung / riêng để khóa số lượng cuối. Đây là tổng danh mục, không phải số chiêu một user sở hữu. Hiệu ứng / nội tại nguyên tố là biến thể của bộ chiêu vũ khí, không cộng thêm một bộ10 phép Pháp sư cho mỗi user.
- Bản nháp80 chiêu nguyên tố đã trình bày trong chat chỉ dùng làm đề xuất cho **Pháp sư**; tên / tác dụng và quyết định giữ chiêu cũ vẫn chờ chủ dự án duyệt. Vị trí3 bị động là đề xuất. **Chiêu cuối số10 bắt buộc là chiêu dồn sát thương săn boss** theo chốt mới bên dưới; các mô tả tuyệt kỹ kéo dài trong bản nháp đã được thay bằng mục10.2.1.

| Class | Việc cần làm | Trạng thái |
|---|---|---|
| Kiếm | 3 phái Thủy Thần / Kiếm Thần / Bắc Thần; đề xuất10/phái (7 chủ động +3 bị động), nguyên tố bổ sung hiệu ứng / nội tại. | Đã phác thảo30 chiêu; chờ duyệt phân bổ và chiêu |
| Khiên | 10 chiêu riêng: 7 chủ động + 3 bị động; nguyên tố bổ sung hiệu ứng và nội tại. | Cần thiết kế |
| Thương | 10 chiêu riêng: 7 chủ động + 3 bị động; nguyên tố bổ sung hiệu ứng và nội tại. | Cần thiết kế |
| Cung | 10 chiêu riêng: 7 chủ động + 3 bị động; nguyên tố bổ sung hiệu ứng và nội tại. | Cần thiết kế |
| Pháp sư | 8 bộ theo nguyên tố ×10 chiêu =80 (mỗi bộ 7 chủ động +3 bị động). Chủ dự án thử lại chiêu cũ, thống kê giữ / sửa / bỏ. | **Chờ chủ dự án chơi thử; chưa chốt danh sách chiêu giữ lại** |

Danh sách chiêu pháp sư ở các mục cũ được giữ làm tài liệu để thử và đối chiếu. Không coi toàn bộ danh sách đó là đã được duyệt cho bộ chiêu mới. Các đề xuất cũ về hai cây Sát thương / Hỗ trợ cũng cần đối chiếu với kết quả thử trước khi chốt chiêu pháp sư.

### 10.2.1 Chiêu cuối luôn dồn sát thương săn boss — chủ dự án chốt 26/10/2026

- **Áp dụng toàn bộ:** ba phái Kiếm, Khiên, Thương, Cung và cả8 nguyên tố Pháp sư.
- **Chiêu số10 là chiêu dồn sát thương (burst):** sát thương chính tập trung trong một đòn quyết định hoặc một pha rất ngắn, phục vụ chớp thời cơ đánh boss. Có thể có lấy đà / tụ lực rồi ra đòn; thời gian tụ lực chưa chốt.
- Không thiết kế chiêu cuối có sát thương chính từ vùng lửa, bão, độc, triệu hồi đánh nhiều nhịp, niệm liên tục hoặc trạng thái cường hóa kéo dài. VFX dư âm có thể tồn tại sau va chạm nhưng không tạo chuỗi sát thương duy trì.
- Vẫn có thể đánh lan hoặc xuyên mục tiêu khi phù hợp class; sát thương lên boss phải tập trung vào pha kết thúc. Hiệu ứng cháy / độc từ nội tại nguyên tố không được thay thế phần burst chủ đạo.
- Yêu cầu này chưa tự chốt hồi chiêu, giá tài nguyên, tỷ lệ chí mạng, ngưỡng máu kết liễu hay công thức sát thương. Rà lại ghi chú cũ về đòn kết liễu mốc9 / tuyệt kỹ mốc10 để thống nhất cấu trúc mới.

**Bản sửa tuyệt kỹ để xem trước** — quy tắc burst đã chốt; tên và động tác cụ thể dưới đây là đề xuất:

| Class / hệ | Chiêu cuối đề xuất | Pha gây sát thương chính |
|---|---|---|
| Thủy Thần | Tĩnh Giới Phản Sát | Thu kiếm rồi bước vào chém trả một nhát cực mạnh; đề xuất đỡ chuẩn trước đó tăng uy lực nhưng không bắt buộc chờ boss đánh mới tung được. |
| Kiếm Thần | Tuyệt Kiếm Nhất Tuyến | Dồn lực toàn thân vào một đường chém nhanh, trúng là dồn sát thương ngay. |
| Bắc Thần | Bách Biến Đoạt Mệnh | Đòn giả và đổi góc mở đường cho một cú đâm / chém kết thúc; thay chuỗi Bách Biến Liên Sát kéo dài. |
| Khiên | Thiên Thuẫn Phá Quân | Dồn lực sau khiên rồi lao vào đập một cú cực mạnh; thay trạng thái thủ Bất Động Sơn kéo dài. |
| Thương | Nhất Thương Phá Quân | Tụ lực ở mũi thương, lao đâm xuyên rồi bùng lực tại điểm trúng trong cùng pha kết thúc. |
| Cung | Nhất Tiễn Xuyên Thiên | Kéo căng dây, thả một mũi tên cực mạnh; sát thương chính ở lần xuyên / va chạm, không mưa tên nhiều đợt. |
| Pháp sư — Bóng tối | Hắc Ám Đoạt Hồn | Nén bóng tối thành một đòn xuyên mục tiêu rồi kích nổ ngay; thay trạng thái hóa thân kéo dài. |
| Pháp sư — Ánh sáng | Thánh Quang Phán Quyết | Hội tụ ánh sáng rồi giáng một cột sáng dồn sát thương lớn; không lấy hồi máu / bảo hộ làm tác dụng chính. |
| Pháp sư — Mộc | Cổ Mộc Xuyên Tâm | Rễ cổ thụ dồn lại rồi đâm bùng một lần dưới mục tiêu; thay cổ thụ triệu hồi đánh / hồi phục nhiều nhịp. |
| Pháp sư — Thủy | Hải Long Phá | Nén nước thành rồng lao vào mục tiêu và nổ áp lực tức thời; không để lại vùng hồi phục / sát thương duy trì. |
| Pháp sư — Hỏa | Viêm Long Bạo Phá | Hỏa long hội tụ rồi va chạm nổ một đợt cực mạnh; bỏ biển lửa duy trì khỏi tuyệt kỹ. |
| Pháp sư — Thổ | Sơn Băng Nhất Kích | Khối đá khổng lồ giáng vào mục tiêu, sát thương dồn ở lần va chạm; không chia thành nhiều đợt chấn động. |
| Pháp sư — Phong | Thiên Phong Đoạn Không | Nén gió thành một lưỡi cắt lớn xuyên qua mục tiêu; thay bão gió gây sát thương nhiều nhịp. |
| Pháp sư — Băng | Băng Phách Toái Diệt | Tụ băng tại mục tiêu rồi phá vỡ đồng loạt trong một nhịp; thay bão tuyết duy trì. |

### 10.3 Công việc triển khai sau ghi chú

- [ ] Duyệt phác thảo ba phái kiếm và phân bổ chiêu chung / riêng. Đề xuất30 chiêu Kiếm +30 chiêu Khiên / Thương / Cung; mỗi bộ10 gồm3 bị động. Hoàn thiện điều kiện mở, tầm / vùng, chi phí, hồi chiêu, động tác và VFX; thông số chưa chốt.
- [ ] Thiết kế cách từng nguyên tố bổ sung hiệu ứng và nội tại cho bộ chiêu Kiếm / Khiên / Thương / Cung, giữ bản sắc động tác và vũ khí của class.
- [ ] Hoàn thiện 80 chiêu Pháp sư (10/nguyên tố, gồm 3 bị động) sau khi đối chiếu các chiêu cũ được chủ dự án giữ lại.
- [ ] Áp quy tắc burst vào mọi chiêu số10: sửa các tuyệt kỹ duy trì trong bản nháp, kiểm sát thương dồn lên boss đúng pha va chạm, đồng bộ động tác / VFX / hồi chiêu sau khi chốt thông số.
- [ ] Lập bảng kiểm chiêu pháp sư sau khi chủ dự án thử: chiêu hiện tại · nhận xét · giữ / sửa / bỏ. Chưa tự điền quyết định thay chủ dự án.
- [ ] Thêm Mộc / Bóng tối / Ánh sáng vào dữ liệu, đủ danh sách 8 hệ; rà UI thiên phú và cách học chiêu ở cả 5 class.
- [ ] Máy chủ quyết định kết quả thiên phú một lần ở cấp 10 và lưu bền vững; chặn gọi lại / đăng nhập lại / gửi yêu cầu trùng để nhận thêm hoặc đổi kết quả. Ràng buộc **mỗi user một hệ** phải được giữ ở dữ liệu tài khoản, không chỉ ở giao diện.
- [ ] Rà cốt truyện mở nhánh, luật tẩy điểm, bản lưu cũ và phòng thử chiêu để không vô tình cấp thêm hệ hoặc thay kết quả thiên phú. Phương án chuyển dữ liệu cũ cần được xác định trước khi áp dụng luật mới.

### Tiến độ ngày 26/10/2026

- Đã ghi đủ 8 hệ, xác suất 12,5% mỗi hệ, cấp phát hiện 10 và giới hạn một hệ mỗi user.
- Đã đưa 4 class Kiếm / Khiên / Thương / Cung vào danh sách cần thiết kế chiêu.
- Đã làm rõ10 chiêu/bộ, gồm7 chủ động +3 bị động; bổ sung Kiếm có3 phái theo chủ dự án. Đã phác thảo30 chiêu Kiếm và động tác tham khảo nguyên tác; đề xuất tổng140 nếu10/phái, chờ duyệt chiêu chung / riêng. Nguyên tố bổ sung hiệu ứng và nội tại cho class vũ khí.
- Đã ghi Pháp sư chờ chủ dự án thử lại rồi thống kê chiêu giữ lại. Chưa đổi gameplay hoặc dữ liệu người chơi trong đợt ghi chú này.
- Đã chốt chiêu cuối của mọi bộ là chiêu dồn sát thương săn boss; cập nhật ba phái Kiếm và bảng14 tuyệt kỹ đề xuất để xem trước, thay các ý tưởng gây sát thương duy trì.
